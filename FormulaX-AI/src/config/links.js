// Đường dẫn tới tài liệu tĩnh trong public/ — dùng chung, không viết cứng ở từng component.

// Hướng dẫn sử dụng (PDF ~4 MB, 22 trang). Mở trong tab mới, không precache trong service worker
// (navigateFallbackDenylist ở vite.config.js giữ cho lượt mở PDF không bị trả về index.html).
// Thay file thì giữ đúng tên để link trong app không phải đổi.
export const USER_MANUAL_URL = "/huong-dan-su-dung.pdf";
