# Thiệp Đôi — Thiệp cưới online

**Bản production đang chạy: https://chung-doi.vercel.app**
(project Vercel `chung-doi`; link cũ `thiep-cuoi-online-mulordyttest1-ux.vercel.app`
vẫn mở được, chưa gỡ. Bảo vệ SSO của project đang đặt ở chế độ "preview" nên trang
production mở công khai được. Thư mục code trên máy vẫn tên `thiep-cuoi-online`, chỉ
tên project/domain trên Vercel là `chung-doi`. Code đã gắn repo GitHub riêng
**mulordyttest1-ux/thiep-cuoi-online** (public, tách riêng với các project khác),
Vercel tự deploy mỗi lần push lên nhánh `main` — không cần đẩy file tay nữa.

Thiệp Đôi là trang thiệp cưới online: chọn một mẫu thiệp, điền thông tin cặp đôi và
ngày cưới, rồi chia sẻ link riêng cho từng khách trong một trang thiệp duy nhất.

## Tính năng

- **Landing** (`/`): hero + thiệp mẫu xem trước, 6 mẫu nổi bật, 6 thẻ tính năng,
  3 bước tạo thiệp, mục "Dành cho ai", FAQ accordion.
- **Thư viện mẫu** (`/mau-thiep`): 28 mẫu, lọc theo phong cách + tìm kiếm, xem trước modal,
  nút "Dùng mẫu này" chuyển sang editor kèm `?template=<id>`.
- **Editor** (`/tao-thiep`): 2 cột trên desktop, chuyển tab Form/Xem trước trên mobile.
  Nhập tên cặp đôi, bố mẹ hai bên, ngày/giờ/địa điểm, lời mời, câu chuyện, lịch trình,
  ảnh (preset Unsplash, dán URL, hoặc upload file → dataURL), chọn ngôn ngữ thiệp,
  thông tin mừng cưới. Đổi mẫu giữ nguyên toàn bộ dữ liệu.
  Live preview cập nhật ngay khi gõ. "Lưu thiệp" lưu localStorage và tạo id;
  "Sao chép link chia sẻ" tạo link dạng `/thiep/<id>?d=<JSON base64url>` mở được trên máy khác.
- **Quản lý khách** (`/quan-ly`): tổng số khách, thêm từng khách, thêm hàng loạt,
  tìm kiếm + lọc nhóm/phía, sửa/xóa, sao chép link riêng từng khách
  (`/thiep/<id>?guest=<tên>`), xuất CSV thật. Dữ liệu mẫu chỉ seed khi localStorage trống,
  có nút "Xóa dữ liệu mẫu".
- **Trang thiệp** (`/thiep/[id]`): phong bì "Mở thiệp", đếm ngược, bố mẹ hai bên,
  địa điểm + link Google Maps, lịch trình, album, phần mừng cưới với QR VietQR thật
  (img.vietqr.io, chỉ hiện khi đủ mã ngân hàng + số tài khoản). Thứ tự đọc dữ liệu:
  localStorage theo id → tham số `?d=` → thiệp mặc định (chỉ khi id = `demo`).
  Id không hợp lệ và không có `?d=` → trang 404 thân thiện.
- **Ngôn ngữ**: giao diện chính tiếng Việt, nút VI/EN trên header chuyển cho
  header/landing/editor, lựa chọn lưu vào localStorage.

## Tính năng đang tạm ẩn hoặc đã bỏ khỏi phiên bản hiện tại

- **Xác nhận tham dự và sổ lời chúc: đã bỏ khỏi phiên bản hiện tại.** Trang thiệp,
  landing và trang quản lý khách không còn hai phần này.

## Bán thiệp online — PLAN CHỐT v3-final (2026-11-06)

Luồng (tự động, không cần nhân viên): khách gửi nội dung → làm thiệp vật lý, chốt in
như bình thường → trong editor (`/tao-thiep`) tự hiện mục **“Xem demo thiệp online”**:
demo duy nhất đã đổ dữ liệu khách, **tên + ngày + giờ + địa điểm bị blur** (bấm vào ô
mờ thì hiện rõ lúc sửa), chọn mẫu thoải mái trước khi trả tiền, không tính lượt →
wizard 3 bước: (1) Chọn mẫu → (2) Thêm ảnh / thông tin thêm → (3) Quét QR **100.000đ**
nhận link xịn. Không watermark, không hết hạn xem trước, không trang khóa làm luồng chính
(link xem trước cũ `/xem-thu` chuyển tới mục demo online).

- **Giá: 100.000đ / thiệp online**, một giá cho mọi mẫu (`ONLINE_PRICE_VND`,
  đổi bằng biến môi trường `NEXT_PUBLIC_ONLINE_PRICE_VND`).
- **SePay gói FREE** (0đ/tháng, 50 giao dịch tiền vào/tháng): tiền về thẳng tài khoản
  Vietcombank DÀNH RIÊNG cho tiền online của Nancy; SePay chỉ báo webhook. QR riêng
  theo từng (thiệp + mẫu), mã `THIEP...-MẪU`. Webhook `/api/webhooks/sepay` mở khóa khi
  đủ 3 điều kiện: đúng mã, số tiền >= 100.000đ, mã giao dịch chưa dùng. Nút
  “Tôi đã chuyển — kiểm tra” để khách tự kiểm tra.
- **Link xịn**: `/thiep/<id>?d=<base64url JSON>` — dữ liệu mã hóa vào trong link, chỉ
  đọc, độc lập với link demo; chỉ mở khi máy chủ đã ghi `paid_online` cho đúng thiệp +
  đúng mẫu. Dùng tới 30 ngày sau ngày cưới.
- **Đối soát tay (chỉ Nancy, cần token admin)**: khách đã chuyển tiền thật nhưng sai
  nội dung / webhook lỗi — nhập mã giao dịch SePay + lý do để mở khóa, có log. Không có
  nút “đã thu tiền mặt”.
- **Chưa làm ở v1**: nút đổi mẫu sau trả tiền (hoãn sang giai đoạn sau), agent chat tự
  do, khách tự tạo link riêng.
- **Chưa có để mở bán thật**: tài khoản SePay + nối Vietcombank riêng + `SEPAY_*` vào
  biến môi trường; project Supabase cho Thiệp Đôi (file JSON local không sống được
  trên Vercel — chưa có Supabase mà chạy production thì route đọc/ghi trả lỗi 503 rõ
  ràng, không lặng lẽ mất dữ liệu).

## Công nghệ

Next.js 14 (App Router) + TypeScript + Tailwind CSS 3.4 (cấu hình thật, không dùng CDN),
font Playfair Display + Be Vietnam Pro qua `next/font/google`, màu kem `#fdf8f1`,
đỏ đô `#7a1f2b`, vàng gold `#c9a86a`. Ảnh album dùng thẻ `<img>` trỏ tới
`images.unsplash.com` (ảnh cưới công khai) với `loading="lazy"`; `next.config.mjs` cũng
cho phép `images.unsplash.com` nếu sau này chuyển sang `next/image`.

## Mẫu Song Phụng Đỏ — ghi chú độ giống bản gốc

- Mẫu này làm theo số đo thật trích từ trang demo gốc của chính chủ (file ghi
  chép `specs/song-phung-do.md`): tên lệch trái, dải đỏ + chữ Hỷ, phụng hai bên,
  lịch trình dạng timeline có chấm ở giữa, lịch tháng có tim đỏ đô.
- Ảnh trang trí gốc của mẫu (phụng, hoa, chữ Hỷ, nền giấy) được phục vụ qua
  route cùng nguồn `src/app/api/songphung/[file]/route.ts` (danh sách cho phép
  cố định; khi lấy từ trang gốc phải gửi đúng User-Agent trình duyệt).
- **Kiểm tra đạt 2026-11-05 (vòng 17):** phong bì, hero, khối thông tin lễ cưới,
  album coverflow, phần tiệc + bản đồ có ghim đúng địa chỉ, dress code, lịch trình
  căn giữa, tim lịch, thẻ thư viện — tất cả đã đối chiếu với bản gốc và đạt.
- Tiêu chí đạt hiện tại (quyết định của chủ thương hiệu 2026-11-05): giữ khung
  chung + hiệu ứng để tái sử dụng; không cần giống hệt — gần giống là được,
  lệch tọa độ/font một chút vẫn đạt; nhưng không được sai hẳn về ý tưởng và
  không được lỗi. Xem `QUY-TRINH-MAU.md`.

## Cấu trúc thư mục

```
src/
  app/
    layout.tsx            # metadata tiếng Việt, font, Header/Footer
    page.tsx              # landing
    mau-thiep/page.tsx    # thư viện mẫu
    tao-thiep/page.tsx    # editor 2 cột + live preview
    quan-ly/page.tsx      # quản lý khách mời
    thiep/[id]/page.tsx   # trang thiệp chia sẻ (phong bì, album, QR)
  components/
    Header.tsx  Footer.tsx  LanguageProvider.tsx  TemplateCard.tsx
    InvitationPreview.tsx  Countdown.tsx  GuestTable.tsx
  lib/
    types.ts      # kiểu dữ liệu + thiệp mặc định + parse lịch trình
    templates.ts  # 28 mẫu (id, tên, phong cách, palette, motif, khung, font, phong bì, tông giấy)
    store.ts      # localStorage + encode/decode link ?d= + seed mẫu + VietQR + clipboard
    i18n.ts       # từ điển VI/EN cho header/landing/editor
```

## Cách chạy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm start        # chạy bản production sau khi build
```

## Biến môi trường

Xem `.env.example`. Bản hiện tại không bắt buộc biến nào (chạy bằng localStorage).
`NEXT_PUBLIC_APP_URL` dùng khi deploy để link chia sẻ tuyệt đối trỏ đúng domain.
`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` là bước tiếp theo,
chưa bắt buộc — hiện code không gọi Supabase.
Bán thiệp online cần thêm `SEPAY_BANK_CODE / SEPAY_ACCOUNT_NUMBER / SEPAY_ACCOUNT_NAME /
SEPAY_WEBHOOK_SECRET` và `THIEP_ADMIN_TOKEN` (xem `.env.example`) — chưa cấu hình thì
endpoint thanh toán trả `configured:false` và không sinh QR giả.

## Deploy lên Vercel (từng bước)

1. Đẩy code lên một repo GitHub (không commit secret; `.env.local` không được commit).
2. Vào [vercel.com/new](https://vercel.com/new) → **Import** repo đó.
3. Framework Preset: **Next.js** (Vercel tự nhận). Build Command `npm run build`,
   Output Directory mặc định của Next.js — giữ nguyên.
4. (Tùy chọn) Thêm biến môi trường `NEXT_PUBLIC_APP_URL=https://<domain-cua-ban>.vercel.app`
   trong Project Settings → Environment Variables, rồi **Redeploy**.
5. Bấm **Deploy** và chờ trạng thái Ready. Mở domain Vercel cấp để kiểm tra các route
   `/`, `/mau-thiep`, `/tao-thiep`, `/quan-ly`, `/thiep/demo`.

## Giới hạn hiện tại

- Dữ liệu lưu trên trình duyệt từng người (localStorage). Link chia sẻ kèm dữ liệu
  trong tham số `?d=` để mở được trên máy khác.
- Chưa có tài khoản người dùng, chưa có backend đa thiết bị.
- Chưa có Supabase: muốn đồng bộ đa thiết bị cần triển khai backend + bảng dữ liệu thật
  (bước tiếp theo, không phải chỉ điền key).
- Ảnh tải lên lưu dạng dataURL trong localStorage nên bị giới hạn dung lượng trình duyệt.
- Đã gắn GitHub: push lên nhánh `main` của repo `mulordyttest1-ux/thiep-cuoi-online`
  là Vercel tự deploy bản production mới.
