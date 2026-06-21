import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, Sparkles, Layers, GraduationCap,
  Moon, Sun, LogOut, Pencil, Check, X, Bell, User,
} from "lucide-react";

const NOTIFS = [
  { id: 1, text: "AI gợi ý hôm nay: 3 công thức ôn tập Giải tích 12.", time: "5 phút trước", unread: true },
  { id: 2, text: "Bạn đã hoàn thành 80% mục tiêu học tập tuần này!", time: "2 giờ trước", unread: false },
  { id: 3, text: "Tính năng Finder AI vừa cập nhật thêm dạng bài tập.", time: "1 ngày trước", unread: false },
];

const POPUP_LEFT = 252; // px — right edge of 240px sidebar + gap

export default function BottomNav({
  activeTab, setActiveTab,
  darkMode, setDarkMode,
  displayName, onSetDisplayName,
  onLogout,
  user, isLoggedIn, isPremium,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(displayName || "");

  const accountRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => { setNameInput(displayName || ""); }, [displayName]);

  // Click-outside để đóng popup
  useEffect(() => {
    const handle = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
        setEditingName(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSaveName = () => {
    onSetDisplayName?.(nameInput.trim());
    setEditingName(false);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { id: "library",   label: "Thư viện",   icon: BookOpen },
    { id: "finder",    label: "Finder AI",  icon: Sparkles },
    { id: "flashcard", label: "Flashcard",  icon: Layers },
    { id: "quiz",      label: "Luyện đề",   icon: GraduationCap },
  ];

  const popupBase = {
    position: "fixed",
    left: POPUP_LEFT,
    width: 240,
    background: darkMode ? "#1E293B" : "white",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    border: `1px solid ${darkMode ? "#334155" : "#E2E8F0"}`,
    zIndex: 300,
    overflow: "hidden",
  };

  return (
    <nav className="bottom-nav">

      {/* Logo header — only shown in sidebar (desktop) */}
      <div className="nav-logo-header">
        <img src="/favicon.svg" alt="FormulaX" style={{ width: "28px", height: "28px", borderRadius: "7px" }} />
        <span>FormulaX AI</span>
      </div>

      {/* Main nav tabs */}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <div className="nav-item-icon-container"><Icon size={20} /></div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Settings section — desktop sidebar only */}
      <div className="nav-settings-section">
        <div className="nav-settings-divider" />

        {/* ── Thông báo ── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            className={`nav-item ${notifOpen ? "active" : ""}`}
            onClick={() => { setNotifOpen(p => !p); setAccountOpen(false); }}
            title="Thông báo"
          >
            <div className="nav-item-icon-container" style={{ position: "relative" }}>
              <Bell size={18} />
              <span style={{ position: "absolute", top: "-3px", right: "-3px", width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444", border: "1.5px solid white" }} />
            </div>
            <span>Thông báo</span>
          </button>

          {notifOpen && (
            <div style={{ ...popupBase, bottom: 80 }}>
              <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: darkMode ? "#E2E8F0" : "#1E3A5F" }}>Thông báo</span>
                <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", fontSize: "0.7rem", color: "#3B82F6", cursor: "pointer", fontWeight: "600" }}>Đóng</button>
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {NOTIFS.map(n => (
                  <div key={n.id} style={{
                    padding: "7px 10px", borderRadius: "8px",
                    background: n.unread ? "rgba(46,134,222,0.06)" : "transparent",
                    borderLeft: n.unread ? "3px solid #2E86DE" : "3px solid transparent",
                    fontSize: "0.73rem", lineHeight: "1.4",
                  }}>
                    <div style={{ color: darkMode ? "#E2E8F0" : "#1E3A5F", fontWeight: n.unread ? "600" : "400" }}>{n.text}</div>
                    <div style={{ color: "#94A3B8", fontSize: "0.63rem", marginTop: "2px" }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tài khoản ── */}
        <div ref={accountRef} style={{ position: "relative" }}>
          <button
            className={`nav-item ${accountOpen ? "active" : ""}`}
            onClick={() => { setAccountOpen(p => !p); setNotifOpen(false); setEditingName(false); }}
            title="Tài khoản"
          >
            <div className="nav-item-icon-container">
              {isLoggedIn && user?.picture ? (
                <img src={user.picture} referrerPolicy="no-referrer" alt=""
                  style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <User size={18} />
              )}
            </div>
            <span>Tài khoản</span>
            {isPremium && (
              <span style={{ fontSize: "0.55rem", background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "white", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold", flexShrink: 0 }}>PRO</span>
            )}
          </button>

          {accountOpen && (
            <div style={{ ...popupBase, bottom: 16 }}>
              {/* Avatar + name */}
              <div style={{ padding: "14px 16px", background: "linear-gradient(135deg,#1E3A5F,#2563EB)", display: "flex", alignItems: "center", gap: "12px" }}>
                {user?.picture ? (
                  <img src={user.picture} referrerPolicy="no-referrer" alt=""
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "800", color: "white", flexShrink: 0 }}>
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: "800", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName || user?.name || "Người dùng"}
                  </div>
                  <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.6)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || ""}
                  </div>
                </div>
              </div>

              {/* Dark / Light */}
              <button
                className="nav-item"
                onClick={() => setDarkMode?.(!darkMode)}
                style={{ borderRadius: 0, borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}
              >
                <div className="nav-item-icon-container">
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </div>
                <span style={{ flex: 1, fontSize: "0.82rem" }}>{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span>
                <div style={{ width: "28px", height: "16px", borderRadius: "8px", background: darkMode ? "#3B82F6" : "#CBD5E1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "white", position: "absolute", top: "2px", left: darkMode ? "14px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
              </button>

              {/* Edit name */}
              {editingName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    placeholder="Nhập tên hiển thị..."
                    autoFocus
                    style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", border: "1.5px solid #3B82F6", fontSize: "0.8rem", outline: "none", minWidth: 0, background: darkMode ? "#0F172A" : "white", color: darkMode ? "#E2E8F0" : "#1E3A5F" }}
                  />
                  <button onClick={handleSaveName} style={{ background: "#10B981", color: "white", border: "none", borderRadius: "5px", padding: "5px 7px", cursor: "pointer", display: "flex" }}><Check size={12} /></button>
                  <button onClick={() => setEditingName(false)} style={{ background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: "5px", padding: "5px 7px", cursor: "pointer", display: "flex" }}><X size={12} /></button>
                </div>
              ) : (
                <button
                  className="nav-item"
                  onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
                  style={{ borderRadius: 0, borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}
                >
                  <div className="nav-item-icon-container"><Pencil size={16} /></div>
                  <span style={{ flex: 1, fontSize: "0.82rem" }}>
                    {displayName ? `Tên: ${displayName}` : "Đổi tên hiển thị"}
                  </span>
                </button>
              )}

              {/* Logout */}
              <div style={{ padding: "10px" }}>
                <button
                  onClick={onLogout}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "9px 16px", background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "700", boxShadow: "0 2px 8px rgba(239,68,68,0.2)" }}
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
