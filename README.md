# Thiệp Đôi — Thiệp cưới online

**Bản production đang chạy: https://chung-doi.vercel.app**
(project Vercel `chung-doi`; link cũ `thiep-cuoi-online-mulordyttest1-ux.vercel.app`
vẫn mở được, chưa gỡ. Bảo vệ SSO của project đang đặt ở chế độ "preview" nên trang
production mở công khai được. Thư mục code trên máy vẫn tên `thiep-cuoi-online`, chỉ
tên project/domain trên Vercel là `chung-doi`. Bản deploy hiện tại đẩy code trực tiếp
lên Vercel, chưa gắn repo GitHub — muốn deploy lại bằng git thì làm theo mục
"Deploy lên Vercel" bên dưới.)

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

- **Thanh toán: đang tạm ẩn.** Mục bảng giá và mọi nút thanh toán đã được ẩn khỏi
  giao diện. Tính năng này sẽ mở lại sau khi có cổng thanh toán thật.
- **Xác nhận tham dự và sổ lời chúc: đã bỏ khỏi phiên bản hiện tại.** Trang thiệp,
  landing và trang quản lý khách không còn hai phần này.

## Công nghệ

Next.js 14 (App Router) + TypeScript + Tailwind CSS 3.4 (cấu hình thật, không dùng CDN),
font Playfair Display + Be Vietnam Pro qua `next/font/google`, màu kem `#fdf8f1`,
đỏ đô `#7a1f2b`, vàng gold `#c9a86a`. Ảnh album dùng thẻ `<img>` trỏ tới
`images.unsplash.com` (ảnh cưới công khai) với `loading="lazy"`; `next.config.mjs` cũng
cho phép `images.unsplash.com` nếu sau này chuyển sang `next/image`.

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
- Bản deploy hiện tại chưa gắn GitHub nên mỗi lần cập nhật code cần deploy lại bằng
  cùng cách đẩy file, hoặc chuyển sang gắn repo GitHub theo hướng dẫn ở trên rồi để
  Vercel tự deploy mỗi lần push.
