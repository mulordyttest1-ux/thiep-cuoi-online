"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Parallax theo cuộn trang — lớp trang trí trôi với tốc độ khác chữ
// (Framer Motion useScroll, không tự viết scroll listener). Tốc độ âm =
// trôi ngược hướng cuộn (đuôi phụng rút lên), dương = trôi cùng hướng.
// Có chặn thumbnail: trong thẻ thư viện (data-deco-thumbnail) thì tắt hẳn
// (bài học vòng 17: parallax chạy theo scroll trang gallery làm lệch tên).
export function useInsideThumbnail<T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  inside: boolean | null;
} {
  const ref = useRef<T | null>(null);
  const [inside, setInside] = useState<boolean | null>(null);
  useEffect(() => {
    setInside(!!ref.current?.closest("[data-deco-thumbnail]"));
  }, []);
  return { ref, inside };
}

export function ParallaxLayer({
  speed = -0.15,
  children,
  className,
  style,
  disabled = false,
}: {
  speed?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduce || disabled ? 0 : v * speed));
  return (
    <motion.div className={className} style={{ ...style, y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
