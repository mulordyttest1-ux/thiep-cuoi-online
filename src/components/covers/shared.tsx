// Ngôn ngữ cover chung cho 27 mẫu (kế hoạch cover 2026-11-13, hướng lai).
// Ngôn ngữ đã chốt bằng demo Song Hỷ Đỏ (Đợt 0): khung vàng kép toàn bìa
// + họa tiết góc + huy hiệu/họa tiết chính ở giữa + đường kẻ vàng +
// chữ "Chạm để tiếp tục" nằm trong luồng, vùng trống — không bị che.
// Mọi cover đều: vào cảnh scale 0.7→1 (dien-anh: 1.18→1) trong 1.2s
// (dien-anh 2.2s); khung/góc/divider fade vào có delay; giảm chuyển
// động thì TẤT CẢ tĩnh (không animation nào).
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Template, TemplateCoverArt } from "@/lib/templates";
import type { EffectVariant } from "@/lib/templates";

export interface CoverProps {
  tpl: Template;
  /** Biến thể intro đã resolve (quyết định thời lượng vào cảnh). */
  variant: EffectVariant;
}

/** Props motion fade-in có delay; giảm chuyển động → tĩnh. */
export function useFade(delay: number) {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 1.2, delay, ease: "easeOut" as const },
      };
}

/** Props motion vào cảnh của họa tiết chính; giảm chuyển động → tĩnh. */
export function useCenterMotion(variant: EffectVariant) {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : {
        initial: { opacity: 0, scale: variant === "dien-anh" ? 1.18 : 0.7, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: variant === "dien-anh" ? 2.2 : 1.2, ease: "easeOut" as const },
      };
}

/** Khung vàng kép toàn bìa (tuyệt đối so với cover root). */
export function GoldFrame({ gold }: { gold: string }) {
  const fade0 = useFade(0);
  const fade02 = useFade(0.2);
  return (
    <>
      <motion.div aria-hidden="true" {...fade0} className="pointer-events-none absolute inset-3 z-10 rounded-[2px] border" style={{ borderColor: `${gold}b3` }} />
      <motion.div aria-hidden="true" {...fade02} className="pointer-events-none absolute inset-[18px] z-10 rounded-[2px] border" style={{ borderColor: `${gold}66` }} />
    </>
  );
}

/** 4 họa tiết nhỏ ở góc, trong khung. `children` là 1 họa tiết nhỏ
 *  (vd chữ Hỷ nhỏ, cánh hoa, hình thoi) — render 4 lần. */
export function CornerMarks({ children }: { children: React.ReactNode }) {
  const fade05 = useFade(0.5);
  return (
    <>
      {["left-7 top-7", "right-7 top-7", "bottom-7 left-7", "bottom-7 right-7"].map((pos) => (
        <motion.span key={pos} aria-hidden="true" {...fade05} className={`pointer-events-none absolute z-10 flex items-center justify-center ${pos}`}>
          {children}
        </motion.span>
      ))}
    </>
  );
}

/** Đường kẻ vàng mảnh + hình thoi ở giữa, dưới họa tiết chính. */
export function CoverDivider({ gold }: { gold: string }) {
  const fade07 = useFade(0.7);
  return (
    <motion.div aria-hidden="true" {...fade07} className="relative z-10 mt-8 flex items-center gap-3">
      <span className="block h-px w-16" style={{ background: `${gold}b3` }} />
      <span className="text-xs" style={{ color: gold }}>
        ◆
      </span>
      <span className="block h-px w-16" style={{ background: `${gold}b3` }} />
    </motion.div>
  );
}

/** Vòng tròn vàng kép (huy hiệu) ôm họa tiết chính ở giữa. */
export function Medallion({ gold, children }: { gold: string; children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 flex h-44 w-44 items-center justify-center rounded-full border"
      style={{ borderColor: `${gold}cc`, boxShadow: "0 0 32px rgba(212,175,55,0.35)" }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-full border" style={{ borderColor: `${gold}80` }} />
      {children}
    </div>
  );
}

/** Ảnh <img> an toàn: lỗi thì ẩn (không vỡ bìa). */
export function CoverImg({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === ""}
      loading="eager"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className={className}
      style={style}
    />
  );
}

/** Cover từ artwork gốc (hướng B): nền toàn bìa + họa tiết chính giữa +
 *  họa tiết 4 góc + emblem nhỏ. Mọi slot đều tùy chọn — file nào không
 *  có thì slot đó bỏ trống, không vỡ layout. Vào cảnh dùng chung
 *  useCenterMotion/useFade; giảm chuyển động thì tĩnh. */
export function ArtCover({ art, gold, variant }: { art: TemplateCoverArt; gold: string; variant: EffectVariant }) {
  const center = useCenterMotion(variant);
  const fade03 = useFade(0.3);
  const fade05 = useFade(0.5);
  return (
    <>
      {art.bg && (
        <>
          <CoverImg src={art.bg} alt="" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-90" />
          {/* Lớp sáng dần về đáy để chữ tối "Chạm để tiếp tục" đọc được
              trên nền ảnh (lá xanh, damask...). Chỉ sáng phần đáy, không
              đè họa tiết chính ở giữa. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[45%]"
            style={{ background: "linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 55%, transparent 100%)" }}
          />
        </>
      )}
      <GoldFrame gold={gold} />
      {art.corners && (
        <>
          {[
            "left-6 top-6 w-[74px] rotate-[8deg]",
            "right-6 top-6 w-[74px] -scale-x-100 rotate-[8deg]",
            "bottom-6 left-6 w-[74px] rotate-[8deg]",
            "bottom-6 right-6 w-[74px] -scale-x-100 rotate-[8deg]",
          ].map((pos) => (
            <motion.span key={pos} aria-hidden="true" {...fade05} className={`pointer-events-none absolute z-10 ${pos}`}>
              <CoverImg src={art.corners as string} alt="" className="w-full object-contain opacity-90" />
            </motion.span>
          ))}
        </>
      )}
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {art.main && <CoverImg src={art.main} alt="" className="max-h-[240px] w-auto max-w-[260px] object-contain drop-shadow-[0_0_18px_rgba(246,211,101,0.55)]" />}
        {art.emblem && (
          <motion.div {...fade03} className="mt-4">
            <CoverImg src={art.emblem} alt="" className="h-8 w-8 object-contain opacity-90" />
          </motion.div>
        )}
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}
