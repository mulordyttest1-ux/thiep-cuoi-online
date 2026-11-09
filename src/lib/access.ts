/**
 * Máy trạng thái thiệp — phía MÁY CHỦ là nơi quyết định, không phải trình duyệt khách.
 *
 * PLAN CHỐT v3-final (2026-11-06):
 *   draft              Nancy/khách đang sửa trong editor (link ?d= cũ vẫn là nháp).
 *   preview_for_print  Nancy gửi link xem trước cho khách duyệt in: khách SỬA
 *                      được qua link edit, XEM được bản xem trước. KHÔNG còn
 *                      dấu chìm, KHÔNG còn hết hạn xem trước 3 ngày.
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
 * để đổi lấy khách thoải mái, thương hiệu không bị dấu chìm làm xấu.
 */
import type { InvitationData } from "./types";
import { ONLINE_VALID_DAYS_AFTER_WEDDING, paymentMemoFor } from "./payment";

export type InvitationStatus =
  | "draft"
  | "preview_for_print"
  | "locked_for_print"
  | "paid_online"
  | "confirmed"
  | "reviewed"
  | "printed";

export const STATUS_LABEL: Record<InvitationStatus, string> = {
  draft: "Nháp — đang sửa",
  preview_for_print: "Đang gửi khách duyệt in",
  locked_for_print: "Đã chốt in — chỉ đọc",
  paid_online: "Đã trả tiền — thiệp online đang mở",
  confirmed: "Khách đã chốt — chờ duyệt",
  reviewed: "Đã duyệt — chờ in",
  printed: "Đã in",
};

/** Trạng thái duyệt in trên bảng duyệt (/quan-ly). paid_online không nằm
 *  trong bảng duyệt in (đó là luồng bán online) nên trả null — chỉ hiện ở
 *  tab "Tất cả". */
export type ReviewTab = "pending" | "reviewed" | "printed" | "draft";

export function reviewTabOf(status: InvitationStatus): ReviewTab | null {
  switch (status) {
    case "confirmed":
    case "locked_for_print":
      return "pending";
    case "reviewed":
      return "reviewed";
    case "printed":
      return "printed";
    case "draft":
    case "preview_for_print":
      return "draft";
    case "paid_online":
      return null;
  }
}

/** Số lượng từng tab trên bảng duyệt (đếm từ danh sách bản ghi). */
export function reviewTabCounts(recs: StoredInvitation[]): Record<"all" | ReviewTab, number> {
  const out: Record<"all" | ReviewTab, number> = { all: recs.length, pending: 0, reviewed: 0, printed: 0, draft: 0 };
  for (const r of recs) {
    const t = reviewTabOf(r.status);
    if (t) out[t]++;
  }
  return out;
}

/** Một lần đối soát tay (chỉ Nancy bấm): khách đã chuyển tiền thật nhưng sai mã / webhook lỗi. */
export interface ReconcileEntry {
  at: string;
  ref: string;
  amount: number;
  reason: string;
}

/** Một tin nhắn trong khung chat theo từng thiệp (khách ↔ Nancy).
 *  Chữ thường, không realtime — xem khi mở trang / tải lại. */
export interface ChatMessage {
  from: "khach" | "nancy";
  text: string;
  at: string; // ISO
}

/** Một dòng lịch sử sửa của khách — ghi khi khách bấm Xong trong box sửa.
 *  kind "dữ liệu": trường có khóa CEP, chảy về ghost text.
 *  kind "câu mẫu": câu mẫu cố định, KHÔNG vào ghost text (xem manualList). */
export interface HistoryEntry {
  kind: "dữ liệu" | "câu mẫu";
  label: string;
  oldValue: string;
  newValue: string;
  at: string; // ISO
}

/** Một câu mẫu đã sửa, cần sửa tay trong Illustrator (không vào ghost text).
 *  oldValue = chữ gốc của mẫu; newValue = chữ khách đã sửa. */
export interface ManualListItem {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
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
  /** Giờ khách bấm Chốt trên trang khách (null khi chưa chốt). */
  customerConfirmedAt: string | null;
  /** Câu mẫu đã sửa (khóa -> chữ mới) — KHÔNG vào ghost text, chỉ vào
   *  danh sách sửa tay (manualList). */
  customTexts: Record<string, string>;
  /** Trường dữ liệu đã sửa — để đánh dấu trên thiệp khi mở lại link. */
  editedFields: string[];
  /** Chat khách ↔ Nancy theo từng thiệp (không realtime). */
  chat: ChatMessage[];
  /** Lịch sử sửa của khách (hiển thị mới nhất trước). */
  history: HistoryEntry[];
  /** Danh sách "CẦN SỬA TAY TRONG ILLUSTRATOR" lúc chốt (chữ cũ -> chữ mới). */
  manualList: ManualListItem[];
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

/** Đã chốt in (vật lý) — khách không sửa được nữa, chỉ đọc. Bao gồm cả
 *  locked_for_print cũ (admin chốt) và 3 trạng thái duyệt mới (khách chốt
 *  -> confirmed, Nancy duyệt -> reviewed, in xong -> printed). */
export function isPrintConfirmed(status: InvitationStatus): boolean {
  return (
    status === "locked_for_print" ||
    status === "confirmed" ||
    status === "reviewed" ||
    status === "printed"
  );
}

export function isLocked(status: InvitationStatus): boolean {
  return status === "locked_for_print" || status === "paid_online" || isPrintConfirmed(status);
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
  // Xem trước mở được cả sau khi khách chốt in (confirmed/reviewed/
  // printed) — mục demo online trong editor tải qua link này để bán online.
  if (
    rec.status !== "preview_for_print" &&
    rec.status !== "locked_for_print" &&
    rec.status !== "confirmed" &&
    rec.status !== "reviewed" &&
    rec.status !== "printed"
  ) {
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

/** Khách bấm Chốt trên trang khách: draft/preview_for_print -> confirmed
 *  (chờ duyệt), ghi giờ chốt (customerConfirmedAt = confirmed_at). Từ đây
 *  khách không sửa được nữa (canEdit false) và bảng duyệt của Nancy hiện
 *  thông báo. */
export function confirmRecord(rec: StoredInvitation, now = new Date()): StoredInvitation {
  const at = now.toISOString();
  return {
    ...rec,
    status: "confirmed",
    customerConfirmedAt: at,
    updatedAt: at,
  };
}

export type ReviewAction = "reviewed" | "printed" | "reopen";

/** Nancy đổi trạng thái duyệt trong /quan-ly. Luồng chặt:
 *   confirmed (hoặc locked_for_print cũ) -> reviewed ("Đã duyệt")
 *   reviewed -> printed ("Đã in")
 *   confirmed | reviewed | printed | locked_for_print -> draft ("Mở lại")
 *  Trả { ok: false } khi chuyển không hợp lệ (vd draft -> reviewed,
 *  confirmed -> printed, paid_online -> bất cứ gì). */
export function reviewRecord(
  rec: StoredInvitation,
  action: ReviewAction,
  now = new Date()
): { ok: true; rec: StoredInvitation } | { ok: false; reason: string } {
  const at = now.toISOString();
  if (action === "reviewed") {
    if (rec.status !== "confirmed" && rec.status !== "locked_for_print") {
      return { ok: false, reason: `Chỉ duyệt được thiệp đang chờ duyệt (hiện tại: ${STATUS_LABEL[rec.status]}).` };
    }
    return { ok: true, rec: { ...rec, status: "reviewed", updatedAt: at } };
  }
  if (action === "printed") {
    if (rec.status !== "reviewed") {
      return { ok: false, reason: `Chỉ đánh dấu "Đã in" cho thiệp đã duyệt (hiện tại: ${STATUS_LABEL[rec.status]}).` };
    }
    return { ok: true, rec: { ...rec, status: "printed", updatedAt: at } };
  }
  // reopen: về nháp để sửa lại (giữ nguyên token + giờ chốt cũ như unlockRecord).
  if (
    rec.status !== "confirmed" &&
    rec.status !== "reviewed" &&
    rec.status !== "printed" &&
    rec.status !== "locked_for_print"
  ) {
    return { ok: false, reason: `Thiệp này chưa chốt nên không cần mở lại (hiện tại: ${STATUS_LABEL[rec.status]}).` };
  }
  return { ok: true, rec: { ...rec, status: "draft", lockedAt: null, previewExpiresAt: null, updatedAt: at } };
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
