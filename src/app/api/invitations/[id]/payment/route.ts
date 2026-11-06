import { NextResponse } from "next/server";
import { getInvitation } from "@/lib/server-store";
import { formatVnd, isPaymentConfigured, ONLINE_PRICE_VND, paymentMemoFor, SEPAY_ACCOUNT_NAME, SEPAY_ACCOUNT_NUMBER, SEPAY_BANK_CODE, vietQrPaymentUrlFor } from "@/lib/payment";
import { premiumLinkFor } from "@/lib/access";
import { originOf } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Thông tin trả tiền mua thiệp online cho 1 thiệp đã chốt (hoặc đã trả).
 * QR riêng theo từng (thiệp + mẫu): mã THIEP...-MẪU, đúng 100.000đ.
 * ?template=<id mẫu> — mặc định dùng mẫu hiện tại của thiệp.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const rec = await getInvitation(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  const origin = originOf(req);
  if (rec.status === "paid_online") {
    return NextResponse.json({
      ok: true,
      id,
      status: rec.status,
      alreadyPaid: true,
      paidAt: rec.paidAt,
      paidAmount: rec.paidAmount,
      paidTemplateId: rec.paidTemplateId ?? rec.data.templateId,
      paidMemo: rec.paidMemo,
      guestUrl: `${origin}/thiep/${encodeURIComponent(id)}?gt=${rec.guestToken}`,
      premiumLink: premiumLinkFor(origin, rec),
    });
  }
  if (rec.status !== "locked_for_print") {
    return NextResponse.json({
      ok: false,
      error: "Thiệp chưa chốt in nên chưa mở bán online. Chốt in trước, rồi mới hiện QR trả tiền.",
      status: rec.status,
    }, { status: 400 });
  }
  const url = new URL(req.url);
  const templateId = url.searchParams.get("template")?.trim() || rec.data.templateId;
  const memo = paymentMemoFor(id, templateId);
  if (!isPaymentConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: "Chưa cấu hình tài khoản nhận tiền SePay (SEPAY_BANK_CODE / SEPAY_ACCOUNT_NUMBER). Nancy cần tạo tài khoản SePay + nối Vietcombank, rồi điền key vào biến môi trường Vercel.",
      amount: ONLINE_PRICE_VND,
      amountText: formatVnd(ONLINE_PRICE_VND),
      memo,
      templateId,
    }, { status: 503 });
  }
  return NextResponse.json({
    ok: true,
    configured: true,
    id,
    status: rec.status,
    amount: ONLINE_PRICE_VND,
    amountText: formatVnd(ONLINE_PRICE_VND),
    memo,
    templateId,
    bankCode: SEPAY_BANK_CODE,
    accountNumber: SEPAY_ACCOUNT_NUMBER,
    accountName: SEPAY_ACCOUNT_NAME,
    qrUrl: vietQrPaymentUrlFor(memo, ONLINE_PRICE_VND),
    note: "Khách quét QR, chuyển đúng số tiền + đúng nội dung (mã). SePay báo về webhook thì thiệp tự mở — không cần Nancy bấm gì.",
  });
}
