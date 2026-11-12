// Bộ sưu tập kiểu TỎ TÌNH ẤM ÁP — kiểu slide ảnh riêng trong thư viện
// (id "warm-confession", mẫu Pikbest 10077037 "Beautiful and Warm
// Wedding Confession Brochure Video", AE template; làm 2026-11-11).
//
// Ngôn ngữ của mẫu: thẻ ghi chú tỏ tình (thẻ trắng viền đỏ mỏng, nghiêng
// nhẹ, ĐÈ LÊN góc ảnh, chữ thư pháp + nét cọ đỏ + tim đỏ nhỏ — điệp khúc
// có ở mọi cảnh); collage 2–3 ảnh cùng lúc (2 nhỏ xếp chồng trái + 1 lớn
// phải, hoặc 2 ảnh song song); khung ảnh NGANG RỘNG viền trắng mỏng đều
// (không phải Polaroid dọc 4:5); chuyển cảnh MỜ DẦN QUA TRẮNG; nền sáng
// ấm (trắng/kem/hồng) với chính ảnh đang hiện mờ nhạt làm nền sau khung;
// đường kẻ chéo mảnh xuyên khung.
//
// KHÁC slideshow Polaroid mặc định (lấy cảm hứng từ chính mẫu này nhưng
// chưa lấy hết): không có chồng Polaroid nghiêng, không nền màu cảnh đậm,
// không trượt/xoay ảnh vào chồng — thay bằng thẻ ghi chú viền đỏ đè lên
// ảnh, collage nhiều ảnh cùng lúc, khung ngang rộng, chuyển cảnh mờ qua
// trắng, nền kem ấm sáng. KHÁC brochure lãng mạn: không khung trái tim,
// không chia đôi trang, không thẻ viền vàng — thẻ viền ĐỎ + collage +
// mờ qua trắng.
//
// Nhịp theo chuẩn app: mỗi ảnh giữ 12 giây (PHOTO_MS), không bê nhịp
// nhanh của video gốc. 1 ảnh → luôn bố cục rộng; nhiều ảnh → xen kẽ
// rộng / collage theo chỉ số cảnh. Ảnh opacity 1 luôn ở trạng thái
// nghỉ — chỉ trong lúc chuyển cảnh (0,8s) cả khung cảnh mới mờ về
// trắng rồi hiện lại từ trắng (fade-through-white đúng mẫu).
//
// Chuyển động ảnh ZOOM + FADE + MOVE đúng mẫu (đo từ preview.mp4):
// zoom 1,00 → 1,10 trong 12s + lia ngang ±12px đổi hướng theo cảnh +
// mờ dần vào 0,8s đầu; khi dừng thì nhúc nhích nhẹ vô hạn (dao động
// ±2px, chu kỳ 5s) — làm tại chỗ trong file này (motion.img + div bọc),
// không dùng KenBurns chung nữa.
//
// Tái dùng đồ sẵn có: getSlideshowSlides (chia dòng theo số ảnh như
// scrapbook), hiệu ứng chữ SandText/PaperText, AmbientLayer
// (lớp phủ theo biến thể — chỉ dùng, không sửa). Hiệu ứng scatter dùng
// bản sao ShatterText tại chỗ (component gốc nằm trong IntroSlideshow,
// không export) với cùng nhịp đáp chung (TEXT_PACE_*).

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer } from "@/components/effects";
import { DriftRest, DriftSurge } from "@/components/effects/Drift";
import { FadeThroughWhiteScene } from "@/components/transitions";
import { SandText } from "@/components/SandText";
import { PaperText } from "@/components/PaperText";
import {
  getSlideshowSlides,
  TEXT_PACE_DUR_S,
  textPaceStartAt,
  type SlideshowLine,
  type TextEffectId,
} from "@/lib/intro";

const PHOTO_MS = 12000; // mỗi ảnh hiện ~12s rồi sang ảnh sau (chuẩn app)

/** Hiệu ứng chuyển "MỜ QUA TRẮNG" nằm trong thư viện chuyển cảnh
 *  (src/components/transitions/FadeThroughWhiteScene) — 3 pha 0,8s,
 *  đo trực tiếp từ preview.mp4 mẫu 10077037. */

/** Chuyển động ảnh ZOOM + FADE + MOVE đúng mẫu 10077037 — đo trực tiếp
 *  từ preview.mp4 bằng phase correlation (khung 960×540):
 *  - Cảnh hoàng hôn 9,4–10,7s: ảnh lia sang phải, nhanh đầu (~7px/s)
 *    rồi chậm dần (~1px/s) — ease-out, không dừng hẳn.
 *  - Cảnh collage 11,6–12,7s (lúc "dừng"): ảnh vẫn trôi chậm ~0,6px/s
 *    sang trái — không đứng yên hẳn, đó là cái "nhúc nhích nhẹ" chị thấy.
 *  - Cảnh cuối 26,5–30,3s: gần như đứng yên (chỉ còn fade kết).
 *  Đổi sang nhịp app 12s/cảnh: zoom 1,00 → 1,10 trong 12s (ease-out),
 *  lia ngang ±12px + dọc ∓2px, đổi hướng xen kẽ theo cảnh; mờ dần vào
 *  trong 0,8s đầu. Khi hết hành trình chính, CẢ KHUNG ẢNH dao động
 *  nhẹ vô hạn (x/y ±8px/±6px + xoay ±1° + scale 1,00 → 1,04, chu kỳ
 *  6s — drift nghỉ V2 chuẩn DRIFT_REST, nguyên tắc chuyển ảnh
 *  2026-11-11 15:15, MOVE + ZOOM cùng lúc như nổi lơ lửng). Lúc đổi
 *  cảnh, ảnh mới trôi về phía người xem (scale 1,05 → 1 + trôi lên
 *  8px trong 0,8s, khớp pha mờ qua trắng). */
const PHOTO_ZOOM = 1.1; // zoom 1,00 → 1,10 trong 12s
const PAN_X = 12; // lia ngang ±12px (đổi hướng theo cảnh)
const PAN_Y = 2; // lia dọc ∓2px
const FADE_IN_S = 0.8; // ảnh mờ dần vào trong 0,8s đầu cảnh
const CLUSTER_PAN_X = 6; // collage: cả cụm lia chậm ±6px
const CLUSTER_PAN_Y = 3; // collage: cả cụm lia chậm ∓3px

/** Nền kem ấm của mẫu (sáng, ấm — khác nền màu cảnh đậm của Polaroid). */
const PAPER_BG = "#fdf9f3";
/** Màu chữ chính trên nền sáng. */
const INK = "#5a1f2b";
/** Màu chữ phụ trên nền sáng. */
const INK_MUTED = "rgba(90,31,43,0.72)";
/** Đỏ viền thẻ ghi chú tỏ tình (màu dấu ấn của mẫu). */
const CARD_RED = "#c8102e";
/** Đỏ nét cọ + tim nhỏ trên thẻ. */
const SWOOSH_RED = "#d21f3c";

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (copy từ ShatterText trong IntroSlideshow để scatter nhìn giống). */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Scatter & Reform tại chỗ (như ShatterText trong IntroSlideshow):
 *  từng chữ cái bay về ghép lại thành chữ lúc vào, vỡ vụn bay đi lúc
 *  ra — cùng nhịp đáp chung (textPaceStartAt, TEXT_PACE_DUR_S). */
function WarmShatterText({
  text,
  slideKey,
  reduce,
  className,
  style,
}: {
  text: string;
  slideKey: number;
  reduce: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const words = useMemo(() => text.split(" ").map((w) => Array.from(w)), [text]);
  const total = useMemo(() => words.reduce((sum, w) => sum + w.length, 0), [words]);
  let charIndex = -1;
  return (
    <span className={className} style={style} aria-label={text}>
      {words.map((chars, wi) => (
        <Fragment key={`${slideKey}-w${wi}`}>
          <span className="inline-block whitespace-nowrap">
            {chars.map((ch) => {
              charIndex += 1;
              const i = charIndex;
              return (
                <motion.span
                  key={`${slideKey}-${i}`}
                  aria-hidden="true"
                  className="inline-block will-change-transform"
                  initial={
                    reduce
                      ? false
                      : {
                          opacity: 0,
                          x: jitter(i + slideKey * 31, 14),
                          y: jitter(i * 7 + slideKey * 17, 12),
                          rotate: jitter(i * 3 + 5, 10),
                        }
                  }
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    x: jitter(i + slideKey * 13, 26),
                    y: jitter(i * 5 + slideKey * 7, 26) + 16,
                    rotate: jitter(i * 11 + 2, 22),
                    scale: 0.85,
                    transition: { duration: 0.8, delay: i * 0.02, ease: "easeOut" },
                  }}
                  transition={{ duration: TEXT_PACE_DUR_S, delay: textPaceStartAt(i, total), ease: "easeOut" }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

/** Nét cọ đỏ + tim đỏ nhỏ dưới chữ trong thẻ ghi chú (dấu ấn của mẫu:
 *  nét cọ gạch dưới dòng chữ thư pháp, tim nhỏ ở cuối nét). */
function ConfessionFlourish() {
  return (
    <div aria-hidden="true" className="mt-3 flex items-center justify-center">
      <svg viewBox="0 0 120 12" className="h-3 w-28" fill="none">
        <path
          d="M2 9 C 30 3, 80 3, 118 8"
          stroke={SWOOSH_RED}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 20 20" className="-ml-1 -mt-1 h-3.5 w-3.5 shrink-0" fill={SWOOSH_RED}>
        <path d="M10 18 C 4 13, 1 9, 3 6 C 5 3, 9 4, 10 7 C 11 4, 15 3, 17 6 C 19 9, 16 13, 10 18 Z" />
      </svg>
    </div>
  );
}

/** Một khung ảnh trắng mỏng đều (kiểu mẫu: viền trắng mỏng, không đáy dày
 *  như Polaroid). Ảnh bên trong opacity 1 luôn ở trạng thái nghỉ.
 *  photoMotion = true: ảnh chạy ZOOM + FADE + MOVE (zoom 1,00 → 1,10
 *  trong 12s + lia ±12px, đổi hướng theo panSign) + DRIFT NGHỈ V2 vô
 *  hạn khi dừng (DriftRest bọc NGOÀI KHUNG: ±8px/±6px + xoay ±1° +
 *  scale 1,00 → 1,04, 6s — MOVE + ZOOM cùng lúc, cả khung trắng + ảnh
 *  trôi cùng nhau) + DRIFT CHUYỂN lúc đổi cảnh (trôi về phía người
 *  xem: scale 1,05 → 1 + trôi lên 8px trong 0,8s, khớp pha mờ qua
 *  trắng — nguyên tắc chuyển ảnh, Nancy 2026-11-11 15:15). Chuyển
 *  động chính đặt TRỰC TIẾP lên <img> (motion.img — bài học QA19:
 *  đặt lên div bọc thì mắt thấy ảnh đứng yên); cú trôi chuyển là
 *  DriftSurge bọc trong, key theo ảnh. Giảm chuyển động: ảnh tĩnh
 *  hoàn toàn. */
function PhotoFrame({
  src,
  className = "",
  aspect = "aspect-[16/10]",
  tilt = 0,
  photoMotion = false,
  panSign = 1,
  reduce = false,
}: {
  src: string;
  className?: string;
  aspect?: string;
  tilt?: number;
  photoMotion?: boolean;
  panSign?: 1 | -1;
  reduce?: boolean;
}) {
  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };
  return (
    <DriftRest
      disabled={reduce}
      className={`relative overflow-hidden rounded-[3px] bg-white p-2 shadow-[0_12px_35px_rgba(0,0,0,0.18)] ${className}`}
    >
    <div
      aria-hidden="true"
      className="relative h-full w-full"
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <div data-testid="photo-frame" className={`relative w-full overflow-hidden rounded-[2px] ${aspect}`}>
        {photoMotion && !reduce ? (
          <DriftSurge
            sceneKey={src}
            offset={{ scale: 1.05, y: 8 }}
            durationS={FADE_IN_S}
            disabled={reduce}
            className="h-full w-full"
          >
            <motion.img
              src={src}
              alt=""
              loading="eager"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover will-change-transform"
              onError={onImgError}
              initial={{ scale: 1, x: 0, y: 0, opacity: 0 }}
              animate={{
                scale: PHOTO_ZOOM,
                x: PAN_X * panSign,
                y: -PAN_Y * panSign,
                opacity: 1,
              }}
              transition={{
                scale: { duration: PHOTO_MS / 1000, ease: "easeOut" },
                x: { duration: PHOTO_MS / 1000, ease: "easeOut" },
                y: { duration: PHOTO_MS / 1000, ease: "easeOut" },
                opacity: { duration: FADE_IN_S, ease: "easeOut" },
              }}
            />
          </DriftSurge>
        ) : (
          <DriftSurge
            sceneKey={src}
            offset={{ scale: 1.05, y: 8 }}
            durationS={FADE_IN_S}
            disabled={reduce}
            className="h-full w-full"
          >
          <img
            src={src}
            alt=""
            loading="eager"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={onImgError}
          />
          </DriftSurge>
        )}
      </div>
    </div>
    </DriftRest>
  );
}

/** Collage lia cả cụm chậm — bọc ngoài lưới collage, trôi ±6px trong
 *  12s (ease-out, đổi hướng theo cảnh). Giảm chuyển động: tĩnh. */
function ClusterDrift({
  children,
  panSign,
  reduce,
}: {
  children: React.ReactNode;
  panSign: 1 | -1;
  reduce: boolean;
}) {
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      className="will-change-transform"
      initial={{ x: 0, y: 0 }}
      animate={{ x: -CLUSTER_PAN_X * panSign, y: CLUSTER_PAN_Y * panSign }}
      transition={{ duration: PHOTO_MS / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Đổi cảnh XOAY VÒNG 3 kiểu (đo từ video Pikbest 10077037, 2026-11-12):
 *  sweep = cảnh mới quét ngang vào (hướng xen kẽ), dissolve = mờ dần
 *  1,1s không lớp trắng, fade-white = mờ qua trắng trong thư viện
 *  chuyển cảnh (giữ nguyên). Lớp trắng chỉ có ở fade-white; giảm
 *  chuyển động: đổi cảnh tức thì ở cả 3 kiểu. */
function WarmSceneTransition({
  variant,
  sweepDir,
  sceneKey,
  reduce,
  active,
  children,
}: {
  variant: "sweep" | "fade-white" | "dissolve";
  sweepDir: 1 | -1;
  sceneKey: string | number;
  reduce: boolean;
  /** Chỉ chạy lớp trắng từ lần đổi cảnh đầu tiên trở đi (như
   *  FadeThroughWhiteScene). */
  active: boolean;
  children: React.ReactNode;
}) {
  if (variant === "fade-white") {
    return (
      <FadeThroughWhiteScene
        sceneKey={sceneKey}
        reduce={reduce}
        active={active}
        wrapperClassName="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6"
        sceneClassName="relative w-full max-w-2xl"
      >
        {children}
      </FadeThroughWhiteScene>
    );
  }
  const isSweep = variant === "sweep";
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneKey}
          className="relative w-full max-w-2xl"
          initial={
            reduce
              ? false
              : isSweep
                ? { opacity: 0, x: sweepDir * 90, scale: 1.05 }
                : { opacity: 0 }
          }
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0 } }
              : isSweep
                ? {
                    opacity: 0,
                    x: sweepDir * -40,
                    transition: { duration: 0.3, ease: "easeIn" },
                  }
                : { opacity: 0, transition: { duration: 0.55, ease: "easeInOut" } }
          }
          transition={
            reduce
              ? { duration: 0 }
              : isSweep
                ? { duration: 0.7, ease: "easeOut" }
                : { duration: 1.1, ease: "easeInOut" }
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function WarmConfessionSlideshow({
  data,
  fx,
  blurred,
  guestName,
  onEnter,
  photos: photosProp,
  textEffect = "scatter",
}: {
  data: InvitationData;
  fx: TemplateEffects;
  /** Demo: mờ tên/ngày/địa điểm như trong thiệp. */
  blurred?: boolean;
  /** Tên khách mời (?guest=) — hiện ở dòng mời. */
  guestName?: string;
  /** Khách bấm "Xem thiệp" → vào nội dung thiệp. */
  onEnter: () => void;
  /** Danh sách ảnh — mặc định chỉ ảnh thật của thiệp (data.photoUrl). */
  photos?: string[];
  /** Hiệu ứng chữ — "scatter" (mặc định), "sand", "paper" (nhịp chung
   *  TEXT_PACE_* như slideshow Polaroid). Chọn qua ?tx=; không truyền
   *  = cát. */
  textEffect?: TextEffectId;
}) {
  const reduce = useReducedMotion();
  const tpl = getTemplate(data.templateId);
  const blurCls = blurred ? "blur-[7px] select-none" : "";

  const photos = useMemo(
    () => Array.from(new Set(photosProp ?? [data.photoUrl])).filter(Boolean),
    [photosProp, data.photoUrl]
  );
  const [index, setIndex] = useState(0);
  // Lớp trắng chỉ chạy từ lần đổi cảnh đầu tiên trở đi — lần mở đầu
  // không có chớp trắng (tránh màn hình nháy trắng khi vừa vào).
  const [everAdvanced, setEverAdvanced] = useState(false);

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => {
      setEverAdvanced(true);
      setIndex((i) => (i + 1) % photos.length);
    }, PHOTO_MS);
    return () => window.clearInterval(t);
  }, [reduce, photos.length]);

  // Dòng thông tin — chỉ dòng nào có dữ liệu thật thì hiện (chia theo
  // số ảnh như scrapbook: Tên → Ngày → Địa điểm → slogan).
  const coupleName = [data.brideName?.trim(), data.groomName?.trim()]
    .filter(Boolean)
    .join(" & ");
  const dateLine = data.date ? formatDateVi(data.date) + (data.time ? ` • ${data.time}` : "") : "";
  const venueLine = [data.venue, data.address].filter(Boolean).join(" — ");
  const allCoreLines: SlideshowLine[] = useMemo(() => {
    const lines: SlideshowLine[] = [];
    if (coupleName) lines.push({ text: coupleName, kind: "name" });
    if (dateLine) lines.push({ text: dateLine, kind: "date" });
    if (venueLine) lines.push({ text: venueLine, kind: "venue" });
    return lines;
  }, [coupleName, dateLine, venueLine]);
  const slides = useMemo(
    () => getSlideshowSlides(photos.length, { name: coupleName, date: dateLine, venue: venueLine }),
    [photos.length, coupleName, dateLine, venueLine]
  );
  const currentLines = photos.length === 0 ? allCoreLines : (slides[index] ?? []);
  const currentPhoto = photos[index];

  // Bố cục xen kẽ theo cảnh: 1 ảnh → luôn ảnh đơn rộng (không collage
  // ảnh trùng); nhiều ảnh → chẵn: ảnh đơn rộng, lẻ: collage.
  const layout: "wide" | "collage" =
    photos.length > 1 && index % 2 === 1 ? "collage" : "wide";
  // Collage: ảnh hiện tại làm ảnh lớn + 1–2 ảnh kế làm ảnh nhỏ.
  const collageSmalls =
    photos.length >= 3
      ? [photos[(index + 1) % photos.length], photos[(index + 2) % photos.length]]
      : photos.length === 2
        ? [photos[(index + 1) % photos.length]]
        : [];
  // Thẻ ghi chú — MỖI CẢNH MỘT BỘ THAM SỐ RIÊNG (đo từ video Pikbest
  // 10077037, 2026-11-12): collage → thẻ nhỏ ở giữa, nghiêng −2°; ảnh
  // đơn → thẻ lớn tràn sát mép, trái/phải xen kẽ theo LẦN ẢNH ĐƠN
  // (không theo chẵn/lẻ của index — vì bố cục đã xen kẽ chẵn/lẻ nên
  // thẻ ảnh đơn trước đây lúc nào cũng bên trái), nghiêng −4° (trái) /
  // +3° (phải). Bóng đổ đậm + lệch chéo theo hướng nghiêng (thẻ bay
  // trên mặt ảnh), không phải bóng mờ thẳng đứng.
  const wideOrdinal = Math.floor(index / 2);
  const cardSpec =
    layout === "collage"
      ? {
          side: "center" as const,
          tilt: -2,
          width: "w-[min(68vw,340px)]",
          shadow:
            "shadow-[0_18px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.10)]",
          enterDir: -1 as const,
        }
      : wideOrdinal % 2 === 0
        ? {
            side: "left" as const,
            tilt: -4,
            width: "w-[min(82vw,420px)]",
            shadow:
              "shadow-[-12px_20px_32px_rgba(0,0,0,0.28),0_4px_12px_rgba(0,0,0,0.10)]",
            enterDir: -1 as const,
          }
        : {
            side: "right" as const,
            tilt: 3,
            width: "w-[min(82vw,420px)]",
            shadow:
              "shadow-[12px_20px_32px_rgba(0,0,0,0.28),0_4px_12px_rgba(0,0,0,0.10)]",
            enterDir: 1 as const,
          };

  // Cách đổi cảnh THAY ĐỔI theo từng lần đổi (đo từ video 2026-11-12):
  // lần 1 quét vào (8,5s), lần 2 mờ qua trắng (11s), lần 3 mờ dần
  // (25,7s)… — không giống hệt nhau. Xoay vòng 3 kiểu theo cảnh đích:
  // sweep (quét ngang) → fade-white (mờ qua trắng) → dissolve (mờ dần).
  const TRANSITION_CYCLE = ["dissolve", "sweep", "fade-white"] as const;
  type WarmTransition = (typeof TRANSITION_CYCLE)[number];
  const transitionVariant: WarmTransition = TRANSITION_CYCLE[index % 3];
  // Hướng quét xen kẽ theo lần quét (trái → phải → trái…).
  const sweepDir: 1 | -1 = index % 2 === 1 ? -1 : 1;
  // Hướng lia đổi xen kẽ theo cảnh (chẵn lia phải, lẻ lia trái) cho đỡ
  // đơn điệu — như mẫu lia đổi hướng qua các cảnh.
  const panSign: 1 | -1 = index % 2 === 0 ? 1 : -1;

  const advance = () => {
    if (photos.length > 1) {
      setEverAdvanced(true);
      setIndex((i) => (i + 1) % photos.length);
    }
  };

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "mt-1 block font-display text-2xl font-bold leading-tight sm:text-3xl"
      : kind === "phrase"
        ? "mt-1 block font-display text-2xl font-bold italic leading-tight sm:text-3xl"
        : kind === "date"
          ? "mt-2 block text-sm"
          : "mt-1 block text-xs";
  const lineColor = (kind: SlideshowLine["kind"]) =>
    kind === "date" || kind === "venue" ? INK_MUTED : INK;

  const renderLines = (keyPrefix: string) => (
    <AnimatePresence>
      <div key={`${keyPrefix}-${photos.length === 0 ? "empty" : index}`} className="text-center">
        {currentLines.map((line) =>
          textEffect === "sand" ? (
            <SandText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: lineColor(line.kind) }}
            />
          ) : textEffect === "paper" ? (
            <PaperText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: lineColor(line.kind) }}
            />
          ) : (
            <WarmShatterText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: lineColor(line.kind) }}
            />
          )
        )}
      </div>
    </AnimatePresence>
  );

  // Thẻ ghi chú tỏ tình — dấu ấn của mẫu: thẻ trắng viền ĐỎ mỏng,
  // nghiêng nhẹ, đè lên góc ảnh; chứa dòng thông tin của cảnh hiện tại
  // + nét cọ đỏ và tim đỏ nhỏ dưới chữ.
  //
  // CHUYỂN ĐỘNG CỦA THẺ (đo từ video 2026-11-12): mỗi lần đổi cảnh, thẻ
  // BAY VÀO từ phía nó sẽ đậu (trái/phải), bắt đầu TO HƠN (~1,18×) +
  // lệch ~70px + xoay thêm ~5° rồi thu về trong 0,7s — như tờ giấy bay
  // vào đặt xuống; trong cảnh, thẻ trôi riêng rất nhẹ (±3px, ±0,5°,
  // 7s, khác nhịp với khung ảnh) nên nhìn như đang nổi trên mặt ảnh.
  // Delay bay vào khớp kiểu đổi cảnh: mờ-qua-trắng thì đợi pha trắng
  // xong (0,45s) mới bay; quét/mờ dần thì bay gần như ngay (0,1s).
  // Giảm chuyển động: thẻ tĩnh, không bay vào, không trôi.
  const noteCard = (extraClass = "") => (
    <motion.div
      key={`card-${index}`}
      className={`relative z-10 ${cardSpec.width} ${extraClass}`}
      initial={
        reduce
          ? false
          : {
              x: cardSpec.enterDir * 70,
              y: 16,
              scale: 1.18,
              rotate: cardSpec.tilt + cardSpec.enterDir * 5,
              opacity: 0,
            }
      }
      animate={{ x: 0, y: 0, scale: 1, rotate: cardSpec.tilt, opacity: 1 }}
      transition={{
        duration: 0.7,
        delay: reduce ? 0 : transitionVariant === "fade-white" ? 0.45 : 0.1,
        ease: "easeOut",
      }}
    >
      <motion.div
        className={`rounded-[3px] border-2 bg-white px-5 py-4 ${cardSpec.shadow}`}
        style={{ borderColor: CARD_RED }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, 3, 0, -3, 0],
                y: [0, -3, 0, 3, 0],
                rotate: [0, 0.5, 0, -0.5, 0],
              }
        }
        transition={
          reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {renderLines("card")}
        <ConfessionFlourish />
      </motion.div>
    </motion.div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: PAPER_BG }}
      onClick={advance}
    >
      {/* Ảnh mờ nhạt sau toàn cảnh — chính ảnh đang hiện, rất nhạt
          (như mẫu: ảnh mờ phóng to làm nền sau khung). */}
      {currentPhoto && (
        <img
          src={currentPhoto}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.10]"
        />
      )}

      {/* Đường kẻ chéo mảnh xuyên khung (như trong mẫu). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute left-[-25%] top-[24%] h-px w-[150%] rotate-[-32deg] bg-gradient-to-r from-transparent via-[#8a7a72]/40 to-transparent" />
        <div className="absolute left-[-25%] top-[72%] h-px w-[150%] rotate-[-32deg] bg-gradient-to-r from-transparent via-[#8a7a72]/25 to-transparent" />
      </div>

      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Dòng mời — giữ như slideshow Polaroid. */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-7 text-center text-xs uppercase tracking-[0.35em]"
        style={{ color: INK_MUTED }}
      >
        {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
      </motion.p>

      {/* Vùng cảnh: ảnh + thẻ ghi chú. Cách đổi cảnh XOAY VÒNG 3 kiểu
          theo cảnh đích (sweep → fade-white → dissolve, đo từ video) —
          xem WarmSceneTransition; lớp trắng chỉ có ở kiểu fade-white
          nên cả cú nhảy chiều cao (rộng ↔ collage) cũng được giấu
          trong pha trắng ở kiểu đó, còn kiểu sweep/dissolve giấu bằng
          chính chuyển động mờ/trượt. Giảm chuyển động: đổi cảnh tức thì. */}
      <WarmSceneTransition
        variant={transitionVariant}
        sweepDir={sweepDir}
        sceneKey={photos.length === 0 ? "empty" : index}
        reduce={!!reduce}
        active={everAdvanced}
      >
            {photos.length === 0 ? (
              /* Không có ảnh: chỉ thẻ ghi chú với đủ dòng chính trên nền kem. */
              <div className="flex justify-center">{noteCard()}</div>
            ) : layout === "wide" ? (
              /* Ảnh đơn RỘNG: khung trắng ngang 16:10 nghiêng nhẹ, thẻ ghi
                 chú đè lên góc dưới (trái/phải xen kẽ theo cảnh). */
              <div>
                <PhotoFrame
                  src={currentPhoto}
                  className="mx-auto w-[min(92vw,640px)]"
                  aspect="aspect-[16/10]"
                  tilt={index % 2 === 0 ? 1.5 : -1.5}
                  photoMotion
                  panSign={panSign}
                  reduce={!!reduce}
                />
                <div
                  className={`-mt-10 flex ${cardSpec.side === "left" ? "justify-start" : "justify-end"} px-2`}
                >
                  {noteCard()}
                </div>
              </div>
            ) : (
              /* COLLAGE: desktop — 2 nhỏ xếp chồng trái + 1 lớn phải (3 ảnh)
                 hoặc 1 lớn + 1 nhỏ song song (2 ảnh); mobile — ảnh lớn trên,
                 ảnh nhỏ xếp hàng dưới. Thẻ ghi chú đè giữa, ngay dưới chỗ
                 giao nhau của các khung. */
              <div>
                <ClusterDrift panSign={panSign} reduce={!!reduce}>
                <div
                  className={`grid grid-cols-1 gap-3 ${
                    collageSmalls.length === 2 ? "sm:grid-cols-5" : "sm:grid-cols-2"
                  }`}
                >
                  <div
                    className={`order-first ${
                      collageSmalls.length === 2 ? "sm:order-none sm:col-span-3" : "sm:order-none sm:col-span-1"
                    }`}
                  >
                    <PhotoFrame
                      src={currentPhoto}
                      className="h-full w-full"
                      aspect={collageSmalls.length === 2 ? "aspect-[16/10] sm:aspect-auto sm:h-full" : "aspect-[16/10]"}
                      tilt={0}
                      photoMotion
                      panSign={panSign}
                      reduce={!!reduce}
                    />
                  </div>
                  <div
                    className={`grid gap-3 ${
                      collageSmalls.length === 2
                        ? "grid-cols-2 sm:col-span-2 sm:grid-cols-1"
                        : "grid-cols-1 sm:col-span-1"
                    }`}
                  >
                    {collageSmalls.map((src, i) => (
                      <PhotoFrame
                        key={src}
                        src={src}
                        className="w-full"
                        aspect="aspect-[16/10]"
                        tilt={i === 0 ? -2 : 2}
                        reduce={!!reduce}
                      />
                    ))}
                  </div>
                </div>
                </ClusterDrift>
                <div className="-mt-10 flex justify-center px-2">{noteCard()}</div>
              </div>
            )}
      </WarmSceneTransition>

      {/* Chấm trang — chỉ khi có nhiều ảnh. */}
      {photos.length > 1 && (
        <div className="relative z-10 mt-2 flex justify-center gap-2" aria-hidden="true">
          {photos.map((p, i) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 opacity-50"}`}
              style={{ background: INK }}
            />
          ))}
        </div>
      )}

      {/* Nút vào thiệp — như slideshow Polaroid. */}
      <div className="relative z-20 flex justify-center pb-8 pt-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
          className="open-pulse rounded-full px-10 py-3.5 font-semibold text-white shadow-xl"
          style={{ background: tpl.palette.accent }}
          aria-label="Xem thiệp cưới"
        >
          Xem thiệp
        </button>
      </div>
    </div>
  );
}
