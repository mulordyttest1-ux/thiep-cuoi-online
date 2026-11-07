// Trang khách sửa cho mẫu chuẩn #1: /khach/<id>?t=<editToken> (thiệp máy chủ)
// hoặc ?d=<payload> (link tĩnh, không máy chủ — chat/lịch sử không lưu được).
// Layout trần (nhóm (khach)): khách chỉ thấy thiệp, không thấy khu làm việc
// của Nancy.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { ChatMessage, ManualListItem } from "@/lib/access";
import type { InvitationData } from "@/lib/types";
import { decodeShare } from "@/lib/store";
import CustomerStandardEditor from "@/components/CustomerStandardEditor";

function KhachInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = decodeURIComponent(String(params.id ?? ""));
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<InvitationData | null>(null);
  const [server, setServer] = useState<{
    editToken: string;
    customTexts: Record<string, string>;
    editedFields: string[];
    chat: ChatMessage[];
    customerConfirmedAt: string | null;
    manualList: ManualListItem[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = search.get("t") ?? "";
        const dParam = search.get("d");
        if (token) {
          const res = await fetch(`/api/invitations/${encodeURIComponent(id)}?kind=edit&t=${encodeURIComponent(token)}`);
          const j = (await res.json()) as Record<string, unknown>;
          if (!res.ok || !j.ok) {
            if (!cancelled) {
              setError(typeof j.error === "string" ? j.error : typeof j.reason === "string" ? j.reason : "Không mở được thiệp.");
              setStatus("notfound");
            }
            return;
          }
          if (!cancelled) {
            setData(j.data as InvitationData);
            setServer({
              editToken: token,
              customTexts: (j.customTexts as Record<string, string> | undefined) ?? {},
              editedFields: (j.editedFields as string[] | undefined) ?? [],
              chat: (j.chat as ChatMessage[] | undefined) ?? [],
              customerConfirmedAt: (j.customerConfirmedAt as string | null | undefined) ?? null,
              manualList: (j.manualList as ManualListItem[] | undefined) ?? [],
            });
            setStatus("ready");
          }
          return;
        }
        if (dParam) {
          const inv = decodeShare(dParam);
          if (!inv) {
            if (!cancelled) {
              setError("Link không đọc được.");
              setStatus("notfound");
            }
            return;
          }
          if (!cancelled) {
            setData(inv);
            setServer(null);
            setStatus("ready");
          }
          return;
        }
        if (!cancelled) {
          setError("Thiếu link sửa (cần ?t= hoặc ?d=).");
          setStatus("notfound");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không mở được thiệp.");
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
    return <p className="mx-auto max-w-2xl px-4 py-10">Đang mở thiệp…</p>;
  }
  if (status === "notfound" || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-[#7a1f2b]">Không mở được thiệp này</h1>
        <p className="mt-2 text-sm text-[#5a4a48]">
          Link sửa đã hết hạn hoặc không đúng. Nhờ Nancy gửi lại link mới.{error ? ` (${error})` : ""}
        </p>
      </div>
    );
  }
  return (
    <CustomerStandardEditor
      invitationId={id}
      editToken={server?.editToken ?? null}
      initialData={data}
      initialCustomTexts={server?.customTexts ?? {}}
      initialEditedFields={server?.editedFields ?? []}
      initialChat={server?.chat ?? []}
      initialConfirmedAt={server?.customerConfirmedAt ?? null}
      initialManualList={server?.manualList ?? []}
    />
  );
}

export default function KhachPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-2xl px-4 py-10">Đang mở thiệp…</p>}>
      <KhachInner />
    </Suspense>
  );
}
