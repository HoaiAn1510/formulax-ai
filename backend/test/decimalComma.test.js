import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { extractNumbers } from "../lib/solutionGuard.js";
import { finalizeAnswer } from "../lib/finderAnswer.js";

const question = "Tam giác có a = 3,5, b = 4,5, c = 6. Tính diện tích.";
// Dựng từ ba bước trước khi che đã ghi trong kết quả chấm #21; chuỗi JSON gốc của Groq không được lưu.
const capturedReply = JSON.parse(fs.readFileSync(new URL("./fixtures/eval-20261024-q21-reconstructed.json", import.meta.url), "utf8"));

test("đọc số thập phân phẩy/chấm như một số; giữ tọa độ, khoảng và danh sách", () => {
  assert.deepEqual(extractNumbers(question), ["3.5", "4.5", "6"]);
  assert.deepEqual(extractNumbers("a = 3.5; b = 4.5; c = 6"), ["3.5", "4.5", "6"]);
  assert.deepEqual(extractNumbers("ba cạnh 3,5; 4,5; 6"), ["3.5", "4.5", "6"]);
  assert.deepEqual(extractNumbers("A(1,2,3), x ∈ (-1,1), x = 0,1,2, x ∈ [0,2]"), ["1", "2", "3", "1", "1", "0", "1", "2", "0", "2"]);
  // Dấu chấm giữ vai trò thập phân: 1.000 được đọc là 1, không tự suy thành 1000.
  assert.deepEqual(extractNumbers("1.000"), ["1.000"]);
  assert.notEqual(Number(extractNumbers("1.000")[0]), 1000);
});

test("phát lại ba bước #21: dữ kiện 3,5; 4,5; 6 còn nguyên, chỉ diện tích ở ô ?", () => {
  const { answer, meta } = finalizeAnswer(capturedReply, { message: question, grade: 10, mask: true });
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh10-herong"]);
  assert.deepEqual(meta.maskedSteps, []);
  assert.deepEqual(meta.removedSteps, []);
  assert.match(answer.steps[0].detail, /a = 3\.5.*b = 4\.5.*c = 6/);
  assert.match(answer.steps[1].expression, /a = 3\.5, b = 4\.5, c = 6.*p = \?/);
  assert.match(answer.steps[2].expression, /a = 3\.5, b = 4\.5, c = 6.*S = \?/);
  const originalComma = { ...capturedReply, steps: [{ title: "Dữ kiện", detail: "Đề cho $a=3,5$, $b=4,5$, $c=6$.", expression: "" }] };
  const sameNotation = finalizeAnswer(originalComma, { message: question, grade: 10, mask: true });
  assert.match(sameNotation.answer.steps[0].detail, /a=3,5.*b=4,5.*c=6/);
  assert.deepEqual(sameNotation.meta.maskedSteps, []);
});

test("đáp án tính ra 10,5; 3.2; 0,5 vẫn bị che, dù đề có số thập phân", () => {
  for (const value of ["10,5", "3.2", "0,5"]) {
    const raw = { type: "solution", formula_ids: ["hh10-herong"], intro: "Dùng Hê-rông.",
      steps: [{ title: "Tính diện tích", detail: "Bạn tự tính.", expression: `S = ${value}` }], reminder: "Tự tính." };
    const { answer, meta } = finalizeAnswer(raw, { message: question, grade: 10, mask: true });
    assert.equal(answer.steps[0].expression, "S = ?", value);
    assert.equal(meta.maskedSteps.length, 1, value);
  }
});

test("1.000 không tự được coi là một nghìn: chỉ giữ đúng cách viết từ đề", () => {
  const q = "Tam giác có a = 1.000, b = 4, c = 5. Tính diện tích.";
  const reply = (value) => ({ type: "solution", formula_ids: ["hh10-herong"], intro: "Dùng Hê-rông.",
    steps: [{ title: "Dữ kiện", detail: `Đề cho $a=${value}$.`, expression: "" }], reminder: "" });
  assert.match(finalizeAnswer(reply("1.000"), { message: q, mask: true }).answer.steps[0].detail, /a=1\.000/);
  assert.match(finalizeAnswer(reply("1000"), { message: q, mask: true }).answer.steps[0].detail, /a=\?/);
});
