/** Form vật lý (in) — danh sách form in chuẩn Nancy dùng cho thiệp vật lý.
 *
 * Khác mẫu online (templateId): thiệp vật lý KHÔNG chọn mẫu online, chỉ
 * chọn form vật lý để đổ dữ liệu vào rồi gửi link cho khách sửa. Hiện chỉ
 * có 1 form (mẫu in chuẩn #1, form lễ/tiệc 2 cột theo file mau_chuan.svg).
 * Thêm form mới chỉ cần thêm 1 dòng vào PHYSICAL_FORMS — trang /tao-thiep
 * (mục "Form vật lý") và trang khách (PrintFormPreview theo form id) đều
 * đọc từ danh sách này. */
export interface PhysicalForm {
  id: string;
  name: string;
  description: string;
}

export const PHYSICAL_FORMS: PhysicalForm[] = [
  {
    id: "mau-in-chuan-1",
    name: "Mẫu in chuẩn #1 — form lễ/tiệc 2 cột",
    description:
      "Form in 2 cột lễ/tiệc dùng cho 80% thiệp (theo file mau_chuan.svg): cột lễ (nhà chủ tiệc, tên cô dâu chú rể, ngày giờ lễ) và cột tiệc (lời mời, nơi đãi tiệc, ngày giờ tiệc).",
  },
];

export const DEFAULT_PHYSICAL_FORM_ID = "mau-in-chuan-1";

/** Lấy form theo id; id lạ / thiếu thì về form mặc định (link cũ chưa có
 *  physicalFormId vẫn mở đúng form chuẩn #1). */
export function getPhysicalForm(id?: string): PhysicalForm {
  return PHYSICAL_FORMS.find((f) => f.id === id) ?? PHYSICAL_FORMS[0];
}
