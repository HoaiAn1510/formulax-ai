-- =============================================================================
-- 009 ROLLBACK — Xoá bộ đếm quét ảnh đề
-- =============================================================================
-- Revert / tắt route POST /api/ocr ở backend TRƯỚC (hoặc cùng lúc), nếu không mọi lần quét sẽ
-- lỗi gọi RPC không tồn tại (backend trả 503, fail closed). DROP FUNCTION tự thu hồi quyền.
drop function if exists public.increment_ocr_usage(text);
drop function if exists public.refund_ocr_usage(text);
drop table if exists public.ocr_usage_daily;

-- Kiểm tra: cả 3 phải là NULL
--   select to_regprocedure('public.increment_ocr_usage(text)'),
--          to_regprocedure('public.refund_ocr_usage(text)'),
--          to_regclass('public.ocr_usage_daily');
