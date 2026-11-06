"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

// Hiện nội dung bằng wipe clip-path khi cuộn vào (giai đoạn B7 ảnh,
// C10 mục): mặt nạ cắt từ một phía rồi mở dần trong 0.9s, expo.out.
// Chỉ animate clip-path (không đụng layout). Giảm chuyển động: hiện ngay,
// không wipe.
//
// QUAN TRỌNG (bug đã gặp 2026-11-06): KHÔNG được bắt đầu từ inset(100%):
// clip-path che kín 100% khiến IntersectionObserver tính ratio = 0 cho
// phần tử này, mà whileInView cần ratio vượt ngưỡng amount mới kích hoạt
// -> tự khóa chết: wipe không bao giờ chạy, ảnh/mục biến mất vĩnh viễn
// (đã đo thực tế: div clip 100% có ratio 0, còn nút cha không clip có
// ratio 1). Dùng 99% (chỉ hở 1% ~ vài px, mắt thường không thấy) + amount
// 0 (ngưỡng 0: bất kỳ ratio > 0 nào cũng kích hoạt) thì wipe chạy bình
// thường. Đừng đổi lại thành 100% hay amount > 0.
export type ImageRevealDirection = "up" | "down" | "left" | "right";

const FROM: Record<ImageRevealDirection, string> = {
  up: "inset(99% 0% 0% 0%)",
  down: "inset(0% 0% 99% 0%)",
  left: "inset(0% 99% 0% 0%)",
  right: "inset(0% 0% 0% 99%)",
};

export function ImageReveal({
  children,
  direction = "up",
  duration = 0.9,
  disabled = false,
  className,
  style,
}: {
  children: ReactNode;
  direction?: ImageRevealDirection;
  duration?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (disabled || reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ clipPath: FROM[direction] }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ amount: 0, once: false }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
