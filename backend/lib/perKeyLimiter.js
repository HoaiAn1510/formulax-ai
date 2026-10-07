/**
 * Giới hạn số lần gọi trong một cửa sổ thời gian theo KHOÁ (vd google_id), giữ trong bộ nhớ tiến
 * trình. express-rate-limit chỉ đếm theo IP trước khi xác thực; cái này đếm theo tài khoản sau khi
 * đã biết là ai (nhiều học sinh cùng một IP ở trường không chặn lẫn nhau). Backend khởi động lại
 * thì bộ đếm về 0 — chấp nhận được vì đây chỉ là chốt chống bấm liên tục, hạn mức ngày nằm ở DB.
 */
export function createPerKeyLimiter({ windowMs, max, now = Date.now, maxKeys = 10_000 }) {
  const hits = new Map(); // key → mốc thời gian các lần gọi còn trong cửa sổ

  const prune = (t) => {
    for (const [key, times] of hits) {
      if (!times.length || t - times[times.length - 1] >= windowMs) hits.delete(key);
    }
  };

  return {
    /** Ghi nhận 1 lần gọi. allowed = false thì KHÔNG ghi, kèm thời gian phải chờ (ms). */
    hit(key) {
      const t = now();
      const times = (hits.get(key) || []).filter((x) => t - x < windowMs);
      if (times.length >= max) {
        hits.set(key, times);
        return { allowed: false, retryAfterMs: windowMs - (t - times[0]) };
      }
      times.push(t);
      hits.set(key, times);
      if (hits.size > maxKeys) prune(t);
      return { allowed: true };
    },
  };
}
