// "TUNG HOA XÉ MỞ" + "HOA TỤ VỀ TIM" — chuyển cảnh VỠ / LẮP GHÉP của
// Trái Tim Đào, mẫu Pikbest 237637. Đúng video gốc (xem kỹ từng khung
// 10fps ở research_notes/pikbest-237637-peach-heart/frames-shatter/ và
// frames-assemble/, đã đối chiếu khung s_021/s_026/s_031):
// - VỠ (tim → ảnh tràn, 1,0s): vết XÉ CHÉO quét từ góc trên-trái
//   xuống (dải mảnh ĐẬM chạy CHÉO ~25°, không ngang); tim sáng trắng
//   dần rồi tan; HOA TUNG BÙNG RA (tim hồng/tím TO 20–60px + cánh nhỏ
//   bắn ra MỌI HƯỚNG khắp khung, đúng khoảnh khắc tim bung); 6 tấm
//   lớn bong ra + KÉO GIÃN ngang (như bị kéo xé ra hai phía); ảnh mới
//   lộ ra TỪ TRONG TIM rồi nở ra tràn khung.
// - LẮP GHÉP (ảnh tràn → tim, 1,2s): ngược lại — HOA TỤ VỀ: cánh hoa
//   chảy thành DÒNG cong từ rìa về giữa tim, dải mảnh quét chéo bay
//   VÀO tụ quanh tim; tấm lớn hiện ra xếp thành tim; ảnh mới hiện dần
//   TRONG tim; nền ảnh mờ (tiêu cự).
// Chuyển theo hướng đích (assemble = sang bố cục tim), không phải nổ
// tròn tỏa ra từ tâm.
//
// Dùng lại: phủ toàn slide, chạy 1 lần mỗi khi đổi ảnh — đặt trực
// tiếp dưới div gốc của slideshow (đừng bọc thêm div relative).
//   <ShatterAssembleOverlay key={burstKey} burstKey={burstKey}
//     assemble={sangBốCụcTim} reduce={reduce} />
// - burstKey: tăng mỗi lần đổi ảnh (key để remount + chạy lại từ đầu);
//   burstKey = 0 lúc mới mở → không chạy gì (tim còn nguyên như mẫu).
// - assemble: true = LẮP GHÉP (sang tim), false = VỠ (sang ảnh tràn).
// Mọi phần tử kết thúc ở opacity 0 nên lớp phủ có ở lại cũng vô hình.
// Tắt hẳn khi giảm chuyển động.

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HEART_PATH, transitionJitter as jitter } from "@/lib/transitions";

/** 6 TẤM LỚN (mặt cắt pha lê) — vị trí quanh tâm tim (offset px từ
 *  tâm), xếp thành hình tim: 2 trên, 2 giữa, 2 dưới. VỠ: bong ra +
 *  mờ dần. LẮP: mờ dần hiện ra xếp thành tim. */
const PLATES: { x: number; y: number; size: number; rotate: number }[] = [
  { x: -95, y: -75, size: 120, rotate: -18 },
  { x: 95, y: -75, size: 110, rotate: 14 },
  { x: -125, y: 5, size: 95, rotate: 24 },
  { x: 125, y: 5, size: 130, rotate: -12 },
  { x: -55, y: 105, size: 100, rotate: 30 },
  { x: 55, y: 105, size: 90, rotate: -28 },
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
/** Màu dải mảnh quét — video gốc: dải mảnh CHỦ YẾU là mảnh xám
 *  đậm/tím đậm, điểm hồng/trắng. */
const STREAM_COLORS = ["#3a3340", "#3a3340", "#b678d8", "#a55fd0", "#e88fd0", "#f6c6e8", "#ffffff"];
/** Màu cánh hoa trôi (hồng đào, tím, trắng — như mẫu). */
const PETAL_COLORS = ["#f6c6e8", "#d9a0c8", "#ffffff", "#e8b4e0"];
/** Màu tim nhỏ bay (hồng/tím đậm hơn để đọc được trên nền sáng). */
const HEART_PETAL_COLORS = ["#e88fd0", "#c06fd0", "#f6a8dc", "#b678d8"];

export function ShatterAssembleOverlay({
  burstKey,
  assemble,
  reduce,
}: {
  /** Tăng mỗi lần đổi ảnh; 0 lúc mới mở = không chạy. */
  burstKey: number;
  /** true = LẮP GHÉP (sang tim), false = VỠ (sang ảnh tràn). */
  assemble: boolean;
  reduce: boolean;
}) {
  // DẢI MẢNH CHUYỂN CẢNH — hàng chục mảnh NHỎ (3–12px) chạy thành
  // dải CHÉO, quét từ góc trên-trái xuống (mảnh trái chạy trước, tạo
  // mặt sóng lan dần như vết xé — khung s_021: dải mảnh đen dài từ
  // mép trái ~20% cao xuống giữa khung ~55%). Xác định theo burstKey
  // nên mỗi lần chuyển dải mảnh khác nhau nhưng ổn định trong lần đó.
  // VỠ: mảnh bay RA theo hướng quét; LẮP: mảnh bay VÀO, tụ về tâm tim.
  const streamShards = useMemo(() => {
    if (burstKey === 0) return [];
    const isAsm = assemble;
    return Array.from({ length: 48 }, (_, i) => {
      const leftPct = 2 + ((i * 37 + burstKey * 13) % 92);
      // Dải CHÉO: top tăng theo left, dốc ~0,42, cộng rung ±7 để
      // thành dải rộng ~15%.
      const topPct = 14 + leftPct * 0.42 + jitter(i * 53 + burstKey * 7, 7);
      return {
        leftPct,
        topPct,
        size: 4 + ((i * 29 + burstKey * 5) % 10),
        delay: (leftPct / 100) * 0.35,
        dx: isAsm ? (50 - leftPct) * 2.5 : 150 + ((i * 41 + burstKey * 3) % 170),
        dy: isAsm ? (46 - topPct) * 2.5 : jitter(i * 7 + burstKey * 3, 26),
        rot: jitter(i * 11 + burstKey, 170),
        color: STREAM_COLORS[(i + burstKey) % STREAM_COLORS.length],
        petal: i % 3 === 0,
      };
    });
  }, [burstKey, assemble]);

  // HOA TUNG / TỤ — pha "tung hoa" của chuyển cảnh (khung s_026 /
  // a_031): VỠ = 14 cánh (tim + giọt nước, 14–46px) BÙNG RA từ tâm
  // tim ra mọi hướng, đúng khoảnh khắc tim bung; LẮP = bay NGƯỢC vào,
  // tụ về tâm tim như dòng hoa chảy về. Một lần mỗi khi đổi ảnh.
  const burstPetals = useMemo(() => {
    if (burstKey === 0) return [];
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + jitter(i * 7 + burstKey, 0.35);
      const dist = 130 + Math.abs(jitter(i * 11 + burstKey * 3, 100));
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 14 + Math.abs(jitter(i * 13 + burstKey * 5, 16)),
        delay: i * 0.02,
        rot: jitter(i * 17 + burstKey, 180),
        heart: i % 2 === 0,
        color: (i % 2 === 0 ? HEART_PETAL_COLORS : PETAL_COLORS)[i % 4],
      };
    });
  }, [burstKey]);

  if (reduce || burstKey === 0) return null;

  const isAssemble = assemble;
  return (
    <div key={burstKey} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Wash trắng: tim sáng trắng dần rồi tan (VỠ) / nền mờ nhẹ (LẮP). */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: isAssemble ? [0, 0.3, 0] : [0, 0.5, 0.12, 0] }}
        transition={{
          duration: isAssemble ? 0.8 : 1.0,
          times: isAssemble ? [0, 0.3, 1] : [0, 0.35, 0.65, 1],
          ease: "easeInOut",
        }}
      />
      {/* Mép xé sáng — VỠ: dải sáng chéo quét từ trái sang phải theo
          đúng vết xé (nghiêng 24°, mép sáng dẫn đầu), tạo cảm giác
          tim bị XÉ MỞ ra hai phía chứ không chỉ vỡ vụn. Chỉ lúc vỡ. */}
      {!isAssemble && (
        <motion.div
          className="absolute left-0 top-[-30%] h-[160%] w-[26%]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.55) 58%, transparent)",
          }}
          initial={{ x: "-40vw", rotate: 24, opacity: 0 }}
          animate={{ x: "130vw", rotate: 24, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.55, times: [0, 0.25, 0.75, 1], ease: "easeIn" }}
        />
      )}
      {/* Tấm lớn (mặt cắt pha lê): VỠ = bong ra + KÉO GIÃN ngang
          (scaleX 1→1,4, như bị kéo xé ra hai phía) + mờ dần; LẮP = mờ
          dần hiện ra xếp thành tim rồi tan vào tim thật. */}
      {PLATES.map((p, i) => (
        <motion.span
          key={`plate-${i}`}
          className="absolute block"
          style={{
            left: "50%",
            top: "46%",
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
              ? { x: p.x * 0.45, y: p.y * 0.45, opacity: 0, scale: 1.28, rotate: p.rotate + 18 }
              : { x: 0, y: 0, opacity: 0.7, scale: 1, scaleX: 1, rotate: p.rotate }
          }
          animate={
            isAssemble
              ? { x: 0, y: 0, opacity: [0, 0.7, 0.7, 0], scale: 1, rotate: p.rotate }
              : { x: p.x * 0.45, y: p.y * 0.45, opacity: [0.7, 0.7, 0], scale: 1.28, scaleX: 1.4, rotate: p.rotate + 18 }
          }
          transition={{
            duration: isAssemble ? 1.2 : 1.0,
            delay: isAssemble ? 0.15 : 0,
            times: isAssemble ? [0, 0.15, 0.75, 1] : [0, 0.5, 1],
            ease: isAssemble ? "easeOut" : "easeIn",
          }}
        />
      ))}
      {/* Dải mảnh nhỏ quét CHÉO từ góc trên-trái xuống (vết xé). VỠ:
          hiện rồi mờ dần khi bay ra. LẮP: bay VÀO tụ về tâm tim rồi
          mờ dần lúc "đáp". */}
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
            duration: isAssemble ? 1.0 : 0.9,
            delay: s.delay,
            times: isAssemble ? [0, 0.2, 0.7, 1] : [0, 0.15, 0.65, 1],
            ease: "easeOut",
          }}
        />
      ))}
      {/* HOA TUNG / TỤ — VỠ: cánh hoa bùng ra từ tâm tim ra mọi hướng
          (khung s_026, tim to 20–60px); LẮP: cánh bay ngược vào tụ
          về tâm tim (khung a_031, dòng hoa chảy về). */}
      {burstPetals.map((b, i) => (
        <motion.span
          key={`burst-${i}`}
          className="absolute block"
          style={{ left: "50%", top: "46%", width: b.size, height: b.size, marginLeft: -b.size / 2, marginTop: -b.size / 2 }}
          initial={
            isAssemble
              ? { x: b.dx, y: b.dy, opacity: 0, rotate: b.rot, scale: 0.7 }
              : { x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.7 }
          }
          animate={
            isAssemble
              ? { x: 0, y: 0, opacity: [0, 1, 1, 0], rotate: 0, scale: 1 }
              : { x: b.dx, y: b.dy, opacity: [0, 1, 1, 0], rotate: b.rot, scale: 1 }
          }
          transition={{
            duration: isAssemble ? 1.2 : 1.1,
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
