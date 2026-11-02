# AI Finder, đọc ảnh đề, đề luyện do AI tạo

> Chuyển nguyên văn từ `CLAUDE.md` (mục AI Finder và các mục con) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Provider AI — lịch sử

- **AI:** từ 2026-10-30 AI Finder chạy trên **Gemini** (chủ dự án chốt) — gọi REST qua `backend/lib/geminiChat.js`, không cài SDK (`@google/generative-ai` đã gỡ 2026-07-23, `groq-sdk` đã gỡ 2026-10-30, đừng cài lại). Lý do đổi: Groq gói Free chỉ 8.000 token/phút cho cả app, mỗi câu ~6.000 token nên một phút trả lời được một câu. Model khai báo ở `backend/lib/finderPrompt.js` (`FINDER_MODEL`, dự phòng `FINDER_FALLBACK_MODEL`; đặt được bằng biến Render `FINDER_GEMINI_MODEL` / `FINDER_GEMINI_FALLBACK_MODEL` / `FINDER_GEMINI_THINKING_LEVEL`). Cùng `GEMINI_API_KEY` với đọc ảnh đề. Lịch sử: 2026-09-30 đổi `gpt-oss-20b` → `gpt-oss-120b` (Groq); có một lần thử Gemini trước đó bị revert vì quota. Nếu cần đổi provider lần nữa, xác nhận với người dùng trước, không tự đổi.

## AI Finder — hướng dẫn các bước, không tính kết quả (từ 2026-09-30)

> **2026-10-30 — Finder chuyển từ Groq sang Gemini.** Các mục bên dưới viết lúc còn Groq; con số/lỗi riêng của
> Groq (8.000 TPM, 413 "Request too large", header `retry-after` của Groq, `gpt-oss-*`) là LỊCH SỬ và vẫn nằm
> trong code vì Groq-shaped client được giữ làm giao diện chung. Điểm khác khi chạy Gemini:
> - `lib/geminiChat.js` đổi cuộc gọi/kết quả/lỗi của Gemini về đúng hình dạng askFinder đã đọc (`choices[0].message.content`,
>   `finish_reason`, `usage`; lỗi 429 có `retry-after` lấy từ `RetryInfo.retryDelay`, "per day (RPD/TPD)" khi `quotaId` có
>   `PerDay`). Tin system gộp vào `systemInstruction`. KHÔNG đặt `responseMimeType` (cùng lý do cũ: Gemini vẫn viết
>   LaTeX một dấu `\`, `parseModelJson` tự sửa). Token "suy nghĩ" nằm trong `maxOutputTokens` nên cộng `THINKING_HEADROOM`
>   (1.500); mức suy nghĩ mặc định `low` (`thinkingLevel`, đổi bằng `FINDER_GEMINI_THINKING_LEVEL`).
> - **Hạn mức Gemini tính theo dự án và theo từng model** (không có bảng số trong tài liệu — xem `aistudio.google.com/rate-limit`).
>   Vì vậy `primaryBlockMs` (`lib/finderAnswer.js`): 429 theo PHÚT của model chính cũng chuyển ngay sang model dự phòng
>   (trước đây chỉ 429 theo NGÀY mới chuyển), nhớ mốc `retry-after` (tối đa 60s) để các câu sau vào thẳng model dự phòng;
>   503/500 chuyển và nhớ 20s. Cả hai model cùng 429 → vẫn "AI đang bận" + hoàn lượt như cũ, `retryAfter` là số thật của Gemini.
> - Đã test bằng Gemini giả (`test/geminiChat.test.js`, gồm mô phỏng "1 yêu cầu/phút"). **CHƯA chạy thật** (môi trường dev không
>   có key): trước khi deploy chạy `GEMINI_EVAL_API_KEY=... node backend/scripts/finder-live-check.mjs` — key chấm ở dự án Google
>   riêng, thiếu thì script dừng. Tên model mặc định chưa kiểm bằng lần chạy thật. Mặc định `gemini-3.5-flash-lite` (dự phòng `gemini-3.1-flash-lite`): hạn mức free 15 RPM, 500 RPD mỗi model, dùng chung với đọc ảnh (xem bảng AI Studio 2026-10-30 trong finderPrompt.js).
> - Chất lượng hướng dẫn (lộ số, chọn công thức) trên Gemini CHƯA được chấm lại so với `gpt-oss-120b`; bộ lọc phía backend không đổi.

AI trình bày cách giải dựa trên công thức trong thư viện, **học sinh tự tính**. Câu trả lời gồm:
"Công thức sử dụng" (thẻ công thức) → "Các bước giải" (Bước 1..n, chỗ cần tính để ô `?`) → một
câu nhắc tự tính. **Không có mục "Kết quả"**, không trường kết quả nào trong dữ liệu. Frontend
(`StepAnswer.jsx`) vẽ mỗi `?` trong phần toán thành ô viền amber (`\fcolorbox`, không cần `trust`).

**Luồng backend** (`POST /api/chat` trong `backend/server.js`):
1. `lib/formulaCatalog.js` lọc tối đa `SHORTLIST_SIZE` = 8 công thức ứng viên (từ 2026-10-22, trước đó 10;
   mỗi dòng thư viện gửi AI có ghi chú ≤ `PROMPT_NOTE_MAX` = 100 ký tự, trước đó 160 — xem "Ngân sách token"
   bên dưới) từ `formulas.js`: nhóm công thức theo
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
   model/tham số. AI trả JSON: `type` (`solution | no_formula | refuse_answer | off_topic | invalid_data`),
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
   $D = -3$ khi đề có điểm $(1;2;3)$) — RIÊNG đại lượng đề hỏi dạng tên đoạn/góc viết hoa ("tính BC",
   "tìm độ dài cạnh AC", "tính số đo góc A" — `askedTargets`) gán bằng một số thì luôn bị bắt, kể cả số
   có trong đề (từ 2026-10-08: tam giác AB = AC = 5 "⇒ BC = 5"); giá trị lượng giác đã thay (`\frac{1}{2}` thay cho
   `\cos 60^\circ`) chỉ được prompt chặn, bộ lọc không bắt. Có test trong `backend/test/` — sửa
   guard thì chạy `npm test`.
   **Ngoại lệ HẸP đã được chủ dự án duyệt (2026-10-08) — không mở rộng thêm khi chưa hỏi:** sau dấu `=`
   cuối cùng được là một con số CHỈ KHI thỏa cả ba: vế trái là MỘT ký hiệu đơn chữ thường (không phải
   ẩn x/y/z/t, không phải đại lượng đề hỏi h, d, R, S, V, P); đúng cặp "ký hiệu = giá trị" đó đã có ở một
   bước TRƯỚC của cùng câu trả lời (bước xác định dữ kiện); giá trị có trong đề, tính cả dấu âm
   (`isRestatedDatum`, `declaredPairs` trong `lib/solutionGuard.js`; test `test/restatedDatum.test.js`).
   Lý do: "… vì a = -2" bị thay thành "vì a = ?" (chạy thật). Lớp chính là prompt: quy tắc ô trống dặn
   viết lý do / dữ kiện nhắc lại bằng lời TRƯỚC biểu thức, không đặt sau dấu `=` cuối cùng.
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
  CHỈ ba điều — tổng ba góc tam giác bằng 180°, định lý Pytago, và (từ 2026-10-22, chủ dự án duyệt)
  bất đẳng thức tam giác (tổng hai cạnh bất kỳ > cạnh còn lại). Không thêm vào `formulas.js`.
- **Ba cạnh không tạo thành tam giác → `invalid_data`** (quy tắc 1f, 2026-10-22 — ca mentor "ba cạnh
  1, 2, 4, dùng Hê-rông", trước đó trả nhầm "thư viện chưa có công thức"). AI trả thêm `sides`; backend
  KHÔNG tin AI: `checkTriangleSides` (`lib/solutionGuard.js`) chỉ nhận khi đúng ba số có trong đề và
  thật sự vi phạm, rồi TỰ dựng câu giải thích ("vì $1 + 2 < 4$", không viết tổng ra số); kiểm không
  được → `no_formula` (hoàn lượt). `invalid_data` cũng hoàn lượt. Log `[finder:invalid_data]`.
  CHỈ cho tam giác — góc ≥ 180°, cạnh âm, sin > 1 chưa làm (xem "Việc sau"). Test: `test/invalidTriangle.test.js`.
  `BACKGROUND_KNOWLEDGE_LATEX` (`lib/finderPrompt.js`) cho bộ lọc "không tính" biết 180, 90 là số có
  sẵn (thiếu nó thì `A = 180^\circ - B - C` bị bắt nhầm). Mở rộng danh sách phải hỏi chủ dự án.
- **Lời giải chỉ dùng kiến thức nền (`formula_ids` rỗng) — `checkBaseKnowledge`** (từ 2026-10-22). Bộ ép
  "solution không có id → `no_formula`" (`normalizeAnswer`, có từ 30/9) từng mâu thuẫn với quy tắc 1c (8/10):
  "A = 50°, B = 60°, tính C", "tam giác vuông AB = 6, AC = 8, tính BC", "3, 4, 5 có tạo thành tam giác không?"
  đều bị báo "thư viện chưa có công thức" dù AI giải đúng (chạy thật 5/5 câu). Bây giờ `normalizeAnswer` giữ lại
  bản đã chuẩn hoá (`baseCandidate`) và `finalizeAnswer` gọi `checkBaseKnowledge` (`lib/solutionGuard.js`) —
  backend KHÔNG tin AI khai, tự nhận diện, fail-closed (thiếu điều kiện nào là giữ `no_formula` như cũ, hoàn
  lượt): (1) đề có ngữ cảnh tam giác (`hasTriangleContext`); (2) đề và lời giải không dính tam giác cân/đều
  hoặc Pytago đảo; (3) MỌI biểu thức không rỗng khớp đúng một mẫu — tổng ba góc (`C = 180^\circ - (A+B)`,
  `A + B + C = 180^\circ`), Pytago (`BC = \sqrt{AB^2 + AC^2}` và dạng tìm cạnh góc vuông, đề phải có "vuông"),
  bất đẳng thức tam giác — kèm dữ kiện chỉ gồm số có trong đề; (4) có ít
  nhất một biểu thức như vậy (ẩn cuối phải là `?`, không phải kết quả). Hai góc đã cho cộng ≥ 180° hoặc cạnh huyền ≤ cạnh góc vuông thì không nhận (đề vô
  lý — việc riêng, xem "Việc sau"). Đã kiểm được = câu trả lời thật, TÍNH lượt (khác `invalid_data`). Chữ trong
  `detail` không kiểm được (ngoài lọc cân/đều/đảo); số trong đó vẫn qua bộ lọc "không tính". Log
  `[finder:base_knowledge]` (verified, kinds). KHÔNG mở rộng sang kiến thức nền khác khi chưa hỏi chủ dự án. Test: `test/baseKnowledgeOnly.test.js` (5 câu trả lời thật nguyên văn).
- **Ngân sách token — lỗi 413 của Groq** (2026-10-22): gói miễn phí cho tối đa 8.000 token/yêu cầu và tính
  prompt + `max_completion_tokens` (`FINDER_PARAMS`, hiện trần đầu 2.300, lần hỏi lại 2.000; hàm
  `completionBudget` giảm tiếp theo prompt ước lượng để giữ tổng ≤ 7.800, tối thiểu 1.200). Đo bằng `usage` thật: system #1 = 4.163 token,
  thư viện 8 ứng viên ≈ 930–1.130, câu hỏi ≈ 100; ước lượng yêu cầu 7.050–7.260 (biên 740–950) — trước khi rút là
  5.500–5.600 + 2.500 = 8.000–8.100 (2 câu chấm bị 413: 8.029 và 8.033; production 20/10: 8.091). Token lấy từ
  cache không bị tính nhưng backend ít người dùng nên cache thường nguội — đừng dựa vào cache. Thêm quy tắc/ví dụ
  vào prompt thì chạy `npm test` (`test/tokenBudget.test.js` ước lượng ≤ 7.800) và đo lại bằng `usage`. Nếu vẫn dính
  413 TPM, `askFinder` gọi lại MỘT lần với `max_completion_tokens` thấp hơn đúng phần vượt + 100
  (`reducedCompletionTokens`, tối thiểu 1.200); log `[finder:tpm_retry]` xuất hiện thường xuyên = prompt lại sát trần.
  Completion thật đo được 616–917 token (n = 3, chưa có số production).
- **Model `openai/gpt-oss-120b`**, chọn sau khi chấm cùng bộ câu với `gpt-oss-20b`: lộ số 2/12
  so với 5/12, không lỗi hiển thị LaTeX (20b: 3), không lỗi JSON 400 (20b: 2); đổi lại chậm hơn
  (~2,5s so với 1,4s). Đổi model hoặc thêm ví dụ vào prompt thì chấm lại trên bộ câu thử, chỉ giữ
  nếu giảm lộ số rõ rệt (ví dụ đạo hàm đã thử và bị bỏ vì không cải thiện).
- **Model dự phòng `openai/gpt-oss-20b`** (`FINDER_FALLBACK_MODEL`): hạn mức gói miễn phí tính
  RIÊNG từng model (kiểm chứng 2026-09-30). Khi 120b trả 429 do hết hạn mức NGÀY (TPD/RPD), backend
  gọi lại bằng 20b và nhớ mốc bị chặn để các câu sau vào thẳng 20b; 429 theo phút vẫn báo "AI đang
  bận". Mỗi câu dùng dự phòng có một dòng log `[finder:fallback]`.
- **Chấm / thử nghiệm model CHỈ dùng `GROQ_EVAL_API_KEY`** (key chấm riêng, khai báo
  trong `backend/.env`). Script chấm thiếu biến này thì phải DỪNG, tuyệt đối không dùng
  `GROQ_API_KEY`: gói miễn phí giới hạn 200k token/ngày cho `gpt-oss-120b` (~44 câu hỏi/ngày cho
  cả app), một lượt chấm 20 câu tốn ~90k token — chấm bằng key production là ăn vào hạn mức của
  học sinh thật (đã xảy ra ngày 2026-09-30).
- **Chấm tiếp sau khi hạn mức Groq làm mới** (dự kiến khoảng 07:00 giờ Việt Nam do tính theo UTC):
  chỉ chạy các ca 19, 21, 22, 23, 24 bằng `GROQ_EVAL_API_KEY`. Trước khi chạy, kiểm tra trang Usage
  của Groq để xác định key chấm và key production có thuộc cùng tổ chức không. Nếu cùng tổ chức,
  tránh chấm trong giờ học sinh đang dùng app. Không chạy thêm ca AI thật ngày 2026-10-23.
- **Thời gian:** backend có ngân sách 40s/request (`CHAT_BUDGET_MS` trong `lib/finderAnswer.js`),
  mỗi lần gọi Groq timeout = min(25s, thời gian còn lại), JSON hỏng chỉ gọi lại khi còn ≥ 8s.
  Timeout frontend (`callAI` trong `FormulaFinder.jsx`) là 45s và **PHẢI lớn hơn** ngân sách
  backend — frontend bỏ cuộc trước thì backend vẫn tính lượt mà học sinh không thấy gì.
- **Đếm lượt:** Free 10/ngày (bảng `ai_usage_daily`, RPC `increment_ai_usage` — migration 006),
  Premium không giới hạn, khách (Supabase anonymous) bị chặn 403. Lượt được tăng TRƯỚC khi gọi
  Groq rồi **hoàn lại** (`refund_ai_usage` — migration 007, qua `lib/quotaFlow.js`) trong mọi
  trường hợp không giao được câu trả lời: vượt hạn mức, Groq 429 (trả `code: "ai_busy"`), Groq
  lỗi/timeout, JSON hỏng, và **`no_formula`** (từ 2026-10-08, `countsAsTurn` trong
  `lib/finderAnswer.js` — thư viện thiếu / app chưa hiểu cách viết đề không phải lỗi của học sinh),
  **`invalid_data`** (từ 2026-10-22 — đề sai, không có hướng dẫn nào được giao).
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
- **Giới hạn quét** (không tính vào 10 lượt AI Finder): Free 5/ngày (hạ từ 20 ngày 2026-10-20), Premium 50/ngày (bảng
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

### Kiểm tra › "Luyện lại bài đã hỏi" — Gemini ra đề cùng dạng (từ 2026-11-01)

Ngoại lệ có chủ đích với nguyên tắc "AI không tính ra kết quả": đây là ĐỀ LUYỆN TẬP nên AI được viết đáp số,
nhưng backend không tin AI — mọi câu phải qua kiểm.
- **"Bài đã hỏi"** lấy từ `chat_sessions` (khách: localStorage), không có bảng riêng: tin user + tin bot ngay sau
  có `answer.type === "solution"` (`utils/askedProblems.js`). Câu hỏi lại về bài vừa hỏi ("tui chưa hiểu bước 2" —
  `isFollowUpQuestion`, từ 2026-11-02) không tính là bài mới và không có nút "Làm bài kiểm tra cùng dạng này". Chọn tối đa 3 bài (`MAX_VARIANT_PICK`, hạ từ 5
  vì mỗi câu dùng 2 lần gọi Gemini, hạn mức free 15/phút chung với Finder); frontend gọi LẦN LƯỢT, không song song.
- **`POST /api/quiz/variant`** (`backend/lib/quizVariant.js`): theo đúng mẫu `/api/chat` (xác thực, khách 403, limiter
  chat). **Mỗi câu = 1 lượt AI Finder** (`ai_usage_daily`), hoàn lượt khi lỗi / không qua kiểm; nộp bài KHÔNG trừ
  lượt quiz (chủ dự án chốt). Model + dự phòng + `fallbackState` dùng chung với Finder. Ngân sách 40s < timeout 45s
  của frontend (`VARIANT_TIMEOUT_MS` trong `QuizView.jsx`).
- **Kiểm hình thức — MỌI câu** (`validateVariant`): đúng 4 phương án khác nhau (cả so giá trị số), đúng 1 đáp án,
  `blankAnswer` không `$`/không phải nhãn và khớp số với phương án đúng, số liệu khác đề gốc, `precheckInvalidQuestion`
  của Finder, `formula_ids` ⊆ id gửi cho AI (bắt buộc khi câu trả lời Finder gốc có id; kiến thức nền thì không).
- **Kiểm đáp án — ba mức, theo dạng bài** (log `[quiz:variant]` ghi `verified` + `crossChecked`):
  1. **Tự tính lại** (`expectedAnswer`): CHỈ tổng ba góc, Pytago, phương trình bậc hai (nghiệm / tổng / tích) — backend
     tính đáp số bằng code, phương án đúng phải khớp. `verified` = tên dạng, `crossChecked = null`.
  2. **Kiểm chéo** — mọi dạng còn lại: gọi Gemini lần nữa GIẢI ĐỘC LẬP đề mới (`SOLVER_SYSTEM_PROMPT`, CHỈ gửi đề — không
     gửi 4 phương án, đáp án, lời giải), so đáp số với phương án đúng (`crossCheckMatches`: số thì so giá trị bằng
     `optionNumbers`, không phải số thì so chuỗi chuẩn hoá). Lệch → tính vào lần hỏi lại hiện có. Lần gọi này KHÔNG trừ
     thêm lượt. `crossChecked = true`. Lần giải lỗi (429, 500/503, hết giờ, mạng…) → thử MỘT lần bằng
     `FINDER_FALLBACK_MODEL`; vẫn lỗi, không còn đủ 8s để thử dự phòng, hoặc JSON không đọc được → KHÔNG giao đề:
     `VariantError`, hoàn lượt, "AI đang bận" (log `[quiz:variant_rejected]` có `crossCheckFailed`, `crossCheckErrors`).
     Đây là hai lần model đồng ý với nhau, KHÔNG phải chứng minh đúng: cùng hiểu sai đề thì vẫn lọt; so chuỗi có thể
     chặn nhầm đáp án đúng viết khác dạng (`x+1` / `1+x`).
  3. **Chỉ kiểm hình thức**: CHỈ khi sinh đề xong mà còn < 8s trong ngân sách 40s (không kịp gọi lần giải). Vẫn GIAO đề
     (chủ dự án chốt), `crossChecked = false`, `crossCheckSkipped: "budget"`. Theo dõi tỉ lệ dòng log này; cao thì cân
     nhắc tăng ngân sách hoặc không giao.
  Không qua → hỏi lại AI một lần kèm lỗi → vẫn không qua thì 502 `variant_invalid` "AI đang bận" + hoàn lượt.
  `[quiz:variant_rejected]` chỉ có số liệu + danh sách lỗi.
- JSON parse bằng `parseVariantJson` = `keepOcrNewlines` + `parseModelJson` ("\nThay số" là xuống dòng, không phải lệnh LaTeX).
- Giao diện: thẻ nhỏ trung tính "Đề do AI tạo" trên câu hỏi và phần xem lại — KHÔNG kèm câu kiểu "có thể sai, hãy đối
  chiếu" (chủ dự án chốt 2026-11-01); thẻ công thức ở phần xem lại lấy từ `formulas.js` theo id.
  **"Báo đề sai"** → `POST /api/quiz/variant/report`, CHỈ ghi log `[quiz:variant_report]` (đề + đáp án cắt ngắn, id;
  không google_id/email) — không có bảng (chủ dự án chốt). Đọc log trên Render để soát đề sai.
- Test: `backend/test/quizVariant.test.js`, `npm run test:asked`. CHƯA chấm chất lượng đề trên bộ câu thử bằng key chấm.

### Hướng phát triển đợt 2 / Phase 3 — suy ra công thức (CHƯA làm; dời sau 26/10/2026)

**Trạng thái (2026-10-22):** chủ dự án duyệt **về nguyên tắc** Hướng C — AI được tự ghép tối đa **2** công
thức thư viện, backend KIỂM BẰNG SỐ (không so hình dạng biểu thức), backend tự dựng LaTeX từ biểu thức đã
kiểm — nhưng **dời sau 26/10**, không làm trong 3,5 ngày còn lại trước đó. Bản thiết kế đầy đủ (so sánh 5 hướng,
sơ đồ "công thức nấu" + kiểm bằng số, danh sách cặp thẻ an toàn / rủi ro, ước lượng token và công, câu hỏi
cần quyết): https://claude.ai/artifact/JCqUBVHUEhubW2KjF63n7R (trang riêng tư; chủ dự án cần được chia sẻ).
- **Thay đổi so với nguyên tắc cũ bên dưới:** phạm vi nâng từ MỘT lên TỐI ĐA HAI công thức. Các nguyên tắc còn lại
  (kiểm bằng số bắt buộc, giao diện "Suy ra từ …", không ghi vào `formulas.js`, bộ lọc số vẫn áp dụng) giữ nguyên.
- **Đã xử lý trước, không cần ghép (Hướng 0):** thêm tags "Bán kính nội tiếp" / "Bán kính ngoại tiếp" vào thẻ
  `hh10-herong` để câu "biết ba cạnh, tính r / R" kéo thẻ Hê-rông vào 8 ứng viên (#4) và AI nối tiếp hai thẻ
  (`p = ?` → `S = ?` → `r = S/p`) thay vì cần công thức ghép. Tác dụng phụ đã đo: 2/12 câu không liên quan
  ("đường tròn nội tiếp" trong elip, "ngoại tiếp" lăng trụ) cũng kéo Hê-rông vào ở vị trí #7–#8, đẩy ra ứng viên
  yếu hơn.
- **Việc cần chạy bằng key chấm khi có lại hạn mức:** 12–15 câu chuỗi hai thẻ (r, R, biểu thức đối xứng hai nghiệm
  Vi-ét, trung tuyến theo tọa độ) xem AI nối tiếp hai thẻ có tốt không. Nếu tốt thì dừng ở Hướng 0, KHÔNG làm
  thêm thẻ ghép (Hướng A) hay bảng công thức nấu tĩnh (Hướng C′). Chưa có kết quả.
- Hướng B (so hình dạng biểu thức) đã loại: về bản chất là Cách 2 mở rộng, từ chối biểu thức tương đương và
  không đạt yêu cầu kiểm bằng số.

Nguyên tắc gốc của đợt 2 (đọc cùng ghi chú trên):

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
