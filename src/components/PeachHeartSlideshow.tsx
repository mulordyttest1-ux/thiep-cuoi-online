// Bộ sưu tập kiểu TRÁI TIM ĐÀO — kiểu slide ảnh riêng trong thư viện
// (id "peach-heart", mẫu Pikbest 237637 "Romantic Tanabata Valentine's
// Day Peach Heart Transition Electronic Brochure", AE template; làm
// 2026-11-11). TÊN GỌI PHONG CÁCH: "PHA LÊ ĐÀO HOA" — tim pha lê +
// hoa đào bay + tiêu cự điện ảnh.
//
// BẢN LIỆT KÊ ĐẦY ĐỦ các lớp hiệu ứng trong video gốc (đo từ 62 khung
// trích mỗi 0,5s + đường cong độ nét Laplacian, video 30,88s,
// frames-dense/):
//  1. Tim pha lê (0–31s): tim khổng lồ nhiều mặt cắt, gradient hồng
//     đào→tím, glow — dấu ấn chính. [ĐÃ CÓ]
//  2. Camera push-in vào tim (0–5s): tim to dần từ ~55% khung tới
//     lấp đầy khung. [MỚI: push-in 1→1,14 trong 12s, chỉ cảnh tim]
//  3. Tiêu cự MỜ→NÉT lúc mở cảnh (0–5s): độ nét 21→780 trong khi
//     camera đẩy vào — cả khung mở đầu mờ mơ rồi nét dần. [MỚI:
//     blur 6px→0 trong 2s đầu mỗi cảnh]
//  4. Tiêu cự NỀN MỜ + TIM NÉT lúc lắp ghép (12–14,5s): độ nét
//     sụp 2185→263 (nền lối đi lễ đường mờ hẳn) rồi leo lại 263→
//     1013 khi tim lắp xong và nét dần. [MỚI: nền ảnh mờ blur 22px
//     hiện lúc lắp ghép, mờ dần biến mất sau khi tim đáp]
//  5. Hoa bay (xuyên suốt, từ ~1,5s): cánh hoa nhỏ hồng/tím/trắng
//     RƠI chậm từ trên xuống, đu đưa ngang, xoay chậm — thưa, ~15–
//     25 cánh cùng lúc. [ĐÃ CÓ 12 cánh dao động tại chỗ → ĐỔI thành
//     18 cánh RƠI (12 cánh giọt nước + 6 TIM NHỎ hồng/tím)]
//  6. Tim nhỏ bay (6,5s, 19–27s): tim hồng/tím bay lơ lửng, có lúc
//     to bằng bàn tay (khung 6,5s). [MỚI: 6 tim nhỏ trong lớp hoa bay]
//  7. Bokeh (9,5s): đốm tròn mềm trắng/hồng/tím rải trên nền ảnh.
//     [MỚI: 8 đốm bokeh trôi chậm + nhấp nhẹ]
//  8. Vệt sáng chéo / mặt cắt pha lê (8s, 19–27s): dải sáng trắng
//     mờ chéo qua khung, mép chéo sắc. [MỚI: dải sáng quét 1 lần
//     mỗi cảnh, ~4,5s]
//  9. Vignette trắng mềm trên ảnh tràn (8–11s). [ĐÃ CÓ]
// 10. Glow hồng quanh tim. [ĐÃ CÓ]
// 11. Tim phập phồng (thở) 6s. [ĐÃ CÓ]
// 12. VỠ 1,0s + LẮP GHÉP 1,2s (5–7s, 11–14,5s) — hiệu ứng chuyển
//     cảnh "TUNG HOA XÉ MỞ" (xem kỹ từng khung 10fps ở frames-shatter/
//     frames-assemble/, đã đối chiếu khung s_021/s_026/s_031):
//     - VỠ: vết XÉ CHÉO quét từ góc trên-trái xuống (dải mảnh ĐẬM
//       chạy CHÉO ~25°, không ngang — khung s_021: dải mảnh đen dài
//       từ mép trái ~20% cao xuống giữa khung ~55%); tim sáng trắng
//       dần rồi tan; HOA TUNG BÙNG RA (khung s_026: tim hồng/tím TO
//       20–60px + cánh nhỏ bắn ra MỌI HƯỚNG khắp khung, đúng khoảnh
//       khắc tim bung); 6 tấm lớn bong ra + KÉO GIÃN ngang (như bị
//       kéo xé ra hai phía); ảnh mới lộ ra TỪ TRONG TIM (khung s_031:
//       ảnh nằm trong cửa sổ hình tim, viền là các tấm mặt cắt) rồi
//       nở ra tràn khung.
//     - LẮP GHÉP: ngược lại — HOA TỤ VỀ: cánh hoa chảy thành DÒNG
//       cong từ rìa về giữa tim (khung a_031: dòng cánh tím/hồng từ
//       góc dưới-trái về tâm), dải mảnh quét chéo bay VÀO tụ quanh
//       tim; tấm lớn hiện ra xếp thành tim; ảnh mới hiện dần TRONG
//       tim; nền ảnh mờ (tiêu cự). [ĐÃ CÓ, PR #43 + TINH CHỈNH
//       2026-11-11: dải mảnh nghiêng chéo + tung hoa bùng ra/tụ về
//       + mép xé sáng + tấm lớn kéo giãn + ảnh mới nở ra từ trong]
// 13. Tim nở thành ảnh tràn (14,5→16,5s): ảnh trong tim phóng to
//     lấp đầy khung. [ĐÃ ĐƯỢC BAO BỞI chuyển VỠ, không làm thêm]
// 14. Chữ mờ vào/chồng mờ trên tim (0–5s). [Video có; app dùng hệ
//     chữ riêng (Sand/Paper/scatter) — không đụng]
// 15. Thẻ kết (19–27s): chữ lớn trên ảnh mờ + hoa + vệt sáng —
//     thẻ kết của video, không phải cảnh slideshow. [KHÔNG LÀM]
//
// Ngôn ngữ của mẫu: nền low-poly TRẮNG/BẠC sáng; TRÁI TIM PHA LÊ khổng
// lồ nhiều mặt cắt (gradient hồng đào → tím, trong suốt, lõi sáng) ở
// giữa; tim VỠ thành mảnh mặt cắt + cánh hoa bay ra, ảnh cưới lộ ra
// bên trong hình tim; ảnh tràn khung với mảnh/cánh hoa trôi lơ lửng;
// chữ trắng trên tim, hiện sau, đứng yên để đọc (không bay nhảy).
//
// KHÁC slideshow Polaroid mặc định: không chồng Polaroid nghiêng,
// không nền màu cảnh/blur tối; chữ màu mận đậm trên nền sáng (thay vì
// chữ trắng trên nền tối). KHÁC brochure lãng mạn: nền low-poly trắng/
// bạc (không giấy kem), tim PHA LÊ nhiều mặt cắt (không tim đặc),
// chuyển cảnh VỠ + LẮP GHÉP bằng mảnh (không đường chéo mảnh) —
// ĐÚNG NHƯ VIDEO GỐC (xem kỹ từng khung hình 4–8s và 12–16s):
// VỠ (tim → ảnh tràn): tim sáng trắng dần (wash) rồi tan; một DẢI
// mảnh NHỎ (hàng chục mảnh 3–12px, xám đậm/hồng/tím/trắng) quét NGANG
// từ trái sang phải như vệt nứt lan ra, kèm vài TẤM LỚN trong mờ
// (mặt cắt pha lê) bong ra + mờ dần; ảnh mới lộ ra SAU lớp wash.
// LẮP GHÉP (ảnh tràn → tim): dải mảnh nhỏ quét ngang bay VÀO, tụ lại
// quanh hình tim; các tấm lớn mờ dần hiện ra xếp thành tim; ảnh mới
// hiện dần TRONG hình tim. Chuyển theo hướng (target layout), không
// phải nổ tròn tỏa ra từ tâm như bản cũ.
// Chạy được với 1 ảnh (luôn tim pha lê); nhiều ảnh thì bố cục xen kẽ
// theo chỉ số cảnh (chẵn: tim pha lê chứa ảnh + thẻ chữ; lẻ: ảnh tràn
// khung + mảnh trôi + thẻ chữ). Nhịp theo chuẩn app: mỗi ảnh giữ 12
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
/** Hồng viền thẻ chữ. */
const ROSE = "#d9a0c8";
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

/** Các tam giác mặt cắt của tim pha lê (tọa độ viewBox 0–100) — clip
 *  theo hình tim nên phần thừa tự ẩn; trắng/tím trong suốt tạo cảm
 *  giác pha lê nhiều mặt cắt như mẫu. */
const FACETS: { points: string; fill: string; opacity: number }[] = [
  { points: "50,6 28,5 38,22", fill: "#ffffff", opacity: 0.38 },
  { points: "50,6 72,5 62,22", fill: "#ffffff", opacity: 0.26 },
  { points: "28,5 50,18 38,40", fill: "#a55fd0", opacity: 0.2 },
  { points: "72,5 50,18 62,40", fill: "#ffffff", opacity: 0.22 },
  { points: "38,40 62,40 50,60", fill: "#ffffff", opacity: 0.32 },
  { points: "38,40 50,60 30,62", fill: "#a55fd0", opacity: 0.16 },
  { points: "62,40 50,60 70,62", fill: "#ffffff", opacity: 0.13 },
  { points: "30,62 50,60 50,88", fill: "#ffffff", opacity: 0.24 },
  { points: "70,62 50,60 50,88", fill: "#a55fd0", opacity: 0.22 },
  { points: "5,28 28,5 38,40", fill: "#ffffff", opacity: 0.16 },
  { points: "95,28 72,5 62,40", fill: "#ffffff", opacity: 0.16 },
  { points: "5,45 30,62 20,70", fill: "#f6c6e8", opacity: 0.28 },
  { points: "95,45 70,62 80,70", fill: "#f6c6e8", opacity: 0.24 },
];

export function PeachHeartSlideshow({
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

  // Bố cục xen kẽ theo cảnh: 1 ảnh → luôn tim pha lê (dấu ấn của mẫu);
  // nhiều ảnh → chẵn: tim pha lê chứa ảnh + thẻ chữ, lẻ: ảnh tràn khung
  // + mảnh trôi + thẻ chữ.
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
            <PeachShatterText
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

  // Thẻ chữ trắng viền hồng mảnh (kiểu brochure trong mẫu, tông đào).
  const textCard = (extraClass = "") => (
    <div
      className={`rounded-md border bg-white/95 p-5 shadow-[0_10px_30px_rgba(94,42,82,0.10)] ${extraClass}`}
      style={{ borderColor: `${ROSE}99` }}
    >
      {renderLines("card")}
    </div>
  );

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

  // Tim pha lê chứa ảnh: ảnh clip theo hình tim + lớp phủ mặt cắt
  // (gradient hồng→tím nhạt + tam giác facet + viền sáng) + glow mờ
  // phía sau; tim phập phồng nhẹ như mẫu (tắt khi giảm chuyển động).
  // Ảnh trong tim crossfade theo key (vào muộn 0,65s khi LẮP GHÉP —
  // tim hiện dần sau khi dải mảnh tụ lại, như video gốc; lúc mới mở
  // thì hiện ngay, không delay).
  const crystalHeart = (heartClass: string) =>
    currentPhoto ? (
      <motion.div
        className={`relative shrink-0 ${heartClass}`}
        animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence>
          <motion.div
            key={currentPhoto}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.07 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03, transition: { duration: reduce ? 0 : 0.6, ease: "easeIn" } }}
            transition={{ duration: reduce ? 0 : 0.7, delay: reduce || burstKey === 0 ? 0 : 0.65, ease: "easeOut" }}
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
            <div className="relative h-full w-full overflow-hidden" style={{ clipPath: `url(#${heartId})` }}>
              {/* Tiêu cự lúc mở cảnh: ảnh trong tim mở đầu hơi mờ rồi nét
                  dần trong 2s (độ nét video 21→780 ở 0–5s); lúc LẮP
                  GHÉP thì mờ vào muộn 0,65s cùng tim, nét dần sau đó
                  (video 12–14,5s). Giảm chuyển động: nét ngay. */}
              <motion.div
                className="h-full w-full"
                initial={reduce ? false : { filter: "blur(6px)" }}
                animate={{ filter: "blur(0px)" }}
                transition={{ duration: 2, delay: reduce || burstKey === 0 ? 0 : 0.65, ease: "easeOut" }}
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
              {/* Lớp pha lê phủ lên ảnh: gradient hồng→tím nhạt + mặt cắt. */}
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`${facetId}-grad`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f7b8e4" stopOpacity="0.34" />
                    <stop offset="45%" stopColor="#ec8fd6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#a55fd0" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path d={HEART_PATH} fill={`url(#${facetId}-grad)`} />
                {FACETS.map((f, i) => (
                  <polygon key={i} points={f.points} fill={f.fill} opacity={f.opacity} />
                ))}
                <path d={HEART_PATH} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.7" />
              </svg>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    ) : null;

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
      {/* clipPath trái tim (id riêng từng instance để không đụng nhau). */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <clipPath id={heartId} clipPathUnits="objectBoundingBox">
            <path d={HEART_PATH} transform="scale(0.01,0.01)" />
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

      {layout === "heart" ? (
        /* Bố cục tim pha lê: tim chứa ảnh + thẻ chữ bên dưới (mobile xếp
           dọc, desktop tim trái + thẻ phải). */
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6 sm:flex-row sm:gap-10">
          {/* Camera push-in vào tim: tim to dần 1→1,14 trong 12s như
              video 0–5s (tim từ ~55% khung tới lấp đầy khung); chỉ
              zoom tim, không zoom thẻ chữ. */}
          <motion.div
            key={`push-${index}`}
            className="shrink-0"
            initial={{ scale: 1 }}
            animate={{ scale: reduce ? 1 : 1.14 }}
            transition={{ duration: 12, ease: "linear" }}
          >
            {crystalHeart("h-[36dvh] w-[min(78vw,340px)] sm:h-[54dvh] sm:w-[min(42vw,440px)]")}
          </motion.div>
          <div className="relative w-full max-w-md sm:w-[42%]">{textCard()}</div>
        </div>
      ) : (
        /* Bố cục ảnh tràn khung: ảnh tràn + vignette trắng mềm + mảnh
           trôi + thẻ chữ ở dưới. */
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
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce || burstKey === 0 ? 0 : 0.45 }}
                >
                  {/* Tiêu cự lúc mở cảnh: ảnh tràn mở đầu hơi mờ rồi nét
                      dần trong 2s (như tim); lúc VỠ thì mờ vào muộn
                      0,45s sau lớp wash. Giảm chuyển động: nét ngay. */}
                  <motion.div
                    className="h-full w-full"
                    initial={reduce ? false : { filter: "blur(6px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 2, delay: reduce || burstKey === 0 ? 0 : 0.45, ease: "easeOut" }}
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
              </AnimatePresence>
              {/* Vignette trắng mềm + dải sáng dưới cho chữ đọc rõ. */}
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
          <div className="relative mx-auto w-full max-w-md px-6 pb-2">{textCard()}</div>
        </div>
      )}

      {/* Lớp chuyển cảnh VỠ / LẮP GHÉP — phủ toàn slide mỗi khi đổi ảnh. */}
      <ShatterAssembleOverlay key={burstKey} burstKey={burstKey} assemble={isAssemble} reduce={!!reduce} />

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
