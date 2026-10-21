import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { sanitizeRef, isValidVisitorId, attributedSource, isAdminEmail, parseDateRange, buildChannelStats } from "../lib/channelTracking.js";
import { createChannelRouter } from "../routes/channelTracking.js";

const VID = "3f2b8c4e-1a2b-4c3d-8e9f-0123456789ab";
const NOW = Date.parse("2026-10-21T05:00:00Z");
const hoursAgo = (h) => new Date(NOW - h * 3600_000).toISOString();

// ─── Hàm thuần ───────────────────────────────────────────────────────────────

test("sanitizeRef: chữ thường, chỉ a-z 0-9 -, tối đa 40 ký tự, rỗng → null", () => {
  assert.equal(sanitizeRef("TikTok"), "tiktok");
  assert.equal(sanitizeRef("tiktok-video3"), "tiktok-video3");
  assert.equal(sanitizeRef(" Face_Book!<script>"), "facebookscript");
  assert.equal(sanitizeRef("Tiếng Việt"), "tingvit");
  assert.equal(sanitizeRef("a".repeat(60)).length, 40);
  assert.equal(sanitizeRef("!!!"), null);
  assert.equal(sanitizeRef(""), null);
  assert.equal(sanitizeRef(undefined), null);
  assert.equal(sanitizeRef(["tiktok"]), null);
  assert.equal(sanitizeRef({ ref: "x" }), null);
});

test("isValidVisitorId: chỉ nhận UUID", () => {
  assert.ok(isValidVisitorId(VID));
  assert.ok(isValidVisitorId(VID.toUpperCase()));
  for (const bad of ["", "abc", `${VID}x`, "3f2b8c4e1a2b4c3d8e9f0123456789ab", null, 123, { id: VID }]) {
    assert.equal(isValidVisitorId(bad), false, String(bad));
  }
});

test("attributedSource: chỉ gắn nguồn cho tài khoản tạo trong vòng 24 giờ", () => {
  assert.equal(attributedSource("tiktok", hoursAgo(1), NOW), "tiktok");
  assert.equal(attributedSource("tiktok", hoursAgo(24), NOW), "tiktok");
  assert.equal(attributedSource("tiktok", hoursAgo(25), NOW), null);
  assert.equal(attributedSource("tiktok", "not-a-date", NOW), null);
  assert.equal(attributedSource("", hoursAgo(1), NOW), null);
  assert.equal(attributedSource("TikTok!", hoursAgo(1), NOW), "tiktok");
});

test("isAdminEmail: theo ADMIN_EMAILS, không phân biệt hoa thường, biến trống = không ai", () => {
  assert.ok(isAdminEmail("Admin@X.com", "admin@x.com, other@y.com"));
  assert.ok(isAdminEmail("other@y.com", "admin@x.com,other@y.com"));
  assert.equal(isAdminEmail("hs@x.com", "admin@x.com"), false);
  assert.equal(isAdminEmail("admin@x.com", ""), false);
  assert.equal(isAdminEmail("admin@x.com", undefined), false);
  assert.equal(isAdminEmail("", "admin@x.com"), false);
});

test("parseDateRange: mặc định 30 ngày (giờ Việt Nam), kiểm tra định dạng và thứ tự", () => {
  assert.deepEqual(parseDateRange(undefined, undefined, NOW), { from: "2026-09-22", to: "2026-10-21" });
  // 20:00 UTC = 03:00 ngày hôm sau ở Việt Nam
  assert.equal(parseDateRange(undefined, undefined, Date.parse("2026-10-21T20:00:00Z")).to, "2026-10-22");
  assert.deepEqual(parseDateRange("2026-10-01", "2026-10-21", NOW), { from: "2026-10-01", to: "2026-10-21" });
  assert.ok(parseDateRange("2026-10-21", "2026-10-01", NOW).error);
  assert.ok(parseDateRange("2026-02-30", "2026-03-01", NOW).error);
  assert.ok(parseDateRange("21/10/2026", undefined, NOW).error);
  assert.ok(parseDateRange("2024-01-01", "2026-10-21", NOW).error);
});

test("buildChannelStats: ép số, tính tỉ lệ, mẫu số 0 → null", () => {
  const rows = buildChannelStats([
    { source: "tiktok", visits: "200", signups: "20", paid_users: "2", revenue: "98000" },
    { source: "direct", visits: 0, signups: 3, paid_users: 4, revenue: 196000 },
  ]);
  assert.deepEqual(rows[0], { source: "tiktok", visits: 200, signups: 20, paid_users: 2, revenue: 98000, signup_rate: 0.1, paid_rate: 0.1 });
  assert.equal(rows[1].signup_rate, null);
  assert.equal(rows[1].paid_rate, 1.3333);
});

// ─── Route (Supabase giả, không gọi mạng ngoài) ─────────────────────────────────

function fakeDb({ existingAcquisition = new Set(), rpcRows = [] } = {}) {
  const calls = { upserts: [], rpc: [] };
  const visits = new Set();
  return {
    calls,
    from(table) {
      return {
        upsert(row, opts) {
          calls.upserts.push({ table, row, opts });
          if (table === "channel_visits") visits.add(`${row.ref}|${row.visitor_id}`);
          // Mô phỏng ON CONFLICT DO NOTHING: dòng đã có thì giữ nguyên dòng cũ.
          if (table === "user_acquisition" && !existingAcquisition.has(row.google_id)) existingAcquisition.add(row.google_id);
          return Promise.resolve({ error: null });
        },
      };
    },
    rpc(name, args) {
      calls.rpc.push({ name, args });
      return Promise.resolve({ data: rpcRows, error: null });
    },
  };
}

const googleUser = (over = {}) => ({
  id: "auth-uuid", email: "hs@gmail.com", is_anonymous: false, created_at: hoursAgo(1),
  identities: [{ provider: "google", id: "google-sub-1" }], ...over,
});

async function withServer(routerOpts, fn) {
  const app = express();
  app.use(express.json());
  app.use("/api", createChannelRouter({
    extractGoogleId: (u) => u.identities?.find((i) => i.provider === "google")?.id || null,
    now: () => NOW,
    ...routerOpts,
  }));
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    await fn(base);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const post = (url, body, headers = {}) => fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const verifyAs = (user) => async () => user;
const rejectAuth = async () => { throw Object.assign(new Error("Thiếu Authorization header."), { status: 401 }); };

test("track/visit: ghi ref đã làm sạch, không có ref → direct, visitor_id sai → bỏ qua (vẫn 204)", async () => {
  const db = fakeDb();
  await withServer({ db, verifyUser: rejectAuth }, async (base) => {
    assert.equal((await post(`${base}/track/visit`, { ref: "TikTok-Video3", visitorId: VID })).status, 204);
    assert.equal((await post(`${base}/track/visit`, { visitorId: VID })).status, 204);
    assert.equal((await post(`${base}/track/visit`, { ref: "tiktok", visitorId: "not-a-uuid" })).status, 204);
    assert.equal((await post(`${base}/track/visit`, { ref: "tiktok" })).status, 204);
  });
  const rows = db.calls.upserts.map((u) => u.row);
  assert.deepEqual(rows, [{ ref: "tiktok-video3", visitor_id: VID }, { ref: "direct", visitor_id: VID }]);
  assert.deepEqual(db.calls.upserts[0].opts, { onConflict: "day,ref,visitor_id", ignoreDuplicates: true });
  // Không có trường IP / user agent nào được ghi.
  assert.ok(rows.every((r) => Object.keys(r).sort().join() === "ref,visitor_id"));
});

test("track/visit: rate limit theo IP — vượt ngưỡng thì 429 và không ghi", async () => {
  const db = fakeDb();
  await withServer({ db, verifyUser: rejectAuth, visitLimit: { windowMs: 60_000, max: 3 } }, async (base) => {
    const statuses = [];
    for (let i = 0; i < 5; i++) statuses.push((await post(`${base}/track/visit`, { ref: "tiktok", visitorId: VID })).status);
    assert.deepEqual(statuses, [204, 204, 204, 429, 429]);
  });
  assert.equal(db.calls.upserts.length, 3);
});

test("track/signup: tài khoản Google mới → ghi nguồn; google_id/created_at lấy từ server, không từ body", async () => {
  const db = fakeDb();
  await withServer({ db, verifyUser: verifyAs(googleUser()) }, async (base) => {
    const res = await post(`${base}/track/signup`, { ref: "TikTok", googleId: "hacker", created_at: new Date(NOW).toISOString() });
    assert.equal(res.status, 200);
  });
  const { row, opts } = db.calls.upserts[0];
  assert.equal(row.google_id, "google-sub-1");
  assert.equal(row.signup_source, "tiktok");
  assert.equal(row.account_created_at, hoursAgo(1));
  assert.equal(row.signup_source_at, new Date(NOW).toISOString());
  assert.deepEqual(opts, { onConflict: "google_id", ignoreDuplicates: true });
});

test("track/signup: không bao giờ ghi đè — luôn insert-if-absent (ignoreDuplicates), không có update", async () => {
  const existing = new Set(["google-sub-1"]);
  const db = fakeDb({ existingAcquisition: existing });
  await withServer({ db, verifyUser: verifyAs(googleUser()) }, async (base) => {
    assert.equal((await post(`${base}/track/signup`, { ref: "facebook" })).status, 200);
  });
  assert.equal(db.calls.upserts.length, 1);
  assert.equal(db.calls.upserts[0].opts.ignoreDuplicates, true);
  // DB giả chỉ có upsert: route gọi update / ghi đè thì đã ném lỗi "not a function" → 503.
  assert.equal(existing.size, 1);
});

test("track/signup: tài khoản tạo quá 24 giờ → có dòng nhưng nguồn để trống", async () => {
  const db = fakeDb();
  await withServer({ db, verifyUser: verifyAs(googleUser({ created_at: hoursAgo(30) })) }, async (base) => {
    assert.equal((await post(`${base}/track/signup`, { ref: "tiktok" })).status, 200);
  });
  assert.equal(db.calls.upserts[0].row.signup_source, null);
  assert.equal(db.calls.upserts[0].row.signup_source_at, null);
});

test("track/signup: phiên khách ẩn danh hoặc không có Google identity → 204, không ghi", async () => {
  for (const user of [
    googleUser({ is_anonymous: true, identities: [] }),
    googleUser({ is_anonymous: true }), // kể cả khi có identity, is_anonymous vẫn bị từ chối
    googleUser({ identities: [{ provider: "email", id: "x" }] }),
  ]) {
    const db = fakeDb();
    await withServer({ db, verifyUser: verifyAs(user) }, async (base) => {
      assert.equal((await post(`${base}/track/signup`, { ref: "tiktok" })).status, 204);
    });
    assert.equal(db.calls.upserts.length, 0);
  }
});

test("track/signup: không có token → 401", async () => {
  const db = fakeDb();
  await withServer({ db, verifyUser: rejectAuth }, async (base) => {
    assert.equal((await post(`${base}/track/signup`, { ref: "tiktok" })).status, 401);
  });
  assert.equal(db.calls.upserts.length, 0);
});

test("admin/channel-stats: chặn người không phải admin (403), khách (403), thiếu token (401)", async () => {
  const cases = [
    { verifyUser: rejectAuth, status: 401 },
    { verifyUser: verifyAs(googleUser()), status: 403 },
    { verifyUser: verifyAs(googleUser({ email: "admin@x.com", is_anonymous: true })), status: 403 },
    { verifyUser: verifyAs(googleUser({ email: "admin@x.com", identities: [] })), status: 403 },
    { verifyUser: verifyAs(googleUser({ email: "admin@x.com" })), status: 403, adminEmails: () => "" },
  ];
  for (const { verifyUser, status, adminEmails = () => "admin@x.com" } of cases) {
    const db = fakeDb();
    await withServer({ db, verifyUser, adminEmails }, async (base) => {
      assert.equal((await fetch(`${base}/admin/channel-stats`)).status, status);
    });
    assert.equal(db.calls.rpc.length, 0, "không đọc thống kê khi không phải admin");
  }
});

test("admin/channel-stats: admin đọc được, from/to truyền vào RPC, from/to sai → 400", async () => {
  const db = fakeDb({ rpcRows: [{ source: "tiktok", visits: 10, signups: 2, paid_users: 1, revenue: 49000 }] });
  await withServer({ db, verifyUser: verifyAs(googleUser({ email: "Admin@X.com" })), adminEmails: () => "admin@x.com" }, async (base) => {
    const res = await fetch(`${base}/admin/channel-stats?from=2026-10-01&to=2026-10-21`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.rows[0], { source: "tiktok", visits: 10, signups: 2, paid_users: 1, revenue: 49000, signup_rate: 0.2, paid_rate: 0.5 });
    assert.equal((await fetch(`${base}/admin/channel-stats?from=2026-10-21&to=2026-10-01`)).status, 400);
  });
  assert.deepEqual(db.calls.rpc, [{ name: "channel_stats", args: { p_from: "2026-10-01", p_to: "2026-10-21" } }]);
});
