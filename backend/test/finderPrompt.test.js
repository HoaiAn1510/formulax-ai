import { test } from "node:test";
import assert from "node:assert/strict";
import { FINDER_SYSTEM_PROMPT, buildFinderMessages, buildLibraryMessage, buildSystemPrompt } from "../lib/finderPrompt.js";
import { shortlistFormulas } from "../lib/formulaCatalog.js";
import { askFinder, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";

// Prompt caching của Groq chỉ có tác dụng khi phần ĐẦU prompt giống hệt nhau giữa các lần gọi.
const QUESTIONS = [
  "Cho tam giác ABC có AB = 6, AC = 8, góc A = 60°. Tính BC",
  "Tìm cực trị của hàm số y = x^3 - 3x",
  "Tính tổng 20 số hạng đầu của cấp số cộng có u1 = 2, d = 3",
];

test("prompt caching: tin system #1 giống hệt nhau ở mọi đề, thư viện nằm ở tin #2", () => {
  const all = QUESTIONS.map((q) => buildFinderMessages({ candidates: shortlistFormulas([q]), message: q }));
  for (const msgs of all) {
    assert.equal(msgs[0].role, "system");
    assert.equal(msgs[0].content, FINDER_SYSTEM_PROMPT);
    assert.equal(msgs[1].role, "system");
    assert.match(msgs[1].content, /^THƯ VIỆN \(id \| lớp \| tên \| công thức \| ghi chú\):\n/);
  }
  // Thư viện khác nhau giữa các đề (đúng là phần thay đổi) nhưng tin #1 thì không.
  assert.notEqual(all[0][1].content, all[1][1].content);
});

test("prompt caching: phần cố định không chứa gì thay đổi theo đề/người dùng", () => {
  assert.doesNotMatch(FINDER_SYSTEM_PROMPT, /THƯ VIỆN \(id/); // thư viện không lẫn vào tin #1
  assert.doesNotMatch(FINDER_SYSTEM_PROMPT, /\$\{/); // không còn chỗ chèn biến nào
  assert.doesNotMatch(FINDER_SYSTEM_PROMPT, /\b20\d\d-\d\d-\d\d\b/); // không có ngày
});

test("thứ tự tin nhắn: cố định → thư viện → lịch sử → câu hỏi ở cuối", () => {
  const history = [{ role: "user", content: "câu trước" }, { role: "assistant", content: "trả lời trước" }];
  const msgs = buildFinderMessages({ candidates: [], history, message: "câu mới" });
  assert.deepEqual(msgs.map((m) => m.role), ["system", "system", "user", "assistant", "user"]);
  assert.equal(msgs.at(-1).content, "câu mới");
  assert.equal(msgs[1].content, buildLibraryMessage([]));
});

test("buildSystemPrompt (cho test/script cũ) = phần cố định + thư viện", () => {
  assert.equal(buildSystemPrompt([]), `${FINDER_SYSTEM_PROMPT}\n\n${buildLibraryMessage([])}`);
});

test("askFinder gửi Groq đúng 2 tin system đầu, tin #1 là phần cố định; lần hỏi lại giữ nguyên phần đầu", async () => {
  const sent = [];
  const leaky = JSON.stringify({ type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Dùng thể tích khối cầu.",
    steps: [{ title: "Tính", detail: "Ta có $V = 288\\pi$.", expression: "" }], reminder: "Tự tính nhé!" });
  const clean = JSON.stringify({ type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Dùng thể tích khối cầu.",
    steps: [{ title: "Áp dụng", detail: "Bạn tự tính $V$.", expression: "V = \\frac{4}{3}\\pi R^3, \\text{ với } R = 6 \\Rightarrow V = ?" }], reminder: "Tự tính nhé!" });
  const replies = [leaky, clean];
  const groq = { chat: { completions: { create: async (body) => {
    sent.push(body.messages);
    return { choices: [{ message: { content: replies[sent.length - 1] } }], usage: { prompt_tokens: 10, completion_tokens: 1, prompt_tokens_details: { cached_tokens: 8 } } };
  } } } };
  const clock = { t: 0 };
  const { meta } = await askFinder({ groq, message: "Tính thể tích khối cầu bán kính 6 cm", now: () => clock.t, deadline: CHAT_BUDGET_MS });
  assert.equal(sent.length, 2); // lần đầu lộ số → hỏi lại
  for (const msgs of sent) {
    assert.equal(msgs[0].content, FINDER_SYSTEM_PROMPT);
    assert.equal(msgs[1].role, "system");
  }
  // Lần hỏi lại = nguyên tin nhắn lần đầu + 2 tin nối thêm → phần đầu trùng khớp, cache được.
  assert.deepEqual(sent[1].slice(0, sent[0].length), sent[0]);
  assert.equal(meta.cachedTokens, 16);
});

// ─── Lớp của học sinh (2026-10-08) ───────────────────────────────────────────
test("lớp học sinh: tin system riêng ngay trước đề; chưa chọn lớp thì không có; tin #1 vẫn giống hệt", () => {
  const q = "Hàm số y = x² − 6x + 5 đồng biến trên khoảng nào?";
  const history = [{ role: "user", content: "câu trước" }, { role: "assistant", content: "trả lời trước" }];
  const withGrade = buildFinderMessages({ candidates: [], history, message: q, grade: 10 });
  assert.deepEqual(withGrade.map((m) => m.role), ["system", "system", "user", "assistant", "system", "user"]);
  assert.equal(withGrade.at(-2).content, "Học sinh đang học lớp 10.");
  assert.equal(withGrade.at(-1).content, q); // đề giữ nguyên, không ghép "lớp 10" vào (bộ lọc số)
  assert.equal(withGrade[0].content, FINDER_SYSTEM_PROMPT);
  for (const grade of [null, undefined, 9, "10"]) {
    const msgs = buildFinderMessages({ candidates: [], message: q, grade });
    assert.equal(msgs.some((m) => m.content.startsWith("Học sinh đang học lớp")), false, String(grade));
  }
});

test("quy tắc 1d trong phần cố định; mỗi dòng thư viện có cột lớp", () => {
  assert.match(FINDER_SYSTEM_PROMPT, /Ưu tiên phương pháp và công thức trong chương trình của lớp học sinh\. Chỉ dùng công thức của lớp cao hơn khi không có cách nào trong chương trình lớp đó\./);
  const lib = buildLibraryMessage(shortlistFormulas(["Tìm cực trị của y = x^3 - 3x"]));
  assert.match(lib, /^gt12-daoham-basic \| lớp 11 \|/m); // tiền tố id nói 12 nhưng lớp thật là 11
  assert.match(lib, /^gt12-cuctrituoc \| lớp 12 \|/m);
});

test("askFinder gửi dòng lớp học sinh khi biết lớp", async () => {
  const sent = [];
  const reply = JSON.stringify({ type: "solution", formula_ids: ["hh10-parabola"], intro: "Dùng đỉnh parabol.", steps: [{ title: "Tìm hoành độ đỉnh", detail: "Bạn tự tính.", expression: String.raw`x_I = -\frac{b}{2a}, \text{ với } a = 1, b = -6 \Rightarrow x_I = ?` }], reminder: "Tự tính nhé!" });
  const groq = { chat: { completions: { create: async (body) => { sent.push(body.messages); return { choices: [{ message: { content: reply } }], usage: {} }; } } } };
  await askFinder({ groq, message: "Hàm số y = x² − 6x + 5 đồng biến trên khoảng nào?", grade: 10, now: () => 0, deadline: CHAT_BUDGET_MS });
  assert.equal(sent[0].at(-2).content, "Học sinh đang học lớp 10.");
});

test("quy tắc 1e (thuật ngữ SGK): parabol, dấu chấm phẩy trong khoảng/tọa độ", () => {
  const rule = FINDER_SYSTEM_PROMPT.split("\n").find((l) => l.startsWith("1e."));
  assert.ok(rule);
  assert.match(rule, /viết "parabol" \(không viết "parabola"\)/);
  assert.match(rule, /dấu chấm phẩy/);
  assert.match(rule, /\(-\\infty; x_I\), A\(1; 5\)/);
});
