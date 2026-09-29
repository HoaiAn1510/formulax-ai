import { useState } from "react";
import { ArrowLeft, Moon, Sun, Pencil, Check, X, GraduationCap, Crown, Bell, Sparkles, FileText, ShieldCheck, Lock, UserRound } from "lucide-react";
import LegalModal from "../components/LegalModal";
import GuestLockNotice from "../components/GuestLockNotice";
import { useGuestGate } from "../utils/useGuestGate";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";

// Nút "đã khóa" đặt vào chỗ control của một dòng cài đặt — khách vẫn thấy tùy chọn tồn tại.
function LockedControl({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="py-1.5 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[0.78rem] font-bold text-text-muted dark:text-[#94A3B8] cursor-pointer inline-flex items-center gap-1"
    >
      <Lock size={12} className="text-accent" />
      {label}
    </button>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 shrink-0 border-none cursor-pointer ${on ? "bg-accent" : "bg-[#CBD5E1] dark:bg-[#334155]"}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${on ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}

function SettingRow({ icon, label, description, control }) {
  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 border-b border-[#F1F5F9] dark:border-[#334155] last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center text-primary dark:text-[#E2E8F0] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0]">{label}</div>
        {description && <div className="text-[0.72rem] text-text-muted dark:text-[#94A3B8] mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsView({
  user,
  setActiveTab,
  darkMode, setDarkMode,
  displayName, onSetDisplayName,
  userGrade, onSetUserGrade,
  isPremium,
  notifPrefs, onSetNotifPrefs,
}) {
  // Khách: giao diện sáng/tối và pháp lý vẫn dùng được; tên hiển thị, lớp học, thông báo là dữ
  // liệu theo tài khoản nên khóa.
  const { isGuest, promptLogin } = useGuestGate();
  const { loginWithGoogle } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName || "");
  const [legalDoc, setLegalDoc] = useState(null); // "terms" | "privacy" | null

  const handleGuestLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Đăng nhập Google thất bại:", err);
      showToast("Đăng nhập Google thất bại. Vui lòng thử lại.", "error");
    }
  };

  const handleSaveName = () => {
    onSetDisplayName?.(nameInput.trim());
    setEditingName(false);
  };

  const toggleNotifPref = (key) => {
    const currentlyOn = notifPrefs?.[key] !== false;
    onSetNotifPrefs?.({ ...notifPrefs, [key]: !currentlyOn });
  };

  return (
    <div className="view-container">
      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1] md:max-w-2xl md:mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button aria-label="Về trang chủ"
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-[#F1F5F9] dark:bg-[#334155] border-none cursor-pointer text-primary dark:text-[#E2E8F0]"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="m-0 text-[1.15rem] font-extrabold text-primary dark:text-[#E2E8F0]">
                Cài đặt
              </h1>
              <p className="m-0 text-[0.72rem] text-text-muted dark:text-[#94A3B8]">
                Quản lý tài khoản và tuỳ chỉnh trải nghiệm học tập
              </p>
            </div>
          </div>

          {/* Identity card */}
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-[linear-gradient(135deg,#1E3A5F_0%,#2563EB_100%)] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
            {isGuest ? (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                <UserRound size={22} />
              </div>
            ) : user?.picture ? (
              <img src={user.picture} referrerPolicy="no-referrer" alt="" className="w-12 h-12 rounded-full border-2 border-white/35 object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-extrabold text-white shrink-0">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.92rem] font-extrabold text-white truncate">
                  {isGuest ? "Khách" : displayName || user?.name || "Người dùng"}
                </span>
                {isPremium && (
                  <span className="text-[0.55rem] bg-[linear-gradient(135deg,#D97706,#F59E0B)] text-white py-px px-1.5 rounded-[4px] font-bold shrink-0">PRO</span>
                )}
              </div>
              <div className="text-[0.72rem] text-white/65 truncate">
                {isGuest ? "Chưa đăng nhập — dữ liệu không được lưu" : user?.email || ""}
              </div>
            </div>
          </div>

          {/* Tuỳ chỉnh chung */}
          <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-4">
            <h2 className="m-0 mb-1 text-[0.8rem] font-extrabold text-text-muted dark:text-[#94A3B8] uppercase tracking-[0.05em]">Chung</h2>

            <SettingRow
              icon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
              label="Giao diện"
              description={darkMode ? "Đang dùng giao diện tối" : "Đang dùng giao diện sáng"}
              control={<ToggleSwitch on={darkMode} onClick={() => setDarkMode?.(!darkMode)} />}
            />

            <SettingRow
              icon={<Pencil size={16} />}
              label="Tên hiển thị"
              description={isGuest
                ? "Đăng nhập Google để đặt tên hiển thị"
                : editingName ? undefined : (displayName ? `Đang hiển thị: ${displayName}` : "Chưa đặt tên hiển thị")}
              control={
                isGuest ? (
                  <LockedControl label="Sửa" onClick={() => promptLogin()} />
                ) : editingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                      placeholder="Nhập tên hiển thị..."
                      autoFocus
                      className="py-1.5 px-2.5 rounded-lg border-[1.5px] border-accent text-[0.8rem] outline-none w-32 bg-white dark:bg-[#0F172A] text-primary dark:text-[#E2E8F0]"
                    />
                    <button aria-label="Lưu tên hiển thị" onClick={handleSaveName} className="py-1.5 px-2 border-none rounded-lg cursor-pointer bg-success text-white flex items-center"><Check size={13} /></button>
                    <button aria-label="Huỷ đổi tên" onClick={() => setEditingName(false)} className="py-1.5 px-2 border-none rounded-lg cursor-pointer bg-[#F1F5F9] dark:bg-[#334155] text-text-muted dark:text-[#94A3B8] flex items-center"><X size={13} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(displayName || ""); setEditingName(true); }}
                    className="py-1.5 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[0.78rem] font-bold text-primary dark:text-[#E2E8F0] cursor-pointer"
                  >
                    Sửa
                  </button>
                )
              }
            />

            <SettingRow
              icon={<GraduationCap size={16} />}
              label="Lớp học"
              description={isGuest
                ? "Đăng nhập Google để lưu lớp học và nhận gợi ý phù hợp"
                : "FormulaX ưu tiên gợi ý công thức phù hợp với lớp của bạn"}
              control={
                isGuest ? (
                  <LockedControl label="Chọn lớp" onClick={() => promptLogin()} />
                ) : (
                <div className="flex gap-1.5">
                  {[10, 11, 12].map(g => (
                    <button
                      key={g}
                      onClick={() => onSetUserGrade?.(g)}
                      className={`w-9 h-9 rounded-lg text-[0.8rem] font-extrabold border-[1.5px] cursor-pointer transition duration-200 ${
                        userGrade === g
                          ? "bg-accent border-accent text-white"
                          : "bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                )
              }
            />
          </div>

          {/* Gói của bạn */}
          <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-4">
            <h2 className="m-0 mb-1 text-[0.8rem] font-extrabold text-text-muted dark:text-[#94A3B8] uppercase tracking-[0.05em]">Gói của bạn</h2>
            <SettingRow
              icon={<Crown size={16} />}
              label={isGuest ? "Chế độ khách" : isPremium ? "Premium" : "Miễn phí"}
              description={isGuest
                ? "Đăng nhập Google để dùng AI, lưu tiến độ và nâng cấp Premium"
                : isPremium ? "Bạn đang là thành viên Premium — không giới hạn tính năng" : "Nâng cấp để mở khoá toàn bộ tính năng học tập"}
              control={
                isGuest ? (
                  <button
                    onClick={handleGuestLogin}
                    className="py-1.5 px-3 rounded-lg border-none bg-accent hover:bg-accent-hover text-white text-[0.78rem] font-bold cursor-pointer transition-colors duration-200"
                  >
                    Đăng nhập
                  </button>
                ) : isPremium ? (
                  <button
                    onClick={() => setActiveTab("premium")}
                    className="text-[0.7rem] font-bold text-success bg-success/8 py-1.5 px-3 rounded-lg inline-flex items-center gap-1 border-none cursor-pointer"
                  >
                    <Sparkles size={12} /> Đang dùng
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("premium")}
                    className="py-1.5 px-3 rounded-lg border-none bg-accent text-white text-[0.78rem] font-bold cursor-pointer"
                  >
                    Nâng cấp
                  </button>
                )
              }
            />
          </div>

          {/* Thông báo */}
          <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 mb-4">
            <h2 className="m-0 mb-1 text-[0.8rem] font-extrabold text-text-muted dark:text-[#94A3B8] uppercase tracking-[0.05em]">Thông báo</h2>
            {isGuest ? (
              <GuestLockNotice
                className="mt-2"
                title="Đăng nhập Google để nhận thông báo học tập"
                description="Nhắc giữ chuỗi học, gợi ý ôn chủ đề yếu và thành tích mới — tính từ tiến độ đã lưu."
                onClick={() => promptLogin()}
              />
            ) : (
              <>
                <SettingRow
                  icon={<Bell size={16} />}
                  label="Nhắc giữ chuỗi học"
                  description="Nhắc khi còn chuỗi học nhưng hôm nay chưa ôn gì"
                  control={<ToggleSwitch on={notifPrefs?.streak !== false} onClick={() => toggleNotifPref("streak")} />}
                />
                <SettingRow
                  icon={<Bell size={16} />}
                  label="Gợi ý ôn chủ đề yếu"
                  description="Thông báo khi có chủ đề quiz đang dưới 60% đúng"
                  control={<ToggleSwitch on={notifPrefs?.weakTopic !== false} onClick={() => toggleNotifPref("weakTopic")} />}
                />
                <SettingRow
                  icon={<Bell size={16} />}
                  label="Chào mừng / thành tích mới"
                  description="Thông báo khi đạt mốc streak hoặc hoàn thành quiz đầu tiên"
                  control={<ToggleSwitch on={notifPrefs?.milestone !== false} onClick={() => toggleNotifPref("milestone")} />}
                />
              </>
            )}
          </div>

          {/* Pháp lý — bắt buộc phải tiếp cận được sau khi đăng nhập, không chỉ ở màn đăng nhập:
              người dùng cần đọc lại chính sách và biết cách yêu cầu xoá dữ liệu bất cứ lúc nào. */}
          <div className="glass-card p-4 dark:bg-[#1E293B] dark:border-[#334155] mt-4">
            <h2 className="m-0 mb-1 text-[0.8rem] font-extrabold text-text-muted dark:text-[#94A3B8] uppercase tracking-[0.05em]">Pháp lý</h2>
            <SettingRow
              icon={<FileText size={16} />}
              label="Điều khoản dịch vụ"
              description="Quy định sử dụng, thanh toán và hoàn tiền"
              control={
                <button
                  onClick={() => setLegalDoc("terms")}
                  aria-label="Mở Điều khoản dịch vụ"
                  className="bg-transparent border-none cursor-pointer text-accent text-[0.8rem] font-bold"
                >
                  Xem
                </button>
              }
            />
            <SettingRow
              icon={<ShieldCheck size={16} />}
              label="Chính sách bảo mật"
              description="Dữ liệu được thu thập, dùng vào việc gì và cách yêu cầu xoá"
              control={
                <button
                  onClick={() => setLegalDoc("privacy")}
                  aria-label="Mở Chính sách bảo mật"
                  className="bg-transparent border-none cursor-pointer text-accent text-[0.8rem] font-bold"
                >
                  Xem
                </button>
              }
            />
          </div>
        </div>
      </div>

      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
