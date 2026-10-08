import { useLayoutEffect, useRef, useState } from "react";
import { MathElement } from "../utils/katexHelper";

const MIN_SCALE = 0.55;

/**
 * Công thức KaTeX dạng khối, tự THU NHỎ cỡ chữ cho vừa bề ngang khung thay vì bắt cuộn ngang (học
 * sinh trên điện thoại thường không biết phải cuộn). Thu nhỏ tối đa tới 55%; rộng hơn nữa thì khung
 * ngoài (overflow-x-auto ở nơi dùng) vẫn cuộn được, không mất nội dung.
 * KaTeX dùng đơn vị em nên chỉ cần đổi font-size của khung bọc. Đo lại khi KaTeX render xong (có thể
 * trễ nếu CDN chậm) và khi khung đổi kích thước (xoay màn hình).
 */
export default function FitMath({ math, className = "" }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    let current = 1;
    const fit = () => {
      const available = outer.clientWidth;
      // Bề rộng thật của công thức ở cỡ chữ gốc = bề rộng đang đo / tỉ lệ đang áp dụng.
      const natural = inner.scrollWidth / current;
      if (!available || !natural) return;
      const next = Math.max(MIN_SCALE, Math.min(1, (available - 2) / natural));
      if (Math.abs(next - current) > 0.01) {
        current = next;
        setScale(next);
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [math]);

  return (
    <div ref={outerRef} className={`w-full min-w-0 ${className}`}>
      <div ref={innerRef} className="inline-block min-w-full [&_.katex-display]:!my-1.5" style={{ fontSize: `${scale}em` }}>
        <MathElement math={math} block={true} />
      </div>
    </div>
  );
}
