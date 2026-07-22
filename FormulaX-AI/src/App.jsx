import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import { useAuth } from "./context/AuthContext";
import { formulas } from "./data/formulas";
import {
  loadUserData,
  checkPremiumStatus,
  addBookmark, removeBookmark,
  saveNote,
  saveStats,
  addSearchHistoryEntry,
  saveQuizDaily,
  saveDisplayName,
  loadFlashcardDecks, upsertFlashcardDeck, deleteFlashcardDeck as deleteFlashcardDeckDB,
  loadFlashcardProgress, upsertFlashcardProgress,
  checkAndGenerateNotifications, getNotifications, markAllNotificationsRead,
  getRecommendationContext,
} from "./lib/supabase";
import { computeNextReview } from "./utils/spacedRepetition";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import FormulaDetailModal from "./components/FormulaDetailModal";
import OnboardingModal from "./components/OnboardingModal";
import { ToastContainer, showToast } from "./components/Toast";
import { ConfirmDialogHost } from "./components/ConfirmDialog";

import Dashboard from "./views/Dashboard";
import FormulaLibrary from "./views/FormulaLibrary";
import FormulaFinder from "./views/FormulaFinder";
import FlashcardView from "./views/FlashcardView";
import QuizView from "./views/QuizView";
import PremiumUpgrade from "./views/PremiumUpgrade";
import LoginView from "./views/LoginView";
import ProgressDashboard from "./views/ProgressDashboard";
import SettingsView from "./views/SettingsView";

export default function App() {
  const { user, logout, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab]   = useState("dashboard");
  const [isPremium, setIsPremium]   = useState(() => localStorage.getItem("formulax_premium") === "true");
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [isLoadingData, setIsLoadingData]     = useState(false);

  // ─── Preferences ─────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("formulax_dark") === "true");
  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem("formulax_user");
    const gId = saved ? JSON.parse(saved)?.googleId : null;
    return (gId && localStorage.getItem(`formulax_display_name_${gId}`))
      || localStorage.getItem("formulax_display_name")
      || "";
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userGrade, setUserGrade] = useState(() => {
    const saved = localStorage.getItem("formulax_user");
    const gId = saved ? JSON.parse(saved)?.googleId : null;
    const stored = gId && localStorage.getItem(`formulax_grade_${gId}`);
    return stored ? Number(stored) : null;
  });
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("formulax_notif_prefs")) || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark-mode");
    else document.documentElement.classList.remove("dark-mode");
    localStorage.setItem("formulax_dark", darkMode);
  }, [darkMode]);

  const handleSetUserGrade = (grade) => {
    setUserGrade(grade);
    if (user?.googleId) localStorage.setItem(`formulax_grade_${user.googleId}`, String(grade));
  };

  const handleSetNotifPrefs = (prefs) => {
    setNotifPrefs(prefs);
    localStorage.setItem("formulax_notif_prefs", JSON.stringify(prefs));
  };

  const handleSetDisplayName = (name) => {
    setDisplayName(name);
    if (user?.googleId) localStorage.setItem(`formulax_display_name_${user.googleId}`, name);
    localStorage.setItem("formulax_display_name", name);
    if (user?.googleId) saveDisplayName(user.googleId, name).catch(console.error);
  };

  // ─── User data ────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds]     = useState([]);
  const [userNotes, setUserNotes]             = useState({});
  const [stats, setStats]                     = useState({ formulasViewed: 0, flashcardsStudied: 0, quizzesCompleted: 0 });
  const [todayStats, setTodayStats]           = useState({ formulasViewed: 0, quizzesCompleted: 0, flashcardsStudied: 0 });
  const [remainingQuizzes, setRemainingQuizzes] = useState(10);
  const [searchHistory, setSearchHistory]     = useState([]);
  const [viewedFormulaIds, setViewedFormulaIds] = useState([]);
  const [flashcardDecks, setFlashcardDecks] = useState([]);
  const [flashcardProgress, setFlashcardProgress] = useState({});
  const [addFormulaModal, setAddFormulaModal] = useState(null); // { formula } | null
  const [notifications, setNotifications] = useState([]);
  const [recommendationContext, setRecommendationContext] = useState({ weakTopics: [], recentTopic: null });

  // Dùng ref để debounce save stats và track trạng thái đã load xong chưa
  const statsTimer     = useRef(null);
  const dataLoadedRef  = useRef(false); // chặn save trước khi load xong
  const prevStatsRef   = useRef(null);  // delta tracker cho todayStats

  // ─── Load data khi user đăng nhập / đổi tài khoản ────────────────────────
  useEffect(() => {
    if (!user?.googleId) {
      dataLoadedRef.current = false; // reset khi logout
      setViewedFormulaIds([]);
      setNotifications([]);
      setRecommendationContext({ weakTopics: [], recentTopic: null });
      setFlashcardProgress({});
      return;
    }
    dataLoadedRef.current = false; // chặn save trong khi đang load
    setIsLoadingData(true);
    loadUserData(user.googleId)
      .then((data) => {
        setBookmarkedIds(data.bookmarkedIds);
        setUserNotes(data.userNotes);
        setStats(data.stats);
        setTodayStats({ formulasViewed: 0, quizzesCompleted: data.todayQuizCount, flashcardsStudied: data.todayFlashcardCount });
        prevStatsRef.current = data.stats;
        setSearchHistory(data.searchHistory);
        // Merge quiz daily: so sánh Supabase vs localStorage, lấy giá trị nhỏ hơn (hạn chế hơn)
        const today = new Date().toISOString().slice(0, 10);
        const localQuiz = localStorage.getItem(`formulax_quiz_${user.googleId}`);
        let finalQuizzes = data.remainingQuizzes;
        if (localQuiz) {
          const { count, date } = JSON.parse(localQuiz);
          if (date === today) finalQuizzes = Math.min(data.remainingQuizzes, count);
        }
        setRemainingQuizzes(finalQuizzes);
        setActiveTab("dashboard");
        // Load danh sách công thức đã xem từ localStorage
        const storedViewed = localStorage.getItem(`formulax_viewed_${user.googleId}`);
        setViewedFormulaIds(storedViewed ? JSON.parse(storedViewed) : []);
        dataLoadedRef.current = true;
        // Load flashcard decks from Supabase
        loadFlashcardDecks(user.googleId).then(cloudDecks => {
          if (cloudDecks !== null) setFlashcardDecks(cloudDecks);
        });
        // Load lịch spaced-repetition của flashcard
        loadFlashcardProgress(user.googleId).then(setFlashcardProgress);
        // Sinh thông báo mới (nếu có) rồi tải danh sách thông báo hiện tại
        checkAndGenerateNotifications(user.googleId, notifPrefs)
          .then(() => getNotifications(user.googleId))
          .then(setNotifications)
          .catch(console.error);
        // Dữ liệu để tính "Gợi ý hôm nay" trên Dashboard (chủ đề yếu + chủ đề vừa học)
        getRecommendationContext(user.googleId).then(setRecommendationContext).catch(console.error);
        // Sync display name: ưu tiên Supabase, fallback localStorage (user-specific → shared)
        const nameFromDB = data.displayName;
        const nameFromLocal =
          localStorage.getItem(`formulax_display_name_${user.googleId}`) ||
          localStorage.getItem("formulax_display_name") || "";
        const finalName = nameFromDB || nameFromLocal;
        if (finalName) {
          setDisplayName(finalName);
          localStorage.setItem(`formulax_display_name_${user.googleId}`, finalName);
          localStorage.setItem("formulax_display_name", finalName);
          // Upload lên Supabase nếu local có tên mà DB chưa có
          if (!nameFromDB && nameFromLocal) {
            saveDisplayName(user.googleId, nameFromLocal).catch(console.error);
          }
        }
        // Force sync stats + display name vào Supabase
        saveStats(user.googleId, data.stats, finalName || undefined).catch(console.error);
        // Hiện onboarding nếu user thực sự chưa có dữ liệu nào (kiểm tra Supabase lẫn localStorage)
        const onboardedLocal = localStorage.getItem(`formulax_onboarded_${user.googleId}`);
        const hasAnyData = data.bookmarkedIds.length > 0
          || data.searchHistory.length > 0
          || data.stats.formulasViewed > 0
          || data.stats.flashcardsStudied > 0
          || data.stats.quizzesCompleted > 0;
        if (!onboardedLocal && !hasAnyData) setShowOnboarding(true);
      })
      .catch((err) => console.error("[Supabase] loadUserData:", err))
      .finally(() => setIsLoadingData(false));
  }, [user?.googleId]);

  // ─── Đồng bộ trạng thái Premium từ Supabase (nguồn sự thật do backend ghi sau khi MoMo xác nhận) ──
  useEffect(() => {
    if (!user?.googleId) return;
    checkPremiumStatus(user.googleId)
      .then((result) => setIsPremium(result.isPremium))
      .catch((err) => console.error("[Supabase] checkPremiumStatus:", err));
  }, [user?.googleId]);

  // ─── Stats — lưu ngay vào localStorage + debounce Supabase ────────────
  useEffect(() => {
    if (!user?.googleId || !dataLoadedRef.current) return;

    localStorage.setItem(`formulax_stats_${user.googleId}`, JSON.stringify(stats));

    clearTimeout(statsTimer.current);
    statsTimer.current = setTimeout(() => {
      saveStats(user.googleId, stats).catch(console.error);
    }, 500); // giảm debounce 500ms để lưu nhanh hơn
    return () => clearTimeout(statsTimer.current);
  }, [stats, user?.googleId]);

  // Theo dõi delta stats trong session → cộng vào todayStats
  useEffect(() => {
    if (!dataLoadedRef.current || !prevStatsRef.current) return;
    const dv = stats.formulasViewed  - prevStatsRef.current.formulasViewed;
    const dq = stats.quizzesCompleted - prevStatsRef.current.quizzesCompleted;
    const df = stats.flashcardsStudied - prevStatsRef.current.flashcardsStudied;
    if (dv > 0 || dq > 0 || df > 0) {
      setTodayStats(prev => ({
        formulasViewed:    prev.formulasViewed    + Math.max(dv, 0),
        quizzesCompleted:  prev.quizzesCompleted  + Math.max(dq, 0),
        flashcardsStudied: prev.flashcardsStudied + Math.max(df, 0),
      }));
    }
    prevStatsRef.current = { ...stats };
  }, [stats]);

  // Lưu Supabase ngay khi người dùng tắt/rời tab — tránh mất dữ liệu
  useEffect(() => {
    if (!user?.googleId) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && dataLoadedRef.current) {
        clearTimeout(statsTimer.current);
        saveStats(user.googleId, stats).catch(console.error);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.googleId, stats]);

  // ─── Quiz daily — lưu localStorage ngay + Supabase (chỉ sau khi load xong)
  useEffect(() => {
    if (!user?.googleId || !dataLoadedRef.current) return;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`formulax_quiz_${user.googleId}`, JSON.stringify({ count: remainingQuizzes, date: today }));
    saveQuizDaily(user.googleId, remainingQuizzes).catch(console.error);
  }, [remainingQuizzes, user?.googleId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleBookmark = (formulaId) => {
    const isBookmarked = bookmarkedIds.includes(formulaId);
    setBookmarkedIds((prev) =>
      isBookmarked ? prev.filter((x) => x !== formulaId) : [...prev, formulaId]
    );
    if (user?.googleId) {
      if (isBookmarked) removeBookmark(user.googleId, formulaId).catch(console.error);
      else              addBookmark(user.googleId, formulaId).catch(console.error);
    }
    showToast(isBookmarked ? "Đã xoá khỏi Bookmark" : "Đã thêm vào Bookmark");
  };

  const handleSaveNote = (formulaId, text) => {
    setUserNotes((prev) => ({ ...prev, [formulaId]: text }));
    if (user?.googleId) {
      saveNote(user.googleId, formulaId, text).catch(console.error);
    }
  };

  const handleViewDetail = (formula) => {
    setSelectedFormula(formula);
    setStats((prev) => ({ ...prev, formulasViewed: prev.formulasViewed + 1 }));
    // Thêm vào danh sách "đã xem" (dedup, công thức mới nhất lên đầu)
    setViewedFormulaIds((prev) => {
      if (prev.includes(formula.id)) return prev;
      const updated = [formula.id, ...prev];
      if (user?.googleId) {
        localStorage.setItem(`formulax_viewed_${user.googleId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleAddSearchHistory = (query) => {
    if (!query?.trim()) return;
    setSearchHistory((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 20));
    if (user?.googleId) {
      addSearchHistoryEntry(user.googleId, query).catch(console.error);
    }
  };

  const handleQuickFlashcard = (formula) => {
    const favoriteDecks = flashcardDecks.filter(d => d.type === "favorite");
    if (favoriteDecks.length === 0) {
      setActiveTab("flashcard");
    } else {
      setAddFormulaModal({ formula });
    }
  };

  useEffect(() => {
    localStorage.setItem("formulax_premium", isPremium);
  }, [isPremium]);

  const handleMarkNotificationsRead = () => {
    if (!notifications.some(n => n.unread)) return;
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    if (user?.googleId) markAllNotificationsRead(user.googleId).catch(console.error);
  };

  // Flush stats ngay lập tức rồi mới logout — tránh debounce bị cancel
  const handleLogout = async () => {
    if (user?.googleId) {
      clearTimeout(statsTimer.current);
      // Lưu localStorage ngay (không cần await)
      localStorage.setItem(`formulax_stats_${user.googleId}`, JSON.stringify(stats));
      // Lưu Supabase và chờ xong
      await saveStats(user.googleId, stats).catch(console.error);
    }
    logout();
  };

  // ─── Flashcard deck handlers ──────────────────────────────────────────────

  const handleAddFlashcardDeck = (deck) => {
    setFlashcardDecks(prev => [...prev, deck]);
    if (user?.googleId) upsertFlashcardDeck(user.googleId, deck).catch(console.error);
    showToast(`Đã tạo bộ thẻ "${deck.name}"`);
  };

  const handleDeleteFlashcardDeck = (deckId) => {
    setFlashcardDecks(prev => prev.filter(d => d.id !== deckId));
    if (user?.googleId) deleteFlashcardDeckDB(user.googleId, deckId).catch(console.error);
    showToast("Đã xoá bộ thẻ", "info");
  };

  const handleRenameFlashcardDeck = (deckId, newName) => {
    setFlashcardDecks(prev => {
      const updated = prev.map(d => d.id === deckId ? { ...d, name: newName, updatedAt: new Date().toISOString() } : d);
      if (user?.googleId) {
        const deck = updated.find(d => d.id === deckId);
        if (deck) upsertFlashcardDeck(user.googleId, deck).catch(console.error);
      }
      return updated;
    });
  };

  const handleAddFormulaToFavoriteDeck = (formulaId, deckId) => {
    let alreadyInDeck = false;
    let deckName = "";
    setFlashcardDecks(prev => {
      const updated = prev.map(d => {
        if (d.id !== deckId) return d;
        deckName = d.name;
        if (d.formulaIds.includes(formulaId)) { alreadyInDeck = true; return d; }
        const updatedDeck = { ...d, formulaIds: [...d.formulaIds, formulaId], updatedAt: new Date().toISOString() };
        if (user?.googleId) upsertFlashcardDeck(user.googleId, updatedDeck).catch(console.error);
        return updatedDeck;
      });
      return updated;
    });
    setAddFormulaModal(null);
    showToast(alreadyInDeck ? `Công thức đã có trong "${deckName}"` : `Đã thêm vào "${deckName}"`, alreadyInDeck ? "info" : "success");
  };

  const handleRemoveFormulaFromDeck = (formulaId, deckId) => {
    setFlashcardDecks(prev => {
      const updated = prev.map(d => {
        if (d.id !== deckId) return d;
        const updatedDeck = { ...d, formulaIds: d.formulaIds.filter(id => id !== formulaId), updatedAt: new Date().toISOString() };
        if (user?.googleId) upsertFlashcardDeck(user.googleId, updatedDeck).catch(console.error);
        return updatedDeck;
      });
      return updated;
    });
  };

  const handleGradeCard = (formulaId, remembered) => {
    const next = computeNextReview(flashcardProgress[formulaId], remembered);
    setFlashcardProgress(prev => ({ ...prev, [formulaId]: next }));
    if (user?.googleId) upsertFlashcardProgress(user.googleId, formulaId, next).catch(console.error);
  };

  // ─── Onboarding ───────────────────────────────────────────────────────────
  const handleOnboardingFinish = (grade) => {
    setShowOnboarding(false);
    if (user?.googleId) {
      localStorage.setItem(`formulax_onboarded_${user.googleId}`, "1");
    }
    // Lưu lớp ưu tiên nếu người dùng chọn
    if (grade && user?.googleId) {
      handleSetUserGrade(grade);
    }
  };

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (!isLoggedIn) return <LoginView />;

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <img src="/favicon.svg" alt="FormulaX" className="w-12 h-12 rounded-xl animate-pulse" />
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E2E8F0] dark:border-[#334155] border-t-accent animate-spin" />
        <p className="text-[0.85rem] font-semibold text-text-muted dark:text-[#94A3B8]">
          Đang tải dữ liệu của bạn…
        </p>
      </div>
    );
  }

  // ─── Render views ─────────────────────────────────────────────────────────
  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            user={user}
            displayName={displayName}
            setActiveTab={setActiveTab}
            formulas={formulas}
            onViewDetail={handleViewDetail}
            isPremium={isPremium}
            remainingQuizzes={remainingQuizzes}
            stats={stats}
            todayStats={todayStats}
            userGrade={userGrade}
            weakTopics={recommendationContext.weakTopics}
            recentTopic={recommendationContext.recentTopic}
            viewedFormulaIds={viewedFormulaIds}
          />
        );
      case "library":
        return (
          <FormulaLibrary
            formulas={formulas}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onCreateFlashcard={handleQuickFlashcard}
            onViewDetail={handleViewDetail}
            setActiveTab={setActiveTab}
          />
        );
      case "finder":
        return (
          <FormulaFinder
            formulas={formulas}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onCreateFlashcard={handleQuickFlashcard}
            onViewDetail={handleViewDetail}
            searchHistory={searchHistory}
            onAddSearchHistory={handleAddSearchHistory}
            setActiveTab={setActiveTab}
            isPremium={isPremium}
          />
        );
      case "flashcard":
        return (
          <FlashcardView
            formulas={formulas}
            setActiveTab={setActiveTab}
            isPremium={isPremium}
            stats={stats}
            setStats={setStats}
            user={user}
            decks={flashcardDecks}
            onAddDeck={handleAddFlashcardDeck}
            onDeleteDeck={handleDeleteFlashcardDeck}
            onRenameDeck={handleRenameFlashcardDeck}
            onRemoveFormula={handleRemoveFormulaFromDeck}
            progress={flashcardProgress}
            onGradeCard={handleGradeCard}
          />
        );
      case "quiz":
        return (
          <QuizView
            setActiveTab={setActiveTab}
            isPremium={isPremium}
            remainingQuizzes={remainingQuizzes}
            setRemainingQuizzes={setRemainingQuizzes}
            stats={stats}
            setStats={setStats}
            user={user}
          />
        );
      case "progress":
        return (
          <ProgressDashboard
            user={user}
            formulas={formulas}
            setActiveTab={setActiveTab}
            onViewDetail={handleViewDetail}
            isPremium={isPremium}
            stats={stats}
          />
        );
      case "premium":
        return (
          <PremiumUpgrade
            isPremium={isPremium}
            setIsPremium={setIsPremium}
            setActiveTab={setActiveTab}
          />
        );
      case "settings":
        return (
          <SettingsView
            user={user}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            displayName={displayName}
            onSetDisplayName={handleSetDisplayName}
            userGrade={userGrade}
            onSetUserGrade={handleSetUserGrade}
            isPremium={isPremium}
            notifPrefs={notifPrefs}
            onSetNotifPrefs={handleSetNotifPrefs}
          />
        );
      default:
        return (
          <Dashboard
            user={user}
            displayName={displayName}
            setActiveTab={setActiveTab}
            formulas={formulas}
            onViewDetail={handleViewDetail}
            isPremium={isPremium}
            remainingQuizzes={remainingQuizzes}
            stats={stats}
            todayStats={todayStats}
            userGrade={userGrade}
            weakTopics={recommendationContext.weakTopics}
            recentTopic={recommendationContext.recentTopic}
            viewedFormulaIds={viewedFormulaIds}
          />
        );
    }
  };

  // Ẩn ngay những loại thông báo người dùng vừa tắt trong Cài đặt, không cần đợi lần tải kế tiếp
  const visibleNotifications = notifications.filter(n => notifPrefs?.[n.category] !== false);

  return (
    <div className="app-container">
      <Header
        user={user}
        isPremium={isPremium}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
        displayName={displayName}
        setActiveTab={setActiveTab}
        notifications={visibleNotifications}
        onOpenNotifications={handleMarkNotificationsRead}
      />

      {renderView()}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayName={displayName}
        onLogout={handleLogout}
        user={user}
        isLoggedIn={isLoggedIn}
        isPremium={isPremium}
        notifications={visibleNotifications}
        onOpenNotifications={handleMarkNotificationsRead}
      />

      {showOnboarding && (
        <OnboardingModal
          onFinish={handleOnboardingFinish}
          onGoToFinder={() => setActiveTab("finder")}
          onGoToQuiz={() => setActiveTab("quiz")}
        />
      )}

      {selectedFormula && (
        <FormulaDetailModal
          formula={selectedFormula}
          isBookmarked={bookmarkedIds.includes(selectedFormula.id)}
          userNote={userNotes[selectedFormula.id] || ""}
          onClose={() => setSelectedFormula(null)}
          onSaveNote={handleSaveNote}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {addFormulaModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
          onClick={() => setAddFormulaModal(null)}>
          <div style={{ background:"white", borderRadius:"16px", padding:"24px", width:"100%", maxWidth:"400px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:"1.1rem", fontWeight:"800", color:"#1E3A5F", marginBottom:"4px" }}>Thêm vào bộ yêu thích</h3>
            <p style={{ fontSize:"0.8rem", color:"#64748B", marginBottom:"16px" }}>Chọn bộ để thêm <strong>"{addFormulaModal.formula.name}"</strong></p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:"300px", overflowY:"auto" }}>
              {flashcardDecks.filter(d => d.type === "favorite").map(deck => (
                <button key={deck.id}
                  onClick={() => handleAddFormulaToFavoriteDeck(addFormulaModal.formula.id, deck.id)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", border:"1.5px solid #E2E8F0", borderRadius:"10px", background:"white", cursor:"pointer", textAlign:"left", fontSize:"0.9rem", fontWeight:"600", color:"#1E3A5F" }}>
                  <span>{deck.name}</span>
                  <span style={{ fontSize:"0.75rem", color:"#94A3B8" }}>{deck.formulaIds.length} công thức</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddFormulaModal(null)}
              style={{ marginTop:"16px", width:"100%", padding:"10px", border:"1.5px solid #E2E8F0", borderRadius:"10px", background:"white", cursor:"pointer", fontSize:"0.85rem", color:"#64748B", fontWeight:"600" }}>
              Huỷ
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfirmDialogHost />
    </div>
  );
}
