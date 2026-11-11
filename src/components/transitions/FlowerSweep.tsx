// "HOA CUỐN MÀN" — chuyển cảnh của Hoa Hồng Cuốn, mẫu Pikbest 1440022
// "Romantic Beautiful Flowers Transition Wedding Love Photo Brochure
// Display". Đúng video gốc (xem kỹ khung 10fps ở
// research_notes/pikbest-1440022-flowers-transition/frames-dense/
// t1/t2/t3_contact.jpg):
// - Đám mây 25–40 cánh hoa hồng LỚN (đỏ hồng đậm #bd0032 / #c3002f)
//   quét NGANG toàn khung như một bức màn chắn — KHÔNG phải hoa rơi
//   trang trí, KHÔNG phải nổ tung từ tâm như peach-heart.
// - 4 pha (~1,3s): quét vào (~0,3s, vài cánh lớn mờ nhòe bay vào
//   trước, đám mây dày dần) → phủ kín (~0,6s, che 70–90% khung, ẢNH
//   MỚI ĐỔI NGAY LÚC NÀY — parent đổi ảnh ở mốc FLOWER_SWEEP.swapAtMs
//   = 620ms, giấu sau đám hoa, không bao giờ thấy 2 ảnh chồng nhau)
//   → tan ra (~0,5s, cánh bay tiếp sang phía đối diện + rơi xuống,
//   ảnh mới lộ dần) → ổn định (chỉ còn vài cánh lẻ rơi — đó là hoa
//   nền của slideshow, không phải lớp này).
// - Hướng quét XEN KẼ trái/phải theo từng lần chuyển (T1 từ phải, T2
//   từ trái, T3 từ phải — như cơn gió đổi chiều): direction = 1 là
//   đám mây vào từ phải, ra bên trái; -1 thì ngược lại.
// - Chiều sâu: vài cánh blur làm lớp xa, cánh nét làm lớp gần; cánh
//   vừa bay ngang vừa xoay nhẹ + rơi xuống, có cánh xoay 360°.
// - Dải mây tập trung dày ở giữa (phủ kín khung lúc đỉnh), thưa dần
//   về hai mép — như trong video.
//
// Dùng lại: phủ toàn slide, chạy 1 lần mỗi khi đổi ảnh — đặt trực
// tiếp dưới div gốc của slideshow (đừng bọc thêm div relative).
//   {sweep && <FlowerSweepOverlay key={sweep.key} sweepKey={sweep.key}
//     direction={sweep.dir} reduce={reduce} />}
// - sweepKey: tăng mỗi lần đổi ảnh (key để remount + chạy lại từ đầu);
//   sweepKey = 0 lúc mới mở → không chạy gì (không có mây lúc mở).
// - Đổi ảnh do parent lo (setTimeout ở mốc swapAtMs); overlay này chỉ
//   là lớp hoa bay. Tắt hẳn khi giảm chuyển động.

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FLOWER_SWEEP,
  transitionJitter as jitter,
} from "@/lib/transitions";

/** Màu cánh hoa lớn — đo bằng pixel từ video gốc. */
const PETAL_COLORS = ["#c3002f", "#bd0032", "#c22b4a", "#d81b4c", "#a8002a"];
/** Hình cánh hoa hồng — bầu dục nhọn một đầu (viewBox 0 0 100 100). */
const PETAL_PATH =
  "M50 4 C78 22 92 52 50 96 C8 52 22 22 50 4 Z";

type CloudPetal = {
  /** Vị trí ngang trong dải mây (% chiều rộng dải). */
  leftPct: number;
  /** Vị trí dọc (% chiều cao khung). */
  topPct: number;
  /** Cỡ cánh (vw — tỉ lệ theo chiều rộng khung, như video). */
  sizeVw: number;
  /** Góc xoay lúc bắt đầu (độ). */
  rotate: number;
  /** Xoay thêm trong lúc quét (độ, có cánh xoay 360°). */
  spin: number;
  /** Rơi thêm xuống trong lúc quét (vh). */
  fallVh: number;
  color: string;
  /** Lớp xa: mờ nhòe nhẹ. */
  blur: boolean;
};

/** Dải mây: 34 cánh, mật độ dày ở giữa dải (để lúc đỉnh che kín
 *  khung 70–90%), thưa dần về hai mép — giả ngẫu nhiên xác định từ
 *  số nguyên nên ổn định giữa các lần render. */
function buildCloud(): CloudPetal[] {
  const petals: CloudPetal[] = [];
  for (let i = 0; i < FLOWER_SWEEP.petalCount; i++) {
    // (u+v)/2 tập trung quanh 0,5 → cánh dày ở giữa dải, thưa ở mép.
    const u = Math.abs(jitter(i * 3 + 1, 1));
    const v = Math.abs(jitter(i * 7 + 5, 1));
    const centerBias = (u + v) / 2;
    petals.push({
      leftPct: 6 + centerBias * 88,
      topPct: 2 + Math.abs(jitter(i * 11 + 2, 47)),
      sizeVw: 12 + Math.abs(jitter(i * 5 + 3, 9)),
      rotate: jitter(i * 13 + 7, 170),
      spin: jitter(i * 17 + 11, 180),
      fallVh: 4 + Math.abs(jitter(i * 19 + 4, 12)),
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      blur: i % 5 === 0, // ~1/5 cánh là lớp xa, mờ nhòe
    });
  }
  return petals;
}

export function FlowerSweepOverlay({
  sweepKey,
  direction,
  reduce,
}: {
  /** Tăng mỗi lần đổi ảnh (key để remount + chạy lại từ đầu); 0 lúc
   *  mới mở → không chạy gì. */
  sweepKey: number;
  /** 1 = đám mây vào từ phải, ra bên trái; -1 = ngược lại. Xen kẽ
   *  theo từng lần chuyển như video gốc. */
  direction: 1 | -1;
  reduce: boolean;
}) {
  const petals = useMemo(buildCloud, []);
  if (reduce || sweepKey === 0) return null;
  // Dải mây rộng 150vw: lúc ở giữa (x = -25vw) phủ -25..125vw, tức
  // che kín khung 0..100vw. Quét vào 0,3s → đỉnh 0,6s → tan ra 0,5s.
  const xKeyframes =
    direction === 1
      ? ["100vw", "-25vw", "-150vw"]
      : ["-150vw", "-25vw", "100vw"];
  return (
    <div
      aria-hidden="true"
      data-testid="flower-sweep"
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      <motion.div
        className="absolute top-0 h-full will-change-transform"
        style={{ width: "150vw", left: 0 }}
        initial={{ x: xKeyframes[0] }}
        animate={{ x: xKeyframes }}
        transition={{
          duration: FLOWER_SWEEP.durationS,
          times: [0, 0.46, 1],
          ease: "easeInOut",
        }}
      >
        {petals.map((p, i) => (
          <motion.span
            key={i}
            className="absolute block will-change-transform"
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              width: `${p.sizeVw}vw`,
              height: `${p.sizeVw * 1.1}vw`,
              filter: p.blur ? "blur(2px)" : undefined,
              opacity: p.blur ? 0.75 : 0.95,
            }}
            initial={{ y: 0, rotate: p.rotate }}
            animate={{ y: `${p.fallVh}vh`, rotate: p.rotate + p.spin }}
            transition={{ duration: FLOWER_SWEEP.durationS, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
              <path d={PETAL_PATH} fill={p.color} />
            </svg>
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
