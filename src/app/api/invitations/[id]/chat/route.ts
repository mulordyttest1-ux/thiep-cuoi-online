import { NextResponse } from "next/server";
import { getInvitation, updateInvitation } from "@/lib/server-store";
import { isAdminRequest } from "@/lib/server-auth";
import type { ChatMessage } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Chat theo từng thiệp (khách ↔ Nancy). Chữ thường, không realtime — xem
 * khi mở trang / tải lại.
 *  - Khách gửi: đúng editToken, from="khach" (mở được cả khi đã chốt in,
 *    để khách còn hỏi sau khi chốt; chỉ chặn khi thiệp không tồn tại).
 *  - Nancy trả lời: token admin, from="nancy" (từ trang Quản lý).
 *  Tối đa 2000 ký tự / tin, tối đa 500 tin / thiệp.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(params.id);
    const body = (await req.json()) as { token?: string; from?: string; text?: string };
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ ok: false, error: "Chưa nhập nội dung." }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ ok: false, error: "Tin nhắn tối đa 2000 ký tự." }, { status: 400 });
    const rec = await getInvitation(id);
    if (!rec) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    const asCustomer = body.from === "khach" && body.token === rec.editToken;
    const asAdmin = body.from === "nancy" && isAdminRequest(req);
    if (!asCustomer && !asAdmin) {
      return NextResponse.json({ ok: false, error: "Không có quyền gửi tin nhắn cho thiệp này." }, { status: 403 });
    }
    const msg: ChatMessage = { from: asCustomer ? "khach" : "nancy", text, at: new Date().toISOString() };
    const updated = await updateInvitation(id, (r) => ({
      ...r,
      chat: [...(r.chat ?? []), msg].slice(-500),
      updatedAt: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, message: msg, count: updated?.chat?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
