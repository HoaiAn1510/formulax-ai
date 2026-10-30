import { shortlistFormulas, getFormula, isValidFormulaId, SHORTLIST_SIZE } from "./formulaCatalog.js";
import { buildFinderMessages, FINDER_MODEL, FINDER_FALLBACK_MODEL, FINDER_PARAMS, BACKGROUND_KNOWLEDGE_LATEX, gradeLine } from "./finderPrompt.js";
import {
  parseModelJson, normalizeAnswer, dropBrokenExpressions, applyNumberGuard, dropNumericSubstitutions, toReplyText, extractNumbers, DEFAULT_TEXT,
  checkTriangleSides, checkBaseKnowledge,
} from "./solutionGuard.js";
import { isMultipleChoiceQuestion, guardChoiceReveals } from "./choiceGuard.js";
import { unsafeCircleAnswer } from "./circleAnswerGuard.js";
import { questionNotice, verifiedTriangleNotice } from "./finderNotice.js";

const MAX_ATTEMPTS = 2; // lần 2 chỉ khi JSON hỏng không cứu được
const measuredPrompts = new Map();
export function completionBudget(promptTokens, retry = false) {
  const cap = Math.min(retry ? 2000 : 2300, 7800 - promptTokens);
  return cap >= 1200 ? cap : null;
}

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

/**
 * Câu trả lời có tính là 1 lượt hỏi AI không. Không tính (backend hoàn lượt) khi không giao được câu
 * trả lời thật: JSON hỏng phải trả câu mẫu, hoặc no_formula — thư viện chưa có công thức là lỗ hổng
 * của thư viện (hoặc app chưa hiểu cách viết của đề, vd "△"), không phải lỗi của học sinh; và
 * invalid_data — đề sai (ba cạnh không tạo thành tam giác), không có hướng dẫn nào được giao (quyết
 * định chủ dự án 2026-10-22). off_topic và refuse_answer vẫn tính.
 */
export function countsAsTurn(answer, meta) {
  return !meta?.jsonFailed && answer?.type !== "no_formula" && answer?.type !== "invalid_data";
}

/** Mã ngắn cho log no_formula; không ghi thêm đề hoặc nội dung thô của model. */
export function noFormulaReason(meta = {}) {
  if (meta.noticeReason) return meta.noticeReason;
  if (meta.circleRejected) return "circle_guard";
  if (meta.baseKnowledge && !meta.baseKnowledge.verified) return "base_knowledge_reject";
  if (meta.invalidData && !meta.invalidData.verified) return "invalid_data_reject";
  if (meta.rawType === "no_formula") return "ai_refused";
  if (meta.rawType === "solution") return "formula_ids_reject";
  return "unknown";
}

/** Chỉ thay câu thông báo sau khi các guard đã quyết định type; không dùng lời model. */
export function withNonDeliveryNotice(result, { message, grade = null }) {
  const { answer, meta } = result;
  if (answer.type !== "no_formula" && answer.type !== "invalid_data") return result;
  const notice = answer.type === "invalid_data"
    ? { reason: "invalid_triangle_sides", text: verifiedTriangleNotice(answer.intro) }
    : questionNotice(noFormulaReason(meta), message, grade);
  const updated = { ...answer, intro: notice.text, reminder: "" };
  return { ...result, answer: updated, reply: toReplyText(updated, getFormula), meta: { ...meta, noticeReason: notice.reason } };
}

// Groq không cho biết phải chờ bao lâu thì mặc định 60 giây (hạn mức theo phút). Trần 120 giây: lâu
// hơn thì là hạn mức ngày — học sinh không nên ngồi đếm ngược, frontend chỉ báo "thử lại sau".
const DEFAULT_RETRY_AFTER_S = 60;
const MAX_RETRY_AFTER_S = 120;

/**
 * Số giây nên chờ trước khi hỏi lại sau một lỗi 429 của Groq: header retry-after, không có thì đọc
 * "try again in 7.5s" trong thông báo lỗi, không có nữa thì 60 giây. Làm tròn lên, tối thiểu 1.
 */
export function retryAfterSeconds(err) {
  const header = Number(err?.headers?.get?.("retry-after") ?? err?.headers?.["retry-after"]);
  let s = Number.isFinite(header) && header > 0 ? header : null;
  if (s === null) {
    const text = String(err?.error?.error?.message || err?.message || "");
    const m = text.match(/try again in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/);
    const fromText = m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
    s = fromText > 0 ? fromText : DEFAULT_RETRY_AFTER_S;
  }
  return Math.min(MAX_RETRY_AFTER_S, Math.max(1, Math.ceil(s)));
}

// ─── Lỗi 413 "Request too large" của gói Groq miễn phí ───────────────────────
// Mỗi yêu cầu bị chặn nếu prompt + max_completion_tokens > 8.000 (TPM của model). Thông báo lỗi cho
// biết chính xác: "Limit 8000, Requested 8029" (đã khớp từng số với usage của Groq, 2026-10-22).
// Gọi lại MỘT lần với max_completion_tokens thấp hơn đúng phần vượt (+ biên) thì câu hỏi vẫn được
// trả lời thay vì "Không thể kết nối AI". Dưới MIN_COMPLETION_TOKENS thì thôi (completion thật đo
// được tối đa 917 token, câu bị cắt giữa chừng còn tệ hơn báo lỗi).
const TPM_RETRY_MARGIN = 100;
const MIN_COMPLETION_TOKENS = 1200;

/** 413 do vượt TPM → { limit, requested }; lỗi khác (kể cả 413 của loại khác) → null. */
export function parseTpmOverflow(err) {
  if (err?.status !== 413) return null;
  const text = [err?.error?.error?.message, err?.error?.message, err?.message].filter((t) => typeof t === "string").join(" ");
  if (!/tokens per minute|TPM/i.test(text)) return null;
  const m = text.match(/Limit\s+(\d+),\s*Requested\s+(\d+)/i);
  return m ? { limit: Number(m[1]), requested: Number(m[2]) } : null;
}

/** max_completion_tokens mới cho lần gọi lại sau 413; null nếu không phải 413 TPM hoặc không còn đủ chỗ. */
export function reducedCompletionTokens(err, current) {
  const o = parseTpmOverflow(err);
  if (!o || o.requested <= o.limit) return null;
  const next = current - (o.requested - o.limit) - TPM_RETRY_MARGIN;
  return next >= MIN_COMPLETION_TOKENS ? next : null;
}

/** Loại hạn mức Groq trong thông báo 429 (TPM/RPM/TPD/RPD) — chỉ để ghi log. */
export function rateLimitKind(err) {
  const text = String(err?.error?.error?.message || err?.message || "");
  return (text.match(/\((TPM|RPM|TPD|RPD)\)/) || [])[1] || "unknown";
}

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

// Hạn mức Gemini tính RIÊNG từng model và theo phút rất thấp ở gói miễn phí → 429 theo phút của model
// chính cũng chuyển ngay sang model dự phòng (trước đây chỉ 429 theo ngày mới chuyển, nên cứ 429 là học
// sinh phải chờ ~60 giây). Nhớ mốc để các câu kế tiếp vào thẳng model dự phòng trong lúc model chính nghỉ.
// 503/500 (model quá tải) cũng chuyển, nhưng chỉ nhớ ngắn: lỗi tạm thời, không phải hết hạn mức.
const MINUTE_BLOCK_MAX_MS = 60_000;
const OVERLOAD_BLOCK_MS = 20_000;
/** Số ms nên tránh model chính sau lỗi này; null nếu lỗi không phải loại nên chuyển sang dự phòng. */
export function primaryBlockMs(err) {
  const daily = dailyLimitBlockMs(err);
  if (daily !== null) return daily;
  if (err?.status === 429) return Math.min(MINUTE_BLOCK_MAX_MS, retryAfterSeconds(err) * 1000);
  if (err?.status === 503 || err?.status === 500) return OVERLOAD_BLOCK_MS;
  return null;
}

/**
 * Hỏi AI Finder một câu và trả về câu trả lời ĐÃ KIỂM TRA. Toàn bộ luồng nằm ở đây để server.js
 * và bộ chấm so sánh model (chạy ngoài) dùng chung đúng một đoạn code.
 *
 * @param {object} opts
 * @param {{ chat: { completions: { create: Function } }, enforcesTpmCap?: boolean }} opts.groq  client kiểu Groq/OpenAI (hiện là createGeminiClient trong lib/geminiChat.js)
 * @param {string} opts.message         câu hỏi hiện tại
 * @param {{role: string, content: string}[]} opts.history  lịch sử đã cắt gọn (role user/assistant)
 * @param {10|11|12|null} [opts.grade]  lớp học sinh (null = chưa chọn)
 * @param {string} [opts.model]
 * @param {number} [opts.deadline]  mốc thời gian (ms) phải xong; mặc định = bây giờ + CHAT_BUDGET_MS
 * @param {() => number} [opts.now] đồng hồ, truyền vào được để test
 * Lỗi từ Groq (429, mạng, timeout...) được ném ra ngoài cho nơi gọi xử lý.
 */
export async function askFinder({ groq, message, history = [], grade = null, model = FINDER_MODEL, now = Date.now, deadline = now() + CHAT_BUDGET_MS }) {
  // Công thức ứng viên theo câu hỏi hiện tại + 2 câu hỏi trước (hiểu câu hỏi nối tiếp).
  const recentUserTexts = history.filter((h) => h.role === "user").slice(-2).map((h) => h.content);
  // grade: lớp học sinh chọn ở onboarding — công thức lớp cao hơn không được ghim, xếp sau (formulaCatalog).
  const candidates = shortlistFormulas([message, ...recentUserTexts], SHORTLIST_SIZE, { grade });
  // Thứ tự cố định → thư viện → lịch sử → câu hỏi: giữ phần đầu giống hệt nhau cho prompt caching
  // của Groq (xem finderPrompt.js).
  const messages = buildFinderMessages({ candidates, history, message, grade });

  // cachedTokens: phần prompt Groq lấy từ cache (phần cố định của system prompt đứng đầu). Khi chấm
  // 2026-09-30, token cache KHÔNG bị tính vào hạn mức ngày — theo dõi để biết cache giúp được bao nhiêu.
  const meta = { model, candidates: candidates.map((f) => f.id), attempts: 0, promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
  // Một lần gọi Groq; gặp 413 vượt TPM thì gọi lại đúng một lần với max_completion_tokens thấp hơn
  // (không tính là một lần gọi của vòng lặp bên dưới — 413 bị từ chối ngay, chưa có câu trả lời nào).
  const createCompletion = async (callModel, callMessages, firstTimeoutMs) => {
    const retry = meta.attempts > 1;
    // Conservative estimate calibrated against measured Vietnamese prompts; usage from a
    // previous call is a lower bound when retry messages append the previous response.
    const promptKey = JSON.stringify([callModel, callMessages]);
    const prompt = measuredPrompts.get(promptKey) ?? Math.max(meta.lastPromptTokens || 0, Math.ceil(callMessages.reduce((n, m) => n + m.content.length, 0) / 2.6) + 100);
    // Trần "prompt + completion ≤ 7.800" chỉ để tránh lỗi 413 của Groq (8.000 token/yêu cầu). Gemini không có
    // trần đó (client khai enforcesTpmCap = false): giữ trần cố định, nếu không thì hỏi nối tiếp vài lượt là
    // prompt dài làm completionBudget trả null → 503 giả "Insufficient completion budget" dù Gemini nhận được.
    const initialCap = groq.enforcesTpmCap === false ? (retry ? 2000 : 2300) : completionBudget(prompt, retry);
    if (initialCap === null) throw Object.assign(new Error("Insufficient completion budget"), { status: 503 });
    const call = (maxTokens, timeoutMs) => groq.chat.completions.create(
      { model: callModel, messages: callMessages, ...FINDER_PARAMS, max_completion_tokens: maxTokens },
      { timeout: timeoutMs },
    );
    try {
      const completion = await call(initialCap, firstTimeoutMs);
      meta.lastPromptTokens = completion.usage?.prompt_tokens || prompt;
      if (completion.usage?.prompt_tokens) {
        if (measuredPrompts.size >= 100) measuredPrompts.delete(measuredPrompts.keys().next().value);
        measuredPrompts.set(promptKey, completion.usage.prompt_tokens);
      }
      return completion;
    } catch (err) {
      const next = reducedCompletionTokens(err, initialCap);
      if (next === null) throw err;
      const overflow = parseTpmOverflow(err);
      meta.reducedForTpm = { from: initialCap, to: next, requested: overflow.requested, limit: overflow.limit };
      return await call(next, Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, deadline - now())));
    }
  };
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
      const completion = await createCompletion(activeModel, messages, Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)));
      meta.promptTokens += completion.usage?.prompt_tokens ?? 0;
      meta.completionTokens += completion.usage?.completion_tokens ?? 0;
      meta.cachedTokens += completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      if (completion.choices?.[0]?.finish_reason === "length") {
        meta.truncated = true;
        continue;
      }
      parsed = parseModelJson(completion.choices?.[0]?.message?.content);
      if (parsed) meta.truncated = false;
    } catch (err) {
      // Model chính hết hạn mức NGÀY → chuyển sang model dự phòng (chỉ một lần mỗi request, và chỉ
      // khi còn đủ thời gian). Lần bị 429 không tính là một lần gọi (không có câu trả lời nào).
      const blockMs = canFallBack && activeModel === FINDER_MODEL ? primaryBlockMs(err) : null;
      if (blockMs !== null) {
        fallbackState.primaryBlockedUntil = now() + blockMs;
        if (deadline - now() < MIN_CALL_MS) throw err;
        activeModel = FINDER_FALLBACK_MODEL;
        meta.fallback = { from: model, to: activeModel, reason: dailyLimitBlockMs(err) !== null ? "daily_limit" : err?.status === 429 ? "minute_limit" : "unavailable" };
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

  // Quy tắc "ô trống": câu trả lời còn giá trị số tính sẵn → yêu cầu AI viết lại MỘT lần (nếu còn
  // đủ thời gian). Lần viết lại vẫn lộ, hoặc không gọi lại được (hết giờ, 429 theo phút, JSON hỏng)
  // → thay đúng con số lộ bằng "?" (mask). Chỉ khi không thay sạch được mới bỏ bước.
  // Một lần hỏi lại (không bắt buộc): gửi thêm lượt hội thoại, trả JSON đã parse (null nếu cắt cụt / JSON hỏng).
  const askAgain = async (retryModel, retryMessages) => {
    meta.attempts++;
    const completion = await createCompletion(retryModel, retryMessages, Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, deadline - now())));
    meta.promptTokens += completion.usage?.prompt_tokens ?? 0;
    meta.completionTokens += completion.usage?.completion_tokens ?? 0;
    meta.cachedTokens += completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
    if (completion.choices?.[0]?.finish_reason === "length") {
      meta.truncated = true;
      return null;
    }
    return parseModelJson(completion.choices?.[0]?.message?.content);
  };
  // Gói Groq miễn phí: 8k token/PHÚT mỗi model, lần đầu đã tốn ~5k nên lần hỏi lại ngay sau gần như luôn
  // 429 theo phút (chấm 2026-10-03: 3/3 lần). Hạn mức tính RIÊNG từng model → hỏi lại bằng model dự phòng.
  // 429 theo ngày / lỗi khác thì ném ra, nơi gọi dùng kết quả của lần đầu. `info.model` ghi model dự phòng.
  const askAgainWithFallback = async (retryMessages, info) => {
    try {
      return await askAgain(activeModel, retryMessages);
    } catch (err) {
      const perMinute = err?.status === 429 && dailyLimitBlockMs(err) === null;
      if (!perMinute || activeModel !== FINDER_MODEL || deadline - now() < MIN_CALL_MS) throw err;
      info.model = FINDER_FALLBACK_MODEL;
      return await askAgain(FINDER_FALLBACK_MODEL, retryMessages);
    }
  };

  // AI báo invalid_data nhưng backend KHÔNG kiểm chứng được (ba cạnh 3, 4, 5 hợp lệ nhưng model khẳng định sai —
  // chạy thật 2026-10-30: 4/10 lần) → hỏi lại ĐÚNG MỘT LẦN. Kiểm chứng được là vô lý thật → không hỏi lại. Hỏi lại
  // vẫn không kiểm được, lỗi hoặc hết giờ → giữ hành vi cũ (no_formula, hoàn lượt, log invalid_data_reject).
  let first = finalizeAnswer(parsed, { message, recentUserTexts, mask: false, grade });
  if (first.meta.invalidData && !first.meta.invalidData.verified && deadline - now() >= MIN_CALL_MS) {
    const recheck = meta.retriedForInvalidData = { sides: first.meta.invalidData.sides };
    try {
      const reparsed = await askAgainWithFallback([
        ...messages,
        { role: "assistant", content: JSON.stringify(parsed) },
        { role: "user", content: INVALID_DATA_RECHECK },
      ], recheck);
      if (reparsed) {
        recheck.outcome = reparsed.type;
        parsed = reparsed;
        first = finalizeAnswer(parsed, { message, recentUserTexts, mask: false, grade });
      } else {
        recheck.error = "json_failed";
        meta.truncated = false; // lần đầu đã có câu trả lời dùng được; đừng để lần hỏi lại bị cắt cụt đổi nó thành "unavailable"
      }
    } catch (err) {
      recheck.error = `${err?.status || ""} ${err?.code || err?.name || "error"}`.trim();
    }
  }
  const violations = leakList(first.meta);
  let checked = null;
  if (violations.length && deadline - now() >= MIN_CALL_MS) {
    meta.retriedForLeaks = { leaked: violations };
    const retryMessages = [
      ...messages,
      { role: "assistant", content: JSON.stringify(parsed) },
      { role: "user", content: retryInstruction(violations) },
    ];
    try {
      const reparsed = await askAgainWithFallback(retryMessages, meta.retriedForLeaks);
      if (reparsed && reparsed.type === parsed.type) {
        checked = finalizeAnswer(reparsed, { message, recentUserTexts, mask: true, grade });
        meta.retriedForLeaks.stillLeaked = leakList(checked.meta);
      } else {
        meta.retriedForLeaks.error = reparsed ? "type_changed" : "json_failed";
      }
    } catch (err) {
      // Lần gọi lại không bắt buộc: lỗi gì (429, mạng, timeout) cũng dùng bản đầu đã thay "?",
      // không biến một câu trả lời dùng được thành lỗi.
      meta.retriedForLeaks.error = `${err?.status || ""} ${err?.code || err?.name || "error"}`.trim();
    }
  }
  if (!checked && meta.truncated) {
    const answer = { type: "unavailable", formulaIds: [], intro: DEFAULT_TEXT.unavailable, steps: [], reminder: "" };
    return { answer, reply: answer.intro, meta: { ...meta, jsonFailed: true } };
  }
  if (!checked) checked = finalizeAnswer(parsed, { message, recentUserTexts, mask: true, grade });
  return withNonDeliveryNotice({ answer: checked.answer, reply: checked.reply, meta: { ...meta, ...checked.meta } }, { message, grade });
}

/**
 * Lời nhắc gửi lại model khi nó báo invalid_data mà backend không kiểm chứng được. Chỉ model thấy. Không khẳng
 * định ba cạnh hợp lệ (backend không biết đề có đúng ba cạnh hay model nêu sai cạnh) — chỉ nói điều đã biết.
 */
const INVALID_DATA_RECHECK = [
  "Hệ thống đã kiểm tra lại: các số cạnh bạn nêu trong trường sides không chứng minh được dữ kiện vô lý (chúng không vi phạm bất đẳng thức tam giác, hoặc không khớp số trong đề).",
  "Đọc lại đề. Nếu ba cạnh đề cho thỏa bất đẳng thức tam giác (tổng hai cạnh bất kỳ lớn hơn cạnh còn lại) thì hướng dẫn bình thường như một câu trả lời solution.",
  "Chỉ trả invalid_data khi dữ kiện thật sự vô lý, và khi đó ghi đúng ba số cạnh có trong đề vào sides.",
  "Chỉ trả về JSON.",
].join(" ");

/** Danh sách giá trị bị bắt trong một lần kiểm tra (bước lọc, bước mask, intro/reminder). */
function leakList(checkedMeta) {
  const steps = [...(checkedMeta.removedSteps || []), ...(checkedMeta.maskedSteps || [])];
  const where = (checkedMeta.replaced || []).map((r) => (r === "intro" ? "(số trong câu mở đầu)" : "(số trong lời nhắc)"));
  const choices = (checkedMeta.choiceReveals || []).map((r) => `${CHOICE_PREFIX}"${r}")`);
  return [...new Set([...steps.flatMap((st) => st.leaked), ...where, ...choices])];
}

const CHOICE_PREFIX = "(nói phương án đúng: ";

/** Lời nhắc gửi lại model khi câu trả lời còn lộ số. Chỉ model thấy, học sinh không thấy. */
function retryInstruction(violations) {
  const choiceOnly = violations.every((v) => v.startsWith(CHOICE_PREFIX));
  if (choiceOnly) {
    return [
      `Câu trả lời vừa rồi nói ra phương án trắc nghiệm đúng: ${violations.slice(0, 4).join("; ")}.`,
      "Viết lại TOÀN BỘ câu trả lời (cùng type, cùng formula_ids): chỉ hướng dẫn cách giải, chỗ ra kết quả để ?, không nói phương án nào đúng hay sai, không viết \"đáp án A\", \"chọn B\", \"phương án C đúng\". Bước cuối nhắc học sinh tự tính rồi tự đối chiếu với các phương án.",
      "Chỉ trả về JSON.",
    ].join(" ");
  }
  return [
    `Câu trả lời vừa rồi còn giá trị số tính sẵn hoặc lộ nghiệm: ${violations.slice(0, 8).join("; ")}.`,
    ...(violations.some((v) => v.startsWith(CHOICE_PREFIX)) ? ["Đồng thời không được nói phương án trắc nghiệm nào đúng."] : []),
    "Viết lại TOÀN BỘ câu trả lời (cùng type, cùng formula_ids) theo quy tắc ô trống: chỗ ra kết quả viết ?, ở các bước sau gọi kết quả bằng ký hiệu (x_1, x_2, BC, S_n...), không viết khoảng hay giá trị hàm có chứa nghiệm (viết các khoảng chia bởi x_1, x_2; f(x_1)).",
    // Lần hỏi lại gửi lại nguyên system prompt (đủ quy tắc + ví dụ); câu dưới nhắc riêng lỗi 20b đã mắc
    // khi viết lại (2026-10-04): viết biểu thức đã thay số.
    "Viết công thức ký hiệu kèm dữ kiện (V = \\frac{1}{3}Bh, với B = a^2, h = 2a \\Rightarrow V = ?), không viết biểu thức đã thay số (8^2 + 5^2 - 2 \\cdot 8 \\cdot 5).",
    "Chỉ trả về JSON.",
  ].join(" ");
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
export function finalizeAnswer(parsed, { message, recentUserTexts = [], mask = false, grade = null }) {
  const result = normalizeAnswer(parsed, isValidFormulaId, (id) => getFormula(id)?.name);
  const { droppedIds, aiNote, sides, baseCandidate } = result;
  let normalized = result.answer;
  const sourceTexts = numberSourceTexts(message, recentUserTexts);
  // Ba cạnh không tạo thành tam giác (quy tắc 1f): backend kiểm lại rồi tự dựng câu giải thích. Kiểm
  // không được (model nêu sai cạnh / ba cạnh thật ra hợp lệ) → no_formula như trước, lời model vào log.
  if (normalized.type === "invalid_data") {
    const checked = checkTriangleSides(sides, sourceTexts.join("\n"));
    const answer = checked
      ? { ...normalized, intro: checked.intro, reminder: DEFAULT_TEXT.invalidDataReminder }
      : { type: "no_formula", formulaIds: [], intro: DEFAULT_TEXT.noFormulaIntro, steps: [], reminder: "" };
    return {
      answer,
      reply: toReplyText(answer, getFormula),
      meta: {
        rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions: 0, droppedSubstitutions: 0,
        removedSteps: [], maskedSteps: [], replaced: [], aiNote, choiceReveals: [],
        invalidData: { verified: Boolean(checked), sides },
      },
    };
  }
  // Lời giải không có id công thức bị normalizeAnswer đổi thành no_formula — trừ khi chỉ dùng kiến thức nền
  // đã duyệt (quy tắc 1c: tổng ba góc, Pytago, bất đẳng thức tam giác): backend tự nhận diện từ biểu
  // thức (checkBaseKnowledge), không tin AI khai. Đã kiểm được thì đây là câu trả lời thật (tính lượt);
  // không thì giữ no_formula (hoàn lượt) như trước.
  let baseKnowledge = null;
  if (normalized.type === "no_formula" && baseCandidate) {
    const verified = checkBaseKnowledge(baseCandidate, sourceTexts.join("\n"));
    baseKnowledge = { verified: Boolean(verified), kinds: verified?.kinds ?? [] };
    if (verified) {
      normalized = {
        type: "solution", formulaIds: [], intro: baseCandidate.intro || DEFAULT_TEXT.intro,
        steps: baseCandidate.steps, reminder: baseCandidate.reminder || DEFAULT_TEXT.reminder,
      };
    }
  }
  const { answer: withBraces, dropped: droppedExpressions } = dropBrokenExpressions(normalized);
  if (unsafeCircleAnswer(withBraces, message)) {
    const answer = { type: "no_formula", formulaIds: [], intro: DEFAULT_TEXT.noFormulaIntro, steps: [], reminder: "" };
    return { answer, reply: answer.intro, meta: { circleRejected: true } };
  }
  const chosen = withBraces.formulaIds.map(getFormula);
  const { answer: guarded, removedSteps, maskedSteps, replaced } = applyNumberGuard(withBraces, {
    sourceTexts,
    // + kiến thức nền THCS (quy tắc 1c): 180° của tổng ba góc là số có sẵn, không phải AI tự tính.
    // + dòng lớp học sinh: AI hay viết "theo chương trình lớp 10" — số lớp không phải số tự tính (chạy
    //   thật 2026-10-08: thiếu dòng này thì "10" bị bắt, phải hỏi lại 2 lần).
    formulaTexts: [...chosen.map((f) => `${f.latex}\n${f.explanation || ""}`), BACKGROUND_KNOWLEDGE_LATEX, gradeLine(grade) || ""],
    formulaNames: chosen.map((f) => f.name),
    mask,
  });
  // Làm sạch cuối: bỏ dòng biểu thức đã thay số (8^2 + 5^2 - 2·8·5…), giữ chữ của bước. Không tính
  // là vi phạm phải hỏi lại — không lộ đáp số, chỉ trái quy tắc "thay dữ kiện, không thay số".
  const { answer: cleaned, dropped: droppedSubstitutions } = dropNumericSubstitutions(guarded, sourceTexts.join("\n"));
  if (unsafeCircleAnswer(cleaned, message)) {
    const answer = { type: "no_formula", formulaIds: [], intro: DEFAULT_TEXT.noFormulaIntro, steps: [], reminder: "" };
    return { answer, reply: answer.intro, meta: { circleRejected: true } };
  }
  // Bài trắc nghiệm: không được nói phương án nào đúng (lib/choiceGuard.js). Lần kiểm tra đầu
  // (mask = false) chỉ phát hiện để hỏi lại AI; bản cuối (mask = true) bỏ hẳn các câu đó.
  const { answer: choiceChecked, reveals: choiceReveals } = isMultipleChoiceQuestion(message)
    ? guardChoiceReveals(cleaned, { strip: mask })
    : { answer: cleaned, reveals: [] };
  // Lời nhắc phải khớp bản cuối đã lọc: đôi khi AI nhắc "ô ?" dù không viết ô nào.
  const hasBlank = choiceChecked.steps.some((step) =>
    String(step.expression || "").includes("?")
    || [step.title, step.detail].some((part) => /\$[^$]*\?[^$]*\$|=\s*\?(?=[\s.,;:)]|$)/u.test(String(part || ""))));
  const answer = !hasBlank && /(?:^|\s)(?:các\s+)?ô\s*\?/iu.test(choiceChecked.reminder)
    ? { ...choiceChecked, reminder: "Bạn tự tính phần còn lại rồi ghi kết quả nhé!" }
    : choiceChecked;

  return {
    answer,
    reply: toReplyText(answer, getFormula),
    meta: { rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions, droppedSubstitutions, removedSteps, maskedSteps, replaced, aiNote, choiceReveals, ...(baseKnowledge && { baseKnowledge }) },
  };
}
