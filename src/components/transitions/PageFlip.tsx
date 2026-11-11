// "LẬT TRANG" — chuyển trang của Nhật Ký Truyện Tranh, mẫu Pikbest
// 10082742. Đã đối chiếu khung f_03 lúc đổi trang ~6,0s — trang cũ
// PEEL/BONG theo đường chéo từ góc trên-trái, lộ trang mới bên dưới;
// tim outline + chữ "love" nằm giữa lúc lật: trang cũ xoay 3D quanh
// mép trái (rotateY 0 → −170°, perspective 1100, nghiêng chéo −6°
// như đường peel trong video), bóng nếp gấp tối dần ở mép lật, mặt
// sau mờ dần khi lật quá 90° (backface-visibility hidden); trang mới
// nằm SẴN BÊN DƯỚI, đứng yên, lộ dần ra — không trượt vào từ bên
// cạnh. Tổng 0,9s, easeInOut (chậm ở đầu/cuối như lật giấy thật).
// Panel của trang mới stagger vào lúc lật xong (trang mới trong f_05
// đã đầy đủ panel ngay khi lật xong) — phần stagger đó thuộc nội dung
// trang, slideshow tự lo, không nằm trong component này.
//
// Dùng lại: bọc nội dung từng trang — trang cũ lật đi, trang mới lộ
// ra bên dưới. Đặt trong div bọc có position relative (trang absolute
// inset-0, cuộn dọc bên trong khi nội dung cao hơn màn hình).
//   <PageFlip pageKey={index} isFinale={đangỞMànKết}
//     hasFlipped={đãLậtLầnNào} reduce={reduce}>
//     {nội dung trang}
//   </PageFlip>
// - pageKey: đổi mỗi khi sang trang mới.
// - isFinale: tim quét đổi sang màu trắng khi sang màn kết đỏ.
// - hasFlipped: bóng trên trang mới lộ ra chỉ chạy từ lần lật đầu
//   tiên (tránh nháy tối lúc mới mở).
// Giảm chuyển động: đổi trang tức thì, không lật, không bóng, không
// tim quét.

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HEART_PATH, PAGE_FLIP } from "@/lib/transitions";

/** Trái tim vẽ tay QUÉT NGANG giữa lúc lật trang — như khung f_03
 *  lúc đổi cảnh (t≈6,0s): tim outline lớn + chữ "love" nằm giữa lúc
 *  trang cũ đang peel/bong đi, làm màn chắn. Chạy đúng 0,9s lật trang:
 *  từ trái sang phải, vừa xoay nhẹ vừa phóng to, mờ dần ở cuối. Chỉ
 *  trang trí — không chặn bấm. */
function HeartSweep({ tone = "red" }: { tone?: "red" | "white" }) {
  const stroke = tone === "white" ? "rgba(255,255,255,0.9)" : "#e63946";
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.9, 0.9, 0],
        x: ["-32%", "0%", "12%", "38%"],
        rotate: [-8, -2, 2, 8],
        scale: [0.7, 1, 1.15, 1.3],
      }}
      transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1], ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 100" className="h-[62vmin] w-[62vmin]">
        <path d={HEART_PATH} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />
        <path
          d="M28 30 C24 34 22 40 24 46"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      <span className="absolute font-display text-3xl italic" style={{ color: stroke }}>
        love
      </span>
    </motion.div>
  );
}

export function PageFlip({
  pageKey,
  isFinale,
  hasFlipped,
  reduce,
  children,
}: {
  /** Đổi mỗi khi sang trang mới. */
  pageKey: string | number;
  /** Đang ở màn kết (tim quét đổi sang trắng). */
  isFinale?: boolean;
  /** Đã lật trang lần nào chưa (bóng trang mới chỉ từ lần lật đầu). */
  hasFlipped?: boolean;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const { durationS, perspective, rotateY, tilt } = PAGE_FLIP;
  return (
    <>
      {!reduce && <HeartSweep key={`sweep-${pageKey}`} tone={isFinale ? "white" : "red"} />}
      <AnimatePresence>
        <motion.div
          key={pageKey}
          data-testid="comic-page"
          className="absolute inset-0 overflow-y-auto"
          style={{
            transformPerspective: perspective,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
          }}
          initial={reduce ? false : { opacity: 1, x: 0, rotate: 0, rotateY: 0 }}
          animate={{ opacity: 1, x: 0, rotate: 0, rotateY: 0 }}
          exit={
            reduce
              ? undefined
              : {
                  rotateY,
                  rotate: tilt,
                  opacity: [1, 1, 0],
                  zIndex: 20,
                  transition: { duration: durationS, times: [0, 0.55, 0.85], ease: "easeInOut" },
                }
          }
          transition={{ duration: durationS, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Bóng nếp gấp trên trang đang lật — tối dần ở mép lật
              giữa lúc lật rồi tan khi trang khuất hẳn. Chỉ chạy lúc
              trang này thoát (exit của con chạy cùng exit của cha). */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                "linear-gradient(to left, rgba(40,10,10,0.45), rgba(40,10,10,0) 45%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{
              opacity: [0, 0.85, 0.1],
              transition: { duration: durationS, times: [0, 0.5, 1], ease: "easeInOut" },
            }}
          />
          {/* Bóng trên trang mới lộ ra — tối ở mép trái rồi sáng dần
              khi lật xong. Chỉ từ lần lật đầu tiên (tránh nháy tối
              lúc mới mở); giảm chuyển động thì không bóng. */}
          {hasFlipped && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0) 35%)",
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: durationS, ease: "easeOut" }}
            />
          )}
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
