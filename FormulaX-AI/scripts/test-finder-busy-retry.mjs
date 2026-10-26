import { test } from "node:test";
import assert from "node:assert/strict";
import { retryFinderBusyOnce } from "../src/utils/finderBusyRetry.js";

const busy = (retryAfter) => Object.assign(new Error("AI đang bận"), { code: "ai_busy", retryAfter });

test("chat gõ tay: 429 chờ retryAfter rồi hỏi lại đúng một lần", async () => {
  let calls = 0;
  const result = await retryFinderBusyOnce(
    async () => {
      calls++;
      if (calls === 1) throw busy(7);
      return { type: "solution" };
    },
    async (seconds) => { assert.equal(seconds, 7); return true; },
  );
  assert.deepEqual(result, { type: "solution" });
  assert.equal(calls, 2);
});

test("chat gõ tay: 429 lần hai dừng, không hỏi lần ba", async () => {
  let calls = 0;
  await assert.rejects(() => retryFinderBusyOnce(
    async () => { calls++; throw busy(2); },
    async () => true,
  ), { code: "ai_busy" });
  assert.equal(calls, 2);
});

test("chat gõ tay: rời cuộc trò chuyện lúc chờ thì không gọi lại", async () => {
  let calls = 0;
  const result = await retryFinderBusyOnce(
    async () => { calls++; throw busy(10); },
    async () => false,
  );
  assert.equal(result, null);
  assert.equal(calls, 1);
});

test("chat gõ tay: lỗi khác đi thẳng về xử lý cũ", async () => {
  const error = Object.assign(new Error("mất mạng"), { code: "network" });
  let waits = 0;
  await assert.rejects(() => retryFinderBusyOnce(
    async () => { throw error; },
    async () => { waits++; return true; },
  ), error);
  assert.equal(waits, 0);
});
