/**
 * Khoảng ngày của trang quản trị — hàm thuần, ngày theo giờ Việt Nam (khớp backend/DB). Chạy test:
 * npm run test:admin
 */

export const RANGE_PRESETS = [
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
  { id: "custom", label: "Tùy chọn" },
];

const DAY_MS = 86400000;
const vnDate = (ms) => new Date(ms + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const todayVN = (now = Date.now()) => vnDate(now);

/** YYYY-MM-DD hợp lệ thật (không nhận 2026-02-30). */
export function isRealDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
    && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
}

/**
 * { from, to } cho một preset; "custom" dùng custom.from/custom.to (đảo lại nếu nhập ngược).
 * Trả { error } khi ngày tùy chọn không hợp lệ hoặc dài hơn 366 ngày (giới hạn của backend).
 */
export function computeRange(preset, now = Date.now(), custom = {}) {
  const today = vnDate(now);
  if (preset === "7d") return { from: vnDate(now - 6 * DAY_MS), to: today };
  if (preset === "30d") return { from: vnDate(now - 29 * DAY_MS), to: today };
  if (preset === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  if (preset === "custom") {
    let { from, to } = custom;
    if (!isRealDate(from) || !isRealDate(to)) return { error: "Chọn đủ ngày bắt đầu và ngày kết thúc." };
    if (from > to) [from, to] = [to, from];
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS + 1;
    if (days > 366) return { error: "Khoảng ngày tối đa 366 ngày." };
    return { from, to };
  }
  return { error: "Khoảng ngày không hợp lệ." };
}

/** "2026-10-21" → "21/10" (nhãn trục biểu đồ); "21/10/2026" khi cần năm. */
export function formatDay(day, withYear = false) {
  if (!isRealDate(day)) return day || "";
  const [y, m, d] = day.split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

export const formatCount = (v) => (Number(v) || 0).toLocaleString("vi-VN");
export const formatVnd = (n) => `${Math.round(Number(n) || 0).toLocaleString("vi-VN")} đ`;
export const formatPercent = (r) => (r === null || r === undefined ? "—" : `${(r * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`);
