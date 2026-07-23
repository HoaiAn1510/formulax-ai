-- =============================================================================
-- 003 — Bật Row Level Security sau khi chuyển đăng nhập sang Supabase Auth
-- =============================================================================
--
-- BỐI CẢNH
-- Anon key nằm trong bundle JS của frontend nên là thông tin công khai. Trước migration này
-- các bảng chưa bật RLS, nghĩa là bất kỳ ai lấy được anon key đều đọc được email của toàn bộ
-- người dùng và sửa/xoá được bookmark, kết quả quiz, lịch sử chat của người khác.
--
-- Ý TƯỞNG
-- App vẫn dùng cột `google_id` (Google `sub`) làm khoá người dùng ở mọi bảng — KHÔNG cần đổi
-- schema hay sửa truy vấn trong lib/supabase.js. Việc còn thiếu chỉ là: từ JWT của phiên đăng
-- nhập, suy ra google_id một cách không thể giả mạo. Hàm current_google_id() dưới đây làm
-- việc đó bằng cách tra bảng auth.identities (do Supabase quản lý, người dùng không ghi được).
--
-- KHÔNG dùng auth.jwt() -> 'user_metadata' ->> 'provider_id' để phân quyền: user_metadata do
-- người dùng tự cập nhật được qua supabase.auth.updateUser(), dùng nó là mở toang cửa.
--
-- ĐIỀU KIỆN TIÊN QUYẾT (làm trên Supabase Dashboard TRƯỚC khi chạy file này)
--   1. Authentication → Providers → Google: bật, điền Client ID + Client Secret lấy từ
--      Google Cloud Console.
--   2. Trong Google Cloud Console → OAuth consent → Authorized redirect URIs, thêm:
--      https://<project-ref>.supabase.co/auth/v1/callback
--   3. Authentication → URL Configuration: Site URL = domain Vercel, thêm cả
--      http://localhost:5173 vào Redirect URLs để chạy dev.
--
-- SAU KHI CHẠY: mọi người dùng phải đăng nhập lại — phiên cũ chỉ nằm ở localStorage, không
-- phải phiên Supabase, nên không mang JWT và sẽ không đọc được dữ liệu nữa.
-- =============================================================================

-- ─── 1. Hàm suy ra google_id từ phiên đăng nhập hiện tại ─────────────────────
-- SECURITY DEFINER để đọc được schema auth; STABLE để Postgres gọi một lần cho mỗi truy vấn
-- thay vì mỗi dòng (quan trọng cho hiệu năng khi policy chạy trên bảng nhiều dòng).
create or replace function public.current_google_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select i.provider_id
    from auth.identities i
   where i.user_id = auth.uid()
     and i.provider = 'google'
   limit 1;
$$;

revoke all on function public.current_google_id() from public;
grant execute on function public.current_google_id() to authenticated;

-- ─── 2. Bật RLS + policy "chỉ dữ liệu của chính mình" cho các bảng có google_id ──
do $$
declare
  t text;
  tables text[] := array[
    'bookmarks',
    'user_notes',
    'learning_stats',
    'search_history',
    'quiz_daily',
    'quiz_results',
    'flashcard_activity',
    'flashcard_decks',
    'flashcard_progress',
    'chat_sessions',
    'notifications'
  ];
begin
  foreach t in array tables loop
    -- Bỏ qua bảng chưa tồn tại để file chạy được trên cả môi trường dev thiếu bảng
    if not exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = t
    ) then
      raise notice 'Bỏ qua bảng không tồn tại: %', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format($f$
      create policy "own rows" on public.%I
        for all
        to authenticated
        using (google_id = public.current_google_id())
        with check (google_id = public.current_google_id())
    $f$, t);

    -- KHÔNG revoke quyền cấp bảng của anon ở đây. Bản đầu của file này có dòng
    -- `revoke all on public.<bảng> from anon` và nó đã tước nhầm quyền của cả service_role lẫn
    -- authenticated trên 7 bảng, làm hỏng cả ghi bookmark lẫn backend (xem 004). Không cần
    -- thiết: RLS đã bật và policy chỉ cấp cho `authenticated`, nên anon không khớp policy nào
    -- và luôn nhận về 0 dòng.
  end loop;
end $$;

-- ─── 3. Bảng users — chỉ cho đọc, không cho client ghi ───────────────────────
-- Trạng thái Premium do webhook PayOS ghi bằng service role key (bỏ qua RLS). Client chỉ được
-- đọc đúng dòng của mình, và không bao giờ được tự ghi is_premium.
alter table public.users enable row level security;

drop policy if exists "read own user row" on public.users;
create policy "read own user row" on public.users
  for select
  to authenticated
  using (google_id = public.current_google_id());

-- Chỉ chặn ghi. Không revoke SELECT/không đụng tới service_role — service role chạy backend
-- (webhook PayOS ghi is_premium) và vốn bỏ qua RLS.
revoke insert, update, delete on public.users from anon, authenticated;

-- ─── 4. Bảng payments — client không đụng tới ────────────────────────────────
-- Toàn bộ thao tác đi qua backend bằng service role key. Bật RLS mà không tạo policy nào =
-- chặn sạch mọi truy cập từ anon/authenticated.
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;

-- ─── 5. Kiểm tra sau khi chạy ────────────────────────────────────────────────
-- Chạy đoạn dưới để chắc chắn không còn bảng nào hở:
--
--   select tablename, rowsecurity
--     from pg_tables
--    where schemaname = 'public'
--    order by rowsecurity, tablename;
--
-- Mọi bảng phải có rowsecurity = true.
