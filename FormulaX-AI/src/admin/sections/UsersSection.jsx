import { useAdminSection } from "../useAdminSection";
import { SectionShell, StatCard, StatGrid, DayBars } from "../AdminUI";

const n = (v) => v.toLocaleString("vi-VN");

export default function UsersSection({ range }) {
  const state = useAdminSection("users", range);
  return (
    <SectionShell title="Người dùng & Premium" note="Chỉ tính tài khoản Google, không tính khách ẩn danh." state={state} isEmpty={(d) => !d.totals}>
      {({ totals: t, days, sum }) => (
        <div className="flex flex-col gap-4">
          <StatGrid>
            <StatCard label="Tổng tài khoản Google" value={n(t.google_accounts_total)} />
            <StatCard label="Tài khoản mới trong kỳ" value={n(sum.new_accounts)} />
            <StatCard
              label="Premium đang hoạt động"
              value={n(t.premium_active)}
              hint={`Gồm ${n(t.premium_no_expiry)} tài khoản cấp tay không thời hạn (vd tài khoản demo)`}
            />
            <StatCard label="Hết hạn trong 7 ngày tới" value={n(t.premium_expiring_7d)} hint="Premium có ngày hết hạn trong 7 ngày tới" />
          </StatGrid>
          <DayBars title="Tài khoản mới theo ngày" days={days} valueKey="new_accounts" />
        </div>
      )}
    </SectionShell>
  );
}
