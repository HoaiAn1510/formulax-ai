import { test } from "node:test";
import assert from "node:assert/strict";
import { askFinder, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";

// Groq giả + đồng hồ giả: mỗi lần gọi "tốn" `costMs` và trả lần lượt các nội dung trong `replies`.
function fakeGroq(replies, clock, costMs) {
  const calls = [];
  return {
    calls,
    chat: { completions: { create: async (_body, opts) => {
      calls.push(opts.timeout);
      clock.t += costMs;
      return { choices: [{ message: { content: replies[calls.length - 1] } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
    } } },
  };
}
const GOOD = JSON.stringify({
  type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Dùng công thức thể tích khối cầu.",
  steps: [{ title: "Thay số", detail: "Thay $R = 6$:", expression: "V = \\frac{4}{3}\\pi \\cdot 6^3" }], reminder: "Tự tính nhé!",
});
const Q = "Tính thể tích khối cầu bán kính 6 cm";

test("JSON đúng ngay lần đầu → 1 lần gọi, timeout 25s", async () => {
  const clock = { t: 0 };
  const groq = fakeGroq([GOOD], clock, 2000);
  const { answer, meta } = await askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(answer.type, "solution");
  assert.deepEqual(groq.calls, [25_000]);
  assert.equal(meta.jsonFailed, undefined);
});

test("JSON hỏng, còn đủ thời gian → gọi lại với timeout = min(25s, thời gian còn lại)", async () => {
  const clock = { t: 0 };
  const groq = fakeGroq(["không phải json", GOOD], clock, 20_000);
  const { answer } = await askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(answer.type, "solution");
  assert.deepEqual(groq.calls, [25_000, 20_000]); // lần 2: còn 40s - 20s = 20s < 25s
});

test("JSON hỏng, KHÔNG đủ thời gian để gọi lại → không gọi lần 2, trả câu mẫu (jsonFailed)", async () => {
  const clock = { t: 0 };
  const groq = fakeGroq(["không phải json", GOOD], clock, 35_000); // lần đầu tốn 35s → còn 5s
  const { answer, meta } = await askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(groq.calls.length, 1);
  assert.equal(answer.type, "unavailable");
  assert.equal(meta.jsonFailed, true);
  assert.equal(meta.skippedRetryForTime, true);
});

test("thời gian đã bị các bước trước (xác thực, DB) dùng bớt → timeout lần đầu cũng bị thu ngắn", async () => {
  const clock = { t: 30_000 }; // request tới lúc 0, tới đây đã mất 30s
  const groq = fakeGroq([GOOD], clock, 1000);
  await askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.deepEqual(groq.calls, [10_000]);
});
