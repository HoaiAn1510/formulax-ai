import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, LayoutDashboard, Share2, Users, Wallet, Sparkles, RefreshCw, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RANGE_PRESETS, computeRange, todayVN, formatDay } from "./adminRange";
import { maskEmail, initialOf } from "./adminFormat";
import OverviewSection from "./sections/OverviewSection";
import ChannelSection from "./sections/ChannelSection";
import UsersSection from "./sections/UsersSection";
import RevenueSection from "./sections/RevenueSection";
import UsageSection from "./sections/UsageSection";
import { FOCUS } from "./adminStyle";

const TABS = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, Section: OverviewSection },
  { id: "channel", label: "Kênh giới thiệu", icon: Share2, Section: ChannelSection },
  { id: "users", label: "Người dùng & Premium", icon: Users, Section: UsersSection },
  { id: "revenue", label: "Doanh thu & đơn hàng", icon: Wallet, Section: RevenueSection },
  { id: "usage", label: "Sử dụng AI", icon: Sparkles, Section: UsageSection },
];

const timeHM = (ms) => new Date(ms).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });

/**
 * Trang quản trị — chỉ xem số liệu, không sửa dữ liệu. RootGate chỉ hiện trang này khi backend xác
 * nhận email nằm trong ADMIN_EMAILS; mọi số liệu backend kiểm tra quyền lại ở từng request.
 * Chỉ có giao diện sáng; không có đường sang app học sinh (đăng xuất rồi đăng nhập tài khoản khác).
 */
export default function AdminApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [preset, setPreset] = useState("30d");
  // Mốc "hôm nay" lấy một lần lúc mở trang; để qua đêm thì tải lại trang để sang ngày mới.
  const [openedAt] = useState(() => Date.now());
  const [custom, setCustom] = useState(() => {
    const today = todayVN(openedAt);
    return { from: `${today.slice(0, 7)}-01`, to: today };
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState({ loading: true, loadedAt: null });
  const onStatus = useCallback((s) => setStatus(s), []);
  const range = useMemo(() => computeRange(preset, openedAt, custom), [preset, openedAt, custom]);
  const { Section } = TABS.find((t) => t.id === tab);
  const email = maskEmail(user?.email);

  const goTo = useCallback((id) => {
    setTab(id);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  // App học sinh có thể đã gắn class dark-mode lên <html> trước khi chuyển sang đây.
  useEffect(() => {
    document.documentElement.classList.remove("dark-mode");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-primary">
      <header className="bg-sidebar text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3 flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-extrabold leading-tight">FormulaX</p>
            <p className="text-[0.72rem] text-[#CBD5E1] leading-tight">Trang quản trị · chỉ xem</p>
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-accent text-primary font-extrabold text-[0.85rem] flex items-center justify-center shrink-0" aria-hidden="true">
              {initialOf(user?.name, user?.email)}
            </span>
            <span className="hidden sm:block text-[0.8rem] text-[#E2E8F0] truncate max-w-[220px]" title={email}>{email}</span>
            <button
              type="button"
              onClick={logout}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[0.8rem] font-semibold text-[#E2E8F0] hover:bg-white/10 hover:text-white transition-colors ${FOCUS} focus-visible:ring-offset-sidebar`}
            >
              <LogOut size={15} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
        <nav className="max-w-[1280px] mx-auto px-2 sm:px-4 mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Mục quản trị">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                setTab(id);
                // Trên điện thoại thanh mục cuộn ngang — kéo mục vừa chọn vào tầm nhìn.
                e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest" });
              }}
              aria-current={tab === id ? "page" : undefined}
              className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-[0.83rem] font-semibold whitespace-nowrap transition-colors rounded-t-md ${FOCUS} focus-visible:ring-offset-sidebar ${
                tab === id ? "text-white" : "text-[#CBD5E1] hover:text-white"
              }`}
            >
              <Icon size={15} /> {label}
              <span className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full ${tab === id ? "bg-accent" : "bg-transparent"}`} />
            </button>
          ))}
        </nav>
      </header>

      <div className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="inline-flex p-0.5 rounded-xl bg-[#E2E8F0]" role="group" aria-label="Khoảng ngày">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`px-3 h-8 rounded-[10px] text-[0.8rem] font-semibold transition-colors ${FOCUS} ${
                  preset === p.id ? "bg-white text-primary shadow-sm" : "text-[#475569] hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-1.5 text-[0.8rem]">
              <CalendarDays size={15} className="text-text-muted" />
              <input
                type="date"
                aria-label="Từ ngày"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className={`h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-primary ${FOCUS}`}
              />
              <span className="text-text-muted">–</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className={`h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-primary ${FOCUS}`}
              />
            </div>
          )}

          <p className="text-[0.78rem] text-[#475569]">
            {range.error ? <span className="text-[#B91C1C] font-semibold">{range.error}</span> : `${formatDay(range.from, true)} – ${formatDay(range.to, true)}`}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[0.75rem] text-[#475569] tabular-nums" aria-live="polite">
              {status.loading ? "Đang tải…" : status.loadedAt ? `Cập nhật lúc ${timeHM(status.loadedAt)}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={status.loading}
              aria-label="Làm mới số liệu"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-60 transition-colors ${FOCUS}`}
            >
              <RefreshCw size={15} className={status.loading ? "motion-safe:animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <Section key={tab} range={range} refreshKey={refreshKey} onStatus={onStatus} goTo={goTo} />
      </main>
    </div>
  );
}
