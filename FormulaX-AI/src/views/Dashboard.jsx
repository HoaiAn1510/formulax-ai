import React from "react";
import { BookOpen, Search, Zap, ClipboardList, Crown, ChevronRight, LayoutGrid, Gem, BarChart2 } from "lucide-react";
import { MathElement } from "../utils/katexHelper";
import { gradients, glow, glassCard, glassCardSm, orbs, orbStyle, pageWrapper, contentLayer } from "../styles/theme";

export default function Dashboard({
  user,
  displayName,
  setActiveTab,
  formulas,
  onViewDetail,
  isPremium,
  remainingQuizzes,
  stats,
  todayStats,
}) {
  const firstName = displayName || user?.name?.split(" ").slice(-1)[0] || "bạn";
  // Recommend 3 math formulas based on ID
  const recommendedFormulas = formulas.filter(f => 
    f.id === "gt12-daoham-mu" || 
    f.id === "xs11-xacsuat" || 
    f.id === "ds10-phuongtrinh-bac2"
  );

  return (
    <div className="view-container">
      <div style={pageWrapper}>
        {orbs.map((orb, idx) => (
          <div key={idx} style={orbStyle(orb)} />
        ))}
        <div style={contentLayer}>
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
        <div className="grid-card-figma" style={glassCard} onClick={() => setActiveTab("library")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", color: "#3B82F6" }}>
            <BookOpen size={22} />
          </div>
          <span className="grid-card-label">Thư viện</span>
        </div>

        {/* Card 2: Tìm kiếm AI */}
        <div className="grid-card-figma" style={glassCard} onClick={() => setActiveTab("finder")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#10B981" }}>
            <Search size={22} />
          </div>
          <span className="grid-card-label">Tìm kiếm AI</span>
        </div>

        {/* Card 3: Flashcard */}
        <div className="grid-card-figma" style={glassCard} onClick={() => setActiveTab("flashcard")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#F59E0B" }}>
            <Zap size={22} />
          </div>
          <span className="grid-card-label">Flashcard</span>
        </div>

        {/* Card 4: Kiểm tra */}
        <div className="grid-card-figma" style={glassCard} onClick={() => setActiveTab("quiz")}>
          <div className="grid-circle-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#EF4444" }}>
            <ClipboardList size={22} />
          </div>
          <span className="grid-card-label">Kiểm tra</span>
        </div>
      </div>

      {/* Analytics CTA Banner */}
      <div
        onClick={() => setActiveTab("progress")}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: gradients.purpleBanner,
          borderRadius: "18px", padding: "13px 16px", cursor: "pointer",
          color: "white", marginBottom: "16px",
          boxShadow: glow.purple,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "rgba(255,255,255,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <BarChart2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: "700" }}>Xem tiến độ học tập</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75, marginTop: "1px" }}>
              Phân tích điểm mạnh · yếu · gợi ý ôn tập
            </div>
          </div>
        </div>
        <ChevronRight size={18} style={{ opacity: 0.7, flexShrink: 0 }} />
      </div>

      {/* Stats Section: Tiến độ học tập */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h2 className="section-title" style={{ fontSize: "1rem", color: "#1E3A5F", fontWeight: "800", margin: 0 }}>Hôm nay</h2>
      </div>
      <div className="stats-card-container" style={glassCard}>
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#3B82F6" }}>{todayStats?.formulasViewed ?? 0}</div>
          <div className="stat-column-lbl">Công thức xem</div>
        </div>
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#10B981" }}>{todayStats?.flashcardsStudied ?? 0}</div>
          <div className="stat-column-lbl">Flashcard đã ôn</div>
        </div>
        <div className="stat-column">
          <div className="stat-column-val" style={{ color: "#F59E0B" }}>{todayStats?.quizzesCompleted ?? 0}</div>
          <div className="stat-column-lbl">Quiz hôm nay</div>
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
            style={glassCardSm}
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
      <div className="quota-progress-card" style={{ ...glassCard, marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="quota-header-text">
            <Crown size={14} style={{ color: "#F59E0B" }} />
            <span>Còn {isPremium ? "Không giới hạn" : `${remainingQuizzes}/10`} quiz miễn phí hôm nay</span>
          </div>
        </div>

        <div className="quota-progress-track">
          <div className="quota-progress-bar" style={{ width: isPremium ? "100%" : `${(remainingQuizzes / 10) * 100}%`, background: gradients.premiumProgressBar }} />
        </div>

        {/* Inner gold banner */}
        <div 
          className="quota-gold-banner"
          onClick={() => setActiveTab("premium")}
          style={{
            background: gradients.orangeBanner,
            border: "none",
            padding: "12px 16px",
            borderRadius: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "700",
            color: "white",
            boxShadow: glow.orange,
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Gem size={14} style={{ color: "white" }} />
            <span style={{ color: "white", fontWeight: "700" }}>Mở khóa không giới hạn với Premium</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "white", fontWeight: "800" }}>
            <span>49.000 đ/tháng</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
