// Test kênh giới thiệu phía trình duyệt (src/utils/channelRef.js). Chạy: npm run test:channel
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeRef, readRefFromSearch, cleanedUrl, isAuthCallback, getStoredRef, rememberFirstTouch,
  getVisitorId, visitAlreadySent, markVisitSent, vnDay, REF_KEY, REF_TTL_MS,
} from "../src/utils/channelRef.js";

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};
const brokenStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
const NOW = Date.parse("2026-10-21T05:00:00Z");

test("sanitizeRef: chữ thường, a-z 0-9 -, tối đa 40", () => {
  assert.equal(sanitizeRef("TikTok-Video3"), "tiktok-video3");
  assert.equal(sanitizeRef("<b>fb</b>"), "bfbb");
  assert.equal(sanitizeRef("x".repeat(50)).length, 40);
  assert.equal(sanitizeRef("%%%"), null);
});

test("readRefFromSearch: ưu tiên ref, rồi utm_source", () => {
  assert.equal(readRefFromSearch("?ref=TikTok"), "tiktok");
  assert.equal(readRefFromSearch("?utm_source=Facebook&utm_medium=post"), "facebook");
  assert.equal(readRefFromSearch("?ref=tiktok&utm_source=facebook"), "tiktok");
  assert.equal(readRefFromSearch("?ref=!!!&utm_source=facebook"), "facebook");
  assert.equal(readRefFromSearch(""), null);
});

test("cleanedUrl: bỏ ref + utm_*, giữ tham số khác và hash; không có gì để bỏ → null", () => {
  assert.equal(cleanedUrl("https://app.vn/?ref=tiktok"), "/");
  assert.equal(cleanedUrl("https://app.vn/?ref=tiktok&payment=success#x"), "/?payment=success#x");
  assert.equal(cleanedUrl("https://app.vn/?utm_source=fb&utm_campaign=a"), "/");
  assert.equal(cleanedUrl("https://app.vn/?payment=success"), null);
});

test("isAuthCallback: lúc Google đăng nhập quay về không đếm là lượt truy cập", () => {
  assert.ok(isAuthCallback("?code=abc", ""));
  assert.ok(isAuthCallback("", "#access_token=x&refresh_token=y"));
  assert.ok(isAuthCallback("", "#error_description=denied"));
  assert.equal(isAuthCallback("?ref=tiktok", ""), false);
  assert.equal(isAuthCallback("", ""), false);
});

test("first-touch: lưu 30 ngày, ref còn hạn không bị ghi đè, hết hạn thì ghi ref mới", () => {
  const s = memoryStorage();
  assert.equal(rememberFirstTouch(s, "tiktok", NOW), "tiktok");
  assert.equal(rememberFirstTouch(s, "facebook", NOW + 1000), "tiktok");
  assert.equal(getStoredRef(s, NOW + REF_TTL_MS - 1), "tiktok");
  assert.equal(getStoredRef(s, NOW + REF_TTL_MS), null);
  assert.equal(rememberFirstTouch(s, "facebook", NOW + REF_TTL_MS), "facebook");
  assert.equal(getStoredRef(s, NOW + REF_TTL_MS + 1), "facebook");
});

test("first-touch: dữ liệu hỏng hoặc localStorage bị chặn không ném lỗi", () => {
  const s = memoryStorage();
  s.setItem(REF_KEY, "{not json");
  assert.equal(getStoredRef(s, NOW), null);
  assert.equal(rememberFirstTouch(s, "tiktok", NOW), "tiktok");
  assert.equal(getStoredRef(brokenStorage, NOW), null);
  assert.equal(rememberFirstTouch(brokenStorage, "tiktok", NOW), "tiktok");
  assert.equal(getStoredRef(null, NOW), null);
});

test("visitorId: tạo một lần rồi dùng lại; bộ nhớ bị chặn thì vẫn trả id", () => {
  const s = memoryStorage();
  let n = 0;
  const make = () => `00000000-0000-4000-8000-00000000000${++n}`;
  const a = getVisitorId(s, make);
  assert.equal(getVisitorId(s, make), a);
  assert.equal(n, 1);
  assert.match(getVisitorId(brokenStorage, make), /^0{8}-/);
});

test("dấu lượt truy cập: 1 lần/ref/ngày, sang ngày mới thì gửi lại", () => {
  const s = memoryStorage();
  const day = vnDay(NOW);
  assert.equal(visitAlreadySent(s, "tiktok", day), false);
  markVisitSent(s, "tiktok", day);
  assert.ok(visitAlreadySent(s, "tiktok", day));
  assert.equal(visitAlreadySent(s, "facebook", day), false);
  markVisitSent(s, "facebook", day);
  assert.ok(visitAlreadySent(s, "tiktok", day) && visitAlreadySent(s, "facebook", day));
  assert.equal(visitAlreadySent(s, "tiktok", vnDay(NOW + 86400000)), false);
  assert.equal(visitAlreadySent(brokenStorage, "tiktok", day), false);
});

test("vnDay: theo giờ Việt Nam", () => {
  assert.equal(vnDay(Date.parse("2026-10-21T16:59:00Z")), "2026-10-21");
  assert.equal(vnDay(Date.parse("2026-10-21T17:00:00Z")), "2026-10-22");
});
