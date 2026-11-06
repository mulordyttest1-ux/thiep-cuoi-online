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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
