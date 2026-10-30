import { test } from "node:test";
import assert from "node:assert/strict";
import { askFinder, countsAsTurn, noFormulaReason, fallbackState, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "../lib/finderPrompt.js";

const R = String.raw;
// Ca 3 của bộ chấm (2026-10-30): ba cạnh 3, 4, 5 hợp lệ nhưng Gemini khẳng định sai "không tạo thành tam giác" (4/10 lần).
const Q = "Tam giác ABC có AB = 3, AC = 4, BC = 5. Tính bán kính đường tròn ngoại tiếp.";

const wrongInvalid = JSON.stringify({ type: "invalid_data", formula_ids: [], intro: "Ba cạnh này không tạo thành tam giác.", steps: [], reminder: "", sides: ["3", "4", "5"] });
const solution = JSON.stringify({
  type: "solution", formula_ids: ["hh10-bankinh-ngoaitiep"], intro: "Bài này dùng công thức bán kính đường tròn ngoại tiếp.",
  steps: [{ title: "Tính R", detail: "Bạn tự tính $R$.", expression: R`R = \frac{abc}{4S}, \text{ với } a = 5, b = 4, c = 3 \Rightarrow R = ?` }],
  reminder: "Bạn tự tính các ô ? nhé!",
});

// Gemini giả ghi lại từng yêu cầu gửi đi (để kiểm lời nhắc hỏi lại) và trả lần lượt các câu trả lời / lỗi.
function fakeModel(replies) {
  const requests = [];
  return {
    requests,
    chat: { completions: { create: async (body) => {
      requests.push(body);
      const reply = replies[requests.length - 1];
      if (reply instanceof Error) throw reply;
      return { choices: [{ message: { content: reply }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 10 } };
    } } },
    enforcesTpmCap: false,
  };
}
const ask = (groq, message = Q) => askFinder({ groq, message, grade: 10, now: () => 0, deadline: CHAT_BUDGET_MS });

test("AI báo invalid_data sai, hỏi lại một lần ra solution → trả solution, tính lượt", async () => {
  const groq = fakeModel([wrongInvalid, solution]);
  const { answer, meta } = await ask(groq);
  assert.equal(groq.requests.length, 2);
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh10-bankinh-ngoaitiep"]);
  assert.equal(meta.attempts, 2);
  assert.deepEqual(meta.retriedForInvalidData, { sides: ["3", "4", "5"], outcome: "solution" });
  assert.equal(countsAsTurn(answer, meta), true);
  // Lần hỏi lại nối tiếp câu trả lời sai của AI và nói rõ kiểm tra của hệ thống, không khẳng định bừa.
  const msgs = groq.requests[1].messages;
  assert.equal(msgs.at(-2).role, "assistant");
  assert.match(msgs.at(-2).content, /invalid_data/);
  assert.match(msgs.at(-1).content, /Hệ thống đã kiểm tra lại/);
  assert.match(msgs.at(-1).content, /Chỉ trả về JSON/);
});

test("hỏi lại vẫn invalid_data không kiểm chứng được → no_formula như cũ, hoàn lượt, đúng một lần hỏi lại", async () => {
  const groq = fakeModel([wrongInvalid, wrongInvalid, wrongInvalid]);
  const { answer, meta } = await ask(groq);
  assert.equal(groq.requests.length, 2, "không hỏi lại lần thứ ba");
  assert.equal(answer.type, "no_formula");
  assert.equal(meta.invalidData.verified, false);
  assert.equal(noFormulaReason(meta), "invalid_data_reject");
  assert.equal(meta.retriedForInvalidData.outcome, "invalid_data");
  assert.equal(countsAsTurn(answer, meta), false);
});

test("hỏi lại gặp lỗi (429 ngày / mạng) hoặc JSON hỏng → giữ no_formula như cũ, không ném lỗi", async () => {
  for (const second of [Object.assign(new Error("boom"), { status: 500 }), "không phải json", Object.assign(new Error("429"), { status: 429 })]) {
    const groq = fakeModel([wrongInvalid, second]);
    const { answer, meta } = await ask(groq);
    assert.equal(answer.type, "no_formula");
    assert.equal(noFormulaReason(meta), "invalid_data_reject");
    assert.ok(meta.retriedForInvalidData.error, "ghi lý do hỏi lại thất bại");
  }
});

test("không còn đủ thời gian để hỏi lại → giữ no_formula, chỉ một lần gọi", async () => {
  const groq = fakeModel([wrongInvalid, solution]);
  const { answer } = await askFinder({ groq, message: Q, grade: 10, now: () => 0, deadline: 5_000 });
  assert.equal(groq.requests.length, 1);
  assert.equal(answer.type, "no_formula");
});

test("1, 2, 4 thật sự vi phạm → invalid_data, chỉ gọi AI một lần, không hỏi lại", async () => {
  const message = "Tam giác có ba cạnh 1, 2, 4, dùng công thức Hê-rông tính diện tích.";
  const real = JSON.stringify({ type: "invalid_data", formula_ids: [], intro: "Không tạo thành tam giác.", steps: [], reminder: "", sides: ["1", "2", "4"] });
  const groq = fakeModel([real, solution]);
  const { answer, meta } = await ask(groq, message);
  assert.equal(groq.requests.length, 1);
  assert.equal(answer.type, "invalid_data");
  assert.match(answer.intro, /1 \+ 2 < 4/);
  assert.equal(meta.retriedForInvalidData, undefined);
  assert.equal(countsAsTurn(answer, meta), false);
});

test("lần đầu đã là solution → không hỏi lại vì invalid_data", async () => {
  const groq = fakeModel([solution]);
  const { answer, meta } = await ask(groq);
  assert.equal(groq.requests.length, 1);
  assert.equal(answer.type, "solution");
  assert.equal(meta.retriedForInvalidData, undefined);
});

test("hỏi lại bằng model chính bị 429 theo phút → hỏi lại bằng model dự phòng", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeModel([wrongInvalid, Object.assign(new Error("rate limit"), { status: 429 }), solution]);
  const { answer, meta } = await ask(groq);
  assert.deepEqual(groq.requests.map((r) => r.model), [FINDER_MODEL, FINDER_MODEL, FINDER_FALLBACK_MODEL]);
  assert.equal(answer.type, "solution");
  assert.equal(meta.retriedForInvalidData.model, FINDER_FALLBACK_MODEL);
  fallbackState.primaryBlockedUntil = 0;
});
