// Bộ sưu tập kiểu ĐA LỚP BỒNG BỀNH — kiểu slide ảnh riêng trong thư viện
// (id "layer-motion", làm 2026-11-11 theo yêu cầu của Nancy: "đẹp như
// file .aep", chọn mẫu LayerMotionSlideshow của Codrops là đẹp nhất
// trong 12 mẫu slide cộng đồng).
//
// KỸ THUẬT GỐC (Codrops LayerMotionSlideshow, js/demo.js — đã lấy về
// research_notes/slide-cong-dong/code/08-layer-motion-slideshow):
// - Ảnh chính + 2 bản sao, tiêu đề + 3 bản sao; mỗi lớp lerp về vị
//   trí chuột với HỆ SỐ KHÁC NHAU (ảnh: 0.02*pos+0.02, ngoài 0.1,
//   biên độ ±20px; tiêu đề: 0.05*2^pos, ngoài 0.25, biên độ ±50px)
//   → các lớp lệch nhịp nhau, có chiều sâu (parallax lớp trong).
// - Chuyển cảnh: TimelineMax 0,8s, Quint.easeOut, stagger 0,13s —
//   các figure trượt x ±101% lệch nhau.
//
// PORT SANG TỰ ĐỘNG (điện thoại cảm ứng không rê chuột được; file
// .aep vốn chạy theo timeline tự động, không cần chuột): thay chuột
// bằng "mục tiêu ảo" bay theo sóng sin Lissajous (Tx ≠ Ty nên không
// bao giờ lặp y hệt), mỗi lớp lerp về mục tiêu với hệ số + pha +
// biên độ RIÊNG — giữ nguyên công thức lerp lệch nhịp của Codrops,
// chỉ đổi nguồn điều khiển từ chuột sang đồng hồ. Chạy bằng
// requestAnimationFrame, ghi thẳng el.style.transform (không setState
// mỗi frame). Giảm chuyển động: vòng lặp không chạy, tĩnh hoàn toàn.
//
// BỐI CẢNH (video Pikbest 1440022 — cùng mẫu với Hoa Hồng Cuốn):
// nền hồng phấn phẳng #fdf5f3 → #ffebea, 1 ảnh chính giữa viền trắng
// ~10px nghiêng xen kẽ ±1–2°, thẻ tiêu đề đỏ luân phiên vị trí, hoa
// nền trôi chậm. Chuyển cảnh "Bão Hoa Đục Lỗ" (StormPunchOverlay,
// mẫu Pikbest 1526340 theo mô tả của chị chủ): ảnh mới nằm sẵn bên
// dưới, lớp ảnh cũ bị đục thủng dần theo vệt bão để lộ ảnh mới ra
// + DriftSurge ±50px.
// KHÁC Hoa Hồng Cuốn: ở đó cả khung trôi như MỘT khối (DriftRest);
// ở đây mỗi lớp trôi RIÊNG với nhịp riêng — nền chậm nhất, ảnh vừa,
// tiêu đề trôi đồng pha với ảnh (layout chữ + ảnh cùng nhịp, cùng
// chiều — chị chốt 2026-11-12: layout chữ phải trôi đồng bộ với ảnh,
// không được lệch pha ngược chiều), hoa trang trí nhanh nhất.
//
// 5 LỚP TRÔI (mỗi lớp một duration/phase/biên độ/lerp riêng):
//   nền (blobs hồng)  — biên độ ±6px,  lerp 0,020, pha 0
//   echo (bóng mờ ảnh) — biên độ ±18px, lerp 0,030, pha 0,8 + scale thở
//   ảnh chính          — biên độ ±12px, lerp 0,050, pha 1,6 + xoay ±0,5° + scale thở
//   thẻ tiêu đề đỏ     — biên độ ±20px, lerp 0,050, pha 1,6 (ĐỒNG PHA ảnh —
//     layout chữ trôi cùng nhịp, cùng chiều với ảnh; trước đây pha π
//     ngược pha nên chị thấy layout chữ trôi lệch pha với ảnh)
//   hoa trang trí      — biên độ ±4px,  lerp 0,015, pha 2,4
// Nhịp theo chuẩn app: mỗi ảnh giữ 12 giây (PHOTO_MS). 1 ảnh →
// không tự chuyển cảnh nhưng các lớp vẫn trôi. Ảnh opacity 1 luôn
// ở trạng thái nghỉ. Tái dùng đồ sẵn có: getSlideshowSlides, hiệu
// ứng chữ SandText/PaperText, AmbientLayer, StormPunchOverlay,
// DriftSurge.

"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer } from "@/components/effects";
import { DriftSurge } from "@/components/effects/Drift";
import { StormPunchOverlay } from "@/components/transitions";
import { STORM_PUNCH, HEART_PATH } from "@/lib/transitions";
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

/** Nền hồng phấn phẳng của mẫu 1440022 (trên → dưới, đo bằng pixel). */
const BG_TOP = "#fdf5f3";
const BG_BOTTOM = "#ffebea";
/** Đỏ hồng đậm của cánh hoa lớn + thẻ tiêu đề (đo bằng pixel). */
const RED = "#c3002f";
/** Màu chữ trên nền hồng phấn. */
const INK_MUTED = "rgba(122,31,43,0.62)";
/** Cánh hoa nhỏ + tim outline trôi nền (hồng nhạt / đỏ / trắng). */
const BG_PETAL_COLORS = ["#e88ca0", "#c3002f", "#ffffff", "#f2b8c6"];

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  (copy từ ShatterText trong IntroSlideshow). */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Scatter & Reform tại chỗ (như FlowersShatterText trong
 *  FlowersBrochureSlideshow): từng chữ cái bay về ghép lại thành chữ
 *  lúc vào, vỡ vụn bay đi lúc ra — cùng nhịp đáp chung. */
function LayerShatterText({
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

/** Vị trí thẻ tiêu đề đỏ — luân phiên theo cảnh như video gốc:
 *  0: trên-trái, 1: dưới-phải, 2: giữa-phải, 3: dưới-giữa. */
const STRIP_POS = [
  "left-3 top-3",
  "bottom-3 right-3",
  "right-3 top-1/2 -translate-y-1/2",
  "bottom-3 left-1/2 -translate-x-1/2",
] as const;

/** Công thức trôi của từng lớp — port TiltFx của Codrops: mỗi lớp
 *  lerp về mục tiêu với hệ số (lerp) + pha (phase) + biên độ
 *  (range) RIÊNG nên lệch nhịp nhau. Mục tiêu ảo bay theo sóng sin
 *  Lissajous Tx=9s / Ty=13s (không lặp y hệt). */
type LayerKey = "bg" | "echo" | "photo" | "strip" | "petals";
const LAYER_FORMULA: Record<LayerKey, { range: number; lerp: number; phase: number }> = {
  bg: { range: 6, lerp: 0.02, phase: 0 },
  echo: { range: 18, lerp: 0.03, phase: 0.8 },
  photo: { range: 12, lerp: 0.05, phase: 1.6 },
  strip: { range: 20, lerp: 0.05, phase: 1.6 },
  petals: { range: 4, lerp: 0.015, phase: 2.4 },
};

export function LayerMotionSlideshow({
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
   *  TEXT_PACE_* như các slideshow khác). Chọn qua ?tx=. */
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
  // Cơn bão đục lỗ lúc chuyển cảnh — null khi không chuyển. key tăng
  // mỗi lần chuyển; dir xen kẽ trái/phải theo từng lần chuyển;
  // oldPhoto là ảnh cũ để overlay render lại đúng khung cũ (ảnh mới
  // đã đổi ngay lúc bắt đầu chuyển, nằm sẵn bên dưới lớp bị đục).
  const [sweep, setSweep] = useState<{ key: number; dir: 1 | -1; oldPhoto: string } | null>(null);
  const [hasSwept, setHasSwept] = useState(false);
  const indexRef = useRef(0);
  indexRef.current = index;
  const sweepCountRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  // Mở đầu mờ vào từ trắng ~1s như video gốc (lúc mở slideshow).
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOpened(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const sweepRef = useRef(sweep);
  sweepRef.current = sweep;

  const advance = () => {
    if (photos.length <= 1) return;
    if (sweepRef.current) return; // đang quét thì bỏ qua lần bấm/nhịp trùng
    const next = (indexRef.current + 1) % photos.length;
    if (reduce) {
      setIndex(next);
      return;
    }
    sweepCountRef.current += 1;
    const key = sweepCountRef.current;
    const dir: 1 | -1 = key % 2 === 1 ? 1 : -1; // lần 1 từ phải, lần 2 từ trái...
    const oldPhoto = photos[indexRef.current];
    setHasSwept(true);
    // BÃO HOA ĐỤC LỖ: đổi ảnh NGAY lúc bắt đầu chuyển — ảnh mới nằm
    // sẵn bên dưới, lớp ảnh cũ phủ trên bị đục thủng dần để lộ ra.
    setIndex(next);
    setSweep({ key, dir, oldPhoto });
    timersRef.current.push(
      window.setTimeout(() => setSweep(null), STORM_PUNCH.durationS * 1000 + 80)
    );
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => advanceRef.current(), PHOTO_MS);
    return () => window.clearInterval(t);
  }, [reduce, photos.length]);

  // Dòng thông tin — chỉ dòng nào có dữ liệu thật thì hiện.
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

  // Ảnh nghiêng xen kẽ ±1,5° theo cảnh như video gốc.
  const tilt = index % 2 === 0 ? 1.5 : -1.5;
  const tiltRef = useRef(tilt);
  tiltRef.current = tilt;

  // --- ĐỘNG CƠ LỚP (LayerMotion tự động) ---
  // Mỗi lớp là một div riêng (anh em, không lồng nhau) để transform
  // độc lập; vòng lặp rAF ghi thẳng el.style.transform. Giảm chuyển
  // động: vòng lặp không chạy, các lớp tĩnh hoàn toàn.
  const layerEls = useRef<Partial<Record<LayerKey, HTMLDivElement | null>>>({});
  const layerCur = useRef<Record<LayerKey, { x: number; y: number }>>({
    bg: { x: 0, y: 0 },
    echo: { x: 0, y: 0 },
    photo: { x: 0, y: 0 },
    strip: { x: 0, y: 0 },
    petals: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      // Mục tiêu ảo bay theo sóng sin Lissajous (Tx=9s, Ty=13s).
      const tx = Math.sin((2 * Math.PI * t) / 9);
      const ty = Math.sin((2 * Math.PI * t) / 13 + 1.3);
      (Object.keys(LAYER_FORMULA) as LayerKey[]).forEach((key) => {
        const el = layerEls.current[key];
        if (!el) return;
        const f = LAYER_FORMULA[key];
        // Mỗi lớp có pha riêng → mục tiêu của nó lệch pha với lớp khác.
        const gx = Math.sin((2 * Math.PI * t) / 9 + f.phase) * f.range;
        const gy = Math.sin((2 * Math.PI * t) / 13 + 1.3 + f.phase) * f.range;
        const cur = layerCur.current[key];
        cur.x += (gx - cur.x) * f.lerp;
        cur.y += (gy - cur.y) * f.lerp;
        if (key === "photo") {
          // Ảnh: trôi + xoay nhẹ ±0,5° + scale thở 1,00 → 1,03 (7s).
          const wob = 0.5 * Math.sin((2 * Math.PI * t) / 7 + 2);
          const sc = 1 + 0.015 * (1 + Math.sin((2 * Math.PI * t) / 7)) / 2;
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px) rotate(${(tiltRef.current + wob).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        } else if (key === "echo") {
          // Bóng mờ ảnh: trôi + scale thở 1,06 → 1,10 (8s).
          const sc = 1.08 + 0.02 * Math.sin((2 * Math.PI * t) / 8);
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
        } else {
          el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px)`;
        }
      });
      // tx/ty giữ để đọc nhanh khi debug (không dùng trực tiếp).
      void tx;
      void ty;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "block font-display text-lg font-bold leading-tight sm:text-xl"
      : kind === "phrase"
        ? "block font-display text-lg font-bold italic leading-tight sm:text-xl"
        : kind === "date"
          ? "mt-0.5 block text-[11px] sm:text-xs"
          : "mt-0.5 block text-[11px] sm:text-xs";

  const renderLines = (keyPrefix: string) => (
    <AnimatePresence>
      <div key={`${keyPrefix}-${photos.length === 0 ? "empty" : index}`} className="text-left">
        {currentLines.map((line) =>
          textEffect === "sand" ? (
            <SandText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: "#ffffff" }}
            />
          ) : textEffect === "paper" ? (
            <PaperText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: "#ffffff" }}
            />
          ) : (
            <LayerShatterText
              key={line.text}
              text={line.text}
              slideKey={photos.length === 0 ? 0 : index}
              reduce={!!reduce}
              className={`${lineClass(line.kind)} ${blurCls}`}
              style={{ color: "#ffffff" }}
            />
          )
        )}
      </div>
    </AnimatePresence>
  );

  // Hoa nền — cánh hoa nhỏ (10–25px) + tim outline nhỏ trôi chậm khắp
  // nền hồng, mật độ thưa (~20 cái) + sparkle trắng li ti. Delay âm
  // để lúc mở đã có hoa khắp khung. Giảm chuyển động: không có lớp này.
  const bgFlowers = !reduce && (
    <div
      aria-hidden="true"
      data-testid="lm-layer-petals"
      ref={(el) => {
        layerEls.current.petals = el;
      }}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden will-change-transform"
    >
      {Array.from({ length: 20 }, (_, i) => {
        const isHeart = i % 4 === 0;
        const size = isHeart ? 12 + Math.abs(jitter(i * 5, 5)) : 9 + Math.abs(jitter(i * 7, 6));
        const dur = 14 + Math.abs(jitter(i * 3, 6));
        const left = 2 + Math.abs(jitter(i * 17, 47));
        const sway = 8 + Math.abs(jitter(i * 11, 7));
        const color = BG_PETAL_COLORS[i % BG_PETAL_COLORS.length];
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
              opacity: [0, 0.8, 0.8, 0],
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
                <path d={HEART_PATH} fill={color} opacity="0.55" />
              </svg>
            ) : (
              <span
                className="block h-full w-full"
                style={{ background: color, borderRadius: "60% 0 60% 0", opacity: 0.75 }}
              />
            )}
          </motion.span>
        );
      })}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={`sp-${i}`}
          className="absolute block rounded-full bg-white"
          style={{
            left: `${4 + Math.abs(jitter(i * 23, 46))}%`,
            top: `${6 + Math.abs(jitter(i * 29, 44))}%`,
            width: 3,
            height: 3,
          }}
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{
            duration: 2.4 + Math.abs(jitter(i * 7, 1.2)),
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.abs(jitter(i * 5, 1.5)),
          }}
        />
      ))}
    </div>
  );

  const currentPhoto = photos[index];

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)` }}
      onClick={advance}
    >
      {/* Lớp nền: 2 vệt hồng mềm trôi chậm nhất (±6px) — tạo chiều sâu
          cho nền hồng phấn phẳng của video gốc. */}
      {!reduce && (
        <div
          aria-hidden="true"
          data-testid="lm-layer-bg"
          ref={(el) => {
            layerEls.current.bg = el;
          }}
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden will-change-transform"
        >
          <div
            className="absolute -left-16 top-[12%] h-64 w-64 rounded-full opacity-60 blur-3xl"
            style={{ background: "#ffd9de" }}
          />
          <div
            className="absolute -right-20 bottom-[8%] h-72 w-72 rounded-full opacity-50 blur-3xl"
            style={{ background: "#ffe9ec" }}
          />
        </div>
      )}
      {reduce && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" />}

      {/* Hoa nền trôi chậm + sparkle li ti (lớp hoa trang trí). */}
      {bgFlowers}

      {/* Lớp phủ theo biến thể — phủ lên cả nội dung (dùng AmbientLayer). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Dòng mời — giữ như các slideshow khác. */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-7 text-center text-xs uppercase tracking-[0.35em]"
        style={{ color: INK_MUTED }}
      >
        {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
      </motion.p>

      {/* Vùng cảnh: 1 ảnh duy nhất, chính giữa. Cú trôi chuyển cảnh
          (DriftSurge ±50px đúng chiều mây hoa quét, 1,3s) bọc NGOÀI
          hộp định vị tĩnh; bên trong, 3 lớp ANH EM trôi độc lập theo
          vòng lặp LayerMotion: echo (bóng mờ ảnh sau khung), photo
          (khung trắng + ảnh), strip (thẻ tiêu đề đỏ — bọc ngoài để
          transform rAF không phá class -translate-y-1/2 của vị trí). */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6">
        {photos.length === 0 ? (
          /* Không có ảnh: chỉ thẻ tiêu đề đỏ với đủ dòng chính trên nền hồng. */
          <div
            className="relative max-w-[86%] rounded-[2px] px-4 py-2"
            style={{ background: "rgba(195,0,47,0.88)" }}
          >
            {renderLines("empty")}
          </div>
        ) : (
          <DriftSurge
            sceneKey={index}
            offset={{ x: 50 * (sweep?.dir ?? 1) }}
            durationS={STORM_PUNCH.durationS}
            disabled={!!reduce || !hasSwept}
          >
            <div className="relative w-[min(78vw,600px)]">
              {/* Lớp echo: bản sao mờ của ảnh, to hơn khung một chút,
                  trôi với nhịp riêng — tạo cảm giác ảnh không dính cứng
                  một mặt phẳng (parallax lớp trong của LayerMotion). */}
              <div
                aria-hidden="true"
                data-testid="lm-layer-echo"
                ref={(el) => {
                  layerEls.current.echo = el;
                }}
                className="absolute -inset-3 overflow-hidden rounded-[6px] will-change-transform"
                style={{ filter: "blur(18px)", opacity: 0.35 }}
              >
                <img src={currentPhoto} alt="" loading="eager" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              </div>
              {/* Lớp ảnh chính: khung trắng ~10px + ảnh, nghiêng xen kẽ. */}
              <div
                data-testid="lm-layer-photo"
                ref={(el) => {
                  layerEls.current.photo = el;
                }}
                className="relative will-change-transform"
              >
                <div data-testid="photo-frame" className="relative overflow-hidden rounded-[3px] bg-white p-2.5 shadow-[0_14px_40px_rgba(122,31,43,0.16)]">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2px]">
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
                  </div>
                </div>
              </div>
              {/* Lớp thẻ tiêu đề đỏ — dải đỏ mờ, chữ trắng, vị trí luân
                  phiên theo cảnh; trôi đồng pha với ảnh (cùng nhịp,
                  cùng chiều — layout chữ không lệch pha với ảnh). */}
              <div className={`absolute z-10 max-w-[86%] ${STRIP_POS[index % 4]}`}>
                <div
                  data-testid="lm-layer-strip"
                  ref={(el) => {
                    layerEls.current.strip = el;
                  }}
                  className="rounded-[2px] px-3 py-1.5 will-change-transform"
                  style={{ background: "rgba(195,0,47,0.88)" }}
                >
                  {renderLines("strip")}
                </div>
              </div>
            </div>
          </DriftSurge>
        )}
        {/* Chuyển cảnh "BÃO HOA ĐỤC LỖ" — phủ đúng vùng cảnh (stage):
            ảnh mới đã đổi ngay lúc bắt đầu chuyển (nằm sẵn bên dưới),
            lớp ảnh cũ phủ trên bị đục thủng dần theo vệt bão. */}
        {sweep && photos.length > 0 && (
          <StormPunchOverlay
            key={sweep.key}
            sweepKey={sweep.key}
            direction={sweep.dir}
            oldPhoto={sweep.oldPhoto}
            reduce={!!reduce}
          />
        )}
      </div>

      {/* Chấm trang — chỉ khi có nhiều ảnh. */}
      {photos.length > 1 && (
        <div className="relative z-10 mt-2 flex justify-center gap-2" aria-hidden="true">
          {photos.map((p, i) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 opacity-50"}`}
              style={{ background: RED }}
            />
          ))}
        </div>
      )}

      {/* Nút vào thiệp — như các slideshow khác. */}
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

      {/* Mở đầu mờ vào từ trắng ~1s như video gốc. */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-50 bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: opened ? 0 : 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </div>
  );
}

