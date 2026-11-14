import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { answerWithReasoning, parseReasoningProblem, renderTex, REASONING_ENABLED } from "../lib/reasoningFinder.js";
import { sym, rat, add, mul, neg, pow, div } from "../lib/reasoningAlgebra.js";

const ACCEPTED = [
  ["Phương trình x² - 5x + 3 = 0 có hai nghiệm x₁, x₂. Tính x₁²+x₂².", "viet_square_sum", ["ds10-hethuc-viet"]],
  [String.raw`Cho phương trình 2x^2 + 7x - 4 = 0 có hai nghiệm x_1, x_2. Tính giá trị biểu thức \frac{1}{x_1} + \frac{1}{x_2}`, "viet_reciprocal", ["ds10-hethuc-viet"]],
  ["Gọi x1, x2 là hai nghiệm của phương trình -x^2 + 4x + 1 = 0. Tính 1/x1 + 1/x2", "viet_reciprocal", ["ds10-hethuc-viet"]],
  ["Phương trình x^2 - 4 = 0 có hai nghiệm x1, x2. Tính x1^2 + x2^2", "viet_square_sum", ["ds10-hethuc-viet"]],
  ["Tam giác có a=13, b=14, c=15. Tính bán kính đường tròn nội tiếp r.", "triangle_inradius", ["hh10-herong", "hh10-bankinh-noitiep"]],
  ["Tam giác ABC có AB = 5, BC = 6, CA = 7. Tính bán kính đường tròn ngoại tiếp.", "triangle_circumradius", ["hh10-herong", "hh10-bankinh-ngoaitiep"]],
  ["Tam giác có ba cạnh 2,5; 3 và 4. Tính bán kính đường tròn nội tiếp", "triangle_inradius", ["hh10-herong", "hh10-bankinh-noitiep"]],
];

for (const [message, kind, ids] of ACCEPTED) {
  test(`B2 nhận và kiểm chứng: ${message}`, () => {
    assert.equal(parseReasoningProblem(message)?.kind, kind);
    const out = answerWithReasoning(message, { grade: 10 });
    assert.equal(out.answer.type, "solution");
    assert.deepEqual(out.answer.formulaIds, ids);
    assert.equal(out.meta.reasoning.status, "verified");
    assert.ok(!out.meta.reasoning.guardChanged, "bộ lọc cuối không được phải sửa lời hướng dẫn đã kiểm");
    assert.equal(out.meta.attempts, 0); // không gọi AI
    // Quy tắc ô trống (CLAUDE.md): biểu thức có ô trống thì sau dấu "=" cuối cùng chỉ là "?".
    const blanks = out.answer.steps.filter((s) => s.expression.includes("?"));
    assert.ok(blanks.length >= 2);
    for (const s of blanks) assert.match(s.expression, /= \?$/, s.expression);
    // Không hiện Δ hay giá trị tính ra; chỉ ký hiệu + dữ kiện của đề.
    assert.doesNotMatch(JSON.stringify(out.answer), /\\Delta|Δ/);
  });
}

const DECLINED = [
  "Phương trình x^2 + x + 5 = 0 có hai nghiệm x1, x2. Tính x1^2 + x2^2", // Δ < 0: không có nghiệm thực
  "Phương trình x^2 - 2(m+1)x + m = 0. Tìm m để x1^2+x2^2 = 10", // tham số
  "Phương trình x^2 - 5x + 3 = 0 có hai nghiệm. Tính x1^3 + x2^3 và x1^2+x2^2", // hỏi thêm biểu thức khác
  "Phương trình x^2 - 5x = 0 có hai nghiệm x1,x2. Tính 1/x1 + 1/x2", // có nghiệm 0
  "Phương trình x^2 - 5x + 3 = 0 có hai nghiệm x1, x2. Tính x1^2 + x2^2 và 1/x1 + 1/x2", // hỏi cả hai
  "Tam giác vuông có ba cạnh 3, 4, 5. Tính bán kính đường tròn nội tiếp", // tính chất tam giác vuông
  "Tam giác có ba cạnh 1, 2, 5. Tính bán kính đường tròn nội tiếp", // không tạo thành tam giác
  "Tính diện tích tam giác và bán kính nội tiếp, biết ba cạnh 3, 5, 7", // hỏi hai đại lượng
  "Tam giác có ba cạnh 3, 5, 7, góc A = 60°. Tính bán kính ngoại tiếp", // thêm dữ kiện
  "Tam giác có ba cạnh 3, 5, 7. Tính bán kính đường tròn nội tiếp và ngoại tiếp",
  "Giải phương trình x^2 - 5x + 6 = 0",
  "Tính đạo hàm của y = x^3",
];
for (const message of DECLINED) {
  test(`B2 trả về luồng cũ: ${message}`, () => assert.equal(answerWithReasoning(message), null));
}

test("renderer gọn: dấu trừ, tích, lũy thừa của tổng, phân thức âm", () => {
  assert.equal(renderTex(add(pow(sym("S"), 2), neg(mul(rat(2), sym("P"))))), "S^{2} - 2P");
  assert.equal(renderTex(pow(add(sym("x1"), sym("x2")), 2)), String.raw`\left(x_1 + x_2\right)^{2}`);
  assert.equal(renderTex(mul(rat(2), mul(sym("x1"), sym("x2")))), "2x_1 x_2");
  assert.equal(renderTex(div(neg(sym("b")), sym("a"))), String.raw`-\frac{b}{a}`);
});

test("cờ FINDER_REASONING_ENABLED mặc định tắt", () => {
  const saved = process.env.FINDER_REASONING_ENABLED;
  delete process.env.FINDER_REASONING_ENABLED;
  try { assert.equal(REASONING_ENABLED(), false); } finally { if (saved !== undefined) process.env.FINDER_REASONING_ENABLED = saved; }
});

// ─── Route: bật cờ → dạng thí điểm trả lời không gọi AI, giữ đúng MỘT lượt, không hoàn ─────────────

const backendDir = fileURLToPath(new URL("../", import.meta.url));
const probe = fileURLToPath(new URL("../testHelpers/noAiProbe.mjs", import.meta.url));
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const close = (server) => new Promise((resolve) => server.close(resolve));
async function freePort() { const s = net.createServer(); await listen(s); const { port } = s.address(); await close(s); return port; }

test("POST /api/chat (cờ bật): Vi-ét được hướng dẫn không gọi AI, tính 1 lượt; câu nối tiếp vẫn đi luồng cũ", { timeout: 30_000 }, async () => {
  const rpcCalls = [];
  const fakeSupabase = http.createServer((req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    res.setHeader("Content-Type", "application/json");
    if (path === "/auth/v1/user") return res.end(JSON.stringify({ id: "test-user", is_anonymous: false, identities: [{ provider: "google", id: "google-test-id" }] }));
    if (path === "/rest/v1/users") return res.end(JSON.stringify({ is_premium: false, premium_expiry: null }));
    if (path.startsWith("/rest/v1/rpc/")) { rpcCalls.push(path.slice("/rest/v1/rpc/".length)); return res.end("3"); }
    if (path.startsWith("/rest/v1/")) return res.end("[]");
    res.statusCode = 404;
    return res.end("{}");
  });
  await listen(fakeSupabase);
  const port = await freePort();
  const child = spawn(process.execPath, ["--import", pathToFileURL(probe).href, "server.js"], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", GEMINI_API_KEY: "local_test_only", FINDER_REASONING_ENABLED: "1",
      SUPABASE_URL: `http://127.0.0.1:${fakeSupabase.address().port}`, SUPABASE_SERVICE_ROLE_KEY: "local_test_service_role" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (c) => { output += c; });
  child.stderr.on("data", (c) => { output += c; });
  try {
    const url = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) {
      try { ready = (await fetch(`${url}/api/health`)).ok; } catch { /* chưa mở cổng */ }
      if (!ready) await new Promise((r) => setTimeout(r, 100));
    }
    assert.equal(ready, true, output);
    const post = (message, history = [], ip = "198.51.100.7") => fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer local-test-token", "X-Forwarded-For": ip },
      body: JSON.stringify({ message, grade: 10, history }),
    });
    const response = await post("Phương trình x² - 5x + 3 = 0 có hai nghiệm x₁, x₂. Tính x₁²+x₂².");
    assert.equal(response.status, 200, output);
    const body = await response.json();
    assert.equal(body.type, "solution");
    assert.deepEqual(body.formulaIds, ["ds10-hethuc-viet"]);
    assert.deepEqual(rpcCalls, ["increment_ai_usage"]); // giữ đúng một lượt, không hoàn
    assert.doesNotMatch(output, /\[test:ai_call\]/);
    assert.match(output, /\[finder:reasoning\].*"status":"verified"/);

    // Câu nối tiếp (có lịch sử) không đi nhánh B2 → luồng cũ gọi AI (bị probe chặn) → không có dòng reasoning mới.
    const before = output.length;
    await post("Mình chưa hiểu bước 2", [
      { sender: "user", text: "Phương trình x² - 5x + 3 = 0 có hai nghiệm x₁, x₂. Tính x₁²+x₂²." },
      { sender: "bot", text: "..." },
    ], "198.51.100.8");
    assert.match(output.slice(before), /\[test:ai_call\]/);
    assert.doesNotMatch(output.slice(before), /\[finder:reasoning\]/);
  } finally {
    child.kill();
    await close(fakeSupabase);
  }
});
