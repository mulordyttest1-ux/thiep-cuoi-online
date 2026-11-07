import { NextResponse } from "next/server";
import { getInvitation } from "@/lib/server-store";
import { isAdminRequest } from "@/lib/server-auth";
import { canEdit, guestAccess, previewAccess } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cổng đọc dữ liệu thiệp — MỌI lần mở thiệp có bản ghi máy chủ đều qua đây.
 * ?kind=preview&t=<previewToken>  -> xem trước cho khách duyệt in (không watermark, không hết hạn — v3-final)
 * ?kind=guest&t=<guestToken>      -> link khách chính thức (chỉ khi đã trả tiền)
 * ?kind=edit&t=<editToken>        -> dữ liệu cho editor (chỉ khi còn sửa được)
 * Không đúng token / sai trạng thái -> 403, KHÔNG trả dữ liệu.
 * Link xịn sau trả tiền (/thiep/<id>?d=...) KHÔNG qua cổng này — trang
 * /thiep/[id] tự kiểm tra trạng thái paid_online + mẫu đã trả rồi mới mở.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const token = url.searchParams.get("t");
  const rec = await getInvitation(id);

  if (kind === "preview") {
    const a = previewAccess(rec, token);
    if (!a.allowed) {
      return NextResponse.json({ ok: false, reason: a.reason, serverRecord: true }, { status: 403 });
    }
    return NextResponse.json({
      ok: true, serverRecord: true,
      status: rec!.status, data: rec!.data,
    });
  }

  if (kind === "guest") {
    const guestName = url.searchParams.get("guest") ?? undefined;
    if (!rec) {
      return NextResponse.json({ ok: false, reason: "not_found", serverRecord: true }, { status: 404 });
    }
    if (rec.status !== "paid_online") {
      return NextResponse.json({ ok: false, reason: "not_paid", serverRecord: true }, { status: 403 });
    }
    // Token hợp lệ = token khách chung, hoặc token riêng của đúng tên khách đó.
    const perGuest = guestName ? rec.guestTokens[guestName] : undefined;
    const tokenOk = Boolean(token && (token === rec.guestToken || (perGuest && token === perGuest)));
    if (!tokenOk) {
      return NextResponse.json({ ok: false, reason: "invalid_token", serverRecord: true }, { status: 403 });
    }
    const a = guestAccess(rec, rec.guestToken, new Date());
    if (!a.allowed) {
      const status = a.reason === "expired" ? 410 : 403;
      return NextResponse.json({ ok: false, reason: a.reason, serverRecord: true }, { status });
    }
    return NextResponse.json({
      ok: true, serverRecord: true,
      status: rec.status, data: rec.data, guestName,
    });
  }

  if (kind === "edit") {
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found", serverRecord: true }, { status: 404 });
    if (token !== rec.editToken) {
      return NextResponse.json({ ok: false, reason: "invalid_token", serverRecord: true }, { status: 403 });
    }
    if (!canEdit(rec.status)) {
      return NextResponse.json({ ok: false, reason: "locked", serverRecord: true, status: rec.status }, { status: 403 });
    }
    return NextResponse.json({
      ok: true, serverRecord: true, status: rec.status, data: rec.data,
      customerConfirmedAt: rec.customerConfirmedAt ?? null,
      customTexts: rec.customTexts ?? {},
      editedFields: rec.editedFields ?? [],
      chat: rec.chat ?? [],
      history: rec.history ?? [],
      manualList: rec.manualList ?? [],
    });
  }

  // kind=admin: Nancy xem trong Quản lý — ghost text + chat + lịch sử +
  // danh sách sửa tay của một thiệp (cần token admin).
  if (kind === "admin") {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
    }
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found", serverRecord: true }, { status: 404 });
    return NextResponse.json({
      ok: true, serverRecord: true,
      id: rec.id, status: rec.status, data: rec.data,
      customerConfirmedAt: rec.customerConfirmedAt ?? null,
      customTexts: rec.customTexts ?? {},
      editedFields: rec.editedFields ?? [],
      chat: rec.chat ?? [],
      history: rec.history ?? [],
      manualList: rec.manualList ?? [],
    });
  }

  return NextResponse.json({ ok: false, error: "Thiếu kind=preview|guest|edit|admin." }, { status: 400 });
}
