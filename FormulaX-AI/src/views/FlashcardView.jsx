import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Layers, ArrowLeft, ArrowRight, RotateCw, CheckCircle, AlertTriangle,
  Plus, FileDown, Lock, ChevronRight, Book, HelpCircle, BarChart3, Clock,
  Eye, Heart, Pencil, Trash2, X, Check, BookOpen, Star, Sparkles,
} from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { saveFlashcardActivity } from "../lib/supabase";
import { sortFormulaIdsByDue, getDueReviewQueue } from "../utils/spacedRepetition";
import { showToast } from "../components/Toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS = ["Tất cả", "Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất & Thống kê", "Mở rộng"];
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
  const tLabel = topics.length === 0 ? "Tất cả" : [...topics].sort().join(" & ");
  const gLabel = grades.length === 0 ? null : [...grades].sort().join(" & ");
  return gLabel ? `${tLabel} · ${gLabel}` : tLabel;
}

function isSameFormulaSet(idsA, idsB) {
  if (idsA.length !== idsB.length) return false;
  const setA = new Set(idsA);
  return idsB.every(id => setA.has(id));
}

// ─── Create Filtered Deck Modal ───────────────────────────────────────────────

function CreateFilteredDeckModal({ formulas, existingDecks, onClose, onConfirm }) {
  const [selTopics, setSelTopics] = useState([]);  // empty = Tất cả
  const [selGrades, setSelGrades] = useState([]);  // empty = Tất cả
  const [dupError, setDupError] = useState("");

  const matched = getFilteredFormulas(formulas, selTopics, selGrades);

  const toggleTopic = (t) => {
    if (t === "Tất cả") { setSelTopics([]); } else {
      setSelTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    }
    setDupError("");
  };

  const toggleGrade = (g) => {
    if (g === "Tất cả") { setSelGrades([]); } else {
      setSelGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    }
    setDupError("");
  };

  const isTopicActive = (t) => t === "Tất cả" ? selTopics.length === 0 : selTopics.includes(t);
  const isGradeActive = (g) => g === "Tất cả" ? selGrades.length === 0 : selGrades.includes(g);

  const handleCreate = () => {
    const now = new Date().toISOString();
    const name = buildDeckName(selTopics, selGrades);
    const newFormulaIds = matched.map(f => f.id);
    const isDuplicate = existingDecks.some(d => isSameFormulaSet(d.formulaIds, newFormulaIds));
    if (isDuplicate) {
      setDupError(`Bộ thẻ với nội dung này đã tồn tại. Vui lòng chọn chủ đề hoặc lớp khác.`);
      return;
    }
    const deck = {
      id: Date.now().toString(),
      type: "filtered",
      name,
      topic: selTopics.length === 1 ? selTopics[0] : null,
      grade: selGrades.length === 1 ? parseInt(selGrades[0].replace("Lớp ", "")) : null,
      formulaIds: matched.map(f => f.id),
      createdAt: now,
      updatedAt: now,
    };
    onConfirm(deck);
  };

  const chipClass = (active) =>
    `py-1.5 px-3.5 rounded-[20px] text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${
      active ? "border-accent bg-[#FEF3C7] text-accent" : "border-[#E2E8F0] bg-white text-text-muted"
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[1.1rem] font-extrabold text-[#1E3A5F] mb-1">Tạo bộ thẻ theo chủ đề</h3>
        <p className="text-[0.8rem] text-text-muted mb-5">Chọn nhiều chủ đề và lớp để tạo bộ thẻ tự động</p>

        {/* Topic chips — multi-select */}
        <div className="mb-4">
          <p className="text-[0.8rem] font-bold text-[#1E3A5F] mb-2">Chủ đề</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => toggleTopic(t)} className={chipClass(isTopicActive(t))}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Grade chips — multi-select */}
        <div className="mb-5">
          <p className="text-[0.8rem] font-bold text-[#1E3A5F] mb-2">Lớp</p>
          <div className="flex flex-wrap gap-2">
            {GRADES.map(g => (
              <button key={g} onClick={() => toggleGrade(g)} className={chipClass(isGradeActive(g))}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className={`bg-[#F8FAFC] rounded-[10px] py-3 px-4 text-center ${dupError ? "mb-2.5" : "mb-5"}`}>
          <span className="text-[0.85rem] font-semibold text-text-muted">
            Bộ thẻ sẽ gồm{" "}
            <strong className="text-[#1E3A5F] text-base">{matched.length}</strong>
            {" "}công thức
          </span>
        </div>

        {/* Duplicate error */}
        {dupError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg py-2.5 px-3 mb-3.5 text-[0.78rem] text-error font-semibold">
            ⚠️ {dupError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-[1.5px] border-[#E2E8F0] rounded-[10px] bg-white cursor-pointer text-[0.875rem] text-text-muted font-semibold"
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={matched.length === 0}
            className={`flex-[2] py-2.5 rounded-[10px] text-[0.875rem] font-bold border-none transition-all duration-150 ${
              matched.length === 0 ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed" : "bg-accent text-white cursor-pointer"
            }`}
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
  progress = {},
  onGradeCard,
}) {
  // view: "list" | "study" | "summary"
  const [view, setView] = useState("list");
  const [activeDeckId, setActiveDeckId] = useState(null);
  // Phiên "Ôn tập hôm nay" — gộp thẻ đến hạn/mới từ mọi bộ thẻ, không gắn với 1 deck cụ thể
  const [isDueReviewSession, setIsDueReviewSession] = useState(false);
  const [dueReviewFormulaIds, setDueReviewFormulaIds] = useState([]);

  // Study session state
  // Thứ tự thẻ của deck thường được chốt (snapshot) lúc bắt đầu phiên — không tính lại
  // sortFormulaIdsByDue() mỗi render, vì onGradeCard cập nhật progress ngay sau khi chấm
  // điểm 1 thẻ, làm thứ tự đổi giữa chừng và currentIndex+1 trỏ nhầm/bỏ sót thẻ.
  const [studyCardIds, setStudyCardIds] = useState([]);
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

  // Cards for the active deck — quá hạn/đến hạn lên đầu, thẻ mới tiếp theo, chưa đến hạn cuối cùng
  const cards = isDueReviewSession
    ? dueReviewFormulaIds.map(id => formulas.find(f => f.id === id)).filter(Boolean)
    : activeDeck
      ? studyCardIds.map(id => formulas.find(f => f.id === id)).filter(Boolean)
      : [];

  const currentCard = cards[currentIndex] || null;

  // Số thẻ đến hạn/mới gộp từ mọi bộ thẻ hiện có — dùng cho entry point "Ôn tập hôm nay"
  const dueReviewPreviewIds = useMemo(() => {
    const allIds = new Set();
    decks.forEach(d => d.formulaIds.forEach(id => allIds.add(id)));
    return getDueReviewQueue(Array.from(allIds), progress);
  }, [decks, progress]);

  // ─── Handlers: deck list ──────────────────────────────────────────────────

  const handleStartDeck = (deckId) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    setIsDueReviewSession(false);
    setActiveDeckId(deckId);
    setStudyCardIds(sortFormulaIdsByDue(deck.formulaIds, progress));
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedCount(0);
    setReviewCount(0);
    setView("study");
  };

  const handleStartDueReview = () => {
    if (dueReviewPreviewIds.length === 0) return;
    setIsDueReviewSession(true);
    setDueReviewFormulaIds(dueReviewPreviewIds);
    setActiveDeckId(null);
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

    if (currentCard) onGradeCard?.(currentCard.id, remembered);

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

  // Phím tắt lúc học: Space lật thẻ; ← → chuyển thẻ khi chưa lật, chấm điểm khi đã lật
  // (trái = Cần ôn thêm, phải = Nhớ rồi — đúng vị trí 2 nút chấm điểm trên màn hình).
  useEffect(() => {
    if (view !== "study") return;
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        return;
      }
      if (e.key === "ArrowLeft") {
        if (isFlipped) handleGrade(false); else handlePrev();
        return;
      }
      if (e.key === "ArrowRight") {
        if (isFlipped) handleGrade(true); else handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, isFlipped, currentIndex, cards.length]);

  const handleRestartDeck = () => {
    if (!isDueReviewSession && activeDeck) {
      setStudyCardIds(sortFormulaIdsByDue(activeDeck.formulaIds, progress));
    }
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
    setStudyCardIds(prev => prev.filter(id => id !== currentCard.id));
    const newCards = cards.filter(c => c.id !== currentCard.id);
    if (newCards.length === 0) {
      setView("list");
    } else if (currentIndex >= newCards.length) {
      setCurrentIndex(newCards.length - 1);
    }
    // currentIndex stays the same — new card at same index will appear
  };

  // deckOverride: { name, cards } — cho phép gọi xuất PDF thẳng từ danh sách bộ thẻ,
  // không cần học xong hết cả bộ mới thấy nút xuất (mặc định dùng phiên học đang mở nếu không truyền).
  const handlePdfExport = (deckOverride) => {
    if (!isPremium) {
      setActiveTab("premium");
      return;
    }

    const exportDeckName = deckOverride
      ? deckOverride.name
      : (isDueReviewSession ? "Ôn tập hôm nay" : (activeDeck?.name || "Flashcard"));
    const exportCards = deckOverride ? deckOverride.cards : cards;

    if (exportCards.length === 0) {
      showToast("Bộ thẻ chưa có công thức nào để xuất.", "info");
      return;
    }

    // Escape HTML special chars so they don't break the document structure
    // (KaTeX auto-render reads textContent so entities are decoded correctly)
    const esc = (s) => String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Convert explanation markdown to HTML (preserves $math$ for KaTeX auto-render)
    // Mỗi dòng phải đi qua esc() TRƯỚC khi ghép chuỗi HTML: nội dung thẻ hiện lấy từ
    // formulas.js (tin cậy), nhưng hàm này ghi thẳng vào document.write của cửa sổ mới — nếu
    // sau này thẻ nhận nội dung người dùng tự nhập thì thiếu bước escape là XSS ngay.
    const expToHtml = (text) => {
      if (!text) return "";
      const lines = text.split("\n");
      const parts = [];
      let listItems = [];
      for (const rawLine of lines) {
        const line = esc(rawLine);
        if (/^\s*-\s/.test(line)) {
          const content = line.replace(/^\s*-\s/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          listItems.push(`<li>${content}</li>`);
        } else {
          if (listItems.length) { parts.push(`<ul>${listItems.join("")}</ul>`); listItems = []; }
          const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          if (content.trim()) parts.push(`<p style="margin:3px 0">${content}</p>`);
        }
      }
      if (listItems.length) parts.push(`<ul>${listItems.join("")}</ul>`);
      return parts.join("");
    };

    const exportDate = new Date().toLocaleDateString("vi-VN");

    const cardRows = exportCards.map((card, i) => `
      <div class="card">
        <div class="card-num">${i + 1}</div>
        <div class="card-body">
          <div class="card-name">${esc(card.name)}</div>
          <div class="card-meta">Lớp ${esc(card.grade)} · ${esc(card.topic)}</div>
          <div class="card-latex">$$${esc(card.latex)}$$</div>
          ${card.explanation ? `<div class="card-exp">${expToHtml(card.explanation)}</div>` : ""}
        </div>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>FormulaX – ${esc(exportDeckName)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"
    onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false})"></script>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;padding:32px 40px;color:#1e293b;background:#fff;max-width:900px;margin:0 auto}
    h1{font-size:22px;font-weight:800;color:#1E3A5F;margin:0 0 4px}
    .sub{font-size:13px;color:#64748B;margin:0 0 24px}
    .card{display:flex;gap:14px;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;background:#fafbfc}
    .card-num{font-size:13px;font-weight:800;color:#3B82F6;min-width:22px;padding-top:2px;flex-shrink:0}
    .card-body{flex:1;min-width:0}
    .card-name{font-size:15px;font-weight:800;color:#1E3A5F;margin-bottom:4px}
    .card-meta{font-size:11px;color:#64748B;margin-bottom:10px}
    .card-latex{background:#f1f5f9;border-radius:6px;padding:10px 14px;margin-bottom:10px;overflow-x:auto}
    .card-exp{font-size:12px;color:#475569;line-height:1.6}
    .card-exp ul{margin:4px 0;padding-left:18px}
    .card-exp li{margin:3px 0}
    .katex-display{margin:4px 0!important;overflow-x:auto;overflow-y:hidden}
    .katex{font-size:1.05em}
    @media print{@page{margin:16mm 18mm}body{padding:0}.no-print{display:none!important}}
  </style>
</head>
<body>
  <h1>Bộ thẻ: ${esc(exportDeckName)}</h1>
  <p class="sub">Xuất từ FormulaX AI · ${exportDate} · ${exportCards.length} công thức</p>
  ${cardRows}
  <div class="no-print" style="text-align:center;margin-top:28px">
    <button onclick="window.print()" style="padding:10px 28px;background:#1E3A5F;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
      🖨️ In / Lưu PDF
    </button>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      showToast("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này và thử lại.", "error");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // ─── LIST VIEW ────────────────────────────────────────────────────────────

  if (view === "list") {
    const filteredDecks = decks.filter(d => d.type === "filtered");
    const favoriteDecks = decks.filter(d => d.type === "favorite");
    const hasDecks = decks.length > 0;

    return (
      <div className="view-container">
        <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
          <div className="relative z-[1]">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <button className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.8rem] font-bold inline-flex items-center gap-1 cursor-pointer transition duration-200 hover:text-primary dark:hover:text-[#E2E8F0] mb-0" onClick={() => setActiveTab("dashboard")}>
                <ArrowLeft size={12} />
                <span>Về trang chủ</span>
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-[1.6rem] font-extrabold text-primary dark:text-[#E2E8F0] tracking-[-0.5px]">
                Flashcard
              </h2>
              <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] font-medium mt-1">
                Học công thức qua thẻ ghi nhớ
              </p>
            </div>

            {/* Ôn tập hôm nay — gộp thẻ đến hạn/mới từ mọi bộ thẻ theo lịch spaced-repetition */}
            {hasDecks && dueReviewPreviewIds.length > 0 && (
              <div
                onClick={handleStartDueReview}
                className="flex items-center justify-between bg-banner-orange rounded-2xl px-4 py-[13px] cursor-pointer text-white mb-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="text-[0.88rem] font-bold">Ôn tập hôm nay</div>
                    <div className="text-[0.7rem] opacity-75 mt-[1px]">
                      {dueReviewPreviewIds.length} thẻ đến hạn ôn lại
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-70 shrink-0" />
              </div>
            )}

            {/* EMPTY STATE */}
            {!hasDecks && (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                <div className="w-20 h-20 rounded-full bg-secondary/8 flex items-center justify-center mb-2">
                  <Layers size={36} color="#3B82F6" />
                </div>
                <h3 className="text-[1.15rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">Chưa có bộ thẻ nào</h3>
                <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] max-w-[280px] leading-[1.5] m-0">
                  Tạo bộ thẻ theo chủ đề để ôn tập có hệ thống, hoặc tạo bộ yêu thích để tự chọn công thức.
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-[300px] mt-2">
                  <button
                    className="btn btn-primary w-full justify-center"
                    onClick={() => setShowCreateFiltered(true)}
                  >
                    <Layers size={15} />
                    <span>Tạo theo chủ đề</span>
                  </button>
                  <button
                    className="btn btn-secondary w-full justify-center"
                    onClick={handleCreateFavoriteDeck}
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
                  <div className="mb-5">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.05em] mb-2.5">
                      Theo chủ đề
                    </p>
                    <div className="deck-stack-list">
                      {filteredDecks.map(deck => (
                        <div
                          key={deck.id}
                          className={`deck-list-card-figma dark:bg-[#1E293B] dark:border-[#334155] ${deck.formulaIds.length === 0 ? "cursor-default opacity-60" : "cursor-pointer"}`}
                          onClick={() => {
                            if (renamingDeckId === deck.id) return;
                            if (deck.formulaIds.length === 0) return;
                            handleStartDeck(deck.id);
                          }}
                        >
                          <div className="deck-card-left">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-secondary/10 text-secondary">
                              <BarChart3 size={20} />
                            </div>
                            <div>
                              <h3 className="deck-card-name">{deck.name}</h3>
                              <div className="deck-card-stats">{deck.formulaIds.length} thẻ</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {deck.topic && (
                              <span className="tag tag-blue text-[0.7rem] py-0.5 px-2">{deck.topic}</span>
                            )}
                            {deck.grade && (
                              <span className="tag text-[0.7rem] py-0.5 px-2 bg-[#F1F5F9] !text-[#475569]">Lớp {deck.grade}</span>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); handlePdfExport({ name: deck.name, cards: deck.formulaIds.map(id => formulas.find(f => f.id === id)).filter(Boolean) }); }}
                              title="Xuất PDF"
                              className="bg-transparent border-none cursor-pointer p-1 text-[#94A3B8] rounded-md flex items-center"
                            >
                              <FileDown size={15} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                              title="Xoá bộ thẻ"
                              className="bg-transparent border-none cursor-pointer p-1 text-[#94A3B8] rounded-md flex items-center"
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
                  <div className="mb-5">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.05em] mb-2.5">
                      Yêu thích
                    </p>
                    <div className="deck-stack-list">
                      {favoriteDecks.map(deck => (
                        <div
                          key={deck.id}
                          className={`deck-list-card-figma dark:bg-[#1E293B] dark:border-[#334155] ${deck.formulaIds.length === 0 ? "cursor-default opacity-60" : "cursor-pointer"}`}
                          onClick={() => {
                            if (renamingDeckId === deck.id) return;
                            if (deck.formulaIds.length === 0) return;
                            handleStartDeck(deck.id);
                          }}
                        >
                          <div className="deck-card-left flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-error/8 text-error">
                              <Heart size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              {renamingDeckId === deck.id ? (
                                <input
                                  ref={renameInputRef}
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  onKeyDown={handleRenameKeyDown}
                                  onBlur={handleConfirmRename}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[0.9rem] font-bold text-[#1E3A5F] border-[1.5px] border-accent rounded-md py-0.5 px-2 w-full outline-none bg-white"
                                />
                              ) : (
                                <h3 className="deck-card-name">{deck.name}</h3>
                              )}
                              <div className="deck-card-stats">
                                {deck.formulaIds.length === 0 ? "Chưa có thẻ — thêm từ Thư viện" : `${deck.formulaIds.length} thẻ`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); handleStartRename(deck); }}
                              title="Đổi tên"
                              className="bg-transparent border-none cursor-pointer p-1 text-[#94A3B8] rounded-md flex items-center"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handlePdfExport({ name: deck.name, cards: deck.formulaIds.map(id => formulas.find(f => f.id === id)).filter(Boolean) }); }}
                              title="Xuất PDF"
                              className="bg-transparent border-none cursor-pointer p-1 text-[#94A3B8] rounded-md flex items-center"
                            >
                              <FileDown size={15} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                              title="Xoá bộ thẻ"
                              className="bg-transparent border-none cursor-pointer p-1 text-[#94A3B8] rounded-md flex items-center"
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
                <div className="flex flex-col gap-2.5 mt-2">
                  <button
                    className="btn btn-secondary w-full justify-center !border-dashed"
                    onClick={() => setShowCreateFiltered(true)}
                  >
                    <Plus size={15} />
                    <span>Thêm bộ theo chủ đề</span>
                  </button>
                  <button
                    className="btn btn-secondary w-full justify-center !border-dashed"
                    onClick={handleCreateFavoriteDeck}
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
                existingDecks={decks.filter(d => d.type === "filtered")}
                onClose={() => setShowCreateFiltered(false)}
                onConfirm={handleCreateFilteredDeck}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STUDY VIEW ───────────────────────────────────────────────────────────

  if (view === "study") {
    // No cards in deck
    if (cards.length === 0) {
      return (
        <div className="view-container">
          <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
            <div className="relative z-[1]">
              <div className="summary-card !bg-white/72 !border !border-white/60 !rounded-[20px] !shadow-[0_8px_32px_rgba(31,38,135,0.10)] !backdrop-blur-[20px]">
                <HelpCircle size={32} />
                <h2>Bộ thẻ trống</h2>
                <p>Không có công thức nào trong bộ thẻ này.</p>
                <button className="btn btn-primary" onClick={() => setView("list")}>
                  Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const isFavoriteDeck = activeDeck?.type === "favorite";

    return (
      <div className="view-container">
        <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
          <div className="relative z-[1]">
            <div className="flex flex-col items-center w-full max-w-[500px] mx-auto gap-4 [animation:fadeIn_0.3s_ease-out]">
              <div className="flex justify-between items-center w-full mb-2">
                <button className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.85rem] font-bold flex items-center gap-1.5 cursor-pointer transition duration-200 py-1.5 px-3 rounded-lg hover:text-primary dark:hover:text-[#E2E8F0] hover:bg-[#f1f5f9]" onClick={() => setView("list")}>
                  <ArrowLeft size={14} />
                  <span>Danh sách bộ thẻ</span>
                </button>
                <span className="text-[0.85rem] font-bold text-secondary bg-secondary/8 py-1 px-3 rounded-full">
                  Thẻ: {currentIndex + 1} / {cards.length}
                </span>
              </div>

              {/* 3D Flip Card */}
              <div className="w-full h-[380px] [perspective:1000px] cursor-pointer mb-2 active:scale-[0.98] transition-transform duration-200" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`w-full h-full relative transition-transform duration-[0.6s] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                  {/* Front */}
                  <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] absolute w-full h-full [backface-visibility:hidden] p-6 flex flex-col justify-between items-center overflow-hidden">
                    <span className="text-[0.7rem] font-bold text-text-muted dark:text-[#94A3B8] uppercase tracking-[0.5px]">Mặt trước - Tên công thức</span>
                    <div className="flex flex-col items-center gap-4 text-center flex-1 justify-center">
                      <span className="tag bg-[#f1f5f9] !text-[#1E3A5F]">
                        Lớp {currentCard.grade} • {currentCard.topic}
                      </span>
                      <div className="text-[1.4rem] font-extrabold text-primary dark:text-[#E2E8F0] leading-[1.4]">{currentCard.name}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted dark:text-[#94A3B8] font-bold">
                      <RotateCw size={12} /> Chạm để lật
                    </div>
                  </div>

                  {/* Back */}
                  <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] absolute w-full h-full [backface-visibility:hidden] p-6 flex flex-col justify-between items-center overflow-hidden [transform:rotateY(180deg)]">
                    <span className="text-[0.7rem] font-bold text-secondary uppercase tracking-[0.5px]">Mặt sau - Công thức</span>
                    <div className="flex flex-col items-center gap-3 w-full flex-1 min-h-0 justify-start overflow-y-auto overflow-x-hidden">
                      <div className="bg-[#f1f5f9] dark:bg-[#0F172A]/60 rounded-xl p-4 flex items-center justify-center min-h-[70px] max-h-[200px] overflow-auto shrink-0 border border-[#e2e8f0] dark:border-[#334155] w-full !text-[#1E3A5F] dark:!text-[#E2E8F0]">
                        <MathElement math={currentCard.latex} block={true} />
                      </div>
                      <div className="flashcard-explanation text-[0.8rem] text-[#475569] dark:text-[#CBD5E1] text-left w-full overflow-x-auto">
                        <strong>Giải thích:</strong>
                        <div className="mt-0.5">
                          <RichTextRenderer text={currentCard.explanation} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted dark:text-[#94A3B8] font-bold">
                      <RotateCw size={12} /> Chạm để lật lại
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrows */}
              <div className="flex justify-between items-center w-full mt-2 gap-4">
                <button className="arrow-btn !text-[#1E3A5F]" onClick={handlePrev} disabled={currentIndex === 0}>
                  <ArrowLeft size={18} />
                </button>
                <span className="text-[0.8rem] text-text-muted font-bold self-center">
                  Lật thẻ xem đáp án trước khi chấm
                </span>
                <button className="arrow-btn !text-[#1E3A5F]" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="hidden md:block text-[0.72rem] text-[#94A3B8] font-semibold -mt-1">
                Phím tắt: <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">Space</kbd> lật thẻ, <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">←</kbd> <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">→</kbd> chuyển thẻ / chấm điểm
              </div>

              {/* Grading panel */}
              {isFlipped && (
                <div className="grid grid-cols-2 gap-4 w-full mt-2 [animation:slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
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
                <div className="mt-2 text-center">
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveFromDeck(); }}
                    className="bg-transparent border-none cursor-pointer text-xs text-error font-semibold inline-flex items-center gap-1 py-1 px-2 rounded-md"
                  >
                    <X size={13} />
                    Xóa khỏi bộ này
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUMMARY VIEW ─────────────────────────────────────────────────────────

  if (view === "summary") {
    return (
      <div className="view-container">
        <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
          <div className="relative z-[1]">
            <div className="summary-card">
              <div className="summary-icon">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-[1.3rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0]">Hoàn thành bộ thẻ!</h2>
              <p className="text-[0.85rem] text-[#64748B] dark:text-[#94A3B8]">
                Bạn đã ôn tập xong <strong>{isDueReviewSession ? "Ôn tập hôm nay" : activeDeck?.name}</strong>.
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

              <div className="text-[0.9rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0]">
                Tỷ lệ ghi nhớ: {cards.length > 0 ? Math.round((rememberedCount / cards.length) * 100) : 0}%
              </div>

              <div className="summary-actions">
                <div className="relative">
                  <button
                    className={`btn ${isPremium ? "btn-primary" : "btn-secondary"} w-full`}
                    onClick={() => handlePdfExport()}
                  >
                    <FileDown size={16} />
                    <span>Xuất tài liệu ôn tập PDF/Ảnh</span>
                    {!isPremium && <Lock size={14} className="ml-1 text-premium" />}
                  </button>
                  {!isPremium && (
                    <span className="absolute -top-2 -right-2 bg-premium text-white text-[0.65rem] font-extrabold py-0.5 px-2 rounded-full shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                      Pro
                    </span>
                  )}
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
        </div>
      </div>
    );
  }

  return null;
}
