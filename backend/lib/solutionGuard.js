// Kiểm tra câu trả lời của AI Finder trước khi gửi cho học sinh. Không tin model: dù prompt cấm,
// khi chấm thử vẫn có câu lời giải lỡ tính ra số trung gian (gpt-oss-20b: 5/12 câu, gpt-oss-120b:
// 2/12 và 1/8 ở nhóm bài dạng n − 1), thỉnh thoảng viết LaTeX sai escape trong JSON hoặc thiếu
// dấu ngoặc.

export const ANSWER_TYPES = ["solution", "no_formula", "refuse_answer", "off_topic"];

const LIMITS = { steps: 6, formulaIds: 3, title: 80, detail: 600, expression: 400, intro: 300, reminder: 200 };

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

// expression phải là LaTeX thuần — bỏ $ bao ngoài nếu model lỡ thêm.
const cleanExpression = (v) => str(v, LIMITS.expression).replace(/^\$+|\$+$/g, "").trim();

/**
 * Đưa đối tượng model trả về về đúng khung, bỏ mọi trường lạ (kể cả nếu model tự thêm "result").
 * `isValidId` kiểm tra id có thật trong thư viện; id không có thật bị loại.
 */
export function normalizeAnswer(value, isValidId) {
  const obj = value && typeof value === "object" ? value : {};
  const rawIds = Array.isArray(obj.formula_ids) ? obj.formula_ids : [];
  const formulaIds = [...new Set(rawIds.filter((id) => typeof id === "string" && isValidId(id)))].slice(0, LIMITS.formulaIds);
  const droppedIds = rawIds.filter((id) => !formulaIds.includes(id));

  const steps = (Array.isArray(obj.steps) ? obj.steps : [])
    .filter((st) => st && typeof st === "object")
    .map((st) => ({ title: str(st.title, LIMITS.title), detail: str(st.detail, LIMITS.detail), expression: cleanExpression(st.expression) }))
    .filter((st) => st.detail || st.expression)
    .slice(0, LIMITS.steps);

  let type = ANSWER_TYPES.includes(obj.type) ? obj.type : steps.length ? "solution" : "no_formula";
  let intro = str(obj.intro, LIMITS.intro);
  let reminder = str(obj.reminder, LIMITS.reminder);

  // Lời giải mà không còn công thức hợp lệ nào = không dựa trên thư viện → không được hiển thị.
  if (type === "solution" && formulaIds.length === 0) {
    type = "no_formula";
    intro = DEFAULT_TEXT.noFormulaIntro;
    reminder = "";
  }
  const answer = {
    type,
    formulaIds: type === "solution" ? formulaIds : [],
    intro: intro || (type === "no_formula" ? DEFAULT_TEXT.noFormulaIntro : type === "solution" ? DEFAULT_TEXT.intro : ""),
    steps: type === "solution" ? steps : [],
    // no_formula chỉ giữ intro: khi thử nghiệm, reminder của loại này hay gợi ý "tra cứu công
    // thức X trong sách" — tức là trỏ tới công thức/tài liệu ngoài thư viện.
    reminder: type === "no_formula" ? "" : reminder || (type === "solution" ? DEFAULT_TEXT.reminder : ""),
  };
  return { answer, droppedIds };
}

// ─── 3. Chặn tự tính (số lạ) ───────────────────────────────────────────────
/**
 * Lấy các con số trong một đoạn văn bản/LaTeX, BỎ QUA những chỗ số không phải giá trị tính ra:
 * chỉ số dưới (x_{1,2}, u_{20}, u_1), số mũ của đơn vị (cm^3, m^2, \text{cm}^3, cm²), số thứ tự
 * bước ("bước 2").
 */
export function extractNumbers(text) {
  const cleaned = String(text || "")
    .replace(/\{,\}/g, ",") // 3{,}14 → 3,14
    .replace(/_\{[^{}]*\}/g, " ")
    .replace(/_\d+/g, " ")
    // Đơn vị diện tích/thể tích: cm^3, cm^{2}, \text{ cm}^3, và cả "cm$^2$" ($ chen giữa).
    .replace(/(?:\\(?:text|mathrm)\{\s*)?(?:k|c|d|m)?m\s*\}?\s*\$?\s*\^\s*\{?\s*[23]\s*\}?/g, " ")
    .replace(/[²³]/g, " ")
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

/**
 * Loại phần có số không có trong đề/công thức — dấu hiệu model đã tự tính.
 * - Một chuỗi bước liên tiếp chứa số lạ: nếu trong chuỗi có bước mang biểu thức thì thay cả
 *   chuỗi bằng MỘT bước trung tính (neutralStep); chuỗi chỉ gồm lời văn thì bỏ hẳn.
 * - intro/reminder chứa số lạ: thay bằng câu mặc định.
 * - Không còn bước nào: vẫn giữ thẻ công thức, kèm câu hướng dẫn xem ví dụ.
 * `sourceTexts`: đề bài + các câu hỏi gần đây; `formulaTexts`: latex + explanation của công thức
 * đã chọn; `formulaNames`: tên công thức cho bước trung tính. 0 và 1 luôn được phép (hệ số ngầm,
 * như a = 1 trong x^2 - 5x + 6).
 */
export function applyNumberGuard(answer, { sourceTexts, formulaTexts, formulaNames = [] }) {
  const allowed = new Set(["0", "1", ...sourceTexts.flatMap(extractNumbers), ...formulaTexts.flatMap(extractNumbers)]);
  const leakedIn = (...texts) => [...new Set(texts.flatMap(extractNumbers).filter((n) => !allowed.has(n)))];

  const removedSteps = [];
  const steps = [];
  let run = []; // chuỗi bước bị lọc liên tiếp đang gom
  const flushRun = () => {
    if (run.some((st) => st.expression)) steps.push(neutralStep(formulaNames));
    run = [];
  };
  for (const st of answer.steps) {
    const leaked = leakedIn(st.detail, st.expression);
    if (leaked.length) {
      removedSteps.push({ ...st, leaked });
      run.push(st);
    } else {
      flushRun();
      steps.push(st);
    }
  }
  flushRun();

  const replaced = [];
  let { intro, reminder } = answer;
  if (leakedIn(intro).length) { replaced.push("intro"); intro = answer.type === "no_formula" ? DEFAULT_TEXT.noFormulaIntro : DEFAULT_TEXT.intro; }
  if (leakedIn(reminder).length) { replaced.push("reminder"); reminder = answer.type === "solution" ? DEFAULT_TEXT.reminder : ""; }

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
