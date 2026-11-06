"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

// Thanh tiến trình mỏng trên cùng trang thiệp — khách biết mình đang ở đoạn
// nào của thiệp (như thanh chạy của video). Giai đoạn C11: kèm số chương
// "01/06" (góc phải, hiện khi trang khách truyền chapter) để khách biết
// đang ở chương nào trong 6 chương (hero, lễ, album, tiệc, dress code,
// lịch trình). Giảm chuyển động: ẩn hẳn (cả thanh lẫn số chương).
export function ScrollProgress({
  color = "#710001",
  height = 4,
  disabled = false,
  chapter = null,
}: {
  color?: string;
  height?: number;
  disabled?: boolean;
  chapter?: { current: number; total: number } | null;
}) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  if (disabled || reduce) return null;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 right-0 top-0 z-50 origin-left"
        style={{ scaleX, height, background: color }}
      />
      {chapter && chapter.total > 0 && chapter.current > 0 && (
        <div
          aria-hidden="true"
          className="fixed right-3 top-3 z-50 rounded-full border px-3 py-1 font-display text-xs tracking-[0.2em]"
          style={{ background: "#f9ede3cc", borderColor: "#c9a86a55", color: "#710001" }}
        >
          {String(chapter.current).padStart(2, "0")} / {String(chapter.total).padStart(2, "0")}
        </div>
      )}
    </>
  );
}
