import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createAdminRouter } from "../routes/admin.js";
import { maskEmail, publicOrders, channelTotals, numericRows, sumColumns } from "../lib/adminStats.js";
import { createUsageMetrics, USAGE_METRICS } from "../lib/usageMetrics.js";

const NOW = Date.parse("2026-10-21T05:00:00Z");
const ADMIN = "admin@x.com";

// ─── Che email ───────────────────────────────────────────────────────────────

test("maskEmail: an***@gmail.com, tên ngắn giữ 1 ký tự, không phải email → null", () => {
  assert.equal(maskEmail("andrew@gmail.com"), "an***@gmail.com");
  assert.equal(maskEmail("abc@school.edu.vn"), "ab***@school.edu.vn");
  assert.equal(maskEmail("ab@gmail.com"), "a***@gmail.com");
  assert.equal(maskEmail("a@gmail.com"), "a***@gmail.com");
  for (const bad of [null, undefined, "", "no-at-sign", "@gmail.com", 42]) assert.equal(maskEmail(bad), null, String(bad));
});

test("maskEmail: chạy lại trên email đã che không đổi (SQL che trước, backend che lần hai)", () => {
  for (const e of ["andrew@gmail.com", "ab@gmail.com", "a@b.co"]) {
    const once = maskEmail(e);
    assert.equal(maskEmail(once), once);
  }
});

test("publicOrders: chỉ trường được phép, email luôn che, không google_id / mã giao dịch", () => {
  const rows = publicOrders([{
    created_at: "2026-10-20T03:00:00Z", plan: "monthly", amount: "49000", status: "success",
    signup_source: "tiktok", email_masked: "andrew@gmail.com", // giả sử SQL quên che
    google_id: "1234567890", order_id: "999", payos_reference: "FT123",
  }, { created_at: "2026-10-19T03:00:00Z", plan: "6months", amount: 249000, status: "pending", signup_source: null, email_masked: null }]);
  assert.deepEqual(rows[0], { created_at: "2026-10-20T03:00:00Z", plan: "monthly", amount: 49000, status: "success", source: "tiktok", email: "an***@gmail.com" });
  assert.deepEqual(Object.keys(rows[0]).sort(), ["amount", "created_at", "email", "plan", "source", "status"]);
  assert.equal(rows[1].email, null);
  assert.equal(rows[1].source, null);
});

test("channelTotals / numericRows / sumColumns", () => {
  const total = channelTotals([
    { source: "tiktok", visits: 100, signups: 10, paid_users: 2, revenue: 98000 },
    { source: "direct", visits: 50, signups: 5, paid_users: 1, revenue: 49000 },
  ]);
  assert.deepEqual(total, { source: "Tổng", visits: 150, signups: 15, paid_users: 3, revenue: 147000, signup_rate: 0.1, paid_rate: 0.2 });
  assert.equal(channelTotals([]).signup_rate, null);
  assert.deepEqual(numericRows([{ day: "2026-10-21", n: "3" }]), [{ day: "2026-10-21", n: 3 }]);
  assert.deepEqual(sumColumns([{ a: "1", b: 2 }, { a: 3, b: null }], ["a", "b"]), { a: 4, b: 2 });
});

// ─── Bộ đếm sự kiện: chạy ngầm, không bao giờ ném lỗi ─────────────────────────────

test("usageMetrics: chỉ nhận 6 chỉ số, lỗi DB (ném ra hoặc promise reject) bị bỏ qua", async () => {
  const calls = [];
  const bump = createUsageMetrics({ rpc: (name, args) => { calls.push([name, args]); return Promise.reject(new Error("db down")); } });
  assert.equal(bump("ai_busy"), undefined);
  bump("khong_co");
  assert.deepEqual(calls, [["bump_usage_metric", { p_metric: "ai_busy" }]]);
  const throwing = createUsageMetrics({ rpc: () => { throw new Error("sync"); } });
  assert.doesNotThrow(() => throwing("ai_busy"));
  assert.doesNotThrow(() => createUsageMetrics(null)("ai_busy"));
  assert.equal(USAGE_METRICS.length, 6);
  await new Promise((r) => setImmediate(r)); // không có unhandled rejection
});

// ─── Phân quyền route ────────────────────────────────────────────────────────

const googleUser = (over = {}) => ({
  email: "hs@gmail.com", is_anonymous: false, identities: [{ provider: "google", id: "g-1" }], ...over,
});
const verifyAs = (user) => async () => user;
const rejectAuth = async () => { throw Object.assign(new Error("Thiếu Authorization header."), { status: 401 }); };

function fakeDb(data = {}) {
  const calls = [];
  return {
    calls,
    rpc(name, args) {
      calls.push({ name, args });
      return Promise.resolve({ data: data[name] ?? [], error: null });
    },
  };
}

async function withServer(opts, fn) {
  const app = express();
  app.use("/api/admin", createAdminRouter({
    extractGoogleId: (u) => u.identities?.find((i) => i.provider === "google")?.id || null,
    adminEmails: () => ADMIN,
    now: () => NOW,
    ...opts,
  }));
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  try {
    await fn(`http://127.0.0.1:${server.address().port}/api/admin`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const ADMIN_ROUTES = ["overview", "channel-stats", "users", "revenue", "usage"];

test("GET /me: thiếu token 401; khách và non-admin 200 false; admin 200 true", async () => {
  const cases = [
    { verifyUser: rejectAuth, status: 401 },
    { verifyUser: verifyAs(googleUser()), status: 200, isAdmin: false },
    { verifyUser: verifyAs(googleUser({ email: ADMIN, is_anonymous: true })), status: 200, isAdmin: false },
    { verifyUser: verifyAs(googleUser({ email: ADMIN, identities: [] })), status: 200, isAdmin: false },
    { verifyUser: verifyAs(googleUser({ email: "Admin@X.com" })), status: 200, isAdmin: true },
  ];
  for (const { verifyUser, status, isAdmin } of cases) {
    const db = fakeDb();
    await withServer({ db, verifyUser }, async (base) => {
      const res = await fetch(`${base}/me`);
      assert.equal(res.status, status);
      if (isAdmin !== undefined) assert.deepEqual(await res.json(), { isAdmin });
    });
    assert.equal(db.calls.length, 0, "/me không đọc số liệu");
  }
});

test("GET /me: ADMIN_EMAILS trống → không ai là admin", async () => {
  await withServer({ db: fakeDb(), verifyUser: verifyAs(googleUser({ email: ADMIN })), adminEmails: () => "" }, async (base) => {
    assert.deepEqual(await (await fetch(`${base}/me`)).json(), { isAdmin: false });
  });
});

test("mọi route số liệu: thiếu token 401, non-admin / khách 403, không gọi DB", async () => {
  for (const [verifyUser, status] of [
    [rejectAuth, 401],
    [verifyAs(googleUser()), 403],
    [verifyAs(googleUser({ email: ADMIN, is_anonymous: true })), 403],
    [verifyAs(googleUser({ email: ADMIN, identities: [] })), 403],
  ]) {
    const db = fakeDb();
    await withServer({ db, verifyUser }, async (base) => {
      for (const r of ADMIN_ROUTES) assert.equal((await fetch(`${base}/${r}`)).status, status, `${r} → ${status}`);
    });
    assert.equal(db.calls.length, 0);
  }
});

test("admin: đọc được mọi route; from/to sai → 400", async () => {
  const db = fakeDb({
    admin_overview: [{ new_accounts: "3", premium_active: 2, revenue_total: "98000", paid_orders: 2, ai_turns_today: 15, ocr_scans_today: 4 }],
    channel_stats: [{ source: "tiktok", visits: 10, signups: 2, paid_users: 1, revenue: 49000 }],
    admin_user_totals: [{ google_accounts_total: "40", premium_active: 2, premium_no_expiry: 1, premium_expiring_7d: 0 }],
    admin_signups_by_day: [{ day: "2026-10-20", new_accounts: 1 }, { day: "2026-10-21", new_accounts: "2" }],
    admin_revenue_by_day: [{ day: "2026-10-21", paid_orders: 1, revenue: 49000 }],
    admin_recent_orders: [{ created_at: "x", plan: "monthly", amount: 49000, status: "success", signup_source: null, email_masked: "an***@gmail.com" }],
    admin_usage_by_day: [{ day: "2026-10-21", ai_free_turns: 12, ai_premium_turns: 3, ai_users_at_limit: 1, ocr_scans: 4, ocr_users_at_limit: 0, ai_quota_exceeded: 2, ai_busy: 0, ocr_quota_exceeded: 0, ocr_rate_limited: 1, chat_ip_limited: 0 }],
  });
  await withServer({ db, verifyUser: verifyAs(googleUser({ email: ADMIN })), limits: { aiFree: 10, ocrFree: 5, ocrPremium: 50 } }, async (base) => {
    const q = "?from=2026-10-15&to=2026-10-21";
    const overview = await (await fetch(`${base}/overview${q}`)).json();
    assert.equal(overview.overview.revenue_total, 98000);
    assert.equal(overview.from, "2026-10-15");

    const channel = await (await fetch(`${base}/channel-stats${q}`)).json();
    assert.equal(channel.rows[0].signup_rate, 0.2);
    assert.equal(channel.total.visits, 10);

    const users = await (await fetch(`${base}/users${q}`)).json();
    assert.equal(users.totals.google_accounts_total, 40);
    assert.equal(users.sum.new_accounts, 3);

    const revenue = await (await fetch(`${base}/revenue${q}`)).json();
    assert.equal(revenue.sum.revenue, 49000);
    assert.equal(revenue.orders[0].email, "an***@gmail.com");

    const usage = await (await fetch(`${base}/usage${q}`)).json();
    assert.equal(usage.sum.ai_free_turns, 12);
    assert.equal(usage.sum.ai_premium_turns, 3);

    assert.equal((await fetch(`${base}/usage?from=2026-10-21&to=2026-10-01`)).status, 400);
  });
  const usageCall = db.calls.find((c) => c.name === "admin_usage_by_day");
  assert.deepEqual(usageCall.args, { p_from: "2026-10-15", p_to: "2026-10-21", p_ai_limit: 10, p_ocr_free_limit: 5, p_ocr_premium_limit: 50 });
  assert.deepEqual(db.calls.find((c) => c.name === "admin_recent_orders").args, { p_limit: 20 });
});

test("lỗi DB → 503 chung, không lộ thông báo lỗi của DB", async () => {
  const db = { rpc: async () => ({ data: null, error: { message: "relation auth.users secret detail" } }) };
  await withServer({ db, verifyUser: verifyAs(googleUser({ email: ADMIN })) }, async (base) => {
    const res = await fetch(`${base}/overview`);
    assert.equal(res.status, 503);
    assert.doesNotMatch(JSON.stringify(await res.json()), /secret|auth\.users/);
  });
});
