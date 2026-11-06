"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

// Dải chữ chạy ngang phân cách các mục (giai đoạn B8): tên cặp đôi bằng
// chữ viết tay viền vàng, chạy liên tục; tốc độ theo vận tốc cuộn (cuộn
// nhanh thì chữ chạy nhanh, cuộn ngược thì chữ đổi chiều) — mẫu velocity
// marquee kinh điển của Framer Motion. Chỉ animate transform. Giảm chuyển
// động: một dòng tĩnh căn giữa, không chạy.
const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

export function Marquee({
  text,
  color = "#c9a86a",
  baseVelocity = 2,
  disabled = false,
  className,
}: {
  text: string;
  color?: string;
  baseVelocity?: number;
  disabled?: boolean;
  className?: string;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const directionFactor = useRef(1);
  const reduce = useReducedMotion();

  useAnimationFrame((_, delta) => {
    if (disabled || reduce) return;
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) directionFactor.current = -1;
    else if (vf > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  // 4 bản giống nhau, mỗi bản 25% chiều rộng → x quấn -20%..-45% là khít.
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  if (!text?.trim()) return null;
  if (disabled || reduce) {
    return (
      <div aria-hidden="true" className={`relative z-20 overflow-hidden border-y py-3 text-center ${className ?? ""}`} style={{ borderColor: "#c9a86a33" }}>
        <span className="font-script text-3xl md:text-4xl" style={{ color: "transparent", WebkitTextStroke: `1px ${color}` }}>
          {text}
        </span>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className={`relative z-20 overflow-hidden border-y py-3 ${className ?? ""}`} style={{ borderColor: "#c9a86a33" }}>
      <motion.div className="flex w-max whitespace-nowrap" style={{ x }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="font-script mx-6 text-3xl md:text-4xl" style={{ color: "transparent", WebkitTextStroke: `1px ${color}` }}>
            {text}{" "}
            <span className="mx-1 inline-block" style={{ color, WebkitTextStroke: "0px" }}>
              ✦
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
