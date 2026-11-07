import { test } from "node:test";
import assert from "node:assert/strict";
import {
  latexNumber, optionNumber, optionNumbers, quadraticCoefficients, expectedAnswer, matchesExpected,
  validateVariant, generateVariant, parseVariantJson, crossCheckMatches, normalizeAnswerText, allowedFormulas, buildVariantMessages, VariantError, VARIANT_SYSTEM_PROMPT,
} from "../lib/quizVariant.js";
import { parseModelJson } from "../lib/solutionGuard.js";
import { fallbackState } from "../lib/finderAnswer.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "../lib/finderPrompt.js";

const ORIGINAL = "Giải phương trình $x^2 - 5x + 6 = 0$.";
const IDS = ["ds10-phuongtrinh-bac2"];

// Câu trả lời mẫu của AI — viết như Gemini thật: LaTeX MỘT dấu \ trong chuỗi JSON (không hợp lệ JSON).
const rawAnswer = (over = {}) => {
  const base = {
    question: "Giải phương trình $x^2 - 7x + 10 = 0$.",
    options: [
      { letter: "A", text: "$x = 2; x = 5$" },
      { letter: "B", text: "$x = -2; x = -5$" },
      { letter: "C", text: "$x = 1; x = 10$" },
      { letter: "D", text: "Vô nghiệm" },
    ],
    answer: "A",
    blank_answer: "x=2;x=5",
    explanation: "Ta có $\\Delta = b^2 - 4ac = 49 - 40 = 9 > 0$ nên $x_{1,2} = \\frac{7 \\pm 3}{2}$.",
    formula_ids: IDS,
    ...over,
  };
  // JSON.stringify nhân đôi \ — bỏ đi một nửa để giống văn bản thô của model.
  return JSON.stringify(base).replace(/\\\\/g, "\\");
};
const check = (raw, ctx = {}) => validateVariant(parseModelJson(raw), { original: ORIGINAL, allowedIds: IDS, ...ctx });

// ─── Parse + tính số ───────────────────────────────────────────────────────
test("parseModelJson đọc được JSON có lệnh LaTeX một dấu \\ (\\frac, \\Delta)", () => {
  const parsed = parseModelJson(`Đây là đề:\n${rawAnswer()}`);
  assert.ok(parsed);
  assert.match(parsed.explanation, /\\frac\{7 \\pm 3\}\{2\}/);
  assert.match(parsed.explanation, /\\Delta/);
});

test("parseVariantJson: \\n trước chữ là xuống dòng, \\neq vẫn là lệnh LaTeX (lỗi thật 2026-11-01)", () => {
  const raw = String.raw`{"explanation": "Ta có $\cos A = \frac{b^2 + c^2 - a^2}{2bc}$\nThay số vào công thức, $a \neq 0$."}`;
  const parsed = parseVariantJson(raw);
  assert.equal(parsed.explanation.split("\n")[1].startsWith("Thay số"), true);
  assert.match(parsed.explanation, /\\neq 0/);
  assert.match(parsed.explanation, /\\frac\{b\^2/);
  assert.ok(!parsed.explanation.includes("\\nThay"));
});

test("latexNumber hiểu số, phân số, căn, nhân ngầm; có chữ cái thì null", () => {
  assert.equal(latexNumber("5"), 5);
  assert.equal(latexNumber("-1,5"), -1.5);
  assert.equal(latexNumber("\\dfrac{3}{4}"), 0.75);
  assert.ok(Math.abs(latexNumber("2\\sqrt{3}") - 2 * Math.sqrt(3)) < 1e-12);
  assert.ok(Math.abs(latexNumber("\\frac{\\sqrt{2}}{2}") - Math.SQRT1_2) < 1e-12);
  assert.equal(latexNumber("\\sqrt[3]{8}"), 2);
  assert.equal(latexNumber("2^{3} \\cdot 3"), 24);
  assert.equal(latexNumber("x + 1"), null);
  assert.equal(latexNumber("\\frac{1}{0}"), null);
  assert.equal(latexNumber(""), null);
});

test("optionNumber bỏ vế trái và đơn vị; optionNumbers tách nhiều nghiệm", () => {
  assert.equal(optionNumber("$BC = 10 \\text{ cm}$"), 10);
  assert.equal(optionNumber("$u_{10} = 7$"), 7);
  assert.equal(optionNumber("$70^\\circ$"), 70);
  assert.equal(optionNumber("$5cm$"), 5);
  assert.deepEqual(optionNumbers("$x = 2; x = 5$"), [2, 5]);
  assert.deepEqual(optionNumbers("$x_1 = 2, x_2 = 5$"), [2, 5]);
  assert.deepEqual(optionNumbers("$S = \\{-1; 1,5\\}$"), [-1, 1.5]);
  assert.equal(optionNumbers("Vô nghiệm"), null);
  assert.equal(optionNumber("$(x-1)^2+(y-2)^2=9$"), null);
  assert.equal(optionNumbers("$(x-1)^2+(y-2)^2=9$"), null);
  assert.equal(optionNumber("$x^2-5x+6=0$"), null);
  assert.equal(optionNumbers("$x = 2; y = 3$"), null);
  assert.equal(optionNumbers("$x = 3; y = 2$"), null);
  assert.equal(optionNumber("$\\frac{x^2}{9}-\\frac{y^2}{16}=1$"), null);
});

test("quadraticCoefficients chỉ nhận đúng một phương trình bậc hai hệ số số", () => {
  assert.deepEqual(quadraticCoefficients("Giải $2x^2 - 3x + 1 = 0$"), { a: 2, b: -3, c: 1 });
  assert.deepEqual(quadraticCoefficients("$-x^2 + 4 = 0$"), { a: -1, b: 0, c: 4 });
  assert.equal(quadraticCoefficients("$x^3 - x = 0$"), null);
  assert.equal(quadraticCoefficients("$(x-1)(x+2) = 0$"), null);
  assert.equal(quadraticCoefficients("$x^2 - 1 = 0$ và $x^2 - 4 = 0$"), null);
});

// ─── Bộ kiểm đáp án cho dạng bài đã biết ──────────────────────────────────
test("expectedAnswer: phương trình bậc hai — nghiệm, tổng, tích, vô nghiệm", () => {
  const roots = expectedAnswer("Giải phương trình $x^2 - 7x + 10 = 0$.");
  assert.equal(roots.kind, "quadratic_roots");
  assert.ok(matchesExpected("$x = 5; x = 2$", roots));
  assert.ok(!matchesExpected("$x = 2; x = 3$", roots));
  assert.equal(expectedAnswer("Tính tổng các nghiệm của phương trình $2x^2 - 6x + 1 = 0$.").value, 3);
  assert.equal(expectedAnswer("Tích hai nghiệm của phương trình $x^2 + 3x - 4 = 0$ là").value, -4);
  const none = expectedAnswer("Giải phương trình $x^2 + x + 5 = 0$.");
  assert.ok(none.none && matchesExpected("Phương trình vô nghiệm", none));
  // Có tham số m → không tự kiểm.
  assert.equal(expectedAnswer("Tìm m để phương trình $x^2 - 2x + 1 = 0$ có nghiệm"), null);
});

test("expectedAnswer: tổng ba góc (cả \\widehat, ^\\circ) và Pytago", () => {
  const a = expectedAnswer("Cho tam giác $ABC$ có $\\widehat{A} = 50^\\circ$, $\\widehat{B} = 65^\\circ$. Tính số đo góc C.");
  assert.deepEqual(a, { kind: "angle_sum", value: 65 });
  const h = expectedAnswer("Tam giác ABC vuông tại A có AB = 6, AC = 8. Tính BC.");
  assert.deepEqual(h, { kind: "pythagoras", value: 10 });
  const leg = expectedAnswer("Tam giác ABC vuông tại A có BC = 13, AB = 5. Tính độ dài AC.");
  assert.equal(leg.value, 12);
  assert.ok(matchesExpected("$AC = 12$ cm", leg));
  // Có góc / diện tích → không phải bài Pytago thuần, không tự kiểm.
  assert.equal(expectedAnswer("Tam giác ABC vuông tại A có AB = 6, AC = 8. Tính diện tích."), null);
});

test("expectedAnswer: thể tích một khối cầu từ bán kính số", () => {
  const volume = expectedAnswer("Tính thể tích khối cầu có bán kính $R = 3\\text{ cm}$.");
  assert.equal(volume.kind, "sphere_volume");
  assert.ok(matchesExpected("$36\\pi\\text{ cm}^3$", volume));
  assert.ok(!matchesExpected("$27\\pi$", volume));
  assert.equal(expectedAnswer("Tính thể tích khối cầu có bán kính 2,5 cm.").kind, "sphere_volume");
  for (const q of [
    "Tính thể tích khối cầu có đường kính 6 cm.",
    "Tính diện tích mặt cầu có bán kính 3 cm.",
    "Tính tổng thể tích hai khối cầu có bán kính 3 cm và 4 cm.",
    "Tính thể tích khối trụ có bán kính 3 cm.",
    "Tính thể tích khối cầu có bán kính 3/4 cm.",
    "Tính thể tích khối cầu có bán kính 3 cm, lấy π = 3,14.",
    "Tính thể tích khối cầu có bán kính 3 cm, làm tròn đến 2 chữ số thập phân.",
  ]) assert.equal(expectedAnswer(q), null, q);
});

test("expectedAnswer: tổng cấp số cộng với u1, công sai, số hạng đầu", () => {
  const sum = expectedAnswer("Cho cấp số cộng có $u_1=2$, công sai $d=3$. Tính tổng 10 số hạng đầu.");
  assert.deepEqual(sum, { kind: "arithmetic_sum", value: 155 });
  assert.equal(expectedAnswer("Cho cấp số cộng có $u_{1}=-2$, công sai $d=-3$. Tính tổng của 4 số hạng đầu ($S_{4}$).").value, -26);
  assert.ok(matchesExpected("$155$", sum));
  assert.ok(!matchesExpected("$150$", sum));
  for (const q of [
    "Cho cấp số nhân có u_1=2, công bội q=3. Tính tổng 10 số hạng đầu.",
    "Cho cấp số cộng có u_1=2, d=3. Tính số hạng thứ 10.",
    "Cho cấp số cộng có u_1=2, d=3. Tính tổng 10 số hạng đầu và số hạng thứ 10.",
    "Cho cấp số cộng có u_1=2, d=3. Tính tổng 10 số hạng đầu S_9.",
    "Cho cấp số cộng có u_1=2, d=3. Tính tổng n số hạng đầu.",
  ]) assert.equal(expectedAnswer(q), null, q);
});

// ─── validateVariant ───────────────────────────────────────────────────────
test("đề hợp lệ qua kiểm, đáp án được backend tính lại", () => {
  const { variant, errors, expected } = check(rawAnswer());
  assert.deepEqual(errors, []);
  assert.equal(expected.kind, "quadratic_roots");
  assert.equal(variant.options.filter((o) => o.isCorrect).length, 1);
  assert.equal(variant.options.find((o) => o.isCorrect).letter, "A");
  assert.deepEqual(variant.formulaIds, IDS);
  assert.ok(!variant.blankAnswer.includes("$"));
});

test("đề mới đổi dạng dù cùng id công thức vẫn bị trả lại cho AI sửa", () => {
  const changed = check(rawAnswer({ question: "Tính tổng các nghiệm của phương trình $x^2 - 7x + 10 = 0$." }));
  assert.ok(changed.errors.some((e) => e.includes("đổi dạng bài")), changed.errors.join("; "));
  const reverse = check(rawAnswer(), { original: "Tính tổng các nghiệm của phương trình $x^2 - 5x + 6 = 0$." });
  assert.ok(reverse.errors.some((e) => e.includes("đổi dạng bài")), reverse.errors.join("; "));
});

test("Quiz đổi số liệu nhưng giữ nguyên đáp số ở dạng đã kiểm được → trả lại", () => {
  const angle = validateVariant({
    question: "Tam giác ABC có A = 40°, B = 70°. Tính góc C.",
    options: [
      { letter: "A", text: "$70°$" }, { letter: "B", text: "$60°$" },
      { letter: "C", text: "$80°$" }, { letter: "D", text: "$90°$" },
    ],
    answer: "A", blank_answer: "70", explanation: "Tổng ba góc bằng 180°.", formula_ids: [],
  }, { original: "Tam giác ABC có A = 50°, B = 60°. Tính góc C.", allowedIds: [], requireIds: false });
  assert.ok(angle.errors.some((e) => e.includes("đáp số đề mới phải khác")), angle.errors.join("; "));

  const roots = check(rawAnswer({ question: "Giải phương trình $2x^2 - 10x + 12 = 0$." }));
  assert.ok(roots.errors.some((e) => e.includes("đáp số đề mới phải khác")), roots.errors.join("; "));
});

test("Quiz thể tích khối cầu: kiểm đáp án số, phát hiện phương án sai và đổi sang diện tích", () => {
  const original = "Tính thể tích khối cầu có bán kính 2 cm.";
  const allowedIds = ["hh12-matcau-thetich"];
  const base = {
    question: "Tính thể tích khối cầu có bán kính 3 cm.",
    options: [
      { letter: "A", text: "$36\\pi$" }, { letter: "B", text: "$27\\pi$" },
      { letter: "C", text: "$12\\pi$" }, { letter: "D", text: "$9\\pi$" },
    ],
    answer: "A", blank_answer: "36pi", explanation: "Áp dụng công thức thể tích khối cầu.",
    formula_ids: allowedIds,
  };
  const ctx = { original, allowedIds };
  const ok = validateVariant(base, ctx);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.expected.kind, "sphere_volume");
  const wrong = validateVariant({ ...base, answer: "B", blank_answer: "27pi" }, ctx);
  assert.ok(wrong.errors.some((e) => e.startsWith("đáp án sai")));
  const wrongBlank = validateVariant({ ...base, blank_answer: "27π" }, ctx);
  assert.ok(wrongBlank.errors.some((e) => e.includes("blank_answer không khớp")));
  const changed = validateVariant({ ...base, question: "Tính diện tích mặt cầu có bán kính 3 cm." }, ctx);
  assert.ok(changed.errors.some((e) => e.includes("đổi dạng bài")));
});

test("Quiz tổng cấp số cộng: kiểm đáp án và không giao bài đổi số nhưng cùng đáp số", () => {
  const original = "Cho cấp số cộng có u_1=2, công sai d=3. Tính tổng 10 số hạng đầu.";
  const allowedIds = ["ds11-csc-tong"];
  const base = {
    question: "Cho cấp số cộng có u_1=4, công sai d=2. Tính tổng 8 số hạng đầu.",
    options: [
      { letter: "A", text: "$88$" }, { letter: "B", text: "$80$" },
      { letter: "C", text: "$96$" }, { letter: "D", text: "$72$" },
    ],
    answer: "A", blank_answer: "88", explanation: "Áp dụng công thức tổng cấp số cộng.",
    formula_ids: allowedIds,
  };
  const ctx = { original, allowedIds };
  const ok = validateVariant(base, ctx);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.expected.kind, "arithmetic_sum");
  const wrong = validateVariant({ ...base, answer: "B", blank_answer: "80" }, ctx);
  assert.ok(wrong.errors.some((e) => e.startsWith("đáp án sai")));
  const sameAnswer = validateVariant({ ...base, question: "Cho cấp số cộng có u_1=11, công sai d=1. Tính tổng 10 số hạng đầu." }, ctx);
  assert.ok(sameAnswer.errors.some((e) => e.includes("đáp số đề mới phải khác")));
});

test("AI đánh dấu nhầm đáp án (backend tính ra phương án khác) → lỗi", () => {
  const { errors } = check(rawAnswer({ answer: "C" }));
  assert.ok(errors.some((e) => e.startsWith("đáp án sai")), errors.join("; "));
});

test("thiếu phương án / nhiều đáp án đúng / phương án trùng → lỗi", () => {
  const three = check(rawAnswer({ options: [{ letter: "A", text: "$1$" }, { letter: "B", text: "$2$" }, { letter: "C", text: "$3$" }] }));
  assert.ok(three.errors.some((e) => e.includes("4 phương án")));

  const twoCorrect = validateVariant({
    ...JSON.parse(JSON.stringify(parseModelJson(rawAnswer()))),
    answer: undefined,
    options: [
      { letter: "A", text: "$1$", isCorrect: true }, { letter: "B", text: "$2$", isCorrect: true },
      { letter: "C", text: "$3$" }, { letter: "D", text: "$4$" },
    ],
  }, { original: ORIGINAL, allowedIds: IDS });
  assert.ok(twoCorrect.errors.some((e) => e.includes("đúng 1 phương án")));

  const dup = check(rawAnswer({ options: [
    { letter: "A", text: "$x = 2; x = 5$" }, { letter: "B", text: "$x = 5; x = 2$" },
    { letter: "C", text: "$x = 1; x = 10$" }, { letter: "D", text: "Vô nghiệm" },
  ] }));
  assert.ok(dup.errors.some((e) => e.includes("trùng nhau")));

  const dupFraction = check(rawAnswer({ question: "Tính tổng các nghiệm của phương trình $2x^2 - 3x + 1 = 0$.", options: [
    { letter: "A", text: "$\\frac{3}{2}$" }, { letter: "B", text: "$1,5$" }, { letter: "C", text: "$3$" }, { letter: "D", text: "$-3$" },
  ], blank_answer: "3/2" }));
  assert.ok(dupFraction.errors.some((e) => e.includes("trùng nhau")));
});

test("phương trình đường tròn khác tâm nhưng cùng bán kính không bị xem là phương án trùng", () => {
  const base = {
    question: "Viết phương trình đường tròn tâm I(3; 4), bán kính 3.",
    options: [
      { letter: "A", text: "$(x-3)^2+(y-4)^2=9$" },
      { letter: "B", text: "$(x-4)^2+(y-3)^2=9$" },
      { letter: "C", text: "$(x+3)^2+(y-4)^2=9$" },
      { letter: "D", text: "$(x-3)^2+(y+4)^2=9$" },
    ],
    answer: "A", blank_answer: "(x-3)^2+(y-4)^2=9", explanation: "Dùng công thức phương trình đường tròn.",
    formula_ids: ["hh10-duongtron-phuongtrinh"],
  };
  const ctx = { original: "Viết phương trình đường tròn tâm I(2; 1), bán kính 2.", allowedIds: ["hh10-duongtron-phuongtrinh"] };
  assert.deepEqual(validateVariant(base, ctx).errors, []);
  const duplicate = validateVariant({ ...base, options: [base.options[0], { letter: "B", text: base.options[0].text }, base.options[2], base.options[3]] }, ctx);
  assert.ok(duplicate.errors.some((e) => e.includes("trùng nhau")));
});

test("số liệu y hệt đề gốc → lỗi; đề mới không có số → lỗi", () => {
  const same = check(rawAnswer({ question: "Tìm nghiệm của phương trình $x^2 - 5x + 6 = 0$." }));
  assert.ok(same.errors.some((e) => e.includes("khác đề gốc")));
  const noNumbers = check(rawAnswer({ question: "Giải phương trình bậc hai đã cho." }));
  assert.ok(noNumbers.errors.some((e) => e.includes("không có số liệu")));
});

test("blank_answer: bỏ dấu $, cấm nhãn A–D, phải khớp phương án đúng khi là số", () => {
  const sumQ = "Tính tổng các nghiệm của phương trình $2x^2 - 6x + 1 = 0$.";
  const opts = [{ letter: "A", text: "$3$" }, { letter: "B", text: "$-3$" }, { letter: "C", text: "$\\frac{1}{2}$" }, { letter: "D", text: "$6$" }];
  const ok = check(rawAnswer({ question: sumQ, options: opts, blank_answer: "$3$" }), { original: "Tính tổng các nghiệm của phương trình $x^2 - 5x + 6 = 0$." });
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.variant.blankAnswer, "3");
  const label = check(rawAnswer({ question: sumQ, options: opts, blank_answer: "A" }));
  assert.ok(label.errors.some((e) => e.includes("nhãn")));
  const mismatch = check(rawAnswer({ question: sumQ, options: opts, blank_answer: "6" }));
  assert.ok(mismatch.errors.some((e) => e.includes("không khớp")));
});

test("formula_ids: id bịa / ngoài danh sách bị bỏ; bắt buộc khi đề gốc có công thức", () => {
  const fake = check(rawAnswer({ formula_ids: ["gt99-khong-co", "hh10-cosin"] }));
  assert.ok(fake.errors.some((e) => e.includes("formula_ids")));
  assert.deepEqual(fake.variant.formulaIds, []); // hh10-cosin có thật nhưng không nằm trong danh sách gửi AI
  const baseOnly = check(rawAnswer({ formula_ids: [] }), { requireIds: false });
  assert.ok(!baseOnly.errors.some((e) => e.includes("formula_ids")));
});

test("dữ kiện vô lý (ba cạnh không tạo thành tam giác) → lỗi", () => {
  const { errors } = validateVariant({
    question: "Cho tam giác ABC có ba cạnh 1, 2, 4. Tính diện tích tam giác.",
    options: [{ letter: "A", text: "$1$" }, { letter: "B", text: "$2$" }, { letter: "C", text: "$3$" }, { letter: "D", text: "$4$" }],
    answer: "A", blank_answer: "1", explanation: "Dùng Hê-rông.", formula_ids: ["hh10-herong"],
  }, { original: "Cho tam giác ABC có ba cạnh 5, 12, 13. Tính diện tích tam giác.", allowedIds: ["hh10-herong"] });
  assert.ok(errors.some((e) => e.includes("vô lý")), errors.join("; "));
});

test("lệch dấu $ / ngoặc → lỗi; JSON hỏng → lỗi", () => {
  const broken = check(rawAnswer({ explanation: "Ta có $\\frac{7}{2 = 3" }));
  assert.ok(broken.errors.some((e) => e.includes("lệch")));
  assert.deepEqual(validateVariant(null, { original: ORIGINAL, allowedIds: IDS }).errors, ["JSON không đọc được"]);
});

// ─── Prompt ────────────────────────────────────────────────────────────────
test("prompt: thư viện chỉ gồm công thức của câu trả lời Finder, đề gốc ở tin cuối", () => {
  const { formulas, requireIds } = allowedFormulas(ORIGINAL, [...IDS, "khong-co-that"]);
  assert.deepEqual(formulas.map((f) => f.id), IDS);
  assert.equal(requireIds, true);
  const msgs = buildVariantMessages({ problem: ORIGINAL, formulas });
  assert.equal(msgs[0].content, VARIANT_SYSTEM_PROMPT);
  assert.match(msgs[1].content, /ds10-phuongtrinh-bac2/);
  assert.equal(msgs.at(-1).role, "user");
  assert.match(msgs.at(-1).content, /x\^2 - 5x \+ 6/);
  assert.equal(allowedFormulas("Tam giác ABC có A = 50°, B = 60°. Tính góc C.", []).requireIds, false);
});

// ─── generateVariant với Gemini giả ───────────────────────────────────────
const fakeGroq = (replies) => {
  const calls = [];
  return {
    calls,
    chat: { completions: { create: async (params) => {
      calls.push(params);
      const r = replies[calls.length - 1];
      if (r instanceof Error) throw r;
      return { choices: [{ message: { content: r }, finish_reason: "stop" }], usage: {} };
    } } },
  };
};

test("lần 1 không qua kiểm → hỏi lại kèm lỗi, lần 2 đạt", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq([rawAnswer({ answer: "C" }), rawAnswer()]);
  const { variant, meta } = await generateVariant({ groq, problem: ORIGINAL, formulaIds: IDS });
  assert.equal(groq.calls.length, 2);
  assert.equal(meta.attempts, 2);
  assert.equal(meta.verified, "quadratic_roots");
  assert.match(groq.calls[1].messages.at(-1).content, /đáp án sai/);
  assert.equal(variant.options.find((o) => o.isCorrect).letter, "A");
});

test("hai lần đều không qua kiểm → VariantError (server hoàn lượt)", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq(["không phải JSON", rawAnswer({ answer: "B" })]);
  await assert.rejects(generateVariant({ groq, problem: ORIGINAL, formulaIds: IDS }), (err) => err instanceof VariantError && err.meta.errors.length === 2);
});

test("model chính 429 → chuyển sang model dự phòng, không tính là một lần thử", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const busy = Object.assign(new Error("gemini 429: quota per minute (RPM) try again in 20s"), { status: 429, headers: { "retry-after": "20" } });
  const groq = fakeGroq([busy, rawAnswer()]);
  const { meta } = await generateVariant({ groq, problem: ORIGINAL, formulaIds: IDS });
  assert.equal(groq.calls[0].model, FINDER_MODEL);
  assert.equal(groq.calls[1].model, FINDER_FALLBACK_MODEL);
  assert.equal(meta.attempts, 1);
  assert.equal(meta.fallback.reason, "minute_limit");
  fallbackState.primaryBlockedUntil = 0;
});

// ─── Kiểm chéo (đề không có bộ tự tính lại) ──────────────────────────────
const COS_ORIGINAL = "Cho tam giác $ABC$ có $a = 7$, $b = 8$, $c = 9$. Tính $\\cos A$.";
const COS_IDS = ["hh10-hequa-cosin"];
const cosAnswer = (over = {}) => rawAnswer({
  question: "Cho tam giác $ABC$ có các cạnh $a = 5$, $b = 7$, $c = 8$. Tính $\\cos A$.",
  options: [
    { letter: "A", text: "$\\frac{1}{2}$" }, { letter: "B", text: "$\\frac{11}{14}$" },
    { letter: "C", text: "$\\frac{5}{7}$" }, { letter: "D", text: "$\\frac{19}{28}$" },
  ],
  answer: "B", blank_answer: "11/14",
  explanation: "Áp dụng hệ quả định lý côsin: $\\cos A = \\frac{49 + 64 - 25}{112} = \\frac{11}{14}$.",
  formula_ids: COS_IDS,
  ...over,
});
const solverReply = (answer) => JSON.stringify({ answer }).replace(/\\\\/g, "\\");

test("crossCheckMatches: số so giá trị, không phải số so chuỗi chuẩn hoá", () => {
  assert.ok(crossCheckMatches("$\\frac{11}{14}$", "\\dfrac{22}{28}"));
  assert.ok(crossCheckMatches("$x = 2; x = 5$", "x = 5; x = 2"));
  assert.ok(!crossCheckMatches("$\\frac{11}{14}$", "\\frac{1}{2}"));
  assert.ok(crossCheckMatches("$(1; +\\infty)$", "(1;+\\infty)"));
  assert.ok(crossCheckMatches("$y = 2x + 1$", "2x+1"));
  assert.ok(!crossCheckMatches("$(1; +\\infty)$", "(-\\infty; 1)"));
  assert.equal(normalizeAnswerText("$x = \\dfrac{1}{2}$."), "\\frac{1}{2}");
});

test("cực trị: so cặp hoành độ/giá trị có thứ tự dù AI viết nhãn khác", () => {
  const q = "Tìm điểm cực đại và giá trị cực đại của hàm số $f(x)=-x^3+12x-5$.";
  const option = "Điểm cực đại $x = 2$, giá trị cực đại $y = 11$";
  assert.ok(crossCheckMatches(option, "x = 2; y_{CĐ} = 11", q));
  assert.ok(!crossCheckMatches(option, "x = -2; y_{CĐ} = 11", q));
  assert.ok(!crossCheckMatches(option, "x = 2; y_{CĐ} = 10", q));
  assert.ok(!crossCheckMatches(option, "x = 11; y_{CĐ} = 2", q));
  assert.ok(!crossCheckMatches(option, "x = 2", q));
  assert.ok(!crossCheckMatches(option, "x = 2; y_{CĐ} = 11", "Tìm nghiệm phương trình"));
});

test("bài cực đại trong ảnh: hai cách ghi đáp án khớp, không trả AI đang bận", async () => {
  const original = "Tìm điểm cực đại và giá trị cực đại của hàm số $f(x)=-x^3+3x+1$.";
  const formulaIds = ["gt12-daoham-basic", "gt11-daoham-tonghieu", "gt12-cuctrituoc"];
  const generated = rawAnswer({
    question: "Tìm điểm cực đại và giá trị cực đại của hàm số $f(x)=-x^3+12x-5$.",
    options: [
      { letter: "A", text: "Điểm cực đại $x=2$, giá trị cực đại $y=11$" },
      { letter: "B", text: "Điểm cực đại $x=-2$, giá trị cực đại $y=11$" },
      { letter: "C", text: "Điểm cực đại $x=2$, giá trị cực đại $y=10$" },
      { letter: "D", text: "Điểm cực đại $x=-2$, giá trị cực đại $y=-21$" },
    ],
    answer: "A", blank_answer: "x=2, y=11", explanation: "Dùng đạo hàm để xét cực trị.",
    formula_ids: ["gt12-cuctrituoc"],
  });
  const groq = fakeGroq([generated, solverReply("x = 2; y_{CĐ} = 11")]);
  const { meta } = await generateVariant({ groq, problem: original, formulaIds, grade: 12 });
  assert.equal(meta.crossChecked, true);
  assert.equal(meta.attempts, 1);
  assert.equal(groq.calls.length, 2);
});

test("kiểm chéo khớp → giao đề, crossChecked = true; lần giải chỉ nhận đề (không phương án, không lời giải)", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq([cosAnswer(), solverReply("\\frac{11}{14}")]);
  const { variant, meta } = await generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS });
  assert.equal(groq.calls.length, 2);
  assert.equal(meta.verified, null);
  assert.equal(meta.crossChecked, true);
  assert.equal(meta.attempts, 1);
  assert.equal(variant.options.find((o) => o.isCorrect).letter, "B");
  const sent = JSON.stringify(groq.calls[1].messages);
  assert.equal(groq.calls[1].messages.at(-1).content, variant.question);
  for (const leak of ["11}{14}", "19}{28}", "hệ quả định lý côsin", "\"answer\": \"B\""]) assert.ok(!sent.includes(leak), leak);
});

test("kiểm chéo lệch → hỏi lại (tính vào số lần hiện có); lệch lần nữa → VariantError", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq([cosAnswer(), solverReply("\\frac{1}{2}"), cosAnswer(), solverReply("\\frac{5}{7}")]);
  await assert.rejects(
    generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS }),
    (err) => err instanceof VariantError && err.meta.attempts === 2 && err.meta.crossCheckCalls === 2
      && err.meta.errors.every((e) => e.some((x) => x.startsWith("kiểm chéo lệch"))),
  );
  assert.match(groq.calls[2].messages.at(-1).content, /kiểm chéo lệch/);
});

test("kiểm chéo lệch lần 1, lần 2 khớp → giao đề lần 2", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq([cosAnswer(), solverReply("\\frac{1}{2}"), cosAnswer(), solverReply("\\frac{11}{14}")]);
  const { meta } = await generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS });
  assert.equal(meta.attempts, 2);
  assert.equal(meta.crossChecked, true);
});

test("hết ngân sách → bỏ kiểm chéo, giao đề với crossChecked = false", async () => {
  fallbackState.primaryBlockedUntil = 0;
  let t = 0;
  const groq = fakeGroq([cosAnswer()]);
  // Còn 5 giây (< 8 giây tối thiểu cho một lần gọi) sau khi sinh đề.
  const { meta } = await generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS, now: () => t, deadline: 5_000 });
  assert.equal(groq.calls.length, 1);
  assert.equal(meta.crossChecked, false);
  assert.equal(meta.crossCheckSkipped, "budget");
});

for (const [label, err] of [
  ["429", Object.assign(new Error("gemini 429: quota per minute (RPM)"), { status: 429, headers: { "retry-after": "20" } })],
  ["500", Object.assign(new Error("gemini 500"), { status: 500 })],
  ["hết giờ (408)", Object.assign(new Error("gemini timeout"), { status: 408 })],
]) {
  test(`lần giải lỗi ${label} → thử lại MỘT lần bằng model dự phòng, khớp thì giao đề`, async () => {
    fallbackState.primaryBlockedUntil = 0;
    const groq = fakeGroq([cosAnswer(), err, solverReply("\\frac{11}{14}")]);
    const { meta } = await generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS });
    assert.equal(groq.calls[1].model, FINDER_MODEL);
    assert.equal(groq.calls[2].model, FINDER_FALLBACK_MODEL);
    assert.equal(meta.crossChecked, true);
    assert.equal(meta.crossCheckFallback, true);
    fallbackState.primaryBlockedUntil = 0;
  });
}

test("lần giải lỗi cả với model dự phòng → VariantError (không giao đề chưa kiểm)", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const e500 = Object.assign(new Error("gemini 500"), { status: 500 });
  const e408 = Object.assign(new Error("gemini timeout"), { status: 408 });
  const groq = fakeGroq([cosAnswer(), e500, e408]);
  await assert.rejects(
    generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS }),
    (e) => e instanceof VariantError && e.meta.crossCheckFailed === "error" && e.meta.crossCheckErrors.length === 2,
  );
  assert.equal(groq.calls.length, 3);
  fallbackState.primaryBlockedUntil = 0;
});

test("lần giải trả JSON không đọc được → VariantError", async () => {
  fallbackState.primaryBlockedUntil = 0;
  await assert.rejects(
    generateVariant({ groq: fakeGroq([cosAnswer(), "Đáp án là 11/14"]), problem: COS_ORIGINAL, formulaIds: COS_IDS }),
    (e) => e instanceof VariantError && e.meta.crossCheckFailed === "unreadable",
  );
});

test("lần giải đầu lỗi, không còn đủ 8 giây cho model dự phòng → VariantError, không giao", async () => {
  fallbackState.primaryBlockedUntil = 0;
  let t = 0;
  const e500 = Object.assign(new Error("gemini 500"), { status: 500 });
  // Mỗi lần gọi tốn 6 giây: sinh đề (còn 13s), giải lần 1 lỗi, sau đó còn 7s < 8s → không thử dự phòng.
  const groq = fakeGroq([cosAnswer(), e500]);
  const create = groq.chat.completions.create;
  groq.chat.completions.create = async (...a) => { t += 6_000; return create(...a); };
  await assert.rejects(
    generateVariant({ groq, problem: COS_ORIGINAL, formulaIds: COS_IDS, now: () => t, deadline: 19_000 }),
    (e) => e instanceof VariantError && e.meta.crossCheckFailed === "error_no_time",
  );
  assert.equal(groq.calls.length, 2);
});

test("đáp án không phải số → so chuỗi chuẩn hoá (khớp và lệch)", async () => {
  const original = "Tìm khoảng đồng biến của hàm số $y = x^2 - 2x + 3$.";
  const ids = ["hh10-parabola"];
  const variantRaw = rawAnswer({
    question: "Tìm khoảng đồng biến của hàm số $y = x^2 - 4x + 1$.",
    options: [
      { letter: "A", text: "$(2; +\\infty)$" }, { letter: "B", text: "$(-\\infty; 2)$" },
      { letter: "C", text: "$(-2; +\\infty)$" }, { letter: "D", text: "$(-\\infty; -2)$" },
    ],
    answer: "A", blank_answer: "(2;+inf)", formula_ids: ids,
    explanation: "Hệ số $a = 1 > 0$, đỉnh có hoành độ $x = 2$ nên hàm số đồng biến trên $(2; +\\infty)$.",
  });
  fallbackState.primaryBlockedUntil = 0;
  const ok = await generateVariant({ groq: fakeGroq([variantRaw, solverReply("(2; +\\infty)")]), problem: original, formulaIds: ids });
  assert.equal(ok.meta.crossChecked, true);
  fallbackState.primaryBlockedUntil = 0;
  await assert.rejects(
    generateVariant({ groq: fakeGroq([variantRaw, solverReply("(-\\infty; 2)"), variantRaw, solverReply("(-\\infty; 2)")]), problem: original, formulaIds: ids }),
    (err) => err instanceof VariantError,
  );
});

test("đề đã có bộ tự tính lại → không gọi kiểm chéo, crossChecked = null", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const groq = fakeGroq([rawAnswer()]);
  const { meta } = await generateVariant({ groq, problem: ORIGINAL, formulaIds: IDS });
  assert.equal(groq.calls.length, 1);
  assert.equal(meta.verified, "quadratic_roots");
  assert.equal(meta.crossChecked, null);
});

test("lỗi không chuyển dự phòng được (401) → ném ra cho server", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const denied = Object.assign(new Error("gemini 401"), { status: 401 });
  await assert.rejects(generateVariant({ groq: fakeGroq([denied]), problem: ORIGINAL, formulaIds: IDS }), (err) => err === denied);
});
