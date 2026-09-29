// Nguồn công thức DUY NHẤT cho AI Finder: import thẳng dữ liệu của frontend thay vì chép tay một
// danh sách riêng ở backend. Danh sách chép tay trước đây chỉ có 67/246 công thức, lệch lớp/chủ
// đề với thư viện và còn chứa id không tồn tại (kể cả Số phức — ngoài chương trình GDPT 2018).
//
// Vì vậy formulas.js KHÔNG được import bất kỳ thứ gì (ảnh, component, thư viện frontend): Node
// chạy file này trực tiếp, không qua Vite. Nếu môi trường deploy không có thư mục FormulaX-AI,
// dòng import dưới đây làm backend dừng ngay khi khởi động — lỗi rõ ràng, không chạy âm thầm
// với danh sách rỗng.
import { formulas } from "../../FormulaX-AI/src/data/formulas.js";

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

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
}

function firstLine(text) {
  return String(text || "").split("\n")[0];
}

const SEARCH_INDEX = formulas.map((f) => ({
  formula: f,
  text: ` ${normalize([f.name, f.topic, ...(f.tags || []), firstLine(f.example), firstLine(f.explanation)].join(" "))} `,
}));

/**
 * Trả về tối đa `limit` công thức liên quan nhất tới các đoạn văn bản (câu hỏi hiện tại + vài
 * câu hỏi trước để hiểu câu hỏi nối tiếp). Công thức không khớp từ nào thì không được chọn.
 */
export function shortlistFormulas(texts, limit = 15) {
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
      return { formula, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.formula);
}
