import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Zap, ClipboardList, ChevronRight, ArrowRight, Flame, Lock, Gem, GraduationCap, Sparkles } from "lucide-react";
import MimiMascot from "../components/MimiMascot";
import { getActivityData } from "../lib/supabase";
import { useGuestGate } from "../utils/useGuestGate";
import { vietnamToday } from "../utils/vietnamDate";
import { readIntentToday, writeLast, INTENT_OPTIONS } from "../utils/dailyIntent";
import { isNewLearner, headline, nextStep, lastSevenDays } from "../utils/todayPlan";
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

// 4 phím tắt — mỗi nút kèm lời giải thích rõ chức năng (góp ý của cô hướng dẫn). Từ 2026-11-02 hiện dưới dạng câu hỏi
// "Hôm nay bạn gặp khó khăn gì?" ngay trên Dashboard: tiêu đề + giải thích lấy từ INTENT_OPTIONS (utils/dailyIntent.js,
// dùng chung với hộp hỏi lúc mở app), ở đây chỉ còn tên chức năng + màu.
// bg: nền nhạt dần từ màu của mục sang trắng, cùng kiểu nền khung lời chào (bg-hero-amber). Bản tối giữ nền phẳng.
const SHORTCUTS = [
  { tab: "library", icon: BookOpen, label: "Thư viện", tone: "bg-white text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]", bg: "bg-[linear-gradient(135deg,#DCEBFF_0%,#F3F8FF_55%,#FFFFFF_100%)]" },
  { tab: "finder", icon: Search, label: "Trợ lý hướng dẫn", tone: "bg-white text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]", bg: "bg-[linear-gradient(135deg,#EDE6FF_0%,#F8F5FF_55%,#FFFFFF_100%)]" },
  { tab: "flashcard", icon: Zap, label: "Flashcard", tone: "bg-white text-accent dark:bg-accent/20 dark:text-[#FCD34D]", bg: "bg-hero-amber" },
  { tab: "quiz", icon: ClipboardList, label: "Kiểm tra", tone: "bg-white text-[#E11D48] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF]", bg: "bg-[linear-gradient(135deg,#FFE1E7_0%,#FFF5F7_55%,#FFFFFF_100%)]" },
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

  // Mimi chúc mừng khi hôm nay đã học và đang giữ chuỗi — mắt trái tim + một câu, mỗi ngày một lần trên máy này.
  const studiedToday = (todayStats?.flashcardsStudied ?? 0) > 0 || (todayStats?.quizzesCompleted ?? 0) > 0;
  const cheerKey = `formulax_mimi_streak_${user?.googleId || "guest"}`;
  const [cheeredToday] = useState(() => { try { return localStorage.getItem(cheerKey) === vietnamToday(); } catch { return true; } });
  const streakReaction = !isGuest && !cheeredToday && streak > 0 && studiedToday
    ? { expr: "love", at: `streak-${streak}`, say: `Chuỗi ${streak} ngày liên tiếp rồi! Giữ vững nhé.` }
    : null;
  useEffect(() => {
    if (!streakReaction) return;
    try { localStorage.setItem(cheerKey, vietnamToday()); } catch { /* bỏ qua */ }
  }, [streakReaction?.at, cheerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lựa chọn hôm nay trong hộp "Hôm nay bạn gặp khó khăn gì?" → cá nhân hóa nút Học tiếp + nhiệm vụ.
  const intent = readIntentToday(user?.googleId);
  // Mốc "bây giờ" chốt lúc mở Dashboard (render phải thuần — không gọi Date.now() mỗi lần vẽ).
  const [openedAt] = useState(() => Date.now());
  const dueCount = useMemo(
    () => Object.values(flashcardProgress || {}).filter((p) => p?.nextReviewAt && new Date(p.nextReviewAt).getTime() <= openedAt).length,
    [flashcardProgress, openedAt]
  );

  const isNew = !isGuest && activity !== null && isNewLearner({
    streak, stats, todayStats, viewedCount: viewedFormulaIds?.length || 0, recentTopic,
  });
  const step = nextStep({ intent, weakTopics, recentTopic, userGrade, formula: recommendedFormulas[0] || null, dueCount });
  const goNext = () => (step.formula ? onViewDetail(step.formula) : setActiveTab(step.tab));

  return (
    <PageShell width="wide" innerClassName="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5">

          {/* ─── Hero: lời chào + Học tiếp ─────────────────────────────────── */}
          <section
            aria-label="Chào hỏi"
            className={`${CARD} relative md:col-span-8 mt-[60px] md:mt-[64px] bg-hero-amber dark:bg-none dark:bg-[#1E293B] dark:border-[#78350F]/60 px-[18px] pt-5 pb-[18px] md:px-10 md:py-9`}
          >
            <MimiMascot width={150} className="md:hidden absolute right-1.5 -top-[66px]" reaction={streakReaction} />
            <MimiMascot width={210} className="hidden md:block absolute right-8 -top-[70px]" reaction={streakReaction} />
            <div className="relative max-w-[560px]">
              <div className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>Xin chào {firstName}</div>
              <h1 className="mt-1.5 md:mt-2.5 mb-0 text-[1.45rem] md:text-[2.1rem] leading-[1.2] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">
                {isGuest ? "Hôm nay mình ôn gì nhé?" : headline({ isNew, streak, todayStats })}
              </h1>

              {isNew ? (
                <NewLearnerSteps userGrade={userGrade} setActiveTab={setActiveTab} />
              ) : (
                // Một khối duy nhất cho bước tiếp theo (trước đây có thêm nút "Học tiếp" riêng làm cùng việc).
                <button
                  type="button"
                  onClick={goNext}
                  className="group mt-3.5 md:mt-6 w-full flex items-center gap-3 md:gap-4 text-left rounded-[14px] bg-white dark:bg-[#0F172A] border border-[#F1E3BF] dark:border-[#334155] pl-3 md:pl-4 pr-2.5 py-2.5 md:py-3 cursor-pointer transition-colors hover:border-accent"
                >
                  <span className="w-[34px] h-[34px] md:w-10 md:h-10 rounded-[10px] bg-accent-light dark:bg-accent/20 text-[#B45309] dark:text-[#FCD34D] flex items-center justify-center shrink-0">
                    <Sparkles size={17} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[0.7rem] md:text-[0.75rem] text-text-muted dark:text-[#94A3B8]">{step.kicker}</span>
                    <span className="block text-[0.9rem] md:text-base font-semibold text-primary dark:text-[#E2E8F0] truncate">{step.title}</span>
                    <span className="hidden md:block text-[0.75rem] text-text-muted dark:text-[#94A3B8] truncate">{step.sub}</span>
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-[11px] bg-navy-btn dark:bg-accent text-white font-semibold text-[0.85rem] md:text-[0.9rem] px-3 md:px-4 py-2 md:py-2.5 transition-colors group-hover:bg-navy-btn-hover dark:group-hover:bg-accent-hover">
                    Học tiếp <ArrowRight size={15} strokeWidth={2.6} />
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* ─── Chuỗi học 7 ngày + lối vào trang Tiến độ ────── */}
          <section
            aria-label="Chuỗi học"
            onClick={() => { if (requireGoogle()) setActiveTab("progress"); }}
            className={`${CARD} md:col-span-4 md:mt-[64px] p-4 md:p-6 flex flex-col justify-between gap-3 md:gap-4 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className={LABEL}>Chuỗi học</div>
              {isGuest ? <Lock size={15} className="text-text-muted" /> : <Flame size={16} className="text-premium" />}
            </div>
            {isGuest ? (
              <p className="m-0 text-[0.82rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">Đăng nhập Google để lưu chuỗi ngày học và số liệu mỗi ngày.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.5rem] md:text-[3.25rem] font-extrabold tracking-[-0.05em] leading-none bg-[linear-gradient(180deg,#FBBF24,#D97706)] bg-clip-text text-transparent">{streak}</span>
                  <span className="text-[0.8rem] md:text-[0.9rem] font-medium text-text-muted dark:text-[#94A3B8]">{streak ? "ngày liên tiếp" : "ngày — học hôm nay để bắt đầu"}</span>
                </div>
                <div className="flex gap-1 md:gap-1.5" aria-label="7 ngày gần đây">
                  {week.map((d) => (
                    <div key={d.date} className="flex-1 text-center">
                      <div
                        title={d.active ? "Có học" : "Chưa học"}
                        className={`h-[18px] md:h-6 rounded-[5px] md:rounded-[7px] ${
                          d.active ? "bg-[linear-gradient(180deg,#FBBF24,#F59E0B)]"
                            : d.isToday ? "border-[1.5px] border-dashed border-accent" : "bg-[#EEF1F6] dark:bg-[#334155]"
                        }`}
                      />
                      <div className={`mt-1 text-[0.62rem] md:text-[0.68rem] ${d.isToday ? "font-bold text-[#B45309] dark:text-[#FCD34D]" : "text-text-muted dark:text-[#94A3B8]"}`}>{d.label}</div>
                    </div>
                  ))}
                </div>
                {/* Ba số "hôm nay" (công thức xem / flashcard ôn / quiz) đã bỏ — thường bằng 0 và trùng trang Tiến độ (chủ dự án
                    chốt 2026-11-03). Cả thẻ bấm được để mở trang Tiến độ (thay cho thẻ "Xem tiến độ" đứng riêng trước đây). */}
                <span className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-navy-btn dark:text-[#FCD34D]">
                  Xem tiến độ học tập <ChevronRight size={15} />
                </span>
              </>
            )}
          </section>

          {/* ─── "Hôm nay bạn gặp khó khăn gì?" — 4 lối tắt có giải thích rõ chức năng ───── */}
          <section aria-labelledby="dash-intent-title" className="md:col-span-12">
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-0.5 md:gap-3 mb-3">
              <h2 id="dash-intent-title" className="m-0 text-base md:text-lg font-bold tracking-[-0.01em] text-primary dark:text-[#E2E8F0]">Hôm nay bạn gặp khó khăn gì?</h2>
              <span className="text-xs text-text-muted dark:text-[#94A3B8] font-medium">Chọn một việc, mình đưa bạn tới thẳng đúng chỗ</span>
            </div>
            {/* Trợ lý hướng dẫn + Kiểm tra là hai chức năng chính (chủ dự án yêu cầu 2026-11-03): thẻ to, nổi bật, nằm trên
                cùng, giữa hai thẻ có dải giải thích chúng nối với nhau (hỏi bài → AI gợi ý các bước → làm bài cùng dạng, đổi
                số liệu). Thư viện + Flashcard thành hai thẻ gọn ở hàng dưới. */}
            {(() => {
              const card = (tab, featured) => {
                const { icon: Icon, label, tone, bg } = SHORTCUTS.find((x) => x.tab === tab);
                const o = INTENT_OPTIONS.find((x) => x.tab === tab);
                const picked = intent === o.id;
                return (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={picked}
                    // Chọn ở đây cũng tính là lựa chọn hôm nay (cá nhân hóa "Học tiếp"), như chọn trong hộp lúc mở app.
                    onClick={() => { writeLast(user?.googleId, o.id); setActiveTab(tab); }}
                    className={`${CARD} ${bg} dark:bg-none group h-full text-left cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                      featured ? "flex flex-col items-start gap-3 p-5 md:p-6" : "flex items-center gap-3.5 p-4"
                    } ${picked ? "!border-accent" : ""}`}
                  >
                    <span className={`flex items-center gap-2.5 ${featured ? "w-full" : "shrink-0"}`}>
                      <span className={`${featured ? "w-12 h-12" : "w-10 h-10"} rounded-[11px] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.08)] dark:shadow-none ${tone}`}><Icon size={featured ? 22 : 18} /></span>
                      {featured && <span className="text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8]">{label}</span>}
                      {picked && featured && <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-wide text-[#92400E] dark:text-[#FCD34D] bg-accent-light dark:bg-accent/15 rounded-full px-2 py-0.5">Hôm nay</span>}
                    </span>
                    <span className={featured ? "contents" : "flex-1 min-w-0"}>
                      {!featured && <span className="block text-[0.66rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-[#94A3B8]">{label}</span>}
                      <span className={`block font-bold leading-[1.35] text-primary dark:text-[#E2E8F0] ${featured ? "text-[1.1rem] md:text-[1.2rem]" : "text-[0.9rem]"}`}>{o.title}</span>
                      {/* Bỏ tiền tố "Thư viện: " của câu giải thích — tên chức năng đã ghi ngay trên thẻ. */}
                      <span className={`block leading-[1.5] text-text-muted dark:text-[#94A3B8] first-letter:uppercase ${featured ? "text-[0.82rem]" : "text-[0.74rem] line-clamp-2"}`}>{o.what.replace(/^[^:]+:s*/, "")}</span>
                    </span>
                    {featured ? (
                      <span className="mt-auto inline-flex items-center gap-1.5 rounded-[11px] bg-navy-btn dark:bg-accent text-white text-[0.85rem] font-semibold px-4 py-2.5 transition-colors group-hover:bg-navy-btn-hover dark:group-hover:bg-accent-hover">
                        {o.cta} <ChevronRight size={15} />
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-[#CBD5E1] dark:text-[#475569] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                );
              };
              return (
                <>
                  {/* Một khung chung cho hai chức năng chính (sửa 2026-11-03: trước là 2 thẻ + một ô nối rỗng ở giữa, trông rời
                      rạc): dòng 3 bước đánh số ở trên, hai thẻ cạnh nhau bên dưới, nút tròn mũi tên nối giữa hai thẻ. */}
                  <div className="rounded-[20px] border border-line dark:border-[#334155] bg-white/60 dark:bg-[#0F172A]/40 p-3 md:p-4">
                    <ol className="list-none m-0 p-0 mb-3 md:mb-4 flex flex-col md:flex-row md:flex-wrap md:items-center gap-x-2 gap-y-1.5 text-[0.78rem] font-semibold text-primary dark:text-[#E2E8F0]">
                      {["Gửi bài cho Trợ lý hướng dẫn", "AI gợi ý các bước, bạn tự tính", "Làm bài kiểm tra cùng dạng, chỉ đổi số liệu"].map((t, i) => (
                        <li key={t} className="flex items-center gap-2">
                          {i > 0 && <ChevronRight size={14} className="hidden md:block text-[#CBD5E1] dark:text-[#475569] shrink-0" />}
                          <span className="w-5 h-5 rounded-full bg-navy-btn dark:bg-accent text-white text-[0.68rem] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {card("finder", true)}
                      {/* Nút tròn nối hai thẻ: giữa hai cột trên máy tính, giữa hai thẻ xếp dọc trên điện thoại. */}
                      <span aria-hidden="true" className="pointer-events-none absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] border border-line dark:border-[#334155] shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)] flex items-center justify-center text-accent dark:text-[#FCD34D]">
                        <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                      </span>
                      {card("quiz", true)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    {card("library", false)}
                    {card("flashcard", false)}
                  </div>
                </>
              );
            })()}
          </section>

          {/* "Gợi ý hôm nay" và thẻ "Xem tiến độ học tập" đứng riêng đã bỏ (chủ dự án chốt 2026-11-03); lối vào Tiến độ nằm
              ở thẻ Chuỗi học. Tài khoản chưa Premium: dải mỏng mời nâng cấp trải hết bề ngang. */}
          {!isPremium && (
            <section aria-label="Premium" className="md:col-span-12 rounded-[18px] bg-primary dark:bg-[#020617] dark:border dark:border-[#334155] text-white px-5 md:px-6 py-3.5 md:py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="flex justify-between md:justify-start md:flex-col text-[0.8rem] font-semibold gap-2 md:gap-0.5 md:w-[260px] md:shrink-0">
                <span>{isGuest ? "Chế độ khách" : `Còn ${remainingQuizzes}/10 quiz miễn phí hôm nay`}</span>
                <span className="text-[#FBBF24] shrink-0">49.000 đ/tháng</span>
              </div>
              {!isGuest && (
                <div className="h-1.5 rounded-full bg-white/15 md:flex-1">
                  <div className="h-full rounded-full bg-[#FBBF24]" style={{ width: `${Math.max(0, Math.min(100, (remainingQuizzes / 10) * 100))}%` }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("premium")}
                className="bg-transparent border-none p-0 text-white text-[0.92rem] font-bold flex items-center justify-between md:justify-end gap-2 cursor-pointer md:shrink-0"
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
