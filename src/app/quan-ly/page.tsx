"use client";

import { useEffect, useMemo, useState } from "react";
import type { Guest } from "@/lib/types";
import { newId } from "@/lib/types";
import {
  clearDemoGuests,
  copyText,
  loadInvitation,
  saveGuests,
  seedGuestsIfEmpty,
} from "@/lib/store";
import GuestTable from "@/components/GuestTable";

export default function ManagePage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitationId, setInvitationId] = useState("demo");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState<"all" | Guest["side"]>("all");
  const [notice, setNotice] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState({ name: "", group: "", side: "trai" as Guest["side"], phone: "", note: "" });
  const [hasDemo, setHasDemo] = useState(false);


  useEffect(() => {
    try {
      const seeded = seedGuestsIfEmpty();
      setGuests(seeded);
      setHasDemo(seeded.some((g) => g.isDemo));
      const inv = loadInvitation();
      if (inv?.id) setInvitationId(inv.id);
    } catch {
      setNotice("Không đọc được dữ liệu đã lưu. Trang hiển thị danh sách trống.");
    }
  }, []);

  const persist = (next: Guest[]) => {
    setGuests(next);
    setHasDemo(next.some((g) => g.isDemo));
    try {
      saveGuests(next);
    } catch {
      setNotice("Không lưu được thay đổi (trình duyệt chặn localStorage).");
    }
  };

  const totalGuests = guests.length;

  const groups = useMemo(() => Array.from(new Set(guests.map((g) => g.group).filter(Boolean))), [guests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      const okQ = !q || g.name.toLowerCase().includes(q) || g.phone.includes(q);
      const okG = groupFilter === "all" || g.group === groupFilter;
      const okS = sideFilter === "all" || g.side === sideFilter;
      return okQ && okG && okS;
    });
  }, [guests, query, groupFilter, sideFilter]);

  const submitGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNotice("Vui lòng nhập tên khách.");
      return;
    }
    if (editing) {
      persist(guests.map((g) => (g.id === editing.id ? { ...g, ...form, name: form.name.trim() } : g)));
      setNotice(`Đã cập nhật khách “${form.name.trim()}”.`);
    } else {
      persist([...guests, { id: newId("khach"), name: form.name.trim(), group: form.group.trim(), side: form.side, phone: form.phone.trim(), note: form.note.trim() }]);
      setNotice(`Đã thêm khách “${form.name.trim()}”.`);
    }
    setEditing(null);
    setForm({ name: "", group: "", side: "trai", phone: "", note: "" });
  };

  const addBulk = () => {
    const names = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) {
      setNotice("Hãy nhập ít nhất một tên, mỗi dòng một tên.");
      return;
    }
    const added: Guest[] = names.map((name) => ({ id: newId("khach"), name, group: "", side: "trai", phone: "", note: "" }));
    persist([...guests, ...added]);
    setNotice(`Đã thêm ${added.length} khách từ danh sách.`);
    setBulk("");
    setShowBulk(false);
  };

  const exportCsv = () => {
    try {
      const header = "Tên,Nhóm,Phía,SĐT,Ghi chú\n";
      const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
      const rows = guests.map((g) =>
        [g.name, g.group, g.side === "trai" ? "Nhà trai" : "Nhà gái", g.phone, g.note].map(esc).join(",")
      ).join("\n");
      const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "danh-sach-khach-moi.csv";
      a.click();
      URL.revokeObjectURL(url);
      setNotice("Đã xuất file CSV.");
    } catch {
      setNotice("Không xuất được CSV trên trình duyệt này.");
    }
  };

  const copyGuestLink = async (g: Guest) => {
    try {
      const url = `${window.location.origin}/thiep/${encodeURIComponent(invitationId)}?guest=${encodeURIComponent(g.name)}`;
      const res = await copyText(url);
      setNotice(res.ok ? `Đã sao chép link riêng của “${g.name}”.` : `Không sao chép tự động được. Link: ${url}`);
    } catch {
      setNotice("Không tạo được link riêng.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-[#7a1f2b]">Quản lý khách mời</h1>
      <p className="mt-2 text-[#5a4a48]">
        Link riêng từng khách trỏ tới thiệp hiện tại
        (id: <code className="rounded bg-[#f3e8d8] px-1">{invitationId}</code> — lưu thiệp ở trang Tạo thiệp để đổi id).
      </p>
      {hasDemo && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
          Danh sách đang chứa <strong>dữ liệu demo</strong> (đánh dấu “demo”) vì localStorage còn trống khi mở trang lần đầu.{" "}
          <button type="button" onClick={() => persist(clearDemoGuests())} className="font-semibold underline">Xóa dữ liệu demo</button>
        </p>
      )}
      {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}

      {/* Tổng số khách */}
      <div className="mt-6" aria-label="Tổng số khách mời">
        <div className="w-fit rounded-2xl border bg-white px-6 py-4 shadow-sm">
          <p className="font-display text-3xl font-bold text-[#7a1f2b]">{totalGuests}</p>
          <p className="text-xs text-[#7a6a68]">Tổng khách</p>
        </div>
      </div>

      {/* Thêm khách */}
      <form onSubmit={submitGuest} className="mt-6 space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-[#7a1f2b]">{editing ? "Sửa khách mời" : "Thêm khách mời"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="g-name" className="text-sm font-semibold">Tên *</label>
            <input id="g-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" required />
          </div>
          <div>
            <label htmlFor="g-group" className="text-sm font-semibold">Nhóm</label>
            <input id="g-group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="VD: Bạn bè" className="mt-1 w-full rounded-xl border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="g-side" className="text-sm font-semibold">Phía</label>
            <select id="g-side" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as Guest["side"] })} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="trai">Nhà trai</option>
              <option value="gai">Nhà gái</option>
            </select>
          </div>
          <div>
            <label htmlFor="g-phone" className="text-sm font-semibold">SĐT</label>
            <input id="g-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" className="mt-1 w-full rounded-xl border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="g-note" className="text-sm font-semibold">Ghi chú</label>
            <input id="g-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-full bg-[#7a1f2b] px-5 py-2.5 font-semibold text-white">{editing ? "Lưu thay đổi" : "Thêm khách"}</button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name: "", group: "", side: "trai", phone: "", note: "" }); }} className="rounded-full border px-5 py-2.5 font-semibold">Hủy sửa</button>
          )}
          <button type="button" onClick={() => setShowBulk(!showBulk)} className="rounded-full border px-5 py-2.5 font-semibold">Thêm hàng loạt</button>
          <button type="button" onClick={exportCsv} className="rounded-full border px-5 py-2.5 font-semibold">Xuất CSV</button>
        </div>
        {showBulk && (
          <div>
            <label htmlFor="bulk" className="text-sm font-semibold">Mỗi dòng một tên khách</label>
            <textarea id="bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={"Nguyễn Văn A\nTrần Thị B\nPhạm Văn C"} className="mt-1 w-full rounded-xl border px-3 py-2" />
            <button type="button" onClick={addBulk} className="mt-2 rounded-full bg-[#c9a86a] px-5 py-2.5 font-semibold text-white">Thêm tất cả</button>
          </div>
        )}
      </form>

      {/* Lọc */}
      <div className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="q-search" className="sr-only">Tìm khách</label>
        <input id="q-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên hoặc SĐT…" className="min-w-[200px] flex-1 rounded-full border px-4 py-2.5 sm:max-w-xs" />
        <label htmlFor="q-group" className="sr-only">Lọc theo nhóm</label>
        <select id="q-group" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="rounded-full border px-4 py-2.5">
          <option value="all">Tất cả nhóm</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label htmlFor="q-side" className="sr-only">Lọc theo phía</label>
        <select id="q-side" value={sideFilter} onChange={(e) => setSideFilter(e.target.value as "all" | Guest["side"])} className="rounded-full border px-4 py-2.5">
          <option value="all">Cả hai phía</option>
          <option value="trai">Nhà trai</option>
          <option value="gai">Nhà gái</option>
        </select>
        <span className="self-center text-sm text-[#7a6a68]" role="status">{filtered.length} / {guests.length} khách</span>
      </div>

      <div className="mt-4">
        <GuestTable
          guests={filtered}
          invitationId={invitationId}
          onCopyLink={copyGuestLink}
          onEdit={(g) => { setEditing(g); setForm({ name: g.name, group: g.group, side: g.side, phone: g.phone, note: g.note }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onDelete={(id) => persist(guests.filter((g) => g.id !== id))}
        />
      </div>

    </div>
  );
}
