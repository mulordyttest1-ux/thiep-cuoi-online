"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { InvitationData, StdEditField } from "@/lib/types";
import { emptyInvitation } from "@/lib/types";
import { getTemplate, PRESET_PHOTOS, TEMPLATES } from "@/lib/templates";
import { DEFAULT_PHYSICAL_FORM_ID } from "@/lib/physical-forms";
import { buildCustomerEditUrl, buildShareUrl, copyText, decodeCustomTexts, decodeShare, mergeImportedData, saveInvitation } from "@/lib/store";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock, effectiveCeremonyDate, parseCepGhostTextWithPlainFallback } from "@/lib/cep";
import { getDateParts } from "@/lib/lunar";
import { customTextDef, customTextValue, isCustomTextEdited, stdFieldLabel } from "@/lib/custom-texts";
import { compressImage } from "@/lib/image";
import InvitationPreview from "@/components/InvitationPreview";
import PrintFormPreview from "@/components/PrintFormPreview";
import AdminGate from "@/components/AdminGate";
import OnlineDemoWizard from "@/components/OnlineDemoWizard";
import SvgTemplateSection from "@/components/SvgTemplateSection";
import { CEREMONY_TYPE_OPTIONS, decodeSvgShare, HOST_TYPE_OPTIONS, VITHU_BRIDE_OPTIONS, VITHU_GROOM_OPTIONS, type SvgSharePayload } from "@/lib/svg-template";
import { useLanguage } from "@/components/LanguageProvider";
import { isPrintConfirmed, STATUS_LABEL, type InvitationStatus } from "@/lib/access";

/** Máy chủ đã cấu hình Supabase (biến public có sẵn ở client): lúc Lưu
 *  thiệp sẽ tự đồng bộ lên máy chủ để hộp "Link cho khách sửa" hiện link
 *  máy chủ (?t=). Chưa cấu hình thì giữ link ?d= như cũ. */
const SUPABASE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Mục thu gọn (2026-11-11): các mục ít dùng trên /tao-thiep mặc định đóng,
 *  bấm tiêu đề mới mở. Nội dung vẫn mount sẵn (chỉ ẩn bằng CSS) nên mọi
 *  nút/ô bên trong vẫn hoạt động khi mở ra, không mất state. `bare` dùng
 *  cho khối con bên trong một khung lớn (không thêm thẻ trắng ngoài). */
function Collapsible({
  title,
  hint,
  defaultOpen = false,
  bare = false,
  testId,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  bare?: boolean;
  testId?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={bare ? "mt-3" : "mt-6 rounded-2xl border bg-white p-5 shadow-sm"} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className={bare ? "text-sm font-bold text-[#7a1f2b]" : "text-base font-bold text-[#7a1f2b]"}>{title}</span>
        <span aria-hidden className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold text-[#7a1f2b]">
          {open ? "▾ Thu lại" : "▸ Mở"}
        </span>
      </button>
      {hint ? <p className="mt-1 text-sm text-[#5a4a48]">{hint}</p> : null}
      <div className={open ? "mt-3" : "hidden"}>{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border px-3 py-2";

/** Kiểu ô bấm trên form in (trường dữ liệu / câu mẫu) — cùng kiểu với CustomerStandardEditor. */
type PrintRect = { top: number; left: number; bottom: number; width: number };
type PrintSelection = { kind: "field"; field: StdEditField } | { kind: "custom"; key: string };

/** Trường thuộc về một bên gia đình — đang sửa trường này thì panel hiện thêm mục chọn nhà chủ tiệc (cùng kiểu CustomerStandardEditor). */
const FAMILY_FIELDS = new Set<StdEditField>([
  "groomName",
  "brideName",
  "groomFather",
  "groomMother",
  "brideFather",
  "brideMother",
  "groomBirthOrder",
  "brideBirthOrder",
  "groomParentsAddress",
  "brideParentsAddress",
]);

/** Câu mẫu sửa trong editor lưu ở localStorage theo mã thiệp (máy này) và
 *  gửi kèm khi đồng bộ lên máy chủ (POST /api/invitations nhận customTexts,
 *  upsert merge vào bản ghi — sửa 10/11/2026 sau lỗi dòng tên khách "Quý Gia
 *  Đình" chỉ hiện ở editor mà khách vẫn thấy dòng chấm). Mở bằng ?edit= thì
 *  lấy câu mẫu từ bản ghi máy chủ (khách sửa) khi có, không thì lấy bản
 *  editor đã lưu ở đây. */
const editorCustomTextsKey = (id: string) => `td_editor_custom_texts_${id}`;
const loadEditorCustomTexts = (id: string): Record<string, string> => {
  if (!id) return {};
  try {
    const raw = window.localStorage.getItem(editorCustomTextsKey(id));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

/** Chip chọn nhanh + mục "Khác" nhập tay (lấy ý từ SvgViewer / CustomerStandardEditor). */
function ChipOptions({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const inList = options.includes(value);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              setShowCustom(false);
              onPick(o);
            }}
            aria-pressed={value === o}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              value === o ? "border-[#7a1f2b] bg-[#7a1f2b] text-white" : "border-[#c9a86a] bg-white text-[#7a1f2b]"
            }`}
          >
            {o}
          </button>
        ))}
        {!inList && value.trim() !== "" && (
          <span className="rounded-full border border-[#7a1f2b] bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white">
            {value}
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowCustom((s) => !s)}
          className="rounded-full border border-dashed border-[#7a6a68] px-4 py-2 text-sm font-semibold text-[#5a4a48]"
        >
          Khác…
        </button>
      </div>
      {showCustom && (
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Nhập giá trị khác…"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              if (custom.trim()) {
                onPick(custom.trim());
                setCustom("");
                setShowCustom(false);
              }
            }}
            className="shrink-0 rounded-full bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white"
          >
            Chọn
          </button>
        </div>
      )}
    </div>
  );
}

function EditorInner() {
  const params = useSearchParams();
  const { dict: d } = useLanguage();
  // Editor mở ra từ TRỐNG (emptyInvitation): chưa dán dữ liệu thì form
  // trống, không hiện tên/ngày/màu/câu chuyện mẫu của cặp demo nào.
  const [data, setData] = useState<InvitationData>(() => emptyInvitation("minimal-do-do"));
  const [tab, setTab] = useState<"form" | "preview">("form");
  // Đường làm thiệp: VẬT LÝ (in) là đường chính của Nancy — dán ghost text
  // → chọn form vật lý → đổ dữ liệu → gửi link khách. ONLINE là đường riêng
  // (chọn mẫu online + demo + bán online). Mở link ?template= / ?demo= thì
  // mặc định sang online (link đó vốn thuộc đường online).
  const [mode, setMode] = useState<"physical" | "online">(() =>
    params.get("template") || params.get("demo") ? "online" : "physical"
  );
  const [notice, setNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [savedId, setSavedId] = useState("");
  const [editLink, setEditLink] = useState("");
  const [cepNotice, setCepNotice] = useState("");
  const [cepWarning, setCepWarning] = useState("");
  // Thông báo riêng cho mục xuất ghost text (khác thông báo nhập ở trên):
  // bấm sao chép ở mục xuất thì báo ngay tại đó, không hiện trùng 2 nơi.
  const [cepCopyNotice, setCepCopyNotice] = useState("");
  const [importText, setImportText] = useState("");
  const [importMeta, setImportMeta] = useState("");
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
  // Đồng bộ link khách trong hộp "Link cho khách sửa": lỗi hiện rõ trong
  // hộp, không lặng lẽ quay lại link ?d=.
  const [linkSyncBusy, setLinkSyncBusy] = useState(false);
  const [linkSyncError, setLinkSyncError] = useState("");
  const [guestUrl, setGuestUrl] = useState("");
  const [payInfo, setPayInfo] = useState<{ amountText: string; memo: string; qrUrl: string | null; configured: boolean; error?: string } | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [panelNotice, setPanelNotice] = useState("");
  // Đối soát tay (chỉ Nancy): khách đã chuyển tiền thật nhưng sai mã /
  // webhook lỗi — nhập mã giao dịch SePay + lý do để mở khóa, có log.
  const [reconcileRef, setReconcileRef] = useState("");
  const [reconcileReason, setReconcileReason] = useState("");
  const [reconcileNotice, setReconcileNotice] = useState("");
  // --- Sửa ngay trên form in (đường vật lý): bấm vào nội dung form thì box
  // sửa nổi ngay tại chỗ bấm, cùng kiểu CustomerStandardEditor. Câu mẫu
  // (tiêu đề lễ, tên khách, lời mời dự tiệc, câu kết) lưu riêng ở
  // customTexts — không trộn vào InvitationData hay ghost text.
  const [customTexts, setCustomTextsState] = useState<Record<string, string>>({});
  const customTextsRef = useRef(customTexts);
  const setCustomTexts = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: Record<string, string>) => Record<string, string>)(customTextsRef.current)
        : updater;
    customTextsRef.current = next;
    setCustomTextsState(next);
  };
  const [printSel, setPrintSel] = useState<PrintSelection | null>(null);
  const [printAnchor, setPrintAnchor] = useState<PrintRect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const printPanelRef = useRef<HTMLDivElement>(null);
  const printSelRef = useRef<PrintSelection | null>(null);
  printSelRef.current = printSel;
  const printOpenValueRef = useRef<{ label: string; value: string } | null>(null);
  // Cờ "đã nạp câu mẫu xong" — chặn effect lưu localStorage ghi đè bản đã
  // lưu bằng {} trước khi nhánh nạp (đặc biệt ?edit= bất đồng bộ) chạy xong.
  const customTextsReadyRef = useRef(false);
  const [editedPrintFields, setEditedPrintFields] = useState<Set<string>>(new Set());
  const editedPrintFieldsRef = useRef(editedPrintFields);
  const [editedPrintCustomTexts, setEditedPrintCustomTexts] = useState<Set<string>>(new Set());
  const editedPrintCustomTextsRef = useRef(editedPrintCustomTexts);
  const setEditedPrintFieldsBoth = (next: Set<string>) => {
    editedPrintFieldsRef.current = next;
    setEditedPrintFields(next);
  };
  const setEditedPrintCustomTextsBoth = (next: Set<string>) => {
    editedPrintCustomTextsRef.current = next;
    setEditedPrintCustomTexts(next);
  };
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  // Câu mẫu sửa trong editor: lưu theo mã thiệp trên máy này để Lưu thiệp +
  // tải lại vẫn còn (mở bằng ?d= / ?edit= đều khôi phục được).
  useEffect(() => {
    if (!customTextsReadyRef.current) return;
    const id = data.id || savedId;
    if (!id) return;
    try {
      window.localStorage.setItem(editorCustomTextsKey(id), JSON.stringify(customTextsRef.current));
    } catch {
      // bỏ qua — không chặn lưu thiệp
    }
  }, [customTexts, data.id, savedId]);
  // Đã chốt in / đã trả tiền thì editor chỉ đọc (mở khóa mới sửa được).
  // Chốt in gồm locked_for_print cũ và confirmed/reviewed/printed mới.
  const readOnly = isPrintConfirmed(serverStatus as InvitationStatus) || serverStatus === "paid_online";
  // Link cho khách sửa theo dữ liệu HIỆN TẠI (đổi ngay khi sửa, không cần
  // đợi bấm sao chép) — hiện nổi bật trong đường vật lý, ngay dưới form.
  const customerLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      return customerEditUrl || buildCustomerEditUrl(window.location.origin, { ...data, id: data.id || savedId || "demo" });
    } catch {
      return editLink;
    }
  }, [customerEditUrl, data, savedId, editLink]);
  const fileRef = useRef<HTMLInputElement>(null);
  const appliedTemplate = useRef(false);

  // Nạp thiệp theo tham số rõ ràng (?edit=/?d=/?demo=/?template=).
  // Mở trần: LUÔN là thiệp mới trống — không tải thiệp đã lưu gần nhất
  // từ localStorage. Muốn vào thiệp cũ thì mở từ Quản lý
  // (/tao-thiep?edit=<id>&t=<token>, xem nhánh ?edit= ở trên).
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
              // Câu mẫu: ưu tiên bản ghi máy chủ (khách sửa) khi có, không thì bản editor đã lưu trên máy này.
              const serverCt = (j.customTexts as Record<string, string> | undefined) ?? {};
              setCustomTexts(Object.keys(serverCt).length > 0 ? serverCt : loadEditorCustomTexts(editId));
              setEditedPrintCustomTextsBoth(
                new Set(Object.keys(serverCt).filter((k) => isCustomTextEdited(k, serverCt[k], j.data as InvitationData)))
              );
              setEditedPrintFieldsBoth(
                new Set(((j.editedFields as string[] | undefined) ?? []).filter((f): f is string => typeof f === "string"))
              );
              customTextsReadyRef.current = true;
            } else {
              setNotice(
                j.reason === "locked"
                  ? "Thiệp đã chốt in — chỉ đọc, không sửa được nữa. Nhờ Thiết kế mở khóa nếu cần sửa."
                  : "Link sửa không hợp lệ. Xin Thiết kế gửi lại link sửa mới."
              );
              if (typeof j.status === "string") setServerStatus(j.status);
              setSavedId(editId);
              setServerId(editId);
              setCustomTexts({});
              customTextsReadyRef.current = true;
            }
            appliedTemplate.current = true;
          })
          .catch(() => {
            setNotice("Không tải được thiệp từ máy chủ. Kiểm tra mạng rồi thử lại.");
            setCustomTexts({});
            customTextsReadyRef.current = true;
          });
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
              // Link xem trước không trả câu mẫu — lấy bản editor đã lưu trên máy này (nếu có).
              setCustomTexts(loadEditorCustomTexts(demoId));
              customTextsReadyRef.current = true;
              setNotice("Link xem trước cũ đã chuyển tới mục demo online bên dưới.");
              window.setTimeout(() => {
                document.getElementById("demo-online")?.scrollIntoView({ behavior: "smooth" });
              }, 300);
            } else {
              setNotice(
                j.reason === "paid"
                  ? "Thiệp này đã được mua online — mở link khách chính thức, không dùng link xem trước nữa."
                  : "Link xem trước không hợp lệ. Xin Thiết kế gửi lại link mới."
              );
              setSavedId(demoId);
              setServerId(demoId);
              setCustomTexts({});
              customTextsReadyRef.current = true;
            }
            appliedTemplate.current = true;
          })
          .catch(() => {
            setNotice("Không tải được thiệp từ máy chủ. Kiểm tra mạng rồi thử lại.");
            setCustomTexts({});
            customTextsReadyRef.current = true;
          });
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
          // Link có ?c= thì lấy câu mẫu trong đó, không thì lấy bản editor đã lưu trên máy này.
          setCustomTexts(decodeCustomTexts(params.get("c"))?.customTexts ?? loadEditorCustomTexts(svgP.data.id));
          customTextsReadyRef.current = true;
          appliedTemplate.current = true;
          return;
        }
        const decoded = decodeShare(dParam);
        if (decoded) {
          setData(decoded);
          if (decoded.id) setSavedId(decoded.id);
          setCustomTexts(decodeCustomTexts(params.get("c"))?.customTexts ?? loadEditorCustomTexts(decoded.id));
          customTextsReadyRef.current = true;
          appliedTemplate.current = true;
          // Mở từ link ?d= mà chưa có bản ghi máy chủ thì tự đồng bộ ngầm
          // để hộp "Link cho khách sửa" hiện link máy chủ (?t=) luôn: link
          // ?d= không có chỗ ghi chú, khách chốt xong chị cũng không nhận
          // được báo. Đã có bản ghi thì chỉ lấy link có sẵn, không ghi đè
          // dữ liệu trên máy chủ bằng dữ liệu cũ trong link.
          if (SUPABASE_CONFIGURED && decoded.id) {
            void ensureServerCustomerLink(decoded, decoded.id).then((err) => {
              setNotice(
                err === null
                  ? "Đã đồng bộ lên máy chủ — hộp “Link cho khách sửa” bên dưới là link máy chủ."
                  : `Chưa đồng bộ được lên máy chủ (${err}) — hộp “Link cho khách sửa” bên dưới chưa có link máy chủ.`
              );
            });
          }
          return;
        }
      }
      // Mở trần (không có tham số nào): LUÔN bắt đầu từ thiệp mới trống —
      // không tải lại thiệp đã lưu gần nhất. Muốn vào thiệp cũ thì mở từ
      // Quản lý (/tao-thiep?edit=<id>&t=<token>, nhánh ?edit= ở trên).
      // ?template= một mình thì trống với mẫu đó.
      const tpl = params.get("template");
      if (tpl) {
        setData(emptyInvitation(tpl));
      }
      setCustomTexts({});
      customTextsReadyRef.current = true;
      appliedTemplate.current = true;
    } catch {
      // giữ thiệp mặc định
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  /* ---------- sửa ngay trên form in: giá trị + mở/đóng box ---------- */
  const printFieldValue = (field: StdEditField): string => {
    const d = dataRef.current;
    if (field === "ceremonyDate") return effectiveCeremonyDate(d);
    if (field === "ceremonyTime") return d.ceremonyTime?.trim() ? d.ceremonyTime : d.time;
    if (field === "hostType") return d.hostType ?? "Nhà Trai";
    return (d[field] as string | undefined) ?? "";
  };
  const setPrintFieldValue = (field: StdEditField, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };
  const setPrintCustomValue = (key: string, value: string) => {
    setCustomTexts((prev) => ({ ...prev, [key]: value }));
  };
  const markPrintEdited = (kind: "field" | "custom", key: string) => {
    if (kind === "field") {
      const next = new Set(editedPrintFieldsRef.current);
      next.add(key);
      setEditedPrintFieldsBoth(next);
    } else {
      const next = new Set(editedPrintCustomTextsRef.current);
      next.add(key);
      setEditedPrintCustomTextsBoth(next);
    }
  };
  const openPrintFieldEditor = (field: StdEditField, rect: PrintRect) => {
    if (readOnly) return;
    printOpenValueRef.current = { label: stdFieldLabel(field), value: printFieldValue(field) };
    setPrintSel({ kind: "field", field });
    setPrintAnchor(rect);
  };
  const openPrintCustomEditor = (key: string, rect: PrintRect) => {
    if (readOnly) return;
    printOpenValueRef.current = {
      label: customTextDef(key)?.label ?? key,
      value: customTextValue(key, customTextsRef.current, dataRef.current),
    };
    setPrintSel({ kind: "custom", key });
    setPrintAnchor(rect);
  };
  const closePrintEditor = () => {
    const sel = printSelRef.current;
    const open = printOpenValueRef.current;
    setPrintSel(null);
    setPrintAnchor(null);
    printOpenValueRef.current = null;
    if (!sel || !open) return;
    // Chuẩn hoá NFC khi đóng: dấu gõ rời về dạng gộp chuẩn (cùng kiểu
    // CustomerStandardEditor). Không chuẩn hoá tên kiểu title-case như
    // trang khách — dữ liệu của Nancy lấy từ Illustrator đã đúng.
    let newValue: string;
    if (sel.kind === "field") {
      const cur = printFieldValue(sel.field);
      const nfc = cur.normalize("NFC");
      if (nfc !== cur) setPrintFieldValue(sel.field, nfc);
      newValue = printFieldValue(sel.field);
    } else {
      const cur = customTextValue(sel.key, customTextsRef.current, dataRef.current);
      const nfc = cur.normalize("NFC");
      if (nfc !== cur) setPrintCustomValue(sel.key, nfc);
      newValue = customTextValue(sel.key, customTextsRef.current, dataRef.current);
    }
    if (newValue !== open.value) markPrintEdited(sel.kind, sel.kind === "field" ? sel.field : sel.key);
  };

  // Neo lại box khi cuộn / xoay màn hình / bàn phím mở (viewport đổi).
  useEffect(() => {
    if (!printSel) return;
    const reposition = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      setVp((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
    };
  }, [printSel]);

  // Đóng box: bấm ra ngoài box hoặc phím Escape.
  useEffect(() => {
    if (!printSel) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (printPanelRef.current?.contains(t)) return;
      closePrintEditor();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePrintEditor();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printSel]);

  /* ---------- vị trí box nổi: kẹp trong viewport ---------- */
  // Panel phải LUÔN nằm gọn trong viewport để nút Xong với tới được: ngưỡng
  // 180px cũ (kiểu CustomerStandardEditor) nhỏ hơn panel thật (~300-400px)
  // nên ô bấm ở nửa dưới màn hình đẩy nút Xong ra khỏi viewport mà panel
  // lại không có thanh cuộn trong (nội dung vừa maxHeight) — bấm không tới.
  // Đặt dưới nếu còn đủ chỗ cho panel (~320px), không thì đặt trên, không
  // thì kẹp từ mép trên và cho cuộn trong; maxHeight luôn kẹp theo chỗ trống
  // thực tế ở vị trí đặt.
  const printPanelW = Math.min(340, (vp.w || 375) - 16);
  let printPanelStyle: React.CSSProperties = { width: printPanelW, maxHeight: "55vh" };
  if (printAnchor) {
    const vh = vp.h || 667;
    const vw = vp.w || 375;
    const cx = printAnchor.left + printAnchor.width / 2;
    const left = Math.max(8, Math.min(cx - printPanelW / 2, vw - printPanelW - 8));
    const belowTop = printAnchor.bottom + 8;
    if (belowTop + 320 <= vh) {
      printPanelStyle = { width: printPanelW, left, top: belowTop, maxHeight: Math.min(vh * 0.55, vh - belowTop - 8) };
    } else if (printAnchor.top - 320 >= 8) {
      printPanelStyle = { width: printPanelW, left, bottom: vh - printAnchor.top + 8, maxHeight: Math.min(vh * 0.55, printAnchor.top - 16) };
    } else {
      printPanelStyle = { width: printPanelW, left, top: 8, maxHeight: vh - 16 };
    }
  }

  /* ---------- nội dung box sửa ---------- */
  const printSelField = printSel?.kind === "field" ? printSel.field : null;
  const printSelCustomKey = printSel?.kind === "custom" ? printSel.key : null;
  const printSelCustomDef = printSelCustomKey ? customTextDef(printSelCustomKey) : undefined;
  const printSelValue = printSelField
    ? printFieldValue(printSelField)
    : printSelCustomKey
      ? customTextValue(printSelCustomKey, customTexts, data)
      : "";
  const isPrintFamilyField = printSelField ? FAMILY_FIELDS.has(printSelField) : false;
  const printLeParts = getDateParts(effectiveCeremonyDate(data));
  const printTiecParts = getDateParts(data.date);
  const printSummary = (parts: ReturnType<typeof getDateParts>, time: string) =>
    parts
      ? `${parts.weekday}, ${parts.day} ${parts.monthDisplay} ${parts.year}${parts.lunarNote ? ` (${parts.lunarNote})` : ""} · lúc ${time}`
      : "Chưa chọn ngày.";
  const printLeSummary = printSummary(printLeParts, data.ceremonyTime?.trim() ? data.ceremonyTime : data.time);
  const printTiecSummary = printSummary(printTiecParts, data.time);
  // Trường đã có nhánh nhập riêng (không dùng ô text mặc định).
  const PRINT_COVERED_FIELDS = [
    "ceremonyType",
    "groomBirthOrder",
    "brideBirthOrder",
    "ceremonyDate",
    "ceremonyTime",
    "date",
    "time",
    "groomParentsAddress",
    "brideParentsAddress",
    "address",
    "message",
  ];
  const PRINT_TEXTAREA_FIELDS = ["groomParentsAddress", "brideParentsAddress", "address", "message"];

  // Tải ảnh lên: tự nén trước khi lưu (xem src/lib/image.ts) — ảnh gốc
  // điện thoại 3–8 MB được thu về tối đa 1600px / JPEG 0.82 để thiệp nhẹ.
  const onUpload = (file: File | undefined) => {
    if (!file) return;
    compressImage(file)
      .then((url) => set("photoUrl", url))
      .catch(() => setNotice("Không đọc được ảnh đã chọn. Hãy thử ảnh khác."));
  };

  const onSave = async () => {
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
      // Máy chủ đã cấu hình Supabase: lưu xong tự đồng bộ lên máy chủ để
      // hộp "Link cho khách sửa" hiện link máy chủ (?t=) thay vì link ?d=.
      // Chưa cấu hình thì giữ link ?d= như cũ (không thử đồng bộ — file
      // store local không phải máy chủ thật, link ?t= ở đó chỉ để test).
      // Đồng bộ lỗi thì vẫn giữ link ?d=, chỉ báo thêm (không chặn lưu).
      if (SUPABASE_CONFIGURED) {
        const err = await trySyncToServer();
        setNotice(
          err === null
            ? "Đã lưu + đồng bộ lên máy chủ — hộp “Link cho khách sửa” bên dưới là link máy chủ."
            : `Đã lưu trên máy này — chưa đồng bộ được lên máy chủ (${err}). Link khách bên dưới vẫn là link ?d=.`
        );
      }
    } catch {
      setNotice(d.savedFail);
    }
  };

  // "Thiệp mới": chuyển sang làm thiệp cho khách tiếp theo — xóa trắng
  // form + xóa id/link máy chủ trong trang. Thiệp cũ KHÔNG bị đụng: chỉ
  // reset state trong trang, không xóa localStorage hay bản ghi máy chủ
  // nào — mở lại link cũ vẫn thấy đúng dữ liệu cũ. Lưu tiếp theo tạo
  // thiệp mới (saveInvitation sinh id mới khi data.id rỗng).
  const onNewInvitation = () => {
    const blank = emptyInvitation("minimal-do-do");
    const isBlank = (Object.keys(blank) as (keyof InvitationData)[]).every((k) => data[k] === blank[k]);
    if (isBlank) return;
    if (
      !window.confirm(
        "Tạo thiệp mới sẽ xóa trắng form này để làm thiệp cho khách tiếp theo. Thiệp đang làm — nếu đã bấm Lưu thiệp / đồng bộ — vẫn còn nguyên trên máy chủ và trong Quản lý. Tiếp tục?"
      )
    ) {
      return;
    }
    setData(blank);
    setCustomTexts({});
    setEditedPrintFieldsBoth(new Set());
    setEditedPrintCustomTextsBoth(new Set());
    setPrintSel(null);
    setPrintAnchor(null);
    customTextsReadyRef.current = true;
    setSavedId("");
    setServerId("");
    setServerStatus("");
    setPreviewUrl("");
    setServerEditUrl("");
    setCustomerEditUrl("");
    setGuestUrl("");
    setPayInfo(null);
    setShareLink("");
    setEditLink("");
    setNotice("Đã tạo thiệp mới trống — dán dữ liệu khách tiếp theo vào rồi bấm Lưu thiệp.");
    setCepNotice("");
    setCepWarning("");
    setCepCopyNotice("");
    setImportText("");
    setImportMeta("");
    setSvgPayload(null);
    setPanelNotice("");
    setReconcileRef("");
    setReconcileReason("");
    setReconcileNotice("");
    setLinkSyncError("");
    setLinkSyncBusy(false);
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
    // Chưa có link máy chủ thì đừng sao chép link ?d= lặng lẽ — link đó
    // không có chỗ ghi chú và khách chốt xong chị không nhận được báo.
    // Đồng bộ một chạm để lấy link máy chủ rồi sao chép lại.
    if (!customerEditUrl) {
      await syncCustomerLinkFromBox();
      return;
    }
    try {
      const res = await copyText(customerEditUrl);
      setEditLink(customerEditUrl);
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

  // Đồng bộ dữ liệu hiện tại lên máy chủ (tạo/cập nhật bản ghi): trả null
  // khi xong, trả thông báo lỗi khi không xong. Dùng chung cho nút "Đồng
  // bộ" ở panel máy chủ và cho onSave tự đồng bộ khi đã có Supabase.
  // dataOverride/idOverride dùng khi gọi từ useEffect nạp link ?d= (state
  // data/savedId lúc đó còn chưa cập nhật).
  const trySyncToServer = async (dataOverride?: InvitationData, idOverride?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: adminHeaders(),
        // Câu mẫu sửa trong editor gửi kèm để lên máy chủ (trước đây chỉ
        // gửi data nên khách mở link máy chủ vẫn thấy câu mẫu cũ — lỗi
        // 10/11/2026: dòng tên khách "Quý Gia Đình" hiện đúng ở editor
        // nhưng khách vẫn thấy dòng chấm). Thiệp đã chốt thì không gửi —
        // server cũng giữ nguyên câu mẫu ở nhánh đã chốt.
        body: JSON.stringify({
          data: { ...(dataOverride ?? data), id: (idOverride ?? savedId) || undefined },
          customTexts: readOnly ? undefined : customTextsRef.current,
        }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok || !j.ok) {
        return typeof j.error === "string" ? j.error : "Không đồng bộ được.";
      }
      const id = String(j.id ?? "");
      setServerId(id);
      setSavedId(id);
      setData((prev) => ({ ...prev, id }));
      if (typeof j.status === "string") setServerStatus(j.status);
      setPreviewUrl(String(j.previewUrl ?? ""));
      setServerEditUrl(String(j.editUrl ?? ""));
      setCustomerEditUrl(String(j.customerEditUrl ?? ""));
      return null;
    } catch {
      return "Không kết nối được máy chủ.";
    }
  };

  // Lấy link khách máy chủ (?t=) cho thiệp đang mở mà không ghi đè dữ
  // liệu: đã có bản ghi máy chủ thì chỉ lấy link có sẵn (GET — cần phiên
  // admin, link mang editToken nên API chỉ trả cho admin); chưa có thì
  // đồng bộ dữ liệu hiện tại lên máy chủ (POST upsert). Trả null khi xong,
  // trả thông báo lỗi khi không xong.
  const ensureServerCustomerLink = async (invData?: InvitationData, invId?: string): Promise<string | null> => {
    const id = invId ?? savedId ?? data.id ?? "";
    if (!id) return "Chưa có mã thiệp để đồng bộ.";
    try {
      const check = await fetch(`/api/invitations?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!check.ok) return "Không kiểm tra được thiệp trên máy chủ.";
      const cj = (await check.json()) as Record<string, unknown>;
      if (!cj.ok) return "Không kiểm tra được thiệp trên máy chủ.";
      if (cj.exists) {
        if (typeof cj.customerEditUrl === "string" && cj.customerEditUrl) {
          setServerId(id);
          setSavedId(id);
          if (typeof cj.status === "string") setServerStatus(cj.status);
          setCustomerEditUrl(cj.customerEditUrl);
          return null;
        }
        // Đã có bản ghi nhưng không lấy được link (vd phiên admin hết
        // hạn): đừng ghi đè dữ liệu trên máy chủ bằng dữ liệu trong link.
        return "Đã có thiệp trên máy chủ nhưng không lấy được link — tải lại trang rồi thử lại.";
      }
    } catch {
      return "Không kết nối được máy chủ.";
    }
    return trySyncToServer(invData, invId);
  };

  // Nút một chạm trong hộp "Link cho khách sửa": lấy link máy chủ (?t=)
  // cho thiệp đang mở. Lỗi hiện rõ trong hộp, không lặng lẽ quay lại ?d=.
  const syncCustomerLinkFromBox = async () => {
    setLinkSyncBusy(true);
    setLinkSyncError("");
    try {
      const err = await ensureServerCustomerLink();
      if (err === null) {
        setNotice("Đã có link máy chủ — bấm “Sao chép link cho khách sửa” để gửi khách. Khách có chỗ ghi chú, chốt xong chị nhận được thông báo.");
      } else {
        setLinkSyncError(`Chưa lấy được link máy chủ: ${err}`);
      }
    } catch {
      setLinkSyncError("Không lấy được link máy chủ — kiểm tra mạng rồi thử lại.");
    }
    setLinkSyncBusy(false);
  };

  const syncToServer = async () => {
    try {
      setPanelNotice("Đang đồng bộ lên máy chủ…");
      const err = await trySyncToServer();
      setPanelNotice(
        err === null
          ? "Đã đồng bộ. Link xem trước bên dưới không có link khách — gửi cho khách duyệt in."
          : err
      );
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
    setCepCopyNotice(res.ok ? okMsg : "Không sao chép được. Hãy bôi đen rồi copy thủ công.");
  };

  // Cảnh báo riêng (khung vàng nổi bật) khi đoạn dán vẫn thiếu địa điểm —
  // phải hiện rõ ngay, không chìm trong dòng thông báo xanh bên dưới.
  // Giữ nguyên câu chữ cũ "Đoạn dán không có địa điểm/địa chỉ tiệc" để
  // chị nhận ra ngay trường hợp quen thuộc này.
  const missingPlaceWarning = (missingVenue: boolean, missingCeremony: boolean): string => {
    if (missingVenue && missingCeremony) {
      return "Đoạn dán không có nơi làm lễ và địa điểm/địa chỉ tiệc — gõ vào ô 'Nơi làm lễ', 'Địa điểm' / 'Địa chỉ' trong form bên dưới rồi bấm Lưu thiệp.";
    }
    if (missingVenue) {
      return "Đoạn dán không có địa điểm/địa chỉ tiệc — gõ vào ô 'Địa điểm' / 'Địa chỉ' trong form bên dưới rồi bấm Lưu thiệp.";
    }
    if (missingCeremony) {
      return "Đoạn dán không có nơi làm lễ — gõ vào ô 'Nơi làm lễ' trong form bên dưới rồi bấm Lưu thiệp.";
    }
    return "";
  };

  // Nhập từ Illustrator: điền vào form + xem trước, KHÔNG tự lưu (chỉ lưu
  // khi bấm "Lưu thiệp" như mọi khi). Dán ghost text nghĩa là thiệp VẬT
  // LÝ: chọn form vật lý chuẩn #1 (không động tới mẫu online), chuyển sang
  // đường vật lý để chị thấy ngay form in đã đổ dữ liệu.
  const onImportGhost = () => {
    const { result: res, usedPlainFallback } = parseCepGhostTextWithPlainFallback(importText, importMeta);
    if (!res.ok) {
      setCepNotice(res.error);
      setCepWarning("");
      return;
    }
    // Dán chỉ đổ thêm những gì Illustrator có — chữ rỗng trong đoạn dán
    // không xoá chữ chị đã gõ (vd địa điểm tiệc dạng outline trong .ai).
    const merged = mergeImportedData(data, res.data);
    const missingVenue = !merged.venue?.trim() || !merged.address?.trim();
    const missingCeremony = !merged.ceremonyVenue?.trim();
    setData({
      ...merged,
      physicalFormId: data.physicalFormId ?? DEFAULT_PHYSICAL_FORM_ID,
    });
    setMode("physical");
    setCepNotice(
      "Đã điền dữ liệu từ Illustrator — form vật lý Mẫu in chuẩn #1 đã được chọn, kiểm tra lại rồi bấm Lưu thiệp." +
        (usedPlainFallback
          ? " Đoạn dán thiếu mã ẩn ở một số chỗ nên đã đọc bù bằng chữ thường — kiểm tra kỹ lại các trường đã bù."
          : "")
    );
    setCepWarning(missingPlaceWarning(missingVenue, missingCeremony));
  };

  // (Ô "Điền từ khối chữ thường" đã bỏ 2026-11-11: dán khối chữ thường vào
  // ô ghost ở trên cho kết quả tương đương nhờ fallback trong
  // parseCepGhostTextWithPlainFallback — xem cep.ts:527. Hàm parseCepPlainText
  // vẫn dùng trong fallback đó, chỉ UI riêng bị bỏ.)

  // Chọn mẫu ONLINE — chỉ dùng ở đường online. Đường vật lý KHÔNG chọn
  // mẫu online, chỉ chọn form vật lý (mục "Form vật lý" bên dưới).
  const templatePicker = (
    <Field label="Chọn mẫu (đổi mẫu giữ nguyên toàn bộ dữ liệu)" id="tpl-select">
      <select id="tpl-select" value={data.templateId} onChange={(e) => set("templateId", e.target.value)} className={inputCls}>
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>{t.name} — {t.styleLabel}</option>
        ))}
      </select>
      <p className="mt-1 text-xs text-[#7a6a68]">{getTemplate(data.templateId).pattern}</p>
    </Field>
  );

  const form = (
    <div className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      {/* Các ô nhập dữ liệu vật lý CHỈ hiện ở đường online — đường vật lý
          sửa thẳng trên form in (bấm vào tên, ngày, địa điểm…), không nhập
          từng ô nữa. Ảnh / ngôn ngữ / VietQR / hàng nút ở dưới vẫn hiện cả
          hai đường (xem mục "Ảnh + mừng cưới cho thiệp online"). */}
      {mode === "online" && (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên chú rể *" id="groom"><input id="groom" required value={data.groomName} onChange={(e) => set("groomName", e.target.value)} className={inputCls} /></Field>
        <Field label="Tên cô dâu *" id="bride"><input id="bride" required value={data.brideName} onChange={(e) => set("brideName", e.target.value)} className={inputCls} /></Field>
        <Field label="Bố chú rể" id="gf"><input id="gf" value={data.groomFather} onChange={(e) => set("groomFather", e.target.value)} className={inputCls} /></Field>
        <Field label="Mẹ chú rể" id="gm"><input id="gm" value={data.groomMother} onChange={(e) => set("groomMother", e.target.value)} className={inputCls} /></Field>
        <Field label="Bố cô dâu" id="bf"><input id="bf" value={data.brideFather} onChange={(e) => set("brideFather", e.target.value)} className={inputCls} /></Field>
        <Field label="Mẹ cô dâu" id="bm"><input id="bm" value={data.brideMother} onChange={(e) => set("brideMother", e.target.value)} className={inputCls} /></Field>
      </div>
      )}

      {/* Thứ bậc + địa chỉ gia đình mỗi bên (mẫu Song Phụng Đỏ, vòng 10–11):
          thứ bậc hiện dưới tên lớn ("Út Nam"/"Út Nữ"), địa chỉ hiện dưới tên
          cha mẹ trong khối THÔNG TIN. Để trống thì không hiện (bản gốc cũng
          vậy). Preview cập nhật ngay khi gõ. */}
      {mode === "online" && (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thứ bậc chú rể" id="gbo"><input id="gbo" value={data.groomBirthOrder ?? ""} onChange={(e) => set("groomBirthOrder", e.target.value)} placeholder="Vd: Út Nam" className={inputCls} /></Field>
        <Field label="Thứ bậc cô dâu" id="bbo"><input id="bbo" value={data.brideBirthOrder ?? ""} onChange={(e) => set("brideBirthOrder", e.target.value)} placeholder="Vd: Út Nữ" className={inputCls} /></Field>
        <Field label="Địa chỉ nhà trai" id="gpa"><input id="gpa" value={data.groomParentsAddress ?? ""} onChange={(e) => set("groomParentsAddress", e.target.value)} placeholder="Vd: 12 Ngõ 34 Phố Huế, Hai Bà Trưng, Hà Nội" className={inputCls} /></Field>
        <Field label="Địa chỉ nhà gái" id="bpa"><input id="bpa" value={data.brideParentsAddress ?? ""} onChange={(e) => set("brideParentsAddress", e.target.value)} placeholder="Vd: 56 Đường Xuân Thủy, Cầu Giấy, Hà Nội" className={inputCls} /></Field>
      </div>
      )}

      {/* Tiêu đề lễ + dress code chỉ dùng cho mẫu online (Song Phụng Đỏ) —
          đường vật lý không hiện 2 trường này. */}
      {mode === "online" && (
        <>
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
        </>
      )}

      {mode === "online" && (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ngày tiệc *" id="date"><input id="date" type="date" required value={data.date} onChange={(e) => set("date", e.target.value)} className={inputCls} /></Field>
        <Field label="Giờ tiệc *" id="time"><input id="time" type="time" required value={data.time} onChange={(e) => set("time", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa điểm *" id="venue"><input id="venue" required value={data.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} /></Field>
        <Field label="Địa chỉ *" id="address"><input id="address" required value={data.address} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
      </div>
      )}

      {/* Thông tin lễ (cho nối Illustrator/CEP): lễ có thể khác ngày/giờ
          tiệc; loại lễ + nhà chủ tiệc quyết định bên nào đứng trước trong
          khối chữ xuất sang (pos1 = nhà chủ tiệc). Ngày/giờ lễ mặc định
          bằng ngày/giờ tiệc — sửa khi lễ khác ngày tiệc. */}
      {mode === "online" && (
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
      )}

      {mode === "online" && (
      <>
      <Field label="Lời mời" id="message">
        <textarea id="message" rows={4} value={data.message} onChange={(e) => set("message", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Câu chuyện tình yêu" id="story">
        <textarea id="story" rows={4} value={data.story} onChange={(e) => set("story", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Lịch trình (mỗi dòng: HH:MM - Nội dung)" id="schedule">
        <textarea id="schedule" rows={4} value={data.scheduleText} onChange={(e) => set("scheduleText", e.target.value)} className={inputCls} />
      </Field>
      </>
      )}

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

      {/* Hàng nút đã gọn (2026-11-11): "Lưu thiệp" + "Sao chép link cho
          khách sửa" + ô link ?t= + toast chỉ còn ở hộp "Link cho khách sửa"
          (customerLinkBox) ngay dưới form — trước đây toolbar này và hộp
          đó trùng y hệt nhau. */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={onNewInvitation} data-testid="new-invitation" className="rounded-full border px-5 py-3 font-semibold">＋ Thiệp mới</button>
        <button type="button" onClick={onCopy} className="rounded-full border-2 border-[#7a1f2b] px-5 py-3 font-semibold text-[#7a1f2b]">{d.copyLink}</button>
        <button type="button" onClick={onOpenCard} className="rounded-full border px-5 py-3 font-semibold">{d.openCard}</button>
      </div>
      {shareLink && (
        <Collapsible bare title="Link chia sẻ (?d=)" hint="Kèm dữ liệu trong link, mở được trên máy khác." testId="share-link-box">
          <label htmlFor="share-link" className="text-sm font-semibold">Link chia sẻ (kèm dữ liệu trong ?d=, mở được trên máy khác)</label>
          <input id="share-link" readOnly value={shareLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-[#fdf8f1]`} />
        </Collapsible>
      )}

    </div>
  );

  // Panel máy chủ — render NGOÀI fieldset chỉ-đọc: khi đã chốt in, các nút
  // Mở khóa / Đối soát tay / Lấy QR vẫn phải bấm được (fieldset disabled
  // sẽ khóa hết nút con bên trong nó).
  const serverPanel = (
    <Collapsible
      title="Gửi khách duyệt in & bán thiệp online"
      hint="Đồng bộ lên máy chủ, chốt in, lấy QR trả tiền / link khách, đối soát tay — ít dùng hàng ngày."
      testId="server-panel"
    >
      {/* Gửi khách duyệt in + khóa + thanh toán (máy chủ quyết định).
          Luồng v3-final: Đồng bộ -> gửi link xem trước cho khách duyệt in ->
          Chốt in (chỉ đọc nội dung vật lý, demo online vẫn sửa được trường
          online) -> khách mua online ở mục "Xem demo thiệp online" bên dưới
          (chọn mẫu -> quét QR 100k -> nhận link xịn) -> link khách chính
          thức mở. Chưa trả tiền thì không bao giờ tạo được link khách. */}
      <section className="rounded-2xl border bg-[#fdf8f1] p-4" aria-label="Gửi khách duyệt in và thanh toán">
        <p className="mt-1 text-sm text-[#5a4a48]">
          Trạng thái hiện tại: <strong>{serverStatus ? STATUS_LABEL[serverStatus as InvitationStatus] ?? serverStatus : "chưa đưa lên máy chủ"}</strong>
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
            <label htmlFor="server-edit-url" className="text-sm font-semibold">Link mở lại trình sửa (dành cho Thiết kế)</label>
            <input id="server-edit-url" readOnly value={serverEditUrl} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          </div>
        )}
        {/* Ô link khách sửa mẫu chuẩn đã bỏ (2026-11-11): cùng URL
            /khach/<id>?t=… với ô duy nhất trong hộp "Link cho khách sửa"
            (customerLinkBox) — giữ 1 ô trên toàn trang. Ô server-edit-url
            bên trên được giữ: đó là link /tao-thiep?edit=… mở lại trình
            sửa, URL khác hẳn link khách. */}
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
    </Collapsible>
  );

  // Mục CEP — MỘT khung chung "Trao đổi dữ liệu với Illustrator (CEP)":
  // nhập (Illustrator → app, Bước 1, luôn mở) + xuất (app → Illustrator,
  // Bước 3, gọn mặc định). Hai chiều của cùng một luồng in, không phải hai
  // mục trùng nhau (phân tích 2026-11-11). Render NGOÀI fieldset chỉ-đọc
  // để vẫn dán/sao chép được khi đã chốt.
  const cepExchange = (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <section className="rounded-2xl border bg-[#fdf8f1] p-4" aria-label="Trao đổi dữ liệu với Illustrator">
        <h2 className="text-base font-bold text-[#7a1f2b]">Trao đổi dữ liệu với Illustrator (CEP)</h2>
        <p className="mt-1 text-sm text-[#5a4a48]">
          Một luồng hai chiều: đưa dữ liệu từ Illustrator vào form (nhập), rồi xuất ghost text ra Illustrator để in (xuất).
        </p>

        {/* Khối NHẬP — luôn mở: đây là khung paste dùng liên tục. */}
        <div className="mt-4" aria-label="Nhập từ Illustrator">
          <h3 className="text-sm font-bold text-[#7a1f2b]">Bước 1 — Đưa dữ liệu từ Illustrator vào form <span className="font-semibold text-[#5a4a48]">(Illustrator → App)</span></h3>
          <p className="mt-1 text-sm text-[#5a4a48]">Sửa trong Illustrator xong thì copy cả đoạn trong text frame rồi dán vào đây, bấm “Điền vào form” — dữ liệu đổ vào form vật lý bên dưới.</p>
          <label htmlFor="cep-import" className="mt-3 block text-sm font-semibold">Đoạn có mã ẩn (U+200B) copy từ Illustrator</label>
          <textarea id="cep-import" rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Dán đoạn chữ có mã ẩn vào đây…" className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          <Collapsible bare title="Nâng cao — Metadata" hint="Chỉ cần khi file .ai dùng template có thứ tự khóa khác chuẩn: dán JSON metadata vào đây, app sẽ dùng đúng thứ tự khóa trong đó." testId="cep-import-meta-advanced">
            <label htmlFor="cep-import-meta" className="block text-sm font-semibold">Metadata (tùy chọn)</label>
            <input id="cep-import-meta" value={importMeta} onChange={(e) => setImportMeta(e.target.value)} placeholder='{"type":"stateful","keys":[...]}' className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          </Collapsible>
          <button type="button" onClick={onImportGhost} className="mt-3 rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]">Điền vào form</button>
          <p className="mt-2 text-xs text-[#7a6a68]">Dán cả khối chữ thường (không có mã ẩn) vào ô trên cũng được — app tự đọc bù.</p>
          {cepWarning && <p className="mt-3 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="alert">{cepWarning}</p>}
          {cepNotice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{cepNotice}</p>}
        </div>

        {/* Khối XUẤT — gọn mặc định: chỉ mở khi cần lấy ghost text ra in. */}
        <div className="mt-5 border-t border-[#e8dcc8] pt-4">
          <Collapsible
            bare
            title="Bước 3 — Xuất ghost text ra Illustrator để in (App → Illustrator)"
            hint="Xuất dữ liệu sang Illustrator để in. Chữ bọc bằng ký tự ẩn U+200B theo đúng thứ tự 32 trường của CEP."
            testId="cep-export"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="cep-ghost" className="text-sm font-semibold">Chữ có mã ẩn — dán vào text frame trong Illustrator</label>
                <textarea id="cep-ghost" readOnly rows={10} value={buildCepTextBlock(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <p className="mt-1 text-xs text-[#7a6a68]">Nhìn thì giống chữ thường, nhưng trong đó có ký tự ẩn U+200B bọc từng trường — script mới đọc được. Bấm sao chép rồi dán nguyên đoạn vào text frame.</p>
                <button type="button" onClick={() => onCopyCep(buildCepTextBlock(data), "Đã sao chép chữ có mã ẩn.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ có mã ẩn</button>
              </div>
              <Collapsible bare title="Nâng cao — Metadata" hint="Chuỗi JSON này giống nhau mọi lần (32 khóa chuẩn) — chỉ dán vào thuộc tính (note) của text frame khi cần giữ đúng thứ tự khóa của file này." testId="cep-export-meta-advanced">
                <label htmlFor="cep-meta" className="block text-sm font-semibold">Metadata — dán vào thuộc tính (note) của text frame</label>
                <input id="cep-meta" readOnly value={buildCepMetadataJson()} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <button type="button" onClick={() => onCopyCep(buildCepMetadataJson(), "Đã sao chép metadata.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép metadata</button>
              </Collapsible>
              <Collapsible bare title="Chữ thường — để kiểm tra chính tả" hint="Cùng bố cục với chữ có mã ẩn nhưng không có ký tự ẩn — để đọc/kiểm tra chính tả bằng mắt, hoặc dán vào ô nhập của panel CEP." testId="cep-export-plain">
                <label htmlFor="cep-plain" className="block text-sm font-semibold">Chữ thường — dán vào ô nhập của panel CEP / để khách kiểm tra</label>
                <textarea id="cep-plain" readOnly rows={10} value={buildCepPlainText(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <button type="button" onClick={() => onCopyCep(buildCepPlainText(data), "Đã sao chép chữ thường.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ thường</button>
              </Collapsible>
            </div>
            {cepCopyNotice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{cepCopyNotice}</p>}
          </Collapsible>
        </div>
      </section>
    </div>
  );

  // Bước 2 của đường vật lý: CHỈ CÓ 1 form in chuẩn nên không chọn nữa —
  // hiện dòng tĩnh. Giữ physical-forms.ts + physicalFormId trong data làm
  // mốc để sau này thêm form (lúc đó mới mở lại bộ chọn).
  const physicalFormSection = (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <section aria-label="Form vật lý">
        <h2 className="text-base font-bold text-[#7a1f2b]">Form in chuẩn #1 — form lễ/tiệc 2 cột</h2>
      </section>
    </div>
  );

  // Link cho khách sửa — hiện NỔI BẬT trong đường vật lý, ngay dưới form:
  // Lưu thiệp trước, rồi bấm sao chép để gửi khách. Link theo dữ liệu hiện
  // tại (đổi ngay khi sửa), dạng /khach/<id>?d=... như cũ.
  const customerLinkBox = (
    <div data-testid="customer-link-box" className="mt-6 rounded-2xl border-2 border-[#7a1f2b] bg-[#fdf8f1] p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#7a1f2b]">Link cho khách sửa</h2>
      <p className="mt-1 text-sm text-[#5a4a48]">
        Bấm “Lưu thiệp” rồi “Sao chép link cho khách sửa” — gửi link này cho khách, khách mở ra thấy đúng mẫu form in để sửa.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onSave} className="rounded-full bg-[#7a1f2b] px-5 py-3 font-semibold text-white hover:bg-[#5e1620]">Lưu thiệp</button>
        <button type="button" onClick={onCopyEditLink} className="rounded-full border-2 border-[#7a1f2b] px-5 py-3 font-semibold text-[#7a1f2b]">Sao chép link cho khách sửa</button>
      </div>
      <div className="mt-3">
        {customerEditUrl ? (
          <>
            <label htmlFor="customer-link" className="text-sm font-semibold">
              Link cho khách sửa (qua máy chủ — khách mở ra thấy đúng dữ liệu đã lưu, không lộ dữ liệu trong link)
            </label>
            <input id="customer-link" readOnly value={customerLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
          </>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3" role="alert">
            <p className="text-sm font-semibold text-amber-900">Thiệp này chưa có link máy chủ.</p>
            <p className="mt-1 text-sm text-amber-900">
              Đừng gửi link ?d= cho khách: khách sửa được nhưng <strong>không có chỗ ghi chú</strong>, và khách chốt xong chị sẽ <strong>không nhận được thông báo</strong>. Bấm nút bên dưới để lấy link máy chủ — khách có chỗ ghi chú, chốt xong Telegram báo cho chị ngay.
            </p>
            <button type="button" onClick={syncCustomerLinkFromBox} disabled={linkSyncBusy} className="mt-3 rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620] disabled:opacity-50">
              {linkSyncBusy ? "Đang đồng bộ…" : "Đồng bộ để lấy link có ghi chú + báo chốt"}
            </button>
            {linkSyncError && <p className="mt-2 text-sm font-semibold text-red-800" role="alert">{linkSyncError}</p>}
          </div>
        )}
      </div>
      {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
    </div>
  );

  // Đường vật lý: form in CHÍNH LÀ form tạo thiệp — bản xem trước dùng đúng
  // dạng trơn đen + chuẩn hoá NFC như trang khách (một render duy nhất,
  // không còn lệch đỏ/trơn), bấm vào nội dung thì box sửa nổi ngay tại đó.
  const physicalPrintEditor = (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#7a1f2b]">Form in chuẩn #1</h2>
      {readOnly && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="note">
          Thiệp đã {serverStatus === "paid_online" ? "được mua online" : "chốt in"} — editor đang chỉ đọc. Bấm “Mở khóa để sửa” ở mục “Gửi khách duyệt in &amp; bán thiệp online” (cần token admin) mới sửa được.
        </p>
      )}
      <div className="mt-4">
        <PrintFormPreview
          data={data}
          plain
          editable={!readOnly}
          onFieldTap={openPrintFieldEditor}
          onCustomTextTap={openPrintCustomEditor}
          customTexts={customTexts}
          editedFields={editedPrintFields}
          editedCustomTexts={editedPrintCustomTexts}
        />
      </div>

      {/* Box sửa nổi ngay tại chỗ bấm */}
      {printSel && printAnchor && (
        <div
          ref={printPanelRef}
          key={printSel.kind === "field" ? printSel.field : `custom:${printSel.key}`}
          role="dialog"
          aria-label={printSelField ? stdFieldLabel(printSelField) : (printSelCustomDef?.label ?? "Sửa câu mẫu")}
          style={printPanelStyle}
          className="fixed z-50 overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl"
          data-testid="edit-panel"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-[#7a1f2b]">
              {printSelField ? stdFieldLabel(printSelField) : (printSelCustomDef?.label ?? "Sửa câu mẫu")}
            </h2>
            <button type="button" onClick={closePrintEditor} className="rounded-full border px-3 py-1 text-sm" aria-label="Đóng">
              ✕
            </button>
          </div>

          {(printSelCustomKey || printSelField === "message") && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Câu này không vào ghost text — nhớ sửa tay trong Illustrator khi in.
            </p>
          )}

          {printSelField === "ceremonyType" && (
            <div className="mt-3">
              <ChipOptions options={CEREMONY_TYPE_OPTIONS} value={printSelValue} onPick={(v) => setPrintFieldValue("ceremonyType", v)} />
              <p className="mt-2 text-xs text-[#7a6a68]">Đổi loại lễ sẽ đổi bên chủ tiệc theo luật CEP (Vu Quy → nhà gái đứng trước).</p>
            </div>
          )}

          {printSelField === "groomBirthOrder" && (
            <div className="mt-3">
              <ChipOptions options={VITHU_GROOM_OPTIONS} value={printSelValue} onPick={(v) => setPrintFieldValue("groomBirthOrder", v)} />
            </div>
          )}
          {printSelField === "brideBirthOrder" && (
            <div className="mt-3">
              <ChipOptions options={VITHU_BRIDE_OPTIONS} value={printSelValue} onPick={(v) => setPrintFieldValue("brideBirthOrder", v)} />
            </div>
          )}

          {(printSelField === "ceremonyDate" || printSelField === "ceremonyTime") && (
            <div className="mt-3 space-y-3">
              {printSelField === "ceremonyDate" && (
                <div>
                  <label htmlFor="edit-date-le" className="text-sm font-semibold">Chọn ngày làm lễ</label>
                  <input
                    id="edit-date-le"
                    type="date"
                    value={effectiveCeremonyDate(data)}
                    onChange={(e) => setPrintFieldValue("ceremonyDate", e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </div>
              )}
              <div>
                <label htmlFor="edit-time-le" className="text-sm font-semibold">Giờ làm lễ</label>
                <input
                  id="edit-time-le"
                  type="time"
                  value={data.ceremonyTime?.trim() ? data.ceremonyTime : data.time}
                  onChange={(e) => setPrintFieldValue("ceremonyTime", e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{printLeSummary}</p>
              {printSelField === "ceremonyDate" && (
                <p className="text-xs text-[#7a6a68]">Chọn ngày lễ chỉ đổi ngày giờ lễ — ngày tiệc không đổi. Ngày âm tự tính từ ngày dương.</p>
              )}
            </div>
          )}

          {(printSelField === "date" || printSelField === "time") && (
            <div className="mt-3 space-y-3">
              {printSelField === "date" && (
                <div>
                  <label htmlFor="edit-date-tiec" className="text-sm font-semibold">Chọn ngày tiệc</label>
                  <input
                    id="edit-date-tiec"
                    type="date"
                    value={data.date}
                    onChange={(e) => setPrintFieldValue("date", e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </div>
              )}
              <div>
                <label htmlFor="edit-time-tiec" className="text-sm font-semibold">Giờ tiệc</label>
                <input
                  id="edit-time-tiec"
                  type="time"
                  value={data.time}
                  onChange={(e) => setPrintFieldValue("time", e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{printTiecSummary}</p>
              {printSelField === "date" && (
                <p className="text-xs text-[#7a6a68]">Chọn ngày tiệc chỉ đổi ngày giờ tiệc — ngày lễ không đổi. Ngày âm tự tính từ ngày dương.</p>
              )}
            </div>
          )}

          {printSelCustomKey === "printGuestLine" && (
            <div className="mt-3">
              <ChipOptions
                options={["Bỏ trống", "Quý Gia Đình", "Quý Khách"]}
                value={printSelValue === "" ? "Bỏ trống" : printSelValue}
                onPick={(v) => setPrintCustomValue("printGuestLine", v === "Bỏ trống" ? "" : v)}
              />
              <p className="mt-2 text-xs text-[#7a6a68]">Hoặc gõ tên khác:</p>
            </div>
          )}

          {(printSelField !== null && PRINT_TEXTAREA_FIELDS.includes(printSelField)) || printSelCustomKey ? (
            <div className="mt-3">
              <textarea
                id="edit-panel-textarea"
                rows={3}
                value={printSelValue}
                onChange={(e) => {
                  if (printSelCustomKey) setPrintCustomValue(printSelCustomKey, e.target.value);
                  else if (printSelField) setPrintFieldValue(printSelField, e.target.value);
                }}
                className={inputCls}
              />
            </div>
          ) : null}

          {printSelField && !PRINT_COVERED_FIELDS.includes(printSelField) && (
            <div className="mt-3">
              <input
                id="edit-panel-input"
                value={printSelValue}
                onChange={(e) => setPrintFieldValue(printSelField, e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Đổi bên chủ tiệc: chỉ hiện khi đang sửa một trường gia đình. */}
          {isPrintFamilyField && (
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-semibold">Nhà chủ tiệc (bên đứng trước)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HOST_TYPE_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPrintFieldValue("hostType", h)}
                    aria-pressed={(data.hostType ?? "Nhà Trai") === h}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      (data.hostType ?? "Nhà Trai") === h ? "border-[#7a1f2b] bg-[#7a1f2b] text-white" : "border-[#c9a86a] bg-white text-[#7a1f2b]"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={closePrintEditor}
            className="mt-4 w-full rounded-full bg-[#7a1f2b] px-5 py-2.5 font-semibold text-white hover:bg-[#5e1620]"
          >
            Xong
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-[#7a1f2b]">{d.editorTitle}</h1>
      <p className="mt-2 text-[#5a4a48]">{d.editorSub}</p>

      {/* Chọn đường: thiệp vật lý (in) hay thiệp online — mỗi đường chỉ
          hiện phần của mình. Đường vật lý: dán ghost text → chọn form in →
          lưu → gửi link khách. Đường online: chọn mẫu + demo + bán online. */}
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Chọn loại thiệp">
        <button type="button" role="tab" aria-selected={mode === "physical"} onClick={() => setMode("physical")} className={`flex-1 rounded-full py-2.5 font-semibold sm:flex-none sm:px-6 ${mode === "physical" ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}>Thiệp vật lý (in)</button>
        <button type="button" role="tab" aria-selected={mode === "online"} onClick={() => setMode("online")} className={`flex-1 rounded-full py-2.5 font-semibold sm:flex-none sm:px-6 ${mode === "online" ? "bg-[#7a1f2b] text-white" : "border bg-white"}`}>Thiệp online</button>
      </div>
      <p className="mt-2 text-sm text-[#5a4a48]">
        {mode === "physical"
          ? "Thiệp vật lý: dán dữ liệu từ Illustrator → chọn form in → lưu thiệp → gửi link cho khách sửa đúng form đó. Không chọn mẫu online."
          : "Thiệp online: chọn mẫu online, xem trước, rồi bán qua demo + QR ở mục bên dưới."}
      </p>

      {/* Đường vật lý: form in CHÍNH LÀ form tạo thiệp — một khung nhìn duy
          nhất, không còn tab Form nhập liệu / Xem trước. Ảnh + mừng cưới +
          hàng nút (trong `form`, chỉ còn phần online) đặt dưới form in. */}
      {mode === "physical" ? (
        <>
          {cepExchange}
          {physicalFormSection}
          {physicalPrintEditor}
          <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
            <div className="mt-6">
              <h2 className="text-base font-bold text-[#7a1f2b]">Ảnh + mừng cưới cho thiệp online</h2>
              <p className="mt-1 text-sm text-[#5a4a48]">
                Ảnh cưới, ngôn ngữ và VietQR không có trên form in nhưng vẫn cần cho thiệp online — sửa ở đây,
                không cần sang đường online.
              </p>
            </div>
            <div className="mt-3">{form}</div>
          </fieldset>
          {customerLinkBox}
          {serverPanel}
          <Collapsible title="Mẫu thiệp SVG" hint="Tải file SVG xuất từ Illustrator lên — khách mở link sẽ thấy đúng mẫu này. Ít dùng hàng ngày." testId="svg-template-section">
            <SvgTemplateSection data={data} initialPayload={svgPayload} />
          </Collapsible>
        </>
      ) : (
        <>
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
              {templatePicker}
              {form}
            </fieldset>
            <div className={`${tab === "preview" ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#7a6a68]">Xem trước trực tiếp</p>
              <InvitationPreview data={data} />
            </div>
          </div>

          {/* Hộp "Link cho khách sửa" cũng hiện ở đường online (2026-11-11):
              nút "Lưu thiệp" + "Sao chép link cho khách sửa" duy nhất của
              trang nằm trong hộp này — đường online không có hộp riêng nên
              phải render chung, nếu không sẽ mất luôn nút lưu. */}
          {customerLinkBox}
          {/* Mục "Xem demo thiệp online" (v3-final): demo duy nhất đã đổ dữ liệu
              khách, blur tên/ngày/giờ/địa điểm, wizard 3 bước mua online. */}
          {serverPanel}
          {cepExchange}
          <Collapsible title="Mẫu thiệp SVG" hint="Tải file SVG xuất từ Illustrator lên — khách mở link sẽ thấy đúng mẫu này. Ít dùng hàng ngày." testId="svg-template-section-online">
            <SvgTemplateSection data={data} initialPayload={svgPayload} />
          </Collapsible>
          <Collapsible title="Xem demo thiệp online" hint="Demo duy nhất đã đổ dữ liệu khách + wizard 3 bước mua online — bấm mới mở." testId="online-demo-wizard">
            <OnlineDemoWizard
              data={data}
              onPatch={(patch) => setData((prev) => ({ ...prev, ...patch }))}
              serverId={serverId}
              serverStatus={serverStatus}
              adminToken={adminToken}
              onServerChange={(id, status) => { setServerId(id); setSavedId(id); setServerStatus(status); }}
            />
          </Collapsible>
        </>
      )}
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
