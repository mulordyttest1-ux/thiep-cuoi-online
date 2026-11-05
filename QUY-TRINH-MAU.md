# Quy trình làm mẫu thiệp — bản nâng cấp (sau 5 vòng Song Phụng Đỏ)

Mục tiêu: mỗi mẫu còn lại làm NHANH và CHÍNH XÁC ngay từ đầu, thay vì sửa đi
sửa lại nhiều vòng như Song Phụng Đỏ (17 vòng QA mới gần giống — xem bài học
ở dưới và quy định mới ở mục Tiêu chí "đạt").

## Bài học rút ra (vì sao lần trước lâu)

1. **Đoán bằng mắt là chậm nhất.** Nhìn ảnh chụp rồi ước chừng vị trí/cỡ chữ
   khiến mỗi vòng chỉ sửa được vài chỗ, vòng sau lại lòi ra chỗ khác.
2. **Thẻ thư viện và bản xem trước vẽ riêng nhau.** Hai chỗ cùng hiển thị một
   mẫu nhưng code khác nhau nên lệch nhau (thẻ vẫn hiện bản cũ dù bản xem
   trước đã mới) — tốn nguyên một vòng sửa.
3. **Đánh giá cảm tính mâu thuẫn nhau.** Vòng 1–4 nói tên căn giữa, vòng 5 nói
   tên lệch trái. Không có số đo thì không biết ai đúng.
4. **Sửa xong mới kiểm tra trên bản đã đưa lên mạng.** Mỗi vòng tốn 2 lần chờ:
   chờ đưa lên mạng + chờ mở trình duyệt so sánh.

## Quy trình mới cho mỗi mẫu (5 bước, làm theo thứ tự)

### Bước 1 — Lấy số thật từ trang gốc (không đoán)
- Tải HTML/CSS/JS của trang demo gốc về (trình duyệt đã tải về hết khi hiển
  thị trang, đây là mẫu của chính chủ nên được dùng lại).
- Trích ra các con số: vị trí + kích thước của tên, phụng, hoa, dải, chữ Hỷ;
  màu nền/chữ; tên font + độ đậm; khoảng cách trên/dưới.
- Tải ảnh trang trí gốc về qua đường dẫn cùng nguồn của app mới
  (`/api/songphung/...` với Song Phụng Đỏ; mẫu khác làm tương tự).
- Ghi tất cả vào file ghi chép của mẫu: `specs/<id-mau>.md`. File này là
  "đáp án" — mọi lần kiểm tra sau đều đối chiếu với nó, không đối chiếu
  bằng cảm giác.

### Bước 2 — Làm 1 lần theo số thật
- Dựng mẫu mới đúng theo các con số ở Bước 1, không ước chừng.
- Kiểm tra bằng lệnh build + mở thử trên máy trước khi đưa lên mạng.

### Bước 3 — So bằng số đo, không so bằng mắt
- Đo khung từng phần (tên, phụng, dải, chữ Hỷ) bằng số trên cả hai trang
  (khung bao, tâm, khoảng cách tới mép) ở cùng một cỡ cửa sổ, rồi đối chiếu
  với file ghi chép ở Bước 1.
- Chỉ khi các số đã khớp (sai lệch dưới ngưỡng cho phép) mới chuyển sang
  Bước 4. Cách đo này đã chứng minh hiệu quả ở Song Phụng Đỏ (nó lật lại
  kết luận sai "tên căn giữa" của 4 vòng trước).
- Ghi chú 2026-11-05: đã thử 2 lần cài trình duyệt riêng trên máy để chụp
  màn hình + trừ ảnh tự động (Playwright Chromium) nhưng tải về đều thất
  bại, nên tạm thời chưa có bước trừ ảnh tự động — dùng đo khung bằng số
  qua trình duyệt kiểm tra thay thế. Ai thử lại thì ghi kết quả vào đây.

### Bước 4 — Một nguồn hiển thị duy nhất
- Thẻ ngoài thư viện PHẢI dùng chung đúng phần hiển thị của bản xem trước,
  không vẽ lại bản thu nhỏ riêng. Sửa một chỗ là cả hai cùng đổi, không bao
  giờ lệch nhau nữa.

### Bước 5 — Người kiểm tra 1 lần cuối
- Chỉ khi máy đã báo giống mới mở trình duyệt so sánh bằng mắt một lần cuối
  để chốt. Nếu lần này vẫn chưa giống, quay lại Bước 1 bổ sung số còn thiếu
  (không đoán), không sửa mò.

## Tiêu chí "đạt" (ghi rõ để khỏi tranh cãi)

### Quy định mới 2026-11-05 (quyết định của chị, áp dụng cho Song Phụng Đỏ
### và mọi mẫu sau — thay cho yêu cầu "giống hệt" trước đây)
- **Giữ khung chung + hiệu ứng, tái sử dụng.** Khung chung (phong bì, tên,
  lịch, album, tiệc, lịch trình) và hiệu ứng đã làm xong một lần thì mẫu sau
  dùng lại, chỉ đổi họa tiết/màu/số đo.
- **Không cần giống hệt — gần giống là được.** Lệch tọa độ một chút, lệch
  font một chút thì vẫn đạt.
- **Không được sai hẳn về concept, không được lỗi.** Chữ bị cắt mất, bản đồ
  sai khu vực, tim rỗng/không đọc được số, sai thứ tự/sai cấu trúc bố cục,
  thiếu mục, vỡ layout — vẫn là CHƯA đạt.
- Tên: đúng vị trí (trái/giữa), đúng số dòng, đúng độ đậm, không dấu & (trừ
  phong bì).
- Phụng/hoa: đúng vị trí, đúng tầm cao (đuôi phụng qua dải tới đâu), không
  thừa hình trong dải.
- Dải + chữ Hỷ: đúng chiều cao, chữ Hỷ lệch lên trên (tràn trên, đáy nằm
  trong dải), để lại dải đỏ trống phía dưới.
- Không ảnh cưới của cặp đôi mẫu, không dùng dữ liệu demo (tên, địa chỉ,
  địa điểm của cặp đôi mẫu) — chỉ dùng hình trang trí của mẫu.
- Không đưa RSVP / sổ lời chúc / thanh toán trở lại khi chưa có lệnh.

## Công cụ
- `~/workspace/tools/shot-diff/` — chụp màn hình + trừ ảnh tự động
  (Playwright + PIL). Đang cài đặt; nếu máy này không chạy được trình duyệt
  riêng thì dùng cách đo khung bằng số qua trình duyệt kiểm tra thay thế.
- File ghi chép từng mẫu: `specs/<id-mau>.md` (chưa có — tạo ở Bước 1 của
  mỗi mẫu).

## Thứ tự làm các mẫu còn lại
- Làm xong Song Phụng Đỏ trước (đang ở vòng 17, kiểm tra theo tiêu chí mới
  ở trên).
- Mẫu tiếp theo ưu tiên: Nhật Bình Đỏ (mẫu truyền thống, chị đã nhắc tới).
- Mỗi mẫu đi hết 5 bước mới sang mẫu sau; không làm nhiều mẫu cùng lúc để
  khỏi lẫn số liệu.
