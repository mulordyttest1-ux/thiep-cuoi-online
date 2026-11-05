import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro, Cormorant_Garamond, Dancing_Script, EB_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";

const playfair = Playfair_Display({ subsets: ["vietnamese", "latin"], variable: "--font-display", display: "swap" });
const beVietnam = Be_Vietnam_Pro({ subsets: ["vietnamese", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const elegant = Cormorant_Garamond({ subsets: ["vietnamese", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-elegant", display: "swap" });
const scriptFont = Dancing_Script({ subsets: ["vietnamese", "latin"], weight: ["500", "600", "700"], variable: "--font-script", display: "swap" });
// Tên lớn trong khối THÔNG TIN LỄ CƯỚI của bản gốc dùng EB Garamond
// (trích code gốc vòng 10, không phải Playfair như QA vòng 9 đoán).
// Vòng 14: thêm style italic thật (nhãn timeline nghiêng serif) —
// không có style này trình duyệt chỉ giả nghiêng bằng oblique.
const ebGaramond = EB_Garamond({ subsets: ["vietnamese", "latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-eb-garamond", display: "swap" });

export const metadata: Metadata = {
  title: "Thiệp Đôi — Thiệp cưới online, một tấm thiệp cho ngày trọng đại",
  description:
    "Tạo thiệp cưới online: chọn mẫu, điền thông tin cặp đôi, quản lý khách mời, chia sẻ link riêng cho từng khách, album ảnh, lịch trình và QR mừng cưới VietQR.",
  openGraph: {
    title: "Thiệp Đôi — Thiệp cưới online",
    description: "Tạo thiệp cưới online, chia sẻ link riêng cho từng khách, kèm album ảnh, lịch trình và QR mừng cưới.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${playfair.variable} ${beVietnam.variable} ${elegant.variable} ${scriptFont.variable} ${ebGaramond.variable} bg-[#fdf8f1] font-sans text-[#2b1a1d] antialiased`}>
        <LanguageProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
