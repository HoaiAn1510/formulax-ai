// Ngày theo giờ Việt Nam (Asia/Ho_Chi_Minh) cho mọi thứ "đổi theo ngày" mà học sinh thấy — lượt
// Quiz, Thử thách hôm nay, chuỗi ngày học, thống kê theo ngày... Nếu dùng toISOString() (giờ UTC)
// thì "ngày mới" bắt đầu lúc 7h sáng giờ Việt Nam thay vì nửa đêm, và việc học lúc 0h–7h bị tính
// vào ngày hôm trước.
const TZ = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" theo giờ Việt Nam của một thời điểm (Date, ISO string, hoặc ms). */
export function vietnamDateOf(dateLike) {
  return new Date(dateLike).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "YYYY-MM-DD" hôm nay theo giờ Việt Nam. */
export function vietnamToday() {
  return vietnamDateOf(Date.now());
}

/** Cộng/trừ n ngày cho chuỗi "YYYY-MM-DD" (tính thuần theo lịch, không phụ thuộc múi giờ máy). */
export function shiftDay(day, n) {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Mốc 0h giờ Việt Nam của một ngày, dạng ISO (UTC) — dùng cho truy vấn created_at >= đầu ngày. */
export function vietnamDayStartISO(day = vietnamToday()) {
  return new Date(`${day}T00:00:00+07:00`).toISOString();
}
