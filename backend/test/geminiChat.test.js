import test from "node:test";
import assert from "node:assert/strict";
import { createGeminiClient, toGeminiPayload, parseRetryDelay, geminiHttpError, THINKING_HEADROOM } from "../lib/geminiChat.js";
import { retryAfterSeconds, dailyLimitBlockMs, rateLimitKind, primaryBlockMs } from "../lib/finderAnswer.js";

const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const okBody = (text, extra = {}) => ({
  candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP", ...extra }],
  usageMetadata: { promptTokenCount: 5000, candidatesTokenCount: 700, thoughtsTokenCount: 200 },
});
const quotaBody = (quotaId, retryDelay) => ({
  error: {
    code: 429, status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota, please check your plan and billing details.",
    details: [
      { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaMetric: "generativelanguage.googleapis.com/generate_content_free_tier_requests", quotaId }] },
      ...(retryDelay ? [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay }] : []),
    ],
  },
});

test("toGeminiPayload: system gộp vào systemInstruction theo thứ tự, assistant → model, cùng vai liên tiếp gộp lại", () => {
  const { systemInstruction, contents } = toGeminiPayload([
    { role: "system", content: "QUY TẮC" },
    { role: "system", content: "THƯ VIỆN" },
    { role: "user", content: "hỏi 1" },
    { role: "assistant", content: "đáp 1" },
    { role: "system", content: "Học sinh đang học lớp 10." },
    { role: "user", content: "hỏi 2" },
  ]);
  assert.equal(systemInstruction.parts[0].text, "QUY TẮC\n\nTHƯ VIỆN\n\nHọc sinh đang học lớp 10.");
  assert.deepEqual(contents.map((c) => c.role), ["user", "model", "user"]);
  assert.equal(contents[2].parts[0].text, "hỏi 2");
  const merged = toGeminiPayload([{ role: "user", content: "a" }, { role: "user", content: "b" }]);
  assert.equal(merged.contents.length, 1);
  assert.equal(merged.systemInstruction, undefined);
});

test("parseRetryDelay", () => {
  assert.equal(parseRetryDelay("34s"), 34);
  assert.equal(parseRetryDelay("1.5s"), 1.5);
  assert.equal(parseRetryDelay("2m10s"), 130);
  assert.equal(parseRetryDelay("1h"), 3600);
  assert.equal(parseRetryDelay("abc"), null);
  assert.equal(parseRetryDelay(undefined), null);
});

test("create: gửi đúng URL/khoá/khung, KHÔNG responseMimeType, trần cộng dư địa suy nghĩ, trả hình dạng như Groq", async () => {
  let seen;
  const client = createGeminiClient({ apiKey: "K", thinkingLevel: "low", fetchImpl: async (url, init) => { seen = { url, init, body: JSON.parse(init.body) }; return json(200, okBody('{"type":"solution"}')); } });
  const out = await client.chat.completions.create({
    model: "gemini-x", temperature: 0.2, max_completion_tokens: 2300, reasoning_effort: "medium",
    messages: [{ role: "system", content: "S" }, { role: "user", content: "U" }],
  }, { timeout: 5000 });
  assert.equal(seen.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent");
  assert.equal(seen.init.headers["x-goog-api-key"], "K");
  assert.equal(seen.body.generationConfig.responseMimeType, undefined);
  assert.equal(seen.body.generationConfig.maxOutputTokens, 2300 + THINKING_HEADROOM);
  assert.deepEqual(seen.body.generationConfig.thinkingConfig, { thinkingLevel: "low" });
  assert.equal(seen.body.generationConfig.temperature, 0.2);
  assert.equal(seen.body.systemInstruction.parts[0].text, "S");
  assert.equal(out.choices[0].message.content, '{"type":"solution"}');
  assert.equal(out.choices[0].finish_reason, "stop");
  assert.deepEqual(out.usage, { prompt_tokens: 5000, completion_tokens: 900, prompt_tokens_details: { cached_tokens: 0 } });
});

test("create: bỏ phần 'thought', MAX_TOKENS → finish_reason length, bị chặn/không có câu trả lời → length", async () => {
  const mk = (body) => createGeminiClient({ apiKey: "K", fetchImpl: async () => json(200, body) });
  const params = { model: "m", messages: [{ role: "user", content: "U" }] };
  const thought = await mk({ candidates: [{ content: { parts: [{ text: "nghĩ", thought: true }, { text: "TRẢ LỜI" }] }, finishReason: "STOP" }] }).chat.completions.create(params);
  assert.equal(thought.choices[0].message.content, "TRẢ LỜI");
  const cut = await mk(okBody("{ dở", { finishReason: "MAX_TOKENS" })).chat.completions.create(params);
  assert.equal(cut.choices[0].finish_reason, "length");
  const blocked = await mk({ promptFeedback: { blockReason: "SAFETY" } }).chat.completions.create(params);
  assert.equal(blocked.choices[0].finish_reason, "length");
});

test("lỗi 429 theo PHÚT: finderAnswer đọc được retry-after, loại hạn mức, không coi là hạn mức ngày", async () => {
  const client = createGeminiClient({ apiKey: "K", fetchImpl: async () => json(429, quotaBody("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "34s")) });
  const err = await client.chat.completions.create({ model: "m", messages: [] }).catch((e) => e);
  assert.equal(err.status, 429);
  assert.equal(retryAfterSeconds(err), 34);
  assert.equal(rateLimitKind(err), "RPM");
  assert.equal(dailyLimitBlockMs(err), null);
  assert.equal(primaryBlockMs(err), 34_000);
});

test("lỗi 429 theo NGÀY: bị nhận là hạn mức ngày (chặn model chính lâu), kể cả khi retryDelay chỉ 1s", async () => {
  const err = geminiHttpError(429, quotaBody("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "1s"));
  assert.equal(rateLimitKind(err), "RPD");
  assert.equal(dailyLimitBlockMs(err), 1000);
  const noDelay = geminiHttpError(429, quotaBody("GenerateRequestsPerDayPerProjectPerModel-FreeTier"));
  assert.equal(dailyLimitBlockMs(noDelay), 10 * 60_000);
  assert.equal(retryAfterSeconds(noDelay), 60);
});

test("lỗi 429 theo token/phút và không có chi tiết → theo phút, mặc định 60 giây", () => {
  const tpm = geminiHttpError(429, quotaBody("GenerateContentInputTokensPerMinutePerProjectPerModel-FreeTier", "7s"));
  assert.equal(rateLimitKind(tpm), "TPM");
  const bare = geminiHttpError(429, { error: { message: "quota" } });
  assert.equal(retryAfterSeconds(bare), 60);
  assert.equal(dailyLimitBlockMs(bare), null);
  assert.equal(primaryBlockMs(bare), 60_000);
});

test("503 / timeout / mạng: status giữ nguyên để server và askFinder xử lý", async () => {
  const unavailable = geminiHttpError(503, { error: { status: "UNAVAILABLE", message: "overloaded" } });
  assert.equal(unavailable.status, 503);
  assert.equal(primaryBlockMs(unavailable), 20_000);
  const net = createGeminiClient({ apiKey: "K", fetchImpl: async () => { throw Object.assign(new Error("x"), { name: "TypeError" }); } });
  const e1 = await net.chat.completions.create({ model: "m", messages: [] }).catch((e) => e);
  assert.equal(e1.status, 502);
  assert.equal(primaryBlockMs(e1), null);
  const slow = createGeminiClient({ apiKey: "K", fetchImpl: async () => { throw Object.assign(new Error("t"), { name: "TimeoutError" }); } });
  const e2 = await slow.chat.completions.create({ model: "m", messages: [] }).catch((e) => e);
  assert.equal(e2.status, 408);
});

test("lỗi không để lộ khoá API", async () => {
  const client = createGeminiClient({ apiKey: "SECRET-KEY-123", fetchImpl: async () => json(400, { error: { message: "API key not valid" } }) });
  const err = await client.chat.completions.create({ model: "m", messages: [] }).catch((e) => e);
  assert.equal(err.status, 400);
  assert.ok(!String(err.message).includes("SECRET-KEY-123"));
});

// ─── Mô phỏng đúng lỗi người dùng gặp: "một phút chỉ trả lời được một câu" ─────────────────────
import { askFinder, fallbackState, CHAT_BUDGET_MS } from "../lib/finderAnswer.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "../lib/finderPrompt.js";

const GOOD_ANSWER = JSON.stringify({
  type: "solution", formula_ids: ["hh12-matcau-thetich"], intro: "Dùng công thức thể tích khối cầu.",
  steps: [{ title: "Thay số", detail: "Thay $R = 6$:", expression: "V = \\frac{4}{3}\\pi \\cdot 6^3" }], reminder: "Tự tính nhé!",
});

/** Gemini giả: mỗi model chỉ nhận `perMinute` yêu cầu trong cửa sổ 60 giây (đồng hồ ảo), vượt thì 429 theo phút. */
function quotaFetch(limits, clock, log) {
  const hits = new Map();
  return async (url) => {
    const model = /models\/([^:]+):/.exec(url)[1];
    log.push(model);
    clock.t += 300;
    const recent = (hits.get(model) || []).filter((t) => clock.t - t < 60_000);
    if (recent.length >= (limits[model] ?? 0)) {
      hits.set(model, recent);
      const wait = Math.ceil((60_000 - (clock.t - recent[0])) / 1000);
      return json(429, quotaBody("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", `${wait}s`));
    }
    hits.set(model, [...recent, clock.t]);
    return json(200, okBody(GOOD_ANSWER));
  };
}

test("mô phỏng: model chính chỉ cho 1 yêu cầu/phút — các câu sau vẫn được trả lời nhờ model dự phòng, không phải chờ 60 giây", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const clock = { t: 0 };
  const log = [];
  const client = createGeminiClient({ apiKey: "K", fetchImpl: quotaFetch({ [FINDER_MODEL]: 1, [FINDER_FALLBACK_MODEL]: 5 }, clock, log) });
  const answers = [];
  for (let i = 0; i < 4; i++) {
    clock.t += 5_000; // học sinh hỏi cách nhau vài giây
    const out = await askFinder({ groq: client, message: "Tính thể tích khối cầu bán kính 6 cm", now: () => clock.t, deadline: clock.t + CHAT_BUDGET_MS });
    answers.push(out.answer.type);
  }
  assert.deepEqual(answers, ["solution", "solution", "solution", "solution"]);
  // câu 1 → model chính; câu 2 gặp 429 một lần rồi sang dự phòng; câu 3–4 vào thẳng dự phòng (đã nhớ mốc)
  assert.deepEqual(log, [FINDER_MODEL, FINDER_MODEL, FINDER_FALLBACK_MODEL, FINDER_FALLBACK_MODEL, FINDER_FALLBACK_MODEL]);
  fallbackState.primaryBlockedUntil = 0;
});

test("mô phỏng: cả hai model cùng hết hạn mức phút → lỗi 429 có retryAfter thật của Gemini (không mặc định 60 giây)", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const clock = { t: 0 };
  const client = createGeminiClient({ apiKey: "K", fetchImpl: quotaFetch({ [FINDER_MODEL]: 0, [FINDER_FALLBACK_MODEL]: 0 }, clock, []) });
  const err = await askFinder({ groq: client, message: "Tính thể tích khối cầu bán kính 6 cm", now: () => clock.t, deadline: clock.t + CHAT_BUDGET_MS }).catch((e) => e);
  assert.equal(err.status, 429);
  assert.equal(rateLimitKind(err), "RPM");
  fallbackState.primaryBlockedUntil = 0;
});

test("Gemini: lịch sử dài KHÔNG bị chặn bởi trần token kiểu Groq (không có 503 giả), trần completion giữ cố định", async () => {
  fallbackState.primaryBlockedUntil = 0;
  const bodies = [];
  const client = createGeminiClient({ apiKey: "K", fetchImpl: async (url, init) => { bodies.push(JSON.parse(init.body)); return json(200, okBody(GOOD_ANSWER)); } });
  for (const turns of [0, 4, 10]) {
    const history = Array.from({ length: turns }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(1000) }));
    const out = await askFinder({ groq: client, message: "Tính thể tích khối cầu bán kính 6 cm", history });
    assert.equal(out.answer.type, "solution", `${turns} lượt`);
  }
  assert.ok(bodies.every((b) => b.generationConfig.maxOutputTokens === 2300 + THINKING_HEADROOM));
});

test("429 thật của Gemini (đo 2026-10-30): RPM, retry 16s từ RetryInfo; thiếu RetryInfo thì đọc từ câu thông báo", () => {
  const message = "You exceeded your current quota. \n* Quota exceeded for metric: generate_content_free_tier_requests, limit: 15, model: gemini-3.5-flash-lite\nPlease retry in 16.312201539s.";
  const real = { error: { code: 429, message, status: "RESOURCE_EXHAUSTED", details: [
    { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }] },
    { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "16s" },
  ] } };
  const err = geminiHttpError(429, real);
  assert.equal(rateLimitKind(err), "RPM");
  assert.equal(retryAfterSeconds(err), 16);
  assert.equal(dailyLimitBlockMs(err), null);
  assert.equal(primaryBlockMs(err), 16_000);
  const noInfo = geminiHttpError(429, { error: { message, details: [] } });
  assert.equal(retryAfterSeconds(noInfo), 17);
});
