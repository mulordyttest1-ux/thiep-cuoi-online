// Bộ sưu tập — bước 2 của intro thay phong bì.
//
// Ảnh cưới của khách + chữ chạy, như video trình chiếu trong tiệc cưới:
// ảnh nối nhau, chữ (tên, ngày, địa điểm — CHỈ dữ liệu thật của thiệp)
// chạy cùng, chuyển mượt (mờ dần), chạy LẶP đến khi khách bấm "Xem thiệp".
// Ảnh hiện gần như nguyên khung, chuyển nhẹ (Ken Burns zoom tối đa 1.1 /
// lia chậm nhỏ), KHÔNG lia mạnh cắt mặt — không có ý tưởng chấm điểm nét
// vì ảnh không bị cắt. Không có ảnh khách: chỉ chữ trên nền theo biến thể.
// Giảm chuyển động: ảnh tĩnh, chữ đủ, không tự chuyển ảnh.
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { formatDateVi } from "@/lib/types";
import { getTemplate, type TemplateEffects } from "@/lib/templates";
import { AmbientLayer, KenBurns, type KenBurnsDirection } from "@/components/effects";
import { getIntroPreset, resolveIntroVariant } from "@/lib/intro";

const PHOTO_MS = 4500; // mỗi ảnh hiện ~4.5s rồi mờ sang ảnh sau

export function IntroSlideshow({
  data,
  fx,
  blurred,
  guestName,
  onEnter,
}: {
  data: InvitationData;
  fx: TemplateEffects;
  /** Demo: mờ tên/ngày/địa điểm như trong thiệp. */
  blurred?: boolean;
  /** Tên khách mời (?guest=) — hiện ở dòng mời như phong bì cũ vẫn làm. */
  guestName?: string;
  /** Khách bấm "Xem thiệp" → vào nội dung thiệp. */
  onEnter: () => void;
}) {
  const reduce = useReducedMotion();
  const tpl = getTemplate(data.templateId);
  const preset = getIntroPreset(resolveIntroVariant(fx, tpl.variant));
  const blurCls = blurred ? "blur-[7px] select-none" : "";

  // CHỈ ảnh thật của thiệp (photoUrl). Không có ảnh → danh sách rỗng,
  // bước này chỉ còn chữ trên nền theo biến thể (không lấy ảnh mẫu).
  const photos = useMemo(() => [data.photoUrl].filter(Boolean), [data.photoUrl]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || photos.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % photos.length), PHOTO_MS);
    return () => window.clearInterval(t);
  }, [reduce, photos.length]);

  // Chữ chạy — chỉ dòng nào có dữ liệu thật thì hiện.
  const nameLines: string[] = [];
  if (data.brideName?.trim()) nameLines.push(data.brideName);
  if (data.groomName?.trim()) nameLines.push(data.groomName);
  const dateLine = data.date ? formatDateVi(data.date) + (data.time ? ` • ${data.time}` : "") : "";
  const venueLine = [data.venue, data.address].filter(Boolean).join(" — ");

  // Hướng Ken Burns đổi theo ảnh để không đơn điệu; dien-anh lia chậm
  // ngang (kiểu váy cưới: ảnh dài lia chậm), các biến thể khác zoom nhẹ.
  const direction: KenBurnsDirection =
    resolveIntroVariant(fx, tpl.variant) === "dien-anh"
      ? index % 2 === 0
        ? "pan-left"
        : "pan-right"
      : index % 2 === 0
        ? "in"
        : "out";
  const kbDuration = fx.kenBurns?.duration ?? 8;
  // Zoom tối đa 1.1 — chuyển nhẹ, ảnh gần như nguyên khung.
  const kbScale = Math.min(fx.kenBurns?.scale ?? 1.12, 1.1);

  const advance = () => {
    if (photos.length > 1) setIndex((i) => (i + 1) % photos.length);
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-end overflow-hidden"
      style={{ background: photos.length === 0 ? preset.coverBg : "#000" }}
      onClick={advance}
    >
      {/* Ảnh khách — mờ dần sang ảnh sau, Ken Burns nhẹ trên chính <img>. */}
      {photos.length > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            <motion.div
              key={photos[index]}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <KenBurns duration={kbDuration} scale={kbScale} direction={direction} disabled={!!reduce}>
                <img
                  src={photos[index]}
                  alt=""
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </KenBurns>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Lớp sáng theo biến thể phủ lên ảnh. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <AmbientLayer fx={fx} templateId={data.templateId} />
      </div>

      {/* Lớp tối dưới chữ để đọc rõ trên ảnh sáng. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {/* Chữ chạy: hiện từng dòng, ở lại suốt bộ sưu tập. */}
      <div className="relative z-10 flex w-full flex-col items-center px-6 pb-28 pt-16 text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs uppercase tracking-[0.35em] text-white/85"
        >
          {guestName ? `Trân trọng kính mời ${guestName}` : "Trân trọng kính mời"}
        </motion.p>
        {nameLines.length > 0 && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className={`mt-4 font-display text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-5xl ${blurCls}`}
          >
            {nameLines.map((n, i) => (
              <span key={n} className="block">
                {i > 0 && <span className="mr-3 text-2xl text-[#f6d365]">&amp;</span>}
                {n}
              </span>
            ))}
          </motion.p>
        )}
        {dateLine && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className={`mt-4 text-base text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] ${blurCls}`}
          >
            {dateLine}
          </motion.p>
        )}
        {venueLine && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className={`mt-2 text-sm text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] ${blurCls}`}
          >
            {venueLine}
          </motion.p>
        )}
        {photos.length > 1 && (
          <div className="mt-6 flex gap-2" aria-hidden="true">
            {photos.map((p, i) => (
              <span
                key={p}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nút vào thiệp — luôn thấy, sáng nhẹ để khách biết bấm vào đâu. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-8">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
          className="open-pulse rounded-full px-10 py-3.5 font-semibold text-white shadow-xl"
          style={{ background: tpl.palette.accent }}
          aria-label="Xem thiệp cưới"
        >
          Xem thiệp
        </button>
      </div>
    </div>
  );
}
