import React, { useState, useEffect } from "react";
import { GraduationCap, Timer, CheckCircle, XCircle, Award, Crown, Lock, ArrowLeft, ArrowRight, Play, BookOpen, Layers, Check, Clipboard, BarChart2, List, Pencil, Shuffle } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { questionsPool as pool } from "../data/questions";
import { saveQuizResult } from "../lib/supabase";

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

      {/* Modal hết quota */}
      {showQuotaModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: "white", borderRadius: "20px", width: "100%", maxWidth: "380px",
            padding: "28px 24px", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", textAlign: "center",
          }}>
            {/* Icon */}
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Crown size={24} color="#F59E0B" />
            </div>

            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "8px" }}>
              Hết lượt quiz hôm nay!
            </h2>
            <p style={{ fontSize: "0.83rem", color: "#64748B", lineHeight: "1.55", marginBottom: "20px" }}>
              Bạn đã dùng hết <strong>10/10 lượt quiz miễn phí</strong> ngày hôm nay.
              Lượt sẽ được reset vào ngày mai — hoặc nâng cấp <strong>Premium</strong> để luyện không giới hạn!
            </p>

            {/* Highlight */}
            <div style={{
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: "700", marginBottom: "2px" }}>Premium</div>
                <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1E3A5F" }}>Quiz không giới hạn mỗi ngày</div>
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#F59E0B" }}>49.000đ/tháng</div>
            </div>

            {/* Buttons */}
            <button
              onClick={() => { setShowQuotaModal(false); setActiveTab("premium"); }}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                color: "white", fontWeight: "800", fontSize: "0.9rem", cursor: "pointer",
                marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <Crown size={16} /> Nâng cấp Premium ngay
            </button>
            <button
              onClick={() => setShowQuotaModal(false)}
              style={{
                width: "100%", padding: "10px", borderRadius: "12px", border: "1px solid #E2E8F0",
                background: "white", color: "#64748B", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer",
              }}
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
            className="breadcrumb-back" 
            onClick={() => setActiveTab("dashboard")}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#64748B", 
              fontSize: "0.85rem", 
              fontWeight: "600", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              marginBottom: "20px"
            }}
          >
            <ArrowLeft size={14} />
            <span>Về trang chủ</span>
          </button>

          {/* Centered Document Icon & Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div 
              style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "50%", 
                backgroundColor: "rgba(59, 130, 246, 0.08)", 
                color: "#3B82F6", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}
            >
              <Clipboard size={22} />
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#1E3A5F", margin: 0, letterSpacing: "-0.5px" }}>
              Làm bài kiểm tra
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500", margin: 0 }}>
              Tùy chỉnh bài kiểm tra theo ý muốn
            </p>
          </div>

          {/* Figma Setup Card Container */}
          <div className="quiz-setup-card-figma" style={{
            backgroundColor: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(30, 58, 95, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "16px"
          }}>
            
            {/* Section 1: Chọn chủ đề */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <BookOpen size={15} style={{ color: "#3B82F6" }} />
                <span>Chọn chủ đề</span>
                {!allMode && selectedTopics.length > 0 && (
                  <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#3B82F6", background: "rgba(59,130,246,0.08)", borderRadius: "10px", padding: "2px 8px" }}>
                    {selectedTopics.length} đã chọn
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {/* Tất cả chủ đề */}
                <button
                  onClick={() => handleTopicClick("Tất cả chủ đề")}
                  style={{
                    padding: "8px 16px", borderRadius: "20px",
                    border: `1.5px solid ${allMode ? "#1E3A5F" : "#E2E8F0"}`,
                    backgroundColor: allMode ? "#1E3A5F" : "#F8FAFC",
                    color: allMode ? "white" : "#475569",
                    fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                  }}
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
                      style={{
                        padding: "8px 16px", borderRadius: "20px",
                        border: `1.5px solid ${isActive ? "#3B82F6" : "#E2E8F0"}`,
                        backgroundColor: isActive ? "#3B82F6" : "#F8FAFC",
                        color: isActive ? "white" : "#475569",
                        fontSize: "0.8rem", fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {!allMode && selectedTopics.length === 0 && (
                <p style={{ fontSize: "0.72rem", color: "#F59E0B", marginTop: "6px", fontWeight: "600" }}>
                  Chưa chọn chủ đề nào — sẽ lấy tất cả câu hỏi
                </p>
              )}
            </div>

            {/* Section 1b: Chọn lớp */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <GraduationCap size={15} style={{ color: "#3B82F6" }} />
                <span>Chọn lớp</span>
                {!allGradeMode && selectedGrades.length > 0 && (
                  <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#3B82F6", background: "rgba(59,130,246,0.08)", borderRadius: "10px", padding: "2px 8px" }}>
                    {selectedGrades.length} đã chọn
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button
                  onClick={() => handleGradeClick("Tất cả các lớp")}
                  style={{
                    padding: "8px 16px", borderRadius: "20px",
                    border: `1.5px solid ${allGradeMode ? "#1E3A5F" : "#E2E8F0"}`,
                    backgroundColor: allGradeMode ? "#1E3A5F" : "#F8FAFC",
                    color: allGradeMode ? "white" : "#475569",
                    fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  Tất cả các lớp
                </button>
                {[10, 11, 12].map(g => {
                  const isActive = !allGradeMode && selectedGrades.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleGradeClick(g)}
                      style={{
                        padding: "8px 16px", borderRadius: "20px",
                        border: `1.5px solid ${isActive ? "#3B82F6" : "#E2E8F0"}`,
                        backgroundColor: isActive ? "#3B82F6" : "#F8FAFC",
                        color: isActive ? "white" : "#475569",
                        fontSize: "0.8rem", fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      Lớp {g}
                    </button>
                  );
                })}
              </div>
              {!allGradeMode && selectedGrades.length === 0 && (
                <p style={{ fontSize: "0.72rem", color: "#F59E0B", marginTop: "6px", fontWeight: "600" }}>
                  Chưa chọn lớp nào — sẽ lấy tất cả các lớp
                </p>
              )}
            </div>

            {/* Section 2: Số câu hỏi */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <BarChart2 size={15} style={{ color: "#3B82F6" }} />
                <span>Số câu hỏi</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                  style={{
                    width: "90px", height: "42px", textAlign: "center",
                    fontSize: "1.05rem", fontWeight: "800", color: "#1E3A5F",
                    border: "1.5px solid #3B82F6", borderRadius: "10px",
                    outline: "none", background: "#F8FAFF",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>
                  câu <span style={{ color: "#94A3B8" }}>(tối đa {maxQuestions} câu)</span>
                </span>
              </div>
            </div>

            {/* Section 3: Loại câu hỏi */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <Layers size={15} style={{ color: "#3B82F6" }} />
                <span>Loại câu hỏi</span>
              </div>
              <div className="type-cards-row">
                {/* Option 1: Trắc nghiệm */}
                <div 
                  className={`type-select-card ${quizType === "multiple-choice" ? "active" : ""}`}
                  onClick={() => setQuizType("multiple-choice")}
                >
                  <List size={18} />
                  <span>Trắc nghiệm</span>
                </div>
                
                {/* Option 2: Điền đáp án */}
                <div 
                  className={`type-select-card ${quizType === "fill-in" ? "active" : ""}`}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <span>Điền đáp án</span>
                    {!isPremium && <Lock size={10} style={{ color: "#F59E0B" }} />}
                  </div>
                </div>

                {/* Option 3: Kết hợp */}
                <div 
                  className={`type-select-card ${quizType === "hybrid" ? "active" : ""}`}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <span>Kết hợp</span>
                    {!isPremium && <Lock size={10} style={{ color: "#F59E0B" }} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Giới hạn thời gian */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <Timer size={15} style={{ color: "#3B82F6" }} />
                <span>Giới hạn thời gian</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                  style={{
                    width: "90px", height: "42px", textAlign: "center",
                    fontSize: "1.05rem", fontWeight: "800", color: "#1E3A5F",
                    border: "1.5px solid #3B82F6", borderRadius: "10px",
                    outline: "none", background: "#F8FAFF",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>
                  phút{" "}
                  <span style={{ color: "#94A3B8" }}>
                    {(parseInt(timeLimitInput) || 0) === 0 ? "(không giới hạn)" : ""}
                  </span>
                </span>
              </div>
            </div>

          </div>

          {/* Footer limits */}
          <div style={{ textAlign: "left", fontSize: "0.8rem", color: "#64748B", marginBottom: "16px", fontWeight: "600", paddingLeft: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {isPremium ? "Premium — Không giới hạn lượt" : `Miễn phí — Còn ${remainingQuizzes}/10 lượt hôm nay`}
            </span>
            <span style={{ color: "#94A3B8", fontSize: "0.72rem", textAlign: "right" }}>
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
            className="btn btn-primary" 
            onClick={startQuiz}
            style={{ 
              width: "100%", 
              height: "48px", 
              borderRadius: "8px", 
              fontSize: "0.95rem", 
              fontWeight: "700",
              backgroundColor: "#3B82F6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "none",
              cursor: "pointer"
            }}
          >
            <Play size={14} fill="white" />
            <span>Bắt đầu làm bài</span>
          </button>
        </div>
      )}

      {/* Active Quiz View */}
      {quizState === "active" && currentQ && (
        <div>
          <div className="quiz-header">
            <div className="quiz-meta-row">
              <span>Chủ đề: {currentQ.topic} • Lớp {currentQ.grade}</span>
              <div className={`quiz-timer ${timeLeft < 60 && timeLimit !== "Không giới hạn" ? "warning" : ""}`}>
                <Timer size={14} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <div className="quiz-progress-track">
              <div 
                className="quiz-progress-bar" 
                style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>
              <span>Câu hỏi {currentQIdx + 1} / {questions.length}</span>
              <span>Đã trả lời: {questions.filter((_, i) => isFillQuestion(i) ? !!fillInputs[i]?.trim() : !!userAnswers[i]).length} / {questions.length}</span>
            </div>
          </div>

          <div className="question-card">
            <div className="question-text">
              <RichTextRenderer text={currentQ.text} />
            </div>

            {isFillQuestion(currentQIdx) ? (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: "600", marginBottom: "8px" }}>
                  ✏️ Điền đáp án của bạn vào ô bên dưới:
                </div>
                <input
                  key={currentQIdx}
                  type="text"
                  value={fillInputs[currentQIdx] || ""}
                  onChange={e => setFillInputs(prev => ({ ...prev, [currentQIdx]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter" && currentQIdx + 1 < questions.length) setCurrentQIdx(p => p + 1); }}
                  placeholder="Nhập đáp án..."
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: "0.95rem",
                    borderRadius: "10px", border: "2px solid #3B82F6",
                    outline: "none", fontWeight: "600", color: "#1E3A5F",
                    background: "#F8FAFF", boxSizing: "border-box",
                  }}
                  autoFocus
                />
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "6px" }}>
                  Gợi ý: nhập số, biểu thức, hoặc tên công thức ngắn gọn
                </div>
              </div>
            ) : (
              <div className="quiz-options-list">
                {currentQ.options.map((option) => {
                  const isSelected = userAnswers[currentQIdx] === option;
                  return (
                    <button
                      key={option.letter}
                      className={`quiz-option-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className="option-letter">{option.letter}</div>
                      <div style={{ flex: 1 }}><RichTextRenderer text={option.text} /></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="quiz-bottom-actions" style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-4)" }}>
            <button 
              className="btn btn-secondary" 
              onClick={handlePrevQuestion}
              disabled={currentQIdx === 0}
              style={{ width: "130px", opacity: currentQIdx === 0 ? 0.4 : 1, cursor: currentQIdx === 0 ? "not-allowed" : "pointer" }}
            >
              <ArrowLeft size={16} />
              <span>Câu trước</span>
            </button>

            {currentQIdx + 1 < questions.length ? (
              <button 
                className="btn btn-primary" 
                onClick={handleNextQuestion}
                style={{ width: "130px" }}
              >
                <span>Tiếp theo</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                className="btn btn-success" 
                onClick={handleSubmitQuiz}
                style={{ width: "130px" }}
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
          <div className="summary-card" style={{ marginTop: 0 }}>
            <div className="summary-icon" style={{ backgroundColor: "rgba(30, 58, 95, 0.05)", color: "#1E3A5F" }}>
              <Award size={32} />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1E3A5F" }}>Kết quả bài kiểm tra</h2>
            
            <div className="summary-score" style={{ color: score >= (questions.length / 2) ? "#10B981" : "#EF4444" }}>
              {score} / {questions.length}
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "#64748B" }}>
              Bạn trả lời đúng <strong>{Math.round((score / questions.length) * 100)}%</strong> số câu hỏi.
            </p>

            <div style={{ width: "100%", textAlign: "left", marginTop: "16px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px", borderBottom: "1.5px solid #F1F5F9", paddingBottom: "6px" }}>
                Xem chi tiết bài làm:
              </h4>
              <div className="review-questions-list" style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                {questions.map((q, idx) => {
                  const isFillQ = isFillQuestion(idx);
                  const correctOpt = q.options.find(o => o.isCorrect);

                  // Fill-in review
                  if (isFillQ) {
                    const userInput = fillInputs[idx] || "";
                    const isCorrect = userInput.trim() !== "" &&
                      normalizeAnswer(userInput) === normalizeAnswer(correctOpt?.text || "");
                    const cardBorderColor = !userInput.trim() ? "var(--border-slate)"
                      : isCorrect ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)";
                    const cardBgColor = !userInput.trim() ? "#F8FAFC"
                      : isCorrect ? "rgba(16,185,129,0.01)" : "rgba(239,68,68,0.01)";
                    const statusLabel = !userInput.trim() ? "Chưa trả lời" : isCorrect ? "Đúng" : "Sai";
                    const statusColor = !userInput.trim() ? "var(--text-muted)" : isCorrect ? "var(--success)" : "var(--error)";

                    return (
                      <div key={q.id} className="review-item-card"
                        style={{ border: `1.5px solid ${cardBorderColor}`, backgroundColor: cardBgColor, borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                          <span style={{ color: "var(--text-muted)" }}>Câu {idx + 1}: {q.topic} • Lớp {q.grade} <span style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", borderRadius: "4px", padding: "1px 5px", marginLeft: "4px" }}>Điền đáp án</span></span>
                          <span style={{ color: statusColor, background: `${statusColor}15`, padding: "4px 8px", borderRadius: "4px" }}>{statusLabel}</span>
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                          <RichTextRenderer text={q.text} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "white", borderRadius: "8px", padding: "10px", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: "0.82rem" }}>
                            <span style={{ color: "#64748B", fontWeight: "600" }}>Bạn trả lời: </span>
                            <span style={{ fontWeight: "700", color: isCorrect ? "var(--success)" : "var(--error)" }}>{userInput || "(bỏ qua)"}</span>
                          </div>
                          <div style={{ fontSize: "0.82rem" }}>
                            <span style={{ color: "#64748B", fontWeight: "600" }}>Đáp án đúng: </span>
                            <span style={{ fontWeight: "700", color: "var(--success)" }}>{correctOpt?.text}</span>
                          </div>
                        </div>
                        <div style={{ backgroundColor: "white", border: "1px dashed rgba(30,58,95,0.15)", borderRadius: "8px", padding: "12px", fontSize: "0.8rem", color: "#475569", lineHeight: "1.5" }}>
                          <strong style={{ display: "block", color: "var(--primary)", marginBottom: "4px", fontSize: "0.8rem", fontWeight: "800" }}>Lời giải chi tiết:</strong>
                          <RichTextRenderer text={q.explanation} />
                        </div>
                      </div>
                    );
                  }

                  // Multiple-choice review
                  const selected = userAnswers[idx];
                  const isCorrect = selected && selected.isCorrect;

                  let cardBorderColor = "var(--border-slate)";
                  let cardBgColor = "#F8FAFC";
                  let statusLabel = "Chưa trả lời";
                  let statusColor = "var(--text-muted)";

                  if (selected) {
                    if (isCorrect) {
                      cardBorderColor = "rgba(16, 185, 129, 0.2)";
                      cardBgColor = "rgba(16, 185, 129, 0.01)";
                      statusLabel = "Đúng";
                      statusColor = "var(--success)";
                    } else {
                      cardBorderColor = "rgba(239, 68, 68, 0.2)";
                      cardBgColor = "rgba(239, 68, 68, 0.01)";
                      statusLabel = `Sai (Chọn: ${selected.letter})`;
                      statusColor = "var(--error)";
                    }
                  }

                  return (
                    <div 
                      key={q.id} 
                      className="review-item-card" 
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                        <span style={{ color: "var(--text-muted)" }}>Câu {idx + 1}: {q.topic} • Lớp {q.grade}</span>
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
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                        <RichTextRenderer text={q.text} />
                      </div>

                      {/* Options Review List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {q.options.map((option) => {
                          const isOptSelected = selected === option;
                          const isOptCorrect = option.isCorrect;
                          
                          let optBorder = "1px solid #E2E8F0";
                          let optBg = "white";
                          let optBadge = null;

                          if (isOptCorrect) {
                            optBorder = "1.5px solid var(--success)";
                            optBg = "rgba(16, 185, 129, 0.04)";
                            if (isOptSelected) {
                              optBadge = <CheckCircle size={14} fill="var(--success)" color="white" />;
                            }
                          } else if (isOptSelected) {
                            optBorder = "1.5px solid var(--error)";
                            optBg = "rgba(239, 68, 68, 0.04)";
                            optBadge = <XCircle size={14} fill="var(--error)" color="white" />;
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
                                  backgroundColor: isOptCorrect ? "var(--success)" : (isOptSelected ? "var(--error)" : "#F1F5F9"),
                                  color: isOptCorrect || isOptSelected ? "white" : "var(--text-muted)",
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
                      <div 
                        style={{ 
                          backgroundColor: "white", 
                          border: "1px dashed rgba(30, 58, 95, 0.15)", 
                          borderRadius: "8px", 
                          padding: "12px",
                          fontSize: "0.8rem",
                          color: "#475569",
                          lineHeight: "1.5"
                        }}
                      >
                        <strong style={{ display: "block", color: "var(--primary)", marginBottom: "4px", fontSize: "0.8rem", fontWeight: "800" }}>
                          Lời giải chi tiết:
                        </strong>
                        <RichTextRenderer text={q.explanation} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", width: "100%", paddingTop: "16px", marginTop: "16px" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                Lượt test miễn phí hôm nay: <strong>{isPremium ? "Không giới hạn" : `${remainingQuizzes} lượt`}</strong>
              </p>
            </div>

            <div className="summary-actions" style={{ width: "100%" }}>
              {!isPremium && remainingQuizzes <= 0 && (
                <div className="premium-banner" style={{ textAlign: "left", marginBottom: "8px" }}>
                  <div className="banner-badge">
                    <Crown size={12} fill="white" />
                    <span>Hết lượt test miễn phí</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "white" }}>
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
  );
}
