import React, { useState } from "react";
import { BookOpen, Search, Zap, ClipboardList, Crown, ChevronRight, LayoutGrid, Gem, Trash2 } from "lucide-react";
import { MathElement } from "../utils/katexHelper";

export default function Dashboard({
  user,
  displayName,
  setActiveTab,
  formulas,
  onViewDetail,
  isPremium,
  remainingQuizzes,
  stats,
  onResetStats,
}) {
  // Ưu tiên tên tùy chỉnh, nếu không có thì lấy tên cuối từ tài khoản Google
  const firstName = displayName || user?.name?.split(" ").slice(-1)[0] || "bạn";
  const [confirmReset, setConfirmReset] = useState(false);
  // Recommend 3 math formulas based on ID
  const recommendedFormulas = formulas.filter(f => 
    f.id === "gt12-daoham-mu" || 
    f.id === "xs11-xacsuat" || 
    f.id === "ds10-phuongtrinh-bac2"
  );

  return (
    <div className="view-container">
      {/* Greeting Header */}
      <div className="dashboard-greeting" style={{ marginBottom: "24px" }}>
        <h1 style={{ 
          display: "flex", 
          alignItems: "baseline", 
          gap: "8px", 
          flexWrap: "wrap", 
          fontSize: "1.45rem", 
          fontWeight: "800", 
          color: "#1E3A5F", 
          letterSpacing: "-0.5px", 
          margin: 0 
        }}>
          <span>Xin chào {firstName}!</span>
          <span style={{ color: "#64748B", fontWeight: "500", fontSize: "0.95rem" }}>Hôm nay ôn gì?</span>
        </h1>
      </div>

      {/* 2x2 Grid of Circular Icon Cards */}
      <div className="dashboard-grid-figma">
        {/* Card 1: Thư viện */}
        <div className="grid-card-figma" onClick={() => setActiveTab("library")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", color: "#3B82F6" }}>
            <BookOpen size={22} />
          </div>
          <span className="grid-card-label">Thư viện</span>
        </div>

        {/* Card 2: Tìm kiếm AI */}
        <div className="grid-card-figma" onClick={() => setActiveTab("finder")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#10B981" }}>
            <Search size={22} />
          </div>
          <span className="grid-card-label">Tìm kiếm AI</span>
        </div>

        {/* Card 3: Flashcard */}
        <div className="grid-card-figma" onClick={() => setActiveTab("flashcard")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#F59E0B" }}>
            <Zap size={22} />
          </div>
          <span className="grid-card-label">Flashcard</span>
        </div>

        {/* Card 4: Kiểm tra */}
        <div className="grid-card-figma" onClick={() => setActiveTab("quiz")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#EF4444" }}>
            <ClipboardList size={22} />
          </div>
          <span className="grid-card-label">Kiểm tra</span>
        </div>
      </div>

      {/* Stats Section: Tiến độ học tập */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h2 className="section-title" style={{ fontSize: "1rem", color: "#1E3A5F", fontWeight: "800", margin: 0 }}>Tiến độ học tập</h2>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "#CBD5E1", fontWeight: "600", padding: "2px 0" }}
          >
            <Trash2 size={11} />
            Xóa tiến độ
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Xóa tất cả?</span>
            <button
              onClick={() => { onResetStats?.(); setConfirmReset(false); }}
              style={{ fontSize: "0.72rem", fontWeight: "700", color: "white", background: "#EF4444", border: "none", borderRadius: "5px", padding: "2px 8px", cursor: "pointer" }}
            >
              Xóa
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748B", background: "#F1F5F9", border: "none", borderRadius: "5px", padding: "2px 8px", cursor: "pointer" }}
            >
              Hủy
            </button>
          </div>
        )}
      </div>
      <div className="stats-card-container">
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#3B82F6" }}>{stats.formulasViewed}</div>
          <div className="stat-column-lbl">Công thức đã xem</div>
        </div>
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#10B981" }}>{stats.flashcardsStudied}</div>
          <div className="stat-column-lbl">Flashcard đã học</div>
        </div>
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#F59E0B" }}>{stats.quizzesCompleted}</div>
          <div className="stat-column-lbl">Quiz đã hoàn thành</div>
        </div>
      </div>

      {/* Gợi ý hôm nay Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <h2 className="section-title" style={{ fontSize: "1rem", color: "#1E3A5F", marginBottom: 0, fontWeight: "800" }}>Gợi ý hôm nay</h2>
        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "600" }}>Dựa trên lịch sử học</span>
      </div>

      <div className="rec-stack-list">
        {recommendedFormulas.map((formula) => (
          <div 
            key={formula.id} 
            className="rec-list-item"
            onClick={() => onViewDetail(formula)}
          >
            <div className="rec-item-left">
              <div 
                className="rec-square-avatar" 
                style={{ 
                  width: "38px", 
                  height: "38px", 
                  borderRadius: "8px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  backgroundColor: "rgba(59, 130, 246, 0.08)", 
                  color: "#3B82F6" 
                }}
              >
                <LayoutGrid size={18} />
              </div>
              <div>
                <span className="rec-item-title">{formula.name}</span>
                <div className="rec-item-topic">{formula.topic}</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#cbd5e1" }} />
          </div>
        ))}
      </div>

      {/* Limit quota progress indicator card */}
      <div className="quota-progress-card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="quota-header-text">
            <Crown size={14} style={{ color: "#F59E0B" }} />
            <span>Còn {isPremium ? "Không giới hạn" : `${remainingQuizzes}/10`} quiz miễn phí hôm nay</span>
          </div>
        </div>

        <div className="quota-progress-track">
          <div className="quota-progress-bar" style={{ width: isPremium ? "100%" : `${(remainingQuizzes / 10) * 100}%` }} />
        </div>

        {/* Inner gold banner */}
        <div 
          className="quota-gold-banner"
          onClick={() => setActiveTab("premium")}
          style={{
            backgroundColor: "#FFFBEB",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            padding: "12px 16px",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "700",
            color: "#1E3A5F",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Gem size={14} style={{ color: "#F59E0B" }} />
            <span style={{ color: "#1E3A5F", fontWeight: "700" }}>Mở khóa không giới hạn với Premium</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#F59E0B", fontWeight: "800" }}>
            <span>49.000 đ/tháng</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

    </div>
  );
}
