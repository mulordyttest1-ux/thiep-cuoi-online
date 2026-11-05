"use client";

import type { Guest } from "@/lib/types";

export default function GuestTable({
  guests,
  invitationId,
  onEdit,
  onDelete,
  onCopyLink,
}: {
  guests: Guest[];
  invitationId: string;
  onEdit: (g: Guest) => void;
  onDelete: (id: string) => void;
  onCopyLink: (g: Guest) => void;
}) {
  if (guests.length === 0) {
    return <p className="rounded-2xl border bg-white p-6 text-center text-sm text-[#7a6a68]">Chưa có khách nào khớp với bộ lọc. Hãy thêm khách mới.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-[#f7efe2]">
          <tr>
            <th scope="col" className="px-4 py-3">Tên khách</th>
            <th scope="col" className="px-4 py-3">Nhóm</th>
            <th scope="col" className="px-4 py-3">Phía</th>
            <th scope="col" className="px-4 py-3">SĐT</th>
            <th scope="col" className="px-4 py-3">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id} className="border-t">
              <td className="px-4 py-3 font-semibold">
                {g.name}
                {g.isDemo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-normal text-amber-800">demo</span>}
                {g.note && <span className="block text-xs font-normal text-[#7a6a68]">{g.note}</span>}
              </td>
              <td className="px-4 py-3">{g.group || "—"}</td>
              <td className="px-4 py-3">{g.side === "trai" ? "Nhà trai" : "Nhà gái"}</td>
              <td className="px-4 py-3">{g.phone || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => onCopyLink(g)} className="rounded-full border px-2 py-1 text-xs font-semibold" title={`Link riêng: /thiep/${invitationId}?guest=${encodeURIComponent(g.name)}`}>
                    Sao chép link riêng
                  </button>
                  <button type="button" onClick={() => onEdit(g)} className="rounded-full border px-2 py-1 text-xs font-semibold">Sửa</button>
                  <button type="button" onClick={() => { if (window.confirm(`Xóa khách “${g.name}”?`)) onDelete(g.id); }} className="rounded-full border border-red-200 px-2 py-1 text-xs font-semibold text-red-700">
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
