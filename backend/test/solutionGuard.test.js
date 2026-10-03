import { test } from "node:test";
import assert from "node:assert/strict";
import {
  repairLatexEscapes, parseModelJson, normalizeAnswer, extractNumbers,
  applyNumberGuard, mathLeaks, neutralStep, hasBalancedBraces, dropBrokenExpressions, toReplyText, DEFAULT_TEXT,
  maskMathLeaks, maskTextLeaks, fixSymbolicBlank, isNumericSubstitution, dropNumericSubstitutions, wrapLooseLatex,
} from "../lib/solutionGuard.js";
import { buildSystemPrompt } from "../lib/finderPrompt.js";

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

test("normalize: 'Delta' thiếu dấu \\ trong phần toán thành \\Delta; chữ Delta trong câu văn giữ nguyên", () => {
  const { answer } = normalizeAnswer({
    type: "solution", formula_ids: ["ds11-csc-tong"], intro: "Bài này dùng biệt thức Delta.",
    steps: [
      { title: "Tính biệt thức Delta", detail: "Thay vào $Delta = b^2 - 4ac$, xét $Delta > 0$ và $\\Delta' = 0$:", expression: "Delta = (-6)^2 - 4 \\cdot 3 \\cdot (-9)" },
      { title: "Nghiệm", detail: "Giữ $x_{1,2} = \\frac{6 \\pm \\sqrt{Delta}}{2 \\cdot 3}$.", expression: "x_{1,2} = \\frac{6 \\pm \\sqrt{Delta}}{6}" },
    ],
    reminder: "Bạn tính $Delta$ trước rồi xét dấu nhé!",
  }, isValid);
  assert.equal(answer.intro, "Bài này dùng biệt thức Delta."); // câu văn: giữ nguyên
  assert.equal(answer.steps[0].title, "Tính biệt thức Delta");
  assert.equal(answer.steps[0].detail, "Thay vào $\\Delta = b^2 - 4ac$, xét $\\Delta > 0$ và $\\Delta' = 0$:");
  assert.equal(answer.steps[0].expression, "\\Delta = (-6)^2 - 4 \\cdot 3 \\cdot (-9)");
  assert.equal(answer.steps[1].detail, "Giữ $x_{1,2} = \\frac{6 \\pm \\sqrt{\\Delta}}{2 \\cdot 3}$.");
  assert.equal(answer.steps[1].expression, "x_{1,2} = \\frac{6 \\pm \\sqrt{\\Delta}}{6}");
  assert.equal(answer.reminder, "Bạn tính $\\Delta$ trước rồi xét dấu nhé!");
});

// Lỗi hiển thị thấy trên production (bài cực trị, 2026-09-30).
const NAMES = {
  "gt11-daoham-tonghieu": "Đạo hàm của tổng, hiệu hai hàm số",
  "ds10-phuongtrinh-bac2": "Phương trình bậc hai & Biệt thức Delta",
  "gt12-cuctrituoc": "Điều kiện cực trị của hàm số",
};
const realId = (id) => id in NAMES;
const nameOf = (id) => NAMES[id];
const normalizeWith = (steps, extra = {}) => normalizeAnswer({ type: "solution", formula_ids: ["gt12-cuctrituoc"], steps, ...extra }, realId, nameOf).answer;

test("hiển thị: \\' và \\\" thừa trong phần toán bị bỏ dấu \\ (KaTeX không lỗi đỏ); escape hợp lệ giữ nguyên", () => {
  const a = normalizeWith([{ title: "Tính $y\\'$", detail: "Ta có $y\\' = 0$ và $\\\"x\\\"$, cách $a\\,b$.", expression: "y\\' = 3x^2 - 6x - 9" }]);
  assert.equal(a.steps[0].expression, "y' = 3x^2 - 6x - 9");
  assert.equal(a.steps[0].title, "Tính $y'$");
  assert.equal(a.steps[0].detail, "Ta có $y' = 0$ và $\"x\"$, cách $a\\,b$.");
  assert.equal(normalizeWith([{ detail: "a", expression: "\\{x\\} \\cup \\{1\\}, 50\\%" }]).steps[0].expression, "\\{x\\} \\cup \\{1\\}, 50\\%");
});

test("hiển thị: id công thức trong lời giải → bỏ nếu ngay sau tên, còn lại thay bằng tên; id không có thật giữ nguyên", () => {
  const a = normalizeWith([
    { title: "Tính đạo hàm", detail: "Áp dụng Đạo hàm của tổng, hiệu hai hàm số (gt11-daoham-tonghieu):", expression: "y' = 3x^2 - 6x - 9" },
    { title: "Giải y' = 0", detail: "Dùng công thức nghiệm (ds10-phuongtrinh-bac2) cho $y' = 0$.", expression: "" },
    { title: "Kết luận", detail: "Theo gt12-cuctrituoc, xét dấu $y'$; tham khảo xx99-khong-co.", expression: "" },
  ], { intro: "Bài này dùng gt12-cuctrituoc.", reminder: "Xem thẻ (ds10-phuongtrinh-bac2) nhé!" });
  assert.equal(a.steps[0].detail, "Áp dụng Đạo hàm của tổng, hiệu hai hàm số:");
  assert.equal(a.steps[1].detail, "Dùng công thức nghiệm (Phương trình bậc hai & Biệt thức Delta) cho $y' = 0$.");
  assert.equal(a.steps[2].detail, "Theo Điều kiện cực trị của hàm số, xét dấu $y'$; tham khảo xx99-khong-co.");
  assert.equal(a.intro, "Bài này dùng Điều kiện cực trị của hàm số.");
  assert.equal(a.reminder, "Xem thẻ (Phương trình bậc hai & Biệt thức Delta) nhé!");
});

test("hiển thị: lệnh LaTeX ngoài $...$ trong câu chữ được bọc lại; phần đã trong $...$ giữ nguyên", () => {
  const a = normalizeWith([
    { title: "Tính \\Delta", detail: "Thay vào công thức để tính \\Delta và viết nghiệm \\frac{-b \\pm \\sqrt{\\Delta}}{2a}; giữ $\\Delta > 0$.", expression: "" },
    { title: "Nghiệm", detail: "Ta có x_1 < x_2 và \\sqrt{\\Delta} > 0, \\pi xấp xỉ.", expression: "" },
  ]);
  assert.equal(a.steps[0].title, "Tính $\\Delta$");
  assert.equal(a.steps[0].detail, "Thay vào công thức để tính $\\Delta$ và viết nghiệm $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$; giữ $\\Delta > 0$.");
  assert.equal(a.steps[1].detail, "Ta có x_1 < x_2 và $\\sqrt{\\Delta}$ > 0, $\\pi$ xấp xỉ.");
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

test("guard: bước có kết quả tính ra (216, 288) bị lọc, reminder có số lạ bị thay", () => {
  const { answer, removedSteps, replaced } = applyNumberGuard(sphereAnswer([
    { title: "Thay số", detail: "Thay $R = 6$:", expression: String.raw`V = \frac{4}{3}\pi \cdot 6^3` },
    { title: "Tính", detail: "Ta có $6^3 = 216$.", expression: String.raw`V = 288\pi` },
  ], { reminder: "Đáp án là 288π" }), { ...sphereCtx, formulaNames: ["Thể tích khối cầu"] });
  // Bước trước đã thay số cho chính V → không thêm bước trung tính lặp lại.
  assert.deepEqual(answer.steps.map((s) => s.title), ["Thay số"]);
  assert.deepEqual(removedSteps[0].leaked.sort(), ["216", "288"]);
  assert.deepEqual(replaced, ["reminder"]);
  assert.equal(answer.reminder, DEFAULT_TEXT.reminder);
});

test("guard: bước tính ra kết quả mà trước đó CHƯA có bước thay số → thay bằng bước trung tính", () => {
  const { answer } = applyNumberGuard(sphereAnswer([
    { title: "Dữ kiện", detail: "Đề cho $R = 6$ cm.", expression: "" },
    { title: "Tính", detail: "Ta có:", expression: String.raw`V = 288\pi` },
  ]), { ...sphereCtx, formulaNames: ["Thể tích khối cầu"] });
  assert.equal(answer.steps.length, 2);
  assert.equal(answer.steps[1].title, "Thay số vào công thức");
  assert.equal(answer.steps[1].detail, "Thay các dữ kiện vào công thức Thể tích khối cầu (xem thẻ ở trên), giữ nguyên các phép toán, chưa tính.");
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

test("bước trung tính: bỏ khi bước ngay trước đã thay số cho cùng đại lượng (bài hình chóp); giữ khi khác đại lượng", () => {
  const ctx = { sourceTexts: [CHOP_Q], formulaTexts: [R`V = \frac{1}{3} B \cdot h`], formulaNames: ["Thể tích khối chóp"] };
  const chop = applyNumberGuard(derivAnswer([
    { title: "Xác định dữ kiện", detail: "Đáy hình vuông cạnh $a$ nên $B = a^2$; $h = SA = a\\sqrt{2}$.", expression: "" },
    { title: "Thay số vào công thức", detail: "Thay $B$ và $h$:", expression: R`V = \frac{1}{3} a^{2} \cdot a\sqrt{2}` },
    { title: "Rút gọn biểu thức", detail: "Nhân các lũy thừa:", expression: R`V = \frac{1}{3} a^3 \sqrt{2}` },
  ]), ctx);
  assert.equal(chop.removedSteps.length, 1);
  assert.deepEqual(chop.answer.steps.map((s) => s.title), ["Xác định dữ kiện", "Thay số vào công thức"]);
  assert.ok(!chop.answer.steps.some((s) => s.neutral));

  // Bước trước thay số cho B, bước bị lọc là V → vẫn cần bước trung tính.
  const other = applyNumberGuard(derivAnswer([
    { title: "Diện tích đáy", detail: "Đáy hình vuông cạnh $a$:", expression: R`B = a^2` },
    { title: "Thể tích", detail: "Ta được:", expression: R`V = \frac{a^3\sqrt{2}}{3}` },
  ]), ctx);
  assert.deepEqual(other.answer.steps.map((s) => s.title), ["Diện tích đáy", "Thay số vào công thức"]);
  assert.equal(other.answer.steps[1].neutral, true);
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

// ─── Ô trống "?" (2026-10-03) ────────────────────────────────────────────────
const COSIN_Q = "Cho tam giác ABC có AB = 5, AC = 8, góc A = 60°. Tính độ dài cạnh BC.";
const CSC_Q = "Cho cấp số cộng có u₁ = 3, công sai d = 4. Tính tổng 20 số hạng đầu.";
const CUCTRI2_Q = "Tìm cực trị của hàm số y = x³ − 3x + 2.";
const GTLN_Q = "Tìm giá trị lớn nhất và nhỏ nhất của hàm số y = x⁴ − 2x² + 3 trên đoạn [0; 2].";

test("ô trống — ĐƯỢC: kết thúc bằng ?, gán dữ kiện (b = AC = 8), biểu thức ký hiệu, khoảng chia bởi x_1, x_2", () => {
  assert.deepEqual(leaksOf(R`3x^2 - 3 = 0 \Rightarrow x^2 = ?`, CUCTRI2_Q), []);
  assert.deepEqual(leaksOf(R`BC^2 = 8^2 + 5^2 - 2 \cdot 8 \cdot 5 \cdot \cos 60^\circ = ?`, COSIN_Q), []);
  assert.deepEqual(leaksOf(R`b = AC = 8,\ c = AB = 5,\ A = 60^\circ`, COSIN_Q), []);
  // 2: số trong công thức S_n (khi chạy thật được tính là "có sẵn"); 19 = 20 − 1 phải viết (20 - 1).
  assert.deepEqual(leaksOf(R`S_{20} = \frac{20 \cdot [2 \cdot 3 + (20 - 1) \cdot 4]}{2} = ?`, CSC_Q, ["2"]), []);
  assert.deepEqual(leaksOf(R`(-\infty; x_1),\ (x_1; x_2),\ (x_2; +\infty)`, CUCTRI2_Q), []);
  // Đầu mút đoạn đề cho và điểm ký hiệu được viết giá trị hàm.
  assert.deepEqual(leaksOf(R`\max\{y(0), y(x_1), y(2)\} = ?`, GTLN_Q), []);
  // Tại x = 2 (đề cho) thì y'(2) được viết.
  assert.deepEqual(leaksOf(R`y'(2) = 5 \cdot 2^4`, "Tính đạo hàm của y = x^5 tại x = 2", ["4"]), []); // 4: số mũ n − 1 của bước trước
});

test("ô trống — CẤM: kết quả sau dấu = cuối, x^2 = 1 (1 luôn 'có sẵn'), khoảng/giá trị hàm lộ nghiệm", () => {
  assert.notDeepEqual(leaksOf(R`3x^2 - 3 = 0 \Rightarrow x^2 = 1`, CUCTRI2_Q), []);
  assert.notDeepEqual(leaksOf(R`BC^2 = 8^2 + 5^2 - 2 \cdot 8 \cdot 5 \cdot \cos 60^\circ = 49`, COSIN_Q), []);
  assert.notDeepEqual(leaksOf(R`S_{20} = 820`, CSC_Q), []);
  assert.notDeepEqual(leaksOf(R`f(1) = 1^4 - 2 \cdot 1^2 + 3 = 2`, GTLN_Q), []);
  // Ví dụ thật (đề cực trị): khoảng xét dấu lộ nghiệm ±1.
  assert.notDeepEqual(leaksOf(R`(-\infty, -1),\ (-1, 1),\ (1, \infty)`, CUCTRI2_Q), []);
  assert.notDeepEqual(leaksOf(R`x \in \left(-1; 1\right)`, CUCTRI2_Q), []);
  // y(1): 1 là nghiệm trong đoạn [0; 2], không phải đầu mút đề cho.
  assert.notDeepEqual(leaksOf(R`\max\{y(0), y(1), y(2)\}`, GTLN_Q), []);
  assert.notDeepEqual(leaksOf(R`S = \{-1; 1\}`, CUCTRI2_Q), []);
});

test("ô trống — câu chữ: 'x = ±1', khoảng có nghiệm trong lời văn cũng bị bắt", () => {
  const ctx = { sourceTexts: [CUCTRI2_Q], formulaTexts: [] };
  const { removedSteps } = applyNumberGuard(derivAnswer([
    { title: "Nghiệm", detail: "Ta được x = ±1.", expression: "" },
    { title: "Xét dấu", detail: "Xét dấu y' trên các khoảng (−∞; −1), (−1; 1), (1; +∞).", expression: "" },
    { title: "Xét dấu đúng", detail: "Xét dấu $y'$ trên các khoảng chia bởi $x_1, x_2$.", expression: "" },
  ]), ctx);
  assert.deepEqual(removedSteps.map((s) => s.title), ["Nghiệm", "Xét dấu"]);
});

test("ô trống — mask: thay đúng con số lộ bằng ?, giữ nguyên biểu thức ký hiệu và phần thay số", () => {
  const allowedFor = (q, extra = []) => new Set(["0", "1", ...extractNumbers(q), ...extra]);
  assert.equal(maskMathLeaks(R`3x^2 - 3 = 0 \Rightarrow x^2 = 1`, allowedFor(CUCTRI2_Q), CUCTRI2_Q), R`3x^2 - 3 = 0 \Rightarrow x^2 = ?`);
  assert.equal(maskMathLeaks(R`BC^2 = 8^2 + 5^2 - 2 \cdot 8 \cdot 5 \cdot \cos 60^\circ = 49`, allowedFor(COSIN_Q), COSIN_Q),
    R`BC^2 = 8^2 + 5^2 - 2 \cdot 8 \cdot 5 \cdot \cos 60^\circ = ?`);
  assert.equal(maskMathLeaks(R`S_{20} = \frac{20(3 + 79)}{2} = 820`, allowedFor(CSC_Q, ["2"]), CSC_Q), R`S_{20} = \frac{20(3 + ?)}{2} = ?`);
  // Nghiệm lộ qua y(số) được thay bằng KÝ HIỆU, không bằng "?" (không sinh ra y(?)).
  assert.equal(maskMathLeaks(R`\max\{y(0), y(1), y(2)\} = ?`, allowedFor(GTLN_Q), GTLN_Q), R`\max\{y(0), y(x_1), y(2)\} = ?`);
  // Ví dụ thật (đề GTLN): y(1) = 1^4 - … vẫn thay nghiệm ở vế phải → y(x_1) = ? (không còn "? = ?"),
  // giữ nguyên mệnh đề kế tiếp (ngăn bằng dấu phẩy hoặc xuống dòng \\).
  assert.equal(maskMathLeaks(R`y(0)=0^{4}-2\cdot0^{2}+3 = ?,\; y(1)=1^{4}-2\cdot1^{2}+3 = ?,\; y(2)=2^{4}-2\cdot2^{2}+3 = ?`, allowedFor(GTLN_Q, ["4"]), GTLN_Q),
    R`y(0)=0^{4}-2\cdot0^{2}+3 = ?,\; y(x_1)=?,\; y(2)=2^{4}-2\cdot2^{2}+3 = ?`);
  assert.equal(maskMathLeaks(R`y(1) = 1^{4} - 2\cdot1^{2} + 3 = ?\\ y(2) = 2^{4} - 2\cdot2^{2} + 3 = ?`, allowedFor(GTLN_Q, ["4"]), GTLN_Q),
    R`y(x_1) = ?\\ y(2) = 2^{4} - 2\cdot2^{2} + 3 = ?`);
  // Khoảng xét dấu lộ nghiệm ±1 → khoảng chia bởi x_1, x_2 (cùng giá trị → cùng ký hiệu).
  assert.equal(maskMathLeaks(R`(-\infty; -1),\ (-1; 1),\ (1; +\infty)`, allowedFor(CUCTRI2_Q), CUCTRI2_Q),
    R`(-\infty; x_1),\ (x_1; x_2),\ (x_2; +\infty)`);
  assert.equal(maskTextLeaks("Khi x = 1 thì $y' = 0$.", allowedFor(CUCTRI2_Q), CUCTRI2_Q), "Khi x = ? thì $y' = 0$.");
  // Đã sạch thì trả nguyên văn.
  assert.equal(maskMathLeaks(R`y' = 3x^2 - 3`, allowedFor(CUCTRI2_Q), CUCTRI2_Q), R`y' = 3x^2 - 3`);
});

test("ô trống — applyNumberGuard mask: bước lộ được thay ? thay vì bỏ; mask tắt thì bỏ như cũ", () => {
  const ctx = { sourceTexts: [CUCTRI2_Q], formulaTexts: [], formulaNames: ["Đạo hàm"] };
  const steps = [
    { title: "Tính đạo hàm", detail: "Ta có:", expression: R`y' = 3x^2 - 3` },
    { title: "Giải y' = 0", detail: "Giải $y' = 0$. Bạn tự tính $x^2$.", expression: R`3x^2 - 3 = 0 \Rightarrow x^2 = 1` },
  ];
  const off = applyNumberGuard(derivAnswer(steps), ctx);
  assert.equal(off.removedSteps.length, 1);
  const on = applyNumberGuard(derivAnswer(steps), { ...ctx, mask: true });
  assert.equal(on.removedSteps.length, 0);
  assert.equal(on.maskedSteps.length, 1);
  assert.equal(on.answer.steps[1].expression, R`3x^2 - 3 = 0 \Rightarrow x^2 = ?`);
  assert.equal(on.answer.steps[1].title, "Giải y' = 0");
});

test("ô trống — ví dụ thật (đề GTLN, lần chấm 2026-10-03): danh sách x = 0,1,2 và mục ngăn bằng ;", () => {
  const allowed = new Set(["0", "1", "4", ...extractNumbers(GTLN_Q)]);
  // "0,1,2" là danh sách giá trị x (không phải 0.1); 1 là nghiệm, không phải đầu mút đề cho.
  assert.deepEqual(extractNumbers(R`x=0,1,2`), ["0", "1", "2"]);
  assert.deepEqual(extractNumbers("lãi 0,06 mỗi năm"), ["0.06"]);
  assert.deepEqual(extractNumbers(R`x \in [0,2]`), ["0", "2"]); // khoảng, không phải 0.2
  assert.ok(leaksOf(R`x=0,1,2`, GTLN_Q).includes("x=1"));
  assert.ok(leaksOf(R`x = 0, 1, 2`, GTLN_Q).includes("x=1"));
  assert.deepEqual(leaksOf(R`x = 0, 2`, GTLN_Q), []); // chỉ đầu mút đề cho
  assert.equal(maskMathLeaks(R`x=0,1,2`, allowed, GTLN_Q), R`x=0,x_1,2`);
  assert.equal(maskMathLeaks(R`y(0) = 0^{4} - 2\cdot 0^{2} + 3 = ?;\; y(1) = 1^{4} - 2\cdot 1^{2} + 3 = ?;\; y(2) = 2^{4} - 2\cdot 2^{2} + 3 = ?`, allowed, GTLN_Q),
    R`y(0) = 0^{4} - 2\cdot 0^{2} + 3 = ?;\; y(x_1) = ?;\; y(2) = 2^{4} - 2\cdot 2^{2} + 3 = ?`);
  const { answer, removedSteps, maskedSteps } = applyNumberGuard(derivAnswer([
    { title: "Tính giá trị hàm tại các điểm cần xét", detail: R`Thay $x=0,1,2$ vào hàm số. Bạn tự tính các giá trị $y(0),\,y(1),\,y(2)$.`,
      expression: R`y(0) = 0^{4} - 2\cdot 0^{2} + 3 = ?;\; y(1) = 1^{4} - 2\cdot 1^{2} + 3 = ?;\; y(2) = 2^{4} - 2\cdot 2^{2} + 3 = ?` },
  ]), { sourceTexts: [GTLN_Q], formulaTexts: ["4"], mask: true });
  assert.equal(removedSteps.length, 0);
  assert.equal(maskedSteps.length, 1);
  // Cùng một nghiệm (1) ở câu chữ và biểu thức → cùng ký hiệu x_1 trong cả bước.
  assert.equal(answer.steps[0].detail, R`Thay $x=0,x_1,2$ vào hàm số. Bạn tự tính các giá trị $y(0),\,y(x_1),\,y(2)$.`);
  assert.equal(answer.steps[0].expression, R`y(0) = 0^{4} - 2\cdot 0^{2} + 3 = ?;\; y(x_1) = ?;\; y(2) = 2^{4} - 2\cdot 2^{2} + 3 = ?`);
});

// ─── Bổ sung 2026-10-03 (lần 2): x^2 = a, "= ?" thừa, ký hiệu nghiệm, thay dữ kiện ──────────
test("ô trống (1): dạng x^2 = a viết thẳng ⇒ x^2 = ? — hợp lệ; prompt cấm dùng Δ cho dạng này", () => {
  assert.deepEqual(leaksOf(R`3x^2 - 12 = 0 \Rightarrow x^2 = ?`, "Tìm cực trị của hàm số y = x^3 - 12x + 1"), []);
  assert.deepEqual(leaksOf(R`3x^2 - 3 = 0 \Rightarrow x^2 = ?`, CUCTRI2_Q), []);
  const prompt = buildSystemPrompt([]);
  assert.match(prompt, /dạng x\^2 = a[^\n]*KHÔNG dùng \\Delta/);
  assert.match(prompt, /Chỉ dùng \\Delta khi phương trình bậc hai có đủ hạng tử bậc nhất/);
});

test("ô trống (2): biểu thức ký hiệu không có '= ?' phía sau — tự bỏ; ô trống hợp lệ giữ nguyên", () => {
  assert.equal(fixSymbolicBlank(R`y' = 4x^{3} - 4x = ?`), R`y' = 4x^{3} - 4x`);
  assert.equal(fixSymbolicBlank(R`f'(x) = 3x^2 - 12 = ?`), R`f'(x) = 3x^2 - 12`);
  assert.equal(fixSymbolicBlank(R`y(x_1) = x_1^3 - 3x_1 + 2 = ?,\; y(x_2) = ?`), R`y(x_1) = ?,\; y(x_2) = ?`);
  // Ví dụ thật (đề cực trị): hai mệnh đề ngăn bằng \quad.
  assert.equal(fixSymbolicBlank(R`y(x_1) = x_1^3 - 3x_1 + 2 = ? \quad y(x_2) = x_2^3 - 3x_2 + 2 = ?`), R`y(x_1) = ? \quad y(x_2) = ?`);
  // Giữ nguyên: ô trống của đại lượng cần tìm, của max/min, của biểu thức số.
  for (const keep of [R`x^2 = ?`, R`V = ?`, R`\max\{y(0), y(x_1), y(2)\} = ?`, R`\max_{[0;2]} y = \max\{y(0), y(x_1), y(2)\} = ?`,
    R`x_{1,2} = \frac{-b \pm \sqrt{\Delta}}{2a} = ?`, R`3x^2 - 3 = 0 \Rightarrow x^2 = ?`]) {
    assert.equal(fixSymbolicBlank(keep), keep);
  }
  // Qua normalizeAnswer (expression và $...$ trong câu chữ).
  const { answer } = normalizeAnswer({ type: "solution", formula_ids: ["gt12-daoham-basic"], steps: [
    { title: "Đạo hàm", detail: R`Ta có $y' = 4x^3 - 4x = ?$.`, expression: R`y' = 4x^3 - 4x = ?` },
  ] }, () => true);
  assert.equal(answer.steps[0].expression, R`y' = 4x^3 - 4x`);
  assert.equal(answer.steps[0].detail, R`Ta có $y' = 4x^3 - 4x$.`);
});

test("ô trống (3): giá trị tại nhiều điểm — nghiệm lộ thành ký hiệu, khớp tên AI đã đặt (x_2 = 1 → x_2)", () => {
  const ctx = { sourceTexts: [GTLN_Q], formulaTexts: ["4"], mask: true };
  const { answer } = applyNumberGuard(derivAnswer([
    { title: "Tìm nghiệm", detail: R`Trên $[0;2]$ có $x_1 = 0$, $x_2 = 1$.`, expression: R`x_{1}=0,\; x_{2}=1` },
    { title: "Giá trị", detail: "Tính các giá trị.", expression: R`y(0) = ?,\; y(1) = ?,\; y(2) = ?` },
    { title: "Kết luận", detail: R`So sánh $y(0), y(1), y(2)$.`, expression: R`\max\{y(0), y(1), y(2)\} = ?` },
  ]), ctx);
  const all = answer.steps.map((s) => `${s.detail} ${s.expression}`).join(" ");
  assert.equal(answer.steps[1].expression, R`y(0) = ?,\; y(x_2) = ?,\; y(2) = ?`);
  assert.equal(answer.steps[2].expression, R`\max\{y(0), y(x_2), y(2)\} = ?`);
  assert.doesNotMatch(all, /y\(\?\)|\?\s*=\s*\?|0,\s*\?,\s*2/);
});

test("ô trống (5): thay dữ kiện vào công thức ký hiệu (với b = AC = 8 …) — không bị coi là lộ số", () => {
  assert.deepEqual(leaksOf(R`BC^2 = b^2 + c^2 - 2bc\cos A,\ \text{với } b = AC = 8,\ c = AB = 5,\ A = 60^\circ \Rightarrow BC = ?`, COSIN_Q), []);
  assert.deepEqual(leaksOf(R`S_n = \frac{n[2u_1 + (n - 1)d]}{2},\ \text{với } n = 20,\ u_1 = 3,\ d = 4 \Rightarrow S_{20} = ?`, CSC_Q, ["2"]), []);
  assert.deepEqual(leaksOf(R`V = \frac{4}{3}\pi R^3, \text{ với } R = 5 \Rightarrow V = ?`, "Tính thể tích khối cầu có bán kính R = 5 cm", ["4", "3"]), []);
  // Vẫn bắt nếu AI viết kết quả sau ⇒.
  assert.notDeepEqual(leaksOf(R`BC^2 = b^2 + c^2 - 2bc\cos A,\ \text{với } b = AC = 8,\ c = AB = 5 \Rightarrow BC = 7`, COSIN_Q), []);
  // Prompt có quy tắc "thay dữ kiện, không thay số" và ví dụ đúng/sai.
  const prompt = buildSystemPrompt([]);
  assert.match(prompt, /THAY DỮ KIỆN, KHÔNG THAY SỐ/);
  assert.match(prompt, /Sai: "V = \\frac\{4\}\{3\}\\pi \\cdot 5\^3 = \?"/);
});

test("escape thừa trước ngoặc nhọn: \\\\{ … \\\\} (ví dụ thật) thu về \\{ … \\}", () => {
  const { answer } = normalizeAnswer({ type: "solution", formula_ids: ["gt12-gtln-gtnn"], steps: [
    { title: "Kết luận", detail: "x", expression: R`y_{max}=\max\\{y(0),y(x_1)\\}=?\\ y_{min}=?` },
  ] }, () => true);
  assert.equal(answer.steps[0].expression, R`y_{max}=\max\{y(0),y(x_1)\}=?\\ y_{min}=?`);
});

test("parse: xuống dòng thật bên trong chuỗi JSON (không dùng JSON mode) vẫn parse được", () => {
  const raw = '{"type":"solution","intro":"Dòng 1\nDòng 2","steps":[{"title":"A","detail":"$\\angle A = 60^\\circ$","expression":"x^2 = ?"}]}';
  const v = parseModelJson(raw);
  assert.equal(v.intro, "Dòng 1 Dòng 2");
  assert.equal(v.steps[0].detail, R`$\angle A = 60^\circ$`);
});

// ─── Lần chấm thật 2026-10-04 (12 lượt) ─────────────────────────────────────
test("LaTeX: khối \\begin{cases}…\\end{cases} viết ngoài $ được bọc NGUYÊN KHỐI (câu thô lượt 5)", () => {
  // Nguyên văn trường detail model trả về (JSON thô) ở lượt 5 — đề cực trị.
  const raw = R`{"type":"solution","formula_ids":["gt12-cuctrituoc"],"steps":[{"title":"Xét dấu $y'$ qua các điểm dừng","detail":"Xét dấu $y'$ trên các khoảng $(-\\infty, x_1)$, $(x_1, x_2)$, $(x_2, \\infty)$. Dùng công thức \\begin{cases} f'(x_0)=0 \\\\ f'\\text{ đổi dấu qua }x_0 \\end{cases} để xác định cực đại, cực tiểu.","expression":""}]}`;
  const { answer } = normalizeAnswer(parseModelJson(raw), () => true);
  const detail = answer.steps[0].detail;
  assert.ok(detail.includes(R`$\begin{cases} f'(x_0)=0 \\ f'\text{ đổi dấu qua }x_0 \end{cases}$`), detail);
  // Không còn đoạn $\begin{cases}$ / $\end{cases}$ bị cắt rời.
  assert.doesNotMatch(detail, /\$\\begin\{cases\}\$|\$\\end\{cases\}\$/);
  // Lệnh rời bên ngoài khối vẫn được bọc như cũ.
  assert.equal(wrapLooseLatex(R`Tính \Delta trước`), R`Tính $\Delta$ trước`);
});

test("làm sạch cuối: biểu thức đã thay số bị bỏ dòng (lượt 2); không bắt (20-1)d, x_2^2, 60^\\circ", () => {
  const nums = (q) => new Set(extractNumbers(q).map((n) => String(Number(n))));
  // Lượt 2 (bản hỏi lại bằng 20b): thay số vào định lý côsin.
  assert.equal(isNumericSubstitution(R`a^{2}=8^{2}+5^{2}-2\cdot8\cdot5\cos 60^{\circ} \Rightarrow a^{2}= ?`, nums(COSIN_Q)), true);
  assert.equal(isNumericSubstitution(R`\Delta = 3^2 - 4 \cdot 2 \cdot (-7) = ?`, nums("Giải phương trình 2x^2 + 3x - 7 = 0")), true);
  assert.equal(isNumericSubstitution(R`y(0) = 0^{4} - 2\cdot 0^{2} + 3 = ?`, nums(GTLN_Q)), true);
  // KHÔNG bắt: lượt 3, lượt 12, công thức ký hiệu kèm dữ kiện, đạo hàm, góc.
  for (const ok of [
    R`u_{20} = u_1 + (20-1)d, \text{ với } u_1 = 3, d = 4 \Rightarrow u_{20} = ?`,
    R`S = \left[ x^2 - \frac{x^3}{3} \right]_{x_1}^{x_2} = (x_2^2 - \frac{x_2^3}{3}) - (x_1^2 - \frac{x_1^3}{3}) \Rightarrow S = ?`,
    R`a^{2}=b^{2}+c^{2}-2bc\cos A, \text{ với } b=8,\; c=5,\; A=60^{\circ} \Rightarrow a^{2}= ?`,
    R`y' = 4x^3 - 4x`, R`3x^2 - 12 = 0 \Rightarrow x^2 = ?`, R`V = \frac{4}{3}\pi R^3, \text{ với } R = 5 \Rightarrow V = ?`,
  ]) {
    assert.equal(isNumericSubstitution(ok, nums(`${COSIN_Q} ${CSC_Q} ${GTLN_Q}`)), false, ok);
  }
  // Bỏ dòng biểu thức, giữ chữ; bước chỉ có biểu thức (không có chữ) thì bỏ hẳn.
  const { answer, dropped } = dropNumericSubstitutions(derivAnswer([
    { title: "Rút gọn", detail: "Bạn tự tính $a^{2}$.", expression: R`a^{2}=8^{2}+5^{2}-2\cdot8\cdot5\cos 60^{\circ} \Rightarrow a^{2}= ?` },
    { title: "Chỉ biểu thức", detail: "", expression: R`BC^2 = 8^2 + 5^2` },
    { title: "Giữ", detail: "Lấy căn.", expression: R`a = \sqrt{a^{2}} \Rightarrow a = ?` },
  ]), COSIN_Q);
  assert.equal(dropped, 2);
  assert.deepEqual(answer.steps.map((s) => [s.title, s.expression]), [["Rút gọn", ""], ["Giữ", R`a = \sqrt{a^{2}} \Rightarrow a = ?`]]);
});

test("ô trống (4): '⇒ F(x) = ?' sau nguyên hàm đã viết, '= ?' sau tích phân bị bỏ; 'S = … ⇒ S = ?' giữ", () => {
  // Nguyên văn lượt 11.
  assert.equal(fixSymbolicBlank(R`F(x)=\int (2x - x^{2})\,dx = x^{2} - \frac{x^{3}}{3} \Rightarrow F(x)= ?`),
    R`F(x)=\int (2x - x^{2})\,dx = x^{2} - \frac{x^{3}}{3}`);
  assert.equal(fixSymbolicBlank(R`F(x) = x^2 - \frac{x^3}{3} \Rightarrow F(x) = ?`), R`F(x) = x^2 - \frac{x^3}{3}`);
  assert.equal(fixSymbolicBlank(R`\int (2x - x^2)\,dx = x^2 - \frac{x^3}{3} + C = ?`), R`\int (2x - x^2)\,dx = x^2 - \frac{x^3}{3} + C`);
  // Giữ: đại lượng đề hỏi (S), F(x) chưa từng được viết ra, nguyên hàm chưa tính.
  for (const keep of [
    R`S = \left[ x^2 - \frac{x^3}{3} \right]_{x_1}^{x_2} = (x_2^2 - \frac{x_2^3}{3}) - (x_1^2 - \frac{x_1^3}{3}) \Rightarrow S = ?`,
    R`S = F(x_2) - F(x_1) \Rightarrow S = ?`, R`F(x) = ?`, R`\int (2x - x^2)\,dx = ?`,
  ]) {
    assert.equal(fixSymbolicBlank(keep), keep);
  }
});

test("prompt (5): giữ đúng dạng công thức thư viện, đổi dạng phải nêu lý do bằng ký hiệu", () => {
  const prompt = buildSystemPrompt([]);
  assert.match(prompt, /giữ nguyên dạng công thức của thư viện; nếu đổi dạng[^\n]*lý do bằng ký hiệu, không dùng số/);
});
