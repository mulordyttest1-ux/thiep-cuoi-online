// MÔ HÌNH 3 LỚP CHO INTRO (2026-11-10, chị chủ chốt).
//
// Toàn bộ intro (cover + bộ sưu tập + vào thiệp) gồm 3 lớp xếp chồng:
//   1) LỚP ĐÁY (base) — nền: 5 nhóm trong src/lib/backgrounds.ts
//      (Màu đặc, Gradient ánh sáng, Nền mờ từ ảnh, Hạt bay, Họa tiết
//      của mẫu). Ví dụ scrapbook: đáy là blurred background.
//   2) LỚP NỘI DUNG (content) — slideshow: ảnh Polaroid + chữ chạy
//      (tên, ngày, địa điểm, câu khẩu hiệu). Đã có trong
//      IntroSlideshow.tsx, giữ nguyên hành vi.
//   3) LỚP PHỦ (overlay) — phủ LÊN TRÊN nội dung: ánh sáng, tia lấp
//      lánh, cánh hoa rơi, bokeh. Trước đây nằm rải rác ở IntroCover
//      (gradient nắng SunFlare) và AmbientLayer (petals/sparkle/bokeh);
//      gom thành catalog có tên ở file này.
//
// Một biến thể thường XẾP CHỒNG nhiều lớp phủ (vd bìa le-nghi = nắng +
// tia vàng + cánh hoa). Vì vậy `overlay` trong VARIANT_PRESETS là DANH
// SÁCH các lớp phủ biến thể đó dùng, không phải một id duy nhất.
// File này là điểm vào duy nhất của mô hình (re-export cả catalog nền).

import type { EffectVariant, TemplateEffects } from "./templates";

export {
  BACKGROUND_STYLES,
  getBackgroundStyle,
  getVariantBackgrounds,
  type BackgroundGroupId,
  type BackgroundStyle,
} from "./backgrounds";

export type OverlayId = "sun" | "sparkle" | "petals" | "bokeh";

export interface OverlayStyle {
  /** id dùng trong code (vd `overlay: ["sun", "petals"]`). */
  id: OverlayId;
  /** Tên tiếng Việt trong thư viện. */
  name: string;
  /** Mô tả ngắn — nhận diện bằng mắt thường. */
  description: string;
  /** Đang dùng ở đâu trong app. */
  usedIn: string;
  /** Biến thể nào dùng lớp phủ này. */
  variants: EffectVariant[];
}

export const OVERLAY_STYLES: OverlayStyle[] = [
  {
    id: "sun",
    name: "Ánh nắng",
    description:
      "Vệt nắng vàng loang từ trên xuống (gradient radial/linear), phủ lên bìa để tạo chiều sâu và cảm giác ánh sáng. Hình vệt nắng khác nhau theo biến thể (ấm, xuyên hoa, chói, mỏng, dài, rực).",
    usedIn:
      "Bìa intro — SunFlare theo biến thể (src/components/IntroCover.tsx): warm (le-nghi), petals (hoa-bay), bokeh (anh-vang), thin (toi-gian), streak (dien-anh), festive (le-hoi). Chỉ có ở bìa, không có trong slideshow.",
    variants: ["le-nghi", "hoa-bay", "anh-vang", "toi-gian", "dien-anh", "le-hoi"],
  },
  {
    id: "sparkle",
    name: "Tia lấp lánh",
    description:
      "Tia vàng mảnh + sao 4 cánh lấp lánh khắp trang (không phải hạt tròn vàng).",
    usedIn:
      "AmbientLayer (src/components/effects/AmbientLayer.tsx) — GoldSparkles (tia vàng, theo ambient.kind sparkle/both) + Twinkle (sao 4 cánh, khi preset có twinkle); dùng ở bìa intro, slideshow và trang khách.",
    variants: ["le-nghi", "anh-vang", "dien-anh", "le-hoi"],
  },
  {
    id: "petals",
    name: "Cánh hoa rơi",
    description: "Cánh hoa rơi nhẹ từ trên xuống, màu hồng/vàng theo biến thể.",
    usedIn:
      "AmbientLayer (src/components/effects/AmbientLayer.tsx) — PetalFall (theo ambient.kind petals/both, số cánh theo ambient.petals); dùng ở bìa intro, slideshow và trang khách.",
    variants: ["le-nghi", "hoa-bay", "le-hoi"],
  },
  {
    id: "bokeh",
    name: "Bokeh",
    description: "Hào quang mờ hình tròn trôi nhẹ, tông vàng ấm, cảm giác xa xỉ.",
    usedIn:
      "AmbientLayer (src/components/effects/AmbientLayer.tsx) — BokehGlow (khi ambient.kind = \"bokeh\"); dùng ở bìa intro, slideshow và trang khách.",
    variants: ["anh-vang"],
  },
];

/** Tra cứu một lớp phủ theo id; id lạ thì về "sun". */
export function getOverlayStyle(id: OverlayId): OverlayStyle {
  return OVERLAY_STYLES.find((s) => s.id === id) ?? OVERLAY_STYLES[0];
}

/** 3 lớp của một bộ hiệu ứng (đọc từ VARIANT_PRESETS): lớp đáy +
 *  lớp phủ. Lớp nội dung là slideshow, không nằm trong preset.
 *  Preset cũ thiếu trường thì đáy về "solid", phủ về [] (không phủ). */
export function getPresetLayers(fx: TemplateEffects): {
  background: import("./backgrounds").BackgroundGroupId;
  overlay: OverlayId[];
} {
  return {
    background: fx.background ?? "solid",
    overlay: fx.overlay ?? [],
  };
}
