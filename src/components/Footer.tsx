"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // Trang khách (/thiep/[id]) chỉ còn thiệp như bản gốc: ẩn footer của trang
  // web (như Header đã ẩn từ vòng 8). Các trang còn lại giữ nguyên footer.
  if (pathname?.startsWith("/thiep/")) return null;
  return (
    <footer className="mt-16 border-t border-[#e8dcc8] bg-[#f7efe2] py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold text-[#7a1f2b]">Thiệp Đôi</p>
          <p className="mt-2 text-sm text-[#7a6a68]">
            Thiệp cưới online cho ngày trọng đại: chọn mẫu, điền thông tin, chia sẻ link riêng
            cho từng khách trong một trang thiệp duy nhất.
          </p>
        </div>
        <nav aria-label="Liên kết footer">
          <p className="font-semibold text-[#7a1f2b]">Khám phá</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link className="hover:underline" href="/mau-thiep">Mẫu thiệp</Link></li>
            <li><Link className="hover:underline" href="/thiep/demo">Xem thiệp demo</Link></li>
            <li><Link className="hover:underline" href="/thu-vien">Thư viện hiệu ứng</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-semibold text-[#7a1f2b]">Lưu ý</p>
          <p className="mt-2 text-sm text-[#7a6a68]">
            Dữ liệu lưu trên trình duyệt của bạn (localStorage). Link chia sẻ kèm dữ liệu trong
            tham số ?d= để mở được trên máy khác.
          </p>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-[#7a6a68]">© 2026 Thiệp Đôi.</p>
    </footer>
  );
}
