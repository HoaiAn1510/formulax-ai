import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import { useAuth } from "./context/AuthContext";
import { formulas } from "./data/formulas";
import {
  loadUserData,
  addBookmark, removeBookmark,
  saveNote,
  saveStats,
  resetStats,
  addSearchHistoryEntry,
  saveQuizDaily,
} from "./lib/supabase";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import FormulaDetailModal from "./components/FormulaDetailModal";
import OnboardingModal from "./components/OnboardingModal";

import Dashboard from "./views/Dashboard";
import FormulaLibrary from "./views/FormulaLibrary";
import FormulaFinder from "./views/FormulaFinder";
import FlashcardView from "./views/FlashcardView";
import QuizView from "./views/QuizView";
import PremiumUpgrade from "./views/PremiumUpgrade";
import LoginView from "./views/LoginView";

export default function App() {
  const { user, logout, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab]   = useState("dashboard");
  const [isPremium, setIsPremium]   = useState(false);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [isLoadingData, setIsLoadingData]     = useState(false);

  // ─── Preferences ─────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("formulax_dark") === "true");
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("formulax_display_name") || "");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark-mode");
    else document.documentElement.classList.remove("dark-mode");
    localStorage.setItem("formulax_dark", darkMode);
  }, [darkMode]);

  const handleSetDisplayName = (name) => {
    setDisplayName(name);
    localStorage.setItem("formulax_display_name", name);
  };

  // ─── User data ────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds]     = useState([]);
  const [userNotes, setUserNotes]             = useState({});
  const [stats, setStats]                     = useState({ formulasViewed: 0, flashcardsStudied: 0, quizzesCompleted: 0 });
  const [remainingQuizzes, setRemainingQuizzes] = useState(10);
  const [searchHistory, setSearchHistory]     = useState([]);
  const [viewedFormulaIds, setViewedFormulaIds] = useState([]);

  // Dùng ref để debounce save stats và track trạng thái đã load xong chưa
  const statsTimer     = useRef(null);
  const dataLoadedRef  = useRef(false); // chặn save trước khi load xong

  // ─── Load data khi user đăng nhập / đổi tài khoản ────────────────────────
  useEffect(() => {
    if (!user?.googleId) {
      dataLoadedRef.current = false; // reset khi logout
      setViewedFormulaIds([]);
      return;
    }
    dataLoadedRef.current = false; // chặn save trong khi đang load
    setIsLoadingData(true);
    loadUserData(user.googleId)
      .then((data) => {
        setBookmarkedIds(data.bookmarkedIds);
        setUserNotes(data.userNotes);
        setStats(data.stats);
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
        dataLoadedRef.current = true; // từ giờ mới cho phép save
        // Hiện onboarding nếu user chưa từng hoàn thành
        const onboarded = localStorage.getItem(`formulax_onboarded_${user.googleId}`);
        if (!onboarded) setShowOnboarding(true);
      })
      .catch((err) => console.error("[Supabase] loadUserData:", err))
      .finally(() => setIsLoadingData(false));
  }, [user?.googleId]);

  // ─── Stats — lưu ngay vào localStorage + debounce Supabase ────────────
  useEffect(() => {
    if (!user?.googleId || !dataLoadedRef.current) return;

    // Backup tức thì vào localStorage — không bao giờ mất dù Supabase có lỗi
    localStorage.setItem(`formulax_stats_${user.googleId}`, JSON.stringify(stats));

    // Đồng bộ Supabase sau 1s (debounce tránh gọi API liên tục)
    clearTimeout(statsTimer.current);
    statsTimer.current = setTimeout(() => {
      saveStats(user.googleId, stats).catch(console.error);
    }, 1000);
    return () => clearTimeout(statsTimer.current);
  }, [stats, user?.googleId]);

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
    setActiveTab("flashcard");
    alert(`Đã chuyển đến Flashcard — ôn tập "${formula.name}"!`);
  };

  const handleResetStats = async () => {
    const zero = { formulasViewed: 0, flashcardsStudied: 0, quizzesCompleted: 0 };
    setStats(zero);
    // Không reset remainingQuizzes — giới hạn quiz ngày là riêng biệt
    if (user?.googleId) {
      localStorage.setItem(`formulax_stats_${user.googleId}`, JSON.stringify(zero));
      await resetStats(user.googleId).catch(console.error);
    }
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

  // ─── Onboarding ───────────────────────────────────────────────────────────
  const handleOnboardingFinish = (grade) => {
    setShowOnboarding(false);
    if (user?.googleId) {
      localStorage.setItem(`formulax_onboarded_${user.googleId}`, "1");
    }
    // Lưu lớp ưu tiên nếu người dùng chọn
    if (grade && user?.googleId) {
      localStorage.setItem(`formulax_grade_${user.googleId}`, String(grade));
    }
  };

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (!isLoggedIn) return <LoginView />;

  if (isLoadingData) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "16px",
        backgroundColor: "#F8FAFC"
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: "3px solid #E2E8F0", borderTopColor: "#3B82F6",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}>
          Đang tải dữ liệu của bạn…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            onResetStats={handleResetStats}
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
            viewedFormulaIds={viewedFormulaIds}
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
            onResetStats={handleResetStats}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <div className="glow-bg-1"></div>
      <div className="glow-bg-2"></div>

      <Header
        user={user}
        isPremium={isPremium}
        onResetStats={handleResetStats}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
      />

      {renderView()}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        displayName={displayName}
        onSetDisplayName={handleSetDisplayName}
        onLogout={handleLogout}
        user={user}
        isLoggedIn={isLoggedIn}
        isPremium={isPremium}
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
    </div>
  );
}
