// Nén ảnh đề ở trình duyệt trước khi gửi /api/ocr. Ảnh điện thoại thường 3–5 MB (4000px); vẽ lại
// cạnh dài ≤ 2000px, JPEG 0,82 còn khoảng 300–700 KB — vẫn đủ nét cho chữ viết tay, gửi nhanh hơn
// trên mạng 3G/4G. Backend từ chối ảnh > 1,5 MB (MAX_IMAGE_BYTES trong backend/lib/ocrReader.js).

export const OCR_MAX_SIDE = 2000;
export const OCR_JPEG_QUALITY = 0.82;
// Nén lần 1 vẫn lớn hơn mức này (ảnh rất nhiều chi tiết) thì nén lại nhỏ hơn.
const SECOND_PASS_BYTES = 1_300_000;

/** Kích thước sau khi thu nhỏ cho cạnh dài ≤ maxSide, giữ tỉ lệ, không phóng to ảnh nhỏ. */
export function fitWithin(width, height, maxSide) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Giải mã ảnh, xoay đúng chiều theo EXIF (ảnh chụp dọc trên điện thoại). createImageBitmap với
 * imageOrientation "from-image" có ở Chrome/Android và Safari 15+; trình duyệt cũ hơn dùng <img>,
 * vốn cũng tự xoay theo EXIF ở mọi trình duyệt hiện nay.
 */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // thử cách <img> bên dưới
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpegBlob(source, width, height, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF"; // PNG nền trong suốt → JPEG nền đen nếu không tô trắng trước
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
  });
}

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ""));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

/**
 * @returns {Promise<{ base64: string, blob: Blob, bytes: number, width: number, height: number }>}
 * `blob` dùng để hiện ảnh đã gửi trên màn chọn bài (URL.createObjectURL — nơi gọi tự revoke).
 * Ném lỗi có code "decode_failed" khi trình duyệt không đọc được ảnh (vd ảnh HEIC trên Chrome Android).
 */
export async function compressImageFile(file) {
  let source;
  try {
    source = await decode(file);
  } catch {
    throw Object.assign(new Error("Máy bạn chưa đọc được định dạng ảnh này. Bạn chụp lại bằng nút Chụp ảnh, hoặc chọn ảnh JPG/PNG nhé."), { code: "decode_failed" });
  }
  const srcW = source.width || source.naturalWidth;
  const srcH = source.height || source.naturalHeight;
  let { width, height } = fitWithin(srcW, srcH, OCR_MAX_SIDE);
  let blob = await toJpegBlob(source, width, height, OCR_JPEG_QUALITY);
  if (blob.size > SECOND_PASS_BYTES) {
    ({ width, height } = fitWithin(srcW, srcH, 1600));
    blob = await toJpegBlob(source, width, height, 0.7);
  }
  source.close?.();
  return { base64: await blobToBase64(blob), blob, bytes: blob.size, width, height };
}
