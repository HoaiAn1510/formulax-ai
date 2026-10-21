/**
 * Kênh giới thiệu (link ?ref=tiktok, ?ref=facebook, ?ref=tiktok-video3, hoặc utm_source) — hàm thuần,
 * không gọi mạng. `storage` là localStorage (hoặc null khi trình duyệt chặn); mọi lần đọc/ghi đều
 * bọc try/catch, hỏng thì coi như không có gì. Gọi mạng ở lib/channelTracking.js. Chạy test:
 * npm run test:channel
 */

export const REF_KEY = "formulax_ref";
export const VISITOR_KEY = "formulax_vid";
export const VISIT_MARK_KEY = "formulax_visit_mark";
export const signupMarkKey = (googleId) => `formulax_signup_tracked_${googleId}`;
export const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const DIRECT_REF = "direct";

/** Chữ thường, chỉ giữ a-z 0-9 và "-", tối đa 40 ký tự. Rỗng → null. Backend làm sạch lại lần nữa. */
export function sanitizeRef(value) {
  if (typeof value !== "string") return null;
  const ref = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  return ref || null;
}

export function safeGet(storage, key) {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSet(storage, key, value) {
  try {
    if (storage) storage.setItem(key, value);
  } catch {
    // bộ nhớ đầy / chế độ riêng tư — bỏ qua
  }
}

/** ref trong URL: ưu tiên ?ref=, không có thì utm_source. */
export function readRefFromSearch(search) {
  const params = new URLSearchParams(search || "");
  return sanitizeRef(params.get("ref")) || sanitizeRef(params.get("utm_source"));
}

/**
 * Trang này là lúc Google đăng nhập xong quay về (Supabase: ?code= hoặc #access_token=). Không đếm là
 * lượt truy cập — nếu không, mỗi lần đăng nhập thành một lượt "direct".
 */
export function isAuthCallback(search, hash) {
  const params = new URLSearchParams(search || "");
  return params.has("code") || params.has("error_description") || /(^#|&)(access_token|error_description)=/.test(hash || "");
}

/** URL đã bỏ ref và mọi utm_*; null nếu không có gì để bỏ (khỏi gọi replaceState). */
export function cleanedUrl(href) {
  const url = new URL(href);
  const keys = [...url.searchParams.keys()].filter((k) => k === "ref" || k.startsWith("utm_"));
  if (!keys.length) return null;
  for (const k of keys) url.searchParams.delete(k);
  return url.pathname + url.search + url.hash;
}

/** ref first-touch còn hạn (30 ngày) hoặc null. */
export function getStoredRef(storage, now = Date.now()) {
  try {
    const saved = JSON.parse(safeGet(storage, REF_KEY) || "null");
    if (!saved || typeof saved.ref !== "string" || !(saved.expiresAt > now)) return null;
    return sanitizeRef(saved.ref);
  } catch {
    return null;
  }
}

/** Lưu first-touch: ref cũ còn hạn thì KHÔNG ghi đè. Trả về ref đang có hiệu lực. */
export function rememberFirstTouch(storage, ref, now = Date.now()) {
  const current = getStoredRef(storage, now);
  if (current || !ref) return current;
  safeSet(storage, REF_KEY, JSON.stringify({ ref, savedAt: now, expiresAt: now + REF_TTL_MS }));
  return ref;
}

/** Ngày theo giờ Việt Nam (YYYY-MM-DD) — khớp cách backend/DB tính ngày. */
export const vnDay = (now = Date.now()) => new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** id ngẫu nhiên của trình duyệt này (không gắn với tài khoản); không lưu được thì tạo mới mỗi lần. */
export function getVisitorId(storage, makeId = () => crypto.randomUUID()) {
  const saved = safeGet(storage, VISITOR_KEY);
  if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
  const id = makeId();
  safeSet(storage, VISITOR_KEY, id);
  return id;
}

/** Đã gửi lượt truy cập cho ref này hôm nay chưa — 1 lần/trình duyệt/ref/ngày. */
export function visitAlreadySent(storage, ref, day) {
  try {
    const mark = JSON.parse(safeGet(storage, VISIT_MARK_KEY) || "null");
    return Boolean(mark && mark.day === day && Array.isArray(mark.refs) && mark.refs.includes(ref));
  } catch {
    return false;
  }
}

export function markVisitSent(storage, ref, day) {
  let refs = [];
  try {
    const mark = JSON.parse(safeGet(storage, VISIT_MARK_KEY) || "null");
    if (mark && mark.day === day && Array.isArray(mark.refs)) refs = mark.refs;
  } catch {
    // dấu hỏng — ghi lại từ đầu
  }
  safeSet(storage, VISIT_MARK_KEY, JSON.stringify({ day, refs: [...new Set([...refs, ref])] }));
}
