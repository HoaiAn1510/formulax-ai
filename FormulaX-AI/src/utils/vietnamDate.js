// "YYYY-MM-DD" theo giờ Việt Nam (Asia/Ho_Chi_Minh). Dùng cho mọi thứ "đổi theo ngày" mà học sinh
// thấy — lượt Quiz của khách, Thử thách hôm nay... Nếu dùng toISOString() (giờ UTC) thì "ngày mới"
// bắt đầu lúc 7h sáng giờ Việt Nam thay vì nửa đêm.
export function vietnamToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}
