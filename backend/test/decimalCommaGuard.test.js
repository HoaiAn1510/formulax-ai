import { test } from "node:test";
import assert from "node:assert/strict";
import { extractNumbers, checkTriangleSides } from "../lib/solutionGuard.js";
import { finalizeAnswer } from "../lib/finderAnswer.js";

const R = String.raw;
// Mỗi nhóm có CẢ vế "phải bắt" và "phải cho qua". Câu trả lời giả lập một bước, chạy qua finalizeAnswer thật (mask: true).
const finalize = (message, steps, ids = ["hh12-matcau-thetich"]) => finalizeAnswer(
  { type: "solution", formula_ids: ids, intro: "Hướng dẫn.", steps, reminder: "Bạn tự tính nhé." },
  { message, grade: 10, mask: true },
);
const step = (detail, expression = "") => ({ title: "Bước", detail, expression });
const shown = (answer) => answer.steps.map((s) => `${s.detail} ${s.expression}`).join(" ");
const hides = (answer, value) => !shown(answer).includes(value) && !shown(answer).includes(value.replace(",", "."));

// ─── a) Đề cho "bán kính 2,5" ──────────────────────────────────────────────────────────────────────
const SPHERE = "Tính thể tích khối cầu có bán kính 2,5 cm.";

test("a) bán kính 2,5: AI nhắc lại R = 2,5 → cho qua nguyên văn", () => {
  const { answer, meta } = finalize(SPHERE, [step("Đề cho bán kính $R = 2,5$ cm.", R`V = \frac{4}{3}\pi R^3, \text{ với } R = 2,5 \Rightarrow V = ?`)]);
  assert.equal(answer.type, "solution");
  assert.deepEqual(meta.maskedSteps, []);
  assert.match(answer.steps[0].detail, /R = 2,5/);
  assert.match(answer.steps[0].expression, /R = 2,5 \\Rightarrow V = \?$/);
});

test("a) bán kính 2,5: AI viết R = 3,5 (không phải dữ kiện) → bị bắt", () => {
  const { answer, meta } = finalize(SPHERE, [step("Đề cho bán kính $R = 3,5$ cm.", R`V = \frac{4}{3}\pi R^3, \text{ với } R = 3,5 \Rightarrow V = ?`)]);
  assert.equal(meta.maskedSteps.length, 1);
  assert.ok(hides(answer, "3,5"), shown(answer));
});

// Chỗ hổng ĐÃ CÓ trên origin/master, bản sửa dấu phẩy không gây ra và không sửa: đại lượng đề hỏi viết thường (d)
// gán bằng đúng một số có trong đề thì lọt — "hằng số tính ra trùng số trong đề" (CLAUDE.md, giới hạn đã biết của
// bộ lọc "không tính"; askedTargets chỉ bắt tên đoạn/góc viết hoa). Để todo: chạy, báo, không làm đỏ cả bộ test.
test("a) bán kính 2,5, đề hỏi đường kính d: AI viết d = 2,5 → phải bị bắt", { todo: "giới hạn đã biết của bộ lọc, cần chủ dự án quyết" }, () => {
  const q = "Đường tròn có bán kính 2,5 cm. Tính đường kính d của đường tròn.";
  for (const steps of [[step("Đường kính gấp đôi bán kính.", R`d = 2R, \text{ với } R = 2,5 \Rightarrow d = 2,5`)], [step("Vậy $d = 2,5$ cm.")]]) {
    const { answer } = finalize(q, steps, ["hh10-duongtron-phuongtrinh"]);
    assert.doesNotMatch(shown(answer), /d = 2[,.]5/);
  }
});

// ─── b) Đề KHÔNG có số thập phân ───────────────────────────────────────────────────────────────────
test("b) đề không có thập phân: x = 2,5 bị che dù 2 và 5 đều có riêng lẻ trong đề", () => {
  const q = "Giải phương trình 2x - 5 = 0.";
  for (const steps of [[step("Chuyển vế rồi chia cho 2.", R`2x - 5 = 0 \Rightarrow x = 2,5`)], [step("Nghiệm là $x = 2,5$.")]]) {
    const { answer, meta } = finalize(q, steps, ["ds10-phuongtrinh-bac2"]);
    assert.equal(meta.maskedSteps.length, 1);
    assert.ok(hides(answer, "2,5"), shown(answer));
  }
});

test("b) đề không có thập phân: S = 0,75 bị che dù 0 và 75 đều có riêng lẻ trong đề", () => {
  const q = "Trên đoạn [0; 75], tam giác vuông có hai cạnh góc vuông là 1 và 3/2. Tính diện tích S.";
  const { answer, meta } = finalize(q, [step("Diện tích bằng nửa tích hai cạnh góc vuông.", R`S = \frac{1}{2}ab \Rightarrow S = 0,75`)], ["hh10-dientich-sinC"]);
  assert.equal(meta.maskedSteps.length, 1);
  assert.match(answer.steps[0].expression, /S = \?$/);
});

// Trước bản sửa: "3,75" bị đọc thành 3 và 75 (cả hai có trong đề) nên lọt nguyên — ca này đỏ khi gỡ bản sửa.
test("b) đề không có thập phân: S = 3,75 bị che dù 3 và 75 đều có riêng lẻ trong đề", () => {
  const q = "Hình chữ nhật có chiều dài 3 và chiều rộng 75. Tính diện tích S.";
  const { answer, meta } = finalize(q, [step("Nhân dài với rộng.", R`S = ab \Rightarrow S = 3,75`)], ["hh10-dientich-sinC"]);
  assert.equal(meta.maskedSteps.length, 1);
  assert.match(answer.steps[0].expression, /S = \?$/);
});

test("b) vế cho qua: đề không có thập phân, AI chỉ nhắc dữ kiện → không bị che", () => {
  const q = "Hình chữ nhật có chiều dài 3 và chiều rộng 75. Tính diện tích S.";
  const { answer, meta } = finalize(q, [step("Đề cho $a = 3$, $b = 75$.", R`S = ab, \text{ với } a = 3, b = 75 \Rightarrow S = ?`)], ["hh10-dientich-sinC"]);
  assert.deepEqual(meta.maskedSteps, []);
  assert.match(answer.steps[0].expression, /a = 3, b = 75 \\Rightarrow S = \?$/);
});

// ─── c) Đề CÓ 2,5, AI viết nghiệm bằng đúng số đó ──────────────────────────────────────────────────
test("c) đề có 2,5: nghiệm x = 2,5 vẫn bị bắt như quy tắc cũ; nhắc lại 2,5 như dữ kiện thì qua", () => {
  const q = "Giải phương trình 2x - 5 = 0 rồi so sánh nghiệm với 2,5.";
  const caught = finalize(q, [step("Chuyển vế rồi chia cho 2.", R`2x - 5 = 0 \Rightarrow x = 2,5`)], ["ds10-phuongtrinh-bac2"]);
  assert.equal(caught.meta.maskedSteps.length, 1);
  assert.ok(hides(caught.answer, "2,5"), shown(caught.answer));
  const restated = finalize(q, [step("Sau khi tìm được $x$, bạn so sánh với $2,5$.", R`2x - 5 = 0 \Rightarrow x = ?`)], ["ds10-phuongtrinh-bac2"]);
  assert.deepEqual(restated.meta.maskedSteps, []);
  assert.match(restated.answer.steps[0].detail, /2,5/);
});

// ─── d) Dấu phẩy KHÔNG phải thập phân ──────────────────────────────────────────────────────────────
test("d) danh sách có cách, toạ độ, khoảng, danh sách 3 số, chỉ số dưới → không đọc thành thập phân", () => {
  assert.deepEqual(extractNumbers("x = 2, 5"), ["2", "5"]);
  assert.deepEqual(extractNumbers("A(1,2)"), ["1", "2"]);
  assert.deepEqual(extractNumbers("x ∈ (1,5)"), ["1", "5"]);
  assert.deepEqual(extractNumbers("[1,5]"), ["1", "5"]);
  assert.deepEqual(extractNumbers("1,2,3"), ["1", "2", "3"]);
  assert.deepEqual(extractNumbers("u_{1,2}"), []);
  // Vế đối chứng: thập phân thật.
  assert.deepEqual(extractNumbers("2,5"), ["2.5"]);
  assert.deepEqual(extractNumbers("0,75"), ["0.75"]);
});

test("d) nhắc lại toạ độ A(1,2), B(3,4) của đề → cho qua, không bị che", () => {
  const { answer, meta } = finalize("Cho A(1,2) và B(3,4). Tính độ dài AB.",
    [step("Đề cho $A(1,2)$ và $B(3,4)$.", R`AB = \sqrt{(x_B - x_A)^2 + (y_B - y_A)^2} \Rightarrow AB = ?`)], ["hh10-dodai-vecto-khoangcach"]);
  assert.deepEqual(meta.maskedSteps, []);
  assert.match(answer.steps[0].detail, /A\(1,2\).*B\(3,4\)/);
});

// ─── e) checkTriangleSides với cạnh thập phân ──────────────────────────────────────────────────────
const HOP_LE = "Tam giác có ba cạnh 1,5; 2; 3. Tính diện tích.";
const VI_PHAM = "Tam giác có ba cạnh 1,5, 2, 4. Tính diện tích bằng công thức Hê-rông.";

test("e) ba cạnh 1,5; 2; 3 hợp lệ → không xác nhận vô lý (phẩy hay chấm đều vậy)", () => {
  assert.equal(checkTriangleSides(["1,5", "2", "3"], HOP_LE), null);
  assert.equal(checkTriangleSides(["1.5", "2", "3"], HOP_LE), null);
});

test("e) ba cạnh 1,5, 2, 4 vi phạm → xác nhận, câu giải thích giữ 1,5", () => {
  const r = checkTriangleSides(["1,5", "2", "4"], VI_PHAM);
  assert.ok(r);
  assert.deepEqual(r.sides, [1.5, 2, 4]);
  assert.match(r.intro, /1\{,\}5 \+ 2 < 4/);
});

// Trước bản sửa: AI đọc nhầm "1,5" thành hai cạnh 1 và 5 vẫn được backend XÁC NHẬN là vô lý (1 và 5 đều "có trong
// đề"), nên học sinh bị báo nhầm "ba cạnh 1, 5, 3 không tạo thành tam giác" — ca này đỏ khi gỡ bản sửa.
test("e) AI đọc nhầm 1,5 thành hai cạnh 1 và 5 → không được xác nhận", () => {
  assert.equal(checkTriangleSides(["1", "5", "3"], HOP_LE), null);
  assert.equal(checkTriangleSides(["1", "5", "2"], VI_PHAM), null);
});
