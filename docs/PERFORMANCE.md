# Hiệu năng tải trang — FormulaX AI

Yêu cầu phi chức năng về tốc độ. Cập nhật lần cuối: 2026-07-23.

---

## 1. Hiện trạng trước khi tối ưu

Đo trên bản build production (`npm run build`), kích thước sau gzip là con số người dùng thực
sự phải tải:

| Tệp | Raw | Gzip | Ghi chú |
|---|---|---|---|
| `index.js` | 1.315 KB | **335 KB** | một chunk duy nhất: 9 view + `formulas.js` + `questions.js` + React + Supabase |
| `index.css` | 122 KB | 20 KB | |
| `PremiumGem3D.js` | 979 KB | 264 KB | three.js, đã tách sẵn từ trước |
| **Chặn hiển thị** | | **≈ 356 KB** | |

Ba vấn đề chính:

1. **Không tách chunk.** Một học sinh chỉ mở Dashboard vẫn phải tải toàn bộ `questions.js`
   (356 KB nguồn — ngân hàng câu hỏi cho phần Luyện đề) và cả 9 view.
2. **KaTeX chặn render.** `index.html` nạp `katex.min.js` bằng thẻ `<script>` thường; trình
   duyệt phải tải xong ~280 KB JS từ CDN mới phân tích tiếp được HTML.
3. **`public/avatar.png` nặng 588 KB nhưng không được tham chiếu ở bất kỳ đâu** — vẫn deploy
   và vẫn nằm trong precache của service worker.

---

## 2. Đã tối ưu

| Việc | Chi tiết | File |
|---|---|---|
| Tách chunk theo view | 7 view chuyển sang `React.lazy` + `Suspense`. Giữ `Dashboard` và `LoginView` nạp thẳng vì đó là màn hình đầu tiên — lazy hai màn này chỉ thêm một vòng request trước khi vẽ được gì | `src/App.jsx` |
| Tải động dữ liệu công thức | `formulas.js` (410 KB nguồn) không còn `import` tĩnh trong App; tải bằng `import()` ngay khi App mount, Dashboard hiển thị skeleton cho mục "Gợi ý hôm nay" trong lúc chờ | `src/App.jsx`, `src/views/Dashboard.jsx` |
| Hoãn ngân hàng câu hỏi | `questions.js` (356 KB nguồn) chỉ dùng cho Luyện đề và thẻ Thử thách hôm nay. Thẻ này tải động trong `requestIdleCallback` để không tranh băng thông với `formulas` | `src/components/DailyChallengeCard.jsx` |
| Tách vendor | `react-vendor` và `supabase` thành chunk riêng — deploy code app không làm mất cache của thư viện | `vite.config.js` |
| KaTeX không chặn render | Thêm `defer` cho 2 script KaTeX + `preconnect` tới jsDelivr. `MathElement` có cơ chế chờ và render bù nếu CDN về chậm, thay vì mất công thức vĩnh viễn | `index.html`, `src/utils/katexHelper.jsx` |
| Bỏ 3D khỏi precache | `PremiumGem3D` (264 KB gzip) chỉ là hiệu ứng trang trí ở màn Premium, chuyển từ precache sang `StaleWhileRevalidate` | `vite.config.js` |
| Xoá tài nguyên chết | `public/avatar.png` 588 KB | — |
| Nén phía backend | `compression()` cho response API — câu trả lời AI 2–6 KB text/LaTeX nén còn khoảng 1/3 | `backend/server.js` |

### Kết quả

| Chỉ số | Trước | Sau | Thay đổi |
|---|---|---|---|
| JS + CSS chặn hiển thị | 356 KB gzip | **156 KB gzip** | **−56%** |
| Trong đó | 1 chunk 335 KB | `index` 26 + `react-vendor` 59 + `supabase` 51 + CSS 21 | |
| Tải sau khi đã vẽ xong | — | `formulas` 101 KB, `questions` 65 KB (lúc rảnh) | không chặn |
| Chunk mỗi view | nằm trong bundle chính | 3–8 KB gzip, tải khi mở tab | |
| Service worker precache | 2.375 KB | **1.419 KB** | −40% |
| Script chặn parse HTML | 2 (KaTeX) | 0 | |

Đo thực tế bằng Chrome headless, giả lập **Slow 3G (400 Kbps, RTT 400 ms) + CPU chậm gấp 4**:

```
First Contentful Paint : 1.460 ms
DOMContentLoaded       : 1.148 ms
formulas chunk về      : 1.854 ms
questions chunk về     : 2.873 ms  (hoãn có chủ đích tới lúc rảnh)
Dashboard hiển thị đủ  : ~3.000 ms
```

Đã kiểm tra cả 7 view (Dashboard, Thư viện, Finder AI, Flashcard, Luyện đề, Tài khoản,
Premium) tải chunk và render bình thường, **không có lỗi console**. Số lỗi ESLint không đổi so
với trước khi sửa (57 vấn đề, đều là import thừa có sẵn từ trước).

---

## 3. Việc tiếp theo, xếp theo mức đáng làm

1. **Bỏ màn chờ chặn toàn trang khi tải dữ liệu người dùng.** Đây hiện là nút thắt lớn nhất
   của cảm nhận tốc độ: ảnh chụp ở mốc 1.5 giây trên Slow 3G cho thấy người dùng vẫn đang nhìn
   spinner "Đang tải dữ liệu của bạn…" (`isLoadingData` trong `App.jsx`) chứ không phải chờ
   bundle. Nếu vẽ luôn khung Dashboard rồi điền số liệu sau, thời gian thấy nội dung đầu tiên
   giảm khoảng 1 giây. Đánh đổi: các ô thống kê hiện 0 trong thoáng chốc rồi mới nhảy sang số
   thật — cần quyết định về mặt trải nghiệm.
2. **Tách `formulas.js` thành phần nhẹ + phần chi tiết.** Hiện mỗi lần tải là cả 246 công thức
   kèm `explanation`/`example` (~101 KB gzip), trong khi màn danh sách chỉ cần `id`, `name`,
   `topic`, `grade`, `latex`. Tách ra có thể giảm còn khoảng 1/3, phần chi tiết tải khi mở
   modal. Lưu ý: đây là dữ liệu lõi của USP "chống hallucination", phải làm bằng script sinh
   tự động từ đúng một nguồn, không chép tay.
3. **Giảm `index.css` 122 KB.** `App.css` còn 68 KB CSS của thời chưa dùng Tailwind; dọn dần
   theo tiến độ migrate từng view.
4. **Ảnh PWA icon** `icon-512.png` + `maskable-512.png` ~39 KB, có thể xuất WebP.
