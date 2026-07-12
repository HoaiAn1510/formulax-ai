// SM-2 rút gọn (2 outcome thay vì thang 0-5) — khớp với 2 nút chấm điểm hiện có của Flashcard
// ("Cần ôn thêm" / "Nhớ rồi"). Lịch ôn: 1 ngày → 3 ngày → interval * easeFactor.
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export function computeNextReview(prevProgress, remembered) {
  const repetitions = prevProgress?.repetitions || 0;
  const easeFactor = prevProgress?.easeFactor || DEFAULT_EASE_FACTOR;

  let nextRepetitions, intervalDays, nextEaseFactor;

  if (remembered) {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) intervalDays = 1;
    else if (nextRepetitions === 2) intervalDays = 3;
    else intervalDays = Math.round((prevProgress?.intervalDays || 1) * easeFactor);
    nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + 0.1);
  } else {
    nextRepetitions = 0;
    intervalDays = 1;
    nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    repetitions: nextRepetitions,
    intervalDays,
    easeFactor: nextEaseFactor,
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

// Sắp xếp lại 1 bộ thẻ: quá hạn/đến hạn lên đầu (quá hạn lâu nhất trước), rồi thẻ mới
// (chưa chấm điểm lần nào), rồi thẻ chưa đến hạn (gần đến hạn nhất trước). Không ẩn thẻ nào.
export function sortFormulaIdsByDue(formulaIds, progressMap) {
  const now = Date.now();
  return formulaIds
    .map(id => {
      const p = progressMap[id];
      if (!p) return { id, category: 1, sortTime: 0 };
      const due = new Date(p.nextReviewAt).getTime();
      return due <= now ? { id, category: 0, sortTime: due } : { id, category: 2, sortTime: due };
    })
    .sort((a, b) => a.category - b.category || a.sortTime - b.sortTime)
    .map(x => x.id);
}

// Gộp thẻ đến hạn (ưu tiên quá hạn lâu nhất) + thẻ mới từ toàn bộ formulaIds truyền vào,
// giới hạn số thẻ mỗi phiên để không quá tải.
export function getDueReviewQueue(formulaIds, progressMap, cap = 20) {
  const now = Date.now();
  const due = [];
  const fresh = [];
  formulaIds.forEach(id => {
    const p = progressMap[id];
    if (!p) { fresh.push(id); return; }
    const dueTime = new Date(p.nextReviewAt).getTime();
    if (dueTime <= now) due.push({ id, dueTime });
  });
  due.sort((a, b) => a.dueTime - b.dueTime);
  return [...due.map(d => d.id), ...fresh].slice(0, cap);
}
