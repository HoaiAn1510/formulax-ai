import { Sparkles, ScanLine, Gauge, Zap, ShieldAlert, Ban, Timer, Lock } from "lucide-react";
import { useAdminSection } from "../useAdminSection";
import { SectionShell, KpiCard, KpiGrid, KpiSkeleton, ChartSkeleton, TableSkeleton, ChartPanel, Panel, DataTable, CsvButton } from "../AdminUI";
import { computeDelta } from "../adminFormat";
import { formatDay, formatCount } from "../adminRange";

const COLUMNS = [
  { key: "day", label: "Ngày", render: (r) => formatDay(r.day, true), csv: (r) => r.day },
  { key: "ai_free_turns", label: "AI (Free)", align: "right" },
  { key: "ai_premium_turns", label: "AI (Premium)", align: "right" },
  { key: "ai_users_at_limit", label: "TK hết lượt AI", align: "right" },
  { key: "ocr_scans", label: "Quét ảnh", align: "right" },
  { key: "ocr_users_at_limit", label: "TK hết lượt quét", align: "right" },
  { key: "ai_quota_exceeded", label: "Hỏi khi hết lượt", align: "right" },
  { key: "ai_busy", label: "AI đang bận", align: "right" },
  { key: "ocr_quota_exceeded", label: "Quét khi hết lượt", align: "right" },
  { key: "ocr_rate_limited", label: "Quét quá nhanh", align: "right" },
  { key: "chat_ip_limited", label: "Chặn theo IP (chat)", align: "right" },
].map((c) => (c.key === "day" ? c : { ...c, render: (r) => formatCount(r[c.key]) }));

function IncidentRow({ icon: Icon, label, value, note, level }) {
  const active = value > 0;
  const cls = !active ? "bg-[#F8FAFC] border-[#E5E7EB]" : level === "danger" ? "bg-[#FEF2F2] border-[#FCA5A5]" : "bg-[#FFFBEB] border-[#FCD34D]";
  const num = !active ? "text-primary" : level === "danger" ? "text-[#B91C1C]" : "text-accent-hover";
  return (
    <li className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${cls}`}>
      <Icon size={18} className={active ? num : "text-[#94A3B8]"} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.82rem] font-semibold text-primary">{label}</p>
        <p className="text-[0.72rem] text-text-muted">{note}</p>
      </div>
      <span className={`text-[1.15rem] font-extrabold tabular-nums ${num}`}>{formatCount(value)}</span>
    </li>
  );
}

export default function UsageSection({ range, refreshKey, onStatus }) {
  const state = useAdminSection("usage", range, refreshKey);
  return (
    <SectionShell
      state={state}
      onStatus={onStatus}
      isEmpty={(d) => d.days.length === 0}
      skeleton={<><KpiSkeleton count={3} columns={3} /><div className="grid lg:grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div><TableSkeleton /></>}
    >
      {({ days, sum, previous, limits }) => {
        const aiTotal = sum.ai_free_turns + sum.ai_premium_turns;
        const aiPrev = previous ? (previous.ai_free_turns || 0) + (previous.ai_premium_turns || 0) : null;
        const atLimit = sum.ai_users_at_limit + sum.ocr_users_at_limit;
        const withTotal = days.map((d) => ({ ...d, ai_total: d.ai_free_turns + d.ai_premium_turns }));
        return (
          <div className="flex flex-col gap-4">
            <KpiGrid columns={3}>
              <KpiCard icon={Sparkles} tone="blue" label="Lượt AI Finder" value={formatCount(aiTotal)} delta={computeDelta(aiTotal, aiPrev)} spark={withTotal.map((d) => d.ai_total)} />
              <KpiCard icon={ScanLine} tone="violet" label="Lượt quét ảnh" value={formatCount(sum.ocr_scans)} delta={computeDelta(sum.ocr_scans, previous?.ocr_scans)} spark={days.map((d) => d.ocr_scans)} />
              <KpiCard icon={Gauge} tone="amber" label="Lần chạm giới hạn" value={formatCount(atLimit)} hint={`AI Free ${limits.aiFree} · quét Free ${limits.ocrFree} / Premium ${limits.ocrPremium} mỗi ngày`} highlight={atLimit > 0} />
            </KpiGrid>

            <div className="grid lg:grid-cols-2 gap-4">
              <ChartPanel
                title="Lượt AI Finder theo ngày"
                subtitle="Chỉ câu trả lời đã giao (câu lỗi / thư viện chưa có công thức được hoàn lượt)"
                days={days}
                series={[{ key: "ai_free_turns", label: "Free", color: "#D97706" }, { key: "ai_premium_turns", label: "Premium", color: "#1E3A5F" }]}
                csvName="luot-ai-finder-theo-ngay"
                range={range}
              />
              <ChartPanel title="Lượt quét ảnh theo ngày" days={days} series={[{ key: "ocr_scans", label: "Quét ảnh", color: "#7C3AED" }]} csvName="luot-quet-anh-theo-ngay" range={range} />
            </div>

            <Panel title="Sự cố trong kỳ" subtitle="Số lần xảy ra; tô màu khi lớn hơn 0. Chỉ có số từ ngày cập nhật trang quản trị (migration 011) trở đi.">
              <ul className="grid sm:grid-cols-2 gap-2.5">
                <IncidentRow icon={Zap} label="AI đang bận" value={sum.ai_busy} level="danger" note="Groq báo 429 — học sinh phải chờ rồi hỏi lại" />
                <IncidentRow icon={Lock} label="Hỏi khi hết lượt AI" value={sum.ai_quota_exceeded} level="warn" note={`Tài khoản Free đã dùng hết ${limits.aiFree} lượt`} />
                <IncidentRow icon={Ban} label="Quét ảnh khi hết lượt" value={sum.ocr_quota_exceeded} level="warn" note="Đã dùng hết lượt quét trong ngày" />
                <IncidentRow icon={Timer} label="Quét ảnh quá nhanh" value={sum.ocr_rate_limited} level="warn" note="Vượt giới hạn theo phút (tài khoản hoặc IP)" />
                <IncidentRow icon={ShieldAlert} label="Chat bị chặn theo IP" value={sum.chat_ip_limited} level="danger" note="Vượt 12 lượt/phút hoặc 300 lượt/ngày trên một IP" />
              </ul>
            </Panel>

            <Panel title="Chi tiết theo ngày" actions={<CsvButton name="su-dung-ai" range={range} columns={COLUMNS} rows={days} />}>
              <DataTable columns={COLUMNS} rows={[...days].reverse()} rowKey={(r) => r.day} className="max-h-[420px] overflow-y-auto" />
            </Panel>
          </div>
        );
      }}
    </SectionShell>
  );
}
