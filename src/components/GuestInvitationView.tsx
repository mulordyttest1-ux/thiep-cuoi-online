// Trải nghiệm khách DUY NHẤT cho thiệp online — INTRO (cover → bộ sưu
// tập → thiệp) + vụ nổ + hiệu ứng cuộn + thiệp (InvitationPreview motion).
//
// Intro thay phong bì (2026-11-09, kịch bản chị chủ đã duyệt): 1) cover —
// dấu ấn mẫu, 1 lần duy nhất, không ảnh khách; 2) bộ sưu tập ảnh khách +
// chữ chạy, lặp đến khi khách muốn qua; 3) bấm "Xem thiệp" thì vụ nổ nhẹ
// rồi vào nội dung thiệp như trước. Mọi chỗ xem trước cỡ đầy đủ (trang
// khách, trang demo mở từ wizard, trang demo mở từ thư viện mẫu) đều dùng
// chung component này — 1 đường render duy nhất. Ảnh nhỏ trong lưới mẫu
// (DecoThumbnail) vẫn là hình tĩnh thu nhỏ, không dùng component này (ô
// quá nhỏ, không bấm mở phong bì được).
//
// Component này CHỈ render (nhận data đã tải sẵn) — không tải dữ liệu, không
// kiểm tra trạng thái máy chủ: các chốt chặn đó ở lại trang /thiep/[id].
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { InvitationData, StdEditField } from "@/lib/types";
import { getTemplate, getTemplateEffects, PRESET_PHOTOS, type TemplateEffects } from "@/lib/templates";
import { type TextEffectId } from "@/lib/intro";
import { BurstParticles, ScrollProgress, SmoothScroll } from "@/components/effects";
import { IntroCover } from "@/components/IntroCover";
import { IntroSlideshow } from "@/components/IntroSlideshow";
import { RomanticBrochureSlideshow } from "@/components/RomanticBrochureSlideshow";
import { PeachHeartSlideshow } from "@/components/PeachHeartSlideshow";
import { WarmConfessionSlideshow } from "@/components/WarmConfessionSlideshow";
import { ComicDiarySlideshow } from "@/components/ComicDiarySlideshow";
import { FlowersBrochureSlideshow } from "@/components/FlowersBrochureSlideshow";
import type { SlideStyleId } from "@/lib/slide-styles";
import { vietQrUrl } from "@/lib/store";
import { isBlockVisible } from "@/lib/blocks";
import InvitationPreview, { type SensitiveField } from "@/components/InvitationPreview";

export default function GuestInvitationView({
  data,
  guestName,
  serverMode,
  effectsOverride,
  blurred,
  revealedField,
  onSensitiveClick,
  editable,
  onFieldTap,
  onCustomTextTap,
  customTexts,
  editedFields,
  editedCustomTexts,
  fromWizard,
  textEffectOverride,
  slideStyleOverride,
  photosOverride,
}: {
  data: InvitationData;
  guestName?: string;
  /** Trang khách chính thức (đã trả tiền / máy chủ) hay link tự tạo. */
  serverMode?: boolean;
  /** Ghi đè bộ hiệu ứng của mẫu (vd ?fx= để thử biến thể khác — chỉ để
   *  thử, không đổi dữ liệu thiệp). Không truyền = preset của mẫu. */
  effectsOverride?: TemplateEffects;
  /** Ghi đè hiệu ứng chữ trong slideshow (vd ?tx=sand|scatter — chỉ để
   *  thử, không đổi dữ liệu thiệp). Không truyền = cát ("sand"). */
  textEffectOverride?: TextEffectId;
  /** Ghi đè kiểu slide ảnh trong intro (vd ?slide=romantic-brochure —
   *  chỉ để thử, không đổi dữ liệu thiệp). Không truyền = slideshow
   *  Polaroid scrapbook mặc định. */
  slideStyleOverride?: SlideStyleId;
  /** Demo nhiều ảnh (?photos=N trên trang demo — chỉ để thử, không đổi
   *  dữ liệu thiệp). Không truyền = chỉ ảnh thật của thiệp (data.photoUrl). */
  photosOverride?: string[];
  /** Demo: mờ tên/ngày/giờ/địa điểm (cả phong bì lẫn thiệp). Trang demo
   *  chỉ để xem — không truyền onSensitiveClick nên bấm vào ô mờ không
   *  làm gì; việc sửa diễn ra ở wizard. */
  blurred?: boolean;
  revealedField?: SensitiveField | null;
  onSensitiveClick?: (field: SensitiveField) => void;
  /** Chế độ sửa cho khách (mẫu chuẩn #1): bấm vào nội dung thì mở box sửa
   *  tại chỗ đó. Không truyền = thiệp chỉ đọc như cũ, không đổi gì. */
  editable?: boolean;
  onFieldTap?: (field: StdEditField, rect: { top: number; left: number; bottom: number; width: number }) => void;
  onCustomTextTap?: (key: string, rect: { top: number; left: number; bottom: number; width: number }) => void;
  customTexts?: Record<string, string>;
  editedFields?: Set<string>;
  editedCustomTexts?: Set<string>;
  /** Mở từ wizard demo: hiện nút "Quay lại sửa thiệp" (history.back). */
  fromWizard?: boolean;
}) {
  // Luồng intro thay phong bì: cover (1 lần) → bộ sưu tập → thiệp.
  const [introDone, setIntroDone] = useState(false);
  const [coverDone, setCoverDone] = useState(false);
  const reduce = useReducedMotion();
  // Vụ nổ khi bấm "Xem thiệp" (giữ từ phong bì cũ, spec §4h): hạt vàng bay
  // ra + vụ nổ rồi mới hiện thiệp — khoảnh khắc "wow" đầu tiên. Giảm
  // chuyển động thì vào ngay, không nổ.
  const [bursting, setBursting] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  // Đếm chương (C11): mục nào đang ở giữa khung (data-chapter trong
  // InvitationPreview) thì số chương đổi theo. Mẫu không-deco không có
  // data-chapter nên số ẩn.
  const [chapter, setChapter] = useState(0);
  const [chapterTotal, setChapterTotal] = useState(0);
  useEffect(() => {
    if (!introDone) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (els.length === 0) return;
    setChapterTotal(Math.max(...els.map((el) => Number(el.dataset.chapter || 0))));
    // Khi 2 mục cùng lọt vào dải giữa (vd ở đầu trang, hero ngắn trên điện
    // thoại nên hero + thông tin cùng chạm dải), chương HIỆN TẠI là mục
    // trên cùng (đầu tiên theo thứ tự tài liệu) — không lấy mục cuối cùng
    // trong danh sách entries (trước đây ở scrollY 0 hiện 02/06 thay vì
    // 01/06 vì thông tin lấn hero).
    const order = new Map(els.map((el, i) => [el, i] as const));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => (order.get(a.target as HTMLElement) ?? 0) - (order.get(b.target as HTMLElement) ?? 0));
        setChapter(Number((visible[0].target as HTMLElement).dataset.chapter || 0));
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [introDone, data?.templateId]);
  const fx = effectsOverride ?? getTemplateEffects(data.templateId);
  const handleEnter = () => {
    if (reduce) {
      setIntroDone(true);
      return;
    }
    setBurstKey((k) => k + 1);
    // Vụ nổ bắn ngay khi bấm (~0ms) rồi mới hiện thiệp ở 650ms.
    window.setTimeout(() => setBursting(true), 50);
    window.setTimeout(() => setIntroDone(true), 650);
    // Vụ nổ sống tới ~1.9s (hạt bay 1.4s + tàn) — dài hơn lúc chuyển
    // (650ms) để hạt bay hết đà trên nền thiệp mới, không bị cắt giữa chừng.
    window.setTimeout(() => setBursting(false), 2000);
  };
  // Lớp phủ vụ nổ — PORTAL ra document.body, render MỘT LẦN ở vị trí ổn
  // định (con đầu của fragment trả về, cả 2 nhánh intro/thiệp đều có
  // cùng vị trí) để sống qua lúc intro đổi sang thiệp. Bài học QA19:
  // để overlay trong từng nhánh như trước thì khi introDone đổi, React tháo
  // nhánh cũ + gắn nhánh mới → BurstParticles bị gắn lại từ đầu ở 650ms
  // rồi bị cắt ở 1100ms (chỉ bay được ~450ms) nên mắt không thấy hạt nào.
  // Portal cũng tránh bị overflow-hidden của intro/cột thiệp cắt và luôn
  // nằm trên cùng (z-70). Chỉ render khi bursting (sau cú chạm, client).
  // count 0 (biến thể Tối Giản) = không nổ, không chớp — vào thiệp ngay
  // theo biên đạo thường. Màu hạt theo preset (Lễ Hội = nhiều màu).
  const burstOverlay = bursting && (fx.burst?.count ?? 40) > 0 && typeof document !== "undefined" ? createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      {/* Chớp vàng tỏa tròn — "pop" nhìn rõ ngay cả trước khi hạt bay xa. */}
      <motion.div
        className="absolute h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(246,211,101,0.55) 0%, rgba(201,168,106,0.25) 45%, transparent 70%)" }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <div className="relative">
        <BurstParticles
          key={burstKey}
          count={fx.burst?.count ?? 40}
          size={[8, 16]}
          colors={fx.burst?.colors ?? ["#c9a86a", "#e8c87e", "#f6d365", "#fff0e7", "#710001"]}
          duration={fx.burst?.duration ?? 1.1}
          spread={fx.burst?.spread ?? 220}
        />
      </div>
    </div>,
    document.body
  ) : null;

  const qr = useMemo(
    () => vietQrUrl(data.bankCode, data.accountNumber, data.accountName),
    [data]
  );

  // Cột thiệp trang khách: bản gốc rộng ~872px, bắt đầu sát mép trên
  // viewport (full-bleed, QA vòng 8). Khung cũ max-w-3xl (768px) + px-4
  // py-10 cho cột chỉ ~737px và thừa 40px kem phía trên — chỉ mẫu deco
  // dùng cột rộng không padding trên; mẫu khác giữ nguyên.
  const isDeco = !!getTemplate(data.templateId).decorationImages;
  // Demo mở từ wizard: nút quay lại (history.back) nổi góc trái, hiện ở cả
  // 2 nhánh intro/thiệp. Khách mời thật không có nút này.
  const backBtn = fromWizard ? (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="fixed left-3 top-3 z-[60] rounded-full border bg-white/95 px-4 py-2 text-sm font-semibold text-[#7a1f2b] shadow-md"
    >
      ← Quay lại sửa thiệp
    </button>
  ) : null;

  // INTRO thay phong bì: cover (1 lần) → bộ sưu tập ảnh khách + chữ chạy
  // → bấm "Xem thiệp" thì vụ nổ + vào thiệp. Cover không chứa tên/ngày/
  // ảnh mẫu; bộ sưu tập chỉ dùng ảnh + chữ thật từ data (không có ảnh thì
  // chỉ còn chữ trên nền theo biến thể).
  if (!introDone) {
    return (
      <>
        {backBtn}
        {burstOverlay}
        {!coverDone ? (
          <IntroCover data={data} fx={fx} onDone={() => setCoverDone(true)} />
        ) : slideStyleOverride === "romantic-brochure" ? (
          <RomanticBrochureSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} />
        ) : slideStyleOverride === "peach-heart" ? (
          <PeachHeartSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} heartVariant="giant" />
        ) : slideStyleOverride === "peach-heart-full" ? (
          <PeachHeartSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} heartVariant="full" />
        ) : slideStyleOverride === "warm-confession" ? (
          <WarmConfessionSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} />
        ) : slideStyleOverride === "comic-diary" ? (
          <ComicDiarySlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} />
        ) : slideStyleOverride === "flowers-brochure" ? (
          <FlowersBrochureSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} />
        ) : (
          <IntroSlideshow data={data} fx={fx} blurred={blurred} guestName={guestName} onEnter={handleEnter} textEffect={textEffectOverride} photos={photosOverride} />
        )}
        {/* Hạt phim (C9): vân nhiễu phủ mờ lên toàn trang intro, như giấy
            ảnh cũ — vân tĩnh nên hiện cả khi giảm chuyển động. */}
        {fx.cinema?.grain !== false && (
          <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-[45]" />
        )}
      </>
    );
  }

  return (
    <>
      {backBtn}
      {burstOverlay}
    <SmoothScroll lerp={0.09}>
      <ScrollProgress color="linear-gradient(90deg,#c9a86a,#710001)" disabled={fx.progressBar === false} chapter={fx.cinema?.chapters === false || chapterTotal === 0 ? null : { current: chapter, total: chapterTotal }} />
      <div className={isDeco ? "mx-auto w-full max-w-[872px] px-4 py-0 sm:px-0" : "mx-auto max-w-3xl px-4 py-10"}>
        <InvitationPreview
          data={data}
          guestName={guestName}
          motion
          effectsOverride={effectsOverride}
          blurred={blurred}
          revealedField={revealedField}
          onSensitiveClick={onSensitiveClick}
          editable={editable}
          onFieldTap={onFieldTap}
          onCustomTextTap={onCustomTextTap}
          customTexts={customTexts}
          editedFields={editedFields}
          editedCustomTexts={editedCustomTexts}
        />

      {/* Album — mẫu deco đã có album ngay sau khối THÔNG TIN trong
          InvitationPreview nên ẩn section riêng này để không trùng (vòng 11).
          Khối thêm/bớt: ẩn khi khách tắt album (hoặc chưa có ảnh). */}
      {!isDeco && isBlockVisible(data, "album") && (
      <section className="mt-10" aria-labelledby="album-title">
        <h2 id="album-title" className="text-center font-display text-2xl font-bold text-[#7a1f2b]">Album ảnh cưới</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESET_PHOTOS.map((p) => (
            <img key={p.url} src={p.url} alt={p.label} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-sm" />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[#7a6a68]">Ảnh minh họa từ Unsplash (ảnh cưới công khai).</p>
      </section>
      )}

      {/* Mừng cưới */}
      {qr && (
        <section className="mt-10 rounded-2xl border bg-white p-6 text-center shadow-sm" aria-labelledby="gift-title">
          <h2 id="gift-title" className="font-display text-2xl font-bold text-[#7a1f2b]">Mừng cưới</h2>
          <p className="mt-2 text-sm text-[#5a4a48]">
            Quét mã VietQR để chuyển khoản mừng cưới tới {data.accountName} — {data.bankCode} {data.accountNumber}.
          </p>
          <img src={qr} alt={`Mã QR VietQR mừng cưới tới tài khoản ${data.accountNumber} ngân hàng ${data.bankCode}`} loading="lazy" className="mx-auto mt-4 h-56 w-56 rounded-2xl border object-contain" />
          <p className="mt-2 text-sm"><strong>{data.accountName}</strong> • {data.bankCode} • {data.accountNumber}</p>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-[#7a6a68]">
        {serverMode ? (
          <>Thiệp online chính thức • Thiệp Đôi.</>
        ) : (
          <>Thiệp được tạo bằng Thiệp Đôi.{" "}<Link href="/" className="underline">Tạo thiệp của riêng bạn</Link></>
        )}
      </p>
      </div>
    </SmoothScroll>
    {fx.cinema?.grain !== false && (
      <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-[45]" />
    )}
    </>
  );
}
