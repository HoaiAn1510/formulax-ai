import React, { useState, useEffect } from "react";
import { GraduationCap, Timer, CheckCircle, XCircle, Award, Crown, Lock, ArrowLeft, ArrowRight, Play, BookOpen, Layers, Check, Clipboard, BarChart2, List, Pencil, Shuffle } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { questionsPool as pool } from "../data/questions";
import { saveQuizResult } from "../lib/supabase";
import Confetti from "../components/Confetti";

export default function QuizView({
  setActiveTab,
  isPremium,
  remainingQuizzes,
  setRemainingQuizzes,
  stats,
  setStats,
  user,
}) {
  const [quizState, setQuizState] = useState("setup"); // setup, active, result
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  // Topic: allMode=true → tất cả chủ đề (other buttons disabled); allMode=false → chọn nhiều chủ đề
  const [allMode, setAllMode] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
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
  const [failedQuestions, setFailedQuestions] = useState([]);
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
    return list;
  };

  // Cap questionCountInput when available pool shrinks
  useEffect(() => {
    const max = getFilteredQuestions().length;
    const cur = parseInt(questionCountInput) || 1;
    if (cur > max) setQuestionCountInput(String(max));
  }, [allMode, selectedTopics, allGradeMode, selectedGrades]);

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
    if (!isPremium && remainingQuizzes <= 0) {
      setShowQuotaModal(true);
      return;
    }

    const available = getFilteredQuestions();
    const count = Math.max(1, Math.min(parseInt(questionCountInput) || 10, available.length));
    const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, count);

    const letters = ["A", "B", "C", "D"];
    const questionsWithShuffledOptions = shuffled.map(q => {
      const opts = [...q.options].sort(() => 0.5 - Math.random())
        .map((opt, i) => ({ ...opt, letter: letters[i] }));
      return { ...q, options: opts };
    });

    setQuestions(questionsWithShuffledOptions);
    setCurrentQIdx(0);
    setUserAnswers({});
    setFillInputs({});
    setScore(0);
    setFailedQuestions([]);

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

  // True if question at idx should be fill-in style
  const isFillQuestion = (idx) =>
    quizType === "fill-in" || (quizType === "hybrid" && idx % 2 === 1);

  // Normalize strings for fill-in comparison
  const normalizeAnswer = (s) =>
    (s || "").trim().toLowerCase().replace(/\s+/g, "").replace(/π/g, "pi").replace(/√/g, "sqrt");

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
    const failedList = [];

    questions.forEach((q, idx) => {
      const correctOpt = q.options.find(o => o.isCorrect);
      if (isFillQuestion(idx)) {
        const userInput = fillInputs[idx] || "";
        const isCorrect = userInput.trim() !== "" &&
          normalizeAnswer(userInput) === normalizeAnswer(correctOpt?.text || "");
        if (isCorrect) {
          finalScore += 1;
        } else {
          failedList.push({
            questionText: q.text,
            userAnswer: userInput || "Bỏ qua",
            userAnswerText: userInput || "Chưa trả lời",
            correctAnswer: correctOpt?.letter || "",
            correctAnswerText: correctOpt?.text || "",
            explanation: q.explanation,
            wasSkipped: !userInput.trim(),
            isFillIn: true,
          });
        }
      } else {
        const selected = userAnswers[idx];
        if (selected && selected.isCorrect) {
          finalScore += 1;
        } else {
          failedList.push({
            questionText: q.text,
            userAnswer: selected ? selected.letter : "Bỏ qua",
            userAnswerText: selected ? selected.text : "Chưa trả lời",
            correctAnswer: correctOpt?.letter || "",
            correctAnswerText: correctOpt?.text || "",
            explanation: q.explanation,
            wasSkipped: !selected,
            isFillIn: false,
          });
        }
      }
    });

    setScore(finalScore);
    setFailedQuestions(failedList);
    setQuizState("result");

    if (!isPremium) {
      setRemainingQuizzes(prev => Math.max(0, prev - 1));
    }

    setStats(prev => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1
    }));

    if (user?.googleId) {
      const topicName = (allMode || selectedTopics.length === 0 || selectedTopics.length > 1)
        ? "Tổng hợp"
        : selectedTopics[0];
      saveQuizResult(user.googleId, {
        topic: topicName,
        questionsTotal: questions.length,
        questionsCorrect: finalScore,
      }).catch(console.error);
    }
  };

  const handleSubmitQuiz = () => {
    const unansweredCount = questions.filter((_, idx) =>
      isFillQuestion(idx) ? !fillInputs[idx]?.trim() : !userAnswers[idx]
    ).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(`Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?`);
      if (!confirmSubmit) return;
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
    <div className="view-container">
      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1]">

          {/* Modal hết quota */}
          {showQuotaModal && (
            <div className="fixed inset-0 z-[9999] bg-[rgba(15,23,42,0.6)] backdrop-blur-[4px] flex items-center justify-center p-4">
              <div className="bg-white rounded-[20px] w-full max-w-[380px] py-7 px-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] text-center">
                {/* Icon */}
                <div className="w-[52px] h-[52px] rounded-full bg-premium/10 flex items-center justify-center mx-auto mb-4">
                  <Crown size={24} color="#F59E0B" />
                </div>

                <h2 className="text-[1.15rem] font-extrabold text-[#1E3A5F] mb-2">
                  Hết lượt quiz hôm nay!
                </h2>
                <p className="text-[0.83rem] text-text-muted leading-[1.55] mb-5">
                  Bạn đã dùng hết <strong>10/10 lượt quiz miễn phí</strong> ngày hôm nay.
                  Lượt sẽ được reset vào ngày mai — hoặc nâng cấp <strong>Premium</strong> để luyện không giới hạn!
                </p>

                {/* Highlight */}
                <div className="bg-[linear-gradient(135deg,#FFFBEB,#FEF3C7)] border border-premium/25 rounded-xl py-3 px-4 mb-5 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[0.7rem] text-[#92400E] font-bold mb-0.5">Premium</div>
                    <div className="text-[0.82rem] font-extrabold text-[#1E3A5F]">Quiz không giới hạn mỗi ngày</div>
                  </div>
                  <div className="text-[0.9rem] font-extrabold text-premium">49.000đ/tháng</div>
                </div>

                {/* Buttons */}
                <button
                  onClick={() => { setShowQuotaModal(false); setActiveTab("premium"); }}
                  className="w-full py-3 rounded-xl border-none bg-[linear-gradient(135deg,#F59E0B,#EF4444)] text-white font-extrabold text-[0.9rem] cursor-pointer mb-2.5 flex items-center justify-center gap-2"
                >
                  <Crown size={16} /> Nâng cấp Premium ngay
                </button>
                <button
                  onClick={() => setShowQuotaModal(false)}
                  className="w-full py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-text-muted font-semibold text-[0.85rem] cursor-pointer"
                >
                  Để ngày mai quay lại
                </button>
              </div>
            </div>
          )}

          {/* Setup View matching Figma Screenshot 5 */}
          {quizState === "setup" && (
            <div>
              {/* Breadcrumb Back */}
              <button
                className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.85rem] font-semibold cursor-pointer flex items-center gap-1.5 mb-5"
                onClick={() => setActiveTab("dashboard")}
              >
                <ArrowLeft size={14} />
                <span>Về trang chủ</span>
              </button>

              {/* Centered Document Icon & Header */}
              <div className="flex flex-col items-center gap-2.5 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/8 text-accent flex items-center justify-center">
                  <Clipboard size={22} />
                </div>
                <h2 className="text-[1.45rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0 tracking-[-0.5px]">
                  Làm bài kiểm tra
                </h2>
                <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] font-medium m-0">
                  Tùy chỉnh bài kiểm tra theo ý muốn
                </p>
              </div>

              {/* Figma Setup Card Container */}
              <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-6 flex flex-col gap-6 mb-4">

                {/* Section 1: Chọn chủ đề */}
                <div>
                  <div className="flex items-center gap-2 text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-3">
                    <BookOpen size={15} className="text-accent" />
                    <span>Chọn chủ đề</span>
                    {!allMode && selectedTopics.length > 0 && (
                      <span className="text-[0.7rem] font-semibold text-accent bg-accent/8 rounded-[10px] py-0.5 px-2">
                        {selectedTopics.length} đã chọn
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Tất cả chủ đề */}
                    <button
                      onClick={() => handleTopicClick("Tất cả chủ đề")}
                      className={`py-2 px-4 rounded-[20px] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border-[1.5px] ${
                        allMode ? "border-[#1E3A5F] bg-[#1E3A5F] text-white" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]"
                      }`}
                    >
                      Tất cả chủ đề
                    </button>
                    {/* Specific topics — disabled khi allMode */}
                    {specificTopics.map(t => {
                      const isActive = !allMode && selectedTopics.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => handleTopicClick(t)}
                          className={`py-2 px-4 rounded-[20px] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border-[1.5px] ${
                            isActive ? "border-accent bg-accent text-white" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {!allMode && selectedTopics.length === 0 && (
                    <p className="text-[0.72rem] text-premium mt-1.5 font-semibold">
                      Chưa chọn chủ đề nào — sẽ lấy tất cả câu hỏi
                    </p>
                  )}
                </div>

                {/* Section 1b: Chọn lớp */}
                <div>
                  <div className="flex items-center gap-2 text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-3">
                    <GraduationCap size={15} className="text-accent" />
                    <span>Chọn lớp</span>
                    {!allGradeMode && selectedGrades.length > 0 && (
                      <span className="text-[0.7rem] font-semibold text-accent bg-accent/8 rounded-[10px] py-0.5 px-2">
                        {selectedGrades.length} đã chọn
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGradeClick("Tất cả các lớp")}
                      className={`py-2 px-4 rounded-[20px] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border-[1.5px] ${
                        allGradeMode ? "border-[#1E3A5F] bg-[#1E3A5F] text-white" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]"
                      }`}
                    >
                      Tất cả các lớp
                    </button>
                    {[10, 11, 12].map(g => {
                      const isActive = !allGradeMode && selectedGrades.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => handleGradeClick(g)}
                          className={`py-2 px-4 rounded-[20px] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border-[1.5px] ${
                            isActive ? "border-accent bg-accent text-white" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]"
                          }`}
                        >
                          Lớp {g}
                        </button>
                      );
                    })}
                  </div>
                  {!allGradeMode && selectedGrades.length === 0 && (
                    <p className="text-[0.72rem] text-premium mt-1.5 font-semibold">
                      Chưa chọn lớp nào — sẽ lấy tất cả các lớp
                    </p>
                  )}
                </div>

                {/* Section 2: Số câu hỏi */}
                <div>
                  <div className="flex items-center gap-2 text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-3">
                    <BarChart2 size={15} className="text-accent" />
                    <span>Số câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-3">
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
                      className="w-[90px] h-[42px] text-center text-[1.05rem] font-extrabold text-[#1E3A5F] border-[1.5px] border-accent rounded-[10px] outline-none bg-[#F8FAFF]"
                    />
                    <span className="text-[0.82rem] text-text-muted font-semibold">
                      câu <span className="text-[#94A3B8]">(tối đa {maxQuestions} câu)</span>
                    </span>
                  </div>
                </div>

                {/* Section 3: Loại câu hỏi */}
                <div>
                  <div className="flex items-center gap-2 text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-3">
                    <Layers size={15} className="text-accent" />
                    <span>Loại câu hỏi</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Option 1: Trắc nghiệm */}
                    <div
                      className={`bg-white dark:bg-[#1E293B] border rounded-xl py-4 px-2 text-center cursor-pointer text-[0.85rem] font-bold transition duration-200 flex flex-col items-center justify-center gap-1.5 ${
                        quizType === "multiple-choice" ? "border-accent bg-accent/5 text-accent" : "border-[rgba(30,58,95,0.07)] dark:border-[#334155] text-primary dark:text-[#E2E8F0] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                      }`}
                      onClick={() => setQuizType("multiple-choice")}
                    >
                      <List size={18} />
                      <span>Trắc nghiệm</span>
                    </div>

                    {/* Option 2: Điền đáp án */}
                    <div
                      className={`bg-white dark:bg-[#1E293B] border rounded-xl py-4 px-2 text-center cursor-pointer text-[0.85rem] font-bold transition duration-200 flex flex-col items-center justify-center gap-1.5 ${
                        quizType === "fill-in" ? "border-accent bg-accent/5 text-accent" : "border-[rgba(30,58,95,0.07)] dark:border-[#334155] text-primary dark:text-[#E2E8F0] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                      }`}
                      onClick={() => {
                        if (!isPremium) {
                          alert("Phương thức Điền đáp án yêu cầu gói Premium!");
                          setActiveTab("premium");
                        } else {
                          setQuizType("fill-in");
                        }
                      }}
                    >
                      <Pencil size={18} />
                      <div className="flex items-center gap-0.5">
                        <span>Điền đáp án</span>
                        {!isPremium && <Lock size={10} className="text-premium" />}
                      </div>
                    </div>

                    {/* Option 3: Kết hợp */}
                    <div
                      className={`bg-white dark:bg-[#1E293B] border rounded-xl py-4 px-2 text-center cursor-pointer text-[0.85rem] font-bold transition duration-200 flex flex-col items-center justify-center gap-1.5 ${
                        quizType === "hybrid" ? "border-accent bg-accent/5 text-accent" : "border-[rgba(30,58,95,0.07)] dark:border-[#334155] text-primary dark:text-[#E2E8F0] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                      }`}
                      onClick={() => {
                        if (!isPremium) {
                          alert("Phương thức Kết hợp yêu cầu gói Premium!");
                          setActiveTab("premium");
                        } else {
                          setQuizType("hybrid");
                        }
                      }}
                    >
                      <Shuffle size={18} />
                      <div className="flex items-center gap-0.5">
                        <span>Kết hợp</span>
                        {!isPremium && <Lock size={10} className="text-premium" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Giới hạn thời gian */}
                <div>
                  <div className="flex items-center gap-2 text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-3">
                    <Timer size={15} className="text-accent" />
                    <span>Giới hạn thời gian</span>
                  </div>
                  <div className="flex items-center gap-3">
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
                      className="w-[90px] h-[42px] text-center text-[1.05rem] font-extrabold text-[#1E3A5F] border-[1.5px] border-accent rounded-[10px] outline-none bg-[#F8FAFF]"
                    />
                    <span className="text-[0.82rem] text-text-muted font-semibold">
                      phút{" "}
                      <span className="text-[#94A3B8]">
                        {(parseInt(timeLimitInput) || 0) === 0 ? "(không giới hạn)" : ""}
                      </span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Footer limits */}
              <div className="text-left text-[0.8rem] text-text-muted mb-4 font-semibold pl-1 flex justify-between items-center">
                <span>
                  {isPremium ? "Premium — Không giới hạn lượt" : `Miễn phí — Còn ${remainingQuizzes}/10 lượt hôm nay`}
                </span>
                <span className="text-[#94A3B8] text-[0.72rem] text-right">
                  {allMode || selectedTopics.length === 0
                    ? "Tất cả chủ đề"
                    : selectedTopics.join(" + ")}
                  {" · "}
                  {allGradeMode || selectedGrades.length === 0
                    ? "Tất cả các lớp"
                    : selectedGrades.map(g => `Lớp ${g}`).join(" + ")}
                </span>
              </div>

              {/* Figma CTA Start button */}
              <button
                className="btn btn-primary w-full h-12 rounded-lg text-[0.95rem] font-bold flex items-center justify-center gap-2"
                onClick={startQuiz}
              >
                <Play size={14} fill="white" />
                <span>Bắt đầu làm bài</span>
              </button>
            </div>
          )}

          {/* Active Quiz View */}
          {quizState === "active" && currentQ && (
            <div>
              <div className="bg-white/95 dark:bg-[rgba(30,41,59,0.95)] border border-[rgba(30,58,95,0.07)] dark:border-[#334155] rounded-2xl py-4 px-5 shadow-[0_4px_20px_rgba(30,58,95,0.04)] mb-4 flex flex-col gap-3 backdrop-blur-[10px]">
                <div className="flex justify-between items-center text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0] mb-0.5">
                  <span>Chủ đề: {currentQ.topic} • Lớp {currentQ.grade}</span>
                  <div className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full font-mono text-[0.9rem] font-extrabold transition-all duration-300 shadow-[0_2px_8px_rgba(217,119,6,0.04)] ${
                    timeLeft < 60 && timerActive ? "bg-error/10 text-error [animation:pulse-timer_1s_infinite_alternate]" : "bg-accent/8 text-accent"
                  }`}>
                    <Timer size={14} />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden relative border border-[rgba(30,58,95,0.02)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#D97706_0%,#10B981_100%)] shadow-[0_0_8px_rgba(217,119,6,0.3)] transition-[width] duration-[0.4s] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[0.8rem] text-text-muted dark:text-[#94A3B8] font-bold">
                  <span>Câu hỏi {currentQIdx + 1} / {questions.length}</span>
                  <span>Đã trả lời: {questions.filter((_, i) => isFillQuestion(i) ? !!fillInputs[i]?.trim() : !!userAnswers[i]).length} / {questions.length}</span>
                </div>

                {!isFillQuestion(currentQIdx) && (
                  <div className="hidden md:block text-[0.72rem] text-[#94A3B8] font-semibold">
                    Phím tắt: <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">1</kbd>-<kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">4</kbd> chọn đáp án, <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">←</kbd> <kbd className="bg-[#F1F5F9] dark:bg-[#334155] rounded px-1.5 py-0.5 font-mono">→</kbd> chuyển câu
                  </div>
                )}
              </div>

              <div className="bg-white/95 dark:bg-[rgba(30,41,59,0.95)] border border-[rgba(30,58,95,0.07)] dark:border-[#334155] rounded-2xl p-6 shadow-[0_4px_20px_rgba(30,58,95,0.04)] mb-6 backdrop-blur-[10px] flex flex-col gap-6 [animation:fadeIn_0.4s_ease-out]">
                <div className="quiz-question-text text-[1.15rem] font-bold leading-[1.6] text-primary dark:text-[#E2E8F0] break-words">
                  <RichTextRenderer text={currentQ.text} />
                </div>

                {isFillQuestion(currentQIdx) ? (
                  <div className="mt-2">
                    <div className="text-[0.78rem] text-text-muted font-semibold mb-2">
                      ✏️ Điền đáp án của bạn vào ô bên dưới:
                    </div>
                    <input
                      key={currentQIdx}
                      type="text"
                      value={fillInputs[currentQIdx] || ""}
                      onChange={e => setFillInputs(prev => ({ ...prev, [currentQIdx]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && currentQIdx + 1 < questions.length) setCurrentQIdx(p => p + 1); }}
                      placeholder="Nhập đáp án..."
                      className="w-full py-3 px-3.5 text-[0.95rem] rounded-[10px] border-2 border-accent outline-none font-semibold text-[#1E3A5F] bg-[#F8FAFF] box-border"
                      autoFocus
                    />
                    <div className="text-[0.72rem] text-[#94A3B8] mt-1.5">
                      Gợi ý: nhập số, biểu thức, hoặc tên công thức ngắn gọn
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {currentQ.options.map((option) => {
                      const isSelected = userAnswers[currentQIdx] === option;
                      return (
                        <button
                          key={option.letter}
                          className={`flex items-center w-full min-h-[56px] py-3 px-4 rounded-xl text-[0.95rem] font-semibold text-left cursor-pointer transition-all duration-200 gap-3 border-[1.5px] text-primary dark:text-[#E2E8F0] ${
                            isSelected
                              ? "border-accent bg-accent/5 shadow-[0_4px_12px_rgba(217,119,6,0.1)]"
                              : "border-[rgba(30,58,95,0.07)] bg-white shadow-[0_4px_20px_rgba(30,58,95,0.04)] hover:border-accent hover:bg-accent/[0.02] hover:shadow-[0_4px_12px_rgba(217,119,6,0.08)] hover:-translate-y-px"
                          }`}
                          onClick={() => handleSelectOption(option)}
                        >
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[0.85rem] font-extrabold shrink-0 transition-all duration-200 ${
                            isSelected ? "bg-accent border-accent text-white" : "bg-[#f1f5f9] border border-[#cbd5e1] text-text-muted"
                          }`}>{option.letter}</div>
                          <div className="flex-1"><RichTextRenderer text={option.text} /></div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  className="btn btn-secondary w-[130px]"
                  onClick={handlePrevQuestion}
                  disabled={currentQIdx === 0}
                  style={{ opacity: currentQIdx === 0 ? 0.4 : 1, cursor: currentQIdx === 0 ? "not-allowed" : "pointer" }}
                >
                  <ArrowLeft size={16} />
                  <span>Câu trước</span>
                </button>

                {currentQIdx + 1 < questions.length ? (
                  <button
                    className="btn btn-primary w-[130px]"
                    onClick={handleNextQuestion}
                  >
                    <span>Tiếp theo</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-success w-[130px]"
                    onClick={handleSubmitQuiz}
                  >
                    <Check size={16} />
                    <span>Nộp bài</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz Results Screen */}
          {quizState === "result" && (
            <div className="quiz-results-container">
              <Confetti active={showConfetti} />
              <div className="summary-card !mt-0">
                <div className="summary-icon" style={{ backgroundColor: "rgba(30, 58, 95, 0.05)", color: "#1E3A5F" }}>
                  <Award size={32} />
                </div>
                <h2 className="text-[1.3rem] font-extrabold text-[#1E3A5F]">Kết quả bài kiểm tra</h2>

                <div className="summary-score" style={{ color: score >= (questions.length / 2) ? "#10B981" : "#EF4444" }}>
                  {score} / {questions.length}
                </div>

                <p className="text-[0.85rem] text-[#64748B]">
                  Bạn trả lời đúng <strong>{Math.round((score / questions.length) * 100)}%</strong> số câu hỏi.
                </p>

                <div className="w-full text-left mt-4">
                  <h4 className="text-[0.95rem] font-extrabold text-[#1E3A5F] mb-3 border-b-[1.5px] border-[#F1F5F9] pb-1.5">
                    Xem chi tiết bài làm:
                  </h4>
                  <div className="flex flex-col gap-4 w-full max-h-[420px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const isFillQ = isFillQuestion(idx);
                      const correctOpt = q.options.find(o => o.isCorrect);

                      // Fill-in review
                      if (isFillQ) {
                        const userInput = fillInputs[idx] || "";
                        const isCorrect = userInput.trim() !== "" &&
                          normalizeAnswer(userInput) === normalizeAnswer(correctOpt?.text || "");
                        const cardBorderColor = !userInput.trim() ? "rgba(30,58,95,0.07)"
                          : isCorrect ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)";
                        const cardBgColor = !userInput.trim() ? "#F8FAFC"
                          : isCorrect ? "rgba(16,185,129,0.01)" : "rgba(239,68,68,0.01)";
                        const statusLabel = !userInput.trim() ? "Chưa trả lời" : isCorrect ? "Đúng" : "Sai";
                        const statusColor = !userInput.trim() ? "#64748B" : isCorrect ? "#10B981" : "#EF4444";

                        return (
                          <div key={q.id}
                            style={{ border: `1.5px solid ${cardBorderColor}`, backgroundColor: cardBgColor, borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
                          >
                            <div className="flex justify-between items-center text-[0.75rem] font-bold">
                              <span className="text-[#64748B]">Câu {idx + 1}: {q.topic} • Lớp {q.grade} <span className="bg-accent/10 text-accent rounded ml-1" style={{ padding: "1px 5px" }}>Điền đáp án</span></span>
                              <span style={{ color: statusColor, background: `${statusColor}15`, padding: "4px 8px", borderRadius: "4px" }}>{statusLabel}</span>
                            </div>
                            <div className="text-[0.9rem] font-bold text-[#1E3A5F]">
                              <RichTextRenderer text={q.text} />
                            </div>
                            <div className="flex flex-col gap-1.5 bg-white rounded-lg p-2.5 border border-[#E2E8F0]">
                              <div className="text-[0.82rem]">
                                <span className="text-[#64748B] font-semibold">Bạn trả lời: </span>
                                <span className="font-bold" style={{ color: isCorrect ? "#10B981" : "#EF4444" }}>{userInput || "(bỏ qua)"}</span>
                              </div>
                              <div className="text-[0.82rem]">
                                <span className="text-[#64748B] font-semibold">Đáp án đúng: </span>
                                <span className="font-bold text-[#10B981]">{correctOpt?.text}</span>
                              </div>
                            </div>
                            <div className="bg-white border border-dashed border-[rgba(30,58,95,0.15)] rounded-lg p-3 text-[0.8rem] text-[#475569] leading-[1.5]">
                              <strong className="block text-[#1E3A5F] mb-1 text-[0.8rem] font-extrabold">Lời giải chi tiết:</strong>
                              <RichTextRenderer text={q.explanation} />
                            </div>
                          </div>
                        );
                      }

                      // Multiple-choice review
                      const selected = userAnswers[idx];
                      const isCorrect = selected && selected.isCorrect;

                      let cardBorderColor = "rgba(30,58,95,0.07)";
                      let cardBgColor = "#F8FAFC";
                      let statusLabel = "Chưa trả lời";
                      let statusColor = "#64748B";

                      if (selected) {
                        if (isCorrect) {
                          cardBorderColor = "rgba(16, 185, 129, 0.2)";
                          cardBgColor = "rgba(16, 185, 129, 0.01)";
                          statusLabel = "Đúng";
                          statusColor = "#10B981";
                        } else {
                          cardBorderColor = "rgba(239, 68, 68, 0.2)";
                          cardBgColor = "rgba(239, 68, 68, 0.01)";
                          statusLabel = `Sai (Chọn: ${selected.letter})`;
                          statusColor = "#EF4444";
                        }
                      }

                      return (
                        <div
                          key={q.id}
                          style={{
                            border: "1.5px solid " + cardBorderColor,
                            backgroundColor: cardBgColor,
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                          }}
                        >
                          {/* Review Card Header */}
                          <div className="flex justify-between items-center text-[0.75rem] font-bold">
                            <span className="text-[#64748B]">Câu {idx + 1}: {q.topic} • Lớp {q.grade}</span>
                            <span style={{
                              color: statusColor,
                              backgroundColor: selected ? (isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)") : "rgba(100, 116, 139, 0.08)",
                              padding: "4px 8px",
                              borderRadius: "4px"
                            }}>
                              {statusLabel}
                            </span>
                          </div>

                          {/* Question Text */}
                          <div className="text-[0.9rem] font-bold text-[#1E3A5F]">
                            <RichTextRenderer text={q.text} />
                          </div>

                          {/* Options Review List */}
                          <div className="flex flex-col gap-2">
                            {q.options.map((option) => {
                              const isOptSelected = selected === option;
                              const isOptCorrect = option.isCorrect;

                              let optBorder = "1px solid #E2E8F0";
                              let optBg = "white";
                              let optBadge = null;

                              if (isOptCorrect) {
                                optBorder = "1.5px solid #10B981";
                                optBg = "rgba(16, 185, 129, 0.04)";
                                if (isOptSelected) {
                                  optBadge = <CheckCircle size={14} fill="#10B981" color="white" />;
                                }
                              } else if (isOptSelected) {
                                optBorder = "1.5px solid #EF4444";
                                optBg = "rgba(239, 68, 68, 0.04)";
                                optBadge = <XCircle size={14} fill="#EF4444" color="white" />;
                              }

                              return (
                                <div
                                  key={option.letter}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: optBorder,
                                    backgroundColor: optBg,
                                    fontSize: "0.85rem",
                                    fontWeight: "600"
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "22px",
                                      height: "22px",
                                      borderRadius: "50%",
                                      backgroundColor: isOptCorrect ? "#10B981" : (isOptSelected ? "#EF4444" : "#F1F5F9"),
                                      color: isOptCorrect || isOptSelected ? "white" : "#64748B",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.75rem",
                                      fontWeight: "800"
                                    }}
                                  >
                                    {option.letter}
                                  </div>
                                  <div style={{ flex: 1 }}><RichTextRenderer text={option.text} /></div>
                                  {optBadge}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Box */}
                          <div className="bg-white border border-dashed border-[rgba(30,58,95,0.15)] rounded-lg p-3 text-[0.8rem] text-[#475569] leading-[1.5]">
                            <strong className="block text-[#1E3A5F] mb-1 text-[0.8rem] font-extrabold">
                              Lời giải chi tiết:
                            </strong>
                            <RichTextRenderer text={q.explanation} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#f1f5f9] w-full pt-4 mt-4">
                  <p className="text-xs text-[#64748B] flex items-center justify-center gap-1">
                    Lượt test miễn phí hôm nay: <strong>{isPremium ? "Không giới hạn" : `${remainingQuizzes} lượt`}</strong>
                  </p>
                </div>

                <div className="summary-actions w-full">
                  {!isPremium && remainingQuizzes <= 0 && (
                    <div className="premium-banner text-left mb-2">
                      <div className="banner-badge">
                        <Crown size={12} fill="white" />
                        <span>Hết lượt test miễn phí</span>
                      </div>
                      <p className="text-xs text-white">
                        Nâng cấp Premium ngay để tiếp tục làm bài trắc nghiệm không giới hạn!
                      </p>
                      <button className="btn btn-premium vibrate" onClick={() => setActiveTab("premium")}>
                        Nâng cấp Pro ngay
                      </button>
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={() => setQuizState("setup")}>
                    Làm bài trắc nghiệm mới
                  </button>

                  <button className="btn btn-secondary" onClick={() => setActiveTab("dashboard")}>
                    Quay lại Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
