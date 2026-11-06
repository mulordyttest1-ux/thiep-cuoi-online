// Kiểm tra codec CEP (src/lib/cep.ts) với VÍ DỤ THẬT của chị (lễ Vu Quy).
// CHẠY BẰNG (từ thư mục gốc của app):
//   ./node_modules/.bin/tsc src/lib/cep.ts src/lib/lunar.ts --outDir /tmp/cep-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop
//   NODE_PATH=$PWD/node_modules node scripts/test_cep.mjs
// (biên dịch vào /tmp rồi xóa sau mỗi lần chạy; script này không ship kèm app)
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const outDir = process.env.CEP_TEST_OUT || "/tmp/cep-test-out";
const cep = require(path.join(outDir, "cep.js"));

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name}${extra ? " — " + extra : ""}`);
  }
}
function eqArr(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---- Ví dụ thật: lễ Vu Quy, nhà gái chủ tiệc, lễ 30.10.2026 — tiệc 01.11.2026
const example = {
  id: "cep-test",
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

// ---- 1. Số khóa: 32 (mô tả ban đầu nói 31 là đếm thiếu)
check("CEP_KEYS có 32 khóa", cep.CEP_KEYS.length === 32, `đếm được ${cep.CEP_KEYS.length}`);
check("không có khóa trùng", new Set(cep.CEP_KEYS).size === cep.CEP_KEYS.length);

// ---- 2. Giá trị: Vu Quy thì pos1 = nhà gái (nhà chủ tiệc)
const { keys, values } = cep.buildCepValues(example);
const at = (k) => values[keys.indexOf(k)];
check("buildCepValues trả 32 giá trị", values.length === 32, `đếm được ${values.length}`);
check("info.ten_le = Vu Quy", at("info.ten_le") === "Vu Quy", at("info.ten_le"));
check("pos1.ong = bố cô dâu, giữ nguyên (+)", at("pos1.ong") === "Phaolô Ngân Văn Sửu (+)", at("pos1.ong"));
check("pos1.ba = mẹ cô dâu", at("pos1.ba") === "Maria Nguyễn Thị Thảo");
check("pos1.con_full = cô dâu", at("pos1.con_full") === "Têrêsa Ngân Thị Hoài Nhi");
check("pos1.vithu = Trưởng Nữ", at("pos1.vithu") === "Trưởng Nữ");
check("pos1.diachi giữ xuống dòng", at("pos1.diachi") === "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk");
check("pos2.ong = bố chú rể", at("pos2.ong") === "Trần Văn Bảy");
check("pos2.con_full = chú rể", at("pos2.con_full") === "Trần Thanh Long");
check("pos2.vithu = Út Nam", at("pos2.vithu") === "Út Nam");
check("ceremony.ten = nhà thờ", at("ceremony.ten") === "Nhà Thờ Giáo Xứ Vinh Hà");
// Lễ 30.10.2026: thứ Sáu, âm 21.09 Bính Ngọ (đúng ví dụ của chị)
check("le.gio/phut = 19/15", at("date.le.gio") === "19" && at("date.le.phut") === "15");
check("le.thu = Thứ Sáu", at("date.le.thu") === "Thứ Sáu", at("date.le.thu"));
check("le.ngay/thang/nam = 30/10/2026", at("date.le.ngay") === "30" && at("date.le.thang") === "10" && at("date.le.nam") === "2026");
check("le âm = 21/09/Bính Ngọ", at("date.le.ngay_al") === "21" && at("date.le.thang_al") === "09" && at("date.le.nam_al") === "Bính Ngọ",
  `${at("date.le.ngay_al")}.${at("date.le.thang_al")} ${at("date.le.nam_al")}`);
// Tiệc 01.11.2026: Chủ Nhật, âm 23.09 Bính Ngọ
check("tiec.gio/phut = 11/00", at("date.tiec.gio") === "11" && at("date.tiec.phut") === "00");
check("tiec.thu = Chủ Nhật", at("date.tiec.thu") === "Chủ Nhật", at("date.tiec.thu"));
check("tiec âm = 23/09/Bính Ngọ", at("date.tiec.ngay_al") === "23" && at("date.tiec.thang_al") === "09" && at("date.tiec.nam_al") === "Bính Ngọ");

// ---- 3. Metadata JSON
const metaJson = cep.buildCepMetadataJson();
const meta = JSON.parse(metaJson);
check("metadata là một dòng", !metaJson.includes("\n"));
check("metadata type = stateful", meta.type === "stateful");
check("metadata keys = CEP_KEYS", eqArr(meta.keys, cep.CEP_KEYS));
check("metadata mappings = []", Array.isArray(meta.mappings) && meta.mappings.length === 0);

// ---- 4. Khối chữ ghost: tách lại phải giống hệt giá trị gốc
const ghost = cep.buildCepTextBlock(example);
check("ghost không chứa U+300B", !ghost.includes("\u300B"));
check("ghost có đúng 32 cặp marker", cep.extractValues(ghost).length === 32, `đếm được ${cep.extractValues(ghost).length}`);
check("tách ghost ra = đúng 32 giá trị gốc", eqArr(cep.extractValues(ghost), values));
check("extractValuesForKeys(ghost) = đúng 32 giá trị gốc", eqArr(cep.extractValuesForKeys(ghost, cep.CEP_KEYS), values));

// ---- 5. Khối chữ thường phải khớp đúng bố cục ví dụ của chị
const expectedPlain = [
  "Lễ Vu Quy",
  "gia đình:",
  "Phaolô Ngân Văn Sửu (+)",
  "Maria Nguyễn Thị Thảo",
  "địa chỉ:Thôn Chư Kbô",
  "Xã Krông Búk, Tỉnh Đắk Lắk",
  "con:Têrêsa Ngân Thị Hoài Nhi (Trưởng Nữ)",
  "------------------------------------------",
  "gia đình:",
  "Trần Văn Bảy",
  "Trần Thị Mỹ Dung",
  "địa chỉ:73 Phú Mỹ",
  "Châu Thành, Trà Vinh",
  "con:Trần Thanh Long (Út Nam)",
  "------------------------------------------",
  "cử hành tại Nhà Thờ Giáo Xứ Vinh Hà vào lúc 19'15 - Thứ Sáu 30.10.2026 (nhằm 21.09 năm Bính Ngọ)",
  "tiệc tại Tư Gia Nhà Gái ĐC: Thôn Chư Kbô",
  "Xã Krông Búk, Tỉnh Đắk Lắk vào lúc: 11'00 - Chủ Nhật 01.11.2026 (nhằm 23.09 năm Bính Ngọ)",
  "------------------------------------------",
  "Quý khách hàng vui lòng kiểm tra kỹ: Nội dung, lỗi chính tả trên bản Thiết kế.",
  "Xin cảm ơn",
].join("\n");
const plain = cep.buildCepPlainText(example);
check("khối chữ thường khớp đúng ví dụ của chị", plain === expectedPlain,
  plain === expectedPlain ? "" : `\n--- nhận được ---\n${plain}\n--- mong đợi ---\n${expectedPlain}`);
check("dòng gạch phân cách dài 42 ký tự",
  plain.split("\n").filter((l) => /^-+$/.test(l)).every((l) => l.length === 42));

// ---- 6. Nhập ghost về: điền đúng các trường
const imported = cep.parseCepGhostText(ghost);
check("nhập ghost: ok", imported.ok === true, imported.ok === false ? imported.error : "");
if (imported.ok) {
  const d = imported.data;
  const want = [
    ["groomName", "Trần Thanh Long"],
    ["brideName", "Têrêsa Ngân Thị Hoài Nhi"],
    ["groomFather", "Trần Văn Bảy"],
    ["groomMother", "Trần Thị Mỹ Dung"],
    ["brideFather", "Phaolô Ngân Văn Sửu (+)"],
    ["brideMother", "Maria Nguyễn Thị Thảo"],
    ["groomBirthOrder", "Út Nam"],
    ["brideBirthOrder", "Trưởng Nữ"],
    ["groomParentsAddress", "73 Phú Mỹ\nChâu Thành, Trà Vinh"],
    ["brideParentsAddress", "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk"],
    ["ceremonyType", "Vu Quy"],
    ["hostType", "Nhà Gái"],
    ["ceremonyDate", "2026-10-30"],
    ["ceremonyTime", "19:15"],
    ["ceremonyVenue", "Nhà Thờ Giáo Xứ Vinh Hà"],
    ["date", "2026-11-01"],
    ["time", "11:00"],
    ["venue", "Tư Gia Nhà Gái"],
    ["address", "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk"],
  ];
  for (const [k, v] of want) check(`nhập ghost: ${k}`, d[k] === v, `nhận "${d[k]}", mong "${v}"`);
}
const importedMeta = cep.parseCepGhostText(ghost, metaJson);
check("nhập ghost kèm metadata: ok", importedMeta.ok === true);

// ---- 7. Sai số lượng thì báo lỗi, không điền gì
const broken = ghost.replace("\u200B", "");
check("thiếu 1 marker thì tách được 31 giá trị", cep.extractValues(broken).length === 31, `đếm được ${cep.extractValues(broken).length}`);
const brokenRes = cep.parseCepGhostText(broken);
check("thiếu 1 marker thì báo lỗi", brokenRes.ok === false, JSON.stringify(brokenRes));
check("lỗi ghi rõ đếm được 31, cần 32",
  brokenRes.ok === false && brokenRes.error.includes("31") && brokenRes.error.includes("32"), brokenRes.ok === false ? brokenRes.error : "");
const badMeta = cep.parseCepGhostText(ghost, "{không phải json");
check("metadata hỏng thì báo lỗi", badMeta.ok === false);

// ---- 8. Nhập khối chữ thường về: điền đúng các trường
const plainImported = cep.parseCepPlainText(plain);
check("nhập chữ thường: ok", plainImported.ok === true, plainImported.ok === false ? plainImported.error : "");
if (plainImported.ok) {
  check("nhập chữ thường: cô dâu", plainImported.data.brideName === "Têrêsa Ngân Thị Hoài Nhi");
  check("nhập chữ thường: bố cô dâu giữ (+)", plainImported.data.brideFather === "Phaolô Ngân Văn Sửu (+)");
  check("nhập chữ thường: địa chỉ nhà gái giữ xuống dòng",
    plainImported.data.brideParentsAddress === "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk");
  check("nhập chữ thường: ngày/giờ lễ", plainImported.data.ceremonyDate === "2026-10-30" && plainImported.data.ceremonyTime === "19:15");
  check("nhập chữ thường: ngày/giờ tiệc", plainImported.data.date === "2026-11-01" && plainImported.data.time === "11:00");
  check("nhập chữ thường: địa chỉ tiệc giữ xuống dòng",
    plainImported.data.address === "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk");
}
check("nhập chữ thường hỏng thì báo lỗi", cep.parseCepPlainText("chữ linh tinh không đúng bố cục").ok === false);

// ---- 9. Trường hợp mặc định (Thành Hôn / Nhà Trai): pos1 = nhà trai
const normal = {
  ...example,
  ceremonyType: "Thành Hôn",
  hostType: "Nhà Trai",
  ceremonyDate: undefined,
  ceremonyTime: undefined,
};
const normalValues = cep.buildCepValues(normal).values;
const normalKeys = cep.CEP_KEYS;
check("Thành Hôn: pos1.ong = bố chú rể", normalValues[normalKeys.indexOf("pos1.ong")] === "Trần Văn Bảy");
check("Thành Hôn: lễ mặc định = ngày/giờ tiệc",
  normalValues[normalKeys.indexOf("date.le.ngay")] === "01" &&
  normalValues[normalKeys.indexOf("date.le.gio")] === "11");

// ---- 10. Không có thứ bậc: vẫn đủ 32 cặp, dòng con không có ()
const noOrder = { ...example, groomBirthOrder: "", brideBirthOrder: "" };
const ghostNoOrder = cep.buildCepTextBlock(noOrder);
check("không thứ bậc: vẫn đủ 32 cặp", cep.extractValues(ghostNoOrder).length === 32);
const plainNoOrder = cep.buildCepPlainText(noOrder);
check("không thứ bậc: dòng con không có ()",
  plainNoOrder.includes("con:Têrêsa Ngân Thị Hoài Nhi") && !plainNoOrder.includes("con:Têrêsa Ngân Thị Hoài Nhi ("));

// ---- 11. Hàm bọc/tách cấp thấp (đúng code CEP)
check("wrap('') = 2 marker dính nhau", cep.wrapValue("") === "\u200B\u200B");
check("wrap xóa U+200B bên trong giá trị", cep.wrapValue("A\u200BB") === "\u200BAB\u200B");
check("extractValuesForKeys: 1 khóa không marker thì trả cả chuỗi",
  eqArr(cep.extractValuesForKeys("hello", ["only.key"]), ["hello"]));
check("extractValuesForKeys: sai số lượng thì trả []",
  eqArr(cep.extractValuesForKeys("\u200Ba\u200B", ["k1", "k2"]), []));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
