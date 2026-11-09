import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { isAdminRequest } from "@/lib/server-auth";
import { reviewRecord, STATUS_LABEL } from "@/lib/access";
import type { ReviewAction } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Nancy đổi trạng thái duyệt trong bảng duyệt (/quan-ly) — chỉ admin.
 *   { action: "reviewed" }  Chờ duyệt -> Đã duyệt
 *   { action: "printed" }   Đã duyệt -> Đã in
 *   { action: "reopen" }    Chờ duyệt / Đã duyệt / Đã in -> Nháp (mở lại)
 * Luồng chặt — xem reviewRecord (src/lib/access.ts). paid_online không
 * đổi được ở đây (đó là luồng bán online, không phải duyệt in).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
  }
  try {
    const id = decodeURIComponent(params.id);
    const body = (await req.json()) as { action?: string };
    const action = body.action as ReviewAction;
    if (action !== "reviewed" && action !== "printed" && action !== "reopen") {
      return NextResponse.json({ ok: false, error: "action phải là reviewed | printed | reopen." }, { status: 400 });
    }
    const rec = await getInvitation(id);
    if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
    const result = reviewRecord(rec, action);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason, status: rec.status }, { status: 400 });
    }
    const updated = await updateInvitation(id, () => result.rec);
    return NextResponse.json({
      ok: true,
      id,
      status: updated!.status,
      statusLabel: STATUS_LABEL[updated!.status],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
