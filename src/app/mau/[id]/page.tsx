// Trang xem mẫu SVG cho khách: /mau/<id>?d=<payload>
//  - Mẫu lấy từ: SVG nhúng kèm trong link (ưu tiên — mở được trên máy khác
//    khi file đủ nhỏ), nếu không thì từ kho IndexedDB trên máy này.
//  - Dữ liệu lấy từ payload ?d=; chưa có thì dùng chữ gốc trong mẫu.
//  - LƯU Ý: link mở trên máy khác mà không kèm SVG nhúng thì không thấy
//    được mẫu (IndexedDB chỉ có trên từng máy) — cần kho chứa online
//    (Supabase Storage, việc riêng) mới hết giới hạn này.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { InvitationData } from "@/lib/types";
import { defaultInvitation } from "@/lib/types";
import { cepValuesToData } from "@/lib/cep";
import { svgTemplateStore } from "@/lib/svg-store";
import {
  decodeSvgShare,
  normalizeSvgData,
  parseSvgTemplate,
} from "@/lib/svg-template";
import SvgViewer from "@/components/SvgViewer";

function MauInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = decodeURIComponent(String(params.id ?? ""));
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<{ id: string; name: string; svgText: string } | null>(null);
  const [data, setData] = useState<InvitationData | null>(null);
  const [extra, setExtra] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dParam = search.get("d");
        const payload = dParam ? decodeSvgShare(dParam) : null;
        let tpl: { id: string; name: string; svgText: string; fields: { key: string; value: string; kind: "cep" | "generic"; occurrences: number }[] } | null = null;
        if (payload?.svg) {
          const parsed = parseSvgTemplate(payload.svg, payload.name || "Mẫu SVG");
          tpl = { ...parsed, id: payload.tpl || parsed.id };
        }
        if (!tpl) {
          const stored = await svgTemplateStore.get(id);
          if (stored) tpl = stored;
        }
        if (!tpl) {
          if (!cancelled) setStatus("notfound");
          return;
        }
        let inv: InvitationData;
        let ex: Record<string, string> = {};
        if (payload?.data) {
          inv = normalizeSvgData(payload.data);
          ex = payload.extra ?? {};
        } else {
          // Chưa có dữ liệu kèm link: dùng chữ gốc trong mẫu làm giá trị mẫu.
          const map: Record<string, string> = {};
          for (const f of tpl.fields) map[f.key] = f.value;
          const patch = cepValuesToData(map);
          inv = normalizeSvgData({ ...defaultInvitation(), ...patch });
          for (const f of tpl.fields) if (f.kind === "generic") ex[f.key] = f.value;
        }
        if (!cancelled) {
          setTemplate({ id: tpl.id, name: tpl.name, svgText: tpl.svgText });
          setData(inv);
          setExtra(ex);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không mở được mẫu.");
          setStatus("notfound");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <p className="mx-auto max-w-2xl px-4 py-10">Đang mở mẫu thiệp…</p>;
  }
  if (status === "notfound" || !template || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-[#7a1f2b]">Không tìm thấy mẫu thiệp này</h1>
        <p className="mt-2 text-sm text-[#5a4a48]">
          Mẫu này chưa có trên máy này. Link cho khách cần kèm file mẫu mới mở được trên máy khác — nhờ Nancy
          gửi lại link mới (mở được ngay khi file mẫu đủ nhỏ).{error ? ` (${error})` : ""}
        </p>
      </div>
    );
  }
  return (
    <SvgViewer
      templateId={template.id}
      templateName={template.name}
      svgText={template.svgText}
      initialData={data}
      initialExtra={extra}
    />
  );
}

export default function MauPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-2xl px-4 py-10">Đang mở mẫu thiệp…</p>}>
      <MauInner />
    </Suspense>
  );
}
