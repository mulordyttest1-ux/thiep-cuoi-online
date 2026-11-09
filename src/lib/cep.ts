// Nối hai chiều với CEP "Wedding Scripter" trong Adobe Illustrator — CHỈ
// phía app web (không động vào project CEP). Cơ chế đọc từ code CEP
// (js/logic/pipeline/StatefulMarkerCodec.js, jsx/illustrator.jsx,
// js/logic/pipeline/DataValidator.js, commit 571e580):
// - Ký tự ghost là U+200B (ZERO WIDTH SPACE, "\u200B"). KHÔNG BAO GIỜ dùng
//   U+300B (ký tự nhìn thấy được, CEP không nhận).
// - Mỗi giá trị được bọc: marker + giá trị (đã xóa U+200B bên trong) +
//   marker. Giá trị rỗng bọc thành "\u200B\u200B". Xuống dòng giữ nguyên.
// - Các cặp marker ghép với mảng keys theo VỊ TRÍ (keys[i] ↔ cặp thứ i).
//   Sai số lượng = hỏng, không đoán.
// - Metadata = JSON {"type":"stateful","keys":[...],"mappings":[]} lưu trong
//   TextFrame.note của Illustrator; mappings luôn [].
// - "(+)" trong tên do người dùng tự gõ — giữ nguyên trong giá trị, không
//   có cờ "đã mất" nào.
import type { InvitationData } from "./types";
import { getDateParts, getLunarParts } from "./lunar";

export const CEP_MARKER = "\u200B";

/** Các khóa của CEP, ĐÚNG THỨ TỰ này (lấy từ JSON stateful của mẫu).
    ĐẾM ĐƯỢC 32 KHÓA — mô tả ban đầu nói 31 là đếm thiếu; danh sách này
    mới là chuẩn (pos1 5 + pos2 5 + ten_le 1 + ceremony.ten 1 + le 9 +
    venue 2 + tiec 9 = 32). */
export const CEP_KEYS: string[] = [
  "info.ten_le",
  "pos1.ong", "pos1.ba", "pos1.diachi", "pos1.con_full", "pos1.vithu",
  "pos2.ong", "pos2.ba", "pos2.diachi", "pos2.con_full", "pos2.vithu",
  "ceremony.ten",
  "date.le.gio", "date.le.phut", "date.le.thu", "date.le.ngay", "date.le.thang", "date.le.nam",
  "date.le.ngay_al", "date.le.thang_al", "date.le.nam_al",
  "venue.ten", "venue.diachi",
  "date.tiec.gio", "date.tiec.phut", "date.tiec.thu", "date.tiec.ngay", "date.tiec.thang", "date.tiec.nam",
  "date.tiec.ngay_al", "date.tiec.thang_al", "date.tiec.nam_al",
];

export const CEREMONY_TYPES = ["Thành Hôn", "Vu Quy", "Tân Hôn", "Báo Hỷ"] as const;
export type CeremonyType = (typeof CEREMONY_TYPES)[number];
export const HOST_TYPES = ["Nhà Trai", "Nhà Gái"] as const;
export type HostType = (typeof HOST_TYPES)[number];

/** Khóa năm 2 chữ số dẫn xuất: date.<nhóm>.namyy — KHÔNG phải lỗi chính tả.
    Một số mẫu dùng định dạng năm 2 chữ số cuối ("26" thay vì "2026").
    Khóa dẫn xuất từ date.<nhóm>.nam — KHÔNG thuộc 32 khóa CEP (thứ tự
    ghost text giữ nguyên 32). Khái quát theo mẫu *.namyy (cả date.le.namyy). */
export function isNamyyKey(key: string): boolean {
  return /^date\.(le|tiec)\.namyy$/.test(key);
}

export function namyyGroup(key: string): "le" | "tiec" | null {
  const m = /^date\.(le|tiec)\.namyy$/.exec(key);
  return m ? (m[1] as "le" | "tiec") : null;
}

/** Đọc giá trị khung namyy thành năm 4 chữ số: "26" → 2026; "2026" → 2026. */
export function resolveNamyyYear(raw: string | undefined | null): string {
  const v = (raw ?? "").trim();
  if (/^\d{2}$/.test(v)) return `20${v}`;
  if (/^\d{4}$/.test(v)) return v;
  return "";
}

/** Ghi năm vào khung namyy, giữ nguyên số chữ số như giá trị gốc trong khung:
    gốc 2 chữ số → "26"; gốc 4 chữ số → "2026". */
export function formatNamyyYear(year4: string, original: string | undefined | null): string {
  const y = (year4 ?? "").trim();
  const orig = (original ?? "").trim();
  if (/^\d{4}$/.test(y) && /^\d{2}$/.test(orig)) return y.slice(2);
  return y;
}

function isCeremonyType(v: string): v is CeremonyType {
  return (CEREMONY_TYPES as readonly string[]).includes(v);
}

/** Chuỗi metadata một dòng, để dán vào note của text frame. */
export function buildCepMetadataJson(keys: string[] = CEP_KEYS): string {
  return JSON.stringify({ type: "stateful", keys: [...keys], mappings: [] });
}

/** Bọc một giá trị: marker + giá trị (xóa U+200B bên trong) + marker. */
export function wrapValue(value: string | undefined | null, marker: string = CEP_MARKER): string {
  const clean = String(value ?? "").split(marker).join("");
  return marker + clean + marker;
}

export interface MarkerMatch {
  start: number;
  end: number;
  inner: string;
}

/** Quét các cặp marker theo thứ tự xuất hiện (y hệt
    StatefulMarkerCodec.extractMatches: cặp kề nhau = giá trị rỗng;
    marker lẻ cuối chuỗi không có cặp đóng thì dừng). Giá trị trích ra được
    chuẩn hoá NFC: Illustrator hay xuất dấu RỜI (ký tự gốc + dấu kết hợp,
    vd "Tra\u0300n") mà trình duyệt render vỡ dấu — về dạng gộp chuẩn
    ("Trần") ngay lúc trích; giá trị đã đúng NFC thì không đổi gì. */
export function extractMatches(text: string, marker: string = CEP_MARKER): MarkerMatch[] {
  const matches: MarkerMatch[] = [];
  let i = 0;
  while (true) {
    const start = text.indexOf(marker, i);
    if (start === -1) break;
    if (text[start + 1] === marker) {
      matches.push({ start, end: start + 2, inner: "" });
      i = start + 2;
    } else {
      const end = text.indexOf(marker, start + 1);
      if (end === -1) break;
      matches.push({ start, end: end + 1, inner: text.slice(start + 1, end).normalize("NFC") });
      i = end + 1;
    }
  }
  return matches;
}

export function extractValues(text: string, marker: string = CEP_MARKER): string[] {
  return extractMatches(text, marker).map((m) => m.inner);
}

/** Y hệt StatefulMarkerCodec.extractValuesForKeys: không có cặp nào và chỉ
    có 1 khóa → trả toàn bộ chuỗi; số cặp = số khóa → trả các giá trị theo
    thứ tự; còn lại → [] (hỏng). */
export function extractValuesForKeys(text: string, keys: string[], marker: string = CEP_MARKER): string[] {
  const matches = extractMatches(text, marker);
  if (matches.length === 0 && keys.length === 1) return [text];
  if (matches.length === keys.length) return matches.map((m) => m.inner);
  return [];
}

export interface CepFamilySide {
  ong: string;
  ba: string;
  diachi: string;
  con_full: string;
  vithu: string;
}

export interface CepDateParts {
  gio: string;
  phut: string;
  thu: string;
  ngay: string;
  thang: string;
  nam: string;
  ngay_al: string;
  thang_al: string;
  nam_al: string;
}

export interface CepBlockData {
  ten_le: string;
  pos1: CepFamilySide;
  pos2: CepFamilySide;
  ceremonyTen: string;
  le: CepDateParts;
  tiec: CepDateParts;
  venueTen: string;
  venueDiachi: string;
}

/** Ngày lễ mặc định = ngày tiệc khi không nhập riêng. */
export function effectiveCeremonyDate(data: InvitationData): string {
  return data.ceremonyDate?.trim() ? data.ceremonyDate : data.date;
}

/** Giờ lễ mặc định = giờ tiệc khi không nhập riêng. */
export function effectiveCeremonyTime(data: InvitationData): string {
  return data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
}

/** pos1 = nhà chủ tiệc. Luật của CEP: lễ Vu Quy hoặc nhà gái chủ tiệc thì
    pos1 = nhà gái, pos2 = nhà trai; còn lại pos1 = nhà trai, pos2 = nhà gái. */
export function isBrideHost(data: InvitationData): boolean {
  return data.ceremonyType === "Vu Quy" || data.hostType === "Nhà Gái";
}

function splitTime(time: string): { gio: string; phut: string } {
  const m = /^(\d{1,2}):(\d{2})/.exec(time || "");
  if (!m) return { gio: "", phut: "" };
  return { gio: m[1].padStart(2, "0"), phut: m[2] };
}

function cepDateParts(dateStr: string, timeStr: string): CepDateParts {
  const empty: CepDateParts = {
    gio: "", phut: "", thu: "", ngay: "", thang: "", nam: "",
    ngay_al: "", thang_al: "", nam_al: "",
  };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  if (!m) return { ...empty, ...splitTime(timeStr) };
  const parts = getDateParts(dateStr);
  const lunar = getLunarParts(dateStr);
  return {
    ...splitTime(timeStr),
    thu: parts?.weekday ?? "",
    ngay: m[3],
    thang: m[2],
    nam: m[1],
    ngay_al: lunar ? String(lunar.day).padStart(2, "0") : "",
    thang_al: lunar ? String(Math.abs(lunar.month)).padStart(2, "0") : "",
    nam_al: lunar ? lunar.yearName : "",
  };
}

export function buildCepBlockData(data: InvitationData): CepBlockData {
  const brideHost = isBrideHost(data);
  const groomSide: CepFamilySide = {
    ong: data.groomFather ?? "",
    ba: data.groomMother ?? "",
    diachi: data.groomParentsAddress ?? "",
    con_full: data.groomName ?? "",
    vithu: data.groomBirthOrder ?? "",
  };
  const brideSide: CepFamilySide = {
    ong: data.brideFather ?? "",
    ba: data.brideMother ?? "",
    diachi: data.brideParentsAddress ?? "",
    con_full: data.brideName ?? "",
    vithu: data.brideBirthOrder ?? "",
  };
  return {
    ten_le: data.ceremonyType || "Thành Hôn",
    pos1: brideHost ? brideSide : groomSide,
    pos2: brideHost ? groomSide : brideSide,
    ceremonyTen: data.ceremonyVenue ?? "",
    le: cepDateParts(effectiveCeremonyDate(data), effectiveCeremonyTime(data)),
    tiec: cepDateParts(data.date, data.time),
    venueTen: data.venue ?? "",
    venueDiachi: data.address ?? "",
  };
}

/** Các giá trị theo đúng thứ tự CEP_KEYS. */
export function buildCepValues(data: InvitationData): { keys: string[]; values: string[] } {
  const b = buildCepBlockData(data);
  const values = [
    b.ten_le,
    b.pos1.ong, b.pos1.ba, b.pos1.diachi, b.pos1.con_full, b.pos1.vithu,
    b.pos2.ong, b.pos2.ba, b.pos2.diachi, b.pos2.con_full, b.pos2.vithu,
    b.ceremonyTen,
    b.le.gio, b.le.phut, b.le.thu, b.le.ngay, b.le.thang, b.le.nam,
    b.le.ngay_al, b.le.thang_al, b.le.nam_al,
    b.venueTen, b.venueDiachi,
    b.tiec.gio, b.tiec.phut, b.tiec.thu, b.tiec.ngay, b.tiec.thang, b.tiec.nam,
    b.tiec.ngay_al, b.tiec.thang_al, b.tiec.nam_al,
  ];
  return { keys: [...CEP_KEYS], values };
}

const SEP = "------------------------------------------"; // 42 gạch, như mẫu

function conLine(conFull: string, vithu: string, ghost: boolean): string {
  const w = (v: string) => (ghost ? wrapValue(v) : v ?? "");
  // "(vị thứ)" chỉ hiện khi có thứ bậc; ở bản ghost, cặp bọc rỗng vẫn phải
  // có mặt để đủ 32 cặp (nó vô hình nên không làm bẩn chữ nhìn thấy).
  if (vithu.trim()) return `con:${w(conFull)} (${w(vithu)})`;
  return ghost ? `con:${w(conFull)} ${w(vithu)}` : `con:${w(conFull)}`;
}

function familyBlock(side: CepFamilySide, ghost: boolean): string {
  const w = (v: string) => (ghost ? wrapValue(v) : v ?? "");
  return [
    "gia đình:",
    w(side.ong),
    w(side.ba),
    `địa chỉ:${w(side.diachi)}`,
    conLine(side.con_full, side.vithu, ghost),
  ].join("\n");
}

function renderBlock(b: CepBlockData, ghost: boolean): string {
  const w = (v: string) => (ghost ? wrapValue(v) : v ?? "");
  const le = b.le;
  const tiec = b.tiec;
  const leLine = `cử hành tại ${w(b.ceremonyTen)} vào lúc ${w(le.gio)}'${w(le.phut)} - ${w(le.thu)} ${w(le.ngay)}.${w(le.thang)}.${w(le.nam)} (nhằm ${w(le.ngay_al)}.${w(le.thang_al)} năm ${w(le.nam_al)})`;
  const tiecLine = `tiệc tại ${w(b.venueTen)} ĐC: ${w(b.venueDiachi)} vào lúc: ${w(tiec.gio)}'${w(tiec.phut)} - ${w(tiec.thu)} ${w(tiec.ngay)}.${w(tiec.thang)}.${w(tiec.nam)} (nhằm ${w(tiec.ngay_al)}.${w(tiec.thang_al)} năm ${w(tiec.nam_al)})`;
  return [
    `Lễ ${w(b.ten_le)}`,
    familyBlock(b.pos1, ghost),
    SEP,
    familyBlock(b.pos2, ghost),
    SEP,
    leLine,
    tiecLine,
    SEP,
    "Quý khách hàng vui lòng kiểm tra kỹ: Nội dung, lỗi chính tả trên bản Thiết kế.",
    "Xin cảm ơn",
  ].join("\n");
}

/** Khối chữ có mã ẩn — dán vào text frame trong Illustrator. */
export function buildCepTextBlock(data: InvitationData): string {
  return renderBlock(buildCepBlockData(data), true);
}

/** Khối chữ thường, cùng bố cục — dán vào ô nhập của panel CEP / để khách
    kiểm tra chính tả. */
export function buildCepPlainText(data: InvitationData): string {
  return renderBlock(buildCepBlockData(data), false);
}

export type CepImportResult =
  | { ok: true; data: Partial<InvitationData> }
  | { ok: false; error: string };

function timeFromParts(gio: string, phut: string): string | undefined {
  const g = (gio ?? "").trim();
  const p = (phut ?? "").trim();
  if (!g || !p || !/^\d{1,2}$/.test(g) || !/^\d{1,2}$/.test(p)) return undefined;
  const gg = Number(g);
  const pp = Number(p);
  if (gg > 23 || pp > 59) return undefined;
  return `${String(gg).padStart(2, "0")}:${String(pp).padStart(2, "0")}`;
}

function dateFromParts(ngay: string, thang: string, nam: string): string | undefined {
  const d = (ngay ?? "").trim();
  const m = (thang ?? "").trim();
  const y = (nam ?? "").trim();
  if (!d || !m || !y || !/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return undefined;
  const dd = Number(d);
  const mm = Number(m);
  const yy = Number(y);
  const dt = new Date(yy, mm - 1, dd);
  if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return undefined;
  return `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Đổ các giá trị đã tách (map khóa → giá trị) về các trường của thiệp.
    LƯU Ý: 32 khóa KHÔNG có host_type — bên chủ tiệc chỉ suy ra được từ
    loại lễ: "Vu Quy" thì nhà gái chủ tiệc, còn lại mặc định nhà trai. Một
    thiệp "Thành Hôn" nhưng nhà gái chủ tiệc khi nhập về sẽ đọc thành nhà
    trai — sửa lại bằng tay ở mục "Nhà chủ tiệc" sau khi nhập. Ngày âm
    (ngay_al/thang_al/nam_al) và thứ trong tuần được tính lại từ ngày dương
    nên nhập về sẽ bỏ qua. */
export function cepValuesToData(values: Record<string, string>): Partial<InvitationData> {
  const v = (k: string) => values[k] ?? "";
  const tenLe = v("info.ten_le").trim();
  const brideHost = tenLe === "Vu Quy";
  const pos1 = { ong: v("pos1.ong"), ba: v("pos1.ba"), diachi: v("pos1.diachi"), con: v("pos1.con_full"), vithu: v("pos1.vithu") };
  const pos2 = { ong: v("pos2.ong"), ba: v("pos2.ba"), diachi: v("pos2.diachi"), con: v("pos2.con_full"), vithu: v("pos2.vithu") };
  const groom = brideHost ? pos2 : pos1;
  const bride = brideHost ? pos1 : pos2;
  const out: Partial<InvitationData> = {
    groomFather: groom.ong,
    groomMother: groom.ba,
    groomParentsAddress: groom.diachi,
    groomName: groom.con,
    groomBirthOrder: groom.vithu,
    brideFather: bride.ong,
    brideMother: bride.ba,
    brideParentsAddress: bride.diachi,
    brideName: bride.con,
    brideBirthOrder: bride.vithu,
    ceremonyVenue: v("ceremony.ten"),
    venue: v("venue.ten"),
    address: v("venue.diachi"),
  };
  if (isCeremonyType(tenLe)) out.ceremonyType = tenLe;
  out.hostType = brideHost ? "Nhà Gái" : "Nhà Trai";
  // Năm có thể nằm ở khóa dẫn xuất namyy (năm 2 chữ số "26" = 2026):
  // chỉ dùng khi khóa nam 4 chữ số vắng mặt.
  const leNam = v("date.le.nam") || resolveNamyyYear(v("date.le.namyy"));
  const tiecNam = v("date.tiec.nam") || resolveNamyyYear(v("date.tiec.namyy"));
  const leDate = dateFromParts(v("date.le.ngay"), v("date.le.thang"), leNam);
  const leTime = timeFromParts(v("date.le.gio"), v("date.le.phut"));
  if (leDate) out.ceremonyDate = leDate;
  if (leTime) out.ceremonyTime = leTime;
  const tiecDate = dateFromParts(v("date.tiec.ngay"), v("date.tiec.thang"), tiecNam);
  const tiecTime = timeFromParts(v("date.tiec.gio"), v("date.tiec.phut"));
  if (tiecDate) out.date = tiecDate;
  if (tiecTime) out.time = tiecTime;
  return out;
}

/** Nhập đoạn chữ có mã ẩn copy từ Illustrator. Nếu có dán kèm metadata thì
    dùng đúng thứ tự khóa trong đó, không thì dùng 32 khóa chuẩn. Sai số
    lượng thì báo rõ và không điền gì cả. */
export function parseCepGhostText(pasted: string, metadataJson?: string): CepImportResult {
  let keys = CEP_KEYS;
  const metaRaw = (metadataJson ?? "").trim();
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as { type?: string; keys?: unknown };
      if (
        !meta ||
        !Array.isArray(meta.keys) ||
        meta.keys.length === 0 ||
        !meta.keys.every((k) => typeof k === "string" && k.length > 0)
      ) {
        return { ok: false, error: "Metadata không đọc được: cần chuỗi JSON {\"type\":\"stateful\",\"keys\":[...]}." };
      }
      keys = meta.keys as string[];
    } catch {
      return { ok: false, error: "Metadata không đọc được: chuỗi JSON không hợp lệ." };
    }
  }
  const found = extractValues(pasted);
  const values = extractValuesForKeys(pasted, keys);
  if (values.length === 0) {
    return {
      ok: false,
      error: `Đếm được ${found.length} giá trị, cần ${keys.length}. Kiểm tra lại đoạn đã copy từ Illustrator (phải là đoạn có mã ẩn U+200B, copy nguyên cả đoạn trong text frame).`,
    };
  }
  const map: Record<string, string> = {};
  keys.forEach((k, i) => {
    map[k] = values[i] ?? "";
  });
  return { ok: true, data: cepValuesToData(map) };
}

const CEREMONY_RE =
  /^cử hành tại (.*?) vào lúc (\d{1,2})'(\d{2}) - (.+?) (\d{1,2})\.(\d{1,2})\.(\d{4})(?: \(nhằm .*\))?$/;
const PARTY_RE =
  /^tiệc tại (.*?) ĐC: ([\s\S]*?) vào lúc: (\d{1,2})'(\d{2}) - (.+?) (\d{1,2})\.(\d{1,2})\.(\d{4})(?: \(nhằm .*\))?$/;
const DASH_LINE = /^-{10,}\s*$/;

function parseFamilyBlock(lines: string[]): CepFamilySide | null {
  if (lines.length < 5 || lines[0].trim() !== "gia đình:") return null;
  const addrFirst = lines[3] ?? "";
  if (!addrFirst.startsWith("địa chỉ:")) return null;
  const conIdx = lines.findIndex((l, i) => i >= 4 && l.startsWith("con:"));
  if (conIdx === -1) return null;
  const addrLines = [addrFirst.slice("địa chỉ:".length), ...lines.slice(4, conIdx)];
  const conLine = lines[conIdx].slice("con:".length);
  const m = /^(.*?)(?: \(([^)]*)\))?$/.exec(conLine);
  if (!m) return null;
  return {
    ong: lines[1] ?? "",
    ba: lines[2] ?? "",
    diachi: addrLines.join("\n"),
    con_full: m[1] ?? "",
    vithu: m[2] ?? "",
  };
}

/** Nhập khối chữ thường (cùng bố cục với khối xuất) — tách nghiêm ngặt theo
    từng dòng/nhãn; đọc không được chỗ nào thì báo rõ chỗ đó. */
export function parseCepPlainText(pasted: string): CepImportResult {
  // Chuẩn hoá NFC toàn bộ text đầu vào (dấu rời → dạng gộp) trước khi tách,
  // rồi gỡ các ký tự vô hình (marker U+200B của ghost text và các ký tự
  // định dạng zero-width khác: U+200C/U+200D/U+FEFF). Đoạn dán có marker
  // bọc từng giá trị thì regex ngày/giờ mới khớp — marker nằm giữa số và
  // dấu (' / .) làm hỏng \d{1,2}'\d{2} hay \d{1,2}\.\d{1,2}\.\d{4}.
  // Dấu ’ cong (U+2019 — Illustrator hay xuất dạng này trong "09’00")
  // cũng về dấu ' ASCII trước khi regex chạy, nếu không cả khối lễ/tiệc
  // đều không đọc được. Mỗi dòng cũng trim trước khi xử lý (dòng
  // "con:… (Út Nam) " có dấu cách cuối làm regex vị thứ không tách được
  // → tên dính cả "(Út Nam)").
  const text = (pasted ?? "")
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/[\u2018\u2019\u2032\u02BC]/g, "'")
    .trim();
  if (!text) return { ok: false, error: "Chưa dán khối chữ nào." };
  const blocks: string[][] = [[]];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (DASH_LINE.test(line)) {
      blocks.push([]);
    } else {
      blocks[blocks.length - 1].push(line);
    }
  }
  const nonEmpty = blocks
    .map((b) => b.filter((l) => l.trim() !== ""))
    .filter((b) => b.length > 0);
  if (nonEmpty.length < 3) {
    return { ok: false, error: "Không đọc được khối chữ: thiếu mục gia đình hoặc dòng lễ/tiệc." };
  }
  const first = nonEmpty[0];
  if (!first[0].startsWith("Lễ ")) {
    return { ok: false, error: "Không đọc được dòng đầu: phải bắt đầu bằng “Lễ …” (VD: Lễ Vu Quy)." };
  }
  const tenLe = first[0].slice("Lễ ".length).trim();
  const pos1 = parseFamilyBlock(first.slice(1));
  if (!pos1) return { ok: false, error: "Không đọc được mục gia đình thứ nhất (cần: gia đình / tên / tên / địa chỉ: / con: …)." };
  const pos2 = parseFamilyBlock(nonEmpty[1]);
  if (!pos2) return { ok: false, error: "Không đọc được mục gia đình thứ hai (cần: gia đình / tên / tên / địa chỉ: / con: …)." };
  const eventLines = nonEmpty[2];
  const ceremony = CEREMONY_RE.exec(eventLines[0] ?? "");
  if (!ceremony) {
    return { ok: false, error: "Không đọc được dòng lễ: cần dạng “cử hành tại … vào lúc 19'15 - Thứ Sáu 30.10.2026 (nhằm …)”." };
  }
  const partyText = eventLines.slice(1).join("\n");
  const party = PARTY_RE.exec(partyText);
  if (!party) {
    return { ok: false, error: "Không đọc được dòng tiệc: cần dạng “tiệc tại … ĐC: … vào lúc: 11'00 - Chủ Nhật 01.11.2026 (nhằm …)”." };
  }
  const map: Record<string, string> = {
    "info.ten_le": tenLe,
    "pos1.ong": pos1.ong, "pos1.ba": pos1.ba, "pos1.diachi": pos1.diachi,
    "pos1.con_full": pos1.con_full, "pos1.vithu": pos1.vithu,
    "pos2.ong": pos2.ong, "pos2.ba": pos2.ba, "pos2.diachi": pos2.diachi,
    "pos2.con_full": pos2.con_full, "pos2.vithu": pos2.vithu,
    "ceremony.ten": ceremony[1] ?? "",
    "date.le.gio": ceremony[2] ?? "", "date.le.phut": ceremony[3] ?? "",
    "date.le.ngay": ceremony[5] ?? "", "date.le.thang": ceremony[6] ?? "", "date.le.nam": ceremony[7] ?? "",
    "venue.ten": party[1] ?? "", "venue.diachi": party[2] ?? "",
    "date.tiec.gio": party[3] ?? "", "date.tiec.phut": party[4] ?? "",
    "date.tiec.ngay": party[6] ?? "", "date.tiec.thang": party[7] ?? "", "date.tiec.nam": party[8] ?? "",
  };
  return { ok: true, data: cepValuesToData(map) };
}

/** Các trường địa điểm dễ mất khi dán từ Illustrator: nơi làm lễ / nơi
    tổ chức tiệc / địa chỉ tiệc trong file .ai hay là chữ outline (không
    phải chữ sống) nên ghost text không có marker cho chúng — đọc ghost
    thì ra rỗng, đọc chữ thường thì có. */
const GHOST_PLAIN_FILLABLE = ["ceremonyVenue", "venue", "address"] as const;

export interface CepGhostImport {
  result: CepImportResult;
  /** true khi đã dùng chữ thường để bù (một phần hoặc toàn bộ). */
  usedPlainFallback: boolean;
  /** Các trường đã bù từ chữ thường. */
  filledFields: string[];
}

/** Đọc đoạn dán từ Illustrator: ưu tiên ghost text (có marker U+200B).
    Chỗ nào ghost thiếu thì bù bằng khối chữ thường đọc được trong cùng
    đoạn dán — kể cả khi ghost hỏng hẳn vì sai số lượng marker (địa điểm
    .ai outline hiện chữ nhưng không có marker nên ghost đếm thiếu).
    Chỉ bù trường trống, không đè giá trị ghost đã có. */
export function parseCepGhostTextWithPlainFallback(
  pasted: string,
  metadataJson?: string
): CepGhostImport {
  const ghost = parseCepGhostText(pasted, metadataJson);
  if (ghost.ok) {
    const filled: string[] = [];
    const hasEmpty = Object.values(ghost.data).some(
      (v) => typeof v === "string" && !v.trim()
    );
    if (hasEmpty) {
      const plain = parseCepPlainText(pasted);
      if (plain.ok) {
        for (const [k, v] of Object.entries(plain.data)) {
          if (typeof v !== "string" || !v.trim()) continue;
          const cur = (ghost.data as Record<string, unknown>)[k];
          if (typeof cur !== "string" || !cur.trim()) {
            (ghost.data as Record<string, unknown>)[k] = v;
            filled.push(k);
          }
        }
      }
    }
    return { result: ghost, usedPlainFallback: filled.length > 0, filledFields: filled };
  }
  // Ghost không đọc được (sai số lượng marker): đọc thẳng bằng chữ thường.
  const plain = parseCepPlainText(pasted);
  if (plain.ok) {
    const filled = GHOST_PLAIN_FILLABLE.filter((f) =>
      (plain.data[f] as string | undefined)?.trim()
    );
    return { result: plain, usedPlainFallback: true, filledFields: filled };
  }
  return { result: ghost, usedPlainFallback: false, filledFields: [] };
}
