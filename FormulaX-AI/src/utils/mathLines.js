// Tách một biểu thức LaTeX của AI Finder thành nhiều dòng để đọc được trên màn hình hẹp (390px) mà
// không phải cuộn ngang — chỗ bị khuất bên phải thường chính là ô "?". Hàm thuần, test bằng node
// (scripts/test-math-lines.mjs).
//
// Kết quả: mảng DÒNG, mỗi dòng là mảng KHÚC. Giữa các dòng luôn xuống dòng; giữa các khúc trong một
// dòng chỉ xuống dòng khi không đủ chỗ (frontend xếp bằng flex-wrap).
// Chỉ tách ở CẤP NGOÀI CÙNG — không bao giờ tách bên trong {…}, (…), […], \{…\}, phân số hay căn:
//   - trước "\text{ với …}" (bỏ dấu phẩy/khoảng trắng đứng ngay trước nó);
//   - trước \Rightarrow, \implies, \Longrightarrow, ⇒;
//   - tại dấu phẩy/chấm phẩy ngăn hai biểu thức độc lập (mỗi phần đều có dấu "=" hoặc so sánh) —
//     mỗi phần một dòng. Dấu phẩy trong danh sách dữ kiện ("b = 12, c = 5" sau "với") hay giữa các ký
//     hiệu ("x_1, x_2") chỉ là chỗ được phép xuống dòng (khúc).
// Không chắc chắn (ngoặc lệch, có \begin…\end) thì giữ nguyên một dòng một khúc.

const ARROWS = new Set(["Rightarrow", "implies", "Longrightarrow"]);
// Khoảng trắng LaTeX có thể đứng sau dấu phẩy ngăn cách: "\;", "\,", "\:", "\!", "\ ", "\quad", "\qquad", "~".
const SPACING_CMD = /^\\(?:[;,:! ]|q?quad(?![A-Za-z]))/;
const RELATION = /(?:^|[^\\])(?:=|<|>)|\\(?:le|ge|leq|geq|ne|neq|approx|in)(?![A-Za-z])/;

/** Chia chuỗi thành các mảnh ở cấp ngoài cùng; trả null nếu ngoặc lệch. */
function scanTopLevel(latex) {
  const marks = []; // { at, kind: "sep" | "with" | "arrow", end }
  let depth = 0;
  let i = 0;
  const s = latex;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") {
      const cmd = s.slice(i + 1).match(/^[A-Za-z]+/);
      if (cmd) {
        const name = cmd[0];
        if (name === "begin") return null;
        if (depth === 0 && ARROWS.has(name)) marks.push({ at: i, kind: "arrow" });
        if (depth === 0 && name === "text") {
          const m = s.slice(i).match(/^\\text\s*\{\s*([^{}]*)\}/);
          if (m && /^với(?![\p{L}])/u.test(m[1].trim())) marks.push({ at: i, kind: "with" });
        }
        i += 1 + name.length;
        continue;
      }
      const next = s[i + 1];
      if (next === "{") depth++;
      else if (next === "}") depth--;
      if (depth < 0) return null;
      i += 2;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") { depth--; if (depth < 0) return null; }
    else if (c === "⇒" && depth === 0) marks.push({ at: i, kind: "arrow" });
    else if ((c === "," || c === ";") && depth === 0) {
      // Nuốt khoảng trắng LaTeX ngay sau dấu phân cách.
      let j = i + 1;
      for (;;) {
        const rest = s.slice(j);
        const sp = rest.match(/^\s+/) || rest.match(SPACING_CMD) || rest.match(/^~/);
        if (!sp) break;
        j += sp[0].length;
      }
      marks.push({ at: i, kind: "sep", end: j });
      i = j;
      continue;
    }
    i++;
  }
  return depth === 0 ? marks : null;
}

const trimSpacing = (t) => {
  let out = t.trim();
  for (;;) {
    const m = out.match(/(?:\\[;,:! ]|\\q?quad|~|,)\s*$/);
    if (!m) return out;
    out = out.slice(0, out.length - m[0].length).trim();
  }
};

/** @returns {string[][]} dòng → khúc */
export function splitMathLines(latex) {
  const s = String(latex ?? "").trim();
  if (!s) return [];
  const marks = scanTopLevel(s);
  if (!marks) return [[s]];

  // 1. Cắt thành các đoạn ở "với" và mũi tên (luôn xuống dòng).
  const segments = [];
  let from = 0;
  for (const m of marks) {
    if (m.kind === "sep" || m.at === 0) continue;
    segments.push(s.slice(from, m.at));
    from = m.at;
  }
  segments.push(s.slice(from));

  const lines = [];
  for (const seg of segments) {
    const startsWith = /^\\text\s*\{\s*với/u.test(seg.trim());
    // 2. Trong mỗi đoạn, chia tiếp ở dấu phẩy cấp ngoài cùng (vị trí tính lại trong đoạn).
    const pieces = [];
    const segMarks = scanTopLevel(seg) || [];
    let p = 0;
    for (const m of segMarks) {
      if (m.kind !== "sep") continue;
      pieces.push({ body: seg.slice(p, m.at), sep: seg.slice(m.at, m.end) });
      p = m.end;
    }
    pieces.push({ body: seg.slice(p), sep: "" });
    const bodies = pieces.map((x) => x.body.trim()).filter(Boolean);
    if (!bodies.length) continue;
    const independent = !startsWith && bodies.length > 1 && bodies.every((b) => RELATION.test(b));
    if (independent) {
      for (const b of bodies) lines.push([trimSpacing(b)]);
    } else {
      // Khúc giữ dấu phẩy ở cuối (trừ khúc cuối đoạn) để đọc liền mạch khi xuống dòng.
      const chunks = pieces
        .filter((x) => x.body.trim())
        .map((x, k, arr) => (k < arr.length - 1 ? `${x.body.trim()}${x.sep.trim().startsWith(";") ? ";" : ","}` : trimSpacing(x.body)));
      lines.push(chunks);
    }
  }
  return lines.length ? lines : [[s]];
}
