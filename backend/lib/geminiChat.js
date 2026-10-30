// Cầu nối Gemini → giao diện `chat.completions.create` mà askFinder (lib/finderAnswer.js) đang dùng.
// Gọi REST thẳng, KHÔNG cài SDK (CLAUDE.md: đừng cài thêm SDK provider). Mục tiêu: đổi nhà cung cấp mà
// không đụng vào bộ lọc đáp án, hoàn lượt, thời gian — nên kết quả và lỗi được đổi về đúng hình dạng
// mà code cũ đã đọc (choices[0].message.content, finish_reason, usage; lỗi có status, headers, error.error.message).

const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Token "suy nghĩ" của Gemini 3.x nằm TRONG trần maxOutputTokens (tài liệu Google). askFinder tính trần
// theo ngân sách của Groq (≤ 2.300 token chữ) — không cộng thêm thì câu trả lời bị cắt (MAX_TOKENS) dù
// model viết chưa dài. Phần cộng thêm này chỉ là dư địa cho suy nghĩ, không làm câu trả lời dài hơn.
export const THINKING_HEADROOM = 1500;
export const DEFAULT_THINKING_LEVEL = "low";

const FINISH_REASON = { STOP: "stop", MAX_TOKENS: "length" };

/** messages kiểu OpenAI → { systemInstruction, contents } của Gemini. Mọi tin system gộp lại theo thứ tự. */
export function toGeminiPayload(messages) {
  const system = [];
  const contents = [];
  for (const m of messages) {
    const text = String(m.content ?? "");
    if (m.role === "system") {
      system.push(text);
      continue;
    }
    const role = m.role === "assistant" ? "model" : "user";
    const last = contents.at(-1);
    // Gemini muốn lượt user/model xen kẽ: hai tin cùng vai liên tiếp thì gộp vào một.
    if (last && last.role === role) last.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  }
  return { systemInstruction: system.length ? { parts: [{ text: system.join("\n\n") }] } : undefined, contents };
}

/** "34s" / "34.5s" / "1m" → số giây; không đọc được → null. */
export function parseRetryDelay(value) {
  const m = /^\s*(?:(\d+)h)?\s*(?:(\d+)m(?!s))?\s*(?:([\d.]+)s)?\s*$/.exec(String(value ?? ""));
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

/**
 * Lỗi HTTP của Gemini → Error có hình dạng như lỗi của Groq SDK, để retryAfterSeconds / dailyLimitBlockMs /
 * rateLimitKind trong finderAnswer.js đọc được mà không sửa. 429: RetryInfo.retryDelay → header retry-after
 * và "try again in Ns"; QuotaFailure.quotaId có "PerDay" → "per day (RPD/TPD)", "PerMinute" → "(RPM/TPM)".
 * Lưu ý: Google không ghi rõ dạng body 429 trong tài liệu rate-limits; dạng này lấy từ lỗi thật được
 * người dùng đăng trên diễn đàn Google (quotaId, retryDelay "1s"). Không có chi tiết → coi là theo phút.
 */
export function geminiHttpError(status, body) {
  const e = body?.error ?? {};
  const details = Array.isArray(e.details) ? e.details : [];
  const retryInfo = details.find((d) => String(d?.["@type"] || "").endsWith("RetryInfo"));
  const violations = details.filter((d) => String(d?.["@type"] || "").endsWith("QuotaFailure")).flatMap((d) => d.violations || []);
  const quotaText = violations.map((v) => `${v.quotaId || ""} ${v.quotaMetric || ""}`).join(" ");
  // Body 429 thật (đo 2026-10-30): có RetryInfo.retryDelay "16s"; không có header Retry-After. Phòng khi một lần
  // 429 thiếu RetryInfo, đọc "Please retry in 16.3s" trong chính câu thông báo.
  const inMessage = /retry in ([\d.]+)s/i.exec(String(e.message || ""));
  const retryS = parseRetryDelay(retryInfo?.retryDelay) ?? (inMessage ? Number(inMessage[1]) : null);
  let message = `gemini ${status}: ${String(e.message || e.status || "error").slice(0, 300)}`;
  const headers = {};
  if (status === 429) {
    const perDay = /PerDay/i.test(quotaText);
    const isToken = /Token/i.test(quotaText);
    message += ` per ${perDay ? "day" : "minute"} (${perDay ? (isToken ? "TPD" : "RPD") : (isToken ? "TPM" : "RPM")})`;
    if (retryS !== null) {
      headers["retry-after"] = String(Math.max(1, Math.ceil(retryS)));
      message += ` try again in ${retryS}s`;
    }
  }
  return Object.assign(new Error(message), { status, headers, error: { error: { message } } });
}

/**
 * @param {{ apiKey: string, fetchImpl?: typeof fetch, thinkingLevel?: string }} opts
 * @returns client có `chat.completions.create(params, { timeout })`
 */
export function createGeminiClient({ apiKey, fetchImpl = fetch, thinkingLevel = DEFAULT_THINKING_LEVEL } = {}) {
  async function create(params, { timeout = 25_000 } = {}) {
    const { systemInstruction, contents } = toGeminiPayload(params.messages || []);
    const generationConfig = {
      temperature: params.temperature,
      // KHÔNG đặt responseMimeType: chế độ JSON vẫn có lúc viết lệnh LaTeX một dấu \ (xem ocrReader.js) và
      // ép sinh JSON làm mất dấu \ — parseModelJson tự sửa escape từ văn bản tự do (lý do giống bên Groq).
      maxOutputTokens: (params.max_completion_tokens || 2300) + (thinkingLevel ? THINKING_HEADROOM : 0),
      ...(thinkingLevel && { thinkingConfig: { thinkingLevel } }),
    };
    let res;
    try {
      res = await fetchImpl(GEMINI_URL(params.model), {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ ...(systemInstruction && { systemInstruction }), contents, generationConfig }),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (err) {
      const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
      throw Object.assign(new Error(`gemini ${timedOut ? "timeout" : "network"}`), { status: timedOut ? 408 : 502, code: timedOut ? "ETIMEDOUT" : "ENETWORK" });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw geminiHttpError(res.status, data);

    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
    // Bị chặn an toàn / không có câu trả lời: coi như cắt dở → askFinder không giao nửa vời.
    const finish = candidate ? FINISH_REASON[candidate.finishReason] ?? (text ? "stop" : "length") : "length";
    const u = data?.usageMetadata || {};
    return {
      choices: [{ message: { role: "assistant", content: text }, finish_reason: finish }],
      usage: {
        prompt_tokens: u.promptTokenCount || 0,
        completion_tokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
        prompt_tokens_details: { cached_tokens: u.cachedContentTokenCount || 0 },
      },
    };
  }
  // enforcesTpmCap: false → askFinder không áp trần token kiểu Groq (xem createCompletion trong finderAnswer.js).
  return { enforcesTpmCap: false, chat: { completions: { create } } };
}
