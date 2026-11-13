// Demo kiểu trình bày FEED cho thiệp online — lấy cảm hứng trình bày từ mẫu
// ZenLove "Orchid Keepsake" (research_notes/zenlove-orchid-keepsake/report.md):
// cột hẹp cỡ điện thoại, ảnh lồng tràn viền xen kẽ khối chữ, thanh tương tác
// cố định + tự động cuộn.
// Cơ chế chữ khi cuộn (đổi theo lựa chọn của chị 15:12 13/11, sau khi đọc
// code mẫu): KHỐI TRỒI — IntersectionObserver + CSS transition, pattern
// chung, code tự viết (không copy code của họ): khối nào lọt vào khung thì
// trồi lên 40px trong 0,7s ease-out. Luân chuyển class:
// feed-reveal-armed → feed-reveal-visible → feed-reveal-done; hết
// transition thì gỡ armed + visible, chỉ giữ done. CSS ở globals.css.
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
  const [auto, setAuto] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoRef = useRef(false);
  autoRef.current = auto;

  // Tự động cuộn: lướt chậm xuống cuối trang; chạm/cuộn tay thì dừng.
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      if (!autoRef.current) return;
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        setAuto(false);
        return;
      }
      window.scrollBy(0, 1.2);
    }, 16);
    const stop = () => setAuto(false);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [auto]);

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
                <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Save our date</p>
              </div>
              <div className="absolute right-0 top-10 w-[50%] rotate-4 rounded-lg bg-white p-2 pb-6 shadow-lg">
                <img src={PRESET_PHOTOS[1].url} alt="Ảnh cưới" className="aspect-[4/5] w-full rounded object-cover" />
                <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>{dateDots}</p>
              </div>
              <div className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2">
                <WaxSeal size={56} />
              </div>
            </div>
          </Reveal>
          <Reveal>
            <h1 className="font-display mt-8 text-4xl font-bold leading-tight" style={{ color: OLIVE }}>
              {data.groomName} &amp; {data.brideName}
            </h1>
            <p className="mt-2 text-sm tracking-[0.25em]" style={{ color: OLIVE_SOFT }}>
              {formatDateVi(data.date)}
            </p>
          </Reveal>
        </section>

        {/* 2. Ảnh lồng tràn viền. */}
        <Reveal className="-mx-4 mt-10 w-[calc(100%+2rem)]">
          <img src={PRESET_PHOTOS[2].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        </Reveal>

        {/* 3. Lời mời: cha mẹ 2 bên + tên lớn. */}
        <section className="mt-12 text-center" aria-label="Lời mời">
          <Reveal>
            <SectionLabel>Trân trọng kính mời</SectionLabel>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold" style={{ color: OLIVE }}>Nhà trai</p>
                <p>{data.groomFather}</p>
                <p>{data.groomMother}</p>
              </div>
              <div>
                <p className="font-semibold" style={{ color: OLIVE }}>Nhà gái</p>
                <p>{data.brideFather}</p>
                <p>{data.brideMother}</p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <h2 className="font-display mt-8 text-4xl font-bold leading-tight" style={{ color: OLIVE }}>
              {data.groomName} <span className="mx-2" style={{ color: "#c9a86a" }}>&amp;</span> {data.brideName}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed" style={{ color: INK }}>
              Cùng gia đình hai bên trân trọng kính mời Quý Khách đến chung vui cùng gia đình chúng tôi.
            </p>
          </Reveal>
        </section>

        {/* 4. Ngày giờ: 3 cột thứ | ngày | tháng năm + giờ + chỉ đường. */}
        <section className="mt-12 text-center" aria-label="Ngày giờ">
          <Reveal>
            <SectionLabel>Bữa tiệc chung vui</SectionLabel>
            {parts && (
              <>
                <div className="mt-4 flex items-center justify-center" style={{ color: OLIVE }}>
                  <span className="w-auto min-w-[70px] whitespace-nowrap text-right text-[15px] font-semibold uppercase">{parts.weekday}</span>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <span className="text-[34px] font-bold leading-none">{parts.day}</span>
                  <span className="mx-2 text-sm opacity-50" aria-hidden="true">|</span>
                  <span className="whitespace-nowrap text-left text-[15px] font-semibold uppercase">{parts.monthDisplay}</span>
                </div>
                <p className="mt-1 text-xl font-semibold" style={{ color: OLIVE }}>{parts.year}</p>
                {parts.lunarNote && <p className="mt-1 text-[13px]" style={{ color: OLIVE_SOFT }}>({parts.lunarNote})</p>}
              </>
            )}
            <p className="mt-4 text-lg font-semibold" style={{ color: OLIVE }}>Vào lúc {ceremonyTime}</p>
            <p className="mt-1 font-semibold">{data.venue}</p>
            <p className="text-sm" style={{ color: OLIVE_SOFT }}>{data.address}</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: OLIVE_SOFT }}>{b.label}</p>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: OLIVE }}>{b.time}</p>
              <p className="mt-1 text-sm">{data.venue} — {data.address}</p>
            </Reveal>
          ))}
        </section>

        {/* 6. Ảnh lồng + dấu sáp ngăn cách. */}
        <Reveal className="-mx-4 mt-12 w-[calc(100%+2rem)]">
          <img src={PRESET_PHOTOS[3].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        </Reveal>
        <div className="mt-8 text-center">
          <WaxSeal size={60} />
        </div>

        {/* 7. Giới thiệu cô dâu – chú rể: 2 Polaroid nghiêng. */}
        <section className="mt-10 text-center" aria-label="Giới thiệu cô dâu chú rể">
          <SectionLabel>Cô dâu &amp; Chú rể</SectionLabel>
          <div className="relative mx-auto mt-6 h-[320px] max-w-[340px]">
            <Reveal className="absolute left-0 top-0 w-[50%] -rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
              <img src={PRESET_PHOTOS[3].url} alt={`Chú rể ${data.groomName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
              <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Chú rể {data.groomName}</p>
            </Reveal>
            <Reveal className="absolute right-0 top-8 w-[50%] rotate-4 rounded-lg bg-white p-2 pb-5 shadow-lg">
              <img src={PRESET_PHOTOS[4].url} alt={`Cô dâu ${data.brideName}`} loading="lazy" className="aspect-[4/5] w-full rounded object-cover" />
              <p className="font-script mt-2 text-base" style={{ color: OLIVE }}>Cô dâu {data.brideName}</p>
            </Reveal>
          </div>
        </section>

        {/* 8. Câu chuyện. */}
        {data.story && (
          <section className="mt-14 text-center" aria-label="Câu chuyện">
            <Reveal>
              <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Our story</h2>
              <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed">{data.story}</p>
            </Reveal>
          </section>
        )}

        {/* 9. Lịch tháng: nền lá nhạt + tim đánh dấu ngày cưới. */}
        {calCells.length > 0 && (
          <section className="mt-14 text-center" aria-label="Lịch tháng">
            <Reveal>
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
                      <span key={i} className="relative flex aspect-square items-center justify-center">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[34px] w-[34px]" style={{ fill: OLIVE }}>
                          <path d={HEART_PATH} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-white">{c}</span>
                      </span>
                    ) : (
                      <span key={i} className="flex aspect-square items-center justify-center">{c}</span>
                    )
                  )}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* 10. Timeline NGANG: 4 mốc trên 1 đường kẻ. */}
        {schedule.length > 0 && (
          <section className="mt-14 text-center" aria-label="Lịch trình ngày cưới">
            <SectionLabel>Lịch trình ngày cưới</SectionLabel>
            <Reveal className="relative mt-6">
              <span aria-hidden="true" className="absolute left-2 right-2 top-[7px] border-t-2 border-dotted" style={{ borderColor: OLIVE }} />
              <div className="relative grid" style={{ gridTemplateColumns: `repeat(${Math.min(schedule.length, 4)}, 1fr)` }}>
                {schedule.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex flex-col items-center px-1">
                    <span className="relative z-10 block h-3.5 w-3.5 rounded-full border-2 border-white shadow" style={{ background: OLIVE }} />
                    <span className="mt-2 text-[13px] font-bold" style={{ color: OLIVE }}>{s.time}</span>
                    <span className="mt-0.5 px-0.5 text-[11px] leading-tight">{s.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* 11. Dress code: vòng tròn màu chồng nhau, không chữ. */}
        {dressColors.length > 0 && (
          <section className="mt-14 text-center" aria-label="Dress code">
            <Reveal>
              <h2 className="font-script text-4xl" style={{ color: OLIVE }}>Dresscode</h2>
              <div className="mt-4 flex items-center justify-center">
                {dressColors.map((c, i) => (
                  <span
                    key={c}
                    title={c}
                    className="h-12 w-12 rounded-full border shadow-sm"
                    style={{ background: c, borderColor: `${OLIVE}33`, marginLeft: i === 0 ? 0 : -10, zIndex: dressColors.length - i }}
                  />
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* 12. Ảnh lồng + câu trang trí (chữ của app, không lấy câu của mẫu khác). */}
        <Reveal className="-mx-4 mt-14 w-[calc(100%+2rem)]">
          <img src={PRESET_PHOTOS[5].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        </Reveal>
        <Reveal>
          <p className="font-script mt-6 text-center text-3xl" style={{ color: OLIVE }}>Forever &amp; Always</p>
        </Reveal>

        {/* 13. Đếm ngược (dùng lại component Countdown của app). */}
        <section className="mt-10" aria-label="Đếm ngược">
          <Reveal>
            <Countdown date={data.date} time={data.time} accent={OLIVE} />
          </Reveal>
        </section>

        {/* 14. Cảm ơn: ảnh tràn viền + lời cảm ơn (câu của app). */}
        <Reveal className="relative -mx-4 mt-14 w-[calc(100%+2rem)] overflow-hidden" ariaLabel="Cảm ơn">
          <img src={PRESET_PHOTOS[0].url} alt="Ảnh cưới" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center text-white">
            <p className="font-script text-5xl">Thank you</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Sự hiện diện của Quý Khách là niềm vinh hạnh của gia đình chúng tôi!
            </p>
          </div>
        </Reveal>

        <p className="mt-10 text-center text-xs" style={{ color: OLIVE_SOFT }}>
          Demo kiểu feed — Thiệp Đôi. Ảnh minh họa từ Unsplash.
        </p>
      </div>
    </div>
  );
}
