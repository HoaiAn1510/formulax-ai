import express from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import {
  PLAN_CONFIG,
  isValidPlan,
  computeExpiry,
  signHmacSHA256,
  buildCreateRawSignature,
  buildIpnRawSignature,
  generateOrderId,
} from "../lib/momo.js";

const router = express.Router();

function momoConfigured() {
  return Boolean(
    process.env.MOMO_PARTNER_CODE && process.env.MOMO_ACCESS_KEY &&
    process.env.MOMO_SECRET_KEY && process.env.MOMO_CREATE_ENDPOINT
  );
}

// POST /api/payment/momo/create — tạo đơn hàng, trả payUrl để frontend redirect sang MoMo
router.post("/create", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !isValidPlan(plan)) {
      return res.status(400).json({ error: "Thiếu userId hoặc plan không hợp lệ (monthly | 6months)" });
    }
    if (!momoConfigured()) {
      return res.status(500).json({ error: "MoMo chưa được cấu hình trong backend/.env" });
    }

    const { amount, label } = PLAN_CONFIG[plan];
    const orderId = generateOrderId();
    const requestId = orderId;
    const orderInfo = label;
    const requestType = "captureWallet";
    const redirectUrl = `${process.env.BACKEND_PUBLIC_URL}/api/payment/momo/return`;
    const ipnUrl = `${process.env.BACKEND_PUBLIC_URL}/api/payment/momo/ipn`;
    const extraData = Buffer.from(JSON.stringify({ userId, plan })).toString("base64");

    const rawSignature = buildCreateRawSignature({
      accessKey: process.env.MOMO_ACCESS_KEY,
      amount,
      extraData,
      ipnUrl,
      orderId,
      orderInfo,
      partnerCode: process.env.MOMO_PARTNER_CODE,
      redirectUrl,
      requestId,
      requestType,
    });
    const signature = signHmacSHA256(rawSignature, process.env.MOMO_SECRET_KEY);

    const momoBody = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      partnerName: "FormulaX AI",
      storeId: "FormulaXStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      orderExpireTime: 30, // phút — field tùy chọn, không nằm trong raw signature; mặc định MoMo cấp khá ngắn
      signature,
    };

    // Ghi log đơn hàng "pending" trước khi gọi MoMo — dùng để chống IPN xử lý trùng
    // và để IPN tra được userId/plan theo orderId mà không cần tin vào extraData.
    if (supabaseAdmin) {
      const { error: insertError } = await supabaseAdmin.from("payments").insert({
        order_id: orderId, request_id: requestId, google_id: userId, plan, amount, status: "pending",
      });
      if (insertError) console.error("[MoMo create] Ghi payments lỗi:", insertError.message);
    }

    const momoRes = await fetch(process.env.MOMO_CREATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(momoBody),
    });
    const momoData = await momoRes.json();

    // Log chi tiết phản hồi từ MoMo để debug (không commit logs có secrets lên public)
    try {
      console.log("[MoMo create] momoData:", JSON.stringify(momoData));
    } catch (e) {
      console.log("[MoMo create] momoData (stringify failed)");
    }

    if (momoData.resultCode !== 0) {
      console.error("[MoMo create] MoMo từ chối tạo đơn:", momoData.resultCode, momoData.message, momoData);
      return res.status(502).json({ error: momoData.message || "Không tạo được giao dịch MoMo", details: momoData });
    }

    res.json({ payUrl: momoData.payUrl, orderId, raw: momoData });
  } catch (err) {
    console.error("[MoMo create] error:", err.message);
    res.status(500).json({ error: "Lỗi tạo thanh toán MoMo" });
  }
});

// POST /api/payment/momo/ipn — MoMo gọi ngược về server-to-server khi thanh toán hoàn tất
router.post("/ipn", async (req, res) => {
  try {
    const {
      partnerCode, orderId, requestId, amount, orderInfo, orderType,
      transId, resultCode, message, payType, responseTime, extraData, signature,
    } = req.body;

    if (!momoConfigured()) {
      console.error("[MoMo IPN] MoMo chưa được cấu hình, bỏ qua IPN cho orderId:", orderId);
      return res.status(204).end();
    }

    const rawSignature = buildIpnRawSignature({
      accessKey: process.env.MOMO_ACCESS_KEY,
      amount, extraData, message, orderId, orderInfo, orderType,
      partnerCode, payType, requestId, responseTime, resultCode, transId,
    });
    const expectedSignature = signHmacSHA256(rawSignature, process.env.MOMO_SECRET_KEY);

    if (signature !== expectedSignature) {
      console.error("[MoMo IPN] Chữ ký không khớp — khả năng giả mạo. orderId:", orderId);
      return res.status(204).end();
    }

    if (!supabaseAdmin) {
      console.error("[MoMo IPN] Supabase chưa cấu hình service role key — không thể cập nhật is_premium cho orderId:", orderId);
      return res.status(204).end();
    }

    const { data: order } = await supabaseAdmin
      .from("payments")
      .select("status, google_id, plan")
      .eq("order_id", orderId)
      .single();

    // Idempotency: MoMo có thể gọi IPN nhiều lần cho cùng 1 đơn — chỉ xử lý 1 lần.
    if (!order || order.status === "success") {
      return res.status(204).end();
    }

    if (Number(resultCode) === 0) {
      const expiry = computeExpiry(order.plan);
      const { error: userError } = await supabaseAdmin.from("users").upsert(
        { google_id: order.google_id, is_premium: true, premium_expiry: expiry.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "google_id" }
      );
      if (userError) console.error("[MoMo IPN] Cập nhật users lỗi:", userError.message);

      await supabaseAdmin.from("payments").update({
        status: "success", momo_trans_id: String(transId), result_code: Number(resultCode), updated_at: new Date().toISOString(),
      }).eq("order_id", orderId);
    } else {
      await supabaseAdmin.from("payments").update({
        status: "failed", result_code: Number(resultCode), updated_at: new Date().toISOString(),
      }).eq("order_id", orderId);
    }

    res.status(204).end();
  } catch (err) {
    console.error("[MoMo IPN] error:", err.message);
    res.status(204).end();
  }
});

// GET /api/payment/momo/return — MoMo redirect trình duyệt người dùng về đây sau khi thanh toán
router.get("/return", (req, res) => {
  const { orderId, resultCode, message } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const status = Number(resultCode) === 0 ? "success" : "failed";
  const target = `${frontendUrl}/?payment=${status}&orderId=${encodeURIComponent(orderId || "")}&message=${encodeURIComponent(message || "")}`;
  res.redirect(302, target);
});

// DEV-ONLY: giả lập MoMo xác nhận thanh toán thành công — dùng khi không có app MoMo Test để quét QR.
// Bắt buộc DEV_SIMULATE_SECRET đúng trong .env, không cấu hình thì route luôn từ chối (fail closed).
// Nhắc: xoá route này trước khi có merchant Production thật, vì nó bỏ qua xác minh chữ ký MoMo.
router.post("/simulate-success", async (req, res) => {
  const devSecret = process.env.DEV_SIMULATE_SECRET;
  if (!devSecret) {
    return res.status(403).json({ error: "DEV_SIMULATE_SECRET chưa cấu hình trong .env — route giả lập bị khoá." });
  }
  const { orderId, secret } = req.body;
  if (secret !== devSecret) {
    return res.status(403).json({ error: "Sai khoá xác nhận." });
  }
  if (!orderId) {
    return res.status(400).json({ error: "Thiếu orderId" });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase chưa cấu hình service role key" });
  }

  try {
    const { data: order, error: findError } = await supabaseAdmin
      .from("payments")
      .select("status, google_id, plan")
      .eq("order_id", orderId)
      .single();

    if (findError || !order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng với orderId này" });
    }
    if (order.status === "success") {
      return res.json({ ok: true, message: "Đơn này đã được xác nhận thành công trước đó." });
    }

    const expiry = computeExpiry(order.plan);
    const { error: userError } = await supabaseAdmin.from("users").upsert(
      { google_id: order.google_id, is_premium: true, premium_expiry: expiry.toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "google_id" }
    );
    if (userError) return res.status(500).json({ error: userError.message });

    await supabaseAdmin.from("payments").update({
      status: "success", momo_trans_id: "SIMULATED", result_code: 0, updated_at: new Date().toISOString(),
    }).eq("order_id", orderId);

    res.json({ ok: true, message: `Đã kích hoạt Premium cho ${order.google_id}, hết hạn ${expiry.toISOString()}` });
  } catch (err) {
    console.error("[MoMo simulate-success] error:", err.message);
    res.status(500).json({ error: "Lỗi giả lập xác nhận thanh toán" });
  }
});

// DEBUG: truy vấn trạng thái đơn payment theo orderId (dùng để kiểm tra nhanh từ client/postman)
router.get('/payment/:orderId', async (req, res) => {
  const { orderId } = req.params;
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase service role key not configured' });
  try {
    const { data, error } = await supabaseAdmin.from('payments').select('*').eq('order_id', orderId).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ payment: data });
  } catch (err) {
    console.error('[MoMo debug] error fetching payment:', err.message);
    res.status(500).json({ error: 'Error fetching payment' });
  }
});

export default router;
