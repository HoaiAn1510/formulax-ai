// Danh sách huy hiệu — dữ liệu thuần, không phụ thuộc framework (cùng quy ước với
// formulas.js/questions.js). `icon` là tên component lucide-react, được resolve thành
// component thật ở nơi render (ProgressDashboard.jsx), giữ file này độc lập framework.
// `metric` khớp với 1 trong các giá trị đã tính sẵn ở ProgressDashboard.jsx: streak hiện
// tại (từ getActivityData) và stats cộng dồn (formulasViewed/flashcardsStudied/quizzesCompleted).

export const BADGES = [
  // Chuỗi học — ngưỡng khớp STREAK_MILESTONES trong lib/supabase.js để nhất quán với
  // thông báo mốc streak đã có sẵn.
  { id: "streak-3", metric: "streak", threshold: 3, icon: "Flame", label: "Chuỗi 3 ngày", description: "Học liên tục 3 ngày" },
  { id: "streak-7", metric: "streak", threshold: 7, icon: "Flame", label: "Chuỗi 7 ngày", description: "Học liên tục 1 tuần" },
  { id: "streak-14", metric: "streak", threshold: 14, icon: "Flame", label: "Chuỗi 14 ngày", description: "Học liên tục 2 tuần" },
  { id: "streak-30", metric: "streak", threshold: 30, icon: "Flame", label: "Chuỗi 30 ngày", description: "Học liên tục 1 tháng" },
  { id: "streak-60", metric: "streak", threshold: 60, icon: "Flame", label: "Chuỗi 60 ngày", description: "Học liên tục 2 tháng" },
  { id: "streak-100", metric: "streak", threshold: 100, icon: "Flame", label: "Chuỗi 100 ngày", description: "Học liên tục 100 ngày" },

  // Quiz
  { id: "quiz-1", metric: "quizzes", threshold: 1, icon: "ClipboardList", label: "Quiz đầu tiên", description: "Hoàn thành 1 bài quiz" },
  { id: "quiz-10", metric: "quizzes", threshold: 10, icon: "ClipboardList", label: "10 bài quiz", description: "Hoàn thành 10 bài quiz" },
  { id: "quiz-50", metric: "quizzes", threshold: 50, icon: "ClipboardList", label: "50 bài quiz", description: "Hoàn thành 50 bài quiz" },

  // Flashcard
  { id: "flash-20", metric: "flashcards", threshold: 20, icon: "Layers", label: "20 thẻ", description: "Ôn 20 lượt flashcard" },
  { id: "flash-100", metric: "flashcards", threshold: 100, icon: "Layers", label: "100 thẻ", description: "Ôn 100 lượt flashcard" },
  { id: "flash-300", metric: "flashcards", threshold: 300, icon: "Layers", label: "300 thẻ", description: "Ôn 300 lượt flashcard" },

  // Công thức
  { id: "formula-10", metric: "formulas", threshold: 10, icon: "BookOpen", label: "10 công thức", description: "Xem 10 công thức" },
  { id: "formula-50", metric: "formulas", threshold: 50, icon: "BookOpen", label: "50 công thức", description: "Xem 50 công thức" },
  { id: "formula-100", metric: "formulas", threshold: 100, icon: "BookOpen", label: "100 công thức", description: "Xem 100 công thức" },
];
