// Kiểm tra độ phủ bước chọn công thức ứng viên (formulaCatalog.shortlistFormulas, kèm chuẩn hoá ký
// hiệu/viết tắt) cho các đề lớp 10 của đợt dùng thử: hệ thức lượng trong tam giác, hàm số bậc hai.
// Chạy hoàn toàn OFFLINE — không gọi Groq hay Gemini. Chạy: node backend/scripts/shortlist-coverage.mjs
//
// Mỗi đề ghi sẵn công thức BẮT BUỘC phải có trong top 10 (`need`: mọi id phải có; `anyOf`: ít nhất
// một id trong nhóm). `missingFromLibrary`: công thức đề cần nhưng thư viện CHƯA có (không có id để
// kiểm) — chỉ để báo cáo, không tính là lỗi xếp hạng.
import { shortlistFormulas, getFormula, methodGroupIds } from "../lib/formulaCatalog.js";

const R = String.raw;

// 10 đề đầu: chữ Gemini (gemini-3.5-flash-lite, code backend 2026-10-08) đọc ra từ 4 ảnh trong
// scratchpad/ocr-test — chép nguyên văn, kể cả LaTeX.
const CASES = [
  { src: "ảnh 03 · Bài 1", q: R`Cho $\triangle ABC$ có $AB = 4$, $AC = 6$ và góc $\widehat{A} = 120^\circ$. Tính độ dài cạnh $BC$`, need: ["hh10-cosin"] },
  { src: "ảnh 03 · Bài 2", q: R`Tìm tọa độ đỉnh của parabol $y = -x^2 + 2x + 3$`, need: ["hh10-parabola"] },
  { src: "ảnh 04 · Bài 1", q: R`Cho tam giác $ABC$ có $AB = 9, AC = 7$ và góc $\widehat{A} = 45^\circ$. Tính diện tích tam giác $ABC$.`, need: ["hh10-dientich-sinC"] },
  { src: "ảnh vở · 1", q: R`Cho tam giác $ABC$ có $a = 7$, $b = 5$, $c = 3$. Tính số đo góc $A$`, need: ["hh10-cosin"], missingFromLibrary: ["hệ quả định lý côsin cos A = (b²+c²−a²)/(2bc)"] },
  { src: "ảnh vở · 2", q: R`Cho tam giác $ABC$ có $AB = 6$, $AC = 8$ và góc $A = 60^\circ$. Tính độ dài cạnh $BC$ và diện tích tam giác $ABC$`, need: ["hh10-cosin", "hh10-dientich-sinC"] },
  { src: "ảnh vở · 3", q: R`Từ $2$ vị trí $A$ và $B$ cách nhau $50\text{ m}$, người ta nhìn thấy đỉnh $C$ của một ngọn tháp với góc $\widehat{CAB} = 60^\circ$ và góc $\widehat{CBA} = 70^\circ$. Tính $AC$`, need: ["hh10-dinhly-sin"], missingFromLibrary: ["tổng ba góc tam giác A + B + C = 180°"] },
  { src: "ảnh Word · 1", q: R`Tính diện tích và bán kính đường tròn ngoại tiếp của tam giác có ba cạnh lần lượt là $5$, $12$, $13$`, need: ["hh10-herong", "hh10-dinhly-sin"], anyOf: [["hh10-dientich-sinC", "hh10-cosin"]], missingFromLibrary: ["S = abc/(4R)"] },
  { src: "ảnh Word · 2", q: R`Xác định trục đối xứng, tọa độ đỉnh của parabol $y = x^2 - 4x + 3$ và vẽ đồ thị hàm số.`, need: ["hh10-parabola"] },
  { src: "ảnh Word · 3", q: "(Trắc nghiệm) Hàm số $y = x^2 - 6x + 5$ đồng biến trên khoảng nào?\n" + R`A. $(-\infty; 3)$ B. $(3; +\infty)$ C. $(-\infty; 6)$ D. $(5; +\infty)$`, need: ["ds10-hamso-bachai-bienthien"] },
  { src: "ảnh Word · 4", q: R`Xác định parabol $y = ax^2 + bx + 2$, biết parabol đi qua điểm $A(1; 5)$ và có trục đối xứng là đường thẳng $x = -1$.`, need: ["hh10-parabola"] },
  // 10 đề gõ tay (do chủ dự án đưa).
  { src: "gõ tay 1", q: "Cho tam giác ABC có AB = 4, AC = 6, góc A = 120°. Tính BC", need: ["hh10-cosin"] },
  { src: "gõ tay 2", q: "Tam giác ABC có a = 7, b = 5, c = 3. Tính góc A", need: ["hh10-cosin"], missingFromLibrary: ["hệ quả định lý côsin cos A = (b²+c²−a²)/(2bc)"] },
  { src: "gõ tay 3", q: "Cho tam giác ABC có BC = 10, góc B = 45°, góc C = 75°. Tính AC", need: ["hh10-dinhly-sin"], missingFromLibrary: ["tổng ba góc tam giác A + B + C = 180°"] },
  { src: "gõ tay 4", q: "Lập bảng biến thiên của hàm số y = −2x² + 4x + 1", need: ["ds10-hamso-bachai-bienthien", "hh10-parabola"] },
  { src: "gõ tay 5", q: "Hàm số y = x² − 6x + 5 đồng biến trên khoảng nào", need: ["ds10-hamso-bachai-bienthien"] },
  { src: "gõ tay 6", q: "Xác định parabol y = ax² + bx + 2 biết đi qua A(1; 5) và có trục đối xứng x = −1", need: ["hh10-parabola"] },
  { src: "gõ tay 7", q: "Tìm giao điểm của parabol y = x² − 3x + 2 với trục hoành", need: ["ds10-phuongtrinh-bac2"] },
  { src: "gõ tay 8", q: "ΔABC vuông tại A có AB = 3, AC = 4. Tính bán kính đường tròn ngoại tiếp", need: ["hh10-dinhly-sin"], anyOf: [["hh10-cosin"]], missingFromLibrary: ["định lý Pytago (lớp 8) / R = cạnh huyền ÷ 2"] },
  { src: "gõ tay 9", q: "Tính diện tích tg ABC có AB = 5, AC = 7, góc A = 30°", need: ["hh10-dientich-sinC"] },
  { src: "gõ tay 10", q: "Tìm m để hs y = x² − 2mx + 3 đồng biến trên (1; +∞)", need: ["ds10-hamso-bachai-bienthien"], anyOf: [["hh10-parabola"]] },
];

// Công thức đạo hàm (lớp 11–12) lọt vào top 10 của đề lớp 10 — đáng báo vì học sinh lớp 10 chưa học.
const GRADE12_DERIVATIVE = ["gt12-tinhdondieu-daoham", "gt12-daoham-basic", "gt11-daoham-tonghieu", "gt12-gtln-gtnn", "gt12-cuctrituoc"];

// Lớp học sinh: "node shortlist-coverage.mjs 10" giả định học sinh đã chọn lớp 10; không có = chưa chọn.
const GRADE = Number(process.argv[2]) || null;
console.log(GRADE ? `Giả định học sinh lớp ${GRADE}\n` : "Học sinh chưa chọn lớp\n");

const rows = [];
let failures = 0;
for (const c of CASES) {
  const top = shortlistFormulas([c.q], 10, { grade: GRADE }).map((f) => f.id);
  const missing = [];
  for (const id of c.need) {
    if (!getFormula(id)) missing.push(`${id} (thư viện không có)`);
    else if (!top.includes(id)) missing.push(`${id} (xếp hạng)`);
  }
  for (const group of c.anyOf || []) {
    if (!group.some((id) => top.includes(id))) missing.push(`một trong ${group.join(" / ")} (xếp hạng)`);
  }
  const derivative = top.map((id, i) => (GRADE12_DERIVATIVE.includes(id) ? `${id}#${i + 1}` : null)).filter(Boolean);
  if (missing.length) failures++;
  rows.push({
    src: c.src,
    need: [...c.need, ...(c.anyOf || []).map((g) => g.join("|"))].join(", "),
    ok: missing.length ? "THIẾU" : "đủ",
    missing: missing.join("; "),
    ranks: c.need.map((id) => `${id}#${top.indexOf(id) + 1 || "–"}`).join(" "),
    pinned: methodGroupIds(c.q, GRADE).filter((id) => GRADE12_DERIVATIVE.includes(id)).join(", "),
    derivative: derivative.join(", "),
    library: (c.missingFromLibrary || []).join("; "),
  });
}

for (const r of rows) {
  console.log(`${r.ok === "đủ" ? "✔" : "✖"} ${r.src.padEnd(15)} | cần: ${r.need}`);
  console.log(`    vị trí: ${r.ranks}${r.missing ? `  | THIẾU: ${r.missing}` : ""}`);
  if (r.derivative) console.log(`    công thức đạo hàm lớp 11–12 trong top 10 (vị trí): ${r.derivative}${r.pinned ? ` — ĐƯỢC GHIM: ${r.pinned}` : " (qua từ khoá, không ghim)"}`);
  if (r.library) console.log(`    thư viện chưa có (đề có thể cần): ${r.library}`);
}
console.log(`\n${CASES.length - failures}/${CASES.length} đề có đủ công thức bắt buộc trong top 10.`);
process.exitCode = failures ? 1 : 0;
