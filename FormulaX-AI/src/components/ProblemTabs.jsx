import { X, RotateCcw, Crown } from "lucide-react";
import { RichTextRenderer } from "../utils/katexHelper";
import StepAnswer from "./StepAnswer";

const Dots = ({ label }) => (
  <div className="flex items-center gap-2 text-[0.8rem] font-bold text-text-muted dark:text-[#94A3B8] py-2">
    <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite]" />
    <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.2s]" />
    <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.4s]" />
    <span>{label}</span>
  </div>
);

/**
 * Các bài đã chọn từ ảnh, mỗi bài một tab. Component chỉ hiển thị — FormulaFinder quyết định khi nào
 * gọi AI: CHỈ gọi cho bài đang mở, chưa có kết quả, và lần lượt từng bài (không gọi song song).
 * results[key]: { status: "loading" | "done" | "error" | "limit", answer?, message? }
 */
export default function ProblemTabs({ items, activeKey, results, inFlightKey, onSelect, onRetry, onClose, onUpgrade, formulas, onViewDetail }) {
  const active = items.find((p) => p.key === activeKey) || items[0];
  const result = results[active.key];

  return (
    <div className="flex flex-col gap-3 w-full max-w-[760px] mx-auto min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[1rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">Hướng dẫn từng bài</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#E2E8F0] border-none rounded-lg py-1.5 px-3 text-[0.75rem] font-bold cursor-pointer"
        >
          <X size={12} /> Xong
        </button>
      </div>

      <div role="tablist" aria-label="Các bài đã chọn" className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((p) => {
          const r = results[p.key];
          const isActive = p.key === active.key;
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(p.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full py-1.5 px-3 text-[0.78rem] font-bold cursor-pointer border transition-colors duration-200 ${
                isActive
                  ? "bg-accent text-white border-accent"
                  : "bg-white dark:bg-[#1E293B] text-primary dark:text-[#E2E8F0] border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]"
              }`}
            >
              {p.label}
              {r?.status === "done" && <span aria-label="đã có hướng dẫn" className={isActive ? "text-white" : "text-success"}>✓</span>}
              {r?.status === "loading" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 py-2.5 min-w-0">
        <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.5px] text-text-muted dark:text-[#94A3B8] mb-1">Đề bài</div>
        <div className="chat-bot-text text-[0.86rem] leading-[1.6] text-primary dark:text-[#E2E8F0] overflow-x-auto">
          <RichTextRenderer text={active.text} />
        </div>
        {active.hasFigure && active.figureNote && (
          <div className="text-[0.76rem] text-[#334155] dark:text-[#CBD5E1] mt-1.5 [&_.detail-paragraph-line]:!text-inherit">
            <strong>Hình vẽ cho biết:</strong> <RichTextRenderer text={active.figureNote} />
          </div>
        )}
      </div>

      <div role="tabpanel" className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1E293B] py-3 px-4 min-w-0 text-primary dark:text-[#E2E8F0]">
        {!result && inFlightKey && inFlightKey !== active.key && <Dots label="Đang hướng dẫn bài trước, bài này sẽ bắt đầu ngay sau..." />}
        {(!result && !inFlightKey) && <Dots label="AI đang phân tích..." />}
        {result?.status === "loading" && <Dots label="AI đang phân tích..." />}
        {result?.status === "done" && <StepAnswer answer={result.answer} formulas={formulas} onViewDetail={onViewDetail} />}
        {result?.status === "error" && (
          <div className="flex flex-col gap-2.5 items-start">
            <span className="text-[0.85rem] text-[#b91c1c] dark:text-[#FCA5A5]">{result.message}</span>
            <button type="button" onClick={() => onRetry(active.key)} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white border-none rounded-lg py-1.5 px-3 text-[0.78rem] font-bold cursor-pointer">
              <RotateCcw size={12} /> Thử lại
            </button>
          </div>
        )}
        {result?.status === "limit" && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[0.85rem] text-[#92400E] dark:text-[#FCD34D]">
              <Crown size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{result.message}</span>
            </div>
            <button type="button" onClick={onUpgrade} className="self-start flex items-center gap-1.5 bg-premium text-[#1E3A5F] border-none rounded-lg py-2 px-4 text-[0.82rem] font-extrabold cursor-pointer">
              <Crown size={13} fill="#1E3A5F" color="#1E3A5F" />
              Nâng cấp Premium — Hỏi không giới hạn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
