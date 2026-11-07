"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { InvitationData } from "@/lib/types";
import { defaultInvitation } from "@/lib/types";
import { getTemplate, PRESET_PHOTOS, TEMPLATES } from "@/lib/templates";
import { buildCustomerEditUrl, buildShareUrl, copyText, decodeShare, loadInvitation, saveInvitation } from "@/lib/store";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock, parseCepGhostText, parseCepPlainText } from "@/lib/cep";
import InvitationPreview from "@/components/InvitationPreview";
import AdminGate from "@/components/AdminGate";
import OnlineDemoWizard from "@/components/OnlineDemoWizard";
import SvgTemplateSection from "@/components/SvgTemplateSection";
import { decodeSvgShare, type SvgSharePayload } from "@/lib/svg-template";
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
  const [editLink, setEditLink] = useState("");
  const [cepNotice, setCepNotice] = useState("");
  const [importText, setImportText] = useState("");
  const [importMeta, setImportMeta] = useState("");
  const [plainImportText, setPlainImportText] = useState("");
  // Link khách chốt xong gửi lại (?d= dạng mẫu SVG): dữ liệu áp vào form,
  // mẫu SVG thì mục "Mẫu thiệp SVG" tự chọn.
  const [svgPayload, setSvgPayload] = useState<SvgSharePayload | null>(null);
  // Trạng thái máy chủ (luồng khóa + thanh toán): link xem trước / link
  // khách / QR trả tiền đều do máy chủ cấp, không nằm trong ?d= nữa.
  const [serverId, setServerId] = useState("");
  const [serverStatus, setServerStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [serverEditUrl, setServerEditUrl] = useState("");
  const [customerEditUrl, setCustomerEditUrl] = useState("");
  const [guestUrl, setGuestUrl] = useState("");
  const [payInfo, setPayInfo] = useState<{ amountText: string; memo: string; qrUrl: string | null; configured: boolean; error?: string } | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [panelNotice, setPanelNotice] = useState("");
  // Đối soát tay (chỉ Nancy): khách đã chuyển tiền thật nhưng sai mã /
  // webhook lỗi — nhập mã giao dịch SePay + lý do để mở khóa, có log.
  const [reconcileRef, setReconcileRef] = useState("");
  const [reconcileReason, setReconcileReason] = useState("");
  const [reconcileNotice, setReconcileNotice] = useState("");
  // Đã chốt in / đã trả tiền thì editor chỉ đọc (mở khóa mới sửa được).
  const readOnly = serverStatus === "locked_for_print" || serverStatus === "paid_online";
  const fileRef = useRef<HTMLInputElement>(null);
  const appliedTemplate = useRef(false);

  // Nạp thiệp đã lưu, hoặc áp mẫu từ ?template= (giữ nguyên dữ liệu nếu đã có).
  // ?d= (link cho khách sửa) thắng bản lưu: mở link là thấy đúng dữ liệu
  // trong link, kể cả trên máy chưa từng lưu thiệp này.
  useEffect(() => {
    try {
      // Link cho khách sửa qua MÁY CHỦ (?edit=<id>&t=<token>): dữ liệu lấy
      // từ máy chủ, không nằm trong ?d=. Chỉ sửa được khi còn draft/preview.
      const editId = params.get("edit");
      const editToken = params.get("t");
      if (editId && editToken) {
        fetch(`/api/invitations/${encodeURIComponent(editId)}?kind=edit&t=${encodeURIComponent(editToken)}`)
          .then(async (r) => ({ ok: r.ok, j: (await r.json()) as Record<string, unknown> }))
          .then(({ ok, j }) => {
            if (ok && j.ok) {
              setData(j.data as InvitationData);
              if (typeof j.status === "string") setServerStatus(j.status);
              setSavedId(editId);
              setServerId(editId);
            } else {
              setNotice(
                j.reason === "locked"
                  ? "Thiệp đã chốt in — chỉ đọc, không sửa được nữa. Nhờ Nancy mở khóa nếu cần sửa."
                  : "Link sửa không hợp lệ. Xin Nancy gửi lại link sửa mới."
              );
              if (typeof j.status === "string") setServerStatus(j.status);
              setSavedId(editId);
              setServerId(editId);
            }
            appliedTemplate.current = true;
          })
          .catch(() => setNotice("Không tải được thiệp từ máy chủ. Kiểm tra mạng rồi thử lại."));
        return;
      }
      // Link xem trước cũ (/xem-thu) nay chuyển tới mục demo online ở đây
      // (?demo=<id>&t=<token>): tải dữ liệu qua link xem trước rồi cuộn
      // xuống mục "Xem demo thiệp online".
      const demoId = params.get("demo");
      const demoToken = params.get("t");
      if (demoId && demoToken) {
        fetch(`/api/invitations/${encodeURIComponent(demoId)}?kind=preview&t=${encodeURIComponent(demoToken)}`)
          .then(async (r) => ({ ok: r.ok, j: (await r.json()) as Record<string, unknown> }))
          .then(({ ok, j }) => {
            if (ok && j.ok) {
              setData(j.data as InvitationData);
              if (typeof j.status === "string") setServerStatus(j.status);
              setSavedId(demoId);
              setServerId(demoId);
              setNotice("Link xem trước cũ đã chuyển tới mục demo online bên dưới.");
              window.setTimeout(() => {
                document.getElementById("demo-online")?.scrollIntoView({ behavior: "smooth" });
              }, 300);
            } else {
              setNotice(
                j.reason === "paid"
                  ? "Thiệp này đã được mua online — mở link khách chính thức, không dùng link xem trước nữa."
                  : "Link xem trước không hợp lệ. Xin Nancy gửi lại link mới."
              );
              setSavedId(demoId);
              setServerId(demoId);
            }
            appliedTemplate.current = true;
          })
          .catch(() => setNotice("Không tải được thiệp từ máy chủ. Kiểm tra mạng rồi thử lại."));
        return;
      }
      const dParam = params.get("d");
      if (dParam) {
        // Link mẫu SVG (?d= dạng v:1): dữ liệu áp thẳng vào form, mẫu SVG
        // thì mục "Mẫu thiệp SVG" tự chọn. decodeShare thường sẽ trả null
        // với dạng này nên thử SVG trước.
        const svgP = decodeSvgShare(dParam);
        if (svgP) {
          setSvgPayload(svgP);
          setData(svgP.data);
          if (svgP.data.id) setSavedId(svgP.data.id);
          appliedTemplate.current = true;
          return;
        }
        const decoded = decodeShare(dParam);
        if (decoded) {
          setData(decoded);
          if (decoded.id) setSavedId(decoded.id);
          appliedTemplate.current = true;
          return;
        }
      }
      const saved = loadInvitation();
      const tpl = params.get("template");
      if (saved) {
        setData(tpl && !appliedTemplate.current ? { ...saved, templateId: tpl } : saved);
        if (saved.id) {
          setSavedId(saved.id);
          // Thiệp này đã từng đưa lên máy chủ chưa? Nếu đã chốt thì editor chỉ đọc.
          fetch(`/api/invitations?id=${encodeURIComponent(saved.id)}`)
            .then((r) => r.json())
            .then((j: Record<string, unknown>) => {
              if (j.exists) {
                setServerId(saved.id);
                if (typeof j.status === "string") setServerStatus(j.status);
              }
            })
            .catch(() => undefined);
        }
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

  // Link cho khách sửa: mở TRANG KHÁCH /khach/<id> (chỉ thấy mẫu form in,
  // layout trần) kèm dữ liệu trong ?d=. Khách KHÔNG ĐƯỢC thấy trình sửa.
  // Đã có bản ghi máy chủ thì ưu tiên link khách trên máy chủ
  // (customerEditUrl, /khach/<id>?t=...).
  const onCopyEditLink = async () => {
    try {
      const id = data.id || savedId || "demo";
      const link = customerEditUrl || buildCustomerEditUrl(window.location.origin, { ...data, id });
      const res = await copyText(link);
      setEditLink(link);
      setNotice(res.ok ? "Đã sao chép link cho khách sửa." : "Không sao chép được link. Hãy thử lại.");
    } catch {
      setNotice("Không tạo được link cho khách sửa.");
    }
  };

  // --- Panel máy chủ: gửi khách duyệt in / chốt in / mở khóa / QR trả tiền ---
  const adminHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(adminToken ? { "x-admin-token": adminToken } : {}),
  });

  const syncToServer = async () => {
    try {
      setPanelNotice("Đang đồng bộ lên máy chủ…");
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ data: { ...data, id: savedId || undefined } }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) {
        setPanelNotice(typeof j.error === "string" ? j.error : "Không đồng bộ được.");
        return;
      }
      const id = String(j.id ?? "");
      setServerId(id);
      setSavedId(id);
      setData((prev) => ({ ...prev, id }));
      if (typeof j.status === "string") setServerStatus(j.status);
      setPreviewUrl(String(j.previewUrl ?? ""));
      setServerEditUrl(String(j.editUrl ?? ""));
      setCustomerEditUrl(String(j.customerEditUrl ?? ""));
      setPanelNotice("Đã đồng bộ. Link xem trước bên dưới không có link khách — gửi cho khách duyệt in.");
    } catch {
      setPanelNotice("Không kết nối được máy chủ.");
    }
  };

  const lockServer = async () => {
    if (!serverId) { setPanelNotice("Đồng bộ lên máy chủ trước rồi mới chốt in."); return; }
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(serverId)}/lock`, { method: "POST", headers: adminHeaders() });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) { setPanelNotice(typeof j.error === "string" ? j.error : "Không chốt được."); return; }
      if (typeof j.status === "string") setServerStatus(j.status);
      setPanelNotice("Đã chốt in xong vật lý. Khách mua thiệp online ở mục “Xem demo thiệp online” bên dưới (chọn mẫu → quét QR 100k → nhận link xịn).");
      await fetchPay();
    } catch {
      setPanelNotice("Không kết nối được máy chủ.");
    }
  };

  const unlockServer = async () => {
    if (!serverId) { setPanelNotice("Chưa có thiệp trên máy chủ."); return; }
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(serverId)}/unlock`, { method: "POST", headers: adminHeaders() });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) { setPanelNotice(typeof j.error === "string" ? j.error : "Không mở khóa được."); return; }
      if (typeof j.status === "string") setServerStatus(j.status);
      setPanelNotice(typeof j.note === "string" ? j.note : "Đã mở khóa.");
    } catch {
      setPanelNotice("Không kết nối được máy chủ.");
    }
  };

  const fetchPay = async () => {
    const id = serverId || savedId;
    if (!id) { setPanelNotice("Đồng bộ lên máy chủ trước."); return; }
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(id)}/payment?template=${encodeURIComponent(data.templateId)}`);
      const j = (await res.json()) as Record<string, unknown>;
      if (j.alreadyPaid) {
        setGuestUrl(String(j.guestUrl ?? ""));
        if (typeof j.status === "string") setServerStatus(j.status);
        setPanelNotice("Thiệp đã được mua online — link khách chính thức ở bên dưới.");
        return;
      }
      setPayInfo({
        amountText: String(j.amountText ?? ""),
        memo: String(j.memo ?? ""),
        qrUrl: (j.qrUrl as string | null) ?? null,
        configured: Boolean(j.configured ?? j.ok),
        error: j.error as string | undefined,
      });
      setPanelNotice(j.configured ? "QR trả tiền đã sẵn sàng." : "Chưa cấu hình tài khoản nhận tiền SePay.");
    } catch {
      setPanelNotice("Không lấy được QR thanh toán.");
    }
  };

  // Đối soát tay (CHỈ Nancy, cần token admin): khách đã chuyển tiền thật
  // nhưng sai nội dung / webhook lỗi — nhập mã giao dịch SePay + lý do để
  // mở khóa, có log. KHÔNG có nút "đã thu tiền mặt".
  const reconcileServer = async () => {
    if (!serverId) { setReconcileNotice("Đồng bộ lên máy chủ trước."); return; }
    if (!reconcileRef.trim()) { setReconcileNotice("Nhập mã giao dịch SePay (mã trên sao kê / trong app SePay)."); return; }
    if (!reconcileReason.trim()) { setReconcileNotice("Nhập lý do đối soát (vd: khách chuyển sai mã, webhook không về)."); return; }
    try {
      setReconcileNotice("Đang đối soát…");
      const res = await fetch(`/api/invitations/${encodeURIComponent(serverId)}/reconcile`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ ref: reconcileRef.trim(), reason: reconcileReason.trim(), templateId: data.templateId }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) { setReconcileNotice(typeof j.error === "string" ? j.error : "Không đối soát được."); return; }
      if (typeof j.status === "string") setServerStatus(j.status);
      setReconcileNotice(`Đã mở khóa bằng đối soát tay (mã ${String(j.paidRef ?? reconcileRef)}). Link xịn ở mục “Xem demo thiệp online” bên dưới.`);
      setReconcileRef("");
      setReconcileReason("");
    } catch {
      setReconcileNotice("Không kết nối được máy chủ.");
    }
  };

  const onCopyCep = async (text: string, okMsg: string) => {
    const res = await copyText(text);
    setCepNotice(res.ok ? okMsg : "Không sao chép được. Hãy bôi đen rồi copy thủ công.");
  };

  // Nhập từ Illustrator: điền vào form + xem trước, KHÔNG tự lưu (chỉ lưu
  // khi bấm "Lưu thiệp" như mọi khi).
  const onImportGhost = () => {
    const res = parseCepGhostText(importText, importMeta);
    if (!res.ok) {
      setCepNotice(res.error);
      return;
    }
    // Mẫu chuẩn #1: sau khi paste điền form, mẫu mặc định là song-phung-do
    // (mẫu chuẩn) thay vì minimal-do-do; đã chọn mẫu khác thì giữ nguyên.
    const useStandard = data.templateId === "minimal-do-do";
    setData((prev) => ({
      ...prev,
      ...res.data,
      templateId: useStandard ? "song-phung-do" : prev.templateId,
    }));
    setCepNotice(
      useStandard
        ? "Đã điền dữ liệu từ Illustrator — mẫu chuẩn #1 (Song Phụng Đỏ) đã được chọn, kiểm tra lại rồi bấm Lưu thiệp."
        : "Đã điền dữ liệu từ Illustrator — kiểm tra lại rồi bấm Lưu thiệp."
    );
  };

  const onImportPlain = () => {
    const res = parseCepPlainText(plainImportText);
    if (!res.ok) {
      setCepNotice(res.error);
      return;
    }
    setData((prev) => ({ ...prev, ...res.data }));
    setCepNotice("Đã điền dữ liệu từ khối chữ thường — kiểm tra lại rồi bấm Lưu thiệp.");
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
        <Field label="Ngày tiệc *" id="date"><input id="date" type="date" required value={data.date} onChange={(e) => set("date", e.target.value)} className={inputCls} /></Field>
        <Field label="Giờ tiệc *" id="time"><input id="time" type="time" required value={data.time} onChange={(e) => set("time", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa điểm *" id="venue"><input id="venue" required value={data.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa chỉ *" id="address"><input id="address" required value={data.address} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
      </div>

      {/* Thông tin lễ (cho nối Illustrator/CEP): lễ có thể khác ngày/giờ
          tiệc; loại lễ + nhà chủ tiệc quyết định bên nào đứng trước trong
          khối chữ xuất sang (pos1 = nhà chủ tiệc). Ngày/giờ lễ mặc định
          bằng ngày/giờ tiệc — sửa khi lễ khác ngày tiệc. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Loại lễ" id="ctype">
          <select id="ctype" value={data.ceremonyType ?? "Thành Hôn"} onChange={(e) => set("ceremonyType", e.target.value as InvitationData["ceremonyType"])} className={inputCls}>
            <option value="Thành Hôn">Thành Hôn</option>
            <option value="Vu Quy">Vu Quy</option>
            <option value="Tân Hôn">Tân Hôn</option>
            <option value="Báo Hỷ">Báo Hỷ</option>
          </select>
        </Field>
        <Field label="Nhà chủ tiệc" id="htype">
          <select id="htype" value={data.hostType ?? "Nhà Trai"} onChange={(e) => set("hostType", e.target.value as InvitationData["hostType"])} className={inputCls}>
            <option value="Nhà Trai">Nhà Trai</option>
            <option value="Nhà Gái">Nhà Gái</option>
          </select>
        </Field>
        <Field label="Ngày làm lễ" id="cdate"><input id="cdate" type="date" value={data.ceremonyDate ?? data.date} onChange={(e) => set("ceremonyDate", e.target.value || undefined)} className={inputCls} /></Field>
        <Field label="Giờ làm lễ" id="ctime"><input id="ctime" type="time" value={data.ceremonyTime ?? data.time} onChange={(e) => set("ceremonyTime", e.target.value || undefined)} className={inputCls} /></Field>
        <Field label="Nơi làm lễ" id="cvenue"><input id="cvenue" value={data.ceremonyVenue ?? ""} onChange={(e) => set("ceremonyVenue", e.target.value)} placeholder="Vd: Nhà Thờ Giáo Xứ Vinh Hà" className={inputCls} /></Field>
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
        <button type="button" onClick={onCopyEditLink} className="rounded-full border px-5 py-3 font-semibold">Sao chép link cho khách sửa</button>
      </div>
      {notice && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
      {shareLink && (
        <div>
          <label htmlFor="share-link" className="text-sm font-semibold">Link chia sẻ (kèm dữ liệu trong ?d=, mở được trên máy khác)</label>
          <input id="share-link" readOnly value={shareLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-[#fdf8f1]`} />
        </div>
      )}
      {editLink && (
        <div>
          <label htmlFor="edit-link" className="text-sm font-semibold">Link cho khách sửa (mở trang khách — mẫu form in, kèm dữ liệu trong ?d=)</label>
          <input id="edit-link" readOnly value={editLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-[#fdf8f1]`} />
        </div>
      )}

    </div>
  );

  // Panel máy chủ — render NGOÀI fieldset chỉ-đọc: khi đã chốt in, các nút
  // Mở khóa / Đối soát tay / Lấy QR vẫn phải bấm được (fieldset disabled
  // sẽ khóa hết nút con bên trong nó).
  const serverPanel = (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      {/* Gửi khách duyệt in + khóa + thanh toán (máy chủ quyết định).
          Luồng v3-final: Đồng bộ -> gửi link xem trước cho khách duyệt in ->
          Chốt in (chỉ đọc nội dung vật lý, demo online vẫn sửa được trường
          online) -> khách mua online ở mục "Xem demo thiệp online" bên dưới
          (chọn mẫu -> quét QR 100k -> nhận link xịn) -> link khách chính
          thức mở. Chưa trả tiền thì không bao giờ tạo được link khách. */}
      <section className="rounded-2xl border bg-[#fdf8f1] p-4" aria-label="Gửi khách duyệt in và thanh toán">
        <h2 className="text-base font-bold text-[#7a1f2b]">Gửi khách duyệt in &amp; bán thiệp online</h2>
        <p className="mt-1 text-sm text-[#5a4a48]">
          Trạng thái hiện tại: <strong>{serverStatus ? ({ draft: "Nháp", preview_for_print: "Đang gửi khách duyệt in", locked_for_print: "Đã chốt in — chỉ đọc", paid_online: "Đã trả tiền — thiệp online đang mở" } as Record<string, string>)[serverStatus] ?? serverStatus : "chưa đưa lên máy chủ"}</strong>
          {readOnly ? " — editor đang chỉ đọc, bấm “Mở khóa để sửa” mới sửa được." : ""}
        </p>
        <div className="mt-3">
          <label htmlFor="admin-token" className="text-sm font-semibold">Token admin (THIEP_ADMIN_TOKEN — để trống khi chạy local)</label>
          <input id="admin-token" type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Nhập token admin nếu đã đặt" className={`${inputCls} mt-1 bg-white`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={syncToServer} className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]">Đồng bộ + tạo link xem trước</button>
          <button type="button" onClick={lockServer} disabled={!serverId} className="rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b] disabled:opacity-40">Chốt in (khóa chỉ đọc)</button>
          <button type="button" onClick={unlockServer} disabled={!serverId || !readOnly} className="rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-40">Mở khóa để sửa</button>
          <button type="button" onClick={fetchPay} disabled={!serverId && !savedId} className="rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-40">Lấy QR trả tiền / link khách</button>
        </div>
        {panelNotice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{panelNotice}</p>}
        {previewUrl && (
          <div className="mt-3">
            <label htmlFor="preview-url" className="text-sm font-semibold">Link xem trước cho khách duyệt in (không có link khách)</label>
            <input id="preview-url" readOnly value={previewUrl} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <button type="button" onClick={async () => { const r = await copyText(previewUrl); setPanelNotice(r.ok ? "Đã sao chép link xem trước." : "Không sao chép được."); }} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép link xem trước</button>
          </div>
        )}
        {serverEditUrl && (
          <div className="mt-3">
            <label htmlFor="server-edit-url" className="text-sm font-semibold">Link cho khách sửa (qua máy chủ, không lộ dữ liệu trong link)</label>
            <input id="server-edit-url" readOnly value={serverEditUrl} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          </div>
        )}
        {customerEditUrl && (
          <div className="mt-3">
            <label htmlFor="customer-edit-url" className="text-sm font-semibold">Link khách sửa mẫu chuẩn #1 (chỉ thấy thiệp — gửi link này cho khách)</label>
            <input id="customer-edit-url" readOnly value={customerEditUrl} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <button type="button" onClick={async () => { const r = await copyText(customerEditUrl); setPanelNotice(r.ok ? "Đã sao chép link khách sửa mẫu chuẩn." : "Không sao chép được."); }} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép link khách sửa</button>
          </div>
        )}
        {payInfo && (
          <div className="mt-4 rounded-xl border bg-white p-4 text-center">
            <p className="font-semibold text-[#7a1f2b]">QR mua thiệp online — {payInfo.amountText}</p>
            {payInfo.configured && payInfo.qrUrl ? (
              <>
                <img src={payInfo.qrUrl} alt={`QR trả tiền mua thiệp online ${payInfo.amountText}, nội dung ${payInfo.memo}`} loading="lazy" className="mx-auto mt-3 h-48 w-48 rounded-2xl border object-contain" />
                <p className="mt-2 text-sm">Nội dung chuyển khoản: <strong>{payInfo.memo}</strong></p>
                <p className="mt-1 text-xs text-[#7a6a68]">Khách chuyển đúng số tiền + đúng mã thì thiệp tự mở qua webhook SePay.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-amber-900">{payInfo.error ?? "Chưa cấu hình tài khoản nhận tiền SePay."}</p>
            )}
          </div>
        )}
        {guestUrl && (
          <div className="mt-3">
            <label htmlFor="guest-url" className="text-sm font-semibold">Link khách chính thức (đã trả tiền) — gửi cho khách sau khi họ trả tiền</label>
            <input id="guest-url" readOnly value={guestUrl} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <p className="mt-1 text-xs text-[#7a6a68]">Link riêng từng khách tạo ở trang Quản lý khách — chỉ tạo được khi thiệp đã trả tiền.</p>
          </div>
        )}
        {/* Đối soát tay — CHỈ Nancy (cần token admin): khách đã chuyển tiền
            thật nhưng sai nội dung / webhook lỗi. Cần mã giao dịch SePay +
            lý do, có log. Không có nút "đã thu tiền mặt". */}
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-bold text-[#7a1f2b]">Đối soát tay (chỉ Nancy)</h3>
          <p className="mt-1 text-xs text-[#5a4a48]">Chỉ dùng khi khách đã chuyển tiền thật nhưng sai nội dung hoặc webhook không về. Cần mã giao dịch SePay + lý do — mỗi lần bấm đều ghi log.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="reconcile-ref" className="text-sm font-semibold">Mã giao dịch SePay *</label>
              <input id="reconcile-ref" value={reconcileRef} onChange={(e) => setReconcileRef(e.target.value)} placeholder="Vd: FT26011012345678" className={`${inputCls} mt-1 bg-white`} />
            </div>
            <div>
              <label htmlFor="reconcile-reason" className="text-sm font-semibold">Lý do *</label>
              <input id="reconcile-reason" value={reconcileReason} onChange={(e) => setReconcileReason(e.target.value)} placeholder="Vd: khách chuyển sai mã" className={`${inputCls} mt-1 bg-white`} />
            </div>
          </div>
          <button type="button" onClick={reconcileServer} disabled={!serverId} className="mt-3 rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b] disabled:opacity-40">Đối soát tay để mở khóa</button>
          {reconcileNotice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{reconcileNotice}</p>}
        </div>
      </section>
    </div>
  );

  // Mục CEP — cũng render ngoài fieldset chỉ-đọc để vẫn sao chép được khi đã chốt.
  const cepSection = (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      {/* Nối với Illustrator (CEP "Wedding Scripter") — chỉ phía app web.
          Xuất: 3 ô sao chép từ dữ liệu đang nhập. Nhập: dán đoạn từ
          Illustrator về để điền lại form (không tự lưu). */}
      <section className="rounded-2xl border bg-[#fdf8f1] p-4" aria-label="Nối với Illustrator">
        <h2 className="text-base font-bold text-[#7a1f2b]">Nối với Illustrator (CEP)</h2>
        <p className="mt-1 text-sm text-[#5a4a48]">
          Xuất dữ liệu sang Illustrator để in, hoặc nhập đoạn đã sửa trong Illustrator về form. Hai chiều dùng chung một chuẩn: chữ bọc bằng ký tự ẩn U+200B theo đúng thứ tự 32 trường của CEP.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="cep-ghost" className="text-sm font-semibold">Chữ có mã ẩn — dán vào text frame trong Illustrator</label>
            <textarea id="cep-ghost" readOnly rows={10} value={buildCepTextBlock(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <p className="mt-1 text-xs text-[#7a6a68]">Nhìn thì giống chữ thường, nhưng trong đó có ký tự ẩn U+200B bọc từng trường — script mới đọc được. Bấm sao chép rồi dán nguyên đoạn vào text frame.</p>
            <button type="button" onClick={() => onCopyCep(buildCepTextBlock(data), "Đã sao chép chữ có mã ẩn.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ có mã ẩn</button>
          </div>
          <div>
            <label htmlFor="cep-meta" className="text-sm font-semibold">Metadata — dán vào thuộc tính (note) của text frame</label>
            <input id="cep-meta" readOnly value={buildCepMetadataJson()} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <button type="button" onClick={() => onCopyCep(buildCepMetadataJson(), "Đã sao chép metadata.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép metadata</button>
          </div>
          <div>
            <label htmlFor="cep-plain" className="text-sm font-semibold">Chữ thường — dán vào ô nhập của panel CEP / để khách kiểm tra</label>
            <textarea id="cep-plain" readOnly rows={10} value={buildCepPlainText(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
            <button type="button" onClick={() => onCopyCep(buildCepPlainText(data), "Đã sao chép chữ thường.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ thường</button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-bold">Nhập từ Illustrator</h3>
          <p className="mt-1 text-sm text-[#5a4a48]">Sửa trong Illustrator xong thì copy cả đoạn trong text frame (kể cả chữ thường xen giữa, không cần xóa) rồi dán vào đây.</p>
          <label htmlFor="cep-import" className="mt-3 block text-sm font-semibold">Đoạn có mã ẩn (U+200B) copy từ Illustrator</label>
          <textarea id="cep-import" rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Dán đoạn chữ có mã ẩn vào đây…" className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          <label htmlFor="cep-import-meta" className="mt-3 block text-sm font-semibold">Metadata (tùy chọn — nếu dán thì app dùng đúng thứ tự khóa trong đó)</label>
          <input id="cep-import-meta" value={importMeta} onChange={(e) => setImportMeta(e.target.value)} placeholder='{"type":"stateful","keys":[...]}' className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          <button type="button" onClick={onImportGhost} className="mt-3 rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]">Điền vào form</button>

          <label htmlFor="cep-import-plain" className="mt-5 block text-sm font-semibold">Hoặc dán khối chữ thường (cùng bố cục trên)</label>
          <textarea id="cep-import-plain" rows={6} value={plainImportText} onChange={(e) => setPlainImportText(e.target.value)} placeholder="Dán khối chữ thường vào đây…" className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          <button type="button" onClick={onImportPlain} className="mt-3 rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]">Điền từ khối chữ thường</button>
        </div>
        {cepNotice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{cepNotice}</p>}
      </section>
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
        <fieldset disabled={readOnly} className={`m-0 min-w-0 border-0 p-0 ${tab === "form" ? "block" : "hidden lg:block"}`}>
          {readOnly && (
            <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
              Thiệp đã {serverStatus === "paid_online" ? "được mua online" : "chốt in"} — editor đang chỉ đọc. Bấm “Mở khóa để sửa” ở mục “Gửi khách duyệt in &amp; bán thiệp online” (cần token admin) mới sửa được.
            </p>
          )}
          {form}
        </fieldset>
        <div className={`${tab === "preview" ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}>
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#7a6a68]">Xem trước trực tiếp</p>
          <InvitationPreview data={data} />
        </div>
      </div>

      {/* Mục "Xem demo thiệp online" (v3-final): demo duy nhất đã đổ dữ liệu
          khách, blur tên/ngày/giờ/địa điểm, wizard 3 bước mua online. */}
      {serverPanel}
      {cepSection}
      <SvgTemplateSection data={data} initialPayload={svgPayload} />
      <OnlineDemoWizard
        data={data}
        onPatch={(patch) => setData((prev) => ({ ...prev, ...patch }))}
        serverId={serverId}
        serverStatus={serverStatus}
        adminToken={adminToken}
        onServerChange={(id, status) => { setServerId(id); setSavedId(id); setServerStatus(status); }}
      />
    </div>
  );
}

export default function CreatePage() {
  return (
    <AdminGate>
      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-10">Đang tải editor…</p>}>
        <EditorInner />
      </Suspense>
    </AdminGate>
  );
}
