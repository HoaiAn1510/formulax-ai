import { useState } from "react";
import { AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { formatDay } from "./adminRange";

/** Khung một mục: tiêu đề + các trạng thái đang tải / lỗi / chưa có dữ liệu. */
export function SectionShell({ title, note, state, isEmpty, emptyText = "Chưa có dữ liệu trong khoảng ngày này.", children }) {
  const { loading, slow, error, data, retry } = state;
  let body;
  if (loading) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#E2E8F0] border-t-accent animate-spin" />
        <p className="text-[0.85rem] font-semibold text-text-muted">
          {slow ? "Máy chủ đang khởi động… có thể mất khoảng một phút." : "Đang tải…"}
        </p>
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <AlertTriangle size={26} className="text-error" />
        <p className="text-[0.88rem] font-semibold text-primary">
          {error.status === 403 ? "Tài khoản này không có quyền xem số liệu." : "Chưa tải được số liệu."}
        </p>
        {error.status !== 403 && (
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-[0.85rem] font-bold transition-colors"
          >
            <RefreshCw size={15} /> Thử lại
          </button>
        )}
      </div>
    );
  } else if (data && isEmpty?.(data)) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-text-muted">
        <Inbox size={26} />
        <p className="text-[0.88rem] font-semibold">{emptyText}</p>
      </div>
    );
  } else if (data) {
    body = children(data);
  }
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[1.15rem] font-extrabold text-primary">{title}</h2>
        {note && <p className="mt-1 text-[0.8rem] text-text-muted leading-relaxed">{note}</p>}
      </div>
      {body}
    </section>
  );
}

export function Card({ className = "", children }) {
  return <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_2px_6px_rgba(15,23,42,.05)] ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint }) {
  return (
    <Card className="p-4 flex flex-col gap-1 min-w-0">
      <span className="text-[0.75rem] font-bold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-[1.6rem] leading-tight font-extrabold text-primary break-words">{value}</span>
      {hint && <span className="text-[0.75rem] text-text-muted leading-snug">{hint}</span>}
    </Card>
  );
}

export function StatGrid({ children }) {
  return <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">{children}</div>;
}

/**
 * Biểu đồ cột theo ngày bằng CSS (không thư viện). Rê chuột / chạm vào cột để xem số; kèm nút
 * xem bảng số bên dưới cho ai cần con số chính xác.
 */
export function DayBars({ title, days, valueKey, format = (v) => v.toLocaleString("vi-VN") }) {
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...days.map((d) => d[valueKey] || 0));
  const total = days.reduce((s, d) => s + (d[valueKey] || 0), 0);
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-[0.9rem] font-bold text-primary">{title}</h3>
        <span className="text-[0.8rem] font-semibold text-text-muted">Tổng: {format(total)}</span>
      </div>
      <div className="flex items-end gap-[2px] h-36 border-b border-[#E5E7EB]" role="img" aria-label={`${title}, tổng ${format(total)}`}>
        {days.map((d) => {
          const v = d[valueKey] || 0;
          return (
            <div key={d.day} className="flex-1 min-w-0 h-full flex items-end" title={`${formatDay(d.day, true)}: ${format(v)}`}>
              <div
                className={`w-full rounded-t-sm ${v > 0 ? "bg-accent" : "bg-[#E5E7EB]"}`}
                style={{ height: v > 0 ? `${Math.max(3, (v / max) * 100)}%` : "2px" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[0.7rem] font-semibold text-text-muted">
        <span>{formatDay(days[0]?.day)}</span>
        <span>{formatDay(days[days.length - 1]?.day)}</span>
      </div>
      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-2 text-[0.78rem] font-bold text-accent hover:text-accent-hover"
      >
        {showTable ? "Ẩn bảng số" : "Xem bảng số"}
      </button>
      {showTable && (
        <DataTable
          className="mt-2"
          columns={[{ key: "day", label: "Ngày", render: (r) => formatDay(r.day, true) }, { key: valueKey, label: title, align: "right", render: (r) => format(r[valueKey] || 0) }]}
          rows={[...days].reverse()}
          rowKey={(r) => r.day}
        />
      )}
    </Card>
  );
}

/** Bảng cuộn ngang TRONG khung (trang không cuộn ngang trên điện thoại). */
export function DataTable({ columns, rows, rowKey, footer, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[#E5E7EB] ${className}`}>
      <table className="w-full text-[0.82rem] border-collapse">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-bold text-text-muted whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r) : i} className="border-t border-[#E5E7EB]">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 text-primary whitespace-nowrap ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t-2 border-[#CBD5E1] bg-[#F8FAFC] font-bold">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 text-primary whitespace-nowrap ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                  {c.render ? c.render(footer) : footer[c.key]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
