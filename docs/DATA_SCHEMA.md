# Schema dữ liệu — formulas.js, questions.js

> Chuyển nguyên văn từ `CLAUDE.md` (mục Schema formulas.js / questions.js) ngày 2026-11-02 để CLAUDE.md gọn hơn. CLAUDE.md chỉ còn quy tắc chính + đường dẫn tới file này.

## Schema `formulas.js` — bắt buộc tuân thủ khi thêm/sửa công thức

**`formulas.js` là nguồn công thức DUY NHẤT của cả app lẫn AI Finder** — backend import thẳng file này (`backend/lib/formulaCatalog.js` → `../../FormulaX-AI/src/data/formulas.js`), không còn danh sách công thức chép tay nào khác. Vì vậy:
- `formulas.js` **KHÔNG được import bất kỳ thứ gì** (ảnh, component, hàm tiện ích, thư viện frontend…) — chỉ export dữ liệu thuần. Node không hiểu import ảnh/JSX/alias của Vite, và gói chỉ cài ở frontend thì backend không có → backend sập ngay lúc khởi động.
- Sửa/thêm công thức ở đây là AI Finder nhận luôn sau khi backend deploy lại; `/api/health` báo số công thức đã nạp (`formulasLoaded`, hiện 249).

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
