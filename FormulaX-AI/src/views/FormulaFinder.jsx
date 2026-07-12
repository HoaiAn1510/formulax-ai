import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, History, MessageSquare, Camera, X, Paperclip, FileText, AlertCircle, Plus, Trash2, Pencil, Check, BookOpen, BookMarked, Crown } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { useAuth } from "../context/AuthContext";
import { loadChatSessions, upsertChatSession, deleteChatSession as deleteChatSessionDB } from "../lib/supabase";

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
  "tiếp tuyến", "bán kính", "chu vi", "tổng", "hiệu", "tích", "thương"
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

const FREE_AI_LIMIT = 10;

function getAiUsage(googleId) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(`formulax_ai_${googleId}`);
    if (!raw) return { count: 0, date: today };
    const parsed = JSON.parse(raw);
    return parsed.date === today ? parsed : { count: 0, date: today };
  } catch { return { count: 0, date: today }; }
}

function saveAiUsage(googleId, count) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(`formulax_ai_${googleId}`, JSON.stringify({ count, date: today }));
}

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
  const sessionsKey = `formulax_chat_sessions_${user?.googleId || "guest"}`;

  const [aiQueriesLeft, setAiQueriesLeft] = useState(() => {
    if (!user?.googleId) return FREE_AI_LIMIT;
    const usage = getAiUsage(user.googleId);
    return Math.max(0, FREE_AI_LIMIT - usage.count);
  });

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const textareaRef = useRef(null);
  const handleSendRef = useRef(null);
  const shiftHeldRef = useRef(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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
  const fileInputRef = useRef(null);
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
        } else if (cloudSessions.length > 0) {
          // Cloud có data → dùng cloud (source of truth)
          setSessions(cloudSessions);
          saveSessionsToStorage(sessionsKey, cloudSessions);
        } else {
          // Cloud rỗng → upload local sessions lên (lần đầu sync)
          const localSessions = loadSessionsFromStorage(sessionsKey);
          if (localSessions.length > 0) {
            localSessions.forEach(s => upsertChatSession(user.googleId, s));
            setSessions(localSessions);
          }
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
        upsertChatSession(user.googleId, { id: sesId, name: existing?.name || "", messages, updatedAt });
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
      if (user?.googleId) upsertChatSession(user.googleId, newSession);
    }
  }, [messages, sessionsKey]);

  const findRelatedFormulas = (formulaId, targetFormula) => {
    if (!targetFormula) return [];
    return formulas
      .filter(f => f.id !== formulaId && (f.topic === targetFormula.topic || f.grade === targetFormula.grade))
      .slice(0, 2);
  };

  const callAI = async (userMessage, messageHistory) => {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history: messageHistory })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  };

  const handleSend = async (textToSend) => {
    if (!textToSend.trim() || isAnalyzing) return;

    // Check daily AI limit for free users
    if (!isPremium) {
      const usage = getAiUsage(user?.googleId || "guest");
      if (usage.count >= FREE_AI_LIMIT) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: "bot",
          text: `Bạn đã dùng hết ${FREE_AI_LIMIT} lượt hỏi AI miễn phí hôm nay. Nâng cấp Premium để hỏi không giới hạn!`,
          isLimitHit: true,
        }]);
        return;
      }
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

    if (!isMathRelated(textToSend)) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: "Mình chỉ hỗ trợ các câu hỏi liên quan đến toán học THPT thôi nhé! Bạn thử hỏi về công thức, bài toán, hoặc giải phương trình xem."
      }]);
      return;
    }

    // Deduct from free quota
    if (!isPremium && user?.googleId) {
      const usage = getAiUsage(user.googleId);
      const newCount = usage.count + 1;
      saveAiUsage(user.googleId, newCount);
      setAiQueriesLeft(Math.max(0, FREE_AI_LIMIT - newCount));
    }

    setIsAnalyzing(true);
    try {
      const historyForAPI = updatedMessages
        .filter(m => !m.isImage && !m.isFile)
        .slice(-6)
        .map(m => ({ sender: m.sender, text: m.text }));
      const { reply, formulaId } = await callAI(textToSend, historyForAPI.slice(0, -1));
      const matchedFormula = formulaId ? formulas.find(f => f.id === formulaId) : null;
      const relatedFormulas = matchedFormula ? findRelatedFormulas(formulaId, matchedFormula) : [];
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: reply,
        aiResult: matchedFormula || null,
        related: relatedFormulas
      }]);
    } catch (error) {
      const isConn = error.message.includes("fetch") || error.message.includes("Failed");
      const errorMsg = isConn
        ? "Không thể kết nối tới backend. Hãy chắc chắn server đang chạy tại localhost:3001."
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
      if (session) upsertChatSession(user.googleId, { ...session, name: newName });
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

  // ─── Camera / File ────────────────────────────────────────────────────────

  const handleCapturePhoto = () => {
    setCameraOpen(false);
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: "Ảnh chụp đề bài từ Camera AI", isImage: true }]);
    handleSend("Phân tích đề bài hình học: Cho mặt cầu bán kính R = 3cm. Tính thể tích V của khối cầu đó.");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: "user", text: "Đã gửi tệp đính kèm", isFile: true, fileName: file.name }]);
    handleSend(`Phân tích tài liệu đính kèm: ${file.name}.`);
  };

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

  return (
    <div className="view-container !p-[10px] h-[calc(100vh-124px)] flex flex-col bg-page-gradient dark:bg-[#0F172A]">

      {/* Top action row */}
      <div className="flex justify-between items-center mb-2">
        <button className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.8rem] font-bold inline-flex items-center gap-1 cursor-pointer transition duration-200 hover:text-primary dark:hover:text-[#E2E8F0] mb-0" onClick={() => setActiveTab("dashboard")}>
          <ArrowLeft size={12} />
          <span>Về trang chủ</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            className="md:hidden relative inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-full px-3 py-2 text-[0.75rem] font-bold text-primary cursor-pointer transition duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5e1] mb-0"
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

          {sessions.length === 0 ? (
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
                    <button onClick={confirmRename} className="bg-success border-none rounded-md py-1 px-1.5 cursor-pointer text-white flex items-center">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="bg-[#F1F5F9] border-none rounded-md py-1 px-1.5 cursor-pointer text-text-muted flex items-center">
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
                      <button
                        onClick={() => { setRenamingId(session.id); setRenameValue(session.name); }}
                        title="Đổi tên"
                        className="bg-transparent border-none cursor-pointer p-1.5 text-[#94A3B8] rounded-md flex items-center"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
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
            {messages.length === 0 ? (
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
                  : msg.isLimitHit
                    ? "bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-[#92400E]"
                    : (msg.isImage || msg.isFile)
                      ? "p-2 bg-white border border-[#E2E8F0] text-[#1E3A5F]"
                      : isUser
                        ? "bg-accent text-white"
                        : "bg-white text-primary dark:text-[#E2E8F0]";
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] ${!isUser ? "md:max-w-[92%]" : ""} py-3 px-4 rounded-xl text-[0.85rem] leading-[1.5] break-words ${
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
                        <div className="relative w-[180px] h-[100px] bg-[linear-gradient(135deg,#F8FAFC_0%,#E2E8F0_100%)] rounded-lg border-[1.5px] border-[#CBD5E1] flex flex-col items-center justify-center text-[0.8rem] text-[#475569] font-bold">
                          <div className="text-[0.85rem] text-[#1E3A5F] font-mono z-[1]">R = 3cm | V = ?</div>
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

                    {!msg.isImage && !msg.isFile && !msg.isError && !msg.isLimitHit && (
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

                    {/* Formula card */}
                    {msg.sender === "bot" && msg.aiResult && (
                      <div className="finder-ai-card mt-3.5 bg-white dark:bg-[#1E293B] border-[1.5px] border-[#e2e8f0] dark:border-[#334155] border-l-4 border-l-accent rounded-xl p-4 flex flex-col gap-3 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                        <div className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0] flex items-center gap-1.5 before:content-['✨'] before:text-[0.95rem]">{msg.aiResult.name}</div>
                        <div className="bg-[#f8fafc] border border-secondary/15 rounded-lg p-4 flex items-center justify-center my-1 shadow-[inset_0_2px_4px_rgba(30,58,95,0.01)] !text-[#1E3A5F]">
                          <MathElement math={msg.aiResult.latex} block={true} />
                        </div>
                        <div className="text-xs text-[#334155] dark:text-[#CBD5E1]">
                          <strong>Ý nghĩa:</strong>
                          <RichTextRenderer text={msg.aiResult.explanation.split('\n')[0]} />
                        </div>
                        {msg.aiResult.mnemonic && (
                          <div className="text-xs text-[#78350f] bg-[#fffbeb] border border-[rgba(245,158,11,0.15)] py-2 px-3 rounded-lg leading-[1.45] mt-1">
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

            {isAnalyzing && (
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
          {!isPremium && (
            <div className={`flex items-center justify-between py-1.5 px-3 border-t border-[rgba(30,58,95,0.07)] dark:border-[#334155] text-[0.72rem] font-semibold ${
              aiQueriesLeft === 0 ? "bg-[rgba(239,68,68,0.04)] text-[#DC2626]" : "bg-[rgba(245,158,11,0.04)] text-[#92400E]"
            }`}>
              <span>
                {aiQueriesLeft === 0
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

          {/* Chat input */}
          <div className="p-3 border-t border-[rgba(30,58,95,0.07)] dark:border-[#334155] bg-transparent">
            <div className="glass-card-sm flex items-center gap-2 py-1.5 px-3">
              <button type="button" onClick={() => setCameraOpen(true)}
                className="bg-transparent border-none text-[#94A3B8] cursor-pointer flex items-center justify-center py-2 pr-1 pl-2"
                title="Quét đề bài bằng Camera AI"
              >
                <Camera size={18} />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="bg-transparent border-none text-[#94A3B8] cursor-pointer flex items-center justify-center py-2 pr-2 pl-1"
                title="Tải đề bài lên từ máy tính"
              >
                <Paperclip size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.txt,.docx" />
              <textarea
                ref={textareaRef}
                className="flex-1 border-none text-[0.9rem] font-medium text-primary dark:text-[#E2E8F0] bg-transparent py-2 px-2 outline-none resize-none overflow-hidden leading-[1.5] font-[inherit] min-h-9 max-h-[120px] self-center placeholder:text-[#94A3B8]"
                placeholder="Hỏi AI về bất kỳ công thức toán nào..."
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
                  query.trim() && (isPremium || aiQueriesLeft > 0)
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
            <button onClick={() => setSavedPopup(null)} className="ml-auto bg-transparent border-none cursor-pointer text-[#94A3B8] flex items-center">
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

      {/* ─── Camera Modal ─── */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.75)] backdrop-blur-[4px] z-[1000] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative flex flex-col gap-4">
            <button onClick={() => setCameraOpen(false)} className="absolute top-4 right-4 bg-[#F1F5F9] border-none w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-[#1E3A5F]">
              <X size={16} />
            </button>
            <div className="text-center mt-2">
              <h3 className="text-[1.1rem] font-extrabold text-[#1E3A5F] m-0">Chụp ảnh đề bài bằng Camera AI</h3>
              <p className="text-xs text-text-muted mt-1 mb-0">Đặt công thức/đề bài vào khung quét bên dưới</p>
            </div>
            <div className="relative w-full h-[220px] bg-[#0F172A] rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-success shadow-[0_0_8px_#10B981] animate-[float_3s_infinite_ease-in-out]" />
              <div className="absolute w-4/5 h-1/2 border-2 border-dashed border-premium rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.4)] z-[2] flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-[3px] border-l-[3px] border-premium" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-[3px] border-r-[3px] border-premium" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-[3px] border-l-[3px] border-premium" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-[3px] border-r-[3px] border-premium" />
              </div>
              <div className="text-[#E2E8F0] text-[0.9rem] font-mono text-center leading-[1.6] p-5 z-[1]">
                <div className="text-[0.8rem] text-[#94A3B8]">[ Đề bài mẫu ]</div>
                <strong>Cho mặt cầu bán kính R = 3cm.</strong><br />
                <strong>Tính thể tích V của khối cầu đó.</strong>
              </div>
              <span className="absolute bottom-3 bg-black/60 text-success text-[0.65rem] py-1 px-2 rounded font-bold tracking-[0.5px]">ĐANG TỰ ĐỘNG LẤY NÉT</span>
            </div>
            <div className="flex flex-col items-center gap-2 mt-1">
              <button
                onClick={handleCapturePhoto}
                className="w-14 h-14 rounded-full bg-white border-4 border-accent p-1 cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(217,119,6,0.3)]"
                title="Chụp ngay"
              >
                <div className="w-full h-full rounded-full bg-accent" />
              </button>
              <span className="text-xs text-text-muted font-bold">Nhấn nút để quét công thức</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
