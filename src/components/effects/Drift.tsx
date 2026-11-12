// Drift dùng chung cho các kiểu slide — NGUYÊN TẮC CHUYỂN ẢNH
// (Nancy 2026-11-11 14:21, quan sát từ TẤT CẢ mẫu cộng đồng): ảnh lúc
// nghỉ bồng bềnh dập dìu NHẸ liên tục; lúc chuyển để đổi ảnh thì ảnh
// trôi MẠNH theo chiều của hiệu ứng — nhờ vậy animation rất mượt, không
// "giật" lúc đổi ảnh. Chỉ transform (translate/rotate/scale), KHÔNG
// đổi opacity (quy tắc: ảnh album opacity 1 luôn). Giảm chuyển động:
// tĩnh hoàn toàn, không drift.
//
// MẶC ĐỊNH HỆ THỐNG (Nancy 2026-11-12): bồng bềnh là mặc định — MỌI
// kiểu slide trong thư viện đều phải có DriftRest + DriftSurge (gán
// hết, không kiểu nào đứng yên); kiểu slide mới thêm vào cũng gán
// luôn từ đầu. Ngoại lệ duy nhất: LayerMotion có động cơ trôi riêng
// (rAF, nhiều lớp lệch nhịp) nên không dùng Drift.tsx — nhưng vẫn
// phải trôi, và mọi thứ dính vào ảnh đều trôi cùng nhau (chung block).
//
// DRIFT V3 (Nancy 2026-11-12 17:09, chị phát hiện ảnh chỉ nghiêng
// phẳng 2D, không có perspective): thêm CHIỀU SÂU 3D — perspective
// 1000px + rotateX ±4° (chu kỳ 7s) + rotateY ±4° (chu kỳ 9s, lệch pha
// với rotateX) + TÁCH NHỊP: mỗi thuộc tính một chu kỳ riêng (x 6s,
// y 8s, xoay phẳng 6s, scale 7s, rotateX 7s, rotateY 9s) nên khung
// không còn đồng bộ cơ học. Khung nghiêng trong không gian 3D: mép xa
// nhỏ lại, mép gần to ra — như tấm ảnh thật đang lơ lửng, không phải
// hình phẳng cắt dán. tiltX/tiltY (DriftRest): góc nghiêng 3D NỀN —
// ảnh trong collage nghiêng ĐỐI NHAU quanh góc nền này (vd ảnh trái
// +3°, ảnh phải −3°, như hai tấm ảnh mở ra như cuốn sách); amp: biên
// độ dao động quanh góc nền (mặc định 4°; collage dùng 1,5° để hai
// ảnh luôn nghiêng ngược nhau, không cắt qua 0).
//
// Cách dùng:
// - DriftRest: bọc KHUNG ẢNH (không bọc mỗi ảnh trong) để cả khung
//   trôi + zoom nhẹ vô hạn lúc nghỉ.
// - DriftSurge: bọc khung/ảnh, key theo sceneKey — mỗi lần sceneKey
//   đổi thì remount + chạy 1 cú trôi mạnh từ offset về 0 theo đúng
//   chiều hiệu ứng của kiểu đó (ngang/dọc/về phía người xem).
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Drift lúc nghỉ V3 (Nancy 2026-11-12 17:09): MOVE + ZOOM + NGHIÊNG
 *  3D cùng lúc mới giống nổi lơ lửng trên không — x ±8px (6s), y ±6px
 *  (8s), xoay phẳng ±1° (6s), scale 1,00 → 1,04 (7s), rotateX ±4°
 *  (7s), rotateY ±4° (9s), perspective 1000px, ease in-out, lặp vô
 *  hạn, mỗi thuộc tính một nhịp riêng. */
export const DRIFT_REST = { xPx: 8, yPx: 6, rotateDeg: 1, scaleMax: 1.04, durationS: 6, perspPx: 1000, rotXDeg: 4, rotYDeg: 4 } as const;

/** Drift lúc chuyển — trôi mạnh theo chiều hiệu ứng: ±50px, ~1,3s
 *  (bằng nhịp chuyển cảnh dài nhất trong thư viện). */
export const DRIFT_SURGE = { xPx: 50, durationS: 1.3 } as const;

/** Cả khung ảnh trôi + zoom + nghiêng 3D nhẹ liên tục lúc nghỉ.
 *  Bọc NGOÀI KHUNG ẢNH (khung + ảnh + mọi thứ dính vào khung trôi
 *  cùng nhau); không bọc mỗi ảnh trong khung đứng yên. Không đụng
 *  transform của phần tử cha (trượt/lật/zoom của kiểu đó nằm ở lớp
 *  khác). Giảm chuyển động (disabled): div thường, không motion. */
export function DriftRest({
  children,
  disabled,
  className,
  tiltX = 0,
  tiltY = 0,
  amp = DRIFT_REST.rotXDeg,
}: {
  children: ReactNode;
  /** true khi giảm chuyển động — ảnh tĩnh hoàn toàn. */
  disabled?: boolean;
  className?: string;
  /** Góc nghiêng 3D nền quanh trục ngang (độ) — ảnh collage nghiêng
   *  đối nhau quanh góc này (vd trên +3°, dưới −3°). Mặc định 0. */
  tiltX?: number;
  /** Góc nghiêng 3D nền quanh trục dọc (độ) — vd trái +3°, phải −3°. */
  tiltY?: number;
  /** Biên độ dao động 3D quanh góc nền (độ) — mặc định 4°; collage
   *  dùng 1,5° để hai ảnh luôn nghiêng ngược nhau. */
  amp?: number;
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
  // "none"); không truyền initial thì nó lấy keyframe đầu làm điểm
  // bắt đầu rồi chạy lặp vô hạn như mong muốn.
  return (
    <motion.div
      data-testid="drift-rest"
      className={`will-change-transform ${className ?? ""}`.trim()}
      style={{ transformPerspective: DRIFT_REST.perspPx }}
      animate={{
        x: [0, DRIFT_REST.xPx, 0, -DRIFT_REST.xPx, 0],
        y: [0, -DRIFT_REST.yPx, 0, DRIFT_REST.yPx, 0],
        rotate: [0, DRIFT_REST.rotateDeg, 0, -DRIFT_REST.rotateDeg, 0],
        // Zoom đỉnh đúng lúc |dịch chuyển| lớn nhất (keyframe 1 và 3),
        // về 1 đúng lúc khung về vị trí giữa — move + zoom cùng nhịp.
        scale: [1, DRIFT_REST.scaleMax, 1, DRIFT_REST.scaleMax, 1],
        // Nghiêng 3D: dao động quanh góc nền, lệch pha nhau (rotateX
        // 7s, rotateY 9s) và lệch nhịp với x/y/scale — khung không
        // còn đồng bộ cơ học, mép xa/mép gần thay nhau nổi/chìm.
        rotateX: [tiltX - amp, tiltX + amp, tiltX - amp],
        rotateY: [tiltY - amp, tiltY + amp, tiltY - amp],
      }}
      transition={{
        x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        rotateX: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 9, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Cú trôi mạnh lúc chuyển cảnh — remount mỗi khi sceneKey đổi, chạy
 *  1 lần từ offset về 0 (easeOut): offset.x dương = ảnh bắt đầu lệch
 *  phải rồi trôi sang trái (cùng chiều mây hoa quét phải → trái),
 *  offset.y dương = bắt đầu lệch xuống rồi trôi lên, scale > 1 =
 *  bắt đầu gần hơn rồi lùi về (trôi về phía người xem). V3: nghiêng
 *  3D theo chiều surge — trôi ngang thì nghiêng quanh trục dọc
 *  (rotateY ±4°), trôi dọc thì nghiêng quanh trục ngang (rotateX
 *  ±3°), như tấm ảnh thật bay vào.
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
  const surgeTiltY = offset.x ? Math.sign(offset.x) * 4 : 0;
  const surgeTiltX = offset.y ? Math.sign(offset.y) * 3 : 0;
  return (
    <motion.div
      key={sceneKey}
      data-testid="drift-surge"
      className={`will-change-transform ${className ?? ""}`.trim()}
      style={{ transformPerspective: DRIFT_REST.perspPx }}
      initial={{
        x: offset.x ?? 0,
        y: offset.y ?? 0,
        scale: offset.scale ?? 1,
        rotateX: surgeTiltX,
        rotateY: surgeTiltY,
      }}
      animate={{ x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 }}
      transition={{ duration: durationS, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
