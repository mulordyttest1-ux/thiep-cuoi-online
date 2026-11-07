// Layout link cho khách: CHỈ có đúng tấm thiệp — không Header, không
// Footer, không nav, không khu vực làm việc của Nancy. Khách mở link
// /mau/<id> chỉ thấy thiệp + ô sửa hiện bên dưới khi bấm vào chữ.
export default function KhachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
