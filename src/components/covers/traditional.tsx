// Cover vẽ bằng code cho nhóm truyền thống (kế hoạch cover 2026-11-13).
// Ngôn ngữ đã chốt bằng demo Song Hỷ Đỏ (Đợt 0): khung vàng kép toàn bìa
// + họa tiết góc + họa tiết chính ở giữa + đường kẻ vàng. Nền do preset
// biến thể quyết (component không set nền); giảm chuyển động thì tĩnh
// (qua useFade/useCenterMotion trong ./shared).
"use client";

import { motion } from "framer-motion";
import { getIntroPreset } from "@/lib/intro";
import type { EffectVariant } from "@/lib/templates";
import type { CoverProps } from "./shared";
import { CornerMarks, CoverDivider, GoldFrame, Medallion, useCenterMotion } from "./shared";

// Path cánh phụng tái dùng từ TemplateMotif (viewBox 0 0 120 44).
const WING = "M60 34 C44 24 30 22 14 26 C28 16 44 12 58 20 C52 26 54 30 60 34 Z";
const FEATHER = "M60 36 C48 30 38 30 28 34 C40 36 52 38 60 38 Z";
// Đường cong sóng dưới cặp rồng–phụng (TemplateMotif dragon-phoenix).
const WAVE = "M10 40 C30 34 50 42 70 36 C90 30 105 38 112 34";

/** Nền cover tối hay sáng — quyết định màu họa tiết (trắng/vàng gold
 *  trên nền tối, accent trên nền sáng). Lấy đúng từ preset biến thể. */
function isDarkCover(variant: EffectVariant): boolean {
  return getIntroPreset(variant).darkBg;
}

/** Chữ Hỷ nhỏ ở góc (dùng chung cho các cover truyền thống). */
function CornerHi({ gold }: { gold: string }) {
  return (
    <span className="text-xl font-bold leading-none" style={{ color: `${gold}c2` }}>
      囍
    </span>
  );
}

/** Song Hỷ — PORT Y NGUYÊN từ bản demo Đợt 0 (chị đã ưng ngôn ngữ này),
 *  chỉ tổng quát hóa: gold lấy từ tpl.palette.gold, motion qua
 *  useCenterMotion/useFade của ./shared. Huy hiệu 囍 vàng lớn trong vòng
 *  tròn vàng kép + khung vàng kép + 4 chữ Hỷ nhỏ ở góc + đường kẻ vàng. */
export function CoverDoubleHappiness({ tpl, variant }: CoverProps) {
  const gold = tpl.palette.gold;
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <CornerHi gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <Medallion gold={gold}>
          <span
            aria-hidden="true"
            className="text-[88px] font-bold leading-none"
            style={{ color: gold, textShadow: "0 0 24px rgba(246,211,101,0.6)" }}
          >
            囍
          </span>
        </Medallion>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Phụng — đôi cánh phụng SVG lớn (~220px, tái dùng path wing/feather
 *  của TemplateMotif). Cánh rộng hơn vòng Medallion (176px) nên đặt
 *  trần, không vòng — vẫn có khung vàng kép + chữ Hỷ góc + divider. */
export function CoverPhoenix({ tpl, variant }: CoverProps) {
  const { accent, gold } = tpl.palette;
  const main = isDarkCover(variant) ? "#ffffff" : accent;
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <CornerHi gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <svg
          aria-hidden="true"
          width={220}
          height={81}
          viewBox="0 0 120 44"
          fill="none"
          className="block"
          style={{ filter: "drop-shadow(0 0 14px rgba(246,211,101,0.45))" }}
        >
          <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={gold} fillOpacity="0.25">
            <path d={WING} />
            <g transform="translate(120,0) scale(-1,1)">
              <path d={WING} />
            </g>
            <path d={FEATHER} stroke={gold} />
            <g transform="translate(120,0) scale(-1,1)">
              <path d={FEATHER} stroke={gold} />
            </g>
            <circle cx="60" cy="8" r="3" fill={gold} stroke="none" />
          </g>
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Long Phụng — như CoverPhoenix nhưng thêm đường cong sóng vàng dưới
 *  cặp cánh (rồng cuộn sóng), cánh phóng to hơn một chút (240px). */
export function CoverDragonPhoenix({ tpl, variant }: CoverProps) {
  const { accent, gold } = tpl.palette;
  const main = isDarkCover(variant) ? "#ffffff" : accent;
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <CornerHi gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <svg
          aria-hidden="true"
          width={240}
          height={88}
          viewBox="0 0 120 44"
          fill="none"
          className="block"
          style={{ filter: "drop-shadow(0 0 14px rgba(246,211,101,0.45))" }}
        >
          <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={gold} fillOpacity="0.25">
            <path d={WING} />
            <g transform="translate(120,0) scale(-1,1)">
              <path d={WING} />
            </g>
            <path d={FEATHER} stroke={gold} />
            <g transform="translate(120,0) scale(-1,1)">
              <path d={FEATHER} stroke={gold} />
            </g>
            <circle cx="60" cy="8" r="3" fill={gold} stroke="none" />
            <path d={WAVE} stroke={gold} fill="none" />
          </g>
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/** Nhật Bình — dải ◆❦ xen kẽ lớn ở giữa, phóng to gấp đôi bản
 *  TemplateMotif (glyph text-3xl thay vì text-base, dải rộng 300px
 *  thay vì 150px), 2 đường vàng trên/dưới. Góc dùng ◆ nhỏ vàng. */
export function CoverNhatBinh({ tpl, variant }: CoverProps) {
  const { accent, gold } = tpl.palette;
  const main = isDarkCover(variant) ? "#ffffff" : accent;
  const center = useCenterMotion(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <span className="text-sm leading-none" style={{ color: `${gold}c2` }}>
          ◆
        </span>
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <div aria-hidden="true" className="w-[300px] max-w-[80vw]">
          <div style={{ height: 1, background: gold, opacity: 0.7 }} />
          <div className="flex items-center justify-center gap-4 py-3">
            {["◆", "❦", "◆", "❦", "◆", "❦", "◆"].map((c, i) => (
              <span key={i} className="text-3xl leading-none" style={{ color: i % 2 === 0 ? main : gold }}>
                {c}
              </span>
            ))}
          </div>
          <div style={{ height: 1, background: gold, opacity: 0.7 }} />
        </div>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}
