import { SOCIAL_LINKS } from "../config/social";

// Logo vẽ tay bằng SVG (lucide không có logo thương hiệu); currentColor để ăn theo màu chữ.
const LOGOS = {
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3Z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.6c-1.4.1-2.6-.3-3.9-1.1v5.9c0 3.6-2.7 5.8-5.8 5.8-3.4 0-5.9-2.9-5.4-6.3.4-2.6 2.7-4.7 5.8-4.4v2.8c-1.6-.3-3 .7-3.1 2.1-.2 1.5.9 2.8 2.5 2.8 1.5 0 2.6-1.1 2.6-2.8V3h3.4Z" />
    </svg>
  ),
};

/**
 * Link Facebook + TikTok của FormulaX, mở ở tab mới.
 *   variant "row": hai nút nhỏ cạnh nhau (chân trang đăng nhập, nền tối)
 *   variant "list": mỗi trang một dòng có tên tài khoản (trang Cài đặt)
 */
export default function SocialLinks({ variant = "row", className = "" }) {
  if (variant === "list") {
    return (
      <div className={`flex flex-col ${className}`}>
        {SOCIAL_LINKS.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2.5 border-b last:border-b-0 border-[#F1F5F9] dark:border-[#334155] no-underline group"
          >
            <span className="w-8 h-8 rounded-[9px] bg-primary dark:bg-[#0F172A] text-white flex items-center justify-center shrink-0">{LOGOS[s.id]}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[0.88rem] font-semibold text-primary dark:text-[#E2E8F0]">{s.label}</span>
              <span className="block text-[0.75rem] text-text-muted dark:text-[#94A3B8]">{s.handle}</span>
            </span>
            <span className="text-accent text-[0.8rem] font-bold group-hover:underline">Theo dõi</span>
          </a>
        ))}
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`FormulaX trên ${s.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[0.72rem] font-semibold text-[#CBD5E1] hover:text-white no-underline transition-colors"
        >
          {LOGOS[s.id]}
          <span>{s.label}</span>
        </a>
      ))}
    </div>
  );
}
