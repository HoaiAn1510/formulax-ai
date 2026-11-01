import { test } from "node:test";
import assert from "node:assert/strict";
import {
  latexNumber, optionNumber, optionNumbers, quadraticCoefficients, expectedAnswer, matchesExpected,
  validateVariant, generateVariant, parseVariantJson, allowedFormulas, buildVariantMessages, VariantError, VARIANT_SYSTEM_PROMPT,
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
  assert.equal(optionNumber("$70^\\circ$"), 70);
  assert.equal(optionNumber("$5cm$"), 5);
  assert.deepEqual(optionNumbers("$x = 2; x = 5$"), [2, 5]);
  assert.deepEqual(optionNumbers("$x_1 = 2, x_2 = 5$"), [2, 5]);
  assert.deepEqual(optionNumbers("$S = \\{-1; 1,5\\}$"), [-1, 1.5]);
  assert.equal(optionNumbers("Vô nghiệm"), null);
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

test("số liệu y hệt đề gốc → lỗi; đề mới không có số → lỗi", () => {
  const same = check(rawAnswer({ question: "Tìm nghiệm của phương trình $x^2 - 5x + 6 = 0$." }));
  assert.ok(same.errors.some((e) => e.includes("khác đề gốc")));
  const noNumbers = check(rawAnswer({ question: "Giải phương trình bậc hai đã cho." }));
  assert.ok(noNumbers.errors.some((e) => e.includes("không có số liệu")));
});

test("blank_answer: bỏ dấu $, cấm nhãn A–D, phải khớp phương án đúng khi là số", () => {
  const sumQ = "Tính tổng các nghiệm của phương trình $2x^2 - 6x + 1 = 0$.";
  const opts = [{ letter: "A", text: "$3$" }, { letter: "B", text: "$-3$" }, { letter: "C", text: "$\\frac{1}{2}$" }, { letter: "D", text: "$6$" }];
  const ok = check(rawAnswer({ question: sumQ, options: opts, blank_answer: "$3$" }));
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

test("lỗi không chuyển dự phòng được (401) → ném ra cho server", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const denied = Object.assign(new Error("gemini 401"), { status: 401 });
  await assert.rejects(generateVariant({ groq: fakeGroq([denied]), problem: ORIGINAL, formulaIds: IDS }), (err) => err === denied);
});
