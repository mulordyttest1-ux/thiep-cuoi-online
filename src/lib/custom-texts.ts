// Câu mẫu cố định trên thiệp chuẩn #1 (song-phung-do) mà khách được sửa lời.
// Phân biệt 2 loại chữ trên thiệp (chị chốt 2026-11-07):
//  (a) TRƯỜNG DỮ LIỆU — gắn khóa CEP / InvitationData (tên, ngày, địa chỉ...):
//      sửa thì chảy về ghost text tự động.
//  (b) CÂU MẪU CỐ ĐỊNH — chữ chuẩn của mẫu, KHÔNG gắn khóa CEP: sửa thì KHÔNG
//      vào ghost text được, phải sửa tay trong Illustrator. Những câu này
//      đánh dấu MẠNH trên thiệp (nền vàng + "cần sửa tay") và gom vào danh
//      sách "CẦN SỬA TAY TRONG ILLUSTRATOR" lúc chốt.
//
// Câu mẫu mở cho sửa — giới hạn ở câu khách hay muốn đổi lời (không mở hết
// mọi chữ cố định):
//  - ceremonyHeaderLine1: dòng đầu của tiêu đề lễ ("LỄ THÀNH HÔN ĐƯỢC CỬ
//    HÀNH TẠI"). Dòng 2 của tiêu đề là nơi làm lễ = ceremonyVenue (trường
//    dữ liệu, khóa ceremony.ten, VÀO ghost text) — xem cep.ts: ceremony.ten
//    ánh xạ sang ceremonyVenue, KHÔNG phải dòng tiêu đề. Vd của chị: khách
//    đổi dòng này thành "LỄ ĐƯỢC TỔ CHỨC TẠI" thì không vào ghost text.
//  - partyHeader: tiêu đề mục địa điểm tiệc ("TIỆC CƯỚI SẼ TỔ CHỨC TẠI").
//  - printCeremonyTitle / printPartyIntro: tiêu đề trên MẪU FORM IN
//    (PrintFormPreview) - chữ in khác chữ thiệp online nên có khóa riêng:
//    lễ in là "Hôn lễ được cử hành tại", tiệc in là câu mời dự tiệc trước
//    tên địa điểm. Sửa cũng vào danh sách sửa tay như các câu mẫu khác.
// Lời mời (data.message) không có trong danh sách này vì nó là trường
// InvitationData — nhưng message CŨNG không có khóa CEP nên sửa lời mời
// cũng vào danh sách sửa tay (buildManualList nhận message cũ/mới riêng).
//
// Giá trị câu mẫu đã sửa lưu riêng ở customTexts (khóa -> chữ mới), không
// trộn vào InvitationData hay ghost text.
import type { InvitationData } from "./types";
import type { ManualListItem } from "./access";

export interface CustomTextDef {
  key: string;
  label: string;
  defaultVi: string;
}

export const CUSTOM_TEXT_DEFS: CustomTextDef[] = [
  { key: "ceremonyHeaderLine1", label: "Tiêu đề lễ", defaultVi: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI" },
  { key: "partyHeader", label: "Tiêu đề tiệc", defaultVi: "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" },
  { key: "printCeremonyTitle", label: "Tiêu đề lễ (mẫu in)", defaultVi: "Hôn lễ được cử hành tại" },
  { key: "printPartyIntro", label: "Lời mời dự tiệc (mẫu in)", defaultVi: "Đến dự buổi tiệc chung vui cùng gia đình chúng tôi tại:" },
  // Dòng tên khách dưới "Trân trọng kính mời" trên mẫu in: mặc định trống
  // (hiện 1 hàng chấm); khách chọn "Quý Gia Đình" / "Quý Khách" / gõ khác.
  { key: "printGuestLine", label: "Tên khách mời (mẫu in)", defaultVi: "" },
  // Câu kết cuối cột tiệc trên mẫu in (mặc định "Kính mời!").
  { key: "printClosing", label: "Câu kết (mẫu in)", defaultVi: "Kính mời!" },
];

export function customTextDef(key: string): CustomTextDef | undefined {
  return CUSTOM_TEXT_DEFS.find((d) => d.key === key);
}

/** Chữ gốc của một câu mẫu: với tiêu đề lễ, lấy dòng đầu của ceremonyHeader
 *  nếu Nancy đã đặt riêng cho thiệp này; còn lại dùng mặc định của mẫu. */
export function customTextDefault(key: string, data?: InvitationData | null): string {
  const def = customTextDef(key);
  if (!def) return "";
  if (key === "ceremonyHeaderLine1") {
    const first = (data?.ceremonyHeader ?? "").split("\n")[0]?.trim();
    if (first) return first;
  }
  return def.defaultVi;
}

/** Chữ đang hiển thị của một câu mẫu: đã sửa thì lấy customTexts, chưa thì mặc định. */
export function customTextValue(
  key: string,
  customTexts: Record<string, string> | undefined,
  data?: InvitationData | null
): string {
  const v = customTexts?.[key];
  return v !== undefined ? v : customTextDefault(key, data);
}

/** Nhãn tiếng Việt cho từng trường sửa được trên trang khách (dùng cho lịch sử sửa). */
export const STD_FIELD_LABELS: Record<string, string> = {
  groomName: "Tên chú rể",
  brideName: "Tên cô dâu",
  groomFather: "Bố chú rể",
  groomMother: "Mẹ chú rể",
  brideFather: "Bố cô dâu",
  brideMother: "Mẹ cô dâu",
  groomParentsAddress: "Địa chỉ nhà trai",
  brideParentsAddress: "Địa chỉ nhà gái",
  groomBirthOrder: "Vị thứ chú rể",
  brideBirthOrder: "Vị thứ cô dâu",
  ceremonyType: "Loại lễ",
  hostType: "Nhà chủ tiệc",
  ceremonyDate: "Ngày làm lễ",
  ceremonyTime: "Giờ làm lễ",
  ceremonyVenue: "Nơi làm lễ",
  date: "Ngày tiệc",
  time: "Giờ tiệc",
  venue: "Nơi đãi tiệc",
  address: "Địa chỉ tiệc",
  message: "Lời mời",
};

export function stdFieldLabel(field: string): string {
  return STD_FIELD_LABELS[field] ?? field;
}

/** Danh sách "CẦN SỬA TAY TRONG ILLUSTRATOR": mỗi câu mẫu đã sửa ghi rõ
 *  chữ cũ -> chữ mới. Lời mời (message) đổi cũng vào đây vì message không
 *  có khóa CEP (không vào ghost text). Trả [] khi không có gì cần sửa tay. */
export function buildManualList(
  customTexts: Record<string, string> | undefined,
  data?: InvitationData | null,
  initialMessage?: string
): ManualListItem[] {
  const out: ManualListItem[] = [];
  for (const def of CUSTOM_TEXT_DEFS) {
    const cur = customTexts?.[def.key];
    if (cur === undefined) continue;
    const oldValue = customTextDefault(def.key, data);
    if (cur !== oldValue) out.push({ key: def.key, label: def.label, oldValue, newValue: cur });
  }
  if (data && initialMessage !== undefined && data.message !== initialMessage) {
    out.push({ key: "message", label: "Lời mời", oldValue: initialMessage, newValue: data.message });
  }
  return out;
}
