import { getAccessToken } from "./supabase";
import {
  readRefFromSearch, cleanedUrl, isAuthCallback, rememberFirstTouch, getStoredRef, getVisitorId,
  visitAlreadySent, markVisitSent, vnDay, signupMarkKey, safeGet, safeSet, DIRECT_REF,
} from "../utils/channelRef";

/**
 * Theo dõi kênh giới thiệu cho báo cáo KPI (backend: routes/channelTracking.js). Mọi lỗi im lặng —
 * không bao giờ làm hỏng việc mở app hay đăng nhập. Không gửi gì ngoài ref + visitor_id ngẫu nhiên
 * (lượt truy cập) và ref (đăng ký, kèm token để server tự biết tài khoản).
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

/**
 * Gọi một lần lúc mở app, TRƯỚC khi render: đọc ?ref=/utm_source, lưu first-touch (30 ngày, không
 * ghi đè ref còn hạn), xoá các tham số đó khỏi URL, rồi đếm 1 lượt truy cập (ref trong URL, không có
 * thì "direct") — tối đa 1 lần/trình duyệt/ref/ngày.
 */
export function captureChannelVisit() {
  try {
    const urlRef = readRefFromSearch(window.location.search);
    if (urlRef) rememberFirstTouch(storage, urlRef);
    const clean = cleanedUrl(window.location.href);
    if (clean) window.history.replaceState(window.history.state, "", clean);

    if (isAuthCallback(window.location.search, window.location.hash)) return;
    const ref = urlRef || DIRECT_REF;
    const day = vnDay();
    if (visitAlreadySent(storage, ref, day)) return;
    const visitorId = getVisitorId(storage);
    fetch(`${BACKEND_URL}/api/track/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, visitorId }),
      keepalive: true,
    })
      .then((res) => { if (res.ok) markVisitSent(storage, ref, day); })
      .catch(() => {});
  } catch {
    // im lặng
  }
}

const signupInFlight = new Set();

/**
 * Gửi nguồn đăng ký cho tài khoản Google — chỉ MỘT lần mỗi tài khoản (dấu trong localStorage theo
 * googleId, chỉ đặt khi server nhận). Server tự lấy google_id + ngày tạo tài khoản từ token và chỉ
 * gắn nguồn khi tài khoản vừa tạo ≤ 24 giờ; ở đây chỉ gửi ref.
 */
export async function trackSignupOnce(googleId) {
  if (!googleId || signupInFlight.has(googleId)) return;
  const markKey = signupMarkKey(googleId);
  if (safeGet(storage, markKey)) return;
  signupInFlight.add(googleId);
  try {
    const token = await getAccessToken();
    if (!token) return;
    const res = await fetch(`${BACKEND_URL}/api/track/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ref: getStoredRef(storage) }),
    });
    if (res.ok) safeSet(storage, markKey, "1");
  } catch {
    // im lặng — lần mở app sau thử lại
  } finally {
    signupInFlight.delete(googleId);
  }
}
