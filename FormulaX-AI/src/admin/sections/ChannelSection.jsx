import { useAdminSection } from "../useAdminSection";
import { SectionShell, DataTable } from "../AdminUI";
import { formatVnd, formatPercent } from "../adminRange";

const n = (v) => v.toLocaleString("vi-VN");

const COLUMNS = [
  { key: "source", label: "Nguồn" },
  { key: "visits", label: "Lượt truy cập", align: "right", render: (r) => n(r.visits) },
  { key: "signups", label: "Đăng ký", align: "right", render: (r) => n(r.signups) },
  { key: "paid_users", label: "Người trả tiền", align: "right", render: (r) => n(r.paid_users) },
  { key: "revenue", label: "Doanh thu", align: "right", render: (r) => formatVnd(r.revenue) },
  { key: "signup_rate", label: "Đăng ký / Truy cập", align: "right", render: (r) => formatPercent(r.signup_rate) },
  { key: "paid_rate", label: "Trả tiền / Đăng ký", align: "right", render: (r) => formatPercent(r.paid_rate) },
];

export default function ChannelSection({ range }) {
  const state = useAdminSection("channel-stats", range);
  return (
    <SectionShell
      title="Kênh giới thiệu"
      note='Lượt truy cập: 1 lần/trình duyệt/ngày cho mỗi kênh. Tài khoản cũ và người mở app không qua link có ref được tính là "direct", nên tỉ lệ trả tiền của "direct" có thể lớn hơn 100%.'
      state={state}
      isEmpty={(d) => d.rows.length === 0}
      emptyText="Chưa có lượt truy cập hay đăng ký nào trong khoảng ngày này."
    >
      {(d) => <DataTable columns={COLUMNS} rows={d.rows} rowKey={(r) => r.source} footer={d.total} />}
    </SectionShell>
  );
}
