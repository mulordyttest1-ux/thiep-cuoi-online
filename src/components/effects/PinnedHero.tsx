"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Màn hero ghim (giai đoạn B4): khi cuộn tới hero, hero GHIM lại một đoạn
// (desktop) rồi mới nhả — trong lúc ghim, chữ Hỷ nở to 1→1.15, tên trồi
// nhẹ lên, dải đỏ wipe dần bằng clip-path. Trên điện thoại KHÔNG ghim
// (ghim trên cảm ứng giật) mà chỉ scrub: cùng biên đạo nhưng chạy theo vị
// trí cuộn của hero, không giữ hero lại.
// Vì hero nằm trong article (container-type + overflow-hidden) và trong
// ScrollReveal (filter) nên KHÔNG dùng pinType "fixed" (fixed sẽ neo theo
// article chứ không neo theo viewport) mà dùng pinType "transform":
// ScrollTrigger đặt spacer relative + hero absolute trong spacer rồi dịch
// bằng transform — đã kiểm chứng trong mã ScrollTrigger (_swapPinIn đặt
// spacer position relative). Tất cả ScrollTrigger tạo trong gsap.context
// và kill khi unmount. Giảm chuyển động: không tạo ScrollTrigger nào,
// hero đứng yên.
// Mục tiêu là phần tử con có data-hero-xi (chữ Hỷ), data-hero-names (tên
// hero), data-hero-band (dải đỏ) — xem SongPhungDecor / InvitationPreview.
export function PinnedHero({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (disabled || reduce) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();
      // Desktop ≥768px: ghim hero + scrub biên đạo.
      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=60%",
            scrub: 0.5,
            pin: true,
            pinType: "transform",
            anticipatePin: 1,
          },
        });
        tl.to(q("[data-hero-xi]"), { scale: 1.15, rotate: 6, duration: 1, ease: "none" }, 0)
          .to(q("[data-hero-names]"), { yPercent: -6, opacity: 0.85, duration: 1, ease: "none" }, 0)
          .fromTo(
            q("[data-hero-band]"),
            { clipPath: "inset(0% 0% 0% 0%)" },
            { clipPath: "inset(0% 100% 0% 0%)", duration: 1, ease: "none" },
            0.5
          );
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });
      // Điện thoại <768px: không ghim, chỉ scrub theo vị trí cuộn của hero.
      mm.add("(max-width: 767px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
        tl.to(q("[data-hero-xi]"), { scale: 1.12, rotate: 4, duration: 1, ease: "none" }, 0)
          .fromTo(
            q("[data-hero-band]"),
            { clipPath: "inset(0% 0% 0% 0%)" },
            { clipPath: "inset(0% 100% 0% 0%)", duration: 1, ease: "none" },
            0.3
          );
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });
    }, el);
    return () => ctx.revert();
  }, [disabled, reduce]);

  return (
    <div ref={ref} className="relative">
      {children}
    </div>
  );
}
