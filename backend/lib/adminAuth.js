import { isAdminEmail } from "./channelTracking.js";

/**
 * Quyền admin: email (đã xác thực qua Supabase) nằm trong biến môi trường ADMIN_EMAILS. Không có
 * bảng role. Dùng chung cho mọi route /api/admin/* (routes/admin.js).
 *
 *   checkAdmin(req)  → { isAdmin } — ném lỗi kèm .status (401/503) khi token thiếu/sai.
 *   requireAdmin     → middleware: lỗi xác thực → 401 (hoặc status của lỗi), không phải admin → 403.
 *
 * Khách ẩn danh và tài khoản không có Google identity không bao giờ là admin, kể cả khi email trùng.
 */
export function createAdminGuard({ verifyUser, extractGoogleId, adminEmails = () => process.env.ADMIN_EMAILS }) {
  async function checkAdmin(req) {
    const authUser = await verifyUser(req);
    const isAdmin = !authUser.is_anonymous
      && Boolean(extractGoogleId(authUser))
      && isAdminEmail(authUser.email, adminEmails());
    return { isAdmin };
  }

  async function requireAdmin(req, res, next) {
    let result;
    try {
      result = await checkAdmin(req);
    } catch (err) {
      return res.status(err.status || 401).json({ error: err.message });
    }
    if (!result.isAdmin) return res.status(403).json({ error: "Không có quyền." });
    next();
  }

  return { checkAdmin, requireAdmin };
}
