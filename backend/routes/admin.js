import express from "express";
import rateLimit from "express-rate-limit";
import { createAdminGuard } from "../lib/adminAuth.js";
import { parseDateRange, buildChannelStats } from "../lib/channelTracking.js";
import { numericRows, sumColumns, channelTotals, publicOrders, previousRange, cumulativeAccounts, mergeByDay } from "../lib/adminStats.js";

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

  const usageArgs = (r) => ({
    ...span(r),
    p_ai_limit: limits.aiFree,
    p_ocr_free_limit: limits.ocrFree,
    p_ocr_premium_limit: limits.ocrPremium,
  });
  const vnToday = () => new Date(now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Kỳ trước = cùng độ dài, liền trước — gọi lại đúng các hàm SQL của kỳ hiện tại (không cần hàm mới).
  router.get("/overview", handle("overview", async (range) => {
    const prev = previousRange(range);
    const today = vnToday();
    const [cur, before, signups, revenue, channels, todayUsage] = await Promise.all([
      rpc("admin_overview", span(range)),
      rpc("admin_overview", span(prev)),
      rpc("admin_signups_by_day", span(range)),
      rpc("admin_revenue_by_day", span(range)),
      rpc("channel_stats", span(range)),
      rpc("admin_usage_by_day", usageArgs({ from: today, to: today })),
    ]);
    const [p] = numericRows(before);
    return {
      overview: numericRows(cur)[0] || null,
      previous: p ? { new_accounts: p.new_accounts, revenue_total: p.revenue_total, paid_orders: p.paid_orders } : null,
      previousRange: prev,
      days: mergeByDay(signups, revenue),
      channels: buildChannelStats(channels),
      today: numericRows(todayUsage)[0] || null,
    };
  }));

  router.get("/channel-stats", handle("channel-stats", async (range) => {
    const rows = buildChannelStats(await rpc("channel_stats", span(range)));
    return { rows, total: channelTotals(rows) };
  }));

  router.get("/users", handle("users", async (range) => {
    const prev = previousRange(range);
    const today = vnToday();
    const end = range.to > today ? range.to : today;
    const [totalsRows, toToday, before] = await Promise.all([
      rpc("admin_user_totals", {}),
      rpc("admin_signups_by_day", span({ from: range.from, to: end })),
      rpc("admin_signups_by_day", span(prev)),
    ]);
    const totals = numericRows(totalsRows)[0] || null;
    const days = numericRows(toToday).filter((d) => d.day <= range.to);
    return {
      totals,
      days,
      sum: sumColumns(days, ["new_accounts"]),
      previous: sumColumns(before, ["new_accounts"]),
      previousRange: prev,
      cumulative: totals ? cumulativeAccounts(totals.google_accounts_total, toToday, range.to) : [],
    };
  }));

  router.get("/revenue", handle("revenue", async (range) => {
    const prev = previousRange(range);
    const [byDay, before, orders] = await Promise.all([
      rpc("admin_revenue_by_day", span(range)),
      rpc("admin_revenue_by_day", span(prev)),
      rpc("admin_recent_orders", { p_limit: 20 }),
    ]);
    const days = numericRows(byDay);
    return {
      days,
      sum: sumColumns(days, ["paid_orders", "revenue"]),
      previous: sumColumns(before, ["paid_orders", "revenue"]),
      previousRange: prev,
      orders: publicOrders(orders),
    };
  }));

  router.get("/usage", handle("usage", async (range) => {
    const prev = previousRange(range);
    const [cur, before] = await Promise.all([rpc("admin_usage_by_day", usageArgs(range)), rpc("admin_usage_by_day", usageArgs(prev))]);
    const days = numericRows(cur);
    const columns = Object.keys(days[0] || {}).filter((k) => k !== "day");
    return { days, sum: sumColumns(days, columns), previous: sumColumns(before, columns), previousRange: prev, limits };
  }));

  return router;
}
