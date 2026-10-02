// Test chấm "Điền đáp án" (src/utils/fillAnswer.js). Chạy: npm run test:quiz
// 1) Các cặp cố định phải chấm ĐÚNG / SAI.
// 2) Đo trên toàn bộ questions.js (câu đủ điều kiện):
//    - gõ đúng blankAnswer → 100% chấm đúng;
//    - gõ biến thể (khoảng trắng, hoa/thường, ², **, dấu thập phân, π, √, ∞) → 100% chấm đúng;
//    - gõ blankAnswer của câu KHÁC cùng chủ đề → 0% chấm nhầm thành đúng (trừ đáp án y hệt nhau);
//    - gõ "A".."D" → luôn sai.
import assert from "node:assert/strict";
import { questionsPool } from "../src/data/questions.js";
import { checkFillAnswer, isFillEligible, normalizeFillAnswer } from "../src/utils/fillAnswer.js";

let failed = 0;
const q = (blankAnswer) => ({ blankAnswer });

// ─── 1. Cặp cố định ──────────────────────────────────────────────────────────
const SHOULD_PASS = [
  ["3X^2", "3x^2"], ["3x²", "3x^2"], ["3x**2", "3x^2"], [" 3 x ^ 2 ", "3x^2"],
  ["7,5", "7.5"], ["7.5", "7,5"], ["0.5", "1/2"], ["2/4", "1/2"], ["-0,625", "-5/8"],
  ["36 pi", "36pi"], ["36π", "36pi"], ["36pi cm^3", "36pi"], ["30°", "30 độ"], ["30", "30 độ"],
  ["6", "6 cm"], ["-19.6", "-19,6 m/s"],
  ["a^2 sqrt(3)/4", "a^2*sqrt(3)/4"], ["a^2√3/4", "a^2*sqrt(3)/4"],
  ["(0;+∞)", "(0; +inf)"], ["(0; inf)", "(0; +inf)"], ["[4.8;5.2]", "[4,8; 5,2]"],
  ["x=-1", "x = -1"], ["-1", "x = -1"], ["y' = 3x^2", "3x^2"], ["y=2x-1", "y = 2x - 1"],
  ["e^{2x}/2", "e^(2x)/2"], ["SIN X + C", "sin x + C"], ["sin²α+cos²α=1", "sin^2alpha+cos^2alpha=1"],
  ["(1/3;2/3;1)", "(1/3; 2/3; 1)"], ["1010", "1 010"], ["$3x^2$", "3x^2"], ["\\dfrac{1}{2}", "1/2"],
];
const SHOULD_FAIL = [
  ["3x", "3x^2"], ["-3x^2", "3x^2"], ["3x^3", "3x^2"], ["7.6", "7.5"], ["0.33", "1/3"],
  ["(0;inf]", "(0; +inf)"], ["[0;+inf)", "(0; +inf)"], ["50", "5*0"], ["sqrt2", "sqrt3"],
  ["y = -1", "x = -1"], ["1", "x = -1"], ["x+1", "1+x"], ["1/2x", "1/(2x)"], ["1,4", "1,4%"],
  ["A", "3x^2"], ["D", "Có"], ["", "2"], ["2", "2x^2"], ["36", "36pi"], ["sqrt(8)", "2sqrt(2)"],
  ["0", "z - 3 = 0"], ["3", "x + y = 3"], ["2", "2 + 3"],
];
// Giới hạn đã biết (KHÔNG assert, chỉ in ra): hệ quả có chủ đích của quyết định (d) bỏ đơn vị.
const KNOWN_LIMITS = [["2 cm", "2 m"], ["2", "2m^2"]];
for (const [typed, expected] of SHOULD_PASS) {
  try { assert.equal(checkFillAnswer(typed, q(expected)), true); }
  catch { failed++; console.log(`LỖI phải ĐÚNG: "${typed}" vs "${expected}" → ${normalizeFillAnswer(typed)} | ${normalizeFillAnswer(expected)}`); }
}
for (const [typed, expected] of SHOULD_FAIL) {
  try { assert.equal(checkFillAnswer(typed, q(expected)), false); }
  catch { failed++; console.log(`LỖI phải SAI: "${typed}" vs "${expected}" → ${normalizeFillAnswer(typed)} | ${normalizeFillAnswer(expected)}`); }
}
console.log(`Cặp cố định: ${SHOULD_PASS.length} phải đúng + ${SHOULD_FAIL.length} phải sai — lỗi ${failed}`);
for (const [typed, expected] of KNOWN_LIMITS) {
  console.log(`  giới hạn đã biết (bỏ đơn vị): "${typed}" vs "${expected}" → ${checkFillAnswer(typed, q(expected)) ? "chấm đúng" : "chấm sai"}`);
}

// ─── 2. Đo trên dữ liệu thật ─────────────────────────────────────────────────
const eligible = questionsPool.filter(isFillEligible);
const excluded = questionsPool.filter((x) => !isFillEligible(x));
console.log(`Câu đủ điều kiện điền: ${eligible.length}/${questionsPool.length} (loại ${excluded.length})`);

const exact = eligible.filter((x) => checkFillAnswer(x.blankAnswer, x));
console.log(`Gõ đúng blankAnswer → chấm đúng ${exact.length}/${eligible.length}`);
eligible.filter((x) => !exact.includes(x)).forEach((x) => console.log(`  sai: ${x.id} "${x.blankAnswer}"`));
if (exact.length !== eligible.length) failed++;

const VARIANTS = {
  "bỏ hết khoảng trắng": (s) => s.replace(/\s+/g, ""),
  "thêm khoảng trắng quanh dấu": (s) => s.replace(/([=+\-;/])/g, " $1 "),
  "viết HOA": (s) => s.toUpperCase(),
  "^2/^3 → ²/³": (s) => s.replace(/\^2(?![\d(])/g, "²").replace(/\^3(?![\d(])/g, "³"),
  "^ → **": (s) => s.replace(/\^/g, "**"),
  "dấu chấm thập phân → phẩy": (s) => s.replace(/(\d)\.(\d)/g, "$1,$2"),
  "dấu phẩy thập phân → chấm": (s) => s.replace(/(\d),(\d)/g, "$1.$2"),
  "pi → π": (s) => s.replace(/pi/g, "π"),
  "sqrt → √": (s) => s.replace(/sqrt/g, "√"),
  "inf → ∞": (s) => s.replace(/inf/g, "∞"),
};
let varTotal = 0, varOk = 0;
for (const [name, f] of Object.entries(VARIANTS)) {
  let t = 0, ok = 0;
  for (const x of eligible) {
    const v = f(x.blankAnswer);
    if (v === x.blankAnswer) continue;
    t++;
    if (checkFillAnswer(v, x)) ok++;
    else console.log(`  biến thể "${name}" sai: ${x.id} "${v}" vs "${x.blankAnswer}"`);
  }
  varTotal += t; varOk += ok;
  console.log(`  ${name}: ${ok}/${t}`);
}
console.log(`Gõ biến thể → chấm đúng ${varOk}/${varTotal}`);
if (varOk !== varTotal) failed++;

// Đáp án câu khác cùng chủ đề. "Y hệt nhau" = giống nhau sau chuẩn hoá; tách riêng nhóm chỉ khác
// tiền tố biến ("x = -1" và "-1") — theo quyết định (c) đó là cùng một đáp án.
const bare = (s) => normalizeFillAnswer(s).replace(/^[a-z][a-z0-9']{0,3}=(?!.*=)/, "");
let pairs = 0, identical = 0;
const sameByPrefix = [], falseAccept = [];
for (const a of eligible) {
  for (const b of eligible) {
    if (a === b || a.topic !== b.topic) continue;
    if (normalizeFillAnswer(a.blankAnswer) === normalizeFillAnswer(b.blankAnswer)) { identical++; continue; }
    pairs++;
    if (!checkFillAnswer(b.blankAnswer, a)) continue;
    const line = `${b.id} "${b.blankAnswer}" → ${a.id} "${a.blankAnswer}"`;
    (bare(a.blankAnswer) === bare(b.blankAnswer) ? sameByPrefix : falseAccept).push(line);
  }
}
console.log(`Gõ đáp án câu khác cùng chủ đề: ${pairs} cặp (bỏ ${identical} cặp y hệt sau chuẩn hoá)`);
console.log(`  chấm đúng vì chỉ khác tiền tố biến (quy tắc c): ${sameByPrefix.length}`);
sameByPrefix.forEach((s) => console.log(`    ${s}`));
console.log(`  chấm NHẦM thành đúng: ${falseAccept.length} (${((falseAccept.length / pairs) * 100).toFixed(2)}%)`);
falseAccept.forEach((s) => console.log(`    nhầm: ${s}`));
if (falseAccept.length) failed++;

const letterOk = eligible.filter((x) => ["A", "B", "C", "D"].some((l) => checkFillAnswer(l, x)));
console.log(`Gõ "A".."D" → chấm đúng ${letterOk.length} câu${letterOk.length ? ": " + letterOk.map((x) => x.id).join(", ") : ""}`);
if (letterOk.length) failed++;

if (failed) { console.log(`\nKẾT QUẢ: ${failed} nhóm lỗi`); process.exit(1); }
console.log("\nKẾT QUẢ: đạt");
