// Cá nhân hóa Dashboard "Hôm nay": câu chào, nút "Học tiếp" và thứ tự nhiệm vụ dựa trên dữ liệu đã có —
// lựa chọn trong hộp "Hôm nay bạn gặp khó khăn gì?" (utils/dailyIntent.js), chủ đề yếu / chủ đề vừa học
// (getRecommendationContext), lớp đang học, số liệu hôm nay. Không có cột Supabase mới.
// File thuần, không import gì — test bằng `npm run test:asked`.

/**
 * Hai nhiệm vụ đo được sau khi tải lại trang (todayStats.formulasViewed reset mỗi lần refresh nên không
 * dùng). Việc học sinh chọn hôm nay được đưa lên đầu và đổi lời cho đúng ý. Nhiệm vụ "Trả lời thử thách
 * hôm nay" đã bỏ cùng thẻ Thử thách trên Dashboard (chủ dự án chốt 2026-11-02).
 */
export function buildGoals({ intent = null, todayStats = {}, weakTopic = null } = {}) {
  const flash = todayStats.flashcardsStudied ?? 0;
  const quizzes = todayStats.quizzesCompleted ?? 0;
  const goals = [
    {
      key: "flashcard", tab: "flashcard", done: flash >= 5,
      label: intent === "forgot" ? "Ôn 5 flashcard để nhớ lâu công thức vừa tra" : "Ôn 5 flashcard",
      progress: `${Math.min(flash, 5)}/5`,
    },
    {
      key: "quiz", tab: "quiz", done: quizzes >= 1,
      label: weakTopic ? `Làm 1 bài kiểm tra (gợi ý: ${weakTopic})` : "Hoàn thành 1 bài kiểm tra",
      progress: `${Math.min(quizzes, 1)}/1`,
    },
  ];
  const first = intent === "memorize" || intent === "forgot" ? "flashcard" : intent === "test" ? "quiz" : null;
  return first ? [...goals.filter((g) => g.key === first), ...goals.filter((g) => g.key !== first)] : goals;
}

/** Người dùng chưa có dấu vết học nào → Dashboard hiện màn chào mừng thay cho thống kê trống. */
export function isNewLearner({ streak = 0, stats = {}, todayStats = {}, viewedCount = 0, recentTopic = null } = {}) {
  return !streak && !recentTopic && !viewedCount
    && !(stats.flashcardsStudied > 0) && !(stats.quizzesCompleted > 0)
    && !(todayStats.flashcardsStudied > 0) && !(todayStats.quizzesCompleted > 0);
}

/** Câu chào lớn ở hero. Không hứa điều app không đo được (chuỗi giữ được chỉ cần 1 hoạt động/ngày). */
export function headline({ isNew = false, goals = [], streak = 0, todayStats = {} } = {}) {
  if (isNew) return "Chào mừng bạn tới FormulaX! Mình bắt đầu từ đâu nhé?";
  const left = goals.filter((g) => !g.done).length;
  if (goals.length && left === 0) return "Xong hết nhiệm vụ hôm nay rồi. Giỏi lắm!";
  const studiedToday = (todayStats.flashcardsStudied ?? 0) > 0 || (todayStats.quizzesCompleted ?? 0) > 0;
  if (streak > 0 && !studiedToday) return `Học một chút hôm nay để giữ chuỗi ${streak} ngày nhé.`;
  // Dashboard không còn thẻ "Nhiệm vụ hôm nay" (chủ dự án bỏ 2026-11-02) → gọi không kèm goals.
  if (!goals.length) return studiedToday ? "Hôm nay bạn học tốt lắm, làm thêm chút nữa nhé." : "Hôm nay mình ôn gì nhé?";
  return `Còn ${left} nhiệm vụ hôm nay, mình làm tiếp nhé.`;
}

/**
 * Việc cho nút "Học tiếp".
 * @returns {{ kicker: string, title: string, sub: string, tab: string, formula?: object }}
 *   formula có giá trị → mở thẻ công thức đó; không thì chuyển sang tab.
 */
export function nextStep({ intent = null, weakTopics = [], recentTopic = null, userGrade = null, formula = null, dueCount = 0 } = {}) {
  const weak = weakTopics?.[0] || null;
  if (intent === "stuck") {
    return { kicker: "Bạn có một bài chưa biết làm", title: "Hỏi AI một bài", sub: "Gõ hoặc chụp đề, AI chỉ công thức và các bước, bạn tự tính.", tab: "finder" };
  }
  if (intent === "memorize") {
    return {
      kicker: "Bạn muốn thuộc công thức", title: "Ôn flashcard",
      sub: dueCount > 0 ? `${dueCount} thẻ đến hạn ôn hôm nay.` : "Lật thẻ, tự nhớ công thức rồi chấm mình nhớ tới đâu.",
      tab: "flashcard",
    };
  }
  if (intent === "test") {
    return {
      kicker: "Bạn muốn thử sức", title: weak ? `Kiểm tra chủ đề ${weak}` : "Làm một bài kiểm tra",
      sub: "Trắc nghiệm có lời giải, hoặc luyện lại đúng dạng bài bạn đã hỏi AI.", tab: "quiz",
    };
  }
  if (formula) {
    const kicker = weak && formula.topic === weak ? `Chủ đề còn yếu · ${weak}`
      : recentTopic && formula.topic === recentTopic ? `Đang học · ${recentTopic}`
        : userGrade && formula.grade === userGrade ? `Gợi ý cho lớp ${userGrade}` : "Gợi ý hôm nay";
    return { kicker, title: formula.name, sub: `${formula.topic} · Lớp ${formula.grade}`, tab: "library", formula };
  }
  return { kicker: "Gợi ý hôm nay", title: "Mở thư viện công thức", sub: "Lọc theo lớp và chủ đề bạn đang học.", tab: "library" };
}

/** 7 ngày gần nhất (cũ → mới, ngày cuối là hôm nay) và ngày đó có học không. `today` dạng "YYYY-MM-DD". */
export function lastSevenDays(activityDates = [], today) {
  const set = new Set(activityDates);
  const [y, m, d] = String(today).split("-").map(Number);
  const names = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return Array.from({ length: 7 }, (_, k) => {
    const dt = new Date(Date.UTC(y, m - 1, d - (6 - k)));
    const iso = dt.toISOString().slice(0, 10);
    return { date: iso, label: names[dt.getUTCDay()], active: set.has(iso), isToday: k === 6 };
  });
}
