"use client";

// Các section nội dung mẫu deco (Song Phụng Đỏ) — dùng chung cho cả 2 cách
// hiển thị: slide deck (InvitationDeck) và bố cục dọc tĩnh (thumbnail thư
// viện + dự phòng). Số đo/màu/font giữ nguyên như đã kiểm chứng qua 17
// vòng QA (spec §1–§4f); chỉ thêm hiệu ứng xuất hiện khi active.
//
// Props:
// - ctx: toàn bộ dữ liệu đã tính sẵn ở InvitationPreview (ngày, lịch,
//   bản đồ, dress code, lịch trình...).
// - active: slide đang hiển thị thì true → hiệu ứng chạy; slide khác thì
//   false → nội dung ở trạng thái ẩn chờ lượt.
// - animated: false → không hiệu ứng gì cả (bố cục tĩnh, ví dụ thumbnail).
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { InvitationData, ScheduleItem } from "@/lib/types";
import type { DateParts } from "@/lib/lunar";
import type { TemplateDecorationImages } from "@/lib/templates";
import { SongPhungBand } from "./SongPhungDecor";
import AlbumCarousel from "./AlbumCarousel";

export interface DecoContext {
  data: InvitationData;
  vi: boolean;
  deco: TemplateDecorationImages;
  parts: DateParts | null;
  calCells: (number | null)[];
  calDay: number;
  calMonth: number;
  calYear: number;
  calTitle: string;
  calUrl: string | null;
  welcomeTime: string;
  dressColors: string[];
  mapEmbedUrl: string;
  mapsUrl: string;
  schedule: ScheduleItem[];
}

interface SectionProps {
  ctx: DecoContext;
  /** Slide đang hiển thị. */
  active: boolean;
  /** Bật hiệu ứng xuất hiện (false = hiện ngay, dùng cho bố cục tĩnh). */
  animated: boolean;
}

/** Mờ dần + nổi lên khi slide vào. Tắt hẳn khi animated=false hoặc
    prefers-reduced-motion. */
export function Reveal({
  active,
  animated,
  delay = 0,
  className,
  children,
}: {
  active: boolean;
  animated: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (!animated || reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Chỉ mờ dần (không nổi lên) — dùng cho dải Hỷ/phụng. */
function Fade({
  active,
  animated,
  delay = 0,
  className,
  style,
  children,
}: {
  active: boolean;
  animated: boolean;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (!animated || reduce)
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.9, delay }}
    >
      {children}
    </motion.div>
  );
}

// Tên hero hiện từng dòng (cô dâu rồi chú rể), mỗi dòng mờ dần + nổi lên.
const nameContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};
const nameLine: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/** Slide Hero — tên lệch trái, dải đỏ + chữ Hỷ, phụng hai bên, hoa.
    Số đo thật bản gốc, xem chú thích trong InvitationPreview cũ / spec §1. */
export function DecoHero({ ctx, active, animated }: SectionProps) {
  const { data, deco } = ctx;
  return (
    <section className="songphung-hero relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8" style={{ containerType: "inline-size" }}>
      {/* Tên: Playfair Display 400, cỡ 5.96% chiều rộng cột, lineHeight 1.11,
          in hoa, không dấu &. Khối tên text-left, thụt trái tổng 12.3%;
          tên 1 thụt thêm 1.7%, tên 2 thụt thêm 5.5% + mt 1.1%.
          Đuôi chữ Q của Playfair trong "MINH QUÂN" là nét chữ của font,
          không phải trang trí — giữ nguyên. */}
      <motion.h2
        className="font-display relative z-20 mt-[7%] w-fit text-left text-2xl uppercase leading-[1.11] sm:text-3xl"
        style={{ color: "#710001", fontWeight: 400, fontSize: "clamp(20px, 5.96cqw, 52px)", marginLeft: "12.3%" }}
        variants={nameContainer}
        initial={animated ? "hidden" : false}
        animate={animated ? (active ? "show" : "hidden") : "show"}
      >
        <motion.span className="block whitespace-nowrap" style={{ marginLeft: "1.7%" }} variants={nameLine}>
          {data.brideName}
        </motion.span>
        <motion.span className="block whitespace-nowrap" style={{ marginLeft: "5.5%", marginTop: "1.1%" }} variants={nameLine}>
          {data.groomName}
        </motion.span>
      </motion.h2>
      {/* Hàng dải cách đáy tên 6.2% (xem SongPhungBand: hàng 53.8%, dải 22.7%
          ở nửa dưới hàng, Hỷ 32.1% giữa hàng, phụng trái 47.5%, phụng phải
          31.4%). Section KHÔNG overflow-hidden (vòng 13): đuôi phụng trái
          thò qua đáy hero rồi vuốt nhọn, parallax -0.15 kéo rút lên khi
          cuộn — cắt ngang ở đây tạo vệt đỏ thẳng (lỗi QA11/12). */}
      <Fade active={active} animated={animated} delay={0.35} className="relative z-0" style={{ marginTop: "6.2%" }}>
        <SongPhungBand deco={deco} />
      </Fade>
      {/* Khoảng kem dưới dải: 26.5% chiều rộng (= 240px gốc, header pb-240). */}
      <div className="relative w-full" style={{ aspectRatio: "100 / 26.5" }} />
    </section>
  );
}

/** Slide Thông tin lễ cưới — tiêu đề, cha mẹ 2 bên, lời mời, tên lớn xếp
    chồng, hàng ngày có cấu trúc + ghi chú âm lịch (spec §4). */
export function DecoInfo({ ctx, active, animated }: SectionProps) {
  const { data, deco, vi, parts } = ctx;
  return (
    <div className="relative z-20 mt-14 text-center">
      <img src={deco.hoa} alt="Họa tiết hoa lớn góc dưới-phải" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute right-0 -z-10 w-[39.7%] object-contain" style={{ top: "-39.7cqw" }} />
      <Reveal active={active} animated={animated} delay={0}>
        <p className="font-display text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
          {vi ? "THÔNG TIN LỄ CƯỚI" : "CEREMONY INFO"}
        </p>
      </Reveal>
      {/* Cha mẹ: lưới 2 bên + vạch 1px cao 60px ở giữa, 4 hàng subgrid.
          Bên TRÁI = nhà gái, bên PHẢI = nhà trai. Nhãn "Ông Bà", tên cha mẹ
          ĐẬM 14/15px, địa chỉ 12/13px — chỉ hiện khi có dữ liệu. */}
      <Reveal active={active} animated={animated} delay={0.1}>
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
      </Reveal>
      {/* Lời mời: GIỮA cha mẹ và tên lớn, uppercase 16px md:20px, tối đa
          560px. Chỉ hiện khi dữ liệu có (demo gốc để trống nên ẩn). */}
      {data.message && (
        <p className="font-display mx-auto mt-6 max-w-[560px] whitespace-pre-line text-[16px] uppercase leading-[1.4] md:text-[20px]" style={{ color: "#710001" }}>
          {data.message}
        </p>
      )}
      {/* Tên lớn: EB Garamond (không phải Playfair), base 40px mobile /
          64px md+, cô dâu trước, dấu & riêng một dòng, rồi chú rể. Nhãn thứ
          bậc ("Út Nữ"/"Út Nam") DƯỚI mỗi tên, 12/13px, uppercase,
          tracking 0.2em — chỉ hiện khi có dữ liệu. */}
      <Reveal active={active} animated={animated} delay={0.2}>
        <div className="mt-6 flex w-full flex-col items-center gap-2">
          <div className="flex w-full flex-col items-center">
            <h3 className="font-eb-garamond whitespace-nowrap leading-[1.2]" style={{ color: "#710001", fontSize: "clamp(26px, 7.34cqw, 64px)" }}>{data.brideName}</h3>
            {data.brideBirthOrder && (
              <div className="font-display mt-1 text-[12px] uppercase tracking-[0.2em] md:text-[13px]" style={{ color: "#710001" }}>{data.brideBirthOrder}</div>
            )}
          </div>
          {/* Chỉ render "&" khi CẢ 2 tên đều có chữ. */}
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
      </Reveal>
      {/* Hàng ngày: tiêu đề lễ (mặc định "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI /
          TƯ GIA") → "VÀO LÚC {giờ}" → [thứ | số ngày lớn | tháng], năm
          riêng một dòng, ghi chú âm lịch trong ngoặc. */}
      {parts && (
        <Reveal active={active} animated={animated} delay={0.3}>
          <div className="mt-6 flex flex-col items-center gap-3">
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
        </Reveal>
      )}
    </div>
  );
}

/** Slide Album — carousel coverflow của thư viện (Swiper), ảnh 2:3,
    ảnh đang xem có Ken Burns. */
export function DecoAlbum({ ctx, active, animated }: SectionProps) {
  const { vi } = ctx;
  return (
    <section className="relative z-20 mx-auto mt-10 w-full max-w-[560px]" aria-label={vi ? "Album ảnh cưới" : "Wedding album"}>
      <Reveal active={active} animated={animated} delay={0}>
        <h3 className="font-display text-center text-[20px] font-bold uppercase md:text-[24px]" style={{ color: "#710001" }}>
          {vi ? "ALBUM ẢNH" : "ALBUM"}
        </h3>
      </Reveal>
      <AlbumCarousel vi={vi} />
    </section>
  );
}

// Các mốc lịch trình hiện từng hàng (stagger) khi slide vào.
const scheduleContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const scheduleRow: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/** Slide Tiệc + Địa điểm (gộp làm một slide theo thứ tự gốc: tiệc →
    địa điểm/bản đồ). Lịch tháng có tim đỏ đô, bản đồ nhúng zoom z=16
    theo địa chỉ, tên địa điểm nghiêng serif. */
export function DecoParty({ ctx, active, animated }: SectionProps) {
  const { data, vi, parts, calCells, calDay, calTitle, calUrl, welcomeTime, mapEmbedUrl, mapsUrl } = ctx;
  return (
    <>
      <section className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Thông tin tiệc cưới" : "Reception info"}>
        <Reveal active={active} animated={animated} delay={0}>
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
        </Reveal>
        {parts && (
          <Reveal active={active} animated={animated} delay={0.1}>
            {/* Hàng ngày ở section tiệc: năm ẨN như bản gốc. Thứ không ngắt
                dòng (w-auto + min-w + whitespace-nowrap). */}
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
          </Reveal>
        )}
        {calCells.length > 0 && (
          // Khung viền bo tròn quanh lịch (vòng 16). Lịch rộng 388px
          // (ô ~52px); ngày cưới tô bằng TRÁI TIM đỏ ĐẶC #710001, hộp 35px
          // (nhìn thấy ~29px ≈ 55% ô, vòng 17), số trắng 15px extrabold.
          <Reveal active={active} animated={animated} delay={0.15}>
            <div className="mx-auto mt-5 w-full max-w-[388px] rounded-2xl border px-4 py-3" style={{ borderColor: "#71000155" }}>
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
          </Reveal>
        )}
        {calUrl && (
          <div className="mt-4">
            <a href={calUrl} target="_blank" rel="noreferrer" className="text-sm tracking-wider underline underline-offset-4 decoration-1 transition-opacity hover:opacity-70" style={{ color: "#710001" }}>
              {vi ? "Thêm vào lịch" : "Add to calendar"} ↗
            </a>
          </div>
        )}
      </section>
      <section className="relative z-20 mx-auto mt-10 text-center" aria-label={vi ? "Địa điểm tiệc cưới" : "Reception venue"}>
        <Reveal active={active} animated={animated} delay={0.2}>
          <h3 className="font-display text-[16px] uppercase md:text-[20px]" style={{ color: "#710001" }}>
            {vi ? "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" : "THE RECEPTION WILL BE HELD AT"}
          </h3>
          {/* Tên địa điểm: chữ NGHIÊNG serif, viết thường xen hoa (vòng 16),
              giữ nguyên chữ hoa/thường như dữ liệu, không uppercase. */}
          <p className="mt-3 font-eb-garamond text-[20px] italic md:text-[24px]" style={{ color: "#710001" }}>{data.venue}</p>
          {data.address?.trim() && (
            <p className="mx-auto mt-4 max-w-sm rounded-full px-4 py-2 text-sm md:max-w-[600px] md:px-6 md:py-3" style={{ color: "#710001" }}>{data.address}</p>
          )}
          {/* Bản đồ nhúng: query CHỈ theo địa chỉ (vòng 17 — query kèm tên
              địa điểm match nhầm sang Hồ Tây), z=16, cao 280px md:380px,
              tối đa 340px md:560px, bo 16px. Chỉ render khi có địa chỉ. */}
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
        </Reveal>
      </section>
    </>
  );
}

/** Slide Dress code — tiêu đề "DRESS CODE", phụ đề, 3 màu mẫu.
    Chỉ render khi dữ liệu có màu (gọi kèm điều kiện ở ngoài). */
export function DecoDressCode({ ctx, active, animated }: SectionProps) {
  const { vi, dressColors } = ctx;
  return (
    <section className="relative z-20 mx-auto mt-10 text-center" aria-label="Dress code">
      <Reveal active={active} animated={animated} delay={0}>
        <h3 className="font-display text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>DRESS CODE</h3>
        <p className="mt-1 text-sm md:text-base" style={{ color: "#710001" }}>{vi ? "Trang phục dự tiệc" : "Party Attire"}</p>
      </Reveal>
      <motion.div
        className="mt-5 flex items-center justify-center gap-4"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }}
        initial={animated ? "hidden" : false}
        animate={animated ? (active ? "show" : "hidden") : "show"}
      >
        {dressColors.map((c) => (
          <motion.span
            key={c}
            title={c}
            className="h-12 w-12 rounded-full border"
            style={{ background: c, borderColor: "#71000133" }}
            variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } } }}
          />
        ))}
      </motion.div>
    </section>
  );
}

/** Slide Lịch trình — timeline dọc: [giờ căn phải | chấm trên đường kẻ
    chấm ở giữa cột | nhãn italic serif]. Tâm chấm = đúng 50% cột (vòng 17),
    hàng 26px + giãn 44px = 70px tâm-tâm, giờ/nhãn 17px. */
export function DecoSchedule({ ctx, active, animated }: SectionProps) {
  const { vi, schedule } = ctx;
  return (
    <section className="relative z-20 mx-auto mt-10 w-full text-left" aria-label={vi ? "Lịch trình ngày cưới" : "Wedding day schedule"}>
      <Reveal active={active} animated={animated} delay={0}>
        <h3 className="font-display text-center text-[20px] uppercase md:text-[26px]" style={{ color: "#710001" }}>
          {vi ? "LỊCH TRÌNH NGÀY CƯỚI" : "WEDDING DAY SCHEDULE"}
        </h3>
      </Reveal>
      <motion.ol
        className="relative mt-6 space-y-11"
        variants={scheduleContainer}
        initial={animated ? "hidden" : false}
        animate={animated ? (active ? "show" : "hidden") : "show"}
      >
        <span aria-hidden="true" className="absolute bottom-[13px] left-[calc(50%-1px)] top-[13px] border-l-2 border-dotted" style={{ borderColor: "#710001" }} />
        {schedule.map((s, i) => (
          <motion.li key={i} className="relative flex items-baseline leading-[26px]" variants={scheduleRow}>
            <span className="min-w-0 flex-1 pr-4 text-right font-eb-garamond text-[17px]" style={{ color: "#710001" }}>{s.time}</span>
            <span className="flex w-[14px] shrink-0 items-center justify-center self-center">
              <span className="block h-3 w-3 rounded-full" style={{ background: "#710001" }} />
            </span>
            <span className="min-w-0 flex-1 pl-4 font-eb-garamond text-[17px] italic" style={{ color: "#710001" }}>{s.label}</span>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
