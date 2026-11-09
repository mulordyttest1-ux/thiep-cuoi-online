/**
 * Kho thiệp phía MÁY CHỦ (server-only — không import file này từ component client).
 *
 * Backend tự chọn: đã cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY) thì dùng bảng `invitations` trên Supabase
 * (xem src/lib/supabase.ts + supabase/schema.sql); chưa cấu hình thì dùng
 * file JSON `data/invitations.json` trong thư mục project (đủ để Nancy xem
 * trước qua tunnel và test webhook giả lập). File này KHÔNG commit (đã thêm
 * `data/` vào .gitignore).
 *
 * GIỚI HẠN PHẢI NÓI RÕ: ổ đĩa của Vercel là tạm (ephemeral) — deploy lên
 * Vercel mà vẫn dùng file JSON thì mỗi lần deploy/lạnh máy chủ là mất dữ
 * liệu. Lên production PHẢI có Supabase (tạo project mới cho Thiệp Đôi,
 * chạy supabase/schema.sql, đặt 3 biến env — project Supabase hiện có là
 * của app Sổ Tiền, KHÔNG được dùng chung). Khi chưa có Supabase mà chạy
 * production, mọi route ghi trả lỗi 503 với thông báo rõ ràng thay vì lặng
 * lẽ mất dữ liệu (xem assertStoreAvailable / storeKind).
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
import { isPrintConfirmed, newPaymentMemo } from "./access";
import {
  isSupabaseConfigured,
  supabaseGet,
  supabaseListAll,
  supabaseListIds,
  supabaseSave,
} from "./supabase";

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

/** Backend đang dùng: "supabase" khi đã cấu hình key, "file" khi chạy local
 *  chưa có Supabase, "none" khi ở Vercel mà chưa có Supabase (đọc trống,
 *  ghi trả lỗi 503 — xem assertStoreAvailable). */
export function storeKind(): "supabase" | "file" | "none" {
  if (isSupabaseConfigured()) return "supabase";
  return isFileStoreAllowed() ? "file" : "none";
}

function assertStoreAvailable(): void {
  if (storeKind() === "none") {
    throw new Error(
      "Chưa có database: file store không dùng được trên Vercel. Cần tạo project Supabase cho Thiệp Đôi trước."
    );
  }
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

/** Đọc 1 thiệp qua backend đang dùng (Supabase nếu có, không thì file). */
async function backendGet(id: string): Promise<StoredInvitation | null> {
  if (isSupabaseConfigured()) return supabaseGet(id);
  const all = await loadAll();
  return all[id] ?? null;
}

/** Tất cả thiệp, mới nhất trước (theo updatedAt). */
async function backendList(): Promise<StoredInvitation[]> {
  if (isSupabaseConfigured()) return supabaseListAll();
  const all = await loadAll();
  return Object.values(all).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

/** Lưu 1 thiệp qua backend đang dùng (ghi mới/cập nhật). */
async function backendSave(rec: StoredInvitation): Promise<StoredInvitation> {
  assertStoreAvailable();
  if (isSupabaseConfigured()) return supabaseSave(rec);
  const all = await loadAll();
  all[rec.id] = rec;
  await saveAll(all);
  return rec;
}

export function newToken(): string {
  return randomBytes(16).toString("hex");
}

export async function getInvitation(id: string): Promise<StoredInvitation | null> {
  return backendGet(id);
}

export async function listInvitationIds(): Promise<string[]> {
  if (isSupabaseConfigured()) return supabaseListIds();
  return Object.keys(await loadAll());
}

/** Tất cả thiệp cho bảng duyệt (/quan-ly), mới nhất trước. */
export async function listInvitations(): Promise<StoredInvitation[]> {
  return backendList();
}

/**
 * Link khách sửa trên máy chủ (?t=) — chỉ hiện trong /quan-ly (đã khóa
 * bằng mã admin), không bao giờ hiện trên trang khách. Token đã có sẵn
 * trên bản ghi từ lúc tạo (upsert), không tạo token mới ở đây.
 */
export function customerEditUrlFor(origin: string, rec: StoredInvitation): string {
  return `${origin}/khach/${encodeURIComponent(rec.id)}?t=${rec.editToken}`;
}

export async function upsertInvitation(
  data: InvitationData,
  opts: { status?: StoredInvitation["status"] } = {}
): Promise<StoredInvitation> {
  assertStoreAvailable();
  const now = new Date().toISOString();
  const existing = data.id ? await backendGet(data.id) : null;
  if (existing) {
    // Đã trả tiền thì không cho ghi đè dữ liệu qua API thường — chỉ đọc.
    if (existing.status === "paid_online") {
      throw new Error("Thiệp đã trả tiền — chỉ đọc, không sửa được nữa.");
    }
    // Đã chốt in (locked_for_print cũ hoặc confirmed/reviewed/printed mới):
    // chỉ cho sửa các trường CHỈ online (mẫu online, ảnh, câu chuyện, lịch
    // trình, lời mời, mừng cưới, dress code, ngôn ngữ). Nội dung vật lý
    // (tên, cha mẹ, ngày/giờ/địa điểm) đã chốt — muốn sửa phải mở khóa trước.
    if (isPrintConfirmed(existing.status)) {
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
      return backendSave(updated);
    }
    const updated: StoredInvitation = {
      ...existing,
      data: { ...data, id: existing.id },
      status: opts.status ?? existing.status,
      // Nháp/xem trước mà còn mốc chốt cũ là dữ liệu hỏng (mở lại trước
      // đây không xóa mốc — lỗi live 09/11): xóa để trang khách không bị
      // khóa oan. Bản ghi đã chốt đi nhánh trên nên không tới đây.
      customerConfirmedAt: null,
      updatedAt: now,
    };
    return backendSave(updated);
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
  return backendSave(rec);
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
  assertStoreAvailable();
  const rec = await backendGet(id);
  if (!rec) return null;
  const updated = patch(rec);
  return backendSave(updated);
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
