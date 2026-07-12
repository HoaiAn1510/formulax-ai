import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Sparkles, Layers, GraduationCap,
  LogOut, Bell, ChevronDown, User, Settings,
} from "lucide-react";

const NOTIFS = [
  { id: 1, category: "aiSuggest", text: "AI gợi ý hôm nay: 3 công thức ôn tập Giải tích 12.", time: "5 phút trước", unread: true },
  { id: 2, category: "streak", text: "Bạn đã hoàn thành 80% mục tiêu học tập tuần này!", time: "2 giờ trước", unread: false },
  { id: 3, category: "featureUpdate", text: "Tính năng Finder AI vừa cập nhật thêm dạng bài tập.", time: "1 ngày trước", unread: false },
];

// Class dùng chung cho mọi nav-item (5 tab chính + Cài đặt/Thông báo/Tài khoản + Đăng xuất).
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
  displayName,
  onLogout,
  user, isLoggedIn, isPremium,
  notifPrefs,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { id: "library",   label: "Thư viện",   icon: BookOpen },
    { id: "finder",    label: "Finder AI",  icon: Sparkles },
    { id: "flashcard", label: "Flashcard",  icon: Layers },
    { id: "quiz",      label: "Luyện đề",   icon: GraduationCap },
  ];

  const visibleNotifs = NOTIFS.filter(n => notifPrefs?.[n.category] !== false);

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

        {/* Cài đặt */}
        <button
          className={navItemClass(activeTab === "settings")}
          onClick={() => setActiveTab("settings")}
          title="Cài đặt"
        >
          <div className={navIconClass(activeTab === "settings")}><Settings size={18} /></div>
          <span className={collapsibleLabel}>Cài đặt</span>
        </button>

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
            {visibleNotifs.length === 0 ? (
              <p className="text-[0.72rem] text-[#94A3B8] text-center py-1.5 m-0">Bạn đã tắt hết thông báo trong Cài đặt.</p>
            ) : visibleNotifs.map(n => (
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
                <div className="text-[0.78rem] font-bold text-white truncate">{displayName || user?.name || "Người dùng"}</div>
                <div className="text-[0.63rem] text-white/60 truncate">{user?.email || ""}</div>
              </div>
            </div>

            {/* Shortcut to Cài đặt */}
            <button
              className={`${navItemClass(false)} !mx-0 !w-full !rounded-none border-t border-[#f1f5f9] max-md:dark:border-[#334155] md:!border-[#0F172A]`}
              onClick={() => { setAccountOpen(false); setActiveTab("settings"); }}
            >
              <div className={navIconClass(false)}><Settings size={16} /></div>
              <span className={`text-[0.8rem] ${collapsibleLabel}`}>Đi tới Cài đặt</span>
            </button>
          </div>
        )}

        {/* Đăng xuất — tách riêng, luôn hiện, không nằm trong dropdown Tài khoản */}
        <button
          className="w-full flex items-center gap-2.5 md:px-3 md:mx-2 md:w-[calc(100%-16px)] h-11 bg-transparent border-none cursor-pointer text-error text-[0.85rem] font-semibold text-left rounded-xl hover:bg-error/6 mt-1"
          onClick={onLogout}
          title="Đăng xuất"
        >
          <div className={navIconClass(false)}><LogOut size={16} /></div>
          <span className={collapsibleLabel}>Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
