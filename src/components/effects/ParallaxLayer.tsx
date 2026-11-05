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
  range,
  children,
  className,
  style,
  disabled = false,
}: {
  speed?: number;
  // range=[tớiScrollY, tớiY]: thay vì y = scrollY × speed (tuyến tính vô
  // hạn), y đi 0 → tớiY khi scrollY đi 0 → tớiScrollY rồi GIỮ NGUYÊN
  // (clamp). Dùng cho đuôi phụng trái Song Phụng Đỏ (QA19): tốc độ −0.15
  // tuy đúng số gốc nhưng rút quá chậm ở tầm cuộn xem chỗ nối hero/thông
  // tin (cuộn 450px đuôi còn thò ~104px, 600px còn ~82px — mắt vẫn đọc là
  // "đuôi dài nguyên"); range [900, −180] rút dứt khoát thành chấm nhỏ
  // ngay khi chỗ nối vào khung (cuộn 900px đuôi không còn chạm khối thông
  // tin) và không bay đi xa khi cuộn tiếp (clamp). Phụng phải/HOA vẫn
  // dùng speed tuyến tính (+0.08/+0.05) vì chúng chỉ trôi nhẹ, không cần
  // điểm dừng.
  range?: [number, number];
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => {
    if (reduce || disabled) return 0;
    if (range) {
      const inMax = range[0] || 1;
      const t = Math.min(Math.max(v / inMax, 0), 1);
      return t * range[1];
    }
    return v * speed;
  });
  return (
    <motion.div className={className} style={{ ...style, y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
