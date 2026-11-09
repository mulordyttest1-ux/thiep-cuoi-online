/**
 * Lớp lưu trữ Supabase — PHÍA MÁY CHỦ (server-only, KHÔNG import từ client).
 *
 * Dùng API REST của Supabase (PostgREST) qua fetch, không cần thêm
 * dependency @supabase/supabase-js. Xác thực bằng SERVICE_ROLE_KEY — key
 * này BYPASS RLS nên chỉ dùng ở đây, KHÔNG BAO GIỜ lộ ra client (không có
 * tiền tố NEXT_PUBLIC_).
 *
 * Chưa cấu hình (thiếu NEXT_PUBLIC_SUPABASE_URL hoặc
 * SUPABASE_SERVICE_ROLE_KEY) thì isSupabaseConfigured() = false và
 * server-store.ts tự về lại file JSON local (dev/test). Trên Vercel mà
 * chưa cấu hình thì ghi trả lỗi 503 rõ ràng (xem server-store.ts).
 *
 * Bảng `invitations` (xem supabase/schema.sql): id text PK, data jsonb,
 * custom_texts jsonb, status text, edit_token text, history jsonb,
 * messages jsonb, created_at/updated_at/confirmed_at timestamptz, cộng
 * các cột còn lại của StoredInvitation để không mất dữ liệu khi đổi
 * backend (token xem trước/khách, thanh toán, log đối soát...). RLS BẬT
 * và KHÔNG có policy công khai — chỉ service key mới đọc/ghi được.
 */
import type { ChatMessage, HistoryEntry, ManualListItem, ReconcileEntry, StoredInvitation } from "./access";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()
  );
}

function supabaseBase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

/** Một dòng trong bảng invitations (tên cột snake_case như schema.sql). */
export interface InvitationRow {
  id: string;
  data: Record<string, unknown>;
  custom_texts: Record<string, string>;
  status: string;
  edit_token: string;
  history: HistoryEntry[];
  messages: ChatMessage[];
  created_at: string | null;
  updated_at: string | null;
  confirmed_at: string | null;
  preview_token: string;
  guest_token: string;
  guest_tokens: Record<string, string>;
  payment_memo: string;
  locked_at: string | null;
  preview_expires_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  paid_ref: string | null;
  paid_template_id: string | null;
  paid_memo: string | null;
  reconcile_log: ReconcileEntry[];
  edited_fields: string[];
  manual_list: ManualListItem[];
}

async function sbFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = supabaseBase();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase lỗi ${res.status}: ${text.slice(0, 200) || res.statusText}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** StoredInvitation -> dòng Supabase (đủ mọi trường, không mất dữ liệu). */
export function recordToRow(rec: StoredInvitation): InvitationRow {
  return {
    id: rec.id,
    data: rec.data as unknown as Record<string, unknown>,
    custom_texts: rec.customTexts ?? {},
    status: rec.status,
    edit_token: rec.editToken ?? "",
    history: rec.history ?? [],
    messages: rec.chat ?? [],
    created_at: rec.createdAt ?? null,
    updated_at: rec.updatedAt ?? null,
    confirmed_at: rec.customerConfirmedAt ?? null,
    preview_token: rec.previewToken ?? "",
    guest_token: rec.guestToken ?? "",
    guest_tokens: rec.guestTokens ?? {},
    payment_memo: rec.paymentMemo ?? "",
    locked_at: rec.lockedAt ?? null,
    preview_expires_at: rec.previewExpiresAt ?? null,
    paid_at: rec.paidAt ?? null,
    paid_amount: rec.paidAmount ?? null,
    paid_ref: rec.paidRef ?? null,
    paid_template_id: rec.paidTemplateId ?? null,
    paid_memo: rec.paidMemo ?? null,
    reconcile_log: rec.reconcileLog ?? [],
    edited_fields: rec.editedFields ?? [],
    manual_list: rec.manualList ?? [],
  };
}

/** Dòng Supabase -> StoredInvitation (cột thiếu/null thì về mặc định). */
export function rowToRecord(row: Partial<InvitationRow> & { id: string }): StoredInvitation {
  const now = new Date().toISOString();
  return {
    id: row.id,
    data: (row.data ?? {}) as unknown as StoredInvitation["data"],
    status: (row.status as StoredInvitation["status"]) ?? "draft",
    previewToken: row.preview_token ?? "",
    editToken: row.edit_token ?? "",
    guestToken: row.guest_token ?? "",
    guestTokens: row.guest_tokens ?? {},
    paymentMemo: row.payment_memo ?? "",
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
    lockedAt: row.locked_at ?? null,
    previewExpiresAt: row.preview_expires_at ?? null,
    paidAt: row.paid_at ?? null,
    paidAmount: row.paid_amount ?? null,
    paidRef: row.paid_ref ?? null,
    paidTemplateId: row.paid_template_id ?? null,
    paidMemo: row.paid_memo ?? null,
    reconcileLog: row.reconcile_log ?? [],
    customerConfirmedAt: row.confirmed_at ?? null,
    customTexts: row.custom_texts ?? {},
    editedFields: row.edited_fields ?? [],
    chat: row.messages ?? [],
    history: row.history ?? [],
    manualList: row.manual_list ?? [],
  };
}

export async function supabaseGet(id: string): Promise<StoredInvitation | null> {
  const rows = (await sbFetch(
    `invitations?select=*&id=eq.${encodeURIComponent(id)}`
  )) as InvitationRow[];
  if (!rows || rows.length === 0) return null;
  return rowToRecord(rows[0]);
}

/** Tất cả thiệp, mới nhất trước (theo updated_at). */
export async function supabaseListAll(): Promise<StoredInvitation[]> {
  const rows = (await sbFetch(
    `invitations?select=*&order=updated_at.desc`
  )) as InvitationRow[];
  return (rows ?? []).map((r) => rowToRecord(r));
}

export async function supabaseListIds(): Promise<string[]> {
  const rows = (await sbFetch(`invitations?select=id`)) as { id: string }[];
  return (rows ?? []).map((r) => r.id);
}

/** Lưu (tạo mới hoặc cập nhật) một thiệp: có rồi thì PATCH, chưa thì POST. */
export async function supabaseSave(rec: StoredInvitation): Promise<StoredInvitation> {
  const row = recordToRow(rec);
  const existing = await supabaseGet(rec.id);
  if (existing) {
    const updated = (await sbFetch(`invitations?id=eq.${encodeURIComponent(rec.id)}`, {
      method: "PATCH",
      body: JSON.stringify(row),
    })) as InvitationRow[];
    return rowToRecord(updated?.[0] ?? row);
  }
  const created = (await sbFetch(`invitations`, {
    method: "POST",
    body: JSON.stringify(row),
  })) as InvitationRow[];
  return rowToRecord(created?.[0] ?? row);
}
