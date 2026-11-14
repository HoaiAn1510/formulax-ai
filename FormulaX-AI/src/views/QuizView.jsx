import React, { useState, useEffect, useMemo, useRef } from "react";
import { Timer, CheckCircle, XCircle, Crown, Lock, ArrowLeft, ArrowRight, Play, Check, List, Pencil, Shuffle, Sparkles, Flag, History } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { questionsPool as pool } from "../data/questions";
import { saveQuizResult, loadChatSessions, fetchWithAuth } from "../lib/supabase";
import Confetti from "../components/Confetti";
import AskedProblemsPicker from "../components/AskedProblemsPicker";
import MimiMascot from "../components/MimiMascot";
import { CARD, LABEL, CHIP, CHIP_OFF, CHIP_ON, BTN_PRIMARY, BTN_SECONDARY } from "../utils/shellStyle";
import { showConfirm } from "../components/ConfirmDialog";
import { showToast } from "../components/Toast";
import { useGuestGate } from "../utils/useGuestGate";
import { getGuestQuizRemaining, consumeGuestQuiz, GUEST_QUIZ_DAILY_LIMIT } from "../utils/guestQuiz";
import { checkFillAnswer, isFillEligible } from "../utils/fillAnswer";
import { extractAskedProblems, togglePick, MAX_VARIANT_PICK } from "../utils/askedProblems";
import { toVariantQuestion, variantQuizTopic, variantFailureMessage, runSequential, retryBusyOnce } from "../utils/variantQuiz";
import PageShell from "../components/PageShell";
import FilterPicker from "../components/FilterPicker";
import { useEscapeKey } from "../utils/useEscapeKey";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
// 45 giây PHẢI lớn hơn ngân sách 40 giây/request của backend (VARIANT_BUDGET_MS trong
// backend/lib/quizVariant.js) — frontend bỏ cuộc trước thì backend vẫn tính lượt mà học sinh không thấy đề.
const VARIANT_TIMEOUT_MS = 45_000;

// Một câu "Luyện lại dạng bài" = 1 lượt AI (backend đếm, hoàn lượt khi lỗi). Lỗi ném ra có code/status/remaining
// để QuizView quyết định dừng hay gọi bài tiếp theo.
async function callVariant(item, grade) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VARIANT_TIMEOUT_MS);
  try {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/quiz/variant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: item.text, formulaIds: item.formulaIds, grade }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Không thể kết nối AI"), {
      status: res.status, code: data.code, remaining: data.remaining, retryAfter: data.retryAfter,
    });
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw Object.assign(new Error("AI phản hồi quá lâu, bạn thử lại sau nhé"), { code: "timeout" });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export default function QuizView({
  setActiveTab,
  isPremium,
  remainingQuizzes,
  setRemainingQuizzes,
  stats,
  setStats,
  user,
  formulas = [],
  userGrade = null,
  // "asked" khi mở từ nơi khác (Dashboard / Trợ lý hướng dẫn) để vào thẳng chế độ "Luyện lại dạng bài đã hỏi".
  initialMode = null,
  onConsumeInitialMode,
}) {
  const { loginNow: handleGuestLogin } = useGuestGate();
  // Khách làm bài và xem đáp án bình thường, chỉ khác 2 điểm: lượt/ngày đếm ở localStorage
  // (utils/guestQuiz.js) và kết quả không được lưu (saveQuizResult chỉ chạy khi có googleId).
  const isGuest = Boolean(user?.isAnonymous);
  const formulasById = useMemo(() => new Map(formulas.map((f) => [f.id, f])), [formulas]);

  const [quizState, setQuizState] = useState("setup"); // setup, generating, active, result
  // Màn chọn đề: "pool" = đề có sẵn (questions.js), "asked" = luyện lại dạng bài đã hỏi AI.
  // initialMode: "asked" (nút trong lịch sử chat) hoặc { mode: "asked", preselect: { text, formulaIds } } (nút "Làm bài
  // kiểm tra cùng dạng này" dưới một câu hướng dẫn của Trợ lý hướng dẫn — chọn sẵn đúng bài đó).
  const [setupMode, setSetupMode] = useState(initialMode === "asked" || initialMode?.mode === "asked" ? "asked" : "pool");
  const [preselect] = useState(() => initialMode?.preselect || null);
  // Nguồn của bộ đề đang làm — "variant" không trừ lượt quiz (mỗi câu đã tính 1 lượt AI ở backend).
  const [quizSource, setQuizSource] = useState("pool");
  // Danh sách đã tải cho khoá lưu nào — khác khoá của tài khoản hiện tại nghĩa là đang tải.
  const [asked, setAsked] = useState({ key: null, items: [] });
  const askedKey = `formulax_chat_sessions_${user?.googleId || "guest"}`;
  const askedItems = asked.items;
  const askedLoading = asked.key !== askedKey;
  const [pickedKeys, setPickedKeys] = useState([]);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0 });
  const [retryWaitSeconds, setRetryWaitSeconds] = useState(0);
  const [reportedIds, setReportedIds] = useState(() => new Set());
  const genAliveRef = useRef(true);
  // Đặt lại true trong thân effect: StrictMode (dev) chạy cleanup một lần ngay lúc mount.
  useEffect(() => {
    genAliveRef.current = true;
    return () => { genAliveRef.current = false; };
  }, []);
  // initialMode đã được đọc vào setupMode lúc mount → báo App xoá.
  useEffect(() => { if (initialMode) onConsumeInitialMode?.(); }, [initialMode, onConsumeInitialMode]);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  useEscapeKey(() => setShowQuotaModal(false), showQuotaModal);
  // Topic: allMode=true → tất cả chủ đề (other buttons disabled); allMode=false → chọn nhiều chủ đề
  // initialMode { mode: "pool", topics }: mở từ Coach ở trang Tiến độ → chọn sẵn chủ đề đang yếu.
  const [allMode, setAllMode] = useState(() => !initialMode?.topics?.length);
  const [selectedTopics, setSelectedTopics] = useState(() => initialMode?.topics || []);
  // Grade: allGradeMode=true → tất cả các lớp; allGradeMode=false → chọn nhiều lớp
  const [allGradeMode, setAllGradeMode] = useState(true);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [questionCountInput, setQuestionCountInput] = useState("10");
  const [quizType, setQuizType] = useState("multiple-choice"); // multiple-choice, fill-in, hybrid
  const [timeLimitInput, setTimeLimitInput] = useState("0"); // phút, 0 = không giới hạn

  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [fillInputs, setFillInputs] = useState({});
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Bung confetti khi vừa nộp bài và đạt từ 80% trở lên — chỉ 1 lần mỗi lần chuyển sang màn kết quả
  useEffect(() => {
    if (quizState === "result" && questions.length > 0 && score / questions.length >= 0.8) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [quizState, questions.length, score]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(false);

  // Filter questions based on allMode/selectedTopics and allGradeMode/selectedGrades
  const getFilteredQuestions = () => {
    let list = [...pool];
    if (!allMode && selectedTopics.length > 0) {
      list = list.filter(q => selectedTopics.includes(q.topic));
    }
    if (!allGradeMode && selectedGrades.length > 0) {
      list = list.filter(q => selectedGrades.includes(q.grade));
    }
    // Chế độ Điền đáp án chỉ ra đề từ câu gõ được đáp án (isFillEligible — utils/fillAnswer.js).
    if (quizType === "fill-in") list = list.filter(isFillEligible);
    return list;
  };

  // Cap questionCountInput when available pool shrinks
  useEffect(() => {
    const max = getFilteredQuestions().length;
    const cur = parseInt(questionCountInput) || 1;
    if (cur > max) setQuestionCountInput(String(max));
  }, [allMode, selectedTopics, allGradeMode, selectedGrades, quizType]);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmitQuizAuto();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, questions, userAnswers]);

  const startQuiz = () => {
    // Khách: đọc lại lượt từ localStorage ngay lúc bấm thay vì tin state — tab mở qua nửa đêm
    // (giờ Việt Nam) vẫn được làm mới lượt đúng lúc.
    const quizzesLeft = isGuest ? getGuestQuizRemaining() : remainingQuizzes;
    if (isGuest) setRemainingQuizzes(quizzesLeft);
    if (!isPremium && quizzesLeft <= 0) {
      setShowQuotaModal(true);
      return;
    }

    const available = getFilteredQuestions();
    if (available.length === 0) {
      showToast("Chủ đề/lớp đã chọn chưa có câu hỏi nào. Hãy chọn phạm vi khác.", "error");
      return;
    }
    const count = Math.max(1, Math.min(parseInt(questionCountInput) || 10, available.length));
    const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, count);

    const letters = ["A", "B", "C", "D"];
    const questionsWithShuffledOptions = shuffled.map(q => {
      const opts = [...q.options].sort(() => 0.5 - Math.random())
        .map((opt, i) => ({ ...opt, letter: letters[i] }));
      return { ...q, options: opts };
    });

    setQuestions(questionsWithShuffledOptions);
    setQuizSource("pool");
    setCurrentQIdx(0);
    setUserAnswers({});
    setFillInputs({});
    setScore(0);

    const limitMins = parseInt(timeLimitInput) || 0;
    if (limitMins <= 0) {
      setTimeLeft(9999);
      setTimerActive(false);
    } else {
      setTimeLeft(limitMins * 60);
      setTimerActive(true);
    }

    setQuizState("active");
  };

  // ─── Luyện lại dạng bài đã hỏi ─────────────────────────────────────────
  // Lịch sử AI Finder: Supabase với tài khoản Google (lỗi mạng thì dùng bản ở máy), localStorage với khách.
  useEffect(() => {
    if (setupMode !== "asked" || isGuest) return;
    let alive = true;
    const fromLocal = () => { try { return JSON.parse(localStorage.getItem(askedKey) || "[]"); } catch { return []; } };
    // Bài được chọn sẵn: tìm trong danh sách theo đề (bỏ khác biệt khoảng trắng / hoa thường); chưa có (phiên chat vừa
    // hỏi có thể chưa kịp lưu lên server) thì thêm vào đầu danh sách. Chọn sẵn đúng bài đó.
    const apply = (sessions) => {
      let items = extractAskedProblems(sessions);
      if (preselect?.text?.trim()) {
        const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
        let hit = items.find((it) => norm(it.text) === norm(preselect.text));
        if (!hit) {
          hit = { key: "finder:just-asked", sessionId: "", text: preselect.text.trim().slice(0, 2000), askedAt: Date.now(), formulaIds: (preselect.formulaIds || []).slice(0, 4) };
          items = [hit, ...items];
        }
        setPickedKeys([hit.key]);
      }
      setAsked({ key: askedKey, items });
    };
    (user?.googleId ? loadChatSessions(user.googleId) : Promise.resolve(null))
      .then((cloud) => { if (alive) apply(cloud ?? fromLocal()); })
      .catch(() => { if (alive) apply(fromLocal()); });
    return () => { alive = false; };
  }, [setupMode, isGuest, user?.googleId, askedKey, preselect]);

  const startVariantQuiz = async (picked) => {
    const items = picked.slice(0, MAX_VARIANT_PICK); // chặn lần nữa ở đây, không chỉ ở ô chọn
    if (!items.length) return;
    if (isGuest) { handleGuestLogin(); return; }
    setGenProgress({ done: 0, total: items.length });
    setRetryWaitSeconds(0);
    setQuizState("generating");
    const { results, failures, stoppedBy } = await runSequential(
      items,
      async (item) => {
        const data = await retryBusyOnce(() => callVariant(item, userGrade), {
          onWait: (seconds) => { if (genAliveRef.current) setRetryWaitSeconds(seconds); },
          shouldRetry: () => genAliveRef.current,
        });
        const q = toVariantQuestion(data, item, (id) => formulasById.get(id));
        if (!q) throw Object.assign(new Error("Đề không hợp lệ"), { code: "variant_invalid" });
        return q;
      },
      {
        // Hết lượt / AI bận / quá giờ: gọi tiếp gần như chắc chắn lỗi y hệt → dừng, làm với các câu đã có.
        shouldStop: (e) => e.code === "quota_exceeded" || e.code === "ai_busy" || e.code === "timeout" || e.status === 401 || e.status === 403,
        onProgress: (done) => { if (genAliveRef.current) setGenProgress((p) => ({ ...p, done })); },
      },
    );
    if (!genAliveRef.current) return;
    if (failures.length) {
      showToast(variantFailureMessage(results.length, items.length, failures, stoppedBy), results.length ? "info" : "error");
    }
    if (!results.length) { setQuizState("setup"); return; }
    setQuestions(results);
    setQuizSource("variant");
    setCurrentQIdx(0);
    setUserAnswers({});
    setFillInputs({});
    setScore(0);
    setReportedIds(new Set());
    setTimeLeft(9999);
    setTimerActive(false);
    setQuizState("active");
  };

  const reportVariant = async (q) => {
    if (reportedIds.has(q.id)) return;
    setReportedIds((prev) => new Set(prev).add(q.id));
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/quiz/variant/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          answer: q.options.find((o) => o.isCorrect)?.text || "",
          formulaIds: q.formulaIds,
          verified: q.verified,
          reason: "Học sinh báo đề hoặc đáp án sai",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      showToast("Cảm ơn bạn! Mình đã ghi nhận câu này để kiểm tra lại.", "success");
    } catch {
      setReportedIds((prev) => { const next = new Set(prev); next.delete(q.id); return next; });
      showToast("Chưa gửi được báo cáo, bạn thử lại sau nhé.", "error");
    }
  };

  // Câu ở vị trí idx có làm dạng điền không. Kết hợp: câu chẵn (thứ 2, 4…) là điền, nhưng câu không
  // gõ được đáp án (isFillEligible) thì giữ dạng trắc nghiệm. Đề AI tạo luôn là trắc nghiệm.
  const isFillQuestion = (idx) => quizSource !== "variant"
    && (quizType === "fill-in" || (quizType === "hybrid" && idx % 2 === 1)) && isFillEligible(questions[idx]);

  // Chấm theo blankAnswer (checkFillAnswer), không so với chữ của phương án đúng — chữ đó có $ và
  // LaTeX nên trước đây gõ đúng vẫn bị chấm sai ở 405/428 câu.
  const isFillCorrect = (q, userInput) => (userInput || "").trim() !== "" && checkFillAnswer(userInput, q);

  const handleSelectOption = (option) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQIdx]: option
    }));
  };

  const handlePrevQuestion = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIdx + 1 < questions.length) {
      setCurrentQIdx(prev => prev + 1);
    }
  };

  const handleSubmitQuizAuto = () => {
    let finalScore = 0;

    questions.forEach((q, idx) => {
      if (isFillQuestion(idx)) {
        if (isFillCorrect(q, fillInputs[idx])) finalScore += 1;
      } else {
        const selected = userAnswers[idx];
        if (selected && selected.isCorrect) finalScore += 1;
      }
    });

    setScore(finalScore);
    setQuizState("result");

    // Đề AI tạo đã tính 1 lượt AI cho mỗi câu ở backend → không trừ thêm lượt quiz (chủ dự án chốt 2026-11-01).
    if (!isPremium && quizSource !== "variant") {
      if (isGuest) setRemainingQuizzes(consumeGuestQuiz());
      else setRemainingQuizzes(prev => Math.max(0, prev - 1));
    }

    setStats(prev => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1
    }));

    if (user?.googleId) {
      const topicName = quizSource === "variant"
        ? variantQuizTopic(questions)
        : (allMode || selectedTopics.length === 0 || selectedTopics.length > 1)
          ? "Tổng hợp"
          : selectedTopics[0];
      saveQuizResult(user.googleId, {
        topic: topicName,
        questionsTotal: questions.length,
        questionsCorrect: finalScore,
      }).catch(console.error);
    }
  };

  const handleSubmitQuiz = async () => {
    const unansweredCount = questions.filter((_, idx) =>
      isFillQuestion(idx) ? !fillInputs[idx]?.trim() : !userAnswers[idx]
    ).length;
    if (unansweredCount > 0) {
      const confirmed = await showConfirm(
        `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?`,
        { confirmLabel: "Nộp bài", cancelLabel: "Làm tiếp" }
      );
      if (!confirmed) return;
    }
    handleSubmitQuizAuto();
  };

  const formatTime = (seconds) => {
    if (seconds > 9000) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentQIdx];
  const specificTopics = ["Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất & Thống kê", "Mở rộng"];
  const filteredQuestions = getFilteredQuestions();
  const maxQuestions = filteredQuestions.length;

  // Phím tắt lúc làm bài: 1-4 chọn đáp án (trắc nghiệm), ← → chuyển câu.
  // Bỏ qua khi đang gõ vào ô điền đáp án (fill-in) để không phá thao tác gõ chữ/số bình thường.
  useEffect(() => {
    if (quizState !== "active") return;
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") { handlePrevQuestion(); return; }
      if (e.key === "ArrowRight") { handleNextQuestion(); return; }
      if (!isFillQuestion(currentQIdx) && ["1", "2", "3", "4"].includes(e.key)) {
        const option = currentQ?.options?.[Number(e.key) - 1];
        if (option) handleSelectOption(option);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizState, currentQIdx, currentQ, quizType]);

  const handleTopicClick = (t) => {
    if (t === "Tất cả chủ đề") {
      setAllMode(true);
      setSelectedTopics([]);
      return;
    }
    if (allMode) {
      // Switch from all-mode to specific: deselect Tất cả, select this topic
      setAllMode(false);
      setSelectedTopics([t]);
      return;
    }
    const next = selectedTopics.includes(t)
      ? selectedTopics.filter(x => x !== t)
      : [...selectedTopics, t];
    if (next.length === 0) {
      setAllMode(true);
    }
    setSelectedTopics(next);
  };

  const handleGradeClick = (g) => {
    if (g === "Tất cả các lớp") {
      setAllGradeMode(true);
      setSelectedGrades([]);
      return;
    }
    if (allGradeMode) {
      setAllGradeMode(false);
      setSelectedGrades([g]);
      return;
    }
    const next = selectedGrades.includes(g)
      ? selectedGrades.filter(x => x !== g)
      : [...selectedGrades, g];
    if (next.length === 0) {
      setAllGradeMode(true);
    }
    setSelectedGrades(next);
  };

  return (
    <PageShell width="full"
      title={quizState === "setup" ? "Kiểm tra" : undefined}
      description={quizState === "setup" ? "Làm đề có sẵn có lời giải, hoặc luyện lại đúng dạng bài bạn đã hỏi AI với số liệu mới." : undefined}
      onBack={quizState === "setup" ? () => setActiveTab("dashboard") : undefined}
    >

          {/* Modal hết quota */}
          {showQuotaModal && (
            <div role="dialog" aria-modal="true" aria-label="Hết lượt quiz hôm nay" className="fixed inset-0 z-[9999] bg-[rgba(15,23,42,0.6)] backdrop-blur-[4px] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1E293B] rounded-[20px] w-full max-w-[380px] py-7 px-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] text-center">
                {/* Icon */}
                <div className="w-[52px] h-[52px] rounded-full bg-premium/10 flex items-center justify-center mx-auto mb-4">
                  <Crown size={24} color="#F59E0B" />
                </div>

                <h2 className="text-[1.15rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0] mb-2">
                  Hết lượt quiz hôm nay!
                </h2>
                {isGuest ? (
                  <p className="text-[0.83rem] text-text-muted dark:text-[#94A3B8] leading-[1.55] mb-5">
                    Bạn đã dùng hết <strong>{GUEST_QUIZ_DAILY_LIMIT}/{GUEST_QUIZ_DAILY_LIMIT} lượt quiz của chế độ khách</strong> hôm nay.
                    Lượt sẽ được làm mới vào ngày mai — hoặc đăng nhập Google để luyện tiếp và lưu kết quả.
                  </p>
                ) : (
                  <p className="text-[0.83rem] text-text-muted dark:text-[#94A3B8] leading-[1.55] mb-5">
                    Bạn đã dùng hết <strong>10/10 lượt quiz miễn phí</strong> ngày hôm nay.
                    Lượt sẽ được reset vào ngày mai — hoặc nâng cấp <strong>Premium</strong> để luyện không giới hạn!
                  </p>
                )}

                {/* Highlight — khách chưa có tài khoản để nâng cấp nên không mời mua Premium */}
                {!isGuest && (
                  <div className="bg-[linear-gradient(135deg,#FFFBEB,#FEF3C7)] dark:bg-none dark:bg-premium/10 border border-premium/25 rounded-xl py-3 px-4 mb-5 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-[0.7rem] text-[#92400E] dark:text-[#FCD34D] font-bold mb-0.5">Premium</div>
                      <div className="text-[0.82rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0]">Quiz không giới hạn mỗi ngày</div>
                    </div>
                    <div className="text-[0.9rem] font-extrabold text-premium">49.000đ/tháng</div>
                  </div>
                )}

                {/* Buttons */}
                {isGuest ? (
                  <button
                    onClick={() => { setShowQuotaModal(false); handleGuestLogin(); }}
                    className="w-full py-3 rounded-xl border-none bg-accent hover:bg-accent-hover text-white font-extrabold text-[0.9rem] cursor-pointer mb-2.5 flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    Đăng nhập Google
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowQuotaModal(false); setActiveTab("premium"); }}
                    className="w-full py-3 rounded-xl border-none bg-accent hover:bg-accent-hover text-white font-extrabold text-[0.9rem] cursor-pointer mb-2.5 flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    <Crown size={16} /> Nâng cấp Premium ngay
                  </button>
                )}
                <button
                  onClick={() => setShowQuotaModal(false)}
                  className="w-full py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-text-muted dark:text-[#94A3B8] font-semibold text-[0.85rem] cursor-pointer"
                >
                  Để ngày mai quay lại
                </button>
              </div>
            </div>
          )}

          {/* ─── Màn chọn đề ─────────────────────────────────────────────── */}
          {quizState === "setup" && (
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Kiểu đề */}
              <div role="tablist" aria-label="Kiểu đề" className="grid grid-cols-2 gap-1 p-1 rounded-[14px] border border-line dark:border-[#334155] bg-white dark:bg-[#1E293B] md:max-w-[620px]">
                {[
                  { id: "pool", icon: List, label: "Đề có sẵn", hint: "Trắc nghiệm theo lớp, chủ đề" },
                  { id: "asked", icon: History, label: "Luyện lại bài đã hỏi", hint: "AI đổi số liệu, giữ dạng bài" },
                ].map(({ id, icon: Icon, label, hint }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={setupMode === id}
                    onClick={() => setSetupMode(id)}
                    className={`flex flex-col items-center gap-0.5 rounded-[11px] py-2.5 px-2 border-none cursor-pointer transition-colors ${
                      setupMode === id ? "bg-navy-btn text-white dark:bg-accent" : "bg-transparent text-text-muted dark:text-[#94A3B8] hover:text-primary dark:hover:text-[#E2E8F0]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[0.85rem] font-semibold"><Icon size={15} /> {label}</span>
                    <span className={`text-[0.68rem] font-medium ${setupMode === id ? "text-white/70" : ""}`}>{hint}</span>
                  </button>
                ))}
              </div>

              {setupMode === "asked" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:items-start">
                  <section className={`${CARD} relative lg:col-span-5 mt-[52px] lg:mt-[70px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] p-5 md:p-8 flex flex-col gap-3`}>
                    <MimiMascot width={130} className="lg:hidden absolute right-3 -top-[56px]" />
                    <MimiMascot width={180} className="hidden lg:block absolute right-6 -top-[76px]" />
                    <div className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>Luyện lại dạng bài</div>
                    <h2 className="m-0 text-[1.4rem] md:text-[1.9rem] leading-[1.2] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">Cùng dạng, số liệu mới</h2>
                    <p className="m-0 text-[0.88rem] md:text-[0.95rem] leading-[1.6] text-text-muted dark:text-[#94A3B8]">
                      Chọn tối đa {MAX_VARIANT_PICK} bài bạn đã hỏi AI. Mỗi bài, AI viết một câu cùng dạng với số liệu khác để bạn tự làm lại.
                    </p>
                    <p className="m-0 flex items-start gap-1.5 text-[0.78rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">
                      <Sparkles size={13} className="text-accent shrink-0 mt-0.5" />
                      <span>{isPremium ? "Premium: tạo đề không giới hạn." : "Mỗi câu dùng 1 lượt AI (chung 10 lượt/ngày với Trợ lý hướng dẫn), lỗi thì được hoàn lượt."}</span>
                    </p>
                    {!isGuest && askedItems.length > 0 && (
                      <button
                        type="button"
                        className={`${BTN_PRIMARY} w-full mt-2`}
                        disabled={!pickedKeys.length}
                        onClick={() => startVariantQuiz(pickedKeys.map((k) => askedItems.find((i) => i.key === k)).filter(Boolean))}
                      >
                        <Sparkles size={15} />
                        <span>{pickedKeys.length ? `Tạo ${pickedKeys.length} câu luyện tập` : "Chọn ít nhất 1 bài"}</span>
                      </button>
                    )}
                  </section>
                  <section className={`${CARD} lg:col-span-7 p-4 md:p-7 flex flex-col gap-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="m-0 text-[1.05rem] md:text-[1.2rem] font-bold text-primary dark:text-[#E2E8F0]">Bài đã hỏi</h2>
                      {pickedKeys.length > 0 && (
                        <span className="text-[0.75rem] font-semibold text-[#92400E] dark:text-[#FCD34D] bg-accent-light dark:bg-accent/15 rounded-full px-2.5 py-1">{pickedKeys.length}/{MAX_VARIANT_PICK} đã chọn</span>
                      )}
                    </div>
                    <AskedProblemsPicker
                      items={askedItems}
                      loading={askedLoading}
                      selected={pickedKeys}
                      onToggle={(key) => setPickedKeys((prev) => togglePick(prev, key))}
                      onPracticeOne={(item) => startVariantQuiz([item])}
                      formulasById={formulasById}
                      isGuest={isGuest}
                      onLogin={handleGuestLogin}
                      onGoFinder={() => setActiveTab("finder")}
                      busy={false}
                    />
                  </section>
                </div>
              )}

              {setupMode === "pool" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:items-start">
                  {/* Tóm tắt + nút bắt đầu */}
                  <section className={`${CARD} relative lg:col-span-5 mt-[52px] lg:mt-[70px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] p-5 md:p-8 flex flex-col gap-3 lg:min-h-[420px]`}>
                    <MimiMascot width={130} className="lg:hidden absolute right-3 -top-[56px]" />
                    <MimiMascot width={180} className="hidden lg:block absolute right-6 -top-[76px]" />
                    <div className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>Bài kiểm tra của bạn</div>
                    <h2 className="m-0 text-[1.5rem] md:text-[2.2rem] leading-[1.15] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">
                      {Math.max(1, Math.min(parseInt(questionCountInput) || 10, maxQuestions || 1))} câu{(parseInt(timeLimitInput) || 0) > 0 ? `, ${parseInt(timeLimitInput)} phút` : ", không giới hạn giờ"}
                    </h2>
                    <p className="m-0 text-[0.88rem] md:text-[0.95rem] leading-[1.6] text-text-muted dark:text-[#94A3B8]">
                      {quizType === "fill-in" ? "Điền đáp án" : quizType === "hybrid" ? "Kết hợp trắc nghiệm và điền đáp án" : "Trắc nghiệm"} · có lời giải chi tiết sau khi nộp bài.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center h-8 px-3 rounded-full bg-white dark:bg-[#0F172A] border border-line dark:border-[#334155] text-[0.78rem] font-semibold text-primary dark:text-[#E2E8F0]">
                        {allMode || selectedTopics.length === 0 ? "Tất cả chủ đề" : selectedTopics.join(" + ")}
                      </span>
                      <span className="inline-flex items-center h-8 px-3 rounded-full bg-white dark:bg-[#0F172A] border border-line dark:border-[#334155] text-[0.78rem] font-semibold text-primary dark:text-[#E2E8F0]">
                        {allGradeMode || selectedGrades.length === 0 ? "Tất cả các lớp" : selectedGrades.map(g => `Lớp ${g}`).join(" + ")}
                      </span>
                    </div>
                    <div className="flex-1" />
                    <button className={`${BTN_PRIMARY} w-full mt-2 py-3.5 text-[1rem]`} onClick={startQuiz}>
                      <Play size={15} fill="currentColor" />
                      <span>Bắt đầu làm bài</span>
                    </button>
                    <p className="m-0 text-center text-[0.78rem] text-text-muted dark:text-[#94A3B8]">
                      {isPremium
                        ? "Premium — không giới hạn lượt"
                        : isGuest
                          ? `Chế độ khách — còn ${remainingQuizzes}/${GUEST_QUIZ_DAILY_LIMIT} lượt hôm nay`
                          : `Còn ${remainingQuizzes}/10 lượt miễn phí hôm nay`}
                    </p>
                  </section>

                  {/* Tùy chỉnh */}
                  <section className={`${CARD} lg:col-span-7 p-4 md:p-8 flex flex-col gap-6`}>
                    <h2 className="m-0 text-[1.05rem] md:text-[1.2rem] font-bold text-primary dark:text-[#E2E8F0]">Tùy chỉnh bài kiểm tra</h2>

                    {/* Điện thoại: hai ô chọn bấm mở danh sách (giống Thư viện) thay cho hai hàng chip. */}
                    <div className="md:hidden flex items-stretch gap-2">
                      <FilterPicker
                        label="Lớp"
                        summary={allGradeMode || selectedGrades.length === 0 ? "Tất cả các lớp" : selectedGrades.map((g) => `Lớp ${g}`).join(", ")}
                        highlighted={!allGradeMode}
                        options={[
                          { value: "Tất cả các lớp", label: "Tất cả các lớp", active: allGradeMode },
                          ...[10, 11, 12].map((g) => ({ value: g, label: `Lớp ${g}`, active: !allGradeMode && selectedGrades.includes(g) })),
                        ]}
                        onToggle={handleGradeClick}
                      />
                      <FilterPicker
                        label="Chủ đề"
                        summary={allMode || selectedTopics.length === 0 ? "Tất cả chủ đề" : (selectedTopics.length > 1 ? `${selectedTopics[0]} +${selectedTopics.length - 1}` : selectedTopics[0])}
                        highlighted={!allMode}
                        options={[
                          { value: "Tất cả chủ đề", label: "Tất cả chủ đề", active: allMode },
                          ...specificTopics.map((t) => ({ value: t, label: t, active: !allMode && selectedTopics.includes(t) })),
                        ]}
                        onToggle={handleTopicClick}
                      />
                    </div>

                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={LABEL}>Chủ đề</div>
                        {!allMode && selectedTopics.length > 0 && (
                          <span className="text-[0.7rem] font-semibold text-[#92400E] dark:text-[#FCD34D] bg-accent-light dark:bg-accent/15 rounded-full py-0.5 px-2">{selectedTopics.length} đã chọn</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" aria-pressed={allMode} onClick={() => handleTopicClick("Tất cả chủ đề")} className={`${CHIP} ${allMode ? CHIP_ON : CHIP_OFF}`}>Tất cả chủ đề</button>
                        {specificTopics.map(t => {
                          const isActive = !allMode && selectedTopics.includes(t);
                          return (
                            <button key={t} type="button" aria-pressed={isActive} onClick={() => handleTopicClick(t)} className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}>{t}</button>
                          );
                        })}
                      </div>
                      {!allMode && selectedTopics.length === 0 && (
                        <p className="text-[0.72rem] text-[#B45309] mt-1.5 font-semibold">Chưa chọn chủ đề nào — sẽ lấy tất cả câu hỏi</p>
                      )}
                    </div>

                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={LABEL}>Lớp</div>
                        {!allGradeMode && selectedGrades.length > 0 && (
                          <span className="text-[0.7rem] font-semibold text-[#92400E] dark:text-[#FCD34D] bg-accent-light dark:bg-accent/15 rounded-full py-0.5 px-2">{selectedGrades.length} đã chọn</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" aria-pressed={allGradeMode} onClick={() => handleGradeClick("Tất cả các lớp")} className={`${CHIP} ${allGradeMode ? CHIP_ON : CHIP_OFF}`}>Tất cả các lớp</button>
                        {[10, 11, 12].map(g => {
                          const isActive = !allGradeMode && selectedGrades.includes(g);
                          return (
                            <button key={g} type="button" aria-pressed={isActive} onClick={() => handleGradeClick(g)} className={`${CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}>Lớp {g}</button>
                          );
                        })}
                      </div>
                      {!allGradeMode && selectedGrades.length === 0 && (
                        <p className="text-[0.72rem] text-[#B45309] mt-1.5 font-semibold">Chưa chọn lớp nào — sẽ lấy tất cả các lớp</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-2">
                        <span className={LABEL}>Số câu</span>
                        <span className="flex items-center gap-2.5">
                          <input
                            type="number"
                            min={1}
                            max={maxQuestions}
                            value={questionCountInput}
                            onChange={e => setQuestionCountInput(e.target.value)}
                            onBlur={e => {
                              const n = parseInt(e.target.value);
                              if (isNaN(n) || n < 1) setQuestionCountInput("1");
                              else if (n > maxQuestions) setQuestionCountInput(String(maxQuestions));
                              else setQuestionCountInput(String(n));
                            }}
                            className="w-[96px] h-11 text-center text-[1.05rem] font-bold text-primary dark:text-[#E2E8F0] border border-line dark:border-[#334155] focus:border-accent rounded-[12px] outline-none bg-page dark:bg-[#0F172A]"
                          />
                          <span className="text-[0.8rem] text-text-muted dark:text-[#94A3B8]">câu (tối đa {maxQuestions})</span>
                        </span>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className={LABEL}>Giới hạn thời gian</span>
                        <span className="flex items-center gap-2.5">
                          <input
                            type="number"
                            min={0}
                            value={timeLimitInput}
                            onChange={e => setTimeLimitInput(e.target.value)}
                            onBlur={e => {
                              const n = parseInt(e.target.value);
                              if (isNaN(n) || n < 0) setTimeLimitInput("0");
                              else setTimeLimitInput(String(n));
                            }}
                            className="w-[96px] h-11 text-center text-[1.05rem] font-bold text-primary dark:text-[#E2E8F0] border border-line dark:border-[#334155] focus:border-accent rounded-[12px] outline-none bg-page dark:bg-[#0F172A]"
                          />
                          <span className="text-[0.8rem] text-text-muted dark:text-[#94A3B8]">phút{(parseInt(timeLimitInput) || 0) === 0 ? " (không giới hạn)" : ""}</span>
                        </span>
                      </label>
                    </div>

                    <div>
                      <div className={`${LABEL} mb-3`}>Loại câu hỏi</div>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-[13px] border border-line dark:border-[#334155] bg-page dark:bg-[#0F172A]">
                        {[
                          { id: "multiple-choice", icon: List, label: "Trắc nghiệm", premium: false },
                          { id: "fill-in", icon: Pencil, label: "Điền đáp án", premium: true },
                          { id: "hybrid", icon: Shuffle, label: "Kết hợp", premium: true },
                        ].map(({ id, icon: Icon, label, premium }) => (
                          <button
                            key={id}
                            type="button"
                            aria-pressed={quizType === id}
                            onClick={() => {
                              if (premium && !isPremium) {
                                showToast(`Phương thức ${label} yêu cầu gói Premium!`, "info");
                                setActiveTab("premium");
                              } else {
                                setQuizType(id);
                              }
                            }}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-[10px] py-2.5 px-1 border-none cursor-pointer text-[0.78rem] sm:text-[0.85rem] font-semibold transition-colors ${
                              quizType === id ? "bg-navy-btn text-white dark:bg-accent" : "bg-transparent text-text-muted dark:text-[#94A3B8] hover:text-primary dark:hover:text-[#E2E8F0]"
                            }`}
                          >
                            <Icon size={15} />
                            <span className="flex items-center gap-1">{label}{premium && !isPremium && <Lock size={11} className="text-premium" />}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ─── Đang tạo đề AI — gọi lần lượt từng bài ─────────────────── */}
          {quizState === "generating" && (
            <div className={`${CARD} max-w-[560px] mx-auto w-full p-8 mt-4 flex flex-col items-center text-center gap-4`} role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-full bg-accent-light dark:bg-accent/15 text-accent flex items-center justify-center">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="text-[1.05rem] font-bold text-primary dark:text-[#E2E8F0]">
                  Đang tạo câu {Math.min(genProgress.done + 1, genProgress.total)}/{genProgress.total}
                </div>
                <p className="m-0 mt-1 text-[0.8rem] text-text-muted dark:text-[#94A3B8]">
                  {retryWaitSeconds > 0
                    ? `AI đang giới hạn tốc độ; chờ khoảng ${retryWaitSeconds} giây rồi thử lại.`
                    : "AI đổi số liệu và máy kiểm lại đáp án, mỗi câu vài giây."}
                </p>
              </div>
              <div className="w-full max-w-[320px] h-1.5 rounded-full bg-[#EEF1F6] dark:bg-[#334155] overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${genProgress.total ? (genProgress.done / genProgress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* ─── Đang làm bài ────────────────────────────────────────────── */}
          {quizState === "active" && currentQ && (
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Thanh tiến độ */}
              <div className="flex items-center gap-3 md:gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3 text-[0.82rem] md:text-[0.9rem] font-semibold mb-2">
                    <span className="text-primary dark:text-[#E2E8F0]">Câu {currentQIdx + 1}/{questions.length}</span>
                    <span className="text-text-muted dark:text-[#94A3B8] truncate">{currentQ.topic}{currentQ.grade ? ` · Lớp ${currentQ.grade}` : ""}</span>
                  </div>
                  <div className="h-2 md:h-2.5 rounded-full bg-[#EEF1F6] dark:bg-[#334155] overflow-hidden">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B,#FBBF24)] transition-[width] duration-300" style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>
                <div className={`shrink-0 inline-flex items-center gap-1.5 h-10 md:h-11 px-3.5 md:px-4 rounded-full border font-mono text-[0.95rem] font-bold ${
                  timeLeft < 60 && timerActive ? "border-error/40 bg-error/10 text-error [animation:pulse-timer_1s_infinite_alternate]" : "border-line dark:border-[#334155] bg-white dark:bg-[#1E293B] text-primary dark:text-[#E2E8F0]"
                }`}>
                  <Timer size={16} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:items-start">
                <section className={`${CARD} lg:col-span-8 p-5 md:p-10 flex flex-col gap-5 md:gap-7 [animation:fadeIn_0.3s_ease-out]`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className={LABEL}>{isFillQuestion(currentQIdx) ? "Điền đáp án của bạn" : "Chọn một đáp án đúng"}</div>
                    {currentQ.isAiGenerated && (
                      <span className="flex items-center gap-1.5 rounded-full bg-accent-light dark:bg-accent/15 text-[#92400E] dark:text-[#FCD34D] text-[0.72rem] font-semibold px-2.5 py-1">
                        <Sparkles size={12} /> Đề do AI tạo
                      </span>
                    )}
                  </div>
                  <div className="quiz-question-text rt-inherit text-[1.1rem] md:text-[1.45rem] font-medium leading-[1.55] tracking-[-0.01em] text-primary dark:text-[#E2E8F0] break-words">
                    <RichTextRenderer text={currentQ.text} />
                  </div>

                  {isFillQuestion(currentQIdx) ? (
                    <div>
                      <input
                        key={currentQIdx}
                        type="text"
                        aria-label="Đáp án của bạn"
                        value={fillInputs[currentQIdx] || ""}
                        onChange={e => setFillInputs(prev => ({ ...prev, [currentQIdx]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter" && currentQIdx + 1 < questions.length) setCurrentQIdx(p => p + 1); }}
                        placeholder="Nhập đáp án..."
                        className="w-full h-14 px-4 text-[1.05rem] rounded-[14px] border-2 border-accent outline-none font-semibold text-primary dark:text-[#E2E8F0] bg-[#FFFBEB] dark:bg-[#0F172A] box-border"
                        autoFocus
                      />
                      <div className="text-[0.75rem] text-text-muted dark:text-[#94A3B8] mt-2">Gợi ý: nhập số, biểu thức, hoặc tên công thức ngắn gọn</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {currentQ.options.map((option) => {
                        const isSelected = userAnswers[currentQIdx] === option;
                        return (
                          <button
                            key={option.letter}
                            type="button"
                            aria-pressed={isSelected}
                            className={`flex items-center w-full min-h-[60px] py-3.5 px-4 md:px-5 rounded-[14px] text-[1rem] md:text-[1.1rem] text-left cursor-pointer transition-[border-color,box-shadow,background-color] duration-200 gap-3.5 text-primary dark:text-[#E2E8F0] ${
                              isSelected
                                ? "border-2 border-premium bg-[#FFFBEB] dark:bg-accent/10 shadow-[0_0_0_5px_rgba(245,158,11,0.14)]"
                                : "border border-line dark:border-[#334155] bg-[#FAFBFD] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569]"
                            }`}
                            onClick={() => handleSelectOption(option)}
                          >
                            <span className={`flex items-center justify-center w-7 h-7 rounded-[8px] text-[0.8rem] font-bold shrink-0 ${
                              isSelected ? "bg-premium text-primary" : "bg-[#EEF1F6] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1]"
                            }`}>{option.letter}</span>
                            <span className="quiz-question-text rt-inherit flex-1 min-w-0"><RichTextRenderer text={option.text} /></span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3 pt-1">
                    <button className={BTN_SECONDARY} onClick={handlePrevQuestion} disabled={currentQIdx === 0}>
                      <ArrowLeft size={16} />
                      <span>Câu trước</span>
                    </button>
                    {currentQIdx + 1 < questions.length ? (
                      <button className={BTN_PRIMARY} onClick={handleNextQuestion}>
                        <span>Tiếp theo</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button className={`${BTN_PRIMARY} !bg-success hover:!bg-[#059669]`} onClick={handleSubmitQuiz}>
                        <Check size={16} />
                        <span>Nộp bài</span>
                      </button>
                    )}
                  </div>
                </section>

                {/* Bảng câu hỏi */}
                <aside className={`${CARD} lg:col-span-4 p-5 md:p-6`}>
                  <div className="flex items-center justify-between">
                    <div className={LABEL}>Câu hỏi</div>
                    <span className="text-[0.78rem] font-semibold text-text-muted dark:text-[#94A3B8]">
                      Đã trả lời {questions.filter((_, i) => isFillQuestion(i) ? !!fillInputs[i]?.trim() : !!userAnswers[i]).length}/{questions.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {questions.map((q, i) => {
                      const answered = isFillQuestion(i) ? !!fillInputs[i]?.trim() : !!userAnswers[i];
                      const current = i === currentQIdx;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          aria-label={`Câu ${i + 1}${answered ? ", đã trả lời" : ""}`}
                          aria-current={current ? "step" : undefined}
                          onClick={() => setCurrentQIdx(i)}
                          className={`w-10 h-10 rounded-[10px] text-[0.82rem] font-bold cursor-pointer transition-colors ${
                            current ? "border-2 border-premium bg-[#FFFBEB] dark:bg-accent/15 text-[#B45309] dark:text-[#FCD34D]"
                              : answered ? "border-none bg-success text-white" : "border-none bg-[#EEF1F6] dark:bg-[#334155] text-text-muted dark:text-[#94A3B8]"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  {!isFillQuestion(currentQIdx) && (
                    <div className="hidden md:block mt-5 pt-4 border-t border-line dark:border-[#334155] text-[0.75rem] text-text-muted dark:text-[#94A3B8] leading-[1.7]">
                      Phím tắt: <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">1</kbd>–<kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">4</kbd> chọn đáp án, <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">←</kbd> <kbd className="bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">→</kbd> chuyển câu
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {/* ─── Kết quả ─────────────────────────────────────────────────── */}
          {quizState === "result" && (() => {
            const total = questions.length;
            const pct = total ? Math.round((score / total) * 100) : 0;
            const message = pct >= 80 ? "Tuyệt vời! Bạn nắm rất chắc." : pct >= 50 ? "Khá lắm, ôn thêm vài chỗ nữa nhé." : "Chưa sao, xem lại lời giải rồi thử lần nữa nhé.";
            const ringColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";
            const wrongCount = questions.filter((q, idx) => (isFillQuestion(idx) ? !isFillCorrect(q, fillInputs[idx]) : !userAnswers[idx]?.isCorrect)).length;
            return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:items-start">
              <Confetti active={showConfetti} />
              <section className={`${CARD} relative lg:col-span-5 mt-[70px] lg:mt-[90px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] p-5 md:p-8 flex flex-col items-center text-center gap-3 lg:sticky lg:top-6`}>
                {/* Mimi phản ứng theo điểm khi vào màn kết quả: cao → mắt ngôi sao, khá → cười, thấp → ngạc nhiên (lời nhắn ở dưới). */}
                <MimiMascot width={170} className="absolute left-1/2 -translate-x-1/2 -top-[96px]" reaction={{ expr: pct >= 80 ? "star" : pct >= 50 ? "happy" : "surprised", at: "quiz-result" }} />
                <div className={`${LABEL} mt-6`}>Kết quả</div>
                <svg width="168" height="168" viewBox="0 0 100 100" role="img" aria-label={`Đúng ${score} trên ${total} câu, ${pct}%`}>
                  <circle cx="50" cy="50" r="42" fill="none" className="stroke-[#EEF1F6] dark:stroke-[#334155]" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 264} 264`} transform="rotate(-90 50 50)" />
                  <text x="50" y="55" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="800" fontSize="24" className="fill-primary dark:fill-[#E2E8F0]">{score}/{total}</text>
                  <text x="50" y="69" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="600" fontSize="7" fill="#64748B">{pct}% chính xác</text>
                </svg>
                <div className="text-[1.15rem] md:text-[1.4rem] font-bold tracking-[-0.02em] text-primary dark:text-[#E2E8F0]">{message}</div>
                <p className="m-0 text-[0.8rem] text-text-muted dark:text-[#94A3B8]">
                  Lượt test miễn phí hôm nay: <strong>{isPremium ? "Không giới hạn" : `${remainingQuizzes} lượt`}</strong>
                </p>
                {isGuest && (
                  <p className="m-0 text-[0.8rem] text-text-muted dark:text-[#94A3B8] flex items-center justify-center gap-1 flex-wrap">
                    <Lock size={12} className="text-accent" />
                    <span>Chế độ khách không lưu kết quả.</span>
                    <button type="button" onClick={handleGuestLogin} className="bg-transparent border-none p-0 text-accent font-semibold underline cursor-pointer text-[0.8rem]">
                      Đăng nhập Google để lưu tiến độ
                    </button>
                  </p>
                )}

                {isGuest && remainingQuizzes <= 0 && (
                  <div className="w-full mt-1 rounded-[14px] bg-primary dark:bg-[#1E293B] dark:border dark:border-[#334155] text-white p-4 text-left flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[0.8rem] font-bold"><Lock size={13} /> Hết lượt quiz của chế độ khách</div>
                    <p className="m-0 text-[0.78rem] text-white/80">Đăng nhập Google để luyện tiếp hôm nay và lưu lại kết quả.</p>
                    <button type="button" className="self-start inline-flex items-center gap-1.5 rounded-[10px] bg-[#FBBF24] hover:bg-premium text-primary font-semibold text-[0.8rem] px-3 py-2 border-none cursor-pointer transition-colors duration-200" onClick={handleGuestLogin}>Đăng nhập Google</button>
                  </div>
                )}
                {!isGuest && !isPremium && remainingQuizzes <= 0 && (
                  <div className="w-full mt-1 rounded-[14px] bg-primary dark:bg-[#1E293B] dark:border dark:border-[#334155] text-white p-4 text-left flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[0.8rem] font-bold"><Crown size={13} className="text-[#FBBF24]" /> Hết lượt test miễn phí</div>
                    <p className="m-0 text-[0.78rem] text-white/80">Nâng cấp Premium để làm bài trắc nghiệm không giới hạn!</p>
                    <button type="button" className="self-start inline-flex items-center gap-1.5 rounded-[10px] bg-[#FBBF24] hover:bg-premium text-primary font-semibold text-[0.8rem] px-3 py-2 border-none cursor-pointer transition-colors duration-200" onClick={() => setActiveTab("premium")}>Nâng cấp Premium</button>
                  </div>
                )}

                <div className="w-full flex flex-col sm:flex-row gap-2.5 mt-2">
                  <button className={`${BTN_PRIMARY} flex-1`} onClick={() => setQuizState("setup")}>Làm bài mới</button>
                  <button className={`${BTN_SECONDARY} flex-1`} onClick={() => setActiveTab("dashboard")}>Về Dashboard</button>
                </div>
              </section>

              <section className="lg:col-span-7 lg:mt-[90px] flex flex-col gap-3 md:gap-4">
                <div className="flex justify-between items-baseline gap-3">
                  <h2 className="m-0 text-[1.1rem] md:text-[1.35rem] font-bold tracking-[-0.01em] text-primary dark:text-[#E2E8F0]">Xem lại bài làm</h2>
                  <span className="text-[0.8rem] text-text-muted dark:text-[#94A3B8]">{wrongCount ? `${wrongCount} câu cần xem lại` : "Đúng hết, giỏi lắm!"}</span>
                </div>
                {questions.map((q, idx) => {
                  const isFillQ = isFillQuestion(idx);
                  const correctOpt = q.options.find(o => o.isCorrect);
                  const header = (statusLabel, statusClass, extra) => (
                    <div className="flex justify-between items-center gap-2 text-[0.75rem] font-semibold">
                      <span className="text-text-muted dark:text-[#94A3B8]">
                        Câu {idx + 1} · {q.topic}{q.grade ? ` · Lớp ${q.grade}` : ""}
                        {extra}
                        {q.isAiGenerated && <span className="bg-accent-light dark:bg-accent/15 text-[#92400E] dark:text-[#FCD34D] rounded-full ml-1.5 py-0.5 px-2">Đề do AI tạo</span>}
                      </span>
                      <span className={`shrink-0 py-1 px-2.5 rounded-full ${statusClass}`}>{statusLabel}</span>
                    </div>
                  );
                  const explanation = (
                    <div className="formula-explanation-prose rounded-[12px] bg-page dark:bg-[#0F172A] border border-line dark:border-[#334155] p-3.5 text-[0.82rem] text-[#475569] dark:text-[#94A3B8] leading-[1.6]">
                      <strong className="block text-primary dark:text-[#E2E8F0] mb-1 text-[0.8rem] font-bold">Lời giải chi tiết</strong>
                      <RichTextRenderer text={q.explanation} />
                    </div>
                  );

                  if (isFillQ) {
                    const userInput = fillInputs[idx] || "";
                    const isCorrect = isFillCorrect(q, userInput);
                    const statusLabel = !userInput.trim() ? "Chưa trả lời" : isCorrect ? "Đúng" : "Sai";
                    const statusClass = !userInput.trim() ? "text-text-muted dark:text-[#94A3B8] bg-[#EEF1F6] dark:bg-[#334155]" : isCorrect ? "text-[#047857] dark:text-[#6EE7B7] bg-success/10" : "text-[#B91C1C] dark:text-[#FCA5A5] bg-error/10";
                    return (
                      <div key={q.id} className={`${CARD} p-4 md:p-6 flex flex-col gap-3`}>
                        {header(statusLabel, statusClass, <span className="bg-[#EEF1F6] dark:bg-[#334155] rounded-full ml-1.5 py-0.5 px-2">Điền đáp án</span>)}
                        <div className="quiz-question-text rt-inherit text-[0.95rem] font-semibold text-primary dark:text-[#E2E8F0]"><RichTextRenderer text={q.text} /></div>
                        <div className="flex flex-col gap-1.5 rounded-[12px] border border-line dark:border-[#334155] p-3">
                          <div className="text-[0.85rem]">
                            <span className="text-text-muted dark:text-[#94A3B8]">Bạn trả lời: </span>
                            <span className={`font-semibold ${isCorrect ? "text-[#047857] dark:text-[#6EE7B7]" : "text-[#B91C1C] dark:text-[#FCA5A5]"}`}>{userInput || "(bỏ qua)"}</span>
                          </div>
                          <div className="text-[0.85rem] flex flex-wrap items-baseline gap-x-1">
                            <span className="text-text-muted dark:text-[#94A3B8]">Đáp án đúng: </span>
                            <span className="quiz-question-text rt-inherit font-semibold text-[#047857] dark:text-[#6EE7B7] min-w-0 overflow-x-auto"><RichTextRenderer text={correctOpt?.text || ""} /></span>
                          </div>
                          <div className="text-[0.8rem]">
                            <span className="text-text-muted dark:text-[#94A3B8]">Cách gõ: </span>
                            <code className="font-mono font-semibold text-primary dark:text-[#E2E8F0] bg-[#EEF1F6] dark:bg-[#334155] rounded px-1.5 py-px break-all">{q.blankAnswer}</code>
                          </div>
                        </div>
                        {explanation}
                      </div>
                    );
                  }

                  const selected = userAnswers[idx];
                  const isCorrect = selected && selected.isCorrect;
                  const statusLabel = !selected ? "Chưa trả lời" : isCorrect ? "Đúng" : `Sai (chọn ${selected.letter})`;
                  const statusClass = !selected ? "text-text-muted dark:text-[#94A3B8] bg-[#EEF1F6] dark:bg-[#334155]" : isCorrect ? "text-[#047857] dark:text-[#6EE7B7] bg-success/10" : "text-[#B91C1C] dark:text-[#FCA5A5] bg-error/10";

                  return (
                    <div key={q.id} className={`${CARD} p-4 md:p-6 flex flex-col gap-3`}>
                      {header(statusLabel, statusClass, null)}
                      <div className="quiz-question-text rt-inherit text-[0.95rem] font-semibold text-primary dark:text-[#E2E8F0]"><RichTextRenderer text={q.text} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((option) => {
                          const isOptSelected = selected === option;
                          const isOptCorrect = option.isCorrect;
                          let optClass = "border border-line dark:border-[#334155] bg-[#FAFBFD] dark:bg-[#0F172A]";
                          let badgeClass = "bg-[#EEF1F6] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1]";
                          let optBadge = null;
                          if (isOptCorrect) {
                            optClass = "border-[1.5px] border-success bg-success/[0.05] dark:bg-success/10";
                            badgeClass = "bg-success text-white";
                            if (isOptSelected) optBadge = <CheckCircle size={15} className="text-success shrink-0" />;
                          } else if (isOptSelected) {
                            optClass = "border-[1.5px] border-error bg-error/[0.05] dark:bg-error/10";
                            badgeClass = "bg-error text-white";
                            optBadge = <XCircle size={15} className="text-error shrink-0" />;
                          }
                          return (
                            <div key={option.letter} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-[12px] text-[0.88rem] ${optClass}`}>
                              <span className={`w-6 h-6 rounded-[7px] flex items-center justify-center text-[0.72rem] font-bold shrink-0 ${badgeClass}`}>{option.letter}</span>
                              <span className="quiz-question-text rt-inherit flex-1 min-w-0 text-primary dark:text-[#E2E8F0]"><RichTextRenderer text={option.text} /></span>
                              {optBadge}
                            </div>
                          );
                        })}
                      </div>
                      {explanation}

                      {/* Đề AI tạo: công thức lấy từ thư viện (formulas.js theo id, không lấy chữ của AI),
                          đề gốc đã hỏi, và nút báo đề sai. */}
                      {q.isAiGenerated && (
                        <div className="flex flex-col gap-2">
                          {q.formulaIds.map((id) => formulasById.get(id)).filter(Boolean).map((f) => (
                            <div key={f.id} className="rounded-[12px] border border-line dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5">
                              <div className="text-[0.72rem] font-semibold text-text-muted dark:text-[#94A3B8]">Công thức trong thư viện: {f.name}</div>
                              <div className="overflow-x-auto text-primary dark:text-[#E2E8F0]"><MathElement math={f.latex} block={true} /></div>
                            </div>
                          ))}
                          {q.sourceText && (
                            <div className="text-[0.78rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">
                              <span className="font-semibold">Luyện từ bài đã hỏi: </span>
                              <span className="quiz-question-text"><RichTextRenderer text={q.sourceText.length > 160 ? `${q.sourceText.slice(0, 160)}…` : q.sourceText} /></span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => reportVariant(q)}
                            disabled={reportedIds.has(q.id)}
                            className="self-end inline-flex items-center gap-1.5 min-h-[36px] rounded-[10px] border border-line dark:border-[#475569] bg-white dark:bg-[#1E293B] px-3 text-[0.78rem] font-semibold text-text-muted dark:text-[#CBD5E1] cursor-pointer hover:border-error hover:text-error disabled:cursor-default disabled:opacity-60 disabled:hover:border-line disabled:hover:text-text-muted"
                          >
                            <Flag size={13} /> {reportedIds.has(q.id) ? "Đã báo" : "Báo đề sai"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            </div>
            );
          })()}
        </PageShell>
  );
}
