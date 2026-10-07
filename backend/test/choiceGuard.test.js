import { test } from "node:test";
import assert from "node:assert/strict";
import { isMultipleChoiceQuestion, findChoiceReveals, stripChoiceReveals, guardChoiceReveals } from "../lib/choiceGuard.js";
import { askFinder, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";
import { FINDER_SYSTEM_PROMPT } from "../lib/finderPrompt.js";

const R = String.raw;
// Đề trắc nghiệm thật trong ảnh thử OCR (2026-10-07), đúng dạng Gemini chép ra.
const MC_Q = R`(Trắc nghiệm) Hàm số $y = x^2 - 6x + 5$ đồng biến trên khoảng nào?
A. $(-\infty; 3)$ B. $(3; +\infty)$ C. $(-\infty; 6)$ D. $(5; +\infty)$`;

test("nhận diện đề trắc nghiệm: chữ 'trắc nghiệm' hoặc đủ nhãn A. B. C.", () => {
  assert.equal(isMultipleChoiceQuestion(MC_Q), true);
  assert.equal(isMultipleChoiceQuestion("Hàm số nào đồng biến?\nA. y = x\nB. y = -x\nC. y = 1\nD. y = -2x"), true);
  assert.equal(isMultipleChoiceQuestion("Câu 3: ... A) 1  B) 2  C) 3  D) 4"), true);
  // Bài thường có tên điểm A, B, C — không phải trắc nghiệm.
  assert.equal(isMultipleChoiceQuestion("Cho tam giác ABC có AB = 6, AC = 8 và góc A = 60°. Tính BC"), false);
  assert.equal(isMultipleChoiceQuestion("Xác định parabol đi qua điểm A(1; 5) và B(2; 3)"), false);
});

test("bắt các cụm nói phương án đúng", () => {
  const caught = [
    "Vậy đáp án là B.",
    "Đáp án đúng là $B$.",
    "Ta chọn B.",
    "Chọn đáp án C nhé.",
    "Phương án C đúng.",
    "Như vậy B là đáp án đúng.",
    "Đáp án: (D)",
    "Câu trả lời là **A**.",
    "(B) đúng vì hàm số đồng biến khi x > 3.",
  ];
  for (const s of caught) assert.notDeepEqual(findChoiceReveals(s), [], s);
});

test("không bắt khi chỉ nhắc tới các phương án hoặc dùng A, B làm tên điểm/biểu thức", () => {
  const fine = [
    "Bạn tự tính rồi đối chiếu với các phương án A, B, C, D nhé.",
    "So sánh kết quả với phương án A, B, C và D.",
    "Đối chiếu với các đáp án đã cho.",
    "Hàm số đồng biến trên khoảng $(x_0; +\\infty)$ — bạn tự tìm $x_0$.",
    "Thay tọa độ điểm $A(1; 5)$ vào phương trình.",
    "Xét tam giác ABC đúng theo quy ước.",
  ];
  for (const s of fine) assert.deepEqual(findChoiceReveals(s), [], s);
});

test("strip: chỉ bỏ câu có cụm nói phương án đúng, giữ các câu còn lại", () => {
  assert.equal(
    stripChoiceReveals("Bạn tự tính $x_0$. Vậy đáp án là B. Nhớ đối chiếu với các phương án nhé!"),
    "Bạn tự tính $x_0$. Nhớ đối chiếu với các phương án nhé!",
  );
  assert.equal(stripChoiceReveals("Không có gì cần bỏ."), "Không có gì cần bỏ.");
});

test("guardChoiceReveals: phát hiện ở intro/steps/reminder; strip = true thì bỏ, tiêu đề rỗng được thay", () => {
  const answer = {
    type: "solution", formulaIds: ["x"], intro: "Bài này xét tính đơn điệu. Đáp án đúng là B.",
    steps: [{ title: "Chọn đáp án B", detail: "Vì vậy ta chọn B.", expression: "" }],
    reminder: "Bạn tự tính nhé!",
  };
  const detect = guardChoiceReveals(answer);
  assert.ok(detect.reveals.length >= 2);
  assert.equal(detect.answer.intro, answer.intro); // chỉ phát hiện, chưa sửa
  const { answer: stripped } = guardChoiceReveals(answer, { strip: true });
  assert.equal(stripped.intro, "Bài này xét tính đơn điệu.");
  assert.equal(stripped.steps[0].title, "Đối chiếu với các phương án");
  assert.equal(stripped.steps[0].detail, "");
});

// ─── Nối vào askFinder ───────────────────────────────────────────────────────
const mcAnswer = (extra) => JSON.stringify({
  type: "solution", formula_ids: ["ds10-phuongtrinh-bac2"], intro: "Bài này xét tính đồng biến của hàm bậc hai." + extra,
  steps: [{ title: "Tìm hoành độ đỉnh", detail: "Dùng $x_0 = -\\frac{b}{2a}$ với $a = 1$, $b = -6$. Bạn tự tính $x_0$.", expression: "x_0 = -\\frac{b}{2a}, \\text{ với } a = 1, b = -6 \\Rightarrow x_0 = ?" }],
  reminder: "Bạn tự tính $x_0$ rồi đối chiếu với các phương án nhé!",
});

function captureGroq(replies) {
  const sent = [];
  return { sent, chat: { completions: { create: async (body) => {
    sent.push(body);
    return { choices: [{ message: { content: replies[sent.length - 1] } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
  } } } };
}

test("trắc nghiệm: AI nói 'đáp án B' → hỏi lại một lần; bản viết lại sạch được dùng", async () => {
  const groq = captureGroq([mcAnswer(" Đáp án đúng là B."), mcAnswer("")]);
  const clock = { t: 0 };
  const { answer, meta } = await askFinder({ groq, message: MC_Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(groq.sent.length, 2);
  assert.match(groq.sent[1].messages.at(-1).content, /nói ra phương án trắc nghiệm đúng/);
  assert.doesNotMatch(answer.intro, /Đáp án/);
  assert.deepEqual(meta.choiceReveals, []);
});

test("trắc nghiệm: bản viết lại vẫn nói phương án → câu đó bị bỏ khỏi câu trả lời", async () => {
  const groq = captureGroq([mcAnswer(" Chọn B."), mcAnswer(" Vậy ta chọn B.")]);
  const clock = { t: 0 };
  const { answer } = await askFinder({ groq, message: MC_Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(answer.intro, "Bài này xét tính đồng biến của hàm bậc hai.");
});

test("bài thường (không trắc nghiệm): 'chọn A' là tên điểm, không bị coi là lộ phương án", async () => {
  const groq = captureGroq([mcAnswer(" Chọn A làm gốc tọa độ.")]);
  const clock = { t: 0 };
  const { answer, meta } = await askFinder({ groq, message: "Hàm số y = x^2 - 6x + 5 đồng biến trên khoảng nào?", now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(groq.sent.length, 1);
  assert.match(answer.intro, /Chọn A làm gốc/);
  assert.deepEqual(meta.choiceReveals, []);
});

test("prompt có quy tắc trắc nghiệm trong phần cố định", () => {
  assert.match(FINDER_SYSTEM_PROMPT, /BÀI TRẮC NGHIỆM[^\n]*KHÔNG nói phương án nào đúng/);
});
