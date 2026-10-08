import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, History, MessageSquare, Camera, X, FileText, AlertCircle, Plus, Trash2, Pencil, Check, BookOpen, BookMarked, Crown, Lock } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { useAuth } from "../context/AuthContext";
import { FINDER_IMAGE_INPUT_ENABLED } from "../config/features";
import { loadChatSessions, upsertChatSession, deleteChatSession as deleteChatSessionDB, getAccessToken } from "../lib/supabase";
import { useGuestGate } from "../utils/useGuestGate";
import StepAnswer from "../components/StepAnswer";
import ImageScanSheet from "../components/ImageScanSheet";
import ImageProblemsPanel from "../components/ImageProblemsPanel";
import ProblemTabs from "../components/ProblemTabs";
import { compressImageFile } from "../utils/imageCompress";
import { problemToFinderMessage, nextGuidanceRequest } from "../utils/ocrProblems";

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

  useEffect(() => {
    if (isGuest || !user?.googleId || isPremium) return;
    let alive = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`${BACKEND_URL}/api/chat/usage`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
  const [apiError, setApiError] = useState(null);

  // Session management
  const [sessions, setSessions] = useState(() => loadSessionsFromStorage(sessionsKey));
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const sessionIdRef = useRef(null);
  const sessionsRef = useRef(sessions);

  // Saved formula popup
  const [savedPopup, setSavedPopup] = useState(null);

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
      const autoName = firstUserMsg.text.length > 45
        ? firstUserMsg.text.slice(0, 45) + "..."
        : firstUserMsg.text;
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

  const callAI = async (userMessage, messageHistory) => {
    // Timeout chủ động — không có dòng này, backend treo/mạng rớt sẽ khiến fetch không bao
    // giờ resolve/reject, isAnalyzing kẹt true mãi mãi và nút gửi tin nhắn "chết" vĩnh viễn
    // cho tới khi tải lại trang.
    // 45 giây PHẢI lớn hơn ngân sách 40 giây/request của backend (CHAT_BUDGET_MS trong
    // backend/lib/finderAnswer.js). Nếu frontend bỏ cuộc trước, backend vẫn giao câu trả lời và
    // không hoàn lượt — học sinh mất lượt mà không thấy gì.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    // Backend bắt buộc token để biết ai đang hỏi (đếm hạn mức, kiểm tra Premium, chặn khách).
    const token = await getAccessToken();
    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage, history: messageHistory }),
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
      throw err;
    }
    const data = await response.json();
    return data;
  };

  const pushLimitHitMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text, isLimitHit: true }]);
  };

  const handleSend = async (textToSend) => {
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
    const updatedMessages = [...messages, userMsg];
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
    const hasAiAnswer = messages.some(m => m.sender === "bot" && (m.answer || m.aiResult));
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
    try {
      // Tin hệ thống (lỗi, hết lượt, "AI đang bận") vẫn lưu trong phiên để hiển thị lại nhưng
      // KHÔNG gửi lên AI làm lịch sử — chúng không phải lời AI nói, gửi lên chỉ gây nhiễu.
      const historyForAPI = updatedMessages
        .filter(m => !m.isImage && !m.isFile && !m.isError && !m.isLimitHit && !m.isNotice)
        .slice(-6)
        .map(m => ({ sender: m.sender, text: m.text }));
      const data = await callAI(textToSend, historyForAPI.slice(0, -1));
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
      if (typeof error.remaining === "number") setAiQueriesLeft(error.remaining);
      if (error.code === "quota_exceeded" || (error.status === 429 && error.remaining === 0)) {
        setAiQueriesLeft(0);
        pushLimitHitMessage(error.message);
        return;
      }
      if (error.code === "ai_busy") {
        // Không phải lỗi của học sinh và đã được hoàn lượt — báo nhẹ nhàng, không gắn "Lỗi AI".
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: error.message, isNotice: true }]);
        return;
      }
      const isConn = error.message.includes("fetch") || error.message.includes("Failed");
      const errorMsg = isConn
        ? "Không kết nối được tới máy chủ AI. Bạn kiểm tra mạng rồi thử lại nhé."
        : `Lỗi AI: ${error.message}`;
      setApiError(errorMsg);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: errorMsg, isError: true }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Session handlers ─────────────────────────────────────────────────────

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setApiError(null);
    setSidebarOpen(false);
    setDeletingId(null);
    setRenamingId(null);
  };

  const loadSession = (session) => {
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

  // ─── Bookmark với popup ───────────────────────────────────────────────────

  const handleBookmarkWithPopup = (formulaId, formulaName) => {
    const alreadySaved = bookmarkedIds.includes(formulaId);
    onToggleBookmark(formulaId);
    if (!alreadySaved) {
      setSavedPopup({ formulaName });
    }
  };

  // ─── Ảnh đề: chụp/chọn → Gemini đọc → chọn bài → hướng dẫn từng bài ───────

  // 45 giây PHẢI lớn hơn ngân sách 40 giây/request của backend (OCR_BUDGET_MS trong
  // backend/lib/ocrReader.js), nếu không học sinh bị tính lượt quét mà không thấy kết quả.
  const callOcr = async (base64) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    const token = await getAccessToken();
    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
      const data = await callAI(message, []);
      if (typeof data.remaining === "number") setAiQueriesLeft(data.remaining);
      const answer = {
        type: data.type,
        formulaIds: Array.isArray(data.formulaIds) ? data.formulaIds : [],
        intro: data.intro || "",
        steps: Array.isArray(data.steps) ? data.steps : [],
        reminder: data.reminder || "",
      };
      setGuideResult(item.key, { status: "done", answer });
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
    const key = nextGuidanceRequest({ activeKey: guideActiveKey, results: guideResults, inFlightKey });
    const item = key && guideItems.find(p => p.key === key);
    if (item) runGuidance(item);
    // runGuidance là hàm tạo lại mỗi lần render — chỉ cần chạy lại khi tab/kết quả/bài đang chờ đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideActiveKey, guideResults, guideItems, inFlightKey]);

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
          <div className="flex items-center gap-2 text-[0.85rem] font-bold text-text-muted dark:text-[#94A3B8]">
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite]" />
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.4s]" />
            <span>Đang đọc đề trong ảnh...</span>
          </div>
          <span className="text-[0.75rem] text-text-muted dark:text-[#94A3B8]">Thường mất khoảng 5–10 giây.</span>
        </div>
      );
    }
    if (ocr.stage === "error") {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4 max-w-[420px] mx-auto">
          <AlertCircle size={26} className="text-error" />
          <p className="text-[0.88rem] text-primary dark:text-[#E2E8F0] m-0">{ocr.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={openScanSheet} className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
              <Camera size={14} /> Thử lại
            </button>
            <button type="button" onClick={closeOcr} className="bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#E2E8F0] border-none rounded-[10px] py-2 px-4 text-[0.82rem] font-bold cursor-pointer">
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
        onSelect={(key) => setOcr(prev => ({ ...prev, activeKey: key }))}
        onRetry={(key) => setGuideResult(key, null)}
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
    <div className="view-container !p-[10px] h-[calc(100vh-124px)] max-md:contain-size flex flex-col bg-page-gradient dark:bg-[#0F172A]">

      {/* Top action row */}
      <div className="flex justify-between items-center mb-2">
        <button className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.8rem] font-bold inline-flex items-center gap-1 cursor-pointer transition duration-200 hover:text-primary dark:hover:text-[#E2E8F0] mb-0" onClick={() => setActiveTab("dashboard")}>
          <ArrowLeft size={12} />
          <span>Về trang chủ</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            className="md:hidden relative inline-flex items-center gap-1.5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-3 py-2 text-[0.75rem] font-bold text-primary dark:text-[#E2E8F0] cursor-pointer transition duration-200 hover:bg-[#f8fafc] dark:hover:bg-[#334155] hover:border-[#cbd5e1] mb-0"
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
        {/* ─── Session Sidebar ─── */}
        <div className={`glass-card dark:bg-[#1E293B] ${sidebarOpen ? "flex" : "hidden"} md:flex flex-col gap-2 fixed md:relative top-[68px] md:top-auto left-0 md:left-auto right-0 md:right-auto bottom-14 md:bottom-auto z-[300] md:z-auto w-full md:w-[250px] md:shrink-0 p-4 overflow-y-auto`}>

          {/* New chat button */}
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 py-2.5 px-3 mb-3 bg-primary text-white border-none rounded-[10px] cursor-pointer text-[0.8rem] font-bold"
          >
            <Plus size={14} />
            Chat mới
          </button>

          <div className="text-[0.85rem] max-md:text-[0.8rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-2">Cuộc trò chuyện đã lưu</div>

          {isGuest ? (
            <div className="flex flex-col items-center text-center gap-2 py-4 px-2">
              <Lock size={18} className="text-accent" />
              <div className="text-[0.75rem] text-text-muted dark:text-[#94A3B8] leading-[1.5]">
                Đăng nhập Google để lưu và xem lại lịch sử trò chuyện.
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-[0.75rem] text-[#999] py-2.5 text-center">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`mb-1.5 rounded-[10px] overflow-hidden border-[1.5px] ${
                  currentSessionId === session.id ? "border-accent bg-accent/5" : "border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
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
                    <button aria-label="Huỷ đổi tên" onClick={() => setRenamingId(null)} className="bg-[#F1F5F9] border-none rounded-md py-1 px-1.5 cursor-pointer text-text-muted flex items-center">
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
                        className="flex-1 py-1.5 bg-[#F1F5F9] text-text-muted border-none rounded-md cursor-pointer text-[0.75rem] font-bold"
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
                      <div className="text-[0.78rem] font-semibold text-[#1E3A5F] dark:text-[#E2E8F0] whitespace-nowrap overflow-hidden text-ellipsis">
                        {session.name}
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
        <div className="glass-card dark:bg-[#0F172A] flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 py-5 px-4 overflow-y-auto flex flex-col gap-4 bg-transparent dark:bg-[#0F172A]" ref={chatMessagesRef}>
            {isGuest ? (
              <div className="flex flex-col gap-4 w-full max-w-[640px] mx-auto">
                <div className="flex flex-col items-center text-center gap-2 pt-2">
                  <div className="w-14 h-14 rounded-full bg-accent-light dark:bg-accent/15 text-accent flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-[1.2rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0] m-0">
                    Hỏi AI cần đăng nhập Google
                  </h2>
                  <p className="text-[0.82rem] text-text-muted dark:text-[#94A3B8] m-0 max-w-[420px] leading-[1.5]">
                    Tài khoản Google miễn phí được hỏi {FREE_AI_LIMIT} lượt mỗi ngày. Dưới đây là ví dụ cách FormulaX AI trả lời.
                  </p>
                </div>

                {guestExamples.map(({ formula, answer }) => {
                  // Chỉ lấy dòng đầu (đề bài) — phần còn lại của `example` là lời giải có đáp số.
                  const question = formula.example.split("\n")[0].trim();
                  return (
                    <div key={formula.id} className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#334155] p-3.5">
                      <span className="self-start text-[0.68rem] font-extrabold uppercase tracking-[0.5px] text-accent bg-accent-light dark:bg-accent/15 py-0.5 px-2 rounded-md">
                        Ví dụ
                      </span>
                      <div className="self-end max-w-[85%] py-2.5 px-3.5 rounded-xl rounded-br-[2px] bg-accent text-white text-[0.85rem] leading-[1.5]">
                        <RichTextRenderer text={question} />
                      </div>
                      <div className="self-start w-full min-w-0 md:max-w-[92%] py-3 px-4 rounded-xl rounded-bl-[2px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-primary dark:text-[#E2E8F0]">
                        <StepAnswer answer={answer} formulas={formulas} onViewDetail={onViewDetail} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : ocr ? (
              renderOcrPanel()
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 md:py-12 max-w-[500px] mx-auto gap-4">
                <div className="w-[68px] h-[68px] rounded-full bg-secondary/8 text-secondary flex items-center justify-center">
                  <MessageSquare size={32} fill="rgba(59,130,246,0.1)" />
                </div>
                <h2 className="text-[1.35rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0]">
                  Xin chào! Mình là FormulaX AI
                </h2>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === "user";
                const bubbleStateClass = msg.isError
                  ? "bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] text-[#b91c1c]"
                  : msg.isLimitHit || msg.isNotice
                    // `!` ở dark: để thắng dark:bg/border chung của bong bóng bot bên dưới — không có
                    // thì ở dark mode thông báo trông y như bong bóng thường.
                    ? "bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-[#92400E] dark:text-[#FCD34D] dark:!bg-[rgba(245,158,11,0.1)] dark:!border-[rgba(245,158,11,0.35)]"
                    : (msg.isImage || msg.isFile)
                      ? "p-2 bg-white border border-[#E2E8F0] text-[#1E3A5F]"
                      : isUser
                        ? "bg-accent text-white"
                        : "bg-white text-primary dark:text-[#E2E8F0]";
                return (
                  <div
                    key={msg.id}
                    className={`${msg.answer ? "w-full max-w-full" : "max-w-[85%]"} ${!isUser ? "md:max-w-[92%]" : ""} min-w-0 py-3 px-4 rounded-xl text-[0.85rem] leading-[1.5] break-words ${
                      isUser
                        ? "self-end rounded-br-[2px] shadow-[0_4px_10px_rgba(217,119,6,0.15)]"
                        : "self-start rounded-bl-[2px] border border-[#e2e8f0] dark:border-[#334155] shadow-[0_2px_8px_rgba(30,58,95,0.02)] dark:bg-[#1E293B]"
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
                        <div className="relative w-[180px] h-[100px] bg-[linear-gradient(135deg,#F8FAFC_0%,#E2E8F0_100%)] dark:bg-[linear-gradient(135deg,#1E293B_0%,#0F172A_100%)] rounded-lg border-[1.5px] border-[#CBD5E1] dark:border-[#334155] flex flex-col items-center justify-center text-[0.8rem] text-[#475569] dark:text-[#94A3B8] font-bold">
                          <div className="text-[0.85rem] text-[#1E3A5F] dark:text-[#E2E8F0] font-mono z-[1]">R = 3cm | V = ?</div>
                          <span className="absolute bottom-1.5 right-1.5 bg-success text-white text-[0.6rem] py-0.5 px-1.5 rounded z-[1] font-extrabold">CAPTURE OCR</span>
                        </div>
                        <div className="text-xs text-text-muted font-semibold pl-1">Ảnh chụp đề bài từ Camera AI</div>
                      </div>
                    )}

                    {msg.isFile && (
                      <div className="flex items-center gap-2.5 py-1.5 px-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <div className="p-2 bg-secondary/8 text-secondary rounded-md flex items-center justify-center">
                          <FileText size={18} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[0.8rem] font-bold text-[#1E3A5F] text-ellipsis overflow-hidden whitespace-nowrap max-w-[160px]">{msg.fileName}</span>
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

                    {/* Thông báo (vd "AI đang bận") — chữ thường, không qua .chat-bot-text vì CSS dark
                        mode của lớp đó ghi đè màu amber. Cờ isNotice được lưu cùng phiên nên mở lại
                        phiên cũ vẫn hiện đúng kiểu thông báo. */}
                    {msg.isNotice && (
                      <span className="text-[0.88rem]">{msg.text}</span>
                    )}

                    {!msg.answer && !msg.isImage && !msg.isFile && !msg.isError && !msg.isLimitHit && !msg.isNotice && (
                      <div className="chat-bot-text leading-[1.65] text-[0.88rem]">
                        {msg.sender === "bot"
                          ? <RichTextRenderer text={msg.text || ""} />
                          : <span className="whitespace-pre-wrap">{msg.text}</span>
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
                      <div className="finder-ai-card mt-3.5 bg-white dark:bg-[#1E293B] border-[1.5px] border-[#e2e8f0] dark:border-[#334155] border-l-4 border-l-accent rounded-xl p-4 flex flex-col gap-3 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                        <div className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0] flex items-center gap-1.5 before:content-['✨'] before:text-[0.95rem]">{msg.aiResult.name}</div>
                        <div className="bg-[#f8fafc] dark:bg-[#0F172A]/60 border border-secondary/15 dark:border-[#334155] rounded-lg p-4 flex items-center justify-center my-1 shadow-[inset_0_2px_4px_rgba(30,58,95,0.01)] !text-[#1E3A5F] dark:!text-[#E2E8F0]">
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
                              bookmarkedIds.includes(msg.aiResult.id) ? "bg-error/8 text-error" : "bg-[rgba(30,58,95,0.05)] text-[#1E3A5F] dark:bg-[rgba(226,232,240,0.08)] dark:text-[#E2E8F0]"
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
              <div className="self-start max-w-[92%] py-3 px-4 rounded-xl rounded-bl-[2px] border border-[#e2e8f0] dark:border-[#334155] shadow-[0_2px_8px_rgba(30,58,95,0.02)] bg-white dark:bg-[#1E293B]">
                <div className="flex items-center gap-2 text-[0.8rem] font-bold text-text-muted dark:text-[#94A3B8]">
                  <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite]" />
                  <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-accent animate-[pulse-bubble_1.4s_ease-in-out_infinite] [animation-delay:0.4s]" />
                  <span>AI đang phân tích...</span>
                </div>
              </div>
            )}
          </div>

          {/* Free user AI query counter */}
          {!isPremium && !isGuest && (
            <div className={`flex items-center justify-between py-1.5 px-3 border-t border-[rgba(30,58,95,0.07)] dark:border-[#334155] text-[0.72rem] font-semibold ${
              aiQueriesLeft === 0 ? "bg-[rgba(239,68,68,0.04)] text-[#DC2626]" : "bg-[rgba(245,158,11,0.04)] text-[#92400E]"
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
                className="flex items-center gap-1 bg-premium text-[#1E3A5F] border-none rounded-md py-[3px] px-2 text-[0.68rem] font-extrabold cursor-pointer"
              >
                <Crown size={10} fill="#1E3A5F" color="#1E3A5F" />
                Nâng cấp
              </button>
            </div>
          )}

          {/* Chat input — khóa với khách, vẫn hiển thị để khách biết tính năng tồn tại */}
          {isGuest ? (
            <div className="p-3 border-t border-[rgba(30,58,95,0.07)] dark:border-[#334155] bg-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div
                  aria-disabled="true"
                  className="glass-card-sm dark:bg-[#1E293B] dark:border-[#334155] flex-1 flex items-center gap-2 py-2.5 px-3 text-[0.85rem] text-[#94A3B8] cursor-not-allowed min-w-0"
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
          <div className="p-3 border-t border-[rgba(30,58,95,0.07)] dark:border-[#334155] bg-transparent">
            <div className="glass-card-sm dark:bg-[#1E293B] dark:border-[#334155] flex items-center gap-2 py-1.5 px-3">
              {/* Nhập đề bằng ảnh — bật/tắt bằng cờ FINDER_IMAGE_INPUT_ENABLED (config/features.js) */}
              {FINDER_IMAGE_INPUT_ENABLED && (
                <button type="button" onClick={openScanSheet} disabled={isAnalyzing}
                  className="bg-transparent border-none text-[#64748B] dark:text-[#94A3B8] hover:text-accent cursor-pointer flex items-center justify-center py-2 pr-1 pl-1.5 disabled:opacity-50"
                  title="Gửi ảnh đề bài (chụp hoặc chọn ảnh)"
                  aria-label="Gửi ảnh đề bài"
                >
                  <Camera size={19} />
                </button>
              )}
              <textarea
                ref={textareaRef}
                className={`flex-1 border-none text-[0.9rem] font-medium text-primary dark:text-[#E2E8F0] bg-transparent dark:bg-transparent! py-2 ${FINDER_IMAGE_INPUT_ENABLED ? "px-2" : "pl-1 pr-2"} outline-none resize-none overflow-hidden leading-[1.5] font-[inherit] min-h-9 max-h-[120px] self-center placeholder:text-[#94A3B8]`}
                aria-label="Hỏi AI về công thức"
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
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition duration-200 shrink-0 ${
                  query.trim() && (isPremium || aiQueriesLeft !== 0)
                    ? "bg-accent text-white"
                    : "bg-[#f1f5f9] text-text-muted"
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

      {/* ─── Saved formula popup ─── */}
      {savedPopup && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[2000] bg-white border border-[#E2E8F0] rounded-2xl py-4 px-5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] min-w-[280px] max-w-[340px] flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <BookMarked size={14} color="#10B981" />
            </div>
            <div>
              <div className="text-[0.82rem] font-bold text-[#1E3A5F]">Đã lưu vào thư viện!</div>
              <div className="text-[0.75rem] text-text-muted mt-0.5">
                "{savedPopup.formulaName.length > 35 ? savedPopup.formulaName.slice(0, 35) + "..." : savedPopup.formulaName}"
              </div>
            </div>
            <button aria-label="Đóng thông báo" onClick={() => setSavedPopup(null)} className="ml-auto bg-transparent border-none cursor-pointer text-[#94A3B8] flex items-center">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("library"); setSavedPopup(null); }}
              className="flex-1 py-2.5 bg-primary text-white border-none rounded-[9px] cursor-pointer text-[0.78rem] font-bold flex items-center justify-center gap-1.5"
            >
              <BookOpen size={13} />
              Xem thư viện
            </button>
            <button
              onClick={() => setSavedPopup(null)}
              className="flex-1 py-2.5 bg-[#F1F5F9] text-text-muted border-none rounded-[9px] cursor-pointer text-[0.78rem] font-bold"
            >
              Tiếp tục chat
            </button>
          </div>
        </div>
      )}

      {/* ─── Chọn nguồn ảnh đề (kèm thông báo quyền riêng tư) ─── */}
      {scanSheetOpen && <ImageScanSheet onPick={handlePickImage} onClose={() => setScanSheetOpen(false)} />}
    </div>
  );
}
