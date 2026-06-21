import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // set this on Render to your Vercel URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Danh sách toàn bộ công thức trong hệ thống FormulaX
const FORMULA_LIST = [
  // --- Lớp 12: Giải tích ---
  { id: "gt12-daoham-basic",          name: "Đạo hàm các hàm số cơ bản (x^n)",             topic: "Giải tích",          grade: 11 },
  { id: "gt12-daoham-mu",             name: "Đạo hàm hàm số mũ (a^x, e^x)",                topic: "Giải tích",          grade: 12 },
  { id: "gt12-daoham-luonggiac",      name: "Đạo hàm lượng giác (cos, tan, cot)",           topic: "Giải tích",          grade: 11 },
  { id: "gt12-daoham-log",            name: "Đạo hàm logarit (ln x, log_a x)",              topic: "Giải tích",          grade: 12 },
  { id: "gt12-daoham-hopham",         name: "Đạo hàm hàm hợp (Chain Rule)",                 topic: "Giải tích",          grade: 11 },
  { id: "gt12-logarit",               name: "Các tính chất của Logarit",                     topic: "Giải tích",          grade: 12 },
  { id: "gt12-tiemcan",               name: "Tiệm cận ngang, đứng, xiên của đồ thị",        topic: "Giải tích",          grade: 12 },
  { id: "gt12-nguyenham-basic",       name: "Nguyên hàm của lũy thừa (∫x^n dx)",            topic: "Giải tích",          grade: 12 },
  { id: "gt12-nguyenham-bangtable",   name: "Bảng nguyên hàm cơ bản (e^x, sin, cos, 1/x)", topic: "Giải tích",          grade: 12 },
  { id: "gt12-nguyenham-morong",      name: "Nguyên hàm mở rộng với (ax+b)",                topic: "Giải tích",          grade: 12 },
  { id: "gt12-tichphan-newtonleibniz",name: "Công thức Newton–Leibniz (tích phân xác định)", topic: "Giải tích",         grade: 12 },
  { id: "gt12-tichphan-dientich",     name: "Diện tích hình phẳng giới hạn bởi hai đồ thị", topic: "Giải tích",         grade: 12 },
  { id: "gt12-tichphan-thetich",      name: "Thể tích khối tròn xoay (tích phân)",           topic: "Giải tích",         grade: 12 },
  // --- Lớp 12: Hình học ---
  { id: "hh12-thetich-chopsen",       name: "Thể tích khối chóp",                            topic: "Hình học",          grade: 12 },
  { id: "hh12-thetich-langtru",       name: "Thể tích khối lăng trụ",                        topic: "Hình học",          grade: 12 },
  { id: "hh12-matcau-dientich",       name: "Diện tích mặt cầu",                             topic: "Hình học",          grade: 12 },
  { id: "hh12-matcau-thetich",        name: "Thể tích khối cầu",                             topic: "Hình học",          grade: 12 },
  { id: "hh12-khino-thetich",         name: "Thể tích khối nón",                             topic: "Hình học",          grade: 12 },
  { id: "hh12-khitru-thetich",        name: "Thể tích khối trụ",                             topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-khoangcach",       name: "Khoảng cách từ điểm đến mặt phẳng (Oxyz)",     topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-tichvohuong",      name: "Tích vô hướng vectơ trong không gian",          topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-matphang",         name: "Phương trình mặt phẳng tổng quát (Oxyz)",       topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-duongthang",       name: "Phương trình đường thẳng trong không gian",     topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-goc-hai-matphang", name: "Góc giữa hai mặt phẳng",                       topic: "Hình học",          grade: 12 },
  { id: "hh12-oxyz-matcau",           name: "Phương trình mặt cầu trong Oxyz",               topic: "Hình học",          grade: 12 },
  // --- Lớp 12: Đại số & Thống kê ---
  { id: "ds12-sophuc-modun",          name: "Môđun của số phức",                             topic: "Đại số",             grade: 12 },
  { id: "ds12-thongke-phuongsai",     name: "Phương sai và độ lệch chuẩn (ghép nhóm)",      topic: "Đại số",             grade: 12 },
  // --- Lớp 12: Xác suất ---
  { id: "xs12-xacsuat-dieukien",      name: "Xác suất có điều kiện P(A|B)",                  topic: "Xác suất & Tổ hợp", grade: 11 },
  { id: "xs12-xacsuat-toanphan",      name: "Công thức xác suất toàn phần",                  topic: "Xác suất & Tổ hợp", grade: 11 },
  { id: "xs12-bayes",                 name: "Công thức Bayes",                                topic: "Xác suất & Tổ hợp", grade: 11 },
  // --- Lớp 11 ---
  { id: "ds11-csc-tong",              name: "Tổng n số hạng đầu của Cấp số cộng",            topic: "Đại số",             grade: 11 },
  { id: "ds11-csn-tong",              name: "Tổng n số hạng đầu của Cấp số nhân",            topic: "Đại số",             grade: 11 },
  { id: "xs11-tohop",                 name: "Số tổ hợp chập k của n phần tử",                topic: "Xác suất & Tổ hợp", grade: 10 },
  { id: "xs11-chinhhop",              name: "Số chỉnh hợp chập k của n phần tử",             topic: "Xác suất & Tổ hợp", grade: 10 },
  { id: "xs11-xacsuat",               name: "Công thức định nghĩa xác suất cổ điển",         topic: "Xác suất & Tổ hợp", grade: 10 },
  { id: "ds11-luonggiac-cong",        name: "Công thức lượng giác - Công thức cộng",         topic: "Đại số",             grade: 11 },
  { id: "gt11-gioihan-luonggiac",     name: "Giới hạn lượng giác cơ bản",                    topic: "Giải tích",          grade: 11 },
  { id: "gt11-daoham-sin",            name: "Đạo hàm của hàm số y = sin x",                  topic: "Giải tích",          grade: 11 },
  { id: "gt11-daoham-tichthuong",     name: "Đạo hàm của tích và thương (u·v, u/v)",         topic: "Giải tích",          grade: 11 },
  { id: "gt11-tieptuyen-phuongtrinh", name: "Phương trình tiếp tuyến của đồ thị",            topic: "Giải tích",          grade: 11 },
  // --- Lớp 10 ---
  { id: "ds10-phuongtrinh-bac2",      name: "Phương trình bậc hai & Biệt thức Delta",        topic: "Đại số",             grade: 10 },
  { id: "ds10-hethuc-viet",           name: "Hệ thức Viét",                                   topic: "Đại số",             grade: 10 },
  { id: "hh10-parabola",              name: "Hàm bậc hai — Đỉnh và trục đối xứng Parabol",   topic: "Đại số",             grade: 10 },
  { id: "hh10-cosin",                 name: "Định lý Côsin trong tam giác",                   topic: "Hình học",           grade: 10 },
  { id: "hh10-dinhly-sin",            name: "Định lý Sin trong tam giác",                     topic: "Hình học",           grade: 10 },
  { id: "hh10-herong",                name: "Công thức Hê-rông tính diện tích tam giác",      topic: "Hình học",           grade: 10 },
  { id: "hh10-dientich-sinC",         name: "Diện tích tam giác theo sin góc xen giữa",       topic: "Hình học",           grade: 10 },
  { id: "hh10-vecto-toado",           name: "Tọa độ vectơ và tích vô hướng trong mặt phẳng", topic: "Hình học",           grade: 10 },
  { id: "hh10-duongthang-tongquat",   name: "Phương trình tổng quát của đường thẳng",        topic: "Hình học",           grade: 10 },
  { id: "hh10-duongtron-phuongtrinh", name: "Phương trình đường tròn",                        topic: "Hình học",           grade: 10 },
  { id: "xs10-quitac-dem",            name: "Quy tắc cộng và quy tắc nhân (đếm)",            topic: "Xác suất & Tổ hợp", grade: 10 },
  // --- Lớp 11: Bổ sung ---
  { id: "ds11-luonggiac-nhandoi",     name: "Công thức nhân đôi (sin 2a, cos 2a)",            topic: "Đại số",             grade: 11 },
  { id: "ds11-luonggiac-habac",       name: "Công thức hạ bậc (sin², cos²) và tích-tổng",    topic: "Đại số",             grade: 11 },
  { id: "gt11-ptluonggiac-sincos",    name: "Phương trình lượng giác cơ bản (sin, cos)",      topic: "Giải tích",          grade: 11 },
  { id: "gt11-ptluonggiac-tancot",    name: "Phương trình lượng giác cơ bản (tan, cot)",      topic: "Giải tích",          grade: 11 },
  { id: "ds11-csc-sohangtq",          name: "Số hạng tổng quát Cấp số cộng: u_n = u₁+(n-1)d", topic: "Đại số",            grade: 11 },
  { id: "ds11-csn-sohangtq",          name: "Số hạng tổng quát Cấp số nhân: u_n = u₁·q^(n-1)", topic: "Đại số",           grade: 11 },
  // --- Lớp 12: Bổ sung ---
  { id: "gt12-mu-log-phuongtrinh",    name: "Phương trình mũ và logarit cơ bản",              topic: "Giải tích",          grade: 12 },
  { id: "gt12-logarit-doicooso",      name: "Công thức đổi cơ số logarit",                    topic: "Giải tích",          grade: 12 },
  { id: "ds12-sophuc-pheptoan",       name: "Phép toán số phức (nhân và chia)",               topic: "Đại số",             grade: 12 },
  { id: "ds12-sophuc-luonggiac",      name: "Dạng lượng giác của số phức & De Moivre",        topic: "Đại số",             grade: 12 },
  { id: "gt12-cuctrituoc",            name: "Điều kiện cực trị của hàm số (đạo hàm bậc 1&2)", topic: "Giải tích",         grade: 12 },
  // --- Bất đẳng thức & Đại số bổ sung ---
  { id: "ds-bdt-amgm",               name: "Bất đẳng thức AM-GM (Cauchy) — tổng ≥ 2√tích",    topic: "Đại số",             grade: 10 },
  { id: "ds-bdt-cauchy-schwarz",      name: "Bất đẳng thức Cauchy-Schwarz",                     topic: "Đại số",             grade: 11 },
  { id: "ds11-nhi-thuc-newton",       name: "Nhị thức Newton — khai triển (a+b)^n",             topic: "Xác suất & Tổ hợp", grade: 11 },
  { id: "gt12-gtln-gtnn",             name: "Giá trị lớn nhất / nhỏ nhất trên đoạn",            topic: "Giải tích",          grade: 12 },
  { id: "ds10-bpt-bac2",              name: "Bất phương trình bậc hai — dấu tam thức",          topic: "Đại số",             grade: 10 },
];

const SYSTEM_PROMPT = String.raw`Bạn là FormulaX AI - trợ lý toán học thông minh cho học sinh THPT Việt Nam.

NHIỆM VỤ CHÍNH:
1. Xác định công thức phù hợp nhất trong thư viện
2. Nếu có số liệu cụ thể → TÍNH LUÔN ra đáp số, trình bày từng bước đánh số rõ ràng
3. Nếu không có số liệu → giải thích khi nào dùng công thức và cách áp dụng
4. Thân thiện như người anh/chị hướng dẫn em

ĐỊNH DẠNG CÔNG THỨC TOÁN (BẮT BUỘC):
- Dùng $...$ cho công thức inline: $x^2 + 5x + 6 = 0$, $\Delta = b^2 - 4ac$, $\frac{a}{b}$
- Dùng $$...$$ cho công thức hiển thị riêng dòng: $$V = \frac{4}{3}\pi R^3$$
- LUÔN dùng LaTeX — KHÔNG dùng ASCII thuần như x^2, sqrt(), pi

ĐỊNH DẠNG TRÌNH BÀY:
- Bài toán có tính toán: trình bày **Bước 1:**, **Bước 2:**... mỗi bước trên một dòng riêng
- Câu hỏi lý thuyết: giải thích ngắn gọn, có thể dùng - bullet list
- Dùng **in đậm** cho kết quả quan trọng và kết luận cuối

DANH SÁCH CÔNG THỨC TRONG THƯ VIỆN (chỉ dùng các ID này):
${FORMULA_LIST.map(f => `- ${f.id}: ${f.name} | Lớp ${f.grade} | ${f.topic}`).join('\n')}

ĐỊNH DẠNG TRẢ LỜI (BẮT BUỘC — KHÔNG dùng JSON, KHÔNG dùng markdown code block):
REPLY_START
[câu trả lời tiếng Việt, nhiều dòng, có LaTeX $...$ và $$...$$]
REPLY_END
ID:[formulaId hoặc null]

QUY TẮC:
- Luôn bắt đầu bằng REPLY_START và kết thúc bằng REPLY_END trên dòng riêng
- Dòng cuối cùng là ID:tên-id hoặc ID:null
- Dùng LaTeX thật sự: $\frac{a}{b}$, $\sqrt{x}$, $\geq$, $\leq$, $\pi$, $\infty$, $\Leftrightarrow$
- CHỈ dùng ID trong danh sách trên

VÍ DỤ MẪU:

Hỏi: "tìm giá trị nhỏ nhất của A = x + 1/x với x > 0"
REPLY_START
Áp dụng **bất đẳng thức AM-GM**: với $a, b > 0$ thì $\frac{a+b}{2} \geq \sqrt{ab}$.
**Bước 1:** Đặt $a = x$, $b = \frac{1}{x}$, ta có:
$$\frac{x + \frac{1}{x}}{2} \geq \sqrt{x \cdot \frac{1}{x}} = 1$$
**Bước 2:** Suy ra $A = x + \frac{1}{x} \geq 2$.
**Bước 3:** Dấu bằng xảy ra khi $x = \frac{1}{x} \Leftrightarrow x = 1$.
**Kết quả:** $\min A = 2$ đạt tại $x = 1$.
REPLY_END
ID:null

Hỏi: "đạo hàm y = x³ - 2x² + 5x - 1"
REPLY_START
Áp dụng công thức $\left(x^n\right)' = nx^{n-1}$.
**Bước 1:** Tính đạo hàm từng hạng tử:
- $\left(x^3\right)' = 3x^2$
- $\left(2x^2\right)' = 4x$
- $\left(5x\right)' = 5$, $\left(1\right)' = 0$
**Bước 2:** Kết quả: $y' = 3x^2 - 4x + 5$.
REPLY_END
ID:gt12-daoham-basic

Hỏi: "thể tích khối cầu R = 5cm"
REPLY_START
Áp dụng công thức:
$$V = \frac{4}{3}\pi R^3$$
**Bước 1:** Thay $R = 5$ cm vào công thức.
**Bước 2:** $V = \frac{4}{3} \times \pi \times 5^3 = \frac{4}{3} \times 125\pi = \frac{500\pi}{3}$
**Kết quả:** $V \approx 523{,}6 \text{ cm}^3$
REPLY_END
ID:hh12-matcau-thetich

Hỏi: "hôm nay ăn gì?"
REPLY_START
Mình chỉ giỏi toán thôi bạn ơi! Bạn đang cần ôn công thức hay giải bài toán nào không?
REPLY_END
ID:null`;

// Parse định dạng REPLY_START...REPLY_END\nID:xxx
function parseReplyFormat(text) {
  if (!text) return null;

  const replyMatch = text.match(/REPLY_START\s*([\s\S]*?)\s*REPLY_END/);
  const idMatch = text.match(/^ID:\s*(.+)$/m);

  if (!replyMatch) return null;

  const reply = replyMatch[1].trim();
  const rawId = idMatch ? idMatch[1].trim() : 'null';
  const formulaId = rawId === 'null' ? null : rawId;

  return { reply, formulaId };
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY chưa được cấu hình trong file .env" });
    }

    // Chuyển lịch sử sang format OpenAI-compatible (Groq dùng chuẩn này)
    const chatHistory = history
      .filter(h => h.sender === "user" || h.sender === "bot")
      .map(h => ({
        role: h.sender === "user" ? "user" : "assistant",
        content: h.text || ""
      }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const rawText = completion.choices[0].message.content.trim();

    // Parse định dạng REPLY_START...REPLY_END\nID:xxx
    const parsed = parseReplyFormat(rawText) || { reply: rawText, formulaId: null };

    // Đảm bảo formulaId phải thuộc danh sách hợp lệ
    const validIds = FORMULA_LIST.map(f => f.id);
    if (parsed.formulaId && !validIds.includes(parsed.formulaId)) {
      parsed.formulaId = null;
    }

    res.json({
      reply: parsed.reply || rawText,
      formulaId: parsed.formulaId || null
    });

  } catch (error) {
    console.error("[FormulaX Backend] Groq API error:", error.message);
    res.status(500).json({
      error: "Không thể kết nối AI",
      message: error.message
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "llama-3.3-70b-versatile (Groq)",
    formulasLoaded: FORMULA_LIST.length
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FormulaX AI Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Đã tải ${FORMULA_LIST.length} công thức vào context AI`);
  console.log(`🔑 Groq API Key: ${process.env.GROQ_API_KEY ? "✅ Đã cấu hình" : "❌ Chưa cấu hình (.env)"}\n`);
});
