import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Ô chọn dạng danh sách thả xuống cho màn hẹp (Thư viện trên điện thoại): một nút hiện lựa chọn hiện tại,
// bấm vào mới mở danh sách — thay cho cả hàng chip trải ngang. Chọn được nhiều mục; đóng khi bấm ra ngoài,
// nhấn Esc hoặc nút "Xong".
//   options: [{ value, label, active, glyph?, tone? }]  (glyph/tone: ô biểu tượng chủ đề, không bắt buộc)
export default function FilterPicker({ label, summary, options, onToggle, highlighted = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-11 flex items-center gap-2 pl-3.5 pr-2.5 rounded-[12px] border text-left cursor-pointer transition-colors ${
          highlighted || open
            ? "border-accent bg-accent-light/60 dark:bg-accent/15"
            : "border-line dark:border-[#334155] bg-white dark:bg-[#1E293B]"
        }`}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[0.62rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8] leading-none">{label}</span>
          <span className="block mt-1 text-[0.85rem] font-semibold text-primary dark:text-[#E2E8F0] truncate leading-none">{summary}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-text-muted dark:text-[#94A3B8] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (<>
        {/* Nền mờ (nằm trong ref nên tự đóng bằng onClick, không qua bộ bắt bấm-ra-ngoài). */}
        <div className="fixed inset-0 z-[140] bg-[rgba(15,23,42,0.35)]" aria-hidden="true" onClick={() => setOpen(false)} />
        {/* Ngăn kéo nằm ngay trên thanh điều hướng dưới (cao 72px) — danh sách dài thì cuộn, nút Xong luôn thấy. */}
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="fixed inset-x-3 bottom-[84px] z-[150] max-h-[min(460px,calc(100dvh-170px))] flex flex-col rounded-[18px] border border-line dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-[0_24px_48px_-16px_rgba(15,23,42,0.45)]"
        >
          <div className="px-4 pt-3.5 pb-2 text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8]">Chọn {label.toLowerCase()}</div>
          <div className="flex-1 min-h-0 overflow-y-auto px-1.5">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.active}
              onClick={() => onToggle(o.value)}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-2.5 rounded-[10px] border-none text-left text-[0.88rem] cursor-pointer transition-colors ${
                o.active ? "bg-accent-light/70 dark:bg-accent/15 font-semibold text-primary dark:text-[#E2E8F0]" : "bg-transparent text-primary dark:text-[#E2E8F0] hover:bg-page dark:hover:bg-white/5"
              }`}
            >
              {o.glyph && (
                <span className={`min-w-7 h-7 px-1 rounded-full flex items-center justify-center font-[Georgia,serif] italic font-bold text-[0.72rem] shrink-0 ${o.tone}`}>{o.glyph}</span>
              )}
              <span className="flex-1 min-w-0">{o.label}</span>
              {o.active && <Check size={16} className="text-accent shrink-0" />}
            </button>
          ))}
          </div>
          <div className="border-t border-line dark:border-[#334155] p-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-[10px] bg-primary dark:bg-accent text-white text-[0.85rem] font-semibold border-none cursor-pointer"
            >
              Xong
            </button>
          </div>
        </div>
      </>)}
    </div>
  );
}
