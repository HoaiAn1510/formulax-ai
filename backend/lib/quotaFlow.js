/**
 * Giữ 1 lượt AI Finder, chạy câu hỏi, và HOÀN lượt trong mọi trường hợp không giao được câu trả
 * lời — để bộ đếm luôn bằng đúng số câu trả lời thật đã giao:
 *   - tăng lượt xong thấy vượt hạn mức (increment trả về > limit) → hoàn, không chạy AI;
 *   - AI ném lỗi (Groq 429, lỗi khác, timeout) → hoàn rồi ném lỗi ra;
 *   - AI chạy xong nhưng không giao được câu trả lời (delivered === false, ví dụ JSON hỏng phải
 *     trả câu mẫu) → hoàn.
 *
 * Vẫn tăng TRƯỚC rồi mới gọi AI (không đọc-rồi-tăng) để 2 request đồng thời của cùng một người
 * không cùng lọt qua hạn mức. Tách khỏi Groq/Supabase để test được từng nhánh bằng hàm giả.
 *
 * @param {object} opts
 * @param {number} opts.limit                 hạn mức lượt/ngày
 * @param {() => Promise<number>} opts.reserve  tăng 1 lượt, trả số lượt đã dùng hôm nay SAU khi tăng.
 *                                              Ném lỗi thì dừng luôn (fail closed, chưa gọi AI).
 * @param {() => Promise<number>} opts.refund   hoàn 1 lượt, trả số lượt đã dùng SAU khi hoàn
 * @param {() => Promise<{delivered: boolean}>} opts.run  chạy câu hỏi
 * @param {(err: Error) => void} [opts.onRefundError]  hoàn lượt thất bại chỉ được ghi log, không
 *                                              làm hỏng phản hồi cho học sinh
 * @returns {Promise<{limited: true, remaining: 0} | {limited: false, result: object, remaining: number}>}
 *   Lỗi của run() được ném lại, kèm err.remaining = số lượt còn lại sau khi đã hoàn.
 */
export async function runWithQuota({ limit, reserve, refund, run, onRefundError = () => {} }) {
  const used = await reserve();

  const refundAndCountRemaining = async () => {
    try {
      return Math.max(0, limit - (await refund()));
    } catch (err) {
      onRefundError(err);
      return Math.max(0, limit - used); // không hoàn được → lượt vẫn bị tính như trước
    }
  };

  if (used > limit) {
    await refundAndCountRemaining();
    return { limited: true, remaining: 0 };
  }

  let result;
  try {
    result = await run();
  } catch (err) {
    err.remaining = await refundAndCountRemaining();
    throw err;
  }

  if (result?.delivered === false) {
    return { limited: false, result, remaining: await refundAndCountRemaining() };
  }
  return { limited: false, result, remaining: Math.max(0, limit - used) };
}
