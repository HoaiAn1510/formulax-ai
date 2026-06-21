import React, { useState, useEffect } from "react";
import { GraduationCap, Timer, CheckCircle, XCircle, Award, Crown, Lock, ArrowLeft, ArrowRight, Play, BookOpen, Layers, Check, Clipboard, BarChart2, List, Pencil, Shuffle } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { questionsPool as pool } from "../data/questions";

export default function QuizView({ 
  setActiveTab, 
  isPremium, 
  remainingQuizzes, 
  setRemainingQuizzes,
  stats,
  setStats
}) {
  const [quizState, setQuizState] = useState("setup"); // setup, active, result
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [topic, setTopic] = useState("Tất cả chủ đề");
  const [questionCount, setQuestionCount] = useState(5);
  const [quizType, setQuizType] = useState("multiple-choice"); // multiple-choice, fill-in, hybrid
  const [timeLimit, setTimeLimit] = useState("Không giới hạn"); // Không giới hạn, 5 phút, 10 phút, 15 phút, 20 phút
  
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [failedQuestions, setFailedQuestions] = useState([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(false);

  // Helper to filter questions based on topic
  const getFilteredQuestions = (selectedTopic) => {
    let filtered = pool.filter(q => {
      if (selectedTopic === "Tất cả chủ đề") return true;
      if (selectedTopic === "Xác suất" || selectedTopic === "Tổ hợp") {
        return q.topic.includes("Xác suất") || q.topic.includes("Tổ hợp");
      }
      return q.topic === selectedTopic;
    });

    if (filtered.length === 0) {
      filtered = pool;
    }
    return filtered;
  };

  // Helper to generate selectable question count options
  const getQuestionCountOptions = (maxCount) => {
    const options = [];
    if (maxCount >= 5) {
      options.push(5);
    }
    if (maxCount >= 10) {
      options.push(10);
    }
    if (maxCount >= 15) {
      options.push(15);
    }
    if (maxCount >= 20) {
      options.push(20);
    }
    if (!options.includes(maxCount) && maxCount > 0) {
      options.push(maxCount);
    }
    return options.sort((a, b) => a - b);
  };

  // Adjust questionCount when topic changes
  useEffect(() => {
    const available = getFilteredQuestions(topic);
    const maxCount = available.length;
    const options = getQuestionCountOptions(maxCount);
    
    if (!options.includes(questionCount) || questionCount > maxCount) {
      if (options.length > 0) {
        if (options.includes(5)) {
          setQuestionCount(5);
        } else {
          setQuestionCount(options[options.length - 1]);
        }
      } else {
        setQuestionCount(0);
      }
    }
  }, [topic]);

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

    const filtered = getFilteredQuestions(topic);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, questionCount);
    
    setQuestions(shuffled);
    setCurrentQIdx(0);
    setUserAnswers({});
    setScore(0);
    setFailedQuestions([]);
    
    // Timer setting
    if (timeLimit === "Không giới hạn") {
      setTimeLeft(9999);
      setTimerActive(false);
    } else {
      const minutes = parseInt(timeLimit.replace(" phút", ""));
      setTimeLeft(minutes * 60);
      setTimerActive(true);
    }
    
    setQuizState("active");
  };

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
      const selected = userAnswers[idx];
      if (selected && selected.isCorrect) {
        finalScore += 1;
      } else {
        failedList.push({
          questionText: q.text,
          userAnswer: selected ? selected.letter : "Bỏ qua",
          userAnswerText: selected ? selected.text : "Chưa trả lời",
          correctAnswer: q.options.find(o => o.isCorrect).letter,
          correctAnswerText: q.options.find(o => o.isCorrect).text,
          explanation: q.explanation,
          wasSkipped: !selected
        });
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
  };

  const handleSubmitQuiz = () => {
    const unansweredCount = questions.length - Object.keys(userAnswers).length;
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
  const topicsList = ["Tất cả chủ đề", "Đại số", "Hình học", "Giải tích", "Xác suất", "Tổ hợp", "Lượng giác"];
  const filteredQuestions = getFilteredQuestions(topic);
  const questionCountOptions = getQuestionCountOptions(filteredQuestions.length);

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
              </div>
              <div className="filter-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {topicsList.map((t) => (
                  <button
                    key={t}
                    className={`filter-pill ${topic === t ? "active" : ""}`}
                    onClick={() => setTopic(t)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: "1.5px solid #E2E8F0",
                      backgroundColor: topic === t ? "#1E3A5F" : "#F8FAFC",
                      color: topic === t ? "white" : "#475569",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Số câu hỏi */}
            <div>
              <div className="quiz-setup-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "12px" }}>
                <BarChart2 size={15} style={{ color: "#3B82F6" }} />
                <span>Số câu hỏi</span>
              </div>
              <div className="options-pill-grid" style={{ 
                display: "grid", 
                gridTemplateColumns: `repeat(${questionCountOptions.length}, 1fr)`, 
                gap: "8px" 
              }}>
                {questionCountOptions.map((count) => {
                  const isActive = questionCount === count;
                  return (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      style={{
                        padding: "10px 0",
                        borderRadius: "8px",
                        border: "1.5px solid #E2E8F0",
                        backgroundColor: isActive ? "#3B82F6" : "#F8FAFC",
                        color: isActive ? "white" : "#475569",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {count} câu
                    </button>
                  );
                })}
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
              <div className="filter-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["Không giới hạn", "5 phút", "10 phút", "15 phút", "20 phút"].map((limit) => {
                  const isActive = timeLimit === limit;
                  return (
                    <button
                      key={limit}
                      onClick={() => setTimeLimit(limit)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: "1.5px solid #E2E8F0",
                        backgroundColor: isActive ? "#1E3A5F" : "#F8FAFC",
                        color: isActive ? "white" : "#475569",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {limit}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer limits */}
          <div style={{ textAlign: "left", fontSize: "0.8rem", color: "#64748B", marginBottom: "16px", fontWeight: "700", paddingLeft: "4px" }}>
            Miễn phí — Còn {isPremium ? "Không giới hạn" : `${remainingQuizzes}/10`} lượt hôm nay
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
              <span>Đã trả lời: {Object.keys(userAnswers).length} / {questions.length}</span>
            </div>
          </div>

          <div className="question-card">
            <div className="question-text">
              <RichTextRenderer text={currentQ.text} />
            </div>

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
