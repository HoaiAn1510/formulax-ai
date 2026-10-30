// Only coordinate-circle equations need the centre/equation fail-closed guard.
// A triangle's incircle/circumcircle radius is not a coordinate-circle task.
export function isCoordinateCircleTask(question) {
  if (!/đường tròn/i.test(question) || /đường tròn lượng giác/i.test(question)) return false;
  const asksEquation = /(?:viết|lập|tìm|xác định)\s+phương trình\s+(?:của\s+)?đường tròn/i.test(question);
  const givenCentre = /tâm\s*[A-Z]?\s*\(\s*[+-]?\d+(?:[.,]\d+)?\s*[;,]\s*[+-]?\d+(?:[.,]\d+)?\s*\)/i.test(question);
  const hasEquation = /(?:\(\s*x[^()]*\)|x)\s*(?:\^\s*\{?2\}?|²)/i.test(question)
    && /(?:\(\s*y[^()]*\)|y)\s*(?:\^\s*\{?2\}?|²)/i.test(question)
    && /=/.test(question);
  return asksEquation || givenCentre || hasEquation;
}

// "2,5" và "2.5" là cùng một số; dấu trừ kiểu Unicode đổi về "-".
const radiusValue = (s) => Math.abs(Number(s.replace(/−/g, '-').replace(',', '.')));

// Bán kính đề cho bằng số ngay sau chữ "bán kính" (có thể kèm "là", "bằng", "=").
function givenRadii(question) {
  const values = [...question.matchAll(/bán kính\s*(?:là|bằng|=)?\s*(?:R\s*=?\s*)?([+−-]?\d+(?:[.,]\d+)?)/gi)].map(m => radiusValue(m[1]));
  return new Set(values);
}

// Fail closed for derived circle answers. Given centres may be restated; an
// expanded equation in the question does not declare its centre coordinates.
export function unsafeCircleAnswer(answer, question) {
  if (!isCoordinateCircleTask(question)) return false;
  const q = question.replace(/\s|\$/g, '').replace(/−/g, '-');
  const givenCentre = /tâm\s*[A-Z]?\s*\(\s*[+-]?\d+(?:[.,]\d+)?\s*[;,]\s*[+-]?\d+(?:[.,]\d+)?\s*\)/i.test(question);
  const text = [answer.intro, answer.reminder, ...answer.steps.flatMap(s => [s.title, s.detail, s.expression])].join('\n');
  for (const m of text.matchAll(/(?:I|[Tt]âm\s*=?)[\s]*\([^)]*\d[^)]*\)/g)) {
    if (!q.includes(m[0].replace(/\s|\$/g, '').replace(/−/g, '-'))) return true;
  }
  if (!givenCentre && /(?:tâm|hoành độ|tung độ)[^\n$]*[=:\s][+−-]?\d/i.test(text)) return true;
  if (!givenCentre && /(?:\b[ab]\s*=\s*[+−-]?\d|\bI\s*\(\s*[+−-]?\d|[Tt]âm\s*=?\s*\(\s*[+−-]?\d|\([xy]\s*[+−-]\s*\d)/.test(text)) return true;
  // Đề chỉ viết "bán kính 2" / "bán kính bằng 2,5 cm" (không có "R =") thì nhắc lại đúng giá trị đó là dữ kiện,
  // không phải bán kính AI tự tính (chạy thật 2026-10-30, ca 9: bị chặn nhầm 3/3 lần).
  if (/bán kính/i.test(question) && !/R\s*=\s*\d/.test(question)) {
    const given = givenRadii(question);
    for (const m of text.matchAll(/\bR\s*=\s*([+−-]?\d+(?:[.,]\d+)?)/g)) if (!given.has(radiusValue(m[1]))) return true;
  }
  const maths = [...text.matchAll(/\$([^$]+)\$/g)].map(m => m[1]);
  for (const expression of [...answer.steps.map(s => s.expression), ...maths]) {
    const e = expression.replace(/\s|\$/g, '').replace(/−/g, '-');
    if (/[xy]/.test(e) && /[=]\d+(?:[.,]\d+)?$/.test(e) && !q.includes(e)) return true;
  }
  return false;
}
