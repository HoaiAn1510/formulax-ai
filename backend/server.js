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

const SYSTEM_PROMPT = String.raw`Bạn là FormulaX AI — trợ lý toán THPT Việt Nam. Trả lời tiếng Việt, thân thiện.

NHIỆM VỤ: Xác định công thức → chỉ ra dấu hiệu nhận biết → giải từng bước (nếu có số) hoặc giải thích cách dùng (nếu không có số).

TOÁN: Dùng $...$ (inline) và $$...$$ (block). Không dùng ASCII.

KHI CÓ CÔNG THỨC, trả lời theo cấu trúc:
**Dấu hiệu nhận biết:** Dùng khi...
- [từ khóa / điều kiện đề cho]
- [yêu cầu tìm gì]
**Bước 1:** ... **Bước 2:** ... **Kết quả:** ...

CÔNG THỨC THƯ VIỆN — chỉ dùng các ID này:
${FORMULA_LIST.map(f => `${f.id}: ${f.name}`).join('\n')}

ĐỊNH DẠNG TRẢ LỜI (bắt buộc):
REPLY_START
[nội dung]
REPLY_END
ID:[id hoặc null]

VÍ DỤ:
REPLY_START
**Dấu hiệu nhận biết:** Dùng khi...
- Đề cho bán kính $R$ của khối cầu/hình cầu
- Yêu cầu tính thể tích

Áp dụng: $$V = \frac{4}{3}\pi R^3$$
**Bước 1:** Thay $R=5$: $V=\frac{4}{3}\pi\cdot125=\frac{500\pi}{3}$
**Kết quả:** $V\approx523{,}6\text{ cm}^3$
REPLY_END
ID:hh12-matcau-thetich`;

// Parse định dạng REPLY_START...REPLY_END\nID:xxx
function parseReplyFormat(text) {
  if (!text) return null;

  const idMatch = text.match(/^ID:\s*(.+)$/m);
  const rawId = idMatch ? idMatch[1].trim() : 'null';
  const formulaId = rawId === 'null' ? null : rawId;

  // Case 1: đúng format REPLY_START...REPLY_END
  const fullMatch = text.match(/REPLY_START\s*([\s\S]*?)\s*REPLY_END/);
  if (fullMatch) {
    return { reply: fullMatch[1].trim(), formulaId };
  }

  // Case 2: AI bỏ REPLY_START nhưng có REPLY_END
  const endOnlyMatch = text.match(/^([\s\S]*?)\s*REPLY_END/);
  if (endOnlyMatch) {
    return { reply: endOnlyMatch[1].trim(), formulaId };
  }

  // Case 3: AI bỏ hết markers — clean toàn bộ markers rồi dùng text còn lại
  const cleaned = text
    .replace(/REPLY_START\n?/g, '')
    .replace(/\n?REPLY_END[\s\S]*/g, '')
    .replace(/^ID:.*$/m, '')
    .trim();

  return cleaned ? { reply: cleaned, formulaId } : null;
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
      .slice(-10)
      .map(h => ({
        role: h.sender === "user" ? "user" : "assistant",
        content: h.text || ""
      }));

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1800,
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
    const status = error.status || error.statusCode || 500;
    let errorMsg = "Không thể kết nối AI";
    if (status === 429) errorMsg = "Groq API đã đạt giới hạn request, thử lại sau vài giây";
    else if (status === 401) errorMsg = "Groq API key không hợp lệ";
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: errorMsg,
      message: error.message
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "openai/gpt-oss-20b (Groq)",
    formulasLoaded: FORMULA_LIST.length
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FormulaX AI Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Đã tải ${FORMULA_LIST.length} công thức vào context AI`);
  console.log(`🔑 Groq API Key: ${process.env.GROQ_API_KEY ? "✅ Đã cấu hình" : "❌ Chưa cấu hình (.env)"}\n`);
});
