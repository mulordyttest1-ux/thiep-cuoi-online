# Thiết kế: Khóa thiệp + bán thiệp online 100k (bản v2 — theo quyết định mới của Nancy, 2026-11-06)

> Trạng thái: **BẢN THIẾT KẾ — CHƯA CODE.** Bản v1 đã code dở (watermark + giá 299k + hết hạn xem trước 3 ngày) đã DỪNG và CHƯA build/push/deploy. Chỉ code lại sau khi Nancy duyệt bản này.

## 0. Quyết định đã chốt (không bàn lại)

1. **Giá thiệp online: 100.000đ / thiệp.** Một hằng số duy nhất (`ONLINE_PRICE_VND`), đổi 1 chỗ.
2. **KHÔNG watermark — bỏ hoàn toàn.** Khách chấp nhận watermark để được rẻ, và watermark làm hại các cơ sở vệ tinh.
3. **KHÔNG sợ chụp màn hình — chấp nhận mất mát này.** Cách giữ khách trả tiền là làm nội dung đẹp, effect tốt, nội dung dài hơn 1 màn hình: chụp màn hình chỉ lấy được 1 màn, không lấy được cả thiệp. 100k cho một thiệp đáng giá thì họ sẽ trả.
4. **TRƯỚC CHỐT: xem trước thoải mái** — không watermark, không hạn chế, sửa/chốt in bình thường. Nancy là công ty thiệp, các cơ sở vệ tinh đưa thiệp cho chị làm, họ rất hay xin xỏ — luồng xem trước phải thoải mái cho vệ tinh/khách, đừng làm khó họ lúc này.
5. **SAU CHỐT: bản cuối khóa chỉ đọc. Khách TỰ THẤY cách mua ngay trên trang đã khóa** — không cần qua vệ tinh hỏi nữa (hỏi mất thời gian, hay xin xỏ). Dễ nhất cho khách: chỉ quét QR là xong. Thanh toán xong SePay webhook tự mở, không cần ai duyệt tay.
6. **SePay gói FREE đã chốt** (0đ/tháng, 50 giao dịch tiền vào/tháng, nối Vietcombank qua API, tài khoản cá nhân được). Tiền về thẳng tài khoản Nancy, SePay chỉ báo webhook.

## 0a. Cách cực dễ của Nancy (2026-11-06 08:08 — chốt hướng, bổ sung cho v2)

- **2 link khác nhau hoàn toàn:** link sửa (khách sửa được) vs link thiệp gửi online (bản xịn, chỉ sau khi quét QR trả 100k).
- **Link sửa không gửi được cho khách mời:** nó mở ra là trình sửa, không phải thiệp mời — không có phong bì mời, không có tên riêng từng khách, không có nút chia sẻ / tạo link khách. Khách có copy URL gửi đi thì người nhận cũng chỉ thấy trang sửa, không mời được ai.
- **Sau chốt, link sửa còn dùng được một thời gian, rồi khóa lại:** hết thời gian ân hạn thì link sửa tự biến thành trang chỉ hiện QR + hướng dẫn chi tiết — muốn mua online thì quét QR 100k, chỉ dùng thiệp vật lý thì không cần làm gì. Thời gian ân hạn chưa chốt (đề xuất 3 ngày sau chốt, để kịp kiểm tra bản in / sửa lỗi in nếu cần).
- Cách này ổn — đây chính là lõi của v2, chỉ thêm thời gian ân hạn cho link sửa thay vì khóa ngay lập tức.

## 0b. Workflow cuối của Nancy (2026-11-06 08:12 — đơn giản nhất, giải quyết chụp màn hình gọn nhất)

1. Khách gửi nội dung (tên, ngày, địa điểm...).
2. Làm thiệp vật lý, chốt in như bình thường.
3. Xong phần vật lý, nếu khách có nhu cầu online: khách xem **demo các mẫu thiệp (tên người khác)** rồi chọn mẫu mình muốn.
4. Quét QR 100k (mã chứa đúng thiệp + đúng mẫu đã chọn).
5. Hệ thống trả link đã **đổ dữ liệu của khách vào đúng mẫu khách chọn** — link xịn, sẵn sàng gửi khách mời.

Vì sao cách này giải quyết chụp màn hình: demo là tên người khác, chụp lại cũng không mời được ai — tên sai, ngày sai, địa điểm sai. Bản online của chính khách **không bao giờ hiện trước khi trả tiền**, nên không có gì để lộ. Không cần watermark, không cần khóa xem trước, không cần ân hạn phức tạp. Chọn mẫu online tách riêng với mẫu vật lý — khách thích mẫu online khác mẫu in cũng được.

## 0c. Tự động hóa + demo đã đổ dữ liệu + blur (Nancy 2026-11-06 08:17 — chốt hướng)

- **Tự động, không gửi tay:** xong vật lý thì ngay trong trang sửa thiệp (`/tao-thiep`) tự hiện mục **"Xem demo thiệp online"** — khách (hoặc vệ tinh) bấm vào là xem demo, chọn mẫu, sửa thêm, trả tiền, nhận link. Nancy không gửi link gì thêm.
- **Vật lý vs online khác dữ liệu:** thiệp vật lý không gian có hạn nên thường **không in ảnh khách**; thiệp online một số mẫu **có ảnh + thêm thông tin** (lịch trình, album, bản đồ...). Nên demo online là **bản đã đổ dữ liệu của khách vào luôn** (tên, ngày, địa điểm từ bản vật lý + chỗ trống cho ảnh/thông tin thêm).
- **Blur, không làm khó đọc:** thông tin quan trọng (tên, ngày tháng) **blur** trên demo. Bấm vào ô để sửa thì ô đó hiện rõ lúc sửa, sửa xong lại blur lại — khách vẫn kiểm tra và sửa được dữ liệu của mình, nhưng chụp màn hình thì tên/ngày vẫn mờ, không dùng được. Blur là chuẩn ngành, nhìn là hiểu "bản xem trước", giữ được vẻ đẹp của thiệp; làm khó đọc (chữ nhạt, méo, rối) nhìn như lỗi, làm xấu thiết kế và vệ tinh/khách tưởng app hỏng.
- **Bot agent hướng dẫn:** một con agent trong trang demo hướng dẫn khách từng bước, tự động, không cần nhân viên — hỏi ảnh còn thiếu, hỏi thông tin thêm, gợi ý mẫu, nhắc quét QR 100k, trả link sau khi trả tiền. Khách tự làm hết.
- **Hiệu ứng đầu tư chất xám:** khách đã tự tay sửa ảnh, thêm thông tin, chọn mẫu trên demo thì đã bỏ công sức vào rồi — lúc đó 100k để lấy bản đẹp của chính mình rất dễ trả.

```
nháp (draft)
  → đang gửi khách duyệt in (preview)     [xem + sửa thoải mái, không hạn chế]
  → đã chốt bản cuối (locked)             [chỉ đọc; link cũ biến thành trang khóa + QR 100k]
  → đã trả tiền online (paid_online)      [link khách chính thức mở, dùng tới 30 ngày sau cưới]
```

| Trạng thái | Ai sửa được | Khách xem được gì | Link khách |
|---|---|---|---|
| nháp | Nancy | chưa gửi | chưa có |
| duyệt in | Nancy + khách (link sửa) | **toàn bộ thiệp, không watermark, không hạn chế** | chưa có — không tạo được |
| đã chốt | không ai (trừ Nancy mở khóa để sửa in) | **chỉ trang khóa: bìa + tên + ngày + QR 100k** (không còn xem toàn bộ thiệp) | chưa có — không tạo được |
| đã trả tiền | không (bản cuối đã chốt) | toàn bộ thiệp, link khách chính thức | có — link chung + link riêng từng khách |

### Vì sao trang khóa KHÔNG cho xem toàn bộ thiệp nữa?

Đây là điểm mấu chốt của bài toán. Trước chốt, khách đã xem toàn bộ thiệp để duyệt in — đó là cần thiết. Nhưng sau chốt, nếu trang khóa vẫn hiện toàn bộ thiệp thì khách chỉ cần chia sẻ link đó cho họ hàng là mời online miễn phí, QR trên trang chẳng có tác dụng gì. Đúng kiểu khách chây lì mà Nancy nói.

Vì vậy sau chốt, **link khách đã có biến thành trang khóa**: chỉ hiện bìa thiệp (phong bì đóng + tên cô dâu chú rể + ngày cưới) + dòng "Thiệp đã chốt in — bản cuối chỉ đọc" + QR mua thiệp online. Toàn bộ nội dung bên trong (lịch trình, album, bản đồ, mừng cưới...) chỉ mở khi đã trả tiền. Chụp màn hình trang khóa cũng chỉ được cái bìa — không mời được ai bằng cái bìa.

Khách đã duyệt kỹ nội dung trước chốt rồi nên sau chốt không cần xem lại toàn bộ. Muốn xem lại / mời online thì trả 100k — đó chính là sản phẩm đang bán.

## 2. Hai loại link (khác nhau hoàn toàn)

### Link xem trước — gửi khách duyệt in (trước chốt)

- Dạng: `/xem-thu/<id>?t=<previewToken>` (token riêng, khác token khách).
- Trước chốt: mở ra là **toàn bộ thiệp, không watermark, không giới hạn thời gian, không giới hạn lượt xem**. Vệ tinh/khách xem thoải mái, đối chiếu màu in thoải mái.
- Kèm link sửa cho khách: `/tao-thiep?edit=<id>&t=<editToken>` — khách sửa trực tiếp, gửi lại cho Nancy. Chỉ dùng được khi chưa chốt.
- **Không có nút chia sẻ / tạo link khách** trên trang xem trước: đây là trang duyệt in, không phải công cụ mời khách. (Người xem vẫn copy được URL trên thanh địa chỉ — không chặn được, và cũng không cần chặn: sau chốt link này tự biến thành trang khóa.)
- Trang xem trước có ghi chú nhỏ ở cuối: "Sau khi chốt in, mua thiệp online 100.000đ để gửi link mời chính thức cho khách." — để khách biết trước giá, lúc chốt không bị bất ngờ.

### Link khách mời — chỉ sau khi trả tiền

- Dạng: `/thiep/<id>?gt=<guestToken>` (link chung) và `/thiep/<id>?gt=<token-riêng>&guest=<tên>` (link riêng từng khách, tên hiện trên phong bì).
- Chỉ tạo được khi trạng thái = `paid_online`. Trước đó, trang Quản lý khách từ chối tạo link.
- Mở ra là toàn bộ thiệp, không watermark, có QR mừng cưới (tài khoản của cô dâu chú rể — khác tài khoản nhận tiền mua thiệp của Nancy).
- Hiệu lực tới **30 ngày sau ngày cưới** (chuẩn cộng đồng; chờ Nancy chốt — xem mục 6).

### Sau chốt / sau trả tiền, link cũ đi về đâu?

- Link xem trước sau chốt → **trang khóa + QR** (không cần gửi link mới).
- Link xem trước sau trả tiền → hiện nút "Thiệp đã mở — lấy link khách chính thức" + cho sao chép link khách. Khách tự lấy link, không cần Nancy gửi.
- Link `?d=` cũ (dữ liệu nằm trong URL) và dữ liệu localStorage: **sau khi thiệp đã lên máy chủ, máy chủ thắng** — trang `/thiep/[id]` hỏi máy chủ trước, có bản ghi máy chủ thì quyết định của máy chủ thắng link `?d=` cũ. Đây là chỗ sửa lỗi gốc của app hiện tại (dữ liệu nằm trong URL thì ai có link là sở hữu vĩnh viễn).

## 3. Trang khóa hiển thị gì (sau chốt, chưa trả tiền)

Thứ tự từ trên xuống:

1. **Bìa thiệp** — phong bì đóng, tên cô dâu & chú rể, ngày cưới. (Đủ để khách nhận ra đúng thiệp của mình.)
2. **Dòng trạng thái:** "Thiệp đã chốt in — bản cuối chỉ đọc, không sửa được nữa."
3. **Khối mua thiệp online (nội dung chính của trang):**
   - "Mời khách online bằng thiệp này — 100.000đ / thiệp"
   - **QR VietQR SePay 100k** (tài khoản Vietcombank của Nancy, đúng số tiền 100.000đ, đúng nội dung `THIEP...` — xem mục 5)
   - Số tiền + số tài khoản + nội dung chuyển khoản, kèm nút "Sao chép nội dung chuyển khoản"
   - Hướng dẫn 2 dòng: "Mở app ngân hàng bất kỳ → quét mã → chuyển đúng 100.000đ + đúng nội dung. Tiền vào là thiệp tự mở trong vài giây, không cần chờ ai duyệt."
   - Nút "Tôi đã chuyển — kiểm tra xem đã mở chưa" (gọi lại API trạng thái; nếu webhook đã xử lý thì hiện link khách ngay).
4. **Khách mua xong được gì:** toàn bộ thiệp online + link riêng từng khách + dùng tới 30 ngày sau ngày cưới.
5. Không có: toàn bộ nội dung thiệp, link khách, nút chia sẻ, QR mừng cưới.

## 4. QR ở đâu?

- **Chính: ngay trên trang khóa** — khách đang ở đó, quét là xong, không cần hỏi ai, không cần qua vệ tinh.
- **Phụ: Nancy gửi kèm khi nhắn tin** (Zalo/tin nhắn) — cùng một ảnh QR (URL ảnh VietQR theo đúng số tiền + mã của thiệp đó). Không cần tạo QR khác.
- **Không hiện QR mua online trước chốt** — trước chốt khách đang duyệt in, hiện QR lúc đó chỉ làm rối. Chỉ ghi chú nhỏ về giá 100k ở cuối trang xem trước.

## 5. SePay webhook khớp mã nào?

Mỗi thiệp có **mã thanh toán duy nhất**, ví dụ thiệp id `thiep-mk8x-abc123` → mã `THIEPMK8XABC123`. QR ghi sẵn đúng số tiền + đúng mã này, khách chỉ cần quét — không cần gõ.

Webhook SePay gọi vào `/api/webhooks/sepay` mỗi khi tiền vào tài khoản Vietcombank của Nancy. Mở khóa khi **cả 3 điều kiện đúng**:

1. Nội dung chuyển khoản chứa mã `THIEP...` khớp đúng 1 thiệp.
2. Số tiền **>= 100.000đ** (trả thiếu thì không mở; trả thừa vẫn mở — tiền thừa là của Nancy, không hoàn tự động).
3. Mã giao dịch SePay chưa từng dùng để mở khóa (chống mở 2 lần cho 1 giao dịch; trả 2 lần cho 1 thiệp thì lần 2 bị bỏ qua — hoàn tiền xử lý tay, xem mục 6).

Không khớp mã / không phải tiền mua thiệp (ví dụ tiền khác chuyển vào tài khoản) → bỏ qua, không lỗi, không mở gì.

Bảo mật webhook: Nancy đặt một secret trong dashboard SePay, webhook phải kèm đúng secret mới được xử lý. Chưa đặt secret thì production từ chối webhook.

**Lưu ý tách bạch 2 dòng tiền:** tiền mua thiệp về tài khoản **Nancy (Vietcombank, qua SePay)**; tiền mừng cưới của khách mời về tài khoản **cô dâu chú rể** (QR mừng cưới trên thiệp). Hai tài khoản, hai QR khác nhau, không lẫn được.

## 6. Vì sao vệ tinh không thể xin mở miễn phí

Vệ tinh hay xin xỏ là vấn đề con người, nên thiết kế phải làm cho "xin" không có tác dụng về mặt kỹ thuật:

1. **Không có nút "mở miễn phí" ở bất cứ đâu khách/vệ tinh chạm được.** Trang khóa chỉ có QR trả tiền. Không có form "xin mở", không có nút "nhờ duyệt".
2. **Chỉ có 1 đường mở thiệp online: webhook SePay khớp tiền.** Không có đường duyệt tay cho việc mở online.
3. **Nút mở khóa của Nancy (admin) chỉ mở lại CHỈNH SỬA (về trạng thái duyệt in), không bao giờ mở thành `paid_online`.** Nghĩa là dù vệ tinh có xin được Nancy bấm mở khóa thì cũng chỉ sửa được nội dung in — vẫn không có link khách, vẫn phải trả 100k để mời online. Đường xin bị cụt ngay trong thiết kế.
4. **Token xem trước ≠ token khách.** Biết link xem trước cũng không suy ra được link khách; link khách chỉ sinh ra sau khi trả tiền.
5. **Dữ liệu nằm trên máy chủ, kiểm tra trạng thái mỗi lần mở.** Link `?d=` cũ, ảnh chụp màn hình, hay link xem trước đã lưu đều không mở được thiệp sau chốt.

### Ngoại lệ duy nhất cần Nancy quyết: khách trả tiền mặt tại cửa hàng

Khách đến tận nơi trả 100k tiền mặt thì không có webhook. Có 2 phương án (chọn 1):

- **A. Không có nút mở tay.** Khách trả tiền mặt vẫn quét QR chuyển khoản như bình thường (100k chuyển khoản, không cần tiền mặt). Đơn giản nhất, không có lỗ xin xỏ nào.
- **B. Có nút "đã thu tiền mặt" — chỉ Nancy bấm, có ghi log lý do + ngày giờ + ai bấm.** Tiện cho khách tiền mặt, nhưng vệ tinh sẽ xin Nancy bấm nút này thay cho khách — đúng cái Nancy muốn tránh. Nếu chọn B thì nên giới hạn: chỉ dùng khi khách đang đứng tại cửa hàng.

**Khuyến nghị: chọn A cho bản đầu.** Khách nào cũng có app ngân hàng để quét QR; tiền mặt thì Nancy nhận rồi tự chuyển 100k qua QR hộ khách cũng được (vẫn qua webhook, vẫn khớp mã).

## 7. Vì sao chấp nhận chụp màn hình được

- Thiệp dài hơn 1 màn hình (phong bì + thông tin + lịch trình + album + bản đồ + mừng cưới), hiệu ứng chỉ chạy khi cuộn/mở. Ảnh chụp được 1 màn, không lấy được cả thiệp, không có hiệu ứng, không có link riêng từng khách, không có tên khách trên phong bì.
- Giá trị 100k nằm ở: link mời chính thức đẹp + tên từng khách + dùng tới sau cưới + không phải đi xin. Khách thấy đáng thì trả; khách chỉ muốn xem thì đã xem miễn phí trước chốt rồi.
- Chấp nhận mất mát nhỏ (vài khách chụp màn hình gửi nhau) để đổi lấy: vệ tinh thoải mái duyệt in, khách không khó chịu vì watermark, thương hiệu không bị watermark làm xấu.

## 8. Còn cần Nancy quyết trước khi code (chờ duyệt)

| # | Câu hỏi | Khuyến nghị | Ảnh hưởng nếu đổi sau |
|---|---|---|---|
| 1 | **Trang khóa chỉ hiện bìa + QR (không cho xem toàn bộ thiệp)?** Hay vẫn cho xem toàn bộ thiệp chỉ đọc? | Chỉ bìa + QR (mục 1). Cho xem toàn bộ = khách chia sẻ link khóa là mời miễn phí, coi như không khóa. | Rất lớn — quyết định cả thiết kế chống xài chùa. **Phải chốt trước khi code.** |
| 2 | Giá 100.000đ là giá cuối? Có giá khác theo mẫu / theo đợt? | 100k cố định cho mọi mẫu, bản đầu. | Nhỏ — giá là 1 hằng số, đổi 1 chỗ. |
| 3 | Link khách sau trả tiền dùng tới bao giờ? | 30 ngày sau ngày cưới, rồi khóa (chuẩn cộng đồng). | Nhỏ — 1 hằng số. |
| 4 | Khách trả tiền mặt tại cửa hàng thì sao? | Phương án A (mục 6): không nút mở tay, khách quét QR chuyển khoản. | Trung bình — thêm nút + log nếu đổi sang B. |
| 5 | Khách chuyển 2 lần / chuyển thừa thì hoàn tiền thế nào? | Không hoàn tự động; Nancy hoàn tay khi khách báo, có log giao dịch để đối chiếu. | Nhỏ — chỉ là quy trình, không code thêm. |
| 6 | Trang xem trước có ghi chú nhỏ về giá 100k không? | Có, 1 dòng ở cuối trang (mục 2). | Rất nhỏ. |
| 7 | SePay: Nancy tự tạo tài khoản + nối Vietcombank + lấy webhook secret? | Nancy làm (cần CCCD + app ngân hàng, không làm hộ được). Xong thì đưa 3 thứ vào biến môi trường Vercel: `SEPAY_BANK_CODE=VCB`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`, `SEPAY_WEBHOOK_SECRET`. | Chặn deploy tính năng thật — không có là QR không sinh được. |
| 8 | Link khách riêng từng khách do ai tạo — Nancy ở trang Quản lý khách (như hiện tại)? | Nancy tạo sau khi trả tiền. Khách tự tạo link cho khách của mình là tính năng sau, không làm bản đầu. | Trung bình — để bản sau. |

## 9. Code bản v1 đã viết tới đâu — và cần sửa gì sau duyệt

Bản v1 (đã DỪNG, chưa build xong, chưa push, chưa deploy — chỉ nằm local ở `~/workspace/thiep-cuoi-online`):

- Đã có: máy trạng thái 4 bước + kho thiệp máy chủ (file JSON local, có ghi chú phải chuyển Supabase khi lên production) + API tạo/khóa/mở khóa/thanh toán/link khách/webhook SePay + trang `/xem-thu` + chốt chặn ở `/thiep/[id]` (bản ghi máy chủ thắng link `?d=`) + panel ở editor + link khách ở Quản lý khách.
- **Phải sửa theo bản v2 này:**
  1. Giá `299000` → `100000` trong `src/lib/payment.ts` (1 chỗ duy nhất).
  2. **Xóa watermark hoàn toàn:** xóa `src/components/PreviewWatermark.tsx`, gỡ khỏi trang `/xem-thu`, gỡ cờ `watermark` khỏi API (trả về không còn ý nghĩa).
  3. **Bỏ hết hạn xem trước 3 ngày:** xóa `PREVIEW_EXPIRY_DAYS` + `previewExpiresAt` khỏi luồng duyệt in (trước chốt xem thoải mái, không hạn). Hạn chỉ còn: link khách hết sau 30 ngày từ ngày cưới.
  4. **Trang `/xem-thu` chia 2 mặt:** trước chốt = toàn bộ thiệp (không watermark); sau chốt = trang khóa mục 3 (bìa + QR 100k + nút kiểm tra đã mở chưa).
  5. API trạng thái `locked_for_print` phải trả thêm QR thanh toán cho trang khóa dùng (đã có endpoint `/payment`, chỉ cần gọi đúng lúc).
  6. Nút mở khóa admin giữ nguyên ý nghĩa: chỉ về lại duyệt in, không mở online — kiểm tra lại code unlock không có đường nào set `paid_online`.
  7. Cập nhật README + `.env.example` (giá, SePay env, ghi chú không watermark).
  8. Build local + test lại toàn bộ: xem trước thoải mái → chốt → trang khóa hiện QR → webhook giả lập đúng mã + đủ 100k mở → link khách chạy; webhook sai mã / thiếu tiền không mở; link `?d=` cũ sau chốt không mở được.
- Preview-first như trước: build local → tunnel cho Nancy xem → chỉ push lên Vercel khi chị duyệt.

## 11. Duyệt lại + phản biện + phương án tối ưu v3 (main agent review, 2026-11-06 08:23 — theo yêu cầu của Nancy)

### Đã chuẩn (giữ nguyên)
- Giá 100k cố định, không watermark, SePay FREE, QR tự động mở, khách tự làm không qua vệ tinh — đúng hướng, đơn giản, rẻ.
- Demo tên người khác để chọn mẫu + demo đã đổ dữ liệu để sửa — ý hay, giải quyết chụp màn hình bằng giá trị chứ không bằng chặn.
- Blur (không làm khó đọc) — đúng. Blur nhìn là hiểu "bản xem trước", giữ vẻ đẹp; làm khó đọc nhìn như lỗi.

### Chưa chuẩn — 6 điểm phải sửa trước khi code
1. **Thiết kế và code lệch nhau.** Doc ghi "v1 chưa build", nhưng code v1 đã có sẵn local: `api/invitations`, `webhooks/sepay`, `xem-thu`, `payment.ts` vẫn 299k + `PREVIEW_EXPIRY_DAYS=3`, `PreviewWatermark.tsx` vẫn còn, `server-store.ts` là file JSON local. Lên Vercel mà dùng file JSON thì deploy xong là mất dữ liệu (code tự ghi rõ sẽ trả 503 nếu chưa có Supabase). **Chưa có project Supabase nào cho Thiệp Đôi** — project hiện có là của Sổ Tiền, không dùng chung. Phải tạo Supabase mới trước khi mở bán thật, không thì chỉ test local được.
2. **0b và 0c mâu thuẫn nhau.** 0b nói demo là tên người khác, bản của khách không bao giờ hiện trước khi trả tiền. 0c nói demo đã đổ dữ liệu của khách + blur tên/ngày. Đây là **2 bước demo khác nhau**, doc không tách ra nên người code sẽ làm sai một trong hai. Phải tách: Bước A chọn mẫu bằng demo chung (tên người khác) → Bước B demo cá nhân đã đổ dữ liệu + blur để sửa.
3. **SePay FREE 50 giao dịch tính trên TOÀN BỘ tiền vào tài khoản đó, không chỉ tiền mua thiệp.** SePay ghi rõ số lượng giao dịch là "tổng số lượng giao dịch tiền vào trong thời gian một tháng" — nếu chị nối tài khoản Vietcombank chính đang nhận tiền vật lý, tiền cọc, tiền khác thì 50 lượt sẽ hết trong vài ngày, vượt thì tính phí sau. **Phương án tối ưu: mở riêng 1 tài khoản Vietcombank chỉ nhận tiền thiệp online** (giữ FREE 50 có ý nghĩa), hoặc dự trù lên STARTUP 120k/tháng khi đơn nhiều.
4. **Không có đường cứu khi webhook lỗi / khách chuyển sai nội dung.** Khách quét QR thì đúng mã, nhưng khách chuyển tay gõ sai mã, thiếu tiền, hoặc SePay lỗi thì không mở được — mà thiết kế hiện tại cấm mọi nút mở tay. Khách đó sẽ gọi vệ tinh, vệ tinh xin chị, đúng cái chị muốn tránh. Cần **1 đường ngoại lệ có kiểm soát, chỉ chị bấm, có log**: "Đối soát tay" — chị nhập mã giao dịch SePay + ảnh bill, hệ thống ghi log ai bấm, lúc nào, vì sao. Khác với nút "đã thu tiền mặt" bừa bãi: nút này chỉ dùng khi đã có tiền thật vào tài khoản.
5. **Blur chưa đủ chi tiết.** Chỉ blur tên + ngày thì chưa đủ: ảnh khách + địa điểm + giờ cũng đủ để khách mời biết đi đâu, khi nào. Phải blur **tên + ngày + giờ + địa điểm/địa chỉ**, giữ họa tiết/màu/effect sắc nét. Và nói thật: blur CSS chỉ chặn chụp màn hình, không chặn người biết mở code trang để đọc chữ trong đó — với thiệp 100k thì chấp nhận được, đừng quảng cáo blur là bảo mật tuyệt đối. Ảnh khách trong demo: hiện rõ để khách thấy mẫu đẹp, vì không có tên/ngày/địa điểm thì ảnh một mình không mời được ai.
6. **Agent tự do cho khách là quá nặng cho bản đầu.** Agent chat mở sẽ tốn lượt gọi, dễ trả lời lạc, khách lớn tuổi không quen chat, và cần kiểm soát để agent không hứa hẹn sai. **Phương án tối ưu: làm wizard 3 bước có hướng dẫn từng bước (chọn mẫu → thêm ảnh/thông tin → quét QR nhận link), bot chỉ là trợ lý trong từng bước với nút bấm nhanh, không chat tự do.** Agent chat mở để bản sau nếu khách thực sự cần.

### Phương án tối ưu v3 (đề xuất chốt)
- **1 bản ghi trên máy chủ (Supabase mới):** dữ liệu vật lý (khóa sau khi in) + dữ liệu online (mẫu đã chọn + ảnh + thông tin thêm, sửa được trong demo tới lúc trả tiền, khóa sau khi trả).
- **Luồng 3 bước tự động trong trang sửa:** (1) Chọn mẫu bằng demo chung → (2) Demo cá nhân đã đổ dữ liệu + blur tên/ngày/giờ/địa điểm, sửa trực tiếp (bấm ô nào hiện rõ ô đó), wizard hướng dẫn → (3) QR riêng theo từng thiệp + mẫu (100k, mã `THIEP...`), SePay webhook mở → trả link xịn + link riêng từng khách, dùng tới 30 ngày sau cưới.
- **Bỏ:** watermark, hết hạn xem trước 3 ngày, trang khóa làm luồng chính (chỉ giữ làm đường dẫn cũ: link xem trước cũ mở ra thì chuyển tới mục demo online), nút tiền mặt bừa bãi (thay bằng đối soát tay có log, chỉ chị).
- **SePay:** tài khoản Vietcombank riêng chỉ nhận tiền online; giá 100k một hằng số; QR sinh lại mỗi khi đổi mẫu (QR cũ hết hiệu lực).
- **Thứ tự làm:** Supabase + bảng dữ liệu trước → demo 2 bước + blur → QR/webhook + đối soát tay → wizard → xem trước qua tunnel → chị duyệt mới đẩy Vercel.

## 12. Chốt cuối v3-final (Nancy 2026-11-06 08:31 — đơn giản nhất)

- **Chỉ 1 demo duy nhất: demo đã đổ dữ liệu của khách.** Không còn demo tên người khác. Khách xem từng mẫu thì mẫu nào cũng hiện dữ liệu của chính họ (blur tên/ngày/giờ/địa điểm), chọn mẫu nào thì demo đó là mẫu đó. Đơn giản, khỏi 2 bước.
- **Khách chủ yếu xài điện thoại nên không lo mở code.** Blur đủ để chặn chụp màn hình; chuyện đọc chữ trong code trang chỉ xảy ra trên máy tính, khách cưới không làm vậy.
- **Chốt wizard** (không chat agent tự do): 3 bước — chọn mẫu → thêm ảnh/thông tin thêm → quét QR nhận link.
- **QR riêng theo từng thiệp + mẫu là gì:** mỗi cặp (thiệp + mẫu) có một mã riêng, ví dụ thiệp của Anh A chọn mẫu Song Phụng Đỏ thì mã là `THIEPABC123-SONGPHUNG`, cùng thiệp đó mà đổi sang Nhật Bình Đỏ thì mã khác. Cần vậy để khi tiền vào, hệ thống biết khách trả cho thiệp nào + mẫu nào, mới đổ đúng dữ liệu vào đúng mẫu để trả link. Nếu QR chung cho mọi thiệp thì tiền vào không biết là của ai.
- **Link sau khi trả tiền (ý của Nancy — đúng và đơn giản hơn):** đưa khách **1 link độc lập khác, mã hóa dữ liệu vào trong link, chỉ đọc** (kiểu link `?d=` app hiện tại đã làm: dữ liệu nằm trong link, mở ra là thiệp rõ, không sửa được). Link demo (blur, trong trang sửa) và link xịn (rõ, chỉ đọc) là 2 link khác nhau — demo không suy ra được link xịn. Sau khi trả tiền, khách đổi mẫu thì hệ thống sinh lại link xịn mới cho mẫu đó — theo quy tắc đổi mẫu ở mục 13 (chỉ 1 lần miễn phí, các lần sau tính phí), không phải đổi miễn phí không giới hạn.
- Nhờ link xịn mang dữ liệu trong chính nó nên **không cần máy chủ giữ link khách** — máy chủ chỉ cần nhớ ai đã trả tiền + mẫu nào, để sinh link và đối soát. Đây là chỗ đơn giản nhất của v3-final.

## 13. Đổi mẫu sau khi chốt (Nancy 2026-11-06 08:33)

- Chốt mẫu rồi **chỉ được đổi 1 lần miễn phí**. Các lần tiếp theo **tính phí** — cho đổi 1 lần đã là favor rồi.
- **Quy tắc tiền (Nancy 08:45): mỗi 100.000đ được chọn 2 lần.** Trả 100k lần 1: lần chọn 1 (mẫu ban đầu) + lần chọn 2 (đổi miễn phí). Muốn chọn lần 3 thì trả thêm 100k nữa — tương đương mua mới — lần trả này lại được chọn 2 lần (lần 3 + lần 4 miễn phí), cứ thế tiếp tục.
- **KHÔNG ghi chú rõ ràng trước (Nancy 08:47 — sửa lại):** không hiện quy tắc đổi mẫu ở wizard, demo, trang thanh toán hay trang link xịn. **Chỉ khi khách có nhu cầu đổi mẫu thì mới xác nhận với khách:** lúc khách bấm đổi, hệ thống mới báo "Bạn chỉ được đổi mẫu miễn phí 1 lần — đây là lần đổi miễn phí của bạn, xác nhận đổi?" (nếu còn lượt), hoặc "Đã hết lượt đổi miễn phí — đổi tiếp cần trả thêm 100.000đ để được chọn thêm 2 lần nữa" (nếu hết lượt).
- **Chống khách tham lam — SỬA LẠI (Nancy 08:50, mình hiểu nhầm trước đó):** nút đổi mẫu **chỉ có sau khi khách đã trả tiền**, tức là đã gửi link web cho khách rồi, họ muốn đổi tiếp thì mới có. **Lúc chưa trả tiền thì demo blur nhưng cho chọn thoải mái** — xem bao nhiêu mẫu cũng được, không tính là lần chọn, không tốn lượt đổi. Chỉ khách thực sự có nhu cầu đổi sau khi đã trả tiền mới dùng tới lượt đổi miễn phí duy nhất đó. Cơ chế đếm bắt đầu từ lúc trả tiền: mẫu đã trả = lần chọn 1, lần đổi sau trả tiền = lần chọn 2 miễn phí, muốn chọn lần 3 thì trả thêm 100k (được chọn thêm 2 lần).

## 14. Đổi mẫu sau khi trả tiền — LÀM SAU, không phải key (Nancy 2026-11-06 09:11)

- Tính năng đổi mẫu sau trả tiền **không cần làm cùng lúc** — nó phát sinh tùm lum (web tĩnh rồi thì thả nút đổi ở đâu, nhu cầu khách thực sự thế nào...). **Để làm sau.**
- **Phạm vi bản đầu (v1):** demo blur + wizard + QR 100k + link xịn mã hóa tĩnh chỉ đọc, chọn 1 mẫu, không có nút đổi mẫu. Khách đã trả tiền mà thực sự muốn đổi thì xử lý tay cho họ trước đã.
- **Bản sau:** nút đổi mẫu không đặt trên link khách mời (link xịn phải sạch, chỉ để mời), mà đặt ở trang quản lý / trang sửa của chủ thiệp. Quy tắc khi đó vẫn giữ: 1 lần đổi miễn phí, mỗi 100k được chọn 2 lần, chỉ xác nhận khi khách bấm đổi.
- Máy chủ đếm số lần chọn mẫu cho mỗi thiệp (`templatePickCount`, số lần đã trả) — link xịn cũ hết hiệu lực khi sinh link mới, tránh khách giữ nhiều link khác mẫu cùng lúc.

1. Duyệt bản thiết kế này (đặc biệt câu 1 và câu 4 ở mục 8).
2. Tạo tài khoản SePay + nối Vietcombank + lấy webhook secret (khi code xong, trước lúc mở bán thật).
3. Chốt giá 100k là giá cuối (câu 2, mục 8).
