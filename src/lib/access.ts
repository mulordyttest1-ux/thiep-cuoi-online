/**
 * Máy trạng thái thiệp — phía MÁY CHỦ là nơi quyết định, không phải trình duyệt khách.
 *
 * PLAN CHỐT v3-final (2026-11-06):
 *   draft              Nancy/khách đang sửa trong editor (link ?d= cũ vẫn là nháp).
 *   preview_for_print  Nancy gửi link xem trước cho khách duyệt in: khách SỬA
 *                      được qua link edit, XEM được bản xem trước. KHÔNG còn
 *                      watermark, KHÔNG còn hết hạn xem trước 3 ngày.
 *   locked_for_print   Khách chốt in (xong vật lý): chỉ đọc, editor đóng. Từ
 *                      đây mục "Xem demo thiệp online" trong editor mở wizard
 *                      mua thiệp online (chọn mẫu -> thêm ảnh/thông tin ->
 *                      quét QR 100k nhận link xịn).
 *   paid_online        Đã trả tiền thiệp online (SePay webhook khớp đúng số tiền
 *                      + đúng mã THIEP...-MẪU, hoặc Nancy đối soát tay):
 *                      link xịn (mã hóa dữ liệu trong link, chỉ đọc) + link
 *                      khách chính thức mở, dùng tới 30 ngày sau ngày cưới.
 *
 * Chống xài chùa: dữ liệu thiệp NẰM TRÊN MÁY CHỦ (server store), không còn
 * nằm trong ?d= trên URL — TRỪ link xịn sau khi trả tiền: link xịn là link
 * ?d= tĩnh, mã hóa dữ liệu vào trong link, chỉ đọc, chỉ mở được khi máy chủ
 * đã ghi paid_online cho đúng thiệp + đúng mẫu. Trước khi trả tiền, link
 * ?d= cũ không mở được thiệp đã lên máy chủ.
 * Link xem trước và link khách là 2 URL + 2 token KHÁC NHAU:
 *   xem trước: /xem-thu/<id>?t=<previewToken>   (link cũ — nay chuyển tới mục demo online trong editor)
 *   khách:     /thiep/<id>?gt=<guestToken>&guest=<tên>  (chỉ khi đã trả tiền)
 *   link xịn:  /thiep/<id>?d=<base64url JSON>    (chỉ khi đã trả tiền, đúng mẫu đã trả)
 * Link edit cho khách sửa: /tao-thiep?edit=<id>&t=... chỉ dùng được khi còn
 * draft hoặc preview_for_print; đã locked/paid thì editor chỉ đọc.
 *
 * Giới hạn nói thẳng: không chặn được chụp màn hình 100% (không ai chặn
 * được). Demo online chỉ blur tên/ngày/giờ/địa điểm — chấp nhận mất mát nhỏ
 * để đổi lấy khách thoải mái, thương hiệu không bị watermark làm xấu.
 */
import type { InvitationData } from "./types";
import { ONLINE_VALID_DAYS_AFTER_WEDDING, paymentMemoFor } from "./payment";

export type InvitationStatus =
  | "draft"
  | "preview_for_print"
  | "locked_for_print"
  | "paid_online";

export const STATUS_LABEL: Record<InvitationStatus, string> = {
  draft: "Nháp — đang sửa",
  preview_for_print: "Đang gửi khách duyệt in",
  locked_for_print: "Đã chốt in — chỉ đọc",
  paid_online: "Đã trả tiền — thiệp online đang mở",
};

/** Một lần đối soát tay (chỉ Nancy bấm): khách đã chuyển tiền thật nhưng sai mã / webhook lỗi. */
export interface ReconcileEntry {
  at: string;
  ref: string;
  amount: number;
  reason: string;
}

export interface StoredInvitation {
  id: string;
  data: InvitationData;
  status: InvitationStatus;
  /** Token xem trước (khách duyệt in). Khác token khách, khác token sửa. */
  previewToken: string;
  /** Token sửa (khách sửa qua /tao-thiep?edit=<id>&t=...). Chỉ dùng khi còn sửa được. */
  editToken: string;
  /** Token link khách chính thức. Chỉ có giá trị khi đã trả tiền. */
  guestToken: string;
  /** Link riêng từng khách: tên -> token riêng (tạo khi đã trả tiền). */
  guestTokens: Record<string, string>;
  /** Mã thanh toán gốc của thiệp (THIEP... không kèm mẫu) — để tương thích mã cũ. */
  paymentMemo: string;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  /** Giữ trường để tương thích dữ liệu cũ — v3-final KHÔNG còn hết hạn xem trước, luôn null với bản ghi mới. */
  previewExpiresAt: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  /** Mã giao dịch SePay đã đối soát (chống mở khóa 2 lần cho 1 giao dịch). */
  paidRef: string | null;
  /** Mẫu online đã trả tiền (id mẫu, vd "song-phung-do") — link xịn chỉ mở đúng mẫu này. */
  paidTemplateId: string | null;
  /** Mã thanh toán đã trả (THIEP...-MẪU) — null khi trả bằng mã cũ không kèm mẫu. */
  paidMemo: string | null;
  /** Lịch sử đối soát tay (chỉ Nancy). Webhook tự động không ghi vào đây. */
  reconcileLog: ReconcileEntry[];
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isExpired(iso: string | null, now = new Date()): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= now.getTime();
}

/** Link khách chính thức còn hiệu lực tới 30 ngày sau ngày cưới. */
export function onlineValidUntil(data: InvitationData): string | null {
  if (!data.date) return null;
  const d = new Date(`${data.date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + ONLINE_VALID_DAYS_AFTER_WEDDING);
  return d.toISOString();
}

export function canEdit(status: InvitationStatus): boolean {
  return status === "draft" || status === "preview_for_print";
}

export function isLocked(status: InvitationStatus): boolean {
  return status === "locked_for_print" || status === "paid_online";
}

export type GuestAccess =
  | { allowed: true }
  | { allowed: false; reason: "not_paid" | "expired" | "invalid_token" | "not_found" };

/**
 * Quyết định cho link khách chính thức (/thiep/[id]?gt=...).
 * Chỉ paid_online + đúng guestToken + chưa quá 30 ngày sau cưới mới được xem.
 */
export function guestAccess(
  rec: StoredInvitation | null,
  guestToken: string | null,
  now = new Date()
): GuestAccess {
  if (!rec) return { allowed: false, reason: "not_found" };
  if (rec.status !== "paid_online") return { allowed: false, reason: "not_paid" };
  if (!guestToken || guestToken !== rec.guestToken) return { allowed: false, reason: "invalid_token" };
  const until = onlineValidUntil(rec.data);
  if (until && isExpired(until, now)) return { allowed: false, reason: "expired" };
  return { allowed: true };
}

export type PreviewAccess =
  | { allowed: true }
  | { allowed: false; reason: "invalid_token" | "not_found" | "paid" };

/**
 * Quyết định cho link xem trước (/xem-thu/[id]?t=...).
 * Xem được khi còn preview_for_print hoặc locked_for_print, đúng token.
 * KHÔNG còn hết hạn (v3-final bỏ hết hạn xem trước 3 ngày). Đã trả tiền
 * thì link xem trước không cần nữa -> dẫn sang link khách (reason "paid").
 */
export function previewAccess(
  rec: StoredInvitation | null,
  previewToken: string | null
): PreviewAccess {
  if (!rec) return { allowed: false, reason: "not_found" };
  if (rec.status === "paid_online") return { allowed: false, reason: "paid" };
  if (rec.status !== "preview_for_print" && rec.status !== "locked_for_print") {
    return { allowed: false, reason: "invalid_token" };
  }
  if (!previewToken || previewToken !== rec.previewToken) {
    return { allowed: false, reason: "invalid_token" };
  }
  return { allowed: true };
}

/** Lúc chốt in (xong vật lý): chỉ ghi mốc chốt, KHÔNG đặt hạn xem trước nữa. */
export function lockRecord(rec: StoredInvitation, now = new Date()): StoredInvitation {
  const at = now.toISOString();
  return {
    ...rec,
    status: "locked_for_print",
    lockedAt: at,
    previewExpiresAt: null,
    updatedAt: at,
  };
}

/** Mở khóa (chỉ Nancy/admin): về lại nháp để sửa, giữ nguyên token + lịch sử trả tiền (nếu đã trả thì tiền không hoàn tự động). */
export function unlockRecord(rec: StoredInvitation, now = new Date()): StoredInvitation {
  return { ...rec, status: "draft", lockedAt: null, previewExpiresAt: null, updatedAt: now.toISOString() };
}

/**
 * Đánh dấu đã trả tiền sau khi webhook khớp (hoặc đối soát tay).
 * Idempotent theo paidRef. Ghi rõ mẫu đã trả + mã đã trả để link xịn chỉ
 * mở đúng mẫu đó.
 */
export function markPaid(
  rec: StoredInvitation,
  amount: number,
  ref: string,
  opts: { templateId?: string | null; memo?: string | null } = {},
  now = new Date()
): StoredInvitation {
  if (rec.paidRef === ref) return rec; // giao dịch này đã mở khóa rồi
  return {
    ...rec,
    status: "paid_online",
    paidAt: now.toISOString(),
    paidAmount: amount,
    paidRef: ref,
    paidTemplateId: opts.templateId ?? rec.data.templateId ?? null,
    paidMemo: opts.memo ?? null,
    updatedAt: now.toISOString(),
  };
}

/** Ghi một lần đối soát tay vào log (chỉ Nancy, kèm mã giao dịch SePay + lý do). */
export function appendReconcile(
  rec: StoredInvitation,
  entry: ReconcileEntry
): StoredInvitation {
  return { ...rec, reconcileLog: [...(rec.reconcileLog ?? []), entry], updatedAt: entry.at };
}

export function newPaymentMemo(id: string): string {
  return paymentMemoFor(id);
}

/**
 * Link xịn (v3-final): /thiep/<id>?d=<base64url JSON> — dữ liệu mã hóa vào
 * trong link, chỉ đọc, ĐỘC LẬP với link demo (demo không bao giờ biến thành
 * link xịn). Chỉ có ý nghĩa khi thiệp đã paid_online: trang /thiep/[id]
 * chỉ mở link ?d= khi máy chủ đã ghi paid_online cho đúng thiệp + đúng mẫu.
 */
export function premiumLinkFor(origin: string, rec: StoredInvitation): string {
  const data = { ...rec.data, templateId: rec.paidTemplateId ?? rec.data.templateId };
  const b64 = Buffer.from(JSON.stringify(data), "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${origin}/thiep/${encodeURIComponent(rec.id)}?d=${b64}`;
}
