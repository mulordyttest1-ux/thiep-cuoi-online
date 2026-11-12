// Bản đồ kiểu slide → component render — MỘT NƠI DUY NHẤT để thêm
// kiểu slide mới (chị chốt 2026-11-12: thư viện thay đổi thì tự đồng
// bộ, không sửa tay từng chỗ nữa).
//
// Trước đây mỗi kiểu slide phải sửa ở 3 chỗ: registry mô tả
// (slide-styles.ts) + nhánh render trang khách (GuestInvitationView)
// + nhánh demo thư viện (SlideshowStage trong thu-vien) — thiếu một
// chỗ là lệch ngay (vd: "Tim Đào Trọn Hình" có thẻ trong thư viện
// nhưng SlideshowStage không có nhánh cho nó nên demo rơi về kiểu
// mặc định Scrapbook). Nay cả 2 chỗ render đều tra bản đồ này:
// thêm kiểu mới chỉ cần thêm 1 mục registry + 1 dòng ở đây là xong,
// trang khách và thư viện tự đồng bộ theo.
//
// Vì slide-styles.ts còn được trang máy chủ /thiep/[id] import (chỉ
// cần metadata) nên bản đồ component KHÔNG nằm ở đó — file này là
// client component, import component trực tiếp, không tạo vòng lặp
// import (không slideshow nào import ngược lại file này).
"use client";

import type { ComponentType } from "react";
import type { InvitationData } from "@/lib/types";
import type { TemplateEffects } from "@/lib/templates";
import type { TextEffectId } from "@/lib/intro";
import type { SlideStyleId } from "@/lib/slide-styles";
import { IntroSlideshow } from "@/components/IntroSlideshow";
import { RomanticBrochureSlideshow } from "@/components/RomanticBrochureSlideshow";
import { PeachHeartSlideshow } from "@/components/PeachHeartSlideshow";
import { WarmConfessionSlideshow } from "@/components/WarmConfessionSlideshow";
import { ComicDiarySlideshow } from "@/components/ComicDiarySlideshow";
import { FlowersBrochureSlideshow } from "@/components/FlowersBrochureSlideshow";
import { LayerMotionSlideshow } from "@/components/LayerMotionSlideshow";

/** Props chung mọi kiểu slideshow — mọi component trong bản đồ đều
 *  nhận đủ bộ này (xem nhánh render cũ trong GuestInvitationView:
 *  cả 8 nhánh truyền cùng một bộ props). */
export interface SlideshowProps {
  data: InvitationData;
  fx: TemplateEffects;
  blurred?: boolean;
  guestName?: string;
  onEnter: () => void;
  photos?: string[];
  textEffect?: TextEffectId;
}

/** Kiểu slide → component. Hai biến thể tim đào dùng chung
 *  PeachHeartSlideshow, khác nhau ở prop heartVariant ("giant" =
 *  tim khổng lồ tràn hai bên; "full" = tim trọn hình nhỏ hơn). */
export const SLIDE_STYLE_COMPONENTS: Record<
  SlideStyleId,
  ComponentType<SlideshowProps>
> = {
  scrapbook: IntroSlideshow,
  "romantic-brochure": RomanticBrochureSlideshow,
  "peach-heart": (props) => (
    <PeachHeartSlideshow {...props} heartVariant="giant" />
  ),
  "peach-heart-full": (props) => (
    <PeachHeartSlideshow {...props} heartVariant="full" />
  ),
  "warm-confession": WarmConfessionSlideshow,
  "comic-diary": ComicDiarySlideshow,
  "flowers-brochure": FlowersBrochureSlideshow,
  "layer-motion": LayerMotionSlideshow,
};

/** Tra component theo id kiểu slide; id lạ / không truyền → về
 *  slideshow Polaroid scrapbook mặc định (như nhánh else cũ). */
export function resolveSlideStyleComponent(
  id: SlideStyleId | null | undefined
): ComponentType<SlideshowProps> {
  return (id && SLIDE_STYLE_COMPONENTS[id]) ?? IntroSlideshow;
}
