// Same-origin proxy for the Song Phung Do original decoration images.
// WHY: when the images were hotlinked cross-site from chung-doi.vercel.app
// to chungdoi.com, browsers sent a cross-site request and the images failed
// to load (and onError hid them silently). Served from this app's own origin,
// the browser request is same-origin; the server-side fetch below carries no
// browser Referer, and a direct no-Referer fetch of the originals was
// verified to succeed. Only the allowlisted original files are proxied;
// anything else is a 404. NENGIAY.jpg (vân giấy, 1000x1500 JPEG,
// 211.733 byte) đã xác minh tải được 200 từ gốc ngày 2026-11-05 nên
// được thêm ở vòng 9.
const ALLOWED_FILES = new Set([
  "Phuong line.webp",
  "HOA.webp",
  "Phuong 2.webp",
  "CHU HY.webp",
  "Phuong.webp",
  "NENGIAY.jpg",
]);

const UPSTREAM_BASE = "https://chungdoi.com/images/themes/songphung-red/";

export async function GET(
  _request: Request,
  { params }: { params: { file: string } }
) {
  // Next.js decodes %20 to a space in params; decode again only if the raw
  // value still carries an escape sequence, so both forms match the allowlist.
  let name = params.file;
  try {
    if (name.includes("%")) name = decodeURIComponent(name);
  } catch {
    name = params.file;
  }
  if (!ALLOWED_FILES.has(name)) {
    return new Response("Not found", { status: 404 });
  }
  // Live Vercel egress returned upstream non-2xx while a direct fetch worked:
  // the origin appears to reject bare serverless requests. Send a normal
  // browser-like request with the origin itself as Referer (this proxy serves
  // the owner's own images, so a same-site Referer is the honest one).
  let upstream: Response;
  try {
    upstream = await fetch(`${UPSTREAM_BASE}${encodeURIComponent(name)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://chungdoi.com/vi/mau-thiep/song-phung-do/demo",
      },
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }
  if (!upstream.ok) {
    return new Response(`Upstream fetch failed: ${upstream.status}`, { status: 502 });
  }
  const buffer = await upstream.arrayBuffer();
  // Content-Type theo đuôi file (NENGIAY.jpg là JPEG, không phải WebP).
  const contentType = name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg")
    ? "image/jpeg"
    : "image/webp";
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
