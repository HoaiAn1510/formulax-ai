// "Bài đã hỏi" — lấy từ lịch sử AI Finder (bảng chat_sessions, hoặc localStorage với khách), không có bảng
// riêng. Mỗi bài = một tin "user" + tin "bot" ngay sau nó có câu trả lời hướng dẫn (answer.type "solution").
// File thuần, không import gì — test bằng `npm run test:asked` (scripts/test-asked-problems.mjs).

// Tối đa số bài cho một lần "Luyện lại dạng bài" (chủ dự án chốt): 5 → 3 (2026-11-01) vì mỗi câu giờ dùng 2 lần gọi
// Gemini (sinh đề + giải kiểm chéo), hạn mức free 15 lần/phút dùng chung với Tìm kiếm AI.
export const MAX_VARIANT_PICK = 3;
const MAX_TEXT = 2000; // = MAX_MESSAGE_CHARS của backend

// id tin nhắn là Date.now() lúc gửi (FormulaFinder.jsx) → dùng làm thời điểm hỏi. Không hợp lệ thì lấy giờ
// cập nhật của cuộc trò chuyện.
function askedTime(msg, session) {
  const id = Number(msg?.id);
  if (Number.isFinite(id) && id > 1e12 && id < 1e13) return id;
  const t = Date.parse(session?.updatedAt || session?.createdAt || "");
  return Number.isFinite(t) ? t : 0;
}

// Tin bot có hướng dẫn thật: định dạng mới (answer) với type solution, hoặc định dạng cũ (aiResult = một thẻ
// công thức). Tin hệ thống (lỗi, hết lượt, thông báo) và no_formula / off_topic / invalid_data bị bỏ qua.
function formulaIdsOf(bot) {
  if (!bot || bot.sender !== "bot" || bot.isError || bot.isLimitHit || bot.isNotice) return null;
  if (bot.answer) {
    if (bot.answer.type !== "solution") return null;
    return (Array.isArray(bot.answer.formulaIds) ? bot.answer.formulaIds : []).filter((id) => typeof id === "string");
  }
  if (bot.aiResult && typeof bot.aiResult.id === "string") return [bot.aiResult.id];
  return null;
}

const normalize = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * @param {{id: string, messages?: object[], updatedAt?: string, createdAt?: string}[]} sessions
 * @returns {{key: string, sessionId: string, text: string, askedAt: number, formulaIds: string[]}[]}
 *   mới nhất trước; đề trùng nhau (khác khoảng trắng / hoa thường) chỉ giữ lần hỏi gần nhất.
 */
export function extractAskedProblems(sessions, { limit = 50 } = {}) {
  const byText = new Map();
  for (const session of Array.isArray(sessions) ? sessions : []) {
    const msgs = Array.isArray(session?.messages) ? session.messages : [];
    msgs.forEach((msg, i) => {
      if (msg?.sender !== "user" || typeof msg.text !== "string" || !msg.text.trim()) return;
      const next = msgs.slice(i + 1).find((m) => m?.sender === "bot" || m?.sender === "user");
      const formulaIds = formulaIdsOf(next);
      if (!formulaIds) return;
      const item = {
        key: `${session.id}:${msg.id ?? i}`,
        sessionId: String(session.id),
        text: msg.text.trim().slice(0, MAX_TEXT),
        askedAt: askedTime(msg, session),
        formulaIds: [...new Set(formulaIds)].slice(0, 4),
      };
      const k = normalize(item.text);
      const prev = byText.get(k);
      if (!prev || item.askedAt > prev.askedAt) byText.set(k, item);
    });
  }
  return [...byText.values()].sort((a, b) => b.askedAt - a.askedAt).slice(0, limit);
}

/** Bật/tắt chọn một bài; không cho vượt MAX_VARIANT_PICK. Trả mảng key mới (giữ thứ tự chọn). */
export function togglePick(selected, key, max = MAX_VARIANT_PICK) {
  if (selected.includes(key)) return selected.filter((k) => k !== key);
  return selected.length >= max ? selected : [...selected, key];
}

/** "Hôm nay 14:05", "Hôm qua", "3 ngày trước", hoặc ngày dd/mm/yyyy. Ngày theo giờ Việt Nam. */
export function formatAskedAt(ms, now = Date.now()) {
  if (!ms) return "";
  const vnDay = (t) => Math.floor((t + 7 * 3600_000) / 86_400_000);
  const diff = vnDay(now) - vnDay(ms);
  const d = new Date(ms + 7 * 3600_000);
  const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  if (diff <= 0) return `Hôm nay ${hhmm}`;
  if (diff === 1) return "Hôm qua";
  if (diff < 7) return `${diff} ngày trước`;
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}
