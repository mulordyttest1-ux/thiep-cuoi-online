// Cover (bìa) — bước 1 của intro thay phong bì.
//
// Dấu ấn/signal của mẫu thiệp, CHỈ CHẠY 1 LẦN, KHÔNG dùng ảnh khách,
// KHÔNG chứa tên/ngày/ảnh mẫu — chỉ họa tiết của mẫu + lớp sáng theo
// biến thể. Tự chạy ~4–6s rồi sang bộ sưu tập; khách bấm vào cover thì
// bỏ qua, sang ngay. Giảm chuyển động: hiện tĩnh, không tự chạy, bấm
// nút "Tiếp tục" (hoặc bấm vào cover) để sang.
//
// Hệ thống cover (kế hoạch 2026-11-13, hướng lai):
// - Mẫu có decorationImages (song-phung-do): giữ nhánh deco riêng.
// - Mẫu có coverArt: cover từ artwork gốc (ArtCover).
// - Mẫu còn lại: cover vẽ bằng code theo motif (registry
//   src/components/covers/, ngôn ngữ đã chốt bằng demo Song Hỷ Đỏ).
"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer } from "@/components/effects";
import { ArtCover } from "@/components/covers/shared";
import { resolveCoverComponent } from "@/components/covers";
import { getIntroPreset, resolveIntroVariant, type SunFlareKind } from "@/lib/intro";

/** Vệt nắng chói — lớp sáng phủ lên cover, kiểu theo biến thể.
 *  Chỉ gradient + opacity (không ảnh ngoài, không hạt tròn vàng). */
function SunFlare({ kind }: { kind: SunFlareKind }) {
  const reduce = useReducedMotion();
  const style: React.CSSProperties = (() => {
    switch (kind) {
      case "warm":
        return { background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(246,211,101,0.5) 0%, rgba(246,211,101,0.12) 55%, transparent 75%)" };
      case "petals":
        return { background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.75) 0%, rgba(246,211,101,0.18) 50%, transparent 75%)" };
      case "bokeh":
        return { background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(246,211,101,0.65) 0%, rgba(212,175,55,0.2) 55%, transparent 78%)" };
      case "thin":
        return { background: "radial-gradient(ellipse 45% 22% at 50% 0%, rgba(201,168,106,0.28) 0%, transparent 75%)" };
      case "streak":
        // Vệt nắng dài chéo — dải sáng mỏng nghiêng, như ánh sáng rạp chiếu.
        return { background: "linear-gradient(115deg, transparent 42%, rgba(246,211,101,0.28) 48%, rgba(255,240,231,0.4) 50%, rgba(246,211,101,0.28) 52%, transparent 58%)" };
      case "festive":
        return { background: "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(246,211,101,0.55) 0%, rgba(232,93,117,0.25) 45%, transparent 75%)" };
    }
  })();
  if (reduce) {
    return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={style} />;
  }
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={style}
      initial={{ opacity: 0.55 }}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function IntroCover({
  data,
  fx,
  onDone,
}: {
  data: InvitationData;
  fx: TemplateEffects;
  /** Cover xong (hết giờ hoặc khách bấm) → sang bộ sưu tập. */
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const tpl = getTemplate(data.templateId);
  const variant = resolveIntroVariant(fx, tpl.variant);
  const preset = getIntroPreset(variant);
  const deco = tpl.decorationImages;
  // Tránh bấm đúp / timer chạy sau khi đã sang bước sau.
  const [done, setDone] = useState(false);
  const finish = () => {
    if (done) return;
    setDone(true);
    onDone();
  };

  useEffect(() => {
    if (reduce || done) return;
    const t = window.setTimeout(finish, preset.coverDurationMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, done, preset.coverDurationMs]);

  const motifMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: variant === "dien-anh" ? 1.18 : 0.7, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: variant === "dien-anh" ? 2.2 : 1.2, ease: "easeOut" as const },
      };

  // Chữ "Chạm để tiếp tục" theo màu nền THẬT của bìa, không theo preset:
  // mẫu có ảnh nền (coverArt.bg — cẩm thạch trắng, damask kem, lá xanh...)
  // thì nền thật là sáng/dậm dù preset biến thể ghi nền tối → chữ tối.
  const coverIsDark = preset.darkBg && !tpl.coverArt?.bg;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Màn mở đầu thiệp cưới — bấm để tiếp tục"
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") finish();
      }}
      className="relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: preset.coverBg }}
    >
      <SunFlare kind={preset.flare} />
      {/* Lớp ambient theo đúng biến thể (tia vàng / cánh hoa / bokeh /
          sao 4 cánh — dùng lại AmbientLayer, tự tắt khi giảm chuyển động). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Dấu ấn mẫu: mẫu deco dùng artwork gốc (chữ Hỷ + phụng + hoa),
          mẫu có coverArt dùng artwork gốc (ArtCover), mẫu còn lại dùng
          cover vẽ bằng code theo motif (registry src/components/covers/).
          Chữ "Chạm để tiếp tục" nằm trong luồng, dưới họa tiết chính,
          trong vùng trống — không bị họa tiết che. */}
      {deco ? (
        <motion.div {...motifMotion} className="relative z-10 flex flex-col items-center">
          <>
            <img
              src={deco.phuongRight}
              alt=""
              aria-hidden="true"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="pointer-events-none absolute -left-24 -top-20 w-[150px] rotate-[10deg] object-contain opacity-90 md:-left-32 md:w-[210px]"
            />
            <img
              src={deco.phuongRight}
              alt=""
              aria-hidden="true"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="pointer-events-none absolute -bottom-24 -right-20 w-[160px] object-contain opacity-90 md:-right-28 md:w-[210px]"
              style={{ transform: "scaleX(-1) rotate(5deg)" }}
            />
            <img
              src={deco.chuHy}
              alt="Chữ Hỷ"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="h-28 w-28 object-contain drop-shadow-[0_0_18px_rgba(246,211,101,0.55)] md:h-36 md:w-36"
            />
            <img
              src={deco.hoa}
              alt=""
              aria-hidden="true"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="pointer-events-none absolute -bottom-16 -left-16 w-[110px] object-contain opacity-70 md:w-[150px]"
            />
          </>
        </motion.div>
      ) : tpl.coverArt ? (
        <ArtCover art={tpl.coverArt} gold={tpl.palette.gold} variant={variant} />
      ) : (
        (() => {
          const Cover = resolveCoverComponent(tpl.motif);
          return <Cover tpl={tpl} variant={variant} />;
        })()
      )}

      <p
        className={`relative z-10 mt-10 text-center text-sm tracking-[0.3em] ${coverIsDark ? "text-white/70" : "text-[#7a6a68]"}`}
      >
        {reduce ? "Bấm để tiếp tục" : "Chạm để tiếp tục"}
      </p>
      {reduce && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            finish();
          }}
          className="open-pulse relative z-10 mt-6 rounded-full px-8 py-3 font-semibold text-white"
          style={{ background: tpl.palette.accent }}
        >
          Tiếp tục →
        </button>
      )}
    </div>
  );
}
