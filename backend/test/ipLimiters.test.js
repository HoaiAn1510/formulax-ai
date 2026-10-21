import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";
import { IP_LIMITER_OPTIONS, createIpLimiters } from "../lib/ipLimiters.js";

// So sánh từng bộ giới hạn IP có handler đếm sự kiện ("sau") với chính cấu hình đó dùng handler mặc
// định của express-rate-limit ("trước", đúng như server.js trước khi có trang quản trị).
async function hitUntilLimited(limiter, times) {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/x", limiter, (req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const url = `http://127.0.0.1:${server.address().port}/x`;
  try {
    let last;
    for (let i = 0; i < times; i++) last = await fetch(url);
    return {
      status: last.status,
      contentType: last.headers.get("content-type"),
      body: await last.json(),
      rateLimit: last.headers.get("ratelimit"),
      rateLimitPolicy: last.headers.get("ratelimit-policy"),
      retryAfter: last.headers.get("retry-after"),
    };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const EXPECTED_METRIC = { chatBurst: "chat_ip_limited", chatDaily: "chat_ip_limited", ocrIp: "ocr_rate_limited" };

for (const [name, options] of Object.entries(IP_LIMITER_OPTIONS)) {
  test(`${name}: vượt giới hạn → 429, body JSON và header giống hệt handler mặc định; đếm đúng 1 lần`, async () => {
    const bumps = [];
    const after = await hitUntilLimited(createIpLimiters((m) => bumps.push(m))[name], options.max + 1);
    const before = await hitUntilLimited(rateLimit(options), options.max + 1);

    assert.equal(after.status, 429);
    assert.deepEqual(after.body, options.message);
    assert.deepEqual(after.body, before.body);
    assert.equal(after.status, before.status);
    assert.equal(after.contentType, before.contentType);
    assert.match(after.contentType, /^application\/json/);
    // draft-7: RateLimit-Policy cố định theo cấu hình; RateLimit có limit + remaining=0 + reset (giây).
    assert.equal(after.rateLimitPolicy, before.rateLimitPolicy);
    assert.equal(after.rateLimitPolicy, `${options.max};w=${options.windowMs / 1000}`);
    assert.match(after.rateLimit, new RegExp(`^limit=${options.max}, remaining=0, reset=\\d+$`));
    assert.match(before.rateLimit, new RegExp(`^limit=${options.max}, remaining=0, reset=\\d+$`));
    assert.ok(Number(after.retryAfter) > 0 && Number(before.retryAfter) > 0, "có Retry-After");
    assert.ok(Math.abs(Number(after.retryAfter) - Number(before.retryAfter)) <= 1);

    assert.deepEqual(bumps, [EXPECTED_METRIC[name]]);
  });
}

test("chưa vượt giới hạn: không đếm, request đi tiếp bình thường", async () => {
  const bumps = [];
  const res = await hitUntilLimited(createIpLimiters((m) => bumps.push(m)).chatBurst, 1).catch((e) => e);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.deepEqual(bumps, []);
});
