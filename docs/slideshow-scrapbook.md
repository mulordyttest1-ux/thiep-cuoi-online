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

## Hiệu ứng chữ (3 kiểu, chọn qua `?tx=` trên trang khách)

Mặc định là **cát** (`sand`); `?tx=scatter` thì về bản Scatter & Reform
chậm đã lưu; `?tx=paper` thì về bản giấy dán; giá trị lạ → về cát.

- **Cát — `sand` (mặc định, chị chốt 2026-11-10 theo mẫu cộng đồng Text
  Particles)**: chữ được vẽ lên canvas ẩn rồi lấy mẫu điểm ảnh làm đích
  cho từng hạt cát (chấm vuông 1–2px màu chữ, lệch sắc nhẹ). Lúc hiện,
  hạt của từng chữ rơi NHẸ TỪ TRÊN XUỐNG (ease-out mềm, không lò xo nảy,
  không nổ tung như mẫu gốc), các chữ tụ theo thứ tự từ trái sang phải —
  cả dòng tụ xong trong ~6 giây rồi chữ đứng sắc nét ~3 giây (hạt tụ xong
  thì chữ DOM thật mờ vào, hạt mờ đi). Lúc chuyển ảnh, chữ vỡ thành hạt
  cát BAY LÊN rồi mờ dần trong ~2 giây, tan hết không đè lên ảnh sau.
  Số hạt giới hạn (bước lấy mẫu ~3–4px, trần ~2600 hạt/dòng).
- **Scatter chậm — `scatter` (đã lưu, PR #28)**: lúc hiện từng chữ cái
  (tách thành mảnh nhỏ) bay về ghép lại thành chữ — mỗi chữ 6 giây lúc
  vào, stagger 0,1 giây/chữ (dòng 20 chữ lắp xong trong ~8 giây); lúc ra
  tan nhanh riêng 0,8 giây để chữ cũ không đè lên ảnh sau. Mảnh lệch tối
  đa ±14px lúc tụ, ±26px lúc vỡ, xoay ±10°/±22°.
- **Giấy dán — `paper` (chị chốt 2026-11-10 theo mẫu cộng đồng fake lật
  trang PDF — turn.js / FlipBook.js: tờ giấy lật qua rồi nằm phẳng xuống
  như dán — + kiểu chữ rơi Bounce In Letters)**: từng chữ RƠI từ trên
  cao xuống, LẬT rồi DÁN — đáp xuống nằm phẳng như tờ giấy dán lên mặt
  thiệp, bóng đổ nhẹ hiện ra lúc đáp rồi đứng yên; không nảy đàn hồi,
  không xoay tròn, không gấp 3D kiểu paper-cut, không kiểu chữ cắt báo
  ransom. V2 (sửa 2026-11-10 theo phản hồi trực tiếp của chị sau khi xem
  bản live: "không thấy flip, chỉ thấy fall" và nhịp "bị khựt khựt"):
  chữ bắt đầu ở rotateX −90° (nhìn ngang cạnh tờ giấy, gần như chưa
  thấy mặt chữ) và KHÔNG fade-in — cú LẬT chính là thứ làm chữ hiện ra;
  perspective 450 cho nổi 3D rõ hơn. V3 (sửa 2026-11-10 theo phản hồi
  trực tiếp của chị sau khi xem bản live v2 trên điện thoại: "flip từ
  trái qua phải hoặc từ hư không chứ nó xuất hiện cái dãy này xấu quá"
  — "cái dãy" là vệt ngang mỏng lúc mới bắt đầu, vì v2 giữ opacity 1
  suốt nên tất cả các chữ cùng hiện ra dưới dạng vạch ngang mỏng):
  mỗi chữ bắt đầu opacity 0 (vô hình hoàn toàn) và chỉ mờ vào TRONG
  LÚC lật — keyframes opacity [0, 0, 1, 1] với times [0, 0.25, 0.5, 1]
  (vô hình 25% đầu lúc còn gần như nhìn ngang cạnh, mờ vào tới 50%
  lúc đã lật đủ để thấy rõ mặt chữ, rõ hẳn từ đó tới lúc đáp phẳng).
  Quy tắc: không bao giờ có thời điểm nào chữ hiện rõ trong khi
  rotateX còn gần −90°; chữ chưa tới lượt thì vô hình — lật từ trái
  qua phải, hoặc từ hư không lật vào. TỐC ĐỘ DÙNG HÀM SỐ MŨ kiểu GIA TỐC
  TỔNG XUYÊN SUỐT: MỘT đường cong tiến độ chung cho cả dòng
  (start_i = (T − DUR) × (1 − e^(−2,5·i/(N−1))) / (1 − e^(−2,5)), T ≈ 5
  giây) — khoảng cách giữa các lần đáp co lại liên tục, mặt trận các
  chữ đã đáp tiến với vận tốc tăng liên tục, không còn gap rời rạc theo
  từng chữ; mỗi chữ rơi+lật ~0,9 giây, dài hơn khoảng cách lớn nhất
  giữa các lần đáp (~0,78 giây) nên các chữ CHỒNG LÊN NHAU — lúc nào
  cũng có chữ đang chuyển động, không có lúc nào màn hình đứng yên;
  cả dòng tụ xong trong ~5 giây rồi chữ đứng sắc nét để đọc (số chữ đã
  đáp ở mốc 1s/2s/3s/4s/5s là 1 → 2 → 4 → 7 → 14). LƯU Ý: công thức
  t_i = T × (e^(k·i/N) − 1)/(e^k − 1) cho mặt trận đáp CHẬM DẦN (ngược
  ý chị) nên không dùng — dạng lõm (1 − e^(−k·x))/(1 − e^(−k)) mới cho
  gia tốc tăng liên tục. Lúc chuyển ảnh, các chữ lật ngược lên và bay
  lên, mờ dần trong ~1,5–2 giây, tan hết không đè lên ảnh sau.
- Chữ nhóm theo từ để dòng dài ngắt ở khoảng trắng giữa các từ (không
  vỡ giữa từ); hiệu ứng vẫn chạy từng chữ cái.
- Dùng framer-motion (đã có sẵn) + Canvas 2D thuần cho cát, không thêm
  thư viện mới.
- Chữ chỉ dùng dữ liệu thật của thiệp (tên, ngày, giờ, địa điểm);
  demo/thư viện dùng `defaultInvitation` như hiện tại.

## Giữ nguyên

- Cover chạy 1 lần trước slideshow; nút "Xem thiệp"/"Xem thiệp cưới"
  vào thiệp; nút "← Quay lại sửa thiệp" khi `fromWizard`.
- `?fx=` đổi được hiệu ứng theo biến thể; `?tx=sand|scatter|paper` đổi
  được hiệu ứng chữ (mặc định cát).
- `prefers-reduced-motion`: hiện tĩnh, bấm để qua.
- Không nhạc tự phát.

## File đổi

- `src/components/IntroSlideshow.tsx` — viết lại thành scrapbook
  (Polaroid + chồng ảnh + `ShatterText` + nền đổi màu theo cảnh).
- `src/components/SandText.tsx` (mới) — hiệu ứng chữ hạt cát (canvas);
  `src/components/PaperText.tsx` (mới) — hiệu ứng chữ giấy dán (rơi +
  lật + dán phẳng, nhịp hàm số mũ); `src/lib/intro.ts` — thêm
  `TextEffectId` / `resolveTextEffect` (`sand` | `scatter` | `paper`);
  `src/components/GuestInvitationView.tsx` + `src/app/(app)/thiep/[id]/page.tsx`
  — đọc `?tx=` truyền xuống slideshow.
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

<!-- Ghi chú: commit này chỉ để Vercel build lại — lần build trước lỗi ngắt quãng ở next/font (không tải được Google Fonts lúc build), không đổi code. -->
