import type { Guest, InvitationData, StdEditField } from "./types";
import { emptyInvitation, newId } from "./types";
import { DEFAULT_PHYSICAL_FORM_ID } from "./physical-forms";

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
    // Nền TRỐNG (emptyInvitation), không phải dữ liệu mẫu: link chỉ mang
    // bao nhiêu thì thiệp có bấy nhiêu — trường nào link không có thì
    // trống, khối đó tự ẩn (không lọt màu/câu chuyện/lịch trình/ảnh mẫu
    // vào thiệp thật như trước đây khi nền là defaultInvitation).
    const merged = { ...emptyInvitation(parsed.templateId ?? "minimal-do-do"), ...parsed };
    return merged;
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, data: InvitationData): string {
  const id = data.id || "demo";
  return `${origin}/thiep/${encodeURIComponent(id)}?d=${encodeShare(data)}`;
}

/** Link cho khách sửa mẫu in: mở trang khách /khach/<id>?d= (chỉ thấy mẫu
    form in, layout trần) kèm dữ liệu trong ?d=. Khác link chia sẻ thiệp
    online (/thiep/...) — link này không mở trình sửa của Nancy.
    BẤT BIẾN: ?c= = link đã chốt — link đã chốt LUÔN mang ?c=, kể cả khi
    khách không sửa câu mẫu nào (lúc đó customTexts = {} rỗng). Chỉ link
    CHƯA chốt (từ /tao-thiep, không truyền customTexts) mới không có ?c=.
    ?c= mang payload {customTexts, initialMessage} — initialMessage là
    message GỐC lúc khách mở link lần đầu (trước khi sửa), để máy khác mở
    link đã chốt vẫn tính đúng diff cho trường "Lời mời" (vì ?d= của link
    đã chốt chứa message MỚI, không còn chữ gốc để so). Link đã chốt cũ
    (chưa mang initialMessage) vẫn đọc được: thiếu initialMessage thì
    message trong ?d= được dùng làm gốc (hành vi cũ). Nhờ vậy Nancy mở
    link đã chốt trên máy khác vẫn thấy đúng dạng chỉ đọc + danh sách sửa
    tay (chữ để in thì lấy từ /quan-ly — trang khách không hiện chữ để in). */
export function buildCustomerEditUrl(
  origin: string,
  data: InvitationData,
  customTexts?: Record<string, string>,
  initialMessage?: string
): string {
  const id = data.id || "demo";
  const base = `${origin}/khach/${encodeURIComponent(id)}?d=${encodeShare(data)}`;
  if (customTexts === undefined) return base;
  return `${base}&c=${encodeCustomTexts(customTexts, initialMessage)}`;
}

/** Payload của tham số ?c= trên link đã chốt: câu mẫu đã sửa + message GỐC
    lúc khách mở link lần đầu. initialMessage undefined khi link cũ (chưa
    mang initialMessage) — khi đó message trong ?d= được dùng làm gốc. */
export interface ConfirmedCustomTexts {
  customTexts: Record<string, string>;
  initialMessage?: string;
}

/** Mã hoá payload ?c= thành tham số (JSON base64url). */
export function encodeCustomTexts(customTexts: Record<string, string>, initialMessage?: string): string {
  const payload: ConfirmedCustomTexts =
    initialMessage === undefined ? { customTexts } : { customTexts, initialMessage };
  const json = JSON.stringify(payload);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Giải mã tham số ?c=; null khi không có / sai định dạng. Dạng mới là
    {customTexts, initialMessage?}; dạng cũ (cả object là customTexts) vẫn
    đọc được, initialMessage lúc đó là undefined. */
export function decodeCustomTexts(encoded: string | null | undefined): ConfirmedCustomTexts | null {
  if (!encoded) return null;
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const strMap = (o: Record<string, unknown>): Record<string, string> => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    };
    const rec = parsed as Record<string, unknown>;
    if (rec.customTexts !== undefined && typeof rec.customTexts === "object" && !Array.isArray(rec.customTexts)) {
      const im = rec.initialMessage;
      return {
        customTexts: strMap(rec.customTexts as Record<string, unknown>),
        initialMessage: typeof im === "string" ? im : undefined,
      };
    }
    return { customTexts: strMap(rec) };
  } catch {
    return null;
  }
}

/** Cờ khách đã chốt cho link ?d= (không máy chủ): khóa sửa khi mở lại link
    trên cùng trình duyệt. Khóa THEO BASE, không theo id: giá trị cờ là
    {base, data} lúc chốt — link chỉ khóa khi base của link đang mở khớp
    với base đã chốt HOẶC với dữ liệu đã chốt (link đã chốt có ?d= là dữ
    liệu mới). Nancy gửi link mới (cùng id, base khác) thì mở ra KHÔNG
    khóa, sửa tiếp bình thường. Khóa triệt để qua mọi máy chỉ có ở link
    máy chủ (customerConfirmedAt trên bản ghi máy chủ). */
export function customerConfirmedKey(id: string): string {
  return `td_customer_confirmed_${id}`;
}

export function isCustomerConfirmed(id: string, linkBase: InvitationData): boolean {
  const raw = safeGet(customerConfirmedKey(id));
  if (!raw) return false;
  // Chỉ chấp nhận cờ dạng JSON {base, data}. Cờ cũ "1" (trước khi khóa theo
  // base) bị coi là chưa chốt — chỉ còn trong localStorage của trình duyệt
  // test, khách thật chưa ai chốt bằng bản cũ nên bỏ tương thích ngược là
  // an toàn.
  try {
    const parsed = JSON.parse(raw) as { base?: InvitationData; data?: InvitationData };
    if (!parsed || typeof parsed !== "object") return false;
    if (parsed.base && sameCustomerData(parsed.base, linkBase)) return true;
    if (parsed.data && sameCustomerData(parsed.data, linkBase)) return true;
    return false;
  } catch {
    return false;
  }
}

export function markCustomerConfirmed(id: string, base: InvitationData, data: InvitationData): void {
  safeSet(customerConfirmedKey(id), JSON.stringify({ base, data }));
}

/* ---------- Bản lưu dữ liệu khách sửa cho link ?d= (không máy chủ) ---------- */

/** Bản khách đã sửa trên trang /khach/ ở chế độ link ?d= (không máy chủ):
    dữ liệu + câu mẫu đã sửa, kèm `base` là dữ liệu GỐC trong ?d= lúc tạo
    bản lưu. Chỉ khôi phục khi base khớp link đang mở — Nancy gửi link mới
    (cùng id, dữ liệu gốc khác) thì không bị bản cũ đè mất dữ liệu mới. */
export interface CustomerSnapshot {
  base: InvitationData;
  data: InvitationData;
  customTexts: Record<string, string>;
}

export function customerDataKey(id: string): string {
  return `td_customer_data_${id}`;
}

export function loadCustomerSnapshot(id: string): CustomerSnapshot | null {
  const parsed = safeParse<{ base?: unknown; data?: unknown; customTexts?: unknown } | null>(
    safeGet(customerDataKey(id)),
    null
  );
  if (!parsed || typeof parsed !== "object") return null;
  const base = parsed.base as InvitationData | undefined;
  const d = parsed.data as InvitationData | undefined;
  if (
    !base || typeof base !== "object" || !base.groomName || !base.brideName ||
    !d || typeof d !== "object" || !d.groomName || !d.brideName
  ) {
    return null;
  }
  const ct = parsed.customTexts;
  return { base, data: d, customTexts: ct && typeof ct === "object" ? (ct as Record<string, string>) : {} };
}

export function saveCustomerSnapshot(
  id: string,
  base: InvitationData,
  data: InvitationData,
  customTexts: Record<string, string>
): boolean {
  return safeSet(customerDataKey(id), JSON.stringify({ base, data, customTexts }));
}

/** Các trường dữ liệu khách sửa được trên form in (khóa CEP + lời mời).
    ceremonyTime đổi thì đánh dấu khối ngày lễ (ceremonyDate), time đổi thì
    đánh dấu khối ngày tiệc (date) — vì form in gộp ngày+giờ vào một khối.
    hostType không có ô riêng trên form nên không đánh dấu (dữ liệu vẫn lưu
    đúng và chảy vào ghost text). */
const DIFF_FIELDS: StdEditField[] = [
  "groomName",
  "brideName",
  "groomFather",
  "groomMother",
  "brideFather",
  "brideMother",
  "groomParentsAddress",
  "brideParentsAddress",
  "groomBirthOrder",
  "brideBirthOrder",
  "ceremonyType",
  "ceremonyVenue",
  "venue",
  "address",
  "message",
];

/** So dữ liệu đang hiển thị với dữ liệu GỐC trong ?d=, trả về các trường đã
    sửa (để hiện dấu "Đã sửa" sau khi tải lại trang). */
export function diffEditedFields(original: InvitationData, current: InvitationData): string[] {
  const out: string[] = [];
  const same = (f: keyof InvitationData) => String(original[f] ?? "") === String(current[f] ?? "");
  for (const f of DIFF_FIELDS) {
    if (!same(f)) out.push(f);
  }
  if (!same("ceremonyDate") || !same("ceremonyTime")) out.push("ceremonyDate");
  if (!same("date") || !same("time")) out.push("date");
  return out;
}

/** Hai bản dữ liệu có giống nhau ở các trường khách sửa được (+ id,
    templateId, physicalFormId) không — dùng để kiểm tra bản lưu có đúng
    link đang mở. Thiếu physicalFormId thì hiểu là form mặc định (link cũ
    chưa có trường này vẫn khớp). */
export function sameCustomerData(a: InvitationData, b: InvitationData): boolean {
  return (
    diffEditedFields(a, b).length === 0 &&
    (a.id ?? "") === (b.id ?? "") &&
    (a.templateId ?? "") === (b.templateId ?? "") &&
    (a.physicalFormId ?? DEFAULT_PHYSICAL_FORM_ID) === (b.physicalFormId ?? DEFAULT_PHYSICAL_FORM_ID)
  );
}

/** Gộp dữ liệu dán từ Illustrator vào dữ liệu đang có: giá trị RỖNG trong
    đoạn dán KHÔNG đè chữ đã có (nhiều file .ai để địa điểm tiệc dạng
    outline, không phải chữ sống, nên ghost text không mang địa điểm — dán
    chỉ đổ thêm những gì Illustrator có; chữ chị đã gõ thì giữ). Giá trị
    có chữ thì đè như cũ. id/templateId/physicalFormId không nằm trong
    đoạn dán nên luôn giữ nguyên. */
export function mergeImportedData(prev: InvitationData, imported: Partial<InvitationData>): InvitationData {
  const out: InvitationData = { ...prev };
  for (const [k, v] of Object.entries(imported)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
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
