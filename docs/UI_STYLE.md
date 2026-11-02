# Giao diện — Navy + Amber

> Chuyển nguyên văn từ `CLAUDE.md` (mục Giao diện) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Giao diện — Navy + Amber Premium SaaS (đang áp dụng, thay cho Glassmorphism cũ)

Từ 2026-07-04, toàn bộ app chuyển từ phong cách Glassmorphism (tím/hồng/kính mờ) sang phong cách SaaS cao cấp tối giản: navy + amber, card trắng phẳng, không gradient tràn lan, không hiệu ứng kính. Mục tiêu cảm giác: premium, đáng tin cậy, chuyên nghiệp — không còn "colorful/playful".

**Bảng màu (khai báo trong `@theme` của `src/index.css`, đồng bộ với `:root` của `src/App.css`):**

| Vai trò | Token | Giá trị |
|---|---|---|
| Primary Navy / Text Primary | `--color-primary` / `--primary` | `#0F172A` |
| Secondary Navy | `--color-navy-secondary` / `--navy-secondary` | `#1E293B` |
| Sidebar | `--color-sidebar` / `--sidebar` | `#16243A` — **cố định**, không đổi theo dark mode toggle |
| Card background | — | `#FFFFFF` |
| Main background | `--bg-main` | `#F8FAFC` |
| Border | `--border-slate` | `#E5E7EB` |
| Text Secondary | `--color-text-muted` / `--text-muted` | `#64748B` |
| Amber Accent (màu nhấn hành động chính) | `--color-accent` / `--accent` | `#D97706` |
| Amber Hover | `--color-accent-hover` / `--accent-hover` | `#B45309` |
| Amber Light | `--color-accent-light` / `--accent-light` | `#FEF3C7` |
| Info (dùng hiếm, không phải màu nhấn chính) | `--color-secondary` / `--secondary` | `#2563EB` |
| Success / Danger / Warning | `--color-success` / `--color-error` / `--color-premium` | `#10B981` / `#EF4444` / `#F59E0B` (không đổi) |

Đặc điểm phong cách:
- **Nền trang:** phẳng `#F8FAFC`, không gradient, không "orb" ánh sáng mờ trang trí phía sau nội dung.
- **Card:** nền trắng đặc (`#FFFFFF`), viền `1px solid #E5E7EB`, bo góc `16px`, shadow rất nhẹ `0 2px 6px rgba(15,23,42,.05)`; hover thì `translateY(-2px)` + shadow đậm hơn một chút. Không dùng `backdrop-filter`/độ trong suốt nữa (utility `glass-card`/`glass-card-sm` trong `index.css` vẫn giữ tên cũ nhưng đã đổi thân CSS sang flat card — không phải "kính" nữa, tên chỉ còn là lịch sử).
- **Gradient amber** chỉ còn dùng ở đúng 2 chỗ: banner Premium và card Premium (`--premium-grad`: `#D97706 → #F59E0B`) — không dùng gradient nhiều màu ở nơi khác.
- **Banner nhấn mạnh (tiến độ học tập...):** nền navy phẳng (`#1E3A5F`/`#1E293B`), không còn gradient tím.
- **Sidebar (`BottomNav.jsx` desktop):** nền navy cố định `#16243A`, chữ nav mặc định `#CBD5E1`, hover `rgba(255,255,255,.08)`, active `#29589C` + chữ trắng — **luôn navy dù app đang ở light hay dark mode** (đây là surface riêng, không theo toggle).
- **Button primary:** nền `--accent` (amber), hover `--accent-hover`, không dùng `filter:brightness()` nữa mà đổi thẳng màu nền lúc hover.
- **Progress bar:** track xám, thanh chạy màu amber. Progress ring (nếu có): navy.
- **Font:** chỉ dùng **Inter** cho toàn bộ hệ thống (đã bỏ Be Vietnam Pro).
- **Dark mode:** toggle qua class `.dark-mode` trên `<html>` (state ở `App.jsx`; lưu theo tài khoản ở `learning_stats.preferences`, `localStorage.formulax_dark` chỉ là bộ đệm của máy + nơi lưu cho khách — xem mục "Đồng bộ nhiều thiết bị") — là tính năng thật đang hoạt động, không phải CSS thừa. **Dark mode GIỮ NGUYÊN không đổi** khi chuyển sang Navy+Amber (quyết định 2026-07-04) — bản thân dark mode vốn đã dùng tông slate-navy riêng (`#0F172A`/`#1E293B`/`#334155`), không xung đột với bảng màu mới nên không cần làm lại. Card kính chuyển sang nền slate đặc (`#1E293B`/`#334155`) thay vì hiệu ứng kính khi ở dark mode — hành vi này không đổi. Bất kỳ view nào migrate sang Tailwind đều phải giữ đúng hành vi dark mode này bằng `dark:` variant, không được bỏ sót.

Quy ước kỹ thuật: dự án đang **chuyển dần từ inline style sang Tailwind CSS v4** (cài qua `@tailwindcss/vite`, cấu hình theo kiểu CSS-first của v4 — token khai báo trong `@theme`/`@utility` ở `src/index.css`, không dùng `tailwind.config.js` kiểu cũ). Giá trị màu chuẩn nằm ở `@theme` trong `src/index.css` + `:root` trong `src/App.css` (file tham khảo cũ `src/styles/theme.js` đã xoá vì không nơi nào import). Khi tạo/sửa view hoặc component:
- Ưu tiên dùng class Tailwind (`className="..."`) thay vì `style={{...}}` cho code mới.
- Các giá trị màu/shadow/radius của phong cách Navy+Amber (xem bảng trên) khai báo dùng chung trong `@theme`/`@utility` ở `src/index.css`, không lặp lại giá trị hex/rgba rải rác trong từng file.
- Nơi nào trước đây dùng xanh dương (`--secondary`/`bg-secondary`/`text-secondary`) làm màu nhấn hành động chính (nút CTA, tab active, focus ring...) thì đổi sang `--accent`/`bg-accent`/`text-accent` (amber) — xanh dương giờ chỉ còn vai trò "Info", dùng rất hiếm.
- File/view nào **chưa migrate** vẫn giữ inline style cũ — không bắt buộc sửa toàn bộ cùng lúc, chuyển dần từng view khi có nhu cầu chỉnh sửa view đó.
- KHÔNG dùng CSS Modules song song với Tailwind — chỉ một cách tiếp cận để tránh lẫn lộn quy ước giữa các thành viên.
