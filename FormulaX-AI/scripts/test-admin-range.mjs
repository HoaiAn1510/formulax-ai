// Test hàm thuần của trang quản trị và dấu gợi ý admin. Chạy: npm run test:admin
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRange, todayVN, isRealDate, formatDay, formatPercent } from "../src/admin/adminRange.js";
import { hasAdminHint, rememberAdminResult, adminHintKey } from "../src/utils/adminHint.js";

const NOW = Date.parse("2026-10-21T05:00:00Z");

test("computeRange: 7 ngày, 30 ngày, tháng này (tính cả hôm nay, giờ Việt Nam)", () => {
  assert.deepEqual(computeRange("7d", NOW), { from: "2026-10-15", to: "2026-10-21" });
  assert.deepEqual(computeRange("30d", NOW), { from: "2026-09-22", to: "2026-10-21" });
  assert.deepEqual(computeRange("month", NOW), { from: "2026-10-01", to: "2026-10-21" });
  // 18:00 UTC ngày 31/10 = 01:00 ngày 1/11 ở Việt Nam
  assert.deepEqual(computeRange("month", Date.parse("2026-10-31T18:00:00Z")), { from: "2026-11-01", to: "2026-11-01" });
  assert.equal(todayVN(Date.parse("2026-10-21T17:00:00Z")), "2026-10-22");
});

test("computeRange tùy chọn: đảo ngày nhập ngược, báo lỗi ngày sai và khoảng > 366 ngày", () => {
  assert.deepEqual(computeRange("custom", NOW, { from: "2026-10-10", to: "2026-10-01" }), { from: "2026-10-01", to: "2026-10-10" });
  assert.ok(computeRange("custom", NOW, { from: "", to: "2026-10-01" }).error);
  assert.ok(computeRange("custom", NOW, { from: "2026-02-30", to: "2026-03-01" }).error);
  assert.ok(computeRange("custom", NOW, { from: "2025-01-01", to: "2026-10-01" }).error);
  assert.deepEqual(computeRange("custom", NOW, { from: "2025-10-22", to: "2026-10-21" }), { from: "2025-10-22", to: "2026-10-21" });
  assert.ok(computeRange("khac", NOW).error);
});

test("isRealDate / formatDay / formatPercent", () => {
  assert.ok(isRealDate("2028-02-29"));
  assert.equal(isRealDate("2026-02-29"), false);
  assert.equal(formatDay("2026-10-21"), "21/10");
  assert.equal(formatDay("2026-10-21", true), "21/10/2026");
  assert.equal(formatPercent(null), "—");
  assert.equal(formatPercent(0.1), "10%");
});

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const broken = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };

test("dấu gợi ý admin: true ghi, false xoá, theo từng googleId; localStorage hỏng không ném lỗi", () => {
  const s = memory();
  assert.equal(hasAdminHint(s, "g1"), false);
  rememberAdminResult(s, "g1", true);
  assert.ok(hasAdminHint(s, "g1"));
  assert.equal(hasAdminHint(s, "g2"), false);
  assert.equal(s.getItem(adminHintKey("g1")), "1");
  rememberAdminResult(s, "g1", false);
  assert.equal(hasAdminHint(s, "g1"), false);
  assert.equal(hasAdminHint(s, null), false);
  assert.doesNotThrow(() => rememberAdminResult(broken, "g1", true));
  assert.equal(hasAdminHint(broken, "g1"), false);
  assert.equal(hasAdminHint(null, "g1"), false);
});
