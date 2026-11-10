import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock } from "@/lib/cep";
import { canEdit, confirmRecord } from "@/lib/access";
import { notifyOwner } from "@/lib/notify";
import type { ManualListItem } from "@/lib/access";
import type { InvitationData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Khách bấm Chốt trên trang khách: lưu dữ liệu cuối + câu mẫu + danh sách
 * trường đã sửa + danh sách sửa tay, ghi status=confirmed + giờ chốt,
 * trả về ghost text + metadata + bản chữ thường + danh sách sửa tay để hiện
 * ngay trên trang khách và trong Quản lý. Chỉ khi còn sửa được và đúng
 * editToken. Từ đây khách không sửa được nữa (bảng duyệt của Nancy hiện
 * thông báo "Có N thiệp khách vừa chốt"). Ghost text chỉ chứa trường dữ
 * liệu (32 khóa CEP); câu mẫu đã sửa nằm ở manualList — không bao giờ lọt
 * vào ghost text.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(params.id);
    const body = (await req.json()) as {
      token?: string;
      data?: Partial<InvitationData>;
      customTexts?: Record<string, string>;
      editedFields?: string[];
      manualList?: ManualListItem[];
    };
    const rec = await getInvitation(id);
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    if (body.token !== rec.editToken) {
      return NextResponse.json({ ok: false, error: "Link sửa không đúng." }, { status: 403 });
    }
    if (!canEdit(rec.status)) {
      return NextResponse.json({ ok: false, error: "Thiệp đã chốt — không chốt lại được.", status: rec.status }, { status: 403 });
    }
    const data: InvitationData = body.data ? { ...rec.data, ...body.data, id: rec.id } : rec.data;
    if (!data.groomName?.trim() || !data.brideName?.trim()) {
      return NextResponse.json({ ok: false, error: "Thiếu tên chú rể / cô dâu." }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ ok: false, error: "Thiếu ngày cưới." }, { status: 400 });
    }
    const customTexts = body.customTexts ?? rec.customTexts ?? {};
    const editedFields = body.editedFields ?? rec.editedFields ?? [];
    const manualList = body.manualList ?? rec.manualList ?? [];
    const confirmedAt = new Date().toISOString();
    await updateInvitation(id, (r) => ({
      ...confirmRecord({ ...r, data, customTexts, editedFields, manualList }, new Date(confirmedAt)),
    }));
    // Thông báo cho Nancy — ĐỢI gửi xong rồi mới trả response: trước đây
    // fire-and-forget nên trên Vercel serverless hàm có thể đóng băng ngay
    // sau khi trả response, cắt ngang fetch gửi tin (tin ngừng 1 lần
    // 10/11/2026 dù lần chốt đã lưu thành công). notifyOwner không bao giờ
    // throw (sendTelegram đã nuốt lỗi + ghi log), try/catch ở đây chỉ là
    // đai an toàn thứ hai — lỗi/chậm không được làm hỏng phản hồi chốt.
    // Chỉ link máy chủ (?t=) mới báo được (link ?d= cũ chốt ở trình duyệt
    // khách, máy chủ không biết).
    try {
      await notifyOwner(data);
    } catch {
      // Đã ghi log trong sendTelegram; lần chốt vẫn thành công.
    }
    return NextResponse.json({
      ok: true,
      status: "confirmed",
      confirmedAt,
      ghostText: buildCepTextBlock(data),
      metadata: buildCepMetadataJson(),
      plainText: buildCepPlainText(data),
      manualList,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
