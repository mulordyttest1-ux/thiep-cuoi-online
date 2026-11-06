// Chuyển đổi ngày dương → ghi chú âm lịch, theo đúng công thức bản gốc
// (module 43378 `Yk`, dùng thư viện `lunar-javascript` — cùng thư viện bản gốc
// dùng: `Solar.fromYmd(y, m, d).getLunar()`). ĐÃ KIỂM CHỨNG bằng node với 2
// ngày Tết đã biết: 2026-02-17 → "Tức ngày 1 tháng 1 năm Bính Ngọ" (đúng),
// 2025-01-29 → "Tức ngày 1 tháng 1 năm Ất Tỵ" (đúng); 2026-05-03 (ngày demo
// gốc) → "Tức ngày 17 tháng 3 năm Bính Ngọ".
import { Solar } from "lunar-javascript";

const STEMS: Record<string, string> = {
  "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu",
  "己": "Kỷ", "庚": "Canh", "辛": "Tân", "壬": "Nhâm", "癸": "Quý",
};
const BRANCHES: Record<string, string> = {
  "子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ",
  "午": "Ngọ", "未": "Mùi", "申": "Thân", "酉": "Dậu", "戌": "Tuất", "亥": "Hợi",
};

export interface DateParts {
  weekday: string; // "Chủ Nhật" (Intl vi-VN, weekday long)
  day: string; // "03" — 2 chữ số
  monthDisplay: string; // "THÁNG 05"
  year: string; // "2026"
  lunarNote: string | null; // "Tức ngày 17 tháng 3 năm Bính Ngọ"
}

export interface LunarParts {
  day: number; // ngày âm
  month: number; // tháng âm (âm = tháng nhuận)
  yearName: string; // tên năm can chi, VD "Bính Ngọ"
}

/** Âm lịch của một ngày dương (dùng chung cho ghi chú + xuất CEP). */
function toLunar(year: number, month: number, day: number): LunarParts | null {
  try {
    const lunar = Solar.fromYmd(year, month, day).getLunar();
    const ganZhi = lunar.getYearInGanZhi();
    return {
      day: lunar.getDay(),
      month: lunar.getMonth(),
      yearName: `${STEMS[ganZhi[0]] ?? ganZhi[0]} ${BRANCHES[ganZhi[1]] ?? ganZhi[1]}`,
    };
  } catch {
    return null;
  }
}

/** Ngày/tháng/năm âm + tên năm can chi của một ngày dương, hoặc null khi
    ngày không hợp lệ. */
export function getLunarParts(dateStr: string): LunarParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return toLunar(year, month, day);
}

export function getDateParts(dateStr: string): DateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(d);
  const lunar = toLunar(year, month, day);
  const lunarNote = lunar
    ? `Tức ngày ${lunar.day} tháng ${Math.abs(lunar.month)}${lunar.month < 0 ? " nhuận" : ""} năm ${lunar.yearName}`
    : null;
  return {
    weekday,
    day: String(day).padStart(2, "0"),
    monthDisplay: `THÁNG ${String(month).padStart(2, "0")}`,
    year: String(year),
    lunarNote,
  };
}
