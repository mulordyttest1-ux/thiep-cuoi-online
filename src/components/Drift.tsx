// Drift dùng chung cho các kiểu slide — NGUYÊN TẮC CHUYỂN ẢNH
// (Nancy 2026-11-11 14:21, quan sát từ TẤT CẢ mẫu cộng đồng): ảnh lúc
// nghỉ bồng bềnh dập dìu NHẸ liên tục; lúc chuyển để đổi ảnh thì ảnh
// trôi MẠNH theo chiều của hiệu ứng — nhờ vậy animation rất mượt, không
// "giật" lúc đổi ảnh. Chỉ transform (translate/rotate/scale), KHÔNG
// đổi opacity (quy tắc: ảnh album opacity 1 luôn). Giảm chuyển động:
// tĩnh hoàn toàn, không drift.
//
// Cách dùng:
// - DriftRest: bọc ảnh (hoặc khung ảnh) để ảnh trôi nhẹ vô hạn lúc nghỉ.
// - DriftSurge: bọc khung/ảnh, key theo sceneKey — mỗi lần sceneKey
//   đổi thì remount + chạy 1 cú trôi mạnh từ offset về 0 theo đúng
//   chiều hiệu ứng của kiểu đó (ngang/dọc/về phía người xem).
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Drift lúc nghỉ — nhẹ tới mức nhìn thoáng vẫn thấy ảnh "đứng yên"
 *  như mẫu, nhưng không chết hẳn: x ±3px, y ±2px, xoay ±0,5°, chu
 *  kỳ 7s, ease in-out, lặp vô hạn. */
export const DRIFT_REST = { xPx: 3, yPx: 2, rotateDeg: 0.5, durationS: 7 } as const;

/** Drift lúc chuyển — trôi mạnh theo chiều hiệu ứng: ±50px, ~1,3s
 *  (bằng nhịp chuyển cảnh dài nhất trong thư viện). */
export const DRIFT_SURGE = { xPx: 50, durationS: 1.3 } as const;

/** Ảnh trôi nhẹ liên tục lúc nghỉ (dao động ±3px/±2px + xoay ±0,5°,
 *  chu kỳ 7s). Bọc ngoài ảnh hoặc khung ảnh; không đụng transform
 *  của phần tử cha (trượt/lật/zoom của kiểu đó nằm ở lớp khác).
 *  Giảm chuyển động (disabled): div thường, không motion. */
export function DriftRest({
  children,
  disabled,
  className,
}: {
  children: ReactNode;
  /** true khi giảm chuyển động — ảnh tĩnh hoàn toàn. */
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) {
    return (
      <div data-testid="drift-rest" className={className}>
        {children}
      </div>
    );
  }
  // LƯU Ý (bài học QA drift 2026-11-11): KHÔNG đặt initial={false} ở
  // đây — framer-motion 11 với initial={false} + animate keyframes
  // thì KHÔNG tạo animation nào (đo được 0 animation, transform
  // "none"); không truyền initial thì nó lấy keyframe đầu (0,0,0)
  // làm điểm bắt đầu rồi chạy lặp vô hạn như mong muốn.
  return (
    <motion.div
      data-testid="drift-rest"
      className={`will-change-transform ${className ?? ""}`.trim()}
      animate={{
        x: [0, DRIFT_REST.xPx, 0, -DRIFT_REST.xPx, 0],
        y: [0, -DRIFT_REST.yPx, 0, DRIFT_REST.yPx, 0],
        rotate: [0, DRIFT_REST.rotateDeg, 0, -DRIFT_REST.rotateDeg, 0],
      }}
      transition={{ duration: DRIFT_REST.durationS, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Cú trôi mạnh lúc chuyển cảnh — remount mỗi khi sceneKey đổi, chạy
 *  1 lần từ offset về 0 (easeOut): offset.x dương = ảnh bắt đầu lệch
 *  phải rồi trôi sang trái (cùng chiều mây hoa quét phải → trái),
 *  offset.y dương = bắt đầu lệch xuống rồi trôi lên, scale > 1 =
 *  bắt đầu gần hơn rồi lùi về (trôi về phía người xem).
 *  Giảm chuyển động (disabled): div thường, không motion. */
export function DriftSurge({
  sceneKey,
  offset,
  durationS = DRIFT_SURGE.durationS,
  disabled,
  className,
  children,
}: {
  /** Đổi mỗi lần sang cảnh mới — key để remount + chạy lại cú trôi. */
  sceneKey: string | number;
  /** Điểm bắt đầu của cú trôi (x/y px, scale) — về 0 khi ổn định. */
  offset: { x?: number; y?: number; scale?: number };
  /** Thời lượng cú trôi (giây) — khớp nhịp chuyển cảnh của kiểu đó. */
  durationS?: number;
  /** true khi giảm chuyển động hoặc chưa từng chuyển cảnh — tĩnh. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <div key={sceneKey} data-testid="drift-surge" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      key={sceneKey}
      data-testid="drift-surge"
      className={`will-change-transform ${className ?? ""}`.trim()}
      initial={{ x: offset.x ?? 0, y: offset.y ?? 0, scale: offset.scale ?? 1 }}
      animate={{ x: 0, y: 0, scale: 1 }}
      transition={{ duration: durationS, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
