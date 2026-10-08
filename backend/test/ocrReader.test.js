import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectImageType, decodeImagePayload, parseOcrJson, keepOcrNewlines, normalizeOcrResult, readProblemsFromImage,
  OcrError, OCR_MODEL, OCR_FALLBACK_MODEL, MAX_IMAGE_BYTES, MAX_PROBLEMS,
} from "../lib/ocrReader.js";
import { OCR_PROMPT } from "../lib/ocrPrompt.js";
import { createPerKeyLimiter } from "../lib/perKeyLimiter.js";

const R = String.raw;
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(60, 2)]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 "), Buffer.alloc(40)]);

// ─── Kiểm tra ảnh ────────────────────────────────────────────────────────────
test("detectImageType: nhận JPEG/PNG/WebP theo byte đầu, từ chối loại khác", () => {
  assert.equal(detectImageType(JPEG), "image/jpeg");
  assert.equal(detectImageType(PNG), "image/png");
  assert.equal(detectImageType(WEBP), "image/webp");
  assert.equal(detectImageType(Buffer.from("%PDF-1.7 ....... ")), null);
  assert.equal(detectImageType(Buffer.from("GIF89a..........")), null);
});

test("decodeImagePayload: base64 thường và data URL; MIME lấy từ byte đầu, không tin client", () => {
  assert.equal(decodeImagePayload(JPEG.toString("base64")).mime, "image/jpeg");
  // Client ghi image/png nhưng thực ra là JPEG → vẫn là JPEG.
  assert.equal(decodeImagePayload(`data:image/png;base64,${JPEG.toString("base64")}`).mime, "image/jpeg");
});

test("decodeImagePayload: thiếu ảnh / không phải ảnh / base64 hỏng → 400; quá lớn → 413", () => {
  const code = (fn) => { try { fn(); return null; } catch (e) { assert.ok(e instanceof OcrError); return `${e.status} ${e.code}`; } };
  assert.equal(code(() => decodeImagePayload(undefined)), "400 bad_image");
  assert.equal(code(() => decodeImagePayload(Buffer.from("%PDF-1.7 hello world").toString("base64"))), "400 bad_image");
  assert.equal(code(() => decodeImagePayload("không phải base64!!")), "400 bad_image");
  const big = Buffer.concat([JPEG, Buffer.alloc(MAX_IMAGE_BYTES)]).toString("base64");
  assert.equal(code(() => decodeImagePayload(big)), "413 image_too_large");
});

// ─── Parse + chuẩn hoá ───────────────────────────────────────────────────────
test("parseOcrJson: JSON đúng chuẩn — xuống dòng trước phương án giữ là xuống dòng (lỗi \\nA khi thử)", () => {
  // Gemini chế độ JSON viết escape đúng chuẩn: "\n" là xuống dòng, "\\infty" là \infty.
  const raw = R`{"problems":[{"label":"3","text":"Hàm số đồng biến trên khoảng nào?\nA. $(-\\infty; 3)$\nB. $(3; +\\infty)$","has_figure":false,"figure_note":"","unclear":[]}]}`;
  const text = parseOcrJson(raw).problems[0].text;
  assert.equal(text, "Hàm số đồng biến trên khoảng nào?\nA. $(-\\infty; 3)$\nB. $(3; +\\infty)$");
  assert.doesNotMatch(text, /\\nA/);
});

test("parseOcrJson: JSON lẫn \\ đơn và \\\\ (chế độ thường) vẫn cứu được; có ```json bao quanh cũng được", () => {
  const raw = "```json\n" + R`{"problems":[{"label":"2","text":"góc $\widehat{A} = 60^\\circ$","has_figure":false,"figure_note":"","unclear":[]}]}` + "\n```";
  assert.equal(parseOcrJson(raw).problems[0].text, R`góc $\widehat{A} = 60^\circ$`);
  assert.equal(parseOcrJson("không phải json"), null);
});

test("parseOcrJson: JSON hỏng (\\circ một dấu \\) mà có xuống dòng thật trước chữ in hoa → vẫn là xuống dòng", () => {
  // Đúng câu ảnh 03 (2026-10-08), thêm \circ viết MỘT dấu \ như Gemini thỉnh thoảng trả → buộc đi
  // nhánh sửa escape. Trước khi sửa: text hiện chữ "\nTính".
  const raw = R`{"problems":[{"label":"Bài 1","text":"Cho $\\triangle ABC$ có $AB = 4, AC = 6$ và góc $A = 120^\circ$.\nTính độ dài cạnh $BC$","has_figure":false,"figure_note":"","unclear":[]}]}`;
  assert.throws(() => JSON.parse(raw)); // đúng là JSON hỏng
  const text = parseOcrJson(raw).problems[0].text;
  assert.equal(text, R`Cho $\triangle ABC$ có $AB = 4, AC = 6$ và góc $A = 120^\circ$.` + "\nTính độ dài cạnh $BC$");
  // Phương án trắc nghiệm xuống dòng trước "A." / "B." cũng vậy.
  const mc = parseOcrJson(R`{"problems":[{"text":"Đồng biến trên khoảng nào?\nA. $(-\infty; 3)$\nB. $(3; +\infty)$"}]}`).problems[0].text;
  assert.equal(mc, "Đồng biến trên khoảng nào?\nA. $(-\\infty; 3)$\nB. $(3; +\\infty)$");
});

test("parseOcrJson: lệnh LaTeX bắt đầu bằng n (\\neq, \\nu, \\not, \\nabla) giữ nguyên, kể cả viết một dấu \\", () => {
  for (const cmd of ["neq", "nu", "not", "nabla"]) {
    // Một dấu \ (JSON hỏng) và hai dấu \ (JSON đúng) đều phải ra đúng lệnh LaTeX.
    const single = parseOcrJson(`{"problems":[{"text":"$a \\${cmd} b$\\nTính $x$"}]}`).problems[0].text;
    const double = parseOcrJson(`{"problems":[{"text":"$a \\\\${cmd} b$\\nTính $x$"}]}`).problems[0].text;
    assert.equal(single, `$a \\${cmd} b$\nTính $x$`, cmd);
    assert.equal(double, `$a \\${cmd} b$\nTính $x$`, cmd);
  }
  // Có thêm \circ một dấu \ (JSON hỏng): lệnh n... vẫn đúng.
  const mixed = parseOcrJson(R`{"problems":[{"text":"$x \neq 60^\circ$, $\nabla f$, $\nu$, $\not\in$\nTính $x$"}]}`).problems[0].text;
  assert.equal(mixed, R`$x \neq 60^\circ$, $\nabla f$, $\nu$, $\not\in$` + "\nTính $x$");
});

test("parseOcrJson: JSON HỢP LỆ nhưng lệnh LaTeX viết một dấu \\ (\\frac, \\text, \\times, \\beta, \\rightarrow, \\neq) vẫn ra đúng lệnh", () => {
  // Không có \c, \w... nên JSON.parse thường sẽ "thành công" — và biến \f, \t, \b, \r, \n thành ký tự
  // điều khiển. Vì vậy không được parse thường trước.
  const raw = R`{"problems":[{"text":"$\frac{1}{2}$, $\text{ cm}$, $2 \times 3$, $\beta$, $x \rightarrow y$, $a \neq b$"}]}`;
  assert.doesNotThrow(() => JSON.parse(raw));
  assert.equal(parseOcrJson(raw).problems[0].text, R`$\frac{1}{2}$, $\text{ cm}$, $2 \times 3$, $\beta$, $x \rightarrow y$, $a \neq b$`);
});

test("keepOcrNewlines: \\n chưa escape là xuống dòng trừ khi là lệnh LaTeX bắt đầu bằng n; \\\\n giữ nguyên", () => {
  assert.equal(keepOcrNewlines(R`a\nTính`), R`a\u000ATính`);
  assert.equal(keepOcrNewlines(R`a\nA. b`), R`a\u000AA. b`);
  assert.equal(keepOcrNewlines(R`a\n`), R`a\u000A`);
  // Ý a), b) của bài và chữ thường bắt đầu dòng: vẫn là xuống dòng.
  assert.equal(keepOcrNewlines(R`Câu 2:\na) Tính\nb) Tìm`), R`Câu 2:\u000Aa) Tính\u000Ab) Tìm`);
  assert.equal(keepOcrNewlines(R`x\nnếu`), R`x\u000Anếu`);
  assert.equal(keepOcrNewlines(R`$\neq$ $\nu$ $\not$ $\nabla$ $\notin$`), R`$\neq$ $\nu$ $\not$ $\nabla$ $\notin$`);
  assert.equal(keepOcrNewlines(R`\\nTính`), R`\\nTính`); // dấu \ đã escape + chữ n: không phải xuống dòng
});

test("normalizeOcrResult: bỏ bài rỗng, nhãn mặc định, figure_note chỉ giữ khi has_figure, cắt unclear", () => {
  const out = normalizeOcrResult({ problems: [
    { label: "Bài 1", text: "  Tính $x$.  ", has_figure: false, figure_note: "không có hình mà vẫn ghi", unclear: [] },
    { text: "" },
    { text: "Tính AC", has_figure: true, figure_note: "hình cho biết AB = 50 m", unclear: ["số mờ", "", 3, "a", "b", "c", "d", "e"] },
    "rác",
  ] });
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { label: "Bài 1", text: "Tính $x$.", hasFigure: false, figureNote: "", unclear: [] });
  assert.equal(out[1].label, "Bài 2");
  assert.equal(out[1].figureNote, "hình cho biết AB = 50 m");
  assert.deepEqual(out[1].unclear, ["số mờ", "a", "b", "c", "d"]);
  assert.deepEqual(normalizeOcrResult({ problems: [] }), []);
  assert.equal(normalizeOcrResult({ text: "sai dạng" }), null);
  const many = normalizeOcrResult({ problems: Array.from({ length: 15 }, (_, i) => ({ text: `bài ${i}` })) });
  assert.equal(many.length, MAX_PROBLEMS);
});

test("câu lệnh OCR là nguyên văn đã duyệt (không bị sửa)", () => {
  assert.match(OCR_PROMPT, /^Bạn là công cụ chép đề toán từ ảnh cho học sinh THPT Việt Nam\. Nhiệm vụ DUY NHẤT là chép lại đề bài, KHÔNG giải\./);
  assert.match(OCR_PROMPT, /\$\\widehat\{BAC\} = 60\^\\circ\$/);
  assert.match(OCR_PROMPT, /7\. Nếu ảnh không chứa đề toán, trả về "problems": \[\]\./);
  // Quy tắc 5 bản v2 (2026-10-08): bị vật che dù chỉ một phần nét cũng phải [?]; ví dụ khác ảnh thử 04.
  assert.match(OCR_PROMPT, /\n5\. Chỗ nào không đọc rõ thì viết \[\?\][^\n]*BỊ VẬT KHÁC CHE dù chỉ một phần nét[^\n]*"BC = \[\?\]"[^\n]*Tuyệt đối không đoán số hay ký hiệu\.\n/);
  assert.match(OCR_PROMPT, /"unclear": \[\]\n    \}\n  \]\n\}$/);
});

// ─── Gọi Gemini (fetch giả) ──────────────────────────────────────────────────
const okBody = (problems) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ problems }) }] } }],
  usageMetadata: { promptTokenCount: 1549, candidatesTokenCount: 350 },
});
function fakeFetch(responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    const r = responses[calls.length - 1];
    if (r instanceof Error) throw r;
    return { ok: r.status === 200, status: r.status, json: async () => r.body };
  };
  fn.calls = calls;
  return fn;
}
const P1 = [{ label: "1", text: "Tính $x$", has_figure: false, figure_note: "", unclear: [] }];

test("đọc ảnh: gọi model chính với chế độ JSON, ảnh + câu lệnh nguyên văn, khoá qua header", async () => {
  const fetchImpl = fakeFetch([{ status: 200, body: okBody(P1) }]);
  const { problems, meta } = await readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl });
  assert.equal(problems.length, 1);
  assert.equal(meta.model, OCR_MODEL);
  assert.equal(meta.fallback, false);
  assert.equal(meta.promptTokens, 1549);
  const call = fetchImpl.calls[0];
  assert.match(call.url, new RegExp(`/models/${OCR_MODEL}:generateContent$`));
  assert.doesNotMatch(call.url, /key=/); // khoá không nằm trong URL (tránh lọt vào log)
  assert.equal(call.headers["x-goog-api-key"], "k");
  assert.equal(call.body.generationConfig.responseMimeType, "application/json");
  assert.equal(call.body.contents[0].parts[0].inline_data.mime_type, "image/jpeg");
  assert.equal(call.body.contents[0].parts[1].text, OCR_PROMPT);
});

test("đọc ảnh: model chính 503 → model dự phòng; 429 → dự phòng; timeout → dự phòng", async () => {
  for (const first of [{ status: 503, body: {} }, { status: 429, body: {} }, Object.assign(new Error("t"), { name: "TimeoutError" })]) {
    const fetchImpl = fakeFetch([first, { status: 200, body: okBody(P1) }]);
    const { meta } = await readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl });
    assert.equal(meta.model, OCR_FALLBACK_MODEL);
    assert.equal(meta.fallback, true);
    assert.match(fetchImpl.calls[1].url, new RegExp(OCR_FALLBACK_MODEL));
  }
});

test("đọc ảnh: JSON hỏng ở model chính → thử dự phòng; cả hai hỏng → 502 ocr_failed", async () => {
  const bad = { status: 200, body: { candidates: [{ content: { parts: [{ text: "xin lỗi, tôi không đọc được" }] } }] } };
  const fetchImpl = fakeFetch([bad, bad]);
  await assert.rejects(readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl }),
    (e) => e instanceof OcrError && e.status === 502 && e.code === "ocr_failed");
  assert.equal(fetchImpl.calls.length, 2);
});

test("đọc ảnh: cả hai model hết hạn mức (429) → 429 ocr_busy", async () => {
  const fetchImpl = fakeFetch([{ status: 429, body: {} }, { status: 429, body: {} }]);
  await assert.rejects(readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl }),
    (e) => e.status === 429 && e.code === "ocr_busy");
});

test("đọc ảnh: lỗi 400 (yêu cầu sai) không thử lại", async () => {
  const fetchImpl = fakeFetch([{ status: 400, body: {} }, { status: 200, body: okBody(P1) }]);
  await assert.rejects(readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl }), (e) => e.code === "ocr_failed");
  assert.equal(fetchImpl.calls.length, 1);
});

test("đọc ảnh: không còn đủ thời gian thì không gọi dự phòng", async () => {
  const clock = { t: 0 };
  const fetchImpl = async () => { clock.t = 37_000; return { ok: false, status: 503, json: async () => ({}) }; };
  let calls = 0;
  const counting = async (...a) => { calls++; return fetchImpl(...a); };
  await assert.rejects(readProblemsFromImage({ apiKey: "k", buffer: JPEG, mime: "image/jpeg", fetchImpl: counting, now: () => clock.t, deadline: 40_000 }));
  assert.equal(calls, 1);
});

test("ảnh không có đề toán → danh sách rỗng, không phải lỗi", async () => {
  const fetchImpl = fakeFetch([{ status: 200, body: okBody([]) }]);
  const { problems } = await readProblemsFromImage({ apiKey: "k", buffer: PNG, mime: "image/png", fetchImpl });
  assert.deepEqual(problems, []);
});

// ─── Giới hạn 5 lần/phút mỗi tài khoản ───────────────────────────────────────
test("createPerKeyLimiter: 5 lần/phút mỗi khoá, khoá khác không ảnh hưởng, hết cửa sổ thì cho lại", () => {
  const clock = { t: 0 };
  const lim = createPerKeyLimiter({ windowMs: 60_000, max: 5, now: () => clock.t });
  for (let i = 0; i < 5; i++) assert.equal(lim.hit("a").allowed, true);
  const blocked = lim.hit("a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 60_000);
  assert.equal(lim.hit("b").allowed, true);
  clock.t = 60_000;
  assert.equal(lim.hit("a").allowed, true);
});
