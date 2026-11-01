// Lớp Tailwind dùng chung của giao diện mới (mockup 2026-11-01). Đặt ở file .js vì file .jsx chỉ được export
// component (lint react-refresh).

// Thẻ chuẩn: trắng, viền mảnh #E6E9F0, bo 18px (fx-card ở index.css) + bản tối.
export const CARD = "fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none";
// Nhãn nhỏ viết hoa (CHUỖI HỌC, NHIỆM VỤ HÔM NAY…).
export const LABEL = "text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8]";
// Nút chính navy (bản tối: amber), nút phụ trắng viền mảnh.
export const BTN_PRIMARY = "inline-flex items-center justify-center gap-2 rounded-[13px] bg-primary dark:bg-accent text-white font-semibold text-[0.92rem] px-5 py-3 border-none cursor-pointer shadow-[0_10px_22px_-10px_rgba(15,23,42,0.6)] transition-colors hover:bg-navy-secondary dark:hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_SECONDARY = "inline-flex items-center justify-center gap-2 rounded-[13px] bg-white dark:bg-[#0F172A] text-primary dark:text-[#E2E8F0] font-semibold text-[0.92rem] px-5 py-3 border border-[#D5DAE5] dark:border-[#475569] cursor-pointer transition-colors hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed";
// Chip lọc: mặc định / đang chọn.
export const CHIP = "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[0.82rem] font-semibold cursor-pointer transition-colors border";
export const CHIP_OFF = "bg-white dark:bg-[#1E293B] border-line dark:border-[#334155] text-primary dark:text-[#E2E8F0] hover:border-[#CBD5E1]";
export const CHIP_ON = "bg-primary dark:bg-accent border-primary dark:border-accent text-white";
