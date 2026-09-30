/**
 * Nền trang đăng nhập — thiết kế riêng của FormulaX: nền navy, hình học toán phát sáng xanh
 * dương / xanh ngọc ở 4 góc, công thức mờ, chấm sáng như bầu trời sao. Vẽ hoàn toàn bằng SVG
 * inline (không ảnh), chỉ để trang trí nên aria-hidden và không bắt sự kiện chuột.
 *
 * Bố cục: mỗi hình nằm trong một SVG neo vào một góc, kích thước theo bề rộng màn hình (có giới
 * hạn trên/dưới) và vẽ lệch ra phía mép — vùng giữa luôn thoáng cho thẻ đăng nhập, cả màn dọc
 * (điện thoại) lẫn ngang (máy tính). Công thức phụ hai bên chỉ hiện từ màn rộng ≥ 1024px.
 *
 * CÔNG THỨC: chép đúng từ formulas.js (ghi id bên cạnh), chỉ đổi cách viết LaTeX sang ký tự
 * Unicode để vẽ bằng <text>. Không import formulas.js ở đây: file ~400 KB, trang đăng nhập nạp
 * tĩnh (xem CLAUDE.md mục Hiệu năng). Thư viện chưa có định lý Pythagore dạng a² + b² = c², nên
 * hình tam giác vuông đi kèm định lý Côsin (hh10-cosin) — không tự viết công thức ngoài thư viện.
 *
 * Hiệu ứng: phát sáng rất chậm và chấm sao lấp lánh nhẹ (CSS trong index.css), tắt hẳn khi người
 * dùng bật "giảm chuyển động" (prefers-reduced-motion).
 */

const FORMULAS = {
  cosin: "a² = b² + c² − 2bc·cos A", //          hh10-cosin
  circle: "(x − a)² + (y − b)² = R²", //         hh10-duongtron-phuongtrinh
  cone: "V = ⅓ π r² h", //                       hh12-khino-thetich
  log: "y = logₐ x", //                          ds11-hamso-log
  derivative: "(xⁿ)′ = n · xⁿ⁻¹", //             gt12-daoham-basic
  trig: "sin²x + cos²x = 1", //                  lg11-congthuc-coban
  sphere: "V = ⁴⁄₃ π R³", //                     hh12-matcau-thetich
};

const BLUE = "#38BDF8";
const TEAL = "#2DD4BF";
const FORMULA_FILL = "#7DD3FC";

// Chấm sao: vị trí cố định (sinh bằng LCG có seed) để mỗi lần mở trang giống nhau, không nhảy.
function makeStars(count, seed) {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: count }, (_, i) => ({
    cx: rand() * 1600,
    cy: rand() * 1000,
    r: 0.6 + rand() * 1.3,
    o: 0.25 + rand() * 0.5,
    twinkle: i % 3 === 0,
    delay: (rand() * 8).toFixed(1),
  }));
}
const STARS = makeStars(110, 20260930);

// Đồ thị y = log₂ x trên hệ trục của góc dưới phải (gốc tại (120, 300), 1 đơn vị x = 45, 1 đơn vị y = 55).
const LOG_PATH = Array.from({ length: 40 }, (_, i) => {
  const x = 0.2 + (i / 39) * 6;
  return `${i ? "L" : "M"}${(120 + 45 * x).toFixed(1)} ${(300 - 55 * Math.log2(x)).toFixed(1)}`;
}).join(" ");

function Glow({ id }) {
  return (
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function FormulaText({ x, y, children, anchor = "start", size = 17 }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={FORMULA_FILL} opacity="0.4" fontFamily="Inter, system-ui, sans-serif" fontStyle="italic">
      {children}
    </text>
  );
}

const CORNER = "absolute w-[clamp(130px,32vw,420px)] h-auto";

export default function LoginBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Bầu trời sao */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {STARS.map((st, i) => (
          <circle
            key={i}
            cx={st.cx}
            cy={st.cy}
            r={st.r}
            fill="#E0F2FE"
            opacity={st.o}
            className={st.twinkle ? "login-fx-twinkle" : undefined}
            style={st.twinkle ? { animationDelay: `${st.delay}s` } : undefined}
          />
        ))}
      </svg>

      {/* Góc trên trái — tam giác vuông với hình vuông dựng trên ba cạnh (hình Pythagore) */}
      <svg className={`${CORNER} top-0 left-0`} viewBox="0 0 400 400">
        <Glow id="login-glow-tl" />
        <g className="login-fx-glow" filter="url(#login-glow-tl)" fill="none" strokeWidth="1.6" strokeLinejoin="round">
          <polygon points="70,110 70,230 230,230" stroke={TEAL} />
          <polygon points="-50,110 70,110 70,230 -50,230" stroke={BLUE} opacity="0.55" />
          <polygon points="70,230 230,230 230,390 70,390" stroke={BLUE} opacity="0.55" />
          <polygon points="70,110 230,230 350,70 190,-50" stroke={BLUE} opacity="0.55" />
          <polyline points="70,216 84,216 84,230" stroke={TEAL} />
        </g>
        <g fill={FORMULA_FILL} opacity="0.55" fontFamily="Inter, system-ui, sans-serif" fontStyle="italic" fontSize="16">
          <text x="52" y="176">b</text>
          <text x="146" y="250">c</text>
          <text x="156" y="160">a</text>
          <text x="54" y="250">A</text>
        </g>
        <FormulaText x="92" y="318">{FORMULAS.cosin}</FormulaText>
      </svg>

      {/* Góc trên phải — đường tròn tâm I bán kính R */}
      <svg className={`${CORNER} top-0 right-0`} viewBox="0 0 400 400">
        <Glow id="login-glow-tr" />
        <g className="login-fx-glow login-fx-delay" filter="url(#login-glow-tr)" fill="none" strokeWidth="1.6">
          <circle cx="280" cy="120" r="92" stroke={BLUE} />
          <circle cx="280" cy="120" r="3" fill={TEAL} stroke="none" />
          <line x1="280" y1="120" x2="345" y2="55" stroke={TEAL} />
          <line x1="150" y1="212" x2="400" y2="212" stroke={BLUE} strokeDasharray="4 6" opacity="0.6" />
        </g>
        <g fill={FORMULA_FILL} opacity="0.55" fontFamily="Inter, system-ui, sans-serif" fontStyle="italic" fontSize="16">
          <text x="266" y="140">I</text>
          <text x="318" y="98">R</text>
        </g>
        <FormulaText x="390" y="262" anchor="end">{FORMULAS.circle}</FormulaText>
      </svg>

      {/* Góc dưới trái — hình nón */}
      <svg className={`${CORNER} bottom-0 left-0`} viewBox="0 0 400 400">
        <Glow id="login-glow-bl" />
        <g className="login-fx-glow login-fx-delay" filter="url(#login-glow-bl)" fill="none" strokeWidth="1.6">
          <line x1="150" y1="170" x2="60" y2="330" stroke={TEAL} />
          <line x1="150" y1="170" x2="240" y2="330" stroke={TEAL} />
          <path d="M60 330 A90 24 0 0 0 240 330" stroke={BLUE} />
          <path d="M60 330 A90 24 0 0 1 240 330" stroke={BLUE} strokeDasharray="4 6" opacity="0.6" />
          <line x1="150" y1="170" x2="150" y2="330" stroke={BLUE} strokeDasharray="4 6" opacity="0.7" />
          <line x1="150" y1="330" x2="240" y2="330" stroke={BLUE} strokeDasharray="4 6" opacity="0.7" />
        </g>
        <g fill={FORMULA_FILL} opacity="0.55" fontFamily="Inter, system-ui, sans-serif" fontStyle="italic" fontSize="16">
          <text x="157" y="258">h</text>
          <text x="190" y="324">r</text>
        </g>
        <FormulaText x="30" y="120">{FORMULAS.cone}</FormulaText>
      </svg>

      {/* Góc dưới phải — đồ thị hàm số y = log₂ x */}
      <svg className={`${CORNER} bottom-0 right-0`} viewBox="0 0 400 400">
        <Glow id="login-glow-br" />
        <g className="login-fx-glow" filter="url(#login-glow-br)" fill="none" strokeWidth="1.6">
          <line x1="60" y1="300" x2="392" y2="300" stroke={BLUE} opacity="0.6" />
          <line x1="120" y1="400" x2="120" y2="70" stroke={BLUE} opacity="0.6" />
          <polyline points="386,295 392,300 386,305" stroke={BLUE} opacity="0.6" />
          <polyline points="115,76 120,70 125,76" stroke={BLUE} opacity="0.6" />
          <path d={LOG_PATH} stroke={TEAL} />
          <circle cx="165" cy="300" r="3" fill={TEAL} stroke="none" />
        </g>
        <FormulaText x="232" y="150">{FORMULAS.log}</FormulaText>
        <FormulaText x="232" y="118" size={15}>{FORMULAS.derivative}</FormulaText>
      </svg>

      {/* Công thức phụ hai bên — chỉ màn rộng, nơi hai bên thẻ còn nhiều chỗ trống */}
      <svg className="hidden lg:block absolute left-[3vw] top-1/2 -translate-y-1/2 w-[220px]" viewBox="0 0 220 60">
        <FormulaText x="0" y="36" size={16}>{FORMULAS.trig}</FormulaText>
      </svg>
      <svg className="hidden lg:block absolute right-[3vw] top-1/2 -translate-y-1/2 w-[180px]" viewBox="0 0 180 60">
        <FormulaText x="180" y="36" anchor="end" size={16}>{FORMULAS.sphere}</FormulaText>
      </svg>
    </div>
  );
}
