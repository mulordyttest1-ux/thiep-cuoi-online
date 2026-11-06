"use client";

// shadcn.io Sparkles — nền lấp lánh vàng (lấy từ https://www.shadcn.io/background/sparkles,
// trang docs 2026-11-06: DOM của demo render + CSS trong
// /styles/docs-backgrounds.css; registry /r/sparkles.json yêu cầu token nên
// không lấy được file gốc qua CLI).
// Không có particle engine/canvas: bụi là các tile SVG lặp lại, lấp lánh là
// pattern nhiễu trượt dưới lớp mặt nạ, tia 4 cánh là gradient trên keyframes.
// Bundle ~0 KB JS. Giảm chuyển động có sẵn: field/near tạm dừng
// (motion-reduce:[animation-play-state:paused]), tia ẩn (motion-reduce:hidden).
import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { hashSeed, mulberry32 } from "@/lib/seeded";

function cn(...xs: Array<string | undefined | false | null>): string {
  return xs.filter(Boolean).join(" ");
}

export interface SparklesProps {
  /** Số tia 4 cánh (glints) bật/tắt, 0–40; 0 = chỉ còn bụi lấp lánh. */
  count?: number;
  /** Mật độ bụi xa, 0.25–2 (1 ≈ 330 điểm trên màn 1280×720). */
  density?: number;
  /** Vùng mờ dần của lớp lấp lánh. */
  fade?: "none" | "radial" | "top" | "bottom";
  /** Đường kính nhỏ nhất của hạt bụi (px). */
  minSize?: number;
  /** Đường kính lớn nhất của hạt bụi (px). */
  maxSize?: number;
  /** Màu lấp lánh (CSS color). Mặc định: vàng đậm trên nền sáng. */
  sparkleColor?: string;
  /** Tốc độ lấp lánh (hệ số 0.25–3). */
  speed?: number;
  /** Seed ổn định để bụi/tia không xáo lại mỗi lần render. */
  seed?: number | string;
  className?: string;
  children?: ReactNode;
}

const TILE_SIZES = [307, 389, 449];
// Mật độ hiệu chuẩn theo tile demo của shadcn (307px: 11 hạt, 389px: 18,
// 449px: 24 — density 1 ≈ 330 điểm trên màn 1280×720).
const DUST_PER_PX2 = 0.000118;

function buildDustTile(
  rand: () => number,
  size: number,
  density: number,
  minSize: number,
  maxSize: number,
): string {
  const n = Math.max(1, Math.round(density * DUST_PER_PX2 * size * size));
  let circles = "";
  for (let i = 0; i < n; i++) {
    const cx = (rand() * size).toFixed(1);
    const cy = (rand() * size).toFixed(1);
    const r = (minSize / 2 + (rand() * (maxSize - minSize)) / 2).toFixed(2);
    const o = (0.5 + rand() * 0.5).toFixed(2);
    circles += `<circle cx='${cx}' cy='${cy}' r='${r}' fill-opacity='${o}'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${circles}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${size}px ${size}px`;
}

interface Glint {
  x: number;
  y: number;
  size: number;
  time: number;
  phase: number;
}

// fade là mask tự viết theo API của shadcn (giá trị mask chính xác của bản
// gốc không nằm trên trang docs): radial mờ về mọi mép, top/bottom mờ về
// một đầu.
const FADE_MASKS: Record<Exclude<SparklesProps["fade"], undefined | "none">, string> = {
  radial: "radial-gradient(ellipse 85% 80% at 50% 50%, #000 35%, transparent 75%)",
  top: "linear-gradient(to bottom, transparent 0%, #000 35%)",
  bottom: "linear-gradient(to top, transparent 0%, #000 35%)",
};

export function Sparkles({
  count = 12,
  density = 1,
  fade = "none",
  minSize = 1,
  maxSize = 2.5,
  sparkleColor,
  speed = 1,
  seed = 1,
  className,
  children,
}: SparklesProps) {
  const dustMask = useMemo(() => {
    const rand = mulberry32(hashSeed(String(seed)));
    return TILE_SIZES.map((s) => buildDustTile(rand, s, density, minSize, maxSize)).join(", ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, minSize, maxSize, seed]);

  const glints = useMemo<Glint[]>(() => {
    const rand = mulberry32(hashSeed(String(seed)) + 101);
    return Array.from({ length: count }, () => ({
      x: +((rand() * 100).toFixed(3)),
      y: +((rand() * 100).toFixed(3)),
      size: Math.round(24 + rand() * 20),
      time: +((5 + rand() * 3).toFixed(3)),
      phase: +(rand().toFixed(3)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);

  const layerStyle = {
    ...(sparkleColor ? { ["--sparkles-color" as string]: sparkleColor } : {}),
    ["--sparkles-count" as string]: count,
    ["--sparkles-speed" as string]: speed,
    ...(fade !== "none"
      ? { maskImage: FADE_MASKS[fade], WebkitMaskImage: FADE_MASKS[fade] }
      : {}),
  } as CSSProperties;

  return (
    <div data-slot="sparkles" className={cn("relative isolate overflow-hidden", className)}>
      <div
        aria-hidden="true"
        data-slot="sparkles-layer"
        className="sparkles-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden [content-visibility:auto]"
        style={layerStyle}
      >
        <div
          data-slot="sparkles-dust"
          className="sparkles-dust absolute inset-0 opacity-60 dark:opacity-75"
          style={{ ["--sparkles-dust" as string]: dustMask } as CSSProperties}
        >
          <div className="sparkles-field animate-sparkles-twinkle motion-reduce:[animation-play-state:paused]" />
        </div>
        <div data-slot="sparkles-glow" className="sparkles-glow absolute inset-0">
          <div className="sparkles-near animate-sparkles-shimmer motion-reduce:[animation-play-state:paused]" />
        </div>
        {glints.map((g, i) => (
          <span
            key={i}
            data-slot="sparkles-glint"
            className="sparkles-glint absolute top-[calc(var(--sparkles-y)*1%)] left-[calc(var(--sparkles-x)*1%)] size-[calc(var(--sparkles-size)*1px)] animate-sparkles-glint motion-reduce:hidden"
            style={
              {
                ["--sparkles-phase" as string]: g.phase,
                ["--sparkles-size" as string]: g.size,
                ["--sparkles-time" as string]: g.time,
                ["--sparkles-x" as string]: g.x,
                ["--sparkles-y" as string]: g.y,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {children}
    </div>
  );
}
