# Số liệu bố cục THẬT — mẫu Song Phụng Đỏ (bản gốc chungdoi.com)

Nguồn: file trình duyệt tải về khi mở `https://chungdoi.com/vi/mau-thiep/song-phung-do/demo`
(ngày lấy: 2026-11-05; chỉ đọc file công khai, không đăng nhập, không vượt tường bảo vệ).
Trang gốc là Next.js. File đã tải về `/tmp/songphung_src/` (không đưa vào repo app).

- `demo.html` (307.630 byte): HTML SSR — chỉ chứa PHONG BÌ (initialEnvelopeOpen: false);
  phần chính (hero) render phía client sau khi bấm "Mở thiệp", nằm trong JS chunk.
- `chunk_33.js` = `/_next/static/chunks/65380-b8adf99afaf0ee44.js`: chứa component hero,
  module `22705` (trích ra `mod22705.js`, dài 17.639 ký tự), `data-testid="songphung-red-template"`.
- Lưu ý trung thực: bảng đăng ký templateId → component (double_phoenix_red) không nằm trong
  các chunk đã tải; việc xác định module 22705 là hero của demo này dựa trên khớp tài sản
  (đủ 5 file songphung-red, màu #710001, nền #FFF0E7) + khớp số đo trình duyệt độc lập
  (band ~199–200px, Hỷ ~282px, tràn trên ~134px — xem cuối file). Component "songphung-v3"
  khác trong cùng chunk dùng tài sản khác (phung/rong) nên không phải hero của demo này.
- Breakpoint Tailwind mặc định: mobile < 768px, md ≥ 768px, lg ≥ 1024px.
  Thiệp desktop ~870–907px nhưng viewport trình duyệt ≥ 1024px nên áp dụng cột **lg**.
  Vì vậy cột "Desktop (lg)" là cột đối chiếu chính.

## 1. Phần chính (hero) — module 22705, chunk_33.js

Khung hero: `header.relative flex flex-col items-center justify-center text-center z-10
pt-12 md:pt-16 pb-[200px] md:pb-[220px] lg:pb-[240px]` (mod-offset 4114).

| Thành phần | Mobile | md | Desktop (lg) | Nguồn (mod22705.js) |
|---|---|---|---|---|
| Tên cô dâu/chú rể — căn lề | **CĂN TRÁI** (`text-left`), không căn giữa | như mobile | như mobile | offset 4200: `w-full text-[36px] md:text-[44px] lg:text-[52px] mb-6 md:mb-8 text-left pl-6 md:pl-8 md:ml-[80px] lg:ml-[80px] uppercase` |
| Tên — thụt trái | padding-left 24px | padding-left 32px + margin-left 80px = 112px | 112px | cùng chuỗi trên |
| Tên — tên thứ nhất | `ml-[15px]` | như mobile | như mobile | offset ~4300: `(div ml-[15px] → firstPerson.name)` |
| Tên — tên thứ hai | `ml-[50px] mt-[10px]` | như mobile | như mobile | `(div ml-[50px] mt-[10px] → secondPerson.name)` |
| Tên — font/cỡ/đậm/dòng | Playfair Display, 36px, weight 400, lineHeight 1.11, uppercase | 44px | 52px | style: `color:#710001, fontFamily:"Playfair Display", lineHeight:1.11, fontWeight:400` |
| Hàng dải (band row) | cao 260px | 488px | 488px | offset 4652: `relative w-full flex items-center justify-center mb-4 md:mb-6 h-[260px] md:h-[488px] lg:h-[488px]` |
| Dải đỏ | cao 110px, full width, #710001, z-0, top = 50% của hàng dải (translateY(0)) | cao 206px | cao 206px | offset 4743: `absolute w-full h-[110px] md:h-[206px] lg:h-[206px] z-0, backgroundColor:#710001, top:"50%", transform:"translateY(0)"` |
| Chữ Hỷ (ảnh CHU HY.webp) | 155×155px, căn giữa hàng dải (z-20) | 291×291px | 291×291px | offset 5278: `relative z-20 w-[155px] h-[155px] md:w-[291px] md:h-[291px] lg:w-[291px] lg:h-[291px]` |
| Hỷ tràn trên / dải trống dưới (suy ra từ số trên, lg) | — | — | tràn trên **145,5px**, đáy Hỷ nằm trong dải, còn **60,5px** dải trống phía dưới | Tính: hàng 488, dải 244→450, Hỷ 98,5→389,5 (đo trình duyệt độc lập: band ~199–200px, Hỷ ~282px, tràn trên ~134px — khớp trong sai số co giãn) |
| Phụng TRÁI (Phuong 2.webp) | left -90px, top 0 (tính từ đầu hàng dải), 230×480px, z-10, objectPosition left center | left -169px, 431×900px | 431×900px | offset 5140: `absolute left-[-90px] md:left-[-169px] lg:left-[-169px] top-0 w-[230px] md:w-[431px] lg:w-[431px] h-[480px] md:h-[900px] lg:h-[900px] z-10` |
| Đuôi phụng trái thò xuống dưới hàng dải (suy ra, lg) | — | — | **412px** dưới đáy hàng dải (900 − 488); tức ~450px dưới đáy dải (900 − 450) | Tính từ số trên (đo trình duyệt: đuôi chạy ≥324px dưới đáy dải tới cuối hero — cùng hướng, sai số do hero dài hơn hàng dải) |
| Phụng PHẢI (Phuong.webp) | left = 50% + 77,5px (sát mép phải chữ Hỷ), top -120px (thò lên vùng tên), 155×320px, z-10, objectPosition right center | left = 50% + 145,5px, top -225px, 291×600px | 291×600px | offset 5831: `absolute left-[calc(50%+77.5px)] md:left-[calc(50%+145.5px)] lg:left-[calc(50%+145.5px)] top-[-120px] md:top-[-225px] lg:top-[-225px] w-[155px] md:w-[291px] lg:w-[291px] h-[320px] md:h-[600px] lg:h-[600px] z-10` |
| Đuôi phụng phải so với dải (suy ra, lg) | — | — | đáy phụng ở 375 (tính từ đầu hàng dải), nằm trong dải (244→450) — đuôi vắt qua dải, không thò xuống dưới dải | Tính từ số trên |
| Đầu hero | padding-top 48px (mobile) / 64px (md+) — kem trống, KHÔNG có cặp phụng nét mảnh, KHÔNG có hoa góc trên nổi bật ở hero | — | — | header pt-12 md:pt-16; phuongLine chỉ xuất hiện mờ (opacity-10) ở top-[800px]+, tức xa phía dưới trang |
| Khoảng kem trống dưới dải | padding-bottom header 200px | 220px | 240px | header pb-[200px] md:pb-[220px] lg:pb-[240px] |
| Cụm hoa góc dưới-phải (HOA.webp) | right 0, top -220px (tính từ đầu section sau header, tức thò lên vùng kem dưới dải), rộng 192px, h-auto | top -270px, rộng 360px | top -290px, rộng 360px | offset 6108: `absolute right-0 top-[-220px] md:top-[-270px] lg:top-[-290px] w-[192px] md:w-[360px] lg:w-[360px] h-auto` |
| Nền giấy | ảnh NENGIAY.jpg, absolute inset-0, backgroundSize 100% auto, repeat-y, top center, opacity 0.3, trên nền #FFF0E7 | — | — | offset ~2100: `backgroundImage:url(NENGIAY.jpg), backgroundSize:"100% auto", backgroundRepeat:"repeat-y", backgroundPosition:"top center", opacity:.3`, cardStyle backgroundColor #FFF0E7, primary #710001 |
| Viền thiệp | `md:border md:border-[#71000122]` (viền #710001 độ trong suốt ~13%, chỉ từ md) | — | — | borderClassName trong component |

Điểm mấu chốt sửa sai cho các vòng QA trước: **tên ở hero là CĂN TRÁI** (text-left),
tên thứ hai thụt vào thêm (50px so với 15px của tên thứ nhất, cộng 10px cách trên),
tạo bố cục lệch trái bất đối xứng — không phải tên căn giữa như các vòng 1–4 đã mô tả.
Phụng phải NHỎ HƠN phụng trái (600 so với 900 cao ở lg) và bắt đầu ngay sát mép phải chữ Hỷ.

## 2. Phong bì (đóng) — SSR trong demo.html (offset ~13544–21785)

| Thành phần | Số liệu | Nguồn (demo.html) |
|---|---|---|
| Nền phong bì | fixed inset-0 z-50, gradient `to bottom right, #710001, #5a0001, #450001`, kèm chữ Hỷ mờ bay (ambient-rise) | offset 13544: `background:linear-gradient(to bottom right, #710001, #5a0001, #450001)`, `data-landing-screenshot-id="invite-envelope"` |
| Thẻ phong bì | relative, rộng 310px / sm 340px / md 520px / lg 600px | offset ~17232: `relative w-[310px] sm:w-[340px] md:w-[520px] lg:w-[600px]` |
| Con dấu Hỷ | tròn 56px, top 50px, translate(-50%,-50%), gradient #710001, z-30 | offset ~17232: `top:50px;width:56px;height:56px;transform:translate(-50%, -50%);background:radial-gradient(circle at 30% 30%, #710001, rgb(83,0,0))` |
| Phụng phong bì (Phuong.webp) | góc trên-trái: rộng 120px / md 220px, top -20px, left -20px / md -50px, opacity 0.9, rotate 10°; góc dưới-phải: rộng 140px / md 220px, bottom -120px / md -110px, right -40px / md -50px, opacity 0.9, lật ngang, rotate 5° | 4 thẻ img songphung-red trong SSR |
| Hoa phong bì (HOA.webp) | dưới-trái: 120px / md 160px, bottom -20px / md -30px, left -20px / md -30px, opacity 0.6; trên-phải: 100px / md 140px, top -15px / md -20px, right -15px / md -20px, opacity 0.6, rotate 180° | 4 thẻ img songphung-red trong SSR |
| Tên phong bì | **CĂN GIỮA**, h1 flex flex-col items-center, text-3xl / sm text-4xl, màu #710001, font Playfair Display/Baskerville, mỗi span `block w-full text-center`; dấu & riêng một dòng, text-lg / sm text-xl | offset ~19381–20420 |
| Nội dung phong bì | wrapper `relative z-10 text-center px-6 pt-28 pb-14 md:pt-24 md:pb-8`; nút "Mở thiệp" nền #710001, chữ #FFF0E7 | offset ~19381, ~21785 |

Lưu ý: tên phong bì CĂN GIỮA có dấu & — khác với tên hero CĂN TRÁI không dấu &.
Đừng áp dụng căn lề phong bì cho hero (và ngược lại).

## 4. Khối THÔNG TIN LỄ CƯỚI — module 22705, chunk_33.js (trích 2026-11-05, vòng 10)

Section: `div.relative flex flex-col items-center gap-6 md:gap-8 text-center mb-12 md:mb-16`.
Thứ tự các khối con (từ trên xuống): tiêu đề → cha mẹ (`cD`) → lời mời (`$V`) →
tên lớn (`om`) → các hàng ngày (`o7`, một hàng mỗi ceremony) → (sau đó mới tới
gallery `Rq`, rồi section tiệc `zp` + bản đồ `ie`).

| Thành phần | Số liệu (mobile / md+) | Nguồn |
|---|---|---|
| Tiêu đề | `THÔNG TIN LỄ CƯỚI` (i18n `ceremonyInfoTitle` vi, `chunk_00.js`), uppercase, **font-bold**, text-[20px] md:text-[24px], Baskerville/Times, #710001 | mod22705 `_x` |
| Cha mẹ (`cD`) | Lưới `grid-cols-[1fr_auto_1fr]`, `grid-rows-[repeat(4,auto)]`, gap-x-3 md:gap-x-8, gap-y-1; mỗi bên `row-span-4 grid rows-subgrid justify-items-center text-center`, max-w 160px md:280px. Bên TRÁI = firstPerson (demo `brideFirst:true` → **nhà gái trước**), bên PHẢI = secondPerson | mod22705 `cD` + mod82667 `e_` |
| Cha mẹ — hàng 1 | Nhãn `parentTitle` (dữ liệu demo: **"Ông Bà"** cả 2 bên), text-[14px] md:text-[15px] | demo_data.json + `e_` |
| Cha mẹ — hàng 2/3 | Tên cha rồi tên mẹ, **font-semibold**, auto-fit cỡ tối đa 14px mobile / 15px md (GT hook, weight 600), `[overflow-wrap:anywhere]` | `e_` + mod35490 `GT` |
| Cha mẹ — hàng 4 | **Địa chỉ gia đình** (dữ liệu: groom "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh", bride "456 Lê Lợi, Quận 3, TP. Hồ Chí Minh"), text-[12px] md:text-[13px] mt-1, leading-tight, whitespace-pre-line | `e_` + demo_data.json |
| Cha mẹ — vạch giữa | 1px, cao 60px, màu #710001, tự căn giữa | mod22705 `divider` |
| Lời mời (`$V`) | Render `customAnnouncementText` (demo: **rỗng** → không hiện). Class: text-[16px] md:text-[20px], uppercase, Baskerville, max-w 560px, whitespace-pre-line | mod82667 `ey` + demo_data.json |
| Tên lớn (`om`) | Thứ tự: người thứ nhất (cô dâu, do `brideFirst:true`), dấu `&`, người thứ hai. Mỗi người: **tên ĐẦY ĐỦ** (`fullName`: "Lê Ngọc Ánh"/"Trần Thế Bảo"), rồi **nhãn thứ bậc BÊN DƯỚI tên** (`birthOrder`: "Út Nữ"/"Út Nam", dữ liệu demo) | mod82667 `eL` + demo_data.json |
| Tên lớn — font/cỡ | **EB Garamond** (không phải Playfair — QA vòng 9 ghi "Playfair" là chưa chính xác), auto-fit: base 40px mobile / **64px md+**, min 20px, `whitespace-nowrap`, không ép uppercase | `eL` (baseSizeMobile 40, baseSizeTablet 64) |
| Nhãn thứ bậc | text-[12px] md:text-[13px], uppercase, tracking-[0.2em], Baskerville, #710001, nằm DƯỚI tên | `eL` birthOrderClassName |
| Dấu & | Đứng riêng một dòng giữa 2 tên, text-[35px] md:text-[48px], EB Garamond, #710001 | `eL` separator |
| Hàng ngày (`o7`, không stacked, timeInline) | (1) Header ceremony (dữ liệu demo: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA", 16px md:20px, whitespace-pre-line, căn giữa); (2) dòng "VÀO LÚC 09:00" (`atTime` vi = "VÀO LÚC", 14px md:15px, uppercase); (3) hàng ngày: [tên thứ, căn PHẢI, rộng 70px md:85px, 14/15px uppercase] `\|` [số ngày, **32px md:38px**] `\|` [tháng, căn TRÁI, 14/15px uppercase]; (4) năm "2026" riêng một dòng 20px md:22px; (5) ghi chú âm lịch trong ngoặc đơn, 13px md:14px | mod82667 `eh` + mod22705 `o7` |
| Tên thứ / tháng / năm | Tên thứ = Intl weekday long vi ("CHỦ NHẬT"); tháng = `THÁNG 05` (số tháng 2 chữ số); ngày = số 2 chữ số ("03"); năm = "2026" | mod65566 `Lu`/`g`/`h` |
| Ghi chú âm lịch | Công thức vi (module 43378 `Yk`, dùng thư viện `lunar-javascript` `Solar.fromYmd().getLunar()`): `` `Tức ngày ${ngày} tháng ${tháng}${nhuận?" nhuận":""} năm ${Can Chi}` ``, Can Chi tiếng Việt (Giáp/Ất/Bính/Đinh/Mậu/Kỷ/Canh/Tân/Nhâm/Quý + Tý/Sửu/Dần/Mão/Thìn/Tỵ/Ngọ/Mùi/Thân/Dậu/Tuất/Hợi). Demo 2026-05-03 → **"Tức ngày 17 tháng 3 năm Bính Ngọ"**. Chỉ hiện với locale vi (locale khác → null) | mod43378 `c` + mod65566 `Uy` |
| Section tiệc (`zp`, sau gallery) | Tiêu đề "THÔNG TIN TIỆC CƯỚI" (i18n `receptionInfoTitle` vi), 16px md:20px uppercase, không đậm. Giờ tiệc lớn 18px md:20px semibold. Hàng ngày giống `o7` nhưng **năm ẨN** (`yearClassName:"hidden"`). Ghi chú âm lịch. Giờ đón khách 17:30 + khai tiệc 18:00 (2 cột). **Đếm ngược ở ĐÂY** (tiêu đề "Cùng đếm ngược"), kèm mini-calendar tháng + nút "Thêm vào lịch" (Google Calendar) | mod82667 `tt` + mod22705 `zp` |
| Địa điểm / bản đồ (`ie`, sau section tiệc) | Tên địa điểm in đậm uppercase 20px md:24px; địa chỉ dạng pill bo tròn; bản đồ nhúng (cao 260px md:360px, rộng tối đa 340px md:600px, bo 16px) | mod82667 `ie` |
| Timeline | `timelineEvents` (Đón khách 17:30, Khai tiệc 18:30, Rót rượu cắt bánh 18:45…) — section riêng sau bản đồ (không trích sâu vì app đã có section Lịch trình) | demo_data.json |

### Không tìm được / lưu ý (vòng 10)
- `announcementLine1` ("TRÂN TRỌNG BÁO TIN") / `announcementLine2` ("LỄ THÀNH HÔN
  CỦA CON CHÚNG TÔI") chỉ xuất hiện trong dữ liệu demo nhúng ở `demo.html` (2 lần =
  SSR + flight payload), **không có code render nào trong 42 chunk đã tải** và không
  xuất hiện trong HTML SSR của phong bì. Vị trí hiển thị của 2 dòng này KHÔNG xác
  minh được từ file đã tải — không bịa vị trí. Lời mời DUY NHẤT xác minh được trong
  khối thông tin là `$V` (customAnnouncementText, nằm giữa cha mẹ và tên lớn).
- Dữ liệu demo (tên, địa chỉ, địa điểm, ảnh album) KHÔNG dùng lại trong app —
  chỉ dùng cấu trúc/trường dữ liệu (parentTitle, birthOrder, address mỗi bên,
  ceremonies, banquetTime…) để đối chiếu.

### Bổ sung vòng 11 (2026-11-05)
- **Tiêu đề lễ là TRƯỜNG DỮ LIỆU, không phải chữ cố định:** `ceremonies[0].header`
  (`{vi: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA"}`) và `ceremonyHeader` cùng giá trị
  trong `demo_data.json`; template mặc định trong `mod90135.js`/`chunk_00.js` cũng
  có sẵn giá trị này (vi/en/ko/ja/zh). Kết luận: app thêm trường tùy chọn
  `ceremonyHeader?`; để trống thì render đúng dòng mặc định vi/en của mẫu
  (16px md:20px, whitespace-pre-line, căn giữa, trên "VÀO LÚC") — khớp hành vi
  mặc định của bản gốc, không bịa.
- **Thứ tự section sau khối THÔNG TIN (spec §4, bảng trên):** gallery → section tiệc
  (`zp`) → địa điểm/bản đồ (`ie`). App vòng 11 dời Album lên ngay sau khối THÔNG TIN
  (chỉ mẫu deco), giữ nguyên dạng lưới; Lịch trình vẫn đứng giữa Album và section tiệc
  (bản gốc đặt timeline trong/ sau section tiệc — chưa căn đúng hoàn toàn, ghi nhận).
- **Mini-calendar:** bản gốc có lịch tháng ở section tiệc (`zp`, cùng đếm ngược +
  "Thêm vào lịch"). App vòng 11 thêm lưới lịch tháng cưới, tuần bắt đầu thứ Hai,
  tô đậm ngày cưới — dạng hiển thị đơn giản, không phải bản sao y hệt lịch gốc.
- **Phong bì:** dòng "đến dự buổi tiệc chung vui cùng gia đình" là chữ cố định của
  phong bì gốc (nằm sau pill khách trong SSR); app vòng 11 cho hiện luôn với mẫu
  deco kể cả khi không có `?guest=`. Tên phong bì gốc: cô dâu trước, `&` riêng dòng,
  chú rể sau (brideFirst) — app vòng 11 đã lật theo.

### Bổ sung vòng 12 (2026-11-05)
- **Dress code CÓ THẬT trong dữ liệu demo:** `showDresscode: true`,
  `dresscodeColors: ["#651212", "#8d3a3a", "#ffb2b2"]`; tiêu đề i18n
  `dresscodeTitle` vi "DRESS CODE" (en "DRESS CODE"), phụ đề
  `dresscodeSubtitle` vi "Trang phục dự tiệc" (en "Party Attire").
  App thêm trường tùy chọn `dressCode?` (chuỗi mã màu cách nhau dấu phẩy)
  + ô nhập ở form + section Dress Code cho deco (chỉ hiện khi có màu).
- **Thứ tự section sau khối THÔNG TIN (đã xác minh từ chunk_33 đuôi):**
  gallery → section tiệc (`zp`) → địa điểm/bản đồ (`ie`) → dress code →
  timeline. Tiêu đề timeline i18n vi "LỊCH TRÌNH NGÀY CƯỚI" (en "WEDDING
  DAY SCHEDULE"). Timeline demo: Đón khách 17:30, Khai tiệc 18:30,
  Rót rượu cắt bánh 18:45… (5 mốc). `banquetTime` demo = "18:00",
  `guestReception` vi "Đón khách" (en "Welcome"), `partyStart` vi
  "Khai tiệc" (en "Reception"). Cặp giờ tiệc gốc: đón khách
  `guestReceptionTime` 17:30 / khai tiệc `banquetTime` 18:00.
- **Đếm ngược:** code gốc CÓ countdown trong `zp` (`showCountdown` mặc định
  bật khi có date+time; component có trạng thái "past"). Demo ngày
  03.05.2026 đã qua lúc QA xem (11/2026) nên không hiện — QA11 ghi "bản
  gốc không có đếm ngược ở đâu cả". App vòng 12 BỎ đếm ngược với deco cho
  khớp hình demo (mẫu khác giữ nguyên).
- **Lịch tháng:** bản gốc đánh dấu ngày cưới bằng TRÁI TIM đỏ (QA11), tiêu đề
  "Tháng 5 / 2026". Bản đồ nhúng cao 280px md:380px, tối đa 340px md:560px,
  bo 16px.
- **Hero — số đo đã hiệu chỉnh bằng kích thước file thật (vòng 12):**
  ảnh Phuong.webp và Phuong 2.webp đều 1952×4105 (tỉ lệ 0.4755); HOA.webp
  964×1095; CHU HY.webp 1272×1271 (vuông). Hộp gốc 291×600
  object-contain chỉ render phụng phải rộng 285px = **31.4%** (không phải
  32.1%); hộp 431×900 render phụng trái rộng 428px = **47.2%**. App vòng 12
  sửa phụng phải 32.1% → 31.4%, phụng trái 51% → 47.5%.
- **Khoảng kem dưới dải = 240px (header pb-240), tức 26.5% chiều rộng cột
  — KHÔNG phải 50%:** số 50% của vòng 9 là đo nhầm (đo tới tận tên lớn).
  Hậu quả của 50%: đuôi phụng trái thò dài gấp đôi bản gốc và chạm sát
  tiêu đề THÔNG TIN — chính là "motif hoa đỏ đậm ở góc trên-trái khối
  THÔNG TIN" QA11 nêu (thực chất là đuôi phụng). Vòng 12: khoảng kem về
  26.5%, hoa HOA dời sang section thông tin (top -290px so với đầu
  section, opacity-100 theo code gốc), lề trên khối THÔNG TIN 56px
  (= section py-14). Đuôi phụng trái lúc này thò 19.6% chiều rộng cột qua
  đáy hero (bản gốc 19.0%) → vẫn cắt ngang lông như bản gốc.

## 4b. Bổ sung vòng 13 — chỗ nối hero / THÔNG TIN + parallax (trích từ code gốc)

- **Header gốc KHÔNG cắt đuôi:** `<header>` module 22705 có class
  `relative flex flex-col items-center justify-center text-center z-10
  pt-12 md:pt-16 pb-[200px] md:pb-[220px] lg:pb-[240px]` — không có
  overflow-hidden; hàng dải cũng không; card `Vy` chỉ `overflow-hidden` ở
  mép ngoài card (`relative w-full max-w-[480px] md:max-w-[900px]
  md:mx-auto overflow-hidden`). Đuôi phụng trái (wrapper 431×900, top 0
  hàng dải) thò 148px qua đáy header (đáy đuôi 1121px, đáy header 973px
  ở cột 907px) rồi vuốt nhọn dần trong khoảng trống bên trái khối cha mẹ.
- **Đo alpha ảnh thật Phuong 2.webp (1952×4105):** pixel mờ còn tới hàng
  4055/4105; 50 hàng cuối hẹp còn x 702–889 (≈ page x −14..27 ở cột 907)
  — đuôi kết bằng đầu nhọn mỏng ở mép trái cột, không phải vệt rộng.
  Lúc chưa cuộn, đuôi rộng ~330px ở đáy hero; khi cuộn xuống xem chỗ nối,
  parallax kéo nó rút lên.
- **Parallax gốc (hook `dD`, chunk_25):** `offset = scrollY × speed`,
  template `translateY({y})`, origin mặc định "page". Phụng trái
  `ref:C(-.15)` → tốc độ −0.15 (cuộn 900px → −135px, đuôi rút lên);
  phụng phải `C(.15, "scaleX(-1) translateY({y})")` (đi xuống + lật
  ngang); HOA khối thông tin `C(.1, ..., 30)` (tối đa 30px); giấy
  `C(.25)`; hoa mờ xa `C(.45)`. Lúc chưa cuộn offset = 0.
- **Nguyên nhân "motif" QA11/12 (đã xác minh bằng code, không đoán):**
  app vòng 7 thêm `overflow-hidden` cho section hero để đuôi khỏi che
  chữ — nhưng nó cắt ngang đuôi ở phần RỘNG nhất (cột 872px: đáy hero
  y≈940 cắt qua hàng ảnh 3299, đuôi rộng x −80..252 ≈ 330px) thành vệt
  đỏ thẳng ngay đáy hero, mắt đọc thành motif ở chỗ nối. Vòng 12 sửa
  khoảng kem 50%→26.5% không chạm tới nguyên nhân này nên QA12 vẫn thấy.
  Vòng 13: bỏ `overflow-hidden` ở section hero (article vẫn giữ, cắt
  mép trái cột như card gốc) + parallax −0.15 cho phụng trái — đuôi
  vuốt nhọn tự nhiên như bản gốc, lúc xem chỗ nối (đã cuộn) chỉ còn
  chấm nhỏ ngay đáy hero. Không che chữ: lúc chưa cuộn, mép phải đuôi
  cách tiêu đề ~60px, cách chữ cha mẹ ~70px (hình học cột 872px); càng
  cuộn đuôi càng rút lên.
- **Coverflow vòng 13:** ảnh giữa 300px (~54% track 560px), ảnh kề
  translateX 72%/bước (216px), rotateY 38°, scale 0.75, opacity 0.9
  (hiện ~130px ≈ 23% track/bên); ảnh xa 144%, rotateY 55°, scale 0.6,
  opacity 0.55; offset modulo để 2 đầu vẫn có ảnh 2 bên.
- **Lịch tháng vòng 13:** tim 36px trong ô ~42px (lịch max-w 320px),
  số 13px extrabold trắng. **Timeline vòng 13:** mỗi mốc 1 dòng, giờ
  cố định 54px đậm bên trái, nhãn bên phải.

## 4c. Bổ sung vòng 14 — tim lịch, đo lại Hỷ/dải, khung dọc, timeline, trạng thái trống

- **Tim lịch ĐẶC (điểm chặn QA13):** tim vòng 12–13 dùng ký tự ♥ của font,
  font render thành outline RỖNG ~18–20px nên số trắng trên nền kem không
  đọc được. Vòng 14 vẽ tim bằng SVG path TÔ FILL đặc #710001, 32px trong ô
  ~42px (lịch max-w 320px, 7 cột), số 15px extrabold trắng chồng lên tim.
- **Đo lại Hỷ/dải (vòng 14, KHÔNG sửa):** QA13 nêu Hỷ to gấp 2–3 lần, dải cao
  gấp 2 lần bản gốc — MÂU THUẪN với số đo vòng 8–9. Đo lại từ code: gốc
  (cột 907px) Hỷ 291px = 32,08%, dải 206px = 22,71%; app: hàng dải aspect
  907/488 (cao 53,80% cột), dải h-[42,2%] của hàng = 22,70% cột
  (= 205,9px ở 907px), Hỷ w-[32,1%] của hàng (= chiều rộng cột) = 291,1px
  ở 907px; tỉ lệ Hỷ/dải 1,414 vs gốc 1,413. Tất cả khớp trong sai số làm
  tròn (0,02 điểm %) — kết luận: lỗi đo của QA, không đụng vào Hỷ/dải.
- **Khung album DỌC 2:3 (vòng 14):** bản gốc ~320×485; app vòng 13 khung
  ngang 300×220 → đổi thành 300×450, track cao 470px, object-cover (ảnh
  stock ngang bị crop dọc, chấp nhận được); hình học xòe ngang giữ nguyên.
- **Timeline (vòng 14):** giờ CĂN PHẢI trong cột trái cố định 54px, chấm
  trên đường kẻ giữa hai cột, nhãn EB Garamond ITALIC ở cột phải (thêm
  style italic thật cho EB_Garamond ở layout.tsx).
- **Bỏ ảnh lẻ dưới lịch trình (vòng 14):** khối `{deco && data.photoUrl}`
  cuối InvitationPreview render 1 ảnh khổ lớn dưới timeline — bản gốc
  không có (chỗ đó là guestbook/gift đã bỏ) → xóa.
- **Trạng thái trống (vòng 14):** dấu & (khối tên lớn + phong bì) chỉ render
  khi CẢ 2 tên đều có chữ; pill địa chỉ + iframe bản đồ chỉ render khi có
  địa chỉ (không địa chỉ thì iframe hiện bản đồ thế giới trống).

## 4d. Bổ sung vòng 15 — timeline, màu tim, thumbnail

- **Timeline (điểm chặn QA14):** vòng 14 chỉ căn phải giờ trong span + italic nhãn — đường kẻ + chấm vẫn ở mép trái hàng (thứ tự chấm | giờ | nhãn). Vòng 15 cấu trúc lại: [giờ căn phải, EB Garamond 15px thường, cột trái 54px] | [cột giữa 24px, chấm 12px căn giữa, đường kẻ dọc chấm left 66px = 54 + 12, top/bottom 11px ≈ tâm chấm đầu/cuối] | [nhãn EB Garamond italic 15px, cột phải]. Thứ tự giờ | chấm | nhãn như bản gốc.
- **Tim lịch:** fill #710001 (maroon sẫm) → **#c1272d** (đỏ tươi) — QA14: tim gốc đỏ tươi hơn tim ta. Chunk gốc đã mất (/tmp bị xóa) nên không trích được màu chính xác; chọn đỏ tươi rõ rệt theo brief. Kích thước/hình dạng giữ nguyên (32px, số trắng 15px extrabold — đã đạt vòng 14).
- **Thumbnail thư viện:** hero có -mt-6/-mt-8 kéo mép trên trùng mép thẻ nên tên hero nằm sát mép trên thumbnail, QA14 thấy đỉnh "THU AN" bị cắt nhẹ. Vòng 15 dời bản xem trước thu nhỏ xuống 6px (px của thẻ) + cộng 6px vào chiều cao khung để đáy cắt không đổi.

## 4e. Bổ sung vòng 16 — thumbnail, timeline, bản đồ, lịch, tên địa điểm

- **Thumbnail thư viện (điểm chặn QA15):** 6px vòng 15 KHÔNG đủ — QA15 vẫn thấy tên bị cắt ("THU AN" → "U AN", "MINH QUÂN" → "NH QUÂN"). Vị trí thật của tên sau margin âm + collapse không khớp tính toán trên giấy. Vòng 16: ĐO THẬT vị trí h2 bằng getBoundingClientRect (đã tính cả scale) trong DecoThumbnail và dời bản xem trước xuống thêm cho tới khi mép trên của tên cách mép khung đúng 12px (px thẻ); đo lại mỗi lần layout/font đổi (ResizeObserver + document.fonts.ready) nên hội tụ sau 1 lần đo. Chiều cao khung = đáy hero đo thật + top inset hiện tại nên đáy cắt không đổi. Thumbnail vẫn chỉ hiện hero.
- **Timeline căn giữa + lớn hơn:** trước max-w-md (448px) nên khối chiếm nửa trái cột 872px, cột chấm lệch ~150px so với giữa cột, bên phải trống lớn. Vòng 16: max-w 540px + mx-auto, giãn dòng space-y-7, giờ/nhãn 16px (trước 15px). Giữ nguyên thứ tự giờ | chấm | nhãn, đường kẻ chấm, nhãn italic serif.
- **Bản đồ zoom vào địa điểm:** trước URL nhúng không có zoom nên mở ra là toàn Hà Nội + lớp phủ "Use ctrl + scroll", không thấy ghim/place card. Vòng 16: thêm `&z=16` vào URL iframe (`maps?q=<địa chỉ>&z=16&output=embed`) để mở ra đã zoom vào địa điểm và hiện ghim.
- **Lịch tháng:** (1) thêm khung viền bo tròn (border #71000155, rounded-2xl, px-4 py-3) quanh toàn bộ lịch; (2) TIM VỀ #710001 — QA15 soi phóng to: tim gốc thực ra là ĐỎ SẪM maroon LỚN, nhận định "tim gốc đỏ tươi" ở vòng 14 là SAI, #c1272d vòng 15 sai theo. Tim 30px; lịch nới max-w 320px → 388px (ô ~52px như bản gốc đo vòng 14) để tim 30px ≈ 59% ô.
- **Tên địa điểm:** trước sans đậm IN HOA ("TRUNG TÂM TIỆC CƯỚI SEN HỒNG"); bản gốc chữ nghiêng serif, viết thường xen hoa. Vòng 16: EB Garamond italic 20/24px, giữ nguyên chữ hoa/thường như dữ liệu, không uppercase/bold sans.
- **KHÔNG đổi:** đường kẻ timeline vẫn chấm (đã xác lập từ code gốc; nhận xét "trông như liền" ở vòng 15 chỉ do zoom nhỏ), nhãn timeline vẫn italic serif (vòng 14 đã chấp nhận).

## 4f. Bổ sung vòng 17 — timeline 50%, map chỉ theo địa chỉ, thumbnail trục ngang, tim 35px

- **Timeline chấm đúng giữa cột (điểm chặn QA16):** cấu trúc vòng 16 [giờ 54px][chấm 24px][nhãn flex-1] trong hộp max-w-540 căn giữa đặt chấm ở 166+66 = 232px của cột 872px, lệch ~204px so với giữa cột (436px) — khớp đúng số QA16 đo (~210px). Vòng 17: bỏ max-w, hàng flex full chiều rộng cột [cột giờ flex-1, giờ căn phải] | [chấm cố định 14px, chấm 12px] | [cột nhãn flex-1]; hai cột flex-1 chia đều nên tâm chấm = đúng 50% cột (section 808px trong cột 872px: mỗi cột 397px, tâm chấm 32+397+7 = 436px = 872/2). Đường kẻ dọc chấm ở left calc(50%−1px) (viền 2px, tâm trùng tâm chấm), top/bottom 13px (= nửa hàng 26px). Giãn dòng: hàng 26px + space-y-11 (44px) = 70px tâm-tâm, giờ/nhãn 17px. Giữ thứ tự giờ | chấm | nhãn, giờ serif thường căn phải, nhãn italic serif.
- **Bản đồ chỉ query theo địa chỉ:** query embed trước kèm tên địa điểm + địa chỉ ("Trung tâm Tiệc cưới Sen Hồng 123 Đường Láng...") khiến Google match nhầm sang khu Hồ Tây/Thụy Khuê, không ghim. Vòng 17: `maps?q=<data.address đã encode>&z=16&output=embed` — chỉ địa chỉ, giữ z=16. Địa điểm mẫu là tên hư cấu nên không có place card như địa điểm thật của bản gốc; mục tiêu là ghim đỏ đúng vị trí + zoom vào địa điểm.
- **Thumbnail cắt TRÁI (không phải trên):** QA16 đo rõ "THU AN"→"U AN", "MINH QUÂN"→"NH QUÂN" (mất T,H,M,I ở mép trái; đỉnh chữ còn nguyên, top offset ~23px đã đủ) — đo dọc vòng 16 bỏ sót trục ngang. Vòng 17: (1) mở rộng đo-thật sang trục ngang trong DecoThumbnail — đo mép trái h2 bằng getBoundingClientRect và dời bản xem trước sang phải cho tới khi mép trái tên cách mép khung ≥12px (giữ mép trên ≥12px); (2) tắt hẳn parallax phụng trái trong thumbnail (data-deco-thumbnail): parallax chạy theo scroll trang gallery là sai cho ảnh tĩnh — thẻ ở giữa trang, scrollY lớn kéo đuôi phụng trượt lên −150–−300px, lọt vào vùng tên hero. Đây là nghi phạm chính của vết cắt trái (chỉ xuất hiện ở thumbnail, trang khách ở scroll-top không bị).
- **Tim lịch 35px:** path tim Material trong viewBox 24 chỉ chiếm ~83% chiều rộng hộp nên 30px hộp ≈ 25px nhìn thấy (QA16 đo ~23px). Vòng 17: hộp 35px → nhìn thấy ≈ 35 × 0.83 ≈ 29px (≈ 55% ô ~53px, gốc ~54%). Giữ fill #710001 đặc, số trắng 15px extrabold, lịch max-w 388px + khung viền bo tròn.

## 4g. Bổ sung — slide deck điện ảnh (thay cột cuộn dài)

Quyết định của chủ thương hiệu 2026-11-05 15:24: trang thiệp "chỉ scroll
nhìn chán quá" — đổi sang slide deck điện ảnh, không dùng scroll làm điều
hướng. Hiệu ứng lấy từ thư viện cộng đồng, không tự viết tay (chính sách
hiệu ứng 2026-11-05): **Swiper v12** (slide/fade/coverflow/autoplay/
pagination/keyboard/touch) + **Framer Motion** (hiện chữ stagger), Ken
Burns bằng CSS keyframes (thư viện không có sẵn hiệu ứng này cho ảnh tĩnh).

- **Cấu trúc 7 màn hình, đúng thứ tự (nội dung cũ giữ nguyên, không bỏ gì):**
  1. Phong bì — màn hình mở đầu sẵn có ở `thiep/[id]/page.tsx`, bấm "Mở
     thiệp" thì vào deck (phong bì KHÔNG nằm trong Swiper, vẫn là cổng vào).
  2. Hero — tên lệch trái, dải đỏ + chữ Hỷ, phụng hai bên, hoa (số đo cũ).
  3. Thông tin lễ cưới — cha mẹ, tên lớn, hàng ngày + âm lịch.
  4. Album — carousel coverflow CÓ SẴN của Swiper (thay coverflow CSS 3D
     tự viết tay vòng 12–13): ảnh giữa 300×450 (2:3), ảnh kề nghiêng 38°,
     depth 160; ảnh đang xem có Ken Burns (zoom 1→1.08, 6s, đổi hướng
     pan theo chẵn/lẻ); Swiper con lồng trong deck dọc (`nested: true`).
  5. Tiệc + địa điểm — nhãn, cặp ĐÓN KHÁCH/KHAI TIỆC, hàng ngày, lịch
     tháng tim đỏ đô, tên địa điểm nghiêng serif, bản đồ nhúng z=16.
  6. Dress code — 3 màu mẫu.
  7. Lịch trình — timeline giờ | chấm | nhãn, tâm chấm 50% cột.
- **Deck (Swiper, `src/components/InvitationDeck.tsx`):** dọc, 1 slide/lần,
  hiệu ứng fade + crossFade 700ms; cột thiệp giữ ~872px trong mỗi slide;
  slide cao 100dvh (trang khách), editor `h-[calc(100dvh-6rem)]` (cột xem
  trước dính top-24), dialog thư viện `h-[78vh]` (dialog cao tối đa 90vh).
  Nền giấy + vân NENGIAY phủ toàn deck; đơn vị cqw trong slide tính theo
  chiều rộng deck (`containerType: inline-size` ở khung deck).
- **Hiệu ứng vào slide (Framer Motion):** tên hero hiện từng dòng (cô dâu
  rồi chú rể, stagger 0.18s, mờ dần + nổi lên); các mục còn lại mờ dần +
  nổi lên theo từng khối (delay 0–0.3s); hàng lịch trình và màu dress code
  stagger từng hàng/màu. Slide không active ở trạng thái ẩn, vào lại thì
  chạy lại hiệu ứng.
- **Điều hướng:** chấm dọc mép TRÁI (Swiper pagination, clickable) +
  thanh tiến trình mỏng 3px trên cùng + cụm nút dưới giữa (lùi / phát-dừng
  / số slide / tới) + vuốt + phím mũi tên (Keyboard module; Swiper tự bỏ
  qua phím khi đang gõ trong ô nhập). Số hiển thị tính cả phong bì: Hero
  là "2 / 7". Tự chạy TẮT mặc định (Swiper Autoplay 6s/slide, dừng ở slide
  cuối, dừng khi người dùng tự vuốt/bấm); nút phát/tạm dừng gọi
  `autoplay.start()/stop()`. `touchReleaseOnEdges` để vuốt qua mép cuối
  deck thì cuộn được trang (tới dòng credit / QR mừng cưới bên dưới).
- **Slide Tiệc dài hơn màn hình điện thoại** (~1200px nội dung): nội dung
  tự cuộn trong slide (`swiper-no-swiping` — vuốt dọc ở slide này cuộn
  nội dung thay vì đổi slide; đổi slide bằng chấm/nút). Các slide khác
  vuốt dọc để đổi slide. Bản đồ và lịch vẫn dùng được trong slide cuộn.
- **prefers-reduced-motion:** chuyển slide tức thì (speed 0), tắt Ken
  Burns + hiệu ứng bay của Hỷ phong bì, ẩn nút tự chạy, hiệu ứng chữ hiện
  ngay không chuyển động.
- **Dùng chung section (`src/components/InvitationSections.tsx`):** 6
  section deco (Hero/Info/Album/Party/DressCode/Schedule) dùng cho cả deck
  và bố cục dọc tĩnh — một nguồn sự thật, không lệch nhau. Bố cục tĩnh chỉ
  còn dùng cho thumbnail thư viện (TemplateCard, hero only, KHÔNG đổi) —
  InvitationPreview tự nhận biết qua `closest("[data-deco-thumbnail]")`
  sau mount rồi đổi sang tĩnh (lần render đầu là deck, thumbnail đang ẩn
  nên không thấy nháy). Mẫu không-deco giữ bố cục dọc tĩnh như cũ (không
  deck). Editor preview và dialog xem trước đều hiện deck.
- **Giữ nguyên:** decode `?d=` (trang khách ưu tiên `?d=` trước
  localStorage), header/footer ẩn ở `/thiep/*`, dòng credit "Thiệp được
  tạo bằng Thiệp Đôi", không RSVP / sổ lời chúc / thanh toán, không chuỗi
  cấm. Ảnh trang trí vẫn qua proxy `/api/songphung/` (đã kiểm chứng 200,
  đúng dung lượng). Khung chung + hiệu ứng tái sử dụng cho mẫu sau: mẫu
  mới chỉ đổi section/màu/số đo, deck và điều hướng dùng lại nguyên.

## 5. Không tìm được trong file đã tải (không bịa)

- Bảng đăng ký templateId "double_phoenix_red" → component nào: không nằm trong các chunk
  đã tải (chunk_33 không chứa chuỗi này); xác định module 22705 bằng khớp tài sản/màu sắc.
- CSS riêng cho hero (ngoài class Tailwind trong JSX): 2 file CSS tải về là Tailwind tổng
  (963KB) + 3,9KB; không có file CSS riêng cho mẫu Song Phụng — toàn bộ số liệu nằm
  trong class Tailwind + inline style của JSX đã biên dịch, đã trích ở trên.
- Font "ChungDoiIndic" là font riêng của trang gốc, không tải được qua các file này;
  tên hero dùng Playfair Display (có sẵn công khai qua Google Fonts).
- Ảnh album demo (cặp đôi mẫu) và dữ liệu demo (tên, địa chỉ, địa điểm) KHÔNG dùng,
  đúng giới hạn nhiệm vụ.
