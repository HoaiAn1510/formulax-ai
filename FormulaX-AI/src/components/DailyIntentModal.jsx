import { useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { INTENT_OPTIONS, readLast, writeLast } from "../utils/dailyIntent";

// Hộp "Hôm nay bạn gặp khó khăn gì?" — hiện một lần mỗi lượt mở app (xem App.jsx).
// Học sinh nói MÌNH ĐANG GẶP GÌ chứ không phải chọn tên chức năng; mỗi lựa chọn kèm một dòng
// giải thích chức năng đó làm gì, chứa gì, rồi bấm là vào thẳng.
export default function DailyIntentModal({ gid, firstName, onPick, onClose }) {
  const last = readLast(gid);
  // Lựa chọn lần trước lên đầu để một chạm là vào lại việc đang dở.
  const options = [...INTENT_OPTIONS].sort((a, b) => (a.id === last ? -1 : b.id === last ? 1 : 0));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)] backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-intent-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-[20px] bg-white dark:bg-[#1E293B] p-6 md:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center gap-1 text-[0.75rem] font-semibold text-[#94A3B8] hover:text-primary bg-transparent border-none cursor-pointer"
        >
          Để sau <X size={14} />
        </button>

        <h2 id="daily-intent-title" className="m-0 pr-16 text-[1.2rem] font-extrabold text-primary dark:text-[#E2E8F0]">
          {firstName ? `${firstName} ơi, hôm nay bạn gặp khó khăn gì?` : "Hôm nay bạn gặp khó khăn gì?"}
        </h2>
        <p className="mt-1.5 mb-4 text-[0.82rem] leading-[1.5] text-text-muted dark:text-[#94A3B8]">
          Chọn một việc, mình đưa bạn tới thẳng đúng chỗ.
        </p>

        <div className="flex flex-col gap-2.5">
          {options.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => { writeLast(gid, o.id); onPick(o); }}
                className="group flex items-start gap-3 text-left w-full rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 py-3.5 cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:border-accent active:scale-[0.99]"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.color}`}>
                  <Icon size={20} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.92rem] font-extrabold text-primary dark:text-[#E2E8F0]">{o.title}</span>
                    {o.id === last && (
                      <span className="text-[0.62rem] font-bold uppercase tracking-wide text-accent bg-accent/10 rounded px-1.5 py-px">Lần trước</span>
                    )}
                  </span>
                  <span className="block mt-1 text-[0.78rem] leading-[1.5] text-text-muted dark:text-[#94A3B8]">{o.what}</span>
                  <span className="mt-1.5 flex items-center gap-1 text-[0.78rem] font-bold text-accent">
                    {o.cta} <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
