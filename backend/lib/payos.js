import { PayOS } from "@payos/node";

// Khởi tạo lazy — PayOS constructor throw ngay nếu thiếu clientId/apiKey/checksumKey, nếu
// tạo eager ở module scope thì cả server sập khi chưa kịp điền .env (khác MoMo cũ vốn chỉ
// check cấu hình bên trong từng route, không đụng gì tới module import).
let _payos = null;
export function getPayOS() {
  if (!_payos) {
    _payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    });
  }
  return _payos;
}

// Giá tiền theo gói — khớp với bảng giá hiển thị trong PremiumUpgrade.jsx.
// label rút ngắn ≤25 ký tự, không dấu — PayOS giới hạn field "description".
export const PLAN_CONFIG = {
  monthly: { amount: 49000, label: "FormulaX Pro 1 thang", months: 1 },
  "6months": { amount: 249000, label: "FormulaX Pro 6 thang", months: 6 },
};

export function isValidPlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan);
}

export function computeExpiry(plan, from = new Date()) {
  const months = PLAN_CONFIG[plan]?.months ?? 1;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Nếu người dùng đang còn hạn Premium chưa hết, cộng dồn gói mới vào hạn hiện có thay vì
// tính lại từ thời điểm thanh toán — tránh mất thời gian còn lại khi gia hạn sớm.
export function computeStackedExpiry(plan, currentExpiryIso) {
  const now = new Date();
  const currentExpiry = currentExpiryIso ? new Date(currentExpiryIso) : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  return computeExpiry(plan, base);
}

// PayOS bắt buộc orderCode là số nguyên (không phải chuỗi như MoMo orderId) — vẫn nằm
// trong ngưỡng safe integer (14 chữ số, dưới 2^53).
export function generateOrderCode() {
  return Date.now() * 10 + Math.floor(Math.random() * 10);
}
