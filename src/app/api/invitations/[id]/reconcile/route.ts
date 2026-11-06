import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { isAdminRequest, originOf } from "@/lib/server-auth";
import { appendReconcile, markPaid, premiumLinkFor } from "@/lib/access";
import { ONLINE_PRICE_VND } from "@/lib/payment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Đối soát tay (CHỈ Nancy, cần token admin) — PLAN CHỐT v3-final §3:
 * dùng khi khách đã chuyển tiền thật nhưng sai nội dung / webhook lỗi.
 * Cần mã giao dịch SePay + lý do, mỗi lần bấm đều ghi log vào bản ghi.
 * KHÔNG có nút "đã thu tiền mặt": tiền mặt cũng phải quét QR chuyển khoản
 * (Nancy có thể chuyển hộ 100k qua QR) để vẫn đi qua webhook.
 *
 * Luật: thiệp phải đã chốt in (hoặc đang duyệt in) và chưa trả tiền;
 * mã giao dịch chưa từng dùng để mở khóa; số tiền nhập >= 100.000đ.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN) — chỉ Nancy mới đối soát tay được." }, { status: 401 });
  }
  const id = decodeURIComponent(params.id);
  const body = (await req.json().catch(() => ({}))) as { ref?: string; reason?: string; amount?: number; templateId?: string };
  const ref = (body.ref ?? "").trim();
  const reason = (body.reason ?? "").trim();
  const amount = Number(body.amount ?? ONLINE_PRICE_VND);
  if (!ref) return NextResponse.json({ ok: false, error: "Thiếu mã giao dịch SePay." }, { status: 400 });
  if (!reason) return NextResponse.json({ ok: false, error: "Thiếu lý do đối soát." }, { status: 400 });
  if (!Number.isFinite(amount) || amount < ONLINE_PRICE_VND) {
    return NextResponse.json({ ok: false, error: `Số tiền đối soát phải >= ${ONLINE_PRICE_VND}đ.` }, { status: 400 });
  }
  const rec = await getInvitation(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  if (rec.status === "paid_online") {
    return NextResponse.json({ ok: false, error: "Thiệp đã trả tiền rồi — không cần đối soát nữa." }, { status: 400 });
  }
  if (rec.paidRef === ref) {
    return NextResponse.json({ ok: false, error: `Mã giao dịch ${ref} đã dùng để mở khóa rồi.` }, { status: 400 });
  }
  const templateId = (body.templateId ?? "").trim() || rec.data.templateId;
  const updated = await updateInvitation(id, (r) => {
    const paid = markPaid(r, amount, ref, { templateId, memo: null });
    return appendReconcile(paid, { at: new Date().toISOString(), ref, amount, reason });
  });
  console.log(`[reconcile] Nancy đối soát tay thiệp ${id}: ${amount}đ, ref=${ref}, lý do=${reason}`);
  return NextResponse.json({
    ok: true,
    id,
    status: updated!.status,
    paidAt: updated!.paidAt,
    paidAmount: amount,
    paidRef: ref,
    paidTemplateId: updated!.paidTemplateId,
    reconcileLog: updated!.reconcileLog,
    premiumLink: premiumLinkFor(originOf(req), updated!),
    note: "Đã mở khóa bằng đối soát tay. Kiểm tra lại sao kê SePay trước khi bấm — mỗi lần bấm đều ghi log.",
  });
}
