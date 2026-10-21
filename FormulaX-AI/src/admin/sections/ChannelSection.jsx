import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Share2 } from "lucide-react";
import { useAdminSection } from "../useAdminSection";
import { SectionShell, Panel, CsvButton, InfoTip, TableSkeleton, ChartSkeleton } from "../AdminUI";
import { groupChannels, sortChannels } from "../adminFormat";
import { formatVnd, formatPercent, formatCount } from "../adminRange";
import { FOCUS } from "../adminStyle";

const COLUMNS = [
  { key: "label", label: "Kênh", align: "left" },
  { key: "visits", label: "Lượt truy cập" },
  { key: "signups", label: "Đăng ký" },
  { key: "paid_users", label: "Người trả tiền" },
  { key: "revenue", label: "Doanh thu" },
  { key: "signup_rate", label: "Đăng ký / Truy cập" },
  { key: "paid_rate", label: "Trả tiền / Đăng ký" },
];

const DIRECT_TIP = "Gồm người mở app không qua link có ref và mọi tài khoản tạo trước khi có theo dõi kênh. Người dùng cũ mua Premium được tính vào đây nhưng không được đếm là đăng ký mới trong kỳ, nên tỉ lệ trả tiền / đăng ký có thể vượt 100%.";

const CSV_COLUMNS = [
  { key: "group", label: "Kênh" },
  { key: "source", label: "Ref" },
  { key: "visits", label: "Lượt truy cập" },
  { key: "signups", label: "Đăng ký" },
  { key: "paid_users", label: "Người trả tiền" },
  { key: "revenue", label: "Doanh thu (đ)" },
  { key: "signup_rate", label: "Đăng ký / Truy cập", csv: (r) => (r.signup_rate === null ? "" : r.signup_rate) },
  { key: "paid_rate", label: "Trả tiền / Đăng ký", csv: (r) => (r.paid_rate === null ? "" : r.paid_rate) },
];

function Funnel({ total }) {
  const steps = [
    { label: "Truy cập", value: total.visits, color: "#1E3A5F" },
    { label: "Đăng ký", value: total.signups, color: "#2563EB", rate: total.signup_rate },
    { label: "Trả tiền", value: total.paid_users, color: "#059669", rate: total.paid_rate },
  ];
  const max = Math.max(1, total.visits);
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s) => (
        <div key={s.label} className="grid grid-cols-[84px_1fr] sm:grid-cols-[110px_1fr] items-center gap-3">
          <div className="text-[0.8rem]">
            <p className="font-semibold text-primary">{s.label}</p>
            {s.rate !== undefined && <p className="text-[0.7rem] text-text-muted">{formatPercent(s.rate)} của bước trước</p>}
          </div>
          <div className="h-8 rounded-lg bg-[#F1F5F9] overflow-hidden">
            <div className="h-full rounded-lg flex items-center px-2.5 min-w-fit" style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, background: s.color }}>
              <span className="text-white text-[0.78rem] font-bold tabular-nums whitespace-nowrap">{formatCount(s.value)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SortHeader({ col, sort, onSort }) {
  const active = sort.key === col.key;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  const left = col.align === "left";
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-3 py-2.5 whitespace-nowrap ${left ? "text-left" : "text-right"}`}>
      <button type="button" onClick={() => onSort(col.key)} className={`inline-flex items-center gap-1 font-semibold rounded ${active ? "text-primary" : "text-[#475569]"} hover:text-primary ${FOCUS}`}>
        {col.label} <Icon size={13} className={active ? "" : "opacity-50"} />
      </button>
    </th>
  );
}

function Cells({ row, maxVisits, muted }) {
  const text = muted ? "text-[#64748B]" : "text-primary";
  return (
    <>
      <td className={`relative px-3 py-2.5 text-right tabular-nums min-w-[150px] ${text}`}>
        <span className="absolute inset-y-1.5 right-1.5 rounded-md bg-[#DBEAFE]" style={{ width: `calc((100% - 12px) * ${row.visits / maxVisits})` }} aria-hidden="true" />
        <span className="relative">{formatCount(row.visits)}</span>
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${text}`}>{formatCount(row.signups)}</td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${text}`}>{formatCount(row.paid_users)}</td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${text}`}>{formatVnd(row.revenue)}</td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${text}`}>{formatPercent(row.signup_rate)}</td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${text}`}>{formatPercent(row.paid_rate)}</td>
    </>
  );
}

export default function ChannelSection({ range, refreshKey, onStatus }) {
  const state = useAdminSection("channel-stats", range, refreshKey);
  const [sort, setSort] = useState({ key: "visits", dir: "desc" });
  const [open, setOpen] = useState(() => new Set());
  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "label" ? "asc" : "desc" }));
  const toggle = (root) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(root)) next.delete(root);
    else next.add(root);
    return next;
  });

  return (
    <SectionShell
      state={state}
      onStatus={onStatus}
      isEmpty={(d) => d.rows.length === 0}
      empty={{ icon: Share2, title: "Chưa có lượt truy cập nào", text: "Chưa có lượt truy cập hay đăng ký nào trong khoảng ngày đã chọn. Số liệu xuất hiện khi có người mở app từ link có ?ref=…" }}
      skeleton={<><ChartSkeleton height={200} /><TableSkeleton rows={6} /></>}
    >
      {({ rows, total }) => {
        const groups = sortChannels(groupChannels(rows), sort.key, sort.dir);
        const maxVisits = Math.max(1, ...groups.map((g) => g.visits));
        const csvRows = groups.flatMap((g) => (g.children.length ? g.children : [{ ...g, source: g.root }]).map((r) => ({ ...r, group: g.label })));
        return (
          <div className="flex flex-col gap-4">
            <Panel title="Phễu chuyển đổi" subtitle="Tổng mọi kênh trong khoảng ngày đã chọn">
              <Funnel total={total} />
            </Panel>

            <Panel
              title="Theo kênh"
              subtitle='Ref cùng kênh gốc (phần trước dấu "-" đầu tiên) được gom lại — bấm để xem từng link. Bấm tiêu đề cột để sắp xếp.'
              actions={<CsvButton name="kenh-gioi-thieu" range={range} columns={CSV_COLUMNS} rows={csvRows} />}
            >
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                <table className="w-full text-[0.82rem] border-collapse">
                  <thead className="bg-[#F8FAFC]">
                    <tr>{COLUMNS.map((c) => <SortHeader key={c.key} col={c} sort={sort} onSort={onSort} />)}</tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const expandable = g.children.length > 0;
                      const isOpen = open.has(g.root);
                      return (
                        <Fragment key={g.root}>
                          <tr className={`border-t border-[#E5E7EB] ${g.isDirect ? "bg-[#FAFAFA]" : "hover:bg-[#F8FAFC]"}`}>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {expandable ? (
                                <button type="button" onClick={() => toggle(g.root)} aria-expanded={isOpen} className={`inline-flex items-center gap-1.5 font-semibold text-primary rounded ${FOCUS}`}>
                                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                                  {g.label}
                                  <span className="text-[0.7rem] font-normal text-text-muted">({g.children.length} link)</span>
                                </button>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 font-semibold pl-5 ${g.isDirect ? "text-[#64748B]" : "text-primary"}`}>
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                                  {g.label}
                                  {g.isDirect && <InfoTip text={DIRECT_TIP} />}
                                </span>
                              )}
                            </td>
                            <Cells row={g} maxVisits={maxVisits} muted={g.isDirect} />
                          </tr>
                          {isOpen && g.children.map((c) => (
                            <tr key={c.source} className="border-t border-dashed border-[#E5E7EB] bg-[#FCFCFD]">
                              <td className="pl-12 pr-3 py-2 whitespace-nowrap text-[#475569] font-mono text-[0.78rem]">{c.source}</td>
                              <Cells row={c} maxVisits={maxVisits} />
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-bold">
                      <td className="px-3 py-2.5 pl-8">Tổng</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatCount(total.visits)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatCount(total.signups)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatCount(total.paid_users)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatVnd(total.revenue)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatPercent(total.signup_rate)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatPercent(total.paid_rate)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          </div>
        );
      }}
    </SectionShell>
  );
}

