/**
 * Kho thiệp phía MÁY CHỦ (server-only — không import file này từ component client).
 *
 * Mặc định (chạy local / demo): lưu vào file JSON `data/invitations.json`
 * trong thư mục project. Đủ để Nancy xem trước qua tunnel và test webhook
 * giả lập. File này KHÔNG commit (đã thêm `data/` vào .gitignore).
 *
 * GIỚI HẠN PHẢI NÓI RÕ: ổ đĩa của Vercel là tạm (ephemeral) — deploy lên
 * Vercel mà vẫn dùng file JSON thì mỗi lần deploy/lạnh máy chủ là mất dữ
 * liệu. Lên production PHẢI chuyển sang Supabase (đã có sẵn trong
 * .env.example: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY — nhưng CHƯA CÓ project
 * Supabase nào cho Thiệp Đôi; project Supabase hiện có là của app Sổ Tiền,
 * KHÔNG được dùng chung). Cách chuyển: thay 3 hàm dưới đây bằng code gọi
 * Supabase (bảng `invitations`, cột jsonb `data` + các cột trạng thái),
 * giữ nguyên kiểu StoredInvitation và toàn bộ API route — không đổi.
 * Khi chưa có Supabase mà chạy production, mọi route đọc/ghi sẽ trả lỗi
 * 503 với thông báo rõ ràng thay vì lặng lẽ mất dữ liệu (xem isFileStoreAllowed).
 *
 * PLAN CHỐT v3-final (2026-11-06): sau khi chốt in, khách vẫn được sửa các
 * trường CHỈ online trong demo (mẫu online, ảnh, câu chuyện, lịch trình,
 * lời mời, mừng cưới, dress code, ngôn ngữ) — nội dung vật lý (tên, cha mẹ,
 * ngày/giờ/địa điểm lễ + tiệc) đã chốt thì không sửa qua API thường, phải
 * mở khóa. Đã trả tiền thì chỉ đọc hoàn toàn.
 */
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { InvitationData } from "./types";
import type { StoredInvitation } from "./access";
import { newPaymentMemo } from "./access";

const STORE_FILE = path.join(process.cwd(), "data", "invitations.json");

/**
 * File store chỉ an toàn khi chạy local (dev / `next start` trên máy này).
 * Trên Vercel, biến VERCEL=1 — khi đó nếu chưa có Supabase thì từ chối ghi
 * để không tạo ảo giác "đã lưu" rồi mất.
 */
export function isFileStoreAllowed(): boolean {
  if (process.env.VERCEL === "1" && !process.env.ALLOW_FILE_STORE) return false;
  return true;
}

export function newToken(): string {
  return randomBytes(16).toString("hex");
}

async function loadAll(): Promise<Record<string, StoredInvitation>> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, StoredInvitation>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveAll(all: Record<string, StoredInvitation>): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(all, null, 2), "utf-8");
}

export async function getInvitation(id: string): Promise<StoredInvitation | null> {
  const all = await loadAll();
  return all[id] ?? null;
}

export async function listInvitationIds(): Promise<string[]> {
  return Object.keys(await loadAll());
}

export async function upsertInvitation(
  data: InvitationData,
  opts: { status?: StoredInvitation["status"] } = {}
): Promise<StoredInvitation> {
  if (!isFileStoreAllowed()) {
    throw new Error(
      "Chưa có database: file store không dùng được trên Vercel. Cần tạo project Supabase cho Thiệp Đôi trước."
    );
  }
  const all = await loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? all[data.id] : null;
  if (existing) {
    // Đã trả tiền thì không cho ghi đè dữ liệu qua API thường — chỉ đọc.
    if (existing.status === "paid_online") {
      throw new Error("Thiệp đã trả tiền — chỉ đọc, không sửa được nữa.");
    }
    // Đã chốt in: chỉ cho sửa các trường CHỈ online (mẫu online, ảnh, câu
    // chuyện, lịch trình, lời mời, mừng cưới, dress code, ngôn ngữ).
    // Nội dung vật lý (tên, cha mẹ, ngày/giờ/địa điểm) đã chốt — muốn sửa
    // phải mở khóa trước.
    if (existing.status === "locked_for_print") {
      const merged = { ...existing.data } as unknown as Record<string, unknown>;
      const incoming = data as unknown as Record<string, unknown>;
      for (const k of ONLINE_EDITABLE_FIELDS) {
        merged[k] = incoming[k];
      }
      const updated: StoredInvitation = {
        ...existing,
        data: { ...(merged as unknown as InvitationData), id: existing.id },
        updatedAt: now,
      };
      all[existing.id] = updated;
      await saveAll(all);
      return updated;
    }
    const updated: StoredInvitation = {
      ...existing,
      data: { ...data, id: existing.id },
      status: opts.status ?? existing.status,
      updatedAt: now,
    };
    all[existing.id] = updated;
    await saveAll(all);
    return updated;
  }
  const id = data.id || `thiep-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const rec: StoredInvitation = {
    id,
    data: { ...data, id },
    status: opts.status ?? "preview_for_print",
    previewToken: newToken(),
    editToken: newToken(),
    guestToken: newToken(),
    guestTokens: {},
    paymentMemo: newPaymentMemo(id),
    createdAt: now,
    updatedAt: now,
    lockedAt: null,
    previewExpiresAt: null,
    paidAt: null,
    paidAmount: null,
    paidRef: null,
    paidTemplateId: null,
    paidMemo: null,
    reconcileLog: [],
    customerConfirmedAt: null,
    customTexts: {},
    editedFields: [],
    chat: [],
    history: [],
    manualList: [],
  };
  all[id] = rec;
  await saveAll(all);
  return rec;
}

/** Các trường chỉ thuộc về bản online — được sửa cả sau khi chốt in (v3-final). */
export const ONLINE_EDITABLE_FIELDS: (keyof InvitationData)[] = [
  "templateId",
  "photoUrl",
  "story",
  "scheduleText",
  "message",
  "bankCode",
  "accountNumber",
  "accountName",
  "dressCode",
  "language",
];

export async function updateInvitation(
  id: string,
  patch: (rec: StoredInvitation) => StoredInvitation
): Promise<StoredInvitation | null> {
  if (!isFileStoreAllowed()) {
    throw new Error(
      "Chưa có database: file store không dùng được trên Vercel. Cần tạo project Supabase cho Thiệp Đôi trước."
    );
  }
  const all = await loadAll();
  const rec = all[id];
  if (!rec) return null;
  const updated = patch(rec);
  all[id] = updated;
  await saveAll(all);
  return updated;
}

export function publicStatus(rec: StoredInvitation | null): {
  exists: boolean;
  status: StoredInvitation["status"] | null;
  previewExpiresAt: string | null;
  paidAt: string | null;
  paidTemplateId: string | null;
  paidAmount: number | null;
} {
  if (!rec) return { exists: false, status: null, previewExpiresAt: null, paidAt: null, paidTemplateId: null, paidAmount: null };
  return {
    exists: true,
    status: rec.status,
    previewExpiresAt: rec.previewExpiresAt,
    paidAt: rec.paidAt,
    paidTemplateId: rec.paidTemplateId ?? null,
    paidAmount: rec.paidAmount,
  };
}
