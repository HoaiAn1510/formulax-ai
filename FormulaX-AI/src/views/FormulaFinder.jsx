import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, History, Search, MessageSquare, Camera, X, Paperclip, FileText, AlertCircle, Plus, Trash2, Pencil, Check, BookOpen, BookMarked } from "lucide-react";
import { MathElement, RichTextRenderer } from "../utils/katexHelper";
import { useAuth } from "../context/AuthContext";
import { loadChatSessions, upsertChatSession, deleteChatSession as deleteChatSessionDB } from "../lib/supabase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function loadSessionsFromStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveSessionsToStorage(key, sessions) {
  localStorage.setItem(key, JSON.stringify(sessions));
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
}) {
  const { user } = useAuth();
  const sessionsKey = `formulax_chat_sessions_${user?.googleId || "guest"}`;

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

  const suggestionsList = [
    { text: "Tính diện tích hình tròn bán kính 5cm", query: "hình tròn bán kính 5cm" },
    { text: "Giải phương trình bậc 2: x²-5x+6=0", query: "phương trình bậc 2 x^2-5x+6=0" },
    { text: "Tính đạo hàm y = x³ - 2x² + 5", query: "đạo hàm y = x^3 - 2x^2 + 5" },
    { text: "Tìm cực trị hàm số y = x³ - 3x", query: "cực trị y = x^3 - 3x" }
  ];

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
    <div className="view-container" style={{ padding: "10px", height: "calc(100vh - 124px)", display: "flex", flexDirection: "column" }}>

      {/* Top action row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <button className="breadcrumb-back" onClick={() => setActiveTab("dashboard")} style={{ marginBottom: 0 }}>
          <ArrowLeft size={12} />
          <span>Về trang chủ</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "4px 10px", borderRadius: "20px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            fontSize: "0.7rem", fontWeight: "700", color: "#059669"
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }}></div>
            Gemini 2.0 Flash (Google)
          </div>

          <button className="chat-history-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginBottom: 0 }}>
            <History size={14} />
            <span style={{ position: "relative" }}>
              Lịch sử chat
              {sessions.length > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-12px", background: "#3B82F6", color: "white", borderRadius: "50%", width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>
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
          style={{ position: "fixed", inset: 0, zIndex: 299, background: "rgba(0,0,0,0.3)" }}
        />
      )}

      <div className="chat-layout">
        {/* ─── Session Sidebar ─── */}
        <div className={`history-sidebar ${sidebarOpen ? "open" : ""}`}>

          {/* New chat button */}
          <button
            onClick={startNewChat}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 12px", marginBottom: "12px",
              background: "#1E3A5F", color: "white",
              border: "none", borderRadius: "10px", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: "700"
            }}
          >
            <Plus size={14} />
            Chat mới
          </button>

          <div className="sidebar-title" style={{ marginBottom: "8px" }}>Cuộc trò chuyện đã lưu</div>

          {sessions.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "#999", padding: "10px 0", textAlign: "center" }}>
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  marginBottom: "6px",
                  borderRadius: "10px",
                  border: currentSessionId === session.id
                    ? "1.5px solid #3B82F6"
                    : "1.5px solid #E2E8F0",
                  backgroundColor: currentSessionId === session.id ? "rgba(59,130,246,0.05)" : "white",
                  overflow: "hidden"
                }}
              >
                {/* Rename mode */}
                {renamingId === session.id ? (
                  <div style={{ padding: "8px 10px", display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") confirmRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      style={{
                        flex: 1, border: "1.5px solid #3B82F6", borderRadius: "6px",
                        padding: "4px 8px", fontSize: "0.78rem", outline: "none"
                      }}
                    />
                    <button onClick={confirmRename} style={{ background: "#10B981", border: "none", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
                      <Check size={12} />
                    </button>
                    <button onClick={() => setRenamingId(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center" }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : deletingId === session.id ? (
                  /* Delete confirm mode */
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: "700", marginBottom: "6px" }}>
                      Xóa cuộc trò chuyện này?
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => deleteSession(session.id)}
                        style={{ flex: 1, padding: "5px", background: "#EF4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                      >
                        Xóa
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{ flex: 1, padding: "5px", background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal mode */
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => loadSession(session)}
                      style={{
                        flex: 1, textAlign: "left", padding: "9px 10px",
                        background: "none", border: "none", cursor: "pointer",
                        minWidth: 0
                      }}
                    >
                      <div style={{
                        fontSize: "0.78rem", fontWeight: "600", color: "#1E3A5F",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {session.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "2px" }}>
                        {formatDate(session.updatedAt)}
                      </div>
                    </button>

                    <div style={{ display: "flex", gap: "2px", paddingRight: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => { setRenamingId(session.id); setRenameValue(session.name); }}
                        title="Đổi tên"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", color: "#94A3B8", borderRadius: "5px", display: "flex", alignItems: "center" }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeletingId(session.id)}
                        title="Xóa"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", color: "#94A3B8", borderRadius: "5px", display: "flex", alignItems: "center" }}
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
        <div className="chat-window">
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.length === 0 ? (
              <div className="finder-welcome-container">
                <div className="finder-robot-circle">
                  <MessageSquare size={32} fill="rgba(59,130,246,0.1)" />
                </div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#1E3A5F" }}>
                  Xin chào! Mình là FormulaX AI
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: "1.5" }}>
                  Được hỗ trợ bởi <strong>Gemini 2.0 Flash · Google</strong>. Hỏi bất kỳ bài toán nào,
                  mình sẽ giải từng bước và gợi ý công thức phù hợp.
                </p>
                <div className="finder-suggestions-grid">
                  {suggestionsList.map((item, idx) => (
                    <div key={idx} className="finder-suggestion-card" onClick={() => handleSend(item.query)}>
                      <Search size={14} className="finder-suggestion-icon" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble ${msg.sender}`}
                  style={
                    msg.isError
                      ? { backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c" }
                      : (msg.isImage || msg.isFile)
                        ? { padding: "8px", backgroundColor: "white", border: "1px solid #E2E8F0", color: "#1E3A5F" }
                        : {}
                  }
                >
                  {msg.isError && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={16} />
                      <span>{msg.text}</span>
                    </div>
                  )}

                  {msg.isImage && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{
                        position: "relative", width: "180px", height: "100px",
                        background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
                        borderRadius: "8px", border: "1.5px solid #CBD5E1",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", color: "#475569", fontWeight: "700"
                      }}>
                        <div style={{ fontSize: "0.85rem", color: "#1E3A5F", fontFamily: "monospace", zIndex: 1 }}>R = 3cm | V = ?</div>
                        <span style={{ position: "absolute", bottom: "6px", right: "6px", backgroundColor: "#10B981", color: "white", fontSize: "0.6rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "800", zIndex: 1 }}>CAPTURE OCR</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "600", paddingLeft: "4px" }}>Ảnh chụp đề bài từ Camera AI</div>
                    </div>
                  )}

                  {msg.isFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <div style={{ padding: "8px", backgroundColor: "rgba(59,130,246,0.08)", color: "#3B82F6", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1E3A5F", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }}>{msg.fileName}</span>
                        <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: "600" }}>Tài liệu đính kèm</span>
                      </div>
                    </div>
                  )}

                  {!msg.isImage && !msg.isFile && !msg.isError && (
                    <div style={{ lineHeight: "1.65", fontSize: "0.88rem" }}>
                      {msg.sender === "bot"
                        ? <RichTextRenderer text={msg.text || ""} />
                        : <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                      }
                    </div>
                  )}

                  {/* Formula card */}
                  {msg.sender === "bot" && msg.aiResult && (
                    <div className="ai-result-card">
                      <div className="ai-result-name">{msg.aiResult.name}</div>
                      <div className="ai-result-latex">
                        <MathElement math={msg.aiResult.latex} block={true} />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#334155" }}>
                        <strong>Ý nghĩa:</strong>
                        <RichTextRenderer text={msg.aiResult.explanation.split('\n')[0]} />
                      </div>
                      {msg.aiResult.mnemonic && (
                        <div className="ai-result-mnemonic">
                          <strong>💡 Mẹo nhớ:</strong> {msg.aiResult.mnemonic}
                        </div>
                      )}
                      <div className="ai-result-actions">
                        <button
                          className="ai-result-btn"
                          onClick={() => onCreateFlashcard(msg.aiResult)}
                          style={{ backgroundColor: "rgba(16,185,129,0.08)", color: "#10B981" }}
                        >
                          Tạo Flashcard
                        </button>
                        <button
                          className="ai-result-btn"
                          onClick={() => handleBookmarkWithPopup(msg.aiResult.id, msg.aiResult.name)}
                          style={{
                            backgroundColor: bookmarkedIds.includes(msg.aiResult.id) ? "rgba(239,68,68,0.08)" : "rgba(30,58,95,0.05)",
                            color: bookmarkedIds.includes(msg.aiResult.id) ? "#EF4444" : "#1E3A5F"
                          }}
                        >
                          {bookmarkedIds.includes(msg.aiResult.id) ? "✓ Đã lưu" : "Lưu lại"}
                        </button>
                        <button
                          className="ai-result-btn"
                          onClick={() => onViewDetail(msg.aiResult)}
                          style={{ backgroundColor: "#1E3A5F", color: "white" }}
                        >
                          Chi tiết
                        </button>
                      </div>
                      {msg.related && msg.related.length > 0 && (
                        <div className="ai-related-section">
                          <div className="ai-related-title">Gợi ý liên quan:</div>
                          <div className="ai-related-list">
                            {msg.related.map((rel) => rel && (
                              <button key={rel.id} className="ai-related-item" onClick={() => onViewDetail(rel)}>
                                {rel.name} (Lớp {rel.grade})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {isAnalyzing && (
              <div className="chat-bubble bot">
                <div className="ai-loader">
                  <div className="pulse-bubble"></div>
                  <div className="pulse-bubble"></div>
                  <div className="pulse-bubble"></div>
                  <span>AI đang phân tích...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div style={{ padding: "12px", borderTop: "1px solid var(--border-slate)", background: "white" }}>
            <div className="finder-input-container">
              <button type="button" onClick={() => setCameraOpen(true)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 4px 8px 8px" }}
                title="Quét đề bài bằng Camera AI"
              >
                <Camera size={18} />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 8px 8px 4px" }}
                title="Tải đề bài lên từ máy tính"
              >
                <Paperclip size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf,.txt,.docx" />
              <textarea
                ref={textareaRef}
                className="finder-input-field"
                placeholder="Hỏi AI về bất kỳ công thức toán nào..."
                rows={1}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = '1px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                disabled={isAnalyzing}
                style={{ resize: "none", overflow: "hidden", lineHeight: "1.5" }}
              />
              <button
                type="button"
                className={`finder-send-btn ${query.trim() ? "active" : ""}`}
                disabled={isAnalyzing || !query.trim()}
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
        <div style={{
          position: "fixed",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000,
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: "14px",
          padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          minWidth: "280px",
          maxWidth: "340px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BookMarked size={14} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1E3A5F" }}>Đã lưu vào thư viện!</div>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1px" }}>
                "{savedPopup.formulaName.length > 35 ? savedPopup.formulaName.slice(0, 35) + "..." : savedPopup.formulaName}"
              </div>
            </div>
            <button onClick={() => setSavedPopup(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setActiveTab("library"); setSavedPopup(null); }}
              style={{
                flex: 1, padding: "9px", background: "#1E3A5F", color: "white",
                border: "none", borderRadius: "9px", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
              }}
            >
              <BookOpen size={13} />
              Xem thư viện
            </button>
            <button
              onClick={() => setSavedPopup(null)}
              style={{
                flex: 1, padding: "9px", background: "#F1F5F9", color: "#64748B",
                border: "none", borderRadius: "9px", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: "700"
              }}
            >
              Tiếp tục chat
            </button>
          </div>
        </div>
      )}

      {/* ─── Camera Modal ─── */}
      {cameraOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "420px",
            padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            position: "relative", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <button onClick={() => setCameraOpen(false)} style={{
              position: "absolute", top: "16px", right: "16px",
              background: "#F1F5F9", border: "none", width: "32px", height: "32px",
              borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#1E3A5F"
            }}>
              <X size={16} />
            </button>
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E3A5F", margin: 0 }}>Chụp ảnh đề bài bằng Camera AI</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "4px 0 0 0" }}>Đặt công thức/đề bài vào khung quét bên dưới</p>
            </div>
            <div style={{
              position: "relative", width: "100%", height: "220px", backgroundColor: "#0F172A",
              borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", backgroundColor: "#10B981", boxShadow: "0 0 8px #10B981", animation: "float 3s infinite ease-in-out" }}></div>
              <div style={{
                position: "absolute", width: "80%", height: "50%", border: "2px dashed #F59E0B", borderRadius: "8px",
                boxShadow: "0 0 0 9999px rgba(15,23,42,0.4)", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ position: "absolute", top: "-4px", left: "-4px", width: "12px", height: "12px", borderTop: "3px solid #F59E0B", borderLeft: "3px solid #F59E0B" }}></div>
                <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "12px", height: "12px", borderTop: "3px solid #F59E0B", borderRight: "3px solid #F59E0B" }}></div>
                <div style={{ position: "absolute", bottom: "-4px", left: "-4px", width: "12px", height: "12px", borderBottom: "3px solid #F59E0B", borderLeft: "3px solid #F59E0B" }}></div>
                <div style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "12px", height: "12px", borderBottom: "3px solid #F59E0B", borderRight: "3px solid #F59E0B" }}></div>
              </div>
              <div style={{ color: "#E2E8F0", fontSize: "0.9rem", fontFamily: "monospace", textAlign: "center", lineHeight: "1.6", padding: "20px", zIndex: 1 }}>
                <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>[ Đề bài mẫu ]</div>
                <strong>Cho mặt cầu bán kính R = 3cm.</strong><br />
                <strong>Tính thể tích V của khối cầu đó.</strong>
              </div>
              <span style={{ position: "absolute", bottom: "12px", backgroundColor: "rgba(0,0,0,0.6)", color: "#10B981", fontSize: "0.65rem", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", letterSpacing: "0.5px" }}>ĐANG TỰ ĐỘNG LẤY NÉT</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <button
                onClick={handleCapturePhoto}
                style={{
                  width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "white",
                  border: "4px solid #3B82F6", padding: "4px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
                }}
                title="Chụp ngay"
              >
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#3B82F6" }}></div>
              </button>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700" }}>Nhấn nút để quét công thức</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
