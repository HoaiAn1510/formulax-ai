import React from "react";
import { Heart, Plus, BookOpen, Layers } from "lucide-react";
import { MathElement } from "../utils/katexHelper";

export default function FormulaCard({ 
  formula, 
  isBookmarked, 
  onToggleBookmark, 
  onCreateFlashcard, 
  onViewDetail 
}) {
  return (
    <div className="formula-card">
      <div className="formula-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
          <span style={{ fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", color: "#666", letterSpacing: "0.5px" }}>
            Lớp {formula.grade} • {formula.topic}
          </span>
          <h3 className="formula-card-title" onClick={() => onViewDetail && onViewDetail(formula)} style={{ cursor: "pointer" }}>
            {formula.name}
          </h3>
        </div>
        <button 
          className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
          onClick={() => onToggleBookmark(formula.id)}
          title={isBookmarked ? "Bỏ lưu công thức" : "Lưu công thức"}
        >
          <Heart size={18} fill={isBookmarked ? "#E74C3C" : "none"} />
        </button>
      </div>

      <div className="formula-display-box" onClick={() => onViewDetail && onViewDetail(formula)} style={{ cursor: "pointer" }}>
        <MathElement math={formula.latex} block={true} />
      </div>

      <div className="formula-card-footer">
        {formula.tags && formula.tags.slice(0, 2).map((tag, idx) => (
          <span key={idx} className="tag">{tag}</span>
        ))}
        
        <span className={`tag tag-difficulty ${formula.difficulty.toLowerCase()}`}>
          {formula.difficulty}
        </span>
        
        <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
          <button 
            className="btn-card-action"
            onClick={() => onCreateFlashcard && onCreateFlashcard(formula)}
            title="Tạo nhanh Flashcard"
            style={{ color: "#2E86DE", backgroundColor: "rgba(46, 134, 222, 0.08)" }}
          >
            <Layers size={12} />
            <span>+ Flashcard</span>
          </button>
          
          <button 
            className="btn-card-action" 
            onClick={() => onViewDetail && onViewDetail(formula)}
          >
            <BookOpen size={12} />
            <span>Xem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
