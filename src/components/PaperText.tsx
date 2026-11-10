// Chữ giấy dán — hiệu ứng chữ dạng "paper" cho slideshow intro.
//
// Chị chủ chốt 2026-11-10 (theo mẫu cộng đồng fake lật trang PDF —
// turn.js / FlipBook.js: tờ giấy lật qua rồi nằm phẳng xuống như dán —
// và kiểu chữ rơi Bounce In Letters): từng chữ RƠI từ trên cao xuống,
// LẬT rồi DÁN — đáp xuống NẰM PHẲNG như tờ giấy dán lên mặt thiệp,
// bóng đổ nhẹ hiện ra lúc đáp rồi đứng yên. KHÔNG nảy đàn hồi, KHÔNG
// xoay tròn, KHÔNG gấp 3D kiểu paper-cut, KHÔNG kiểu chữ cắt báo ransom.
//
// V3 — SỬA 2026-11-10 theo phản hồi trực tiếp của chị sau khi xem bản
// live v2 trên điện thoại: "flip từ trái qua phải hoặc từ hư không chứ
// nó xuất hiện cái dãy này xấu quá". "Cái dãy" = vệt ngang mỏng lúc mới
// bắt đầu: v2 giữ opacity 1 suốt nên TẤT CẢ các chữ cùng hiện ra dưới
// dạng vạch ngang mỏng (rotateX −90°) xếp thành một hàng ngang trên
// slide. V3: mỗi chữ bắt đầu opacity 0 (VÔ HÌNH HOÀN TOÀN) và chỉ mờ
// vào TRONG LÚC lật — keyframes opacity [0, 0, 1, 1] với times
// [0, 0.25, 0.5, 1]: vô hình trong 25% đầu lúc còn gần như nhìn ngang
// cạnh, mờ vào tới 50% lúc đã lật đủ để thấy rõ mặt chữ, rõ hẳn từ đó
// tới lúc đáp phẳng. Quy tắc: KHÔNG BAO GIỜ có thời điểm nào chữ hiện
// rõ (opacity ~1) trong khi rotateX còn gần −90° — đó chính là vệt
// mỏng chị chê. Chữ chưa tới lượt thì vô hình; chữ chỉ xuất hiện khi
// đang lật — lật từ trái qua phải, hoặc từ hư không lật vào.
//  (2) Nhịp khựt khựt: v1 chia gap theo từng chữ (gap_i = 0,85 × 0,8^i)
//      nên mỗi chữ là một đoạn riêng, giữa các chữ có khoảng chết.
//      V2 dùng MỘT đường cong tiến độ chung cho cả dòng (xem startAt):
//      khoảng cách giữa các lần đáp CO LẠI LIÊN TỤC — gia tốc tổng
//      xuyên suốt, chậm lúc đầu để khoe hiệu ứng, nhanh dần về cuối
//      để kịp đọc — không còn gap rời rạc theo từng chữ. Mỗi chữ
//      rơi+lật ~0,9s, DÀI HƠN khoảng cách lớn nhất giữa các lần đáp
//      (~0,78s), nên các chữ CHỒNG LÊN NHAU: lúc nào cũng có chữ đang
//      chuyển động, không có lúc nào màn hình đứng yên chờ chữ sau.
//
// LƯU Ý TOÁN HỌC — ĐỪNG ĐỔI LẠI THÀNH CÔNG THỨC (e^(k·x) − 1)/(e^k − 1):
// công thức đó NHÌN thì giống hàm mũ nhưng cho mặt trận đáp CHẬM DẦN
// (khoảng cách giữa các lần đáp TĂNG dần — nhanh đầu, chậm cuối),
// NGƯỢC ý chị. Công thức đúng cho gia tốc tổng tăng liên tục là dạng
// lõm (1 − e^(−k·x))/(1 − e^(−k)): khoảng cách giữa các lần đáp GIẢM
// dần — chậm đầu, nhanh cuối. Kiểm bằng số (dòng 14 chữ, T = 5s):
// các chữ đáp ở 0,9s — 1,7s — 2,3s — 2,9s — 3,3s — … — 5,0s; số chữ
// đã đáp ở mốc 1s/2s/3s/4s/5s là 1 → 2 → 4 → 7 → 14 (tăng nhanh dần).
//
// Lúc chuyển ảnh: các chữ lật ngược lên và bay lên, mờ dần trong
// ~1,5–2 giây, tan hết không đè lên ảnh sau (giống nhịp exit của cát).
// DOM span từng chữ (nhóm theo từ để không vỡ giữa từ), framer-motion
// đã có sẵn, không thêm thư viện. Giảm chuyển động: hiện chữ tĩnh,
// không chạy hiệu ứng.
"use client";

import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";

const K = 2.5; // hệ số mũ của đường cong tiến độ chung
const T = 5.0; // cả dòng tụ xong (chữ cuối đáp) sau ~5 giây
const DUR = 0.9; // mỗi chữ rơi + lật (giây) — dài hơn khoảng cách lớn nhất giữa các lần đáp (~0,78s) nên các chữ chồng lên nhau, fluent
const FLIP_FROM = -90; // bắt đầu nhìn ngang cạnh tờ giấy — cú lật làm chữ hiện ra
const Y_FROM = -80; // bắt đầu ở trên cao
const EXIT_STAGGER = 0.025; // lúc đi: mỗi chữ cách nhau 25ms
const EXIT_DUR = 0.7; // mỗi chữ lật bay lên (giây)

/** Thời điểm bắt đầu rơi của chữ thứ i (i = 0..N−1, N = số chữ cái
 *  của dòng) trên MỘT đường cong tiến độ chung cho cả dòng:
 *  start_i = S × (1 − e^(−K·i/(N−1))) / (1 − e^(−K)), S = T − DUR.
 *  Chữ đầu bắt đầu ở 0s, chữ cuối bắt đầu ở S và đáp đúng T. Khoảng
 *  cách giữa các lần đáp co lại liên tục theo hàm mũ (gia tốc tổng
 *  xuyên suốt) — không chia gap rời rạc theo từng chữ. */
function startAt(i: number, n: number): number {
  if (n <= 1) return 0;
  const s = T - DUR;
  return (s * (1 - Math.exp((-K * i) / (n - 1)))) / (1 - Math.exp(-K));
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
  // ứng vẫn chạy từng chữ cái, thời điểm tính theo chỉ số ký tự toàn dòng.
  const words = useMemo(() => text.split(" ").map((w) => Array.from(w)), [text]);
  // Tổng số chữ cái của dòng (không tính khoảng trắng) — mẫu số N của
  // đường cong tiến độ chung.
  const total = useMemo(() => words.reduce((sum, w) => sum + w.length, 0), [words]);
  let charIndex = -1;
  return (
    <span className={className} style={style} aria-label={text}>
      {words.map((chars, wi) => (
        <Fragment key={`${slideKey}-w${wi}`}>
          {/* perspective đặt ở span từ (cha trực tiếp của các chữ) để
              rotateX của từng chữ có chiều sâu 3D; chữ đáp xong thì
              transform về none nên vẫn đo được "đã đáp phẳng". */}
          <span className="inline-block whitespace-nowrap" style={{ perspective: 450 }}>
            {chars.map((ch) => {
              charIndex += 1;
              const i = charIndex;
              const delay = startAt(i, total);
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
                          // V3: opacity 0 — chữ VÔ HÌNH tới khi tới lượt lật
                          // (v2 giữ opacity 1 nên cả dòng hiện thành vệt
                          // ngang mỏng lúc mới bắt đầu — chị chê xấu).
                          opacity: 0,
                          y: Y_FROM,
                          rotateX: FLIP_FROM,
                          filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                        }
                  }
                  animate={{
                    // Mờ vào TRONG LÚC lật: vô hình 25% đầu (còn gần như
                    // nhìn ngang cạnh), mờ vào tới 50% (đã lật đủ để thấy
                    // rõ mặt chữ), rõ hẳn từ đó tới lúc đáp phẳng.
                    opacity: [0, 0, 1, 1],
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
                    // delay phải ghi rõ trong TỪNG transition theo giá trị:
                    // framer-motion KHÔNG kế thừa delay từ transition chung
                    // khi một giá trị đã có transition riêng — v2 lần đầu
                    // quên điều này nên mọi chữ rơi cùng lúc, đáp hết ở
                    // 0,9s (QA bắt được: landed=89 ở mốc 1s).
                    // y: rơi tăng tốc như trọng lực (ease-in); rotateX:
                    // lật đều (ease-in-out) để cú lật nhìn rõ suốt cú rơi.
                    y: { duration: DUR, delay, ease: [0.42, 0, 1, 1] },
                    rotateX: { duration: DUR, delay, ease: [0.65, 0, 0.35, 1] },
                    // Opacity: keyframes [0, 0, 1, 1] với times [0, 0.25,
                    // 0.5, 1] — vô hình 25% đầu, mờ vào tới 50%, rõ hẳn
                    // sau đó. Delay ghi rõ riêng (không kế thừa).
                    opacity: { duration: DUR, delay, times: [0, 0.25, 0.5, 1], ease: "linear" },
                    // Bóng đổ chỉ hiện dần trong đoạn cuối của cú rơi.
                    filter: { duration: 0.3, delay: delay + DUR - 0.3 },
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
