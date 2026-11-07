// Test trang khách mẫu form in (PrintFormPreview) + link khách /khach/ +
// khóa link sau chốt (cờ localStorage cho link ?d=).
//   ./node_modules/.bin/tsc src/lib/custom-texts.ts src/lib/cep.ts src/lib/lunar.ts src/lib/store.ts src/lib/types.ts src/lib/access.ts --outDir /tmp/printform-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop --lib es2022,dom
//   NODE_PATH=$PWD/node_modules node scripts/test_printform.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const outDir = process.env.PRINTFORM_TEST_OUT || "/tmp/printform-test-out";
const cep = require(path.join(outDir, "cep.js"));
const ct = require(path.join(outDir, "custom-texts.js"));
const store = require(path.join(outDir, "store.js"));
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (p) => fs.readFileSync(path.join(repoRoot, p), "utf8");

let pass = 0;
let fail = 0;
function check(name, ok, extra = "") {
  if (ok) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

const vuQuy = {
  id: "thiep-printform-test",
  templateId: "song-phung-do",
  groomName: "Trần Thanh Long",
  brideName: "Têrêsa Ngân Thị Hoài Nhi",
  groomFather: "Trần Văn Bảy",
  groomMother: "Trần Thị Mỹ Dung",
  brideFather: "Phaolô Ngân Văn Sửu (+)",
  brideMother: "Maria Nguyễn Thị Thảo",
  groomBirthOrder: "Út Nam",
  brideBirthOrder: "Trưởng Nữ",
  groomParentsAddress: "73 Phú Mỹ\nChâu Thành, Trà Vinh",
  brideParentsAddress: "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk",
  ceremonyType: "Vu Quy",
  hostType: "Nhà Gái",
  ceremonyDate: "2026-10-30",
  ceremonyTime: "19:15",
  ceremonyVenue: "Nhà Thờ Giáo Xứ Vinh Hà",
  date: "2026-11-01",
  time: "11:00",
  venue: "Tư Gia Nhà Gái",
  address: "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk",
  message: "",
  story: "",
  photoUrl: "",
  language: "vi",
  bankCode: "",
  accountNumber: "",
  accountName: "",
  scheduleText: "",
};

// ---- 1. Thứ tự bên chủ tiệc: Vu Quy -> nhà gái (pos1) trước ----
const bVuQuy = cep.buildCepBlockData(vuQuy);
check("Vu Quy: pos1 = nhà gái (cô dâu trước)", bVuQuy.pos1.con_full === "Têrêsa Ngân Thị Hoài Nhi", bVuQuy.pos1.con_full);
check("Vu Quy: pos2 = nhà trai", bVuQuy.pos2.con_full === "Trần Thanh Long", bVuQuy.pos2.con_full);
check("Vu Quy: pos1.ong = bố cô dâu", bVuQuy.pos1.ong === "Phaolô Ngân Văn Sửu (+)", bVuQuy.pos1.ong);
check("Vu Quy: pos1.ba = mẹ cô dâu", bVuQuy.pos1.ba === "Maria Nguyễn Thị Thảo", bVuQuy.pos1.ba);
check("Vu Quy: pos2.ong = bố chú rể", bVuQuy.pos2.ong === "Trần Văn Bảy", bVuQuy.pos2.ong);

// ---- 2. Ngày/giờ lễ + tiệc + ngày âm suy ra đúng ----
check("lễ: giờ 19:15", bVuQuy.le.gio === "19" && bVuQuy.le.phut === "15", JSON.stringify(bVuQuy.le));
check("lễ: thứ Sáu 30.10.2026", bVuQuy.le.thu === "Thứ Sáu" && bVuQuy.le.ngay === "30" && bVuQuy.le.thang === "10" && bVuQuy.le.nam === "2026", JSON.stringify(bVuQuy.le));
check("lễ: âm 21.09 Bính Ngọ", bVuQuy.le.ngay_al === "21" && bVuQuy.le.thang_al === "09" && bVuQuy.le.nam_al === "Bính Ngọ", JSON.stringify(bVuQuy.le));
check("tiệc: giờ 11:00", bVuQuy.tiec.gio === "11" && bVuQuy.tiec.phut === "00", JSON.stringify(bVuQuy.tiec));
check("tiệc: Chủ Nhật 01.11.2026", bVuQuy.tiec.thu === "Chủ Nhật" && bVuQuy.tiec.ngay === "01" && bVuQuy.tiec.thang === "11" && bVuQuy.tiec.nam === "2026", JSON.stringify(bVuQuy.tiec));
check("tiệc: âm 23.09 Bính Ngọ", bVuQuy.tiec.ngay_al === "23" && bVuQuy.tiec.thang_al === "09" && bVuQuy.tiec.nam_al === "Bính Ngọ", JSON.stringify(bVuQuy.tiec));
check("ceremony.ten = nơi làm lễ", bVuQuy.ceremonyTen === "Nhà Thờ Giáo Xứ Vinh Hà", bVuQuy.ceremonyTen);
check("venue.ten / venue.diachi", bVuQuy.venueTen === "Tư Gia Nhà Gái" && bVuQuy.venueDiachi === "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk", bVuQuy.venueTen);

// ---- 3. Thành Hôn -> nhà trai (pos1) trước ----
const thanhHon = { ...vuQuy, ceremonyType: "Thành Hôn", hostType: "Nhà Trai" };
const bThanhHon = cep.buildCepBlockData(thanhHon);
check("Thành Hôn: pos1 = nhà trai (chú rể trước)", bThanhHon.pos1.con_full === "Trần Thanh Long", bThanhHon.pos1.con_full);
check("Thành Hôn: pos2 = nhà gái", bThanhHon.pos2.con_full === "Têrêsa Ngân Thị Hoài Nhi", bThanhHon.pos2.con_full);

// ---- 4. Link khách sinh ra trỏ tới /khach/ (không phải /tao-thiep) ----
const origin = "https://chung-doi.vercel.app";
const custUrl = store.buildCustomerEditUrl(origin, vuQuy);
check("link khách bắt đầu bằng /khach/<id>?d=", custUrl.startsWith(`${origin}/khach/thiep-printform-test?d=`), custUrl.slice(0, 80));
check("link khách không chứa /tao-thiep", !custUrl.includes("/tao-thiep"), custUrl.slice(0, 80));
const payload = custUrl.split("?d=")[1];
const back = store.decodeShare(payload);
check("link khách ?d= giải mã đúng dữ liệu", back !== null && back.groomName === "Trần Thanh Long" && back.brideName === "Têrêsa Ngân Thị Hoài Nhi" && back.ceremonyType === "Vu Quy", back ? back.id : "null");
check("link khách chưa lưu dùng id demo", store.buildCustomerEditUrl(origin, { ...vuQuy, id: "" }).startsWith(`${origin}/khach/demo?d=`));

// ---- 5. Câu mẫu riêng cho mẫu in ----
const printTitle = ct.CUSTOM_TEXT_DEFS.find((d) => d.key === "printCeremonyTitle");
const printIntro = ct.CUSTOM_TEXT_DEFS.find((d) => d.key === "printPartyIntro");
check("có câu mẫu printCeremonyTitle", printTitle !== undefined && printTitle.defaultVi === "HÔN LỄ ĐƯỢC CỬ HÀNH TẠI", printTitle?.defaultVi ?? "thiếu");
check("có câu mẫu printPartyIntro", printIntro !== undefined && printIntro.defaultVi === "ĐẾN DỰ BUỔI TIỆC CHUNG VUI CÙNG GIA ĐÌNH CHÚNG TÔI TẠI:", printIntro?.defaultVi ?? "thiếu");
const manual = ct.buildManualList({ printCeremonyTitle: "LỄ ĐƯỢC TỔ CHỨC TẠI" }, vuQuy, "");
check(
  "sửa tiêu đề lễ in vào danh sách sửa tay với chữ cũ đúng",
  manual.length === 1 && manual[0].key === "printCeremonyTitle" && manual[0].oldValue === "HÔN LỄ ĐƯỢC CỬ HÀNH TẠI" && manual[0].newValue === "LỄ ĐƯỢC TỔ CHỨC TẠI",
  JSON.stringify(manual)
);
check("không sửa câu mẫu in thì danh sách sửa tay rỗng", ct.buildManualList({}, vuQuy, "").length === 0);

// ---- 6. Khóa link sau chốt (?d=): cờ localStorage theo id ----
check("khóa cờ có tên theo id", store.customerConfirmedKey("thiep-abc") === "td_customer_confirmed_thiep-abc");
check("không có localStorage (node) thì chưa chốt + ghi cờ không lỗi", store.isCustomerConfirmed("thiep-abc") === false && (() => { store.markCustomerConfirmed("thiep-abc"); return true; })());

// ---- 7. Nguồn component: đúng nội dung form in, không có mục online ----
const pf = readSrc("src/components/PrintFormPreview.tsx");
const ctSrc = readSrc("src/lib/custom-texts.ts");
check("custom-texts có mặc định tiêu đề lễ in", ctSrc.includes('"HÔN LỄ ĐƯỢC CỬ HÀNH TẠI"'));
for (const s of [
  "TRÂN TRỌNG BÁO TIN LỄ",
  "TRÂN TRỌNG KÍNH MỜI",
  "Kính Mời!",
  "SỰ HIỆN DIỆN CỦA QUÝ KHÁCH",
  "buildCepBlockData",
  "md:grid-cols-2",
  "printCeremonyTitle",
  "printPartyIntro",
  "editWrap",
  "editBlock",
  "customWrap",
]) {
  check(`PrintFormPreview có: ${s}`, pf.includes(s));
}
for (const s of ["Album", "Đếm ngược", "Xem bản đồ", "Lịch trình", "Dress code", "VietQR", "mừng cưới", "Câu chuyện"]) {
  check(`PrintFormPreview KHÔNG có: ${s}`, !pf.includes(s));
}

// ---- 8. Editor dùng PrintFormPreview, không còn InvitationPreview ----
const ed = readSrc("src/components/CustomerStandardEditor.tsx");
check("editor import PrintFormPreview", ed.includes('from "./PrintFormPreview"'));
check("editor không còn import InvitationPreview", !ed.includes('from "./InvitationPreview"'));
check("editor render PrintFormPreview", ed.includes("<PrintFormPreview"));
check("editor nói rõ mẫu form in", ed.includes("Duyệt mẫu in") && ed.includes("mẫu form sẽ in"));
check("editor khóa sau chốt ở link ?d=", ed.includes("markCustomerConfirmed(invitationId)") && ed.includes("isCustomerConfirmed(invitationId)"));

// ---- 9. Nút link khách ở tao-thiep trỏ tới /khach/ ----
const tt = readSrc("src/app/(app)/tao-thiep/page.tsx");
check("tao-thiep dùng buildCustomerEditUrl", tt.includes("buildCustomerEditUrl"));
check("tao-thiep không còn link /tao-thiep?d= cho khách", !tt.includes("/tao-thiep?d="));
check("label ô link khách nói trang khách", tt.includes("mở trang khách"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
