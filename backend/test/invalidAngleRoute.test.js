import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { positiveGroups } from "../testHelpers/invalidQuestionCases.mjs";

const backendDir = fileURLToPath(new URL("../", import.meta.url));
const probe = fileURLToPath(new URL("../testHelpers/chatPrecheckProbe.mjs", import.meta.url));

const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const close = (server) => new Promise((resolve) => server.close(resolve));
async function freePort() {
  const server = net.createServer();
  await listen(server);
  const port = server.address().port;
  await close(server);
  return port;
}

test("POST /api/chat: mọi đề vô lý rõ ràng trả invalid_data trước AI và không tăng lượt", { timeout: 30_000 }, async () => {
  const rpcCalls = [];
  const fakeSupabase = http.createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    res.setHeader("Content-Type", "application/json");
    if (path === "/auth/v1/user") return res.end(JSON.stringify({
      id: "test-user", is_anonymous: false, identities: [{ provider: "google", id: "google-test-id" }],
    }));
    if (path === "/rest/v1/users") return res.end(JSON.stringify({ is_premium: false, premium_expiry: null }));
    if (path.startsWith("/rest/v1/rpc/")) {
      rpcCalls.push(path.slice("/rest/v1/rpc/".length));
      return res.end(JSON.stringify(path.endsWith("/get_ai_usage") ? 2 : 3));
    }
    res.statusCode = 404;
    return res.end(JSON.stringify({ message: `Unexpected test request: ${path}` }));
  });
  await listen(fakeSupabase);
  const port = await freePort();
  const child = spawn(process.execPath, ["--import", pathToFileURL(probe).href, "server.js"], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", GROQ_API_KEY: "local_test_only",
      SUPABASE_URL: `http://127.0.0.1:${fakeSupabase.address().port}`,
      SUPABASE_SERVICE_ROLE_KEY: "local_test_service_role" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  try {
    const url = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 50; i++) {
      if (child.exitCode !== null) break;
      try { const response = await fetch(`${url}/api/health`); if (response.ok) { ready = true; break; } }
      catch { /* server chưa mở cổng */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, `Backend test server did not start: ${output}`);
    const cases = [
      ["Tam giác ABC có hai góc 100° và 90°. Tính góc còn lại nha", "invalid_angle_sum", []],
      ...Object.values(positiveGroups).flat().map(([message, reason]) => [message, reason, []]),
      ...["xin chào", "chào", "hello", "hi", "alo", "xin chào bạn"].map((message) => [message, "no_math_problem", [
        { sender: "user", text: "Giải phương trình x² - 1 = 0" },
        { sender: "bot", text: "Dùng công thức nghiệm." },
      ]]),
    ];
    for (const [index, [message, reason, history]] of cases.entries()) {
      const outputStart = output.length;
      const response = await fetch(`${url}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer local-test-token",
          "X-Forwarded-For": `198.51.100.${index + 1}` },
        body: JSON.stringify({ message, grade: 10, history }),
      });
      assert.equal(response.status, 200, `${message}: ${output}`);
      const body = await response.json();
      assert.equal(body.type, "invalid_data", message);
      assert.match(output.slice(outputStart), new RegExp(`"reason":"${reason}"`), message);
      assert.deepEqual(body.formulaIds, [], message);
      assert.deepEqual(body.steps, [], message);
      assert.equal(body.remaining, 8, message);
      assert.match(body.reminder, /không bị tính/, message);
      assert.equal(rpcCalls.length, index + 1, message);
      assert.equal(rpcCalls.at(-1), "get_ai_usage", message);
    }
    assert.doesNotMatch(output, /\[test:groq_call\]|\[finder:usage\]/);
  } finally {
    child.kill();
    await close(fakeSupabase);
  }
});
