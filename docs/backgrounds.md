# Mô hình 3 lớp cho intro thiệp cưới

Toàn bộ intro (cover → bộ sưu tập → vào thiệp) gồm 3 lớp xếp chồng,
chốt 2026-11-10. Mẫu mới chỉ cần chọn một kiểu nền + một lớp phủ là
xong, khỏi nghĩ lại từ đầu. Catalog code ở `src/lib/backgrounds.ts`
(lớp đáy) và `src/lib/layers.ts` (lớp phủ + điểm vào của mô hình).

| Lớp | Tên | Là gì | Code |
|-----|-----|-------|------|
| 1 | Lớp đáy (base) | Nền — 5 nhóm dưới đây | `BACKGROUND_STYLES` (`backgrounds.ts`) |
| 2 | Lớp nội dung (content) | Slideshow: ảnh Polaroid + chữ chạy (tên, ngày, địa điểm, câu khẩu hiệu) | `IntroSlideshow.tsx` |
| 3 | Lớp phủ (overlay) | Phủ lên trên nội dung: ánh sáng, tia lấp lánh, cánh hoa, bokeh | `OVERLAY_STYLES` (`layers.ts`) |

## Lớp 1 — Lớp đáy: 5 nhóm nền

| id | Tên | Mô tả | Đang dùng ở đâu | Biến thể lấy làm nền chính |
|----|-----|-------|-----------------|---------------------------|
| `solid` | Màu đặc | Nền một màu trơn, đổi màu theo từng ảnh/cảnh. | Slideshow scrapbook — 4 màu trong `SLIDESHOW_SCENES` (`src/lib/intro.ts`): đỏ đậm `#8c1d2f`, hồng phấn `#f9e8ec`, trắng kem `#fdf8f1`, vàng hoàng hôn `#f6d365`. | `toi-gian` |
| `glow` | Gradient ánh sáng | Vệt nắng vàng loang từ trên xuống (radial/linear gradient). | Bìa intro — `SunFlare` theo biến thể (`src/components/IntroCover.tsx`): warm, petals, bokeh, thin, streak, festive. | `dien-anh` |
| `blurred-photo` | Nền mờ từ ảnh | Lấy chính tấm ảnh đang hiện, phóng to tràn khung, làm mờ + tối nhẹ, đặt làm nền sau ảnh nét (Ambient mode của YouTube). Nền tự ăn màu theo từng ảnh. | Slideshow — prop `background="blurred"` của `IntroSlideshow` (mặc định vẫn là `solid`). | — (chưa gán cho biến thể nào) |
| `particles` | Hạt bay | Hạt hiệu ứng bay/lấp lánh phủ trên nền: cánh hoa rơi, tia vàng 4 cánh, bokeh hào quang mờ, hoặc cả hai. | `AmbientLayer` (`src/components/effects/AmbientLayer.tsx`) — kind: petals / sparkle / bokeh / both. | `hoa-bay`, `anh-vang`, `le-hoi` |
| `motif` | Họa tiết của mẫu | Màu nền + họa tiết riêng của từng mẫu: phượng, chữ Hỷ, hoa văn — dấu ấn nhận diện mẫu. | Bìa intro — `TemplateMotif` + nền cover theo biến thể (`IntroCover.tsx`, `INTRO_PRESETS.coverBg` trong `src/lib/intro.ts`); họa tiết từng mẫu khai báo trong `templates.ts` (motif, pattern, palette). | `le-nghi` |

## Lớp 2 — Lớp nội dung: slideshow

Ảnh Polaroid viền trắng đặt nghiêng + chữ chạy, giữ nguyên kịch bản
scrapbook đã duyệt (xem `docs/slideshow-scrapbook.md`): chia thông tin
theo số ảnh (Tên → Ngày → Địa điểm → Happy Wedding → Save the Day…),
chữ Scatter & Reform lúc hiện + Shatter lúc đi, nhẹ và chậm. Lớp nội
dung không nằm trong preset biến thể.

## Lớp 3 — Lớp phủ: 4 lớp phủ

| id | Tên | Mô tả | Đang dùng ở đâu | Biến thể dùng |
|----|-----|-------|-----------------|---------------|
| `sun` | Ánh nắng | Vệt nắng vàng loang (gradient). Hình vệt nắng khác nhau theo biến thể. | Bìa intro — `SunFlare` (`IntroCover.tsx`). Chỉ có ở bìa, không có trong slideshow. | tất cả 6 biến thể |
| `sparkle` | Tia lấp lánh | Tia vàng mảnh + sao 4 cánh lấp lánh (không phải hạt tròn vàng). | `AmbientLayer` — `GoldSparkles` + `Twinkle`. | `le-nghi`, `anh-vang`, `dien-anh`, `le-hoi` |
| `petals` | Cánh hoa rơi | Cánh hoa rơi nhẹ, màu hồng/vàng theo biến thể. | `AmbientLayer` — `PetalFall`. | `le-nghi`, `hoa-bay`, `le-hoi` |
| `bokeh` | Bokeh | Hào quang mờ hình tròn trôi nhẹ, tông vàng ấm. | `AmbientLayer` — `BokehGlow` (khi `ambient.kind = "bokeh"`). | `anh-vang` |

Một biến thể thường xếp chồng nhiều lớp phủ (vd bìa le-nghi = nắng +
tia vàng + cánh hoa), nên `overlay` trong preset là **danh sách**, không
phải một id duy nhất.

## Gán theo biến thể (`VARIANT_PRESETS` trong `templates.ts`)

| Biến thể | Lớp đáy (`background`) | Lớp phủ (`overlay`) |
|----------|------------------------|---------------------|
| `le-nghi` Truyền Thống Lễ Nghi | `motif` | `sun`, `sparkle`, `petals` |
| `hoa-bay` Lãng Mạn Hoa Bay | `particles` | `sun`, `petals` |
| `anh-vang` Sang Trọng Ánh Vàng | `particles` | `sun`, `bokeh`, `sparkle` |
| `toi-gian` Tối Giản Hiện Đại | `solid` | `sun` (vệt nắng mỏng, gần như không có) |
| `dien-anh` Điện Ảnh Cuộn Chuyện | `glow` | `sun`, `sparkle` |
| `le-hoi` Lễ Hội Rực Rỡ | `particles` | `sun`, `sparkle`, `petals` |

Hai trường này chỉ đặt tên cho hành vi hiện tại — không đổi mặc định
của mẫu nào. Render vẫn theo `ambient`/`twinkle` + `SunFlare` như cũ;
`getPresetLayers(fx)` trong `layers.ts` đọc 3 lớp từ một preset.

## Ví dụ: scrapbook 3 lớp

- **Đáy = nền mờ từ ảnh** (`background="blurred"`): chính ảnh cưới đang
  hiện, phóng to tràn khung, blur 28px + tối đi, làm nền sau Polaroid.
- **Nội dung = slideshow**: ảnh Polaroid nghiêng + chữ tên/ngày/địa
  điểm chạy theo từng ảnh.
- **Phủ = ánh sáng** (`sun`): vệt nắng vàng loang phủ lên trên cùng,
  kèm tia lấp lánh/cánh hoa theo biến thể.

## Prop mới của `IntroSlideshow`

- `background?: "solid" | "blurred"` (mặc định `"solid"`): lớp đáy của
  slideshow. `blurred` dùng lại ảnh đã tải, không tải thêm ảnh.
- `overlay?: OverlayId[]`: lớp phủ tùy chọn. Không truyền = hành vi
  hiện tại (AmbientLayer theo `fx`). Truyền vào thì chỉ hiện các lớp
  phủ đó; chỉ `sparkle`/`petals`/`bokeh` có tác dụng ở slideshow
  (`sun` chỉ có ở bìa). Lưu ý: bokeh thay thế tia/cánh trong
  `AmbientLayer` nên `["bokeh", "sparkle"]` chỉ hiện bokeh + sao 4
  cánh, không hiện tia vàng.

## QA

Xem `~/workspace/qa-screenshots-backgrounds/report.json` — mỗi nhóm nền
và mỗi lớp phủ đều có ảnh chụp thấy được, mặc định slideshow không đổi
(vẫn nền màu đặc + phủ theo `fx`), 0 lỗi JS.
