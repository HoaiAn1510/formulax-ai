// Test hàm thuần của trang quản trị và dấu gợi ý admin. Chạy: npm run test:admin
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRange, todayVN, isRealDate, formatDay, formatPercent } from "../src/admin/adminRange.js";
import { hasAdminHint, rememberAdminResult, adminHintKey } from "../src/utils/adminHint.js";

const NOW = Date.parse("2026-10-21T05:00:00Z");

test("computeRange: 7 ngày, 30 ngày, tháng này (tính cả hôm nay, giờ Việt Nam)", () => {
  assert.deepEqual(computeRange("7d", NOW), { from: "2026-10-15", to: "2026-10-21" });
  assert.deepEqual(computeRange("30d", NOW), { from: "2026-09-22", to: "2026-10-21" });
  assert.deepEqual(computeRange("month", NOW), { from: "2026-10-01", to: "2026-10-21" });
  // 18:00 UTC ngày 31/10 = 01:00 ngày 1/11 ở Việt Nam
  assert.deepEqual(computeRange("month", Date.parse("2026-10-31T18:00:00Z")), { from: "2026-11-01", to: "2026-11-01" });
  assert.equal(todayVN(Date.parse("2026-10-21T17:00:00Z")), "2026-10-22");
});

test("computeRange tùy chọn: đảo ngày nhập ngược, báo lỗi ngày sai và khoảng > 366 ngày", () => {
  assert.deepEqual(computeRange("custom", NOW, { from: "2026-10-10", to: "2026-10-01" }), { from: "2026-10-01", to: "2026-10-10" });
  assert.ok(computeRange("custom", NOW, { from: "", to: "2026-10-01" }).error);
  assert.ok(computeRange("custom", NOW, { from: "2026-02-30", to: "2026-03-01" }).error);
  assert.ok(computeRange("custom", NOW, { from: "2025-01-01", to: "2026-10-01" }).error);
  assert.deepEqual(computeRange("custom", NOW, { from: "2025-10-22", to: "2026-10-21" }), { from: "2025-10-22", to: "2026-10-21" });
  assert.ok(computeRange("khac", NOW).error);
});

test("isRealDate / formatDay / formatPercent", () => {
  assert.ok(isRealDate("2028-02-29"));
  assert.equal(isRealDate("2026-02-29"), false);
  assert.equal(formatDay("2026-10-21"), "21/10");
  assert.equal(formatDay("2026-10-21", true), "21/10/2026");
  assert.equal(formatPercent(null), "—");
  assert.equal(formatPercent(0.1), "10%");
});

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const broken = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };

test("dấu gợi ý admin: true ghi, false xoá, theo từng googleId; localStorage hỏng không ném lỗi", () => {
  const s = memory();
  assert.equal(hasAdminHint(s, "g1"), false);
  rememberAdminResult(s, "g1", true);
  assert.ok(hasAdminHint(s, "g1"));
  assert.equal(hasAdminHint(s, "g2"), false);
  assert.equal(s.getItem(adminHintKey("g1")), "1");
  rememberAdminResult(s, "g1", false);
  assert.equal(hasAdminHint(s, "g1"), false);
  assert.equal(hasAdminHint(s, null), false);
  assert.doesNotThrow(() => rememberAdminResult(broken, "g1", true));
  assert.equal(hasAdminHint(broken, "g1"), false);
  assert.equal(hasAdminHint(null, "g1"), false);
});

// ─── adminFormat.js ──────────────────────────────────────────────────────────
import {
  computeDelta, niceTicks, labelIndexes, compactNumber, toCsv, csvFilename,
  channelRoot, channelMeta, groupChannels, sortChannels, maskEmail, initialOf,
} from "../src/admin/adminFormat.js";

test("computeDelta: tăng / giảm / không đổi / mới / không có số kỳ trước", () => {
  assert.deepEqual(computeDelta(120, 100), { kind: "up", pct: 20 });
  assert.deepEqual(computeDelta(75, 100), { kind: "down", pct: -25 });
  assert.deepEqual(computeDelta(100, 100), { kind: "flat", pct: 0 });
  assert.deepEqual(computeDelta(5, 0), { kind: "new", pct: null });
  assert.deepEqual(computeDelta(0, 0), { kind: "flat", pct: 0 });
  assert.deepEqual(computeDelta(5, null), { kind: "none", pct: null });
  assert.deepEqual(computeDelta(1, 3), { kind: "down", pct: -66.7 });
});

test("niceTicks / labelIndexes / compactNumber", () => {
  assert.deepEqual(niceTicks(0), [0, 1]);
  assert.deepEqual(niceTicks(9), [0, 5, 10]);
  assert.deepEqual(niceTicks(37), [0, 10, 20, 30, 40]);
  assert.ok(niceTicks(3).every(Number.isInteger), "số đếm không có mốc lẻ");
  assert.deepEqual(niceTicks(245000), [0, 100000, 200000, 300000]);
  assert.deepEqual(labelIndexes(7), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(labelIndexes(14).length, 14);
  const many = labelIndexes(30);
  assert.equal(many[0], 0);
  assert.equal(many.at(-1), 29);
  assert.ok(many.length <= 8);
  assert.equal(compactNumber(1200), "1,2k");
  assert.equal(compactNumber(2500000), "2,5tr");
  assert.equal(compactNumber(12), "12");
});

test("toCsv: có BOM, CRLF, thoát dấu phẩy / ngoặc kép / xuống dòng; tên file kèm khoảng ngày", () => {
  const csv = toCsv([{ key: "a", label: "Kênh" }, { key: "b", label: "Số", csv: (r) => r.b * 2 }], [{ a: 'Face,"book"', b: 2 }, { a: "x\ny", b: 0 }]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.slice(1), 'Kênh,Số\r\n"Face,""book""",4\r\n"x\ny",0\r\n');
  assert.equal(csvFilename("Kênh giới thiệu", { from: "2026-09-22", to: "2026-10-21" }), "formulax-kenh-gioi-thieu_2026-09-22_2026-10-21.csv");
  assert.equal(csvFilename("su-dung-ai", { from: "2026-10-01", to: "2026-10-21" }), "formulax-su-dung-ai_2026-10-01_2026-10-21.csv");
});

test("toCsv: ô chữ bắt đầu bằng = + - @ tab CR được thêm dấu ' (chống CSV injection); số âm giữ nguyên", () => {
  const cols = [{ key: "a", label: "Chữ" }, { key: "n", label: "Số" }];
  const rows = [
    { a: "=HYPERLINK(\"http://x\")", n: -5 },
    { a: "+1+1", n: 0 },
    { a: "-tiktok", n: -12.5 },
    { a: "@SUM(A1)", n: 3 },
    { a: "\tx", n: 1 },
    { a: "\rx", n: 1 },
    { a: "tiktok-video3", n: 2 },
    { a: "an***@gmail.com", n: 4 },
  ];
  const body = toCsv(cols, rows).slice(1).split("\r\n");
  assert.equal(body[1], "\"'=HYPERLINK(\"\"http://x\"\")\",-5");
  assert.equal(body[2], "'+1+1,0");
  assert.equal(body[3], "'-tiktok,-12.5");
  assert.equal(body[4], "'@SUM(A1),3");
  assert.equal(body[5], "'\tx,1");
  assert.equal(body[6], "\"'\rx\",1");
  assert.equal(body[7], "tiktok-video3,2", "chữ bình thường không đổi");
  assert.equal(body[8], "an***@gmail.com,4", "@ ở giữa không bị coi là công thức");
  // Cột số do hàm csv(row) trả về vẫn là số — số âm không bị thêm dấu '.
  assert.equal(toCsv([{ key: "n", label: "n", csv: (r) => r.n }], [{ n: -3 }]).slice(1), "n\r\n-3\r\n");
});

test("kênh: gom theo phần trước dấu '-', fb = facebook, nhãn thân thiện, Trực tiếp luôn cuối", () => {
  assert.equal(channelRoot("facebook-post2"), "facebook");
  assert.equal(channelRoot("fb-group"), "facebook");
  assert.equal(channelRoot("tiktok"), "tiktok");
  assert.equal(channelRoot(null), "direct");
  assert.equal(channelMeta("direct").label, "Trực tiếp / không rõ nguồn");
  assert.equal(channelMeta("zalo").label, "Zalo");
  assert.equal(channelMeta("threads").label, "Threads");
  const groups = groupChannels([
    { source: "facebook-post1", visits: 30, signups: 3, paid_users: 1, revenue: 49000 },
    { source: "facebook-post2", visits: 10, signups: 1, paid_users: 0, revenue: 0 },
    { source: "tiktok", visits: 100, signups: 5, paid_users: 0, revenue: 0 },
    { source: "direct", visits: 500, signups: 2, paid_users: 4, revenue: 196000 },
  ]);
  const fb = groups.find((g) => g.root === "facebook");
  assert.equal(fb.visits, 40);
  assert.equal(fb.signups, 4);
  assert.equal(fb.signup_rate, 0.1);
  assert.equal(fb.paid_rate, 0.25);
  assert.equal(fb.children.length, 2);
  assert.equal(groups.find((g) => g.root === "tiktok").children.length, 0, "1 ref trùng tên gốc thì không có dòng con");
  const sorted = sortChannels(groups, "visits", "desc");
  assert.deepEqual(sorted.map((g) => g.root), ["tiktok", "facebook", "direct"]);
  assert.deepEqual(sortChannels(groups, "visits", "asc").map((g) => g.root), ["facebook", "tiktok", "direct"]);
  assert.equal(sortChannels(groups, "label", "asc").at(-1).root, "direct");
});

test("maskEmail / initialOf", () => {
  assert.equal(maskEmail("andrew@gmail.com"), "an***@gmail.com");
  assert.equal(maskEmail("ab@gmail.com"), "a***@gmail.com");
  assert.equal(maskEmail(undefined), "");
  assert.equal(initialOf("an nguyễn", "x@y.z"), "A");
  assert.equal(initialOf("", "bao@y.z"), "B");
});
