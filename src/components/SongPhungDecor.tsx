"use client";

import { useEffect, useRef, useState } from "react";
import type { TemplateDecorationImages } from "@/lib/templates";

// Họa tiết trang trí gốc của mẫu Song Phụng Đỏ, trỏ thẳng tới URL gốc.
// QUAN TRỌNG: ảnh gốc là ảnh dọc rất cao (phụng ~1952x4105, tỉ lệ ~0.48),
// nên trước đây render với chiều cao 64-80px chỉ còn vệt rộng 30-38px, nhìn
// như không hiển thị. Bản này render phụng ở chiều cao lớn, thật sự nhìn thấy.
// referrerPolicy="no-referrer" để tránh trường hợp máy chủ gốc chặn hotlink
// theo Referer (trình duyệt mở trực tiếp không gửi Referer thì tải được).
function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

// Dải đỏ NGANG HẾT CHIỀU RỘNG, KHÔNG viền vàng, SẠCH (không phụng trong dải).
// Bản lớn theo số đo thật bản gốc, quy theo TỈ LỆ chiều rộng cột (cột gốc
// 907px; khung xem trước hẹp hơn nên dùng %/aspect, không px tuyệt đối):
// - HÀNG DẢI cao 488/907 = 53.8% chiều rộng (aspect 907/488).
// - Dải đỏ cao 206px, nằm ở nửa dưới hàng dải: top 50% hàng, cao 206/488 =
//   42.2% chiều cao hàng, full width, #710001.
// - Chữ Hỷ 291x291px = 32.1% chiều rộng, CĂN GIỮA HÀNG DẢI (không phải giữa
//   dải): tràn lên trên dải 145.5px, đáy trong dải, còn 60.5px dải trống
//   phía dưới; tỉ lệ Hỷ/dải = 1.41. Ký tự 囍 dự phòng CHỈ hiện khi ảnh lỗi
//   (không chồng dưới ảnh — chồng 2 hình Hỷ gây viền lạ quanh chữ Hỷ).
// - Phụng neo theo HÀNG DẢI (không phải khối tên): trái 431x900px = rộng
//   47.5% (vòng 12: trả về đúng số gốc sau khi khoảng kem dưới dải đã sửa
//   về 26.5% — đuôi vẫn bị đáy hero cắt ngang lông như bản gốc vì đuôi thò
//   19.6% chiều rộng cột qua đáy hero, gần đúng 19.0% của bản gốc; vòng 9
//   từng nâng lên 51% để bù cho khoảng kem 50% quá cao, nay không cần nữa).
//   Phải 291x600px nhưng ảnh thật (1952x4105, tỉ lệ 0.4755) render trong
//   hộp object-contain chỉ rộng 285px = 31.4% (vòng 12 sửa từ 32.1% —
//   chính là điểm "phụng phải to hơn bản gốc" QA11 nêu); left
//   calc(50% + 16%), top -50.1% chiều cao hàng (đỉnh ảnh đúng bằng mép
//   trên cùng của phần chính, cánh chạm mép trên), đáy trong dải.
//   Phụng trái cao gần gấp rưỡi phụng phải.
// Bản nhỏ (thẻ thư viện) giữ nguyên như vòng 5: dải 84px, ảnh Hỷ 100px,
// đáy cách đáy dải 22px.
export function SongPhungBand({ deco, small }: { deco: TemplateDecorationImages; small?: boolean }) {
  // Chữ Hỷ dự phòng chỉ hiện khi ảnh lỗi (tránh chồng 2 lớp gây viền).
  const [hyFailed, setHyFailed] = useState(false);
  const onHyError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
    setHyFailed(true);
  };
  // Parallax đuôi phụng trái (vòng 13): bản gốc dùng hook dD với tốc độ
  // -0.15, origin "page" (chunk_33 module 22705: ref C(-.15) trên wrapper
  // phụng trái; dD ở chunk_25: offset = scrollY × speed, template
  // "translateY({y})"). Lúc chưa cuộn offset = 0; càng cuộn xuống xem
  // chỗ nối hero/thông tin, đuôi càng rút lên (scrollY 900 → −135px) nên
  // đầu đuôi chỉ còn chấm nhỏ ngay đáy hero — đúng cảm giác "đuôi cắt
  // ngang lông ngay đáy hero" mà QA mô tả ở bản gốc. Không có parallax
  // này + overflow-hidden (vòng 7) thì đuôi bị cắt ngang ở phần rộng
  // nhất thành vệt đỏ thẳng — chính là "motif" QA11/12 thấy. Chỉ áp cho
  // phụng trái (phụng phải/HOA không chạm chỗ nối khi xem).
  const leftPhoenixRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const el = leftPhoenixRef.current;
    if (!el) return;
    // Vòng 17: KHÔNG parallax trong thumbnail thư viện (data-deco-thumbnail,
    // xem TemplateCard): thumbnail là ảnh tĩnh thu nhỏ, phụng phải đứng yên
    // ở vị trí scroll-top như trang khách lúc chưa cuộn. Parallax chạy theo
    // scroll của TRANG GALLERY là sai ở đây — thẻ ở giữa trang, scrollY
    // ~1000–2000px kéo đuôi phụng trượt lên −150–−300px, lọt vào vùng tên
    // hero và che/cắt mất chữ đầu dòng ("THU AN" → "U AN" QA16 thấy; chỉ
    // xuất hiện ở thumbnail, trang khách ở scroll-top không bị). Tắt hẳn
    // listener trong thumbnail; trang khách/editor/dialog preview giữ
    // nguyên parallax.
    if (el.closest("[data-deco-thumbnail]")) return;
    const update = () => {
      el.style.transform = `translateY(${window.scrollY * -0.15}px)`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  if (small) {
    return (
      <div
        className="relative w-full"
        style={{ background: "#710001", height: 84 }}
      >
        <div
          className="absolute left-1/2"
          style={{ bottom: 22, transform: "translateX(-50%)" }}
        >
          {hyFailed ? (
            <span
              className="flex items-center justify-center font-bold leading-none"
              style={{ color: "#fff0e7", fontSize: 56, height: 100 }}
            >
              囍
            </span>
          ) : (
            <img
              src={deco.chuHy}
              alt="Chữ Hỷ"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={onHyError}
              className="relative w-auto object-contain"
              style={{ height: 100 }}
            />
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="relative w-full" style={{ aspectRatio: "907 / 488" }}>
      {/* Dải đỏ: nửa dưới hàng dải, cao 42.2% chiều cao hàng (= 206px). */}
      <div className="absolute inset-x-0 top-1/2 h-[42.2%]" style={{ background: "#710001" }} />
      {/* Chữ Hỷ căn giữa HÀNG DẢI, rộng 32.1% (= 291px). */}
      {hyFailed ? (
        <span
          className="absolute left-1/2 top-1/2 z-20 font-bold leading-none"
          style={{ color: "#fff0e7", fontSize: 128, transform: "translate(-50%, -50%)" }}
        >
          囍
        </span>
      ) : (
        <img
          src={deco.chuHy}
          alt="Chữ Hỷ"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={onHyError}
          className="absolute left-1/2 top-1/2 z-20 w-[32.1%] object-contain"
          style={{ transform: "translate(-50%, -50%)" }}
        />
      )}
      {/* Phụng trái: left -18.6%, top 0 hàng, rộng 47.5% (= 431px gốc).
          Cao ~99.9% chiều rộng cột nên đuôi thò ~19.6% qua đáy hero
          (bản gốc 19.0%) — KHÔNG cắt bằng overflow-hidden nữa (vòng 13:
          cắt ngang ở phần rộng tạo vệt đỏ thẳng = "motif" QA11/12 thấy);
          đuôi vuốt nhọn tự nhiên và rút lên nhờ parallax -0.15 khi cuộn
          (xem useEffect trên), không che chữ vì tên ở trên hàng dải và
          chữ khối THÔNG TIN căn giữa, cách đuôi ≥60px. */}
      <img
        ref={leftPhoenixRef}
        src={deco.phuongLeft}
        alt="Phụng lớn bên trái"
        loading="eager"
        referrerPolicy="no-referrer"
        onError={hideOnError}
        className="pointer-events-none absolute left-[-18.6%] top-0 z-10 w-[47.5%] object-contain"
        style={{ willChange: "transform" }}
      />
      {/* Phụng phải: left calc(50% + 16%), top -50.1% chiều cao hàng
          (đỉnh ảnh = mép trên cùng của phần chính, cánh chạm mép trên),
          rộng 31.4% (285px render thật trong hộp 291x600 do object-contain,
          không phải 32.1%); đáy trong dải, đuôi vắt qua dải. */}
      <img
        src={deco.phuongRight}
        alt="Phụng lớn bên phải"
        loading="eager"
        referrerPolicy="no-referrer"
        onError={hideOnError}
        className="pointer-events-none absolute left-[calc(50%+16%)] top-[-50.1%] z-10 w-[31.4%] object-contain"
      />
    </div>
  );
}
