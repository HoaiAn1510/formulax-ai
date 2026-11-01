import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, Zap, ClipboardList, ChevronRight, ArrowRight, Flame, Check, Lock, BarChart2, Gem, GraduationCap, Sparkles } from "lucide-react";
import CountUp from "../components/CountUp";
import Confetti from "../components/Confetti";
import DailyChallengeCard from "../components/DailyChallengeCard";
import GuestLockNotice from "../components/GuestLockNotice";
import MimiMascot from "../components/MimiMascot";
import { getActivityData } from "../lib/supabase";
import { useGuestGate } from "../utils/useGuestGate";
import { vietnamToday } from "../utils/vietnamDate";
import { readIntentToday } from "../utils/dailyIntent";
import { buildGoals, isNewLearner, headline, nextStep, lastSevenDays } from "../utils/todayPlan";
import PageShell from "../components/PageShell";

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

  const today = vietnamToday(); // "Gợi ý hôm nay" đổi lúc nửa đêm giờ Việt Nam
  const rand = seededRandom(today);
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [scored[i], scored[j]] = [scored[j], scored[i]];
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.formula);
}

// 4 phím tắt — mỗi nút kèm một dòng nói rõ chức năng (góp ý của cô hướng dẫn).
const SHORTCUTS = [
  { tab: "library", icon: BookOpen, label: "Thư viện", hint: "Tra công thức Toán 10–12 kèm ví dụ, mẹo nhớ", tone: "bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]" },
  { tab: "finder", icon: Search, label: "Tìm kiếm AI", hint: "Gõ hoặc chụp đề, AI chỉ công thức cần dùng", tone: "bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]" },
  { tab: "flashcard", icon: Zap, label: "Flashcard", hint: "Lật thẻ để thuộc công thức, app nhắc lại đúng lúc", tone: "bg-accent-light text-accent dark:bg-accent/20 dark:text-[#FCD34D]" },
  { tab: "quiz", icon: ClipboardList, label: "Kiểm tra", hint: "Làm đề có lời giải, luyện lại dạng bài đã hỏi AI", tone: "bg-[#FFE4E6] text-[#E11D48] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF]" },
];

const CARD = "fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none";
const LABEL = "text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8]";

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
  dailyChallenge,
  onSaveDailyChallenge,
  flashcardProgress = {},
}) {
  // Khách: chuỗi ngày học, nhiệm vụ, thống kê là tiến độ cá nhân → khóa. Gợi ý công thức và
  // thử thách hằng ngày là nội dung → vẫn mở.
  const { isGuest, requireGoogle } = useGuestGate();
  // Tên Google có thể kèm ngoặc, ví dụ "Nguyễn An (FPT HCM)" → trước đây lấy từ cuối cùng
  // "HCM)" nên lời chào thành "Xin chào HCM)!". Bỏ phần trong ngoặc rồi mới lấy tên.
  const firstName = displayName
    || (user?.name || "").replace(/\([^)]*\)?/g, "").replace(/[()]/g, "").trim().split(/\s+/).filter(Boolean).slice(-1)[0]
    || "bạn";
  const recommendedFormulas = useMemo(
    () => getRecommendedFormulas(formulas, { userGrade, weakTopics, recentTopic, viewedFormulaIds }, 3),
    [formulas, userGrade, weakTopics, recentTopic, viewedFormulaIds]
  );

  // null = chưa tải xong (không vẽ màn chào người mới vội khi chưa biết).
  const [activity, setActivity] = useState(null);
  useEffect(() => {
    if (!user?.googleId) return;
    getActivityData(user.googleId).then(setActivity).catch(console.error);
  }, [user?.googleId]);
  const streak = activity?.streak ?? 0;
  const week = useMemo(() => lastSevenDays(activity?.activityDates || [], vietnamToday()), [activity]);

  // Lựa chọn hôm nay trong hộp "Hôm nay bạn gặp khó khăn gì?" → cá nhân hóa nút Học tiếp + nhiệm vụ.
  const intent = readIntentToday(user?.googleId);
  // Mốc "bây giờ" chốt lúc mở Dashboard (render phải thuần — không gọi Date.now() mỗi lần vẽ).
  const [openedAt] = useState(() => Date.now());
  const dueCount = useMemo(
    () => Object.values(flashcardProgress || {}).filter((p) => p?.nextReviewAt && new Date(p.nextReviewAt).getTime() <= openedAt).length,
    [flashcardProgress, openedAt]
  );

  // Nhiệm vụ hôm nay — chỉ dùng tiêu chí có số liệu đáng tin cậy sau khi tải lại trang.
  // todayStats.formulasViewed reset về 0 mỗi lần refresh (không có truy vấn "hôm nay" từ
  // Supabase cho mục này như quiz/flashcard) nên không dùng làm tiêu chí ở đây.
  const [dailyChallengeDone, setDailyChallengeDone] = useState(false);
  const goals = buildGoals({ intent, todayStats, challengeDone: dailyChallengeDone, weakTopic: weakTopics?.[0] || null });
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

  const isNew = !isGuest && activity !== null && isNewLearner({
    streak, stats, todayStats, viewedCount: viewedFormulaIds?.length || 0, recentTopic,
  });
  const step = nextStep({ intent, weakTopics, recentTopic, userGrade, formula: recommendedFormulas[0] || null, dueCount });
  const goNext = () => (step.formula ? onViewDetail(step.formula) : setActiveTab(step.tab));
  const challengeRef = useRef(null);
  const openGoal = (g) => {
    if (g.tab) setActiveTab(g.tab);
    else challengeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <PageShell innerClassName="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5">

          {/* ─── Hero: lời chào + Học tiếp ─────────────────────────────────── */}
          <section
            aria-label="Chào hỏi"
            className={`${CARD} relative md:col-span-8 mt-[60px] md:mt-[64px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] dark:border-[#78350F]/60 px-[18px] pt-5 pb-[18px] md:px-10 md:py-9`}
          >
            <MimiMascot width={150} className="md:hidden absolute right-1.5 -top-[66px]" />
            <MimiMascot width={210} className="hidden md:block absolute right-8 -top-[70px]" />
            <div className="relative max-w-[560px]">
              <div className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>Xin chào {firstName}</div>
              <h1 className="mt-1.5 md:mt-2.5 mb-0 text-[1.45rem] md:text-[2.1rem] leading-[1.2] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">
                {isGuest ? "Hôm nay mình ôn gì nhé?" : headline({ isNew, goals, streak, todayStats })}
              </h1>

              {isNew ? (
                <NewLearnerSteps userGrade={userGrade} setActiveTab={setActiveTab} />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={goNext}
                    className="mt-3.5 md:mt-6 w-full flex items-center gap-3 md:gap-4 text-left rounded-[14px] bg-white dark:bg-[#0F172A] border border-[#F1E3BF] dark:border-[#334155] px-3 md:px-4 py-2.5 md:py-3.5 cursor-pointer transition-colors hover:border-accent"
                  >
                    <span className="w-[34px] h-[34px] md:w-10 md:h-10 rounded-[10px] bg-accent-light dark:bg-accent/20 text-[#B45309] dark:text-[#FCD34D] flex items-center justify-center shrink-0">
                      <Sparkles size={17} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.7rem] md:text-[0.75rem] text-text-muted dark:text-[#94A3B8]">{step.kicker}</span>
                      <span className="block text-[0.9rem] md:text-base font-semibold text-primary dark:text-[#E2E8F0] truncate">{step.title}</span>
                      <span className="hidden md:block text-[0.75rem] text-text-muted dark:text-[#94A3B8] truncate">{step.sub}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="mt-3 md:mt-5 w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-[13px] bg-primary dark:bg-accent text-white font-semibold text-[0.95rem] px-6 py-[13px] border-none cursor-pointer shadow-[0_10px_22px_-10px_rgba(15,23,42,0.6)] transition-colors hover:bg-navy-secondary dark:hover:bg-accent-hover"
                  >
                    Học tiếp <ArrowRight size={16} strokeWidth={2.6} />
                  </button>
                </>
              )}
            </div>
          </section>

          {/* ─── Chuỗi học 7 ngày ──────────────────────────────────────────── */}
          <section
            aria-label="Chuỗi học"
            onClick={() => { if (requireGoogle()) setActiveTab("progress"); }}
            className={`${CARD} md:col-span-4 md:mt-[64px] p-4 md:p-7 flex flex-col justify-between gap-3 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className={LABEL}>Chuỗi học</div>
              {isGuest ? <Lock size={15} className="text-text-muted" /> : <Flame size={16} className="text-premium" />}
            </div>
            {isGuest ? (
              <p className="m-0 text-[0.82rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">Đăng nhập Google để lưu chuỗi ngày học.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.5rem] md:text-[4.5rem] font-extrabold tracking-[-0.05em] leading-none bg-[linear-gradient(180deg,#FBBF24,#D97706)] bg-clip-text text-transparent">{streak}</span>
                  <span className="text-[0.8rem] md:text-base font-medium text-text-muted dark:text-[#94A3B8]">{streak ? "ngày liên tiếp" : "ngày — học hôm nay để bắt đầu"}</span>
                </div>
                <div className="flex gap-1 md:gap-2" aria-label="7 ngày gần đây">
                  {week.map((d) => (
                    <div key={d.date} className="flex-1 text-center">
                      <div
                        title={d.active ? "Có học" : "Chưa học"}
                        className={`h-[18px] md:h-[30px] rounded-[5px] md:rounded-[9px] ${
                          d.active ? "bg-[linear-gradient(180deg,#FBBF24,#F59E0B)]"
                            : d.isToday ? "border-[1.5px] border-dashed border-accent" : "bg-[#EEF1F6] dark:bg-[#334155]"
                        }`}
                      />
                      <div className={`mt-1 text-[0.62rem] md:text-[0.68rem] ${d.isToday ? "font-bold text-[#B45309] dark:text-[#FCD34D]" : "text-text-muted dark:text-[#94A3B8]"}`}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ─── Nhiệm vụ hôm nay ──────────────────────────────────────────── */}
          {!isNew && (
            <section aria-label="Nhiệm vụ hôm nay" className={`${CARD} md:col-span-8 p-4 md:px-8 md:py-6`}>
              <div className="flex justify-between items-center">
                <div className={LABEL}>Nhiệm vụ hôm nay</div>
                {!isGuest && <span className="text-[0.75rem] font-semibold text-[#B45309] dark:text-[#FCD34D]">{doneCount}/{goals.length} hoàn thành</span>}
              </div>
              {isGuest ? (
                <GuestLockNotice
                  className="mt-3"
                  title="Đăng nhập Google để theo dõi nhiệm vụ"
                  description="Nhiệm vụ hằng ngày dựa trên tiến độ học được lưu theo tài khoản."
                  onClick={() => requireGoogle()}
                />
              ) : (
                <>
                  <div className="h-1 rounded-full bg-[#EEF1F6] dark:bg-[#334155] mt-2.5 mb-3 md:hidden">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#10B981,#F59E0B)] transition-[width] duration-500" style={{ width: `${(doneCount / goals.length) * 100}%` }} />
                  </div>
                  <ul className="list-none m-0 p-0 flex flex-col md:flex-row gap-1 md:gap-3 md:mt-5">
                    {goals.map((g, i) => {
                      const current = !g.done && goals.findIndex((x) => !x.done) === i;
                      return (
                        <li key={g.key} className="md:flex-1">
                          <button
                            type="button"
                            onClick={() => openGoal(g)}
                            className="w-full flex items-center gap-2.5 md:gap-3 text-left bg-transparent border-none p-1.5 -m-1.5 md:m-0 md:p-0 rounded-lg cursor-pointer"
                          >
                            {g.done ? (
                              <span className="w-[18px] h-[18px] md:w-7 md:h-7 rounded-full bg-success text-white flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3.5} /></span>
                            ) : (
                              <span className={`w-[18px] h-[18px] md:w-7 md:h-7 rounded-full border-2 shrink-0 ${current ? "border-premium shadow-[0_0_0_4px_rgba(245,158,11,0.15)]" : "border-[#CBD5E1] dark:border-[#475569]"}`} />
                            )}
                            <span className={`text-[0.82rem] md:text-[0.88rem] font-semibold ${g.done ? "text-text-muted dark:text-[#94A3B8]" : current ? "text-[#B45309] dark:text-[#FCD34D]" : "text-primary dark:text-[#E2E8F0]"}`}>
                              {g.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="hidden md:block h-1 rounded-full bg-[#EEF1F6] dark:bg-[#334155] mt-5">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#10B981,#F59E0B)] transition-[width] duration-500" style={{ width: `${(doneCount / goals.length) * 100}%` }} />
                  </div>
                </>
              )}
            </section>
          )}

          {/* ─── Hôm nay (số liệu) ─────────────────────────────────────────── */}
          {!isNew && (
            <section aria-label="Số liệu hôm nay" className={`${CARD} md:col-span-4 grid grid-cols-3 py-4 md:py-6`}>
              {isGuest ? (
                <div className="col-span-3 px-4 text-[0.8rem] text-text-muted dark:text-[#94A3B8] flex items-center gap-2">
                  <Lock size={14} className="text-accent shrink-0" /> Đăng nhập để lưu số liệu học mỗi ngày.
                </div>
              ) : [
                { label: "Công thức xem", value: todayStats?.formulasViewed ?? 0, color: "text-[#2563EB] dark:text-[#93C5FD]" },
                { label: "Flashcard ôn", value: todayStats?.flashcardsStudied ?? 0, color: "text-[#059669] dark:text-[#6EE7B7]" },
                { label: "Quiz hôm nay", value: todayStats?.quizzesCompleted ?? 0, color: "text-accent dark:text-[#FCD34D]" },
              ].map((s, i) => (
                <div key={s.label} className={`px-3 md:px-4 text-center md:text-left ${i === 1 ? "border-x border-line dark:border-[#334155]" : ""}`}>
                  <div className={`text-[1.6rem] md:text-[2rem] font-bold tracking-[-0.03em] ${s.color}`}><CountUp value={s.value} /></div>
                  <div className="text-[0.68rem] font-semibold text-text-muted dark:text-[#94A3B8] mt-0.5">{s.label}</div>
                </div>
              ))}
            </section>
          )}

          {/* ─── Thử thách hôm nay ─────────────────────────────────────────── */}
          <div ref={challengeRef} className="md:col-span-7 [&>*]:!mb-0 [&>*]:h-full">
            <DailyChallengeCard user={user} userGrade={userGrade} savedRecord={dailyChallenge} onSave={onSaveDailyChallenge} onAnswered={() => setDailyChallengeDone(true)} />
          </div>

          {/* ─── 4 phím tắt có chú thích ───────────────────────────────────── */}
          <section aria-label="Lối tắt" className="md:col-span-5 grid grid-cols-2 gap-3 md:gap-4">
            {SHORTCUTS.map(({ tab, icon: Icon, label, hint, tone }) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`${CARD} flex flex-col items-start gap-2 p-3.5 md:p-5 text-left cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]`}
              >
                <span className={`w-9 h-9 md:w-10 md:h-10 rounded-[10px] flex items-center justify-center ${tone}`}><Icon size={18} /></span>
                <span className="text-[0.88rem] md:text-[0.95rem] font-bold text-primary dark:text-[#E2E8F0]">{label}</span>
                <span className="text-[0.72rem] leading-[1.4] text-text-muted dark:text-[#94A3B8]">{hint}</span>
              </button>
            ))}
          </section>

          <Confetti active={showGoalConfetti} />

          {/* ─── Gợi ý hôm nay ─────────────────────────────────────────────── */}
          <section aria-label="Gợi ý hôm nay" className="md:col-span-12 mt-2">
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="m-0 text-base md:text-lg font-bold tracking-[-0.01em] text-primary dark:text-[#E2E8F0]">Gợi ý hôm nay</h2>
              <span className="text-xs text-text-muted dark:text-[#94A3B8] font-medium">
                {isGuest ? "Đổi mới mỗi ngày" : userGrade ? `Theo lớp ${userGrade} và lịch sử học` : "Dựa trên lịch sử học"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
              {/* Dữ liệu công thức được App tải động (chunk riêng, xem App.jsx) nên trong vài
                  trăm ms đầu mảng còn rỗng — vẽ skeleton thay vì để trống, tránh nội dung
                  nhảy chỗ khi danh sách gợi ý xuất hiện. */}
              {formulas.length === 0 && [0, 1, 2].map((i) => (
                <div key={`skeleton-${i}`} className={`${CARD} p-5`} aria-hidden="true">
                  <div className="h-2.5 w-1/4 rounded bg-[#EEF1F6] dark:bg-[#334155] animate-pulse" />
                  <div className="h-3.5 w-3/4 rounded bg-[#E5E7EB] dark:bg-[#334155] animate-pulse mt-3" />
                </div>
              ))}
              {recommendedFormulas.map((formula) => {
                const why = weakTopics?.includes(formula.topic) ? "Chủ đề bạn còn yếu"
                  : recentTopic === formula.topic ? "Bạn vừa học chủ đề này"
                    : userGrade && formula.grade === userGrade ? `Đúng chương trình lớp ${userGrade}` : "Công thức mới cho bạn";
                return (
                  <button
                    key={formula.id}
                    type="button"
                    onClick={() => onViewDetail(formula)}
                    className={`${CARD} p-4 md:p-5 flex flex-col gap-1.5 text-left cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]`}
                  >
                    <span className="text-[0.72rem] font-semibold text-[#2563EB] dark:text-[#93C5FD]">{formula.topic} · Lớp {formula.grade}</span>
                    <span className="text-[0.95rem] font-semibold leading-[1.4] text-primary dark:text-[#E2E8F0]">{formula.name}</span>
                    <span className="text-[0.75rem] text-text-muted dark:text-[#94A3B8]">{why}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Tiến độ + Premium ─────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => { if (requireGoogle()) setActiveTab("progress"); }}
            className={`${CARD} ${isPremium ? "md:col-span-12" : "md:col-span-7"} flex items-center gap-4 px-4 md:px-7 py-4 md:py-5 text-left cursor-pointer`}
          >
            <span className="w-11 h-11 rounded-xl bg-primary dark:bg-[#0F172A] text-[#FBBF24] flex items-center justify-center shrink-0">
              {isGuest ? <Lock size={18} /> : <BarChart2 size={18} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[0.92rem] font-bold text-primary dark:text-[#E2E8F0]">Xem tiến độ học tập</span>
              <span className="block text-[0.75rem] text-text-muted dark:text-[#94A3B8]">Điểm mạnh, điểm yếu theo chủ đề và gợi ý ôn tập</span>
            </span>
            <ChevronRight size={18} className="text-[#CBD5E1] shrink-0" />
          </button>

          {!isPremium && (
            <section aria-label="Premium" className="md:col-span-5 rounded-[18px] bg-primary dark:bg-[#020617] dark:border dark:border-[#334155] text-white px-5 md:px-6 py-4 md:py-5 flex flex-col gap-2 justify-center">
              <div className="flex justify-between text-[0.8rem] font-semibold gap-2">
                <span>{isGuest ? "Chế độ khách" : `Còn ${remainingQuizzes}/10 quiz miễn phí hôm nay`}</span>
                <span className="text-[#FBBF24] shrink-0">49.000 đ/tháng</span>
              </div>
              {!isGuest && (
                <div className="h-1.5 rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-[#FBBF24]" style={{ width: `${Math.max(0, Math.min(100, (remainingQuizzes / 10) * 100))}%` }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("premium")}
                className="bg-transparent border-none p-0 text-white text-[0.92rem] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2"><Gem size={15} className="text-[#FBBF24]" /> Mở khóa không giới hạn với Premium</span>
                <ChevronRight size={16} />
              </button>
            </section>
          )}
        </PageShell>
  );
}

// Màn chào cho người chưa học gì: thay "Học tiếp" + nhiệm vụ trống bằng 3 bước bắt đầu rõ ràng.
function NewLearnerSteps({ userGrade, setActiveTab }) {
  const steps = [
    {
      icon: GraduationCap, tab: "library",
      title: userGrade ? `Xem công thức lớp ${userGrade}` : "Xem thư viện công thức",
      sub: "Mỗi công thức có giải thích ký hiệu, ví dụ và mẹo nhớ.",
    },
    { icon: Search, tab: "finder", title: "Hỏi AI một bài đang làm", sub: "AI chỉ công thức và các bước, bạn tự tính." },
    { icon: ClipboardList, tab: "quiz", title: "Làm thử một bài kiểm tra", sub: "Biết mình đang nhớ tới đâu, có lời giải sau khi nộp." },
  ];
  return (
    <ol className="list-none m-0 mt-4 md:mt-6 p-0 flex flex-col gap-2">
      {steps.map((s, i) => (
        <li key={s.tab}>
          <button
            type="button"
            onClick={() => setActiveTab(s.tab)}
            className="w-full flex items-center gap-3 text-left rounded-[14px] bg-white dark:bg-[#0F172A] border border-[#F1E3BF] dark:border-[#334155] px-3 md:px-4 py-2.5 md:py-3 cursor-pointer transition-colors hover:border-accent"
          >
            <span className="w-8 h-8 rounded-[10px] bg-primary dark:bg-accent text-[#FBBF24] dark:text-white text-[0.8rem] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[0.88rem] font-semibold text-primary dark:text-[#E2E8F0]">{s.title}</span>
              <span className="block text-[0.72rem] text-text-muted dark:text-[#94A3B8]">{s.sub}</span>
            </span>
            <s.icon size={16} className="text-text-muted dark:text-[#94A3B8] shrink-0" />
          </button>
        </li>
      ))}
    </ol>
  );
}
