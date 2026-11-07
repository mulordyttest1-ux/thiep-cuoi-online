// Trang khách sửa cho mẫu chuẩn #1 (B1): khách duyệt MẪU FORM IN
// (PrintFormPreview, 2 cột lễ/tiệc như file in) thay vì thiệp online.
// Bấm vào nội dung thì BOX SỬA NỔI NGAY TẠI CHỖ BẤM,
// sửa tới đâu thiệp đổi tới đó. Dữ liệu là chữ thường, KHÔNG có U+200B.
//  - Trường dữ liệu (khóa CEP: tên, ngày, địa chỉ...): sửa chảy về ghost
//    text tự động; chỗ đã sửa có dấu chấm nhẹ trên thiệp.
//  - Câu mẫu (tiêu đề lễ / tiêu đề tiệc / lời mời): sửa KHÔNG vào ghost
//    text — đánh dấu MẠNH (nền vàng + "cần sửa tay") + gom vào danh sách
//    "CẦN SỬA TAY TRONG ILLUSTRATOR" lúc chốt.
//  - Mỗi lần bấm Xong trong box sửa: lưu nháp lên máy chủ + ghi 1 dòng vào
//    lịch sử sửa của thiệp (Nancy xem trong Quản lý).
//  - Chốt: lưu cuối + trả ghost text + metadata + danh sách sửa tay.
//  - Sau chốt link khóa lại: máy chủ thì customerConfirmedAt giữ chỉ đọc
//    khi mở lại; link ?d= thì cờ đã-chốt lưu ở localStorage theo id + base
//    nên mở lại trên cùng trình duyệt vẫn chỉ đọc — link mới của Nancy
//    (cùng id, base khác) thì KHÔNG khóa, sửa tiếp bình thường. Dữ liệu
//    khách sửa ở link ?d= còn lưu bản nháp/chốt vào localStorage
//    (td_customer_data_<id>) nên tải lại trang vẫn giữ đúng dữ liệu đã sửa;
//    mở lại link đúng thì khôi phục, link mới của Nancy (dữ liệu gốc khác)
//    thì không bị bản cũ đè.
//  - Sau chốt có nút "Sao chép link đã chốt": link /khach/<id>?d= chứa dữ
//    liệu mới nhất + ?c= (câu mẫu đã sửa, hoặc {} rỗng nếu không sửa câu
//    mẫu nào) để khách gửi cho Nancy. Link đã chốt (LUÔN có ?c=) mở trên
//    máy khác cũng hiện dạng chỉ đọc + ghost text + danh sách sửa tay —
//    vì ?c= chỉ xuất hiện trên link đã chốt.
//  - Chat box cuối trang: khách ghi chú/hỏi, Nancy trả lời trong Quản lý;
//    khách mở lại link sẽ thấy trả lời (không realtime).
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, HistoryEntry, ManualListItem } from "@/lib/access";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock, effectiveCeremonyDate } from "@/lib/cep";
import { normalizeName, suggestAddress, validateData } from "@/lib/cep-logic";
import {
  buildManualList,
  customTextDef,
  customTextValue,
  stdFieldLabel,
} from "@/lib/custom-texts";
import { getDateParts } from "@/lib/lunar";
import { buildCustomerEditUrl, copyText, isCustomerConfirmed, markCustomerConfirmed, saveCustomerSnapshot } from "@/lib/store";
import {
  CEREMONY_TYPE_OPTIONS,
  HOST_TYPE_OPTIONS,
  VITHU_BRIDE_OPTIONS,
  VITHU_GROOM_OPTIONS,
} from "@/lib/svg-template";
import type { InvitationData, StdEditField } from "@/lib/types";
import PrintFormPreview from "./PrintFormPreview";

const inputCls = "w-full rounded-xl border px-3 py-2";

/** Chip chọn nhanh + mục "Khác" nhập tay (lấy ý từ SvgViewer). */
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

// Trường tên/người/nơi: chuẩn hoá viết hoa khi rời ô (điểm nối cep-logic).
const NAME_FIELDS = new Set<StdEditField>([
  "groomName",
  "brideName",
  "groomFather",
  "groomMother",
  "brideFather",
  "brideMother",
  "ceremonyVenue",
  "venue",
]);

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

type Selection = { kind: "field"; field: StdEditField } | { kind: "custom"; key: string };

export interface CustomerStandardEditorProps {
  invitationId: string;
  /** Token sửa — null khi mở bằng link ?d= (không máy chủ: chat/lịch sử không lưu được). */
  editToken: string | null;
  initialData: InvitationData;
  /** Dữ liệu GỐC trong ?d= (chỉ có ở chế độ link ?d=): dùng làm `base` cho
      bản lưu localStorage để chỉ khôi phục khi đúng link đã lưu. */
  originalData?: InvitationData;
  initialCustomTexts?: Record<string, string>;
  initialEditedFields?: string[];
  initialChat?: ChatMessage[];
  initialConfirmedAt?: string | null;
  /** true khi mở link đã chốt (link có ?c= — kể cả {} rỗng khi không sửa
      câu mẫu nào): hiện dạng chỉ đọc + ghost text + danh sách sửa tay
      ngay cả trên máy khác. */
  initialConfirmed?: boolean;
  initialManualList?: ManualListItem[];
}

export default function CustomerStandardEditor({
  invitationId,
  editToken,
  initialData,
  originalData,
  initialCustomTexts,
  initialEditedFields,
  initialChat,
  initialConfirmedAt,
  initialConfirmed,
  initialManualList,
}: CustomerStandardEditorProps) {
  const serverMode = Boolean(editToken);
  const initialMessageRef = useRef(initialData.message ?? "");

  const [data, setDataState] = useState<InvitationData>(initialData);
  const dataRef = useRef(data);
  const setData = (updater: InvitationData | ((prev: InvitationData) => InvitationData)) => {
    const next = typeof updater === "function" ? (updater as (p: InvitationData) => InvitationData)(dataRef.current) : updater;
    dataRef.current = next;
    setDataState(next);
  };

  const [customTexts, setCustomTextsState] = useState<Record<string, string>>(initialCustomTexts ?? {});
  const customTextsRef = useRef(customTexts);
  const setCustomTexts = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: Record<string, string>) => Record<string, string>)(customTextsRef.current)
        : updater;
    customTextsRef.current = next;
    setCustomTextsState(next);
  };

  const [editedFields, setEditedFields] = useState<Set<string>>(new Set(initialEditedFields ?? []));
  const editedFieldsRef = useRef(editedFields);
  const [editedCustomTexts, setEditedCustomTexts] = useState<Set<string>>(
    new Set(Object.keys(initialCustomTexts ?? {}))
  );
  const editedCustomTextsRef = useRef(editedCustomTexts);

  const [selected, setSelected] = useState<Selection | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; bottom: number; width: number } | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<Selection | null>(null);
  selectedRef.current = selected;
  const openValueRef = useRef<{ label: string; value: string; kind: "dữ liệu" | "câu mẫu" } | null>(null);

  const [confirmed, setConfirmed] = useState(Boolean(initialConfirmedAt) || Boolean(initialConfirmed));
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [ghostText, setGhostText] = useState("");
  const [metadata, setMetadata] = useState("");
  const [plainText, setPlainText] = useState("");
  const [confirmedLink, setConfirmedLink] = useState("");
  const [manualList, setManualList] = useState<ManualListItem[]>(initialManualList ?? []);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const [chat, setChat] = useState<ChatMessage[]>(initialChat ?? []);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatNotice, setChatNotice] = useState("");

  // Đã chốt từ trước (mở lại link): dựng lại ghost text + danh sách sửa tay
  // ở máy khách để hiện ngay, không cần bấm Chốt lại. Link ?d= (không máy
  // chủ): cờ đã-chốt lưu ở localStorage theo id + base, chỉ khóa khi base
  // của link đang mở khớp base đã chốt (hoặc dữ liệu đã chốt, tức link đã
  // chốt) — link mới của Nancy (base khác) thì không khóa. Link đã chốt mở
  // trên máy khác (có ?c=, kể cả {} rỗng) thì initialConfirmed đã true nên hiện
  // dạng chỉ đọc + ghost text + danh sách sửa tay.
  useEffect(() => {
    const lockedByFlag =
      !serverMode && !initialConfirmedAt && !initialConfirmed && isCustomerConfirmed(invitationId, originalData ?? initialData);
    if (!initialConfirmedAt && !lockedByFlag && !initialConfirmed) return;
    if (lockedByFlag) setConfirmed(true);
    setGhostText(buildCepTextBlock(initialData));
    setMetadata(buildCepMetadataJson());
    setPlainText(buildCepPlainText(initialData));
    setConfirmedLink(buildCustomerEditUrl(window.location.origin, initialData, customTextsRef.current));
    if (lockedByFlag || initialConfirmed) {
      setManualList(buildManualList(customTextsRef.current, dataRef.current, initialMessageRef.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- giá trị hiện tại ---------- */
  const fieldValue = (field: StdEditField): string => {
    const d = dataRef.current;
    if (field === "ceremonyDate") return effectiveCeremonyDate(d);
    if (field === "ceremonyTime") return d.ceremonyTime?.trim() ? d.ceremonyTime : d.time;
    return (d[field] as string | undefined) ?? "";
  };
  const setFieldValue = (field: StdEditField, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };
  const setCustomValue = (key: string, value: string) => {
    setCustomTexts((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------- box sửa nổi: neo tại chỗ bấm ---------- */
  const openFieldEditor = (field: StdEditField, rect: { top: number; left: number; bottom: number; width: number }) => {
    openValueRef.current = {
      label: stdFieldLabel(field),
      value: fieldValue(field),
      kind: field === "message" ? "câu mẫu" : "dữ liệu",
    };
    setSelected({ kind: "field", field });
    setAnchor(rect);
  };
  const openCustomEditor = (key: string, rect: { top: number; left: number; bottom: number; width: number }) => {
    openValueRef.current = {
      label: customTextDef(key)?.label ?? key,
      value: customTextValue(key, customTextsRef.current, dataRef.current),
      kind: "câu mẫu",
    };
    setSelected({ kind: "custom", key });
    setAnchor(rect);
  };

  const closeEditor = async () => {
    const sel = selectedRef.current;
    const open = openValueRef.current;
    setSelected(null);
    setAnchor(null);
    openValueRef.current = null;
    if (!sel || !open) return;
    // Chuẩn hoá tên khi rời ô.
    let newValue: string;
    if (sel.kind === "field") {
      if (NAME_FIELDS.has(sel.field)) {
        const cur = fieldValue(sel.field);
        const norm = normalizeName(cur);
        if (norm && norm !== cur) setFieldValue(sel.field, norm);
      }
      newValue = fieldValue(sel.field);
    } else {
      newValue = customTextValue(sel.key, customTextsRef.current, dataRef.current);
    }
    if (newValue !== open.value) {
      const entry: HistoryEntry = {
        kind: open.kind,
        label: open.label,
        oldValue: open.value,
        newValue,
        at: new Date().toISOString(),
      };
      // Đánh dấu chỗ đã sửa trên thiệp (giữ cả khi tải lại trang).
      if (sel.kind === "field") {
        const next = new Set(editedFieldsRef.current);
        next.add(sel.field);
        editedFieldsRef.current = next;
        setEditedFields(next);
      } else {
        const next = new Set(editedCustomTextsRef.current);
        next.add(sel.key);
        editedCustomTextsRef.current = next;
        setEditedCustomTexts(next);
      }
      // Lưu nháp lên máy chủ (không chặn UI khi lỗi — Chốt sẽ lưu lại toàn bộ).
      if (serverMode) {
        try {
          await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: editToken,
              data: dataRef.current,
              customTexts: customTextsRef.current,
              editedFields: Array.from(editedFieldsRef.current),
              historyEntry: entry,
            }),
          });
        } catch {
          // Bỏ qua — Chốt sẽ lưu lại toàn bộ.
        }
      }
    }
    // Link ?d= (không máy chủ): lưu ngay bản hiện tại sau mỗi lần đóng box
    // sửa (kể cả chỉ đổi bên chủ tiệc mà không đổi giá trị ô) để tải lại
    // trang không mất dữ liệu đã sửa. Máy chủ thì dữ liệu đã lên server.
    if (!serverMode) {
      saveCustomerSnapshot(
        invitationId,
        originalData ?? dataRef.current,
        dataRef.current,
        customTextsRef.current
      );
    }
  };

  // Neo lại box khi cuộn / xoay màn hình / bàn phím mở (viewport đổi).
  useEffect(() => {
    if (!selected) return;
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
  }, [selected]);

  // Đóng box: bấm ra ngoài box hoặc phím Escape.
  useEffect(() => {
    if (!selected) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (panelRef.current?.contains(t)) return;
      closeEditor();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  /* ---------- vị trí box nổi: kẹp trong viewport ---------- */
  const panelW = Math.min(340, (vp.w || 375) - 16);
  let panelStyle: React.CSSProperties = { width: panelW };
  if (anchor) {
    const vh = vp.h || 667;
    const vw = vp.w || 375;
    const cx = anchor.left + anchor.width / 2;
    const left = Math.max(8, Math.min(cx - panelW / 2, vw - panelW - 8));
    const belowTop = anchor.bottom + 8;
    if (belowTop + 180 <= vh) {
      panelStyle = { width: panelW, left, top: belowTop };
    } else if (anchor.top - 180 >= 8) {
      panelStyle = { width: panelW, left, bottom: vh - anchor.top + 8 };
    } else {
      panelStyle = { width: panelW, left, top: 8 };
    }
  }

  /* ---------- nội dung box sửa ---------- */
  const selField = selected?.kind === "field" ? selected.field : null;
  const selCustomKey = selected?.kind === "custom" ? selected.key : null;
  const selCustomDef = selCustomKey ? customTextDef(selCustomKey) : undefined;
  const selValue = selField ? fieldValue(selField) : selCustomKey ? customTextValue(selCustomKey, customTexts, data) : "";
  const isFamilyField = selField ? FAMILY_FIELDS.has(selField) : false;
  const addressSuggestions =
    selField && (selField === "groomParentsAddress" || selField === "brideParentsAddress" || selField === "address")
      ? suggestAddress(selValue)
      : [];
  const leParts = getDateParts(effectiveCeremonyDate(data));
  const tiecParts = getDateParts(data.date);
  const summary = (parts: ReturnType<typeof getDateParts>, time: string) =>
    parts
      ? `${parts.weekday}, ${parts.day} ${parts.monthDisplay} ${parts.year}${parts.lunarNote ? ` (${parts.lunarNote})` : ""} · lúc ${time}`
      : "Chưa chọn ngày.";
  const leSummary = summary(leParts, data.ceremonyTime?.trim() ? data.ceremonyTime : data.time);
  const tiecSummary = summary(tiecParts, data.time);

  /* ---------- chốt ---------- */
  const onConfirm = async () => {
    const v = validateData(dataRef.current);
    if (!v.ok) {
      setErrors(v.errors);
      setNotice("");
      return;
    }
    setErrors([]);
    setConfirmBusy(true);
    const list = buildManualList(customTextsRef.current, dataRef.current, initialMessageRef.current);
    try {
      if (serverMode) {
        const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: editToken,
            data: dataRef.current,
            customTexts: customTextsRef.current,
            editedFields: Array.from(editedFieldsRef.current),
            manualList: list,
          }),
        });
        const j = (await res.json()) as Record<string, unknown>;
        if (!res.ok || !j.ok) {
          setErrors([typeof j.error === "string" ? j.error : "Không chốt được."]);
          setConfirmBusy(false);
          return;
        }
        setGhostText(String(j.ghostText ?? ""));
        setMetadata(String(j.metadata ?? ""));
        setPlainText(String(j.plainText ?? ""));
        setManualList((j.manualList as ManualListItem[] | undefined) ?? list);
      } else {
        setGhostText(buildCepTextBlock(dataRef.current));
        setMetadata(buildCepMetadataJson());
        setPlainText(buildCepPlainText(dataRef.current));
        setManualList(list);
        // Link ?d= (không máy chủ): ghi cờ đã-chốt theo base + dữ liệu đã
        // chốt để mở lại link vẫn chỉ đọc (link mới base khác thì không
        // khóa) + lưu bản chốt để tải lại vẫn giữ đúng dữ liệu đã sửa.
        markCustomerConfirmed(invitationId, originalData ?? dataRef.current, dataRef.current);
        saveCustomerSnapshot(
          invitationId,
          originalData ?? dataRef.current,
          dataRef.current,
          customTextsRef.current
        );
      }
      setConfirmed(true);
      setConfirmedLink(buildCustomerEditUrl(window.location.origin, dataRef.current, customTextsRef.current));
      setNotice("Đã chốt xong — gửi link đã chốt (hoặc ghost text) cho Nancy.");
    } catch {
      setErrors(["Không chốt được — kiểm tra mạng rồi thử lại."]);
    }
    setConfirmBusy(false);
  };

  const copyGhost = async (text: string, okMsg: string) => {
    const r = await copyText(text);
    setNotice(r.ok ? okMsg : "Không sao chép tự động được — bôi đen rồi copy thủ công.");
  };

  const copyConfirmedLink = async () => {
    const url = confirmedLink || buildCustomerEditUrl(window.location.origin, dataRef.current, customTextsRef.current);
    const r = await copyText(url);
    setNotice(
      r.ok
        ? "Đã sao chép link đã chốt — gửi cho Nancy nhé."
        : "Không sao chép tự động được — bôi đen link rồi copy thủ công."
    );
  };

  /* ---------- chat ---------- */
  const sendChat = async () => {
    const text = chatText.trim();
    if (!text || chatBusy) return;
    if (!serverMode) {
      setChatNotice("Chat cần link khách trên máy chủ — link ?d= không lưu được tin nhắn.");
      return;
    }
    setChatBusy(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: editToken, from: "khach", text }),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (res.ok && j.ok && j.message) {
        setChat((prev) => [...prev, j.message as ChatMessage]);
        setChatText("");
        setChatNotice("");
      } else {
        setChatNotice(typeof j.error === "string" ? j.error : "Không gửi được tin nhắn.");
      }
    } catch {
      setChatNotice("Không gửi được tin nhắn — kiểm tra mạng rồi thử lại.");
    }
    setChatBusy(false);
  };

  const refreshChat = async () => {
    if (!serverMode) return;
    try {
      const res = await fetch(
        `/api/invitations/${encodeURIComponent(invitationId)}?kind=edit&t=${encodeURIComponent(editToken ?? "")}`
      );
      const j = (await res.json()) as Record<string, unknown>;
      if (res.ok && j.ok && Array.isArray(j.chat)) {
        setChat(j.chat as ChatMessage[]);
        setChatNotice("");
      }
    } catch {
      setChatNotice("Không tải lại được tin nhắn.");
    }
  };

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-center font-display text-3xl font-bold text-[#7a1f2b]">Duyệt mẫu in</h1>
      <p className="mt-1 text-center text-sm text-[#5a4a48]">
        Đây là đúng mẫu form sẽ in, bấm vào tên, ngày, địa điểm… để sửa ngay tại chỗ đó. Chỗ đã sửa có dấu
        chấm; câu mẫu đã sửa có nền vàng + nhãn “cần sửa tay”.
      </p>

      <div className="mt-4">
        <PrintFormPreview
          data={data}
          editable={!confirmed}
          onFieldTap={openFieldEditor}
          onCustomTextTap={openCustomEditor}
          customTexts={customTexts}
          editedFields={editedFields}
          editedCustomTexts={editedCustomTexts}
        />
      </div>

      {/* Box sửa nổi ngay tại chỗ bấm */}
      {selected && anchor && (
        <div
          ref={panelRef}
          key={selected.kind === "field" ? selected.field : `custom:${selected.key}`}
          role="dialog"
          aria-label={selField ? stdFieldLabel(selField) : (selCustomDef?.label ?? "Sửa câu mẫu")}
          style={{ ...panelStyle, maxHeight: "55vh" }}
          className="fixed z-50 overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-[#7a1f2b]">
              {selField ? stdFieldLabel(selField) : (selCustomDef?.label ?? "Sửa câu mẫu")}
            </h2>
            <button type="button" onClick={closeEditor} className="rounded-full border px-3 py-1 text-sm" aria-label="Đóng">
              ✕
            </button>
          </div>

          {(selCustomKey || selField === "message") && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Câu mẫu này không vào ghost text — khi chốt sẽ vào danh sách “CẦN SỬA TAY TRONG ILLUSTRATOR” để
              Nancy sửa trong Illustrator.
            </p>
          )}

          {selField === "ceremonyType" && (
            <div className="mt-3">
              <ChipOptions options={CEREMONY_TYPE_OPTIONS} value={selValue} onPick={(v) => setFieldValue("ceremonyType", v)} />
              <p className="mt-2 text-xs text-[#7a6a68]">Đổi loại lễ sẽ đổi bên chủ tiệc theo luật CEP (Vu Quy → nhà gái đứng trước).</p>
            </div>
          )}

          {selField === "groomBirthOrder" && (
            <div className="mt-3">
              <ChipOptions options={VITHU_GROOM_OPTIONS} value={selValue} onPick={(v) => setFieldValue("groomBirthOrder", v)} />
            </div>
          )}
          {selField === "brideBirthOrder" && (
            <div className="mt-3">
              <ChipOptions options={VITHU_BRIDE_OPTIONS} value={selValue} onPick={(v) => setFieldValue("brideBirthOrder", v)} />
            </div>
          )}

          {selField === "ceremonyDate" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="khach-date-le" className="text-sm font-semibold">Chọn ngày làm lễ</label>
                <input
                  id="khach-date-le"
                  type="date"
                  value={effectiveCeremonyDate(data)}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyDate: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label htmlFor="khach-time-le" className="text-sm font-semibold">Giờ làm lễ</label>
                <input
                  id="khach-time-le"
                  type="time"
                  value={data.ceremonyTime?.trim() ? data.ceremonyTime : data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyTime: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{leSummary}</p>
              <p className="text-xs text-[#7a6a68]">Chọn ngày lễ chỉ đổi ngày giờ lễ — ngày tiệc không đổi. Ngày âm tự tính từ ngày dương.</p>
            </div>
          )}

          {selField === "ceremonyTime" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="khach-time-le2" className="text-sm font-semibold">Giờ làm lễ</label>
                <input
                  id="khach-time-le2"
                  type="time"
                  value={data.ceremonyTime?.trim() ? data.ceremonyTime : data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyTime: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{leSummary}</p>
            </div>
          )}

          {selField === "date" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="khach-date-tiec" className="text-sm font-semibold">Chọn ngày tiệc</label>
                <input
                  id="khach-date-tiec"
                  type="date"
                  value={data.date}
                  onChange={(e) => setData((prev) => ({ ...prev, date: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label htmlFor="khach-time-tiec" className="text-sm font-semibold">Giờ tiệc</label>
                <input
                  id="khach-time-tiec"
                  type="time"
                  value={data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, time: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{tiecSummary}</p>
              <p className="text-xs text-[#7a6a68]">Chọn ngày tiệc chỉ đổi ngày giờ tiệc — ngày lễ không đổi. Ngày âm tự tính từ ngày dương.</p>
            </div>
          )}

          {selField === "time" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="khach-time-tiec2" className="text-sm font-semibold">Giờ tiệc</label>
                <input
                  id="khach-time-tiec2"
                  type="time"
                  value={data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, time: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{tiecSummary}</p>
            </div>
          )}

          {(selField === "groomParentsAddress" || selField === "brideParentsAddress" || selField === "address" || selField === "message" || selCustomKey) && (
            <div className="mt-3">
              <textarea
                rows={3}
                value={selValue}
                onChange={(e) => {
                  if (selCustomKey) setCustomValue(selCustomKey, e.target.value);
                  else if (selField) setFieldValue(selField, e.target.value);
                }}
                className={inputCls}
              />
              {addressSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {addressSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selField && setFieldValue(selField, s)}
                      className="block w-full rounded-lg border bg-[#fdf8f1] px-3 py-2 text-left text-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selField && !["ceremonyType", "groomBirthOrder", "brideBirthOrder", "ceremonyDate", "ceremonyTime", "date", "time", "groomParentsAddress", "brideParentsAddress", "address", "message"].includes(selField) && (
            <div className="mt-3">
              <input
                value={selValue}
                onChange={(e) => setFieldValue(selField, e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Đổi bên chủ tiệc: chỉ hiện khi đang sửa một trường gia đình. */}
          {isFamilyField && (
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-semibold">Nhà chủ tiệc (bên đứng trước)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HOST_TYPE_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, hostType: h as InvitationData["hostType"] }))}
                    aria-pressed={data.hostType === h}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      data.hostType === h ? "border-[#7a1f2b] bg-[#7a1f2b] text-white" : "border-[#c9a86a] bg-white text-[#7a1f2b]"
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
            onClick={closeEditor}
            className="mt-4 w-full rounded-full bg-[#7a1f2b] px-5 py-2.5 font-semibold text-white hover:bg-[#5e1620]"
          >
            Xong
          </button>
        </div>
      )}

      {/* Chốt */}
      <div className="mt-6">
        {!confirmed ? (
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmBusy}
            className="w-full rounded-full bg-[#7a1f2b] px-5 py-3 font-semibold text-white hover:bg-[#5e1620] disabled:opacity-60"
          >
            {confirmBusy ? "Đang chốt…" : "Chốt — gửi lại cho Nancy"}
          </button>
        ) : (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800" role="status">
            Đã chốt xong. Gửi link đã chốt bên dưới cho Nancy để chị in thiệp.
          </p>
        )}
        {errors.length > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        {confirmed && ghostText && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <label htmlFor="khach-confirmed-link" className="text-sm font-semibold">
                Link đã chốt — gửi cho Nancy
              </label>
              <p className="mt-1 text-xs text-[#7a6a68]">
                Link này chứa đúng dữ liệu vừa chốt. Nancy mở ra sẽ thấy thiệp đã sửa và ghost text đúng để in.
              </p>
              <input
                id="khach-confirmed-link"
                readOnly
                value={confirmedLink}
                onFocus={(e) => e.target.select()}
                className={`${inputCls} mt-2 bg-[#fdf8f1] text-xs`}
              />
              <div className="mt-3">
                <button
                  type="button"
                  onClick={copyConfirmedLink}
                  data-testid="copy-confirmed-link"
                  className="rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]"
                >
                  Sao chép link đã chốt
                </button>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <label htmlFor="khach-ghost" className="text-sm font-semibold">
                Chữ cho Illustrator (đã chốt — chỉ trường dữ liệu)
              </label>
              <textarea
                id="khach-ghost"
                readOnly
                rows={8}
                value={ghostText}
                onFocus={(e) => e.target.select()}
                className={`${inputCls} mt-1 bg-[#fdf8f1] font-mono text-xs`}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyGhost(ghostText, "Đã sao chép ghost text.")}
                  className="rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]"
                >
                  Sao chép ghost text
                </button>
                <button
                  type="button"
                  onClick={() => copyGhost(metadata, "Đã sao chép metadata.")}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                >
                  Sao chép metadata
                </button>
                <button
                  type="button"
                  onClick={() => copyGhost(plainText, "Đã sao chép bản chữ thường.")}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold"
                >
                  Sao chép chữ thường
                </button>
              </div>
            </div>
            {manualList.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm" role="alert">
                <h2 className="text-base font-bold text-amber-900">CẦN SỬA TAY TRONG ILLUSTRATOR</h2>
                <p className="mt-1 text-xs text-amber-900">
                  Những câu này không vào ghost text được — Nancy sửa tay trong file Illustrator trước khi in.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-900">
                  {manualList.map((m) => (
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
          </div>
        )}
        {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
      </div>

      {/* Chat với Nancy */}
      <section className="mt-8 rounded-2xl border bg-white p-4 shadow-sm" aria-label="Chat với Nancy">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#7a1f2b]">Nhắn cho Nancy</h2>
          {serverMode && (
            <button type="button" onClick={refreshChat} className="rounded-full border px-3 py-1 text-xs font-semibold">
              ↻ Tải lại tin nhắn
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-[#7a6a68]">
          Ghi chú / hỏi đáp về thiệp — không dùng để sửa nội dung (sửa bằng cách bấm vào thiệp ở trên).
        </p>
        <div className="mt-3 space-y-2" data-testid="chat-list">
          {chat.length === 0 && (
            <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm text-[#7a6a68]">Chưa có tin nhắn nào.</p>
          )}
          {chat.map((m, i) => (
            <div key={`${m.at}-${i}`} className={`flex ${m.from === "khach" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "khach" ? "bg-[#7a1f2b] text-white" : "bg-[#f3e8d8] text-[#3d2b29]"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <p className={`mt-1 text-[10px] ${m.from === "khach" ? "text-white/70" : "text-[#7a6a68]"}`}>
                  {m.from === "khach" ? "Bạn" : "Nancy"} · {fmtTime(m.at)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendChat();
            }}
            placeholder="Nhắn cho Nancy…"
            maxLength={2000}
            className={inputCls}
            aria-label="Nhắn cho Nancy"
          />
          <button
            type="button"
            onClick={sendChat}
            disabled={chatBusy || !chatText.trim()}
            data-testid="chat-send"
            className="shrink-0 rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Gửi
          </button>
        </div>
        {chatNotice && <p className="mt-2 text-xs text-amber-900" role="status">{chatNotice}</p>}
        {!serverMode && (
          <p className="mt-2 text-xs text-[#7a6a68]">
            Link này không qua máy chủ nên tin nhắn không lưu được — nhờ Nancy gửi link khách trên máy chủ để chat.
          </p>
        )}
      </section>
    </div>
  );
}
