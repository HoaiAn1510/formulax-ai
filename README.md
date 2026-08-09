# FormulaX AI

Web app giúp học sinh THPT (lớp 10–12) tra cứu, ghi nhớ và luyện tập công thức Toán.

**USP cốt lõi: chống AI hallucination** — công thức được khóa cứng trong database (`src/data/formulas.js`, `src/data/questions.js`), không để AI tự sinh. Formula Finder (trợ lý AI) luôn ưu tiên trỏ về công thức có sẵn thay vì tự bịa ra công thức mới trong câu trả lời.

## Tính năng chính

- **Thư viện công thức** — tra cứu theo lớp/chủ đề, bookmark, ghi chú cá nhân, tìm kiếm không phân biệt dấu tiếng Việt.
- **Formula Finder** — trợ lý AI (Groq) giải đáp thắc mắc, luôn dẫn nguồn về công thức đã xác minh trong database.
- **Flashcard** — ôn tập theo cơ chế lặp lại ngắt quãng (spaced repetition, SM-2 rút gọn), xuất PDF/ảnh để ôn offline.
- **Luyện đề (Quiz)** — trắc nghiệm/điền đáp án theo lớp, chủ đề, độ khó tuỳ chọn.
- **Tiến độ học tập** — thống kê streak, hiệu suất theo chủ đề, gợi ý ôn tập cá nhân hoá.
- **PWA** — cài đặt được như app, tra cứu công thức offline.
- **Premium** — thanh toán qua PayOS, mở khoá luyện đề không giới hạn, xuất PDF chất lượng cao.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS v4 |
| Backend | Node.js + Express |
| Database & Auth | Supabase (Postgres + Row Level Security, Google OAuth qua Supabase Auth) |
| AI | Groq API (`openai/gpt-oss-20b`) |
| Thanh toán | PayOS |
| Hiển thị công thức | KaTeX |

## Cấu trúc thư mục

```
FormulaX-AI/
  src/
    views/       # Dashboard, FormulaLibrary, FormulaFinder, FlashcardView, QuizView...
    components/  # Header, BottomNav, FormulaDetailModal, Toast, ConfirmDialog...
    context/     # AuthContext.jsx
    data/        # formulas.js, questions.js — dữ liệu lõi
    lib/         # supabase.js — mọi giao tiếp Supabase đi qua đây
    utils/       # katexHelper.jsx, spacedRepetition.js, textSearch.js
backend/
  server.js        # Express API, proxy gọi Groq, webhook thanh toán PayOS
  routes/          # payosPayment.js
  migrations/      # SQL chạy tay trong Supabase SQL Editor
docs/
  SECURITY.md      # Quy ước bảo mật đã chốt
  PERFORMANCE.md   # Kết quả kiểm định hiệu năng
```

## Chạy dự án

```bash
# Frontend
cd FormulaX-AI
npm install
npm run dev        # http://localhost:5173

# Backend
cd backend
npm install
npm run dev         # http://localhost:3001
```

Cần tạo `backend/.env` (xem `backend/.env.example`) với key Supabase, Groq, PayOS trước khi backend chạy đầy đủ chức năng.

## Quy ước phát triển

Xem [CLAUDE.md](./CLAUDE.md) — schema dữ liệu, quy tắc chống hallucination, bảng màu giao diện, và các quy ước kỹ thuật khác.
