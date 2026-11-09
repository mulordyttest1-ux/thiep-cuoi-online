"use client";

import { useMemo, useState } from "react";
import { STYLE_LABELS, TEMPLATES, type TemplateStyle } from "@/lib/templates";
import TemplateCard from "@/components/TemplateCard";

type Filter = "all" | TemplateStyle;

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const okStyle = filter === "all" || t.style === filter;
      const okQuery = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return okStyle && okQuery;
    });
  }, [filter, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-[#7a1f2b]">Thư viện mẫu thiệp</h1>
      <p className="mt-2 text-[#5a4a48]">
        Mỗi mẫu trong {TEMPLATES.length} mẫu có tông giấy, màu chủ đạo, khung, họa tiết và kiểu chữ riêng, vẽ bằng CSS/SVG trong dự án.
        Đổi mẫu sau này không làm mất dữ liệu đã nhập.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="tpl-search" className="sr-only">Tìm kiếm mẫu thiệp</label>
        <input
          id="tpl-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mẫu: VD “đỏ”, “hoa”, “sang trọng”…"
          className="min-w-[220px] flex-1 rounded-full border px-4 py-2.5 sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo phong cách">
          {(["all", "minimal", "traditional", "floral", "luxury"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === f ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}
            >
              {f === "all" ? "Tất cả" : STYLE_LABELS[f as TemplateStyle]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-[#7a6a68]" role="status">
        {filtered.length === 0 ? "Không tìm thấy mẫu nào khớp. Hãy thử từ khóa khác." : `Đang hiển thị ${filtered.length} mẫu.`}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} />
        ))}
      </div>
    </div>
  );
}
