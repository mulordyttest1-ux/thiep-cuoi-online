// Bộ sưu tập — bước 2 của intro thay phong bì. KỊCH BẢN SCRAPBOOK đã duyệt
// (2026-11-10, mẫu Pikbest 10077037 "Video Tỏ Tình đám Cưới"): album kỷ
// niệm kiểu scrapbook — ảnh viền trắng đặt nghiêng như Polaroid dán trên
// nền, ảnh mới xoay/trượt vào chồng lên ảnh trước + zoom chậm nhẹ, nền đổi
// màu theo cảnh (đỏ đậm → hồng phấn → trắng kem → vàng hoàng hôn), nhịp
// chậm mỗi ảnh giữ 12 giây, thiệp khẩu hiệu lặp lại như điệp khúc.
//
// CHIA THÔNG TIN THEO SỐ ẢNH (quy tắc bắt buộc, xem getSlideshowSlides
// trong src/lib/intro.ts): dòng chính Tên → Ngày → Địa điểm; dòng phụ
// Happy Wedding → Save the Day → câu cưới khác khi còn ảnh. 1 ảnh = đủ
// hết trên 1 ảnh; 2 ảnh = tên, rồi ngày + địa điểm; 3 ảnh = tên, ngày,
// địa điểm; 4 ảnh = + Happy Wedding; 5 ảnh = + Save the Day; nhiều hơn
// thì thêm câu cưới khác. Lúc nào cũng đủ thông tin, không thiếu dòng chính.
//
// ẢNH: CHỈ ảnh thật của thiệp (data.photoUrl). Không có album ảnh khách
// nào khác trong InvitationData (không có field album); ảnh PRESET_PHOTOS
// là ảnh minh họa Unsplash, KHÔNG dùng ở đây (không để thông tin sẵn).
// Không có ảnh khách: chỉ chữ trên nền cover theo biến thể.
//
// CHỮ: ba hiệu ứng có tên (chị chủ chốt 2026-11-10) — "scatter" (mặc
// định từ 2026-11-11, chị chọn scatter): từng chữ cái bay về ghép lại
// thành chữ, lúc chuyển ảnh thì chữ vỡ vụn bay đi; "sand": hạt cát rơi
// nhẹ từ trên xuống tụ lại thành chữ, lúc chuyển ảnh thì chữ vỡ thành
// cát bay lên; "paper": giấy dán — từng chữ rơi từ
// trên xuống, lật (rotateX −90° về 0, cú lật làm chữ hiện ra) rồi dán
// phẳng như tờ giấy. NHỊP CHUNG (chị chốt 2026-11-10 16:24): cả 3
// dùng 1 nhịp đáp (TEXT_PACE_* trong src/lib/intro.ts) — cùng gia tốc
// (K = 2,5), vận tốc ban đầu gấp đôi paper cũ, mỗi chữ bay/rơi/lật
// 0,9s, cả dòng đáp xong ~2,95s. Chọn qua ?tx=sand|scatter|paper
// trên trang khách. Chữ chỉ dùng dữ liệu thật của thiệp; không có dữ
// liệu thì bỏ dòng đó (không bịa).
// MÔ HÌNH 3 LỚP CHO INTRO (2026-11-10, xem src/lib/layers.ts):
//   1) Lớp đáy — nền: prop `background` là DANH SÁCH chồng dưới lên
//      trên (quy tắc chồng tầng, chị chốt 2026-11-10): "solid" = màu
//      đặc đổi theo ảnh, "glow" = gradient nắng vàng loang từ trên
//      xuống, "blurred-photo" = nền mờ từ chính ảnh đang hiện.
//      Giá trị đơn cũ ("solid" | "blurred") vẫn chạy, hiểu là danh
//      sách 1 phần tử ("blurred" là tên cũ của "blurred-photo").
//   2) Lớp nội dung — slideshow: ảnh Polaroid + chữ chạy (dưới đây),
//      tự chồng theo SLIDESHOW_CONTENT_LAYERS: dòng mời → ảnh →
//      chữ → chấm trang → nút "Xem thiệp".
//   3) Lớp phủ — AmbientLayer theo fx, hoặc prop `overlay` truyền vào
//      thì chỉ hiện các lớp phủ đó. Mặc định: `background` là
//      ["solid", "blurred-photo"] (nền mờ từ ảnh là mặc định từ
//      2026-11-10, chị chốt đổi backdrop đáy sang ảnh blur — chỉnh
//      2026-11-10 16:24: scale 1.2 + blur nhẹ 20px, blur 56px/scale 2.2
//      cũ mờ quá không nhận ra là nền từ ảnh);
//      `overlay` không truyền thì giữ hành vi hiện tại.
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer, KenBurns, type KenBurnsDirection } from "@/components/effects";
import { DriftRest } from "@/components/effects/Drift";
import { SandText } from "@/components/SandText";
import { PaperText } from "@/components/PaperText";
import type { OverlayId } from "@/lib/layers";
import type { BackgroundGroupId } from "@/lib/backgrounds";
import {
  getIntroPreset,
  getSlideshowSlides,
  resolveIntroVariant,
  SLIDESHOW_SCENES,
  TEXT_PACE_DUR_S,
  textPaceStartAt,
  type SlideshowLine,
  type TextEffectId,
} from "@/lib/intro";

const PHOTO_MS = 12000; // mỗi ảnh hiện ~12s rồi sang ảnh sau — chữ chạy
// theo nhịp chung (cả dòng đáp xong ~2,95s) rồi còn đứng yên một lúc
// cho kịp đọc

/** Giả ngẫu nhiên xác định từ số nguyên — ổn định giữa các lần render
 *  nên mảnh vụn không nhảy lung tung mỗi khi component render lại. */
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 * range - range;
}

/** Chữ vỡ vụn / tụ lại — từng chữ cái là một mảnh: lúc hiện các mảnh
 *  bay về ghép lại thành chữ (Scatter & Reform), lúc đi chữ vỡ vụn
 *  từng chữ cái rồi bay đi (Shatter). NHỊP (2026-11-10 16:24, chị
 *  chốt): scatter dùng CHUNG nhịp đáp với sand/paper
 *  (TEXT_PACE_* trong src/lib/intro.ts) — delay theo đường cong chung
 *  (K = 2,5, chậm đầu nhanh cuối), mỗi chữ bay 0,9s (cũ 6s) để 3 hiệu
 *  ứng đáp TRÙNG NHAU — cả dòng đáp xong ~2,95s (cũ ~7,7s). Hình thức
 *  giữ nguyên: mảnh lệch tối đa ~14px lúc vào, ~26px lúc ra, xoay tối
 *  đa ~10°/~22°; lúc ra tan NHANH riêng 0,8s để chữ cũ không lềnh bềnh
 *  đè lên ảnh sau. */
function ShatterText({
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
  // Nhóm ký tự theo TỪ để dòng dài ngắt ở khoảng trắng giữa các từ
  // (không vỡ giữa từ như "Đồng Đ / a"); hiệu ứng vẫn chạy từng chữ
  // cái, độ trễ tính theo chỉ số ký tự toàn dòng — theo nhịp đáp chung
  // (textPaceStartAt, intro.ts): đường cong K = 2,5, chữ cuối bắt đầu
  // ở 2,05s, mỗi chữ bay 0,9s.
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
                    // Tan NHANH riêng lúc ra (0,8s) — không dùng chung
                    // transition 0,9s của lúc vào, kẻo chữ cũ lềnh bềnh
                    // đè lên ảnh sau.
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

/** Một tầng con của lớp đáy slideshow: id nhóm nền (xem
 *  BackgroundGroupId) + "blurred" là tên cũ của "blurred-photo"
 *  (prop background đơn trước 2026-11-10). */
export type SlideshowBackgroundLayer = BackgroundGroupId | "blurred";

/** Gradient nắng vàng loang từ trên xuống — vệt nắng "warm" của
 *  SunFlare ở bìa (IntroCover), dùng lại cho tầng "glow" của đáy
 *  slideshow. Bán trong suốt nên lớp dưới vẫn thấy. */
const GLOW_GRADIENT =
  "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(246,211,101,0.5) 0%, rgba(246,211,101,0.12) 55%, transparent 75%)";

export function IntroSlideshow({
  data,
  fx,
  blurred,
  guestName,
  onEnter,
  /** Danh sách ảnh cho slideshow — mặc định chỉ ảnh thật của thiệp
   *  (data.photoUrl). Prop này để sẵn cho lúc thiệp có nhiều ảnh (khi
   *  đó GuestInvitationView truyền album vào); QA cũng dùng nó để kiểm
   *  trường hợp 3/5 ảnh. Không truyền thì chỉ dùng photoUrl. */
  photos: photosProp,
  /** Lớp đáy của slideshow — DANH SÁCH chồng dưới lên trên (quy tắc
   *  chồng tầng, chị chốt 2026-11-10). Mỗi phần tử là một tầng con:
   *  "solid" = nền màu đặc đổi theo ảnh; "glow" = gradient nắng vàng
   *  loang từ trên xuống (bán trong suốt, lớp dưới vẫn thấy);
   *  "blurred-photo" = nền mờ từ chính ảnh đang hiện (phóng to 120%
   *  scale 1.2 + blur nhẹ 20px + tối nhẹ — chị chốt 2026-11-10 16:24:
   *  blur 56px/scale 2.2 cũ mờ quá, không nhận ra là nền từ ảnh;
   *  blur 20px vẫn nhận ra hình/đường nét ảnh gốc, chữ trắng vẫn đọc
   *  rõ nhờ tối nhẹ + bóng chữ). Ambient mode.
   *  "particles"/"motif" không vẽ được ở đáy slideshow (hạt bay
   *  thuộc lớp phủ, họa tiết thuộc bìa) nên bỏ qua khi gặp. Giá trị
   *  đơn cũ vẫn chạy: "solid" | "blurred" hiểu là danh sách 1 phần
   *  tử ("blurred" là tên cũ của "blurred-photo"). Mặc định ["solid",
   *  "blurred-photo"] — MẶC ĐỊNH từ 2026-11-10 (chị chốt đổi backdrop
   *  đáy sang ảnh blur, chỉnh 2026-11-10 16:24: scale 1.2 + blur 20px):
   *  solid nằm dưới làm nền dự phòng khi
   *  không có ảnh, blurred-photo nằm trên khi có ảnh. */
  background: backgroundProp = ["solid", "blurred-photo"],
  /** Lớp phủ tùy chọn — danh sách lớp phủ muốn hiện trong slideshow.
   *  Không truyền = hành vi hiện tại (AmbientLayer theo fx). Truyền
   *  vào thì chỉ hiện các lớp phủ đó; chỉ sparkle/petals/bokeh có tác
   *  dụng ở slideshow ("sun" — nắng bìa — chỉ có ở IntroCover nên
   *  truyền vào cũng không đổi gì). Lưu ý: bokeh thay thế tia/cánh
   *  trong AmbientLayer nên ["bokeh", "sparkle"] chỉ hiện bokeh +
   *  sao 4 cánh, không hiện tia vàng. */
  overlay,
  /** Hiệu ứng chữ — "scatter" (mặc định): từng chữ cái bay về ghép
   *  lại thành chữ, lúc chuyển ảnh thì chữ vỡ vụn bay đi; "sand":
   *  hạt cát rơi nhẹ từ trên xuống tụ lại thành chữ, lúc chuyển ảnh
   *  thì cát bay lên; "paper":
   *  giấy dán — từng chữ rơi từ trên xuống, lật rồi dán phẳng. Cả 3
   *  dùng CHUNG nhịp đáp (TEXT_PACE_*, intro.ts): cùng gia tốc
   *  (K = 2,5), vận tốc ban đầu gấp đôi paper cũ, cả dòng đáp xong
   *  ~2,95s. Chọn qua ?tx= trên trang khách; không truyền = scatter. */
  textEffect = "scatter",
}: {
  data: InvitationData;
  fx: TemplateEffects;
  /** Demo: mờ tên/ngày/địa điểm như trong thiệp. */
  blurred?: boolean;
  /** Tên khách mời (?guest=) — hiện ở dòng mời như phong bì cũ vẫn làm. */
  guestName?: string;
  /** Khách bấm "Xem thiệp" → vào nội dung thiệp. */
  onEnter: () => void;
  photos?: string[];
  /** Một tầng con của lớp đáy slideshow — id nhóm nền trong
   *  BackgroundGroupId, cộng "blurred" là tên cũ của "blurred-photo"
   *  (giữ tương thích ngược với prop background đơn trước 2026-11-10). */
  background?: SlideshowBackgroundLayer | SlideshowBackgroundLayer[];
  overlay?: OverlayId[];
  textEffect?: TextEffectId;
}) {
  const reduce = useReducedMotion();
  const tpl = getTemplate(data.templateId);
  const preset = getIntroPreset(resolveIntroVariant(fx, tpl.variant));
  const blurCls = blurred ? "blur-[7px] select-none" : "";

  // CHỈ ảnh thật của thiệp (photoUrl), bỏ trùng. Không có ảnh → danh
  // sách rỗng, bước này chỉ còn chữ trên nền cover theo biến thể
  // (không lấy ảnh mẫu).
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

  // Dòng thông tin — chỉ dòng nào có dữ liệu thật thì hiện.
  const coupleName = [data.brideName?.trim(), data.groomName?.trim()]
    .filter(Boolean)
    .join(" & ");
  const dateLine = data.date ? formatDateVi(data.date) + (data.time ? ` • ${data.time}` : "") : "";
  const venueLine = [data.venue, data.address].filter(Boolean).join(" — ");

  // Chia dòng theo số ảnh (kịch bản đã duyệt). Không có ảnh: hiện tất
  // cả các dòng chính chồng lên nhau trên nền cover.
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

  // Lớp phủ — mặc định theo fx (AmbientLayer như hiện tại); truyền
  // prop overlay vào thì chỉ hiện các lớp phủ đó. Bokeh thay thế
  // tia/cánh trong AmbientLayer (xem ghi chú ở prop overlay).
  const overlayFx = useMemo<TemplateEffects>(() => {
    if (!overlay) return fx;
    const wantSparkle = overlay.includes("sparkle");
    const wantPetals = overlay.includes("petals");
    const wantBokeh = overlay.includes("bokeh");
    if (!wantSparkle && !wantPetals && !wantBokeh) {
      return { ...fx, ambient: undefined, twinkle: undefined };
    }
    const kind = wantBokeh
      ? "bokeh"
      : wantSparkle && wantPetals
        ? "both"
        : wantSparkle
          ? "sparkle"
          : "petals";
    return {
      ...fx,
      ambient: {
        count: fx.ambient?.count ?? 12,
        speed: fx.ambient?.speed,
        kind,
        petals: fx.ambient?.petals ?? 6,
        petalColors: fx.ambient?.petalColors,
      },
      twinkle: wantSparkle ? (fx.twinkle ?? { count: 10 }) : undefined,
    };
  }, [overlay, fx]);

  // Lớp đáy — CHUẨN HÓA prop background thành danh sách chồng dưới
  // lên trên: giá trị đơn → 1 phần tử; "blurred" (tên cũ) →
  // "blurred-photo"; bỏ trùng giữ thứ tự; rỗng → ["solid"].
  const baseLayers = useMemo<BackgroundGroupId[]>(() => {
    const raw = Array.isArray(backgroundProp) ? backgroundProp : [backgroundProp];
    const out: BackgroundGroupId[] = [];
    for (const item of raw) {
      const layer = (item === "blurred" ? "blurred-photo" : item) as BackgroundGroupId;
      if (
        (layer === "solid" ||
          layer === "glow" ||
          layer === "blurred-photo" ||
          layer === "particles" ||
          layer === "motif") &&
        !out.includes(layer)
      ) {
        out.push(layer);
      }
    }
    return out.length > 0 ? out : ["solid"];
  }, [backgroundProp]);

  // Nền mờ hay không phụ thuộc vào tầng ĐẶC (không trong suốt) ở trên
  // cùng của danh sách đáy: ảnh mờ ở trên cùng → chữ trắng trên nền
  // tối (như chế độ "blurred" cũ); màu đặc ở trên cùng (che ảnh mờ)
  // → chữ theo màu cảnh như cũ. Không có ảnh thì không có nền mờ.
  const topOpaque = [...baseLayers]
    .reverse()
    .find((l) => l === "solid" || l === "blurred-photo");
  const blurredBg = topOpaque === "blurred-photo" && photos.length > 0;

  // Nền từng cảnh đổi màu theo ảnh; không có ảnh thì nền cover của mẫu.
  // Đáy blurred thì chữ luôn trắng trên nền tối (ảnh đã tối đi).
  const scene = SLIDESHOW_SCENES[index % SLIDESHOW_SCENES.length];
  // Màu của tầng "solid": màu cảnh khi có ảnh, màu cover khi không ảnh.
  const solidColor = photos.length === 0 ? preset.coverBg : scene.bg;
  const colors =
    photos.length === 0
      ? {
          text: preset.darkBg ? "#ffffff" : "#5a1f2b",
          muted: preset.darkBg ? "rgba(255,255,255,0.85)" : "rgba(90,31,43,0.72)",
          accent: preset.darkBg ? "#f6d365" : "#c9a86a",
        }
      : blurredBg
        ? { text: "#ffffff", muted: "rgba(255,255,255,0.85)", accent: "#f6d365" }
        : { text: scene.text, muted: scene.muted, accent: scene.accent };
  const textShadow =
    blurredBg || scene.dark || (photos.length === 0 && preset.darkBg)
      ? "0 2px 12px rgba(0,0,0,0.45)"
      : undefined;

  // Hướng Ken Burns đổi theo ảnh để không đơn điệu; dien-anh lia chậm
  // ngang (kiểu váy cưới: ảnh dài lia chậm), các biến thể khác zoom nhẹ.
  // Zoom tối đa 1.08 — chuyển nhẹ, ảnh gần như nguyên khung.
  const direction: KenBurnsDirection =
    resolveIntroVariant(fx, tpl.variant) === "dien-anh"
      ? index % 2 === 0
        ? "pan-left"
        : "pan-right"
      : index % 2 === 0
        ? "in"
        : "out";

  const advance = () => {
    if (photos.length > 1) setIndex((i) => (i + 1) % photos.length);
  };

  const lineClass = (kind: SlideshowLine["kind"]) =>
    kind === "name"
      ? "mt-3 block font-display text-3xl font-bold leading-tight sm:text-4xl"
      : kind === "phrase"
        ? "mt-3 block font-display text-3xl font-bold italic leading-tight sm:text-4xl"
        : kind === "date"
          ? "mt-3 block text-base"
          : "mt-2 block text-sm";
  const lineColor = (kind: SlideshowLine["kind"]) =>
    kind === "date" || kind === "venue" ? colors.muted : colors.text;

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{
        background: photos.length === 0 ? preset.coverBg : blurredBg ? "#141414" : scene.bg,
        transition: "background-color 1s ease",
      }}
      onClick={advance}
    >
      {/* Lớp đáy — DANH SÁCH chồng dưới lên trên (quy tắc chồng tầng):
          mỗi tầng con là một div phủ kín khung, vẽ theo thứ tự trong
          `baseLayers` (phần tử sau nằm trên phần tử trước). "solid" =
          màu cảnh/màu cover (đổi màu mượt 1s như container trước đây);
          "glow" = gradient nắng vàng loang từ trên xuống (bán trong
          suốt nên lớp dưới vẫn thấy); "blurred-photo" = chính ảnh đang
          hiện, phóng to 120% (scale 1.2) + blur nhẹ (20px) + tối nhẹ,
          làm nền sau Polaroid — vẫn nhận ra hình/đường nét ảnh gốc
          (chị chốt 2026-11-10 16:24: blur 56px/scale 2.2 cũ mờ quá);
          dùng lại ảnh đã tải (không tải thêm); giảm chuyển động thì đổi
          ảnh tức thì, không chuyển mờ. "particles"/"motif" không vẽ ở
          đáy slideshow (hạt bay thuộc lớp phủ, họa tiết thuộc bìa) nên
          bỏ qua. Mặc định ["solid", "blurred-photo"] từ 2026-11-10. */}
      {baseLayers.map((layer) => {
        if (layer === "solid") {
          return (
            <div
              key="solid"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: solidColor, transition: "background-color 1s ease" }}
            />
          );
        }
        if (layer === "glow") {
          return (
            <div
              key="glow"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: GLOW_GRADIENT }}
            />
          );
        }
        if (layer === "blurred-photo" && photos.length > 0) {
          return (
            <div
              key="blurred-photo"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ background: "#141414" }}
            >
              {reduce ? (
                <img
                  src={photos[index]}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ filter: "blur(20px) brightness(0.55)", transform: "scale(1.2)" }}
                />
              ) : (
                <AnimatePresence>
                  <motion.div
                    key={photos[index]}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                  >
                    <img
                      src={photos[index]}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ filter: "blur(20px) brightness(0.55)", transform: "scale(1.2)" }}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              <div className="absolute inset-0 bg-black/25" />
            </div>
          );
        }
        return null;
      })}

      {/* Lớp phủ theo biến thể (hoặc prop overlay) — phủ lên cả nội dung. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <AmbientLayer fx={overlayFx} templateId={data.templateId} />
      </div>

      {/* Dòng mời — giữ nguyên như trước. */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-7 text-center text-xs uppercase tracking-[0.35em]"
        style={{ color: colors.muted, textShadow }}
      >
        {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
      </motion.p>

      {/* Xếp ảnh scrapbook: ảnh hiện tại ở trên cùng, các ảnh trước nằm
          nghiêng phía dưới như chồng Polaroid; ảnh sắp tới đỗ sẵn dưới
          khung hình rồi trượt/xoay vào. Ảnh không mờ dần (opacity 1).
          DRIFT V2 (nguyên tắc chuyển ảnh, Nancy 2026-11-11 15:15):
          lúc nghỉ mỗi Polaroid bồng bềnh — DriftRest (±8px/±6px +
          xoay ±1° + scale 1,00 → 1,04, 6s — MOVE + ZOOM cùng lúc,
          giống nổi lơ lửng) bọc NGOÀI CẢ TẤM POLAROID (khung trắng +
          ảnh trôi cùng nhau) trong khung slot nên không đụng transform
          trượt/xoay của chồng ảnh; lúc chuyển, ảnh mới TRÔI MẠNH
          theo hướng chuyển mặc định — trượt từ dưới lên + xoay vào
          chồng trong 0,9s (chính cú trượt/xoay của slot). */}
      <div className="relative z-10 min-h-[52dvh] flex-1">
        {photos.map((src, i) => {
          const n = photos.length;
          // Vị trí trong chồng ảnh: 0 = trên cùng (ảnh hiện tại), 1-2 =
          // nằm dưới, >= 3 = đỗ ngoài khung hình, chờ trượt vào.
          const slot = (((index - i) % n) + n) % n;
          const rest = i % 2 === 0 ? -4 : 4;
          let transform: string;
          let z = 30 - slot;
          if (slot === 0) transform = `translate(-50%, -50%) rotate(${rest}deg) scale(1)`;
          else if (slot === 1)
            transform = "translate(-50%, -50%) translate(-9%, 4%) rotate(-9deg) scale(0.93)";
          else if (slot === 2)
            transform = "translate(-50%, -50%) translate(10%, 9%) rotate(8deg) scale(0.86)";
          else {
            // Đỗ ngoài khung hình, chờ trượt/xoay vào: đẩy xuống dưới
            // 120dvh (quá mép dưới mọi màn hình) để không ló vào che chữ
            // hay nút như translate % theo kích thước ảnh từng làm.
            transform = "translate(-50%, -50%) translate(55%, 120dvh) rotate(16deg) scale(0.9)";
            z = 5;
          }
          return (
            <div
              key={src}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 w-[min(80vw,380px)]"
              style={{ transform, zIndex: z, transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1)" }}
            >
              <DriftRest disabled={!!reduce}>
              <div data-testid="photo-frame" className="rounded-[4px] bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-[2px]">
                  <KenBurns duration={5.5} scale={1.08} direction={direction} disabled={!!reduce}>
                    <img
                      src={src}
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
              </div>
              </DriftRest>
            </div>
          );
        })}
      </div>

      {/* Chữ chạy theo từng ảnh: "sand" thì hạt cát rơi nhẹ từ trên
          xuống tụ lại thành chữ, lúc chuyển ảnh thì cát bay lên;
          "paper" thì từng chữ rơi xuống, lật rồi dán phẳng như tờ
          giấy (gia tốc tổng xuyên suốt theo hàm số mũ, các chữ chồng
          lên nhau lúc chuyển động);
          "scatter" thì Scatter & Reform chậm đã lưu (mảnh vụn bay về
          ghép chữ, lúc chuyển thì Shatter vỡ vụn bay đi). */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-6" style={{ minHeight: 190 }}>
        <AnimatePresence>
          <div
            key={photos.length === 0 ? "empty" : index}
            className="absolute inset-0 flex flex-col items-center justify-center pb-2 text-center"
          >
            {currentLines.map((line) =>
              textEffect === "sand" ? (
                <SandText
                  key={line.text}
                  text={line.text}
                  slideKey={photos.length === 0 ? 0 : index}
                  reduce={!!reduce}
                  className={`${lineClass(line.kind)} ${blurCls}`}
                  style={{ color: lineColor(line.kind), textShadow }}
                />
              ) : textEffect === "paper" ? (
                <PaperText
                  key={line.text}
                  text={line.text}
                  slideKey={photos.length === 0 ? 0 : index}
                  reduce={!!reduce}
                  className={`${lineClass(line.kind)} ${blurCls}`}
                  style={{ color: lineColor(line.kind), textShadow }}
                />
              ) : (
                <ShatterText
                  key={line.text}
                  text={line.text}
                  slideKey={photos.length === 0 ? 0 : index}
                  reduce={!!reduce}
                  className={`${lineClass(line.kind)} ${blurCls}`}
                  style={{ color: lineColor(line.kind), textShadow }}
                />
              )
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Chấm trang — chỉ khi có nhiều ảnh. */}
      {photos.length > 1 && (
        <div className="relative z-10 mt-2 flex justify-center gap-2" aria-hidden="true">
          {photos.map((p, i) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 opacity-50"}`}
              style={{ background: colors.text }}
            />
          ))}
        </div>
      )}

      {/* Nút vào thiệp — luôn thấy, sáng nhẹ để khách biết bấm vào đâu. */}
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
