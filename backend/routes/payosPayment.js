import express from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { PLAN_CONFIG, isValidPlan, computeStackedExpiry, generateOrderCode, getPayOS } from "../lib/payos.js";

const router = express.Router();

function payosConfigured() {
  return Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
}

// POST /api/payment/payos/create — tạo đơn hàng, trả checkoutUrl để frontend redirect sang PayOS
router.post("/create", async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !isValidPlan(plan)) {
      return res.status(400).json({ error: "Thiếu userId hoặc plan không hợp lệ (monthly | 6months)" });
    }
    if (!payosConfigured()) {
      return res.status(500).json({ error: "PayOS chưa được cấu hình trong backend/.env" });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Hệ thống thanh toán chưa sẵn sàng (Supabase service role chưa cấu hình)." });
    }

    const { amount, label } = PLAN_CONFIG[plan];
    const orderCode = generateOrderCode();
    const returnUrl = `${process.env.BACKEND_PUBLIC_URL}/api/payment/payos/return`;
    const cancelUrl = `${process.env.BACKEND_PUBLIC_URL}/api/payment/payos/return?cancel=true`;

    // Ghi log đơn hàng "pending" trước khi gọi PayOS — dùng để chống IPN/webhook xử lý trùng
    // và để webhook tra được userId/plan theo orderCode. Bắt buộc phải ghi thành công mới gọi
    // sang PayOS: nếu bỏ qua lỗi ở đây, webhook sau này sẽ không tìm thấy order và không có
    // cách nào cấp premium cho người dùng dù họ đã thanh toán — đơn hàng "mồ côi".
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      order_id: String(orderCode), request_id: String(orderCode), google_id: userId, plan, amount,
      status: "pending", provider: "payos", payos_order_code: orderCode,
    });
    if (insertError) {
      console.error("[PayOS create] Ghi payments lỗi:", insertError.message);
      return res.status(500).json({ error: "Không tạo được đơn hàng, vui lòng thử lại." });
    }

    const paymentLink = await getPayOS().paymentRequests.create({
      orderCode,
      amount,
      description: label,
      items: [{ name: label, quantity: 1, price: amount }],
      returnUrl,
      cancelUrl,
    });

    await supabaseAdmin.from("payments").update({
      payos_payment_link_id: paymentLink.paymentLinkId, updated_at: new Date().toISOString(),
    }).eq("order_id", String(orderCode));

    res.json({ checkoutUrl: paymentLink.checkoutUrl, orderCode });
  } catch (err) {
    console.error("[PayOS create] error:", err.message);
    res.status(502).json({ error: err.message || "Không tạo được giao dịch PayOS" });
  }
});

// POST /api/payment/payos/webhook — PayOS gọi ngược về server-to-server khi thanh toán hoàn tất
router.post("/webhook", async (req, res) => {
  try {
    if (!payosConfigured()) {
      console.error("[PayOS webhook] PayOS chưa được cấu hình, bỏ qua webhook.");
      return res.status(204).end();
    }

    let webhookData;
    try {
      // getPayOS().webhooks.verify() tự kiểm tra chữ ký, throw WebhookError/InvalidSignatureError nếu sai.
      webhookData = await getPayOS().webhooks.verify(req.body);
    } catch (verifyErr) {
      console.error("[PayOS webhook] Chữ ký không khớp — khả năng giả mạo:", verifyErr.message);
      return res.status(204).end();
    }

    const orderCode = webhookData.orderCode;

    if (!supabaseAdmin) {
      console.error("[PayOS webhook] Supabase chưa cấu hình service role key — không thể cập nhật is_premium cho orderCode:", orderCode);
      return res.status(204).end();
    }

    const { data: order } = await supabaseAdmin
      .from("payments")
      .select("status, google_id, plan")
      .eq("payos_order_code", orderCode)
      .single();

    // Idempotency: PayOS có thể gọi webhook nhiều lần cho cùng 1 đơn — chỉ xử lý 1 lần.
    if (!order || order.status === "success") {
      return res.status(204).end();
    }

    const isSuccess = req.body?.success === true && webhookData.code === "00";

    if (isSuccess) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("premium_expiry")
        .eq("google_id", order.google_id)
        .maybeSingle();
      const expiry = computeStackedExpiry(order.plan, existingUser?.premium_expiry);
      const { error: userError } = await supabaseAdmin.from("users").upsert(
        { google_id: order.google_id, is_premium: true, premium_expiry: expiry.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "google_id" }
      );
      if (userError) {
        // Không đánh dấu payments là "success" và không ACK 204 — trả lỗi để PayOS retry,
        // tránh mất vĩnh viễn việc cấp premium chỉ vì một lỗi DB tạm thời.
        console.error("[PayOS webhook] Cập nhật users lỗi — trả lỗi để PayOS retry:", userError.message);
        return res.status(500).end();
      }

      await supabaseAdmin.from("payments").update({
        status: "success", payos_reference: webhookData.reference, result_code: 0, updated_at: new Date().toISOString(),
      }).eq("payos_order_code", orderCode);
    } else {
      await supabaseAdmin.from("payments").update({
        status: "failed", result_code: 1, updated_at: new Date().toISOString(),
      }).eq("payos_order_code", orderCode);
    }

    res.status(204).end();
  } catch (err) {
    console.error("[PayOS webhook] error:", err.message);
    res.status(204).end();
  }
});

// GET /api/payment/payos/return — PayOS redirect trình duyệt người dùng về đây sau khi thanh toán
router.get("/return", (req, res) => {
  const { orderCode, status, cancel } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const isSuccess = cancel !== "true" && status === "PAID";
  const target = `${frontendUrl}/?payment=${isSuccess ? "success" : "failed"}&orderId=${encodeURIComponent(orderCode || "")}`;
  res.redirect(302, target);
});

// DEV-ONLY: giả lập PayOS xác nhận thanh toán thành công — dùng khi chưa muốn chuyển khoản thật.
// Bắt buộc DEV_SIMULATE_SECRET đúng trong .env, không cấu hình thì route luôn từ chối (fail closed).
// Nhắc: xoá route này trước khi lên Production thật, vì nó bỏ qua xác minh chữ ký PayOS.
router.post("/simulate-success", async (req, res) => {
  const devSecret = process.env.DEV_SIMULATE_SECRET;
  if (!devSecret) {
    return res.status(403).json({ error: "DEV_SIMULATE_SECRET chưa cấu hình trong .env — route giả lập bị khoá." });
  }
  const { orderCode, secret } = req.body;
  if (secret !== devSecret) {
    return res.status(403).json({ error: "Sai khoá xác nhận." });
  }
  if (!orderCode) {
    return res.status(400).json({ error: "Thiếu orderCode" });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase chưa cấu hình service role key" });
  }

  try {
    const { data: order, error: findError } = await supabaseAdmin
      .from("payments")
      .select("status, google_id, plan")
      .eq("payos_order_code", orderCode)
      .single();

    if (findError || !order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng với orderCode này" });
    }
    if (order.status === "success") {
      return res.json({ ok: true, message: "Đơn này đã được xác nhận thành công trước đó." });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("premium_expiry")
      .eq("google_id", order.google_id)
      .maybeSingle();
    const expiry = computeStackedExpiry(order.plan, existingUser?.premium_expiry);
    const { error: userError } = await supabaseAdmin.from("users").upsert(
      { google_id: order.google_id, is_premium: true, premium_expiry: expiry.toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "google_id" }
    );
    if (userError) return res.status(500).json({ error: userError.message });

    await supabaseAdmin.from("payments").update({
      status: "success", payos_reference: "SIMULATED", result_code: 0, updated_at: new Date().toISOString(),
    }).eq("payos_order_code", orderCode);

    res.json({ ok: true, message: `Đã kích hoạt Premium cho ${order.google_id}, hết hạn ${expiry.toISOString()}` });
  } catch (err) {
    console.error("[PayOS simulate-success] error:", err.message);
    res.status(500).json({ error: "Lỗi giả lập xác nhận thanh toán" });
  }
});

// DEV-ONLY: tra cứu trạng thái 1 đơn hàng theo orderCode (dùng bởi public/simulate-payment.html).
// Khoá bằng DEV_SIMULATE_SECRET giống /simulate-success — không xác thực thì lộ PII thanh toán
// (google_id, số tiền...) cho bất kỳ ai biết/đoán được orderCode.
router.post("/payment-status", async (req, res) => {
  const devSecret = process.env.DEV_SIMULATE_SECRET;
  if (!devSecret) {
    return res.status(403).json({ error: "DEV_SIMULATE_SECRET chưa cấu hình trong .env — route debug bị khoá." });
  }
  const { orderCode, secret } = req.body;
  if (secret !== devSecret) {
    return res.status(403).json({ error: "Sai khoá xác nhận." });
  }
  if (!orderCode) {
    return res.status(400).json({ error: "Thiếu orderCode" });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase chưa cấu hình service role key" });
  }

  try {
    const { data, error } = await supabaseAdmin.from("payments").select("*").eq("payos_order_code", orderCode).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ payment: data });
  } catch (err) {
    console.error("[PayOS debug] error fetching payment:", err.message);
    res.status(500).json({ error: "Error fetching payment" });
  }
});

export default router;
