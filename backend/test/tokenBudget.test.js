import { test } from "node:test";
import assert from "node:assert/strict";
import { askFinder, parseTpmOverflow, reducedCompletionTokens, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";
import { FINDER_PARAMS, FINDER_SYSTEM_PROMPT, buildLibraryMessage } from "../lib/finderPrompt.js";
import { shortlistFormulas, formatForPrompt, SHORTLIST_SIZE, PROMPT_NOTE_MAX } from "../lib/formulaCatalog.js";
import { formulas } from "../../FormulaX-AI/src/data/formulas.js";

// Lỗi 413 của gói Groq miễn phí (2026-10-22): prompt + max_completion_tokens > 8.000 token/yêu cầu.
// Hai câu chấm bị từ chối: 5.529 + 2.500 = 8.029 và 5.533 + 2.500 = 8.033; production ngày 20/10: 8.091.

const tpmMessage = (requested) => `Request too large for model \`openai/gpt-oss-120b\` in organization \`org_x\` service tier \`on_demand\` on tokens per minute (TPM): Limit 8000, Requested ${requested}, please reduce your message size and try again. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing`;
/** Lỗi giống groq-sdk: status, error (thân JSON đã parse), message "413 {…json…}". */
function groqError413(requested) {
  const message = tpmMessage(requested);
  return Object.assign(new Error(`413 ${JSON.stringify({ error: { message, type: "tokens", code: "rate_limit_exceeded" } })}`), {
    status: 413,
    error: { error: { message, type: "tokens", code: "rate_limit_exceeded" } },
  });
}

test("cấu hình: max_completion_tokens 2300, 8 ứng viên, ghi chú công thức tối đa 100 ký tự", () => {
  assert.equal(FINDER_PARAMS.max_completion_tokens, 2300);
  assert.equal(SHORTLIST_SIZE, 8);
  assert.equal(PROMPT_NOTE_MAX, 100);
  for (const f of formulas) {
    const line = formatForPrompt(f);
    const prefix = `${f.id} | lớp ${f.grade} | ${f.name} | ${f.latex} | `;
    assert.ok(line.startsWith(prefix), f.id);
    assert.ok(line.length - prefix.length <= PROMPT_NOTE_MAX, `${f.id}: ghi chú ${line.length - prefix.length} ký tự`);
  }
});

test("shortlistFormulas mặc định trả tối đa 8 công thức; askFinder gửi đúng 8 ứng viên", async () => {
  assert.equal(shortlistFormulas(["Cho tam giác ABC có AB = 6, AC = 8 và góc A = 60°. Tính BC"]).length, SHORTLIST_SIZE);
  const clock = { t: 0 };
  const groq = { chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ type: "off_topic", formula_ids: [], intro: "Mình chỉ hỗ trợ toán nhé." }) } }], usage: {} }) } } };
  const { meta } = await askFinder({ groq, message: "Cho tam giác ABC có AB = 6, AC = 8 và góc A = 60°. Tính BC", now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(meta.candidates.length, SHORTLIST_SIZE);
});

// Ước lượng token (tỉ lệ ký tự/token đo bằng usage của Groq 2026-10-22: system #1 11.778 ký tự = 4.163
// token → 2,83; thư viện 3.253 ký tự = 1.249 token → 2,6; +150 cho câu hỏi và khung hội thoại). Không
// thay cho số đo thật nhưng bắt được việc ai đó phình prompt trở lại.
const estimateRequestTokens = (question, grade) => {
  const library = buildLibraryMessage(shortlistFormulas([question], SHORTLIST_SIZE, { grade }));
  return Math.round(FINDER_SYSTEM_PROMPT.length / 2.83 + library.length / 2.6 + 150) + FINDER_PARAMS.max_completion_tokens;
};
test("ngân sách token (ước lượng): prompt + max_completion_tokens còn biên dưới 8.000 ở các câu hỏi đại diện", () => {
  const cases = [
    ["Cho tam giác ABC có AB = 6, AC = 8 và góc A = 60°. Tính BC", 10],
    ["Tính diện tích tam giác có ba cạnh 5, 12, 13", 10],
    ["Tìm tọa độ đỉnh của parabol y = -x^2 + 2x + 3", 10],
    ["Tìm cực trị của hàm số y = x^3 - 3x^2 - 9x + 5", 12],
    ["Viết phương trình mặt phẳng đi qua A(1;2;3) vuông góc với đường thẳng d", 12],
    ["Giải phương trình log2(x) + log2(x-1) = 1", 11],
  ];
  for (const [q, grade] of cases) {
    const estimate = estimateRequestTokens(q, grade);
    assert.ok(estimate <= 7800, `${q}: ước lượng ${estimate} token (cần ≤ 7.600, trần Groq 8.000)`);
  }
});

test("parseTpmOverflow: đọc Limit/Requested từ đúng thông báo của Groq (ca 413 cũ 8.029, 8.033, 8.091)", () => {
  for (const requested of [8029, 8033, 8091]) {
    assert.deepEqual(parseTpmOverflow(groqError413(requested)), { limit: 8000, requested });
  }
  // Chỉ có message (không có thân error đã parse) vẫn đọc được.
  assert.deepEqual(parseTpmOverflow(Object.assign(new Error(`413 ${tpmMessage(8100)}`), { status: 413 })), { limit: 8000, requested: 8100 });
});

test("parseTpmOverflow: không phải 413 TPM (429, 413 của ảnh, 413 không có số) → null", () => {
  assert.equal(parseTpmOverflow(Object.assign(new Error("429"), { status: 429, error: { error: { message: tpmMessage(8100) } } })), null);
  assert.equal(parseTpmOverflow(Object.assign(new Error("413 Payload too large"), { status: 413 })), null);
  assert.equal(parseTpmOverflow(Object.assign(new Error("413 tokens per minute (TPM) exceeded"), { status: 413 })), null);
  assert.equal(parseTpmOverflow(new Error("boom")), null);
});

test("reducedCompletionTokens: bớt đúng phần vượt + biên 100; dưới 1.200 hoặc không vượt thì null", () => {
  assert.equal(reducedCompletionTokens(groqError413(8029), 2000), 1871); // 2000 − 29 − 100
  assert.equal(reducedCompletionTokens(groqError413(8091), 2000), 1809);
  assert.equal(reducedCompletionTokens(groqError413(8500), 2000), 1400);
  assert.equal(reducedCompletionTokens(groqError413(8700), 2000), 1200); // đúng mức tối thiểu
  assert.equal(reducedCompletionTokens(groqError413(8701), 2000), null); // chỉ còn 1.199
  assert.equal(reducedCompletionTokens(groqError413(9500), 2000), null);
  assert.equal(reducedCompletionTokens(groqError413(7900), 2000), null); // Requested ≤ Limit: không phải vượt
  assert.equal(reducedCompletionTokens(new Error("boom"), 2000), null);
});

// ─── Nối vào askFinder ───────────────────────────────────────────────────────
const Q = "Tính thể tích khối cầu bán kính 6 cm";
const GOOD = JSON.stringify({
  type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Dùng công thức thể tích khối cầu.",
  steps: [{ title: "Áp dụng công thức", detail: "Bạn tự tính $V$.", expression: "V = \\frac{4}{3}\\pi R^3, \\text{ với } R = 6 \\Rightarrow V = ?" }], reminder: "Tự tính nhé!",
});
function seqGroq(replies, clock) {
  const bodies = [];
  return {
    bodies,
    chat: { completions: { create: async (body, opts) => {
      bodies.push({ ...body, timeout: opts.timeout });
      clock.t += 300;
      const r = replies[bodies.length - 1];
      if (r instanceof Error) throw r;
      return { choices: [{ message: { content: r } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
    } } },
  };
}

test("gặp 413 (Requested 8029) → gọi lại MỘT lần với max_completion_tokens 1871, câu hỏi vẫn được trả lời", async () => {
  const clock = { t: 0 };
  const groq = seqGroq([groqError413(8029), GOOD], clock);
  const { answer, meta } = await askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.deepEqual(groq.bodies.map((b) => b.max_completion_tokens), [2300, 2171]);
  assert.equal(answer.type, "solution");
  assert.deepEqual(answer.formulaIds, ["hh12-matcau-thetich"]);
  assert.deepEqual(meta.reducedForTpm, { from: 2300, to: 2171, requested: 8029, limit: 8000 });
  assert.equal(meta.attempts, 1, "413 bị từ chối ngay — không tính là một lần gọi của vòng lặp JSON");
  assert.equal(groq.bodies[1].model, groq.bodies[0].model);
  assert.deepEqual(groq.bodies[1].messages, groq.bodies[0].messages, "gọi lại đúng prompt cũ, chỉ đổi max_completion_tokens");
  assert.ok(groq.bodies[1].timeout >= 1 && groq.bodies[1].timeout <= 25_000);
});

test("413 hai lần liên tiếp → ném lỗi (không gọi lần ba, không lặp vô hạn)", async () => {
  const clock = { t: 0 };
  const groq = seqGroq([groqError413(8029), groqError413(8029), GOOD], clock);
  await assert.rejects(askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS }), (e) => e.status === 413);
  assert.equal(groq.bodies.length, 2);
});

test("413 vượt quá nhiều (còn dưới 1.200 token) → không gọi lại, ném lỗi như trước", async () => {
  const clock = { t: 0 };
  const groq = seqGroq([groqError413(9500), GOOD], clock);
  await assert.rejects(askFinder({ groq, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS }), (e) => e.status === 413);
  assert.equal(groq.bodies.length, 1);
});

test("lỗi 429 và 413 không phải TPM không bị gọi lại bằng cơ chế 413", async () => {
  const clock = { t: 0 };
  const e429 = Object.assign(new Error("429 rate limit (TPM): Limit 8000, Requested 8100"), { status: 429 });
  const groq429 = seqGroq([e429, GOOD], clock);
  await assert.rejects(askFinder({ groq: groq429, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS }), (e) => e.status === 429);
  assert.equal(groq429.bodies.length, 1);
  const groqOther413 = seqGroq([Object.assign(new Error("413 Payload too large"), { status: 413 }), GOOD], clock);
  await assert.rejects(askFinder({ groq: groqOther413, message: Q, now: () => clock.t, deadline: CHAT_BUDGET_MS }), (e) => e.status === 413);
  assert.equal(groqOther413.bodies.length, 1);
});

test("lần hỏi lại vì lộ số cũng được bảo vệ: retry gặp 413 → gọi lại với mức thấp hơn, bản viết lại sạch được dùng", async () => {
  const leaky = (expr) => JSON.stringify({
    type: "solution", formula_ids: ["gt12-daoham-basic"], intro: "Dùng đạo hàm.",
    steps: [{ title: "Giải y' = 0", detail: "Giải $y' = 0$. Bạn tự tính $x^2$.", expression: expr }], reminder: "Bạn tự tính nhé!",
  });
  const clock = { t: 0 };
  const groq = seqGroq([leaky("3x^2 - 3 = 0 \\Rightarrow x^2 = 1"), groqError413(8200), leaky("3x^2 - 3 = 0 \\Rightarrow x^2 = ?")], clock);
  const { answer, meta } = await askFinder({ groq, message: "Tìm cực trị của hàm số y = x³ − 3x + 2.", now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.deepEqual(groq.bodies.map((b) => b.max_completion_tokens), [2300, 2000, 1700]);
  assert.deepEqual(meta.reducedForTpm, { from: 2000, to: 1700, requested: 8200, limit: 8000 });
  assert.equal(answer.steps[0].expression, "3x^2 - 3 = 0 \\Rightarrow x^2 = ?");
});
