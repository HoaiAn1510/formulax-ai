// Bộ lọc riêng cho BÀI TRẮC NGHIỆM (từ 2026-10-07): AI chỉ hướng dẫn cách giải, kết thúc bằng ô ?
// như bài thường, KHÔNG được nói phương án nào đúng. Prompt đã có quy tắc 3b; bộ lọc này chặn các
// câu lọt qua: "đáp án A", "chọn B", "phương án C đúng", "D là đáp án đúng"...
//
// Cố ý KHÔNG chặn dạng khoảng/giá trị của kết quả (ví dụ "(x_0; +\infty)") dù học sinh có thể tự
// đối chiếu với phương án — quyết định của chủ dự án 2026-10-07.
//
// Chỉ chạy khi đề là trắc nghiệm (isMultipleChoiceQuestion): ở bài thường A, B, C, D là tên điểm
// ("chọn A làm gốc tọa độ") — không được đụng tới.

/**
 * Đề trắc nghiệm: có chữ "trắc nghiệm", hoặc có ít nhất 3 nhãn phương án A., B., C. (hay A), B), C))
 * theo đúng thứ tự, mỗi nhãn đứng đầu dòng hoặc sau khoảng trắng.
 */
export function isMultipleChoiceQuestion(text) {
  const s = String(text ?? "");
  if (/trắc\s+nghiệm/iu.test(s)) return true;
  return /(?:^|\s)A\s*[.)]\s*\S[\s\S]*?(?:^|\s)B\s*[.)]\s*\S[\s\S]*?(?:^|\s)C\s*[.)]\s*\S/u.test(s);
}

// Nhãn phương án có thể bọc trong $...$, (...), **...**. Không bắt khi nhãn là đầu một danh sách
// ("các phương án A, B, C, D", "phương án A hoặc B") — đó là nhắc tới các phương án, không phải chọn.
const LABEL = String.raw`(?:\*\*)?\$?\(?([A-D])\)?\$?(?:\*\*)?(?![\p{L}\d(_^'])(?!\s*(?:,|;|\/|và|hoặc|-|–)\s*\$?\(?[A-D](?![\p{L}\d]))`;
const REVEAL_PATTERNS = [
  // "đáp án A", "đáp án đúng là B", "phương án C đúng", "chọn D", "chọn đáp án B", "câu trả lời là C"
  new RegExp(String.raw`(?<!các\s)(?<!những\s)(?<!mọi\s)(?:[Đđ]áp án|[Pp]hương án|[Cc]họn|[Cc]âu trả lời)(?:\s+(?:đúng|là|cần chọn|phù hợp|đáp án|phương án))*\s*[:：]?\s*${LABEL}`, "gu"),
  // "B là đáp án đúng", "(C) đúng", "D đúng."
  new RegExp(String.raw`(?<![\p{L}\d\\])\(?([A-D])\)?\.?\s+(?:là\s+)?(?:(?:đáp án|phương án)\s+)?(?:đúng|cần chọn)(?![\p{L}])`, "gu"),
];

/** Các cụm "nói phương án đúng" tìm thấy trong một đoạn văn bản. */
export function findChoiceReveals(text) {
  const s = String(text ?? "");
  const found = [];
  for (const re of REVEAL_PATTERNS) {
    re.lastIndex = 0;
    for (const m of s.matchAll(re)) found.push(m[0].trim());
  }
  return found;
}

/** Bỏ những câu có cụm "nói phương án đúng", giữ nguyên các câu còn lại. */
export function stripChoiceReveals(text) {
  const s = String(text ?? "");
  if (!findChoiceReveals(s).length) return s;
  return s
    .split(/(?<=[.!?…])\s+/u)
    .filter((sentence) => !findChoiceReveals(sentence).length)
    .join(" ")
    .trim();
}

const FIELDS = ["intro", "reminder"];
const STEP_FIELDS = ["title", "detail", "expression"];

/**
 * Kiểm tra (và nếu strip = true thì xoá) các cụm nói phương án đúng trong câu trả lời đã chuẩn hoá.
 * @returns {{answer: object, reveals: string[]}}
 */
export function guardChoiceReveals(answer, { strip = false } = {}) {
  const reveals = [];
  const check = (value) => {
    const found = findChoiceReveals(value);
    reveals.push(...found);
    return strip && found.length ? stripChoiceReveals(value) : value;
  };
  const out = { ...answer };
  for (const f of FIELDS) if (typeof out[f] === "string") out[f] = check(out[f]);
  out.steps = (answer.steps || []).map((step) => {
    const next = { ...step };
    for (const f of STEP_FIELDS) if (typeof next[f] === "string") next[f] = check(next[f]);
    // Tiêu đề bị xoá hết (vd "Chọn đáp án B") → tiêu đề trung tính.
    if (strip && !next.title && step.title) next.title = "Đối chiếu với các phương án";
    return next;
  });
  return { answer: out, reveals: [...new Set(reveals)] };
}
