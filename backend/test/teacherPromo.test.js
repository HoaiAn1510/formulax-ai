// Ưu đãi "Tháng tri ân ngành giáo dục" (lib/payos.js): gói 1 tháng 20.000đ, chỉ trong tháng 11/2026 giờ Việt Nam.
// Giá gốc 1 tháng 49.000đ / 6 tháng 249.000đ giữ nguyên.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAN_CONFIG, PROMO_PLAN, isPromoActive, isValidPlan, computeExpiry } from "../lib/payos.js";

test("gói tri ân: 20.000đ, 1 tháng, hợp lệ; giá gốc không đổi", () => {
  assert.equal(isValidPlan(PROMO_PLAN), true);
  assert.equal(PLAN_CONFIG[PROMO_PLAN].amount, 20000);
  assert.equal(PLAN_CONFIG[PROMO_PLAN].months, 1);
  assert.ok(PLAN_CONFIG[PROMO_PLAN].label.length <= 25); // PayOS giới hạn description
  assert.equal(PLAN_CONFIG.monthly.amount, 49000);
  assert.equal(PLAN_CONFIG["6months"].amount, 249000);
  assert.equal(PLAN_CONFIG.monthly.promo, undefined);
});

test("isPromoActive: cả tháng 11/2026 theo giờ Việt Nam", () => {
  assert.equal(isPromoActive(new Date("2026-10-31T16:59:59Z")), false); // 31/10 23:59:59 giờ VN
  assert.equal(isPromoActive(new Date("2026-10-31T17:00:00Z")), true);  // 01/11 00:00 giờ VN
  assert.equal(isPromoActive(new Date("2026-11-20T05:00:00Z")), true);
  assert.equal(isPromoActive(new Date("2026-11-30T16:59:59Z")), true);  // 30/11 23:59:59 giờ VN
  assert.equal(isPromoActive(new Date("2026-11-30T17:00:00Z")), false); // 01/12 00:00 giờ VN
});

test("gói tri ân cộng đúng 1 tháng như gói thường", () => {
  const from = new Date("2026-11-10T00:00:00Z");
  assert.equal(computeExpiry(PROMO_PLAN, from).toISOString(), computeExpiry("monthly", from).toISOString());
});
