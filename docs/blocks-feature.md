# Khối có sẵn thêm/bớt — thiệp online

Khách/Thiết kế tự ẩn/hiện từng khối trên thiệp online thay vì thiệp lúc
nào cũng bản đủ (có khách không có dress code, không có ảnh, không thích
bản đủ). Chỉ online — không đụng form in / ghost text / khóa CEP.

## Các khối

| Khối | Nhãn trên nút | Mẫu nào có | Mặc định ẩn khi |
|---|---|---|---|
| `album` | Album ảnh | Mọi mẫu | Không có ảnh (`photoUrl` trống) |
| `countdown` | Đếm ngược | Chỉ mẫu thường | Không có ngày cưới |
| `timeline` | Lịch trình ngày cưới | Mọi mẫu | Không có dòng lịch trình nào |
| `dresscode` | Dress code | Chỉ mẫu trang trí | Không có màu hợp lệ |
| `map` | Bản đồ | Chỉ mẫu trang trí | Không có địa chỉ (cả section địa điểm + bản đồ) |
| `story` | Câu chuyện | Chỉ mẫu thường | Câu chuyện trống |

Lõi KHÔNG cho ẩn: hero + thông tin lễ + thông tin tiệc (mẫu thường:
tên + thẻ ngày/giờ/địa điểm). Nút của khối mà mẫu đang chọn không có thì
mờ đi, ghi "Mẫu đang chọn không có mục này."

## Dữ liệu

`InvitationData` thêm 2 trường tùy chọn (`src/lib/types.ts`):

- `hiddenBlocks?: string[]` — khối ẩn tay (thắng cả khi có nội dung).
- `shownBlocks?: string[]` — khối hiện tay dù đang trống nội dung.

Thiếu cả hai = như trước (hiện đủ, trừ khối trống thì ẩn) nên dữ liệu cũ
tương thích ngược. Hai trường đi theo link `?d=` (encode toàn bộ object)
và link máy chủ `?t=` (máy chủ merge nguyên object) — không cần sửa
store/server.

Logic ở `src/lib/blocks.ts`: `BLOCKS`, `hasBlockContent`,
`isBlockVisible(data, id)`, `toggleBlockPatch`, `resetBlocksPatch`,
`blockAppliesTo`.

## Giao diện

`src/components/BlockToggles.tsx` — danh sách bật/tắt tiếng Việt
("Đang hiện"/"Đang ẩn" + nút "Đặt lại như mặc định"). Gắn trong
`OnlineDemoWizard`: bước 1 dưới demo (bấm là demo đổi ngay) và bước 2
cùng nhóm ảnh/thông tin thêm. Ghi chú: hiện KHÔNG có trang sửa online
cho khách — `/thiep/[id]` chỉ đọc, `/khach/` là luồng in — nên nút bật/tắt
nằm ở wizard của Thiết kế trong `/tao-thiep`; khách hưởng kết quả trên
link xịn/link khách.

## Render

`InvitationPreview` chỉ bọc các section bằng `isBlockVisible` (không đụng
dòng effects/fx): album coverflow (deco), đếm ngược + lịch trình + câu
chuyện (mẫu thường), địa điểm/bản đồ + dress code + timeline (deco).
Album lưới của mẫu thường bọc ở `thiep/[id]/page.tsx`.

Lưu ý:

- Số chương (`data-chapter`) giữ nguyên như cũ — ẩn 1 khối thì số chương
  đó bị nhảy qua (vd chỉ còn lõi thì đếm 01/04), không vỡ vì reception +
  map vốn đã cùng mang số 4. Thanh tiến trình + marquee không lỗi.
- Dải tên chạy ngang (marquee) trước lịch trình vẫn hiện khi timeline bị
  ẩn — đó là hiệu ứng, thuộc task thư viện effect, không đụng ở đây.

## Thử nhanh

1. Mở `/tao-thiep` → mục "Xem demo thiệp online" → bước 1: bật/tắt ở
   "Chọn mục hiển thị trên thiệp online", xem demo đổi ngay.
2. Hoặc mở link khách `?d=` có `hiddenBlocks` (vd `["album","dresscode"]`)
   — kiểm tra bằng script `/tmp/pw/qa-blocks.mjs`.

## QA (2026-11-09, local)

- `npm run build` PASS.
- Playwright mobile 390px, 6 case trên production build local
  (`/tmp/pw/qa-blocks.mjs`, ảnh `~/workspace/qa-screenshots-blocks/`):
  deco đủ khối / deco ẩn album+dress code / deco chỉ còn lõi /
  deco trống nội dung (tự ẩn) / mẫu thường đủ khối / mẫu thường chỉ còn
  lõi. Khối ẩn biến mất hẳn khỏi DOM, lõi còn nguyên, chiều cao trang
  thu lại đúng (deco 3385 → 1811px khi chỉ còn lõi; mẫu thường 2072 →
  964px), 0 lỗi JS. Ảnh Unsplash lỗi `ERR_TUNNEL_CONNECTION_FAILED` là
  do proxy của máy kiểm tra chặn ảnh ngoài — trên điện thoại thật vẫn hiện.
- Ảnh fullPage có mục dưới bị mờ là artifact của ScrollReveal
  (whileInView chưa kích khi chụp) — đã kiểm riêng bằng ảnh viewport khi
  cuộn tới section (`deco-core-only-reception.png`: section tiệc hiện đủ,
  lịch tháng + tim ngày cưới bình thường).
