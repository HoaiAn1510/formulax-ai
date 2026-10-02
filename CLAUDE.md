# CLAUDE.md — FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán. USP cốt lõi: **chống AI hallucination** — công thức được khóa cứng trong database, không để AI tự sinh. Claude không bao giờ tự bịa hoặc "chỉnh sửa" nội dung công thức toán học đã có, kể cả khi có vẻ đúng.

## Stack

- **Frontend:** React 19 + Vite, tại `FormulaX-AI/`
- **Backend:** Node.js + Express, tại `backend/`
- **Auth:** Google OAuth **qua Supabase Auth** (`supabase.auth.signInWithOAuth`) trong `context/AuthContext.jsx` — luồng redirect cả trang, không phải popup. Nguồn sự thật là phiên Supabase; `localStorage.formulax_user` chỉ còn là bộ nhớ đệm hiển thị, không dùng để xác thực. Gói `@react-oauth/google` vẫn còn trong `package.json` nhưng **không còn được import ở đâu** — giữ tạm làm đường lùi, gỡ sau khi luồng mới chạy ổn trên production. Đổi cách đăng nhập = phá RLS, xem `backend/migrations/003_rls_supabase_auth.sql` trước khi động vào.
- **Database:** Supabase — mọi thao tác đọc/ghi đi qua `src/lib/supabase.js`, không viết query Supabase trực tiếp trong component
- **AI:** Groq API, model `openai/gpt-oss-120b` (AI Finder, khai báo ở `backend/lib/finderPrompt.js`; đổi từ `gpt-oss-20b` ngày 2026-09-30 sau khi chấm so sánh — xem mục AI Finder) — provider duy nhất. SDK Gemini (`@google/generative-ai`) trước đây cài sẵn nhưng không dùng, đã gỡ khỏi `backend/package.json` (2026-07-23) để hết nhầm lẫn. Nếu cần đổi provider, xác nhận với người dùng trước, không tự đổi.
- **Render công thức:** KaTeX qua `utils/katexHelper.jsx` (`MathElement`, `RichTextRenderer`)

## Lệnh thường dùng

```bash
cd FormulaX-AI && npm run dev      # frontend dev server
cd FormulaX-AI && npm run build    # build production
cd FormulaX-AI && npm run lint     # eslint
cd backend && npm run dev          # backend dev (node --watch)
cd backend && npm start            # backend production
cd backend && npm test             # test backend (node --test): bộ lọc số, JSON, hoàn lượt, thời gian
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
  AI hoặc ghi chú người dùng, `\href{javascript:...}` là XSS thật.
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
"Công thức sử dụng" (thẻ công thức) → "Các bước giải" (Bước 1..n) → một câu nhắc tự tính.
**Không có mục "Kết quả"**, không trường kết quả nào trong dữ liệu.

**Luồng backend** (`POST /api/chat` trong `backend/server.js`):
1. `lib/formulaCatalog.js` lọc tối đa 10 công thức ứng viên từ `formulas.js`: nhóm công thức theo
   dạng bài (`METHOD_GROUPS` — cực trị kéo theo công thức đạo hàm...) được ghim trước, còn lại theo
   từ khóa câu hỏi. Thêm dạng bài mới thì thêm nhóm + test trong `test/formulaCatalog.test.js`.
2. `lib/finderPrompt.js` dựng system prompt (danh sách ứng viên + 3 ví dụ mẫu) và khai báo
   model/tham số. AI trả JSON: `type` (`solution | no_formula | refuse_answer | off_topic`),
   `formula_ids`, `intro`, `steps[{title, detail, expression}]`, `reminder`.
3. `lib/solutionGuard.js`: sửa escape LaTeX (chỉ nhân đôi `\` chưa escape), bỏ id không có
   thật (solution mà không còn id hợp lệ → `no_formula`), **bộ lọc "không tính"** (định nghĩa
   2026-09-30): ĐƯỢC rút gọn biểu thức còn chứa biến ($y' = 3x^2 - 6x - 9$ — số mới là hệ số
   hoặc số mũ của biến) và thay số chưa tính vào công thức nghiệm (mọi số có sẵn); CẤM mọi giá
   trị số cụ thể — nghiệm ($x = 3$, kể cả khi 3 có trong đề), giá trị tại một điểm, Δ = số, phép
   tính ra kết quả, hằng số mới đứng riêng, tích = 0 có nhân tử $(x \pm số)$ (lộ nghiệm), và đại
   lượng đề hỏi (V, S, d, P, h, R) viết ở dạng đã rút gọn theo tham số ($V = \frac{a^3\sqrt{2}}{3}$ —
   phải dừng ở $V = \frac{1}{3} \cdot a^2 \cdot a\sqrt{2}$). "Số có sẵn" = số
   trong đề (+ câu hỏi trước nếu tin nhắn không có số riêng) + công thức đã chọn + hệ số hợp lệ
   của các bước trước. Bước vi phạm bị lọc — chuỗi bước liên tiếp có biểu thức gộp thành một bước
   trung tính "Thay số vào công thức", bước chỉ có chữ thì bỏ. Giới hạn đã biết: hằng số tính ra
   trùng số trong đề vẫn lọt (vd $D = -3$ khi đề có điểm $(1;2;3)$). Có test trong
   `backend/test/` — sửa guard thì chạy `npm test`.
   `no_formula`: học sinh chỉ thấy câu mặc định, KHÔNG nêu tên công thức/phương pháp còn thiếu;
   lời giải thích của model chỉ ghi vào log `[finder:no_formula]` (trường `aiNote`).
4. Trả về `{type, formulaIds, intro, steps, reminder, reply, remaining}`.

Quy tắc khi sửa:
- **Thẻ công thức lấy tên + LaTeX từ `formulas.js` theo id**, không lấy chữ nào của AI. AI chỉ
  được đổi tên điểm/cạnh/biến cho khớp đề (vd định lý côsin cho cạnh c), ngoài ra giữ nguyên.
- Thư viện không có công thức phù hợp → `no_formula`, nói rõ thư viện chưa có; không gợi ý công
  thức hay tài liệu ngoài.
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
  lỗi/timeout, JSON hỏng.
- **Log:** chỉ ghi nội dung câu hỏi (cắt ≤ 150 ký tự), `type`, id công thức. KHÔNG ghi
  google_id, email, tên hay token.
- **Frontend:** `components/StepAnswer.jsx` hiển thị câu trả lời (dùng chung cho 2 ví dụ tĩnh của
  khách). Tin nhắn chỉ lưu `answer.formulaIds`, không lưu cả object công thức; tin định dạng cũ
  trong `chat_sessions` (`aiResult`) vẫn phải hiển thị được. Tin hệ thống (`isError`,
  `isLimitHit`, `isNotice`) được lưu trong phiên nhưng **không gửi lên AI làm lịch sử**.
  Biểu thức KaTeX dài cuộn ngang trong khung riêng, không làm tràn trang trên mobile.
- **Nhập đề bằng ảnh/tệp (nút máy ảnh + ghim giấy) đang ẩn** bằng cờ `FINDER_IMAGE_INPUT_ENABLED = false`
  trong `src/config/features.js` (2026-10-02, chưa ổn định) — code xử lý vẫn giữ, bật lại thì đổi cờ thành `true`.

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
  frontend dùng). Chạy theo số thứ tự; file `_rollback.sql` đi kèm
  để hoàn tác. Migration đã chạy trên Supabase thì không sửa dòng SQL nào, chỉ được sửa comment.
- **Render — Root Directory / Build Filters:** backend import `FormulaX-AI/src/data/formulas.js`
  (ngoài thư mục `backend/`). Nếu service trên Render đặt Root Directory = `backend` thì phải thêm
  `FormulaX-AI/src/data/formulas.js` vào **Build Filters → Included Paths**, nếu không sửa công
  thức sẽ không kích hoạt deploy lại backend và AI Finder dùng dữ liệu cũ.
- Sau deploy kiểm tra `GET /api/health` → `formulasLoaded` phải bằng số công thức trong
  `formulas.js` (hiện 246). Bằng 0 hoặc lỗi = backend không đọc được file.
- Backend bắt buộc `NODE_ENV=production` (xem mục Hiệu năng & bảo mật).

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

- Formula Finder (AI): 10 lượt hỏi/ngày, đếm ở backend (`ai_usage_daily`, ngày theo giờ Việt Nam) — bộ đếm "Còn x/10" ở frontend chỉ để hiển thị
- Quiz: chỉ dạng trắc nghiệm cơ bản; điền đáp án + dạng kết hợp yêu cầu Premium
- ProgressDashboard: một phần nội dung bị làm mờ cho tài khoản free

Chế độ khách (Supabase anonymous, "Dùng thử không cần đăng nhập"): tra cứu công thức + Quiz 10 lượt/ngày (đếm ở localStorage `formulax_guest_quiz`, `utils/guestQuiz.js`); **không** dùng AI Finder (chỉ xem 2 ví dụ tĩnh); mọi tính năng cá nhân hóa (bookmark, ghi chú, flashcard, tiến độ, lịch sử chat, Premium) bị khóa qua `utils/useGuestGate.js`. Backend nhận diện khách bằng claim `is_anonymous` trong JWT đã xác minh, không tin client.

## Việc không nên làm

- Không tự thêm thư viện UI/component ngoài Tailwind (đã duyệt, xem mục Giao diện) nếu không được yêu cầu — dự án đang tối giản có chủ đích.
- Không đổi AI provider mà không xác nhận với người dùng trước. Hiện chỉ còn đúng một SDK trong `backend/package.json` là `groq-sdk` — đừng cài thêm SDK provider khác "để sẵn đó".
- Không sửa hàng loạt `formulas.js`/`questions.js` mà không có bước xác nhận riêng — đây là dữ liệu lõi cho USP "chống hallucination" của sản phẩm, sai ở đây ảnh hưởng trực tiếp uy tín dự án.
- **Không truy vấn database production (Supabase thật) khi chưa hỏi người dùng — kể cả truy vấn chỉ đọc**, kể cả bằng `SUPABASE_SERVICE_ROLE_KEY` có sẵn trong `backend/.env`. Khi được phép: chỉ in **số liệu tổng hợp** (số bản ghi, số tài khoản, tỉ lệ…), không in `google_id`, email, tên hay bất kỳ dữ liệu cá nhân nào; script chỉ đọc, không ghi/xoá.
