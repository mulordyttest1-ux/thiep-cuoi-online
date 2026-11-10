"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import type { InvitationData } from "@/lib/types";
import { defaultInvitation } from "@/lib/types";
import { getVariantEffects, isEffectVariant } from "@/lib/templates";
import { resolveTextEffect } from "@/lib/intro";
import { resolveSlideStyle } from "@/lib/slide-styles";
import { decodeShare, loadInvitationById } from "@/lib/store";
import GuestInvitationView from "@/components/GuestInvitationView";
import { STATUS_LABEL, type InvitationStatus } from "@/lib/access";

function CardInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = decodeURIComponent(String(params.id ?? ""));
  const [data, setData] = useState<InvitationData | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "notfound">("loading");
  // Chốt chặn máy chủ: nếu thiệp đã lên máy chủ thì link ?d=/localStorage cũ
  // không còn giá trị — chỉ token khách hợp lệ + đã trả tiền mới xem được,
  // TRỪ link xịn v3-final (?d= mã hóa dữ liệu, đúng mẫu đã trả) khi thiệp
  // đã paid_online.
  const [gate, setGate] = useState<{ blocked: boolean; reason?: string; status?: string } | null>(null);
  const [serverMode, setServerMode] = useState(false);
  const guestName = search.get("guest") ?? undefined;
  const fxParam = search.get("fx");
  // Thử nhanh biến thể (?fx=le-nghi|hoa-bay|anh-vang|toi-gian|dien-anh|
  // le-hoi — xem docs/effect-variants-research.md): ghi đè preset của mẫu
  // CHỈ khi xem, không đổi dữ liệu thiệp. Giá trị lạ → bỏ qua.
  const fxOverride = fxParam && isEffectVariant(fxParam) ? getVariantEffects(fxParam) : undefined;
  // Thử nhanh hiệu ứng chữ (?tx=sand|scatter — sand = hạt cát mặc định,
  // scatter = Scatter & Reform chậm đã lưu): ghi đè CHỈ khi xem, không
  // đổi dữ liệu thiệp. Giá trị lạ → về "sand".
  const textEffectOverride = resolveTextEffect(search.get("tx"));
  // Thử nhanh kiểu slide ảnh (?slide=romantic-brochure — kiểu brochure
  // lãng mạn; không truyền = slideshow Polaroid scrapbook mặc định):
  // ghi đè CHỈ khi xem, không đổi dữ liệu thiệp. Giá trị lạ → về
  // "scrapbook".
  const slideStyleOverride = resolveSlideStyle(search.get("slide"));

  useEffect(() => {
    let alive = true;
    (async () => {
      // BẢN GHI MÁY CHỦ THẮNG LINK ?d=/localStorage: thiệp đã đưa lên máy chủ
      // (gửi khách duyệt / chốt / trả tiền) thì chỉ máy chủ quyết định ai
      // được xem — link ?d= cũ không mở được nữa, kể cả khách đã lưu link.
      try {
        if (id !== "demo") {
          const stRes = await fetch(`/api/invitations/${encodeURIComponent(id)}/status`);
          const st = (await stRes.json()) as { exists?: boolean; status?: string; paidTemplateId?: string };
          if (alive && st.exists) {
            const gt = search.get("gt");
            if (gt) {
              const gRes = await fetch(
                `/api/invitations/${encodeURIComponent(id)}?kind=guest&t=${encodeURIComponent(gt)}&guest=${encodeURIComponent(search.get("guest") ?? "")}`
              );
              const gj = (await gRes.json()) as Record<string, unknown>;
              if (!alive) return;
              if (gRes.ok && gj.ok) {
                setData(gj.data as InvitationData);
                setServerMode(true);
                setStatus("found");
                return;
              }
              setGate({ blocked: true, reason: String(gj.reason ?? "not_paid"), status: st.status });
              setStatus("found");
              return;
            }
            // Link xịn v3-final: /thiep/<id>?d=<base64url JSON> — chỉ mở khi
            // máy chủ đã ghi paid_online cho đúng thiệp + đúng mẫu đã trả.
            // Trước khi trả tiền, link ?d= cũ KHÔNG mở được thiệp đã lên máy chủ.
            const d = search.get("d");
            if (d && st.status === "paid_online") {
              const decoded = decodeShare(d);
              if (decoded && (!st.paidTemplateId || decoded.templateId === st.paidTemplateId)) {
                setData(decoded);
                setServerMode(true);
                setStatus("found");
                return;
              }
            }
            setGate({
              blocked: true,
              reason: st.status === "paid_online" ? "need_guest_link" : "not_paid",
              status: st.status,
            });
            setStatus("found");
            return;
          }
        }
      } catch {
        // Máy chủ không trả lời: rơi về luồng cũ (?d=/localStorage/demo).
      }
      if (!alive) return;
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
          // Route demo trưng bày (/thiep/demo không kèm ?d=): dùng dữ liệu
          // mẫu — đây là demo, không phải thiệp của khách nào.
          setData(defaultInvitation("minimal-do-do"));
          setStatus("found");
          return;
        }
        setStatus("notfound");
      } catch {
        setStatus(id === "demo" ? "found" : "notfound");
        if (id === "demo") setData(defaultInvitation("minimal-do-do"));
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center">Đang mở thiệp…</p>;
  }

  // Thiệp đã lên máy chủ nhưng người mở không có link khách hợp lệ / chưa
  // trả tiền: KHÔNG hiện thiệp, chỉ hiện lý do. Đây là chốt chặn chính
  // chống xài chùa (kể cả khi khách còn giữ link ?d= cũ).
  // PHẢI đứng trước nhánh "không tìm thấy": đường gate không setData nên
  // data vẫn null — để nhánh !data trước thì gate không bao giờ hiện.
  if (gate?.blocked) {
    const reasonText =
      gate.reason === "expired"
        ? "Link khách đã hết hạn (quá 30 ngày sau ngày cưới)."
        : gate.reason === "need_guest_link"
          ? "Thiệp này đã được mua online. Hãy mở bằng link xịn (link có dữ liệu mã hóa trong link) hoặc link khách chính thức do Thiết kế gửi — link cũ không mở được nữa."
          : gate.reason === "invalid_token"
            ? "Link khách không hợp lệ. Hãy xin lại link khách chính thức từ Thiết kế."
            : "Thiệp này chưa được mua online nên chưa mở link mời khách. Khách mua thiệp online (quét QR, chuyển đúng số tiền + đúng mã) thì link sẽ tự mở.";
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-6xl text-[#c9a86a]" aria-hidden="true">♥</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-[#7a1f2b]">Thiệp chưa mở</h1>
        <p className="mt-2 text-[#5a4a48]">{reasonText}</p>
        <p className="mt-2 text-sm text-[#7a6a68]">
          Trạng thái: {gate.status ? STATUS_LABEL[gate.status as InvitationStatus] ?? gate.status : "—"}.
          Liên hệ Thiết kế để nhận link xem trước hoặc mua thiệp online.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/thiep/demo" className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white">Xem thiệp demo</Link>
          <Link href="/" className="rounded-full border-2 border-[#7a1f2b] px-6 py-3 font-semibold text-[#7a1f2b]">Về trang chủ</Link>
        </div>
      </div>
    );
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
        </div>
      </div>
    );
  }

  // Trải nghiệm khách duy nhất (phong bì + mở thiệp + hiệu ứng) — cùng
  // component mà trang demo (wizard / thư viện mẫu) dùng, chỉ 1 đường
  // render. ?blur=1 (demo từ wizard): tên/ngày/giờ/địa điểm vẫn mờ;
  // ?from=wizard: hiện nút quay lại sửa thiệp.
  return (
    <GuestInvitationView
      data={data}
      guestName={guestName}
      serverMode={serverMode}
      effectsOverride={fxOverride}
      textEffectOverride={textEffectOverride}
      slideStyleOverride={slideStyleOverride}
      blurred={search.get("blur") === "1"}
      fromWizard={search.get("from") === "wizard"}
    />
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
