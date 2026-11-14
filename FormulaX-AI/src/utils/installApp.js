import { useSyncExternalStore } from "react";

// Cài FormulaX như app (PWA — vite-plugin-pwa đã có manifest + service worker).
// Chrome/Edge/Android bắn `beforeinstallprompt` RẤT SỚM (thường trước khi React vẽ xong), nên
// initInstallCapture() được gọi ngay trong main.jsx để giữ lại sự kiện, view nào cần thì đọc sau.
// iPhone/iPad không có sự kiện này — chỉ hướng dẫn "Chia sẻ → Thêm vào MH chính".

let deferred = null;
const subs = new Set();
const notify = () => subs.forEach((fn) => fn());

export function initInstallCapture() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // tự hiện nút của mình thay cho thanh gợi ý mặc định của Chrome
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIOS() {
  const ua = window.navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

// "installed" (đang chạy như app) | "prompt" (trình duyệt cho cài bằng 1 nút) | "ios" (hướng dẫn tay) | "none"
export function getInstallMode() {
  if (isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isIOS()) return "ios";
  return "none";
}

export async function promptInstall() {
  if (!deferred) return false;
  const e = deferred;
  deferred = null; // mỗi sự kiện chỉ gọi prompt() được một lần
  e.prompt();
  const { outcome } = await e.userChoice;
  notify();
  return outcome === "accepted";
}

const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export function useInstallMode() {
  return useSyncExternalStore(subscribe, getInstallMode, () => "none");
}

export const IOS_INSTALL_STEPS = "Trong Safari, bấm nút Chia sẻ (ô vuông có mũi tên) → \"Thêm vào MH chính\".";

// Nhắc cài app MỘT lần trên mỗi máy (điện thoại), bằng toast — không thêm khối nào vào trang chính.
// Cờ "đã nhắc" lưu ở localStorage có chủ đích: cài app là việc của từng thiết bị, không phải dữ liệu
// tài khoản (docs/SYNC.md). Chờ tới khi không còn hộp thoại nào mở (hộp "Hôm nay bạn gặp khó khăn gì?").
const HINT_KEY = "formulax_install_hint_shown";
export function scheduleInstallHint(show) {
  try {
    if (localStorage.getItem(HINT_KEY)) return () => {};
  } catch { return () => {}; }
  if (!window.matchMedia?.("(max-width: 767px)").matches) return () => {};
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    const mode = getInstallMode();
    if (mode === "installed" || tries > 20) { clearInterval(timer); return; }
    if (mode === "none" || document.querySelector('[role="dialog"], [aria-modal="true"]')) return;
    clearInterval(timer);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* chế độ riêng tư: bỏ qua */ }
    show(mode);
  }, 4000);
  return () => clearInterval(timer);
}
