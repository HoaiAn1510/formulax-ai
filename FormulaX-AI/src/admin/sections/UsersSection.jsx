import { Users, UserPlus, Crown, CalendarClock } from "lucide-react";
import { useAdminSection } from "../useAdminSection";
import { SectionShell, KpiCard, KpiGrid, KpiSkeleton, ChartSkeleton, ChartPanel } from "../AdminUI";
import { computeDelta } from "../adminFormat";
import { formatCount } from "../adminRange";

export default function UsersSection({ range, refreshKey, onStatus }) {
  const state = useAdminSection("users", range, refreshKey);
  return (
    <SectionShell
      state={state}
      onStatus={onStatus}
      isEmpty={(d) => !d.totals}
      skeleton={<><KpiSkeleton /><div className="grid lg:grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div></>}
    >
      {({ totals: t, days, sum, previous, cumulative }) => (
        <div className="flex flex-col gap-4">
          <KpiGrid>
            <KpiCard icon={Users} tone="blue" label="Tổng tài khoản Google" value={formatCount(t.google_accounts_total)} hint="Không tính khách ẩn danh" spark={cumulative.map((d) => d.total_accounts)} />
            <KpiCard icon={UserPlus} tone="green" label="Tài khoản mới trong kỳ" value={formatCount(sum.new_accounts)} delta={computeDelta(sum.new_accounts, previous?.new_accounts)} spark={days.map((d) => d.new_accounts)} />
            <KpiCard icon={Crown} tone="violet" label="Premium đang hoạt động" value={formatCount(t.premium_active)} hint={`Gồm ${formatCount(t.premium_no_expiry)} tài khoản cấp tay không thời hạn`} />
            <KpiCard
              icon={CalendarClock}
              tone="amber"
              label="Hết hạn trong 7 ngày tới"
              value={formatCount(t.premium_expiring_7d)}
              hint={t.premium_expiring_7d > 0 ? "Nên nhắc gia hạn" : "Không có Premium sắp hết hạn"}
              highlight={t.premium_expiring_7d > 0}
            />
          </KpiGrid>
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartPanel title="Tài khoản mới theo ngày" days={days} series={[{ key: "new_accounts", label: "Tài khoản mới", color: "#2563EB" }]} csvName="tai-khoan-moi-theo-ngay" range={range} />
            <ChartPanel
              title="Tổng tài khoản tích luỹ"
              subtitle="Suy từ tổng hiện tại và số tài khoản mới mỗi ngày; chỉ tính tài khoản còn tồn tại"
              type="line"
              days={cumulative}
              series={[{ key: "total_accounts", label: "Tổng tài khoản", color: "#1E3A5F" }]}
              csvName="tong-tai-khoan-tich-luy"
              range={range}
            />
          </div>
        </div>
      )}
    </SectionShell>
  );
}
