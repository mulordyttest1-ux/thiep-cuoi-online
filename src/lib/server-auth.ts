/** Kiểm tra quyền admin (Nancy) cho các thao tác chốt/mở khóa/tạo link khách.
 * Token lấy từ env THIEP_ADMIN_TOKEN. Chưa đặt token thì ở local (dev) cho
 * qua để test được, nhưng log cảnh báo; ở production (VERCEL=1) thì bắt
 * buộc phải có token — không có là từ chối. Token này KHÔNG phải key SePay.
 *
 * Chấp nhận 3 cách đưa token: header x-admin-token, ?admin=, hoặc cookie
 * phiên td_admin_session (AdminGate đã kiểm tra mã 1 lần, trình duyệt nhớ
 * 180 ngày) — để trang Quản lý / Tạo thiệp gọi API mà không bắt Nancy nhập
 * lại mã mỗi lần. Cookie KHÔNG chứa mã, chỉ chứa sha256(token + ":admin"). */
import { THIEP_ADMIN_TOKEN } from "@/lib/payment";
import { ADMIN_SESSION_COOKIE, isAdminSession } from "@/lib/admin-session";

/** Đọc cookie phiên admin từ header Cookie (chuỗi thô) — hàm thuần để test được. */
export function isAdminSessionCookie(cookieHeader: string | null | undefined, token: string): boolean {
  if (!token || !cookieHeader) return false;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE) {
      return isAdminSession(rest.join("=").trim(), token);
    }
  }
  return false;
}

export function isAdminRequest(req: Request): boolean {
  const url = new URL(req.url);
  const supplied =
    req.headers.get("x-admin-token") ??
    url.searchParams.get("admin") ??
    "";
  if (THIEP_ADMIN_TOKEN) {
    if (supplied === THIEP_ADMIN_TOKEN) return true;
    return isAdminSessionCookie(req.headers.get("cookie"), THIEP_ADMIN_TOKEN);
  }
  if (process.env.VERCEL === "1") return false;
  console.warn("[thiep] THIEP_ADMIN_TOKEN chưa đặt — cho phép thao tác admin vì đang chạy local. Đặt token trước khi deploy.");
  return true;
}

export function originOf(req: Request): string {
  const env = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}
