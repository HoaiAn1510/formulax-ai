import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Xem ảnh đề toàn màn hình để đối chiếu từng con số. Phóng to bằng 2 ngón tay (điện thoại), lăn
 * chuột hoặc nút +/− (máy tính), chạm đúp để phóng/thu; kéo 1 ngón để di chuyển khi đã phóng to.
 * Tự xử lý cử chỉ (touch-action: none) thay vì để trình duyệt phóng cả trang — phóng cả trang trên
 * iPhone làm lệch các thành phần position: fixed của app.
 */
export default function ImageZoomViewer({ src, onClose }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const boxRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Toạ độ so với tâm khung (transform-origin của ảnh là tâm).
  const rel = (p) => {
    const r = boxRef.current.getBoundingClientRect();
    return { x: p.x - (r.left + r.width / 2), y: p.y - (r.top + r.height / 2) };
  };

  // Phóng quanh một điểm cố định trên màn hình (điểm giữa 2 ngón / vị trí chuột).
  const zoomAround = (base, nextScale, at) => {
    const s = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (s === MIN_SCALE) return { scale: 1, x: 0, y: 0 };
    const k = s / base.scale;
    return { scale: s, x: at.x - (at.x - base.x) * k, y: at.y - (at.y - base.y) * k };
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = { type: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y), mid: rel({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), base: view };
    } else if (pts.length === 1) {
      gesture.current = { type: "pan", start: pts[0], base: view };
    } else {
      gesture.current = null;
    }
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1 && e.pointerType !== "mouse") {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : zoomAround(v, 2.5, rel({ x: e.clientX, y: e.clientY }))));
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
    }
    startGesture();
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = rel({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const zoomed = zoomAround(g.base, g.base.scale * (dist / g.dist), g.mid);
      // Hai ngón cùng di chuyển thì kéo ảnh theo.
      setView(zoomed.scale === 1 ? zoomed : { ...zoomed, x: zoomed.x + (mid.x - g.mid.x), y: zoomed.y + (mid.y - g.mid.y) });
    } else if (g.type === "pan" && g.base.scale > 1) {
      setView({ ...g.base, x: g.base.x + (e.clientX - g.start.x), y: g.base.y + (e.clientY - g.start.y) });
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    startGesture(); // 2 ngón → còn 1 ngón: chuyển sang kéo từ vị trí hiện tại
  };

  const onWheel = (e) => {
    const at = rel({ x: e.clientX, y: e.clientY });
    setView((v) => zoomAround(v, v.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), at));
  };

  const step = (factor) => setView((v) => zoomAround(v, v.scale * factor, { x: 0, y: 0 }));

  const btn = "w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white border-none cursor-pointer flex items-center justify-center";

  return (
    <div role="dialog" aria-modal="true" aria-label="Ảnh đề bài" className="fixed inset-0 z-[1100] bg-[#020617] flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
        <span className="text-[0.78rem] font-semibold text-white/80">Chụm 2 ngón hoặc bấm + để phóng to</span>
        <button type="button" aria-label="Đóng ảnh" onClick={onClose} className={btn}>
          <X size={18} />
        </button>
      </div>
      <div
        ref={boxRef}
        className="relative flex-1 overflow-hidden touch-none select-none flex items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          src={src}
          alt="Ảnh đề bài đã gửi"
          draggable={false}
          className="max-w-full max-h-full object-contain will-change-transform"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        />
      </div>
      <div className="flex items-center justify-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" aria-label="Thu nhỏ" onClick={() => step(1 / 1.5)} className={btn}><ZoomOut size={18} /></button>
        <span className="text-white/80 text-[0.78rem] font-bold w-12 text-center">{Math.round(view.scale * 100)}%</span>
        <button type="button" aria-label="Phóng to" onClick={() => step(1.5)} className={btn}><ZoomIn size={18} /></button>
        <button type="button" aria-label="Về cỡ ban đầu" onClick={() => setView({ scale: 1, x: 0, y: 0 })} className={btn}><RotateCcw size={16} /></button>
      </div>
    </div>
  );
}
