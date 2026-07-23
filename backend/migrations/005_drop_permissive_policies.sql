-- =============================================================================
-- 005 — Dọn policy cũ quá dễ dãi, RLS mới thực sự có tác dụng
-- =============================================================================
--
-- TRIỆU CHỨNG PHÁT HIỆN ĐƯỢC
-- Sau 003 + 004, gọi REST API bằng anon key vẫn đọc được dữ liệu thật ở 8 bảng: users,
-- bookmarks, user_notes, learning_stats, search_history, quiz_daily, flashcard_progress,
-- notifications. Trong khi quiz_results, flashcard_activity, flashcard_decks, chat_sessions
-- đã trả về 0 dòng đúng như mong đợi.
--
-- NGUYÊN NHÂN
-- RLS chỉ chặn khi KHÔNG có policy nào khớp. Các bảng trên có sẵn policy cũ kiểu
-- "Enable read access for all users" (USING (true)) — tạo từ trước bằng dashboard, hồi đó RLS
-- còn tắt nên không ai thấy hậu quả. Bật RLS lên là chúng có hiệu lực và mở cửa cho anon.
-- Nhiều policy trên cùng một bảng được OR với nhau, nên chỉ cần MỘT policy dễ dãi là hỏng cả.
--
-- File này xoá mọi policy trừ hai policy chủ đích của app, rồi tạo lại cho chắc.
-- =============================================================================

-- ─── 1. Xoá mọi policy không phải của app ────────────────────────────────────
do $$
declare
  r record;
  app_tables text[] := array[
    'users','bookmarks','user_notes','learning_stats','search_history','quiz_daily',
    'quiz_results','flashcard_activity','flashcard_decks','flashcard_progress',
    'chat_sessions','notifications','payments'
  ];
begin
  for r in
    select tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = any(app_tables)
       and policyname not in ('own rows', 'read own user row')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
    raise notice 'Đã xoá policy dư: "%" trên bảng %', r.policyname, r.tablename;
  end loop;
end $$;

-- ─── 2. Bảo đảm RLS bật + policy đúng tồn tại trên các bảng dữ liệu người dùng ─
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

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format($f$
      create policy "own rows" on public.%I
        for all
        to authenticated
        using (google_id = public.current_google_id())
        with check (google_id = public.current_google_id())
    $f$, t);
  end loop;
end $$;

-- ─── 3. users: chỉ đọc dòng của chính mình ───────────────────────────────────
alter table public.users enable row level security;
drop policy if exists "read own user row" on public.users;
create policy "read own user row" on public.users
  for select
  to authenticated
  using (google_id = public.current_google_id());

-- ─── 4. payments: bật RLS, không policy nào = client không đụng được ─────────
alter table public.payments enable row level security;

-- ─── 5. Bảng chạy xong trả về để đối chiếu ───────────────────────────────────
-- Kỳ vọng: mọi bảng rls_bat = true; cột policies chỉ chứa 'own rows'
-- (hoặc 'read own user row' với users, và rỗng với payments).
select
  c.relname                                as bang,
  c.relrowsecurity                         as rls_bat,
  coalesce(string_agg(p.policyname, ', '), '(khong co)') as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;
