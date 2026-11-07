"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

export default function Header() {
  const { lang, setLang, dict } = useLanguage();
  const pathname = usePathname();
  // Trang khách (/thiep/[id]) là thiệp full-bleed như bản gốc: không thanh
  // điều hướng phía trên thiệp. Các trang còn lại giữ nguyên header.
  if (pathname?.startsWith("/thiep/")) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8dcc8] bg-[#fdf8f1]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Thiệp Đôi — trang chủ">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a1f2b] font-display text-xl text-[#c9a86a]" aria-hidden="true">
            ♥
          </span>
          <span className="leading-tight">
            <span className="block font-display text-2xl font-bold text-[#7a1f2b]">Thiệp Đôi</span>
            <span className="block max-w-[220px] text-[11px] text-[#7a6a68] sm:max-w-none">{dict.brandTagline}</span>
          </span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Điều hướng chính">
          <Link href="/" className="rounded-full px-3 py-2 text-sm hover:bg-[#f3e8d8]">{dict.navHome}</Link>
          <Link href="/mau-thiep" className="rounded-full px-3 py-2 text-sm hover:bg-[#f3e8d8]">{dict.navTemplates}</Link>
          <span className="ml-1 flex overflow-hidden rounded-full border border-[#c9a86a]" role="group" aria-label="Chọn ngôn ngữ giao diện">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`px-3 py-2 text-sm font-semibold ${lang === l ? "bg-[#c9a86a] text-white" : "bg-white text-[#7a1f2b]"}`}
              >
                {l === "vi" ? "VI" : "EN"}
              </button>
            ))}
          </span>
        </nav>
      </div>
    </header>
  );
}
