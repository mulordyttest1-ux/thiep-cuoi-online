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

// ---------------------------------------------------------------------------
// Slideshow scrapbook (kịch bản đã duyệt 2026-11-10, mẫu Pikbest 10077037
// "Video Tỏ Tình đám Cưới"): album kỷ niệm kiểu scrapbook — ảnh viền trắng
// đặt nghiêng như Polaroid dán trên nền, ảnh mới xoay/trượt vào chồng lên
// ảnh trước + zoom chậm nhẹ, nền đổi màu theo cảnh, thiệp khẩu hiệu lặp
// lại như điệp khúc, nhịp chậm mỗi ảnh giữ vài giây.
// ---------------------------------------------------------------------------

/** Nền từng cảnh trong slideshow — đổi màu theo ảnh (đỏ đậm → hồng phấn →
 *  trắng kem → vàng hoàng hôn, lặp lại). `dark` = nền tối (chữ trắng),
 *  nền sáng thì chữ màu đỏ đô cho đọc rõ. */
export interface SlideshowScene {
  bg: string;
  dark: boolean;
  /** Màu chữ chính trên nền này. */
  text: string;
  /** Màu chữ phụ (dòng mời, ngày, địa điểm). */
  muted: string;
  /** Màu nhấn (dấu &, gạch ngăn). */
  accent: string;
}

export const SLIDESHOW_SCENES: SlideshowScene[] = [
  { bg: "#8c1d2f", dark: true, text: "#ffffff", muted: "rgba(255,255,255,0.85)", accent: "#f6d365" },
  { bg: "#f9e8ec", dark: false, text: "#7a1f2b", muted: "rgba(122,31,43,0.78)", accent: "#c9a86a" },
  { bg: "#fdf8f1", dark: false, text: "#5a1f2b", muted: "rgba(90,31,43,0.72)", accent: "#c9a86a" },
  { bg: "#f6d365", dark: false, text: "#6b2d1f", muted: "rgba(107,45,31,0.78)", accent: "#8c1d2f" },
];

/** Một dòng chữ trong slideshow. */
export interface SlideshowLine {
  text: string;
  kind: "name" | "date" | "venue" | "phrase";
}

/** Câu cưới phụ — thêm khi còn ảnh sau khi đã đủ 3 dòng chính, theo thứ
 *  tự này; hết danh sách thì lặp lại từ đầu. */
export const SLIDESHOW_PHRASES = [
  "Happy Wedding",
  "Save the Day",
  "Just Married",
  "Hãy yêu đến cùng",
  "LOVE",
  "Forever & Always",
];

/** Chia dòng thông tin theo số ảnh (kịch bản scrapbook đã duyệt):
 *  dòng chính theo thứ tự Tên → Ngày → Địa điểm; dòng phụ Happy Wedding
 *  → Save the Day → câu cưới khác khi còn ảnh. 1 ảnh = đủ hết trên 1 ảnh
 *  (các dòng chính còn lại dồn lên ảnh cuối); 2 ảnh = tên, rồi ngày +
 *  địa điểm; 3 ảnh = tên, ngày, địa điểm; 4 ảnh = + Happy Wedding;
 *  5 ảnh = + Save the Day; nhiều hơn thì thêm câu cưới khác. Lúc nào
 *  cũng đủ thông tin, không thiếu dòng chính. Dòng nào không có dữ liệu
 *  thật thì bỏ (không bịa). Trả về mảng theo từng ảnh: slides[i] là các
 *  dòng hiện trên ảnh i; photoCount = 0 thì trả []. */
export function getSlideshowSlides(
  photoCount: number,
  core: { name: string; date: string; venue: string }
): SlideshowLine[][] {
  const coreLines: SlideshowLine[] = [];
  if (core.name.trim()) coreLines.push({ text: core.name, kind: "name" });
  if (core.date.trim()) coreLines.push({ text: core.date, kind: "date" });
  if (core.venue.trim()) coreLines.push({ text: core.venue, kind: "venue" });
  const slides: SlideshowLine[][] = [];
  for (let i = 0; i < photoCount; i++) {
    if (i < coreLines.length) {
      // Ảnh cuối cùng nhận nốt các dòng chính còn lại (1 ảnh = đủ hết).
      slides.push(i === photoCount - 1 ? coreLines.slice(i) : [coreLines[i]]);
    } else {
      const phrase =
        SLIDESHOW_PHRASES[(i - coreLines.length) % SLIDESHOW_PHRASES.length];
      slides.push([{ text: phrase, kind: "phrase" }]);
    }
  }
  return slides;
}

/** Hiệu ứng chữ trong slideshow intro (chị chủ chốt 2026-11-10):
 *  "sand" = hạt cát (mặc định): chữ vỡ thành hạt cát bay lên, hạt rơi
 *  nhẹ từ trên xuống tụ lại thành chữ — theo mẫu cộng đồng Text Particles
 *  (webdevpuneet.com/ui-snippets/text-particles), nhưng rơi nhẹ từng chữ
 *  chứ không lò xo nảy / nổ tung như mẫu. "scatter" = Scatter & Reform
 *  chậm đã lưu (PR #28, giữ nguyên để dành). "paper" = giấy dán: từng
 *  chữ rơi từ trên xuống, lật (rotateX ~78° về 0) rồi dán phẳng như tờ
 *  giấy — theo mẫu cộng đồng fake lật trang PDF (turn.js / FlipBook.js)
 *  + kiểu chữ rơi Bounce In Letters; tốc độ theo hàm số mũ (chậm đầu
 *  để thấy rõ hiệu ứng, nhanh sau để còn đọc). Chọn qua
 *  ?tx=sand|scatter|paper trên trang khách; giá trị lạ → về "sand". */
export type TextEffectId = "sand" | "scatter" | "paper";
export function isTextEffectId(v: string | null | undefined): v is TextEffectId {
  return v === "sand" || v === "scatter" || v === "paper";
}
export function resolveTextEffect(v: string | null | undefined): TextEffectId {
  return isTextEffectId(v) ? v : "sand";
}
