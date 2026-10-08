import { shortlistFormulas, getFormula, isValidFormulaId } from "./formulaCatalog.js";
import { buildFinderMessages, FINDER_MODEL, FINDER_FALLBACK_MODEL, FINDER_PARAMS, BACKGROUND_KNOWLEDGE_LATEX } from "./finderPrompt.js";
import {
  parseModelJson, normalizeAnswer, dropBrokenExpressions, applyNumberGuard, dropNumericSubstitutions, toReplyText, extractNumbers, DEFAULT_TEXT,
} from "./solutionGuard.js";
import { isMultipleChoiceQuestion, guardChoiceReveals } from "./choiceGuard.js";

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

/**
 * Câu trả lời có tính là 1 lượt hỏi AI không. Không tính (backend hoàn lượt) khi không giao được câu
 * trả lời thật: JSON hỏng phải trả câu mẫu, hoặc no_formula — thư viện chưa có công thức là lỗ hổng
 * của thư viện (hoặc app chưa hiểu cách viết của đề, vd "△"), không phải lỗi của học sinh. off_topic
 * và refuse_answer vẫn tính.
 */
export function countsAsTurn(answer, meta) {
  return !meta?.jsonFailed && answer?.type !== "no_formula";
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

/**
 * Hỏi AI Finder một câu và trả về câu trả lời ĐÃ KIỂM TRA. Toàn bộ luồng nằm ở đây để server.js
 * và bộ chấm so sánh model (chạy ngoài) dùng chung đúng một đoạn code.
 *
 * @param {object} opts
 * @param {import("groq-sdk").default} opts.groq
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
  const candidates = shortlistFormulas([message, ...recentUserTexts], 10, { grade });
  // Thứ tự cố định → thư viện → lịch sử → câu hỏi: giữ phần đầu giống hệt nhau cho prompt caching
  // của Groq (xem finderPrompt.js).
  const messages = buildFinderMessages({ candidates, history, message, grade });

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

  // Quy tắc "ô trống": câu trả lời còn giá trị số tính sẵn → yêu cầu AI viết lại MỘT lần (nếu còn
  // đủ thời gian). Lần viết lại vẫn lộ, hoặc không gọi lại được (hết giờ, 429 theo phút, JSON hỏng)
  // → thay đúng con số lộ bằng "?" (mask). Chỉ khi không thay sạch được mới bỏ bước.
  const first = finalizeAnswer(parsed, { message, recentUserTexts, mask: false });
  const violations = leakList(first.meta);
  let checked = null;
  if (violations.length && deadline - now() >= MIN_CALL_MS) {
    meta.retriedForLeaks = { leaked: violations };
    const retryMessages = [
      ...messages,
      { role: "assistant", content: JSON.stringify(parsed) },
      { role: "user", content: retryInstruction(violations) },
    ];
    const callRetry = async (retryModel) => {
      meta.attempts++;
      const completion = await groq.chat.completions.create(
        { model: retryModel, messages: retryMessages, ...FINDER_PARAMS },
        { timeout: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, deadline - now())) },
      );
      meta.promptTokens += completion.usage?.prompt_tokens ?? 0;
      meta.completionTokens += completion.usage?.completion_tokens ?? 0;
      meta.cachedTokens += completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
      return parseModelJson(completion.choices?.[0]?.message?.content);
    };
    try {
      let reparsed;
      try {
        reparsed = await callRetry(activeModel);
      } catch (err) {
        // Gói Groq miễn phí: 8k token/PHÚT mỗi model, lần đầu đã tốn ~5k nên lần hỏi lại ngay sau
        // gần như luôn 429 theo phút (chấm 2026-10-03: 3/3 lần). Hạn mức tính RIÊNG từng model →
        // hỏi lại bằng model dự phòng. 429 theo ngày / lỗi khác thì thôi, dùng bản đầu đã thay "?".
        const perMinute = err?.status === 429 && dailyLimitBlockMs(err) === null;
        if (!perMinute || activeModel !== FINDER_MODEL || deadline - now() < MIN_CALL_MS) throw err;
        meta.retriedForLeaks.model = FINDER_FALLBACK_MODEL;
        reparsed = await callRetry(FINDER_FALLBACK_MODEL);
      }
      if (reparsed && reparsed.type === parsed.type) {
        checked = finalizeAnswer(reparsed, { message, recentUserTexts, mask: true });
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
  if (!checked) checked = finalizeAnswer(parsed, { message, recentUserTexts, mask: true });
  return { answer: checked.answer, reply: checked.reply, meta: { ...meta, ...checked.meta } };
}

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
export function finalizeAnswer(parsed, { message, recentUserTexts = [], mask = false }) {
  const { answer: normalized, droppedIds, aiNote } = normalizeAnswer(parsed, isValidFormulaId, (id) => getFormula(id)?.name);
  const { answer: withBraces, dropped: droppedExpressions } = dropBrokenExpressions(normalized);
  const chosen = withBraces.formulaIds.map(getFormula);
  const sourceTexts = numberSourceTexts(message, recentUserTexts);
  const { answer: guarded, removedSteps, maskedSteps, replaced } = applyNumberGuard(withBraces, {
    sourceTexts,
    // + kiến thức nền THCS (quy tắc 1c): 180° của tổng ba góc là số có sẵn, không phải AI tự tính.
    formulaTexts: [...chosen.map((f) => `${f.latex}\n${f.explanation || ""}`), BACKGROUND_KNOWLEDGE_LATEX],
    formulaNames: chosen.map((f) => f.name),
    mask,
  });
  // Làm sạch cuối: bỏ dòng biểu thức đã thay số (8^2 + 5^2 - 2·8·5…), giữ chữ của bước. Không tính
  // là vi phạm phải hỏi lại — không lộ đáp số, chỉ trái quy tắc "thay dữ kiện, không thay số".
  const { answer: cleaned, dropped: droppedSubstitutions } = dropNumericSubstitutions(guarded, sourceTexts.join("\n"));
  // Bài trắc nghiệm: không được nói phương án nào đúng (lib/choiceGuard.js). Lần kiểm tra đầu
  // (mask = false) chỉ phát hiện để hỏi lại AI; bản cuối (mask = true) bỏ hẳn các câu đó.
  const { answer, reveals: choiceReveals } = isMultipleChoiceQuestion(message)
    ? guardChoiceReveals(cleaned, { strip: mask })
    : { answer: cleaned, reveals: [] };

  return {
    answer,
    reply: toReplyText(answer, getFormula),
    meta: { rawType: parsed.type, rawIds: parsed.formula_ids, droppedIds, droppedExpressions, droppedSubstitutions, removedSteps, maskedSteps, replaced, aiNote, choiceReveals },
  };
}
