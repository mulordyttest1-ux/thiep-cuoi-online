import { hashSeed, mulberry32 } from "./seeded";

export type TemplateStyle = "minimal" | "traditional" | "floral" | "luxury";

export type TemplateMotif =
  | "phoenix"
  | "double-happiness"
  | "dragon-phoenix"
  | "nhat-binh"
  | "lotus"
  | "rose"
  | "lavender"
  | "branch"
  | "jasmine"
  | "glass"
  | "marble"
  | "lace"
  | "crown"
  | "wave"
  | "scroll"
  | "none";

export type TemplateFrame = "single" | "double" | "triple" | "scallop" | "band";

export type TemplateFont = "display" | "sans" | "elegant" | "script";

export interface TemplatePalette {
  bg: string;
  card: string;
  accent: string;
  gold: string;
  text: string;
  muted: string;
}

export interface TemplateDecorationImages {
  phuongLine: string; // file ảnh phụng trang trí (Phuong line.webp)
  hoa: string; // họa tiết hoa ở góc và nền mờ
  phuongLeft: string; // Phụng Trái
  chuHy: string; // chữ Hỷ trong dải đỏ
  phuongRight: string; // Phụng Phải
}

// Bộ hiệu ứng của một mẫu — chọn từ thư viện src/components/effects (mỗi
// hiệu ứng nhận thông số riêng, xem specs/song-phung-do.md §4h). Mẫu nào
// không khai báo thì tự nhận một bộ khác nhau nhưng ổn định theo id
// (defaultEffectsFor) để mỗi mẫu trông hơi khác nhau mà không cần cấu hình.
export interface TemplateEffects {
  burst?: { count?: number; colors?: string[]; duration?: number; spread?: number };
  ambient?: { count?: number; speed?: number };
  shimmer?: { duration?: number; intensity?: "soft" | "strong" };
  kenBurns?: { duration?: number; scale?: number };
  reveal?: { strength?: "subtle" | "standard" };
  parallax?: { left?: number; right?: number; hoa?: number };
  progressBar?: boolean;
}

export interface Template {
  id: string;
  name: string;
  style: TemplateStyle;
  styleLabel: string;
  description: string;
  palette: TemplatePalette;
  pattern: string; // mô tả họa tiết, dùng để render bằng CSS
  photo: string;
  decorationImages?: TemplateDecorationImages; // ảnh trang trí gốc của mẫu, chỉ dùng khi có
  motif: TemplateMotif;
  frame: TemplateFrame;
  frameLabel: string;
  font: TemplateFont;
  envelope: string; // màu phong bì của mẫu
  paper: string; // tông giấy của mẫu
  effects?: TemplateEffects; // bộ hiệu ứng của mẫu (không có = tự sinh theo id)
}

export const STYLE_LABELS: Record<TemplateStyle, string> = {
  minimal: "Tối giản",
  traditional: "Truyền thống",
  floral: "Hoa lá",
  luxury: "Sang trọng",
};

export const TEMPLATE_FONT_CLASS: Record<TemplateFont, string> = {
  display: "font-display",
  sans: "font-sans",
  elegant: "font-elegant",
  script: "font-script",
};

export const TEMPLATE_FONT_LABEL: Record<TemplateFont, string> = {
  display: "Chữ serif trang trọng",
  sans: "Chữ sans gọn",
  elegant: "Chữ serif cao",
  script: "Chữ viết tay mềm",
};

export const PRESET_PHOTOS: { label: string; url: string }[] = [
  {
    label: "Ảnh cưới 1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Ảnh cưới 2",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Ảnh cưới 3",
    url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Ảnh cưới 4",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Ảnh cưới 5",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Ảnh cưới 6",
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80&auto=format&fit=crop",
  },
];

export const TEMPLATES: Template[] = [
  {
    id: "minimal-do-do",
    name: "Tối giản — Đỏ Đậm",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy kem, điểm nhấn đỏ đô, khung kép vàng mảnh và khoảng trắng rộng — sạch, sang, đọc rõ mọi thông tin, hợp mọi tiệc cưới hiện đại.",
    palette: { bg: "#fdf8f1", card: "#ffffff", accent: "#7a1f2b", gold: "#c9a86a", text: "#2b1a1d", muted: "#7a6a68" },
    pattern: "Khung kép vàng mảnh, không họa tiết rườm rà.",
    photo: PRESET_PHOTOS[0].url,
    motif: "none",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#7a1f2b",
    paper: "Giấy kem",
  },
  {
    id: "minimal-nau",
    name: "Tối giản — Nâu",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy kem trắng, tông nâu ấm, chữ sans gọn và khung đơn mảnh — gần gũi, hợp tiệc thân mật trong gia đình.",
    palette: { bg: "#faf6ef", card: "#ffffff", accent: "#6b4a2f", gold: "#c9a86a", text: "#2e241c", muted: "#7d6f60" },
    pattern: "Khung đơn mảnh, khoảng trắng rộng.",
    photo: PRESET_PHOTOS[1].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#6b4a2f",
    paper: "Giấy kem trắng",
  },
  {
    id: "minimal-lam-dam",
    name: "Tối giản — Lam Đậm",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy trắng xanh, lam đậm trầm tĩnh, chữ vàng gold nổi trên nền tối — hợp tiệc tối và không gian sang trọng.",
    palette: { bg: "#f2f4f7", card: "#ffffff", accent: "#1f3a5f", gold: "#c9a86a", text: "#1c2733", muted: "#5f6e7e" },
    pattern: "Viền lam đậm, chữ vàng gold nổi bật.",
    photo: PRESET_PHOTOS[2].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#1f3a5f",
    paper: "Giấy trắng xanh",
  },
  {
    id: "song-hy-do",
    name: "Song Hỷ — Đỏ",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem, chữ Song Hỷ đỏ son lớn ở đầu thiệp, khung kép viền vàng đồng — nét truyền thống rõ ràng, hợp lễ cưới gia đình.",
    palette: { bg: "#fdf3ec", card: "#fffaf5", accent: "#a31621", gold: "#d4af37", text: "#3d1414", muted: "#8a5a52" },
    pattern: "Chữ Song Hỷ lớn ở đầu thiệp, viền hoa văn cổ điển.",
    photo: PRESET_PHOTOS[3].url,
    motif: "double-happiness",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#a31621",
    paper: "Giấy kem",
  },
  {
    id: "song-hy-xanh",
    name: "Song Hỷ — Xanh",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy trắng, chữ Song Hỷ xanh ngọc, dải lá cách điệu hai bên thiệp — nhẹ và tươi, hợp tiệc trưa và tiệc ngoài trời.",
    palette: { bg: "#f0f7f4", card: "#ffffff", accent: "#1e6f5c", gold: "#c9a86a", text: "#1d2f2a", muted: "#5f7a72" },
    pattern: "Chữ Song Hỷ, dải hoa văn lá cách điệu.",
    photo: PRESET_PHOTOS[4].url,
    motif: "double-happiness",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "display",
    envelope: "#1e6f5c",
    paper: "Giấy trắng",
  },
  {
    id: "long-phung",
    name: "Long Phụng",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem ấm, rồng và phụng uốn lượn đối xứng bằng nét vàng, khung đỏ son — biểu tượng sum vầy, hợp lễ cưới lớn.",
    palette: { bg: "#fdf6ec", card: "#fffdf7", accent: "#8c1d18", gold: "#c9a86a", text: "#331512", muted: "#7d5a44" },
    pattern: "Họa tiết rồng phượng cách điệu bằng đường cong vàng gold.",
    photo: PRESET_PHOTOS[5].url,
    motif: "dragon-phoenix",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#8c1d18",
    paper: "Giấy kem ấm",
  },
  {
    id: "hoa-moc",
    name: "Hoa Mộc",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy kem xanh, cành lá vẽ tay ở bốn góc, chữ serif mềm — tự nhiên, hợp cưới sân vườn và tiệc chiều.",
    palette: { bg: "#f7f9f1", card: "#ffffff", accent: "#5a7a4f", gold: "#c9a86a", text: "#24301f", muted: "#6b7a64" },
    pattern: "Cành lá vẽ tay ở bốn góc thiệp.",
    photo: PRESET_PHOTOS[1].url,
    motif: "branch",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "elegant",
    envelope: "#5a7a4f",
    paper: "Giấy kem xanh",
  },
  {
    id: "mai-lan-trang",
    name: "Mai Lan Trắng",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy kem trắng, chùm hoa trắng ở góc, viền mảnh và chữ serif thanh — thanh khiết, trang nhã, hợp lễ sáng.",
    palette: { bg: "#fdfaf3", card: "#ffffff", accent: "#4a5d4e", gold: "#c9a86a", text: "#26302a", muted: "#6f7a72" },
    pattern: "Chùm hoa trắng ở góc, viền mảnh.",
    photo: PRESET_PHOTOS[2].url,
    motif: "jasmine",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "elegant",
    envelope: "#4a5d4e",
    paper: "Giấy kem trắng",
  },
  {
    id: "vuon-kinh",
    name: "Vườn Kính",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy trắng xanh, khung kính cách điệu, lá xanh bao quanh — sáng và thoáng, hợp cưới ngoài trời và nhà kính.",
    palette: { bg: "#f3f8f3", card: "#ffffff", accent: "#3e6b4f", gold: "#c9a86a", text: "#223528", muted: "#64796a" },
    pattern: "Khung kính cách điệu, lá xanh bao quanh.",
    photo: PRESET_PHOTOS[3].url,
    motif: "glass",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#3e6b4f",
    paper: "Giấy trắng xanh",
  },
  {
    id: "cam-thach-vang",
    name: "Cẩm Thạch Vàng",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy kem, vân cẩm thạch ánh vàng, khung kép và chữ serif cao — sang trọng, hợp tiệc khách sạn và lễ tối.",
    palette: { bg: "#faf7f0", card: "#fffefb", accent: "#7a1f2b", gold: "#c9a86a", text: "#2b2120", muted: "#7a6f63" },
    pattern: "Vân đá cẩm thạch bằng gradient vàng nhạt.",
    photo: PRESET_PHOTOS[4].url,
    motif: "marble",
    frame: "double",
    frameLabel: "Khung kép",
    font: "elegant",
    envelope: "#7a1f2b",
    paper: "Giấy kem",
  },
  {
    id: "baroque",
    name: "Baroque",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy vàng nhạt, hoa văn uốn lượn đối xứng, khung vàng nhiều lớp và chữ serif cao — cổ điển, lộng lẫy, hợp tiệc lớn.",
    palette: { bg: "#f7f1e3", card: "#fffdf6", accent: "#5c3d1a", gold: "#c9a86a", text: "#2c2114", muted: "#7a6a52" },
    pattern: "Hoa văn uốn lượn đối xứng, khung vàng nhiều lớp.",
    photo: PRESET_PHOTOS[5].url,
    motif: "scroll",
    frame: "triple",
    frameLabel: "Khung ba lớp",
    font: "elegant",
    envelope: "#5c3d1a",
    paper: "Giấy vàng nhạt",
  },
  {
    id: "ren-theu",
    name: "Ren Thêu",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy kem trắng, viền ren chấm bi và đường cong mềm, chữ serif thanh — dịu dàng, hợp lễ cưới cổ điển và tiệc sáng.",
    palette: { bg: "#fdf8f1", card: "#ffffff", accent: "#8a5a6b", gold: "#c9a86a", text: "#33242a", muted: "#7d6d72" },
    pattern: "Viền ren chấm bi và đường cong mềm.",
    photo: PRESET_PHOTOS[0].url,
    motif: "lace",
    frame: "scallop",
    frameLabel: "Viền cong mềm",
    font: "elegant",
    envelope: "#8a5a6b",
    paper: "Giấy kem trắng",
  },
  {
    id: "song-phung-do",
    name: "Song Phụng Đỏ",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem #f9ede3, tên serif mảnh in hoa 2 dòng không dấu &, dải đỏ đậm #710001 ngang hết chiều rộng với chữ Hỷ kem lớn lệch lên trên và phụng lớn 2 bên, hoa lớn góc dưới phải — trang trọng, hợp lễ cưới truyền thống và lễ vu quy.",
    palette: { bg: "#f9ede3", card: "#fff0e7", accent: "#710001", gold: "#c9a86a", text: "#3a1410", muted: "#8a5a4a" },
    pattern: "Phụng lớn 2 bên ôm lấy phần chính, tên serif mảnh in hoa 2 dòng không dấu &, dải đỏ đậm ngang hết chiều rộng không viền vàng với chữ Hỷ kem lớn lệch lên trên, hoa lớn góc dưới phải.",
    photo: PRESET_PHOTOS[3].url,
    motif: "phoenix",
    frame: "single",
    frameLabel: "Viền mỏng đơn",
    font: "elegant",
    envelope: "#710001",
    paper: "Giấy kem",
    // Bộ hiệu ứng đầy đủ của thư viện (spec §4h): vụ nổ vàng khi mở phong
    // bì, lấp lánh vàng, Hỷ/con dấu phát sáng, Ken Burns album, cross-dissolve
    // khi cuộn, parallax phụng/hoa, thanh tiến trình.
    // Giai đoạn A (2026-11-06): hiệu ứng đậm hơn theo đo độ rõ + nghiên cứu
    // trang chuyên nghiệp — nổ lớn hơn, Ken Burns nhanh hơn, parallax nhanh
    // hơn một chút. Bụi tròn cũ (2026-11-06) thay bằng lấp lánh shadcn
    // Sparkles: bụi mịn + điểm sáng + tia 4 cánh, vì hạt tròn 10–20px nhìn
    // như vết bẩn trên giấy kem.
    effects: {
      burst: { count: 60, duration: 1.4, spread: 280 },
      ambient: { count: 16 },
      shimmer: { duration: 2, intensity: "strong" },
      kenBurns: { duration: 5, scale: 1.2 },
      reveal: { strength: "standard" },
      parallax: { left: -0.15, right: 0.12, hoa: 0.08 },
      progressBar: true,
    },
    // Same-origin proxy URLs (see src/app/api/songphung/[file]/route.ts).
    // Original source URLs, kept here for reference:
    // https://chungdoi.com/images/themes/songphung-red/Phuong%20line.webp
    // https://chungdoi.com/images/themes/songphung-red/HOA.webp
    // https://chungdoi.com/images/themes/songphung-red/Phuong%202.webp
    // https://chungdoi.com/images/themes/songphung-red/CHU%20HY.webp
    // https://chungdoi.com/images/themes/songphung-red/Phuong.webp
    decorationImages: {
      phuongLine: "/api/songphung/Phuong%20line.webp",
      hoa: "/api/songphung/HOA.webp",
      phuongLeft: "/api/songphung/Phuong%202.webp",
      chuHy: "/api/songphung/CHU%20HY.webp",
      phuongRight: "/api/songphung/Phuong.webp",
    },
  },
  {
    id: "song-phung-hong",
    name: "Song Phụng Hồng",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy hồng phấn, đôi phụng hồng nhạt đối xứng, viền cong mềm và chữ serif cao — mềm mại, hợp tiệc cưới lãng mạn mà vẫn giữ nét truyền thống.",
    palette: { bg: "#fdf2f4", card: "#fffafb", accent: "#a63d57", gold: "#d4a373", text: "#3d1f26", muted: "#8a6670" },
    pattern: "Đôi phụng hồng nhạt, viền hoa văn tròn mềm.",
    photo: PRESET_PHOTOS[4].url,
    motif: "phoenix",
    frame: "scallop",
    frameLabel: "Viền cong mềm",
    font: "elegant",
    envelope: "#a63d57",
    paper: "Giấy hồng phấn",
  },
  {
    id: "nhat-binh-do",
    name: "Nhật Bình Đỏ",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem, dải hoa văn cung đình đỏ son chạy dọc viền thiệp, chữ serif trang trọng, phong bì nâu — gợi áo Nhật Bình xưa, trang trọng và đậm bản sắc Việt.",
    palette: { bg: "#fbf3e4", card: "#fffdf5", accent: "#b91c1c", gold: "#d4af37", text: "#2f1710", muted: "#7d5a44" },
    pattern: "Dải hoa văn Nhật Bình đỏ son chạy dọc viền thiệp.",
    photo: PRESET_PHOTOS[0].url,
    motif: "nhat-binh",
    frame: "band",
    frameLabel: "Dải hoa văn viền",
    font: "display",
    envelope: "#7c4a21",
    paper: "Giấy kem",
  },
  {
    id: "nhat-binh-xanh-ngoc",
    name: "Nhật Bình Xanh Ngọc",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem nhạt, hoa văn cung đình xanh ngọc chạy dọc viền, khung đơn mảnh — mát, trang nhã, hợp tiệc trưa và tiệc ngoài trời.",
    palette: { bg: "#eef7f4", card: "#ffffff", accent: "#0f766e", gold: "#94b8a6", text: "#17332e", muted: "#5f7a72" },
    pattern: "Hoa văn Nhật Bình xanh ngọc, khung đơn mảnh.",
    photo: PRESET_PHOTOS[1].url,
    motif: "nhat-binh",
    frame: "band",
    frameLabel: "Dải hoa văn viền",
    font: "display",
    envelope: "#0f766e",
    paper: "Giấy kem nhạt",
  },
  {
    id: "song-hy-vang",
    name: "Song Hỷ Vàng",
    style: "traditional",
    styleLabel: "Truyền thống",
    description: "Giấy kem vàng, chữ Song Hỷ vàng đồng lớn ở đầu thiệp, khung kép mảnh — ấm, sang, hợp tiệc tối.",
    palette: { bg: "#fdf8e7", card: "#fffdf0", accent: "#92600a", gold: "#d4af37", text: "#33270f", muted: "#7a6a44" },
    pattern: "Chữ Song Hỷ vàng đồng lớn, khung đôi mảnh.",
    photo: PRESET_PHOTOS[5].url,
    motif: "double-happiness",
    frame: "double",
    frameLabel: "Khung kép",
    font: "elegant",
    envelope: "#92600a",
    paper: "Giấy kem vàng",
  },
  {
    id: "minimal-den-trang",
    name: "Tối giản — Đen Trắng",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy trắng, chỉ hai màu đen và trắng, khung đơn đen mảnh, khoảng trắng rộng — hiện đại, rõ ràng, hợp cưới phong cách thành thị.",
    palette: { bg: "#f5f5f4", card: "#ffffff", accent: "#1c1917", gold: "#a8a29e", text: "#1c1917", muted: "#78716c" },
    pattern: "Khung đơn đen mảnh, không họa tiết, khoảng trắng rộng.",
    photo: PRESET_PHOTOS[2].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#1c1917",
    paper: "Giấy trắng",
  },
  {
    id: "minimal-hong-phan",
    name: "Tối giản — Hồng Phấn",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy hồng phấn nhạt, chữ sans mảnh, khoảng trắng rộng, khung đơn mềm — nhẹ nhàng, hợp tiệc cưới nhỏ và lãng mạn.",
    palette: { bg: "#fdf2f5", card: "#ffffff", accent: "#be5a7a", gold: "#e8b4b8", text: "#3d2230", muted: "#8a6a74" },
    pattern: "Hồng phấn nhạt, khoảng trắng rộng, không họa tiết rườm rà.",
    photo: PRESET_PHOTOS[3].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#be5a7a",
    paper: "Giấy hồng phấn",
  },
  {
    id: "minimal-xanh-reu",
    name: "Tối giản — Xanh Rêu",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy trắng xanh rêu trầm, chữ sans gọn, viền đơn mảnh, bố cục tối giản — trầm, hợp tiệc chiều ngoài trời.",
    palette: { bg: "#f2f5ef", card: "#ffffff", accent: "#4d5e43", gold: "#b5a67c", text: "#26301f", muted: "#6b7a64" },
    pattern: "Xanh rêu trầm, viền đơn mảnh, bố cục tối giản.",
    photo: PRESET_PHOTOS[4].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#4d5e43",
    paper: "Giấy trắng xanh rêu",
  },
  {
    id: "minimal-kem-vang",
    name: "Tối giản — Kem Vàng",
    style: "minimal",
    styleLabel: "Tối giản",
    description: "Giấy kem vàng, chữ serif ấm, khung kép mảnh — ấm áp, dễ đọc, hợp tiệc gia đình.",
    palette: { bg: "#fdf9ec", card: "#fffef8", accent: "#8a6d1f", gold: "#d4af37", text: "#332b12", muted: "#7a6f52" },
    pattern: "Kem — vàng nhạt, khung kép mảnh, chữ serif.",
    photo: PRESET_PHOTOS[5].url,
    motif: "none",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#8a6d1f",
    paper: "Giấy kem vàng",
  },
  {
    id: "hoa-sen-hong",
    name: "Hoa Sen Hồng",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy hồng phấn, bông sen hồng cách điệu ở góc, viền cong mềm và chữ viết tay mềm — thanh thoát, rất Việt, hợp tiệc trưa.",
    palette: { bg: "#fdf2f6", card: "#fffafc", accent: "#a63d6b", gold: "#e5b8c8", text: "#3d1f2e", muted: "#8a667a" },
    pattern: "Bông sen hồng cách điệu ở góc, viền cong mềm.",
    photo: PRESET_PHOTOS[1].url,
    motif: "lotus",
    frame: "scallop",
    frameLabel: "Viền cong mềm",
    font: "script",
    envelope: "#a63d6b",
    paper: "Giấy hồng phấn",
  },
  {
    id: "vuon-hong",
    name: "Vườn Hồng",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy hồng nhạt, khóm hồng bao quanh khung, viền cong và chữ viết tay mềm — lãng mạn, tươi, hợp tiệc vườn chiều.",
    palette: { bg: "#fdf1f1", card: "#fffafa", accent: "#9d3a4a", gold: "#d8a08a", text: "#3a1a1e", muted: "#8a5f62" },
    pattern: "Khóm hồng đỏ nhạt bao quanh khung thiệp.",
    photo: PRESET_PHOTOS[0].url,
    motif: "rose",
    frame: "scallop",
    frameLabel: "Viền cong mềm",
    font: "script",
    envelope: "#9d3a4a",
    paper: "Giấy hồng nhạt",
  },
  {
    id: "lavender-tim",
    name: "Lavender Tím",
    style: "floral",
    styleLabel: "Hoa lá",
    description: "Giấy tím nhạt, nhánh lavender chạy dọc hai bên, chữ viết tay mềm — mơ màng, hợp tiệc chiều và cưới phong cách châu Âu.",
    palette: { bg: "#f5f1fa", card: "#fffdfd", accent: "#6d5a9e", gold: "#c4b5d6", text: "#2d2440", muted: "#6f6a80" },
    pattern: "Nhánh lavender tím nhạt chạy dọc hai bên thiệp.",
    photo: PRESET_PHOTOS[2].url,
    motif: "lavender",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "script",
    envelope: "#6d5a9e",
    paper: "Giấy tím nhạt",
  },
  {
    id: "hoang-gia-vang",
    name: "Hoàng Gia Vàng",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy vàng nhạt, vương miện cách điệu ở đầu thiệp, khung vàng nhiều lớp và chữ serif cao — lộng lẫy, hợp tiệc lớn và lễ tối.",
    palette: { bg: "#f9f1dc", card: "#fffdf2", accent: "#6b4e0a", gold: "#d4af37", text: "#2c2110", muted: "#7a6a48" },
    pattern: "Khung vàng nhiều lớp, họa tiết vương miện cách điệu.",
    photo: PRESET_PHOTOS[5].url,
    motif: "crown",
    frame: "triple",
    frameLabel: "Khung ba lớp",
    font: "elegant",
    envelope: "#6b4e0a",
    paper: "Giấy vàng nhạt",
  },
  {
    id: "cam-thach-hong",
    name: "Cẩm Thạch Hồng",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy hồng nhạt, vân cẩm thạch hồng mềm, khung kép và chữ serif — mềm mại mà sang, hợp tiệc tối và tiệc khách sạn.",
    palette: { bg: "#fdf3f3", card: "#fffafa", accent: "#7a2e3f", gold: "#e0a8a8", text: "#331d22", muted: "#7d5f64" },
    pattern: "Vân cẩm thạch hồng nhạt bằng gradient mềm.",
    photo: PRESET_PHOTOS[4].url,
    motif: "marble",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#7a2e3f",
    paper: "Giấy hồng nhạt",
  },
  {
    id: "hien-dai-be",
    name: "Hiện Đại — Be",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy be trơn, đường kẻ vàng mảnh, chữ sans sạch — hiện đại, tinh tế, hợp cưới thành thị.",
    palette: { bg: "#f7f3ec", card: "#ffffff", accent: "#5b4a35", gold: "#cbb896", text: "#2b241c", muted: "#7a6f60" },
    pattern: "Be trơn, đường kẻ vàng mảnh, bố cục hiện đại.",
    photo: PRESET_PHOTOS[1].url,
    motif: "none",
    frame: "single",
    frameLabel: "Khung đơn mảnh",
    font: "sans",
    envelope: "#5b4a35",
    paper: "Giấy be",
  },
  {
    id: "bien-xanh",
    name: "Biển Xanh",
    style: "luxury",
    styleLabel: "Sang trọng",
    description: "Giấy trắng xanh biển, sóng cách điệu xanh — vàng, khung kép và chữ serif — hợp cưới bên biển và tiệc tối.",
    palette: { bg: "#eef4f7", card: "#ffffff", accent: "#155e75", gold: "#c9a86a", text: "#122e3a", muted: "#5f7a86" },
    pattern: "Sóng biển cách điệu bằng đường cong xanh — vàng.",
    photo: PRESET_PHOTOS[3].url,
    motif: "wave",
    frame: "double",
    frameLabel: "Khung kép",
    font: "display",
    envelope: "#155e75",
    paper: "Giấy trắng xanh biển",
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// Bộ hiệu ứng mặc định cho mẫu không khai báo effects: sinh từ hash của id
// nên mỗi mẫu nhận một combo khác nhau (mật độ bụi, có/không shimmer, độ
// mạnh reveal, tốc độ parallax, thời lượng Ken Burns...) nhưng ỔN ĐỊNH —
// cùng một mẫu luôn ra cùng một bộ, không xáo lại mỗi lần render.
export function defaultEffectsFor(id: string): TemplateEffects {
  const rand = mulberry32(hashSeed(id));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  return {
    burst: { count: 20 + Math.floor(rand() * 12), duration: 0.8 + rand() * 0.3 },
    ambient: rand() < 0.6 ? { count: 8 + Math.floor(rand() * 8) } : undefined,
    shimmer: rand() < 0.5 ? { duration: 2.6 + rand() * 1.4, intensity: pick(["soft", "strong"] as const) } : undefined,
    kenBurns: { duration: 7 + rand() * 4, scale: 1.08 + rand() * 0.06 },
    reveal: { strength: pick(["subtle", "standard"] as const) },
    parallax: { left: -(0.1 + rand() * 0.08), right: 0.05 + rand() * 0.05, hoa: 0.03 + rand() * 0.04 },
    progressBar: rand() < 0.8,
  };
}

// Bộ hiệu ứng thực tế của một mẫu: dùng effects khai báo sẵn, nếu không có
// thì sinh mặc định theo id.
export function getTemplateEffects(id: string): TemplateEffects {
  const t = getTemplate(id);
  return t.effects ?? defaultEffectsFor(id);
}
