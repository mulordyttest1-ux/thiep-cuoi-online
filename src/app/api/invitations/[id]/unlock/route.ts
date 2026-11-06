import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { isAdminRequest } from "@/lib/server-auth";
import { STATUS_LABEL, unlockRecord } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mở khóa (chỉ Nancy/admin): locked -> draft để sửa lại. Tiền đã trả (nếu có) KHÔNG tự hoàn — hoàn tiền xử lý tay ngoài app. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
  }
  const id = decodeURIComponent(params.id);
  const rec = await getInvitation(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  if (rec.status === "draft" || rec.status === "preview_for_print") {
    return NextResponse.json({ ok: false, error: "Thiệp chưa chốt nên không cần mở khóa." }, { status: 400 });
  }
  const updated = await updateInvitation(id, (r) => unlockRecord(r));
  return NextResponse.json({
    ok: true,
    id,
    status: updated!.status,
    statusLabel: STATUS_LABEL[updated!.status],
    note: updated!.paidAt
      ? "Đã mở khóa để sửa. Lưu ý: thiệp này đã từng trả tiền — sửa xong cần chốt lại, khách không phải trả lại."
      : "Đã mở khóa, sửa được như nháp.",
  });
}
