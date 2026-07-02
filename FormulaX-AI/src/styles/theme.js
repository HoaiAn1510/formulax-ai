// Design tokens dùng chung cho phong cách "Glassmorphism Light".
// Đây chỉ là các object/hằng số JS thuần để spread vào style={{...}} —
// không phải CSS-in-JS, giữ đúng pattern inline style hiện có của dự án.

// Nền trang: gradient nhạt tím → hồng → xanh dương
export const gradients = {
  pageBackground: "linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 45%, #DBEAFE 100%)",
  purpleBanner: "linear-gradient(135deg, #7C3AED 0%, #A855F7 55%, #C084FC 100%)",
  orangeBanner: "linear-gradient(135deg, #FB923C 0%, #F97316 55%, #EF4444 100%)",
  premiumProgressBar: "linear-gradient(90deg, #FB923C 0%, #F97316 100%)",
};

// Glow toả mờ ra ngoài cho các banner màu (thay cho shadow xám mặc định)
export const glow = {
  purple: "0 10px 28px -6px rgba(124, 58, 237, 0.45)",
  orange: "0 10px 28px -6px rgba(249, 115, 22, 0.45)",
};

// Style "thẻ kính" (frosted glass) dùng cho card lớn — spread vào style={{...}}
export const glassCard = {
  background: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  borderRadius: "20px",
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.10)",
};

// Biến thể bo góc nhỏ hơn — dùng cho item dạng hàng (list item)
export const glassCardSm = {
  ...glassCard,
  borderRadius: "16px",
};

// Cấu hình các khối "orb" ánh sáng mờ rải phía sau nội dung (tạo chiều sâu)
export const orbs = [
  { top: "-8%", left: "-6%", size: "260px", background: "radial-gradient(circle, rgba(196,132,252,0.45) 0%, transparent 70%)" },
  { top: "6%", right: "-10%", size: "300px", background: "radial-gradient(circle, rgba(251,207,232,0.55) 0%, transparent 70%)" },
  { bottom: "-12%", left: "18%", size: "320px", background: "radial-gradient(circle, rgba(147,197,253,0.45) 0%, transparent 70%)" },
];

// Style tuyệt đối cho từng orb, dùng cùng mảng orbs ở trên
export function orbStyle(orb) {
  return {
    position: "absolute",
    top: orb.top,
    left: orb.left,
    right: orb.right,
    bottom: orb.bottom,
    width: orb.size,
    height: orb.size,
    background: orb.background,
    filter: "blur(50px)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  };
}

// Wrapper phủ nền gradient toàn bộ khu vực nội dung, dùng negative margin để
// "tràn" ra hết phần padding sẵn có của .view-container rồi padding lại đúng
// khoảng cách cũ — nhờ vậy không cần sửa App.css mà nền vẫn phủ kín viền.
export const pageWrapper = {
  position: "relative",
  overflow: "hidden",
  minHeight: "100%",
  background: gradients.pageBackground,
  margin: "calc(-1 * var(--sp-6)) calc(-1 * var(--sp-4)) calc(-1 * var(--sp-8)) calc(-1 * var(--sp-4))",
  padding: "var(--sp-6) var(--sp-4) var(--sp-8) var(--sp-4)",
};

// Lớp chứa nội dung thật, luôn nằm trên các orb (z-index cao hơn)
export const contentLayer = {
  position: "relative",
  zIndex: 1,
};
