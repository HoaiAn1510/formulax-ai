/**
 * Hàm thuần của trang quản trị: so sánh kỳ trước, trục biểu đồ, CSV, gom kênh, che email.
 * Không phụ thuộc React — test ở scripts/test-admin-range.mjs (npm run test:admin).
 */

// ─── So sánh kỳ trước ────────────────────────────────────────────────────────

/**
 * kind: "up" | "down" | "flat" | "new" (kỳ trước 0, kỳ này > 0) | "none" (không có số kỳ trước).
 * pct: phần trăm thay đổi, làm tròn 1 chữ số; null với new/none.
 */
export function computeDelta(current, previous) {
  if (previous === null || previous === undefined || Number.isNaN(Number(previous))) return { kind: "none", pct: null };
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur === 0 ? { kind: "flat", pct: 0 } : { kind: "new", pct: null };
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  if (pct === 0) return { kind: "flat", pct: 0 };
  return { kind: pct > 0 ? "up" : "down", pct };
}

// ─── Trục biểu đồ ────────────────────────────────────────────────────────────

/** Mốc trục Y "đẹp" (0, 5, 10… / 0, 20k, 40k…) phủ được max, khoảng `count` khoảng. */
export function niceTicks(max, count = 4) {
  const top = Math.max(0, Number(max) || 0);
  if (top === 0) return [0, 1];
  const raw = top / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  // Bội số 1, 2, 5 — không dùng 2,5 để trục của số đếm không có mốc lẻ (2,5 lượt).
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const niceStep = step < 1 ? 1 : step;
  const ticks = [];
  for (let v = 0; v < top + niceStep; v += niceStep) {
    ticks.push(Math.round(v * 100) / 100);
    if (v >= top) break;
  }
  return ticks;
}

/** Hiện nhãn ngày cho mọi cột khi ≤ 14 ngày; nhiều hơn thì cách đều, luôn có cột cuối. */
export function labelIndexes(n, maxLabels = 7) {
  if (n <= 0) return [];
  if (n <= 14) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil((n - 1) / (maxLabels - 1));
  const out = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) {
    if (n - 1 - out[out.length - 1] < step / 2) out.pop();
    out.push(n - 1);
  }
  return out;
}

/** Số gọn cho trục: 1.200 → "1,2k", 2.500.000 → "2,5tr". */
export function compactNumber(v) {
  const n = Number(v) || 0;
  const fmt = (x) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1e9) return `${fmt(n / 1e9)}tỷ`;
  if (Math.abs(n) >= 1e6) return `${fmt(n / 1e6)}tr`;
  if (Math.abs(n) >= 1e3) return `${fmt(n / 1e3)}k`;
  return fmt(n);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

const BOM = String.fromCharCode(0xfeff); // Excel nhận ra UTF-8
const CRLF = String.fromCharCode(13, 10);

// Ô CHỮ bắt đầu bằng = + - @ tab hoặc CR thì Excel / Sheets hiểu là công thức (CSV injection) — thêm
// dấu nháy đơn ở đầu. Không áp dụng cho số (số âm giữ nguyên để Excel vẫn tính được).
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (v) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (typeof v === "string" && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV UTF-8 có BOM (Excel mở đúng tiếng Việt). columns: [{ key, label, csv?(row) }]. */
export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const r of rows) lines.push(columns.map((c) => csvCell(c.csv ? c.csv(r) : r[c.key])).join(","));
  return `${BOM}${lines.join(CRLF)}${CRLF}`;
}

/** "formulax-kenh-gioi-thieu_2026-09-22_2026-10-21.csv" */
export function csvFilename(name, range) {
  const slug = String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `formulax-${slug}_${range.from}_${range.to}.csv`;
}

// ─── Kênh giới thiệu ─────────────────────────────────────────────────────────

const KNOWN_CHANNELS = {
  tiktok: { label: "TikTok", color: "#0F172A" },
  facebook: { label: "Facebook", color: "#2563EB" },
  fb: { label: "Facebook", color: "#2563EB" },
  zalo: { label: "Zalo", color: "#0EA5E9" },
  youtube: { label: "YouTube", color: "#DC2626" },
  instagram: { label: "Instagram", color: "#DB2777" },
  google: { label: "Google", color: "#16A34A" },
  direct: { label: "Trực tiếp / không rõ nguồn", color: "#94A3B8" },
};
const FALLBACK_COLORS = ["#D97706", "#7C3AED", "#059669", "#B45309", "#4F46E5", "#0D9488"];

/** Kênh gốc = phần trước dấu "-" đầu tiên ("facebook-post2" → "facebook"); "fb" gộp với "facebook". */
export function channelRoot(source) {
  const root = String(source || "direct").split("-")[0] || "direct";
  return root === "fb" ? "facebook" : root;
}

/** Nhãn + màu chấm của kênh gốc. Kênh lạ: viết hoa chữ đầu, màu theo thứ tự cố định của tên. */
export function channelMeta(root) {
  if (KNOWN_CHANNELS[root]) return KNOWN_CHANNELS[root];
  let h = 0;
  for (const ch of String(root)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { label: root.charAt(0).toUpperCase() + root.slice(1), color: FALLBACK_COLORS[h % FALLBACK_COLORS.length] };
}

const rate = (a, b) => (b > 0 ? Math.round((a / b) * 10000) / 10000 : null);

/**
 * Gom dòng channel_stats theo kênh gốc: mỗi nhóm có tổng 4 cột, 2 tỉ lệ tính lại từ tổng, và
 * `children` (các ref con, chỉ khi có nhiều hơn 1 ref hoặc ref khác tên gốc).
 */
export function groupChannels(rows) {
  const groups = new Map();
  for (const r of rows || []) {
    const root = channelRoot(r.source);
    const g = groups.get(root) || { root, ...channelMeta(root), visits: 0, signups: 0, paid_users: 0, revenue: 0, children: [] };
    g.visits += r.visits || 0;
    g.signups += r.signups || 0;
    g.paid_users += r.paid_users || 0;
    g.revenue += r.revenue || 0;
    g.children.push(r);
    groups.set(root, g);
  }
  return [...groups.values()].map((g) => {
    const children = g.children.length > 1 || (g.children[0] && g.children[0].source !== g.root) ? g.children : [];
    return { ...g, children, signup_rate: rate(g.signups, g.visits), paid_rate: rate(g.paid_users, g.signups), isDirect: g.root === "direct" };
  });
}

/** Sắp xếp nhóm kênh theo cột; "Trực tiếp" luôn ở cuối. */
export function sortChannels(groups, key, dir = "desc") {
  const sign = dir === "asc" ? 1 : -1;
  const val = (g) => (key === "label" ? g.label.toLowerCase() : g[key] ?? -1);
  return [...groups].sort((a, b) => {
    if (a.isDirect !== b.isDirect) return a.isDirect ? 1 : -1;
    const x = val(a);
    const y = val(b);
    return x < y ? -sign : x > y ? sign : 0;
  });
}

// ─── Khác ────────────────────────────────────────────────────────────────────

/** "andrew@gmail.com" → "an***@gmail.com" (giống backend). */
export function maskEmail(email) {
  if (typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at < 1) return "";
  const local = email.slice(0, at);
  return `${local.slice(0, local.length < 3 ? 1 : 2)}***@${email.slice(at + 1)}`;
}

export const initialOf = (name, email) => (String(name || email || "?").trim().charAt(0) || "?").toUpperCase();
