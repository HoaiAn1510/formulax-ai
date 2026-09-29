-- =============================================================================
-- 006 ROLLBACK — Khôi phục trạng thái trước migration 006
-- =============================================================================
-- Chạy file này nếu cần lùi migration 006: xoá bảng/hàm mới thêm, khôi phục policy
-- "own rows" / "read own user row" về đúng bản 005 (không có điều kiện `is not null` tường
-- minh — hành vi thực tế giống hệt vì NULL = NULL vẫn luôn false, rollback này chỉ để đối xứng
-- code, không có khác biệt bảo mật).
--
-- KHÔNG rollback code frontend/backend bằng file SQL này — chỉ lùi phần database. Nếu code đã
-- deploy vẫn gọi RPC increment_ai_usage/get_ai_usage hoặc đọc điều kiện policy mới, phải revert
-- code trước hoặc đồng thời, nếu không /api/chat sẽ lỗi vì hàm RPC không còn tồn tại.
-- =============================================================================

-- ─── 1. Khôi phục policy "own rows" / "read own user row" về bản 005 ─────────
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
      continue;
    end if;

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

drop policy if exists "read own user row" on public.users;
create policy "read own user row" on public.users
  for select
  to authenticated
  using (google_id = public.current_google_id());

-- ─── 2. Xoá bảng + hàm mới của 006 ────────────────────────────────────────────
drop function if exists public.increment_ai_usage(text);
drop function if exists public.get_ai_usage(text);
drop table if exists public.ai_usage_daily;

-- ─── 3. Kiểm tra sau khi chạy ─────────────────────────────────────────────────
--   select tablename, policyname, qual from pg_policies
--    where schemaname='public' and policyname in ('own rows','read own user row');
--   -- qual phải KHÔNG còn chứa "is not null"
--   select to_regclass('public.ai_usage_daily'); -- phải trả về NULL (bảng đã xoá)
