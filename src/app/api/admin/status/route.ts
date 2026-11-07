import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { THIEP_ADMIN_TOKEN } from "@/lib/payment";
import { ADMIN_SESSION_COOKIE, isAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/status — phiên admin hiện tại còn hiệu lực không.
 * Tính lại sha256 từ THIEP_ADMIN_TOKEN ở máy chủ rồi so sánh với cookie. */
export async function GET() {
  const token = THIEP_ADMIN_TOKEN;
  const value = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  return NextResponse.json({ ok: isAdminSession(value, token) });
}
