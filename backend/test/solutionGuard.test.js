import { test } from "node:test";
import assert from "node:assert/strict";
import {
  repairLatexEscapes, parseModelJson, normalizeAnswer, extractNumbers,
  applyNumberGuard, mathLeaks, neutralStep, hasBalancedBraces, dropBrokenExpressions, toReplyText, DEFAULT_TEXT,
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
});

test("normalize: no_formula không nêu tên phương pháp còn thiếu cho học sinh — chỉ giữ trong aiNote để ghi log", () => {
  const note = "Thư viện hiện chưa có công thức cho dạng này vì cần dùng phương pháp tích phân từng phần (integration by parts).";
  const { answer, aiNote } = normalizeAnswer({ type: "no_formula", intro: note }, isValid);
  assert.equal(answer.intro, DEFAULT_TEXT.noFormulaIntro);
  assert.ok(!answer.intro.includes("từng phần"));
  assert.equal(aiNote, note.slice(0, 150));
  assert.equal(normalizeAnswer({ type: "solution", formula_ids: ["ds11-csc-tong"], intro: "Dùng CSC.", steps: [{ detail: "a" }] }, isValid).aiNote, "");
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

// Đạo hàm y = x^5 tại x = 2. Rút gọn biểu thức còn chứa biến (y' = 5x^4) là ĐƯỢC; thay x = 2 rồi
// giữ nguyên phép toán (5 · 2^4) cũng được; tính ra 80 thì bị lọc.
const derivCtx = {
  sourceTexts: ["Tính đạo hàm của y = x^5 tại x = 2"],
  formulaTexts: [String.raw`(x^n)' = n \cdot x^{n-1} \quad (n \in \mathbb{N}^*)`],
  formulaNames: ["Đạo hàm các hàm số cơ bản"],
};
const derivAnswer = (steps) => ({ type: "solution", formulaIds: ["gt12-daoham-basic"], intro: "Dùng công thức đạo hàm.", reminder: "Tự tính nhé!", steps });

test("guard: rút gọn biểu thức còn chứa biến (x^4) và thay số chưa tính (5 · 2^4) được giữ", () => {
  const { answer, removedSteps } = applyNumberGuard(derivAnswer([
    { title: "Xác định dữ kiện", detail: "Hàm $y = x^5$, điểm $x = 2$.", expression: "" },
    { title: "Áp dụng công thức", detail: "Với $n = 5$:", expression: "y' = 5 \\cdot x^{4}" },
    { title: "Thay x", detail: "Thay $x = 2$:", expression: "y'(2) = 5 \\cdot 2^{4}" },
  ]), derivCtx);
  assert.equal(removedSteps.length, 0);
  assert.equal(answer.steps.length, 3);
});

test("guard: nhiều bước bị lọc liên tiếp → gộp thành 1 bước trung tính, giữ đúng vị trí", () => {
  const { answer, removedSteps } = applyNumberGuard(derivAnswer([
    { title: "Xác định dữ kiện", detail: "Hàm $y = x^5$, điểm $x = 2$.", expression: "" },
    { title: "Tính", detail: "Ta có $2^4 = 16$.", expression: "y'(2) = 5 \\cdot 16" },
    { title: "Kết quả", detail: "Vậy:", expression: "y'(2) = 80" },
    { title: "Tính theo thứ tự", detail: "Tính lũy thừa trước rồi nhân.", expression: "" },
  ]), derivCtx);
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

// ─── "Không tính" theo định nghĩa 2026-09-30: được rút gọn biểu thức còn chứa biến, cấm giá trị số ──
const R = String.raw;
const CUCTRI_Q = "Tìm cực trị của hàm số y = x^3 - 3x^2 - 9x + 5";
const leaksOf = (latex, question = CUCTRI_Q, extraAllowed = []) =>
  mathLeaks(latex, new Set(["0", "1", ...extractNumbers(question), ...extraAllowed]), question).leaks;

test("không tính — ĐƯỢC: rút gọn biểu thức còn chứa biến, số mới là hệ số / số mũ của biến", () => {
  assert.deepEqual(leaksOf(R`y' = 3x^2 - 6x - 9`), []);
  assert.deepEqual(leaksOf(R`3x^2 - 6x - 9 = 0 \Leftrightarrow x^2 - 2x - 3 = 0`), []);
  assert.deepEqual(leaksOf(R`t^2 - 4t + 3 < 0`, "Giải bất phương trình 3^(2x) − 4·3^x + 3 < 0"), []);
  assert.deepEqual(leaksOf(R`y' = 4x^3 - 16x`, "Tìm GTLN, GTNN của y = x^4 − 8x^2 + 3 trên đoạn [−1; 3]"), []);
  assert.deepEqual(leaksOf(R`y = 10(x - 2) + 5`, "Viết phương trình tiếp tuyến của y = x^3 − 2x + 1 tại điểm có hoành độ 2"), ["5"]);
});

test("không tính — ĐƯỢC: thay số giữ nguyên phép toán, nhắc lại dữ kiện, điều kiện chưa giải", () => {
  assert.deepEqual(leaksOf(R`V = \frac{4}{3}\pi \cdot 5^3`, "Tính thể tích khối cầu bán kính R = 5", ["4", "3"]), []);
  assert.deepEqual(leaksOf(R`a = 1, b = -5, c = 6`, "Giải phương trình x^2 - 5x + 6 = 0"), []);
  assert.deepEqual(leaksOf(R`x_{1,2} = \frac{-(-5) \pm \sqrt{\Delta}}{2 \cdot 1}`, "Giải phương trình x^2 - 5x + 6 = 0", ["2"]), []);
  assert.deepEqual(leaksOf(R`x + 1 > 0, x - 1 > 0`, "Giải phương trình log₂(x + 1) + log₂(x − 1) = 3"), []);
  assert.deepEqual(leaksOf(R`f'(x) = 0`), []);
  assert.deepEqual(leaksOf(R`x_0 = 2`, "Viết phương trình tiếp tuyến của y = x^3 − 2x + 1 tại điểm có hoành độ 2"), []);
});

// Bài có tham số: đại lượng đề hỏi phải dừng ở dạng thay số chưa rút gọn.
const CHOP_Q = "Hình chóp S.ABCD đáy hình vuông cạnh a, SA ⊥ đáy, SA = a√2. Tính thể tích";

test("tham số — CẤM: đại lượng đề hỏi viết ở dạng đã rút gọn (đáp án cuối)", () => {
  assert.ok(leaksOf(R`V = \frac{a^3\sqrt{2}}{3}`, CHOP_Q, ["3"]).length > 0);
  assert.ok(leaksOf(R`V = \frac{\sqrt{2}}{3} a^3`, CHOP_Q, ["3"]).length > 0);
  assert.ok(leaksOf(R`d = \frac{a\sqrt{3}}{2}`, "Cho hình lập phương cạnh a. Tính khoảng cách từ A đến (BCD)").length > 0);
});

test("tham số — ĐƯỢC: thay số chưa rút gọn, đại lượng trung gian, nhắc lại dữ kiện", () => {
  assert.deepEqual(leaksOf(R`V = \frac{1}{3} \cdot a^2 \cdot a\sqrt{2}`, CHOP_Q, ["3"]), []);
  assert.deepEqual(leaksOf(R`B = a^2`, CHOP_Q), []); // diện tích đáy — đề không hỏi
  assert.deepEqual(leaksOf(R`h = SA = a\sqrt{2}`, CHOP_Q), []);
  assert.deepEqual(leaksOf(R`V = \frac{1}{3} B h`, CHOP_Q, ["3"]), []); // nhắc công thức
});

test("công thức nghiệm — ĐƯỢC giữ Δ ký hiệu hoặc thay số chưa tính (mọi số có sẵn); CẤM một giá trị đã tính", () => {
  const ctx = [...extractNumbers(CUCTRI_Q), "6", "4"]; // 6 từ y' ở bước trước, 4 từ công thức Δ
  assert.deepEqual(leaksOf(R`x_{1,2} = \frac{6 \pm \sqrt{\Delta}}{2 \cdot 3}`, CUCTRI_Q, ctx), []);
  assert.deepEqual(leaksOf(R`x_{1,2} = \frac{6 \pm \sqrt{(-6)^2 - 4 \cdot 3 \cdot (-9)}}{2 \cdot 3}`, CUCTRI_Q, ctx), []);
  assert.ok(leaksOf(R`x_{1,2} = \frac{6 \pm 12}{6}`, CUCTRI_Q, ctx).length > 0); // 12 = √144 đã tính
  assert.ok(leaksOf(R`x_1 = 3`, CUCTRI_Q, ctx).length > 0);
});

test("phân tích nhân tử — CẤM tích = 0 có nhân tử (x ± số), (ax ± số); không bắt nhầm phương trình mặt phẳng", () => {
  assert.ok(leaksOf(R`3(x-3)(x+1) = 0`).length > 0);
  assert.ok(leaksOf(R`3\,(x - 3)(x + 1) = 0`).length > 0);
  assert.ok(leaksOf(R`(t - 1)(2t - 1) = 0`, "Giải phương trình 2cos²x − 3cos x + 1 = 0").length > 0);
  assert.ok(leaksOf(R`x(x - 2) = 0`, "Tính diện tích hình phẳng giới hạn bởi y = x² và y = 2x").length > 0);
  assert.deepEqual(leaksOf(R`x^2 - 2x - 3 = 0`), []);
  assert.deepEqual(leaksOf(R`2(x - 1) - (y - 2) + (z - 3) = 0`, "Viết phương trình mặt phẳng qua A(1;2;3) vuông góc đường thẳng có VTCP u = (2;−1;1)"), []);
  assert.deepEqual(leaksOf(R`(x + 1)(x - 1) = 2^3`, "Giải phương trình log₂(x + 1) + log₂(x − 1) = 3"), []); // không phải "= 0"
});

test("phân tích nhân tử — CẤM đạo hàm viết dạng tích có nhân tử bậc nhất; ĐƯỢC dạng khai triển", () => {
  for (const lhs of ["y'", "f'(x)", "y'(x)", R`y^{\prime}`, R`f^{\prime}(x)`, R`\frac{dy}{dx}`, R`y\'`]) {
    assert.ok(leaksOf(`${lhs} = 3(x-3)(x+1)`).length > 0, lhs);
  }
  assert.ok(leaksOf(R`y' = 3\,(x - 3)(x + 1)`).length > 0);
  assert.ok(leaksOf(R`y' = 4x(x - 2)(x + 2)`, "Tìm GTLN, GTNN của y = x⁴ − 8x² + 3 trên đoạn [−1; 3]").length > 0);
  // Hợp lệ gần giống: khai triển, nhân tử không bậc nhất, vế trái không phải đạo hàm.
  assert.deepEqual(leaksOf(R`y' = 3x^2 - 6x - 9`), []);
  assert.deepEqual(leaksOf(R`f'(x) = 3x^2 - 6x - 9`), []);
  assert.deepEqual(leaksOf(R`y' = 3(x^2 - 2x - 3)`), []);
  assert.deepEqual(leaksOf(R`y' = 4x(x^2 - 4)`, "Tìm GTLN, GTNN của y = x⁴ − 8x² + 3 trên đoạn [−1; 3]"), []);
  assert.deepEqual(leaksOf(R`y = (x - 1)(x + 1)`, "Xét hàm số y = x^2 - 1"), []);
});

test("không tính — CẤM: nghiệm là số, kể cả khi các số đó có sẵn trong đề (x = 3, x = -1)", () => {
  assert.equal(leaksOf(R`x = 3 \text{ hoặc } x = -1`).length, 2);
  assert.ok(leaksOf(R`x_1 = -1, x_2 = 3`).length > 0);
  assert.ok(leaksOf(R`1 < t < 3`, "Giải bất phương trình 3^(2x) − 4·3^x + 3 < 0").length > 0);
  assert.ok(leaksOf(R`x = \pm\frac{\pi}{3} + k2\pi`, "Giải phương trình 2cos²x − 3cos x + 1 = 0").length > 0);
  // Ngoại lệ: cặp có nguyên văn trong đề ("tại x = 2").
  assert.deepEqual(leaksOf(R`x = 2`, "Tính đạo hàm của y = x^5 tại x = 2"), []);
});

test("không tính — CẤM: giá trị tại một điểm, Δ = số, phép tính ra kết quả, đáp số không có sẵn", () => {
  assert.ok(leaksOf(R`f(-1) = 10`).length > 0);
  assert.ok(leaksOf(R`f(x_1) = 10`).length > 0);
  assert.ok(leaksOf(R`\Delta = 1`, "Giải phương trình x^2 - 5x + 6 = 0").length > 0);
  assert.ok(leaksOf(R`\Delta = 3^2 - 4 \cdot 2 = 1`, "Giải phương trình x^2 - 3x + 2 = 0").length > 0);
  assert.deepEqual(leaksOf(R`\Delta = 3^2 - 4 \cdot 2`, "Giải phương trình x^2 - 3x + 2 = 0", ["4"]), []);
  assert.ok(leaksOf(R`V = 36\pi`, "Tính thể tích khối cầu bán kính R = 3").length > 0);
  assert.ok(leaksOf(R`d = \frac{9}{3} = 3`, "Tính khoảng cách từ M(1;−2;3) đến mặt phẳng 2x − y + 2z − 1 = 0").length > 0);
  assert.ok(leaksOf(R`y = 10x - 15`, "Viết phương trình tiếp tuyến của y = x^3 − 2x + 1 tại điểm có hoành độ 2").length > 0);
  assert.ok(leaksOf(R`x^2 - 1 = 8`, "Giải phương trình log₂(x + 1) + log₂(x − 1) = 3").length > 0);
});

test("không tính — hệ số hợp lệ của bước trước dùng được ở bước sau; bước bị lọc thì không", () => {
  const ctx = { sourceTexts: [CUCTRI_Q], formulaTexts: [R`\Delta = b^2 - 4ac`], formulaNames: ["Điều kiện cực trị"] };
  const ok = applyNumberGuard(derivAnswer([
    { title: "Đạo hàm", detail: "Tính:", expression: R`y' = 3x^2 - 6x - 9` },
    { title: "Delta", detail: "Với $a = 3$, $b = -6$, $c = -9$:", expression: R`\Delta = (-6)^2 - 4 \cdot 3 \cdot (-9)` },
  ]), ctx);
  assert.equal(ok.removedSteps.length, 0);
  const bad = applyNumberGuard(derivAnswer([
    { title: "Nghiệm", detail: "Ta được:", expression: R`x = 3 \text{ hoặc } x = -1, y' = 3x^2 - 6x - 9` },
    { title: "Delta", detail: "Hệ số:", expression: R`b = -6` },
  ]), ctx);
  assert.equal(bad.removedSteps.length, 2); // 6 chỉ "hợp lệ" trong bước đã bị lọc → bước sau cũng bị lọc
});

test("không tính — nghiệm viết thẳng trong câu chữ (không có $) cũng bị bắt", () => {
  const { removedSteps } = applyNumberGuard(derivAnswer([
    { title: "Kết luận", detail: "Khi x = -1, y' đổi dấu từ + sang - nên hàm đạt cực đại.", expression: "" },
  ]), { sourceTexts: [CUCTRI_Q], formulaTexts: [] });
  assert.equal(removedSteps.length, 1);
});

// Lọc oan gặp khi chấm 2026-09-30 (bộ lọc mới, 20 câu) — mỗi dòng là một bước hợp lệ đã bị lọc.
test("không lọc oan: toạ độ có dấu phẩy, điều kiện Δ > 0 / f'(x_0) = 0, toạ độ y_0, điểm đề cho, id công thức", () => {
  assert.deepEqual(extractNumbers("Thay toạ độ A(1,2,3) vào"), ["1", "2", "3"]);
  assert.deepEqual(extractNumbers("lãi suất 0,06 mỗi năm"), ["0.06"]);
  assert.deepEqual(extractNumbers("xét dấu trên (-1,1)"), ["1", "1"]);
  assert.deepEqual(leaksOf(R`2\cdot 1 - 1\cdot 2 + 1\cdot 3 + D = 0, A(1,2,3)`, "Viết phương trình mặt phẳng qua A(1;2;3) vuông góc đường thẳng có VTCP u = (2;−1;1)"), []);
  assert.deepEqual(leaksOf(R`\Delta > 0`), []);
  assert.deepEqual(leaksOf(R`f'(x_0) = 0`), []);
  assert.ok(leaksOf(R`f'(2) = 0`).length > 0); // tại điểm SỐ thì vẫn là giá trị
  assert.deepEqual(leaksOf(R`x_0 = 1, y_0 = -2, z_0 = 3`, "Tính khoảng cách từ M(1;−2;3) đến mặt phẳng 2x − y + 2z − 1 = 0"), []);
  assert.deepEqual(leaksOf(R`x = 2`, "Viết phương trình tiếp tuyến của y = x³ − 2x + 1 tại điểm có hoành độ 2"), []);
  assert.deepEqual(leaksOf(R`f(-1), f(3), x = -1, x = 3`, "Tìm GTLN, GTNN của y = x⁴ − 8x² + 3 trên đoạn [−1; 3]"), []);
  assert.ok(leaksOf(R`x = 2`, "Tìm GTLN, GTNN của y = x⁴ − 8x² + 3 trên đoạn [−1; 3]").length > 0); // điểm dừng, không phải đầu mút
  const planeQ = "Viết phương trình mặt phẳng qua A(1;2;3) vuông góc đường thẳng có VTCP u = (2;−1;1)";
  const planeStep = applyNumberGuard(derivAnswer([{ title: "Thay A", detail: "Thay $x=1$, $y=2$, $z=3$ vào $2x - y + z + D = 0$.", expression: R`2\cdot1 - 1\cdot2 + 1\cdot3 + D = 0` }]),
    { sourceTexts: [planeQ], formulaTexts: [] });
  assert.equal(planeStep.removedSteps.length, 0); // toạ độ điểm A đề cho, không phải nghiệm
  assert.deepEqual(leaksOf(R`\log_2((x+1)(x-1)) = 3 \text{ (công thức gt12-logarit)}`, "Giải phương trình log₂(x + 1) + log₂(x − 1) = 3"), []);
  const { removedSteps } = applyNumberGuard(derivAnswer([{ title: "Thay x", detail: "Thay x = 2 vào y' (theo công thức gt11-tieptuyen-phuongtrinh).", expression: "" }]),
    { sourceTexts: ["Viết phương trình tiếp tuyến của y = x³ − 2x + 1 tại điểm có hoành độ 2"], formulaTexts: [] });
  assert.equal(removedSteps.length, 0);
});

test("tổng/hiệu số trong đề: viết phép tính chưa tính (5 + 4, C_{5+4}^3) được giữ; tính sẵn (9 bi) bị chặn", () => {
  const Q = "Hộp 5 bi đỏ, 4 bi xanh, lấy 3 bi. Xác suất có ít nhất 1 bi xanh";
  const ctx = { sourceTexts: [Q], formulaTexts: [R`C_n^k = \frac{n!}{k!(n-k)!}`] };
  const ok = applyNumberGuard(derivAnswer([
    { title: "Dữ kiện", detail: "Tổng số bi là $5 + 4$.", expression: "" },
    { title: "Đếm", detail: "Số cách chọn 3 bi:", expression: R`n(\Omega) = C_{5+4}^3` },
  ]), ctx);
  assert.equal(ok.removedSteps.length, 0);
  const bad = applyNumberGuard(derivAnswer([{ title: "Dữ kiện", detail: "Hộp có tổng cộng 9 bi.", expression: "" }]), ctx);
  assert.equal(bad.removedSteps.length, 1);
  assert.deepEqual(bad.removedSteps[0].leaked, ["9"]);
});

test("extractNumbers: chữ số chỉ số trên/dưới trong đề (x³, log₂) được đọc; đơn vị cm², m³ vẫn bỏ qua", () => {
  assert.deepEqual(extractNumbers("y = x³ − 3x² − 9x + 5"), ["3", "3", "2", "9", "5"]);
  assert.deepEqual(extractNumbers("log₂(x + 1) = 3"), ["2", "1", "3"]);
  assert.deepEqual(extractNumbers("thể tích 12 cm³, diện tích 4 m²"), ["12", "4"]);
});

test("không tính — phần trăm trong đề được đổi sang thập phân (6% → 0.06)", () => {
  assert.deepEqual(leaksOf(R`150 = 100(1 + 0.06)^n`, "Gửi 100 triệu, lãi kép 6%/năm, sau bao nhiêu năm được ít nhất 150 triệu?", ["0.06"]), []);
  const { removedSteps } = applyNumberGuard(derivAnswer([{ title: "Lập", detail: "Ta có:", expression: R`100(1 + 0.06)^n \ge 150` }]),
    { sourceTexts: ["Gửi 100 triệu, lãi kép 6%/năm, sau bao nhiêu năm được ít nhất 150 triệu?"], formulaTexts: [] });
  assert.equal(removedSteps.length, 0);
});
