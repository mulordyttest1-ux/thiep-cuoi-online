"use client";

import { useEffect, useMemo, useState } from "react";
import type { Guest, InvitationData } from "@/lib/types";
import type { ChatMessage, HistoryEntry, ManualListItem } from "@/lib/access";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock } from "@/lib/cep";
import { newId } from "@/lib/types";
import {
  clearDemoGuests,
  copyText,
  loadInvitation,
  saveGuests,
  seedGuestsIfEmpty,
} from "@/lib/store";
import GuestTable from "@/components/GuestTable";
import AdminGate from "@/components/AdminGate";

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

  // Chữ cho Illustrator + chat + lịch sử (mẫu chuẩn #1): bản ghi máy chủ
  // của thiệp — ghost text sau khi khách chốt, danh sách sửa tay, chat
  // khách ↔ Nancy, lịch sử sửa của khách (mới nhất trước).
  const [adminToken, setAdminToken] = useState("");
  const [serverRecord, setServerRecord] = useState<{
    status: string;
    data: InvitationData | null;
    customerConfirmedAt: string | null;
    customTexts: Record<string, string>;
    editedFields: string[];
    chat: ChatMessage[];
    history: HistoryEntry[];
    manualList: ManualListItem[];
  } | null>(null);
  const [serverNotice, setServerNotice] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [localGhost, setLocalGhost] = useState<{ ghost: string; meta: string; plain: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  // Bảng duyệt thiệp (giai đoạn 2): danh sách thiệp trên máy chủ theo trạng
  // thái — khách vừa chốt thì hiện thông báo + số lượng để Nancy vào xem.
  // Chỉ admin (cookie phiên AdminGate hoặc token nhập tay). Tải khi mở
  // trang và sau mỗi lần đổi trạng thái.
  interface BoardItem {
    id: string;
    groomName: string;
    brideName: string;
    date: string;
    time: string;
    venue: string;
    status: string;
    statusLabel: string;
    customerConfirmedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
  type BoardTab = "all" | "pending" | "reviewed" | "printed" | "draft";
  const BOARD_TABS: { key: BoardTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ duyệt" },
    { key: "reviewed", label: "Đã duyệt" },
    { key: "printed", label: "Đã in" },
    { key: "draft", label: "Nháp" },
  ];
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [boardTab, setBoardTab] = useState<BoardTab>("all");
  const [boardStore, setBoardStore] = useState<string>("");
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardNotice, setBoardNotice] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const loadBoard = async () => {
    setBoardLoading(true);
    try {
      const res = await fetch("/api/invitations/list", {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) {
        setBoard([]);
        setBoardNotice(typeof j.error === "string" ? j.error : "Không tải được bảng duyệt.");
        return;
      }
      setBoard((j.items as BoardItem[] | undefined) ?? []);
      setBoardStore(typeof j.store === "string" ? j.store : "");
      setBoardNotice("");
    } catch {
      setBoardNotice("Không kết nối được máy chủ.");
    }
    setBoardLoading(false);
  };

  // Đếm từng tab từ danh sách (khớp reviewTabOf trong access.ts: chờ
  // duyệt = confirmed + locked_for_print cũ; nháp = draft + preview).
  const boardCounts = useMemo(() => {
    const c: Record<BoardTab, number> = { all: board.length, pending: 0, reviewed: 0, printed: 0, draft: 0 };
    for (const b of board) {
      if (b.status === "confirmed" || b.status === "locked_for_print") c.pending++;
      else if (b.status === "reviewed") c.reviewed++;
      else if (b.status === "printed") c.printed++;
      else if (b.status === "draft" || b.status === "preview_for_print") c.draft++;
    }
    return c;
  }, [board]);
  const pendingCount = boardCounts.pending;
  const filteredBoard = useMemo(() => {
    if (boardTab === "all") return board;
    return board.filter((b) => {
      if (boardTab === "pending") return b.status === "confirmed" || b.status === "locked_for_print";
      if (boardTab === "reviewed") return b.status === "reviewed";
      if (boardTab === "printed") return b.status === "printed";
      return b.status === "draft" || b.status === "preview_for_print";
    });
  }, [board, boardTab]);

  const changeReview = async (id: string, action: "reviewed" | "printed" | "reopen") => {
    setReviewBusy(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ action }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) {
        setServerNotice(typeof j.error === "string" ? j.error : "Không đổi được trạng thái.");
        return;
      }
      setServerNotice("");
      await loadBoard();
      await loadServerRecord(id);
    } catch {
      setServerNotice("Không kết nối được máy chủ.");
    }
    setReviewBusy(false);
  };

  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return d && m && y ? `${d}/${m}/${y}` : iso;
  };

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  const serverGhost = useMemo(() => {
    if (!serverRecord?.data) return null;
    return {
      ghost: buildCepTextBlock(serverRecord.data),
      meta: buildCepMetadataJson(),
      plain: buildCepPlainText(serverRecord.data),
    };
  }, [serverRecord]);

  const loadServerRecord = async (id?: string) => {
    const targetId = id ?? invitationId;
    if (id) setInvitationId(id);
    if (!targetId) {
      setServerNotice("Chưa có id thiệp.");
      return;
    }
    setServerLoading(true);
    setLocalGhost(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(targetId)}?kind=admin`, {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) {
        setServerRecord(null);
        setServerNotice(typeof j.error === "string" ? j.error : "Không tải được thiệp trên máy chủ.");
        // Thiệp chưa lên máy chủ: chữ từ dữ liệu trên máy này (ghi rõ là
        // chưa chốt qua máy chủ).
        const local = loadInvitation();
        if (local) {
          setLocalGhost({
            ghost: buildCepTextBlock(local),
            meta: buildCepMetadataJson(),
            plain: buildCepPlainText(local),
          });
        }
        return;
      }
      setServerRecord({
        status: String(j.status ?? ""),
        data: (j.data as InvitationData | undefined) ?? null,
        customerConfirmedAt: (j.customerConfirmedAt as string | null | undefined) ?? null,
        customTexts: (j.customTexts as Record<string, string> | undefined) ?? {},
        editedFields: (j.editedFields as string[] | undefined) ?? [],
        chat: (j.chat as ChatMessage[] | undefined) ?? [],
        history: (j.history as HistoryEntry[] | undefined) ?? [],
        manualList: (j.manualList as ManualListItem[] | undefined) ?? [],
      });
      setServerNotice("");
    } catch {
      setServerNotice("Không kết nối được máy chủ.");
    }
    setServerLoading(false);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !serverRecord) return;
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ from: "nancy", text }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (res.ok && j.ok && j.message) {
        setServerRecord((prev) => (prev ? { ...prev, chat: [...prev.chat, j.message as ChatMessage] } : prev));
        setReplyText("");
        setServerNotice("");
      } else {
        setServerNotice(typeof j.error === "string" ? j.error : "Không gửi được trả lời.");
      }
    } catch {
      setServerNotice("Không kết nối được máy chủ.");
    }
  };


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
    // Bảng duyệt KHÔNG tải ở đây: lúc mount chưa chắc đã có phiên admin
    // (cổng còn khóa) nên fetch sẽ 401 và bảng trống. Bảng tải qua
    // onOpen của AdminGate — chạy khi cổng mở (đã có cookie phiên).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Thiệp đã lên máy chủ: link riêng chỉ tạo được khi đã trả tiền —
      // máy chủ từ chối khi chưa trả, nên khách không thể xài chùa.
      // Thiệp chưa lên máy chủ (nháp/demo cũ): dùng link cũ, kèm cảnh báo
      // là link này không được máy chủ bảo vệ.
      const stRes = await fetch(`/api/invitations?id=${encodeURIComponent(invitationId)}`);
      const st = (await stRes.json()) as { exists?: boolean; status?: string };
      if (st.exists) {
        const admin = prompt("Token admin (để trống khi chạy local):") ?? "";
        const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(admin ? { "x-admin-token": admin } : {}) },
          body: JSON.stringify({ guestName: g.name }),
        });
        const j = (await res.json()) as Record<string, unknown>;
        if (!res.ok || !j.ok) {
          setNotice(typeof j.error === "string" ? j.error : "Không tạo được link khách.");
          return;
        }
        const url = String(j.guestUrl ?? "");
        const r = await copyText(url);
        setNotice(r.ok ? `Đã sao chép link riêng của “${g.name}”.` : `Không sao chép tự động được. Link: ${url}`);
        return;
      }
      const url = `${window.location.origin}/thiep/${encodeURIComponent(invitationId)}?guest=${encodeURIComponent(g.name)}`;
      const res = await copyText(url);
      setNotice(res.ok ? `Đã sao chép link riêng của “${g.name}” (link cũ — thiệp chưa lên máy chủ nên chưa được bảo vệ, đồng bộ lên máy chủ để khóa lại).` : `Không sao chép tự động được. Link: ${url}`);
    } catch {
      setNotice("Không tạo được link riêng.");
    }
  };

  return (
    <AdminGate onOpen={loadBoard}>
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

      {/* Bảng duyệt thiệp (giai đoạn 2): khách chốt xong hiện thông báo ở
          đây để Nancy vào xem — không cần khách copy-paste gì. */}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => setBoardTab("pending")}
          className="mt-4 block w-full rounded-2xl bg-amber-100 px-4 py-3 text-left text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-200"
          role="status"
        >
          Có {pendingCount} thiệp khách vừa chốt — đang chờ duyệt. Bấm để xem.
        </button>
      )}

      <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm" aria-label="Bảng duyệt thiệp">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-[#7a1f2b]">Bảng duyệt thiệp</h2>
          <button
            type="button"
            onClick={loadBoard}
            disabled={boardLoading}
            className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {boardLoading ? "Đang tải…" : "↻ Tải lại"}
          </button>
        </div>
        {boardStore === "none" && (
          <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
            Chưa cấu hình máy chủ (Supabase) nên bảng duyệt trống. Cần tạo project Supabase + chạy SQL + đặt biến môi trường thì thiệp khách chốt mới hiện ở đây.
          </p>
        )}
        {boardStore === "file" && (
          <p className="mt-2 text-xs text-[#7a6a68]">Đang dùng file local (chỉ để test — lên Vercel sẽ mất, cần Supabase).</p>
        )}
        {boardNotice && <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{boardNotice}</p>}
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Lọc thiệp theo trạng thái">
          {BOARD_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={boardTab === t.key}
              onClick={() => setBoardTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${boardTab === t.key ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}
            >
              {t.label} ({boardCounts[t.key]})
            </button>
          ))}
        </div>
        {filteredBoard.length === 0 ? (
          <p className="mt-4 text-sm text-[#7a6a68]">
            {board.length === 0 ? "Chưa có thiệp nào trên máy chủ." : "Không có thiệp nào ở trạng thái này."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {filteredBoard.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    loadServerRecord(b.id);
                    document.getElementById("chu-illustrator")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="block w-full rounded-xl border bg-[#fdf8f1] px-4 py-3 text-left hover:border-[#7a1f2b]"
                >
                  <span className="block font-semibold text-[#7a1f2b]">
                    {b.groomName || "(chưa có tên chú rể)"} &amp; {b.brideName || "(chưa có tên cô dâu)"}
                  </span>
                  <span className="mt-1 block text-sm text-[#5a4a48]">
                    Tiệc: {fmtDate(b.date)}{b.time ? ` lúc ${b.time}` : ""}{b.venue ? ` · ${b.venue}` : ""} · {b.statusLabel}
                  </span>
                  <span className="mt-1 block text-xs text-[#7a6a68]">
                    {b.customerConfirmedAt ? `Khách chốt lúc ${fmtTime(b.customerConfirmedAt)}` : "Khách chưa chốt"} · id: {b.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      {/* Chữ cho Illustrator + chat + lịch sử (mẫu chuẩn #1) */}
      <section id="chu-illustrator" className="mt-10 rounded-2xl border bg-white p-5 shadow-sm" aria-label="Chữ cho Illustrator">
        <h2 className="font-semibold text-[#7a1f2b]">Chữ cho Illustrator — khách đã chốt</h2>
        <p className="mt-1 text-sm text-[#5a4a48]">
          Tải bản ghi máy chủ của thiệp (id: <code className="rounded bg-[#f3e8d8] px-1">{invitationId}</code>) để lấy
          ghost text sau khi khách chốt, xem chat và lịch sử sửa của khách.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Token admin (để trống khi chạy local)"
            className="min-w-[220px] flex-1 rounded-xl border px-3 py-2"
          />
          <button
            type="button"
            onClick={() => loadServerRecord()}
            disabled={serverLoading}
            className="rounded-full bg-[#7a1f2b] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {serverLoading ? "Đang tải…" : "Tải chữ đã chốt"}
          </button>
        </div>
        {serverNotice && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{serverNotice}</p>}

        {serverRecord && serverGhost && (
          <div className="mt-4 space-y-5">
            <p className="text-sm">
              Trạng thái: <strong>{serverRecord.status}</strong> ·{" "}
              {serverRecord.customerConfirmedAt
                ? <>Khách đã chốt lúc {fmtTime(serverRecord.customerConfirmedAt)}</>
                : "Khách chưa chốt"}
            </p>
            {/* Đổi trạng thái duyệt: chỉ hiện nút hợp lệ với trạng thái hiện tại. */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(serverRecord.status === "confirmed" || serverRecord.status === "locked_for_print") && (
                <button
                  type="button"
                  onClick={() => changeReview(invitationId, "reviewed")}
                  disabled={reviewBusy}
                  className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Đã duyệt
                </button>
              )}
              {serverRecord.status === "reviewed" && (
                <button
                  type="button"
                  onClick={() => changeReview(invitationId, "printed")}
                  disabled={reviewBusy}
                  className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Đã in
                </button>
              )}
              {(serverRecord.status === "confirmed" ||
                serverRecord.status === "reviewed" ||
                serverRecord.status === "printed" ||
                serverRecord.status === "locked_for_print") && (
                <button
                  type="button"
                  onClick={() => changeReview(invitationId, "reopen")}
                  disabled={reviewBusy}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  Mở lại
                </button>
              )}
            </div>
            <div>
              <label htmlFor="ql-ghost" className="text-sm font-semibold">Ghost text (chỉ trường dữ liệu)</label>
              <textarea
                id="ql-ghost"
                readOnly
                rows={8}
                value={serverGhost.ghost}
                onFocus={(e) => e.target.select()}
                className="mt-1 w-full rounded-xl border bg-[#fdf8f1] px-3 py-2 font-mono text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => { const r = await copyText(serverGhost.ghost); setServerNotice(r.ok ? "Đã sao chép ghost text." : "Không sao chép được."); }}
                  className="rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]"
                >
                  Sao chép ghost text
                </button>
                <button
                  type="button"
                  onClick={async () => { const r = await copyText(serverGhost.meta); setServerNotice(r.ok ? "Đã sao chép metadata." : "Không sao chép được."); }}
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                >
                  Sao chép metadata
                </button>
                <button
                  type="button"
                  onClick={async () => { const r = await copyText(serverGhost.plain); setServerNotice(r.ok ? "Đã sao chép bản chữ thường." : "Không sao chép được."); }}
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                >
                  Sao chép chữ thường
                </button>
              </div>
            </div>
            {serverRecord.manualList.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert">
                <h3 className="font-bold text-amber-900">CẦN SỬA TAY TRONG ILLUSTRATOR</h3>
                <p className="mt-1 text-xs text-amber-900">
                  Những câu này không vào ghost text được — sửa tay trong file Illustrator trước khi in.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-900">
                  {serverRecord.manualList.map((m) => (
                    <li key={m.key} className="rounded-xl bg-white px-3 py-2">
                      <span className="font-semibold">{m.label}:</span>{" "}
                      <span className="line-through opacity-70">{m.oldValue || "(trống)"}</span>
                      {" → "}
                      <span className="font-semibold">{m.newValue || "(trống)"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-[#7a1f2b]">Chat với khách</h3>
              <div className="mt-2 space-y-2">
                {serverRecord.chat.length === 0 && (
                  <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm text-[#7a6a68]">Chưa có tin nhắn nào.</p>
                )}
                {serverRecord.chat.map((m, i) => (
                  <div key={`${m.at}-${i}`} className={`flex ${m.from === "nancy" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === "nancy" ? "bg-[#7a1f2b] text-white" : "bg-[#f3e8d8] text-[#3d2b29]"}`}>
                      <p className="whitespace-pre-line">{m.text}</p>
                      <p className={`mt-1 text-[10px] ${m.from === "nancy" ? "text-white/70" : "text-[#7a6a68]"}`}>
                        {m.from === "nancy" ? "Nancy" : "Khách"} · {fmtTime(m.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                  placeholder="Trả lời khách…"
                  maxLength={2000}
                  className="w-full rounded-xl border px-3 py-2"
                  aria-label="Trả lời khách"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="shrink-0 rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Trả lời
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#7a1f2b]">Lịch sử sửa của khách (mới nhất trước)</h3>
              {serverRecord.history.length === 0 ? (
                <p className="mt-2 text-sm text-[#7a6a68]">Chưa có lần sửa nào được ghi.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {serverRecord.history.map((h, i) => (
                    <li key={`${h.at}-${i}`} className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">
                      <span className="font-semibold">{h.label}</span>{" "}
                      <span className="rounded-full bg-[#f3e8d8] px-2 py-0.5 text-xs">{h.kind}</span>{" "}
                      <span className="text-[#7a6a68]">{fmtTime(h.at)}</span>
                      <br />
                      <span className="line-through opacity-70">{h.oldValue || "(trống)"}</span>
                      {" → "}
                      <span className="font-semibold">{h.newValue || "(trống)"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!serverRecord && localGhost && (
          <div className="mt-4">
            <p className="text-sm text-amber-900">
              Thiệp chưa lên máy chủ — dưới đây là chữ từ dữ liệu trên máy này (khách chưa chốt qua máy chủ).
            </p>
            <textarea
              readOnly
              rows={8}
              value={localGhost.ghost}
              onFocus={(e) => e.target.select()}
              className="mt-2 w-full rounded-xl border bg-[#fdf8f1] px-3 py-2 font-mono text-xs"
            />
          </div>
        )}
      </section>

    </div>
    </AdminGate>
  );
}
