// Trang xem mẫu SVG cho khách (tap-to-edit):
//  - Thiệp là PREVIEW (SVG), tự co vừa màn hình, zoom được (chụm 2 ngón
//    như xem ảnh + nút +/−). Chữ là vector nên phóng to không mờ.
//  - Bấm vào chữ trên thiệp → ô sửa hiện ngay BÊN DƯỚI thiệp, sửa tới đâu
//    thiệp đổi tới đó. Chỉ khung đã đặt tên mới bấm được; chữ mẫu cố định
//    bấm vào không làm gì.
//  - Dữ liệu là chữ thường, KHÔNG có U+200B trong luồng khách.
//  - Ngày lễ / ngày tiệc là hai nhóm độc lập: lịch lễ chỉ đổi nhóm lễ,
//    lịch tiệc chỉ đổi nhóm tiệc.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types";
import { buildCepValues } from "@/lib/cep";
import { copyText } from "@/lib/store";
import {
  applySvgFieldEdit,
  buildSvgDisplayValues,
  buildSvgViewerUrl,
  cepKeyLabel,
  CEREMONY_TYPE_OPTIONS,
  extractSvgFields,
  fieldKindForKey,
  HOST_TYPE_OPTIONS,
  inlineSvgIfSmall,
  normalizeSvgData,
  parseXml,
  sanitizeSvg,
  serializeSvg,
  VITHU_BRIDE_OPTIONS,
  VITHU_GROOM_OPTIONS,
  type SvgField,
  type SvgSharePayload,
} from "@/lib/svg-template";
import { normalizeName, suggestAddress, validateData } from "@/lib/cep-logic";

const inputCls = "w-full rounded-xl border px-3 py-2";

/** Chip chọn nhanh + mục "Khác" nhập tay. Giá trị hiện tại không nằm trong
    danh sách thì hiện riêng một chip đã chọn (vd: "Trưởng Nữ"). */
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

// Khóa tên/người/nơi: chuẩn hoá viết hoa khi rời ô (điểm nối cep-logic).
const NAME_KEYS = new Set([
  "pos1.con_full", "pos2.con_full",
  "pos1.ong", "pos1.ba", "pos2.ong", "pos2.ba",
  "ceremony.ten", "venue.ten",
]);

export interface SvgViewerProps {
  templateId: string;
  templateName: string;
  svgText: string; // SVG đã làm sạch
  initialData: InvitationData;
  initialExtra?: Record<string, string>;
}

export default function SvgViewer({ templateId, templateName, svgText, initialData, initialExtra }: SvgViewerProps) {
  const [data, setData] = useState<InvitationData>(() => normalizeSvgData(initialData));
  const [extra, setExtra] = useState<Record<string, string>>(initialExtra ?? {});
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [confirmed, setConfirmed] = useState(false);
  const [returnLink, setReturnLink] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ d0: number; s0: number } | null>(null);
  const panRef = useRef<{ x0: number; y0: number; zx: number; zy: number } | null>(null);
  const movedRef = useRef(false);

  // Cây SVG + danh sách khung sửa được (từ file mẫu, không đổi theo dữ liệu).
  const { tree, fields } = useMemo(() => {
    try {
      const parsed = parseXml(svgText);
      const { tree: clean } = sanitizeSvg(parsed);
      const { fields: f } = extractSvgFields(clean);
      return { tree: clean, fields: f };
    } catch {
      return { tree: null, fields: [] as SvgField[] };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgText]);

  const cepVals = useMemo(() => buildCepValues(data), [data]);
  const at = (k: string) => cepVals.values[cepVals.keys.indexOf(k)] ?? "";
  const displayValues = useMemo(
    () => (tree ? buildSvgDisplayValues(data, extra, fields) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, extra, fields, tree]
  );
  const renderedSvg = useMemo(
    () => (tree ? serializeSvg(tree, displayValues, { markFields: true }) : ""),
    [tree, displayValues]
  );

  // Vùng bấm rộng cho chữ nhỏ: vẽ rect trong suốt ôm quanh mỗi <text> sửa
  // được (dựa trên getBBox sau khi render) + khung nét đứt cho ô đang chọn.
  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;
    const svg = box.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll("rect[data-hit]").forEach((r) => r.remove());
    const SVGNS = "http://www.w3.org/2000/svg";
    svg.querySelectorAll<SVGTextElement>("[data-field]").forEach((t) => {
      try {
        const bb = t.getBBox();
        const key = t.getAttribute("data-field") ?? "";
        const rect = document.createElementNS(SVGNS, "rect");
        rect.setAttribute("data-hit", "1");
        rect.setAttribute("data-field", key);
        rect.setAttribute("x", String(bb.x - 10));
        rect.setAttribute("y", String(bb.y - 8));
        rect.setAttribute("width", String(bb.width + 20));
        rect.setAttribute("height", String(bb.height + 16));
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("pointer-events", "all");
        t.parentNode?.insertBefore(rect, t);
        if (key === selected) {
          const frame = document.createElementNS(SVGNS, "rect");
          frame.setAttribute("data-hit", "1");
          frame.setAttribute("x", String(bb.x - 10));
          frame.setAttribute("y", String(bb.y - 8));
          frame.setAttribute("width", String(bb.width + 20));
          frame.setAttribute("height", String(bb.height + 16));
          frame.setAttribute("fill", "none");
          frame.setAttribute("stroke", "#7a1f2b");
          frame.setAttribute("stroke-width", "2");
          frame.setAttribute("stroke-dasharray", "6 4");
          frame.setAttribute("rx", "6");
          t.parentNode?.insertBefore(frame, t.nextSibling);
        }
      } catch {
        // text chưa layout xong — bỏ qua lần này
      }
    });
  }, [renderedSvg, selected]);

  /* ---------- zoom: nút +/−, chụm 2 ngón, kéo khi đã phóng to ---------- */
  const clampZoom = (z: { scale: number; x: number; y: number }) => {
    const scale = Math.min(4, Math.max(1, z.scale));
    const max = (scale - 1) * 220;
    return { scale, x: Math.min(max, Math.max(-max, z.x)), y: Math.min(max, Math.max(-max, z.y)) };
  };
  const zoomStep = (d: number) => setZoom((z) => clampZoom({ ...z, scale: z.scale + d }));
  const zoomReset = () => setZoom({ scale: 1, x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = { d0: Math.hypot(a.x - b.x, a.y - b.y), s0: zoom.scale };
      movedRef.current = true;
      panRef.current = null;
    } else {
      movedRef.current = false;
      panRef.current = { x0: e.clientX, y0: e.clientY, zx: zoom.x, zy: zoom.y };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointersRef.current.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchRef.current.d0 > 0) {
        const s0 = pinchRef.current.s0;
        const d0 = pinchRef.current.d0;
        setZoom((z) => clampZoom({ ...z, scale: s0 * (d / d0) }));
      }
      return;
    }
    if (panRef.current && zoom.scale > 1) {
      const dx = e.clientX - panRef.current.x0;
      const dy = e.clientY - panRef.current.y0;
      if (Math.abs(dx) + Math.abs(dy) > 12) movedRef.current = true;
      const zx = panRef.current.zx;
      const zy = panRef.current.zy;
      setZoom((z) => clampZoom({ ...z, x: zx + dx, y: zy + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panRef.current = null;
  };
  const onContainerClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    const el = (e.target as Element).closest?.("[data-field]");
    if (el) {
      const key = el.getAttribute("data-field");
      if (key) setSelected(key);
    }
    // Bấm vào chữ mẫu cố định / nền: không làm gì.
  };

  /* ---------- sửa giá trị ---------- */
  const setFieldValue = (key: string, value: string) => {
    if (fields.some((f) => f.key === key && f.kind === "cep")) {
      setData((prev) => applySvgFieldEdit(prev, key, value));
    } else {
      setExtra((prev) => ({ ...prev, [key]: value }));
    }
  };
  const onFieldBlur = (key: string) => {
    if (!NAME_KEYS.has(key)) return;
    const cur = displayValues[key] ?? "";
    const norm = normalizeName(cur);
    if (norm && norm !== cur) setFieldValue(key, norm);
  };

  const selectedField = fields.find((f) => f.key === selected) ?? null;
  const selectedKind = selectedField ? fieldKindForKey(selectedField.key, data) : null;
  const selectedValue = selectedField ? displayValues[selectedField.key] ?? "" : "";
  const isPosField = selectedField?.key.startsWith("pos1.") || selectedField?.key.startsWith("pos2.");
  const vithuOptions =
    selectedField && selectedKind === "vithuGroom"
      ? VITHU_GROOM_OPTIONS
      : selectedField && selectedKind === "vithuBride"
        ? VITHU_BRIDE_OPTIONS
        : [];

  const leSummary = `${at("date.le.thu")}, ${at("date.le.ngay")}.${at("date.le.thang")}.${at("date.le.nam")} (nhằm ${at(
    "date.le.ngay_al"
  )}.${at("date.le.thang_al")} năm ${at("date.le.nam_al")}) · lúc ${at("date.le.gio")}:${at("date.le.phut")}`;
  const tiecSummary = `${at("date.tiec.thu")}, ${at("date.tiec.ngay")}.${at("date.tiec.thang")}.${at(
    "date.tiec.nam"
  )} (nhằm ${at("date.tiec.ngay_al")}.${at("date.tiec.thang_al")} năm ${at("date.tiec.nam_al")}) · lúc ${at(
    "date.tiec.gio"
  )}:${at("date.tiec.phut")}`;

  const addressSuggestions = selectedField && selectedKind === "textarea" ? suggestAddress(selectedValue) : [];

  /* ---------- chốt ---------- */
  const onConfirm = () => {
    const v = validateData(data);
    if (!v.ok) {
      setErrors(v.errors);
      setNotice("");
      return;
    }
    setErrors([]);
    const payload: SvgSharePayload = {
      v: 1,
      tpl: templateId,
      name: templateName,
      svg: inlineSvgIfSmall(svgText),
      data,
      extra,
    };
    const link = buildSvgViewerUrl(window.location.origin, payload);
    setReturnLink(link);
    setConfirmed(true);
    setNotice("Đã chốt xong — sao chép link bên dưới gửi lại cho Nancy.");
  };
  const onCopyReturn = async () => {
    const r = await copyText(returnLink);
    setNotice(r.ok ? "Đã sao chép link gửi lại." : "Không sao chép được — bôi đen link rồi copy thủ công.");
  };

  if (!tree) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Không mở được mẫu thiệp này (file SVG lỗi). Nhờ Nancy gửi lại link mới.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-center font-display text-3xl font-bold text-[#7a1f2b]">{templateName}</h1>
      <p className="mt-1 text-center text-sm text-[#5a4a48]">
        Bấm vào chữ trên thiệp để sửa. Chữ không bấm được là câu mẫu cố định.
      </p>

      {/* Nút zoom */}
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={() => zoomStep(-0.5)} aria-label="Thu nhỏ" className="rounded-full border bg-white px-4 py-2 text-lg font-bold">−</button>
        <button type="button" onClick={zoomReset} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
          {Math.round(zoom.scale * 100)}%
        </button>
        <button type="button" onClick={() => zoomStep(0.5)} aria-label="Phóng to" className="rounded-full border bg-white px-4 py-2 text-lg font-bold">+</button>
      </div>

      {/* Preview SVG — zoom + bấm để sửa */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onContainerClick}
        style={{ touchAction: zoom.scale > 1 ? "none" : "pan-y" }}
        className="mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm"
      >
        <div
          style={{
            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&_[data-field]]:cursor-pointer"
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        </div>
      </div>

      {/* Ô sửa hiện ngay bên dưới thiệp khi bấm vào một khung */}
      {selectedField && selectedKind && (
        <div key={selectedField.key} className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-[#7a1f2b]">{cepKeyLabel(selectedField.key, data)}</h2>
            <button type="button" onClick={() => setSelected(null)} className="rounded-full border px-3 py-1 text-sm">
              Đóng
            </button>
          </div>

          {selectedKind === "ceremonyType" && (
            <div className="mt-3">
              <ChipOptions
                options={CEREMONY_TYPE_OPTIONS}
                value={selectedValue}
                onPick={(v) => setFieldValue(selectedField.key, v)}
              />
              <p className="mt-2 text-xs text-[#7a6a68]">
                Đổi loại lễ sẽ đổi bên chủ tiệc theo luật CEP (Vu Quy → nhà gái đứng trước).
              </p>
            </div>
          )}

          {(selectedKind === "vithuGroom" || selectedKind === "vithuBride") && (
            <div className="mt-3">
              <ChipOptions options={vithuOptions} value={selectedValue} onPick={(v) => setFieldValue(selectedField.key, v)} />
            </div>
          )}

          {selectedKind === "dateLe" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="svg-date-le" className="text-sm font-semibold">Chọn ngày làm lễ</label>
                <input
                  id="svg-date-le"
                  type="date"
                  value={data.ceremonyDate ?? ""}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyDate: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label htmlFor="svg-time-le" className="text-sm font-semibold">Giờ làm lễ</label>
                <input
                  id="svg-time-le"
                  type="time"
                  value={data.ceremonyTime ?? ""}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyTime: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{leSummary}</p>
              <p className="text-xs text-[#7a6a68]">Chọn ngày lễ chỉ đổi ngày giờ lễ — ngày tiệc không đổi.</p>
            </div>
          )}

          {selectedKind === "timeLe" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="svg-time-le2" className="text-sm font-semibold">Giờ làm lễ</label>
                <input
                  id="svg-time-le2"
                  type="time"
                  value={data.ceremonyTime ?? ""}
                  onChange={(e) => setData((prev) => ({ ...prev, ceremonyTime: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{leSummary}</p>
            </div>
          )}

          {selectedKind === "dateTiec" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="svg-date-tiec" className="text-sm font-semibold">Chọn ngày tiệc</label>
                <input
                  id="svg-date-tiec"
                  type="date"
                  value={data.date}
                  onChange={(e) => setData((prev) => ({ ...prev, date: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label htmlFor="svg-time-tiec" className="text-sm font-semibold">Giờ tiệc</label>
                <input
                  id="svg-time-tiec"
                  type="time"
                  value={data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, time: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{tiecSummary}</p>
              <p className="text-xs text-[#7a6a68]">Chọn ngày tiệc chỉ đổi ngày giờ tiệc — ngày lễ không đổi.</p>
            </div>
          )}

          {selectedKind === "timeTiec" && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="svg-time-tiec2" className="text-sm font-semibold">Giờ tiệc</label>
                <input
                  id="svg-time-tiec2"
                  type="time"
                  value={data.time}
                  onChange={(e) => setData((prev) => ({ ...prev, time: e.target.value }))}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <p className="rounded-xl bg-[#fdf8f1] px-3 py-2 text-sm">{tiecSummary}</p>
            </div>
          )}

          {selectedKind === "textarea" && (
            <div className="mt-3">
              <textarea
                rows={3}
                value={selectedValue}
                onChange={(e) => setFieldValue(selectedField.key, e.target.value)}
                className={inputCls}
              />
              {addressSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {addressSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFieldValue(selectedField.key, s)}
                      className="block w-full rounded-lg border bg-[#fdf8f1] px-3 py-2 text-left text-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedKind === "text" && (
            <div className="mt-3">
              <input
                value={selectedValue}
                onChange={(e) => setFieldValue(selectedField.key, e.target.value)}
                onBlur={() => onFieldBlur(selectedField.key)}
                className={inputCls}
              />
            </div>
          )}

          {/* Đổi bên chủ tiệc: chỉ hiện khi đang sửa một khung gia đình. */}
          {isPosField && (
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
        </div>
      )}

      {/* Chốt */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-full bg-[#7a1f2b] px-5 py-3 font-semibold text-white hover:bg-[#5e1620]"
        >
          Chốt — gửi lại cho Nancy
        </button>
        {errors.length > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        {confirmed && returnLink && (
          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <label htmlFor="svg-return-link" className="text-sm font-semibold">
              Link gửi lại cho Nancy (đã kèm nội dung vừa chốt)
            </label>
            <input
              id="svg-return-link"
              readOnly
              value={returnLink}
              onFocus={(e) => e.target.select()}
              className={`${inputCls} mt-1 bg-[#fdf8f1] font-mono text-xs`}
            />
            <button
              type="button"
              onClick={onCopyReturn}
              className="mt-3 rounded-full border-2 border-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-[#7a1f2b]"
            >
              Sao chép link gửi lại
            </button>
          </div>
        )}
        {notice && <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</p>}
      </div>
    </div>
  );
}
