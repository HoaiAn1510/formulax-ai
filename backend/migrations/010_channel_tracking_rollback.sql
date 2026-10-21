-- =============================================================================
-- 010 ROLLBACK — Xoá theo dõi kênh giới thiệu
-- =============================================================================
-- Revert backend (/api/track/*, /api/admin/channel-stats, signup_source ở /payos/create) TRƯỚC
-- hoặc cùng lúc. Nếu backend cũ vẫn chạy: /api/track/* lỗi im lặng, channel-stats trả 503, tạo
-- đơn vẫn chạy (chỉ ghi signup_source khi đọc được nguồn — bảng mất thì không đọc được).
--
-- MẤT DỮ LIỆU: toàn bộ lượt truy cập, nguồn đăng ký và nguồn ghi trên đơn hàng. Đơn hàng và
-- trạng thái Premium không bị ảnh hưởng.
drop function if exists public.channel_stats(date, date);
drop table if exists public.channel_visits;
drop table if exists public.user_acquisition;
alter table public.payments drop column if exists signup_source;

-- Kiểm tra: 3 cột đầu NULL, cột cuối 0
--   select to_regprocedure('public.channel_stats(date, date)'),
--          to_regclass('public.channel_visits'),
--          to_regclass('public.user_acquisition'),
--          (select count(*) from information_schema.columns
--            where table_schema = 'public' and table_name = 'payments' and column_name = 'signup_source');
