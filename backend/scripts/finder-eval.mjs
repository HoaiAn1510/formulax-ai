// Bộ chấm tự động AI Finder trên Gemini: đo (1) có LỘ ĐÁP ÁN cho học sinh không, (2) có chọn ĐÚNG CÔNG THỨC
// thư viện không. CHỈ ĐO — không sửa prompt hay bộ lọc. Dùng:
//   GEMINI_EVAL_API_KEY=... node scripts/finder-eval.mjs [--repeat N] [--gap GIÂY] [--only 1,5,7]
//   node scripts/finder-eval.mjs --check      (không cần key, không gọi API: kiểm tra bộ ca + hàm chuẩn hoá)
// CHỈ dùng key chấm riêng GEMINI_EVAL_API_KEY (dự án Google khác production). Lấy từ biến môi trường, không có
// thì đọc đúng MỘT dòng đó trong backend/.env; thiếu cả hai thì dừng. Không bao giờ dùng GEMINI_API_KEY (nếu hai
// key trùng nhau thì dừng). Không in key; mọi đầu ra và báo cáo đều đã lọc key. Báo cáo ghi ở scripts/out/ (gitignore).
// Câu trả lời gửi AI CHỈ gồm đề + lớp — `answers`/`forbidden`/`expectedAnyOf` không bao giờ rời script này.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGeminiClient } from "../lib/geminiChat.js";
import { askFinder, noFormulaReason } from "../lib/finderAnswer.js";
import { FINDER_MODEL, FINDER_FALLBACK_MODEL } from "../lib/finderPrompt.js";
import { getFormula } from "../lib/formulaCatalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIN_GAP_S = 5; // 15 RPM mỗi model ở gói free: cách nhau ≥ 5 giây để không tự gây 429

// ─── Chuẩn hoá để so chuỗi: bỏ khoảng trắng, $, \; \frac{a}{b} → a/b; x_{1} → x_1; 2,5 → 2.5 ──────────────────
// Dùng CHUNG cho chuỗi cấm và văn bản hiển thị nên hai dạng viết cùng nghĩa ("\frac{1}{6}" / "1/6") so ra như nhau.
export function normalize(text) {
  let s = String(text ?? "")
    .replace(/[−–]/g, "-")
    .replace(/[·⋅×]/g, "")
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, "")
    .replace(/\\(?:cdot|times)(?![a-zA-Z])/g, "")
    .replace(/\\[dt]frac(?![a-zA-Z])/g, "\\frac")
    .replace(/\\[,;:! ]/g, "")
    .replace(/\$/g, "")
    .replace(/\s+/g, "");
  const simple = /^-?[\w.^\\]+$/;
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${simple.test(a) ? a : `(${a})`}/${simple.test(b) ? b : `(${b})`}`);
  }
  return s
    .replace(/([_^])\{([^{}]*)\}/g, "$1$2")
    .replace(/\{,\}/g, ".")
    .replace(/(\d),(?=\d)/g, "$1.")
    .replace(/\\/g, "");
}

/**
 * Các chuỗi cấm xuất hiện trong `text` (so sau chuẩn hoá), kèm đoạn ngữ cảnh để người đọc phân biệt trúng thật / trùng
 * ngẫu nhiên. `embedded` = MỌI lần khớp đều lọt giữa một con số / biểu thức dài hơn ("y=3" trong "y=3/1", "10" trong
 * "100"): chỉ là gợi ý để đọc, KHÔNG làm đổi số `finalLeak` (vẫn đếm mọi lần khớp chuỗi).
 */
export function forbiddenHits(text, forbidden) {
  const hay = normalize(text);
  return forbidden.flatMap((f) => {
    const needle = normalize(f);
    if (!needle) return [];
    const spots = [];
    for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, at + 1)) spots.push(at);
    if (!spots.length) return [];
    const embedded = spots.every((at) => {
      const before = hay[at - 1] ?? "", after = hay.slice(at + needle.length, at + needle.length + 2);
      return (/\d/.test(needle[0]) && /[\d.]/.test(before)) || /^(?:\d|\/|\^|\.\d)/.test(after);
    });
    const at = spots[0];
    return [{ forbidden: f, embedded, context: hay.slice(Math.max(0, at - 18), at + needle.length + 18) }];
  });
}

// ─── Nạp bộ ca ──────────────────────────────────────────────────────────────────────────────────────
function loadCases() {
  const file = path.join(here, "finder-eval-cases.json");
  const { cases } = JSON.parse(fs.readFileSync(file, "utf8"));
  return cases;
}

/** Kiểm tra cấu trúc bộ ca + id công thức có thật. Trả về danh sách lỗi (rỗng = ổn). */
export function validateCases(cases) {
  const errors = [];
  const ids = new Set();
  for (const c of cases) {
    const where = `ca ${c.id}`;
    if (ids.has(c.id)) errors.push(`${where}: id trùng`);
    ids.add(c.id);
    if (![10, 11, 12].includes(c.grade)) errors.push(`${where}: grade phải là 10/11/12`);
    if (!c.question) errors.push(`${where}: thiếu question`);
    if (!Array.isArray(c.answers) || !c.answers.length) errors.push(`${where}: thiếu answers`);
    if (!Array.isArray(c.forbidden) || !c.forbidden.length) errors.push(`${where}: thiếu forbidden`);
    for (const f of c.forbidden || []) if (!normalize(f)) errors.push(`${where}: chuỗi cấm rỗng sau chuẩn hoá`);
    for (const f of c.forbidden || []) if (normalize(c.question).includes(normalize(f))) errors.push(`${where}: chuỗi cấm "${f}" có sẵn trong đề (không phải kết quả)`);
    for (const id of [...(c.expectedAnyOf || []), ...(c.expectedAllOf || [])]) if (!getFormula(id)) errors.push(`${where}: id công thức không có trong thư viện: ${id}`);
    if (!c.expectedAnyOf?.length) errors.push(`${where}: expectedAnyOf rỗng — cần chủ dự án xác nhận id công thức`);
  }
  return errors;
}

function selfTest() {
  const eq = (a, b, label) => { if (a !== b) throw new Error(`${label}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); };
  eq(normalize("$$x_{1} = \\frac{-5}{2}$$"), "x_1=-5/2", "frac + chỉ số dưới");
  eq(normalize("R = 2,5"), normalize("R = 2.5"), "dấu phẩy thập phân");
  eq(normalize("x_1 \\cdot x_2 = 6"), "x_1x_2=6", "\\cdot");
  eq(normalize("y = \\frac{3x + 1}{x + 2}"), "y=(3x+1)/(x+2)", "phân số có phép cộng được bọc ngoặc");
  eq(normalize("\\frac{\\pi}{6}+k2\\pi"), "pi/6+k2pi", "lệnh LaTeX trong phân số");
  eq(forbiddenHits("Vậy $S = \\frac{1}{6}$", ["\\frac{1}{6}"]).length, 1, "bắt \\frac{1}{6}");
  eq(forbiddenHits("Xác suất là 1/6.", ["\\frac{1}{6}"]).length, 1, "bắt 1/6 dù chuỗi cấm viết dạng \\frac");
  eq(forbiddenHits("y = \\frac{3x+1}{x+2}", ["y=3"]).length, 0, "không bắt nhầm y=3 trong y=(3x+1)/(x+2)");
  eq(forbiddenHits("$x_1 + x_2 = -\\frac{b}{a}$", ["x_1+x_2=5"]).length, 0, "Vi-ét dạng ký hiệu không bị coi là lộ");
  eq(forbiddenHits("$x_1 + x_2 = 5$", ["x_1+x_2=5"]).length, 1, "Vi-ét đã thay số bị coi là lộ");
  eq(forbiddenHits("$y = \\frac{3}{1} \\Rightarrow y = ?$", ["y=3"])[0]?.embedded, true, "y=3 nằm trong y=3/1 → embedded");
  eq(forbiddenHits("Vậy $y = 3$.", ["y=3"])[0]?.embedded, false, "y=3 đứng riêng → không embedded");
  eq(forbiddenHits("có 100 cách", ["10"])[0]?.embedded, true, "10 trong 100 → embedded");
  eq(forbiddenHits("có 10 cách, hoặc 100", ["10"])[0]?.embedded, false, "một lần đứng riêng thì không embedded");
}

// ─── Khoá ───────────────────────────────────────────────────────────────────────────────────────────
function readEnvFile(name) {
  try {
    const line = fs.readFileSync(path.join(here, "..", ".env"), "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}

// ─── Tham số ────────────────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };

const cases = loadCases();
const caseErrors = validateCases(cases);
selfTest();
if (flag("check")) {
  if (caseErrors.length) { console.error(caseErrors.join("\n")); process.exit(1); }
  console.log(`bộ ca hợp lệ (${cases.length} ca, mọi id công thức có thật) · hàm chuẩn hoá qua self-test`);
  process.exit(0);
}
if (caseErrors.length) { console.error("Bộ ca có lỗi — dừng:\n" + caseErrors.join("\n")); process.exit(1); }

const key = process.env.GEMINI_EVAL_API_KEY || readEnvFile("GEMINI_EVAL_API_KEY");
if (!key) {
  console.error("Thiếu GEMINI_EVAL_API_KEY — dừng. (Không dùng GEMINI_API_KEY của production để chấm.)");
  process.exit(1);
}
const prodKey = process.env.GEMINI_API_KEY || readEnvFile("GEMINI_API_KEY");
if (prodKey && prodKey === key) {
  console.error("GEMINI_EVAL_API_KEY trùng GEMINI_API_KEY của production — dừng (hạn mức dùng chung với học sinh thật).");
  process.exit(1);
}
const scrub = (s) => String(s ?? "").split(key).join("[KEY]");

const repeat = Math.max(1, Number(opt("repeat", 1)) || 1);
const gapS = Math.max(MIN_GAP_S, Number(opt("gap", MIN_GAP_S)) || MIN_GAP_S);
const only = opt("only", "") ? new Set(opt("only", "").split(",").map(Number)) : null;
const selected = cases.filter((c) => !only || only.has(c.id));

// ─── Client, bọc để lấy văn bản THÔ model trả lần đầu (trước bộ lọc) — không sửa code trong lib/ ──────────
const base = createGeminiClient({ apiKey: key, thinkingLevel: process.env.FINDER_GEMINI_THINKING_LEVEL || undefined });
let rawOutputs = [];
const client = { ...base, chat: { completions: { create: async (params, opts) => {
  const res = await base.chat.completions.create(params, opts);
  rawOutputs.push(res.choices?.[0]?.message?.content ?? "");
  return res;
} } } };

const BLANK = /\$[^$]*\?[^$]*\$|=\s*\?(?=[\s.,;:)]|$)/u; // cùng cách server nhận ra "ô ?" trong phần chữ
const hasBlank = (step) => String(step?.expression || "").includes("?") || [step?.title, step?.detail].some((p) => BLANK.test(String(p || "")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCase(c, rep) {
  rawOutputs = [];
  const started = Date.now();
  const rec = { caseId: c.id, repeat: rep, grade: c.grade, question: c.question };
  try {
    const { answer, reply, meta } = await askFinder({ groq: client, message: c.question, grade: c.grade });
    const steps = answer.steps || [];
    const shown = [answer.intro, ...steps.flatMap((s) => [s.title, s.detail, s.expression]), answer.reminder, reply].join("\n");
    const removed = meta.removedSteps?.length || 0, masked = meta.maskedSteps?.length || 0, replaced = meta.replaced?.length || 0;
    const ids = answer.formulaIds || [];
    Object.assign(rec, {
      ms: Date.now() - started, type: answer.type,
      noticeReason: answer.type === "no_formula" || answer.type === "invalid_data" ? (meta.noticeReason || noFormulaReason(meta)) : null,
      model: meta.model ?? null, fallback: meta.fallback?.reason ?? null, attempts: meta.attempts ?? null,
      promptTokens: meta.promptTokens ?? null, completionTokens: meta.completionTokens ?? null,
      candidates: meta.candidates ?? null, rawIds: meta.rawIds ?? null, formulaIds: ids, steps: steps.length,
      truncated: Boolean(meta.truncated), jsonFailed: Boolean(meta.jsonFailed), baseKnowledge: meta.baseKnowledge ?? null,
      rawLeak: Boolean(meta.retriedForLeaks), rawLeaked: meta.retriedForLeaks?.leaked ?? [],
      rewriteError: meta.retriedForLeaks?.error ?? null, stillLeakedAfterRewrite: meta.retriedForLeaks?.stillLeaked ?? [],
      rawForbiddenHits: forbiddenHits(rawOutputs[0] ?? "", c.forbidden),
      guardTouched: removed + masked + replaced > 0, guard: { removed, masked, replaced },
      finalLeak: forbiddenHits(shown, c.forbidden),
      endsWithBlank: steps.length ? hasBlank(steps.at(-1)) : null, blankAnywhere: steps.length ? steps.some(hasBlank) : null,
      formulaOk: ids.some((id) => c.expectedAnyOf.includes(id)),
      formulaAllOk: c.expectedAllOf ? c.expectedAllOf.every((id) => ids.includes(id)) : null,
      expectedInCandidates: (meta.candidates || []).some((id) => c.expectedAnyOf.includes(id)),
      aiNote: scrub(meta.aiNote ?? "").slice(0, 200) || null,
      reply: scrub(reply),
    });
  } catch (err) {
    Object.assign(rec, { ms: Date.now() - started, type: "error", error: `${err?.status ?? err?.code ?? err?.name ?? "error"}: ${scrub(err?.message).slice(0, 200)}` });
  }
  return rec;
}

// ─── Chạy ───────────────────────────────────────────────────────────────────────────────────────────
console.log(`finder-eval · model chính ${FINDER_MODEL} · dự phòng ${FINDER_FALLBACK_MODEL} · ${selected.length} ca × ${repeat} lần · cách nhau ${gapS}s`);
const results = [];
const total = selected.length * repeat;
for (let rep = 1; rep <= repeat; rep++) {
  for (const c of selected) {
    const rec = await runCase(c, rep);
    results.push(rec);
    console.log(`[${results.length}/${total}] ca ${String(c.id).padStart(2)} · ${rec.type}${rec.type === "error" ? " " + rec.error : ""} · ${rec.ms}ms · ${rec.model ?? "-"}${rec.fallback ? " (dự phòng:" + rec.fallback + ")" : ""} · ids=${(rec.formulaIds || []).join(",") || "-"} · rawLeak=${rec.rawLeak ? "có" : "không"} · finalLeak=${rec.finalLeak?.length ?? "-"}`);
    if (results.length < total) await sleep(gapS * 1000);
  }
}

// ─── Tóm tắt ────────────────────────────────────────────────────────────────────────────────────────
const count = (pred) => results.filter(pred).length;
const answered = results.filter((r) => r.type !== "error" && !r.jsonFailed);
const solutions = results.filter((r) => r.type === "solution");
const withExpected = results.filter((r) => r.type !== "error");
const msList = results.map((r) => r.ms).filter(Number.isFinite);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "n/a");
const summary = {
  runs: results.length,
  byType: { solution: count((r) => r.type === "solution"), no_formula: count((r) => r.type === "no_formula"), invalid_data: count((r) => r.type === "invalid_data"), error: count((r) => r.type === "error"), other: count((r) => !["solution", "no_formula", "invalid_data", "error"].includes(r.type)) },
  rawLeak: { cases: count((r) => r.rawLeak), ofAnswered: answered.length, rate: pct(count((r) => r.rawLeak), answered.length) },
  rawForbiddenInModelOutput: { cases: count((r) => r.rawForbiddenHits?.length), rate: pct(count((r) => r.rawForbiddenHits?.length), answered.length) },
  guardTouched: count((r) => r.guardTouched),
  finalLeak: { cases: count((r) => r.finalLeak?.length), casesAllEmbedded: count((r) => r.finalLeak?.length && r.finalLeak.every((h) => h.embedded)), list: results.filter((r) => r.finalLeak?.length).map((r) => ({ case: r.caseId, repeat: r.repeat, hits: r.finalLeak })) },
  endsWithBlank: { yes: count((r) => r.endsWithBlank === true), ofSolutions: solutions.length },
  formulaOk: { yes: count((r) => r.formulaOk), ofRuns: withExpected.length, rate: pct(count((r) => r.formulaOk), withExpected.length) },
  formulaOkWhenSolution: { yes: count((r) => r.type === "solution" && r.formulaOk), ofSolutions: solutions.length, rate: pct(count((r) => r.type === "solution" && r.formulaOk), solutions.length) },
  expectedMissingFromCandidates: results.filter((r) => r.type !== "error" && !r.expectedInCandidates).map((r) => r.caseId),
  ms: { avg: msList.length ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : null, max: msList.length ? Math.max(...msList) : null },
  fallbackModelUsed: count((r) => r.model && r.model === FINDER_FALLBACK_MODEL),
};

const pad = (v, n) => String(v ?? "-").slice(0, n).padEnd(n);
const lines = [];
lines.push(`${pad("ca", 3)}${pad("lớp", 4)}${pad("type", 13)}${pad("ms", 6)}${pad("model", 22)}${pad("bước", 5)}${pad("rawLeak", 8)}${pad("guard", 6)}${pad("final", 6)}${pad("cuối?", 6)}${pad("đúngCT", 7)}công thức đã chọn`);
for (const r of results) {
  lines.push(`${pad(r.caseId, 3)}${pad(r.grade, 4)}${pad(r.type, 13)}${pad(r.ms, 6)}${pad(r.model, 22)}${pad(r.steps, 5)}${pad(r.rawLeak ? "có" : "không", 8)}${pad(r.guardTouched ? "có" : "không", 6)}${pad(r.finalLeak?.length ?? "-", 6)}${pad(r.endsWithBlank == null ? "-" : r.endsWithBlank ? "có" : "KHÔNG", 6)}${pad(r.formulaOk == null ? "-" : r.formulaOk ? "đúng" : "SAI", 7)}${(r.formulaIds || []).join(", ") || "-"}`);
}
lines.push("");
lines.push(`Loại: solution ${summary.byType.solution} · no_formula ${summary.byType.no_formula} · invalid_data ${summary.byType.invalid_data} · lỗi ${summary.byType.error} · khác ${summary.byType.other}  (tổng ${summary.runs})`);
lines.push(`rawLeak (AI lộ số TRƯỚC bộ lọc — retriedForLeaks): ${summary.rawLeak.cases}/${summary.rawLeak.ofAnswered} = ${summary.rawLeak.rate}`);
lines.push(`   văn bản thô của model có chuỗi cấm: ${summary.rawForbiddenInModelOutput.cases}/${answered.length} = ${summary.rawForbiddenInModelOutput.rate}  | bộ lọc đã can thiệp: ${summary.guardTouched}`);
lines.push(`finalLeak (chuỗi cấm còn lại ở phần HIỂN THỊ — PHẢI là 0): ${summary.finalLeak.cases} (trong đó khớp chỉ lọt giữa biểu thức dài hơn: ${summary.finalLeak.casesAllEmbedded})${summary.finalLeak.cases ? "  ← " + summary.finalLeak.list.map((x) => `ca ${x.case}: ${x.hits.map((h) => `"${h.forbidden}"${h.embedded ? " [nhúng]" : ""} ở "…${h.context}…"`).join("; ")}`).join(" | ") : ""}`);
lines.push(`Bước cuối có ô ?: ${summary.endsWithBlank.yes}/${summary.endsWithBlank.ofSolutions} ca solution`);
lines.push(`formulaOk: ${summary.formulaOk.yes}/${summary.formulaOk.ofRuns} = ${summary.formulaOk.rate} (trong các ca solution: ${summary.formulaOkWhenSolution.yes}/${summary.formulaOkWhenSolution.ofSolutions} = ${summary.formulaOkWhenSolution.rate})`);
lines.push(`Thẻ mong đợi KHÔNG nằm trong ứng viên gửi AI (lỗi chọn ứng viên của app) ở ca: ${summary.expectedMissingFromCandidates.join(", ") || "không có"}`);
lines.push(`Thời gian: trung bình ${summary.ms.avg}ms · lớn nhất ${summary.ms.max}ms · ca dùng model dự phòng: ${summary.fallbackModelUsed}`);
const text = lines.join("\n");
console.log("\n" + text);

const outDir = path.join(here, "out");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
const report = scrub(JSON.stringify({ generatedAt: new Date().toISOString(), models: { primary: FINDER_MODEL, fallback: FINDER_FALLBACK_MODEL }, options: { repeat, gapSeconds: gapS, only: only ? [...only] : null }, summary, results }, null, 2));
fs.writeFileSync(path.join(outDir, `finder-eval-${stamp}.json`), report);
fs.writeFileSync(path.join(outDir, `finder-eval-${stamp}.txt`), scrub(text) + "\n");
console.log(`\nBáo cáo (không có khoá): scripts/out/finder-eval-${stamp}.json và .txt`);
if (summary.finalLeak.cases > 0) process.exitCode = 2;
