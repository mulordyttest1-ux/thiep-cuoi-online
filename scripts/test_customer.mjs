// Test trang khách mẫu chuẩn #1: câu mẫu (customTexts) + danh sách sửa tay
// + round-trip mở rộng (sửa 1 trường dữ liệu + 1 câu mẫu → ghost text chỉ
// đổi trường dữ liệu, danh sách sửa tay có đúng câu mẫu cũ→mới).
//   ./node_modules/.bin/tsc src/lib/custom-texts.ts src/lib/cep.ts src/lib/lunar.ts --outDir /tmp/customer-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop
//   NODE_PATH=$PWD/node_modules node scripts/test_customer.mjs
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const outDir = process.env.CUSTOMER_TEST_OUT || "/tmp/customer-test-out";
const cep = require(path.join(outDir, "cep.js"));
const ct = require(path.join(outDir, "custom-texts.js"));

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

const example = {
  id: "customer-test",
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

// ---- 1. ceremony.ten là NƠI làm lễ, KHÔNG phải dòng tiêu đề ----
const vals = cep.buildCepValues(example);
check("ceremony.ten = nơi làm lễ (ceremonyVenue), không phải dòng tiêu đề",
  vals.values[vals.keys.indexOf("ceremony.ten")] === "Nhà Thờ Giáo Xứ Vinh Hà",
  vals.values[vals.keys.indexOf("ceremony.ten")]);
const ghost0 = cep.buildCepTextBlock(example);
check("ghost text KHÔNG chứa dòng tiêu đề lễ (chỉ có nơi làm lễ trong câu 'cử hành tại …')",
  !ghost0.includes("LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI") && ghost0.includes("Nhà Thờ Giáo Xứ Vinh Hà"),
  ghost0.slice(0, 120));

// ---- 2. mặc định câu mẫu ----
check("mặc định tiêu đề lễ",
  ct.customTextDefault("ceremonyHeaderLine1") === "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI",
  ct.customTextDefault("ceremonyHeaderLine1"));
check("mặc định tiêu đề tiệc",
  ct.customTextDefault("partyHeader") === "TIỆC CƯỚI SẼ TỔ CHỨC TẠI",
  ct.customTextDefault("partyHeader"));
check("tiêu đề lễ: lấy dòng đầu ceremonyHeader khi Thiết kế đã đặt riêng",
  ct.customTextDefault("ceremonyHeaderLine1", { ceremonyHeader: "LỄ VU QUY\nNHÀ THỜ X" }) === "LỄ VU QUY",
  ct.customTextDefault("ceremonyHeaderLine1", { ceremonyHeader: "LỄ VU QUY\nNHÀ THỜ X" }));
check("customTextValue: chưa sửa thì mặc định, đã sửa thì lấy chữ mới",
  ct.customTextValue("partyHeader", {}) === "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" &&
    ct.customTextValue("partyHeader", { partyHeader: "TIỆC MỪNG TẠI" }) === "TIỆC MỪNG TẠI");
check("khóa lạ thì mặc định rỗng",
  ct.customTextDefault("khong-co") === "" && ct.customTextValue("khong-co", {}) === "");

// ---- 3. danh sách sửa tay ----
check("chưa sửa câu mẫu nào → danh sách sửa tay rỗng",
  ct.buildManualList({}).length === 0);
check("sửa tiêu đề lễ (vd của chị) → 1 mục cũ→mới đúng",
  (() => {
    const list = ct.buildManualList({ ceremonyHeaderLine1: "LỄ ĐƯỢC TỔ CHỨC TẠI" });
    return (
      list.length === 1 &&
      list[0].key === "ceremonyHeaderLine1" &&
      list[0].label === "Tiêu đề lễ" &&
      list[0].oldValue === "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI" &&
      list[0].newValue === "LỄ ĐƯỢC TỔ CHỨC TẠI"
    );
  })(),
  JSON.stringify(ct.buildManualList({ ceremonyHeaderLine1: "LỄ ĐƯỢC TỔ CHỨC TẠI" })));
check("sửa rồi đổi về đúng chữ gốc → không vào danh sách sửa tay",
  ct.buildManualList({ partyHeader: "TIỆC CƯỚI SẼ TỔ CHỨC TẠI" }).length === 0);
check("đổi lời mời (message không có khóa CEP) → vào danh sách sửa tay",
  (() => {
    const list = ct.buildManualList({}, { ...example, message: "Kính mời quý khách" }, "");
    return list.length === 1 && list[0].key === "message" && list[0].oldValue === "" && list[0].newValue === "Kính mời quý khách";
  })(),
  JSON.stringify(ct.buildManualList({}, { ...example, message: "Kính mời quý khách" }, "")));
check("nhãn trường cho lịch sử sửa",
  ct.stdFieldLabel("groomName") === "Tên chú rể" &&
    ct.stdFieldLabel("ceremonyVenue") === "Nơi làm lễ" &&
    ct.stdFieldLabel("message") === "Lời mời");

// ---- 4. round-trip mở rộng: sửa 1 trường dữ liệu + 1 câu mẫu ----
const valsBefore = cep.buildCepValues(example).values;
const edited = { ...example, groomName: "Trần Thanh Long Đổi" };
const customTexts = { ceremonyHeaderLine1: "LỄ ĐƯỢC TỔ CHỨC TẠI" };
const ghostAfter = cep.buildCepTextBlock(edited);
const valsAfter = cep.extractValuesForKeys(ghostAfter, cep.CEP_KEYS);
const diff = valsBefore.map((v, i) => (v === valsAfter[i] ? null : cep.CEP_KEYS[i])).filter(Boolean);
check("round-trip mở rộng: sửa tên + câu mẫu → ghost text chỉ đổi đúng 1 khóa (pos2.con_full)",
  diff.length === 1 && diff[0] === "pos2.con_full" && valsAfter[cep.CEP_KEYS.indexOf("pos2.con_full")] === "Trần Thanh Long Đổi",
  diff.join(", "));
check("round-trip mở rộng: ghost text ra KHÔNG chứa câu mẫu đã sửa",
  !ghostAfter.includes("LỄ ĐƯỢC TỔ CHỨC TẠI"),
  ghostAfter.slice(0, 120));
const manual = ct.buildManualList(customTexts, edited, example.message ?? "");
check("round-trip mở rộng: danh sách sửa tay có đúng 1 mục tiêu đề lễ cũ→mới",
  manual.length === 1 &&
    manual[0].key === "ceremonyHeaderLine1" &&
    manual[0].oldValue === "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI" &&
    manual[0].newValue === "LỄ ĐƯỢC TỔ CHỨC TẠI",
  JSON.stringify(manual));

// ---- 5. Khóa câu mẫu mới: dòng tên khách + câu kết (mẫu in) ----
check("printGuestLine mặc định trống (hiện hàng chấm), printClosing mặc định 'Kính mời!'",
  ct.customTextValue("printGuestLine", {}, example) === "" &&
    ct.customTextValue("printClosing", {}, example) === "Kính mời!");
check("sửa tên khách → vào danh sách sửa tay, cũ '(trống)' → mới",
  (() => {
    const list = ct.buildManualList({ printGuestLine: "Quý Khách" }, example, "");
    return list.length === 1 && list[0].key === "printGuestLine" && list[0].label === "Tên khách mời (mẫu in)" &&
      list[0].oldValue === "" && list[0].newValue === "Quý Khách";
  })(),
  JSON.stringify(ct.buildManualList({ printGuestLine: "Quý Khách" }, example, "")));
check("sửa câu kết → vào danh sách sửa tay, cũ 'Kính mời!' → mới",
  (() => {
    const list = ct.buildManualList({ printClosing: "Trân trọng kính mời!" }, example, "");
    return list.length === 1 && list[0].key === "printClosing" && list[0].label === "Câu kết (mẫu in)" &&
      list[0].oldValue === "Kính mời!" && list[0].newValue === "Trân trọng kính mời!";
  })(),
  JSON.stringify(ct.buildManualList({ printClosing: "Trân trọng kính mời!" }, example, "")));
check("câu kết đã lưu kèm hàng chấm '............Kính mời!' → hiển thị 'Kính mời!' (chấm là leader, không phải nội dung)",
  ct.customTextValue("printClosing", { printClosing: "........................Kính mời!" }, example) === "Kính mời!");
check("câu kết đã lưu kèm hàng chấm → KHÔNG tính là đã sửa, không vào danh sách sửa tay",
  ct.isCustomTextEdited("printClosing", "........................Kính mời!", example) === false &&
    ct.buildManualList({ printClosing: "........................Kính mời!" }, example, "").length === 0);
check("câu kết lưu đúng chữ mặc định → KHÔNG tính là đã sửa; câu khác hẳn mới tính là sửa",
  ct.isCustomTextEdited("printClosing", "Kính mời!", example) === false &&
    ct.isCustomTextEdited("printClosing", "Trân trọng kính mời!", example) === true);
check("không sửa 2 khóa mới → không vào danh sách sửa tay",
  ct.buildManualList({}, example, "").length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
