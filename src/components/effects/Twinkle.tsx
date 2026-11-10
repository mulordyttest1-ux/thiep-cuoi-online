"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { hashSeed, mulberry32 } from "@/lib/seeded";

// Ngôi sao 4 cánh lấp lánh (Twinkle) — thứ mà thư viện chưa có: một điểm
// sáng nhấp nháy RÕ (scale + xoay + chớp sáng), không phải ánh sáng thở
// chậm như Shimmer. Dùng SVG 4 cánh để nét trên mọi máy. Vị trí ổn định
// theo seed; có thể truyền positions cố định (vd quanh chữ Hỷ).
//
// NÂNG CẤP 2026-11-10 theo mẫu Pikbest "Let's Fall In Love" (325641):
// bản cũ mọi sao cùng cỡ 6–14px, cùng màu, nhịp 1,8–2,6s gần giống nhau
// → nhấp gần như đồng loạt, không có sao nào làm điểm nhấn, glow yếu.
// Bản mới (chỉ chế độ ngẫu nhiên — sao cố định quanh chữ/tên giữ nguyên):
// 2 sao HERO 20–30px trắng ấm + glow mạnh, còn lại 6–14px vàng, nhịp
// 1,6–3,4 giây rải ra (không đồng loạt), xoay khởi đầu ngẫu nhiên.
export interface TwinkleProps {
  count?: number;
  seed?: number | string;
  size?: [number, number]; // cỡ nhỏ–lớn (px)
  color?: string;
  positions?: { left: number; top: number }[]; // % trong khung chứa
  className?: string;
  /** Tắt hẳn (vd thumbnail/editor chỉ cần bố cục tĩnh). */
  disabled?: boolean;
}

const STAR = "M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z";

export function Twinkle({
  count = 8,
  seed = 1,
  size = [6, 14],
  color = "#f6d365",
  positions,
  className,
  disabled = false,
}: TwinkleProps) {
  const reduce = useReducedMotion();
  // Khóa memo bằng giá trị (không dùng mảng positions trực tiếp — array
  // literal ở nơi gọi đổi identity mỗi lần render sẽ xáo lại nhịp nhấp).
  const posKey = positions?.map((p) => `${p.left},${p.top}`).join("|") ?? "";
  const sizeKey = size.join(",");
  const sparks = useMemo(() => {
    const rand = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
    const n = positions?.length ?? count;
    return Array.from({ length: n }, (_, i) => {
      // Chế độ ngẫu nhiên (không positions): 2 sao đầu là HERO — to, trắng
      // ấm, glow mạnh, nhịp chậm hơn; còn lại nhỏ, vàng, nhịp rải 1,6–3,4s.
      // Chế độ positions cố định (quanh chữ Hỷ/tên): giữ nguyên như cũ.
      const hero = !positions && n >= 6 && i < 2;
      return {
        left: positions?.[i]?.left ?? rand() * 100,
        top: positions?.[i]?.top ?? rand() * 100,
        size: hero ? 20 + rand() * 10 : size[0] + rand() * (size[1] - size[0]),
        color: hero ? "#fff6d8" : color,
        glow: hero ? 12 : 4,
        rotate: Math.floor(rand() * 360),
        duration: hero ? 2.6 + rand() * 1.0 : 1.6 + rand() * 1.8,
        delay: -rand() * 2.6, // delay âm: đã nhấp giữa chừng ngay khi mở trang
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, posKey, sizeKey]);
  if (disabled || reduce) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {sparks.map((s, i) => (
        <span
          key={i}
          className="twinkle absolute block"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            ["--tw-duration" as string]: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        >
          <svg viewBox="0 0 24 24" width={s.size} height={s.size} style={{ filter: `drop-shadow(0 0 ${s.glow}px ${s.color})`, transform: `rotate(${s.rotate}deg)` }}>
            <path d={STAR} fill={s.color} />
          </svg>
        </span>
      ))}
    </div>
  );
}
