import React, { useState, useEffect, useMemo } from "react";
import { Flame, ClipboardList, Layers, AlertTriangle, CheckCircle, BookOpen, Target, BarChart2, Crown, Lock, Award, LogIn, ChevronRight, X } from "lucide-react";
import { getAnalyticsSummary, getDailyHistory } from "../lib/supabase";
import { useGuestGate } from "../utils/useGuestGate";
import CountUp from "../components/CountUp";
import { showToast } from "../components/Toast";
import { BADGES } from "../data/badges";
import { vietnamToday, shiftDay } from "../utils/vietnamDate";
import PageShell from "../components/PageShell";
import { CARD, LABEL, BTN_PRIMARY, BTN_SECONDARY } from "../utils/shellStyle";
import MimiMascot from "../components/MimiMascot";
import { RANGES, daysInScope, summarize, studiedDaysLast7, badgeProgress } from "../utils/progressStats";

const BADGE_ICONS = { Flame, ClipboardList, Layers, BookOpen };

// Đầu mỗi thẻ: ô biểu tượng màu nhạt + nhãn chữ in hoa nhỏ (cùng kiểu Dashboard/Flashcard) + phần phụ bên phải.
function SectionHeader({ icon: Icon, tone, title, aside }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${tone}`}><Icon size={16} /></span>
      <h2 className={`${LABEL} m-0 flex-1 min-w-0 truncate`}>{title}</h2>
      {aside}
    </div>
  );
}

const TONE = {
  amber: "bg-accent-light text-accent dark:bg-accent/15 dark:text-[#FCD34D]",
  blue: "bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]",
  green: "bg-[#DCFCE7] text-[#059669] dark:bg-[#059669]/20 dark:text-[#6EE7B7]",
  orange: "bg-[#FFEDD5] text-[#EA580C] dark:bg-[#EA580C]/20 dark:text-[#FDBA74]",
  purple: "bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]",
};

const DayTag = ({ children }) => (
  <span className="text-[0.7rem] font-semibold text-text-muted dark:text-night-muted bg-page dark:bg-night-page border border-line dark:border-night-line rounded-full py-0.5 px-2 shrink-0">{children}</span>
);

function BadgeTile({ b }) {
  const Icon = BADGE_ICONS[b.icon] || Flame;
  return (
    <div
      title={b.description}
      className={`flex flex-col items-center gap-1.5 rounded-[12px] p-3 border ${
        b.unlocked ? "border-[#F1E3BF] dark:border-accent/30 bg-hero-amber dark:bg-none dark:bg-accent/10" : "border-line dark:border-night-line bg-page dark:bg-night-page opacity-60"
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
        b.unlocked ? "bg-accent text-white" : "bg-[#F1F5F9] dark:bg-night-line text-[#94A3B8]"
      }`}>
        <Icon size={16} />
      </div>
      <span className="text-[0.68rem] font-semibold text-center text-primary dark:text-night-text leading-tight">{b.label}</span>
    </div>
  );
}

// Huy hiệu gọn (2026-11-02): các huy hiệu đã mở + MỐC KẾ TIẾP của từng loại kèm thanh tiến độ ("còn 3 bài nữa");
// nút "Xem tất cả" mở lưới đủ 15 huy hiệu như trước.
function BadgesSection({ state, showAll, onToggle }) {
  const { all, unlocked, next } = state;
  const UNIT = { streak: "ngày", quizzes: "bài", flashcards: "lượt", formulas: "công thức" };
  return (
    <div className={`${CARD} p-4 md:p-6 mb-4 md:mb-5`}>
      <SectionHeader icon={Award} tone={TONE.amber} title="Huy hiệu" aside={<DayTag>{unlocked.length}/{all.length} đã mở</DayTag>} />
      {showAll ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 md:gap-3">
          {all.map((b) => <BadgeTile key={b.id} b={b} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {unlocked.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unlocked.map((b) => {
                const Icon = BADGE_ICONS[b.icon] || Flame;
                return (
                  <span key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-[#F1E3BF] dark:border-accent/30 bg-hero-amber dark:bg-none dark:bg-accent/10 py-1 pl-1 pr-3 text-[0.75rem] font-semibold text-primary dark:text-night-text">
                    <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center"><Icon size={13} /></span>
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}
          {next.length > 0 && (
            <div>
              <div className="text-[0.72rem] font-semibold text-text-muted dark:text-night-muted mb-2">Mốc kế tiếp</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
                {next.map((b) => {
                  const Icon = BADGE_ICONS[b.icon] || Flame;
                  const pct = Math.min(100, Math.round((b.value / b.threshold) * 100));
                  return (
                    <div key={b.id} className="rounded-[12px] border border-line dark:border-night-line bg-page dark:bg-night-page p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#F1F5F9] dark:bg-night-line text-[#94A3B8] flex items-center justify-center shrink-0"><Icon size={14} /></span>
                        <span className="text-[0.8rem] font-semibold text-primary dark:text-night-text truncate">{b.label}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#EEF1F6] dark:bg-night-line overflow-hidden">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#F59E0B,#FBBF24)]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 text-[0.7rem] text-text-muted dark:text-night-muted">
                        {b.value}/{b.threshold} · còn {b.threshold - b.value} {UNIT[b.metric] || ""} nữa
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <button type="button" onClick={onToggle} className="mt-3.5 bg-transparent border-none p-0 text-[0.78rem] font-semibold text-navy-btn dark:text-[#FCD34D] cursor-pointer">
        {showAll ? "Thu gọn" : `Xem tất cả ${all.length} huy hiệu`}
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Ô số liệu cùng kiểu trang Flashcard: ô biểu tượng, số lớn, nhãn.
function StatCard({ icon: Icon, tone, value, suffix = "", label, sublabel }) {
  return (
    <div className={`${CARD} p-4 md:p-5 flex flex-col gap-3`}>
      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${tone}`}><Icon size={17} /></span>
      <div>
        <div className="text-[1.5rem] md:text-[1.75rem] font-bold tracking-[-0.02em] leading-none text-primary dark:text-night-text"><CountUp value={value} />{suffix}</div>
        <div className="mt-1.5 text-[0.78rem] text-text-muted dark:text-night-muted">
          {label}{sublabel && <span className="text-[#94A3B8]"> · {sublabel}</span>}
        </div>
      </div>
    </div>
  );
}

function TopicBar({ topic, rate, correct, total }) {
  const isWeak   = rate < 60;
  const isStrong = rate >= 80;
  const barColor = isWeak ? "#EF4444" : isStrong ? "#10B981" : "#F59E0B";

  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          {isWeak && <AlertTriangle size={13} color="#EF4444" />}
          {isStrong && <CheckCircle size={13} color="#10B981" />}
          <span className="text-[0.82rem] font-bold text-primary dark:text-night-text">{topic}</span>
        </div>
        <span className="text-[0.78rem] font-bold" style={{ color: barColor }}>{rate}%</span>
      </div>
      <div className="bg-[#F1F5F9] dark:bg-night-line rounded-md h-2 overflow-hidden">
        <div className="h-full rounded-md transition-[width] duration-[0.8s] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]" style={{ width: `${rate}%`, background: barColor }} />
      </div>
      <div className="text-[0.68rem] text-[#94A3B8] mt-1">
        {correct}/{total} câu đúng
      </div>
    </div>
  );
}

function FormulaChip({ formula, onViewDetail }) {
  return (
    <button
      onClick={() => onViewDetail(formula)}
      className="inline-flex items-center gap-1.5 bg-accent/7 border border-accent/[0.18] rounded-lg py-1.5 px-2.5 text-xs font-semibold text-primary dark:text-night-text cursor-pointer text-left max-w-full"
    >
      <BookOpen size={12} color="#D97706" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {formula.name}
      </span>
    </button>
  );
}

function formatDateLabel(date) {
  const today     = vietnamToday();
  const yesterday = shiftDay(today, -1);
  if (date === today) return "Hôm nay";
  if (date === yesterday) return "Hôm qua";
  const [y, mo, d] = date.split("-");
  return `${d}/${mo}/${y}`;
}

function getLongestStreak(activityDates) {
  if (!activityDates.length) return 0;
  const sorted = [...new Set(activityDates)].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000);
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function StreakStat({ icon, label, value, unit }) {
  return (
    <div className="flex-1 md:flex-none bg-page dark:bg-night-page border border-line dark:border-night-line rounded-[12px] p-3 flex flex-col items-center md:items-start gap-1">
      <div className="flex items-center gap-1.5 text-[#94A3B8] text-[0.62rem] font-bold uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="text-[1.05rem] font-extrabold text-primary dark:text-night-text"><CountUp value={value} /> {unit}</div>
    </div>
  );
}

function DayDetail({ date, quizzes, flashcardIds, formulaMap }) {
  const SHOW_MAX = 4;
  const scoreColor = (p) => p >= 80 ? "#10B981" : p >= 60 ? "#F59E0B" : "#EF4444";
  const hasActivity = quizzes.length > 0 || flashcardIds.length > 0;

  return (
    <div className="border-t border-line dark:border-night-line mt-4 pt-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span className="font-extrabold text-primary dark:text-night-text text-[0.85rem]">{formatDateLabel(date)}</span>
        {quizzes.length > 0 && <span className="text-[0.68rem] bg-[#EFF6FF] dark:bg-secondary/15 text-secondary font-bold rounded py-0.5 px-1.5">{quizzes.length} quiz</span>}
        {flashcardIds.length > 0 && <span className="text-[0.68rem] bg-[#F0FDF4] dark:bg-success/15 text-success font-bold rounded py-0.5 px-1.5">{flashcardIds.length} thẻ</span>}
      </div>

      {!hasActivity ? (
        <p className="text-[0.78rem] text-[#94A3B8] m-0">Không có hoạt động học tập trong ngày này.</p>
      ) : (
        <>
          {quizzes.length > 0 && (
            <div style={{ marginBottom: flashcardIds.length > 0 ? "10px" : 0 }}>
              <div className="text-[0.68rem] font-bold text-[#94A3B8] mb-1.5 uppercase tracking-[0.06em]">Quiz</div>
              {quizzes.map((q, i) => (
                <div key={i} className={`flex justify-between items-center py-1.5 ${i < quizzes.length - 1 ? "border-b border-[#F8FAFC] dark:border-night-line" : ""}`}>
                  <span className="text-[0.8rem] text-primary dark:text-night-text font-semibold">{q.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.72rem] text-[#94A3B8]">{q.questionsCorrect}/{q.questionsTotal} câu</span>
                    <span className="text-[0.75rem] font-extrabold min-w-[38px] text-right" style={{ color: scoreColor(q.scorePercent) }}>{q.scorePercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {flashcardIds.length > 0 && (
            <div>
              <div className="text-[0.68rem] font-bold text-[#94A3B8] mb-1.5 uppercase tracking-[0.06em]">Flashcard</div>
              {flashcardIds.slice(0, SHOW_MAX).map(id => (
                <div key={id} className="flex items-center gap-1.5 py-0.5">
                  <BookOpen size={11} color="#10B981" className="shrink-0" />
                  <span className="text-[0.78rem] text-[#475569]">{formulaMap[id]?.name || id}</span>
                </div>
              ))}
              {flashcardIds.length > SHOW_MAX && (
                <div className="text-[0.72rem] text-[#94A3B8] font-semibold mt-1 pl-[17px]">
                  +{flashcardIds.length - SHOW_MAX} công thức khác
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StreakChart({ activityDates, selectedDate, detailDate, onSelectDate, selectedDayData, formulaMap }) {
  const todayStr = vietnamToday();
  const dateSet = new Set(activityDates);

  // Build 4 calendar weeks (Mon–Sun), starting from the Monday 4 weeks ago. Tính hoàn toàn trên
  // chuỗi ngày giờ Việt Nam: trước đây dựng từ giờ máy rồi đổi toISOString() (UTC), nên từ 0h tới
  // 7h sáng mọi ô lịch bị lệch một ngày so với activityDates.
  const dayOfWeek = (new Date(`${todayStr}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const startDay = shiftDay(todayStr, -dayOfWeek - 21);

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = shiftDay(startDay, w * 7 + d);
      week.push({ dateStr, day: Number(dateStr.slice(8, 10)) });
    }
    weeks.push(week);
  }

  const longestStreak = getLongestStreak(activityDates);
  const monthPrefix = todayStr.slice(0, 7);
  const daysThisMonth = activityDates.filter(d => d.startsWith(monthPrefix)).length;

  return (
    <div className={`${CARD} p-4 md:p-6 h-full`}>
      {/* Số ngày liên tiếp đã có ở ô số liệu đầu trang — đầu thẻ chỉ còn tên. */}
      <SectionHeader icon={Flame} tone={TONE.orange} title="Chuỗi học" />

      <div className="md:flex md:gap-5 md:items-start">
        <div className="md:flex-1 md:max-w-[520px]">
          <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1">
            {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
              <div key={d} className="text-center text-[0.62rem] md:text-[0.72rem] text-[#94A3B8] font-bold">{d}</div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1">
              {week.map(({ dateStr, day }) => {
                const active = dateSet.has(dateStr);
                const isSelected = dateStr === selectedDate;
                const isFuture = dateStr > todayStr;
                return (
                  <div
                    key={dateStr}
                    title={dateStr}
                    onClick={() => !isFuture && onSelectDate(dateStr)}
                    className={`aspect-square rounded-[7px] flex items-center justify-center text-[0.62rem] md:text-[0.8rem] font-semibold ${
                      isFuture ? "bg-transparent" : "cursor-pointer hover:opacity-80"
                    } ${
                      isFuture ? "" : active ? "bg-[linear-gradient(180deg,#FBBF24,#F59E0B)] text-white" : "bg-[#EEF1F6] dark:bg-night-line text-[#94A3B8]"
                    }`}
                    style={{ border: isSelected ? "2px solid #D97706" : "1.5px solid transparent" }}
                  >
                    {!isFuture ? day : ""}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex gap-3 mt-2 justify-end">
            <div className="flex items-center gap-1 text-[0.62rem] text-[#94A3B8]">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] dark:bg-night-line border border-[#E2E8F0] dark:border-[#475569]" />
              Không học
            </div>
            <div className="flex items-center gap-1 text-[0.62rem] text-[#94A3B8]">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
              Có học
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:flex-col md:gap-3 mt-3 md:mt-0 md:w-40 md:shrink-0">
          <StreakStat icon={<Flame size={12} color="#F97316" />} label="Streak dài nhất" value={longestStreak} unit="ngày" />
          <StreakStat icon={<BarChart2 size={12} color="#D97706" />} label="Đã học tháng này" value={daysThisMonth} unit="ngày" />
        </div>
      </div>

      {/* Chi tiết ngày chỉ hiện khi đã bấm một ngày — trước đây luôn hiện "Hôm nay", thẻ dài hơn hẳn các thẻ khác. */}
      {selectedDate && <DayDetail
        date={detailDate}
        quizzes={selectedDayData.quizzes}
        flashcardIds={selectedDayData.flashcardIds}
        formulaMap={formulaMap}
      />}
    </div>
  );
}

// Trạng thái trống: Mimi nhỏ (mặc định ngạc nhiên) + câu ngắn + nút — thay cho biểu tượng cột xám (2026-11-02).
function EmptyState({ message, ctaLabel, onCta, mood = "surprised" }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-4 px-2">
      <MimiMascot width={96} expression={mood} withSymbols={false} />
      <p className="text-[0.84rem] text-text-muted dark:text-night-muted font-medium m-0">{message}</p>
      {onCta && (
        <button type="button" onClick={onCta} className={`${BTN_PRIMARY} !py-2.5 !text-[0.85rem] mt-1`}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

// Maps quiz_results topic → formula topic(s). Returns null for "show all formulas".
const QUIZ_TOPIC_MAP = {
  "Đề thi THPT": null,
  "Tổng hợp":    null,
};

function getFormulasForQuizTopic(quizTopic, formulas) {
  if (Object.prototype.hasOwnProperty.call(QUIZ_TOPIC_MAP, quizTopic)) {
    const mapped = QUIZ_TOPIC_MAP[quizTopic];
    return mapped === null ? formulas : formulas.filter(f => f.topic === mapped);
  }
  return formulas.filter(f => f.topic === quizTopic);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgressDashboard({ user, formulas, setActiveTab, onViewDetail, isPremium, stats, onPracticeTopic, onCreateTopicDeck }) {
  // Toàn bộ trang là tiến độ cá nhân → khóa với khách: vẫn hiện bố cục (làm mờ, không bấm
  // được) để khách thấy tính năng tồn tại, kèm nút đăng nhập ở đầu trang.
  const { isGuest, loginNow } = useGuestGate();
  const today = vietnamToday();
  // Phạm vi xem (2026-11-02): mặc định 30 ngày; bấm một ngày trên lịch thì chỉ xem ngày đó (bỏ chọn để quay lại).
  // Trước đây mặc định chỉ "Hôm nay" nên Hiệu suất / Coach thường trống.
  const [rangeId, setRangeId] = useState("30");
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [streak, setStreak]               = useState(0);
  const [activityDates, setActivityDates] = useState([]);
  const [dailyHistory, setDailyHistory]   = useState([]);
  const [loading, setLoading]             = useState(true);

  const formulaMap = useMemo(() => {
    const m = {};
    formulas.forEach(f => { m[f.id] = f; });
    return m;
  }, [formulas]);

  useEffect(() => {
    if (!user?.googleId) { setLoading(false); return; }
    Promise.all([
      getAnalyticsSummary(user.googleId),
      getDailyHistory(user.googleId),
    ])
      .then(([{ streak: s, activityDates: dates }, history]) => {
        setStreak(s);
        setActivityDates(dates || []);
        setDailyHistory(history || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.googleId]);

  const badgeState = useMemo(() => badgeProgress(BADGES, {
    streak,
    quizzes: stats?.quizzesCompleted ?? 0,
    flashcards: stats?.flashcardsStudied ?? 0,
    formulas: stats?.formulasViewed ?? 0,
  }), [streak, stats]);
  const badges = badgeState.all;

  // Toast "vừa mở khóa huy hiệu" — chỉ báo khi phát hiện huy hiệu MỚI so với lần trước
  // (localStorage). Lần đầu chạy tính năng này (chưa có key), âm thầm chốt trạng thái hiện
  // tại làm mốc thay vì spam toast cho user đã có streak/stats từ trước.
  useEffect(() => {
    if (!user?.googleId || loading) return;
    const unlockedIds = badges.filter(b => b.unlocked).map(b => b.id);
    const key = `formulax_badges_seen_${user.googleId}`;
    const seenRaw = localStorage.getItem(key);
    if (seenRaw === null) {
      localStorage.setItem(key, JSON.stringify(unlockedIds));
      return;
    }
    let seen = [];
    try { seen = JSON.parse(seenRaw); } catch { seen = []; }
    const newlyUnlocked = unlockedIds.filter(id => !seen.includes(id));
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((id, i) => {
        const badge = BADGES.find(b => b.id === id);
        if (badge) setTimeout(() => showToast(`Đã mở khóa: ${badge.label}`, "success"), i * 400);
      });
      localStorage.setItem(key, JSON.stringify(unlockedIds));
    }
  }, [user?.googleId, loading, badges]);

  const scopeDays = useMemo(() => daysInScope(dailyHistory, { rangeId, day: selectedDay, today }), [dailyHistory, rangeId, selectedDay, today]);
  const summary = useMemo(() => summarize(scopeDays), [scopeDays]);
  const detailDate = selectedDay || today;
  const detailDayData = dailyHistory.find((d) => d.date === detailDate) || { quizzes: [], flashcardIds: [] };
  const rangeLabel = RANGES.find((r) => r.id === rangeId)?.label || "30 ngày";
  const scopeLabel = selectedDay ? formatDateLabel(selectedDay) : rangeId === "all" ? "Toàn bộ" : `${rangeLabel} qua`;
  const hasQuizData = summary.topics.length > 0;
  const weakTopics = summary.topics.filter(t => t.rate < 60);
  const strongTopics = summary.topics.filter(t => t.rate >= 80);
  const days7 = studiedDaysLast7(activityDates, today);

  // Câu tóm tắt + biểu cảm của Mimi theo độ chính xác trong phạm vi đang xem.
  const headlineText = summary.quizCount === 0
    ? (selectedDay ? `Chưa có bài kiểm tra nào trong ngày ${formatDateLabel(selectedDay).toLowerCase()}.` : "Chưa có bài kiểm tra nào trong khoảng này. Làm thử một bài nhé!")
    : `Bạn đã làm ${summary.quizCount} bài, đúng ${summary.accuracy}% câu hỏi.`;
  const mimiExpr = summary.accuracy == null ? "wink" : summary.accuracy >= 80 ? "star" : summary.accuracy >= 50 ? "happy" : "surprised";
  const mimiReaction = loading || isGuest ? null : { expr: mimiExpr, at: `${rangeId}|${selectedDay}|${summary.accuracy}` };
  const scopeTag = (
    <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-text-muted dark:text-night-muted bg-page dark:bg-night-page border border-line dark:border-night-line rounded-full py-0.5 pl-2 pr-2 shrink-0">
      {scopeLabel}
      {selectedDay && (
        <button type="button" aria-label="Bỏ chọn ngày" onClick={() => setSelectedDay(null)} className="bg-transparent border-none p-0 cursor-pointer text-[#94A3B8] hover:text-primary dark:hover:text-night-text flex"><X size={12} /></button>
      )}
    </span>
  );

  return (
    <PageShell width="wide" title="Tiến độ học tập" description="Phân tích từ lịch sử kiểm tra và flashcard. Bấm một ngày trên lịch để xem riêng ngày đó." onBack={() => setActiveTab("dashboard")}>

          {/* Guest gate — khách chưa có tài khoản nên mời đăng nhập, không mời mua Premium */}
          {isGuest && (
            <div className="bg-primary dark:bg-[#020617] dark:border dark:border-night-line rounded-[18px] p-5 md:p-7 text-white text-center mb-5 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.6)]">
              <Lock size={26} color="#F59E0B" className="mx-auto mb-2.5" />
              <h3 className="m-0 mb-1.5 text-base font-extrabold">Đăng nhập Google để xem tiến độ học tập</h3>
              <p className="m-0 mb-3.5 text-[0.8rem] opacity-85">
                Chế độ khách không lưu kết quả quiz, flashcard hay chuỗi ngày học nên chưa có gì để phân tích.
              </p>
              <button
                onClick={loginNow}
                className="bg-accent hover:bg-accent-hover text-white border-none rounded-[10px] py-2.5 px-6 text-[0.85rem] font-extrabold cursor-pointer inline-flex items-center gap-1.5 transition-colors duration-200"
              >
                <LogIn size={14} />
                Đăng nhập Google
              </button>
            </div>
          )}

          {/* Premium gate */}
          {!isGuest && !isPremium && (
            <div className="bg-primary dark:bg-[#020617] dark:border dark:border-night-line rounded-[18px] p-5 md:p-7 text-white text-center mb-5 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.6)]">
              <Crown size={28} fill="#F59E0B" color="#F59E0B" className="mx-auto mb-2.5" />
              <h3 className="m-0 mb-1.5 text-base font-extrabold">Tính năng Premium</h3>
              <p className="m-0 mb-3.5 text-[0.8rem] opacity-85">
                Phân tích tiến độ chi tiết theo chủ đề, phát hiện điểm yếu và nhận gợi ý ôn tập cá nhân hóa.
              </p>
              <button
                onClick={() => setActiveTab("premium")}
                className="bg-premium hover:bg-accent text-primary border-none rounded-[10px] py-2.5 px-6 text-[0.85rem] font-extrabold cursor-pointer transition-colors duration-200 inline-flex items-center gap-1.5"
              >
                <Crown size={14} fill="#1E3A5F" color="#1E3A5F" />
                Nâng cấp Premium để mở khóa
              </button>
            </div>
          )}

          <div className={isGuest ? "blur-[3px] pointer-events-none select-none opacity-70" : undefined} inert={isGuest}>
          {/* Khung tóm tắt (giống khung lời chào Dashboard): câu tóm tắt + chọn phạm vi, Mimi phản ứng theo độ chính xác. */}
          <section className={`${CARD} relative mt-[56px] md:mt-[64px] mb-4 md:mb-5 bg-hero-amber dark:bg-none dark:bg-night-card dark:border-[#78350F]/60 p-5 md:px-8 md:py-7`}>
            <MimiMascot width={130} className="md:hidden absolute right-2 -top-[62px]" reaction={mimiReaction} />
            <MimiMascot width={190} className="hidden md:block absolute right-8 -top-[72px]" reaction={mimiReaction} />
            <div className={`${LABEL} !text-[#B45309] dark:!text-[#FCD34D]`}>{scopeLabel}</div>
            <h2 className="m-0 mt-1.5 max-w-[640px] text-[1.25rem] md:text-[1.6rem] leading-[1.25] font-bold tracking-[-0.02em] text-primary dark:text-night-text">
              {loading ? "Đang tải tiến độ của bạn…" : headlineText}
            </h2>
            <p className="m-0 mt-1.5 text-[0.85rem] text-text-muted dark:text-night-muted">Tuần này bạn học {days7}/7 ngày{streak > 0 ? ` · chuỗi ${streak} ngày liên tiếp` : ""}.</p>
            <div role="tablist" aria-label="Khoảng thời gian" className="mt-4 inline-flex gap-1 p-1 rounded-[12px] border border-[#F1E3BF] dark:border-night-line bg-white/70 dark:bg-night-page">
              {RANGES.map((r) => {
                const on = !selectedDay && rangeId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => { setRangeId(r.id); setSelectedDay(null); }}
                    className={`border-none rounded-[9px] px-3.5 py-1.5 text-[0.8rem] font-semibold cursor-pointer transition-colors ${on ? "bg-navy-btn dark:bg-accent text-white" : "bg-transparent text-text-muted dark:text-night-muted hover:text-primary dark:hover:text-night-text"}`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Ô số liệu theo phạm vi đang xem. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5">
            <StatCard icon={ClipboardList} tone={TONE.blue}   value={summary.quizCount}     label="Bài kiểm tra" sublabel={scopeLabel} />
            <StatCard icon={Target}        tone={TONE.green}  value={summary.accuracy ?? 0} suffix={summary.accuracy == null ? "" : "%"} label={summary.accuracy == null ? "Câu đúng (chưa có bài)" : "Câu đúng"} sublabel={scopeLabel} />
            <StatCard icon={Layers}        tone={TONE.purple} value={summary.cardsReviewed} label="Lượt ôn flashcard" sublabel={scopeLabel} />
            <StatCard icon={Flame}         tone={TONE.orange} value={streak}                label="Ngày học liên tiếp" />
          </div>

          {/* Bố cục (sửa 2026-11-02 sau khi xem bản deploy): hàng 1 = Hiệu suất (rộng) + Chuỗi học, cao bằng nhau;
              hàng 2 = Coach trải hết bề ngang. Trước đây 3 thẻ một hàng canh trên, thẻ lịch dài hơn hẳn → hở lớn. */}
          <div className="flex flex-col gap-4 md:gap-5 lg:grid lg:grid-cols-12 lg:items-stretch mb-4 md:mb-5">
            {/* Lịch: bấm một ngày để xem riêng ngày đó (bấm lại ngày đang chọn thì bỏ chọn) */}
            <div className="lg:col-span-5 lg:order-2">
            <StreakChart
              activityDates={activityDates}
              selectedDate={selectedDay}
              detailDate={detailDate}
              onSelectDate={(d) => setSelectedDay((cur) => (cur === d ? null : d))}
              selectedDayData={detailDayData}
              formulaMap={formulaMap}
            />
            </div>

            {/* Hiệu suất theo chủ đề — theo phạm vi đang xem */}
            <div className={`${CARD} lg:col-span-7 lg:order-1 p-4 md:p-6 relative overflow-hidden`}>
              <SectionHeader icon={BarChart2} tone={TONE.blue} title="Hiệu suất theo chủ đề" aside={scopeTag} />

              {loading ? (
                <div className="animate-pulse">
                  {[85, 65, 45].map((w, i) => (
                    <div key={i} className="mb-3.5">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="h-3 w-24 bg-[#F1F5F9] dark:bg-night-line rounded" />
                        <div className="h-3 w-7 bg-[#F1F5F9] dark:bg-night-line rounded" />
                      </div>
                      <div className="bg-[#F1F5F9] dark:bg-night-line rounded-md h-2" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              ) : !isPremium ? (
                <>
                  {/* Blurred placeholder bars for non-premium — fixed widths to avoid re-render flicker */}
                  {[["Giải tích","72%"],["Đại số","45%"],["Hình học","61%"],["Lượng giác","55%"],["Xác suất & Thống kê","38%"],["Mở rộng","30%"]].map(([t, w]) => (
                    <div key={t} className="mb-3.5 blur-[4px] pointer-events-none select-none">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[0.82rem] font-bold">{t}</span>
                        <span className="text-[0.78rem] font-bold">??%</span>
                      </div>
                      <div className="bg-[#F1F5F9] dark:bg-night-line rounded-md h-2">
                        <div className="h-full rounded-md bg-[#94A3B8]" style={{ width: w }} />
                      </div>
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-night-card/70">
                    <div className="text-center">
                      <Lock size={22} color="#D97706" className="mx-auto mb-1.5" />
                      <div className="text-[0.8rem] font-bold text-primary dark:text-night-text">Cần Premium để xem</div>
                    </div>
                  </div>
                </>
              ) : hasQuizData ? (
                summary.topics.map(t => <TopicBar key={t.topic} {...t} />)
              ) : (
                <EmptyState
                  message={selectedDay ? "Ngày này chưa có bài kiểm tra." : "Chưa có bài kiểm tra nào trong khoảng này."}
                  ctaLabel="Làm bài kiểm tra"
                  onCta={() => setActiveTab("quiz")}
                />
              )}
            </div>

            {/* Coach gợi ý ôn tập — chủ đề dưới 60%: công thức nên xem lại + nút luyện ngay / tạo bộ thẻ */}
            <div className={`${CARD} lg:col-span-12 lg:order-3 p-4 md:p-6`}>
              <SectionHeader icon={Target} tone={TONE.green} title="Coach gợi ý ôn tập" aside={scopeTag} />

              {loading ? (
                <div className="animate-pulse flex flex-col gap-3.5">
                  {[0, 1].map(i => (
                    <div key={i}>
                      <div className="h-3 w-24 bg-[#F1F5F9] dark:bg-night-line rounded mb-2" />
                      <div className="flex gap-2">
                        <div className="h-7 w-36 bg-[#F1F5F9] dark:bg-night-line rounded-lg" />
                        <div className="h-7 w-32 bg-[#F1F5F9] dark:bg-night-line rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isPremium ? (
                <EmptyState
                  message="Nâng cấp Premium để nhận gợi ý ôn tập theo điểm yếu của bạn."
                  ctaLabel="Nâng cấp Premium"
                  onCta={() => setActiveTab("premium")}
                />
              ) : weakTopics.length === 0 && hasQuizData ? (
                <EmptyState mood="star" message="Tốt lắm! Không có chủ đề nào dưới 60% trong khoảng này." />
              ) : weakTopics.length === 0 ? (
                <EmptyState
                  message="Làm vài bài kiểm tra để Coach biết bạn cần ôn chủ đề nào."
                  ctaLabel="Làm bài kiểm tra"
                  onCta={() => setActiveTab("quiz")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {weakTopics.map(t => {
                    const suggested = getFormulasForQuizTopic(t.topic, formulas).slice(0, 2);
                    return (
                      <div key={t.topic} className="rounded-[12px] border border-line dark:border-night-line bg-page dark:bg-night-page p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle size={13} color="#F97316" />
                          <span className="text-[0.85rem] font-bold text-primary dark:text-night-text">{t.topic}</span>
                          <span className="ml-auto text-[0.68rem] font-bold text-white bg-error rounded py-px px-1.5">{t.rate}% đúng</span>
                        </div>
                        {suggested.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {suggested.map(f => (
                              <FormulaChip key={f.id} formula={f} onViewDetail={onViewDetail} />
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {onPracticeTopic && (
                            <button type="button" onClick={() => onPracticeTopic(t.topic)} className={`${BTN_PRIMARY} !py-2 !px-3.5 !text-[0.78rem]`}>
                              <ClipboardList size={14} /> Luyện chủ đề này
                            </button>
                          )}
                          {onCreateTopicDeck && (
                            <button type="button" onClick={() => onCreateTopicDeck(t.topic)} className={`${BTN_SECONDARY} !py-2 !px-3.5 !text-[0.78rem]`}>
                              <Layers size={14} /> Tạo bộ flashcard
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Huy hiệu — gọn: đã mở + mốc kế tiếp của từng loại (có thanh tiến độ); bấm để xem đủ 15 */}
          <BadgesSection state={badgeState} showAll={showAllBadges} onToggle={() => setShowAllBadges((v) => !v)} />

          {/* Strong topics callout */}
          {strongTopics.length > 0 && (
            <div className="bg-success/6 rounded-xl py-3 px-3.5 border border-success/[0.18] mb-4 flex items-start gap-2.5">
              <CheckCircle size={16} color="#10B981" className="mt-px shrink-0" />
              <div>
                <div className="text-[0.8rem] font-bold text-primary dark:text-night-text mb-1">
                  Điểm mạnh của bạn
                </div>
                <div className="text-[0.75rem] text-[#475569] dark:text-night-muted">
                  {strongTopics.map(t => `${t.topic} (${t.rate}%)`).join(" · ")}
                </div>
              </div>
            </div>
          )}

          {/* CTA: flashcard practice */}
          <button
            type="button"
            onClick={() => setActiveTab("flashcard")}
            className={`${CARD} w-full flex items-center gap-4 text-left py-4 px-4 md:px-6 cursor-pointer mb-2 transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <span className="w-11 h-11 rounded-xl bg-primary dark:bg-night-page text-[#FBBF24] flex items-center justify-center shrink-0"><Layers size={19} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[0.92rem] font-bold text-primary dark:text-night-text">Ôn tập ngay với Flashcard</span>
              <span className="block text-[0.75rem] text-text-muted dark:text-night-muted mt-0.5">Tạo bộ thẻ theo chủ đề yếu để cải thiện điểm số</span>
            </span>
            <ChevronRight size={18} className="text-[#CBD5E1] dark:text-[#475569] shrink-0" />
          </button>
          </div>
        </PageShell>
  );
}
