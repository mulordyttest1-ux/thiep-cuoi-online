"use client";

import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Đồng bộ Lenis ↔ ScrollTrigger (giai đoạn B): ScrollTrigger đọc vị trí
// cuộn từ Lenis (lenis.on("scroll", ScrollTrigger.update)) và Lenis được
// dẫn bằng GSAP ticker (autoRaf: false) để scrub/pin chạy đúng nhịp với
// cuộn mượt — kiểu tích hợp chuẩn của Lenis + GSAP. Refresh lại khi trang
// tải xong (ảnh/font làm đổi chiều cao) để trigger không lệch.
// Khi giảm chuyển động thì không dùng Lenis (trả children thường) —
// ScrollTrigger vẫn chạy trên cuộn gốc của trình duyệt.
function ScrollTriggerSync() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    if (document.fonts) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined);
    }
    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      window.removeEventListener("load", onLoad);
    };
  }, [lenis]);
  return null;
}

// Cuộn mượt Lenis — bọc cuộn gốc của trình duyệt nên thanh cuộn, phím,
// sticky đều hoạt động như thường, chỉ thêm độ trượt nhẹ như video
// (lerp càng nhỏ càng trượt). Chỉ dùng ở trang khách (/thiep/*), không
// dùng ở editor/thumbnail. Tôn trọng prefers-reduced-motion: tắt mượt.
export function SmoothScroll({
  children,
  lerp = 0.09,
  enabled = true,
}: {
  children: ReactNode;
  lerp?: number;
  enabled?: boolean;
}) {
  const reduce = useReducedMotion();
  if (!enabled || reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp, smoothWheel: true, autoRaf: false }}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
