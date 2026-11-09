// Intro thay phong bì (2026-11-09, kịch bản chị chủ đã duyệt).
//
// Trình tự: 1) COVER (bìa) — dấu ấn/signal của mẫu thiệp, CHỈ CHẠY 1 LẦN,
// KHÔNG dùng ảnh khách, KHÔNG chứa tên/ngày/ảnh mẫu; 2) BỘ SƯU TẬP ảnh
// cưới của khách + chữ chạy (như video trình chiếu trong tiệc cưới), chạy
// LẶP đến khi khách muốn qua; 3) VÀO THIỆP — bấm 1 cái vào nội dung thiệp.
//
// Cả 5 kiểu dấu ấn Pikbest chị thích đều dùng được, gán theo biến thể
// effect (VARIANT_PRESETS) — KHÔNG sửa gán mẫu, chỉ đọc preset để map.
// Kỹ thuật chung: ảnh to + quay/zoom/move chậm + hiệu ứng (fake video bằng
// code, KHÔNG xuất video thật). Lớp sáng/ambient dùng lại AmbientLayer
// (đọc fx) nên cover tự đúng biến thể; preset ở đây chỉ thêm: nền cover,
// vệt nắng (sun flare), thời lượng cover.

import { VARIANT_PRESETS, type EffectVariant, type TemplateEffects } from "./templates";

export type SunFlareKind = "warm" | "petals" | "bokeh" | "thin" | "streak" | "festive";

export interface IntroPreset {
  variant: EffectVariant;
  /** Tên dấu ấn cover (để đọc trong code/docs). */
  label: string;
  /** Cover tự chạy bao lâu rồi sang bộ sưu tập (ms). */
  coverDurationMs: number;
  /** Nền cover (CSS background). */
  coverBg: string;
  /** Nền tối → motif trắng/vàng; nền sáng → motif màu accent của mẫu. */
  darkBg: boolean;
  /** Kiểu vệt nắng chói phủ lên cover. */
  flare: SunFlareKind;
}

export const INTRO_PRESETS: Record<EffectVariant, IntroPreset> = {
  "le-nghi": {
    variant: "le-nghi",
    label: "Phụng + Hỷ, nắng vàng ấm",
    coverDurationMs: 6000,
    coverBg: "linear-gradient(160deg, #710001, #5a0001 55%, #450001)",
    darkBg: true,
    flare: "warm",
  },
  "hoa-bay": {
    variant: "hoa-bay",
    label: "Cánh hoa rơi, nắng xuyên hoa",
    coverDurationMs: 5000,
    coverBg: "linear-gradient(160deg, #fdf2f4, #f9e8ec 55%, #fbe3d8)",
    darkBg: false,
    flare: "petals",
  },
  "anh-vang": {
    variant: "anh-vang",
    label: "Bokeh vàng + sao 4 cánh + vệt nắng chói",
    coverDurationMs: 5000,
    coverBg: "linear-gradient(160deg, #1a1206, #2b1d08 55%, #0f0a03)",
    darkBg: true,
    flare: "bokeh",
  },
  "toi-gian": {
    variant: "toi-gian",
    label: "Một vệt sáng mỏng, gần như không có",
    coverDurationMs: 3500,
    coverBg: "#fdf8f1",
    darkBg: false,
    flare: "thin",
  },
  "dien-anh": {
    variant: "dien-anh",
    label: "Vệt nắng dài + hạt phim + lia chậm",
    coverDurationMs: 6000,
    coverBg: "linear-gradient(160deg, #0d0d0f, #1c1a1e 60%, #000000)",
    darkBg: true,
    flare: "streak",
  },
  "le-hoi": {
    variant: "le-hoi",
    label: "Nắng rực + hạt nhiều màu",
    coverDurationMs: 5000,
    coverBg: "linear-gradient(160deg, #7a1f2b, #a31621 55%, #5a0001)",
    darkBg: true,
    flare: "festive",
  },
};

/** Biến thể intro đang dùng — suy từ bộ hiệu ứng đang áp (fx).
 *  getVariantEffects/getTemplateEffects trả ĐÚNG object preset trong
 *  VARIANT_PRESETS (các mẫu gán effects: VARIANT_PRESETS[...]) nên so
 *  tham chiếu là đủ; không khớp thì về biến thể của mẫu, cuối cùng là
 *  "le-nghi". Nhờ vậy ?fx= đổi được cả cover lẫn hiệu ứng thiệp mà không
 *  cần sửa trang /thiep/[id] (trang đó chỉ truyền effectsOverride). */
export function resolveIntroVariant(
  fx: TemplateEffects,
  templateVariant?: EffectVariant
): EffectVariant {
  for (const [name, preset] of Object.entries(VARIANT_PRESETS)) {
    if (preset === fx) return name as EffectVariant;
  }
  return templateVariant ?? "le-nghi";
}

export function getIntroPreset(variant: EffectVariant): IntroPreset {
  return INTRO_PRESETS[variant];
}
