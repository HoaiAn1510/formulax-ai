import { useEffect, useRef, useState } from "react";
import { niceTicks, labelIndexes, compactNumber } from "./adminFormat";
import { formatDay } from "./adminRange";

/**
 * Biểu đồ tự vẽ bằng SVG (không thư viện — code admin là chunk riêng, cần nhẹ). Đo bề rộng khung bằng
 * ResizeObserver để vẽ đúng pixel: chữ trục không bị kéo giãn, cột không phình khi ít ngày.
 */
function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

const GRID = "#E5E7EB";
const AXIS_TEXT = "#64748B";
const ZERO_BAR = "#CBD5E1";

/** Hình chữ nhật bo 2 góc trên (cột biểu đồ). */
function topRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/**
 * Biểu đồ theo ngày.
 *   type "bar": cột (nhiều series thì chồng lên nhau, series đầu ở dưới); "line": đường + vùng nhạt.
 *   series: [{ key, label, color }]; format: định dạng số trong tooltip.
 * Rê chuột / chạm vào một ngày để xem tooltip.
 */
export function DayChart({ days, series, type = "bar", format = (v) => v.toLocaleString("vi-VN"), height = 210, label }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);
  const n = days.length;
  const padL = 44;
  const padR = 10;
  const padT = 12;
  const padB = 26;
  const w = Math.max(width, 240);
  const plotW = w - padL - padR;
  const plotH = height - padT - padB;
  const stackTotal = (d) => series.reduce((s, se) => s + (d[se.key] || 0), 0);
  const max = n ? Math.max(...days.map((d) => (type === "bar" ? stackTotal(d) : Math.max(...series.map((se) => d[se.key] || 0))))) : 0;
  const ticks = niceTicks(max);
  const yMax = ticks[ticks.length - 1] || 1;
  const y = (v) => padT + plotH - (v / yMax) * plotH;
  const band = n ? plotW / n : plotW;
  const barW = Math.max(2, Math.min(band * 0.6, 28));
  const xMid = (i) => padL + band * (i + 0.5);
  const labels = labelIndexes(n, w < 480 ? 4 : 7);

  const pick = (clientX) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !n) return;
    const i = Math.floor((clientX - rect.left - padL) / band);
    setHover(i >= 0 && i < n ? i : null);
  };

  const hovered = hover !== null ? days[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(xMid(hover), 70), w - 70) : 0;

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      onMouseMove={(e) => pick(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchStart={(e) => pick(e.touches[0].clientX)}
      onTouchMove={(e) => pick(e.touches[0].clientX)}
    >
      {width > 0 && (
        <svg width={w} height={height} role="img" aria-label={label} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeDasharray={t === 0 ? undefined : "3 3"} />
              <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT}>{compactNumber(t)}</text>
            </g>
          ))}
          {hover !== null && <rect x={padL + band * hover} y={padT} width={band} height={plotH} fill="#F1F5F9" />}

          {type === "bar" && days.map((d, i) => {
            const total = stackTotal(d);
            const x = xMid(i) - barW / 2;
            if (total === 0) return <rect key={d.day} x={x} y={y(0) - 1.5} width={barW} height={1.5} fill={ZERO_BAR} />;
            let base = 0;
            const visible = series.filter((se) => (d[se.key] || 0) > 0);
            return (
              <g key={d.day}>
                {visible.map((se, k) => {
                  const v = d[se.key] || 0;
                  const top = y(base + v);
                  const h = Math.max(1, y(base) - top);
                  base += v;
                  const isTop = k === visible.length - 1;
                  return isTop
                    ? <path key={se.key} d={topRoundedRect(x, y(base), barW, h, 4)} fill={se.color} />
                    : <rect key={se.key} x={x} y={top} width={barW} height={h} fill={se.color} />;
                })}
              </g>
            );
          })}

          {type === "line" && series.map((se) => {
            const pts = days.map((d, i) => [xMid(i), y(d[se.key] || 0)]);
            if (!pts.length) return null;
            const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join("");
            const area = `${line}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z`;
            return (
              <g key={se.key}>
                <path d={area} fill={se.color} opacity="0.08" />
                <path d={line} fill="none" stroke={se.color} strokeWidth="2" strokeLinejoin="round" />
                {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill="#fff" stroke={se.color} strokeWidth="2" />}
              </g>
            );
          })}

          {labels.map((i) => (
            <text key={days[i].day} x={xMid(i)} y={height - 8} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
              {formatDay(days[i].day)}
            </text>
          ))}
        </svg>
      )}
      {hovered && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 z-10 min-w-[120px] rounded-lg bg-primary text-white px-3 py-2 shadow-lg text-[0.75rem]"
          style={{ left: tipLeft }}
        >
          <p className="font-bold mb-1">{formatDay(hovered.day, true)}</p>
          {series.map((se) => (
            <p key={se.key} className="flex items-center justify-between gap-3 tabular-nums">
              <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span className="w-2 h-2 rounded-full" style={{ background: se.color }} />
                {se.label}
              </span>
              <span className="font-semibold">{format(hovered[se.key] || 0)}</span>
            </p>
          ))}
          {type === "bar" && series.length > 1 && (
            <p className="flex justify-between gap-3 border-t border-white/20 mt-1 pt-1 tabular-nums">
              <span className="text-[#CBD5E1]">Tổng</span>
              <span className="font-semibold">{format(stackTotal(hovered))}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Đường nhỏ ở chân thẻ KPI. */
export function Sparkline({ values, color = "#D97706" }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8 block" aria-hidden="true">
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity="0.1" stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Chú thích màu dưới biểu đồ nhiều series. */
export function Legend({ series }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-text-muted">
      {series.map((se) => (
        <span key={se.key} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: se.color }} />
          {se.label}
        </span>
      ))}
    </div>
  );
}
