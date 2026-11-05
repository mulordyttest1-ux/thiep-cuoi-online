"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { InvitationData } from "@/lib/types";
import { defaultInvitation } from "@/lib/types";
import { getTemplate, PRESET_PHOTOS, TEMPLATES } from "@/lib/templates";
import { buildShareUrl, copyText, loadInvitation, saveInvitation } from "@/lib/store";
import InvitationPreview from "@/components/InvitationPreview";
import { useLanguage } from "@/components/LanguageProvider";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border px-3 py-2";

function EditorInner() {
  const params = useSearchParams();
  const { dict: d } = useLanguage();
  const [data, setData] = useState<InvitationData>(() => defaultInvitation("minimal-do-do"));
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [notice, setNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [savedId, setSavedId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const appliedTemplate = useRef(false);

  // Nạp thiệp đã lưu, hoặc áp mẫu từ ?template= (giữ nguyên dữ liệu nếu đã có)
  useEffect(() => {
    try {
      const saved = loadInvitation();
      const tpl = params.get("template");
      if (saved) {
        setData(tpl && !appliedTemplate.current ? { ...saved, templateId: tpl } : saved);
        if (saved.id) setSavedId(saved.id);
      } else if (tpl) {
        setData(defaultInvitation(tpl));
      }
      appliedTemplate.current = true;
    } catch {
      // giữ thiệp mặc định
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") set("photoUrl", reader.result);
    };
    reader.onerror = () => setNotice("Không đọc được ảnh đã chọn. Hãy thử ảnh khác.");
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    try {
      const res = saveInvitation(data);
      setSavedId(res.id);
      setData((prev) => ({ ...prev, id: res.id }));
      setNotice(res.ok ? d.savedOk : d.savedFail);
      try {
        setShareLink(buildShareUrl(window.location.origin, { ...data, id: res.id }));
      } catch {
        setShareLink("");
      }
    } catch {
      setNotice(d.savedFail);
    }
  };

  const onCopy = async () => {
    try {
      const link = shareLink || buildShareUrl(window.location.origin, { ...data, id: savedId || "demo" });
      const res = await copyText(link);
      setShareLink(link);
      setNotice(res.ok ? d.copied : d.copyFail);
    } catch {
      setNotice(d.copyFail);
    }
  };

  // Nút "Mở trang thiệp" PHẢI mở trang khách render đúng mẫu đang chọn.
  // Trước đây nó là link trần tới /thiep/${savedId || "demo"} không kèm dữ
  // liệu: nếu chưa lưu (hoặc khác trình duyệt) trang khách rơi về thiệp
  // demo mẫu mặc định, không phải Song Phụng Đỏ. Nay nút tự tạo link chia
  // sẻ kèm dữ liệu hiện tại trong ?d= (base64url JSON, mở được máy khác)
  // rồi điều hướng tới đó — cùng định dạng với nút "Sao chép link".
  const onOpenCard = () => {
    try {
      window.location.href = buildShareUrl(window.location.origin, { ...data, id: savedId || "demo" });
    } catch {
      window.location.href = `/thiep/${savedId || "demo"}`;
    }
  };

  const form = (
    <div className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <Field label="Chọn mẫu (đổi mẫu giữ nguyên toàn bộ dữ liệu)" id="tpl-select">
        <select id="tpl-select" value={data.templateId} onChange={(e) => set("templateId", e.target.value)} className={inputCls}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name} — {t.styleLabel}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[#7a6a68]">{getTemplate(data.templateId).pattern}</p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên chú rể *" id="groom"><input id="groom" required value={data.groomName} onChange={(e) => set("groomName", e.target.value)} className={inputCls} /></Field>
        <Field label="Tên cô dâu *" id="bride"><input id="bride" required value={data.brideName} onChange={(e) => set("brideName", e.target.value)} className={inputCls} /></Field>
        <Field label="Bố chú rể" id="gf"><input id="gf" value={data.groomFather} onChange={(e) => set("groomFather", e.target.value)} className={inputCls} /></Field>
        <Field label="Mẹ chú rể" id="gm"><input id="gm" value={data.groomMother} onChange={(e) => set("groomMother", e.target.value)} className={inputCls} /></Field>
        <Field label="Bố cô dâu" id="bf"><input id="bf" value={data.brideFather} onChange={(e) => set("brideFather", e.target.value)} className={inputCls} /></Field>
        <Field label="Mẹ cô dâu" id="bm"><input id="bm" value={data.brideMother} onChange={(e) => set("brideMother", e.target.value)} className={inputCls} /></Field>
      </div>

      {/* Thứ bậc + địa chỉ gia đình mỗi bên (mẫu Song Phụng Đỏ, vòng 10–11):
          thứ bậc hiện dưới tên lớn ("Út Nam"/"Út Nữ"), địa chỉ hiện dưới tên
          cha mẹ trong khối THÔNG TIN. Để trống thì không hiện (bản gốc cũng
          vậy). Preview cập nhật ngay khi gõ. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thứ bậc chú rể" id="gbo"><input id="gbo" value={data.groomBirthOrder ?? ""} onChange={(e) => set("groomBirthOrder", e.target.value)} placeholder="Vd: Út Nam" className={inputCls} /></Field>
        <Field label="Thứ bậc cô dâu" id="bbo"><input id="bbo" value={data.brideBirthOrder ?? ""} onChange={(e) => set("brideBirthOrder", e.target.value)} placeholder="Vd: Út Nữ" className={inputCls} /></Field>
        <Field label="Địa chỉ nhà trai" id="gpa"><input id="gpa" value={data.groomParentsAddress ?? ""} onChange={(e) => set("groomParentsAddress", e.target.value)} placeholder="Vd: 12 Ngõ 34 Phố Huế, Hai Bà Trưng, Hà Nội" className={inputCls} /></Field>
        <Field label="Địa chỉ nhà gái" id="bpa"><input id="bpa" value={data.brideParentsAddress ?? ""} onChange={(e) => set("brideParentsAddress", e.target.value)} placeholder="Vd: 56 Đường Xuân Thủy, Cầu Giấy, Hà Nội" className={inputCls} /></Field>
      </div>

      <Field label="Tiêu đề lễ thành hôn (mẫu Song Phụng Đỏ)" id="cheader">
        <textarea id="cheader" rows={2} value={data.ceremonyHeader ?? ""} onChange={(e) => set("ceremonyHeader", e.target.value)} placeholder="Vd: LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI / TƯ GIA" className={inputCls} />
        <p className="mt-1 text-xs text-[#7a6a68]">Để trống: dùng dòng mặc định của mẫu (“LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI / TƯ GIA”).</p>
      </Field>

      {/* Dress code (mẫu Song Phụng Đỏ, vòng 12): bản gốc hiện mục này với 3
          màu mẫu; nhập các mã màu cách nhau bằng dấu phẩy. Để trống thì ẩn
          mục Dress Code. */}
      <Field label="Dress code — màu trang phục (mẫu Song Phụng Đỏ)" id="dresscode">
        <input id="dresscode" value={data.dressCode ?? ""} onChange={(e) => set("dressCode", e.target.value)} placeholder="Vd: #651212, #8d3a3a, #ffb2b2" className={inputCls} />
        <p className="mt-1 text-xs text-[#7a6a68]">Nhập các mã màu cách nhau bằng dấu phẩy. Để trống: ẩn mục Dress Code.</p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ngày cưới *" id="date"><input id="date" type="date" required value={data.date} onChange={(e) => set("date", e.target.value)} className={inputCls} /></Field>
        <Field label="Giờ *" id="time"><input id="time" type="time" required value={data.time} onChange={(e) => set("time", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa điểm *" id="venue"><input id="venue" required value={data.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa chỉ *" id="address"><input id="address" required value={data.address} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
      </div>

      <Field label="Lời mời" id="message">
        <textarea id="message" rows={4} value={data.message} onChange={(e) => set("message", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Câu chuyện tình yêu" id="story">
        <textarea id="story" rows={4} value={data.story} onChange={(e) => set("story", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Lịch trình (mỗi dòng: HH:MM - Nội dung)" id="schedule">
        <textarea id="schedule" rows={4} value={data.scheduleText} onChange={(e) => set("scheduleText", e.target.value)} className={inputCls} />
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold">Ảnh cưới</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_PHOTOS.map((p) => (
            <button key={p.url} type="button" onClick={() => set("photoUrl", p.url)} aria-pressed={data.photoUrl === p.url} className={`overflow-hidden rounded-xl border-2 ${data.photoUrl === p.url ? "border-[#7a1f2b]" : "border-transparent"}`}>
              <img src={p.url} alt={p.label} loading="lazy" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="photo-url" className="text-sm font-semibold">Hoặc dán URL ảnh</label>
            <input id="photo-url" value={data.photoUrl.startsWith("data:") ? "" : data.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://…" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="photo-file" className="text-sm font-semibold">Hoặc tải ảnh từ máy lên</label>
            <input ref={fileRef} id="photo-file" type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} className={`${inputCls} mt-1`} />
            <p className="mt-1 text-xs text-[#7a6a68]">Ảnh tải lên được chuyển thành dataURL và lưu cùng thiệp trên trình duyệt này.</p>
          </div>
        </div>
      </fieldset>

      <Field label="Ngôn ngữ thiệp" id="inv-lang">
        <select id="inv-lang" value={data.language} onChange={(e) => set("language", e.target.value as InvitationData["language"])} className={inputCls}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
          <option value="both">Song ngữ (hiển thị tiếng Việt chính)</option>
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold">Thông tin mừng cưới (VietQR)</legend>
        <p className="mt-1 text-xs text-[#7a6a68]">Nhập mã ngân hàng dạng viết tắt (VD: VCB, TCB, MB, ACB) và số tài khoản — thiệp sẽ hiển thị QR VietQR thật. Để trống là không hiển thị phần mừng cưới.</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="bank" className="text-sm font-semibold">Mã ngân hàng</label>
            <input id="bank" value={data.bankCode} onChange={(e) => set("bankCode", e.target.value)} placeholder="VD: VCB" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="acc" className="text-sm font-semibold">Số tài khoản</label>
            <input id="acc" value={data.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} inputMode="numeric" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label htmlFor="accname" className="text-sm font-semibold">Chủ tài khoản</label>
            <input id="accname" value={data.accountName} onChange={(e) => set("accountName", e.target.value)} className={`${inputCls} mt-1`} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={onSave} className="rounded-full bg-[#7a1f2b] px-5 py-3 font-semibold text-white hover:bg-[#5e1620]">{d.saveCard}</button>
        <button type="button" onClick={onCopy} className="rounded-full border-2 border-[#7a1f2b] px-5 py-3 font-semibold text-[#7a1f2b]">{d.copyLink}</button>
        <button type="button" onClick={onOpenCard} className="rounded-full border px-5 py-3 font-semibold">{d.openCard}</button>
      </div>
      {notice && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
      {shareLink && (
        <div>
          <label htmlFor="share-link" className="text-sm font-semibold">Link chia sẻ (kèm dữ liệu trong ?d=, mở được trên máy khác)</label>
          <input id="share-link" readOnly value={shareLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-[#fdf8f1]`} />
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-[#7a1f2b]">{d.editorTitle}</h1>
      <p className="mt-2 text-[#5a4a48]">{d.editorSub}</p>

      <div className="mt-6 flex gap-2 lg:hidden" role="tablist" aria-label="Chuyển giữa form và xem trước">
        <button type="button" role="tab" aria-selected={tab === "form"} onClick={() => setTab("form")} className={`flex-1 rounded-full py-2.5 font-semibold ${tab === "form" ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}>Form nhập liệu</button>
        <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={`flex-1 rounded-full py-2.5 font-semibold ${tab === "preview" ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}>Xem trước</button>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <div className={tab === "form" ? "block" : "hidden lg:block"}>{form}</div>
        <div className={`${tab === "preview" ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}>
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#7a6a68]">Xem trước trực tiếp</p>
          <InvitationPreview data={data} />
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-10">Đang tải editor…</p>}>
      <EditorInner />
    </Suspense>
  );
}
