import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { isAdminRequest, originOf } from "@/lib/server-auth";
import { lockRecord, STATUS_LABEL } from "@/lib/access";
import { formatVnd, ONLINE_PRICE_VND } from "@/lib/payment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Chốt in: preview_for_print -> locked_for_print. Từ đây mục "Xem demo thiệp online" trong editor mở bán online (v3-final, không còn hết hạn xem trước). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
  }
  const id = decodeURIComponent(params.id);
  const rec = await getInvitation(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  if (rec.status === "paid_online") {
    return NextResponse.json({ ok: false, error: "Thiệp đã trả tiền — không cần chốt lại." }, { status: 400 });
  }
  if (rec.status === "locked_for_print" || rec.status === "confirmed" || rec.status === "reviewed" || rec.status === "printed") {
    return NextResponse.json({ ok: false, error: "Thiệp đã chốt in rồi — xem trạng thái trong bảng duyệt." }, { status: 400 });
  }
  const updated = await updateInvitation(id, (r) => lockRecord(r));
  const origin = originOf(req);
  return NextResponse.json({
    ok: true,
    id,
    status: updated!.status,
    statusLabel: STATUS_LABEL[updated!.status],
    demoUrl: `${origin}/tao-thiep?demo=${encodeURIComponent(id)}&t=${updated!.previewToken}`,
    payment: {
      amount: ONLINE_PRICE_VND,
      amountText: formatVnd(ONLINE_PRICE_VND),
      memo: updated!.paymentMemo,
      note: "Đã chốt in xong vật lý. Khách mua thiệp online ở mục “Xem demo thiệp online” trong editor: chọn mẫu, quét QR 100k theo đúng mã thiệp + mẫu, SePay báo về thì thiệp tự mở.",
    },
  });
}
