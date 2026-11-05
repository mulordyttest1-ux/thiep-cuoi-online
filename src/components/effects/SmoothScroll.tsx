"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "framer-motion";

// Cuộn mượt Lenis — bọc cuộn gốc của trình duyệt nên thanh cuộn, phím,
// sticky đều hoạt động như thường, chỉ thêm độ trượt nhẹ như video
// (lerp càng nhỏ càng trượt). Chỉ dùng ở trang khách (/thiep/*), không
// dùng ở editor/thumbnail. Tôn trọng prefers-reduced-motion: tắt mượt.
export function SmoothScroll({
  children,
  lerp = 0.09,
  enabled = true,
}: {
  children: ReactNode;
  lerp?: number;
  enabled?: boolean;
}) {
  const reduce = useReducedMotion();
  if (!enabled || reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
