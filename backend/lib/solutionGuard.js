// Kiểm tra câu trả lời của AI Finder trước khi gửi cho học sinh. Không tin model: dù prompt cấm,
// khi chấm thử vẫn có câu lời giải lỡ tính ra số trung gian (gpt-oss-20b: 5/12 câu, gpt-oss-120b:
// 2/12 và 1/8 ở nhóm bài dạng n − 1), thỉnh thoảng viết LaTeX sai escape trong JSON hoặc thiếu
// dấu ngoặc.

export const ANSWER_TYPES = ["solution", "no_formula", "refuse_answer", "off_topic"];

// formulaIds 4: bài theo phương pháp (cực trị...) dùng tới 3–4 công thức — điều kiện cực trị,
// đạo hàm, quy tắc tổng hiệu, công thức nghiệm.
const LIMITS = { steps: 6, formulaIds: 4, title: 80, detail: 600, expression: 400, intro: 300, reminder: 200, aiNote: 150 };

export const DEFAULT_TEXT = {
  noFormulaIntro: "Thư viện FormulaX chưa có công thức cho dạng bài này, nên mình chưa hướng dẫn được bạn nhé.",
  intro: "Mình gợi ý công thức và các bước để bạn tự giải nhé.",
  reminder: "Phần tính toán bạn tự làm nhé — làm xong nhớ kiểm tra lại đơn vị!",
  allStepsRemoved: "Mình đã chọn công thức cho bạn nhưng chưa trình bày được các bước chắc chắn đúng — bạn xem phần ví dụ trong thẻ công thức nhé.",
  unavailable: "Mình chưa soạn được hướng dẫn cho câu này, bạn thử diễn đạt lại câu hỏi nhé.",
};

// ─── 1. Sửa escape LaTeX trong JSON thô ─────────────────────────────────────
// Model hay viết "\frac" thay vì "\\frac" trong chuỗi JSON. JSON.parse khi đó hoặc ném lỗi
// (\c, \s... không phải escape hợp lệ) hoặc TỆ HƠN là âm thầm đổi nghĩa: \f → ký tự form-feed
// ("\frac" thành "rac"), \t → tab ("\times"), \n → xuống dòng ("\neq"), \b → backspace ("\beta").
//
// Quy tắc: chỉ nhân đôi dấu \ CHƯA được escape (không đứng sau một dấu \ khác). Một \ được
// giữ nguyên khi nó là escape JSON hợp lệ: \\ \" \/ \uXXXX, hoặc \b \f \n \r \t KHÔNG theo sau
// bởi chữ cái (theo sau bởi chữ cái thì đó là lệnh LaTeX như \frac, \neq, \times, \beta).
export function repairLatexEscapes(raw) {
  const s = String(raw ?? "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
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
const fixOverEscaped = (s) => s.replace(/\\\\(?=[A-Za-z])/g, "\\");
const str = (v, max) => (typeof v === "string" ? fixOverEscaped(v.trim()).slice(0, max) : "");

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
export const wrapLooseLatex = (s) => mapProse(s, (prose) => prose.replace(LOOSE_COMMAND, (cmd) => `$${cmd.trim()}$`));

// Id công thức model chép vào lời giải ("quy tắc đạo hàm của tổng (gt11-daoham-tonghieu)"). Id có
// thật thì: nằm trong ngoặc ngay sau chính tên công thức → bỏ; còn lại → thay bằng tên công thức.
// Id không có thật giữ nguyên (không đoán).
const FORMULA_ID = /[a-z]{2,3}\d{2}-[a-z0-9-]*[a-z0-9]/gi;
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

const cleanText = (s, isValidId, nameOf) => replaceFormulaIds(fixBareDeltaInText(wrapLooseLatex(fixStrayQuoteEscapes(s))), isValidId, nameOf);

// expression phải là LaTeX thuần — bỏ $ bao ngoài nếu model lỡ thêm.
const cleanExpression = (v) => fixBareDeltaInMath(fixStrayQuoteEscapes(str(v, LIMITS.expression).replace(/^\$+|\$+$/g, "").trim()));

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
  if (type === "solution" && formulaIds.length === 0) {
    type = "no_formula";
    reminder = "";
  }
  // no_formula: học sinh chỉ thấy câu mặc định. Lời giải thích của model thường nêu tên phương
  // pháp/công thức còn thiếu ("cần tích phân từng phần") — tức là trỏ ra ngoài thư viện — nên chỉ
  // giữ lại trong aiNote để ghi log cho nhóm biết thư viện đang thiếu gì.
  const aiNote = type === "no_formula" ? intro.slice(0, LIMITS.aiNote) : "";
  if (type === "no_formula") intro = DEFAULT_TEXT.noFormulaIntro;
  const answer = {
    type,
    formulaIds: type === "solution" ? formulaIds : [],
    intro: intro || (type === "solution" ? DEFAULT_TEXT.intro : ""),
    steps: type === "solution" ? steps : [],
    // no_formula chỉ giữ intro: khi thử nghiệm, reminder của loại này hay gợi ý "tra cứu công
    // thức X trong sách" — tức là trỏ tới công thức/tài liệu ngoài thư viện.
    reminder: type === "no_formula" ? "" : reminder || (type === "solution" ? DEFAULT_TEXT.reminder : ""),
  };
  return { answer, droppedIds, aiNote };
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
    // toạ độ / khoảng — đọc thành 1.2, 1.1 sẽ thành "số lạ" và lọc oan.
    .replace(/(^|[^\d.])0,(\d)/g, "$10.$2")
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
  const label = names.length && names.every((n) => !/\d/.test(n)) ? `công thức ${names.join(", ")}` : "công thức";
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
    .replace(/\\text\{\s*(?:hoặc|hay|và|or|and)\s*\}/gi, ";")
    .replace(/\\(?:Rightarrow|Leftrightarrow|Longrightarrow|Leftarrow|iff|implies|vee|wedge)(?![a-zA-Z])/g, ";");
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
  // Dấu phẩy thập phân chỉ khi phần nguyên là 0 (0,06) — (1,2,3) là toạ độ.
  return [...masked.matchAll(/(?<![\d.])0,\d+|\d+(?:\.\d+)?/g)].map((m) => ({ text: m[0].replace(",", ".").replace(/^0+(?=\d)/, ""), index: m.index, end: m.index + m[0].length }));
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
export function mathLeaks(latex, allowed, questionText = "") {
  const leaks = [], accepted = [];
  const known = (n) => allowed.has(n) || accepted.includes(n);
  const q = compact(normalizeMath(questionText));
  const isClauseSep = (s, i) => (s[i] === ";" || (s[i] === "," && !(/\d/.test(s[i - 1] ?? "") && /\d/.test(s[i + 1] ?? ""))) ? 1 : 0);
  const clauses = splitTopLevel(normalizeMath(latex), isClauseSep).filter((p, i) => i % 2 === 0);
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
  return { leaks: [...new Set(leaks)], accepted: [...new Set(accepted)] };
}

/** Lộ giá trị số trong một đoạn văn có xen toán $...$: phần chữ xét như cũ, phần $...$ xét như biểu thức. */
function textLeaks(text, allowed, questionText) {
  const s = String(text || "");
  const maths = [...s.matchAll(/\$\$?([^$]+)\$\$?/g)].map((m) => m[1]);
  const prose = s.replace(/\$\$?[^$]+\$\$?/g, " ");
  const leaks = extractNumbers(prose).filter((n) => !allowed.has(n));
  // Nghiệm / Δ viết thẳng trong câu chữ, không có $: "Khi x = -1 thì...", "Δ = 1 > 0".
  const q = compact(normalizeMath(questionText));
  for (const m of prose.matchAll(/(?<![A-Za-z])((?:[xt](?:_\{?[1-9][0-9,]*\}?)?)|Δ|\\Delta)\s*=\s*([+-]?\d+(?:[.,]\d+)?)(?![\d.]*\s*[a-zA-Z(^*·])/g)) {
    const given = q.includes(compact(`${m[1]}=${m[2]}`)) || (/^[xt]$/.test(m[1]) && givenXValues(questionText).includes(m[2].replace(",", ".")));
    if (!given) leaks.push(compact(m[0]));
  }
  const accepted = [];
  for (const m of maths) {
    const r = mathLeaks(m, new Set([...allowed, ...accepted]), questionText);
    leaks.push(...r.leaks);
    accepted.push(...r.accepted);
  }
  return { leaks: [...new Set(leaks)], accepted };
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
export function applyNumberGuard(answer, { sourceTexts, formulaTexts, formulaNames = [] }) {
  const allowed = allowedNumbers(sourceTexts, formulaTexts);
  const question = sourceTexts[0] || "";
  const leakedIn = (...texts) => {
    const leaks = [], accepted = [];
    for (const t of texts) {
      const r = textLeaks(t, new Set([...allowed, ...accepted]), question);
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
  for (const st of answer.steps) {
    const { leaks, accepted } = leakedIn(st.detail, st.expression ? `$${st.expression}$` : "");
    if (leaks.length) {
      removedSteps.push({ ...st, leaked: leaks });
      run.push(st);
    } else {
      flushRun();
      steps.push(st);
      for (const n of accepted) allowed.add(n);
    }
  }
  flushRun();

  const replaced = [];
  let { intro, reminder } = answer;
  if (leakedIn(intro).leaks.length) { replaced.push("intro"); intro = answer.type === "no_formula" ? DEFAULT_TEXT.noFormulaIntro : DEFAULT_TEXT.intro; }
  if (leakedIn(reminder).leaks.length) { replaced.push("reminder"); reminder = answer.type === "solution" ? DEFAULT_TEXT.reminder : ""; }

  if (answer.type === "solution" && answer.steps.length > 0 && steps.length === 0) {
    intro = DEFAULT_TEXT.allStepsRemoved;
  }
  return { answer: { ...answer, intro, reminder, steps }, removedSteps, replaced };
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
