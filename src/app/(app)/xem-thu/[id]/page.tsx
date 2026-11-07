"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Link xem trước cũ (/xem-thu) — PLAN CHỐT v3-final: trang khóa KHÔNG còn
 * là luồng chính. Link cũ chuyển tới mục "Xem demo thiệp online" trong
 * editor (/tao-thiep?demo=<id>&t=<token>) — demo duy nhất đã đổ dữ liệu
 * khách, blur tên/ngày/giờ/địa điểm, wizard 3 bước mua online.
 */
function RedirectInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = decodeURIComponent(String(params.id ?? ""));
  const token = search.get("t") ?? "";
  const demoUrl = `/tao-thiep?demo=${encodeURIComponent(id)}${token ? `&t=${encodeURIComponent(token)}` : ""}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(demoUrl);
    }, 1200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoUrl]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="font-display text-6xl text-[#c9a86a]" aria-hidden="true">♥</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-[#7a1f2b]">Bản xem trước đã chuyển chỗ mới</h1>
      <p className="mt-2 text-[#5a4a48]">
        Link xem trước cũ nay mở ở mục “Xem demo thiệp online” trong trình sửa — demo duy nhất đã đổ sẵn
        dữ liệu khách, đang chuyển tới đó…
      </p>
      <Link href={demoUrl} className="mt-6 inline-block rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white">
        Mở demo thiệp online
      </Link>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-16 text-center">Đang chuyển tới demo thiệp online…</p>}>
      <RedirectInner />
    </Suspense>
  );
}
