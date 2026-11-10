import { NextResponse } from "next/server";
import { getInvitation, upsertInvitation } from "@/lib/server-store";
import { isAdminRequest, originOf } from "@/lib/server-auth";
import { STATUS_LABEL } from "@/lib/access";
import { emptyInvitation } from "@/lib/types";
import type { InvitationData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tạo/cập nhật thiệp trên máy chủ + trả link xem trước cho khách duyệt in. */
export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
    }
    const body = (await req.json()) as { data?: Partial<InvitationData>; customTexts?: Record<string, string> };
    // Nền TRỐNG (emptyInvitation): thiệp mới chỉ có đúng dữ liệu gửi lên
    // — trường nào không gửi thì trống, không lọt dữ liệu mẫu vào.
    const data = { ...emptyInvitation(), ...(body.data ?? {}) } as InvitationData;
    // Câu mẫu sửa trong editor cũng lên máy chủ (trước đây chỉ nhận data nên
    // câu mẫu chị sửa ở editor không bao giờ tới được khách — lỗi 10/11/2026:
    // dòng tên khách "Quý Gia Đình" hiện đúng ở editor nhưng khách vẫn thấy
    // dòng chấm). Chuẩn hoá NFC (dữ liệu dán từ Illustrator hay có dấu rời),
    // chỉ giữ giá trị chuỗi.
    const customTexts: Record<string, string> | undefined = body.customTexts
      ? Object.fromEntries(
          Object.entries(body.customTexts)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, (v as string).normalize("NFC")])
        )
      : undefined;
    if (!data.groomName?.trim() || !data.brideName?.trim()) {
      return NextResponse.json({ ok: false, error: "Thiếu tên chú rể / cô dâu." }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ ok: false, error: "Thiếu ngày cưới." }, { status: 400 });
    }
    const rec = await upsertInvitation(data, { status: "preview_for_print", customTexts });
    const origin = originOf(req);
    return NextResponse.json({
      ok: true,
      id: rec.id,
      status: rec.status,
      statusLabel: STATUS_LABEL[rec.status],
      previewUrl: `${origin}/xem-thu/${encodeURIComponent(rec.id)}?t=${rec.previewToken}`,
      editUrl: `${origin}/tao-thiep?edit=${encodeURIComponent(rec.id)}&t=${rec.editToken}`,
      customerEditUrl: `${origin}/khach/${encodeURIComponent(rec.id)}?t=${rec.editToken}`,
      paymentMemo: rec.paymentMemo,
      note: "Link xem trước không có link khách. Gửi link này cho khách duyệt in. Sau khi chốt in, mua thiệp online ở mục “Xem demo thiệp online” trong editor.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

/** Kiểm tra nhanh một thiệp có bản ghi máy chủ không (không trả dữ liệu).
 *  Yêu cầu admin (phiên AdminGate / token) thì trả thêm link khách (?t=)
 *  để editor lấy link có sẵn mà không phải ghi đè dữ liệu bằng upsert.
 *  Link mang editToken nên người ngoài chỉ biết có/không, không thấy link. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Thiếu id." }, { status: 400 });
  const rec = await getInvitation(id);
  const admin = isAdminRequest(req);
  const origin = originOf(req);
  return NextResponse.json({
    ok: true,
    id,
    exists: Boolean(rec),
    status: rec?.status ?? null,
    statusLabel: rec ? STATUS_LABEL[rec.status] : null,
    ...(admin && rec
      ? {
          customerEditUrl: `${origin}/khach/${encodeURIComponent(rec.id)}?t=${rec.editToken}`,
          editUrl: `${origin}/tao-thiep?edit=${encodeURIComponent(rec.id)}&t=${rec.editToken}`,
        }
      : {}),
  });
}
