import { test } from "node:test";
import assert from "node:assert/strict";
import { FINDER_SYSTEM_PROMPT } from "../lib/finderPrompt.js";
import { finalizeAnswer } from "../lib/finderAnswer.js";
import { getFormula } from "../lib/formulaCatalog.js";

const R = String.raw;

test("prompt: kiến thức nền THCS chỉ gồm tổng ba góc và Pytago; ngoài ra mọi công thức lấy từ thư viện", () => {
  const rule = FINDER_SYSTEM_PROMPT.split("\n").find((l) => l.startsWith("1c."));
  assert.ok(rule, "thiếu quy tắc 1c");
  assert.match(rule, /CHỈ gồm đúng hai điều/);
  assert.match(rule, /tổng ba góc trong tam giác bằng 180°/);
  assert.match(rule, /định lý Pytago trong tam giác vuông/);
  assert.match(rule, /Ngoài hai điều này, mọi công thức vẫn phải lấy từ THƯ VIỆN/);
  assert.match(rule, /không ghi vào formula_ids/);
});

test("không thêm tổng ba góc / Pytago vào formulas.js (chỉ nằm trong prompt)", () => {
  for (const id of ["hh10-tong-ba-goc", "hh8-pytago", "hh10-pytago"]) assert.equal(getFormula(id), null);
});

test("bộ lọc 'không tính': 180° của tổng ba góc là số có sẵn — không bị coi là số AI tự tính", () => {
  const parsed = {
    type: "solution", formula_ids: ["hh10-dinhly-sin"], intro: "Bài này dùng định lý sin.",
    steps: [
      { title: "Tìm góc A", detail: "Tổng ba góc trong tam giác bằng $180^\\circ$. Bạn tự tính $A$.", expression: R`A = 180^\circ - B - C, \text{ với } B = 45^\circ, C = 75^\circ \Rightarrow A = ?` },
      { title: "Áp dụng định lý sin", detail: "Bạn tự tính $AC$.", expression: R`\frac{AC}{\sin B} = \frac{BC}{\sin A}, \text{ với } BC = 10 \Rightarrow AC = ?` },
    ],
    reminder: "Bạn tự tính các ô ? nhé!",
  };
  const { answer, meta } = finalizeAnswer(parsed, { message: "Cho tam giác ABC có BC = 10, góc B = 45°, góc C = 75°. Tính AC", mask: false });
  assert.deepEqual(meta.removedSteps, []);
  assert.deepEqual(meta.maskedSteps, []);
  assert.match(answer.steps[0].expression, /180\^\\circ - B - C/);
});

test("bộ lọc vẫn bắt góc đã tính ra (A = 60°) dù có kiến thức nền", () => {
  const parsed = {
    type: "solution", formula_ids: ["hh10-dinhly-sin"], intro: "Dùng định lý sin.",
    steps: [{ title: "Tìm góc A", detail: "", expression: R`A = 180^\circ - 45^\circ - 75^\circ = 60^\circ` }],
    reminder: "",
  };
  const { meta } = finalizeAnswer(parsed, { message: "Cho tam giác ABC có BC = 10, góc B = 45°, góc C = 75°. Tính AC", mask: false });
  assert.ok([...meta.removedSteps, ...meta.maskedSteps].flatMap((s) => s.leaked).includes("60"));
});
