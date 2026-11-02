# CLAUDE.md — FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán. USP cốt lõi: **chống AI hallucination** — công thức được khóa cứng trong database, không để AI tự sinh. Claude không bao giờ tự bịa hoặc "chỉnh sửa" nội dung công thức toán học đã có, kể cả khi có vẻ đúng.

## Stack

- **Frontend:** React 19 + Vite, tại `FormulaX-AI/`
- **Backend:** Node.js + Express, tại `backend/`
- **Auth:** Google OAuth **qua Supabase Auth** (`supabase.auth.signInWithOAuth`) trong `context/AuthContext.jsx` — luồng redirect cả trang, không phải popup. Nguồn sự thật là phiên Supabase; `localStorage.formulax_user` chỉ còn là bộ nhớ đệm hiển thị, không dùng để xác thực. Gói `@react-oauth/google` vẫn còn trong `package.json` nhưng **không còn được import ở đâu** — giữ tạm làm đường lùi, gỡ sau khi luồng mới chạy ổn trên production. Đổi cách đăng nhập = phá RLS, xem `backend/migrations/003_rls_supabase_auth.sql` trước khi động vào.
- **Database:** Supabase — mọi thao tác đọc/ghi đi qua `src/lib/supabase.js`, không viết query Supabase trực tiếp trong component
- **AI:** AI Finder, đọc ảnh đề và đề luyện chạy trên **Gemini** qua REST (`backend/lib/geminiChat.js`), không cài SDK — đừng cài lại `@google/generative-ai` / `groq-sdk`. Model ở `backend/lib/finderPrompt.js`. Đổi provider phải hỏi người dùng trước. Lịch sử và chi tiết: `docs/AI_FINDER.md`.
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
cd FormulaX-AI && npm run test:channel # kênh giới thiệu phía trình duyệt (utils/channelRef.js)
cd FormulaX-AI && npm run test:admin # khoảng ngày trang quản trị + dấu gợi ý admin
cd FormulaX-AI && npm run test:asked # "Bài đã hỏi", đề luyện lại do AI tạo, kế hoạch Dashboard "Hôm nay"
```

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
    data/         # formulas.js, questions.js — dữ liệu lõi, schema ở docs/DATA_SCHEMA.md
    lib/          # supabase.js — mọi giao tiếp Supabase đi qua đây
    utils/        # katexHelper.jsx
backend/
  server.js        # Express API, proxy gọi Groq
```

## Tài liệu chi tiết — ĐỌC file tương ứng trước khi làm việc liên quan

| Khi làm việc với… | Đọc |
|---|---|
| `formulas.js`, `questions.js` (thêm/sửa công thức, câu hỏi) | `docs/DATA_SCHEMA.md` — bắt buộc |
| Giao diện, màu, Tailwind, dark mode | `docs/UI_STYLE.md` |
| AI Finder, prompt, bộ lọc "không tính", đọc ảnh đề, đề luyện do AI tạo, hạn mức Gemini | `docs/AI_FINDER.md` |
| Theo dõi kênh giới thiệu, trang quản trị | `docs/ADMIN_TRACKING.md` |
| Lưu cài đặt/trạng thái mới của người dùng | `docs/SYNC.md` |
| Việc còn dang dở, giới hạn đã biết | `docs/BACKLOG.md` |
| Bảo mật, hiệu năng | `docs/SECURITY.md`, `docs/PERFORMANCE.md` |

## Giao diện — tóm tắt (chi tiết ở `docs/UI_STYLE.md`)

- Phong cách Navy + Amber, card trắng phẳng; màu khai báo trong `@theme` của `src/index.css`, không rải hex trong từng file.
- Code mới dùng Tailwind CSS v4 (CSS-first, không có `tailwind.config.js`); không dùng CSS Modules; không thêm thư viện UI.
- Dark mode (`.dark-mode` trên `<html>`) là tính năng thật — mọi view phải giữ bằng `dark:` variant.

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

## Deploy — thứ tự bắt buộc

- **Migration Supabase chạy TRƯỚC khi deploy backend/frontend** dùng tới nó (vd 006 `ai_usage_daily` +
  `increment_ai_usage`, 007 `refund_ai_usage`, 008 cột đồng bộ cài đặt trên `learning_stats` —
  frontend dùng, 009 `ocr_usage_daily` cho `/api/ocr`, 010 theo dõi kênh giới thiệu, 011 trang quản trị + `usage_events_daily`). Chạy theo số thứ tự; file `_rollback.sql` đi kèm
  để hoàn tác. Migration đã chạy trên Supabase thì không sửa dòng SQL nào, chỉ được sửa comment.
- **Render — Root Directory / Build Filters:** backend import `FormulaX-AI/src/data/formulas.js`
  (ngoài thư mục `backend/`). Nếu service trên Render đặt Root Directory = `backend` thì phải thêm
  `FormulaX-AI/src/data/formulas.js` vào **Build Filters → Included Paths**, nếu không sửa công
  thức sẽ không kích hoạt deploy lại backend và AI Finder dùng dữ liệu cũ.
- Sau deploy kiểm tra `GET /api/health` → `formulasLoaded` phải bằng số công thức trong
  `formulas.js` (hiện 249). Bằng 0 hoặc lỗi = backend không đọc được file.
- Backend bắt buộc `NODE_ENV=production` (xem mục Hiệu năng & bảo mật).
- `GEMINI_API_KEY` trên Render dùng cho CẢ AI Finder lẫn đọc ảnh đề (thiếu thì `/api/chat` và `/api/ocr` trả 500, log khởi động báo ❌). `GROQ_API_KEY` không còn được đọc.
- Theo dõi kênh: migration 010 chạy trước backend; `ADMIN_EMAILS` trên Render (trống = không ai xem
  được thống kê, không ai vào được trang quản trị). Trang quản trị: migration 011 chạy trước backend.

## Đồng bộ nhiều thiết bị — tóm tắt (chi tiết ở `docs/SYNC.md`)

Mọi dữ liệu của tài khoản Google phải nằm trên Supabase; `localStorage` chỉ được dùng làm bộ đệm
(vẽ đúng ngay lúc mở app) hoặc cho khách. Khi thêm cài đặt/trạng thái mới, KHÔNG lưu chỉ ở máy.

## Quy ước code khác

- Props destructuring rõ ràng ở đầu function component.
- Ghi dữ liệu người dùng (bookmark, note, quiz result, flashcard activity, chat session) luôn qua hàm có sẵn trong `lib/supabase.js` (`saveNote`, `saveQuizResult`, `saveFlashcardActivity`, `upsertChatSession`...), không viết insert/update Supabase trực tiếp trong view/component.

## Giới hạn tài khoản Free đang áp dụng — kiểm tra code trước khi đổi số

- Formula Finder (AI): 10 lượt hỏi/ngày, đếm ở backend (`ai_usage_daily`, ngày theo giờ Việt Nam) — bộ đếm "Còn x/10" ở frontend chỉ để hiển thị. Mỗi bài hướng dẫn từ ảnh tính 1 lượt.
- Quét ảnh đề: 5 lần/ngày (Premium 50), không tính vào lượt AI Finder — số nằm ở `FREE_OCR_DAILY_LIMIT` trong `backend/server.js`
- Quiz: chỉ dạng trắc nghiệm cơ bản; điền đáp án + dạng kết hợp yêu cầu Premium
- ProgressDashboard: một phần nội dung bị làm mờ cho tài khoản free

Chế độ khách (Supabase anonymous, "Dùng thử không cần đăng nhập"): tra cứu công thức + Quiz 10 lượt/ngày (đếm ở localStorage `formulax_guest_quiz`, `utils/guestQuiz.js`); **không** dùng AI Finder (chỉ xem 2 ví dụ tĩnh); mọi tính năng cá nhân hóa (bookmark, ghi chú, flashcard, tiến độ, lịch sử chat, Premium) bị khóa qua `utils/useGuestGate.js`. Backend nhận diện khách bằng claim `is_anonymous` trong JWT đã xác minh, không tin client.

## Việc không nên làm

- Không tự thêm thư viện UI/component ngoài Tailwind (đã duyệt, xem mục Giao diện) nếu không được yêu cầu — dự án đang tối giản có chủ đích.
- Không đổi AI provider mà không xác nhận với người dùng trước. Gemini gọi qua REST (`lib/geminiChat.js`); `groq-sdk` đã gỡ khỏi `backend/package.json` ngày 2026-10-30 (không còn import nào) — đừng cài lại, và đừng cài thêm SDK provider khác "để sẵn đó".
- Không sửa hàng loạt `formulas.js`/`questions.js` mà không có bước xác nhận riêng — đây là dữ liệu lõi cho USP "chống hallucination" của sản phẩm, sai ở đây ảnh hưởng trực tiếp uy tín dự án.
- **Không truy vấn database production (Supabase thật) khi chưa hỏi người dùng — kể cả truy vấn chỉ đọc**, kể cả bằng `SUPABASE_SERVICE_ROLE_KEY` có sẵn trong `backend/.env`. Khi được phép: chỉ in **số liệu tổng hợp** (số bản ghi, số tài khoản, tỉ lệ…), không in `google_id`, email, tên hay bất kỳ dữ liệu cá nhân nào; script chỉ đọc, không ghi/xoá.
