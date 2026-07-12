import { useEffect, useState } from "react";

// Pub-sub kiểu Promise — thay cho window.confirm() trần (không theo giao diện app).
// Gọi await showConfirm("...") từ bất kỳ đâu, resolve true/false theo nút người dùng bấm.
let resolver = null;
let listeners = [];

export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    resolver = resolve;
    listeners.forEach(fn => fn({ message, ...options }));
  });
}

function respond(result) {
  if (resolver) {
    resolver(result);
    resolver = null;
  }
}

export function ConfirmDialogHost() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const handler = (d) => setDialog(d);
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, []);

  if (!dialog) return null;

  const close = (result) => {
    setDialog(null);
    respond(result);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[5000] flex items-center justify-center p-4"
      onClick={() => close(false)}
    >
      <div
        className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] [animation:fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {dialog.title && (
          <h3 className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-1.5">{dialog.title}</h3>
        )}
        <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">{dialog.message}</p>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => close(false)}
            className="flex-1 py-2.5 border-[1.5px] border-[#E2E8F0] dark:border-[#334155] rounded-[10px] bg-white dark:bg-transparent text-[0.875rem] text-text-muted dark:text-[#94A3B8] font-semibold cursor-pointer"
          >
            {dialog.cancelLabel || "Huỷ"}
          </button>
          <button
            onClick={() => close(true)}
            className="flex-1 py-2.5 rounded-[10px] text-[0.875rem] font-bold border-none bg-accent hover:bg-accent-hover text-white cursor-pointer transition-colors duration-200"
          >
            {dialog.confirmLabel || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
