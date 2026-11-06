// Điểm nối logic CEP "Wedding Scripter" của chị — GIAI ĐOẠN 2 sẽ thay ruột
// bằng code thật của chị, KHÔNG sửa UI.
//
// Bản code CEP thật đã về máy (chỉ đọc):
//   ~/workspace/cep-source/adobe-illustrator-extensions-source-backup-main/
//   wedding-cep/cep/ — commit ace8b82 (15/10/2026, mới hơn bản 571e580).
// Đối chiếu từng hàm với module thật (tên + đầu vào/đầu ra giữ đúng để
// giai đoạn 2 chỉ việc thay ruột):
//   normalizeName     <- StringUtils.toProperCase   (js/logic/core/string.js)
//                        + clean() (gộp khoảng trắng, trim)
//   suggestAddress    <- AddressAutocomplete        (js/logic/ux/AddressAutocomplete.js)
//                        + dữ liệu data/vn_address.json
//   parseDateTime     <- DateHeuristicParser        (js/logic/parsers/DateHeuristicParser.js)
//                        + TimeStrictParser          (js/logic/parsers/TimeStrictParser.js)
//                        + DateUtils.parseDate       (js/logic/core/date.js)
//   validateData      <- DataValidator              (js/logic/pipeline/DataValidator.js)
//                        + Normalizer                (js/logic/pipeline/normalizer.js)
//   swapInvitationSides <- runSwapInvitationSides   (js/logic/use-cases/swapInvitationSides.js)
//                        (đổi pos1.* ↔ pos2.*, giữ nguyên pos1.vithu/pos2.vithu
//                        theo PRESERVED_KEYS; dữ liệu địa chỉ data/vn_address.json,
//                        tên thánh data/saint_names.json, họ data/common_surnames.json,
//                        chính tả data/spelling/, địa điểm data/venues.json)
//   Đầu vào của InputEngine (js/logic/ux/InputEngine.js — createInputEngine):
//   name/person_name/venue_name/address dùng chung bộ normalizer +
//   validator + gợi ý địa chỉ — UI tap-to-edit gọi đúng các hàm dưới đây.
//
// GIAI ĐOẠN 1 (bản dùng được): ruột hàm là cách đơn giản, an toàn — chữ
// thường + logic đã có trong cep.ts/lunar.ts. Không bịa logic mới, không
// chặn bản dùng được vì thiếu file thật.
import { getDateParts } from "../lunar";
import type { InvitationData } from "../types";

/** Chuẩn hoá tên: gộp khoảng trắng + viết hoa chữ cái đầu mỗi từ.
    Giai đoạn 2: thay bằng StringUtils.toProperCase (core/string.js). */
export function normalizeName(name: string): string {
  if (!name || typeof name !== "string") return "";
  const cleaned = name.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Gợi ý địa chỉ theo tiền tố khách đang gõ.
    Giai đoạn 1: chưa có dữ liệu địa chỉ trong app web → trả [] (UI chỉ hiện
    gợi ý khi có kết quả, nên giai đoạn 2 tự sáng lên).
    Giai đoạn 2: thay bằng AddressAutocomplete (ux/AddressAutocomplete.js)
    + data/vn_address.json. */
export function suggestAddress(_prefix: string): string[] {
  void _prefix;
  return [];
}

/** Parse ngày/giờ khách gõ tự do: "30.10.2026", "30/10/2026", "2026-10-30",
    kèm giờ "19:15" / "19h15" / "19'15". Trả { date: "YYYY-MM-DD",
    time: "HH:MM" } (thiếu phần nào thì bỏ phần đó); ngày không có thật
    thì trả null.
    Giai đoạn 2: thay bằng DateHeuristicParser + TimeStrictParser
    (parsers/) + DateUtils.parseDate (core/date.js). */
export function parseDateTime(text: string): { date?: string; time?: string } | null {
  if (!text || typeof text !== "string") return null;
  const s = text.trim();
  if (!s) return null;
  let date: string | undefined;
  let time: string | undefined;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  const dmy = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(s);
  const pick = (y: number, m: number, d: number): string | undefined => {
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return undefined;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  if (iso) date = pick(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  else if (dmy) date = pick(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  const tm = /(\d{1,2})[:h'](\d{2})/.exec(s);
  if (tm) {
    const hh = Number(tm[1]);
    const mm = Number(tm[2]);
    if (hh <= 23 && mm <= 59) time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  if (!date && !time) return null;
  if ((iso || dmy) && !date) return null; // có dạng ngày nhưng ngày sai thật
  return { date, time };
}

/** Kiểm tra dữ liệu trước khi chốt: tên hai bên, ngày/giờ lễ + tiệc hợp lệ,
    nơi làm lễ / nơi tiệc có ghi.
    Giai đoạn 2: thay bằng DataValidator (pipeline/DataValidator.js). */
export function validateData(data: InvitationData): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.groomName?.trim()) errors.push("Chưa nhập tên chú rể.");
  if (!data.brideName?.trim()) errors.push("Chưa nhập tên cô dâu.");
  if (!data.date || !getDateParts(data.date)) errors.push("Ngày tiệc chưa hợp lệ — chọn lại trên lịch.");
  if (!data.time || !/^\d{2}:\d{2}$/.test(data.time)) errors.push("Giờ tiệc chưa hợp lệ — chọn lại giờ.");
  const leDate = data.ceremonyDate?.trim() ? data.ceremonyDate : data.date;
  const leTime = data.ceremonyTime?.trim() ? data.ceremonyTime : data.time;
  if (!leDate || !getDateParts(leDate)) errors.push("Ngày làm lễ chưa hợp lệ — chọn lại trên lịch.");
  if (!leTime || !/^\d{2}:\d{2}$/.test(leTime)) errors.push("Giờ làm lễ chưa hợp lệ — chọn lại giờ.");
  if (!data.ceremonyVenue?.trim()) errors.push("Chưa nhập nơi làm lễ.");
  if (!data.venue?.trim()) errors.push("Chưa nhập nơi tổ chức tiệc.");
  return { ok: errors.length === 0, errors };
}

/** Đổi bên chủ tiệc trong map khóa CEP: pos1.* ↔ pos2.*, GIỮ NGUYÊN vị thứ
    (pos1.vithu/pos2.vithu) — đúng PRESERVED_KEYS của runSwapInvitationSides.
    Giai đoạn 1: UI chưa dùng trực tiếp (đổi bên đi qua hostType +
    buildCepValues); để sẵn cho giai đoạn 2.
    Giai đoạn 2: thay bằng runSwapInvitationSides
    (use-cases/swapInvitationSides.js). */
export function swapInvitationSides(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...values };
  const swapPair = (a: string, b: string) => {
    const tmp = out[a];
    out[a] = out[b] ?? "";
    out[b] = tmp ?? "";
  };
  for (const suffix of ["ong", "ba", "diachi", "con_full"]) {
    swapPair(`pos1.${suffix}`, `pos2.${suffix}`);
  }
  // vithu KHÔNG đổi bên (PRESERVED_KEYS) — vị thứ gắn với người, không gắn với bên.
  return out;
}
