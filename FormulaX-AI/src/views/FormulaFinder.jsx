import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, History, Camera, X, FileText, AlertCircle, Plus, Trash2, Pencil, Check, Crown, RotateCcw, Lock, ClipboardList, ChevronRight, Image as ImageIcon } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { useAuth } from "../context/AuthContext";
import { FINDER_IMAGE_INPUT_ENABLED } from "../config/features";
import { loadChatSessions, upsertChatSession, deleteChatSession as deleteChatSessionDB, fetchWithAuth } from "../lib/supabase";
import { useGuestGate } from "../utils/useGuestGate";
import StepAnswer from "../components/StepAnswer";
import PageShell from "../components/PageShell";
import MimiMascot from "../components/MimiMascot";
import ImageScanSheet from "../components/ImageScanSheet";
import ImageProblemsPanel from "../components/ImageProblemsPanel";
import ProblemTabs from "../components/ProblemTabs";
import { compressImageFile } from "../utils/imageCompress";
import { problemToFinderMessage, nextGuidanceRequest, busyWaitSeconds } from "../utils/ocrProblems";
import { retryFinderBusyOnce } from "../utils/finderBusyRetry";
import { isFollowUpQuestion } from "../utils/askedProblems";
import { latexToPlainText } from "../utils/mathLines";
import { showToast } from "../components/Toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const MATH_KEYWORDS = [
  "tính", "giải", "công thức", "phương trình", "đạo hàm",
  "tích phân", "logarit", "hình", "góc", "diện tích", "thể tích",
  "delta", "nghiệm", "bất phương trình", "sin", "cos", "tan",
  "lim", "log", "đồ thị", "hàm số", "toán", "cấp số",
  "xác suất", "tổ hợp", "chỉnh hợp", "nhị thức", "vectơ",
  "tọa độ", "đường thẳng", "đường tròn", "mặt phẳng",
  "nguyên hàm", "giới hạn", "căn", "lũy thừa", "cực trị",
  "bài toán", "chứng minh", "định lý", "số phức", "parabol",
  "tiếp tuyến", "bán kính", "chu vi", "tổng", "hiệu", "tích", "thương",
  "đáp án", "kết quả", "bước"
];

const isMathRelated = (msg) => {
  if (/\d/.test(msg)) return true;
  if (/[+\-*/^=√∑∫∆]/.test(msg)) return true;
  const lower = msg.toLowerCase();
  return MATH_KEYWORDS.some(k => lower.includes(k));
};

function loadSessionsFromStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveSessionsToStorage(key, sessions) {
  localStorage.setItem(key, JSON.stringify(sessions));
}

// Chỉ để hiển thị "Còn x/10". Hạn mức thật do backend đếm (bảng ai_usage_daily) — trước đây
// đếm ở localStorage nên gọi thẳng API là bỏ qua được.
const FREE_AI_LIMIT = 10;

// Ví dụ hỏi đáp cho khách — cố định, KHÔNG gọi API, trình bày đúng cấu trúc câu trả lời thật
// (công thức → các bước → lời nhắc, không có kết quả). Câu hỏi là dòng đầu field `example` của
// công thức trong formulas.js; thẻ công thức lấy tên + LaTeX từ formulas.js theo id. Các bước
// là văn bản đã được duyệt nguyên văn — chỉ thay số vào công thức có sẵn, không tính ra đáp số.
// KHÔNG hiển thị phần lời giải/đáp số trong `example`. Id không còn tồn tại thì ví dụ tự bị bỏ.
const GUEST_EXAMPLES = [
  {
    formulaId: "hh12-matcau-thetich",
    answer: {
      type: "solution",
      formulaIds: ["hh12-matcau-thetich"],
      intro: "Bài này dùng công thức thể tích khối cầu nhé.",
      steps: [
        { title: "Xác định dữ kiện", detail: "Đề cho bán kính khối cầu $R = 3$ cm.", expression: "" },
        { title: "Thay số vào công thức", detail: "Áp dụng công thức thể tích khối cầu, thay $R = 3$:", expression: String.raw`V = \frac{4}{3}\pi \cdot 3^3` },
        { title: "Tính theo thứ tự", detail: String.raw`Tính lũy thừa trước, rồi nhân với $\frac{4}{3}$. Giữ $\pi$ trong kết quả nếu đề không yêu cầu làm tròn; đơn vị là $\text{cm}^3$.`, expression: "" },
      ],
      reminder: "Phần tính còn lại bạn tự làm nhé, xong nhớ ghi đơn vị!",
    },
  },
  {
    formulaId: "ds10-phuongtrinh-bac2",
    answer: {
      type: "solution",
      formulaIds: ["ds10-phuongtrinh-bac2"],
      intro: "Bài này dùng biệt thức Delta của phương trình bậc hai.",
      steps: [
        { title: "Xác định hệ số", detail: "Phương trình có dạng $ax^2 + bx + c = 0$ với $a = 1$, $b = -5$, $c = 6$.", expression: "" },
        { title: "Tính biệt thức Delta", detail: String.raw`Thay các hệ số vào công thức $\Delta = b^2 - 4ac$:`, expression: String.raw`\Delta = (-5)^2 - 4 \cdot 1 \cdot 6` },
        { title: "Xét dấu Delta và tìm nghiệm", detail: String.raw`Nếu $\Delta > 0$, phương trình có 2 nghiệm phân biệt; thay $a$, $b$ và giá trị $\Delta$ vừa tính vào công thức nghiệm:`, expression: String.raw`x_{1,2} = \frac{-(-5) \pm \sqrt{\Delta}}{2 \cdot 1}` },
      ],
      reminder: String.raw`Bạn tự tính $\Delta$ rồi suy ra hai nghiệm nhé!`,
    },
  },
];

export default function FormulaFinder({
  formulas,
  bookmarkedIds,
  onToggleBookmark,
  onCreateFlashcard,
  onViewDetail,
  setActiveTab,
  searchHistory = [],
  onAddSearchHistory,
  isPremium = false,
  // Lớp học sinh chọn ở onboarding (10/11/12, có thể chưa có) — backend dùng để xếp hạng công thức.
  grade = null,
  // Mở Kiểm tra ở chế độ "Luyện lại bài đã hỏi" (App.jsx).
  onPracticeAsked,
}) {
  const { user } = useAuth();
  const { loginNow: handleGuestLogin } = useGuestGate();
  // AI Finder bắt buộc đăng nhập Google: khách thấy trang + ví dụ mẫu, ô nhập bị khóa. Backend
  // cũng tự từ chối phiên ẩn danh (403), nên đây chỉ là lớp giao diện.
  const isGuest = Boolean(user?.isAnonymous);
  const sessionsKey = `formulax_chat_sessions_${user?.googleId || "guest"}`;

  // null = chưa biết (đang tải). Số lượt thật lấy từ backend. Khách và Premium không dùng giá
  // trị này (thanh đếm bị ẩn, handleSend không kiểm tra) nên không cần tải.
  const [aiQueriesLeft, setAiQueriesLeft] = useState(null);
  // Nhắc trước khi hết lượt: chỉ khi số lượt GIẢM xuống đúng 3 hoặc 1 (vừa hỏi xong), không nhắc lúc mới mở trang.
  const prevQueriesLeftRef = useRef(null);
  useEffect(() => {
    const prev = prevQueriesLeftRef.current;
    prevQueriesLeftRef.current = aiQueriesLeft;
    if (isPremium || prev === null || aiQueriesLeft === null || aiQueriesLeft >= prev) return;
    if (aiQueriesLeft !== 3 && aiQueriesLeft !== 1) return;
    showToast(`Bạn còn ${aiQueriesLeft} lượt hỏi AI miễn phí hôm nay. Lượt mới có vào 0 giờ.`, "info", {
      action: { label: "Hỏi không giới hạn với Premium →", onClick: () => setActiveTab("premium") },
    });
  }, [aiQueriesLeft, isPremium, setActiveTab]);

  useEffect(() => {
    if (isGuest || !user?.googleId || isPremium) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/api/chat/usage`);
        if (!res.ok) return;
        const data = await res.json();
        if (alive && typeof data.remaining === "number") setAiQueriesLeft(data.remaining);
      } catch (err) {
        // Không chặn người dùng chỉ vì không đọc được số lượt — backend vẫn tự kiểm tra khi gửi.
        console.error("[AI Finder] Không tải được số lượt AI:", err);
      }
    })();
    return () => { alive = false; };
  }, [isGuest, user?.googleId, isPremium]);


  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const textareaRef = useRef(null);
  const handleSendRef = useRef(null);
  const shiftHeldRef = useRef(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Luồng ảnh đề: null | { stage: "scanning" } | { stage: "error", message }
  //   | { stage: "review", problems, selected } | { stage: "guide", items, activeKey, results }
  const [scanSheetOpen, setScanSheetOpen] = useState(false);
  const [ocr, setOcr] = useState(null);
  const [inFlightKey, setInFlightKey] = useState(null);
  const inFlightRef = useRef(null); // chặn gọi trùng khi StrictMode chạy effect 2 lần
  // Sau lỗi "AI đang bận": mốc hết chờ (ms), và các bài đã được tự hỏi lại một lần.
  const [busyUntil, setBusyUntil] = useState(0);
  const [busySince, setBusySince] = useState(0);
  const autoRetriedRef = useRef(new Set());
  const [typedBusyUntil, setTypedBusyUntil] = useState(0);
  const [typedBusyNow, setTypedBusyNow] = useState(0);
  const typedRetryRef = useRef(null);
  const typedRequestIdRef = useRef(0);
  const [apiError, setApiError] = useState(null);

  const cancelTypedRetry = () => {
    const pending = typedRetryRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    typedRetryRef.current = null;
    pending.resolve(false);
    setTypedBusyUntil(0);
  };

  useEffect(() => {
    if (!typedBusyUntil) return;
    const timer = setInterval(() => setTypedBusyNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [typedBusyUntil]);

  useEffect(() => () => {
    typedRequestIdRef.current++;
    const pending = typedRetryRef.current;
    if (pending) {
      clearTimeout(pending.timer);
      typedRetryRef.current = null;
      pending.resolve(false);
    }
  }, []);

  // Session management
  const [sessions, setSessions] = useState(() => loadSessionsFromStorage(sessionsKey));
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const sessionIdRef = useRef(null);
  const sessionsRef = useRef(sessions);

  // Saved formula popup

  const chatMessagesRef = useRef(null);
  const renameInputRef = useRef(null);

  // Giữ sessionsRef luôn sync với state mới nhất
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Reload sessions khi user đổi (đăng nhập/đăng xuất) — ưu tiên Supabase
  useEffect(() => {
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setMessages([]);
    if (user?.googleId) {
      loadChatSessions(user.googleId).then(cloudSessions => {
        if (cloudSessions === null) {
          // Lỗi kết nối → giữ local
          setSessions(loadSessionsFromStorage(sessionsKey));
        } else {
          // Cloud là nguồn sự thật, kể cả khi rỗng. Trước đây cloud rỗng thì đẩy bản lưu ở máy
          // lên lại — xoá hết cuộc trò chuyện trên laptop rồi mở điện thoại là chúng sống lại.
          setSessions(cloudSessions);
          saveSessionsToStorage(sessionsKey, cloudSessions);
        }
      });
    } else {
      setSessions(loadSessionsFromStorage(sessionsKey));
    }
  }, [user?.googleId]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing]);

  // Luôn giữ ref trỏ tới handleSend mới nhất (tránh stale closure)
  useEffect(() => { handleSendRef.current = handleSend; });

  // Native listener: track Shift thủ công, tránh React synthetic event lag
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onDown = (e) => {
      if (e.key === 'Shift') { shiftHeldRef.current = true; return; }
      if (e.key === 'Enter' && !shiftHeldRef.current && !e.shiftKey) {
        e.preventDefault();
        handleSendRef.current(el.value);
      }
    };
    const onUp = (e) => { if (e.key === 'Shift') shiftHeldRef.current = false; };
    el.addEventListener('keydown', onDown);
    el.addEventListener('keyup', onUp);
    return () => { el.removeEventListener('keydown', onDown); el.removeEventListener('keyup', onUp); };
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Auto-save session mỗi khi messages thay đổi
  useEffect(() => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find(m => m.sender === "user");
    if (!firstUserMsg) return;

    const sesId = sessionIdRef.current;

    if (sesId) {
      const updatedAt = new Date().toISOString();
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === sesId ? { ...s, messages, updatedAt } : s
        );
        saveSessionsToStorage(sessionsKey, updated);
        return updated;
      });
      if (user?.googleId) {
        const existing = sessionsRef.current.find(s => s.id === sesId);
        upsertChatSession(user.googleId, { id: sesId, name: existing?.name || "", messages, updatedAt }).catch(console.error);
      }
    } else {
      const newId = Date.now().toString();
      sessionIdRef.current = newId;
      setCurrentSessionId(newId);
      // Tên tự đặt = đề đầu tiên, đổi LaTeX thành chữ thường trước khi cắt 45 ký tự (cắt chuỗi LaTeX thì ra "$y ...").
      const plainFirst = latexToPlainText(firstUserMsg.text);
      const autoName = plainFirst.length > 45 ? plainFirst.slice(0, 45) + "..." : plainFirst;
      const newSession = {
        id: newId,
        name: autoName,
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions(prev => {
        const updated = [newSession, ...prev];
        saveSessionsToStorage(sessionsKey, updated);
        return updated;
      });
      if (user?.googleId) upsertChatSession(user.googleId, newSession).catch(console.error);
    }
  }, [messages, sessionsKey]);

  // source: "image" cho bài lấy từ ảnh đề — backend chỉ dùng để ghi log [finder:no_formula].
  const callAI = async (userMessage, messageHistory, source = "typed") => {
    // Timeout chủ động — không có dòng này, backend treo/mạng rớt sẽ khiến fetch không bao
    // giờ resolve/reject, isAnalyzing kẹt true mãi mãi và nút gửi tin nhắn "chết" vĩnh viễn
    // cho tới khi tải lại trang.
    // 45 giây PHẢI lớn hơn ngân sách 40 giây/request của backend (CHAT_BUDGET_MS trong
    // backend/lib/finderAnswer.js). Nếu frontend bỏ cuộc trước, backend vẫn giao câu trả lời và
    // không hoàn lượt — học sinh mất lượt mà không thấy gì.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    // Backend bắt buộc token để biết ai đang hỏi (đếm hạn mức, kiểm tra Premium, chặn khách).
    let response;
    try {
      // fetchWithAuth: phiên bị huỷ phía server (401) → làm mới phiên rồi gửi lại một lần.
      response = await fetchWithAuth(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messageHistory, source, grade }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Hết thời gian chờ phản hồi từ AI. Vui lòng thử lại.");
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const err = new Error(errData.error || `HTTP ${response.status}`);
      err.status = response.status;
      // code: "quota_exceeded" (hết lượt) | "ai_busy" (Groq quá tải) — cùng là HTTP 429.
      // remaining: số lượt còn lại SAU khi backend đã hoàn lượt cho request không thành công.
      err.code = errData.code;
      err.remaining = errData.remaining;
      err.retryAfter = errData.retryAfter; // giây chờ khi "ai_busy" (Groq 429)
      throw err;
    }
    const data = await response.json();
    return data;
  };

  const pushLimitHitMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text, isLimitHit: true }]);
  };

  // baseMessages: danh sách tin làm nền (nút "Hỏi lại" sau "AI đang bận" bỏ cặp câu hỏi + thông báo cũ trước khi gửi lại).
  const handleSend = async (textToSend, baseMessages = messages) => {
    if (!textToSend.trim() || isAnalyzing) return;
    // Ô nhập đã khóa với khách; chốt thêm ở đây cho các đường gọi khác (camera, tệp đính kèm).
    if (isGuest) return;

    // Chặn sớm khi đã biết chắc hết lượt, đỡ một vòng gọi mạng. Nếu số này cũ (vd. hỏi ở tab
    // khác), backend vẫn trả 429 và được xử lý ở khối catch bên dưới.
    if (!isPremium && aiQueriesLeft === 0) {
      pushLimitHitMessage(`Bạn đã dùng hết ${FREE_AI_LIMIT} lượt hỏi AI miễn phí hôm nay. Nâng cấp Premium để hỏi không giới hạn!`);
      return;
    }

    setApiError(null);
    const userMsg = { id: Date.now(), sender: "user", text: textToSend };
    const updatedMessages = [...baseMessages, userMsg];
    setMessages(updatedMessages);
    setQuery("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    if (onAddSearchHistory) onAddSearchHistory(textToSend);

    // Bộ lọc từ khóa chỉ áp cho tin đầu của phiên, để câu lạc đề không tốn lượt. Khi phiên đã có
    // câu trả lời thật của AI (answer, hoặc aiResult ở tin định dạng cũ), câu hỏi tiếp theo như
    // "Cho mình đáp án luôn nhé" hay "Mình chưa hiểu bước này" thường không có từ khóa toán nào —
    // gửi thẳng lên backend, AI tự phân loại refuse_answer / off_topic dựa trên lịch sử.
    const hasAiAnswer = baseMessages.some(m => m.sender === "bot" && (m.answer || m.aiResult));
    if (!hasAiAnswer && !isMathRelated(textToSend)) {
      // isNotice: câu mẫu của app, không phải lời AI — hiện kiểu thông báo và không gửi lên AI
      // làm lịch sử.
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: "Mình chỉ hỗ trợ các câu hỏi liên quan đến toán học THPT thôi nhé! Bạn thử hỏi về công thức, bài toán, hoặc giải phương trình xem.",
        isNotice: true,
      }]);
      return;
    }

    setIsAnalyzing(true);
    const requestId = ++typedRequestIdRef.current;
    try {
      // Tin hệ thống (lỗi, hết lượt, "AI đang bận") vẫn lưu trong phiên để hiển thị lại nhưng
      // KHÔNG gửi lên AI làm lịch sử — chúng không phải lời AI nói, gửi lên chỉ gây nhiễu.
      const historyForAPI = updatedMessages
        .filter(m => !m.isImage && !m.isFile && !m.isError && !m.isLimitHit && !m.isNotice)
        .slice(-6)
        .map(m => ({ sender: m.sender, text: m.text }));
      const history = historyForAPI.slice(0, -1);
      const data = await retryFinderBusyOnce(
        () => callAI(textToSend, history),
        (seconds, error) => {
          if (typeof error.remaining === "number") setAiQueriesLeft(error.remaining);
          const until = Date.now() + seconds * 1000;
          setTypedBusyNow(Date.now());
          setTypedBusyUntil(until);
          return new Promise(resolve => {
            const timer = setTimeout(() => {
              typedRetryRef.current = null;
              setTypedBusyUntil(0);
              resolve(true);
            }, seconds * 1000);
            typedRetryRef.current = { timer, resolve };
          });
        },
      );
      if (!data || requestId !== typedRequestIdRef.current) return;
      // remaining = null với Premium (không giới hạn) → giữ nguyên, không hiện bộ đếm.
      if (typeof data.remaining === "number") setAiQueriesLeft(data.remaining);
      // Chỉ lưu id công thức (không lưu cả object như trước) để chat_sessions không giữ bản sao
      // cũ của công thức — thẻ luôn lấy dữ liệu mới nhất từ formulas.js khi hiển thị. `text` là
      // bản văn bản của câu trả lời, dùng làm lịch sử gửi lại cho AI ở câu sau.
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || data.intro || "",
        answer: {
          type: data.type,
          formulaIds: Array.isArray(data.formulaIds) ? data.formulaIds : [],
          intro: data.intro || "",
          steps: Array.isArray(data.steps) ? data.steps : [],
          reminder: data.reminder || "",
        },
      }]);
    } catch (error) {
      if (requestId !== typedRequestIdRef.current) return;
      if (typeof error.remaining === "number") setAiQueriesLeft(error.remaining);
      if (error.code === "quota_exceeded" || (error.status === 429 && error.remaining === 0)) {
        setAiQueriesLeft(0);
        pushLimitHitMessage(error.message);
        return;
      }
      if (error.code === "ai_busy") {
        // Không phải lỗi của học sinh và đã được hoàn lượt — báo nhẹ nhàng, không gắn "Lỗi AI".
        // retryText: hiện nút "Hỏi lại" (đã tự thử lại một lần mà vẫn bận).
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: error.message, isNotice: true, retryText: textToSend }]);
        return;
      }
      const isConn = error.message.includes("fetch") || error.message.includes("Failed");
      const errorMsg = isConn
        ? "Không kết nối được tới máy chủ AI. Bạn kiểm tra mạng rồi thử lại nhé."
        : `Lỗi AI: ${error.message}`;
      setApiError(errorMsg);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: errorMsg, isError: true }]);
    } finally {
      if (requestId === typedRequestIdRef.current) setIsAnalyzing(false);
    }
  };

  // ─── Session handlers ─────────────────────────────────────────────────────

  const startNewChat = () => {
    typedRequestIdRef.current++;
    cancelTypedRetry();
    setIsAnalyzing(false);
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setApiError(null);
    setSidebarOpen(false);
    setDeletingId(null);
    setRenamingId(null);
  };

  const loadSession = (session) => {
    typedRequestIdRef.current++;
    cancelTypedRetry();
    setIsAnalyzing(false);
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    sessionIdRef.current = session.id;
    setSidebarOpen(false);
    setApiError(null);
    setDeletingId(null);
    setRenamingId(null);
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessionsToStorage(sessionsKey, updated);
      return updated;
    });
    if (user?.googleId) deleteChatSessionDB(user.googleId, sessionId);
    if (sessionIdRef.current === sessionId) {
      typedRequestIdRef.current++;
      cancelTypedRetry();
      setIsAnalyzing(false);
      setMessages([]);
      setCurrentSessionId(null);
      sessionIdRef.current = null;
    }
    setDeletingId(null);
  };

  const confirmRename = () => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    const newName = renameValue.trim();
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === renamingId ? { ...s, name: newName } : s
      );
      saveSessionsToStorage(sessionsKey, updated);
      return updated;
    });
    if (user?.googleId) {
      const session = sessionsRef.current.find(s => s.id === renamingId);
      if (session) upsertChatSession(user.googleId, { ...session, name: newName }).catch(console.error);
    }
    setRenamingId(null);
  };

  // ─── Bookmark ───────────────────────────────────────────────────

  // Thông báo "Đã thêm vào Bookmark" (kèm nút Xem thư viện) do handleToggleBookmark ở App.jsx bắn.
  const handleBookmarkWithPopup = (formulaId) => onToggleBookmark(formulaId);

  // ─── Ảnh đề: chụp/chọn → Gemini đọc → chọn bài → hướng dẫn từng bài ───────

  // 45 giây PHẢI lớn hơn ngân sách 40 giây/request của backend (OCR_BUDGET_MS trong
  // backend/lib/ocrReader.js), nếu không học sinh bị tính lượt quét mà không thấy kết quả.
  const callOcr = async (base64) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    let response;
    try {
      response = await fetchWithAuth(`${BACKEND_URL}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Đọc ảnh lâu quá. Bạn thử lại nhé.", { cause: err });
      throw new Error("Không kết nối được tới máy chủ. Bạn kiểm tra mạng rồi thử lại nhé.", { cause: err });
    } finally {
      clearTimeout(timeoutId);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || "Chưa đọc được ảnh, bạn thử lại nhé."), { code: data.code });
    return data;
  };

  const openScanSheet = () => {
    // Quét ảnh không tính lượt, nhưng hết lượt thì cũng không hướng dẫn được bài nào — báo luôn.
    if (!isPremium && aiQueriesLeft === 0) {
      pushLimitHitMessage(`Bạn đã dùng hết ${FREE_AI_LIMIT} lượt hỏi AI miễn phí hôm nay. Nâng cấp Premium để hỏi không giới hạn!`);
      return;
    }
    setScanSheetOpen(true);
  };

  const handlePickImage = async (file) => {
    setScanSheetOpen(false);
    setOcr({ stage: "scanning" });
    try {
      const { base64, blob } = await compressImageFile(file);
      const data = await callOcr(base64);
      const stamp = Date.now();
      const problems = (Array.isArray(data.problems) ? data.problems : []).map((p, i) => ({ ...p, key: `p${stamp}-${i}` }));
      // Ảnh chỉ có một bài thì chọn sẵn bài đó. imageUrl: ảnh đã nén, chỉ để học sinh đối chiếu trên màn
      // chọn bài — được revoke khi rời màn (effect bên dưới).
      setOcr({ stage: "review", problems, selected: problems.length === 1 ? [problems[0].key] : [], imageUrl: URL.createObjectURL(blob) });
    } catch (err) {
      setOcr({ stage: "error", message: err.message });
    }
  };

  // Dán ảnh (Ctrl+V / Cmd+V) và kéo thả file ảnh — trên máy tính, ảnh chụp màn hình nằm trong bộ nhớ tạm chứ không phải
  // file, nên trước đây không gửi được (mentor báo 2026-11-03). Dùng lại đúng luồng quét như nút ảnh (handlePickImage).
  // Nghe ở cả document để dán được dù con trỏ không ở ô nhập; ref giữ hàm mới nhất để không gắn lại listener mỗi lần vẽ.
  const [dragActive, setDragActive] = useState(false);
  // Hộp thoại khác đang mở thì không nhận ảnh dán/thả (trừ bảng "Gửi ảnh đề bài" — chính nó nhắc bấm Ctrl+V).
  const otherDialogOpen = () =>
    Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
      .some((el) => el.getAttribute("aria-label") !== "Gửi ảnh đề bài");
  const takeImageRef = useRef(null);
  takeImageRef.current = (file) => {
    if (!FINDER_IMAGE_INPUT_ENABLED || isGuest || !user?.googleId || isAnalyzing) return false;
    if (ocr && ocr.stage !== "error") return false; // đang quét / đang chọn bài / đang hướng dẫn
    if (otherDialogOpen()) return false; // vd hộp "Hôm nay bạn gặp khó khăn gì?" đang che trang
    if (!file || !file.type.startsWith("image/")) return false;
    if (!isPremium && aiQueriesLeft === 0) {
      pushLimitHitMessage(`Bạn đã dùng hết ${FREE_AI_LIMIT} lượt hỏi AI miễn phí hôm nay. Nâng cấp Premium để hỏi không giới hạn!`);
      return true;
    }
    handlePickImage(file);
    return true;
  };
  useEffect(() => {
    if (!FINDER_IMAGE_INPUT_ENABLED) return;
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const onPaste = (e) => {
      const item = Array.from(e.clipboardData?.items || []).find((it) => it.kind === "file" && it.type.startsWith("image/"));
      if (!item) return; // dán chữ thì để ô nhập xử lý như thường
      if (takeImageRef.current(item.getAsFile())) e.preventDefault();
    };
    let depth = 0; // dragenter/dragleave nổ ở từng phần tử con — đếm để biết khi nào thật sự rời trang
    const onDragEnter = (e) => { if (!hasFiles(e)) return; depth += 1; if (!otherDialogOpen()) setDragActive(true); };
    const onDragLeave = (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) setDragActive(false); };
    const onDragOver = (e) => { if (hasFiles(e)) e.preventDefault(); };
    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragActive(false);
      const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith("image/"));
      if (file) takeImageRef.current(file);
    };
    document.addEventListener("paste", onPaste);
    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  // Giải phóng ảnh khi rời màn "Các bài trong ảnh" (sang tab hướng dẫn, đóng, quét ảnh khác) hoặc rời
  // AI Finder: imageUrl đổi/mất → cleanup của URL cũ chạy.
  const reviewImageUrl = ocr?.stage === "review" ? ocr.imageUrl : null;
  useEffect(() => {
    if (!reviewImageUrl) return;
    return () => URL.revokeObjectURL(reviewImageUrl);
  }, [reviewImageUrl]);

  const startGuide = (keys) => {
    setOcr(prev => {
      if (prev?.stage !== "review") return prev;
      const items = prev.problems.filter(p => keys.includes(p.key));
      return items.length ? { stage: "guide", items, activeKey: items[0].key, results: {} } : prev;
    });
  };

  const setGuideResult = (key, result) => {
    setOcr(prev => {
      if (prev?.stage !== "guide") return prev;
      const results = { ...prev.results };
      if (result) results[key] = result; else delete results[key];
      return { ...prev, results };
    });
  };

  // Mỗi bài là một câu hỏi độc lập (không gửi lịch sử chat) và tính 1 lượt như câu gõ tay. Đề + câu
  // trả lời được thêm vào cuộc trò chuyện hiện tại để lưu/đồng bộ như mọi tin nhắn khác.
  const runGuidance = async (item) => {
    if (inFlightRef.current) return;
    inFlightRef.current = item.key;
    setInFlightKey(item.key);
    setGuideResult(item.key, { status: "loading" });
    const message = problemToFinderMessage(item);
    try {
      const data = await callAI(message, [], "image");
      if (typeof data.remaining === "number") setAiQueriesLeft(data.remaining);
      const answer = {
        type: data.type,
        formulaIds: Array.isArray(data.formulaIds) ? data.formulaIds : [],
        intro: data.intro || "",
        steps: Array.isArray(data.steps) ? data.steps : [],
        reminder: data.reminder || "",
      };
      // no_formula: không tính lượt (backend hoàn), tab hiện nút Sửa đề thay vì ✓.
      setGuideResult(item.key, { status: answer.type === "no_formula" ? "no_formula" : "done", answer });
      const now = Date.now();
      setMessages(prev => [
        ...prev,
        { id: now, sender: "user", text: message },
        { id: now + 1, sender: "bot", text: data.reply || data.intro || "", answer },
      ]);
    } catch (error) {
      if (typeof error.remaining === "number") setAiQueriesLeft(error.remaining);
      if (error.code === "quota_exceeded" || (error.status === 429 && error.remaining === 0)) {
        setAiQueriesLeft(0);
        setGuideResult(item.key, { status: "limit", message: error.message });
      } else if (error.code === "ai_busy") {
        // Groq hết hạn mức token/PHÚT của cả app (lượt đã được backend hoàn). Chờ đúng thời gian Groq
        // báo rồi tự hỏi lại MỘT lần cho bài này; lần sau vẫn bận thì chỉ còn nút Thử lại.
        const startedWaiting = Date.now();
        setBusySince(startedWaiting);
        setBusyUntil(startedWaiting + busyWaitSeconds(error.retryAfter) * 1000);
        const auto = !autoRetriedRef.current.has(item.key);
        autoRetriedRef.current.add(item.key);
        setGuideResult(item.key, { status: "busy", auto });
      } else {
        const isConn = error.message.includes("fetch") || error.message.includes("Failed");
        setGuideResult(item.key, {
          status: "error",
          message: isConn ? "Không kết nối được tới máy chủ AI. Bạn kiểm tra mạng rồi thử lại nhé." : error.message,
        });
      }
    } finally {
      inFlightRef.current = null;
      setInFlightKey(null);
    }
  };

  // Chỉ gọi AI cho bài đang mở, chưa có kết quả, và khi không có bài nào đang chờ AI. Mở tab khác
  // trong lúc chờ thì tab đó bắt đầu ngay khi bài trước xong.
  const guideActiveKey = ocr?.stage === "guide" ? ocr.activeKey : null;
  const guideResults = ocr?.stage === "guide" ? ocr.results : null;
  const guideItems = ocr?.stage === "guide" ? ocr.items : null;
  useEffect(() => {
    if (!guideResults) return;
    const key = nextGuidanceRequest({ activeKey: guideActiveKey, results: guideResults, inFlightKey, busyUntil });
    const item = key && guideItems.find(p => p.key === key);
    if (item) runGuidance(item);
    // runGuidance là hàm tạo lại mỗi lần render — chỉ cần chạy lại khi tab/kết quả/bài đang chờ đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideActiveKey, guideResults, guideItems, inFlightKey, busyUntil]);

  // Hết thời gian chờ "AI đang bận": bỏ chặn, và bài nào còn quyền tự thử lại (auto) thì xoá kết quả
  // "busy" để effect trên hỏi lại khi bài đó đang mở. Bài đã tự thử lại một lần thì giữ nút Thử lại.
  useEffect(() => {
    if (!busyUntil) return;
    const id = setTimeout(() => {
      setBusyUntil(0);
      setOcr(prev => {
        if (prev?.stage !== "guide") return prev;
        const results = Object.fromEntries(Object.entries(prev.results).filter(([, r]) => !(r.status === "busy" && r.auto)));
        return { ...prev, results };
      });
    }, Math.max(0, busyUntil - Date.now()));
    return () => clearTimeout(id);
  }, [busyUntil]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Hôm nay";
    if (diff === 1) return "Hôm qua";
    if (diff < 7) return `${diff} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Luồng ảnh đề chiếm khung chat (ô nhập ẩn) cho tới khi học sinh bấm Đóng/Xong; các bài đã
  // hướng dẫn nằm sẵn trong cuộc trò chuyện. Đóng giữa chừng thì bài đang chờ AI vẫn được thêm vào
  // cuộc trò chuyện khi xong (runGuidance không phụ thuộc màn này còn mở hay không).
  const closeOcr = () => setOcr(null);

  const renderOcrPanel = () => {
    if (ocr.stage === "scanning") {
      return (
        <div className="flex flex-col items-center text-center gap-2 py-10">
          <div className="flex items-center gap-2 text-[0.85rem] font-bold text-text-muted dark:text-night-muted">
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite]" />
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.4s]" />
            <span>Đang đọc đề trong ảnh...</span>
          </div>
          <span className="text-[0.75rem] text-text-muted dark:text-night-muted">Thường mất khoảng 5–10 giây.</span>
        </div>
      );
    }
    if (ocr.stage === "error") {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4 max-w-[420px] mx-auto">
          <AlertCircle size={26} className="text-error" />
          <p className="text-[0.88rem] text-primary dark:text-night-text m-0">{ocr.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={openScanSheet} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
              <Camera size={14} /> Thử lại
            </button>
            <button type="button" onClick={closeOcr} className="bg-[#F1F5F9] dark:bg-night-line text-text-muted dark:text-night-text border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
              Đóng
            </button>
          </div>
        </div>
      );
    }
    if (ocr.stage === "review") {
      return (
        <ImageProblemsPanel
          problems={ocr.problems}
          selected={ocr.selected}
          onToggle={(key) => setOcr(prev => ({
            ...prev,
            selected: prev.selected.includes(key) ? prev.selected.filter(k => k !== key) : [...prev.selected, key],
          }))}
          onEdit={(key, patch) => setOcr(prev => ({
            ...prev,
            problems: prev.problems.map(p => (p.key === key ? { ...p, ...patch } : p)),
          }))}
          onGuide={startGuide}
          onCancel={closeOcr}
          onRescan={openScanSheet}
          aiQueriesLeft={aiQueriesLeft}
          isPremium={isPremium}
          imageUrl={ocr.imageUrl}
        />
      );
    }
    return (
      <ProblemTabs
        items={ocr.items}
        activeKey={ocr.activeKey}
        results={ocr.results}
        inFlightKey={inFlightKey}
        busyUntil={busyUntil}
        busySince={busySince}
        onSelect={(key) => setOcr(prev => ({ ...prev, activeKey: key }))}
        onRetry={(key) => { setBusyUntil(0); setGuideResult(key, null); }}
        onEditItem={(key, patch) => {
          // Đề đã sửa → bài coi như mới: xoá kết quả cũ (effect hỏi lại khi tab đang mở), cho phép tự
          // thử lại lần nữa nếu gặp "AI đang bận".
          autoRetriedRef.current.delete(key);
          setOcr(prev => {
            if (prev?.stage !== "guide") return prev;
            const results = { ...prev.results };
            delete results[key];
            return { ...prev, items: prev.items.map(p => (p.key === key ? { ...p, ...patch } : p)), results };
          });
        }}
        onClose={closeOcr}
        onUpgrade={() => setActiveTab("premium")}
        formulas={formulas}
        onViewDetail={onViewDetail}
      />
    );
  };

  const guestExamples = isGuest
    ? GUEST_EXAMPLES
        .map(ex => ({ ...ex, formula: formulas.find(f => f.id === ex.formulaId) }))
        .filter(ex => ex.formula?.example)
    : [];

  return (
    // Trên mobile .view-container (App.css) là flex item `flex: 1` trong .app-container chỉ có
    // min-height, nên kích thước của nó tính theo nội dung: chat dài hoặc ví dụ của khách kéo giãn
    // cả khung và đẩy ô nhập ra khỏi màn hình thay vì cuộn bên trong. contain-size bỏ phần nội
    // dung ra khỏi phép tính đó — view chỉ lấp đúng phần trống giữa header và thanh điều hướng.
    <PageShell fill width="full" className="!p-[10px] h-[calc(100vh-124px)] max-md:contain-size flex flex-col bg-page dark:bg-night-page">

      {/* Tiêu đề + lượt còn lại (mockup Trợ lý hướng dẫn) */}
      <div className="flex justify-between items-end gap-3 mb-3 md:mb-4 md:pt-2">
        <div className="min-w-0">
          <button className="bg-transparent border-none p-0 text-text-muted dark:text-night-muted text-[0.8rem] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:text-primary dark:hover:text-night-text" onClick={() => setActiveTab("dashboard")}>
            <ArrowLeft size={14} />
            <span>Về trang chủ</span>
          </button>
          <h1 className="m-0 mt-1 text-[1.35rem] md:text-[1.9rem] font-bold tracking-[-0.03em] leading-[1.15] text-primary dark:text-night-text">Trợ lý hướng dẫn</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isPremium && !isGuest && aiQueriesLeft !== null && (
            <span className={`hidden sm:inline-flex items-center h-9 px-3 rounded-full border text-[0.78rem] font-semibold ${
              aiQueriesLeft === 0 ? "bg-error/10 border-error/30 text-[#B91C1C] dark:text-[#FCA5A5]"
                : aiQueriesLeft <= 3 ? "bg-accent-light border-accent/30 text-[#92400E] dark:bg-accent/15 dark:border-accent/30 dark:text-[#FCD34D]"
                : "bg-[#DCFCE7] border-[#BBF7D0] text-[#166534] dark:bg-success/15 dark:border-success/30 dark:text-[#6EE7B7]"
            }`}>
              {aiQueriesLeft === 0 ? "Hết lượt hôm nay" : `Còn ${aiQueriesLeft}/${FREE_AI_LIMIT} lượt hôm nay`}
            </span>
          )}
          <button
            className="md:hidden relative inline-flex items-center gap-1.5 bg-white dark:bg-night-card border border-[#E2E8F0] dark:border-night-line rounded-full px-3 py-2 text-[0.75rem] font-bold text-primary dark:text-night-text cursor-pointer transition duration-200 hover:bg-[#f8fafc] dark:hover:bg-night-line hover:border-[#cbd5e1] mb-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <History size={14} />
            <span>
              Lịch sử chat
              {sessions.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-secondary text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[0.6rem]">
                  {sessions.length}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Backdrop khi sidebar mở trên mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[299] bg-black/30"
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden h-full relative">
        {/* ─── Session Sidebar ─── (desktop: cột phải như mockup; mobile: ngăn trượt như cũ) */}
        <div className={`fx-card dark:bg-night-card dark:border-night-line dark:shadow-none ${sidebarOpen ? "flex" : "hidden"} md:flex md:order-2 flex-col gap-2 fixed md:relative top-[68px] md:top-auto left-0 md:left-auto right-0 md:right-auto bottom-14 md:bottom-auto z-[300] md:z-auto w-full md:w-[300px] md:shrink-0 p-4 md:p-5 overflow-y-auto`}>

          {/* New chat button */}
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-3 mb-3 bg-navy-btn dark:bg-accent text-white border-none rounded-[12px] cursor-pointer text-[0.85rem] font-semibold transition-colors hover:bg-navy-btn-hover dark:hover:bg-accent-hover"
          >
            <Plus size={15} />
            Chat mới
          </button>

          {/* Bài AI đã hướng dẫn → Kiểm tra › "Luyện lại bài đã hỏi" (đề cùng dạng, số liệu mới). */}
          {!isGuest && onPracticeAsked && sessions.length > 0 && (
            <button
              onClick={() => { setSidebarOpen(false); onPracticeAsked(); }}
              className="w-full flex items-start gap-2 py-2.5 px-3 -mt-1.5 mb-3 bg-accent-light dark:bg-accent/15 text-[#92400E] dark:text-[#FCD34D] border border-[#FDE68A] dark:border-accent/30 rounded-[10px] cursor-pointer text-left"
            >
              <History size={14} className="shrink-0 mt-0.5" />
              <span>
                <span className="block text-[0.8rem] font-bold">Luyện lại bài đã hỏi</span>
                <span className="block text-[0.7rem] font-medium opacity-80 leading-[1.4]">AI ra đề cùng dạng, đổi số liệu</span>
              </span>
            </button>
          )}

          <div className="text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-text-muted dark:text-night-muted mb-1.5">Lịch sử gần đây</div>

          {isGuest ? (
            <div className="flex flex-col items-center text-center gap-2 py-4 px-2">
              <Lock size={18} className="text-accent" />
              <div className="text-[0.75rem] text-text-muted dark:text-night-muted leading-[1.5]">
                Đăng nhập Google để lưu và xem lại lịch sử trò chuyện.
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-4 px-2 text-center">
              <History size={22} className="mx-auto mb-1.5 text-[#CBD5E1] dark:text-[#475569]" />
              <div className="text-[0.8rem] font-bold text-primary dark:text-night-text">Chưa có cuộc trò chuyện nào</div>
              <div className="mt-0.5 text-[0.72rem] leading-[1.45] text-text-muted dark:text-night-muted">Câu hỏi bạn gửi sẽ được lưu ở đây để xem lại.</div>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`mb-1.5 rounded-[12px] overflow-hidden border ${
                  currentSessionId === session.id ? "border-accent bg-accent-light/50 dark:bg-accent/10" : "border-line dark:border-night-line bg-[#FAFBFD] dark:bg-night-page"
                }`}
              >
                {/* Rename mode */}
                {renamingId === session.id ? (
                  <div className="py-2 px-2.5 flex gap-1.5 items-center">
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") confirmRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 border-[1.5px] border-accent rounded-md py-1 px-2 text-[0.78rem] outline-none"
                    />
                    <button aria-label="Lưu tên mới" onClick={confirmRename} className="bg-success border-none rounded-md py-1 px-1.5 cursor-pointer text-white flex items-center">
                      <Check size={12} />
                    </button>
                    <button aria-label="Huỷ đổi tên" onClick={() => setRenamingId(null)} className="bg-[#F1F5F9] dark:bg-night-line border-none rounded-md py-1 px-1.5 cursor-pointer text-text-muted dark:text-night-muted flex items-center">
                      <X size={12} />
                    </button>
                  </div>
                ) : deletingId === session.id ? (
                  /* Delete confirm mode */
                  <div className="p-2.5">
                    <div className="text-[0.75rem] text-error font-bold mb-1.5">
                      Xóa cuộc trò chuyện này?
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="flex-1 py-1.5 bg-error text-white border-none rounded-md cursor-pointer text-[0.75rem] font-bold"
                      >
                        Xóa
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex-1 py-1.5 bg-[#F1F5F9] dark:bg-night-line text-text-muted dark:text-night-muted border-none rounded-md cursor-pointer text-[0.75rem] font-bold"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal mode */
                  <div className="flex items-center">
                    <button
                      onClick={() => loadSession(session)}
                      className="flex-1 text-left py-2.5 px-2.5 bg-transparent border-none cursor-pointer min-w-0"
                    >
                      <div className="text-[0.82rem] font-medium text-primary dark:text-night-text whitespace-nowrap overflow-hidden text-ellipsis">
                        {/* Tên cũ (trước 2026-11-02) còn LaTeX thô → đổi lúc hiển thị. */}
                        {latexToPlainText(session.name)}
                      </div>
                      <div className="text-[0.68rem] text-[#94A3B8] mt-0.5">
                        {formatDate(session.updatedAt)}
                      </div>
                    </button>

                    <div className="flex gap-0.5 pr-1.5 shrink-0">
                      <button aria-label="Đổi tên cuộc trò chuyện"
                        onClick={() => { setRenamingId(session.id); setRenameValue(session.name); }}
                        title="Đổi tên"
                        className="bg-transparent border-none cursor-pointer p-1.5 text-[#94A3B8] rounded-md flex items-center"
                      >
                        <Pencil size={12} />
                      </button>
                      <button aria-label="Xoá cuộc trò chuyện"
                        onClick={() => setDeletingId(session.id)}
                        title="Xóa"
                        className="bg-transparent border-none cursor-pointer p-1.5 text-[#94A3B8] rounded-md flex items-center"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── Chat window ─── */}
        <div className="fx-card dark:bg-night-page dark:border-night-line dark:shadow-none flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 py-5 px-4 md:px-7 md:py-7 overflow-y-auto flex flex-col gap-4 bg-transparent dark:bg-night-page" ref={chatMessagesRef}>
            {isGuest ? (
              <div className="flex flex-col gap-4 w-full max-w-[640px] mx-auto">
                <div className="flex flex-col items-center text-center gap-2 pt-2">
                  <div className="w-14 h-14 rounded-full bg-accent-light dark:bg-accent/15 text-accent flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-[1.2rem] font-extrabold text-[#1E3A5F] dark:text-night-text m-0">
                    Hỏi AI cần đăng nhập Google
                  </h2>
                  <p className="text-[0.82rem] text-text-muted dark:text-night-muted m-0 max-w-[420px] leading-[1.5]">
                    Tài khoản Google miễn phí được hỏi {FREE_AI_LIMIT} lượt mỗi ngày. Dưới đây là ví dụ cách FormulaX AI trả lời.
                  </p>
                </div>

                {guestExamples.map(({ formula, answer }) => {
                  // Chỉ lấy dòng đầu (đề bài) — phần còn lại của `example` là lời giải có đáp số.
                  const question = formula.example.split("\n")[0].trim();
                  return (
                    <div key={formula.id} className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-night-line p-3.5">
                      <span className="self-start text-[0.68rem] font-extrabold uppercase tracking-[0.5px] text-accent bg-accent-light dark:bg-accent/15 py-0.5 px-2 rounded-md">
                        Ví dụ
                      </span>
                      <div className="self-end max-w-[85%] py-2.5 px-3.5 rounded-xl rounded-br-[2px] bg-accent text-white text-[0.85rem] leading-[1.5]">
                        <RichTextRenderer text={question} />
                      </div>
                      <div className="self-start w-full min-w-0 md:max-w-[92%] py-3 px-4 rounded-xl rounded-bl-[2px] border border-[#e2e8f0] dark:border-night-line bg-white dark:bg-night-card text-primary dark:text-night-text">
                        <StepAnswer answer={answer} formulas={formulas} onViewDetail={onViewDetail} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : ocr ? (
              renderOcrPanel()
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 md:py-14 max-w-[520px] mx-auto gap-3">
                <MimiMascot width={170} />
                <h2 className="m-0 text-[1.3rem] md:text-[1.6rem] font-bold tracking-[-0.02em] text-primary dark:text-night-text">
                  Xin chào! Mình là FormulaX AI
                </h2>
                <p className="m-0 text-[0.88rem] text-text-muted dark:text-night-muted leading-[1.6]">
                  Gõ hoặc chụp đề bài. Mình chỉ ra công thức cần dùng và các bước thay dữ kiện, phần tính bạn tự làm.
                </p>
              </div>
            ) : (
              messages.map((msg, msgIdx) => {
                const isUser = msg.sender === "user";
                const bubbleStateClass = msg.isError
                  ? "bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] text-[#b91c1c]"
                  : msg.isLimitHit || msg.isNotice
                    // `!` ở dark: để thắng dark:bg/border chung của bong bóng bot bên dưới — không có
                    // thì ở dark mode thông báo trông y như bong bóng thường.
                    ? "bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-[#92400E] dark:text-[#FCD34D] dark:!bg-[rgba(245,158,11,0.1)] dark:!border-[rgba(245,158,11,0.35)]"
                    : (msg.isImage || msg.isFile)
                      ? "p-2 bg-white dark:bg-night-card border border-[#E2E8F0] dark:border-night-line text-[#1E3A5F] dark:text-night-text"
                      : isUser
                        ? "bg-primary text-white dark:bg-night-line"
                        : "bg-white bg-[linear-gradient(135deg,#FFF8E1,#FFFFFF_45%)] dark:bg-none dark:bg-night-card text-primary dark:text-night-text";
                return (
                  <div
                    key={msg.id}
                    className={`${msg.answer ? "w-full max-w-full" : "max-w-[85%]"} ${!isUser ? "md:max-w-[92%]" : "md:max-w-[620px]"} min-w-0 py-3 px-4 md:py-3.5 md:px-5 text-[0.88rem] md:text-[0.95rem] leading-[1.5] break-words ${
                      isUser
                        ? "self-end rounded-[18px] rounded-br-[4px]"
                        : "self-start rounded-[18px] rounded-bl-[4px] border border-line dark:border-night-line"
                    } ${bubbleStateClass}`}
                  >
                    {msg.isError && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{msg.text}</span>
                      </div>
                    )}

                    {msg.isImage && (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative w-[180px] h-[100px] bg-[linear-gradient(135deg,#F8FAFC_0%,#E2E8F0_100%)] dark:bg-[linear-gradient(135deg,#1E293B_0%,#0F172A_100%)] rounded-lg border-[1.5px] border-[#CBD5E1] dark:border-night-line flex flex-col items-center justify-center text-[0.8rem] text-[#475569] dark:text-night-muted font-bold">
                          <div className="text-[0.85rem] text-[#1E3A5F] dark:text-night-text font-mono z-[1]">R = 3cm | V = ?</div>
                          <span className="absolute bottom-1.5 right-1.5 bg-success text-white text-[0.6rem] py-0.5 px-1.5 rounded z-[1] font-extrabold">CAPTURE OCR</span>
                        </div>
                        <div className="text-xs text-text-muted font-semibold pl-1">Ảnh chụp đề bài từ Camera AI</div>
                      </div>
                    )}

                    {msg.isFile && (
                      <div className="flex items-center gap-2.5 py-1.5 px-2.5 bg-[#F8FAFC] dark:bg-night-page rounded-lg border border-[#E2E8F0] dark:border-night-line">
                        <div className="p-2 bg-secondary/8 text-secondary rounded-md flex items-center justify-center">
                          <FileText size={18} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[0.8rem] font-bold text-[#1E3A5F] dark:text-night-text text-ellipsis overflow-hidden whitespace-nowrap max-w-[160px]">{msg.fileName}</span>
                          <span className="text-[0.65rem] text-text-muted font-semibold">Tài liệu đính kèm</span>
                        </div>
                      </div>
                    )}

                    {/* Câu trả lời dạng mới (có answer): công thức → các bước → lời nhắc. Tin nhắn
                        cũ trong chat_sessions không có answer vẫn hiển thị bằng nhánh văn bản
                        bên dưới + thẻ aiResult, không lỗi. */}
                    {msg.answer && (
                      <StepAnswer answer={msg.answer} formulas={formulas} onViewDetail={onViewDetail} />
                    )}

                    {/* Ngay dưới câu hướng dẫn: mời làm đề luyện cùng dạng (Kiểm tra › Luyện lại bài đã hỏi), chọn sẵn đúng
                        bài này. Chỉ cho câu trả lời có hướng dẫn thật (solution) và tài khoản Google. */}
                    {msg.answer?.type === "solution" && !isGuest && onPracticeAsked && (() => {
                      const askedIdx = messages.slice(0, msgIdx).map((m) => m.sender).lastIndexOf("user");
                      const asked = messages[askedIdx];
                      if (!asked?.text?.trim()) return null;
                      // Câu hỏi lại ("tui chưa hiểu bước 2") không phải đề mới → không mời làm bài (nút đã có dưới đề gốc).
                      if (isFollowUpQuestion(asked.text, messages.slice(0, askedIdx).some((m) => m.sender === "user"))) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => onPracticeAsked({ text: asked.text, formulaIds: msg.answer.formulaIds || [] })}
                          className="mt-3 w-full flex items-center gap-3 text-left rounded-[12px] border border-dashed border-accent/50 bg-accent-light/40 dark:bg-accent/10 px-3 py-2.5 cursor-pointer transition-colors hover:border-accent hover:bg-accent-light/70 dark:hover:bg-accent/15"
                        >
                          <span className="w-8 h-8 rounded-[9px] bg-white dark:bg-night-page text-accent dark:text-[#FCD34D] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(15,23,42,0.08)]"><ClipboardList size={16} /></span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[0.85rem] font-semibold text-primary dark:text-night-text">Làm bài kiểm tra cùng dạng này</span>
                            <span className="block text-[0.72rem] text-text-muted dark:text-night-muted">AI ra đề mới cùng dạng, số liệu khác — tự giải rồi xem đáp án</span>
                          </span>
                          <ChevronRight size={16} className="text-accent shrink-0" />
                        </button>
                      );
                    })()}

                    {/* Thông báo (vd "AI đang bận") — chữ thường, không qua .chat-bot-text vì CSS dark
                        mode của lớp đó ghi đè màu amber. Cờ isNotice được lưu cùng phiên nên mở lại
                        phiên cũ vẫn hiện đúng kiểu thông báo. */}
                    {msg.isNotice && (
                      <span className="text-[0.88rem]">{msg.text}</span>
                    )}
                    {msg.isNotice && msg.retryText && msg.id === messages[messages.length - 1]?.id && !isAnalyzing && (
                      <button
                        type="button"
                        onClick={() => {
                          // Bỏ thông báo này + câu hỏi ngay trước nó (cùng nội dung), rồi gửi lại.
                          const i = messages.length - 1;
                          const prevMsg = messages[i - 1];
                          const base = messages.slice(0, prevMsg?.sender === "user" && prevMsg.text === msg.retryText ? i - 1 : i);
                          setMessages(base);
                          handleSend(msg.retryText, base);
                        }}
                        className="mt-2 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border-none bg-accent hover:bg-accent-hover text-white text-[0.8rem] font-bold cursor-pointer transition-colors"
                      >
                        <RotateCcw size={13} /> Hỏi lại
                      </button>
                    )}

                    {!msg.answer && !msg.isImage && !msg.isFile && !msg.isError && !msg.isLimitHit && !msg.isNotice && (
                      <div className="chat-bot-text leading-[1.65] text-[0.88rem]">
                        {msg.sender === "bot"
                          ? <RichTextRenderer text={msg.text || ""} />
                          // Đề của học sinh cũng có LaTeX ($4^x - 3 \cdot 2^x$), nhất là đề đọc từ ảnh — trước đây hiện
                          // nguyên văn ký hiệu $ và lệnh \cdot. rt-inherit: chữ ăn theo màu/cỡ của bong bóng tin nhắn.
                          : <div className="rt-inherit"><RichTextRenderer text={msg.text || ""} /></div>
                        }
                      </div>
                    )}

                    {msg.isLimitHit && (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 text-[0.88rem]">
                          <Crown size={16} fill="#F59E0B" color="#F59E0B" />
                          <span>{msg.text}</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("premium")}
                          className="flex items-center justify-center gap-1.5 bg-premium text-[#1E3A5F] border-none rounded-lg py-2 px-4 text-[0.82rem] font-extrabold cursor-pointer"
                        >
                          <Crown size={13} fill="#1E3A5F" color="#1E3A5F" />
                          Nâng cấp Premium — Hỏi không giới hạn
                        </button>
                      </div>
                    )}

                    {/* Thẻ công thức của tin nhắn định dạng cũ (lưu cả object công thức) */}
                    {msg.sender === "bot" && !msg.answer && msg.aiResult && (
                      <div className="finder-ai-card mt-3.5 bg-white dark:bg-night-card border-[1.5px] border-[#e2e8f0] dark:border-night-line border-l-4 border-l-accent rounded-xl p-4 flex flex-col gap-3 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                        <div className="text-[1.05rem] font-extrabold text-primary dark:text-night-text flex items-center gap-1.5 before:content-['✨'] before:text-[0.95rem]">{msg.aiResult.name}</div>
                        <div className="bg-[#f8fafc] dark:bg-night-page/60 border border-secondary/15 dark:border-night-line rounded-lg p-4 flex items-center justify-center my-1 shadow-[inset_0_2px_4px_rgba(30,58,95,0.01)] !text-[#1E3A5F] dark:!text-night-text">
                          <MathElement math={msg.aiResult.latex} block={true} />
                        </div>
                        <div className="finder-ai-card text-xs text-[#334155] dark:text-[#CBD5E1]">
                          <strong>Ý nghĩa:</strong>
                          <RichTextRenderer text={msg.aiResult.explanation.split('\n')[0]} />
                        </div>
                        {msg.aiResult.mnemonic && (
                          <div className="text-xs text-[#78350f] dark:text-[#FCD34D] bg-[#fffbeb] dark:bg-accent/10 border border-[rgba(245,158,11,0.15)] dark:border-accent/25 py-2 px-3 rounded-lg leading-[1.45] mt-1">
                            <strong>💡 Mẹo nhớ:</strong> {msg.aiResult.mnemonic}
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          <button
                            className="flex-1 py-2 px-3 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border border-black/[0.03] inline-flex items-center justify-center min-h-[38px] hover:-translate-y-[1.5px] hover:scale-[1.02] hover:shadow-[0_4px_8px_rgba(30,58,95,0.06)] active:translate-y-0 active:scale-100 bg-success/8 text-success"
                            onClick={() => onCreateFlashcard(msg.aiResult)}
                          >
                            Tạo Flashcard
                          </button>
                          <button
                            className={`flex-1 py-2 px-3 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border border-black/[0.03] inline-flex items-center justify-center min-h-[38px] hover:-translate-y-[1.5px] hover:scale-[1.02] hover:shadow-[0_4px_8px_rgba(30,58,95,0.06)] active:translate-y-0 active:scale-100 ${
                              bookmarkedIds.includes(msg.aiResult.id) ? "bg-error/8 text-error" : "bg-[rgba(30,58,95,0.05)] text-[#1E3A5F] dark:bg-[rgba(226,232,240,0.08)] dark:text-night-text"
                            }`}
                            onClick={() => handleBookmarkWithPopup(msg.aiResult.id, msg.aiResult.name)}
                          >
                            {bookmarkedIds.includes(msg.aiResult.id) ? "✓ Đã lưu" : "Lưu lại"}
                          </button>
                          <button
                            className="flex-1 py-2 px-3 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all duration-200 border border-black/[0.03] inline-flex items-center justify-center min-h-[38px] hover:-translate-y-[1.5px] hover:scale-[1.02] hover:shadow-[0_4px_8px_rgba(30,58,95,0.06)] active:translate-y-0 active:scale-100 bg-[#1E3A5F] text-white"
                            onClick={() => onViewDetail(msg.aiResult)}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isAnalyzing && !ocr && (
              <div className="self-start max-w-[92%] py-2.5 px-4 rounded-xl rounded-bl-[2px] border border-[#e2e8f0] dark:border-night-line shadow-[0_2px_8px_rgba(30,58,95,0.02)] bg-white dark:bg-night-card">
                <div className="flex items-center gap-3 text-[0.8rem] font-bold text-text-muted dark:text-night-muted">
                  {/* Chờ AI: Mimi nhìn lên "đang nghĩ" (ba chấm bay) thay cho ba chấm nhấp nháy — đỡ chán khi chờ 5–20 giây. */}
                  <MimiMascot width={72} expression="thinking" interactive={false} withSymbols={false} className="shrink-0 -my-1" />
                  <span>{typedBusyUntil
                    ? `AI đang bận. Tự thử lại sau ${Math.max(1, Math.ceil((typedBusyUntil - typedBusyNow) / 1000))} giây...`
                    : "AI đang phân tích..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* Free user AI query counter */}
          {!isPremium && !isGuest && (
            <div className={`flex items-center justify-between py-2 px-4 md:px-6 border-t border-line dark:border-night-line text-[0.75rem] font-medium ${
              aiQueriesLeft === 0 ? "text-[#B91C1C] dark:text-[#FCA5A5]"
                : aiQueriesLeft !== null && aiQueriesLeft <= 3 ? "text-[#92400E] dark:text-[#FCD34D] font-semibold"
                : "text-text-muted dark:text-night-muted"
            }`}>
              <span>
                {aiQueriesLeft === null
                  ? `Tối đa ${FREE_AI_LIMIT} lượt hỏi AI miễn phí mỗi ngày`
                  : aiQueriesLeft === 0
                    ? "Đã dùng hết lượt hỏi AI hôm nay"
                    : `Còn ${aiQueriesLeft}/${FREE_AI_LIMIT} lượt hỏi AI miễn phí hôm nay`
                }
              </span>
              <button
                onClick={() => setActiveTab("premium")}
                className="flex items-center gap-1 bg-navy-btn dark:bg-accent text-white border-none rounded-full py-1 px-2.5 text-[0.7rem] font-semibold cursor-pointer"
              >
                <Crown size={11} className="text-[#FBBF24] dark:text-white" />
                <span className="sm:hidden">Nâng cấp</span>
                <span className="hidden sm:inline">Không giới hạn với Premium</span>
              </button>
            </div>
          )}

          {/* Chat input — khóa với khách, vẫn hiển thị để khách biết tính năng tồn tại */}
          {isGuest ? (
            <div className="p-3 border-t border-[rgba(30,58,95,0.07)] dark:border-night-line bg-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div
                  aria-disabled="true"
                  className="glass-card-sm dark:bg-night-card dark:border-night-line flex-1 flex items-center gap-2 py-2.5 px-3 text-[0.85rem] text-[#94A3B8] cursor-not-allowed min-w-0"
                >
                  <Lock size={16} className="text-accent shrink-0" />
                  <span className="truncate">Ô hỏi AI đang khóa ở chế độ khách</span>
                </div>
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="shrink-0 bg-accent hover:bg-accent-hover text-white border-none rounded-[10px] py-2.5 px-4 text-[0.82rem] font-bold cursor-pointer transition-colors duration-200"
                >
                  Đăng nhập Google để hỏi AI
                </button>
              </div>
            </div>
          ) : ocr ? null : (
          <div className="p-3 md:p-4 border-t border-line dark:border-night-line bg-transparent">
            <div className="flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-[16px] bg-white dark:bg-night-card border border-line dark:border-night-line focus-within:border-accent transition-colors">
              {/* Nhập đề bằng ảnh — bật/tắt bằng cờ FINDER_IMAGE_INPUT_ENABLED (config/features.js) */}
              {FINDER_IMAGE_INPUT_ENABLED && (
                <button type="button" onClick={openScanSheet} disabled={isAnalyzing}
                  className="bg-transparent border-none text-[#64748B] dark:text-night-muted hover:text-accent cursor-pointer flex items-center justify-center py-2 pr-1 pl-1.5 disabled:opacity-50"
                  title="Gửi ảnh đề bài (chụp hoặc chọn ảnh)"
                  aria-label="Gửi ảnh đề bài"
                >
                  <Camera size={19} />
                </button>
              )}
              <textarea
                ref={textareaRef}
                className={`flex-1 border-none text-[0.9rem] font-medium text-primary dark:text-night-text bg-transparent dark:bg-transparent! py-2 ${FINDER_IMAGE_INPUT_ENABLED ? "px-2" : "pl-1 pr-2"} outline-none resize-none overflow-hidden leading-[1.5] font-[inherit] min-h-9 max-h-[120px] self-center placeholder:text-[#94A3B8]`}
                aria-label="Hỏi AI về công thức"
                placeholder={FINDER_IMAGE_INPUT_ENABLED ? "Nhập đề bài, chụp hoặc dán ảnh (Ctrl+V)..." : "Nhập đề bài..."}
                rows={1}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = '1px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                disabled={isAnalyzing}
              />
              <button
                type="button"
                aria-label="Gửi câu hỏi"
                className={`w-10 h-10 md:w-11 md:h-11 rounded-[12px] border-none flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                  query.trim() && (isPremium || aiQueriesLeft !== 0)
                    ? "bg-navy-btn text-white dark:bg-accent"
                    : "bg-[#EEF1F6] dark:bg-night-line text-text-muted"
                }`}
                disabled={isAnalyzing || !query.trim() || (!isPremium && aiQueriesLeft === 0)}
                onClick={() => handleSend(textareaRef.current?.value || "")}
                title="Gửi câu hỏi"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ─── Chọn nguồn ảnh đề (kèm thông báo quyền riêng tư) ─── */}
      {scanSheetOpen && <ImageScanSheet onPick={handlePickImage} onClose={() => setScanSheetOpen(false)} />}
      {dragActive && FINDER_IMAGE_INPUT_ENABLED && !isGuest && (
        <div className="fixed inset-0 z-[900] pointer-events-none flex items-center justify-center bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px]">
          <div className="rounded-[20px] border-2 border-dashed border-accent bg-white dark:bg-night-card px-8 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <ImageIcon size={32} className="mx-auto text-accent" />
            <div className="mt-2 text-[1rem] font-bold text-primary dark:text-night-text">Thả ảnh đề bài vào đây</div>
            <div className="mt-1 text-[0.78rem] text-text-muted dark:text-night-muted">AI sẽ đọc các bài trong ảnh, bạn chọn bài cần hướng dẫn</div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
