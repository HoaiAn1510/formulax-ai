import { UserPlus, Wallet, Receipt, Crown, Sparkles, ScanLine, Gauge, Share2 } from "lucide-react";
import { useAdminSection } from "../useAdminSection";
import { SectionShell, KpiCard, KpiGrid, KpiSkeleton, ChartSkeleton, TableSkeleton, ChartPanel, Panel } from "../AdminUI";
import { computeDelta, groupChannels } from "../adminFormat";
import { formatVnd, formatCount } from "../adminRange";

const ACTIVITY_TONE = {
  normal: "bg-[#F8FAFC] border-[#E5E7EB]",
  warn: "bg-[#FFFBEB] border-[#FCD34D]",
  danger: "bg-[#FEF2F2] border-[#FCA5A5]",
};

function ActivityTile({ icon: Icon, label, value, level = "normal", note }) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1 min-w-0 ${ACTIVITY_TONE[level]}`}>
      <span className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#475569]"><Icon size={14} /> {label}</span>
      <span className={`text-[1.3rem] font-extrabold tabular-nums ${level === "danger" ? "text-[#B91C1C]" : level === "warn" ? "text-accent-hover" : "text-primary"}`}>{formatCount(value)}</span>
      {note && <span className="text-[0.7rem] text-text-muted leading-snug">{note}</span>}
    </div>
  );
}

export default function OverviewSection({ range, refreshKey, onStatus, goTo }) {
  const state = useAdminSection("overview", range, refreshKey);
  return (
    <SectionShell
      state={state}
      onStatus={onStatus}
      isEmpty={(d) => !d.overview}
      skeleton={<><KpiSkeleton /><div className="grid lg:grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div><div className="grid lg:grid-cols-2 gap-4"><TableSkeleton rows={3} /><TableSkeleton rows={3} /></div></>}
    >
      {({ overview: o, previous: p, days, channels, today }) => {
        const top = groupChannels(channels).filter((g) => !g.isDirect && g.visits > 0).sort((a, b) => b.visits - a.visits).slice(0, 3);
        const maxVisits = Math.max(1, ...top.map((g) => g.visits));
        const t = today || {};
        const aiToday = (t.ai_free_turns || 0) + (t.ai_premium_turns || 0);
        const atLimit = (t.ai_users_at_limit || 0) + (t.ocr_users_at_limit || 0);
        return (
          <div className="flex flex-col gap-4">
            <KpiGrid>
              <KpiCard icon={UserPlus} tone="blue" label="Tài khoản mới" value={formatCount(o.new_accounts)} delta={computeDelta(o.new_accounts, p?.new_accounts)} spark={days.map((d) => d.new_accounts || 0)} />
              <KpiCard icon={Wallet} tone="green" label="Doanh thu" value={formatVnd(o.revenue_total)} delta={computeDelta(o.revenue_total, p?.revenue_total)} spark={days.map((d) => d.revenue || 0)} />
              <KpiCard icon={Receipt} tone="amber" label="Đơn thành công" value={formatCount(o.paid_orders)} delta={computeDelta(o.paid_orders, p?.paid_orders)} spark={days.map((d) => d.paid_orders || 0)} />
              <KpiCard icon={Crown} tone="violet" label="Premium đang hoạt động" value={formatCount(o.premium_active)} hint="Hiện tại, gồm cả tài khoản cấp tay không thời hạn" />
            </KpiGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <ChartPanel title="Tài khoản mới theo ngày" days={days} series={[{ key: "new_accounts", label: "Tài khoản mới", color: "#2563EB" }]} onMore={() => goTo("users")} />
              <ChartPanel title="Doanh thu theo ngày" days={days} series={[{ key: "revenue", label: "Doanh thu", color: "#059669" }]} format={formatVnd} onMore={() => goTo("revenue")} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Panel title="Top kênh" subtitle="3 kênh có nhiều lượt truy cập nhất (không tính truy cập trực tiếp)" onMore={() => goTo("channel")}>
                {top.length === 0 ? (
                  <p className="flex items-center gap-2 text-[0.82rem] text-text-muted py-4"><Share2 size={16} /> Chưa có lượt nào từ link có ref trong khoảng ngày đã chọn.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {top.map((g) => (
                      <li key={g.root} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2 text-[0.82rem]">
                          <span className="flex items-center gap-2 font-semibold text-primary min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                            <span className="truncate">{g.label}</span>
                          </span>
                          <span className="tabular-nums text-[#475569] shrink-0">{formatCount(g.visits)} truy cập · {formatCount(g.signups)} đăng ký</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(g.visits / maxVisits) * 100}%`, background: g.color }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Hoạt động hôm nay" subtitle="Theo giờ Việt Nam, không phụ thuộc khoảng ngày đã chọn" onMore={() => goTo("usage")}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <ActivityTile icon={Sparkles} label="Lượt AI Finder" value={aiToday} note={`Free ${formatCount(t.ai_free_turns)} · Premium ${formatCount(t.ai_premium_turns)}`} />
                  <ActivityTile icon={ScanLine} label="Lượt quét ảnh" value={t.ocr_scans || 0} />
                  <ActivityTile icon={Gauge} label="Chạm giới hạn" value={atLimit} level={atLimit > 0 ? "warn" : "normal"} note="Tài khoản dùng hết lượt AI hoặc quét ảnh" />
                </div>
              </Panel>
            </div>
          </div>
        );
      }}
    </SectionShell>
  );
}
