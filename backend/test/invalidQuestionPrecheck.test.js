import { test } from "node:test";
import assert from "node:assert/strict";
import { precheckInvalidQuestion } from "../lib/invalidQuestionPrecheck.js";
import { positiveGroups, negativeGroups } from "../testHelpers/invalidQuestionCases.mjs";

for (const [group, cases] of Object.entries(positiveGroups)) {
  for (const [question, reason] of cases) {
    test(`${group}: chặn ${question}`, () => {
      const result = precheckInvalidQuestion(question);
      assert.equal(result?.reason, reason);
      assert.match(result.text, /Bạn .*đề|Bạn gửi/);
    });
  }
}

for (const [group, cases] of Object.entries(negativeGroups)) {
  for (const question of cases) {
    test(`${group}: cho qua ${question}`, () => {
      assert.equal(precheckInvalidQuestion(question, { hasHistory: question === "Giải tiếp" }), null);
    });
  }
}

test("lời chào đứng riêng vẫn bị chặn khi có lịch sử toán; câu chào kèm đề vẫn qua", () => {
  for (const question of ["xin chào", "chào", "hello", "hi", "alo", "xin chào bạn"]) {
    assert.equal(precheckInvalidQuestion(question, { hasHistory: true })?.reason, "no_math_problem", question);
  }
  for (const question of ["Chào bạn, tính diện tích tam giác có đáy 3", "Hi, tính góc A?"]) {
    assert.equal(precheckInvalidQuestion(question, { hasHistory: true }), null, question);
  }
});

test("câu nối tiếp trong phiên có lịch sử giữ luồng AI cũ", () => {
  for (const question of [
    "tại sao lại dùng công thức này?",
    "còn cách khác không?",
    "giải thích bước 2",
    "ok mình hiểu rồi",
    "cảm ơn",
  ]) {
    assert.equal(precheckInvalidQuestion(question, { hasHistory: true }), null, question);
  }
});
