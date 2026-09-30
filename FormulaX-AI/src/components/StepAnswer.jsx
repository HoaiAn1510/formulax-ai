import { MathElement, RichTextRenderer } from "../utils/katexHelper";

const SECTION_TITLE = "text-[0.7rem] font-extrabold uppercase tracking-[0.5px] text-text-muted dark:text-[#94A3B8] mb-2";

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
          <RichTextRenderer text={answer.intro} />
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
                <div className="mt-2 max-w-full overflow-x-auto rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 !text-[#1E3A5F] dark:!text-[#E2E8F0]">
                  <MathElement math={f.latex} block={true} />
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
                    Bước {i + 1}{st.title ? ` — ${st.title}` : ""}
                  </div>
                  {st.detail && (
                    <div className="chat-bot-text text-[0.85rem] leading-[1.6] mt-0.5 max-w-full overflow-x-auto">
                      <RichTextRenderer text={st.detail} />
                    </div>
                  )}
                  {st.expression && (
                    <div className="mt-1.5 max-w-full overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/60 px-3 !text-[#1E3A5F] dark:!text-[#E2E8F0]">
                      <MathElement math={st.expression} block={true} />
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
          <RichTextRenderer text={answer.reminder} />
        </div>
      )}
    </div>
  );
}
