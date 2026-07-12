// Chuẩn hoá chuỗi tiếng Việt để so khớp không phân biệt dấu (vd: "dao ham" khớp "đạo hàm").
export function normalizeVi(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}
