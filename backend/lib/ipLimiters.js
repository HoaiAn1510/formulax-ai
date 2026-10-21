import rateLimit from "express-rate-limit";

/**
 * Ba bộ giới hạn theo IP có đếm sự kiện cho trang quản trị (server.js). Cấu hình GIỮ NGUYÊN như trước
 * khi có trang quản trị — chỉ thêm `handler` để đếm số lần bị chặn (usage_events_daily, migration 011).
 * `handler` trả đúng như handler mặc định của express-rate-limit: status 429 + message dạng JSON; các
 * header RateLimit / RateLimit-Policy / Retry-After do thư viện đặt TRƯỚC khi gọi handler nên không đổi.
 * test/ipLimiters.test.js so sánh từng bộ với bản không có handler.
 */
export const IP_LIMITER_OPTIONS = Object.freeze({
  chatBurst: {
    windowMs: 60 * 1000,
    max: 12,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Bạn hỏi hơi nhanh, chờ khoảng một phút rồi thử lại nhé." },
  },
  chatDaily: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Đã đạt giới hạn số câu hỏi trong ngày. Vui lòng quay lại vào ngày mai." },
  },
  // Chốt theo IP trước khi đọc body ảnh (rộng hơn giới hạn tài khoản vì nhiều học sinh chung IP).
  ocrIp: {
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Bạn quét ảnh hơi nhanh, chờ khoảng một phút rồi thử lại nhé.", code: "ocr_rate" },
  },
});

const METRIC = { chatBurst: "chat_ip_limited", chatDaily: "chat_ip_limited", ocrIp: "ocr_rate_limited" };

/** Handler giống mặc định của thư viện (status + gửi message), kèm đếm chạy ngầm. */
export const countingHandler = (bump, metric) => (req, res, next, options) => {
  bump(metric);
  res.status(options.statusCode).json(options.message);
};

/** @returns {{ chatBurst, chatDaily, ocrIp }} middleware express-rate-limit */
export function createIpLimiters(bump) {
  return Object.fromEntries(Object.entries(IP_LIMITER_OPTIONS).map(([name, options]) => [
    name,
    rateLimit({ ...options, handler: countingHandler(bump, METRIC[name]) }),
  ]));
}
