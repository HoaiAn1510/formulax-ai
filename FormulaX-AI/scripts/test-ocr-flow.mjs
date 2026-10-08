// Test các hàm thuần của luồng "ảnh đề → chọn bài → hướng dẫn từng bài". Chạy: npm run test:ocr
import { test } from "node:test";
import assert from "node:assert/strict";
import { markUnclear, hasUnclear, problemToFinderMessage, checkGuidanceQuota, nextGuidanceRequest, busyWaitSeconds, isGuided, UNCLEAR_MARK } from "../src/utils/ocrProblems.js";
import { fitWithin, OCR_MAX_SIDE } from "../src/utils/imageCompress.js";

const R = String.raw;

test("hasUnclear: nhận đúng chuỗi [?] của câu lệnh OCR", () => {
  assert.equal(UNCLEAR_MARK, "[?]");
  assert.equal(hasUnclear("Cho $a = [?]$, tính b"), true);
  assert.equal(hasUnclear("Hàm số đồng biến trên khoảng nào?"), false);
  assert.equal(hasUnclear(R`$x \in [0; 3]$`), false);
});

test("markUnclear: [?] trong và ngoài $...$ đều thành ô đỏ; dấu hỏi thường giữ nguyên", () => {
  const out = markUnclear("Cho $AB = [?]$ cm và góc [?] độ. Tính BC?");
  assert.equal((out.match(/fcolorbox\{#DC2626\}/g) || []).length, 2);
  assert.doesNotMatch(out, /\[\?\]/);
  // Ô ngoài phần toán được bọc $...$ để KaTeX vẽ.
  assert.match(out, /góc \$\\fcolorbox/);
  assert.match(out, /Tính BC\?$/);
  // Số dấu $ vẫn chẵn (không làm lệch phần toán phía sau).
  assert.equal((out.match(/\$/g) || []).length % 2, 0);
});

test("problemToFinderMessage: đề + ghi chú hình vẽ (chỉ khi có hình và có ghi chú)", () => {
  assert.equal(problemToFinderMessage({ text: " Tính AC ", hasFigure: true, figureNote: "AH vuông góc BC" }), "Tính AC\n(Hình vẽ cho biết: AH vuông góc BC)");
  assert.equal(problemToFinderMessage({ text: "Tính AC", hasFigure: true, figureNote: "" }), "Tính AC");
  assert.equal(problemToFinderMessage({ text: "Tính AC", hasFigure: false, figureNote: "lạc" }), "Tính AC");
});

test("checkGuidanceQuota: mỗi bài 1 lượt; chọn nhiều hơn số lượt còn lại thì báo trước", () => {
  assert.equal(checkGuidanceQuota({ count: 3, remaining: 5, isPremium: false }).ok, true);
  assert.equal(checkGuidanceQuota({ count: 5, remaining: 5, isPremium: false }).ok, true);
  const over = checkGuidanceQuota({ count: 4, remaining: 2, isPremium: false });
  assert.equal(over.ok, false);
  assert.match(over.message, /còn 2 lượt.*chọn 4 bài.*tối đa 2 bài/);
  assert.equal(checkGuidanceQuota({ count: 1, remaining: 0, isPremium: false }).ok, false);
  assert.equal(checkGuidanceQuota({ count: 0, remaining: 5, isPremium: false }).ok, false);
  // Premium không giới hạn; chưa biết số lượt (null) thì để backend tự chặn.
  assert.equal(checkGuidanceQuota({ count: 10, remaining: null, isPremium: true }).ok, true);
  assert.equal(checkGuidanceQuota({ count: 10, remaining: null, isPremium: false }).ok, true);
});

test("nextGuidanceRequest: chỉ gọi cho tab đang mở, chưa có kết quả, và không có bài nào đang chờ", () => {
  assert.equal(nextGuidanceRequest({ activeKey: "a", results: {}, inFlightKey: null }), "a");
  assert.equal(nextGuidanceRequest({ activeKey: "a", results: { a: { status: "done" } }, inFlightKey: null }), null);
  // Đang chờ bài a mà mở tab b → chưa gọi b (không song song); a xong thì gọi b.
  assert.equal(nextGuidanceRequest({ activeKey: "b", results: { a: { status: "loading" } }, inFlightKey: "a" }), null);
  assert.equal(nextGuidanceRequest({ activeKey: "b", results: { a: { status: "done" } }, inFlightKey: null }), "b");
  // Lỗi không tự gọi lại (tránh vòng lặp) — phải bấm Thử lại (xoá kết quả).
  assert.equal(nextGuidanceRequest({ activeKey: "a", results: { a: { status: "error" } }, inFlightKey: null }), null);
});

test("fitWithin: cạnh dài ≤ 2000px, giữ tỉ lệ, không phóng to ảnh nhỏ", () => {
  assert.equal(OCR_MAX_SIDE, 2000);
  assert.deepEqual(fitWithin(3000, 4000, 2000), { width: 1500, height: 2000 });
  assert.deepEqual(fitWithin(4032, 3024, 2000), { width: 2000, height: 1500 });
  assert.deepEqual(fitWithin(1441, 2560, 2000), { width: 1126, height: 2000 });
  assert.deepEqual(fitWithin(800, 600, 2000), { width: 800, height: 600 });
});

test("AI đang bận (Groq 429): trong lúc chờ không tab nào gọi AI; hết giờ thì gọi lại tab đang mở", () => {
  const now = 1_000_000;
  // Tab b vừa bị "busy" (kết quả đã bị xoá để tự thử lại) nhưng còn trong thời gian chờ → chưa gọi.
  assert.equal(nextGuidanceRequest({ activeKey: "b", results: {}, inFlightKey: null, busyUntil: now + 5000, now }), null);
  // Mở tab c trong lúc chờ cũng không gọi (gọi lúc này chắc chắn lại 429).
  assert.equal(nextGuidanceRequest({ activeKey: "c", results: { b: { status: "busy", auto: true } }, inFlightKey: null, busyUntil: now + 5000, now }), null);
  // Hết giờ → gọi tab đang mở.
  assert.equal(nextGuidanceRequest({ activeKey: "b", results: {}, inFlightKey: null, busyUntil: now - 1, now }), "b");
  // Bài đã tự thử lại một lần (kết quả busy còn giữ) → không tự gọi nữa, chờ bấm Thử lại.
  assert.equal(nextGuidanceRequest({ activeKey: "b", results: { b: { status: "busy", auto: false } }, inFlightKey: null, busyUntil: 0, now }), null);
});

test("busyWaitSeconds: theo retryAfter của backend, mặc định 60", () => {
  assert.equal(busyWaitSeconds(15), 15);
  assert.equal(busyWaitSeconds(14.2), 15);
  assert.equal(busyWaitSeconds(undefined), 60);
  assert.equal(busyWaitSeconds(0), 60);
});

test("isGuided: ✓ chỉ khi đã có hướng dẫn các bước (solution)", () => {
  assert.equal(isGuided({ status: "done", answer: { type: "solution" } }), true);
  assert.equal(isGuided({ status: "no_formula", answer: { type: "no_formula" } }), false);
  assert.equal(isGuided({ status: "done", answer: { type: "no_formula" } }), false);
  assert.equal(isGuided({ status: "done", answer: { type: "off_topic" } }), false);
  for (const status of ["error", "busy", "limit", "loading"]) assert.equal(isGuided({ status }), false, status);
  assert.equal(isGuided(undefined), false);
});
