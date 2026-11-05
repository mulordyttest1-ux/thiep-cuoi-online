"use client";

// Slide deck điện ảnh cho trang thiệp (mẫu deco).
// Thay cho cột cuộn dài trước đây: mỗi mục là một slide toàn màn hình,
// chuyển bằng hiệu ứng mờ dần (fade + crossFade) của Swiper, chữ hiện
// từng dòng khi slide vào (Framer Motion, xem InvitationSections).
// Điều hướng: chấm (trái) + thanh tiến trình (trên) + cụm nút dưới giữa
// (lùi / phát-dừng / số slide / tới) + vuốt + phím mũi tên.
// Tự chạy TẮT mặc định (khách đọc theo tốc độ của mình); nút phát/tạm dừng
// điều khiển Swiper Autoplay (6s/slide, dừng ở slide cuối).
// Tôn trọng prefers-reduced-motion: chuyển slide tức thì (speed 0), tắt
// Ken Burns, ẩn nút tự chạy.
// Màn hình phong bì là "slide 1" (mở đầu, nằm ở thiep/[id]/page.tsx):
// deck bắt đầu từ Hero nên số hiển thị = activeIndex + 2, tổng = số slide
// deck + 1.
// Slide Tiệc dài hơn màn hình điện thoại nên nội dung tự cuộn trong slide
// (vuốt dọc ở slide này cuộn nội dung — class swiper-no-swiping; muốn đổi
// slide thì dùng chấm/nút). Các slide khác vuốt dọc để đổi slide bình
// thường. touchReleaseOnEdges để vuốt qua mép cuối deck thì cuộn được
// trang (tới dòng credit / QR mừng cưới bên dưới deck).
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Keyboard, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useReducedMotion } from "framer-motion";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import type { DecoContext } from "./InvitationSections";
import {
  DecoAlbum,
  DecoDressCode,
  DecoHero,
  DecoInfo,
  DecoParty,
  DecoSchedule,
} from "./InvitationSections";

interface DeckSlide {
  key: string;
  /** Hero dính mép trên slide (cánh phụng chạm mép trên như bản gốc). */
  top?: boolean;
  /** Nội dung dài hơn màn hình: tự cuộn trong slide, không đổi slide bằng vuốt. */
  tall?: boolean;
  render: (active: boolean) => React.ReactNode;
}

export default function InvitationDeck({
  ctx,
  heightClass = "h-[100dvh]",
}: {
  ctx: DecoContext;
  /** Chiều cao deck: trang khách "h-[100dvh]"; editor/dialog truyền thấp hơn
      để vừa khung xem trước (xem tao-thiep, mau-thiep). */
  heightClass?: string;
}) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduceMotion = useReducedMotion();

  const slides: DeckSlide[] = [
    { key: "hero", top: true, render: (a) => <DecoHero ctx={ctx} active={a} animated /> },
    { key: "info", render: (a) => <DecoInfo ctx={ctx} active={a} animated /> },
    { key: "album", render: (a) => <DecoAlbum ctx={ctx} active={a} animated /> },
    { key: "party", tall: true, render: (a) => <DecoParty ctx={ctx} active={a} animated /> },
    ...(ctx.dressColors.length > 0
      ? [{ key: "dresscode", render: (a: boolean) => <DecoDressCode ctx={ctx} active={a} animated /> }]
      : []),
    ...(ctx.schedule.length > 0
      ? [{ key: "schedule", render: (a: boolean) => <DecoSchedule ctx={ctx} active={a} animated /> }]
      : []),
  ];
  const total = slides.length + 1; // +1: màn hình phong bì mở đầu
  const atFirst = activeIndex === 0;
  const atLast = activeIndex === slides.length - 1;

  const ctrlBtn =
    "flex h-10 w-10 items-center justify-center rounded-full border text-xl leading-none shadow-md transition disabled:opacity-40";
  const ctrlStyle = { borderColor: "#71000133", color: "#710001", background: "#fff0e7e6" };

  return (
    <div
      className={`deck relative w-full overflow-hidden ${heightClass}`}
      // container-type để đơn vị cqw trong slide (tên lớn 7.34cqw, hoa
      // -39.7cqw) tính theo chiều rộng cột deck như article cũ.
      style={{ background: "#f9ede3", containerType: "inline-size" }}
    >
      {/* Vân giấy bản gốc phủ toàn bộ deck (như article cũ). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/api/songphung/NENGIAY.jpg)",
          backgroundSize: "100% auto",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "top center",
          opacity: 0.3,
        }}
      />
      <Swiper
        modules={[EffectFade, Pagination, Keyboard, Autoplay]}
        direction="vertical"
        effect="fade"
        fadeEffect={{ crossFade: true }}
        slidesPerView={1}
        speed={reduceMotion ? 0 : 700}
        pagination={{ clickable: true }}
        keyboard={{ enabled: true }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: true,
          stopOnLastSlide: true,
          pauseOnMouseEnter: false,
        }}
        touchReleaseOnEdges
        observer
        observeParents
        onSwiper={(s) => {
          setSwiper(s);
          // Tự chạy TẮT mặc định: dừng ngay sau khi khởi tạo.
          s.autoplay?.stop();
        }}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        onAutoplayStart={() => setPlaying(true)}
        onAutoplayStop={() => setPlaying(false)}
        className="deck-swiper relative z-10 h-full w-full"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={s.key} className="deck-slide">
            <div className={`flex h-full w-full flex-col overflow-y-auto ${s.tall ? "swiper-no-swiping" : ""}`}>
              <div className={s.top ? "w-full" : "m-auto w-full"}>
                {/* Hero dùng đúng p-6 sm:p-8 như article cũ để -mx-6/-mt-6
                    của section hero bù khớp (cánh phụng chạm mép trên). */}
                <div className={`relative ${s.top ? "p-6 sm:p-8" : "px-6 py-8 sm:px-8"}`}>
                  {s.render(activeIndex === i)}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thanh tiến trình mỏng trên cùng. */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-[3px]"
        style={{ background: "#71000122" }}
        aria-hidden="true"
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${((activeIndex + 2) / total) * 100}%`, background: "#710001" }}
        />
      </div>

      {/* Cụm điều khiển dưới giữa: lùi / phát-dừng / số slide / tới. */}
      <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={() => swiper?.slidePrev()}
          disabled={atFirst}
          aria-label="Slide trước"
          className={ctrlBtn}
          style={ctrlStyle}
        >
          ‹
        </button>
        {!reduceMotion && (
          <button
            type="button"
            onClick={() => {
              if (playing) swiper?.autoplay?.stop();
              else swiper?.autoplay?.start();
            }}
            aria-label={playing ? "Dừng tự chạy" : "Tự chạy slide"}
            className={ctrlBtn}
            style={ctrlStyle}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        )}
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ color: "#710001", background: "#fff0e7cc" }}
          aria-live="polite"
        >
          {activeIndex + 2} / {total}
        </span>
        <button
          type="button"
          onClick={() => swiper?.slideNext()}
          disabled={atLast}
          aria-label="Slide sau"
          className={ctrlBtn}
          style={ctrlStyle}
        >
          ›
        </button>
      </div>
    </div>
  );
}
