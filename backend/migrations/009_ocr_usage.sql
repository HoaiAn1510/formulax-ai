-- =============================================================================
-- 009 — Đếm số lần quét ảnh đề (POST /api/ocr) mỗi ngày
-- =============================================================================
--
-- BỐI CẢNH
-- Học sinh chụp ảnh đề → backend gửi ảnh tới Gemini để chép đề ra chữ. Quét ảnh KHÔNG tính vào
-- 10 lượt AI Finder/ngày, nhưng mỗi lần quét tốn hạn mức Gemini dùng chung cho cả app, nên vẫn
-- giới hạn để tránh lạm dụng: Free 20 lần/ngày, Premium 50 lần/ngày (backend/server.js). Khách
-- ẩn danh không được quét (403 trước khi tới đây).
--
-- Cùng cách làm với ai_usage_daily (006/007):
--   - Bảng bật RLS, không có policy nào → client không đọc/ghi được; chỉ backend (service_role).
--   - increment_ocr_usage: tăng nguyên tử TRƯỚC khi gọi Gemini (không đọc-rồi-tăng).
--   - refund_ocr_usage: hoàn lại khi không giao được kết quả (vượt hạn mức, Gemini lỗi/timeout,
--     JSON hỏng). Ảnh không có đề toán (problems rỗng) vẫn tính — Gemini đã đọc ảnh.
--   - Ngày tính theo giờ Việt Nam ngay trong hàm.
--
-- Chạy SAU 008 và TRƯỚC khi deploy backend có route /api/ocr.
-- =============================================================================

create table if not exists public.ocr_usage_daily (
  google_id text not null,
  usage_date date not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (google_id, usage_date)
);

alter table public.ocr_usage_daily enable row level security;
revoke all on public.ocr_usage_daily from anon, authenticated;
grant select, insert, update on public.ocr_usage_daily to service_role;

create or replace function public.increment_ocr_usage(p_google_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_count int;
begin
  insert into public.ocr_usage_daily (google_id, usage_date, count, updated_at)
  values (p_google_id, v_today, 1, now())
  on conflict (google_id, usage_date)
  do update set count = public.ocr_usage_daily.count + 1, updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;

create or replace function public.refund_ocr_usage(p_google_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.ocr_usage_daily
     set count = greatest(count - 1, 0),
         updated_at = now()
   where google_id = p_google_id
     and usage_date = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  returning count into v_count;
  return coalesce(v_count, 0);
end;
$$;

-- Supabase mặc định cấp EXECUTE trên hàm mới cho anon và authenticated — phải revoke tường minh,
-- nếu không ai cầm anon key cũng tự hoàn lượt vô hạn cho google_id bất kỳ (xem 006/007).
revoke all on function public.increment_ocr_usage(text) from public;
revoke execute on function public.increment_ocr_usage(text) from anon, authenticated;
grant execute on function public.increment_ocr_usage(text) to service_role;

revoke all on function public.refund_ocr_usage(text) from public;
revoke execute on function public.refund_ocr_usage(text) from anon, authenticated;
grant execute on function public.refund_ocr_usage(text) to service_role;

-- ─── Kiểm tra sau khi chạy ────────────────────────────────────────────────────
-- (a) Bảng bật RLS, không policy nào:
--   select relname, relrowsecurity from pg_class where relname = 'ocr_usage_daily';  -- true
--   select count(*) from pg_policies where tablename = 'ocr_usage_daily';            -- 0
--
-- (b) anon/authenticated KHÔNG được EXECUTE — cả 4 cột phải là false:
--   select has_function_privilege('anon', 'public.increment_ocr_usage(text)', 'execute'),
--          has_function_privilege('authenticated', 'public.increment_ocr_usage(text)', 'execute'),
--          has_function_privilege('anon', 'public.refund_ocr_usage(text)', 'execute'),
--          has_function_privilege('authenticated', 'public.refund_ocr_usage(text)', 'execute');
--
-- (c) Thử tăng rồi hoàn:
--   select public.increment_ocr_usage('test-google-id');  -- 1
--   select public.increment_ocr_usage('test-google-id');  -- 2
--   select public.refund_ocr_usage('test-google-id');     -- 1
--   select public.refund_ocr_usage('test-google-id');     -- 0
--   select public.refund_ocr_usage('test-google-id');     -- 0 (không xuống âm)
--   delete from public.ocr_usage_daily where google_id = 'test-google-id';
