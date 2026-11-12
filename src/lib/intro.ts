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

/** Chia dòng thông tin theo số ảnh (chị chốt 2026-11-12): THÔNG TIN
 *  HẾT Ở ẢNH 1 — ảnh đầu tiên hiện đủ các dòng chính (Tên + Ngày +
 *  Địa điểm); các ảnh sau chỉ thêm CHỮ TRANG TRÍ (câu cưới phụ: Happy
 *  Wedding → Save the Day → Just Married → … theo thứ tự, hết thì lặp
 *  lại). 1 ảnh = đủ hết trên 1 ảnh (như trước); nhiều ảnh = ảnh 1 đủ
 *  thông tin, ảnh sau chỉ có câu trang trí. Dòng nào không có dữ liệu
 *  thật thì bỏ (không bịa); nếu không có dòng chính nào thì ảnh 1 cũng
 *  lấy câu trang trí như trước. Trả về mảng theo từng ảnh: slides[i]
 *  là các dòng hiện trên ảnh i; photoCount = 0 thì trả []. */
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
    if (i === 0 && coreLines.length > 0) {
      // Ảnh 1: đủ thông tin (tên + ngày + địa điểm).
      slides.push(coreLines);
    } else {
      // Ảnh sau: chỉ chữ trang trí; không có dòng chính nào thì ảnh 1
      // cũng lấy câu trang trí (chỉ số tính từ 0).
      const phraseIndex = coreLines.length > 0 ? i - 1 : i;
      const phrase =
        SLIDESHOW_PHRASES[phraseIndex % SLIDESHOW_PHRASES.length];
      slides.push([{ text: phrase, kind: "phrase" }]);
    }
  }
  return slides;
}

/** Hiệu ứng chữ trong slideshow intro (chị chủ chốt 2026-11-10):
 *  "sand" = hạt cát: chữ vỡ thành hạt cát bay lên, hạt rơi
 *  nhẹ từ trên xuống tụ lại thành chữ — theo mẫu cộng đồng Text Particles
 *  (webdevpuneet.com/ui-snippets/text-particles), nhưng rơi nhẹ từng chữ
 *  chứ không lò xo nảy / nổ tung như mẫu. "scatter" = Scatter & Reform
 *  chậm đã lưu (PR #28) — MẶC ĐỊNH từ 2026-11-11 (chị chọn scatter).
 *  "paper" = giấy dán: từng
 *  chữ rơi từ trên xuống, lật (rotateX ~78° về 0) rồi dán phẳng như tờ
 *  giấy — theo mẫu cộng đồng fake lật trang PDF (turn.js / FlipBook.js)
 *  + kiểu chữ rơi Bounce In Letters; tốc độ theo hàm số mũ (chậm đầu
 *  để thấy rõ hiệu ứng, nhanh sau để còn đọc). Chọn qua
 *  ?tx=sand|scatter|paper trên trang khách; giá trị lạ → về "scatter". */
export type TextEffectId = "sand" | "scatter" | "paper";
export function isTextEffectId(v: string | null | undefined): v is TextEffectId {
  return v === "sand" || v === "scatter" || v === "paper";
}
export function resolveTextEffect(v: string | null | undefined): TextEffectId {
  return isTextEffectId(v) ? v : "scatter";
}

// ---------------------------------------------------------------------------
// NHỊP ĐÁP CHUNG cho cả 3 hiệu ứng chữ (chị chốt 2026-11-10 16:24):
// cát + scatter + paper DÙNG CHUNG 1 nhịp — cùng gia tốc, vận tốc ban
// đầu gấp đôi paper cũ, gia tốc giữ nguyên.
//
// Paper cũ (v2/v3): đường cong tiến độ chung (1 − e^(−K·x))/(1 − e^(−K))
// với K = 2,5, khoảng trải lần bắt đầu S = T − DUR = 4,1s, mỗi chữ
// bay/rơi/lật DUR = 0,9s, cả dòng đáp xong T = 5,0s. Vận tốc ban đầu
// của mặt trận đáp: v0 = (1 − e^(−K))/(K·S) ≈ 0,090 (phần dòng/giây)
// — khoảng cách giữa 2 lần đáp đầu ≈ 0,78s (dòng 14 chữ); đo live:
// 25% lúc 2,5s, 52% lúc 3,7s, 90% lúc 4,6s (dòng 14 chữ "Thu An &
// Minh Quân", đo bằng độ sáng dòng tên).
// Mới: GIỮ K = 2,5 (cùng hệ số mũ = cùng độ cong/tốc độ tăng của nhịp
// = gia tốc giữ nguyên), GẤP ĐÔI v0 → S' = S/2 = 2,05s (v0 tỉ lệ
// nghịch với S khi K không đổi: v0' ≈ 0,179 phần dòng/giây). Mỗi chữ
// vẫn bay/rơi/lật 0,9s như paper cũ nên 3 hiệu ứng đáp TRÙNG NHAU
// trên cùng lịch: chữ cuối bắt đầu ở 2,05s, đáp xong ở T' = 2,95s
// (cũ 5,0s). Tốc độ đáp vẫn tăng dần theo thời gian như cũ (chậm đầu,
// nhanh cuối — khoảng cách giữa các lần đáp co lại theo e^(K·x)).
// ---------------------------------------------------------------------------

/** Hệ số mũ của đường cong tiến độ chung (gia tốc — giữ nguyên từ paper v2/v3). */
export const TEXT_PACE_K = 2.5;
/** Khoảng trải lần bắt đầu (giây): chữ cuối bắt đầu ở 2,05s (cũ 4,1s — halved để v0 ×2). */
export const TEXT_PACE_SPAN_S = 2.05;
/** Mỗi chữ bay/rơi/lật bao lâu (giây) — giống nhau cho cả 3 hiệu ứng để 3 đường cong đáp trùng nhau. */
export const TEXT_PACE_DUR_S = 0.9;
/** Cả dòng đáp xong sau ~2,95s (cũ 5,0s). */
export const TEXT_PACE_TOTAL_S = TEXT_PACE_SPAN_S + TEXT_PACE_DUR_S;

/** Đường cong tiến độ chung (dạng lõm: 0 lúc bắt đầu, 1 lúc cuối, chậm
 *  đầu nhanh cuối). Đạo hàm tại 0 là K/(1 − e^(−K)) ≈ 2,72 — độ dốc lúc
 *  bắt đầu; tốc độ mặt trận tăng theo e^(K·x) dọc dòng (gia tốc tổng
 *  xuyên suốt, giữ nguyên K). */
export function textPaceCurve(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return (1 - Math.exp(-TEXT_PACE_K * x)) / (1 - Math.exp(-TEXT_PACE_K));
}

/** Thời điểm bắt đầu của chữ thứ i (i = 0..n−1) trên đường cong chung:
 *  start_i = SPAN × pace(i/(n−1)). Chữ đầu bắt đầu ở 0s, chữ cuối bắt
 *  đầu ở SPAN và đáp đúng TOTAL. Khoảng cách giữa các lần đáp co lại
 *  liên tục theo hàm mũ (gia tốc tổng xuyên suốt) — không chia gap rời
 *  rạc theo từng chữ. */
export function textPaceStartAt(i: number, n: number): number {
  if (n <= 1) return 0;
  return TEXT_PACE_SPAN_S * textPaceCurve(i / (n - 1));
}

/** Thời điểm bắt đầu cho một phần tử ở vị trí ngang u ∈ [0,1] của dòng
 *  (dùng cho hạt cát: hạt càng phải bắt đầu càng muộn, theo cùng đường
 *  cong — trái→phải, chậm đầu nhanh cuối). */
export function textPaceDelayAt(u: number): number {
  return TEXT_PACE_SPAN_S * textPaceCurve(u);
}
