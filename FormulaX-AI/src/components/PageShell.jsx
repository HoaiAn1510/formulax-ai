import { ArrowLeft } from "lucide-react";
import MathDecor from "./MathDecor";

// Khung chung của mọi trang (theo mockup đã duyệt 2026-11-01): nền #F6F7FA phủ hết vùng nội dung, nội dung CĂN
// GIỮA và có bề rộng tối đa — không trang nào trải hết chiều ngang màn hình lớn. Tiêu đề + mô tả cùng kiểu.
//   width: "narrow" (760px — làm bài, cài đặt), "default" (1200px), "wide" (1440px), "full" (giãn hết bề ngang — Thư viện)
//   onBack: có thì hiện nút "Về trang chủ" (hoặc backLabel) phía trên tiêu đề
//   actions: phần tử đặt bên phải tiêu đề (ô tìm kiếm, nút…); xuống dòng dưới tiêu đề trên điện thoại
//   top: phần tử nằm NGOÀI khối căn giữa, ngay đầu trang (vd thanh CTA dính của Premium)
// Không dùng overflow-hidden ở đây: position:sticky của con cháu sẽ hỏng (xem PremiumUpgrade.jsx).
const WIDTHS = { narrow: "max-w-[760px]", default: "max-w-[1200px]", wide: "max-w-[1440px]", full: "max-w-none" };
// Nền trang trí toán học (MathDecor) ở hai dải lề trống: mỗi dải = (bề rộng khối nền − bề rộng nội dung) / 2.
// Chỉ hiện khi mỗi dải còn khoảng 200px trở lên — khối nền ≈ màn hình − thanh bên 88px. Trang rộng 1440px không có.
const DECOR = {
  narrow: { gutter: "calc((100% - 760px) / 2)", show: "hidden min-[1250px]:block" },
  default: { gutter: "calc((100% - 1200px) / 2)", show: "hidden min-[1690px]:block" },
};

export default function PageShell({
  title,
  description,
  onBack,
  backLabel = "Về trang chủ",
  actions,
  top,
  width = "default",
  className = "",
  innerClassName = "",
  // decor={false}: tắt nét vẽ toán học hai bên lề dù bề rộng có hỗ trợ (trang Cài đặt).
  decor = true,
  // fill: trang tự lo chiều cao (khung chat của Trợ lý hướng dẫn) — không đệm/nền tràn, chỉ căn giữa + giới hạn bề rộng.
  fill = false,
  children,
}) {
  if (fill) {
    return (
      <div className={`view-container ${className}`}>
        {/* flex-1 (không chỉ h-full): trên điện thoại h-full không giãn theo khung ngoài → khung chat chỉ cao bằng
            nội dung, chừa khoảng trắng lớn phía dưới. */}
        <div className={`w-full h-full flex-1 min-h-0 mx-auto flex flex-col ${WIDTHS[width] || WIDTHS.default} ${innerClassName}`}>
          {children}
        </div>
      </div>
    );
  }
  return (
    // Nền cũng đặt ở view-container: khối nền bên trong (min-h-full) không phủ hết phần đệm dưới đáy trên desktop.
    <div className={`view-container bg-page dark:bg-[#0F172A] ${className}`}>
      {top}
      {/* Có `top` thì phần tử đó đã kéo sát mép trên (-mt) — khối nền không kéo lên nữa để khỏi chui dưới nó. */}
      <div className={`relative min-h-full overflow-x-clip bg-page dark:bg-[#0F172A] ${top ? "" : "-mt-6 md:-mt-8"} -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 md:px-8 pb-8 md:pb-12`}>
        {decor && DECOR[width] && <MathDecor gutter={DECOR[width].gutter} show={DECOR[width].show} />}
        <div className={`relative z-[1] w-full mx-auto ${WIDTHS[width] || WIDTHS.default} ${innerClassName}`}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-transparent border-none p-0 mb-3 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-text-muted dark:text-[#94A3B8] cursor-pointer transition-colors hover:text-primary dark:hover:text-[#E2E8F0]"
            >
              <ArrowLeft size={14} />
              <span>{backLabel}</span>
            </button>
          )}
          {(title || actions) && (
            <header className="mb-5 md:mb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-5">
              <div className="min-w-0">
                {title && (
                  <h1 className="m-0 text-[1.5rem] md:text-[2rem] font-bold tracking-[-0.03em] leading-[1.15] text-primary dark:text-[#E2E8F0]">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="m-0 mt-1.5 text-[0.85rem] md:text-[0.95rem] text-text-muted dark:text-[#94A3B8]">{description}</p>
                )}
              </div>
              {actions && <div className="shrink-0 w-full md:w-auto">{actions}</div>}
            </header>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
