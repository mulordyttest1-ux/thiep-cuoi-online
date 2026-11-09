// Khối có sẵn thêm/bớt trên thiệp online — khách/Thiết kế ẩn/hiện từng
// khối thay vì thiệp lúc nào cũng bản đủ (có khách không có dress code,
// không có ảnh, không thích bản đủ).
//
// CHỈ online: hero + thông tin lễ + thông tin tiệc là LÕI, không cho ẩn.
// Việc ẩn khối không đụng dữ liệu in, không đổi khóa CEP, không hiện gì
// thêm trên form in — chỉ quyết định section nào render trong
// InvitationPreview / trang khách /thiep/[id].
import { parseDressCode, parseSchedule, type InvitationData } from "./types";
import { getTemplate } from "./templates";

export type BlockId = "album" | "countdown" | "timeline" | "dresscode" | "map" | "story";

export interface BlockDef {
  id: BlockId;
  /** Nhãn tiếng Việt, không jargon — hiện thẳng trên nút bật/tắt. */
  label: string;
  /** Mô tả ngắn cho người bật/tắt. */
  hint: string;
  /** Mẫu nào có khối này: "all" = mọi mẫu, "deco" = chỉ mẫu trang trí
   *  (Song Phụng Đỏ…), "plain" = chỉ mẫu thường (không deco). */
  appliesTo: "all" | "deco" | "plain";
}

export const BLOCKS: BlockDef[] = [
  { id: "album", label: "Album ảnh", hint: "Ảnh cưới của hai bạn", appliesTo: "all" },
  { id: "countdown", label: "Đếm ngược", hint: "Đồng hồ đếm tới ngày cưới", appliesTo: "plain" },
  { id: "timeline", label: "Lịch trình ngày cưới", hint: "Các mốc giờ trong ngày cưới", appliesTo: "all" },
  { id: "dresscode", label: "Dress code", hint: "Màu trang phục gợi ý cho khách", appliesTo: "deco" },
  { id: "map", label: "Bản đồ", hint: "Địa điểm + bản đồ tới tiệc cưới", appliesTo: "deco" },
  { id: "story", label: "Câu chuyện", hint: "Câu chuyện tình yêu của hai bạn", appliesTo: "plain" },
];

export function isDecoTemplate(templateId: string): boolean {
  return !!getTemplate(templateId).decorationImages;
}

export function blockAppliesTo(blockId: BlockId, templateId: string): boolean {
  const def = BLOCKS.find((b) => b.id === blockId);
  if (!def) return false;
  if (def.appliesTo === "all") return true;
  const deco = isDecoTemplate(templateId);
  return def.appliesTo === "deco" ? deco : !deco;
}

/** Khối có nội dung để hiện không — trống thì MẶC ĐỊNH ẨN:
 *  album không có ảnh (photoUrl), đếm ngược không có ngày, lịch trình
 *  không có dòng nào, dress code không có màu hợp lệ, bản đồ không có
 *  địa chỉ, câu chuyện trống. */
export function hasBlockContent(data: InvitationData, id: BlockId): boolean {
  switch (id) {
    case "album":
      return !!data.photoUrl?.trim();
    case "countdown":
      return !!data.date?.trim();
    case "timeline":
      return parseSchedule(data.scheduleText).length > 0;
    case "dresscode":
      return parseDressCode(data.dressCode).length > 0;
    case "map":
      return !!data.address?.trim();
    case "story":
      return !!data.story?.trim();
  }
}

/** Khối có hiện không: phải CÓ NỘI DUNG THẬT và không bị ẩn tay. Khối
 *  trống nội dung thì ẩn — kể cả khi từng được bật tay (shownBlocks là
 *  trường cũ chỉ để đọc dữ liệu đã lưu, isBlockVisible bỏ qua nó; bật
 *  khối trống chỉ gỡ ẩn, khối chỉ hiện khi khách thêm nội dung vào).
 *  Dữ liệu cũ không có 2 trường này = hiện theo nội dung (trừ khối trống
 *  thì ẩn). */
export function isBlockVisible(data: InvitationData, id: BlockId): boolean {
  if (data.hiddenBlocks?.includes(id)) return false;
  return hasBlockContent(data, id);
}

/** Bật/tắt 1 khối, trả về patch {hiddenBlocks, shownBlocks} để onPatch.
 *  Tắt khối đang hiện -> ghi vào hiddenBlocks; bật khối đang ẩn -> chỉ gỡ
 *  khỏi hiddenBlocks (và dọn shownBlocks cũ nếu có) — KHÔNG sinh giá trị
 *  mới vào shownBlocks: khối trống nội dung vẫn ẩn cho tới khi khách thêm
 *  nội dung thật vào. */
export function toggleBlockPatch(data: InvitationData, id: BlockId): {
  hiddenBlocks: string[];
  shownBlocks: string[];
} {
  const hidden = (data.hiddenBlocks ?? []).filter((b) => b !== id);
  const shown = (data.shownBlocks ?? []).filter((b) => b !== id);
  if (isBlockVisible(data, id)) hidden.push(id);
  return { hiddenBlocks: hidden, shownBlocks: shown };
}

/** Đặt lại về mặc định (xóa cả 2 danh sách tay). */
export function resetBlocksPatch(): { hiddenBlocks: string[]; shownBlocks: string[] } {
  return { hiddenBlocks: [], shownBlocks: [] };
}
