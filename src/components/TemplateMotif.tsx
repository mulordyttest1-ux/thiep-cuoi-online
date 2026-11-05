"use client";

import type { TemplateMotif } from "@/lib/templates";

/**
 * Họa tiết vẽ tay bằng CSS/SVG, tự tạo trong dự án này.
 * Mỗi motif chỉ là hình cách điệu đơn giản (không phải artwork chi tiết):
 * đôi phụng = hai nhóm cánh cong đối xứng, Nhật Bình = dải hình thoi,
 * sen/hồng/lavender = cánh và cành cách điệu, v.v.
 */
export default function TemplateMotif({
  motif,
  accent,
  gold,
  size = "lg",
  light = false,
}: {
  motif: TemplateMotif;
  accent: string;
  gold: string;
  size?: "sm" | "lg";
  light?: boolean;
}) {
  const main = light ? "#ffffff" : accent;
  const trim = gold;
  const h = size === "lg" ? 44 : 28;
  const w = size === "lg" ? 150 : 100;

  if (motif === "double-happiness") {
    return (
      <p aria-hidden="true" className={size === "lg" ? "text-5xl font-bold leading-none" : "text-3xl font-bold leading-none"} style={{ color: main }}>
        囍
      </p>
    );
  }

  if (motif === "none") {
    return <div aria-hidden="true" className="mx-auto" style={{ width: 64, height: 2, background: trim }} />;
  }

  if (motif === "nhat-binh") {
    return (
      <div aria-hidden="true" className="w-full">
        <div style={{ height: 1, background: trim, opacity: 0.7 }} />
        <div className="flex items-center justify-center gap-3 py-1.5" style={{ color: main }}>
          {["◆", "❦", "◆", "❦", "◆", "❦", "◆"].map((c, i) => (
            <span key={i} className={size === "lg" ? "text-base" : "text-xs"} style={{ color: i % 2 === 0 ? main : trim }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ height: 1, background: trim, opacity: 0.7 }} />
      </div>
    );
  }

  if (motif === "marble") {
    return (
      <div
        aria-hidden="true"
        className="mx-auto rounded-full"
        style={{
          width: w,
          height: 10,
          background: `radial-gradient(ellipse at 30% 40%, ${trim}55, transparent 60%), radial-gradient(ellipse at 70% 60%, ${main}33, transparent 60%), linear-gradient(90deg, transparent, ${trim}66, transparent)`,
        }}
      />
    );
  }

  if (motif === "lace") {
    return (
      <div aria-hidden="true" className="flex items-center justify-center gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="inline-block rounded-full"
            style={{ width: size === "lg" ? 9 : 6, height: size === "lg" ? 9 : 6, border: `1.5px solid ${trim}`, background: i % 2 === 0 ? "transparent" : trim }}
          />
        ))}
      </div>
    );
  }

  if (motif === "glass") {
    return (
      <div aria-hidden="true" className="mx-auto flex items-center justify-center gap-2" style={{ color: main }}>
        <span className="inline-block" style={{ width: 22, height: 30, border: `2px solid ${trim}` }} />
        <span className="inline-block" style={{ width: 22, height: 30, border: `2px solid ${main}` }} />
        <span className="inline-block" style={{ width: 22, height: 30, border: `2px solid ${trim}` }} />
      </div>
    );
  }

  // Các motif còn lại vẽ bằng SVG cách điệu.
  const wing = "M60 34 C44 24 30 22 14 26 C28 16 44 12 58 20 C52 26 54 30 60 34 Z";
  const feather = "M60 36 C48 30 38 30 28 34 C40 36 52 38 60 38 Z";
  return (
    <svg aria-hidden="true" width={w} height={h} viewBox="0 0 120 44" fill="none" className="mx-auto block">
      {motif === "phoenix" && (
        <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={trim} fillOpacity="0.25">
          <path d={wing} />
          <g transform="translate(120,0) scale(-1,1)">
            <path d={wing} />
          </g>
          <path d={feather} stroke={trim} />
          <g transform="translate(120,0) scale(-1,1)">
            <path d={feather} stroke={trim} />
          </g>
          <circle cx="60" cy="8" r="3" fill={trim} stroke="none" />
        </g>
      )}
      {motif === "dragon-phoenix" && (
        <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={trim} fillOpacity="0.25">
          <path d={wing} />
          <g transform="translate(120,0) scale(-1,1)">
            <path d={wing} />
          </g>
          <path d="M10 40 C30 34 50 42 70 36 C90 30 105 38 112 34" stroke={trim} fill="none" />
        </g>
      )}
      {motif === "lotus" && (
        <g fill={main} opacity="0.9">
          <ellipse cx="60" cy="16" rx="9" ry="16" />
          <ellipse cx="42" cy="22" rx="8" ry="14" transform="rotate(-28 42 22)" opacity="0.75" />
          <ellipse cx="78" cy="22" rx="8" ry="14" transform="rotate(28 78 22)" opacity="0.75" />
          <ellipse cx="28" cy="30" rx="7" ry="11" transform="rotate(-48 28 30)" opacity="0.55" />
          <ellipse cx="92" cy="30" rx="7" ry="11" transform="rotate(48 92 30)" opacity="0.55" />
          <circle cx="60" cy="30" r="4" fill={trim} />
        </g>
      )}
      {motif === "rose" && (
        <g stroke={main} strokeWidth="2" fill="none" strokeLinecap="round">
          <circle cx="60" cy="22" r="14" />
          <circle cx="60" cy="22" r="8" />
          <circle cx="60" cy="22" r="3" fill={trim} stroke="none" />
          <path d="M46 34 C38 38 30 38 24 34" stroke={trim} />
          <path d="M74 34 C82 38 90 38 96 34" stroke={trim} />
        </g>
      )}
      {motif === "lavender" && (
        <g stroke={main} strokeWidth="2" strokeLinecap="round">
          <path d="M40 42 L40 12" />
          <path d="M80 42 L80 12" />
          {[16, 22, 28].map((y) => (
            <g key={y} fill={main} stroke="none">
              <circle cx="40" cy={y} r="4" />
              <circle cx="80" cy={y} r="4" />
            </g>
          ))}
          <circle cx="40" cy="8" r="3" fill={trim} stroke="none" />
          <circle cx="80" cy="8" r="3" fill={trim} stroke="none" />
        </g>
      )}
      {motif === "branch" && (
        <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={main} fillOpacity="0.7">
          <path d="M20 40 C40 30 80 30 100 14" fill="none" />
          <ellipse cx="45" cy="30" rx="10" ry="5" transform="rotate(-20 45 30)" />
          <ellipse cx="70" cy="24" rx="10" ry="5" transform="rotate(-15 70 24)" />
          <ellipse cx="90" cy="17" rx="8" ry="4" transform="rotate(-25 90 17)" />
        </g>
      )}
      {motif === "jasmine" && (
        <g fill={main}>
          {[30, 60, 90].map((cx) => (
            <g key={cx} opacity="0.9">
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={cx + 7 * Math.cos((a * Math.PI) / 180)} cy={22 + 7 * Math.sin((a * Math.PI) / 180)} r="4.5" />
              ))}
              <circle cx={cx} cy={22} r="3" fill={trim} />
            </g>
          ))}
        </g>
      )}
      {motif === "crown" && (
        <g>
          <path d="M30 32 L36 12 L48 24 L60 8 L72 24 L84 12 L90 32 Z" fill={trim} />
          <rect x="30" y="32" width="60" height="4" fill={main} />
          <circle cx="60" cy="20" r="3" fill={main} />
        </g>
      )}
      {motif === "wave" && (
        <g stroke={main} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M8 16 C24 8 40 24 56 16 C72 8 88 24 112 16" />
          <path d="M8 26 C24 18 40 34 56 26 C72 18 88 34 112 26" stroke={trim} />
          <path d="M8 36 C24 28 40 42 56 36 C72 28 88 42 112 36" opacity="0.6" />
        </g>
      )}
      {motif === "scroll" && (
        <g stroke={trim} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M60 34 C40 34 28 26 32 16 C35 8 48 10 48 18 C48 24 40 24 38 20" />
          <path d="M60 34 C80 34 92 26 88 16 C85 8 72 10 72 18 C72 24 80 24 82 20" />
          <circle cx="60" cy="38" r="2.5" fill={main} stroke="none" />
        </g>
      )}
    </svg>
  );
}
