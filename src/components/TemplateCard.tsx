"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import type { Template } from "@/lib/templates";
import { TEMPLATE_FONT_CLASS, TEMPLATE_FONT_LABEL } from "@/lib/templates";
import { defaultInvitation } from "@/lib/types";
import { encodeShare } from "@/lib/store";
import TemplateMotif from "./TemplateMotif";
import InvitationPreview from "./InvitationPreview";
import { BurstParticles } from "./effects";

// Thumbnail mẫu deco: bản thu nhỏ ĐÚNG của phần chính — render đúng component
// InvitationPreview (single source of truth, không vẽ lại bố cục riêng) trong
// một khung rộng đúng 907px (chiều rộng thiết kế gốc), thu nhỏ bằng transform
// scale theo chiều rộng thực của thẻ, cắt đúng ở đáy hero.
// Chiều cao cắt ĐO THẬT từ DOM (.songphung-hero offsetHeight ở khung 907px),
// không dùng số px cứng nữa (970/973px trước đây vẫn lộ vệt chữ section sau
// vì chiều cao hero đổi theo kem dưới dải + font). Trước khi đo xong dùng
// tỉ lệ khung ước tính 907/1187 (tên 7% + 2 dòng + hàng dải 53.8% + kem
// dưới dải 50%); giá trị đo thật sẽ thay thế ngay sau mount.
const SP_DESIGN_W = 907;
const SP_HERO_ASPECT = "907 / 1187";
// Vòng 15: hero có -mt-6/-mt-8 kéo mép trên trùng mép thẻ nên tên hero nằm
// sát mép trên thumbnail, QA14 thấy đỉnh "THU AN" bị cắt nhẹ. Dời bản xem
// trước thu nhỏ xuống 6px (đơn vị px của thẻ) và cộng 6px vào chiều cao
// khung để đáy cắt vẫn đúng vị trí cũ — tên hero hở khỏi mép trên, vẫn
// chỉ hiện hero, không đổi trang khách/editor.
// Vòng 16: 6px cố định KHÔNG đủ — QA15 vẫn thấy tên bị cắt ("THU AN" →
// "U AN", "MINH QUÂN" → "NH QUÂN"). Vị trí thật của tên sau margin âm +
// collapse không khớp tính toán trên giấy, nên ĐO THẬT vị trí tên (h2) bằng
// getBoundingClientRect (đã tính cả scale) và dời bản xem trước xuống thêm
// cho tới khi tên hở khỏi mép trên đúng THUMB_TOP_PAD (px của thẻ). Đo lại
// mỗi lần layout/font đổi (ResizeObserver + document.fonts.ready) nên hội
// tụ sau 1 lần đo: tên đang ở y < 12 thì dời xuống đúng (12 − y), lần đo
// sau y ≈ 12 nên không dời thêm. Chiều cao khung = đáy hero (đo thật) +
// top inset hiện tại nên đáy cắt vẫn đúng vị trí cũ.
// Vòng 17: QA16 đo rõ vết cắt ở BÊN TRÁI chứ không phải trên ("THU AN" →
// "U AN", "MINH QUÂN" → "NH QUÂN" — mất T,H,M,I ở mép trái; đỉnh chữ còn
// nguyên, top offset ~23px đã đủ) — đo dọc vòng 16 bỏ sót trục ngang.
// Mở rộng cơ chế đo-thật sang TRỤC NGANG: đo mép TRÁI của h2 tên hero
// (getBoundingClientRect, px màn hình đã tính scale) và dời bản xem trước
// sang PHẢI thêm đúng phần thiếu cho tới khi mép trái tên cách mép khung
// ≥ THUMB_LEFT_PAD (12px). Hai trục độc lập (top/left đều là offset
// trước transform, dịch 1:1 ra px màn hình vì transform-origin top left)
// nên hội tụ riêng từng trục như vòng 16. Chẩn đoán nguyên nhân cắt trái:
// nghi phạm chính là parallax phụng trái (xem SongPhungDecor): trong
// thumbnail nó chạy theo scroll của TRANG GALLERY — thẻ ở giữa trang,
// scrollY ~1000–2000px kéo đuôi phụng trượt lên −150–−300px, lọt vào vùng
// tên hero; vùng này chỉ xuất hiện trong thumbnail (trang khách ở
// scroll-top thì đuôi còn ở dưới tên), đúng khớp QA16 chỉ thấy cắt ở
// thumbnail mà không thấy ở trang khách. Sửa tận gốc: tắt hẳn parallax
// trong thumbnail (data-deco-thumbnail, xem SongPhungDecor) để phụng đứng
// yên ở vị trí scroll-top như trang khách lúc chưa cuộn; đo ngang chỉ là
// lưới an toàn nếu còn lệch vị trí vì lý do khác. Dời phải tối đa ~vài
// chục px màn hình, mép phải hero (hoa/phụng phải) có thể mất một vệt
// nhỏ tương đương — chấp nhận được so với tên bị cắt.
const THUMB_TOP_PAD = 12;
const THUMB_LEFT_PAD = 12;

function DecoThumbnail({ template }: { template: Template }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [heroH, setHeroH] = useState(0);
  const [topInset, setTopInset] = useState(6);
  const topInsetRef = useRef(6);
  const [leftInset, setLeftInset] = useState(0);
  const leftInsetRef = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setW(el.clientWidth);
      const hero = el.querySelector(".songphung-hero") as HTMLElement | null;
      if (hero) {
        setHeroH(hero.offsetHeight);
        const name = hero.querySelector("h2") as HTMLElement | null;
        if (name) {
          // Vị trí tên theo px màn hình (đã tính scale): nếu tên đang nằm
          // sát/cắt ở mép trên thì dời cả bản xem trước xuống thêm đúng
          // phần thiếu, sao cho mép trên của tên cách mép khung 12px.
          const nameTop = name.getBoundingClientRect().top - el.getBoundingClientRect().top;
          if (nameTop < THUMB_TOP_PAD) {
            const next = topInsetRef.current + (THUMB_TOP_PAD - nameTop);
            topInsetRef.current = next;
            setTopInset(next);
          }
          // Vòng 17 — trục ngang: nếu mép trái tên sát/cắt ở mép trái
          // khung thì dời bản xem trước sang phải thêm đúng phần thiếu,
          // sao cho mép trái tên cách mép khung 12px.
          const nameLeft = name.getBoundingClientRect().left - el.getBoundingClientRect().left;
          if (nameLeft < THUMB_LEFT_PAD) {
            const next = leftInsetRef.current + (THUMB_LEFT_PAD - nameLeft);
            leftInsetRef.current = next;
            setLeftInset(next);
          }
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Font Playfair tải async làm chiều cao tên thay đổi — đo lại khi font
    // sẵn sàng để cắt không lệch.
    let cancelled = false;
    if (document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);
  const scale = w > 0 ? w / SP_DESIGN_W : 0;
  const height = heroH > 0 && scale > 0 ? heroH * scale + topInset : undefined;
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={height ? { height } : { aspectRatio: SP_HERO_ASPECT }}
    >
      <div
        aria-hidden="true"
        data-deco-thumbnail
        className="pointer-events-none absolute"
        style={{
          top: topInset,
          left: leftInset,
          width: SP_DESIGN_W,
          transform: scale > 0 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {/* Ảnh nhỏ trưng mẫu: dữ liệu mẫu (cặp Minh Quân & Thu An) chỉ để
            trưng bày trong lưới thư viện, không phải thiệp của khách nào. */}
        <InvitationPreview data={defaultInvitation(template.id)} />
      </div>
    </div>
  );
}

export default function TemplateCard({
  template,
}: {
  template: Template;
}) {
  const router = useRouter();
  const p = template.palette;
  const reduce = useReducedMotion();
  // TapBurst (spec §4h): chạm vào thẻ demo thì nổ một chùm hạt vàng nhỏ ngay
  // điểm chạm rồi mới mở trang demo (300ms để kịp thấy vụ nổ). Giảm
  // chuyển động thì mở ngay, không nổ. Chỉ chạm nhẹ, không đổi bố cục thư viện.
  // Bài học QA19: để vụ nổ TRONG thẻ (article overflow-hidden, z-40) thì hộp
  // xem trước (fixed z-50, nền đen 60%) mở ra ở 300ms đã che mất nó, trong
  // khi hạt cần 700ms mới bay hết — mắt chỉ thấy ~0. Sửa: portal ra
  // document.body tại đúng tọa độ chạm TRÊN MÀN HÌNH (clientX/clientY),
  // z-70 (trên cả hộp xem trước), hạt to/rộng hơn, sống tới khi bay xong
  // (onDone) dù hộp đã mở.
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  // Bấm mẫu = mở trang demo đầy đủ riêng (/thiep/demo mang dữ liệu mẫu
  // trưng bày trong ?d=), KHÔNG mở hộp xem mẫu nữa — xem trước là sản phẩm
  // (cùng GuestInvitationView như trang khách). Dữ liệu ở đây là mẫu trưng
  // bày (cặp Minh Quân & Thu An), không phải thiệp của khách nào.
  const demoUrl = `/thiep/demo?d=${encodeShare(defaultInvitation(template.id))}`;
  const handlePreview = (e: React.MouseEvent) => {
    if (reduce) {
      router.push(demoUrl);
      return;
    }
    setBurst({ x: e.clientX, y: e.clientY, key: Date.now() });
    window.setTimeout(() => router.push(demoUrl), 300);
  };
  const tapBurstOverlay = burst && typeof document !== "undefined" ? createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed z-[70]" style={{ left: burst.x, top: burst.y }}>
      <BurstParticles key={burst.key} count={20} size={[5, 11]} duration={0.8} spread={130} onDone={() => setBurst(null)} />
    </div>,
    document.body
  ) : null;
  return (
    <>
    {tapBurstOverlay}
    <article
      className="relative overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
      style={{ borderColor: template.decorationImages ? "#e8d5c0" : p.gold, background: p.card }}
    >
      <button type="button" onClick={handlePreview} className="block w-full text-left" aria-label={`Xem trước mẫu ${template.name}`}>
        {template.decorationImages ? (
          <DecoThumbnail template={template} />
        ) : (
          <div className="relative aspect-[4/5] overflow-hidden" style={{ background: `linear-gradient(160deg, ${p.bg}, ${p.card})` }}>
            <img src={template.photo} alt={`Ảnh minh họa mẫu thiệp ${template.name}`} loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 p-4 text-center">
              <TemplateMotif motif={template.motif} accent="#ffffff" gold={p.gold} size="sm" light />
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/90">{template.styleLabel}</p>
              <p className={`mt-2 ${TEMPLATE_FONT_CLASS[template.font]} text-3xl font-bold text-white drop-shadow`}>{template.name}</p>
              <p className="mt-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: p.accent, color: "#fff" }}>
                Xem trước
              </p>
            </div>
          </div>
        )}
      </button>
      <div className="p-4">
        {template.decorationImages && (
          <h3 className="text-base font-bold" style={{ color: p.accent }}>{template.name}</h3>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: p.accent }}>
          {template.paper} • {template.frameLabel} • {TEMPLATE_FONT_LABEL[template.font]}
        </p>
        <p className="mt-1 text-sm" style={{ color: p.muted }}>{template.description}</p>
        <p className="mt-2 text-xs italic" style={{ color: p.muted }}>{template.pattern}</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handlePreview}
            className="w-full rounded-full border px-3 py-2 text-sm font-semibold hover:bg-[#fdf8f1]"
            style={{ borderColor: p.accent, color: p.accent }}
          >
            Xem trước
          </button>
        </div>
      </div>
    </article>
    </>
  );
}
