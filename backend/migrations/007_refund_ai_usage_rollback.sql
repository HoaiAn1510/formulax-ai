-- =============================================================================
-- 007 ROLLBACK — Xoá hàm hoàn lượt AI Finder
-- =============================================================================
-- Revert code backend gọi refund_ai_usage TRƯỚC (hoặc cùng lúc), nếu không mọi nhánh hoàn lượt
-- sẽ gặp lỗi gọi RPC không tồn tại. DROP FUNCTION tự thu hồi mọi quyền EXECUTE đã cấp.
drop function if exists public.refund_ai_usage(text);

-- Kiểm tra: phải trả về NULL
--   select to_regprocedure('public.refund_ai_usage(text)');
