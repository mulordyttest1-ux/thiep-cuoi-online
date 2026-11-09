// Test thông báo Telegram khi khách chốt: nội dung tin (buildConfirmMessage)
// + no-op khi chưa cấu hình env + gửi đúng URL/body khi đã cấu hình +
// không bao giờ throw + route chốt gọi notifyOwner fire-and-forget.
//   ./node_modules/.bin/tsc src/lib/notify.ts --outDir /tmp/notify-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop
//   NODE_PATH=$PWD/node_modules node scripts/test_notify.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const outDir = process.env.NOTIFY_TEST_OUT || "/tmp/notify-test-out";
const notify = require(path.join(outDir, "notify.js"));
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

const full = {
  id: "notify-test",
  ceremonyType: "Vu Quy",
  brideName: "Mỹ Ánh",
  groomName: "Văn Hải",
  date: "2026-11-26",
  venue: "Tư Gia Nhà Gái",
};

check("tin đầy đủ đúng mẫu (loại lễ — cô dâu & chú rể / Tiệc: dd.mm.yyyy, địa điểm / link bảng)",
  notify.buildConfirmMessage(full) ===
    "🔔 Khách vừa chốt thiệp!\nVu Quy — Mỹ Ánh & Văn Hải\nTiệc: 26.11.2026, Tư Gia Nhà Gái\nXem: https://chung-doi.vercel.app/quan-ly",
  JSON.stringify(notify.buildConfirmMessage(full)));

check("thiếu loại lễ → dòng tên không có dấu ' — ' thừa",
  notify.buildConfirmMessage({ ...full, ceremonyType: "" }) ===
    "🔔 Khách vừa chốt thiệp!\nMỹ Ánh & Văn Hải\nTiệc: 26.11.2026, Tư Gia Nhà Gái\nXem: https://chung-doi.vercel.app/quan-ly");

check("thiếu tên → chỉ còn dòng loại lễ",
  notify.buildConfirmMessage({ ...full, brideName: "", groomName: "" }) ===
    "🔔 Khách vừa chốt thiệp!\nVu Quy\nTiệc: 26.11.2026, Tư Gia Nhà Gái\nXem: https://chung-doi.vercel.app/quan-ly");

check("thiếu ngày + địa điểm → không có dòng 'Tiệc:'",
  notify.buildConfirmMessage({ ...full, date: "", venue: "" }) ===
    "🔔 Khách vừa chốt thiệp!\nVu Quy — Mỹ Ánh & Văn Hải\nXem: https://chung-doi.vercel.app/quan-ly");

check("dữ liệu rỗng → chỉ còn tiêu đề + link bảng, không crash",
  notify.buildConfirmMessage({}) ===
    "🔔 Khách vừa chốt thiệp!\nXem: https://chung-doi.vercel.app/quan-ly");

// --- sendTelegram: mock fetch ---
const realFetch = globalThis.fetch;
let calls = [];
function mockFetch(ok = true) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok };
  };
}
function mockFetchThrow() {
  calls = [];
  globalThis.fetch = async () => {
    throw new Error("mạng lỗi");
  };
}
function clearEnv() {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
}

await (async () => {
  clearEnv();
  mockFetch();
  await notify.sendTelegram("hello");
  check("chưa cấu hình env → no-op, không gọi fetch", calls.length === 0, `${calls.length} calls`);

  process.env.TELEGRAM_BOT_TOKEN = "test-token-123";
  process.env.TELEGRAM_CHAT_ID = "999888777";
  mockFetch();
  await notify.sendTelegram("hello");
  check("đã cấu hình → POST đúng URL bot + body chat_id/text",
    calls.length === 1 &&
      calls[0].url === "https://api.telegram.org/bottest-token-123/sendMessage" &&
      calls[0].init.method === "POST" &&
      JSON.parse(calls[0].init.body).chat_id === "999888777" &&
      JSON.parse(calls[0].init.body).text === "hello",
    JSON.stringify(calls));

  mockFetch();
  await notify.sendTelegram("");
  check("text rỗng → no-op, không gọi fetch", calls.length === 0, `${calls.length} calls`);

  mockFetchThrow();
  let threw = false;
  try {
    await notify.sendTelegram("hello");
  } catch {
    threw = true;
  }
  check("fetch lỗi → sendTelegram KHÔNG throw", threw === false);

  // notifyOwner: gửi đúng nội dung tin đã build.
  mockFetch();
  await notify.notifyOwner(full);
  check("notifyOwner → gửi tin đúng nội dung đã build",
    calls.length === 1 &&
      JSON.parse(calls[0].init.body).text === notify.buildConfirmMessage(full),
    JSON.stringify(calls.map((c) => JSON.parse(c.init.body))));

  clearEnv();
  mockFetch();
  await notify.notifyOwner(full);
  check("notifyOwner chưa cấu hình → no-op", calls.length === 0, `${calls.length} calls`);
})();

// --- route chốt gọi notifyOwner fire-and-forget (kiểm tra tĩnh) ---
const routeSrc = readSrc("src/app/api/invitations/[id]/confirm/route.ts");
const hookIdx = routeSrc.indexOf("notifyOwner(data).catch(() => {})");
const updateIdx = routeSrc.indexOf("await updateInvitation(id,");
const returnIdx = routeSrc.indexOf("return NextResponse.json({", updateIdx);
check("route chốt import notifyOwner",
  routeSrc.includes('import { notifyOwner } from "@/lib/notify";'));
check("route chốt gọi notifyOwner(data).catch(() => {}) SAU updateInvitation và TRƯỚC return thành công",
  hookIdx > 0 && updateIdx > 0 && returnIdx > 0 && hookIdx > updateIdx && hookIdx < returnIdx,
  `update=${updateIdx} hook=${hookIdx} return=${returnIdx}`);
check("route chốt KHÔNG await notifyOwner (fire-and-forget, không chặn phản hồi khách)",
  !routeSrc.includes("await notifyOwner"));

globalThis.fetch = realFetch;
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
