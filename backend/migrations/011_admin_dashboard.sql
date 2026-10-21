-- =============================================================================
-- 011 — Trang quản trị (chỉ xem số liệu) + bộ đếm sự kiện sử dụng theo ngày
-- =============================================================================
--
-- BỐI CẢNH
-- Tài khoản có email trong ADMIN_EMAILS (biến môi trường trên Render) vào thẳng trang quản trị.
-- Trang chỉ xem, không sửa dữ liệu. Backend kiểm tra quyền (routes/admin.js) rồi gọi các hàm dưới
-- đây bằng service_role. Mọi phép đếm/cộng chạy trong DB — đọc dòng thô qua PostgREST bị cắt ở
-- 1000 dòng.
--
--   - usage_events_daily: số lần một sự kiện xảy ra trong ngày (giờ Việt Nam). Chỉ (ngày, tên chỉ
--     số, số đếm) — không google_id, không câu hỏi, không ảnh. Backend tăng qua bump_usage_metric,
--     chạy ngầm, lỗi thì bỏ qua. Sáu chỉ số:
--       ai_premium_turn     lượt AI Finder đã giao của tài khoản Premium (Free đã có ai_usage_daily)
--       ai_quota_exceeded   Free hỏi khi đã hết 10 lượt
--       ai_busy             Groq báo 429 ("AI đang bận")
--       ocr_quota_exceeded  quét ảnh khi đã hết lượt ngày
--       ocr_rate_limited    quét ảnh quá nhanh (giới hạn theo phút, tài khoản hoặc IP)
--       chat_ip_limited     /api/chat bị chặn theo IP (12/phút, 300/ngày)
--   - Các hàm admin_*: security definer (đọc auth.users / auth.identities), search_path cố định,
--     CHỈ service_role được EXECUTE, chỉ trả số tổng hợp — trừ admin_recent_orders trả email ĐÃ
--     CHE (an***@gmail.com), không google_id, không mã giao dịch.
--   - "Tài khoản Google" = auth.users không ẩn danh và có identity provider = 'google'.
--   - Doanh thu: payments.status = 'success', loại đơn giả lập payos_reference = 'SIMULATED'.
--   - Premium đang hoạt động: users.is_premium và (premium_expiry null hoặc > now()) — cùng cách
--     tính với computeIsPremium ở backend; null = cấp tay không thời hạn (vd tài khoản demo).
--
-- Chạy SAU 010 và TRƯỚC khi deploy backend có /api/admin/* và bump_usage_metric.
-- =============================================================================

-- ─── 1. Bộ đếm sự kiện theo ngày ─────────────────────────────────────────────
create table if not exists public.usage_events_daily (
  day date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  metric text not null check (metric in (
    'ai_premium_turn', 'ai_quota_exceeded', 'ai_busy',
    'ocr_quota_exceeded', 'ocr_rate_limited', 'chat_ip_limited'
  )),
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, metric)
);

-- Không ai đọc/ghi trực tiếp — kể cả service_role (Supabase cấp sẵn ALL qua default privileges).
-- Ghi qua bump_usage_metric, đọc qua admin_usage_by_day (cả hai security definer).
alter table public.usage_events_daily enable row level security;
revoke all on public.usage_events_daily from anon, authenticated, service_role;

create or replace function public.bump_usage_metric(p_metric text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.usage_events_daily (day, metric, count, updated_at)
  values ((now() at time zone 'Asia/Ho_Chi_Minh')::date, p_metric, 1, now())
  on conflict (day, metric)
  do update set count = public.usage_events_daily.count + 1, updated_at = now();
end;
$$;

-- ─── 2. Che email (dùng trong admin_recent_orders) ───────────────────────────
-- "an***@gmail.com": giữ 2 ký tự đầu (tên < 3 ký tự thì giữ 1), giữ nguyên tên miền.
create or replace function public.admin_mask_email(p_email text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_email is null or position('@' in p_email) < 2 then null
    else left(split_part(p_email, '@', 1),
              case when length(split_part(p_email, '@', 1)) < 3 then 1 else 2 end)
         || '***@' || split_part(p_email, '@', 2)
  end;
$$;

-- ─── 3. Tổng quan ────────────────────────────────────────────────────────────
create or replace function public.admin_overview(p_from date, p_to date)
returns table (
  new_accounts bigint,
  premium_active bigint,
  revenue_total bigint,
  paid_orders bigint,
  ai_turns_today bigint,
  ocr_scans_today bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with today as (select (now() at time zone 'Asia/Ho_Chi_Minh')::date as d)
  select
    (select count(*)
       from auth.users u
      where coalesce(u.is_anonymous, false) = false
        and exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google')
        and (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to)::bigint,
    (select count(*) from public.users pu
      where pu.is_premium and (pu.premium_expiry is null or pu.premium_expiry > now()))::bigint,
    (select coalesce(sum(pm.amount), 0) from public.payments pm
      where pm.status = 'success' and pm.payos_reference is distinct from 'SIMULATED'
        and (pm.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to)::bigint,
    (select count(*) from public.payments pm
      where pm.status = 'success' and pm.payos_reference is distinct from 'SIMULATED'
        and (pm.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to)::bigint,
    ((select coalesce(sum(a.count), 0) from public.ai_usage_daily a, today where a.usage_date = today.d)
     + (select coalesce(sum(e.count), 0) from public.usage_events_daily e, today
         where e.day = today.d and e.metric = 'ai_premium_turn'))::bigint,
    (select coalesce(sum(o.count), 0) from public.ocr_usage_daily o, today where o.usage_date = today.d)::bigint;
$$;

-- ─── 4. Người dùng & Premium ─────────────────────────────────────────────────
create or replace function public.admin_user_totals()
returns table (
  google_accounts_total bigint,
  premium_active bigint,
  premium_no_expiry bigint,
  premium_expiring_7d bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*)
       from auth.users u
      where coalesce(u.is_anonymous, false) = false
        and exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google'))::bigint,
    (select count(*) from public.users pu
      where pu.is_premium and (pu.premium_expiry is null or pu.premium_expiry > now()))::bigint,
    (select count(*) from public.users pu where pu.is_premium and pu.premium_expiry is null)::bigint,
    (select count(*) from public.users pu
      where pu.is_premium and pu.premium_expiry > now()
        and pu.premium_expiry <= now() + interval '7 days')::bigint;
$$;

create or replace function public.admin_signups_by_day(p_from date, p_to date)
returns table (day date, new_accounts bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with s as (
    select (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date as d, count(*) as n
      from auth.users u
     where coalesce(u.is_anonymous, false) = false
       and exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google')
       and (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to
     group by 1
  )
  select g.d::date, coalesce(s.n, 0)::bigint
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as g(d)
    left join s on s.d = g.d::date
   order by 1;
$$;

-- ─── 5. Doanh thu & đơn hàng ─────────────────────────────────────────────────
create or replace function public.admin_revenue_by_day(p_from date, p_to date)
returns table (day date, paid_orders bigint, revenue bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with r as (
    select (pm.created_at at time zone 'Asia/Ho_Chi_Minh')::date as d,
           count(*) as n, sum(pm.amount) as total
      from public.payments pm
     where pm.status = 'success' and pm.payos_reference is distinct from 'SIMULATED'
       and (pm.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to
     group by 1
  )
  select g.d::date, coalesce(r.n, 0)::bigint, coalesce(r.total, 0)::bigint
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as g(d)
    left join r on r.d = g.d::date
   order by 1;
$$;

-- Mọi trạng thái (pending/success/failed), trừ đơn giả lập. Email lấy qua identity Google và đã che;
-- không trả google_id, mã đơn hay mã giao dịch.
create or replace function public.admin_recent_orders(p_limit int)
returns table (
  created_at timestamptz,
  plan text,
  amount int,
  status text,
  signup_source text,
  email_masked text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select pm.created_at, pm.plan, pm.amount, pm.status, pm.signup_source,
         public.admin_mask_email((
           select u.email
             from auth.identities i
             join auth.users u on u.id = i.user_id
            where i.provider = 'google' and i.provider_id = pm.google_id
            limit 1
         ))
    from public.payments pm
   where pm.payos_reference is distinct from 'SIMULATED'
   order by pm.created_at desc
   limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- ─── 6. Sử dụng AI ───────────────────────────────────────────────────────────
-- Giới hạn truyền từ backend (hằng số trong server.js) để không chép số vào SQL.
-- ocr_users_at_limit: trạng thái Premium lấy theo HIỆN TẠI, không phải ngày hôm đó (gần đúng).
create or replace function public.admin_usage_by_day(
  p_from date, p_to date, p_ai_limit int, p_ocr_free_limit int, p_ocr_premium_limit int
)
returns table (
  day date,
  ai_free_turns bigint,
  ai_premium_turns bigint,
  ai_users_at_limit bigint,
  ocr_scans bigint,
  ocr_users_at_limit bigint,
  ai_quota_exceeded bigint,
  ai_busy bigint,
  ocr_quota_exceeded bigint,
  ocr_rate_limited bigint,
  chat_ip_limited bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with a as (
    select a.usage_date as d, sum(a.count) as turns,
           count(*) filter (where a.count >= p_ai_limit) as at_limit
      from public.ai_usage_daily a
     where a.usage_date between p_from and p_to
     group by 1
  ),
  o as (
    select o.usage_date as d, sum(o.count) as scans,
           count(*) filter (where o.count >= case
             when pu.is_premium and (pu.premium_expiry is null or pu.premium_expiry > now())
               then p_ocr_premium_limit else p_ocr_free_limit end) as at_limit
      from public.ocr_usage_daily o
      left join public.users pu on pu.google_id = o.google_id
     where o.usage_date between p_from and p_to
     group by 1
  ),
  e as (
    select e.day as d,
           sum(e.count) filter (where e.metric = 'ai_premium_turn') as ai_premium_turn,
           sum(e.count) filter (where e.metric = 'ai_quota_exceeded') as ai_quota_exceeded,
           sum(e.count) filter (where e.metric = 'ai_busy') as ai_busy,
           sum(e.count) filter (where e.metric = 'ocr_quota_exceeded') as ocr_quota_exceeded,
           sum(e.count) filter (where e.metric = 'ocr_rate_limited') as ocr_rate_limited,
           sum(e.count) filter (where e.metric = 'chat_ip_limited') as chat_ip_limited
      from public.usage_events_daily e
     where e.day between p_from and p_to
     group by 1
  )
  select g.d::date,
         coalesce(a.turns, 0)::bigint,
         coalesce(e.ai_premium_turn, 0)::bigint,
         coalesce(a.at_limit, 0)::bigint,
         coalesce(o.scans, 0)::bigint,
         coalesce(o.at_limit, 0)::bigint,
         coalesce(e.ai_quota_exceeded, 0)::bigint,
         coalesce(e.ai_busy, 0)::bigint,
         coalesce(e.ocr_quota_exceeded, 0)::bigint,
         coalesce(e.ocr_rate_limited, 0)::bigint,
         coalesce(e.chat_ip_limited, 0)::bigint
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as g(d)
    left join a on a.d = g.d::date
    left join o on o.d = g.d::date
    left join e on e.d = g.d::date
   order by 1;
$$;

-- ─── 7. Quyền: chỉ service_role được EXECUTE ─────────────────────────────────
-- Supabase mặc định cấp EXECUTE trên hàm mới cho anon và authenticated — phải thu hồi tường minh.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.bump_usage_metric(text)',
    'public.admin_mask_email(text)',
    'public.admin_overview(date, date)',
    'public.admin_user_totals()',
    'public.admin_signups_by_day(date, date)',
    'public.admin_revenue_by_day(date, date)',
    'public.admin_recent_orders(int)',
    'public.admin_usage_by_day(date, date, int, int, int)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('revoke execute on function %s from anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;

-- ─── Kiểm tra sau khi chạy (mỗi cột có alias riêng) ──────────────────────────
-- (a) Bảng usage_events_daily: RLS bật (rls_on = true), không policy (policy_count = 0):
--   select (select relrowsecurity from pg_class where relname = 'usage_events_daily') as rls_on,
--          (select count(*) from pg_policies where tablename = 'usage_events_daily') as policy_count;
--
-- (b) Không ai có quyền trực tiếp trên bảng — cả 6 cột false:
--   select has_table_privilege('anon', 'public.usage_events_daily', 'select') as anon_select,
--          has_table_privilege('authenticated', 'public.usage_events_daily', 'select') as auth_select,
--          has_table_privilege('service_role', 'public.usage_events_daily', 'select') as sr_select,
--          has_table_privilege('service_role', 'public.usage_events_daily', 'insert') as sr_insert,
--          has_table_privilege('service_role', 'public.usage_events_daily', 'update') as sr_update,
--          has_table_privilege('service_role', 'public.usage_events_daily', 'delete') as sr_delete;
--
-- (c) anon/authenticated KHÔNG gọi được hàm nào (mọi cột false), service_role gọi được (mọi cột true):
--   select f.sig as function_sig,
--          has_function_privilege('anon', f.sig, 'execute') as anon_exec,
--          has_function_privilege('authenticated', f.sig, 'execute') as auth_exec,
--          has_function_privilege('service_role', f.sig, 'execute') as service_exec
--     from unnest(array[
--       'public.bump_usage_metric(text)', 'public.admin_mask_email(text)',
--       'public.admin_overview(date, date)', 'public.admin_user_totals()',
--       'public.admin_signups_by_day(date, date)', 'public.admin_revenue_by_day(date, date)',
--       'public.admin_recent_orders(int)', 'public.admin_usage_by_day(date, date, int, int, int)'
--     ]) as f(sig);
--
-- (d) Hàm security definer đều có search_path cố định (8 dòng, search_path_config khác null):
--   select p.proname as function_name, p.prosecdef as is_definer, p.proconfig as search_path_config
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and p.proname in ('bump_usage_metric', 'admin_mask_email', 'admin_overview', 'admin_user_totals',
--                        'admin_signups_by_day', 'admin_revenue_by_day', 'admin_recent_orders',
--                        'admin_usage_by_day');
--
-- (e) Che email đúng dạng:
--   select public.admin_mask_email('andrew@gmail.com') as mask_long,     -- an***@gmail.com
--          public.admin_mask_email('ab@gmail.com') as mask_short,        -- a***@gmail.com
--          public.admin_mask_email(null) as mask_null,                   -- NULL
--          public.admin_mask_email('no-at-sign') as mask_invalid;        -- NULL
--
-- (f) Các hàm chạy được, chỉ trả số tổng hợp:
--   select * from public.admin_overview(current_date - 6, current_date);
--   select * from public.admin_user_totals();
--   select count(*) as signup_days from public.admin_signups_by_day(current_date - 6, current_date);  -- 7
--   select count(*) as usage_days from public.admin_usage_by_day(current_date - 6, current_date, 10, 5, 50);  -- 7
--
-- (g) bump_usage_metric từ chối tên chỉ số lạ (báo lỗi vi phạm check constraint, không ghi gì):
--   select public.bump_usage_metric('khong_co');
