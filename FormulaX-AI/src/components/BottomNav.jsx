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

// Class dùng chung cho mọi nav-item (5 tab chính + Thông báo/Tài khoản + 2 nút trong account panel).
// active=true tái tạo đúng .nav-item.active (mobile: icon dạng pill xanh; desktop: nền xanh nhạt + vạch phải).
function navItemClass(active) {
  const base = "group relative flex flex-col md:flex-row items-center justify-center md:justify-start bg-transparent border-none cursor-pointer flex-1 md:flex-none h-full md:h-[52px] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 gap-1 md:gap-3 md:px-6 md:w-full md:rounded-none text-[0.75rem] md:text-[0.85rem] font-bold transition duration-200";
  const color = active
    ? "text-secondary dark:text-[#3B82F6] font-extrabold md:bg-secondary/4 dark:md:bg-secondary/8 md:after:content-[''] md:after:absolute md:after:right-0 md:after:top-2 md:after:bottom-2 md:after:w-1 md:after:bg-secondary md:after:rounded-l-full"
    : "text-text-muted dark:text-[#94A3B8]";
  return `${base} ${color}`;
}

function navIconClass(active) {
  const base = "flex items-center justify-center relative w-9 h-9 md:w-auto md:h-auto rounded-xl transition duration-200";
  if (active) return `${base} bg-secondary text-white shadow-[0_4px_10px_rgba(59,130,246,0.2)] md:bg-transparent md:text-secondary md:shadow-none`;
  return `${base} group-hover:text-secondary group-hover:bg-secondary/5`;
}

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
    <nav className="fixed md:relative bottom-0 left-0 right-0 md:inset-auto h-[72px] md:h-full md:col-[1/2] md:row-[1/3] md:w-[240px] bg-white/95 dark:bg-[#1E293B] backdrop-blur-[20px] border-t md:border-t-0 md:border-r border-[rgba(30,58,95,0.07)] dark:border-[#334155] shadow-[0_-4px_20px_rgba(0,0,0,0.02)] md:shadow-none flex md:flex-col justify-around md:justify-start items-center md:items-stretch px-2 md:px-0 md:pt-4 md:overflow-y-auto z-[100]">

      {/* Logo header — chỉ hiện trên desktop (sidebar) */}
      <div className="hidden md:flex items-center gap-2.5 pt-[18px] pb-3.5 px-5 border-b border-[#f1f5f9] dark:border-[#334155] mb-2">
        <img src="/favicon.svg" alt="FormulaX" className="w-8 h-8 rounded-lg object-cover" />
        <span className="font-extrabold text-[1.15rem] text-primary dark:text-[#E2E8F0] tracking-[-0.5px]">FormulaX AI</span>
      </div>

      {/* Main nav tabs */}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={navItemClass(active)}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <div className={navIconClass(active)}><Icon size={20} /></div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* ── Settings section ──────────────────────────── */}
      <div className="hidden md:flex md:flex-col md:mt-auto md:pb-3 w-full">
        <div className="h-px bg-[#f1f5f9] dark:bg-[#334155] mx-4 my-2" />

        {/* Bell / Thông báo */}
        <button
          className={navItemClass(notifOpen)}
          onClick={toggleNotif}
          title="Thông báo"
        >
          <div className={`${navIconClass(notifOpen)} relative`}>
            <Bell size={18} />
            <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-error border-[1.5px] border-white dark:border-[#1E293B]" />
          </div>
          <span className="flex-1">Thông báo</span>
          <ChevronDown size={14} className={`transition-transform duration-200 text-[#94A3B8] shrink-0 ${notifOpen ? "rotate-180" : "rotate-0"}`} />
        </button>

        {notifOpen && (
          <div className="mt-0.5 mx-2.5 mb-1 rounded-[10px] border border-[#EEF2FF] dark:border-[#334155] p-2 bg-white dark:bg-[#1E293B] flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
            {NOTIFS.map(n => (
              <div key={n.id} className={`px-2 py-1.5 rounded-md text-[0.72rem] leading-[1.35] border-l-[3px] ${n.unread ? "bg-[rgba(46,134,222,0.05)] border-l-[#2E86DE]" : "bg-transparent border-l-transparent"}`}>
                <div className={`text-[#1E3A5F] ${n.unread ? "font-semibold" : "font-normal"}`}>{n.text}</div>
                <div className="text-[#94A3B8] text-[0.62rem] mt-0.5">{n.time}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tài khoản */}
        <button
          className={navItemClass(accountOpen)}
          onClick={toggleAccount}
          title="Tài khoản"
        >
          <div className={navIconClass(accountOpen)}>
            {isLoggedIn && user?.picture ? (
              <img src={user.picture} referrerPolicy="no-referrer" alt=""
                className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </div>
          <span className="flex-1">Tài khoản</span>
          {isPremium && (
            <span className="text-[0.55rem] bg-[linear-gradient(135deg,#F59E0B,#EF4444)] text-white py-px px-1 rounded-[3px] font-bold shrink-0">PRO</span>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 text-[#94A3B8] shrink-0 ml-1 ${accountOpen ? "rotate-180" : "rotate-0"}`} />
        </button>

        {accountOpen && (
          <div className="mt-0.5 mx-2.5 mb-1 rounded-[10px] bg-secondary/4 dark:bg-secondary/6 border border-[#EEF2FF] dark:border-[#334155] overflow-hidden">
            {/* Avatar + name + email header */}
            <div className="flex items-center gap-2.5 py-2.5 px-3 bg-[linear-gradient(135deg,#1E3A5F_0%,#2563EB_100%)]">
              {user?.picture ? (
                <img src={user.picture} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded-full border-2 border-white/35 object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-base font-extrabold text-white shrink-0">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[0.78rem] font-bold text-white truncate">{user?.name || "Người dùng"}</div>
                <div className="text-[0.63rem] text-white/60 truncate">{user?.email || ""}</div>
              </div>
            </div>

            {/* Dark / Light toggle */}
            <button
              className={`${navItemClass(false)} border-t border-[#f1f5f9] dark:border-[#334155]`}
              onClick={() => setDarkMode?.(!darkMode)}
            >
              <div className={navIconClass(false)}>
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <span className="flex-1 text-[0.8rem]">{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span>
              <div className={`w-7 h-4 rounded-lg relative transition-colors duration-200 shrink-0 ${darkMode ? "bg-secondary" : "bg-[#CBD5E1]"}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${darkMode ? "left-3.5" : "left-0.5"}`} />
              </div>
            </button>

            {/* Display name */}
            {editingName ? (
              <div className="flex items-center gap-1.5 py-1.5 px-3.5 border-t border-[#f1f5f9] dark:border-[#334155]">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  placeholder="Nhập tên hiển thị..."
                  autoFocus
                  className="flex-1 py-1.5 px-2 rounded-[7px] border-[1.5px] border-secondary text-[0.8rem] outline-none text-[#1E3A5F] dark:bg-[#0F172A] dark:text-[#E2E8F0] dark:border-[#334155]"
                />
                <button onClick={handleSaveName} className="py-1.5 px-2.5 border-none rounded-[7px] cursor-pointer text-[0.75rem] font-bold bg-success text-white">
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingName(false)} className="py-1.5 px-2.5 border-none rounded-[7px] cursor-pointer text-[0.75rem] font-bold bg-[#F1F5F9] text-text-muted">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                className={`${navItemClass(false)} border-t border-[#f1f5f9] dark:border-[#334155]`}
                onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
              >
                <div className={navIconClass(false)}><Pencil size={16} /></div>
                <span className="flex-1 text-[0.8rem]">
                  {displayName ? `Tên: ${displayName}` : "Đổi tên hiển thị"}
                </span>
              </button>
            )}

            {/* Logout */}
            <button
              className="w-full flex items-center gap-2.5 px-5 h-11 bg-transparent border-none border-t border-[#f1f5f9] dark:border-[#334155] cursor-pointer text-error text-[0.85rem] font-semibold text-left rounded-none hover:bg-error/6"
              onClick={onLogout}
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
