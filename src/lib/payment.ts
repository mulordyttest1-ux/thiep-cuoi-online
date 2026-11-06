/**
 * Thanh toán thiệp online — MỘT NƠI DUY NHẤT chứa giá + mã thanh toán.
 * Nancy đổi giá thì chỉ sửa biến môi trường NEXT_PUBLIC_ONLINE_PRICE_VND
 * (hoặc số dưới đây), không sửa rải rác trong code.
 *
 * PLAN CHỐT v3-final (2026-11-06): giá 100.000đ / thiệp online, một giá
 * cho mọi mẫu. SePay gói FREE — 0đ/tháng, 50 giao dịch tiền vào/tháng,
 * nối Vietcombank qua API, tài khoản cá nhân dùng được. Tiền khách chuyển
 * về THẲNG tài khoản ngân hàng của Nancy, SePay chỉ báo về webhook khi
 * tiền vào — SePay không giữ tiền, không trừ % trên đơn.
 *
 * KHÔNG có key thật nào ở đây. Tài khoản ngân hàng nhận tiền + secret webhook
 * lấy từ biến môi trường (xem .env.example). Chưa cấu hình thì endpoint
 * thanh toán trả configured:false và KHÔNG sinh QR giả.
 */

/** Giá thiệp online — PLAN CHỐT v3-final: 100.000đ, một giá cho mọi mẫu. */
export const ONLINE_PRICE_VND: number = (() => {
  const raw = process.env.NEXT_PUBLIC_ONLINE_PRICE_VND ?? process.env.ONLINE_PRICE_VND;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 100000;
})();

/** Thiệp online đã trả tiền: link khách dùng được tới 30 ngày sau ngày cưới. */
export const ONLINE_VALID_DAYS_AFTER_WEDDING = 30;

/** Ngân hàng nhận tiền (SePay) — đọc từ env, để trống = chưa cấu hình. */
export const SEPAY_BANK_CODE = (process.env.SEPAY_BANK_CODE ?? "").trim().toUpperCase();
export const SEPAY_ACCOUNT_NUMBER = (process.env.SEPAY_ACCOUNT_NUMBER ?? "").trim();
export const SEPAY_ACCOUNT_NAME = (process.env.SEPAY_ACCOUNT_NAME ?? "").trim();
export const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET ?? "";
export const THIEP_ADMIN_TOKEN = process.env.THIEP_ADMIN_TOKEN ?? "";

export function isPaymentConfigured(): boolean {
  return Boolean(SEPAY_BANK_CODE && SEPAY_ACCOUNT_NUMBER);
}

/** Mã mẫu trong mã thanh toán: bỏ dấu gạch, viết hoa. VD "song-phung-do" -> "SONGPHUNGDO". */
export function templateCodeFor(templateId: string | null | undefined): string {
  return (templateId ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Mã thanh toán duy nhất cho mỗi (thiệp + mẫu): THIEP + id đã bỏ dấu gạch
 * ngang, viết hoa + "-" + mã mẫu. VD id "thiep-mk8x-abc123", mẫu
 * "song-phung-do" -> "THIEPMK8XABC123-SONGPHUNGDO". Không có mẫu thì chỉ
 * còn phần THIEP... (tương thích mã cũ).
 */
export function paymentMemoFor(invitationId: string, templateId?: string | null): string {
  const clean = invitationId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = templateCodeFor(templateId);
  return code ? `THIEP${clean}-${code}` : `THIEP${clean}`;
}

/** Tách mã THIEP... (kèm hậu tố mẫu nếu có) ra khỏi nội dung chuyển khoản mà SePay gửi về. */
export function parsePaymentMemo(content: string | null | undefined): string | null {
  if (!content) return null;
  const m = String(content).toUpperCase().match(/THIEP[A-Z0-9]{4,}(?:-[A-Z0-9]{2,})?/);
  return m ? m[0] : null;
}

/** Tách mã thanh toán thành phần thiệp + mã mẫu. VD "THIEPABC123-SONGPHUNGDO" -> { invitationPart: "ABC123", templateCode: "SONGPHUNGDO" }. */
export function splitPaymentMemo(memo: string): { invitationPart: string; templateCode: string | null } {
  const body = memo.replace(/^THIEP/i, "").toUpperCase();
  const dash = body.indexOf("-");
  if (dash === -1) return { invitationPart: body, templateCode: null };
  return { invitationPart: body.slice(0, dash), templateCode: body.slice(dash + 1) || null };
}

/** Mã mẫu trong mã thanh toán, hoặc null khi mã cũ không có hậu tố mẫu. */
export function templateCodeFromMemo(memo: string): string | null {
  return splitPaymentMemo(memo).templateCode;
}

/** Tìm id thiệp từ mã thanh toán: bỏ tiền tố THIEP + hậu tố mẫu, so khớp với id đã bỏ dấu gạch ngang (không phân biệt hoa thường). */
export function invitationIdFromMemo(memo: string, ids: string[]): string | null {
  const { invitationPart } = splitPaymentMemo(memo);
  for (const id of ids) {
    if (id.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === invitationPart) return id;
  }
  return null;
}

export function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")}đ`;
}

/**
 * QR VietQR để khách trả tiền mua thiệp online: đúng số tiền + đúng mã.
 * Dùng cùng dịch vụ ảnh img.vietqr.io như QR mừng cưới đã có trong app.
 * Trả null khi chưa cấu hình tài khoản nhận tiền — không sinh QR giả.
 */
export function vietQrPaymentUrlFor(memo: string, amount: number = ONLINE_PRICE_VND): string | null {
  if (!isPaymentConfigured()) return null;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: memo,
    accountName: SEPAY_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(SEPAY_BANK_CODE)}-${encodeURIComponent(SEPAY_ACCOUNT_NUMBER)}-compact2.png?${params.toString()}`;
}
