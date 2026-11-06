"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(GSAPSplitText);

// Chữ nhảy kiểu landing page: từng từ nhô lên từ sau mặt nạ (masked word
// rise, yPercent 120 → 0, expo.out, 0.8s, stagger 0.04s) bằng GSAP
// SplitText. Khác StaggeredText (chỉ mờ + trồi nhẹ): từ bị mặt nạ cắt nên
// lúc bay không chồng lên dòng khác (bài học QA19 — tên hero chồng nhau).
// Giảm chuyển động: trả chữ thường, không tách từ, không tween (timeline
// GSAP cũng chỉ chạy trong matchMedia no-preference).
export interface SplitLine {
  text: string;
  style?: CSSProperties;
  className?: string;
}

export function SplitLines({
  lines,
  className,
  delay = 0,
  stagger = 0.04,
  duration = 0.8,
  trigger = "inView",
  disabled = false,
}: {
  lines: SplitLine[];
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** "mount": chạy ngay khi gắn vào (tên hero sau khi mở phong bì).
      "inView": chạy khi cuộn vào khung (tên lớn, tiêu đề). */
  trigger?: "mount" | "inView";
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReducedMotion();
  // Khóa effect bằng NỘI DUNG chữ (không dùng mảng lines trực tiếp —
  // array literal ở nơi gọi đổi identity mỗi lần render sẽ tách lại từ
  // và chạy lại animation giữa chừng).
  const linesKey = lines.map((l) => l.text).join("|");

  useEffect(() => {
    if (disabled || reduce) return;
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = lineRefs.current
        .filter((el): el is HTMLSpanElement => !!el)
        .map((el) => GSAPSplitText.create(el, { type: "words", mask: "words", autoSplit: true }));
      const words = splits.flatMap((s) => s.words as Element[]);
      if (words.length === 0) return;
      const tween = gsap.from(words, {
        yPercent: 120,
        duration,
        ease: "expo.out",
        stagger,
        delay,
        paused: true,
      });
      let io: IntersectionObserver | null = null;
      if (trigger === "mount") {
        tween.play();
      } else {
        io = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              tween.play();
              io?.disconnect();
            }
          },
          { threshold: 0.3 }
        );
        io.observe(root);
      }
      return () => {
        io?.disconnect();
        tween.kill();
        splits.forEach((s) => s.revert());
      };
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, delay, stagger, duration, trigger, disabled, reduce]);

  return (
    <span ref={rootRef} className={className}>
      {lines.map((ln, i) => (
        <span key={i} className={`block ${ln.className ?? ""}`} style={ln.style}>
          <span
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
          >
            {ln.text}
          </span>
        </span>
      ))}
    </span>
  );
}
