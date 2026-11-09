import { NextResponse } from "next/server";
import { customerEditUrlFor, listInvitations, storeKind } from "@/lib/server-store";
import { isAdminRequest, originOf } from "@/lib/server-auth";
import { STATUS_LABEL } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Danh sách thiệp cho BẢNG DUYỆT (/quan-ly) — chỉ admin (Nancy).
 * Trả bản tóm tắt (không kèm chat/lịch sử đầy đủ): tên cô dâu chú rể,
 * ngày tiệc, trạng thái, giờ chốt, giờ cập nhật, và link khách (?t=) để
 * Nancy sao chép từ bảng. Mới nhất trước (theo updatedAt — lúc chốt thì
 * updatedAt = giờ chốt). Bấm vào 1 dòng thì trang Quản lý tải chi tiết
 * qua ?kind=admin như cũ.
 * store: "supabase" | "file" | "none" — "none" nghĩa là ở Vercel mà chưa
 * có Supabase nên danh sách trống (đọc không lỗi, ghi sẽ 503).
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Cần token admin (THIEP_ADMIN_TOKEN)." }, { status: 401 });
  }
  try {
    const recs = await listInvitations();
    const origin = originOf(req);
    return NextResponse.json({
      ok: true,
      store: storeKind(),
      items: recs.map((r) => ({
        id: r.id,
        groomName: r.data?.groomName ?? "",
        brideName: r.data?.brideName ?? "",
        date: r.data?.date ?? "",
        time: r.data?.time ?? "",
        venue: r.data?.venue ?? "",
        status: r.status,
        statusLabel: STATUS_LABEL[r.status] ?? r.status,
        customerConfirmedAt: r.customerConfirmedAt ?? null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        // Link khách (?t=) — chỉ dùng trong /quan-ly (admin), Nancy sao
        // chép gửi khách; không bao giờ trả link này ra trang khách.
        customerEditUrl: customerEditUrlFor(origin, r),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ.";
    const status = msg.includes("Chưa có database") ? 503 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
