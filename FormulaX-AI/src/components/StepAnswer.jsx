import { useLayoutEffect, useRef, useState } from "react";
import { MathElement, RichTextRenderer, InlineRichText } from "../utils/katexHelper";
import FitMath from "./FitMath";
import { splitMathLines } from "../utils/mathLines";

const SECTION_TITLE = "text-[0.7rem] font-extrabold uppercase tracking-[0.5px] text-text-muted dark:text-[#94A3B8] mb-2";

// Ô trống "?" — chỗ học sinh tự tính (quy tắc AI Finder từ 2026-10-03). Vẽ thành ô viền amber
// nền amber nhạt ngay trong KaTeX (\fcolorbox, \textcolor không cần bật `trust`). Màu viết thẳng
// vì là tham số của lệnh LaTeX, không dùng được class/token CSS.
const BLANK_BOX = String.raw`\fcolorbox{#D97706}{#FEF3C7}{\textcolor{#92400E}{\textbf{\,?\,}}}`;
/** "?" trong một biểu thức LaTeX → ô trống. */
const markBlanksInMath = (latex) => String(latex || "").replace(/\?/g, BLANK_BOX);
/**
 * Câu chữ có xen $...$: "?" trong phần toán → ô trống; "= ?" viết ngoài $...$ (model quên bọc) cũng
 * thành ô trống. Dấu hỏi kết thúc câu hỏi thường ("…chưa?") giữ nguyên.
 */
const markBlanksInText = (text) => String(text || "")
  .split(/(\$\$[^$]*\$\$|\$[^$]*\$)/)
  .map((part, i) => {
    if (i % 2 === 1) {
      const fence = part.startsWith("$$") ? "$$" : "$";
      return fence + markBlanksInMath(part.slice(fence.length, -fence.length)) + fence;
    }
    return part.replace(/(=\s*)\?(?=[\s.,;:)]|$)/g, (_, eq) => `${eq}$${BLANK_BOX}$`);
  })
  .join("");

/**
 * Một dòng gồm nhiều khúc (vd "\text{ với } b = 12," + "c = 5"): vừa bề ngang thì hiện liền một dòng,
 * không vừa thì xếp mỗi khúc một dòng (đo thật sau khi KaTeX vẽ, không đoán theo số ký tự).
 */
function StepLine({ chunks }) {
  const boxRef = useRef(null);
  const [stacked, setStacked] = useState(false);
  const joined = chunks.join(String.raw`\ `);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || chunks.length < 2) return;
    const check = () => { if (box.scrollWidth > box.clientWidth + 1) setStacked(true); };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(box);
    if (box.firstElementChild) ro.observe(box.firstElementChild);
    return () => ro.disconnect();
  }, [chunks.length, joined]);

  if (chunks.length < 2) return <FitMath math={markBlanksInMath(chunks[0])} />;
  if (stacked) return chunks.map((c, j) => <FitMath key={j} math={markBlanksInMath(c)} />);
  return (
    <div ref={boxRef} className="w-full overflow-hidden">
      <div className="inline-block min-w-full [&_.katex-display]:!my-1.5">
        <MathElement math={markBlanksInMath(joined)} block={true} />
      </div>
    </div>
  );
}

/**
 * Biểu thức của một bước, tách nhiều dòng ở "với", "⇒" và dấu phẩy ngăn hai biểu thức độc lập
 * (utils/mathLines.js) để ô "?" luôn nằm trong phần nhìn thấy trên màn hình hẹp. Khúc nào một mình
 * vẫn quá rộng thì tự thu nhỏ cỡ chữ (FitMath) thay vì bắt cuộn ngang.
 */
function StepExpression({ latex }) {
  return (
    // .math-block (App.css: margin 12px + padding 8px) cộng margin 1em của .katex-display làm mỗi dòng
    // cách nhau ~80px khi tách nhiều dòng — thu gọn riêng trong khung biểu thức của bước.
    <div data-qa-math className="flex flex-col py-1.5 gap-0.5 [&_.math-block]:!my-0 [&_.math-block]:!py-0.5 [&_.katex-display]:!my-0">

      {splitMathLines(latex).map((chunks, i) => <StepLine key={i} chunks={chunks} />)}
    </div>
  );
}

/**
 * Câu trả lời dạng "hướng dẫn tự giải" của AI Finder: công thức sử dụng → các bước → lời nhắc tự
 * tính. KHÔNG có phần kết quả. Thẻ công thức lấy tên + LaTeX từ formulas.js theo id (không lấy
 * chữ nào của AI), bấm vào mở modal chi tiết có sẵn của Thư viện.
 *
 * Dùng chung cho câu trả lời thật (dữ liệu từ backend) và 2 ví dụ tĩnh của chế độ khách.
 * Biểu thức dài (KaTeX không tự xuống dòng) cuộn ngang trong khung riêng, không làm tràn trang.
 */
export default function StepAnswer({ answer, formulas, onViewDetail }) {
  const cards = (answer.formulaIds || []).map((id) => formulas.find((f) => f.id === id)).filter(Boolean);
  const steps = answer.steps || [];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {answer.intro && (
        <div className="chat-bot-text text-[0.88rem] leading-[1.6] min-w-0 overflow-x-auto">
          <RichTextRenderer text={markBlanksInText(answer.intro)} />
        </div>
      )}

      {cards.length > 0 && (
        <section className="min-w-0">
          <h4 className={SECTION_TITLE}>Công thức sử dụng</h4>
          <div className="flex flex-col gap-2">
            {cards.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onViewDetail?.(f)}
                title="Xem chi tiết công thức"
                className="w-full min-w-0 text-left bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] border-l-4 border-l-accent rounded-xl p-3 cursor-pointer transition duration-200 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:-translate-y-px"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.88rem] font-extrabold text-primary dark:text-[#E2E8F0]">{f.name}</span>
                  <span className="text-[0.7rem] font-bold text-accent shrink-0 mt-0.5">Xem chi tiết</span>
                </div>
                {/* Công thức thư viện giữ nguyên (không tách dòng) — quá rộng thì thu nhỏ cho vừa. */}
                <div data-qa-math className="mt-2 max-w-full overflow-x-auto rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 !text-[#1E3A5F] dark:!text-[#E2E8F0]">
                  <FitMath math={f.latex} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section className="min-w-0">
          <h4 className={SECTION_TITLE}>Các bước giải</h4>
          <ol className="flex flex-col gap-3 list-none p-0 m-0">
            {steps.map((st, i) => (
              <li key={i} className="flex gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-accent-light dark:bg-accent/15 text-accent text-[0.75rem] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0]">
                    Bước {i + 1}{st.title && <> — <InlineRichText text={markBlanksInText(st.title)} /></>}
                  </div>
                  {st.detail && (
                    <div className="chat-bot-text text-[0.85rem] leading-[1.6] mt-0.5 max-w-full overflow-x-auto">
                      <RichTextRenderer text={markBlanksInText(st.detail)} />
                    </div>
                  )}
                  {st.expression && (
                    <div className="mt-1.5 max-w-full overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 !text-[#1E3A5F] dark:!text-[#E2E8F0]">
                      <StepExpression latex={st.expression} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* RichTextRenderer bọc chữ trong .detail-paragraph-line, App.css tô cứng lớp đó màu
          #334155 (không đổi theo dark mode ngoài .chat-bot-text) → ép kế thừa màu amber của khung. */}
      {answer.reminder && (
        <div className="text-[0.82rem] font-semibold leading-[1.5] text-[#92400E] dark:text-[#FCD34D] [&_.detail-paragraph-line]:!text-inherit bg-accent-light/70 dark:bg-accent/10 rounded-lg px-3 py-2 min-w-0 overflow-x-auto">
          <RichTextRenderer text={markBlanksInText(answer.reminder)} />
        </div>
      )}
    </div>
  );
}
