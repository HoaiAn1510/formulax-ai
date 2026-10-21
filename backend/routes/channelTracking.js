import express from "express";
import rateLimit from "express-rate-limit";
import { sanitizeRef, isValidVisitorId, attributedSource, DIRECT_SOURCE } from "../lib/channelTracking.js";

/**
 * Theo dõi kênh giới thiệu — xem lib/channelTracking.js, migrations/010_channel_tracking.sql.
 *   POST /api/track/visit          — không cần đăng nhập (khách cũng được đếm); luôn trả 204.
 *   POST /api/track/signup         — tài khoản Google thật; ghi nguồn đăng ký một lần, không ghi đè.
 * Thống kê theo kênh (GET /api/admin/channel-stats) nằm ở routes/admin.js.
 * Không ghi IP, user agent, google_id hay email vào DB (trừ google_id làm khoá user_acquisition) hay log.
 *
 * Phụ thuộc truyền vào để test được không cần Supabase thật: db (supabaseAdmin), verifyUser,
 * extractGoogleId, now(), cấu hình rate limit.
 */
export function createChannelRouter({
  db,
  verifyUser,
  extractGoogleId,
  now = Date.now,
  visitLimit = { windowMs: 60 * 1000, max: 60 },
  signupLimit = { windowMs: 60 * 1000, max: 20 },
}) {
  const router = express.Router();
  const limiter = ({ windowMs, max }) => rateLimit({ windowMs, max, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Thử lại sau ít phút." } });

  // Mỗi trình duyệt chỉ gửi 1 lần/ref/ngày (dấu ở localStorage) và DB chống trùng theo khoá chính
  // (day, ref, visitor_id). Rộng tay vì cả lớp học chung một IP có thể mở link cùng lúc.
  router.post("/track/visit", limiter(visitLimit), async (req, res) => {
    const visitorId = req.body?.visitorId;
    // Sai định dạng thì bỏ qua — vẫn 204 như mọi trường hợp, client không cần biết.
    if (!db || !isValidVisitorId(visitorId)) return res.status(204).end();
    const ref = sanitizeRef(req.body?.ref) || DIRECT_SOURCE;
    try {
      const { error } = await db.from("channel_visits")
        .upsert({ ref, visitor_id: visitorId.toLowerCase() }, { onConflict: "day,ref,visitor_id", ignoreDuplicates: true });
      if (error) console.warn("[track:visit] ghi lỗi:", error.message);
    } catch (err) {
      console.warn("[track:visit] lỗi:", err.message);
    }
    res.status(204).end();
  });

  router.post("/track/signup", limiter(signupLimit), async (req, res) => {
    let authUser;
    try {
      authUser = await verifyUser(req);
    } catch (err) {
      return res.status(err.status || 401).json({ error: err.message });
    }
    // Chỉ tài khoản Google thật: phiên khách ẩn danh hoặc không có Google identity → 204, không ghi.
    const googleId = authUser.is_anonymous ? null : extractGoogleId(authUser);
    if (!googleId) return res.status(204).end();

    // google_id và created_at lấy từ tài khoản đã xác thực ở server; client chỉ gửi ref.
    const source = attributedSource(req.body?.ref, authUser.created_at, now());
    const accountCreatedAt = Number.isNaN(Date.parse(authUser.created_at)) ? new Date(now()).toISOString() : authUser.created_at;
    try {
      // Không bao giờ ghi đè: đã có dòng thì bỏ qua (DB cũng không cấp quyền update cho service_role).
      const { error } = await db.from("user_acquisition").upsert({
        google_id: googleId,
        signup_source: source,
        signup_source_at: source ? new Date(now()).toISOString() : null,
        account_created_at: accountCreatedAt,
      }, { onConflict: "google_id", ignoreDuplicates: true });
      if (error) {
        console.warn("[track:signup] ghi lỗi:", error.message);
        return res.status(503).json({ error: "Thử lại sau." });
      }
    } catch (err) {
      console.warn("[track:signup] lỗi:", err.message);
      return res.status(503).json({ error: "Thử lại sau." });
    }
    res.json({ ok: true });
  });

  return router;
}
