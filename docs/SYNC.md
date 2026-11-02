# Đồng bộ nhiều thiết bị

> Chuyển nguyên văn từ `CLAUDE.md` (mục cùng tên) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Đồng bộ nhiều thiết bị (từ 2026-10-01)

Mọi dữ liệu của tài khoản Google phải nằm trên Supabase; `localStorage` chỉ được dùng làm bộ đệm
(vẽ đúng ngay lúc mở app) hoặc cho khách. Khi thêm cài đặt/trạng thái mới, KHÔNG lưu chỉ ở máy.
- Cài đặt `{ darkMode, grade, notifPrefs, onboarded }` → cột `learning_stats.preferences` (jsonb,
  migration 008), ghi nguyên object qua `syncPreferences()` trong `App.jsx`. Thêm cài đặt mới thì
  thêm khoá vào object này. Gộp khi tải: giá trị trên tài khoản thắng, khoá tài khoản chưa có thì
  lấy giá trị ở máy rồi đẩy lên. App hiện lại (`visibilitychange`) thì đọc lại `preferences`.
- Công thức đã xem → `learning_stats.viewed_formula_ids`; Thử thách hôm nay → `daily_challenge`.
- Lịch sử chat: server là nguồn sự thật kể cả khi rỗng — không đẩy bản ở máy lên lại (đã từng làm
  cuộc trò chuyện đã xoá sống lại trên máy khác).
- Còn chỉ ở máy, có chủ đích: lượt Quiz của khách, cờ "đã báo huy hiệu" (`formulax_badges_seen_*`,
  chỉ để không báo toast trùng), cache Premium/tên/thống kê (đều có bản gốc trên server).
- Không dùng khoá localStorage chung cho cả máy cho dữ liệu của tài khoản (`formulax_display_name`
  chung đã làm tài khoản sau nhận nhầm tên của người trước) — luôn gắn `_${googleId}`.
