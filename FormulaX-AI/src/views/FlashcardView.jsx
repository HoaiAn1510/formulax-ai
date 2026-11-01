import React, { useState, useRef, useEffect, useMemo } from "react";
import PageShell from "../components/PageShell";
import MimiMascot from "../components/MimiMascot";
import { CARD, LABEL, BTN_PRIMARY, BTN_SECONDARY } from "../utils/shellStyle";
import {
  Layers, ArrowLeft, ArrowRight, RotateCw, CheckCircle, AlertTriangle,
  Plus, FileDown, Lock, ChevronRight, Book, HelpCircle, BarChart3, Clock,
  Eye, Heart, Pencil, Trash2, X, Check, BookOpen, Star, Sparkles,
} from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { saveFlashcardActivity } from "../lib/supabase";
import { sortFormulaIdsByDue, getDueReviewQueue } from "../utils/spacedRepetition";
import { showToast } from "../components/Toast";
import { useGuestGate } from "../utils/useGuestGate";

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
  // Bộ thẻ và lịch ôn (spaced repetition) được lưu theo người dùng nên khóa với khách. Khách
  // không có bộ thẻ nào → luôn thấy màn trống với 2 nút tạo bị khóa.
  const { isGuest, requireGoogle } = useGuestGate();

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

  const handleOpenCreateFiltered = () => {
    if (!requireGoogle()) return;
    setShowCreateFiltered(true);
  };

  const handleCreateFavoriteDeck = () => {
    if (!requireGoogle()) return;
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
    onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,strict:'ignore'})"></script>
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

    const deckCard = (deck, kind) => (
      <div
        key={deck.id}
        role="button"
        tabIndex={deck.formulaIds.length === 0 ? -1 : 0}
        onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && deck.formulaIds.length > 0 && renamingDeckId !== deck.id) { e.preventDefault(); handleStartDeck(deck.id); } }}
        className={`${CARD} p-4 md:p-5 flex items-center gap-3.5 transition-[transform,border-color] duration-200 ${deck.formulaIds.length === 0 ? "cursor-default opacity-60" : "cursor-pointer hover:-translate-y-0.5 hover:border-[#CBD5E1] dark:hover:border-[#475569]"}`}
        onClick={() => {
          if (renamingDeckId === deck.id) return;
          if (deck.formulaIds.length === 0) return;
          handleStartDeck(deck.id);
        }}
      >
        <span className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${kind === "favorite" ? "bg-[#FFE4E6] text-[#E11D48] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF]" : "bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]"}`}>
          {kind === "favorite" ? <Heart size={19} /> : <BarChart3 size={19} />}
        </span>
        <div className="flex-1 min-w-0">
          {renamingDeckId === deck.id ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleConfirmRename}
              onClick={e => e.stopPropagation()}
              aria-label="Tên bộ thẻ"
              className="text-[0.92rem] font-semibold text-primary dark:text-[#E2E8F0] border border-accent rounded-[8px] py-1 px-2 w-full outline-none bg-white dark:bg-[#0F172A]"
            />
          ) : (
            <h3 className="m-0 text-[0.95rem] font-semibold text-primary dark:text-[#E2E8F0] truncate">{deck.name}</h3>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[0.75rem] text-text-muted dark:text-[#94A3B8]">
            <span>{deck.formulaIds.length === 0 ? "Chưa có thẻ — thêm từ Thư viện" : `${deck.formulaIds.length} thẻ`}</span>
            {deck.topic && <span>· {deck.topic}</span>}
            {deck.grade && <span>· Lớp {deck.grade}</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {kind === "favorite" && (
            <button aria-label="Đổi tên bộ thẻ" title="Đổi tên" onClick={e => { e.stopPropagation(); handleStartRename(deck); }} className="w-8 h-8 bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-primary dark:hover:text-[#E2E8F0] rounded-[8px] flex items-center justify-center">
              <Pencil size={15} />
            </button>
          )}
          <button
            aria-label="Xuất PDF"
            title="Xuất PDF"
            onClick={e => { e.stopPropagation(); handlePdfExport({ name: deck.name, cards: deck.formulaIds.map(id => formulas.find(f => f.id === id)).filter(Boolean) }); }}
            className="w-8 h-8 bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-primary dark:hover:text-[#E2E8F0] rounded-[8px] flex items-center justify-center"
          >
            <FileDown size={15} />
          </button>
          <button aria-label="Xoá bộ thẻ" title="Xoá bộ thẻ" onClick={e => { e.stopPropagation(); onDeleteDeck(deck.id); }} className="w-8 h-8 bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-error rounded-[8px] flex items-center justify-center">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );

    return (
      <PageShell title="Flashcard" description="Lật thẻ để thuộc công thức. App nhắc lại đúng lúc bạn sắp quên." onBack={() => setActiveTab("dashboard")}>
        {!hasDecks ? (
          /* EMPTY STATE */
          <div className={`${CARD} relative max-w-[640px] mx-auto mt-[60px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] p-6 md:p-10 flex flex-col items-center text-center gap-3`}>
            <MimiMascot width={160} className="absolute left-1/2 -translate-x-1/2 -top-[86px]" />
            <h2 className="m-0 mt-6 text-[1.25rem] md:text-[1.5rem] font-bold tracking-[-0.02em] text-primary dark:text-[#E2E8F0]">Chưa có bộ thẻ nào</h2>
            <p className="m-0 text-[0.88rem] text-text-muted dark:text-[#94A3B8] max-w-[420px] leading-[1.6]">
              {isGuest
                ? "Đăng nhập Google để tạo bộ thẻ, lưu lịch ôn tập và theo dõi thẻ đến hạn mỗi ngày."
                : "Tạo bộ thẻ theo chủ đề để ôn tập có hệ thống, hoặc tạo bộ yêu thích để tự chọn công thức."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto mt-2">
              <button className={BTN_PRIMARY} onClick={handleOpenCreateFiltered}>
                {isGuest ? <Lock size={15} /> : <Layers size={15} />}
                <span>Tạo theo chủ đề</span>
              </button>
              <button className={BTN_SECONDARY} onClick={handleCreateFavoriteDeck}>
                {isGuest ? <Lock size={15} /> : <Heart size={15} />}
                <span>Tạo bộ yêu thích</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:items-start">
            {/* Cột trái: ôn tập hôm nay + tạo bộ mới */}
            <aside className="lg:col-span-4 flex flex-col gap-3 md:gap-4">
              {dueReviewPreviewIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartDueReview}
                  className="w-full text-left rounded-[18px] bg-primary dark:bg-[#020617] dark:border dark:border-[#334155] text-white p-5 border-none cursor-pointer flex items-center gap-4 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.6)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="w-11 h-11 rounded-[12px] bg-white/10 text-[#FBBF24] flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[0.98rem] font-semibold">Ôn tập hôm nay</span>
                    <span className="block text-[0.78rem] text-[#CBD5E1] mt-0.5">{dueReviewPreviewIds.length} thẻ đến hạn ôn lại</span>
                  </span>
                  <ChevronRight size={18} className="text-[#FBBF24] shrink-0" />
                </button>
              )}
              <div className={`${CARD} p-4 md:p-5 flex flex-col gap-2.5`}>
                <div className={LABEL}>Tạo bộ thẻ mới</div>
                <button className={`${BTN_SECONDARY} w-full justify-start`} onClick={handleOpenCreateFiltered}>
                  <Plus size={15} />
                  <span>Bộ theo chủ đề</span>
                </button>
                <button className={`${BTN_SECONDARY} w-full justify-start`} onClick={handleCreateFavoriteDeck}>
                  <Plus size={15} />
                  <span>Bộ yêu thích</span>
                </button>
              </div>
            </aside>

            {/* Cột phải: các bộ thẻ */}
            <section className="lg:col-span-8 flex flex-col gap-5 md:gap-6">
              {filteredDecks.length > 0 && (
                <div>
                  <div className={`${LABEL} mb-3`}>Theo chủ đề</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDecks.map(deck => deckCard(deck, "filtered"))}
                  </div>
                </div>
              )}
              {favoriteDecks.length > 0 && (
                <div>
                  <div className={`${LABEL} mb-3`}>Yêu thích</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {favoriteDecks.map(deck => deckCard(deck, "favorite"))}
                  </div>
                </div>
              )}
            </section>
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
      </PageShell>
    );
  }

  // ─── STUDY VIEW ───────────────────────────────────────────────────────────

  if (view === "study") {
    // No cards in deck
    if (cards.length === 0) {
      return (
        <PageShell>
          <div className={`${CARD} max-w-[520px] mx-auto p-8 flex flex-col items-center text-center gap-3`}>
            <HelpCircle size={32} className="text-[#CBD5E1]" />
            <h2 className="m-0 text-[1.15rem] font-bold text-primary dark:text-[#E2E8F0]">Bộ thẻ trống</h2>
            <p className="m-0 text-[0.85rem] text-text-muted dark:text-[#94A3B8]">Không có công thức nào trong bộ thẻ này.</p>
            <button className={BTN_PRIMARY} onClick={() => setView("list")}>
              Quay lại danh sách
            </button>
          </div>
        </PageShell>
      );
    }

    const isFavoriteDeck = activeDeck?.type === "favorite";

    return (
      <PageShell onBack={() => setView("list")} backLabel="Danh sách bộ thẻ">
        <div className="flex flex-col items-center w-full max-w-[820px] mx-auto gap-4 md:gap-5 [animation:fadeIn_0.3s_ease-out]">
          {/* Tiến độ */}
          <div className="w-full flex items-center gap-3 md:gap-4">
            <span className="text-[0.9rem] font-bold text-primary dark:text-[#E2E8F0] shrink-0">Thẻ {currentIndex + 1}/{cards.length}</span>
            <div className="flex-1 h-2 rounded-full bg-[#EEF1F6] dark:bg-[#334155] overflow-hidden">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B,#FBBF24)] transition-[width] duration-300" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
            </div>
            <span className="hidden sm:block text-[0.8rem] text-text-muted dark:text-[#94A3B8] shrink-0 truncate max-w-[200px]">{isDueReviewSession ? "Ôn tập hôm nay" : activeDeck?.name}</span>
          </div>

          {/* Thẻ lật 3D */}
          <div className="relative w-full mt-[58px] md:mt-[64px]">
            <MimiMascot width={104} className="md:hidden absolute right-2 -top-[60px] z-[2] pointer-events-none" />
            <MimiMascot width={190} className="hidden md:block absolute right-10 -top-[86px] z-[2] pointer-events-none" />
            <div
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? "Lật lại mặt trước" : "Lật thẻ xem công thức"}
              onKeyDown={e => { if (e.key === "Enter") setIsFlipped(!isFlipped); }}
              className="w-full h-[380px] md:h-[430px] [perspective:1200px] cursor-pointer transition-transform duration-200 active:scale-[0.99]"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`w-full h-full relative transition-transform duration-[0.6s] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                {/* Mặt trước */}
                <div className={`${CARD} absolute inset-0 [backface-visibility:hidden] bg-[linear-gradient(160deg,#FFF8E1,#FFFFFF_55%)] dark:bg-none dark:bg-[#1E293B] p-6 md:p-10 flex flex-col justify-between items-center text-center overflow-hidden`}>
                  <span className={LABEL}>Mặt trước · Tên công thức</span>
                  <div className="flex flex-col items-center gap-4 flex-1 justify-center">
                    <span className="inline-block py-1 px-3 rounded-full text-[0.75rem] font-semibold bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]">
                      {currentCard.topic} · Lớp {currentCard.grade}
                    </span>
                    <div className="text-[1.4rem] md:text-[1.9rem] font-semibold tracking-[-0.02em] leading-[1.35] max-w-[620px] text-primary dark:text-[#E2E8F0]">{currentCard.name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-[0.8rem] text-text-muted dark:text-[#94A3B8]">
                    <RotateCw size={14} /> Chạm vào thẻ hoặc nhấn Space để lật
                  </div>
                </div>

                {/* Mặt sau */}
                <div className={`${CARD} absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] p-5 md:p-8 flex flex-col justify-between items-center overflow-hidden`}>
                  <span className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>Mặt sau · Công thức</span>
                  <div className="flex flex-col items-center gap-3 w-full flex-1 min-h-0 justify-start overflow-y-auto overflow-x-hidden mt-3">
                    <div className="bg-page dark:bg-[#0F172A] rounded-[14px] p-4 flex items-center justify-center min-h-[80px] max-h-[200px] overflow-auto shrink-0 border border-line dark:border-[#334155] w-full text-primary dark:text-[#E2E8F0]">
                      <MathElement math={currentCard.latex} block={true} />
                    </div>
                    <div className="flashcard-explanation text-[0.82rem] text-[#475569] dark:text-[#CBD5E1] text-left w-full overflow-x-auto">
                      <strong className="text-primary dark:text-[#E2E8F0]">Giải thích:</strong>
                      <div className="mt-0.5">
                        <RichTextRenderer text={currentCard.explanation} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[0.8rem] text-text-muted dark:text-[#94A3B8] mt-2">
                    <RotateCw size={14} /> Chạm để lật lại
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chấm điểm (sau khi lật) hoặc chuyển thẻ */}
          {isFlipped ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto [animation:slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
              <button
                className="md:w-[230px] inline-flex items-center justify-center gap-2 rounded-[13px] py-3 px-4 text-[0.95rem] font-semibold cursor-pointer border border-[#FDA4AF] bg-[#FFF1F2] text-[#BE123C] dark:bg-[#E11D48]/15 dark:border-[#E11D48]/40 dark:text-[#FDA4AF] transition-colors hover:bg-[#FFE4E6]"
                onClick={() => handleGrade(false)}
              >
                <AlertTriangle size={16} />
                <span>Cần ôn thêm</span>
              </button>
              <button
                className="md:w-[230px] inline-flex items-center justify-center gap-2 rounded-[13px] py-3 px-4 text-[0.95rem] font-semibold cursor-pointer border-none bg-[#059669] text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.6)] transition-colors hover:bg-[#047857]"
                onClick={() => handleGrade(true)}
              >
                <CheckCircle size={16} />
                <span>Nhớ rồi</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full gap-4">
              <button aria-label="Thẻ trước" className={`${BTN_SECONDARY} !px-3.5`} onClick={handlePrev} disabled={currentIndex === 0}>
                <ArrowLeft size={18} />
              </button>
              <span className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] text-center">Lật thẻ xem đáp án trước khi chấm</span>
              <button aria-label="Thẻ tiếp theo" className={`${BTN_SECONDARY} !px-3.5`} onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div className="hidden md:block text-[0.75rem] text-text-muted dark:text-[#94A3B8]">
            Phím tắt: <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">Space</kbd> lật thẻ, <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">←</kbd> <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">→</kbd> chuyển thẻ / chấm điểm
          </div>

          {/* Remove from favorite deck button */}
          {isFavoriteDeck && isFlipped && (
            <button
              onClick={e => { e.stopPropagation(); handleRemoveFromDeck(); }}
              className="bg-transparent border-none cursor-pointer text-[0.78rem] text-error font-semibold inline-flex items-center gap-1 py-1 px-2 rounded-md"
            >
              <X size={13} />
              Xóa khỏi bộ này
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ─── SUMMARY VIEW ─────────────────────────────────────────────────────────

  if (view === "summary") {
    const rate = cards.length > 0 ? Math.round((rememberedCount / cards.length) * 100) : 0;
    return (
      <PageShell>
        <div className={`${CARD} relative max-w-[560px] mx-auto mt-[70px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] p-6 md:p-9 flex flex-col items-center text-center gap-3`}>
          <MimiMascot width={170} className="absolute left-1/2 -translate-x-1/2 -top-[96px]" />
          <div className={`${LABEL} mt-6`}>Hoàn thành bộ thẻ</div>
          <h2 className="m-0 text-[1.3rem] md:text-[1.6rem] font-bold tracking-[-0.02em] text-primary dark:text-[#E2E8F0]">
            {isDueReviewSession ? "Ôn tập hôm nay" : activeDeck?.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <div className="rounded-[14px] bg-white dark:bg-[#0F172A] border border-line dark:border-[#334155] p-4">
              <div className="text-[2rem] font-bold text-[#059669] dark:text-[#6EE7B7]">{rememberedCount}</div>
              <div className="text-[0.78rem] text-text-muted dark:text-[#94A3B8]">Đã nhớ tốt</div>
            </div>
            <div className="rounded-[14px] bg-white dark:bg-[#0F172A] border border-line dark:border-[#334155] p-4">
              <div className="text-[2rem] font-bold text-[#BE123C] dark:text-[#FDA4AF]">{reviewCount}</div>
              <div className="text-[0.78rem] text-text-muted dark:text-[#94A3B8]">Cần ôn thêm</div>
            </div>
          </div>
          <div className="text-[0.95rem] font-semibold text-primary dark:text-[#E2E8F0]">Tỷ lệ ghi nhớ: {rate}%</div>

          <div className="w-full flex flex-col gap-2.5 mt-2">
            <button className={`${BTN_PRIMARY} w-full`} onClick={handleRestartDeck}>Luyện tập lại</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button className={`${BTN_SECONDARY} w-full relative`} onClick={() => handlePdfExport()}>
                <FileDown size={16} />
                <span>Xuất PDF</span>
                {!isPremium && <span className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold text-white bg-premium rounded-full py-0.5 px-1.5"><Lock size={10} /> Pro</span>}
              </button>
              <button className={`${BTN_SECONDARY} w-full`} onClick={() => setView("list")}>Về danh sách bộ thẻ</button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return null;
}
