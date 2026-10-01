-- =============================================================================
-- 008 — Đồng bộ cài đặt và trạng thái học theo TÀI KHOẢN thay vì theo từng máy
-- =============================================================================
--
-- BỐI CẢNH
-- Một số thứ trước đây chỉ nằm trong localStorage của trình duyệt, nên đăng nhập cùng tài khoản
-- trên máy khác thì mất: chế độ tối (bật trên laptop, điện thoại vẫn sáng), lớp ưu tiên, cài đặt
-- thông báo, cờ đã xem hướng dẫn, danh sách công thức đã xem (dùng cho "Gợi ý hôm nay") và câu
-- trả lời Thử thách hôm nay. Migration này thêm chỗ lưu cho chúng trên dòng learning_stats sẵn có
-- của mỗi tài khoản (một dòng/tài khoản, upsert theo google_id).
--
--   preferences        jsonb  { darkMode, grade, notifPrefs, onboarded }
--   viewed_formula_ids text[] id công thức đã mở, mới nhất trước
--   daily_challenge    jsonb  { date, questionId, selectedLetter, isCorrect, collapsed } — chỉ
--                             giữ bản ghi của ngày gần nhất, ngày khác thì frontend bỏ qua.
--
-- An toàn: learning_stats đã bật RLS với policy "own rows" (003, siết lại ở 006) áp cho MỌI cột
-- của dòng, nên không cần thêm policy hay GRANT nào — chạy lại file này cũng không đổi gì
-- (add column if not exists). Mặc định rỗng/NULL = "chưa từng lưu": frontend khi đó đẩy giá trị
-- đang có ở máy lên, người dùng cũ không bị mất cài đặt.
--
-- Chạy TRƯỚC khi deploy frontend dùng các cột này. Nếu frontend lên trước, app vẫn chạy bình
-- thường (cài đặt vẫn lưu ở máy), chỉ ghi lỗi "Lưu cài đặt thất bại" vào console cho tới khi chạy.
-- =============================================================================

alter table public.learning_stats
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists viewed_formula_ids text[],
  add column if not exists daily_challenge jsonb;

-- Kiểm tra: phải ra 3 dòng
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'learning_stats'
--      and column_name in ('preferences', 'viewed_formula_ids', 'daily_challenge');
