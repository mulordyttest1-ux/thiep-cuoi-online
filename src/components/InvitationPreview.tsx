"use client";

// Khung xem trước thiệp — 3 cách hiển thị, cùng một dữ liệu:
// - Mẫu KHÔNG deco: bố cục dọc tĩnh như trước (ảnh, tên, cha mẹ, thẻ ngày,
//   đếm ngược, lời mời, lịch trình, câu chuyện).
// - Mẫu deco (Song Phụng Đỏ): SLIDE DECK điện ảnh toàn màn hình
//   (InvitationDeck) — phong bì mở đầu ở thiep/[id]/page.tsx, deck bắt đầu
//   từ Hero. Xem InvitationDeck + spec §4g.
// - Mẫu deco trong THUMBNAIL thư viện (TemplateCard, data-deco-thumbnail):
//   bố cục dọc tĩnh như trước để thẻ chỉ hiện hero (đo cắt theo hero).
//   Nhận biết bằng closest("[data-deco-thumbnail]") sau mount; lần render
//   đầu là deck rồi đổi sang tĩnh (thumbnail đang ẩn nên không thấy nháy).
// Nội dung từng section nằm ở InvitationSections (dùng chung cho deck +
// bố cục tĩnh) để 2 cách hiển thị không lệch nhau.
import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { formatDateVi, minusMinutes, parseDressCode, parseSchedule } from "@/lib/types";
import { getTemplate, TEMPLATE_FONT_CLASS } from "@/lib/templates";
import { getDateParts } from "@/lib/lunar";
import Countdown from "./Countdown";
import TemplateMotif from "./TemplateMotif";
import InvitationDeck from "./InvitationDeck";
import type { DecoContext } from "./InvitationSections";
import {
  DecoAlbum,
  DecoDressCode,
  DecoHero,
  DecoInfo,
  DecoParty,
  DecoSchedule,
} from "./InvitationSections";

const FRAME_OUTER: Record<string, number> = { single: 2, double: 3, triple: 4, scallop: 2, band: 2 };
const FRAME_INNER: Record<string, string> = {
  single: "1px solid",
  double: "1px solid",
  triple: "3px double",
  scallop: "2px dotted",
  band: "1px solid",
};

export default function InvitationPreview({
  data,
  guestName,
  deckHeightClass,
}: {
  data: InvitationData;
  guestName?: string;
  /** Chiều cao deck (trang khách mặc định h-[100dvh]; editor/dialog truyền
      thấp hơn để vừa khung xem trước). */
  deckHeightClass?: string;
}) {
  const tpl = getTemplate(data.templateId);
  const p = tpl.palette;
  const deco = tpl.decorationImages;
  const fontClass = TEMPLATE_FONT_CLASS[tpl.font];
  const nameSize = tpl.font === "script" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl";
  const schedule = parseSchedule(data.scheduleText);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.venue} ${data.address}`.trim()
  )}`;
  const vi = data.language !== "en";
  // Section tiệc (chỉ mẫu deco): giờ đón khách = giờ cưới trừ 30 phút
  // (mẫu bản gốc: đón 17:30 / tiệc 18:00), màu dress code, bản đồ nhúng.
  const welcomeTime = deco ? minusMinutes(data.time, 30) : "";
  const dressColors = deco ? parseDressCode(data.dressCode) : [];
  // Vòng 17: query embed CHỈ lấy địa chỉ (data.address) — query kèm tên
  // địa điểm ("Trung tâm Tiệc cưới Sen Hồng 123 Đường Láng...") khiến
  // Google match nhầm sang khu Hồ Tây/Thụy Khuê (có địa điểm tên Sen Hồng
  // ở đó), không có ghim; địa chỉ thuần "123 Đường Láng, Đống Đa, Hà Nội"
  // thì ghim đỏ đúng vị trí. Giữ z=16.
  const mapEmbedUrl = deco && data.address?.trim()
    ? `https://www.google.com/maps?q=${encodeURIComponent(data.address.trim())}&z=16&output=embed`
    : "";
  // Phần ngày có cấu trúc (thứ | số ngày | tháng, năm, ghi chú âm lịch) theo
  // đúng code bản gốc (vòng 10, spec §4): chỉ tính cho mẫu deco.
  const parts = deco ? getDateParts(data.date) : null;
  // Mini-calendar tháng cưới (bản gốc có lịch tháng ở section tiệc, spec §4):
  // lưới 7 cột, tuần bắt đầu thứ Hai, tô đậm ngày cưới. Chỉ mẫu deco.
  let calCells: (number | null)[] = [];
  let calDay = 0;
  let calMonth = 0;
  let calYear = 0;
  if (deco && data.date) {
    try {
      const d = new Date(`${data.date}T00:00:00`);
      if (!isNaN(d.getTime())) {
        calDay = d.getDate();
        calMonth = d.getMonth() + 1;
        calYear = d.getFullYear();
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7; // thứ Hai đầu tuần
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        calCells = [...Array<number | null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
      }
    } catch {
      calCells = [];
    }
  }
  const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const calTitle = calMonth ? (vi ? `Tháng ${calMonth} / ${calYear}` : `${MONTHS_EN[calMonth - 1]} / ${calYear}`) : "";
  // Link "Thêm vào lịch" (Google Calendar) — bản gốc có nút này ở section tiệc.
  let calUrl: string | null = null;
  if (deco && parts) {
    try {
      const start = new Date(`${data.date}T${data.time || "00:00"}:00`);
      const end = new Date(start.getTime() + 2 * 3600 * 1000);
      const fmt = (d: Date) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
      calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        `Đám cưới ${data.groomName} & ${data.brideName}`
      )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(data.message)}&location=${encodeURIComponent(
        `${data.venue} ${data.address}`.trim()
      )}`;
    } catch {
      calUrl = null;
    }
  }

  // Thumbnail thư viện (data-deco-thumbnail): dùng bố cục dọc tĩnh, không deck.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isThumb, setIsThumb] = useState(false);
  useEffect(() => {
    setIsThumb(!!rootRef.current?.closest("[data-deco-thumbnail]"));
  }, []);

  // Mẫu không-deco: bố cục dọc tĩnh như trước (không deck).
  if (!deco) {
    return (
      <div
        ref={rootRef}
        className="rounded-3xl shadow-lg"
        style={{ background: p.bg, border: `${FRAME_OUTER[tpl.frame] ?? 2}px solid ${p.gold}`, padding: 6 }}
      >
        <article
          className="overflow-hidden rounded-2xl"
          style={{ border: `${FRAME_INNER[tpl.frame] ?? "1px solid"} ${p.gold}`, background: p.bg, color: p.text }}
        >
          {tpl.frame === "band" && (
            <div className="px-4 pt-3">
              <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
            </div>
          )}
          <div className="relative p-6 text-center sm:p-8">
            <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="lg" />
            {tpl.motif === "phoenix" && (
              <p className="mt-2 text-2xl" style={{ color: p.gold }} aria-hidden="true">囍</p>
            )}
            <p className="mt-3 text-xs uppercase tracking-[0.35em]" style={{ color: p.accent }}>
              {vi ? "Thiệp mời cưới" : "Wedding Invitation"}
            </p>
            {guestName && (
              <p className="mx-auto mt-3 max-w-md rounded-full px-4 py-2 text-sm" style={{ background: p.card, border: `1px solid ${p.gold}` }}>
                {vi ? "Trân trọng kính mời" : "With honour, we invite"} <strong>{guestName}</strong>
              </p>
            )}
            {data.photoUrl && (
              <img
                src={data.photoUrl}
                alt={`Ảnh cưới của ${data.groomName} và ${data.brideName}`}
                loading="lazy"
                className="mx-auto mt-5 aspect-[4/3] w-full max-w-md rounded-2xl object-cover"
              />
            )}
            <h2 className={`mt-6 ${fontClass} ${nameSize} font-bold leading-tight`} style={{ color: p.accent }}>
              {data.groomName} <span style={{ color: p.gold }}>&amp;</span> {data.brideName}
            </h2>
            <p className="mt-4 text-sm" style={{ color: p.muted }}>
              {vi ? "Cùng gia đình hai bên trân trọng kính mời" : "Together with our families, we cordially invite you"}
            </p>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold" style={{ color: p.accent }}>{vi ? "Nhà trai" : "Groom's family"}</p>
                <p>{data.groomFather}</p>
                <p>{data.groomMother}</p>
              </div>
              <div>
                <p className="font-semibold" style={{ color: p.accent }}>{vi ? "Nhà gái" : "Bride's family"}</p>
                <p>{data.brideFather}</p>
                <p>{data.brideMother}</p>
              </div>
            </div>
            <div className="mx-auto mt-6 max-w-md rounded-2xl p-5" style={{ background: p.card, border: `1px solid ${p.gold}` }}>
              <p className={`${fontClass} text-2xl font-bold`}>{vi ? formatDateVi(data.date) : data.date}</p>
              <p className="mt-1 text-lg">{vi ? `Lúc ${data.time}` : `At ${data.time}`}</p>
              <p className="mt-2 font-semibold">{data.venue}</p>
              <p className="text-sm" style={{ color: p.muted }}>{data.address}</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: p.accent }}>
                {vi ? "Xem bản đồ" : "View map"} ↗
              </a>
            </div>
            <Countdown date={data.date} time={data.time} accent={p.accent} />
            <p className="mx-auto mt-6 max-w-lg whitespace-pre-line text-sm leading-relaxed sm:text-base">{data.message}</p>
            {schedule.length > 0 && (
              <section className="mx-auto mt-6 max-w-md text-left" aria-label={vi ? "Lịch trình" : "Schedule"}>
                <h3 className="text-center font-semibold" style={{ color: p.accent }}>{vi ? "Lịch trình" : "Schedule"}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {schedule.map((s, i) => (
                    <li key={i} className="flex gap-3 rounded-xl px-3 py-2" style={{ background: p.card }}>
                      <span className="font-semibold" style={{ color: p.accent }}>{s.time}</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.story && (
              <section className="mx-auto mt-6 max-w-lg text-left" aria-label={vi ? "Câu chuyện tình yêu" : "Our story"}>
                <h3 className="text-center font-semibold" style={{ color: p.accent }}>{vi ? "Câu chuyện của chúng tôi" : "Our story"}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{data.story}</p>
              </section>
            )}
          </div>
          {tpl.frame === "band" && (
            <div className="px-4 pb-3">
              <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
            </div>
          )}
        </article>
      </div>
    );
  }

  const ctx: DecoContext = {
    data,
    vi,
    deco,
    parts,
    calCells,
    calDay,
    calMonth,
    calYear,
    calTitle,
    calUrl,
    welcomeTime,
    dressColors,
    mapEmbedUrl,
    mapsUrl,
    schedule,
  };

  // Thumbnail thư viện: bố cục dọc tĩnh (chỉ hiện hero, đo cắt theo hero).
  if (isThumb) {
    return (
      <div ref={rootRef} className="shadow-lg" style={{ background: "#f9ede3", border: "none", padding: 0 }}>
        <article
          className="relative overflow-hidden rounded-none"
          style={{ border: "none", background: "#f9ede3", color: p.text, containerType: "inline-size" }}
        >
          {/* Vân giấy bản gốc: NENGIAY.jpg opacity 0.3 trên nền kem. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url(/api/songphung/NENGIAY.jpg)", backgroundSize: "100% auto", backgroundRepeat: "repeat-y", backgroundPosition: "top center", opacity: 0.3 }} />
          {tpl.frame === "band" && (
            <div className="px-4 pt-3">
              <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
            </div>
          )}
          <div className="relative p-6 text-center sm:p-8">
            <DecoHero ctx={ctx} active animated={false} />
            <DecoInfo ctx={ctx} active animated={false} />
            <DecoAlbum ctx={ctx} active animated={false} />
            <DecoParty ctx={ctx} active animated={false} />
            {dressColors.length > 0 && <DecoDressCode ctx={ctx} active animated={false} />}
            {schedule.length > 0 && <DecoSchedule ctx={ctx} active animated={false} />}
          </div>
          {tpl.frame === "band" && (
            <div className="px-4 pb-3">
              <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
            </div>
          )}
        </article>
      </div>
    );
  }

  // Mẫu deco ở trang khách / editor / dialog xem trước: slide deck điện ảnh.
  return (
    <div ref={rootRef} className="shadow-lg" style={{ background: "#f9ede3" }}>
      <InvitationDeck ctx={ctx} heightClass={deckHeightClass} />
    </div>
  );
}
