import { useAdminSection } from "../useAdminSection";
import { SectionShell, StatCard, StatGrid, DayBars, DataTable } from "../AdminUI";
import { formatDay } from "../adminRange";

const n = (v) => (v || 0).toLocaleString("vi-VN");

const COLUMNS = [
  { key: "day", label: "Ngày", render: (r) => formatDay(r.day, true) },
  { key: "ai_free_turns", label: "AI (Free)", align: "right", render: (r) => n(r.ai_free_turns) },
  { key: "ai_premium_turns", label: "AI (Premium)", align: "right", render: (r) => n(r.ai_premium_turns) },
  { key: "ai_users_at_limit", label: "TK hết lượt AI", align: "right", render: (r) => n(r.ai_users_at_limit) },
  { key: "ocr_scans", label: "Quét ảnh", align: "right", render: (r) => n(r.ocr_scans) },
  { key: "ocr_users_at_limit", label: "TK hết lượt quét", align: "right", render: (r) => n(r.ocr_users_at_limit) },
  { key: "ai_quota_exceeded", label: "Hỏi khi hết lượt", align: "right", render: (r) => n(r.ai_quota_exceeded) },
  { key: "ai_busy", label: "AI đang bận", align: "right", render: (r) => n(r.ai_busy) },
  { key: "ocr_quota_exceeded", label: "Quét khi hết lượt", align: "right", render: (r) => n(r.ocr_quota_exceeded) },
  { key: "ocr_rate_limited", label: "Quét quá nhanh", align: "right", render: (r) => n(r.ocr_rate_limited) },
  { key: "chat_ip_limited", label: "Chặn theo IP (chat)", align: "right", render: (r) => n(r.chat_ip_limited) },
];

export default function UsageSection({ range }) {
  const state = useAdminSection("usage", range);
  return (
    <SectionShell
      title="Sử dụng AI"
      note="Lượt AI Finder chỉ đếm câu trả lời đã giao (câu lỗi hoặc thư viện chưa có công thức được hoàn lượt). Các cột sự kiện (Premium, hết lượt, AI bận, bị chặn) chỉ có số từ ngày cập nhật trang quản trị trở đi."
      state={state}
      isEmpty={(d) => d.days.length === 0}
    >
      {({ days, sum, limits }) => {
        const withTotal = days.map((d) => ({ ...d, ai_total: (d.ai_free_turns || 0) + (d.ai_premium_turns || 0) }));
        return (
          <div className="flex flex-col gap-4">
            <StatGrid>
              <StatCard label="Lượt AI Finder" value={n(sum.ai_free_turns + sum.ai_premium_turns)} hint={`Free ${n(sum.ai_free_turns)} · Premium ${n(sum.ai_premium_turns)}`} />
              <StatCard label="Lượt quét ảnh" value={n(sum.ocr_scans)} />
              <StatCard label="Lần chạm giới hạn AI" value={n(sum.ai_users_at_limit)} hint={`Tổng số tài khoản Free dùng hết ${limits.aiFree} lượt, cộng theo từng ngày`} />
              <StatCard
                label="Lần chạm giới hạn quét"
                value={n(sum.ocr_users_at_limit)}
                hint={`Free ${limits.ocrFree} · Premium ${limits.ocrPremium}/ngày; Premium tính theo trạng thái hiện tại`}
              />
              <StatCard label="AI đang bận" value={n(sum.ai_busy)} hint="Số lần Groq báo quá tải" />
            </StatGrid>
            <DayBars title="Lượt AI Finder theo ngày" days={withTotal} valueKey="ai_total" />
            <DayBars title="Lượt quét ảnh theo ngày" days={days} valueKey="ocr_scans" />
            <DataTable columns={COLUMNS} rows={[...days].reverse()} rowKey={(r) => r.day} />
          </div>
        );
      }}
    </SectionShell>
  );
}
