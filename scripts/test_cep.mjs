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

// ---- namyy: khóa năm 2 chữ số dẫn xuất (KHÔNG phải lỗi chính tả) ----
check("cepValuesToData: namyy '26' → ngày tiệc 2026-11-21",
  cep.cepValuesToData({ "date.tiec.ngay": "21", "date.tiec.thang": "11", "date.tiec.namyy": "26" }).date === "2026-11-21");
check("cepValuesToData: namyy '2026' → ngày tiệc 2026-11-21",
  cep.cepValuesToData({ "date.tiec.ngay": "21", "date.tiec.thang": "11", "date.tiec.namyy": "2026" }).date === "2026-11-21");
check("cepValuesToData: có nam 4 chữ số thì nam thắng namyy",
  cep.cepValuesToData({ "date.tiec.ngay": "21", "date.tiec.thang": "11", "date.tiec.nam": "2027", "date.tiec.namyy": "26" }).date === "2027-11-21");
check("buildCepValues: đúng 32 khóa, không có namyy",
  cep.buildCepValues(example).keys.length === 32 && !cep.buildCepValues(example).keys.includes("date.tiec.namyy"));

// ---- Round-trip paste → chốt (B3): ghost vào → sửa 1 tên + 1 ngày → ghost ra ----
const ghostIn = cep.buildCepTextBlock(example);
const parsedIn = cep.parseCepGhostText(ghostIn);
check("round-trip: ghost vào parse được đúng dữ liệu",
  parsedIn.ok && parsedIn.data.groomName === example.groomName && parsedIn.data.date === example.date,
  parsedIn.ok ? "" : parsedIn.error);
const valsBefore = cep.buildCepValues(example).values;
const editedName = { ...example, groomName: "Trần Thanh Long Đổi" };
const ghostName = cep.buildCepTextBlock(editedName);
const valsName = cep.extractValuesForKeys(ghostName, cep.CEP_KEYS);
const diffName = valsBefore.map((v, i) => (v === valsName[i] ? null : cep.CEP_KEYS[i])).filter(Boolean);
check("round-trip: sửa 1 tên → ghost ra chỉ đổi đúng 1 khóa (pos2.con_full, Vu Quy)",
  diffName.length === 1 && diffName[0] === "pos2.con_full" && valsName[cep.CEP_KEYS.indexOf("pos2.con_full")] === "Trần Thanh Long Đổi",
  diffName.join(", "));
const editedDay = { ...example, date: "2026-11-02" };
const ghostDay = cep.buildCepTextBlock(editedDay);
const valsDay = cep.extractValuesForKeys(ghostDay, cep.CEP_KEYS);
const diffDay = valsBefore.map((v, i) => (v === valsDay[i] ? null : cep.CEP_KEYS[i])).filter(Boolean);
check("round-trip: sửa 1 ngày tiệc → chỉ đổi các khóa suy ra từ ngày (ngay/thu/ngày âm), còn lại không đổi",
  diffDay.length > 0 && diffDay.every((k) => ["date.tiec.ngay", "date.tiec.thu", "date.tiec.ngay_al"].includes(k)) &&
  valsDay[cep.CEP_KEYS.indexOf("date.tiec.ngay")] === "02",
  diffDay.join(", "));

// ---- NFC: Illustrator hay xuất dấu RỜI (ký tự gốc + dấu kết hợp) —
// trình duyệt render vỡ dấu; parse phải chuẩn hoá về dạng gộp.
const decomposed = {
  ...example,
  groomName: "Tra\u0302\u0300n Thanh Long",
  brideName: "Te\u0302re\u0302sa Nga\u0302n Thi\u0323 Hoa\u0300i Nhi",
};
const ghostDecomposed = cep.buildCepTextBlock(decomposed);
const parsedDecomposed = cep.parseCepGhostText(ghostDecomposed);
check("dấu rời trong ghost text → về dạng gộp chuẩn sau khi dán (groomName)",
  parsedDecomposed.ok && parsedDecomposed.data.groomName === "Trần Thanh Long",
  parsedDecomposed.ok ? parsedDecomposed.data.groomName : parsedDecomposed.error);
check("dấu rời trong ghost text → về dạng gộp chuẩn sau khi dán (brideName)",
  parsedDecomposed.ok && parsedDecomposed.data.brideName === "Têrêsa Ngân Thị Hoài Nhi",
  parsedDecomposed.ok ? parsedDecomposed.data.brideName : parsedDecomposed.error);
check("extractMatches chuẩn hoá NFC từng giá trị (dấu rời → gộp)",
  cep.extractValues("\u200BTra\u0302\u0300n\u200B")[0] === "Trần");
const plainDecomposed = cep.buildCepPlainText(decomposed);
const parsedPlainDecomposed = cep.parseCepPlainText(plainDecomposed);
check("dấu rời trong khối chữ thường → về dạng gộp chuẩn sau khi dán",
  parsedPlainDecomposed.ok && parsedPlainDecomposed.data.groomName === "Trần Thanh Long",
  parsedPlainDecomposed.ok ? parsedPlainDecomposed.data.groomName : parsedPlainDecomposed.error);
check("giá trị đã đúng NFC thì không đổi gì khi dán",
  parsedIn.ok && parsedIn.data.groomName === example.groomName);

// ---- Thứ trong tuần: Intl vi-VN đã ra tên riêng đúng dấu ("Thứ Sáu" /
// "Chủ Nhật") — mẫu in dùng thẳng, không upper-case nữa (sentence case).
check("ngày lễ: thứ đã là tên riêng đúng dấu ('Thứ Sáu')",
  cep.buildCepBlockData(example).le.thu === "Thứ Sáu",
  cep.buildCepBlockData(example).le.thu);
check("ngày tiệc: thứ đã là tên riêng đúng dấu ('Chủ Nhật')",
  cep.buildCepBlockData(example).tiec.thu === "Chủ Nhật",
  cep.buildCepBlockData(example).tiec.thu);

// ---- 10. Ví dụ thật của chị (11:32 09/11): Lễ Tân Hôn, tiệc ở Nhà Hàng
// Anh Vũ. Chị báo dán vào vẫn không nhận địa chỉ tiệc + nơi tổ chức tiệc;
// ảnh chụp cho thấy lễ nhận đúng (28.11.2026, Tư Gia Nhà Trai) còn tiệc
// vẫn dữ liệu cũ (Sen Hồng, 20.12.2026) — địa điểm tiệc trong .ai là outline.
const nancyPlain = `Lễ Tân Hôn
gia đình:
Nguyễn Văn Kiệm
Lê Thị Vân
địa chỉ:Thôn 9, Xã Ea Ktur
Tỉnh Đắk Lắk
con:Nguyễn Văn Cường (Út Nam)
------------------------------------------
gia đình:
Hoàng Văn Chấp
Hoang Thị Liêp
địa chỉ:Tổ 2, Phường Lê Ích Mộc
TP Hải Phòng
con:Hoàng Thị Phương Thảo (Quý Nữ)
------------------------------------------
cử hành tại Tư Gia Nhà Trai vào lúc 09'00 - Thứ Bảy 28.11.2026 (nhằm 20.10 năm Bính Ngọ)
tiệc tại Nhà Hàng Anh Vũ ĐC: KM 15, QL 27 Thôn 9
Xã Ea Ktur, Tỉnh Đắk Lắk vào lúc: 11'00 - Thứ Bảy 28.11.2026 (nhằm 20.10 năm Bính Ngọ)
------------------------------------------
Quý khách hàng vui lòng kiểm tra kỹ: Nội dung, lỗi chính tả trên bản Thiết kế.
Xin cảm ơn`;
const nancyParsed = cep.parseCepPlainText(nancyPlain);
check("chị Nancy: nhập chữ thường ok", nancyParsed.ok === true,
  nancyParsed.ok ? "" : nancyParsed.error);
if (nancyParsed.ok) {
  const nd = nancyParsed.data;
  check("chị Nancy: tên chú rể", nd.groomName === "Nguyễn Văn Cường", nd.groomName);
  check("chị Nancy: tên cô dâu", nd.brideName === "Hoàng Thị Phương Thảo", nd.brideName);
  check("chị Nancy: vị thứ cô dâu", nd.brideBirthOrder === "Quý Nữ", nd.brideBirthOrder);
  check("chị Nancy: nơi làm lễ", nd.ceremonyVenue === "Tư Gia Nhà Trai", nd.ceremonyVenue);
  check("chị Nancy: nơi tổ chức tiệc", nd.venue === "Nhà Hàng Anh Vũ", nd.venue);
  check("chị Nancy: địa chỉ tiệc 2 dòng",
    nd.address === "KM 15, QL 27 Thôn 9\nXã Ea Ktur, Tỉnh Đắk Lắk", nd.address);
  check("chị Nancy: ngày/giờ lễ", nd.ceremonyDate === "2026-11-28" && nd.ceremonyTime === "09:00",
    `${nd.ceremonyDate} ${nd.ceremonyTime}`);
  check("chị Nancy: ngày/giờ tiệc", nd.date === "2026-11-28" && nd.time === "11:00",
    `${nd.date} ${nd.time}`);
  check("chị Nancy: địa chỉ nhà trai 2 dòng",
    nd.groomParentsAddress === "Thôn 9, Xã Ea Ktur\nTỉnh Đắk Lắk", nd.groomParentsAddress);
}

// Dòng con có dấu cách cuối ("con:… (Út Nam) ") làm regex vị thứ cũ
// không tách được → tên dính cả "(Út Nam)", vị thứ rỗng.
const nancyTrailing = nancyPlain.replace(
  "con:Nguyễn Văn Cường (Út Nam)\n",
  "con:Nguyễn Văn Cường (Út Nam) \n"
);
const trailingParsed = cep.parseCepPlainText(nancyTrailing);
check("dòng con có dấu cách cuối → vị thứ vẫn tách đúng",
  trailingParsed.ok === true && trailingParsed.data.groomBirthOrder === "Út Nam" && trailingParsed.data.groomName === "Nguyễn Văn Cường",
  trailingParsed.ok ? `${trailingParsed.data.groomName} / ${trailingParsed.data.groomBirthOrder}` : trailingParsed.error);

// Đoạn chữ thường có marker U+200B bọc từng giá trị (như khi copy từ
// Illustrator mà marker còn sót): regex ngày/giờ vẫn phải khớp.
const M = "\u200B";
const nancyMarked = nancyPlain
  .replaceAll("Tư Gia Nhà Trai", `${M}Tư Gia Nhà Trai${M}`)
  .replaceAll("Nhà Hàng Anh Vũ", `${M}Nhà Hàng Anh Vũ${M}`)
  .replaceAll("KM 15, QL 27 Thôn 9\nXã Ea Ktur, Tỉnh Đắk Lắk", `${M}KM 15, QL 27 Thôn 9\nXã Ea Ktur, Tỉnh Đắk Lắk${M}`)
  .replaceAll("09'00", `${M}09${M}'${M}00${M}`)
  .replaceAll("11'00", `${M}11${M}'${M}00${M}`)
  .replaceAll("28.11.2026", `${M}28${M}.${M}11${M}.${M}2026${M}`);
const markedParsed = cep.parseCepPlainText(nancyMarked);
check("chữ thường có marker bọc giá trị ngày/giờ → đọc đủ",
  markedParsed.ok === true, markedParsed.ok ? "" : markedParsed.error);
if (markedParsed.ok) {
  const md = markedParsed.data;
  check("marker: nơi tổ chức tiệc", md.venue === "Nhà Hàng Anh Vũ", md.venue);
  check("marker: địa chỉ tiệc", md.address === "KM 15, QL 27 Thôn 9\nXã Ea Ktur, Tỉnh Đắk Lắk", md.address);
  check("marker: ngày/giờ lễ", md.ceremonyDate === "2026-11-28" && md.ceremonyTime === "09:00", `${md.ceremonyDate} ${md.ceremonyTime}`);
  check("marker: ngày/giờ tiệc", md.date === "2026-11-28" && md.time === "11:00", `${md.date} ${md.time}`);
}

// ---- 11. Ghost thiếu địa điểm tiệc (.ai outline) → bù bằng chữ thường.
// Ghost text thiếu marker ở địa điểm tiệc: chữ hiện ra nhưng không có
// marker nên ghost đếm thiếu cặp → hỏng hẳn, fallback chữ thường phải
// cứu được địa điểm + các trường khác.
const ghostNoVenueMarkers = ghost.replace(
  `tiệc tại ${M}${example.venue}${M} ĐC: ${M}${example.address}${M}`,
  `tiệc tại ${example.venue} ĐC: ${example.address}`
);
const ghostNoVenue = cep.parseCepGhostText(ghostNoVenueMarkers);
check("ghost thiếu marker ở địa điểm tiệc → ghost đọc hỏng (sai số lượng)",
  ghostNoVenue.ok === false);
const fallbackNoVenue = cep.parseCepGhostTextWithPlainFallback(ghostNoVenueMarkers);
check("fallback: ghost thiếu marker → đọc bù bằng chữ thường ok",
  fallbackNoVenue.result.ok === true);
check("fallback: đã dùng chữ thường", fallbackNoVenue.usedPlainFallback === true);
if (fallbackNoVenue.result.ok) {
  const fd = fallbackNoVenue.result.data;
  check("fallback: địa điểm tiệc bù đúng", fd.venue === example.venue, fd.venue);
  check("fallback: địa chỉ tiệc bù đúng", fd.address === example.address, fd.address);
  check("fallback: tên chú rể vẫn đúng", fd.groomName === example.groomName, fd.groomName);
  check("fallback: ngày tiệc vẫn đúng", fd.date === example.date && fd.time === example.time, `${fd.date} ${fd.time}`);
}

// Ghost đủ 32 cặp nhưng địa điểm là cặp rỗng → ghost ok, địa điểm rỗng;
// chữ thường cũng không có gì để bù → không được bịa dữ liệu.
const ghostEmptyVenue = ghost.replace(
  `tiệc tại ${M}${example.venue}${M} ĐC: ${M}${example.address}${M}`,
  `tiệc tại ${M}${M} ĐC: ${M}${M}`
);
const ghostEmpty = cep.parseCepGhostText(ghostEmptyVenue);
check("ghost cặp rỗng ở địa điểm → ghost ok nhưng địa điểm rỗng",
  ghostEmpty.ok === true && ghostEmpty.data.venue === "" && ghostEmpty.data.address === "");
const fallbackEmpty = cep.parseCepGhostTextWithPlainFallback(ghostEmptyVenue);
check("fallback: cặp rỗng → không bịa địa điểm",
  fallbackEmpty.result.ok === true && fallbackEmpty.result.data.venue === "" && fallbackEmpty.result.data.address === "");
check("fallback: cặp rỗng → các trường ghost khác giữ nguyên",
  fallbackEmpty.result.ok === true && fallbackEmpty.result.data.groomName === example.groomName && fallbackEmpty.result.data.brideName === example.brideName);

// Ghost đầy đủ 32 giá trị → không cần fallback, kết quả như cũ.
const fallbackFull = cep.parseCepGhostTextWithPlainFallback(ghost);
check("ghost đầy đủ 32 giá trị → không cần fallback",
  fallbackFull.usedPlainFallback === false && fallbackFull.filledFields.length === 0);
check("ghost đầy đủ → kết quả như cũ",
  fallbackFull.result.ok === true && fallbackFull.result.data.groomName === example.groomName && fallbackFull.result.data.venue === example.venue && fallbackFull.result.data.address === example.address);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
