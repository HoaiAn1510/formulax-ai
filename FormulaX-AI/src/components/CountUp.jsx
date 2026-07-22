import { useEffect, useRef, useState } from "react";

// Đếm số tăng dần (ease-out) mỗi khi `value` đổi, thay vì nhảy số ngay lập tức.
export default function CountUp({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    if (from === to) { setDisplay(to); displayRef.current = to; return; }

    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      displayRef.current = next;
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevValue.current = to;
      }
    };
    frame = requestAnimationFrame(tick);
    // Nếu value đổi lần nữa trước khi animation này chạy xong, chốt lại đúng số đang
    // hiển thị trên màn hình làm điểm bắt đầu cho lần chạy tiếp theo — tránh số bị
    // nhảy giật lùi về from cũ rồi chạy lại từ đầu.
    return () => {
      cancelAnimationFrame(frame);
      prevValue.current = displayRef.current;
    };
  }, [value, duration]);

  return display;
}
