import React, { useState, useRef, useEffect } from "react";
import {
  Layers, ArrowLeft, ArrowRight, RotateCw, CheckCircle, AlertTriangle,
  Plus, FileDown, Lock, ChevronRight, Book, HelpCircle, BarChart3, Clock,
  Eye, Heart, Pencil, Trash2, X, Check, BookOpen, Star,
} from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { saveFlashcardActivity } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS = ["Tất cả", "Đại số", "Hình học", "Giải tích", "Xác suất & Tổ hợp"];
const GRADES = ["Tất cả", "Lớp 10", "Lớp 11", "Lớp 12"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFilteredFormulas(formulas, topics, grades) {
  return formulas.filter(f => {
    const matchTopic = topics.length === 0 || topics.includes(f.topic);
    const matchGrade = grades.length === 0 || grades.includes(`Lớp ${f.grade}`);
    return matchTopic && matchGrade;
  });
}

function buildDeckName(topics, grades) {
  const tLabel = topics.length === 0 ? "Tất cả" : topics.join(" & ");
  const gLabel = grades.length === 0 ? null : grades.join(" & ");
  return gLabel ? `${tLabel} · ${gLabel}` : tLabel;
}

// ─── Create Filtered Deck Modal ───────────────────────────────────────────────

function CreateFilteredDeckModal({ formulas, onClose, onConfirm }) {
  const [selTopics, setSelTopics] = useState([]);  // empty = Tất cả
  const [selGrades, setSelGrades] = useState([]);  // empty = Tất cả

  const matched = getFilteredFormulas(formulas, selTopics, selGrades);

  const toggleTopic = (t) => {
    if (t === "Tất cả") { setSelTopics([]); return; }
    setSelTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleGrade = (g) => {
    if (g === "Tất cả") { setSelGrades([]); return; }
    setSelGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const isTopicActive = (t) => t === "Tất cả" ? selTopics.length === 0 : selTopics.includes(t);
  const isGradeActive = (g) => g === "Tất cả" ? selGrades.length === 0 : selGrades.includes(g);

  const handleCreate = () => {
    const now = new Date().toISOString();
    const deck = {
      id: Date.now().toString(),
      type: "filtered",
      name: buildDeckName(selTopics, selGrades),
      topic: selTopics.length === 1 ? selTopics[0] : null,
      grade: selGrades.length === 1 ? parseInt(selGrades[0].replace("Lớp ", "")) : null,
      formulaIds: matched.map(f => f.id),
      createdAt: now,
      updatedAt: now,
    };
    onConfirm(deck);
  };

  const chipStyle = (active) => ({
    padding:"6px 14px", borderRadius:"20px", fontSize:"0.8rem", fontWeight:"600",
    border: active ? "1.5px solid #3B82F6" : "1.5px solid #E2E8F0",
    background: active ? "#EFF6FF" : "white",
    color: active ? "#3B82F6" : "#64748B",
    cursor:"pointer", transition:"all 0.15s",
  });

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
      onClick={onClose}
    >
      <div
        style={{ background:"white", borderRadius:"16px", padding:"24px", width:"100%", maxWidth:"420px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize:"1.1rem", fontWeight:"800", color:"#1E3A5F", marginBottom:"4px" }}>Tạo bộ thẻ theo chủ đề</h3>
        <p style={{ fontSize:"0.8rem", color:"#64748B", marginBottom:"20px" }}>Chọn nhiều chủ đề và lớp để tạo bộ thẻ tự động</p>

        {/* Topic chips — multi-select */}
        <div style={{ marginBottom:"16px" }}>
          <p style={{ fontSize:"0.8rem", fontWeight:"700", color:"#1E3A5F", marginBottom:"8px" }}>Chủ đề</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {TOPICS.map(t => (
              <button key={t} onClick={() => toggleTopic(t)} style={chipStyle(isTopicActive(t))}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Grade chips — multi-select */}
        <div style={{ marginBottom:"20px" }}>
          <p style={{ fontSize:"0.8rem", fontWeight:"700", color:"#1E3A5F", marginBottom:"8px" }}>Lớp</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {GRADES.map(g => (
              <button key={g} onClick={() => toggleGrade(g)} style={chipStyle(isGradeActive(g))}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:"#F8FAFC", borderRadius:"10px", padding:"12px 16px", marginBottom:"20px", textAlign:"center" }}>
          <span style={{ fontSize:"0.85rem", fontWeight:"600", color:"#64748B" }}>
            Bộ thẻ sẽ gồm{" "}
            <strong style={{ color:"#1E3A5F", fontSize:"1rem" }}>{matched.length}</strong>
            {" "}công thức
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:"10px" }}>
          <button
            onClick={onClose}
            style={{ flex:1, padding:"11px", border:"1.5px solid #E2E8F0", borderRadius:"10px", background:"white", cursor:"pointer", fontSize:"0.875rem", color:"#64748B", fontWeight:"600" }}
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={matched.length === 0}
            style={{
              flex:2, padding:"11px", borderRadius:"10px", fontSize:"0.875rem", fontWeight:"700",
              background: matched.length === 0 ? "#E2E8F0" : "#3B82F6",
              color: matched.length === 0 ? "#94A3B8" : "white",
              border:"none", cursor: matched.length === 0 ? "not-allowed" : "pointer",
              transition:"all 0.15s",
            }}
          >
            Tạo bộ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FlashcardView({
  formulas,
  setActiveTab,
  isPremium,
  stats,
  setStats,
  user,
  decks = [],
  onAddDeck,
  onDeleteDeck,
  onRenameDeck,
  onRemoveFormula,
}) {
  // view: "list" | "study" | "summary"
  const [view, setView] = useState("list");
  const [activeDeckId, setActiveDeckId] = useState(null);

  // Study session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // UI state
  const [showCreateFiltered, setShowCreateFiltered] = useState(false);
  const [renamingDeckId, setRenamingDeckId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (renamingDeckId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingDeckId]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const activeDeck = decks.find(d => d.id === activeDeckId) || null;

  // Cards for the active deck
  const cards = activeDeck
    ? activeDeck.formulaIds.map(id => formulas.find(f => f.id === id)).filter(Boolean)
    : [];

  const currentCard = cards[currentIndex] || null;

  // ─── Handlers: deck list ──────────────────────────────────────────────────

  const handleStartDeck = (deckId) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    setActiveDeckId(deckId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setView("study");
  };

  const handleCreateFilteredDeck = (deck) => {
    onAddDeck(deck);
    setShowCreateFiltered(false);
  };

  const handleCreateFavoriteDeck = () => {
    const now = new Date().toISOString();
    const existingFav = decks.filter(d => d.type === "favorite");
    const deck = {
      id: Date.now().toString(),
      type: "favorite",
      name: `Yêu thích ${existingFav.length + 1}`,
      topic: null,
      grade: null,
      formulaIds: [],
      createdAt: now,
      updatedAt: now,
    };
    onAddDeck(deck);
  };

  const handleStartRename = (deck) => {
    setRenamingDeckId(deck.id);
    setRenameValue(deck.name);
  };

  const handleConfirmRename = () => {
    if (renamingDeckId && renameValue.trim()) {
      onRenameDeck(renamingDeckId, renameValue.trim());
    }
    setRenamingDeckId(null);
    setRenameValue("");
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") handleConfirmRename();
    if (e.key === "Escape") { setRenamingDeckId(null); setRenameValue(""); }
  };

  // ─── Handlers: study session ──────────────────────────────────────────────

  const handleGrade = (remembered) => {
    if (remembered) setRememberedCount(prev => prev + 1);
    else setReviewCount(prev => prev + 1);

    setStats(prev => ({ ...prev, flashcardsStudied: prev.flashcardsStudied + 1 }));

    if (user?.googleId && currentCard) {
      saveFlashcardActivity(user.googleId, {
        formulaId: currentCard.id,
        result: remembered ? "remembered" : "review",
        topic: currentCard.topic,
        grade: currentCard.grade,
      }).catch(console.error);
    }

    setIsFlipped(false);

    setTimeout(() => {
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setView("summary");
      }
    }, 200);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setView("summary");
    }
  };

  const handleRestartDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setView("study");
  };

  const handleRemoveFromDeck = () => {
    if (!currentCard || !activeDeckId) return;
    onRemoveFormula(currentCard.id, activeDeckId);
    // Move to next card or end session
    setIsFlipped(false);
    const newCards = cards.filter(c => c.id !== currentCard.id);
    if (newCards.length === 0) {
      setView("list");
    } else if (currentIndex >= newCards.length) {
      setCurrentIndex(newCards.length - 1);
    }
    // currentIndex stays the same — new card at same index will appear
  };

  const handlePdfExport = () => {
    if (!isPremium) {
      setActiveTab("premium");
    } else {
      alert("Tính năng Pro: Đang xuất danh sách Flashcard của bạn ra file PDF...");
    }
  };

  // ─── LIST VIEW ────────────────────────────────────────────────────────────

  if (view === "list") {
    const filteredDecks = decks.filter(d => d.type === "filtered");
    const favoriteDecks = decks.filter(d => d.type === "favorite");
    const hasDecks = decks.length > 0;

    return (
      <div className="view-container">
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
          <button className="breadcrumb-back" onClick={() => setActiveTab("dashboard")} style={{ marginBottom:0 }}>
            <ArrowLeft size={12} />
            <span>Về trang chủ</span>
          </button>
        </div>

        <div style={{ marginBottom:"20px" }}>
          <h2 style={{ fontSize:"1.6rem", fontWeight:"800", color:"#1E3A5F", letterSpacing:"-0.5px" }}>
            Flashcard
          </h2>
          <p style={{ fontSize:"0.85rem", color:"#64748B", fontWeight:"500", marginTop:"4px" }}>
            Học công thức qua thẻ ghi nhớ
          </p>
        </div>

        {/* EMPTY STATE */}
        {!hasDecks && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", textAlign:"center", gap:"12px" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(59,130,246,0.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"8px" }}>
              <Layers size={36} color="#3B82F6" />
            </div>
            <h3 style={{ fontSize:"1.15rem", fontWeight:"800", color:"#1E3A5F", margin:0 }}>Chưa có bộ thẻ nào</h3>
            <p style={{ fontSize:"0.85rem", color:"#64748B", maxWidth:"280px", lineHeight:"1.5", margin:0 }}>
              Tạo bộ thẻ theo chủ đề để ôn tập có hệ thống, hoặc tạo bộ yêu thích để tự chọn công thức.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"300px", marginTop:"8px" }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateFiltered(true)}
                style={{ width:"100%", justifyContent:"center" }}
              >
                <Layers size={15} />
                <span>Tạo theo chủ đề</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCreateFavoriteDeck}
                style={{ width:"100%", justifyContent:"center" }}
              >
                <Heart size={15} />
                <span>Tạo bộ yêu thích</span>
              </button>
            </div>
          </div>
        )}

        {/* DECK LIST */}
        {hasDecks && (
          <div>
            {/* Filtered decks section */}
            {filteredDecks.length > 0 && (
              <div style={{ marginBottom:"20px" }}>
                <p style={{ fontSize:"0.75rem", fontWeight:"700", color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"10px" }}>
                  Theo chủ đề
                </p>
                <div className="deck-stack-list">
                  {filteredDecks.map(deck => (
                    <div
                      key={deck.id}
                      className="deck-list-card-figma"
                      onClick={() => {
                        if (renamingDeckId === deck.id) return;
                        if (deck.formulaIds.length === 0) return;
                        handleStartDeck(deck.id);
                      }}
                      style={{ cursor: deck.formulaIds.length === 0 ? "default" : "pointer", opacity: deck.formulaIds.length === 0 ? 0.6 : 1 }}
                    >
                      <div className="deck-card-left">
                        <div className="deck-circle-avatar" style={{ backgroundColor:"rgba(59,130,246,0.1)", color:"#3B82F6" }}>
                          <BarChart3 size={20} />
                        </div>
                        <div>
                          <h3 className="deck-card-name">{deck.name}</h3>
                          <div className="deck-card-stats">{deck.formulaIds.length} thẻ</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                        {deck.topic && (
                          <span className="tag tag-blue" style={{ fontSize:"0.7rem", padding:"2px 8px" }}>{deck.topic}</span>
                        )}
                        {deck.grade && (
                          <span className="tag" style={{ fontSize:"0.7rem", padding:"2px 8px", background:"#F1F5F9", color:"#475569" }}>Lớp {deck.grade}</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                          title="Xoá bộ thẻ"
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", color:"#CBD5E1", borderRadius:"6px", display:"flex", alignItems:"center" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite decks section */}
            {favoriteDecks.length > 0 && (
              <div style={{ marginBottom:"20px" }}>
                <p style={{ fontSize:"0.75rem", fontWeight:"700", color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"10px" }}>
                  Yêu thích
                </p>
                <div className="deck-stack-list">
                  {favoriteDecks.map(deck => (
                    <div
                      key={deck.id}
                      className="deck-list-card-figma"
                      onClick={() => {
                        if (renamingDeckId === deck.id) return;
                        if (deck.formulaIds.length === 0) return;
                        handleStartDeck(deck.id);
                      }}
                      style={{ cursor: deck.formulaIds.length === 0 ? "default" : "pointer", opacity: deck.formulaIds.length === 0 ? 0.6 : 1 }}
                    >
                      <div className="deck-card-left" style={{ flex:1, minWidth:0 }}>
                        <div className="deck-circle-avatar" style={{ backgroundColor:"rgba(239,68,68,0.08)", color:"#EF4444" }}>
                          <Heart size={20} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          {renamingDeckId === deck.id ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={handleRenameKeyDown}
                              onBlur={handleConfirmRename}
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize:"0.9rem", fontWeight:"700", color:"#1E3A5F", border:"1.5px solid #3B82F6", borderRadius:"6px", padding:"2px 8px", width:"100%", outline:"none", background:"white" }}
                            />
                          ) : (
                            <h3 className="deck-card-name">{deck.name}</h3>
                          )}
                          <div className="deck-card-stats">
                            {deck.formulaIds.length === 0 ? "Chưa có thẻ — thêm từ Thư viện" : `${deck.formulaIds.length} thẻ`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        <button
                          onClick={e => { e.stopPropagation(); handleStartRename(deck); }}
                          title="Đổi tên"
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", color:"#CBD5E1", borderRadius:"6px", display:"flex", alignItems:"center" }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                          title="Xoá bộ thẻ"
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", color:"#CBD5E1", borderRadius:"6px", display:"flex", alignItems:"center" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add buttons */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginTop:"8px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateFiltered(true)}
                style={{ width:"100%", justifyContent:"center", borderStyle:"dashed" }}
              >
                <Plus size={15} />
                <span>Thêm bộ theo chủ đề</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCreateFavoriteDeck}
                style={{ width:"100%", justifyContent:"center", borderStyle:"dashed" }}
              >
                <Plus size={15} />
                <span>Thêm bộ yêu thích</span>
              </button>
            </div>
          </div>
        )}

        {/* Create Filtered Deck Modal */}
        {showCreateFiltered && (
          <CreateFilteredDeckModal
            formulas={formulas}
            onClose={() => setShowCreateFiltered(false)}
            onConfirm={handleCreateFilteredDeck}
          />
        )}
      </div>
    );
  }

  // ─── STUDY VIEW ───────────────────────────────────────────────────────────

  if (view === "study") {
    // No cards in deck
    if (cards.length === 0) {
      return (
        <div className="view-container">
          <div className="summary-card">
            <HelpCircle size={32} />
            <h2>Bộ thẻ trống</h2>
            <p>Không có công thức nào trong bộ thẻ này.</p>
            <button className="btn btn-primary" onClick={() => setView("list")}>
              Quay lại danh sách
            </button>
          </div>
        </div>
      );
    }

    const isFavoriteDeck = activeDeck?.type === "favorite";

    return (
      <div className="view-container">
        <div className="flashcard-study-container">
          <div className="study-header">
            <button className="back-to-decks" onClick={() => setView("list")}>
              <ArrowLeft size={14} />
              <span>Danh sách bộ thẻ</span>
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
                  <span className="tag" style={{ background:"#f1f5f9", color:"#1E3A5F" }}>
                    Lớp {currentCard.grade} • {currentCard.topic}
                  </span>
                  <div className="card-title-main">{currentCard.name}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.75rem", color:"#64748B", fontWeight:"700" }}>
                  <RotateCw size={12} /> Chạm để lật
                </div>
              </div>

              {/* Back */}
              <div className="card-face back">
                <span className="card-hint" style={{ color:"#3B82F6" }}>Mặt sau - Công thức</span>
                <div className="card-content-back">
                  <div className="formula-display-box" style={{ width:"100%" }}>
                    <MathElement math={currentCard.latex} block={true} />
                  </div>
                  <div style={{ fontSize:"0.8rem", color:"#475569", textAlign:"left", width:"100%", overflowX:"auto" }}>
                    <strong>Giải thích:</strong>
                    <div style={{ marginTop:"2px" }}>
                      <RichTextRenderer text={currentCard.explanation} />
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.75rem", color:"#64748B", fontWeight:"700" }}>
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
            <span style={{ fontSize:"0.8rem", color:"#64748B", fontWeight:"700", alignSelf:"center" }}>
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

          {/* Remove from favorite deck button */}
          {isFavoriteDeck && isFlipped && (
            <div style={{ marginTop:"8px", textAlign:"center" }}>
              <button
                onClick={e => { e.stopPropagation(); handleRemoveFromDeck(); }}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.75rem", color:"#EF4444", fontWeight:"600", display:"inline-flex", alignItems:"center", gap:"4px", padding:"4px 8px", borderRadius:"6px" }}
              >
                <X size={13} />
                Xóa khỏi bộ này
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SUMMARY VIEW ─────────────────────────────────────────────────────────

  if (view === "summary") {
    return (
      <div className="view-container">
        <div className="summary-card">
          <div className="summary-icon">
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize:"1.3rem", fontWeight:"800", color:"#1E3A5F" }}>Hoàn thành bộ thẻ!</h2>
          <p style={{ fontSize:"0.85rem", color:"#64748B" }}>
            Bạn đã ôn tập xong bộ thẻ <strong>{activeDeck?.name}</strong>.
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

          <div style={{ fontSize:"0.9rem", fontWeight:"800", color:"#1E3A5F" }}>
            Tỷ lệ ghi nhớ: {cards.length > 0 ? Math.round((rememberedCount / cards.length) * 100) : 0}%
          </div>

          <div className="summary-actions">
            <div className="locked-btn-container">
              <button
                className={`btn ${isPremium ? "btn-primary" : "btn-secondary"}`}
                style={{ width:"100%" }}
                onClick={handlePdfExport}
              >
                <FileDown size={16} />
                <span>Xuất tài liệu ôn tập PDF/Ảnh</span>
                {!isPremium && <Lock size={14} style={{ marginLeft:"4px", color:"#F59E0B" }} />}
              </button>
              {!isPremium && <span className="locked-badge-overlay">Pro</span>}
            </div>

            <button className="btn btn-primary" onClick={handleRestartDeck}>
              Luyện tập lại
            </button>

            <button className="btn btn-secondary" onClick={() => setView("list")}>
              Về danh sách bộ thẻ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
