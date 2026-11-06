import { NextResponse } from "next/server";
import { getInvitation, newToken, updateInvitation } from "@/lib/server-store";
import { isAdminRequest, originOf } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tạo link riêng cho 1 khách — CHỈ khi thiệp đã trả tiền (paid_online). Chưa trả tiền thì từ chối: đây là chốt chặn chống xài chùa. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
  }
  const id = decodeURIComponent(params.id);
  const body = (await req.json().catch(() => ({}))) as { guestName?: string };
  const guestName = (body.guestName ?? "").trim();
  if (!guestName) return NextResponse.json({ ok: false, error: "Thiếu tên khách." }, { status: 400 });
  const rec = await getInvitation(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Không tìm thấy thiệp." }, { status: 404 });
  if (rec.status !== "paid_online") {
    return NextResponse.json({
      ok: false,
      error: "Thiệp chưa trả tiền thiệp online nên chưa tạo được link khách. Khách trả tiền xong mới tạo link.",
      status: rec.status,
    }, { status: 403 });
  }
  const token = rec.guestTokens[guestName] ?? newToken();
  await updateInvitation(id, (r) => ({
    ...r,
    guestTokens: { ...r.guestTokens, [guestName]: token },
    updatedAt: new Date().toISOString(),
  }));
  const origin = originOf(req);
  return NextResponse.json({
    ok: true,
    guestName,
    guestUrl: `${origin}/thiep/${encodeURIComponent(id)}?gt=${token}&guest=${encodeURIComponent(guestName)}`,
  });
}
