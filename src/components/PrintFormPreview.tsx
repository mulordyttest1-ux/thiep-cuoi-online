// Xem trước mẫu form in chuẩn #1 (form in vật lý, 2 cột lễ/tiệc) cho trang
// khách sửa: khách duyệt đúng nội dung sẽ in, chỉ nội dung sẽ in, không
// thêm các mục chỉ có trên thiệp online.
// Bấm vào nội dung thì mở box sửa như InvitationPreview (cùng props
// onFieldTap/onCustomTextTap, customTexts, editedFields, editedCustomTexts).
// Thứ tự bên chủ tiệc theo luật CEP (buildCepBlockData): pos1 = bên chủ
// tiệc (Vu Quy / Nhà Gái thì nhà gái trước, còn lại nhà trai trước).
// Ngày âm tự tính từ ngày dương (lunar.ts) qua buildCepBlockData.
"use client";

import type { CepDateParts } from "@/lib/cep";
import { buildCepBlockData, isBrideHost } from "@/lib/cep";
import { customTextValue } from "@/lib/custom-texts";
import type { InvitationData, StdEditField } from "@/lib/types";

export interface PrintFormPreviewProps {
  data: InvitationData;
  editable?: boolean;
  /** Dạng trơn cho trang khách sửa: chữ đen, một font hệ thống, không màu
      form in — chỉ trang khách dùng; xem trước ở /tao-thiep giữ dạng màu. */
  plain?: boolean;
  onFieldTap?: (field: StdEditField, rect: { top: number; left: number; bottom: number; width: number }) => void;
  onCustomTextTap?: (key: string, rect: { top: number; left: number; bottom: number; width: number }) => void;
  customTexts?: Record<string, string>;
  editedFields?: Set<string>;
  editedCustomTexts?: Set<string>;
}

type Rect = { top: number; left: number; bottom: number; width: number };

interface SideFields {
  father: StdEditField;
  mother: StdEditField;
  addr: StdEditField;
  name: StdEditField;
  vithu: StdEditField;
}

interface FamilySide {
  ong: string;
  ba: string;
  diachi: string;
  con_full: string;
  vithu: string;
}

export default function PrintFormPreview({
  data,
  editable,
  plain,
  onFieldTap,
  onCustomTextTap,
  customTexts,
  editedFields,
  editedCustomTexts,
}: PrintFormPreviewProps) {
  const rawBlock = buildCepBlockData(data);
  // Dạng trơn: chuẩn hoá NFC mọi giá trị hiển thị — dữ liệu cũ đã lưu dạng
  // dấu rời sẽ hiện đúng dấu ngay, không cần dán lại.
  const nfc = (s: string) => (s ?? "").normalize("NFC");
  const nfcSide = (s: FamilySide): FamilySide => ({
    ong: nfc(s.ong),
    ba: nfc(s.ba),
    diachi: nfc(s.diachi),
    con_full: nfc(s.con_full),
    vithu: nfc(s.vithu),
  });
  const nfcParts = (p: CepDateParts): CepDateParts => ({ ...p, thu: nfc(p.thu) });
  const b = plain
    ? {
        ...rawBlock,
        ten_le: nfc(rawBlock.ten_le),
        pos1: nfcSide(rawBlock.pos1),
        pos2: nfcSide(rawBlock.pos2),
        ceremonyTen: nfc(rawBlock.ceremonyTen),
        le: nfcParts(rawBlock.le),
        tiec: nfcParts(rawBlock.tiec),
        venueTen: nfc(rawBlock.venueTen),
        venueDiachi: nfc(rawBlock.venueDiachi),
      }
    : rawBlock;
  // Câu mẫu cũng về NFC ở dạng trơn (cùng lý do như trên).
  const ct = (key: string) => {
    const v = customTextValue(key, customTexts, data);
    return plain ? v.normalize("NFC") : v;
  };
  const brideHost = isBrideHost(data);
  // pos1 = bên chủ tiệc, pos2 = bên còn lại (theo luật CEP).
  const hostF: SideFields = brideHost
    ? { father: "brideFather", mother: "brideMother", addr: "brideParentsAddress", name: "brideName", vithu: "brideBirthOrder" }
    : { father: "groomFather", mother: "groomMother", addr: "groomParentsAddress", name: "groomName", vithu: "groomBirthOrder" };
  const guestF: SideFields = brideHost
    ? { father: "groomFather", mother: "groomMother", addr: "groomParentsAddress", name: "groomName", vithu: "groomBirthOrder" }
    : { father: "brideFather", mother: "brideMother", addr: "brideParentsAddress", name: "brideName", vithu: "brideBirthOrder" };

  // --- Bấm để sửa: cùng kiểu với InvitationPreview ---
  const tapRect = (e: React.MouseEvent): Rect => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { top: r.top, left: r.left, bottom: r.bottom, width: r.width };
  };
  const editedDot = (
    <span aria-label="Đã sửa" title="Đã sửa" className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a86a] text-[10px] font-bold leading-none text-white">•</span>
  );
  const manualTag = (
    <span className="ml-1 inline-block rounded-full bg-[#b45309] px-1.5 py-0.5 align-middle text-[9px] font-bold leading-none text-white">Thiết kế chỉnh lại</span>
  );
  const editWrap = (field: StdEditField, children: React.ReactNode, opts?: { strong?: boolean }) => {
    if (!editable) return <>{children}</>;
    const edited = editedFields?.has(field);
    const strong = opts?.strong ?? false;
    return (
      <span
        data-edit-field={field}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onFieldTap?.(field, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFieldTap?.(field, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative inline-block cursor-pointer rounded px-2 py-0.5 outline-dashed outline-1 hover:bg-[#7a1f2b14] focus:outline-[#7a1f2b] ${strong ? "outline-[#b45309]" : "outline-[#7a1f2b55]"} ${edited ? (strong ? "bg-[#ffe58a]" : "bg-[#c9a86a26]") : ""}`}
        title={strong ? "Bấm để sửa lời (Thiết kế sẽ chỉnh lại giúp bạn)" : "Bấm để sửa"}
      >
        {children}
        {edited && !strong && editedDot}
        {edited && strong && manualTag}
      </span>
    );
  };
  const editBlock = (field: StdEditField, children: React.ReactNode) => {
    if (!editable) return <>{children}</>;
    const edited = editedFields?.has(field);
    return (
      <div
        data-edit-field={field}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onFieldTap?.(field, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFieldTap?.(field, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative cursor-pointer rounded px-2 py-0.5 outline-dashed outline-1 outline-[#7a1f2b55] hover:bg-[#7a1f2b14] focus:outline-[#7a1f2b] ${edited ? "bg-[#c9a86a26]" : ""}`}
        title="Bấm để sửa"
      >
        {children}
        {edited && editedDot}
      </div>
    );
  };
  const customWrap = (key: string, children: React.ReactNode, opts?: { block?: boolean }) => {
    if (!editable) return <>{children}</>;
    const edited = editedCustomTexts?.has(key);
    return (
      <span
        data-edit-custom={key}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onCustomTextTap?.(key, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCustomTextTap?.(key, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative cursor-pointer rounded px-2 py-0.5 outline-dashed outline-1 outline-[#b45309] hover:bg-[#ffe58a66] focus:outline-[#b45309] ${opts?.block ? "block w-full" : "inline-block"} ${edited ? "bg-[#ffe58a]" : ""}`}
        title="Bấm để sửa lời (Thiết kế sẽ chỉnh lại giúp bạn)"
      >
        {children}
        {edited && manualTag}
      </span>
    );
  };

  // --- Dòng ngày/giờ theo đúng form in ---
  // Sentence case: chỉ "Vào" hoa đầu dòng, "giờ" thường; p.thu đã là
  // tên riêng đúng dấu ("Thứ Bảy"/"Chủ Nhật", Intl vi-VN) nên giữ nguyên.
  const dateLine = (p: CepDateParts, withColon: boolean) =>
    p.ngay
      ? `Vào lúc${withColon ? ":" : ""} ${p.gio} giờ ${p.phut} - ${p.thu || ""} ${p.ngay}.${p.thang}.${p.nam}`
      : "Chưa chọn ngày";
  const lunarText = (p: CepDateParts) =>
    p.ngay_al ? `Nhằm ngày ${p.ngay_al} tháng ${p.thang_al} năm ${p.nam_al}` : "";

  // Một bên gia đình trong cột lễ: nhãn "Ông bà:", cha, mẹ, địa chỉ.
  const fam = (side: FamilySide, f: SideFields) => (
    <div className="flex-1 text-center">
      <p className={`text-xs font-bold tracking-wide ${plain ? "text-black" : "text-[#710001]"}`}>Ông bà:</p>
      <p className="mt-1">{editWrap(f.father, side.ong || "—")}</p>
      <p>{editWrap(f.mother, side.ba || "—")}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-snug">{editWrap(f.addr, side.diachi || "—")}</p>
    </div>
  );

  // Dòng tên khách dưới "Trân trọng kính mời": chưa có chữ thì 1 hàng
  // chấm, có chữ thì hiện chữ đó trên gạch chấm dưới.
  const guestName = ct("printGuestLine").trim();
  const guestLine = guestName ? (
    <span className={`border-b border-dotted px-1 pb-0.5 text-lg font-bold ${plain ? "border-black/70" : "border-[#710001]/70"}`}>{guestName}</span>
  ) : (
    <span aria-hidden="true" className="tracking-[0.2em]">........................................</span>
  );

  // Câu kết tiệc: lời mời đã nhập thì hiện lời đó, chưa có thì dùng câu
  // chuẩn của form in (cũng là trường message — sửa thì vào sửa tay).
  const closing = data.message?.trim()
    ? data.message
    : "Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.";
  const closingText = plain ? closing.normalize("NFC") : closing;

  // Dạng trơn: toàn bộ nội dung thiệp màu đen, một font hệ thống chuẩn của
  // trình duyệt (không serif, không đỏ, không nền kem, không viền đỏ,
  // không chữ nghiêng) để dấu tiếng Việt không vỡ trên điện thoại/máy tính.
  const sectionCls = plain ? "text-center text-black" : "text-center font-serif text-[#ea1d25]";
  const labelCls = plain ? "text-black" : "text-[#710001]";
  const italicCls = plain ? "" : " italic";

  return (
    <div
      className={plain ? "rounded-2xl border border-black/20 bg-white p-4 shadow-none sm:p-6" : "rounded-2xl border-2 border-[#710001] bg-[#f9ede3] p-4 shadow-sm sm:p-6"}
      style={plain ? { fontFamily: '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } : undefined}
      data-testid="print-form"
      data-plain={plain ? "true" : undefined}
    >
      <div className="grid gap-8 md:grid-cols-2">
        {/* Cột LỄ */}
        <section aria-label="Lễ" className={sectionCls}>
          <div className="flex gap-4">
            {fam(b.pos1, hostF)}
            {fam(b.pos2, guestF)}
          </div>

          <p className={`mt-6 text-sm font-bold tracking-wide ${labelCls}`}>
            Trân trọng báo tin lễ {editWrap("ceremonyType", b.ten_le)} của con chúng tôi
          </p>

          <p className={`mt-4 text-2xl leading-snug md:text-3xl${italicCls}`}>
            {editWrap(hostF.name, b.pos1.con_full || "—")}
          </p>
          <p className="mt-2 text-sm">
            {editWrap(hostF.vithu, b.pos1.vithu || "—")}{" "}
            <span aria-hidden="true">💍</span>{" "}
            {editWrap(guestF.vithu, b.pos2.vithu || "—")}
          </p>
          <p className={`mt-2 text-2xl leading-snug md:text-3xl${italicCls}`}>
            {editWrap(guestF.name, b.pos2.con_full || "—")}
          </p>

          <p className={`mt-6 text-sm font-bold tracking-wide ${labelCls}`}>
            {customWrap("printCeremonyTitle", ct("printCeremonyTitle"))}
          </p>
          <p className="mt-1 text-xl font-bold leading-snug">
            {editWrap("ceremonyVenue", b.ceremonyTen || "—")}
          </p>

          {editBlock(
            "ceremonyDate",
            <>
              <p className="mt-4 text-sm font-bold">{dateLine(b.le, true)}</p>
              {lunarText(b.le) && <p className="mt-1 text-xs">({lunarText(b.le)})</p>}
            </>
          )}
        </section>

        {/* Cột TIỆC */}
        <section aria-label="Tiệc" className={sectionCls}>
          <p className={`text-sm font-bold tracking-wide ${labelCls}`}>Trân trọng kính mời</p>
          <p className="mt-5">
            {customWrap("printGuestLine", guestLine)}
          </p>
          <p className="mt-4 text-sm font-bold leading-relaxed">
            {customWrap("printPartyIntro", ct("printPartyIntro"))}
          </p>
          <p className="mt-2 text-xl font-bold leading-snug">{editWrap("venue", b.venueTen || "—")}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-snug">
            {editWrap("address", b.venueDiachi || "—")}
          </p>

          {editBlock(
            "date",
            <>
              <p className="mt-4 text-sm font-bold">{dateLine(b.tiec, false)}</p>
              {lunarText(b.tiec) && <p className="mt-1 text-xs">({lunarText(b.tiec)})</p>}
            </>
          )}

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
            {editWrap("message", closingText, { strong: true })}
          </p>
          {/* Câu kết chuẩn của mẫu in: hàng chấm kéo tới chữ "Kính mời!" —
              leader bằng chữ chấm (cùng kiểu với hàng chấm tên khách), cắt
              theo chiều rộng màn hình. Chấm là cách trình bày, không phải
              nội dung: customTextValue đã bỏ chấm đầu của giá trị đã lưu. */}
          <p className={`mt-8 text-xl font-bold${italicCls}`}>
            {customWrap("printClosing", (
              <span className="flex items-baseline gap-1">
                <span aria-hidden="true" className="min-w-0 flex-1 overflow-hidden whitespace-nowrap tracking-[0.2em]">........................................</span>
                <span className="shrink-0">{ct("printClosing")}</span>
              </span>
            ), { block: true })}
          </p>
        </section>
      </div>
    </div>
  );
}
