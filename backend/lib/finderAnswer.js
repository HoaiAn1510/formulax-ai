import { shortlistFormulas, getFormula, isValidFormulaId } from "./formulaCatalog.js";
import { buildSystemPrompt, FINDER_MODEL, FINDER_PARAMS } from "./finderPrompt.js";
import {
  parseModelJson, normalizeAnswer, dropBrokenExpressions, applyNumberGuard, toReplyText, DEFAULT_TEXT,
} from "./solutionGuard.js";

const MAX_ATTEMPTS = 2; // lần 2 chỉ khi JSON hỏng không cứu được

/**
 * Hỏi AI Finder một câu và trả về câu trả lời ĐÃ KIỂM TRA. Toàn bộ luồng nằm ở đây để server.js
 * và bộ chấm so sánh model (chạy ngoài) dùng chung đúng một đoạn code.
 *
 * @param {object} opts
 * @param {import("groq-sdk").default} opts.groq
 * @param {string} opts.message         câu hỏi hiện tại
 * @param {{role: string, content: string}[]} opts.history  lịch sử đã cắt gọn (role user/assistant)
 * @param {string} [opts.model]
 * Lỗi từ Groq (429, mạng...) được ném ra ngoài cho nơi gọi xử lý.
 */
export async function askFinder({ groq, message, history = [], model = FINDER_MODEL }) {
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
    meta.attempts++;
    try {
      const completion = await groq.chat.completions.create({ model, messages, ...FINDER_PARAMS });
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

  const { answer: normalized, droppedIds } = normalizeAnswer(parsed, isValidFormulaId);
  const { answer: withBraces, dropped: droppedExpressions } = dropBrokenExpressions(normalized);
  const chosen = withBraces.formulaIds.map(getFormula);
  const { answer, removedSteps, replaced } = applyNumberGuard(withBraces, {
    sourceTexts: [message, ...recentUserTexts],
    formulaTexts: chosen.map((f) => `${f.latex}\n${f.explanation || ""}`),
    formulaNames: chosen.map((f) => f.name),
  });

  return {
    answer,
    reply: toReplyText(answer, getFormula),
    meta: { ...meta, rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions, removedSteps, replaced },
  };
}
