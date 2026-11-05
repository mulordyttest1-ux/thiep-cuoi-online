// Khai báo kiểu tối thiểu cho `lunar-javascript` (thư viện không kèm types).
// Chỉ khai báo đúng các API mà src/lib/lunar.ts dùng.
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }
  export class Lunar {
    getYearInGanZhi(): string;
    getMonth(): number;
    getDay(): number;
  }
}
