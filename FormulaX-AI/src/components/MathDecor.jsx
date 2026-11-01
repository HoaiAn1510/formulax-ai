import { DECOR_FORMULAS as F } from "../utils/decorFormulas";

// Nền trang trí cho các trang trong app (PageShell): nét vẽ toán học mảnh, mờ ở HAI DẢI LỀ TRỐNG hai bên nội dung
// — cùng ý với nền trang đăng nhập (LoginBackground.jsx) nhưng tông sáng hợp nền #F6F7FA, có bản tối. Chỉ trang trí:
// aria-hidden, không bắt chuột, dính theo khi cuộn (sticky). Công thức lấy từ utils/decorFormulas.js (chép từ
// formulas.js, có ghi id). Chỉ hiện khi lề đủ rộng — lớp `show` do PageShell truyền theo bề rộng nội dung.

// Nét và chữ: xanh navy phát sáng nhẹ (chủ dự án chọn 2026-11-01, thay cho xám) — quầng sáng do lớp `.math-decor-glow`
// (index.css). Điểm nhấn amber giữ nguyên.
const LINE = "stroke-[#3B6FB6]/60 dark:stroke-[#38BDF8]/45";
const ACCENT = "stroke-[#F59E0B]/55 dark:stroke-[#D97706]/50";
const TEXT = "fill-[#29589C]/75 dark:fill-[#7DD3FC]/60";
const LABEL = "fill-[#B45309]/60 dark:fill-[#D97706]/55";

function Formula({ x, y, children, anchor = "start", size = 14 }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontStyle="italic" fontFamily="Inter, system-ui, sans-serif" className={TEXT}>
      {children}
    </text>
  );
}

function LeftArt() {
  return (
    <svg viewBox="0 0 260 820" preserveAspectRatio="xMidYMin meet" className="math-decor-glow w-full h-full overflow-visible" fill="none" strokeWidth="1.4" strokeLinecap="round">
      {/* Tam giác + định lý côsin (hh10-cosin) */}
      <path d="M48 70 L48 210 L214 210 Z" className={LINE} />
      <path d="M48 196 L62 196 L62 210" className={ACCENT} />
      <text x="34" y="144" fontSize="15" fontStyle="italic" className={LABEL}>b</text>
      <text x="126" y="230" fontSize="15" fontStyle="italic" className={LABEL}>c</text>
      <text x="138" y="132" fontSize="15" fontStyle="italic" className={LABEL}>a</text>
      <text x="32" y="228" fontSize="13" className={LABEL}>A</text>
      <Formula x="34" y="262">{F.cosin}</Formula>

      {/* Sóng sin + đẳng thức lượng giác cơ bản (lg11-congthuc-coban) */}
      <Formula x="34" y="340">{F.trig}</Formula>
      <path d="M20 400 L240 400" className={LINE} strokeDasharray="3 6" />
      <path d="M20 400 C 47 352, 74 352, 101 400 S 155 448, 182 400 S 236 352, 240 360" className={ACCENT} />

      {/* Hình nón + thể tích khối nón (hh12-khino-thetich) */}
      <path d="M130 520 L68 690 M130 520 L192 690" className={LINE} />
      <ellipse cx="130" cy="690" rx="62" ry="15" className={LINE} />
      <path d="M130 520 L130 690 L190 690" className={ACCENT} strokeDasharray="4 5" />
      <text x="136" y="612" fontSize="13" fontStyle="italic" className={LABEL}>h</text>
      <text x="160" y="684" fontSize="13" fontStyle="italic" className={LABEL}>r</text>
      <Formula x="34" y="748">{F.cone}</Formula>
    </svg>
  );
}

function RightArt() {
  return (
    <svg viewBox="0 0 260 820" preserveAspectRatio="xMidYMin meet" className="math-decor-glow w-full h-full overflow-visible" fill="none" strokeWidth="1.4" strokeLinecap="round">
      {/* Đường tròn + phương trình đường tròn (hh10-duongtron-phuongtrinh) */}
      <circle cx="140" cy="150" r="78" className={LINE} />
      <path d="M140 150 L196 96" className={ACCENT} />
      <circle cx="140" cy="150" r="2.6" className="fill-[#F59E0B]/60 stroke-none" />
      <text x="124" y="168" fontSize="13" fontStyle="italic" className={LABEL}>I</text>
      <text x="174" y="112" fontSize="13" fontStyle="italic" className={LABEL}>R</text>
      <path d="M40 240 L240 240" className={LINE} strokeDasharray="3 6" />
      <Formula x="226" y="270" anchor="end">{F.circle}</Formula>

      {/* Trục toạ độ + đồ thị lôgarit (ds11-hamso-log), đạo hàm luỹ thừa (gt12-daoham-basic) */}
      <path d="M60 520 L60 330 M40 500 L236 500" className={LINE} />
      <path d="M236 500 l-7 -4 M236 500 l-7 4 M60 330 l-4 7 M60 330 l4 7" className={LINE} />
      <path d="M72 590 C 78 520, 96 480, 130 462 S 200 440, 236 432" className={ACCENT} />
      <Formula x="226" y="372" anchor="end">{F.log}</Formula>
      <Formula x="226" y="400" anchor="end" size={13}>{F.derivative}</Formula>

      {/* Mặt cầu + thể tích khối cầu (hh12-matcau-thetich) */}
      <circle cx="140" cy="660" r="64" className={LINE} />
      <ellipse cx="140" cy="660" rx="64" ry="17" className={ACCENT} strokeDasharray="4 5" />
      <path d="M140 660 L204 660" className={LINE} />
      <text x="166" y="652" fontSize="13" fontStyle="italic" className={LABEL}>R</text>
      <Formula x="226" y="758" anchor="end">{F.sphere}</Formula>
    </svg>
  );
}

// gutter: bề rộng mỗi dải lề tính bằng CSS (truyền từ PageShell), show: lớp ẩn/hiện theo breakpoint.
export default function MathDecor({ gutter, show }) {
  const side = "absolute top-0 bottom-0 pointer-events-none select-none";
  return (
    <div aria-hidden="true" className={`${show} absolute inset-0 z-0 pointer-events-none`}>
      <div className={`${side} left-0`} style={{ width: gutter }}>
        <div className="sticky top-0 h-screen max-h-[900px] px-6 pt-16 pb-10 opacity-90">
          <LeftArt />
        </div>
      </div>
      <div className={`${side} right-0`} style={{ width: gutter }}>
        <div className="sticky top-0 h-screen max-h-[900px] px-6 pt-16 pb-10 opacity-90">
          <RightArt />
        </div>
      </div>
    </div>
  );
}
