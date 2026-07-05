import React, { useState, useEffect } from "react";
import { X, Save, Edit3, Bookmark } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";

export default function FormulaDetailModal({
  formula,
  onClose,
  userNote = "",
  onSaveNote,
  isBookmarked,
  onToggleBookmark
}) {
  const [noteText, setNoteText] = useState(userNote);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if formula changes
  useEffect(() => {
    setNoteText(userNote || "");
    setIsSaved(false);
  }, [formula, userNote]);

  const handleSave = () => {
    onSaveNote(formula.id, noteText);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Reset toast status
  };

  if (!formula) return null;

  // Helper parser for symbol lists to table
  const parseExplanationToTable = (explanationText) => {
    const lines = explanationText.split('\n');
    const introLines = [];
    const tableRows = [];
    const footerLines = [];

    let inList = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      // Only "- " marks a real symbol-glossary bullet. A line starting with "**" is
      // markdown bold (e.g. "**Mệnh đề:** ...") and must stay prose, not a table row.
      if (trimmed.startsWith('-')) {
        const content = trimmed.substring(1).trim();
        const colonIndex = content.indexOf(':');
        if (colonIndex !== -1) {
          const symbol = content.substring(0, colonIndex).trim();
          const description = content.substring(colonIndex + 1).trim();
          tableRows.push({ symbol, description });
        } else {
          tableRows.push({ symbol: "", description: content });
        }
        inList = true;
      } else {
        if (inList) {
          footerLines.push(line);
        } else {
          introLines.push(line);
        }
      }
    });

    return {
      intro: introLines.join('\n'),
      rows: tableRows,
      footer: footerLines.join('\n')
    };
  };

  const renderExplanation = (explanation) => {
    const parsed = parseExplanationToTable(explanation);

    if (parsed.rows.length === 0) {
      return <RichTextRenderer text={explanation} />;
    }

    return (
      <div>
        {parsed.intro && (
          <div className="mb-3 font-semibold text-[0.85rem] text-[#475569] dark:text-[#94A3B8]">
            <RichTextRenderer text={parsed.intro} />
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-[0_2px_8px_rgba(30,58,95,0.01)]">
          <table className="w-full border-collapse text-[0.85rem] text-left">
            <thead>
              <tr>
                <th className="w-[30%] bg-[#f8fafc] border-b-[1.5px] border-[#e2e8f0] py-2.5 px-3.5 font-extrabold text-primary dark:text-[#E2E8F0]">Ký hiệu</th>
                <th className="bg-[#f8fafc] border-b-[1.5px] border-[#e2e8f0] py-2.5 px-3.5 font-extrabold text-primary dark:text-[#E2E8F0]">Ý nghĩa chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {parsed.rows.map((row, idx) => (
                <tr key={idx} className="border-b border-[#f1f5f9] transition duration-200 hover:bg-secondary/1 last:border-b-0">
                  <td className="py-3 px-3.5 leading-[1.5] font-bold text-primary dark:text-[#E2E8F0] bg-[#fafbfc] border-r border-[#f1f5f9]">
                    {row.symbol ? <RichTextRenderer text={row.symbol} /> : "—"}
                  </td>
                  <td className="py-3 px-3.5 leading-[1.5] text-[#475569]">
                    <RichTextRenderer text={row.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parsed.footer && (
          <div className="mt-2.5 text-[0.8rem] text-[#64748B] dark:text-[#94A3B8] italic leading-[1.4]">
            <RichTextRenderer text={parsed.footer} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.35)] backdrop-blur-[8px] z-[1000] flex items-end md:items-center justify-center [animation:fadeIn_0.25s_ease-out]" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1E293B] w-full max-w-[600px] rounded-t-2xl md:rounded-2xl py-6 px-4 max-h-[85vh] md:max-h-[80vh] overflow-y-auto shadow-[0_-8px_32px_rgba(15,23,42,0.08)] [animation:slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)] relative border border-[rgba(30,58,95,0.07)] dark:border-[#334155]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mb-4 md:hidden" />

        <button className="absolute top-4 right-4 bg-[#f1f5f9] hover:bg-[#e2e8f0] border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-primary dark:text-[#E2E8F0] transition duration-200" onClick={onClose} title="Đóng">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="pr-10 mb-4">
          <span className="text-[0.75rem] font-bold uppercase text-secondary bg-secondary/6 py-1 px-2.5 rounded-lg inline-block">
            Lớp {formula.grade} • {formula.topic}
          </span>
          <h2 className="text-[1.35rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0] mt-1.5 flex items-center gap-2">
            {formula.name}
          </h2>
        </div>

        {/* Large Math Display Box */}
        <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_100%)] border-[1.5px] border-[rgba(30,58,95,0.07)] dark:border-[#334155] rounded-xl py-6 px-4 flex items-center justify-center mb-6 shadow-[inset_0_2px_4px_rgba(30,58,95,0.02)] min-h-[80px]">
          <MathElement math={formula.latex} block={true} />
        </div>

        {/* Mẹo nhớ nhanh */}
        {formula.mnemonic && (
          <div className="bg-[#fffbeb] border border-[rgba(245,158,11,0.2)] rounded-xl py-3 px-4 mb-4 flex flex-col gap-1 shadow-[0_4px_12px_rgba(245,158,11,0.02)]">
            <span className="text-[0.75rem] font-extrabold uppercase tracking-[0.5px] text-[#b45309] flex items-center gap-1">💡 Mẹo nhớ nhanh:</span>
            <span className="text-[0.85rem] font-bold text-[#78350f] leading-[1.5]">{formula.mnemonic}</span>
          </div>
        )}

        {/* Modal Body Info */}
        <div className="flex flex-col gap-5">
          {/* Explanation */}
          <div>
            <h4 className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] uppercase tracking-[0.5px] mb-3 flex items-center gap-1.5">Giải thích ký hiệu</h4>
            {renderExplanation(formula.explanation)}
          </div>

          {/* Example */}
          {formula.example && (
            <div>
              <h4 className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] uppercase tracking-[0.5px] mb-3 flex items-center gap-1.5">Ví dụ minh họa</h4>
              <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] leading-[1.6] text-[0.85rem] text-[#475569]">
                <RichTextRenderer text={formula.example} />
              </div>
            </div>
          )}

          {/* Custom Notes Section */}
          <div className="mt-2">
            <h4 className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] uppercase tracking-[0.5px] mb-3 flex items-center justify-between gap-1.5">
              <span>Ghi chú của bạn</span>
              <span className="text-[0.7rem] text-[#666] dark:text-[#94A3B8] normal-case font-medium flex items-center gap-0.5">
                <Edit3 size={10} /> Tự động lưu khi nhấn Lưu
              </span>
            </h4>
            <textarea
              className="w-full min-h-[100px] bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-xl p-3 text-[0.85rem] font-medium text-primary dark:text-[#E2E8F0] resize-y transition duration-200 focus:border-accent focus:bg-white focus:shadow-[0_0_0_3px_rgba(217,119,6,0.1)]"
              placeholder="Nhập ghi chú cá nhân của bạn về công thức này (ví dụ: mẹo nhớ nhanh, các lỗi sai cần tránh...)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                className="btn btn-primary note-save-btn"
                onClick={handleSave}
              >
                <Save size={14} />
                <span>{isSaved ? "Đã lưu!" : "Lưu ghi chú"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="border-t border-[#f1f5f9] mt-6 pt-4 flex gap-3">
          <button
            className={`btn flex-1 ${isBookmarked ? "btn-secondary" : "btn-primary"}`}
            onClick={() => onToggleBookmark(formula.id)}
          >
            <Bookmark size={16} fill={isBookmarked ? "#1E3A5F" : "none"} />
            <span>{isBookmarked ? "Đã bookmark" : "Thêm vào Bookmark"}</span>
          </button>

          <button
            className="btn btn-secondary flex-1"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
