// Công thức trang trí (nền trang đăng nhập + nền các trang trong app). CHÉP ĐÚNG từ formulas.js — id ghi bên
// cạnh — chỉ đổi cách viết LaTeX sang ký tự Unicode để vẽ bằng <text> trong SVG. Không import formulas.js ở đây
// (~400 KB, các nơi dùng file này nạp tĩnh). Không tự viết công thức ngoài thư viện (CLAUDE.md: chống hallucination).
export const DECOR_FORMULAS = {
  cosin: "a² = b² + c² − 2bc·cos A", //          hh10-cosin
  circle: "(x − a)² + (y − b)² = R²", //         hh10-duongtron-phuongtrinh
  cone: "V = ⅓ π r² h", //                       hh12-khino-thetich
  log: "y = logₐ x", //                          ds11-hamso-log
  derivative: "(xⁿ)′ = n · xⁿ⁻¹", //             gt12-daoham-basic
  trig: "sin²x + cos²x = 1", //                  lg11-congthuc-coban
  sphere: "V = ⁴⁄₃ π R³", //                     hh12-matcau-thetich
};
