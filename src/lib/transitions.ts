// Thư viện HIỆU ỨNG CHUYỂN CẢNH — mỗi chuyển cảnh là một món riêng
// đặt tên, dùng lại được cho mọi kiểu slide (chị chủ chốt 2026-11-11:
// "phần chuyển cảnh này là thư viện luôn để mai mốt chỉ bốc ra xài
// lại", nối tiếp quy tắc thư viện: lưu hết, gọi được theo tên, bốc
// random cho mẫu mới).
//
// Món nào đã tách thành component dùng lại được thì nằm trong
// src/components/transitions/ (extracted: true); món nào còn gắn chặt
// bố cục của slideshow gốc thì chỉ ghi vào registry với ghi chú
// "chưa tách" (extracted: false) — vẫn xem/chọn được trên /thu-vien,
// tách sau khi nào cần dùng lại.
// Tên chốt của chị: "Tung Hoa Xé Mở", "Hoa Tụ Về Tim", "Mờ Qua Trắng",
// "Lật Trang"; các món còn lại đặt tên tiếng Việt ngắn gọn, rõ nghĩa.

import type { SlideStyleId } from "./slide-styles";

/** Id của một hiệu ứng chuyển cảnh trong thư viện. */
export type TransitionId =
  | "tung-hoa-xe-mo"
  | "hoa-tu-ve-tim"
  | "mo-qua-trang"
  | "lat-trang"
  | "man-ket-do"
  | "mo-dan"
  | "truot-xep-chong";

export interface SlideTransition {
  id: TransitionId;
  /** Tên hiển thị tiếng Việt (gọi theo tên). */
  name: string;
  /** Mô tả ngắn — thấy gì lúc chuyển. */
  description: string;
  /** Tổng thời gian chuyển (ms). */
  durationMs: number;
  /** Mẫu video gốc (nếu có). */
  source?: string;
  /** Kiểu slide nào đang dùng chuyển này. */
  slideStyle: SlideStyleId;
  /** Link demo đầy đủ của chuyển này (6 ảnh để thấy hết các hướng). */
  demoHref: string;
  /** Đã tách thành component dùng lại được trong
   *  src/components/transitions/ chưa. */
  extracted: boolean;
  /** Tên component dùng lại (khi extracted = true). */
  component?: string;
  /** Ghi chú — vd lý do chưa tách. */
  note?: string;
}

export const TRANSITIONS: Record<TransitionId, SlideTransition> = {
  "tung-hoa-xe-mo": {
    id: "tung-hoa-xe-mo",
    name: "Tung Hoa Xé Mở",
    description:
      "Tim pha lê vỡ ra: dải mảnh chéo quét từ góc trên-trái, mép xé sáng chạy theo, hoa tung bùng ra mọi hướng, tấm pha lê lớn kéo giãn rồi tan — ảnh mới nở ra từ trong tim.",
    durationMs: 1000,
    source: "Pikbest 237637 (Trái Tim Đào)",
    slideStyle: "peach-heart",
    demoHref: "/thiep/demo?slide=peach-heart&photos=6",
    extracted: true,
    component: "ShatterAssembleOverlay",
  },
  "hoa-tu-ve-tim": {
    id: "hoa-tu-ve-tim",
    name: "Hoa Tụ Về Tim",
    description:
      "Ngược lại lúc vỡ: cánh hoa tụ về thành dòng, dải mảnh bay vào ráp lại quanh tim, tấm pha lê hiện ra xếp thành tim, ảnh mới hiện dần trong tim trên nền mờ tiêu cự.",
    durationMs: 1200,
    source: "Pikbest 237637 (Trái Tim Đào)",
    slideStyle: "peach-heart",
    demoHref: "/thiep/demo?slide=peach-heart&photos=6",
    extracted: true,
    component: "ShatterAssembleOverlay",
  },
  "mo-qua-trang": {
    id: "mo-qua-trang",
    name: "Mờ Qua Trắng",
    description:
      "Cảnh cũ mờ dần về trắng hẳn, giữ trắng một nhịp ngắn, cảnh mới hiện dần từ trắng — không phải crossfade hai ảnh chồng nhau.",
    durationMs: 800,
    source: "Pikbest 10077037 (Tỏ Tình Ấm Áp)",
    slideStyle: "warm-confession",
    demoHref: "/thiep/demo?slide=warm-confession&photos=6",
    extracted: true,
    component: "FadeThroughWhiteScene",
  },
  "lat-trang": {
    id: "lat-trang",
    name: "Lật Trang",
    description:
      "Trang cũ lật 3D quanh mép trái như lật trang sách/PDF, nghiêng chéo, bóng nếp gấp tối dần, tim “love” quét ngang giữa lúc lật; trang mới nằm sẵn bên dưới.",
    durationMs: 900,
    source: "Pikbest 10082742 (Nhật Ký Truyện Tranh)",
    slideStyle: "comic-diary",
    demoHref: "/thiep/demo?slide=comic-diary&photos=6",
    extracted: true,
    component: "PageFlip",
  },
  "man-ket-do": {
    id: "man-ket-do",
    name: "Màn Kết Đỏ",
    description:
      "Nền đỏ tràn vào từ trái, chữ thư pháp lớn lấp đầy bằng mảnh ảnh rồi chuyển trắng đặc.",
    durationMs: 900,
    source: "Pikbest 10082742 (Nhật Ký Truyện Tranh)",
    slideStyle: "comic-diary",
    demoHref: "/thiep/demo?slide=comic-diary&photos=6",
    extracted: true,
    component: "FinaleWipe",
  },
  "mo-dan": {
    id: "mo-dan",
    name: "Mờ Dần",
    description:
      "Ảnh cũ mờ dần, ảnh mới mờ dần vào — crossfade 0,9s, ảnh luôn rõ nét ở trạng thái nghỉ.",
    durationMs: 900,
    source: "Pikbest 10085011 (Brochure Lãng Mạn)",
    slideStyle: "romantic-brochure",
    demoHref: "/thiep/demo?slide=romantic-brochure&photos=6",
    extracted: false,
    note: "Chưa tách — gắn chặt bố cục chia đôi của brochure.",
  },
  "truot-xep-chong": {
    id: "truot-xep-chong",
    name: "Trượt Xếp Chồng",
    description:
      "Ảnh mới trượt/xoay từ dưới khung vào chồng Polaroid, ảnh cũ lùi xuống dưới — Polaroid luôn rõ nét, không mờ.",
    durationMs: 900,
    source: "Slideshow mặc định (Scrapbook Polaroid)",
    slideStyle: "scrapbook",
    demoHref: "/thiep/demo?photos=6",
    extracted: false,
    note: "Chưa tách — gắn chặt vị trí chồng Polaroid.",
  },
};

export const TRANSITION_IDS: TransitionId[] = [
  "tung-hoa-xe-mo",
  "hoa-tu-ve-tim",
  "mo-qua-trang",
  "lat-trang",
  "man-ket-do",
  "mo-dan",
  "truot-xep-chong",
];

export function isTransitionId(v: string | null | undefined): v is TransitionId {
  return (
    v === "tung-hoa-xe-mo" ||
    v === "hoa-tu-ve-tim" ||
    v === "mo-qua-trang" ||
    v === "lat-trang" ||
    v === "man-ket-do" ||
    v === "mo-dan" ||
    v === "truot-xep-chong"
  );
}

/** Đường trái tim (viewBox 0 0 100 100) — dùng chung cho các chuyển
 *  cảnh có hình tim (tung hoa, lật trang). */
export const HEART_PATH =
  "M50 88 C20 65 5 45 5 28 C5 14 16 5 28 5 C38 5 46 11 50 18 C54 11 62 5 72 5 C84 5 95 14 95 28 C95 45 80 65 50 88 Z";

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (dùng chung cho các component chuyển cảnh; copy từ ShatterText
 *  trong IntroSlideshow để scatter nhìn giống). */
export function transitionJitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Thời gian các pha của "Mờ Qua Trắng" (giây) — đo trực tiếp từ
 *  preview.mp4 mẫu 10077037 (xem FadeThroughWhite). */
export const FADE_THROUGH_WHITE = {
  outS: 0.35, // cảnh cũ mờ về trắng (easeIn — tăng tốc)
  holdS: 0.1, // giữ trắng một nhịp ngắn (đỉnh trắng)
  inS: 0.35, // cảnh mới hiện dần từ trắng (easeOut — giảm tốc)
  totalS: 0.8,
} as const;

/** Thời gian + góc của "Lật Trang" (xem PageFlip). */
export const PAGE_FLIP = {
  durationS: 0.9,
  perspective: 1100,
  rotateY: -170, // trang cũ lật quanh mép trái
  tilt: -6, // nghiêng chéo như đường peel trong video
} as const;
