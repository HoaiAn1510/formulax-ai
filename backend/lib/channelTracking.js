/**
 * Theo dõi kênh giới thiệu (link ?ref=tiktok, ?ref=facebook-post2…) cho báo cáo KPI — hàm thuần,
 * dùng ở routes/channelTracking.js. Bảng và hàm SQL: migrations/010_channel_tracking.sql.
 * Không lưu IP, user agent hay dữ liệu cá nhân; chỉ ref, ngày và visitor_id ngẫu nhiên.
 */

export const MAX_REF_LENGTH = 40;
export const DIRECT_SOURCE = "direct";
// Chỉ gắn nguồn cho tài khoản vừa tạo: người dùng cũ hôm nay bấm link TikTok không phải "đăng ký từ TikTok".
export const ATTRIBUTION_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

// Ref hợp lệ: bắt đầu bằng chữ hoặc số, sau đó chữ / số / "-", tối đa 40 ký tự. Chặt hơn check
// constraint của DB (cho phép bắt đầu bằng "-") — chỉ siết ở code, không đổi migration đã chạy.
export const REF_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Chữ thường, bỏ ký tự ngoài a-z 0-9 "-", cắt 40 ký tự; không khớp REF_PATTERN (rỗng, bắt đầu bằng "-") → null. */
export function sanitizeRef(value) {
  if (typeof value !== "string") return null;
  const ref = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, MAX_REF_LENGTH);
  return REF_PATTERN.test(ref) ? ref : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidVisitorId(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Nguồn được ghi cho tài khoản: ref đã làm sạch, CHỈ khi tài khoản tạo trong vòng 24 giờ.
 * accountCreatedAt lấy từ tài khoản Supabase Auth đã xác thực ở server, không lấy từ client.
 */
export function attributedSource(ref, accountCreatedAt, now = Date.now()) {
  const source = sanitizeRef(ref);
  const created = Date.parse(accountCreatedAt);
  if (!source || Number.isNaN(created)) return null;
  const age = now - created;
  return age >= 0 && age <= ATTRIBUTION_WINDOW_MS ? source : null;
}

/** ADMIN_EMAILS="a@x.com, b@y.com" — so khớp không phân biệt hoa thường. Biến trống = không ai là admin. */
export function isAdminEmail(email, adminEmailsEnv) {
  if (typeof email !== "string" || !email) return false;
  const list = String(adminEmailsEnv || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

const vnDate = (ms) => new Date(ms + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (s) => DATE_RE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/**
 * from/to dạng YYYY-MM-DD (ngày giờ Việt Nam, tính cả hai đầu). Thiếu thì mặc định 30 ngày gần nhất.
 * @returns {{ from: string, to: string } | { error: string }}
 */
export function parseDateRange(fromRaw, toRaw, now = Date.now()) {
  const to = toRaw ? String(toRaw) : vnDate(now);
  const from = fromRaw ? String(fromRaw) : vnDate(Date.parse(`${to}T00:00:00Z`) - 29 * 86400000);
  if (!isRealDate(from) || !isRealDate(to)) return { error: "from/to phải có dạng YYYY-MM-DD." };
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
  if (days < 0) return { error: "from phải trước hoặc bằng to." };
  if (days >= MAX_RANGE_DAYS) return { error: `Khoảng ngày tối đa ${MAX_RANGE_DAYS} ngày.` };
  return { from, to };
}

const ratio = (a, b) => (b > 0 ? Math.round((a / b) * 10000) / 10000 : null);

/** Dòng từ channel_stats (bigint có thể về dạng chuỗi) → số + hai tỉ lệ; mẫu số 0 → null. */
export function buildChannelStats(rows) {
  return (rows || []).map((r) => {
    const visits = Number(r.visits) || 0;
    const signups = Number(r.signups) || 0;
    const paidUsers = Number(r.paid_users) || 0;
    return {
      source: r.source || DIRECT_SOURCE,
      visits,
      signups,
      paid_users: paidUsers,
      revenue: Number(r.revenue) || 0,
      signup_rate: ratio(signups, visits),
      paid_rate: ratio(paidUsers, signups),
    };
  });
}
