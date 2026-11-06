"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Chuyển cảnh kiểu video, 2 lớp lồng nhau (đo độ rõ 2026-11-06):
// - Lớp TRONG: entrance theo THỜI GIAN (whileInView) — mờ dần + trồi lên
//   + nét dần trong 0.7s mỗi lần section vào khung, bất kể tốc độ cuộn.
//   Trước đây chỉ có lớp cuộn nên cuộn nhanh là section hiện tức thì
//   (0→1 trong <100ms) — mắt không thấy fade nào ("chỉ scroll không có
//   fade"). Entrance chạy lại mỗi lần vào khung (once: false).
// - Lớp NGOÀI: mờ đi một phần theo VỊ TRÍ cuộn khi section đi ra (không mờ
//   hẳn để vẫn đọc được khi cuộn ngược). Ngưỡng thoát "end 0" để section
//   cuối trang không bị mờ khi cuộn tới đáy.
const ENTRANCE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type RevealStrength = "subtle" | "standard";

const EXIT: Record<RevealStrength, { opacity: number[]; scale: number[]; blur: string[] }> = {
  standard: { opacity: [1, 1, 1, 0.55], scale: [1, 1, 1, 0.99], blur: ["blur(0px)", "blur(0px)", "blur(0px)", "blur(1.5px)"] },
  subtle: { opacity: [1, 1, 1, 0.75], scale: [1, 1, 1, 0.995], blur: ["blur(0px)", "blur(0px)", "blur(0px)", "blur(1px)"] },
};

export function ScrollReveal({
  children,
  className,
  style,
  strength = "standard",
  wipe = false,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: RevealStrength;
  // wipe (giai đoạn C10): entrance thêm mặt nạ clip-path cắt từ dưới lên
  // (inset 99% → 0) cùng lúc với mờ + trồi + nét — mục hiện ra như được
  // kéo màn. Mặc định tắt (giữ entrance giai đoạn A đã đo).
  // QUAN TRỌNG (bug đã gặp 2026-11-06): KHÔNG dùng inset(100%) — clip che
  // kín khiến IntersectionObserver tính ratio = 0, whileInView không bao
  // giờ kích hoạt, mục biến mất vĩnh viễn (đã đo thực tế). 99% (hở 1%)
  // + amount 0 (ngưỡng 0) thì wipe chạy bình thường. Mục không wipe giữ
  // amount 0.3 như giai đoạn A (opacity không ảnh hưởng IO nên không sao).
  wipe?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.45", "end 0.35", "end 0"],
  });
  const m = EXIT[strength];
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.opacity);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.scale);
  const filter = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], m.blur);
  if (disabled || reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ ...style, opacity, scale, filter }}>
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(6px)", ...(wipe ? { clipPath: "inset(99% 0% 0% 0%)" } : {}) }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", ...(wipe ? { clipPath: "inset(0% 0% 0% 0%)" } : {}) }}
        viewport={{ amount: wipe ? 0 : 0.3, once: false }}
        transition={{ duration: 0.7, ease: ENTRANCE_EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
