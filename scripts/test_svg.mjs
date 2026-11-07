// Kiểm tra đường mẫu SVG tap-to-edit (src/lib/svg-template.ts,
// src/lib/cep-logic/) với mẫu test scripts/test-template.svg (lễ Vu Quy,
// dữ liệu thật của chị — cùng payload với scripts/test_cep.mjs).
// CHẠY BẰNG (từ thư mục gốc của app):
//   ./node_modules/.bin/tsc src/lib/svg-template.ts src/lib/cep-logic/index.ts src/lib/cep.ts src/lib/lunar.ts src/lib/types.ts src/lib/svg-store.ts --outDir /tmp/svg-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop
//   NODE_PATH=$PWD/node_modules node scripts/test_svg.mjs
// (biên dịch vào /tmp rồi xóa sau mỗi lần chạy; script này không ship kèm app)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const outDir = process.env.SVG_TEST_OUT || "/tmp/svg-test-out";
const svgLib = require(path.join(outDir, "svg-template.js"));
const cep = require(path.join(outDir, "cep.js"));
const logic = require(path.join(outDir, "cep-logic", "index.js"));

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

const svgText = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "test-template.svg"), "utf8");

// Ví dụ thật: lễ Vu Quy, nhà gái chủ tiệc, lễ 30.10.2026 — tiệc 01.11.2026
const example = {
  id: "svg-test",
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

// ---- 1. Parse mẫu test: đúng 33 khung, đúng thứ tự
const tpl = svgLib.parseSvgTemplate(svgText, "test-template.svg");
check("parse: 33 khung sửa được (32 CEP + 1 ngoài CEP)", tpl.fields.length === 33, `đếm được ${tpl.fields.length}`);
const keys = tpl.fields.map((f) => f.key);
check("parse: thứ tự khung = thứ tự 32 khóa CEP + custom.note cuối",
  eqArr(keys, [...cep.CEP_KEYS, "custom.note"]), keys.join(","));
const at = (k) => tpl.fields.find((f) => f.key === k)?.value;
check("parse: pos1.ong lấy từ <g> bao ngoài (text không có id)", at("pos1.ong") === "Phaolô Ngân Văn Sửu (+)", at("pos1.ong"));
check("parse: pos1.diachi giữ 2 dòng", at("pos1.diachi") === "Thôn Chư Kbô\nXã Krông Búk, Tỉnh Đắk Lắk", JSON.stringify(at("pos1.diachi")));
check("parse: info.ten_le = Vu Quy", at("info.ten_le") === "Vu Quy");
check("parse: custom.note là khung generic", tpl.fields.find((f) => f.key === "custom.note")?.kind === "generic");
check("parse: không cảnh báo nghiêm trọng", tpl.warnings.length === 0, tpl.warnings.join(" | "));

// ---- 2. Chữ mẫu cố định không bao giờ thành khung sửa được
const fixed = ["Trân trọng kính mời", "Đến dự buổi tiệc chung vui cùng gia đình", "Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi"];
for (const s of fixed) {
  check(`cố định: "${s.slice(0, 20)}…" không phải khung sửa`, !tpl.fields.some((f) => f.value.includes(s.slice(0, 12))));
}

// ---- 3. Trùng id: giữ khung đầu, có cảnh báo
const dupSvg = svgText.replace(
  '</svg>',
  '<text id="pos1.ong" x="400" y="1150" text-anchor="middle" font-family="serif" font-size="20">Tên trùng</text></svg>'
);
const dup = svgLib.parseSvgTemplate(dupSvg, "dup.svg");
check("trùng id: vẫn 33 khung", dup.fields.length === 33, `đếm được ${dup.fields.length}`);
check("trùng id: có cảnh báo", dup.warnings.some((w) => w.includes("pos1.ong")));
check("trùng id: khung pos1.ong vẫn giữ giá trị đầu", dup.fields.find((f) => f.key === "pos1.ong")?.value === "Phaolô Ngân Văn Sửu (+)");
check("trùng id: đếm được 2 chỗ", dup.fields.find((f) => f.key === "pos1.ong")?.occurrences === 2);

// ---- 4. Làm sạch: script / on* / javascript: / ảnh link ngoài bị bỏ
const dirty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<script>alert(1)</script><style>.a{fill:red}</style>
<text id="pos1.ong" onload="alert(2)" x="10" y="20">Tên</text>
<a href="javascript:alert(3)"><text x="10" y="40">Bấm</text></a>
<image href="https://example.com/a.jpg" x="0" y="0" width="10" height="10"/>
<image href="data:image/png;base64,AAA" x="0" y="0" width="10" height="10"/>
<foreignObject><div>html</div></foreignObject>
</svg>`;
const dirtyTpl = svgLib.parseSvgTemplate(dirty, "dirty.svg");
check("làm sạch: không còn <script>", !dirtyTpl.svgText.includes("<script"));
check("làm sạch: không còn <style>", !dirtyTpl.svgText.includes("<style"));
check("làm sạch: không còn onload", !dirtyTpl.svgText.includes("onload"));
check("làm sạch: không còn javascript:", !dirtyTpl.svgText.includes("javascript:"));
check("làm sạch: không còn foreignObject", !dirtyTpl.svgText.includes("foreignObject"));
check("làm sạch: ảnh link ngoài bị bỏ", !dirtyTpl.svgText.includes("example.com"));
check("làm sạch: ảnh nhúng data:image được giữ", dirtyTpl.svgText.includes("data:image/png"));
check("làm sạch: chữ pos1.ong còn nguyên", dirtyTpl.fields.some((f) => f.key === "pos1.ong" && f.value === "Tên"));

// ---- 5. Ngày lễ suy ra từ lịch: chọn 2026-10-30 → Thứ Sáu, âm 21.09 Bính Ngọ
const norm = svgLib.normalizeSvgData(example);
const leVals = cep.buildCepValues(norm);
const leAt = (k) => leVals.values[leVals.keys.indexOf(k)];
check("lễ: thứ = Thứ Sáu", leAt("date.le.thu") === "Thứ Sáu", leAt("date.le.thu"));
check("lễ: ngày/tháng/năm = 30/10/2026", leAt("date.le.ngay") === "30" && leAt("date.le.thang") === "10" && leAt("date.le.nam") === "2026");
check("lễ: âm = 21/09/Bính Ngọ", leAt("date.le.ngay_al") === "21" && leAt("date.le.thang_al") === "09" && leAt("date.le.nam_al") === "Bính Ngọ",
  `${leAt("date.le.ngay_al")}.${leAt("date.le.thang_al")} ${leAt("date.le.nam_al")}`);
check("lễ: giờ/phút = 19/15", leAt("date.le.gio") === "19" && leAt("date.le.phut") === "15");
check("tiệc: thứ = Chủ Nhật", leAt("date.tiec.thu") === "Chủ Nhật");
check("tiệc: âm = 23/09/Bính Ngọ", leAt("date.tiec.ngay_al") === "23" && leAt("date.tiec.thang_al") === "09");

// ---- 6. Lễ / tiệc độc lập: đổi ngày tiệc không động lễ, đổi ngày lễ không động tiệc
const tiecChanged = svgLib.normalizeSvgData({ ...example, date: "2026-12-25", time: "18:00" });
const tiecVals = cep.buildCepValues(tiecChanged);
const tiecAt = (k) => tiecVals.values[tiecVals.keys.indexOf(k)];
check("đổi ngày tiệc → lễ vẫn 30.10.2026", tiecAt("date.le.ngay") === "30" && tiecAt("date.le.thang") === "10");
check("đổi ngày tiệc → tiệc đổi theo 25.12.2026", tiecAt("date.tiec.ngay") === "25" && tiecAt("date.tiec.thang") === "12");
const leChanged = svgLib.normalizeSvgData({ ...example, ceremonyDate: "2026-10-31", ceremonyTime: "08:00" });
const leVals2 = cep.buildCepValues(leChanged);
const leAt2 = (k) => leVals2.values[leVals2.keys.indexOf(k)];
check("đổi ngày lễ → tiệc vẫn 01.11.2026", leAt2("date.tiec.ngay") === "01" && leAt2("date.tiec.thang") === "11");
check("đổi ngày lễ → lễ đổi theo 31.10.2026", leAt2("date.le.ngay") === "31");
check("normalizeSvgData: lễ trống thì lấy ngày/giờ tiệc",
  svgLib.normalizeSvgData({ ...example, ceremonyDate: "", ceremonyTime: "" }).ceremonyDate === "2026-11-01" &&
  svgLib.normalizeSvgData({ ...example, ceremonyDate: "", ceremonyTime: "" }).ceremonyTime === "11:00");

// ---- 7. Đổi loại lễ đổi bên (luật pos1/pos2) + ghi ngược đúng người
const vuQuyVals = cep.buildCepValues(example);
check("Vu Quy: pos1.ong = bố cô dâu", vuQuyVals.values[vuQuyVals.keys.indexOf("pos1.ong")] === "Phaolô Ngân Văn Sửu (+)");
const toThanhHon = svgLib.applySvgFieldEdit(example, "info.ten_le", "Thành Hôn");
const thVals = cep.buildCepValues(toThanhHon);
check("đổi sang Thành Hôn: pos1.ong = bố chú rể", thVals.values[thVals.keys.indexOf("pos1.ong")] === "Trần Văn Bảy");
check("đổi sang Thành Hôn: ceremonyType đổi theo", toThanhHon.ceremonyType === "Thành Hôn");
const editPos1VuQuy = svgLib.applySvgFieldEdit(example, "pos1.ong", "Nguyễn Văn Mới");
check("sửa pos1.ong lúc Vu Quy → ghi vào bố cô dâu", editPos1VuQuy.brideFather === "Nguyễn Văn Mới", editPos1VuQuy.brideFather);
check("sửa pos1.ong lúc Vu Quy → bố chú rể không đổi", editPos1VuQuy.groomFather === "Trần Văn Bảy");
const editPos1ThanhHon = svgLib.applySvgFieldEdit(toThanhHon, "pos1.ong", "Nguyễn Văn Mới");
check("sửa pos1.ong lúc Thành Hôn → ghi vào bố chú rể", editPos1ThanhHon.groomFather === "Nguyễn Văn Mới");
check("sửa pos1.vithu lúc Vu Quy → ghi vào thứ bậc cô dâu",
  svgLib.applySvgFieldEdit(example, "pos1.vithu", "Ái Nữ").brideBirthOrder === "Ái Nữ");
check("khóa ngoài CEP: applySvgFieldEdit không đổi dữ liệu",
  svgLib.applySvgFieldEdit(example, "custom.note", "Mới") === example);

// ---- 8. Ghost text round-trip từ giá trị đã sửa: đủ 32 cặp, đúng thứ tự
const edited = svgLib.applySvgFieldEdit(example, "venue.ten", "Tư Gia Mới");
const ghost = cep.buildCepTextBlock(edited);
const { keys: gkeys, values: gvals } = cep.buildCepValues(edited);
check("ghost sau khi sửa: đủ 32 cặp", cep.extractValues(ghost).length === 32);
check("ghost sau khi sửa: tách ra = đúng 32 giá trị", eqArr(cep.extractValues(ghost), gvals));
check("ghost sau khi sửa: venue.ten mới có trong khối", ghost.includes("Tư Gia Mới"));
check("ghost sau khi sửa: metadata keys = 32 khóa CEP",
  eqArr(JSON.parse(cep.buildCepMetadataJson()).keys, cep.CEP_KEYS));
check("ghost không dính U+200B vào dữ liệu gốc (dữ liệu vẫn chữ thường)",
  !JSON.stringify(edited).includes("\u200B"));

// ---- 9. Serialize round-trip: sửa giá trị (kể cả địa chỉ nhiều dòng) rồi parse lại
const tree = svgLib.parseXml(svgText);
const displayVals = svgLib.buildSvgDisplayValues(example, {}, tpl.fields);
const out1 = svgLib.serializeSvg(tree, { ...displayVals, "pos1.diachi": "Thôn Mới\nXã Mới, Tỉnh Mới", "pos1.con_full": "Têrêsa Ngân Thị Hoài Ỹ" });
const back = svgLib.parseSvgTemplate(out1, "roundtrip.svg");
const backAt = (k) => back.fields.find((f) => f.key === k)?.value;
check("round-trip: địa chỉ nhiều dòng giữ nguyên", backAt("pos1.diachi") === "Thôn Mới\nXã Mới, Tỉnh Mới", JSON.stringify(backAt("pos1.diachi")));
check("round-trip: sửa ĩ → ỹ giữ nguyên", backAt("pos1.con_full") === "Têrêsa Ngân Thị Hoài Ỹ", backAt("pos1.con_full"));
check("round-trip: đủ 33 khung", back.fields.length === 33);
const marked = svgLib.serializeSvg(tree, displayVals, { markFields: true });
check("render: data-field được gắn cho khung sửa", marked.includes('data-field="pos1.ong"'));
check("render: chữ cố định không có data-field", !marked.includes('data-field="Trân trọng'));
const downloaded = svgLib.serializeSvg(tree, displayVals, { markFields: false });
check("tải về: không kèm data-field", !downloaded.includes("data-field"));

// ---- 10. Điểm nối cep-logic (giai đoạn 1: ruột tạm an toàn; giai đoạn 2 thay bằng code thật)
check("normalizeName: viết hoa tên", logic.normalizeName("trần thanh long") === "Trần Thanh Long", logic.normalizeName("trần thanh long"));
check("normalizeName: giữ nguyên (+)", logic.normalizeName("phaolô ngân văn sửu (+)") === "Phaolô Ngân Văn Sửu (+)", logic.normalizeName("phaolô ngân văn sửu (+)"));
check("normalizeName: gộp khoảng trắng", logic.normalizeName("  nguyễn   văn a  ") === "Nguyễn Văn A");
check("suggestAddress (tạm): chưa có dữ liệu → []", eqArr(logic.suggestAddress("Thôn Chư"), []));
check("parseDateTime: 30.10.2026 19:15",
  eqArr([logic.parseDateTime("30.10.2026 19:15")?.date, logic.parseDateTime("30.10.2026 19:15")?.time], ["2026-10-30", "19:15"]));
check("parseDateTime: ngày không có thật → null", logic.parseDateTime("31.02.2026") === null);
check("parseDateTime: ISO", logic.parseDateTime("2026-10-30")?.date === "2026-10-30");
check("validateData: ví dụ thật ok", logic.validateData(example).ok === true, logic.validateData(example).errors.join("; "));
const bad = logic.validateData({ ...example, groomName: "", date: "2026-02-30", venue: "" });
check("validateData: thiếu tên/ngày sai/nơi tiệc trống → lỗi", bad.ok === false && bad.errors.length >= 3, bad.errors.join("; "));
check("swapInvitationSides: đổi pos1↔pos2 nhưng giữ vithu",
  (() => {
    const m = { "pos1.ong": "A", "pos2.ong": "B", "pos1.vithu": "Trưởng Nữ", "pos2.vithu": "Út Nam" };
    const s = logic.swapInvitationSides(m);
    return s["pos1.ong"] === "B" && s["pos2.ong"] === "A" && s["pos1.vithu"] === "Trưởng Nữ" && s["pos2.vithu"] === "Út Nam";
  })());

// ---- 11. Loại ô nhập cho từng khóa
check("kind: info.ten_le → ceremonyType", svgLib.fieldKindForKey("info.ten_le") === "ceremonyType");
check("kind: pos1.vithu lúc Vu Quy → vithuBride", svgLib.fieldKindForKey("pos1.vithu", example) === "vithuBride");
check("kind: pos2.vithu lúc Vu Quy → vithuGroom", svgLib.fieldKindForKey("pos2.vithu", example) === "vithuGroom");
check("kind: pos1.vithu lúc Thành Hôn → vithuGroom",
  svgLib.fieldKindForKey("pos1.vithu", { ...example, ceremonyType: "Thành Hôn", hostType: "Nhà Trai" }) === "vithuGroom");
check("kind: date.le.ngay → dateLe", svgLib.fieldKindForKey("date.le.ngay") === "dateLe");
check("kind: date.le.gio → timeLe", svgLib.fieldKindForKey("date.le.gio") === "timeLe");
check("kind: date.tiec.ngay → dateTiec", svgLib.fieldKindForKey("date.tiec.ngay") === "dateTiec");
check("kind: date.tiec.phut → timeTiec", svgLib.fieldKindForKey("date.tiec.phut") === "timeTiec");
check("kind: pos1.diachi → textarea", svgLib.fieldKindForKey("pos1.diachi") === "textarea");
check("kind: custom.note → text", svgLib.fieldKindForKey("custom.note") === "text");
check("label: pos1.ong lúc Vu Quy ghi rõ nhà gái chủ tiệc",
  svgLib.cepKeyLabel("pos1.ong", example).includes("nhà gái"));

// ---- 12. Ảnh ngoài chưa nhúng (Images: Embed) ----
const extSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">
<image xlink:href="Untitled-5-1.png" x="0" y="0" width="10" height="10"/>
<image href="https://example.com/a.jpg" x="0" y="0" width="10" height="10"/>
<image href="data:image/png;base64,AAA" x="0" y="0" width="10" height="10"/>
</svg>`;
check("ảnh ngoài: tìm được cả xlink:href lẫn href", eqArr(svgLib.findExternalImageRefs(extSvg), ["Untitled-5-1.png", "https://example.com/a.jpg"]), svgLib.findExternalImageRefs(extSvg).join(","));
check("ảnh ngoài: ảnh nhúng data: không tính", svgLib.findExternalImageRefs(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="data:image/png;base64,AAA" x="0" y="0" width="1" height="1"/></svg>`).length === 0);
check("ảnh ngoài: mẫu test không có ảnh ngoài", svgLib.findExternalImageRefs(svgText).length === 0);
const extTpl = svgLib.parseSvgTemplate(extSvg, "ext.svg");
check("ảnh ngoài: parse ghi externalImages", eqArr(extTpl.externalImages, ["Untitled-5-1.png", "https://example.com/a.jpg"]), extTpl.externalImages.join(","));
check("ảnh ngoài: parse cảnh báo đúng câu đã chốt", extTpl.warnings.includes(svgLib.EXTERNAL_IMAGE_WARNING), extTpl.warnings.join(" | "));
check("ảnh ngoài: không cảnh báo trùng ý (chỉ một câu)", extTpl.warnings.filter((w) => w.includes("Ảnh") || w.includes("ảnh link ngoài")).length === 1, extTpl.warnings.join(" | "));
check("ảnh ngoài: mẫu test không cảnh báo ảnh nền", !tpl.warnings.some((w) => w.includes("Ảnh nền chưa gắn")));
check("ảnh ngoài: ảnh link ngoài vẫn bị bỏ khỏi SVG đã làm sạch", !extTpl.svgText.includes("Untitled-5-1.png") && !extTpl.svgText.includes("example.com"));
check("ảnh ngoài: ảnh nhúng data: vẫn giữ trong SVG đã làm sạch", extTpl.svgText.includes("data:image/png"));

// ---- 13. tspan cùng dòng khác x KHÔNG xuống dòng (lỗi ngày file thật) ----
// Illustrator xuất mỗi mảnh chữ ("21", ".", "11", ...) thành một tspan với
// x tuyệt đối để canh kerning — một dòng ngày bị trích thành 5 dòng rồi ghi
// lại thành 5 tspan xếp dọc (dy="1.2em"). Chỉ y/dy đổi dòng mới xuống dòng.
const MARK = "\u200B";
const kernSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><g id="date.le.ngay"><text><tspan x="0" y="0">${MARK}</tspan><tspan x="0" y="0">21</tspan><tspan x="31.7" y="0">${MARK}</tspan><tspan x="31.7" y="0">.</tspan><tspan x="39.7" y="0">${MARK}</tspan><tspan x="39.7" y="0">11</tspan><tspan x="71.4" y="0">${MARK}</tspan><tspan x="71.4" y="0">.</tspan><tspan x="79.4" y="0">${MARK}${MARK}</tspan><tspan x="79.4" y="0">2026</tspan><tspan x="142.8" y="0">${MARK}</tspan></text></g></svg>`;
const kernTpl = svgLib.parseSvgTemplate(kernSvg, "kern.svg");
const kernVal = kernTpl.fields.find((f) => f.key === "date.le.ngay")?.value;
check("tspan cùng dòng khác x: ngày giữ một dòng", kernVal === "21.11.2026", JSON.stringify(kernVal));
check("tspan cùng dòng khác x: bóc hết marker U+200B",
  kernVal !== undefined && !kernVal.includes("\u200B"), JSON.stringify(kernVal));
const kernOut = svgLib.serializeSvg(svgLib.parseXml(kernSvg), { "date.le.ngay": "21.11.2026" }, { markFields: false });
check("tspan cùng dòng khác x: ghi lại không còn tspan dọc dy",
  !kernOut.includes('dy="1.2em"') && kernOut.includes("21.11.2026"), kernOut.slice(0, 240));
const multiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><g id="pos1.diachi"><text><tspan x="0" y="0">Thôn Chư Kbô</tspan><tspan x="0" y="20">Xã Krông Búk</tspan></text></g></svg>`;
const multiTpl = svgLib.parseSvgTemplate(multiSvg, "multi.svg");
check("tspan đổi y: vẫn xuống dòng thật",
  multiTpl.fields.find((f) => f.key === "pos1.diachi")?.value === "Thôn Chư Kbô\nXã Krông Búk",
  JSON.stringify(multiTpl.fields.find((f) => f.key === "pos1.diachi")?.value));
const dySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><g id="pos1.diachi"><text><tspan x="0">Dòng 1</tspan><tspan x="0" dy="1.2em">Dòng 2</tspan><tspan x="0" dy="0"> tiếp</tspan></text></g></svg>`;
const dyTpl = svgLib.parseSvgTemplate(dySvg, "dy.svg");
check("tspan dy=1.2em: xuống dòng; dy=0: cùng dòng",
  dyTpl.fields.find((f) => f.key === "pos1.diachi")?.value === "Dòng 1\nDòng 2 tiếp",
  JSON.stringify(dyTpl.fields.find((f) => f.key === "pos1.diachi")?.value));

// ---- 14. giải mã id Illustrator (_xHH_) + khóa ghép + cửa kiểm tra ----
// Illustrator mã hóa ký tự đặc biệt trong id thành _xHH_ (đúng 2 hex):
// _x7B_={, _x7D_=}, _x5F_=_, _x28_=(, _x29_=). Khóa ngày/giờ là khóa
// GHÉP ({date.le.ngay}.{date.le.thang}.{date.le.nam}) phải tách thành
// từng phần; khóa namyy (date.tiec.namyy — năm 2 chữ số, KHÔNG phải lỗi
// chính tả) giữ nguyên làm khóa dẫn xuất riêng, KHÔNG gộp vào date.tiec.nam;
// {pos1.diachi}1 là lần xuất hiện thứ 2 của pos1.diachi.
check("giải mã id: _x7B_/_x5F_/_x7D_ → {pos1.con_full}",
  svgLib.decodeIllustratorId("_x7B_pos1.con_x5F_full_x7D_") === "{pos1.con_full}",
  svgLib.decodeIllustratorId("_x7B_pos1.con_x5F_full_x7D_"));
check("giải mã id: _x28_/_x29_ → ( )",
  svgLib.decodeIllustratorId("a_x28_b_x29_c") === "a(b)c",
  svgLib.decodeIllustratorId("a_x28_b_x29_c"));
check("giải mã id: không có mã thì giữ nguyên",
  svgLib.decodeIllustratorId("pos1.ong") === "pos1.ong");
check("khóa ghép: tách 3 phần ngày lễ",
  JSON.stringify(svgLib.splitCompositeKey("{date.le.ngay}.{date.le.thang}.{date.le.nam}").keys) ===
    JSON.stringify(["date.le.ngay", "date.le.thang", "date.le.nam"]));
check("khóa ghép: tách 2 phần giờ tiệc, dấu phân cách là :",
  (() => { const s = svgLib.splitCompositeKey("{date.tiec.gio}:{date.tiec.phut}"); return s.keys.length === 2 && s.separators[0] === ":"; })());
check("khóa ghép: namyy là khóa dẫn xuất, giữ nguyên (không gộp vào nam)",
  JSON.stringify(svgLib.normalizeCompositeKeys(["date.tiec.ngay", "date.tiec.thang", "date.tiec.namyy"])) ===
    JSON.stringify(["date.tiec.ngay", "date.tiec.thang", "date.tiec.namyy"]));
check("namyy: đọc '26' → 2026; '2026' → 2026; rỗng → ''",
  cep.resolveNamyyYear("26") === "2026" && cep.resolveNamyyYear("2026") === "2026" && cep.resolveNamyyYear("") === "",
  `${cep.resolveNamyyYear("26")}/${cep.resolveNamyyYear("2026")}`);
check("namyy: ghi giữ nguyên số chữ số (gốc '26' → '27'; gốc '2026' → '2027')",
  cep.formatNamyyYear("2027", "26") === "27" && cep.formatNamyyYear("2027", "2026") === "2027",
  `${cep.formatNamyyYear("2027", "26")}/${cep.formatNamyyYear("2027", "2026")}`);
check("namyy: isNamyyKey chỉ nhận date.le/tiec.namyy",
  cep.isNamyyKey("date.tiec.namyy") && cep.isNamyyKey("date.le.namyy") && !cep.isNamyyKey("date.tiec.nam") && !cep.isNamyyKey("pos1.vithu"));
check("khóa ghép: {pos1.diachi}1 → pos1.diachi (hậu tố số ngoài ngoặc)",
  svgLib.splitCompositeKey(svgLib.decodeIllustratorId("_x7B_pos1.diachi_x7D_1")).keys[0] === "pos1.diachi");

// SVG mô phỏng file thật của Nancy: id mã hóa _xHH_, ngày lễ + ngày tiệc
// + giờ tiệc là khóa ghép, tên là khóa đơn mã hóa, ong/ba chỉ còn hình vẽ.
const realLikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200">
<g id="_x7B_date.le.ngay_x7D_._x7B_date.le.thang_x7D_._x7B_date.le.nam_x7D_"><text><tspan x="0" y="0">${MARK}</tspan><tspan x="0" y="0">21</tspan><tspan x="31" y="0">${MARK}</tspan><tspan x="31" y="0">.</tspan><tspan x="39" y="0">${MARK}</tspan><tspan x="39" y="0">11</tspan><tspan x="71" y="0">${MARK}</tspan><tspan x="71" y="0">.</tspan><tspan x="79" y="0">${MARK}${MARK}</tspan><tspan x="79" y="0">2026</tspan><tspan x="142" y="0">${MARK}</tspan></text></g>
<g id="_x7B_pos1.con_x5F_full_x7D_"><text x="400" y="380">Y Hi Hdiar</text></g>
<g id="_x7B_pos2.con_x5F_full_x7D_"><text x="400" y="420">H' Chang Kưn Niê</text></g>
<g id="_x7B_date.tiec.ngay_x7D_._x7B_date.tiec.thang_x7D_._x7B_date.tiec.namyy_x7D_"><text><tspan x="0" y="0">${MARK}</tspan><tspan x="0" y="0">21</tspan><tspan x="31" y="0">${MARK}</tspan><tspan x="31" y="0">.</tspan><tspan x="39" y="0">${MARK}</tspan><tspan x="39" y="0">11</tspan><tspan x="71" y="0">${MARK}</tspan><tspan x="71" y="0">.</tspan><tspan x="79" y="0">${MARK}${MARK}</tspan><tspan x="79" y="0">2026</tspan><tspan x="142" y="0">${MARK}</tspan></text></g>
<g id="_x7B_date.tiec.gio_x7D_:_x7B_date.tiec.phut_x7D_"><text><tspan x="0" y="0">${MARK}${MARK}</tspan><tspan x="0" y="0">11</tspan><tspan x="20" y="0">${MARK} GIỜ ${MARK}${MARK}</tspan><tspan x="80" y="0">00</tspan><tspan x="100" y="0">${MARK}</tspan></text></g>
<g id="_x7B_pos1.ong_x7D_"><path d="M0 0h10v10H0z"/></g>
<g id="_x7B_pos1.diachi_x7D_1"><path d="M0 0h10v10H0z"/></g>
</svg>`;
const realTpl = svgLib.parseSvgTemplate(realLikeSvg, "real-like.svg");
const realAt = (k) => realTpl.fields.find((f) => f.key === k)?.value;
const realCepCount = realTpl.fields.filter((f) => f.kind === "cep" && f.value.trim() !== "").length;
const realNamyyCount = realTpl.fields.filter((f) => f.key === "date.tiec.namyy" && f.value.trim() !== "").length;
check("file thật: nhận đúng 9 khóa CEP + 1 khóa namyy kèm giá trị (5 khung chữ sống)",
  realCepCount === 9 && realNamyyCount === 1, `cep=${realCepCount} namyy=${realNamyyCount}`);
check("file thật: ngày lễ tách 21/11/2026, kind cep",
  realAt("date.le.ngay") === "21" && realAt("date.le.thang") === "11" && realAt("date.le.nam") === "2026" &&
  realTpl.fields.find((f) => f.key === "date.le.ngay")?.kind === "cep",
  `ngày=${realAt("date.le.ngay")}/${realAt("date.le.thang")}/${realAt("date.le.nam")}`);
check("file thật: tên cô dâu chú rể là khóa CEP (không còn chữ thường)",
  realAt("pos1.con_full") === "Y Hi Hdiar" && realAt("pos2.con_full") === "H' Chang Kưn Niê" &&
  realTpl.fields.find((f) => f.key === "pos1.con_full")?.kind === "cep");
check("file thật: namyy giữ nguyên giá trị gốc '2026' (4 chữ số), đọc ra năm 2026",
  realAt("date.tiec.namyy") === "2026" && cep.resolveNamyyYear(realAt("date.tiec.namyy")) === "2026" &&
  realTpl.fields.find((f) => f.key === "date.tiec.namyy")?.kind === "generic",
  realAt("date.tiec.namyy"));
// Khung namyy 2 chữ số ("26") → đọc thành năm 2026 khi đổ về dữ liệu thiệp.
const yySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><g id="_x7B_date.tiec.ngay_x7D_._x7B_date.tiec.thang_x7D_._x7B_date.tiec.namyy_x7D_"><text><tspan x="0" y="0">${MARK}</tspan><tspan x="0" y="0">21</tspan><tspan x="31" y="0">${MARK}</tspan><tspan x="31" y="0">.</tspan><tspan x="39" y="0">${MARK}</tspan><tspan x="39" y="0">11</tspan><tspan x="71" y="0">${MARK}</tspan><tspan x="71" y="0">.</tspan><tspan x="79" y="0">${MARK}${MARK}</tspan><tspan x="79" y="0">26</tspan><tspan x="110" y="0">${MARK}</tspan></text></g></svg>`;
const yyTpl = svgLib.parseSvgTemplate(yySvg, "yy.svg");
const yyMap = {};
for (const f of yyTpl.fields) yyMap[f.key] = f.value;
check("namyy 2 chữ số: khung đọc ra '26', đổ về dữ liệu thành ngày 2026-11-21",
  yyMap["date.tiec.namyy"] === "26" && cep.cepValuesToData(yyMap).date === "2026-11-21",
  `namyy=${yyMap["date.tiec.namyy"]} date=${cep.cepValuesToData(yyMap).date}`);
// Ghi lại: gốc 4 chữ số → "2027"; gốc 2 chữ số → "27".
const yyOut = svgLib.serializeSvg(svgLib.parseXml(yySvg),
  { "date.tiec.ngay": "22", "date.tiec.thang": "11", "date.tiec.nam": "2027" }, { markFields: false });
check("namyy ghi lại: gốc 2 chữ số '26' → đổi năm 2027 thành '27'",
  yyOut.includes("22.11.27") && !yyOut.includes("22.11.2027"), yyOut.slice(0, 200));
const realOutYear = svgLib.serializeSvg(svgLib.parseXml(realLikeSvg),
  { "date.tiec.ngay": "22", "date.tiec.thang": "11", "date.tiec.nam": "2027" }, { markFields: false });
check("namyy ghi lại: gốc 4 chữ số '2026' → đổi năm 2027 thành '2027'",
  realOutYear.includes("22.11.2027"), realOutYear.slice(0, 200));
// Hiển thị: năm đổi thì khung namyy đổi theo, giữ nguyên số chữ số gốc.
const yyDisp = svgLib.buildSvgDisplayValues(
  { ...example, date: "2027-11-21", ceremonyDate: "2027-11-21" }, {}, yyTpl.fields);
check("namyy hiển thị: dữ liệu năm 2027 + gốc '26' → hiện '27'",
  yyDisp["date.tiec.namyy"] === "27", yyDisp["date.tiec.namyy"]);
// Sửa trực tiếp khung namyy "27" → năm tiệc thành 2027.
const yyEdited = svgLib.applySvgFieldEdit({ ...example, date: "2026-11-21" }, "date.tiec.namyy", "27");
check("namyy sửa trực tiếp: gõ '27' → ngày tiệc thành 2027-11-21",
  yyEdited.date === "2027-11-21", yyEdited.date);
check("file thật: giờ tiệc tách 11/00",
  realAt("date.tiec.gio") === "11" && realAt("date.tiec.phut") === "00",
  `giờ=${realAt("date.tiec.gio")}:${realAt("date.tiec.phut")}`);
check("file thật: pos1.ong (chỉ hình vẽ) nằm trong danh sách thiếu",
  realTpl.missingCepKeys.includes("pos1.ong") && realTpl.missingCepKeys.includes("pos1.diachi"),
  realTpl.missingCepKeys.join(", "));
check("file thật: khóa có giá trị không nằm trong danh sách thiếu",
  !realTpl.missingCepKeys.includes("pos1.con_full") && !realTpl.missingCepKeys.includes("date.le.ngay"));
check("file thật: cảnh báo liệt kê rõ khóa thiếu giá trị",
  realTpl.warnings.some((w) => w.includes("chưa có chữ sống") && w.includes("pos1.ong")),
  realTpl.warnings.join(" | "));
// Ghép lại khi render: sửa ngày lễ → "22.11.2026" một dòng, giờ tiệc giữ " GIỜ ".
const realOut = svgLib.serializeSvg(svgLib.parseXml(realLikeSvg),
  { "date.le.ngay": "22", "date.le.thang": "11", "date.le.nam": "2026",
    "date.tiec.gio": "11", "date.tiec.phut": "00" }, { markFields: true });
check("ghép lại: ngày lễ sửa thành 22.11.2026 một dòng",
  realOut.includes("22.11.2026") && !realOut.includes('dy="1.2em"'), realOut.slice(0, 300));
check("ghép lại: giờ tiệc giữ đúng dạng '11 GIỜ 00'",
  realOut.includes("11 GIỜ 00"), realOut.slice(0, 300));
check("ghép lại: data-field của cụm ngày là khóa phần đầu (mở lịch)",
  realOut.includes('data-field="date.le.ngay"') && realOut.includes('data-field="date.tiec.gio"'),
  realOut.slice(0, 300));
// SVG thường không có tên lớp nào → 0 khóa CEP (cửa kiểm tra sẽ hủy).
const plainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="10" y="20">Chào mừng</text><text x="10" y="50">Ngày vui</text></svg>`;
const plainTpl = svgLib.parseSvgTemplate(plainSvg, "plain.svg");
check("SVG thường: 0 khóa CEP kèm giá trị (cửa kiểm tra hủy)",
  plainTpl.fields.filter((f) => f.kind === "cep" && f.value.trim() !== "").length === 0,
  `fields=${plainTpl.fields.length}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
