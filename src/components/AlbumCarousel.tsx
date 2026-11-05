"use client";

// Album ảnh — Swiper coverflow có sẵn của thư viện (thay cho coverflow
// CSS 3D tự viết tay trước đây: tính góc xoay/dịch/thu nhỏ bằng tay).
// Ảnh giữa 300×450 (tỉ lệ 2:3 như bản gốc), ảnh hai bên nghiêng 38° —
// đúng số đã đo vòng 13. Ảnh đang xem có hiệu ứng Ken Burns (pan+zoom
// chậm, xem globals.css) — tắt khi prefers-reduced-motion.
// Swiper con lồng trong deck dọc: nested để vuốt ngang không lọt sang deck.
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { PRESET_PHOTOS } from "@/lib/templates";

export default function AlbumCarousel({ vi }: { vi: boolean }) {
  return (
    <div className="album-swiper relative mx-auto mt-4 w-full">
      <Swiper
        modules={[EffectCoverflow, Navigation, Pagination]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop={false}
        nested
        observer
        observeParents
        coverflowEffect={{ rotate: 38, stretch: 0, depth: 160, modifier: 1, slideShadows: false }}
        navigation
        pagination={{ clickable: true }}
        className="album-coverflow"
        aria-label={vi ? "Album ảnh cưới" : "Wedding album"}
      >
        {PRESET_PHOTOS.map((p, i) => (
          <SwiperSlide key={p.url} className="album-slide">
            {/* Ken Burns: hướng pan đổi theo chẵn/lẻ để mỗi ảnh trôi khác nhau. */}
            <img
              src={p.url}
              alt={p.label}
              loading="lazy"
              className={`kenburns-img ${i % 2 === 0 ? "kb-a" : "kb-b"}`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
