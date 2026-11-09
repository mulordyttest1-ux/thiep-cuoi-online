# Nghiên cứu biến thể hiệu ứng — Thiệp Đôi (2026-11-09)

Chỉ HỌC Ý TƯỞNG motion từ các trang đang bán, KHÔNG copy code / assets /
thương hiệu khác. Mọi hiệu ứng dưới đây đều dựng lại bằng thư viện sẵn có
của app (framer-motion, GSAP, Lenis — xem specs/song-phung-do.md §4h).

## 8 ý tưởng rút ra (kèm nguồn)

1. **Cinematic scroll storytelling** — thiệp là một câu chuyện cuộn dài:
   ảnh + timeline hiện dần theo cuộn, nút RSVP chỉ hiện sau khi câu chuyện
   kết thúc. Nguồn: wedding.styledbloom.com — "Modern digital wedding
   invitation design ideas" (§ Cinematic Microsites with Scroll-Triggered
   Storytelling; parallax reveal theo từng lớp thời gian).
2. **Envelope reveal** — thiệp bắt đầu bằng phong bì mở ra trên màn hình,
   như mở thiệp thật. Nguồn: smartinvite-app.vercel.app —
   "Animated Wedding Invitation — Cinematic Scroll Animations" (Envelope
   reveal opening; đã có sẵn trong app từ trước).
3. **Parallax nhiều lớp** — ảnh + họa tiết trôi với tốc độ khác nhau tạo
   chiều sâu điện ảnh, không cần video. Nguồn: smartinvite-app.vercel.app
   (Parallax scrolling); motionkit.io — "Web Animation Trends 2026"
   (scrollytelling / pinned scroll stories là xu hướng #1 năm 2026).
4. **Staggered text (chữ hiện từng từ)** — tên + tiêu đề hiện word-by-word
   như title card phim. Nguồn: smartinvite-app.vercel.app (Staggered text
   animations); rocket.new — "Animated Wedding Card Landing Page Template"
   (tên khách hiện dần như viết tay khi cuộn).
5. **Petal / particle ambient** — cánh hoa rơi, hạt vàng bay nhẹ khắp trang,
   giữ chủ đề mà không lấn nội dung. Nguồn: smartinvite-app.vercel.app
   (Floral & particle effects); rsvplinks.com — "Animated Invitations:
   Effects and Intro Reveals" (131 page effect: falling petals, confetti,
   snow; intro reveal: curtain, envelope, chapel doors).
6. **Curtain reveal** — màn kéo lên / rèm mở khi vào section (intro reveal
   kiểu "curtain"). Nguồn: rsvplinks.com (intro reveals: curtain,
   envelope). Trong app đã có dạng này: ScrollReveal `wipe` (clip-path
   inset 99% → 0, §4h C10) — tái dùng, không viết mới.
7. **Animation studio / live toggle** — cho khách thử đổi kiểu hiệu ứng
   ngay trên bản xem trước (confetti / petals / sparkler). Nguồn:
   rocket.new — "Animated Wedding Card Landing Page Template" (Interactive
   Animation Studio). Trong app: thử nhanh bằng query param `?fx=<variant>`
   trên trang khách (xem dưới) — cùng ý tưởng, không thêm UI cho khách thật.
8. **Cinematic opening + countdown + polaroid gallery** — mở đầu điện ảnh,
   đếm ngược, album ảnh kiểu polaroid vuốt ngang. Nguồn: instagram
   @vowlee_ — clip quảng cáo thiệp "Petal" (cửa vàng mở ra ánh sáng →
   falling petals → Save the date → polaroid gallery → countdown).
   Album coverflow 3D + đếm ngược đã có sẵn trong app.

## Xu hướng chung 2026 (motionkit.io)

- Scrollytelling + pinned section là xu hướng #1; GSAP 100% miễn phí từ
  04/2025 (app đã dùng GSAP 3.15).
- Kiềm chế + accessibility: motion phải có mục đích, tôn trọng
  `prefers-reduced-motion`, không giật khi tương tác. App tuân thủ: mọi
  effect tắt khi reduce; chỉ transform/opacity.

## 6 biến thể của Thiệp Đôi (xem specs/song-phung-do.md §4i)

| # | Biến thể (`variant`) | Cảm giác | Ý tưởng nguồn |
|---|---|---|---|
| 1 | `le-nghi` — Truyền Thống Lễ Nghi | Chậm, trang trọng, nghi lễ | Parallax + pinned hero (§3, §1) |
| 2 | `hoa-bay` — Lãng Mạn Hoa Bay | Nhẹ, mơ màng, hoa rơi đầy trang | Petal ambient (§5) |
| 3 | `anh-vang` — Sang Trọng Ánh Vàng | Lấp lánh, xa xỉ, ánh sáng bokeh | Sparkle + particle (§5, §8) |
| 4 | `toi-gian` — Tối Giản Hiện Đại | Sạch, nhanh, gần như không effect | Restraint 2026 (§ chung) |
| 5 | `dien-anh` — Điện Ảnh Cuộn Chuyện | Như xem phim: chương, hạt phim, hero ghim | Scrollytelling (§1, §3) |
| 6 | `le-hoi` — Lễ Hội Rực Rỡ | Vui, náo nhiệt, nổ lớn nhiều màu | Confetti / celebration (§5, §7) |

Preset đầy đủ trong `src/lib/templates.ts` (`VARIANT_PRESETS`); gán mẫu →
biến thể trong cùng file + specs §4i.

## Thử nhanh từng biến thể — `?fx=<variant>`

Trên trang khách `/thiep/<id>`, thêm `?fx=<variant>` để xem thiệp với
preset của biến thể đó thay vì preset của mẫu:

- `/thiep/demo?fx=le-nghi` — xem demo với biến thể Truyền Thống Lễ Nghi
- `/thiep/demo?fx=hoa-bay` / `?fx=anh-vang` / `?fx=toi-gian` /
  `?fx=dien-anh` / `?fx=le-hoi`
- Kết hợp với link `?d=` thật: `/thiep/<id>?d=<...>&fx=hoa-bay`
- Giá trị không hợp lệ → bỏ qua, dùng preset của mẫu như thường.
- Chỉ để thử khi xem demo — không đổi dữ liệu thiệp, không hiện UI thừa
  cho khách mời thật (không có nút chọn biến thể trên trang khách).

## CHỜ CẮM — lớp ambient theo biến thể (2026-11-09, ranh giới file)

Task khối thêm/bớt đang chạy song song cũng sửa InvitationPreview nên
biến thể KHÔNG được đụng render section của file đó. Phần còn lại của
biến thể đã xong trong phạm vi effects + templates.ts; chỉ riêng lớp
ambient theo `kind` là chưa cắm vào trang khách:

- ĐÃ XONG: preset đầy đủ trong `VARIANT_PRESETS` (gồm `ambient.kind` /
  `petals` / `petalColors`, `twinkle`); component `BokehGlow` mới;
  component `AmbientLayer` mới (`src/components/effects/AmbientLayer.tsx`)
  — gom tia vàng + cánh hoa + bokeh + sao 4 cánh theo `fx`, đã export qua
  `src/components/effects/index.ts`.
- CHƯA CẮM: `InvitationPreview` vẫn render khối ambient cũ (tia vàng +
  cánh hoa cố định mỗi khi `fx.ambient` có mặt — mọi biến thể có ambient
  trông giống nhau ở lớp nền). Các khác biệt KHÁC của biến thể (nổ,
  hạt phim, marquee, hero ghim, đếm chương, Ken Burns, reveal, parallax)
  đã chạy vì chúng đi qua code render có sẵn + `?fx=`.
- CẮM SAU (1 dòng, khi task khối xong): trong InvitationPreview, thay
  khối ambient cuối article bằng:
  `{motion && <AmbientLayer fx={fx} templateId={data.templateId} />}`
  Sau đó `hoa-bay` chỉ còn cánh hoa rơi (14 cánh hồng/vàng), `anh-vang`
  chỉ còn bokeh + sao 4 cánh, `le-hoi` có cánh hoa 10 màu + sao — đúng
  bảng §4i. Không sửa gì khác trong file đó.
