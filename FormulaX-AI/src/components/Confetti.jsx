import { useEffect, useState } from "react";

const COLORS = ["#D97706", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

// Confetti tự viết bằng CSS/JS thuần (không thêm thư viện ngoài) — bung 1 lần khi `active`
// chuyển từ false sang true, tự dọn sau ~3.2s.
export default function Confetti({ active, count = 50 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) return;
    const newPieces = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 1.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 6,
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(timer);
  }, [active, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute top-[-10px] rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
