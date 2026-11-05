"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Chữ hiện dần từng dòng / từng từ khi vào khung nhìn — kiểu tựa phim:
// mỗi dòng/từ mờ + trồi lên + nét dần, lệch nhau một nhịp. Chạy lại mỗi lần
// cuộn vào (once: false) để cảm giác như chuyển cảnh video.
// Lưu ý bố cục (bài học QA19 — tên hero chồng nhau): margin dọc (marginTop)
// đặt trên <span> inline BÊN TRONG wrapper thì trình duyệt bỏ qua, dòng 2
// mất khoảng cách; nên margin của từng dòng phải đặt vào chính wrapper
// (itemStyles) — wrapper là block nên margin có tác dụng. Với tên hero,
// dùng shift={false} + once để chỉ mờ/nét dần, KHÔNG dịch y (dịch y làm
// 2 dòng xê dịch/chồng nhau lúc bay và khi whileInView kích lại).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function StaggeredText({
  items,
  delay = 0.05,
  stagger = 0.16,
  className,
  itemClassName,
  itemStyles,
  shift = true,
  once = false,
  disabled = false,
}: {
  items: ReactNode[];
  delay?: number;
  stagger?: number;
  className?: string;
  itemClassName?: string;
  // style cho từng WRAPPER (motion.span block) — dùng để giữ đúng margin
  // của từng dòng (vd tên hero: dòng 2 marginLeft 5.5% + marginTop 1.1%).
  itemStyles?: CSSProperties[];
  // shift=false: chỉ opacity + blur, không dịch y — cho những dòng chữ mà
  // bố cục phải đứng yên tuyệt đối (tên hero).
  shift?: boolean;
  // once=true: chỉ hiện một lần, không chạy lại khi cuộn ra/vào.
  once?: boolean;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  if (disabled || reduce) {
    return (
      <span className={className}>
        {items.map((it, i) => (
          <span key={i} className={itemClassName} style={itemStyles?.[i]}>{it}</span>
        ))}
      </span>
    );
  }
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {items.map((it, i) => (
        <motion.span
          key={i}
          className={itemClassName}
          style={itemStyles?.[i]}
          variants={{
            hidden: shift ? { opacity: 0, y: 26, filter: "blur(5px)" } : { opacity: 0, filter: "blur(5px)" },
            show: shift
              ? { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } }
              : { opacity: 1, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
          }}
        >
          {it}
        </motion.span>
      ))}
    </motion.span>
  );
}
