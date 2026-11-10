// Phân loại kiểu nền trong thư viện effect (2026-11-10, chị chủ duyệt).
//
// Trước đây app có 4 kiểu để nền rải rác, không có tên gọi chung: màu
// đặc trong slideshow, gradient nắng trên bìa, hạt bay (AmbientLayer),
// họa tiết riêng của từng mẫu — cộng thêm kiểu nền mờ từ ảnh mới làm.
// Gom thành 5 nhóm có tên ở đây để mẫu mới chỉ cần chọn một kiểu nền
// là xong, khỏi nghĩ lại từ đầu.
//
// LƯU Ý: một biến thể thường XẾP CHỒNG nhiều kiểu nền (vd bìa le-nghi =
// họa tiết phụng + Hỷ trên nền đỏ + gradient nắng + tia vàng/cánh hoa).
// `background` trong VARIANT_PRESETS (templates.ts) chỉ tên kiểu nền
// CHÍNH/đặc trưng nhất của biến thể đó; bảng dưới ghi rõ mỗi nhóm đang
// dùng ở đâu để không nhầm lớp nền với lớp phủ.

import type { EffectVariant } from "./templates";

export type BackgroundGroupId = "solid" | "glow" | "blurred-photo" | "particles" | "motif";

export interface BackgroundStyle {
  /** id dùng trong code (vd `background: "solid"`). */
  id: BackgroundGroupId;
  /** Tên tiếng Việt trong thư viện. */
  name: string;
  /** Mô tả ngắn — nhận diện bằng mắt thường. */
  description: string;
  /** Đang dùng ở đâu trong app. */
  usedIn: string;
  /** Biến thể nào lấy nhóm này làm kiểu nền chính. */
  variants: EffectVariant[];
}

export const BACKGROUND_STYLES: BackgroundStyle[] = [
  {
    id: "solid",
    name: "Màu đặc",
    description:
      "Nền một màu trơn, đổi màu theo từng ảnh/cảnh. Không họa tiết, không hạt.",
    usedIn:
      "Slideshow scrapbook — 4 màu trong SLIDESHOW_SCENES (src/lib/intro.ts): đỏ đậm #8c1d2f, hồng phấn #f9e8ec, trắng kem #fdf8f1, vàng hoàng hôn #f6d365; đổi theo từng ảnh.",
    variants: ["toi-gian"],
  },
  {
    id: "glow",
    name: "Gradient ánh sáng",
    description:
      "Vệt nắng vàng loang từ trên xuống (radial/linear gradient), phủ lên nền để tạo chiều sâu và cảm giác ánh sáng.",
    usedIn:
      "Bìa intro — SunFlare theo biến thể (src/components/IntroCover.tsx): warm, petals, bokeh, thin, streak, festive.",
    variants: ["dien-anh"],
  },
  {
    id: "blurred-photo",
    name: "Nền mờ từ ảnh",
    description:
      "Lấy chính tấm ảnh đang hiện, phóng to tràn khung, làm mờ + tối nhẹ, đặt làm nền sau ảnh nét (Ambient mode của YouTube). Nền tự ăn màu theo từng ảnh, không còn viền trống.",
    usedIn:
      "Slideshow — prop background=\"blurred\" của IntroSlideshow (src/components/IntroSlideshow.tsx). Mặc định slideshow vẫn chạy nền màu đặc; kiểu này chỉ bật khi truyền prop.",
    variants: [],
  },
  {
    id: "particles",
    name: "Hạt bay",
    description:
      "Hạt hiệu ứng bay/lấp lánh phủ trên nền: cánh hoa rơi, tia vàng 4 cánh, bokeh hào quang mờ, hoặc cả hai.",
    usedIn:
      "AmbientLayer (src/components/effects/AmbientLayer.tsx) — kind: petals (cánh hoa), sparkle (tia vàng 4 cánh), bokeh (hào quang mờ), both (cả hai); dùng ở bìa intro, slideshow và trang khách.",
    variants: ["hoa-bay", "anh-vang", "le-hoi"],
  },
  {
    id: "motif",
    name: "Họa tiết của mẫu",
    description:
      "Màu nền + họa tiết riêng của từng mẫu thiệp: phượng, chữ Hỷ, hoa văn. Đây là dấu ấn/signal nhận diện mẫu.",
    usedIn:
      "Bìa intro — TemplateMotif + nền cover theo biến thể (src/components/IntroCover.tsx, INTRO_PRESETS.coverBg trong src/lib/intro.ts); họa tiết từng mẫu khai báo trong templates.ts (motif, pattern, palette).",
    variants: ["le-nghi"],
  },
];

/** Tra cứu một kiểu nền theo id; id lạ thì về "solid". */
export function getBackgroundStyle(id: BackgroundGroupId): BackgroundStyle {
  return BACKGROUND_STYLES.find((s) => s.id === id) ?? BACKGROUND_STYLES[0];
}

/** Các kiểu nền chính của một biến thể — hiện mỗi biến thể có đúng 1
 *  kiểu nền chính (xem VARIANT_PRESETS), hàm này để sẵn cho lúc một
 *  biến thể cần nhiều kiểu nền chính. */
export function getVariantBackgrounds(variant: EffectVariant): BackgroundStyle[] {
  return BACKGROUND_STYLES.filter((s) => s.variants.includes(variant));
}
