"use client";

import type { TemplateEffects } from "@/lib/templates";
import { BokehGlow } from "./BokehGlow";
import { GoldSparkles } from "./GoldSparkles";
import { PetalFall } from "./PetalFall";
import { Twinkle } from "./Twinkle";

// Lớp ambient của trang khách — gom toàn bộ hiệu ứng nền (tia vàng, cánh
// hoa, bokeh, sao 4 cánh) theo effects của biến thể (§4i) vào MỘT chỗ, để
// InvitationPreview chỉ cần gọi một dòng.
//
// CẮM VÀO SAU (khi task khối thêm/bớt xong, khỏi đụng file): trong
// InvitationPreview, thay khối ambient cuối article (GoldSparkles +
// PetalFall cố định) bằng:
//   {motion && <AmbientLayer fx={fx} templateId={data.templateId} />}
// Khối cũ render cả tia vàng + cánh hoa mỗi khi fx.ambient có mặt —
// preset nào cũng giống nhau ở lớp ambient. AmbientLayer đọc kind:
// "sparkle" = chỉ tia vàng 4 cánh, "petals" = chỉ cánh hoa rơi (số cánh
// theo ambient.petals), "both" = cả hai (y hệt khối cũ), "bokeh" = hào
// quang mờ; twinkle thêm sao 4 cánh khắp trang khi preset có twinkle.
// Riêng 4 sao quanh tên hero của mẫu deco luôn có, không theo mục này.
// Không chặn chạm/đọc; mọi lớp con tự tắt khi prefers-reduced-motion.
export function AmbientLayer({
  fx,
  templateId,
}: {
  fx: TemplateEffects;
  templateId: string;
}) {
  const kind = fx.ambient?.kind ?? "both";
  return (
    <>
      {fx.ambient && (
        <>
          {kind !== "petals" && kind !== "bokeh" && (
            <GoldSparkles count={fx.ambient.count ?? 16} speed={fx.ambient.speed ?? 1} seed={templateId} className="pointer-events-none absolute inset-0 z-30" />
          )}
          {kind !== "sparkle" && kind !== "bokeh" && (
            <PetalFall count={fx.ambient.petals ?? 6} colors={fx.ambient.petalColors} seed={templateId} className="z-30" />
          )}
          {kind === "bokeh" && (
            <BokehGlow count={fx.ambient.count ?? 10} seed={templateId} className="z-30" />
          )}
        </>
      )}
      {fx.twinkle && (
        <Twinkle count={fx.twinkle.count ?? 10} seed={templateId} className="z-30" />
      )}
    </>
  );
}
