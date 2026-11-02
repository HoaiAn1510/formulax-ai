import { createContext } from "react";

// Dữ liệu cho bong bóng "mẹo nhớ" khi bấm Mimi (MimiMascot.jsx). App.jsx cung cấp khi đã tải formulas.js:
//   pickTip(): một công thức có `mnemonic` — ưu tiên đúng lớp học sinh và chủ đề đang yếu; null nếu chưa có dữ liệu.
//   openFormula(formula): mở khung chi tiết công thức.
// Mẹo lấy NGUYÊN VĂN trường `mnemonic` của formulas.js (không do AI viết) — giữ nguyên tắc chống bịa của dự án.
// Không có provider (vd trang đăng nhập) thì Mimi chỉ đổi biểu cảm, không hiện mẹo.
export const MimiContext = createContext(null);

/**
 * Chọn ngẫu nhiên một công thức có mẹo nhớ, có trọng số: đúng lớp ×3, chủ đề yếu ×3 (nhân với nhau), còn lại ×1.
 * Hàm thuần — `random` truyền vào để test.
 */
export function pickMnemonicFormula(formulas, { grade = null, weakTopics = [], excludeId = null } = {}, random = Math.random) {
  const pool = (formulas || []).filter((f) => f?.mnemonic?.trim() && f.id !== excludeId);
  if (!pool.length) return null;
  const weak = new Set(weakTopics || []);
  const weights = pool.map((f) => (grade && f.grade === grade ? 3 : 1) * (weak.has(f.topic) ? 3 : 1));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}
