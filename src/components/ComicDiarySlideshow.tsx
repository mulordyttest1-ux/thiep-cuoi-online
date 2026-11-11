// Bộ sưu tập kiểu NHẬT KÝ TRUYỆN TRANH — kiểu slide ảnh riêng trong
// thư viện (id "comic-diary", mẫu Pikbest 10082742 "Creative Comic
// Diary Wedding Confession Photo Brochure", AE template; làm 2026-11-11).
//
// Ngôn ngữ của mẫu (đã phân tích ở research_notes/pikbest-10082742-
// comic-diary/report.md — xem lại 2 khung f_02.jpg, f_11.jpg để đối
// chiếu): một TRANG truyện tranh, không phải ảnh đơn — mỗi đoạn hiện
// 2–4 panel ảnh cùng lúc, viền dày đen/đỏ sẫm, hơi nghiêng; chữ nằm
// trên MIẾNG GIẤY VÀNG (sticky note) viền đen mỏng hơi nghiêng, pop-in
// (KHÔNG bong bóng thoại); ảnh xử lý kiểu in truyện tranh (posterize
// nhẹ, tông ấm hồng-đỏ, vignette, vệt chéo halftone); doodle vẽ tay
// (trái tim đỏ phẳng, tia lấp lánh); màn kết nền đỏ vân giấy + chữ thư
// pháp lớn "Chúng mình cưới nhau rồi!" (nét chữ lấp đầy bằng mảnh ảnh
// rồi chuyển trắng đặc).
//
// NHỊP CHẬM THEO CHUẨN APP (không bê nhịp gốc): video gốc nhanh
// (12,7s chứa ~8 ảnh + 4 câu + màn kết, mỗi ghi chú ~2,5s); bản này
// mỗi TRANG giữ 12 giây (PHOTO_MS) như slideshow Polaroid, chữ dùng
// hiệu ứng chữ sẵn có (sand/paper/scatter) với nhịp đáp chung
// TEXT_PACE_*.
//
// CHUYỂN TRANG LẬT NHƯ LẬT TRANG SÁCH/PDF (đã đối chiếu khung f_03
// lúc đổi trang ~6,0s — trang cũ PEEL/BONG theo đường chéo từ góc
// trên-trái, lộ trang mới bên dưới; tim outline + chữ "love" nằm
// giữa lúc lật): trang cũ xoay 3D quanh mép trái (rotateY 0 → −170°,
// perspective 1100, nghiêng chéo −6° như đường peel trong video),
// bóng nếp gấp tối dần ở mép lật, mặt sau mờ dần khi lật quá 90°;
// trang mới nằm SẴN BÊN DƯỚI, đứng yên, lộ dần ra — không trượt vào
// từ bên cạnh. Tổng 0,9s, easeInOut (chậm ở đầu/cuối như lật giấy
// thật). Panel của trang mới stagger vào lúc lật xong (0,05/0,17/
// 0,29s — trang mới trong f_05 đã đầy đủ panel ngay khi lật xong).
// Camera LIA NHẸ liên tục (zoom chậm + lia ngang, không bao giờ
// đứng yên); màn kết: nền đỏ TRÀN VÀO từ trái sau cú quét tim (wipe
// clip-path 0,9s, không cắt cứng nền), chữ thư pháp hiện lên với nét
// chữ LẤP ĐẦY BẰNG MẢNH ẢNH rồi chuyển trắng đặc sau 0,7s.
//
// CẤU TRÚC CẢNH: ảnh chia thành các trang, mỗi trang tối đa 3 panel
// (1 ảnh = 1 panel lớn + ghi chú; 2 ảnh = 2 panel ngang; 3 ảnh = 1
// panel lớn + 2 panel nhỏ); sau trang cuối là MÀN KẾT đỏ. Ghi chú vàng
// trên mỗi trang hiện các dòng thông tin của (các) ảnh trong trang đó
// (chia theo getSlideshowSlides như scrapbook: Tên → Ngày → Địa điểm
// → slogan). Chỉ phát huy khi thiệp có ≥3 ảnh — thiệp 1 ảnh chỉ hiện
// 1 panel + ghi chú + màn kết (đã ghi rõ trong báo cáo QA).
//
// Tái dùng đồ sẵn có: getSlideshowSlides, SandText/PaperText, KenBurns,
// AmbientLayer (lớp phủ theo biến thể — chỉ dùng, không sửa). Hiệu ứng
// scatter dùng bản sao ShatterText tại chỗ (component gốc nằm trong
// IntroSlideshow, không export) với cùng nhịp đáp chung.

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer, KenBurns } from "@/components/effects";
import { FinaleWipe, PageFlip } from "@/components/transitions";
import { SandText } from "@/components/SandText";
import { PaperText } from "@/components/PaperText";
import {
  getSlideshowSlides,
  TEXT_PACE_DUR_S,
  textPaceStartAt,
  type SlideshowLine,
  type TextEffectId,
} from "@/lib/intro";

const PHOTO_MS = 12000; // mỗi trang giữ ~12s rồi sang trang sau (chuẩn app)

/** Giấy kem của trang truyện tranh. */
const PAPER_BG = "#fdf8f1";
/** Mực đen — viền panel + chữ trong ghi chú. */
const INK = "#1a1a1a";
/** Đỏ sẫm — viền panel xen kẽ + chấm trang + màn kết. */
const DARK_RED = "#7a1f2b";
/** Vàng giấy ghi chú. */
const NOTE_YELLOW = "#ffeb3b";

/** Số panel tối đa trên một trang truyện tranh (theo mẫu: 2–4 panel). */
const PANELS_PER_PAGE = 3;

/** Góc nghiêng xác định cho từng panel (ổn định giữa các lần render). */
const PANEL_ROTATES = [-2.5, 2, -1.5, 3, -3, 1.5];

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (copy từ ShatterText trong IntroSlideshow để scatter nhìn giống). */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Scatter & Reform tại chỗ (như ShatterText trong IntroSlideshow):
 *  từng chữ cái bay về ghép lại thành chữ lúc vào, vỡ vụn bay đi lúc
 *  ra — cùng nhịp đáp chung (textPaceStartAt, TEXT_PACE_DUR_S). */
function ComicShatterText({
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

/** Đường trái tim vẽ tay (viewBox 0 0 100 100) — doodle đỏ phẳng. */
const HEART_PATH =
  "M50 88 C20 65 5 45 5 28 C5 14 16 5 28 5 C38 5 46 11 50 18 C54 11 62 5 72 5 C84 5 95 14 95 28 C95 45 80 65 50 88 Z";

/** Trái tim đỏ phẳng kiểu vẽ tay + tia lấp lánh nhỏ (doodle trong mẫu). */
function HeartDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d={HEART_PATH} fill="#e63946" />
      <path
        d="M28 30 C24 34 22 40 24 46"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Panel TRƯỢT VÀO theo hướng riêng + stagger — như mẫu: mỗi panel
 *  vào từ một hướng khác nhau theo nhịp (lớn từ trái, nhỏ từ phải/
 *  dưới). Bọc ngoài ComicPanel — góc nghiêng của panel giữ nguyên
 *  bên trong. Ảnh ở trạng thái nghỉ luôn opacity 1; chỉ lúc vào
 *  (0,65s) mới trượt + dissolve — đó là hiệu ứng chuyển. */
function PanelEnter({
  from,
  delay,
  reduce,
  children,
}: {
  from: "left" | "right" | "bottom";
  delay: number;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const offset =
    from === "left" ? { x: -70, y: 0 } : from === "right" ? { x: 70, y: 0 } : { x: 0, y: 60 };
  return (
    <motion.div
      className="h-full w-full"
      initial={
        reduce
          ? false
          : { opacity: 0, ...offset, rotate: from === "left" ? -3 : from === "right" ? 3 : 0 }
      }
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Máy quay LIA NHẸ qua trang trong suốt 12s — như mẫu: camera không
 *  bao giờ đứng yên (zoom chậm + lia ngang). Chỉ chạy lúc nghỉ; lúc
 *  chuyển trang thì transform của trang cha lo. */
function PageDrift({ reduce, children }: { reduce: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      className="flex w-full flex-col items-center justify-center gap-6"
      initial={false}
      animate={reduce ? { scale: 1, x: 0 } : { scale: [1, 1.05], x: [0, -10] }}
      transition={reduce ? { duration: 0 } : { duration: 12, ease: "linear" }}
    >
      {children}
    </motion.div>
  );
}

/** Một panel ảnh kiểu truyện tranh: viền dày, hơi nghiêng, ảnh
 *  posterize nhẹ + tông ấm hồng-đỏ + halftone + vignette. */
function ComicPanel({
  src,
  index,
  ratioClass,
  reduce,
}: {
  src: string;
  /** Chỉ số panel toàn cục — quyết định góc nghiêng + màu viền. */
  index: number;
  ratioClass: string;
  reduce: boolean;
}) {
  const rotate = PANEL_ROTATES[index % PANEL_ROTATES.length];
  const borderColor = index % 3 === 1 ? DARK_RED : INK;
  return (
    <div
      data-testid="comic-panel"
      className={`relative overflow-hidden ${ratioClass} border-[3px] bg-white shadow-[5px_5px_0_rgba(0,0,0,0.85)]`}
      style={{ transform: `rotate(${rotate}deg)`, borderColor }}
    >
      <KenBurns duration={6} scale={1.06} direction="in" disabled={reduce}>
        <img
          src={src}
          alt=""
          loading="eager"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          style={{ filter: "contrast(1.12) saturate(1.18) sepia(0.06)" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </KenBurns>
      {/* Tông ấm hồng-đỏ phủ lên ảnh (kiểu in truyện tranh). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#ff5a5a]/10 mix-blend-multiply" />
      {/* Lớp chấm halftone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.16) 1px, transparent 1.3px)",
          backgroundSize: "7px 7px",
        }}
      />
      {/* Vignette — viền tối quanh ảnh. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)" }}
      />
    </div>
  );
}

export function ComicDiarySlideshow({
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

  // Chia ảnh thành các trang, mỗi trang tối đa 3 panel; 0 ảnh = 1 trang
  // trống (chỉ ghi chú). Sau trang cuối là màn kết đỏ.
  const pages = useMemo<string[][]>(() => {
    if (photos.length === 0) return [[]];
    const out: string[][] = [];
    for (let i = 0; i < photos.length; i += PANELS_PER_PAGE) {
      out.push(photos.slice(i, i + PANELS_PER_PAGE));
    }
    return out;
  }, [photos]);
  const sceneCount = pages.length + 1; // + màn kết
  const finaleIndex = pages.length;
  const [index, setIndex] = useState(0);
  // Đã lật trang lần nào chưa — bóng trên trang mới lộ ra chỉ chạy từ
  // lần lật đầu tiên (tránh nháy tối lúc mới mở thiệp).
  const [hasFlipped, setHasFlipped] = useState(false);

  useEffect(() => {
    if (reduce || sceneCount <= 1) return;
    const t = window.setInterval(() => {
      setHasFlipped(true);
      setIndex((i) => (i + 1) % sceneCount);
    }, PHOTO_MS);
    return () => window.clearInterval(t);
  }, [reduce, sceneCount]);

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
  // Ghi chú trên mỗi trang = các dòng của (các) ảnh trong trang đó.
  const pageLines = useMemo<SlideshowLine[][]>(() => {
    if (photos.length === 0) return [allCoreLines];
    const seen = new Set<string>();
    return pages.map((page, pi) => {
      const lines: SlideshowLine[] = [];
      page.forEach((_, k) => {
        const photoIdx = pi * PANELS_PER_PAGE + k;
        (slides[photoIdx] ?? []).forEach((line) => {
          if (!seen.has(line.text)) {
            seen.add(line.text);
            lines.push(line);
          }
        });
      });
      return lines;
    });
  }, [pages, photos.length, slides, allCoreLines]);

  const isFinale = index === finaleIndex;
  const currentLines = isFinale ? [] : (pageLines[index] ?? []);
  const currentPage = isFinale ? [] : pages[index];
  const firstPhoto = photos[0];

  const advance = () => {
    if (sceneCount > 1) {
      setHasFlipped(true);
      setIndex((i) => (i + 1) % sceneCount);
    }
  };

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "block font-display text-2xl font-bold leading-tight sm:text-3xl"
      : kind === "phrase"
        ? "block font-display text-2xl font-bold italic leading-tight"
        : kind === "date"
          ? "mt-1 block text-base font-semibold"
          : "mt-0.5 block text-sm";

  const renderLines = (keyPrefix: string) => (
    <AnimatePresence>
      <div key={`${keyPrefix}-${index}`} className="text-center" style={{ color: INK }}>
        {currentLines.map((line) =>
          textEffect === "sand" ? (
            <SandText
              key={line.text}
              text={line.text}
              slideKey={index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
            />
          ) : textEffect === "paper" ? (
            <PaperText
              key={line.text}
              text={line.text}
              slideKey={index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
            />
          ) : (
            <ComicShatterText
              key={line.text}
              text={line.text}
              slideKey={index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
            />
          )
        )}
      </div>
    </AnimatePresence>
  );

  // Ghi chú vàng — pop-in, hơi nghiêng, viền đen mỏng, chữ đen.
  // Mobile: ghi chú lên TRƯỚC panel (order-1) để tên cặp đôi thấy ngay
  // không cần cuộn — trang 3 panel trên điện thoại dài hơn màn hình;
  // desktop: ghi chú dưới panel như trang truyện tranh (order-2).
  const note = (
    <motion.div
      data-testid="comic-note"
      className="relative z-10 order-1 mx-auto w-full max-w-sm border-[1.5px] px-5 py-4 shadow-[4px_4px_0_rgba(0,0,0,0.8)] sm:order-2"
      style={{ background: NOTE_YELLOW, borderColor: INK }}
      initial={reduce ? false : { scale: 0.8, rotate: -6, opacity: 0 }}
      animate={{ scale: 1, rotate: -2, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.55 }}
    >
      {/* Miếng băng dán trên đầu ghi chú. */}
      <div
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-2deg] bg-white/50 shadow-sm"
      />
      {renderLines("note")}
      <HeartDoodle className="absolute -right-4 -top-5 h-9 w-9 rotate-12" />
    </motion.div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{
        // Nền giấy kem luôn — màn đỏ quét vào bằng lớp phủ riêng (không
        // cắt cứng nền lúc sang màn kết).
        background: PAPER_BG,
        // Vân giấy chấm mờ trên nền.
        backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1.4px)",
        backgroundSize: "9px 9px",
      }}
      onClick={advance}
    >
      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Màn đỏ QUÉT VÀO lúc sang màn kết — "MÀN KẾT ĐỎ" trong thư viện
          chuyển cảnh (src/components/transitions/FinaleWipe). */}
      <FinaleWipe active={isFinale} reduce={!!reduce} />

      {/* Dòng mời — giữ như slideshow Polaroid. */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-7 text-center text-xs uppercase tracking-[0.35em]"
        style={{ color: isFinale ? "rgba(255,255,255,0.75)" : "rgba(90,31,43,0.72)" }}
      >
        {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
      </motion.p>

      {/* Trang truyện tranh — "LẬT TRANG" trong thư viện chuyển cảnh
          (src/components/transitions/PageFlip): trang cũ lật 3D quanh
          mép trái như lật trang sách/PDF, trang mới nằm sẵn bên dưới.
          Trang cuộn dọc bên trong khi nội dung cao hơn màn hình (trang
          3 panel trên điện thoại): ghi chú luôn ở đầu trang, không bị
          cắt như khi căn giữa trong khung cố định. */}
      <div className="relative z-10 flex-1">
        <PageFlip pageKey={index} isFinale={isFinale} hasFlipped={hasFlipped} reduce={!!reduce}>
          <div className="mx-auto flex min-h-full w-full flex-col items-center justify-center gap-6 px-5 py-6 sm:px-8">
          {isFinale ? (
            /* MÀN KẾT: nền đỏ vân giấy + chữ thư pháp lớn — nét chữ lấp
               đầy bằng mảnh ảnh rồi chuyển trắng đặc (như f_09 → f_11). */
            <div className="relative flex flex-1 flex-col items-center justify-center">
              {/* Speed-line tỏa ra từ tâm. */}
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
                {[-55, -28, 0, 28, 55].map((deg) => (
                  <div
                    key={deg}
                    className="absolute left-[-260px] top-0 h-px w-[520px] bg-white/20"
                    style={{ transform: `rotate(${deg}deg)`, transformOrigin: "center" }}
                  />
                ))}
              </div>
              <div className="relative text-center">
                {firstPhoto && !reduce ? (
                  <div className="relative">
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 block font-display text-[2.6rem] font-bold leading-tight sm:text-6xl"
                      style={{
                        backgroundImage: `url(${firstPhoto})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ delay: 0.7, duration: 0.8 }}
                    >
                      Chúng mình cưới nhau rồi!
                    </motion.span>
                    <motion.span
                      className="relative block font-display text-[2.6rem] font-bold leading-tight text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.35)] sm:text-6xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.8 }}
                    >
                      Chúng mình cưới nhau rồi!
                    </motion.span>
                  </div>
                ) : (
                  <span className="block font-display text-[2.6rem] font-bold leading-tight text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.35)] sm:text-6xl">
                    Chúng mình cưới nhau rồi!
                  </span>
                )}
              </div>
              <motion.div
                className="relative mt-6 flex items-center gap-2"
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                <HeartDoodle className="h-8 w-8" />
                {coupleName && (
                  <span className="text-sm font-semibold tracking-wide text-white/85">{coupleName}</span>
                )}
                <HeartDoodle className="h-8 w-8 -scale-x-100" />
              </motion.div>
            </div>
          ) : (
            <PageDrift reduce={!!reduce}>
              {/* Trang truyện tranh: panel theo số ảnh trong trang —
                  mỗi panel trượt vào từ một hướng khác nhau theo nhịp
                  (stagger 0,12s), như mẫu. */}
              {currentPage.length === 1 ? (
                <div className="order-2 w-full max-w-md sm:order-1">
                  <PanelEnter from="left" delay={0.05} reduce={!!reduce}>
                    <ComicPanel
                      src={currentPage[0]}
                      index={index * PANELS_PER_PAGE}
                      ratioClass="aspect-[4/3]"
                      reduce={!!reduce}
                    />
                  </PanelEnter>
                </div>
              ) : currentPage.length === 2 ? (
                <div className="order-2 grid w-full max-w-2xl grid-cols-1 gap-5 sm:order-1 sm:grid-cols-2">
                  {currentPage.map((src, k) => (
                    <PanelEnter
                      key={src}
                      from={k === 0 ? "left" : "right"}
                      delay={0.05 + k * 0.12}
                      reduce={!!reduce}
                    >
                      <ComicPanel
                        src={src}
                        index={index * PANELS_PER_PAGE + k}
                        ratioClass="aspect-[4/3]"
                        reduce={!!reduce}
                      />
                    </PanelEnter>
                  ))}
                </div>
              ) : (
                <div className="order-2 flex w-full max-w-2xl flex-col gap-5 sm:order-1 sm:flex-row">
                  <div className="w-full sm:w-[55%]">
                    <PanelEnter from="left" delay={0.05} reduce={!!reduce}>
                      <ComicPanel
                        src={currentPage[0]}
                        index={index * PANELS_PER_PAGE}
                        // Mobile: panel ngang để trang gọn hơn (panel dọc
                        // 3/4 trên điện thoại cao quá, đẩy ghi chú + nút
                        // xuống dưới màn hình); desktop giữ panel dọc.
                        ratioClass="aspect-[4/3] sm:aspect-[3/4]"
                        reduce={!!reduce}
                      />
                    </PanelEnter>
                  </div>
                  <div className="flex w-full flex-col gap-5 sm:w-[45%]">
                    {currentPage.slice(1).map((src, k) => (
                      <PanelEnter
                        key={src}
                        from={k === 0 ? "right" : "bottom"}
                        delay={0.17 + k * 0.12}
                        reduce={!!reduce}
                      >
                        <ComicPanel
                          src={src}
                          index={index * PANELS_PER_PAGE + 1 + k}
                          ratioClass="aspect-[4/3] sm:aspect-[16/10]"
                          reduce={!!reduce}
                        />
                      </PanelEnter>
                    ))}
                  </div>
                </div>
              )}
              {note}
            </PageDrift>
          )}
          </div>
        </PageFlip>
      </div>

      {/* Chấm trang — chỉ khi có nhiều cảnh. */}
      {sceneCount > 1 && (
        <div className="relative z-10 mt-2 flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: sceneCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 opacity-50"}`}
              style={{ background: isFinale ? "#ffffff" : DARK_RED }}
            />
          ))}
        </div>
      )}

      {/* Nút vào thiệp — như slideshow Polaroid. */}
      <div className="relative z-20 flex justify-center pb-8 pt-5">
        <button
          type="button"
          data-testid="comic-enter"
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
