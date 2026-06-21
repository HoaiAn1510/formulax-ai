import React, { useState } from "react";
import {
  LayoutDashboard, BookOpen, Sparkles, Layers, GraduationCap,
  Moon, Sun, LogOut, Pencil, Check, X, Bell, ChevronDown, User,
} from "lucide-react";

const NOTIFS = [
  { id: 1, text: "AI gợi ý hôm nay: 3 công thức ôn tập Giải tích 12.", time: "5 phút trước", unread: true },
  { id: 2, text: "Bạn đã hoàn thành 80% mục tiêu học tập tuần này!", time: "2 giờ trước", unread: false },
  { id: 3, text: "Tính năng Finder AI vừa cập nhật thêm dạng bài tập.", time: "1 ngày trước", unread: false },
];

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

  const tabs = [
    { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { id: "library",   label: "Thư viện",   icon: BookOpen },
    { id: "finder",    label: "Finder AI",  icon: Sparkles },
    { id: "flashcard", label: "Flashcard",  icon: Layers },
    { id: "quiz",      label: "Luyện đề",   icon: GraduationCap },
  ];

  const handleSaveName = () => {
    onSetDisplayName?.(nameInput.trim());
    setEditingName(false);
  };

  const toggleAccount = () => { setAccountOpen(p => !p); setNotifOpen(false); };
  const toggleNotif   = () => { setNotifOpen(p => !p);   setAccountOpen(false); };

  return (
    <nav className="bottom-nav">

      {/* Logo header */}
      <div className="nav-logo-header">
        <img src="/logo.png" alt="FormulaX"
          onError={e => { e.target.style.display = "none"; }} />
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

      {/* ── Settings section ──────────────────────────── */}
      <div className="nav-settings-section">
        <div className="nav-settings-divider" />

        {/* Bell / Thông báo */}
        <button
          className={`nav-item ${notifOpen ? "active" : ""}`}
          onClick={toggleNotif}
          title="Thông báo"
        >
          <div className="nav-item-icon-container" style={{ position: "relative" }}>
            <Bell size={18} />
            <span style={{
              position: "absolute", top: "-3px", right: "-3px",
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#EF4444", border: "1.5px solid white",
            }} />
          </div>
          <span style={{ flex: 1 }}>Thông báo</span>
          <ChevronDown size={14} style={{
            transform: notifOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s", color: "#94A3B8", flexShrink: 0,
          }} />
        </button>

        {notifOpen && (
          <div className="nav-notif-panel">
            {NOTIFS.map(n => (
              <div key={n.id} style={{
                padding: "6px 8px", borderRadius: "6px",
                background: n.unread ? "rgba(46,134,222,0.05)" : "transparent",
                borderLeft: n.unread ? "3px solid #2E86DE" : "3px solid transparent",
                fontSize: "0.72rem", lineHeight: "1.35",
              }}>
                <div style={{ color: "#1E3A5F", fontWeight: n.unread ? "600" : "400" }}>{n.text}</div>
                <div style={{ color: "#94A3B8", fontSize: "0.62rem", marginTop: "2px" }}>{n.time}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tài khoản */}
        <button
          className={`nav-item ${accountOpen ? "active" : ""}`}
          onClick={toggleAccount}
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
          <span style={{ flex: 1 }}>Tài khoản</span>
          {isPremium && (
            <span style={{ fontSize: "0.55rem", background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "white", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold", flexShrink: 0 }}>PRO</span>
          )}
          <ChevronDown size={14} style={{
            transform: accountOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s", color: "#94A3B8", flexShrink: 0, marginLeft: "4px",
          }} />
        </button>

        {accountOpen && (
          <div className="nav-account-panel">
            {/* Avatar + name + email header */}
            <div className="nav-account-header">
              {user?.picture ? (
                <img src={user.picture} referrerPolicy="no-referrer" alt="" />
              ) : (
                <div className="acc-avatar-placeholder">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="acc-info">
                <div className="acc-name">{user?.name || "Người dùng"}</div>
                <div className="acc-email">{user?.email || ""}</div>
              </div>
            </div>

            {/* Dark / Light toggle */}
            <button
              className="nav-item"
              onClick={() => setDarkMode?.(!darkMode)}
              style={{ borderRadius: 0, borderTop: "1px solid #f1f5f9" }}
            >
              <div className="nav-item-icon-container">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <span style={{ flex: 1, fontSize: "0.8rem" }}>{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span>
              <div style={{
                width: "28px", height: "16px", borderRadius: "8px",
                background: darkMode ? "#3B82F6" : "#CBD5E1",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}>
                <div style={{
                  width: "12px", height: "12px", borderRadius: "50%", background: "white",
                  position: "absolute", top: "2px",
                  left: darkMode ? "14px" : "2px",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
            </button>

            {/* Display name */}
            {editingName ? (
              <div className="nav-name-edit" style={{ borderTop: "1px solid #f1f5f9" }}>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  placeholder="Nhập tên hiển thị..."
                  autoFocus
                />
                <button onClick={handleSaveName} style={{ background: "#10B981", color: "white" }}>
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingName(false)} style={{ background: "#F1F5F9", color: "#64748B" }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                className="nav-item"
                onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
                style={{ borderRadius: 0, borderTop: "1px solid #f1f5f9" }}
              >
                <div className="nav-item-icon-container"><Pencil size={16} /></div>
                <span style={{ flex: 1, fontSize: "0.8rem" }}>
                  {displayName ? `Tên: ${displayName}` : "Đổi tên hiển thị"}
                </span>
              </button>
            )}

            {/* Logout */}
            <button
              className="nav-logout-btn"
              onClick={onLogout}
              style={{ borderTop: "1px solid #f1f5f9", borderRadius: 0 }}
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}
