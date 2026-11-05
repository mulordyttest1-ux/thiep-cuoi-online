export type InvitationLang = "vi" | "en" | "both";
export type GuestSide = "trai" | "gai";

export interface ScheduleItem {
  time: string;
  label: string;
}

export interface InvitationData {
  id: string;
  templateId: string;
  groomName: string;
  brideName: string;
  groomFather: string;
  groomMother: string;
  brideFather: string;
  brideMother: string;
  // Tùy chọn, theo đúng trường dữ liệu bản gốc (demo song-phung-do):
  // thứ bậc ("Út Nam" / "Út Nữ") hiện dưới tên lớn, địa chỉ gia đình mỗi bên
  // hiện dưới tên cha mẹ. Để trống thì không hiện (bản gốc cũng vậy).
  groomBirthOrder?: string;
  brideBirthOrder?: string;
  groomParentsAddress?: string;
  brideParentsAddress?: string;
  // Tiêu đề lễ (trường dữ liệu bản gốc: ceremonies[0].header / ceremonyHeader,
  // demo "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"). Để trống thì dùng dòng
  // mặc định của mẫu (bản gốc cũng có giá trị mặc định này trong template).
  ceremonyHeader?: string;
  // Dress code (bản gốc: showDresscode=true, dresscodeColors
  // ["#651212", "#8d3a3a", "#ffb2b2"], tiêu đề "DRESS CODE", phụ đề
  // "Trang phục dự tiệc"). App lưu danh sách mã màu, cách nhau bằng dấu
  // phẩy. Để trống thì ẩn mục Dress Code (chỉ mẫu deco render mục này).
  dressCode?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venue: string;
  address: string;
  message: string;
  story: string;
  photoUrl: string;
  language: InvitationLang;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  scheduleText: string; // mỗi dòng "HH:MM - Nội dung"
}

export interface Guest {
  id: string;
  name: string;
  group: string;
  side: GuestSide;
  phone: string;
  note: string;
  isDemo?: boolean;
}

export function defaultInvitation(templateId = "minimal-do-do"): InvitationData {
  return {
    id: "",
    templateId,
    groomName: "Minh Quân",
    brideName: "Thu An",
    // Tên cha mẹ KHÔNG kèm tiền tố "Ông "/"Bà " (vòng 12): khối THÔNG TIN
    // đã có nhãn "Ông Bà" nên tên kèm tiền tố sẽ bị nhân đôi danh xưng.
    groomFather: "Nguyễn Văn Hùng",
    groomMother: "Trần Thị Lan",
    brideFather: "Phạm Văn Đức",
    brideMother: "Lê Thị Hoa",
    // Điền sẵn như demo gốc để preview mặc định hiện đủ nhãn/địa chỉ.
    groomBirthOrder: "Út Nam",
    brideBirthOrder: "Út Nữ",
    groomParentsAddress: "12 Ngõ 34 Phố Huế, Hai Bà Trưng, Hà Nội",
    brideParentsAddress: "56 Đường Xuân Thủy, Cầu Giấy, Hà Nội",
    // Màu dress code mẫu của bản gốc (showDresscode=true).
    dressCode: "#651212, #8d3a3a, #ffb2b2",
    date: "2026-12-20",
    time: "11:00",
    venue: "Trung tâm Tiệc cưới Sen Hồng",
    address: "123 Đường Láng, Đống Đa, Hà Nội",
    // Lời mời mặc định RỖNG (vòng 12): demo gốc để trống trường này nên
    // khối THÔNG TIN không hiện đoạn mời; trước đây điền sẵn nên preview
    // editor hiện đoạn mời mà bản gốc không có.
    message: "",
    story:
      "Chúng tôi gặp nhau vào một chiều thu Hà Nội. Từ những buổi cà phê đầu tiên đến lời cầu hôn dưới ánh đèn vàng, mỗi khoảnh khắc đều dẫn chúng tôi tới ngày hôm nay.",
    photoUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
    language: "vi",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    scheduleText: "10:30 - Đón khách\n11:00 - Lễ thành hôn\n12:00 - Tiệc mừng\n14:00 - Chụp ảnh lưu niệm",
  };
}

export function parseSchedule(text: string): ScheduleItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(.*)$/);
      return m ? { time: m[1], label: m[2] } : { time: "", label: line };
    });
}

/** Tách chuỗi dress code "màu1, màu2, ..." thành danh sách mã màu hex hợp lệ. */
export function parseDressCode(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s));
}

/** Giờ đón khách = giờ cưới trừ 30 phút (mẫu bản gốc: đón 17:30 / tiệc 18:00). */
export function minusMinutes(time: string, minutes: number): string {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time;
  const total = Number(m[1]) * 60 + Number(m[2]) - minutes;
  const norm = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
}

export function formatDateVi(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function newId(prefix: string): string {
  try {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  } catch {
    return `${prefix}-${Date.now()}`;
  }
}
