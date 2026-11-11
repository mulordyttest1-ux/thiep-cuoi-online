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
 *  trong 0,8s đầu. Khi hết hành trình chính, ảnh dao động nhẹ vô hạn
 *  (scale ±0,8%, x/y ±3px, xoay ±0,5°, chu kỳ 6s — drift nghỉ chuẩn
 *  DRIFT_REST, nguyên tắc chuyển ảnh 2026-11-11) — nhẹ tới mức gần
 *  như không nhận ra nếu không nhìn kỹ, nhưng ảnh luôn "sống". Lúc
 *  đổi cảnh, ảnh mới trôi về phía người xem (scale 1,05 → 1 + trôi
 *  lên 8px trong 0,8s, khớp pha mờ qua trắng). */
const PHOTO_ZOOM = 1.1; // zoom 1,00 → 1,10 trong 12s
const PAN_X = 12; // lia ngang ±12px (đổi hướng theo cảnh)
const PAN_Y = 2; // lia dọc ∓2px
const WIGGLE_S = 6; // chu kỳ drift nghỉ 6s (chuẩn drift chung DRIFT_REST)
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
 *  trong 12s + lia ±12px, đổi hướng theo panSign) + DRIFT NGHỈ vô hạn
 *  khi dừng (dao động ±3px + xoay ±0,5°, chu kỳ 6s — đúng chuẩn drift
 *  chung DRIFT_REST, chỉnh từ nhúc nhích cũ ±2px/5s) + DRIFT CHUYỂN
 *  lúc đổi cảnh (trôi về phía người xem: scale 1,05 → 1 + trôi lên
 *  8px trong 0,8s, khớp pha mờ qua trắng — nguyên tắc chuyển ảnh,
 *  Nancy 2026-11-11). Chuyển động chính đặt TRỰC TIẾP lên <img>
 *  (motion.img — bài học QA19: đặt lên div bọc thì mắt thấy ảnh đứng
 *  yên); lớp drift nghỉ là DriftRest bọc ngoài khung; cú trôi chuyển
 *  là DriftSurge bọc trong, key theo ảnh. Giảm chuyển động: ảnh tĩnh
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
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-[3px] bg-white p-2 shadow-[0_12px_35px_rgba(0,0,0,0.18)] ${className}`}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <DriftRest disabled={reduce}>
      <div className={`relative w-full overflow-hidden rounded-[2px] ${aspect}`}>
        {photoMotion && !reduce ? (
          <motion.div
            data-testid="warm-photo-wiggle"
            className="h-full w-full will-change-transform"
            animate={{
              scale: [1, 1.008, 1],
              x: [0, 3, 0, -3, 0],
              y: [0, -2, 0, 2, 0],
              rotate: [0, 0.5, 0, -0.5, 0],
            }}
            transition={{ duration: WIGGLE_S, repeat: Infinity, ease: "easeInOut" }}
          >
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
          </motion.div>
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
      </DriftRest>
    </div>
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

export function WarmConfessionSlideshow({
  data,
  fx,
  blurred,
  guestName,
  onEnter,
  photos: photosProp,
  textEffect = "sand",
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
  /** Hiệu ứng chữ — "sand" (mặc định), "scatter", "paper" (nhịp chung
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
  // Thẻ ghi chú đè góc trái/phải xen kẽ theo cảnh; nghiêng ngược phía.
  const cardSide = index % 2 === 0 ? "left" : "right";
  const cardTilt = cardSide === "left" ? -2.5 : 2.5;
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
  const noteCard = (extraClass = "") => (
    <div
      className={`relative z-10 w-[min(86vw,400px)] rounded-[3px] border-2 bg-white px-5 py-4 shadow-[0_14px_35px_rgba(0,0,0,0.16)] ${extraClass}`}
      style={{ borderColor: CARD_RED, transform: `rotate(${cardTilt}deg)` }}
    >
      {renderLines("card")}
      <ConfessionFlourish />
    </div>
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

      {/* Vùng cảnh: ảnh + thẻ ghi chú. Đổi cảnh = "MỜ QUA TRẮNG" trong
          thư viện chuyển cảnh (src/components/transitions/
          FadeThroughWhiteScene): cảnh cũ mờ hết về trắng rồi cảnh mới
          mới hiện từ trắng — lớp trắng phủ toàn khung trong lúc chuyển
          nên cả cú nhảy chiều cao (rộng ↔ collage) cũng được giấu
          trong pha trắng. Giảm chuyển động: đổi cảnh tức thì. */}
      <FadeThroughWhiteScene
        sceneKey={photos.length === 0 ? "empty" : index}
        reduce={!!reduce}
        active={everAdvanced}
        wrapperClassName="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6"
        sceneClassName="relative w-full max-w-2xl"
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
                  className={`-mt-10 flex ${cardSide === "left" ? "justify-start" : "justify-end"} px-2`}
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
      </FadeThroughWhiteScene>

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
