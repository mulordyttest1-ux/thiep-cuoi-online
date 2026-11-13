// Registry cover theo motif (kế hoạch cover 2026-11-13).
// Mỗi motif có 1 component cover riêng trong src/components/covers/;
// thêm motif mới = thêm 1 component + 1 dòng ở đây. Motif nào chưa có
// component thì rơi về CoverMinimal (khung + điểm nhấn nhỏ).
"use client";

import type { ComponentType } from "react";
import type { TemplateMotif } from "@/lib/templates";
import type { CoverProps } from "./shared";
import { CoverDoubleHappiness, CoverPhoenix, CoverDragonPhoenix, CoverNhatBinh } from "./traditional";
import { CoverBranch, CoverJasmine, CoverLotus, CoverRose, CoverLavender } from "./floral";
import { CoverMarble, CoverScroll, CoverLace, CoverGlass, CoverCrown, CoverWave } from "./luxury";
import { CoverMinimal } from "./minimal";

export const COVER_BY_MOTIF: Record<TemplateMotif, ComponentType<CoverProps>> = {
  "double-happiness": CoverDoubleHappiness,
  phoenix: CoverPhoenix,
  "dragon-phoenix": CoverDragonPhoenix,
  "nhat-binh": CoverNhatBinh,
  branch: CoverBranch,
  jasmine: CoverJasmine,
  lotus: CoverLotus,
  rose: CoverRose,
  lavender: CoverLavender,
  marble: CoverMarble,
  scroll: CoverScroll,
  lace: CoverLace,
  glass: CoverGlass,
  crown: CoverCrown,
  wave: CoverWave,
  none: CoverMinimal,
};

export function resolveCoverComponent(motif: TemplateMotif): ComponentType<CoverProps> {
  return COVER_BY_MOTIF[motif] ?? CoverMinimal;
}
