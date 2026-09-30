import { test } from "node:test";
import assert from "node:assert/strict";
import { askFinder, numberSourceTexts, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";

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

// ─── Số "có sẵn" khi có lịch sử chat ────────────────────────────────────────
const SPHERE_HISTORY = [
  { role: "user", content: "Tính thể tích khối cầu bán kính 6cm" },
  { role: "assistant", content: "Bài này dùng công thức thể tích khối cầu nhé. $$V = \\frac{4}{3}\\pi \\cdot 6^3$$" },
];

test("numberSourceTexts: tin nhắn có số riêng là đề mới → chỉ lấy số của chính nó", () => {
  assert.deepEqual(numberSourceTexts("Tìm cực trị của y = x^3 - 3x^2 - 9x + 5", ["Tính thể tích khối cầu bán kính 6cm"]),
    ["Tìm cực trị của y = x^3 - 3x^2 - 9x + 5"]);
});

test("numberSourceTexts: câu hỏi nối tiếp không có số (kể cả 'bước 2') → lấy thêm số của câu trước", () => {
  const prev = ["Tính thể tích khối cầu bán kính 6cm"];
  assert.deepEqual(numberSourceTexts("Mình chưa hiểu, giải thích lại giúp mình", prev), ["Mình chưa hiểu, giải thích lại giúp mình", ...prev]);
  assert.deepEqual(numberSourceTexts("Giải thích lại bước 2 giúp mình", prev), ["Giải thích lại bước 2 giúp mình", ...prev]);
});

test("đề mới sau bài khối cầu R = 9: số 9 của đề trước KHÔNG còn làm lọt d = 9/3", async () => {
  const clock = { t: 0 };
  const reply = JSON.stringify({
    type: "solution", formula_ids: ["hh12-oxyz-khoangcach"], intro: "Bài này dùng công thức khoảng cách.",
    steps: [
      { title: "Thay số", detail: "Thay tọa độ $M$ và hệ số mặt phẳng:", expression: "d = \\frac{|2 \\cdot 1 - (-2) + 2 \\cdot 3 - 1|}{\\sqrt{2^2 + (-1)^2 + 2^2}}" },
      { title: "Tính", detail: "Ta được:", expression: "d = \\frac{9}{3}" },
    ],
    reminder: "Bạn tự tính nhé!",
  });
  const history = [
    { role: "user", content: "Tính thể tích khối cầu bán kính 9 cm" },
    { role: "assistant", content: "Bài này dùng công thức thể tích khối cầu nhé. $$V = \\frac{4}{3}\\pi \\cdot 9^3$$" },
  ];
  const groq = fakeGroq([reply], clock, 1000);
  const { meta } = await askFinder({ groq, message: "Tính khoảng cách từ M(1;−2;3) đến mặt phẳng 2x − y + 2z − 1 = 0", history, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(meta.removedSteps.length, 1);
  assert.equal(meta.removedSteps[0].title, "Tính");
  assert.deepEqual(meta.removedSteps[0].leaked, ["9"]);
});

test("câu hỏi nối tiếp không có số: nhắc lại số của đề trước (R = 6) vẫn được giữ", async () => {
  const clock = { t: 0 };
  const reply = JSON.stringify({
    type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Mình nhắc lại cách làm nhé.",
    steps: [{ title: "Thay số", detail: "Thay $R = 6$ vào công thức:", expression: "V = \\frac{4}{3}\\pi \\cdot 6^3" }],
    reminder: "Bạn tự tính nhé!",
  });
  const groq = fakeGroq([reply], clock, 1000);
  const { answer, meta } = await askFinder({ groq, message: "Mình chưa hiểu, giải thích lại giúp mình", history: SPHERE_HISTORY, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(meta.removedSteps.length, 0);
  assert.equal(answer.steps[0].expression, "V = \\frac{4}{3}\\pi \\cdot 6^3");
});
