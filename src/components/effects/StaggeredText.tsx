"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Chữ hiện dần từng dòng / từng từ khi vào khung nhìn — kiểu tựa phim:
// mỗi dòng/từ mờ + trồi lên + nét dần, lệch nhau một nhịp. Chạy lại mỗi lần
// cuộn vào (once: false) để cảm giác như chuyển cảnh video.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function StaggeredText({
  items,
  delay = 0.05,
  stagger = 0.16,
  className,
  itemClassName,
  disabled = false,
}: {
  items: ReactNode[];
  delay?: number;
  stagger?: number;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  if (disabled || reduce) {
    return (
      <span className={className}>
        {items.map((it, i) => (
          <span key={i} className={itemClassName}>{it}</span>
        ))}
      </span>
    );
  }
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {items.map((it, i) => (
        <motion.span
          key={i}
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, y: 26, filter: "blur(5px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
          }}
        >
          {it}
        </motion.span>
      ))}
    </motion.span>
  );
}
