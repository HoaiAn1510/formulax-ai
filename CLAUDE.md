# CLAUDE.md — FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán. USP cốt lõi: **chống AI hallucination** — công thức được khóa cứng trong database, không để AI tự sinh. Claude không bao giờ tự bịa hoặc "chỉnh sửa" nội dung công thức toán học đã có, kể cả khi có vẻ đúng.

## Stack

- **Frontend:** React 19 + Vite, tại `FormulaX-AI/`
- **Backend:** Node.js + Express, tại `backend/`
- **Auth:** Google OAuth **qua Supabase Auth** (`supabase.auth.signInWithOAuth`) trong `context/AuthContext.jsx` — luồng redirect cả trang, không phải popup. Nguồn sự thật là phiên Supabase; `localStorage.formulax_user` chỉ còn là bộ nhớ đệm hiển thị, không dùng để xác thực. Gói `@react-oauth/google` vẫn còn trong `package.json` nhưng **không còn được import ở đâu** — giữ tạm làm đường lùi, gỡ sau khi luồng mới chạy ổn trên production. Đổi cách đăng nhập = phá RLS, xem `backend/migrations/003_rls_supabase_auth.sql` trước khi động vào.
- **Database:** Supabase — mọi thao tác đọc/ghi đi qua `src/lib/supabase.js`, không viết query Supabase trực tiếp trong component
- **AI:** Groq API, model `openai/gpt-oss-20b` — provider duy nhất. SDK Gemini (`@google/generative-ai`) trước đây cài sẵn nhưng không dùng, đã gỡ khỏi `backend/package.json` (2026-07-23) để hết nhầm lẫn. Nếu cần đổi provider, xác nhận với người dùng trước, không tự đổi.
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

- `blankAnswer` là **đáp án người học gõ tay ở chế độ điền**, viết dạng chữ thường cho dễ nhập — KHÔNG phải bản sao LaTeX của option. Theo đúng dữ liệu hiện có: option `$y' = 3x^2$` → `blankAnswer: "3x^2"`; option `$36\pi \text{ cm}^3$` → `blankAnswer: "36pi"`. Không bao dấu `$`, tránh lệnh LaTeX (`\dfrac`, `\infty`…) vì người học không gõ được, và tuyệt đối không điền nhãn lựa chọn (`"A"`, `"D"`).
- Chạy `npm run test:data` sau mỗi lần sửa `formulas.js`/`questions.js` — script kiểm tra id trùng, thiếu trường bắt buộc, sai enum topic/grade/difficulty, số dấu `$` lẻ, ngoặc LaTeX lệch, và số đáp án `isCorrect`.
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
| Lượng giác (giá trị, công thức, hàm số, phương trình) | 11 |
| Giới hạn, Hàm số liên tục | 11 |

Lưu ý: một vài `id` hiện tại trong `formulas.js` có prefix không khớp `grade` thật (ví dụ id bắt đầu `hh12-` nhưng `grade: 11`) — đây là quy ước đặt tên cũ, không phải lỗi logic. Khi sửa, ưu tiên đúng trường `grade`, không cần đổi lại `id` trừ khi được yêu cầu.

## Cấu trúc thư mục chính

```
FormulaX-AI/
  src/
    views/       # Dashboard, FormulaLibrary, FormulaFinder, FlashcardView,
                  # QuizView, ProgressDashboard, PremiumUpgrade, LoginView
    components/  # Header, BottomNav, FormulaDetailModal, OnboardingModal
    context/      # AuthContext.jsx
    data/         # formulas.js, questions.js — dữ liệu lõi, xem schema ở trên
    lib/          # supabase.js — mọi giao tiếp Supabase đi qua đây
    utils/        # katexHelper.jsx
backend/
  server.js        # Express API, proxy gọi Groq
```

## Giao diện — Navy + Amber Premium SaaS (đang áp dụng, thay cho Glassmorphism cũ)

Từ 2026-07-04, toàn bộ app chuyển từ phong cách Glassmorphism (tím/hồng/kính mờ) sang phong cách SaaS cao cấp tối giản: navy + amber, card trắng phẳng, không gradient tràn lan, không hiệu ứng kính. Mục tiêu cảm giác: premium, đáng tin cậy, chuyên nghiệp — không còn "colorful/playful".

**Bảng màu (khai báo trong `@theme` của `src/index.css`, đồng bộ với `:root` của `src/App.css`):**

| Vai trò | Token | Giá trị |
|---|---|---|
| Primary Navy / Text Primary | `--color-primary` / `--primary` | `#0F172A` |
| Secondary Navy | `--color-navy-secondary` / `--navy-secondary` | `#1E293B` |
| Sidebar | `--color-sidebar` / `--sidebar` | `#16243A` — **cố định**, không đổi theo dark mode toggle |
| Card background | — | `#FFFFFF` |
| Main background | `--bg-main` | `#F8FAFC` |
| Border | `--border-slate` | `#E5E7EB` |
| Text Secondary | `--color-text-muted` / `--text-muted` | `#64748B` |
| Amber Accent (màu nhấn hành động chính) | `--color-accent` / `--accent` | `#D97706` |
| Amber Hover | `--color-accent-hover` / `--accent-hover` | `#B45309` |
| Amber Light | `--color-accent-light` / `--accent-light` | `#FEF3C7` |
| Info (dùng hiếm, không phải màu nhấn chính) | `--color-secondary` / `--secondary` | `#2563EB` |
| Success / Danger / Warning | `--color-success` / `--color-error` / `--color-premium` | `#10B981` / `#EF4444` / `#F59E0B` (không đổi) |

Đặc điểm phong cách:
- **Nền trang:** phẳng `#F8FAFC`, không gradient, không "orb" ánh sáng mờ trang trí phía sau nội dung.
- **Card:** nền trắng đặc (`#FFFFFF`), viền `1px solid #E5E7EB`, bo góc `16px`, shadow rất nhẹ `0 2px 6px rgba(15,23,42,.05)`; hover thì `translateY(-2px)` + shadow đậm hơn một chút. Không dùng `backdrop-filter`/độ trong suốt nữa (utility `glass-card`/`glass-card-sm` trong `index.css` vẫn giữ tên cũ nhưng đã đổi thân CSS sang flat card — không phải "kính" nữa, tên chỉ còn là lịch sử).
- **Gradient amber** chỉ còn dùng ở đúng 2 chỗ: banner Premium và card Premium (`--premium-grad`: `#D97706 → #F59E0B`) — không dùng gradient nhiều màu ở nơi khác.
- **Banner nhấn mạnh (tiến độ học tập...):** nền navy phẳng (`#1E3A5F`/`#1E293B`), không còn gradient tím.
- **Sidebar (`BottomNav.jsx` desktop):** nền navy cố định `#16243A`, chữ nav mặc định `#CBD5E1`, hover `rgba(255,255,255,.08)`, active `#29589C` + chữ trắng — **luôn navy dù app đang ở light hay dark mode** (đây là surface riêng, không theo toggle).
- **Button primary:** nền `--accent` (amber), hover `--accent-hover`, không dùng `filter:brightness()` nữa mà đổi thẳng màu nền lúc hover.
- **Progress bar:** track xám, thanh chạy màu amber. Progress ring (nếu có): navy.
- **Font:** chỉ dùng **Inter** cho toàn bộ hệ thống (đã bỏ Be Vietnam Pro).
- **Dark mode:** toggle qua class `.dark-mode` trên `<html>` (state ở `App.jsx`, lưu `localStorage.formulax_dark`) — là tính năng thật đang hoạt động, không phải CSS thừa. **Dark mode GIỮ NGUYÊN không đổi** khi chuyển sang Navy+Amber (quyết định 2026-07-04) — bản thân dark mode vốn đã dùng tông slate-navy riêng (`#0F172A`/`#1E293B`/`#334155`), không xung đột với bảng màu mới nên không cần làm lại. Card kính chuyển sang nền slate đặc (`#1E293B`/`#334155`) thay vì hiệu ứng kính khi ở dark mode — hành vi này không đổi. Bất kỳ view nào migrate sang Tailwind đều phải giữ đúng hành vi dark mode này bằng `dark:` variant, không được bỏ sót.

Quy ước kỹ thuật: dự án đang **chuyển dần từ inline style sang Tailwind CSS v4** (cài qua `@tailwindcss/vite`, cấu hình theo kiểu CSS-first của v4 — token khai báo trong `@theme`/`@utility` ở `src/index.css`, không dùng `tailwind.config.js` kiểu cũ). Giá trị màu chuẩn nằm ở `@theme` trong `src/index.css` + `:root` trong `src/App.css` (file tham khảo cũ `src/styles/theme.js` đã xoá vì không nơi nào import). Khi tạo/sửa view hoặc component:
- Ưu tiên dùng class Tailwind (`className="..."`) thay vì `style={{...}}` cho code mới.
- Các giá trị màu/shadow/radius của phong cách Navy+Amber (xem bảng trên) khai báo dùng chung trong `@theme`/`@utility` ở `src/index.css`, không lặp lại giá trị hex/rgba rải rác trong từng file.
- Nơi nào trước đây dùng xanh dương (`--secondary`/`bg-secondary`/`text-secondary`) làm màu nhấn hành động chính (nút CTA, tab active, focus ring...) thì đổi sang `--accent`/`bg-accent`/`text-accent` (amber) — xanh dương giờ chỉ còn vai trò "Info", dùng rất hiếm.
- File/view nào **chưa migrate** vẫn giữ inline style cũ — không bắt buộc sửa toàn bộ cùng lúc, chuyển dần từng view khi có nhu cầu chỉnh sửa view đó.
- KHÔNG dùng CSS Modules song song với Tailwind — chỉ một cách tiếp cận để tránh lẫn lộn quy ước giữa các thành viên.

## Hiệu năng & bảo mật — quy ước đã chốt (2026-07-23)

Chi tiết đầy đủ ở `docs/SECURITY.md` và `docs/PERFORMANCE.md`. Những điểm dễ phá khi sửa code:

- **Code splitting:** chỉ `Dashboard` và `LoginView` được `import` tĩnh trong `App.jsx`; 7 view
  còn lại dùng `React.lazy`. Thêm view mới thì theo đúng cách này, đừng import tĩnh.
- **`formulas.js` và `questions.js` tải động**, không `import` tĩnh ở `App.jsx` hay component
  nằm trên Dashboard — mỗi file 350–410 KB nguồn, import tĩnh là kéo thẳng vào bundle đầu tiên.
  `formulas` được App tải rồi truyền xuống view qua prop `formulas` như cũ.
- **Vite 8 chạy trên Rolldown:** `manualChunks` trong `vite.config.js` **chỉ nhận dạng hàm**;
  dạng object `{ tên: [package] }` của Rollup cũ sẽ lỗi `manualChunks is not a function`.
- **KaTeX** nạp bằng `<script defer>` từ CDN. `MathElement` có cơ chế chờ `window.katex` rồi
  render bù — đừng bỏ, vì nếu CDN chậm thì effect không tự chạy lại và công thức mất hẳn.
- **KaTeX `trust`:** không bao giờ đặt lại `trust: true`. Chuỗi LaTeX có thể đến từ câu trả lời
  AI hoặc ghi chú người dùng, `\href{javascript:...}` là XSS thật.
- **Backend bắt buộc `NODE_ENV=production` khi deploy** — thiếu biến này thì route DEV
  `/payos/simulate-success` (cấp Premium, bỏ qua xác minh chữ ký PayOS) vẫn mở.
- **Rate limit** ở `backend/server.js` áp cho `/api/chat` và `/payos/create`, **không** áp cho
  `/payos/webhook` (chặn nhầm webhook = người dùng trả tiền nhưng không được cấp Premium).
- Lỗi trả về client không kèm `error.message` của SDK; chi tiết chỉ ghi vào log server.

## Quy ước code khác

- Props destructuring rõ ràng ở đầu function component.
- Ghi dữ liệu người dùng (bookmark, note, quiz result, flashcard activity, chat session) luôn qua hàm có sẵn trong `lib/supabase.js` (`saveNote`, `saveQuizResult`, `saveFlashcardActivity`, `upsertChatSession`...), không viết insert/update Supabase trực tiếp trong view/component.

## Giới hạn tài khoản Free đang áp dụng — kiểm tra code trước khi đổi số

- Formula Finder (AI): 10 lượt hỏi/ngày
- Quiz: chỉ dạng trắc nghiệm cơ bản; điền đáp án + dạng kết hợp yêu cầu Premium
- ProgressDashboard: một phần nội dung bị làm mờ cho tài khoản free

## Việc không nên làm

- Không tự thêm thư viện UI/component ngoài Tailwind (đã duyệt, xem mục Giao diện) nếu không được yêu cầu — dự án đang tối giản có chủ đích.
- Không đổi AI provider mà không xác nhận với người dùng trước. Hiện chỉ còn đúng một SDK trong `backend/package.json` là `groq-sdk` — đừng cài thêm SDK provider khác "để sẵn đó".
- Không sửa hàng loạt `formulas.js`/`questions.js` mà không có bước xác nhận riêng — đây là dữ liệu lõi cho USP "chống hallucination" của sản phẩm, sai ở đây ảnh hưởng trực tiếp uy tín dự án.
