// Bộ sưu tập kiểu BROCHURE LÃNG MẠN — kiểu slide ảnh riêng trong thư
// viện (id "romantic-brochure", mẫu Pikbest 10085011 "Romantic Confession
// Valentine's Day Wedding Brochure", PR template; làm 2026-11-10).
//
// Ngôn ngữ của mẫu: trang brochure chia đôi — ảnh tràn một bên, panel
// giấy kem ấm một bên với trái tim nhỏ + thẻ chữ trắng viền vàng mảnh;
// ảnh cắt thành hình trái tim (dấu ấn chính); ảnh cưới hiện rất mờ sau
// panel chữ; vài đường kẻ chéo mảnh chạy xuyên khung; tông sáng, ấm,
// trang nhã (kem — trắng — vàng nhạt). Chữ là tiêu đề + đoạn chữ kiểu
// brochure, hiện sau ảnh, đứng yên để đọc (không bay nhảy).
//
// KHÁC slideshow Polaroid mặc định: không có chồng Polaroid nghiêng,
// không nền màu cảnh/blur; chữ tối trên nền kem sáng (thay vì chữ trắng
// trên nền tối). Chạy được với 1 ảnh (trái tim lớn + thẻ chữ dùng cùng
// ảnh); nhiều ảnh thì bố cục xen kẽ theo chỉ số cảnh (chẵn: ảnh tràn +
// panel; lẻ: trái tim lớn + thẻ chữ). Nhịp theo chuẩn app: mỗi ảnh giữ
// 12 giây (PHOTO_MS), không bê nhịp nhanh của video gốc.
//
// Tái dùng đồ sẵn có: getSlideshowSlides (chia dòng theo số ảnh như
// scrapbook), hiệu ứng chữ SandText/PaperText, KenBurns, AmbientLayer
// (lớp phủ theo biến thể — chỉ dùng, không sửa). Hiệu ứng scatter dùng
// bản sao ShatterText tại chỗ (component gốc nằm trong IntroSlideshow,
// không export) với cùng nhịp đáp chung (TEXT_PACE_*).

"use client";

import { Fragment, useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer, KenBurns } from "@/components/effects";
import { DriftRest, DriftSurge } from "@/components/effects/Drift";
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

/** Giấy kem ấm của mẫu brochure. */
const PAPER_BG = "#f6f1e8";
/** Màu chữ chính trên giấy kem. */
const INK = "#5a1f2b";
/** Màu chữ phụ trên giấy kem. */
const INK_MUTED = "rgba(90,31,43,0.72)";
/** Vàng viền thẻ chữ. */
const GOLD = "#c9a86a";

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (copy từ ShatterText trong IntroSlideshow để scatter nhìn giống). */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Scatter & Reform tại chỗ (như ShatterText trong IntroSlideshow):
 *  từng chữ cái bay về ghép lại thành chữ lúc vào, vỡ vụn bay đi lúc
 *  ra — cùng nhịp đáp chung (textPaceStartAt, TEXT_PACE_DUR_S). */
function BrochureShatterText({
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

/** Đường trái tim (viewBox 0 0 100 100) dùng cho clipPath SVG. */
const HEART_PATH =
  "M50 88 C20 65 5 45 5 28 C5 14 16 5 28 5 C38 5 46 11 50 18 C54 11 62 5 72 5 C84 5 95 14 95 28 C95 45 80 65 50 88 Z";

export function RomanticBrochureSlideshow({
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
  const heartId = useId();

  const photos = useMemo(
    () => Array.from(new Set(photosProp ?? [data.photoUrl])).filter(Boolean),
    [photosProp, data.photoUrl]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % photos.length), PHOTO_MS);
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
  // Trái tim nhỏ trong panel: ảnh kế tiếp (nhiều ảnh) hoặc cùng ảnh (1 ảnh).
  const nextPhoto = photos.length > 1 ? photos[(index + 1) % photos.length] : currentPhoto;

  // Bố cục xen kẽ theo cảnh: 1 ảnh → luôn trái tim lớn (dấu ấn của mẫu);
  // nhiều ảnh → chẵn: ảnh tràn + panel, lẻ: trái tim lớn + thẻ chữ.
  const layout: "split" | "heart" = photos.length > 1 && index % 2 === 0 ? "split" : "heart";

  const advance = () => {
    if (photos.length > 1) setIndex((i) => (i + 1) % photos.length);
  };

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "mt-2 block font-display text-3xl font-bold leading-tight sm:text-4xl"
      : kind === "phrase"
        ? "mt-2 block font-display text-3xl font-bold italic leading-tight sm:text-4xl"
        : kind === "date"
          ? "mt-2 block text-base"
          : "mt-1 block text-sm";
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
            <BrochureShatterText
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

  // Thẻ chữ trắng viền vàng mảnh (kiểu brochure trong mẫu).
  const textCard = (extraClass = "") => (
    <div
      className={`rounded-md border bg-white/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${extraClass}`}
      style={{ borderColor: `${GOLD}99` }}
    >
      {renderLines("card")}
    </div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: PAPER_BG }}
      onClick={advance}
    >
      {/* clipPath trái tim (id riêng từng instance để không đụng nhau). */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <clipPath id={heartId} clipPathUnits="objectBoundingBox">
            <path d={HEART_PATH} transform="scale(0.01,0.01)" />
          </clipPath>
        </defs>
      </svg>

      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Đường kẻ chéo mảnh xuyên khung (như vệt sáng xước trong mẫu). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute left-[-25%] top-[28%] h-px w-[150%] rotate-[-32deg] bg-gradient-to-r from-transparent via-[#c9a86a]/50 to-transparent" />
        <div className="absolute left-[-25%] top-[68%] h-px w-[150%] rotate-[-32deg] bg-gradient-to-r from-transparent via-[#c9a86a]/30 to-transparent" />
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

      {layout === "split" ? (
        /* Bố cục chia đôi: ảnh tràn bên trái, panel kem bên phải với trái
           tim nhỏ + thẻ chữ. Mobile xếp dọc (ảnh trên, panel dưới).
           DRIFT V2: DriftRest bọc NGOÀI CẢ CỘT ẢNH nên toàn bộ ảnh tràn
           trôi + zoom cùng nhau, không còn ảnh trượt trong khung đứng yên. */
        <div className="relative z-10 flex flex-1 flex-col sm:flex-row">
          <DriftRest disabled={!!reduce} className="relative min-h-[46dvh] flex-1 overflow-hidden">
            {currentPhoto && (
              <AnimatePresence>
                <motion.div
                  key={currentPhoto}
                  data-testid="romantic-photo-frame"
                  className="absolute inset-0"
                  // DRIFT lúc chuyển (nguyên tắc chuyển ảnh, Nancy
                  // 2026-11-11): ảnh mới trôi về phía người xem —
                  // bắt đầu to hơn 5% + lệch xuống 8px rồi lùi về
                  // cỡ thật trong 0,9s, cùng lúc với mờ vào.
                  initial={{ opacity: 0, scale: 1.05, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                >
                  <KenBurns duration={6} scale={1.06} direction="in" disabled={!!reduce}>
                    <img
                      src={currentPhoto}
                      alt=""
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </KenBurns>
                </motion.div>
              </AnimatePresence>
            )}
          </DriftRest>
          <div className="relative flex flex-col items-center justify-center gap-4 px-6 py-8 sm:w-[45%]">
            {/* Ảnh mờ sau chữ — chính ảnh đang hiện, rất nhạt. */}
            {currentPhoto && (
              <img
                src={currentPhoto}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.18]"
              />
            )}
            {/* Trái tim nhỏ: ảnh kế tiếp — DRIFT V2: DriftRest bọc NGOÀI
                cả hình tim (khung cắt + ảnh trôi cùng nhau). */}
            {nextPhoto && (
              <DriftRest disabled={!!reduce} className="relative h-28 w-32 shrink-0">
              <div
                className="relative h-full w-full overflow-hidden"
                style={{ clipPath: `url(#${heartId})` }}
              >
                <img
                  src={nextPhoto}
                  alt=""
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              </DriftRest>
            )}
            <div className="relative w-full max-w-sm">{textCard()}</div>
          </div>
        </div>
      ) : (
        /* Bố cục trái tim lớn: trái tim ảnh trên nền kem + thẻ chữ bên
           dưới; ảnh mờ sau thẻ chữ. */
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
          {currentPhoto && (
            <>
              <img
                src={currentPhoto}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]"
              />
              {/* DRIFT V2: DriftRest bọc NGOÀI DriftSurge nên cả hình tim
                  (khung cắt + ảnh) trôi + zoom cùng nhau lúc nghỉ. */}
              <DriftRest disabled={!!reduce} className="relative h-[38dvh] w-[min(76vw,360px)] shrink-0">
              <DriftSurge
                sceneKey={currentPhoto}
                offset={{ scale: 1.05, y: 8 }}
                durationS={0.9}
                disabled={!!reduce}
                className="relative h-full w-full"
              >
              <div
                data-testid="photo-frame"
                className="relative h-full w-full overflow-hidden"
                style={{ clipPath: `url(#${heartId})` }}
              >
                <KenBurns duration={6} scale={1.06} direction="in" disabled={!!reduce}>
                  <img
                    src={currentPhoto}
                    alt=""
                    loading="eager"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </KenBurns>
              </div>
              </DriftSurge>
              </DriftRest>
            </>
          )}
          <div className="relative w-full max-w-md">{textCard()}</div>
        </div>
      )}

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
