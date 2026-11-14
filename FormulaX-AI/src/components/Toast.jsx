import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// Pub-sub đơn giản dùng module scope — cho phép gọi showToast() từ bất kỳ đâu
// (handler trong App.jsx, view, component con...) mà không cần truyền callback qua props.
//   showToast("Đã lưu")                                  — mặc định "success", 3,2 giây
//   showToast("Lỗi mạng", "error", 5000)                 — cách gọi cũ vẫn chạy
//   showToast("Đã lưu", "success", { title, action: { label, onClick }, duration })
// Mọi thông báo ngắn của app đi qua đây, không tự dựng popup riêng trong từng view.
let listeners = [];
let idCounter = 0;

export function showToast(message, type = "success", opts = 3200) {
  const o = typeof opts === "number" ? { duration: opts } : opts || {};
  const id = ++idCounter;
  const toast = { id, message, type, title: o.title, action: o.action, duration: o.duration ?? (o.action ? 6000 : 3200) };
  listeners.forEach(fn => fn(toast));
}

const ICONS = { success: CheckCircle, error: XCircle, info: Info };
// Thẻ trắng + vạch màu bên trái theo loại — đúng phong cách card phẳng Navy + Amber (docs/UI_STYLE.md).
const TONES = {
  success: { bar: "bg-success", icon: "text-success" },
  error: { bar: "bg-error", icon: "text-error" },
  info: { bar: "bg-accent", icon: "text-accent" },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  useEffect(() => {
    const handler = (toast) => {
      // Tối đa 3 thông báo cùng lúc — bấm nhanh nhiều lần không phủ kín màn hình.
      setToasts(prev => [...prev.slice(-2), toast]);
      setTimeout(() => dismiss(toast.id), toast.duration);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, [dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center pointer-events-none px-4 w-full"
    >
      {toasts.map(t => {
        const Icon = ICONS[t.type] || CheckCircle;
        const tone = TONES[t.type] || TONES.success;
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative overflow-hidden flex items-start gap-2.5 w-full max-w-[400px] py-3 pl-4 pr-2.5 rounded-xl bg-white dark:bg-night-card border border-line dark:border-night-line shadow-[0_8px_24px_rgba(15,23,42,0.14)] [animation:slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${tone.bar}`} />
            <Icon size={18} className={`shrink-0 mt-px ${tone.icon}`} />
            <div className="min-w-0 flex-1">
              {t.title && <div className="text-[0.85rem] font-bold text-primary dark:text-night-text leading-[1.35]">{t.title}</div>}
              <div className={`text-[0.82rem] leading-[1.4] break-words ${t.title ? "text-text-muted dark:text-night-muted mt-0.5" : "font-semibold text-primary dark:text-night-text"}`}>
                {t.message}
              </div>
              {t.action && (
                <button
                  type="button"
                  onClick={() => { t.action.onClick?.(); dismiss(t.id); }}
                  className="mt-1.5 p-0 bg-transparent border-none cursor-pointer text-[0.8rem] font-bold text-accent hover:text-accent-hover"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismiss(t.id)}
              className="shrink-0 w-6 h-6 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-night-line hover:text-text-muted"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
