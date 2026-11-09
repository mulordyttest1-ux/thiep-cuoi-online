"use client";

import { useState } from "react";
import Link from "next/link";
import { getTemplate } from "@/lib/templates";
import { defaultInvitation } from "@/lib/types";
import TemplateCard from "@/components/TemplateCard";
import InvitationPreview from "@/components/InvitationPreview";
import { useLanguage } from "@/components/LanguageProvider";

const FEATURES = (d: ReturnType<typeof useLanguage>["dict"]) => [
  { icon: "⇄", title: d.fKeep, desc: d.fKeepDesc },
  { icon: "🔗", title: d.fLink, desc: d.fLinkDesc },
  { icon: "🌐", title: d.fLang, desc: d.fLangDesc },
  { icon: "📷", title: d.fQr, desc: d.fQrDesc },
  { icon: "🖼️", title: d.fAlbum, desc: d.fAlbumDesc },
  { icon: "🗺️", title: d.fSchedule, desc: d.fScheduleDesc },
];

const FAQS = [
  {
    q: "Thiệp cưới online là gì?",
    a: "Là một trang thiệp riêng trên mạng do cô dâu chú rể tạo một lần. Khách chỉ cần mở link là xem được toàn bộ: lời mời, ngày giờ, địa điểm, album và lịch trình. Không cần in và gửi từng tấm thiệp giấy, cũng không cần khách cài thêm ứng dụng.",
  },
  {
    q: "Cần chuẩn bị gì trước khi tạo thiệp?",
    a: "Tên cặp đôi, tên bố mẹ hai bên, ngày giờ và địa điểm tổ chức, một lời mời ngắn và vài tấm ảnh cưới đẹp. Nếu muốn, bạn có thể thêm lịch trình trong ngày và tài khoản nhận mừng cưới.",
  },
  {
    q: "Đổi mẫu có phải nhập lại thông tin không?",
    a: "Không. Đổi mẫu giữ nguyên toàn bộ dữ liệu: tên, ngày, địa điểm, lời mời và ảnh đã chọn.",
  },
  {
    q: "Mỗi khách có link riêng thật không?",
    a: "Có. Mỗi khách có link riêng dạng /thiep/<id>?guest=<tên>. Khách mở thiệp sẽ thấy tên mình trên phong bì.",
  },
  {
    q: "Khách mở thiệp bằng điện thoại có cần cài app không?",
    a: "Không. Khách mở link bằng trình duyệt trên điện thoại là xem được thiệp đầy đủ.",
  },
  {
    q: "QR mừng cưới lấy từ đâu?",
    a: "Từ chính tài khoản ngân hàng bạn nhập trong editor (mã ngân hàng + số tài khoản + chủ tài khoản). Thiệp hiển thị mã VietQR thật qua img.vietqr.io, chỉ khi bạn đã nhập đủ thông tin.",
  },
];

export default function Home() {
  const { dict: d } = useLanguage();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const featured = ["song-phung-do", "nhat-binh-do", "minimal-do-do", "song-hy-do", "hoa-moc", "cam-thach-vang"].map((id) => getTemplate(id));
  // Thiệp mẫu ở hero trang chủ: dữ liệu mẫu chỉ để trưng bày, không phải
  // thiệp của khách nào.
  const sample = defaultInvitation("minimal-do-do");

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a86a]">Thiệp cưới online</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-[#7a1f2b] sm:text-5xl">{d.heroTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-[#5a4a48] sm:text-lg">{d.heroSub}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mau-thiep" className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white hover:bg-[#5e1620]">
              {d.heroCta2}
            </Link>
          </div>
          <ul className="mt-6 space-y-1 text-sm text-[#5a4a48]">
            <li>✓ Mỗi khách một link riêng</li>
            <li>✓ Đổi mẫu không mất dữ liệu</li>
          </ul>
        </div>
        <div>
          <InvitationPreview data={sample} />
          <p className="mt-2 text-center text-xs text-[#7a6a68]">Thiệp mẫu xem trước — xem thêm mẫu ở thư viện mẫu thiệp.</p>
        </div>
      </section>

      {/* MẪU NỔI BẬT */}
      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="featured-title">
        <h2 id="featured-title" className="font-display text-3xl font-bold text-[#7a1f2b]">{d.featured}</h2>
        <p className="mt-2 text-[#5a4a48]">{d.featuredSub}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/mau-thiep" className="rounded-full border-2 border-[#7a1f2b] px-6 py-3 font-semibold text-[#7a1f2b]">
            Xem tất cả mẫu →
          </Link>
        </div>
      </section>

      {/* TÍNH NĂNG */}
      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="features-title">
        <h2 id="features-title" className="text-center font-display text-3xl font-bold text-[#7a1f2b]">{d.featuresTitle}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES(d).map((f) => (
            <div key={f.title} className="rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm">
              <span className="text-2xl" aria-hidden="true">{f.icon}</span>
              <h3 className="mt-2 font-semibold text-[#7a1f2b]">{f.title}</h3>
              <p className="mt-1 text-sm text-[#5a4a48]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 BƯỚC */}
      <section className="bg-[#f7efe2] py-12" aria-labelledby="steps-title">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="steps-title" className="text-center font-display text-3xl font-bold text-[#7a1f2b]">{d.stepsTitle}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { n: "1", t: d.step1, desc: d.step1Desc },
              { n: "2", t: d.step2, desc: d.step2Desc },
              { n: "3", t: d.step3, desc: d.step3Desc },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7a1f2b] font-display text-xl font-bold text-white">{s.n}</span>
                <h3 className="mt-3 font-semibold text-[#7a1f2b]">{s.t}</h3>
                <p className="mt-1 text-sm text-[#5a4a48]">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* DÀNH CHO AI */}
      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="forwho-title">
        <h2 id="forwho-title" className="text-center font-display text-3xl font-bold text-[#7a1f2b]">{d.forWhoTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { t: d.forWho1, desc: d.forWho1Desc },
            { t: d.forWho2, desc: d.forWho2Desc },
            { t: d.forWho3, desc: d.forWho3Desc },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-[#7a1f2b]">{c.t}</h3>
              <p className="mt-1 text-sm text-[#5a4a48]">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-center font-display text-3xl font-bold text-[#7a1f2b]">{d.faqTitle}</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white">
              <button
                type="button"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                aria-expanded={faqOpen === i}
                className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold"
              >
                {f.q}
                <span aria-hidden="true">{faqOpen === i ? "−" : "+"}</span>
              </button>
              {faqOpen === i && <p className="px-5 pb-4 text-sm leading-relaxed text-[#5a4a48]">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
