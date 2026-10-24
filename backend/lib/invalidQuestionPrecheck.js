import { precheckInvalidAngleSum } from "./invalidAnglePrecheck.js";

const value = String.raw`([+-]?\d+(?:[.,]\d+)?)`;
const angle = new RegExp(String.raw`(?:[Gg]óc\s*)?([A-Z])\s*=\s*${value}\s*°`, "gu");
const triangles = /(?:tam\s+giác|[Δ△])\s*([A-Z]{3})/giu;
const number = (s) => Number(String(s).replace(",", "."));
const notice = (reason, text) => ({ reason, text });
const badAngles = () => notice("invalid_triangle_angles", "Các số đo góc đã cho không thể là ba góc của cùng một tam giác. Bạn kiểm tra lại đề giúp mình nhé!");
const badLength = () => notice("invalid_length", "Độ dài cạnh, bán kính hoặc đường kính phải lớn hơn 0. Bạn kiểm tra lại đề giúp mình nhé!");
const badSides = () => notice("invalid_triangle_sides", "Ba độ dài đã cho không tạo thành một tam giác. Bạn kiểm tra lại đề giúp mình nhé!");
const badHypotenuse = () => notice("invalid_hypotenuse", "Cạnh huyền phải dài hơn mỗi cạnh góc vuông. Bạn kiểm tra lại đề giúp mình nhé!");

function triangleNames(text) {
  const found = [...text.matchAll(triangles)].map((m) => m[1]);
  return found.length === 1 && new Set(found[0]).size === 3 ? found[0] : null;
}

function sidesOf(text, name) {
  const sideNames = [name[0] + name[1], name[1] + name[2], name[0] + name[2]];
  return [...text.matchAll(new RegExp(String.raw`\b([A-Z]{2})\s*=\s*${value}(?!\d|[.,]\d)`, "gu"))]
    .map((m) => ({ name: m[1], value: number(m[2]) }))
    .filter((s) => sideNames.some((n) => s.name === n || s.name === [...n].reverse().join("")));
}

/** Chỉ nhận góc/cạnh được khai báo tường minh; không suy ra độ dài từ tọa độ. */
export function precheckTriangleData(question) {
  const text = String(question || "").normalize("NFC").replace(/[−–]/g, "-");
  const name = triangleNames(text);
  if (name && !/góc\s+ngoài/iu.test(text)) {
    const matches = [...text.matchAll(angle)].filter((m) => name.includes(m[1]));
    if (matches.some((m) => number(m[2]) <= 0 || number(m[2]) >= 180)) return badAngles();
    if (matches.length === 3 && new Set(matches.map((m) => m[1])).size === 3
      && Math.abs(matches.reduce((sum, m) => sum + number(m[2]), 0) - 180) > 1e-9) return badAngles();
  }

  const explicitLength = [...text.matchAll(new RegExp(String.raw`(?:cạnh|đoạn)\s+[A-Z]{2}\s*=\s*${value}(?!\d|[.,]\d)|(?:bán\s+kính|đường\s+kính)\s+(?:[A-Za-z]\s*)?=\s*${value}(?!\d|[.,]\d)`, "giu"))];
  if (explicitLength.some((m) => number(m[1] ?? m[2]) <= 0)) return badLength();
  const sides = name ? sidesOf(text, name) : [];
  if (sides.some((s) => s.value <= 0)) return badLength();

  const triple = text.match(new RegExp(String.raw`ba\s+cạnh\s+(?:lần\s+lượt\s+)?(?:là\s+|có\s+độ\s+dài\s+)?${value}\s*[,;]\s*${value}\s*(?:[,;]|và)\s*${value}(?!\d|[.,]\d)`, "iu"));
  const lengths = triple ? triple.slice(1, 4).map(number) : (sides.length === 3
    && new Set(sides.map((s) => [...s.name].sort().join(""))).size === 3 ? sides.map((s) => s.value) : null);
  if (lengths && lengths.every((n) => Number.isFinite(n))) {
    if (lengths.some((n) => n <= 0)) return badLength();
    const sorted = [...lengths].sort((a, b) => a - b);
    if (sorted[0] + sorted[1] <= sorted[2]) return badSides();
  }

  const right = name && text.match(/(?:tam\s+giác|[Δ△])\s*([A-Z]{3})\s+vuông\s+tại\s+([A-Z])/iu);
  if (right && right[1] === name && name.includes(right[2])) {
    const hyp = [...name].filter((v) => v !== right[2]).join("");
    const hypSide = sides.find((s) => [...s.name].sort().join("") === [...hyp].sort().join(""));
    if (hypSide && hypSide.value > 0 && sides.some((s) => s.name.includes(right[2])
      && s.value > 0 && hypSide.value <= s.value)) return badHypotenuse();
  }
  return null;
}

/** Chỉ xét giá trị lượng giác viết thành số, hoặc phương trình đường tròn dạng hệ số số học chuẩn. */
export function precheckNumericData(question) {
  const text = String(question || "").normalize("NFC").replace(/[−–]/g, "-");
  const trig = /\\?\b(?:sin|cos)\b\s*(?:\\?[A-Za-zα-ω]+|\([^()]{1,20}\))?\s*=\s*([+-]?\d+(?:[.,]\d+)?)(?![\p{L}\d]|[.,]\d)/giu;
  for (const m of text.matchAll(trig)) {
    if (Math.abs(number(m[1])) > 1) return notice("invalid_trig_value", "Giá trị sin hoặc cos phải nằm trong đoạn [-1; 1]. Bạn kiểm tra lại đề giúp mình nhé!");
  }

  if (/đường\s+tròn/iu.test(text)) {
    const normalized = text.replace(/([xy])²/g, "$1^2").replace(/([xy])\^\{2\}/g, "$1^2");
    const equation = normalized.match(/(?<![\p{L}\d])x\^2\s*\+\s*y\^2([^=]{0,80})=\s*0(?!\d)/u);
    if (equation) {
      const tail = equation[1].replace(/\s/g, "");
      const terms = [...tail.matchAll(/[+-]\d+(?:[.,]\d+)?[xy]?/g)].map((m) => m[0]);
      if (terms.join("") === tail && new Set(terms.map((t) => /[xy]$/.test(t) ? t.at(-1) : "c")).size === terms.length) {
        const coefficient = (suffix) => number(terms.find((t) => t.endsWith(suffix))?.slice(0, -1) ?? "0");
        const c = number(terms.find((t) => !/[xy]$/.test(t)) ?? "0");
        if ((coefficient("x") / 2) ** 2 + (coefficient("y") / 2) ** 2 - c <= 0) {
          return notice("invalid_circle_radius", "Phương trình đã cho không xác định đường tròn có bán kính dương. Bạn kiểm tra lại đề giúp mình nhé!");
        }
      }
    }
  }

  // Chỉ nhận phân thức gõ tay 1/x hoặc 1/(x ± số), với đúng một giá trị x được cho.
  const assignments = [...text.matchAll(new RegExp(String.raw`(?:cho|với)\s+x\s*=\s*${value}(?!\d|[.,]\d)`, "giu"))];
  if (assignments.length === 1 && /(?:tính|giá\s+trị)/iu.test(text)) {
    const x = number(assignments[0][1]);
    const fractions = [...text.matchAll(/\b\d+\s*\/\s*(?:\(\s*x\s*([+-])\s*(\d+(?:[.,]\d+)?)\s*\)|\b(x)\b)/giu)];
    if (fractions.some((m) => m[3] ? x === 0 : x + (m[1] === "-" ? -number(m[2]) : number(m[2])) === 0)) {
      return notice("zero_denominator", "Mẫu số của phân thức bằng 0 với giá trị biến đã cho. Bạn kiểm tra lại đề giúp mình nhé!");
    }
  }
  return null;
}

/** Không chặn lời chào kèm đề, câu hỏi công thức, hoặc câu nối tiếp có lịch sử toán. */
export function precheckNoMath(question, { hasHistory = false } = {}) {
  if (hasHistory) return null;
  const text = String(question || "").normalize("NFC").trim();
  const math = /\d|[=+×÷√∫∑²³^]|\b[xyz]\b|(?:toán|tính|phương\s+trình|bất\s+phương\s+trình|tam\s+giác|đường\s+tròn|diện\s+tích|thể\s+tích|đạo\s+hàm|nguyên\s+hàm|tích\s+phân|sin|cos|công\s+thức|hê[-\s]?rông|heron|pytago|góc|cạnh|bán\s+kính|chu\s+vi)/iu;
  if (/^(?:giải|làm)\s+(?:luôn|hộ|giùm|giúp|đi|bài\s+này)[!?.\s]*$/iu.test(text)) {
    return notice("missing_problem", "Bạn gửi đầy đủ đề toán và yêu cầu cần hướng dẫn nhé!");
  }
  if (math.test(text)) return null;
  if (text.length <= 12 || /^(?:bạn|cậu)\s+(?:khỏe|khoẻ)\s+không[!?.\s]*$/iu.test(text)) {
    return notice("no_math_problem", "Bạn gửi một đề toán cụ thể để mình hướng dẫn nhé!");
  }
  return null;
}

export function precheckInvalidQuestion(question, options = {}) {
  return precheckInvalidAngleSum(question)
    || precheckTriangleData(question)
    || precheckNumericData(question)
    || precheckNoMath(question, options);
}
