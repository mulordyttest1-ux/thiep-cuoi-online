// Layout khu vực làm việc của Nancy: Header + Footer + nav.
// Chỉ áp cho các trang trong route group (app) — KHÔNG áp cho link khách.
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
