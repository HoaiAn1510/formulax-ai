import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Flame, ClipboardList, Layers, AlertTriangle, CheckCircle, BookOpen, Target, BarChart2, Crown, Lock } from "lucide-react";
import { getAnalyticsSummary, getDailyHistory } from "../lib/supabase";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, sublabel, color }) {
  return (
    <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] py-3.5 px-3 flex flex-col items-center gap-1">
      <div style={{ color }} className="mb-0.5">{icon}</div>
      <div className="text-[1.35rem] font-extrabold text-primary dark:text-[#E2E8F0] leading-[1.2]">{value}</div>
      <div className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] font-semibold text-center">{label}</div>
      {sublabel && <div className="text-[0.62rem] text-[#94A3B8] text-center">{sublabel}</div>}
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
          <span className="text-[0.82rem] font-bold text-primary dark:text-[#E2E8F0]">{topic}</span>
        </div>
        <span className="text-[0.78rem] font-bold" style={{ color: barColor }}>{rate}%</span>
      </div>
      <div className="bg-[#F1F5F9] dark:bg-[#334155] rounded-md h-2 overflow-hidden">
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
      className="inline-flex items-center gap-1.5 bg-accent/7 border border-accent/[0.18] rounded-lg py-1.5 px-2.5 text-xs font-semibold text-primary dark:text-[#E2E8F0] cursor-pointer text-left max-w-full"
    >
      <BookOpen size={12} color="#D97706" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {formula.name}
      </span>
    </button>
  );
}

function formatDateLabel(date) {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (date === today) return "Hôm nay";
  if (date === yesterday) return "Hôm qua";
  const [y, mo, d] = date.split("-");
  return `${d}/${mo}/${y}`;
}

function computeTopicPerf(quizzes) {
  const byTopic = {};
  quizzes.forEach(q => {
    if (!byTopic[q.topic]) byTopic[q.topic] = { correct: 0, total: 0 };
    byTopic[q.topic].correct += q.questionsCorrect;
    byTopic[q.topic].total += q.questionsTotal;
  });
  return Object.entries(byTopic).map(([topic, { correct, total }]) => ({
    topic,
    correct,
    total,
    rate: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
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

function StreakStat({ icon, label, value }) {
  return (
    <div className="flex-1 md:flex-none bg-[#F8FAFC] dark:bg-[#0F172A]/40 border border-[#F1F5F9] dark:border-[#334155] rounded-xl p-3 flex flex-col items-center md:items-start gap-1">
      <div className="flex items-center gap-1.5 text-[#94A3B8] text-[0.62rem] font-bold uppercase tracking-wide">
        {icon} {label}
      </div>
      <div className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0]">{value}</div>
    </div>
  );
}

function DayDetail({ date, quizzes, flashcardIds, formulaMap }) {
  const SHOW_MAX = 4;
  const scoreColor = (p) => p >= 80 ? "#10B981" : p >= 60 ? "#F59E0B" : "#EF4444";
  const hasActivity = quizzes.length > 0 || flashcardIds.length > 0;

  return (
    <div className="border-t border-[#F1F5F9] dark:border-[#334155] mt-4 pt-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span className="font-extrabold text-primary dark:text-[#E2E8F0] text-[0.85rem]">{formatDateLabel(date)}</span>
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
                <div key={i} className={`flex justify-between items-center py-1.5 ${i < quizzes.length - 1 ? "border-b border-[#F8FAFC] dark:border-[#334155]" : ""}`}>
                  <span className="text-[0.8rem] text-primary dark:text-[#E2E8F0] font-semibold">{q.topic}</span>
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

function StreakChart({ activityDates, streak, selectedDate, onSelectDate, selectedDayData, formulaMap }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateSet = new Set(activityDates);

  // Build 4 calendar weeks (Mon–Sun), starting from the Monday 4 weeks ago
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek - 21);

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(startDate);
      dt.setDate(startDate.getDate() + w * 7 + d);
      week.push({ dateStr: dt.toISOString().slice(0, 10), day: dt.getDate() });
    }
    weeks.push(week);
  }

  const longestStreak = getLongestStreak(activityDates);
  const monthPrefix = todayStr.slice(0, 7);
  const daysThisMonth = activityDates.filter(d => d.startsWith(monthPrefix)).length;

  return (
    <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-3.5 h-full">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-1.5">
          <Flame size={16} color="#F97316" />
          <span className="font-extrabold text-primary dark:text-[#E2E8F0] text-[0.88rem]">Chuỗi học</span>
        </div>
        <span className="font-extrabold text-[#F97316] text-[1.1rem]">{streak} ngày</span>
      </div>

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
                    className={`aspect-square rounded flex items-center justify-center text-[0.62rem] md:text-[0.85rem] font-bold ${
                      isFuture ? "bg-transparent" : "cursor-pointer hover:opacity-80"
                    } ${
                      isFuture ? "" : active ? "bg-accent text-white" : "bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8]"
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
              <div className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#475569]" />
              Không học
            </div>
            <div className="flex items-center gap-1 text-[0.62rem] text-[#94A3B8]">
              <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
              Có học
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:flex-col md:gap-3 mt-3 md:mt-0 md:w-40 md:shrink-0">
          <StreakStat icon={<Flame size={12} color="#F97316" />} label="Streak dài nhất" value={`${longestStreak} ngày`} />
          <StreakStat icon={<BarChart2 size={12} color="#D97706" />} label="Đã học tháng này" value={`${daysThisMonth} ngày`} />
        </div>
      </div>

      <DayDetail
        date={selectedDate}
        quizzes={selectedDayData.quizzes}
        flashcardIds={selectedDayData.flashcardIds}
        formulaMap={formulaMap}
      />
    </div>
  );
}

function EmptyState({ message, ctaLabel, onCta }) {
  return (
    <div className="text-center py-7 px-4">
      <BarChart2 size={36} color="#CBD5E1" className="mx-auto mb-2.5" />
      <p className="text-[0.85rem] text-[#94A3B8] font-medium m-0 mb-3">{message}</p>
      {onCta && (
        <button onClick={onCta} className="bg-accent text-white border-none rounded-[10px] py-2 px-[18px] text-[0.8rem] font-bold cursor-pointer">
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

export default function ProgressDashboard({ user, formulas, setActiveTab, onViewDetail, isPremium }) {
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().slice(0, 10));
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

  const dailyHistoryMap = useMemo(() => {
    const m = {};
    dailyHistory.forEach(day => { m[day.date] = { quizzes: day.quizzes, flashcardIds: day.flashcardIds }; });
    return m;
  }, [dailyHistory]);

  const selectedDayData = dailyHistoryMap[selectedDate] || { quizzes: [], flashcardIds: [] };
  const dayTopicPerf = useMemo(() => computeTopicPerf(selectedDayData.quizzes), [selectedDayData]);

  const filteredTopicPerf = dayTopicPerf.filter(t => t.topic !== "Đề thi THPT");
  const hasQuizData = filteredTopicPerf.length > 0;
  const weakTopics   = filteredTopicPerf.filter(t => t.rate < 60);
  const strongTopics = filteredTopicPerf.filter(t => t.rate >= 80);
  const selectedDateLabel = formatDateLabel(selectedDate);

  return (
    <div className="view-container">
      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#F1F5F9] dark:bg-[#334155] border-none cursor-pointer text-primary dark:text-[#E2E8F0]"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="m-0 text-[1.15rem] font-extrabold text-primary dark:text-[#E2E8F0]">
                Tiến độ học tập
              </h1>
              <p className="m-0 text-[0.72rem] text-text-muted dark:text-[#94A3B8]">
                Phân tích từ lịch sử quiz & flashcard
              </p>
            </div>
          </div>

          {/* Premium gate */}
          {!isPremium && (
            <div className="bg-banner-purple rounded-2xl p-5 text-white text-center mb-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
              <Crown size={28} fill="#F59E0B" color="#F59E0B" className="mx-auto mb-2.5" />
              <h3 className="m-0 mb-1.5 text-base font-extrabold">Tính năng Premium</h3>
              <p className="m-0 mb-3.5 text-[0.8rem] opacity-85">
                Phân tích tiến độ chi tiết theo chủ đề, phát hiện điểm yếu và nhận gợi ý ôn tập cá nhân hóa.
              </p>
              <button
                onClick={() => setActiveTab("premium")}
                className="bg-premium text-primary border-none rounded-[10px] py-2.5 px-6 text-[0.85rem] font-extrabold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Crown size={14} fill="#1E3A5F" color="#1E3A5F" />
                Nâng cấp Premium để mở khóa
              </button>
            </div>
          )}

          {/* Stat cards: 2-column row — scoped to the day selected on the calendar below */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <StatCard icon={<ClipboardList size={20} />} value={selectedDayData.quizzes.length}      label="Quiz đã làm" sublabel={selectedDateLabel} color="#3B82F6" />
            <StatCard icon={<Layers size={20} />}        value={selectedDayData.flashcardIds.length} label="Thẻ đã ôn"   sublabel={selectedDateLabel} color="#10B981" />
          </div>

          {/* Streak calendar (left column) + Topic performance & Coach (right column) on wide desktop screens */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-stretch mb-4">
            {/* Streak activity chart — click a day to see what was studied that day */}
            <StreakChart
              activityDates={activityDates}
              streak={streak}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedDayData={selectedDayData}
              formulaMap={formulaMap}
            />

            {/* Topic performance — scoped to the day selected on the calendar above */}
            <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} color="#D97706" />
                <h2 className="m-0 text-[0.92rem] font-extrabold text-primary dark:text-[#E2E8F0]">
                  Hiệu suất theo chủ đề
                </h2>
                <span className="text-[0.7rem] text-[#94A3B8] font-semibold">— {selectedDateLabel}</span>
              </div>

              {loading ? (
                <div className="text-center py-5 text-[#94A3B8] text-[0.82rem]">
                  Đang tải...
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
                      <div className="bg-[#F1F5F9] rounded-md h-2">
                        <div className="h-full rounded-md bg-[#94A3B8]" style={{ width: w }} />
                      </div>
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-[#1E293B]/70">
                    <div className="text-center">
                      <Lock size={22} color="#D97706" className="mx-auto mb-1.5" />
                      <div className="text-[0.8rem] font-bold text-primary dark:text-[#E2E8F0]">Cần Premium để xem</div>
                    </div>
                  </div>
                </>
              ) : hasQuizData ? (
                filteredTopicPerf.map(t => <TopicBar key={t.topic} {...t} />)
              ) : (
                <EmptyState
                  message={`Chưa có quiz nào trong ngày ${selectedDateLabel}. Chọn ngày khác trên lịch hoặc làm quiz ngay!`}
                  ctaLabel="Làm quiz ngay"
                  onCta={() => setActiveTab("quiz")}
                />
              )}
            </div>
          </div>

          {/* AI Coach suggestions — scoped to the same selected day, full width below the grid */}
          <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3.5">
              <Target size={16} color="#10B981" />
              <h2 className="m-0 text-[0.92rem] font-extrabold text-primary dark:text-[#E2E8F0]">
                Coach gợi ý ôn tập
              </h2>
              <span className="text-[0.7rem] text-[#94A3B8] font-semibold">— {selectedDateLabel}</span>
            </div>

            {loading ? (
              <div className="text-center py-4 text-[#94A3B8] text-[0.82rem]">Đang tải...</div>
            ) : !isPremium ? (
              <EmptyState
                message="Nâng cấp Premium để nhận gợi ý ôn tập cá nhân hóa theo điểm yếu của bạn."
                ctaLabel="Nâng cấp Premium"
                onCta={() => setActiveTab("premium")}
              />
            ) : weakTopics.length === 0 && hasQuizData ? (
              <div className="text-center py-3">
                <CheckCircle size={28} color="#10B981" className="mx-auto mb-2 block" />
                <p className="m-0 text-[0.82rem] text-success font-semibold">
                  Tốt lắm! Bạn học đều tất cả chủ đề trong ngày {selectedDateLabel}.
                </p>
              </div>
            ) : weakTopics.length === 0 ? (
              <EmptyState
                message={`Chưa có quiz nào trong ngày ${selectedDateLabel}. Chọn ngày khác trên lịch hoặc làm quiz ngay!`}
                ctaLabel="Bắt đầu quiz"
                onCta={() => setActiveTab("quiz")}
              />
            ) : (
              weakTopics.map(t => {
                const suggested = getFormulasForQuizTopic(t.topic, formulas).slice(0, 2);
                return (
                  <div key={t.topic} className="mb-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={13} color="#F97316" />
                      <span className="text-[0.8rem] font-bold text-primary dark:text-[#E2E8F0]">
                        {t.topic}
                      </span>
                      <span className="text-[0.68rem] font-bold text-white bg-error rounded py-px px-1.5">
                        {t.rate}% đúng
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-[19px]">
                      {suggested.map(f => (
                        <FormulaChip key={f.id} formula={f} onViewDetail={onViewDetail} />
                      ))}
                      {suggested.length === 0 && (
                        <span className="text-xs text-[#94A3B8]">Chưa có công thức cho chủ đề này.</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Strong topics callout */}
          {strongTopics.length > 0 && (
            <div className="bg-success/6 rounded-xl py-3 px-3.5 border border-success/[0.18] mb-4 flex items-start gap-2.5">
              <CheckCircle size={16} color="#10B981" className="mt-px shrink-0" />
              <div>
                <div className="text-[0.8rem] font-bold text-primary dark:text-[#E2E8F0] mb-1">
                  Điểm mạnh của bạn
                </div>
                <div className="text-[0.75rem] text-[#475569] dark:text-[#94A3B8]">
                  {strongTopics.map(t => `${t.topic} (${t.rate}%)`).join(" · ")}
                </div>
              </div>
            </div>
          )}

          {/* CTA: flashcard practice */}
          <div
            onClick={() => setActiveTab("flashcard")}
            className="flex items-center justify-between bg-banner-purple rounded-2xl py-3.5 px-4 cursor-pointer text-white mb-2 shadow-[0_2px_6px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition duration-200"
          >
            <div>
              <div className="text-[0.88rem] font-bold">Ôn tập ngay với Flashcard</div>
              <div className="text-[0.72rem] opacity-75 mt-0.5">
                Tạo bộ thẻ theo chủ đề yếu để cải thiện điểm số
              </div>
            </div>
            <Layers size={22} className="opacity-90 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
