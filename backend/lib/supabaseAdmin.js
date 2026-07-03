import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isConfigured = Boolean(url) && Boolean(serviceKey) && !serviceKey.startsWith("CHUA_CAU_HINH");

if (!isConfigured) {
  console.warn(
    "[Supabase] SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình trong backend/.env — " +
    "route MoMo IPN sẽ không thể cập nhật is_premium. Lấy key tại Supabase Dashboard → Project Settings → API."
  );
}

// Dùng service role key: bỏ qua RLS, CHỈ dùng ở backend, không bao giờ gửi ra frontend.
export const supabaseAdmin = isConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
