// Mẫu thiệp SVG: tải file SVG xuất từ Illustrator lên, khách sửa bằng cách
// BẤM VÀO thiệp (tap-to-edit) — thiệp là preview, sửa ở ô bên dưới.
// Nguyên tắc an toàn dữ liệu (chị chốt 09:49):
//  - Dữ liệu khách sửa là CHỮ THƯỜNG, không dính U+200B ở đâu trong luồng
//    khách. U+200B chỉ được bọc vào lúc CHỊ xuất ghost text (buildCepTextBlock)
//    để dán vào Illustrator.
//  - Chỉ khung chữ nào chị ĐẶT TÊN trong Illustrator (id = mã khóa) mới sửa
//    được; chữ mẫu cố định không bấm được.
//  - Ngày giờ lễ và tiệc là HAI NHÓM ĐỘC LẬP (chị chốt 09:56): chọn ngày lễ
//    chỉ đổi nhóm lễ, chọn ngày tiệc chỉ đổi nhóm tiệc, không đổi chéo.
//    Vì buildCepValues mặc định lấy ngày lễ = ngày tiệc khi ceremonyDate
//    trống, viewer PHẢI materialize ceremonyDate/ceremonyTime khi nạp dữ
//    liệu (normalizeSvgData) để hai nhóm độc lập ngay từ đầu.
//
// Parser XML viết tay (không dùng DOMParser) để cùng một code chạy được cả
// trên trình duyệt lẫn trong test node. Chỉ hỗ trợ SVG well-formed (file
// xuất từ Illustrator luôn well-formed).
import { buildCepValues, cepValuesToData, CEP_KEYS, formatNamyyYear, isBrideHost, isNamyyKey, namyyGroup, resolveNamyyYear } from "./cep";
import type { InvitationData } from "./types";
import { newId } from "./types";

/* ================= cây XML tối giản ================= */

export interface SvgNode {
  tag: string; // tên thẻ; "#text" cho nút chữ
  attrs: Record<string, string>;
  children: SvgNode[];
  text: string; // chỉ dùng cho #text
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, body) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const cp = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[body] ?? m;
  });
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Tìm '>' kết thúc thẻ, bỏ qua '>' trong dấu ngoặc. */
function findTagEnd(input: string, start: number): number {
  let quote = "";
  for (let j = start + 1; j < input.length; j++) {
    const c = input[j];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return j;
    }
  }
  return -1;
}

function parseTag(inner: string): { name: string; attrs: Record<string, string> } {
  const m = /^[^\s/>]+/.exec(inner.trim());
  const name = m ? m[0] : "";
  const attrs: Record<string, string> = {};
  const re = /([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(inner)) !== null) {
    const key = mm[1];
    if (key === name) continue;
    let val = mm[2] ?? "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    attrs[key] = decodeEntities(val);
  }
  return { name, attrs };
}

/** Parse XML thành cây. Ném lỗi khi file không well-formed. */
export function parseXml(input: string): SvgNode {
  const root: SvgNode = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack: SvgNode[] = [root];
  const top = () => stack[stack.length - 1];
  let i = 0;
  const n = input.length;
  const addText = (raw: string, rawCdata = false) => {
    if (!raw) return;
    const t = rawCdata ? raw : decodeEntities(raw);
    if (t) top().children.push({ tag: "#text", attrs: {}, children: [], text: t });
  };
  while (i < n) {
    if (input[i] === "<") {
      if (input.startsWith("<!--", i)) {
        const end = input.indexOf("-->", i + 4);
        i = end === -1 ? n : end + 3;
        continue;
      }
      if (input.startsWith("<![CDATA[", i)) {
        const end = input.indexOf("]]>", i + 9);
        addText(end === -1 ? input.slice(i + 9) : input.slice(i + 9, end), true);
        i = end === -1 ? n : end + 3;
        continue;
      }
      if (input.startsWith("<?", i)) {
        const end = input.indexOf("?>", i + 2);
        i = end === -1 ? n : end + 2;
        continue;
      }
      if (input.startsWith("<!", i)) {
        let j = i + 2;
        let depth = 0;
        while (j < n) {
          const c = input[j];
          if (c === "[") depth++;
          else if (c === "]") depth--;
          else if (c === ">" && depth === 0) break;
          j++;
        }
        i = j >= n ? n : j + 1;
        continue;
      }
      if (input.startsWith("</", i)) {
        const end = input.indexOf(">", i + 2);
        if (end === -1) throw new Error("SVG lỗi: thẻ đóng không có '>'");
        const name = input.slice(i + 2, end).trim();
        if (stack.length <= 1 || top().tag !== name) {
          throw new Error(`SVG lỗi: thẻ đóng </${name}> không khớp`);
        }
        stack.pop();
        i = end + 1;
        continue;
      }
      const end = findTagEnd(input, i);
      if (end === -1) throw new Error("SVG lỗi: thẻ mở không có '>'");
      let inner = input.slice(i + 1, end);
      const selfClose = inner.trimEnd().endsWith("/");
      if (selfClose) inner = inner.trimEnd().slice(0, -1);
      const { name, attrs } = parseTag(inner);
      if (!name) throw new Error("SVG lỗi: thẻ không có tên");
      const node: SvgNode = { tag: name, attrs, children: [], text: "" };
      top().children.push(node);
      if (!selfClose) stack.push(node);
      i = end + 1;
      continue;
    }
    const next = input.indexOf("<", i);
    addText(next === -1 ? input.slice(i) : input.slice(i, next));
    i = next === -1 ? n : next;
  }
  if (stack.length !== 1) throw new Error("SVG lỗi: còn thẻ chưa đóng");
  return root;
}

function serializeNode(node: SvgNode): string {
  if (node.tag === "#text") return escapeText(node.text);
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join("");
  if (node.children.length === 0) return `<${node.tag}${attrs}/>`;
  return `<${node.tag}${attrs}>${node.children.map(serializeNode).join("")}</${node.tag}>`;
}

/* ================= làm sạch SVG (không bao giờ render SVG thô) =================
   Chỉ giữ lại các thẻ/thuộc tính trình diễn an toàn. Bỏ: <script>, <style>,
   <foreignObject>, animation, <filter> + fe*, event handler (on*), style
   inline, link ngoài (chỉ cho phép href #fragment hoặc data:image/*).
   Đặt trước khi xuất từ Illustrator: Styling = Presentation Attributes
   (đừng dùng Internal CSS — khối <style> sẽ bị bỏ, mất định dạng). */

const DROP_TAGS = new Set([
  "script", "style", "foreignObject", "animate", "animateMotion", "animateTransform",
  "animateColor", "set", "filter", "iframe", "object", "embed", "video", "audio",
  "link", "meta", "cursor", "color-profile", "font-face", "font-face-src",
  "font-face-uri", "font-face-format", "font-face-name", "missing-glyph", "glyph",
  "hkern", "vkern", "font",
  "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix",
  "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood",
  "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge",
  "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting",
  "feSpotLight", "feTile", "feTurbulence",
]);

const UNWRAP_TAGS = new Set(["a"]);

const KEEP_TAGS = new Set([
  "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse",
  "line", "polyline", "polygon", "text", "tspan", "textPath", "image",
  "linearGradient", "radialGradient", "stop", "clipPath", "mask", "pattern",
  "use", "symbol", "switch",
]);

const ALLOWED_ATTRS = new Set([
  "id", "class", "x", "y", "width", "height", "viewBox", "preserveAspectRatio",
  "transform", "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width",
  "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset",
  "stroke-opacity", "opacity", "font-family", "font-size", "font-weight",
  "font-style", "text-anchor", "dominant-baseline", "letter-spacing", "cx", "cy",
  "r", "rx", "ry", "x1", "y1", "x2", "y2", "d", "points", "gradientUnits",
  "gradientTransform", "offset", "stop-color", "stop-opacity", "clip-path", "mask",
  "patternUnits", "patternTransform", "href", "xlink:href", "clip-rule", "color",
  "visibility", "display", "dx", "dy", "textLength", "lengthAdjust", "rotate",
  "startOffset", "pathLength", "marker-start", "marker-mid", "marker-end",
  "stroke-miterlimit", "shape-rendering", "text-rendering", "baseline-shift",
  "unicode-bidi", "writing-mode", "glyph-orientation-horizontal", "kerning",
  "word-spacing", "font-stretch", "font-variant", "overflow", "mask-type",
  "clipPathUnits", "spreadMethod", "refX", "refY", "orient", "markerWidth",
  "markerHeight", "markerUnits", "fx", "fy", "fr", "patternContentUnits",
]);

function hrefAllowed(v: string): boolean {
  const s = v.trim();
  return s.startsWith("#") || s.startsWith("data:image/");
}

/** Làm sạch cây (trả về cây mới). warnings gom các thứ đã bỏ. */
export function sanitizeSvg(root: SvgNode): { tree: SvgNode; warnings: string[] } {
  const warnings: string[] = [];
  const warned = new Set<string>();
  const warn = (msg: string) => {
    if (!warned.has(msg)) {
      warned.add(msg);
      warnings.push(msg);
    }
  };
  const clean = (node: SvgNode): SvgNode | null => {
    if (node.tag === "#text") return node;
    if (DROP_TAGS.has(node.tag)) {
      warn(`Đã bỏ thẻ <${node.tag}> (không an toàn / không hỗ trợ).`);
      return null;
    }
    if (!KEEP_TAGS.has(node.tag)) {
      if (UNWRAP_TAGS.has(node.tag)) {
        // Giữ con, bỏ vỏ (vd: <a>).
        const kids: SvgNode[] = [];
        for (const c of node.children) {
          const cc = clean(c);
          if (cc) kids.push(cc);
        }
        return { tag: "#frag", attrs: {}, children: kids, text: "" };
      }
      warn(`Đã bỏ thẻ <${node.tag}> (không hỗ trợ).`);
      return null;
    }
    const attrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(node.attrs)) {
      const lk = k.toLowerCase();
      if (lk.startsWith("on")) {
        warn("Đã bỏ thuộc tính sự kiện (on*).");
        continue;
      }
      if (lk === "style") {
        warn("Đã bỏ thuộc tính style — xuất SVG với Styling: Presentation Attributes để giữ định dạng.");
        continue;
      }
      if (!ALLOWED_ATTRS.has(k) && !ALLOWED_ATTRS.has(lk)) continue;
      if (k === "href" || k === "xlink:href") {
        if (!hrefAllowed(v)) {
          warn(
            node.tag === "image"
              ? "Đã bỏ ảnh link ngoài — xuất lại SVG với Images: Embed để ảnh nhúng vào file."
              : "Đã bỏ link ngoài (chỉ giữ link # hoặc ảnh nhúng data:image/)."
          );
          if (node.tag === "image") return null;
          continue;
        }
      }
      attrs[k] = v;
    }
    const children: SvgNode[] = [];
    for (const c of node.children) {
      const cc = clean(c);
      if (!cc) continue;
      if (cc.tag === "#frag") children.push(...cc.children);
      else children.push(cc);
    }
    return { tag: node.tag, attrs, children, text: "" };
  };
  const svgEl = root.children.find((c) => c.tag === "svg");
  if (!svgEl) throw new Error("Không tìm thấy thẻ <svg> trong file.");
  const cleaned = clean(svgEl);
  if (!cleaned) throw new Error("Không đọc được thẻ <svg> trong file.");
  return { tree: { tag: "#root", attrs: {}, children: [cleaned], text: "" }, warnings };
}

/* ================= ảnh ngoài chưa nhúng (Images: Embed) =================
   File SVG xuất từ Illustrator mà quên Images: Embed thì ảnh nền chỉ là
   link tới file PNG bên ngoài — mở trên web sẽ mất nền. sanitizeSvg đã
   bỏ các <image> link ngoài; helper này tìm chúng TRƯỚC khi làm sạch để
   báo rõ cho Nancy (lúc tải lên) và cho khách (lúc mở link) biết phải
   xuất lại file. Chỉ tính href KHÔNG phải data: (ảnh nhúng) hay #fragment. */

export const EXTERNAL_IMAGE_WARNING =
  "Ảnh nền chưa gắn trong file SVG — xuất lại với Images: Embed (đặt ảnh nhúng trong file) thì ảnh nền mới hiện.";

/** Danh sách href ảnh ngoài trong file SVG (không tính ảnh nhúng data:). */
export function findExternalImageRefs(svgText: string): string[] {
  let parsed: SvgNode;
  try {
    parsed = parseXml(svgText);
  } catch {
    return [];
  }
  const refs: string[] = [];
  const walk = (node: SvgNode) => {
    if (node.tag === "image") {
      const href = (node.attrs.href ?? node.attrs["xlink:href"] ?? "").trim();
      if (href && !href.startsWith("data:") && !href.startsWith("#")) refs.push(href);
    }
    for (const c of node.children) walk(c);
  };
  for (const c of parsed.children) walk(c);
  return Array.from(new Set(refs));
}

/* ================= trích khung chữ sửa được ================= */

export function isFieldKey(id: string): boolean {
  if (!id) return false;
  return CEP_KEYS.includes(id) || id.includes(".");
}

/* ================= giải mã id Illustrator (_xHH_) =================
   Illustrator mã hóa ký tự đặc biệt trong id thành _xHH_ với đúng 2 ký
   tự hex: _x7B_ = {, _x7D_ = }, _x5F_ = _, _x28_ = (, _x29_ = ).
   Không giải mã thì id khóa CEP không khớp CEP_KEYS và khung bị xếp
   nhầm thành "chữ thường" (ngày chỉ còn textbox, vị thứ mất chip). */

/** Giải mã id kiểu Illustrator (_x7B_ → {, _x5F_ → _, _x28_ → (, …). */
export function decodeIllustratorId(id: string): string {
  if (!id) return id;
  return id.replace(/_x([0-9A-Fa-f]{2})_/g, (_m, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

/** Tách id đã giải mã thành các khóa {…} + dấu phân cách giữa chúng.
    vd "{date.le.ngay}.{date.le.thang}.{date.le.nam}" → keys 3 phần,
    separators [".", "."]. Trả null khi không có khóa {…} nào. */
export function splitCompositeKey(
  decodedId: string
): { keys: string[]; separators: string[] } | null {
  const re = /\{([^}]*)\}/g;
  const keys: string[] = [];
  const separators: string[] = [];
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(decodedId)) !== null) {
    if (keys.length > 0) separators.push(decodedId.slice(lastEnd, m.index));
    keys.push(m[1]);
    lastEnd = m.index + m[0].length;
  }
  return keys.length === 0 ? null : { keys, separators };
}

const DATE_PART_ORDER = ["ngay", "thang", "nam"];
const TIME_PART_ORDER = ["gio", "phut"];

/** Chuẩn hóa các phần của khóa ghép: bỏ hậu tố số (vd "{pos1.diachi}1"
    là lần xuất hiện thứ 2 của pos1.diachi). Khóa namyy (vd
    date.tiec.namyy — năm 2 chữ số, KHÔNG phải lỗi chính tả) giữ nguyên
    làm khóa dẫn xuất riêng. Các phần lạ khác thì sửa theo vị trí khi 2
    phần đầu đúng là ngay/thang của cùng nhóm ngày; không sửa được thì
    giữ nguyên. */
export function normalizeCompositeKeys(rawKeys: string[]): string[] {
  const keys = rawKeys.map((k) => k.replace(/\d+$/, ""));
  if (keys.every((k) => CEP_KEYS.includes(k) || isNamyyKey(k))) return keys;
  const groups = new Set<string>();
  for (const k of keys) {
    const m = /^date\.(le|tiec)\.(ngay|thang|nam|gio|phut|thu|ngay_al|thang_al|nam_al)$/.exec(k);
    if (m) groups.add(m[1]);
  }
  if (groups.size !== 1) return keys;
  const g = Array.from(groups)[0];
  const isDate = keys.some((k) => k === `date.${g}.ngay` || k === `date.${g}.thang`);
  const seq = isDate ? DATE_PART_ORDER : TIME_PART_ORDER;
  const aligned = keys.every((k, i) => {
    if (!CEP_KEYS.includes(k) && !isNamyyKey(k)) return true;
    if (isNamyyKey(k)) return true;
    return k === `date.${g}.${seq[i]}`;
  });
  if (!aligned) return keys;
  return keys.map((k, i) => (CEP_KEYS.includes(k) || isNamyyKey(k) ? k : `date.${g}.${seq[i]}`));
}

/** Tách giá trị của một khóa ghép thành từng phần + dấu phân cách gốc.
    1) Marker U+200B (còn từ lần xuất CEP trước): đoạn xen kẽ giá
       trị/dấu phân cách — giá trị ở vị trí chẵn, dấu ở vị trí lẻ.
    2) Dấu phân cách trong id (vd "."). 3) Nhóm chữ số (vd "11 GIỜ 00"
       → 11, 00; dấu phân cách lấy theo id). Không tách được thì null. */
function splitCompositeValueParts(
  rawWithMarkers: string,
  idSeparators: string[],
  count: number
): { values: string[]; separators: string[] } | null {
  const marked = rawWithMarkers.split("\u200B").filter((s) => s !== "");
  if (marked.length === 2 * count - 1) {
    const values: string[] = [];
    const separators: string[] = [];
    for (let i = 0; i < marked.length; i++) {
      if (i % 2 === 0) values.push(marked[i]);
      else separators.push(marked[i]);
    }
    return { values, separators };
  }
  const plain = rawWithMarkers.replace(/\u200B/g, "");
  let parts: string[] = [plain];
  for (const sep of idSeparators) {
    if (!sep) continue;
    const next: string[] = [];
    for (const p of parts) next.push(...p.split(sep));
    parts = next;
  }
  if (parts.length === count) return { values: parts, separators: idSeparators };
  const digits = plain.match(/\d+/g);
  if (digits && digits.length === count) return { values: digits, separators: idSeparators };
  return null;
}

export interface SvgField {
  key: string;
  value: string; // chữ gốc trong SVG (làm giá trị mẫu)
  kind: "cep" | "generic";
  occurrences: number; // số chỗ cùng khóa (vd: ngày hiện 2 nơi)
}

/** Số đầu tiên trong danh sách tọa độ cách nhau bằng dấu phẩy/khoảng trắng. */
function firstNum(v: string | undefined): number | null {
  if (v === undefined) return null;
  const m = /-?\d*\.?\d+/.exec(v);
  return m ? parseFloat(m[0]) : null;
}

/** tspan này có xuống dòng mới không (so với dòng hiện tại curY), và y hiệu
    dụng sau nó. Chỉ y khác dòng trước, hoặc dy là bước xuống dòng
    (>= 0.8em hoặc > 1px), mới tính là xuống dòng. Illustrator xuất mỗi mảnh
    chữ (để canh kerning) thành một tspan với x TUYỆT ĐỐI — x khác nhau
    KHÔNG phải xuống dòng (lỗi cũ: "21.11.2026" bị trích thành 5 dòng). */
function tspanLineStep(
  tspan: SvgNode,
  curY: number | null
): { newLine: boolean; nextY: number | null } {
  const y = firstNum(tspan.attrs.y);
  if (y !== null) {
    return { newLine: curY !== null && Math.abs(y - curY) > 0.5, nextY: y };
  }
  const dyRaw = tspan.attrs.dy;
  if (dyRaw !== undefined) {
    const dy = firstNum(dyRaw);
    if (dy !== null && dy !== 0) {
      const isEm = /(^|[,\s])[^,\s]*em\s*$/.test(dyRaw.trim()) || dyRaw.includes("em");
      const step = isEm ? Math.abs(dy) >= 0.8 : Math.abs(dy) > 1;
      const nextY = curY === null ? null : curY + (isEm ? dy * 16 : dy);
      return { newLine: step, nextY };
    }
  }
  return { newLine: false, nextY: curY };
}

/** Nội dung chữ của một nút <text>: nối các tspan cùng dòng; chỉ xuống dòng
    khi tspan thực sự đổi dòng (y/dy, xem tspanLineStep). Marker U+200B
    (còn sót từ lần xuất trước) được bóc ra — giá trị trích ra là chữ
    thường để hiển thị/sửa, không dính mã ẩn. */
export function textContentOf(node: SvgNode): string {
  if (node.tag === "#text") return node.text.replace(/\u200B/g, "");
  if (node.tag === "tspan" || node.tag === "textPath") {
    return node.children.map(textContentOf).join("");
  }
  const parts: string[] = [];
  let curY: number | null = null;
  for (const child of node.children) {
    if (child.tag === "#text") {
      if (child.text.trim() !== "") parts.push(child.text.replace(/\u200B/g, ""));
    } else if (child.tag === "tspan") {
      const t = textContentOf(child);
      if (!t) continue;
      const { newLine, nextY } = tspanLineStep(child, curY);
      if (parts.length > 0 && newLine) parts.push("\n");
      parts.push(t);
      curY = nextY;
    } else if (child.tag === "textPath") {
      const t = textContentOf(child);
      if (t) parts.push(t);
    }
  }
  return parts.join("");
}

/** Nội dung chữ THÔ của một nút <text> (giữ marker U+200B, không chèn
    xuống dòng) — chỉ dùng để tách giá trị của khóa ghép theo marker. */
export function textContentRawOf(node: SvgNode): string {
  if (node.tag === "#text") return node.text;
  return node.children.map(textContentRawOf).join("");
}

/** Khóa của một <text>: id của chính nó, nếu không thì id của <g> gần nhất.
    Id được giải mã (_xHH_) và chuẩn hóa trước: khóa đơn bỏ hậu tố số
    (pos1.diachi1 → pos1.diachi); khóa ghép nhiều phần giữ nguyên cả cụm
    để tách sau. */
function keyOfText(node: SvgNode, ancestorGIds: string[]): string | null {
  const pick = (raw: string): string | null => {
    const decoded = decodeIllustratorId(raw);
    if (!decoded || !isFieldKey(decoded)) return null;
    const comp = splitCompositeKey(decoded);
    if (comp && comp.keys.length === 1) return normalizeCompositeKeys(comp.keys)[0];
    if (!comp) return decoded.replace(/\d+$/, "");
    return decoded;
  };
  const own = pick(node.attrs.id ?? "");
  if (own) return own;
  for (let i = ancestorGIds.length - 1; i >= 0; i--) {
    const anc = pick(ancestorGIds[i]);
    if (anc) return anc;
  }
  return null;
}

export function extractSvgFields(root: SvgNode): { fields: SvgField[]; warnings: string[] } {
  const fields: SvgField[] = [];
  const byKey = new Map<string, SvgField>();
  const warnings: string[] = [];
  const addField = (k: string, v: string) => {
    const existing = byKey.get(k);
    if (existing) {
      existing.occurrences++;
      warnings.push(`Khóa "${k}" xuất hiện ${existing.occurrences} lần — chỉ giữ một ô sửa, các chỗ còn lại đổi theo.`);
    } else {
      const f: SvgField = {
        key: k,
        value: v,
        kind: CEP_KEYS.includes(k) ? "cep" : "generic",
        occurrences: 1,
      };
      byKey.set(k, f);
      fields.push(f);
    }
  };
  const walk = (node: SvgNode, gIds: string[]) => {
    if (node.tag === "#text") return;
    const nextG = node.tag === "g" && node.attrs.id ? [...gIds, node.attrs.id] : gIds;
    if (node.tag === "text") {
      const key = keyOfText(node, gIds);
      if (key) {
        // Khóa ghép (ngày/giờ): tách thành một field cho mỗi phần — ngày
        // thành lịch, giờ thành ô giờ, vị thứ thành chip (kind theo khóa).
        const comp = splitCompositeKey(key);
        if (comp && comp.keys.length > 1) {
          const normKeys = normalizeCompositeKeys(comp.keys);
          const split = splitCompositeValueParts(
            textContentRawOf(node),
            comp.separators,
            normKeys.length
          );
          if (split) {
            normKeys.forEach((k, i) => addField(k, split.values[i] ?? ""));
          } else {
            // Không tách được giá trị: giữ nguyên cả cụm làm một khung
            // chữ thường để không mất chữ.
            addField(key, textContentOf(node).trim());
          }
        } else {
          addField(key, textContentOf(node).trim());
        }
      }
    }
    for (const c of node.children) walk(c, nextG);
  };
  for (const c of root.children) walk(c, []);
  // Cảnh báo trùng chỉ ghi một lần cho mỗi khóa.
  const deduped = Array.from(new Set(warnings));
  return { fields, warnings: deduped };
}

/** Mọi khóa CEP xuất hiện làm tên lớp/khung trong file (kể cả khung chỉ
    còn hình vẽ, không có chữ sống) — để cảnh báo những khóa thiếu giá trị. */
function collectNamedCepKeys(root: SvgNode): Set<string> {
  const out = new Set<string>();
  const addId = (raw: string | undefined) => {
    if (!raw) return;
    const decoded = decodeIllustratorId(raw);
    const comp = splitCompositeKey(decoded);
    if (comp) {
      for (const k of normalizeCompositeKeys(comp.keys)) {
        if (CEP_KEYS.includes(k)) out.add(k);
      }
      return;
    }
    const single = decoded.replace(/\d+$/, "");
    if (CEP_KEYS.includes(single)) out.add(single);
  };
  const walk = (node: SvgNode) => {
    addId(node.attrs.id);
    for (const c of node.children) walk(c);
  };
  for (const c of root.children) walk(c);
  return out;
}

/* ================= serialize (ghi giá trị mới vào SVG) ================= */

/** Ghi các giá trị vào cây (trả cây mới). markFields: gắn data-field để bấm được. */
export function applyValuesToTree(
  root: SvgNode,
  values: Record<string, string>,
  markFields: boolean
): SvgNode {
  // Walk có nhớ id <g> tổ tiên để tìm khóa cho <text> không có id riêng.
  const walk = (node: SvgNode, gIds: string[]): SvgNode => {
    if (node.tag === "#text") return { ...node };
    const nextG = node.tag === "g" && node.attrs.id ? [...gIds, node.attrs.id] : gIds;
    const attrs = { ...node.attrs };
    let children = node.children.map((c) => walk(c, nextG));
    if (node.tag === "text") {
      const key = keyOfText(node, gIds);
      let newValue: string | null = null;
      let markKey: string | null = null;
      if (key) {
        // Khóa ghép (ngày/giờ): ghép lại từ từng phần + dấu phân cách GỐC
        // trong file (vd " GIỜ "), để sửa một phần ngày vẫn hiện đúng dạng
        // mẫu. Phần nào data chưa có thì giữ chữ gốc trong file.
        const comp = splitCompositeKey(key);
        let handled = false;
        if (comp && comp.keys.length > 1) {
          const normKeys = normalizeCompositeKeys(comp.keys);
          // Khung namyy thỏa khi có năm 4 chữ số (dẫn xuất từ date.<nhóm>.nam).
          const hasValue = (k: string) =>
            Object.prototype.hasOwnProperty.call(values, k) ||
            (isNamyyKey(k) && Object.prototype.hasOwnProperty.call(values, `date.${namyyGroup(k)}.nam`));
          if (normKeys.every(hasValue)) {
            handled = true;
            const split = splitCompositeValueParts(
              textContentRawOf(node),
              comp.separators,
              normKeys.length
            );
            const origValues = split ? split.values : normKeys.map(() => "");
            const origSeps = split ? split.separators : comp.separators;
            const parts = normKeys.map((k, i) => {
              // Khung namyy không có giá trị riêng: lấy năm 4 chữ số rồi
              // giữ nguyên số chữ số như giá trị gốc trong khung.
              if (isNamyyKey(k) && !Object.prototype.hasOwnProperty.call(values, k)) {
                const g = namyyGroup(k)!;
                const year4 = (values[`date.${g}.nam`] ?? "").trim();
                return year4 ? formatNamyyYear(year4, origValues[i] ?? "") : (origValues[i] ?? "");
              }
              const v = (values[k] ?? "").trim();
              return v !== "" ? v : origValues[i] ?? "";
            });
            if (parts.some((p) => p !== "")) {
              newValue = parts
                .map((p, i) => (i === 0 ? p : (origSeps[i - 1] ?? "") + p))
                .join("");
            }
            // Bấm vào cụm ngày/giờ thì mở ô sửa của phần đầu (lịch/giờ).
            markKey = normKeys[0];
          }
        }
        if (!handled && Object.prototype.hasOwnProperty.call(values, key)) {
          newValue = values[key] ?? "";
          markKey = key;
        }
      }
      if (newValue !== null) {
        const value = newValue;
        // Giữ lại x/y của tspan đầu (hoặc của chính <text>) để dòng đầu
        // vẫn nằm đúng chỗ; các dòng sau xuống dòng bằng dy.
        const firstTspan = node.children.find((c) => c.tag === "tspan");
        const firstX = firstTspan?.attrs.x ?? node.attrs.x;
        const firstY = firstTspan?.attrs.y ?? node.attrs.y;
        const lines = value.split("\n");
        if (lines.length === 1 && lines[0] === "") {
          children = [];
        } else {
          children = lines.map((line, idx) => {
            const ta: Record<string, string> = {};
            if (firstX !== undefined) ta.x = firstX;
            if (idx === 0) {
              if (firstY !== undefined) ta.y = firstY;
            } else {
              ta.dy = "1.2em";
            }
            return {
              tag: "tspan",
              attrs: ta,
              children: line ? [{ tag: "#text", attrs: {}, children: [], text: line }] : [],
              text: "",
            };
          });
        }
      }
      if (markFields && markKey) attrs["data-field"] = markKey;
    }
    return { tag: node.tag, attrs, children, text: "" };
  };
  const out: SvgNode = { tag: "#root", attrs: {}, children: [], text: "" };
  for (const c of root.children) out.children.push(walk(c, []));
  return out;
}

export function serializeSvg(
  root: SvgNode,
  values: Record<string, string>,
  opts?: { markFields?: boolean }
): string {
  const tree = applyValuesToTree(root, values, opts?.markFields ?? false);
  return tree.children.map(serializeNode).join("");
}

/* ================= mẫu SVG (bản ghi lưu trữ) ================= */

export interface SvgTemplateData {
  id: string;
  name: string;
  svgText: string; // SVG đã làm sạch (chuỗi, để render/tải về)
  fields: SvgField[];
  warnings: string[];
  externalImages: string[]; // href ảnh ngoài chưa nhúng (rỗng = nền đã gắn trong file)
  missingCepKeys: string[]; // khóa CEP có tên lớp nhưng chưa có chữ sống (khung còn là hình vẽ)
  createdAt: number;
}

/** Parse + làm sạch + trích khung sửa được từ file SVG tải lên. */
export function parseSvgTemplate(svgText: string, name: string): SvgTemplateData {
  const parsed = parseXml(svgText);
  // Tìm ảnh ngoài TRƯỚC khi làm sạch (sau làm sạch ảnh đã bị bỏ, không còn dấu vết).
  const externalImages = findExternalImageRefs(svgText);
  const { tree, warnings } = sanitizeSvg(parsed);
  const svgEl = tree.children[0];
  // Cần viewBox để co vừa màn hình: chưa có thì dựng từ width/height.
  if (!svgEl.attrs.viewBox && svgEl.attrs.width && svgEl.attrs.height) {
    const w = parseFloat(svgEl.attrs.width);
    const h = parseFloat(svgEl.attrs.height);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      svgEl.attrs.viewBox = `0 0 ${w} ${h}`;
      warnings.push("File chưa có viewBox — đã tự dựng từ width/height để co vừa màn hình.");
    }
  }
  if (!svgEl.attrs.viewBox) {
    warnings.push("File chưa có viewBox — thiệp có thể không co vừa màn hình điện thoại.");
  }
  const { fields, warnings: fieldWarnings } = extractSvgFields(tree);
  // Khóa CEP có tên lớp nhưng chưa có chữ sống (khung còn là hình vẽ):
  // liệt kê để Nancy biết khung nào chưa bấm sửa được.
  const namedCepKeys = collectNamedCepKeys(tree);
  const withValue = new Set(
    fields.filter((f) => f.kind === "cep" && f.value.trim() !== "").map((f) => f.key)
  );
  const missingCepKeys = CEP_KEYS.filter((k) => namedCepKeys.has(k) && !withValue.has(k));
  // Cảnh báo ảnh ngoài: một dòng duy nhất, đúng câu đã chốt — thay cho câu
  // chung của sanitizeSvg ("Đã bỏ ảnh link ngoài…") để khỏi trùng ý.
  const allWarnings = [...warnings, ...fieldWarnings].filter(
    (w) => !w.startsWith("Đã bỏ ảnh link ngoài")
  );
  if (externalImages.length > 0) allWarnings.push(EXTERNAL_IMAGE_WARNING);
  if (missingCepKeys.length > 0) {
    allWarnings.push(
      `Các khóa chưa có chữ sống (khung còn là hình vẽ, không bấm sửa được): ${missingCepKeys.join(", ")}.`
    );
  }
  if (fields.length === 0) {
    allWarnings.push(
      "Không tìm thấy khung chữ nào sửa được — đặt tên cho khung chữ trong Illustrator (vd: pos1.ong) rồi xuất lại với Object IDs: Layer Names."
    );
  }
  return {
    id: newId("mau-svg"),
    name: name.replace(/\.svg$/i, ""),
    svgText: tree.children.map(serializeNode).join(""),
    fields,
    warnings: allWarnings,
    externalImages,
    missingCepKeys,
    createdAt: Date.now(),
  };
}

/* ================= nhãn + loại ô nhập ================= */

export const CEREMONY_TYPE_OPTIONS = ["Tân Hôn", "Thành Hôn", "Vu Quy", "Báo Hỷ"];
export const VITHU_GROOM_OPTIONS = ["Trưởng Nam", "Thứ Nam", "Út Nam", "Quý Nam"];
// Nữ: 4 vị thứ trong ảnh panel CEP + "Trưởng Nữ" (dữ liệu thật của chị có dùng).
export const VITHU_BRIDE_OPTIONS = ["Ái Nữ", "Thứ Nữ", "Út Nữ", "Quý Nữ", "Trưởng Nữ"];
export const HOST_TYPE_OPTIONS = ["Nhà Trai", "Nhà Gái"];

const CEP_LABELS: Record<string, string> = {
  "info.ten_le": "Loại lễ",
  "pos1.ong": "Ông",
  "pos1.ba": "Bà",
  "pos1.diachi": "Địa chỉ",
  "pos1.con_full": "Tên con",
  "pos1.vithu": "Vị thứ",
  "pos2.ong": "Ông",
  "pos2.ba": "Bà",
  "pos2.diachi": "Địa chỉ",
  "pos2.con_full": "Tên con",
  "pos2.vithu": "Vị thứ",
  "ceremony.ten": "Nơi làm lễ",
  "date.le.gio": "Giờ làm lễ",
  "date.le.phut": "Phút làm lễ",
  "date.le.thu": "Ngày làm lễ",
  "date.le.ngay": "Ngày làm lễ",
  "date.le.thang": "Ngày làm lễ",
  "date.le.nam": "Ngày làm lễ",
  "date.le.namyy": "Ngày làm lễ",
  "date.le.ngay_al": "Ngày làm lễ",
  "date.le.thang_al": "Ngày làm lễ",
  "date.le.nam_al": "Ngày làm lễ",
  "venue.ten": "Nơi tổ chức tiệc",
  "venue.diachi": "Địa chỉ tiệc",
  "date.tiec.gio": "Giờ tiệc",
  "date.tiec.phut": "Phút tiệc",
  "date.tiec.thu": "Ngày tiệc",
  "date.tiec.ngay": "Ngày tiệc",
  "date.tiec.thang": "Ngày tiệc",
  "date.tiec.nam": "Ngày tiệc",
  "date.tiec.namyy": "Ngày tiệc",
  "date.tiec.ngay_al": "Ngày tiệc",
  "date.tiec.thang_al": "Ngày tiệc",
  "date.tiec.nam_al": "Ngày tiệc",
};

/** Nhãn tiếng Việt cho một khóa. pos1 = nhà chủ tiệc, pos2 = nhà còn lại. */
export function cepKeyLabel(key: string, data?: InvitationData): string {
  const base = CEP_LABELS[key];
  if (!base) return key;
  if (key.startsWith("pos1.")) {
    const side = data ? (isBrideHost(data) ? "nhà gái (chủ tiệc)" : "nhà trai (chủ tiệc)") : "nhà chủ tiệc";
    return `${base} — ${side}`;
  }
  if (key.startsWith("pos2.")) {
    const side = data ? (isBrideHost(data) ? "nhà trai" : "nhà gái") : "nhà còn lại";
    return `${base} — ${side}`;
  }
  return base;
}

export type SvgFieldKind =
  | "ceremonyType"
  | "vithuGroom"
  | "vithuBride"
  | "dateLe"
  | "timeLe"
  | "dateTiec"
  | "timeTiec"
  | "textarea"
  | "text";

/** Loại ô nhập cho một khóa. Vị thứ theo BÊN (trai/gái), không theo pos1/pos2. */
export function fieldKindForKey(key: string, data?: InvitationData): SvgFieldKind {
  if (key === "info.ten_le") return "ceremonyType";
  if (key === "pos1.vithu" || key === "pos2.vithu") {
    const brideHost = data ? isBrideHost(data) : false;
    const isBrideSide = key === "pos1.vithu" ? brideHost : !brideHost;
    return isBrideSide ? "vithuBride" : "vithuGroom";
  }
  if (key.startsWith("date.le.")) {
    return key === "date.le.gio" || key === "date.le.phut" ? "timeLe" : "dateLe";
  }
  if (key.startsWith("date.tiec.")) {
    return key === "date.tiec.gio" || key === "date.tiec.phut" ? "timeTiec" : "dateTiec";
  }
  if (key.endsWith(".diachi")) return "textarea";
  return "text";
}

/* ================= dữ liệu: InvitationData làm chuẩn ================= */

/** Materialize ngày/giờ lễ từ ngày/giờ tiệc khi chưa nhập riêng — để hai
    nhóm lễ/tiệc độc lập ngay từ đầu (chọn ngày tiệc không làm đổi lễ). */
export function normalizeSvgData(data: InvitationData): InvitationData {
  return {
    ...data,
    ceremonyDate: data.ceremonyDate?.trim() ? data.ceremonyDate : data.date,
    ceremonyTime: data.ceremonyTime?.trim() ? data.ceremonyTime : data.time,
  };
}

/** Giá trị HIỂN THỊ cho từng khung (đi qua buildCepValues nên đúng luật
    pos1/pos2; khóa ngoài CEP lấy từ extra hoặc chữ gốc trong mẫu).
    Khung namyy (năm 2 chữ số) lấy năm từ dữ liệu rồi giữ nguyên số chữ
    số như giá trị gốc trong khung (gốc "26" → "27" khi đổi năm). */
export function buildSvgDisplayValues(
  data: InvitationData,
  extra: Record<string, string>,
  fields: SvgField[]
): Record<string, string> {
  const { keys, values } = buildCepValues(data);
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (isNamyyKey(f.key)) {
      const g = namyyGroup(f.key)!;
      const yearIdx = keys.indexOf(`date.${g}.nam`);
      const year4 = yearIdx !== -1 ? values[yearIdx] ?? "" : "";
      out[f.key] = year4 ? formatNamyyYear(year4, f.value) : (extra[f.key] ?? f.value);
      continue;
    }
    const idx = keys.indexOf(f.key);
    if (idx !== -1) out[f.key] = values[idx] ?? "";
    else out[f.key] = extra[f.key] ?? f.value;
  }
  return out;
}

/** Ghi một giá trị khách sửa (đang HIỂN THỊ ở khóa CEP) về đúng trường người
    trong InvitationData — đi qua cepValuesToData nên đúng luật đổi bên
    (Vu Quy / Nhà Gái thì pos1 = nhà gái). Loại lễ + nhà chủ tiệc đã chọn
    được giữ nguyên, trừ khi chính loại lễ vừa đổi. */
export function applySvgFieldEdit(
  data: InvitationData,
  key: string,
  newValue: string
): InvitationData {
  // Khung namyy (năm 2 chữ số): đọc thành năm 4 chữ số rồi sửa như khóa nam.
  if (isNamyyKey(key)) {
    const g = namyyGroup(key)!;
    const year4 = resolveNamyyYear(newValue);
    if (!year4) return data;
    return applySvgFieldEdit(data, `date.${g}.nam`, year4);
  }
  const { keys, values } = buildCepValues(data);
  const idx = keys.indexOf(key);
  if (idx === -1) return data; // khóa ngoài CEP: xử lý ở extra, không vào đây
  const next = [...values];
  next[idx] = newValue;
  const map: Record<string, string> = {};
  keys.forEach((k, i) => {
    map[k] = next[i] ?? "";
  });
  const patch = cepValuesToData(map);
  if (key === "info.ten_le") {
    // Đổi loại lễ: luật CEP — Vu Quy thì nhà gái chủ tiệc; còn lại giữ
    // nhà chủ tiệc đã chọn trước đó.
    return { ...data, ...patch, hostType: newValue === "Vu Quy" ? "Nhà Gái" : data.hostType };
  }
  return { ...data, ...patch, ceremonyType: data.ceremonyType, hostType: data.hostType };
}

/* ================= link cho khách (?d=, cùng kiểu encodeShare) ================= */

export interface SvgSharePayload {
  v: 1;
  tpl: string; // id mẫu SVG đã lưu
  name: string;
  svg?: string; // SVG nhúng kèm khi đủ nhỏ (mở được trên máy khác)
  data: InvitationData; // dữ liệu thiệp (chữ thường, KHÔNG có U+200B)
  extra?: Record<string, string>; // giá trị các khung ngoài CEP
  externalImages?: string[]; // href ảnh ngoài chưa nhúng (để trang khách báo mất nền); thiếu = không rõ
}

/** Chỉ nhúng SVG kèm link khi đủ nhỏ (URL dài quá trình duyệt/CDN cắt). */
export const MAX_INLINE_SVG_CHARS = 30000;

export function inlineSvgIfSmall(svgText: string): string | undefined {
  return svgText.length <= MAX_INLINE_SVG_CHARS ? svgText : undefined;
}

export function encodeSvgShare(payload: SvgSharePayload): string {
  const json = JSON.stringify(payload);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSvgShare(encoded: string): SvgSharePayload | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SvgSharePayload;
    if (!parsed || parsed.v !== 1 || typeof parsed.tpl !== "string" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSvgViewerUrl(origin: string, payload: SvgSharePayload): string {
  return `${origin}/mau/${encodeURIComponent(payload.tpl)}?d=${encodeSvgShare(payload)}`;
}
