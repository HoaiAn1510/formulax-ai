import { test } from "node:test";
import assert from "node:assert/strict";
import { shortlistFormulas, methodGroupIds, isValidFormulaId, METHOD_GROUPS } from "../lib/formulaCatalog.js";

const ids = (texts) => shortlistFormulas(texts).map((f) => f.id);

test("mọi id trong METHOD_GROUPS đều có trong formulas.js", () => {
  const missing = METHOD_GROUPS.flatMap((g) => g.ids).filter((id) => !isValidFormulaId(id));
  assert.deepEqual(missing, []);
});

// Bộ câu thử khi điều tra lỗi "thư viện chưa có" (2026-09-30): công thức chính + công thức phụ
// của phương pháp phải cùng nằm trong danh sách ứng viên.
const CASES = [
  ["Tìm cực trị của hàm số y = x³ − 3x² − 9x + 5", ["gt12-cuctrituoc", "gt12-daoham-basic", "gt11-daoham-tonghieu"]],
  ["Viết phương trình tiếp tuyến của y = x³ − 2x + 1 tại điểm có hoành độ 2", ["gt11-tieptuyen-phuongtrinh", "gt12-daoham-basic"]],
  ["Tìm GTLN, GTNN của y = x⁴ − 8x² + 3 trên đoạn [−1; 3]", ["gt12-gtln-gtnn", "gt12-daoham-basic"]],
  ["Xét tính đơn điệu của hàm số y = x³ − 3x", ["gt12-tinhdondieu-daoham", "gt12-daoham-basic"]],
  ["Tính diện tích hình phẳng giới hạn bởi y = x² và y = 2x", ["gt12-tichphan-dientich", "gt12-nguyenham-basic", "gt12-tichphan-newtonleibniz"]],
  ["Giải phương trình log₂(x + 1) + log₂(x − 1) = 3", ["gt12-logarit", "gt12-mu-log-phuongtrinh"]],
  ["Giải bất phương trình 3^(2x) − 4·3^x + 3 < 0", ["ds10-bpt-bac2", "gt11-batptmu-coban", "gt12-mu-log-phuongtrinh"]],
  ["Gửi 100 triệu, lãi kép 6%/năm, sau bao nhiêu năm được ít nhất 150 triệu?", ["gt11-laikep", "mr-taichinh-dautu"]],
  ["Giải phương trình 2cos²x − 3cos x + 1 = 0", ["gt11-ptluonggiac-sincos", "ds10-phuongtrinh-bac2"]],
  ["Giải phương trình sin x + √3 cos x = 1", ["ds11-luonggiac-cong", "gt11-ptluonggiac-sincos", "lg11-goc-dacbiet"]],
  ["Hình chóp S.ABCD đáy hình vuông cạnh a, SA ⊥ đáy, SA = a√2. Tính thể tích", ["hh12-thetich-chopsen"]],
  ["Viết phương trình mặt phẳng qua A(1;2;3) vuông góc đường thẳng có VTCP u = (2;−1;1)", ["hh12-oxyz-matphang"]],
  ["Tính khoảng cách từ M(1;−2;3) đến mặt phẳng 2x − y + 2z − 1 = 0", ["hh12-oxyz-khoangcach"]],
  ["Viết phương trình mặt cầu tâm I(1;2;−1) tiếp xúc mặt phẳng x + 2y − 2z + 3 = 0", ["hh12-oxyz-matcau", "hh12-oxyz-khoangcach"]],
  ["Hộp 5 bi đỏ, 4 bi xanh, lấy 3 bi. Xác suất có ít nhất 1 bi xanh", ["xs10-xacsuat-bienco-doi", "xs11-tohop", "xs11-xacsuat"]],
  ["Tìm hệ số của x⁵ trong khai triển (2x − 1)⁸", ["ds10-heso-xk-khaitrien-axb", "ds11-nhi-thuc-newton"]],
];
for (const [q, need] of CASES) {
  test(`shortlist đủ công thức: ${q}`, () => {
    const list = ids([q]);
    assert.ok(list.length <= 10);
    assert.deepEqual(need.filter((id) => !list.includes(id)), []);
  });
}

test("không ghim nhầm: câu khối cầu thường không kéo nhóm nào, công thức đúng đứng đầu", () => {
  assert.deepEqual(methodGroupIds("Tính thể tích khối cầu có bán kính R = 5 cm"), []);
  assert.equal(ids(["Tính thể tích khối cầu có bán kính R = 5 cm"])[0], "hh12-matcau-thetich");
});

test("tiếp tuyến của đường tròn không kéo nhóm đạo hàm", () => {
  assert.deepEqual(methodGroupIds("Viết phương trình tiếp tuyến của đường tròn (x-1)^2 + y^2 = 4 tại M(1;2)"), []);
});

test("mặt phẳng trong hình học không gian lớp 11 (không có toạ độ) không kéo nhóm Oxyz", () => {
  assert.deepEqual(methodGroupIds("Chứng minh đường thẳng SA vuông góc với mặt phẳng (ABCD)"), []);
});

test("câu hiện tại được ghim trước câu hỏi cũ trong lịch sử", () => {
  const list = ids(["Tìm cực trị của hàm số y = x^3 - 3x^2 - 9x + 5", "Tính xác suất lấy được 2 bi đỏ"]);
  assert.equal(list[0], "gt12-cuctrituoc");
  assert.ok(list.indexOf("gt12-daoham-basic") < list.indexOf("xs11-xacsuat"));
});

test("chuẩn hoá NFKD: log₂ vẫn khớp từ khóa logarit, x³ không làm hỏng việc tách từ", () => {
  assert.ok(ids(["log₂(x) = 3"]).includes("gt12-logarit"));
  assert.ok(ids(["Tìm cực trị của y = x³ + 1"]).includes("gt12-cuctrituoc"));
});

// ─── 2026-10-08: hàm bậc hai lớp 10, giao điểm với trục, tam giác không nêu tên, xếp hạng theo lớp ───
const DERIV = ["gt12-tinhdondieu-daoham", "gt12-daoham-basic", "gt11-daoham-tonghieu", "gt12-gtln-gtnn", "gt12-cuctrituoc"];
const top = (q, grade = null) => shortlistFormulas([q], 10, { grade }).map((f) => f.id);

test("hàm bậc hai: ghim công thức lớp 10 (biến thiên, parabol), KHÔNG ghim đạo hàm", () => {
  for (const q of ["Hàm số y = x² − 6x + 5 đồng biến trên khoảng nào", "Lập bảng biến thiên của hàm số y = −2x² + 4x + 1", "Tìm giá trị lớn nhất của y = -x^2 + 4x"]) {
    const pinned = methodGroupIds(q);
    assert.deepEqual(pinned.slice(0, 2), ["ds10-hamso-bachai-bienthien", "hh10-parabola"], q);
    assert.equal(pinned.some((id) => DERIV.includes(id)), false, q);
  }
  // Bậc ba trở lên / hàm mũ vẫn dùng đạo hàm như cũ.
  assert.ok(methodGroupIds("Hàm số y = x^3 - 3x đồng biến trên khoảng nào").includes("gt12-tinhdondieu-daoham"));
  assert.ok(methodGroupIds("Tìm khoảng đồng biến của y = x⁴ − 2x²").includes("gt12-tinhdondieu-daoham"));
});

test("giao điểm parabol với trục hoành/tung → ghim phương trình bậc hai + parabol", () => {
  assert.deepEqual(methodGroupIds("Tìm giao điểm của parabol y = x² − 3x + 2 với trục hoành"), ["ds10-phuongtrinh-bac2", "hh10-parabola"]);
  assert.deepEqual(methodGroupIds("Tìm giao điểm của đồ thị y = x^2 - 4 với Ox").slice(0, 1), ["ds10-phuongtrinh-bac2"]);
  // Đường thẳng (không có x², không parabol) không ghim nhóm này.
  assert.deepEqual(methodGroupIds("Tìm giao điểm của đường thẳng y = 2x + 1 với trục hoành"), []);
});

test("tam giác không nêu tên (từ 2 góc trở lên) → ghim côsin, định lý sin, diện tích theo sin", () => {
  const q = String.raw`Từ $2$ vị trí $A$ và $B$ cách nhau $50\text{ m}$, người ta nhìn thấy đỉnh $C$ của một ngọn tháp với góc $\widehat{CAB} = 60^\circ$ và góc $\widehat{CBA} = 70^\circ$. Tính $AC$`;
  assert.ok(top(q).includes("hh10-dinhly-sin"));
  assert.deepEqual(methodGroupIds("Cho tam giác ABC có BC = 10, góc B = 45°, góc C = 75°. Tính AC"), ["hh10-cosin", "hh10-dinhly-sin", "hh10-dientich-sinC"]);
  // Chỉ một góc: không ghim (từ khoá "tam giác" đã đủ).
  assert.deepEqual(methodGroupIds("Cho tam giác ABC có AB = 6, AC = 8, góc A = 60°. Tính BC"), []);
});

test("lớp 10: đề đồng biến hàm bậc hai không có công thức đạo hàm trong 3 vị trí đầu", () => {
  const got = top("Hàm số y = x² − 6x + 5 đồng biến trên khoảng nào", 10);
  assert.equal(got.slice(0, 3).some((id) => DERIV.includes(id)), false);
  assert.ok(got.includes("ds10-hamso-bachai-bienthien"));
});

test("lớp 10: không ghim công thức lớp 11–12 ở BẤT KỲ nhóm nào; vẫn có thể vào danh sách qua từ khoá", () => {
  const q = "Tìm cực trị của hàm số y = x^3 - 3x + 2";
  assert.deepEqual(methodGroupIds(q, 10), ["ds10-phuongtrinh-bac2"]); // cực trị: chỉ còn phương trình bậc hai
  assert.ok(methodGroupIds(q, null).includes("gt12-cuctrituoc")); // chưa chọn lớp: như cũ
  assert.ok(top(q, 10).includes("gt12-cuctrituoc")); // không loại hẳn (có thể chọn nhầm lớp)
});

test("lớp 11: không ghim công thức lớp 12, vẫn ghim công thức lớp 11", () => {
  const pinned = methodGroupIds("Hàm số y = x^3 - 3x đồng biến trên khoảng nào", 11);
  assert.equal(pinned.includes("gt12-tinhdondieu-daoham"), false);
  assert.ok(pinned.includes("gt11-daoham-tonghieu"));
});

test("trừ điểm theo lớp chỉ đổi thứ tự giữa công thức CÙNG mức liên quan", () => {
  // Chưa chọn lớp: kết quả y như trước (không trừ điểm).
  assert.deepEqual(top("Tính đạo hàm của y = x^3", null), shortlistFormulas(["Tính đạo hàm của y = x^3"]).map((f) => f.id));
  // Lớp 10 hỏi đạo hàm (lớp 11): vẫn tìm thấy công thức đạo hàm — không loại hẳn.
  assert.ok(top("Tính đạo hàm của y = x^3", 10).some((id) => id.includes("daoham")));
});
