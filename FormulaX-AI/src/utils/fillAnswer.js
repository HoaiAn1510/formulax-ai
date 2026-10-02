// Chấm chế độ "Điền đáp án" của Quiz: so đáp án học sinh gõ với `blankAnswer` của câu hỏi
// (KHÔNG so với chữ của phương án đúng — chữ đó có $ và LaTeX, học sinh không gõ được).
// File thuần, không import gì — test bằng `npm run test:quiz` (scripts/test-fill-answer.mjs).
//
// Nguyên tắc: chỉ coi là bằng nhau khi hai bên GIỐNG NHAU về cách viết sau chuẩn hoá, hoặc cùng
// một giá trị số khi cả hai đều là số/phân số. Không có bộ tính toán ký hiệu: x+1 và 1+x,
// 2sqrt(2) và sqrt(8), 1/cos^2x và 1+tan^2x vẫn bị chấm khác nhau.

const VN_LETTER = /[à-ỹ]/i;

/**
 * Câu có dùng được cho chế độ điền không. Loại:
 *  (a) blankAnswer còn LaTeX (có dấu \) — học sinh không gõ được;
 *  (b) blankAnswer là câu văn (từ 3 từ trở lên, có chữ tiếng Việt) — gần như không thể gõ khớp.
 * Câu bị loại vẫn dùng bình thường ở dạng trắc nghiệm.
 */
export function isFillEligible(question) {
  const b = question?.blankAnswer;
  if (typeof b !== "string" || !b.trim()) return false;
  if (b.includes("\\")) return false;
  if (VN_LETTER.test(b) && b.trim().split(/\s+/).length >= 3) return false;
  return true;
}

// Đơn vị bỏ được ở cuối đáp án (quyết định (d)) — danh sách cố định, viết ở dạng ĐÃ chuẩn hoá
// (chữ thường, không khoảng trắng, mũ dạng ^). Dài trước ngắn sau để "cm^3" không bị cắt thành
// "cm". KHÔNG có "%": 1,4% và 1,4 là hai giá trị khác nhau.
const UNITS = [
  "triệuđồng", "nghìnđồng", "đồng",
  "tấn/ha", "km/h", "m/s",
  "cm^3", "cm^2", "mm^3", "mm^2", "dm^3", "dm^2", "km^2", "m^3", "m^2",
  "cm", "mm", "dm", "km", "m",
  "kg", "tấn", "lít",
  "giờ", "phút", "giây",
  "độ",
].sort((a, b) => b.length - a.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
// Chỉ bỏ khi đơn vị đứng NGAY SAU một số (chữ số, hoặc chữ số + pi như "36pi cm^3").
const UNIT_TAIL = new RegExp(`(\\d|\\dpi)(?:${UNITS.map(escapeRe).join("|")})$`);

const SUPERSCRIPT = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const GREEK = { "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "φ": "phi", "θ": "theta", "λ": "lambda", "ω": "omega", "Δ": "delta", "∆": "delta" };

/** Đưa một đáp án về dạng so khớp được. Áp cho CẢ đáp án học sinh lẫn blankAnswer. */
export function normalizeFillAnswer(input) {
  let s = String(input ?? "").normalize("NFC");

  // Ký tự Hy Lạp viết hoa (Δ) phải đổi trước khi hạ chữ thường.
  s = s.replace(/[Δ∆]/g, "delta");
  s = s.toLowerCase().replace(/\$/g, "");

  // LaTeX → dạng gõ được (phòng khi học sinh gõ LaTeX).
  s = s.replace(/\\(left|right)\b/g, "");
  for (let i = 0; i < 5; i++) {
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, "sqrt($1)");
  }
  s = s.replace(/\^\s*\{?\\circ\}?/g, "độ")
    .replace(/\\infty/g, "inf")
    .replace(/\\pi/g, "pi")
    .replace(/\\(cdot|times)/g, "*")
    .replace(/\\leq?\b/g, "<=").replace(/\\geq?\b/g, ">=").replace(/\\neq?\b/g, "!=")
    .replace(/\{,\}/g, ",")
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\([a-z]+)/g, "$1")
    .replace(/\\/g, "");

  // Ký tự Unicode → dạng gõ được.
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((c) => SUPERSCRIPT[c]).join(""))
    .replace(/√/g, "sqrt")
    .replace(/[−–]/g, "-")
    .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=")
    .replace(/[×·⋅]/g, "*")
    .replace(/∞/g, "inf")
    .replace(/π/g, "pi")
    .replace(/°/g, "độ")
    .replace(/[αβγδφθλω]/g, (c) => GREEK[c]);

  s = s.replace(/\*\*/g, "^").replace(/[{]/g, "(").replace(/[}]/g, ")");

  // Dấu phẩy thập phân → chấm. Làm TRƯỚC khi bỏ khoảng trắng: "1, 2" (liệt kê) không bị gộp
  // thành 1.2, còn "7,5" / "[4,8; 5,2]" thì đổi đúng.
  s = s.replace(/(\d),(\d)/g, "$1.$2");

  s = s.replace(/\s+/g, "");

  // "+inf" ở đầu một thành phần khoảng = "inf".
  s = s.replace(/(^|[;([,])\+inf/g, "$1inf");

  // Bỏ dấu * khi kề chữ hoặc ngoặc (a^2*sqrt(3) = a^2sqrt(3)); giữ * giữa hai chữ số (5*0 ≠ 50).
  s = s.replace(/\*(?=[a-zà-ỹ(])/g, "").replace(/(?<=[a-zà-ỹ)])\*/g, "");

  // Bỏ ngoặc bao quanh đúng MỘT số hoặc MỘT chữ cái: sqrt(3) = sqrt3, e^(x) = e^x.
  // Không bỏ ngoặc quanh cụm dài hơn: 1/(2x) giữ nguyên, khác 1/2x.
  for (let i = 0; i < 3; i++) s = s.replace(/\((\d+(?:\.\d+)?|[a-z])\)/g, "$1");

  // (d) đơn vị ở cuối, ngay sau một số.
  s = s.replace(UNIT_TAIL, "$1");

  return s;
}

// (e) Số hoặc phân số → phân số chính xác bằng BigInt (không dùng số thực): "0.625" = 625/1000.
function toFraction(s) {
  const num = (t) => {
    const m = t.match(/^(-?)(\d+)(?:\.(\d+))?$/);
    if (!m) return null;
    const frac = m[3] || "";
    let n = BigInt(m[2] + frac);
    if (m[1]) n = -n;
    return { n, d: 10n ** BigInt(frac.length) };
  };
  const parts = s.split("/");
  if (parts.length === 1) return num(parts[0]);
  if (parts.length !== 2) return null;
  const a = num(parts[0]), b = num(parts[1]);
  if (!a || !b || b.n === 0n) return null;
  return { n: a.n * b.d, d: a.d * b.n };
}

function sameValue(a, b) {
  if (a === b) return true;
  const x = toFraction(a), y = toFraction(b);
  return Boolean(x && y && x.n * y.d === y.n * x.d);
}

// (c) Tách tiền tố "biến =" ngắn: vế trái 1–4 ký tự và là TÊN BIẾN (chữ cái đầu, sau đó chữ/số/'
// — x, y', s2, fx sau khi f(x) bỏ ngoặc), đúng một dấu "=", không phải <=, >=, !=. Vế trái là biểu
// thức thì không tách: "z - 3 = 0" là phương trình, gõ "0" không được tính đúng.
function splitShortLhs(s) {
  if ((s.match(/=/g) || []).length !== 1 || /[<>!]=/.test(s)) return null;
  const i = s.indexOf("=");
  const lhs = s.slice(0, i), rhs = s.slice(i + 1);
  if (lhs.length > 4 || !/^[a-z][a-z0-9']*$/.test(lhs) || !rhs) return null;
  return { lhs, rhs };
}

/**
 * Đáp án học sinh có đúng không. `question` cần có `blankAnswer`.
 * - Giống hệt sau chuẩn hoá, hoặc cùng giá trị số/phân số → đúng.
 * - Một bên có "biến =" ngắn còn bên kia không: so phần sau dấu "=" (y' = 3x^2 ↔ 3x^2).
 * - Cả hai có "biến =": vế trái phải giống nhau (x = 2 ≠ y = 2).
 */
export function checkFillAnswer(userInput, question) {
  const u = normalizeFillAnswer(userInput);
  const e = normalizeFillAnswer(question?.blankAnswer);
  if (!u || !e) return false;
  if (sameValue(u, e)) return true;

  const lu = splitShortLhs(u), le = splitShortLhs(e);
  if (lu && le) return lu.lhs === le.lhs && sameValue(lu.rhs, le.rhs);
  if (lu) return sameValue(lu.rhs, e);
  if (le) return sameValue(u, le.rhs);
  return false;
}
