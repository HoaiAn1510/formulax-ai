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
