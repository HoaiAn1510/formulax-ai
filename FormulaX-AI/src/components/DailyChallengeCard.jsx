import { useEffect, useMemo, useState } from "react";
import { Sparkles, CheckCircle2, XCircle, X, RotateCcw } from "lucide-react";
import { questionsPool } from "../data/questions";
import { RichTextRenderer } from "../utils/katexHelper";

// Số ngẫu nhiên có seed riêng cho Thử thách hôm nay — độc lập với seededRandom() của
// Dashboard.jsx (dùng cho "Gợi ý hôm nay") để 2 tính năng không tương quan/chọn trùng logic.
function seededPick(seedStr, length) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (Math.imul(h, 31) + seedStr.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}

function storageKey(user, today) {
  return `formulax_daily_challenge_${user?.googleId || "guest"}_${today}`;
}

export default function DailyChallengeCard({ user, userGrade, onAnswered }) {
  const today = new Date().toISOString().slice(0, 10);

  const question = useMemo(() => {
    const gradePool = userGrade ? questionsPool.filter(q => q.grade === userGrade) : [];
    const pool = gradePool.length > 0 ? gradePool : questionsPool;
    if (pool.length === 0) return null;
    return pool[seededPick(`dc_${today}`, pool.length)];
  }, [today, userGrade]);

  const [answer, setAnswer] = useState(null); // { selectedLetter, isCorrect }
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!question) return;
    const raw = localStorage.getItem(storageKey(user, today));
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.questionId === question.id) {
          setAnswer({ selectedLetter: saved.selectedLetter, isCorrect: saved.isCorrect });
          setCollapsed(!!saved.collapsed);
          onAnswered?.();
        }
      } catch { /* ignore malformed cache */ }
    } else {
      setAnswer(null);
      setCollapsed(false);
    }
  }, [question?.id, user?.googleId]);

  if (!question) return null;

  const handleSelect = (option) => {
    if (answer) return;
    const isCorrect = !!option.isCorrect;
    setAnswer({ selectedLetter: option.letter, isCorrect });
    localStorage.setItem(
      storageKey(user, today),
      JSON.stringify({ questionId: question.id, selectedLetter: option.letter, isCorrect, collapsed: false })
    );
    onAnswered?.();
  };

  const handleCollapse = () => {
    setCollapsed(true);
    localStorage.setItem(
      storageKey(user, today),
      JSON.stringify({ questionId: question.id, selectedLetter: answer.selectedLetter, isCorrect: answer.isCorrect, collapsed: true })
    );
  };

  if (answer && collapsed) {
    return (
      <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-6 md:mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${answer.isCorrect ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            {answer.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          </div>
          <div className="min-w-0">
            <div className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0]">Thử thách hôm nay: Đã hoàn thành</div>
            <div className="text-[0.7rem] text-text-muted dark:text-[#94A3B8]">{answer.isCorrect ? "Bạn đã trả lời đúng" : "Bạn đã trả lời sai"}</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1 text-[0.75rem] font-bold text-accent bg-accent/10 border-none rounded-lg py-1.5 px-2.5 cursor-pointer shrink-0"
        >
          <RotateCcw size={13} />
          Xem lại
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Thử thách hôm nay</div>
            <div className="text-[0.7rem] text-text-muted dark:text-[#94A3B8]">{question.topic} · Lớp {question.grade}</div>
          </div>
        </div>
        {answer && (
          <button
            onClick={handleCollapse}
            aria-label="Đóng"
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#94A3B8] border-none cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="quiz-question-text text-[0.9rem] font-semibold text-primary dark:text-[#E2E8F0] leading-[1.55] mb-3">
        <RichTextRenderer text={question.text} />
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isSelected = answer?.selectedLetter === option.letter;
          const revealed = !!answer;
          const isRight = revealed && option.isCorrect;
          const isWrongSelected = revealed && isSelected && !option.isCorrect;

          return (
            <button
              key={option.letter}
              onClick={() => handleSelect(option)}
              disabled={revealed}
              className={`flex items-center w-full min-h-[46px] py-2.5 px-3.5 rounded-xl text-[0.85rem] font-semibold text-left gap-2.5 border-[1.5px] text-primary dark:text-[#E2E8F0] transition-all duration-200 disabled:opacity-100 ${
                // KaTeX kế thừa color từ phần tử cha bình thường (không cần nền sáng cố định để
                // đọc được — xem FormulaDetailModal.jsx render MathElement trực tiếp trên nền tối).
                isRight
                  ? "border-success bg-[#F0FDF4] dark:bg-success/15"
                  : isWrongSelected
                    ? "border-error bg-[#FEF2F2] dark:bg-error/15"
                    : "border-[rgba(30,58,95,0.07)] dark:border-[#334155] bg-white dark:bg-[#1E293B]" + (revealed ? "" : " cursor-pointer hover:border-accent hover:bg-accent/[0.02]")
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[0.78rem] font-extrabold shrink-0 ${
                isRight ? "bg-success text-white" : isWrongSelected ? "bg-error text-white" : "bg-[#f1f5f9] dark:bg-[#334155] text-text-muted"
              }`}>
                {option.letter}
              </div>
              <div className="quiz-question-text flex-1"><RichTextRenderer text={option.text} /></div>
              {isRight && <CheckCircle2 size={16} className="text-success shrink-0" />}
              {isWrongSelected && <XCircle size={16} className="text-error shrink-0" />}
            </button>
          );
        })}
      </div>

      {answer && (
        <div className="formula-explanation-prose mt-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A]/40 text-[0.78rem] text-text-muted dark:text-[#94A3B8] leading-[1.6]">
          <RichTextRenderer text={question.explanation} />
        </div>
      )}
    </div>
  );
}
