-- =============================================================================
-- 010 — Theo dõi kênh giới thiệu (TikTok, Facebook...) cho báo cáo KPI
-- =============================================================================
--
-- BỐI CẢNH
-- Link của nhóm có dạng ?ref=tiktok, ?ref=facebook, ?ref=tiktok-video3 (hoặc utm_source). Cần biết
-- mỗi kênh mang về bao nhiêu lượt mở app, bao nhiêu tài khoản đăng ký, bao nhiêu người mua Premium.
--
--   - channel_visits: mỗi trình duyệt (visitor_id ngẫu nhiên do frontend tạo) × ref × ngày = 1 dòng.
--     Không lưu IP, không lưu user agent. Không có ref → 'direct'.
--   - user_acquisition: nguồn đăng ký của từng tài khoản Google. Bảng users chỉ có dòng của người
--     đã mua (do webhook payOS ghi), nên nguồn đăng ký nằm ở bảng riêng này. Chỉ gắn nguồn khi tài
--     khoản vừa tạo ≤ 24 giờ (backend kiểm tra); tài khoản cũ có dòng nhưng signup_source = NULL.
--     service_role chỉ được select + insert, KHÔNG update → nguồn đã ghi không bao giờ bị ghi đè.
--   - payments.signup_source: nguồn đăng ký của người mua, ghi lúc tạo đơn (POST /payos/create).
--     Không có ràng buộc check để không bao giờ làm hỏng việc tạo đơn; backend đã làm sạch giá trị.
--   - channel_stats(from, to): gộp số liệu ngay trong DB (đọc thô qua PostgREST bị cắt ở 1000 dòng).
--
-- Cả hai bảng bật RLS, không policy nào → client (anon/authenticated) không đọc/ghi được; chỉ
-- backend (service_role). Supabase cấp sẵn ALL trên bảng mới cho service_role (default privileges)
-- nên phải revoke cả service_role rồi mới grant lại đúng select + insert. Backend chỉ cần hai quyền
-- này: supabase-js upsert({ ignoreDuplicates: true }) gửi POST "Prefer: resolution=ignore-duplicates"
-- → PostgREST chạy INSERT … ON CONFLICT DO NOTHING (chỉ cần insert); không có update/delete nào.
-- Chạy TRƯỚC khi deploy backend có /api/track/* và /api/admin/channel-stats.
-- =============================================================================

create table if not exists public.channel_visits (
  day date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  ref text not null check (ref ~ '^[a-z0-9-]{1,40}$'),
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (day, ref, visitor_id)
);

alter table public.channel_visits enable row level security;
revoke all on public.channel_visits from anon, authenticated, service_role;
grant select, insert on public.channel_visits to service_role;

create table if not exists public.user_acquisition (
  google_id text primary key,
  signup_source text check (signup_source is null or signup_source ~ '^[a-z0-9-]{1,40}$'),
  signup_source_at timestamptz,
  account_created_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.user_acquisition enable row level security;
revoke all on public.user_acquisition from anon, authenticated, service_role;
grant select, insert on public.user_acquisition to service_role;

alter table public.payments add column if not exists signup_source text;

-- security invoker: chạy với quyền của người gọi. Chỉ service_role được EXECUTE (bên dưới), và
-- service_role vốn đọc được cả 3 bảng — không cần definer.
create or replace function public.channel_stats(p_from date, p_to date)
returns table (source text, visits bigint, signups bigint, paid_users bigint, revenue bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with v as (
    select cv.ref as source, count(*) as n
      from public.channel_visits cv
     where cv.day between p_from and p_to
     group by cv.ref
  ),
  s as (
    select coalesce(ua.signup_source, 'direct') as source, count(*) as n
      from public.user_acquisition ua
     where (ua.account_created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to
     group by 1
  ),
  p as (
    select coalesce(pm.signup_source, 'direct') as source,
           count(distinct pm.google_id) as users,
           sum(pm.amount)::bigint as revenue
      from public.payments pm
     where pm.status = 'success'
       and pm.payos_reference is distinct from 'SIMULATED'   -- đơn giả lập ở môi trường dev
       and (pm.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to
     group by 1
  ),
  src as (
    select v.source from v union select s.source from s union select p.source from p
  )
  select src.source,
         coalesce(v.n, 0)::bigint,
         coalesce(s.n, 0)::bigint,
         coalesce(p.users, 0)::bigint,
         coalesce(p.revenue, 0)::bigint
    from src
    left join v on v.source = src.source
    left join s on s.source = src.source
    left join p on p.source = src.source
   order by 2 desc, 1;
$$;

revoke all on function public.channel_stats(date, date) from public;
revoke execute on function public.channel_stats(date, date) from anon, authenticated;
grant execute on function public.channel_stats(date, date) to service_role;

-- ─── Kiểm tra sau khi chạy ────────────────────────────────────────────────────
-- (a) Hai bảng bật RLS (true, true), không policy nào (0):
--   select relname, relrowsecurity from pg_class
--    where relname in ('channel_visits', 'user_acquisition');
--   select count(*) from pg_policies where tablename in ('channel_visits', 'user_acquisition');
--
-- (b) anon/authenticated không có quyền nào trên hai bảng — cả 4 cột false:
--   select has_table_privilege('anon', 'public.channel_visits', 'select'),
--          has_table_privilege('authenticated', 'public.channel_visits', 'select'),
--          has_table_privilege('anon', 'public.user_acquisition', 'select'),
--          has_table_privilege('authenticated', 'public.user_acquisition', 'select');
--
-- (c) service_role chỉ có select + insert trên hai bảng — 4 cột đầu false, 2 cột cuối true:
--   select has_table_privilege('service_role', 'public.user_acquisition', 'update'),
--          has_table_privilege('service_role', 'public.user_acquisition', 'delete'),
--          has_table_privilege('service_role', 'public.channel_visits', 'update'),
--          has_table_privilege('service_role', 'public.channel_visits', 'delete'),
--          has_table_privilege('service_role', 'public.user_acquisition', 'insert'),
--          has_table_privilege('service_role', 'public.channel_visits', 'insert');
--
-- (d) anon/authenticated không EXECUTE được channel_stats (false, false); service_role được (true):
--   select has_function_privilege('anon', 'public.channel_stats(date, date)', 'execute'),
--          has_function_privilege('authenticated', 'public.channel_stats(date, date)', 'execute'),
--          has_function_privilege('service_role', 'public.channel_stats(date, date)', 'execute');
--
-- (e) Cột mới trên payments (1 dòng: signup_source | text | YES):
--   select column_name, data_type, is_nullable from information_schema.columns
--    where table_schema = 'public' and table_name = 'payments' and column_name = 'signup_source';
--
-- (f) Hàm chạy được (chỉ số tổng hợp, không có dữ liệu cá nhân):
--   select * from public.channel_stats(current_date - 30, current_date);
