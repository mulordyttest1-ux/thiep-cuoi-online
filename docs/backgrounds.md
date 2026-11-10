# Mô hình 3 lớp cho intro thiệp cưới

Toàn bộ intro (cover → bộ sưu tập → vào thiệp) gồm 3 TẦNG CHÍNH xếp
chồng, chốt 2026-11-10. **Quy tắc chồng tầng (chị chốt 2026-11-10):
3 tầng trên chỉ là 3 tầng chính — trong mỗi tầng, các tầng con của nó
được chồng lên nhau theo thứ tự dưới lên trên.** Mẫu mới chỉ cần chọn
các tầng con cho mỗi tầng là xong, khỏi nghĩ lại từ đầu. Catalog code
ở `src/lib/backgrounds.ts` (lớp đáy) và `src/lib/layers.ts` (lớp phủ +
điểm vào của mô hình, `getPresetLayers`).

| Tầng chính | Tên | Là gì | Code |
|-----|-----|-------|------|
| 1 | Lớp đáy (base) | Nền — DANH SÁCH chồng các nhóm dưới đây (dưới lên trên) | `BACKGROUND_STYLES` (`backgrounds.ts`) |
| 2 | Lớp nội dung (content) | Slideshow: dòng mời → ảnh Polaroid → chữ chạy (tên, ngày, địa điểm, câu khẩu hiệu) → chấm trang → nút "Xem thiệp" | `SLIDESHOW_CONTENT_LAYERS` (`layers.ts`), `IntroSlideshow.tsx` |
| 3 | Lớp phủ (overlay) | DANH SÁCH chồng phủ lên trên: ánh sáng, tia lấp lánh, cánh hoa, bokeh | `OVERLAY_STYLES` (`layers.ts`) |

## Lớp 1 — Lớp đáy: 5 nhóm nền (chồng thành danh sách)

| id | Tên | Mô tả | Đang dùng ở đâu | Biến thể dùng trong lớp đáy |
|----|-----|-------|-----------------|---------------------------|
| `solid` | Màu đặc | Nền một màu trơn, đổi màu theo từng ảnh/cảnh. | Slideshow scrapbook — 4 màu trong `SLIDESHOW_SCENES` (`src/lib/intro.ts`): đỏ đậm `#8c1d2f`, hồng phấn `#f9e8ec`, trắng kem `#fdf8f1`, vàng hoàng hôn `#f6d365`. | tất cả 6 biến thể (thường là lớp dưới cùng) |
| `glow` | Gradient ánh sáng | Vệt nắng vàng loang từ trên xuống (radial/linear gradient). | Bìa intro — `SunFlare` theo biến thể (`src/components/IntroCover.tsx`): warm, petals, bokeh, thin, streak, festive. Slideshow cũng vẽ được tầng này (prop `background` có `"glow"`). | `dien-anh` |
| `blurred-photo` | Nền mờ từ ảnh | Lấy chính tấm ảnh đang hiện, phóng to SIÊU TO (scale ~2.2) tràn khung, làm mờ thật mạnh (blur ~56px) + tối nhẹ, đặt làm nền sau ảnh nét (Ambient mode của YouTube). Nền chỉ còn mảng màu mềm loang theo từng ảnh, không thấy chi tiết sắc nét của ảnh gốc. | Slideshow — MẶC ĐỊNH từ 2026-11-10 (trước đây chỉ bật khi truyền prop `background="blurred"`/`"blurred-photo"`). | cả 6 biến thể (mặc định slideshow) |
| `particles` | Hạt bay | Hạt hiệu ứng bay/lấp lánh phủ trên nền: cánh hoa rơi, tia vàng 4 cánh, bokeh hào quang mờ, hoặc cả hai. | `AmbientLayer` (`src/components/effects/AmbientLayer.tsx`) — kind: petals / sparkle / bokeh / both. | `hoa-bay`, `anh-vang`, `le-hoi` |
| `motif` | Họa tiết của mẫu | Màu nền + họa tiết riêng của từng mẫu: phượng, chữ Hỷ, hoa văn — dấu ấn nhận diện mẫu. | Bìa intro — `TemplateMotif` + nền cover theo biến thể (`IntroCover.tsx`, `INTRO_PRESETS.coverBg` trong `src/lib/intro.ts`); họa tiết từng mẫu khai báo trong `templates.ts` (motif, pattern, palette). | `le-nghi` |

Lớp đáy của một biến thể là **danh sách** (`background` trong
`VARIANT_PRESETS`), vd `[màu đặc, gradient ánh sáng]` hoặc `[màu đặc,
họa tiết mẫu]` — lớp dưới cùng thường là màu đặc (nền trơn của
mẫu/cảnh). Trong slideshow chỉ vẽ được `solid`, `glow`,
`blurred-photo`; `particles` thuộc lớp phủ và `motif` thuộc bìa nên
bỏ qua khi gặp ở đáy slideshow.

## Lớp 2 — Lớp nội dung: slideshow (chồng các thành phần)

Ảnh Polaroid viền trắng đặt nghiêng + chữ chạy, giữ nguyên kịch bản
scrapbook đã duyệt (xem `docs/slideshow-scrapbook.md`): chia thông tin
theo số ảnh (Tên → Ngày → Địa điểm → Happy Wedding → Save the Day…),
chữ Scatter & Reform lúc hiện + Shatter lúc đi, nhẹ và chậm. Thứ tự
chồng cố định trong `SLIDESHOW_CONTENT_LAYERS` (`layers.ts`), dưới lên
trên: dòng mời (`invite`) → chồng ảnh Polaroid (`photos`) → chữ chạy
(`text`) → chấm trang (`dots`, chỉ khi nhiều ảnh) → nút "Xem thiệp"
(`button`).

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

| Biến thể | Lớp đáy (`background`, dưới lên trên) | Lớp phủ (`overlay`, dưới lên trên) |
|----------|------------------------|---------------------|
| `le-nghi` Truyền Thống Lễ Nghi | `solid`, `blurred-photo`, `motif` | `sun`, `sparkle`, `petals` |
| `hoa-bay` Lãng Mạn Hoa Bay | `solid`, `blurred-photo`, `particles` | `sun`, `petals` |
| `anh-vang` Sang Trọng Ánh Vàng | `solid`, `blurred-photo`, `particles` | `sun`, `bokeh`, `sparkle` |
| `toi-gian` Tối Giản Hiện Đại | `solid`, `blurred-photo` | `sun` (vệt nắng mỏng, gần như không có) |
| `dien-anh` Điện Ảnh Cuộn Chuyện | `solid`, `blurred-photo`, `glow` | `sun`, `sparkle` |
| `le-hoi` Lễ Hội Rực Rỡ | `solid`, `blurred-photo`, `particles` | `sun`, `sparkle`, `petals` |

Hai trường đặt tên cho hành vi hiện tại; riêng `background` — hành vi thật do mặc định của `IntroSlideshow` quyết định: từ 2026-11-10 mặc định là `["solid", "blurred-photo"]`, tức nền mờ từ ảnh là mặc định cho mọi mẫu (solid nằm dưới làm nền dự phòng khi không có ảnh). Lớp dưới cùng của đáy luôn là màu đặc vốn đã có (nền trơn của mẫu/cảnh), các tầng trên là kiểu nền đã gán. Render vẫn theo `ambient`/`twinkle` + `SunFlare` như cũ; `getPresetLayers(fx)` trong `layers.ts` đọc cả 3 tầng từ một preset, mỗi tầng là một danh sách có thứ tự (dưới lên trên). `background` cũ dạng một id đơn vẫn hiểu là danh sách 1 phần tử.

## Ví dụ: scrapbook 3 lớp (chồng trong từng tầng)

- **Đáy = [màu đặc, nền mờ từ ảnh]** (`background=["solid",
  "blurred-photo"]`, hay tên cũ `"blurred"`): màu cảnh ở dưới cùng,
  chính ảnh cưới đang hiện phóng to SIÊU TO (scale 2.2) tràn khung,
  blur 56px + tối đi, chồng lên trên làm nền sau Polaroid.
- **Đáy = [màu đặc, gradient ánh sáng]** (`background=["solid",
  "glow"]`): màu cảnh ở dưới, vệt nắng vàng loang từ trên xuống chồng
  lên (bán trong suốt, màu dưới vẫn thấy).
- **Nội dung = slideshow**: dòng mời → ảnh Polaroid nghiêng → chữ
  tên/ngày/địa điểm chạy theo từng ảnh → chấm trang → nút "Xem thiệp".
- **Phủ = [ánh sáng, tia lấp lánh, cánh hoa]**: vệt nắng vàng ở dưới
  cùng của lớp phủ, tia lấp lánh chồng lên, cánh hoa rơi ở trên cùng.

Lưu ý: lớp phủ trong slideshow hiện nằm dưới các thẻ nội dung (nội
dung có `z-10`) nên hạt bay/tia sáng không che mặt hay chữ — giữ
nguyên như trước, không đổi.

## Prop mới của `IntroSlideshow`

- `background?: SlideshowBackgroundLayer | SlideshowBackgroundLayer[]`
  (mặc định `["solid", "blurred-photo"]` từ 2026-11-10): lớp đáy của slideshow, danh
  sách chồng dưới lên trên. Mỗi phần tử: `"solid"` (màu đặc đổi theo
  ảnh), `"glow"` (gradient nắng vàng), `"blurred-photo"` (nền mờ từ
  chính ảnh đang hiện; `"blurred"` là tên cũ, vẫn chạy). `"particles"`/
  `"motif"` bỏ qua ở đáy slideshow. Nền mờ dùng lại ảnh đã tải, không
  tải thêm ảnh. Chữ trắng trên nền tối khi tầng đặc trên cùng là ảnh
  mờ; màu đặc trên cùng che ảnh mờ thì chữ theo màu cảnh như cũ.
- `overlay?: OverlayId[]`: lớp phủ tùy chọn. Không truyền = hành vi
  hiện tại (AmbientLayer theo `fx`). Truyền vào thì chỉ hiện các lớp
  phủ đó; chỉ `sparkle`/`petals`/`bokeh` có tác dụng ở slideshow
  (`sun` chỉ có ở bìa). Lưu ý: bokeh thay thế tia/cánh trong
  `AmbientLayer` nên `["bokeh", "sparkle"]` chỉ hiện bokeh + sao 4
  cánh, không hiện tia vàng.

## QA

Xem `~/workspace/qa-screenshots-backgrounds/report.json` — mỗi nhóm nền
và mỗi lớp phủ đều có ảnh chụp thấy được (mặc định cũ: nền màu đặc +
phủ theo `fx`), 0 lỗi JS. Từ 2026-11-10, mặc định slideshow đổi
thành `["solid", "blurred-photo"]` (nền mờ từ ảnh siêu to) — xem
`~/workspace/qa-screenshots-slideshow-blurred-bg/report.md`.
