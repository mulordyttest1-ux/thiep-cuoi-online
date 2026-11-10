"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { hashSeed, mulberry32 } from "@/lib/seeded";

// Hào quang bokeh — NÂNG CẤP 2026-11-10 theo mẫu Pikbest "Let's Fall In
// Love" (325641): đĩa sáng mờ viền tan dần, nhiều cỡ, tông vàng ấm/trắng,
// trôi chậm + breathe như thay đổi tiêu cự.
//
// Bản cũ (2026-11-09) nhìn "trẻ con": một cỡ duy nhất 60–170px, mọi đĩa
// cùng filter blur(6px) + cùng gradient (dừng ở transparent 70%) + cùng
// nhịp opacity 0,35↔0,7, màu vàng xỉn alpha thấp trên nền kem → nhìn như
// vết ố phẳng, không có chiều sâu, không có đĩa nào làm điểm nhấn.
//
// Bản mới — học từ khung hình mẫu:
//   - 3 TẦNG CỠ: 2 đĩa hero lớn (200–300px, ~15–25% chiều cao khung) làm
//     điểm nhấn + đĩa vừa (100–170px) + chấm nhỏ (40–80px).
//   - 2 LỚP SÂU–NÔNG: xa = mờ + tối hơn + trôi chậm (22–30s); gần = lõi
//     sáng + breathe (to–nhỏ 6–10s) + trôi nhanh hơn (14–20s).
//   - LÕI GẦN TRẮNG: gradient lõi #fffbe8/#fff3c4 → vàng ấm → tan tới
//     transparent 100% (không dừng đột ngột ở 70%), đĩa là "ánh sáng"
//     chứ không phải vết màu.
//   - KHÔNG filter: blur từng đĩa (mỗi đĩa blur là một lần paint đắt trên
//     mobile) — độ mềm lấy từ gradient. Chỉ transform + opacity.
// Chỉ dùng ở biến thể anh-vang (ambient kind "bokeh", count 10).
export interface BokehGlowProps {
  count?: number;
  seed?: number | string;
  colors?: string[];
  className?: string;
}

// [lõi gần trắng, tông giữa] — đĩa nào cũng sáng từ trong ra.
const PALETTE: [string, string][] = [
  ["#fffbe8", "#f6d365"],
  ["#fff3c4", "#e8b64c"],
  ["#fdeede", "#f2c9a0"],
  ["#fff8dc", "#e8c87e"],
];

type Orb = {
  left: number;
  top: number;
  size: number;
  core: string;
  mid: string;
  depth: "far" | "near";
  opacity: number;
  driftDuration: number;
  driftDelay: number;
  dx: number;
  dy: number;
  breatheDuration: number;
  breatheDelay: number;
};

export function BokehGlow({
  count = 8,
  seed = 1,
  colors,
  className,
}: BokehGlowProps) {
  const reduce = useReducedMotion();
  const orbs = useMemo<Orb[]>(() => {
    const rand = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
    const mids = colors && colors.length > 0 ? colors : PALETTE.map((p) => p[1]);
    const cores = PALETTE.map((p) => p[0]);
    return Array.from({ length: count }, (_, i) => {
      // Tầng cỡ: 2 đĩa hero đầu (khi đủ số lượng), rồi vừa, rồi nhỏ.
      const tier =
        count >= 6
          ? i < 2
            ? "hero"
            : i < 2 + Math.ceil(count * 0.4)
              ? "mid"
              : "small"
          : i === 0
            ? "hero"
            : "mid";
      const size =
        tier === "hero" ? 200 + rand() * 100 : tier === "mid" ? 100 + rand() * 70 : 40 + rand() * 40;
      // Lớp sâu–nông: hero luôn ở xa (mờ, to, chậm); vừa/nhỏ xen kẽ xa–gần.
      const depth: "far" | "near" = tier === "hero" ? "far" : rand() < 0.5 ? "far" : "near";
      return {
        left: rand() * 100,
        top: rand() * 100,
        size,
        core: cores[Math.floor(rand() * cores.length)],
        mid: mids[Math.floor(rand() * mids.length)],
        depth,
        opacity: depth === "far" ? 0.28 + rand() * 0.2 : 0.5 + rand() * 0.3,
        driftDuration: depth === "far" ? 22 + rand() * 8 : 14 + rand() * 6,
        driftDelay: -rand() * 30, // delay âm: đã trôi giữa chừng ngay khi mở trang
        dx: (rand() - 0.5) * 120,
        dy: (rand() - 0.5) * 60,
        breatheDuration: 6 + rand() * 4,
        breatheDelay: -rand() * 10,
      };
    });
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
            marginLeft: -o.size / 2,
            marginTop: -o.size / 2,
            opacity: o.opacity,
            ["--bokeh-duration" as string]: `${o.driftDuration}s`,
            ["--bokeh-dx" as string]: `${o.dx}px`,
            ["--bokeh-dy" as string]: `${o.dy}px`,
            animationDelay: `${o.driftDelay}s`,
          }}
        >
          <span
            className="bokeh-breathe block h-full w-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${o.core} 0%, ${o.mid}cc 30%, ${o.mid}55 55%, transparent 100%)`,
              ["--bokeh-breathe-duration" as string]: `${o.breatheDuration}s`,
              animationDelay: `${o.breatheDelay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
