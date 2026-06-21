import React, { useState } from "react";
import { Layers, ArrowLeft, ArrowRight, RotateCw, CheckCircle, AlertTriangle, Plus, FileDown, Lock, ChevronRight, Book, HelpCircle, BarChart3, Clock, Eye } from "lucide-react";
import { MathElement } from "../utils/katexHelper";

export default function FlashcardView({
  formulas,
  setActiveTab,
  isPremium,
  stats,
  setStats,
  viewedFormulaIds = [],
}) {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Deck "Đã xem" — sắp xếp theo thứ tự đã xem (viewedFormulaIds: mới nhất trước)
  const viewedFormulas = viewedFormulaIds
    .map(id => formulas.find(f => f.id === id))
    .filter(Boolean);

  const deckDefs = [
    // Deck "Đã xem" — chỉ hiện khi có ít nhất 1 công thức đã xem
    ...(viewedFormulas.length > 0 ? [{
      id: "viewed",
      name: "Đã xem",
      tags: ["Đã xem"],
      icon: Eye,
      color: "#8B5CF6",
      bgColor: "rgba(139,92,246,0.08)",
      filter: (f) => viewedFormulaIds.includes(f.id),
    }] : []),
    { id: "ds",   name: "Đại số",               tags: ["Đại số"],            icon: Book,    color: "#3B82F6", bgColor: "rgba(59,130,246,0.08)",   filter: (f) => f.topic === "Đại số" },
    { id: "hh",   name: "Hình học",              tags: ["Hình học"],          icon: Layers,  color: "#10B981", bgColor: "rgba(16,185,129,0.08)",   filter: (f) => f.topic === "Hình học" },
    { id: "gt",   name: "Giải tích",             tags: ["Giải tích"],         icon: BarChart3,color: "#F59E0B", bgColor: "rgba(245,158,11,0.08)",  filter: (f) => f.topic === "Giải tích" },
    { id: "xs",   name: "Xác suất & Tổ hợp",    tags: ["Xác suất","Tổ hợp"],icon: Clock,   color: "#EF4444", bgColor: "rgba(239,68,68,0.08)",    filter: (f) => f.topic === "Xác suất & Tổ hợp" },
  ];

  const decks = deckDefs.map((d) => ({
    ...d,
    count: formulas.filter(d.filter).length,
  }));

  const activeDeckData = selectedDeck ? decks.find(d => d.id === selectedDeck) : null;
  // Deck "viewed" dùng thứ tự đã xem (mới nhất trước), deck khác filter bình thường
  const cards = activeDeckData
    ? (activeDeckData.id === "viewed" ? viewedFormulas : formulas.filter(activeDeckData.filter))
    : [];
  const currentCard = cards[currentIndex];

  const handleStartDeck = (deckId) => {
    setSelectedDeck(deckId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setSessionFinished(false);
  };

  const handleGrade = (remembered) => {
    if (remembered) {
      setRememberedCount(prev => prev + 1);
    } else {
      setReviewCount(prev => prev + 1);
    }

    setStats(prev => ({
      ...prev,
      flashcardsStudied: prev.flashcardsStudied + 1
    }));

    setIsFlipped(false);

    setTimeout(() => {
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionFinished(true);
      }
    }, 200);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 200);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 200);
    } else {
      setSessionFinished(true);
    }
  };

  const handlePdfExport = () => {
    if (!isPremium) {
      setActiveTab("premium");
    } else {
      alert("Tính năng Pro: Đang xuất danh sách Flashcard của bạn ra file PDF...");
    }
  };

  return (
    <div className="view-container">
      {/* 1. DECK SELECTION VIEW (Figma stacked list layout) */}
      {!selectedDeck && (
        <div>
          {/* Header Action bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <button className="breadcrumb-back" onClick={() => setActiveTab("dashboard")} style={{ marginBottom: 0 }}>
              <ArrowLeft size={12} />
              <span>Về trang chủ</span>
            </button>
            
            <button 
              className="btn btn-primary" 
              onClick={() => alert("Đang tải dữ liệu học tập cá nhân...")}
              style={{ fontSize: "0.8rem", padding: "6px 14px", minHeight: "36px", borderRadius: "8px" }}
            >
              <Plus size={12} />
              <span>Tạo bộ mới</span>
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1E3A5F", letterSpacing: "-0.5px" }}>
              Flashcard
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500", marginTop: "4px" }}>
              Học công thức qua thẻ ghi nhớ
            </p>
          </div>

          {/* Stacks List */}
          <div className="deck-stack-list">
            {decks.map((deck) => {
              const DeckIcon = deck.icon;
              return (
                <div 
                  key={deck.id} 
                  className="deck-list-card-figma"
                  onClick={() => handleStartDeck(deck.id)}
                >
                  <div className="deck-card-left">
                    <div className="deck-circle-avatar" style={{ backgroundColor: deck.bgColor, color: deck.color }}>
                      <DeckIcon size={20} />
                    </div>
                    <div>
                      <h3 className="deck-card-name">{deck.name}</h3>
                      <div className="deck-card-stats">
                        {deck.count} thẻ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {deck.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="tag tag-blue" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                        {tag}
                      </span>
                    ))}
                    <ChevronRight size={18} style={{ color: "#cbd5e1" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. STUDY PLAY INTERFACE */}
      {selectedDeck && !sessionFinished && cards.length > 0 && (
        <div className="flashcard-study-container">
          <div className="study-header">
            <button className="back-to-decks" onClick={() => setSelectedDeck(null)}>
              <ArrowLeft size={14} />
              <span>Quay lại</span>
            </button>
            <span className="card-counter">
              Thẻ: {currentIndex + 1} / {cards.length}
            </span>
          </div>

          {/* 3D Flip Card */}
          <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`card-3d ${isFlipped ? "flipped" : ""}`}>
              {/* Front */}
              <div className="card-face front">
                <span className="card-hint">Mặt trước - Tên công thức</span>
                <div className="card-content-front">
                  <span className="tag" style={{ background: "#f1f5f9", color: "#1E3A5F" }}>
                    Lớp {currentCard.grade} • {currentCard.topic}
                  </span>
                  <div className="card-title-main">{currentCard.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#64748B", fontWeight: "700" }}>
                  <RotateCw size={12} /> Chạm để lật
                </div>
              </div>

              {/* Back */}
              <div className="card-face back">
                <span className="card-hint" style={{ color: "#3B82F6" }}>Mặt sau - Công thức</span>
                <div className="card-content-back">
                  <div className="formula-display-box" style={{ width: "100%" }}>
                    <MathElement math={currentCard.latex} block={true} />
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#475569", textAlign: "left", width: "100%", maxHeight: "100px", overflowY: "auto" }}>
                    <strong>Giải thích:</strong>
                    <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                      {currentCard.explanation.replace(/\$/g, "")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#64748B", fontWeight: "700" }}>
                  <RotateCw size={12} /> Chạm để lật lại
                </div>
              </div>
            </div>
          </div>

          {/* Arrows */}
          <div className="nav-arrows">
            <button className="arrow-btn" onClick={handlePrev} disabled={currentIndex === 0}>
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", alignSelf: "center" }}>
              Lật thẻ xem đáp án trước khi chấm
            </span>
            <button className="arrow-btn" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Grading panel */}
          {isFlipped && (
            <div className="grading-panel">
              <button className="btn btn-error" onClick={() => handleGrade(false)}>
                <AlertTriangle size={16} />
                <span>Cần ôn thêm</span>
              </button>
              <button className="btn btn-success" onClick={() => handleGrade(true)}>
                <CheckCircle size={16} />
                <span>Nhớ rồi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. SUMMARY REPORT */}
      {selectedDeck && sessionFinished && (
        <div className="summary-card">
          <div className="summary-icon">
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1E3A5F" }}>Hoàn thành bộ thẻ!</h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B" }}>
            Bạn đã ôn tập xong bộ thẻ <strong>{activeDeckData?.name}</strong>.
          </p>

          <div className="summary-stats-grid">
            <div className="summary-stat-box">
              <div className="summary-stat-val good">{rememberedCount}</div>
              <div className="summary-stat-lbl">Đã nhớ tốt</div>
            </div>
            <div className="summary-stat-box">
              <div className="summary-stat-val retry">{reviewCount}</div>
              <div className="summary-stat-lbl">Cần ôn thêm</div>
            </div>
          </div>

          <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#1E3A5F" }}>
            Tỷ lệ ghi nhớ: {Math.round((rememberedCount / cards.length) * 100)}%
          </div>

          <div className="summary-actions">
            <div className="locked-btn-container">
              <button 
                className={`btn ${isPremium ? "btn-primary" : "btn-secondary"}`}
                style={{ width: "100%" }}
                onClick={handlePdfExport}
              >
                <FileDown size={16} />
                <span>Xuất tài liệu ôn tập PDF/Ảnh</span>
                {!isPremium && <Lock size={14} style={{ marginLeft: "4px", color: "#F59E0B" }} />}
              </button>
              {!isPremium && <span className="locked-badge-overlay">Pro</span>}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleStartDeck(selectedDeck)}
            >
              Luyện tập lại bộ này
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedDeck(null)}
            >
              Chọn bộ thẻ khác
            </button>
          </div>
        </div>
      )}

      {selectedDeck && cards.length === 0 && (
        <div className="summary-card">
          <HelpCircle size={32} />
          <h2>Bộ thẻ trống</h2>
          <p>Không có công thức nào trong bộ thẻ này.</p>
          <button className="btn btn-primary" onClick={() => setSelectedDeck(null)}>
            Quay lại chọn bộ khác
          </button>
        </div>
      )}
    </div>
  );
}
