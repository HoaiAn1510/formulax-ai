import { useEffect, useRef } from "react";

// Bấm Esc để đóng hộp thoại. Các hộp đang mở xếp thành một ngăn xếp: Esc chỉ đóng hộp TRÊN CÙNG
// (vd hộp xác nhận nằm trên modal chi tiết công thức — không đóng cả hai cùng lúc).
const stack = [];

function onKeyDown(e) {
  if (e.key !== "Escape" || !stack.length) return;
  e.preventDefault();
  stack[stack.length - 1].current?.();
}

export function useEscapeKey(onEscape, active = true) {
  const handlerRef = useRef(onEscape);
  useEffect(() => { handlerRef.current = onEscape; });

  useEffect(() => {
    if (!active) return;
    const entry = handlerRef;
    if (!stack.length) window.addEventListener("keydown", onKeyDown);
    stack.push(entry);
    return () => {
      const i = stack.lastIndexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      if (!stack.length) window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
}
