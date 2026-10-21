import { Wallet, Receipt, Calculator, ShoppingCart } from "lucide-react";
import { useAdminSection } from "../useAdminSection";
import { SectionShell, KpiCard, KpiSkeleton, ChartSkeleton, TableSkeleton, ChartPanel, Panel, DataTable, EmptyState } from "../AdminUI";
import { computeDelta } from "../adminFormat";
import { formatVnd, formatCount } from "../adminRange";

const PLAN_LABELS = { monthly: "1 tháng", "6months": "6 tháng" };
const STATUS = {
  success: { label: "Thành công", className: "bg-[#D1FAE5] text-[#047857]" },
  pending: { label: "Đang chờ", className: "bg-[#FEF3C7] text-[#92400E]" },
  failed: { label: "Thất bại", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const timeVN = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const ORDER_COLUMNS = [
  { key: "created_at", label: "Thời gian", render: (r) => <span className="tabular-nums">{timeVN(r.created_at)}</span> },
  { key: "plan", label: "Gói", render: (r) => PLAN_LABELS[r.plan] || r.plan },
  { key: "amount", label: "Số tiền", align: "right", render: (r) => formatVnd(r.amount) },
  {
    key: "status",
    label: "Trạng thái",
    render: (r) => {
      const s = STATUS[r.status] || { label: r.status, className: "bg-[#F1F5F9] text-[#475569]" };
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-bold ${s.className}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}</span>;
    },
  },
  { key: "source", label: "Nguồn", render: (r) => r.source || <span className="text-text-muted">Trực tiếp</span> },
  { key: "email", label: "Email", render: (r) => r.email || <span className="text-text-muted">—</span> },
];

export default function RevenueSection({ range, refreshKey, onStatus }) {
  const state = useAdminSection("revenue", range, refreshKey);
  return (
    <SectionShell
      state={state}
      onStatus={onStatus}
      skeleton={<><KpiSkeleton count={3} /><ChartSkeleton /><TableSkeleton rows={6} /></>}
    >
      {({ days, sum, previous, orders }) => {
        const avg = sum.paid_orders ? sum.revenue / sum.paid_orders : 0;
        const prevAvg = previous?.paid_orders ? previous.revenue / previous.paid_orders : 0;
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <KpiCard icon={Wallet} tone="green" label="Doanh thu trong kỳ" value={formatVnd(sum.revenue)} delta={computeDelta(sum.revenue, previous?.revenue)} spark={days.map((d) => d.revenue)} />
              <KpiCard icon={Receipt} tone="amber" label="Đơn thành công" value={formatCount(sum.paid_orders)} delta={computeDelta(sum.paid_orders, previous?.paid_orders)} spark={days.map((d) => d.paid_orders)} />
              <KpiCard icon={Calculator} tone="blue" label="Giá trị trung bình / đơn" value={formatVnd(avg)} delta={sum.paid_orders && previous?.paid_orders ? computeDelta(avg, prevAvg) : null} hint={sum.paid_orders ? undefined : "Chưa có đơn trong kỳ"} />
            </div>
            <ChartPanel
              title="Doanh thu theo ngày"
              subtitle="Chỉ đơn thành công, không tính đơn giả lập ở môi trường dev, theo ngày tạo đơn"
              days={days}
              series={[{ key: "revenue", label: "Doanh thu", color: "#059669" }]}
              format={formatVnd}
              csvName="doanh-thu-theo-ngay"
              range={range}
            />
            {orders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Chưa có đơn hàng nào" text="Đơn hàng xuất hiện ở đây khi có người bấm thanh toán Premium." />
            ) : (
              <Panel title="20 đơn gần nhất" subtitle="Mọi trạng thái, không phụ thuộc khoảng ngày. Email đã che bớt; không hiển thị mã tài khoản hay mã giao dịch.">
                <DataTable columns={ORDER_COLUMNS} rows={orders} />
              </Panel>
            )}
          </div>
        );
      }}
    </SectionShell>
  );
}
