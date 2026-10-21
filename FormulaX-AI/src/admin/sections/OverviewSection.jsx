import { useAdminSection } from "../useAdminSection";
import { SectionShell, StatCard, StatGrid } from "../AdminUI";
import { formatVnd } from "../adminRange";

export default function OverviewSection({ range }) {
  const state = useAdminSection("overview", range);
  return (
    <SectionShell
      title="Tổng quan"
      note="Tài khoản mới và doanh thu tính theo khoảng ngày đã chọn; lượt AI Finder và quét ảnh tính cho hôm nay (giờ Việt Nam)."
      state={state}
      isEmpty={(d) => !d.overview}
    >
      {({ overview: o }) => (
        <StatGrid>
          <StatCard label="Tài khoản mới" value={o.new_accounts.toLocaleString("vi-VN")} hint="Tài khoản Google, không tính khách" />
          <StatCard
            label="Premium đang hoạt động"
            value={o.premium_active.toLocaleString("vi-VN")}
            hint="Tính cả tài khoản cấp tay không thời hạn (vd tài khoản demo)"
          />
          <StatCard label="Doanh thu trong kỳ" value={formatVnd(o.revenue_total)} hint={`${o.paid_orders.toLocaleString("vi-VN")} đơn thành công`} />
          <StatCard label="Lượt AI Finder hôm nay" value={o.ai_turns_today.toLocaleString("vi-VN")} hint="Free + Premium" />
          <StatCard label="Lượt quét ảnh hôm nay" value={o.ocr_scans_today.toLocaleString("vi-VN")} />
        </StatGrid>
      )}
    </SectionShell>
  );
}
