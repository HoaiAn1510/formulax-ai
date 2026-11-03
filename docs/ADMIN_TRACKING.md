# Theo dõi kênh giới thiệu + Trang quản trị

> Chuyển nguyên văn từ `CLAUDE.md` (hai mục cùng tên) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Theo dõi kênh giới thiệu — báo cáo KPI (từ 2026-10-21)

Link của nhóm `?ref=tiktok`, `?ref=facebook`, `?ref=tiktok-video3` (hoặc `utm_source`).
- **Frontend** (`utils/channelRef.js` hàm thuần, `lib/channelTracking.js` gọi mạng; gọi từ `main.jsx`
  trước khi render và `AuthContext.jsx`): ref làm sạch (chữ thường, `[a-z0-9-]`, ≤ 40, phải bắt đầu bằng chữ/số: `^[a-z0-9][a-z0-9-]{0,39}$` — chặt hơn
  check constraint của DB, chỉ siết ở code), lưu first-touch
  30 ngày ở `formulax_ref` (ref còn hạn KHÔNG bị ghi đè), xoá `ref`/`utm_*` khỏi URL bằng
  `history.replaceState`. Lượt truy cập: ref trong URL, không có thì `direct`, 1 lần/trình duyệt/ref/ngày
  (`formulax_visit_mark`), không đếm lúc Google đăng nhập xong quay về (`?code=`/`#access_token=`).
  Nguồn đăng ký: gửi 1 lần mỗi tài khoản Google (`formulax_signup_tracked_${googleId}`, chỉ đặt khi
  server nhận). Mọi lỗi im lặng.
- **Backend** (`routes/channelTracking.js`, `lib/channelTracking.js`): `POST /api/track/visit` (không cần
  đăng nhập, rate limit IP, visitor_id phải là UUID, luôn 204); `POST /api/track/signup` (khách ẩn danh /
  không có Google identity → 204 không ghi; google_id + `created_at` lấy từ tài khoản đã xác thực; chỉ
  gắn nguồn khi tài khoản tạo ≤ 24 giờ; insert-if-absent, DB không cấp `update`);
  `GET /api/admin/channel-stats?from&to` (nay nằm ở `routes/admin.js` — xem mục Trang quản trị).
  `/payos/create` ghi `payments.signup_source` từ `user_acquisition` — đọc lỗi thì tạo đơn như cũ, không
  bao giờ chặn thanh toán; webhook không đổi.
- Không lưu IP, user agent; không ghi google_id/email vào log. Doanh thu chỉ tính đơn `success`, loại
  đơn giả lập `payos_reference = 'SIMULATED'`. Tài khoản cũ / không có ref = `direct` (nên tỉ lệ
  paid/signups của `direct` có thể > 1). Đổi cách theo dõi thì sửa đoạn "Kênh giới thiệu" ở `LegalModal.jsx`.

## Trang quản trị — chỉ xem số liệu (từ 2026-10-21)

Email trong `ADMIN_EMAILS` (Render) đăng nhập Google → vào thẳng `AdminApp`, không thấy app học sinh.
Không bảng role, không chức năng sửa dữ liệu.
- **Backend** (`routes/admin.js`, middleware `lib/adminAuth.js`): `GET /api/admin/me` → `{ isAdmin }` (thiếu
  token 401; khách / non-admin 200 false). `overview`, `channel-stats`, `users`, `revenue`, `usage`
  (`?from&to` giờ VN): thiếu token 401, non-admin 403. Mọi phép đếm chạy trong DB bằng hàm `admin_*`
  (migration 011, security definer, chỉ service_role EXECUTE) — không đọc dòng thô về backend (PostgREST
  cắt 1000 dòng). Email đơn hàng che trong SQL (`admin_mask_email`) và che lần hai ở backend
  (`maskEmail`, `lib/adminStats.js`); không trả google_id, mã đơn, mã giao dịch.
- **Bộ đếm sự kiện** `usage_events_daily` (`lib/usageMetrics.js`, RPC `bump_usage_metric`): 6 chỉ số
  `ai_premium_turn`, `ai_quota_exceeded`, `ai_busy`, `ocr_quota_exceeded`, `ocr_rate_limited`,
  `chat_ip_limited` — chỉ ngày + tên + số đếm. Gọi CHẠY NGẦM (không await), lỗi bỏ qua: không bao giờ
  làm chậm/hỏng request của học sinh. Thêm chỉ số mới = sửa check constraint (migration mới) + `USAGE_METRICS`.
  Ba bộ giới hạn IP (chat 60/phút, 3.000/ngày; quét ảnh 60/phút — nâng 2026-11-03 từ 12/300/30 vì cả lớp chung một IP) nằm ở `lib/ipLimiters.js`, chỉ thêm `handler` đếm
  số lần bị chặn — `test/ipLimiters.test.js` giữ mã 429, body JSON, header RateLimit/Retry-After như cũ.
- **Frontend** (`RootGate.jsx` trong `main.jsx`): khách / chưa đăng nhập → `<App/>` ngay, không gọi `/me`.
  Tài khoản Google → `<App/>` ngay, `/me` chạy ngầm, true thì chuyển sang `AdminApp` (`React.lazy`,
  `src/admin/`). Dấu `formulax_admin_hint_${googleId}` (`utils/adminHint.js`) CHỈ để máy của admin hiện màn
  hình tải chờ `/me` tối đa 10 giây (Render có thể đang ngủ) — không phải căn cứ phân quyền; `/me` true
  ghi dấu, false xoá. Không ghi email admin trong frontend. AdminApp chỉ có giao diện sáng (gỡ class
  `dark-mode` khi mở), tên tài khoản + Đăng xuất, không có nút sang app học sinh.
- **So sánh kỳ trước** (từ 2026-10-22): backend gọi lại CHÍNH các hàm `admin_*` với kỳ liền trước cùng độ dài
  (`previousRange`, `lib/adminStats.js`) — không có hàm SQL riêng. Tổng tài khoản tích luỹ suy từ tổng hiện tại
  trừ số tạo từ đầu kỳ tới hôm nay (`cumulativeAccounts`).
- **Giao diện** (`src/admin/`): hàm thuần ở `adminFormat.js` (so sánh %, trục biểu đồ, CSV có BOM + ô chữ bắt đầu
  bằng = + - @ tab CR được thêm dấu ' để Excel không chạy công thức, gom kênh theo phần trước dấu "-" đầu tiên,
  `fb` = facebook) và `adminRange.js` — test bằng `npm run test:admin`. Biểu đồ tự vẽ SVG ở `charts.jsx` — không
  thêm thư viện biểu đồ (chunk admin phải nhẹ). Hằng số màu/focus ở `adminStyle.js` (file `.jsx` chỉ export
  component — lint react-refresh). Số liệu "càng ít càng tốt" (AI bận) dùng `invertDelta`.
- Premium đang hoạt động tính cả tài khoản cấp tay không thời hạn (`premium_expiry` null); "chạm giới hạn
  quét" dùng trạng thái Premium hiện tại (gần đúng). Lượt AI của Premium chỉ có từ khi chạy migration 011.
