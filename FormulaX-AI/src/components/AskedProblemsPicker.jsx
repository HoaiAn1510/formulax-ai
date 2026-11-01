import { History, Search, Sparkles, Lock, Check } from "lucide-react";
import { RichTextRenderer } from "../utils/katexHelper";
import { formatAskedAt, MAX_VARIANT_PICK } from "../utils/askedProblems";

// Danh sách "Bài đã hỏi" (lịch sử AI Finder) trong màn chọn đề của QuizView. Chọn nhiều bài rồi tạo đề, hoặc
// bấm "Luyện dạng này" để tạo ngay một câu từ đúng bài đó. Dữ liệu: utils/askedProblems.js.
export default function AskedProblemsPicker({
  items,
  loading,
  selected,
  onToggle,
  onPracticeOne,
  formulasById,
  isGuest,
  onLogin,
  onGoFinder,
  busy,
}) {
  if (isGuest) {
    return (
      <div className="rounded-2xl border border-[#E6E9F0] dark:border-[#334155] bg-[#FAFBFD] dark:bg-[#0F172A]/40 p-5 text-center">
        <Lock size={20} className="mx-auto text-accent" />
        <p className="mt-2 mb-3 text-[0.85rem] text-text-muted dark:text-[#94A3B8] leading-[1.55]">
          Luyện lại dạng bài cần đăng nhập Google: đề mới do AI tạo từ các bài bạn đã hỏi trong Tìm kiếm AI.
        </p>
        <button type="button" onClick={onLogin} className="btn btn-primary mx-auto">Đăng nhập Google</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Đang tải bài đã hỏi">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] rounded-2xl bg-[#EEF1F6] dark:bg-[#334155] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D5DAE5] dark:border-[#475569] p-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-accent-light dark:bg-accent/15 text-accent flex items-center justify-center mx-auto">
          <History size={20} />
        </div>
        <h3 className="mt-3 mb-1 text-[0.95rem] font-bold text-primary dark:text-[#E2E8F0]">Chưa có bài nào để luyện lại</h3>
        <p className="m-0 text-[0.82rem] text-text-muted dark:text-[#94A3B8] leading-[1.55]">
          Hỏi AI một bài trong Tìm kiếm AI. Bài nào AI đã hướng dẫn sẽ hiện ở đây để bạn luyện dạng tương tự với số liệu mới.
        </p>
        <button type="button" onClick={onGoFinder} className="btn btn-secondary mt-4 mx-auto">
          <Search size={15} /> <span>Mở Tìm kiếm AI</span>
        </button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
      {items.map((item) => {
        const checked = selected.includes(item.key);
        const full = !checked && selected.length >= MAX_VARIANT_PICK;
        const names = item.formulaIds.map((id) => formulasById.get(id)?.name).filter(Boolean);
        const inputId = `asked-${item.key}`;
        return (
          <li
            key={item.key}
            className={`rounded-2xl border bg-white dark:bg-[#1E293B] p-3.5 transition-colors ${
              checked ? "border-accent bg-accent-light/40 dark:bg-accent/10" : "border-[#E6E9F0] dark:border-[#334155]"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                disabled={full || busy}
                onChange={() => onToggle(item.key)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                aria-label={checked ? "Bỏ chọn bài này" : "Chọn bài này"}
                className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                  checked ? "bg-primary border-primary text-[#FBBF24] dark:bg-accent dark:border-accent dark:text-white" : "border-[#CBD5E1] dark:border-[#475569] bg-white dark:bg-[#0F172A]"
                } ${full || busy ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </label>
              <div className="flex-1 min-w-0">
                <label htmlFor={inputId} className="block cursor-pointer quiz-question-text text-[0.88rem] font-semibold text-primary dark:text-[#E2E8F0] leading-[1.5] line-clamp-3 break-words">
                  <RichTextRenderer text={item.text} />
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.72rem]">
                  {item.askedAt > 0 && <span className="text-text-muted dark:text-[#94A3B8]">{formatAskedAt(item.askedAt)}</span>}
                  {names.length > 0
                    ? names.map((n) => (
                      <span key={n} className="rounded-full bg-[#EEF1F6] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] font-semibold px-2 py-0.5">{n}</span>
                    ))
                    : <span className="rounded-full bg-[#EEF1F6] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] font-semibold px-2 py-0.5">Kiến thức nền</span>}
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => onPracticeOne(item)}
                className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl border border-[#D5DAE5] dark:border-[#475569] bg-white dark:bg-[#0F172A] px-3 text-[0.78rem] font-bold text-primary dark:text-[#E2E8F0] cursor-pointer hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={14} /> Luyện dạng này
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
