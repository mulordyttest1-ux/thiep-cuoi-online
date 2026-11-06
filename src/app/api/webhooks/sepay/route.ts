import { NextResponse } from "next/server";
import { getInvitation, listInvitationIds, updateInvitation } from "@/lib/server-store";
import { invitationIdFromMemo, ONLINE_PRICE_VND, parsePaymentMemo, SEPAY_WEBHOOK_SECRET, templateCodeFor, templateCodeFromMemo } from "@/lib/payment";
import { markPaid, premiumLinkFor } from "@/lib/access";
import { TEMPLATES } from "@/lib/templates";
import { originOf } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook SePay — SePay gọi vào đây mỗi khi tiền vào tài khoản Nancy.
 * Payload SePay gửi (tên trường có thể khác đôi chút theo phiên bản):
 *   { id, gateway, transactionDate, accountNumber, content, transferType,
 *     transferAmount, referenceCode, ... }
 * Code đọc linh hoạt nhiều tên trường (transferAmount | amount | transfer_amount,
 * content | description, id | referenceCode | transactionId) để không gãy
 * khi SePay đổi tên trường phụ.
 *
 * Luật mở khóa (cả 3 phải đúng):
 *   1. Nội dung chuyển khoản chứa mã THIEP...-MẪU khớp đúng 1 thiệp + 1 mẫu.
 *      Mã cũ không kèm mẫu vẫn chấp nhận (mở theo mẫu hiện tại của thiệp).
 *   2. Số tiền >= giá thiệp online (ONLINE_PRICE_VND) — trả thiếu thì không mở.
 *      Trả thừa vẫn mở, không hoàn tự động.
 *   3. Mã giao dịch chưa từng dùng để mở khóa (idempotent theo paidRef).
 * Xác thực: nếu đặt SEPAY_WEBHOOK_SECRET thì request phải kèm header
 * x-webhook-secret đúng giá trị đó (đặt secret này trong dashboard SePay);
 * chưa đặt secret thì chỉ cho qua khi không phải production, và log cảnh báo.
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret") ?? "";
  if (SEPAY_WEBHOOK_SECRET) {
    if (secret !== SEPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "Sai webhook secret." }, { status: 401 });
    }
  } else if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    console.error("[sepay] Webhook không có SEPAY_WEBHOOK_SECRET trên production — từ chối.");
    return NextResponse.json({ ok: false, error: "Chưa cấu hình SEPAY_WEBHOOK_SECRET." }, { status: 401 });
  } else {
    console.warn("[sepay] SEPAY_WEBHOOK_SECRET chưa đặt — chấp nhận webhook vì đang chạy local (chỉ để test).");
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Body không phải JSON." }, { status: 400 });
  }
  const content = (body.content ?? body.description ?? "") as string;
  const amountRaw = body.transferAmount ?? body.amount ?? body.transfer_amount ?? 0;
  const amount = Number(amountRaw);
  const ref = String(body.id ?? body.referenceCode ?? body.transactionId ?? body.code ?? "");
  const memo = parsePaymentMemo(content);
  if (!memo) {
    // Giao dịch không liên quan thiệp (vd tiền mừng cưới của cô dâu chú rể) — bỏ qua, không lỗi.
    return NextResponse.json({ ok: true, ignored: true, reason: "Không có mã THIEP trong nội dung." });
  }
  if (!Number.isFinite(amount) || amount < ONLINE_PRICE_VND) {
    return NextResponse.json({
      ok: false,
      ignored: true,
      reason: `Số tiền ${Number.isFinite(amount) ? amount : "không rõ"} chưa đủ giá thiệp online ${ONLINE_PRICE_VND}đ — không mở khóa.`,
      memo,
    });
  }
  const ids = await listInvitationIds();
  const invitationId = invitationIdFromMemo(memo, ids);
  if (!invitationId) {
    return NextResponse.json({ ok: false, ignored: true, reason: `Mã ${memo} không khớp thiệp nào.`, memo });
  }
  const rec = await getInvitation(invitationId);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  if (rec.paidRef && ref && rec.paidRef === ref) {
    return NextResponse.json({ ok: true, alreadyPaid: true, id: invitationId, status: rec.status });
  }
  if (rec.status === "paid_online") {
    return NextResponse.json({ ok: true, alreadyPaid: true, id: invitationId, status: rec.status });
  }
  // Mẫu đã trả = hậu tố mẫu trong mã (nếu có), ngược lại dùng mẫu hiện tại
  // của thiệp. Chỉ mở khi mã mẫu là mẫu có thật trong app.
  const memoTemplateCode = templateCodeFromMemo(memo);
  const templateId = memoTemplateCode
    ? TEMPLATES.find((t) => templateCodeFor(t.id) === memoTemplateCode)?.id
    : rec.data.templateId;
  if (memoTemplateCode && !templateId) {
    return NextResponse.json({ ok: false, ignored: true, reason: `Mã mẫu ${memoTemplateCode} trong ${memo} không phải mẫu có thật.`, memo });
  }
  const updated = await updateInvitation(invitationId, (r) =>
    markPaid(r, amount, ref || `manual-${Date.now()}`, { templateId: templateId ?? rec.data.templateId, memo })
  );
  console.log(`[sepay] Đã mở thiệp online ${invitationId} (mẫu ${templateId}): ${amount}đ, ref=${ref}, memo=${memo}`);
  return NextResponse.json({
    ok: true,
    id: invitationId,
    status: updated!.status,
    paidAmount: amount,
    paidRef: ref || null,
    paidTemplateId: updated!.paidTemplateId,
    premiumLink: premiumLinkFor(originOf(req), updated!),
  });
}
