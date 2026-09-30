import "./loadEnv.js"; // phải đứng đầu tiên — nạp .env trước khi module khác đọc process.env
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Groq from "groq-sdk";
import payosPaymentRouter from "./routes/payosPayment.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifySupabaseUser, extractGoogleId } from "./lib/verifySupabaseUser.js";
import { FORMULA_COUNT } from "./lib/formulaCatalog.js";
import { askFinder, CHAT_BUDGET_MS } from "./lib/finderAnswer.js";
import { runWithQuota } from "./lib/quotaFlow.js";
import { FINDER_MODEL } from "./lib/finderPrompt.js";

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // set this on Render to your Vercel URL
].filter(Boolean);

// Render/Vercel đặt app sau reverse proxy — không bật trust proxy thì req.ip luôn là IP của
// proxy, mọi người dùng bị gộp chung một quota rate limit. Chỉ tin đúng 1 hop (proxy của
// hosting), không dùng `true` vì như vậy client có thể tự giả mạo X-Forwarded-For để né limit.
app.set("trust proxy", 1);

// Trang dev-tool test thủ công PayOS (public/simulate-payment.html) — chỉ phục vụ ở môi
// trường dev. Mount TRƯỚC helmet để CSP mặc định không chặn inline script của trang test.
if (!IS_PRODUCTION) {
  app.use(express.static("public"));
}

// Câu trả lời của AI thường 2–6 KB text/LaTeX, nén gzip còn khoảng 1/3 — đáng kể với người
// dùng mạng 3G/4G ở quê, và Render không tự nén giúp.
app.use(compression());

app.use(helmet({
  // Backend là API thuần, được gọi cross-origin từ frontend Vercel — CORP mặc định
  // (same-origin) không phù hợp ở đây.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], maxAge: 86400 }));
// Giới hạn kích thước body: request hợp lệ lớn nhất (message + 10 lượt history) chỉ vài KB,
// mặc định 100kb của express là quá rộng cho endpoint gọi AI tính tiền theo token.
app.use(express.json({ limit: "64kb" }));

// ─── Rate limit ────────────────────────────────────────────────────────────
// Giới hạn 10 lượt hỏi/ngày của gói Free chỉ được kiểm tra ở client (localStorage) nên bỏ qua
// được dễ dàng bằng cách gọi thẳng API. Các limiter dưới đây là chốt chặn phía server để một
// IP không thể vét cạn quota Groq/PayOS — đặt rộng hơn hạn mức nghiệp vụ để không chặn nhầm
// người dùng thật (nhiều học sinh cùng NAT ra một IP ở trường/quán net).
const chatBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn hỏi hơi nhanh, chờ khoảng một phút rồi thử lại nhé." },
});

const chatDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Đã đạt giới hạn số câu hỏi trong ngày. Vui lòng quay lại vào ngày mai." },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn đã tạo quá nhiều đơn thanh toán. Vui lòng thử lại sau một giờ." },
});

// Chỉ giới hạn /create — KHÔNG áp cho /webhook, vì webhook do PayOS gọi server-to-server và
// bị chặn ở đây đồng nghĩa người dùng đã trả tiền nhưng không được cấp Premium.
app.use("/api/payment/payos/create", paymentLimiter);
app.use("/api/payment/payos", payosPaymentRouter);

// maxRetries 0: mặc định SDK tự thử lại 2 lần khi gặp 429, giữ request hàng chục giây. Gặp 429
// thì báo "AI đang bận" và hoàn lượt ngay. Timeout từng lần gọi do askFinder tự đặt theo ngân
// sách thời gian của request (CHAT_BUDGET_MS = 40 giây, xem lib/finderAnswer.js) — ngân sách đó
// PHẢI nhỏ hơn timeout 45 giây của frontend (FormulaFinder.jsx), nếu không học sinh có thể mất
// lượt mà không thấy câu trả lời.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0 });

// Trần độ dài input — chặn việc nhồi prompt khổng lồ để đốt token của Groq. Câu hỏi toán THPT
// thực tế hiếm khi vượt 2000 ký tự; mỗi lượt history cũng cắt bớt thay vì gửi nguyên văn.
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEM_CHARS = 1500;

// Google Free: 10 lượt/ngày (xem CLAUDE.md). Premium: không giới hạn. Khách ẩn danh: 0 — AI
// Finder bắt buộc đăng nhập Google, xem verifySupabaseUser + kiểm tra is_anonymous bên dưới.
const FREE_AI_DAILY_LIMIT = 10;

// Ghi log để theo dõi chất lượng AI Finder: câu hỏi bị báo "thư viện chưa có" và các lần bộ
// lọc phải can thiệp. CHỈ ghi nội dung câu hỏi (tối đa 150 ký tự), type và id công thức —
// không ghi google_id, email, tên hay token. Riêng no_formula ghi thêm aiNote: lời giải thích
// của model (≤ 150 ký tự) về công thức/phương pháp còn thiếu — học sinh KHÔNG thấy câu này.
function logFinderEvents(message, answer, meta) {
  const base = { q: String(message).slice(0, 150), type: answer.type, ids: answer.formulaIds };
  if (answer.type === "no_formula") console.log("[finder:no_formula]", JSON.stringify({ ...base, aiNote: meta.aiNote || "" }));
  if (meta.jsonFailed) console.warn("[finder:json_failed]", JSON.stringify({ ...base, attempts: meta.attempts }));
  // Câu trả lời do model dự phòng (20b) soạn vì model chính hết hạn mức ngày — đếm số dòng này
  // trong Render Logs để biết mỗi ngày bao nhiêu câu phải dùng dự phòng.
  if (meta.fallback) console.warn("[finder:fallback]", JSON.stringify({ ...base, from: meta.fallback.from, to: meta.fallback.to, reason: meta.fallback.reason }));
  const filtered = meta.removedSteps?.length || meta.replaced?.length || meta.droppedIds?.length || meta.droppedExpressions;
  if (filtered) {
    console.warn("[finder:guard]", JSON.stringify({
      ...base,
      removedSteps: meta.removedSteps.length,
      leaked: [...new Set(meta.removedSteps.flatMap((st) => st.leaked))],
      replaced: meta.replaced,
      droppedIds: meta.droppedIds,
      droppedExpressions: meta.droppedExpressions,
    }));
  }
}

function computeIsPremium(userRow) {
  if (!userRow?.is_premium) return false;
  // NULL = Premium không thời hạn, chỉ xảy ra khi cấp tay trong DB (ví dụ tài khoản demo) —
  // webhook PayOS luôn set premium_expiry cụ thể mỗi lần cấp thật. Khớp với checkPremiumStatus()
  // ở FormulaX-AI/src/lib/supabase.js để backend/frontend không lệch cách tính Premium.
  if (!userRow.premium_expiry) return true;
  return new Date(userRow.premium_expiry) > new Date();
}

app.post("/api/chat", chatBurstLimiter, chatDailyLimiter, async (req, res) => {
  // Tính từ lúc request tới, gồm cả thời gian xác thực và đọc DB phía dưới.
  const requestDeadline = Date.now() + CHAT_BUDGET_MS;
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({
        error: `Câu hỏi quá dài (tối đa ${MAX_MESSAGE_CHARS} ký tự). Bạn rút gọn lại giúp mình nhé.`,
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY chưa được cấu hình trong file .env" });
    }

    // Xác thực người gọi bằng Supabase JWT — bắt buộc để biết chắc đây là tài khoản Google nào
    // (hoặc chặn nếu là khách ẩn danh) TRƯỚC KHI tốn phí gọi Groq. Giới hạn 10 lượt/ngày trước
    // đây chỉ kiểm tra ở localStorage phía client nên gọi thẳng API là bỏ qua được — đây là
    // chốt chặn thật sự phía server.
    let authUser;
    try {
      authUser = await verifySupabaseUser(req);
    } catch (err) {
      return res.status(err.status || 401).json({ error: err.message });
    }

    // AI Finder bắt buộc đăng nhập Google — khách ẩn danh có phiên hợp lệ (qua được bước xác
    // thực ở trên) nhưng không được cấp bất kỳ lượt hỏi nào.
    if (authUser.is_anonymous) {
      return res.status(403).json({ error: "Đăng nhập Google để dùng AI" });
    }

    const googleId = extractGoogleId(authUser);
    if (!googleId) {
      return res.status(403).json({ error: "Tài khoản chưa liên kết Google." });
    }

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select("is_premium, premium_expiry")
      .eq("google_id", googleId)
      .maybeSingle();
    if (userRowError) {
      // Fail closed: không đọc được trạng thái Premium thì từ chối luôn, không đoán/không cho
      // qua như Free. 503 vì đây là Supabase (phụ thuộc ngoài) đang lỗi, không phải bug ở đây.
      console.error("[FormulaX Backend] Đọc trạng thái Premium lỗi:", userRowError.message);
      return res.status(503).json({ error: "Không xác thực được trạng thái tài khoản, thử lại sau." });
    }
    const isPremium = computeIsPremium(userRow);

    // Chuyển lịch sử sang format OpenAI-compatible
    const chatHistory = (Array.isArray(history) ? history : [])
      .filter(h => h && (h.sender === "user" || h.sender === "bot"))
      .slice(-MAX_HISTORY_ITEMS)
      .map(h => ({
        role: h.sender === "user" ? "user" : "assistant",
        content: String(h.text || "").slice(0, MAX_HISTORY_ITEM_CHARS)
      }));

    // Chọn công thức ứng viên → gọi model → parse JSON → kiểm tra id, ngoặc, số lạ. Xem
    // lib/finderAnswer.js; câu trả lời trả về đây đã qua bộ lọc, không cần tin model.
    // delivered = false khi JSON hỏng cả 2 lần và phải trả câu mẫu — không tính là đã trả lời.
    const ask = async () => {
      const out = await askFinder({ groq, message, history: chatHistory, deadline: requestDeadline });
      logFinderEvents(message, out.answer, out.meta);
      return { ...out, delivered: !out.meta.jsonFailed };
    };

    // Premium: không đếm lượt. Free: xem lib/quotaFlow.js — tăng lượt TRƯỚC khi gọi Groq (RPC
    // nguyên tử, không có khoảng hở race condition), rồi HOÀN lượt (refund_ai_usage, migration
    // 007) trong mọi trường hợp không giao được câu trả lời: vượt hạn mức, Groq 429, Groq lỗi
    // khác/timeout, JSON hỏng. Bộ đếm luôn bằng đúng số câu trả lời đã giao.
    let outcome;
    if (isPremium) {
      outcome = { result: await ask(), remaining: null };
    } else {
      outcome = await runWithQuota({
        limit: FREE_AI_DAILY_LIMIT,
        reserve: async () => {
          const { data, error } = await supabaseAdmin.rpc("increment_ai_usage", { p_google_id: googleId });
          // Fail closed: không kiểm tra được quota thì từ chối (503 ở khối catch), KHÔNG gọi AI.
          if (error) throw Object.assign(new Error(error.message), { quotaUnavailable: true });
          return data;
        },
        refund: async () => {
          const { data, error } = await supabaseAdmin.rpc("refund_ai_usage", { p_google_id: googleId });
          if (error) throw new Error(error.message);
          return data;
        },
        run: ask,
        onRefundError: (err) => console.error("[FormulaX Backend] refund_ai_usage lỗi:", err.message),
      });
      if (outcome.limited) {
        return res.status(429).json({
          error: `Bạn đã dùng hết ${FREE_AI_DAILY_LIMIT} lượt hỏi AI miễn phí hôm nay. Nâng cấp Premium để hỏi không giới hạn!`,
          code: "quota_exceeded",
          remaining: 0,
        });
      }
    }

    const { answer, reply } = outcome.result;
    const remaining = outcome.remaining;
    res.json({
      type: answer.type,
      formulaIds: answer.formulaIds,
      intro: answer.intro,
      steps: answer.steps,
      reminder: answer.reminder,
      // reply + formulaId giữ cho bản PWA cũ còn cache ở máy học sinh (chỉ đọc 2 trường này) và
      // làm lịch sử hội thoại gửi lại model ở câu sau.
      reply,
      formulaId: answer.formulaIds[0] ?? null,
      remaining, // null = Premium (không giới hạn), số = lượt Free còn lại sau câu hỏi này
    });

  } catch (error) {
    if (error.quotaUnavailable) {
      console.error("[FormulaX Backend] increment_ai_usage lỗi:", error.message);
      return res.status(503).json({ error: "Không kiểm tra được hạn mức AI, thử lại sau." });
    }
    console.error("[FormulaX Backend] Groq error:", error.message);
    // Lượt đã được hoàn trong runWithQuota; gửi kèm số lượt còn lại để frontend cập nhật bộ đếm.
    const remainingInfo = typeof error.remaining === "number" ? { remaining: error.remaining } : {};
    const status = error.status || error.statusCode || 500;
    // Groq 429 = gói miễn phí hết token/phút cho cả app, không phải lỗi của học sinh. code
    // "ai_busy" để frontend phân biệt với 429 hết lượt (code "quota_exceeded").
    if (status === 429) {
      return res.status(429).json({ error: "AI đang bận, bạn thử lại sau ít phút nhé", code: "ai_busy", ...remainingInfo });
    }
    let errorMsg = "Không thể kết nối AI";
    if (status === 401) errorMsg = "Lỗi cấu hình phía máy chủ, vui lòng thử lại sau";
    // Chỉ trả thông điệp chung cho client — error.message của SDK có thể chứa chi tiết nội bộ
    // (endpoint, tên model, một phần API key trong thông báo xác thực). Chi tiết đã có ở log server.
    res.status(status >= 400 && status < 600 ? status : 500).json({ error: errorMsg, ...remainingInfo });
  }
});

// GET /api/chat/usage — cho frontend biết còn bao nhiêu lượt AI hôm nay MÀ KHÔNG tốn 1 lượt.
// Dùng khi người dùng vừa mở Formula Finder, chưa hỏi gì — tránh chỉ đoán qua cache cũ ở client.
app.get("/api/chat/usage", chatBurstLimiter, async (req, res) => {
  try {
    let authUser;
    try {
      authUser = await verifySupabaseUser(req);
    } catch (err) {
      return res.status(err.status || 401).json({ error: err.message });
    }

    if (authUser.is_anonymous) {
      return res.status(403).json({ error: "Đăng nhập Google để dùng AI" });
    }

    const googleId = extractGoogleId(authUser);
    if (!googleId) {
      return res.status(403).json({ error: "Tài khoản chưa liên kết Google." });
    }

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select("is_premium, premium_expiry")
      .eq("google_id", googleId)
      .maybeSingle();
    if (userRowError) {
      console.error("[FormulaX Backend] Đọc trạng thái Premium lỗi:", userRowError.message);
      return res.status(503).json({ error: "Không xác thực được trạng thái tài khoản, thử lại sau." });
    }
    const isPremium = computeIsPremium(userRow);

    if (isPremium) {
      return res.json({ isPremium: true, remaining: null, limit: null });
    }

    // Chỉ đọc, KHÔNG tăng đếm — increment_ai_usage chỉ được gọi từ /api/chat khi thực sự hỏi.
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc("get_ai_usage", {
      p_google_id: googleId,
    });
    if (usageError) {
      console.error("[FormulaX Backend] get_ai_usage lỗi:", usageError.message);
      return res.status(503).json({ error: "Không đọc được hạn mức AI, thử lại sau." });
    }

    res.json({
      isPremium: false,
      remaining: Math.max(0, FREE_AI_DAILY_LIMIT - usageCount),
      limit: FREE_AI_DAILY_LIMIT,
    });
  } catch (err) {
    console.error("[FormulaX Backend] /api/chat/usage error:", err.message);
    res.status(500).json({ error: "Không đọc được hạn mức AI." });
  }
});

// Health check endpoint
// commit: bản code đang chạy — Render tự đặt RENDER_GIT_COMMIT khi deploy. Dùng để xác nhận sau
// khi push rằng Render đã chạy bản mới (các trường còn lại thường không đổi giữa hai bản).
const DEPLOYED_COMMIT = (process.env.RENDER_GIT_COMMIT || "").slice(0, 7) || "local";

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: `${FINDER_MODEL} (Groq)`,
    formulasLoaded: FORMULA_COUNT,
    commit: DEPLOYED_COMMIT
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FormulaX AI Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 Đã tải ${FORMULA_COUNT} công thức từ FormulaX-AI/src/data/formulas.js`);
  console.log(`🔑 Groq API Key: ${process.env.GROQ_API_KEY ? "✅ Đã cấu hình" : "❌ Chưa cấu hình (.env)"}`);
  const payosOk = process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY;
  console.log(`💳 PayOS Payment: ${payosOk ? "✅ Đã cấu hình" : "❌ Chưa cấu hình (.env)"}`);
  const supabaseOk = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("CHUA_CAU_HINH");
  console.log(`🗄️  Supabase (service role): ${supabaseOk ? "✅ Đã cấu hình" : "❌ Chưa cấu hình — webhook sẽ không cập nhật được is_premium, /api/chat sẽ từ chối mọi request (.env)"}`);
  console.log(`🛡️  Môi trường: ${IS_PRODUCTION ? "production — route DEV & trang test đã khoá" : "development — route DEV mở, KHÔNG dùng cấu hình này khi deploy"}\n`);
});
