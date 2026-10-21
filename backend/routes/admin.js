import express from "express";
import rateLimit from "express-rate-limit";
import { createAdminGuard } from "../lib/adminAuth.js";
import { parseDateRange, buildChannelStats } from "../lib/channelTracking.js";
import { numericRows, sumColumns, channelTotals, publicOrders } from "../lib/adminStats.js";

/**
 * Trang quản trị — CHỈ ĐỌC số liệu, không route nào sửa dữ liệu. Quyền: email trong ADMIN_EMAILS
 * (lib/adminAuth.js). Mọi phép đếm chạy trong DB qua các hàm SQL của migration 010/011.
 *
 *   GET /api/admin/me             → { isAdmin }; thiếu token 401; khách / non-admin 200 false
 *   GET /api/admin/overview       ┐
 *   GET /api/admin/channel-stats  │ ?from=YYYY-MM-DD&to=YYYY-MM-DD (giờ Việt Nam, mặc định 30 ngày)
 *   GET /api/admin/users          │ thiếu token 401, non-admin 403
 *   GET /api/admin/revenue        │
 *   GET /api/admin/usage          ┘
 *
 * Phụ thuộc truyền vào để test không cần Supabase thật.
 */
export function createAdminRouter({
  db,
  verifyUser,
  extractGoogleId,
  adminEmails,
  now = Date.now,
  limits = { aiFree: 10, ocrFree: 5, ocrPremium: 50 },
  rate = { windowMs: 60 * 1000, max: 60 },
}) {
  const router = express.Router();
  const { checkAdmin, requireAdmin } = createAdminGuard({ verifyUser, extractGoogleId, adminEmails });
  router.use(rateLimit({ ...rate, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Thử lại sau ít phút." } }));

  router.get("/me", async (req, res) => {
    try {
      res.json(await checkAdmin(req));
    } catch (err) {
      res.status(err.status || 401).json({ error: err.message });
    }
  });

  router.use(requireAdmin);

  // Đọc khoảng ngày + gọi RPC; lỗi DB → 503 chung, chi tiết chỉ ở log server.
  const handle = (name, build) => async (req, res) => {
    const range = parseDateRange(req.query.from, req.query.to, now());
    if (range.error) return res.status(400).json({ error: range.error });
    try {
      const body = await build(range);
      res.json({ from: range.from, to: range.to, ...body });
    } catch (err) {
      console.error(`[admin:${name}] lỗi:`, err.message);
      res.status(503).json({ error: "Không đọc được số liệu." });
    }
  };

  const rpc = async (fn, args) => {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data || [];
  };
  const span = ({ from, to }) => ({ p_from: from, p_to: to });

  router.get("/overview", handle("overview", async (range) => {
    const [row] = numericRows(await rpc("admin_overview", span(range)));
    return { overview: row || null };
  }));

  router.get("/channel-stats", handle("channel-stats", async (range) => {
    const rows = buildChannelStats(await rpc("channel_stats", span(range)));
    return { rows, total: channelTotals(rows) };
  }));

  router.get("/users", handle("users", async (range) => {
    const [totals, byDay] = await Promise.all([rpc("admin_user_totals", {}), rpc("admin_signups_by_day", span(range))]);
    const days = numericRows(byDay);
    return { totals: numericRows(totals)[0] || null, days, sum: sumColumns(days, ["new_accounts"]) };
  }));

  router.get("/revenue", handle("revenue", async (range) => {
    const [byDay, orders] = await Promise.all([rpc("admin_revenue_by_day", span(range)), rpc("admin_recent_orders", { p_limit: 20 })]);
    const days = numericRows(byDay);
    return { days, sum: sumColumns(days, ["paid_orders", "revenue"]), orders: publicOrders(orders) };
  }));

  router.get("/usage", handle("usage", async (range) => {
    const days = numericRows(await rpc("admin_usage_by_day", {
      ...span(range),
      p_ai_limit: limits.aiFree,
      p_ocr_free_limit: limits.ocrFree,
      p_ocr_premium_limit: limits.ocrPremium,
    }));
    const columns = Object.keys(days[0] || {}).filter((k) => k !== "day");
    return { days, sum: sumColumns(days, columns), limits };
  }));

  return router;
}
