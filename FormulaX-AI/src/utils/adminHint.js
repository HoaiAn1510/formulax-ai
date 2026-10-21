/**
 * Dấu gợi ý "tài khoản này từng là admin" theo googleId — CHỈ để RootGate quyết định có hiện màn
 * hình tải chờ /api/admin/me hay vào thẳng app học sinh. KHÔNG phải căn cứ phân quyền: trang quản
 * trị chỉ hiện khi /api/admin/me trả true, và mọi số liệu đều do backend kiểm tra quyền.
 * Mọi lần đọc/ghi localStorage bọc try/catch.
 */
export const adminHintKey = (googleId) => `formulax_admin_hint_${googleId}`;

export function hasAdminHint(storage, googleId) {
  try {
    return Boolean(googleId && storage && storage.getItem(adminHintKey(googleId)) === "1");
  } catch {
    return false;
  }
}

/** /me trả true → ghi dấu; trả false → xoá dấu. Lỗi mạng thì KHÔNG gọi hàm này (giữ nguyên dấu). */
export function rememberAdminResult(storage, googleId, isAdmin) {
  try {
    if (!googleId || !storage) return;
    if (isAdmin) storage.setItem(adminHintKey(googleId), "1");
    else storage.removeItem(adminHintKey(googleId));
  } catch {
    // bỏ qua
  }
}
