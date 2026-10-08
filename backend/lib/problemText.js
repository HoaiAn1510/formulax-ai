// Chuẩn hoá ký hiệu và chữ viết tắt của học sinh TRƯỚC bước chọn công thức ứng viên
// (formulaCatalog.shortlistFormulas). Chỉ dùng để so khớp từ khoá — đề gửi cho AI vẫn giữ NGUYÊN VĂN.
//
// Vì sao cần (lỗi thật 2026-10-08, iPhone): "…bán kính đường tròn ngoại tiếp của △ có 3 cạnh…" trả
// no_formula, viết "tam giác" thì được. Bộ chọn công thức so khớp từ khoá đã bỏ dấu, chỉ giữ a–z/0–9:
// "△" biến mất, mất luôn cụm "tam giác" — cụm đẩy định lý côsin và diện tích theo sin góc xen giữa
// vào 10 ứng viên. Thiếu 2 công thức đó AI không tìm được sin A để tính R = a/(2 sin A).

// Ký hiệu → chữ. LaTeX (\triangle, \perp...) cũng có vì đề chép từ ảnh (Gemini) viết dạng LaTeX.
const SYMBOLS = [
  // "ΔABC", "∆ABC", "\Delta ABC" (Δ đi liền 3 chữ in hoa) = tam giác ABC. Δ đứng riêng là biệt thức → giữ.
  [/(?:Δ|∆|\\Delta(?![A-Za-z]))\s*([A-Z]{3})(?![A-Za-z])/g, " tam giác $1"],
  [/△|▵|\\triangle(?![A-Za-z])|\\vartriangle(?![A-Za-z])/g, " tam giác "],
  // Góc: ∠A, \angle A, \widehat{BAC}, \hat{A}.
  [/\\widehat\s*\{\s*([^{}]*)\}/g, " góc $1 "],
  [/\\hat\s*\{\s*([^{}]*)\}/g, " góc $1 "],
  [/∠|\\angle(?![A-Za-z])/g, " góc "],
  [/⊥|\\perp(?![A-Za-z])/g, " vuông góc "],
  [/∥|\/\/|\\parallel(?![A-Za-z])/g, " song song "],
];

// Viết tắt → từ đầy đủ. Dài trước ngắn ("ptđt" trước "pt", "đths" trước "đt"). Chỉ thay khi là TỪ
// ĐỨNG RIÊNG — không thay "pt" trong "ptđt" đã xử lý, hay trong một từ khác.
const ABBREVIATIONS = [
  ["ptđt", "phương trình đường thẳng"],
  ["ptb2", "phương trình bậc hai"],
  ["đtròn", "đường tròn"],
  ["tgv", "tam giác vuông"],
  ["hcn", "hình chữ nhật"],
  ["hbh", "hình bình hành"],
  ["csc", "cấp số cộng"],
  ["csn", "cấp số nhân"],
  ["đk", "điều kiện"],
  ["mp", "mặt phẳng"],
  ["đths", "đồ thị hàm số"],
  ["bpt", "bất phương trình"],
  ["hpt", "hệ phương trình"],
  ["pt", "phương trình"],
  ["hs", "hàm số"],
  ["đt", "đường thẳng"],
  ["tđ", "tọa độ"],
  ["vt", "vectơ"],
];
const WORD = (abbr) => new RegExp(`(?<![\\p{L}\\p{N}_])${abbr}(?![\\p{L}\\p{N}_])`, "giu");
const ABBR_RULES = ABBREVIATIONS.map(([abbr, full]) => [WORD(abbr), full]);
// "tg" = tam giác, NHƯNG sách cũ viết tang là "tg" ("tg x", "tg(2x)") — chỉ đổi khi theo sau là tên
// hình 2–3 chữ in hoa ("tg ABC") hoặc chữ mô tả tam giác ("tg vuông", "tg có ba cạnh").
const TG_TRIANGLE = /(?<![\p{L}\p{N}_])tg(?=\s*[A-Z]{2,3}(?![\p{L}])|\s+(?:vuông|cân|đều|nhọn|tù|có|đồng dạng|bằng nhau)(?![\p{L}]))/giu;

/**
 * Đề đã chuẩn hoá ký hiệu + viết tắt (chỉ để chọn công thức). Chuẩn hoá Unicode về NFC trước để
 * "đ" gõ kiểu tổ hợp (d + dấu) vẫn khớp "đt", "tđ".
 */
export function expandShorthand(text) {
  let out = String(text ?? "").normalize("NFC");
  for (const [re, rep] of SYMBOLS) out = out.replace(re, rep);
  out = out.replace(TG_TRIANGLE, "tam giác ");
  for (const [re, full] of ABBR_RULES) out = out.replace(re, full);
  return out.replace(/[ \t]{2,}/g, " ").trim();
}
