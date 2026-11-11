// "TUNG HOA XÉ MỞ" + "HOA TỤ VỀ TIM" — chuyển cảnh VỠ / LẮP GHÉP của
// Trái Tim Đào, mẫu Pikbest 237637. Đúng video gốc (xem kỹ từng khung
// ở research_notes/pikbest-237637-peach-heart/frames-shatter/ và
// frames-assemble/, đã đối chiếu khung s_021/s_026/s_031):
// - VỠ (tim → ảnh tràn, ~2,0s): dải mảnh TỐI ĐẶC (~135 mảnh 2–4px,
//   median ~6px ở 1280 ≈ 2px ở 390) chạy CHÉO từ mép trái ~35% cao
//   xuống giữa khung ~55% — vết xé CHÍNH LÀ dải mảnh tối, KHÔNG có
//   mép xé sáng trắng; 6 tấm pha lê KHỔNG LỒ (155–200px, 30–50%
//   khung) bong ra + mở bung; hoa tung nhỏ (8–18px); ảnh mới lộ ra
//   TỪ TRONG TIM (cửa sổ hình tim) rồi nở ra tràn khung.
// - LẮP GHÉP (ảnh tràn → tim, ~2,5s): ngược lại — HOA TỤ thành MỘT
//   dải cong duy nhất từ góc dưới-trái về tâm tim (28 cánh dọc đường
//   cong Bézier); tim chưa hiện tới ~1,5–2s; tấm lớn bay vào từ xa
//   xếp thành tim rồi tan; nền ảnh mờ (tiêu cự).
//
// Dùng lại: phủ toàn slide, chạy 1 lần mỗi khi đổi ảnh — đặt trực
// tiếp dưới div gốc của slideshow (đừng bọc thêm div relative).
//   <ShatterAssembleOverlay key={burstKey} burstKey={burstKey}
//     assemble={sangBốCụcTim} reduce={reduce} heartVariant="giant" />
// - burstKey: tăng mỗi lần đổi ảnh (key để remount + chạy lại từ đầu);
//   burstKey = 0 lúc mới mở → không chạy gì (tim còn nguyên như mẫu).
// - assemble: true = LẮP GHÉP (sang tim), false = VỠ (sang ảnh tràn).
// - heartVariant: "giant" (mặc định) = tim khổng lồ cao 96dvh tràn
//   hai bên, tâm tim (50%, 46%); "full" = tim trọn hình rộng 92vw,
//   cao ~28% viewport, tâm tim (50%, 50%). Dải mảnh / tấm pha lê /
//   hoa tung-tụ đều bám theo hộp tim của từng biến thể (tọa độ %
//   tính cho khung điện thoại 390×844 — khổ màn hình khác lệch nhẹ
//   vẫn đọc được vì các phần tử đều mờ dần về 0).
// Mọi phần tử kết thúc ở opacity 0 nên lớp phủ có ở lại cũng vô hình.
// Tắt hẳn khi giảm chuyển động.
//
// Registry src/lib/transitions.ts đã cập nhật đúng thực tế:
// tung-hoa-xe-mo 2000ms / hoa-tu-ve-tim 2500ms (2026-11-11).

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HEART_PATH, transitionJitter as jitter } from "@/lib/transitions";

/** 6 TẤM LỚN (mặt cắt pha lê) — KHỔNG LỒ 155–200px mỗi tấm (video:
 *  tấm pha lê 30–50% khung), vị trí quanh tâm tim (offset px từ
 *  tâm): 2 trên, 2 giữa, 2 dưới. VỠ: bong ra ×2,4 + mở bung (scale
 *  1,5 + kéo giãn ngang) + mờ dần. LẮP: bay vào từ ×2,4 xếp thành
 *  tim rồi tan vào tim thật.
 *  Biến thể "full": tim nhỏ hơn ~3,4 lần nên tấm thu theo ×0,3
 *  (47–60px, offset ±21–48px) — vẫn đọc là mặt cắt pha lê quanh
 *  tim nhỏ, không nuốt mất tim. */
const PLATES_GIANT: { x: number; y: number; size: number; rotate: number }[] = [
  { x: -110, y: -70, size: 175, rotate: -18 },
  { x: 110, y: -70, size: 165, rotate: 14 },
  { x: -160, y: 5, size: 190, rotate: 24 },
  { x: 160, y: 5, size: 200, rotate: -12 },
  { x: -70, y: 95, size: 155, rotate: 30 },
  { x: 70, y: 95, size: 170, rotate: -28 },
];
const PLATES_FULL: { x: number; y: number; size: number; rotate: number }[] = [
  { x: -33, y: -21, size: 52, rotate: -18 },
  { x: 33, y: -21, size: 50, rotate: 14 },
  { x: -48, y: 2, size: 57, rotate: 24 },
  { x: 48, y: 2, size: 60, rotate: -12 },
  { x: -21, y: 29, size: 47, rotate: 30 },
  { x: 21, y: 29, size: 51, rotate: -28 },
];
/** Màu tấm lớn — trắng/hồng/tím ĐẬM HƠN để đọc được trên nền wash
 *  trắng; drop-shadow tạo viền. */
const PLATE_COLORS = [
  "rgba(255,255,255,0.92)",
  "rgba(246,198,232,0.9)",
  "rgba(182,120,216,0.75)",
  "rgba(255,255,255,0.85)",
  "rgba(232,143,208,0.88)",
  "rgba(214,143,216,0.8)",
];
/** Màu dải mảnh quét — video gốc: dải mảnh CHỦ YẾU là mảnh TỐI
 *  (xám đậm/tím đậm, ~130–180 chấm tối li ti), điểm hồng/trắng. */
const STREAM_COLORS = ["#3a3340", "#3a3340", "#2e2a33", "#4a3f52", "#3a3340", "#b678d8", "#a55fd0", "#e88fd0", "#f6c6e8", "#ffffff"];
/** Màu cánh hoa trôi (hồng đào, tím, trắng — như mẫu). */
const PETAL_COLORS = ["#f6c6e8", "#d9a0c8", "#ffffff", "#e8b4e0"];
/** Màu tim nhỏ bay (hồng/tím đậm hơn để đọc được trên nền sáng). */
const HEART_PETAL_COLORS = ["#e88fd0", "#c06fd0", "#f6a8dc", "#b678d8"];

export function ShatterAssembleOverlay({
  burstKey,
  assemble,
  reduce,
  heartVariant = "giant",
}: {
  /** Tăng mỗi lần đổi ảnh; 0 lúc mới mở = không chạy. */
  burstKey: number;
  /** true = LẮP GHÉP (sang tim), false = VỠ (sang ảnh tràn). */
  assemble: boolean;
  reduce: boolean;
  /** Cỡ tim để bám hộp tim: "giant" (mặc định) tâm (50%, 46%);
   *  "full" tâm (50%, 50%), mọi kích thước thu theo tim nhỏ. */
  heartVariant?: "giant" | "full";
}) {
  const isFull = heartVariant === "full";
  /** Tâm tim trong tọa độ % của khung (left/top %). */
  const centerX = 50;
  const centerY = isFull ? 50 : 46;
  /** Tấm lớn theo biến thể. */
  const PLATES = isFull ? PLATES_FULL : PLATES_GIANT;
  // DẢI MẢNH CHUYỂN CẢNH — ~135 mảnh TỐI NHỎ (2–4px ở 390px, median
  // ~6px ở 1280 ≈ 2px ở 390) thành dải ĐẶC theo đường CHÉO:
  // - giant: từ mép trái ~35% cao xuống giữa khung ~55% (khung
  //   s_021): left 2–62%, top = 30 + left*0,42 ± 5. Xác định theo
  //   burstKey nên mỗi lần chuyển dải mảnh khác nhau nhưng ổn định
  //   trong lần đó. VỠ: mảnh bay RA theo hướng quét; LẮP: mảnh bay
  //   VÀO, tụ về tâm tim.
  // - full: dải chéo BĂNG QUA hộp tim nhỏ (tim: left 4–96%, top
  //   ~36–64% ở 390×844): left 4–96%, top = 36 + left*0,26 ± 3,
  //   từ (~4%, ~37%) xuống (~96%, ~61%); lúc VỠ mảnh bay ra ngắn
  //   hơn theo tim nhỏ (45–96px thay vì 150–320px).
  const streamShards = useMemo(() => {
    if (burstKey === 0) return [];
    const isAsm = assemble;
    return Array.from({ length: 135 }, (_, i) => {
      const leftPct = isFull
        ? 4 + ((i * 37 + burstKey * 13) % 92)
        : 2 + ((i * 37 + burstKey * 13) % 60);
      // Dải CHÉO: top tăng theo left (giant dốc ~0,42; full dốc
      // ~0,26 để băng qua tim nhỏ), cộng rung để thành dải đặc.
      const topPct = isFull
        ? 36 + leftPct * 0.26 + jitter(i * 53 + burstKey * 7, 3)
        : 30 + leftPct * 0.42 + jitter(i * 53 + burstKey * 7, 5);
      return {
        leftPct,
        topPct,
        size: 2 + ((i * 29 + burstKey * 5) % 3),
        delay: (leftPct / 100) * 0.35,
        dx: isAsm
          ? (centerX - leftPct) * 2.5
          : isFull
            ? 45 + ((i * 41 + burstKey * 3) % 52)
            : 150 + ((i * 41 + burstKey * 3) % 170),
        dy: isAsm ? (centerY - topPct) * 2.5 : jitter(i * 7 + burstKey * 3, 26),
        rot: jitter(i * 11 + burstKey, 170),
        color: STREAM_COLORS[(i + burstKey) % STREAM_COLORS.length],
        petal: i % 3 === 0,
      };
    });
  }, [burstKey, assemble, isFull, centerX, centerY]);

  // HOA TUNG / TỤ — pha "tung hoa" của chuyển cảnh:
  // - VỠ (khung s_026): 14 cánh NHỎ (tim + giọt nước, 8–18px) BÙNG
  //   RA từ tâm tim ra mọi hướng, đúng khoảnh khắc tim bung. Biến
  //   thể "full": tim nhỏ nên cánh bay ngắn hơn (40–70px thay vì
  //   130–230px), cỡ cánh giữ nguyên để còn đọc được.
  // - LẮP (khung a_031): 28 cánh tụ thành MỘT dải cong duy nhất từ
  //   góc dưới-trái về tâm tim — dọc đường cong Bézier bậc 2 từ
  //   (4%, 82%) qua điểm kiểm soát (10%, 60%) về tâm (50%, 46%
  //   giant / 50% full); 4 tim lớn 14–20px, còn lại 6–11px; delay
  //   i*0,04 → tổng ~2,5s.
  const burstPetals = useMemo(() => {
    if (burstKey === 0) return [];
    if (assemble) {
      return Array.from({ length: 28 }, (_, i) => {
        const t = i / 27;
        const x0 = 4, y0 = 82, cx = 10, cy = 60, x1 = centerX, y1 = centerY;
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        const big = i % 7 === 0;
        return {
          leftPct: x,
          topPct: y,
          dx: 0,
          dy: 0,
          size: big ? 14 + ((i * 3 + burstKey) % 7) : 6 + ((i * 5 + burstKey) % 6),
          delay: i * 0.04,
          rot: jitter(i * 17 + burstKey, 180),
          heart: big,
          color: (big ? HEART_PETAL_COLORS : PETAL_COLORS)[i % 4],
        };
      });
    }
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + jitter(i * 7 + burstKey, 0.35);
      const dist = isFull
        ? 40 + Math.abs(jitter(i * 11 + burstKey * 3, 30))
        : 130 + Math.abs(jitter(i * 11 + burstKey * 3, 100));
      return {
        leftPct: centerX,
        topPct: centerY,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 8 + Math.abs(jitter(i * 13 + burstKey * 5, 11)),
        delay: i * 0.02,
        rot: jitter(i * 17 + burstKey, 180),
        heart: i % 2 === 0,
        color: (i % 2 === 0 ? HEART_PETAL_COLORS : PETAL_COLORS)[i % 4],
      };
    });
  }, [burstKey, assemble, isFull, centerX, centerY]);

  if (reduce || burstKey === 0) return null;

  const isAssemble = assemble;
  return (
    <div key={burstKey} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Wash trắng: tim sáng trắng dần rồi tan (VỠ, đỉnh 0,5, kéo
          dài 2,0s) / nền mờ nhẹ (LẮP, đỉnh 0,3). */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAssemble ? [0, 0.3, 0] : [0, 0.5, 0.12, 0] }}
        transition={{
          duration: isAssemble ? 0.8 : 2.0,
          times: isAssemble ? [0, 0.3, 1] : [0, 0.35, 0.65, 1],
          ease: "easeInOut",
        }}
      />
      {/* (Đã BỎ mép xé sáng trắng — video gốc không có; vết xé chính
          là dải mảnh tối ở trên.) */}
      {/* Tấm lớn (mặt cắt pha lê KHỔNG LỒ): VỠ = bong ra ×2,4 + mở
          bung (scale 1,5 + kéo giãn ngang scaleX 1,4, như bị kéo xé
          ra hai phía) + mờ dần, 2,0s; LẮP = bay vào từ ×2,4 xếp
          thành tim rồi tan vào tim thật, 2,2s delay 0,3s (xong
          ~2,5s, đúng lúc tim lao vào). */}
      {PLATES.map((p, i) => (
        <motion.span
          key={`plate-${i}`}
          className="absolute block"
          style={{
            left: `${centerX}%`,
            top: `${centerY}%`,
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: PLATE_COLORS[i % PLATE_COLORS.length],
            clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
            filter: "drop-shadow(0 0 6px rgba(165,95,208,0.35))",
          }}
          initial={
            isAssemble
              ? { x: p.x * 2.4, y: p.y * 2.4, opacity: 0, scale: 1.5, rotate: p.rotate + 18 }
              : { x: 0, y: 0, opacity: 0.7, scale: 1, scaleX: 1, rotate: p.rotate }
          }
          animate={
            isAssemble
              ? { x: 0, y: 0, opacity: [0, 0.7, 0.7, 0], scale: 1, rotate: p.rotate }
              : { x: p.x * 2.4, y: p.y * 2.4, opacity: [0.7, 0.7, 0], scale: 1.5, scaleX: 1.4, rotate: p.rotate + 22 }
          }
          transition={{
            duration: isAssemble ? 2.2 : 2.0,
            delay: isAssemble ? 0.3 : 0,
            times: isAssemble ? [0, 0.15, 0.75, 1] : [0, 0.5, 1],
            ease: isAssemble ? "easeOut" : "easeIn",
          }}
        />
      ))}
      {/* Dải mảnh tối ĐẶC quét CHÉO từ góc trên-trái xuống (vết xé).
          VỠ: hiện rồi mờ dần khi bay ra, 2,0s. LẮP: bay VÀO tụ về
          tâm tim rồi mờ dần lúc "đáp". */}
      {streamShards.map((s, i) => (
        <motion.span
          key={`shard-${i}`}
          className="absolute block"
          style={{
            left: `${s.leftPct}%`,
            top: `${s.topPct}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            clipPath: s.petal ? undefined : "polygon(50% 0, 100% 100%, 0 100%)",
            borderRadius: s.petal ? "60% 0 60% 0" : undefined,
          }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{ x: s.dx, y: s.dy, opacity: [0, 1, 1, 0], rotate: s.rot }}
          transition={{
            duration: isAssemble ? 1.0 : 2.0,
            delay: s.delay,
            times: isAssemble ? [0, 0.2, 0.7, 1] : [0, 0.15, 0.65, 1],
            ease: "easeOut",
          }}
        />
      ))}
      {/* HOA TUNG / TỤ — VỠ: cánh hoa nhỏ bùng ra từ tâm tim ra mọi
          hướng (khung s_026); LẮP: cánh bay dọc dải cong từ góc
          dưới-trái về tâm tim (khung a_031, dòng hoa chảy về), 1,4s
          mỗi cánh, delay i*0,04 → tổng ~2,5s. */}
      {burstPetals.map((b, i) => (
        <motion.span
          key={`burst-${i}`}
          className="absolute block"
          style={{
            left: `${b.leftPct}%`,
            top: `${b.topPct}%`,
            width: b.size,
            height: b.size,
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
          }}
          initial={
            isAssemble
              ? { left: `${b.leftPct}%`, top: `${b.topPct}%`, opacity: 0, rotate: b.rot, scale: 0.7 }
              : { x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.7 }
          }
          animate={
            isAssemble
              ? { left: `${centerX}%`, top: `${centerY}%`, opacity: [0, 1, 1, 0], rotate: 0, scale: 1 }
              : { x: b.dx, y: b.dy, opacity: [0, 1, 1, 0], rotate: b.rot, scale: 1 }
          }
          transition={{
            duration: isAssemble ? 1.4 : 1.1,
            delay: b.delay,
            times: [0, 0.15, 0.7, 1],
            ease: isAssemble ? "easeIn" : "easeOut",
          }}
        >
          {b.heart ? (
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
              <path d={HEART_PATH} fill={b.color} opacity="0.9" />
            </svg>
          ) : (
            <span className="block h-full w-full" style={{ background: b.color, borderRadius: "60% 0 60% 0" }} />
          )}
        </motion.span>
      ))}
    </div>
  );
}
