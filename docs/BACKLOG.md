# Việc sau (backlog)

> Chuyển nguyên văn từ `CLAUDE.md` (mục Việc sau) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Việc sau

- **AI Finder — bảng biến thiên dạng bảng thật:** hiện AI viết bảng biến thiên thành một dòng biểu thức
  mũi tên (`x: -\infty \rightarrow x_I \rightarrow +\infty ;\; y: \uparrow y_I \downarrow`, chạy thật
  2026-10-08). Cần một dạng dữ liệu riêng cho bước "bảng biến thiên" để frontend vẽ bảng thật.
- **AI Finder — không hỏi lại cùng một ô `?` ở nhiều bước:** cùng lần chạy đó, `y_I = ?` được hỏi ở
  bước tìm đỉnh rồi hỏi lại ở bước lập bảng; lần sau `\Delta = ?` lặp lại trong biểu thức bước sau.
  Các bước sau nên gọi kết quả bằng ký hiệu (`y_I`, `\Delta`).

**AI Finder tạm dừng chỉnh từ 2026-10-08 (trước đợt lớp 10 dùng thử).** Các điểm chưa đẹp còn lại:
- **Thẻ `hh10-parabola`:** phần giải thích ghi "đỉnh là cực tiểu / cực đại" (thuật ngữ lớp 12). CHƯA
  sửa — chờ nhóm gửi nguyên văn SGK Toán 10 KNTT Bài 16. Thẻ này, `ds10-phuongtrinh-bac2`,
  `ds10-bpt-bac2` còn thiếu `sgk_source`.
- **Thư viện thiếu (chờ đối chiếu SGK giấy, KHÔNG tự thêm):** độ dài đường trung tuyến (chưa chắc có
  trong lý thuyết KNTT 10), giao điểm parabol với trục tung `(0; c)`.
- **3 công thức Hệ thức lượng thêm 2026-10-22 (chủ dự án yêu cầu):** `hh10-bankinh-noitiep` (r = S/p),
  `hh10-bankinh-ngoaitiep` (R = abc/(4S)), `hh10-hequa-cosin` (cos A = (b² + c² − a²)/(2bc)). `sgk_source` mới
  chỉ ghi tới cấp chương ("Chương III Hệ thức lượng trong tam giác, không gắn bài cụ thể") — CHƯA đối chiếu
  được số bài/trang trong SGK giấy; khi có thì sửa lại. Chưa chấm bằng AI thật (key chấm hết hạn mức ngày).
  Lưu ý: công thức S = abc/(4R) và S = pr của audit là dạng viết khác của hai công thức này (r = S/p,
  R = abc/(4S)). Đề cần "S" ra trước: thẻ Hê-rông đã được thêm tags "Bán kính nội tiếp/ngoại tiếp" (xem "Đợt 2 /
  Phase 3") để vào được 8 ứng viên; chưa chạy bằng AI thật. `shortlist-coverage.mjs` hiện 19/20: ca "gõ tay 8" ("ΔABC
  vuông tại A có AB = 3, AC = 4, tính bán kính đường tròn ngoại tiếp") mất `hh10-cosin` khỏi top 8 vì thẻ R = abc/(4S)
  mới đứng #1 — tiêu chí của ca này (anyOf `hh10-cosin`) có vẻ lỗi thời, CHƯA sửa chờ chủ dự án quyết.
- **Đề lớp 10 về hàm bậc hai:** công thức đạo hàm vẫn ở vị trí #4 trong 10 ứng viên (qua từ khoá
  "đồng biến"); AI không dùng nhờ quy tắc 1d nhưng chưa loại khỏi danh sách (đã quyết định không tăng
  mức trừ điểm).
- **Câu trả lời bảng biến thiên đôi khi bỏ bước nêu khoảng đồng biến / nghịch biến** (chạy thật
  2026-10-08, lần thứ ba) — chỉ còn "tìm đỉnh" rồi "lập bảng".
- **Ô chat gõ tay:** "AI đang bận" chưa có đếm ngược / tự hỏi lại như tab bài từ ảnh.
- **Bộ lọc "không tính":** hằng số tính ra trùng số trong đề vẫn lọt, trừ đại lượng đề hỏi dạng tên
  đoạn/góc viết hoa (`askedTargets`); giá trị lượng giác đã thay (`\frac{1}{2}` thay `\cos 60^\circ`)
  chỉ được prompt chặn.
- **Dữ kiện vô lý ngoài bất đẳng thức tam giác** (việc riêng, chưa làm — 2026-10-22): tổng các góc
  ≥ 180° / một góc ≥ 180°, độ dài cạnh âm hoặc bằng 0, sin/cos > 1. Hiện AI vẫn hướng dẫn bình thường
  hoặc trả `no_formula`; `invalid_data` mới chỉ nhận ba cạnh tam giác. (Chạy thật 2026-10-22: sin α = 1,2 vẫn
  được hướng dẫn tiếp.) Riêng lời giải kiến thức nền có hai góc cho trước cộng ≥ 180° thì giữ `no_formula`.
- **Kiến thức nền — chưa mở rộng (chủ dự án chốt giữ nghiêm, 2026-10-22):** tam giác cân/đều ("hai góc đáy
  bằng nhau", ba góc 60°), Pytago đảo ("có phải tam giác vuông không?"), góc phụ (90° − B) vẫn trả `no_formula`
  vì ngoài ba điều đã duyệt. Mở rộng phải hỏi chủ dự án, thêm mẫu vào `checkBaseKnowledge` + test.
- **Kiến thức nền — bất đẳng thức tam giác viết bằng số:** AI viết `3 + 4 > 5, 4 + 5 > 3, …` (ghi sẵn đáp án
  "có"); bộ lọc "không tính" loại đúng — bước bị thay bằng bước trung tính ("Áp dụng vào dữ kiện…"), câu trả lời
  vẫn là `solution`. Muốn đẹp hơn: dặn prompt viết dạng ký hiệu `a + b > c, \text{ với } a = 3, …` — đổi prompt thì
  chấm lại bằng key chấm (đừng nới bộ lọc).
- **Ghi chú công thức gửi AI cắt còn 100 ký tự:** đã đưa quan hệ chính lên đầu ở
  `ds10-phuongtrinh-bac2`, `ds10-bpt-bac2`, `mr-elip` (2026-10-23). Đã chấm thật câu 18 và 25;
  các ca còn lại theo kế hoạch key chấm ở mục AI Finder. Chưa kết luận chất lượng trên toàn bộ dạng bài.
- **Câu khẳng định dấu Δ — thử đổi VÍ DỤ 2** (`lib/finderPrompt.js`): "Nếu Δ > 0 thì phương trình có hai
  nghiệm phân biệt" → "Sau khi tính Δ, bạn xét dấu Δ rồi chọn công thức nghiệm". Chạy 100 lượt 2026-10-30:
  cụm khẳng định dấu Δ giảm 16 → 4, nhưng 3 chỉ số phụ lệch nhẹ ở ca 16/17 (có thể là nhiễu). Chưa chạy phép
  đo xác nhận, chưa đổi prompt.
- **Bài thống kê — nhãn số liệu bị bắt nhầm:** AI viết `x_1 = 1,5, x_2 = 2, …` để đặt tên số liệu, bộ lọc coi là
  lộ nghiệm (ca chấm 23). Cần ngoại lệ hẹp; phải hỏi chủ dự án trước khi làm.

- **OCR — trường `occlusions` (sau đợt cho học sinh lớp 10 dùng thử):** yêu cầu Gemini liệt kê vật
  che lên vùng chữ (bút, tay, bóng); backend đánh dấu bài có `occlusions` khác rỗng là cần kiểm tra.
  Lý do: quy tắc 5 v2 không làm model đánh `[?]` cho số bị che (ảnh 04, 2026-10-08), dù model có nhận
  ra cây bút. Phải chấm lại trên cả 4 ảnh thử trước khi dùng.

- **Gia hạn khi còn Premium — ngày hết hạn hiển thị có thể là ngày cũ** cho tới lần tải sau
  (2026-10-02). Sau khi payOS trả về `payment=success`, `PremiumUpgrade.jsx` kiểm tra lại trạng
  thái qua `checkPremiumStatus` (mỗi 3 giây, tối đa 10 lần); tài khoản đang còn hạn thì lần kiểm tra
  đầu đã thấy Premium nên báo thành công ngay, có thể trước khi webhook cộng thêm hạn. Client không
  đọc được bảng `payments` (RLS), nên cần **endpoint backend đọc trạng thái đơn hàng theo
  `orderId`** (xác thực người dùng, chỉ trả đơn của chính họ) để chờ đúng đơn vừa thanh toán.
