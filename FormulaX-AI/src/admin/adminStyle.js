/** Hằng số giao diện dùng chung của trang quản trị (tách khỏi AdminUI.jsx để file đó chỉ export component). */

// Màu nhấn của thẻ số liệu, trong bảng màu Navy + Amber. Chữ trên nền nhạt đạt tương phản AA.
export const TONES = {
  blue: { bg: "bg-[#DBEAFE]", fg: "text-[#1D4ED8]", stroke: "#2563EB" },
  green: { bg: "bg-[#D1FAE5]", fg: "text-[#047857]", stroke: "#059669" },
  amber: { bg: "bg-accent-light", fg: "text-accent-hover", stroke: "#D97706" },
  violet: { bg: "bg-[#EDE9FE]", fg: "text-[#6D28D9]", stroke: "#7C3AED" },
  red: { bg: "bg-[#FEE2E2]", fg: "text-[#B91C1C]", stroke: "#DC2626" },
  slate: { bg: "bg-[#F1F5F9]", fg: "text-[#475569]", stroke: "#64748B" },
};

export const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
