import { useState } from "react";
import { Pencil, Check, X, TriangleAlert, ListChecks, Camera } from "lucide-react";
import { RichTextRenderer } from "../utils/katexHelper";
import { markUnclear, hasUnclear, checkGuidanceQuota } from "../utils/ocrProblems";

/**
 * Màn "Các bài trong ảnh": mỗi bài Gemini đọc được là một thẻ (nhãn bài, đề render KaTeX, ô chọn,
 * nút Sửa đề). Chỗ không đọc rõ "[?]" tô đỏ; bài còn [?] phải sửa xong mới chọn được — AI Finder
 * không đoán được số bị mờ. Bài có hình vẽ hiện ghi chú hình để học sinh kiểm tra (sửa được).
 * Mỗi bài được hướng dẫn tính 1 lượt AI Finder — chọn nhiều hơn số lượt còn lại thì báo trước.
 */
export default function ImageProblemsPanel({ problems, selected, onToggle, onEdit, onGuide, onCancel, onRescan, aiQueriesLeft, isPremium }) {
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState({ text: "", figureNote: "" });
  const [notice, setNotice] = useState("");

  const ready = problems.filter((p) => !hasUnclear(p.text));
  const chosen = problems.filter((p) => selected.includes(p.key) && !hasUnclear(p.text));

  const startEdit = (p) => {
    setEditingKey(p.key);
    setDraft({ text: p.text, figureNote: p.figureNote });
  };
  const saveEdit = () => {
    if (draft.text.trim()) onEdit(editingKey, { text: draft.text.trim(), figureNote: draft.figureNote.trim() });
    setEditingKey(null);
  };

  const guide = (list) => {
    const check = checkGuidanceQuota({ count: list.length, remaining: aiQueriesLeft, isPremium });
    if (!check.ok) { setNotice(check.message); return; }
    setNotice("");
    onGuide(list.map((p) => p.key));
  };

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-10 px-4 max-w-[420px] mx-auto">
        <TriangleAlert size={28} className="text-accent" />
        <p className="text-[0.9rem] font-bold text-primary dark:text-[#E2E8F0] m-0">Không thấy đề toán nào trong ảnh.</p>
        <p className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] m-0">Bạn chụp lại rõ phần đề bài (đủ sáng, không bị cắt mép) nhé.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onRescan} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
            <Camera size={14} /> Chụp lại
          </button>
          <button type="button" onClick={onCancel} className="bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#E2E8F0] border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-[720px] mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[1rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0 inline-flex items-center gap-2">
          <ListChecks size={18} className="text-accent" />
          Các bài trong ảnh ({problems.length})
        </h3>
        <button type="button" onClick={onCancel} aria-label="Đóng danh sách bài" className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] cursor-pointer p-1 flex items-center">
          <X size={16} />
        </button>
      </div>
      <p className="text-[0.78rem] text-text-muted dark:text-[#94A3B8] m-0">
        Kiểm tra đề AI đọc được có đúng với ảnh không, sửa nếu sai, rồi chọn bài cần hướng dẫn.
      </p>

      {problems.map((p) => {
        const unclear = hasUnclear(p.text);
        const isEditing = editingKey === p.key;
        const isChecked = selected.includes(p.key) && !unclear;
        return (
          <div
            key={p.key}
            className={`rounded-xl border bg-white dark:bg-[#1E293B] p-3 flex flex-col gap-2 min-w-0 ${
              isChecked ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]" : "border-[#E2E8F0] dark:border-[#334155]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                aria-label={`Chọn ${p.label}`}
                checked={isChecked}
                disabled={unclear || isEditing}
                onChange={() => onToggle(p.key)}
                className="w-[18px] h-[18px] accent-[#D97706] cursor-pointer disabled:cursor-not-allowed shrink-0"
              />
              <span className="text-[0.72rem] font-extrabold text-accent bg-accent-light dark:bg-accent/15 py-0.5 px-2 rounded-md">{p.label}</span>
              {!isEditing && (
                <button type="button" onClick={() => startEdit(p)} className="ml-auto inline-flex items-center gap-1 bg-transparent border border-[#E2E8F0] dark:border-[#334155] rounded-lg py-1 px-2 text-[0.72rem] font-bold text-primary dark:text-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#334155]">
                  <Pencil size={12} /> Sửa đề
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <label className="text-[0.72rem] font-bold text-text-muted dark:text-[#94A3B8]">
                  Đề bài (công thức viết trong $...$; thay mỗi chỗ [?] bằng nội dung đúng)
                  <textarea
                    value={draft.text}
                    onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-accent bg-white dark:bg-[#0F172A] text-primary dark:text-[#E2E8F0] p-2 text-[0.85rem] font-medium leading-[1.5] outline-none resize-y font-[inherit]"
                  />
                </label>
                {p.hasFigure && (
                  <label className="text-[0.72rem] font-bold text-text-muted dark:text-[#94A3B8]">
                    Hình vẽ cho biết
                    <textarea
                      value={draft.figureNote}
                      onChange={(e) => setDraft((d) => ({ ...d, figureNote: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-primary dark:text-[#E2E8F0] p-2 text-[0.82rem] leading-[1.5] outline-none resize-y font-[inherit]"
                    />
                  </label>
                )}
                {draft.text.trim() && (
                  <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 py-2 text-[0.85rem] overflow-x-auto chat-bot-text">
                    <span className="text-[0.68rem] font-bold text-text-muted dark:text-[#94A3B8]">Xem trước</span>
                    <RichTextRenderer text={markUnclear(draft.text)} />
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditingKey(null)} className="inline-flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#E2E8F0] border-none rounded-lg py-1.5 px-3 text-[0.78rem] font-bold cursor-pointer">
                    <X size={12} /> Hủy
                  </button>
                  <button type="button" onClick={saveEdit} disabled={!draft.text.trim()} className="inline-flex items-center gap-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white border-none rounded-lg py-1.5 px-3 text-[0.78rem] font-bold cursor-pointer">
                    <Check size={12} /> Lưu
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="chat-bot-text text-[0.88rem] leading-[1.6] text-primary dark:text-[#E2E8F0] min-w-0 overflow-x-auto">
                  <RichTextRenderer text={markUnclear(p.text)} />
                </div>
                {p.hasFigure && (
                  <div className="text-[0.78rem] leading-[1.5] rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 border border-dashed border-[#CBD5E1] dark:border-[#334155] px-3 py-2 text-[#334155] dark:text-[#CBD5E1] [&_.detail-paragraph-line]:!text-inherit">
                    <strong>Hình vẽ cho biết:</strong>{" "}
                    {p.figureNote ? <RichTextRenderer text={p.figureNote} /> : <em>(AI chưa mô tả được — bạn bấm Sửa đề để ghi thêm)</em>}
                    <div className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] mt-1">Bạn kiểm tra lại với hình trong ảnh — AI hướng dẫn dựa vào ghi chú này.</div>
                  </div>
                )}
                {unclear && (
                  <div className="text-[0.76rem] leading-[1.5] text-[#B91C1C] dark:text-[#FCA5A5] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.25)] rounded-lg px-3 py-2">
                    Có chỗ AI chưa đọc rõ (ô đỏ{p.unclear.length ? `: ${p.unclear.join("; ")}` : ""}). Bấm <strong>Sửa đề</strong> điền đúng theo đề gốc rồi mới chọn được bài này.
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {notice && (
        <div role="alert" className="text-[0.8rem] leading-[1.5] text-[#92400E] dark:text-[#FCD34D] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-lg px-3 py-2">
          {notice}
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 px-1 pt-2 pb-1 bg-white/95 dark:bg-[#0F172A]/95 flex gap-2">
        <button
          type="button"
          onClick={() => guide(chosen)}
          disabled={chosen.length === 0 || editingKey !== null}
          className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-[#E2E8F0] disabled:text-text-muted dark:disabled:bg-[#334155] text-white border-none rounded-[10px] py-2.5 px-2 sm:px-4 text-[0.8rem] sm:text-[0.85rem] font-bold cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
        >
          Hướng dẫn đã chọn ({chosen.length})
        </button>
        <button
          type="button"
          onClick={() => guide(ready)}
          disabled={ready.length === 0 || editingKey !== null}
          className="flex-1 bg-white dark:bg-[#1E293B] text-primary dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] rounded-[10px] py-2.5 px-2 sm:px-4 text-[0.8rem] sm:text-[0.85rem] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] dark:hover:bg-[#334155]"
        >
          Hướng dẫn tất cả ({ready.length})
        </button>
      </div>
      {!isPremium && (
        <p className="text-[0.72rem] text-text-muted dark:text-[#94A3B8] m-0 text-center">
          Mỗi bài được hướng dẫn tính 1 lượt hỏi AI{typeof aiQueriesLeft === "number" ? ` — bạn còn ${aiQueriesLeft} lượt hôm nay` : ""}. Quét ảnh không tính lượt.
        </p>
      )}
      {ready.length < problems.length && (
        <p className="text-[0.72rem] text-text-muted dark:text-[#94A3B8] m-0 text-center">
          "Hướng dẫn tất cả" bỏ qua bài còn chỗ chưa đọc rõ.
        </p>
      )}
    </div>
  );
}
