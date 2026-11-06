import { NextResponse } from "next/server";
import { getInvitation } from "@/lib/server-store";
import { publicStatus } from "@/lib/server-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Trạng thái công khai của 1 thiệp — chỉ trạng thái + hạn, KHÔNG trả dữ liệu thiệp. Trang /thiep/[id] dùng để biết có bản ghi máy chủ không. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rec = await getInvitation(decodeURIComponent(params.id));
  return NextResponse.json({ ok: true, id: decodeURIComponent(params.id), ...publicStatus(rec) });
}
