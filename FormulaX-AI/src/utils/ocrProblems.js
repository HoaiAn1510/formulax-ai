// Hàm thuần cho luồng "chụp ảnh đề → chọn bài → hướng dẫn từng bài" của AI Finder. Không đụng DOM
// để test được bằng node (scripts/test-ocr-flow.mjs).

/** Chỗ Gemini không đọc rõ — câu lệnh OCR yêu cầu viết đúng chuỗi này tại vị trí đó. */
export const UNCLEAR_MARK = "[?]";

// Ô đánh dấu chỗ không đọc rõ: viền đỏ, khác ô "?" amber của AI Finder (chỗ học sinh tự tính).
// Màu viết thẳng vì là tham số của lệnh LaTeX (\fcolorbox không cần bật `trust` của KaTeX).
const UNCLEAR_BOX = String.raw`\fcolorbox{#DC2626}{#FEE2E2}{\textcolor{#B91C1C}{\textbf{\,?\,}}}`;

/** Đề còn chỗ không đọc rõ — phải sửa trước khi hướng dẫn (AI không đoán được số bị mờ). */
export const hasUnclear = (text) => String(text ?? "").includes(UNCLEAR_MARK);

/**
 * Đề có xen $...$: mọi "[?]" (trong hay ngoài phần toán) → ô đỏ để học sinh thấy ngay chỗ cần sửa.
 * Phần chữ được bọc thêm $...$ quanh ô.
 */
export function markUnclear(text) {
  return String(text ?? "")
    .split(/(\$\$[^$]*\$\$|\$[^$]*\$)/)
    .map((part, i) => {
      if (i % 2 === 1) return part.split(UNCLEAR_MARK).join(UNCLEAR_BOX);
      return part.split(UNCLEAR_MARK).join(`$${UNCLEAR_BOX}$`);
    })
    .join("");
}

/**
 * Tin nhắn gửi AI Finder cho một bài = đề đã xác nhận (+ ghi chú hình vẽ nếu có), để AI biết các dữ
 * kiện chỉ có trên hình (vd "AH vuông góc BC").
 */
export function problemToFinderMessage({ text, hasFigure, figureNote }) {
  const body = String(text ?? "").trim();
  const note = hasFigure ? String(figureNote ?? "").trim() : "";
  return note ? `${body}\n(Hình vẽ cho biết: ${note})` : body;
}

/**
 * Có được hướng dẫn `count` bài không, với số lượt AI còn lại. Mỗi bài = 1 lượt AI Finder.
 * remaining = null: chưa biết số lượt (vẫn cho — backend tự chặn và hoàn lượt nếu hết).
 * @returns {{ ok: boolean, message: string }}
 */
export function checkGuidanceQuota({ count, remaining, isPremium }) {
  if (count <= 0) return { ok: false, message: "Bạn chọn ít nhất một bài nhé." };
  if (isPremium || remaining === null || remaining === undefined) return { ok: true, message: "" };
  if (remaining <= 0) return { ok: false, message: "Bạn đã dùng hết lượt hỏi AI hôm nay." };
  if (count > remaining) {
    return {
      ok: false,
      message: `Mỗi bài được hướng dẫn tính 1 lượt. Bạn còn ${remaining} lượt hôm nay nhưng đang chọn ${count} bài — bỏ chọn bớt còn tối đa ${remaining} bài nhé.`,
    };
  }
  return { ok: true, message: "" };
}

/**
 * Tab tiếp theo cần gọi AI: CHỈ bài đang mở, chưa có kết quả, không có bài nào đang chờ AI (không
 * gọi song song nhiều bài), và không trong lúc chờ sau lỗi "AI đang bận" (busyUntil — Groq 429).
 * null = không gọi gì lúc này.
 */
export function nextGuidanceRequest({ activeKey, results, inFlightKey, busyUntil = 0, now = Date.now() }) {
  if (inFlightKey || activeKey == null || busyUntil > now) return null;
  return results[activeKey] ? null : activeKey;
}

/**
 * Tab đã có hướng dẫn các bước thật chưa — chỉ khi đó mới hiện ✓. Không có công thức (no_formula),
 * lỗi, AI bận, hết lượt, hay câu trả lời không phải lời giải (off_topic...) đều không tính.
 */
export function isGuided(result) {
  return result?.status === "done" && result.answer?.type === "solution";
}

/** Thời gian chờ (giây) sau lỗi "AI đang bận" — theo backend (retryAfter), mặc định 60. */
export function busyWaitSeconds(retryAfter) {
  const s = Number(retryAfter);
  return Number.isFinite(s) && s > 0 ? Math.ceil(s) : 60;
}
