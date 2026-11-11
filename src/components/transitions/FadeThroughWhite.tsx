// "MỜ QUA TRẮNG" (fade-through-white) — chuyển cảnh của Tỏ Tình Ấm
// Áp, mẫu Pikbest 10077037. Đo trực tiếp từ preview.mp4 (độ sáng trung
// bình khung): cảnh cũ còn nguyên màu tới ~12,7s (mean 148) → mờ dần
// về trắng, chạm trắng gần như tuyệt đối ở ~13,0s (mean 253, 97% điểm
// ảnh >240) → cảnh mới hiện dần từ trắng, tới ~13,3s đã rõ (mean
// ~206). Pha mờ về trắng TĂNG TỐC (easeIn), pha hiện từ trắng GIẢM
// TỐC (easeOut). Tổng chuyển ~0,8s — nhanh, dứt khoát, trắng hẳn ở
// giữa (không phải crossfade mờ đục 2 ảnh chồng nhau).
//
// Dùng lại: bọc cảnh của slideshow nào cũng được — cảnh cũ mờ hết về
// trắng rồi cảnh mới mới hiện từ trắng (AnimatePresence mode="wait"),
// lớp trắng phủ toàn khung trong lúc chuyển nên cả cú nhảy chiều cao
// hay bố cục cũng được giấu trong pha trắng. Giảm chuyển động: đổi
// cảnh tức thì (duration 0), không lớp trắng.
//   <FadeThroughWhiteScene sceneKey={index} reduce={reduce}
//     active={everAdvanced} wrapperClassName="..." sceneClassName="...">
//     {nội dung cảnh}
//   </FadeThroughWhiteScene>
// - sceneKey: đổi mỗi khi sang cảnh mới (key của cảnh + của lớp trắng).
// - active: chỉ chạy lớp trắng từ lần đổi cảnh đầu tiên trở đi (lần mở
//   đầu không có chớp trắng — tránh màn hình nháy trắng khi vừa vào).
// - wrapperClassName: class của div bọc cảnh (giữ nguyên class cũ của
//   slideshow); sceneClassName: class của khung cảnh bên trong.
// Lớp trắng phủ toàn khung slideshow nên component phải đặt TRỰC TIẾP
// dưới div gốc của slideshow (đừng bọc thêm div relative ở giữa).

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FADE_THROUGH_WHITE } from "@/lib/transitions";

export function FadeThroughWhiteScene({
  sceneKey,
  reduce,
  active,
  wrapperClassName,
  sceneClassName,
  children,
}: {
  sceneKey: string | number;
  reduce: boolean;
  /** Chỉ chạy lớp trắng từ lần đổi cảnh đầu tiên trở đi. */
  active: boolean;
  wrapperClassName?: string;
  sceneClassName?: string;
  children: React.ReactNode;
}) {
  const { outS, holdS, inS, totalS } = FADE_THROUGH_WHITE;
  return (
    <>
      <div className={wrapperClassName}>
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneKey}
            className={sceneClassName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: reduce ? 0 : outS, ease: "easeIn" },
            }}
            transition={{
              duration: reduce ? 0 : inS,
              delay: reduce ? 0 : holdS,
              ease: "easeOut",
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lớp trắng phủ toàn khung khi đổi cảnh — pha trắng của hiệu ứng
          mờ qua trắng (đúng mẫu: trắng gần như tuyệt đối ở giữa, 97%
          điểm ảnh >240 ở khung đỉnh): dâng 0→1 trong pha mờ về trắng,
          giữ 1 một nhịp ngắn, hạ 1→0 trong pha hiện từ trắng. Keyframes
          chạy lại mỗi lần đổi cảnh (key theo sceneKey); không chạy ở
          lần mở đầu (active) và không chạy khi giảm chuyển động. */}
      {active && !reduce && (
        <motion.div
          key={`veil-${sceneKey}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[15] bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: totalS,
            times: [0, outS / totalS, (outS + holdS) / totalS, 1],
            ease: ["easeIn", "linear", "easeOut"],
          }}
        />
      )}
    </>
  );
}
