#!/usr/bin/env node
// Chốt chặn trước khi commit: quét các dòng ĐÃ STAGE tìm khóa bí mật, có thì chặn commit.
// Chạy tự động qua .githooks/pre-commit (bật bằng `git config core.hooksPath .githooks`), hoặc
// chạy tay: `node scripts/check-secrets.mjs`. Không in giá trị khóa ra màn hình — chỉ in vị trí,
// loại và vài ký tự đầu đã che.
//
// Bắt:
//   - gsk_…        key Groq
//   - eyJ….….…     JWT (vd service role key cũ của Supabase)
//   - sb_secret_…  secret key mới của Supabase
//   - file *.example: dòng *_KEY= / *_SECRET= / *_TOKEN= có giá trị không rỗng — file mẫu chỉ
//     được chứa tên biến, giá trị thật nằm trong .env (đã ignore). Từng có lần key thật bị dán
//     nhầm vào backend/.env.example.
//   - file .env thật (không phải .example) bị stage.
import { execFileSync } from "node:child_process";

const PATTERNS = [
  { type: "Groq API key (gsk_)", re: /gsk_[A-Za-z0-9]{20,}/ },
  { type: "JWT (eyJ…)", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/ },
  { type: "Supabase secret key (sb_secret_)", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
];
const EXAMPLE_ASSIGN = /^\s*(?:export\s+)?([A-Za-z0-9_]*(?:KEY|SECRET|TOKEN)[A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;
const REAL_ENV_FILE = /(^|\/)\.env(\.[^/]*)?$/;

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const mask = (value) => `${value.slice(0, 4)}…(${value.length} ký tự)`;

// Diff đã stage, không ngữ cảnh: chỉ lấy dòng được THÊM, kèm tên file và số dòng mới.
function stagedAddedLines() {
  const out = [];
  let file = null;
  let lineNo = 0;
  for (const line of git(["diff", "--cached", "--no-color", "--no-ext-diff", "-U0", "--diff-filter=ACMR"]).split("\n")) {
    if (line.startsWith("+++ ")) { file = line.slice(4).replace(/^b\//, ""); continue; }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) { lineNo = Number(hunk[1]); continue; }
    if (line.startsWith("+") && file) { out.push({ file, lineNo, text: line.slice(1) }); lineNo++; }
  }
  return out;
}

const findings = [];

for (const f of git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n").filter(Boolean)) {
  if (REAL_ENV_FILE.test(f) && !f.endsWith(".example")) {
    findings.push({ where: f, type: "file .env thật bị stage — chỉ commit file .env.example", sample: "" });
  }
}

for (const { file, lineNo, text } of stagedAddedLines()) {
  for (const { type, re } of PATTERNS) {
    const m = text.match(re);
    if (m) findings.push({ where: `${file}:${lineNo}`, type, sample: mask(m[0]) });
  }
  if (file.endsWith(".example")) {
    const m = text.match(EXAMPLE_ASSIGN);
    if (m && m[2] !== "" && m[2] !== '""' && m[2] !== "''") {
      findings.push({ where: `${file}:${lineNo}`, type: `${m[1]} trong file mẫu phải để trống`, sample: mask(m[2]) });
    }
  }
}

if (findings.length) {
  console.error("\n[check-secrets] CHẶN COMMIT — phát hiện khóa bí mật trong thay đổi đã stage:");
  for (const f of findings) console.error(`  - ${f.where}: ${f.type}${f.sample ? ` [${f.sample}]` : ""}`);
  console.error("\nGỡ giá trị khỏi file (khóa thật chỉ để trong .env, đã ignore), `git add` lại rồi commit.");
  console.error("Nếu khóa đã từng bị đẩy lên remote: coi như lộ, thu hồi và tạo khóa mới.\n");
  process.exit(1);
}
