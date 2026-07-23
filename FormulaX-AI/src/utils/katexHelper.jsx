import React, { useEffect, useRef } from "react";

/**
 * Chính sách "trust" của KaTeX. Trước đây đặt `trust: true` cho toàn bộ lệnh, nghĩa là KaTeX
 * chấp nhận cả \href và \url với URL tùy ý — chuỗi LaTeX ở đây không phải lúc nào cũng do ta
 * kiểm soát (câu trả lời của AI, ghi chú người dùng nhập), nên một chuỗi kiểu
 * \href{javascript:...}{bấm vào đây} sẽ render thành link chạy script khi người dùng bấm (XSS).
 *
 * Nội dung toán trong formulas.js/questions.js không dùng \href, \url hay \includegraphics
 * (đã kiểm: 0 lần xuất hiện), nên chặn hẳn nhóm lệnh này không làm mất khả năng hiển thị nào.
 * Các lệnh "trust" còn lại (\htmlClass, \htmlId...) chỉ cho qua với giao thức an toàn.
 */
const katexTrust = (context) => {
  if (context.command === "\\href" || context.command === "\\url") {
    return /^(https?:|mailto:|#|\/)/i.test(context.url || "");
  }
  return false;
};

/**
 * KaTeX được nạp từ CDN bằng <script defer> trong index.html, không phải import qua bundler —
 * nên về nguyên tắc window.katex đã tồn tại trước khi React render. Nhưng nếu CDN chậm hoặc
 * bị chặn, component sẽ render đúng một lần rồi thôi và công thức mất hẳn (effect không tự
 * chạy lại). Promise dưới đây chờ script sẵn sàng để render bù, tối đa 10 giây.
 */
let katexReadyPromise = null;
function whenKatexReady() {
  if (window.katex) return Promise.resolve(true);
  if (!katexReadyPromise) {
    katexReadyPromise = new Promise((resolve) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (window.katex || Date.now() - startedAt > 10000) {
          clearInterval(timer);
          resolve(Boolean(window.katex));
        }
      }, 50);
    });
  }
  return katexReadyPromise;
}

/**
 * MathElement renders a LaTeX string using KaTeX.
 * @param {Object} props
 * @param {string} props.math - The LaTeX formula.
 * @param {boolean} [props.block=false] - Whether to render as display math (block) or inline.
 * @param {string} [props.className=""] - Optional CSS class.
 */
export const MathElement = ({ math, block = false, className = "" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const renderMath = () => {
      if (cancelled || !containerRef.current || !window.katex) return;
      try {
        window.katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          trust: katexTrust,
          maxExpand: 1000, // chặn macro tự nhân bản kiểu "billion laughs" làm treo tab trình duyệt
        });
      } catch (err) {
        console.error("KaTeX rendering error for formula:", math, err);
        containerRef.current.textContent = math; // Fallback
      }
    };

    if (window.katex) {
      renderMath();
    } else {
      // KaTeX chưa về (CDN chậm) — chờ rồi render bù. Trong lúc chờ hiển thị chuỗi LaTeX thô
      // thay vì khoảng trắng, để người dùng vẫn đọc được nội dung.
      if (containerRef.current) containerRef.current.textContent = math;
      whenKatexReady().then(renderMath);
    }

    return () => { cancelled = true; };
  }, [math, block]);

  return (
    <span
      ref={containerRef}
      className={`math-element ${block ? "math-block" : "math-inline"} ${className}`}
      style={{
        display: block ? "block" : "inline-block",
        verticalAlign: block ? "initial" : "middle"
      }}
    />
  );
};

// Helper parser to render bold markdown and KaTeX in a single line
const parseMarkdownLine = (lineContent, keyPrefix) => {
  // Match bold **text** or $$math$$ or $math$
  const parts = lineContent.split(/(\*\*.*?\*\*|\$\$.*?\$\$|\$.*?\$)/gs);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      const innerParts = inner.split(/(\$\$.*?\$\$|\$.*?\$)/gs);
      return (
        <strong key={`${keyPrefix}-${index}`} style={{ color: "inherit", fontWeight: "800" }}>
          {innerParts.map((ip, ii) => {
            if (ip.startsWith("$$") && ip.endsWith("$$"))
              return <MathElement key={`${keyPrefix}-${index}-${ii}`} math={ip.slice(2,-2).trim()} block={true} />;
            if (ip.startsWith("$") && ip.endsWith("$"))
              return <MathElement key={`${keyPrefix}-${index}-${ii}`} math={ip.slice(1,-1).trim()} block={false} />;
            return <span key={`${keyPrefix}-${index}-${ii}`}>{ip}</span>;
          })}
        </strong>
      );
    } else if (part.startsWith("$$") && part.endsWith("$$")) {
      const mathStr = part.slice(2, -2).trim();
      return <MathElement key={`${keyPrefix}-${index}`} math={mathStr} block={true} />;
    } else if (part.startsWith("$") && part.endsWith("$")) {
      const mathStr = part.slice(1, -1).trim();
      return <MathElement key={`${keyPrefix}-${index}`} math={mathStr} block={false} />;
    } else {
      return <span key={`${keyPrefix}-${index}`}>{part}</span>;
    }
  });
};

/**
 * Helper to replace $...$ and $$...$$ in markdown-like text with rendered KaTeX nodes.
 * Specifically used for explanations and examples.
 */
export const RichTextRenderer = ({ text = "", className = "" }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="detail-bullet-list">
          {currentList.map((item, idx) => (
            <li key={idx}>
              {parseMarkdownLine(item, `list-item-${idx}`)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^[-*] /.test(trimmed)) {
      // Chỉ nhận là bullet khi ký tự đầu là - hoặc * VÀ tiếp theo là dấu cách
      // Tránh nhầm **in đậm** (** không có dấu cách sau) với * bullet
      const itemContent = trimmed.substring(1).trim();
      currentList.push(itemContent);
    } else {
      flushList(`list-${index}`);
      
      if (trimmed) {
        elements.push(
          <div key={`p-${index}`} className="detail-paragraph-line">
            {parseMarkdownLine(line, `line-${index}`)}
          </div>
        );
      } else {
        elements.push(<div key={`br-${index}`} className="detail-line-break" />);
      }
    }
  });

  flushList("list-end");

  return <div className={`rich-text-content ${className}`}>{elements}</div>;
};
