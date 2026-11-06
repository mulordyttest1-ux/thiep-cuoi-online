"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { hashSeed, mulberry32 } from "@/lib/seeded";

// Cánh hoa vàng/hồng rơi chậm khắp trang — lớp chuyển động nền thứ hai bên
// cạnh bụi vàng. Rơi từ trên xuống (hơn một chiều cao viewport mỗi vòng),
// đung đưa ngang, xoay nhẹ. CSS animation, chỉ transform + opacity.
export interface PetalFallProps {
  count?: number;
  seed?: number | string;
  colors?: string[];
  className?: string;
}

export function PetalFall({
  count = 6,
  seed = 1,
  colors = ["#f6d365", "#e8c87e", "#ffb2b2", "#d4af37"],
  className,
}: PetalFallProps) {
  const reduce = useReducedMotion();
  const petals = useMemo(() => {
    const rand = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: 10 + rand() * 6,
      color: colors[Math.floor(rand() * colors.length)],
      duration: 9 + rand() * 5,
      delay: -rand() * 14, // delay âm: đã rơi giữa chừng ngay khi mở trang
      dx: (rand() - 0.5) * 80,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);
  if (reduce) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal-fall absolute block"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            boxShadow: `0 0 6px 1px ${p.color}`,
            ["--petal-duration" as string]: `${p.duration}s`,
            ["--petal-dx" as string]: `${p.dx}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
