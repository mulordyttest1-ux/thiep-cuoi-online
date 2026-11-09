"use client";

import { useCallback, useEffect, useState } from "react";

/** Cổng admin (Nancy): /tao-thiep và /quan-ly chỉ mở khi trình duyệt có
 * phiên admin (cookie td_admin_session do máy chủ đặt sau khi nhập đúng mã
 * admin). Mã KHÔNG nằm trong code client — kiểm tra ở /api/admin/verify.
 * Khách gõ thẳng URL admin vẫn gặp màn hình khóa. Các trang khách
 * (/khach/, /thiep/) KHÔNG dùng cổng này. */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      const body = (await res.json()) as { ok?: boolean };
      setState(body.ok ? "open" : "locked");
    } catch {
      setState("locked");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setCode("");
        await checkStatus();
        return;
      }
      setError(
        body.error === "admin_not_configured"
          ? "Chưa đặt mã admin — liên hệ người quản trị để đặt mã trước."
          : "Mã không đúng. Thử lại."
      );
    } catch {
      setError("Không kết nối được máy chủ. Thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-center">Đang kiểm tra quyền truy cập…</p>;
  }
  if (state === "open") return <>{children}</>;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-5xl text-[#c9a86a]" aria-hidden="true">
        ♥
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold text-[#7a1f2b]">Khu vực riêng của Thiết kế</h1>
      <p className="mt-2 text-[#5a4a48]">Trang này chỉ dành cho chủ thiệp. Nhập mã admin để mở.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label htmlFor="admin-code" className="sr-only">
          Mã admin
        </label>
        <input
          id="admin-code"
          type="password"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã admin"
          className="w-full rounded-xl border px-4 py-3 text-center"
        />
        {error && (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full rounded-full bg-[#7a1f2b] py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Đang kiểm tra…" : "Mở khu vực riêng"}
        </button>
      </form>
    </div>
  );
}
