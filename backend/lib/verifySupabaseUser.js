import { supabaseAdmin } from "./supabaseAdmin.js";

/**
 * Xác thực Authorization: Bearer <token> bằng Supabase JWT — dùng chung cho mọi route cần biết
 * chắc chắn ai đang gọi, không tin bất kỳ trường nào client tự khai (userId, isPremium...).
 * Áp dụng được cho cả tài khoản Google lẫn phiên ẩn danh: `is_anonymous` nằm sẵn trên user
 * object do Supabase trả về, không cần tự suy luận.
 *
 * Throw Error kèm `.status` (401/500) nếu xác thực thất bại — nơi gọi chỉ cần
 * `res.status(err.status || 401).json({ error: err.message })`.
 */
export async function verifySupabaseUser(req) {
  if (!supabaseAdmin) {
    // 503 chứ không phải 500 — đây là phụ thuộc ngoài (Supabase service role) chưa sẵn sàng,
    // không phải lỗi logic của route gọi hàm này. Fail closed: không xác thực được thì từ chối,
    // không có nhánh nào cho qua.
    const err = new Error("Hệ thống xác thực chưa sẵn sàng (Supabase service role chưa cấu hình).");
    err.status = 503;
    throw err;
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const err = new Error("Thiếu Authorization header.");
    err.status = 401;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error("Token không hợp lệ hoặc đã hết hạn.");
    err.status = 401;
    throw err;
  }

  return data.user;
}

/** Google `sub` từ danh sách identity đã xác thực — không tin user_metadata (client tự sửa được). */
export function extractGoogleId(user) {
  return user.identities?.find((i) => i.provider === "google")?.id || null;
}
