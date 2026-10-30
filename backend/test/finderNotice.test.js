import { test } from "node:test";
import assert from "node:assert/strict";
import { askFinder, finalizeAnswer, noFormulaReason, withNonDeliveryNotice } from "../lib/finderAnswer.js";
import { appendRefundNotice, questionNotice, REFUND_NOTICE } from "../lib/finderNotice.js";

const MESSAGE = "Elip x²/25 + y²/9 = 1. Tính tiêu cự.";
const noFormula = (meta, message = MESSAGE, grade = null) => withNonDeliveryNotice({
  answer: { type: "no_formula", formulaIds: [], intro: "Câu mẫu cũ", steps: [], reminder: "" },
  reply: "Câu mẫu cũ", meta,
}, { message, grade });

test("mỗi reason no_formula có câu cố định, không lấy aiNote của model", () => {
  const cases = [
    [{ circleRejected: true }, "circle_guard", /không điền sẵn kết quả/],
    [{ baseKnowledge: { verified: false } }, "base_knowledge_reject", /chưa kiểm tra chắc cách làm/],
    [{ invalidData: { verified: false } }, "invalid_data_reject", /chưa kiểm tra được các số liệu/],
    [{ rawType: "no_formula", aiNote: "Dùng công thức chưa duyệt" }, "ai_refused", /chưa tìm thấy công thức phù hợp hoặc đề còn thiếu số liệu/],
    [{ rawType: "solution", droppedIds: ["fake-id"] }, "formula_ids_reject", /chưa kiểm tra được công thức/],
    [{}, "unknown", /chưa đủ thông tin chắc chắn/],
  ];
  for (const [meta, reason, pattern] of cases) {
    const out = noFormula(meta);
    assert.equal(noFormulaReason(out.meta), reason);
    assert.match(out.answer.intro, pattern);
    assert.equal(out.reply, out.answer.intro);
    assert.doesNotMatch(out.reply, /Dùng công thức chưa duyệt|Câu mẫu cũ|Lượt hỏi này không bị tính/);
    assert.deepEqual(out.answer.steps, []);
  }
});

test("hai góc vô lý: chỉ thông báo số từ đề và tổng kiểm chứng, không hướng dẫn giải", () => {
  const message = "Tam giác ABC có góc A = 100°, góc B = 90°. Tính góc C";
  const raw = { type: "solution", formula_ids: [], intro: "Tính góc C", steps: [
    { title: "Tổng góc", detail: "Bạn tính góc C", expression: String.raw`C = 180^\circ - A - B, \text{ với } A = 100^\circ, B = 90^\circ \Rightarrow C = ?` },
  ] };
  const checked = finalizeAnswer(raw, { message, mask: true, grade: 10 });
  assert.equal(checked.answer.type, "no_formula");
  const out = withNonDeliveryNotice(checked, { message, grade: 10 });
  assert.equal(noFormulaReason(out.meta), "invalid_angle_sum");
  assert.match(out.reply, /100° và 90° cộng lại đã 190°/);
  assert.doesNotMatch(out.reply, /C\s*=|công thức/);
  const valid = noFormula({ baseKnowledge: { verified: false } },
    "Tam giác ABC có góc A = 50°, góc B = 60°. Tính góc C", 10);
  assert.equal(noFormulaReason(valid.meta), "base_knowledge_reject");
  const separate = noFormula({ baseKnowledge: { verified: false } },
    "Tam giác ABC có góc A = 100°. Tam giác DEF có góc D = 90°.", 10);
  assert.equal(noFormulaReason(separate.meta), "base_knowledge_reject");
});

test("cạnh huyền vô lý: chỉ dùng tên cạnh và số đã cho; cạnh hợp lệ không bị gắn nhãn sai", () => {
  const question = "Tam giác ABC vuông tại A có BC = 5, AB = 6. Tính AC";
  const out = noFormula({ baseKnowledge: { verified: false } }, question, 10);
  assert.equal(noFormulaReason(out.meta), "invalid_hypotenuse");
  assert.match(out.reply, /BC = 5.*AB = 6/);
  const valid = noFormula({ baseKnowledge: { verified: false } },
    "Tam giác ABC vuông tại A có BC = 10, AB = 6. Tính AC", 10);
  assert.equal(noFormulaReason(valid.meta), "base_knowledge_reject");
});

test("ngoài phạm vi lớp 10 chỉ khi đã không giao được hướng dẫn; lớp 12 dùng câu chung", () => {
  const question = "Tính tích phân của x^2 từ 0 đến 1";
  assert.equal(noFormula({ rawType: "no_formula" }, question, 10).meta.noticeReason, "out_of_grade_scope");
  assert.match(questionNotice("ai_refused", question, 10).text, /kiến thức lớp 10/);
  assert.equal(noFormula({ rawType: "no_formula" }, question, 12).meta.noticeReason, "ai_refused");
});

test("invalid_data đã xác minh có câu riêng; ba cạnh hợp lệ nhưng AI báo sai không bị gọi là vô lý", () => {
  const bad = finalizeAnswer({ type: "invalid_data", formula_ids: [], sides: ["1", "2", "4"], intro: "Lời AI", steps: [] },
    { message: "Tam giác có ba cạnh 1, 2, 4. Tính diện tích." });
  const out = withNonDeliveryNotice(bad, { message: "Tam giác có ba cạnh 1, 2, 4. Tính diện tích." });
  assert.equal(out.answer.type, "invalid_data");
  assert.equal(out.meta.noticeReason, "invalid_triangle_sides");
  assert.match(out.reply, /1 \+ 2 < 4/);
  assert.match(out.reply, /Bạn kiểm tra lại đề giúp mình nhé/);
  assert.doesNotMatch(out.reply, /Lời AI/);

  const wrong = finalizeAnswer({ type: "invalid_data", formula_ids: [], sides: ["3", "4", "5"], intro: "Đề sai", steps: [] },
    { message: "Tam giác có ba cạnh 3, 4, 5. Tính diện tích." });
  const safe = withNonDeliveryNotice(wrong, { message: "Tam giác có ba cạnh 3, 4, 5. Tính diện tích." });
  assert.equal(safe.answer.type, "no_formula");
  assert.equal(safe.meta.noticeReason, "invalid_data_reject");
  assert.doesNotMatch(safe.reply, /không tạo thành tam giác|Đề sai/);
});

test("dòng không tính lượt chỉ hiện khi hoàn thành công, ở cả answer và reply", () => {
  const out = noFormula({ rawType: "no_formula" });
  assert.equal(appendRefundNotice(out, false), out);
  const refunded = appendRefundNotice(out, true);
  assert.equal(refunded.answer.reminder, REFUND_NOTICE);
  assert.ok(refunded.reply.endsWith(`\n${REFUND_NOTICE}`));
  const invalid = { answer: { type: "invalid_data", intro: "Ba cạnh không hợp lệ", reminder: "" }, reply: "Ba cạnh không hợp lệ" };
  assert.equal(appendRefundNotice(invalid, true).answer.reminder, REFUND_NOTICE);
  const solution = { answer: { type: "solution" }, reply: "Hướng dẫn" };
  assert.equal(appendRefundNotice(solution, true), solution);
});

test("askFinder thật qua Groq giả dùng thông báo cố định cho ai_refused", async () => {
  const groq = { chat: { completions: { create: async () => ({
    choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ type: "no_formula", formula_ids: [], intro: "Thiếu công thức bí mật", steps: [] }) } }],
    usage: { prompt_tokens: 5100, completion_tokens: 100 },
  }) } } };
  const out = await askFinder({ groq, message: MESSAGE });
  assert.equal(out.answer.type, "no_formula");
  assert.equal(out.meta.noticeReason, "ai_refused");
  assert.match(out.reply, /kiểm tra lại đề giúp mình/);
  assert.doesNotMatch(out.reply, /bí mật|Lượt hỏi này không bị tính/);
});
