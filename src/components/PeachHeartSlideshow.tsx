// Bộ sưu tập kiểu TRÁI TIM ĐÀO — kiểu slide ảnh riêng trong thư viện
// (id "peach-heart", mẫu Pikbest 237637 "Romantic Tanabata Valentine's
// Day Peach Heart Transition Electronic Brochure", AE template).
// TÊN GỌI PHONG CÁCH: "PHA LÊ ĐÀO HOA" — tim pha lê + hoa đào bay +
// tiêu cự điện ảnh.
//
// CẤU TRÚC ĐÚNG VIDEO (so sánh side-by-side 2026-11-11,
// research_notes/pikbest-237637-peach-heart/so-sanh-vs-app-20261111.md).
// Bản cũ "đẹp nhưng không giống" vì khác ở CẤU TRÚC, không phải chi
// tiết hiệu ứng — sửa theo đúng 5 điểm (2026-11-11):
//  1. TIM PHA LÊ ĐẶC KHỔNG LỒ, TRÀN KHUNG: cao ~96dvh, rộng theo tỷ
//     lệ 100/65 (≈1,54, khía nông — như video 1104×715 ở 1280×720),
//     tràn hai bên; lúc nghỉ KHÔNG thấy ảnh trong tim (ảnh chỉ lộ ra
//     khi vỡ, trong cửa sổ hình tim rồi nở ra tràn khung). Tim cũ
//     nhỏ (cao 34%, diện tích 18,1%) + clip ảnh bên trong là sai
//     cấu trúc.
//  2. CHỮ TRẮNG nằm TRÊN tim, mờ vào rồi đứng yên (video); KHÔNG
//     thẻ trắng; cảnh ảnh tràn KHÔNG hiện chữ/thẻ gì.
//  3. CÚ MỞ ĐẦU: tim bắt đầu nhỏ ~30% + mờ mềm, trong ~2s phóng tới
//     ~99% và nét dần (video 0–2s); áp dụng lúc mở mỗi cảnh tim.
//     Lúc lắp ghép tim chưa hiện tới ~1,5s.
//  4. VỠ ~2s (xem ShatterAssemble.tsx): ~135 mảnh TỐI li ti
//     (2–4px) thành dải ĐẶC chéo; KHÔNG mép xé sáng trắng (video
//     không có); 6 tấm pha lê TO (155–200px) mở bung ra; hoa tung
//     nhỏ lại (8–18px).
//  5. LẮP GHÉP ~2,5s: hoa tụ thành MỘT dải cong từ góc dưới-trái về
//     tâm tim; tim lắp muộn (~1,5–2s); nền mờ blur 22px giữ nguyên.
//
// HAI BIẾN THỂ CỠ TIM (chị chốt 2026-11-11 14:33 — "làm 2 kiểu tôi
// xem luôn"): video gốc quay NGANG nên tim vừa to vừa trọn hình;
// điện thoại dựng đứng thì không thể có cả hai.
//  - "giant" (mặc định, id "peach-heart"): tim cao ~96dvh, tràn hai
//    bên, chỉ thấy lát cắt giữa tim (khía lõm trên + mũi nhọn dưới),
//    diện tích ~65% — đúng 5 điểm trên.
//  - "full" (id "peach-heart-full"): tim rộng 92vw (~359px ở 390px),
//    cao ~233px (~28% viewport), thấy TRỌN hình tim nhưng nhỏ hơn
//    hẳn. Giữ nguyên 4 điểm cấu trúc còn lại (tim đặc, chữ trắng
//    trên tim, mở đầu phóng to ~2s, vỡ dải mảnh đặc + lắp dải cong).
//    Chuyển cảnh VỠ/LẮP bám theo hộp tim của từng biến thể (xem
//    ShatterAssemble.tsx — tham số heartVariant).
//
// Các lớp hiệu ứng trong video gốc (đo từ 62 khung mỗi 0,5s + độ nét
// Laplacian, video 30,88s, frames-dense/):
//  1. Tim pha lê (0–31s): tim khổng lồ nhiều mặt cắt, gradient hồng
//     đào→tím, glow — dấu ấn chính. [ĐÃ CÓ, nay ĐẶC + KHỔNG LỒ]
//  2. Camera push-in vào tim (0–5s): tim to dần từ ~30% tới lấp đầy
//     khung trong ~2s. [MỚI: intro scale 0,3→1 trong 2s + mờ 6px→0]
//  3. Tiêu cự MỜ→NÉT lúc mở cảnh (0–5s): độ nét 21→780 — CẢ KHUNG
//     mở đầu mờ mơ rồi nét dần. [MỚI: blur tim 6px→0 trong 2s]
//  4. Tiêu cự NỀN MỜ + TIM NÉT lúc lắp ghép (12–14,5s): độ nét sụp
//     2185→263 rồi leo lại →1013. [ĐÃ CÓ: nền ảnh mờ blur 22px]
//  5. Hoa bay (xuyên suốt, từ ~1,5s): cánh hoa nhỏ hồng/tím/trắng
//     RƠI chậm từ trên xuống, đu đưa, xoay chậm, ~15–25 cánh.
//     [ĐÃ CÓ: 18 cánh RƠI (12 giọt nước + 6 TIM NHỎ)]
//  6. Tim nhỏ bay (6,5s, 19–27s): tim hồng/tím bay lơ lửng. [ĐÃ CÓ]
//  7. Bokeh (9,5s): đốm tròn mềm trắng/hồng/tím. [ĐÃ CÓ: 8 đốm]
//  8. Vệt sáng chéo / mặt cắt pha lê (8s, 19–27s): dải sáng trắng mờ
//     chéo qua khung. [ĐÃ CÓ: quét 1 lần mỗi cảnh, ~4,5s]
//  9. Vignette trắng mềm trên ảnh tràn (8–11s). [ĐÃ CÓ]
// 10. Glow hồng quanh tim. [ĐÃ CÓ]
// 11. Tim phập phồng (thở) 6s. [ĐÃ CÓ]
// 12. VỠ 2,0s + LẮP GHÉP 2,5s — "TUNG HOA XÉ MỞ" / "HOA TỤ VỀ
//     TIM" (xem kỹ từng khung 10fps ở frames-shatter/,
//     frames-assemble/): VỠ = dải mảnh tối ĐẶC quét chéo + 6 tấm lớn
//     mở bung + hoa tung + ảnh lộ trong cửa sổ tim rồi nở tràn khung;
//     LẮP = hoa tụ thành dải cong + dải mảnh bay vào + tấm lớn xếp
//     thành tim + nền mờ.
// 13. Tim nở thành ảnh tràn (14,5→16,5s). [ĐÃ ĐƯỢC BAO BỞI chuyển VỠ]
// 14. Chữ mờ vào trên tim (0–5s). [App dùng hệ chữ riêng
//     (Sand/Paper/scatter) — trắng, trên tim, không thẻ]
// 15. Thẻ kết (19–27s): thẻ kết của video, không phải cảnh
//     slideshow. [KHÔNG LÀM]
//
// Chạy được với 1 ảnh (luôn tim pha lê); nhiều ảnh thì bố cục xen kẽ
// theo chỉ số cảnh (chẵn: tim pha lê ĐẶC + chữ trắng trên tim; lẻ:
// ảnh tràn khung, KHÔNG chữ). Nhịp theo chuẩn app: mỗi ảnh giữ 12
// giây (PHOTO_MS), không bê nhịp nhanh của video gốc.
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
import { ShatterAssembleOverlay } from "@/components/transitions";
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

/** Nền low-poly trắng/bạc sáng của mẫu. */
const PAPER_BG = "#f6f3f7";
/** Màu chữ chính trên nền sáng — mận đậm. */
const INK = "#5e2a52";
/** Màu chữ phụ trên nền sáng. */
const INK_MUTED = "rgba(94,42,82,0.72)";
/** Màu cánh hoa trôi (hồng đào, tím, trắng — như mẫu). */
const PETAL_COLORS = ["#f6c6e8", "#d9a0c8", "#ffffff", "#e8b4e0"];
/** Màu tim nhỏ bay (hồng/tím đậm hơn để đọc được trên nền sáng). */
const HEART_PETAL_COLORS = ["#e88fd0", "#c06fd0", "#f6a8dc", "#b678d8"];

// (Tấm lớn + dải mảnh của chuyển cảnh VỠ/LẮP nằm trong thư viện
//  chuyển cảnh — src/components/transitions/ShatterAssemble.tsx.)

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (copy từ ShatterText trong IntroSlideshow để scatter nhìn giống). */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Scatter & Reform tại chỗ (như ShatterText trong IntroSlideshow):
 *  từng chữ cái bay về ghép lại thành chữ lúc vào, vỡ vụn bay đi lúc
 *  ra — cùng nhịp đáp chung (textPaceStartAt, TEXT_PACE_DUR_S). */
function PeachShatterText({
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

/** Đường trái tim RỘNG, BẸT (viewBox 0 0 100 65, w/h ≈ 1,54, khía
 *  nông) — đúng hình tim video gốc (1104×715 ở 1280×720). Tim video
 *  rộng bẹt, khía nông; tim cũ (HEART_PATH 90×83, w/h 1,09) hẹp +
 *  khía sâu hơn. */
const WIDE_HEART_PATH =
  "M50 62 C25 46 4 33 4 18 C4 8 12 3 21 3 C30 3 38 7 43 12 C45 13 48 13 50 12 C52 13 55 13 57 12 C62 7 70 3 79 3 C88 3 96 8 96 18 C96 33 75 46 50 62 Z";

/** Các tam giác mặt cắt của tim pha lê RỘNG (tọa độ viewBox 0–100
 *  × 0–65) — ÍT, TO, highlight trắng mạnh, lõi sáng (video chỉ có
 *  vài tam giác lớn, không phải 13 tam giác nhỏ nhạt như bản cũ).
 *  Vẽ trong <g clipPath> theo hình tim nên phần thừa tự ẩn. */
const WIDE_FACETS: { points: string; fill: string; opacity: number }[] = [
  { points: "50,12 21,3 79,3", fill: "#ffffff", opacity: 0.45 },
  { points: "21,3 4,18 43,12", fill: "#ffffff", opacity: 0.35 },
  { points: "79,3 96,18 57,12", fill: "#ffffff", opacity: 0.3 },
  { points: "43,12 57,12 50,32", fill: "#ffffff", opacity: 0.5 },
  { points: "4,18 43,12 50,32", fill: "#a55fd0", opacity: 0.28 },
  { points: "96,18 57,12 50,32", fill: "#ffffff", opacity: 0.28 },
  { points: "4,33 50,32 50,62", fill: "#ffffff", opacity: 0.3 },
  { points: "96,33 50,32 50,62", fill: "#a55fd0", opacity: 0.3 },
  { points: "4,18 4,33 50,32", fill: "#f6c6e8", opacity: 0.3 },
  { points: "96,18 96,33 50,32", fill: "#f6c6e8", opacity: 0.28 },
];

export function PeachHeartSlideshow({
  data,
  fx,
  blurred,
  guestName,
  onEnter,
  photos: photosProp,
  textEffect = "scatter",
  heartVariant = "giant",
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
  /** Cỡ tim: "giant" (mặc định) = tim khổng lồ cao 96dvh tràn hai
   *  bên, chỉ thấy lát cắt giữa; "full" = tim rộng 92vw thấy trọn
   *  hình, cao ~28% viewport. */
  heartVariant?: "giant" | "full";
}) {
  const reduce = useReducedMotion();
  const tpl = getTemplate(data.templateId);
  const blurCls = blurred ? "blur-[7px] select-none" : "";
  const wideHeartId = useId();
  const facetId = useId();

  const photos = useMemo(
    () => Array.from(new Set(photosProp ?? [data.photoUrl])).filter(Boolean),
    [photosProp, data.photoUrl]
  );
  const [index, setIndex] = useState(0);
  // Đếm lần chuyển cảnh — cụm mảnh vỡ chỉ nổ khi chuyển cảnh thật,
  // không nổ lúc mới mở (lúc mở tim còn nguyên như mẫu).
  const [burstKey, setBurstKey] = useState(0);

  const goTo = (next: number) => {
    setIndex(next);
    setBurstKey((b) => b + 1);
  };

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % photos.length;
        return next;
      });
      setBurstKey((b) => b + 1);
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

  // Bố cục xen kẽ theo cảnh: 1 ảnh → luôn tim pha lê ĐẶC (dấu ấn của
  // mẫu); nhiều ảnh → chẵn: tim pha lê ĐẶC + chữ trắng trên tim, lẻ:
  // ảnh tràn khung, KHÔNG chữ.
  const layout: "heart" | "full" = photos.length > 1 && index % 2 === 1 ? "full" : "heart";

  const advance = () => {
    if (photos.length > 1) goTo((index + 1) % photos.length);
  };

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "mt-2 block font-display text-3xl font-bold leading-tight sm:text-4xl"
      : kind === "phrase"
        ? "mt-2 block font-display text-3xl font-bold italic leading-tight sm:text-4xl"
        : kind === "date"
          ? "mt-2 block text-base"
          : "mt-1 block text-sm";
  // Chữ TRẮNG nằm TRÊN tim (như video: chữ trắng trên tim pha lê,
  // mờ vào rồi đứng yên để đọc) — có bóng mờ để đọc được trên nền
  // pha lê sáng; dòng ngày/địa điểm trắng hơi trong hơn.
  const lineStyle = (kind: SlideshowLine["kind"]): React.CSSProperties => ({
    color: kind === "date" || kind === "venue" ? "rgba(255,255,255,0.88)" : "#ffffff",
    textShadow: "0 2px 16px rgba(94,42,82,0.45), 0 1px 4px rgba(94,42,82,0.35)",
  });

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
              style={lineStyle(line.kind)}
            />
          ) : textEffect === "paper" ? (
            <PaperText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={lineStyle(line.kind)}
            />
          ) : (
            <PeachShatterText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={lineStyle(line.kind)}
            />
          )
        )}
      </div>
    </AnimatePresence>
  );

  // (Không còn thẻ chữ trắng — chữ trắng nằm TRÊN tim, xem điểm 2.)

  // Lớp chuyển cảnh VỠ / LẮP GHÉP ("Tung Hoa Xé Mở" + "Hoa Tụ Về Tim")
  // nằm trong thư viện chuyển cảnh — ShatterAssembleOverlay.
  // Theo hướng đích (assemble = sang bố cục tim), không nổ tròn
  // tỏa ra từ tâm; mọi phần tử kết thúc ở opacity 0 nên lớp phủ
  // có ở lại cũng vô hình. Tắt hẳn khi giảm chuyển động.
  const isAssemble = layout === "heart";

  // Hoa bay — đúng video: cánh hoa + TIM NHỎ hồng/tím RƠI chậm từ
  // trên xuống khắp khung (đu đưa ngang, xoay chậm), không chỉ dao
  // động tại chỗ như bản cũ. 18 cánh (12 cánh hoa giọt nước + 6 tim
  // nhỏ), rơi 12–20s, delay âm để lúc mở đã có hoa khắp khung.
  const petals = !reduce && (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => {
        const isHeart = i % 3 === 0;
        const size = isHeart ? 12 + Math.abs(jitter(i * 5, 5)) : 9 + Math.abs(jitter(i * 7, 4));
        const dur = 12 + Math.abs(jitter(i * 3, 4));
        const left = 2 + Math.abs(jitter(i * 17, 47));
        const sway = 10 + Math.abs(jitter(i * 11, 8));
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{ left: `${left}%`, top: "-6%", width: size, height: size }}
            initial={{ y: "-6vh", x: 0, rotate: 0, opacity: 0 }}
            animate={{
              y: "112vh",
              x: [0, sway, -sway * 0.6, 0],
              rotate: [0, 120, 240, 360],
              opacity: [0, 0.85, 0.85, 0],
            }}
            transition={{
              duration: dur,
              repeat: Infinity,
              ease: "linear",
              delay: -Math.abs(jitter(i * 13, 10)),
              times: [0, 0.1, 0.9, 1],
            }}
          >
            {isHeart ? (
              <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                <path d={HEART_PATH} fill={HEART_PETAL_COLORS[i % HEART_PETAL_COLORS.length]} opacity="0.8" />
              </svg>
            ) : (
              <span className="block h-full w-full" style={{ background: PETAL_COLORS[i % 4], borderRadius: "60% 0 60% 0" }} />
            )}
          </motion.span>
        );
      })}
    </div>
  );

  // Bokeh — đốm tròn mềm trắng/hồng/tím trôi chậm + nhấp nhẹ, như
  // khung 9,5s của video (đốm bokeh tròn trên nền ảnh sảnh tiệc).
  const bokeh = !reduce && (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      {Array.from({ length: 8 }, (_, i) => {
        const size = 8 + Math.abs(jitter(i * 19, 9));
        return (
          <motion.span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: `${6 + Math.abs(jitter(i * 23, 44))}%`,
              top: `${8 + Math.abs(jitter(i * 31, 38))}%`,
              width: size,
              height: size,
              background: `radial-gradient(circle, ${["rgba(255,255,255,0.9)", "rgba(246,198,232,0.9)", "rgba(214,143,216,0.85)"][i % 3]} 0%, transparent 70%)`,
              filter: "blur(1px)",
            }}
            animate={{ y: [0, -14, 0], x: [0, 10, 0], opacity: [0.18, 0.4, 0.18] }}
            transition={{ duration: 7 + Math.abs(jitter(i * 7, 2)), repeat: Infinity, ease: "easeInOut", delay: jitter(i, 2) }}
          />
        );
      })}
    </div>
  );

  // Vệt sáng chéo — dải sáng trắng mờ quét chéo qua khung một lần mỗi
  // cảnh (như dải mặt cắt pha lê trong khung 19–27s của video).
  const lightSweep = !reduce && (
    <motion.div
      key={`sweep-${index}`}
      aria-hidden="true"
      className="pointer-events-none absolute left-[-20%] top-[28%] z-[7] h-[34%] w-[140%]"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.30) 45%, rgba(255,255,255,0.12) 60%, transparent)",
      }}
      initial={{ x: "-120%", rotate: -18, opacity: 0 }}
      animate={{ x: "120%", rotate: -18, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4.5, delay: 0.8, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
    />
  );

  // Tim pha lê ĐẶC khổng lồ — dấu ấn của mẫu: gradient hồng đào→tím
  // ĐẶC (không clip ảnh bên trong — ảnh chỉ lộ ra khi vỡ, trong cửa
  // sổ hình tim rồi nở ra tràn khung), vài mặt cắt TO highlight
  // trắng mạnh + lõi sáng, viền sáng, glow hồng mờ phía sau; tim thở
  // nhẹ 6s như mẫu (tắt khi giảm chuyển động). Kích thước do wrapper
  // ngoài quyết (h-[96dvh], aspect 100/65) — tim tràn trên/dưới
  // như video.
  const solidHeart = () => (
    <motion.div
      className="relative h-full w-full"
      animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow hồng mờ sau tim. */}
      <div
        aria-hidden="true"
        className="absolute inset-[-8%] rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(232,143,208,0.45), rgba(165,95,208,0.12) 60%, transparent 75%)",
          filter: "blur(10px)",
        }}
      />
      <svg aria-hidden="true" className="relative h-full w-full" viewBox="0 0 100 65">
        <defs>
          <linearGradient id={`${facetId}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7b8e4" stopOpacity="0.96" />
            <stop offset="45%" stopColor="#ec8fd6" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#a55fd0" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id={`${facetId}-core`} cx="0.5" cy="0.42" r="0.45">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${facetId}-clip`}>
            <path d={WIDE_HEART_PATH} />
          </clipPath>
        </defs>
        <path d={WIDE_HEART_PATH} fill={`url(#${facetId}-grad)`} />
        <ellipse cx="50" cy="26" rx="26" ry="16" fill={`url(#${facetId}-core)`} />
        <g clipPath={`url(#${facetId}-clip)`}>
          {WIDE_FACETS.map((f, i) => (
            <polygon key={i} points={f.points} fill={f.fill} opacity={f.opacity} />
          ))}
        </g>
        <path d={WIDE_HEART_PATH} fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" />
      </svg>
    </motion.div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{
        background: [
          "radial-gradient(120% 90% at 20% 8%, rgba(255,255,255,0.95), transparent 60%)",
          "linear-gradient(135deg, rgba(214,196,224,0.4), transparent 55%)",
          "linear-gradient(225deg, rgba(240,200,228,0.32), transparent 50%)",
          "linear-gradient(45deg, rgba(255,255,255,0.75), transparent 60%)",
          PAPER_BG,
        ].join(", "),
      }}
      onClick={advance}
    >
      {/* clipPath trái tim RỘNG (id riêng từng instance để không đụng
          nhau) — dùng cho cửa sổ hình tim lúc VỠ (ảnh lộ trong tim
          rồi nở ra tràn khung). Path 100×65 nên scale y = 1/65. */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <clipPath id={wideHeartId} clipPathUnits="objectBoundingBox">
            <path d={WIDE_HEART_PATH} transform="scale(0.01,0.0153846)" />
          </clipPath>
        </defs>
      </svg>

      {/* Nền low-poly: vài tam giác lớn mờ (trắng/xám/oải hương nhạt). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 55% 0, 18% 62%, 0 38%)", background: "rgba(255,255,255,0.55)" }} />
        <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 62% 0, 88% 55%, 100% 30%)", background: "rgba(226,214,232,0.5)" }} />
        <div className="absolute inset-0" style={{ clipPath: "polygon(0 100%, 34% 58%, 72% 100%)", background: "rgba(243,214,236,0.45)" }} />
        <div className="absolute inset-0" style={{ clipPath: "polygon(100% 100%, 78% 62%, 100% 44%)", background: "rgba(255,255,255,0.5)" }} />
      </div>

      {/* Nền mờ lúc LẮP GHÉP — như video 12–14,5s: ảnh nền mờ hẳn
          (tiêu cự, độ nét sụp 2185→263) trong khi tim nét dần phía
          trước; mờ dần biến mất sau khi tim đáp, trả lại nền low-poly
          sạch như cảnh mở đầu. Chỉ lúc lắp ghép (layout tim + đã
          chuyển cảnh), không hiện lúc mới mở. */}
      {!reduce && burstKey > 0 && layout === "heart" && currentPhoto && (
        <motion.div
          key={`bgblur-${burstKey}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.55, 0] }}
          transition={{ duration: 3.5, times: [0, 0.2, 0.65, 1], ease: "easeInOut" }}
        >
          <img
            src={currentPhoto}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: "blur(22px) brightness(1.08) saturate(1.15)", transform: "scale(1.2)" }}
          />
        </motion.div>
      )}

      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {petals}
      {bokeh}
      {lightSweep}

      {/* Dòng mời — giữ như slideshow Polaroid; cảnh tim thì chữ
          trắng trên nền pha lê, cảnh ảnh tràn thì màu mận như cũ. */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-7 text-center text-xs uppercase tracking-[0.35em]"
        style={{
          color: layout === "heart" ? "rgba(255,255,255,0.92)" : INK_MUTED,
          textShadow: layout === "heart" ? "0 1px 8px rgba(94,42,82,0.4)" : undefined,
        }}
      >
        {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
      </motion.p>

      {layout === "heart" ? (
        /* Bố cục tim pha lê ĐẶC khổng lồ: tim tràn khung (cao ~96dvh,
           rộng theo tỷ lệ 100/65, tràn hai bên như video) + chữ trắng
           nằm TRÊN tim. Nhánh này không định vị (không relative) nên
           các lớp absolute bên trong căn theo gốc slideshow (căn
           giữa khung hình); bản thân nhánh chỉ chiếm chỗ flex-1 để
           đẩy chấm/nút xuống dưới. */
        <div className="flex-1">
          {/* Cú mở đầu: tim bắt đầu nhỏ ~30% + mờ mềm, trong ~2s
              phóng tới ~99% và nét dần (video 0–2s); áp dụng lúc mở
              mỗi cảnh tim (key theo index nên chạy lại mỗi cảnh).
              Lúc lắp ghép tim chưa hiện tới ~1,5s (delay 1,5s) rồi
              mới lao vào — đúng nhịp lắp ~2,5s của video. Giảm chuyển
              động: hiện ngay cỡ đầy, không mờ. */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <motion.div
              key={`heart-intro-${index}`}
              className={
                heartVariant === "full"
                  ? "w-[min(92vw,130dvh)] aspect-[100/65]"
                  : "h-[96dvh] aspect-[100/65]"
              }
              style={{ transformOrigin: "50% 50%" }}
              initial={reduce ? false : { scale: 0.3, opacity: 0, filter: "blur(6px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 2, delay: reduce ? 0 : burstKey === 0 ? 0 : 1.5, ease: "easeOut" }}
            >
              {solidHeart()}
            </motion.div>
          </div>
          {/* Chữ trắng trên tim — mờ vào sau khi tim đã lao vào
              (video: chữ hiện sau, đứng yên để đọc). */}
          <motion.div
            key={`heart-text-${index}`}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: reduce ? 0 : burstKey === 0 ? 0.6 : 1.8 }}
          >
            {renderLines("heart")}
          </motion.div>
        </div>
      ) : (
        /* Bố cục ảnh tràn khung: ảnh tràn + vignette trắng mềm. KHÔNG
           hiện chữ/thẻ gì (video 8–11s không có chữ). Ảnh mới lộ ra
           trong cửa sổ hình tim rồi nở ra tràn khung (khung s_031). */
        <div className="relative z-10 flex flex-1 flex-col justify-end">
          {currentPhoto && (
            <div className="absolute inset-0">
              <AnimatePresence>
                <motion.div
                  key={currentPhoto}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce || burstKey === 0 ? 0 : 1.2 }}
                >
                  {/* Ảnh tràn mờ vào muộn (sau khi cửa sổ tim đã nở),
                      nét dần trong 1s. Giảm chuyển động: nét ngay. */}
                  <motion.div
                    className="h-full w-full"
                    initial={reduce ? false : { filter: "blur(6px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 1, delay: reduce || burstKey === 0 ? 0 : 1.2, ease: "easeOut" }}
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
                </motion.div>
                {/* Cửa sổ hình tim — lúc VỠ, ảnh mới hiện trong cửa sổ
                    hình tim (như khung s_031: ảnh nằm trong tim, viền
                    là tấm mặt cắt) rồi NỞ RA tràn khung (bloom):
                    cửa sổ bắt đầu cỡ tim nhỏ (~30dvh), phóng to tới
                    phủ kín khung rồi tan vào ảnh tràn bên dưới. Chỉ
                    lúc chuyển sang ảnh tràn (burstKey > 0). */}
                {!reduce && burstKey > 0 && (
                  <motion.div
                    key={`heartwin-${currentPhoto}`}
                    className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="h-[30dvh] aspect-[100/65]"
                      style={{ clipPath: `url(#${wideHeartId})`, transformOrigin: "50% 50%" }}
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0, 1, 1, 0], scale: [1, 1, 1.15, 3.4] }}
                      transition={{ duration: 1.6, delay: 0.6, times: [0, 0.25, 0.6, 1], ease: "easeOut" }}
                    >
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
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Vignette trắng mềm. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 55%, rgba(255,255,255,0.5) 100%), linear-gradient(to top, rgba(255,255,255,0.8), transparent 45%)",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Lớp chuyển cảnh VỠ / LẮP GHÉP — phủ toàn slide mỗi khi đổi ảnh.
          heartVariant để dải mảnh / tấm pha lê / đường cong lắp ghép
          bám đúng hộp tim của từng biến thể. */}
      <ShatterAssembleOverlay key={burstKey} burstKey={burstKey} assemble={isAssemble} reduce={!!reduce} heartVariant={heartVariant} />

      {/* Chấm trang — chỉ khi có nhiều ảnh. */}
      {photos.length > 1 && (
        <div className="relative z-10 mt-2 flex justify-center gap-2" aria-hidden="true">
          {photos.map((p, i) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 opacity-50"}`}
              style={{ background: layout === "heart" ? "#ffffff" : INK }}
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
