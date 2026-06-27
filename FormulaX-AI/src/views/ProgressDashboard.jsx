import React, { useState, useEffect } from "react";
import { ArrowLeft, Flame, ClipboardList, Layers, TrendingUp, AlertTriangle, CheckCircle, BookOpen, Target, BarChart2, Crown, Lock } from "lucide-react";
import { getAnalyticsSummary } from "../lib/supabase";

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgressDashboard({ user, stats, formulas, setActiveTab, onViewDetail, isPremium }) {
  const [topicPerf, setTopicPerf]   = useState([]);
  const [streak, setStreak]         = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user?.googleId) { setLoading(false); return; }
    getAnalyticsSummary(user.googleId)
      .then(({ topicPerformance, streak: s }) => {
        setTopicPerf(topicPerformance);
        setStreak(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.googleId]);

  const hasQuizData = topicPerf.length > 0;

  const totalCorrect   = topicPerf.reduce((s, t) => s + t.correct, 0);
  const totalQuestions = topicPerf.reduce((s, t) => s + t.total, 0);
  const avgRate        = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const weakTopics   = topicPerf.filter(t => t.rate < 60);
  const strongTopics = topicPerf.filter(t => t.rate >= 80);

  // Suggestions: 2 formulas per weak topic, max 6 total
  const suggestions = weakTopics.flatMap(t =>
    formulas.filter(f => f.topic === t.topic).slice(0, 2).map(f => ({ ...f, _weakRate: t.rate }))
  ).slice(0, 6);

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

      {/* Stat cards: 2x2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <StatCard icon={<Flame size={20} />}         value={`${streak} ngày`}              label="Chuỗi học"       color="#F97316" />
        <StatCard icon={<ClipboardList size={20} />}  value={stats.quizzesCompleted}         label="Quiz đã làm"     color="#3B82F6" />
        <StatCard icon={<Layers size={20} />}         value={stats.flashcardsStudied}         label="Thẻ đã ôn"       color="#10B981" />
        <StatCard icon={<TrendingUp size={20} />}     value={hasQuizData ? `${avgRate}%` : "—"} label="Tỷ lệ đúng TB" color="#8B5CF6" />
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
            {/* Blurred placeholder bars for non-premium */}
            {["Giải tích","Đại số","Hình học","Xác suất"].map(t => (
              <div key={t} style={{ marginBottom: "14px", filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ fontSize:"0.82rem", fontWeight:"700" }}>{t}</span>
                  <span style={{ fontSize:"0.78rem", fontWeight:"700" }}>??%</span>
                </div>
                <div style={{ background:"#F1F5F9", borderRadius:"6px", height:"8px" }}>
                  <div style={{ height:"100%", width:`${40 + Math.random()*40}%`, background:"#94A3B8", borderRadius:"6px" }} />
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
          topicPerf.map(t => <TopicBar key={t.topic} {...t} />)
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
            const suggested = formulas.filter(f => f.topic === t.topic).slice(0, 2);
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
