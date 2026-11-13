// Cover tối giản (motif "none", 8 mẫu — kế hoạch cover 2026-11-13).
// Đúng bản chất tối giản: KHÔNG huy hiệu lớn, KHÔNG CoverDivider — chỉ
// khung mảnh (đơn/kép theo tpl.frame) + 1 điểm nhấn nhỏ ở giữa (đường
// vàng mảnh 64×2px như TemplateMotif "none" + ◆ nhỏ màu accent) +
// khoảng trắng rộng. Các mẫu khác nhau bằng màu accent + kiểu khung +
// màu nền (nền do preset biến thể quyết, component không set nền).
// Giảm chuyển động thì tĩnh (qua useFade/useCenterMotion trong ./shared).
"use client";

import { motion } from "framer-motion";
import type { CoverProps } from "./shared";
import { GoldFrame, useCenterMotion, useFade } from "./shared";

export function CoverMinimal({ tpl, variant }: CoverProps) {
  const { accent, gold } = tpl.palette;
  const center = useCenterMotion(variant);
  const fade0 = useFade(0);
  // "double"/"triple" → khung kép (như GoldFrame); "single" và các kiểu
  // còn lại (scallop/band) → 1 khung mảnh duy nhất.
  const double = tpl.frame === "double" || tpl.frame === "triple";
  return (
    <>
      {double ? (
        <GoldFrame gold={gold} />
      ) : (
        <motion.div
          aria-hidden="true"
          {...fade0}
          className="pointer-events-none absolute inset-3 z-10 rounded-[2px] border"
          style={{ borderColor: `${gold}b3` }}
        />
      )}
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        <div aria-hidden="true" style={{ width: 64, height: 2, background: gold }} />
        <span aria-hidden="true" className="mt-5 text-sm leading-none" style={{ color: accent }}>
          ◆
        </span>
      </motion.div>
    </>
  );
}
