import React, { useState, useRef, useEffect } from "react";
import { Bell, LogOut, LogIn, Moon, Sun, Pencil, Check, X } from "lucide-react";

export default function Header({ user, isPremium, onLogout, onLogin, isLoggedIn, darkMode, setDarkMode, displayName, onSetDisplayName }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName || "");

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => { setNameInput(displayName || ""); }, [displayName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setDropdownOpen(false); setEditingName(false); }
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveName = () => {
    onSetDisplayName?.(nameInput.trim());
    setEditingName(false);
  };

  const notificationList = [
    { id: 1, text: "AI gợi ý hôm nay: 3 công thức ôn tập Giải tích 12.", time: "5 phút trước", unread: true },
    { id: 2, text: "Bạn đã hoàn thành 80% mục tiêu học tập tuần này!", time: "2 giờ trước", unread: false },
    { id: 3, text: "Tính năng Finder AI vừa cập nhật thêm dạng bài tập.", time: "1 ngày trước", unread: false }
  ];

  return (
    <header className="main-header">
      {/* Logo — chỉ hiện trên mobile */}
      <div className="logo-section">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/favicon.svg" alt="FormulaX" style={{ width: "30px", height: "30px", borderRadius: "7px" }} />
          <span style={{ fontWeight: "800", fontSize: "1.15rem", letterSpacing: "-0.5px" }}>FormulaX AI</span>
        </div>
      </div>

      <div className="header-actions">

        {/* Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button className="notification-btn"
            onClick={() => { setShowNotifications(p => !p); setDropdownOpen(false); }}
            title="Thông báo"
          >
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>

          {showNotifications && (
            <div className="autocomplete-dropdown"
              style={{ top: "calc(100% + 8px)", right: 0, left: "auto", width: "min(260px, calc(100vw - 24px))", padding: "10px", zIndex: 1000, maxHeight: "240px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1E3A5F" }}>Thông báo</span>
                <button onClick={() => setShowNotifications(false)}
                  style={{ background: "none", border: "none", fontSize: "0.7rem", color: "#2E86DE", cursor: "pointer", fontWeight: "600" }}>
                  Đóng
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notificationList.map((n) => (
                  <div key={n.id} style={{
                    padding: "6px 8px", borderRadius: "6px",
                    backgroundColor: n.unread ? "rgba(46,134,222,0.05)" : "transparent",
                    fontSize: "0.75rem", lineHeight: "1.3",
                    borderLeft: n.unread ? "3px solid #2E86DE" : "3px solid transparent"
                  }}>
                    <div style={{ color: "#1E3A5F", fontWeight: n.unread ? "600" : "400" }}>{n.text}</div>
                    <div style={{ color: "#94A3B8", fontSize: "0.65rem", marginTop: "2px" }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button className="btn-header-login"
            onClick={() => { setDropdownOpen(p => !p); setShowNotifications(false); }}
          >
            {isLoggedIn && user?.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer"
                style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <LogIn size={14} />
            )}
            <span>{isLoggedIn ? "Tài khoản" : "Đăng nhập"}</span>
            {isPremium && (
              <span style={{ fontSize: "0.6rem", background: "var(--premium-grad)", color: "white", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold" }}>PRO</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="autocomplete-dropdown"
              style={{ top: "calc(100% + 8px)", right: 0, left: "auto", width: "min(220px, calc(100vw - 24px))", padding: "0", zIndex: 1000, overflow: "hidden" }}>

              {/* Header card */}
              <div style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                {user?.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer"
                    style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "800", color: "white", flexShrink: 0 }}>
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName || user?.name || "Người dùng"}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.6)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || ""}
                  </div>
                </div>
              </div>

              {/* Dark mode toggle */}
              {isLoggedIn && (
                <button
                  onClick={() => setDarkMode?.(!darkMode)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", textAlign: "left" }}
                >
                  {darkMode ? <Sun size={15} color="#64748B" /> : <Moon size={15} color="#64748B" />}
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "#1E3A5F", fontWeight: "600" }}>{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span>
                  <div style={{ width: "28px", height: "16px", borderRadius: "8px", background: darkMode ? "#3B82F6" : "#CBD5E1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "white", position: "absolute", top: "2px", left: darkMode ? "14px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                </button>
              )}

              {/* Edit display name */}
              {isLoggedIn && (
                editingName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                      placeholder="Nhập tên hiển thị..."
                      autoFocus
                      style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", border: "1.5px solid #3B82F6", fontSize: "0.8rem", outline: "none", minWidth: 0 }}
                    />
                    <button onClick={handleSaveName} style={{ background: "#10B981", color: "white", border: "none", borderRadius: "5px", padding: "5px 7px", cursor: "pointer", display: "flex" }}><Check size={12} /></button>
                    <button onClick={() => setEditingName(false)} style={{ background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: "5px", padding: "5px 7px", cursor: "pointer", display: "flex" }}><X size={12} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer", textAlign: "left" }}
                  >
                    <Pencil size={14} color="#64748B" />
                    <span style={{ fontSize: "0.82rem", color: "#1E3A5F", fontWeight: "600" }}>
                      {displayName ? `Tên: ${displayName}` : "Đổi tên hiển thị"}
                    </span>
                  </button>
                )
              )}

              {/* Logout button */}
              <div style={{ padding: "10px" }}>
                <button
                  onClick={() => { setDropdownOpen(false); isLoggedIn ? onLogout() : onLogin?.(); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, #EF4444, #DC2626)",
                    color: "white", border: "none", borderRadius: "9px",
                    cursor: "pointer", fontSize: "0.83rem", fontWeight: "700",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.2)"
                  }}
                >
                  <LogOut size={14} />
                  <span>{isLoggedIn ? "Đăng xuất" : "Đăng nhập"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
