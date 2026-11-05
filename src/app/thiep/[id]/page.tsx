"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { defaultInvitation, formatDateVi } from "@/lib/types";
import { getTemplate, getTemplateEffects, PRESET_PHOTOS, TEMPLATE_FONT_CLASS } from "@/lib/templates";
import TemplateMotif from "@/components/TemplateMotif";
import { BurstParticles, ScrollProgress, Shimmer, SmoothScroll } from "@/components/effects";
import { decodeShare, loadInvitationById, vietQrUrl } from "@/lib/store";
import InvitationPreview from "@/components/InvitationPreview";

function CardInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = decodeURIComponent(String(params.id ?? ""));
  const [data, setData] = useState<InvitationData | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "notfound">("loading");
  const [opened, setOpened] = useState(false);
  // Con dấu Hỷ phong bì: ký tự dự phòng chỉ hiện khi ảnh lỗi (không chồng
  // dưới ảnh như trước — cùng lỗi viền như chữ Hỷ ở dải).
  const [sealFailed, setSealFailed] = useState(false);
  const guestName = search.get("guest") ?? undefined;
  const reduce = useReducedMotion();
  // Vụ nổ khi mở phong bì (spec §4h): hạt vàng bay ra + phong bì nở/phai
  // dần rồi mới hiện thiệp — khoảnh khắc "wow" đầu tiên. Giảm chuyển động
  // thì mở ngay, không nổ.
  const [bursting, setBursting] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const fx = getTemplateEffects(data?.templateId ?? "");
  const handleOpen = () => {
    if (reduce) {
      setOpened(true);
      return;
    }
    setBurstKey((k) => k + 1);
    setBursting(true);
    window.setTimeout(() => setOpened(true), 650);
    // Vụ nổ sống tới ~1.6s (hạt bay 1.1s + tàn) — dài hơn lúc phong bì mở
    // (650ms) để hạt bay hết đà trên nền thiệp mới, không bị cắt giữa chừng.
    window.setTimeout(() => setBursting(false), 1600);
  };
  // Lớp phủ vụ nổ — PORTAL ra document.body, render MỘT LẦN ở vị trí ổn
  // định (con đầu của fragment trả về, cả 2 nhánh phong bì/thiệp đều có
  // cùng vị trí) để sống qua lúc phong bì đổi sang thiệp. Bài học QA19:
  // để overlay trong từng nhánh như trước thì khi opened đổi, React tháo
  // nhánh cũ + gắn nhánh mới → BurstParticles bị gắn lại từ đầu ở 650ms
  // rồi bị cắt ở 1100ms (chỉ bay được ~450ms) nên mắt không thấy hạt nào.
  // Portal cũng tránh bị overflow-hidden của phong bì/cột thiệp cắt và luôn
  // nằm trên cùng (z-70). Chỉ render khi bursting (sau cú chạm, client).
  const burstOverlay = bursting && typeof document !== "undefined" ? createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      {/* Chớp vàng tỏa tròn — "pop" nhìn rõ ngay cả trước khi hạt bay xa. */}
      <motion.div
        className="absolute h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(246,211,101,0.55) 0%, rgba(201,168,106,0.25) 45%, transparent 70%)" }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <div className="relative">
        <BurstParticles
          key={burstKey}
          count={fx.burst?.count ?? 40}
          size={[6, 12]}
          colors={["#c9a86a", "#e8c87e", "#f6d365", "#fff0e7", "#710001"]}
          duration={fx.burst?.duration ?? 1.1}
          spread={fx.burst?.spread ?? 220}
        />
      </div>
    </div>,
    document.body
  ) : null;

  useEffect(() => {
    try {
      // Ưu tiên dữ liệu ?d= trong URL trước: link chia sẻ mang dữ liệu tường
      // minh phải thắng dữ liệu cũ trong localStorage cùng id (tránh trường
      // hợp sửa mẫu chưa lưu mà mở ra vẫn thấy bản lưu cũ).
      const d = search.get("d");
      if (d) {
        const decoded = decodeShare(d);
        if (decoded) {
          setData(decoded);
          setStatus("found");
          return;
        }
      }
      const fromStorage = loadInvitationById(id);
      if (fromStorage) {
        setData(fromStorage);
        setStatus("found");
        return;
      }
      if (id === "demo") {
        setData(defaultInvitation("minimal-do-do"));
        setStatus("found");
        return;
      }
      setStatus("notfound");
    } catch {
      setStatus(id === "demo" ? "found" : "notfound");
      if (id === "demo") setData(defaultInvitation("minimal-do-do"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const qr = useMemo(
    () => (data ? vietQrUrl(data.bankCode, data.accountNumber, data.accountName) : null),
    [data]
  );

  // Cột thiệp trang khách: bản gốc rộng ~872px, bắt đầu sát mép trên
  // viewport (full-bleed, QA vòng 8). Khung cũ max-w-3xl (768px) + px-4
  // py-10 cho cột chỉ ~737px và thừa 40px kem phía trên — chỉ mẫu deco
  // dùng cột rộng không padding trên; mẫu khác giữ nguyên.
  const isDeco = !!getTemplate(data?.templateId ?? "").decorationImages;

  if (status === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center">Đang mở thiệp…</p>;
  }

  if (status === "notfound" || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-6xl text-[#c9a86a]" aria-hidden="true">♥</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-[#7a1f2b]">Không tìm thấy thiệp này</h1>
        <p className="mt-2 text-[#5a4a48]">
          Link có thể đã hết hạn, sai id, hoặc thiệp được tạo trên một trình duyệt khác mà không kèm dữ liệu ?d=.
          Hãy xin lại link từ cô dâu chú rể, hoặc xem thiệp demo bên dưới.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/thiep/demo" className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white">Xem thiệp demo</Link>
          <Link href="/tao-thiep" className="rounded-full border-2 border-[#7a1f2b] px-6 py-3 font-semibold text-[#7a1f2b]">Tạo thiệp mới</Link>
        </div>
      </div>
    );
  }

  if (!opened) {
    const tpl = getTemplate(data.templateId);
    const p = tpl.palette;
    const deco = tpl.decorationImages;
    return (
      <>
      {burstOverlay}
      <div
        className={`relative flex items-center justify-center px-4 py-16 ${deco ? "min-h-screen overflow-hidden" : "min-h-[80vh]"}`}
        style={deco ? { background: "linear-gradient(to bottom right, #710001, #5a0001, #450001)" } : undefined}
      >
        {/* Chữ Hỷ mờ bay trên nền phong bì (bản gốc: gradient đỏ + Hỷ mờ). */}
        {deco && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <span className="envelope-xi-float absolute left-[8%] top-[12%] text-7xl font-bold" style={{ color: "#fff0e7", opacity: 0.08 }}>囍</span>
            <span className="envelope-xi-float absolute right-[10%] top-[30%] text-8xl font-bold" style={{ color: "#fff0e7", opacity: 0.07, animationDelay: "1.5s" }}>囍</span>
            <span className="envelope-xi-float absolute bottom-[14%] left-[16%] text-6xl font-bold" style={{ color: "#fff0e7", opacity: 0.09, animationDelay: "3s" }}>囍</span>
            <span className="envelope-xi-float absolute bottom-[26%] right-[6%] text-5xl font-bold" style={{ color: "#fff0e7", opacity: 0.08, animationDelay: "2s" }}>囍</span>
          </div>
        )}
        <motion.button
          type="button"
          onClick={handleOpen}
          className={`relative w-full overflow-hidden rounded-3xl border-2 text-center shadow-xl transition-shadow hover:shadow-2xl ${deco ? "max-w-[600px]" : "max-w-md"}`}
          style={{ borderColor: tpl.envelope, background: deco ? "#710001" : p.card, padding: deco ? 12 : 0 }}
          aria-label={`Mở thiệp cưới của ${data.groomName} và ${data.brideName}`}
          animate={bursting ? { scale: [1, 1.04, 0.94], opacity: [1, 1, 0], rotate: [0, -1, 1.5] } : { scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
        >
          {!deco && <div className="h-3 w-full" style={{ background: tpl.envelope }} aria-hidden="true" />}
          {/* Phụng + hoa phong bì theo đúng số liệu bản gốc (mục 2 spec):
              phụng dùng Phuong.webp cho cả 2 góc; hoa HOA.webp 2 góc đối diện.
              Ảnh nằm trực tiếp dưới nút (phủ cả viền đỏ), không nằm trong
              thẻ kem để không bị thẻ kem cắt ở mép. */}
          {deco && (
            <>
              <img src={deco.phuongRight} alt="Phụng góc trên-trái" loading="eager" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute left-[-20px] top-[-20px] z-20 w-[120px] rotate-[10deg] object-contain opacity-90 md:left-[-50px] md:w-[220px]" />
              <img src={deco.phuongRight} alt="Phụng góc dưới-phải" loading="eager" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute bottom-[-120px] right-[-40px] z-20 w-[140px] object-contain opacity-90 md:bottom-[-110px] md:right-[-50px] md:w-[220px]" style={{ transform: "scaleX(-1) rotate(5deg)" }} />
              <img src={deco.hoa} alt="Họa tiết hoa trang trí góc dưới-trái" loading="eager" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute bottom-[-20px] left-[-20px] z-20 w-[120px] object-contain opacity-60 md:bottom-[-30px] md:left-[-30px] md:w-[160px]" />
              <img src={deco.hoa} alt="Họa tiết hoa trang trí góc trên-phải" loading="eager" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="pointer-events-none absolute right-[-15px] top-[-15px] z-20 w-[100px] rotate-180 object-contain opacity-60 md:right-[-20px] md:top-[-20px] md:w-[140px]" />
            </>
          )}
          <div className={`relative z-10 ${deco ? "px-6 pb-14 pt-28 md:pb-8 md:pt-24" : "p-10"}`} style={deco ? { background: "#f9ede3", borderRadius: 20, overflow: "hidden" } : undefined}>
            {/* Con dấu Hỷ: tròn 56px, tâm ở top 50px của thẻ (chồng lên mép
                trên thẻ), gradient tỏa tròn #710001 — theo đúng spec. */}
            {deco && (
              <Shimmer disabled={!!reduce} duration={2.4} intensity="strong" className="absolute left-1/2 top-[50px] z-30 -translate-x-1/2 -translate-y-1/2">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "radial-gradient(circle at 30% 30%, #710001, rgb(83,0,0))" }}
                >
                  {sealFailed ? (
                    <span className="font-bold text-[#fff0e7]">囍</span>
                  ) : (
                    <img src={deco.chuHy} alt="Chữ Hỷ" loading="eager" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; setSealFailed(true); }} className="h-9 w-9 object-contain" />
                  )}
                </span>
              </Shimmer>
            )}
            <div className="relative">
              {/* Phong bì bản gốc KHÔNG có nhãn "THIỆP MỜI CƯỚI" và KHÔNG có
                  dòng gợi ý bấm — 2 dòng này chỉ giữ cho mẫu không-deco. */}
              {!deco && (
                <>
                  <p className="mt-4 text-xs uppercase tracking-[0.35em]" style={{ color: p.accent }}>Thiệp mời cưới</p>
                  <div className="mt-6 flex justify-center">
                    <TemplateMotif motif={tpl.motif} accent={p.accent} gold={p.gold} size="sm" />
                  </div>
                </>
              )}
              {deco ? (
                <>
                  {/* Tên phong bì: Playfair Display, CĂN GIỮA, 3 dòng với dấu
                      & riêng một dòng, weight 400, text-3xl/sm:text-4xl. */}
                  {/* Tên phong bì: cô dâu trước rồi chú rể (bản gốc "Ngọc Ánh
                      & Thế Bảo", brideFirst) — vòng 11 sửa từ chú rể trước. */}
                  <p className="font-display text-3xl uppercase leading-snug sm:text-4xl" style={{ color: "#710001", fontWeight: 400 }}>
                    <span className="block w-full text-center">{data.brideName}</span>
                    {/* Trạng thái trống (vòng 14): chỉ render "&" khi CẢ 2
                        tên đều có chữ. */}
                    {data.brideName?.trim() && data.groomName?.trim() ? (
                      <span className="block w-full text-center text-lg sm:text-xl">&amp;</span>
                    ) : null}
                    <span className="block w-full text-center">{data.groomName}</span>
                  </p>
                  {data.date && (
                    <p className="mt-4 text-base" style={{ color: "#710001" }}>{formatDateVi(data.date)}</p>
                  )}
                  <p className="mt-2 text-sm" style={{ color: p.muted }}>Thân Mời</p>
                  {guestName && (
                    <p className="mx-auto mt-3 inline-block rounded-full px-4 py-2 text-sm" style={{ background: "#fff0e7", border: "1px solid #710001", color: "#710001" }}>
                      {guestName}
                    </p>
                  )}
                  {/* Dòng này là chữ cố định của phong bì gốc, hiện cả khi
                      không có tên khách (vòng 11): trước đây chỉ hiện khi có
                      ?guest= nên QA tưởng thiếu. */}
                  <p className="mt-2 text-sm" style={{ color: p.muted }}>đến dự buổi tiệc chung vui cùng gia đình</p>
                </>
              ) : (
                <>
                  <p className={`${TEMPLATE_FONT_CLASS[tpl.font]} mt-6 text-3xl font-bold`} style={{ color: p.accent }}>
                    {data.groomName} &amp; {data.brideName}
                  </p>
                  {guestName && (
                    <p className="mt-3 rounded-full px-4 py-2 text-sm" style={{ background: p.bg }}>
                      Trân trọng kính mời <strong>{guestName}</strong>
                    </p>
                  )}
                  <span
                    className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
                    style={{ background: tpl.envelope }}
                    aria-hidden="true"
                  >
                    ❦
                  </span>
                </>
              )}
              <span className="mt-6 inline-block rounded-full px-8 py-3 font-semibold text-white" style={{ background: p.accent }}>
                Mở thiệp
              </span>
              {!deco && (
                <p className="mt-3 text-xs" style={{ color: p.muted }}>Bấm vào phong bì để xem thiệp</p>
              )}
            </div>
          </div>
        </motion.button>
      </div>
      </>
    );
  }

  return (
    <>
      {burstOverlay}
    <SmoothScroll lerp={0.09}>
      <ScrollProgress color="#710001" disabled={fx.progressBar === false} />
      <div className={isDeco ? "mx-auto w-full max-w-[872px] px-4 py-0 sm:px-0" : "mx-auto max-w-3xl px-4 py-10"}>
        <InvitationPreview data={data} guestName={guestName} motion />

      {/* Album — mẫu deco đã có album ngay sau khối THÔNG TIN trong
          InvitationPreview nên ẩn section riêng này để không trùng (vòng 11). */}
      {!isDeco && (
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
        Thiệp được tạo bằng Thiệp Đôi.{" "}
        <Link href="/" className="underline">Tạo thiệp của riêng bạn</Link>
      </p>
      </div>
    </SmoothScroll>
    </>
  );
}

export default function CardPage() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-16 text-center">Đang mở thiệp…</p>}>
        <CardInner />
      </Suspense>
    </MotionConfig>
  );
}
