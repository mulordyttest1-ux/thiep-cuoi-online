import { NextResponse } from "next/server";
import { THIEP_ADMIN_TOKEN } from "@/lib/payment";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminSessionValue,
  verifyAdminCode,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/verify {code} — đúng mã admin thì đặt cookie phiên admin
 * (HttpOnly, SameSite=Lax, 180 ngày). Mã kiểm tra ở máy chủ, không nằm
 * trong code client. Chưa đặt THIEP_ADMIN_TOKEN -> 503, không mở khóa. */
export async function POST(req: Request) {
  const token = THIEP_ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "admin_not_configured" }, { status: 503 });
  }
  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    code = "";
  }
  if (!verifyAdminCode(code, token)) {
    return NextResponse.json({ ok: false, error: "wrong_code" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(token), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
