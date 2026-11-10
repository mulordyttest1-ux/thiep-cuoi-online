// Kiểu slide ảnh cho bước bộ sưu tập của intro (lớp nội dung).
//
// "scrapbook" (mặc định): slideshow Polaroid scrapbook — ảnh viền trắng
// đặt nghiêng như Polaroid dán trên nền, kịch bản đã duyệt 2026-11-10
// (mẫu Pikbest 10077037). "romantic-brochure": kiểu brochure lãng mạn —
// ảnh tràn một bên + panel kem một bên với trái tim nhỏ + thẻ chữ viền
// vàng; ảnh cắt trái tim; ảnh mờ sau chữ; đường chéo mảnh (mẫu Pikbest
// 10085011 "Romantic Confession Valentine's Day Wedding Brochure", làm
// 2026-11-10). Kiểu mới là kiểu RIÊNG trong thư viện, không thay mặc định.
// Chọn qua ?slide=<id> trên trang khách; giá trị lạ → về "scrapbook".

/** Kiểu slide ảnh của intro. */
export type SlideStyleId = "scrapbook" | "romantic-brochure";

export interface SlideStyle {
  id: SlideStyleId;
  /** Tên hiển thị tiếng Việt. */
  label: string;
  /** Mô tả ngắn. */
  description: string;
}

export const SLIDE_STYLES: Record<SlideStyleId, SlideStyle> = {
  scrapbook: {
    id: "scrapbook",
    label: "Scrapbook Polaroid",
    description:
      "Ảnh viền trắng đặt nghiêng như Polaroid dán trên nền, chữ chạy trên ảnh — kiểu mặc định.",
  },
  "romantic-brochure": {
    id: "romantic-brochure",
    label: "Brochure lãng mạn",
    description:
      "Trang brochure: ảnh tràn một bên, panel kem một bên với trái tim nhỏ + thẻ chữ viền vàng; ảnh cắt trái tim.",
  },
};

export function isSlideStyleId(v: string | null | undefined): v is SlideStyleId {
  return v === "scrapbook" || v === "romantic-brochure";
}

export function resolveSlideStyle(v: string | null | undefined): SlideStyleId {
  return isSlideStyleId(v) ? v : "scrapbook";
}
