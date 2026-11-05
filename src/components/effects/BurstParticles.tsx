"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { mulberry32 } from "@/lib/seeded";

// Vụ nổ hạt vàng / cánh hoa — khoảnh khắc "wow" đầu tiên khi mở phong bì,
// hoặc vụ nổ nhỏ khi chạm vào thẻ demo. Render tại gốc tọa độ của phần tử
// cha đã định vị (cha đặt nó ở điểm cần nổ: giữa màn hình, điểm chạm...).
// Mỗi hạt bay ra theo một hướng ngẫu nhiên rồi mờ dần (Framer Motion).
export interface BurstParticlesProps {
  count?: number;
  colors?: string[];
  size?: [number, number]; // cỡ hạt nhỏ–lớn (px)
  duration?: number; // giây
  spread?: number; // khoảng bay xa (px)
  seed?: number; // cho trước hạt giống để vụ nổ ổn định; không cho thì ngẫu nhiên mỗi lần
  onDone?: () => void;
  className?: string;
}

interface Particle {
  angle: number;
  dist: number;
  size: number;
  color: string;
  petal: boolean;
  rotate: number;
  delay: number;
}

const GOLD = ["#c9a86a", "#e8c87e", "#f6d365", "#fff0e7", "#d4a017"];

export function BurstParticles({
  count = 26,
  colors = GOLD,
  size = [4, 9],
  duration = 0.9,
  spread = 160,
  seed,
  onDone,
  className,
}: BurstParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    const rand = seed !== undefined ? mulberry32(seed) : Math.random;
    return Array.from({ length: count }, () => ({
      angle: rand() * Math.PI * 2,
      dist: spread * (0.45 + rand() * 0.55),
      size: size[0] + rand() * (size[1] - size[0]),
      color: colors[Math.floor(rand() * colors.length)],
      petal: rand() < 0.3,
      rotate: (rand() - 0.5) * 540,
      delay: rand() * 0.08,
    }));
  }, [count, colors, size, spread, seed]);

  useEffect(() => {
    if (!onDone) return;
    const t = window.setTimeout(onDone, duration * 1000 + 150);
    return () => window.clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-visible ${className ?? ""}`}>
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{
            width: p.size,
            height: p.petal ? p.size * 1.8 : p.size,
            background: p.color,
            borderRadius: p.petal ? "50% 50% 50% 50% / 60% 60% 40% 40%" : "50%",
            left: -p.size / 2,
            top: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist - p.dist * 0.25,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.7],
            rotate: p.rotate,
          }}
          transition={{ duration, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
