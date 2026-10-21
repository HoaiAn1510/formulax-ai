import { useEffect, useState } from "react";
import { fetchAdminSection } from "../lib/adminApi";

const SLOW_MS = 5000;

/**
 * Tải một mục của trang quản trị theo khoảng ngày. Trả về:
 *   loading — đang tải; slow — đã quá 5 giây (Render gói miễn phí đang khởi động);
 *   data / error — kết quả của đúng lần tải hiện tại; retry() — tải lại.
 * Đổi khoảng ngày thì huỷ request cũ (AbortController).
 */
export function useAdminSection(section, range) {
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [slowKey, setSlowKey] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const { from, to, error: rangeError } = range;
  const key = rangeError ? null : `${section}|${from}|${to}|${attempt}`;

  useEffect(() => {
    if (!key) return undefined;
    const ctrl = new AbortController();
    const slow = setTimeout(() => setSlowKey(key), SLOW_MS);
    fetchAdminSection(section, { from, to }, ctrl.signal)
      .then(
        (data) => setResult({ key, data, error: null }),
        (error) => { if (!ctrl.signal.aborted) setResult({ key, data: null, error }); },
      )
      .finally(() => clearTimeout(slow));
    return () => {
      ctrl.abort();
      clearTimeout(slow);
    };
  }, [key, section, from, to]);

  const current = result.key === key;
  const loading = Boolean(key) && !current;
  return {
    loading,
    slow: loading && slowKey === key,
    data: current ? result.data : null,
    error: current ? result.error : null,
    retry: () => setAttempt((n) => n + 1),
  };
}
