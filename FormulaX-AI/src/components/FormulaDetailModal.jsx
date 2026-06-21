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
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
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
      <div className="explanation-container">
        {parsed.intro && (
          <div className="explanation-intro" style={{ marginBottom: "12px", fontWeight: "600", fontSize: "0.85rem", color: "#475569" }}>
            <RichTextRenderer text={parsed.intro} />
          </div>
        )}
        
        <div className="explanation-table-wrapper">
          <table className="explanation-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Ký hiệu</th>
                <th>Ý nghĩa chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {parsed.rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="symbol-cell">
                    {row.symbol ? <RichTextRenderer text={row.symbol} /> : "—"}
                  </td>
                  <td className="desc-cell">
                    <RichTextRenderer text={row.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parsed.footer && (
          <div className="explanation-footer" style={{ marginTop: "10px", fontSize: "0.8rem", color: "#64748B", fontStyle: "italic", lineHeight: "1.4" }}>
            <RichTextRenderer text={parsed.footer} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-indicator" />
        
        <button className="modal-close-btn" onClick={onClose} title="Đóng">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ paddingRight: "40px", marginBottom: "16px" }}>
          <span className="detail-tag-grade">
            Lớp {formula.grade} • {formula.topic}
          </span>
          <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#1E3A5F", marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            {formula.name}
          </h2>
        </div>

        {/* Large Math Display Box */}
        <div className="detail-latex-box">
          <MathElement math={formula.latex} block={true} />
        </div>

        {/* Mẹo nhớ nhanh */}
        {formula.mnemonic && (
          <div className="detail-mnemonic-box">
            <span className="detail-mnemonic-label">💡 Mẹo nhớ nhanh:</span>
            <span className="detail-mnemonic-text">{formula.mnemonic}</span>
          </div>
        )}

        {/* Modal Body Info */}
        <div className="detail-body">
          {/* Explanation */}
          <div>
            <h4 className="detail-section-title">Giải thích ký hiệu</h4>
            {renderExplanation(formula.explanation)}
          </div>

          {/* Example */}
          {formula.example && (
            <div>
              <h4 className="detail-section-title">Ví dụ minh họa</h4>
              <div className="detail-example-box">
                <RichTextRenderer text={formula.example} />
              </div>
            </div>
          )}

          {/* Custom Notes Section */}
          <div style={{ marginTop: "8px" }}>
            <h4 className="detail-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Ghi chú của bạn</span>
              <span style={{ fontSize: "0.7rem", color: "#666", textTransform: "none", fontWeight: "500", display: "flex", alignItems: "center", gap: "2px" }}>
                <Edit3 size={10} /> Tự động lưu khi nhấn Lưu
              </span>
            </h4>
            <textarea
              className="note-textarea"
              placeholder="Nhập ghi chú cá nhân của bạn về công thức này (ví dụ: mẹo nhớ nhanh, các lỗi sai cần tránh...)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                style={{ padding: "6px 16px", minHeight: "36px", fontSize: "0.8rem", borderRadius: "8px" }}
              >
                <Save size={14} />
                <span>{isSaved ? "Đã lưu!" : "Lưu ghi chú"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="detail-actions-bar">
          <button 
            className={`btn ${isBookmarked ? "btn-secondary" : "btn-primary"}`}
            style={{ flex: 1, minHeight: "44px" }}
            onClick={() => onToggleBookmark(formula.id)}
          >
            <Bookmark size={16} fill={isBookmarked ? "#1E3A5F" : "none"} />
            <span>{isBookmarked ? "Đã bookmark" : "Thêm vào Bookmark"}</span>
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, minHeight: "44px" }}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
