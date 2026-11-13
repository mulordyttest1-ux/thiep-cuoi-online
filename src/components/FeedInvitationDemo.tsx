// Demo kiểu trình bày FEED cho thiệp online — lấy cảm hứng trình bày từ mẫu
// ZenLove "Orchid Keepsake" (research_notes/zenlove-orchid-keepsake/
// code-analysis.md): cột hẹp cỡ điện thoại, ảnh lồng tràn viền xen kẽ khối
// chữ, thanh tương tác cố định + tự động cuộn.
// PIPELINE HIỆU ỨNG (theo cơ chế của mẫu, code + keyframe tự viết — không
// copy code/tài nguyên của họ):
//   Lớp 1 — Reveal: cả khối trồi lên 40px/0,7s khi lọt khung (giữ từ PR #66).
//   Lớp 2 — Fx: từng phần tử (chữ/ảnh) có kiểu xuất hiện RIÊNG: 12 kiểu
//     (fade-in, slide 4 hướng, scale, rotate, bounce, flip, zoom-in), mỗi
//     phần tử chỉnh duration/delay/easing riêng; chưa lọt khung thì ẩn
//     (opacity 0), lọt khung mới chạy đúng kiểu đã chọn, 1 lần.
//   Lớp 3 — FeedTimeline: chạy NỐI TIẾP — trục vẽ ra trước (scaleX 0→1,
//     600ms) rồi từng mốc fade-up lệch nhau 150ms (data-tl-anim
//     waiting → playing).
//   Lớp 4 — Tự cuộn rAF: 60px/giây, tự chạy sau 1 giây, bấm đâu cũng
//     bật/tắt (trừ link/nút/input/bôi đen), lăn/chạm thì dừng, tới cuối
//     thì dừng, người dùng can thiệp giữa chừng thì đồng bộ lại vị trí.
// CHỈ LÀ DEMO (?layout=feed trên /thiep/demo): không đụng thiệp thật, không
// dùng tài nguyên/thiết kế của ZenLove — màu, chữ, họa tiết (dấu sáp vẽ bằng
// code) và ảnh đều là của ChungĐôi; câu chữ lấy từ dữ liệu demo của app.
"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { formatDateVi, parseDressCode, parseSchedule } from "@/lib/types";
import { getDateParts } from "@/lib/lunar";
import { PRESET_PHOTOS } from "@/lib/templates";
import Countdown from "./Countdown";

const OLIVE = "#4a5d23";
const OLIVE_SOFT = "#6b7f3e";
const SAGE = "#8a9a6b";
const CREAM = "#f7f2e7";
const PAPER = "#fffdf6";
const INK = "#2e3a1e";

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

// Khối trồi khi cuộn tới: gắn class armed (ẩn + tụt 40px), IntersectionObserver
// thấy lọt khung thì gắn visible + done (hiện + trồi lên), hết transition thì
// gỡ armed + visible, chỉ giữ done. Giảm chuyển động hoặc không có
// IntersectionObserver: hiện luôn, không hiệu ứng.
function Reveal({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("feed-reveal-visible", "feed-reveal-done");
          target.addEventListener(
            "transitionend",
            () => target.classList.remove("feed-reveal-armed", "feed-reveal-visible"),
            { once: true }
          );
          io.unobserve(target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 }
    );
    el.classList.add("feed-reveal-armed");
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={["feed-reveal", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

// Hiệu ứng từng phần tử (lớp 2): 12 kiểu chọn, map sang keyframe tự viết
// (tên keyframe theo quy ước chung của animate.css, code keyframe là của
// mình trong globals.css). Chưa lọt khung: opacity 0; lọt khung
// (IntersectionObserver threshold 0,1, rootMargin -50px dưới): chạy
// animation 1 lần, fillMode both. Giảm chuyển động: hiện luôn.
type FxKind =
  | "fade-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "scale-out"
  | "rotate-in"
  | "rotate-out"
  | "bounce-in"
  | "flip-in"
  | "zoom-in";

const FX_ANIMATION: Record<FxKind, string> = {
  "fade-in": "feedFadeIn",
  "slide-up": "feedSlideInUp",
  "slide-down": "feedSlideInDown",
  // Vào từ phải rồi trượt sang trái / vào từ trái rồi trượt sang phải
  // (theo đúng map của mẫu).
  "slide-left": "feedSlideInRight",
  "slide-right": "feedSlideInLeft",
  "scale-in": "feedZoomIn",
  "scale-out": "feedZoomIn",
  "rotate-in": "feedRotateIn",
  "rotate-out": "feedRotateIn",
  "bounce-in": "feedBounceIn",
  "flip-in": "feedFlipInY",
  "zoom-in": "feedZoomIn",
};

function Fx({
  fx = "fade-in",
  duration = 1.5,
  delay = 0,
  easing = "ease",
  children,
  className,
  style,
  ariaLabel,
}: {
  fx?: FxKind;
  duration?: number;
  delay?: number;
  easing?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("feed-fx-play");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={["feed-fx", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      style={
        {
          ...style,
          "--feed-fx-name": FX_ANIMATION[fx],
          "--feed-fx-duration": `${duration}s`,
          "--feed-fx-delay": `${delay}s`,
          "--feed-fx-easing": easing,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

// Timeline chạy nối tiếp (lớp 3): trục vẽ ra trước (scaleX 0→1, 600ms),
// rồi từng mốc fade-up lệch nhau 150ms/mốc qua biến --tl-i. Máy trạng thái
// bằng attribute data-tl-anim="waiting" | "playing".
function FeedTimeline({ schedule }: { schedule: { time: string; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [anim, setAnim] = useState<"waiting" | "playing">("waiting");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAnim("playing");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setAnim("playing");
          io.disconnect();
        });
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const items = schedule.slice(0, 4);
  return (
    <div ref={ref} className="feed-tl relative mt-6" data-tl-anim={anim}>
      <span aria-hidden="true" className="feed-tl-axis absolute left-2 right-2 top-[7px] border-t-2 border-dotted" style={{ borderColor: OLIVE }} />
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
        {items.map((s, i) => (
          <div key={i} className="feed-tl-item flex flex-col items-center px-1" style={{ "--tl-i": i } as React.CSSProperties}>
            <span className="relative z-10 block h-3.5 w-3.5 rounded-full border-2 border-white shadow" style={{ background: OLIVE }} />
            <span className="mt-2 text-[13px] font-bold" style={{ color: OLIVE }}>{s.time}</span>
            <span className="mt-0.5 px-0.5 text-[11px] leading-tight">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dấu sáp vẽ bằng code: vòng tròn olive 2 viền + hoa trắng 5 cánh ở giữa.
function WaxSeal({ size = 64 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: OLIVE, border: "2px solid #fffdf6", outline: `1px solid ${OLIVE}`, outlineOffset: 3 }}
    >
      <svg viewBox="0 0 24 24" style={{ width: size * 0.55, height: size * 0.55, fill: "#fffdf6" }}>
        <g>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="12" cy="7.5" rx="2.6" ry="4.2" transform={`rotate(${deg} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="2.4" fill={OLIVE} stroke="#fffdf6" strokeWidth="0.8" />
        </g>
      </svg>
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>
      {children}
    </p>
  );
}

export default function FeedInvitationDemo({ data }: { data: InvitationData }) {
  const [liked, setLiked] = useState(false);
  // Tự cuộn MẶC ĐỊNH BẬT như mẫu: tự chạy sau 1 giây.
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);
  const autoRef = useRef(true);
  autoRef.current = auto;

  // Tự động cuộn bằng requestAnimationFrame theo thời gian: 60px/giây
  // (0,06px/ms), tự chạy sau 1 giây; lăn/chạm thì dừng; bấm vào thiệp thì
  // bật/tắt (xem useEffect bấm bên dưới); tới cuối trang thì dừng; người
  // dùng can thiệp giữa chừng thì đồng bộ lại vị trí thay vì giật về.
  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    let last = 0;
    let expected = window.scrollY;
    let started = false;
    const step = (t: number) => {
      if (!autoRef.current || !started) return;
      const dt = t - last;
      last = t;
      if (Math.abs(window.scrollY - expected) > 2) expected = window.scrollY;
      expected += dt * 0.06;
      window.scrollTo(0, expected);
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
        setAuto(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    const startTimer = window.setTimeout(() => {
      started = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }, 1000);
    const stop = () => setAuto(false);
    const onCancel = () => setAuto(false);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("auto-scroll-cancel", onCancel);
    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("auto-scroll-cancel", onCancel);
    };
  }, [auto]);

  // Bấm vào bất cứ đâu trên thiệp thì bật/tắt tự cuộn — trừ bấm link, nút,
  // ô nhập hoặc đang bôi đen chữ (như cơ chế của mẫu).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, input, textarea, select")) return;
      if (window.getSelection()?.toString()) return;
      setAuto((v) => !v);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const parts = getDateParts(data.date);
  const schedule = parseSchedule(data.scheduleText);
  const dressColors = parseDressCode(data.dressCode);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.venue} ${data.address}`.trim()
  )}`;
  const dateDots = data.date ? data.date.split("-").reverse().join(".") : "";
  const ceremonyTime = data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
  // Giờ tiệc lấy từ lịch trình ("Tiệc mừng" 12:00) khi có, tránh hiển thị
  // trùng giờ lễ (11:00) trong khi timeline ghi tiệc 12:00.
  const partyTime = schedule.find((s) => /tiệc/i.test(s.label))?.time ?? data.time;

  // Lịch tháng cưới: lưới 7 cột, tuần bắt đầu thứ Hai, tim đánh dấu ngày cưới.
  let calCells: (number | null)[] = [];
  let calDay = 0;
  if (data.date) {
    try {
      const d = new Date(`${data.date}T00:00:00`);
      if (!isNaN(d.getTime())) {
        calDay = d.getDate();
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        calCells = [...Array<number | null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
      }
    } catch {
      calCells = [];
    }
  }
  const calTitle = parts ? `Tháng ${Number(data.date.split("-")[1])} / ${parts.year}` : "";

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const railBtn =
    "flex w-11 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold shadow-md transition-transform active:scale-90";

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: INK }}>
      {/* Cột feed hẹp cỡ điện thoại, căn giữa — như mẫu tham khảo. */}
      <div className="relative mx-auto w-full max-w-[490px] px-4 pb-16">
        {/* Thanh tương tác cố định (desktop): Thích / Tự cuộn / Chia sẻ / Lên đầu. */}
        <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex" aria-hidden={false}>
          <button type="button" onClick={() => setLiked((v) => !v)} className={railBtn} style={{ background: PAPER, color: liked ? "#c1272d" : OLIVE }} aria-label="Thích">
            <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ fill: liked ? "#c1272d" : "none", stroke: liked ? "#c1272d" : OLIVE, strokeWidth: 1.8 }}>
              <path d={HEART_PATH} />
            </svg>
            {liked ? 1 : 0}
          </button>
          <button type="button" onClick={() => setAuto((v) => !v)} className={railBtn} style={{ background: auto ? OLIVE : PAPER, color: auto ? "#fff" : OLIVE }} aria-label="Tự động cuộn">
            <span className="text-base leading-none">{auto ? "❚❚" : "▶"}</span>
            Tự cuộn
          </button>
          <button type="button" onClick={share} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Chia sẻ">
            <span className="text-base leading-none">↗</span>
            {copied ? "Đã sao chép" : "Chia sẻ"}
          </button>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Lên đầu">
            <span className="text-base leading-none">↑</span>
            Lên đầu
          </button>
        </div>
        {/* Nút tự cuộn nổi trên điện thoại. */}
        <button
          type="button"
          onClick={() => setAuto((v) => !v)}
          className="fixed bottom-5 right-5 z-40 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg md:hidden"
          style={{ background: auto ? OLIVE : PAPER, color: auto ? "#fff" : OLIVE }}
        >
          {auto ? "❚❚ Dừng cuộn" : "▶ Tự cuộn"}
        </button>

        {/* 1. Bìa: 2 ảnh Polaroid nghiêng chồng nhau + Save our date + ngày. */}
        <section className="pt-10 text-center" aria-label="Bìa thiệp">
          <Reveal>
            <div className="relative mx-auto h-[340px] w-full max-w-[340px]">
              <div className="absolute left-0 top-2 w-[50%] -rotate-4 rounded-lg bg-white p-2 pb-6 shadow-lg">
                <Fx fx="slide-up" duration={1.2} delay={0.1}>
                  <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                  <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Save our date</p>
                </Fx>
              </div>
              <div className="absolute right-0 top-10 w-[50%] rotate-4 rounded-lg bg-white p-2 pb-6 shadow-lg">
                <Fx fx="slide-up" duration={1.2} delay={0.35}>
                  <img src={PRESET_PHOTOS[1].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                  <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>{dateDots}</p>
                </Fx>
              </div>
              <div className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2">
                <Fx fx="scale-in" duration={1} delay={0.5}>
                  <WaxSeal size={56} />
                </Fx>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <Fx fx="zoom-in" duration={1.5}>
              <h1 className="font-display mt-8 text-4xl font-bold leading-tight" style={{ color: OLIVE }}>
                {data.groomName} &amp; {data.brideName}
              </h1>
            </Fx>
            <Fx fx="fade-in" duration={1.2} delay={0.2}>
              <p className="mt-2 text-sm tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
                {formatDateVi(data.date)}
              </p>
            </Fx>
          </Reveal>
        </section>

        {/* 2. Ảnh lồng tràn viền. */}
        <Reveal className="-mx-4 mt-10 w-[calc(100%+2rem)]">
          <Fx fx="zoom-in" duration={1.5}>
            <img src={PRESET_PHOTOS[2].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Fx>
        </Reveal>

        {/* 3. Lời mời: cha mẹ 2 bên + tên lớn. */}
        <section className="mt-12 text-center" aria-label="Lời mời">
          <Reveal>
            <Fx fx="fade-in">
              <SectionLabel>Trân trọng kính mời</SectionLabel>
            </Fx>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-4 text-sm">
              <Fx fx="slide-right">
                <p className="font-semibold" style={{ color: OLIVE }}>Nhà trai</p>
                <p>{data.groomFather}</p>
                <p>{data.groomMother}</p>
              </Fx>
              <Fx fx="slide-left">
                <p className="font-semibold" style={{ color: OLIVE }}>Nhà gái</p>
                <p>{data.brideFather}</p>
                <p>{data.brideMother}</p>
              </Fx>
            </div>
          </Reveal>
          <Reveal>
            <Fx fx="zoom-in" duration={1.5}>
              <h2 className="font-display mt-8 text-4xl font-bold leading-tight" style={{ color: OLIVE }}>
                {data.groomName} <span className="mx-2" style={{ color: "#c9a86a" }}>&amp;</span> {data.brideName}
              </h2>
            </Fx>
            <Fx fx="fade-in" delay={0.2}>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed" style={{ color: INK }}>
                Cùng gia đình hai bên trân trọng kính mời Quý Khách đến chung vui cùng gia đình chúng tôi.
              </p>
            </Fx>
          </Reveal>
        </section>

        {/* 4. Ngày giờ: 3 cột thứ | ngày | tháng năm + giờ + chỉ đường. */}
        <section className="mt-12 text-center" aria-label="Ngày giờ">
          <Reveal>
            <Fx fx="fade-in">
              <SectionLabel>Bữa tiệc chung vui</SectionLabel>
            </Fx>
            {parts && (
              <>
                <div className="mt-4 flex items-center justify-center" style={{ color: OLIVE }}>
                  <Fx fx="slide-right" className="w-auto min-w-[70px] whitespace-nowrap text-right text-[15px] font-semibold uppercase">{parts.weekday}</Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="fade-in" delay={0.15} className="text-[34px] font-bold leading-none">{parts.day}</Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="slide-left" delay={0.3} className="whitespace-nowrap text-left text-[15px] font-semibold uppercase">{parts.monthDisplay}</Fx>
                </div>
                <Fx fx="fade-in" delay={0.4}>
                  <p className="mt-1 text-xl font-semibold" style={{ color: OLIVE }}>{parts.year}</p>
                </Fx>
                {parts.lunarNote && (
                  <Fx fx="fade-in" delay={0.5}>
                    <p className="mt-1 text-[13px]" style={{ color: OLIVE_SOFT }}>({parts.lunarNote})</p>
                  </Fx>
                )}
              </>
            )}
            <Fx fx="fade-in" delay={0.6}>
              <p className="mt-4 text-lg font-semibold" style={{ color: OLIVE }}>Vào lúc {partyTime}</p>
            </Fx>
            <Fx fx="fade-in" delay={0.7}>
              <p className="mt-1 font-semibold">{data.venue}</p>
              <p className="text-sm" style={{ color: OLIVE_SOFT }}>{data.address}</p>
            </Fx>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: OLIVE }}>
              Xem chỉ đường ↗
            </a>
          </Reveal>
        </section>

        {/* 5. Lễ + tiệc: 2 khối riêng cùng địa điểm. */}
        <section className="mt-12 space-y-8 text-center" aria-label="Thông tin lễ và tiệc">
          {[
            { label: "Lễ thành hôn", time: ceremonyTime },
            { label: "Tiệc chung vui", time: partyTime },
          ].map((b) => (
            <Reveal key={b.label}>
              <Fx fx="fade-in">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>{b.label}</p>
              </Fx>
              <Fx fx="slide-up" delay={0.15} className="font-display mt-1 text-2xl font-bold" style={{ color: OLIVE }}>{b.time}</Fx>
              <Fx fx="fade-in" delay={0.3}>
                <p className="mt-1 text-sm">{data.venue} — {data.address}</p>
              </Fx>
            </Reveal>
          ))}
        </section>

        {/* 6. Ảnh lồng + dấu sáp ngăn cách. */}
        <Reveal className="-mx-4 mt-12 w-[calc(100%+2rem)]">
          <Fx fx="fade-in" duration={1.5}>
            <img src={PRESET_PHOTOS[3].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Fx>
        </Reveal>
        <div className="mt-8 text-center">
          <Fx fx="scale-in" duration={1} className="inline-block">
            <WaxSeal size={60} />
          </Fx>
        </div>

        {/* 7. Giới thiệu cô dâu – chú rể: 2 Polaroid nghiêng. */}
        <section className="mt-10 text-center" aria-label="Giới thiệu cô dâu chú rể">
          <SectionLabel>Cô dâu &amp; Chú rể</SectionLabel>
          <div className="relative mx-auto mt-6 h-[320px] max-w-[340px]">
            <Reveal className="absolute left-0 top-0 w-[50%] -rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
              <Fx fx="slide-up" duration={1.2}>
                <img src={PRESET_PHOTOS[3].url} alt={`Chú rể ${data.groomName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Chú rể {data.groomName}</p>
              </Fx>
            </Reveal>
            <Reveal className="absolute right-0 top-8 w-[50%] rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
              <Fx fx="slide-up" duration={1.2} delay={0.25}>
                <img src={PRESET_PHOTOS[4].url} alt={`Cô dâu ${data.brideName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Cô dâu {data.brideName}</p>
              </Fx>
            </Reveal>
          </div>
        </section>

        {/* 8. Câu chuyện. */}
        {data.story && (
          <section className="mt-14 text-center" aria-label="Câu chuyện">
            <Reveal>
              <Fx fx="rotate-in" duration={1.2}>
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Our story</h2>
              </Fx>
              <Fx fx="fade-in" delay={0.3}>
                <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed">{data.story}</p>
              </Fx>
            </Reveal>
          </section>
        )}

        {/* 9. Lịch tháng: nền lá nhạt + tim đánh dấu ngày cưới. */}
        {calCells.length > 0 && (
          <section className="mt-14 text-center" aria-label="Lịch tháng">
            <Reveal>
              <Fx fx="zoom-in" duration={1.2}>
                <div className="mx-auto max-w-[380px] rounded-3xl px-4 py-5" style={{ background: "#eef1e4", border: `1px solid ${SAGE}55` }}>
                  <p className="font-display text-lg font-bold" style={{ color: OLIVE }}>{calTitle}</p>
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase" style={{ color: OLIVE }}>
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]" style={{ color: OLIVE }}>
                    {calCells.map((c, i) =>
                      c === null ? (
                        <span key={i} />
                      ) : c === calDay ? (
                        <Fx key={i} fx="bounce-in" delay={0.4} className="relative flex aspect-square items-center justify-center">
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[34px] w-[34px]" style={{ fill: OLIVE }}>
                            <path d={HEART_PATH} />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-white">{c}</span>
                        </Fx>
                      ) : (
                        <span key={i} className="flex aspect-square items-center justify-center">{c}</span>
                      )
                    )}
                  </div>
                </div>
              </Fx>
            </Reveal>
          </section>
        )}

        {/* 10. Timeline NGANG: trục vẽ ra rồi từng mốc hiện nối tiếp. */}
        {schedule.length > 0 && (
          <section className="mt-14 text-center" aria-label="Lịch trình ngày cưới">
            <SectionLabel>Lịch trình ngày cưới</SectionLabel>
            <Reveal>
              <FeedTimeline schedule={schedule} />
            </Reveal>
          </section>
        )}

        {/* 11. Dress code: vòng tròn màu chồng nhau, không chữ. */}
        {dressColors.length > 0 && (
          <section className="mt-14 text-center" aria-label="Dress code">
            <Reveal>
              <Fx fx="fade-in">
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Dresscode</h2>
              </Fx>
              <div className="mt-4 flex items-center justify-center">
                {dressColors.map((c, i) => (
                  <Fx
                    key={c}
                    fx="bounce-in"
                    delay={i * 0.15}
                    className="h-12 w-12 rounded-full border shadow-sm"
                    style={{ background: c, borderColor: `${OLIVE}33`, marginLeft: i === 0 ? 0 : -10, zIndex: dressColors.length - i }}
                  >
                    <span title={c} className="block h-full w-full rounded-full" />
                  </Fx>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* 12. Ảnh lồng + câu trang trí (chữ của app, không lấy câu của mẫu khác). */}
        <Reveal className="-mx-4 mt-14 w-[calc(100%+2rem)]">
          <Fx fx="slide-up" duration={1.2}>
            <img src={PRESET_PHOTOS[5].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Fx>
        </Reveal>
        <Reveal>
          <Fx fx="flip-in" duration={1.2}>
            <p className="font-script mt-6 text-center text-3xl" style={{ color: OLIVE }}>Forever &amp; Always</p>
          </Fx>
        </Reveal>

        {/* 13. Đếm ngược (dùng lại component Countdown của app). */}
        <section className="mt-10" aria-label="Đếm ngược">
          <Reveal>
            <Fx fx="fade-in">
              <Countdown date={data.date} time={data.time} accent={OLIVE} />
            </Fx>
          </Reveal>
        </section>

        {/* 14. Cảm ơn: ảnh tràn viền + lời cảm ơn (câu của app). */}
        <Reveal className="relative -mx-4 mt-14 w-[calc(100%+2rem)] overflow-hidden" ariaLabel="Cảm ơn">
          <Fx fx="fade-in" duration={1.5}>
            <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </Fx>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center text-white">
            <Fx fx="zoom-in" duration={1.5}>
              <p className="font-script text-5xl">Thank you</p>
            </Fx>
            <Fx fx="fade-in" delay={0.3}>
              <p className="mt-3 max-w-sm text-sm leading-relaxed">
                Sự hiện diện của Quý Khách là niềm vinh hạnh của gia đình chúng tôi!
              </p>
            </Fx>
          </div>
        </Reveal>

        <p className="mt-10 text-center text-xs" style={{ color: OLIVE_SOFT }}>
          Demo kiểu feed — Thiệp Đôi. Ảnh minh họa từ Unsplash.
        </p>
      </div>
    </div>
  );
}
