# Kế hoạch mẫu chuẩn đầu tiên (mẫu chuẩn #1)

Ngày: 2026-11-07. Hướng đã chốt: vài mẫu web chuẩn + paste ghost text 2 chiều.
File tham chiếu: `mau_chuan.svg` (chị gửi 2026-11-07 10:12) — form chuẩn chị thường làm cho khách.

## 1. Mẫu chuẩn #1 là gì

- **Form chuẩn 2 mặt lễ/tiệc** theo đúng file `mau_chuan.svg`: mặt trái là lễ (nhà chủ tiệc, tên cô dâu chú rể, ngày giờ lễ + ngày âm lịch), mặt phải là tiệc (lời mời, tên + địa chỉ nơi đãi tiệc, ngày giờ tiệc + ngày âm lịch).
- File form là **bản trống**: chữ trong file là token giữ chỗ (vd `{DATE.LE.NGAY}`, `{POS1.CON_FULL}`, `{VENUE.TEN}`), bọc bằng ký tự ẩn U+200B — khi có dữ liệu thật thì thay token bằng giá trị. 20 lớp đã đặt tên theo đúng khóa CEP (khóa `date.tiec.namyy` trong tên lớp ngày tiệc là khóa đúng — năm 2 chữ số, xem §6).
- File form **không có ảnh nền, không có hoa trang trí** (0 ảnh) — chỉ có chữ đỏ trên nền trắng. Phần nhìn (nền đỏ, hoa, khung) lấy theo đúng thiệp thật chị đã gửi (file Untitled-2-2): dùng ảnh trang trí đã có sẵn trong repo (`SongPhungDecor` / `/api/songphung`) nếu khớp, nếu không thì lấy ảnh từ file thiệp thật.
- Web chỉ cần **nội dung để sửa**, không cần hình thiệp thật của từng khách. Một mẫu web chuẩn xài cho nhiều thiệp tương tự nhau.

## 2. Luồng tổng thể (paste 2 chiều)

1. Chị làm thiệp trong Illustrator như bình thường → copy đoạn ghost text từ CEP.
2. Paste vào app (mục "Nhập từ Illustrator" trong trang Tạo thiệp — **đã có sẵn**).
3. App điền dữ liệu vào mẫu chuẩn #1 → chị kiểm tra, xem trước.
4. Khách quét QR 100k (SePay, đã chốt từ trước) → nhận link khách.
5. Khách mở link (trang riêng, chỉ có thiệp, không thấy chỗ làm việc của chị) → bấm vào tên/ngày/địa chỉ → box sửa hiện ngay tại chỗ đó → sửa → bấm **Chốt**.
6. App xuất lại ghost text + metadata → chị copy về CEP → khớp dữ liệu → in từ file .ai gốc.

## 3. Việc đã có sẵn (không làm lại)

- Parse ghost text: `parseCepGhostText` / `parseCepPlainText` (`src/lib/cep.ts`), đã có test 71/71.
- Map 32 khóa ↔ dữ liệu web: `cepValuesToData` / `buildCepValues` / `buildCepTextBlock` / `buildCepMetadataJson` (đã có).
- Mục paste + xuất ghost text trong trang Tạo thiệp (`src/app/(app)/tao-thiep/page.tsx`).
- Link khách `?d=` + link máy chủ (`?edit=<id>&t=<token>`), cửa thanh toán `paid_online` (`src/lib/server-store.ts`).
- Trang khách riêng không header/nav (route group `(khach)` — đã làm cho link SVG).
- Box sửa nổi tại chỗ (đã làm trong `SvgViewer.tsx`, kiểm chứng 375px) — chuyển ý tưởng sang mẫu chuẩn.
- Mẫu Song Phụng Đỏ: ảnh trang trí thật, hiệu ứng, spec `specs/song-phung-do.md`.

## 4. Việc cần làm cho mẫu #1

**B1. Trang khách sửa cho mẫu chuẩn (việc chính, mới).**
Route riêng trong nhóm `(khach)` (vd `/khach/[id]`), chỉ hiện thiệp + nút Chốt, không header/nav.
Hiển thị mẫu #1 với dữ liệu đã paste. Bấm vào nội dung nào thì box sửa hiện ngay tại chỗ đó (textbox/chips/lịch như đã làm), gõ tới đâu thiệp đổi tới đó. Các trường sửa được: tên 2 người, tên cha mẹ, địa chỉ 2 bên, vị thứ, loại lễ, nhà chủ tiệc, ngày/giờ lễ, ngày/giờ tiệc, tên + địa chỉ nơi đãi tiệc. Ngày âm lịch tự tính từ ngày dương (đã có `lunar.ts`), không cho sửa tay.

**B2. Nối paste → mẫu → link (trang Tạo thiệp).**
Sau khi paste điền form xong, chị chọn mẫu chuẩn #1, bấm Lưu → app tạo thiệp trên máy chủ + link khách (đi qua bước quét QR 100k nếu chưa trả — dùng lại luồng thanh toán đã có). Không làm thêm luồng thanh toán mới.

**B3. Chốt → ghost text trả về (mới).**
Khách bấm Chốt → lưu dữ liệu cuối lên máy chủ → hiện ghost text + metadata trong trang Quản lý (chị copy về CEP) và hiện luôn trên trang khách sau khi chốt để chị tự mở link lấy cũng được. Test bắt buộc: ghost text vào → sửa 1 tên + 1 ngày → ghost text ra phải đúng 2 chỗ đã sửa, 30 khóa còn lại không đổi.

**B4. Demo mờ trước khi trả (dùng lại).**
Trước khi khách trả tiền, link xem trước hiện thiệp với tên/ngày/giờ/nơi làm mờ (như đã chốt), hoa văn/màu sắc/hiệu ứng vẫn rõ. Dùng lại `OnlineDemoWizard` + cửa `paid_online`, không làm mới.

**B5. Kiểm chứng rồi mới đẩy (luật của chị: 1 lần đẩy).**
Build chạy được; test CEP 71/71 + thêm test round-trip paste→chốt; Playwright 375px chụp: trang khách mẫu #1, box sửa tại chỗ, sau chốt; kiểm tra bằng ghost text thật lấy từ file form chuẩn. Xong mới đẩy 1 lần lên production. Chị test thật trên điện thoại (bàn phím có che box sửa không, bấm sửa có dễ không).

## 5. Ngoài phạm vi mẫu #1

- Các bộ sưu tập khác (Nhật Bình Đỏ là mẫu #2).
- Nút đổi mẫu sau khi trả tiền (đã hoãn từ trước — khách muốn đổi thì chị xử lý tay).
- Tải SVG từng mẫu/khách + cửa detect (giữ làm dự phòng, không phải luồng chính nữa).
- Upload font riêng (giới hạn đã biết: điện thoại hiện font dự phòng, bản in từ .ai vẫn đúng).

## 6. Ghi chú / rủi ro

- Tên lớp ngày tiệc dùng khóa `date.tiec.namyy` — đây là khóa **ĐÚNG, không phải lỗi chính tả**: một số mẫu dùng định dạng năm 2 chữ số cuối (26 thay vì 2026). Quy tắc: khi đọc giá trị trong khung namyy, 2 chữ số thì hiểu là năm 20xx, 4 chữ số thì giữ nguyên năm; khi ghi lại vào SVG thì giữ nguyên số chữ số như giá trị gốc trong khung. Khóa này là khóa dẫn xuất từ `date.tiec.nam`, KHÔNG thêm vào danh sách 32 khóa CEP (thứ tự ghost text giữ nguyên 32).
- Token `{pos1.ongba}` trong file form không phải khóa CEP — đó là nhãn "Ông Bà:" ở đầu thiệp, app hiển thị cố định.
- Token giữ chỗ dài hơn giá trị thật nên khi xem file form trực tiếp, dòng ngày/giờ tiệc có thể chồng nhau — không phải lỗi, giá trị thật ngắn hơn sẽ hiện đúng (đã chứng minh ở ảnh 08).
- **Điều kiện để bán thật:** cần project Supabase mới cho Thiệp Đôi (dữ liệu chốt của khách phải lưu được qua máy khác; file lưu local trên máy chủ không dùng được trên Vercel) + tài khoản SePay + Vietcombank riêng + `THIEP_ADMIN_TOKEN` — đều là việc của chị, đã ghi từ trước. Build + kiểm chứng local làm trước, không chờ mấy việc này.

## 7. Việc cần chị

1. Duyệt kế hoạch này (bấm chọn bên dưới hoặc nhắn "duyệt").
2. SePay + Vietcombank riêng + Supabase mới (khi nào rảnh — cần trước lúc bán thật, không cần trước lúc build).
3. Sau khi build xong: test thật trên điện thoại của chị.

## 8. Bổ sung sau khi duyệt kế hoạch (Nancy 2026-11-07, làm cùng mẫu #1)

- **Chat theo từng thiệp:** khung chat cuối trang khách (dưới nút Chốt) — khách ghi chú, chị đọc + trả lời trong Quản lý, khách mở lại link thấy trả lời. Lưu cùng bản ghi thiệp, không realtime.
- **Lịch sử sửa:** mỗi lần khách sửa xong lưu 1 dòng (loại, nhãn, cũ, mới, thời gian); chị xem trong Quản lý.
- **Đánh dấu chỗ đã sửa:** trường dữ liệu sửa → dấu nhẹ + chảy về ghost text; câu mẫu cố định sửa → đánh dấu mạnh (nền vàng + "cần sửa tay") + gom vào danh sách "CẦN SỬA TAY TRONG ILLUSTRATOR" (chữ cũ → chữ mới) hiện cạnh ghost text lúc chốt. Câu mẫu đã sửa lưu riêng, không trộn vào ghost text.
