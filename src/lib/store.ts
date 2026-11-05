import type { Guest, InvitationData } from "./types";
import { defaultInvitation, newId } from "./types";

const K = {
  invitation: "td_invitation",
  invitations: "td_invitations",
  guests: "td_guests",
  guestsSeeded: "td_guests_seeded",
  lang: "td_lang",
};

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ---------- Thiệp ---------- */

export function loadInvitation(): InvitationData | null {
  return safeParse<InvitationData | null>(safeGet(K.invitation), null);
}

export function saveInvitation(data: InvitationData): { ok: boolean; id: string } {
  const withId = data.id ? data : { ...data, id: newId("thiep") };
  const ok = safeSet(K.invitation, JSON.stringify(withId));
  try {
    const all = safeParse<Record<string, InvitationData>>(safeGet(K.invitations), {});
    all[withId.id] = withId;
    safeSet(K.invitations, JSON.stringify(all));
  } catch {
    // không chặn luồng lưu chính nếu bảng phụ lỗi
  }
  return { ok, id: withId.id };
}

export function loadInvitationById(id: string): InvitationData | null {
  const all = safeParse<Record<string, InvitationData>>(safeGet(K.invitations), {});
  if (all[id]) return all[id];
  const current = loadInvitation();
  return current && current.id === id ? current : null;
}

/** Mã hoá thiệp thành tham số ?d= (JSON base64url) để link mở được trên máy khác. */
export function encodeShare(data: InvitationData): string {
  const json = JSON.stringify(data);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(encoded: string): InvitationData | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as InvitationData;
    if (!parsed || typeof parsed !== "object" || !parsed.groomName || !parsed.brideName) return null;
    const merged = { ...defaultInvitation(), ...parsed };
    // Các trường tùy chọn chỉ hiện khi link mang theo (vòng 12): dữ liệu
    // mặc định có sẵn thứ bậc/địa chỉ/dress code mẫu cho preview editor,
    // nhưng link cũ (tạo trước khi có các trường này) không được lọt giá
    // trị mẫu vào thiệp thật — thiếu trường thì ẩn, đúng như bản gốc.
    for (const k of ["groomBirthOrder", "brideBirthOrder", "groomParentsAddress", "brideParentsAddress", "dressCode"] as const) {
      if (!(k in parsed)) delete merged[k];
    }
    return merged;
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, data: InvitationData): string {
  const id = data.id || "demo";
  return `${origin}/thiep/${encodeURIComponent(id)}?d=${encodeShare(data)}`;
}

/* ---------- Khách mời ---------- */

export function seedGuestsIfEmpty(): Guest[] {
  const existing = safeParse<Guest[]>(safeGet(K.guests), []);
  if (existing.length > 0) return existing;
  if (safeGet(K.guestsSeeded) === "1") return existing;
  const seed: Guest[] = [
    { id: newId("khach"), name: "Anh Tuấn", group: "Bạn bè", side: "trai", phone: "", note: "", isDemo: true },
    { id: newId("khach"), name: "Chị Hương", group: "Gia đình", side: "gai", phone: "", note: "", isDemo: true },
    { id: newId("khach"), name: "Cô Mai", group: "Gia đình", side: "trai", phone: "", note: "", isDemo: true },
    { id: newId("khach"), name: "Bạn Linh", group: "Đồng nghiệp", side: "gai", phone: "", note: "", isDemo: true },
  ];
  safeSet(K.guests, JSON.stringify(seed));
  safeSet(K.guestsSeeded, "1");
  return seed;
}

export function loadGuests(): Guest[] {
  return safeParse<Guest[]>(safeGet(K.guests), []);
}

export function saveGuests(guests: Guest[]): boolean {
  return safeSet(K.guests, JSON.stringify(guests));
}

export function clearDemoGuests(): Guest[] {
  const rest = loadGuests().filter((g) => !g.isDemo);
  saveGuests(rest);
  return rest;
}

/* ---------- Ngôn ngữ ---------- */

export function loadLang(): "vi" | "en" {
  const v = safeGet(K.lang);
  return v === "en" ? "en" : "vi";
}

export function saveLang(lang: "vi" | "en"): void {
  safeSet(K.lang, lang);
}

/** Sao chép text, có fallback chọn text khi clipboard API không khả dụng. */
export async function copyText(text: string): Promise<{ ok: boolean; fallback?: string }> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
    throw new Error("clipboard unavailable");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return { ok, fallback: ok ? undefined : text };
    } catch {
      return { ok: false, fallback: text };
    }
  }
}

export function vietQrUrl(bankCode: string, accountNumber: string, accountName: string): string | null {
  const bank = bankCode.trim().toUpperCase();
  const acc = accountNumber.trim();
  if (!bank || !acc) return null;
  const params = new URLSearchParams({ addInfo: "Mung cuoi", accountName: accountName.trim() });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acc)}-compact2.png?${params.toString()}`;
}
