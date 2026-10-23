import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Inbox, ArrowUpRight, ArrowDownRight, Minus, Download, BarChart3, Table2, Info, ChevronRight } from "lucide-react";
import { formatDay, formatCount } from "./adminRange";
import { TONES, FOCUS } from "./adminStyle";
import { toCsv, csvFilename } from "./adminFormat";
import { DayChart, Sparkline, Legend } from "./charts";

const n = formatCount;

// ─── Khung ───────────────────────────────────────────────────────────────────

export function Card({ className = "", children }) {
  return <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-glass-card ${className}`}>{children}</div>;
}

/** Khối có tiêu đề, nút bên phải và link "Xem chi tiết" ở chân. */
export function Panel({ title, subtitle, actions, onMore, moreLabel = "Xem chi tiết", className = "", children }) {
  return (
    <Card className={`p-4 sm:p-5 flex flex-col gap-3 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.95rem] font-bold text-primary">{title}</h3>
          {subtitle && <p className="text-[0.75rem] text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
      {children}
      {onMore && (
        <button type="button" onClick={onMore} className={`self-start inline-flex items-center gap-0.5 text-[0.8rem] font-bold text-accent-hover hover:underline rounded ${FOCUS}`}>
          {moreLabel} <ChevronRight size={15} />
        </button>
      )}
    </Card>
  );
}

// ─── Trạng thái ──────────────────────────────────────────────────────────────

function Bone({ className = "", style }) {
  return <div className={`rounded-md bg-[#E2E8F0] motion-safe:animate-pulse ${className}`} style={style} />;
}

export function KpiSkeleton({ count = 4, columns = 4 }) {
  return (
    <KpiGrid columns={columns}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-4 flex flex-col gap-3 min-h-[148px]">
          <div className="flex items-center gap-2"><Bone className="w-8 h-8 rounded-lg" /><Bone className="h-3 w-24" /></div>
          <Bone className="h-7 w-28" />
          <Bone className="h-3 w-32" />
          <Bone className="h-6 w-full mt-auto" />
        </Card>
      ))}
    </KpiGrid>
  );
}

export function ChartSkeleton({ height = 260 }) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <Bone className="h-4 w-48" />
      <div className="flex items-end gap-2" style={{ height: height - 80 }}>
        {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50].map((h, i) => <Bone key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />)}
      </div>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <Bone className="h-4 w-40" />
      {Array.from({ length: rows }, (_, i) => <Bone key={i} className="h-8 w-full" />)}
    </Card>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Chưa có dữ liệu", text }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
      <span className="w-11 h-11 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center justify-center"><Icon size={22} /></span>
      <p className="text-[0.92rem] font-bold text-primary">{title}</p>
      {text && <p className="text-[0.82rem] text-text-muted max-w-md">{text}</p>}
    </Card>
  );
}

/**
 * Trạng thái chung của một mục: skeleton khi đang tải (kèm "Máy chủ đang khởi động…" sau 5 giây),
 * lỗi + Thử lại, trống, hoặc nội dung. Báo trạng thái tải lên thanh công cụ qua onStatus.
 */
export function SectionShell({ state, skeleton, isEmpty, empty, onStatus, children }) {
  const { loading, slow, error, data, retry, loadedAt } = state;
  useEffect(() => {
    onStatus?.({ loading, loadedAt });
  }, [onStatus, loading, loadedAt]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {slow && (
          <p className="flex items-center gap-2 text-[0.82rem] font-semibold text-text-muted" role="status">
            <RefreshCw size={14} className="motion-safe:animate-spin" /> Máy chủ đang khởi động… có thể mất khoảng một phút.
          </p>
        )}
        {skeleton}
      </div>
    );
  }
  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
        <span className="w-11 h-11 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center"><AlertTriangle size={22} /></span>
        <p className="text-[0.92rem] font-bold text-primary">
          {error.status === 403 ? "Tài khoản này không có quyền xem số liệu." : "Chưa tải được số liệu."}
        </p>
        {error.status !== 403 && (
          <button type="button" onClick={retry} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-hover hover:bg-[#92400E] text-white text-[0.85rem] font-bold transition-colors ${FOCUS}`}>
            <RefreshCw size={15} /> Thử lại
          </button>
        )}
      </Card>
    );
  }
  if (!data) return null;
  if (isEmpty?.(data)) return <EmptyState {...empty} />;
  return children(data);
}

// ─── Thẻ số liệu ─────────────────────────────────────────────────────────────

export function KpiGrid({ children, columns = 4 }) {
  return <div className={`grid ${columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"} gap-3 sm:gap-4`}>{children}</div>;
}

const DELTA_STYLE = {
  up: { icon: ArrowUpRight, cls: "text-[#047857] bg-[#D1FAE5]" },
  down: { icon: ArrowDownRight, cls: "text-[#B91C1C] bg-[#FEE2E2]" },
  flat: { icon: Minus, cls: "text-[#475569] bg-[#F1F5F9]" },
  new: { icon: ArrowUpRight, cls: "text-[#475569] bg-[#F1F5F9]" },
};

/** invert: số liệu "càng ít càng tốt" (sự cố) — tăng tô đỏ, giảm tô xanh. */
export function DeltaBadge({ delta, invert = false }) {
  if (!delta || delta.kind === "none") return null;
  const kind = invert && (delta.kind === "up" || delta.kind === "down") ? (delta.kind === "up" ? "down" : "up") : delta.kind;
  const { cls } = DELTA_STYLE[kind];
  const { icon: Icon } = DELTA_STYLE[delta.kind];
  const text = delta.kind === "new" ? "mới" : `${delta.pct > 0 ? "+" : ""}${delta.pct.toLocaleString("vi-VN")}%`;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[0.72rem] font-bold tabular-nums ${cls}`}>
      <Icon size={13} /> {text}
    </span>
  );
}

/**
 * Thẻ KPI: icon trong ô màu nhạt, số chính, so sánh kỳ trước, sparkline (nếu có số theo ngày).
 * highlight: viền + nền amber nhạt để gây chú ý (vd Premium sắp hết hạn).
 */
export function KpiCard({ icon: Icon, tone = "blue", label, value, delta, invertDelta = false, compareLabel = "so với kỳ trước", hint, spark, highlight }) {
  const t = TONES[tone];
  return (
    <Card className={`p-4 flex flex-col gap-2 min-w-0 min-h-[148px] motion-safe:transition motion-safe:duration-200 hover:shadow-[0_6px_16px_rgba(15,23,42,.08)] motion-safe:hover:-translate-y-0.5 ${highlight ? "!bg-[#FFFBEB] !border-[#FCD34D]" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.bg} ${t.fg}`}><Icon size={17} /></span>
        <span className="text-[0.78rem] font-semibold text-[#475569] leading-tight">{label}</span>
      </div>
      <span className="text-[1.25rem] min-[400px]:text-[1.45rem] sm:text-[1.7rem] leading-tight font-extrabold text-primary tabular-nums wrap-break-word">{value}</span>
      <div className="flex flex-wrap items-center gap-1.5 text-[0.72rem] text-text-muted min-h-[20px]">
        {delta && delta.kind !== "none" ? (
          <>
            <DeltaBadge delta={delta} invert={invertDelta} />
            <span>{compareLabel}</span>
          </>
        ) : (
          hint && <span>{hint}</span>
        )}
      </div>
      {delta && delta.kind !== "none" && hint && <span className="text-[0.72rem] text-text-muted -mt-1">{hint}</span>}
      <div className="mt-auto">{spark && <Sparkline values={spark} color={t.stroke} />}</div>
    </Card>
  );
}

// ─── Bảng ────────────────────────────────────────────────────────────────────

/** Bảng cuộn ngang TRONG khung (trang không cuộn ngang trên điện thoại). */
export function DataTable({ columns, rows, rowKey, footer, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[#E5E7EB] ${className}`}>
      <table className="w-full text-[0.82rem] border-collapse">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-3 py-2.5 font-semibold text-[#475569] whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r) : i} className="border-t border-[#E5E7EB] hover:bg-[#F8FAFC]">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 text-primary whitespace-nowrap ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
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
                <td key={c.key} className={`px-3 py-2.5 text-primary whitespace-nowrap ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
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

// ─── Công cụ nhỏ ─────────────────────────────────────────────────────────────

export function IconButton({ onClick, label, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[0.78rem] font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors ${FOCUS} ${className}`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/** "Tải CSV": UTF-8 có BOM, tên file kèm khoảng ngày. */
export function CsvButton({ name, range, columns, rows }) {
  const download = () => {
    const blob = new Blob([toCsv(columns, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename(name, range);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <IconButton onClick={download} label={`Tải CSV ${name}`}>
      <Download size={14} /> <span className="hidden sm:inline">Tải CSV</span>
    </IconButton>
  );
}

/** Chuyển Biểu đồ / Bảng số. */
export function ViewToggle({ value, onChange }) {
  const opt = (id, Icon, label) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={value === id}
      title={label}
      className={`inline-flex items-center justify-center w-8 h-7 rounded-md transition-colors ${FOCUS} ${value === id ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-primary"}`}
    >
      <Icon size={15} />
      <span className="sr-only">{label}</span>
    </button>
  );
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-[#F1F5F9]" role="group" aria-label="Kiểu hiển thị">
      {opt("chart", BarChart3, "Biểu đồ")}
      {opt("table", Table2, "Bảng số")}
    </div>
  );
}

/** Biểu đồ theo ngày trong một khối, có nút chuyển sang bảng số và Tải CSV. */
export function ChartPanel({ title, subtitle, days, series, type = "bar", format = n, csvName, range, onMore, height }) {
  const [view, setView] = useState("chart");
  const total = days.reduce((s, d) => s + series.reduce((x, se) => x + (d[se.key] || 0), 0), 0);
  const columns = [
    { key: "day", label: "Ngày", render: (r) => formatDay(r.day, true), csv: (r) => r.day },
    ...series.map((se) => ({ key: se.key, label: se.label, align: "right", render: (r) => format(r[se.key] || 0), csv: (r) => r[se.key] || 0 })),
  ];
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      onMore={onMore}
      actions={
        <>
          <ViewToggle value={view} onChange={setView} />
          {csvName && <CsvButton name={csvName} range={range} columns={columns} rows={days} />}
        </>
      }
    >
      {type === "bar" && total === 0 && view === "chart" ? (
        <p className="text-[0.82rem] text-text-muted py-6 text-center">Chưa có số liệu nào trong khoảng ngày đã chọn.</p>
      ) : view === "chart" ? (
        <>
          <DayChart days={days} series={series} type={type} format={format} height={height} label={title} />
          {series.length > 1 && <Legend series={series} />}
        </>
      ) : (
        <DataTable columns={columns} rows={[...days].reverse()} rowKey={(r) => r.day} className="max-h-[320px] overflow-y-auto" />
      )}
    </Panel>
  );
}

/** Biểu tượng (i) có chú thích khi rê chuột hoặc focus bằng bàn phím. */
export function InfoTip({ text }) {
  return (
    <span className="relative inline-flex group align-middle">
      <button type="button" className={`text-[#94A3B8] hover:text-[#475569] rounded-full ${FOCUS}`} aria-label={text}>
        <Info size={14} />
      </button>
      <span role="tooltip" className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 rounded-lg bg-primary text-white text-[0.72rem] font-normal leading-snug px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:transition-opacity z-20 whitespace-normal text-left">
        {text}
      </span>
    </span>
  );
}

