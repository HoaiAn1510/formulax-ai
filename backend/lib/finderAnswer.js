import { shortlistFormulas, getFormula, isValidFormulaId } from "./formulaCatalog.js";
import { buildSystemPrompt, FINDER_MODEL, FINDER_PARAMS } from "./finderPrompt.js";
import {
  parseModelJson, normalizeAnswer, dropBrokenExpressions, applyNumberGuard, toReplyText, extractNumbers, DEFAULT_TEXT,
} from "./solutionGuard.js";

const MAX_ATTEMPTS = 2; // lần 2 chỉ khi JSON hỏng không cứu được

// Ngân sách thời gian cho MỖI request /api/chat, tính từ lúc request tới backend. Frontend chờ
// 45 giây (FormulaFinder.jsx) — con số đó PHẢI lớn hơn ngân sách này. Nếu frontend hết giờ
// trước, backend vẫn giao câu trả lời và KHÔNG hoàn lượt: học sinh mất lượt mà không thấy gì.
export const CHAT_BUDGET_MS = 40_000;
const PER_CALL_TIMEOUT_MS = 25_000;
// Chỉ gọi lại khi còn ít nhất chừng này: gọi với timeout quá ngắn gần như chắc chắn hết giờ giữa
// chừng, vừa tốn token (8k/phút cho cả app) vừa không đổi được kết quả. Khi chấm, 120b trả lời
// chậm nhất khoảng 4,4 giây — 8 giây là đủ dư.
const MIN_CALL_MS = 8_000;

/**
 * Hỏi AI Finder một câu và trả về câu trả lời ĐÃ KIỂM TRA. Toàn bộ luồng nằm ở đây để server.js
 * và bộ chấm so sánh model (chạy ngoài) dùng chung đúng một đoạn code.
 *
 * @param {object} opts
 * @param {import("groq-sdk").default} opts.groq
 * @param {string} opts.message         câu hỏi hiện tại
 * @param {{role: string, content: string}[]} opts.history  lịch sử đã cắt gọn (role user/assistant)
 * @param {string} [opts.model]
 * @param {number} [opts.deadline]  mốc thời gian (ms) phải xong; mặc định = bây giờ + CHAT_BUDGET_MS
 * @param {() => number} [opts.now] đồng hồ, truyền vào được để test
 * Lỗi từ Groq (429, mạng, timeout...) được ném ra ngoài cho nơi gọi xử lý.
 */
export async function askFinder({ groq, message, history = [], model = FINDER_MODEL, now = Date.now, deadline = now() + CHAT_BUDGET_MS }) {
  // Công thức ứng viên theo câu hỏi hiện tại + 2 câu hỏi trước (hiểu câu hỏi nối tiếp).
  const recentUserTexts = history.filter((h) => h.role === "user").slice(-2).map((h) => h.content);
  const candidates = shortlistFormulas([message, ...recentUserTexts]);
  const messages = [
    { role: "system", content: buildSystemPrompt(candidates) },
    ...history,
    { role: "user", content: message },
  ];

  const meta = { model, candidates: candidates.map((f) => f.id), attempts: 0, promptTokens: 0, completionTokens: 0 };
  let parsed = null;
  while (!parsed && meta.attempts < MAX_ATTEMPTS) {
    const timeLeft = deadline - now();
    if (meta.attempts > 0 && timeLeft < MIN_CALL_MS) {
      meta.skippedRetryForTime = true; // không kịp gọi lại → trả câu mẫu (nơi gọi hoàn lượt)
      break;
    }
    meta.attempts++;
    try {
      const completion = await groq.chat.completions.create(
        { model, messages, ...FINDER_PARAMS },
        { timeout: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)) },
      );
      meta.promptTokens += completion.usage?.prompt_tokens ?? 0;
      meta.completionTokens += completion.usage?.completion_tokens ?? 0;
      parsed = parseModelJson(completion.choices?.[0]?.message?.content);
    } catch (err) {
      // Ở chế độ json_object, Groq tự kiểm tra JSON và trả 400 json_validate_failed nếu model
      // viết lệnh LaTeX thiếu escape (\cdot, \sqrt...) — chính lỗi mà parseModelJson sửa được.
      // Văn bản thô nằm trong failed_generation; cứu từ đó trước khi phải gọi lại. Lỗi khác
      // (429, mạng...) ném ra cho nơi gọi.
      const body = err?.error?.error ?? err?.error;
      if (err?.status !== 400 || body?.code !== "json_validate_failed") throw err;
      meta.recoveredFromFailedGeneration = true;
      parsed = parseModelJson(body.failed_generation);
    }
  }

  if (!parsed) {
    const answer = { type: "unavailable", formulaIds: [], intro: DEFAULT_TEXT.unavailable, steps: [], reminder: "" };
    return { answer, reply: answer.intro, meta: { ...meta, jsonFailed: true } };
  }

  const checked = finalizeAnswer(parsed, { message, recentUserTexts });
  return { answer: checked.answer, reply: checked.reply, meta: { ...meta, ...checked.meta } };
}

/**
 * Những đoạn văn bản mà con số trong đó được coi là "có sẵn" (không phải do AI tự tính).
 * Câu hỏi nối tiếp không có số riêng ("giải thích lại bước này giúp mình") thì lấy thêm số của các
 * câu hỏi trước. Nhưng tin nhắn đã có số riêng là một ĐỀ MỚI: chỉ tính số của chính nó — nếu lấy
 * cả số của đề trước, bài cực trị hỏi ngay sau bài "khối cầu bán kính 6cm" sẽ lọt được
 * y' = 3x^2 - 6x - 9 và cả nghiệm x = 3, x = -1 (số 6 lấy từ đề trước, 3 và 1 trùng số trong đề).
 */
export function numberSourceTexts(message, recentUserTexts = []) {
  return extractNumbers(message).length ? [message] : [message, ...recentUserTexts];
}

/**
 * Kiểm tra đối tượng JSON model trả về: chuẩn hoá khung, bỏ id không có thật, bỏ biểu thức lệch
 * ngoặc, lọc bước có số lạ. Tách riêng khỏi lời gọi Groq để test và chấm lại offline được.
 */
export function finalizeAnswer(parsed, { message, recentUserTexts = [] }) {
  const { answer: normalized, droppedIds } = normalizeAnswer(parsed, isValidFormulaId);
  const { answer: withBraces, dropped: droppedExpressions } = dropBrokenExpressions(normalized);
  const chosen = withBraces.formulaIds.map(getFormula);
  const { answer, removedSteps, replaced } = applyNumberGuard(withBraces, {
    sourceTexts: numberSourceTexts(message, recentUserTexts),
    formulaTexts: chosen.map((f) => `${f.latex}\n${f.explanation || ""}`),
    formulaNames: chosen.map((f) => f.name),
  });

  return {
    answer,
    reply: toReplyText(answer, getFormula),
    meta: { rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions, removedSteps, replaced },
  };
}
