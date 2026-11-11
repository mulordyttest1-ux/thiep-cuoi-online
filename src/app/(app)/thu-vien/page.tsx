// Trang quản lý thư viện hiệu ứng (2026-11-10, chị chủ chốt).
//
// QUY TẮC DEMO TRƯỚC KHI SỬA: trước khi sửa gì phải demo cho chị xem
// trước — trang này là chỗ chị xem + quản lý toàn bộ thư viện: hiệu ứng
// chữ (3), kiểu slide ảnh (5), hiệu ứng chuyển cảnh (7), nền (5 nhóm),
// biến thể effect (6), lớp phủ (4). Mỗi mục đều demo CHẠY THẬT bằng
// đúng component của app (không viết lại hiệu ứng giả): SandText/
// PaperText trực tiếp, IntroSlideshow thật cho scatter (ShatterText nằm
// trong file đó, không export riêng) và cho kiểu Scrapbook Polaroid,
// RomanticBrochureSlideshow thật cho kiểu Brochure lãng mạn, các
// slideshow thật cho từng chuyển cảnh, AmbientLayer thật cho hạt bay/
// lớp phủ, TemplateMotif thật cho họa tiết mẫu.
// Trang CHỈ ĐỂ XEM + DEMO + mở link demo — không đổi mặc định thật của
// app (đổi mặc định là việc riêng, chưa được duyệt).
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import AdminGate from "@/components/AdminGate";
import { SandText } from "@/components/SandText";
import { PaperText } from "@/components/PaperText";
import { IntroSlideshow } from "@/components/IntroSlideshow";
import { RomanticBrochureSlideshow } from "@/components/RomanticBrochureSlideshow";
import { PeachHeartSlideshow } from "@/components/PeachHeartSlideshow";
import { WarmConfessionSlideshow } from "@/components/WarmConfessionSlideshow";
import { ComicDiarySlideshow } from "@/components/ComicDiarySlideshow";
import { SLIDE_STYLES, type SlideStyle, type SlideStyleId } from "@/lib/slide-styles";
import {
  TRANSITIONS,
  TRANSITION_IDS,
  type SlideTransition,
  type TransitionId,
} from "@/lib/transitions";
import TemplateMotif from "@/components/TemplateMotif";
import { AmbientLayer } from "@/components/effects";
import { defaultInvitation, formatDateVi } from "@/lib/types";
import {
  PRESET_PHOTOS,
  TEMPLATES,
  VARIANT_LABELS,
  VARIANT_PRESETS,
  getTemplate,
  type EffectVariant,
  type TemplateEffects,
} from "@/lib/templates";
import { BACKGROUND_STYLES, getBackgroundStyle } from "@/lib/backgrounds";
import { OVERLAY_STYLES, getOverlayStyle, type OverlayId } from "@/lib/layers";
import { SLIDESHOW_SCENES, getIntroPreset, type TextEffectId } from "@/lib/intro";

/** Dữ liệu mẫu CHỈ ĐỂ TRƯNG BÀY (defaultInvitation) — cặp Minh Quân &
 *  Thu An, giống hệt trang demo /thiep/demo. KHÔNG phải dữ liệu thiệp
 *  thật, không lưu gì lên máy chủ. */
const DEMO_DATA = defaultInvitation("song-phung-do");
const DEMO_PHOTO = PRESET_PHOTOS[0].url;
const NAME_LINE = "Thu An & Minh Quân";
const DATE_LINE = `${formatDateVi(DEMO_DATA.date)}${DEMO_DATA.time ? ` • ${DEMO_DATA.time}` : ""}`;
const VENUE_LINE = [DEMO_DATA.venue, DEMO_DATA.address].filter(Boolean).join(" — ");

const TEXT_EFFECTS: { id: TextEffectId; name: string; desc: string; isDefault?: boolean }[] = [
  {
    id: "sand",
    name: "Hạt cát",
    desc: "Chữ vỡ thành hạt cát rơi nhẹ từ trên xuống, tụ lại thành chữ; lúc chuyển ảnh cát bay lên.",
    isDefault: true,
  },
  {
    id: "scatter",
    name: "Scatter chậm",
    desc: "Từng chữ cái bay về ghép lại thành chữ, đáp đủ sau ~3 giây (nhịp chung với cát/giấy dán); lúc chuyển ảnh chữ vỡ vụn bay đi.",
  },
  {
    id: "paper",
    name: "Giấy dán",
    desc: "Từng chữ rơi từ trên xuống, lật như lật trang rồi dán phẳng; nhanh dần theo hàm số mũ, đáp đủ sau ~3 giây (nhịp chung với cát/scatter).",
  },
];

const SCENE_NAMES = ["Đỏ đậm", "Hồng phấn", "Trắng kem", "Vàng hoàng hôn"];

/** Gradient vệt nắng của từng biến thể — Y HỆT chuỗi trong SunFlare
 *  (src/components/IntroCover.tsx); SunFlare không export riêng nên
 *  trang thư viện dùng lại đúng chuỗi đó để demo đúng vệt nắng thật. */
const FLARE_GRADIENTS: Record<EffectVariant, string> = {
  "le-nghi":
    "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(246,211,101,0.5) 0%, rgba(246,211,101,0.12) 55%, transparent 75%)",
  "hoa-bay":
    "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.75) 0%, rgba(246,211,101,0.18) 50%, transparent 75%)",
  "anh-vang":
    "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(246,211,101,0.65) 0%, rgba(212,175,55,0.2) 55%, transparent 78%)",
  "toi-gian":
    "radial-gradient(ellipse 45% 22% at 50% 0%, rgba(201,168,106,0.28) 0%, transparent 75%)",
  "dien-anh":
    "linear-gradient(115deg, transparent 42%, rgba(246,211,101,0.28) 48%, rgba(255,240,231,0.4) 50%, rgba(246,211,101,0.28) 52%, transparent 58%)",
  "le-hoi":
    "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(246,211,101,0.55) 0%, rgba(232,93,117,0.25) 45%, transparent 75%)",
};

/** Mẫu đại diện cho mỗi biến thể (để lấy họa tiết + bảng màu cho demo
 *  bìa): mẫu có motif rõ của biến thể đó, không dùng mẫu deco có ảnh
 *  artwork riêng. */
const VARIANT_TEMPLATE: Record<EffectVariant, string> = {
  "le-nghi": "long-phung",
  "hoa-bay": "hoa-moc",
  "anh-vang": "cam-thach-vang",
  "toi-gian": "minimal-do-do",
  "dien-anh": "song-phung-hong",
  "le-hoi": "vuon-hong",
};

/** Vệt nắng nhấp nháy như SunFlare thật (opacity 0.55 → 1 → 0.55, 4s). */
function FlarePulse({ gradient }: { gradient: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ background: gradient }}
      initial={{ opacity: 0.55 }}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Khung điện thoại thu nhỏ chứa slideshow thật (cả IntroSlideshow và
 *  RomanticBrochureSlideshow đều cao tối thiểu 100dvh nên không nhét
 *  trực tiếp vào thẻ được): render slideshow ở khổ 390px rồi co lại vừa
 *  chiều rộng thẻ, chiều cao đo thật sau khi render để không cắt chữ.
 *  slideStyle "scrapbook" (mặc định) = IntroSlideshow Polaroid;
 *  "romantic-brochure" = RomanticBrochureSlideshow; "peach-heart" =
 *  PeachHeartSlideshow; "warm-confession" = WarmConfessionSlideshow;
 *  "comic-diary" = ComicDiarySlideshow. photos mặc định 1 ảnh (chỉ
 *  xem bố cục); muốn thấy chuyển cảnh chạy thì truyền nhiều ảnh
 *  (thẻ chuyển cảnh truyền 3 ảnh để chuyển tự chạy 12s/lần). */
function SlideshowStage({
  textEffect,
  fx,
  replayKey,
  slideStyle = "scrapbook",
  photos = [DEMO_PHOTO],
}: {
  textEffect: TextEffectId;
  fx: TemplateEffects;
  replayKey: number;
  slideStyle?: SlideStyleId;
  photos?: string[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(640);
  useEffect(() => {
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (w <= 0) return;
      const s = w / 390;
      setScale(s);
      const inner = el.querySelector<HTMLElement>("[data-stage-inner]");
      const h = inner?.offsetHeight ?? 700;
      setHeight(Math.max(320, Math.ceil(h * s)));
    };
    measure();
    const t1 = window.setTimeout(measure, 400);
    const t2 = window.setTimeout(measure, 1500);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{ height }}
      data-testid="slideshow-stage"
    >
      <div
        data-stage-inner
        style={{ width: 390, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {slideStyle === "romantic-brochure" ? (
          <RomanticBrochureSlideshow
            key={replayKey}
            data={DEMO_DATA}
            fx={fx}
            photos={photos}
            textEffect={textEffect}
            onEnter={() => {}}
          />
        ) : slideStyle === "peach-heart" ? (
          <PeachHeartSlideshow
            key={replayKey}
            data={DEMO_DATA}
            fx={fx}
            photos={photos}
            textEffect={textEffect}
            onEnter={() => {}}
          />
        ) : slideStyle === "warm-confession" ? (
          <WarmConfessionSlideshow
            key={replayKey}
            data={DEMO_DATA}
            fx={fx}
            photos={photos}
            textEffect={textEffect}
            onEnter={() => {}}
          />
        ) : slideStyle === "comic-diary" ? (
          <ComicDiarySlideshow
            key={replayKey}
            data={DEMO_DATA}
            fx={fx}
            photos={photos}
            textEffect={textEffect}
            onEnter={() => {}}
          />
        ) : (
          <IntroSlideshow
            key={replayKey}
            data={DEMO_DATA}
            fx={fx}
            photos={photos}
            textEffect={textEffect}
            onEnter={() => {}}
          />
        )}
      </div>
    </div>
  );
}

function SectionHeading({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <div id={id} className="scroll-mt-20">
      <h2 className="font-display text-2xl font-bold text-[#7a1f2b]">{title}</h2>
      <p className="mt-1 text-sm text-[#5a4a48]">{desc}</p>
    </div>
  );
}

function CardShell({
  testId,
  title,
  code,
  desc,
  badge,
  children,
  footer,
}: {
  testId: string;
  title: string;
  code: string;
  desc: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article
      className="flex min-w-0 flex-col rounded-2xl border border-[#e8dcc8] bg-white p-4 shadow-sm"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-bold text-[#7a1f2b]">
            {title}{" "}
            <code className="rounded bg-[#f3e8d8] px-1.5 py-0.5 font-mono text-xs font-normal text-[#7a1f2b]">
              {code}
            </code>
          </h3>
          <p className="mt-1 text-sm text-[#5a4a48]">{desc}</p>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-[#c9a86a] px-2.5 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
      {footer && <div className="mt-3 flex flex-wrap items-center gap-2">{footer}</div>}
    </article>
  );
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5e1620]"
    >
      {label}
    </Link>
  );
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b] hover:bg-[#f3e8d8]"
    >
      ↻ Chạy lại
    </button>
  );
}

/** Thẻ hiệu ứng chữ — demo chạy thật trên 3 dòng mẫu. Cát/giấy dán dùng
 *  đúng component SandText/PaperText; scatter dùng slideshow thật vì
 *  ShatterText nằm trong IntroSlideshow (không export riêng). Chạy lại =
 *  remount (key) để hiệu ứng chạy lại từ đầu. */
function TextEffectCard({ effect }: { effect: (typeof TEXT_EFFECTS)[number] }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  return (
    <CardShell
      testId={`text-effect-${effect.id}`}
      title={effect.name}
      code={effect.id}
      desc={effect.desc}
      badge={effect.isDefault ? "Mặc định" : undefined}
      footer={
        <>
          <ReplayButton onClick={() => setRun((r) => r + 1)} />
          <DemoLink href={`/thiep/demo?tx=${effect.id}`} label="Xem trên trang demo →" />
        </>
      }
    >
      {effect.id === "scatter" ? (
        <SlideshowStage textEffect="scatter" fx={VARIANT_PRESETS["toi-gian"]} replayKey={run} />
      ) : (
        <div className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl bg-[#141414] px-4 py-10 text-center">
          {effect.id === "sand" ? (
            <>
              <SandText
                key={`n${run}`}
                text={NAME_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="block font-display text-3xl font-bold leading-tight"
                style={{ color: "#ffffff", textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
              />
              <SandText
                key={`d${run}`}
                text={DATE_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="mt-3 block text-base"
                style={{ color: "rgba(255,255,255,0.85)" }}
              />
              <SandText
                key={`v${run}`}
                text={VENUE_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="mt-2 block text-sm"
                style={{ color: "rgba(255,255,255,0.85)" }}
              />
            </>
          ) : (
            <>
              <PaperText
                key={`n${run}`}
                text={NAME_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="block font-display text-3xl font-bold leading-tight"
                style={{ color: "#ffffff", textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
              />
              <PaperText
                key={`d${run}`}
                text={DATE_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="mt-3 block text-base"
                style={{ color: "rgba(255,255,255,0.85)" }}
              />
              <PaperText
                key={`v${run}`}
                text={VENUE_LINE}
                slideKey={run}
                reduce={!!reduce}
                className="mt-2 block text-sm"
                style={{ color: "rgba(255,255,255,0.85)" }}
              />
            </>
          )}
        </div>
      )}
    </CardShell>
  );
}

/** Thẻ kiểu slide ảnh — demo chạy thật bằng đúng component slideshow
 *  của kiểu đó trong khung điện thoại thu nhỏ (SlideshowStage): Scrapbook
 *  Polaroid = IntroSlideshow thật, Brochure lãng mạn =
 *  RomanticBrochureSlideshow thật. Cả hai đều dùng đúng dữ liệu mẫu +
 *  đúng biến thể le-nghi của thiệp demo (mẫu Song Phụng Đỏ) nên demo
 *  trong thẻ khớp với link "Xem demo đầy đủ" (link mở với 6 ảnh để
 *  thấy hết các kiểu cần nhiều ảnh; demo thu nhỏ trong thẻ vẫn 1 ảnh).
 *  Chạy lại = remount (key). */
function SlideStyleCard({ style }: { style: SlideStyle }) {
  const [run, setRun] = useState(0);
  const isDefault = style.id === "scrapbook";
  const href = isDefault ? "/thiep/demo?photos=6" : `/thiep/demo?slide=${style.id}&photos=6`;
  return (
    <CardShell
      testId={`slide-style-${style.id}`}
      title={style.label}
      code={style.id}
      desc={style.description}
      badge={isDefault ? "Mặc định" : undefined}
      footer={
        <>
          <ReplayButton onClick={() => setRun((r) => r + 1)} />
          <DemoLink href={href} label="Xem demo đầy đủ →" />
        </>
      }
    >
      <SlideshowStage
        slideStyle={style.id}
        textEffect="sand"
        fx={VARIANT_PRESETS["le-nghi"]}
        replayKey={run}
      />
    </CardShell>
  );
}

/** Thẻ hiệu ứng chuyển cảnh — demo chạy thật bằng đúng slideshow của
 *  kiểu đang dùng chuyển đó, trong khung điện thoại thu nhỏ
 *  (SlideshowStage). Thẻ truyền 3 ảnh để chuyển cảnh tự chạy 12s/lần
 *  (1 ảnh thì không bao giờ chuyển); link "Xem demo đầy đủ" mở với 6
 *  ảnh để thấy hết các hướng của chuyển (vỡ + lắp, trang + màn kết).
 *  Tên/mô tả/thời gian/nguồn đọc từ registry TRANSITIONS. Chạy lại =
 *  remount (key). */
function TransitionCard({ transition }: { transition: SlideTransition }) {
  const [run, setRun] = useState(0);
  const cardPhotos = PRESET_PHOTOS.slice(0, 3).map((p) => p.url);
  return (
    <CardShell
      testId={`transition-${transition.id}`}
      title={transition.name}
      code={transition.id}
      desc={transition.description}
      badge={transition.extracted ? "Đã tách" : "Chưa tách"}
      footer={
        <>
          <ReplayButton onClick={() => setRun((r) => r + 1)} />
          <DemoLink href={transition.demoHref} label="Xem demo đầy đủ →" />
        </>
      }
    >
      <SlideshowStage
        slideStyle={transition.slideStyle}
        textEffect="sand"
        fx={VARIANT_PRESETS["le-nghi"]}
        replayKey={run}
        photos={cardPhotos}
      />
      <p className="mt-3 text-xs leading-relaxed text-[#7a6a68]">
        {transition.durationMs / 1000} giây · {transition.source}
        {transition.component ? ` · Component: ${transition.component}` : ""}
        {transition.note ? ` · ${transition.note}` : ""}
      </p>
    </CardShell>
  );
}

/** Thẻ nền — demo đúng kiểu nền đó sau chữ mẫu. Màu đặc: 4 màu cảnh
 *  thật (SLIDESHOW_SCENES) tự chuyển 3s/lần. Gradient nắng: vệt nắng
 *  "warm" thật của bìa. Nền mờ: đúng lớp blurred-photo của slideshow
 *  (ảnh phóng scale 1.2 + blur 20px + tối nhẹ, sau Polaroid nét).
 *  Hạt bay: AmbientLayer thật. Họa tiết: TemplateMotif thật của Song
 *  Phụng Đỏ trên nền bìa le-nghi. */
function BackgroundCard({ style }: { style: (typeof BACKGROUND_STYLES)[number] }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  useEffect(() => {
    if (style.id !== "solid") return;
    const t = window.setInterval(() => setSceneIdx((i) => (i + 1) % SLIDESHOW_SCENES.length), 3000);
    return () => window.clearInterval(t);
  }, [style.id]);
  const scene = SLIDESHOW_SCENES[sceneIdx];
  const coverBg = getIntroPreset("le-nghi").coverBg;
  return (
    <CardShell
      testId={`background-${style.id}`}
      title={style.name}
      code={style.id}
      desc={style.description}
      badge={style.id === "blurred-photo" ? "Mặc định slideshow" : undefined}
      footer={
        <>
          <span className="text-xs text-[#7a6a68]">
            Biến thể dùng: {style.variants.map((v) => VARIANT_LABELS[v]).join(", ")}
          </span>
          <DemoLink href="/thiep/demo" label="Xem slideshow thật →" />
        </>
      }
    >
      {style.id === "solid" && (
        <div
          className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
          style={{ background: scene.bg, transition: "background-color 1s ease" }}
        >
          <p className="font-display text-2xl font-bold" style={{ color: scene.text }}>
            {NAME_LINE}
          </p>
          <p className="mt-2 text-sm" style={{ color: scene.muted }}>
            {DATE_LINE}
          </p>
          <div className="mt-4 flex gap-2" role="group" aria-label="Chọn màu cảnh">
            {SLIDESHOW_SCENES.map((s, i) => (
              <button
                key={s.bg}
                type="button"
                onClick={() => setSceneIdx(i)}
                aria-label={`Màu ${SCENE_NAMES[i]} ${s.bg}`}
                aria-pressed={i === sceneIdx}
                className="h-7 w-7 rounded-full border-2"
                style={{
                  background: s.bg,
                  borderColor: i === sceneIdx ? "#ffffff" : "rgba(0,0,0,0.2)",
                  boxShadow: i === sceneIdx ? "0 0 0 2px rgba(0,0,0,0.35)" : undefined,
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: scene.muted }}>
            Đang xem: {SCENE_NAMES[sceneIdx]} {scene.bg} — tự đổi 3 giây/lần, bấm chấm để chọn màu
          </p>
        </div>
      )}
      {style.id === "glow" && (
        <div
          className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
          style={{ background: coverBg }}
        >
          <FlarePulse gradient={FLARE_GRADIENTS["le-nghi"]} />
          <p
            className="relative font-display text-2xl font-bold text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
          >
            {NAME_LINE}
          </p>
          <p className="relative mt-2 text-sm text-white/85">{DATE_LINE}</p>
          <p className="relative mt-2 text-xs text-white/60">Vệt nắng “warm” của bìa le-nghi</p>
        </div>
      )}
      {style.id === "blurred-photo" && (
        <div
          className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
          style={{ background: "#141414" }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={DEMO_PHOTO}
              alt=""
              className="h-full w-full object-cover"
              style={{ filter: "blur(20px) brightness(0.55)", transform: "scale(1.2)" }}
            />
            <div className="absolute inset-0 bg-black/25" />
          </div>
          <div className="relative w-28 rotate-[-4deg] rounded-[4px] bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="aspect-[4/5] overflow-hidden rounded-[2px]">
              <img src={DEMO_PHOTO} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
          <p
            className="relative mt-4 font-display text-2xl font-bold text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
          >
            {NAME_LINE}
          </p>
          <p className="relative mt-1 text-sm text-white/85">{DATE_LINE}</p>
        </div>
      )}
      {style.id === "particles" && (
        <div
          className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
          style={{ background: getIntroPreset("hoa-bay").coverBg }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <AmbientLayer fx={VARIANT_PRESETS["hoa-bay"]} templateId={DEMO_DATA.templateId} />
          </div>
          <p className="relative font-display text-2xl font-bold text-[#7a1f2b]">{NAME_LINE}</p>
          <p className="relative mt-2 text-sm text-[#7a1f2b]/80">{DATE_LINE}</p>
          <p className="relative mt-2 text-xs text-[#7a1f2b]/60">Cánh hoa rơi của hoa-bay (14 cánh)</p>
        </div>
      )}
      {style.id === "motif" && (
        <div
          className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
          style={{ background: coverBg }}
        >
          <FlarePulse gradient={FLARE_GRADIENTS["le-nghi"]} />
          <div className="relative">
            <TemplateMotif motif="phoenix" accent="#710001" gold="#c9a86a" size="lg" light />
          </div>
          <p className="relative mt-8 text-sm tracking-[0.3em] text-white/70">Chạm để tiếp tục</p>
          <p className="relative mt-2 text-xs text-white/60">Họa tiết phượng của mẫu Song Phụng Đỏ</p>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-[#7a6a68]">{style.usedIn}</p>
    </CardShell>
  );
}

/** Thẻ biến thể — demo nhỏ kiểu bìa: nền cover + vệt nắng + lớp phủ
 *  AmbientLayer thật của biến thể + họa tiết mẫu đại diện. */
function VariantCard({ variant }: { variant: EffectVariant }) {
  const preset = VARIANT_PRESETS[variant];
  const intro = getIntroPreset(variant);
  const tpl = getTemplate(VARIANT_TEMPLATE[variant]);
  const templates = TEMPLATES.filter((t) => t.variant === variant);
  const backgroundNames = (preset.background ?? ["solid"]).map((id) => getBackgroundStyle(id).name);
  const overlayNames = (preset.overlay ?? []).map((id) => getOverlayStyle(id).name);
  return (
    <CardShell
      testId={`variant-${variant}`}
      title={VARIANT_LABELS[variant]}
      code={variant}
      desc={`Bìa ${intro.label} — tự chạy ${intro.coverDurationMs / 1000} giây rồi sang bộ sưu tập.`}
      footer={
        <>
          <DemoLink href={`/thiep/demo?fx=${variant}`} label="Xem demo biến thể →" />
        </>
      }
    >
      <div
        className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
        style={{ background: intro.coverBg }}
      >
        <FlarePulse gradient={FLARE_GRADIENTS[variant]} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <AmbientLayer fx={preset} templateId={tpl.id} />
        </div>
        <div className="relative">
          <TemplateMotif
            motif={tpl.motif}
            accent={tpl.palette.accent}
            gold={tpl.palette.gold}
            size="lg"
            light={intro.darkBg}
          />
        </div>
        <p
          className={`relative mt-6 text-sm tracking-[0.3em] ${intro.darkBg ? "text-white/70" : "text-[#7a6a68]"}`}
        >
          Chạm để tiếp tục
        </p>
      </div>
      <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-[#5a4a48]">
        <p>
          <span className="font-semibold text-[#7a1f2b]">Nền: </span>
          {backgroundNames.join(" → ")}
        </p>
        <p>
          <span className="font-semibold text-[#7a1f2b]">Phủ: </span>
          {overlayNames.length > 0 ? overlayNames.join(", ") : "Không phủ"}
        </p>
        <p>
          <span className="font-semibold text-[#7a1f2b]">Mẫu dùng: </span>
          {templates
            .slice(0, 3)
            .map((t) => t.name)
            .join(", ")}
          {templates.length > 3 ? ` +${templates.length - 3} mẫu nữa` : ""}
        </p>
      </div>
    </CardShell>
  );
}

/** Lớp phủ chạy trên nền tối + chữ mẫu. Ánh nắng chỉ có ở bìa nên demo
 *  bằng vệt nắng warm thật của bìa; tia/cánh/bokeh dùng AmbientLayer
 *  thật với đúng cấu hình của từng loại. */
function overlayFx(id: OverlayId): TemplateEffects {
  switch (id) {
    case "sparkle":
      return { ambient: { kind: "sparkle", count: 16 }, twinkle: { count: 12 } };
    case "petals":
      return {
        ambient: {
          kind: "petals",
          petals: 14,
          petalColors: ["#ffb2b2", "#f6d365", "#e8c87e", "#f9c5d5"],
        },
      };
    case "bokeh":
      return { ambient: { kind: "bokeh", count: 10 } };
    case "sun":
    default:
      return {};
  }
}

function OverlayCard({ style }: { style: (typeof OVERLAY_STYLES)[number] }) {
  return (
    <CardShell
      testId={`overlay-${style.id}`}
      title={style.name}
      code={style.id}
      desc={style.description}
      footer={
        <span className="text-xs text-[#7a6a68]">
          Biến thể dùng: {style.variants.map((v) => VARIANT_LABELS[v]).join(", ")}
        </span>
      }
    >
      <div
        className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-8 text-center"
        style={{
          background: style.id === "sun" ? getIntroPreset("le-nghi").coverBg : "#141414",
        }}
      >
        {style.id === "sun" ? (
          <FlarePulse gradient={FLARE_GRADIENTS["le-nghi"]} />
        ) : (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <AmbientLayer fx={overlayFx(style.id)} templateId={DEMO_DATA.templateId} />
          </div>
        )}
        <p
          className="relative font-display text-2xl font-bold text-white"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
        >
          {NAME_LINE}
        </p>
        <p className="relative mt-2 text-sm text-white/85">{DATE_LINE}</p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#7a6a68]">{style.usedIn}</p>
    </CardShell>
  );
}

export default function LibraryPage() {
  const [picked, setPicked] = useState<TextEffectId | null>(null);
  const pickRandom = () => {
    const ids: TextEffectId[] = ["sand", "scatter", "paper"];
    const id = ids[Math.floor(Math.random() * ids.length)];
    setPicked(id);
    window.open(`/thiep/demo?tx=${id}`, "_blank", "noopener,noreferrer");
  };
  const pickedName = picked ? (TEXT_EFFECTS.find((t) => t.id === picked)?.name ?? picked) : null;
  const [pickedTransition, setPickedTransition] = useState<TransitionId | null>(null);
  const pickRandomTransition = () => {
    const id = TRANSITION_IDS[Math.floor(Math.random() * TRANSITION_IDS.length)];
    setPickedTransition(id);
    window.open(TRANSITIONS[id].demoHref, "_blank", "noopener,noreferrer");
  };
  const pickedTransitionName = pickedTransition ? TRANSITIONS[pickedTransition].name : null;
  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Điều hướng khu vực riêng">
          <Link href="/tao-thiep" className="rounded-full border border-[#c9a86a] px-3 py-1.5 text-[#7a1f2b] hover:bg-[#f3e8d8]">
            Tạo thiệp
          </Link>
          <Link href="/quan-ly" className="rounded-full border border-[#c9a86a] px-3 py-1.5 text-[#7a1f2b] hover:bg-[#f3e8d8]">
            Quản lý khách mời
          </Link>
          <span className="rounded-full bg-[#7a1f2b] px-3 py-1.5 font-semibold text-white" aria-current="page">
            Thư viện hiệu ứng
          </span>
        </nav>

        <h1 className="mt-6 font-display text-4xl font-bold text-[#7a1f2b]">Thư viện hiệu ứng</h1>
        <p className="mt-2 max-w-3xl text-[#5a4a48]">
          Mọi mục dưới đây đều chạy thật bằng đúng hiệu ứng trong app — chị xem trước rồi mới chốt
          sửa, khỏi sửa xong mới thấy sai ý. Trang này chỉ để xem + demo, không đổi mặc định thật
          của app. Dữ liệu demo là cặp Minh Quân &amp; Thu An (như trang demo), không phải thiệp
          thật.
        </p>

        <section className="mt-10" data-testid="section-text-effects">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              id="hieu-ung-chu"
              title="Hiệu ứng chữ"
              desc="Chữ chạy trong slideshow intro — demo chạy thật trên dòng mẫu Thu An & Minh Quân. Mặc định của app đang là Hạt cát."
            />
            <div className="text-right">
              <button
                type="button"
                onClick={pickRandom}
                data-testid="random-text-effect"
                className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]"
              >
                🎲 Bốc ngẫu nhiên
              </button>
              {picked && (
                <p className="mt-2 text-sm text-[#5a4a48]" data-testid="random-picked">
                  Đã bốc: <strong className="text-[#7a1f2b]">{pickedName}</strong> ({picked}) — đang
                  mở trang demo…{" "}
                  <Link
                    href={`/thiep/demo?tx=${picked}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#7a1f2b] underline"
                  >
                    Mở lại
                  </Link>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TEXT_EFFECTS.map((effect) => (
              <TextEffectCard key={effect.id} effect={effect} />
            ))}
          </div>
        </section>

        <section className="mt-12" data-testid="section-slide-styles">
          <SectionHeading
            id="kieu-slide-anh"
            title="Kiểu slide ảnh"
            desc="Ảnh dâu rể trong intro — 5 kiểu slide ảnh đã live: Polaroid scrapbook mặc định, Brochure lãng mạn, Trái Tim Đào, Tỏ Tình Ấm Áp và Nhật Ký Truyện Tranh. Demo chạy thật trong khung nhỏ; bấm xem demo đầy đủ để thấy cả intro của kiểu đó."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {(Object.keys(SLIDE_STYLES) as SlideStyleId[]).map((id) => (
              <SlideStyleCard key={id} style={SLIDE_STYLES[id]} />
            ))}
          </div>
        </section>

        <section className="mt-12" data-testid="section-transitions">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              id="hieu-ung-chuyen-canh"
              title="Hiệu ứng chuyển cảnh"
              desc="7 chuyển cảnh trong thư viện — mỗi món đặt tên riêng, dùng lại được cho mọi kiểu slide (món “Đã tách” đã thành component riêng trong src/components/transitions/). Demo chạy thật trong khung nhỏ với 3 ảnh để chuyển tự chạy 12 giây/lần; bấm xem demo đầy đủ để thấy cả intro với 6 ảnh."
            />
            <div className="text-right">
              <button
                type="button"
                onClick={pickRandomTransition}
                data-testid="random-transition"
                className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]"
              >
                🎲 Bốc ngẫu nhiên
              </button>
              {pickedTransition && (
                <p className="mt-2 text-sm text-[#5a4a48]" data-testid="random-transition-picked">
                  Đã bốc: <strong className="text-[#7a1f2b]">{pickedTransitionName}</strong> (
                  {pickedTransition}) — đang mở trang demo…{" "}
                  <Link
                    href={TRANSITIONS[pickedTransition].demoHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#7a1f2b] underline"
                  >
                    Mở lại
                  </Link>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TRANSITION_IDS.map((id) => (
              <TransitionCard key={id} transition={TRANSITIONS[id]} />
            ))}
          </div>
        </section>

        <section className="mt-12" data-testid="section-backgrounds">
          <SectionHeading
            id="nen"
            title="Nền"
            desc="5 kiểu nền trong thư viện — demo đúng kiểu nền đó sau chữ mẫu. Mặc định của slideshow đang là Nền mờ từ ảnh."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BACKGROUND_STYLES.map((style) => (
              <BackgroundCard key={style.id} style={style} />
            ))}
          </div>
        </section>

        <section className="mt-12" data-testid="section-variants">
          <SectionHeading
            id="bien-the"
            title="Biến thể effect"
            desc="6 biến thể effect đặt tên — mỗi biến thể là một bộ nền + phủ cố định, gán cho các mẫu thiệp. Demo nhỏ kiểu bìa; bấm xem demo để thấy cả intro của biến thể đó."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(VARIANT_PRESETS) as EffectVariant[]).map((variant) => (
              <VariantCard key={variant} variant={variant} />
            ))}
          </div>
        </section>

        <section className="mt-12" data-testid="section-overlays">
          <SectionHeading
            id="lop-phu"
            title="Lớp phủ"
            desc="4 lớp phủ chồng lên trên nội dung — ánh nắng chỉ có ở bìa, còn tia lấp lánh / cánh hoa / bokeh chạy cả ở slideshow lẫn trang khách."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OVERLAY_STYLES.map((style) => (
              <OverlayCard key={style.id} style={style} />
            ))}
          </div>
        </section>

        <p className="mt-10 rounded-xl bg-[#f3e8d8] px-4 py-3 text-sm text-[#5a4a48]">
          Muốn đổi mặc định hiệu ứng chữ, nền, kiểu slide ảnh hay chuyển cảnh của app, hoặc bốc
          ngẫu nhiên cho mẫu mới — nói em, em làm riêng. Trang này không tự đổi gì cả.
        </p>
      </div>
    </AdminGate>
  );
}
