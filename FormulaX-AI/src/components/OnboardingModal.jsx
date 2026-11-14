import React, { useState } from "react";
import { GraduationCap, Sparkles, ClipboardList, ArrowRight, Check, X } from "lucide-react";
import { USER_MANUAL_URL } from "../config/links";

// `iconBox` / `tryNow`: lớp Tailwind theo màu từng bước (cả light lẫn dark).
const STEPS = [
  {
    id: "grade",
    icon: GraduationCap,
    iconBox: "bg-[#3B82F6]/8 dark:bg-[#3B82F6]/15 text-[#3B82F6] dark:text-[#93C5FD]",
    title: "Bạn đang học lớp mấy?",
    subtitle: "FormulaX sẽ ưu tiên gợi ý công thức phù hợp với lớp của bạn.",
  },
  {
    id: "finder",
    icon: Sparkles,
    iconBox: "bg-success/8 dark:bg-success/15 text-success dark:text-[#6EE7B7]",
    tryNow: "text-success dark:text-[#6EE7B7]",
    title: "Thử Trợ lý hướng dẫn ngay!",
    subtitle: "Gõ bất kỳ câu hỏi toán nào — AI sẽ tìm đúng công thức cho bạn.",
  },
  {
    id: "quiz",
    icon: ClipboardList,
    iconBox: "bg-premium/8 dark:bg-premium/15 text-premium dark:text-[#FCD34D]",
    tryNow: "text-premium dark:text-[#FCD34D]",
    title: "Tạo quiz đầu tiên!",
    subtitle: "Kiểm tra kiến thức với bài trắc nghiệm hoặc điền khuyết. Mỗi ngày có 10 lượt miễn phí.",
  },
];

const QUIZ_TYPES = [
  { label: "Trắc nghiệm", cls: "bg-[#3B82F6]/6 border-[#3B82F6]/20 text-[#3B82F6] dark:text-[#93C5FD]" },
  { label: "Điền khuyết", cls: "bg-success/6 border-success/20 text-success dark:text-[#6EE7B7]" },
  { label: "Kết hợp", cls: "bg-premium/6 border-premium/20 text-premium dark:text-[#FCD34D]" },
];

export default function OnboardingModal({ onFinish, onGoToFinder, onGoToQuiz }) {
  const [step, setStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const ctaDisabled = step === 0 && !selectedGrade;

  const handleAction = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onFinish(selectedGrade);
    }
  };

  const handleSkip = () => onFinish(selectedGrade);

  // Bước Finder/Quiz có nút "Thử ngay" riêng — kết thúc onboarding rồi điều hướng thẳng
  // tới tính năng đó, thay vì chỉ đóng modal (trước đây onGoToFinder/onGoToQuiz được
  // truyền vào nhưng không nơi nào gọi tới, nút không có tác dụng).
  const handleTryNow = (goTo) => {
    onFinish(selectedGrade);
    goTo?.();
  };

  const hasTryNow = current.id === "finder" || current.id === "quiz";

  return (
    <div role="dialog" aria-modal="true" aria-label="Làm quen với FormulaX" className="fixed inset-0 z-[9999] bg-[rgba(15,23,42,0.65)] backdrop-blur-[6px] flex items-center justify-center p-4">
      <div className="relative w-full max-w-[420px] rounded-[20px] bg-white dark:bg-[#1E293B] dark:border dark:border-[#334155] px-7 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        {/* Skip */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-1 flex items-center gap-1 text-[0.75rem] font-semibold text-[#94A3B8] hover:text-text-muted dark:hover:text-[#CBD5E1]"
        >
          Bỏ qua <X size={14} />
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-[#E2E8F0] dark:bg-[#334155]"}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${current.iconBox}`}>
          <Icon size={26} />
        </div>

        {/* Title + subtitle */}
        <h2 className="text-[1.25rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0] mb-2">
          {current.title}
        </h2>
        <p className={`text-[0.85rem] leading-[1.55] text-text-muted dark:text-[#94A3B8] ${hasTryNow ? "mb-3" : "mb-6"}`}>
          {current.subtitle}
        </p>

        {hasTryNow && (
          <button
            onClick={() => handleTryNow(current.id === "finder" ? onGoToFinder : onGoToQuiz)}
            className={`bg-transparent border-none cursor-pointer p-0 mb-6 flex items-center gap-1 text-[0.8rem] font-bold hover:underline ${current.tryNow}`}
          >
            Thử ngay <ArrowRight size={13} />
          </button>
        )}

        {/* Step 1 — grade selector */}
        {step === 0 && (
          <div className="flex gap-2.5 mb-6">
            {[10, 11, 12].map((g) => {
              const active = selectedGrade === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`relative flex-1 py-3.5 px-2 rounded-xl cursor-pointer border-2 text-[1.05rem] font-extrabold transition-all duration-150 ${
                    active
                      ? "border-accent bg-accent/6 dark:bg-accent/15 text-accent"
                      : "border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-text-muted dark:text-[#94A3B8] hover:border-accent/40"
                  }`}
                >
                  Lớp {g}
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                      <Check size={9} color="white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3 — quiz types */}
        {step === 2 && (
          <div className="flex gap-2 mb-6">
            {QUIZ_TYPES.map((t) => (
              <div key={t.label} className={`flex-1 py-2 px-1 rounded-lg text-center border text-[0.72rem] font-bold ${t.cls}`}>
                {t.label}
              </div>
            ))}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={handleAction}
          disabled={ctaDisabled}
          className={`w-full p-[13px] rounded-xl border-none text-[0.9rem] font-extrabold flex items-center justify-center gap-2 transition-colors duration-200 ${
            ctaDisabled
              ? "bg-[#E2E8F0] dark:bg-[#334155] text-[#94A3B8] dark:text-[#64748B] cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover text-white cursor-pointer"
          }`}
        >
          {step < STEPS.length - 1 ? "Tiếp theo" : "Bắt đầu học!"}
          <ArrowRight size={16} />
        </button>

        {/* Bước cuối: link phụ tới hướng dẫn PDF (tab mới) — không đổi luồng các nút */}
        {isLast && (
          <a
            href={USER_MANUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2.5 text-center text-accent text-[0.78rem] font-semibold underline"
          >
            Xem hướng dẫn chi tiết
          </a>
        )}

        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full mt-2.5 p-[9px] bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-text-muted dark:hover:text-[#CBD5E1] text-[0.8rem] font-semibold"
          >
            ← Quay lại
          </button>
        )}
      </div>
    </div>
  );
}
