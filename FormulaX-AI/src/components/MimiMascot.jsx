import { useId } from "react";

// Linh vật Mimi — mèo vàng đeo kính tròn, chữ π trên trán (mockup Dashboard đã duyệt 2026-11-01). Chỉ là
// hình trang trí: aria-hidden. Hiệu ứng ở index.css (.mimi-*), tự tắt khi bật "giảm chuyển động".
//   crown: đội vương miện vàng giữa hai tai (trang Premium).
export default function MimiMascot({ width = 230, className = "", withSymbols = true, crown = false }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      width={width}
      height={Math.round((width * 150) / 230)}
      viewBox="0 0 230 150"
      aria-hidden="true"
      className={`overflow-visible ${className}`}
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
        <g className="mimi-blink">
          <ellipse cx="60" cy="81" rx="6.5" ry="9" fill="#0F172A" />
          <ellipse cx="112" cy="81" rx="6.5" ry="9" fill="#0F172A" />
          <circle cx="62.5" cy="77" r="2.6" fill="#fff" />
          <circle cx="114.5" cy="77" r="2.6" fill="#fff" />
        </g>
        <path d="M82 100 L90 100 L86 106Z" fill="#7C2D12" />
        <path d="M86 106 Q82 111 77 108 M86 106 Q90 111 95 108" stroke="#7C2D12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <ellipse cx="46" cy="114" rx="15" ry="8" fill="#FCD34D" />
        <ellipse cx="126" cy="114" rx="15" ry="8" fill="#FCD34D" />
        <rect x="30" y="104" width="112" height="7" rx="3.5" fill="#0F172A" transform="rotate(-3 86 108)" />
        <path d="M142 105 L152 107.5 L142 110Z" fill="#FCD34D" />
      </g>
      {withSymbols && (
        <g fontFamily="Georgia,serif" fontWeight="700" fill="#D97706">
          <text className="mimi-sym" x="6" y="40" fontSize="26">∑</text>
          <text className="mimi-sym" x="206" y="44" fontSize="24" style={{ animationDelay: "-1s" }}>√</text>
          <text className="mimi-sym" x="214" y="104" fontSize="22" fill="#64748B" style={{ animationDelay: "-2s" }}>∫</text>
        </g>
      )}
    </svg>
  );
}
