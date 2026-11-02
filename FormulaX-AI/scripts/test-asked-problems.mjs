// Hàm thuần của "Bài đã hỏi" + "Luyện lại dạng bài" + Dashboard "Hôm nay":
// utils/askedProblems.js, utils/variantQuiz.js, utils/todayPlan.js. Chạy: npm run test:asked
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractAskedProblems, isFollowUpQuestion, togglePick, formatAskedAt, MAX_VARIANT_PICK } from "../src/utils/askedProblems.js";
import { toVariantQuestion, variantQuizTopic, runSequential } from "../src/utils/variantQuiz.js";
import { buildGoals, isNewLearner, headline, nextStep, lastSevenDays } from "../src/utils/todayPlan.js";

const T = Date.UTC(2026, 10, 1, 3, 0); // 10:00 giờ VN, 01/11/2026
const answer = (type, formulaIds) => ({ type, formulaIds, intro: "", steps: [], reminder: "" });

test("extractAskedProblems: chỉ lấy đề có câu trả lời hướng dẫn, mới nhất trước, bỏ trùng", () => {
  const sessions = [
    { id: "s1", updatedAt: "2026-10-30T10:00:00Z", messages: [
      { id: T - 5000, sender: "user", text: "Giải x^2 - 5x + 6 = 0" },
      { id: T - 4999, sender: "bot", text: "...", answer: answer("solution", ["ds10-phuongtrinh-bac2"]) },
      { id: T - 4000, sender: "user", text: "chào bạn" },
      { id: T - 3999, sender: "bot", text: "...", answer: answer("off_topic", []) },
      { id: T - 3000, sender: "user", text: "Tính tích phân lạ" },
      { id: T - 2999, sender: "bot", text: "...", answer: answer("no_formula", []) },
      { id: T - 2000, sender: "user", text: "Bài lỗi mạng" },
      { id: T - 1999, sender: "bot", text: "Lỗi", isError: true },
    ] },
    { id: "s2", messages: [
      { id: T - 1000, sender: "user", text: "giải  X^2 - 5x + 6 = 0" }, // trùng đề s1, hỏi sau → giữ bản này
      { id: T - 999, sender: "bot", text: "...", answer: answer("solution", ["ds10-phuongtrinh-bac2"]) },
      { id: T - 500, sender: "user", text: "Tam giác vuông AB = 6, AC = 8, tính BC" },
      { id: T - 499, sender: "bot", text: "...", answer: answer("solution", []) }, // kiến thức nền, không có id
      { id: 7, sender: "user", text: "Đề cũ" },
      { id: 8, sender: "bot", text: "...", aiResult: { id: "hh10-cosin", name: "Định lý côsin" } }, // định dạng cũ
    ] },
  ];
  const items = extractAskedProblems(sessions);
  assert.deepEqual(items.map((i) => i.text), ["Tam giác vuông AB = 6, AC = 8, tính BC", "giải  X^2 - 5x + 6 = 0", "Đề cũ"]);
  assert.equal(items[1].sessionId, "s2");
  assert.deepEqual(items[0].formulaIds, []);
  assert.deepEqual(items[2].formulaIds, ["hh10-cosin"]);
  assert.equal(items[2].askedAt, 0); // id không phải thời điểm, phiên không có ngày
  assert.deepEqual(extractAskedProblems(null), []);
});

test("extractAskedProblems: câu hỏi lại về bài vừa hỏi không tính là bài mới (chạy thật 2026-11-02)", () => {
  const sessions = [{ id: "s3", messages: [
    { id: T - 300, sender: "user", text: "Hình chóp S.ABCD có đáy là hình vuông cạnh 3 và chiều cao 4. Tính thể tích." },
    { id: T - 299, sender: "bot", text: "...", answer: answer("solution", ["hh11-the-tich-chop"]) },
    { id: T - 200, sender: "user", text: "Tính thể tích khối cầu bán kính R = 3." },
    { id: T - 199, sender: "bot", text: "...", answer: answer("solution", ["hh12-the-tich-cau"]) },
    { id: T - 100, sender: "user", text: "tui chưa hiểu bước 2" },
    { id: T - 99, sender: "bot", text: "...", answer: answer("solution", ["hh12-the-tich-cau"]) },
  ] }];
  assert.deepEqual(extractAskedProblems(sessions).map((i) => i.text), [
    "Tính thể tích khối cầu bán kính R = 3.",
    "Hình chóp S.ABCD có đáy là hình vuông cạnh 3 và chiều cao 4. Tính thể tích.",
  ]);
});

test("isFollowUpQuestion: hỏi lại thì true, đề mới thì false", () => {
  for (const t of ["tui chưa hiểu bước 2", "Giải thích lại giúp mình", "sao lại ra 36 vậy", "bước này là gì", "không hiểu chỗ đó"]) {
    assert.equal(isFollowUpQuestion(t, true), true, t);
  }
  for (const t of ["Tính thể tích khối cầu bán kính R = 3.", "Giải phương trình x^2 - 5x + 6 = 0", "Tam giác ABC có AB = 5, AC = 8, góc A = 60°. Tính BC"]) {
    assert.equal(isFollowUpQuestion(t, true), false, t);
  }
  assert.equal(isFollowUpQuestion("tui chưa hiểu bước 2", false), false); // tin đầu tiên của cuộc trò chuyện luôn là đề
});

test("togglePick: bật/tắt, không vượt quá 3 bài", () => {
  assert.equal(MAX_VARIANT_PICK, 3);
  let s = [];
  for (const k of ["a", "b", "c", "d", "e"]) s = togglePick(s, k);
  assert.deepEqual(s, ["a", "b", "c"]);
  assert.deepEqual(togglePick(s, "b"), ["a", "c"]);
  assert.deepEqual(togglePick(togglePick(s, "b"), "d"), ["a", "c", "d"]);
});

test("formatAskedAt theo giờ Việt Nam", () => {
  assert.equal(formatAskedAt(T - 60_000, T), "Hôm nay 09:59");
  assert.equal(formatAskedAt(T - 86_400_000, T), "Hôm qua");
  assert.equal(formatAskedAt(T - 3 * 86_400_000, T), "3 ngày trước");
  assert.equal(formatAskedAt(Date.UTC(2026, 8, 2, 20, 0), T), "03/09/2026"); // 20h UTC = 3h sáng hôm sau ở VN
  assert.equal(formatAskedAt(0, T), "");
});

test("toVariantQuestion: đúng hình dạng questions.js, chủ đề/lớp lấy từ formulas.js", () => {
  const data = {
    question: "Giải $x^2 - 7x + 10 = 0$",
    options: [{ letter: "A", text: "$2; 5$", isCorrect: true }, { letter: "B", text: "$1$" }, { letter: "C", text: "$3$" }, { letter: "D", text: "$4$" }],
    blankAnswer: "x=2;x=5", explanation: "...", formulaIds: ["ds10-phuongtrinh-bac2"], verified: "quadratic_roots",
  };
  const q = toVariantQuestion(data, { key: "s1:1", text: "Giải x^2 - 5x + 6 = 0" }, (id) => (id === "ds10-phuongtrinh-bac2" ? { topic: "Đại số", grade: 10 } : undefined));
  assert.equal(q.topic, "Đại số");
  assert.equal(q.grade, 10);
  assert.equal(q.isAiGenerated, true);
  assert.deepEqual(q.options.map((o) => o.letter), ["A", "B", "C", "D"]);
  assert.equal(q.options.filter((o) => o.isCorrect).length, 1);
  assert.equal(q.sourceText, "Giải x^2 - 5x + 6 = 0");
  assert.equal(toVariantQuestion({ ...data, options: data.options.slice(0, 3) }, {}), null);
  assert.equal(toVariantQuestion({ ...data, options: data.options.map((o) => ({ ...o, isCorrect: true })) }, {}), null);
});

test("variantQuizTopic: một chủ đề giữ nguyên, nhiều chủ đề → Tổng hợp", () => {
  assert.equal(variantQuizTopic([{ topic: "Đại số" }, { topic: "Đại số" }]), "Đại số");
  assert.equal(variantQuizTopic([{ topic: "Đại số" }, { topic: "Hình học" }]), "Tổng hợp");
  assert.equal(variantQuizTopic([{ topic: "Tổng hợp" }]), "Tổng hợp");
});

test("runSequential: gọi lần lượt, không song song; dừng khi hết lượt", async () => {
  let running = 0;
  let maxRunning = 0;
  const progress = [];
  const out = await runSequential([1, 2, 3, 4], async (n) => {
    running++; maxRunning = Math.max(maxRunning, running);
    await new Promise((r) => setTimeout(r, 5));
    running--;
    if (n === 2) throw Object.assign(new Error("invalid"), { code: "variant_invalid" });
    if (n === 3) throw Object.assign(new Error("hết lượt"), { code: "quota_exceeded" });
    return n * 10;
  }, { shouldStop: (e) => e.code === "quota_exceeded", onProgress: (d) => progress.push(d) });
  assert.equal(maxRunning, 1);
  assert.deepEqual(out.results, [10]);
  assert.equal(out.failures.length, 2);
  assert.equal(out.stoppedBy.code, "quota_exceeded");
  assert.deepEqual(progress, [1, 2, 3]);
});

test("buildGoals: việc chọn hôm nay lên đầu, gợi ý chủ đề yếu", () => {
  const stats = { flashcardsStudied: 6, quizzesCompleted: 0 };
  assert.deepEqual(buildGoals({ todayStats: stats }).map((g) => g.key), ["flashcard", "quiz"]);
  const test = buildGoals({ intent: "test", todayStats: stats, weakTopic: "Lượng giác" });
  assert.equal(test[0].key, "quiz");
  assert.match(test[0].label, /Lượng giác/);
  assert.equal(test.find((g) => g.key === "flashcard").done, true);
  assert.equal(buildGoals({ intent: "memorize" })[0].key, "flashcard");
});

test("headline + isNewLearner", () => {
  assert.equal(isNewLearner({}), true);
  assert.equal(isNewLearner({ streak: 2 }), false);
  assert.equal(isNewLearner({ viewedCount: 1 }), false);
  assert.match(headline({ isNew: true }), /Chào mừng/);
  const goals = buildGoals({ todayStats: { flashcardsStudied: 5, quizzesCompleted: 1 } });
  assert.match(headline({ goals, streak: 3, todayStats: { flashcardsStudied: 5 } }), /Xong hết/);
  assert.match(headline({ goals: buildGoals({}), streak: 4, todayStats: {} }), /giữ chuỗi 4 ngày/);
  assert.match(headline({ goals: buildGoals({}), streak: 0, todayStats: {} }), /Còn 2 nhiệm vụ/);
  // Dashboard gọi không kèm goals (đã bỏ thẻ Nhiệm vụ hôm nay)
  assert.match(headline({ streak: 0, todayStats: {} }), /ôn gì/);
  assert.match(headline({ streak: 4, todayStats: {} }), /giữ chuỗi 4 ngày/);
  assert.match(headline({ streak: 4, todayStats: { quizzesCompleted: 1 } }), /học tốt/);
});

test("nextStep: theo lựa chọn hôm nay, rồi tới công thức gợi ý", () => {
  assert.equal(nextStep({ intent: "stuck" }).tab, "finder");
  assert.match(nextStep({ intent: "memorize", dueCount: 4 }).sub, /4 thẻ/);
  assert.match(nextStep({ intent: "test", weakTopics: ["Hình học"] }).title, /Hình học/);
  const f = { id: "x", name: "Định lý côsin", topic: "Hình học", grade: 10 };
  const step = nextStep({ weakTopics: ["Hình học"], formula: f });
  assert.equal(step.formula, f);
  assert.match(step.kicker, /còn yếu/);
  assert.match(nextStep({ userGrade: 10, formula: f }).kicker, /lớp 10/);
  assert.equal(nextStep({}).tab, "library");
});

test("lastSevenDays: 7 ngày kết thúc hôm nay, đánh dấu ngày có học", () => {
  const days = lastSevenDays(["2026-11-01", "2026-10-30"], "2026-11-01");
  assert.equal(days.length, 7);
  assert.equal(days[6].date, "2026-11-01");
  assert.equal(days[6].label, "CN");
  assert.equal(days[6].isToday, true);
  assert.deepEqual(days.filter((d) => d.active).map((d) => d.date), ["2026-10-30", "2026-11-01"]);
  assert.equal(days[0].date, "2026-10-26");
});
