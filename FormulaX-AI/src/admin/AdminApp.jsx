import { useEffect, useMemo, useState } from "react";
import { LogOut, LayoutDashboard, Share2, Users, Wallet, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RANGE_PRESETS, computeRange, todayVN, formatDay } from "./adminRange";
import OverviewSection from "./sections/OverviewSection";
import ChannelSection from "./sections/ChannelSection";
import UsersSection from "./sections/UsersSection";
import RevenueSection from "./sections/RevenueSection";
import UsageSection from "./sections/UsageSection";

const TABS = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, Section: OverviewSection },
  { id: "channel", label: "Kênh giới thiệu", icon: Share2, Section: ChannelSection },
  { id: "users", label: "Người dùng & Premium", icon: Users, Section: UsersSection },
  { id: "revenue", label: "Doanh thu & đơn hàng", icon: Wallet, Section: RevenueSection },
  { id: "usage", label: "Sử dụng AI", icon: Sparkles, Section: UsageSection },
];

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
  const range = useMemo(() => computeRange(preset, openedAt, custom), [preset, openedAt, custom]);
  const { Section } = TABS.find((t) => t.id === tab);

  // App học sinh có thể đã gắn class dark-mode lên <html> trước khi chuyển sang đây.
  useEffect(() => {
    document.documentElement.classList.remove("dark-mode");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-primary">
      <header className="bg-sidebar text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-extrabold leading-tight">FormulaX · Quản trị</p>
            <p className="text-[0.75rem] text-[#CBD5E1] truncate">{user?.name}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.82rem] font-bold text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto" aria-label="Mục quản trị">
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
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[0.82rem] font-bold whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? "border-accent text-white" : "border-transparent text-[#CBD5E1] hover:text-white"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Khoảng ngày">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`px-3 py-1.5 rounded-full text-[0.8rem] font-bold border transition-colors ${
                  preset === p.id
                    ? "bg-accent border-accent text-white"
                    : "bg-white border-[#E5E7EB] text-primary hover:border-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2 text-[0.82rem]">
              <label className="flex items-center gap-1.5">
                Từ
                <input
                  type="date"
                  value={custom.from}
                  onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                  className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white"
                />
              </label>
              <label className="flex items-center gap-1.5">
                đến
                <input
                  type="date"
                  value={custom.to}
                  onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                  className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white"
                />
              </label>
            </div>
          )}
          <p className="text-[0.78rem] text-text-muted">
            {range.error ? <span className="text-error font-semibold">{range.error}</span> : `Từ ${formatDay(range.from, true)} đến ${formatDay(range.to, true)} (giờ Việt Nam)`}
          </p>
        </div>

        <Section key={tab} range={range} />
      </main>
    </div>
  );
}
