"use client";

import type { ReactNode } from "react";

// Ken Burns — zoom/pan chậm trên ảnh tĩnh, kiểu phim tài liệu: ảnh như đang
// được máy quay lia nhẹ. Dùng CSS keyframes (không thư viện nào làm gọn hơn
// cho ảnh tĩnh). Hướng thay đổi theo ảnh để không lặp đơn điệu.
export type KenBurnsDirection = "in" | "out" | "pan-left" | "pan-right";

export function KenBurns({
  children,
  duration = 8,
  scale = 1.12,
  direction = "in",
  disabled = false,
  className,
}: {
  children: ReactNode;
  duration?: number;
  scale?: number;
  direction?: KenBurnsDirection;
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) return <div className={className}>{children}</div>;
  return (
    <div
      className={`kenburns kenburns-${direction} ${className ?? ""}`}
      style={{ ["--kb-duration" as string]: `${duration}s`, ["--kb-scale" as string]: scale }}
    >
      {children}
    </div>
  );
}
