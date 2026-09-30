import { test } from "node:test";
import assert from "node:assert/strict";
import { runWithQuota } from "../lib/quotaFlow.js";

// Bộ đếm giả mô phỏng ai_usage_daily: reserve = increment_ai_usage, refund = refund_ai_usage.
function fakeCounter(start) {
  const c = { used: start, reserves: 0, refunds: 0 };
  c.reserve = async () => { c.reserves++; return ++c.used; };
  c.refund = async () => { c.refunds++; c.used = Math.max(0, c.used - 1); return c.used; };
  return c;
}
const LIMIT = 10;

test("giao được câu trả lời → giữ lượt, không hoàn", async () => {
  const c = fakeCounter(3);
  const out = await runWithQuota({ limit: LIMIT, reserve: c.reserve, refund: c.refund, run: async () => ({ delivered: true }) });
  assert.equal(out.limited, false);
  assert.equal(out.remaining, 6);
  assert.equal(c.used, 4);
  assert.equal(c.refunds, 0);
});

test("vượt hạn mức (increment trả về > 10) → hoàn, không chạy AI, bộ đếm đứng ở 10", async () => {
  const c = fakeCounter(10);
  let ran = false;
  const out = await runWithQuota({ limit: LIMIT, reserve: c.reserve, refund: c.refund, run: async () => { ran = true; return { delivered: true }; } });
  assert.deepEqual(out, { limited: true, remaining: 0 });
  assert.equal(ran, false);
  assert.equal(c.used, 10);
  assert.equal(c.refunds, 1);
});

test("Groq trả 429 → hoàn lượt, lỗi được ném ra kèm số lượt còn lại", async () => {
  const c = fakeCounter(9);
  const groq429 = Object.assign(new Error("rate limit"), { status: 429 });
  await assert.rejects(
    runWithQuota({ limit: LIMIT, reserve: c.reserve, refund: c.refund, run: async () => { throw groq429; } }),
    (err) => err === groq429 && err.remaining === 1,
  );
  assert.equal(c.used, 9);
  assert.equal(c.refunds, 1);
});

test("Groq lỗi khác / timeout → cũng hoàn lượt", async () => {
  const c = fakeCounter(0);
  const timeout = Object.assign(new Error("Request timed out."), { name: "APIConnectionTimeoutError" });
  await assert.rejects(runWithQuota({ limit: LIMIT, reserve: c.reserve, refund: c.refund, run: async () => { throw timeout; } }));
  assert.equal(c.used, 0);
});

test("JSON hỏng sau khi gọi lại (delivered: false, trả câu mẫu) → hoàn lượt, vẫn trả kết quả", async () => {
  const c = fakeCounter(5);
  const out = await runWithQuota({ limit: LIMIT, reserve: c.reserve, refund: c.refund, run: async () => ({ delivered: false, answer: { type: "unavailable" } }) });
  assert.equal(out.limited, false);
  assert.equal(out.result.answer.type, "unavailable");
  assert.equal(out.remaining, 5);
  assert.equal(c.used, 5);
});

test("hoàn lượt thất bại → chỉ ghi log, học sinh vẫn nhận phản hồi; lượt vẫn bị tính", async () => {
  const c = fakeCounter(5);
  const logged = [];
  const out = await runWithQuota({
    limit: LIMIT, reserve: c.reserve, run: async () => ({ delivered: false }),
    refund: async () => { throw new Error("db down"); },
    onRefundError: (err) => logged.push(err.message),
  });
  assert.equal(out.remaining, 4);
  assert.deepEqual(logged, ["db down"]);
});

test("tăng lượt thất bại (lỗi DB) → dừng luôn: không gọi AI, không hoàn", async () => {
  let ran = false, refunded = false;
  await assert.rejects(
    runWithQuota({
      limit: LIMIT,
      reserve: async () => { throw new Error("quota db error"); },
      refund: async () => { refunded = true; return 0; },
      run: async () => { ran = true; return { delivered: true }; },
    }),
    /quota db error/,
  );
  assert.equal(ran, false);
  assert.equal(refunded, false);
});
