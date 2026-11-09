# Xem trước = sản phẩm + demo mở trang riêng

Chỉ có 1 đường render duy nhất cho thiệp online: component
`src/components/GuestInvitationView.tsx` — phong bì + con dấu + nút
"Mở thiệp" + vụ nổ + cuộn mượt + thanh tiến trình + thiệp
(`InvitationPreview` motion) + album riêng (mẫu thường) + QR mừng cưới.
Trang khách `/thiep/[id]` chỉ còn tải dữ liệu + chốt chặn máy chủ
(gate/notfound), phần hiển thị giao hết cho component này.

## Demo mở trang riêng (không còn hộp xem mẫu)

- Wizard `/tao-thiep` bước 1: không còn hộp demo tĩnh inline. Bấm
  "Xem demo" mở trang `/thiep/demo?d=<dữ liệu hiện tại>&from=wizard&blur=1`
  (cùng tab, dữ liệu đi theo link, không lưu máy chủ): phong bì + hiệu ứng
  đúng biến thể của mẫu, tên/ngày/giờ/địa điểm vẫn mờ. Nút
  "← Quay lại sửa thiệp" (góc trái, chỉ khi `?from=wizard`) về lại wizard.
  Chưa nhập tên cô dâu chú rể thì nút xem demo chưa bấm được.
  Sửa tên/ngày/giờ/địa điểm bằng nút "Sửa ..." trong wizard (form sửa ở
  các bước), không sửa trên trang demo.
- Thư viện mẫu (`/mau-thiep`, trang chủ): bấm mẫu/thẻ mẫu mở trang demo đầy
  đủ của mẫu đó (`/thiep/demo?d=<dữ liệu mẫu trưng bày>`), không mở hộp
  dialog nữa. Hộp dialog đã xóa. Ảnh nhỏ trong lưới mẫu
  (`DecoThumbnail`) giữ nguyên là hình tĩnh thu nhỏ (ô quá nhỏ, không bấm
  mở phong bì được).
- `?blur=1` trên trang khách: mờ tên/ngày/giờ/địa điểm cả phong bì lẫn
  thiệp; bấm vào ô mờ không làm gì (không sửa trên trang demo).

## Không để thông tin sẵn (xem thêm docs/blocks-feature.md)

Thiệp thật bắt đầu từ TRỐNG (`emptyInvitation()`): API tạo thiệp,
`decodeShare`, editor `/tao-thiep` đều lấy trống làm nền. `defaultInvitation()`
chỉ còn để trưng bày/demo (ảnh nhỏ thư viện, hero trang chủ, `/thiep/demo`
không kèm `?d=`). Khối trống nội dung thì ẩn; `shownBlocks` chỉ để đọc dữ
liệu cũ, `isBlockVisible` bỏ qua nó.

## Thử nhanh

1. Thiệp chỉ có tên + ngày: mở `/thiep/demo?d=<encode tên+ngày>` — chỉ
   hiện lõi (hero + thông tin lễ + thông tin tiệc), không có màu dress
   code / câu chuyện / lịch trình / ảnh mẫu nào.
2. Thêm `dressCode` vào cùng link rồi mở lại — khối dress code hiện.
3. Wizard: mở `/tao-thiep`, nhập tên cô dâu chú rể, bấm "Xem demo" ở
   bước 1 — ra trang riêng có phong bì, bấm "Mở thiệp" thấy hiệu ứng
   đúng biến thể của mẫu; bấm "← Quay lại sửa thiệp" về lại wizard.
4. Gallery: mở `/mau-thiep`, bấm 1 mẫu — ra trang demo đầy đủ, không
   còn hộp dialog.

## QA (2026-11-09, local)

- `npm run build` PASS.
- Playwright mobile 390px trên production build local, ảnh
  `~/workspace/qa-screenshots-unified-preview/`:
  - (a) link chỉ tên+ngày (Song Phụng Đỏ): chỉ hiện lõi, 0 marker dữ liệu
    mẫu nào lọt (kiểm 15 marker: màu mẫu, câu chuyện mẫu, lịch mẫu, tên
    mẫu, địa chỉ mẫu), 0 lỗi trang.
  - (b) Song Phụng Đỏ + dressCode/story/lịch: dress code + lịch trình
    hiện; story KHÔNG hiện vì mẫu deco không có section câu chuyện
    (hành vi cũ của mẫu, không phải lỗi sửa này).
  - (b2) minimal-do-do + dressCode/story/lịch: story + lịch trình +
    đếm ngược hiện; dress code KHÔNG hiện vì mẫu không-deco không có
    section dress code (hành vi cũ của mẫu).
  - (c) wizard → xem demo: link `/thiep/demo?d=…&from=wizard&blur=1`,
    phong bì mờ 2 tên, mở thiệp + film grain + badge chương, nút
    "← Quay lại sửa thiệp" về lại `/tao-thiep`, 0 lỗi trang. (Sửa kèm:
    dữ liệu lưu localStorage được gộp lên nền trống khi mở editor —
    thiệp lưu cũ thiếu trường không còn làm editor vỡ ở
    `photoUrl.startsWith`.)
  - (d) gallery → bấm mẫu: ra trang demo đầy đủ, không còn dialog.
    Lưu ý ngoài phạm vi sửa: `/mau-thiep` tự nó phát 9 lỗi hydration
    React #418 khi tải (ảnh nhỏ render Countdown trực tiếp nên giây
    server/client lệch nhau) — có sẵn từ trước, không do đợt sửa này.
