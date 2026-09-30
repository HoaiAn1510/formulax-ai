import { MathElement } from "../utils/katexHelper";

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
 * Lớp phụ (SecondaryLayer): mờ ~50% lớp chính, nét mảnh, lấp các khoảng trống quanh thẻ — sóng
 * sin, hình chóp khung dây, lưới phối cảnh, parabol, vectơ. Công thức của lớp phụ là chuỗi LaTeX
 * chép nguyên văn từ formulas.js, vẽ bằng KaTeX.
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

// Công thức của lớp phụ: chuỗi LaTeX CHÉP NGUYÊN VĂN từ trường `latex` trong formulas.js, hiển thị
// bằng KaTeX (ký hiệu vectơ, phân số không vẽ được đúng bằng ký tự Unicode thường).
const SUB_LATEX = {
  sine: String.raw`y = \sin x:\; T=2\pi,\; [-1;1]`, //                                    lg11-hamso-luonggiac (vế đầu)
  parabola: String.raw`I\!\left(-\dfrac{b}{2a}\,;\,-\dfrac{\Delta}{4a}\right), \quad x = -\dfrac{b}{2a}`, // hh10-parabola
  dot: String.raw`\vec{u} \cdot \vec{v} = |\vec{u}| \cdot |\vec{v}| \cdot \cos(\vec{u}, \vec{v})`, // hh10-goc-tichvohuong-dinhnghia
  pyramid: String.raw`V = \frac{1}{3} B \cdot h`, //                                         hh12-thetich-chopsen
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

// ─── Lớp phụ: mờ hơn (~50% độ sáng lớp chính), nét mảnh hơn, không phát sáng ─────────────────
// Neo theo THẺ ĐĂNG NHẬP chứ không theo mép màn hình: thẻ + dòng điều khoản luôn nằm giữa, cao
// khoảng 454px, tức từ (50% − 227px) tới (50% + 227px). Các hình phụ đặt cách mép đó ≥ 20px nên
// không bao giờ chạm thẻ, ở mọi chiều cao màn hình. Hình nào không đủ chỗ thì ẩn theo breakpoint.
const THIN = { fill: "none", strokeWidth: 1.1, vectorEffect: "non-scaling-stroke" };
const SUB_FORMULA = "absolute whitespace-nowrap italic text-[11px] md:text-[12.5px] text-[#7DD3FC] opacity-35 font-[Inter,system-ui,sans-serif]";

// Sóng y = sin x, 2 chu kỳ, trên khung 0..760 × 0..80 (co giãn ngang).
const SINE_PATH = Array.from({ length: 121 }, (_, i) => {
  const x = 20 + (i / 120) * 720;
  return `${i ? "L" : "M"}${x.toFixed(1)} ${(42 - 24 * Math.sin((i / 120) * 4 * Math.PI)).toFixed(1)}`;
}).join(" ");

// Lưới phối cảnh ở đáy: các đường dọc hội tụ về điểm tụ phía trên, đường ngang dày dần xuống dưới.
const GRID_VERTICALS = Array.from({ length: 21 }, (_, i) => -800 + i * 160);
const GRID_HORIZONTALS = [18, 40, 68, 102, 142, 188];

function SecondaryLayer() {
  return (
    // Lớp ngoài giữ độ mờ 50% cố định; lớp trong mới chạy hiệu ứng phát sáng (animation ghi đè
    // opacity của chính phần tử, nên không đặt hai thứ trên cùng một thẻ).
    <div data-login-layer="secondary" className="absolute inset-0" style={{ opacity: 0.5 }}>
    <div className="login-fx-glow login-fx-delay absolute inset-0">
      {/* Lưới phối cảnh ở đáy màn hình (mọi kích thước) — dưới dòng điều khoản ít nhất 20px */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[min(16vh,180px)]" viewBox="0 0 1600 200" preserveAspectRatio="none">
        <g {...THIN} stroke={BLUE} opacity="0.4">
          {GRID_VERTICALS.map((x) => <line key={x} x1="800" y1="-160" x2={x} y2="200" vectorEffect="non-scaling-stroke" />)}
          {GRID_HORIZONTALS.map((y) => <line key={y} x1="0" y1={y} x2="1600" y2={y} vectorEffect="non-scaling-stroke" />)}
        </g>
      </svg>

      {/* Sóng sin phía trên thẻ — chỉ khi màn đủ cao (≥ 800px) để không chạm hình góc */}
      <div className="hidden [@media(min-height:800px)]:block absolute left-1/2 -translate-x-1/2 w-[clamp(240px,44vw,760px)] h-[64px] md:h-[80px] top-[calc(50%-247px-64px)] md:top-[calc(50%-247px-80px)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 760 80" preserveAspectRatio="none">
          <line x1="0" y1="42" x2="760" y2="42" stroke={BLUE} strokeDasharray="3 7" opacity="0.6" {...THIN} />
          <path d={SINE_PATH} stroke={TEAL} {...THIN} />
          {/* Đánh dấu chu kỳ T: hai đỉnh liên tiếp nối bằng nét đứt */}
          {[110, 470].map((x) => <line key={x} x1={x} y1="18" x2={x} y2="42" stroke={BLUE} strokeDasharray="2 5" {...THIN} />)}
          <line x1="110" y1="12" x2="470" y2="12" stroke={BLUE} strokeDasharray="2 5" opacity="0.7" {...THIN} />
        </svg>
        {[["14.5%", "22%"], ["61.8%", "22%"]].map(([l, t], i) => (
          <span key={i} className="absolute w-[5px] h-[5px] rounded-full bg-[#2DD4BF] opacity-70 -translate-x-1/2 -translate-y-1/2" style={{ left: l, top: t }} />
        ))}
        <span className={`${SUB_FORMULA} right-0 -top-4 md:-top-5`}><MathElement math={SUB_LATEX.sine} /></span>
      </div>

      {/* Hình chóp khung dây phía dưới dòng điều khoản — chỉ khi màn đủ cao */}
      <div className="hidden [@media(min-height:800px)]:block absolute left-1/2 -translate-x-1/2 top-[calc(50%+247px)] w-[96px] h-[80px] md:w-[120px] md:h-[100px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 100">
          <g {...THIN} stroke={TEAL}>
            <polyline points="20,78 64,94 104,76 60,4 20,78" />
            <line x1="64" y1="94" x2="60" y2="4" />
            <line x1="104" y1="76" x2="60" y2="4" />
          </g>
          <g {...THIN} stroke={BLUE} strokeDasharray="3 4" opacity="0.8">
            <polyline points="20,78 60,64 104,76" />
            <line x1="60" y1="64" x2="60" y2="4" />
          </g>
          <circle cx="60" cy="4" r="2.2" fill={TEAL} />
        </svg>
        <span className={`${SUB_FORMULA} left-full ml-2 top-1/2 -translate-y-1/2`}><MathElement math={SUB_LATEX.pyramid} /></span>
      </div>

      {/* Parabol (trái thẻ) và vectơ (phải thẻ) — chỉ màn rất rộng (≥ 1536px), nơi dải hai bên thẻ trống */}
      <div className="hidden 2xl:block absolute w-[240px] h-[220px] right-[calc(50%+250px)] top-[calc(50%-150px)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 200">
          <g {...THIN} stroke={BLUE} opacity="0.7">
            <line x1="10" y1="160" x2="230" y2="160" />
            <line x1="120" y1="190" x2="120" y2="8" strokeDasharray="3 5" />
          </g>
          <path d="M40 30 Q120 250 200 30" stroke={TEAL} {...THIN} />
          <circle cx="120" cy="140" r="2.6" fill={TEAL} />
          <line x1="120" y1="140" x2="30" y2="140" stroke={BLUE} strokeDasharray="2 5" {...THIN} />
        </svg>
        <span className={`${SUB_FORMULA} left-0 -bottom-1`}><MathElement math={SUB_LATEX.parabola} /></span>
      </div>
      <div className="hidden 2xl:block absolute w-[240px] h-[220px] left-[calc(50%+250px)] top-[calc(50%-150px)]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 200">
          <defs>
            <marker id="login-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={TEAL} />
            </marker>
          </defs>
          <g {...THIN} stroke={TEAL} markerEnd="url(#login-arrow)">
            <line x1="40" y1="170" x2="200" y2="120" />
            <line x1="40" y1="170" x2="110" y2="30" />
          </g>
          <path d="M78 158 A40 40 0 0 0 62 128" stroke={BLUE} {...THIN} />
          <line x1="110" y1="30" x2="129" y2="143" stroke={BLUE} strokeDasharray="2 5" {...THIN} />
          <circle cx="40" cy="170" r="2.6" fill={TEAL} />
        </svg>
        <span className={`${SUB_FORMULA} right-0 -bottom-1`}><MathElement math={SUB_LATEX.dot} /></span>
      </div>
    </div>
    </div>
  );
}

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

      {/* Lớp phụ (mờ hơn, nằm dưới 4 hình góc) */}
      <SecondaryLayer />

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
