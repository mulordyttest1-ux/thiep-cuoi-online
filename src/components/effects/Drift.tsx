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
// KHUNG + ẢNH LÀ MỘT NHÓM (Nancy 2026-11-12 17:30, chị thấy khung
// trắng lệch khỏi ảnh): khung trắng LUÔN stick cứng với ảnh — MỌI
// transform (nghiêng phẳng, nghiêng 3D, drift, zoom) đều áp lên
// CHUNG MỘT element (DriftRest này), không bao giờ nghiêng/chuyển
// riêng ảnh trong khi khung đứng yên, không lệch pha. Góc nghiêng
// 2D nền của cả nhóm qua prop `tilt` (vd ảnh wide ±1,5°, ảnh nhỏ
// collage ±2°); dao động nghỉ ±1° quanh góc nền đó. Lỗi cũ: góc
// nghiêng đặt trên div trong (chỉ xoay ảnh, khung trắng đứng yên)
// nên ảnh nghiêng lệch trong khung, góc ảnh còn bị overflow-hidden
// của khung cắt mất.
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
// BỒNG BỀNH 3 CHIỀU — V4 (Nancy 2026-11-13 08:14, chị chốt "thích cả
// 2"): GHÉP chiều sâu lớp (Hover Tilt stacked-3d: các lớp translateZ
// khác nhau + bóng chạy ngược chiều nghiêng) VÀ bồng bềnh tự động
// (Aduok photo card deck: mỗi ảnh một nhịp riêng, không đồng bộ) +
// BÓNG XA CHÚT VÀ ĐẬM HƠN + NGHIÊNG 3D NHIỀU CHÚT:
// - Nghiêng 3D mạnh lên: perspective 800px + rotateX/Y ±8° (bản mạnh
//   demo 2026-11-13 đo đỉnh rx −7,93°/ry 7,67° — thấy rõ hình thang);
//   DriftSurge nghiêng theo chiều trôi 8°/6°.
// - BÓNG ĐỘNG (DriftShadow): bóng KHÔNG đi cùng nhịp với vật thể —
//   nó thở NGƯỢC với độ cao của ảnh: ảnh bay lên (y âm) thì bóng NHỎ
//   lại + MỜ đi (xa mặt nền), ảnh hạ xuống thì bóng TO ra + ĐẬM lên
//   (sát mặt nền); lệch ngang ngược chiều nghiêng (x nhịp 9s theo
//   rotateY). Bóng là elip mềm nằm XA dưới khung 28px, đậm (alpha
//   0,45 lúc đậm nhất — gấp ~2,5 lần bóng tĩnh cũ 0,18). Bóng là con
//   của DriftRest nên vẫn trôi ngang cùng ảnh (đúng vật lý: bóng đi
//   theo vật thể), chỉ có ĐỘ LỚN / ĐỘ ĐẬM / ĐỘ LỆCH là nhịp khác.
// - LỆCH NHỊP MỖI ẢNH (seed): mỗi ảnh một `seed` riêng — chu kỳ dài
//   ra theo seed (×1,12/ảnh) + bắt đầu lệch pha (delay âm) nên các
//   ảnh trên cùng một cảnh không bao giờ bồng bềnh đồng bộ.
// - Ngoại lệ: tim đào tràn khung + panel truyện tranh KHÔNG có bóng
//   (tràn khung thì bóng vô nghĩa; truyện tranh đã có bóng cứng riêng).
//
// Cách dùng:
// - DriftRest: bọc KHUNG ẢNH (không bọc mỗi ảnh trong) để cả khung
//   trôi + zoom nhẹ vô hạn lúc nghỉ.
// - DriftSurge: bọc khung/ảnh, key theo sceneKey — mỗi lần sceneKey
//   đổi thì remount + chạy 1 cú trôi mạnh từ offset về 0 theo đúng
//   chiều hiệu ứng của kiểu đó (ngang/dọc/về phía người xem).
// - LƯU Ý: DriftRest KHÔNG được có overflow-hidden (bóng nằm ngoài
//   khung, dưới khung 28px — overflow-hidden sẽ cắt mất bóng). Chỗ
//   nào cần cắt ảnh thì đặt overflow-hidden lên div TRONG (như
//   photo-frame), không đặt lên DriftRest.
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Drift lúc nghỉ V4 (Nancy 2026-11-13 08:14): MOVE + ZOOM + NGHIÊNG
 *  3D cùng lúc mới giống nổi lơ lửng trên không — x ±8px (6s), y ±6px
 *  (8s), xoay phẳng ±1° (6s), scale 1,00 → 1,04 (7s), rotateX ±8°
 *  (7s), rotateY ±8° (9s), perspective 800px, ease in-out, lặp vô
 *  hạn, mỗi thuộc tính một nhịp riêng. */
export const DRIFT_REST = { xPx: 8, yPx: 6, rotateDeg: 1, scaleMax: 1.04, durationS: 6, perspPx: 800, rotXDeg: 8, rotYDeg: 8 } as const;

/** Drift lúc chuyển — trôi mạnh theo chiều hiệu ứng: ±50px, ~1,3s
 *  (bằng nhịp chuyển cảnh dài nhất trong thư viện). */
export const DRIFT_SURGE = { xPx: 50, durationS: 1.3 } as const;

/** Bóng động dưới khung ảnh — elip mềm, xa khung 28px, đậm (alpha
 *  0,45 lúc đậm nhất). Thở NGƯỢC với độ cao của ảnh: ảnh lên thì
 *  bóng nhỏ + mờ, ảnh xuống thì bóng to + đậm; lệch ngang ngược
 *  chiều nghiêng. Nhịp KHÁC ảnh: scale/opacity khóa ngược với y của
 *  ảnh (cùng chu kỳ 8s, cùng delay — luôn ngược pha đúng lúc), x
 *  theo rotateY (9s). Bóng là con của DriftRest nên trôi ngang cùng
 *  ảnh (đúng vật lý), chỉ có độ lớn/độ đậm/độ lệch là nhịp khác.
 *  Giảm chuyển động (disabled): bóng tĩnh, không thở. */
export function DriftShadow({
  disabled,
  seed = 0,
}: {
  /** true khi giảm chuyển động — bóng tĩnh, không thở. */
  disabled?: boolean;
  /** Hạt giống lệch nhịp — khớp với seed của DriftRest chứa nó để
   *  bóng luôn khóa ngược đúng nhịp với ảnh của nó. */
  seed?: number;
}) {
  const durK = 1 + seed * 0.12;
  const delay = -seed * 2;
  const cls =
    // Rộng hơn khung một chút (−1% mỗi bên): bóng đổ tỏa ra ngoài
    // khung như bóng thật; ở bố cục wide, hai đầu bóng ló ra ngoài
    // thẻ ghi chú (hẹp hơn khung) nên vẫn thấy được.
    "pointer-events-none absolute left-[-1%] right-[-1%] -bottom-7 h-9 rounded-[50%]";
  const style = {
    background:
      "radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.20) 55%, transparent 78%)",
    filter: "blur(8px)",
  } as const;
  if (disabled) {
    return (
      <div
        data-testid="drift-shadow"
        aria-hidden="true"
        className={cls}
        style={{ ...style, opacity: 0.85 }}
      />
    );
  }
  return (
    <motion.div
      data-testid="drift-shadow"
      aria-hidden="true"
      className={cls}
      style={style}
      animate={{
        // Lệch ngang ngược chiều nghiêng (theo rotateY 9s của ảnh).
        x: [0, -5, 0, 5, 0],
        // Ảnh bay lên (y −6) → bóng nhỏ lại; ảnh hạ xuống (y +6) →
        // bóng to ra. Cùng chu kỳ 8s + cùng delay với y của ảnh nên
        // luôn ngược pha đúng lúc, không trôi lệch theo thời gian.
        scaleX: [1, 0.86, 1, 1.08, 1],
        scaleY: [1, 0.9, 1, 1.05, 1],
        // Ảnh lên → bóng mờ (xa mặt nền); ảnh xuống → bóng đậm (sát
        // mặt nền). Đậm nhất alpha hiệu dụng ~0,45 (0,45 × 1).
        opacity: [0.85, 0.6, 0.85, 1, 0.85],
      }}
      transition={{
        x: { duration: 9 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        scaleX: { duration: 8 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        scaleY: { duration: 8 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        opacity: { duration: 8 * durK, delay, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
}

/** Cả khung ảnh trôi + zoom + nghiêng 3D nhẹ liên tục lúc nghỉ.
 *  Bọc NGOÀI KHUNG ẢNH (khung + ảnh + mọi thứ dính vào khung trôi
 *  cùng nhau); không bọc mỗi ảnh trong khung đứng yên. KHÔNG đặt
 *  transform riêng lên ảnh trong — góc nghiêng 2D nền của CẢ NHÓM
 *  qua prop `tilt` (dao động nghỉ ±1° quanh góc nền đó). Giảm chuyển
 *  động (disabled): div thường, không motion — nhưng vẫn giữ góc
 *  nghiêng tĩnh (đó là góc thiết kế của tấm ảnh, không phải chuyển
 *  động). Mặc định có bóng động (DriftShadow) — tắt ở tim đào tràn
 *  khung và panel truyện tranh (xem V4). KHÔNG đặt overflow-hidden
 *  lên DriftRest (sẽ cắt mất bóng nằm dưới khung). */
export function DriftRest({
  children,
  disabled,
  className,
  tilt = 0,
  tiltX = 0,
  tiltY = 0,
  amp = DRIFT_REST.rotXDeg,
  seed = 0,
  shadow = true,
}: {
  children: ReactNode;
  /** true khi giảm chuyển động — ảnh tĩnh hoàn toàn. */
  disabled?: boolean;
  className?: string;
  /** Góc nghiêng 2D nền của CẢ NHÓM khung + ảnh (độ) — vd ảnh wide
   *  ±1,5°, ảnh nhỏ collage ±2°. Mặc định 0. */
  tilt?: number;
  /** Góc nghiêng 3D nền quanh trục ngang (độ) — ảnh collage nghiêng
   *  đối nhau quanh góc này (vd trên +3°, dưới −3°). Mặc định 0. */
  tiltX?: number;
  /** Góc nghiêng 3D nền quanh trục dọc (độ) — vd trái +3°, phải −3°. */
  tiltY?: number;
  /** Biên độ dao động 3D quanh góc nền (độ) — mặc định 8°; collage
   *  dùng 1,5° để hai ảnh luôn nghiêng ngược nhau. */
  amp?: number;
  /** Hạt giống lệch nhịp (Aduok: mỗi ảnh một nhịp riêng, không đồng
   *  bộ) — chu kỳ dài ra ×(1 + seed×0,12) + bắt đầu lệch pha
   *  (delay âm). Ảnh đơn: 0; collage: mỗi ảnh một seed khác nhau. */
  seed?: number;
  /** Bóng động dưới khung (mặc định bật). Tắt ở tim đào tràn khung
   *  và panel truyện tranh (bóng cứng riêng). */
  shadow?: boolean;
}) {
  const durK = 1 + seed * 0.12;
  const delay = -seed * 2;
  if (disabled) {
    return (
      <div
        data-testid="drift-rest"
        className={className}
        // Bóng tĩnh là con của khung nên khung phải là khối định vị
        // (như nhánh motion) — chỉ đặt khi có bóng.
        style={{
          ...(tilt ? { transform: `rotate(${tilt}deg)` } : null),
          ...(shadow ? { position: "relative" as const } : null),
        }}
      >
        {shadow ? <DriftShadow disabled seed={seed} /> : null}
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
      // Bóng động là con của khung nên khung phải là khối định vị —
      // position:relative qua style (className của từng kiểu có thể
      // không có relative, vd Intro/Flowers). Style inline thắng
      // className nên chỉ đặt khi có bóng; kiểu tắt bóng (tim đào
      // absolute inset-0) không bị ảnh hưởng.
      style={{
        transformPerspective: DRIFT_REST.perspPx,
        ...(shadow ? { position: "relative" as const } : null),
      }}
      animate={{
        x: [0, DRIFT_REST.xPx, 0, -DRIFT_REST.xPx, 0],
        y: [0, -DRIFT_REST.yPx, 0, DRIFT_REST.yPx, 0],
        // Xoay phẳng: dao động ±1° quanh góc nghiêng nền `tilt` của
        // CẢ NHÓM khung + ảnh (không xoay riêng ảnh trong khung).
        rotate: [tilt, tilt + DRIFT_REST.rotateDeg, tilt, tilt - DRIFT_REST.rotateDeg, tilt],
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
        x: { duration: 6 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 8 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 6 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 7 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        rotateX: { duration: 7 * durK, delay, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 9 * durK, delay, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {shadow ? <DriftShadow seed={seed} /> : null}
      {children}
    </motion.div>
  );
}

/** Cú trôi mạnh lúc chuyển cảnh — remount mỗi khi sceneKey đổi, chạy
 *  1 lần từ offset về 0 (easeOut): offset.x dương = ảnh bắt đầu lệch
 *  phải rồi trôi sang trái (cùng chiều mây hoa quét phải → trái),
 *  offset.y dương = bắt đầu lệch xuống rồi trôi lên, scale > 1 =
 *  bắt đầu gần hơn rồi lùi về (trôi về phía người xem). V4: nghiêng
 *  3D theo chiều surge — trôi ngang thì nghiêng quanh trục dọc
 *  (rotateY ±8°), trôi dọc thì nghiêng quanh trục ngang (rotateX
 *  ±6°), như tấm ảnh thật bay vào.
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
  const surgeTiltY = offset.x ? Math.sign(offset.x) * 8 : 0;
  const surgeTiltX = offset.y ? Math.sign(offset.y) * 6 : 0;
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
