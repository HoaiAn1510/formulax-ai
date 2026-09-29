import { Lock } from "lucide-react";

// Ô thông báo "tính năng này cần đăng nhập Google" — đặt vào đúng chỗ của tính năng bị khóa
// để khách vẫn thấy tính năng tồn tại, bấm vào thì mở hộp thoại đăng nhập.
export default function GuestLockNotice({ title, description, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/40 px-4 py-3 cursor-pointer transition-colors duration-200 hover:bg-accent-light/60 dark:hover:bg-[#334155]/40 ${className}`}
    >
      <div className="w-9 h-9 rounded-full bg-accent-light dark:bg-accent/15 text-accent flex items-center justify-center shrink-0">
        <Lock size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0]">{title}</div>
        {description && (
          <div className="text-[0.75rem] text-text-muted dark:text-[#94A3B8] mt-0.5 leading-[1.45]">{description}</div>
        )}
      </div>
    </button>
  );
}
