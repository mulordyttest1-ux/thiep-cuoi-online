// Kho mẫu thiệp SVG — truy cập lưu trữ qua MỘT interface này để sau này
// thay backend (Supabase Storage) không phải sửa UI.
//
// Giai đoạn 1: IndexedDB (trình duyệt, không cần thêm dependency). LƯU Ý:
// IndexedDB chỉ có trên từng máy — link cho khách mở trên máy khác KHÔNG
// thấy được mẫu đã tải, trừ khi link kèm SVG nhúng (xem inlineSvgIfSmall
// trong svg-template.ts). Muốn link mở được mọi máy thì cần kho chứa online
// (Supabase Storage — việc riêng, chưa làm).
import type { SvgTemplateData } from "./svg-template";

export interface SvgTemplateStore {
  list(): Promise<SvgTemplateData[]>;
  get(id: string): Promise<SvgTemplateData | null>;
  save(tpl: SvgTemplateData): Promise<void>;
  remove(id: string): Promise<void>;
}

export const SVG_STORAGE_KIND = "indexeddb" as const;

const DB_NAME = "thiep-doi";
const STORE_NAME = "svg-templates";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Trình duyệt này không hỗ trợ IndexedDB."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Không mở được kho mẫu."));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE_NAME, mode);
        const req = run(t.objectStore(STORE_NAME));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Lỗi kho mẫu."));
        t.oncomplete = () => db.close();
        t.onerror = () => db.close();
      })
  );
}

export const svgTemplateStore: SvgTemplateStore = {
  async list(): Promise<SvgTemplateData[]> {
    const all = await tx("readonly", (s) => s.getAll());
    return (all as SvgTemplateData[]).sort((a, b) => b.createdAt - a.createdAt);
  },
  async get(id: string): Promise<SvgTemplateData | null> {
    const one = await tx("readonly", (s) => s.get(id));
    return (one as SvgTemplateData | undefined) ?? null;
  },
  async save(tpl: SvgTemplateData): Promise<void> {
    await tx("readwrite", (s) => s.put(tpl));
  },
  async remove(id: string): Promise<void> {
    await tx("readwrite", (s) => s.delete(id));
  },
};
