import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, Zap, ClipboardList, Crown, ChevronRight, LayoutGrid, Gem, BarChart2, Flame, CheckCircle2, Circle } from "lucide-react";
import CountUp from "../components/CountUp";
import Confetti from "../components/Confetti";
import DailyChallengeCard from "../components/DailyChallengeCard";
import { getActivityData } from "../lib/supabase";

// Số ngẫu nhiên có seed (từ chuỗi ngày hôm nay) — cùng 1 ngày luôn ra cùng thứ tự,
// sang ngày khác thì đổi. Dùng để: (1) phá đồng hạng ổn định trong ngày, (2) cho user
// mới (chưa có điểm ưu tiên nào) vẫn thấy gợi ý xoay vòng mỗi ngày thay vì đứng yên mãi.
function seededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (Math.imul(h, 31) + seedStr.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(h, 1103515245) + 12345) | 0;
    return ((h >>> 0) % 1000000) / 1000000;
  };
}

function getRecommendedFormulas(formulas, { userGrade, weakTopics, recentTopic, viewedFormulaIds }, count = 3) {
  const viewedSet = new Set(viewedFormulaIds || []);
  const weakSet = new Set(weakTopics || []);

  const scored = formulas.map(f => {
    let score = 0;
    if (weakSet.has(f.topic)) score += 5;       // ưu tiên cao nhất: chủ đề đang yếu
    if (recentTopic && f.topic === recentTopic) score += 2; // củng cố chủ đề vừa học
    if (userGrade && f.grade === userGrade) score += 2;     // đúng lớp đang học
    if (!viewedSet.has(f.id)) score += 1;        // ưu tiên nhẹ công thức chưa xem
    return { formula: f, score };
  });

  const today = new Date().toISOString().slice(0, 10);
  const rand = seededRandom(today);
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [scored[i], scored[j]] = [scored[j], scored[i]];
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.formula);
}

export default function Dashboard({
  user,
  displayName,
  setActiveTab,
  formulas,
  onViewDetail,
  isPremium,
  remainingQuizzes,
  stats,
  todayStats,
  userGrade,
  weakTopics,
  recentTopic,
  viewedFormulaIds,
}) {
  const firstName = displayName || user?.name?.split(" ").slice(-1)[0] || "bạn";
  const recommendedFormulas = useMemo(
    () => getRecommendedFormulas(formulas, { userGrade, weakTopics, recentTopic, viewedFormulaIds }, 3),
    [formulas, userGrade, weakTopics, recentTopic, viewedFormulaIds]
  );

  const [streak, setStreak] = useState(null);
  useEffect(() => {
    if (!user?.googleId) return;
    getActivityData(user.googleId).then(({ streak }) => setStreak(streak)).catch(console.error);
  }, [user?.googleId]);

  // Nhiệm vụ hôm nay — chỉ dùng tiêu chí có số liệu đáng tin cậy sau khi tải lại trang.
  // todayStats.formulasViewed reset về 0 mỗi lần refresh (không có truy vấn "hôm nay" từ
  // Supabase cho mục này như quiz/flashcard) nên không dùng làm tiêu chí ở đây.
  const [dailyChallengeDone, setDailyChallengeDone] = useState(false);
  const goals = [
    { key: "flashcard", label: "Ôn 5 flashcard", done: (todayStats?.flashcardsStudied ?? 0) >= 5 },
    { key: "quiz", label: "Hoàn thành 1 quiz", done: (todayStats?.quizzesCompleted ?? 0) >= 1 },
    { key: "challenge", label: "Trả lời thử thách hôm nay", done: dailyChallengeDone },
  ];
  const doneCount = goals.filter(g => g.done).length;
  const prevDoneCountRef = useRef(doneCount);
  const [showGoalConfetti, setShowGoalConfetti] = useState(false);
  useEffect(() => {
    if (doneCount === goals.length && prevDoneCountRef.current < goals.length) {
      setShowGoalConfetti(true);
      setTimeout(() => setShowGoalConfetti(false), 2500);
    }
    prevDoneCountRef.current = doneCount;
  }, [doneCount, goals.length]);

  return (
    <div className="view-container">
      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1]">
          {/* Greeting Header */}
          <div className="mb-6">
            <h1 className="flex items-baseline gap-2 flex-wrap text-[1.45rem] font-extrabold text-primary dark:text-[#E2E8F0] tracking-[-0.5px] m-0">
              <span>Xin chào {firstName}!</span>
              <span className="text-text-muted dark:text-[#94A3B8] font-medium text-[0.95rem]">Hôm nay ôn gì?</span>
            </h1>
          </div>

          {/* Streak banner */}
          <div
            onClick={() => setActiveTab("progress")}
            className="flex items-center justify-between bg-banner-flame rounded-2xl px-4 py-[13px] cursor-pointer text-white mb-4 shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <div className="text-[0.88rem] font-bold">
                  {streak ? `Chuỗi ${streak} ngày` : "Bắt đầu chuỗi học hôm nay!"}
                </div>
                <div className="text-[0.7rem] opacity-75 mt-[1px]">
                  {streak ? "Học hôm nay để giữ chuỗi liên tục" : "Học 1 lần hôm nay để bắt đầu chuỗi"}
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="opacity-70 shrink-0" />
          </div>

          {/* 2x2 Grid of Circular Icon Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
            {/* Card 1: Thư viện */}
            <div
              className="glass-card py-6 md:py-8 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] dark:bg-[#1E293B] dark:border-[#334155]"
              onClick={() => setActiveTab("library")}
            >
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-secondary/8 text-secondary">
                <BookOpen size={22} />
              </div>
              <span className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Thư viện</span>
            </div>

            {/* Card 2: Tìm kiếm AI */}
            <div
              className="glass-card py-6 md:py-8 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] dark:bg-[#1E293B] dark:border-[#334155]"
              onClick={() => setActiveTab("finder")}
            >
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-success/8 text-success">
                <Search size={22} />
              </div>
              <span className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Tìm kiếm AI</span>
            </div>

            {/* Card 3: Flashcard */}
            <div
              className="glass-card py-6 md:py-8 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] dark:bg-[#1E293B] dark:border-[#334155]"
              onClick={() => setActiveTab("flashcard")}
            >
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-premium/8 text-premium">
                <Zap size={22} />
              </div>
              <span className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Flashcard</span>
            </div>

            {/* Card 4: Kiểm tra */}
            <div
              className="glass-card py-6 md:py-8 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] dark:bg-[#1E293B] dark:border-[#334155]"
              onClick={() => setActiveTab("quiz")}
            >
              <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-error/8 text-error">
                <ClipboardList size={22} />
              </div>
              <span className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0]">Kiểm tra</span>
            </div>
          </div>

          {/* Nhiệm vụ hôm nay */}
          <div className="glass-card p-4 mb-6 md:mb-8 dark:bg-[#1E293B] dark:border-[#334155]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">
                Nhiệm vụ hôm nay
              </h2>
              <span className="text-xs font-bold text-accent">{doneCount}/{goals.length} hoàn thành</span>
            </div>

            <div className="w-full h-2 bg-[#E5E7EB] dark:bg-[#334155] rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-progress-premium transition-[width] duration-500" style={{ width: `${(doneCount / goals.length) * 100}%` }} />
            </div>

            <div className="flex flex-col gap-2">
              {goals.map(g => (
                <div key={g.key} className="flex items-center gap-2">
                  {g.done ? <CheckCircle2 size={16} className="text-accent shrink-0" /> : <Circle size={16} className="text-[#CBD5E1] dark:text-[#475569] shrink-0" />}
                  <span className={`text-[0.82rem] font-semibold ${g.done ? "text-primary dark:text-[#E2E8F0]" : "text-text-muted dark:text-[#94A3B8]"}`}>
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DailyChallengeCard user={user} userGrade={userGrade} onAnswered={() => setDailyChallengeDone(true)} />

          <Confetti active={showGoalConfetti} />

          {/* Analytics CTA Banner */}
          <div
            onClick={() => setActiveTab("progress")}
            className="flex items-center justify-between bg-banner-purple rounded-2xl px-4 py-[13px] cursor-pointer text-white mb-4 shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
                <BarChart2 size={18} />
              </div>
              <div>
                <div className="text-[0.88rem] font-bold">Xem tiến độ học tập</div>
                <div className="text-[0.7rem] opacity-75 mt-[1px]">
                  Phân tích điểm mạnh · yếu · gợi ý ôn tập
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="opacity-70 shrink-0" />
          </div>

          {/* Stats Section: Tiến độ học tập */}
          <div className="flex justify-between items-center mb-[10px]">
            <h2 className="text-base font-extrabold text-primary dark:text-[#E2E8F0] m-0 flex items-center gap-2">Hôm nay</h2>
          </div>
          <div className="glass-card grid grid-cols-3 py-4 mb-6 md:mb-8 dark:bg-[#1E293B] dark:border-[#334155]">
            <div className="text-center py-2 border-r border-[#f1f5f9]">
              <div className="text-[1.7rem] font-extrabold text-secondary"><CountUp value={todayStats?.formulasViewed ?? 0} /></div>
              <div className="text-xs font-bold text-text-muted dark:text-[#94A3B8] mt-1">Công thức xem</div>
            </div>
            <div className="text-center py-2 border-r border-[#f1f5f9]">
              <div className="text-[1.7rem] font-extrabold text-success"><CountUp value={todayStats?.flashcardsStudied ?? 0} /></div>
              <div className="text-xs font-bold text-text-muted dark:text-[#94A3B8] mt-1">Flashcard đã ôn</div>
            </div>
            <div className="text-center py-2">
              <div className="text-[1.7rem] font-extrabold text-premium"><CountUp value={todayStats?.quizzesCompleted ?? 0} /></div>
              <div className="text-xs font-bold text-text-muted dark:text-[#94A3B8] mt-1">Quiz hôm nay</div>
            </div>
          </div>

          {/* Gợi ý hôm nay Section */}
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-base font-extrabold text-primary dark:text-[#E2E8F0] m-0 flex items-center gap-2">Gợi ý hôm nay</h2>
            <span className="text-xs text-text-muted dark:text-[#94A3B8] font-semibold">Dựa trên lịch sử học</span>
          </div>

          <div className="flex flex-col gap-2 mb-6 md:mb-8">
            {/* Dữ liệu công thức được App tải động (chunk riêng, xem App.jsx) nên trong vài
                trăm ms đầu mảng còn rỗng — vẽ skeleton thay vì để trống, tránh nội dung
                nhảy chỗ khi danh sách gợi ý xuất hiện. */}
            {formulas.length === 0 && [0, 1, 2].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="glass-card-sm px-4 py-3 flex items-center gap-3 dark:bg-[#1E293B] dark:border-[#334155]"
                aria-hidden="true"
              >
                <div className="w-[38px] h-[38px] rounded-lg bg-[#E5E7EB] dark:bg-[#334155] animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-1/2 rounded bg-[#E5E7EB] dark:bg-[#334155] animate-pulse" />
                  <div className="h-2.5 w-1/4 rounded bg-[#EFF2F6] dark:bg-[#293548] animate-pulse mt-2" />
                </div>
              </div>
            ))}
            {recommendedFormulas.map((formula) => (
              <div
                key={formula.id}
                className="glass-card-sm px-4 py-3 flex items-center justify-between cursor-pointer transition-transform duration-200 hover:translate-x-0.5 active:scale-[0.98] dark:bg-[#1E293B] dark:border-[#334155]"
                onClick={() => onViewDetail(formula)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center bg-secondary/8 text-secondary">
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <span className="font-extrabold text-[0.9rem] text-primary dark:text-[#E2E8F0]">{formula.name}</span>
                    <div className="text-xs text-text-muted mt-0.5 dark:text-[#94A3B8]">{formula.topic}</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#cbd5e1]" />
              </div>
            ))}
          </div>

          {/* Limit quota progress indicator card */}
          <div className="glass-card p-4 mt-6 flex flex-col gap-3 dark:bg-[#1E293B] dark:border-[#334155]">
            <div className="flex justify-between items-center">
              <div className="text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0] flex items-center gap-1.5">
                <Crown size={14} className="text-premium" />
                <span>Còn {isPremium ? "Không giới hạn" : `${remainingQuizzes}/10`} quiz miễn phí hôm nay</span>
              </div>
            </div>

            <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-progress-premium" style={{ width: isPremium ? "100%" : `${(remainingQuizzes / 10) * 100}%` }} />
            </div>

            {/* Inner amber banner */}
            <div
              onClick={() => setActiveTab("premium")}
              className="bg-banner-orange border-none px-4 py-3 rounded-2xl flex justify-between items-center cursor-pointer text-[0.85rem] font-bold text-white shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <Gem size={14} className="text-white" />
                <span className="text-white font-bold">Mở khóa không giới hạn với Premium</span>
              </div>
              <div className="flex items-center gap-1 text-white font-extrabold">
                <span>49.000 đ/tháng</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
