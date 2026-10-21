import { useAdminSection } from "../useAdminSection";
import { SectionShell, StatCard, StatGrid, DayBars, DataTable } from "../AdminUI";
import { formatVnd } from "../adminRange";

const PLAN_LABELS = { monthly: "1 tháng", "6months": "6 tháng" };
const STATUS = {
  success: { label: "Thành công", className: "bg-[#D1FAE5] text-[#047857]" },
  pending: { label: "Chờ thanh toán", className: "bg-accent-light text-accent-hover" },
  failed: { label: "Thất bại", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const timeVN = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const ORDER_COLUMNS = [
  { key: "created_at", label: "Thời gian", render: (r) => timeVN(r.created_at) },
  { key: "plan", label: "Gói", render: (r) => PLAN_LABELS[r.plan] || r.plan },
  { key: "amount", label: "Số tiền", align: "right", render: (r) => formatVnd(r.amount) },
  {
    key: "status",
    label: "Trạng thái",
    render: (r) => {
      const s = STATUS[r.status] || { label: r.status, className: "bg-[#F1F5F9] text-text-muted" };
      return <span className={`inline-block px-2 py-0.5 rounded-full text-[0.72rem] font-bold ${s.className}`}>{s.label}</span>;
    },
  },
  { key: "source", label: "Nguồn", render: (r) => r.source || "—" },
  { key: "email", label: "Email", render: (r) => r.email || "—" },
];

export default function RevenueSection({ range }) {
  const state = useAdminSection("revenue", range);
  return (
    <SectionShell
      title="Doanh thu & đơn hàng"
      note="Doanh thu chỉ tính đơn thành công, không tính đơn giả lập ở môi trường dev, theo ngày tạo đơn (giờ Việt Nam)."
      state={state}
    >
      {({ days, sum, orders }) => (
        <div className="flex flex-col gap-4">
          <StatGrid>
            <StatCard label="Doanh thu trong kỳ" value={formatVnd(sum.revenue)} />
            <StatCard label="Đơn thành công" value={sum.paid_orders.toLocaleString("vi-VN")} />
          </StatGrid>
          <DayBars title="Doanh thu theo ngày" days={days} valueKey="revenue" format={formatVnd} />
          <div className="flex flex-col gap-2">
            <h3 className="text-[0.9rem] font-bold text-primary">20 đơn gần nhất</h3>
            {orders.length === 0 ? (
              <p className="text-[0.85rem] text-text-muted">Chưa có đơn hàng nào.</p>
            ) : (
              <DataTable columns={ORDER_COLUMNS} rows={orders} />
            )}
            <p className="text-[0.75rem] text-text-muted">Email đã che bớt; không hiển thị mã tài khoản hay mã giao dịch.</p>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
