"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { hashSeed, mulberry32 } from "@/lib/seeded";

// Hào quang bokeh — đốm sáng mờ (out-of-focus) trôi chậm khắp trang, lớp
// ambient thứ ba bên cạnh tia vàng (GoldSparkles) và cánh hoa (PetalFall).
// Dành cho biến thể Sang Trọng Ánh Vàng: ánh sáng mềm, sang, không phải
// hạt tròn — mỗi đốm là radial-gradient mờ dần ra mép (không có viền cứng,
// không nhìn như vết bẩn trên giấy kem). Chỉ transform + opacity.
export interface BokehGlowProps {
  count?: number;
  seed?: number | string;
  colors?: string[];
  className?: string;
}

export function BokehGlow({
  count = 8,
  seed = 1,
  colors = ["#e8c87e", "#f6d365", "#d4af37", "#c9a86a"],
  className,
}: BokehGlowProps) {
  const reduce = useReducedMotion();
  const orbs = useMemo(() => {
    const rand = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: 60 + rand() * 110,
      color: colors[Math.floor(rand() * colors.length)],
      duration: 14 + rand() * 10,
      delay: -rand() * 24, // delay âm: đã trôi giữa chừng ngay khi mở trang
      dx: (rand() - 0.5) * 120,
      dy: (rand() - 0.5) * 60,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);
  if (reduce) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {orbs.map((o, i) => (
        <span
          key={i}
          className="bokeh-drift absolute block rounded-full"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, ${o.color}cc 0%, ${o.color}55 45%, transparent 70%)`,
            filter: "blur(6px)",
            ["--bokeh-duration" as string]: `${o.duration}s`,
            ["--bokeh-dx" as string]: `${o.dx}px`,
            ["--bokeh-dy" as string]: `${o.dy}px`,
            animationDelay: `${o.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
