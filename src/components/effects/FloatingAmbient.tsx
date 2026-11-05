"use client";

import { useMemo } from "react";
import { hashSeed, mulberry32 } from "@/lib/seeded";

// Bụi vàng / cánh hoa trôi nhẹ khắp trang — hiệu ứng nền "không khí tiệc".
// Chỉ dùng transform + opacity (CSS animation, 60fps), không chặn chạm hay
// đọc chữ (pointer-events-none, hạt nhỏ, mờ). Vị trí ổn định theo seed.
export interface FloatingAmbientProps {
  count?: number;
  colors?: string[];
  seed?: number | string;
  opacity?: number; // 0..1
  className?: string;
}

interface Mote {
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  petal: boolean;
}

export function FloatingAmbient({
  count = 14,
  colors = ["#c9a86a", "#e8c87e", "#f6d365"],
  seed = 1,
  opacity = 0.45,
  className,
}: FloatingAmbientProps) {
  const motes = useMemo<Mote[]>(() => {
    const rand = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: 15 + rand() * 85,
      size: 3 + rand() * 4,
      color: colors[Math.floor(rand() * colors.length)],
      duration: 8 + rand() * 8,
      delay: -rand() * 14, // delay âm: đã bay giữa chừng ngay khi mở trang
      dx: (rand() - 0.5) * 60,
      petal: rand() < 0.35,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {motes.map((m, i) => (
        <span
          key={i}
          className="ambient-particle absolute block"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.petal ? m.size * 1.7 : m.size,
            background: m.color,
            borderRadius: "50%",
            ["--amb-duration" as string]: `${m.duration}s`,
            ["--amb-dx" as string]: `${m.dx}px`,
            ["--amb-opacity" as string]: opacity,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
