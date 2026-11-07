// "Luyện lại dạng bài đã hỏi" (QuizView): từ một đề học sinh đã hỏi AI Finder, Gemini sinh MỘT câu trắc
// nghiệm CÙNG DẠNG nhưng ĐỔI SỐ LIỆU, kèm đáp án và lời giải. Khác AI Finder: ở đây AI được tính ra đáp số
// (đây là đề luyện tập, cần đáp án để chấm) — nên KHÔNG tin AI, mọi câu phải qua validateVariant:
//   - JSON đúng hình dạng (parseModelJson tự sửa escape LaTeX như Finder);
//   - đúng 4 phương án A–D khác nhau, đúng 1 đáp án; blankAnswer không có $ và không phải nhãn A–D;
//   - số liệu khác đề gốc; dữ kiện không vô lý (precheckInvalidQuestion của Finder);
//   - formula_ids chỉ là id có thật trong formulas.js VÀ thuộc danh sách gửi cho AI;
//   - dạng bài đã có bộ kiểm (tổng ba góc, Pytago, phương trình bậc hai, thể tích khối cầu,
//     tổng cấp số cộng)
//     thì backend TỰ TÍNH lại đáp án và kiểm đề mới vẫn cùng loại câu hỏi;
//   - dạng khác: KIỂM CHÉO — gọi Gemini lần nữa giải độc lập đề mới (chỉ gửi đề), đáp số phải khớp phương án
//     đúng; lỗi gọi → thử model dự phòng một lần, vẫn lỗi → VariantError. CHỈ khi còn < 8 giây trong ngân sách
//     mới giao đề không kiểm chéo (meta.crossChecked = false).
// Không qua kiểm → hỏi lại AI một lần kèm danh sách lỗi; vẫn không qua → VariantError (server hoàn lượt,
// báo "AI đang bận" như Finder).

import { getFormula, isValidFormulaId, formatForPrompt, shortlistFormulas } from "./formulaCatalog.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "./finderPrompt.js";
import { fallbackState, primaryBlockMs, dailyLimitBlockMs } from "./finderAnswer.js";
import { parseModelJson, extractNumbers, hasBalancedBraces, wrapLooseLatex, fixStrayQuoteEscapes, hasTriangleContext } from "./solutionGuard.js";
import { precheckInvalidQuestion } from "./invalidQuestionPrecheck.js";
import { keepOcrNewlines } from "./ocrReader.js";

/**
 * Parse JSON đề của Gemini. Lời giải nhiều dòng: "\n" đứng trước chữ ("…\nThay số…") phải là xuống dòng,
 * không phải lệnh LaTeX "\nThay" — dùng chung cách xử lý của luồng đọc ảnh (keepOcrNewlines; \neq, \nu…
 * vẫn giữ là lệnh). Lỗi thật khi chạy thử 2026-11-01.
 */
export function parseVariantJson(raw) {
  return parseModelJson(keepOcrNewlines(raw));
}

// Ngân sách giống /api/chat: PHẢI nhỏ hơn timeout 45 giây của frontend (callVariant trong QuizView.jsx),
// nếu không học sinh mất lượt mà không thấy đề.
export const VARIANT_BUDGET_MS = 40_000;
const PER_CALL_TIMEOUT_MS = 25_000;
const MIN_CALL_MS = 8_000;
const MAX_ATTEMPTS = 2; // lần 2 chỉ khi lần 1 không qua kiểm (JSON hỏng, sai cấu trúc, sai đáp án)
export const MAX_FORMULA_IDS = 4;
export const VARIANT_PARAMS = { temperature: 0.5, max_completion_tokens: 1800 };
const LETTERS = ["A", "B", "C", "D"];
const LIMITS = { question: 1000, option: 200, blank: 60, explanation: 2500 };

export class VariantError extends Error {
  constructor(message, { meta } = {}) {
    super(message);
    this.code = "variant_invalid";
    this.status = 502;
    this.meta = meta;
  }
}

// ─── Prompt ────────────────────────────────────────────────────────────────
export const VARIANT_SYSTEM_PROMPT = String.raw`Bạn là FormulaX AI — người ra đề luyện tập Toán THPT Việt Nam (chương trình GDPT 2018). Học sinh gửi một ĐỀ GỐC đã từng hỏi. Nhiệm vụ: viết MỘT câu trắc nghiệm MỚI cùng dạng bài để học sinh luyện lại công thức.

QUY TẮC
1. Cùng dạng: cùng loại câu hỏi, cùng công thức, cùng số bước giải như đề gốc. Chỉ đổi số liệu (và có thể đổi tên điểm/biến). TẤT CẢ số liệu phải khác đề gốc.
2. Số liệu hợp lý và cho đáp số gọn (số nguyên, phân số đơn giản, căn đơn giản). Dữ kiện không được vô lý: ba cạnh phải tạo thành tam giác, tổng các góc trong tam giác bằng 180°, cạnh huyền dài hơn cạnh góc vuông, |sin|, |cos| ≤ 1.
3. Đúng 4 phương án A, B, C, D, khác nhau, đúng MỘT phương án đúng. Ba phương án sai phản ánh lỗi thường gặp (nhầm dấu, quên hệ số, nhầm công thức gần giống) — không bịa số vô nghĩa.
4. "blank_answer": đáp án đúng viết dạng gõ tay cho học sinh, KHÔNG có dấu $ và tránh lệnh LaTeX (viết 3/4, sqrt(2), 2pi). Không ghi nhãn "A"/"B".
5. "explanation": lời giải từng bước, Markdown + LaTeX inline $...$. CHỈ dùng công thức trong THƯ VIỆN bên dưới, gọi công thức bằng tên; KHÔNG tự viết công thức tổng quát nào ngoài thư viện. Được thay số và tính ra đáp số.
6. "formula_ids": id công thức đã dùng, chỉ lấy id có trong THƯ VIỆN.
7. Không dùng số phức. Toàn bộ chữ bằng tiếng Việt.

CHỈ trả về một đối tượng JSON, không có chữ nào khác:
{"question": "đề mới, LaTeX inline $...$", "options": [{"letter": "A", "text": "$...$"}, {"letter": "B", "text": "$...$"}, {"letter": "C", "text": "$...$"}, {"letter": "D", "text": "$...$"}], "answer": "A", "blank_answer": "...", "explanation": "...", "formula_ids": ["..."]}`;

/**
 * Công thức gửi AI: id của câu trả lời Finder (nếu còn hợp lệ) — khi đó đề mới BẮT BUỘC dùng ít nhất một id.
 * Câu trả lời Finder không có id (lời giải chỉ dùng kiến thức nền THCS: tổng ba góc, Pytago) → lọc theo đề
 * như Finder để AI có thư viện tham khảo, nhưng không bắt buộc id.
 */
export function allowedFormulas(problem, formulaIds = [], grade = null) {
  const own = [...new Set((Array.isArray(formulaIds) ? formulaIds : []).filter(isValidFormulaId))].slice(0, MAX_FORMULA_IDS);
  if (own.length) return { formulas: own.map(getFormula), requireIds: true };
  return { formulas: shortlistFormulas([problem], MAX_FORMULA_IDS, { grade }), requireIds: false };
}

export function buildVariantMessages({ problem, formulas }) {
  return [
    { role: "system", content: VARIANT_SYSTEM_PROMPT },
    {
      role: "system",
      content: formulas.length
        ? `THƯ VIỆN (id | lớp | tên | công thức | ghi chú):\n${formulas.map(formatForPrompt).join("\n")}`
        : "THƯ VIỆN: (trống — đề gốc chỉ dùng kiến thức nền THCS: tổng ba góc tam giác, định lý Pytago; formula_ids để [])",
    },
    { role: "user", content: `ĐỀ GỐC:\n${problem}` },
  ];
}

// ─── Tính giá trị số của một chuỗi LaTeX đơn giản ─────────────────────────
// Chỉ hiểu: số (dấu chấm hoặc phẩy thập phân), + - · × / ^, ngoặc, \sqrt{}, \sqrt[n]{}, \frac{}{} (cả
// \dfrac \tfrac), \pi, nhân ngầm ("2\sqrt{3}"). Có chữ cái hay lệnh khác → null (không đoán).
export function latexNumber(raw) {
  let s = String(raw ?? "")
    .replace(/\$/g, "")
    .replace(/\\left|\\right|\\,|\\;|\\!|\\ /g, "")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/[−–]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, "");
  let i = 0;
  const peek = () => s[i];
  const eat = (t) => (s.startsWith(t, i) ? ((i += t.length), true) : false);
  const group = () => {
    if (!eat("{")) return null;
    const v = expr();
    return v !== null && eat("}") ? v : null;
  };
  function atom() {
    const num = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return Number(num[0]); }
    if (eat("\\pi")) return Math.PI;
    if (eat("\\sqrt")) {
      let n = 2;
      if (eat("[")) {
        const idx = /^\d+/.exec(s.slice(i));
        if (!idx) return null;
        i += idx[0].length;
        if (!eat("]")) return null;
        n = Number(idx[0]);
      }
      const v = peek() === "{" ? group() : atom();
      if (v === null || (v < 0 && n % 2 === 0)) return null;
      return Math.sign(v) * Math.abs(v) ** (1 / n);
    }
    if (eat("\\frac")) {
      const a = group();
      const b = a === null ? null : group();
      return a === null || b === null || b === 0 ? null : a / b;
    }
    if (peek() === "{") return group();
    if (eat("(")) {
      const v = expr();
      return v !== null && eat(")") ? v : null;
    }
    return null;
  }
  function power() {
    const base = atom();
    if (base === null) return null;
    if (!eat("^")) return base;
    const e = peek() === "{" ? group() : atom();
    return e === null ? null : base ** e;
  }
  function unary() {
    if (eat("-")) { const v = unary(); return v === null ? null : -v; }
    if (eat("+")) return unary();
    return power();
  }
  function term() {
    let v = unary();
    while (v !== null && i < s.length) {
      if (eat("*")) { const r = unary(); v = r === null ? null : v * r; }
      else if (eat("/")) { const r = unary(); v = r === null || r === 0 ? null : v / r; }
      else if (/[\d\\({]/.test(peek())) { const r = power(); v = r === null ? null : v * r; } // nhân ngầm
      else break;
    }
    return v;
  }
  function expr() {
    let v = term();
    while (v !== null && (peek() === "+" || peek() === "-")) {
      const op = s[i++];
      const r = term();
      v = r === null ? null : op === "+" ? v + r : v - r;
    }
    return v;
  }
  if (!s) return null;
  const v = expr();
  return v !== null && i === s.length && Number.isFinite(v) ? v : null;
}

/** Giá trị số của MỘT phương án: bỏ "x =", "BC =", đơn vị (cm, °, \text{...}). null nếu không đọc được. */
export function optionNumber(text) {
  const s = String(text ?? "").replace(/\$/g, "").trim()
    .replace(/^[A-Za-z]{1,3}(?:_\{?[A-Za-z0-9]+\}?)?\s*=(?!=)/, "") // chỉ "x = 3", "BC = 5", "u_{10} = 7"; phương trình không phải một số
    .replace(/\\text\s*\{[^{}]*\}(?:\s*\^\s*\{?\s*[23]\s*\}?)?/g, "")
    .replace(/\^\s*\{?\s*\\circ\s*\}?|°/g, "")
    .replace(/(?<![A-Za-z\\])(?:k|c|d|m)?m(?:\s*\^\s*\{?\s*[23]\s*\}?|[²³])?\s*$/, "")
    .trim();
  return latexNumber(s);
}

/** Danh sách giá trị trong một phương án nhiều nghiệm ("x = 2; x = 3", "x_1 = 2, x_2 = 3", "\{2; 3\}"). */
export function optionNumbers(text) {
  const s = String(text ?? "").replace(/\$/g, "").replace(/\\\{|\\\}/g, "").replace(/^\s*S\s*=/, "");
  const parts = s.split(/;|\s(?:và|hoặc)\s|\\text\s*\{\s*(?:và|hoặc)\s*\}|,\s*(?=[A-Za-z_\\])/);
  // x_1, x_2 là tập nghiệm không thứ tự; x và y là hai biến khác nhau nên (x=2,y=3) KHÁC (x=3,y=2).
  const labels = parts.map((p) => /^\s*([A-Za-z]{1,3})(?:_\{?[A-Za-z0-9]+\}?)?\s*=/.exec(p)?.[1]?.toLowerCase()).filter(Boolean);
  if (new Set(labels).size > 1) return null;
  const values = parts.map((p) => optionNumber(p));
  return values.length && values.every((v) => v !== null) ? values : null;
}

const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
const sameSet = (xs, ys) => xs.length === ys.length
  && [...xs].sort((a, b) => a - b).every((x, k) => near(x, [...ys].sort((a, b) => a - b)[k]));

// ─── Bộ kiểm đáp án cho dạng bài đã biết ──────────────────────────────────
// LaTeX → chữ thường dễ bắt: \widehat{A} / \hat A / \angle A → "góc A", ^\circ → °, bỏ $.
function plainMath(text) {
  return String(text ?? "").normalize("NFC")
    .replace(/\$/g, " ")
    .replace(/\\(?:widehat|hat)\s*\{\s*([A-Z]{1,3})\s*\}|\\(?:widehat|hat)\s+([A-Z])|\\angle\s*([A-Z]{1,3})/g, (_, a, b, c) => `góc ${a || b || c}`)
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, "°")
    .replace(/góc\s+góc/gi, "góc")
    .replace(/[−–]/g, "-")
    .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\s+/g, " ");
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const toNum = (s) => Number(String(s).replace(",", "."));

/** Tam giác cho hai góc, hỏi góc còn lại → 180° − hai góc. */
function angleSumExpected(q) {
  if (!hasTriangleContext(q) || /cân|đều|ngoài|cạnh|=\s*\d+\s*(?:cm|m)\b/i.test(q)) return null;
  const tri = /(?:tam giác|[Δ△])\s*([A-Z]{3})/i.exec(q);
  if (!tri) return null;
  const given = new Map();
  for (const m of q.matchAll(new RegExp(String.raw`(?:góc\s*)?\b([A-Z])\s*(?:=|bằng)\s*${NUM}\s*°`, "g"))) {
    if (tri[1].includes(m[1])) given.set(m[1], toNum(m[2]));
  }
  if (given.size !== 2) return null;
  const missing = [...tri[1]].find((v) => !given.has(v));
  if (!new RegExp(String.raw`(?:tính|tìm|số đo)[^.?!]*\b(?:góc\s*)?${missing}\b`, "i").test(q)) return null;
  const sum = [...given.values()].reduce((a, b) => a + b, 0);
  return sum < 180 ? { kind: "angle_sum", value: 180 - sum } : null;
}

/** Tam giác vuông cho hai cạnh, hỏi cạnh thứ ba → Pytago. */
function pythagorasExpected(q) {
  const right = /(?:tam giác|[Δ△])\s*([A-Z]{3})\s+vuông\s+tại\s+([A-Z])/i.exec(q);
  if (!right || !right[1].includes(right[2]) || /cân|đều|góc|sin|cos|tan|đường cao|trung tuyến|diện tích|chu vi|bán kính/i.test(q.replace(right[0], ""))) return null;
  const [name, at] = [right[1], right[2]];
  const key = (s) => [...s].sort().join("");
  const hyp = key([...name].filter((v) => v !== at).join(""));
  const sides = new Map();
  for (const m of q.matchAll(new RegExp(String.raw`\b([A-Z]{2})\s*=\s*${NUM}`, "g"))) {
    if ([...m[1]].every((v) => name.includes(v))) sides.set(key(m[1]), toNum(m[2]));
  }
  const all = [key(name[0] + name[1]), key(name[1] + name[2]), key(name[0] + name[2])];
  const missing = all.filter((s) => !sides.has(s));
  if (sides.size !== 2 || missing.length !== 1) return null;
  const asked = missing[0];
  if (!new RegExp(String.raw`(?:tính|tìm|độ dài)[^.?!]*\b(?:${asked}|${[...asked].reverse().join("")})\b`, "i").test(q)) return null;
  const vals = [...sides.entries()];
  if (asked === hyp) return { kind: "pythagoras", value: Math.hypot(vals[0][1], vals[1][1]) };
  const h = sides.get(hyp);
  const leg = vals.find(([k]) => k !== hyp)?.[1];
  return h > leg ? { kind: "pythagoras", value: Math.sqrt(h * h - leg * leg) } : null;
}

/** Hệ số a, b, c của "ax^2 + bx + c = 0" (một phương trình duy nhất, ẩn x, hệ số số). */
export function quadraticCoefficients(text) {
  const eqs = [...String(text ?? "").replace(/\$/g, " ").replace(/[−–]/g, "-").matchAll(/([0-9x+\-^{}.,\s]+)=\s*0(?![\d.,])/g)];
  if (eqs.length !== 1) return null;
  const lhs = eqs[0][1].replace(/\s+/g, "").replace(/\^\{2\}/g, "^2").replace(/(\d),(\d)/g, "$1.$2");
  if (!/x\^2/.test(lhs) || /x\^(?!2)/.test(lhs)) return null;
  const terms = lhs.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== lhs) return null;
  const c = { a: 0, b: 0, c: 0 };
  for (const t of terms) {
    const m = /^([+-]?)(\d+(?:\.\d+)?)?(x\^2|x)?$/.exec(t);
    if (!m || (!m[2] && !m[3])) return null;
    const k = (m[1] === "-" ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
    c[m[3] === "x^2" ? "a" : m[3] === "x" ? "b" : "c"] += k;
  }
  return c.a !== 0 ? c : null;
}

/** Giải / tổng / tích nghiệm phương trình bậc hai. */
function quadraticExpected(q) {
  // Tham số m: "\bm\b" của JS coi chữ có dấu là ký tự ngăn từ ("nghiệm" cũng khớp) → dùng \p{L}.
  if (!/phương trình/i.test(q) || /tham số|(?<!\p{L})m(?!\p{L})|bất phương trình|hệ phương trình/iu.test(q)) return null;
  const k = quadraticCoefficients(q);
  if (!k) return null;
  const d = k.b * k.b - 4 * k.a * k.c;
  if (/tổng/i.test(q) && /tích/i.test(q)) return null;
  if (/tổng/i.test(q)) return d >= 0 ? { kind: "quadratic_sum", value: -k.b / k.a } : null;
  if (/tích/i.test(q)) return d >= 0 ? { kind: "quadratic_product", value: k.c / k.a } : null;
  if (!/giải|nghiệm/i.test(q) || /lớn|nhỏ|dương|âm|bình phương|lập phương/i.test(q)) return null;
  if (d < 0) return { kind: "quadratic_roots", none: true };
  const r = Math.sqrt(d);
  const roots = d === 0 ? [-k.b / (2 * k.a)] : [(-k.b - r) / (2 * k.a), (-k.b + r) / (2 * k.a)];
  return { kind: "quadratic_roots", values: roots };
}

/** Thể tích MỘT khối cầu với bán kính số cho sẵn; không suy bán kính từ dữ kiện khác. */
function sphereVolumeExpected(q) {
  if (!/tính\s+thể tích\s+(?:của\s+)?(?:một\s+)?khối cầu/i.test(q)
    || /đường kính|diện tích|nhiều|hai khối|tổng|tỉ số|tỷ số|lấy\s*(?:π|pi)|(?:π|pi)\s*=|\\sqrt|sqrt|\\frac/i.test(q)) return null;
  const radii = [...q.matchAll(/bán kính\s*(?:R\s*=\s*)?(\d+(?:[.,]\d+)?)(?![\d.,/])/gi)];
  if (radii.length !== 1) return null;
  // Chỉ một dữ kiện số: nếu đề thêm chiều cao, phép làm tròn, v.v. thì để luồng kiểm chéo xử lý.
  const otherData = q.replace(radii[0][0], "")
    .replace(/\\text\s*\{[^{}]*\}(?:\s*\^\s*\{?\d+\}?)?/g, "")
    .replace(/\b(?:mm|cm|m)\s*(?:\^\s*\{?\d+\}?)?/gi, "");
  if (/\d/.test(otherData)) return null;
  const radius = toNum(radii[0][1]);
  return radius > 0 ? { kind: "sphere_volume", value: (4 / 3) * Math.PI * radius ** 3 } : null;
}

/** Tổng n số hạng đầu của MỘT cấp số cộng khi đề cho u_1, d và n bằng số. */
function arithmeticSumExpected(q) {
  if (!/cấp số cộng/i.test(q) || !/tính\s+tổng/i.test(q)
    || /cấp số nhân|hai cấp số|vô hạn|trung bình|tổng các nghiệm|tính\s+tổng[^.?!]*\s+và\s+/i.test(q)) return null;
  const signed = String.raw`([+-]?\d+(?:[.,]\d+)?)`;
  const first = [...q.matchAll(new RegExp(String.raw`u\s*_\s*\{?\s*1\s*\}?\s*=\s*${signed}(?!\d|[.,]\d)`, "gi"))];
  const steps = [...q.matchAll(new RegExp(String.raw`\bd\s*=\s*${signed}(?!\d|[.,]\d)`, "gi"))];
  if (first.length !== 1 || steps.length !== 1) return null;
  const fromWords = [...q.matchAll(/tính\s+tổng(?:\s+của)?\s+(\d+)\s+số hạng đầu/gi)].map((m) => Number(m[1]));
  const fromSymbol = [...q.matchAll(/S\s*_\s*\{?\s*(\d+)\s*\}?/g)].map((m) => Number(m[1]));
  const positions = [...fromWords, ...fromSymbol];
  if (!positions.length || positions.some((n) => n !== positions[0])) return null;
  const n = positions[0];
  if (!Number.isInteger(n) || n < 1 || n > 10_000) return null;
  const u1 = toNum(first[0][1]);
  const d = toNum(steps[0][1]);
  return { kind: "arithmetic_sum", value: n * (2 * u1 + (n - 1) * d) / 2 };
}

/** Đáp án tính lại được cho đề mới; null nếu dạng bài chưa có bộ kiểm. */
export function expectedAnswer(question) {
  const q = plainMath(question);
  return angleSumExpected(q) || pythagorasExpected(q) || quadraticExpected(q)
    || sphereVolumeExpected(q) || arithmeticSumExpected(q);
}

/** Phương án `text` có khớp đáp án tính lại không. */
export function matchesExpected(text, expected) {
  if (expected.none) return /vô nghiệm|\\emptyset|∅/i.test(String(text));
  if (expected.values) {
    const got = optionNumbers(text);
    return Boolean(got) && sameSet([...new Set(got)], expected.values);
  }
  const v = optionNumber(text);
  return v !== null && near(v, expected.value);
}

function sameExpectedAnswer(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.none || b.none) return Boolean(a.none && b.none);
  if (a.values || b.values) return Boolean(a.values && b.values && sameSet(a.values, b.values));
  return near(a.value, b.value);
}

// ─── Kiểm cấu trúc + nội dung ──────────────────────────────────────────────
const clean = (v, max) => (typeof v === "string" ? fixStrayQuoteEscapes(v.trim()).slice(0, max) : "");
const dollarsBalanced = (s) => (String(s).replace(/\\\$/g, "").match(/\$/g) || []).length % 2 === 0;
const sameText = (a, b) => String(a).replace(/[\s$]/g, "").replace(/\\[dt]frac/g, "\\frac").toLowerCase() === String(b).replace(/[\s$]/g, "").replace(/\\[dt]frac/g, "\\frac").toLowerCase();

/**
 * Chuẩn hoá + kiểm một đề AI vừa sinh. Trả { variant, errors, expected }: errors rỗng = dùng được.
 * @param {object|null} parsed    kết quả parseModelJson
 * @param {{ original: string, allowedIds: string[], requireIds?: boolean }} ctx
 */
export function validateVariant(parsed, { original, allowedIds, requireIds = true }) {
  const errors = [];
  if (!parsed || typeof parsed !== "object") return { variant: null, errors: ["JSON không đọc được"], expected: null };

  const question = wrapLooseLatex(clean(parsed.question, LIMITS.question));
  if (!question) errors.push("thiếu đề (question)");

  // Nhận cả mảng [{letter, text, isCorrect?}] lẫn object {A: "...", ...}; xếp lại theo A–D.
  const raw = Array.isArray(parsed.options)
    ? parsed.options
    : parsed.options && typeof parsed.options === "object"
      ? Object.entries(parsed.options).map(([letter, text]) => ({ letter, text }))
      : [];
  const answerLetter = String(parsed.answer ?? "").trim().toUpperCase().replace(/[^A-D]/g, "");
  const options = LETTERS.map((letter, idx) => {
    const o = raw.find((x) => String(x?.letter ?? "").trim().toUpperCase() === letter) ?? (raw.length === 4 && !raw.some((x) => x?.letter) ? raw[idx] : null);
    const text = wrapLooseLatex(clean(typeof o === "string" ? o : o?.text, LIMITS.option));
    const flagged = o && typeof o === "object" && o.isCorrect === true;
    return { letter, text, isCorrect: answerLetter ? answerLetter === letter : flagged };
  });
  if (raw.length !== 4) errors.push(`cần đúng 4 phương án, nhận ${raw.length}`);
  if (options.some((o) => !o.text)) errors.push("có phương án rỗng hoặc thiếu nhãn A–D");
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) errors.push(`cần đúng 1 phương án đúng, nhận ${correctCount}`);
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const va = optionNumbers(options[a].text);
      const vb = optionNumbers(options[b].text);
      if (options[a].text && (sameText(options[a].text, options[b].text) || (va && vb && sameSet([...new Set(va)], [...new Set(vb)])))) {
        errors.push(`phương án ${options[a].letter} và ${options[b].letter} trùng nhau`);
      }
    }
  }

  let blankAnswer = clean(parsed.blank_answer ?? parsed.blankAnswer, LIMITS.blank).replace(/\$/g, "").trim();
  if (!blankAnswer) errors.push("thiếu blank_answer");
  else if (/^[A-D]\.?$/i.test(blankAnswer)) errors.push("blank_answer là nhãn phương án, phải là đáp án");
  const correct = options.find((o) => o.isCorrect);
  if (correct && blankAnswer) {
    // blankAnswer đọc được thành số → phải bằng phương án đúng (nếu phương án đúng cũng là số).
    const vb = latexNumber(blankAnswer.replace(/sqrt\s*\(([^()]*)\)/g, "\\sqrt{$1}").replace(/\bpi\b|π/g, "\\pi"));
    const vc = optionNumber(correct.text);
    if (vb !== null && vc !== null && !near(vb, vc)) errors.push("blank_answer không khớp phương án đúng");
  }

  const explanation = wrapLooseLatex(clean(parsed.explanation, LIMITS.explanation));
  if (!explanation) errors.push("thiếu lời giải (explanation)");

  for (const [field, value] of [["question", question], ["explanation", explanation], ...options.map((o) => [`phương án ${o.letter}`, o.text])]) {
    if (value && (!dollarsBalanced(value) || !hasBalancedBraces(value))) errors.push(`${field} lệch dấu $ hoặc ngoặc`);
  }

  const allowed = new Set(allowedIds);
  const formulaIds = [...new Set((Array.isArray(parsed.formula_ids ?? parsed.formulaIds) ? (parsed.formula_ids ?? parsed.formulaIds) : [])
    .filter((id) => isValidFormulaId(id) && allowed.has(id)))].slice(0, MAX_FORMULA_IDS);
  if (requireIds && !formulaIds.length) errors.push("formula_ids không có id nào trong thư viện đã gửi");

  if (question) {
    // Số liệu phải đổi: bộ số (kể cả lặp) của đề mới khác đề gốc; đề gốc có số thì đề mới cũng phải có.
    const before = extractNumbers(original).sort();
    const after = extractNumbers(question).sort();
    if (before.length && !after.length) errors.push("đề mới không có số liệu");
    else if (before.length && before.join("|") === after.join("|")) errors.push("số liệu đề mới phải khác đề gốc");
    else if (!before.length && sameText(question, original)) errors.push("đề mới trùng đề gốc");
    if (precheckInvalidQuestion(question.replace(/\$/g, ""), { hasHistory: true })) errors.push("dữ kiện đề mới vô lý");
    const originalExpected = expectedAnswer(original);
    const variantExpected = expectedAnswer(question);
    if (originalExpected && variantExpected?.kind !== originalExpected.kind) {
      errors.push(`đề mới đã đổi dạng bài: cần ${originalExpected.kind}`);
    }
    if (sameExpectedAnswer(originalExpected, variantExpected)) errors.push("đáp số đề mới phải khác đề gốc");
  }

  let expected = null;
  if (question && correctCount === 1) {
    expected = expectedAnswer(question);
    if (expected) {
      const hits = options.filter((o) => matchesExpected(o.text, expected));
      if (!hits.length || !hits[0].isCorrect) errors.push(`đáp án sai: backend tính lại không khớp phương án ${correct?.letter}`);
      else if (hits.length > 1) errors.push("nhiều phương án cùng khớp đáp án tính lại");
    }
  }

  const variant = { question, options, blankAnswer, explanation, formulaIds };
  return { variant, errors, expected };
}

// ─── Kiểm chéo: giải độc lập đề mới ────────────────────────────────────────
// Đề không thuộc dạng backend tự tính lại được (expectedAnswer = null): gọi Gemini lần nữa để GIẢI đề mới,
// CHỈ gửi đề — không gửi 4 phương án, đáp án hay lời giải đã tạo, để lần giải không bị dẫn theo — rồi so
// đáp số với phương án đúng. Lần gọi này không trừ thêm lượt của học sinh.
export const SOLVER_SYSTEM_PROMPT = String.raw`Bạn là giáo viên Toán THPT Việt Nam. Giải bài toán học sinh gửi, tự tính cẩn thận từng bước trong đầu. CHỈ trả về một đối tượng JSON, không có chữ nào khác:
{"answer": "đáp số cuối cùng, viết LaTeX KHÔNG có dấu $ (vd \frac{a}{b}, k\sqrt{n}, x = x_1; x = x_2, (m; +\infty)). Không ghi đơn vị, không giải thích."}`;
export const SOLVER_PARAMS = { temperature: 0, max_completion_tokens: 600 };

export function buildSolverMessages(question) {
  return [
    { role: "system", content: SOLVER_SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
}

// So chuỗi khi đáp án không phải số: bỏ $, khoảng trắng, \left \right, "x =" ở đầu, dấu chấm cuối; \dfrac → \frac.
export function normalizeAnswerText(s) {
  let t = String(s ?? "").replace(/\$/g, "").replace(/\\left|\\right|\\[,;!]|\\ /g, "").replace(/\\[dt]frac/g, "\\frac")
    .replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/\.$/, "").toLowerCase();
  if ((t.match(/=/g) || []).length === 1) t = t.replace(/^[a-z_{}0-9']{1,6}=/, "");
  return t;
}

// Cực trị hỏi cả vị trí x và giá trị y: AI có thể viết "Điểm cực đại x=2, giá trị cực đại y=11"
// hoặc "x=2; y_{CĐ}=11". Chỉ so hai cặp số có nhãn x/y khi đề hỏi đúng cặp này.
function extremumPair(text) {
  const read = (label) => {
    const pattern = new RegExp(String.raw`(?:^|[^\p{L}])${label}(?:_\{[^{}]{1,12}\}|_[\p{L}\d]{1,12})?\s*=\s*([+-]?\d+(?:[.,]\d+)?)`, "giu");
    const matches = [...String(text).replace(/\$/g, "").matchAll(pattern)];
    return matches.length === 1 ? Number(matches[0][1].replace(",", ".")) : null;
  };
  const x = read("x");
  const y = read("y");
  return x !== null && y !== null ? { x, y } : null;
}

/** Đáp số của lần giải độc lập có khớp phương án đúng không. Số thì so giá trị, không phải số thì so chuỗi. */
export function crossCheckMatches(correctText, solverAnswer, question = "") {
  if (/điểm cực (?:đại|tiểu)\s+và\s+giá trị cực (?:đại|tiểu)/i.test(question)) {
    const a = extremumPair(correctText);
    const b = extremumPair(solverAnswer);
    if (a && b) return near(a.x, b.x) && near(a.y, b.y);
  }
  const a = optionNumbers(correctText);
  const b = optionNumbers(solverAnswer);
  if (a && b) return sameSet([...new Set(a)], [...new Set(b)]);
  return normalizeAnswerText(correctText) !== "" && normalizeAnswerText(correctText) === normalizeAnswerText(solverAnswer);
}

// ─── Gọi Gemini ────────────────────────────────────────────────────────────
/**
 * Sinh một đề cùng dạng ĐÃ KIỂM. Lỗi của Gemini (429, mạng, timeout) khi SINH đề ném ra cho server xử lý;
 * không qua kiểm cả hai lần → VariantError.
 * meta.verified = dạng backend tự tính lại (null nếu không thuộc dạng nào);
 * meta.crossChecked = true (giải độc lập khớp) | false (còn < 8 giây, không kịp kiểm chéo) | null (đã tự tính, không cần).
 * @param {{ groq: object, problem: string, formulaIds?: string[], grade?: number|null, now?: () => number, deadline?: number }} opts
 */
export async function generateVariant({ groq, problem, formulaIds = [], grade = null, now = Date.now, deadline = now() + VARIANT_BUDGET_MS }) {
  const { formulas, requireIds } = allowedFormulas(problem, formulaIds, grade);
  const allowedIds = formulas.map((f) => f.id);
  const meta = { model: FINDER_MODEL, attempts: 0, allowedIds, errors: [], crossChecked: null, crossCheckCalls: 0 };

  // Một lần giải độc lập (chủ dự án chốt 2026-11-01):
  //   - còn < MIN_CALL_MS trong ngân sách → null: giao đề không kiểm chéo (crossChecked = false) — trường hợp DUY NHẤT;
  //   - lần gọi lỗi (429, 500/503, hết giờ, mạng…) → thử MỘT lần bằng model dự phòng;
  //   - vẫn lỗi, hoặc JSON không đọc được → VariantError (server hoàn lượt, báo "AI đang bận").
  const solve = async (question) => {
    let solverModel = model;
    for (let call = 0; call < 2; call++) {
      const timeLeft = deadline - now();
      if (timeLeft < MIN_CALL_MS) {
        // Lần đầu đã lỗi mà không còn giờ thử model dự phòng → coi như vẫn lỗi, không giao đề chưa kiểm.
        if (call === 1) throw new VariantError("Kiểm chéo lỗi, hết giờ thử model dự phòng", { meta: { ...meta, crossCheckFailed: "error_no_time" } });
        meta.crossCheckSkipped = "budget";
        return null;
      }
      meta.crossCheckCalls++;
      let completion;
      try {
        completion = await groq.chat.completions.create(
          { model: solverModel, messages: buildSolverMessages(question), ...SOLVER_PARAMS },
          { timeout: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)) },
        );
      } catch (err) {
        meta.crossCheckErrors = [...(meta.crossCheckErrors || []), `${solverModel}:${err?.status ?? "unknown"}`];
        if (call === 1) throw new VariantError("Kiểm chéo lỗi cả hai lần", { meta: { ...meta, crossCheckFailed: "error" } });
        const blockMs = solverModel === FINDER_MODEL ? primaryBlockMs(err) : null;
        if (blockMs !== null) fallbackState.primaryBlockedUntil = now() + blockMs;
        solverModel = FINDER_FALLBACK_MODEL;
        meta.crossCheckFallback = true;
        continue;
      }
      const answer = parseVariantJson(completion.choices?.[0]?.message?.content)?.answer;
      if (typeof answer !== "string" || !answer.trim() || completion.choices?.[0]?.finish_reason === "length") {
        throw new VariantError("Kiểm chéo không đọc được đáp số", { meta: { ...meta, crossCheckFailed: "unreadable" } });
      }
      return answer.trim();
    }
    return null; // không tới được: vòng lặp luôn return hoặc throw
  };

  const messages = buildVariantMessages({ problem, formulas });
  let model = FINDER_MODEL;
  if (now() < fallbackState.primaryBlockedUntil) {
    model = FINDER_FALLBACK_MODEL;
    meta.fallback = { from: FINDER_MODEL, to: model, reason: "known_block" };
  }

  while (meta.attempts < MAX_ATTEMPTS) {
    const timeLeft = deadline - now();
    if (meta.attempts > 0 && timeLeft < MIN_CALL_MS) { meta.skippedRetryForTime = true; break; }
    meta.attempts++;
    let completion;
    try {
      completion = await groq.chat.completions.create(
        { model, messages, ...VARIANT_PARAMS },
        { timeout: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)) },
      );
    } catch (err) {
      // Model chính bị 429 / quá tải → dự phòng một lần (cùng cơ chế với askFinder, chung fallbackState).
      const blockMs = model === FINDER_MODEL ? primaryBlockMs(err) : null;
      if (blockMs === null || deadline - now() < MIN_CALL_MS) throw err;
      fallbackState.primaryBlockedUntil = now() + blockMs;
      model = FINDER_FALLBACK_MODEL;
      meta.fallback = { from: FINDER_MODEL, to: model, reason: dailyLimitBlockMs(err) !== null ? "daily_limit" : err?.status === 429 ? "minute_limit" : "unavailable" };
      meta.attempts--;
      continue;
    }
    meta.model = model;
    const content = completion.choices?.[0]?.message?.content ?? "";
    const truncated = completion.choices?.[0]?.finish_reason === "length";
    const { variant, errors, expected } = truncated
      ? { variant: null, errors: ["câu trả lời bị cắt giữa chừng"], expected: null }
      : validateVariant(parseVariantJson(content), { original: problem, allowedIds, requireIds });
    if (!errors.length && expected) {
      meta.verified = expected.kind;
      meta.crossChecked = null;
      return { variant, meta };
    }
    if (!errors.length) {
      meta.verified = null;
      const correct = variant.options.find((o) => o.isCorrect);
      const solved = await solve(variant.question);
      if (solved === null) {
        meta.crossChecked = false;
        return { variant, meta };
      }
      if (crossCheckMatches(correct.text, solved, variant.question)) {
        meta.crossChecked = true;
        delete meta.crossCheckSkipped;
        return { variant, meta };
      }
      // Lệch: tính vào số lần hỏi lại hiện có (MAX_ATTEMPTS), không giao đề này.
      errors.push(`kiểm chéo lệch: giải độc lập ra ${solved.slice(0, 80)}, phương án đúng đã đánh dấu là ${correct.letter}`);
    }
    meta.errors.push(errors);
    // Lần sau: đưa lại câu trả lời cũ + danh sách lỗi để AI sửa đúng chỗ.
    messages.push(
      { role: "assistant", content: String(content).slice(0, 4000) },
      { role: "user", content: `Đề vừa viết chưa đạt: ${errors.join("; ")}. Viết lại TOÀN BỘ JSON, sửa các lỗi trên.` },
    );
  }
  throw new VariantError("Đề AI tạo không qua bước kiểm", { meta });
}
