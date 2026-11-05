"use client";

import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";

// Ken Burns — zoom/pan chậm trên ảnh tĩnh, kiểu phim tài liệu: ảnh như đang
// được máy quay lia nhẹ. Dùng CSS keyframes (không thư viện nào làm gọn hơn
// cho ảnh tĩnh). Hướng thay đổi theo ảnh để không lặp đơn điệu.
// QUAN TRỌNG (bài học QA19): class/animation phải đặt TRỰC TIẾP lên <img>,
// không đặt lên div bọc ngoài — div bọc nằm trong khung overflow-hidden
// (nút coverflow / hộp ảnh) nên zoom bị cắt trong khung, khung đo không đổi
// và mắt thấy ảnh đứng yên. Gắn vào img thì chính tấm ảnh to dần, nhìn rõ
// và đo được. className ở đây là class gộp thêm vào img (vd h-full w-full).
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
  const vars = {
    ["--kb-duration" as string]: `${duration}s`,
    ["--kb-scale" as string]: scale,
  } as CSSProperties;
  const kbClass = `kenburns kenburns-${direction}`;
  if (disabled) return <>{children}</>;
  if (isValidElement(children)) {
    const el = children as ReactElement<{ className?: string; style?: CSSProperties }>;
    return cloneElement(el, {
      className: `${kbClass} ${el.props.className ?? ""} ${className ?? ""}`.trim(),
      style: { ...(el.props.style ?? {}), ...vars },
    });
  }
  // Con không phải element (chuỗi, fragment...): bọc bằng div như trước.
  return (
    <div
      className={`${kbClass} ${className ?? ""}`}
      style={vars}
    >
      {children}
    </div>
  );
}
