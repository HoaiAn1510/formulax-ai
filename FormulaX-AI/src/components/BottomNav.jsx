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
// Mobile: giữ nguyên pill xanh như cũ (không đổi). Desktop: sidebar luôn nền navy #16243A bất kể
// toggle dark mode — item mặc định chữ #CBD5E1, hover nền trắng mờ (rgba(255,255,255,.08)), active
// nền #29589C + chữ trắng, bo góc 12px (giống mẫu Notion/Linear), không còn vạch accent bên phải.
function navItemClass(active) {
  const base = "group relative flex flex-col md:flex-row items-center justify-center md:justify-start bg-transparent border-none cursor-pointer flex-1 md:flex-none h-full md:h-[52px] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 gap-1 md:gap-3 md:px-3 md:w-[calc(100%-16px)] md:mx-2 md:rounded-xl text-[0.75rem] md:text-[0.85rem] font-bold transition duration-200";
  const color = active
    ? "text-secondary dark:text-[#3B82F6] font-extrabold md:bg-[#29589C] md:text-white md:dark:bg-[#29589C] md:dark:text-white"
    : "text-text-muted dark:text-[#94A3B8] md:text-[#CBD5E1] md:dark:text-[#CBD5E1] md:hover:bg-white/8";
  return `${base} ${color}`;
}

function navIconClass(active) {
  const base = "flex items-center justify-center relative w-9 h-9 md:w-auto md:h-auto rounded-xl transition duration-200 shrink-0";
  if (active) return `${base} bg-secondary text-white shadow-[0_4px_10px_rgba(59,130,246,0.2)] md:bg-transparent md:text-white md:shadow-none`;
  return `${base} md:text-inherit`;
}

// Chữ nhãn cạnh icon — trên desktop mặc định thu về 0 (ẩn), chỉ hiện khi rê chuột vào
// cả sidebar (group/sidebar, đặt ở thẻ <nav> gốc). Mobile không đổi (không có md: nào áp).
const collapsibleLabel = "md:inline-block md:max-w-0 md:opacity-0 md:overflow-hidden md:whitespace-nowrap md:transition-all md:duration-300 md:group-hover/sidebar:max-w-[160px] md:group-hover/sidebar:opacity-100";

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
    <nav className="group/sidebar fixed bottom-0 left-0 right-0 md:right-auto md:bottom-auto md:top-0 h-[72px] md:h-screen md:w-[88px] md:hover:w-60 bg-white/95 max-md:dark:bg-[#1E293B] md:!bg-[#16243A] backdrop-blur-[20px] md:backdrop-blur-none border-t md:border-t-0 md:border-r border-[rgba(30,58,95,0.07)] max-md:dark:border-[#334155] md:!border-[#0F172A] shadow-[0_-4px_20px_rgba(0,0,0,0.02)] md:shadow-none flex md:flex-col justify-around md:justify-start items-center md:items-stretch px-2 md:px-0 md:pt-4 md:overflow-y-auto md:overflow-x-hidden z-[100] md:transition-[width] md:duration-300 md:ease-in-out">

      {/* Logo header — chỉ hiện trên desktop (sidebar), luôn nền navy bất kể toggle dark mode */}
      <div className="hidden md:flex items-center gap-2.5 pt-[18px] pb-3.5 px-5 border-b border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A] mb-2">
        <img src="/favicon.svg" alt="FormulaX" className="w-8 h-8 object-cover shrink-0" />
        <span className={`font-extrabold text-[1.15rem] text-primary max-md:dark:text-[#E2E8F0] md:!text-white tracking-[-0.5px] ${collapsibleLabel}`}>FormulaX AI</span>
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
            <span className={collapsibleLabel}>{tab.label}</span>
          </button>
        );
      })}

      {/* ── Settings section ──────────────────────────── */}
      <div className="hidden md:flex md:flex-col md:mt-auto md:pb-3 w-full">
        <div className="h-px bg-[#f1f5f9] max-md:dark:bg-[#334155] md:!bg-[#0F172A] mx-4 my-2" />

        {/* Bell / Thông báo */}
        <button
          className={navItemClass(notifOpen)}
          onClick={toggleNotif}
          title="Thông báo"
        >
          <div className={`${navIconClass(notifOpen)} relative`}>
            <Bell size={18} />
            <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-error border-[1.5px] border-white max-md:dark:border-[#1E293B] md:!border-[#16243A]" />
          </div>
          <span className={collapsibleLabel}>Thông báo</span>
          <ChevronDown size={14} className={`hidden md:group-hover/sidebar:block md:ml-auto transition-transform duration-200 text-[#94A3B8] shrink-0 ${notifOpen ? "rotate-180" : "rotate-0"}`} />
        </button>

        {notifOpen && (
          <div className="mt-0.5 mx-2.5 mb-1 rounded-[10px] border border-[#EEF2FF] max-md:dark:border-[#334155] md:!border-[#0F172A] p-2 bg-white max-md:dark:bg-[#1E293B] md:!bg-[#0F172A] flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
            {NOTIFS.map(n => (
              <div key={n.id} className={`px-2 py-1.5 rounded-md text-[0.72rem] leading-[1.35] border-l-[3px] ${n.unread ? "bg-[rgba(46,134,222,0.05)] border-l-[#2E86DE]" : "bg-transparent border-l-transparent"}`}>
                <div className={`text-[#1E3A5F] md:!text-[#E2E8F0] ${n.unread ? "font-semibold" : "font-normal"}`}>{n.text}</div>
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
          <span className={collapsibleLabel}>Tài khoản</span>
          <div className="hidden md:group-hover/sidebar:flex items-center gap-1 md:ml-auto shrink-0">
            {isPremium && (
              <span className="text-[0.55rem] bg-[linear-gradient(135deg,#D97706,#F59E0B)] text-white py-px px-1 rounded-[3px] font-bold shrink-0">PRO</span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 text-[#94A3B8] shrink-0 ${accountOpen ? "rotate-180" : "rotate-0"}`} />
          </div>
        </button>

        {accountOpen && (
          <div className="mt-0.5 mx-2.5 mb-1 rounded-[10px] bg-secondary/4 max-md:dark:bg-secondary/6 md:!bg-[#0F172A] border border-[#EEF2FF] max-md:dark:border-[#334155] md:!border-[#0F172A] overflow-hidden">
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
              className={`${navItemClass(false)} !mx-0 !w-full !rounded-none border-t border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A]`}
              onClick={() => setDarkMode?.(!darkMode)}
            >
              <div className={navIconClass(false)}>
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <span className={`text-[0.8rem] ${collapsibleLabel}`}>{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span>
              <div className={`md:ml-auto w-7 h-4 rounded-lg relative transition-colors duration-200 shrink-0 ${darkMode ? "bg-accent" : "bg-[#CBD5E1]"}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${darkMode ? "left-3.5" : "left-0.5"}`} />
              </div>
            </button>

            {/* Display name */}
            {editingName ? (
              <div className="flex items-center gap-1.5 py-1.5 px-3.5 border-t border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A]">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  placeholder="Nhập tên hiển thị..."
                  autoFocus
                  className="flex-1 py-1.5 px-2 rounded-[7px] border-[1.5px] border-secondary text-[0.8rem] outline-none text-[#1E3A5F] max-md:dark:bg-[#0F172A] max-md:dark:text-[#E2E8F0] max-md:dark:border-[#334155] md:!bg-[#16243A] md:!text-[#E2E8F0] md:!border-[#334155]"
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
                className={`${navItemClass(false)} !mx-0 !w-full !rounded-none border-t border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A]`}
                onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
              >
                <div className={navIconClass(false)}><Pencil size={16} /></div>
                <span className={`text-[0.8rem] ${collapsibleLabel}`}>
                  {displayName ? `Tên: ${displayName}` : "Đổi tên hiển thị"}
                </span>
              </button>
            )}

            {/* Logout */}
            <button
              className="w-full flex items-center gap-2.5 px-5 h-11 bg-transparent border-none border-t border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A] cursor-pointer text-error text-[0.85rem] font-semibold text-left rounded-none hover:bg-error/6"
              onClick={onLogout}
            >
              <LogOut size={15} className="shrink-0" />
              <span className={collapsibleLabel}>Đăng xuất</span>
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}
