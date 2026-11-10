# Slideshow Scrapbook — kịch bản intro thiệp cưới

Kịch bản đã duyệt 2026-11-10 (chị chủ chốt). Mẫu tham khảo: Pikbest
10077037 "Video Tỏ Tình đám Cưới đẹp Và ấm áp" (After Effects, 151,2 MB)
— album kỷ niệm kiểu scrapbook. Chỉ lấy cảm hứng, không tải file mẫu về dùng.

## Phong cách

- Ảnh viền trắng, đặt nghiêng như Polaroid dán trên nền (xoay nhẹ ±3–6°).
- Ảnh mới xoay/trượt vào chồng lên ảnh trước + zoom chậm nhẹ (Ken Burns
  tối đa ~1.08), chuyển nhẹ, giữ ảnh gần như nguyên khung — không lia
  mạnh cắt mặt.
- Ảnh trong thiệp **opacity 1 luôn, không fade** (ảnh album không mờ dần).
- Nền sau ảnh đổi màu theo từng cảnh, lặp lại 4 cảnh:
  1. Đỏ đậm `#8c1d2f` — chữ trắng
  2. Hồng phấn `#f9e8ec` — chữ đỏ đậm
  3. Trắng kem `#fdf8f1` — chữ đỏ đậm
  4. Vàng hoàng hôn `#f6d365` — chữ đỏ đậm
- Chồng ảnh: ảnh hiện tại ở trên cùng; 2 ảnh trước nghiêng ló ra phía
  sau; ảnh còn lại đỗ ngoài khung hình (đẩy xuống 120dvh) chờ trượt vào.
- Nhịp chậm: mỗi ảnh giữ 12 giây; chuyển cảnh 0,9 giây
  (`cubic-bezier(0.22,1,0.3,1)`).

## Chia thông tin theo số ảnh (quy tắc bắt buộc)

Dòng chính theo thứ tự: **Tên cặp đôi → Ngày cưới → Địa điểm**.
Dòng phụ thêm khi còn ảnh: **Happy Wedding → Save the Day → câu cưới
khác** ("Just Married", "Hãy yêu đến cùng", "LOVE", "Forever & Always").
Lúc nào cũng đủ thông tin, không thiếu dòng chính; dòng nào không có dữ
liệu thật thì bỏ (không bịa, không dùng chữ mẫu).

| Số ảnh | Ảnh 1 | Ảnh 2 | Ảnh 3 | Ảnh 4 | Ảnh 5 | Ảnh 6+ |
|-------:|-------|-------|-------|-------|-------|--------|
| 1 | tên + ngày + địa điểm | — | — | — | — | — |
| 2 | tên | ngày + địa điểm | — | — | — | — |
| 3 | tên | ngày | địa điểm | — | — | — |
| 4 | tên | ngày | địa điểm | Happy Wedding | — | — |
| 5 | tên | ngày | địa điểm | Happy Wedding | Save the Day | — |
| 6+ | tên | ngày | địa điểm | Happy Wedding | Save the Day | câu cưới khác |

Hàm pure `getSlideshowSlides(photoCount, core)` trong `src/lib/intro.ts`
thực hiện quy tắc này; `SLIDESHOW_SCENES` (4 nền) và
`SLIDESHOW_PHRASES` (câu phụ) cũng ở đó. Đã unit-test: N=0→[], N=1→đủ 3
dòng, N=2→[tên],[ngày+địa điểm], N=3→tách 3, N=4→+Happy Wedding,
N=5→+Save the Day, N=6→Just Married, N=7→"Hãy yêu đến cùng",
N=8→LOVE; thiếu địa điểm thì dồn đúng; không dữ liệu thì chỉ còn câu
phụ (không bịa).

## Nguồn ảnh

`InvitationData` **không có field album** — chỉ có `photoUrl` (1 ảnh duy
nhất). `PRESET_PHOTOS` (6 ảnh Unsplash trong `src/lib/templates.ts`) là
ảnh minh họa, KHÔNG được dùng trong slideshow thiệp thật (không để
thông tin sẵn). Vì vậy production hiện tại slideshow chỉ có tối đa 1
ảnh thật; quy tắc chia dòng được implement tổng quát cho mọi N.

Component nhận prop tùy chọn `photos?: string[]` (mặc định
`[data.photoUrl]`, bỏ trùng) để QA được trường hợp nhiều ảnh và để sẵn
cho lúc thiệp có nhiều ảnh; production không đổi hành vi.

## Hiệu ứng chữ

- Lúc hiện: **Scatter & Reform** — từng chữ cái (tách thành mảnh nhỏ)
  bay về ghép lại thành chữ.
- Lúc chuyển ảnh: **Shatter** — chữ vỡ vụn từng chữ cái rồi bay đi.
- Làm NHẸ và CHẬM cho hợp trang trọng: mảnh lệch tối đa ±14px lúc tụ,
  ±26px lúc vỡ, xoay ±10°/±22°, mỗi chữ 6 giây lúc vào, stagger 0,1
  giây/chữ (dòng 20 chữ lắp xong trong ~8 giây); lúc ra tan nhanh
  riêng 0,8 giây để chữ cũ không đè lên ảnh sau.
- Chữ nhóm theo từ để dòng dài ngắt ở khoảng trắng giữa các từ (không
  vỡ giữa từ); hiệu ứng vẫn chạy từng chữ cái.
- Dùng framer-motion (đã có sẵn), không thêm thư viện mới.
- Chữ chỉ dùng dữ liệu thật của thiệp (tên, ngày, giờ, địa điểm);
  demo/thư viện dùng `defaultInvitation` như hiện tại.

## Giữ nguyên

- Cover chạy 1 lần trước slideshow; nút "Xem thiệp"/"Xem thiệp cưới"
  vào thiệp; nút "← Quay lại sửa thiệp" khi `fromWizard`.
- `?fx=` đổi được hiệu ứng theo biến thể.
- `prefers-reduced-motion`: hiện tĩnh, bấm để qua.
- Không nhạc tự phát.

## File đổi

- `src/components/IntroSlideshow.tsx` — viết lại thành scrapbook
  (Polaroid + chồng ảnh + `ShatterText` + nền đổi màu theo cảnh).
- `src/lib/intro.ts` — thêm `SLIDESHOW_SCENES`, `SLIDESHOW_PHRASES`,
  `SlideshowLine`, `getSlideshowSlides`.
- `docs/slideshow-scrapbook.md` — file này.

## QA (Playwright mobile 390px, production build local, 2026-11-10)

Ảnh: `~/workspace/qa-screenshots-scrapbook/`, kết quả chi tiết:
`report.json` trong cùng thư mục. Tất cả case ĐẠT, 0 lỗi JS:

- (a) 1 ảnh trên app thật — đủ tên + ngày + địa điểm trên 1 ảnh, 1 ảnh,
  có nút "Xem thiệp", không có chấm trang.
- (b) 3 ảnh (harness) — tên, ngày, địa điểm lần lượt từng ảnh.
- (c) 5 ảnh (harness) — có Happy Wedding (ảnh 4) + Save the Day (ảnh 5).
- (d) hiệu ứng chữ — ảnh chụp lúc đang chuyển: chữ cũ vỡ vụn từng chữ
  cái bay đi, chữ mới đang tụ lại (thấy rõ trong `d-shatter-1.png`).
- (e) reduced-motion — cover đứng yên sau 9 giây; slideshow vẫn hiện đủ
  tên + ngày + địa điểm (tĩnh).
- (f) thiệp không ảnh — chỉ cover + chữ thật, 0 thẻ img, không lọt
  marker mẫu ("Minh Quân", "Thu An", "Sen Hồng", "123 Đường Láng",
  "DRESS CODE", "Câu chuyện", "LỊCH TRÌNH").

Lưu ý phát hiện trong lúc QA (không thuộc phạm vi đợt này, chưa sửa):
link demo `?d=` mang `photoUrl` dạng data-URI lớn (~32 KB) bị server
Next.js trả **431 Request Header Fields Too Large** (giới hạn header
mặc định của Node là 16 KB) nên trang không tải được — QA case (a)/(e)
đã dùng URL ảnh host local thay cho data-URI để tránh. Vấn đề này ảnh
hưởng cả luồng "Xem demo" trong wizard khi khách đã tải ảnh lên (ảnh
sau nén vẫn là data-URI dài). Cần xử lý riêng (ví dụ: demo dùng
sessionStorage thay vì nhét toàn bộ data vào URL, hoặc tăng
`maxHeaderSize` của server).
