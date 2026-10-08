import { test } from "node:test";
import assert from "node:assert/strict";
import { expandShorthand } from "../lib/problemText.js";
import { shortlistFormulas } from "../lib/formulaCatalog.js";

const R = String.raw;
const ids = (q) => shortlistFormulas([q]).map((f) => f.id);

// ─── Lỗi thật trên iPhone (2026-10-08) ───────────────────────────────────────
const TRI_SYMBOL = "Tính diện tích và bán kính đường tròn ngoại tiếp của △ có 3 cạnh lần lượt là: 5, 12, 13";
const TRI_WORDS = "Tính diện tích và bán kính đường tròn ngoại tiếp của tam giác có 3 cạnh lần lượt là: 5, 12, 13";

test("đề '△ có 3 cạnh lần lượt là: 5, 12, 13' chọn được Hê-rông, định lý sin, côsin/diện tích theo sin — như khi viết 'tam giác'", () => {
  const got = ids(TRI_SYMBOL);
  assert.ok(got.includes("hh10-herong"));
  assert.ok(got.includes("hh10-dinhly-sin"));
  // Hai công thức bị mất khi "△" không được hiểu — thiếu chúng AI không tìm được sin A để tính R.
  assert.ok(got.includes("hh10-dientich-sinC"));
  assert.deepEqual(got, ids(TRI_WORDS));
  // Đề chép từ ảnh viết dạng LaTeX cũng vậy.
  assert.deepEqual(ids(R`Tính diện tích và bán kính đường tròn ngoại tiếp của $\triangle$ có 3 cạnh lần lượt là: $5, 12, 13$`), ids(TRI_WORDS));
});

// ─── Ký hiệu ────────────────────────────────────────────────────────────────
test("△, ▵, \\triangle → tam giác", () => {
  assert.match(expandShorthand("Cho △ABC vuông tại A"), /tam giác ABC/);
  assert.match(expandShorthand("Cho ▵ có ba cạnh"), /tam giác có/);
  assert.match(expandShorthand(R`Cho $\triangle ABC$`), /tam giác ABC/);
});

test("ΔABC, ∆ABC, \\Delta ABC (Δ liền 3 chữ in hoa) → tam giác ABC; Δ đứng riêng (biệt thức) giữ nguyên", () => {
  assert.equal(expandShorthand("Cho ΔABC có AB = 3"), "Cho tam giác ABC có AB = 3");
  assert.equal(expandShorthand("Cho ∆MNP đều"), "Cho tam giác MNP đều");
  assert.match(expandShorthand(R`Cho $\Delta ABC$ cân`), /tam giác ABC/);
  // Biệt thức: không đổi.
  assert.equal(expandShorthand("Tính Δ = b^2 - 4ac"), "Tính Δ = b^2 - 4ac");
  assert.equal(expandShorthand("Δ > 0 thì phương trình có 2 nghiệm"), "Δ > 0 thì phương trình có 2 nghiệm");
  assert.equal(expandShorthand(R`$\Delta = 25$`), R`$\Delta = 25$`);
  // Δ trước 2 hay 4 chữ in hoa không phải tam giác.
  assert.equal(expandShorthand("ΔAB"), "ΔAB");
  assert.equal(expandShorthand("ΔABCD"), "ΔABCD");
});

test("∠, \\angle, góc có mũ (\\widehat, \\hat) → góc", () => {
  assert.match(expandShorthand("∠BAC = 60°"), /góc BAC = 60°/);
  assert.match(expandShorthand(R`$\angle A = 30^\circ$`), /góc A = 30/);
  assert.match(expandShorthand(R`$\widehat{BAC} = 60^\circ$`), /góc BAC = 60/);
  assert.match(expandShorthand(R`$\hat{A} = 45^\circ$`), /góc A = 45/);
});

test("⊥, \\perp → vuông góc; //, ∥, \\parallel → song song", () => {
  assert.match(expandShorthand("AH ⊥ BC"), /AH vuông góc BC/);
  assert.match(expandShorthand(R`$AH \perp BC$`), /AH vuông góc BC/);
  assert.match(expandShorthand("AB // CD"), /AB song song CD/);
  assert.match(expandShorthand("AB ∥ CD"), /AB song song CD/);
  assert.match(expandShorthand(R`$d \parallel d'$`), /d song song d'/);
});

// ─── Viết tắt ───────────────────────────────────────────────────────────────
test("viết tắt đứng riêng → từ đầy đủ", () => {
  const cases = [
    ["Giải pt x^2 - 5x + 6 = 0", "Giải phương trình x^2 - 5x + 6 = 0"],
    ["Giải bpt x^2 - 4 < 0", "Giải bất phương trình x^2 - 4 < 0"],
    ["Giải hpt sau", "Giải hệ phương trình sau"],
    ["Cho hs y = x^2 - 4x + 3", "Cho hàm số y = x^2 - 4x + 3"],
    ["Viết pt đt đi qua A(1; 2)", "Viết phương trình đường thẳng đi qua A(1; 2)"],
    ["Cho tg ABC vuông", "Cho tam giác ABC vuông"],
    ["Vẽ đths y = 2x + 1", "Vẽ đồ thị hàm số y = 2x + 1"],
    ["Viết ptđt qua 2 điểm", "Viết phương trình đường thẳng qua 2 điểm"],
    ["Tìm tđ đỉnh của parabol", "Tìm tọa độ đỉnh của parabol"],
    ["Tính tích vô hướng của 2 vt", "Tính tích vô hướng của 2 vectơ"],
    ["PT có nghiệm khi nào", "phương trình có nghiệm khi nào"],
  ];
  for (const [input, want] of cases) assert.equal(expandShorthand(input), want, input);
});

test("viết tắt bổ sung 2026-10-08: ptb2, tgv, hcn, hbh, đtròn, đk, mp, csc, csn", () => {
  const cases = [
    ["Giải ptb2 x^2 - 3x + 2 = 0", "Giải phương trình bậc hai x^2 - 3x + 2 = 0"],
    ["Cho tgv ABC tại A", "Cho tam giác vuông ABC tại A"],
    ["Tính diện tích hcn có chiều dài 5", "Tính diện tích hình chữ nhật có chiều dài 5"],
    ["Cho hbh ABCD", "Cho hình bình hành ABCD"],
    ["Viết pt đtròn tâm I(1; 2)", "Viết phương trình đường tròn tâm I(1; 2)"],
    ["Tìm đk xác định", "Tìm điều kiện xác định"],
    ["Viết pt mp (P)", "Viết phương trình mặt phẳng (P)"],
    ["Cho csc có u1 = 2, d = 3", "Cho cấp số cộng có u1 = 2, d = 3"],
    ["Cho csn có u1 = 3, q = 2", "Cho cấp số nhân có u1 = 3, q = 2"],
  ];
  for (const [input, want] of cases) assert.equal(expandShorthand(input), want, input);
  // Đứng riêng mới thay: "mp3", "hcnx" không đổi.
  assert.equal(expandShorthand("file mp3"), "file mp3");
  assert.equal(expandShorthand("Đặt hcnx = 2"), "Đặt hcnx = 2");
});

test("viết tắt bổ sung giúp chọn đúng công thức như khi viết đủ", () => {
  assert.deepEqual(ids("Cho csc có u1 = 2, d = 3. Tính u10"), ids("Cho cấp số cộng có u1 = 2, d = 3. Tính u10"));
  assert.deepEqual(ids("Giải ptb2 x^2 - 3x + 2 = 0"), ids("Giải phương trình bậc hai x^2 - 3x + 2 = 0"));
});

test("không thay viết tắt nằm trong từ khác", () => {
  assert.equal(expandShorthand("Cho điểm Apt và tập hst"), "Cho điểm Apt và tập hst");
  assert.equal(expandShorthand("ptđt"), "phương trình đường thẳng"); // không ra "phương trìnhđt"
  assert.equal(expandShorthand("đths"), "đồ thị hàm số"); // không ra "đường thẳnghs"
});

test("'tg' chỉ là tam giác khi đi với tên hình / chữ mô tả tam giác — 'tg x' (tang, sách cũ) giữ nguyên", () => {
  assert.equal(expandShorthand("Cho tg ABC vuông"), "Cho tam giác ABC vuông");
  assert.equal(expandShorthand("Cho tgABC"), "Cho tam giác ABC");
  assert.equal(expandShorthand("Một tg vuông có hai cạnh góc vuông 3 và 4"), "Một tam giác vuông có hai cạnh góc vuông 3 và 4");
  assert.equal(expandShorthand("Giải phương trình tg x = 1"), "Giải phương trình tg x = 1");
  assert.equal(expandShorthand("Tính tg(2x) biết tg x = 3"), "Tính tg(2x) biết tg x = 3");
});

test("'đ' gõ dạng tổ hợp (d + dấu ngang) vẫn khớp đt / tđ", () => {
  assert.equal(expandShorthand("Viết pt đt".normalize("NFD")), "Viết phương trình đường thẳng");
});

test("viết tắt giúp chọn đúng công thức: 'Giải pt bậc 2' như 'Giải phương trình bậc 2'", () => {
  assert.deepEqual(ids("Giải pt x^2 - 5x + 6 = 0"), ids("Giải phương trình x^2 - 5x + 6 = 0"));
  assert.deepEqual(ids("Tìm tđ đỉnh của parabol y = x^2 - 4x + 3"), ids("Tìm tọa độ đỉnh của parabol y = x^2 - 4x + 3"));
});
