-- =============================================================================
-- 008 ROLLBACK — Bỏ 3 cột đồng bộ cài đặt theo tài khoản
-- =============================================================================
-- Revert frontend TRƯỚC: frontend cũ không đọc các cột này nên không bị ảnh hưởng, còn frontend
-- mới sẽ ghi lỗi mỗi lần lưu cài đặt nếu cột đã mất. Xoá cột là mất luôn cài đặt đã đồng bộ;
-- mỗi máy vẫn còn bản cũ trong localStorage.
alter table public.learning_stats
  drop column if exists preferences,
  drop column if exists viewed_formula_ids,
  drop column if exists daily_challenge;

-- Kiểm tra: phải ra 0 dòng
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'learning_stats'
--      and column_name in ('preferences', 'viewed_formula_ids', 'daily_challenge');
