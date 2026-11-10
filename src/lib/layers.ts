// MÔ HÌNH 3 LỚP CHO INTRO (2026-11-10, chị chủ chốt).
//
// Toàn bộ intro (cover + bộ sưu tập + vào thiệp) gồm 3 TẦNG CHÍNH xếp
// chồng:
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
// QUY TẮC CHỒNG TẦNG (chị chốt 2026-11-10): 3 lớp trên chỉ là 3 TẦNG
// CHÍNH — trong mỗi tầng, các tầng con của nó được CHỒNG lên nhau theo
// thứ tự dưới lên trên. Lớp phủ đã là danh sách từ đầu (vd bìa le-nghi
// = nắng + tia vàng + cánh hoa); lớp đáy từ nay cũng là DANH SÁCH (vd
// [màu đặc, gradient ánh sáng] hoặc [màu đặc, họa tiết mẫu]); lớp nội
// dung cũng chồng nhiều thành phần (dòng mời → ảnh → chữ → chấm trang
// → nút). `getPresetLayers` vì vậy trả về cả 3 tầng, mỗi tầng là một
// danh sách có thứ tự (dưới lên trên).
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

/** Các tầng con của lớp nội dung (slideshow), theo thứ tự chồng dưới
 *  lên trên như đang render trong IntroSlideshow: dòng mời → chồng
 *  ảnh Polaroid → chữ chạy → chấm trang → nút "Xem thiệp". Thứ tự này
 *  cố định cho mọi biến thể (không nằm trong preset); thành phần nào
 *  không có (vd chấm trang chỉ khi nhiều ảnh) thì bỏ qua khi render. */
export type ContentLayerId = "invite" | "photos" | "text" | "dots" | "button";

export const SLIDESHOW_CONTENT_LAYERS: ContentLayerId[] = [
  "invite",
  "photos",
  "text",
  "dots",
  "button",
];

/** 3 tầng chính của một bộ hiệu ứng (đọc từ VARIANT_PRESETS): mỗi tầng
 *  là một DANH SÁCH có thứ tự (dưới lên trên) — lớp đáy chồng nhiều
 *  kiểu nền, lớp nội dung chồng các thành phần slideshow, lớp phủ
 *  chồng nhiều lớp phủ. Preset cũ thiếu trường thì đáy về ["solid"],
 *  phủ về [] (không phủ). `background` cũ dạng một id đơn (trước
 *  2026-11-10) vẫn hiểu là danh sách 1 phần tử. */
export function getPresetLayers(fx: TemplateEffects): {
  background: import("./backgrounds").BackgroundGroupId[];
  content: ContentLayerId[];
  overlay: OverlayId[];
} {
  const raw = fx.background as
    | import("./backgrounds").BackgroundGroupId
    | import("./backgrounds").BackgroundGroupId[]
    | undefined;
  const background: import("./backgrounds").BackgroundGroupId[] = Array.isArray(raw)
    ? raw
    : raw
      ? [raw]
      : ["solid"];
  return {
    background: background.length > 0 ? background : ["solid"],
    content: [...SLIDESHOW_CONTENT_LAYERS],
    overlay: fx.overlay ?? [],
  };
}
