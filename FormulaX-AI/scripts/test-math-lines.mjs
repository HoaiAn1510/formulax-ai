// Test tách biểu thức dài của AI Finder thành nhiều dòng (src/utils/mathLines.js). Chạy: npm run test:math
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitMathLines } from "../src/utils/mathLines.js";

const R = String.raw;

test("ví dụ thật 1: R = a/(2 sin A), với a = 5 ⇒ R = ?", () => {
  assert.deepEqual(splitMathLines(R`R = \frac{a}{2\sin A}, \text{ với } a = 5 \Rightarrow R = ?`), [
    [R`R = \frac{a}{2\sin A}`],
    [R`\text{ với } a = 5`],
    [R`\Rightarrow R = ?`],
  ]);
});

test("ví dụ thật 2: dữ kiện 'b = 12, c = 5' là khúc mềm trong cùng dòng 'với'", () => {
  assert.deepEqual(splitMathLines(R`\sin A = \frac{2S}{bc}, \text{ với } b = 12, c = 5 \Rightarrow \sin A = ?`), [
    [R`\sin A = \frac{2S}{bc}`],
    [R`\text{ với } b = 12,`, "c = 5"],
    [R`\Rightarrow \sin A = ?`],
  ]);
});

test("ví dụ thật 3: hai biểu thức độc lập ngăn bằng dấu phẩy → hai dòng; không tách trong căn", () => {
  assert.deepEqual(splitMathLines(R`p = \frac{a+b+c}{2}, S = \sqrt{p(p-a)(p-b)(p-c)}`), [
    [R`p = \frac{a+b+c}{2}`],
    [R`S = \sqrt{p(p-a)(p-b)(p-c)}`],
  ]);
});

test("không tách bên trong ngoặc, phân số, căn, tập hợp, tọa độ", () => {
  for (const s of [
    R`\sqrt{p(p-a), (p-b)}`,
    R`f(x, y) = x + y`,
    R`A(1; 5)`,
    R`\frac{a, b}{c}`,
    R`S = \{1, 2, 3\}`,
    R`x \in [0; 3]`,
  ]) assert.deepEqual(splitMathLines(s), [[s]], s);
});

test("dấu phân cách có khoảng trắng LaTeX (\\;, \\quad) giữa các ô ? độc lập → mỗi ô một dòng", () => {
  assert.deepEqual(splitMathLines(R`y(0) = ?,\; y(x_1) = ?,\; y(3) = ?`), [["y(0) = ?"], ["y(x_1) = ?"], ["y(3) = ?"]]);
  assert.deepEqual(splitMathLines(R`\max_{[0;3]} y = ?,\quad \min_{[0;3]} y = ?`), [[R`\max_{[0;3]} y = ?`], [R`\min_{[0;3]} y = ?`]]);
});

test("danh sách ký hiệu (không có '=' ở mỗi phần) chỉ là khúc mềm, không ép xuống dòng", () => {
  assert.deepEqual(splitMathLines(R`\Rightarrow x_1, x_2 = ?`), [[R`\Rightarrow x_1,`, "x_2 = ?"]]);
});

test("'với' viết dính hoặc có \\ phía trước; ⇒ Unicode; biểu thức ngắn không đổi", () => {
  assert.deepEqual(splitMathLines(R`V = \frac{4}{3}\pi R^3,\ \text{với } R = 5 ⇒ V = ?`), [
    [R`V = \frac{4}{3}\pi R^3`],
    [R`\text{với } R = 5`],
    ["⇒ V = ?"],
  ]);
  assert.deepEqual(splitMathLines(R`y' = 3x^2 - 12`), [[R`y' = 3x^2 - 12`]]);
  assert.deepEqual(splitMathLines(""), []);
});

test("không chắc chắn (ngoặc lệch, \\begin…\\end) → giữ nguyên một khúc", () => {
  assert.deepEqual(splitMathLines(R`a = \frac{1}{2, b = 3`), [[R`a = \frac{1}{2, b = 3`]]);
  const cases = R`f(x) = \begin{cases} 1, & x > 0 \\ 0, & x \le 0 \end{cases}`;
  assert.deepEqual(splitMathLines(cases), [[cases]]);
});

test("ô ? luôn nằm trọn trong một khúc (không bị tách khỏi vế trái của nó)", () => {
  const inputs = [
    R`R = \frac{a}{2\sin A}, \text{ với } a = 5 \Rightarrow R = ?`,
    R`\sin A = \frac{2S}{bc}, \text{ với } b = 12, c = 5 \Rightarrow \sin A = ?`,
    R`BC^2 = b^2 + c^2 - 2bc\cos A,\ \text{với } b = AC = 8,\ c = AB = 5,\ A = 60^\circ \Rightarrow BC = ?`,
  ];
  for (const s of inputs) {
    const chunks = splitMathLines(s).flat();
    const withBlank = chunks.filter((c) => c.includes("?"));
    assert.equal(withBlank.length, 1, s);
    assert.match(withBlank[0], /=\s*\?$/);
    assert.equal(chunks.join(" ").replace(/[\s,]/g, "").length > 0, true);
  }
});
