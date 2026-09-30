import { shortlistFormulas, getFormula, isValidFormulaId } from "./formulaCatalog.js";
import { buildSystemPrompt, FINDER_MODEL, FINDER_FALLBACK_MODEL, FINDER_PARAMS } from "./finderPrompt.js";
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

// ─── Model dự phòng khi model chính hết hạn mức NGÀY ────────────────────────
// Chỉ chuyển khi 429 là do hạn mức ngày (TPD/RPD). 429 theo phút (TPM/RPM) chỉ cần chờ vài giây,
// vẫn báo "AI đang bận" như cũ. Nhớ mốc model chính bị chặn để các câu sau vào thẳng model dự
// phòng, không phải chờ một lần 429 nữa. Trạng thái nằm trong bộ nhớ tiến trình: backend khởi động
// lại thì thử model chính lại từ đầu — chỉ tốn một lần 429.
const DEFAULT_DAILY_BLOCK_MS = 10 * 60_000;
export const fallbackState = { primaryBlockedUntil: 0 };

/** Thời gian (ms) model chính còn bị chặn nếu lỗi là 429 hết hạn mức NGÀY; null nếu không phải. */
export function dailyLimitBlockMs(err) {
  if (err?.status !== 429) return null;
  const text = String(err?.error?.error?.message || err?.message || "");
  const header = err?.headers?.get?.("retry-after") ?? err?.headers?.["retry-after"];
  const retryAfterS = Number(header);
  const inText = text.match(/try again in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/);
  const textMs = inText ? ((+inText[1] || 0) * 3600 + (+inText[2] || 0) * 60 + (+inText[3] || 0)) * 1000 : 0;
  const isDaily = /per day \((?:TPD|RPD)\)/.test(text) || (Number.isFinite(retryAfterS) && retryAfterS >= 120);
  if (!isDaily) return null;
  if (Number.isFinite(retryAfterS) && retryAfterS > 0) return retryAfterS * 1000;
  return textMs > 0 ? textMs : DEFAULT_DAILY_BLOCK_MS;
}

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

  // cachedTokens: phần prompt Groq lấy từ cache (phần cố định của system prompt đứng đầu). Khi chấm
  // 2026-09-30, token cache KHÔNG bị tính vào hạn mức ngày — theo dõi để biết cache giúp được bao nhiêu.
  const meta = { model, candidates: candidates.map((f) => f.id), attempts: 0, promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
  let activeModel = model;
  const canFallBack = model === FINDER_MODEL;
  if (canFallBack && now() < fallbackState.primaryBlockedUntil) {
    activeModel = FINDER_FALLBACK_MODEL;
    meta.fallback = { from: model, to: activeModel, reason: "daily_limit_known" };
  }
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
        { model: activeModel, messages, ...FINDER_PARAMS },
        { timeout: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)) },
      );
      meta.promptTokens += completion.usage?.prompt_tokens ?? 0;
      meta.completionTokens += completion.usage?.completion_tokens ?? 0;
      meta.cachedTokens += completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      parsed = parseModelJson(completion.choices?.[0]?.message?.content);
    } catch (err) {
      // Model chính hết hạn mức NGÀY → chuyển sang model dự phòng (chỉ một lần mỗi request, và chỉ
      // khi còn đủ thời gian). Lần bị 429 không tính là một lần gọi (không có câu trả lời nào).
      const blockMs = canFallBack && activeModel === FINDER_MODEL ? dailyLimitBlockMs(err) : null;
      if (blockMs !== null) {
        fallbackState.primaryBlockedUntil = now() + blockMs;
        if (deadline - now() < MIN_CALL_MS) throw err;
        activeModel = FINDER_FALLBACK_MODEL;
        meta.fallback = { from: model, to: activeModel, reason: "daily_limit" };
        meta.attempts--;
        continue;
      }
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

  meta.model = activeModel;
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
  const { answer: normalized, droppedIds, aiNote } = normalizeAnswer(parsed, isValidFormulaId, (id) => getFormula(id)?.name);
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
    meta: { rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions, removedSteps, replaced, aiNote },
  };
}
