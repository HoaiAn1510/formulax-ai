// Lượt Quiz của chế độ khách. Chỉ lưu ở localStorage vì khách không có dữ liệu trên server —
// xoá localStorage là reset được, chấp nhận vì đây là giới hạn mềm cho người chưa đăng nhập.
// Tài khoản Google Free dùng cơ chế riêng (bảng quiz_daily), không đi qua file này.

export const GUEST_QUIZ_DAILY_LIMIT = 10;
const STORAGE_KEY = "formulax_guest_quiz";

// "YYYY-MM-DD" theo giờ Việt Nam — nếu dùng UTC thì lượt sẽ reset lúc 7h sáng thay vì nửa đêm.
function vietnamToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

// Luôn đọc lại từ localStorage, không cache: tab mở qua nửa đêm vẫn nhận đúng ngày mới.
function usedToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.date === vietnamToday() && Number.isFinite(saved.count)) return saved.count;
  } catch {
    // Dữ liệu hỏng thì coi như chưa dùng lượt nào hôm nay.
  }
  return 0;
}

export function getGuestQuizRemaining() {
  return Math.max(0, GUEST_QUIZ_DAILY_LIMIT - usedToday());
}

/** Trừ 1 lượt, trả về số lượt còn lại sau khi trừ. */
export function consumeGuestQuiz() {
  const count = usedToday() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: vietnamToday(), count }));
  return Math.max(0, GUEST_QUIZ_DAILY_LIMIT - count);
}
