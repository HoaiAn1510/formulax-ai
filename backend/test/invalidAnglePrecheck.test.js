import { test } from "node:test";
import assert from "node:assert/strict";
import { precheckInvalidAngleSum } from "../lib/invalidAnglePrecheck.js";

const positive = [
  "Tam giác ABC có hai góc 100° và 90°. Tính góc còn lại nha",
  "Tam giác ABC có góc A = 100°, góc B = 90°. Tính góc C",
  "Tam giác ABC có A = 90°, B = 90°. Tính C",
  "ΔABC có hai góc 120° và 60°. Tìm góc còn lại",
  "Tam giác ABC có góc A = 100,5°, góc B = 79,5°. Tính C",
];

for (const question of positive) {
  test(`tiền kiểm chặn hai góc vô lý: ${question}`, () => {
    const result = precheckInvalidAngleSum(question);
    assert.equal(result?.reason, "invalid_angle_sum");
    assert.match(result.text, /không thể là hai góc của cùng một tam giác/);
    assert.doesNotMatch(result.text, /190°|C\s*=/);
  });
}

const negative = [
  "Tam giác ABC có góc A = 50°, góc B = 60°. Tính góc C",
  "Tam giác ABC có A = 100°, B = 79,5°. Tính C",
  "Tam giác ABC có A = 100°. Tam giác DEF có D = 90°. Tính góc còn lại",
  "Tam giác ABC có góc ngoài tại A = 100°, góc B = 90°. Tính góc C",
  "Tam giác ABC có hai góc 100° và x°. Tìm x",
  "Trong mặt phẳng Oxy, tam giác ABC có A(100; 90), B(1; 2). Tính AB",
  "Tam giác ABC cân tại A có góc B = 70°. Tính góc A",
];

for (const question of negative) {
  test(`tiền kiểm để câu không chắc chắn đi luồng cũ: ${question}`, () => {
    assert.equal(precheckInvalidAngleSum(question), null);
  });
}
