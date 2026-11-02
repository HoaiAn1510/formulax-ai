import { BookOpen, Search, Zap, ClipboardList } from "lucide-react";
import { vietnamToday } from "./vietnamDate";

// Dữ liệu và hàm lưu trạng thái của hộp "Hôm nay bạn gặp khó khăn gì?" (components/DailyIntentModal.jsx).
export const INTENT_OPTIONS = [
  {
    id: "forgot",
    tab: "library",
    icon: BookOpen,
    color: "text-secondary bg-secondary/10",
    title: "Mình quên hoặc cần tra công thức",
    what: "Thư viện: toàn bộ công thức Toán lớp 10–12, lọc theo lớp và chủ đề. Mỗi công thức có giải thích ký hiệu, ví dụ và mẹo nhớ.",
    cta: "Mở Thư viện",
  },
  {
    id: "stuck",
    tab: "finder",
    icon: Search,
    color: "text-success bg-success/10",
    title: "Mình có một bài không biết làm",
    what: "Tìm kiếm AI: gõ hoặc chụp đề, AI chỉ ra công thức cần dùng và các bước thay dữ kiện. AI không tự tính ra đáp án thay bạn.",
    cta: "Hỏi AI một bài",
  },
  {
    id: "memorize",
    tab: "flashcard",
    icon: Zap,
    color: "text-premium bg-premium/10",
    title: "Mình muốn thuộc công thức",
    what: "Flashcard: mặt trước là tên công thức, mặt sau là công thức. App nhắc lại đúng lúc bạn sắp quên (ôn cách quãng).",
    cta: "Ôn flashcard",
  },
  {
    id: "test",
    tab: "quiz",
    icon: ClipboardList,
    color: "text-error bg-error/10",
    title: "Mình muốn thử sức xem nhớ chưa",
    what: "Kiểm tra: đề trắc nghiệm hoặc điền đáp án, chọn lớp và chủ đề, có lời giải sau khi nộp. Có thể luyện lại đúng dạng bài bạn đã hỏi AI, với số liệu mới.",
    cta: "Làm bài kiểm tra",
  },
];

export const LAST_KEY = (gid) => `formulax_last_intent_${gid || "guest"}`;
const LAST_DAY_KEY = (gid) => `formulax_last_intent_day_${gid || "guest"}`;
// Hộp hỏi mỗi lần mở app — App.jsx tự nhớ trong lượt tải trang, không còn dấu "đã hỏi" trong sessionStorage.

// localStorage có thể ném lỗi (chế độ riêng tư, bị chặn) — luôn bọc try/catch.
export function readLast(gid) {
  try { return localStorage.getItem(LAST_KEY(gid)); } catch { return null; }
}
export function writeLast(gid, id) {
  try {
    localStorage.setItem(LAST_KEY(gid), id);
    localStorage.setItem(LAST_DAY_KEY(gid), vietnamToday());
  } catch { /* bỏ qua */ }
}

// Lựa chọn của HÔM NAY (giờ Việt Nam) — Dashboard dùng để cá nhân hóa "Học tiếp" và nhiệm vụ. Chọn từ hôm
// trước thì không tính: hôm nay học sinh có thể cần việc khác. Chỉ lưu ở máy (sở thích trong ngày, không phải
// dữ liệu học tập cần đồng bộ).
export function readIntentToday(gid) {
  try {
    return localStorage.getItem(LAST_DAY_KEY(gid)) === vietnamToday() ? localStorage.getItem(LAST_KEY(gid)) : null;
  } catch { return null; }
}
