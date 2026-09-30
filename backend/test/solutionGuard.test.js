import { test } from "node:test";
import assert from "node:assert/strict";
import {
  repairLatexEscapes, parseModelJson, normalizeAnswer, extractNumbers,
  applyNumberGuard, neutralStep, hasBalancedBraces, dropBrokenExpressions, toReplyText, DEFAULT_TEXT,
} from "../lib/solutionGuard.js";

// String.raw giữ nguyên dấu \ — mỗi chuỗi dưới đây chính là văn bản JSON thô model trả về.
const parseExpr = (rawJson) => parseModelJson(rawJson)?.e;

test("escape: chuỗi đã escape đúng (\\\\frac) giữ nguyên, không bị nhân đôi thêm", () => {
  assert.equal(parseExpr(String.raw`{"e":"\\frac{1}{2}"}`), String.raw`\frac{1}{2}`);
  assert.equal(parseExpr(String.raw`{"e":"\\cdot \\neq \\times \\beta"}`), String.raw`\cdot \neq \times \beta`);
});

test("escape: lệnh LaTeX chưa escape vẫn giữ nguyên lệnh sau khi parse", () => {
  assert.equal(parseExpr(String.raw`{"e":"\frac{1}{2}"}`), String.raw`\frac{1}{2}`); // \f = form-feed nếu không sửa
  assert.equal(parseExpr(String.raw`{"e":"5 \cdot 2^4"}`), String.raw`5 \cdot 2^4`); // \c = escape không hợp lệ
  assert.equal(parseExpr(String.raw`{"e":"a \neq b"}`), String.raw`a \neq b`); // \n = xuống dòng nếu không sửa
  assert.equal(parseExpr(String.raw`{"e":"2 \times 3"}`), String.raw`2 \times 3`); // \t = tab
  assert.equal(parseExpr(String.raw`{"e":"\beta + \theta"}`), String.raw`\beta + \theta`); // \b = backspace
  assert.equal(parseExpr(String.raw`{"e":"\left( \sqrt{x} \right) \, \{1\}"}`), String.raw`\left( \sqrt{x} \right) \, \{1\}`);
});

test("escape: trộn đúng và sai trong cùng một chuỗi", () => {
  assert.equal(parseExpr(String.raw`{"e":"\\frac{a}{b} + \sqrt{2} - \\pi"}`), String.raw`\frac{a}{b} + \sqrt{2} - \pi`);
});

test("escape: escape JSON hợp lệ không bị đổi nghĩa", () => {
  assert.equal(parseExpr(String.raw`{"e":"nói \"chào\""}`), 'nói "chào"');
  assert.equal(parseExpr(String.raw`{"e":"a\/b"}`), "a/b");
  assert.equal(parseExpr(String.raw`{"e":"\u00e1"}`), "á");
  assert.equal(parseExpr(String.raw`{"e":"dòng 1\n"}`), "dòng 1\n");
  assert.equal(parseExpr(String.raw`{"e":"a\t b"}`), "a\t b");
  assert.equal(repairLatexEscapes(String.raw`\\\\`), String.raw`\\\\`); // 2 cặp \\ đã escape
});

test("parse: cứu được JSON có chữ thừa bao quanh, trả null khi hỏng hẳn", () => {
  assert.deepEqual(parseModelJson('Đây là kết quả:\n{"type":"off_topic"}\nHết.'), { type: "off_topic" });
  assert.equal(parseModelJson('{"type": "solution", "steps": ['), null);
  assert.equal(parseModelJson(""), null);
  assert.equal(parseModelJson("[1,2]"), null);
});

const validIds = new Set(["hh12-matcau-thetich", "ds11-csc-tong"]);
const isValid = (id) => validIds.has(id);

test("normalize: bỏ id không có thật, bỏ trường lạ (kể cả result), giới hạn bước", () => {
  const { answer, droppedIds } = normalizeAnswer({
    type: "solution",
    formula_ids: ["hh12-matcau-thetich", "ds12-sophuc-modun", "hh12-matcau-thetich"],
    intro: "Mở đầu",
    steps: Array.from({ length: 9 }, (_, i) => ({ title: `B${i}`, detail: `làm ${i}`, expression: "$x$" })),
    reminder: "Tự tính nhé",
    result: "V = 36\\pi",
  }, isValid);
  assert.deepEqual(answer.formulaIds, ["hh12-matcau-thetich"]);
  assert.deepEqual(droppedIds, ["ds12-sophuc-modun"]); // bản trùng của id hợp lệ không tính là bị bỏ
  assert.equal(answer.steps.length, 6);
  assert.equal(answer.steps[0].expression, "x"); // bỏ $ bao ngoài
  assert.equal("result" in answer, false);
});

test("normalize: lời giải không còn id hợp lệ nào → no_formula", () => {
  const { answer } = normalizeAnswer({ type: "solution", formula_ids: ["khong-ton-tai"], steps: [{ detail: "x" }] }, isValid);
  assert.equal(answer.type, "no_formula");
  assert.deepEqual(answer.steps, []);
  assert.equal(answer.intro, DEFAULT_TEXT.noFormulaIntro);
});

test("normalize: \\\\cdot bị escape thừa được thu về \\cdot; no_formula không giữ reminder", () => {
  const { answer } = normalizeAnswer({
    type: "solution", formula_ids: ["ds11-csc-tong"],
    steps: [{ title: "t", detail: String.raw`dùng $u_1 \\cdot q^{n-1}$`, expression: String.raw`2 \\cdot 3^{6-1}` }],
  }, isValid);
  assert.equal(answer.steps[0].detail, String.raw`dùng $u_1 \cdot q^{n-1}$`);
  assert.equal(answer.steps[0].expression, String.raw`2 \cdot 3^{6-1}`);
  const nf = normalizeAnswer({ type: "no_formula", intro: "Thư viện chưa có.", reminder: "Bạn tra công thức Cardano trong sách nhé" }, isValid).answer;
  assert.equal(nf.reminder, "");
  assert.equal(nf.intro, "Thư viện chưa có.");
});

test("normalize: type lạ / thiếu trường vẫn ra khung an toàn", () => {
  assert.equal(normalizeAnswer({}, isValid).answer.type, "no_formula");
  assert.equal(normalizeAnswer({ type: "hack", formula_ids: ["ds11-csc-tong"], steps: [{ detail: "a" }] }, isValid).answer.type, "solution");
  assert.equal(normalizeAnswer(null, isValid).answer.type, "no_formula");
});

test("extractNumbers: bỏ qua chỉ số dưới, số mũ đơn vị, số thứ tự bước", () => {
  assert.deepEqual(extractNumbers(String.raw`x_{1,2} = \frac{-b \pm \sqrt{\Delta}}{2a}`), ["2"]);
  assert.deepEqual(extractNumbers(String.raw`u_{20} = u_1 + (20-1)\cdot 4`), ["20", "1", "4"]);
  assert.deepEqual(extractNumbers(String.raw`đơn vị là $\text{cm}^3$, hoặc cm^2, m²`), []);
  // Trường hợp chặn nhầm gặp khi chấm 20b: đơn vị viết "cm$^2$" và "\text{ cm}^{2}"
  assert.deepEqual(extractNumbers(String.raw`$B = 12$ cm$^2$ và $12\text{ cm}^{2}$`), ["12", "12"]);
  assert.deepEqual(extractNumbers("Như ở bước 2, thay vào"), []);
  assert.deepEqual(extractNumbers(String.raw`\pi \approx 3{,}14`), ["3.14"]);
});

const sphereAnswer = (steps, extra = {}) => ({
  type: "solution", formulaIds: ["hh12-matcau-thetich"], intro: "Dùng công thức thể tích khối cầu.", reminder: "Tự tính nhé!", steps, ...extra,
});
const sphereCtx = { sourceTexts: ["Tính thể tích khối cầu bán kính 6 cm"], formulaTexts: [String.raw`V = \frac{4}{3}\pi R^3`] };

test("guard: bước chỉ thay số (số có trong đề/công thức) được giữ", () => {
  const { answer, removedSteps } = applyNumberGuard(sphereAnswer([
    { title: "Dữ kiện", detail: "Đề cho $R = 6$ cm.", expression: "" },
    { title: "Thay số", detail: "Thay $R = 6$:", expression: String.raw`V = \frac{4}{3}\pi \cdot 6^3` },
    { title: "Thứ tự", detail: String.raw`Tính lũy thừa trước; đơn vị $\text{cm}^3$.`, expression: "" },
  ]), sphereCtx);
  assert.equal(answer.steps.length, 3);
  assert.equal(removedSteps.length, 0);
});

test("guard: bước có kết quả tính ra (216, 288) được thay bằng bước trung tính, reminder có số lạ bị thay", () => {
  const { answer, removedSteps, replaced } = applyNumberGuard(sphereAnswer([
    { title: "Thay số", detail: "Thay $R = 6$:", expression: String.raw`V = \frac{4}{3}\pi \cdot 6^3` },
    { title: "Tính", detail: "Ta có $6^3 = 216$.", expression: String.raw`V = 288\pi` },
  ], { reminder: "Đáp án là 288π" }), { ...sphereCtx, formulaNames: ["Thể tích khối cầu"] });
  assert.equal(answer.steps.length, 2);
  assert.equal(answer.steps[1].title, "Thay số vào công thức");
  assert.equal(answer.steps[1].detail, "Thay các dữ kiện vào công thức Thể tích khối cầu (xem thẻ ở trên), giữ nguyên các phép toán, chưa tính.");
  assert.deepEqual(removedSteps[0].leaked.sort(), ["216", "288"]);
  assert.deepEqual(replaced, ["reminder"]);
  assert.equal(answer.reminder, DEFAULT_TEXT.reminder);
});

// Tình huống thật khi chấm: đạo hàm y = x^5 tại x = 2, model hạ bậc 5-1 thành 4 ở 2 bước liền nhau.
const derivCtx = {
  sourceTexts: ["Tính đạo hàm của y = x^5 tại x = 2"],
  formulaTexts: [String.raw`(x^n)' = n \cdot x^{n-1} \quad (n \in \mathbb{N}^*)`],
  formulaNames: ["Đạo hàm các hàm số cơ bản"],
};
const derivSteps = [
  { title: "Xác định dữ kiện", detail: "Hàm $y = x^5$, điểm $x = 2$.", expression: "" },
  { title: "Áp dụng công thức", detail: "Với $n = 5$:", expression: "y' = 5 \\cdot x^{4}" },
  { title: "Thay x", detail: "Thay $x = 2$:", expression: "y' = 5 \\cdot 2^{4}" },
  { title: "Tính theo thứ tự", detail: "Tính lũy thừa trước rồi nhân.", expression: "" },
];

test("guard: nhiều bước bị lọc liên tiếp → gộp thành 1 bước trung tính, giữ đúng vị trí", () => {
  const { answer, removedSteps } = applyNumberGuard(
    { type: "solution", formulaIds: ["gt12-daoham-basic"], intro: "Dùng công thức đạo hàm.", reminder: "Tự tính nhé!", steps: derivSteps },
    derivCtx,
  );
  assert.equal(removedSteps.length, 2);
  assert.deepEqual(answer.steps.map((st) => st.title), ["Xác định dữ kiện", "Thay số vào công thức", "Tính theo thứ tự"]);
  assert.equal(answer.steps[1].neutral, true);
  assert.equal(answer.steps[1].expression, "");
});

test("guard: bước bị lọc chỉ có lời văn (không biểu thức) thì bỏ hẳn, không thêm bước trung tính", () => {
  const { answer } = applyNumberGuard(sphereAnswer([
    { title: "Thay số", detail: "Thay $R = 6$:", expression: String.raw`V = \frac{4}{3}\pi \cdot 6^3` },
    { title: "Nhận xét", detail: "Ta được khoảng 904 đơn vị.", expression: "" },
    { title: "Đơn vị", detail: String.raw`Ghi đơn vị $\text{cm}^3$.`, expression: "" },
  ]), sphereCtx);
  assert.deepEqual(answer.steps.map((st) => st.title), ["Thay số", "Đơn vị"]);
});

test("guard: bước trung tính không chứa con số nào, kể cả khi tên công thức có chữ số", () => {
  assert.deepEqual(extractNumbers(neutralStep(["Thể tích khối cầu"]).detail), []);
  const withDigit = neutralStep(["Công thức lượng giác lớp 11"]);
  assert.deepEqual(extractNumbers(withDigit.detail), []);
  assert.equal(withDigit.detail, "Thay các dữ kiện vào công thức (xem thẻ ở trên), giữ nguyên các phép toán, chưa tính.");
  assert.match(neutralStep(["Tổng n số hạng đầu của Cấp số cộng", "Số hạng tổng quát của Cấp số cộng"]).detail,
    /công thức Tổng n số hạng đầu của Cấp số cộng, Số hạng tổng quát của Cấp số cộng/);
});

test("guard: bỏ hết bước thì vẫn giữ công thức, intro chuyển sang hướng dẫn xem ví dụ", () => {
  const { answer } = applyNumberGuard(sphereAnswer([{ title: "Tính", detail: "V = 288π", expression: "" }]), sphereCtx);
  assert.equal(answer.steps.length, 0);
  assert.deepEqual(answer.formulaIds, ["hh12-matcau-thetich"]);
  assert.equal(answer.intro, DEFAULT_TEXT.allStepsRemoved);
});

test("ngoặc: phát hiện lệch {} và \\left/\\right, bỏ biểu thức nhưng giữ bước", () => {
  assert.equal(hasBalancedBraces(String.raw`c = \sqrt{7^2 + 8^2}`), true);
  assert.equal(hasBalancedBraces(String.raw`c = \sqrt{7^2 + 8^2`), false);
  assert.equal(hasBalancedBraces(String.raw`\left( a \right)`), true);
  assert.equal(hasBalancedBraces(String.raw`\left( a`), false);
  assert.equal(hasBalancedBraces(String.raw`\{ 1; 2 \}`), true);
  const { answer, dropped } = dropBrokenExpressions(sphereAnswer([{ title: "x", detail: "Lấy căn:", expression: String.raw`\sqrt{2` }]));
  assert.equal(dropped, 1);
  assert.equal(answer.steps.length, 1);
  assert.equal(answer.steps[0].expression, "");
});

test("reply: bản văn bản có công thức + các bước, không có mục kết quả", () => {
  const text = toReplyText(sphereAnswer([{ title: "Thay số", detail: "Thay R:", expression: "V = 1" }]),
    (id) => ({ "hh12-matcau-thetich": { name: "Thể tích khối cầu" } })[id]);
  assert.match(text, /\*\*Công thức sử dụng:\*\* Thể tích khối cầu/);
  assert.match(text, /\*\*Bước 1 — Thay số:\*\* Thay R:/);
  assert.match(text, /\$\$V = 1\$\$/);
  assert.doesNotMatch(text, /Kết quả/);
});
