// Đề "Luyện lại dạng bài đã hỏi": đổi phản hồi của POST /api/quiz/variant thành câu hỏi cùng hình dạng với
// questions.js để QuizView dùng chung màn làm bài / chấm / xem lại. File thuần, không import gì — test bằng
// `npm run test:asked`.

const LETTERS = ["A", "B", "C", "D"];

/**
 * @param {object} data       phản hồi backend { question, options, blankAnswer, explanation, formulaIds, verified }
 * @param {{ key: string, text: string }} source  bài đã hỏi sinh ra câu này
 * @param {(id: string) => ({ topic: string, grade: number } | undefined)} findFormula
 * @returns câu hỏi kiểu questions.js + isAiGenerated, sourceText, formulaIds, verified; null nếu dữ liệu hỏng
 */
export function toVariantQuestion(data, source, findFormula = () => undefined) {
  const options = Array.isArray(data?.options) ? data.options : [];
  if (typeof data?.question !== "string" || !data.question.trim() || options.length !== 4) return null;
  if (options.filter((o) => o?.isCorrect === true).length !== 1) return null;
  const formulaIds = Array.isArray(data.formulaIds) ? data.formulaIds.filter((id) => typeof id === "string") : [];
  const first = formulaIds.map(findFormula).find(Boolean);
  return {
    id: `ai-${source?.key ?? "x"}-${Math.random().toString(36).slice(2, 8)}`,
    topic: first?.topic || "Tổng hợp",
    grade: first?.grade ?? null,
    text: data.question,
    options: options.map((o, i) => ({ letter: LETTERS[i], text: String(o.text ?? ""), isCorrect: o.isCorrect === true })),
    blankAnswer: typeof data.blankAnswer === "string" ? data.blankAnswer : "",
    explanation: typeof data.explanation === "string" ? data.explanation : "",
    formulaIds,
    isAiGenerated: true,
    verified: typeof data.verified === "string" ? data.verified : null,
    sourceText: source?.text || "",
  };
}

/** Chủ đề lưu vào quiz_results: một chủ đề duy nhất thì giữ, nhiều chủ đề → "Tổng hợp" (như quiz thường). */
export function variantQuizTopic(questions) {
  const topics = [...new Set((questions || []).map((q) => q.topic).filter((t) => t && t !== "Tổng hợp"))];
  return topics.length === 1 ? topics[0] : "Tổng hợp";
}

/**
 * Gọi `fn` LẦN LƯỢT cho từng mục (không song song — hạn mức theo phút của Gemini thấp). Dừng sớm khi
 * `shouldStop(err)` đúng (hết lượt, AI bận). onProgress(doneCount) sau mỗi mục.
 * @returns {Promise<{ results: any[], failures: {item: any, error: any}[], stoppedBy: any }>}
 */
export async function runSequential(items, fn, { shouldStop = () => false, onProgress = () => {} } = {}) {
  const results = [];
  const failures = [];
  let stoppedBy = null;
  for (let i = 0; i < items.length; i++) {
    try {
      results.push(await fn(items[i], i));
    } catch (error) {
      failures.push({ item: items[i], error });
      if (shouldStop(error)) { stoppedBy = error; onProgress(i + 1); break; }
    }
    onProgress(i + 1);
  }
  return { results, failures, stoppedBy };
}
