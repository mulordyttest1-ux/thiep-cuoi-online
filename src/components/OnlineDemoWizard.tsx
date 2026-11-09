"use client";

import { useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { TEMPLATES, PRESET_PHOTOS } from "@/lib/templates";
import { buildShareUrl, copyText, encodeShare } from "@/lib/store";
import type { SensitiveField } from "@/components/InvitationPreview";
import BlockToggles from "@/components/BlockToggles";
import { ONLINE_PRICE_VND, formatVnd } from "@/lib/payment";
import { isPrintConfirmed, type InvitationStatus } from "@/lib/access";

const inputCls = "w-full rounded-xl border px-3 py-2";

type PayInfo = {
  amountText: string;
  memo: string;
  qrUrl: string | null;
  configured: boolean;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  error?: string;
};

/**
 * Mục "Xem demo thiệp online" (PLAN CHỐT v3-final, §4 mục 1–4) — nằm trong
 * trang sửa /tao-thiep, tự hiện (không ai gửi link tay).
 *
 * - Demo DUY NHẤT, đã đổ dữ liệu khách (tên/ngày/giờ/địa điểm từ bản vật
 *   lý + chỗ trống cho ảnh/thông tin thêm). Tên + ngày + giờ + địa điểm
 *   bị blur; bấm vào ô đang blur thì hiện rõ lúc sửa, sửa xong mờ lại.
 * - Trước khi trả tiền: chọn mẫu THOẢI MÁI, không tính lượt.
 * - Wizard 3 bước: (1) Chọn mẫu -> (2) Thêm ảnh / thông tin thêm ->
 *   (3) Quét QR 100k nhận link xịn. Không chat agent tự do.
 * - Link xịn: link tĩnh ?d= mã hóa dữ liệu vào trong link, chỉ đọc,
 *   KHÁC link demo (demo không bao giờ biến thành link xịn).
 * - V1 KHÔNG có nút đổi mẫu sau trả tiền (hoãn sang giai đoạn sau).
 */
export default function OnlineDemoWizard({
  data,
  onPatch,
  serverId,
  serverStatus,
  adminToken,
  onServerChange,
}: {
  data: InvitationData;
  onPatch: (patch: Partial<InvitationData>) => void;
  serverId: string;
  serverStatus: string;
  adminToken: string;
  onServerChange: (id: string, status: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [revealed, setRevealed] = useState<SensitiveField | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [pay, setPay] = useState<PayInfo | null>(null);
  const [paidLink, setPaidLink] = useState("");
  const [paidTemplateId, setPaidTemplateId] = useState("");
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isPaid = serverStatus === "paid_online";
  // Đã chốt in (locked_for_print cũ hoặc confirmed/reviewed/printed mới):
  // tên/ngày/giờ/địa điểm vật lý không sửa được nữa — chỉ sửa được trường
  // online (mẫu, ảnh, câu chuyện, lịch trình...).
  const isLocked = isPrintConfirmed(serverStatus as InvitationStatus);
  // Đã chốt in / đã trả tiền: tên/ngày/giờ/địa điểm vật lý không sửa được
  // nữa — chỉ sửa được trường online (mẫu, ảnh, câu chuyện, lịch trình...).
  const physicalReadOnly = isLocked || isPaid;

  const adminHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(adminToken ? { "x-admin-token": adminToken } : {}),
  });

  const premiumLinkFor = (templateId: string): string => {
    try {
      return buildShareUrl(window.location.origin, { ...data, id: serverId || data.id || "demo", templateId });
    } catch {
      return "";
    }
  };

  /** Link demo mở trang riêng: /thiep/demo mang dữ liệu hiện tại trong ?d=
   *  (không lưu máy chủ), mờ tên/ngày/giờ/địa điểm, có nút quay lại wizard.
   *  Dùng id "demo" để không vướng chốt chặn máy chủ của thiệp đã đồng bộ.
   *  Chưa nhập tên cô dâu chú rể thì chưa mở được (link ?d= cần tên để đọc). */
  const demoUrl = (): string => {
    try {
      return `${window.location.origin}/thiep/demo?d=${encodeShare({ ...data, id: "demo" })}&from=wizard&blur=1`;
    } catch {
      return "";
    }
  };
  const hasNames = data.groomName.trim() !== "" && data.brideName.trim() !== "";

  const validUntilText = (): string => {
    if (!data.date) return "";
    const d = new Date(`${data.date}T00:00:00`);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("vi-VN");
  };

  /** Đồng bộ dữ liệu hiện tại lên máy chủ rồi chốt in (xong vật lý) để mở bán online. */
  const syncAndLock = async () => {
    setBusy("Đang đồng bộ + chốt in…");
    setNotice("");
    try {
      const syncRes = await fetch("/api/invitations", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ data: { ...data, id: serverId || undefined } }),
      });
      const sj = (await syncRes.json()) as Record<string, unknown>;
      if (!syncRes.ok || !sj.ok) {
        setNotice(typeof sj.error === "string" ? sj.error : "Không đồng bộ được.");
        setBusy("");
        return;
      }
      const id = String(sj.id ?? "");
      onServerChange(id, String(sj.status ?? "preview_for_print"));
      const lockRes = await fetch(`/api/invitations/${encodeURIComponent(id)}/lock`, {
        method: "POST",
        headers: adminHeaders(),
      });
      const lj = (await lockRes.json()) as Record<string, unknown>;
      if (!lockRes.ok || !lj.ok) {
        setNotice(typeof lj.error === "string" ? lj.error : "Không chốt in được.");
        setBusy("");
        return;
      }
      onServerChange(id, "locked_for_print");
      setNotice("Đã chốt in xong vật lý. Giờ lấy QR để khách trả tiền mua thiệp online.");
      await fetchPay(id);
    } catch {
      setNotice("Không kết nối được máy chủ.");
    }
    setBusy("");
  };

  /** Lấy QR SePay 100k cho đúng (thiệp + mẫu đang chọn). */
  const fetchPay = async (idOverride?: string) => {
    const id = idOverride || serverId;
    if (!id) { setNotice("Đồng bộ lên máy chủ trước."); return; }
    setBusy("Đang lấy QR thanh toán…");
    try {
      const res = await fetch(
        `/api/invitations/${encodeURIComponent(id)}/payment?template=${encodeURIComponent(data.templateId)}`
      );
      const j = (await res.json()) as Record<string, unknown>;
      if (j.alreadyPaid) {
        const tpl = String((j.paidTemplateId as string | undefined) ?? data.templateId);
        setPaidTemplateId(tpl);
        setPaidLink(premiumLinkFor(tpl));
        onServerChange(id, "paid_online");
        setNotice("Thiệp đã được mua online — link xịn ở bên dưới.");
        setBusy("");
        return;
      }
      setPay({
        amountText: String(j.amountText ?? formatVnd(ONLINE_PRICE_VND)),
        memo: String(j.memo ?? ""),
        qrUrl: (j.qrUrl as string | null) ?? null,
        configured: Boolean(j.configured ?? j.ok),
        bankCode: j.bankCode as string | undefined,
        accountNumber: j.accountNumber as string | undefined,
        accountName: j.accountName as string | undefined,
        error: j.error as string | undefined,
      });
      setNotice(j.configured ? "" : "Chưa cấu hình tài khoản nhận tiền SePay.");
    } catch {
      setNotice("Không lấy được QR thanh toán.");
    }
    setBusy("");
  };

  /** Nút "Tôi đã chuyển — kiểm tra": hỏi máy chủ xem webhook đã mở chưa. */
  const checkPaid = async () => {
    const id = serverId;
    if (!id) { setNotice("Đồng bộ lên máy chủ trước."); return; }
    setBusy("Đang kiểm tra…");
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(id)}/status`);
      const j = (await res.json()) as Record<string, unknown>;
      if (j.exists && j.status === "paid_online") {
        const tpl = String((j.paidTemplateId as string | undefined) ?? data.templateId);
        setPaidTemplateId(tpl);
        setPaidLink(premiumLinkFor(tpl));
        onServerChange(id, "paid_online");
        setNotice("Đã nhận tiền — thiệp online đã mở! Link xịn ở bên dưới.");
      } else {
        setNotice("Chưa thấy tiền vào. Kiểm tra lại: chuyển đúng số tiền + đúng nội dung mã chưa? Nếu chuyển rồi mà vẫn chưa thấy, đợi 1–2 phút rồi bấm lại.");
      }
    } catch {
      setNotice("Không kiểm tra được. Thử lại sau.");
    }
    setBusy("");
  };

  const copyMemo = async () => {
    if (!pay?.memo) return;
    const r = await copyText(pay.memo);
    setCopied(r.ok ? "Đã sao chép mã thanh toán." : `Mã: ${pay.memo}`);
  };

  const copyPaidLink = async () => {
    if (!paidLink) return;
    const r = await copyText(paidLink);
    setCopied(r.ok ? "Đã sao chép link xịn." : "Không sao chép được — bôi đen link rồi copy thủ công.");
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onPatch({ photoUrl: reader.result });
    };
    reader.onerror = () => setNotice("Không đọc được ảnh đã chọn. Hãy thử ảnh khác.");
    reader.readAsDataURL(file);
  };

  const steps = [
    { n: 1 as const, label: "Chọn mẫu" },
    { n: 2 as const, label: "Thêm ảnh & thông tin" },
    { n: 3 as const, label: "Quét QR nhận link" },
  ];

  return (
    <section id="demo-online" className="mt-8 scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm" aria-label="Xem demo thiệp online">
      <h2 className="font-display text-2xl font-bold text-[#7a1f2b]">Xem demo thiệp online</h2>
      <p className="mt-1 text-sm text-[#5a4a48]">
        Demo duy nhất, đã đổ sẵn dữ liệu khách từ bản vật lý. Bấm “Xem demo” ở bước 1 để mở trang
        thiệp đầy đủ riêng, đúng như khách sẽ thấy (tên + ngày + giờ + địa điểm vẫn mờ).
        Chọn mẫu thoải mái trước khi trả tiền, không tính lượt.
        {isPaid
          ? " Thiệp này đã được mua online."
          : isLocked
            ? " Đã chốt in xong vật lý — sẵn sàng bán online."
            : " Chưa chốt in: bước 3 sẽ đồng bộ + chốt in rồi mới hiện QR."}
      </p>

      {/* Bước */}
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Các bước mua thiệp online">
        {steps.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              onClick={() => setStep(s.n)}
              aria-current={step === s.n ? "step" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${step === s.n ? "bg-[#7a1f2b] text-white" : "border bg-[#fdf8f1]"}`}
            >
              Bước {s.n}: {s.label}
            </button>
          </li>
        ))}
      </ol>

      {/* BƯỚC 1 — chọn mẫu + demo blur */}
      {step === 1 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onPatch({ templateId: t.id }); setRevealed(null); }}
                aria-pressed={data.templateId === t.id}
                className={`rounded-xl border-2 px-3 py-3 text-left ${data.templateId === t.id ? "border-[#7a1f2b] bg-[#fdf8f1]" : "border-transparent bg-[#fdf8f1]"}`}
              >
                <span className="block text-sm font-bold">{t.name}</span>
                <span className="block text-xs text-[#7a6a68]">{t.styleLabel}</span>
                {data.templateId === t.id && <span className="mt-1 block text-xs font-semibold text-[#7a1f2b]">✓ Đang chọn</span>}
              </button>
            ))}
          </div>

          {/* Xem demo — mở trang thiệp đầy đủ riêng (cùng component trang
              khách GuestInvitationView: cover + bộ sưu tập ảnh + nút “Xem thiệp” + hiệu ứng),
              KHÔNG còn hộp demo tĩnh inline trong wizard. */}
          <div className="mx-auto mt-4 max-w-3xl rounded-2xl border bg-[#fdf8f1] p-4 text-center">
            <p className="text-sm font-semibold text-[#7a1f2b]">Xem demo đúng như khách sẽ thấy</p>
            <p className="mt-1 text-sm text-[#5a4a48]">
              Bấm “Xem demo” để mở trang thiệp đầy đủ riêng: màn mở đầu, bộ sưu tập ảnh, nút “Xem thiệp”, hiệu ứng đúng
              biến thể của mẫu đang chọn. Tên + ngày + giờ + địa điểm vẫn mờ. Xem xong bấm
              “← Quay lại sửa thiệp” để về đây sửa tiếp / trả tiền.
            </p>
            {hasNames ? (
              <a href={demoUrl()} className="mt-3 inline-block rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white hover:bg-[#5e1620]">
                Xem demo →
              </a>
            ) : (
              <p className="mt-3 text-sm font-semibold text-amber-900">Nhập tên cô dâu chú rể ở dưới (hoặc ở form vật lý) rồi mới xem được demo.</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-[#5a4a48]">Sửa nhanh:</span>
              {(["names", "date", "time", "venue"] as SensitiveField[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRevealed(f)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${revealed === f ? "bg-[#7a1f2b] text-white" : "bg-white"}`}
                >
                  {f === "names" ? "Sửa tên" : f === "date" ? "Sửa ngày cưới" : f === "time" ? "Sửa giờ tiệc" : "Sửa địa điểm"}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn mục hiển thị (khối thêm/bớt): bấm là demo trên đổi ngay. */}
          <div className="mx-auto mt-4 max-w-3xl">
            <BlockToggles data={data} onPatch={onPatch} />
          </div>

          {/* Sửa trực tiếp: bấm nút "Sửa ..." ở trên thì hiện ô nhập ngay
              dưới đây (trước đây bấm vào ô mờ trên demo tĩnh để mở form
              này — demo giờ ở trang riêng nên mở form bằng nút). */}
          {revealed && (
            <div className="mx-auto mt-4 max-w-3xl rounded-2xl border bg-[#fdf8f1] p-4">
              <p className="text-sm font-bold text-[#7a1f2b]">
                {revealed === "names" && "Sửa tên"}
                {revealed === "date" && "Sửa ngày cưới"}
                {revealed === "time" && "Sửa giờ tiệc"}
                {revealed === "venue" && "Sửa địa điểm"}
              </p>
              {physicalReadOnly && (
                <p className="mt-1 text-sm text-amber-900">Đã chốt in nên tên/ngày/giờ/địa điểm vật lý không sửa được nữa — muốn sửa thì mở khóa ở mục “Gửi khách duyệt in” rồi sửa lại từ đầu.</p>
              )}
              <fieldset disabled={physicalReadOnly} className="mt-3 grid gap-3 border-0 p-0 sm:grid-cols-2">
                {revealed === "names" && (
                  <>
                    <div>
                      <label htmlFor="demo-groom" className="text-sm font-semibold">Tên chú rể</label>
                      <input id="demo-groom" value={data.groomName} onChange={(e) => onPatch({ groomName: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                    </div>
                    <div>
                      <label htmlFor="demo-bride" className="text-sm font-semibold">Tên cô dâu</label>
                      <input id="demo-bride" value={data.brideName} onChange={(e) => onPatch({ brideName: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                    </div>
                  </>
                )}
                {revealed === "date" && (
                  <div>
                    <label htmlFor="demo-date" className="text-sm font-semibold">Ngày cưới</label>
                    <input id="demo-date" type="date" value={data.date} onChange={(e) => onPatch({ date: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                  </div>
                )}
                {revealed === "time" && (
                  <div>
                    <label htmlFor="demo-time" className="text-sm font-semibold">Giờ tiệc</label>
                    <input id="demo-time" type="time" value={data.time} onChange={(e) => onPatch({ time: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                  </div>
                )}
                {revealed === "venue" && (
                  <>
                    <div>
                      <label htmlFor="demo-venue" className="text-sm font-semibold">Địa điểm</label>
                      <input id="demo-venue" value={data.venue} onChange={(e) => onPatch({ venue: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                    </div>
                    <div>
                      <label htmlFor="demo-address" className="text-sm font-semibold">Địa chỉ</label>
                      <input id="demo-address" value={data.address} onChange={(e) => onPatch({ address: e.target.value })} className={`${inputCls} mt-1 bg-white`} />
                    </div>
                  </>
                )}
              </fieldset>
              <button type="button" onClick={() => setRevealed(null)} className="mt-3 rounded-full border px-4 py-2 text-sm font-semibold">Xong</button>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => setStep(2)} className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white hover:bg-[#5e1620]">Tiếp: thêm ảnh &amp; thông tin →</button>
          </div>
        </div>
      )}

      {/* BƯỚC 2 — ảnh + thông tin thêm (chỉ online) */}
      {step === 2 && (
        <div className="mt-4 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">Ảnh cưới (chỉ online — bản in không có ảnh này)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_PHOTOS.map((p) => (
                <button key={p.url} type="button" onClick={() => onPatch({ photoUrl: p.url })} aria-pressed={data.photoUrl === p.url} className={`overflow-hidden rounded-xl border-2 ${data.photoUrl === p.url ? "border-[#7a1f2b]" : "border-transparent"}`}>
                  <img src={p.url} alt={p.label} loading="lazy" className="h-16 w-24 object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="demo-photo-url" className="text-sm font-semibold">Hoặc dán URL ảnh</label>
                <input id="demo-photo-url" value={data.photoUrl.startsWith("data:") ? "" : data.photoUrl} onChange={(e) => onPatch({ photoUrl: e.target.value })} placeholder="https://…" className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label htmlFor="demo-photo-file" className="text-sm font-semibold">Hoặc tải ảnh từ máy lên</label>
                <input ref={fileRef} id="demo-photo-file" type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} className={`${inputCls} mt-1`} />
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="demo-story" className="text-sm font-semibold">Câu chuyện tình yêu</label>
            <textarea id="demo-story" rows={3} value={data.story} onChange={(e) => onPatch({ story: e.target.value })} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="demo-schedule" className="text-sm font-semibold">Lịch trình (mỗi dòng: HH:MM - Nội dung)</label>
            <textarea id="demo-schedule" rows={3} value={data.scheduleText} onChange={(e) => onPatch({ scheduleText: e.target.value })} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="demo-message" className="text-sm font-semibold">Lời mời</label>
            <textarea id="demo-message" rows={3} value={data.message} onChange={(e) => onPatch({ message: e.target.value })} className={`${inputCls} mt-1`} />
          </div>

          {/* Chọn mục hiển thị (khối thêm/bớt) — đi theo dữ liệu thiệp lên
              link xịn sau khi trả tiền; chỉ online, không đụng form in. */}
          <BlockToggles data={data} onPatch={onPatch} />

          <fieldset>
            <legend className="text-sm font-semibold">Mừng cưới (VietQR trên thiệp — tiền này về tài khoản cô dâu chú rể, khác tài khoản nhận tiền mua thiệp của Thiết kế)</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="demo-bank" className="text-sm font-semibold">Mã ngân hàng</label>
                <input id="demo-bank" value={data.bankCode} onChange={(e) => onPatch({ bankCode: e.target.value })} placeholder="VD: VCB" className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label htmlFor="demo-acc" className="text-sm font-semibold">Số tài khoản</label>
                <input id="demo-acc" value={data.accountNumber} onChange={(e) => onPatch({ accountNumber: e.target.value })} inputMode="numeric" className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label htmlFor="demo-accname" className="text-sm font-semibold">Chủ tài khoản</label>
                <input id="demo-accname" value={data.accountName} onChange={(e) => onPatch({ accountName: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-full border px-6 py-3 font-semibold">← Quay lại chọn mẫu</button>
            <button type="button" onClick={() => setStep(3)} className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white hover:bg-[#5e1620]">Tiếp: quét QR nhận link →</button>
          </div>
        </div>
      )}

      {/* BƯỚC 3 — QR + link xịn */}
      {step === 3 && (
        <div className="mt-4">
          {isPaid ? (
            <div className="rounded-2xl border bg-green-50 p-4 text-center">
              <p className="font-bold text-green-900">✓ Đã nhận tiền — thiệp online đã mở!</p>
              <p className="mt-1 text-sm text-green-800">
                Mẫu đã trả: <strong>{paidTemplateId || data.templateId}</strong> • Link xịn dùng tới 30 ngày sau ngày cưới{validUntilText() ? ` (tới ${validUntilText()})` : ""}.
              </p>
              {paidLink && (
                <>
                  <label htmlFor="paid-link" className="mt-3 block text-sm font-semibold text-green-900">Link xịn — gửi cho khách (chỉ đọc, dữ liệu nằm trong link)</label>
                  <input id="paid-link" readOnly value={paidLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={copyPaidLink} className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white">Sao chép link xịn</button>
                    <a href={paidLink} target="_blank" rel="noreferrer" className="rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]">Mở link xịn</a>
                  </div>
                </>
              )}
              <p className="mt-3 text-xs text-green-800">Link riêng từng khách tạo ở trang Quản lý khách — chỉ tạo được khi thiệp đã trả tiền.</p>
            </div>
          ) : (
            <>
              {!isLocked && (
                <div className="rounded-2xl border bg-[#fdf8f1] p-4">
                  <p className="text-sm font-semibold text-[#7a1f2b]">Chưa chốt in — bấm nút dưới để đồng bộ + chốt in (xong vật lý), rồi hiện QR.</p>
                  <p className="mt-1 text-sm text-[#5a4a48]">Chốt in xong thì tên/ngày/giờ/địa điểm vật lý không sửa được nữa; vẫn sửa được mẫu online, ảnh, câu chuyện, lịch trình.</p>
                  <button type="button" onClick={syncAndLock} disabled={!!busy} className="mt-3 rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white disabled:opacity-50">
                    {busy || "Đồng bộ + chốt in để lấy QR"}
                  </button>
                </div>
              )}
              {isLocked && !pay && (
                <button type="button" onClick={() => fetchPay()} disabled={!!busy} className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white disabled:opacity-50">
                  {busy || "Lấy QR thanh toán 100.000đ"}
                </button>
              )}
              {pay && (
                <div className="mt-4 rounded-2xl border bg-white p-4 text-center">
                  <p className="font-bold text-[#7a1f2b]">Quét QR để mua thiệp online — {pay.amountText}</p>
                  <p className="mt-1 text-sm text-[#5a4a48]">Mẫu: <strong>{data.templateId}</strong> • 1 thiệp online = {formatVnd(ONLINE_PRICE_VND)}, mọi mẫu cùng giá.</p>
                  {pay.configured && pay.qrUrl ? (
                    <>
                      <img src={pay.qrUrl} alt={`QR trả tiền mua thiệp online ${pay.amountText}, nội dung ${pay.memo}`} loading="lazy" className="mx-auto mt-3 h-56 w-56 rounded-2xl border object-contain" />
                      <p className="mt-2 text-sm">{pay.accountName} • {pay.bankCode} • {pay.accountNumber}</p>
                      <p className="mt-1 text-sm">Nội dung chuyển khoản: <strong>{pay.memo}</strong></p>
                      <button type="button" onClick={copyMemo} className="mt-3 rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]">Sao chép mã thanh toán</button>
                      <div className="mt-4">
                        <button type="button" onClick={checkPaid} disabled={!!busy} className="rounded-full bg-[#7a1f2b] px-6 py-3 font-semibold text-white disabled:opacity-50">
                          {busy || "Tôi đã chuyển — kiểm tra"}
                        </button>
                        <p className="mt-2 text-xs text-[#7a6a68]">Chuyển đúng số tiền + đúng nội dung thì SePay báo về, thiệp tự mở — không cần ai bấm gì. Trả thiếu thì không mở; trả thừa vẫn mở, không hoàn tự động.</p>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
                      {pay.error ?? "Chưa cấu hình tài khoản nhận tiền SePay — Thiết kế cần tạo tài khoản SePay + nối Vietcombank rồi điền key vào biến môi trường."}
                      {pay.memo ? <> Mã của thiệp này: <strong>{pay.memo}</strong></> : null}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {copied && <p className="mt-3 text-center text-sm text-green-800" role="status">{copied}</p>}
          {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
          <div className="mt-4">
            <button type="button" onClick={() => setStep(2)} className="rounded-full border px-6 py-3 font-semibold">← Quay lại thêm ảnh &amp; thông tin</button>
          </div>
        </div>
      )}
    </section>
  );
}
