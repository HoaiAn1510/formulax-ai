// Đọc ảnh đề toán bằng Gemini: kiểm tra ảnh → gọi Gemini (REST, không cài SDK) → parse JSON →
// chuẩn hoá danh sách bài. Gemini CHỈ dùng để chép đề từ ảnh; phần hướng dẫn giải vẫn là AI Finder
// trên Groq (quyết định 2026-10-07). Tách khỏi server.js để test được bằng fetch giả.
import { OCR_PROMPT } from "./ocrPrompt.js";
import { parseModelJson } from "./solutionGuard.js";

// Chọn sau bài thử 2026-10-07: 3.5 Flash-Lite đọc đúng cả ảnh vở viết tay lẫn ảnh màn hình, 2–5
// giây/ảnh. 3.8 Flash bị 503/treo suốt lúc thử nên không dùng. Hạn mức gói miễn phí tính riêng
// từng model → model dự phòng dùng khi model chính 429/503/timeout.
export const OCR_MODEL = "gemini-3.5-flash-lite";
export const OCR_FALLBACK_MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Ngân sách mỗi request /api/ocr. Timeout của frontend (callOcr trong
// FormulaX-AI/src/views/FormulaFinder.jsx, 45 giây) PHẢI lớn hơn, nếu không học sinh bị tính lượt
// quét mà không thấy kết quả.
export const OCR_BUDGET_MS = 40_000;
const PER_CALL_TIMEOUT_MS = 25_000;
const MIN_CALL_MS = 6_000;

// Ảnh đã nén ở trình duyệt (cạnh dài ≤ 2000px, JPEG 0,82 — utils/imageCompress.js) thường 300–700 KB. 1,5 MB là trần cho ảnh
// nén không được (trình duyệt cũ) — vượt thì 413, không gửi Gemini.
export const MAX_IMAGE_BYTES = 1_500_000;
export const MAX_PROBLEMS = 10;
const MAX_TEXT_CHARS = 2000;
const MAX_LABEL_CHARS = 40;
const MAX_FIGURE_NOTE_CHARS = 500;
const MAX_UNCLEAR_ITEMS = 5;
const MAX_UNCLEAR_CHARS = 200;

export class OcrError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Loại ảnh theo byte đầu file (không tin MIME client gửi). null = không phải JPEG/PNG/WebP. */
export function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Giải mã ảnh base64 trong body. Chấp nhận cả dạng data URL ("data:image/jpeg;base64,...").
 * @returns {{buffer: Buffer, mime: string}}  ném OcrError 400/413 nếu ảnh không hợp lệ
 */
export function decodeImagePayload(image) {
  if (typeof image !== "string" || !image) throw new OcrError(400, "bad_image", "Thiếu ảnh đề bài.");
  const b64 = image.replace(/^data:[^;,]*;base64,/, "");
  // Ước lượng trước khi giải mã để không cấp phát bộ nhớ cho ảnh quá lớn.
  if (Math.floor((b64.length * 3) / 4) > MAX_IMAGE_BYTES + 3) {
    throw new OcrError(413, "image_too_large", "Ảnh quá lớn. Bạn chụp lại hoặc chọn ảnh nhỏ hơn nhé.");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new OcrError(400, "bad_image", "Ảnh không đọc được.");
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new OcrError(413, "image_too_large", "Ảnh quá lớn. Bạn chụp lại hoặc chọn ảnh nhỏ hơn nhé.");
  }
  const mime = detectImageType(buffer);
  if (!mime) throw new OcrError(400, "bad_image", "Chỉ nhận ảnh JPG, PNG hoặc WebP.");
  return { buffer, mime };
}

/**
 * Parse JSON Gemini trả về. Gemini ở chế độ JSON viết escape đúng chuẩn, nên parse BÌNH THƯỜNG trước;
 * chỉ khi thất bại mới sửa escape LaTeX (parseModelJson). Sửa escape trước sẽ biến "\nA. ..." (xuống
 * dòng trước phương án trắc nghiệm) thành chữ "\nA" — đã gặp khi thử 2026-10-07.
 */
export function parseOcrJson(text) {
  const body = String(text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return parseModelJson(keepOcrNewlines(body));
}

// Lệnh LaTeX bắt đầu bằng chữ n — "\n" đứng trước các chữ này là lệnh LaTeX, không phải xuống dòng.
const LATEX_N_COMMANDS = new Set([
  "ne", "neq", "neg", "ni", "nu", "not", "notin", "nabla", "natural", "nmid", "nleq", "ngeq",
  "nleqslant", "ngeqslant", "nless", "ngtr", "nexists", "nsubseteq", "nsupseteq", "nsubset",
  "nsupset", "ncong", "nsim", "nparallel", "nearrow", "nwarrow", "newline", "noindent", "nolimits",
  "nonumber", "nrightarrow", "nleftarrow", "nRightarrow", "nLeftarrow", "nleftrightarrow",
]);

/**
 * Chuẩn bị JSON của Gemini trước khi sửa escape + parse. LUÔN chạy (không parse "thường" trước):
 * chế độ JSON của Gemini vẫn có lúc viết lệnh LaTeX với MỘT dấu \ (6/12 lần khi thử 2026-10-08).
 * Có khi JSON hỏng (\circ), có khi JSON vẫn HỢP LỆ nhưng sai nghĩa: \neq → xuống dòng + "eq",
 * \frac → ký tự \f + "rac", \text → tab + "ext". Hàm sửa escape chung (repairLatexEscapes) xử lý
 * đúng \f \t \b \r trước chữ cái (nhân đôi thành lệnh LaTeX), nhưng cũng nhân đôi "\n" trước chữ
 * cái — dòng xuống thật trước "Tính…", "A." hay "a)" sẽ hiện thành chữ "\nTính". Ở đây: "\n" chưa
 * escape là XUỐNG DÒNG trừ khi theo sau là một lệnh LaTeX bắt đầu bằng n (LATEX_N_COMMANDS) → đổi
 * thành \u000A (escape JSON hợp lệ, hàm sửa escape giữ nguyên). "\\n" (dấu \ đã escape + n) không đụng.
 */
export function keepOcrNewlines(raw) {
  return String(raw ?? "").replace(/(?<!\\)((?:\\\\)*)\\n([A-Za-z]*)/g, (whole, pairs, word) =>
    LATEX_N_COMMANDS.has(`n${word}`) ? whole : `${pairs}\\u000A${word}`);
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Chuẩn hoá kết quả: bỏ bài rỗng, cắt độ dài, tối đa MAX_PROBLEMS bài. null nếu sai cấu trúc.
 * @returns {{label: string, text: string, hasFigure: boolean, figureNote: string, unclear: string[]}[] | null}
 */
export function normalizeOcrResult(obj) {
  if (!obj || !Array.isArray(obj.problems)) return null;
  const problems = [];
  for (const p of obj.problems) {
    if (!p || typeof p !== "object") continue;
    const text = str(p.text, MAX_TEXT_CHARS);
    if (!text) continue;
    const hasFigure = p.has_figure === true;
    problems.push({
      label: str(p.label, MAX_LABEL_CHARS) || `Bài ${problems.length + 1}`,
      text,
      hasFigure,
      figureNote: hasFigure ? str(p.figure_note, MAX_FIGURE_NOTE_CHARS) : "",
      unclear: (Array.isArray(p.unclear) ? p.unclear : [])
        .map((u) => str(u, MAX_UNCLEAR_CHARS))
        .filter(Boolean)
        .slice(0, MAX_UNCLEAR_ITEMS),
    });
    if (problems.length >= MAX_PROBLEMS) break;
  }
  return problems;
}

/** Lỗi đáng thử lại bằng model dự phòng: hết hạn mức, quá tải, lỗi máy chủ, timeout, mạng, JSON hỏng. */
const isRetryable = (err) => err.retryable === true;

async function callGemini({ fetchImpl, apiKey, model, buffer, mime, timeoutMs }) {
  let res;
  try {
    res = await fetchImpl(GEMINI_URL(model), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data: buffer.toString("base64") } }, { text: OCR_PROMPT }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw Object.assign(new Error(`gemini ${err?.name || "network"}`), { retryable: true, kind: err?.name === "TimeoutError" ? "timeout" : "network" });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const status = res.status;
    throw Object.assign(new Error(`gemini ${status}`), { status, retryable: status === 429 || status >= 500, kind: status === 429 ? "quota" : "http" });
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text || "").join("");
  const problems = normalizeOcrResult(parseOcrJson(text));
  if (!problems) throw Object.assign(new Error("gemini json_failed"), { retryable: true, kind: "json" });
  const u = data?.usageMetadata || {};
  return { problems, usage: { prompt: u.promptTokenCount || 0, output: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) } };
}

/**
 * Đọc ảnh đề → danh sách bài. Model chính lỗi có thể thử lại (429/5xx/timeout/mạng/JSON hỏng) và còn
 * đủ thời gian → gọi model dự phòng một lần.
 * @returns {Promise<{problems: object[], meta: object}>}  ném OcrError khi không đọc được
 */
export async function readProblemsFromImage({ apiKey, buffer, mime, fetchImpl = fetch, now = Date.now, deadline = now() + OCR_BUDGET_MS }) {
  const meta = { model: OCR_MODEL, attempts: 0, fallback: false, errors: [] };
  const models = [OCR_MODEL, OCR_FALLBACK_MODEL];
  for (const model of models) {
    const timeLeft = deadline - now();
    if (meta.attempts > 0 && timeLeft < MIN_CALL_MS) break;
    meta.attempts++;
    meta.model = model;
    meta.fallback = model !== OCR_MODEL;
    try {
      const { problems, usage } = await callGemini({ fetchImpl, apiKey, model, buffer, mime, timeoutMs: Math.max(1, Math.min(PER_CALL_TIMEOUT_MS, timeLeft)) });
      return { problems, meta: { ...meta, promptTokens: usage.prompt, outputTokens: usage.output } };
    } catch (err) {
      meta.errors.push(err.kind || "error");
      if (!isRetryable(err)) break;
    }
  }
  const lastKind = meta.errors.at(-1);
  const err = lastKind === "quota" || meta.errors.every((k) => k === "quota")
    ? new OcrError(429, "ocr_busy", "Dịch vụ đọc ảnh đang bận, bạn thử lại sau ít phút nhé.")
    : new OcrError(502, "ocr_failed", "Chưa đọc được ảnh. Bạn thử chụp lại rõ hơn, hoặc gõ đề vào ô chat nhé.");
  err.meta = meta;
  throw err;
}
