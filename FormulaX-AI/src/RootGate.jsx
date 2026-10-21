import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import App from "./App.jsx";
import { fetchIsAdmin } from "./lib/adminApi";
import { hasAdminHint, rememberAdminResult } from "./utils/adminHint";

// Trang quản trị chỉ tải khi backend xác nhận là admin — học sinh không bao giờ tải chunk này.
const AdminApp = lazy(() => import("./admin/AdminApp"));

// Chỉ áp dụng khi máy này có dấu gợi ý admin: chờ /api/admin/me tối đa chừng này rồi vào app học
// sinh (Render gói miễn phí có thể đang ngủ). Không có dấu thì không chờ chút nào.
const HINT_WAIT_MS = 10000;

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

function GateLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
      <img src="/favicon.svg" alt="FormulaX" className="w-12 h-12 rounded-xl animate-pulse" />
      <div className="w-9 h-9 rounded-full border-[3px] border-[#E2E8F0] border-t-accent animate-spin" />
    </div>
  );
}

/**
 * Chọn giữa app học sinh và trang quản trị. Học sinh và khách KHÔNG BAO GIỜ phải chờ:
 *   - Khách / chưa đăng nhập: <App/> ngay, không gọi /api/admin/me.
 *   - Tài khoản Google: <App/> ngay, gọi /api/admin/me chạy ngầm; trả true thì chuyển sang AdminApp.
 *   - Riêng máy có dấu gợi ý admin (utils/adminHint.js) mới hiện màn hình tải, chờ /me tối đa 10 giây
 *     để admin không thấy app học sinh nháy lên. Dấu chỉ quyết định có chờ hay không — quyền thật do
 *     backend kiểm tra ở /me và ở mọi route số liệu.
 * Lỗi mạng / server lỗi → app học sinh (dấu giữ nguyên để lần sau vẫn chờ).
 */
export default function RootGate() {
  const { user } = useAuth();
  const googleId = user && !user.isAnonymous ? user.googleId : null;
  const [adminFor, setAdminFor] = useState(null);     // googleId được backend xác nhận là admin
  const [settledFor, setSettledFor] = useState(null); // googleId đã có kết quả /me hoặc đã hết giờ chờ

  useEffect(() => {
    if (!googleId) return undefined;
    let alive = true;
    const ctrl = new AbortController();
    // Hết giờ chờ thì thôi giữ màn hình tải, nhưng request vẫn chạy tiếp: true đến muộn vẫn chuyển.
    const giveUp = setTimeout(() => { if (alive) setSettledFor(googleId); }, HINT_WAIT_MS);
    fetchIsAdmin(ctrl.signal)
      .then((isAdmin) => {
        if (!alive) return;
        rememberAdminResult(storage, googleId, isAdmin);
        setAdminFor(isAdmin ? googleId : null);
      }, () => {})
      .finally(() => {
        if (!alive) return;
        clearTimeout(giveUp);
        setSettledFor(googleId);
      });
    return () => {
      alive = false;
      ctrl.abort();
      clearTimeout(giveUp);
    };
  }, [googleId]);

  if (googleId && adminFor === googleId) {
    return (
      <Suspense fallback={<GateLoading />}>
        <AdminApp />
      </Suspense>
    );
  }
  if (googleId && settledFor !== googleId && hasAdminHint(storage, googleId)) return <GateLoading />;
  return <App />;
}
