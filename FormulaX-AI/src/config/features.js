// Cờ bật/tắt tính năng ở frontend. Tắt cờ chỉ ẩn lối vào trên giao diện — code phía sau vẫn giữ
// nguyên để bật lại bằng cách đổi giá trị ở đây.

// Nút chụp/chọn ảnh đề trong ô nhập AI Finder → POST /api/ocr (Gemini đọc ảnh) → màn "Các bài
// trong ảnh" → hướng dẫn từng bài. Bật từ 2026-10-07 (trước đó là nút giả lập, đã ẩn từ 2026-10-02).
// Backend cần migration 009 (ocr_usage_daily) và GEMINI_API_KEY trước khi bật trên production.
export const FINDER_IMAGE_INPUT_ENABLED = true;

// Dòng thông báo hiện ngay trước khi học sinh chụp/chọn ảnh. Đang dùng gói Gemini MIỄN PHÍ: theo
// điều khoản của Google, nội dung gửi qua gói miễn phí có thể được dùng để cải thiện dịch vụ — phải
// nói thật điều đó. Khi đã bật thanh toán cho key Gemini (gói trả phí không dùng dữ liệu để cải
// thiện sản phẩm), đổi câu này, ví dụ bỏ câu giữa.
export const OCR_PRIVACY_NOTICE =
  "Ảnh được gửi tới dịch vụ AI của Google để đọc đề. Ở giai đoạn thử nghiệm, Google có thể dùng ảnh để cải thiện dịch vụ, nên chỉ chụp phần đề bài, tránh chụp tên, khuôn mặt hay bài làm.";
