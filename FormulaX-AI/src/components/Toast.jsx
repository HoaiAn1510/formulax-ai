import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

// Pub-sub đơn giản dùng module scope — cho phép gọi showToast() từ bất kỳ đâu
// (handler trong App.jsx, view, component con...) mà không cần truyền callback qua props.
let listeners = [];
let idCounter = 0;

export function showToast(message, type = "success", duration = 3200) {
  const id = ++idCounter;
  listeners.forEach(fn => fn({ id, message, type, duration }));
}

const ICONS = { success: CheckCircle, error: XCircle, info: Info };
const STYLES = {
  success: "bg-success text-white",
  error: "bg-error text-white",
  info: "bg-primary text-white",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, []);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center pointer-events-none px-4 w-full">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || CheckCircle;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 py-2.5 px-4 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.18)] text-[0.85rem] font-semibold leading-[1.4] max-w-[420px] [animation:slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] ${STYLES[t.type] || STYLES.success}`}
          >
            <Icon size={16} className="shrink-0 mt-px" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
