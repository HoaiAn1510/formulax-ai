import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Flame, ClipboardList, Layers, AlertTriangle, CheckCircle, BookOpen, Target, BarChart2, Crown, Lock, ChevronDown } from "lucide-react";
import { getAnalyticsSummary, getDailyHistory } from "../lib/supabase";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "14px",
      padding: "14px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      border: "1px solid #E2E8F0",
      boxShadow: "0 2px 8px rgba(30,58,95,0.05)",
    }}>
      <div style={{ color, marginBottom: "2px" }}>{icon}</div>
      <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#1E3A5F", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: "600", textAlign: "center" }}>{label}</div>
    </div>
  );
}

function TopicBar({ topic, rate, correct, total }) {
  const isWeak   = rate < 60;
  const isStrong = rate >= 80;
  const barColor = isWeak ? "#EF4444" : isStrong ? "#10B981" : "#F59E0B";
  const bgColor  = isWeak ? "rgba(239,68,68,0.08)" : isStrong ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)";

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isWeak && <AlertTriangle size={13} color="#EF4444" />}
          {isStrong && <CheckCircle size={13} color="#10B981" />}
          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1E3A5F" }}>{topic}</span>
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: "700", color: barColor }}>{rate}%</span>
      </div>
      <div style={{ background: "#F1F5F9", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${rate}%`,
          background: barColor,
          borderRadius: "6px",
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "3px" }}>
        {correct}/{total} câu đúng
      </div>
    </div>
  );
}

function FormulaChip({ formula, onViewDetail }) {
  return (
    <button
      onClick={() => onViewDetail(formula)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(59,130,246,0.07)",
        border: "1px solid rgba(59,130,246,0.18)",
        borderRadius: "8px",
        padding: "6px 10px",
        fontSize: "0.75rem",
        fontWeight: "600",
        color: "#1E3A5F",
        cursor: "pointer",
        textAlign: "left",
        maxWidth: "100%",
      }}
    >
      <BookOpen size={12} color="#3B82F6" />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {formula.name}
      </span>
    </button>
  );
}

function StreakChart({ activityDates, streak }) {
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

  return (
    <div style={{ background: "white", borderRadius: "14px", padding: "14px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(30,58,95,0.05)", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Flame size={16} color="#F97316" />
          <span style={{ fontWeight: "800", color: "#1E3A5F", fontSize: "0.88rem" }}>Chuỗi học</span>
        </div>
        <span style={{ fontWeight: "800", color: "#F97316", fontSize: "1.1rem" }}>{streak} ngày</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
        {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.58rem", color: "#94A3B8", fontWeight: "700" }}>{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
          {week.map(({ dateStr, day }) => {
            const active = dateSet.has(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            return (
              <div
                key={dateStr}
                title={dateStr}
                style={{
                  aspectRatio: "1",
                  borderRadius: "4px",
                  backgroundColor: isFuture ? "transparent" : active ? "#3B82F6" : "#F1F5F9",
                  border: isToday ? "2px solid #3B82F6" : "1.5px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.5rem", color: active ? "white" : "#94A3B8", fontWeight: "700",
                }}
              >
                {!isFuture ? day : ""}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "#94A3B8" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#F1F5F9", border: "1px solid #E2E8F0" }} />
          Không học
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "#94A3B8" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#3B82F6" }} />
          Có học
        </div>
      </div>
    </div>
  );
}

function DayHistoryCard({ date, quizzes, flashcardIds, formulaMap }) {
  const [expanded, setExpanded] = useState(true);
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const [y, mo, d] = date.split("-");
  const dateLabel = date === today ? "Hôm nay" : date === yesterday ? "Hôm qua" : `${d}/${mo}/${y}`;
  const SHOW_MAX = 4;

  const scoreColor = (p) => p >= 80 ? "#10B981" : p >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: "10px", boxShadow: "0 2px 8px rgba(30,58,95,0.04)" }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
          <span style={{ fontWeight: "800", color: "#1E3A5F", fontSize: "0.88rem" }}>{dateLabel}</span>
          {date !== today && date !== yesterday && (
            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{d}/{mo}/{y}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {quizzes.length > 0 && <span style={{ fontSize: "0.68rem", background: "#EFF6FF", color: "#3B82F6", fontWeight: "700", borderRadius: "5px", padding: "2px 7px" }}>{quizzes.length} quiz</span>}
          {flashcardIds.length > 0 && <span style={{ fontSize: "0.68rem", background: "#F0FDF4", color: "#10B981", fontWeight: "700", borderRadius: "5px", padding: "2px 7px" }}>{flashcardIds.length} thẻ</span>}
          <ChevronDown size={14} color="#94A3B8" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "10px 14px" }}>
          {quizzes.length > 0 && (
            <div style={{ marginBottom: flashcardIds.length > 0 ? "10px" : 0 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94A3B8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quiz</div>
              {quizzes.map((q, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < quizzes.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <span style={{ fontSize: "0.8rem", color: "#1E3A5F", fontWeight: "600" }}>{q.topic}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{q.questionsCorrect}/{q.questionsTotal} câu</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: scoreColor(q.scorePercent), minWidth: "38px", textAlign: "right" }}>{q.scorePercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {flashcardIds.length > 0 && (
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#94A3B8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flashcard</div>
              {flashcardIds.slice(0, SHOW_MAX).map(id => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0" }}>
                  <BookOpen size={11} color="#10B981" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem", color: "#475569" }}>{formulaMap[id]?.name || id}</span>
                </div>
              ))}
              {flashcardIds.length > SHOW_MAX && (
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: "600", marginTop: "4px", paddingLeft: "17px" }}>
                  +{flashcardIds.length - SHOW_MAX} công thức khác
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, ctaLabel, onCta }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 16px" }}>
      <BarChart2 size={36} color="#CBD5E1" style={{ margin: "0 auto 10px" }} />
      <p style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: "500", margin: "0 0 12px" }}>{message}</p>
      {onCta && (
        <button onClick={onCta} style={{
          background: "#3B82F6", color: "white", border: "none", borderRadius: "10px",
          padding: "8px 18px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer",
        }}>
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

export default function ProgressDashboard({ user, stats, formulas, setActiveTab, onViewDetail, isPremium }) {
  const [topicPerf, setTopicPerf]         = useState([]);
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
      .then(([{ topicPerformance, streak: s, activityDates: dates }, history]) => {
        setTopicPerf(topicPerformance);
        setStreak(s);
        setActivityDates(dates || []);
        setDailyHistory(history || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.googleId]);

  const filteredTopicPerf = topicPerf.filter(t => t.topic !== "Đề thi THPT");
  const hasQuizData = filteredTopicPerf.length > 0;
  const weakTopics   = filteredTopicPerf.filter(t => t.rate < 60);
  const strongTopics = filteredTopicPerf.filter(t => t.rate >= 80);

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "34px", height: "34px", borderRadius: "10px",
            background: "#F1F5F9", border: "none", cursor: "pointer", color: "#1E3A5F",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#1E3A5F" }}>
            Tiến độ học tập
          </h1>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B" }}>
            Phân tích từ lịch sử quiz & flashcard
          </p>
        </div>
      </div>

      {/* Premium gate */}
      {!isPremium && (
        <div style={{
          background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
          borderRadius: "16px", padding: "20px", color: "white",
          textAlign: "center", marginBottom: "20px",
        }}>
          <Crown size={28} fill="#F59E0B" color="#F59E0B" style={{ margin: "0 auto 10px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: "800" }}>Tính năng Premium</h3>
          <p style={{ margin: "0 0 14px", fontSize: "0.8rem", opacity: 0.85 }}>
            Phân tích tiến độ chi tiết theo chủ đề, phát hiện điểm yếu và nhận gợi ý ôn tập cá nhân hóa.
          </p>
          <button
            onClick={() => setActiveTab("premium")}
            style={{
              background: "#F59E0B", color: "#1E3A5F", border: "none",
              borderRadius: "10px", padding: "10px 24px",
              fontSize: "0.85rem", fontWeight: "800", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}
          >
            <Crown size={14} fill="#1E3A5F" color="#1E3A5F" />
            Nâng cấp Premium để mở khóa
          </button>
        </div>
      )}

      {/* Stat cards: 2-column row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <StatCard icon={<ClipboardList size={20} />} value={stats.quizzesCompleted}  label="Quiz đã làm" color="#3B82F6" />
        <StatCard icon={<Layers size={20} />}        value={stats.flashcardsStudied} label="Thẻ đã ôn"   color="#10B981" />
      </div>

      {/* Streak activity chart */}
      <StreakChart activityDates={activityDates} streak={streak} />

      {/* Daily history */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <BarChart2 size={15} color="#3B82F6" />
          <h2 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "800", color: "#1E3A5F" }}>Lịch sử hoạt động</h2>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#94A3B8", fontSize: "0.82rem" }}>Đang tải...</div>
        ) : dailyHistory.length === 0 ? (
          <EmptyState
            message="Chưa có hoạt động nào. Làm quiz hoặc ôn flashcard để bắt đầu!"
            ctaLabel="Bắt đầu quiz"
            onCta={() => setActiveTab("quiz")}
          />
        ) : (
          dailyHistory.map(day => (
            <DayHistoryCard
              key={day.date}
              date={day.date}
              quizzes={day.quizzes}
              flashcardIds={day.flashcardIds}
              formulaMap={formulaMap}
            />
          ))
        )}
      </div>

      {/* Topic performance */}
      <div style={{
        background: "white", borderRadius: "16px", padding: "16px",
        border: "1px solid #E2E8F0", marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(30,58,95,0.05)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <BarChart2 size={16} color="#3B82F6" />
          <h2 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "800", color: "#1E3A5F" }}>
            Hiệu suất theo chủ đề
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#94A3B8", fontSize: "0.82rem" }}>
            Đang tải...
          </div>
        ) : !isPremium ? (
          <>
            {/* Blurred placeholder bars for non-premium — fixed widths to avoid re-render flicker */}
            {[["Giải tích","72%"],["Đại số","45%"],["Hình học","61%"],["Lượng giác","55%"],["Xác suất & Thống kê","38%"],["Mở rộng","30%"]].map(([t, w]) => (
              <div key={t} style={{ marginBottom: "14px", filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ fontSize:"0.82rem", fontWeight:"700" }}>{t}</span>
                  <span style={{ fontSize:"0.78rem", fontWeight:"700" }}>??%</span>
                </div>
                <div style={{ background:"#F1F5F9", borderRadius:"6px", height:"8px" }}>
                  <div style={{ height:"100%", width: w, background:"#94A3B8", borderRadius:"6px" }} />
                </div>
              </div>
            ))}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.6)" }}>
              <div style={{ textAlign:"center" }}>
                <Lock size={22} color="#3B82F6" style={{ margin:"0 auto 6px" }} />
                <div style={{ fontSize:"0.8rem", fontWeight:"700", color:"#1E3A5F" }}>Cần Premium để xem</div>
              </div>
            </div>
          </>
        ) : hasQuizData ? (
          filteredTopicPerf.map(t => <TopicBar key={t.topic} {...t} />)
        ) : (
          <EmptyState
            message="Chưa có dữ liệu quiz. Làm ít nhất 1 bài quiz để xem phân tích!"
            ctaLabel="Làm quiz ngay"
            onCta={() => setActiveTab("quiz")}
          />
        )}
      </div>

      {/* AI Coach suggestions */}
      <div style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
        borderRadius: "16px", padding: "16px",
        border: "1px solid rgba(59,130,246,0.15)", marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(30,58,95,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Target size={16} color="#10B981" />
          <h2 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "800", color: "#1E3A5F" }}>
            Coach gợi ý ôn tập
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "16px", color: "#94A3B8", fontSize: "0.82rem" }}>Đang tải...</div>
        ) : !isPremium ? (
          <EmptyState
            message="Nâng cấp Premium để nhận gợi ý ôn tập cá nhân hóa theo điểm yếu của bạn."
            ctaLabel="Nâng cấp Premium"
            onCta={() => setActiveTab("premium")}
          />
        ) : weakTopics.length === 0 && hasQuizData ? (
          <div style={{ textAlign: "center", padding: "12px" }}>
            <CheckCircle size={28} color="#10B981" style={{ margin: "0 auto 8px", display: "block" }} />
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#10B981", fontWeight: "600" }}>
              Tốt lắm! Bạn đang học đều tất cả chủ đề.
            </p>
          </div>
        ) : weakTopics.length === 0 ? (
          <EmptyState
            message="Làm quiz để nhận gợi ý ôn tập phù hợp với điểm yếu của bạn."
            ctaLabel="Bắt đầu quiz"
            onCta={() => setActiveTab("quiz")}
          />
        ) : (
          weakTopics.map(t => {
            const suggested = getFormulasForQuizTopic(t.topic, formulas).slice(0, 2);
            return (
              <div key={t.topic} style={{ marginBottom: "14px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  marginBottom: "8px",
                }}>
                  <AlertTriangle size={13} color="#F97316" />
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1E3A5F" }}>
                    {t.topic}
                  </span>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: "700", color: "white",
                    background: "#EF4444", borderRadius: "5px", padding: "1px 6px",
                  }}>
                    {t.rate}% đúng
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "19px" }}>
                  {suggested.map(f => (
                    <FormulaChip key={f.id} formula={f} onViewDetail={onViewDetail} />
                  ))}
                  {suggested.length === 0 && (
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Chưa có công thức cho chủ đề này.</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Strong topics callout */}
      {strongTopics.length > 0 && (
        <div style={{
          background: "rgba(16,185,129,0.06)", borderRadius: "12px", padding: "12px 14px",
          border: "1px solid rgba(16,185,129,0.18)", marginBottom: "16px",
          display: "flex", alignItems: "flex-start", gap: "10px",
        }}>
          <CheckCircle size={16} color="#10B981" style={{ marginTop: "1px", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1E3A5F", marginBottom: "3px" }}>
              Điểm mạnh của bạn
            </div>
            <div style={{ fontSize: "0.75rem", color: "#475569" }}>
              {strongTopics.map(t => `${t.topic} (${t.rate}%)`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* CTA: flashcard practice */}
      <div
        onClick={() => setActiveTab("flashcard")}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
          borderRadius: "14px", padding: "14px 16px", cursor: "pointer",
          color: "white", marginBottom: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: "700" }}>Ôn tập ngay với Flashcard</div>
          <div style={{ fontSize: "0.72rem", opacity: 0.75, marginTop: "2px" }}>
            Tạo bộ thẻ theo chủ đề yếu để cải thiện điểm số
          </div>
        </div>
        <Layers size={22} style={{ opacity: 0.9, flexShrink: 0 }} />
      </div>
    </div>
  );
}
