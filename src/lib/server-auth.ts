/** Kiểm tra quyền admin (Nancy) cho các thao tác chốt/mở khóa/tạo link khách.
 * Token lấy từ env THIEP_ADMIN_TOKEN. Chưa đặt token thì ở local (dev) cho
 * qua để test được, nhưng log cảnh báo; ở production (VERCEL=1) thì bắt
 * buộc phải có token — không có là từ chối. Token này KHÔNG phải key SePay. */
import { THIEP_ADMIN_TOKEN } from "@/lib/payment";

export function isAdminRequest(req: Request): boolean {
  const url = new URL(req.url);
  const supplied =
    req.headers.get("x-admin-token") ??
    url.searchParams.get("admin") ??
    "";
  if (THIEP_ADMIN_TOKEN) return supplied === THIEP_ADMIN_TOKEN;
  if (process.env.VERCEL === "1") return false;
  console.warn("[thiep] THIEP_ADMIN_TOKEN chưa đặt — cho phép thao tác admin vì đang chạy local. Đặt token trước khi deploy.");
  return true;
}

export function originOf(req: Request): string {
  const env = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}
