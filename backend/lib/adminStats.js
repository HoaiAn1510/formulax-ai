/**
 * Hàm thuần cho trang quản trị (routes/admin.js): chuẩn hoá dòng trả về từ các hàm SQL admin_*
 * (migration 011) — bigint của PostgREST có thể về dạng chuỗi — và che email lớp thứ hai.
 */

const num = (v) => Number(v) || 0;

/**
 * "andrew@gmail.com" → "an***@gmail.com"; tên < 3 ký tự giữ 1 ký tự. Đã che rồi thì giữ nguyên (SQL
 * che trước, đây là lớp thứ hai — chạy lại không đổi). Không phải email → null.
 */
export function maskEmail(email) {
  if (typeof email !== "string") return null;
  const at = email.indexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (/^[^*]{1,2}\*\*\*$/.test(local)) return email;
  const keep = local.length < 3 ? 1 : 2;
  return `${local.slice(0, keep)}***@${domain}`;
}

/** Ép mọi trường số (trừ các khoá giữ nguyên như day, source) về number. */
export function numericRows(rows, keep = ["day", "source"]) {
  return (rows || []).map((r) => Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, keep.includes(k) ? v : num(v)]),
  ));
}

/** Cộng dồn các cột số của bảng theo ngày / theo nguồn — dữ liệu đã gộp sẵn ở DB, tối đa 366 dòng. */
export function sumColumns(rows, columns) {
  return Object.fromEntries(columns.map((c) => [c, (rows || []).reduce((s, r) => s + num(r[c]), 0)]));
}

/** Dòng tổng của bảng kênh giới thiệu: cộng 4 cột số, tính lại 2 tỉ lệ từ tổng. */
export function channelTotals(rows) {
  const t = sumColumns(rows, ["visits", "signups", "paid_users", "revenue"]);
  const ratio = (a, b) => (b > 0 ? Math.round((a / b) * 10000) / 10000 : null);
  return { source: "Tổng", ...t, signup_rate: ratio(t.signups, t.visits), paid_rate: ratio(t.paid_users, t.signups) };
}

/** 20 đơn gần nhất: chỉ các trường được phép hiện, email che (lần hai), không google_id/mã giao dịch. */
export function publicOrders(rows) {
  return (rows || []).map((r) => ({
    created_at: r.created_at,
    plan: r.plan,
    amount: num(r.amount),
    status: r.status,
    source: r.signup_source || null,
    email: maskEmail(r.email_masked),
  }));
}

const DAY_MS = 86400000;
const shiftDay = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** Kỳ liền trước cùng độ dài: 15/10–21/10 → 08/10–14/10. Dùng lại hàm SQL của kỳ hiện tại để so sánh. */
export function previousRange({ from, to }) {
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS + 1;
  return { from: shiftDay(from, -days), to: shiftDay(from, -1) };
}

/**
 * Tổng tài khoản tích luỹ theo ngày, suy từ dữ liệu đã gộp sẵn ở DB: tổng hiện tại trừ số tài khoản
 * tạo từ `from` tới hôm nay = số tài khoản trước kỳ; cộng dần theo ngày. `signupsToToday` là kết quả
 * admin_signups_by_day(from, max(to, hôm nay)). Chỉ tính tài khoản còn tồn tại (tài khoản đã xoá không có trong cả hai số).
 */
export function cumulativeAccounts(total, signupsToToday, to) {
  const rows = numericRows(signupsToToday);
  let running = num(total) - rows.reduce((s, r) => s + r.new_accounts, 0);
  const out = [];
  for (const r of rows) {
    running += r.new_accounts;
    if (r.day <= to) out.push({ day: r.day, total_accounts: running });
  }
  return out;
}

/** Ghép nhiều bảng theo ngày (cùng danh sách ngày từ generate_series) thành một. */
export function mergeByDay(...tables) {
  const map = new Map();
  for (const rows of tables) for (const r of numericRows(rows)) map.set(r.day, { ...(map.get(r.day) || {}), ...r });
  return [...map.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}
