// Chỉ chặn dữ kiện góc hiển nhiên vô lý trong MỘT tam giác được gọi tên.
// Không suy diễn góc từ tọa độ, góc ngoài, hoặc các tam giác khác nhau.
const ANGLE_VALUE = String.raw`(\d+(?:[.,]\d+)?)\s*(?:°|\^\s*\\circ)`;
const TRIANGLE = /(?:tam\s+giác|[Δ△])\s*([A-Z]{3})/giu;
const NAMED_ANGLE = new RegExp(String.raw`(?:[Gg]óc\s*)?([A-Z])\s*=\s*${ANGLE_VALUE}`, "gu");
const TWO_ANGLES = new RegExp(String.raw`hai\s+góc\s+(?:lần\s+lượt\s+)?(?:bằng\s+)?${ANGLE_VALUE}\s+và\s+${ANGLE_VALUE}`, "iu");
const ANY_ANGLE_VALUE = new RegExp(ANGLE_VALUE, "gu");

/** null nếu không thể xác minh chắc hai góc đã cho thuộc cùng một tam giác. */
export function precheckInvalidAngleSum(question) {
  const text = String(question || "").normalize("NFC");
  if (/góc\s+ngoài/iu.test(text)) return null;
  const triangles = [...text.matchAll(TRIANGLE)];
  if (triangles.length !== 1 || new Set(triangles[0][1]).size !== 3) return null;
  const values = [...text.matchAll(ANY_ANGLE_VALUE)];
  if (values.length !== 2) return null;

  const named = [...text.matchAll(NAMED_ANGLE)];
  let angles;
  if (named.length === 2 && named[0][1] !== named[1][1]
    && named.every((m) => triangles[0][1].includes(m[1]))) {
    angles = named.map((m) => m[2]);
  } else if (named.length === 0) {
    const pair = text.match(TWO_ANGLES);
    if (!pair) return null;
    angles = [pair[1], pair[2]];
  } else return null;

  const numbers = angles.map((raw) => Number(raw.replace(",", ".")));
  if (!numbers.every((n) => Number.isFinite(n) && n > 0 && n < 180)) return null;
  if (numbers[0] + numbers[1] < 180) return null;
  return {
    reason: "invalid_angle_sum",
    text: `Hai góc ${angles[0]}° và ${angles[1]}° có tổng không nhỏ hơn 180°, không thể là hai góc của cùng một tam giác. Bạn kiểm tra lại đề giúp mình nhé!`,
  };
}
