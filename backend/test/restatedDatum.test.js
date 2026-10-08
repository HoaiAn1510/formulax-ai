// Ngoại lệ HẸP của bộ lọc "không tính" (duyệt 2026-10-08): "… vì a = -2" ở cuối biểu thức được giữ khi
// THỎA CẢ BA: vế trái là một ký hiệu đơn (không phải đại lượng đề hỏi), cặp "a = -2" đã khai báo ở bước
// trước, và -2 có trong đề (tính cả dấu). Mọi trường hợp khác vẫn bị chặn như cũ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyNumberGuard, declaredPairs, askedTargets } from "../lib/solutionGuard.js";
import { FINDER_SYSTEM_PROMPT } from "../lib/finderPrompt.js";

const R = String.raw;
const BBT_Q = "Lập bảng biến thiên của hàm số y = −2x² + 4x + 1";
const STEP1 = { title: "Xác định hệ số", detail: "Hàm số có dạng $y = ax^2 + bx + c$ với $a = -2$, $b = 4$, $c = 1$.", expression: "" };
// Đúng biểu thức của lần chạy thật 2026-10-08.
const STEP_VI = { title: "Xác định tính đồng biến, nghịch biến", detail: "Với $a < 0$ hàm số tăng trên $(-\\infty; x_I)$ và giảm trên $(x_I; +\\infty)$.", expression: R`f \text{ tăng trên } (-\infty; x_I) \text{ và giảm trên } (x_I; +\infty) \text{ vì } a = -2` };

const guard = (question, steps, mask = true) => applyNumberGuard(
  { type: "solution", formulaIds: [], intro: "", steps, reminder: "" },
  { sourceTexts: [question], formulaTexts: [], mask },
);
const leaksOf = (r) => [...r.removedSteps, ...r.maskedSteps].flatMap((s) => s.leaked);

test("declaredPairs: đọc 'a = -2', 'b = 4' (cả dấu − Unicode); bỏ qua x, y, t và chỉ số", () => {
  assert.deepEqual(declaredPairs(STEP1.detail), ["a=-2", "b=4", "c=1"]);
  assert.deepEqual(declaredPairs("với $a = −3$"), ["a=-3"]);
  assert.deepEqual(declaredPairs("$x = 2$, $t = 1$, $y = 5$, $u_1 = 3$"), []);
});

test("ĐƯỢC PHÉP: '… vì a = -2' khi bước 1 đã có 'a = -2' và -2 có trong đề", () => {
  const r = guard(BBT_Q, [STEP1, STEP_VI], false);
  assert.deepEqual(leaksOf(r), []);
  assert.equal(r.answer.steps[1].expression, STEP_VI.expression); // giữ nguyên, không thành "a = ?"
});

test("VẪN CHẶN: chưa khai báo 'a = -2' ở bước trước", () => {
  assert.notDeepEqual(leaksOf(guard(BBT_Q, [STEP_VI], false)), []);
});

// Các biến thể dưới đây đều giữ đúng dạng biểu thức thật (vế trái có x_I) — dạng mà bộ lọc cũ đã chặn —
// để kiểm rằng ngoại lệ chỉ mở cho đúng trường hợp thỏa cả ba điều.
const tail = (s) => ({ ...STEP_VI, expression: R`f \text{ tăng trên } (-\infty; x_I) \text{ vì } ` + s });

test("VẪN CHẶN: cặp đã khai báo khác với cặp ở cuối biểu thức", () => {
  const decl = { ...STEP1, detail: "Với $a = 2$, $b = 4$, $c = 1$." }; // khai báo a = 2, cuối viết a = -2
  assert.notDeepEqual(leaksOf(guard(BBT_Q, [decl, tail("a = -2")], false)), []);
});

test("VẪN CHẶN: giá trị không có trong đề — kể cả chỉ khác dấu", () => {
  const q = "Lập bảng biến thiên của hàm số y = 2x² + 4x + 1"; // có 2, không có -2
  const decl = { ...STEP1, detail: "Với $a = -2$, $b = 4$, $c = 1$." };
  assert.notDeepEqual(leaksOf(guard(q, [decl, tail("a = -2")], false)), []);
  const decl5 = { ...STEP1, detail: "Với $a = -5$." };
  assert.notDeepEqual(leaksOf(guard(BBT_Q, [decl5, tail("a = -5")], false)), []);
});

test("VẪN CHẶN: vế trái không phải MỘT ký hiệu đơn, hoặc là đại lượng đề hỏi", () => {
  assert.notDeepEqual(leaksOf(guard(BBT_Q, [STEP1, tail("2a = -4")], false)), []);
  // Đề hỏi khoảng cách d: "d = -2" không được coi là nhắc lại dữ kiện dù đã khai báo và -2 có trong đề.
  const q = "Cho parabol y = −2x² + 4x + 1. Tính khoảng cách d từ đỉnh tới trục hoành";
  const decl = { ...STEP1, detail: "Với $a = -2$, $d = -2$." };
  assert.notDeepEqual(leaksOf(guard(q, [decl, tail("d = -2")], false)), []);
});

test("askedTargets: đọc đại lượng đề hỏi dạng tên đoạn / góc", () => {
  assert.deepEqual(askedTargets("Cho tam giác có AB = 5, AC = 5, góc A = 60°, tính BC"), ["BC"]);
  assert.deepEqual(askedTargets("Tính độ dài cạnh AC và diện tích tam giác"), ["AC"]);
  assert.deepEqual(askedTargets("Tính số đo góc A"), ["A"]);
  assert.deepEqual(askedTargets("Lập bảng biến thiên của hàm số y = −2x² + 4x + 1"), []);
});

test("VẪN CHẶN và thay '?': tam giác AB = 5, AC = 5, góc A = 60°, AI viết '⇒ BC = 5'", () => {
  const q = "Cho tam giác có AB = 5, AC = 5, góc A = 60°, tính BC";
  const decl = { title: "Xác định dữ kiện", detail: "Đề cho $b = AC = 5$, $c = AB = 5$, $A = 60^\\circ$.", expression: "" };
  const leak = { title: "Áp dụng định lý côsin", detail: "Bạn tự tính $BC$.", expression: R`BC^2 = b^2 + c^2 - 2bc\cos A, \text{ với } b = 5, c = 5, A = 60^\circ \Rightarrow BC = 5` };
  const detected = guard(q, [decl, leak], false);
  assert.ok(leaksOf(detected).length > 0);
  const masked = guard(q, [decl, leak], true);
  assert.match(masked.answer.steps[1].expression, /\\Rightarrow BC = \?$/);
});

test("prompt: lý do / dữ kiện nhắc lại viết bằng lời trước biểu thức", () => {
  assert.match(FINDER_SYSTEM_PROMPT, /Lý do hay dữ kiện nhắc lại \(ví dụ "vì a = -2 < 0"\) viết bằng lời TRƯỚC biểu thức/);
});
