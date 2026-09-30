-- =============================================================================
-- 007 — Hoàn lượt AI Finder khi đã tăng bộ đếm nhưng không giao được câu trả lời
-- =============================================================================
--
-- BỐI CẢNH
-- Backend tăng bộ đếm (increment_ai_usage, migration 006) TRƯỚC khi gọi Groq để không có khoảng
-- hở race condition. Hàm dưới đây trả lại lượt đó trong MỌI trường hợp đã tăng nhưng học sinh
-- không nhận được câu trả lời thật: bị chặn vì vượt hạn mức, Groq trả 429 (gói miễn phí giới
-- hạn 8.000 token/phút cho cả app), Groq lỗi khác/timeout, hoặc JSON hỏng sau khi đã gọi lại.
-- Mục tiêu: bộ đếm luôn bằng đúng số câu trả lời đã giao.
--
-- An toàn:
--   - Một câu UPDATE duy nhất (nguyên tử), không đọc rồi mới ghi.
--   - Không bao giờ giảm dưới 0 (greatest).
--   - Không có dòng của hôm nay thì không làm gì, trả về 0.
--   - Chỉ service_role (backend) gọi được — revoke tường minh khỏi anon và authenticated, vì
--     Supabase mặc định cấp EXECUTE cho 2 role này trên hàm mới trong schema public. Không có
--     bước này, bất kỳ ai cầm anon key cũng tự hoàn lượt vô hạn cho google_id bất kỳ.
--
-- Trường hợp biên đã chấp nhận: tăng lượt lúc 23:59:59 nhưng việc hoàn lượt chạy sau nửa đêm
-- (giờ Việt Nam) thì hàm tìm dòng của ngày MỚI — lượt hôm trước không được hoàn. Ảnh hưởng tối
-- đa 1 lượt, và ngày mới đằng nào cũng đã reset.
--
-- Chạy SAU 006 và TRƯỚC khi deploy backend có gọi hàm này.
-- =============================================================================

create or replace function public.refund_ai_usage(p_google_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.ai_usage_daily
     set count = greatest(count - 1, 0),
         updated_at = now()
   where google_id = p_google_id
     and usage_date = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  returning count into v_count;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.refund_ai_usage(text) from public;
revoke execute on function public.refund_ai_usage(text) from anon, authenticated;
grant execute on function public.refund_ai_usage(text) to service_role;

-- ─── Kiểm tra sau khi chạy ────────────────────────────────────────────────────
-- (a) anon/authenticated KHÔNG được EXECUTE — cả 2 dòng phải là false:
--   select has_function_privilege('anon', 'public.refund_ai_usage(text)', 'execute'),
--          has_function_privilege('authenticated', 'public.refund_ai_usage(text)', 'execute');
--
-- (b) Thử tăng rồi hoàn (SQL Editor chạy với quyền đủ mạnh):
--   select public.increment_ai_usage('test-google-id');  -- 1
--   select public.increment_ai_usage('test-google-id');  -- 2
--   select public.refund_ai_usage('test-google-id');     -- 1
--   select public.refund_ai_usage('test-google-id');     -- 0
--   select public.refund_ai_usage('test-google-id');     -- 0 (không xuống âm)
--   select public.refund_ai_usage('khong-co-dong-nao');  -- 0 (không có dòng hôm nay)
--   delete from public.ai_usage_daily where google_id = 'test-google-id';
