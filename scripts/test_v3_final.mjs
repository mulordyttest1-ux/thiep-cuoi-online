/**
 * Test luồng v3-final (PLAN CHỐT) bằng webhook giả lập — chạy với server
 * production local (npm start) đã có env test SePay.
 *   BASE_URL=http://127.0.0.1:3100 node scripts/test_v3_final.mjs
 * Server test cần chạy với:
 *   SEPAY_BANK_CODE=VCB SEPAY_ACCOUNT_NUMBER=1234567890
 *   SEPAY_ACCOUNT_NAME="TEST NGUYEN" SEPAY_WEBHOOK_SECRET=test-secret
 *   THIEP_ADMIN_TOKEN=test-admin
 * và data/invitations.json đã xóa trước khi chạy server.
 */
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const ADMIN = { "Content-Type": "application/json", "x-admin-token": "test-admin" };
const SECRET = { "Content-Type": "application/json", "x-webhook-secret": "test-secret" };

let pass = 0;
let fail = 0;
function check(name, ok, extra = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
}
async function j(res) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { _raw: t }; }
}
function decodeD(url) {
  const d = new URL(url).searchParams.get("d");
  if (!d) return null;
  const b64 = d.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(b64 + "=".repeat((4 - (b64.length % 4)) % 4), "base64").toString("utf-8"));
}

const demoData = {
  groomName: "Trần Thanh Long",
  brideName: "Têrêsa Nguyễn",
  groomFather: "Phaolô Ngân Văn Sửu (+)",
  groomMother: "Maria Nguyễn Thị Lan",
  brideFather: "Giuse Trần Văn An",
  brideMother: "Anna Lê Thị Hoa",
  date: "2026-11-30",
  time: "18:00",
  venue: "Trung tâm Tiệc cưới Sen Hồng",
  address: "123 Đường Láng, Đống Đa, Hà Nội",
  templateId: "song-phung-do",
  message: "Trân trọng kính mời",
  scheduleText: "17:30 - Đón khách\n18:00 - Khai tiệc",
  bankCode: "VCB",
  accountNumber: "9876543210",
  accountName: "TRAN THANH LONG",
};

async function main() {
  console.log("== 1. Tạo thiệp (đồng bộ lên máy chủ) ==");
  let res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: demoData }) });
  let body = await j(res);
  check("tạo thiệp 200 + preview_for_print", res.ok && body.status === "preview_for_print", JSON.stringify(body).slice(0, 200));
  const id = body.id;
  const memoBase = body.paymentMemo;
  console.log(`    id=${id} paymentMemo=${memoBase}`);
  check("mã gốc không kèm mẫu", /^THIEP[A-Z0-9]+$/.test(memoBase || ""));

  console.log("== 2. Chưa chốt in thì chưa có QR ==");
  res = await fetch(`${BASE}/api/invitations/${id}/payment`);
  body = await j(res);
  check("payment trước chốt -> 400", res.status === 400);

  console.log("== 3. Chốt in ==");
  res = await fetch(`${BASE}/api/invitations/${id}/lock`, { method: "POST", headers: ADMIN });
  body = await j(res);
  check("lock 200 + locked_for_print", res.ok && body.status === "locked_for_print", JSON.stringify(body).slice(0, 200));
  check("lock không còn previewExpiresAt", !("previewExpiresAt" in body));
  check("lock trả demoUrl tới mục demo online", typeof body.demoUrl === "string" && body.demoUrl.includes("/tao-thiep?demo="));

  console.log("== 4. QR đúng 100k + đúng mã thiệp+mẫu ==");
  res = await fetch(`${BASE}/api/invitations/${id}/payment?template=song-phung-do`);
  body = await j(res);
  const expectMemo = `${memoBase}-SONGPHUNGDO`;
  check("payment 200 + configured", res.ok && body.configured === true, JSON.stringify(body).slice(0, 200));
  check("amount = 100000", body.amount === 100000, `amount=${body.amount}`);
  check(`memo = ${expectMemo}`, body.memo === expectMemo, `memo=${body.memo}`);
  check("qrUrl VietQR đúng bank + số TK + số tiền + mã", typeof body.qrUrl === "string"
    && body.qrUrl.includes("img.vietqr.io/image/VCB-1234567890")
    && body.qrUrl.includes("amount=100000")
    && body.qrUrl.includes(encodeURIComponent(expectMemo)));

  console.log("== 5. Webhook sai mã / thiếu tiền -> không mở ==");
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: "THIEPSAI123-SONGPHUNGDO", transferAmount: 100000, id: "WRONG-1" }) });
  body = await j(res);
  check("sai mã -> ignored", body.ignored === true, JSON.stringify(body).slice(0, 150));
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: expectMemo, transferAmount: 50000, id: "UNDER-1" }) });
  body = await j(res);
  check("thiếu tiền (50k) -> ignored", body.ignored === true, JSON.stringify(body).slice(0, 150));
  res = await fetch(`${BASE}/api/invitations/${id}/status`);
  body = await j(res);
  check("sau 2 webhook sai vẫn locked_for_print", body.status === "locked_for_print", `status=${body.status}`);

  console.log("== 6. Webhook đúng mã + đủ tiền -> mở + trả link xịn ==");
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: `Chuyen tien ${expectMemo} cam on`, transferAmount: 100000, id: "REF-1" }) });
  body = await j(res);
  check("webhook đúng -> ok + paid_online", res.ok && body.status === "paid_online", JSON.stringify(body).slice(0, 200));
  check("paidTemplateId = song-phung-do", body.paidTemplateId === "song-phung-do", `paidTemplateId=${body.paidTemplateId}`);
  check("trả premiumLink dạng /thiep/<id>?d=", typeof body.premiumLink === "string" && body.premiumLink.includes(`/thiep/${id}?d=`), String(body.premiumLink).slice(0, 80));
  const premium = decodeD(body.premiumLink);
  check("link xịn giải mã đúng tên + đúng mẫu", premium && premium.groomName === "Trần Thanh Long" && premium.templateId === "song-phung-do" && premium.brideName === "Têrêsa Nguyễn");

  console.log("== 7. Webhook trùng mã giao dịch -> không mở 2 lần ==");
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: expectMemo, transferAmount: 100000, id: "REF-1" }) });
  body = await j(res);
  check("trùng ref -> alreadyPaid", body.alreadyPaid === true);

  console.log("== 8. Status + payment sau khi trả ==");
  res = await fetch(`${BASE}/api/invitations/${id}/status`);
  body = await j(res);
  check("status paid_online + paidTemplateId", body.status === "paid_online" && body.paidTemplateId === "song-phung-do");
  res = await fetch(`${BASE}/api/invitations/${id}/payment?template=song-phung-do`);
  body = await j(res);
  check("payment alreadyPaid + premiumLink", body.alreadyPaid === true && typeof body.premiumLink === "string" && body.premiumLink.includes("?d="));

  console.log("== 9. Đối soát tay (thiệp thứ 2) ==");
  res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: { ...demoData, groomName: "Nguyễn Văn B", brideName: "Trần Thị C" } }) });
  body = await j(res);
  const id2 = body.id;
  const memo2 = `${body.paymentMemo}-SONGPHUNGDO`;
  await fetch(`${BASE}/api/invitations/${id2}/lock`, { method: "POST", headers: ADMIN });
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: memo2, transferAmount: 100000, id: "REF-2-WRONG-MEMO" }) });
  body = await j(res);
  check("webhook đúng mã thiệp 2 -> mở (đối chứng)", res.ok && body.status === "paid_online");
  // Thiệp 3: webhook sai mã, rồi đối soát tay.
  res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: { ...demoData, groomName: "Lê Văn D", brideName: "Phạm Thị E" } }) });
  body = await j(res);
  const id3 = body.id;
  await fetch(`${BASE}/api/invitations/${id3}/lock`, { method: "POST", headers: ADMIN });
  res = await fetch(`${BASE}/api/webhooks/sepay`, { method: "POST", headers: SECRET, body: JSON.stringify({ content: "THIEPSAI999-SONGPHUNGDO", transferAmount: 100000, id: "REF-3" }) });
  body = await j(res);
  check("webhook sai mã thiệp 3 -> ignored", body.ignored === true);
  res = await fetch(`${BASE}/api/invitations/${id3}/reconcile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: "REF-3", reason: "khách chuyển sai mã" }) });
  check("đối soát không token -> 401", res.status === 401);
  res = await fetch(`${BASE}/api/invitations/${id3}/reconcile`, { method: "POST", headers: ADMIN, body: JSON.stringify({ ref: "REF-3" }) });
  check("đối soát thiếu lý do -> 400", res.status === 400);
  res = await fetch(`${BASE}/api/invitations/${id3}/reconcile`, { method: "POST", headers: ADMIN, body: JSON.stringify({ ref: "REF-3", reason: "khách chuyển sai mã, webhook không về", templateId: "song-phung-do" }) });
  body = await j(res);
  check("đối soát đúng -> paid_online + log 1 dòng + premiumLink", res.ok && body.status === "paid_online" && Array.isArray(body.reconcileLog) && body.reconcileLog.length === 1 && typeof body.premiumLink === "string", JSON.stringify(body).slice(0, 250));
  res = await fetch(`${BASE}/api/invitations/${id3}/reconcile`, { method: "POST", headers: ADMIN, body: JSON.stringify({ ref: "REF-3", reason: "bấm lại" }) });
  check("đối soát lại sau khi đã trả -> 400", res.status === 400);

  console.log("== 10. Sau chốt in: chỉ sửa được trường online, không sửa được tên vật lý ==");
  res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: { ...demoData, groomName: "Hoàng Văn F", brideName: "Đỗ Thị G" } }) });
  body = await j(res);
  const id4 = body.id;
  await fetch(`${BASE}/api/invitations/${id4}/lock`, { method: "POST", headers: ADMIN });
  res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: { ...demoData, id: id4, groomName: "ĐỔI TÊN TRÁI PHÉP", photoUrl: "https://example.com/anh-moi.jpg" } }) });
  body = await j(res);
  check("sync sau chốt vẫn 200 (cho sửa trường online)", res.ok, JSON.stringify(body).slice(0, 150));
  // Kiểm tra trực tiếp file store local: tên vật lý phải giữ nguyên, ảnh online phải đổi.
  const { readFileSync } = await import("node:fs");
  const store = JSON.parse(readFileSync(new URL("../data/invitations.json", import.meta.url), "utf-8"));
  check("tên vật lý KHÔNG đổi sau chốt", store[id4].data.groomName === "Hoàng Văn F", `groomName=${store[id4].data.groomName}`);
  check("ảnh online ĐƯỢC đổi sau chốt", store[id4].data.photoUrl === "https://example.com/anh-moi.jpg", `photoUrl=${store[id4].data.photoUrl}`);
  // Kiểm tra upsert đã trả tiền thì bị chặn.
  res = await fetch(`${BASE}/api/invitations`, { method: "POST", headers: ADMIN, body: JSON.stringify({ data: { ...demoData, id, groomName: "ĐỔI SAU TRẢ" } }) });
  body = await j(res);
  check("sync sau khi đã trả tiền -> 400 (chỉ đọc)", res.status === 400, JSON.stringify(body).slice(0, 150));

  console.log("== 11. Trang editor có mục demo + blur; trang xem-thu cũ chuyển hướng ==");
  res = await fetch(`${BASE}/tao-thiep`);
  let html = await res.text();
  check("editor KHÔNG còn chữ watermark", !html.includes("watermark"));
  // /tao-thiep dùng useSearchParams nên SSR chỉ trả fallback — nội dung thật
  // nằm trong JS bundle. Kiểm tra bundle (chuỗi có dấu có thể bị escape
  // dạng \xNN nên dùng đoạn không dấu / phần còn nguyên dạng UTF-8).
  const { readdirSync: readdir2, readFileSync: readFile2 } = await import("node:fs");
  const { join } = await import("node:path");
  const chunksDir = new URL("../.next/static/chunks", import.meta.url).pathname;
  const pageDir = join(chunksDir, "app", "tao-thiep");
  const pageBundle = readdir2(pageDir).filter((f) => f.endsWith(".js")).map((f) => readFile2(join(pageDir, f), "utf-8")).join("\n");
  const sharedBundle = readdir2(chunksDir).filter((f) => /^\d+-.*\.js$/.test(f)).map((f) => readFile2(join(chunksDir, f), "utf-8")).join("\n");
  check("bundle editor có 'Xem demo thiệp online'", pageBundle.includes("Xem demo thiệp online"));
  check("bundle chung có class blur demo (blur-[7px])", sharedBundle.includes("blur-[7px]"));
  check("bundle có wizard 3 bước + nút kiểm tra", pageBundle.includes("QR nhận link") && pageBundle.includes("chuyển — kiểm tra"));
  check("bundle có đối soát tay chỉ Nancy", pageBundle.includes("tay (chỉ Nancy)"));
  check("bundle editor KHÔNG còn chữ watermark", !pageBundle.includes("watermark"));
  res = await fetch(`${BASE}/xem-thu/${id}?t=token-cu`);
  html = await res.text();
  check("xem-thu cũ hiện trang chuyển hướng tới demo", html.includes("Bản xem trước đã chuyển chỗ mới") && html.includes("/tao-thiep?demo="));

  console.log(`\nKẾT QUẢ: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
