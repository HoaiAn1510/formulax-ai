import React, { useState } from "react";
import { GraduationCap, Sparkles, ClipboardList, ArrowRight, Check, X } from "lucide-react";

const STEPS = [
  {
    id: "grade",
    icon: GraduationCap,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    title: "Bạn đang học lớp mấy?",
    subtitle: "FormulaX sẽ ưu tiên gợi ý công thức phù hợp với lớp của bạn.",
  },
  {
    id: "finder",
    icon: Sparkles,
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    title: "Thử Finder AI ngay!",
    subtitle: "Gõ bất kỳ câu hỏi toán nào — AI sẽ tìm đúng công thức cho bạn.",
  },
  {
    id: "quiz",
    icon: ClipboardList,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    title: "Tạo quiz đầu tiên!",
    subtitle: "Kiểm tra kiến thức với bài trắc nghiệm hoặc điền khuyết. Mỗi ngày có 10 lượt miễn phí.",
  },
];

export default function OnboardingModal({ onFinish, onGoToFinder, onGoToQuiz }) {
  const [step, setStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleAction = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onFinish(selectedGrade);
    }
  };

  const handleSkip = () => onFinish(selectedGrade);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "white", borderRadius: "20px", width: "100%", maxWidth: "420px",
        padding: "32px 28px", position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
      }}>
        {/* Skip */}
        <button onClick={handleSkip} style={{
          position: "absolute", top: "16px", right: "16px",
          background: "none", border: "none", cursor: "pointer",
          color: "#94A3B8", padding: "4px", display: "flex", alignItems: "center", gap: "4px",
          fontSize: "0.75rem", fontWeight: "600",
        }}>
          Bỏ qua <X size={14} />
        </button>

        {/* Step dots */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: "4px", flex: 1, borderRadius: "2px",
              background: i <= step ? "#3B82F6" : "#E2E8F0",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px",
          background: current.bg, display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: "16px",
        }}>
          <Icon size={26} color={current.color} />
        </div>

        {/* Title + subtitle */}
        <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1E3A5F", marginBottom: "8px" }}>
          {current.title}
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: "1.55", marginBottom: "24px" }}>
          {current.subtitle}
        </p>

        {/* Step 1 — grade selector */}
        {step === 0 && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            {[10, 11, 12].map((g) => (
              <button key={g} onClick={() => setSelectedGrade(g)} style={{
                flex: 1, padding: "14px 8px", borderRadius: "12px", cursor: "pointer",
                border: `2px solid ${selectedGrade === g ? "#3B82F6" : "#E2E8F0"}`,
                background: selectedGrade === g ? "rgba(59,130,246,0.06)" : "white",
                fontWeight: "800", fontSize: "1.05rem",
                color: selectedGrade === g ? "#3B82F6" : "#64748B",
                transition: "all 0.15s",
                position: "relative",
              }}>
                Lớp {g}
                {selectedGrade === g && (
                  <span style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "14px", height: "14px", borderRadius: "50%",
                    background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={9} color="white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}


        {/* Step 3 — quiz types */}
        {step === 2 && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {["Trắc nghiệm", "Điền khuyết", "Kết hợp"].map((t, i) => (
              <div key={i} style={{
                flex: 1, padding: "8px 4px", borderRadius: "8px", textAlign: "center",
                background: ["rgba(59,130,246,0.06)", "rgba(16,185,129,0.06)", "rgba(245,158,11,0.06)"][i],
                border: `1px solid ${["rgba(59,130,246,0.2)", "rgba(16,185,129,0.2)", "rgba(245,158,11,0.2)"][i]}`,
                fontSize: "0.72rem", fontWeight: "700",
                color: ["#3B82F6", "#10B981", "#F59E0B"][i],
              }}>{t}</div>
            ))}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={handleAction}
          disabled={step === 0 && !selectedGrade}
          style={{
            width: "100%", padding: "13px", borderRadius: "12px", border: "none",
            cursor: step === 0 && !selectedGrade ? "not-allowed" : "pointer",
            background: step === 0 && !selectedGrade
              ? "#E2E8F0"
              : "linear-gradient(135deg, #1E3A5F 0%, #3B82F6 100%)",
            color: step === 0 && !selectedGrade ? "#94A3B8" : "white",
            fontWeight: "800", fontSize: "0.9rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s",
          }}
        >
          {step < STEPS.length - 1 ? "Tiếp theo" : "Bắt đầu học!"}
          <ArrowRight size={16} />
        </button>

        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            width: "100%", marginTop: "10px", padding: "9px",
            background: "none", border: "none", cursor: "pointer",
            color: "#94A3B8", fontSize: "0.8rem", fontWeight: "600",
          }}>
            ← Quay lại
          </button>
        )}
      </div>
    </div>
  );
}
