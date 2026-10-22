import { test } from "node:test";
import assert from "node:assert/strict";
import { FINDER_SYSTEM_PROMPT } from "../lib/finderPrompt.js";
import { finalizeAnswer, countsAsTurn } from "../lib/finderAnswer.js";
import { checkTriangleSides, extractNumbers } from "../lib/solutionGuard.js";

const R = String.raw;

// Ca của mentor (2026-10-22): trước khi có invalid_data, model nhận ra 1 + 2 < 4 (aiNote trong log
// Render) nhưng chỉ chọn được no_formula → học sinh thấy "Thư viện FormulaX chưa có công thức…".
const MENTOR_Q = "Tam giác có ba cạnh 1, 2, 4, dùng công thức Hê-rông tính diện tích. Dữ liệu này có hợp lệ không?";

test("prompt: quy tắc 1f — invalid_data chỉ cho ba cạnh không thỏa bất đẳng thức tam giác, có trường sides", () => {
  const rule = FINDER_SYSTEM_PROMPT.split("\n").find((l) => l.startsWith("1f."));
  assert.ok(rule, "thiếu quy tắc 1f");
  assert.match(rule, /type = "invalid_data"/);
  assert.match(rule, /"sides"/);
  assert.match(rule, /Chỉ dùng invalid_data cho trường hợp này/);
  assert.match(FINDER_SYSTEM_PROMPT, /"type":"solution\|no_formula\|refuse_answer\|off_topic\|invalid_data"/);
});

test("ca mentor: ba cạnh 1, 2, 4 → invalid_data, giải thích 1 + 2 < 4, không có số tự tính, KHÔNG tính lượt (hoàn lại)", () => {
  const parsed = { type: "invalid_data", formula_ids: [], intro: "Ba cạnh này không tạo thành tam giác.", steps: [], reminder: "", sides: ["1", "2", "4"] };
  const { answer, reply, meta } = finalizeAnswer(parsed, { message: MENTOR_Q });
  assert.equal(answer.type, "invalid_data");
  assert.deepEqual(answer.formulaIds, []);
  assert.deepEqual(answer.steps, []);
  assert.equal(answer.intro, "Ba cạnh 1, 2, 4 không tạo thành tam giác vì $1 + 2 < 4$ — tổng hai cạnh bất kỳ phải lớn hơn cạnh còn lại. Vì vậy không có tam giác nào như vậy, nên không tính được diện tích hay các yếu tố khác của nó.");
  assert.doesNotMatch(answer.intro, /chưa có công thức/);
  assert.ok(answer.reminder);
  assert.match(reply, /1 \+ 2 < 4/);
  // Chỉ số của đề — không có tổng 3 hay số nào AI tự tính.
  const allowed = new Set(extractNumbers(MENTOR_Q).map(Number));
  for (const n of extractNumbers(`${answer.intro} ${answer.reminder}`)) assert.ok(allowed.has(Number(n)), `số lạ ${n}`);
  assert.deepEqual(meta.invalidData, { verified: true, sides: ["1", "2", "4"] });
  assert.equal(countsAsTurn(answer, meta), false);
});

test("ca mentor: câu của model bị thay bằng câu backend — model lỡ tính tổng (1 + 2 = 3) cũng không lộ ra", () => {
  const parsed = { type: "invalid_data", formula_ids: [], intro: "Vì 1 + 2 = 3 < 4 nên không có tam giác.", steps: [], reminder: "", sides: [1, 2, 4] };
  const { answer } = finalizeAnswer(parsed, { message: MENTOR_Q });
  assert.equal(answer.type, "invalid_data");
  assert.doesNotMatch(answer.intro, /= 3/);
});

test("tam giác hợp lệ 3, 4, 5 dùng Hê-rông → solution bình thường, không bị ảnh hưởng", () => {
  const message = "Tam giác có ba cạnh 3, 4, 5, dùng công thức Hê-rông tính diện tích.";
  const parsed = {
    type: "solution", formula_ids: ["hh10-herong"], intro: "Bài này dùng công thức Hê-rông nhé.",
    steps: [
      { title: "Tính nửa chu vi", detail: "Bạn tự tính $p$.", expression: R`p = \frac{a + b + c}{2}, \text{ với } a = 3, b = 4, c = 5 \Rightarrow p = ?` },
      { title: "Áp dụng công thức Hê-rông", detail: "Thay $p$ và ba cạnh vào công thức. Bạn tự tính $S$.", expression: R`S = \sqrt{p(p-a)(p-b)(p-c)}, \text{ với } a = 3, b = 4, c = 5 \Rightarrow S = ?` },
    ],
    reminder: "Bạn tự tính các ô ? nhé!",
  };
  const { answer, meta } = finalizeAnswer(parsed, { message, mask: true });
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh10-herong"]);
  assert.equal(answer.steps.length, 2);
  assert.deepEqual(answer.steps.map((s) => s.expression), parsed.steps.map((s) => s.expression));
  assert.deepEqual(meta.removedSteps, []);
  assert.deepEqual(meta.maskedSteps, []);
  assert.equal(meta.invalidData, undefined);
});

test("3, 4, 5 mà model lỡ báo invalid_data → backend kiểm lại thấy hợp lệ → no_formula (hoàn lượt), không nói đề sai", () => {
  const message = "Tam giác có ba cạnh 3, 4, 5, dùng công thức Hê-rông tính diện tích.";
  const parsed = { type: "invalid_data", formula_ids: [], intro: "Ba cạnh không hợp lệ.", steps: [], reminder: "", sides: ["3", "4", "5"] };
  const { answer, meta } = finalizeAnswer(parsed, { message });
  assert.equal(answer.type, "no_formula");
  assert.doesNotMatch(answer.intro, /không tạo thành tam giác/);
  assert.equal(meta.invalidData.verified, false);
  assert.equal(countsAsTurn(answer, meta), false);
});

test("câu hỏi tam giác không liên quan Hê-rông (định lý sin) → hành vi không đổi", () => {
  const message = "Cho tam giác ABC có BC = 10, góc B = 45°, góc C = 75°. Tính AC";
  const parsed = {
    type: "solution", formula_ids: ["hh10-dinhly-sin"], intro: "Bài này dùng định lý sin.",
    steps: [
      { title: "Tìm góc A", detail: "Tổng ba góc trong tam giác bằng $180^\\circ$. Bạn tự tính $A$.", expression: R`A = 180^\circ - B - C, \text{ với } B = 45^\circ, C = 75^\circ \Rightarrow A = ?` },
      { title: "Áp dụng định lý sin", detail: "Bạn tự tính $AC$.", expression: R`\frac{AC}{\sin B} = \frac{BC}{\sin A}, \text{ với } BC = 10 \Rightarrow AC = ?` },
    ],
    reminder: "Bạn tự tính các ô ? nhé!",
  };
  const { answer, meta } = finalizeAnswer(parsed, { message, mask: true });
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh10-dinhly-sin"]);
  assert.deepEqual(answer.steps.map((s) => s.expression), parsed.steps.map((s) => s.expression));
  assert.equal(answer.intro, parsed.intro);
  assert.deepEqual(meta.removedSteps, []);
  assert.equal(meta.invalidData, undefined);
});

test("checkTriangleSides: chỉ nhận đúng ba số có trong đề và thật sự vi phạm", () => {
  assert.equal(checkTriangleSides(["3", "4", "5"], "ba cạnh 3, 4, 5"), null); // hợp lệ
  assert.equal(checkTriangleSides(["1", "2", "5"], "ba cạnh 1, 2, 4"), null); // 5 không có trong đề
  assert.equal(checkTriangleSides(["1", "2"], "ba cạnh 1, 2, 4"), null); // thiếu cạnh
  assert.equal(checkTriangleSides(null, "ba cạnh 1, 2, 4"), null);
  assert.equal(checkTriangleSides(["\\sqrt{2}", "1", "4"], R`ba cạnh \sqrt{2}, 1, 4`), null); // không kiểm được
  assert.equal(checkTriangleSides(["0", "2", "4"], "ba cạnh 0, 2, 4"), null); // cạnh phải dương
  // Thứ tự đề cho không quan trọng; dấu $ thừa được bỏ.
  assert.match(checkTriangleSides(["$4$", "1", "2"], "AB = 4, BC = 1, CA = 2").intro, /Ba cạnh 4, 1, 2 .*\$1 \+ 2 < 4\$/);
});

test("checkTriangleSides: tổng bằng cạnh còn lại (1, 2, 3) cũng không tạo thành tam giác — viết dấu =", () => {
  assert.match(checkTriangleSides(["1", "2", "3"], "ba cạnh 1, 2, 3").intro, /\$1 \+ 2 = 3\$/);
});

test("checkTriangleSides: số thập phân viết dấu phẩy, không lệch vì sai số dấu phẩy động", () => {
  assert.match(checkTriangleSides(["1,5", "2,5", "4,5"], "ba cạnh 1,5; 2,5; 4,5 cm").intro, /Ba cạnh 1,5, 2,5, 4,5 .*\$1\{,\}5 \+ 2\{,\}5 < 4\{,\}5\$/);
  assert.match(checkTriangleSides(["0,1", "0,2", "0,3"], "ba cạnh 0,1; 0,2; 0,3").intro, /0\{,\}1 \+ 0\{,\}2 = 0\{,\}3/);
});
