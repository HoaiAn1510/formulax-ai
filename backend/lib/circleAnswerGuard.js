// Fail closed for derived circle answers. Given centres may be restated; an
// expanded equation in the question does not declare its centre coordinates.
export function unsafeCircleAnswer(answer, question) {
  if (!/đường tròn/i.test(question)) return false;
  const q = question.replace(/\s|\$/g, '').replace(/−/g, '-');
  const givenCentre = /tâm\s*[A-Z]?\s*\(\s*[+-]?\d+(?:[.,]\d+)?\s*[;,]\s*[+-]?\d+(?:[.,]\d+)?\s*\)/i.test(question);
  const text = [answer.intro, answer.reminder, ...answer.steps.flatMap(s => [s.title, s.detail, s.expression])].join('\n');
  for (const m of text.matchAll(/(?:I|[Tt]âm\s*=?)[\s]*\([^)]*\d[^)]*\)/g)) {
    if (!q.includes(m[0].replace(/\s|\$/g, '').replace(/−/g, '-'))) return true;
  }
  if (!givenCentre && /(?:tâm|hoành độ|tung độ)[^\n$]*[=:\s][+−-]?\d/i.test(text)) return true;
  if (!givenCentre && /(?:\b[ab]\s*=\s*[+−-]?\d|\bI\s*\(\s*[+−-]?\d|[Tt]âm\s*=?\s*\(\s*[+−-]?\d|\([xy]\s*[+−-]\s*\d)/.test(text)) return true;
  if (/bán kính/i.test(question) && !/R\s*=\s*\d/.test(question) && /\bR\s*=\s*[+−-]?\d/.test(text)) return true;
  const maths = [...text.matchAll(/\$([^$]+)\$/g)].map(m => m[1]);
  for (const expression of [...answer.steps.map(s => s.expression), ...maths]) {
    const e = expression.replace(/\s|\$/g, '').replace(/−/g, '-');
    if (/[xy]/.test(e) && /[=]\d+(?:[.,]\d+)?$/.test(e) && !q.includes(e)) return true;
  }
  return false;
}
