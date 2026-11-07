/** Phiên admin (Nancy) — mã admin chỉ kiểm tra Ở MÁY CHỦ.
 *
 * Cookie phiên = sha256(THIEP_ADMIN_TOKEN + ":admin") hex. Cookie KHÔNG chứa
 * mã admin, không lưu session ở DB/Supabase. Mã production do parent đặt vào
 * Vercel env (THIEP_ADMIN_TOKEN); chưa đặt token thì không mở khóa bằng bất
 * kỳ mã nào. So sánh dùng timingSafeEqual (chống timing attack). */
import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "td_admin_session";
export const ADMIN_SESSION_MAX_AGE = 180 * 24 * 60 * 60; // 180 ngày

export function adminSessionValue(token: string): string {
  return createHash("sha256").update(`${token}:admin`, "utf8").digest("hex");
}

/** So sánh chuỗi an toàn: khác độ dài -> false (timingSafeEqual ném lỗi khi khác độ dài). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Mã nhập đúng khi token đã đặt và khớp. Token chưa đặt -> luôn false. */
export function verifyAdminCode(code: string, token: string): boolean {
  if (!token || !code) return false;
  return safeEqual(code, token);
}

/** Cookie phiên hợp lệ khi token đã đặt và giá trị khớp sha256(token + ":admin"). */
export function isAdminSession(cookieValue: string | null | undefined, token: string): boolean {
  if (!token || !cookieValue) return false;
  return safeEqual(cookieValue, adminSessionValue(token));
}
