// Chạy THẬT AI Finder trên Gemini bằng vài câu mẫu + một đợt hỏi liên tiếp để kiểm tra "một phút chỉ
// trả lời được một câu". CHỈ dùng key chấm riêng GEMINI_EVAL_API_KEY (dự án Google khác production) —
// thiếu thì dừng, không bao giờ dùng GEMINI_API_KEY của học sinh. Dùng:
//   GEMINI_EVAL_API_KEY=... node scripts/finder-live-check.mjs [số câu trong đợt liên tiếp, mặc định 5]
// Không in key, không ghi câu trả lời đầy đủ — chỉ type, model, thời gian, token, số bước, lộ số.
import { createGeminiClient } from "../lib/geminiChat.js";
import { askFinder } from "../lib/finderAnswer.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "../lib/finderPrompt.js";

const key = process.env.GEMINI_EVAL_API_KEY;
if (!key) {
  console.error("Thiếu GEMINI_EVAL_API_KEY — dừng. (Không dùng GEMINI_API_KEY của production để chấm.)");
  process.exit(1);
}
const burst = Math.max(1, Number(process.argv[2]) || 5);
const client = createGeminiClient({ apiKey: key, thinkingLevel: process.env.FINDER_GEMINI_THINKING_LEVEL || undefined });

const QUESTIONS = [
  "Tính thể tích khối cầu bán kính 6 cm",
  "Tìm cực trị của hàm số y = x^3 - 3x + 2",
  "Tam giác ABC có AB = 5, AC = 8, góc A = 60°. Tính BC.",
  "Giải phương trình 2x^2 + 3x - 5 = 0",
  "Cho cấp số cộng có u1 = 2, công sai d = 3. Tính tổng 10 số hạng đầu.",
  "Tìm tiệm cận của đồ thị hàm số y = (3x + 1)/(x + 2)",
];

console.log(`model chính: ${FINDER_MODEL} | dự phòng: ${FINDER_FALLBACK_MODEL} | ${burst} câu liên tiếp`);
const t0 = Date.now();
let answered = 0;
for (let i = 0; i < burst; i++) {
  const message = QUESTIONS[i % QUESTIONS.length];
  const started = Date.now();
  try {
    const { answer, meta } = await askFinder({ groq: client, message, grade: 12 });
    answered += answer.type === "solution" ? 1 : 0;
    console.log(JSON.stringify({
      i: i + 1, type: answer.type, model: meta.model, fallback: meta.fallback?.reason ?? null, ms: Date.now() - started,
      attempts: meta.attempts, promptTokens: meta.promptTokens, completionTokens: meta.completionTokens,
      steps: answer.steps.length, retriedForLeaks: Boolean(meta.retriedForLeaks), truncated: Boolean(meta.truncated), jsonFailed: Boolean(meta.jsonFailed),
    }));
  } catch (err) {
    console.log(JSON.stringify({ i: i + 1, error: err.status || err.code || err.name, message: String(err.message).slice(0, 160), ms: Date.now() - started }));
  }
}
console.log(`xong: ${answered}/${burst} câu có hướng dẫn trong ${Math.round((Date.now() - t0) / 1000)} giây`);
