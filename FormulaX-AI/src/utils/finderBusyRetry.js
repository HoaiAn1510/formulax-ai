import { busyWaitSeconds } from "./ocrProblems.js";

/** Chỉ thử lại một lần sau 429; wait trả false khi người dùng rời cuộc trò chuyện. */
export async function retryFinderBusyOnce(call, wait) {
  try {
    return await call();
  } catch (error) {
    if (error.code !== "ai_busy") throw error;
    if (!await wait(busyWaitSeconds(error.retryAfter), error)) return null;
    return call();
  }
}
