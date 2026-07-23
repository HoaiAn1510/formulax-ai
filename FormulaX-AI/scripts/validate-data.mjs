/**
 * Kiểm tra tính toàn vẹn của formulas.js và questions.js.
 *
 * Hai file này là USP của sản phẩm ("công thức khoá cứng trong database, không để AI tự
 * sinh") nhưng trước đây không có gì canh: một id trùng, một blankAnswer lệch với đáp án, hay
 * một dấu $ thiếu là người dùng nhìn thấy nội dung sai — đúng thứ sản phẩm cam kết không mắc.
 *
 * Script cố ý KHÔNG sửa dữ liệu, chỉ báo cáo. Sửa dữ liệu lõi phải là quyết định của người,
 * từng trường hợp một.
 *
 * Chạy: npm run test:data     (mã thoát 1 nếu có LỖI, cảnh báo không làm fail)
 */
import { formulas } from "../src/data/formulas.js";
import { questionsPool } from "../src/data/questions.js";

const TOPICS = ["Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất & Thống kê", "Mở rộng"];
const GRADES = [10, 11, 12];
const DIFFICULTIES = ["Dễ", "Trung bình", "Khó"];

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/** Đếm dấu $ không bị escape. Lẻ = có công thức chưa đóng, KaTeX sẽ render ra chuỗi thô. */
function unbalancedDollars(text) {
  if (typeof text !== "string") return false;
  const stripped = text.replace(/\$\$/g, "").replace(/\\\$/g, "");
  return (stripped.match(/\$/g) || []).length % 2 !== 0;
}

/** Ngoặc nhọn lệch trong LaTeX — \frac{a}{b thiếu ngoặc là KaTeX bỏ nguyên biểu thức. */
function unbalancedBraces(text) {
  if (typeof text !== "string") return false;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\") { i++; continue; } // bỏ qua ký tự được escape: \{ \}
    if (text[i] === "{") depth++;
    else if (text[i] === "}") depth--;
    if (depth < 0) return true;
  }
  return depth !== 0;
}

// ─── formulas.js ─────────────────────────────────────────────────────────────
console.log(`\nformulas.js — ${formulas.length} công thức`);

const REQUIRED_FORMULA = ["id", "name", "topic", "grade", "latex", "explanation", "example", "tags", "difficulty", "mnemonic"];
const seenFormulaIds = new Map();

formulas.forEach((f, i) => {
  const at = `formulas[${i}] ${f?.id || "(thiếu id)"}`;

  for (const field of REQUIRED_FORMULA) {
    const v = f?.[field];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
      err(at, `thiếu trường bắt buộc "${field}"`);
    }
  }

  if (f?.id) {
    if (seenFormulaIds.has(f.id)) err(at, `id trùng với formulas[${seenFormulaIds.get(f.id)}]`);
    else seenFormulaIds.set(f.id, i);
    // CẢNH BÁO thôi, đừng đổi id để "cho đẹp": id được lưu trong Supabase ở bookmarks.formula_id,
    // flashcard_progress.formula_id, flashcard_decks.formulaIds... Đổi id là mất bookmark và
    // tiến độ học của người dùng thật. Chỉ sửa khi thêm công thức mới.
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.id)) warn(at, `id không đúng kebab-case: "${f.id}" (KHÔNG đổi id cũ — xem ghi chú trong script)`);
  }

  if (f?.topic && !TOPICS.includes(f.topic)) err(at, `topic không hợp lệ: "${f.topic}"`);
  if (f?.grade !== undefined && !GRADES.includes(f.grade)) err(at, `grade không hợp lệ: ${f.grade}`);
  if (f?.difficulty && !DIFFICULTIES.includes(f.difficulty)) err(at, `difficulty không hợp lệ: "${f.difficulty}"`);
  if (f?.tags && !Array.isArray(f.tags)) err(at, "tags phải là mảng");

  // CLAUDE.md: sgk_source đang bổ sung dần, luôn điền khi tạo mới -> thiếu là cảnh báo
  if (!f?.sgk_source) warn(at, "thiếu sgk_source");

  if (unbalancedBraces(f?.latex)) err(at, "latex lệch ngoặc nhọn { }");
  for (const field of ["explanation", "example"]) {
    if (unbalancedDollars(f?.[field])) err(at, `${field} có số dấu $ lẻ (công thức chưa đóng)`);
  }

  // Quy ước parseExplanationToTable trong FormulaDetailModal: chỉ dòng bắt đầu "- " mới thành
  // hàng bảng "Ký hiệu | Ý nghĩa". Dòng bắt đầu "* " trông giống bullet nhưng parser bỏ qua.
  if (typeof f?.explanation === "string") {
    f.explanation.split("\n").forEach((line) => {
      if (/^\s*\*\s+\S/.test(line) && !/^\s*\*\*/.test(line)) {
        warn(at, `explanation dùng "* " làm bullet, parser chỉ nhận "- ": "${line.trim().slice(0, 45)}…"`);
      }
    });
  }
});

// ─── questions.js ────────────────────────────────────────────────────────────
console.log(`questions.js — ${questionsPool.length} câu hỏi`);

const seenQuestionIds = new Map();

questionsPool.forEach((q, i) => {
  const at = `questions[${i}] ${q?.id || "(thiếu id)"}`;

  for (const field of ["id", "topic", "grade", "text", "options", "explanation"]) {
    const v = q?.[field];
    if (v === undefined || v === null || v === "") err(at, `thiếu trường bắt buộc "${field}"`);
  }

  if (q?.id) {
    if (seenQuestionIds.has(q.id)) err(at, `id trùng với questions[${seenQuestionIds.get(q.id)}]`);
    else seenQuestionIds.set(q.id, i);
  }

  if (q?.topic && !TOPICS.includes(q.topic)) err(at, `topic không hợp lệ: "${q.topic}"`);
  if (q?.grade !== undefined && !GRADES.includes(q.grade)) err(at, `grade không hợp lệ: ${q.grade}`);

  if (!Array.isArray(q?.options)) {
    err(at, "options phải là mảng");
    return;
  }
  if (q.options.length !== 4) err(at, `phải có đúng 4 lựa chọn, đang có ${q.options.length}`);

  const letters = q.options.map((o) => o?.letter);
  if (letters.join("") !== "ABCD") err(at, `letter phải là A,B,C,D theo thứ tự — đang là ${letters.join(",")}`);

  const correct = q.options.filter((o) => o?.isCorrect === true);
  if (correct.length !== 1) err(at, `phải có đúng 1 đáp án isCorrect: true, đang có ${correct.length}`);

  q.options.forEach((o, oi) => {
    if (!o?.text) err(at, `lựa chọn ${o?.letter || oi} không có text`);
    if (unbalancedDollars(o?.text)) err(at, `lựa chọn ${o?.letter || oi} có số dấu $ lẻ`);
  });

  // blankAnswer dùng cho chế độ điền đáp án. Quy ước THẬT trong dữ liệu (khác với mô tả cũ ở
  // CLAUDE.md): đây là đáp án người học gõ tay, viết dạng chữ thường cho dễ nhập — "3x^2"
  // trong khi option là "y' = 3x^2", "36pi" trong khi option là "36\pi \text{ cm}^3".
  // Vì vậy KHÔNG so khớp chuỗi với option; chỉ kiểm tra những gì chắc chắn là lỗi.
  if (q?.blankAnswer === undefined || String(q.blankAnswer).trim() === "") {
    warn(at, "thiếu blankAnswer (chế độ điền đáp án sẽ không dùng được câu này)");
  } else {
    const actual = String(q.blankAnswer);
    if (actual.includes("$")) err(at, `blankAnswer không được chứa dấu $ — "${actual.slice(0, 40)}"`);
    // blankAnswer là nội dung đáp án, không phải nhãn lựa chọn. Để "D" thì ở chế độ điền đáp
    // án người học bị bắt gõ đúng chữ "D" — vô nghĩa vì chế độ đó không hiển thị A/B/C/D.
    if (/^[A-D]$/.test(actual.trim())) {
      err(at, `blankAnswer là nhãn lựa chọn "${actual.trim()}" chứ không phải nội dung đáp án`);
    }
    if (actual !== actual.trim()) warn(at, "blankAnswer thừa khoảng trắng đầu/cuối");
    if (/\\[a-zA-Z]+/.test(actual)) {
      warn(at, `blankAnswer chứa lệnh LaTeX ("${actual.slice(0, 30)}") — người học khó gõ đúng`);
    }
  }

  for (const field of ["text", "explanation"]) {
    if (unbalancedDollars(q?.[field])) err(at, `${field} có số dấu $ lẻ`);
  }
});

// ─── Kết quả ─────────────────────────────────────────────────────────────────
const show = (title, list, limit = 25) => {
  if (list.length === 0) return;
  console.log(`\n${title} (${list.length}):`);
  list.slice(0, limit).forEach((m) => console.log(`  • ${m}`));
  if (list.length > limit) console.log(`  … và ${list.length - limit} mục nữa`);
};

show("❌ LỖI — phải sửa", errors);
show("⚠️  CẢNH BÁO — nên xem lại", warnings);

console.log(
  `\n${errors.length === 0 ? "✅" : "❌"} ${errors.length} lỗi, ${warnings.length} cảnh báo\n`
);
process.exit(errors.length > 0 ? 1 : 0);
