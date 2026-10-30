import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { unsafeCircleAnswer } from '../lib/circleAnswerGuard.js';
import { finalizeAnswer } from '../lib/finderAnswer.js';
import { parseModelJson } from '../lib/solutionGuard.js';

const answerWith = (detail) => ({ intro: '', reminder: '', steps: [{ title: 'Xác định dữ kiện', detail, expression: '' }] });

// Ca 9 của bộ chấm (2026-10-30): đề chỉ viết "bán kính 2", AI nhắc lại dữ kiện "R = 2" và bị chặn nhầm.
test('đề cho bán kính bằng số (không có "R =") thì nhắc lại đúng giá trị đó không bị chặn', () => {
  assert.equal(unsafeCircleAnswer(answerWith('Đề cho tâm $I(a; b)$ với $a = 2$, $b = 1$ và bán kính $R = 2$.'), 'Viết phương trình đường tròn tâm I(2; 1), bán kính 2.'), false);
  const q = 'Viết phương trình đường tròn tâm I(2; 1), bán kính bằng 2,5 cm.';
  assert.equal(unsafeCircleAnswer(answerWith('Đề cho bán kính $R = 2,5$.'), q), false, 'dấu phẩy');
  assert.equal(unsafeCircleAnswer(answerWith('Đề cho bán kính $R = 2.5$.'), q), false, 'dấu chấm');
  assert.equal(unsafeCircleAnswer(answerWith('Đề cho bán kính $R = 5$.'), 'Viết phương trình đường tròn tâm I(2; 1), bán kính là 5.'), false);
});

test('bán kính khác giá trị đề cho vẫn bị chặn', () => {
  assert.equal(unsafeCircleAnswer(answerWith('Bán kính $R = 3$.'), 'Viết phương trình đường tròn tâm I(2; 1), bán kính 2.'), true);
  assert.equal(unsafeCircleAnswer(answerWith('Bán kính $R = 3$.'), 'Viết phương trình đường tròn tâm I(2; 1), bán kính bằng 2,5 cm.'), true);
  assert.equal(unsafeCircleAnswer(answerWith('Bán kính $R = 2$.'), 'Viết phương trình đường tròn tâm I(2; 1), bán kính bằng 2,5 cm.'), true);
});

test('đề không cho bán kính (phải tìm) mà AI viết R = số vẫn bị chặn', () => {
  const q = 'Tìm tâm và bán kính đường tròn x² + y² - 4x + 6y - 12 = 0';
  assert.equal(unsafeCircleAnswer(answerWith('Bán kính $R = 5$.'), q), true);
  assert.equal(unsafeCircleAnswer(answerWith('Bán kính $R = 5$.'), 'Cho đường tròn tâm I(2; 1). Tìm bán kính đường tròn đi qua A(5; 5).'), true);
});

test('đề có "R = số" như cũ: nhắc lại không bị chặn', () => {
  assert.equal(unsafeCircleAnswer(answerWith('Đề cho bán kính $R = 4$.'), 'Viết phương trình đường tròn có tâm I(2; -3) và bán kính R = 4'), false);
});

test('câu trả lời thật của Gemini cho ca 9 (đề "bán kính 2") đi qua finalizeAnswer thành solution', () => {
  const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/eval-20261030-case9-circle.json', import.meta.url), 'utf8'));
  const out = finalizeAnswer(parseModelJson(fx.raw), { message: fx.message, mask: true, grade: 10 });
  assert.equal(out.meta.circleRejected, undefined);
  assert.equal(out.answer.type, 'solution');
  assert.deepEqual(out.answer.formulaIds, ['hh10-duongtron-phuongtrinh']);
  assert.ok(out.answer.steps.some((s) => /\?/.test(s.expression)), 'bước cuối còn ô ?');
});
