"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

// Thanh tiến trình mỏng trên cùng trang thiệp — khách biết mình đang ở đoạn
// nào của thiệp (như thanh chạy của video).
export function ScrollProgress({
  color = "#710001",
  height = 4,
  disabled = false,
}: {
  color?: string;
  height?: number;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  if (disabled || reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-50 origin-left"
      style={{ scaleX, height, background: color }}
    />
  );
}
