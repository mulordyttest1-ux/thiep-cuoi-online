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
  onFieldTap,
  onCustomTextTap,
  customTexts,
  editedFields,
  editedCustomTexts,
}: PrintFormPreviewProps) {
  const b = buildCepBlockData(data);
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
    <span className="ml-1 inline-block rounded-full bg-[#b45309] px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase leading-none text-white">cần sửa tay</span>
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
        title={strong ? "Bấm để sửa lời (không vào ghost text — cần sửa tay trong Illustrator khi in)" : "Bấm để sửa"}
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
  const customWrap = (key: string, children: React.ReactNode) => {
    if (!editable) return <>{children}</>;
    const edited = editedCustomTexts?.has(key);
    return (
      <span
        data-edit-custom={key}
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onCustomTextTap?.(key, tapRect(e)); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCustomTextTap?.(key, tapRect(e as unknown as React.MouseEvent)); } }}
        className={`relative inline-block cursor-pointer rounded px-2 py-0.5 outline-dashed outline-1 outline-[#b45309] hover:bg-[#ffe58a66] focus:outline-[#b45309] ${edited ? "bg-[#ffe58a]" : ""}`}
        title="Bấm để sửa lời (câu mẫu — sửa tay trong Illustrator khi in)"
      >
        {children}
        {edited && manualTag}
      </span>
    );
  };

  // --- Dòng ngày/giờ theo đúng form in ---
  const dateLine = (p: CepDateParts, withColon: boolean) =>
    p.ngay
      ? `VÀO LÚC${withColon ? ":" : ""} ${p.gio} GIỜ ${p.phut} - ${(p.thu || "").toUpperCase()} ${p.ngay}.${p.thang}.${p.nam}`
      : "Chưa chọn ngày";
  const lunarText = (p: CepDateParts) =>
    p.ngay_al ? `Nhằm ngày ${p.ngay_al} tháng ${p.thang_al} năm ${p.nam_al}` : "";

  // Một bên gia đình trong cột lễ: nhãn "Ông Bà:", cha, mẹ, địa chỉ.
  const fam = (side: FamilySide, f: SideFields) => (
    <div className="flex-1 text-center">
      <p className="text-xs font-bold tracking-wide text-[#710001]">Ông Bà:</p>
      <p className="mt-1">{editWrap(f.father, side.ong || "—")}</p>
      <p>{editWrap(f.mother, side.ba || "—")}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-snug">{editWrap(f.addr, side.diachi || "—")}</p>
    </div>
  );

  // Câu kết tiệc: lời mời đã nhập thì hiện lời đó, chưa có thì dùng câu
  // chuẩn của form in (cũng là trường message — sửa thì vào sửa tay).
  const closing = data.message?.trim()
    ? data.message
    : "SỰ HIỆN DIỆN CỦA QUÝ KHÁCH LÀ NIỀM VINH HẠNH CHO GIA ĐÌNH CHÚNG TÔI.";

  return (
    <div
      className="rounded-2xl border-2 border-[#710001] bg-[#f9ede3] p-4 shadow-sm sm:p-6"
      data-testid="print-form"
    >
      <div className="grid gap-8 md:grid-cols-2">
        {/* Cột LỄ */}
        <section aria-label="Lễ" className="text-center font-serif text-[#ea1d25]">
          <div className="flex gap-4">
            {fam(b.pos1, hostF)}
            {fam(b.pos2, guestF)}
          </div>

          <p className="mt-6 text-sm font-bold tracking-wide text-[#710001]">
            TRÂN TRỌNG BÁO TIN LỄ {editWrap("ceremonyType", b.ten_le)} CỦA CON CHÚNG TÔI
          </p>

          <p className="mt-4 text-2xl italic leading-snug md:text-3xl">
            {editWrap(hostF.name, b.pos1.con_full || "—")}
          </p>
          <p className="mt-2 text-sm">
            {editWrap(hostF.vithu, b.pos1.vithu || "—")}{" "}
            <span aria-hidden="true">💍</span>{" "}
            {editWrap(guestF.vithu, b.pos2.vithu || "—")}
          </p>
          <p className="mt-2 text-2xl italic leading-snug md:text-3xl">
            {editWrap(guestF.name, b.pos2.con_full || "—")}
          </p>

          <p className="mt-6 text-sm font-bold tracking-wide text-[#710001]">
            {customWrap("printCeremonyTitle", customTextValue("printCeremonyTitle", customTexts, data))}
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
        <section aria-label="Tiệc" className="text-center font-serif text-[#ea1d25]">
          <p className="text-sm font-bold tracking-wide text-[#710001]">TRÂN TRỌNG KÍNH MỜI</p>
          <div className="mx-auto mt-3 w-3/4 border-t border-dashed border-[#710001]/60" aria-hidden="true" />
          <p className="mt-4 text-sm font-bold leading-relaxed">
            {customWrap("printPartyIntro", customTextValue("printPartyIntro", customTexts, data))}
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
            {editWrap("message", closing, { strong: true })}
          </p>
          <div className="mx-auto mt-4 w-3/4 border-t border-dashed border-[#710001]/60" aria-hidden="true" />
          <p className="mt-3 text-xl font-bold italic">Kính Mời!</p>
        </section>
      </div>
    </div>
  );
}
