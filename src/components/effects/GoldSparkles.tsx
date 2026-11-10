"use client";

// Lấp lánh vàng cho thiệp (shadcn Sparkles): bụi mịn + điểm sáng + tia 4 cánh.
// Thay bụi tròn FloatingAmbient — hạt 10–20px nhìn như vết bẩn trên giấy kem.
// LƯU Ý: Sparkles gốc có class `relative` trong class gốc nên KHÔNG thể
// truyền `absolute` qua className (Tailwind 3.4 xếp `relative` sau `absolute`
// nên `relative` thắng — lớp lấp lánh co về 0px ở cuối trang, bụi/tia dồn
// hết xuống đáy, trang nhìn như không có gì). Vì vậy GoldSparkles bọc
// Sparkles trong một div `absolute inset-0` riêng, còn Sparkles bên trong
// chỉ cần `h-full w-full`.
import { Sparkles } from "@/components/ui/sparkles";
import { useReducedMotion } from "framer-motion";

export interface GoldSparklesProps {
  /** Số tia 4 cánh (mặc định 16). */
  count?: number;
  /** Tốc độ lấp lánh (mặc định 1). */
  speed?: number;
  /** Seed ổn định theo mẫu. */
  seed?: number | string;
  className?: string;
}

export function GoldSparkles({ count = 16, speed = 1, seed = 1, className }: GoldSparklesProps) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`}>
      <Sparkles
        className="h-full w-full"
        sparkleColor="#f6d365"
        density={0.5}
        count={count}
        minSize={0.8}
        maxSize={2.2}
        speed={speed}
        fade="radial"
        seed={seed}
      />
    </div>
  );
}
