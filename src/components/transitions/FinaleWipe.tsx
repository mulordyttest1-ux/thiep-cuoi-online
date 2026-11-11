// "MÀN KẾT ĐỎ" — chuyển sang màn kết của Nhật Ký Truyện Tranh, mẫu
// Pikbest 10082742 (t≈9,5–10,0s): nền đỏ TRÀN VÀO từ trái sau cú
// quét tim, không cắt cứng nền — wipe clip-path 0,9s, easeInOut.
// Nền đỏ vân giấy + chữ thư pháp của màn kết thuộc nội dung màn kết,
// slideshow tự lo; component này chỉ lo lớp nền đỏ quét vào.
//
// Dùng lại:
//   <FinaleWipe active={đangỞMànKết} reduce={reduce} />
// Giảm chuyển động: nền đỏ hiện ngay, không wipe.

"use client";

import { AnimatePresence, motion } from "framer-motion";

/** Đỏ nền màn kết (giấy đỏ). */
const FINALE_RED = "#b3122e";

export function FinaleWipe({ active, reduce }: { active: boolean; reduce: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="finale-red"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[6]"
          style={{
            backgroundColor: FINALE_RED,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.4px)",
            backgroundSize: "9px 9px",
          }}
          initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          exit={{ clipPath: "inset(0 0 0 100%)" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}
