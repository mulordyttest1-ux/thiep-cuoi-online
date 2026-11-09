// Test giai đoạn 2 — backend máy chủ + bảng duyệt + thông báo chốt:
// chuyển trạng thái (confirm/review/reopen), mapping tab duyệt + đếm banner,
// canEdit/isLocked/isPrintConfirmed/previewAccess, mapping dòng Supabase
// (recordToRow/rowToRecord + mặc định khi thiếu cột), isSupabaseConfigured,
// storeKind (file / none / supabase), cookie phiên admin + isAdminRequest,
// KHÔNG cache lần đọc Supabase (sbFetch cache no-store — lỗi live 09/11),
// mở lại phải xóa mốc chốt (reopen/unlock — lỗi live 09/11),
// và vòng đời file-store (upsert/get/list/update + khóa chốt in).
//   printf '%s' '{"compilerOptions":{"baseUrl":"'$PWD'","paths":{"@/*":["src/*"]},"outDir":"/tmp/duyet-test-out","module":"commonjs","target":"es2022","moduleResolution":"node","skipLibCheck":true,"esModuleInterop":true,"lib":["es2022","dom"],"types":["node"],"typeRoots":["'$PWD'/node_modules/@types"]},"include":["'$PWD'/src/lib/access.ts","'$PWD'/src/lib/supabase.ts","'$PWD'/src/lib/server-store.ts","'$PWD'/src/lib/server-auth.ts","'$PWD'/src/lib/admin-session.ts","'$PWD'/src/lib/payment.ts","'$PWD'/src/lib/types.ts","'$PWD'/src/lib/physical-forms.ts"]}' > /tmp/duyet-tsconfig.json
//   (include phải là đường dẫn tuyệt đối vì tsconfig nằm ở /tmp; types node bắt buộc vì các lib dùng Buffer/process/fs/crypto)
//   ./node_modules/.bin/tsc -p /tmp/duyet-tsconfig.json
//   sed -i 's|@/lib/|./|g' /tmp/duyet-test-out/*.js   # tsc không viết lại alias @/ -> ./ khi emit
//   NODE_PATH=$PWD/node_modules node scripts/test_duyet.mjs
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const outDir = process.env.DUYET_TEST_OUT || "/tmp/duyet-test-out";

// THIEP_ADMIN_TOKEN được đọc 1 lần lúc import payment.ts — phải đặt env
// TRƯỚC khi require bất kỳ module nào đã biên dịch.
process.env.THIEP_ADMIN_TOKEN = "test-admin-123";
// File store ghi vào process.cwd()/data/invitations.json lúc import —
// chuyển sang thư mục tạm để test không động vào data/ thật của repo.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "duyet-test-"));
process.chdir(tmpDir);

const acc = require(path.join(outDir, "access.js"));
const sup = require(path.join(outDir, "supabase.js"));
const store = require(path.join(outDir, "server-store.js"));
const auth = require(path.join(outDir, "server-auth.js"));
const adm = require(path.join(outDir, "admin-session.js"));
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (p) => fs.readFileSync(path.join(repoRoot, p), "utf8");

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log("FAIL:", name);
  }
}

// --- STATUS_LABEL: đủ mọi trạng thái, không có chữ chuyên môn lộ ra khách ---
const ALL_STATUSES = ["draft", "preview_for_print", "locked_for_print", "confirmed", "reviewed", "printed", "paid_online"];
check("STATUS_LABEL đủ 7 trạng thái", ALL_STATUSES.every((s) => typeof acc.STATUS_LABEL[s] === "string" && acc.STATUS_LABEL[s].length > 0));
check("confirmed có nhãn chờ duyệt", acc.STATUS_LABEL.confirmed.includes("chờ duyệt"));
check("reviewed có nhãn đã duyệt", acc.STATUS_LABEL.reviewed.includes("Đã duyệt"));
check("printed có nhãn đã in", acc.STATUS_LABEL.printed.includes("Đã in"));

function makeRec(status, extra = {}) {
  return {
    id: "thiep-test-1",
    data: { id: "thiep-test-1", groomName: "Văn A", brideName: "Thị B", date: "2026-12-05", time: "18:00", venue: "Tư gia" },
    status,
    previewToken: "pt",
    editToken: "et",
    guestToken: "gt",
    guestTokens: {},
    paymentMemo: "TD-TEST1",
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    lockedAt: null,
    previewExpiresAt: null,
    paidAt: null,
    paidAmount: null,
    paidRef: null,
    paidTemplateId: null,
    paidMemo: null,
    reconcileLog: [],
    customerConfirmedAt: null,
    customTexts: {},
    editedFields: [],
    chat: [],
    history: [],
    manualList: [],
    ...extra,
  };
}

// --- confirmRecord: khách chốt -> confirmed + giờ chốt ---
{
  const t = new Date("2026-11-09T10:00:00.000Z");
  const c = acc.confirmRecord(makeRec("draft"), t);
  check("confirm: draft -> confirmed", c.status === "confirmed");
  check("confirm: ghi customerConfirmedAt", c.customerConfirmedAt === "2026-11-09T10:00:00.000Z");
  check("confirm: updatedAt = giờ chốt", c.updatedAt === "2026-11-09T10:00:00.000Z");
  check("confirm: giữ nguyên dữ liệu", c.data.groomName === "Văn A");
}

// --- reviewRecord: luồng duyệt chặt ---
{
  const ok = (r) => r.ok === true;
  check("review: confirmed -> reviewed", ok(acc.reviewRecord(makeRec("confirmed"), "reviewed")) && acc.reviewRecord(makeRec("confirmed"), "reviewed").rec.status === "reviewed");
  check("review: locked_for_print cũ -> reviewed", ok(acc.reviewRecord(makeRec("locked_for_print"), "reviewed")));
  check("review: reviewed -> printed", acc.reviewRecord(makeRec("reviewed"), "printed").rec.status === "printed");
  check("review: confirmed -> printed bị chặn", acc.reviewRecord(makeRec("confirmed"), "printed").ok === false);
  check("review: draft -> reviewed bị chặn", acc.reviewRecord(makeRec("draft"), "reviewed").ok === false);
  check("review: printed -> reviewed bị chặn", acc.reviewRecord(makeRec("printed"), "reviewed").ok === false);
  check("review: reopen confirmed -> draft", acc.reviewRecord(makeRec("confirmed"), "reopen").rec.status === "draft");
  check("review: reopen reviewed -> draft", acc.reviewRecord(makeRec("reviewed"), "reopen").rec.status === "draft");
  check("review: reopen printed -> draft", acc.reviewRecord(makeRec("printed"), "reopen").rec.status === "draft");
  check("review: reopen draft bị chặn", acc.reviewRecord(makeRec("draft"), "reopen").ok === false);
  check("review: paid_online không đổi được", acc.reviewRecord(makeRec("paid_online"), "reviewed").ok === false && acc.reviewRecord(makeRec("paid_online"), "reopen").ok === false);
  check("review: đổi trạng thái cập nhật updatedAt", acc.reviewRecord(makeRec("confirmed"), "reviewed").rec.updatedAt !== "2026-11-09T00:00:00.000Z");
}

// --- reopen/unlock: mở lại phải xóa mốc chốt (lỗi live 09/11) ---
// Trang khách khóa theo mốc chốt (initialConfirmedAt): mở lại mà giữ mốc
// cũ thì khách vẫn thấy câu cảm ơn + chỉ đọc dù trạng thái đã về nháp.
{
  const confirmedRec = (status) => makeRec(status, {
    customerConfirmedAt: "2026-11-09T09:36:00.000Z",
    lockedAt: "2026-11-09T09:36:00.000Z",
    editedFields: ["groomName"],
    customTexts: { printClosing: "Kính mời!" },
    history: [{ kind: "dữ liệu", label: "Tên chú rể", oldValue: "Văn A", newValue: "Văn A Sửa", at: "2026-11-09T09:35:00.000Z" }],
    manualList: [{ label: "Câu kết", cu: "Kính mời!", moi: "Kính mời quý khách!" }],
  });
  for (const s of ["confirmed", "reviewed", "printed", "locked_for_print"]) {
    const r = acc.reviewRecord(confirmedRec(s), "reopen");
    check(`reopen: ${s} -> draft + xóa mốc chốt`, r.ok === true && r.rec.status === "draft" && r.rec.customerConfirmedAt === null);
    check(`reopen: ${s} giữ token + dữ liệu khách đã sửa`, r.rec.editToken === "et" && r.rec.customTexts.printClosing === "Kính mời!" && r.rec.editedFields.includes("groomName") && r.rec.history.length === 1 && r.rec.manualList.length === 1);
    check(`reopen: ${s} xong sửa được lại`, acc.canEdit(r.rec.status) === true && acc.isPrintConfirmed(r.rec.status) === false);
  }
  // Chốt lại sau khi mở lại vẫn ghi mốc chốt mới.
  const reopened = acc.reviewRecord(confirmedRec("confirmed"), "reopen").rec;
  const reconfirmed = acc.confirmRecord(reopened, new Date("2026-11-09T11:00:00.000Z"));
  check("reopen: chốt lại được + ghi mốc chốt mới", reconfirmed.status === "confirmed" && reconfirmed.customerConfirmedAt === "2026-11-09T11:00:00.000Z");
  // unlockRecord (nút "Mở khóa để sửa" ở /tao-thiep): cùng lỗi, cùng sửa.
  const unlocked = acc.unlockRecord(confirmedRec("confirmed"));
  check("unlock: confirmed -> draft + xóa mốc chốt", unlocked.status === "draft" && unlocked.customerConfirmedAt === null);
  check("unlock: giữ token + lịch sử sửa", unlocked.editToken === "et" && unlocked.history.length === 1);
  const unlockedLocked = acc.unlockRecord(confirmedRec("locked_for_print"));
  check("unlock: locked_for_print -> draft + xóa mốc chốt", unlockedLocked.status === "draft" && unlockedLocked.customerConfirmedAt === null);
  check("unlock: xóa cả lockedAt", unlockedLocked.lockedAt === null);
}

// --- reviewTabOf / reviewTabCounts: tab + số lượng banner ---
{
  check("tab: confirmed -> pending", acc.reviewTabOf("confirmed") === "pending");
  check("tab: locked_for_print cũ -> pending", acc.reviewTabOf("locked_for_print") === "pending");
  check("tab: reviewed -> reviewed", acc.reviewTabOf("reviewed") === "reviewed");
  check("tab: printed -> printed", acc.reviewTabOf("printed") === "printed");
  check("tab: draft -> draft", acc.reviewTabOf("draft") === "draft");
  check("tab: preview_for_print -> draft", acc.reviewTabOf("preview_for_print") === "draft");
  check("tab: paid_online -> null (không nằm bảng duyệt)", acc.reviewTabOf("paid_online") === null);
  const counts = acc.reviewTabCounts([
    makeRec("confirmed"), makeRec("locked_for_print"), makeRec("reviewed"),
    makeRec("printed"), makeRec("draft"), makeRec("preview_for_print"), makeRec("paid_online"),
  ]);
  check("counts: all=7", counts.all === 7);
  check("counts: pending=2 (confirmed + locked cũ)", counts.pending === 2);
  check("counts: reviewed=1", counts.reviewed === 1);
  check("counts: printed=1", counts.printed === 1);
  check("counts: draft=2", counts.draft === 2);
}

// --- canEdit / isLocked / isPrintConfirmed / previewAccess: ma trận trạng thái ---
{
  const matrix = {
    draft: { edit: true, locked: false, print: false, preview: false },
    preview_for_print: { edit: true, locked: false, print: false, preview: true },
    locked_for_print: { edit: false, locked: true, print: true, preview: true },
    confirmed: { edit: false, locked: true, print: true, preview: true },
    reviewed: { edit: false, locked: true, print: true, preview: true },
    printed: { edit: false, locked: true, print: true, preview: true },
    paid_online: { edit: false, locked: true, print: false, preview: false },
  };
  for (const [s, m] of Object.entries(matrix)) {
    check(`matrix ${s}: canEdit=${m.edit}`, acc.canEdit(s) === m.edit);
    check(`matrix ${s}: isLocked=${m.locked}`, acc.isLocked(s) === m.locked);
    check(`matrix ${s}: isPrintConfirmed=${m.print}`, acc.isPrintConfirmed(s) === m.print);
    // previewAccess(rec, token) -> {allowed} — xem trước mở được cả sau
    // khi chốt in (demo online tải qua link này); draft chưa gửi thì chưa.
    check(`matrix ${s}: previewAccess=${m.preview}`, acc.previewAccess(makeRec(s), "pt").allowed === m.preview);
  }
  check("previewAccess: sai token -> false", acc.previewAccess(makeRec("confirmed"), "sai").allowed === false);
  check("previewAccess: paid_online -> false (reason paid)", acc.previewAccess(makeRec("paid_online"), "pt").allowed === false && acc.previewAccess(makeRec("paid_online"), "pt").reason === "paid");
  check("previewAccess: không có thiệp -> false", acc.previewAccess(null, "pt").allowed === false);
}

// --- Supabase: mapping dòng <-> bản ghi ---
{
  const rec = makeRec("confirmed", {
    customerConfirmedAt: "2026-11-09T10:00:00.000Z",
    customTexts: { printClosing: "Kính mời!" },
    editedFields: ["groomName"],
    chat: [{ from: "customer", text: "Chào Thiết kế", at: "2026-11-09T09:00:00.000Z" }],
    history: [{ kind: "edit", label: "Tên chú rể", oldValue: "A", newValue: "Văn A", at: "2026-11-09T09:00:00.000Z" }],
    manualList: [{ key: "printClosing", oldValue: "Kính Mời!", newValue: "Kính mời!" }],
    paidAmount: 100000,
    paidRef: "SEPAY-1",
  });
  const row = sup.recordToRow(rec);
  check("row: id giữ nguyên", row.id === "thiep-test-1");
  check("row: status=confirmed", row.status === "confirmed");
  check("row: confirmed_at map từ customerConfirmedAt", row.confirmed_at === "2026-11-09T10:00:00.000Z");
  check("row: data là object JSON", typeof row.data === "object" && row.data.groomName === "Văn A");
  check("row: custom_texts giữ khóa", row.custom_texts.printClosing === "Kính mời!");
  const back = sup.rowToRecord(row);
  check("round-trip: status", back.status === "confirmed");
  check("round-trip: customerConfirmedAt", back.customerConfirmedAt === "2026-11-09T10:00:00.000Z");
  check("round-trip: data", back.data.brideName === "Thị B" && back.data.date === "2026-12-05");
  check("round-trip: chat", back.chat.length === 1 && back.chat[0].text === "Chào Thiết kế");
  check("round-trip: history", back.history.length === 1 && back.history[0].newValue === "Văn A");
  check("round-trip: manualList", back.manualList.length === 1 && back.manualList[0].key === "printClosing");
  check("round-trip: paidAmount/paidRef", back.paidAmount === 100000 && back.paidRef === "SEPAY-1");
  check("round-trip: token", back.editToken === "et" && back.previewToken === "pt");
  // Dòng thiếu cột (bản ghi cũ) -> mặc định an toàn, không crash.
  const sparse = sup.rowToRecord({ id: "cu", data: { groomName: "X" } });
  check("sparse: status mặc định draft", sparse.status === "draft");
  check("sparse: chat/history/manualList mặc định []", Array.isArray(sparse.chat) && sparse.chat.length === 0 && Array.isArray(sparse.history) && sparse.history.length === 0 && Array.isArray(sparse.manualList));
  check("sparse: customTexts/editedFields mặc định", typeof sparse.customTexts === "object" && Array.isArray(sparse.editedFields));
  check("sparse: customerConfirmedAt null", sparse.customerConfirmedAt === null);
  check("sparse: token mặc định chuỗi rỗng", sparse.editToken === "" && sparse.previewToken === "" && sparse.guestToken === "");
}

// --- isSupabaseConfigured: hoán vị env ---
{
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const set = (u, k) => {
    if (u === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = u;
    if (k === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = k;
  };
  set(undefined, undefined);
  check("supabase: thiếu cả 2 -> false", sup.isSupabaseConfigured() === false);
  set("https://x.supabase.co", undefined);
  check("supabase: thiếu service key -> false", sup.isSupabaseConfigured() === false);
  set(undefined, "key-abc");
  check("supabase: thiếu URL -> false", sup.isSupabaseConfigured() === false);
  set("", "key-abc");
  check("supabase: URL rỗng -> false", sup.isSupabaseConfigured() === false);
  set("https://x.supabase.co", "");
  check("supabase: key rỗng -> false", sup.isSupabaseConfigured() === false);
  set("https://x.supabase.co", "key-abc");
  check("supabase: đủ 2 -> true", sup.isSupabaseConfigured() === true);
  // Khôi phục để các test file-store bên dưới chạy đúng.
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
}

// --- Supabase: KHÔNG cache lần đọc (lỗi live 2026-11-09) ---
// Next.js Data Cache giữ lại lời gọi fetch GET trong route handler ở bản
// production: lần đọc đầu (preview_for_print / bảng trống) bị cache, mọi
// lần đọc sau vẫn trả cũ dù POST confirm đã ghi confirmed — /quan-ly mãi
// trống, ?kind=admin mãi thấy preview_for_print. Ở dev không cache nên
// test local trước đây không lộ. Mọi lời gọi sbFetch phải mang
// cache:"no-store". Test bằng fetch giả có trạng thái (fake PostgREST).
{
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "key-abc";
  const dbRow = {
    id: "thiep-cache-1", data: { groomName: "A" }, status: "preview_for_print",
    edit_token: "et1", preview_token: "pt1", custom_texts: {}, history: [], messages: [],
    created_at: null, updated_at: null, confirmed_at: null, guest_token: "",
    guest_tokens: {}, payment_memo: "", locked_at: null, preview_expires_at: null,
    paid_at: null, paid_amount: null, paid_ref: null, paid_template_id: null,
    paid_memo: null, reconcile_log: [], edited_fields: [], manual_list: [],
  };
  const db = new Map([["thiep-cache-1", dbRow]]);
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const u = new URL(String(url));
    const idEq = u.searchParams.get("id")?.replace(/^eq\./, "");
    if (init.method === "PATCH" && idEq && db.has(idEq)) {
      const body = JSON.parse(init.body);
      db.set(idEq, { ...db.get(idEq), ...body });
      return { ok: true, text: async () => JSON.stringify([db.get(idEq)]) };
    }
    if (init.method === "POST") {
      const body = JSON.parse(init.body);
      db.set(body.id, body);
      return { ok: true, text: async () => JSON.stringify([body]) };
    }
    const rows = idEq ? (db.has(idEq) ? [db.get(idEq)] : []) : [...db.values()];
    return { ok: true, text: async () => JSON.stringify(rows) };
  };
  try {
    const before = await sup.supabaseGet("thiep-cache-1");
    check("cache: GET trước PATCH thấy preview_for_print", before !== null && before.status === "preview_for_print");
    const rec = { ...before, status: "confirmed", customerConfirmedAt: "2026-11-09T10:00:00.000Z", updatedAt: "2026-11-09T10:00:00.000Z" };
    await sup.supabaseSave(rec);
    const after = await sup.supabaseGet("thiep-cache-1");
    check("cache: GET sau PATCH thấy confirmed (không trả cũ)", after !== null && after.status === "confirmed");
    const list = await sup.supabaseListAll();
    check("cache: list sau khi có bản ghi không trả []", list.length === 1 && list[0].status === "confirmed");
    check("cache: mọi lời gọi sbFetch đều mang cache no-store", calls.length > 0 && calls.every((c) => c.init.cache === "no-store"));
    check("cache: có cả GET lẫn PATCH trong các lời gọi", calls.some((c) => !c.init.method || c.init.method === "GET") && calls.some((c) => c.init.method === "PATCH"));
  } finally {
    globalThis.fetch = realFetch;
    if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  }
}

// --- storeKind: file / none / supabase ---
{
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.VERCEL;
  check("storeKind: local không env -> file", store.storeKind() === "file");
  check("isFileStoreAllowed: local -> true", store.isFileStoreAllowed() === true);
  process.env.VERCEL = "1";
  check("storeKind: Vercel không Supabase -> none", store.storeKind() === "none");
  check("isFileStoreAllowed: Vercel -> false", store.isFileStoreAllowed() === false);
  process.env.ALLOW_FILE_STORE = "1";
  check("storeKind: Vercel + ALLOW_FILE_STORE -> file", store.storeKind() === "file");
  delete process.env.ALLOW_FILE_STORE;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "key-abc";
  check("storeKind: đủ env Supabase -> supabase (kể cả trên Vercel)", store.storeKind() === "supabase");
  delete process.env.VERCEL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  check("storeKind: khôi phục -> file", store.storeKind() === "file");
}

// --- Cookie phiên admin + isAdminRequest ---
{
  const TOKEN = "test-admin-123";
  const cookie = adm.adminSessionValue(TOKEN);
  check("cookie phiên: đúng token -> true", auth.isAdminSessionCookie(`td_admin_session=${cookie}`, TOKEN) === true);
  check("cookie phiên: sai giá trị -> false", auth.isAdminSessionCookie("td_admin_session=sai", TOKEN) === false);
  check("cookie phiên: thiếu cookie -> false", auth.isAdminSessionCookie("", TOKEN) === false);
  check("cookie phiên: token rỗng -> false", auth.isAdminSessionCookie(`td_admin_session=${cookie}`, "") === false);
  check("cookie phiên: cookie khác kẹp chung vẫn nhận", auth.isAdminSessionCookie(`other=1; td_admin_session=${cookie}; x=2`, TOKEN) === true);
  const reqHeader = new Request("https://x/api/invitations/list", { headers: { "x-admin-token": TOKEN } });
  check("isAdminRequest: header token đúng -> true", auth.isAdminRequest(reqHeader) === true);
  const reqCookie = new Request("https://x/api/invitations/list", { headers: { cookie: `td_admin_session=${cookie}` } });
  check("isAdminRequest: cookie phiên đúng -> true (không cần nhập lại mã)", auth.isAdminRequest(reqCookie) === true);
  const reqBad = new Request("https://x/api/invitations/list", { headers: { "x-admin-token": "sai" } });
  check("isAdminRequest: token sai -> false", auth.isAdminRequest(reqBad) === false);
  const reqNone = new Request("https://x/api/invitations/list");
  check("isAdminRequest: không token/cookie -> false", auth.isAdminRequest(reqNone) === false);
}

// --- File-store: vòng đời upsert/get/list/update + khóa chốt in ---
{
  const data = { groomName: "Văn A", brideName: "Thị B", date: "2026-12-05", time: "18:00", venue: "Tư gia" };
  const created = await store.upsertInvitation(data);
  check("file: tạo mới có id", typeof created.id === "string" && created.id.startsWith("thiep-"));
  check("file: trạng thái mặc định preview_for_print", created.status === "preview_for_print");
  check("file: có đủ 3 token", Boolean(created.previewToken && created.editToken && created.guestToken));
  const got = await store.getInvitation(created.id);
  check("file: get đọc lại được", got !== null && got.data.groomName === "Văn A");
  const ids = await store.listInvitationIds();
  check("file: listIds chứa id mới", ids.includes(created.id));
  const list = await store.listInvitations();
  check("file: listInvitations chứa 1 thiệp", list.length === 1 && list[0].id === created.id);
  // Khách chốt: update -> confirmed.
  const confirmed = await store.updateInvitation(created.id, (r) => acc.confirmRecord(r, new Date("2026-11-09T10:00:00.000Z")));
  check("file: update -> confirmed", confirmed !== null && confirmed.status === "confirmed");
  check("file: update ghi customerConfirmedAt", confirmed.customerConfirmedAt === "2026-11-09T10:00:00.000Z");
  // Đã chốt in: upsert chỉ được sửa trường online, tên/địa điểm vật lý giữ nguyên.
  const attempted = await store.upsertInvitation({
    ...data, id: created.id, groomName: "ĐỔI TÊN", venue: "ĐỔI ĐỊA ĐIỂM",
    templateId: "song-phung-do",
  });
  check("file: đã chốt -> tên vật lý KHÔNG đổi", attempted.data.groomName === "Văn A");
  check("file: đã chốt -> địa điểm vật lý KHÔNG đổi", attempted.data.venue === "Tư gia");
  check("file: đã chốt -> trường online vẫn đổi được", attempted.data.templateId === "song-phung-do");
  check("file: đã chốt -> status vẫn confirmed", attempted.status === "confirmed");
  // Mở lại rồi ghi đè: mốc chốt cũ không được sống lại (lỗi live 09/11).
  const reopened = await store.updateInvitation(created.id, (r) => acc.reviewRecord(r, "reopen").rec);
  check("file: reopen -> draft", reopened !== null && reopened.status === "draft");
  check("file: reopen xóa customerConfirmedAt", reopened !== null && reopened.customerConfirmedAt === null);
  const overwritten = await store.upsertInvitation({ ...data, id: created.id, groomName: "Tên Mới" });
  check("file: ghi đè sau reopen đổi được tên", overwritten.data.groomName === "Tên Mới");
  check("file: ghi đè sau reopen không khôi phục mốc chốt", overwritten.customerConfirmedAt === null);
  // Mở khóa (unlockRecord) cũng xóa mốc chốt.
  await store.updateInvitation(created.id, (r) => acc.confirmRecord(r, new Date("2026-11-09T12:00:00.000Z")));
  const unlocked = await store.updateInvitation(created.id, (r) => acc.unlockRecord(r));
  check("file: unlock -> draft + xóa mốc chốt", unlocked !== null && unlocked.status === "draft" && unlocked.customerConfirmedAt === null);
  // Bản ghi hỏng sẵn (preview + mốc chốt cũ, như bản live): upsert sửa lại cũng xóa mốc.
  await store.updateInvitation(created.id, (r) => ({ ...r, customerConfirmedAt: "2026-11-09T09:36:00.000Z" }));
  const repaired = await store.upsertInvitation({ ...data, id: created.id, groomName: "Tên Mới 2" }, { status: "preview_for_print" });
  check("file: upsert bản preview hỏng -> xóa mốc chốt cũ", repaired.customerConfirmedAt === null && repaired.status === "preview_for_print");
  // getInvitation id lạ -> null; update id lạ -> null.
  check("file: get id lạ -> null", (await store.getInvitation("khong-co")) === null);
  check("file: update id lạ -> null", (await store.updateInvitation("khong-co", (r) => r)) === null);
  // Vercel chưa có Supabase: ghi bị chặn với thông báo rõ.
  process.env.VERCEL = "1";
  let threw = "";
  try {
    await store.upsertInvitation({ groomName: "C", brideName: "D" });
  } catch (e) {
    threw = e instanceof Error ? e.message : String(e);
  }
  check("file: Vercel không Supabase -> ghi chặn + báo rõ", threw.includes("Chưa có database"));
  delete process.env.VERCEL;
}

// --- Mã nguồn: route list + review tồn tại, confirm set confirmed ---
{
  const confirmSrc = readSrc("src/app/api/invitations/[id]/confirm/route.ts");
  check("confirm route: dùng confirmRecord", confirmSrc.includes("confirmRecord"));
  check("confirm route: trả status confirmed", confirmSrc.includes('status: "confirmed"'));
  check("list route tồn tại", fs.existsSync(path.join(repoRoot, "src/app/api/invitations/list/route.ts")));
  check("review route tồn tại", fs.existsSync(path.join(repoRoot, "src/app/api/invitations/[id]/review/route.ts")));
  const listSrc = readSrc("src/app/api/invitations/list/route.ts");
  check("list route: chỉ admin", listSrc.includes("isAdminRequest"));
  check("list route: trả store kind", listSrc.includes("storeKind()"));
  const reviewSrc = readSrc("src/app/api/invitations/[id]/review/route.ts");
  check("review route: dùng reviewRecord", reviewSrc.includes("reviewRecord"));
  const unlockSrc = readSrc("src/app/api/invitations/[id]/unlock/route.ts");
  check("unlock route: dùng unlockRecord", unlockSrc.includes("unlockRecord"));
  const schemaSrc = readSrc("supabase/schema.sql");
  const schemaLower = schemaSrc.toLowerCase();
  check("schema.sql: bảng invitations", schemaLower.includes("create table") && schemaLower.includes("invitations"));
  check("schema.sql: có confirmed_at", schemaSrc.includes("confirmed_at"));
  check("schema.sql: bật RLS", schemaLower.includes("enable row level security"));
  check("schema.sql: không policy công khai", !/create policy/i.test(schemaSrc));
  check("supabase.ts: sbFetch dùng cache no-store (chống đọc cũ)", readSrc("src/lib/supabase.ts").includes('cache: "no-store"'));
  const quanLy = readSrc("src/app/(app)/quan-ly/page.tsx");
  check("quan-ly: có banner chờ duyệt", quanLy.includes("đang chờ duyệt"));
  check("quan-ly: có 5 tab", quanLy.includes('"Chờ duyệt"') && quanLy.includes('"Đã duyệt"') && quanLy.includes('"Đã in"') && quanLy.includes('"Nháp"'));
  check("quan-ly: nút Đã duyệt/Đã in/Mở lại", quanLy.includes("Đã duyệt") && quanLy.includes("Đã in") && quanLy.includes("Mở lại"));
  const taoThiep = readSrc("src/app/(app)/tao-thiep/page.tsx");
  check("tao-thiep: tự đồng bộ khi có Supabase", taoThiep.includes("SUPABASE_CONFIGURED"));
  check("tao-thiep: link máy chủ khi đồng bộ xong", taoThiep.includes("qua máy chủ"));
  check(".env.example: có SUPABASE_SERVICE_ROLE_KEY", readSrc(".env.example").includes("SUPABASE_SERVICE_ROLE_KEY="));
}

console.log(`\nduyet: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
