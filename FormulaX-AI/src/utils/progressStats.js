// Số liệu trang Tiến độ học tập (views/ProgressDashboard.jsx). Hàm thuần — test bằng `npm run test:asked`.
// Ngày là chuỗi "YYYY-MM-DD" theo giờ Việt Nam (utils/vietnamDate.js).
import { shiftDay } from "./vietnamDate.js";

// Khoảng thời gian xem: 7 ngày, 30 ngày, hoặc toàn bộ lịch sử đã tải (getDailyHistory: 300 bài quiz gần nhất).
export const RANGES = [
  { id: "7", label: "7 ngày", days: 7 },
  { id: "30", label: "30 ngày", days: 30 },
  { id: "all", label: "Tất cả", days: null },
];

// Nhãn quiz_results không phải chủ đề thật — không đưa vào "Hiệu suất theo chủ đề" / "chủ đề yếu".
const NOT_A_TOPIC = new Set(["Đề thi THPT", "Tổng hợp"]);

/** Các ngày (của getDailyHistory) nằm trong khoảng; `day` (nếu có) = chỉ đúng ngày đó. */
export function daysInScope(dailyHistory, { rangeId = "30", day = null, today }) {
  const list = Array.isArray(dailyHistory) ? dailyHistory : [];
  if (day) return list.filter((d) => d.date === day);
  const range = RANGES.find((r) => r.id === rangeId) || RANGES[1];
  if (!range.days) return list;
  const from = shiftDay(today, -(range.days - 1));
  return list.filter((d) => d.date >= from && d.date <= today);
}

/** Gộp số liệu của các ngày: số bài, số câu đúng/tổng, độ chính xác (%), số thẻ đã ôn, hiệu suất theo chủ đề. */
export function summarize(days) {
  const quizzes = days.flatMap((d) => d.quizzes || []);
  const correct = quizzes.reduce((a, q) => a + (q.questionsCorrect || 0), 0);
  const total = quizzes.reduce((a, q) => a + (q.questionsTotal || 0), 0);
  const byTopic = {};
  quizzes.forEach((q) => {
    if (!q.topic || NOT_A_TOPIC.has(q.topic)) return;
    byTopic[q.topic] ||= { correct: 0, total: 0 };
    byTopic[q.topic].correct += q.questionsCorrect || 0;
    byTopic[q.topic].total += q.questionsTotal || 0;
  });
  const topics = Object.entries(byTopic)
    .filter(([, v]) => v.total > 0)
    .map(([topic, v]) => ({ topic, correct: v.correct, total: v.total, rate: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.rate - b.rate);
  return {
    quizCount: quizzes.length,
    correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : null,
    cardsReviewed: days.reduce((a, d) => a + (d.flashcardIds?.length || 0), 0),
    topics,
  };
}

/** Số ngày có học trong 7 ngày gần nhất (kể cả hôm nay). */
export function studiedDaysLast7(activityDates, today) {
  const from = shiftDay(today, -6);
  return new Set((activityDates || []).filter((d) => d >= from && d <= today)).size;
}

/**
 * Huy hiệu: giá trị hiện tại của từng chỉ số + mốc kế tiếp (huy hiệu chưa mở có ngưỡng thấp nhất) của mỗi chỉ số.
 * badges: [{ id, metric, threshold, label, ... }] (data/badges.js).
 */
export function badgeProgress(badges, values) {
  const withState = badges.map((b) => ({ ...b, value: values[b.metric] ?? 0, unlocked: (values[b.metric] ?? 0) >= b.threshold }));
  const next = [];
  const seen = new Set();
  [...withState]
    .filter((b) => !b.unlocked)
    .sort((a, b) => a.threshold - b.threshold)
    .forEach((b) => { if (!seen.has(b.metric)) { seen.add(b.metric); next.push(b); } });
  return { all: withState, unlocked: withState.filter((b) => b.unlocked), next };
}
