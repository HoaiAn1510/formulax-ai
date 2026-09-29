import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { showConfirm } from "../components/ConfirmDialog";
import { showToast } from "../components/Toast";

export const GUEST_LOCK_MESSAGE = "Đăng nhập Google để lưu và dùng tính năng này.";

/**
 * Khóa tính năng cá nhân hóa cho khách (phiên ẩn danh). Tính năng vẫn hiển thị; bấm vào thì
 * hiện hộp thoại mời đăng nhập Google thay vì âm thầm không lưu gì.
 *
 * Đây chỉ là lớp giao diện. Chặn thật nằm ở RLS (migration 006) và backend — khách có tự gọi
 * thẳng Supabase cũng không ghi được gì.
 */
export function useGuestGate() {
  const { user, loginWithGoogle } = useAuth();
  const isGuest = Boolean(user?.isAnonymous);

  const promptLogin = useCallback(async (message = GUEST_LOCK_MESSAGE) => {
    const ok = await showConfirm(message, { confirmLabel: "Đăng nhập Google", cancelLabel: "Đóng" });
    if (!ok) return;
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Đăng nhập Google thất bại:", err);
      showToast("Đăng nhập Google thất bại. Vui lòng thử lại.", "error");
    }
  }, [loginWithGoogle]);

  // Trả true nếu được dùng tiếp. Với khách: mở hộp thoại và trả false để nơi gọi dừng lại.
  const requireGoogle = useCallback((message) => {
    if (!isGuest) return true;
    promptLogin(message);
    return false;
  }, [isGuest, promptLogin]);

  return { isGuest, requireGoogle, promptLogin };
}
