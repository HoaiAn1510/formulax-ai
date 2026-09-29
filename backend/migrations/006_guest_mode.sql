-- =============================================================================
-- 006 — Chế độ Khách (Supabase Anonymous Sign-in) + quota AI Finder theo backend
-- =============================================================================
--
-- BỐI CẢNH
-- Thêm "Dùng thử không cần đăng nhập" bằng supabase.auth.signInAnonymously(). User ẩn danh
-- vẫn mang role `authenticated` (Supabase không có role riêng cho ẩn danh), nên mọi policy
-- "own rows" hiện có (xem 003/005) cần được đối chiếu lại để chắc chắn không vô tình cấp quyền
-- cho họ.
--
-- HIỆN TRẠNG (đã kiểm tra trước khi viết file này)
-- current_google_id() tra auth.identities theo provider='google' — user ẩn danh không có
-- identity này nên hàm trả NULL, và mọi điều kiện `google_id = public.current_google_id()`
-- tự động là UNKNOWN (không match dòng nào) vì so sánh với NULL không bao giờ là TRUE, kể cả
-- khi hai vế cùng NULL. Vậy 11 bảng cá nhân hóa hiện đã chặn đúng khách ẩn danh — không cần
-- đổi hành vi, chỉ cần LÀM RÕ TƯỜNG MINH ý định (không dựa vào suy luận NULL) để không ai lỡ
-- tay phá vỡ điều này trong tương lai (ví dụ nếu sau này ai đó cho phép google_id NULL).
--
-- ĐỐI CHIẾU VỚI MIGRATION 003 + 005 (không suy đoán — đọc trực tiếp 2 file đó):
-- Cả 003 và 005 tạo policy giống hệt nhau cho đúng 11 bảng dưới đây: tên "own rows",
-- FOR ALL, TO authenticated, USING/WITH CHECK (google_id = public.current_google_id()).
-- Không bảng nào trong 11 bảng lệch khỏi khuôn FOR ALL này (không có bảng nào chỉ SELECT hay
-- chỉ INSERT riêng). Bảng `users` là "read own user row", FOR SELECT, TO authenticated — khác
-- khuôn FOR ALL nên được xử lý RIÊNG ở bước 1b, không đưa vào vòng lặp chung. Bảng `payments`
-- không có policy nào (đúng, không đụng ở đây).
--
-- Vẫn nên tự đối chiếu với DB thật trước khi chạy (phòng trường hợp có ai chỉnh tay qua
-- Dashboard ngoài các file migration — đúng kịch bản đã gây sự cố ở 005). Chạy câu dưới đây
-- trong SQL Editor và lưu lại kết quả trước khi chạy phần còn lại của file:
--
--   select schemaname, tablename, policyname, cmd, roles, qual, with_check
--     from pg_policies where schemaname = 'public' order by tablename;
--
-- PHẦN MỚI TRONG FILE NÀY: quota AI Finder cho tài khoản Google Free (10 lượt/ngày), tính theo
-- giờ Việt Nam, tăng nguyên tử qua hàm RPC — chỉ backend (service_role) gọi được. Khách ẩn danh
-- KHÔNG có hàng nào trong bảng này vì bị chặn ở tầng ứng dụng (backend trả 403 trước khi chạm
-- DB — xem server.js), AI Finder không dành cho khách.
--
-- LUỒNG BACKEND DÙNG 2 HÀM RPC BÊN DƯỚI (quan trọng, tránh nhầm khi đọc code server.js):
--   POST /api/chat  → gọi increment_ai_usage() TRƯỚC khi gọi Groq. Nếu giá trị trả về > 10 thì
--                      trả 429 ngay, KHÔNG gọi Groq (đỡ tốn phí Groq cho request chắc chắn bị
--                      chặn). Đây là tăng-rồi-kiểm-tra, không phải đọc-rồi-mới-tăng, để 2 request
--                      đồng thời của cùng 1 user không bao giờ đếm thiếu.
--   GET  /api/chat/usage → CHỈ gọi get_ai_usage() (không tăng đếm) để hiển thị số lượt còn lại
--                      khi người dùng mới vào trang, chưa hỏi gì.
-- =============================================================================

-- ─── 1a. Làm rõ tường minh: loại trừ ẩn danh khỏi policy "own rows" (11 bảng FOR ALL) ──
-- Không đổi hành vi thực tế (NULL = NULL vốn đã là false), chỉ thêm điều kiện tường minh để
-- không phụ thuộc vào suy luận NULL. current_google_id() IS NOT NULL nghĩa là "đây chắc chắn
-- là tài khoản có Google identity thật, không phải ẩn danh".
-- Bọc current_google_id() trong (select ...) để Postgres tính giá trị này MỘT LẦN cho mỗi câu
-- truy vấn (initPlan) thay vì tính lại cho từng dòng — quan trọng khi bảng có nhiều dòng.
do $$
declare
  t text;
  tables text[] := array[
    'bookmarks','user_notes','learning_stats','search_history','quiz_daily','quiz_results',
    'flashcard_activity','flashcard_decks','flashcard_progress','chat_sessions','notifications'
  ];
begin
  foreach t in array tables loop
    if not exists (select 1 from information_schema.tables
                    where table_schema='public' and table_name=t) then
      raise notice 'Bỏ qua bảng không tồn tại: %', t;
      continue;
    end if;

    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format($f$
      create policy "own rows" on public.%I
        for all
        to authenticated
        using ((select public.current_google_id()) is not null and google_id = (select public.current_google_id()))
        with check ((select public.current_google_id()) is not null and google_id = (select public.current_google_id()))
    $f$, t);
  end loop;
end $$;

-- ─── 1b. Bảng `users` — khuôn khác (FOR SELECT, không phải FOR ALL) nên xử lý riêng ───
drop policy if exists "read own user row" on public.users;
create policy "read own user row" on public.users
  for select
  to authenticated
  using ((select public.current_google_id()) is not null and google_id = (select public.current_google_id()));

-- ─── 2. Bảng đếm lượt hỏi AI Finder trong ngày (chỉ Google Free) ─────────────
-- Khoá theo google_id (nhất quán với mọi bảng khác trong app) + ngày theo giờ Việt Nam.
-- Không có policy nào cho anon/authenticated — client không bao giờ đụng trực tiếp bảng này,
-- chỉ backend (service_role) đọc/ghi qua 2 hàm RPC bên dưới, giống cách bảng `payments` đang
-- được bảo vệ (RLS bật, không policy nào = client 0 quyền truy cập).
create table if not exists public.ai_usage_daily (
  google_id text not null,
  usage_date date not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (google_id, usage_date)
);

alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;
grant select, insert, update on public.ai_usage_daily to service_role;

-- ─── 3. Hàm tăng nguyên tử — backend gọi TRƯỚC khi gọi Groq cho mỗi câu hỏi ──
-- INSERT ... ON CONFLICT DO UPDATE chạy trong đúng 1 câu lệnh: không có khoảng hở giữa đọc và
-- ghi, nên 2 request đồng thời của cùng 1 user không bao giờ đếm thiếu (race condition). Ngày
-- tính theo giờ Việt Nam ngay trong hàm, không nhận date từ tham số, để backend không cần tự
-- tính timezone (dễ sai lệch múi giờ server). Backend đọc giá trị trả về: nếu > 10 thì từ chối
-- (429) và KHÔNG gọi Groq — nghĩa là lượt "vượt hạn mức" vẫn bị cộng vào bộ đếm, nhưng vô hại
-- vì đằng nào cũng đã vượt, không ảnh hưởng logic chặn.
create or replace function public.increment_ai_usage(p_google_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_count int;
begin
  insert into public.ai_usage_daily (google_id, usage_date, count, updated_at)
  values (p_google_id, v_today, 1, now())
  on conflict (google_id, usage_date)
  do update set count = public.ai_usage_daily.count + 1, updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;

-- Supabase mặc định cấp EXECUTE trên hàm mới trong schema public cho CẢ anon lẫn authenticated
-- (default privileges của Postgres/Supabase) — "revoke all ... from public" không thu hồi lại
-- các GRANT đã cấp riêng cho 2 role đó trước khi lệnh revoke chạy, nên phải revoke tường minh
-- từng role. Không có bước này, bất kỳ ai cầm anon key cũng gọi thẳng được RPC và tự tăng/đọc
-- bộ đếm của người khác nếu đoán được google_id.
revoke all on function public.increment_ai_usage(text) from public;
revoke execute on function public.increment_ai_usage(text) from anon, authenticated;
grant execute on function public.increment_ai_usage(text) to service_role;

-- ─── 4. Hàm đọc lượt đã dùng hôm nay — CHỈ dùng cho GET /api/chat/usage ──────
-- Không tăng đếm, chỉ đọc. Trả 0 nếu chưa có dòng nào (chưa hỏi AI lần nào hôm nay). Không được
-- dùng hàm này để kiểm tra rồi mới gọi increment_ai_usage riêng — có khoảng hở giữa đọc và ghi,
-- 2 request đồng thời có thể cùng đọc thấy "còn lượt" rồi cùng được tăng, vượt hạn mức.
create or replace function public.get_ai_usage(p_google_id text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select count from public.ai_usage_daily
      where google_id = p_google_id
        and usage_date = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
    0
  );
$$;

revoke all on function public.get_ai_usage(text) from public;
revoke execute on function public.get_ai_usage(text) from anon, authenticated;
grant execute on function public.get_ai_usage(text) to service_role;

-- ─── 5. Kiểm tra sau khi chạy ────────────────────────────────────────────────
-- (a) Policy đã đổi đúng chưa (qual/with_check phải chứa "is not null"):
--   select tablename, policyname, cmd, roles, qual, with_check from pg_policies
--    where schemaname='public' and policyname in ('own rows','read own user row')
--    order by tablename;
--
-- (b) Bảng mới đã bật RLS và không có policy nào:
--   select relname, relrowsecurity from pg_class where relname = 'ai_usage_daily';
--   select count(*) from pg_policies where tablename = 'ai_usage_daily'; -- phải là 0
--
-- (c) anon/authenticated KHÔNG được EXECUTE 2 hàm RPC — tất cả các dòng dưới phải là false:
--   select has_function_privilege('anon', 'public.increment_ai_usage(text)', 'execute'),
--          has_function_privilege('authenticated', 'public.increment_ai_usage(text)', 'execute'),
--          has_function_privilege('anon', 'public.get_ai_usage(text)', 'execute'),
--          has_function_privilege('authenticated', 'public.get_ai_usage(text)', 'execute');
--
-- (d) Test tăng đếm (chạy trong SQL Editor — nó chạy bằng quyền đủ mạnh để gọi hàm này):
--   select public.increment_ai_usage('test-google-id');  -- lần đầu phải trả về 1, lần sau 2...
--   select public.get_ai_usage('test-google-id');         -- phải khớp giá trị vừa tăng
--   delete from public.ai_usage_daily where google_id = 'test-google-id'; -- dọn dữ liệu test
