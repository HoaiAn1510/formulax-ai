// Test scripts/check-secrets.mjs + hook .githooks/pre-commit trong một repo git TẠM (không đụng
// repo thật). Chạy: node scripts/test-check-secrets.mjs
// Giá trị "khóa" trong test đều được sinh tại chỗ — không phải khóa thật.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-secrets-"));
const g = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

g("init", "-q"); g("config", "user.email", "t@t"); g("config", "user.name", "t"); g("config", "core.autocrlf", "false");
fs.mkdirSync(path.join(dir, "scripts")); fs.mkdirSync(path.join(dir, ".githooks"));
fs.copyFileSync(path.join(ROOT, "scripts/check-secrets.mjs"), path.join(dir, "scripts/check-secrets.mjs"));
fs.copyFileSync(path.join(ROOT, ".githooks/pre-commit"), path.join(dir, ".githooks/pre-commit"));
fs.writeFileSync(path.join(dir, "base.example"), "API_KEY=\n");
g("add", "."); g("commit", "-q", "-m", "base", "--no-verify");
g("config", "core.hooksPath", ".githooks");

const rnd = (n, chars = "abcDEF123xyz") => Array.from({ length: n }, (_, i) => chars[(i * 7) % chars.length]).join("");
const fakeGsk = "gsk" + "_" + rnd(40);
const fakeJwt = "eyJ" + rnd(20) + "." + "eyJ" + rnd(30) + "." + rnd(20);
const fakeSb = "sb_" + "secret_" + rnd(30);
const fakeLong = rnd(40, "aB3dE5fG7hJ9kLmN");
const SECRET_VALUES = [fakeGsk, fakeJwt, fakeSb, fakeLong, "abc123"];

// [mô tả, file, nội dung, phải commit được?]
const CASES = [
  ["key Groq trong code", "a.js", `const k = "${fakeGsk}";\n`, false],
  ["JWT trong code", "b.js", `const t = "${fakeJwt}";\n`, false],
  ["sb_secret trong file cấu hình", "c.json", `{"k": "${fakeSb}"}\n`, false],
  ["*.example có _KEY= giá trị ngắn", "backend/.env.example", "GROQ_EVAL_API_KEY=abc123\n", false],
  ["*.example có _KEY= chuỗi dài ngẫu nhiên", "d.env.example", `SUPABASE_SERVICE_ROLE_KEY=${fakeLong}\n`, false],
  ["*.example có _SECRET= giá trị", "x.env.example", "PAYOS_CHECKSUM_SECRET = foo\n", false],
  ["*.example có _TOKEN= giá trị", "y.example", "export GH_TOKEN=bar\n", false],
  ["*.example your_ + chuỗi ngẫu nhiên", "e.env.example", `GROQ_API_KEY=your_${fakeLong}\n`, false],
  ["*.example your_ + key Groq", "f.env.example", `GROQ_API_KEY=your_${fakeGsk}\n`, false],
  ["file .env thật bị stage", "backend/.env", "PORT=3001\n", false],
  ["*.example giữ chỗ your_groq_api_key_here", "g.env.example", "GROQ_API_KEY=your_groq_api_key_here\n", true],
  ["*.example để trống / \"\"", "z.env.example", "GROQ_API_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\"\"\nPORT=3001\n", true],
  ["*.example biến không phải KEY/SECRET/TOKEN", "w.example", "PORT=3001\nNODE_ENV=production\n", true],
  ["code thường", "ok.js", "const eyJ = 1; // gsk_ ngắn\n", true],
  ["mã nguồn chính script quét", "scripts/copy.mjs", fs.readFileSync(path.join(ROOT, "scripts/check-secrets.mjs"), "utf8"), true],
];

let pass = 0;
for (const [label, file, content, shouldCommit] of CASES) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
  g("add", "-f", file);
  const r = spawnSync("git", ["commit", "-q", "-m", label], { cwd: dir, encoding: "utf8" });
  const committed = r.status === 0;
  const leaked = SECRET_VALUES.some((v) => (r.stderr + r.stdout).includes(v));
  const ok = committed === shouldCommit && !leaked;
  if (ok) pass++;
  console.log(`${ok ? "ĐẠT" : "LỖI"}  ${label}: ${committed ? "commit được" : "bị chặn"}${leaked ? " — IN RA GIÁ TRỊ KHÓA!" : ""}`);
  if (!committed) { g("reset", "-q", "HEAD", "--", file); fs.rmSync(path.join(dir, file)); }
}

// --range: commit lách hook (--no-verify) có key → quét khoảng commit phải bắt được.
fs.writeFileSync(path.join(dir, "late.js"), `const k = "${fakeGsk}";\n`);
g("add", "late.js"); g("commit", "-q", "-m", "late", "--no-verify");
const r = spawnSync("node", ["scripts/check-secrets.mjs", "--range", "HEAD~1..HEAD"], { cwd: dir, encoding: "utf8" });
const rangeOk = r.status === 1 && /late\.js:1/.test(r.stderr) && !r.stderr.includes(fakeGsk);
if (rangeOk) pass++;
console.log(`${rangeOk ? "ĐẠT" : "LỖI"}  --range bắt key trong commit đã lách hook`);

const total = CASES.length + 1;
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${pass}/${total} đạt`);
process.exit(pass === total ? 0 : 1);
