// Cover vẽ bằng code cho nhóm sang trọng (kế hoạch cover 2026-11-13,
// hướng A): Cẩm Thạch, Baroque, Ren Thêu, Vườn Kính, Hoàng Gia Vàng,
// Biển Xanh. Ngôn ngữ chung (đã chốt bằng demo Song Hỷ Đỏ): khung vàng
// kép toàn bìa + họa tiết góc + họa tiết chính ở giữa + đường kẻ vàng.
// Không tự set background (nền do preset biến thể quyết) — trừ
// CoverMarble có thêm lớp vân đá mờ toàn bìa. Màu chính: nền tối
// (dien-anh/le-nghi/le-hoi/anh-vang) thì trắng/vàng gold; nền sáng
// (hoa-bay/toi-gian) thì màu accent của mẫu. Giảm chuyển động thì
// TẤT CẢ tĩnh (nhờ useFade/useCenterMotion trong shared.tsx).
"use client";

import { motion } from "framer-motion";
import type { EffectVariant, Template } from "@/lib/templates";
import type { CoverProps } from "./shared";
import { CoverDivider, CornerMarks, GoldFrame, Medallion, useCenterMotion } from "./shared";

/** Màu họa tiết chính theo nền: tối → trắng, sáng → accent của mẫu. */
function coverColors(tpl: Template, variant: EffectVariant) {
  const dark = variant === "le-nghi" || variant === "dien-anh" || variant === "le-hoi" || variant === "anh-vang";
  return { main: dark ? "#ffffff" : tpl.palette.accent, gold: tpl.palette.gold };
}

/** Hoa văn cuộn Baroque (tái dùng path gốc trong TemplateMotif), phóng
 *  to theo `width`. Stroke giữ ~1,5px hiển thị ở mọi cỡ. */
function ScrollSvg({ width, color, trim }: { width: number; color: string; trim: string }) {
  const stroke = Math.max(0.7, 180 / width);
  return (
    <svg aria-hidden="true" width={width} height={(width * 44) / 120} viewBox="0 0 120 44" fill="none" className="block">
      <g stroke={trim} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <path d="M60 34 C40 34 28 26 32 16 C35 8 48 10 48 18 C48 24 40 24 38 20" />
        <path d="M60 34 C80 34 92 26 88 16 C85 8 72 10 72 18 C72 24 80 24 82 20" />
        <circle cx="60" cy="38" r="2.5" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

/** 3 đường sóng (tái dùng path gốc trong TemplateMotif), phóng to theo
 *  `width`. Đường 1 + 3 màu chính, đường giữa màu gold. */
function WaveSvg({ width, color, trim }: { width: number; color: string; trim: string }) {
  const stroke = Math.max(0.7, 180 / width);
  return (
    <svg aria-hidden="true" width={width} height={(width * 44) / 120} viewBox="0 0 120 44" fill="none" className="block">
      <g stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <path d="M8 16 C24 8 40 24 56 16 C72 8 88 24 112 16" />
        <path d="M8 26 C24 18 40 34 56 26 C72 18 88 34 112 26" stroke={trim} />
        <path d="M8 36 C24 28 40 42 56 36 C72 28 88 42 112 36" opacity="0.6" />
      </g>
    </svg>
  );
}

/** Vương miện (tái dùng path gốc trong TemplateMotif), phóng to theo
 *  `width`. Thân vương miện màu gold, đế + đỉnh màu chính. */
function CrownSvg({ width, color, trim }: { width: number; color: string; trim: string }) {
  return (
    <svg aria-hidden="true" width={width} height={(width * 44) / 120} viewBox="0 0 120 44" fill="none" className="block">
      <g>
        <path d="M30 32 L36 12 L48 24 L60 8 L72 24 L84 12 L90 32 Z" fill={trim} />
        <rect x="30" y="32" width="60" height="4" fill={color} />
        <circle cx="60" cy="20" r="3" fill={color} />
      </g>
    </svg>
  );
}

/** 1 vòng tròn ren (viền gold, rỗng). */
function LaceRing({ size, color }: { size: number; color: string }) {
  return (
    <span aria-hidden="true" className="inline-block rounded-full" style={{ width: size, height: size, border: `2px solid ${color}` }} />
  );
}

/** Dải ren ngang: 9 vòng tròn xen kẽ rỗng/đặc (như TemplateMotif, phóng to). */
function LaceBand({ color, ringSize = 18, gap = 6 }: { color: string; ringSize?: number; gap?: number }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center" style={{ gap }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{ width: ringSize, height: ringSize, border: `2px solid ${color}`, background: i % 2 === 0 ? "transparent" : color }}
        />
      ))}
    </div>
  );
}

/** 3 khung kính đứng cạnh nhau (như TemplateMotif, phóng to gấp `scale`).
 *  Khung ngoài viền gold, khung giữa viền màu chính. */
function GlassFrames({ color, trim, scale = 3 }: { color: string; trim: string; scale?: number }) {
  const w = 22 * scale;
  const h = 30 * scale;
  return (
    <div aria-hidden="true" className="flex items-center justify-center" style={{ gap: 2 * scale }}>
      <span className="inline-block" style={{ width: w, height: h, border: `${scale >= 2 ? 2.5 : 1.5}px solid ${trim}` }} />
      <span className="inline-block" style={{ width: w, height: h, border: `${scale >= 2 ? 2.5 : 1.5}px solid ${color}` }} />
      <span className="inline-block" style={{ width: w, height: h, border: `${scale >= 2 ? 2.5 : 1.5}px solid ${trim}` }} />
    </div>
  );
}

/** Cẩm Thạch — nền vân đá mờ toàn bìa (4 vệt radial gold/accent, alpha
 *  thấp — không đè mất nền preset) + viên đá cẩm thạch trong Medallion.
 *  Chủ yếu phục vụ cam-thach-hong (cam-thach-vang có coverArt riêng). */
export function CoverMarble({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            `radial-gradient(ellipse 55% 35% at 18% 12%, ${gold}24, transparent 70%)`,
            `radial-gradient(ellipse 60% 40% at 85% 30%, ${main}14, transparent 70%)`,
            `radial-gradient(ellipse 70% 45% at 50% 88%, ${gold}1f, transparent 70%)`,
            `radial-gradient(ellipse 40% 30% at 75% 68%, ${main}12, transparent 70%)`,
          ].join(", "),
        }}
      />
      <GoldFrame gold={gold} />
      <CornerMarks>
        <span aria-hidden="true" className="text-sm" style={{ color: gold }}>
          ◆
        </span>
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <Medallion gold={gold}>
          <span
            aria-hidden="true"
            className="block h-28 w-28 rounded-full"
            style={{
              background: [
                `radial-gradient(circle at 32% 28%, ${gold}59, transparent 55%)`,
                `radial-gradient(circle at 68% 72%, ${main}40, transparent 55%)`,
                `radial-gradient(circle at 50% 50%, ${gold}33, transparent 70%)`,
                `linear-gradient(135deg, ${gold}26, ${main}14 45%, transparent 75%)`,
              ].join(", "),
              boxShadow: "inset 0 0 18px rgba(0,0,0,0.25)",
            }}
          />
        </Medallion>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Baroque — hoa văn cuộn đối xứng lớn ở giữa (240px, tái dùng path
 *  gốc), 4 góc là cuộn nhỏ (30px). */
export function CoverScroll({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <ScrollSvg width={30} color={main} trim={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <ScrollSvg width={240} color={main} trim={gold} />
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Ren Thêu — 1 vòng ren lớn làm huy hiệu trong Medallion (vòng ngoài
 *  gold + vòng trong màu chính) + dải ren 9 vòng lớn bên dưới. 4 góc
 *  là vòng ren nhỏ. */
export function CoverLace({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <LaceRing size={10} color={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <Medallion gold={gold}>
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-full"
            style={{ width: 84, height: 84, border: `2.5px solid ${gold}` }}
          >
            <span className="rounded-full" style={{ width: 56, height: 56, border: `2px solid ${main}`, background: `${main}14` }} />
          </span>
        </Medallion>
        <div className="mt-6">
          <LaceBand color={gold} ringSize={18} gap={6} />
        </div>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Vườn Kính — 3 khung kính lớn ở giữa (gấp 3 bản gốc: 66×90 mỗi khung,
 *  viền gold/trắng/gold), 4 góc là khung kính nhỏ. */
export function CoverGlass({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <span aria-hidden="true" className="inline-block" style={{ width: 12, height: 17, border: `1.5px solid ${gold}` }} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <GlassFrames color={main} trim={gold} scale={3} />
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Hoàng Gia Vàng — vương miện lớn (112px) trong Medallion, có phát
 *  sáng vàng nhẹ. 4 góc là ◆ nhỏ vàng. */
export function CoverCrown({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <span aria-hidden="true" className="text-sm" style={{ color: gold }}>
          ◆
        </span>
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <Medallion gold={gold}>
          <span style={{ filter: "drop-shadow(0 0 10px rgba(246,211,101,0.45))" }}>
            <CrownSvg width={112} color={main} trim={gold} />
          </span>
        </Medallion>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Biển Xanh — 3 đường sóng lớn làm dải ngang ở giữa (260px, màu
 *  chính + gold), 4 góc là sóng nhỏ (30px). */
export function CoverWave({ tpl, variant }: CoverProps) {
  const { main, gold } = coverColors(tpl, variant);
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <WaveSvg width={30} color={main} trim={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <WaveSvg width={260} color={main} trim={gold} />
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}
