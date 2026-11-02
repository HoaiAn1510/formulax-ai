import { useEffect, useId, useRef, useState } from "react";

// Linh vật Mimi — mèo vàng đeo kính tròn, chữ π trên trán, ngậm bút chì (mockup Dashboard đã duyệt 2026-11-01).
// Hiệu ứng ở index.css (.mimi-*), tự tắt khi bật "giảm chuyển động".
//   crown: đội vương miện vàng giữa hai tai (trang Premium).
//   interactive (mặc định bật, chủ dự án yêu cầu 2026-11-02): bấm vào thì Mimi nảy nhẹ, đổi ngẫu nhiên một biểu cảm
//   (nhả bút ra để thấy miệng) và tỏa ra vài ký hiệu toán học; sau RESET_MS thì về vẻ mặt thường.

const EXPRESSIONS = ["happy", "wink", "surprised", "love", "star", "dizzy"];
const BURST_SYMBOLS = ["π", "∑", "√", "∫", "∞", "Δ", "θ", "x²", "÷", "≠", "α", "%"];
const BURST_COLORS = ["#D97706", "#B45309", "#2563EB", "#7C3AED", "#E11D48", "#059669"];
const RESET_MS = 3000;
const BURST_MS = 1100;

// Hình trái tim / ngôi sao nhỏ đặt giữa mắt kính (toạ độ trong nhóm translate(29 30)).
const HEART = "M0 5 C-9 -2 -5 -10 0 -5 C5 -10 9 -2 0 5Z";
const STAR = "M0 -8 L2.4 -2.5 L8 -2.5 L3.5 1 L5 7 L0 3.6 L-5 7 L-3.5 1 L-8 -2.5 L-2.4 -2.5Z";

function Eyes({ expr }) {
  const ink = { stroke: "#0F172A", strokeWidth: 3.5, fill: "none", strokeLinecap: "round" };
  const pupil = (cx) => (
    <>
      <ellipse cx={cx} cy="81" rx="6.5" ry="9" fill="#0F172A" />
      <circle cx={cx + 2.5} cy="77" r="2.6" fill="#fff" />
    </>
  );
  switch (expr) {
    case "happy":
      return <><path d="M52 85 Q60 74 68 85" {...ink} /><path d="M104 85 Q112 74 120 85" {...ink} /></>;
    case "wink":
      return <>{pupil(60)}<path d="M104 82 Q112 88 120 82" {...ink} /></>;
    case "surprised":
      return (
        <>
          <circle cx="60" cy="81" r="5" fill="#0F172A" /><circle cx="112" cy="81" r="5" fill="#0F172A" />
          <circle cx="61.5" cy="79" r="1.6" fill="#fff" /><circle cx="113.5" cy="79" r="1.6" fill="#fff" />
        </>
      );
    case "love":
      return <><path d={HEART} transform="translate(60 81) scale(1.5)" fill="#E11D48" /><path d={HEART} transform="translate(112 81) scale(1.5)" fill="#E11D48" /></>;
    case "star":
      return (
        <>
          <path d={STAR} transform="translate(60 81) scale(1.3)" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <path d={STAR} transform="translate(112 81) scale(1.3)" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        </>
      );
    case "dizzy":
      return <><path d="M53 74 L67 88 M67 74 L53 88" {...ink} /><path d="M105 74 L119 88 M119 74 L105 88" {...ink} /></>;
    default:
      return <g className="mimi-blink">{pupil(60)}{pupil(112)}</g>;
  }
}

function Mouth({ expr }) {
  const line = { stroke: "#7C2D12", strokeWidth: 2.4, fill: "none", strokeLinecap: "round" };
  switch (expr) {
    case "happy":
    case "star":
      return <path d="M77 104 Q86 116 95 104Z" fill="#7C2D12" />;
    case "surprised":
      return <ellipse cx="86" cy="109" rx="4.5" ry="5.5" fill="#7C2D12" />;
    case "dizzy":
      return <path d="M77 109 Q81 105 86 109 Q91 113 95 109" {...line} />;
    default: // wink, love
      return <path d="M78 105 Q86 112 94 105" {...line} />;
  }
}

export default function MimiMascot({ width = 230, className = "", withSymbols = true, crown = false, interactive = true }) {
  const gid = useId().replace(/:/g, "");
  const [expr, setExpr] = useState(null); // null = vẻ mặt thường (ngậm bút)
  const [pop, setPop] = useState(0); // đổi key để chạy lại hiệu ứng nảy
  const [bursts, setBursts] = useState([]);
  const timers = useRef([]);
  const resetTimer = useRef(null);
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(resetTimer.current); }, []);

  const react = (e) => {
    e.stopPropagation();
    const choices = EXPRESSIONS.filter((x) => x !== expr);
    setExpr(choices[Math.floor(Math.random() * choices.length)]);
    setPop((n) => n + 1);
    // 6–8 ký hiệu bay ra từ giữa đầu, nghiêng về phía trên.
    const n = 6 + Math.floor(Math.random() * 3);
    const id = Date.now() + Math.random();
    const items = Array.from({ length: n }, (_, i) => {
      const angle = (-200 + (220 / (n - 1)) * i + (Math.random() * 16 - 8)) * (Math.PI / 180);
      const dist = 70 + Math.random() * 45;
      return {
        sym: BURST_SYMBOLS[Math.floor(Math.random() * BURST_SYMBOLS.length)],
        color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist * 0.85),
        rot: Math.round(Math.random() * 60 - 30),
        delay: Math.round(Math.random() * 120),
        size: 16 + Math.round(Math.random() * 8),
      };
    });
    setBursts((b) => [...b, { id, items }]);
    timers.current.push(setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), BURST_MS + 200));
    // Bấm liên tục thì tính lại mốc trở về vẻ mặt thường từ lần bấm cuối.
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setExpr(null), RESET_MS);
  };

  const interactiveProps = interactive
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": "Mimi — bấm để Mimi đổi biểu cảm",
        onClick: react,
        onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(e); } },
      }
    : { "aria-hidden": "true" };

  return (
    <svg
      width={width}
      height={Math.round((width * 150) / 230)}
      viewBox="0 0 230 150"
      {...interactiveProps}
      // Chỉ hình Mimi nhận cú bấm (khung SVG rộng hơn hình — vùng trong suốt không được chặn thứ nằm bên dưới, vd thẻ
      // lật ở Flashcard). Sự kiện từ hình vẫn nổi lên tới onClick của <svg>.
      style={{ pointerEvents: "none" }}
      className={`overflow-visible ${interactive ? "cursor-pointer select-none outline-none focus-visible:[filter:drop-shadow(0_0_4px_#D97706)]" : ""} ${className}`}
    >
      <defs>
        <linearGradient id={`mimi-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`mimi-crown-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FEF3C7" />
          <stop offset=".45" stopColor="#FCD34D" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <g key={pop} className={pop ? "mimi-pop" : undefined} style={interactive ? { pointerEvents: "visiblePainted" } : undefined}>
        <g transform="translate(29 30)">
          <g className="mimi-ear">
            <path d="M30 62 L36 6 L82 34Z" fill="#F59E0B" />
            <path d="M42 50 L45 20 L68 35Z" fill="#B45309" opacity=".45" />
          </g>
          <path d="M142 62 L136 6 L90 34Z" fill="#F59E0B" />
          <path d="M130 50 L127 20 L104 35Z" fill="#B45309" opacity=".45" />
          <path d="M14 84 C14 44 44 28 86 28 C128 28 158 44 158 84 L158 118 L14 118Z" fill={`url(#mimi-${gid})`} />
          {crown && (
            // Vương miện nhỏ, nét mảnh, vàng ánh kim, hơi nghiêng — đội lệch trên đỉnh đầu (bản trước to, viền dày, trông thô).
            <g transform="rotate(-8 86 30)">
              <path d="M68 30 L65.5 15 L76 22 L86 10 L96 22 L106.5 15 L104 30Z" fill={`url(#mimi-crown-${gid})`} stroke="#B45309" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M68 30 L104 30 L103.4 34 L68.6 34Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M74 25 L77 23.5" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" opacity=".9" />
              <circle cx="65.5" cy="15" r="2" fill="#FFFBEB" stroke="#B45309" strokeWidth="1" />
              <circle cx="86" cy="10" r="2.3" fill="#FFFBEB" stroke="#B45309" strokeWidth="1" />
              <circle cx="106.5" cy="15" r="2" fill="#FFFBEB" stroke="#B45309" strokeWidth="1" />
              <circle cx="86" cy="32" r="1.6" fill="#E11D48" />
            </g>
          )}
          <text x="86" y="56" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="24" fill="#B45309">π</text>
          <circle cx="60" cy="80" r="21" fill="#fff" fillOpacity=".55" stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="112" cy="80" r="21" fill="#fff" fillOpacity=".55" stroke="#0F172A" strokeWidth="3.5" />
          <path d="M81 78 Q86 73 91 78" stroke="#0F172A" strokeWidth="3.5" fill="none" />
          <path d="M39 76 L14 70 M133 76 L158 70" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Eyes expr={expr} />
          {expr && ["happy", "wink", "love", "star"].includes(expr) && (
            <>
              <ellipse cx="34" cy="101" rx="7" ry="4" fill="#FB7185" opacity=".5" />
              <ellipse cx="138" cy="101" rx="7" ry="4" fill="#FB7185" opacity=".5" />
            </>
          )}
          <path d="M82 100 L90 100 L86 106Z" fill="#7C2D12" />
          {expr ? (
            <Mouth expr={expr} />
          ) : (
            <path d="M86 106 Q82 111 77 108 M86 106 Q90 111 95 108" stroke="#7C2D12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          )}
          <ellipse cx="46" cy="114" rx="15" ry="8" fill="#FCD34D" />
          <ellipse cx="126" cy="114" rx="15" ry="8" fill="#FCD34D" />
          {/* Bút chì ngậm ở miệng — khi đổi biểu cảm thì nhả bút ra để thấy miệng. */}
          {!expr && (
            <>
              <rect x="30" y="104" width="112" height="7" rx="3.5" fill="#0F172A" transform="rotate(-3 86 108)" />
              <path d="M142 105 L152 107.5 L142 110Z" fill="#FCD34D" />
            </>
          )}
        </g>
      </g>
      {withSymbols && (
        <g fontFamily="Georgia,serif" fontWeight="700" fill="#D97706">
          <text className="mimi-sym" x="6" y="40" fontSize="26">∑</text>
          <text className="mimi-sym" x="206" y="44" fontSize="24" style={{ animationDelay: "-1s" }}>√</text>
          <text className="mimi-sym" x="214" y="104" fontSize="22" fill="#64748B" style={{ animationDelay: "-2s" }}>∫</text>
        </g>
      )}
      {/* Ký hiệu toán học tỏa ra khi bấm — bay từ giữa đầu (115, 92) ra xung quanh rồi mờ dần. */}
      {bursts.map((b) => (
        <g key={b.id} fontFamily="Georgia,serif" fontWeight="700" pointerEvents="none">
          {b.items.map((it, i) => (
            <text
              key={i}
              x="115"
              y="92"
              textAnchor="middle"
              fontSize={it.size}
              fill={it.color}
              className="mimi-burst"
              style={{ "--dx": `${it.dx}px`, "--dy": `${it.dy}px`, "--rot": `${it.rot}deg`, animationDelay: `${it.delay}ms` }}
            >
              {it.sym}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
