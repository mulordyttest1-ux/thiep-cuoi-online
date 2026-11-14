// Demo DUPE bố cục mẫu ZenLove "Orchid Keepsake" (?layout=feed) — VÒNG 2.
// Bố cục + chi tiết theo đúng mẫu gốc (so sánh trực tiếp 14/11: vòng 1 chỉ
// giống ~60–65%): bìa có nắp gập + chữ script phía trên + Polaroid nghiêng
// mạnh + lan to 2 góc + dấu sáp oval; tên xếp 3 dòng serif lớn; ngày 3 cột
// số to + vạch ngang; lễ/tiệc mỗi khối 1 ngày 3 cột riêng; gallery 6 ảnh
// trượt ngang; couple chéo + nhãn ngoài ảnh + quote; lịch + dải Monet dùng
// TRANH HOA SÚNG MONET THẬT (public domain — Monet mất 1926, ảnh từ
// Wikimedia Commons, KHÔNG phải ảnh của mẫu gốc); dresscode kem/taupe;
// countdown số trần không hộp; RSVP trong card, ô vuông, radio câu đầy đủ;
// KHÔNG còn rail phải (mẫu gốc không có) — chỉ còn nút tự cuộn nổi.
// Nội dung là của ChungĐôi (tên/ảnh/câu chữ app). Element ĐỘNG: cánh hoa
// rơi + lan đung đưa + Polaroid trôi nhẹ (tôn trọng giảm chuyển động).
// Cơ chế pipeline giữ nguyên (PR #69): Reveal + Fx + timeline + tự cuộn rAF.
// CHỈ LÀ DEMO (?layout=feed trên /thiep/demo): không đụng thiệp thật.
"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { formatDateVi, parseSchedule } from "@/lib/types";
import { getDateParts, getLunarParts } from "@/lib/lunar";
import { PRESET_PHOTOS } from "@/lib/templates";

const OLIVE = "#4a5d23";
const OLIVE_SOFT = "#6b7f3e";
const CREAM = "#f7f2e7";
const PAPER = "#fffdf6";
const INK = "#2e3a1e";
const RED = "#c1272d";
// Dresscode của mẫu Orchid: kem-be nhạt + nâu taupe (không phải đỏ Song Phụng
// trong dữ liệu demo của app).
const ORCHID_DRESS = ["#f3ead8", "#a68b6b"];
// Tranh hoa súng Monet 1906 (public domain, Wikimedia Commons).
const MONET_IMG = "/themes/monet/water-lilies.webp";

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

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
  const common = { width: 20, height: 20, fill: "none", stroke: OLIVE, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white">
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
// oval: dấu sáp hình oval nằm ngang như trên nắp phong bì mẫu gốc.
function WaxSeal({ size = 64, oval = false }: { size?: number; oval?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: oval ? size * 0.72 : size,
        borderRadius: "50%",
        background: OLIVE,
        border: "2px solid #fffdf6",
        outline: `1px solid ${OLIVE}`,
        outlineOffset: 3,
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: size * 0.5, height: size * 0.5, fill: "#fffdf6" }}>
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
// Đung đưa nhẹ bằng class .orchid-sway (xem globals.css); muốn lật ngang thì
// bọc ngoài bằng span -scale-x-100 (đừng gán scale lên chính svg đang sway).
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

// Cánh hoa rơi (element động như mẫu gốc): 11 cánh trắng/hồng nhạt rơi chậm
// qua cột thiệp, mỗi cánh lệch nhịp + đung đưa ngang. Giảm chuyển động: ẩn.
const PETALS = [
  { off: -180, dur: 19, delay: -4, size: 12, sway: 3.4 },
  { off: -150, dur: 23, delay: -14, size: 10, sway: 4.1 },
  { off: -110, dur: 17, delay: -9, size: 14, sway: 3.1 },
  { off: -70, dur: 21, delay: -18, size: 11, sway: 3.8 },
  { off: -30, dur: 16, delay: -2, size: 13, sway: 3.3 },
  { off: 10, dur: 22, delay: -11, size: 10, sway: 4.4 },
  { off: 50, dur: 18, delay: -7, size: 12, sway: 3.6 },
  { off: 90, dur: 24, delay: -16, size: 11, sway: 3.2 },
  { off: 130, dur: 17, delay: -1, size: 14, sway: 4.0 },
  { off: 165, dur: 20, delay: -12, size: 10, sway: 3.5 },
  { off: 170, dur: 18, delay: -6, size: 12, sway: 3.9 },
];

function FallingPetals() {
  return (
    <div aria-hidden="true" className="feed-petals pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="feed-petal"
          style={{ left: `calc(50% + ${p.off}px)`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        >
          <span className="feed-petal-sway" style={{ animationDuration: `${p.sway}s`, width: p.size, height: p.size }} />
        </span>
      ))}
    </div>
  );
}

// Đếm ngược kiểu mẫu gốc: số serif lớn KHÔNG hộp, nhãn nhỏ bên dưới.
function FeedCountdown({ date, time }: { date: string; time: string }) {
  const target = (() => {
    try {
      const t = new Date(`${date}T${time || "00:00"}:00`).getTime();
      return isNaN(t) ? 0 : t;
    } catch {
      return 0;
    }
  })();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, target - now);
  const units = [
    { v: Math.floor(diff / 86400000), l: "Ngày" },
    { v: Math.floor(diff / 3600000) % 24, l: "Giờ" },
    { v: Math.floor(diff / 60000) % 60, l: "Phút" },
    { v: Math.floor(diff / 1000) % 60, l: "Giây" },
  ];
  return (
    <div>
      <p className="font-script text-4xl" style={{ color: OLIVE }}>Countdown</p>
      <div className="mt-4 flex items-end justify-center gap-5">
        {units.map((u) => (
          <div key={u.l} className="text-center">
            <span className="font-display text-[40px] font-light leading-none" style={{ color: OLIVE }}>
              {String(u.v).padStart(2, "0")}
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em]" style={{ color: OLIVE_SOFT }}>{u.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ngày 3 cột thu nhỏ cho từng khối lễ/tiệc (số ~28px, vạch ngang trên/dưới
// tháng + năm như mẫu gốc).
function MiniDate({ parts }: { parts: NonNullable<ReturnType<typeof getDateParts>> | null }) {
  if (!parts) return null;
  return (
    <div className="mt-3 flex items-center justify-center" style={{ color: OLIVE }}>
      <span className="min-w-[56px] whitespace-nowrap border-y py-0.5 text-right text-[13px] font-semibold uppercase" style={{ borderColor: `${OLIVE}44` }}>
        {parts.monthDisplay}
      </span>
      <span className="mx-1.5 text-sm opacity-50" aria-hidden="true">|</span>
      <span className="text-[28px] font-bold leading-none">{parts.day}</span>
      <span className="mx-1.5 text-sm opacity-50" aria-hidden="true">|</span>
      <span className="whitespace-nowrap border-y py-0.5 text-left text-[13px] font-semibold uppercase" style={{ borderColor: `${OLIVE}44` }}>
        Năm {parts.year}
      </span>
    </div>
  );
}

// Dải trắng của cột feed: các khối chữ nền trắng chảy liền mạch, xen kẽ ảnh
// tràn viền (không viền/bóng tách card, đúng kiểu mẫu).
const BAND = "-mx-4 w-[calc(100%+2rem)] bg-[#fffdf6] px-4 py-8";
const BAND_TEXT = "text-center";

export default function FeedInvitationDemo({ data }: { data: InvitationData }) {
  // Tự cuộn MẶC ĐỊNH BẬT như mẫu: tự chạy sau 1 giây.
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  autoRef.current = auto;
  // RSVP demo: chỉ chạy local, không gửi đi đâu.
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState<number | "">("");
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
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.venue} ${data.address}`.trim()
  )}`;
  const dateDots = data.date ? data.date.split("-").reverse().join(".") : "";
  const ceremonyTime = data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
  // Giờ tiệc lấy từ lịch trình ("Tiệc mừng" 12:00) khi có, tránh hiển thị
  // trùng giờ lễ (11:00) trong khi timeline ghi tiệc 12:00.
  const partyTime = schedule.find((s) => /tiệc/i.test(s.label))?.time ?? data.time;

  // Hạn xác nhận RSVP: 10 ngày trước ngày cưới.
  const rsvpDeadline = (() => {
    try {
      const d = new Date(`${data.date}T00:00:00`);
      if (isNaN(d.getTime())) return "";
      d.setDate(d.getDate() - 10);
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    } catch {
      return "";
    }
  })();

  // Câu chuyện tách thành từng đoạn ngắn (mỗi câu 1 đoạn).
  const storyParas = data.story
    ? data.story.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];

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

  return (
    <div className="min-h-screen overflow-x-clip" style={{ background: CREAM, color: INK }}>
      {/* Cột feed hẹp cỡ điện thoại, căn giữa — như mẫu tham khảo. */}
      <div className="relative mx-auto w-full max-w-[490px] px-4 pb-16">
        <FallingPetals />
        {/* Nút tự cuộn nổi (mẫu gốc có nút tự cuộn; rail phải đã bỏ vì mẫu
            gốc không có — thanh tương tác của họ là chrome của nền tảng). */}
        <button
          type="button"
          onClick={() => setAuto((v) => !v)}
          className="fixed bottom-5 right-5 z-40 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg"
          style={{ background: auto ? OLIVE : PAPER, color: auto ? "#fff" : OLIVE }}
        >
          {auto ? "❚❚ Dừng cuộn" : "▶ Tự cuộn"}
        </button>

        {/* 1. Bìa: chữ script phía trên + phong bì kem có nắp gập + 2 Polaroid
            nghiêng mạnh thò ra + chùm lan to 2 góc + dấu sáp oval trên nắp. */}
        <section className="pt-8 text-center" aria-label="Bìa thiệp">
          <Reveal>
            <Fx fx="fade-in" duration={1.2}>
              <p className="font-script text-[42px] leading-none" style={{ color: OLIVE }}>Save our date</p>
            </Fx>
            <div className="relative mx-auto mt-[76px] w-full max-w-[360px]">
              {/* Nắp phong bì: tam giác gập, nằm sau ảnh (z-0). */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-0 z-0 h-[104px]"
                style={{ background: "#ece4cd", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
              />
              {/* Thân phong bì kem. */}
              <div className="relative z-0 rounded-2xl bg-[#f7f2e7] px-4 pb-6 pt-[228px] shadow-md ring-1 ring-black/5">
                <p className="font-display text-xl font-semibold tracking-[0.2em]" style={{ color: OLIVE }}>{dateDots}</p>
              </div>
              {/* 2 Polaroid thò ra khỏi phong bì, nghiêng mạnh, trôi nhẹ. */}
              <div className="absolute left-2 top-[-64px] z-10 w-[56%] -rotate-[9deg] rounded-lg bg-white p-2 pb-5 shadow-lg ring-1 ring-black/5">
                <div className="feed-float" style={{ animationDelay: "0s" }}>
                  <Fx fx="slide-up" duration={1.2} delay={0.1}>
                    <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                  </Fx>
                </div>
              </div>
              <div className="absolute right-2 top-[-44px] z-10 w-[56%] rotate-[9deg] rounded-lg bg-white p-2 pb-5 shadow-lg ring-1 ring-black/5">
                <div className="feed-float" style={{ animationDelay: "1.4s" }}>
                  <Fx fx="slide-up" duration={1.2} delay={0.35}>
                    <img src={PRESET_PHOTOS[1].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                  </Fx>
                </div>
              </div>
              {/* Dấu sáp oval đè lên đầu nắp gập. */}
              <div className="absolute left-1/2 top-[72px] z-30 -translate-x-1/2">
                <Fx fx="scale-in" duration={1} delay={0.5}>
                  <WaxSeal size={72} oval />
                </Fx>
              </div>
              {/* Chùm lan to 2 góc, đung đưa nhẹ. */}
              <OrchidBranch className="orchid-sway absolute -right-2 -top-8 z-20 h-[150px] w-[74px]" />
              <span className="absolute -bottom-4 -left-4 z-20 block -scale-x-100">
                <OrchidBranch className="orchid-sway h-[130px] w-[64px]" style={{ animationDelay: "1.2s" }} />
              </span>
            </div>
          </Reveal>
        </section>

        {/* 2. Lời mời: ảnh tràn viền rồi câu mời đầy đủ + cha mẹ 2 cột + tên
            xếp 3 dòng serif lớn, cành lan phía trên tên. */}
        <section aria-label="Lời mời">
          <Reveal className="-mx-4 mt-8 w-[calc(100%+2rem)]">
            <Fx fx="zoom-in" duration={1.5}>
              <img src={PRESET_PHOTOS[2].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </Fx>
          </Reveal>
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <div className="relative">
              <OrchidBranch className="orchid-sway absolute -top-2 right-0 h-[90px] w-[44px] opacity-90" />
              <Fx fx="fade-in">
                <p className="mx-auto max-w-md text-[11px] font-semibold uppercase leading-relaxed tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
                  Trân trọng kính mời Quý Khách đến chung vui cùng gia đình chúng tôi
                </p>
              </Fx>
              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-sm">
                <Fx fx="slide-right">
                  <p className="font-semibold" style={{ color: OLIVE }}>Nhà trai</p>
                  <p className="font-display">{data.groomFather}</p>
                  <p className="font-display">{data.groomMother}</p>
                </Fx>
                <Fx fx="slide-left">
                  <p className="font-semibold" style={{ color: OLIVE }}>Nhà gái</p>
                  <p className="font-display">{data.brideFather}</p>
                  <p className="font-display">{data.brideMother}</p>
                </Fx>
              </div>
              <Fx fx="fade-in" delay={0.1}>
                <OrchidBranch className="orchid-sway mx-auto mt-6 h-[64px] w-[32px]" />
              </Fx>
              <Fx fx="zoom-in" duration={1.5}>
                <h1 className="font-display mt-4 text-[44px] font-light uppercase leading-[1.08] tracking-wide" style={{ color: OLIVE }}>
                  {data.groomName}
                  <span className="font-script block text-[30px] normal-case leading-[1.2]" style={{ color: "#c9a86a" }}>&amp;</span>
                  {data.brideName}
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

        {/* 3. Ngày giờ tiệc: nhãn + giờ + thứ, ngày 3 cột số to + vạch ngang,
            âm lịch. */}
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
                  <Fx fx="slide-right" className="w-auto min-w-[70px] whitespace-nowrap border-y py-1 text-right text-[15px] font-semibold uppercase" style={{ borderColor: `${OLIVE}44` }}>
                    {parts.monthDisplay}
                  </Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="fade-in" delay={0.15} className="text-[64px] font-bold leading-none">{parts.day}</Fx>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <Fx fx="slide-left" delay={0.3} className="whitespace-nowrap border-y py-1 text-left text-[15px] font-semibold uppercase" style={{ borderColor: `${OLIVE}44` }}>
                    Năm {parts.year}
                  </Fx>
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

        {/* 4. Lễ + tiệc: mỗi khối có ngày 3 cột riêng + âm lịch + lan góc +
            nút XEM CHỈ ĐƯỜNG riêng. */}
        <section aria-label="Thông tin lễ và tiệc">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            {[
              { label: "Lễ thành hôn", time: ceremonyTime },
              { label: "Tiệc chung vui", time: partyTime },
            ].map((b, bi) => (
              <div key={b.label} className={bi === 0 ? "relative" : "relative mt-8 border-t pt-8"} style={bi === 0 ? undefined : { borderColor: `${OLIVE}22` }}>
                <OrchidBranch className="orchid-sway absolute -top-1 left-0 h-[56px] w-[28px] opacity-70" />
                <OrchidBranch className="orchid-sway absolute -top-1 right-0 h-[56px] w-[28px] opacity-70" style={{ animationDelay: "1s" }} />
                <Fx fx="fade-in">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>{b.label}</p>
                </Fx>
                <Fx fx="slide-up" delay={0.15} className="font-display mt-1 text-2xl font-bold" style={{ color: OLIVE }}>{b.time}</Fx>
                <Fx fx="fade-in" delay={0.3}>
                  <MiniDate parts={parts} />
                  {parts?.lunarNote && <p className="mt-1 text-[12px]" style={{ color: OLIVE_SOFT }}>({parts.lunarNote})</p>}
                </Fx>
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

        {/* 5. Album ảnh: dải 6 ảnh trượt ngang (như gallery của mẫu gốc). */}
        <section aria-label="Album ảnh">
          <Reveal className="-mx-4 w-[calc(100%+2rem)]">
            <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {PRESET_PHOTOS.map((p, i) => (
                <Fx key={p.url} fx="slide-up" delay={i * 0.1} className="w-[190px] shrink-0 snap-start">
                  <img src={p.url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover shadow-sm" />
                </Fx>
              ))}
            </div>
          </Reveal>
        </section>

        {/* 6. Ảnh chuyển đoạn + dấu sáp ở khoảng trắng. */}
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

        {/* 7. Giới thiệu cô dâu – chú rể: bố cục chéo, nhãn NGOÀI ảnh, lan to
            2 bên, dấu sáp oval đè chỗ giao nhau, quote mỗi người. */}
        <section aria-label="Giới thiệu cô dâu chú rể">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <div className="relative mx-auto mt-2 h-[360px] max-w-[320px]">
              <div className="absolute left-0 top-0 w-[56%] -rotate-[10deg]">
                <div className="rounded-lg bg-white p-2 pb-3 shadow-lg ring-1 ring-black/5">
                  <Fx fx="slide-up" duration={1.2}>
                    <img src={PRESET_PHOTOS[3].url} alt={`Chú rể ${data.groomName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                  </Fx>
                </div>
                <p className="mt-2 text-left">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>Chú rể</span>
                  <span className="font-display block text-lg font-bold uppercase" style={{ color: OLIVE }}>{data.groomName}</span>
                </p>
              </div>
              <div className="absolute bottom-0 right-0 w-[56%] rotate-[10deg]">
                <div className="rounded-lg bg-white p-2 pb-3 shadow-lg ring-1 ring-black/5">
                  <Fx fx="slide-up" duration={1.2} delay={0.25}>
                    <img src={PRESET_PHOTOS[4].url} alt={`Cô dâu ${data.brideName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
                  </Fx>
                </div>
                <p className="mt-2 text-right">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>Cô dâu</span>
                  <span className="font-display block text-lg font-bold uppercase" style={{ color: OLIVE }}>{data.brideName}</span>
                </p>
              </div>
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <Fx fx="scale-in" duration={1} delay={0.4}>
                  <WaxSeal size={72} oval />
                </Fx>
              </div>
              <OrchidBranch className="orchid-sway absolute -left-3 top-1/3 h-[140px] w-[68px]" />
              <span className="absolute -right-3 top-6 block -scale-x-100">
                <OrchidBranch className="orchid-sway h-[140px] w-[68px]" style={{ animationDelay: "1s" }} />
              </span>
            </div>
            <div className="mx-auto mt-8 max-w-md space-y-4">
              <Fx fx="fade-in">
                <p className="font-script text-2xl" style={{ color: OLIVE }}>“Anh yêu em, trọn vẹn từng ngày.”</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>— Chú rể</p>
              </Fx>
              <Fx fx="fade-in" delay={0.2}>
                <p className="font-script text-2xl" style={{ color: OLIVE }}>“Mỗi khoảnh khắc bên anh đều là món quà.”</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>— Cô dâu</p>
              </Fx>
            </div>
          </Reveal>
        </section>

        {/* 8. Câu chuyện: mỗi câu 1 đoạn. */}
        {storyParas.length > 0 && (
          <section aria-label="Câu chuyện">
            <Reveal className={`${BAND} ${BAND_TEXT}`}>
              <Fx fx="rotate-in" duration={1.2}>
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Our story</h2>
              </Fx>
              {storyParas.map((para, i) => (
                <Fx key={i} fx="fade-in" delay={0.2 + i * 0.15}>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed">{para}</p>
                </Fx>
              ))}
            </Reveal>
          </section>
        )}

        {/* 9. Lịch: nền tranh hoa súng Monet thật + tiêu đề tháng tiếng Anh
            script trắng + ngày âm + tim ĐỎ. */}
        {calCells.length > 0 && (
          <section aria-label="Lịch tháng">
            <Reveal className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden px-4 py-8 text-center">
              <img src={MONET_IMG} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden="true" className="absolute inset-0 bg-white/35" />
              <div className="relative">
                <Fx fx="zoom-in" duration={1.2}>
                  <p className="font-script text-4xl text-white" style={{ textShadow: "0 1px 8px rgba(46,58,30,0.35)" }}>{calMonthEn}</p>
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
              </div>
            </Reveal>
          </section>
        )}

        {/* 10. Timeline NGANG có icon từng mốc, chạy nối tiếp. */}
        {schedule.length > 0 && (
          <section aria-label="Lịch trình ngày cưới">
            <Reveal className={`${BAND} ${BAND_TEXT}`}>
              <Fx fx="fade-in">
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Timeline</h2>
              </Fx>
              <FeedTimeline schedule={schedule} />
            </Reveal>
          </section>
        )}

        {/* 11. Dress code: chỉ 2 vòng tròn màu kem-be + nâu taupe chồng nhau,
            không chữ (màu Orchid, không phải đỏ demo Song Phụng). */}
        <section aria-label="Dress code">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <Fx fx="fade-in">
              <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Dresscode</h2>
            </Fx>
            <div className="mt-4 flex items-center justify-center">
              {ORCHID_DRESS.map((c, i) => (
                <Fx
                  key={c}
                  fx="bounce-in"
                  delay={i * 0.15}
                  className="dress-circle h-12 w-12 rounded-full border shadow-sm"
                  style={{ background: c, borderColor: `${OLIVE}33`, marginLeft: i === 0 ? 0 : -14, zIndex: ORCHID_DRESS.length - i }}
                >
                  <span title={c} className="block h-full w-full rounded-full" />
                </Fx>
              ))}
            </div>
          </Reveal>
        </section>

        {/* 12. Dải Monet: nửa trái tranh hoa súng thật, nửa phải panel olive
            + câu trích script trắng; lan treo bên dưới. */}
        <Reveal className="-mx-4 w-[calc(100%+2rem)]">
          <Fx fx="fade-in" duration={1.5}>
            <div className="flex h-[160px] overflow-hidden">
              <div className="relative w-[55%] overflow-hidden">
                <img src={MONET_IMG} alt="Tranh hoa súng Monet" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex w-[45%] items-center justify-center px-4" style={{ background: OLIVE }}>
                <p className="font-script text-center text-[21px] leading-snug text-white">
                  Every moment with you feels painted in gentle light.
                </p>
              </div>
            </div>
            <div className="flex justify-center bg-[#fffdf6] pb-2 pt-1">
              <OrchidBranch className="orchid-sway h-[64px] w-[32px]" />
            </div>
          </Fx>
        </Reveal>

        {/* 13. Đếm ngược (số trần không hộp) + ảnh lớn bo góc bên dưới. */}
        <section aria-label="Đếm ngược">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <Fx fx="fade-in">
              <FeedCountdown date={data.date} time={data.time} />
            </Fx>
            <Fx fx="zoom-in" duration={1.5}>
              <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" loading="lazy" className="mt-6 aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
            </Fx>
          </Reveal>
        </section>

        {/* 14. RSVP + Mừng cưới (form chỉ chạy local trong demo): form trong
            card trắng, ô vuông, radio câu đầy đủ, không ảnh phía trên. */}
        <section aria-label="Xác nhận tham dự" id="rsvp">
          <Reveal className={`${BAND} ${BAND_TEXT}`}>
            <div className="relative">
              <OrchidBranch className="orchid-sway absolute -left-1 top-0 hidden h-[110px] w-[54px] sm:block" />
              <span className="absolute -right-1 top-0 hidden -scale-x-100 sm:block">
                <OrchidBranch className="orchid-sway h-[110px] w-[54px]" style={{ animationDelay: "1s" }} />
              </span>
              <Fx fx="fade-in" delay={0.2}>
                <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Xác nhận tham dự</h2>
              </Fx>
              {rsvpDeadline && (
                <Fx fx="fade-in" delay={0.3}>
                  <p className="mx-auto mt-3 max-w-sm text-[13px]" style={{ color: OLIVE_SOFT }}>
                    Vui lòng xác nhận trước ngày {rsvpDeadline} để gia đình chuẩn bị chu đáo nhất.
                  </p>
                </Fx>
              )}
              {!rsvpDone ? (
                <form
                  className="mx-auto mt-5 max-w-sm rounded-2xl border bg-white p-5 text-left shadow-sm"
                  style={{ borderColor: `${OLIVE}33` }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRsvpDone(true);
                  }}
                >
                  <label htmlFor="rsvp-name" className="font-display block text-sm font-semibold" style={{ color: OLIVE }}>Tên của bạn</label>
                  <input
                    id="rsvp-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Tên của bạn"
                    aria-label="Tên của bạn"
                    className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: `${OLIVE}55` }}
                  />
                  <p className="font-display mt-4 text-sm font-semibold" style={{ color: OLIVE }}>Bạn có tham dự không?</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="attending" checked={attending === "yes"} onChange={() => setAttending("yes")} style={{ accentColor: RED }} />
                      Có, tôi sẽ tham dự
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="attending" checked={attending === "no"} onChange={() => setAttending("no")} style={{ accentColor: RED }} />
                      Rất tiếc, tôi không thể tham dự
                    </label>
                  </div>
                  <label htmlFor="rsvp-count" className="font-display mt-4 block text-sm font-semibold" style={{ color: OLIVE }}>Số người tham dự</label>
                  <select
                    id="rsvp-count"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value === "" ? "" : Number(e.target.value))}
                    aria-label="Số người tham dự"
                    className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: `${OLIVE}55` }}
                  >
                    <option value="">Chọn số người tham dự</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} người</option>
                    ))}
                  </select>
                  <button type="submit" className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: OLIVE }}>
                    Gửi xác nhận
                  </button>
                </form>
              ) : (
                <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed">
                  Cảm ơn {guestName.trim() || "bạn"} đã xác nhận {attending === "yes" ? "tham dự" : "không tham dự"}
                  {attending === "yes" && guestCount !== "" ? ` (${guestCount} người)` : ""}!{" "}
                  <span className="text-xs" style={{ color: OLIVE_SOFT }}>(Bản demo — chưa gửi đi đâu)</span>
                </p>
              )}
              <div id="gift" className="mx-auto mt-6 max-w-sm">
                <button
                  type="button"
                  onClick={() => setGiftNote((v) => !v)}
                  className="w-full rounded-lg py-3 text-sm font-bold tracking-wide text-white"
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

        {/* 15. Cảm ơn: ảnh tràn viền + lời cảm ơn (câu của app). */}
        <Reveal className="relative -mx-4 mt-0 w-[calc(100%+2rem)] overflow-hidden" ariaLabel="Cảm ơn">
          <Fx fx="fade-in" duration={1.5}>
            <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </Fx>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-6 text-center text-white">
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

        <p className="mt-8 text-center text-xs" style={{ color: OLIVE_SOFT }}>
          Demo kiểu feed — Thiệp Đôi. Ảnh minh họa từ Unsplash. Tranh hoa súng: Claude Monet, 1906 (public domain).
        </p>
      </div>
    </div>
  );
}
