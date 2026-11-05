"use client";

import { useState } from "react";
import type { InvitationData } from "@/lib/types";
import { formatDateVi, minusMinutes, parseDressCode, parseSchedule } from "@/lib/types";
import { getTemplate, PRESET_PHOTOS, TEMPLATE_FONT_CLASS } from "@/lib/templates";
import { getDateParts } from "@/lib/lunar";
import Countdown from "./Countdown";
import TemplateMotif from "./TemplateMotif";
import { SongPhungBand } from "./SongPhungDecor";

const FRAME_OUTER: Record<string, number> = { single: 2, double: 3, triple: 4, scallop: 2, band: 2 };
const FRAME_INNER: Record<string, string> = {
  single: "1px solid",
  double: "1px solid",
  triple: "3px double",
  scallop: "2px dotted",
  band: "1px solid",
};

export default function InvitationPreview({ data, guestName }: { data: InvitationData; guestName?: string }) {
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
  // Coverflow album (chỉ mẫu deco): chỉ số ảnh đang ở giữa.
  const [coverIdx, setCoverIdx] = useState(0);
  // Section tiệc (chỉ mẫu deco): giờ đón khách = giờ cưới trừ 30 phút
  // (mẫu bản gốc: đón 17:30 / tiệc 18:00), màu dress code, bản đồ nhúng.
  const welcomeTime = deco ? minusMinutes(data.time, 30) : "";
  const dressColors = deco ? parseDressCode(data.dressCode) : [];
  const mapEmbedUrl = deco
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${data.venue} ${data.address}`.trim())}&z=16&output=embed`
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
  return (
    <div
      className={deco ? "shadow-lg" : "rounded-3xl shadow-lg"}
      style={
        deco
          ? { background: "#f9ede3", border: "none", padding: 0 }
          : { background: p.bg, border: `${FRAME_OUTER[tpl.frame] ?? 2}px solid ${p.gold}`, padding: 6 }
      }
    >
    <article
      className={deco ? "relative overflow-hidden rounded-none" : "overflow-hidden rounded-2xl"}
      style={
        deco
          ? { border: "none", background: "#f9ede3", color: p.text, containerType: "inline-size" }
          : { border: `${FRAME_INNER[tpl.frame] ?? "1px solid"} ${p.gold}`, background: p.bg, color: p.text }
      }
    >
      {/* Vân giấy bản gốc: NENGIAY.jpg opacity 0.3 trên nền kem (spec §1,
          đã xác minh tải được 200 qua proxy). Lớp phủ tuyệt đối dưới mọi
          nội dung (nội dung nằm trong div relative nên vẽ trên nó). */}
      {deco && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url(/api/songphung/NENGIAY.jpg)", backgroundSize: "100% auto", backgroundRepeat: "repeat-y", backgroundPosition: "top center", opacity: 0.3 }} />
      )}
      {tpl.frame === "band" && (
        <div className="px-4 pt-3">
          <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
        </div>
      )}
      <div className="relative p-6 text-center sm:p-8">
        {!deco && (
          <>
            <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="lg" />
            {tpl.motif === "phoenix" && (
              <p className="mt-2 text-2xl" style={{ color: p.gold }} aria-hidden="true">囍</p>
            )}
          </>
        )}
        {!deco && (
          <p className="mt-3 text-xs uppercase tracking-[0.35em]" style={{ color: p.accent }}>
            {vi ? "Thiệp mời cưới" : "Wedding Invitation"}
          </p>
        )}
        {guestName && !deco && (
          <p className="mx-auto mt-3 max-w-md rounded-full px-4 py-2 text-sm" style={{ background: p.card, border: `1px solid ${p.gold}` }}>
            {vi ? "Trân trọng kính mời" : "With honour, we invite"} <strong>{guestName}</strong>
          </p>
        )}
        {deco ? (
          <>
          <section className="songphung-hero relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8" style={{ containerType: "inline-size" }}>
            {/* Hero phần chính: section RIÊNG (vòng 7). -mt-6/-mt-8 kéo mép
                trên section trùng mép thẻ (bù padding p-6/p-8 của khung
                trong) để cánh phụng phải chạm mép thẻ.
                Vòng 13 — BỎ overflow-hidden ở section này (vòng 7 từng thêm
                để đuôi không che chữ, nhưng nó gây ra đúng lỗi QA11/12 thấy:
                cắt ngang đuôi ở phần RỘNG nhất (x −80..252, ~330px) thành
                một vệt đỏ thẳng ngay đáy hero — mắt đọc thành "motif" ở chỗ
                nối hero/thông tin. Bản gốc KHÔNG cắt ở đây: header gốc
                (chunk_33 module 22705) không có overflow-hidden, đuôi thò
                148px qua đáy header rồi vuốt nhọn dần (đo alpha ảnh thật:
                đuôi hẹp còn x 702–889/1952 ở 50 hàng cuối, tức chỉ còn
                ~40px ở mép trái cột) trong khoảng trống bên trái khối cha
                mẹ — và khi cuộn xuống xem chỗ nối, parallax C(-.15) kéo
                đuôi rút lên nên đầu đuôi chỉ còn chấm nhỏ ngay đáy hero.
                App nay làm y vậy: section không cắt + parallax -0.15 cho
                phụng trái (xem SongPhungDecor). Đuôi không che chữ: lúc
                chưa cuộn, mép phải đuôi cách tiêu đề ~60px và cách chữ cha
                mẹ ~70px (đo theo hình học cột 872px); càng cuộn đuôi càng
                rút lên, xa chữ hơn. Article vẫn overflow-hidden nên mép
                trái cột vẫn cắt như card gốc. */}
            {/* Hero phần chính theo số đo thật trích từ code bản gốc, quy theo
                TỈ LỆ chiều rộng cột (cột gốc 907px; khung xem trước hẹp hơn):
                - Tên: Playfair Display 400 (font-display, ĐÃ kiểm chứng
                  layout.tsx + tailwind.config.ts), cỡ 5.96% chiều rộng CỘT
                  (52px khi cột 872px; cqw đo theo article nhờ container-type
                  ở article + section -mx bù padding, fallback text-2xl/3xl),
                  lineHeight 1.11, #710001, in hoa, không dấu &. Khối tên
                  text-left, thụt trái tổng 12.3% (112px gốc = pl 32 + ml 80);
                  tên 1 thụt thêm 1.7% (15px), tên 2 thụt thêm 5.5% (50px) +
                  mt 1.1% (10px) — tên 2 thụt vào thêm, KHÔNG căn giữa 2 dòng.
                  Đầu hero: section -mt-6/-mt-8 để mép trên trùng mép thẻ,
                  tên mt 7% (64px gốc) từ mép thẻ, không trừ padding nữa.
                  Vệt "swash" dưới dòng tên đầu KHÔNG phải trang trí thêm:
                  trong code không có text-decoration/border nào; đó là đuôi
                  chữ Q của Playfair Display trong tên mẫu "MINH QUÂN" (tên
                  gốc "NGỌC ÁNH"/"THẾ BẢO" không có chữ Q nên không thấy) —
                  bản gốc cũng dùng Playfair nên giữ nguyên, không sửa font.
                - Hàng dải cách đáy tên 6.2% (56px gốc); xem SongPhungBand:
                  hàng 53.8%, dải 22.7% ở nửa dưới hàng, Hỷ 32.1% giữa hàng,
                  phụng trái 51% left -18.6% top 0 hàng, phụng phải 32.1%
                  left calc(50%+16%) top -50.1% chiều cao hàng (cánh chạm mép thẻ).
                - Dưới dải: khoảng kem cao 26.5% chiều rộng (240px gốc =
                  header pb-240, spec §1; vòng 12 sửa từ 50% — 50% là số đo
                  QA vòng 8 đo nhầm tới tận tên lớn, khiến đuôi phụng trái
                  thò dài gấp đôi và chạm sát tiêu đề THÔNG TIN). Hoa HOA
                  không nằm trong khoảng kem này mà nằm ở section sau header
                  (top -290px so với đầu section, tức -39.7cqw so với đầu
                  khối THÔNG TIN khi cộng lề trên 56px), rộng 39.7%
                  (360px gốc), opacity-100 theo code gốc.
                Giữ nguyên vòng 5: đầu kem trống, không dòng chữ mời giữa tên
                và dải, dải sạch, không khung viền, không ảnh lớn trong phần
                chính, không nhãn "THIỆP MỜI CƯỚI". */}
            <h2
              className="font-display relative z-20 mt-[7%] w-fit text-left text-2xl uppercase leading-[1.11] sm:text-3xl"
              style={{ color: "#710001", fontWeight: 400, fontSize: "clamp(20px, 5.96cqw, 52px)", marginLeft: "12.3%" }}
            >
              <span className="block whitespace-nowrap" style={{ marginLeft: "1.7%" }}>{data.brideName}</span>
              <span className="block whitespace-nowrap" style={{ marginLeft: "5.5%", marginTop: "1.1%" }}>{data.groomName}</span>
            </h2>
            <div className="relative z-0" style={{ marginTop: "6.2%" }}>
              <SongPhungBand deco={deco} />
            </div>
            {/* Khoảng kem dưới dải: 26.5% chiều rộng (= 240px gốc, header
                pb-240, spec §1). Vòng 12 sửa từ 50%: 50% khiến đuôi phụng
                trái thò dài gấp đôi bản gốc và chạm sát khối THÔNG TIN —
                chính là "motif hoa đỏ đậm ở góc trên-trái khối THÔNG TIN"
                QA11 nêu (thực chất là đuôi phụng, không phải hoa). */}
            <div className="relative w-full" style={{ aspectRatio: "100 / 26.5" }} />
            </section>
            {/* Khối THÔNG TIN LỄ CƯỚI — trích đúng code bản gốc vòng 10 (spec §4,
                module 22705): thứ tự tiêu đề → cha mẹ → lời mời → tên lớn
                xếp chồng → hàng ngày có cấu trúc. Pill khách KHÔNG có trong
                luồng này — chỉ ở phong bì.
                Lề trên 56px (= section py-14 của bản gốc); hoa HOA nằm ở
                section này, top -290px so với đầu section (tức -39.7cqw so
                với đầu khối này), góc phải, rộng 39.7%, opacity-100 — đúng
                vị trí bản gốc (hoa thò lên vùng kem và chạm nhẹ vùng tiêu đề
                phía phải, KHÔNG nằm trong khoảng kem dưới dải). */}
            <div className="relative z-20 mt-14 text-center">
              <img src={deco.hoa} alt="Họa tiết hoa lớn góc dưới-phải" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute right-0 -z-10 w-[39.7%] object-contain" style={{ top: "-39.7cqw" }} />
              {/* Tiêu đề gốc: uppercase, font-bold, 20px md:24px. */}
              <p className="font-display text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
                {vi ? "THÔNG TIN LỄ CƯỚI" : "CEREMONY INFO"}
              </p>
              {/* Cha mẹ (cD gốc): lưới 2 bên + vạch 1px cao 60px ở giữa, 4 hàng
                  (nhãn / cha / mẹ / địa chỉ) căn hàng nhau bằng subgrid.
                  Bên TRÁI = nhà gái, bên PHẢI = nhà trai (bản gốc demo để
                  brideFirst nên firstPerson là cô dâu). Nhãn gốc là "Ông Bà"
                  (trường parentTitle trong dữ liệu), tên cha mẹ ĐẬM cỡ 14/15px,
                  địa chỉ 12/13px — chỉ hiện khi dữ liệu có địa chỉ (mô hình
                  app chưa có trường này thì không hiện, không bịa). */}
              <div className="mx-auto mt-5 grid w-full max-w-[560px] grid-cols-[1fr_auto_1fr] grid-rows-[repeat(4,auto)] justify-center gap-x-3 gap-y-1 md:gap-x-8">
                <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center text-center">
                  <span className="font-display text-[14px] md:text-[15px]" style={{ color: "#710001" }}>Ông Bà</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{data.brideFather}</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{data.brideMother}</span>
                  {data.brideParentsAddress && (
                    <span className="mt-1 whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: "#710001" }}>{data.brideParentsAddress}</span>
                  )}
                </div>
                <div className="row-span-4 h-[60px] w-[1px] self-center" style={{ backgroundColor: "#710001" }} />
                <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center text-center">
                  <span className="font-display text-[14px] md:text-[15px]" style={{ color: "#710001" }}>Ông Bà</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{data.groomFather}</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{data.groomMother}</span>
                  {data.groomParentsAddress && (
                    <span className="mt-1 whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: "#710001" }}>{data.groomParentsAddress}</span>
                  )}
                </div>
              </div>
              {/* Lời mời ($V gốc): nằm GIỮA cha mẹ và tên lớn, uppercase,
                  16px md:20px, tối đa 560px. Dùng data.message của app. */}
              {data.message && (
                <p className="font-display mx-auto mt-6 max-w-[560px] whitespace-pre-line text-[16px] uppercase leading-[1.4] md:text-[20px]" style={{ color: "#710001" }}>
                  {data.message}
                </p>
              )}
              {/* Tên lớn (om gốc): EB Garamond (không phải Playfair), auto-fit
                  base 40px mobile / 64px md+ (tức ~7.3% chiều rộng cột 872px),
                  tên xếp chồng: cô dâu trước, dấu & lớn đứng riêng một dòng,
                  rồi chú rể. Nhãn thứ bậc ("Út Nữ"/"Út Nam") nằm DƯỚI mỗi tên,
                  12px md:13px, uppercase, tracking 0.2em — chỉ hiện khi dữ
                  liệu có (bản gốc cũng ẩn khi trống). */}
              <div className="mt-6 flex w-full flex-col items-center gap-2">
                <div className="flex w-full flex-col items-center">
                  <h3 className="font-eb-garamond whitespace-nowrap leading-[1.2]" style={{ color: "#710001", fontSize: "clamp(26px, 7.34cqw, 64px)" }}>{data.brideName}</h3>
                  {data.brideBirthOrder && (
                    <div className="font-display mt-1 text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: "#710001" }}>{data.brideBirthOrder}</div>
                  )}
                </div>
                {/* Trạng thái trống (vòng 14): chỉ render "&" khi CẢ 2 tên
                    đều có chữ — tên trống thì đừng để dấu & lẻ loi giữa 2
                    dòng tên trống. */}
                {data.brideName?.trim() && data.groomName?.trim() ? (
                  <div className="font-eb-garamond text-[35px] leading-none md:text-[48px]" style={{ color: "#710001" }}>&amp;</div>
                ) : null}
                <div className="flex w-full flex-col items-center">
                  <h3 className="font-eb-garamond whitespace-nowrap leading-[1.2]" style={{ color: "#710001", fontSize: "clamp(26px, 7.34cqw, 64px)" }}>{data.groomName}</h3>
                  {data.groomBirthOrder && (
                    <div className="font-display mt-1 text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: "#710001" }}>{data.groomBirthOrder}</div>
                  )}
                </div>
              </div>
              {/* Hàng ngày (o7 gốc): "VÀO LÚC {giờ}" rồi [thứ | số ngày lớn |
                  tháng], năm riêng một dòng, ghi chú âm lịch trong ngoặc.
                  (Header ceremony của bản gốc không có trường tương ứng trong
                  mô hình app nên bỏ qua, không bịa.) */}
              {parts && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  {/* Tiêu đề lễ (o7 gốc, spec §4): trường dữ liệu ceremonies[0].header
                      / ceremonyHeader; để trống thì dùng dòng mặc định của mẫu
                      (bản gốc cũng có giá trị mặc định này). 16px md:20px,
                      whitespace-pre-line, căn giữa, nằm TRÊN "VÀO LÚC". */}
                  <p className="whitespace-pre-line text-[16px] uppercase leading-[1.4] md:text-[20px]" style={{ color: "#710001" }}>
                    {data.ceremonyHeader?.trim()
                      ? data.ceremonyHeader
                      : vi
                        ? "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"
                        : "WEDDING CEREMONY AT\nFAMILY HOME"}
                  </p>
                  <p className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>
                    {vi ? `Vào lúc ${data.time}` : `At ${data.time}`}
                  </p>
                  <div className="flex items-center justify-center" style={{ color: "#710001" }}>
                    <span className="w-[70px] text-right text-[14px] uppercase md:w-[85px] md:text-[15px]">{parts.weekday}</span>
                    <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">|</span>
                    <span className="text-[32px] leading-none md:text-[38px]">{parts.day}</span>
                    <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">|</span>
                    <span className="text-left text-[14px] uppercase md:text-[15px]">{parts.monthDisplay}</span>
                  </div>
                  <p className="text-[20px] md:text-[22px]" style={{ color: "#710001" }}>{parts.year}</p>
                  {parts.lunarNote && (
                    <p className="text-[13px] md:text-[14px]" style={{ color: "#710001" }}>({parts.lunarNote})</p>
                  )}
                </div>
              )}
            </div>
            {/* Album ảnh (gallery gốc, spec §4: nằm ngay sau khối THÔNG TIN,
                trước section tiệc). Trang khách ẩn section Album riêng khi
                mẫu deco để không trùng — xem thiep/[id]/page.tsx.
                Vòng 12: bản gốc dùng carousel coverflow 3D (ảnh giữa lớn,
                ảnh hai bên nghiêng/thu nhỏ) chứ không phải lưới phẳng.
                Vòng 13: xòe mạnh hơn — vòng 12 chỉ dịch 58%/bước nên ảnh
                hai bên chỉ lộ ~5–10px mép, nhìn như slider 1 ảnh. Nay ảnh
                giữa 300px (~54% track 560px), ảnh kề dịch 72%/bước
                (216px), nghiêng 38°, thu 0.75, mờ 0.9; ảnh xa dịch 144%,
                nghiêng 55°, thu 0.6, mờ 0.55 — ảnh hai bên hiện rõ ~130px
                (~23% track) mỗi bên, ảnh xa ló ở mép cột. Offset vòng tròn
                (modulo) để 2 đầu carousel vẫn có ảnh 2 bên. Ảnh vẫn là
                PRESET_PHOTOS (ảnh mẫu khác cặp đôi demo là chấp nhận được
                — chỉ đổi định dạng, không bịa ảnh).
                Vòng 14: khung ảnh DỌC tỉ lệ 2:3 (300×450, track cao 470px)
                như bản gốc (~320×485) — vòng 13 khung ngang 300×220.
                Ảnh stock ngang bị crop dọc bằng object-cover, chấp nhận
                được, đúng định dạng gốc; hình học xòe ngang giữ nguyên. */}
            <section className="relative z-20 mx-auto mt-10 w-full max-w-[560px]" aria-label={vi ? "Album ảnh cưới" : "Wedding album"}>
              <h3 className="font-display text-center text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
                {vi ? "ALBUM ẢNH" : "ALBUM"}
              </h3>
              <div className="relative mx-auto mt-4 h-[470px] w-full" style={{ perspective: "1000px" }}>
                {PRESET_PHOTOS.map((p, i) => {
                  const n = PRESET_PHOTOS.length;
                  const raw = (((i - coverIdx) % n) + n) % n;
                  const off = raw > n / 2 ? raw - n : raw;
                  const a = Math.abs(off);
                  if (a > 2) return null;
                  const rotY = off === 0 ? 0 : (a === 2 ? 55 : 38) * Math.sign(off);
                  const scale = a === 0 ? 1 : a === 1 ? 0.75 : 0.6;
                  return (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setCoverIdx(i)}
                      aria-label={p.label}
                      className="absolute left-1/2 top-1/2 h-[450px] w-[300px] max-w-[86%] cursor-pointer overflow-hidden rounded-2xl border-0 p-0 shadow-lg"
                      style={{
                        transform: `translate(-50%, -50%) translateX(${off * 72}%) rotateY(${rotY}deg) translateZ(${-a * 80}px) scale(${scale})`,
                        opacity: a === 0 ? 1 : a === 1 ? 0.9 : 0.55,
                        zIndex: 10 - a,
                        transition: "transform 0.45s ease, opacity 0.45s ease",
                      }}
                    >
                      <img src={p.url} alt={p.label} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
                <button type="button" onClick={() => setCoverIdx((coverIdx - 1 + PRESET_PHOTOS.length) % PRESET_PHOTOS.length)} aria-label={vi ? "Ảnh trước" : "Previous photo"} className="absolute left-0 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-xl" style={{ borderColor: "#710001", color: "#710001", background: "#f9ede3" }}>‹</button>
                <button type="button" onClick={() => setCoverIdx((coverIdx + 1) % PRESET_PHOTOS.length)} aria-label={vi ? "Ảnh sau" : "Next photo"} className="absolute right-0 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-xl" style={{ borderColor: "#710001", color: "#710001", background: "#f9ede3" }}>›</button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                {PRESET_PHOTOS.map((p, i) => (
                  <button key={p.url} type="button" onClick={() => setCoverIdx(i)} aria-label={p.label} className="h-2 cursor-pointer rounded-full border-0 p-0 transition-all" style={{ width: i === coverIdx ? 20 : 8, background: i === coverIdx ? "#710001" : "#71000155" }} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
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
          </>
        )}
        {/* Cha mẹ đã nằm trong khối THÔNG TIN LỄ CƯỚI ở nhánh deco nên
            lưới chung này chỉ render cho mẫu không-deco (tránh trùng). */}
        {!deco && (
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
        )}
        {/* Thẻ be bo tròn chứa ngày/giờ/địa điểm/nút bản đồ KHÔNG tồn tại trong
            bản gốc nên chỉ giữ cho mẫu không-deco; mẫu deco trình bày ngày
            trong khối THÔNG TIN (trên) và địa điểm/bản đồ trong section tiệc
            (dưới, sau Lịch trình) theo đúng vị trí bản gốc. */}
        {!deco && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl p-5" style={{ background: p.card, border: `1px solid ${p.gold}` }}>
          <p className={`${fontClass} text-2xl font-bold`}>{vi ? formatDateVi(data.date) : data.date}</p>
          <p className="mt-1 text-lg">{vi ? `Lúc ${data.time}` : `At ${data.time}`}</p>
          <p className="mt-2 font-semibold">{data.venue}</p>
          <p className="text-sm" style={{ color: p.muted }}>{data.address}</p>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: p.accent }}>
            {vi ? "Xem bản đồ" : "View map"} ↗
          </a>
        </div>
        )}
        {/* Đếm ngược: bản gốc KHÔNG có đếm ngược trong khối THÔNG TIN — nó nằm
            ở section tiệc, sau Lịch trình. Mẫu không-deco giữ vị trí cũ. */}
        {!deco && <Countdown date={data.date} time={data.time} accent={p.accent} />}
        {!deco && (
        <p className="mx-auto mt-6 max-w-lg whitespace-pre-line text-sm leading-relaxed sm:text-base">{data.message}</p>
        )}
        {/* Lịch trình dạng hàng be chỉ giữ cho mẫu không-deco; mẫu deco
            dùng timeline dọc có chấm ở cuối trang (sau dress code). */}
        {!deco && schedule.length > 0 && (
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
        {/* Section tiệc (zp gốc, chỉ mẫu deco): thứ tự gốc sau album là
            tiệc → địa điểm/bản đồ → dress code → timeline (spec §4).
            Tiêu đề THÔNG TIN TIỆC CƯỚI, nhãn "TIỆC CƯỚI SẼ DIỄN RA VÀO
            LÚC:" + giờ lớn, cặp ĐÓN KHÁCH (giờ − 30 phút) / KHAI TIỆC
            (giờ), hàng ngày (năm ẨN như bản gốc), ghi chú âm lịch,
            lịch tháng + nút "Thêm vào lịch".
            KHÔNG có đếm ngược (vòng 12): bản gốc có code đếm ngược trong
            zp nhưng demo (ngày 03.05.2026 đã qua lúc QA xem) không hiện —
            QA11 ghi "bản gốc không có đếm ngược ở đâu cả" nên bỏ với deco
            cho khớp hình demo; mẫu không-deco giữ đếm ngược như cũ. */}
        {deco && (
          <section className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Thông tin tiệc cưới" : "Reception info"}>
            <h3 className="font-display text-[16px] uppercase md:text-[20px]" style={{ color: "#710001" }}>
              {vi ? "THÔNG TIN TIỆC CƯỚI" : "RECEPTION INFO"}
            </h3>
            <p className="mt-3 text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>
              {vi ? "Tiệc cưới sẽ diễn ra vào lúc:" : "The reception will take place at:"}
            </p>
            <p className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{data.time}</p>
            <div className="mt-4 flex items-start justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>{vi ? "Đón khách" : "Welcome"}</span>
                <span className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{welcomeTime}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>{vi ? "Khai tiệc" : "Reception"}</span>
                <span className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{data.time}</span>
              </div>
            </div>
            {parts && (
              <>
                {/* Hàng ngày ở section tiệc: tên thứ KHÔNG ngắt dòng (vòng 12:
                    "CHỦ NHẬT" 18–20px không vừa hộp 70/85px nên ngắt 2 dòng)
                    — dùng w-auto + min-w + whitespace-nowrap. */}
                <div className="mt-3 flex items-center justify-center" style={{ color: "#710001" }}>
                  <span className="w-auto min-w-[70px] whitespace-nowrap text-right text-[18px] font-semibold uppercase md:min-w-[85px] md:text-[20px]">{parts.weekday}</span>
                  <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">/</span>
                  <span className="text-[30px] font-semibold leading-none md:text-[36px]">{parts.day}</span>
                  <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">/</span>
                  <span className="whitespace-nowrap text-left text-[18px] font-semibold uppercase md:text-[20px]">{parts.monthDisplay}</span>
                </div>
                {parts.lunarNote && (
                  <p className="mt-1 text-[13px] md:text-[14px]" style={{ color: "#710001" }}>({parts.lunarNote})</p>
                )}
              </>
            )}
            {calCells.length > 0 && (
              // Khung viền bo tròn quanh lịch (vòng 16): bản gốc lịch nằm
              // trong một hộp có viền bo tròn. Lịch rộng 388px (ô ~52px như
              // bản gốc đo vòng 14) để tim 30px = ~59% ô.
              <div className="mx-auto mt-5 w-full max-w-[388px] rounded-2xl border px-4 py-3" style={{ borderColor: "#71000155" }}>
                {/* Tiêu đề tháng/năm của lịch (bản gốc: "Tháng 5 / 2026"). */}
                {calTitle && (
                  <p className="mb-2 text-center text-[16px] font-semibold md:text-[18px]" style={{ color: "#710001" }}>{calTitle}</p>
                )}
                <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold uppercase" style={{ color: "#710001" }}>
                  {(vi ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]).map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]" style={{ color: "#710001" }}>
                  {calCells.map((c, i) =>
                    c === null ? (
                      <span key={i} />
                    ) : c === calDay ? (
                      // Ngày cưới tô bằng TRÁI TIM đỏ ĐẶC (bản gốc đánh
                      // dấu ngày cưới bằng hình trái tim, không phải vòng
                      // tròn đặc) — số ngày trắng đậm chồng lên tim.
                      // Vòng 14: tim vẽ bằng SVG path TÔ FILL đặc (không
                      // dùng ký tự ♥ của font — font render nó thành
                      // outline RỖNG ~18–20px nên số trắng trên nền kem
                      // không đọc được, đúng lỗi QA13 nêu), 32px trong ô
                      // ~42px, số 15px extrabold trắng.
                      // Vòng 15: fill đổi #710001 (maroon sẫm) → #c1272d
                      // (đỏ tươi) — QA14: tim gốc đỏ tươi hơn tim ta.
                      // Vòng 16: SAI — QA15 soi phóng to thấy tim gốc thực
                      // ra là ĐỎ SẪM maroon LỚN, nhận định "tim gốc đỏ
                      // tươi" ở vòng 14 là sai, #c1272d sai theo. Đổi fill
                      // VỀ #710001, tim 30px trong ô ~52px (≈ 59% ô, gốc
                      // ~30px trong ô ~51px).
                      <span key={i} className="relative flex aspect-square items-center justify-center">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[30px] w-[30px]" style={{ fill: "#710001" }}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold" style={{ color: "#ffffff" }}>{c}</span>
                      </span>
                    ) : (
                      <span key={i} className="flex aspect-square items-center justify-center rounded-full">{c}</span>
                    )
                  )}
                </div>
              </div>
            )}
            {calUrl && (
              <div className="mt-4">
                <a href={calUrl} target="_blank" rel="noreferrer" className="text-sm tracking-wider underline underline-offset-4 decoration-1 transition-opacity hover:opacity-70" style={{ color: "#710001" }}>
                  {vi ? "Thêm vào lịch" : "Add to calendar"} ↗
                </a>
              </div>
            )}
          </section>
        )}
        {/* Địa điểm / bản đồ (ie gốc, sau section tiệc): tiêu đề
            "TIỆC CƯỚI SẼ TỔ CHỨC TẠI", tên địa điểm nghiêng serif 20/24px
            (vòng 16: bản gốc viết thường xen hoa, không sans đậm IN HOA),
            địa chỉ dạng pill, BẢN ĐỒ NHÚNG zoom z=16 vào địa điểm (vòng 16:
            trước không zoom nên hiện toàn Hà Nội + lớp phủ ctrl+scroll,
            không thấy ghim; bản gốc zoom vào địa điểm với ghim + place
            card), cao 280px md:380px, tối đa 340px md:560px, bo 16px —
            đúng số gốc, link "Xem bản đồ". */}
        {deco && (
          <section className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Địa điểm tiệc cưới" : "Reception venue"}>
            <h3 className="font-display text-[16px] uppercase md:text-[20px]" style={{ color: "#710001" }}>
              {vi ? "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" : "THE RECEPTION WILL BE HELD AT"}
            </h3>
            {/* Tên địa điểm (vòng 16): bản gốc là chữ NGHIÊNG serif, viết
                thường xen hoa — KHÔNG sans đậm IN HOA như trước. Giữ nguyên
                chữ hoa/thường như dữ liệu nhập, không uppercase. */}
            <p className="mt-3 font-eb-garamond text-[20px] italic md:text-[24px]" style={{ color: "#710001" }}>{data.venue}</p>
            {/* Trạng thái trống (vòng 14): chỉ render pill địa chỉ và iframe
                bản đồ khi có địa chỉ — không địa chỉ thì iframe nhúng sẽ
                hiện khung bản đồ thế giới trống. */}
            {data.address?.trim() && (
              <p className="mx-auto mt-4 max-w-sm rounded-full px-4 py-2 text-sm md:max-w-[600px] md:px-6 md:py-3" style={{ color: "#710001" }}>{data.address}</p>
            )}
            {data.address?.trim() && (
              <iframe
                title={vi ? "Bản đồ địa điểm tiệc cưới" : "Reception venue map"}
                src={mapEmbedUrl}
                loading="lazy"
                className="mx-auto mt-4 h-[280px] w-full max-w-[340px] rounded-2xl md:h-[380px] md:max-w-[560px]"
                style={{ border: 0 }}
              />
            )}
            <div className="mt-3">
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-sm tracking-wider underline underline-offset-4 decoration-1 transition-opacity hover:opacity-70" style={{ color: "#710001" }}>
                {vi ? "Xem bản đồ" : "View map"} ↗
              </a>
            </div>
          </section>
        )}
        {/* Dress code (bản gốc: showDresscode=true, 3 màu, tiêu đề
            "DRESS CODE", phụ đề "Trang phục dự tiệc" / "Party Attire").
            Chỉ hiện khi dữ liệu có màu; thứ tự gốc: sau bản đồ, trước
            timeline. */}
        {deco && dressColors.length > 0 && (
          <section className="relative z-20 mx-auto mt-10 text-center" aria-label="Dress code">
            <h3 className="font-display text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>DRESS CODE</h3>
            <p className="mt-1 text-sm md:text-base" style={{ color: "#710001" }}>{vi ? "Trang phục dự tiệc" : "Party Attire"}</p>
            <div className="mt-5 flex items-center justify-center gap-4">
              {dressColors.map((c) => (
                <span key={c} title={c} className="h-12 w-12 rounded-full border" style={{ background: c, borderColor: "#71000133" }} />
              ))}
            </div>
          </section>
        )}
        {/* Lịch trình (timeline gốc, sau bản đồ + dress code): timeline dọc
            có chấm — đường kẻ dọc chấm + chấm tròn + giờ/mô tả từng mốc.
            Vòng 13: mỗi mốc 1 dòng — vòng 12 xếp chồng giờ trên nhãn.
            Vòng 14: giờ CĂN PHẢI trong cột trái 54px, nhãn NGHIÊNG serif
            (EB Garamond italic) ở cột phải — nhưng chấm vẫn nằm BÊN TRÁI
            cả hai cột (đường kẻ ở mép trái hàng), QA14 vẫn FAIL bố cục.
            Vòng 15: cấu trúc lại đúng bản gốc — [giờ căn phải, serif
            thường, cột trái 54px] | [chấm TRÊN đường kẻ dọc ở GIỮA hai
            cột (đường kẻ left 66px = 54 + 12, chấm giữa cột 24px)] |
            [nhãn italic serif, cột phải]. Giờ KHÔNG đậm.
            Vòng 16: căn giữa + lớn hơn — khối timeline max-w 540px +
            mx-auto (trước max-w-md 448px nên chiếm nửa trái cột, chấm
            lệch ~150px so với giữa cột, bên phải trống lớn), giãn dòng
            space-y-7, giờ/nhãn 16px (trước 15px). Giữ nguyên thứ tự giờ
            | chấm | nhãn, đường kẻ chấm, nhãn italic serif.
            Tiêu đề gốc "LỊCH TRÌNH NGÀY CƯỚI" / "WEDDING DAY SCHEDULE". */}
        {deco && schedule.length > 0 && (
          <section className="relative z-20 mx-auto mt-10 w-full max-w-[540px] text-left" aria-label={vi ? "Lịch trình ngày cưới" : "Wedding day schedule"}>
            <h3 className="font-display text-center text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>
              {vi ? "LỊCH TRÌNH NGÀY CƯỚI" : "WEDDING DAY SCHEDULE"}
            </h3>
            <ol className="relative mt-6 space-y-7">
              <span aria-hidden="true" className="absolute bottom-[11px] left-[66px] top-[11px] border-l-2 border-dotted" style={{ borderColor: "#710001" }} />
              {schedule.map((s, i) => (
                <li key={i} className="relative flex items-baseline">
                  <span className="w-[54px] shrink-0 text-right font-eb-garamond text-[16px]" style={{ color: "#710001" }}>{s.time}</span>
                  <span className="flex w-6 shrink-0 items-center justify-center self-center">
                    <span className="block h-3 w-3 rounded-full" style={{ background: "#710001" }} />
                  </span>
                  <span className="min-w-0 flex-1 font-eb-garamond text-[16px] italic" style={{ color: "#710001" }}>{s.label}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {/* Câu chuyện chỉ giữ cho mẫu không-deco; bản gốc không có section
            này với mẫu Song Phụng Đỏ nên ẩn với deco (vòng 12). */}
        {!deco && data.story && (
          <section className="mx-auto mt-6 max-w-lg text-left" aria-label={vi ? "Câu chuyện tình yêu" : "Our story"}>
            <h3 className="text-center font-semibold" style={{ color: p.accent }}>{vi ? "Câu chuyện của chúng tôi" : "Our story"}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{data.story}</p>
          </section>
        )}
        {/* ĐÃ BỎ ảnh cưới khổ lớn đứng riêng dưới lịch trình (vòng 14):
            bản gốc không có ảnh lẻ ở đây (chỗ đó là guestbook/gift đã bỏ
            khỏi app) — album coverflow ở trên đã đủ. Trước đây khối này
            render 1 ảnh photoUrl ngay dưới section lịch trình. */}
        {/* ĐÃ BỎ dòng chú thích nội bộ về tên mẫu/giấy/khung ở cuối thiệp
            (vòng 10): bản gốc không có dòng này, nó là chữ nội bộ lọt ra ngoài. */}
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
