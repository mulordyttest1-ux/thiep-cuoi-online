// Kiểu slide ảnh cho bước bộ sưu tập của intro (lớp nội dung).
//
// "scrapbook" (mặc định): slideshow Polaroid scrapbook — ảnh viền trắng
// đặt nghiêng như Polaroid dán trên nền, kịch bản đã duyệt 2026-11-10
// (mẫu Pikbest 10077037). "romantic-brochure": kiểu brochure lãng mạn —
// ảnh tràn một bên + panel kem một bên với trái tim nhỏ + thẻ chữ viền
// vàng; ảnh cắt trái tim; ảnh mờ sau chữ; đường chéo mảnh (mẫu Pikbest
// 10085011 "Romantic Confession Valentine's Day Wedding Brochure", làm
// 2026-11-10). "peach-heart": trái tim pha lê nhiều mặt cắt chứa ảnh
// cưới, nền low-poly sáng, cánh hoa trôi, chuyển cảnh tim vỡ thành mảnh
// rồi lắp lại (mẫu Pikbest 237637, làm 2026-11-11). "warm-confession":
// thẻ ghi chú tỏ tình viền đỏ đè lên góc ảnh, khung ảnh ngang rộng,
// collage 2–3 ảnh, chuyển cảnh mờ qua trắng trên nền kem ấm (mẫu Pikbest
// 10077037, làm 2026-11-11 — khác slideshow Polaroid dù cùng nguồn cảm
// hứng). "comic-diary": trang truyện tranh — panel viền dày nghiêng +
// ghi chú vàng + chấm halftone, màn kết đỏ (mẫu Pikbest 10082742, làm
// 2026-11-11; đẹp nhất khi thiệp có từ 3 ảnh trở lên).
// "flowers-brochure": Hoa Hồng Cuốn — 1 ảnh duy nhất viền trắng
// nghiêng nhẹ trên nền hồng phấn, thẻ tiêu đề đỏ luân phiên vị trí,
// ảnh đứng yên hoàn toàn; chuyển cảnh đám mây cánh hoa hồng lớn quét
// ngang che kín màn hình ("Hoa Cuốn Màn", mẫu Pikbest 1440022, làm
// 2026-11-11). Kiểu mới là kiểu RIÊNG trong thư viện, không thay
// mặc định.
// "peach-heart-full": Tim Đào Trọn Hình — cùng cấu trúc Trái Tim Đào
// (tim pha lê đặc, chữ trắng trên tim, vỡ dải mảnh đặc + lắp dải
// cong) nhưng tim nhỏ lại vừa trọn trong khung (rộng 92vw, cao ~28%
// viewport) thay vì khổng lồ tràn hai bên; chị chọn giữa 2 cỡ tim
// (2026-11-11).
// "layer-motion": Đa Lớp Bồng Bềnh — port LayerMotionSlideshow của
// Codrops (2026-11-11, chị chọn là đẹp nhất trong 12 mẫu slide cộng
// đồng, "đẹp như file .aep"): nền hồng phấn + ảnh viền trắng nghiêng
// nhẹ + thẻ tiêu đề đỏ như Hoa Hồng Cuốn, nhưng mỗi lớp (nền, bóng
// mờ ảnh, ảnh chính, thẻ tiêu đề, hoa trang trí) trôi lệch nhịp TỰ
// ĐỘNG theo sóng sin (lerp riêng từng lớp, không cần chuột); chuyển
// cảnh giữ "Hoa Cuốn Màn".
// Chọn qua ?slide=<id> trên trang khách; giá trị lạ → về "scrapbook".

/** Kiểu slide ảnh của intro. */
export type SlideStyleId =
  | "scrapbook"
  | "romantic-brochure"
  | "peach-heart"
  | "peach-heart-full"
  | "warm-confession"
  | "comic-diary"
  | "flowers-brochure"
  | "layer-motion";

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
  "peach-heart": {
    id: "peach-heart",
    label: "Trái Tim Đào",
    description:
      "Trái tim pha lê nhiều mặt cắt chứa ảnh cưới, nền low-poly sáng, cánh hoa trôi; chuyển cảnh tim vỡ thành mảnh rồi lắp lại.",
  },
  "peach-heart-full": {
    id: "peach-heart-full",
    label: "Tim Đào Trọn Hình",
    description:
      "Như Trái Tim Đào nhưng tim nhỏ lại vừa trọn trong khung (rộng 92vw, cao ~28% màn hình) để thấy trọn hình tim thay vì khổng lồ tràn hai bên; vẫn tim pha lê đặc, chữ trắng trên tim, vỡ dải mảnh đặc + lắp dải cong.",
  },
  "warm-confession": {
    id: "warm-confession",
    label: "Tỏ Tình Ấm Áp",
    description:
      "Thẻ ghi chú tỏ tình viền đỏ đè lên góc ảnh, khung ảnh ngang rộng, collage 2–3 ảnh, chuyển cảnh mờ qua trắng trên nền kem ấm.",
  },
  "comic-diary": {
    id: "comic-diary",
    label: "Nhật Ký Truyện Tranh",
    description:
      "Trang truyện tranh: panel viền dày nghiêng + ghi chú vàng + chấm halftone, màn kết đỏ; đẹp nhất khi thiệp có từ 3 ảnh trở lên.",
  },
  "flowers-brochure": {
    id: "flowers-brochure",
    label: "Hoa Hồng Cuốn",
    description:
      "1 ảnh duy nhất viền trắng nghiêng nhẹ trên nền hồng phấn, thẻ tiêu đề đỏ luân phiên vị trí, ảnh đứng yên; chuyển cảnh đám mây cánh hoa hồng lớn quét ngang che kín màn hình.",
  },
  "layer-motion": {
    id: "layer-motion",
    label: "Đa Lớp Bồng Bềnh",
    description:
      "Nền hồng phấn + ảnh viền trắng nghiêng nhẹ + thẻ tiêu đề đỏ như Hoa Hồng Cuốn, nhưng mỗi lớp (nền, bóng mờ ảnh, ảnh chính, thẻ tiêu đề, hoa trang trí) trôi lệch nhịp tự động — không cần chuột; chuyển cảnh đám mây cánh hoa hồng quét ngang.",
  },
};

export function isSlideStyleId(v: string | null | undefined): v is SlideStyleId {
  return (
    v === "scrapbook" ||
    v === "romantic-brochure" ||
    v === "peach-heart" ||
    v === "peach-heart-full" ||
    v === "warm-confession" ||
    v === "comic-diary" ||
    v === "flowers-brochure" ||
    v === "layer-motion"
  );
}

export function resolveSlideStyle(v: string | null | undefined): SlideStyleId {
  return isSlideStyleId(v) ? v : "scrapbook";
}
