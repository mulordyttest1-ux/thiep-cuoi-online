import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { canEdit } from "@/lib/access";
import type { HistoryEntry } from "@/lib/access";
import type { InvitationData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lưu nháp từng lần khách sửa xong (bấm Xong trong box sửa): dữ liệu +
 * câu mẫu + danh sách trường đã sửa + 1 dòng lịch sử (nếu có).
 * Chỉ khi còn sửa được (draft / preview_for_print) và đúng editToken.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(params.id);
    const body = (await req.json()) as {
      token?: string;
      data?: Partial<InvitationData>;
      customTexts?: Record<string, string>;
      editedFields?: string[];
      historyEntry?: HistoryEntry;
    };
    const rec = await getInvitation(id);
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    if (body.token !== rec.editToken) {
      return NextResponse.json({ ok: false, error: "Link sửa không đúng." }, { status: 403 });
    }
    if (!canEdit(rec.status)) {
      return NextResponse.json({ ok: false, error: "Thiệp đã chốt — không sửa được nữa.", status: rec.status }, { status: 403 });
    }
    const updated = await updateInvitation(id, (r) => ({
      ...r,
      data: body.data ? { ...r.data, ...body.data, id: r.id } : r.data,
      customTexts: body.customTexts ?? r.customTexts ?? {},
      editedFields: body.editedFields ?? r.editedFields ?? [],
      history: body.historyEntry
        ? [body.historyEntry, ...(r.history ?? [])].slice(0, 500)
        : (r.history ?? []),
      updatedAt: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, status: updated?.status ?? rec.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
