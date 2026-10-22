import { test } from "node:test";
import assert from "node:assert/strict";
import { finalizeAnswer, countsAsTurn } from "../lib/finderAnswer.js";
import { parseModelJson, checkBaseKnowledge, hasTriangleContext } from "../lib/solutionGuard.js";

const R = String.raw;

// Bộ ép "formula_ids rỗng → no_formula" (solutionGuard, 30/9) mâu thuẫn với quy tắc 1c (8/10, kiến thức nền
// THCS không cần thẻ công thức). Chạy thật 2026-10-22: 5/5 câu chỉ cần kiến thức nền bị báo "thư viện chưa có
// công thức" dù AI giải đúng. Sửa: checkBaseKnowledge nhận diện từ biểu thức AI viết (fail-closed), KHÔNG
// mở rộng ngoài ba điều đã duyệt: tổng ba góc, Pytago (chiều thuận), bất đẳng thức tam giác.

// ─── 5 câu trả lời THẬT của gpt-oss-120b (nguyên văn, qua askFinder bằng key chấm) ───────────────
const LIVE = {
  angleSum: {
    message: "Tam giác ABC có góc A = 50°, góc B = 60°. Tính góc C",
    raw: R`{"type":"solution","formula_ids":[],"intro":"Bài này dùng tính chất tổng các góc trong tam giác.","steps":[{"title":"Xác định dữ kiện","detail":"Đề cho góc $A = 50^\circ$, $B = 60^\circ$.","expression":""},{"title":"Áp dụng tính chất tổng góc","detail":"Trong một tam giác, tổng ba góc bằng $180^\circ$. Bạn tự tính $C$.","expression":"C = 180^\\circ - (A + B), \\text{ với } A = 50^\\circ, B = 60^\\circ \\Rightarrow C = ?"}],"reminder":"Bạn tự tính ô ? rồi ghi kết quả nhé!"}`,
  },
  pythagoras: {
    message: "Tam giác ABC vuông tại A có AB = 6, AC = 8. Tính BC",
    raw: R`{"type":"solution","formula_ids":[],"intro":"Tam giác ABC vuông tại A, dùng định lý Pytago để tính cạnh huyền BC.","steps":[{"title":"Xác định dữ kiện","detail":"Đề cho $AB = 6$, $AC = 8$ và $\\angle A = 90^\\circ$.","expression":""},{"title":"Áp dụng định lý Pytago","detail":"Trong tam giác vuông, $BC^2 = AB^2 + AC^2$. Thay các độ dài vào, rồi bạn tự tính $BC$.","expression":"BC = \\sqrt{AB^2 + AC^2}, \\text{ với } AB = 6, AC = 8 \\Rightarrow BC = ?"}],"reminder":"Bạn tự tính giá trị $BC$ rồi ghi kết quả."}`,
  },
  inequality: {
    message: "Cho ba đoạn thẳng có độ dài 3, 4, 5. Ba đoạn này có tạo thành một tam giác không?",
    raw: R`{"type":"solution","formula_ids":[],"intro":"Ta kiểm tra ba đoạn có thỏa bất đẳng thức tam giác hay không.","steps":[{"title":"Kiểm tra bất đẳng thức","detail":"Theo bất đẳng thức tam giác, tổng hai cạnh bất kỳ phải lớn hơn cạnh còn lại. Bạn tự kiểm tra các bất đẳng thức sau:","expression":"3 + 4 > 5,\\; 4 + 5 > 3,\\; 3 + 5 > 4"},{"title":"Kết luận","detail":"Nếu ba bất đẳng thức đều đúng, ba đoạn có thể tạo thành một tam giác. Bạn tự so sánh và đưa ra kết luận.","expression":""}],"reminder":"Bạn kiểm tra các bất đẳng thức và tự kết luận kết quả nhé!"}`,
  },
  // Tam giác cân: AI dùng "hai góc đáy bằng nhau" — ngoài 3 điều đã duyệt → vẫn no_formula (roadmap riêng).
  isosceles: {
    message: "Tam giác ABC cân tại A có góc B = 70°. Tính góc A",
    raw: R`{
  "type":"solution",
  "formula_ids":[],
  "intro":"Tam giác ABC cân tại A nên hai góc ở đáy B và C bằng nhau. Ta dùng tính chất góc của tam giác cân và tổng ba góc của tam giác.",
  "steps":[
    {
      "title":"Xác định dữ kiện",
      "detail":"Tam giác cân tại A ⇒ AB = AC, do đó góc B và góc C bằng nhau. Đề cho \\(\\angle B = 70^\\circ\\).",
      "expression":""
    },
    {
      "title":"Sử dụng tính chất tam giác cân",
      "detail":"Vì tam giác cân tại A nên \\(\\angle C = \\angle B\\).",
      "expression":"C = B \\Rightarrow C = 70^\\circ"
    },
    {
      "title":"Áp dụng tổng ba góc trong tam giác",
      "detail":"Trong mọi tam giác, \\(A + B + C = 180^\\circ\\). Thay \\(B = 70^\\circ\\) và \\(C = 70^\\circ\\) vào, rồi tính \\(A\\).",
      "expression":"A = 180^\\circ - B - C, \\text{ với } B = 70^\\circ, C = 70^\\circ \\Rightarrow A = ?"
    },
    {
      "title":"Kết luận",
      "detail":"Bạn tự tính giá trị của \\(A\\) từ biểu thức trên.",
      "expression":""
    }
  ],
  "reminder":"Bạn tính \\(A\\) ở bước cuối rồi ghi kết quả nhé!"
}`,
  },
  // Hai góc 100° + 90° ≥ 180°: tam giác không tồn tại. Ca góc vô lý là việc riêng (chưa làm) — không hướng
  // dẫn tiếp tới góc âm, giữ no_formula như trước.
  impossibleAngles: {
    message: "Tam giác ABC có góc A = 100°, góc B = 90°. Tính góc C",
    raw: R`{
  "type":"solution",
  "formula_ids":[],
  "intro":"Ta dùng tính chất tổng các góc trong tam giác.",
  "steps":[
    {
      "title":"Xác định dữ kiện",
      "detail":"Tam giác ABC cho góc $A = 100^\\circ$, góc $B = 90^\\circ$.",
      "expression":""
    },
    {
      "title":"Áp dụng tổng góc tam giác",
      "detail":"Trong bất kỳ tam giác nào, $A + B + C = 180^\\circ$. Thay các giá trị đã biết, rồi tự tính $C$.",
      "expression":"C = 180^\\circ - A - B, \\text{với } A = 100^\\circ, B = 90^\\circ \\Rightarrow C = ?"
    }
  ],
  "reminder":"Bạn tự tính giá trị $C$ rồi ghi kết quả nhé!"
}`,
  },
};
const run = (c, extra = {}) => finalizeAnswer(parseModelJson(c.raw), { message: c.message, mask: true, grade: 10, ...extra });

test("câu 1 (A = 50°, B = 60°, tính C): solution, kiến thức nền tổng ba góc, giữ nguyên biểu thức ô trống", () => {
  const { answer, meta } = run(LIVE.angleSum);
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, []);
  assert.equal(answer.steps.length, 2);
  assert.equal(answer.steps[1].expression, R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`);
  assert.equal(answer.intro, "Bài này dùng tính chất tổng các góc trong tam giác.");
  assert.deepEqual(meta.baseKnowledge, { verified: true, kinds: ["angle_sum"] });
  assert.deepEqual(meta.removedSteps, []);
  assert.deepEqual(meta.maskedSteps, []);
  assert.equal(countsAsTurn(answer, meta), true, "câu trả lời thật → tính lượt (khác invalid_data)");
});

test("câu 2 (Pytago, tam giác vuông AB = 6, AC = 8): solution, kiến thức nền Pytago", () => {
  const { answer, meta } = run(LIVE.pythagoras);
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, []);
  assert.equal(answer.steps[1].expression, R`BC = \sqrt{AB^2 + AC^2}, \text{ với } AB = 6, AC = 8 \Rightarrow BC = ?`);
  assert.deepEqual(meta.baseKnowledge, { verified: true, kinds: ["pythagoras"] });
  assert.equal(countsAsTurn(answer, meta), true);
});

test("câu 3 (3, 4, 5 có tạo thành tam giác không): solution, kiến thức nền bất đẳng thức tam giác", () => {
  const { answer, meta } = run(LIVE.inequality);
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, []);
  assert.deepEqual(meta.baseKnowledge, { verified: true, kinds: ["triangle_inequality"] });
  assert.equal(countsAsTurn(answer, meta), true);
  // Bộ lọc "không tính" (không nới) loại dòng `3 + 4 > 5, …` vì nó ghi sẵn đáp án "có" cho câu hỏi; bước được
  // thay bằng bước trung tính — câu chữ KHÔNG được nhắc "thẻ ở trên" (câu trả lời này không có thẻ công thức).
  assert.equal(meta.removedSteps.length, 1);
  assert.equal(answer.steps[0].neutral, true);
  assert.doesNotMatch(answer.steps[0].detail, /thẻ/);
  assert.doesNotMatch(JSON.stringify(answer.steps), /3 \+ 4 > 5/);
  assert.equal(answer.steps.at(-1).title, "Kết luận");
});

test("câu 4 (tam giác cân): KHÔNG mở rộng — vẫn no_formula, hoàn lượt", () => {
  const { answer, meta } = run(LIVE.isosceles);
  assert.equal(answer.type, "no_formula");
  assert.deepEqual(answer.steps, []);
  assert.match(answer.intro, /chưa có công thức/);
  assert.equal(meta.baseKnowledge.verified, false);
  assert.equal(countsAsTurn(answer, meta), false);
});

test("câu 5 (góc 100° + 90°): hai góc ≥ 180° → không hướng dẫn tiếp, giữ no_formula như trước", () => {
  const { answer, meta } = run(LIVE.impossibleAngles);
  assert.equal(answer.type, "no_formula");
  assert.equal(meta.baseKnowledge.verified, false);
  assert.equal(countsAsTurn(answer, meta), false);
});

// ─── Không ảnh hưởng chỗ khác ────────────────────────────────────────────────────────────────
test("có id công thức thì đường cũ, không qua kiểm tra kiến thức nền", () => {
  const raw = LIVE.angleSum.raw.replace('"formula_ids":[]', '"formula_ids":["hh10-dinhly-sin"]');
  const { answer, meta } = finalizeAnswer(parseModelJson(raw), { message: LIVE.angleSum.message, mask: true, grade: 10 });
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh10-dinhly-sin"]);
  assert.equal(meta.baseKnowledge, undefined);
});

test("không phải tam giác (tích phân từng phần) mà formula_ids rỗng → vẫn no_formula", () => {
  const raw = R`{"type":"solution","formula_ids":[],"intro":"Dùng tích phân từng phần.","steps":[{"title":"Đặt","detail":"Đặt $u = x$.","expression":"\\int x e^x dx = ?"}],"reminder":"Bạn tự tính nhé!"}`;
  const { answer, meta } = finalizeAnswer(parseModelJson(raw), { message: "Tính tích phân từ 0 đến 1 của x·e^x dx", mask: true });
  assert.equal(answer.type, "no_formula");
  assert.equal(meta.baseKnowledge.verified, false);
});

test("AI tự báo no_formula thì không qua kiểm tra kiến thức nền", () => {
  const raw = '{"type":"no_formula","formula_ids":[],"intro":"Thư viện chưa có.","steps":[],"reminder":""}';
  const { answer, meta } = finalizeAnswer(parseModelJson(raw), { message: LIVE.angleSum.message, mask: true });
  assert.equal(answer.type, "no_formula");
  assert.equal(meta.baseKnowledge, undefined);
});

test("bộ lọc 'không tính' vẫn chạy trên câu trả lời kiến thức nền: biểu thức ghi sẵn kết quả → không qua", () => {
  const raw = LIVE.angleSum.raw.replace(String.raw`\\Rightarrow C = ?`, String.raw`\\Rightarrow C = 70^\\circ`);
  const { answer } = finalizeAnswer(parseModelJson(raw), { message: LIVE.angleSum.message, mask: true });
  assert.equal(answer.type, "no_formula", "kết quả cuối không phải ô ? → không khớp mẫu");
});

test("lời giải kiến thức nền lộ giá trị trong câu chữ vẫn bị bộ lọc thay bằng ?", () => {
  const raw = LIVE.angleSum.raw.replace("Bạn tự tính $C$.", "Vậy $C = 70^\\\\circ$.");
  const { answer } = finalizeAnswer(parseModelJson(raw), { message: LIVE.angleSum.message, mask: true });
  assert.equal(answer.type, "solution");
  assert.doesNotMatch(JSON.stringify(answer.steps), /70/);
});

// ─── checkBaseKnowledge: mẫu hợp lệ ──────────────────────────────────────────────────────────────
const cand = (...expressions) => ({ intro: "Bài này dùng kiến thức nền.", reminder: "", steps: expressions.map((expression) => ({ title: "", detail: "", expression })) });
const kinds = (c, q) => checkBaseKnowledge(c, q)?.kinds ?? null;
const Q_ANGLE = "Tam giác ABC có góc A = 50°, góc B = 60°. Tính góc C";
const Q_PYTHAGORAS = "Tam giác ABC vuông tại A có AB = 6, AC = 8. Tính BC";
const Q_INEQUALITY = "Cho ba đoạn thẳng có độ dài 3, 4, 5. Ba đoạn này có tạo thành một tam giác không?";

test("tổng ba góc: các cách viết thường gặp đều khớp", () => {
  const forms = [
    R`C = 180^\circ - A - B, \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`,
    R`C = 180^{\circ} - (A + B), \text{ với } A = 50^{\circ}, B = 60^{\circ} \Rightarrow C = ?`,
    R`\widehat{C} = 180^\circ - (\widehat{A} + \widehat{B}), \text{ với } \widehat{A} = 50^\circ, \widehat{B} = 60^\circ \Rightarrow \widehat{C} = ?`,
    R`\angle C = 180^\circ - \angle A - \angle B, \text{ với } \angle A = 50^\circ, \angle B = 60^\circ \Rightarrow \angle C = ?`,
    R`A + B + C = 180^\circ`,
    R`A + B + C = 180^\circ, \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`,
  ];
  for (const f of forms) assert.deepEqual(kinds(cand(f), Q_ANGLE), ["angle_sum"], f);
});

test("tổng ba góc: từ chối khi sai khuôn / sai ẩn / số không có trong đề / có kết quả sẵn", () => {
  const bad = [
    R`C = B \Rightarrow C = 50^\circ`, // tính chất tam giác cân, không phải mẫu đã duyệt
    R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow A = ?`, // ẩn lệch vế trái
    R`C = 180^\circ - (A + B), \text{ với } A = 55^\circ, B = 60^\circ \Rightarrow C = ?`, // 55 không có trong đề
    R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = 70^\circ`, // kết quả sẵn
    R`C = 90^\circ - B, \text{ với } B = 60^\circ \Rightarrow C = ?`, // góc phụ: ngoài 3 điều
    R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ, D = 60^\circ \Rightarrow C = ?`, // dữ kiện ngoài công thức
    R`S = \frac{1}{2} bc \sin A`,
  ];
  for (const f of bad) assert.equal(kinds(cand(f), Q_ANGLE), null, f);
  assert.equal(kinds(cand(R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`, R`C = B`), Q_ANGLE), null, "một bước lạ làm hỏng cả câu");
  assert.equal(checkBaseKnowledge({ intro: "x", steps: [{ title: "a", detail: "Chỉ có chữ, không có biểu thức." }] }, Q_ANGLE), null, "phải có ít nhất một bước thật sự dùng mẫu");
  assert.equal(checkBaseKnowledge({ intro: "x", steps: [] }, Q_ANGLE), null);
});

test("Pytago: tìm cạnh huyền và cạnh góc vuông; dạng bình phương, căn và chuỗi suy ra đều khớp", () => {
  const sum = [
    R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 8 \Rightarrow BC^2 = ?`,
    R`BC = \sqrt{AB^{2} + AC^{2}}, \text{ với } AB = 6, AC = 8 \Rightarrow BC = ?`,
    R`BC^2 = AB^2 + AC^2 \Rightarrow BC = \sqrt{AB^2 + AC^2}, \text{ với } AB = 6, AC = 8 \Rightarrow BC = ?`.replace(String.raw`\Rightarrow BC = \sqrt{AB^2 + AC^2}, \text{ với } AB = 6, AC = 8`, String.raw`\Rightarrow BC = \sqrt{AB^2 + AC^2}`),
    R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 8, \widehat{A} = 90^\circ \Rightarrow BC = ?`,
  ];
  for (const f of sum) assert.deepEqual(kinds(cand(f), Q_PYTHAGORAS), ["pythagoras"], f);
  const Q_LEG = "Tam giác ABC vuông tại A có BC = 13, AB = 5. Tính AC";
  assert.deepEqual(kinds(cand(R`AC^2 = BC^2 - AB^2, \text{ với } BC = 13, AB = 5 \Rightarrow AC^2 = ?`), Q_LEG), ["pythagoras"]);
  assert.deepEqual(kinds(cand(R`AC = \sqrt{BC^2 - AB^2}, \text{ với } BC = 13, AB = 5 \Rightarrow AC = ?`), Q_LEG), ["pythagoras"]);
});

test("Pytago: từ chối khi đề không nói vuông, đề vô lý (huyền ≤ cạnh góc vuông), ẩn lệch, số lạ", () => {
  const f = R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 8 \Rightarrow BC^2 = ?`;
  assert.equal(kinds(cand(f), "Tam giác ABC có AB = 6, AC = 8. Tính BC"), null, "không có 'vuông' trong đề");
  const leg = R`AC^2 = BC^2 - AB^2, \text{ với } BC = 5, AB = 13 \Rightarrow AC^2 = ?`;
  assert.equal(kinds(cand(leg), "Tam giác ABC vuông tại A có BC = 5, AB = 13. Tính AC"), null, "cạnh huyền 5 < cạnh góc vuông 13");
  assert.equal(kinds(cand(R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 8 \Rightarrow AB = ?`), Q_PYTHAGORAS), null, "ẩn lệch vế trái");
  assert.equal(kinds(cand(R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 9 \Rightarrow BC^2 = ?`), Q_PYTHAGORAS), null, "9 không có trong đề");
  assert.equal(kinds(cand(R`BC^2 = AB^2 + AC^2, \text{ với } AB = 6, AC = 8 \Rightarrow BC^2 = 100`), Q_PYTHAGORAS), null, "kết quả sẵn");
});

test("bất đẳng thức tam giác: dạng số và dạng ký hiệu; số lạ hoặc tổng đã tính thì từ chối", () => {
  assert.deepEqual(kinds(cand(R`3 + 4 > 5,\; 4 + 5 > 3,\; 3 + 5 > 4`), Q_INEQUALITY), ["triangle_inequality"]);
  assert.deepEqual(kinds(cand(R`a + b > c, b + c > a, c + a > b, \text{ với } a = 3, b = 4, c = 5`), Q_INEQUALITY), ["triangle_inequality"]);
  assert.equal(kinds(cand(R`3 + 4 > 9`), Q_INEQUALITY), null, "9 không có trong đề");
  assert.equal(kinds(cand(R`3 + 4 = 7 > 5`), Q_INEQUALITY), null, "tổng đã tính");
  assert.equal(kinds(cand(R`3 + 4 > 5 \Rightarrow ?`), Q_INEQUALITY), null);
});

// ─── Ngữ cảnh và các trường hợp KHÔNG mở rộng ───────────────────────────────────────────────────
test("đề không có ngữ cảnh tam giác → null dù biểu thức khớp mẫu", () => {
  const f = R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`;
  assert.equal(kinds(cand(f), "Tính tích phân từ 50 đến 60 của x dx"), null);
  assert.equal(hasTriangleContext("Tính tích phân từ 0 đến 1"), false);
  for (const ok of ["Tam giác ABC có A = 50°", "Tam giac ABC co goc A = 50", "Cho ABC có góc A = 50°, góc B = 60°. Tính góc C", "Ba cạnh 3, 4, 5 có tạo thành không?", "△ABC có BC = 6"]) {
    assert.equal(hasTriangleContext(ok), true, ok);
  }
});

test("tam giác cân / đều: vẫn null (roadmap riêng), kể cả khi biểu thức khớp mẫu tổng ba góc", () => {
  const f = R`A = 180^\circ - B - C, \text{ với } B = 70^\circ, C = 70^\circ \Rightarrow A = ?`;
  assert.equal(kinds(cand(f), "Tam giác ABC cân tại A có góc B = 70°. Tính góc A"), null);
  assert.equal(kinds(cand(f), "Cho tam giác cân ABC, góc đáy B = 70°. Tính góc ở đỉnh A"), null, "chưa thấy 'tại' nhưng 'tam giác cân'");
  assert.equal(kinds(cand(f), "Tam giác ABC đều. Tính góc A"), null);
  assert.equal(kinds(cand(f), "Tam giác ABC vuông cân tại A. Tính góc B"), null);
  assert.equal(kinds(cand(f), "Tam giac ABC can tai A co goc B = 70. Tinh goc A"), null, "gõ không dấu");
  // Đề không nói cân nhưng lời giải của AI dựa vào tính chất tam giác cân → vẫn từ chối.
  const good = R`C = 180^\circ - (A + B), \text{ với } A = 50^\circ, B = 60^\circ \Rightarrow C = ?`;
  assert.equal(checkBaseKnowledge({ intro: "Vì tam giác cân nên hai góc đáy bằng nhau.", steps: [{ title: "", detail: "", expression: good }] }, Q_ANGLE), null);
});

test("từ 'cần' không bị nhầm là 'cân'", () => {
  assert.deepEqual(kinds(cand(R`BC = \sqrt{AB^2 + AC^2}, \text{ với } AB = 6, AC = 8 \Rightarrow BC = ?`), "Tam giác ABC vuông tại A, cần tính BC biết AB = 6, AC = 8"), ["pythagoras"]);
  assert.deepEqual(kinds(cand(R`BC = \sqrt{AB^2 + AC^2}, \text{ với } AB = 6, AC = 8 \Rightarrow BC = ?`), "Tam giac ABC vuong tai A, can tinh BC biet AB = 6, AC = 8"), ["pythagoras"]);
});

test("Pytago đảo (chứng minh / có phải tam giác vuông không): vẫn null", () => {
  const f = R`BC^2 = AB^2 + AC^2`;
  assert.equal(kinds(cand(f), "Tam giác ABC có AB = 6, AC = 8, BC = 10. Tam giác ABC có phải tam giác vuông không?"), null);
  assert.equal(kinds(cand(f), "Chứng minh tam giác ABC có AB = 6, AC = 8, BC = 10 là tam giác vuông"), null);
  assert.equal(kinds(cand(f), "Tam giác ABC có AB = 6, AC = 8, BC = 10 vuông không?"), null);
  assert.equal(kinds(cand(f), "Áp dụng định lý Pytago đảo cho tam giác ABC vuông tại A có AB = 6, AC = 8"), null);
  assert.equal(checkBaseKnowledge({ intro: "Dùng định lý Pytago đảo.", steps: [{ title: "", detail: "", expression: f }] }, Q_PYTHAGORAS), null);
});

test("bất đẳng thức tam giác khi ba cạnh thật sự vô lý: vẫn do invalid_data xử lý, không bị kiểm tra này chen vào", () => {
  const raw = R`{"type":"invalid_data","formula_ids":[],"intro":"Ba cạnh này không tạo thành tam giác.","steps":[],"reminder":"","sides":["1","2","4"]}`;
  const { answer, meta } = finalizeAnswer(parseModelJson(raw), { message: "Tam giác có ba cạnh 1, 2, 4, dùng công thức Hê-rông tính diện tích.", mask: true });
  assert.equal(answer.type, "invalid_data");
  assert.equal(meta.baseKnowledge, undefined);
});
