// Demo DUPE bố cục mẫu ZenLove "Orchid Keepsake" (?layout=feed) — làm theo
// đúng bố cục 14 mục của mẫu đó (report ở research_notes/zenlove-orchid-
// keepsake/report.md), NHƯNG nội dung là của ChungĐôi: tên/ảnh/câu chữ lấy
// từ dữ liệu demo của app, dấu sáp + cành lan + họa tiết vẽ bằng code, không
// dùng ảnh/tên/câu chữ của mẫu gốc. Cơ chế pipeline giữ nguyên (PR #69):
// Lớp 1 Reveal khối trồi + Lớp 2 Fx 12 kiểu + Lớp 3 timeline nối tiếp +
// Lớp 4 tự cuộn rAF 60px/s.
// Bố cục dupe (theo mẫu): bìa phong bì trắng + 2 Polaroid chồng + lan;
// ảnh tràn viền rồi lời mời (câu mời đầy đủ + cha mẹ + tên lớn); ngày giờ
// tiệc (nhãn + giờ + thứ, ngày 3 cột, âm lịch); lễ + tiệc 2 khối riêng, mỗi
// khối có nút XEM CHỈ ĐƯỜNG; ảnh + dấu sáp; giới thiệu 2 Polaroid + dấu sáp
// đè giữa; Our story; lịch nền Monet + tim ĐỎ + ngày âm dưới mỗi ngày;
// timeline NGANG có icon từng mốc; dresscode chỉ 2 vòng tròn, không chữ;
// dải Monet + khối olive chữ dọc + câu trích; countdown + ảnh lớn bo góc;
// RSVP + GỬI QUÀ MỪNG CƯỚI (form chỉ chạy local trong demo); Thank you.
// CHỈ LÀ DEMO (?layout=feed trên /thiep/demo): không đụng thiệp thật.
"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { formatDateVi, parseDressCode, parseSchedule } from "@/lib/types";
import { getDateParts, getLunarParts } from "@/lib/lunar";
import { PRESET_PHOTOS } from "@/lib/templates";
import Countdown from "./Countdown";

const OLIVE = "#4a5d23";
const OLIVE_SOFT = "#6b7f3e";
const CREAM = "#f7f2e7";
const PAPER = "#fffdf6";
const INK = "#2e3a1e";
const RED = "#c1272d";

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

// Nền lá xanh kiểu Monet (vẽ bằng CSS gradient, không dùng ảnh của mẫu).
const MONET_BG =
  "radial-gradient(circle at 18% 25%, rgba(255,255,255,0.55) 0%, transparent 42%), radial-gradient(circle at 85% 70%, rgba(120,160,90,0.5) 0%, transparent 55%), radial-gradient(circle at 70% 15%, rgba(190,220,170,0.6) 0%, transparent 45%), linear-gradient(155deg, #dfecc9 0%, #b5d194 55%, #93bd7a 100%)";
const MONET_STRIP_BG =
  "radial-gradient(circle at 30% 40%, rgba(255,182,193,0.75) 0%, transparent 42%), radial-gradient(circle at 72% 62%, rgba(255,255,255,0.85) 0%, transparent 45%), radial-gradient(circle at 55% 20%, rgba(220,235,200,0.7) 0%, transparent 50%), linear-gradient(140deg, #a8c686 0%, #7ba05b 100%)";

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Khối trồi khi cuộn tới: gắn class armed (ẩn + tụt 40px), IntersectionObserver
// thấy lọt khung thì gắn visible + done (hiện + trồi lên), hết transition thì
// gỡ armed + visible, chỉ giữ done. Giảm chuyển động hoặc không có
// IntersectionObserver: hiện luôn, không hiệu ứng.
function Reveal({
  children,
  className,
  style,
  ariaLabel,
}: {
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
    <div ref={ref} className={["feed-reveal", className].filter(Boolean).join(" ")} style={style} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

// Hiệu ứng từng phần tử (lớp 2): 12 kiểu chọn, map sang keyframe tự viết.
// Chưa lọt khung: opacity 0; lọt khung (IO threshold 0,1, rootMargin -50px):
// chạy animation 1 lần, fillMode both. Giảm chuyển động: hiện luôn.
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

// Icon từng mốc timeline, chọn theo nhãn (vẽ bằng code): đón khách = máy ảnh,
// lễ thành hôn = nhẫn đôi, tiệc mừng = dao nĩa, chụp ảnh = máy ảnh.
function TimelineIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const common = { width: 18, height: 18, fill: "none", stroke: OLIVE, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (/tiệc/i.test(l)) {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
        <path d="M7 3v4.5M4.8 3v3.2a2.2 2.2 0 0 0 4.4 0V3M7 10.5V21" />
        <path d="M16.5 3c1.8 2 1.8 4.6 0 6.5V21" />
      </svg>
    );
  }
  if (/lễ/i.test(l)) {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
        <circle cx="9" cy="14.5" r="4.5" />
        <circle cx="15" cy="14.5" r="4.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
      <path d="M9 8l1.2-2.5h3.6L15 8" />
      <rect x="3.5" y="8" width="17" height="12" rx="2.5" />
      <circle cx="12" cy="14" r="3.4" />
    </svg>
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
    <div ref={ref} className="feed-tl relative mt-8" data-tl-anim={anim}>
      <span aria-hidden="true" className="feed-tl-axis absolute left-4 right-4 top-[15px] border-t-2 border-dotted" style={{ borderColor: OLIVE }} />
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
        {items.map((s, i) => (
          <div key={i} className="feed-tl-item flex flex-col items-center px-1" style={{ "--tl-i": i } as React.CSSProperties}>
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm" style={{ borderColor: `${OLIVE}44` }}>
              <TimelineIcon label={s.label} />
            </span>
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

// Cành lan trắng vẽ bằng code (thân xanh + 3 hoa trắng 5 cánh + lá).
function OrchidBranch({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const flower = (x: number, y: number) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="#fbf9f0" stroke="#a8b89a" strokeWidth="0.7">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="0" cy="-7" rx="3.4" ry="6" transform={`rotate(${deg})`} />
      ))}
      <circle r="2" fill="#c9a86a" stroke="none" />
    </g>
  );
  return (
    <svg viewBox="0 0 60 120" className={className} style={style} aria-hidden="true">
      <path d="M30 118 C28 80 34 50 26 12" fill="none" stroke="#6b7f3e" strokeWidth="1.6" />
      <path d="M30 100 C20 96 14 88 12 80 C20 84 26 90 30 98" fill="#8a9a6b" />
      {flower(26, 22)}
      {flower(36, 55)}
      {flower(24, 88)}
    </svg>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>
      {children}
    </p>
  );
}

// Dải trắng của cột feed: các khối chữ nền trắng chảy liền mạch, xen kẽ ảnh
// tràn viền (không viền/bóng tách card, đúng kiểu mẫu).
const BAND = "-mx-4 w-[calc(100%+2rem)] bg-[#fffdf6] px-4 py-10";
const BAND_TEXT = "text-center";

export default function FeedInvitationDemo({ data }: { data: InvitationData }) {
  const [liked, setLiked] = useState(false);
  // Tự cuộn MẶC ĐỊNH BẬT như mẫu: tự chạy sau 1 giây.
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);
  const autoRef = useRef(true);
  autoRef.current = auto;
  // RSVP demo: chỉ chạy local, không gửi đi đâu.
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(2);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [giftNote, setGiftNote] = useState(false);

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
      if (t.closest("a, button, input, textarea, select, label")) return;
      if (window.getSelection()?.toString()) return;
      setAuto((v) => !v);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const parts = getDateParts(data.date);
  const schedule = parseSchedule(data.scheduleText);
  const dressColors = parseDressCode(data.dressCode).slice(0, 2);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.venue} ${data.address}`.trim()
  )}`;
  const dateDots = data.date ? data.date.split("-").reverse().join(".") : "";
  const ceremonyTime = data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
  // Giờ tiệc lấy từ lịch trình ("Tiệc mừng" 12:00) khi có, tránh hiển thị
  // trùng giờ lễ (11:00) trong khi timeline ghi tiệc 12:00.
  const partyTime = schedule.find((s) => /tiệc/i.test(s.label))?.time ?? data.time;

  // Lịch tháng cưới: lưới 7 cột, tuần bắt đầu thứ Hai, tim ĐỎ đánh dấu ngày
  // cưới, ngày âm nhỏ dưới mỗi ngày.
  let calCells: (number | null)[] = [];
  let calDay = 0;
  let calLunar: (number | null)[] = [];
  let calMonthEn = "";
  if (data.date) {
    try {
      const d = new Date(`${data.date}T00:00:00`);
      if (!isNaN(d.getTime())) {
        calDay = d.getDate();
        calMonthEn = EN_MONTHS[d.getMonth()] ?? "";
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        calCells = [...Array<number | null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
        calLunar = calCells.map((c) =>
          c === null ? null : getLunarParts(`${data.date.slice(0, 8)}${String(c).padStart(2, "0")}`)?.day ?? null
        );
      }
    } catch {
      calCells = [];
      calLunar = [];
    }
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const scrollToId = (id: string) => {
    setAuto(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const railBtn =
    "flex w-11 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold shadow-md transition-transform active:scale-90";

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: INK }}>
      {/* Cột feed hẹp cỡ điện thoại, căn giữa — như mẫu tham khảo. */}
      <div className="relative mx-auto w-full max-w-[490px] px-4 pb-16">
        {/* Thanh tương tác cố định (desktop): Thích / Lời chúc / Quà mừng /
            Tham dự / Chia sẻ / Lên đầu / Xuống cuối. */}
        <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex" aria-hidden={false}>
          <button type="button" onClick={() => setLiked((v) => !v)} className={railBtn} style={{ background: PAPER, color: liked ? "#c1272d" : OLIVE }} aria-label="Thích">
            <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ fill: liked ? "#c1272d" : "none", stroke: liked ? "#c1272d" : OLIVE, strokeWidth: 1.8 }}>
              <path d={HEART_PATH} />
            </svg>
            {liked ? 1 : 0}
          </button>
          <button type="button" onClick={() => scrollToId("rsvp")} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Lời chúc">
            <span className="text-base leading-none">✉</span>
            5
          </button>
          <button type="button" onClick={() => scrollToId("gift")} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Quà mừng">
            <span className="text-base leading-none">🎁</span>
            Quà mừng
          </button>
          <button type="button" onClick={() => scrollToId("rsvp")} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Tham dự">
            <span className="text-base leading-none">✓</span>
            Tham dự
          </button>
          <button type="button" onClick={() => setAuto((v) => !v)} className={railBtn} style={{ background: auto ? OLIVE : PAPER, color: auto ? "#fff" : OLIVE }} aria-label="Tự động cuộn">
            <span className="text-base leading-none">{auto ? "❚❚" : "▶"}</span>
            Tự cuộn
          </button>
          <button type="button" onClick={share} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Chia sẻ">
            <span className="text-base leading-none">↗</span>
            {copied ? "Đã sao chép" : "Chia sẻ"}
          </button>
          <button type="button" onClick={() => { setAuto(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Lên đầu">
            <span className="text-base leading-none">↑</span>
            Lên đầu
          </button>
          <button type="button" onClick={() => { setAuto(false); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); }} className={railBtn} style={{ background: PAPER, color: OLIVE }} aria-label="Xuống cuối">
            <span className="text-base leading-none">↓</span>
            Xuống cuối
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

        {/* 1. Bìa: phong bì trắng + 2 ảnh Polaroid nghiêng chồng nhau + lan. */}
        <section className="pt-10 text-center" aria-label="Bìa thiệp">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[360px] rounded-2xl bg-white p-4 pb-6 shadow-md">
              <div className="relative mx-auto h-[300px] w-full max-w-[320px]">
                <div className="absolute left-0 top-0 w-[52%] -rotate-4 rounded-lg bg-white p-2 pb-6 shadow-lg ring-1 ring-black/5">
                  <Fx fx="slide-up" duration={1.2} delay={0.1}>
                    <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                    <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Save our date</p>
                  </Fx>
                </div>
                <div className="absolute right-0 top-8 w-[52%] rotate-4 rounded-lg bg-white p-2 pb-6 shadow-lg ring-1 ring-black/5">
                  <Fx fx="slide-up" duration={1.2} delay={0.35}>
                    <img src={PRESET_PHOTOS[1].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                    <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>{dateDots}</p>
                  </Fx>
                </div>
                <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2">
                  <Fx fx="scale-in" duration={1} delay={0.5}>
                    <WaxSeal size={56} />
                  </Fx>
                </div>
                <OrchidBranch className="absolute -right-3 top-1 h-[110px] w-[54px]" />
              </div>
            </div>
          </Reveal>
        </section>

        {/* 2. Lời mời: ảnh tràn viền rồi câu mời đầy đủ + cha mẹ + tên lớn. */}
        <section aria-label="Lời mời">
          <Reveal className="-mx-4 mt-10 w-[calc(100%+2rem)]">
            <Fx fx="zoom-in" duration={1.5}>
              <img src={PRESET_PHOTOS[2].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </Fx>
          </Reveal>
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <div className="relative">
              <OrchidBranch className="absolute -top-2 right-0 h-[90px] w-[44px] opacity-90" />
              <Fx fx="fade-in">
                <p className="mx-auto max-w-md text-[11px] font-semibold uppercase leading-relaxed tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
                  Trân trọng kính mời Quý Khách đến chung vui cùng gia đình chúng tôi
                </p>
              </Fx>
              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-sm">
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
              <Fx fx="zoom-in" duration={1.5}>
                <h1 className="font-display mt-8 text-4xl font-bold uppercase leading-tight tracking-wide" style={{ color: OLIVE }}>
                  {data.groomName} <span className="mx-1" style={{ color: "#c9a86a" }}>&amp;</span> {data.brideName}
                </h1>
              </Fx>
              <Fx fx="fade-in" duration={1.2} delay={0.2}>
                <p className="mt-2 text-sm tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
                  {formatDateVi(data.date)}
                </p>
              </Fx>
            </div>
          </Reveal>
        </section>

        {/* 3. Ngày giờ tiệc: nhãn + giờ + thứ, ngày 3 cột, âm lịch. */}
        <section aria-label="Ngày giờ">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            {parts && (
              <>
                <Fx fx="fade-in">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
                    Bữa tiệc chung vui — {partyTime}, {parts.weekday}
                  </p>
                </Fx>
                <div className="mt-4 flex items-center justify-center" style={{ color: OLIVE }}>
                  <Fx fx="slide-right" className="w-auto min-w-[70px] whitespace-nowrap text-right text-[15px] font-semibold uppercase">{parts.monthDisplay}</Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="fade-in" delay={0.15} className="text-[34px] font-bold leading-none">{parts.day}</Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="slide-left" delay={0.3} className="whitespace-nowrap text-left text-[15px] font-semibold uppercase">Năm {parts.year}</Fx>
                </div>
                {parts.lunarNote && (
                  <Fx fx="fade-in" delay={0.4}>
                    <p className="mt-2 text-[13px]" style={{ color: OLIVE_SOFT }}>({parts.lunarNote})</p>
                  </Fx>
                )}
              </>
            )}
          </Reveal>
        </section>

        {/* 4. Lễ + tiệc: 2 khối riêng, mỗi khối có nút XEM CHỈ ĐƯỜNG. */}
        <section aria-label="Thông tin lễ và tiệc">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            {[
              { label: "Lễ thành hôn", time: ceremonyTime },
              { label: "Tiệc chung vui", time: partyTime },
            ].map((b, bi) => (
              <div key={b.label} className={bi === 0 ? "" : "mt-10 border-t pt-10"} style={bi === 0 ? undefined : { borderColor: `${OLIVE}22` }}>
                <Fx fx="fade-in">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>{b.label}</p>
                </Fx>
                <Fx fx="slide-up" delay={0.15} className="font-display mt-1 text-2xl font-bold" style={{ color: OLIVE }}>{b.time}</Fx>
                {parts && (
                  <Fx fx="fade-in" delay={0.3}>
                    <p className="mt-1 text-sm font-semibold">{parts.weekday}, {dateDots}</p>
                    {parts.lunarNote && <p className="mt-0.5 text-[12px]" style={{ color: OLIVE_SOFT }}>({parts.lunarNote})</p>}
                  </Fx>
                )}
                <Fx fx="fade-in" delay={0.4}>
                  <p className="mt-2 text-sm">TẠI {data.venue} — {data.address}</p>
                </Fx>
                <Fx fx="fade-in" delay={0.5}>
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: OLIVE }}>
                    XEM CHỈ ĐƯỜNG
                  </a>
                </Fx>
              </div>
            ))}
          </Reveal>
        </section>

        {/* 5. Ảnh chuyển đoạn + dấu sáp ở khoảng trắng. */}
        <Reveal className="-mx-4 w-[calc(100%+2rem)]">
          <Fx fx="fade-in" duration={1.5}>
            <img src={PRESET_PHOTOS[3].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </Fx>
        </Reveal>
        <div className="py-8 text-center">
          <Fx fx="scale-in" duration={1} className="inline-block">
            <WaxSeal size={60} />
          </Fx>
        </div>

        {/* 6. Giới thiệu cô dâu – chú rể: 2 Polaroid + dấu sáp đè giữa. */}
        <section aria-label="Giới thiệu cô dâu chú rể">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <SectionLabel>Cô dâu &amp; Chú rể</SectionLabel>
            <div className="relative mx-auto mt-6 h-[320px] max-w-[340px]">
              <div className="absolute left-0 top-0 w-[50%] -rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
                <Fx fx="slide-up" duration={1.2}>
                  <img src={PRESET_PHOTOS[3].url} alt={`Chú rể ${data.groomName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                  <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Chú rể {data.groomName}</p>
                </Fx>
              </div>
              <div className="absolute right-0 top-8 w-[50%] rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
                <Fx fx="slide-up" duration={1.2} delay={0.25}>
                  <img src={PRESET_PHOTOS[4].url} alt={`Cô dâu ${data.brideName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                  <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Cô dâu {data.brideName}</p>
                </Fx>
              </div>
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <Fx fx="scale-in" duration={1} delay={0.4}>
                  <WaxSeal size={56} />
                </Fx>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 7. Câu chuyện. */}
        {data.story && (
          <section aria-label="Câu chuyện">
            <Reveal className={`${BAND} ${BAND_TEXT}`}>
              <Fx fx="rotate-in" duration={1.2}>
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Our story</h2>
              </Fx>
              <Fx fx="fade-in" delay={0.3}>
                <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed">{data.story}</p>
              </Fx>
            </Reveal>
          </section>
        )}

        {/* 8. Lịch: nền Monet + tiêu đề tháng tiếng Anh + ngày âm + tim ĐỎ. */}
        {calCells.length > 0 && (
          <section aria-label="Lịch tháng">
            <Reveal className="-mx-4 w-[calc(100%+2rem)] px-4 py-10 text-center" style={{ background: MONET_BG }}>
              <Fx fx="zoom-in" duration={1.2}>
                <p className="font-display text-2xl font-bold" style={{ color: OLIVE }}>{calMonthEn}</p>
                <div className="mx-auto mt-4 max-w-[380px]">
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase" style={{ color: OLIVE }}>
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]" style={{ color: OLIVE }}>
                    {calCells.map((c, i) =>
                      c === null ? (
                        <span key={i} />
                      ) : c === calDay ? (
                        <Fx key={i} fx="bounce-in" delay={0.4} className="relative flex aspect-square flex-col items-center justify-center">
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[36px] w-[36px]" style={{ fill: RED }}>
                            <path d={HEART_PATH} />
                          </svg>
                          <span className="absolute top-[7px] left-0 right-0 flex items-center justify-center text-[13px] font-extrabold leading-none text-white">{c}</span>
                          <span className="cal-lunar mt-0.5 text-[8px] leading-none" style={{ color: OLIVE }}>{calLunar[i]}</span>
                        </Fx>
                      ) : (
                        <span key={i} className="flex aspect-square flex-col items-center justify-center">
                          <span className="text-[13px] leading-none">{c}</span>
                          <span className="cal-lunar mt-0.5 text-[8px] leading-none" style={{ color: OLIVE_SOFT }}>{calLunar[i]}</span>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </Fx>
            </Reveal>
          </section>
        )}

        {/* 9. Timeline NGANG có icon từng mốc, chạy nối tiếp. */}
        {schedule.length > 0 && (
          <section aria-label="Lịch trình ngày cưới">
            <Reveal className={`${BAND} ${BAND_TEXT}`}>
              <SectionLabel>Lịch trình ngày cưới</SectionLabel>
              <FeedTimeline schedule={schedule} />
            </Reveal>
          </section>
        )}

        {/* 10. Dress code: chỉ 2 vòng tròn màu chồng nhau, không chữ. */}
        {dressColors.length > 0 && (
          <section aria-label="Dress code">
            <Reveal className={`${BAND} ${BAND_TEXT}`}>
              <Fx fx="fade-in">
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Dresscode</h2>
              </Fx>
              <div className="mt-4 flex items-center justify-center">
                {dressColors.map((c, i) => (
                  <Fx
                    key={c}
                    fx="bounce-in"
                    delay={i * 0.15}
                    className="dress-circle h-12 w-12 rounded-full border shadow-sm"
                    style={{ background: c, borderColor: `${OLIVE}33`, marginLeft: i === 0 ? 0 : -14, zIndex: dressColors.length - i }}
                  >
                    <span title={c} className="block h-full w-full rounded-full" />
                  </Fx>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* 11. Dải Monet + khối olive chữ dọc + câu trích. */}
        <Reveal className="-mx-4 mt-0 w-[calc(100%+2rem)]">
          <Fx fx="fade-in" duration={1.5}>
            <div className="flex h-[120px] overflow-hidden">
              <div className="flex-1" style={{ background: MONET_STRIP_BG }} />
              <div className="flex w-[64px] items-center justify-center" style={{ background: OLIVE }}>
                <span className="text-sm font-semibold tracking-[0.3em] text-white" style={{ writingMode: "vertical-rl" }}>Thiệp Đôi</span>
              </div>
            </div>
          </Fx>
        </Reveal>
        <Reveal className={`${BAND} ${BAND_TEXT}`}>
          <Fx fx="flip-in" duration={1.2}>
            <p className="font-script text-3xl" style={{ color: OLIVE }}>Forever &amp; Always</p>
          </Fx>
        </Reveal>

        {/* 12. Đếm ngược + ảnh lớn bo góc bên dưới. */}
        <section aria-label="Đếm ngược">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <Fx fx="fade-in">
              <Countdown date={data.date} time={data.time} accent={OLIVE} />
            </Fx>
            <Fx fx="zoom-in" duration={1.5}>
              <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" loading="lazy" className="mt-6 aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
            </Fx>
          </Reveal>
        </section>

        {/* 13. RSVP + Mừng cưới (form chỉ chạy local trong demo). */}
        <section aria-label="Xác nhận tham dự" id="rsvp">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <div className="relative">
              <OrchidBranch className="absolute -left-1 top-0 hidden h-[110px] w-[54px] sm:block" />
              <OrchidBranch className="absolute -right-1 top-0 hidden h-[110px] w-[54px] sm:block" />
              <Fx fx="zoom-in" duration={1.2}>
                <img src={PRESET_PHOTOS[1].url} alt="Ảnh cưới" loading="lazy" className="mx-auto aspect-[4/3] w-full max-w-[420px] rounded-3xl object-cover shadow-md" />
              </Fx>
              <Fx fx="fade-in" delay={0.2}>
                <h2 className="font-script mt-6 text-4xl" style={{ color: OLIVE }}>Xác nhận tham dự</h2>
              </Fx>
              {!rsvpDone ? (
                <form
                  className="mx-auto mt-5 max-w-sm space-y-3 text-left"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRsvpDone(true);
                  }}
                >
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Tên của bạn"
                    aria-label="Tên của bạn"
                    className="w-full rounded-full border bg-white px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: `${OLIVE}55` }}
                  />
                  <div className="flex justify-center gap-6 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="attending" checked={attending === "yes"} onChange={() => setAttending("yes")} style={{ accentColor: OLIVE }} />
                      Tham dự
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="attending" checked={attending === "no"} onChange={() => setAttending("no")} style={{ accentColor: OLIVE }} />
                      Không tham dự
                    </label>
                  </div>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    aria-label="Số người tham dự"
                    className="w-full rounded-full border bg-white px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: `${OLIVE}55` }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} người</option>
                    ))}
                  </select>
                  <button type="submit" className="w-full rounded-full py-2.5 text-sm font-semibold text-white" style={{ background: OLIVE }}>
                    Gửi xác nhận
                  </button>
                </form>
              ) : (
                <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed">
                  Cảm ơn {guestName.trim() || "bạn"} đã xác nhận {attending === "yes" ? "tham dự" : "không tham dự"}
                  {attending === "yes" ? ` (${guestCount} người)` : ""}!{" "}
                  <span className="text-xs" style={{ color: OLIVE_SOFT }}>(Bản demo — chưa gửi đi đâu)</span>
                </p>
              )}
              <div id="gift" className="mx-auto mt-6 max-w-sm">
                <button
                  type="button"
                  onClick={() => setGiftNote((v) => !v)}
                  className="w-full rounded-full py-3 text-sm font-bold tracking-wide text-white"
                  style={{ background: OLIVE }}
                >
                  GỬI QUÀ MỪNG CƯỚI
                </button>
                {giftNote && (
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: OLIVE_SOFT }}>
                    Bản demo — trong thiệp thật, khách quét mã VietQR của cô dâu chú rể để mừng cưới.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* 14. Cảm ơn: ảnh tràn viền + lời cảm ơn (câu của app). */}
        <Reveal className="relative -mx-4 mt-0 w-[calc(100%+2rem)] overflow-hidden" ariaLabel="Cảm ơn">
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
