# CLAUDE.md — FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán. USP cốt lõi: **chống AI hallucination** — công thức được khóa cứng trong database, không để AI tự sinh. Claude không bao giờ tự bịa hoặc "chỉnh sửa" nội dung công thức toán học đã có, kể cả khi có vẻ đúng.

## Stack

- **Frontend:** React 19 + Vite, tại `FormulaX-AI/`
- **Backend:** Node.js + Express, tại `backend/`
- **Auth:** Google OAuth (`@react-oauth/google`) qua `context/AuthContext.jsx`, session lưu ở `localStorage.formulax_user`
- **Database:** Supabase — mọi thao tác đọc/ghi đi qua `src/lib/supabase.js`, không viết query Supabase trực tiếp trong component
- **AI:** Groq API, model `openai/gpt-oss-20b`. Package `@google/generative-ai` (Gemini) vẫn còn cài trong `backend/package.json` nhưng **không phải provider đang dùng** — đừng nhầm. Nếu cần đổi provider, xác nhận với người dùng trước, không tự đổi.
- **Render công thức:** KaTeX qua `utils/katexHelper.jsx` (`MathElement`, `RichTextRenderer`)

## Lệnh thường dùng

```bash
cd FormulaX-AI && npm run dev      # frontend dev server
cd FormulaX-AI && npm run build    # build production
cd FormulaX-AI && npm run lint     # eslint
cd backend && npm run dev          # backend dev (node --watch)
cd backend && npm start            # backend production
```

## Schema `formulas.js` — bắt buộc tuân thủ khi thêm/sửa công thức

```js
{
  id: "kebab-case-unique",          // ví dụ: "gt12-nguyenham-basic"
  name: "Tên công thức",
  topic: "Đại số" | "Hình học" | "Giải tích" | "Lượng giác" | "Xác suất & Thống kê" | "Mở rộng",
  grade: 10 | 11 | 12,
  latex: "công thức LaTeX, escape đúng cho JS string",
  explanation: "giải thích ký hiệu, điều kiện áp dụng",
  example: "ví dụ có lời giải cụ thể, dùng Markdown + LaTeX inline",
  tags: ["từ khóa"],
  difficulty: "Dễ" | "Trung bình" | "Khó",
  mnemonic: "mẹo ghi nhớ ngắn gọn",
  sgk_source: "Sách + Tập + Bài, vd: 'Toán 11 KNTT Tập 2, Bài 32'"  // đang bổ sung dần — LUÔN điền khi tạo công thức mới, không để trống
}
```

**Quy ước cấu trúc field `explanation`** — `FormulaDetailModal.jsx` (`parseExplanationToTable`) tự động tách field này thành khung "Giải thích ký hiệu" theo 3 phần dựa trên dòng `\n`:
1. Các dòng **trước** bullet đầu tiên → hiển thị như đoạn giới thiệu ngắn phía trên bảng.
2. Các dòng bắt đầu bằng `- ` (dấu gạch ngang + khoảng trắng) → mỗi dòng thành 1 hàng bảng "Ký hiệu | Ý nghĩa chi tiết", tách theo dấu `:` đầu tiên (phần trước là ký hiệu, phần sau là nghĩa). Đây là cách duy nhất để tạo hàng bảng.
3. Các dòng **sau** bullet cuối cùng → hiển thị như đoạn lý thuyết mở rộng phía dưới bảng.

**Không** dùng `*` hoặc `**` (in đậm Markdown) ở đầu dòng — parser chỉ nhận diện `-` làm dấu bullet; dòng bắt đầu bằng `**Từ khóa đậm**` vẫn render đúng (đậm) nhưng nằm ở phần giới thiệu/lý thuyết, không tạo được hàng bảng. Nếu công thức có nhiều ký hiệu cần giải thích ($P$, $Q$, $S \cap T$...), luôn mở đầu bằng `"Trong đó:\n- $ký_hiệu$: nghĩa\n..."` rồi mới đến đoạn lý thuyết dài hơn.

## Schema `questions.js` — bắt buộc tuân thủ khi thêm/sửa câu hỏi

```js
{
  id: "topic-abbr" + số,             // ví dụ: "gt1", "gt2" (gt = Giải tích) — theo prefix topic hiện có, đánh số tăng dần không trùng
  topic: "Đại số" | "Hình học" | "Giải tích" | "Lượng giác" | "Xác suất & Thống kê" | "Mở rộng",
  grade: 10 | 11 | 12,
  text: "Nội dung câu hỏi, dùng LaTeX inline dạng $...$",
  options: [
    { letter: "A", text: "$...$", isCorrect: true|false },
    { letter: "B", text: "$...$", isCorrect: true|false },
    { letter: "C", text: "$...$", isCorrect: true|false },
    { letter: "D", text: "$...$", isCorrect: true|false }
  ],                                   // luôn đúng 4 lựa chọn, đúng một isCorrect: true
  blankAnswer: "nội dung đáp án đúng, KHÔNG có dấu $ bao quanh",  // dùng cho chế độ điền đáp án
  explanation: "lời giải chi tiết, dùng LaTeX",
  sgk_source: "Sách + Tập + Bài, vd: 'Toán 12 KNTT Tập 2, Bài 12'"  // khuyến nghị thêm khi trích từ SGK thật, chưa bắt buộc với entry cũ
}
```

Quy tắc riêng cho `questions.js`:

- `blankAnswer` phải khớp nội dung với option có `isCorrect: true`, chỉ khác là bỏ dấu `$` bao ngoài LaTeX.
- Bài tập trích từ SGK phải giữ đúng số liệu/đề bài gốc, không tự đổi số cho "gọn" — nếu số liệu SGK phức tạp thì giữ nguyên, không đơn giản hóa.
- 3 phương án sai (distractor) nên phản ánh lỗi sai thường gặp thực tế (nhầm dấu, quên hệ số...) nếu SGK có gợi ý, không tự bịa phương án sai vô nghĩa.

## Quy tắc chống hallucination — không thương lượng

- Không tự bịa hoặc suy đoán công thức toán. Nếu không chắc chắn một công thức đúng 100% với chương trình GDPT 2018, dừng lại và hỏi người dùng thay vì đoán rồi ghi vào database.
- Mọi công thức mới thêm vào `formulas.js` phải có nguồn tham chiếu thật (SGK, tài liệu chuyên đề đã được người dùng xác minh) — ghi rõ vào `sgk_source`.
- Formula Finder (AI chat) khi trả lời phải ưu tiên trỏ về công thức có sẵn trong `formulas.js`; không tự sinh công thức mới ngay trong câu trả lời chat.
- Chương trình GDPT 2018 (SGK Kết Nối Tri Thức) **không có chủ đề "Số phức"** — đây không phải thiếu sót, đừng thêm nếu không được yêu cầu rõ.

## Xếp lớp đã xác nhận qua đối chiếu mục lục SGK thật — theo đúng bảng này, không tự đoán lại

| Chủ đề | Lớp |
|---|---|
| Hàm số Mũ, Lôgarit | 11 |
| Đạo hàm — định nghĩa, quy tắc tính, đạo hàm cấp hai | 11 |
| Ứng dụng đạo hàm — khảo sát, cực trị, GTLN-GTNN, tiệm cận | 12 |
| Thể tích khối chóp / lăng trụ (chương Quan hệ vuông góc) | 11 |
| Mặt Nón - Trụ - Cầu (khối tròn xoay) | 12 |
| Lượng giác (giá trị, công thức, hàm số, phương trình) | 11 |
| Giới hạn, Hàm số liên tục | 11 |

Lưu ý: một vài `id` hiện tại trong `formulas.js` có prefix không khớp `grade` thật (ví dụ id bắt đầu `hh12-` nhưng `grade: 11`) — đây là quy ước đặt tên cũ, không phải lỗi logic. Khi sửa, ưu tiên đúng trường `grade`, không cần đổi lại `id` trừ khi được yêu cầu.

## Cấu trúc thư mục chính

```
FormulaX-AI/
  src/
    views/       # Dashboard, FormulaLibrary, FormulaFinder, FlashcardView,
                  # QuizView, ProgressDashboard, PremiumUpgrade, LoginView
    components/  # Header, BottomNav, FormulaCard, FormulaDetailModal, OnboardingModal
    context/      # AuthContext.jsx
    data/         # formulas.js, questions.js — dữ liệu lõi, xem schema ở trên
    lib/          # supabase.js — mọi giao tiếp Supabase đi qua đây
    utils/        # katexHelper.jsx
backend/
  server.js        # Express API, proxy gọi Groq
```

## Quy ước code hiện có — giữ nhất quán, không tự đổi pattern

- Style dùng inline `style={{...}}` object, không dùng CSS Modules hay Tailwind — đây là pattern nhất quán trong toàn bộ code hiện tại, không tự chuyển sang thư viện khác nếu không được yêu cầu.
- Props destructuring rõ ràng ở đầu function component.
- Ghi dữ liệu người dùng (bookmark, note, quiz result, flashcard activity, chat session) luôn qua hàm có sẵn trong `lib/supabase.js` (`saveNote`, `saveQuizResult`, `saveFlashcardActivity`, `upsertChatSession`...), không viết insert/update Supabase trực tiếp trong view/component.

## Giới hạn tài khoản Free đang áp dụng — kiểm tra code trước khi đổi số

- Formula Finder (AI): 5 lượt hỏi/ngày
- Quiz: chỉ dạng trắc nghiệm cơ bản; điền đáp án + dạng kết hợp yêu cầu Premium
- ProgressDashboard: một phần nội dung bị làm mờ cho tài khoản free

## Việc không nên làm

- Không tự thêm thư viện UI/component mới nếu không được yêu cầu — dự án đang tối giản có chủ đích.
- Không đổi AI provider (Groq ↔ Gemini) mà không xác nhận với người dùng trước — cả hai SDK đều đang cài sẵn trong `backend/package.json`, rất dễ nhầm provider nào thật sự chạy.
- Không sửa hàng loạt `formulas.js`/`questions.js` mà không có bước xác nhận riêng — đây là dữ liệu lõi cho USP "chống hallucination" của sản phẩm, sai ở đây ảnh hưởng trực tiếp uy tín dự án.
