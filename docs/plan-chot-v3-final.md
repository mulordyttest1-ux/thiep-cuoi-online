# PLAN CHỐT — Thiệp Đôi bán thiệp online 100k (v3-final, 2026-11-06)

Trạng thái: **ĐÃ CHỐT — CODE THEO BẢN NÀY.** Các bản v1/v2 cũ, watermark, giá 299k, hết hạn xem trước 3 ngày, trang khóa làm luồng chính đều HỦY.

## 1. Workflow chốt (5 bước, tự động, không cần nhân viên)

1. Khách gửi nội dung → Nancy / vệ tinh làm thiệp vật lý, chốt in như bình thường.
2. Xong vật lý, trong trang sửa thiệp (`/tao-thiep`) tự hiện mục **"Xem demo thiệp online"** — không ai gửi link tay.
3. Khách xem demo **duy nhất đã đổ dữ liệu của mình** (tên, ngày, địa điểm từ bản vật lý + chỗ trống cho ảnh/thông tin thêm của online). Blur tên + ngày + giờ + địa điểm; bấm ô nào để sửa thì ô đó hiện rõ lúc sửa, xong lại blur. Chưa trả tiền thì **chọn mẫu thoải mái, không giới hạn**, không tính lượt.
4. Wizard 3 bước hướng dẫn khách tự làm: (1) Chọn mẫu → (2) Thêm ảnh / thông tin thêm → (3) Quét QR 100k nhận link. Không chat agent tự do.
5. Quét QR → SePay webhook tự mở → trả **link xịn độc lập, mã hóa dữ liệu vào trong link, chỉ đọc** (kiểu `?d=` hiện tại). Link demo (blur) và link xịn (rõ) là 2 link khác nhau, demo không suy ra được link xịn.

## 2. Quyết định đã chốt (không bàn lại)

- Giá: **100.000đ / thiệp online**, một hằng số `ONLINE_PRICE_VND`, mọi mẫu như nhau.
- Không watermark. Không làm khó đọc. Blur là đủ (khách chủ yếu xài điện thoại, không lo mở code).
- Không sợ chụp màn hình: chấp nhận mất mát nhỏ. Giữ khách bằng thiệp đẹp, effect tốt, nội dung dài hơn 1 màn hình.
- SePay gói **FREE** (0đ/tháng, 50 giao dịch tiền vào/tháng). Tiền về thẳng tài khoản Nancy, SePay chỉ báo webhook.
- Tài khoản nhận tiền online: **tài khoản Vietcombank RIÊNG chỉ nhận tiền thiệp online** (không dùng tài khoản chính đang nhận tiền vật lý — SePay tính 50 lượt trên toàn bộ tiền vào tài khoản đó).
- Link xịn dùng tới **30 ngày sau ngày cưới**.
- Tiền mặt: **không có nút mở tay**. Khách trả tiền mặt thì vẫn quét QR chuyển khoản; Nancy nhận tiền mặt rồi chuyển 100k qua QR hộ khách cũng được (vẫn qua webhook).
- Tiền mừng cưới tách bạch: tiền mua thiệp về VCB của Nancy qua SePay; tiền mừng cưới về tài khoản cô dâu chú rể (QR mừng cưới trên thiệp).

## 3. SePay — khớp mã nào, mở khi nào

- Mỗi cặp (thiệp + mẫu) có mã riêng, vd `THIEPABC123-SONGPHUNG`. QR ghi sẵn đúng 100.000đ + đúng mã, khách chỉ quét.
- Webhook `/api/webhooks/sepay` mở khi cả 3 đúng: (1) nội dung chứa mã khớp đúng 1 thiệp + mẫu, (2) số tiền >= 100.000đ (thiếu không mở, thừa vẫn mở, không hoàn tự động), (3) mã giao dịch SePay chưa từng dùng để mở (chống mở 2 lần).
- Webhook kèm secret Nancy đặt trong dashboard SePay. Chưa có secret thì từ chối webhook.
- Ngoại lệ duy nhất: **đối soát tay, chỉ Nancy bấm, có log** — khi khách đã chuyển tiền thật nhưng sai nội dung / webhook lỗi, Nancy nhập mã giao dịch SePay + ảnh bill để mở. Không có nút "đã thu tiền mặt" bừa bãi, vệ tinh không bấm được.

## 4. Phạm vi bản đầu (v1 — làm ngay)

- Mục "Xem demo thiệp online" trong trang sửa, demo đã đổ dữ liệu + blur tên/ngày/giờ/địa điểm, chọn mẫu thoải mái trước trả tiền.
- Wizard 3 bước.
- QR SePay 100k theo từng thiệp + mẫu, webhook, nút "Tôi đã chuyển — kiểm tra".
- Trả link xịn mã hóa tĩnh, chỉ đọc, độc lập.
- Dọn code v1 cũ: giá 299k → 100k, xóa `PreviewWatermark.tsx` + cờ watermark, bỏ hết hạn xem trước 3 ngày, bỏ trang khóa làm luồng chính (link xem trước cũ chuyển tới mục demo online).
- Kho dữ liệu: giữ abstraction `server-store` hiện có; preview local dùng file JSON, production PHẢI có Supabase mới cho Thiệp Đôi (không dùng chung Sổ Tiền) — code phải chạy được với biến môi trường Supabase, chưa có Supabase thì route ghi trả lỗi rõ ràng thay vì lặng lẽ mất dữ liệu.
- README + `.env.example` cập nhật (giá, SePay env, không watermark).

## 5. LÀM SAU (không làm ở bản đầu)

- Nút đổi mẫu sau khi trả tiền. Bản đầu: chọn 1 mẫu, không có nút đổi; khách đã trả tiền mà thực sự muốn đổi thì xử lý tay. Bản sau: nút đổi đặt ở trang quản lý / trang sửa của chủ thiệp (không đặt trên link khách mời), quy tắc: 1 lần đổi miễn phí, mỗi 100k được chọn 2 lần (mẫu đầu + 1 lần đổi), chỉ xác nhận với khách khi khách bấm đổi, không ghi chú rõ trước.
- Agent chat tự do cho khách. Link riêng từng khách tự tạo bởi khách (Nancy tạo ở Quản lý khách ở bản đầu).

## 6. Việc Nancy làm (không làm hộ được)

1. Tạo tài khoản SePay + nối tài khoản Vietcombank RIÊNG cho tiền online + lấy webhook secret → đưa `SEPAY_BANK_CODE=VCB`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`, `SEPAY_WEBHOOK_SECRET` vào biến môi trường Vercel (khi code xong, trước lúc mở bán thật).
2. Duyệt bản xem trước qua tunnel / link xem trước rồi mới cho đẩy lên Vercel (preview-first, như mọi lần).

## 7. Kiểm chứng trước khi đẩy Vercel

- Build local pass. Demo blur: tên/ngày/giờ/địa điểm mờ, họa tiết sắc nét, bấm ô sửa thì hiện rõ.
- Chọn mẫu thoải mái trước trả tiền, không bị tính lượt.
- QR đúng 100k + đúng mã thiệp+mẫu; webhook giả lập đúng mã + đủ tiền thì mở và trả link xịn; sai mã / thiếu tiền thì không mở.
- Link `?d=` cũ / link demo sau trả tiền không suy ra được link xịn trước trả tiền; link xịn mở ra rõ, chỉ đọc.
- Đối soát tay chỉ Nancy bấm được, có log.
