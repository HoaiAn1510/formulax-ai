import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import "./App.css";

import { useAuth } from "./context/AuthContext";
import {
  loadUserData,
  checkPremiumStatus,
  addBookmark, removeBookmark,
  saveNote,
  saveStats,
  addSearchHistoryEntry,
  saveQuizDaily,
  saveDisplayName,
  savePreferences, loadPreferences, saveViewedFormulaIds, saveDailyChallenge,
  loadFlashcardDecks, upsertFlashcardDeck, deleteFlashcardDeck as deleteFlashcardDeckDB,
  loadFlashcardProgress, upsertFlashcardProgress,
  checkAndGenerateNotifications, getNotifications, markAllNotificationsRead,
  getRecommendationContext,
} from "./lib/supabase";
import { computeNextReview } from "./utils/spacedRepetition";
import { useGuestGate } from "./utils/useGuestGate";
import { getGuestQuizRemaining } from "./utils/guestQuiz";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import FormulaDetailModal from "./components/FormulaDetailModal";
import OnboardingModal from "./components/OnboardingModal";
import { ToastContainer, showToast } from "./components/Toast";
import { ConfirmDialogHost } from "./components/ConfirmDialog";

// Dashboard và LoginView là màn hình đầu tiên người dùng thấy (đã đăng nhập / chưa đăng nhập)
// nên giữ nạp thẳng — lazy hai màn này chỉ thêm một vòng request trước khi vẽ được gì.
import Dashboard from "./views/Dashboard";
import LoginView from "./views/LoginView";
import { vietnamToday } from "./utils/vietnamDate";

// Các view còn lại tách thành chunk riêng, chỉ tải khi người dùng thực sự mở tab đó.
// Trước đây tất cả nằm chung một bundle: riêng QuizView kéo theo cả questions.js (356 KB)
// dù người dùng chưa hề vào phần luyện tập.
const FormulaLibrary   = lazy(() => import("./views/FormulaLibrary"));
const FormulaFinder    = lazy(() => import("./views/FormulaFinder"));
const FlashcardView    = lazy(() => import("./views/FlashcardView"));
const QuizView         = lazy(() => import("./views/QuizView"));
const PremiumUpgrade   = lazy(() => import("./views/PremiumUpgrade"));
const ProgressDashboard = lazy(() => import("./views/ProgressDashboard"));
const SettingsView     = lazy(() => import("./views/SettingsView"));

// Màn hình chờ dùng chung khi đang tải chunk của một view (hoặc dữ liệu công thức).
function ViewLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="w-8 h-8 rounded-full border-[3px] border-[#E2E8F0] dark:border-[#334155] border-t-accent animate-spin" />
      <p className="text-[0.8rem] font-semibold text-text-muted dark:text-[#94A3B8]">Đang tải…</p>
    </div>
  );
}

export default function App() {
  const { user, logout, isLoggedIn, authLoading } = useAuth();
  // Khách (phiên ẩn danh) được xem nội dung nhưng mọi thao tác lưu dữ liệu cá nhân đều đi qua
  // requireGoogle() ở các handler bên dưới — một chốt chung cho mọi nơi gọi (Thư viện, AI
  // Finder, modal chi tiết...), thay vì để mỗi view tự nhớ kiểm tra.
  const { isGuest, requireGoogle } = useGuestGate();

  const [activeTab, setActiveTab]   = useState("dashboard");
  // Cờ Premium được cache ở localStorage để khỏi nháy giao diện khi tải lại trang. Cache gắn
  // theo googleId và chỉ có hiệu lực khi trùng người đang đăng nhập — trước đây là một khoá
  // chung cho cả máy, nên tài khoản Free (hoặc khách) đăng nhập sau một tài khoản Premium trên
  // cùng trình duyệt sẽ hiện Premium cho tới khi kiểm tra xong, hoặc luôn luôn nếu kiểm tra lỗi
  // mạng. Chỉ ảnh hưởng giao diện: backend tự đọc bảng users, không tin cờ này.
  // premiumState chỉ giữ kết quả đã biết chắc (kiểm tra từ Supabase / PremiumUpgrade). Khi chưa có
  // kết quả cho đúng tài khoản đang đăng nhập thì đọc cache của chính tài khoản đó — không suy
  // googleId từ formulax_user, vì AuthContext xoá khoá đó trong lúc phiên đang khôi phục.
  const [premiumState, setPremiumState] = useState({ googleId: null, value: false });
  // useCallback: PremiumUpgrade đưa hàm này vào deps của effect gọi Supabase — đổi danh tính mỗi
  // lần render sẽ khiến effect đó chạy lại liên tục.
  const setIsPremium = useCallback(
    (value) => setPremiumState({ googleId: user?.googleId ?? null, value: Boolean(value) }),
    [user?.googleId]
  );
  const [premiumExpiryValue, setPremiumExpiry] = useState(null); // ISO string — dùng cho màn hình trạng thái tài khoản Premium
  const isPremium = !isGuest && Boolean(user?.googleId) && (
    premiumState.googleId === user.googleId
      ? premiumState.value
      : localStorage.getItem(`formulax_premium_${user.googleId}`) === "true"
  );
  const premiumExpiry = isGuest ? null : premiumExpiryValue;
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [isLoadingData, setIsLoadingData]     = useState(false);

  // formulas.js nặng ~410 KB nguồn (246 công thức kèm giải thích + ví dụ). Nạp tĩnh ở đây
  // đồng nghĩa toàn bộ khối đó nằm trong bundle đầu tiên, chặn cả những màn hình không cần
  // tới nó. Tải động ngay khi App mount: người dùng thấy khung Dashboard trước, danh sách
  // gợi ý điền vào ngay sau đó (thường trong cùng một nhịp vẽ vì request chạy song song).
  const [formulas, setFormulas] = useState([]);
  useEffect(() => {
    let alive = true;
    import("./data/formulas")
      .then((m) => { if (alive) setFormulas(m.formulas); })
      .catch((err) => console.error("Không tải được dữ liệu công thức:", err));
    return () => { alive = false; };
  }, []);

  // ─── Preferences ─────────────────────────────────────────────────────────
  // Nguồn sự thật là cột learning_stats.preferences của tài khoản (migration 008) — đổi trên máy
  // này thì máy khác nhận khi tải dữ liệu hoặc khi app được mở lại. localStorage chỉ còn là bộ
  // nhớ đệm để vẽ đúng ngay lúc mở app (trước khi tải xong) và cho khách, vốn không có tài khoản.
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("formulax_dark") === "true");
  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem("formulax_user");
    const gId = saved ? JSON.parse(saved)?.googleId : null;
    return (gId && localStorage.getItem(`formulax_display_name_${gId}`)) || "";
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userGrade, setUserGrade] = useState(() => {
    const saved = localStorage.getItem("formulax_user");
    const gId = saved ? JSON.parse(saved)?.googleId : null;
    const stored = gId && localStorage.getItem(`formulax_grade_${gId}`);
    return stored ? Number(stored) : null;
  });
  const [notifPrefs, setNotifPrefs] = useState({});

  // Bản cài đặt của tài khoản đang đăng nhập, ghi nguyên object mỗi lần đổi. Chỉ ghi sau khi đã
  // tải + gộp xong (prefsReadyRef), để một thao tác trong lúc đang tải không đè cài đặt trên server.
  const prefsRef = useRef({});
  const prefsReadyRef = useRef(false);
  const syncPreferences = (patch) => {
    if (!user?.googleId || !prefsReadyRef.current) return;
    prefsRef.current = { ...prefsRef.current, ...patch };
    savePreferences(user.googleId, prefsRef.current).catch(console.error);
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark-mode");
    else document.documentElement.classList.remove("dark-mode");
    localStorage.setItem("formulax_dark", darkMode);
  }, [darkMode]);

  // Khách vẫn đổi được giao diện (chỉ lưu ở máy); tài khoản Google thì lưu kèm lên server.
  const handleSetDarkMode = (value) => {
    setDarkMode(value);
    syncPreferences({ darkMode: value });
  };

  const handleSetUserGrade = (grade) => {
    if (!requireGoogle()) return;
    setUserGrade(grade);
    if (user?.googleId) localStorage.setItem(`formulax_grade_${user.googleId}`, String(grade));
    syncPreferences({ grade });
  };

  const handleSetNotifPrefs = (prefs) => {
    if (!requireGoogle()) return;
    setNotifPrefs(prefs);
    syncPreferences({ notifPrefs: prefs });
  };

  const handleSetDisplayName = (name) => {
    if (!requireGoogle()) return;
    setDisplayName(name);
    if (user?.googleId) localStorage.setItem(`formulax_display_name_${user.googleId}`, name);
    if (user?.googleId) saveDisplayName(user.googleId, name).catch(console.error);
  };

  // ─── User data ────────────────────────────────────────────────────────────
  const [bookmarkedIds, setBookmarkedIds]     = useState([]);
  const [userNotes, setUserNotes]             = useState({});
  const [stats, setStats]                     = useState({ formulasViewed: 0, flashcardsStudied: 0, quizzesCompleted: 0 });
  const [todayStats, setTodayStats]           = useState({ formulasViewed: 0, quizzesCompleted: 0, flashcardsStudied: 0 });
  const [remainingQuizzes, setRemainingQuizzes] = useState(10);
  // Khách: lượt Quiz lấy từ localStorage (utils/guestQuiz.js), tách hẳn khỏi quiz_daily của
  // tài khoản Google. QuizView tự trừ lượt qua consumeGuestQuiz() rồi gọi setter tương ứng.
  const [guestQuizzesLeft, setGuestQuizzesLeft] = useState(getGuestQuizRemaining);
  const quizzesLeft = isGuest ? guestQuizzesLeft : remainingQuizzes;
  const setQuizzesLeft = isGuest ? setGuestQuizzesLeft : setRemainingQuizzes;
  const [searchHistory, setSearchHistory]     = useState([]);
  const [viewedFormulaIds, setViewedFormulaIds] = useState([]);
  const lastSavedViewedRef = useRef(null); // danh sách đã xem lần cuối ghi lên server
  const viewedTimer = useRef(null);
  // Câu trả lời Thử thách hôm nay của tài khoản { date, questionId, selectedLetter, isCorrect, collapsed }
  const [dailyChallenge, setDailyChallenge] = useState(null);
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
    // Đổi tài khoản/đăng xuất: không được ghi cài đặt của người trước lên tài khoản mới.
    prefsReadyRef.current = false;
    prefsRef.current = {};
    if (!user?.googleId) {
      dataLoadedRef.current = false; // reset khi logout
      setViewedFormulaIds([]);
      setDailyChallenge(null);
      setNotifPrefs({});
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
        const today = vietnamToday(); // cùng ngày với quiz_daily.reset_date (giờ Việt Nam)
        const localQuiz = localStorage.getItem(`formulax_quiz_${user.googleId}`);
        let finalQuizzes = data.remainingQuizzes;
        if (localQuiz) {
          const { count, date } = JSON.parse(localQuiz);
          if (date === today) finalQuizzes = Math.min(data.remainingQuizzes, count);
        }
        setRemainingQuizzes(finalQuizzes);
        setActiveTab("dashboard");

        // Cài đặt: giá trị đã lưu trên tài khoản thắng; mục nào tài khoản chưa từng lưu thì lấy
        // giá trị đang có ở máy này (người dùng cũ không mất cài đặt) rồi đẩy lên server.
        const gId = user.googleId;
        const fromDB = data.preferences && typeof data.preferences === "object" ? data.preferences : {};
        const localDark = localStorage.getItem("formulax_dark");
        const localGrade = Number(localStorage.getItem(`formulax_grade_${gId}`)) || null;
        let localNotif = null;
        try { localNotif = JSON.parse(localStorage.getItem("formulax_notif_prefs")); } catch { /* bỏ qua */ }
        const prefs = {
          darkMode: typeof fromDB.darkMode === "boolean" ? fromDB.darkMode
            : localDark !== null ? localDark === "true" : undefined,
          grade: fromDB.grade ?? localGrade ?? undefined,
          notifPrefs: fromDB.notifPrefs ?? localNotif ?? undefined,
          onboarded: Boolean(fromDB.onboarded || localStorage.getItem(`formulax_onboarded_${gId}`)),
        };
        Object.keys(prefs).forEach((k) => prefs[k] === undefined && delete prefs[k]);
        if (typeof prefs.darkMode === "boolean") setDarkMode(prefs.darkMode);
        if (prefs.grade) {
          setUserGrade(prefs.grade);
          localStorage.setItem(`formulax_grade_${gId}`, String(prefs.grade));
        }
        setNotifPrefs(prefs.notifPrefs || {});
        if (prefs.onboarded) localStorage.setItem(`formulax_onboarded_${gId}`, "1");
        prefsRef.current = prefs;
        prefsReadyRef.current = true;
        if (JSON.stringify(prefs) !== JSON.stringify(fromDB)) {
          savePreferences(gId, prefs).catch(console.error);
        }

        // Công thức đã xem: gộp danh sách trên tài khoản với danh sách cũ còn ở máy này.
        let localViewed = [];
        try { localViewed = JSON.parse(localStorage.getItem(`formulax_viewed_${gId}`)) || []; } catch { /* bỏ qua */ }
        const dbViewed = Array.isArray(data.viewedFormulaIds) ? data.viewedFormulaIds : [];
        const mergedViewed = [...new Set([...dbViewed, ...localViewed])];
        lastSavedViewedRef.current = dbViewed;
        setViewedFormulaIds(mergedViewed);

        // Thử thách hôm nay: chỉ giữ bản ghi của đúng hôm nay (giờ Việt Nam).
        setDailyChallenge(data.dailyChallenge?.date === today ? data.dailyChallenge : null);
        dataLoadedRef.current = true;
        // Load flashcard decks from Supabase
        loadFlashcardDecks(user.googleId).then(cloudDecks => {
          if (cloudDecks !== null) setFlashcardDecks(cloudDecks);
        });
        // Load lịch spaced-repetition của flashcard
        loadFlashcardProgress(user.googleId).then(setFlashcardProgress);
        // Sinh thông báo mới (nếu có) rồi tải danh sách thông báo hiện tại
        checkAndGenerateNotifications(user.googleId, prefs.notifPrefs || {})
          .then(() => getNotifications(user.googleId))
          .then(setNotifications)
          .catch(console.error);
        // Dữ liệu để tính "Gợi ý hôm nay" trên Dashboard (chủ đề yếu + chủ đề vừa học)
        getRecommendationContext(user.googleId).then(setRecommendationContext).catch(console.error);
        // Sync display name: ưu tiên Supabase, fallback bản lưu ở máy CỦA ĐÚNG tài khoản này.
        // Không đọc khoá chung formulax_display_name nữa: trên máy dùng chung, tài khoản mới sẽ
        // nhận nhầm tên của người đăng nhập trước rồi còn đẩy tên đó lên server.
        const nameFromDB = data.displayName;
        const nameFromLocal = localStorage.getItem(`formulax_display_name_${user.googleId}`) || "";
        const finalName = nameFromDB || nameFromLocal;
        setDisplayName(finalName);
        if (finalName) {
          localStorage.setItem(`formulax_display_name_${user.googleId}`, finalName);
          // Upload lên Supabase nếu local có tên mà DB chưa có
          if (!nameFromDB && nameFromLocal) {
            saveDisplayName(user.googleId, nameFromLocal).catch(console.error);
          }
        }
        // Force sync stats + display name vào Supabase
        saveStats(user.googleId, data.stats, finalName || undefined).catch(console.error);
        // Hiện onboarding nếu tài khoản chưa xem hướng dẫn (ở bất kỳ máy nào) và chưa có dữ liệu
        const hasAnyData = data.bookmarkedIds.length > 0
          || data.searchHistory.length > 0
          || data.stats.formulasViewed > 0
          || data.stats.flashcardsStudied > 0
          || data.stats.quizzesCompleted > 0;
        if (!prefs.onboarded && !hasAnyData) setShowOnboarding(true);
      })
      .catch((err) => console.error("[Supabase] loadUserData:", err))
      .finally(() => setIsLoadingData(false));
  }, [user?.googleId]);

  // ─── Đồng bộ trạng thái Premium từ Supabase (nguồn sự thật do backend ghi sau khi PayOS xác nhận) ──
  useEffect(() => {
    if (!user?.googleId) return;
    const googleId = user.googleId;
    checkPremiumStatus(googleId)
      .then((result) => {
        setPremiumState({ googleId, value: result.isPremium });
        setPremiumExpiry(result.premiumExpiry);
      })
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

  // ─── Công thức đã xem — lưu máy ngay + Supabase (gộp các lần mở liên tiếp, 1,5s) ──
  useEffect(() => {
    if (!user?.googleId || !dataLoadedRef.current) return;
    localStorage.setItem(`formulax_viewed_${user.googleId}`, JSON.stringify(viewedFormulaIds));
    if (JSON.stringify(viewedFormulaIds) === JSON.stringify(lastSavedViewedRef.current)) return;
    const googleId = user.googleId;
    clearTimeout(viewedTimer.current);
    viewedTimer.current = setTimeout(() => {
      lastSavedViewedRef.current = viewedFormulaIds;
      saveViewedFormulaIds(googleId, viewedFormulaIds).catch(console.error);
    }, 1500);
    return () => clearTimeout(viewedTimer.current);
  }, [viewedFormulaIds, user?.googleId]);

  // ─── Cài đặt đổi trên máy khác — tải lại khi app được mở lại ────────────
  // App (nhất là bản cài trên điện thoại) thường chỉ bị ẩn chứ không tải lại trang, nên đổi chế
  // độ tối trên laptop xong mở điện thoại lên sẽ không thấy. Mỗi lần app hiện lại thì đọc riêng
  // cột preferences (một dòng, rất nhẹ) và áp dụng nếu khác.
  useEffect(() => {
    if (!user?.googleId) return;
    const googleId = user.googleId;
    const handleVisible = () => {
      if (document.visibilityState !== "visible" || !prefsReadyRef.current) return;
      loadPreferences(googleId).then((fromDB) => {
        if (!fromDB || !prefsReadyRef.current) return;
        if (JSON.stringify(fromDB) === JSON.stringify(prefsRef.current)) return;
        prefsRef.current = { ...prefsRef.current, ...fromDB };
        if (typeof fromDB.darkMode === "boolean") setDarkMode(fromDB.darkMode);
        if (fromDB.grade) {
          setUserGrade(fromDB.grade);
          localStorage.setItem(`formulax_grade_${googleId}`, String(fromDB.grade));
        }
        if (fromDB.notifPrefs) setNotifPrefs(fromDB.notifPrefs);
      });
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [user?.googleId]);

  // ─── Quiz daily — lưu localStorage ngay + Supabase (chỉ sau khi load xong)
  useEffect(() => {
    if (!user?.googleId || !dataLoadedRef.current) return;
    const today = vietnamToday(); // cùng ngày với quiz_daily.reset_date (giờ Việt Nam)
    localStorage.setItem(`formulax_quiz_${user.googleId}`, JSON.stringify({ count: remainingQuizzes, date: today }));
    saveQuizDaily(user.googleId, remainingQuizzes).catch(console.error);
  }, [remainingQuizzes, user?.googleId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleBookmark = (formulaId) => {
    if (!requireGoogle()) return;
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
    if (!requireGoogle()) return;
    setUserNotes((prev) => ({ ...prev, [formulaId]: text }));
    if (user?.googleId) {
      saveNote(user.googleId, formulaId, text).catch(console.error);
    }
  };

  const handleViewDetail = (formula) => {
    setSelectedFormula(formula);
    setStats((prev) => ({ ...prev, formulasViewed: prev.formulasViewed + 1 }));
    // Thêm vào danh sách "đã xem" (dedup, công thức mới nhất lên đầu)
    // (effect "Công thức đã xem" phía trên lưu xuống máy + lên tài khoản)
    setViewedFormulaIds((prev) => (prev.includes(formula.id) ? prev : [formula.id, ...prev]));
  };

  // Thử thách hôm nay — DailyChallengeCard tự lưu ở máy; tài khoản Google thì lưu kèm lên server
  // để máy khác thấy đã làm (và đáp án đã chọn), không làm lại được câu khác đáp án.
  const handleSaveDailyChallenge = (record) => {
    setDailyChallenge(record);
    if (user?.googleId) saveDailyChallenge(user.googleId, record).catch(console.error);
  };

  const handleAddSearchHistory = (query) => {
    // Lịch sử tìm kiếm là tác dụng phụ ngầm, không phải thao tác người dùng bấm — với khách thì
    // bỏ qua im lặng, không hiện hộp thoại.
    if (isGuest || !query?.trim()) return;
    setSearchHistory((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 20));
    if (user?.googleId) {
      addSearchHistoryEntry(user.googleId, query).catch(console.error);
    }
  };

  const handleQuickFlashcard = (formula) => {
    if (!requireGoogle()) return;
    const favoriteDecks = flashcardDecks.filter(d => d.type === "favorite");
    if (favoriteDecks.length === 0) {
      setActiveTab("flashcard");
    } else {
      setAddFormulaModal({ formula });
    }
  };

  useEffect(() => {
    // Khoá chung cũ không gắn tài khoản — xoá để không còn nơi nào đọc nhầm.
    localStorage.removeItem("formulax_premium");
    localStorage.removeItem("formulax_display_name");
    if (!user?.googleId || premiumState.googleId !== user.googleId) return;
    localStorage.setItem(`formulax_premium_${user.googleId}`, String(premiumState.value));
  }, [premiumState, user?.googleId]);

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

  // Bộ thẻ + lịch ôn là dữ liệu theo người dùng. FlashcardView đã khóa nút tạo cho khách; các
  // chốt dưới đây là lớp dự phòng nếu sau này có nơi khác gọi tới.
  const handleAddFlashcardDeck = (deck) => {
    if (!requireGoogle()) return;
    setFlashcardDecks(prev => [...prev, deck]);
    if (user?.googleId) upsertFlashcardDeck(user.googleId, deck).catch(console.error);
    showToast(`Đã tạo bộ thẻ "${deck.name}"`);
  };

  const handleDeleteFlashcardDeck = (deckId) => {
    if (!requireGoogle()) return;
    setFlashcardDecks(prev => prev.filter(d => d.id !== deckId));
    if (user?.googleId) deleteFlashcardDeckDB(user.googleId, deckId).catch(console.error);
    showToast("Đã xoá bộ thẻ", "info");
  };

  const handleRenameFlashcardDeck = (deckId, newName) => {
    if (!requireGoogle()) return;
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
    if (!requireGoogle()) return;
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
    if (!requireGoogle()) return;
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
    if (isGuest) return;
    const next = computeNextReview(flashcardProgress[formulaId], remembered);
    setFlashcardProgress(prev => ({ ...prev, [formulaId]: next }));
    if (user?.googleId) upsertFlashcardProgress(user.googleId, formulaId, next).catch(console.error);
  };

  // ─── Onboarding ───────────────────────────────────────────────────────────
  const handleOnboardingFinish = (grade) => {
    setShowOnboarding(false);
    if (!user?.googleId) return;
    localStorage.setItem(`formulax_onboarded_${user.googleId}`, "1");
    // Lưu lớp ưu tiên nếu người dùng chọn. Gộp một lần ghi: hai lần ghi liền nhau có thể về
    // server sai thứ tự và lần về sau (thiếu grade) đè mất lần trước.
    if (grade) {
      setUserGrade(grade);
      localStorage.setItem(`formulax_grade_${user.googleId}`, String(grade));
    }
    syncPreferences(grade ? { onboarded: true, grade } : { onboarded: true });
  };

  // ─── Loading screen ───────────────────────────────────────────────────────
  // Phiên Supabase được khôi phục bất đồng bộ. Không chờ authLoading thì lần nào tải trang
  // người dùng đã đăng nhập cũng thấy nháy qua màn hình đăng nhập rồi mới vào app.
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <img src="/favicon.svg" alt="FormulaX" className="w-12 h-12 rounded-xl animate-pulse" />
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E2E8F0] dark:border-[#334155] border-t-accent animate-spin" />
      </div>
    );
  }

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
    // Bốn view này vô nghĩa khi chưa có dữ liệu công thức — danh sách rỗng trông như lỗi ứng
    // dụng. Chờ chunk formulas về rồi mới vẽ. Dashboard không nằm ở đây vì nó còn nhiều nội
    // dung khác vẽ được ngay, chỉ riêng phần "Gợi ý hôm nay" hiển thị skeleton.
    if (["library", "finder", "flashcard", "progress"].includes(activeTab) && formulas.length === 0) {
      return <ViewLoading />;
    }

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
            remainingQuizzes={quizzesLeft}
            stats={stats}
            todayStats={todayStats}
            userGrade={userGrade}
            weakTopics={recommendationContext.weakTopics}
            recentTopic={recommendationContext.recentTopic}
            viewedFormulaIds={viewedFormulaIds}
            dailyChallenge={dailyChallenge}
            onSaveDailyChallenge={handleSaveDailyChallenge}
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
            remainingQuizzes={quizzesLeft}
            setRemainingQuizzes={setQuizzesLeft}
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
            premiumExpiry={premiumExpiry}
            setPremiumExpiry={setPremiumExpiry}
            setActiveTab={setActiveTab}
          />
        );
      case "settings":
        return (
          <SettingsView
            user={user}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
            setDarkMode={handleSetDarkMode}
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
            remainingQuizzes={quizzesLeft}
            stats={stats}
            todayStats={todayStats}
            userGrade={userGrade}
            weakTopics={recommendationContext.weakTopics}
            recentTopic={recommendationContext.recentTopic}
            viewedFormulaIds={viewedFormulaIds}
            dailyChallenge={dailyChallenge}
            onSaveDailyChallenge={handleSaveDailyChallenge}
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

      <Suspense fallback={<ViewLoading />}>{renderView()}</Suspense>

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
