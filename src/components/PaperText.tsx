// Chữ giấy dán — hiệu ứng chữ dạng "paper" cho slideshow intro.
//
// Chị chủ chốt 2026-11-10 (theo mẫu cộng đồng fake lật trang PDF —
// turn.js / FlipBook.js: tờ giấy lật qua rồi nằm phẳng xuống như dán —
// và kiểu chữ rơi Bounce In Letters): từng chữ RƠI từ trên cao xuống,
// LẬT (flip xuống như lật trang giấy, rotateX ~78° về 0) rồi DÁN —
// đáp xuống NẰM PHẲNG như tờ giấy dán lên mặt thiệp, bóng đổ nhẹ hiện
// ra lúc đáp rồi đứng yên. KHÔNG nảy đàn hồi, KHÔNG xoay tròn, KHÔNG
// gấp 3D kiểu paper-cut, KHÔNG kiểu chữ cắt báo ransom.
//
// TỐC ĐỘ DÙNG HÀM SỐ MŨ (chị chốt): chậm lúc đầu để khách THẤY RÕ hiệu
// ứng (flex), rồi nhanh dần để còn đọc thông tin — khoảng cách giữa
// các chữ co lại theo hàm mũ: gap_i = GAP0 * R^i (GAP0 ≈ 0,85s,
// R = 0,8): 2–3 chữ đầu rơi chậm rõ ràng, các chữ sau đổ dồn nhanh;
// cả dòng tụ xong trong ~5 giây rồi chữ đứng sắc nét. Mỗi chữ rơi+lật
// ~0,65s với easing tăng tốc (ease-in: chậm lúc bắt đầu rơi, nhanh
// dần khi đáp). Lúc chuyển ảnh: các chữ lật ngược lên và bay lên, mờ
// dần trong ~1,5–2 giây, tan hết không đè lên ảnh sau (giống nhịp
// exit của cát). DOM span từng chữ (nhóm theo từ để không vỡ giữa
// từ), framer-motion đã có sẵn, không thêm thư viện. Giảm chuyển
// động: hiện chữ tĩnh, không chạy hiệu ứng.
"use client";

import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";

const GAP0 = 0.85; // khoảng cách giữa chữ đầu và chữ thứ hai (giây)
const R = 0.8; // tỉ số hàm mũ — gap sau = gap trước * R
const DUR = 0.65; // mỗi chữ rơi + lật (giây)
const EXIT_STAGGER = 0.025; // lúc đi: mỗi chữ cách nhau 25ms
const EXIT_DUR = 0.7; // mỗi chữ lật bay lên (giây)

/** Thời điểm chữ thứ i bắt đầu rơi = tổng các gap trước nó:
 *  GAP0 * (1 - R^i) / (1 - R). Hội tụ về GAP0/(1-R) ≈ 4,25s nên
 *  dòng dài mấy cũng tụ xong trong ~5 giây: chữ đầu đáp ở 0,65s,
 *  chữ thứ hai ở ~1,5s, rồi các chữ sau đổ dồn nhanh dần. */
function startAt(i: number): number {
  return (GAP0 * (1 - Math.pow(R, i))) / (1 - R);
}

export function PaperText({
  text,
  slideKey,
  reduce,
  className,
  style,
}: {
  text: string;
  slideKey: number;
  reduce: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Nhóm ký tự theo TỪ để dòng dài ngắt ở khoảng trắng giữa các từ
  // (không vỡ giữa từ như "Đồng Đ / a") — giống ShatterText; hiệu
  // ứng vẫn chạy từng chữ cái, độ trễ tính theo chỉ số ký tự toàn dòng.
  const words = useMemo(() => text.split(" ").map((w) => Array.from(w)), [text]);
  let charIndex = -1;
  return (
    <span className={className} style={style} aria-label={text}>
      {words.map((chars, wi) => (
        <Fragment key={`${slideKey}-w${wi}`}>
          {/* perspective đặt ở span từ (cha trực tiếp của các chữ) để
              rotateX của từng chữ có chiều sâu 3D; chữ đáp xong thì
              transform về none nên vẫn đo được "đã đáp phẳng". */}
          <span className="inline-block whitespace-nowrap" style={{ perspective: 700 }}>
            {chars.map((ch) => {
              charIndex += 1;
              const i = charIndex;
              const delay = startAt(i);
              return (
                <motion.span
                  key={`${slideKey}-${i}`}
                  aria-hidden="true"
                  className="paper-char inline-block will-change-transform"
                  style={{ transformOrigin: "50% 100%" }}
                  initial={
                    reduce
                      ? false
                      : {
                          opacity: 0,
                          y: -64,
                          rotateX: 78,
                          filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    filter: "drop-shadow(0px 3px 4px rgba(0,0,0,0.30))",
                  }}
                  exit={{
                    opacity: 0,
                    y: -56,
                    rotateX: -72,
                    filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                    transition: { duration: EXIT_DUR, delay: i * EXIT_STAGGER, ease: "easeIn" },
                  }}
                  transition={{
                    duration: DUR,
                    delay,
                    // ease-in: chậm lúc bắt đầu rơi, nhanh dần khi đáp.
                    ease: [0.42, 0, 1, 1],
                    // Bóng đổ chỉ hiện dần trong đoạn cuối của cú rơi.
                    filter: { duration: 0.3, delay: delay + 0.35 },
                  }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
