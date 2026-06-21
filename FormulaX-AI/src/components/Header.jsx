import React, { useState, useRef, useEffect } from "react";
import { Bell, LogOut, LogIn } from "lucide-react";

export default function Header({ user, isPremium, onLogout, onLogin, isLoggedIn }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notificationList = [
    { id: 1, text: "AI gợi ý hôm nay: 3 công thức ôn tập Giải tích 12.", time: "5 phút trước", unread: true },
    { id: 2, text: "Bạn đã hoàn thành 80% mục tiêu học tập tuần này!", time: "2 giờ trước", unread: false },
    { id: 3, text: "Tính năng Finder AI vừa cập nhật thêm dạng bài tập.", time: "1 ngày trước", unread: false }
  ];

  return (
    <header className="main-header">
      {/* Logo — chỉ hiện trên mobile (desktop dùng sidebar) */}
      <div className="logo-section">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="FormulaX" style={{ width: "30px", height: "30px", borderRadius: "7px" }}
            onError={e => { e.target.style.display = "none"; }} />
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
              style={{ top: "calc(100% + 8px)", right: 0, left: "auto", width: "272px", padding: "10px", zIndex: 1000 }}>
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
              style={{ top: "calc(100% + 8px)", right: 0, left: "auto", width: "220px", padding: "0", zIndex: 1000, overflow: "hidden" }}>

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
                    {user?.name || "Người dùng"}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.6)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || ""}
                  </div>
                </div>
              </div>

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
