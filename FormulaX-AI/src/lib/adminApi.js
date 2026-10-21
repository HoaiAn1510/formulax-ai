import { getAccessToken } from "./supabase";

/**
 * Gọi /api/admin/* (backend routes/admin.js). Backend tự kiểm tra quyền theo ADMIN_EMAILS từ token —
 * frontend không giữ danh sách email admin nào.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

async function adminGet(path, { params, signal } = {}) {
  const token = await getAccessToken();
  if (!token) throw Object.assign(new Error("Chưa đăng nhập."), { status: 401 });
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${BACKEND_URL}/api/admin/${path}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `Lỗi ${res.status}`), { status: res.status });
  return body;
}

/** true / false theo backend. Ném lỗi khi mạng lỗi, server lỗi hoặc bị huỷ (signal). */
export async function fetchIsAdmin(signal) {
  const body = await adminGet("me", { signal });
  return body.isAdmin === true;
}

/** section: overview | channel-stats | users | revenue | usage; range: { from, to } */
export function fetchAdminSection(section, range, signal) {
  return adminGet(section, { params: { from: range.from, to: range.to }, signal });
}
