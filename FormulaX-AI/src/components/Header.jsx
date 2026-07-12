import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, LogIn, Settings } from "lucide-react";

export default function Header({ user, isPremium, onLogout, onLogin, isLoggedIn, displayName, setActiveTab, notifications, onOpenNotifications }) {
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

  const notificationList = notifications || [];
  const hasUnread = notificationList.some(n => n.unread);

  return (
    <header className="sticky md:hidden top-0 z-[100] flex justify-between items-center py-3 px-4 bg-white dark:bg-[#1E293B] border-b border-[rgba(30,58,95,0.07)] dark:border-[#334155] shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
      {/* Logo — chỉ hiện trên mobile */}
      <div className="flex md:hidden items-center gap-2 text-primary dark:text-[#E2E8F0] whitespace-nowrap">
        <img src="/favicon.svg" alt="FormulaX" className="w-[30px] h-[30px] rounded-[7px]" />
        <span className="font-extrabold text-[1.15rem] tracking-[-0.5px]">FormulaX AI</span>
      </div>

      <div className="flex md:hidden items-center gap-3">

        {/* Bell */}
        <div ref={notifRef} className="relative">
          <button
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-primary dark:text-[#E2E8F0] cursor-pointer transition duration-200 hover:bg-[rgba(30,58,95,0.04)]"
            onClick={() => {
              setShowNotifications(p => !p);
              setDropdownOpen(false);
              if (!showNotifications) onOpenNotifications?.();
            }}
            title="Thông báo"
          >
            <Bell size={20} />
            {hasUnread && <span className="absolute top-[9px] right-[9px] w-2 h-2 rounded-full bg-error border-2 border-white" />}
          </button>

          {showNotifications && (
            <div
              className="fixed top-[68px] right-3 p-2.5 z-[1000] max-h-[260px] overflow-y-auto bg-white rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.14)] border border-[#E2E8F0]"
              style={{ width: "min(260px, calc(100vw - 24px))" }}
            >
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#f1f5f9]">
                <span className="text-[0.8rem] font-bold text-[#1E3A5F]">Thông báo</span>
                <button onClick={() => setShowNotifications(false)}
                  className="bg-transparent border-none text-[0.7rem] text-[#2E86DE] cursor-pointer font-semibold">
                  Đóng
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {notificationList.length === 0 ? (
                  <p className="text-[0.75rem] text-[#94A3B8] text-center py-2 m-0">Chưa có thông báo nào.</p>
                ) : notificationList.map((n) => (
                  <div key={n.id} className={`px-2 py-1.5 rounded-md text-[0.75rem] leading-[1.3] border-l-[3px] ${n.unread ? "bg-[rgba(46,134,222,0.05)] border-l-[#2E86DE]" : "bg-transparent border-l-transparent"}`}>
                    <div className={`text-[#1E3A5F] ${n.unread ? "font-semibold" : "font-normal"}`}>{n.text}</div>
                    <div className="text-[#94A3B8] text-[0.65rem] mt-0.5">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div ref={dropdownRef} className="relative">
          <button
            className="bg-primary dark:bg-[#334155] text-white dark:text-[#E2E8F0] border-none rounded-full font-bold text-[0.8rem] py-1.5 px-4 inline-flex items-center gap-1.5 cursor-pointer transition duration-200 min-h-9 hover:-translate-y-px hover:bg-[#11223b] dark:hover:bg-[#334155]"
            onClick={() => { setDropdownOpen(p => !p); setShowNotifications(false); }}
          >
            {isLoggedIn && user?.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-[18px] h-[18px] rounded-full object-cover" />
            ) : (
              <LogIn size={14} />
            )}
            <span>{isLoggedIn ? "Tài khoản" : "Đăng nhập"}</span>
            {isPremium && (
              <span className="text-[0.6rem] bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-white py-px px-1 rounded-[3px] font-bold">PRO</span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="fixed top-[68px] right-3 p-0 z-[1000] overflow-hidden bg-white rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.14)] border border-[#E2E8F0]"
              style={{ width: "min(230px, calc(100vw - 24px))" }}
            >

              {/* Header card */}
              <div className="py-3.5 px-4 bg-[linear-gradient(135deg,#1E3A5F_0%,#2563EB_100%)] flex items-center gap-3">
                {user?.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-[42px] h-[42px] rounded-full object-cover border-2 border-white/35 shrink-0" />
                ) : (
                  <div className="w-[42px] h-[42px] rounded-full bg-white/20 flex items-center justify-center text-[1.2rem] font-extrabold text-white shrink-0">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[0.82rem] font-extrabold text-white truncate">
                    {displayName || user?.name || "Người dùng"}
                  </div>
                  <div className="text-[0.66rem] text-white/60 mt-0.5 truncate">
                    {user?.email || ""}
                  </div>
                </div>
              </div>

              {/* Cài đặt */}
              {isLoggedIn && (
                <button
                  onClick={() => { setDropdownOpen(false); setActiveTab?.("settings"); }}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3.5 bg-transparent border-none border-b border-[#f1f5f9] cursor-pointer text-left"
                >
                  <Settings size={15} color="#64748B" />
                  <span className="text-[0.82rem] text-[#1E3A5F] font-semibold">Cài đặt</span>
                </button>
              )}

              {/* Logout button */}
              <div className="p-2.5">
                <button
                  onClick={() => { setDropdownOpen(false); isLoggedIn ? onLogout() : onLogin?.(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[linear-gradient(135deg,#EF4444,#DC2626)] text-white border-none rounded-[9px] cursor-pointer text-[0.83rem] font-bold shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
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
