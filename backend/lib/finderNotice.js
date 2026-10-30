import { hasTriangleContext } from "./solutionGuard.js";

const NOTICES = {
  circle_guard: "Mình chỉ hướng dẫn cách tìm tâm, bán kính hoặc lập phương trình đường tròn, không điền sẵn kết quả. Bạn thử hỏi lại từng bước nhé.",
  base_knowledge_reject: "Mình chưa kiểm tra chắc cách làm cho đề này, nên chưa hướng dẫn được. Bạn thử nêu rõ các dữ kiện nhé.",
  invalid_data_reject: "Mình chưa kiểm tra được các số liệu của đề này, nên chưa hướng dẫn được. Bạn kiểm tra lại đề giúp mình nhé.",
  ai_refused: "Mình chưa tìm thấy công thức phù hợp hoặc đề còn thiếu số liệu. Bạn kiểm tra lại đề giúp mình nhé!",
  formula_ids_reject: "Mình chưa kiểm tra được công thức mà lời giải cần dùng, nên chưa hướng dẫn được. Bạn thử nêu rõ đại lượng cần tìm nhé.",
  out_of_grade_scope: "Dạng này mình chưa hỗ trợ với kiến thức lớp 10, nên chưa hướng dẫn được. Bạn thử hỏi một bài hình học hoặc đại số trong chương trình SGK nhé.",
  unknown: "Mình chưa đủ thông tin chắc chắn để hướng dẫn đề này. Bạn thử viết lại rõ dữ kiện và đại lượng cần tìm nhé.",
};

const fold = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

// Chỉ dùng để chọn câu báo lỗi, không thay đổi quyết định kiểm duyệt hay tính toán bài giải.
export function questionNotice(reason, question, grade = null) {
  if (reason === "base_knowledge_reject" && hasTriangleContext(question)) {
    const namedTriangles = [...String(question).matchAll(/tam giác\s*([A-Z]{3})/giu)].map((m) => m[1]);
    const angles = [...String(question).matchAll(/(?:góc\s*)?([A-Z])\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:°|\^\s*\\circ)/giu)]
      .map((m) => ({ name: m[1], value: Number(m[2].replace(",", ".")), raw: m[2] }));
    if (namedTriangles.length === 1 && angles.length === 2 && angles[0].name !== angles[1].name
      && angles.every((a) => namedTriangles[0].includes(a.name))
      && angles.every((a) => a.value > 0 && a.value < 180)
      && angles[0].value + angles[1].value >= 180) {
      const [a, b] = angles;
      const total = Number((a.value + b.value).toFixed(6)).toString().replace(".", ",");
      return { reason: "invalid_angle_sum", text: `Hai góc ${a.raw}° và ${b.raw}° cộng lại đã ${total}°, không thể là hai góc của cùng một tam giác. Bạn kiểm tra lại đề giúp mình nhé!` };
    }

    const triangle = String(question).match(/tam giác\s*([A-Z])([A-Z])([A-Z])\s+vuông\s+tại\s+([A-Z])/iu);
    if (triangle && namedTriangles.length === 1 && triangle.slice(1, 4).includes(triangle[4])) {
      const vertices = triangle.slice(1, 4);
      const hyp = vertices.filter((v) => v !== triangle[4]).join("");
      const sides = [...String(question).matchAll(/\b([A-Z]{2})\s*=\s*(\d+(?:[.,]\d+)?)/gu)]
        .map((m) => ({ name: m[1], value: Number(m[2].replace(",", ".")), raw: m[2] }));
      const hypSide = sides.find((s) => s.name === hyp || s.name === [...hyp].reverse().join(""));
      const leg = sides.find((s) => s.name.includes(triangle[4]) && s.name !== hyp && s.value > 0);
      if (hypSide && leg && hypSide.value > 0 && hypSide.value <= leg.value) {
        return { reason: "invalid_hypotenuse", text: `Cạnh huyền ${hypSide.name} = ${hypSide.raw} không thể ngắn hơn hoặc bằng cạnh góc vuông ${leg.name} = ${leg.raw}. Bạn kiểm tra lại đề giúp mình nhé!` };
      }
    }
  }
  if ((reason === "ai_refused" || reason === "formula_ids_reject") && grade === 10
    && /\b(tich phan|nguyen ham|luong giac nang cao)\b/.test(fold(question))) {
    return { reason: "out_of_grade_scope", text: NOTICES.out_of_grade_scope };
  }
  return { reason, text: NOTICES[reason] || NOTICES.unknown };
}

export const REFUND_NOTICE = "Lượt hỏi này không bị tính.";

export function verifiedTriangleNotice(intro) {
  return `${intro} Bạn kiểm tra lại đề giúp mình nhé!`;
}

export function appendRefundNotice(result, refunded) {
  if (!refunded || !["no_formula", "invalid_data"].includes(result.answer.type)) return result;
  return {
    ...result,
    answer: { ...result.answer, reminder: REFUND_NOTICE },
    reply: `${result.reply}\n${REFUND_NOTICE}`,
  };
}
