/**
 * Đếm sự kiện sử dụng theo ngày (bảng usage_events_daily, migration 011) để trang quản trị xem —
 * chỉ (ngày, tên chỉ số, số đếm), không google_id, câu hỏi hay ảnh.
 *
 * CHẠY NGẦM: không await trên đường trả kết quả cho học sinh, lỗi (DB chậm, chưa chạy migration…)
 * bỏ qua hoàn toàn. Không bao giờ ném lỗi.
 */
export const USAGE_METRICS = Object.freeze([
  "ai_premium_turn",
  "ai_quota_exceeded",
  "ai_busy",
  "ocr_quota_exceeded",
  "ocr_rate_limited",
  "chat_ip_limited",
]);

export function createUsageMetrics(db) {
  return function bump(metric) {
    if (!db || !USAGE_METRICS.includes(metric)) return;
    try {
      Promise.resolve(db.rpc("bump_usage_metric", { p_metric: metric })).then(() => {}, () => {});
    } catch {
      // bỏ qua
    }
  };
}
