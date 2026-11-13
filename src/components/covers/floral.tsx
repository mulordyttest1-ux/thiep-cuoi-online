// Cover vẽ bằng code cho nhóm hoa lá (kế hoạch cover 2026-11-13, hướng A).
// Ngôn ngữ chung đã chốt bằng demo Song Hỷ Đỏ: khung vàng kép toàn bìa
// + họa tiết góc + họa tiết chính ở giữa + đường kẻ vàng. Mỗi component
// render trực tiếp trong cover root (flex-col, justify-center): phần tử
// absolute (GoldFrame, CornerMarks) + 1 khối nội dung chính in-flow
// (motion.div với useCenterMotion) + CoverDivider in-flow. KHÔNG tự set
// background (nền do preset biến thể quyết).
// Màu: nền tối (dien-anh/le-nghi/le-hoi/anh-vang) → họa tiết trắng;
// nền sáng (hoa-bay/toi-gian) → màu tpl.palette.accent; gold làm viền.
"use client";

import { motion } from "framer-motion";
import type { EffectVariant } from "@/lib/templates";
import {
  CoverDivider,
  CoverProps,
  CornerMarks,
  GoldFrame,
  Medallion,
  useCenterMotion,
} from "./shared";

/** Nền tối theo preset biến thể (IntroCover dùng preset.darkBg). */
function isDarkBg(variant: EffectVariant): boolean {
  return variant === "dien-anh" || variant === "le-nghi" || variant === "le-hoi" || variant === "anh-vang";
}

/** Màu chính của họa tiết: trắng trên nền tối, accent của mẫu trên nền sáng. */
function mainColor(tpl: CoverProps["tpl"], variant: EffectVariant): string {
  return isDarkBg(variant) ? "#ffffff" : tpl.palette.accent;
}

/* ---------- Họa tiết góc nhỏ (~22px) ---------- */

function LeafMark({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <ellipse cx="11" cy="11" rx="9" ry="4.5" transform="rotate(-30 11 11)" fill={color} opacity="0.9" />
    </svg>
  );
}

function JasmineMark({ color, gold }: { color: string; gold: string }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={11 + 5.5 * Math.cos((a * Math.PI) / 180)} cy={11 + 5.5 * Math.sin((a * Math.PI) / 180)} r="3" fill={color} />
      ))}
      <circle cx="11" cy="11" r="2" fill={gold} />
    </svg>
  );
}

function LotusMark({ color, gold }: { color: string; gold: string }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <ellipse cx="11" cy="12" rx="6" ry="9" fill={color} opacity="0.9" />
      <circle cx="11" cy="14" r="2" fill={gold} />
    </svg>
  );
}

function RoseMark({ color, gold }: { color: string; gold: string }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="10" r="7" stroke={color} strokeWidth="1.8" />
      <circle cx="11" cy="10" r="3" stroke={color} strokeWidth="1.4" />
      <circle cx="11" cy="10" r="1.5" fill={gold} />
    </svg>
  );
}

function LavenderMark({ color, gold }: { color: string; gold: string }) {
  return (
    <svg aria-hidden="true" width="26" height="32" viewBox="0 0 26 32" fill="none">
      <path d="M13 31 L13 8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {[9, 14, 19, 24].map((y) => (
        <circle key={y} cx="13" cy={y} r="3.4" fill={color} />
      ))}
      <circle cx="13" cy="5" r="2.6" fill={gold} />
    </svg>
  );
}

/* ---------- Hoa Mộc: cành lá vẽ tay lớn ở giữa ---------- */

export function CoverBranch({ tpl, variant }: CoverProps) {
  const center = useCenterMotion(variant);
  const main = mainColor(tpl, variant);
  const gold = tpl.palette.gold;
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <LeafMark color={main} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {/* Tái dùng path cành + lá của TemplateMotif, phóng to 240px
            (viewBox 120x44 → 240x88), thêm 1 lá + nụ vàng ở đầu cành. */}
        <svg aria-hidden="true" width="240" height="88" viewBox="0 0 120 44" fill="none" className="block">
          <g stroke={main} strokeWidth="2" strokeLinecap="round" fill={main} fillOpacity="0.7">
            <path d="M20 40 C40 30 80 30 100 14" fill="none" />
            <ellipse cx="28" cy="36" rx="9" ry="4.5" transform="rotate(-30 28 36)" />
            <ellipse cx="45" cy="30" rx="10" ry="5" transform="rotate(-20 45 30)" />
            <ellipse cx="70" cy="24" rx="10" ry="5" transform="rotate(-15 70 24)" />
            <ellipse cx="90" cy="17" rx="8" ry="4" transform="rotate(-25 90 17)" />
          </g>
          <circle cx="100" cy="14" r="3" fill={gold} />
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/* ---------- Mai Lan Trắng: chùm 3 bông nhài lớn ở giữa ---------- */

export function CoverJasmine({ tpl, variant }: CoverProps) {
  const center = useCenterMotion(variant);
  const main = mainColor(tpl, variant);
  const gold = tpl.palette.gold;
  const dark = isDarkBg(variant);
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <JasmineMark color={main} gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {/* Tái dùng bố cục 3 bông của TemplateMotif, phóng to 240px.
            Cánh hoa luôn trắng (đúng màu nhài); nền sáng thì viền cánh
            màu accent để hoa không chìm vào nền kem, nền tối thì không
            cần viền. Thêm cành cong mảnh nối chùm hoa. */}
        <svg aria-hidden="true" width="240" height="88" viewBox="0 0 120 44" fill="none" className="block">
          <path d="M14 38 C40 32 80 32 106 38" stroke={main} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          {[30, 60, 90].map((cx) => (
            <g key={cx} opacity="0.95">
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={cx + 7 * Math.cos((a * Math.PI) / 180)}
                  cy={22 + 7 * Math.sin((a * Math.PI) / 180)}
                  r="4.5"
                  fill="#ffffff"
                  stroke={dark ? "none" : main}
                  strokeWidth="1"
                />
              ))}
              <circle cx={cx} cy={22} r="3" fill={gold} />
            </g>
          ))}
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/* ---------- Hoa Sen Hồng: bông sen lớn trong Medallion ---------- */

export function CoverLotus({ tpl, variant }: CoverProps) {
  const center = useCenterMotion(variant);
  const main = mainColor(tpl, variant);
  const gold = tpl.palette.gold;
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <LotusMark color={main} gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {/* Bông sen vẽ lại dạng quạt xòe (cao ~110px) để vừa vòng tròn
            Medallion 176px — motif gốc 120x44 quá bẹt, đặt trần sẽ lọt
            thỏm trong vòng tròn. Cánh giữa đậm nhất, cánh ngoài nhạt
            dần, viền gold mảnh, nhụy vàng ở gốc. */}
        <Medallion gold={gold}>
          <svg aria-hidden="true" width="140" height="112" viewBox="0 0 120 96" fill="none" className="block">
            <g stroke={gold} strokeWidth="1">
              <ellipse cx="26" cy="64" rx="10" ry="26" transform="rotate(-50 26 64)" fill={main} opacity="0.6" />
              <ellipse cx="94" cy="64" rx="10" ry="26" transform="rotate(50 94 64)" fill={main} opacity="0.6" />
              <ellipse cx="42" cy="52" rx="11" ry="32" transform="rotate(-25 42 52)" fill={main} opacity="0.85" />
              <ellipse cx="78" cy="52" rx="11" ry="32" transform="rotate(25 78 52)" fill={main} opacity="0.85" />
              <ellipse cx="60" cy="44" rx="13" ry="38" fill={main} />
            </g>
            <circle cx="60" cy="80" r="4.5" fill={gold} />
            <circle cx="52" cy="82" r="2" fill={gold} opacity="0.8" />
            <circle cx="68" cy="82" r="2" fill={gold} opacity="0.8" />
          </svg>
        </Medallion>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/* ---------- Vườn Hồng: khóm hồng lớn ở giữa ---------- */

export function CoverRose({ tpl, variant }: CoverProps) {
  const center = useCenterMotion(variant);
  const main = mainColor(tpl, variant);
  const gold = tpl.palette.gold;
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <RoseMark color={main} gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {/* Tái dùng vòng tròn đồng tâm của TemplateMotif, vẽ lại lớn hơn
            (viewBox vuông 120x120, bông ~190px): 3 vòng + nhụy vàng +
            2 cành cong vàng với lá ở dưới — thành khóm hồng, không phải
            1 bông lẻ. */}
        <svg aria-hidden="true" width="190" height="190" viewBox="0 0 120 120" fill="none" className="block">
          <g stroke={main} strokeWidth="2.5" fill="none" strokeLinecap="round">
            <circle cx="60" cy="52" r="40" />
            <circle cx="60" cy="52" r="27" />
            <circle cx="60" cy="52" r="14" />
            <path d="M38 84 C30 96 22 100 14 98" stroke={gold} strokeWidth="2" />
            <path d="M82 84 C90 96 98 100 106 98" stroke={gold} strokeWidth="2" />
          </g>
          <circle cx="60" cy="52" r="5" fill={gold} stroke="none" />
          <g fill={main} opacity="0.7">
            <ellipse cx="26" cy="96" rx="9" ry="4.5" transform="rotate(-30 26 96)" />
            <ellipse cx="94" cy="96" rx="9" ry="4.5" transform="rotate(30 94 96)" />
          </g>
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}

/* ---------- Lavender Tím: 2 cành lavender lớn song song ở giữa ---------- */

export function CoverLavender({ tpl, variant }: CoverProps) {
  const center = useCenterMotion(variant);
  const main = mainColor(tpl, variant);
  const gold = tpl.palette.gold;
  return (
    <>
      <GoldFrame gold={gold} />
      <CornerMarks>
        <LavenderMark color={main} gold={gold} />
      </CornerMarks>
      <motion.div {...center} className="relative z-10 flex flex-col items-center">
        {/* 3 cành lavender to, đậm (viewBox 140x250): thân 3.5px, hạt
            to r=6.5 xếp dọc nửa trên + hạt phụ 2 bên xen kẽ, ngọn vàng,
            2 lá lớn mỗi cành — trước đây chỉ 2 cành mảnh nên bìa trống. */}
        <svg aria-hidden="true" width="140" height="250" viewBox="0 0 140 250" fill="none" className="block">
          <g stroke={main} strokeWidth="3.5" strokeLinecap="round">
            <path d="M30 242 L30 34" />
            <path d="M70 242 L70 34" />
            <path d="M110 242 L110 34" />
          </g>
          <g fill={main} opacity="0.75">
            <ellipse cx="30" cy="192" rx="10" ry="5" transform="rotate(-25 30 192)" />
            <ellipse cx="70" cy="202" rx="10" ry="5" transform="rotate(25 70 202)" />
            <ellipse cx="110" cy="192" rx="10" ry="5" transform="rotate(-25 110 192)" />
            <ellipse cx="30" cy="212" rx="9" ry="4.5" transform="rotate(25 30 212)" />
            <ellipse cx="110" cy="212" rx="9" ry="4.5" transform="rotate(-25 110 212)" />
          </g>
          {[40, 56, 72, 88, 104, 120, 136].map((y, i) => (
            <g key={y} fill={main}>
              <circle cx="30" cy={y} r="6.5" />
              <circle cx="70" cy={y} r="6.5" />
              <circle cx="110" cy={y} r="6.5" />
              <circle cx={i % 2 === 0 ? 22 : 38} cy={y + 8} r="4" opacity="0.85" />
              <circle cx={i % 2 === 0 ? 62 : 78} cy={y + 8} r="4" opacity="0.85" />
              <circle cx={i % 2 === 0 ? 102 : 118} cy={y + 8} r="4" opacity="0.85" />
            </g>
          ))}
          <circle cx="30" cy="30" r="4.5" fill={gold} />
          <circle cx="70" cy="30" r="4.5" fill={gold} />
          <circle cx="110" cy="30" r="4.5" fill={gold} />
        </svg>
      </motion.div>
      <CoverDivider gold={gold} />
    </>
  );
}
