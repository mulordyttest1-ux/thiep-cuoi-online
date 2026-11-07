"use client";

import { useState } from "react";
import { motion as FM, useReducedMotion } from "framer-motion";
import type { InvitationData, StdEditField } from "@/lib/types";
import { formatDateVi, minusMinutes, parseDressCode, parseSchedule } from "@/lib/types";
import { getTemplate, getTemplateEffects, PRESET_PHOTOS, TEMPLATE_FONT_CLASS } from "@/lib/templates";
import { getDateParts } from "@/lib/lunar";
import { effectiveCeremonyDate } from "@/lib/cep";
import { customTextValue } from "@/lib/custom-texts";
import Countdown from "./Countdown";
import TemplateMotif from "./TemplateMotif";
import { SongPhungBand } from "./SongPhungDecor";
import { GoldSparkles, ImageReveal, KenBurns, Marquee, ParallaxLayer, PetalFall, PinnedHero, ScrollReveal, SplitLines, StaggeredText, Twinkle } from "./effects";

const FRAME_OUTER: Record<string, number> = { single: 2, double: 3, triple: 4, scallop: 2, band: 2 };
const FRAME_INNER: Record<string, string> = {
  single: "1px solid",
  double: "1px solid",
  triple: "3px double",
  scallop: "2px dotted",
  band: "1px solid",
};

export type SensitiveField = "names" | "date" | "time" | "venue";

export default function InvitationPreview({ data, guestName, motion, blurred, revealedField, onSensitiveClick, editable, onFieldTap, onCustomTextTap, customTexts, editedFields, editedCustomTexts }: {
  data: InvitationData;
  guestName?: string;
  motion?: boolean;
  /** Demo online (v3-final): blur tên/ngày/giờ/địa điểm. Không truyền = thiệp rõ như cũ (trang khách, editor thường). */
  blurred?: boolean;
  /** Trường đang được bấm xem rõ / sửa trong demo — hiện rõ lại. */
  revealedField?: SensitiveField | null;
  /** Bấm vào một ô đang blur trong demo. */
  onSensitiveClick?: (field: SensitiveField) => void;
  /** Chế độ sửa cho khách (mẫu chuẩn #1): bấm vào nội dung thì mở box sửa
   *  tại chỗ đó. Không truyền = thiệp chỉ đọc như cũ, không đổi gì. */
  editable?: boolean;
  /** Bấm vào một trường dữ liệu trong chế độ sửa (field + rect viewport). */
  onFieldTap?: (field: StdEditField, rect: { top: number; left: number; bottom: number; width: number }) => void;
  /** Bấm vào một câu mẫu trong chế độ sửa (key + rect viewport). */
  onCustomTextTap?: (key: string, rect: { top: number; left: number; bottom: number; width: number }) => void;
  /** Câu mẫu đã sửa (khóa -> chữ mới) — hiển thị thay cho chữ gốc của mẫu. */
  customTexts?: Record<string, string>;
  /** Trường dữ liệu đã sửa — đánh dấu nhẹ trên thiệp (nền nhạt + chấm). */
  editedFields?: Set<string>;
  /** Câu mẫu đã sửa — đánh dấu MẠNH (nền vàng + nhãn "cần sửa tay"). */
  editedCustomTexts?: Set<string>;
}) {
  const tpl = getTemplate(data.templateId);
  const p = tpl.palette;
  const deco = tpl.decorationImages;
  // Bộ hiệu ứng của mẫu (khai báo trong templates.ts, không có thì sinh theo
  // id — xem specs/song-phung-do.md §4h). motion=true chỉ ở trang khách:
  // editor/thumbnail/dialog preview để false để bố cục đứng yên như QA17.
  const fx = getTemplateEffects(data.templateId);
  const fontClass = TEMPLATE_FONT_CLASS[tpl.font];
  const reduce = useReducedMotion();
  const nameSize = tpl.font === "script" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl";
  const schedule = parseSchedule(data.scheduleText);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${data.venue} ${data.address}`.trim()
  )}`;
  const vi = data.language !== "en";
  // Blur demo online (v3-final): chỉ blur 4 nhóm nhạy cảm — tên cặp đôi,
  // ngày, giờ, địa điểm. Họa tiết/màu sắc/hiệu ứng giữ sắc nét. Khi không
  // blur hoặc trường đang được sửa thì render y hệt như cũ (không bọc thêm
  // phần tử nào) để bố cục QA17 không đổi.
  const blurField = (field: SensitiveField, children: React.ReactNode, className?: string) => {
    if (!blurred || revealedField === field) return <>{children}</>;
    return (
      <span
        role="button"
        tabIndex={0}
        title="Bấm để xem rõ khi sửa"
        aria-label="Bấm để xem rõ khi sửa"
        onClick={(e) => { e.stopPropagation(); onSensitiveClick?.(field); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSensitiveClick?.(field); } }}
        className={`inline-block cursor-pointer select-none blur-[7px] ${className ?? ""}`}
      >
        {children}
      </span>
    );
  };
  // Blur cho khối lớn (lịch tháng): gắn trực tiếp class + onClick vào khối,
  // không bọc thêm phần tử.
  const blurCls = (field: SensitiveField) =>
    blurred && revealedField !== field ? "cursor-pointer select-none blur-[7px]" : "";
  const blurClick = (field: SensitiveField) => (e: React.MouseEvent) => {
    if (blurred && revealedField !== field) { e.stopPropagation(); onSensitiveClick?.(field); }
  };
  // Coverflow album (chỉ mẫu deco): chỉ số ảnh đang ở giữa.
  const [coverIdx, setCoverIdx] = useState(0);
  // Section tiệc (chỉ mẫu deco): giờ đón khách = giờ cưới trừ 30 phút
  // (mẫu bản gốc: đón 17:30 / tiệc 18:00), màu dress code, bản đồ nhúng.
  const welcomeTime = deco ? minusMinutes(data.time, 30) : "";
  // Giờ lễ (mặc định = giờ tiệc): dòng "VÀO LÚC" trong khối THÔNG TIN dùng
  // giờ lễ; các mục tiệc vẫn dùng giờ tiệc.
  const ceremonyTime = data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
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
  // Ngày làm lễ (khối THÔNG TIN): lễ có ngày riêng — trước đây khối này
  // dùng nhầm parts (ngày tiệc) nên ngày lễ hiện sai khi lễ ≠ tiệc.
  const leParts = deco ? getDateParts(effectiveCeremonyDate(data)) : null;
  // --- Chế độ sửa cho khách (mẫu chuẩn #1): bấm vào nội dung -> box sửa ---
  const tapRect = (e: React.MouseEvent): { top: number; left: number; bottom: number; width: number } => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { top: r.top, left: r.left, bottom: r.bottom, width: r.width };
  };
  // Dấu đã sửa: trường dữ liệu = chấm nhẹ; câu mẫu = nền vàng + nhãn.
  const editedDot = (
    <span aria-label="Đã sửa" title="Đã sửa" className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a86a] text-[10px] font-bold leading-none text-white">•</span>
  );
  const manualTag = (
    <span className="ml-1 inline-block rounded-full bg-[#b45309] px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase leading-none text-white">cần sửa tay</span>
  );
  // Trường dữ liệu: bấm vào mở box sửa. strong=true (vd lời mời): không có
  // khóa CEP nên sửa không vào ghost text — đánh dấu MẠNH như câu mẫu.
  const editWrap = (field: StdEditField, children: React.ReactNode, opts?: { strong?: boolean }) => {
    if (!editable) return <>{children}</>;
    const edited = editedFields?.has(field);
    const strong = opts?.strong ?? false;
    return (
      <span
        data-edit-field={field}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onFieldTap?.(field, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFieldTap?.(field, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative inline-block cursor-pointer rounded px-0.5 outline-dashed outline-1 hover:bg-[#7a1f2b14] focus:outline-[#7a1f2b] ${strong ? "outline-[#b45309]" : "outline-[#7a1f2b55]"} ${edited ? (strong ? "bg-[#ffe58a]" : "bg-[#c9a86a26]") : ""}`}
        title={strong ? "Bấm để sửa lời (không vào ghost text — cần sửa tay trong Illustrator khi in)" : "Bấm để sửa"}
      >
        {children}
        {edited && !strong && editedDot}
        {edited && strong && manualTag}
      </span>
    );
  };
  // Khối (ngày có cấu trúc): bấm vào mở lịch.
  const editBlock = (field: StdEditField, children: React.ReactNode) => {
    if (!editable) return <>{children}</>;
    const edited = editedFields?.has(field);
    return (
      <div
        data-edit-field={field}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onFieldTap?.(field, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFieldTap?.(field, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative cursor-pointer rounded px-1 outline-dashed outline-1 outline-[#7a1f2b55] hover:bg-[#7a1f2b14] focus:outline-[#7a1f2b] ${edited ? "bg-[#c9a86a26]" : ""}`}
        title="Bấm để sửa"
      >
        {children}
        {edited && editedDot}
      </div>
    );
  };
  // Câu mẫu: bấm vào mở box sửa lời; đã sửa thì nền vàng + "cần sửa tay".
  const customWrap = (key: string, children: React.ReactNode) => {
    if (!editable) return <>{children}</>;
    const edited = editedCustomTexts?.has(key);
    return (
      <span
        data-edit-custom={key}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onCustomTextTap?.(key, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCustomTextTap?.(key, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative inline-block cursor-pointer rounded px-0.5 outline-dashed outline-1 outline-[#b45309] hover:bg-[#ffe58a66] focus:outline-[#b45309] ${edited ? "bg-[#ffe58a]" : ""}`}
        title="Bấm để sửa lời (câu mẫu — sửa tay trong Illustrator khi in)"
      >
        {children}
        {edited && manualTag}
      </span>
    );
  };
  // Chữ câu mẫu đang hiển thị (đã sửa thì lấy customTexts, chưa thì mặc định).
  const headerLine1 = customTextValue("ceremonyHeaderLine1", customTexts, data);
  const partyHeader = customTextValue("partyHeader", customTexts, data);
  // Nơi làm lễ hiển thị ở chế độ sửa: lấy theo dữ liệu in (ceremonyVenue =
  // khóa ceremony.ten trong ghost text). ceremonyHeader dòng 2 chỉ là chữ
  // hiển thị web — khi venue trống mới dùng nó, rồi tới "TƯ GIA".
  const headerLine2 = data.ceremonyVenue?.trim()
    ? data.ceremonyVenue
    : ((data.ceremonyHeader ?? "").split("\n")[1]?.trim() || "TƯ GIA");
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
          <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"}>
          {/* Màn hero ghim (B4): desktop ghim hero rồi nhả (Hỷ nở, tên trồi,
              dải wipe), điện thoại chỉ scrub không ghim. Chương 1/6. */}
          <PinnedHero disabled={!motion || fx.cinema?.pinned === false}>
          <section data-chapter="1" className="songphung-hero relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8" style={{ containerType: "inline-size" }}>
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
              data-hero-names
              className="font-display relative z-20 mt-[7%] w-fit text-left text-2xl uppercase leading-[1.11] sm:text-3xl"
              style={{ color: "#710001", fontWeight: 400, fontSize: "clamp(20px, 5.96cqw, 52px)", marginLeft: "12.3%" }}
            >
              {/* Tên hero — chữ nhảy (GSAP SplitText): từng từ nhô lên từ
                  sau mặt nạ (yPercent 120 → 0, expo.out, 0.8s, stagger
                  0.04s) ngay khi mở phong bì. Mặt nạ cắt từ lúc bay nên
                  không chồng lên dòng khác; lề từng dòng đặt trên WRAPPER
                  block (bài học QA19: marginTop trên span inline bị bỏ qua
                  làm "THU AN"/"MINH QUÂN" dính nhau). 4 sao lấp lánh quanh
                  tên, chỉ ở trang khách. */}
              {blurField("names", (
              <SplitLines
                disabled={!motion}
                trigger="mount"
                className="block"
                lines={[
                  { text: data.brideName, style: { marginLeft: "1.7%" }, className: "whitespace-nowrap" },
                  { text: data.groomName, style: { marginLeft: "5.5%", marginTop: "1.1%" }, className: "whitespace-nowrap" },
                ]}
              />
              ), "block")}
              <Twinkle
                disabled={!motion}
                positions={[
                  { left: 2, top: 20 },
                  { left: 98, top: 15 },
                  { left: 92, top: 80 },
                  { left: 5, top: 75 },
                ]}
              />
            </h2>
            <div className="relative z-0" style={{ marginTop: "6.2%" }}>
              <SongPhungBand deco={deco} motion={motion} parallax={fx.parallax} />
            </div>
            {/* Khoảng kem dưới dải: 26.5% chiều rộng (= 240px gốc, header
                pb-240, spec §1). Vòng 12 sửa từ 50%: 50% khiến đuôi phụng
                trái thò dài gấp đôi bản gốc và chạm sát khối THÔNG TIN —
                chính là "motif hoa đỏ đậm ở góc trên-trái khối THÔNG TIN"
                QA11 nêu (thực chất là đuôi phụng, không phải hoa). */}
            <div className="relative w-full" style={{ aspectRatio: "100 / 26.5" }} />
            </section>
            </PinnedHero>
            </ScrollReveal>
            {/* Khối THÔNG TIN LỄ CƯỚI — trích đúng code bản gốc vòng 10 (spec §4,
                module 22705): thứ tự tiêu đề → cha mẹ → lời mời → tên lớn
                xếp chồng → hàng ngày có cấu trúc. Pill khách KHÔNG có trong
                luồng này — chỉ ở phong bì.
                Lề trên 56px (= section py-14 của bản gốc); hoa HOA nằm ở
                section này, top -290px so với đầu section (tức -39.7cqw so
                với đầu khối này), góc phải, rộng 39.7%, opacity-100 — đúng
                vị trí bản gốc (hoa thò lên vùng kem và chạm nhẹ vùng tiêu đề
                phía phải, KHÔNG nằm trong khoảng kem dưới dải). */}
            <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"} wipe>
            <div data-chapter="2" className="relative z-20 mt-14 text-center">
              <ParallaxLayer speed={fx.parallax?.hoa ?? 0.4} depth={0.2} disabled={!motion} className="pointer-events-none absolute right-0 -z-10 w-[39.7%]" style={{ top: "-39.7cqw" }}>
                <img src={deco.hoa} alt="Họa tiết hoa lớn góc dưới-phải" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full object-contain" />
              </ParallaxLayer>
              {/* Tiêu đề gốc: uppercase, font-bold, 20px md:24px. */}
              <p className="font-display text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
                <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={(vi ? "THÔNG TIN LỄ CƯỚI" : "CEREMONY INFO").split(" ")} />
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
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{editWrap("brideFather", data.brideFather)}</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{editWrap("brideMother", data.brideMother)}</span>
                  {(data.brideParentsAddress || editable) && (
                    <span className="mt-1 whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: "#710001" }}>{editWrap("brideParentsAddress", data.brideParentsAddress || "+ Thêm địa chỉ")}</span>
                  )}
                </div>
                <div className="row-span-4 h-[60px] w-[1px] self-center" style={{ backgroundColor: "#710001" }} />
                <div className="row-span-4 grid min-w-0 grid-rows-subgrid justify-items-center text-center">
                  <span className="font-display text-[14px] md:text-[15px]" style={{ color: "#710001" }}>Ông Bà</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{editWrap("groomFather", data.groomFather)}</span>
                  <span className="font-display text-[14px] font-semibold [overflow-wrap:anywhere] md:text-[15px]" style={{ color: "#710001" }}>{editWrap("groomMother", data.groomMother)}</span>
                  {(data.groomParentsAddress || editable) && (
                    <span className="mt-1 whitespace-pre-line text-[12px] leading-tight md:text-[13px]" style={{ color: "#710001" }}>{editWrap("groomParentsAddress", data.groomParentsAddress || "+ Thêm địa chỉ")}</span>
                  )}
                </div>
              </div>
              {/* Lời mời ($V gốc): nằm GIỮA cha mẹ và tên lớn, uppercase,
                  16px md:20px, tối đa 560px. Dùng data.message của app.
                  Lời mời KHÔNG có khóa CEP — sửa thì vào danh sách sửa tay
                  (đánh dấu MẠNH), không vào ghost text. */}
              {(data.message || editable) && (
                <p className="font-display mx-auto mt-6 max-w-[560px] whitespace-pre-line text-[16px] uppercase leading-[1.4] md:text-[20px]" style={{ color: "#710001" }}>
                  {editWrap("message", data.message || "+ Thêm lời mời", { strong: true })}
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
                  <h3 className="font-eb-garamond whitespace-nowrap leading-[1.2]" style={{ color: "#710001", fontSize: "clamp(26px, 7.34cqw, 64px)" }}>{editWrap("brideName", blurField("names", <SplitLines disabled={!motion} trigger="inView" className="block" lines={[{ text: data.brideName }]} />))}</h3>
                  {(data.brideBirthOrder || editable) && (
                    <div className="font-display mt-1 text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: "#710001" }}>{editWrap("brideBirthOrder", data.brideBirthOrder || "+ Thêm vị thứ")}</div>
                  )}
                </div>
                {/* Trạng thái trống (vòng 14): chỉ render "&" khi CẢ 2 tên
                    đều có chữ — tên trống thì đừng để dấu & lẻ loi giữa 2
                    dòng tên trống. */}
                {data.brideName?.trim() && data.groomName?.trim() ? (
                  <div className="font-eb-garamond text-[35px] leading-none md:text-[48px]" style={{ color: "#710001" }}>&amp;</div>
                ) : null}
                <div className="flex w-full flex-col items-center">
                  <h3 className="font-eb-garamond whitespace-nowrap leading-[1.2]" style={{ color: "#710001", fontSize: "clamp(26px, 7.34cqw, 64px)" }}>{editWrap("groomName", blurField("names", <SplitLines disabled={!motion} trigger="inView" className="block" lines={[{ text: data.groomName }]} />))}</h3>
                  {(data.groomBirthOrder || editable) && (
                    <div className="font-display mt-1 text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: "#710001" }}>{editWrap("groomBirthOrder", data.groomBirthOrder || "+ Thêm vị thứ")}</div>
                  )}
                </div>
              </div>
              {/* Hàng ngày (o7 gốc): "VÀO LÚC {giờ}" rồi [thứ | số ngày lớn |
                  tháng], năm riêng một dòng, ghi chú âm lịch trong ngoặc.
                  (Header ceremony của bản gốc không có trường tương ứng trong
                  mô hình app nên bỏ qua, không bịa.) */}
              {(parts || editable) && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  {/* Tiêu đề lễ (o7 gốc, spec §4): trường dữ liệu ceremonies[0].header
                      / ceremonyHeader; để trống thì dùng dòng mặc định của mẫu
                      (bản gốc cũng có giá trị mặc định này). 16px md:20px,
                      whitespace-pre-line, căn giữa, nằm TRÊN "VÀO LÚC".
                      Chế độ sửa: dòng 1 là CÂU MẪU (không vào ghost text —
                      vd "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI"), dòng 2 là nơi làm
                      lễ (trường dữ liệu, khóa ceremony.ten, VÀO ghost text). */}
                  <p className="whitespace-pre-line text-[16px] uppercase leading-[1.4] md:text-[20px]" style={{ color: "#710001" }}>
                    {editable ? (
                      <>
                        {customWrap("ceremonyHeaderLine1", headerLine1)}
                        {"\n"}
                        {editWrap("ceremonyVenue", headerLine2)}
                      </>
                    ) : data.ceremonyHeader?.trim()
                      ? data.ceremonyHeader
                      : vi
                        ? "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"
                        : "WEDDING CEREMONY AT\nFAMILY HOME"}
                  </p>
                  <p className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>
                    {vi ? "Vào lúc " : "At "}{editable ? editWrap("ceremonyTime", ceremonyTime?.trim() ? blurField("time", ceremonyTime) : "+ Chọn giờ lễ") : blurField("time", ceremonyTime)}
                  </p>
                  {leParts ? (
                    blurField("date", editBlock("ceremonyDate", (
                      <>
                  <div className="flex items-center justify-center" style={{ color: "#710001" }}>
                    <span className="w-[70px] text-right text-[14px] uppercase md:w-[85px] md:text-[15px]">{leParts.weekday}</span>
                    <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">|</span>
                    <span className="text-[32px] leading-none md:text-[38px]">{leParts.day}</span>
                    <span className="mx-2 text-[14px] opacity-50 md:mx-3" aria-hidden="true">|</span>
                    <span className="text-left text-[14px] uppercase md:text-[15px]">{leParts.monthDisplay}</span>
                  </div>
                  <p className="text-[20px] md:text-[22px]" style={{ color: "#710001" }}>{leParts.year}</p>
                  {leParts.lunarNote && (
                    <p className="text-[13px] md:text-[14px]" style={{ color: "#710001" }}>({leParts.lunarNote})</p>
                  )}
                      </>
                    )), "block")
                  ) : editable ? (
                    editBlock("ceremonyDate", <span className="text-[14px] uppercase">+ Chọn ngày làm lễ</span>)
                  ) : null}
                </div>
              )}
            </div>
            </ScrollReveal>
            {/* Dải tên cặp đôi chạy ngang phân cách các mục (B8): chỉ trang
                khách, theo cinema.marquee của mẫu; tên trống thì Marquee
                tự ẩn. */}
            {motion && fx.cinema?.marquee !== false && (
              <Marquee text={`${data.brideName} & ${data.groomName}`} />
            )}
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
                Sửa khoảng cách (Nancy 2026-11-06: ảnh kề đè lên ảnh giữa
                69px trên điện thoại 390px, nhìn chồng ẩu): bước xòe tăng
                72% → 110%, ảnh kề cách ảnh giữa ~32px (đo trên 390px),
                ảnh xa dịch 220%. (Thử 128% trước: khoảng cách 80px nhưng
                ảnh kề bay khỏi màn hình điện thoại — kéo về 110%.)
                Chỉ đổi khoảng cách — crossfade B6, Ken Burns, opacity
                giữ nguyên.
                Vòng 15 (Nancy 2026-11-06: "để như cũ, hình đừng có fade
                hay opacity gì hết"): bỏ hẳn crossfade B6 (crossStay /
                crossToNext), bỏ opacity ảnh (1 / 0.9 / 0.55 → tất cả 1),
                bỏ wipe B7 trên ảnh album — ảnh hiện rõ ngay, một ảnh một
                lúc, không hòa mờ. Chỉ còn coverflow 3D + khoảng cách 110%
                + Ken Burns (zoom chậm, không phải mờ).
                Vòng 14: khung ảnh DỌC tỉ lệ 2:3 (300×450, track cao 470px)
                như bản gốc (~320×485) — vòng 13 khung ngang 300×220.
                Ảnh stock ngang bị crop dọc bằng object-cover, chấp nhận
                được, đúng định dạng gốc; hình học xòe ngang giữ nguyên. */}
            <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"}>
            <section data-chapter="3" className="relative z-20 mx-auto mt-10 w-full max-w-[560px]" aria-label={vi ? "Album ảnh cưới" : "Wedding album"}>
              <h3 className="font-display text-center text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
                <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={(vi ? "ALBUM ẢNH" : "ALBUM").split(" ")} />
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
                  // Ảnh album hiện rõ ngay: không crossfade, không
                  // opacity, không wipe — chỉ coverflow 3D + Ken Burns.
                  return (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setCoverIdx(i)}
                      aria-label={p.label}
                      className="absolute left-1/2 top-1/2 h-[450px] w-[300px] max-w-[86%] cursor-pointer overflow-hidden rounded-2xl border-0 p-0 shadow-lg"
                      style={{
                        transform: `translate(-50%, -50%) translateX(${off * 110}%) rotateY(${rotY}deg) translateZ(${-a * 80}px) scale(${scale})`,
                        zIndex: 10 - a,
                        transition: "transform 0.45s ease",
                      }}
                    >
                      <KenBurns disabled={!motion} duration={fx.kenBurns?.duration ?? 8} scale={fx.kenBurns?.scale ?? 1.12} direction={i % 2 === 0 ? "in" : "pan-left"} className="h-full w-full">
                        <img src={p.url} alt={p.label} loading="lazy" className="h-full w-full object-cover" />
                      </KenBurns>
                    </button>
                  );
                })}
                <FM.button type="button" whileTap={{ scale: 0.9 }} onClick={() => setCoverIdx((coverIdx - 1 + PRESET_PHOTOS.length) % PRESET_PHOTOS.length)} aria-label={vi ? "Ảnh trước" : "Previous photo"} className="absolute left-0 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-xl" style={{ borderColor: "#710001", color: "#710001", background: "#f9ede3" }}>‹</FM.button>
                <FM.button type="button" whileTap={{ scale: 0.9 }} onClick={() => setCoverIdx((coverIdx + 1) % PRESET_PHOTOS.length)} aria-label={vi ? "Ảnh sau" : "Next photo"} className="absolute right-0 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border text-xl" style={{ borderColor: "#710001", color: "#710001", background: "#f9ede3" }}>›</FM.button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                {PRESET_PHOTOS.map((p, i) => (
                  <button key={p.url} type="button" onClick={() => setCoverIdx(i)} aria-label={p.label} className="h-2 cursor-pointer rounded-full border-0 p-0 transition-all" style={{ width: i === coverIdx ? 20 : 8, background: i === coverIdx ? "#710001" : "#71000155" }} />
                ))}
              </div>
            </section>
            </ScrollReveal>
          </>
        ) : (
          <>
            {data.photoUrl && (
              <div className="mx-auto mt-5 aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl">
                <ImageReveal disabled={!motion} className="h-full w-full">
                  <KenBurns disabled={!motion} duration={fx.kenBurns?.duration ?? 8} scale={fx.kenBurns?.scale ?? 1.12}>
                    <img
                      src={data.photoUrl}
                      alt={`Ảnh cưới của ${data.groomName} và ${data.brideName}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </KenBurns>
                </ImageReveal>
              </div>
            )}
            <h2 className={`mt-6 ${fontClass} ${nameSize} font-bold leading-tight`} style={{ color: p.accent }}>
              {editWrap("groomName", blurField("names", data.groomName))} <span style={{ color: p.gold }}>&amp;</span> {editWrap("brideName", blurField("names", data.brideName))}
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
            <p>{editWrap("groomFather", data.groomFather)}</p>
            <p>{editWrap("groomMother", data.groomMother)}</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: p.accent }}>{vi ? "Nhà gái" : "Bride's family"}</p>
            <p>{editWrap("brideFather", data.brideFather)}</p>
            <p>{editWrap("brideMother", data.brideMother)}</p>
          </div>
        </div>
        )}
        {/* Thẻ be bo tròn chứa ngày/giờ/địa điểm/nút bản đồ KHÔNG tồn tại trong
            bản gốc nên chỉ giữ cho mẫu không-deco; mẫu deco trình bày ngày
            trong khối THÔNG TIN (trên) và địa điểm/bản đồ trong section tiệc
            (dưới, sau Lịch trình) theo đúng vị trí bản gốc. */}
        {!deco && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl p-5" style={{ background: p.card, border: `1px solid ${p.gold}` }}>
          <p className={`${fontClass} text-2xl font-bold`}>{editWrap("date", vi ? blurField("date", formatDateVi(data.date)) : blurField("date", data.date))}</p>
          <p className="mt-1 text-lg">{vi ? "Lúc " : "At "}{editWrap("time", blurField("time", data.time))}</p>
          <p className="mt-2 font-semibold">{editWrap("venue", blurField("venue", data.venue))}</p>
          {(data.address?.trim() || editable) && (
            <p className="text-sm" style={{ color: p.muted }}>{editWrap("address", data.address?.trim() ? blurField("venue", data.address) : "+ Thêm địa chỉ")}</p>
          )}
          <FM.a href={mapsUrl} target="_blank" rel="noreferrer" whileTap={{ scale: 0.96 }} className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: p.accent }}>
            {vi ? "Xem bản đồ" : "View map"} ↗
          </FM.a>
        </div>
        )}
        {/* Đếm ngược: bản gốc KHÔNG có đếm ngược trong khối THÔNG TIN — nó nằm
            ở section tiệc, sau Lịch trình. Mẫu không-deco giữ vị trí cũ. */}
        {!deco && <Countdown date={data.date} time={data.time} accent={p.accent} />}
        {(!deco && (data.message || editable)) && (
        <p className="mx-auto mt-6 max-w-lg whitespace-pre-line text-sm leading-relaxed sm:text-base">{editWrap("message", data.message || "+ Thêm lời mời", { strong: true })}</p>
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
          <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"} wipe>
          <section data-chapter="4" className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Thông tin tiệc cưới" : "Reception info"}>
            <h3 className="font-display text-[16px] uppercase md:text-[20px]" style={{ color: "#710001" }}>
              {editable ? (
                customWrap("partyHeader", partyHeader)
              ) : (
                <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={(vi ? "THÔNG TIN TIỆC CƯỚI" : "RECEPTION INFO").split(" ")} />
              )}
            </h3>
            <p className="mt-3 text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>
              {vi ? "Tiệc cưới sẽ diễn ra vào lúc:" : "The reception will take place at:"}
            </p>
            <p className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{editWrap("time", blurField("time", data.time))}</p>
            <div className="mt-4 flex items-start justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>{vi ? "Đón khách" : "Welcome"}</span>
                <span className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{blurField("time", welcomeTime)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[14px] uppercase md:text-[15px]" style={{ color: "#710001" }}>{vi ? "Khai tiệc" : "Reception"}</span>
                <span className="mt-1 text-[18px] font-semibold md:text-[20px]" style={{ color: "#710001" }}>{editWrap("time", blurField("time", data.time))}</span>
              </div>
            </div>
            {parts ? (
              <>
                {blurField("date", editBlock("date", (
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
                )), "block")}
              </>
            ) : editable ? (
              editBlock("date", <span className="mt-3 inline-block text-[14px] uppercase">+ Chọn ngày tiệc</span>)
            ) : null}
            {calCells.length > 0 && (
              // Khung viền bo tròn quanh lịch (vòng 16): bản gốc lịch nằm
              // trong một hộp có viền bo tròn. Lịch rộng 388px (ô ~52px như
              // bản gốc đo vòng 14) để tim 30px = ~59% ô.
              <div className={`mx-auto mt-5 w-full max-w-[388px] rounded-2xl border px-4 py-3 ${blurCls("date")}`} onClick={blurClick("date")} style={{ borderColor: "#71000155" }}>
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
                      // Vòng 17: tim vẫn nhỏ hơn gốc — QA16 đo chiều rộng
                      // đỏ nhìn thấy chỉ ~23px: path tim Material trong
                      // viewBox 24 chỉ chiếm ~83% chiều rộng hộp nên 30px
                      // hộp ≈ 25px nhìn thấy. Đặt hộp 35px → nhìn thấy
                      // ≈ 35 × 0.83 ≈ 29px (≈ 55% ô ~53px, gốc ~54%).
                      // Giữ fill #710001 đặc, số trắng 15px extrabold.
                      <span key={i} className="relative flex aspect-square items-center justify-center">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[35px] w-[35px]" style={{ fill: "#710001" }}>
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
                <FM.a href={calUrl} target="_blank" rel="noreferrer" whileTap={{ scale: 0.96 }} className="text-sm tracking-wider underline underline-offset-4 decoration-1 transition-opacity hover:opacity-70" style={{ color: "#710001" }}>
                  {vi ? "Thêm vào lịch" : "Add to calendar"} ↗
                </FM.a>
              </div>
            )}
          </section>
          </ScrollReveal>
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
          <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"} wipe>
          <section data-chapter="4" className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Địa điểm tiệc cưới" : "Reception venue"}>
            <h3 className="font-display text-[16px] uppercase md:text-[20px]" style={{ color: "#710001" }}>
              {editable ? (
                customWrap("partyHeader", partyHeader)
              ) : (
                <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={(vi ? "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" : "THE RECEPTION WILL BE HELD AT").split(" ")} />
              )}
            </h3>
            {/* Tên địa điểm (vòng 16): bản gốc là chữ NGHIÊNG serif, viết
                thường xen hoa — KHÔNG sans đậm IN HOA như trước. Giữ nguyên
                chữ hoa/thường như dữ liệu nhập, không uppercase. */}
            <p className="mt-3 font-eb-garamond text-[20px] italic md:text-[24px]" style={{ color: "#710001" }}>{editWrap("venue", blurField("venue", data.venue))}</p>
            {/* Trạng thái trống (vòng 14): chỉ render pill địa chỉ và iframe
                bản đồ khi có địa chỉ — không địa chỉ thì iframe nhúng sẽ
                hiện khung bản đồ thế giới trống. */}
            {(data.address?.trim() || editable) && (
              <p className="mx-auto mt-4 max-w-sm rounded-full px-4 py-2 text-sm md:max-w-[600px] md:px-6 md:py-3" style={{ color: "#710001" }}>{editWrap("address", data.address?.trim() ? blurField("venue", data.address) : "+ Thêm địa chỉ")}</p>
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
              <FM.a href={mapsUrl} target="_blank" rel="noreferrer" whileTap={{ scale: 0.96 }} className="text-sm tracking-wider underline underline-offset-4 decoration-1 transition-opacity hover:opacity-70" style={{ color: "#710001" }}>
                {vi ? "Xem bản đồ" : "View map"} ↗
              </FM.a>
            </div>
          </section>
          </ScrollReveal>
        )}
        {/* Dress code (bản gốc: showDresscode=true, 3 màu, tiêu đề
            "DRESS CODE", phụ đề "Trang phục dự tiệc" / "Party Attire").
            Chỉ hiện khi dữ liệu có màu; thứ tự gốc: sau bản đồ, trước
            timeline. */}
        {deco && dressColors.length > 0 && (
          <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"} wipe>
          <section data-chapter="5" className="relative z-20 mx-auto mt-10 text-center" aria-label="Dress code">
            <h3 className="font-display text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>
              <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={"DRESS CODE".split(" ")} />
            </h3>
            <p className="mt-1 text-sm md:text-base" style={{ color: "#710001" }}>{vi ? "Trang phục dự tiệc" : "Party Attire"}</p>
            <div className="mt-5 flex items-center justify-center gap-4">
              {dressColors.map((c) => (
                <span key={c} title={c} className="h-12 w-12 rounded-full border" style={{ background: c, borderColor: "#71000133" }} />
              ))}
            </div>
          </section>
          </ScrollReveal>
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
            Vòng 17: vòng 16 vẫn FAIL — chấm còn lệch ~210px so với giữa
            cột (QA16 đo). Nguyên nhân hình học: [giờ 54px][chấm 24px]
            [nhãn flex-1] trong hộp max-w-540 căn giữa → mép hộp ở
            (872−540)/2 = 166px, chấm ở 166+66 = 232px của cột 872px,
            lệch 436−232 = 204px so với giữa cột. Sửa tận gốc: bỏ max-w,
            hàng thành flex full chiều rộng cột — [cột giờ flex-1, giờ
            căn phải] | [chấm cố định 14px] | [cột nhãn flex-1]. Hai cột
            flex-1 chia đều phần còn lại nên tâm chấm = đúng 50% chiều
            rộng cột: cột 872px, padding 32px mỗi bên → section 808px,
            mỗi cột (808−14)/2 = 397px, tâm chấm ở 32+397+7 = 436px =
            872/2. Đường kẻ dọc chấm ở left calc(50%−1px) (viền 2px nên
            tâm đường kẻ trùng tâm chấm), top/bottom 13px (= nửa chiều
            cao hàng 26px, đúng tâm chấm đầu/cuối). Giãn dòng: hàng cao
            26px (leading-[26px]) + space-y-11 (44px) = 70px tâm-tâm,
            giờ/nhãn 17px. Giữ thứ tự giờ | chấm | nhãn, giờ serif
            thường căn phải, nhãn italic serif.
            Tiêu đề gốc "LỊCH TRÌNH NGÀY CƯỚI" / "WEDDING DAY SCHEDULE". */}
        {/* Dải tên cặp đôi thứ hai trước lịch trình (B8). */}
        {deco && motion && fx.cinema?.marquee !== false && (
          <Marquee text={`${data.brideName} & ${data.groomName}`} />
        )}
        {deco && schedule.length > 0 && (
          <ScrollReveal disabled={!motion} strength={fx.reveal?.strength ?? "standard"} wipe>
          <section data-chapter="6" className="relative z-20 mx-auto mt-10 w-full text-left" aria-label={vi ? "Lịch trình ngày cưới" : "Wedding day schedule"}>
            <h3 className="font-display text-center text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>
              <StaggeredText disabled={!motion} stagger={0.1} itemClassName="inline-block mr-[0.28em]" items={(vi ? "LỊCH TRÌNH NGÀY CƯỚI" : "WEDDING DAY SCHEDULE").split(" ")} />
            </h3>
            <ol className="relative mt-6 space-y-11">
              {/* Đường kẻ dọc chấm vẽ dần từ trên xuống khi mục vào khung
                  (C10); giảm chuyển động hoặc không motion thì kẻ sẵn. */}
              {motion && !reduce ? (
                <FM.span aria-hidden="true" className="absolute bottom-[13px] left-[calc(50%-1px)] top-[13px] border-l-2 border-dotted" style={{ borderColor: "#710001", transformOrigin: "top" }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ amount: 0.5, once: false }} transition={{ duration: 0.8, ease: "easeOut" }} />
              ) : (
                <span aria-hidden="true" className="absolute bottom-[13px] left-[calc(50%-1px)] top-[13px] border-l-2 border-dotted" style={{ borderColor: "#710001" }} />
              )}
              {schedule.map((s, i) => (
                <li key={i} className="relative flex items-baseline leading-[26px]">
                  <span className="min-w-0 flex-1 pr-4 text-right font-eb-garamond text-[17px]" style={{ color: "#710001" }}>{s.time}</span>
                  <span className="flex w-[14px] shrink-0 items-center justify-center self-center">
                    {motion && !reduce ? (
                      <FM.span className="block h-3 w-3 rounded-full" style={{ background: "#710001" }} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ amount: 0.6, once: false }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.08 }} />
                    ) : (
                      <span className="block h-3 w-3 rounded-full" style={{ background: "#710001" }} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 pl-4 font-eb-garamond text-[17px] italic" style={{ color: "#710001" }}>{s.label}</span>
                </li>
              ))}
            </ol>
          </section>
          </ScrollReveal>
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
      {/* Lấp lánh vàng (shadcn Sparkles: bụi mịn + điểm sáng + tia 4 cánh)
          + cánh hoa rơi khắp thiệp (chỉ trang khách, theo effects.ambient
          của mẫu; không chặn chạm/đọc — §4h). */}
      {motion && fx.ambient && (
        <>
          <GoldSparkles count={fx.ambient.count ?? 16} speed={fx.ambient.speed ?? 1} seed={data.templateId} className="pointer-events-none absolute inset-0 z-30" />
          <PetalFall count={6} seed={data.templateId} className="z-30" />
        </>
      )}
    </article>
    </div>
  );
}
