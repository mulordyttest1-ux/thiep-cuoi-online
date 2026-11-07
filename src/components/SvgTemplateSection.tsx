// Mục "Mẫu thiệp SVG" trong editor (chỉ Nancy):
//  - Tải file SVG xuất từ Illustrator lên (chọn nhiều file cùng lúc).
//  - Danh sách mẫu đã tải (kho IndexedDB trên máy này).
//  - Link cho khách: mở trang /mau/<id> để khách bấm vào thiệp mà sửa.
//  - Xuất sang Illustrator: 3 ô sao chép (chữ có mã ẩn / metadata / chữ
//    thường) từ dữ liệu đang nhập — cùng chuẩn với mục CEP.
//  - Tải file SVG đã sửa về (dự phòng để mở in).
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { buildCepMetadataJson, buildCepPlainText, buildCepTextBlock } from "@/lib/cep";
import { copyText } from "@/lib/store";
import { svgTemplateStore } from "@/lib/svg-store";
import {
  buildSvgDisplayValues,
  buildSvgViewerUrl,
  cepKeyLabel,
  inlineSvgIfSmall,
  parseSvgTemplate,
  parseXml,
  serializeSvg,
  type SvgSharePayload,
  type SvgTemplateData,
} from "@/lib/svg-template";

const inputCls = "w-full rounded-xl border px-3 py-2";

interface SvgTemplateSectionProps {
  data: InvitationData;
  initialPayload?: SvgSharePayload | null;
}

export default function SvgTemplateSection({ data, initialPayload }: SvgTemplateSectionProps) {
  const [templates, setTemplates] = useState<SvgTemplateData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [customerLink, setCustomerLink] = useState("");
  const [linkWarning, setLinkWarning] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const appliedPayload = useRef(false);

  const refreshList = async () => {
    try {
      setTemplates(await svgTemplateStore.list());
    } catch {
      setNotice("Không mở được kho mẫu trên trình duyệt này.");
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  // Link khách chốt xong gửi lại (?d= dạng SVG): chọn đúng mẫu trong link
  // (dữ liệu thì editor chính đã áp vào form rồi).
  useEffect(() => {
    if (!initialPayload || appliedPayload.current) return;
    appliedPayload.current = true;
    (async () => {
      try {
        if (initialPayload.svg) {
          const parsed = parseSvgTemplate(initialPayload.svg, initialPayload.name || "Mẫu SVG");
          const tpl: SvgTemplateData = { ...parsed, id: initialPayload.tpl || parsed.id };
          await svgTemplateStore.save(tpl);
          await refreshList();
          setSelectedId(tpl.id);
          setNotice("Đã mở mẫu trong link khách gửi lại — kiểm tra dữ liệu rồi xuất sang Illustrator bên dưới.");
          return;
        }
        const stored = await svgTemplateStore.get(initialPayload.tpl);
        if (stored) {
          setSelectedId(stored.id);
          setNotice("Đã mở mẫu trong link khách gửi lại — kiểm tra dữ liệu rồi xuất sang Illustrator bên dưới.");
        } else {
          setNotice("Link khách gửi lại có kèm dữ liệu, nhưng mẫu SVG chưa có trên máy này (file mẫu không kèm trong link).");
        }
      } catch {
        setNotice("Không mở được mẫu trong link khách gửi lại.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPayload]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Chụp số lượng NGAY: files là FileList sống của input — onChange reset
    // e.target.value = "" ngay sau khi gọi onFiles nên tới lúc báo kết quả
    // (sau các await) files.length đã thành 0 ("Đã tải lên 1/0 mẫu").
    const total = files.length;
    const warns: string[] = [];
    let okCount = 0;
    let first: SvgTemplateData | null = null;
    for (const file of Array.from(files)) {
      // Chỉ nhận .svg — PDF/EPS và file khác loại báo rõ, không tạo mẫu.
      if (!/\.svg$/i.test(file.name)) {
        warns.push(`${file.name}: Không nhận định dạng này — chỉ nhận file .svg (xuất từ Illustrator).`);
        continue;
      }
      try {
        const text = await file.text();
        const tpl = parseSvgTemplate(text, file.name);
        // CỬA KIỂM TRA: phải nhận được ít nhất 1 khóa CEP kèm chữ sống
        // (khóa = tên lớp/khung, giá trị = chữ trong khung). 0 khóa → HỦY,
        // không tạo mẫu, không lưu — file chưa xuất đúng chuẩn.
        const cepCount = tpl.fields.filter((f) => f.kind === "cep" && f.value.trim() !== "").length;
        if (cepCount === 0) {
          warns.push(
            `${file.name}: Không nhận được khóa nào trong file — kiểm tra lại trong Illustrator: Object IDs = Layer Names, Fonts = SVG (chữ còn sống), Images = Embed. Không tạo mẫu.`
          );
          continue;
        }
        await svgTemplateStore.save(tpl);
        okCount++;
        warns.push(...tpl.warnings.map((w) => `${file.name}: ${w}`));
        if (!first) first = tpl;
      } catch (e) {
        warns.push(`${file.name}: ${e instanceof Error ? e.message : "không đọc được file"}`);
      }
    }
    await refreshList();
    if (first) setSelectedId(first.id);
    setNotice(`Đã tải lên ${okCount}/${total} mẫu.${warns.length ? " " + warns.join(" ") : ""}`);
  };

  const onDelete = async (id: string) => {
    await svgTemplateStore.remove(id);
    await refreshList();
    if (selectedId === id) {
      setSelectedId("");
      setCustomerLink("");
      setLinkWarning("");
    }
    setNotice("Đã xóa mẫu.");
  };

  const buildCustomerLink = (tpl: SvgTemplateData) => {
    const payload: SvgSharePayload = {
      v: 1,
      tpl: tpl.id,
      name: tpl.name,
      svg: inlineSvgIfSmall(tpl.svgText),
      data,
      extra: {},
      // Kèm danh sách ảnh ngoài chưa nhúng để trang khách báo mất nền
      // (SVG trong link đã làm sạch nên trang khách không tự tìm được).
      externalImages: (tpl.externalImages ?? []).length > 0 ? tpl.externalImages : undefined,
    };
    const link = buildSvgViewerUrl(window.location.origin, payload);
    setCustomerLink(link);
    setLinkWarning(
      payload.svg
        ? ""
        : "File mẫu lớn nên link này CHỈ mở được trên máy đã tải mẫu (khách dùng máy khác sẽ không thấy thiệp). Cần kho chứa online mới gửi khách dùng máy khác được."
    );
    return link;
  };

  const onCopyCustomerLink = async (tpl: SvgTemplateData) => {
    const link = buildCustomerLink(tpl);
    const r = await copyText(link);
    setNotice(r.ok ? "Đã sao chép link cho khách." : "Không sao chép được — bôi đen link rồi copy thủ công.");
  };

  const onCopy = async (text: string, okMsg: string) => {
    const r = await copyText(text);
    setNotice(r.ok ? okMsg : "Không sao chép được — bôi đen rồi copy thủ công.");
  };

  // Xem trước mẫu đã chọn với dữ liệu đang nhập trong editor.
  const selectedPreview = useMemo(() => {
    if (!selected) return "";
    try {
      const parsed = parseXml(selected.svgText);
      const values = buildSvgDisplayValues(data, {}, selected.fields);
      return serializeSvg(parsed, values, { markFields: false });
    } catch {
      return "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, data]);

  const onDownloadSvg = () => {
    if (!selected) return;
    try {
      const parsed = parseXml(selected.svgText);
      const values = buildSvgDisplayValues(data, {}, selected.fields);
      const out = serializeSvg(parsed, values, { markFields: false });
      const blob = new Blob([out], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.name || "mau-thiep"}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice("Đã tải file SVG đã sửa về.");
    } catch {
      setNotice("Không tạo được file SVG để tải về.");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <section className="rounded-2xl border bg-[#fdf8f1] p-4" aria-label="Mẫu thiệp SVG">
        <h2 className="text-base font-bold text-[#7a1f2b]">Mẫu thiệp SVG</h2>
        <p className="mt-1 text-sm text-[#5a4a48]">
          Tải file SVG xuất từ Illustrator lên — khách mở link sẽ thấy đúng mẫu này, bấm vào chữ để sửa.
          Xuất SVG với: Font: SVG (chữ còn sống), Images: Embed (ảnh nhúng), Object IDs: Layer Names
          (tên khung chữ thành mã), Styling: Presentation Attributes. Khung chữ nào đặt tên thì khách sửa
          được, còn lại là chữ mẫu cố định.
        </p>

        <div className="mt-4">
          <label htmlFor="svg-upload" className="text-sm font-semibold">Tải file SVG lên (chọn nhiều file cùng lúc được)</label>
          <input
            ref={fileRef}
            id="svg-upload"
            type="file"
            accept=".svg,image/svg+xml"
            multiple
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
            className={`${inputCls} mt-1 bg-white`}
          />
        </div>

        {templates.length > 0 && (
          <div className="mt-4 space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`text-left font-semibold ${selectedId === t.id ? "text-[#7a1f2b] underline" : ""}`}
                >
                  {t.name}
                </button>
                <span className="text-xs text-[#7a6a68]">
                  {t.fields.length} khung sửa được · {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <span className="flex-1" />
                <a href={`/mau/${encodeURIComponent(t.id)}`} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-sm font-semibold">
                  Xem
                </a>
                <button type="button" onClick={() => onCopyCustomerLink(t)} className="rounded-full border px-3 py-1 text-sm font-semibold">
                  Link cho khách
                </button>
                <button type="button" onClick={() => onDelete(t.id)} className="rounded-full border px-3 py-1 text-sm text-red-800">
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-4 rounded-xl border bg-white p-4">
            <h3 className="text-sm font-bold">Mẫu đang chọn: {selected.name}</h3>
            {selectedPreview ? (
              <div
                className="mx-auto mt-3 max-w-xs overflow-hidden rounded-xl border [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: selectedPreview }}
              />
            ) : (
              <p className="mt-2 text-sm text-red-800">Không xem trước được mẫu này.</p>
            )}
            <p className="mt-3 text-sm font-semibold">Các khung khách sửa được:</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {selected.fields.map((f) => (
                <li key={f.key}>
                  {cepKeyLabel(f.key, data)} <span className="text-xs text-[#7a6a68]">({f.key}{f.kind === "generic" ? " — chữ thường" : ""}{f.occurrences > 1 ? ` · hiện ${f.occurrences} chỗ` : ""})</span>
                </li>
              ))}
            </ul>
            {selected.warnings.length > 0 && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {selected.warnings.join(" ")}
              </p>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => onCopyCustomerLink(selected)}
                className="rounded-full bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1620]"
              >
                Sao chép link cho khách
              </button>
              <button
                type="button"
                onClick={onDownloadSvg}
                className="ml-2 rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]"
              >
                Tải SVG đã sửa về
              </button>
            </div>
            {customerLink && (
              <div className="mt-3">
                <label htmlFor="svg-customer-link" className="text-sm font-semibold">Link cho khách (mở trang sửa trên thiệp)</label>
                <input id="svg-customer-link" readOnly value={customerLink} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-[#fdf8f1] font-mono text-xs`} />
                {linkWarning && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">{linkWarning}</p>}
              </div>
            )}

            {/* Xuất sang Illustrator — cùng chuẩn với mục CEP (chữ thường trong
                app, U+200B chỉ bọc lúc xuất). */}
            <div className="mt-5 border-t pt-4">
              <h4 className="text-sm font-bold">Xuất sang Illustrator (từ dữ liệu đang nhập)</h4>
              <div className="mt-3">
                <label htmlFor="svg-cep-ghost" className="text-sm font-semibold">Chữ có mã ẩn — dán vào text frame trong Illustrator</label>
                <textarea id="svg-cep-ghost" readOnly rows={6} value={buildCepTextBlock(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <button type="button" onClick={() => onCopy(buildCepTextBlock(data), "Đã sao chép chữ có mã ẩn.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ có mã ẩn</button>
              </div>
              <div className="mt-3">
                <label htmlFor="svg-cep-meta" className="text-sm font-semibold">Metadata — dán vào thuộc tính (note) của text frame</label>
                <input id="svg-cep-meta" readOnly value={buildCepMetadataJson()} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <button type="button" onClick={() => onCopy(buildCepMetadataJson(), "Đã sao chép metadata.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép metadata</button>
              </div>
              <div className="mt-3">
                <label htmlFor="svg-cep-plain" className="text-sm font-semibold">Chữ thường — để khách kiểm tra</label>
                <textarea id="svg-cep-plain" readOnly rows={6} value={buildCepPlainText(data)} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 bg-white font-mono text-xs`} />
                <button type="button" onClick={() => onCopy(buildCepPlainText(data), "Đã sao chép chữ thường.")} className="mt-2 rounded-full border-2 border-[#7a1f2b] px-4 py-2 text-sm font-semibold text-[#7a1f2b]">Sao chép chữ thường</button>
              </div>
            </div>
          </div>
        )}

        {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
      </section>
    </div>
  );
}
