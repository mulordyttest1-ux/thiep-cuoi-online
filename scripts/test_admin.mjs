// Test tách backend khỏi web khách: mã admin kiểm tra ở máy chủ
// (src/lib/admin-session.ts) + Header/Footer/trang công khai không còn link
// tới /tao-thiep và /quan-ly + AdminGate khóa 2 trang admin.
//   ./node_modules/.bin/tsc src/lib/admin-session.ts --outDir /tmp/admin-test-out --module commonjs --target es2022 --moduleResolution node --skipLibCheck --esModuleInterop
//   NODE_PATH=$PWD/node_modules node scripts/test_admin.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const outDir = process.env.ADMIN_TEST_OUT || "/tmp/admin-test-out";
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

const TOKEN = "test-admin-123";

// --- verifyAdminCode ---
check("đúng mã -> true", adm.verifyAdminCode("test-admin-123", TOKEN) === true);
check("sai mã -> false", adm.verifyAdminCode("sai-123", TOKEN) === false);
check("mã rỗng -> false", adm.verifyAdminCode("", TOKEN) === false);
check("mã khác độ dài -> false", adm.verifyAdminCode("test-admin-12", TOKEN) === false);
check("mã thừa 1 ký tự -> false", adm.verifyAdminCode("test-admin-1234", TOKEN) === false);
check("token chưa đặt -> mọi mã đều false", adm.verifyAdminCode("test-admin-123", "") === false);
check("token chưa đặt + mã rỗng -> false", adm.verifyAdminCode("", "") === false);

// --- adminSessionValue ---
const v1 = adm.adminSessionValue(TOKEN);
const v2 = adm.adminSessionValue(TOKEN);
check("session value ổn định (deterministic)", v1 === v2);
check("session value là hex 64 ký tự", /^[0-9a-f]{64}$/.test(v1));
check("token khác -> session khác", adm.adminSessionValue("khac-456") !== v1);
check("session value không chứa mã gốc", !v1.includes("test-admin-123"));

// --- isAdminSession ---
check("cookie đúng -> true", adm.isAdminSession(v1, TOKEN) === true);
check("cookie sai -> false", adm.isAdminSession("0".repeat(64), TOKEN) === false);
check("cookie bị sửa 1 ký tự -> false", adm.isAdminSession(v1.slice(0, -1) + (v1.slice(-1) === "0" ? "1" : "0"), TOKEN) === false);
check("cookie null -> false", adm.isAdminSession(null, TOKEN) === false);
check("cookie undefined -> false", adm.isAdminSession(undefined, TOKEN) === false);
check("cookie rỗng -> false", adm.isAdminSession("", TOKEN) === false);
check("token chưa đặt -> cookie đúng cũng false", adm.isAdminSession(adm.adminSessionValue(""), "") === false);

// --- hằng số ---
check("tên cookie là td_admin_session", adm.ADMIN_SESSION_COOKIE === "td_admin_session");
check("cookie sống 180 ngày", adm.ADMIN_SESSION_MAX_AGE === 180 * 24 * 60 * 60);

// --- web công khai không còn link admin ---
const noAdminHref = (p) => {
  const s = readSrc(p);
  return !s.includes('href="/tao-thiep') && !s.includes('href="/quan-ly') && !s.includes("href={`/tao-thiep") && !s.includes("href={`/quan-ly");
};
check("Header không còn link /tao-thiep, /quan-ly", noAdminHref("src/components/Header.tsx"));
check("Footer không còn link /tao-thiep, /quan-ly", noAdminHref("src/components/Footer.tsx"));
check("Trang chủ không còn link /tao-thiep, /quan-ly", noAdminHref("src/app/(app)/page.tsx"));
check("Trang mẫu thiệp không còn link /tao-thiep, /quan-ly", noAdminHref("src/app/(app)/mau-thiep/page.tsx"));
check("TemplateCard không còn link /tao-thiep, /quan-ly", noAdminHref("src/components/TemplateCard.tsx"));
check("Trang thiệp khách không còn link /tao-thiep, /quan-ly", noAdminHref("src/app/(app)/thiep/[id]/page.tsx"));
check("Trang chủ không còn chữ 'Tạo thiệp miễn phí' dẫn tới editor", !readSrc("src/app/(app)/page.tsx").includes("Tạo thiệp miễn phí"));

// --- AdminGate + API routes ---
const gate = readSrc("src/components/AdminGate.tsx");
check("AdminGate gọi /api/admin/status", gate.includes("/api/admin/status"));
check("AdminGate gọi /api/admin/verify", gate.includes("/api/admin/verify"));
check("AdminGate có ô nhập mã + báo sai", gate.includes('id="admin-code"') && gate.includes("Mã không đúng"));
check("AdminGate báo 'Chưa đặt mã admin' khi chưa cấu hình", gate.includes("Chưa đặt mã admin"));
check("AdminGate KHÔNG chứa token admin trong code client", !gate.includes("THIEP_ADMIN_TOKEN") && !gate.includes("test-admin-123"));

const verify = readSrc("src/app/api/admin/verify/route.ts");
check("verify route đọc THIEP_ADMIN_TOKEN ở máy chủ", verify.includes("THIEP_ADMIN_TOKEN"));
check("verify route trả 503 khi chưa đặt token", verify.includes("503") && verify.includes("admin_not_configured"));
check("verify route trả 401 khi sai mã", verify.includes("401") && verify.includes("wrong_code"));
check("verify route đặt cookie HttpOnly SameSite=Lax 180 ngày", verify.includes("httpOnly: true") && verify.includes('sameSite: "lax"') && verify.includes("ADMIN_SESSION_MAX_AGE"));

const status = readSrc("src/app/api/admin/status/route.ts");
check("status route kiểm tra cookie bằng isAdminSession", status.includes("isAdminSession") && status.includes("ADMIN_SESSION_COOKIE"));

check("tao-thiep bọc AdminGate", readSrc("src/app/(app)/tao-thiep/page.tsx").includes("<AdminGate>"));
check("quan-ly bọc AdminGate", readSrc("src/app/(app)/quan-ly/page.tsx").includes("<AdminGate>"));
check("khach KHÔNG bị khóa (không dùng AdminGate)", !readSrc("src/app/(khach)/layout.tsx").includes("AdminGate"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
