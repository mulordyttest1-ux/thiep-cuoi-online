// Bộ sưu tập kiểu HOA HỒNG CUỐN — kiểu slide ảnh riêng trong thư viện
// (id "flowers-brochure", mẫu Pikbest 1440022 "Romantic Beautiful
// Flowers Transition Wedding Love Photo Brochure Display", AE template;
// làm 2026-11-11).
//
// Ngôn ngữ của mẫu (đo bằng pixel từ preview.mp4 59,3s, xem
// research_notes/pikbest-1440022-flowers-transition/report.md):
// - CHUYỂN CẢNH "HOA CUỐN MÀN" (~1,3s): đám mây 25–40 cánh hoa hồng
//   LỚN quét ngang toàn khung làm màn chắn, che kín 70–90% lúc đỉnh
//   rồi tan ra lộ ảnh mới; hướng quét XEN KẼ trái/phải theo từng lần
//   chuyển — nằm trong thư viện chuyển cảnh (FlowerSweepOverlay).
// - MỌI CẢNH CHỈ 1 ẢNH, chính giữa, viền trắng ~10px, nghiêng nhẹ xen
//   kẽ ±1–2° theo cảnh. Ảnh trôi NHẸ liên tục trong cảnh (DriftRest
//   ±3px/±0,5° — nguyên tắc chuyển ảnh, Nancy 2026-11-11: phân tích
//   cũ ghi "đứng yên hoàn toàn" vì chỉ đo kích thước, không đo vị trí;
//   mắt chị bắt được ảnh vẫn dập dìu nhẹ), và lúc chuyển thì cả khung
//   trôi mạnh ±50px đúng chiều mây hoa quét. Không zoom, không lia,
//   không Ken Burns — khác cả 3 kiểu cũ.
// - Thẻ tiêu đề ĐỎ (dải đỏ mờ, chữ trắng) — vị trí luân phiên theo
//   từng cảnh (trên-trái / dưới-phải / giữa-phải / dưới-giữa); trong
//   app là dòng chữ của cảnh (tên/ngày/địa điểm, hệ chữ SandText/
//   PaperText/scatter + nhịp TEXT_PACE_* sẵn có).
// - Nền HỒNG PHẤN phẳng duy nhất suốt video (#fdf5f3 trên → #ffebea
//   dưới) + 15–25 cánh hoa nhỏ/tim outline trôi chậm + sparkle trắng
//   li ti. Mở đầu mờ vào từ trắng ~1s.
// - KHÔNG có: rack focus, bokeh, tia sáng, vignette, zoom/lia trong
//   cảnh, màn kết riêng (kết luôn trên ảnh cuối — slideshow app lặp
//   vòng nên không có cảnh kết).
//
// Phân biệt với scrapbook Polaroid mặc định (cũng viền trắng + nghiêng
// nhẹ): bằng nền hồng phấn + đám mây hoa chuyển cảnh + thẻ tiêu đề đỏ.
// KHÁC peach-heart: không tim pha lê, hoa chuyển là MÀN CHẮN quét
// ngang (không phải hoa tung từ tâm); KHÁC warm-confession: không mờ
// qua trắng, ảnh chỉ trôi nhẹ (không zoom/lia/nhúc nhích mạnh); KHÁC comic:
// không panel, không lật trang, không màn kết.
//
// Nhịp theo chuẩn app: mỗi ảnh giữ 12 giây (PHOTO_MS), không bê nhịp
// ~5s/ảnh của video gốc. 1 ảnh → không tự chuyển. Ảnh opacity 1 luôn
// ở trạng thái nghỉ. Tái dùng đồ sẵn có: getSlideshowSlides, hiệu ứng
// chữ SandText/PaperText, AmbientLayer.

"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer } from "@/components/effects";
import { DriftRest, DriftSurge } from "@/components/effects/Drift";
import { FlowerSweepOverlay } from "@/components/transitions";
import { FLOWER_SWEEP, HEART_PATH } from "@/lib/transitions";
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

/** Nền hồng phấn phẳng của mẫu (trên → dưới, đo bằng pixel). */
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

/** Scatter & Reform tại chỗ (như ShatterText trong IntroSlideshow):
 *  từng chữ cái bay về ghép lại thành chữ lúc vào, vỡ vụn bay đi lúc
 *  ra — cùng nhịp đáp chung (textPaceStartAt, TEXT_PACE_DUR_S). */
function FlowersShatterText({
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

export function FlowersBrochureSlideshow({
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
  // Đám mây hoa lúc chuyển cảnh — null khi không chuyển. key tăng mỗi
  // lần chuyển (để overlay remount + chạy lại từ đầu); dir xen kẽ
  // trái/phải theo từng lần chuyển như video gốc (lần 1 từ phải).
  const [sweep, setSweep] = useState<{ key: number; dir: 1 | -1 } | null>(null);
  // Đã quét lần nào chưa — cú trôi chuyển cảnh (DriftSurge) chỉ chạy
  // từ lần chuyển đầu tiên (tránh ảnh trượt ngang lúc mới mở thiệp).
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

  // advance đọc state qua ref nên interval không cần reset mỗi lần render.
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
    setHasSwept(true);
    setSweep({ key, dir });
    // Đổi ảnh NGAY LÚC đám mây che kín nhất (0,62s) — giấu sau đám
    // hoa, không bao giờ thấy 2 ảnh chồng nhau.
    timersRef.current.push(window.setTimeout(() => setIndex(next), FLOWER_SWEEP.swapAtMs));
    timersRef.current.push(
      window.setTimeout(() => setSweep(null), FLOWER_SWEEP.durationS * 1000 + 80)
    );
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => advanceRef.current(), PHOTO_MS);
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

  // Ảnh nghiêng xen kẽ ±1–2° theo cảnh như video gốc (rất nhẹ, gần
  // như thẳng).
  const tilt = index % 2 === 0 ? 1.5 : -1.5;

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
            <FlowersShatterText
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

  // Hoa nền — đúng video: cánh hoa nhỏ (10–25px) + tim outline nhỏ
  // trôi chậm khắp nền hồng, mật độ thưa (~20 cái cùng lúc) + sparkle
  // trắng li ti nhấp nháy nhẹ. Delay âm để lúc mở đã có hoa khắp khung.
  // Giảm chuyển động: không có lớp này (nền hồng phẳng tĩnh).
  const bgFlowers = !reduce && (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
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
      {/* Hoa nền trôi chậm + sparkle li ti (không phải chuyển cảnh). */}
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

      {/* Vùng cảnh: 1 ảnh duy nhất, chính giữa, viền trắng ~10px,
          nghiêng nhẹ xen kẽ. DRIFT (nguyên tắc chuyển ảnh, Nancy
          2026-11-11): lúc nghỉ ảnh trôi nhẹ liên tục (DriftRest
          ±3px/±0,5°, 7s — bọc trong khung nên không đụng góc nghiêng);
          lúc chuyển, CẢ KHUNG ẢNH trôi mạnh ±50px đúng CHIỀU mây hoa
          đang quét (dir = 1: mây vào từ phải, ra bên trái → khung bắt
          đầu lệch phải +50px rồi trôi sang trái; dir = −1 thì ngược
          lại — DriftSurge, 1,3s = nhịp quét, chỉ từ lần chuyển đầu
          tiên, ảnh đổi ở 620ms giấu sau đám hoa nên cú trôi lộ dần
          cùng lúc đám hoa tan ra). Thẻ tiêu đề đỏ đè lên ảnh, vị trí
          luân phiên theo cảnh. */}
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
            durationS={FLOWER_SWEEP.durationS}
            disabled={!!reduce || !hasSwept}
          >
          <div
            className="relative w-[min(78vw,600px)]"
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            <div className="relative overflow-hidden rounded-[3px] bg-white p-2.5 shadow-[0_14px_40px_rgba(122,31,43,0.16)]">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2px]">
                <DriftRest disabled={!!reduce} className="h-full w-full">
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
                </DriftRest>
              </div>
              {/* Thẻ tiêu đề đỏ — dải đỏ mờ, chữ trắng, vị trí luân
                  phiên theo cảnh (trên-trái / dưới-phải / giữa-phải /
                  dưới-giữa) như video gốc. */}
              <div
                className={`absolute z-10 max-w-[86%] rounded-[2px] px-3 py-1.5 ${STRIP_POS[index % 4]}`}
                style={{ background: "rgba(195,0,47,0.88)" }}
              >
                {renderLines("strip")}
              </div>
            </div>
          </div>
          </DriftSurge>
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

      {/* Chuyển cảnh "HOA CUỐN MÀN" trong thư viện chuyển cảnh
          (FlowerSweepOverlay): đám mây cánh hoa lớn quét ngang che
          kín khung rồi tan ra — ảnh đổi ngay lúc che kín nhất (0,62s),
          giấu sau đám hoa. Giảm chuyển động: đổi cảnh tức thì. */}
      {sweep && (
        <FlowerSweepOverlay
          key={sweep.key}
          sweepKey={sweep.key}
          direction={sweep.dir}
          reduce={!!reduce}
        />
      )}

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
