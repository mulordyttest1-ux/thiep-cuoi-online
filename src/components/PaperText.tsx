// Chữ giấy dán — hiệu ứng chữ dạng "paper" cho slideshow intro.
//
// Chị chủ chốt 2026-11-10 (theo mẫu cộng đồng fake lật trang PDF —
// turn.js / FlipBook.js: tờ giấy lật qua rồi nằm phẳng xuống như dán —
// và kiểu chữ rơi Bounce In Letters): từng chữ RƠI từ trên cao xuống,
// LẬT rồi DÁN — đáp xuống NẰM PHẲNG như tờ giấy dán lên mặt thiệp,
// bóng đổ nhẹ hiện ra lúc đáp rồi đứng yên. KHÔNG nảy đàn hồi, KHÔNG
// xoay tròn, KHÔNG gấp 3D kiểu paper-cut, KHÔNG kiểu chữ cắt báo ransom.
//
// V4 — SỬA 2026-11-10 16:24 theo yêu cầu của chị: 3 hiệu ứng chữ
// (sand/scatter/paper) DÙNG CHUNG 1 nhịp đáp (xem TEXT_PACE_* trong
// src/lib/intro.ts): GIỮ K = 2,5 (cùng gia tốc), khoảng trải lần bắt
// đầu S = 2,05s (cũ 4,1s — halved để vận tốc ban đầu GẤP ĐÔI: v0 ≈
// 0,179 phần dòng/giây, cũ ≈ 0,090), mỗi chữ vẫn rơi+lật DUR = 0,9s,
// cả dòng đáp xong T = 2,95s (cũ 5,0s). Chữ vẫn vô hình tới lượt rồi
// mới lật vào từ trái qua phải (không vệt mỏng), flip −90°→0,
// opacity keyframes [0, 0, 1, 1] — giữ nguyên như v3.
//
// LƯU Ý TOÁN HỌC — ĐỪNG ĐỔI LẠI THÀNH CÔNG THỨC (e^(k·x) − 1)/(e^k − 1):
// công thức đó NHÌN thì giống hàm mũ nhưng cho mặt trận đáp CHẬM DẦN
// (khoảng cách giữa các lần đáp TĂNG dần — nhanh đầu, chậm cuối),
// NGƯỢC ý chị. Công thức đúng cho gia tốc tổng tăng liên tục là dạng
// lõm (1 − e^(−k·x))/(1 − e^(−k)): khoảng cách giữa các lần đáp GIẢM
// dần — chậm đầu, nhanh cuối. Kiểm bằng số (dòng 14 chữ "Thu An &
// Minh Quân", T = 2,95s): các chữ đáp ở 0,9s — 1,3s — 1,6s — 1,9s —
// 2,1s — … — 2,95s; số chữ đã đáp ở mốc 1s/1,5s/2s/2,5s/2,95s là
// 1 → 2 → 4 → 7 → 14 (tăng nhanh dần).
//
// Lúc chuyển ảnh: các chữ lật ngược lên và bay lên, mờ dần trong
// ~1,5–2 giây, tan hết không đè lên ảnh sau (giống nhịp exit của cát).
// DOM span từng chữ (nhóm theo từ để không vỡ giữa từ), framer-motion
// đã có sẵn, không thêm thư viện. Giảm chuyển động: hiện chữ tĩnh,
// không chạy hiệu ứng.
"use client";

import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { TEXT_PACE_DUR_S, textPaceStartAt } from "@/lib/intro";

const DUR = TEXT_PACE_DUR_S; // mỗi chữ rơi + lật (giây) — dài hơn khoảng cách lớn nhất giữa các lần đáp (~0,39s) nên các chữ chồng lên nhau, fluent
const FLIP_FROM = -90; // bắt đầu nhìn ngang cạnh tờ giấy — cú lật làm chữ hiện ra
const Y_FROM = -80; // bắt đầu ở trên cao
const EXIT_STAGGER = 0.025; // lúc đi: mỗi chữ cách nhau 25ms
const EXIT_DUR = 0.7; // mỗi chữ lật bay lên (giây)

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
              const delay = textPaceStartAt(i, total); // nhịp đáp chung (intro.ts): K = 2,5 giữ nguyên, S = 2,05s — v0 gấp đôi paper cũ
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
