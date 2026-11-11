// "BÃO HOA ĐỤC LỖ" — chuyển cảnh của Đa Lớp Bồng Bềnh, mẫu Pikbest
// 1526340 "Romantic Tanabata Festival Photo Studio Wedding
// Electronic Brochure AE" (cơ chế do chị chủ Nancy mô tả, 2026-11-11
// 17:00 — video preview KHÔNG tải được về để đo khung hình: trang
// Pikbest chặn mọi đường tải (Cloudflare 403; xem
// research_notes/pikbest-1526340-bao-hoa/report.md), nên mọi thông
// số dưới đây theo MÔ TẢ CỦA CHỊ, không phải số đo pixel từ video).
//
// CƠ CHẾ (không phải bão cuốn ảnh cũ đi): một LỚP phủ lên trên, rồi
// lớp đó bị ĐỤC THỦNG theo đường đi của cơn bão — như compound path
// / knockout trong Illustrator — chỗ lủng ra chính là ẢNH MỚI nằm
// sẵn bên dưới. Ảnh mới render SẴN dưới lớp trên; lớp trên bị khoét
// lỗ dần theo vệt bão để lộ ảnh mới ra.
//
// TRIỂN KHAI BẰNG CODE (không dùng video):
// - Parent đổi ảnh NGAY lúc bắt đầu chuyển (cảnh mới nằm sẵn bên
//   dưới); overlay này render lại ẢNH CŨ đúng vị trí/kích thước khung
//   cũ trên nền hồng phấn — lúc t=0 không có cú nhảy hình.
// - Lớp ảnh cũ bịt bằng SVG <mask> (userSpaceOnUse): hình chữ nhật
//   trắng (ảnh cũ hiện) + các vòng tròn đen (lỗ đục) mọc dần theo
//   vệt bão chéo xoáy, xen kẽ hướng trái/phải mỗi lần chuyển; mép lỗ
//   mềm (feGaussianBlur). Lỗ chính (26 cái) mọc dọc vệt bão, rồi 10
//   lỗ lấp đầy mọc ở các góc/mép để lộ hết ảnh mới lúc ~1,45s.
// - ~14 cánh hoa bay dọc đúng vệt bão (framer-motion) đánh dấu chỗ
//   đang đục lỗ — bán cảm giác "cơn bão" đi qua.
// - Tổng 1,6s. Giảm chuyển động: parent đổi cảnh tức thì, không
//   render overlay này.
//
// Dùng lại: phủ đúng vùng cảnh (stage) của slideshow, chạy 1 lần mỗi
// khi đổi ảnh — đặt trong div stage (relative) của slideshow.
//   {storm && <StormPunchOverlay key={storm.key} sweepKey={storm.key}
//     direction={storm.dir} oldPhoto={storm.oldPhoto} reduce={reduce} />}
// - Parent đổi ảnh ở t=0 (không chờ mốc giữa như Hoa Cuốn Màn);
//   overlay tự biến mất khi parent setStorm(null) ở mốc durationS.
// - Nếu mask không hoạt động (trình duyệt lạ), lớp cũ sẽ biến mất
//   đột ngột lúc hết giờ — QA phải chụp đúng mốc 0,4s/0,9s để thấy
//   lỗ đang đục; nếu không thấy lỗ thì quay về Hoa Cuốn Màn.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { STORM_PUNCH } from "@/lib/transitions";

/** Màu cánh hoa bay theo vệt bão — đỏ hồng đậm như Hoa Cuốn Màn. */
const PETAL_COLORS = ["#c3002f", "#bd0032", "#c22b4a", "#d81b4c", "#a8002a"];
/** Hình cánh hoa hồng — bầu dục nhọn một đầu (viewBox 0 0 100 100). */
const PETAL_PATH = "M50 4 C78 22 92 52 50 96 C8 52 22 22 50 4 Z";

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render. */
function sj(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

type Hole = {
  /** Vị trí lỗ theo tỉ lệ khung (0..1) — nhân với W/H lúc chạy. */
  fx: number;
  fy: number;
  /** Bán kính tối đa theo tỉ lệ min(W,H). */
  rMax: number;
  /** Mốc bắt đầu mọc (giây). */
  t0: number;
  /** Thời gian mọc xong (giây). */
  grow: number;
};

/** Vệt bão: đường chéo xoáy từ một phía sang phía đối diện, xen kẽ
 *  hướng theo từng lần chuyển (dir=1: vào từ phải-trên, ra trái-dưới).
 *  26 lỗ chính dọc vệt + 10 lỗ lấp đầy ở góc/mép. */
function buildHoles(direction: 1 | -1): Hole[] {
  const holes: Hole[] = [];
  for (let i = 0; i < STORM_PUNCH.holeCount; i++) {
    const u = i / (STORM_PUNCH.holeCount - 1);
    const fx =
      direction === 1
        ? 1.08 - u * 1.16 + sj(i * 3 + 1, 0.04)
        : -0.08 + u * 1.16 + sj(i * 3 + 1, 0.04);
    const fy = 0.12 + u * 0.76 + 0.14 * Math.sin(u * Math.PI * 2.2 + 0.6) + sj(i * 7 + 2, 0.04);
    holes.push({
      fx,
      fy,
      rMax: 0.16 + Math.abs(sj(i * 5 + 3, 0.08)),
      t0: 0.08 + u * 0.75,
      grow: 0.45,
    });
  }
  // Lỗ lấp đầy: mọc muộn ở các vị trí rải khắp khung để lộ hết ảnh.
  for (let j = 0; j < STORM_PUNCH.fillCount; j++) {
    holes.push({
      fx: 0.08 + Math.abs(sj(j * 11 + 5, 0.84)),
      fy: 0.08 + Math.abs(sj(j * 13 + 7, 0.84)),
      rMax: 0.26 + Math.abs(sj(j * 17 + 2, 0.06)),
      t0: 0.9 + j * 0.04,
      grow: 0.5,
    });
  }
  return holes;
}

type StormPetal = {
  /** Vị trí dọc vệt bão (0..1) — cánh xuất phát ở đó. */
  u: number;
  size: number;
  rotate: number;
  spin: number;
  color: string;
  delay: number;
};

function buildPetals(): StormPetal[] {
  return Array.from({ length: STORM_PUNCH.petalCount }, (_, i) => ({
    u: i / (STORM_PUNCH.petalCount - 1),
    size: 22 + Math.abs(sj(i * 5 + 3, 16)),
    rotate: sj(i * 13 + 7, 170),
    spin: sj(i * 17 + 11, 360),
    color: PETAL_COLORS[i % PETAL_COLORS.length],
    delay: (i / (STORM_PUNCH.petalCount - 1)) * 0.55,
  }));
}

/** Điểm trên vệt bão tại u (tỉ lệ khung) — dùng chung cho lỗ + cánh. */
function pathPoint(u: number, direction: 1 | -1): { fx: number; fy: number } {
  return {
    fx: direction === 1 ? 1.08 - u * 1.16 : -0.08 + u * 1.16,
    fy: 0.12 + u * 0.76 + 0.14 * Math.sin(u * Math.PI * 2.2 + 0.6),
  };
}

export function StormPunchOverlay({
  sweepKey,
  direction,
  oldPhoto,
  reduce,
}: {
  /** Tăng mỗi lần đổi ảnh (key để remount + chạy lại từ đầu). */
  sweepKey: number;
  /** 1 = bão vào từ phải, ra bên trái; -1 = ngược lại. Xen kẽ mỗi lần. */
  direction: 1 | -1;
  /** URL ảnh cũ — render lại đúng khung cũ trên nền hồng. */
  oldPhoto: string;
  reduce: boolean;
}) {
  const holes = useMemo(() => buildHoles(direction), [direction]);
  const petals = useMemo(buildPetals, []);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Đo vùng stage (overlay inset-0 trong stage) để tính tọa độ mask.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
  }, []);

  const maskId = `lm-storm-mask-${sweepKey}`;
  const blurId = `lm-storm-soft-${sweepKey}`;

  // Vòng lặp đục lỗ: ghi thẳng bán kính r của từng vòng tròn (không
  // setState mỗi frame). Mốc 0 = lúc overlay mount.
  useEffect(() => {
    if (reduce || !size) return;
    let raf = 0;
    const t0 = performance.now();
    const minWH = Math.min(size.w, size.h);
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      for (let i = 0; i < holes.length; i++) {
        const c = circleRefs.current[i];
        if (!c) continue;
        const h = holes[i];
        const p = Math.min(1, Math.max(0, (t - h.t0) / h.grow));
        c.setAttribute("r", String((h.rMax * minWH * easeOutCubic(p)).toFixed(1)));
      }
      if (t < STORM_PUNCH.durationS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, size, holes]);

  if (reduce || sweepKey === 0) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="storm-punch"
      ref={boxRef}
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {/* SVG mask (chỉ <defs>, không vẽ gì lên màn hình): rect trắng
          giữ lớp cũ hiện, các vòng tròn đen là lỗ đục, mép mềm. */}
      {size && (
        <svg width={size.w} height={size.h} className="absolute inset-0" aria-hidden="true">
          <defs>
            <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h}>
              <rect width={size.w} height={size.h} fill="white" />
              <g filter={`url(#${blurId})`}>
                {holes.map((h, i) => (
                  <circle
                    key={i}
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                    cx={h.fx * size.w}
                    cy={h.fy * size.h}
                    r={0}
                    fill="black"
                  />
                ))}
              </g>
            </mask>
          </defs>
        </svg>
      )}

      {/* Lớp trên bị đục: ảnh cũ đúng khung cũ + nền hồng phấn (để lúc
          t=0 không nhảy hình so với cảnh cũ). Mask khoét dần → lộ cảnh
          mới nằm sẵn bên dưới. */}
      <div
        data-testid="storm-punch-layer"
        className="absolute inset-0 flex items-center justify-center px-5 py-6"
        style={{
          background: "linear-gradient(180deg, #fdf5f3 0%, #ffebea 100%)",
          maskImage: `url(#${maskId})`,
          WebkitMaskImage: `url(#${maskId})`,
        }}
      >
        <div className="relative w-[min(78vw,600px)]">
          <div className="relative overflow-hidden rounded-[3px] bg-white p-2.5 shadow-[0_14px_40px_rgba(122,31,43,0.16)]">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2px]">
              <img
                src={oldPhoto}
                alt=""
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cánh hoa bay dọc vệt bão — đánh dấu chỗ đang đục lỗ. */}
      {size &&
        petals.map((p, i) => {
          const a = pathPoint(Math.max(0, p.u - 0.08), direction);
          const b = pathPoint(Math.min(1, p.u + 0.55), direction);
          const c = pathPoint(Math.min(1, p.u + 0.95), direction);
          return (
            <motion.span
              key={i}
              className="absolute block will-change-transform"
              style={{
                width: p.size,
                height: p.size * 1.1,
                left: 0,
                top: 0,
              }}
              initial={{ x: a.fx * size.w, y: a.fy * size.h, rotate: p.rotate, opacity: 1 }}
              animate={{
                x: [a.fx * size.w, b.fx * size.w, c.fx * size.w],
                y: [a.fy * size.h, b.fy * size.h + 26, c.fy * size.h + 52],
                rotate: [p.rotate, p.rotate + p.spin / 2, p.rotate + p.spin],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: STORM_PUNCH.durationS,
                delay: p.delay,
                times: [0, 0.6, 1],
                ease: "easeInOut",
              }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                <path d={PETAL_PATH} fill={p.color} />
              </svg>
            </motion.span>
          );
        })}
    </div>
  );
}
