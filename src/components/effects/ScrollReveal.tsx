"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Cross-dissolve theo vị trí cuộn — kiểu chuyển cảnh video: section đi vào
// thì mờ dần hiện ra + phóng nhẹ từ 0.96 về 1 + nét dần từ mờ nhẹ; đi ra thì
// mờ đi một phần (không mờ hẳn để vẫn đọc được khi cuộn ngược). Chạy theo
// useScroll với ref của chính section (không dùng timer).
// Ngưỡng thoát "end 0" để section cuối trang không bị mờ khi cuộn tới đáy.
export type RevealStrength = "subtle" | "standard";

const MAP: Record<RevealStrength, { opacity: number[]; scale: number[]; blur: string[] }> = {
  standard: { opacity: [0, 1, 1, 0.55], scale: [0.96, 1, 1, 0.99], blur: ["blur(6px)", "blur(0px)", "blur(0px)", "blur(1.5px)"] },
  subtle: { opacity: [0, 1, 1, 0.75], scale: [0.98, 1, 1, 0.995], blur: ["blur(3px)", "blur(0px)", "blur(0px)", "blur(1px)"] },
};

export function ScrollReveal({
  children,
  className,
  style,
  strength = "standard",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: RevealStrength;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.45", "end 0.35", "end 0"],
  });
  const m = MAP[strength];
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.opacity);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.scale);
  const filter = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.blur);
  if (disabled || reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ ...style, opacity, scale, filter }}>
      {children}
    </motion.div>
  );
}
