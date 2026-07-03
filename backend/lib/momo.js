import crypto from "crypto";

// Giá tiền theo gói — khớp với bảng giá hiển thị trong PremiumUpgrade.jsx
export const PLAN_CONFIG = {
  monthly: { amount: 49000, label: "FormulaX Pro - Gói 1 tháng", months: 1 },
  "6months": { amount: 249000, label: "FormulaX Pro - Gói 6 tháng", months: 6 },
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

export function signHmacSHA256(rawSignature, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

// Thứ tự field bắt buộc theo tài liệu MoMo (v2 create — requestType captureWallet)
export function buildCreateRawSignature({
  accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType,
}) {
  return (
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}&requestType=${requestType}`
  );
}

// Thứ tự field bắt buộc theo tài liệu MoMo cho IPN callback
export function buildIpnRawSignature({
  accessKey, amount, extraData, message, orderId, orderInfo, orderType,
  partnerCode, payType, requestId, responseTime, resultCode, transId,
}) {
  return (
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}` +
    `&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}` +
    `&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}` +
    `&resultCode=${resultCode}&transId=${transId}`
  );
}

export function generateOrderId() {
  return `FMX${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
