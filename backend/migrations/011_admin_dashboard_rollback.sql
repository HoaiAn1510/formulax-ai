-- =============================================================================
-- 011 ROLLBACK — Xoá trang quản trị + bộ đếm sự kiện sử dụng
-- =============================================================================
-- Revert backend (/api/admin/*, bump_usage_metric) TRƯỚC hoặc cùng lúc. Nếu backend mới vẫn chạy:
-- trang quản trị báo lỗi (503), bump_usage_metric lỗi im lặng — request của học sinh không ảnh hưởng.
-- MẤT DỮ LIỆU: toàn bộ số đếm sự kiện theo ngày. Không đụng bảng nào khác.
drop function if exists public.admin_usage_by_day(date, date, int, int, int);
drop function if exists public.admin_recent_orders(int);
drop function if exists public.admin_revenue_by_day(date, date);
drop function if exists public.admin_signups_by_day(date, date);
drop function if exists public.admin_user_totals();
drop function if exists public.admin_overview(date, date);
drop function if exists public.admin_mask_email(text);
drop function if exists public.bump_usage_metric(text);
drop table if exists public.usage_events_daily;

-- Kiểm tra: mọi cột NULL
--   select to_regclass('public.usage_events_daily') as tbl_usage_events,
--          to_regprocedure('public.bump_usage_metric(text)') as fn_bump,
--          to_regprocedure('public.admin_mask_email(text)') as fn_mask,
--          to_regprocedure('public.admin_overview(date, date)') as fn_overview,
--          to_regprocedure('public.admin_user_totals()') as fn_user_totals,
--          to_regprocedure('public.admin_signups_by_day(date, date)') as fn_signups,
--          to_regprocedure('public.admin_revenue_by_day(date, date)') as fn_revenue,
--          to_regprocedure('public.admin_recent_orders(int)') as fn_orders,
--          to_regprocedure('public.admin_usage_by_day(date, date, int, int, int)') as fn_usage;
