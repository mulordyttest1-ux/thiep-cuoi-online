// Test trang khách mẫu form in (PrintFormPreview) + link khách /khach/ +
// khóa link sau chốt (cờ localStorage cho link ?d=, khóa THEO BASE — cờ cũ
// "1" không còn khóa) + bản lưu dữ liệu khách sửa cho link ?d= (snapshot
// localStorage: lưu/khôi phục, dấu "Đã sửa" sau khôi phục, link đã chốt chứa
// dữ liệu mới) + link đã chốt mang câu mẫu đã sửa trong ?c= (mở trên máy
// khác vẫn thấy danh sách sửa tay). ?c= mang payload {customTexts,
// initialMessage} — initialMessage là message GỐC lúc mở link lần đầu để
// máy khác tính đúng diff "Lời mời"; link cũ chưa mang initialMessage vẫn
// đọc được (dùng message trong ?d= làm gốc).
//   ./node_modules/.bin/tsc src/lib/custom-texts.ts src/lib/cep.ts src/lib/lunar.ts src/lib/store.ts src/lib/types.ts src/lib/access.ts --outDir /tmp/printform-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop --lib es2022,dom
//   NODE_PATH=$PWD/node_modules node scripts/test_printform.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// localStorage giả cho Node (store.ts dùng window.localStorage trong try/catch).
const __ls = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (__ls.has(k) ? __ls.get(k) : null),
    setItem: (k, v) => {
      __ls.set(k, String(v));
    },
    removeItem: (k) => {
      __ls.delete(k);
    },
  },
};

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

// ---- 6. Khóa link sau chốt (?d=): cờ localStorage theo id + base ----
check("khóa cờ có tên theo id", store.customerConfirmedKey("thiep-abc") === "td_customer_confirmed_thiep-abc");
check("chưa chốt thì không khóa", store.isCustomerConfirmed("thiep-abc", vuQuy) === false);
const editedBase = { ...vuQuy, groomName: "Trần Văn Mới", ceremonyTime: "20:00" };
store.markCustomerConfirmed("thiep-abc", vuQuy, editedBase);
check("chốt rồi mở lại link cũ (base khớp) thì khóa", store.isCustomerConfirmed("thiep-abc", vuQuy) === true);
check("chốt rồi mở link đã chốt (?d= dữ liệu đã sửa) thì khóa", store.isCustomerConfirmed("thiep-abc", editedBase) === true);
const linkMoi = { ...vuQuy, groomName: "Trần Văn Mới Nhất", date: "2026-11-02" };
check("link mới cùng id nhưng base khác thì KHÔNG khóa", store.isCustomerConfirmed("thiep-abc", linkMoi) === false);
check("id khác thì không khóa", store.isCustomerConfirmed("thiep-khac", vuQuy) === false);
check(
  "ghi cờ không lỗi",
  (() => {
    store.markCustomerConfirmed("thiep-ghi", vuQuy, editedBase);
    return store.isCustomerConfirmed("thiep-ghi", vuQuy);
  })() === true
);
// Cờ cũ "1" (trước khi khóa theo base) KHÔNG còn khóa nữa.
globalThis.window.localStorage.setItem(store.customerConfirmedKey("thiep-cu"), "1");
check("cờ cũ \"1\" không còn khóa (bỏ tương thích ngược)", store.isCustomerConfirmed("thiep-cu", vuQuy) === false);
globalThis.window.localStorage.setItem(store.customerConfirmedKey("thiep-rac"), "khong-phai-json");
check("giá trị cờ rác cũng không khóa", store.isCustomerConfirmed("thiep-rac", vuQuy) === false);

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
check("editor khóa sau chốt ở link ?d= theo base", ed.includes("markCustomerConfirmed(invitationId,") && ed.includes("isCustomerConfirmed(invitationId,"));

// ---- 9. Nút link khách ở tao-thiep trỏ tới /khach/ ----
const tt = readSrc("src/app/(app)/tao-thiep/page.tsx");
check("tao-thiep dùng buildCustomerEditUrl", tt.includes("buildCustomerEditUrl"));
check("tao-thiep không còn link /tao-thiep?d= cho khách", !tt.includes("/tao-thiep?d="));
check("label ô link khách nói trang khách", tt.includes("mở trang khách"));

// ---- 10. Bản lưu dữ liệu khách sửa cho link ?d= (snapshot localStorage) ----
check("khóa bản lưu có tên theo id", store.customerDataKey("thiep-abc") === "td_customer_data_thiep-abc");
const edited = { ...vuQuy, groomName: "Trần Văn Mới", ceremonyTime: "20:00" };
const snapTexts = { printCeremonyTitle: "LỄ ĐƯỢC TỔ CHỨC TẠI" };
check("lưu snapshot không lỗi", store.saveCustomerSnapshot("thiep-abc", vuQuy, edited, snapTexts) === true);
const loaded = store.loadCustomerSnapshot("thiep-abc");
check("khôi phục snapshot ra đúng tên đã sửa", loaded !== null && loaded.data.groomName === "Trần Văn Mới", loaded?.data?.groomName ?? "null");
check("khôi phục snapshot giữ câu mẫu đã sửa", loaded !== null && loaded.customTexts.printCeremonyTitle === "LỄ ĐƯỢC TỔ CHỨC TẠI", JSON.stringify(loaded?.customTexts));
check("khôi phục snapshot giữ base gốc", loaded !== null && loaded.base.groomName === "Trần Thanh Long", loaded?.base?.groomName ?? "null");
check("dữ liệu gốc không bị sửa theo", vuQuy.groomName === "Trần Thanh Long" && vuQuy.ceremonyTime === "19:15");
const diff = store.diffEditedFields(vuQuy, edited);
check("diff: tên chú rể đã sửa", diff.includes("groomName"), JSON.stringify(diff));
check("diff: tên cô dâu không đổi nên không đánh dấu", !diff.includes("brideName"), JSON.stringify(diff));
check("diff: đổi giờ lễ thì đánh dấu khối ngày lễ", diff.includes("ceremonyDate") && !diff.includes("ceremonyTime"), JSON.stringify(diff));
const timeOnly = { ...vuQuy, time: "12:30" };
const diffTime = store.diffEditedFields(vuQuy, timeOnly);
check("diff: đổi giờ tiệc thì đánh dấu khối ngày tiệc", diffTime.includes("date") && !diffTime.includes("time"), JSON.stringify(diffTime));
check("diff: không đổi gì thì rỗng", store.diffEditedFields(vuQuy, { ...vuQuy }).length === 0);
check("same: dữ liệu giống nhau", store.sameCustomerData(vuQuy, { ...vuQuy }) === true);
check("same: dữ liệu khác nhau", store.sameCustomerData(vuQuy, edited) === false);
check("same: id khác nhau thì không giống", store.sameCustomerData(vuQuy, { ...vuQuy, id: "khac" }) === false);
globalThis.window.localStorage.setItem(store.customerDataKey("thiep-hong"), "{khong-phai-json");
check("snapshot hỏng (JSON sai) thì trả null", store.loadCustomerSnapshot("thiep-hong") === null);
store.saveCustomerSnapshot("thiep-thieu", vuQuy, { ...vuQuy, groomName: "" }, {});
check("snapshot thiếu tên thì trả null", store.loadCustomerSnapshot("thiep-thieu") === null);
check("chưa có snapshot thì trả null", store.loadCustomerSnapshot("thiep-chua-co") === null);
// Link đã chốt chứa dữ liệu MỚI trong ?d= (khách gửi link này cho Nancy).
const confirmedUrl = store.buildCustomerEditUrl(origin, edited);
const confirmedBack = store.decodeShare(confirmedUrl.split("?d=")[1]);
check("link đã chốt ?d= chứa tên đã sửa", confirmedBack !== null && confirmedBack.groomName === "Trần Văn Mới", confirmedBack?.groomName ?? "null");
check("link đã chốt vẫn trỏ /khach/", confirmedUrl.startsWith(`${origin}/khach/thiep-printform-test?d=`));

// ---- 11. Nguồn: trang khách khôi phục snapshot + editor lưu + nút link đã chốt ----
const khach = readSrc("src/app/(khach)/khach/[id]/page.tsx");
check("trang khách khôi phục snapshot theo id", khach.includes("loadCustomerSnapshot(id)") && khach.includes("sameCustomerData(snap.base, inv)"));
check("trang khách tính dấu sửa từ diff", khach.includes("diffEditedFields(inv, effective)"));
check("trang khách truyền dữ liệu gốc làm base", khach.includes("originalData={original ?? undefined}"));
check("editor lưu snapshot khi đóng box sửa", ed.includes("saveCustomerSnapshot(") && ed.includes("originalData ?? dataRef.current"));
check("editor lưu snapshot khi chốt", ed.includes("markCustomerConfirmed(invitationId,") && ed.includes("saveCustomerSnapshot("));
check("editor có nút Sao chép link đã chốt", ed.includes("Sao chép link đã chốt") && ed.includes("copyConfirmedLink"));
check("editor không còn nói Nancy lấy chữ từ đây", !ed.includes("Nancy sẽ lấy chữ từ đây"));
check("editor dặn gửi link đã chốt cho Nancy", ed.includes("Gửi link đã chốt bên dưới cho Nancy"));

// ---- 12. Link đã chốt LUÔN mang ?c= (kể cả {} rỗng khi không sửa câu mẫu) ----
// ?c= mang payload {customTexts, initialMessage} — initialMessage là message
// GỐC lúc khách mở link lần đầu (trước khi sửa), để máy khác mở link đã
// chốt vẫn tính đúng diff cho trường "Lời mời".
const ctEdited = { printCeremonyTitle: "LỄ ĐƯỢC TỔ CHỨC TẠI", printPartyIntro: "MỜI ĐẾN DỰ TIỆC CÙNG GIA ĐÌNH" };
const urlWithC = store.buildCustomerEditUrl(origin, edited, ctEdited, "");
check("link đã chốt có ?c=", urlWithC.includes("&c="), urlWithC.slice(0, 140));
const cParam = new URL(urlWithC).searchParams.get("c");
const cBack = store.decodeCustomTexts(cParam);
check(
  "?c= giải mã ra đúng câu mẫu đã sửa",
  cBack !== null && cBack.customTexts.printCeremonyTitle === "LỄ ĐƯỢC TỔ CHỨC TẠI" && cBack.customTexts.printPartyIntro === "MỜI ĐẾN DỰ TIỆC CÙNG GIA ĐÌNH",
  JSON.stringify(cBack)
);
check("?c= mang initialMessage gốc", cBack !== null && cBack.initialMessage === "", JSON.stringify(cBack));
check("không truyền customTexts thì link không có ?c=", !store.buildCustomerEditUrl(origin, edited).includes("&c="));
check("customTexts {} vẫn ra link có ?c=", store.buildCustomerEditUrl(origin, edited, {}).includes("&c="));
const urlEmptyC = store.buildCustomerEditUrl(origin, edited, {}, "");
const cParamEmpty = new URL(urlEmptyC).searchParams.get("c");
const cBackEmpty = store.decodeCustomTexts(cParamEmpty);
check("?c= rỗng giải mã ra customTexts {} + initialMessage gốc", cBackEmpty !== null && Object.keys(cBackEmpty.customTexts).length === 0 && cBackEmpty.initialMessage === "", JSON.stringify(cBackEmpty));
check(
  "link đã chốt không sửa câu mẫu vẫn có ?c= và ?d= đúng tên đã sửa",
  urlEmptyC.includes("&c=") && store.decodeShare(urlEmptyC.split("?d=")[1].split("&")[0])?.groomName === "Trần Văn Mới",
  urlEmptyC.slice(0, 140)
);
const urlNoIm = store.buildCustomerEditUrl(origin, edited, {});
const cNoIm = store.decodeCustomTexts(new URL(urlNoIm).searchParams.get("c"));
check("không truyền initialMessage thì ?c= không có initialMessage", cNoIm !== null && cNoIm.initialMessage === undefined, JSON.stringify(cNoIm));
check("decode ?c= sai trả null", store.decodeCustomTexts("!!!khong-phai-base64") === null);
check("decode ?c= null trả null", store.decodeCustomTexts(null) === null);
check("decode ?c= rỗng trả null", store.decodeCustomTexts("") === null);
const manualFromC = ct.buildManualList(cBack?.customTexts ?? {}, edited, "");
check(
  "câu mẫu từ ?c= vào danh sách sửa tay đúng",
  manualFromC.length === 2 &&
    manualFromC.some((m) => m.key === "printCeremonyTitle" && m.newValue === "LỄ ĐƯỢC TỔ CHỨC TẠI") &&
    manualFromC.some((m) => m.key === "printPartyIntro" && m.newValue === "MỜI ĐẾN DỰ TIỆC CÙNG GIA ĐÌNH"),
  JSON.stringify(manualFromC)
);
// ---- 12b. Lời mời sửa -> link đã chốt mang message gốc trong ?c= ----
// Khách sửa Lời mời (message "" -> "Kính Mời Quý Khách!") rồi chốt: link đã
// chốt mang initialMessage "" trong ?c=, máy khác mở link vẫn tính đúng
// mục "Lời mời" cũ (trống) -> mới.
const editedMsg = { ...edited, message: "Kính Mời Quý Khách!" };
const urlMsg = store.buildCustomerEditUrl(origin, editedMsg, {}, "");
const cMsg = store.decodeCustomTexts(new URL(urlMsg).searchParams.get("c"));
check("?c= của link chốt sau khi sửa Lời mời mang initialMessage gốc", cMsg !== null && cMsg.initialMessage === "" && Object.keys(cMsg.customTexts).length === 0, JSON.stringify(cMsg));
const manualMsg = ct.buildManualList(cMsg?.customTexts ?? {}, editedMsg, cMsg?.initialMessage);
check(
  "mở link đã chốt trên máy khác: danh sách sửa tay có mục Lời mời cũ (trống) -> mới",
  manualMsg.length === 1 && manualMsg[0].key === "message" && manualMsg[0].label === "Lời mời" && manualMsg[0].oldValue === "" && manualMsg[0].newValue === "Kính Mời Quý Khách!",
  JSON.stringify(manualMsg)
);
const manualNoMsg = ct.buildManualList({}, edited, "");
check("không sửa Lời mời thì danh sách sửa tay không có mục message", manualNoMsg.length === 0, JSON.stringify(manualNoMsg));
// ?c= dạng cũ (cả object là customTexts, chưa có initialMessage) vẫn đọc được.
const oldC = Buffer.from(JSON.stringify(ctEdited), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const oldBack = store.decodeCustomTexts(oldC);
check("?c= dạng cũ (cả object là customTexts) vẫn đọc được", oldBack !== null && oldBack.customTexts.printCeremonyTitle === "LỄ ĐƯỢC TỔ CHỨC TẠI" && oldBack.initialMessage === undefined, JSON.stringify(oldBack));
const manualOld = ct.buildManualList(oldBack?.customTexts ?? {}, editedMsg, editedMsg.message);
check("link cũ: message trong ?d= làm gốc nên không có mục Lời mời giả", manualOld.length === 2 && manualOld.every((m) => m.key !== "message") && manualOld.some((m) => m.key === "printCeremonyTitle"), JSON.stringify(manualOld));
check("trang khách đọc ?c=", khach.includes("decodeCustomTexts") && khach.includes('search.get("c")'));
check("trang khách coi link có ?c= là link đã chốt", khach.includes("initialConfirmed={confirmedLinkOpened}"));
check("trang khách coi link có ?c= rỗng là link đã chốt", khach.includes("setConfirmedLinkOpened(linkConfirmed !== null)"));
check("editor nhận prop link đã chốt", ed.includes("initialConfirmed?: boolean"));
check("editor có prop initialMessageFromLink", ed.includes("initialMessageFromLink?: string"));
check("editor ưu tiên message trong ?c= rồi message gốc trong ?d=", ed.includes("initialMessageFromLink ?? originalData?.message"));
check("editor truyền customTexts + initialMessage vào link đã chốt", ed.includes("buildCustomerEditUrl(window.location.origin, dataRef.current, customTextsRef.current, initialMessageRef.current)"));
check("editor truyền customTexts + initialMessage khi mở lại link đã chốt", ed.includes("buildCustomerEditUrl(window.location.origin, initialData, customTextsRef.current, initialMessageRef.current)"));
check("trang khách truyền initialMessage từ ?c= vào editor", khach.includes("initialMessageFromLink={confirmedInitialMessage}"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
