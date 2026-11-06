"use client";

import type { CSSProperties, ReactNode } from "react";

// Ánh kim / phát sáng nhẹ nhàng — cho chữ Hỷ, con dấu phong bì. Chỉ là
// filter drop-shadow + brightness theo nhịp (CSS animation, rẻ, 60fps).
export function Shimmer({
  children,
  duration = 3,
  intensity = "soft",
  disabled = false,
  className,
  style,
  ...rest
}: {
  children: ReactNode;
  duration?: number;
  intensity?: "soft" | "strong";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  // Cho phép gắn data-* (vd data-hero-xi để PinnedHero nhắm tới chữ Hỷ).
  [key: string]: unknown;
}) {
  if (disabled) return <span className={className} style={style} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>;
  return (
    <span
      className={`shimmer-glow inline-block ${intensity === "strong" ? "shimmer-glow-strong" : ""} ${className ?? ""}`}
      style={{ ...style, ["--shimmer-duration" as string]: `${duration}s` }}
      {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
}
