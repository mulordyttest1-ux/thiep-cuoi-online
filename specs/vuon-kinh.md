# Spec — Vườn Kính Xanh (vuon-kinh)

Nguồn: demo gốc https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh/demo
(xem + chụp 13/11/2026; PDF lưu ở .hatch-browser/outputs/browser-task:8323de67-.../
browser-page-20261113T042240-0.pdf = bìa đóng, ...042507-1.pdf = thiệp mở, 6 trang).
Ảnh nền/họa tiết gốc: theme glass-garden-green (floral-background.webp +
flower2-decoration.webp) — đã có trong public/themes/ (PR #63).

## Dấu ấn mẫu (signature)
- TOÀN THIỆP là MỘT nền hoa watercolor liên tục (nhài trắng + lá xanh +
  hồng phấn) + các khối nội dung đặt trên TẤM KÍNH MỜ (glassmorphism:
  nền trắng trong suốt, thấy hoa/lá phía sau, bo góc lớn ~28–32px,
  viền sáng mỏng, bóng nhẹ). Không có nền đặc từng khối.
- Màu chủ đạo: xanh lá đậm #47613E (nút, tên, tim đánh dấu lịch);
  xanh lá vừa #5E804D, xanh nhạt #A5B697 (lá nền); hồng phấn #D7A098;
  trắng kem #F0EDE0. App hiện tại: accent #3e6b4f, bg #f3f8f3 — GẦN
  nhưng chưa đúng số (accent lệch #3e6b4f vs #47613E).
- Font: tên + tiêu đề mục = serif Didone (dáng Playfair Display/Cormorant,
  nét thanh đậm tương phản, chữ hoa tiêu đề giãn cách); nội dung = sans gọn.

## Bìa đóng (cover)
- Nền hoa full-bleed; giữa là thẻ kính + cụm hoa trắng góc trên-trái và
  dưới-phải tràn ra ngoài viền thẻ.
- Đầu thẻ: vòng tròn xanh đậm, trong là tim trắng.
- Chữ (giữa, trên→dưới): "Quang Huy" & "Thảo Vy" (serif xanh đậm) —
  đường kẻ mảnh có bông hoa giữa — "2 tháng 8, 2026" — "Thân Mời" (script).
- Nút "Mở thiệp": pill xanh đậm, chữ trắng, gần cuối thẻ.
- LƯU Ý: cover của app KHÔNG chứa tên/ngày (luật cover đã chốt) nên
  cover app không thể giống hệt bìa gốc; giữ ngôn ngữ cover hiện tại
  (nền hoa + hoa chính + khung vàng) — chỉ khớp màu/họa tiết.

## Thiệp mở (thứ tự từ trên xuống)
1. Hero: khung kính VÒM (arch, bo tròn đỉnh) cao, trong là tên + ngày;
   dưới khung là bó hoa trắng lớn đặt ngang. Nhạc tự phát (app không có nhạc).
2. THÔNG TIN LỄ CƯỚI: 2 cột họ nhà trai/gái; "TRÂN TRỌNG BÁO TIN LỄ
   THÀNH HÔN CỦA CON CHÚNG TÔI"; "Trần Quang Huy — TRƯỞNG NAM" &
   "Lê Thảo Vy — ÚT NỮ" nối bằng "&" lớn; khối ngày 3 cột
   "CHỦ NHẬT | 02 | THÁNG 08 | 2026"; "Lễ thành hôn ... tại TƯ GIA
   vào lúc 09:00, (tức ngày 20 tháng 6 năm Bính Ngọ)". Chữ xanh đậm
   trên nền hoa mờ, KHÔNG khung thẻ riêng cho khối này.
3. ALBUM ẢNH: carousel 3D coverflow (giữa lớn, 2 bên xoay nghiêng nhỏ
   dần), nút ‹ ›, đếm "1/9", tự chạy. 9 ảnh cưới ngoại cảnh.
4. THÔNG TIN TIỆC CƯỚI: "Bữa tiệc sẽ được bắt đầu vào lúc 11:30",
   "Chủ nhật | 02 | Tháng 08 | 2026", "Đón khách 11:00", "Khai tiệc 11:30".
   Dưới là thẻ kính bo góc lớn chứa LỊCH tháng "Tháng 8 / 2026" (cột T2–CN),
   ngày 2 đánh dấu bằng TIM xanh đậm có số "2" trắng; link "Thêm vào lịch";
   nút pill xanh "XÁC NHẬN THAM DỰ".
5. TIỆC CƯỚI SẼ TỔ CHỨC TẠI: "Trung Tâm Tiệc Cưới Thung Lũng Cá —
   25 Phan Chu Trinh, Đà Lạt" + nhúng Google Maps.
6. DRESS CODE: "DRESS CODE" + "Trang phục dự tiệc", chỉ 3 hình tròn màu
   (trắng, be/nâu nhạt, xanh sage nhạt), không chữ giải thích.
7. LỊCH TRÌNH NGÀY CƯỚI: timeline dọc, đường chấm chấm, mốc = chấm tròn
   xanh đậm: 17:30 Đón khách, 18:30 Khai tiệc, 18:45 Rót rượu cắt bánh,
   19:00 Phục vụ món chính, 21:00 Kết thúc tiệc. Hoa trắng dọc 2 mép.
8. SỔ LƯU BÚT: form trong thẻ kính (ô tên, ô lời chúc, nút gợi ý AI,
   nút "GỬI LỜI CHÚC") + danh sách lời chúc dạng thẻ kính.
9. HỘP QUÀ MỪNG: hộp quà kính xanh lá + nơ trắng, "Nhấn để mở" ✦✦✦✦.
10. Chân trang: "Sự hiện diện của quý khách là niềm vinh hạnh của gia
    đình chúng tôi!" + "♡ chungdoi.com"; cụm hoa trắng – lá xanh lớn.

## KHÔNG có trong mẫu gốc
- KHÔNG có khối đếm ngược (countdown) — đã kiểm toàn trang.
- Dữ liệu demo KHÔNG nhất quán (lễ 09:00 tư gia, tiệc 11:30, nhưng lịch
  trình 17:30–21:00 buổi tối) — khi làm lại lấy giờ theo dữ liệu thiệp
  thật, không copy giờ demo.

## Hiện trạng app (vuon-kinh, trước khi làm)
- ĐÃ CÓ: palette gần đúng, motif glass, variant hoa-bay, coverArt
  (bg floral-background + main flower2-decoration, live PR #63).
- CHƯA CÓ: nền hoa liên tục + thẻ kính mờ cho thân thiệp (thân thiệp
  app đang nền đặc #f3f8f3 + thẻ trắng đặc); hero vòm; lịch tháng có
  tim đánh dấu ngày (app không có khối lịch); album coverflow trong
  thân thiệp; ẩn đếm ngược theo mẫu (app luôn hiện đếm ngược khi có ngày).
- Mở thiệp gốc: bìa fade-out <1s rồi hiện nội dung, không lật/trượt rõ.

## Hướng làm (đề xuất, chờ chị chọn)
- A. Gói nhẹ "đúng chất kính": sửa palette (accent → #47613E) + thân
  thiệp dùng nền hoa floral-background cố định + thẻ kính mờ cho mọi
  khối (theo motif glass của mẫu). Giữ nguyên các khối hiện có.
- B. Gói đủ "như bản gốc": A + hero vòm + khối lịch tháng (tim đánh
  dấu ngày cưới) + album coverflow + ẩn đếm ngược mặc định cho mẫu này.
- Dung sai: gần đúng là được (luật 2026-11-05 cho mẫu của chính chị);
  giữ thiết kế/màu/họa tiết, cách trình bày được động (luật 2026-11-06).
