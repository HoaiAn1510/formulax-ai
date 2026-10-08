# CLAUDE.md — FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán. USP cốt lõi: **chống AI hallucination** — công thức được khóa cứng trong database, không để AI tự sinh. Claude không bao giờ tự bịa hoặc "chỉnh sửa" nội dung công thức toán học đã có, kể cả khi có vẻ đúng.

## Stack

- **Frontend:** React 19 + Vite, tại `FormulaX-AI/`
- **Backend:** Node.js + Express, tại `backend/`
- **Auth:** Google OAuth **qua Supabase Auth** (`supabase.auth.signInWithOAuth`) trong `context/AuthContext.jsx` — luồng redirect cả trang, không phải popup. Nguồn sự thật là phiên Supabase; `localStorage.formulax_user` chỉ còn là bộ nhớ đệm hiển thị, không dùng để xác thực. Gói `@react-oauth/google` vẫn còn trong `package.json` nhưng **không còn được import ở đâu** — giữ tạm làm đường lùi, gỡ sau khi luồng mới chạy ổn trên production. Đổi cách đăng nhập = phá RLS, xem `backend/migrations/003_rls_supabase_auth.sql` trước khi động vào.
- **Database:** Supabase — mọi thao tác đọc/ghi đi qua `src/lib/supabase.js`, không viết query Supabase trực tiếp trong component
- **AI:** Groq API, model `openai/gpt-oss-120b` (AI Finder, khai báo ở `backend/lib/finderPrompt.js`; đổi từ `gpt-oss-20b` ngày 2026-09-30 sau khi chấm so sánh — xem mục AI Finder) — provider duy nhất cho phần hướng dẫn giải. **Gemini chỉ dùng để đọc ảnh đề** (OCR, từ 2026-10-07 — xem mục "Đọc ảnh đề"), gọi qua REST, không cài SDK (`@google/generative-ai` đã gỡ 2026-07-23, đừng cài lại). Nếu cần đổi provider, xác nhận với người dùng trước, không tự đổi.
- **Render công thức:** KaTeX qua `utils/katexHelper.jsx` (`MathElement`, `RichTextRenderer`)

## Lệnh thường dùng

```bash
cd FormulaX-AI && npm run dev      # frontend dev server
cd FormulaX-AI && npm run build    # build production
cd FormulaX-AI && npm run lint     # eslint
cd backend && npm run dev          # backend dev (node --watch)
cd backend && npm start            # backend production
cd backend && npm test             # test backend (node --test): bộ lọc số, JSON, hoàn lượt, thời gian, OCR
cd FormulaX-AI && npm run test:ocr # hàm thuần của luồng ảnh đề (tô [?], tính lượt, gọi lần lượt từng bài)
cd FormulaX-AI && npm run test:math # tách biểu thức dài của AI Finder thành nhiều dòng (utils/mathLines.js)
```

## Schema `formulas.js` — bắt buộc tuân thủ khi thêm/sửa công thức

**`formulas.js` là nguồn công thức DUY NHẤT của cả app lẫn AI Finder** — backend import thẳng file này (`backend/lib/formulaCatalog.js` → `../../FormulaX-AI/src/data/formulas.js`), không còn danh sách công thức chép tay nào khác. Vì vậy:
- `formulas.js` **KHÔNG được import bất kỳ thứ gì** (ảnh, component, hàm tiện ích, thư viện frontend…) — chỉ export dữ liệu thuần. Node không hiểu import ảnh/JSX/alias của Vite, và gói chỉ cài ở frontend thì backend không có → backend sập ngay lúc khởi động.
- Sửa/thêm công thức ở đây là AI Finder nhận luôn sau khi backend deploy lại; `/api/health` báo số công thức đã nạp (`formulasLoaded`, hiện 246).

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
- Chế độ "Điền đáp án" chấm theo `blankAnswer` qua `src/utils/fillAnswer.js` (chuẩn hoá cách viết, bỏ tiền tố biến ngắn, bỏ đơn vị cuối, so phân số chính xác — không phải CAS: `x+1` ≠ `1+x`). Câu có `blankAnswer` còn `\` hoặc là câu văn ≥ 3 từ thì không ra đề dạng điền (chỉ trắc nghiệm). Sửa `fillAnswer.js` hoặc `blankAnswer` thì chạy `npm run test:quiz` (gõ đúng `blankAnswer` phải chấm đúng 100%).
- Chạy `npm run test:data` sau mỗi lần sửa `formulas.js`/`questions.js` — script kiểm tra id trùng, thiếu trường bắt buộc, sai enum topic/grade/difficulty, số dấu `$` lẻ, ngoặc LaTeX lệch, và số đáp án `isCorrect`.
- Bài tập trích từ SGK phải giữ đúng số liệu/đề bài gốc, không tự đổi số cho "gọn" — nếu số liệu SGK phức tạp thì giữ nguyên, không đơn giản hóa.
- 3 phương án sai (distractor) nên phản ánh lỗi sai thường gặp thực tế (nhầm dấu, quên hệ số...) nếu SGK có gợi ý, không tự bịa phương án sai vô nghĩa.

## Quy tắc chống hallucination — không thương lượng

- Không tự bịa hoặc suy đoán công thức toán. Nếu không chắc chắn một công thức đúng 100% với chương trình GDPT 2018, dừng lại và hỏi người dùng thay vì đoán rồi ghi vào database.
- Mọi công thức mới thêm vào `formulas.js` phải có nguồn tham chiếu thật (SGK, tài liệu chuyên đề đã được người dùng xác minh) — ghi rõ vào `sgk_source`.
- Formula Finder (AI chat) chỉ được dùng công thức có trong `formulas.js`, không tự sinh công thức mới trong câu trả lời, và không tính ra kết quả thay học sinh — quy tắc chi tiết ở mục "AI Finder" bên dưới.
- **Ô trống — không thay số ra kết quả, không lộ nghiệm** (từ 2026-10-03): AI dẫn học sinh tới đúng chỗ cần tính rồi để dấu `?` (`3x^2 - 3 = 0 \Rightarrow x^2 = ?`, `BC^2 = b^2 + c^2 - 2bc\cos A, \text{ với } b = AC = 8, c = AB = 5, A = 60^\circ \Rightarrow BC = ?`), học sinh tự tính. Viết công thức KÝ HIỆU kèm dữ kiện, không viết biểu thức đã thay số. Sau dấu `=`/`\Rightarrow` cuối cùng của mỗi biểu thức chỉ được là `?` (hoặc biểu thức còn chứa biến), không bao giờ là một con số tính ra; biểu thức ký hiệu (đạo hàm) không có `= ?` phía sau. Dạng `x^2 = a` viết thẳng `\Rightarrow x^2 = ?`, chỉ dùng Δ khi phương trình bậc hai có đủ hạng tử bậc nhất. Kết quả của ô `?` ở các bước sau chỉ gọi bằng ký hiệu (`x_1`, `x_2`, `BC`, `S_{20}`, `f(x_1)`) — kể cả khi xét dấu ("các khoảng chia bởi $x_1, x_2$", không viết khoảng có số), và không viết giá trị hàm tại nghiệm (`y(1)`) hay thay nghiệm vào biểu thức (`1^4 - 2 \cdot 1^2 + 3`). Giá trị tại nhiều điểm: `y(0) = ?, y(x_1) = ?, y(2) = ?` — bộ lọc cũng thay nghiệm lộ bằng ký hiệu (không sinh `y(?)`, `? = ?`, `x = 0, ?, 2`). Giá trị lượng giác giữ dạng `\cos 60^\circ`. Không nới quy tắc này khi sửa prompt hay bộ lọc.
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
- **Dark mode:** toggle qua class `.dark-mode` trên `<html>` (state ở `App.jsx`; lưu theo tài khoản ở `learning_stats.preferences`, `localStorage.formulax_dark` chỉ là bộ đệm của máy + nơi lưu cho khách — xem mục "Đồng bộ nhiều thiết bị") — là tính năng thật đang hoạt động, không phải CSS thừa. **Dark mode GIỮ NGUYÊN không đổi** khi chuyển sang Navy+Amber (quyết định 2026-07-04) — bản thân dark mode vốn đã dùng tông slate-navy riêng (`#0F172A`/`#1E293B`/`#334155`), không xung đột với bảng màu mới nên không cần làm lại. Card kính chuyển sang nền slate đặc (`#1E293B`/`#334155`) thay vì hiệu ứng kính khi ở dark mode — hành vi này không đổi. Bất kỳ view nào migrate sang Tailwind đều phải giữ đúng hành vi dark mode này bằng `dark:` variant, không được bỏ sót.

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
  AI hoặc ghi chú người dùng, `\href{javascript:...}` là XSS thật. `strict: "ignore"` (không phải
  bảo mật): chỉ tắt cảnh báo console cho chữ tiếng Việt có dấu trong `\text{…}`.
- **Backend bắt buộc `NODE_ENV=production` khi deploy** — thiếu biến này thì route DEV
  `/payos/simulate-success` (cấp Premium, bỏ qua xác minh chữ ký PayOS) vẫn mở.
- **Rate limit** ở `backend/server.js` áp cho `/api/chat` và `/payos/create`, **không** áp cho
  `/payos/webhook` (chặn nhầm webhook = người dùng trả tiền nhưng không được cấp Premium).
- Lỗi trả về client không kèm `error.message` của SDK; chi tiết chỉ ghi vào log server.
- **Khóa bí mật chỉ nằm trong `.env` (đã ignore); file `*.example` để trống hoặc giữ chỗ `your_xxx`.**
  Hook `.githooks/pre-commit` → `scripts/check-secrets.mjs` chặn commit có `gsk_`, JWT, `sb_secret_`,
  `*_KEY/_SECRET/_TOKEN=` có giá trị khác giữ chỗ trong `*.example`, hoặc file `.env` thật. Mỗi bản
  clone bật một lần: `git config core.hooksPath .githooks`. Không commit bằng `--no-verify` để lách
  hook. Trước khi push: `node scripts/check-secrets.mjs --range origin/master..HEAD`. Sửa script thì
  chạy `node scripts/test-check-secrets.mjs`.

## AI Finder — hướng dẫn các bước, không tính kết quả (từ 2026-09-30)

AI trình bày cách giải dựa trên công thức trong thư viện, **học sinh tự tính**. Câu trả lời gồm:
"Công thức sử dụng" (thẻ công thức) → "Các bước giải" (Bước 1..n, chỗ cần tính để ô `?`) → một
câu nhắc tự tính. **Không có mục "Kết quả"**, không trường kết quả nào trong dữ liệu. Frontend
(`StepAnswer.jsx`) vẽ mỗi `?` trong phần toán thành ô viền amber (`\fcolorbox`, không cần `trust`).

**Luồng backend** (`POST /api/chat` trong `backend/server.js`):
1. `lib/formulaCatalog.js` lọc tối đa 10 công thức ứng viên từ `formulas.js`: nhóm công thức theo
   dạng bài (`METHOD_GROUPS` — cực trị kéo theo công thức đạo hàm...) được ghim trước, còn lại theo
   từ khóa câu hỏi. Thêm dạng bài mới thì thêm nhóm + test trong `test/formulaCatalog.test.js`.
   Nhóm lớp 10 (2026-10-08): hàm số bậc hai (có x², không có bậc ≥ 3/mũ/log/lượng giác) + đồng biến /
   biến thiên / GTLN–GTNN / đỉnh → ghim biến thiên + parabol, KHÔNG ghim đạo hàm; giao điểm parabol với
   trục → phương trình bậc hai + parabol; từ 2 "góc XYZ" trở lên → côsin, định lý sin, diện tích theo sin.
   **Theo lớp học sinh** (`grade` chọn ở onboarding, frontend gửi kèm `/api/chat`): công thức lớp cao
   hơn KHÔNG được ghim ở bất kỳ nhóm nào và bị trừ 0,5 điểm (xếp sau công thức cùng mức liên quan,
   không loại hẳn — có thể chọn nhầm lớp); chưa chọn lớp thì như cũ. AI cũng được báo lớp: tin system
   "Học sinh đang học lớp N." đặt NGAY TRƯỚC đề (phần động — không đụng tin #1; không ghép vào đề vì bộ
   lọc số lấy số trong đề làm số có sẵn), mỗi dòng thư viện có cột `lớp`, và quy tắc 1d trong phần cố
   định: ưu tiên công thức lớp của học sinh, chỉ dùng lớp cao hơn khi không có cách nào khác. Chạy thật
   2026-10-08 (lớp 10, "đồng biến" và "bảng biến thiên" hàm bậc hai): không câu nào dùng đạo hàm. Kiểm tra độ phủ offline:
   `node backend/scripts/shortlist-coverage.mjs [lớp]` (20 đề lớp 10, phải 20/20).
   So khớp chỉ giữ a–z/0–9 sau khi bỏ dấu, nên ký hiệu ("△", "ΔABC", "⊥") mất hẳn → trước khi so khớp,
   `lib/problemText.js` (`expandShorthand`) đổi ký hiệu và viết tắt của học sinh ("pt", "hs", "đt",
   "tđ", "vt", "ptđt", "đths"...) sang chữ đầy đủ — CHỈ để chọn ứng viên, đề gửi AI vẫn nguyên văn.
   Lỗi thật 2026-10-08: "… của △ có 3 cạnh 5, 12, 13" mất định lý côsin + diện tích theo sin khỏi 10 ứng
   viên → no_formula. Δ đứng riêng (biệt thức) giữ nguyên; "tg" chỉ là tam giác khi đi với tên hình /
   "vuông, cân, đều, có…" ("tg x" = tang theo sách cũ). Thêm viết tắt mới thì thêm test trong
   `test/problemText.test.js`; xem log `[finder:no_formula]` (có `source` ảnh/gõ tay, `expanded`) để
   biết học sinh còn viết gì app chưa hiểu.
2. `lib/finderPrompt.js` dựng tin nhắn theo thứ tự CỐ ĐỊNH để Groq cache phần đầu (token lấy từ cache
   không tính vào hạn mức token/phút, token/ngày): tin system #1 `FINDER_SYSTEM_PROMPT` (quy tắc + ví dụ,
   giống hệt nhau từng byte ở mọi câu hỏi) → tin system #2 thư viện ứng viên → lịch sử → câu hỏi.
   **Không chèn gì thay đổi theo câu hỏi/người dùng (ngày giờ, tên, lượt còn lại...) vào tin #1** —
   `test/finderPrompt.test.js` giữ điều này. Phần cố định gồm 4 ví dụ mẫu — cố ý KHÔNG dùng
   chính các đề trong bộ câu kiểm thử, để lần chấm còn đo được) và khai báo
   model/tham số. AI trả JSON: `type` (`solution | no_formula | refuse_answer | off_topic`),
   `formula_ids`, `intro`, `steps[{title, detail, expression}]`, `reminder`. **Không dùng
   `response_format` (json_object/json_schema)**: chế độ ràng buộc JSON của Groq chặn lệnh LaTeX viết
   với một dấu `\` (`\angle`, `\circ`, `\mathbb` — escape JSON không hợp lệ) nên học sinh thấy
   "60circ", "mathbbR" (kiểm 47 câu trả lời thô, 2026-10-03). Nhận văn bản tự do rồi tự sửa escape.
3. `lib/solutionGuard.js`: sửa escape LaTeX (chỉ nhân đôi `\` chưa escape), bỏ id không có
   thật (solution mà không còn id hợp lệ → `no_formula`), **bộ lọc "không tính"** (định nghĩa
   2026-09-30): ĐƯỢC rút gọn biểu thức còn chứa biến ($y' = 3x^2 - 6x - 9$ — số mới là hệ số
   hoặc số mũ của biến) và thay số chưa tính vào công thức nghiệm (mọi số có sẵn); CẤM mọi giá
   trị số cụ thể — nghiệm ($x = 3$, kể cả khi 3 có trong đề), giá trị tại một điểm, Δ = số, phép
   tính ra kết quả, hằng số mới đứng riêng, tích = 0 có nhân tử $(x \pm số)$ (lộ nghiệm), và đại
   lượng đề hỏi (V, S, d, P, h, R) viết ở dạng đã rút gọn theo tham số ($V = \frac{a^3\sqrt{2}}{3}$ —
   phải dừng ở $V = \frac{1}{3} \cdot a^2 \cdot a\sqrt{2}$). "Số có sẵn" = số
   trong đề (+ câu hỏi trước nếu tin nhắn không có số riêng) + công thức đã chọn + hệ số hợp lệ
   của các bước trước. Từ 2026-10-03 (ô trống) còn CẤM: `x^2 = 1`/`2x = 6` (vế trái chứa ẩn, kể cả
   khi số "có sẵn"), `y(1)` với 1 không phải điểm đề cho, khoảng/tập hợp có đầu mút là số không có
   trong đề (`(-\infty; -1)`), danh sách `x = 0, 1, 2` có nghiệm. Cách xử lý vi phạm (`askFinder`):
   **hỏi lại AI một lần** (kèm danh sách giá trị lộ; model chính bị 429 theo phút thì hỏi lại bằng
   model dự phòng), vẫn lộ hoặc không hỏi lại được → **thay đúng con số lộ bằng `?`**
   (`maskMathLeaks`/`maskTextLeaks`); chỉ khi không thay sạch được mới gộp thành bước trung tính
   "Thay số vào công thức". Làm sạch cuối (`dropNumericSubstitutions`, 2026-10-04): dòng biểu thức
   đã thay số (lũy thừa / tích của số có trong đề: `8^2 + 5^2 - 2 \cdot 8 \cdot 5…`) bị bỏ, giữ chữ của
   bước — không tính là vi phạm phải hỏi lại; không bắt `(20-1)d`, `x_2^2`. Giới hạn đã biết: hằng số tính ra trùng số trong đề vẫn lọt (vd
   $D = -3$ khi đề có điểm $(1;2;3)$); giá trị lượng giác đã thay (`\frac{1}{2}` thay cho
   `\cos 60^\circ`) chỉ được prompt chặn, bộ lọc không bắt. Có test trong `backend/test/` — sửa
   guard thì chạy `npm test`.
   **Bài trắc nghiệm** (từ 2026-10-07, `lib/choiceGuard.js`, chỉ chạy khi đề có chữ "trắc nghiệm" hoặc
   nhãn A. B. C.): AI hướng dẫn như bài thường, kết thúc bằng ô `?`, KHÔNG nói phương án nào đúng —
   prompt quy tắc 3b + bộ lọc bắt "đáp án A", "chọn B", "phương án C đúng", "D là đáp án đúng" → hỏi
   lại một lần, vẫn còn thì bỏ câu đó. Cố ý KHÔNG chặn dạng khoảng/giá trị của kết quả (quyết định
   của chủ dự án).
   `no_formula`: học sinh chỉ thấy câu mặc định, KHÔNG nêu tên công thức/phương pháp còn thiếu;
   lời giải thích của model chỉ ghi vào log `[finder:no_formula]` (trường `aiNote`).
4. Trả về `{type, formulaIds, intro, steps, reminder, reply, remaining}`.

Quy tắc khi sửa:
- **Thẻ công thức lấy tên + LaTeX từ `formulas.js` theo id**, không lấy chữ nào của AI. AI chỉ
  được đổi tên điểm/cạnh/biến cho khớp đề (vd định lý côsin cho cạnh c), ngoài ra giữ nguyên.
- Thư viện không có công thức phù hợp → `no_formula`, nói rõ thư viện chưa có; không gợi ý công
  thức hay tài liệu ngoài.
- **Kiến thức nền THCS** (quy tắc 1c của prompt, 2026-10-08): AI được dùng KHÔNG cần thẻ công thức,
  CHỈ hai điều — tổng ba góc tam giác bằng 180° và định lý Pytago. Không thêm vào `formulas.js`.
  `BACKGROUND_KNOWLEDGE_LATEX` (`lib/finderPrompt.js`) cho bộ lọc "không tính" biết 180, 90 là số có
  sẵn (thiếu nó thì `A = 180^\circ - B - C` bị bắt nhầm). Mở rộng danh sách phải hỏi chủ dự án.
- **Model `openai/gpt-oss-120b`**, chọn sau khi chấm cùng bộ câu với `gpt-oss-20b`: lộ số 2/12
  so với 5/12, không lỗi hiển thị LaTeX (20b: 3), không lỗi JSON 400 (20b: 2); đổi lại chậm hơn
  (~2,5s so với 1,4s). Đổi model hoặc thêm ví dụ vào prompt thì chấm lại trên bộ câu thử, chỉ giữ
  nếu giảm lộ số rõ rệt (ví dụ đạo hàm đã thử và bị bỏ vì không cải thiện).
- **Model dự phòng `openai/gpt-oss-20b`** (`FINDER_FALLBACK_MODEL`): hạn mức gói miễn phí tính
  RIÊNG từng model (kiểm chứng 2026-09-30). Khi 120b trả 429 do hết hạn mức NGÀY (TPD/RPD), backend
  gọi lại bằng 20b và nhớ mốc bị chặn để các câu sau vào thẳng 20b; 429 theo phút vẫn báo "AI đang
  bận". Mỗi câu dùng dự phòng có một dòng log `[finder:fallback]`.
- **Chấm / thử nghiệm model CHỈ dùng `GROQ_EVAL_API_KEY`** (key ở tài khoản Groq riêng, khai báo
  trong `backend/.env`). Script chấm thiếu biến này thì phải DỪNG, tuyệt đối không dùng
  `GROQ_API_KEY`: gói miễn phí giới hạn 200k token/ngày cho `gpt-oss-120b` (~44 câu hỏi/ngày cho
  cả app), một lượt chấm 20 câu tốn ~90k token — chấm bằng key production là ăn vào hạn mức của
  học sinh thật (đã xảy ra ngày 2026-09-30).
- **Thời gian:** backend có ngân sách 40s/request (`CHAT_BUDGET_MS` trong `lib/finderAnswer.js`),
  mỗi lần gọi Groq timeout = min(25s, thời gian còn lại), JSON hỏng chỉ gọi lại khi còn ≥ 8s.
  Timeout frontend (`callAI` trong `FormulaFinder.jsx`) là 45s và **PHẢI lớn hơn** ngân sách
  backend — frontend bỏ cuộc trước thì backend vẫn tính lượt mà học sinh không thấy gì.
- **Đếm lượt:** Free 10/ngày (bảng `ai_usage_daily`, RPC `increment_ai_usage` — migration 006),
  Premium không giới hạn, khách (Supabase anonymous) bị chặn 403. Lượt được tăng TRƯỚC khi gọi
  Groq rồi **hoàn lại** (`refund_ai_usage` — migration 007, qua `lib/quotaFlow.js`) trong mọi
  trường hợp không giao được câu trả lời: vượt hạn mức, Groq 429 (trả `code: "ai_busy"`), Groq
  lỗi/timeout, JSON hỏng, và **`no_formula`** (từ 2026-10-08, `countsAsTurn` trong
  `lib/finderAnswer.js` — thư viện thiếu / app chưa hiểu cách viết đề không phải lỗi của học sinh).
  `off_topic`, `refuse_answer` vẫn tính lượt.
- **Log:** chỉ ghi nội dung câu hỏi (cắt ≤ 150 ký tự), `type`, id công thức. KHÔNG ghi
  google_id, email, tên hay token. Mọi request có một dòng `[finder:usage]` (model, attempts,
  promptTokens, cachedTokens, completionTokens, ms — không có câu hỏi) để theo dõi prompt caching;
  `[finder:guard]` có thêm `cachedTokens`, `choiceReveals`.
- **Frontend:** `components/StepAnswer.jsx` hiển thị câu trả lời (dùng chung cho 2 ví dụ tĩnh của
  khách). Tin nhắn chỉ lưu `answer.formulaIds`, không lưu cả object công thức; tin định dạng cũ
  trong `chat_sessions` (`aiResult`) vẫn phải hiển thị được. Tin hệ thống (`isError`,
  `isLimitHit`, `isNotice`) được lưu trong phiên nhưng **không gửi lên AI làm lịch sử**.
  Biểu thức dài KHÔNG được bắt học sinh cuộn ngang (ô `?` hay nằm ở phần bị khuất): biểu thức của bước
  được tách dòng ở cấp ngoài cùng (`utils/mathLines.js`: trước "\text{ với }", trước `\Rightarrow`/⇒,
  tại dấu phẩy ngăn hai biểu thức độc lập; không tách trong ngoặc, phân số, căn) — dòng nhiều khúc vừa
  thì hiện liền, không vừa thì mỗi khúc một dòng; khúc vẫn quá rộng và thẻ công thức thư viện thì
  `components/FitMath.jsx` thu nhỏ cỡ chữ (tối thiểu 55%). Công thức thư viện không bao giờ bị tách.
  Lưu ý Tailwind v4: class utility nằm trong `@layer`, thua CSS không layer của App.css/KaTeX (vd
  margin của `.math-block`, `.katex-display`) — phải dùng dạng `!` (`[&_.math-block]:!my-0`).
- **"AI đang bận" (Groq 429 theo phút):** backend trả `retryAfter` (header retry-after → "try again in
  …" → 60s, trần 120s) và hoàn lượt như cũ; log `[finder:busy]` (loại hạn mức, số giây). Tab bài từ
  ảnh đếm ngược rồi tự hỏi lại MỘT lần; trong lúc chờ không tab nào gọi AI. Ô chat gõ tay vẫn chỉ báo
  "AI đang bận" (chưa đếm ngược).
- **Nhập đề bằng ảnh** bật/tắt bằng cờ `FINDER_IMAGE_INPUT_ENABLED` trong `src/config/features.js`
  (bật từ 2026-10-07 — thay nút camera/ghim giấy giả lập cũ). Xem mục "Đọc ảnh đề" bên dưới.

### Đọc ảnh đề — Gemini chỉ chép đề, Groq vẫn hướng dẫn (từ 2026-10-07)

Luồng: nút ảnh trong ô nhập → bảng chọn **Chụp ảnh** (`capture="environment"`) / **Chọn ảnh** (KHÔNG
có `capture` — trên Android `capture` buộc mở camera) kèm thông báo quyền riêng tư → nén ở trình
duyệt (`utils/imageCompress.js`: cạnh dài ≤ 2000px, JPEG 0,82, xoay theo EXIF) → `POST /api/ocr` →
màn "Các bài trong ảnh" (`components/ImageProblemsPanel.jsx`) → tab từng bài (`ProblemTabs.jsx`).
- **Backend** (`lib/ocrReader.js`): model `gemini-3.5-flash-lite`, dự phòng `gemini-3.1-flash-lite`
  (429/5xx/timeout/JSON hỏng → dự phòng một lần; hạn mức tính riêng từng model). Chế độ JSON
  (`responseMimeType`) nhưng Gemini VẪN có lúc viết lệnh LaTeX một dấu `\` — JSON hỏng (`\circ`) hoặc
  hợp lệ mà sai nghĩa (`\neq` → xuống dòng + "eq", `\frac` → ký tự `\f`). Vì vậy **không parse
  "thường" trước**: `parseOcrJson` luôn chạy `keepOcrNewlines` ("\n" là xuống dòng trừ khi là lệnh
  LaTeX bắt đầu bằng n — `\neq`, `\nu`, `\not`, `\nabla`...) rồi sửa escape rồi parse. Câu lệnh
  `lib/ocrPrompt.js` là **nguyên văn đã duyệt** (quy tắc 5 bản v2 từ 2026-10-08) — không sửa chữ nào
  khi chưa hỏi; đổi thì chạy lại bài thử ảnh (`scratchpad/ocr-test`, đã gitignore vì ảnh có chữ viết
  học sinh; ví dụ trong câu lệnh không được trùng đề của ảnh thử).
- **Giới hạn đã biết — model vẫn đoán số bị che:** ảnh 04 (đầu bút che một phần chữ số) cả Flash-Lite
  lẫn 3.5 Flash đều điền số thay vì `[?]`, kể cả với quy tắc 5 v2 (thử 2026-10-08). Lớp bảo vệ chính là
  **ảnh gốc hiện trên màn chọn bài** (thu nhỏ, bấm để phóng to — `ImageZoomViewer.jsx`, tự xử lý chụm
  2 ngón) + dòng nhắc "Kiểm tra lại từng con số với ảnh trước khi chọn bài". Ảnh là object URL của
  bản đã nén, chỉ trong trình duyệt, revoke khi rời màn chọn bài. Ảnh kiểm tra theo byte đầu (JPEG/PNG/WebP), tối đa 1,5 MB;
  route có parser JSON riêng (các route khác giữ 64kb). Ngân sách 40s (`OCR_BUDGET_MS`) < timeout
  frontend 45s (`callOcr` trong `FormulaFinder.jsx`).
- **Giới hạn quét** (không tính vào 10 lượt AI Finder): Free 20/ngày, Premium 50/ngày (bảng
  `ocr_usage_daily`, RPC `increment_ocr_usage`/`refund_ocr_usage` — migration 009, tăng trước rồi
  hoàn khi lỗi qua `runWithQuota`), 5 lần/phút mỗi tài khoản (`lib/perKeyLimiter.js`, trong bộ nhớ),
  30/phút mỗi IP. Khách 403. Ảnh không có đề (problems rỗng) vẫn tính lượt quét.
- **Không lưu ảnh, không ghi ảnh hay chữ trong đề vào log** — `[ocr]` chỉ có số liệu (model, ms, KB,
  số bài, số chỗ [?], token).
- **Màn chọn bài:** chỗ `[?]` (Gemini không đọc rõ) tô đỏ — khác ô `?` amber của AI Finder; bài còn
  `[?]` phải **Sửa đề** xong mới chọn được ("Hướng dẫn tất cả" bỏ qua bài đó). Ghi chú hình vẽ
  (`figureNote`) hiện để học sinh kiểm tra và sửa được. Mỗi bài hướng dẫn = 1 lượt AI Finder; chọn
  nhiều hơn số lượt còn lại thì báo trước, không gọi.
- **Tab từng bài:** CHỈ gọi AI Finder cho tab đang mở, chưa có kết quả, và **không gọi song song** —
  mở tab khác trong lúc chờ thì bắt đầu ngay khi bài trước xong (`nextGuidanceRequest`). Lỗi không tự
  gọi lại (phải bấm Thử lại). Tab chỉ có ✓ khi đã có hướng dẫn các bước (`isGuided`) — không cho
  no_formula, lỗi, AI bận. `no_formula` hiện gợi ý "viết rõ tên hình…" + nút **Sửa đề** ngay trong tab
  (lưu xong thì hỏi lại). Bài từ ảnh gửi `source: "image"` lên `/api/chat` (chỉ để ghi log). Tin gửi AI = đề đã xác nhận + "(Hình vẽ cho biết: …)", không kèm lịch
  sử; đề + câu trả lời được thêm vào cuộc trò chuyện hiện tại để lưu/đồng bộ như tin gõ tay.
- **Thông báo quyền riêng tư** nằm ở hằng số `OCR_PRIVACY_NOTICE` (`src/config/features.js`). Đang dùng
  gói Gemini MIỄN PHÍ — Google có thể dùng nội dung để cải thiện dịch vụ, câu thông báo phải nói thật
  điều đó. Khi bật thanh toán cho key Gemini thì sửa câu này.

### Hướng phát triển đợt 2 — suy ra công thức (CHƯA làm, chưa có thiết kế được duyệt)

Hiện AI chỉ được dùng công thức thư viện đúng như đang viết (được đổi tên biến). Dạng bài cần
biến đổi công thức — vd biết thể tích khối cầu, tìm bán kính — thì AI chỉ có thể hướng dẫn thay
số vào công thức gốc để học sinh tự giải ngược, hoặc trả `no_formula`. Đợt 2 dự kiến cho phép
một bước "suy ra công thức" từ công thức thư viện. Nguyên tắc phải giữ khi làm:
- **Phạm vi ban đầu:** chỉ biến đổi MỘT công thức thư viện để tìm đại lượng khác (vd từ
  $V = \frac{4}{3}\pi R^3$ suy ra $R$). Không ghép nhiều công thức trong một lần suy ra.
- **Backend BẮT BUỘC kiểm chứng bằng số trước khi trả về:** AI trả thêm công thức gốc và công
  thức suy ra ở dạng biểu thức máy đọc được; backend thay nhiều bộ giá trị ngẫu nhiên vào công
  thức gốc rồi kiểm tra công thức suy ra cho ra lại đúng giá trị. Sai hoặc không kiểm được thì
  bỏ phần suy ra, trả `no_formula`. Không có bước kiểm chứng này thì không được bật tính năng.
- Công thức suy ra chỉ xuất hiện như một bước biến đổi trong "Các bước giải", luôn gắn với id
  công thức gốc; thẻ "Công thức sử dụng" vẫn chỉ hiện công thức gốc từ `formulas.js`.
- **Giao diện đánh dấu rõ "Suy ra từ: <tên công thức gốc>"**, trình bày khác thẻ công thức thư
  viện để học sinh không nhầm công thức suy ra là công thức có sẵn trong thư viện.
- Không tự ghi công thức suy ra vào `formulas.js`. Muốn thêm thành công thức riêng thì theo quy
  tắc chống hallucination: có nguồn SGK, điền `sgk_source`, người dùng xác nhận.
- Phép biến đổi cũng không được tính ra số (bộ lọc số vẫn áp dụng).
- Trước khi triển khai: đề xuất thiết kế, chấm trên bộ câu thử (tỉ lệ suy ra sai, lộ số, chặn
  nhầm) như đợt 1, rồi chờ người dùng duyệt.

## Deploy — thứ tự bắt buộc

- **Migration Supabase chạy TRƯỚC khi deploy backend/frontend** dùng tới nó (vd 006 `ai_usage_daily` +
  `increment_ai_usage`, 007 `refund_ai_usage`, 008 cột đồng bộ cài đặt trên `learning_stats` —
  frontend dùng, 009 `ocr_usage_daily` cho `/api/ocr`). Chạy theo số thứ tự; file `_rollback.sql` đi kèm
  để hoàn tác. Migration đã chạy trên Supabase thì không sửa dòng SQL nào, chỉ được sửa comment.
- **Render — Root Directory / Build Filters:** backend import `FormulaX-AI/src/data/formulas.js`
  (ngoài thư mục `backend/`). Nếu service trên Render đặt Root Directory = `backend` thì phải thêm
  `FormulaX-AI/src/data/formulas.js` vào **Build Filters → Included Paths**, nếu không sửa công
  thức sẽ không kích hoạt deploy lại backend và AI Finder dùng dữ liệu cũ.
- Sau deploy kiểm tra `GET /api/health` → `formulasLoaded` phải bằng số công thức trong
  `formulas.js` (hiện 246). Bằng 0 hoặc lỗi = backend không đọc được file.
- Backend bắt buộc `NODE_ENV=production` (xem mục Hiệu năng & bảo mật).
- Đọc ảnh đề cần `GEMINI_API_KEY` trên Render (thiếu thì `/api/ocr` trả 500, log khởi động báo ❌).

## Đồng bộ nhiều thiết bị (từ 2026-10-01)

Mọi dữ liệu của tài khoản Google phải nằm trên Supabase; `localStorage` chỉ được dùng làm bộ đệm
(vẽ đúng ngay lúc mở app) hoặc cho khách. Khi thêm cài đặt/trạng thái mới, KHÔNG lưu chỉ ở máy.
- Cài đặt `{ darkMode, grade, notifPrefs, onboarded }` → cột `learning_stats.preferences` (jsonb,
  migration 008), ghi nguyên object qua `syncPreferences()` trong `App.jsx`. Thêm cài đặt mới thì
  thêm khoá vào object này. Gộp khi tải: giá trị trên tài khoản thắng, khoá tài khoản chưa có thì
  lấy giá trị ở máy rồi đẩy lên. App hiện lại (`visibilitychange`) thì đọc lại `preferences`.
- Công thức đã xem → `learning_stats.viewed_formula_ids`; Thử thách hôm nay → `daily_challenge`.
- Lịch sử chat: server là nguồn sự thật kể cả khi rỗng — không đẩy bản ở máy lên lại (đã từng làm
  cuộc trò chuyện đã xoá sống lại trên máy khác).
- Còn chỉ ở máy, có chủ đích: lượt Quiz của khách, cờ "đã báo huy hiệu" (`formulax_badges_seen_*`,
  chỉ để không báo toast trùng), cache Premium/tên/thống kê (đều có bản gốc trên server).
- Không dùng khoá localStorage chung cho cả máy cho dữ liệu của tài khoản (`formulax_display_name`
  chung đã làm tài khoản sau nhận nhầm tên của người trước) — luôn gắn `_${googleId}`.

## Quy ước code khác

- Props destructuring rõ ràng ở đầu function component.
- Ghi dữ liệu người dùng (bookmark, note, quiz result, flashcard activity, chat session) luôn qua hàm có sẵn trong `lib/supabase.js` (`saveNote`, `saveQuizResult`, `saveFlashcardActivity`, `upsertChatSession`...), không viết insert/update Supabase trực tiếp trong view/component.

## Giới hạn tài khoản Free đang áp dụng — kiểm tra code trước khi đổi số

- Formula Finder (AI): 10 lượt hỏi/ngày, đếm ở backend (`ai_usage_daily`, ngày theo giờ Việt Nam) — bộ đếm "Còn x/10" ở frontend chỉ để hiển thị. Mỗi bài hướng dẫn từ ảnh tính 1 lượt.
- Quét ảnh đề: 20 lần/ngày (Premium 50), không tính vào lượt AI Finder
- Quiz: chỉ dạng trắc nghiệm cơ bản; điền đáp án + dạng kết hợp yêu cầu Premium
- ProgressDashboard: một phần nội dung bị làm mờ cho tài khoản free

Chế độ khách (Supabase anonymous, "Dùng thử không cần đăng nhập"): tra cứu công thức + Quiz 10 lượt/ngày (đếm ở localStorage `formulax_guest_quiz`, `utils/guestQuiz.js`); **không** dùng AI Finder (chỉ xem 2 ví dụ tĩnh); mọi tính năng cá nhân hóa (bookmark, ghi chú, flashcard, tiến độ, lịch sử chat, Premium) bị khóa qua `utils/useGuestGate.js`. Backend nhận diện khách bằng claim `is_anonymous` trong JWT đã xác minh, không tin client.

## Việc không nên làm

- Không tự thêm thư viện UI/component ngoài Tailwind (đã duyệt, xem mục Giao diện) nếu không được yêu cầu — dự án đang tối giản có chủ đích.
- Không đổi AI provider mà không xác nhận với người dùng trước. Hiện chỉ còn đúng một SDK trong `backend/package.json` là `groq-sdk` (Gemini đọc ảnh gọi qua REST) — đừng cài thêm SDK provider khác "để sẵn đó".
- Không sửa hàng loạt `formulas.js`/`questions.js` mà không có bước xác nhận riêng — đây là dữ liệu lõi cho USP "chống hallucination" của sản phẩm, sai ở đây ảnh hưởng trực tiếp uy tín dự án.
- **Không truy vấn database production (Supabase thật) khi chưa hỏi người dùng — kể cả truy vấn chỉ đọc**, kể cả bằng `SUPABASE_SERVICE_ROLE_KEY` có sẵn trong `backend/.env`. Khi được phép: chỉ in **số liệu tổng hợp** (số bản ghi, số tài khoản, tỉ lệ…), không in `google_id`, email, tên hay bất kỳ dữ liệu cá nhân nào; script chỉ đọc, không ghi/xoá.

## Việc sau

- **AI Finder — bảng biến thiên dạng bảng thật:** hiện AI viết bảng biến thiên thành một dòng biểu thức
  mũi tên (`x: -\infty \rightarrow x_I \rightarrow +\infty ;\; y: \uparrow y_I \downarrow`, chạy thật
  2026-10-08). Cần một dạng dữ liệu riêng cho bước "bảng biến thiên" để frontend vẽ bảng thật.
- **AI Finder — không hỏi lại cùng một ô `?` ở nhiều bước:** cùng lần chạy đó, `y_I = ?` được hỏi ở
  bước tìm đỉnh rồi hỏi lại ở bước lập bảng; các bước sau nên gọi kết quả bằng ký hiệu (`y_I`).

- **OCR — trường `occlusions` (sau đợt cho học sinh lớp 10 dùng thử):** yêu cầu Gemini liệt kê vật
  che lên vùng chữ (bút, tay, bóng); backend đánh dấu bài có `occlusions` khác rỗng là cần kiểm tra.
  Lý do: quy tắc 5 v2 không làm model đánh `[?]` cho số bị che (ảnh 04, 2026-10-08), dù model có nhận
  ra cây bút. Phải chấm lại trên cả 4 ảnh thử trước khi dùng.

- **Gia hạn khi còn Premium — ngày hết hạn hiển thị có thể là ngày cũ** cho tới lần tải sau
  (2026-10-02). Sau khi payOS trả về `payment=success`, `PremiumUpgrade.jsx` kiểm tra lại trạng
  thái qua `checkPremiumStatus` (mỗi 3 giây, tối đa 10 lần); tài khoản đang còn hạn thì lần kiểm tra
  đầu đã thấy Premium nên báo thành công ngay, có thể trước khi webhook cộng thêm hạn. Client không
  đọc được bảng `payments` (RLS), nên cần **endpoint backend đọc trạng thái đơn hàng theo
  `orderId`** (xác thực người dùng, chỉ trả đơn của chính họ) để chờ đúng đơn vừa thanh toán.
