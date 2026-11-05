"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Template } from "@/lib/templates";
import { TEMPLATE_FONT_CLASS, TEMPLATE_FONT_LABEL } from "@/lib/templates";
import { defaultInvitation } from "@/lib/types";
import TemplateMotif from "./TemplateMotif";
import InvitationPreview from "./InvitationPreview";

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
const THUMB_TOP_PAD = 12;

function DecoThumbnail({ template }: { template: Template }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [heroH, setHeroH] = useState(0);
  const [topInset, setTopInset] = useState(6);
  const topInsetRef = useRef(6);
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
        className="pointer-events-none absolute left-0"
        style={{
          top: topInset,
          width: SP_DESIGN_W,
          transform: scale > 0 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        <InvitationPreview data={defaultInvitation(template.id)} />
      </div>
    </div>
  );
}

export default function TemplateCard({
  template,
  onPreview,
}: {
  template: Template;
  onPreview: (t: Template) => void;
}) {
  const p = template.palette;
  return (
    <article
      className="overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
      style={{ borderColor: template.decorationImages ? "#e8d5c0" : p.gold, background: p.card }}
    >
      <button type="button" onClick={() => onPreview(template)} className="block w-full text-left" aria-label={`Xem trước mẫu ${template.name}`}>
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
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="flex-1 rounded-full border px-3 py-2 text-sm font-semibold hover:bg-[#fdf8f1]"
            style={{ borderColor: p.accent, color: p.accent }}
          >
            Xem trước
          </button>
          <Link
            href={`/tao-thiep?template=${template.id}`}
            className="flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold text-white"
            style={{ background: p.accent }}
          >
            Dùng mẫu này
          </Link>
        </div>
      </div>
    </article>
  );
}
