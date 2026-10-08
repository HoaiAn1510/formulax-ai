// Nguồn công thức DUY NHẤT cho AI Finder: import thẳng dữ liệu của frontend thay vì chép tay một
// danh sách riêng ở backend. Danh sách chép tay trước đây chỉ có 67/246 công thức, lệch lớp/chủ
// đề với thư viện và còn chứa id không tồn tại (kể cả Số phức — ngoài chương trình GDPT 2018).
//
// Vì vậy formulas.js KHÔNG được import bất kỳ thứ gì (ảnh, component, thư viện frontend): Node
// chạy file này trực tiếp, không qua Vite. Nếu môi trường deploy không có thư mục FormulaX-AI,
// dòng import dưới đây làm backend dừng ngay khi khởi động — lỗi rõ ràng, không chạy âm thầm
// với danh sách rỗng.
import { formulas } from "../../FormulaX-AI/src/data/formulas.js";
import { expandShorthand } from "./problemText.js";

const byId = new Map(formulas.map((f) => [f.id, f]));

export const FORMULA_COUNT = formulas.length;

export function getFormula(id) {
  return byId.get(id) || null;
}

export function isValidFormulaId(id) {
  return typeof id === "string" && byId.has(id);
}

// ─── Chọn công thức ứng viên cho một câu hỏi ─────────────────────────────────
// Gửi cả 246 công thức kèm LaTeX vào prompt tốn khoảng 10k token — vượt hạn mức 8k token/phút
// của gói Groq miễn phí. Nên chỉ gửi một nhóm ứng viên, chọn bằng so khớp từ khóa (bỏ dấu) với
// tên, chủ đề, tag, dòng đầu của ví dụ và phần giải thích.

// Chỉ hư từ. Không đưa "hàm", "số", "hai", "ba"... vào đây: chúng là nửa của thuật ngữ
// ("nguyên hàm", "cấp số", "bậc hai", "ba cạnh"), bỏ đi là mất cụm từ khóa quan trọng nhất.
const STOP_WORDS = new Set(
  "cho tinh cua va la co cac mot bang voi trong nhung duoc biet hay minh ban nay do khi thi de bai sau".split(" ")
);

// NFKD (không phải NFD): ngoài bỏ dấu tiếng Việt còn đưa chỉ số trên/dưới về chữ thường — học
// sinh hay gõ "x³", "log₂", "eˣ" bằng bàn phím điện thoại.
function normalize(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function tokenize(text) {
  return normalize(text)
    .replace(/([a-z])(\d)/g, "$1 $2") // "log2" → "log 2", để vẫn khớp "logarit"
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
}

// ─── Nhóm công thức theo dạng bài ───────────────────────────────────────────
// So khớp từ khóa chỉ tìm được công thức có tên giống câu hỏi. Bài giải theo PHƯƠNG PHÁP cần cả
// công thức "phụ" không hề được nhắc tới trong đề: tìm cực trị cần công thức đạo hàm, diện tích
// hình phẳng cần nguyên hàm + Newton–Leibniz... Thiếu chúng, AI hoặc báo "thư viện chưa có" hoặc
// tự tính đạo hàm ngoài thư viện. Dạng bài nào khớp thì cả nhóm được ghim lên đầu danh sách ứng
// viên (vẫn tối đa `limit` công thức nên số token gửi đi không tăng).
// Mọi id ở đây phải có trong formulas.js — test/formulaCatalog.test.js kiểm tra.
const DERIVATIVE = ["gt12-daoham-basic", "gt11-daoham-tonghieu"];
const OXYZ = /oxyz|\(\s*-?\d+\s*;\s*-?\d+\s*;\s*-?\d+\s*\)|x.*y.*z.*=/;

// Hàm số bậc hai (trên văn bản đã normalize — "x²" thành "x2"): có x² nhưng không có lũy thừa bậc ≥ 3
// của x, không có hàm mũ/lôgarit/lượng giác. Lớp 10 xét biến thiên, GTLN–GTNN của hàm bậc hai bằng
// đỉnh parabol (SGK Toán 10 KNTT T2, Bài 16) — KHÔNG dùng đạo hàm (lớp 11–12). Trước 2026-10-08 nhóm
// "đồng biến" ghim 3 công thức đạo hàm lên đầu cho mọi đề, kể cả đề lớp 10.
const QUADRATIC = /x\s*(?:\^\s*\{?\s*2|2)(?![\d.])/;
const HIGHER_POWER = /x\s*(?:\^\s*\{?\s*)?(?:[3-9]|\d{2,})/;
const NON_POLYNOMIAL = /\b(?:sin|cos|tan|cot|log|ln)\b|\^\s*\{?\s*-?\s*\d*\s*x/;
const isQuadraticOnly = (t) => QUADRATIC.test(t) && !HIGHER_POWER.test(t) && !NON_POLYNOMIAL.test(t);
// Tam giác không nêu tên (đề "từ 2 vị trí A và B… góc CAB = 60°, góc CBA = 70°"): từ 2 góc trở lên.
const namedAngles = (t) => (t.match(/goc\s+[a-z]{1,3}\b/g) || []).length;
const TRIANGLE_TRIO = ["hh10-cosin", "hh10-dinhly-sin", "hh10-dientich-sinC"];

// Mỗi nhóm: match (regex, bắt buộc), and (regex), unless (regex), when (hàm trên văn bản đã normalize).
export const METHOD_GROUPS = [
  { match: /dong bien|nghich bien|don dieu|bien thien|gtln|gtnn|gia tri lon nhat|gia tri nho nhat|dinh cua|truc doi xung/, when: isQuadraticOnly, ids: ["ds10-hamso-bachai-bienthien", "hh10-parabola", "ds10-ham-so-dongbien-nghichbien"] },
  { match: /giao diem/, and: /truc hoanh|truc tung|\bo[xy]\b/, when: (t) => /parabol/.test(t) || QUADRATIC.test(t), ids: ["ds10-phuongtrinh-bac2", "hh10-parabola"] },
  { match: /goc/, when: (t) => namedAngles(t) >= 2, ids: TRIANGLE_TRIO },
  { match: /cuc tri|cuc dai|cuc tieu/, ids: ["gt12-cuctrituoc", ...DERIVATIVE, "ds10-phuongtrinh-bac2"] },
  { match: /tiep tuyen/, unless: /duong tron/, ids: ["gt11-tieptuyen-phuongtrinh", ...DERIVATIVE] },
  { match: /don dieu|dong bien|nghich bien/, when: (t) => !isQuadraticOnly(t), ids: ["gt12-tinhdondieu-daoham", ...DERIVATIVE, "ds10-phuongtrinh-bac2"] },
  { match: /gtln|gtnn|gia tri lon nhat|gia tri nho nhat/, when: (t) => !isQuadraticOnly(t), ids: ["gt12-gtln-gtnn", ...DERIVATIVE] },
  { match: /dien tich hinh phang/, ids: ["gt12-tichphan-dientich", "gt12-nguyenham-basic", "gt12-tichphan-newtonleibniz"] },
  { match: /tich phan/, ids: ["gt12-tichphan-newtonleibniz", "gt12-nguyenham-basic", "gt12-nguyenham-bangtable", "gt12-tichphan-tinhchat"] },
  { match: /\blog|logarit/, ids: ["gt12-logarit", "gt11-logarit-dinhnghia", "gt11-logarit-quytac-thuong-luythua", "gt12-mu-log-phuongtrinh"] },
  { match: /lai kep|lai suat|gui tiet kiem|gui ngan hang/, ids: ["gt11-laikep", "mr-taichinh-dautu", "gt11-logarit-dinhnghia"] },
  // Phương trình / bất phương trình mũ: có lũy thừa với số mũ chứa x (3^x, 3^(2x), 2^{x+1}).
  { match: /phuong trinh/, and: /\d\s*\^\s*[({]?\s*\d*\s*x/, ids: ["gt12-mu-log-phuongtrinh", "gt11-batptmu-coban", "ds10-bpt-bac2", "ds10-phuongtrinh-bac2"] },
  { match: /phuong trinh/, and: /sin|cos|tan|cot/, ids: ["gt11-ptluonggiac-sincos", "lg11-goc-dacbiet", "ds11-luonggiac-cong", "ds10-phuongtrinh-bac2"] },
  { match: /hinh chop|khoi chop/, ids: ["hh12-thetich-chopsen"] },
  { match: /mat phang/, and: OXYZ, ids: ["hh12-oxyz-matphang", "hh12-oxyz-khoangcach"] },
  { match: /mat cau/, and: OXYZ, ids: ["hh12-oxyz-matcau", "hh12-oxyz-khoangcach"] },
  { match: /xac suat/, ids: ["xs11-xacsuat", "xs10-xacsuat-bienco-doi", "xs11-tohop"] },
  { match: /khai trien|he so cua/, ids: ["ds10-heso-xk-khaitrien-axb", "ds11-nhi-thuc-newton", "xs11-tohop"] },
];
const MAX_PINNED = 10; // chừa chỗ cho công thức khớp từ khóa

/** Công thức thuộc lớp cao hơn lớp của học sinh (grade = lớp đã chọn ở onboarding; null = chưa chọn). */
const aboveGrade = (f, grade) => Boolean(grade) && f.grade > grade;

/**
 * Id các công thức cần ghim cho một đoạn văn bản, theo thứ tự nhóm khớp. Biết lớp học sinh thì KHÔNG
 * ghim công thức lớp cao hơn (học sinh lớp 10 không được dẫn tới đạo hàm) — chúng vẫn có thể vào
 * danh sách qua từ khoá, chỉ không được ưu tiên.
 */
export function methodGroupIds(text, grade = null) {
  const t = normalize(text);
  const ids = [];
  for (const g of METHOD_GROUPS) {
    if (!g.match.test(t) || (g.and && !g.and.test(t)) || (g.unless && g.unless.test(t)) || (g.when && !g.when(t))) continue;
    for (const id of g.ids) {
      if (ids.includes(id)) continue;
      const f = getFormula(id);
      if (f && aboveGrade(f, grade)) continue;
      ids.push(id);
    }
  }
  return ids;
}

function firstLine(text) {
  return String(text || "").split("\n")[0];
}

// Ghi chú ngắn cho prompt: gộp các dòng giải thích ký hiệu thành 1 dòng, tối đa 160 ký tự. Cần
// thiết vì nhiều công thức để phần quan trọng ở đây — ví dụ công thức nghiệm của phương trình
// bậc hai nằm trong explanation của mục "Biệt thức Delta", không nằm trong latex.
function noteForPrompt(f) {
  const lines = String(f.explanation || "")
    .split("\n")
    .map((l) => l.replace(/^\s*-\s*/, "").trim())
    .filter((l) => l && !/^trong đó:?$/i.test(l));
  const note = lines.join("; ").replace(/\s+/g, " ");
  return note.length > 160 ? `${note.slice(0, 157)}...` : note;
}

/**
 * Một dòng thư viện trong prompt: "id | lớp | tên | công thức | ghi chú". Cột lớp để AI ưu tiên công
 * thức trong chương trình lớp của học sinh (quy tắc 1d) — tiền tố id không đáng tin (gt12-daoham-basic
 * là lớp 11).
 */
export function formatForPrompt(f) {
  return `${f.id} | lớp ${f.grade} | ${f.name} | ${f.latex} | ${noteForPrompt(f)}`;
}

const SEARCH_INDEX = formulas.map((f) => ({
  formula: f,
  text: ` ${normalize([f.name, f.topic, ...(f.tags || []), firstLine(f.example), firstLine(f.explanation)].join(" "))} `,
}));

/**
 * Trả về tối đa `limit` công thức liên quan nhất tới các đoạn văn bản (câu hỏi hiện tại ĐỨNG ĐẦU,
 * sau đó vài câu hỏi trước để hiểu câu hỏi nối tiếp). Nhóm công thức theo dạng bài (METHOD_GROUPS)
 * được ghim lên đầu — của câu hiện tại trước, của câu trước sau; phần còn lại xếp theo số từ khóa
 * khớp. Công thức không khớp từ nào và không thuộc nhóm nào thì không được chọn.
 */
// limit 10 (trước là 15): mỗi dòng công thức ~128 token. Chấm 2026-09-30 trên 20 câu: 10 ứng viên
// giảm ~11% token/câu (5.123 → 4.574), no_formula và lộ giá trị số không đổi (2/20, 0).
// grade: lớp học sinh chọn ở onboarding (10/11/12), null = chưa chọn → giữ cách xếp hạng cũ. Biết lớp
// thì công thức lớp cao hơn không được ghim và xếp sau công thức cùng mức liên quan (không loại hẳn —
// học sinh có thể chọn nhầm lớp).
export function shortlistFormulas(rawTexts, limit = 10, { grade = null } = {}) {
  // Ký hiệu/viết tắt của học sinh ("△", "ΔABC", "pt", "tg"...) → chữ đầy đủ, CHỈ để so khớp từ khoá
  // (lib/problemText.js). Đề gửi AI vẫn nguyên văn.
  const texts = rawTexts.filter(Boolean).map(expandShorthand);
  const pinned = [];
  for (const text of texts.filter(Boolean)) for (const id of methodGroupIds(text, grade)) if (!pinned.includes(id)) pinned.push(id);
  const pinnedFormulas = pinned.slice(0, Math.min(MAX_PINNED, limit)).map(getFormula).filter(Boolean);
  const byKeywords = rankByKeywords(texts, grade).filter((f) => !pinnedFormulas.includes(f));
  return [...pinnedFormulas, ...byKeywords].slice(0, limit);
}

// Trừ điểm công thức lớp cao hơn lớp học sinh: nhỏ hơn 1 điểm (một từ khoá khớp) nên chỉ đổi thứ tự
// giữa các công thức CÙNG mức liên quan, không đẩy công thức lớp dưới kém liên quan lên trên.
const ABOVE_GRADE_PENALTY = 0.5;

function rankByKeywords(texts, grade = null) {
  const joined = texts.filter(Boolean).join(" ");
  const ordered = tokenize(joined);
  // "x^2 - 7x + 10 = 0" không có chữ nào để so khớp — với câu hỏi về phương trình thì thêm từ
  // khóa bậc. Không áp cho mọi câu: "nguyên hàm của x^3" không liên quan tới "bậc ba".
  if (/phuong trinh/.test(normalize(joined))) {
    if (/x\s*(\^\s*\{?\s*2|²)/.test(joined)) ordered.push("bac", "hai");
    else if (/x\s*(\^\s*\{?\s*3|³)/.test(joined)) ordered.push("bac", "ba");
  }

  const tokens = [...new Set(ordered)];
  const bigrams = ordered.slice(1).map((t, i) => `${ordered[i]} ${t}`);

  return SEARCH_INDEX
    .map(({ formula, text }) => {
      let score = 0;
      for (const t of tokens) if (text.includes(` ${t}`)) score += 1;
      for (const b of bigrams) if (text.includes(b)) score += 2;
      if (score > 0 && aboveGrade(formula, grade)) score -= ABOVE_GRADE_PENALTY;
      return { formula, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.formula);
}
