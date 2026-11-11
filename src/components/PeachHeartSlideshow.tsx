// Bộ sưu tập kiểu TRÁI TIM ĐÀO — kiểu slide ảnh riêng trong thư viện
// (id "peach-heart", mẫu Pikbest 237637 "Romantic Tanabata Valentine's
// Day Peach Heart Transition Electronic Brochure", AE template; làm
// 2026-11-11).
//
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
 *  trắng (bản cũ quá nhạt nên chìm hẳn); drop-shadow tạo viền. */
const PLATE_COLORS = [
  "rgba(255,255,255,0.92)",
  "rgba(246,198,232,0.9)",
  "rgba(182,120,216,0.75)",
  "rgba(255,255,255,0.85)",
  "rgba(232,143,208,0.88)",
  "rgba(214,143,216,0.8)",
];
/** Màu dải mảnh quét ngang — video gốc: dải mảnh CHỦ YẾU là mảnh xám
 *  đậm/tím đậm, điểm hồng/trắng (bản cũ quá nhiều hồng nhạt/trắng nên
 *  chìm trên nền wash sáng). */
const STREAM_COLORS = ["#3a3340", "#3a3340", "#b678d8", "#a55fd0", "#e88fd0", "#f6c6e8", "#ffffff"];

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

  // DẢI MẢNH CHUYỂN CẢNH — đúng video gốc: hàng chục mảnh NHỎ (3–12px)
  // xếp thành dải ngang, quét từ trái sang phải (mảnh trái chạy trước,
  // tạo mặt sóng lan dần như vệt nứt). Xác định theo burstKey nên mỗi
  // lần chuyển dải mảnh khác nhau nhưng ổn định trong lần đó.
  const streamShards = useMemo(() => {
    if (burstKey === 0) return [];
    return Array.from({ length: 48 }, (_, i) => ({
      leftPct: 2 + ((i * 37 + burstKey * 13) % 92),
      // Dải ngang HẸP (36–62% chiều cao) như vệt nứt trong video — bản
      // cũ rải 28–72% nên dải mảnh loãng, không thành vệt.
      topPct: 36 + ((i * 53 + burstKey * 7) % 26),
      size: 4 + ((i * 29 + burstKey * 5) % 10),
      delay: ((2 + ((i * 37 + burstKey * 13) % 92)) / 100) * 0.35,
      dx: 150 + ((i * 41 + burstKey * 3) % 170),
      dy: jitter(i * 7 + burstKey * 3, 26),
      rot: jitter(i * 11 + burstKey, 170),
      color: STREAM_COLORS[(i + burstKey) % STREAM_COLORS.length],
      petal: i % 3 === 0,
    }));
  }, [burstKey]);

  // LỚP CHUYỂN CẢNH — phủ toàn slide, chạy 1 lần mỗi khi đổi ảnh
  // (key = burstKey nên remount + chạy lại). Theo hướng đích:
  // - target "full" (tim → ảnh tràn) = VỠ: wash trắng đỉnh 0,5; dải
  //   mảnh quét ngang bay RA + mờ dần; tấm lớn bong ra + mờ dần.
  // - target "heart" (ảnh tràn → tim) = LẮP GHÉP: wash nhẹ 0,3; dải
  //   mảnh quét ngang bay VÀO + mờ dần lúc "đáp" vào tim; tấm lớn mờ
  //   dần hiện ra xếp thành tim rồi tan vào tim thật (tim vào sau,
  //   delay 0,65s). Mọi phần tử kết thúc ở opacity 0 nên lớp phủ có
  //   ở lại cũng vô hình. Tắt hẳn khi giảm chuyển động.
  const isAssemble = layout === "heart";
  const transitionOverlay = !reduce && burstKey > 0 && (
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
      {/* Tấm lớn (mặt cắt pha lê): VỠ = bong ra + mờ dần; LẮP = mờ dần
          hiện ra xếp thành tim rồi tan vào tim thật. */}
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
              : { x: 0, y: 0, opacity: 0.7, scale: 1, rotate: p.rotate }
          }
          animate={
            isAssemble
              ? { x: 0, y: 0, opacity: [0, 0.7, 0.7, 0], scale: 1, rotate: p.rotate }
              : { x: p.x * 0.45, y: p.y * 0.45, opacity: [0.7, 0.7, 0], scale: 1.28, rotate: p.rotate + 18 }
          }
          transition={{
            duration: isAssemble ? 1.2 : 1.0,
            delay: isAssemble ? 0.15 : 0,
            times: isAssemble ? [0, 0.15, 0.75, 1] : [0, 0.5, 1],
            ease: isAssemble ? "easeOut" : "easeIn",
          }}
        />
      ))}
      {/* Dải mảnh nhỏ quét ngang trái→phải. VỠ: hiện rồi mờ dần khi bay
          ra. LẮP: mờ dần hiện ra khi bay vào rồi mờ dần lúc "đáp". */}
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
    </div>
  );

  // Cánh hoa trôi chậm liên tục khắp khung (hồng/tím/trắng, thưa).
  const petals = !reduce && (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {Array.from({ length: 12 }, (_, i) => {
        const size = 10 + Math.abs(jitter(i * 7, 4));
        const dur = 8 + Math.abs(jitter(i * 3, 2.5));
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{
              left: `${8 + Math.abs(jitter(i * 17, 42))}%`,
              top: `${4 + Math.abs(jitter(i * 23, 40))}%`,
              width: size,
              height: size * 0.8,
              background: PETAL_COLORS[i % 4],
              borderRadius: "60% 0 60% 0",
              opacity: 0.55 + Math.abs(jitter(i * 29, 0.3)),
            }}
            animate={{ y: [0, 16, 0], x: [0, -10, 0], rotate: [0, 24, 0] }}
            transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay: jitter(i, 3) }}
          />
        );
      })}
    </div>
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

      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {petals}

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
          {crystalHeart("h-[36dvh] w-[min(78vw,340px)] sm:h-[54dvh] sm:w-[min(42vw,440px)]")}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce || burstKey === 0 ? 0 : 0.45 }}
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
      {transitionOverlay}

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
