import { useEffect, useMemo, useState } from "react";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
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

  useEffect(() => {
    if (!question) return;
    const raw = localStorage.getItem(storageKey(user, today));
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.questionId === question.id) {
          setAnswer({ selectedLetter: saved.selectedLetter, isCorrect: saved.isCorrect });
          onAnswered?.();
        }
      } catch { /* ignore malformed cache */ }
    } else {
      setAnswer(null);
    }
  }, [question?.id, user?.googleId]);

  if (!question) return null;

  const handleSelect = (option) => {
    if (answer) return;
    const isCorrect = !!option.isCorrect;
    setAnswer({ selectedLetter: option.letter, isCorrect });
    localStorage.setItem(
      storageKey(user, today),
      JSON.stringify({ questionId: question.id, selectedLetter: option.letter, isCorrect })
    );
    onAnswered?.();
  };

  return (
    <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-6 md:mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">
          <Sparkles size={16} />
        </div>
        <div>
          <div className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Thử thách hôm nay</div>
          <div className="text-[0.7rem] text-text-muted dark:text-[#94A3B8]">{question.topic} · Lớp {question.grade}</div>
        </div>
      </div>

      <div className="text-[0.9rem] font-semibold text-primary dark:text-[#E2E8F0] leading-[1.55] mb-3">
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
              className={`flex items-center w-full min-h-[46px] py-2.5 px-3.5 rounded-xl text-[0.85rem] font-semibold text-left gap-2.5 border-[1.5px] text-primary transition-all duration-200 disabled:opacity-100 ${
                // Nền luôn sáng (không đổi theo dark mode) — chữ do KaTeX tự render dùng màu
                // mặc định tối, không kế thừa currentColor, nên cần nền sáng để đọc được ở cả
                // 2 chế độ. Cùng lý do QuizView.jsx giữ nền trắng cho các nút đáp án bất kể dark mode.
                isRight
                  ? "border-success bg-[#F0FDF4]"
                  : isWrongSelected
                    ? "border-error bg-[#FEF2F2]"
                    : "border-[rgba(30,58,95,0.07)] bg-white" + (revealed ? "" : " cursor-pointer hover:border-accent hover:bg-accent/[0.02]")
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[0.78rem] font-extrabold shrink-0 ${
                isRight ? "bg-success text-white" : isWrongSelected ? "bg-error text-white" : "bg-[#f1f5f9] dark:bg-[#334155] text-text-muted"
              }`}>
                {option.letter}
              </div>
              <div className="flex-1"><RichTextRenderer text={option.text} /></div>
              {isRight && <CheckCircle2 size={16} className="text-success shrink-0" />}
              {isWrongSelected && <XCircle size={16} className="text-error shrink-0" />}
            </button>
          );
        })}
      </div>

      {answer && (
        // Nền sáng cố định — cùng lý do với nút đáp án ở trên, giải thích cũng chứa KaTeX.
        <div className="mt-3 p-3 rounded-xl bg-[#F8FAFC] text-[0.78rem] text-text-muted leading-[1.6]">
          <RichTextRenderer text={question.explanation} />
        </div>
      )}
    </div>
  );
}
