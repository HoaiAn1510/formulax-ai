// Kiểm tra câu trả lời của AI Finder trước khi gửi cho học sinh. Không tin model: dù prompt cấm,
// khi chấm thử vẫn có câu lời giải lỡ tính ra số trung gian (gpt-oss-20b: 5/12 câu, gpt-oss-120b:
// 2/12 và 1/8 ở nhóm bài dạng n − 1), thỉnh thoảng viết LaTeX sai escape trong JSON hoặc thiếu
// dấu ngoặc.

import { expandShorthand } from "./problemText.js";

// invalid_data (2026-10-22): CHỈ cho ba cạnh không thỏa bất đẳng thức tam giác — xem checkTriangleSides.
export const ANSWER_TYPES = ["solution", "no_formula", "refuse_answer", "off_topic", "invalid_data"];

// formulaIds 4: bài theo phương pháp (cực trị...) dùng tới 3–4 công thức — điều kiện cực trị,
// đạo hàm, quy tắc tổng hiệu, công thức nghiệm.
const LIMITS = { steps: 6, formulaIds: 4, title: 80, detail: 600, expression: 400, intro: 300, reminder: 200, aiNote: 150 };

export const DEFAULT_TEXT = {
  noFormulaIntro: "Thư viện FormulaX chưa có công thức cho dạng bài này, nên mình chưa hướng dẫn được bạn nhé.",
  intro: "Mình gợi ý công thức và các bước để bạn tự giải nhé.",
  reminder: "Phần tính toán bạn tự làm nhé — làm xong nhớ kiểm tra lại đơn vị!",
  allStepsRemoved: "Mình đã chọn công thức cho bạn nhưng chưa trình bày được các bước chắc chắn đúng — bạn xem phần ví dụ trong thẻ công thức nhé.",
  unavailable: "Mình chưa soạn được hướng dẫn cho câu này, bạn thử diễn đạt lại câu hỏi nhé.",
  invalidDataReminder: "Bạn kiểm tra lại đề (có thể chép nhầm số) rồi hỏi lại mình nhé.",
};

// ─── 1. Sửa escape LaTeX trong JSON thô ─────────────────────────────────────
// Model hay viết "\frac" thay vì "\\frac" trong chuỗi JSON. JSON.parse khi đó hoặc ném lỗi
// (\c, \s... không phải escape hợp lệ) hoặc TỆ HƠN là âm thầm đổi nghĩa: \f → ký tự form-feed
// ("\frac" thành "rac"), \t → tab ("\times"), \n → xuống dòng ("\neq"), \b → backspace ("\beta").
//
// Quy tắc: chỉ nhân đôi dấu \ CHƯA được escape (không đứng sau một dấu \ khác). Một \ được
// giữ nguyên khi nó là escape JSON hợp lệ: \\ \" \/ \uXXXX, hoặc \b \f \n \r \t KHÔNG theo sau
// bởi chữ cái (theo sau bởi chữ cái thì đó là lệnh LaTeX như \frac, \neq, \times, \beta).
//
// Ngoài ra: ký tự xuống dòng/tab THẬT nằm trong chuỗi JSON (model viết khi không bị ràng buộc
// JSON mode) làm JSON.parse lỗi → thay bằng dấu cách (nội dung hiển thị luôn là một dòng).
export function repairLatexEscapes(raw) {
  const s = String(raw ?? "");
  let out = "";
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    // Dấu " đi tới đây luôn là dấu chưa escape (cặp \" được chép nguyên ở nhánh dưới).
    if (c === '"') { inString = !inString; out += c; continue; }
    if (inString && (c === "\n" || c === "\r" || c === "\t")) { out += " "; continue; }
    if (c !== "\\") { out += c; continue; }
    const next = s[i + 1];
    if (next === "\\" || next === '"' || next === "/") {
      out += c + next; // cặp đã escape đúng — chép nguyên, bỏ qua cả 2 ký tự
      i++;
      continue;
    }
    if (next === "u" && /^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) {
      out += c; // \uXXXX hợp lệ
      continue;
    }
    if ("bfnrt".includes(next ?? "") && !/[A-Za-z]/.test(s[i + 2] ?? "")) {
      out += c; // \n, \t... thật (không phải đầu một lệnh LaTeX)
      continue;
    }
    out += "\\\\"; // \ chưa escape của lệnh LaTeX → nhân đôi
  }
  return out;
}

/** Parse JSON do model trả về. Trả null nếu không cứu được. */
export function parseModelJson(raw) {
  const text = String(raw ?? "").trim();
  const attempts = [text];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) attempts.push(text.slice(start, end + 1)); // có chữ thừa quanh JSON
  for (const candidate of attempts) {
    try {
      const value = JSON.parse(repairLatexEscapes(candidate));
      if (value && typeof value === "object" && !Array.isArray(value)) return value;
    } catch {
      // thử cách tiếp theo
    }
  }
  return null;
}

// ─── 2. Chuẩn hoá cấu trúc + kiểm tra id công thức ─────────────────────────
// Chiều ngược lại của lỗi escape: model đôi khi viết "\\\\cdot" nên sau khi parse còn "\\cdot" —
// KaTeX hiểu "\\" là xuống dòng rồi in chữ "cdot". Nội dung ở đây luôn là 1 dòng, nên "\\" đứng
// ngay trước chữ cái chắc chắn là lệnh LaTeX bị escape thừa → thu về 1 dấu \.
// Cùng lý do với "\\{" / "\\}" (model muốn viết ngoặc nhọn \{ \} của tập hợp): "\\" trước "{"/"}" là
// xuống dòng + nhóm, KaTeX mất cả dấu ngoặc nhọn. "\\" đứng trước dấu cách (xuống dòng thật) giữ nguyên.
const fixOverEscaped = (s) => s.replace(/\\\\(?=[A-Za-z])/g, "\\").replace(/\\\\(?=[{}])/g, "\\");
// \frac12 (viết tắt của \frac{1}{2}, KaTeX hiển thị y hệt) → dạng đầy đủ, để bộ lọc đọc đúng hai số
// 1 và 2 thay vì "12".
const expandFracShorthand = (s) => s.replace(/\\([dt]?frac)\s*(\d)\s*(\d)/g, "\\$1{$2}{$3}");
const str = (v, max) => (typeof v === "string" ? expandFracShorthand(fixOverEscaped(v.trim())).slice(0, max) : "");

// "Delta" thiếu dấu \ trong phần toán → KaTeX in chữ "Delta" nghiêng thay vì Δ. Chỉ sửa trong phần
// toán ($...$ của câu chữ, và toàn bộ expression); chữ "Delta" trong câu văn ("Tính biệt thức
// Delta") giữ nguyên.
const BARE_DELTA = /(?<![\\A-Za-z])Delta(?![A-Za-z])/g;
export const fixBareDeltaInMath = (math) => math.replace(BARE_DELTA, "\\Delta");
export const fixBareDeltaInText = (s) => s.replace(/(\$\$?)([^$]+)(\$\$?)/g, (_, open, math, close) => open + fixBareDeltaInMath(math) + close);

// \' và \" không phải lệnh LaTeX dùng được trong chế độ toán — KaTeX báo lỗi và in cả biểu thức
// màu đỏ ("y\' = 3x^2 - 6x - 9"). Model viết thừa \ trước dấu phẩy trên/nháy kép. Các escape hợp
// lệ khác (\, \; \! \{ \} \% \_ ...) giữ nguyên.
export const fixStrayQuoteEscapes = (s) => s.replace(/\\(['"])/g, "$1");

/** Áp `fn` lên phần CÂU CHỮ (ngoài $...$ / $$...$$), giữ nguyên phần toán. */
const mapProse = (s, fn) => s.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/).map((part, i) => (i % 2 === 0 ? fn(part) : part)).join("");

// Lệnh LaTeX viết thẳng trong câu chữ, ngoài $...$ ("để tính \Delta và viết nghiệm", "\sqrt{\Delta}")
// hiện nguyên văn → bọc lại bằng $...$. Một cụm = lệnh + các nhóm {...} (lồng 1 tầng) + chỉ số ^ _.
const LOOSE_COMMAND = /\\[A-Za-z]+(?:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*(?:\s*[_^](?:\{[^{}]*\}|[A-Za-z0-9]))*/g;
// Khối môi trường viết ngoài $...$ ("Dùng công thức \begin{cases} f'(x_0)=0 \\ f'\text{ đổi dấu qua }x_0
// \end{cases}", lần chấm 2026-10-04): bọc CẢ KHỐI trong một đoạn $...$ trước. Bọc từng lệnh như
// LOOSE_COMMAND sẽ cắt khối thành "$\begin{cases}$ … $\end{cases}$" — KaTeX báo lỗi cả hai đoạn.
const ENV_BLOCK = /\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\1\}/g;
export const wrapLooseLatex = (s) => mapProse(
  mapProse(s, (prose) => prose.replace(ENV_BLOCK, (block) => `$${block.trim()}$`)),
  (prose) => prose.replace(LOOSE_COMMAND, (cmd) => `$${cmd.trim()}$`),
);

// Id công thức model chép vào lời giải ("quy tắc đạo hàm của tổng (gt11-daoham-tonghieu)"). Id có
// thật thì: nằm trong ngoặc ngay sau chính tên công thức → bỏ; còn lại → thay bằng tên công thức.
// Id không có thật giữ nguyên (không đoán).
const FORMULA_ID = /[a-z]{2,3}(?:\d{2})?-[a-z0-9-]*[a-z0-9]/gi;
export function replaceFormulaIds(s, isValidId, nameOf) {
  if (!isValidId || !nameOf) return s;
  return mapProse(s, (prose) => prose
    .replace(new RegExp(String.raw`\s*\(\s*(${FORMULA_ID.source})\s*\)`, "gi"), (m, id, offset, whole) => {
      if (!isValidId(id)) return m;
      const name = nameOf(id) || "";
      const before = whole.slice(0, offset).trimEnd().toLowerCase();
      return name && !before.endsWith(name.toLowerCase()) ? ` (${name})` : "";
    })
    .replace(new RegExp(String.raw`(?<![\w-])(${FORMULA_ID.source})(?![\w-])`, "gi"), (m, id) => (isValidId(id) ? nameOf(id) || "" : m)));
}

const cleanText = (s, isValidId, nameOf) => fixSymbolicBlankInText(replaceFormulaIds(fixBareDeltaInText(wrapLooseLatex(fixStrayQuoteEscapes(s))), isValidId, nameOf));

// Ô trống đặt sai chỗ (quy tắc ô trống 2026-10-03), sửa từng mệnh đề (ngăn bởi , ; \\ ở tầng ngoài):
//   "y' = 4x^3 - 4x = ?"           → "y' = 4x^3 - 4x"  (đạo hàm / hàm số là biểu thức ký hiệu, không có ô ?)
//   "y(x_1) = x_1^3 - 3x_1 + 2 = ?" → "y(x_1) = ?"      (giá trị tại nghiệm ký hiệu chỉ để ô trống)
//   "F(x) = \int(2x - x^2)dx = x^2 - \frac{x^3}{3} \Rightarrow F(x) = ?" → bỏ "\Rightarrow F(x) = ?"
//   "\int (2x - x^2)\,dx = x^2 - \frac{x^3}{3} = ?"                    → bỏ " = ?"
// Chỉ áp khi vế trái là biểu thức KÝ HIỆU của hàm: đạo hàm, y / f(x), nguyên hàm F(x), tích phân
// \int…, hoặc y(x_k) — "\max\{y(0), y(x_1)\} = ?", "S = F(x_2) - F(x_1) = ?" (đại lượng đề hỏi) giữ nguyên.
const isFunctionExpr = (lhs) => isDerivative(lhs) || /^(?:y|f\(x\)|F\(x\))$/.test(lhs) || /^\\int/.test(lhs);
export function fixSymbolicBlank(latex) {
  const s = String(latex || "");
  if (!s.includes("?")) return s;
  // "\," "\;" (khoảng trắng LaTeX, vd "\,dx") không phải dấu ngăn mệnh đề.
  const sep = (t, j) => ((t[j] === "," || t[j] === ";") && t[j - 1] !== "\\" ? 1 : t.startsWith("\\\\", j) ? 2
    : /^\\q?quad(?![a-zA-Z])/.test(t.slice(j)) ? t.slice(j).match(/^\\q?quad/)[0].length : 0);
  const hasUnknown = (part) => letterTokens(normalizeMath(part)).some((l) => /^[xt]$/.test(l));
  return splitTopLevel(s, sep).map((clause, i) => {
    if (i % 2 === 1) return clause;
    const parts = splitRelationsRaw(clause);
    const n = parts.length;
    const tail = clause.match(/\s*$/)[0];
    if (n < 5 || parts[n - 2] !== "=" || parts[n - 1].trim() !== "?") return clause;
    // "… \Rightarrow F(x) = ?" mà đầu mệnh đề đã viết F(x) = <biểu thức còn chứa biến> → bỏ phần đuôi.
    if (!isChainOp(parts[n - 4])) {
      const target = compact(normalizeMath(parts[n - 3]));
      const definedBefore = compact(normalizeMath(parts[0])) === target
        && parts.slice(2, n - 4).some((p, k) => k % 2 === 0 && hasUnknown(p));
      return isFunctionExpr(target) && definedBefore ? parts.slice(0, n - 4).join("").replace(/\s+$/, "") + tail : clause;
    }
    if (parts[n - 4] !== "=") return clause;
    if (n > 5 && isChainOp(parts[n - 6]) && parts[n - 6] !== "=") return clause;
    const lhs = compact(normalizeMath(parts[n - 5]));
    if (/^[fgFhy](?:\\?'|\^\{?\\prime\}?)*\([xt]_\{?\w+\}?\)$/.test(lhs)) {
      return parts.slice(0, n - 4).join("") + "= ?" + tail;
    }
    if (hasUnknown(parts[n - 3]) && isFunctionExpr(lhs)) {
      return parts.slice(0, n - 2).join("").replace(/\s+$/, "") + tail;
    }
    return clause;
  }).join("");
}

// ─── Biểu thức đã thay số (bước làm sạch cuối, 2026-10-04) ──────────────────
// Quy tắc "thay dữ kiện, không thay số": AI viết công thức ký hiệu kèm dữ kiện, KHÔNG viết biểu thức
// đã thay số ("a^2 = 8^2 + 5^2 - 2 \cdot 8 \cdot 5 \cos 60^\circ" — bản hỏi lại bằng 20b, 2026-10-04).
// Biểu thức như vậy không lộ đáp số nên không bị bộ lọc số bắt; ở bước làm sạch cuối, bỏ DÒNG BIỂU
// THỨC đó, giữ phần chữ của bước. Không tính vào lý do phải hỏi lại (đỡ tốn token).
// Dấu hiệu (sau khi bỏ chỉ số dưới, nên x_2^2 thành x^2 — không bắt):
//   - lũy thừa của một số: 8^2, 0^{4} (cơ số là số có trong đề);
//   - tích hai số: 2 \cdot 8, 4 \cdot 2 \cdot (-7) (ít nhất một thừa số có trong đề).
// Không bắt "(20 - 1)d", "u_1 + (n - 1)d", "3x^2 - 12", "60^\circ", "\frac{4}{3}\pi R^3".
const NUM_POWER = /(?<![\w.\\}])(\d+(?:\.\d+)?)\s*\^\s*\{?\s*\d/g;
const NUM_PRODUCT = /(?<![\w.\\}^])(\d+(?:\.\d+)?)\s*\*\s*\(?\s*(-?\d+(?:\.\d+)?)(?![\d.]*[a-zA-Z(\\])/g;
export function isNumericSubstitution(latex, questionNumbers) {
  const s = normalizeMath(latex).replace(/_\{[^{}]*\}/g, "").replace(/_[0-9a-zA-Z]/g, "");
  const fromQuestion = (n) => questionNumbers.has(String(Number(n)));
  for (const m of s.matchAll(NUM_POWER)) if (fromQuestion(m[1])) return true;
  for (const m of s.matchAll(NUM_PRODUCT)) if (fromQuestion(m[1]) || fromQuestion(m[2].replace(/^-/, ""))) return true;
  return false;
}
/** Bỏ dòng biểu thức đã thay số ở mọi bước (giữ phần chữ). Trả về số biểu thức đã bỏ. */
export function dropNumericSubstitutions(answer, questionText) {
  const questionNumbers = new Set(extractNumbers(questionText).map((n) => String(Number(n))));
  let dropped = 0;
  const steps = answer.steps.map((st) => {
    if (st.expression && isNumericSubstitution(st.expression, questionNumbers)) { dropped++; return { ...st, expression: "" }; }
    return st;
  }).filter((st) => st.detail || st.expression);
  return { answer: { ...answer, steps }, dropped };
}
const fixSymbolicBlankInText = (s) => s.replace(/(\$\$?)([^$]+)(\$\$?)/g, (_, open, math, close) => open + fixSymbolicBlank(math) + close);

// expression phải là LaTeX thuần — bỏ $ bao ngoài nếu model lỡ thêm.
const cleanExpression = (v) => fixSymbolicBlank(fixBareDeltaInMath(fixStrayQuoteEscapes(str(v, LIMITS.expression).replace(/^\$+|\$+$/g, "").trim())));

/**
 * Đưa đối tượng model trả về về đúng khung, bỏ mọi trường lạ (kể cả nếu model tự thêm "result").
 * `isValidId` kiểm tra id có thật trong thư viện; id không có thật bị loại. `nameOf(id)` trả tên
 * công thức — dùng để thay id model lỡ chép vào lời giải bằng tên (không truyền thì giữ nguyên).
 */
export function normalizeAnswer(value, isValidId, nameOf) {
  const obj = value && typeof value === "object" ? value : {};
  const text = (v, max) => cleanText(str(v, max), isValidId, nameOf);
  const rawIds = Array.isArray(obj.formula_ids) ? obj.formula_ids : [];
  const formulaIds = [...new Set(rawIds.filter((id) => typeof id === "string" && isValidId(id)))].slice(0, LIMITS.formulaIds);
  const droppedIds = rawIds.filter((id) => !formulaIds.includes(id));

  const steps = (Array.isArray(obj.steps) ? obj.steps : [])
    .filter((st) => st && typeof st === "object")
    .map((st) => ({ title: text(st.title, LIMITS.title), detail: text(st.detail, LIMITS.detail), expression: cleanExpression(st.expression) }))
    .filter((st) => st.detail || st.expression)
    .slice(0, LIMITS.steps);

  let type = ANSWER_TYPES.includes(obj.type) ? obj.type : steps.length ? "solution" : "no_formula";
  let intro = text(obj.intro, LIMITS.intro);
  let reminder = text(obj.reminder, LIMITS.reminder);

  // Lời giải mà không còn công thức hợp lệ nào = không dựa trên thư viện → không được hiển thị.
  // Ngoại lệ (quy tắc 1c, kiến thức nền THCS): giữ lại bản đã chuẩn hoá trong `baseCandidate` để
  // finalizeAnswer kiểm tra bằng checkBaseKnowledge (cần đề bài); không kiểm được thì vẫn no_formula.
  let baseCandidate = null;
  if (type === "solution" && formulaIds.length === 0) {
    if (steps.length) baseCandidate = { intro, reminder, steps };
    type = "no_formula";
    reminder = "";
  }
  // no_formula: học sinh chỉ thấy câu mặc định. Lời giải thích của model thường nêu tên phương
  // pháp/công thức còn thiếu ("cần tích phân từng phần") — tức là trỏ ra ngoài thư viện — nên chỉ
  // giữ lại trong aiNote để ghi log cho nhóm biết thư viện đang thiếu gì.
  const aiNote = type === "no_formula" || type === "invalid_data" ? intro.slice(0, LIMITS.aiNote) : "";
  if (type === "no_formula") intro = DEFAULT_TEXT.noFormulaIntro;
  // invalid_data: ba cạnh model nêu — nơi gọi kiểm lại bằng checkTriangleSides rồi mới dùng.
  const sides = type === "invalid_data" && Array.isArray(obj.sides) ? obj.sides.slice(0, 3) : [];
  const answer = {
    type,
    formulaIds: type === "solution" ? formulaIds : [],
    intro: intro || (type === "solution" ? DEFAULT_TEXT.intro : ""),
    steps: type === "solution" ? steps : [],
    // no_formula chỉ giữ intro: khi thử nghiệm, reminder của loại này hay gợi ý "tra cứu công
    // thức X trong sách" — tức là trỏ tới công thức/tài liệu ngoài thư viện.
    reminder: type === "no_formula" ? "" : reminder || (type === "solution" ? DEFAULT_TEXT.reminder : ""),
  };
  return { answer, droppedIds, aiNote, sides, baseCandidate };
}

/**
 * Kiểm lại câu trả lời invalid_data của model — không tin model nói "dữ kiện vô lý": chỉ nhận khi
 * model nêu đúng ba độ dài cạnh, mỗi số đều có trong đề, và ba số đó THẬT SỰ không thỏa bất đẳng thức
 * tam giác (tổng hai cạnh nhỏ nhất ≤ cạnh lớn nhất). Câu giải thích do backend dựng, chỉ chứa số của đề
 * (so sánh "1 + 2 < 4", không viết tổng ra số). Trả null nếu không kiểm được → nơi gọi coi như no_formula.
 */
export function checkTriangleSides(sides, questionText) {
  if (!Array.isArray(sides) || sides.length !== 3) return null;
  const inQuestion = new Set(extractNumbers(questionText).map((n) => String(Number(n))));
  const values = [];
  for (const raw of sides) {
    const text = String(raw ?? "").replace(/[$\s]/g, "").replace(/\{,\}/g, ",");
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null; // √2, a, 2x... không kiểm được
    const n = Number(text.replace(",", "."));
    // extractNumbers đọc "1,5" thành 1 và 5 (tránh nhầm toạ độ) → nhận thêm khi cạnh có nguyên văn trong đề.
    const literal = new RegExp(`(?<![\\d.,])${text.replace(/[.,]/g, "[.,]")}(?![.,]?\\d)`).test(String(questionText));
    if (!(n > 0) || !(inQuestion.has(String(n)) || literal)) return null;
    values.push(n);
  }
  const [x, y, z] = [...values].sort((p, q) => p - q);
  // Sai số dấu phẩy động (0,1 + 0,2 vs 0,3): so trên số nguyên sau khi nhân 10^k.
  const scale = 10 ** Math.max(...values.map((n) => (String(n).split(".")[1] || "").length));
  const [sx, sy, sz] = [x, y, z].map((n) => Math.round(n * scale));
  if (sx + sy > sz) return null;
  const vi = (n) => String(n).replace(".", ",");
  const tex = (n) => String(n).replace(".", "{,}");
  const op = sx + sy === sz ? "=" : "<";
  const intro = `Ba cạnh ${values.map(vi).join(", ")} không tạo thành tam giác vì $${tex(x)} + ${tex(y)} ${op} ${tex(z)}$ — `
    + "tổng hai cạnh bất kỳ phải lớn hơn cạnh còn lại. Vì vậy không có tam giác nào như vậy, nên không tính được diện tích hay các yếu tố khác của nó.";
  return { sides: values, intro };
}

// ─── 2c. Kiến thức nền THCS — lời giải không có id công thức (quy tắc 1c) ───────────────────────
// Bộ ép no_formula ở normalizeAnswer có từ 30/9; quy tắc 1c (8/10) cho AI dùng kiến thức nền mà không
// cần thẻ công thức, nên "A = 50°, B = 60°, tính C" bị báo "thư viện chưa có công thức" dù AI giải
// đúng (chạy thật 2026-10-22: 5/5 câu chỉ cần kiến thức nền đều bị chặn). Cách sửa KHÔNG tin AI khai
// "tôi dùng kiến thức nền": backend tự nhận diện từ chính biểu thức AI viết, fail-closed — thiếu một
// điều kiện nào là giữ no_formula như cũ.
// CHỈ BA điều đã duyệt: tổng ba góc, Pytago (chiều thuận), bất đẳng thức tam giác. Tam giác cân/đều,
// Pytago đảo, góc phụ (90° − B)... KHÔNG nằm trong đó — vẫn no_formula (roadmap riêng, chưa làm).

const foldVi = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/đ/g, "d");
const unicodeWord = (src) => new RegExp(`(?<![\\p{L}])(?:${src})(?![\\p{L}])`, "iu");

// Tam giác cân / đều: tính chất ngoài 3 điều đã duyệt. Có dấu → kiểm trên chữ gốc (tránh nhầm "cân" với
// "cần"); đề gõ không dấu → kiểm bản đã bỏ dấu.
const ISOSCELES = unicodeWord("cân\\s+(?:tại|ở)|(?:tam giác|vuông)\\s+(?:[a-zđ]{3}\\s+)?(?:cân|đều)");
const ISOSCELES_NO_ACCENT = /\bcan (?:tai|o)\b|\b(?:tam giac|vuong) (?:[a-z]{3} )?(?:can|deu)\b/;
// Pytago đảo: "có phải tam giác vuông không?", "chứng minh ... vuông", "định lý Pytago đảo".
const INVERSE_PYTHAGORAS = /\b(?:co phai|co la|kiem tra|chung minh|xem)\b[^.?!]*\bvuong\b|\bvuong\b[^.?!]*\bkhong\b/;
const INVERSE_PYTHAGORAS_NAMED = /\bpytago dao\b|\bdinh ly (?:pytago )?dao\b/;

/** Đề có ngữ cảnh tam giác: chữ "tam giác", "ba cạnh/đoạn", hoặc "góc/cạnh" kèm tên ba đỉnh (ABC). */
export function hasTriangleContext(text) {
  const raw = String(text || "");
  const folded = foldVi(expandShorthand(raw));
  return /tam giac/.test(folded) || /\bba (?:canh|doan)\b/.test(folded) || (/\b(?:goc|canh)\b/.test(folded) && /\b[A-Z]{3}\b/.test(raw));
}

/** Biểu thức LaTeX → dạng gọn không khoảng trắng để so mẫu: "\text{ với }" thành "§", "\Rightarrow" thành "→". */
function normalizeBaseExpression(expr) {
  return String(expr || "")
    .replace(/\{,\}/g, ".")
    .replace(/\\text\{\s*(?:với|voi|with)\s*\}/gi, "§")
    .replace(/\\text\{[^{}]*\}/g, ",")
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, "")
    .replace(/\\(?:widehat|hat)\{([A-Z])\}/g, "$1")
    .replace(/\\(?:widehat|hat)\s*([A-Z])/g, "$1")
    .replace(/\\angle\s*\{?([A-Z])\}?/g, "$1")
    .replace(/\^\{\\circ\}/g, "^\\circ")
    .replace(/\^\{(\d)\}/g, "^$1")
    .replace(/\\(?:Longrightarrow|Rightarrow)(?![a-zA-Z])|⇒/g, "→") // trước khi bỏ khoảng trắng: "\Rightarrow C" không được dính thành "\RightarrowC"
    .replace(/\\[,;:! ]|\\q?quad(?![a-zA-Z])|\s+/g, "")
    .replace(/,+(?=§|→|$)/g, "");
}

const ANGLE_SUM_FORMS = [
  /^([A-Z])=180\^\\circ-([A-Z])-([A-Z])$/,
  /^([A-Z])=180\^\\circ-\(([A-Z])\+([A-Z])\)$/,
  /^([A-Z])\+([A-Z])\+([A-Z])=180\^\\circ$/,
];
const SEG = "([A-Z]{2}|[a-z])";
const PYTHAGORAS_FORMS = [
  { re: new RegExp(`^${SEG}\\^2=${SEG}\\^2\\+${SEG}\\^2$`), hypotenuseUnknown: true },
  { re: new RegExp(`^${SEG}=\\\\sqrt\\{${SEG}\\^2\\+${SEG}\\^2\\}$`), hypotenuseUnknown: true },
  { re: new RegExp(`^${SEG}\\^2=${SEG}\\^2-${SEG}\\^2$`), hypotenuseUnknown: false },
  { re: new RegExp(`^${SEG}=\\\\sqrt\\{${SEG}\\^2-${SEG}\\^2\\}$`), hypotenuseUnknown: false },
];
const INEQUALITY_OPERAND = "\\d+(?:\\.\\d+)?|[A-Z]{2}|[a-z]";
const INEQUALITY_ITEM = new RegExp(`^(${INEQUALITY_OPERAND})\\+(${INEQUALITY_OPERAND})>(${INEQUALITY_OPERAND})$`);

function parseAngleSum(formula) {
  for (let i = 0; i < ANGLE_SUM_FORMS.length; i++) {
    const m = formula.match(ANGLE_SUM_FORMS[i]);
    if (m && new Set(m.slice(1)).size === 3) return { letters: m.slice(1), lhs: i < 2 ? m[1] : null };
  }
  return null;
}

function parsePythagoras(formula) {
  for (const { re, hypotenuseUnknown } of PYTHAGORAS_FORMS) {
    const m = formula.match(re);
    if (m && new Set(m.slice(1)).size === 3) {
      const [lhs, second, third] = m.slice(1);
      return { lhs, symbols: [lhs, second, third], hypotenuse: hypotenuseUnknown ? lhs : second, otherLeg: hypotenuseUnknown ? null : third, hypotenuseUnknown };
    }
  }
  return null;
}

/** "AB=6,AC=8" → Map. Mọi giá trị phải là số có trong đề; khóa trùng hay sai khuôn → null. */
function parseGivenValues(part, allowedNumbers) {
  const given = new Map();
  if (part === "") return given;
  for (const item of part.split(",")) {
    const m = item.match(/^([A-Z]{1,2}|[a-z])=(\d+(?:\.\d+)?)(?:\^\\circ)?$/);
    if (!m || given.has(m[1]) || !allowedNumbers.has(String(Number(m[2])))) return null;
    given.set(m[1], Number(m[2]));
  }
  return given;
}

/**
 * Một biểu thức của bước có khớp ĐÚNG một mẫu kiến thức nền đã duyệt không → "angle_sum" |
 * "pythagoras" | "triangle_inequality" | null. Khung chung: công thức [\text{ với } dữ kiện] [⇒ …] ⇒ ẩn = ?.
 */
function matchBaseExpression(expression, allowedNumbers, rightAngle) {
  const tail = /\s*(?:\\Rightarrow|⇒)\s*\\text\{có thể tạo tam giác\}\s*=\s*\?\s*$/;
  if (tail.test(expression)) {
    const head = expression.replace(tail, "");
    if (/\\(?:Rightarrow|Longrightarrow)|⇒/.test(head)) return null;
    return matchBaseExpression(head, allowedNumbers, rightAngle) === "triangle_inequality" ? "triangle_inequality" : null;
  }
  const s = normalizeBaseExpression(expression);
  if (!s || s.split("§").length > 2) return null;
  const arrows = s.split("→");
  const [formula, dataPart = ""] = arrows[0].split("§");
  const middle = arrows.slice(1, -1);
  let target = null;
  if (arrows.length > 1) {
    const t = arrows[arrows.length - 1].match(/^([A-Za-z]{1,2})(?:\^2)?=\?$/);
    if (!t) return null;
    target = t[1];
  }

  const angle = parseAngleSum(formula);
  if (angle) {
    if (middle.length) return null;
    const given = parseGivenValues(dataPart, allowedNumbers);
    if (!given || [...given.keys()].some((k) => !angle.letters.includes(k))) return null;
    if (target !== null && (!angle.letters.includes(target) || given.has(target) || (angle.lhs && angle.lhs !== target))) return null;
    // Hai góc đã cho cộng lại ≥ 180° thì tam giác không tồn tại: KHÔNG hướng dẫn tiếp (ca góc vô lý là
    // việc riêng, chưa làm — giữ no_formula như trước thay vì dẫn học sinh tới góc âm).
    const angles = [...given.values()];
    if (angles.length >= 2 && angles.reduce((a, b) => a + b, 0) >= 180) return null;
    return "angle_sum";
  }

  const pythagoras = parsePythagoras(formula);
  if (pythagoras) {
    if (!rightAngle) return null;
    for (const part of middle) {
      const other = parsePythagoras(part);
      if (!other || other.symbols.slice().sort().join() !== pythagoras.symbols.slice().sort().join()) return null;
    }
    const given = parseGivenValues(dataPart, allowedNumbers);
    if (!given) return null;
    for (const [key, value] of given) {
      const isRightAngle = /^[A-Z]$/.test(key) && value === 90;
      if (!isRightAngle && (!pythagoras.symbols.includes(key) || key === pythagoras.lhs)) return null;
    }
    if (target !== null && target !== pythagoras.lhs) return null;
    // Tìm cạnh góc vuông: cạnh huyền phải lớn hơn cạnh góc vuông đã cho (không thì đề vô lý).
    if (!pythagoras.hypotenuseUnknown && given.has(pythagoras.hypotenuse) && given.has(pythagoras.otherLeg)
      && given.get(pythagoras.hypotenuse) <= given.get(pythagoras.otherLeg)) return null;
    return "pythagoras";
  }

  // Bất đẳng thức tam giác: "3+4>5, 4+5>3, 3+5>4" hoặc "a+b>c, …" (kèm dữ kiện). Không có ẩn "?".
  if (arrows.length === 1 && formula) {
    const items = formula.split(/[;,]/);
    const numbersOnly = items.map((it) => it.match(INEQUALITY_ITEM)).every((m) => m && m.slice(1).every((x) => /^\d/.test(x)));
    const symbolsOnly = items.map((it) => it.match(INEQUALITY_ITEM)).every((m) => m && m.slice(1).every((x) => !/^\d/.test(x)) && new Set(m.slice(1)).size === 3);
    if (numbersOnly) {
      if (dataPart !== "") return null;
      const nums = items.flatMap((it) => it.match(INEQUALITY_ITEM).slice(1));
      return nums.every((x) => allowedNumbers.has(String(Number(x)))) ? "triangle_inequality" : null;
    }
    if (symbolsOnly) {
      const given = parseGivenValues(dataPart, allowedNumbers);
      const used = new Set(items.flatMap((it) => it.match(INEQUALITY_ITEM).slice(1)));
      return given && [...given.keys()].every((k) => used.has(k)) ? "triangle_inequality" : null;
    }
  }
  return null;
}

/**
 * Lời giải KHÔNG có id công thức nào có phải chỉ dùng kiến thức nền đã duyệt không (quy tắc 1c).
 * Điều kiện (thiếu một là null → nơi gọi giữ no_formula):
 *   1. đề có ngữ cảnh tam giác; 2. đề và lời giải không dính tam giác cân/đều, Pytago đảo (ngoài 3 điều đã duyệt);
 *   3. MỌI biểu thức không rỗng của các bước khớp đúng một mẫu (tổng ba góc, Pytago, bất đẳng thức tam giác),
 *      số trong biểu thức đều có trong đề; 4. có ít nhất một biểu thức như vậy (bước thật sự dùng mẫu).
 * Chữ trong `detail` không kiểm được (ngoài việc lọc cân/đều/đảo) — số trong đó vẫn qua bộ lọc "không tính".
 * @param {{intro?: string, reminder?: string, steps: Array<{title?: string, detail?: string, expression?: string}>}} candidate
 * @returns {{kinds: string[]} | null}
 */
export function checkBaseKnowledge(candidate, questionText) {
  const steps = Array.isArray(candidate?.steps) ? candidate.steps : [];
  const raw = String(questionText || "");
  if (!steps.length || !hasTriangleContext(raw)) return null;

  const folded = foldVi(raw);
  const hasAccents = raw.normalize("NFD") !== raw || /[đĐ]/.test(raw);
  if (ISOSCELES.test(raw) || (!hasAccents && ISOSCELES_NO_ACCENT.test(folded))) return null;
  if (INVERSE_PYTHAGORAS.test(folded) || INVERSE_PYTHAGORAS_NAMED.test(folded)) return null;
  const answerText = [candidate.intro, candidate.reminder, ...steps.flatMap((st) => [st.title, st.detail])].join("\n");
  if (ISOSCELES.test(answerText) || INVERSE_PYTHAGORAS_NAMED.test(foldVi(answerText))) return null;

  const allowedNumbers = new Set(extractNumbers(raw).map((n) => String(Number(n))));
  const rightAngle = /\bvuong\b/.test(folded);
  if (rightAngle) allowedNumbers.add("90");
  const kinds = [];
  for (const st of steps) {
    if (!st.expression) continue;
    const kind = matchBaseExpression(st.expression, allowedNumbers, rightAngle);
    if (!kind) return null;
    kinds.push(kind);
  }
  return kinds.length ? { kinds: [...new Set(kinds)] } : null;
}

// ─── 3. Chặn tự tính (số lạ) ───────────────────────────────────────────────
/**
 * Lấy các con số trong một đoạn văn bản/LaTeX, BỎ QUA những chỗ số không phải giá trị tính ra:
 * chỉ số dưới (x_{1,2}, u_{20}, u_1), số mũ của đơn vị (cm^3, m^2, \text{cm}^3, cm²), số thứ tự
 * bước ("bước 2").
 */
export function extractNumbers(text) {
  const cleaned = String(text || "")
    .replace(/\{,\}/g, ".") // 3{,}14 → 3.14
    // Dấu phẩy chỉ là dấu thập phân khi phần nguyên là 0 (0,06; 0,5). "A(1,2,3)", "(-1,1)" là
    // toạ độ / khoảng — đọc thành 1.2, 1.1 sẽ thành "số lạ" và lọc oan. "x = 0,1,2" là danh sách
    // (còn ",số" phía sau) và "[0,2]", "(0,1)" là khoảng (0 đứng ngay sau ngoặc) — không phải 0.1, 0.2.
    .replace(/(^|[^\d.,[(])0,(\d+)(?!,\d)/g, "$10.$2")
    .replace(/(\d),(?=\d)/g, "$1 , ")
    // Id công thức model lỡ chép vào lời giải ("công thức gt12-logarit") không phải con số.
    .replace(/\b(?:gt|ds|hh|xs|lg|mr)\d{2}(?=[-\\_\s]|$)/gi, " ")
    .replace(/_\{[^{}]*\}/g, " ")
    .replace(/_\d+/g, " ")
    // Đơn vị diện tích/thể tích: cm^3, cm^{2}, \text{ cm}^3, và cả "cm$^2$" ($ chen giữa).
    .replace(/(?:\\(?:text|mathrm)\{\s*)?(?:k|c|d|m)?m\s*\}?\s*\$?\s*\^\s*\{?\s*[23]\s*\}?/g, " ")
    .replace(/(?:k|c|d|m)?m\s*[²³]/g, " ") // cm², m³
    // Chữ số viết kiểu chỉ số trên/dưới do học sinh gõ trên điện thoại: x³ − 3x², log₂ → 3, 2, 2.
    .replace(/[⁰¹²³⁴-⁹₀-₉]/g, (c) => ` ${c.normalize("NFKD")} `)
    .replace(/b(?:ư|u)ớc\s*\d+/gi, " ");
  return (cleaned.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(",", ".").replace(/^0+(?=\d)/, ""));
}

/**
 * Bước thay thế cho (các) bước bị lọc có biểu thức — giữ mạch hướng dẫn thay vì để hổng. Không
 * chứa con số nào: tên công thức có chữ số thì dùng cách gọi chung.
 */
export function neutralStep(formulaNames) {
  const names = formulaNames.filter(Boolean);
  // Câu trả lời kiến thức nền (quy tắc 1c, 2026-10-22) không có thẻ công thức nào để "xem ở trên".
  if (!names.length) {
    return {
      title: "Áp dụng vào dữ kiện",
      detail: "Áp dụng kiến thức vừa nêu cho các số trong đề, giữ nguyên các phép so sánh hoặc phép toán, chưa tính.",
      expression: "",
      neutral: true,
    };
  }
  const label = names.every((n) => !/\d/.test(n)) ? `công thức ${names.join(", ")}` : "công thức";
  return {
    title: "Thay số vào công thức",
    detail: `Thay các dữ kiện vào ${label} (xem thẻ ở trên), giữ nguyên các phép toán, chưa tính.`,
    expression: "",
    neutral: true,
  };
}

// ─── 3b. Phân tích biểu thức toán ──────────────────────────────────────────
// "Không tính" (quy tắc 2 của prompt, định nghĩa 2026-09-30):
//   ĐƯỢC biến đổi, rút gọn biểu thức CÒN CHỨA BIẾN (y' = 3x^2 - 6x - 9, t^2 - 4t + 3 < 0).
//   CẤM mọi GIÁ TRỊ SỐ cụ thể tính ra: nghiệm (x = 3), giá trị hàm tại một điểm, Δ = số, đáp số,
//   giá trị trung gian (3^2 - 4·2 = 1). Giá trị luôn để dạng biểu thức chưa tính.
// Vì vậy không thể chỉ nhìn "số này có trong đề không": x = 3 dùng toàn số có trong đề
// (y = x^3 - 3x^2...) nhưng vẫn là nghiệm; còn 6 trong y' = 3x^2 - 6x - 9 là số mới nhưng hợp lệ.
// Mỗi biểu thức được tách theo dấu quan hệ (=, <, ≤, ≈...) và xét từng cặp hai vế.

const NUM = String.raw`\d+(?:[.,]\d+)?`;
const PI = String.raw`(?:\\pi|π)`;
// Một giá trị số đã tính xong: 3, -1, ±1, 0.5, 36\pi, \sqrt{2}, 2\sqrt{3}, \frac{37}{42}, \frac{5\pi}{6}, 6%.
const SINGLE_VALUE = new RegExp(String.raw`^(?:[+-]|\\pm|±)?(?:${NUM}${PI}?|${PI}|(?:${NUM})?\\sqrt\{${NUM}\}|\\frac\{[+-]?(?:${NUM})?${PI}?\}\{${NUM}\}${PI}?|${NUM}\\?%)$`);
// \Delta KHÔNG nằm ở đây: Δ là một đại lượng (ký hiệu), như x_{1,2} = \frac{-b \pm \sqrt{\Delta}}{2a}.
const COMMANDS = /\\(?:frac|sqrt|pi|cdot|times|pm|mp|left|right|infty|circ|ldots|cdots|in|mathbb|text|mathrm)(?![a-zA-Z])/g;
const RELATION = /^(?:=|<|>|≤|≥|≠|≈)/;

function normalizeMath(s) {
  return String(s || "")
    .replace(/\\left|\\right|\\displaystyle|\\[,;!: ]|\\q?quad/g, " ")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\{,\}/g, ".") // 3{,}14
    .replace(/\b(?:gt|ds|hh|xs|lg|mr)\d{2}(?=[-\\_\s]|$)/gi, " ") // id công thức lỡ chép vào ($gt12-logarit$)
    .replace(/[⁰¹²³⁴-⁹]/g, (c) => `^${c.normalize("NFKD")}`) // x² → x^2
    .replace(/[₀-₉]/g, (c) => `_${c.normalize("NFKD")}`) // log₂ → log_2
    .replace(/−/g, "-")
    .replace(/[·×]|\\cdot|\\times/g, "*")
    .replace(/\\leq?(?![a-zA-Z])/g, "≤").replace(/\\geq?(?![a-zA-Z])/g, "≥")
    .replace(/\\neq?(?![a-zA-Z])/g, "≠").replace(/\\approx/g, "≈")
    // "x = 3 \text{ hoặc } x = -1", "\Rightarrow", "\Leftrightarrow": mỗi vế là một mệnh đề riêng
    // "... \text{ với } b = AC = 8": phần dữ kiện là mệnh đề riêng, không dính vào vế phải công thức.
    .replace(/\\text\{\s*(?:hoặc|hay|và|với|khi|trong đó|or|and)\s*\}/gi, ";")
    .replace(/\\(?:Rightarrow|Leftrightarrow|Longrightarrow|Leftarrow|iff|implies|vee|wedge)(?![a-zA-Z])/g, ";")
    .replace(/[⇒⟹⇔]/g, ";")
    // x \in (-1; 1): "\in" là chữ, đứng ngay trước khoảng thì khoảng bị coi là "điểm tên in(...)".
    .replace(/\\in(?![a-zA-Z])/g, " ∈ ").replace(/\\cup(?![a-zA-Z])/g, " ∪ ");
}

// ─── 3c. Ô trống "?" và giá trị lộ ra ngoài dấu = ──────────────────────────
// Quy tắc "ô trống" (2026-10-03): chỗ ra kết quả AI viết "?" cho học sinh tự tính; kết quả đó ở
// các bước sau chỉ được gọi bằng ký hiệu. Ngoài cặp "vế = giá trị" (mathLeaks), nghiệm còn lộ qua:
//   - giá trị hàm tại một số không có trong đề: y(1), f'(-1) (1, -1 là nghiệm của y' = 0);
//   - đầu mút khoảng / phần tử tập hợp là số không có trong đề: xét dấu trên (-\infty; -1), S = \{1; 3\}.
// "Có trong đề" = đầu mút đoạn đề cho, hoành độ đề cho (givenXValues), hoặc nguyên cụm có trong đề.
const POINT_CALL = /(?<![A-Za-z\\])([fgFhy](?:\\?'|\^\{?\\prime\}?)*)\(\s*([+-]?\d+(?:\.\d+)?)\s*\)/g;
const INTERVAL = /(?<![A-Za-z0-9_)\]}])([[(])([^()[\];,]+)([;,])([^()[\];,]+)([\])])/g;
const SET = /\\\{([^{}]*)\\\}/g;
const numericToken = (e) => {
  const c = compact(e).replace(/^\+/, "");
  return /^-?\d+(?:\.\d+)?$/.test(c) || /^-?\\frac\{\d+(?:\.\d+)?\}\{\d+(?:\.\d+)?\}$/.test(c) ? c : null;
};
function givenChecker(questionText) {
  const given = new Set(givenXValues(questionText).map((v) => String(Number(v))));
  const q = compact(normalizeMath(questionText));
  return {
    value: (v) => given.has(String(Number(v))),
    phrase: (s) => q.includes(compact(s)),
  };
}
/** Nghiệm / giá trị lộ qua y(số), khoảng hoặc tập hợp có số không có trong đề. `norm` đã qua normalizeMath. */
function revealedValueLeaks(norm, questionText) {
  const g = givenChecker(questionText);
  const leaks = [];
  for (const m of norm.matchAll(POINT_CALL)) {
    if (!g.value(m[2]) && !g.phrase(m[0])) leaks.push(compact(`${m[1]}(${m[2]})`));
  }
  for (const m of norm.matchAll(INTERVAL)) {
    if (g.phrase(m[0])) continue;
    for (const e of [m[2], m[4]]) {
      const v = numericToken(e);
      if (v && !g.value(v)) leaks.push(`khoảng ${compact(m[0])}`);
    }
  }
  for (const m of norm.matchAll(SET)) {
    if (g.phrase(m[0])) continue;
    if (m[1].split(/[;,]/).some((e) => { const v = numericToken(e); return v && !g.value(v); })) leaks.push(`tập ${compact(m[0])}`);
  }
  return [...new Set(leaks)];
}

/** Có biến (chữ cái không thuộc lệnh LaTeX) hay không. \text{cm} cũng tính là chữ (đơn vị). */
const hasVariable = (s) => /[a-zA-Z]/.test(s.replace(COMMANDS, "").replace(/\\(?:sin|cos|tan|cot|log|ln|max|min|lim)(?![a-zA-Z])/g, "#"));
const compact = (s) => s.replace(/\s+/g, "");
const isSingleValue = (s) => SINGLE_VALUE.test(compact(s));
// Ẩn / nghiệm: x, t, x_1, x_{1,2}, t_2 — trừ x_0 (điểm đề cho, như hoành độ tiếp điểm).
const isUnknown = (s) => /^(?:x|t)(?:_\{?(?!0\}?$)[0-9a-z,]+\}?)?$/.test(compact(s));
// Giá trị tại một điểm: f(2), f'(-1), y(3), f(x_1), F(1), Δ, Δ', max/min. KHÔNG gồm f(x), f'(x) —
// "f'(x) = 0" là phương trình cần giải. KHÔNG gồm y_0: trong Oxyz đó là toạ độ đề cho (M(1;-2;3)).
const isPointValue = (s) => {
  const c = compact(s);
  const call = c.match(/^[fgFhy](?:\\?')*\((.+)\)$/);
  if (call) return !/^[xt]$/.test(call[1]);
  return /^(?:\\Delta|Δ)'?$/.test(c) || /^\\(?:max|min)/.test(c);
};
// f'(x_0) = 0, f(x_1) = 0: điều kiện tại một điểm KÝ HIỆU, không phải giá trị tính ra.
const isSymbolicPointCondition = (s, value) => {
  const call = compact(s).match(/^[fgFhy](?:\\?')*\((.+)\)$/);
  return Boolean(call) && /^[a-z](?:_\{?\w+\}?)?$/.test(call[1]) && compact(value) === "0";
};

/**
 * Giá trị x đề đã cho — không phải nghiệm: "hoành độ 2", "tại x = 2", hai đầu đoạn/khoảng "[−1; 3]".
 * Trả về các chuỗi số (không dấu) kèm dấu, vd ["2"], ["-1", "3"].
 */
function givenXValues(question) {
  const q = String(question).replace(/−/g, "-");
  const out = [];
  for (const m of q.matchAll(/hoành độ\s*(?:bằng\s*|là\s*|x_?0?\s*=\s*)?(-?\d+(?:[.,]\d+)?)/gi)) out.push(m[1]);
  // "tại x = 2", "khi x_0 = -1": điểm đề cho (y'(2), f(-1) được viết).
  for (const m of q.matchAll(/(?<![A-Za-z])x(?:_?0|₀)?\s*=\s*(-?\d+(?:[.,]\d+)?)(?![\d.]*\s*[a-zA-Z(^*])/g)) out.push(m[1]);
  for (const m of q.matchAll(/[[(]\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*[\])]/g)) out.push(m[1], m[2]);
  // Hoành độ của điểm đề cho trong Oxyz: A(1;2;3) → "thay x = 1".
  for (const m of q.matchAll(/\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*-?\d+(?:[.,]\d+)?\s*;\s*-?\d+(?:[.,]\d+)?\s*\)/g)) out.push(m[1]);
  return out.map((v) => v.replace(",", "."));
}
const letterTokens = (s) => s.replace(COMMANDS, "").replace(/\\(?:sin|cos|tan|cot|log|ln)(?![a-zA-Z])/g, "#").match(/\\?[a-zA-Z]+/g) || [];
// Nghiệm tổng quát đã giải xong: chỉ còn hằng số và tham số nguyên k, n, m, l — x = \frac{\pi}{2} + k2\pi.
// Biểu thức số chưa tính (x = \frac{6 \pm \sqrt{(-6)^2 - 4 \cdot 3 \cdot (-9)}}{2 \cdot 3}) KHÔNG thuộc loại
// này: nó được xét như mọi biểu thức số khác (mọi số phải có sẵn).
const isSolvedForm = (s) => {
  const letters = letterTokens(s);
  return letters.length > 0 && letters.every((l) => /^[knml]$/.test(l));
};

// Tích = 0 có nhân tử bậc nhất (x ± số), (ax ± số): phân tích nhân tử là lộ nghiệm — 3(x-3)(x+1) = 0.
// Chỉ xét khi cả vế là MỘT tích (không có + / - ở tầng ngoài), để không bắt nhầm
// 2(x-1) - (y-2) + (z-3) = 0 (phương trình mặt phẳng).
const LINEAR_FACTOR = /^(?:[+-]?\d*(?:\.\d+)?\*?[a-z](?:_\{?\w+\}?)?[+-]\d+(?:\.\d+)?|[+-]?\d+(?:\.\d+)?[+-]\d*(?:\.\d+)?\*?[a-z](?:_\{?\w+\}?)?)$/;
function isFactoredWithLinearFactor(side) {
  const c = compact(side);
  const terms = splitTopLevel(c, (s, i) => (i > 0 && (s[i] === "+" || s[i] === "-") && !/[\^{(*]/.test(s[i - 1]) ? 1 : 0));
  if (terms.length > 1) return false;
  for (let i = 0; i < c.length; i++) if (c[i] === "(" && LINEAR_FACTOR.test(groupAt(c, i))) return true;
  return false;
}

// Vế trái là đạo hàm: y', f'(x), y'(x), y^{\prime}, \frac{dy}{dx} (model đôi khi escape thừa thành y\').
const isDerivative = (s) => /^(?:[yf](?:\\?'|\^\{?\\prime\}?)+(?:\([xt]\))?|\\frac\{d[yf]\}\{d[xt]\})$/.test(compact(s));

// Đại lượng đề hỏi — theo từ khóa trong đề. Chỉ những ký hiệu này mới bị xét "đã rút gọn theo tham số".
const ASKED_QUANTITIES = [
  [/the tich/, /^V(?:_\{?[^}]*\}?)?$/],
  [/dien tich/, /^S(?:_\{?[^}]*\}?)?$/],
  [/khoang cach/, /^d(?:\(.*\))?$/],
  [/xac suat/, /^P(?:\(.*\))?$/],
  [/chieu cao|duong cao/, /^h$/],
  [/ban kinh/, /^[Rr]$/],
];
const plain = (t) => String(t).normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
/** Tham số trong đề: chữ cái thường đứng riêng ("cạnh a", "SA = a√2"), trừ x, y, z (ẩn / toạ độ). */
function questionParameters(question) {
  return [...new Set([...String(question).matchAll(/(?<![\p{L}\\])([a-w])(?![\p{L}])/gu)].map((m) => m[1]))];
}
/**
 * "V = \frac{a^3\sqrt{2}}{3}": đại lượng đề hỏi bị viết ở dạng ĐÃ RÚT GỌN theo tham số — tức đáp án
 * cuối. Dạng thay số chưa rút gọn (V = \frac{1}{3} \cdot a^2 \cdot a\sqrt{2}) có tham số lặp lại nhiều lần.
 * Phát hiện được: ký hiệu đại lượng đề hỏi (V, S, d, P, h, R) ở vế trái; vế phải chỉ chứa tham số
 * có trong đề và MỖI tham số chỉ xuất hiện một lần. Không phát hiện được: đáp án rút gọn mà tham số
 * vẫn xuất hiện nhiều lần (V = a^3 + a^2), hay viết bằng lời. Bắt nhầm: công thức mà tham số vốn chỉ
 * xuất hiện một lần (thể tích lập phương V = a^3).
 */
function isSimplifiedParametricAnswer(lhs, rhs, question) {
  const q = plain(question);
  const lhsC = compact(lhs);
  if (!ASKED_QUANTITIES.some(([kw, sym]) => kw.test(q) && sym.test(lhsC))) return false;
  const params = questionParameters(question);
  const letters = letterTokens(rhs);
  if (!letters.length || !letters.every((l) => params.includes(l))) return false;
  if (compact(normalizeMath(question)).includes(compact(rhs))) return false; // nhắc lại dữ kiện: h = a\sqrt{2}
  const counts = {};
  for (const l of letters) counts[l] = (counts[l] || 0) + 1;
  return Object.values(counts).every((n) => n === 1);
}

/** Tách theo dấu phẩy / chấm phẩy / dấu quan hệ ở tầng ngoài cùng (không cắt trong {} hay ()). */
function splitTopLevel(s, isSep) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const len = isSep(s, i);
      if (len) { parts.push(s.slice(start, i)); parts.push(s.slice(i, i + len)); start = i + len; i += len - 1; }
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/** Vị trí các con số "thật" (bỏ chỉ số dưới, số mũ đơn vị) trong một vế. */
function numberTokens(side) {
  const masked = side
    .replace(/_\{[^{}]*\}/g, (m) => "_" + "#".repeat(m.length - 1))
    .replace(/_\d+/g, (m) => "_" + "#".repeat(m.length - 1))
    .replace(/(?:\\(?:text|mathrm)\{\s*)?(?:k|c|d|m)?m\s*\}?\s*\^\s*\{?\s*[23]\s*\}?/g, (m) => m.replace(/\d/g, "#"));
  // Dấu phẩy thập phân chỉ khi phần nguyên là 0 (0,06) — (1,2,3) là toạ độ, 0,1,2 là danh sách,
  // [0,2] là khoảng.
  return [...masked.matchAll(/(?<![\d.,[(])0,\d+(?!,\d)|\d+(?:\.\d+)?/g)].map((m) => ({ text: m[0].replace(",", ".").replace(/^0+(?=\d)/, ""), index: m.index, end: m.index + m[0].length }));
}

/** Nội dung nhóm ngoặc bắt đầu tại `open` ({ hoặc (), trả về chuỗi bên trong. */
function groupAt(s, open) {
  const pairs = { "{": "}", "(": ")" };
  const close = pairs[s[open]];
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === s[open]) depth++;
    else if (s[i] === close && --depth === 0) return s.slice(open + 1, i);
  }
  return s.slice(open + 1);
}

/** Số mới được chấp nhận khi là HỆ SỐ đứng ngay trước biến/ngoặc chứa biến, hoặc SỐ MŨ của biến. */
function isAttachedToVariable(side, tok) {
  const before = side.slice(0, tok.index).replace(/\s+$/, "");
  // Số mũ: x^4, x^{n-1}, (x+1)^2 — cơ số là chữ hoặc một nhóm ngoặc.
  const expo = before.match(/([a-zA-Z)}])\s*\^\s*\{?[^{}]*$/);
  if (expo && /\^\s*\{?[^{}]*$/.test(before) && !/\d\s*\^\s*\{?[^{}]*$/.test(before)) return true;
  let rest = side.slice(tok.end);
  // \frac{3}{2}x: bỏ qua phần còn lại của phân số trước khi xét chữ đứng sau.
  for (let guard = 0; guard < 3; guard++) {
    const m = rest.match(/^\s*\}(?:\s*\{[^{}]*\})?/);
    if (!m) break;
    rest = rest.slice(m[0].length);
  }
  rest = rest.replace(/^[\s*]+/, "");
  if (/^[a-zA-Z]/.test(rest)) return true;
  if (rest.startsWith("(") || rest.startsWith("{")) return hasVariable(groupAt(rest, 0));
  if (/^\\(?:sin|cos|tan|cot|log|ln)(?![a-zA-Z])/.test(rest)) return true;
  if (/^\\sqrt\s*\{/.test(rest)) return hasVariable(groupAt(rest, rest.indexOf("{")));
  if (/^\\pi(?![a-zA-Z])/.test(rest)) return /^[a-zA-Z]/.test(rest.slice(3).replace(/^[\s*]+/, ""));
  return false;
}

/**
 * Lộ giá trị số trong MỘT đoạn toán. Trả về { leaks, accepted }: `leaks` là số mới hoặc mệnh đề
 * lộ giá trị ("x=3"); `accepted` là hệ số/số mũ mới hợp lệ, được dùng tiếp ở các bước sau
 * (y' = 3x^2 - 6x - 9 rồi b = -6).
 */
// ─── Ngoại lệ HẸP đã được chủ dự án duyệt (2026-10-08): nhắc lại dữ kiện ở cuối biểu thức ──────────
// "… \text{ vì } a = -2" (sau dấu = cuối cùng là một số) từng bị coi là kết quả tính ra → học sinh thấy
// "vì a = ?". Chỉ cho qua khi THỎA CẢ BA: (1) vế trái là MỘT ký hiệu đơn chữ thường (không phải ẩn
// x, y, z, t, không phải đại lượng đề hỏi như h, d, R, S, V, P); (2) đúng cặp "ký hiệu = giá trị" đó đã
// có ở một bước TRƯỚC của cùng câu trả lời (bước xác định dữ kiện); (3) giá trị đó có trong đề, tính cả
// dấu âm. Prompt (quy tắc ô trống) là lớp chính — dặn AI viết lý do bằng lời trước biểu thức.
const RESTATED_SYMBOL = /(?:^|\\text\s*\{[^{}]*\}|[,;:])\s*([a-su-w])\s*$/;
function isRestatedDatum(lhs, value, question, declared) {
  if (!declared || !declared.size) return false;
  const m = String(lhs).match(RESTATED_SYMBOL);
  if (!m) return false;
  const sym = m[1];
  const q = plain(question);
  if (ASKED_QUANTITIES.some(([kw, re]) => kw.test(q) && re.test(sym))) return false;
  const v = compact(String(value)).replace(/−/g, "-");
  if (!declared.has(`${sym}=${v}`)) return false;
  const signGuard = v.startsWith("-") ? "" : "\\-";
  return new RegExp(`(?<![\\d.${signGuard}])${escapeRe(v)}(?![\\d.])`).test(compact(normalizeMath(question)).replace(/−/g, "-"));
}

/** Cặp "ký hiệu đơn = số" khai báo trong một đoạn (vd bước 1 "với $a = -2$, $b = 4$") → "a=-2", "b=4". */
export function declaredPairs(text) {
  const out = [];
  for (const m of String(text || "").matchAll(/(?<![\p{L}\\_])([a-su-w])\s*=\s*([+\-−]?\d+(?:[.,]\d+)?)(?![\d.,]*\d)/gu)) {
    out.push(`${m[1]}=${m[2].replace(/−/g, "-").replace(/^\+/, "")}`);
  }
  return out;
}

/**
 * Đại lượng đề hỏi dạng tên đoạn / góc viết hoa: "tính BC", "tìm độ dài cạnh AC", "tính số đo góc A".
 * Gán đại lượng này bằng MỘT con số là lộ đáp số kể cả khi số đó có trong đề (tam giác đều AB = AC = 5
 * ⇒ BC = 5) — trước 2026-10-08 lọt vì 5 "có sẵn" (giới hạn đã biết).
 */
export function askedTargets(question) {
  const re = /(?:tính|tìm|xác định)\s+(?:(?:độ dài|số đo|chiều dài)\s+)?(?:(?:cạnh|đoạn thẳng|đoạn|góc)\s+)?([A-Z]{1,3})(?![\p{L}\d])/giu;
  return [...String(question || "").normalize("NFC").matchAll(re)].map((m) => m[1]).filter((t) => /^[A-Z]+$/.test(t));
}
const targetSymbol = (s) => compact(String(s)).replace(/^\\widehat\{([A-Z]{1,3})\}$/, "$1").replace(/^\\angle([A-Z]{1,3})$/, "$1");

export function mathLeaks(latex, allowed, questionText = "", opts = {}) {
  const leaks = [], accepted = [];
  const targets = askedTargets(questionText);
  const known = (n) => allowed.has(n) || accepted.includes(n);
  const q = compact(normalizeMath(questionText));
  const isClauseSep = (s, i) => (s[i] === ";" || (s[i] === "," && !(/\d/.test(s[i - 1] ?? "") && /\d/.test(s[i + 1] ?? ""))) ? 1 : 0);
  const clauses = splitTopLevel(normalizeMath(latex), isClauseSep).filter((p, i) => i % 2 === 0);
  // Danh sách giá trị của ẩn: "x = 0, 1, 2" — mệnh đề "x = 0" rồi các mệnh đề chỉ là một số. Mỗi số
  // trong danh sách phải có trong đề (đầu mút, hoành độ đề cho); không thì là nghiệm bị lộ.
  let listVar = null;
  for (const clause of clauses) {
    const c = compact(clause);
    const head = c.match(/^([^=]+)=(.+)$/);
    // Viết liền "x=0,1,2" (dấu phẩy giữa hai chữ số không tách mệnh đề): xét từng giá trị.
    const inline = head && isUnknown(head[1]) ? head[2].split(",") : [];
    if (inline.length > 1 && inline.every((v) => isSingleValue(v))) {
      for (const v of inline) {
        const statement = `${head[1]}=${v}`;
        if (!q.includes(statement) && !givenXValues(questionText).includes(v)) leaks.push(statement);
      }
      listVar = head[1];
      continue;
    }
    if (head && isUnknown(head[1]) && isSingleValue(head[2])) { listVar = head[1]; continue; }
    if (listVar && isSingleValue(c)) {
      const statement = `${listVar}=${c}`;
      if (!q.includes(statement) && !givenXValues(questionText).includes(c)) leaks.push(statement);
      continue;
    }
    listVar = null;
  }
  for (const clause of clauses) {
    const parts = splitTopLevel(clause, (s, i) => (s[i] === "=" ? 1 : 0));
    for (let k = 0; k + 2 < parts.length; k += 2) {
      const [l, r] = [parts[k].trim(), parts[k + 2].trim()];
      if (!l || !r) continue;
      const statement = compact(`${l}=${r}`);
      // x = \pm\frac{\pi}{3} + k2\pi: nghiệm tổng quát đã giải xong.
      if (isUnknown(l) && !isSingleValue(r) && isSolvedForm(r) && !q.includes(statement)) leaks.push(statement);
      // 3(x-3)(x+1) = 0: phân tích nhân tử lộ nghiệm.
      if ((compact(r) === "0" && isFactoredWithLinearFactor(l)) || (compact(l) === "0" && isFactoredWithLinearFactor(r))) leaks.push(statement);
      // y' = 3(x-3)(x+1): đạo hàm viết dạng tích có nhân tử bậc nhất cũng lộ nghiệm của y' = 0.
      // Chỉ áp cho vế trái là đạo hàm — không mở rộng sang mọi tích.
      if (isDerivative(l) && isFactoredWithLinearFactor(r)) leaks.push(statement);
      // V = \frac{a^3\sqrt{2}}{3}: đáp án cuối của bài có tham số.
      if (isSimplifiedParametricAnswer(l, r, questionText)) leaks.push(statement);
    }
  }
  for (const clause of clauses) {
    const parts = splitTopLevel(clause, (s, i) => (RELATION.test(s.slice(i)) ? 1 : 0));
    const sides = parts.filter((_, i) => i % 2 === 0).map((s) => s.trim());
    const ops = parts.filter((_, i) => i % 2 === 1);
    // 1) Cặp hai vế: một vế là GIÁ TRỊ SỐ đã tính xong.
    ops.forEach((op, k) => {
      const [l, r] = [sides[k], sides[k + 1]];
      if (!l || !r) return;
      const [value, other] = isSingleValue(r) && !isSingleValue(l) ? [r, l] : isSingleValue(l) && !isSingleValue(r) ? [l, r] : [null, null];
      if (!value) return;
      if (opts.symbolicElip && op === "=" && compact(value) === "1" && /^\\frac\{x\^2\}\{(?:a\^2|\?)\}\+\\frac\{y\^2\}\{(?:b\^2|\?)\}$/.test(compact(other))) return;
      // Đại lượng đề hỏi = một số → luôn là lộ đáp số (xem askedTargets), trừ khi chính đề cho cặp đó.
      if (op === "=" && value === r && targets.includes(targetSymbol(other)) && !q.includes(compact(`${other}=${value}`))) {
        leaks.push(compact(`${other}${op}${value}`));
        return;
      }
      // Ngoại lệ hẹp: "… vì a = -2" nhắc lại dữ kiện đã khai báo (xem isRestatedDatum).
      if (op === "=" && value === r && isRestatedDatum(other, value, questionText, opts.declared)) return;
      const nums = extractNumbers(value);
      const newNums = nums.filter((n) => !known(n));
      const statement = compact(`${other}${op}${value}`);
      const isCondition = op !== "=" && op !== "≈"; // Δ > 0, x + 1 > 0, f'(x) < 0
      if (isUnknown(other)) {
        const zeroBound = isCondition && compact(value) === "0";
        const givenInQuestion = q.includes(compact(`${other}=${value}`)) || givenXValues(questionText).includes(compact(value));
        if (!zeroBound && !givenInQuestion) leaks.push(statement); // nghiệm: x = 3, 1 < t < 3
      } else if (isPointValue(other) && (isCondition || isSymbolicPointCondition(other, value))) {
        if (newNums.length) leaks.push(newNums.join(",")); // điều kiện: Δ > 0, f'(x_0) = 0
      } else if (isPointValue(other) || (!hasVariable(other) && /\d/.test(other))) {
        leaks.push(newNums.length ? newNums.join(",") : statement); // f(2) = 5, Δ = 1, 3^2 - 4·2 = 1
      } else if (op === "=" && compact(value) !== "0" && letterTokens(other).some((l) => /^[xt]$/.test(l))
        && !q.includes(statement) && !givenXValues(questionText).includes(compact(value))) {
        // x^2 = 1, 2x = 6: kết quả của phép giải — lộ dù con số có sẵn trong đề (1 luôn "có sẵn").
        // Học sinh phải thấy x^2 = ?. Vế phải 0 là phương trình cần giải (x^2 - 1 = 0), không chặn.
        leaks.push(statement);
      } else if (newNums.length) {
        leaks.push(newNums.join(",")); // V = 36π, x^2 - 1 = 8 (giá trị không có sẵn)
      }
    });
    // 2) Từng con số trong các vế không phải giá trị đơn.
    for (const side of sides) {
      if (!side || isSingleValue(side)) {
        if (side && sides.length === 1) for (const n of extractNumbers(side)) if (!known(n)) leaks.push(n); // "$36\pi$" đứng riêng
        continue;
      }
      const withVar = hasVariable(side);
      for (const tok of numberTokens(side)) {
        if (known(tok.text)) continue;
        if (withVar && isAttachedToVariable(side, tok)) accepted.push(tok.text);
        else leaks.push(tok.text);
      }
    }
  }
  leaks.push(...revealedValueLeaks(normalizeMath(latex), questionText));
  return { leaks: [...new Set(leaks)], accepted: [...new Set(accepted)] };
}

// Nghiệm / Δ viết thẳng trong câu chữ, không có $: "Khi x = -1 thì...", "Δ = 1 > 0", "x = ±1".
// Không bắt khi số là phần đầu của một biểu thức (x = 2x + 1, x = 3(...), x = 2^k): ngay sau số là
// chữ/ngoặc/mũ, hoặc dấu cách rồi phép toán. "x = 1 thì..." (chữ thường sau dấu cách) vẫn bị bắt.
const PROSE_VALUE = /(?<![A-Za-z])((?:[xt](?:_\{?[1-9][0-9,]*\}?)?)|Δ|\\Delta)\s*=\s*((?:[+\-−]|\\pm|±)?\d+(?:[.,]\d+)?)(?![\d.]*(?:[a-zA-Z(^*·]|\s*[+\-−*/^·]))/g;

/** Lộ giá trị số trong một đoạn văn có xen toán $...$: phần chữ xét như cũ, phần $...$ xét như biểu thức. */
function textLeaks(text, allowed, questionText, opts = {}) {
  const s = String(text || "");
  const maths = [...s.matchAll(/\$\$?([^$]+)\$\$?/g)].map((m) => m[1]);
  const prose = s.replace(/\$\$?[^$]+\$\$?/g, " ");
  const leaks = extractNumbers(prose).filter((n) => !allowed.has(n));
  // Nghiệm / Δ viết thẳng trong câu chữ, không có $: "Khi x = -1 thì...", "Δ = 1 > 0".
  const q = compact(normalizeMath(questionText));
  for (const m of prose.matchAll(PROSE_VALUE)) {
    const value = m[2].replace(/^(?:\\pm|±)/, "");
    const given = q.includes(compact(`${m[1]}=${m[2]}`)) || (/^[xt]$/.test(m[1]) && givenXValues(questionText).includes(value.replace(",", ".")));
    if (!given) leaks.push(compact(m[0]));
  }
  // y(1), khoảng (−∞; −1), tập {1; 3} viết thẳng trong câu chữ.
  leaks.push(...revealedValueLeaks(normalizeMath(prose), questionText));
  const accepted = [];
  for (const m of maths) {
    const r = mathLeaks(m, new Set([...allowed, ...accepted]), questionText, opts);
    leaks.push(...r.leaks);
    accepted.push(...r.accepted);
  }
  return { leaks: [...new Set(leaks)], accepted };
}

// ─── 3d. Thay giá trị lộ bằng ô trống "?" ──────────────────────────────────
// Dùng khi AI đã được yêu cầu viết lại một lần mà vẫn lộ (askFinder): thay đúng con số đó bằng
// "?" thay vì bỏ cả bước. Chỉ đụng tới GIÁ TRỊ bị bắt (vế phải là một số, đối số y(1), đầu mút
// khoảng, số lạ đứng riêng) — biểu thức ký hiệu và công thức xung quanh giữ nguyên. Không thay
// được cho sạch (vẫn còn lộ sau khi thay) thì trả null để nơi gọi bỏ bước như cũ.
const RELATION_TOKEN = /^(?:\\Leftrightarrow|\\Rightarrow|\\implies|\\approx(?![a-zA-Z])|\\neq?(?![a-zA-Z])|\\leq?(?![a-zA-Z])|\\geq?(?![a-zA-Z])|[⇒⟹⇔≤≥≠≈=<>])/;
const isChainOp = (op) => !/Rightarrow|Leftrightarrow|implies|[⇒⟹⇔]/.test(op);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Tách LaTeX GỐC (chưa chuẩn hoá) theo dấu quan hệ / dấu suy ra ở tầng ngoài: [vế, dấu, vế, dấu, ...]. */
function splitRelationsRaw(s) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const m = s.slice(i).match(RELATION_TOKEN);
      // "\left" bắt đầu bằng "\le" — RELATION_TOKEN đã chặn bằng (?![a-zA-Z]).
      if (m) { out.push(s.slice(start, i), m[0]); i += m[0].length - 1; start = i + 1; }
    }
  }
  out.push(s.slice(start));
  return out;
}

/**
 * Ký hiệu cho các nghiệm bị lộ: y(1) → y(x_1), khoảng (-\infty; -1) → (-\infty; x_1), danh sách
 * x = 0, 1, 2 → x = 0, x_1, 2. Dùng CHUNG cho cả câu trả lời để cùng một giá trị luôn ra cùng ký hiệu.
 * Nếu AI đã đặt tên nghiệm ("x_2 = 1" ở bước trước) thì dùng đúng tên đó; không thì lấy x_k với k
 * chưa có trong câu trả lời. Đầu mút / điểm đề cho không bao giờ bị thay.
 */
export function makeRootSymbols(texts, questionText = "") {
  const g = givenChecker(questionText);
  const all = texts.filter(Boolean).join(" ");
  const used = new Set([...all.matchAll(/x_\{?(\d+)\}?/g)].map((m) => m[1]));
  const map = new Map();
  for (const m of all.matchAll(/(?<![A-Za-z])x_\{?(\d+)\}?\s*=\s*(-?\d+(?:[.,]\d+)?)(?![\d.])/g)) {
    const v = String(Number(m[2].replace(",", ".")));
    if (!g.value(v) && !map.has(v)) map.set(v, `x_${m[1]}`);
  }
  let k = 1;
  return (value) => {
    const n = Number(String(value).replace(/\s|\\,/g, "").replace("−", "-").replace(",", "."));
    if (!Number.isFinite(n)) return "?";
    const v = String(n);
    if (!map.has(v)) {
      while (used.has(String(k))) k++;
      used.add(String(k));
      map.set(v, `x_${k}`);
    }
    return map.get(v);
  };
}

// Đánh dấu tạm quanh đối số đã thay của y(...) để nhận ra vế phải ngay sau nó (đã thay nghiệm) — bỏ ở cuối.
const MARK = "\u0001";

/** Thay nghiệm lộ qua y(số), khoảng, tập hợp bằng ký hiệu. `wrap`: bọc ký hiệu bằng $...$ (dùng trong câu chữ). */
function maskRevealed(s, questionText, symbolFor, wrap = false) {
  const g = givenChecker(questionText);
  const sym = (v) => (wrap ? `$${symbolFor(v)}$` : symbolFor(v));
  return s
    // \left( \right) và \in( : chữ cái đứng sát dấu ngoặc làm INTERVAL bỏ qua khoảng → bỏ \left \right,
    // chèn dấu cách sau \in (hiển thị không đổi đáng kể).
    .replace(/\\left\s*([([])/g, "$1").replace(/\\right\s*([)\]])/g, "$1")
    .replace(/\\in(?![a-zA-Z])\s*/g, "\\in ")
    .replace(POINT_CALL, (m, name, arg) => (g.value(arg) || g.phrase(normalizeMath(m)) ? m : `${name}(${MARK}${sym(arg)}${MARK})`))
    .replace(INTERVAL, (m, open, a, sep, b, close) => {
      if (g.phrase(normalizeMath(m))) return m;
      const fix = (e) => { const v = numericToken(normalizeMath(e)); return v && !g.value(v) ? `${e.match(/^\s*/)[0]}${sym(v)}` : e; };
      return `${open}${fix(a)}${sep}${fix(b)}${close}`;
    })
    .replace(SET, (m, inner) => (g.phrase(normalizeMath(m)) ? m
      : `\\{${inner.split(/([;,])/).map((e, i) => { if (i % 2) return e; const v = numericToken(normalizeMath(e)); return v && !g.value(v) ? `${e.match(/^\s*/)[0]}${sym(v)}` : e; }).join("")}\\}`));
}

/** "? = ?" (vế giữa đã thay, còn ô trống cuối) → một ô "?". */
const collapseBlanks = (s) => s.replace(/\?(?:\s*=\s*\?)+/g, "?");

/**
 * Thay giá trị lộ trong MỘT biểu thức LaTeX. Kết quả (vế phải là một số) → "?"; nghiệm lộ qua y(số),
 * khoảng, danh sách x → ký hiệu x_1, x_2 (`symbolFor`, mặc định đánh số riêng cho biểu thức này).
 * Trả về chuỗi đã sạch, hoặc null.
 */
export function maskMathLeaks(latex, allowed, questionText = "", symbolFor = makeRootSymbols([latex], questionText), opts = {}) {
  let s = maskRevealed(String(latex || ""), questionText, symbolFor);
  const parts = splitRelationsRaw(s);
  // y(x_1) = 1^4 - 2 \cdot 1^2 + 3: đối số đã thay nhưng vế phải vẫn thay chính nghiệm đó → vế phải
  // thành "?", tới hết mệnh đề (dấu phẩy, ;, xuống dòng \\ hoặc \quad ở tầng ngoài, hoặc dấu suy ra).
  const clauseSep = (t, j) => ((t[j] === "," || t[j] === ";") && t[j - 1] !== "\\" ? 1 : t.startsWith("\\\\", j) ? 2 : /^\\q?quad(?![a-zA-Z])/.test(t.slice(j)) ? t.slice(j).match(/^\\q?quad/)[0].length : 0);
  let afterMaskedCall = false;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) { if (!isChainOp(parts[i])) afterMaskedCall = false; continue; }
    if (afterMaskedCall) {
      const pieces = splitTopLevel(parts[i], clauseSep);
      if (pieces.length > 1) { parts[i] = " ?" + pieces.slice(1).join(""); afterMaskedCall = false; }
      else parts[i] = parts[i].match(/^\s*/)[0] + "?" + parts[i].match(/\s*$/)[0];
    }
    const lastClause = splitTopLevel(parts[i], clauseSep).at(-1);
    if (new RegExp(String.raw`\(${MARK}[^${MARK}]*${MARK}\)\s*$`).test(lastClause)) afterMaskedCall = true;
  }
  // Vế là một giá trị số mà cặp "vế trước <dấu> vế này" bị bắt → "?". Vế là danh sách giá trị của
  // ẩn (x = 0, 1, 2) → thay từng giá trị không có trong đề bằng ký hiệu (x = 0, x_1, 2).
  const g = givenChecker(questionText);
  for (let i = 2; i < parts.length; i += 2) {
    const op = parts[i - 1];
    if (!isChainOp(op)) continue;
    const items = splitTopLevel(parts[i], (t, j) => (t[j] === "," ? 1 : 0));
    if (op === "=" && items.length > 1 && isUnknown(normalizeMath(parts[i - 2]).trim())
      && items.every((it, k) => k % 2 === 1 || isSingleValue(normalizeMath(it)))) {
      parts[i] = items.map((it, k) => (k % 2 === 1 || g.value(compact(normalizeMath(it))) ? it : it.match(/^\s*/)[0] + symbolFor(compact(normalizeMath(it))))).join("");
      continue;
    }
    if (!isSingleValue(normalizeMath(parts[i]))) continue;
    if (mathLeaks(`${parts[i - 2]}${op}${parts[i]}`, allowed, questionText, opts).leaks.length) parts[i] = parts[i].match(/^\s*/)[0] + "?";
  }
  s = parts.join("");
  // Số lạ còn lại (đứng riêng, không phải chỉ số/số mũ) → "?". Số ngay sau "{" vẫn thay được
  // (\sqrt{89 - 80}, \frac{82}{2}) trừ khi "{" là của chỉ số/số mũ (_{20}, ^{2}).
  for (const n of mathLeaks(s, allowed, questionText, opts).leaks.filter((l) => /^-?\d+(?:\.\d+)?$/.test(l))) {
    s = s.replace(new RegExp(String.raw`(?<![\d.^_a-zA-Z\\])(?<![\^_]\{)${escapeRe(n)}(?![\d.])`, "g"), "?");
  }
  s = collapseBlanks(s.split(MARK).join(""));
  return mathLeaks(s, allowed, questionText, opts).leaks.length ? null : s;
}

/** Như maskMathLeaks nhưng cho đoạn văn có xen $...$. Trả về chuỗi đã sạch, hoặc null. */
export function maskTextLeaks(text, allowed, questionText = "", symbolFor = makeRootSymbols([text], questionText), opts = {}) {
  const s = String(text || "");
  let failed = false;
  const out = s.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/).map((part, i) => {
    if (i % 2 === 1) {
      const fence = part.startsWith("$$") ? "$$" : "$";
      const masked = maskMathLeaks(part.slice(fence.length, -fence.length), allowed, questionText, symbolFor, opts);
      if (masked === null) failed = true;
      return masked === null ? part : `${fence}${masked}${fence}`;
    }
    let p = maskRevealed(part, questionText, symbolFor, true).split(MARK).join("").replace(PROSE_VALUE, (m, lhs, value) => {
      const given = givenChecker(questionText);
      return given.phrase(`${lhs}=${value}`) || given.value(value.replace(/^(?:\\pm|±)/, "").replace("−", "-")) ? m : `${lhs} = ?`;
    });
    for (const n of extractNumbers(p).filter((x) => !allowed.has(x))) {
      p = p.replace(new RegExp(String.raw`(?<![\d.\p{L}])${escapeRe(n)}(?![\d.])`, "gu"), "?");
    }
    return p;
  }).join("");
  if (failed || textLeaks(out, allowed, questionText, opts).leaks.length) return null;
  return out;
}

/** Tập số "có sẵn": đề + công thức + 0, 1, và dạng thập phân của phần trăm trong đề (6% → 0.06). */
function allowedNumbers(sourceTexts, formulaTexts) {
  const set = new Set(["0", "1", ...sourceTexts.flatMap(extractNumbers), ...formulaTexts.flatMap(extractNumbers)]);
  for (const t of sourceTexts) {
    for (const m of String(t).matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)) set.add(String(Number(m[1].replace(",", ".")) / 100));
  }
  return set;
}

/**
 * Loại phần lộ GIÁ TRỊ SỐ — dấu hiệu model đã tự tính (xem mathLeaks).
 * - Một chuỗi bước liên tiếp bị lọc: nếu trong chuỗi có bước mang biểu thức thì thay cả chuỗi
 *   bằng MỘT bước trung tính (neutralStep); chuỗi chỉ gồm lời văn thì bỏ hẳn.
 * - intro/reminder lộ giá trị: thay bằng câu mặc định.
 * - Không còn bước nào: vẫn giữ thẻ công thức, kèm câu hướng dẫn xem ví dụ.
 * `sourceTexts`: đề bài (+ câu hỏi trước nếu là câu nối tiếp); `formulaTexts`: latex + explanation
 * của công thức đã chọn; `formulaNames`: tên công thức cho bước trung tính. Hệ số hợp lệ của một
 * bước được giữ (không bị lọc) thì dùng được ở các bước sau.
 */
export function applyNumberGuard(answer, { sourceTexts, formulaTexts, formulaNames = [], mask = false }) {
  const allowed = allowedNumbers(sourceTexts, formulaTexts);
  const question = sourceTexts[0] || "";
  const symbolicElip = formulaTexts.some(t => t.includes("\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1"));
  // Cặp "ký hiệu = số" đã khai báo ở các bước TRƯỚC bước đang xét (ngoại lệ hẹp isRestatedDatum).
  let declared = new Set();
  const leakedIn = (...texts) => {
    const leaks = [], accepted = [];
    for (const t of texts) {
      const r = textLeaks(t, new Set([...allowed, ...accepted]), question, { declared, symbolicElip });
      leaks.push(...r.leaks);
      accepted.push(...r.accepted);
    }
    return { leaks: [...new Set(leaks)], accepted };
  };

  const removedSteps = [];
  const steps = [];
  let run = []; // chuỗi bước bị lọc liên tiếp đang gom
  // Vế trái của biểu thức "V = ...", "S = ..." (đại lượng được tính); "" nếu không có dấu =.
  const quantityOf = (expr) => (/=/.test(expr || "") ? compact(normalizeMath(expr).split("=")[0]) : "");
  const flushRun = () => {
    if (run.some((st) => st.expression)) {
      // Bước giữ lại ngay trước đã thay số cho CÙNG đại lượng (V = \frac{1}{3} a^2 \cdot a\sqrt{2}, rồi
      // bước bị lọc rút gọn V) → bước trung tính "Thay số vào công thức" chỉ lặp lại, bỏ đi.
      const prev = steps[steps.length - 1];
      const filteredQuantity = quantityOf(run.find((st) => st.expression).expression);
      const repeatsPrevious = prev && !prev.neutral && filteredQuantity && quantityOf(prev.expression) === filteredQuantity;
      if (!repeatsPrevious) steps.push(neutralStep(formulaNames));
    }
    run = [];
  };
  const maskedSteps = [];
  // mask: thay giá trị lộ bằng "?" (maskTextLeaks / maskMathLeaks); chỉ khi không thay sạch được
  // mới bỏ bước như cũ. Số "có sẵn" lúc thay = số có sẵn + hệ số hợp lệ của các bước trước.
  // Một bảng ký hiệu cho cả câu trả lời: nghiệm 1 bị lộ ở bước 3 và bước 4 đều thành cùng x_k.
  const symbolFor = makeRootSymbols(answer.steps.flatMap((st) => [st.detail, st.expression]), question);
  const tryMask = (st) => {
    const allowedNow = new Set(allowed);
    const detail = maskTextLeaks(st.detail, allowedNow, question, symbolFor, { declared, symbolicElip });
    const expression = st.expression ? maskMathLeaks(st.expression, allowedNow, question, symbolFor, { declared, symbolicElip }) : "";
    if (detail === null || expression === null) return null;
    const recheck = leakedIn(detail, expression ? `$${expression}$` : "");
    return recheck.leaks.length ? null : { step: { ...st, detail, expression }, accepted: recheck.accepted };
  };
  answer.steps.forEach((st, idx) => {
    declared = new Set(answer.steps.slice(0, idx).flatMap((prev) => [...declaredPairs(prev.detail), ...declaredPairs(prev.expression)]));
    const { leaks, accepted } = leakedIn(st.detail, st.expression ? `$${st.expression}$` : "");
    const masked = leaks.length && mask ? tryMask(st) : null;
    if (masked) {
      flushRun();
      maskedSteps.push({ ...st, leaked: leaks });
      steps.push(masked.step);
      for (const n of masked.accepted) allowed.add(n);
    } else if (leaks.length) {
      removedSteps.push({ ...st, leaked: leaks });
      run.push(st);
    } else {
      flushRun();
      steps.push(st);
      for (const n of accepted) allowed.add(n);
    }
  });
  declared = new Set(); // intro / reminder: không áp ngoại lệ
  flushRun();

  const replaced = [];
  let { intro, reminder } = answer;
  const maskedOr = (text) => (mask ? maskTextLeaks(text, new Set(allowed), question, symbolFor) : null);
  if (leakedIn(intro).leaks.length) {
    replaced.push("intro");
    intro = maskedOr(intro) ?? (answer.type === "no_formula" ? DEFAULT_TEXT.noFormulaIntro : DEFAULT_TEXT.intro);
  }
  if (leakedIn(reminder).leaks.length) {
    replaced.push("reminder");
    reminder = maskedOr(reminder) ?? (answer.type === "solution" ? DEFAULT_TEXT.reminder : "");
  }

  if (answer.type === "solution" && answer.steps.length > 0 && steps.length === 0) {
    intro = DEFAULT_TEXT.allStepsRemoved;
  }
  return { answer: { ...answer, intro, reminder, steps }, removedSteps, maskedSteps, replaced };
}

// ─── 4. Kiểm tra ngoặc trong biểu thức ─────────────────────────────────────
/** true nếu {} cân bằng và số \left bằng số \right (bỏ qua \{ \} là ngoặc nhọn hiển thị). */
export function hasBalancedBraces(latex) {
  const s = String(latex || "").replace(/\\[{}]/g, "");
  let depth = 0;
  for (const c of s) {
    if (c === "{") depth++;
    else if (c === "}" && --depth < 0) return false;
  }
  const lefts = (s.match(/\\left\b/g) || []).length;
  const rights = (s.match(/\\right\b/g) || []).length;
  return depth === 0 && lefts === rights;
}

/** Bỏ biểu thức lệch ngoặc (giữ phần mô tả của bước). Trả về số biểu thức đã bỏ. */
export function dropBrokenExpressions(answer) {
  let dropped = 0;
  const steps = answer.steps.map((st) => {
    if (st.expression && !hasBalancedBraces(st.expression)) { dropped++; return { ...st, expression: "" }; }
    return st;
  });
  return { answer: { ...answer, steps: steps.filter((st) => st.detail || st.expression) }, dropped };
}

// ─── 5. Bản văn bản (markdown) của câu trả lời ─────────────────────────────
/**
 * Dùng cho: lịch sử hội thoại gửi lại model, client PWA cũ còn cache (chỉ đọc `reply`), và
 * hiển thị dự phòng. Không có mục kết quả.
 */
export function toReplyText(answer, getFormula) {
  const lines = [];
  if (answer.intro) lines.push(answer.intro);
  const names = answer.formulaIds.map((id) => getFormula(id)?.name).filter(Boolean);
  if (names.length) lines.push(`**Công thức sử dụng:** ${names.join("; ")}`);
  answer.steps.forEach((st, i) => {
    lines.push(`**Bước ${i + 1}${st.title ? ` — ${st.title}` : ""}:** ${st.detail}`);
    if (st.expression) lines.push(`$$${st.expression}$$`);
  });
  if (answer.reminder) lines.push(answer.reminder);
  return lines.join("\n");
}
