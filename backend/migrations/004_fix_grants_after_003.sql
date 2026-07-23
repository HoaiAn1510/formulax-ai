-- =============================================================================
-- 004 — Sửa lỗi mất quyền do migration 003 gây ra
-- =============================================================================
--
-- CHUYỆN GÌ ĐÃ XẢY RA
-- 003 có dòng `revoke all on public.<bảng> from anon` chạy trong vòng lặp. Ý định là chặn
-- anon cho chắc, nhưng thực tế 7 bảng (bookmarks, user_notes, learning_stats, search_history,
-- quiz_daily, quiz_results, flashcard_activity) mất luôn quyền của `service_role` và
-- `authenticated`. Triệu chứng: người dùng đã đăng nhập bấm bookmark không lưu được, backend
-- dùng service role key cũng bị 42501 permission denied.
--
-- BÀI HỌC: revoke đó là THỪA. Khi RLS đã bật và policy chỉ cấp cho `authenticated`, vai trò
-- `anon` không khớp policy nào nên tự động không đọc/ghi được dòng nào — đó mới là lớp bảo vệ
-- đúng chỗ. Đừng nghịch GRANT/REVOKE cấp bảng của Supabase nữa.
--
-- Chạy toàn bộ file này trong SQL Editor.
-- =============================================================================

-- ─── 1. Khôi phục quyền chuẩn của Supabase ───────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

-- service_role phải luôn có toàn quyền: backend (webhook PayOS) chạy bằng vai trò này và nó
-- vốn bỏ qua RLS, quyền cấp bảng không phải là lớp bảo mật ở đây.
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- authenticated cần quyền cấp bảng để RLS có cái mà lọc. Không có quyền này thì RLS không kịp
-- chạy, Postgres chặn ngay từ tầng GRANT.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- anon cũng trả lại quyền cấp bảng; việc chặn để RLS lo (không có policy nào cấp cho anon nên
-- kết quả luôn là 0 dòng thay vì lỗi 42501).
grant select, insert, update, delete on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

-- ─── 2. Áp lại đúng hai hạn chế thật sự cần ở tầng GRANT ─────────────────────
-- Trạng thái Premium chỉ được ghi bởi webhook (service role). Client tuyệt đối không được ghi.
revoke insert, update, delete on public.users from anon, authenticated;

-- Bảng thanh toán: client không có việc gì ở đây, kể cả đọc.
revoke all on public.payments from anon, authenticated;

-- ─── 3. Kiểm tra ─────────────────────────────────────────────────────────────
-- (a) Mọi bảng vẫn phải còn bật RLS:
--
--   select tablename, rowsecurity from pg_tables
--    where schemaname = 'public' order by rowsecurity, tablename;
--
-- (b) Xem quyền thực tế của từng vai trò (để lần sau không phải đoán):
--
--   select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type)
--     from information_schema.role_table_grants
--    where table_schema = 'public'
--      and grantee in ('anon', 'authenticated', 'service_role')
--    group by table_name, grantee
--    order by table_name, grantee;
--
-- Kỳ vọng: service_role có đủ quyền trên mọi bảng; authenticated có SELECT/INSERT/UPDATE/DELETE
-- trên mọi bảng trừ `users` (chỉ SELECT) và `payments` (không có gì).
