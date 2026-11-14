// Đợt B2 (docs/FINDER_REASONING_PHASE_B.md): nối bộ kiểm suy luận B1 vào Finder — CHỈ chạy khi bật cờ
// FINDER_REASONING_ENABLED=1 (mặc định tắt), chỉ cho câu hỏi đầu của phiên.
//
// Bản đầu KHÔNG gọi AI: với 4 dạng thí điểm, kế hoạch giải là cố định nên backend tự lập kế hoạch (đúng
// hướng "ưu tiên bộ xử lý dạng bài xác định" của thiết kế), đưa qua verifyReasoningPlan, rồi tự dựng lời
// hướng dẫn bằng template + renderer AST. Không sửa prompt hiện hành, không tốn token. Prompt "AI đề xuất kế
// hoạch" trong tài liệu để dành cho các dạng không lập kế hoạch cố định được.
//
// Luồng: parseReasoningProblem (đọc đề CHẶT — không chắc thì trả null, Finder chạy luồng cũ) → context tin
// cậy (điều kiện Δ ≥ 0, a ≠ 0, c ≠ 0, bất đẳng thức tam giác tính bằng số hữu tỉ chính xác, chỉ dùng nội
// bộ) → plan → verify → render (ký hiệu + dữ kiện, mỗi biểu thức kết thúc bằng "= ?") → finalizeAnswer
// (toàn bộ bộ lọc hiện có là lớp kiểm cuối). Đã nhận bài mà kiểm thất bại thì KHÔNG quay sang lời giải tự
// do: trả no_formula (hoàn lượt) và ghi log.

import { verifyReasoningPlan } from "./reasoningPlan.js";
import { instantiate, sourceMatches } from "./reasoningTemplates.js";
import { sym, rat, add, mul, div, neg, pow } from "./reasoningAlgebra.js";
import { getFormula } from "./formulaCatalog.js";
import { finalizeAnswer } from "./finderAnswer.js";
import { DEFAULT_TEXT } from "./solutionGuard.js";

export const REASONING_ENABLED = () => process.env.FINDER_REASONING_ENABLED === "1";

// ─── Đọc đề ──────────────────────────────────────────────────────────────────

const plain = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();

// Dạng gọn để dò biểu thức: bỏ khoảng trắng/$, chuẩn hoá chỉ số nghiệm và ký hiệu Unicode.
function compactMath(text) {
  return String(text)
    .replace(/[²]/g, "^2").replace(/[₁]/g, "1").replace(/[₂]/g, "2").replace(/[−–]/g, "-")
    .replace(/\\left|\\right|\$|\\,|\\;|\\ /g, "")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\cdot|\\times|\*/g, "")
    .replace(/x_\{?([12])\}?/g, "x$1")
    .replace(/\^\{(\d)\}/g, "^$1")
    .replace(/\s+/g, "")
    .toLowerCase();
}

const INT = /^[+-]?\d{1,6}$/;
const coef = (raw, implicitOne) => {
  if (raw === undefined) return 0n;
  if (raw === "" || raw === "+") return implicitOne ? 1n : null;
  if (raw === "-") return implicitOne ? -1n : null;
  return INT.test(raw) ? BigInt(raw) : null;
};

/** Đề Vi-ét: đúng một phương trình ax² + bx + c = 0 hệ số nguyên, hỏi x₁² + x₂² hoặc 1/x₁ + 1/x₂. */
function parseViet(message) {
  const p = plain(message);
  if (!/nghiem/.test(p) || !/\btinh\b|gia tri|bang bao nhieu/.test(p)) return null;
  // Tham số, nhiều phương trình, hệ, chứng minh, bất phương trình: ngoài phạm vi thí điểm.
  if (/tham so|\bm\b|chung minh|bat phuong trinh|\bhe\b|tim m/.test(p)) return null;
  const c = compactMath(message);
  const eqs = [...c.matchAll(/([+-]?\d*)x\^2(?:([+-]\d*)x(?![\d^]))?([+-]\d+)?=0/g)];
  if (eqs.length !== 1) return null;
  const [whole, ra, rb, rc] = eqs[0];
  // Phần ngay trước phương trình không được là số/ngoặc/mũ (tránh khớp giữa một biểu thức dài hơn). Chữ thì được:
  // khoảng trắng đã bị bỏ nên "phương trình x^2…" thành "…trìnhx^2…".
  if (/[0-9)^]$/.test(c.slice(0, eqs[0].index))) return null;
  const a = coef(ra, true), b = rb === undefined ? 0n : coef(rb, true), cc = rc === undefined ? 0n : coef(rc, false);
  if (a === null || b === null || cc === null || a === 0n) return null;
  const rest = c.replace(whole, "");
  const sumsq = /x1\^2\+x2\^2/.test(rest);
  const recip = /\(?1\)?\/\(?x1\)?\+\(?1\)?\/\(?x2\)?/.test(rest);
  if (sumsq === recip) return null; // không hỏi gì / hỏi cả hai
  // Biểu thức nghiệm khác (x₁³, x₁ − x₂, |x₁ − x₂|, x₁²x₂…) → không chắc đề chỉ hỏi một đại lượng.
  const stripped = rest.replace(/x1\^2\+x2\^2|\(?1\)?\/\(?x1\)?\+\(?1\)?\/\(?x2\)?/g, "");
  if (/x[12]\^|x[12]-x|x[12]\+x|\|x|x1x2|x2x1|\)\^/.test(stripped)) return null;
  const delta = b * b - 4n * a * cc; // chỉ dùng nội bộ để xác lập "có nghiệm thực" — không hiển thị
  if (delta < 0n) return null;
  if (recip && cc === 0n) return null; // 1/x₁ không xác định khi có nghiệm 0
  return { kind: recip ? "viet_reciprocal" : "viet_square_sum", a, b, c: cc };
}

// Số đo cạnh: số nguyên hoặc thập phân (dấu phẩy/chấm). Trả chuỗi hiển thị + số hữu tỉ [tử, mẫu].
const NUM = String.raw`(\d{1,4}(?:[.,]\d{1,3})?)`;
const toRat = (s) => {
  const [i, f = ""] = s.replace(",", ".").split(".");
  return [BigInt(i + f), 10n ** BigInt(f.length)];
};

/** Đề tam giác: biết ba cạnh, hỏi đúng một trong r (nội tiếp) / R (ngoại tiếp). */
function parseTriangle(message) {
  const p = plain(message);
  if (!/tam giac/.test(p)) return null;
  if (!/ban kinh/.test(p)) return null;
  // Dò riêng từng loại: "bán kính nội tiếp và ngoại tiếp" chỉ có một chữ "bán kính" — hỏi cả hai thì từ chối.
  const inner = /noi tiep/.test(p);
  const outer = /ngoai tiep/.test(p);
  if (inner === outer) return null;
  // Đề kèm yêu cầu/giả thiết khác: ngoài phạm vi thí điểm (không tự dùng tính chất tam giác vuông/cân/đều).
  if (/dien tich|chu vi|duong cao|trung tuyen|phan giac|\bgoc\b|vuong|\bcan\b|\bdeu\b|chung minh|\bva (?:tinh|tim)\b/.test(p)) return null;
  const numbers = p.match(/\d+(?:[.,]\d+)?/g) || [];
  if (numbers.length !== 3) return null;
  let sides = null;
  const named = ["a", "b", "c"].map((k) => p.match(new RegExp(String.raw`(?:^|[^a-z])${k}\s*=\s*${NUM}`)));
  const seg = (re) => p.match(new RegExp(String.raw`(?:^|[^a-z])(?:${re})\s*=\s*${NUM}`));
  const segs = [seg("bc|cb"), seg("ca|ac"), seg("ab|ba")];
  const list = p.match(new RegExp(String.raw`ba canh(?: (?:co do dai|lan luot la|la|bang))?\s*:?\s*${NUM}\s*(?:cm|m|dm|mm)?\s*[,;]\s*${NUM}\s*(?:cm|m|dm|mm)?\s*(?:[,;]|va)\s*${NUM}`));
  if (named.every(Boolean)) sides = { values: named.map((m) => m[1]), labels: ["a", "b", "c"] };
  else if (segs.every(Boolean) && /tam giac abc/.test(p)) sides = { values: segs.map((m) => m[1]), labels: ["BC", "CA", "AB"] };
  else if (list) sides = { values: list.slice(1, 4), labels: null };
  if (!sides) return null;
  const r = sides.values.map(toRat);
  if (r.some(([n]) => n <= 0n)) return null;
  // Bất đẳng thức tam giác, chính xác (quy đồng). Không thoả → để luồng cũ (tiền kiểm invalid_data) xử lý.
  const L = r.reduce((l, [, d]) => l * d, 1n);
  const v = r.map(([n, d]) => (n * L) / d);
  if (!(v[0] + v[1] > v[2] && v[1] + v[2] > v[0] && v[0] + v[2] > v[1])) return null;
  return { kind: inner ? "triangle_inradius" : "triangle_circumradius", sides };
}

const FORM_SOURCES = {
  viet_square_sum: ["ds10-hethuc-viet"],
  viet_reciprocal: ["ds10-hethuc-viet"],
  triangle_inradius: ["hh10-herong", "hh10-bankinh-noitiep"],
  triangle_circumradius: ["hh10-herong", "hh10-bankinh-ngoaitiep"],
};

/** null = không phải dạng thí điểm (hoặc thẻ nguồn đã đổi, adapter tự tắt) → Finder chạy luồng cũ. */
export function parseReasoningProblem(message, { grade = null } = {}) {
  if (typeof message !== "string" || message.length > 600) return null;
  const parsed = parseViet(message) || parseTriangle(message);
  if (!parsed) return null;
  // Cả 4 dạng là kiến thức lớp 10 — học sinh lớp nào cũng dùng được, không lọc theo grade.
  void grade;
  if (!FORM_SOURCES[parsed.kind].every((id) => sourceMatches(id))) return null;
  return parsed;
}

// ─── Context tin cậy + kế hoạch cố định ──────────────────────────────────────

const symbol = (id, object, kind, role) => ({ id, object, quantity: `${kind}.${id}`, unit: kind === "triangle" ? (id === "S" ? "area" : "length") : "scalar", role });

export function buildContextAndPlan(parsed) {
  const apply = (id, formulaId, bindings, output) => ({ id, kind: "apply", formulaId, bindings, output });
  if (parsed.kind.startsWith("viet")) {
    const recip = parsed.kind === "viet_reciprocal";
    const keys = ["a", "b", "c", "x1", "x2", "S", "P", "Q"];
    const role = (k) => (k === "Q" ? "target" : ["S", "P"].includes(k) ? "intermediate" : k.startsWith("x") ? "root" : "given");
    const facts = ["real_roots", "leading_nonzero", ...(recip ? ["product_nonzero"] : [])].map((kind) => ({ object: "q1", kind }));
    const goal = recip ? add(div(rat(1), sym("x1")), div(rat(1), sym("x2"))) : add(pow(sym("x1"), 2), pow(sym("x2"), 2));
    const context = { target: "Q", symbols: keys.map((k) => symbol(k, "q1", "quadratic", role(k))), facts, goal };
    const bindings = Object.fromEntries(keys.filter((k) => k !== "Q").map((k) => [k, k]));
    const rhs = recip ? div(sym("S"), sym("P")) : add(pow(sym("S"), 2), neg(mul(rat(2), sym("P"))));
    const plan = { version: 1, target: "Q", steps: [
      apply("sum", "ds10-hethuc-viet", bindings, "S"),
      apply("product", "ds10-hethuc-viet", bindings, "P"),
      { id: "answer", kind: "derive", from: ["sum", "product"], rule: recip ? "rational_identity" : "ring_identity", lhs: sym("Q"), rhs, output: "Q" },
    ] };
    return { context, plan };
  }
  const target = parsed.kind === "triangle_inradius" ? "r" : "R";
  const keys = ["a", "b", "c", "p", "S", target];
  const role = (k) => (k === target ? "target" : ["a", "b", "c"].includes(k) ? "given" : "intermediate");
  const context = { target, symbols: keys.map((k) => symbol(k, "t1", "triangle", role(k))), facts: [{ object: "t1", kind: "valid_triangle" }] };
  const hb = { a: "a", b: "b", c: "c", p: "p", S: "S" };
  const last = target === "r"
    ? apply("radius", "hh10-bankinh-noitiep", { r: "r", S: "S", p: "p" }, "r")
    : apply("radius", "hh10-bankinh-ngoaitiep", { R: "R", a: "a", b: "b", c: "c", S: "S" }, "R");
  return { context, plan: { version: 1, target, steps: [apply("half", "hh10-herong", hb, "p"), apply("area", "hh10-herong", hb, "S"), last] } };
}

// ─── Renderer LaTeX gọn (theo độ ưu tiên phép toán) ──────────────────────────

const LABEL = { a: "a", b: "b", c: "c", x1: "x_1", x2: "x_2", S: "S", P: "P", p: "p", r: "r", R: "R" };
const PREC = { add: 1, neg: 1, mul: 2, div: 3, pow: 4, sym: 5, rat: 5, source_sqrt: 5 };

export function renderTex(e, parent = 0) {
  const wrap = (s, prec) => (prec < parent ? `\\left(${s}\\right)` : s);
  switch (e.kind) {
    case "sym": return LABEL[e.id] ?? e.id;
    case "rat": return e.denominator === "1" ? e.numerator : `\\frac{${e.numerator}}{${e.denominator}}`;
    case "add": {
      const parts = e.args.map((t, i) => {
        if (t.kind === "neg") return `${i ? " - " : "-"}${renderTex(t.arg, 2)}`;
        return `${i ? " + " : ""}${renderTex(t, 1)}`;
      });
      return wrap(parts.join(""), 1);
    }
    case "neg": return wrap(`-${renderTex(e.arg, 2)}`, 1);
    case "mul": {
      // Số đứng trước, ký hiệu viết liền (2P, abc, 4S, p(p - a)…); hai số cạnh nhau mới dùng \cdot.
      const out = [];
      e.args.forEach((t, i) => {
        const s = renderTex(t, 2); // tổng/số đối trong tích mới cần ngoặc; tích lồng tích thì không
        const prevNum = i > 0 && e.args[i - 1].kind === "rat";
        out.push(i === 0 ? s : prevNum && t.kind === "rat" ? ` \\cdot ${s}` : t.kind === "sym" && e.args[i - 1].kind === "sym" && LABEL[t.id]?.includes("_") ? ` ${s}` : s);
      });
      return wrap(out.join(""), 2);
    }
    case "div":
      if (e.numerator.kind === "neg") return wrap(`-\\frac{${renderTex(e.numerator.arg)}}{${renderTex(e.denominator)}}`, 1);
      return `\\frac{${renderTex(e.numerator)}}{${renderTex(e.denominator)}}`;
    case "pow": return `${renderTex(e.base, 4.5)}^{${e.exponent}}`;
    case "source_sqrt": return `\\sqrt{${renderTex(e.arg)}}`;
    default: throw new Error(`render_node:${e.kind}`);
  }
}

// Thay định nghĩa (S → x₁ + x₂, P → x₁x₂) để hiện bước trung gian của phép suy ra đã kiểm.
function substitute(e, defs) {
  if (e.kind === "sym") return defs[e.id] ?? e;
  if (e.args) return { ...e, args: e.args.map((t) => substitute(t, defs)) };
  if (e.kind === "div") return { ...e, numerator: substitute(e.numerator, defs), denominator: substitute(e.denominator, defs) };
  if (e.arg) return { ...e, arg: substitute(e.arg, defs) };
  if (e.base) return { ...e, base: substitute(e.base, defs) };
  return e;
}

const showNum = (raw) => String(raw).replace(".", ",");

/** Dựng câu trả lời (dạng JSON model) từ kế hoạch ĐÃ KIỂM. Chỉ ký hiệu + dữ kiện của đề, không giá trị tính ra. */
export function renderAnswer(parsed, plan, context, verified) {
  const steps = [];
  const outputs = {};
  if (parsed.kind.startsWith("viet")) {
    const given = { a: String(parsed.a), b: String(parsed.b), c: String(parsed.c) };
    for (const step of plan.steps) {
      if (step.kind !== "apply") continue;
      const t = instantiate(step, context);
      outputs[step.output] = t.rhs;
      const used = step.output === "S" ? ["a", "b"] : ["a", "c"];
      steps.push({
        title: step.output === "S" ? "Hệ thức Vi-ét: tổng hai nghiệm" : "Hệ thức Vi-ét: tích hai nghiệm",
        detail: "",
        expression: `${step.output} = ${renderTex(t.rhs)} = ${renderTex(t.displayRhs)}, \\text{ với } ${used.map((k) => `${k} = ${given[k]}`).join(", ")} \\Rightarrow ${step.output} = ?`,
      });
    }
    const last = plan.steps.at(-1);
    const goalTex = renderTex(context.goal);
    steps.unshift({
      title: "Xác định hệ số",
      detail: "Viết phương trình về dạng $ax^2 + bx + c = 0$ rồi đọc các hệ số $a$, $b$, $c$.",
      expression: `a = ${given.a}, \\quad b = ${given.b}, \\quad c = ${given.c}`,
    });
    steps.push({
      title: "Suy ra từ: Hệ thức Vi-ét",
      detail: "Biến đổi biểu thức cần tính về $S$ và $P$ rồi thay kết quả hai bước trên vào.",
      expression: `${goalTex} = ${renderTex(substitute(last.rhs, outputs))} = ${renderTex(last.rhs)} \\Rightarrow ${goalTex} = ?`,
    });
  } else {
    const { values, labels } = parsed.sides;
    const withText = ["a", "b", "c"].map((k, i) => (labels && labels[0] !== "a" ? `${k} = ${labels[i]} = ${showNum(values[i])}` : `${k} = ${showNum(values[i])}`)).join(", ");
    for (const step of plan.steps) {
      const t = instantiate(step, context);
      const f = getFormula(step.formulaId);
      const isHalf = step.id === "half";
      steps.push({
        title: isHalf ? "Nửa chu vi tam giác" : f.name,
        detail: isHalf ? "Tính nửa chu vi $p$ từ ba cạnh." : step.id === "area" ? "Thay $p$ vừa tính và ba cạnh vào công thức Hê-rông." : "Dùng diện tích $S$ và các đại lượng đã có ở trên.",
        expression: `${LABEL[step.output]} = ${renderTex(t.displayRhs)}${isHalf ? `, \\text{ với } ${withText}` : ""} \\Rightarrow ${LABEL[step.output]} = ?`,
      });
    }
  }
  return {
    type: "solution",
    formula_ids: verified.sources,
    intro: parsed.kind.startsWith("viet")
      ? "Bài này không cần tìm từng nghiệm: dùng hệ thức Vi-ét để tính tổng S và tích P, rồi đưa biểu thức cần tính về S và P."
      : "Biết ba cạnh thì tính diện tích bằng công thức Hê-rông trước, rồi dùng diện tích để tìm bán kính.",
    steps,
    reminder: "Bạn tự tính các ô ? theo thứ tự từ trên xuống nhé — kết quả bước trước dùng cho bước sau.",
  };
}

/**
 * null → không phải dạng thí điểm, nơi gọi chạy askFinder như cũ.
 * Có kết quả → { answer, reply, meta } cùng khuôn với askFinder (countsAsTurn dùng được ngay).
 */
export function answerWithReasoning(message, { grade = null } = {}) {
  const parsed = parseReasoningProblem(message, { grade });
  if (!parsed) return null;
  const meta = { model: "reasoning-b2", candidates: FORM_SOURCES[parsed.kind], attempts: 0, promptTokens: 0, completionTokens: 0, cachedTokens: 0, reasoning: { kind: parsed.kind } };
  const { context, plan } = buildContextAndPlan(parsed);
  const verified = verifyReasoningPlan(plan, context);
  meta.reasoning.status = verified.status;
  if (verified.status !== "verified") {
    meta.reasoning.reasonCode = verified.reasonCode;
    const answer = { type: "no_formula", formulaIds: [], intro: DEFAULT_TEXT.noFormulaIntro, steps: [], reminder: "" };
    return { answer, reply: answer.intro, meta: { ...meta, noticeReason: "reasoning_unverified" } };
  }
  const raw = renderAnswer(parsed, plan, context, verified);
  const checked = finalizeAnswer(raw, { message, mask: true, grade });
  // Bộ lọc cuối mà sửa/bỏ gì ở lời hướng dẫn đã kiểm = ca chặn nhầm cần xem (không tự nới bộ lọc).
  const touched = checked.meta.removedSteps?.length || checked.meta.maskedSteps?.length || checked.meta.replaced?.length || checked.meta.droppedSubstitutions || checked.meta.droppedExpressions;
  if (touched) meta.reasoning.guardChanged = true;
  return { answer: checked.answer, reply: checked.reply, meta: { ...meta, ...checked.meta } };
}
