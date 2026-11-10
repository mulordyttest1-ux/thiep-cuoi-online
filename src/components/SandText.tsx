// Chữ hạt cát — hiệu ứng chữ dạng "sand" cho slideshow intro.
//
// Mẫu cộng đồng Text Particles (webdevpuneet.com/ui-snippets/
// text-particles) mà chị chủ chốt 2026-11-10: chữ được vẽ lên canvas ẩn
// rồi lấy mẫu điểm ảnh làm đích cho từng hạt cát (chấm vuông 1–2px màu
// chữ). Khác mẫu gốc ở cách chuyển động — mẫu gốc dùng lò xo nảy +
// nổ tung, MẠNH MẼ QUÁ với thiệp cưới; ở đây chị chốt RƠI NHẸ: hạt của
// từng chữ bắt đầu ở trên đích của nó rồi rơi nhẹ xuống (ease-out mềm,
// không nảy, không nổ), các chữ tụ theo thứ tự từ trái sang phải, tụ
// xong thì chữ đứng sắc nét; lúc chuyển ảnh, chữ vỡ thành hạt cát BAY
// LÊN rồi mờ dần. Canvas 2D thuần, không thêm thư viện.
//
// NHỊP (2026-11-10 16:24, chị chốt): cát dùng CHUNG nhịp đáp với
// scatter/paper (TEXT_PACE_* trong src/lib/intro.ts) — lịch rơi/tụ
// của từng chữ theo đường cong chung (K = 2,5, chậm đầu nhanh cuối),
// hạt bên phải bắt đầu muộn hơn hạt bên trái theo đúng đường cong đó
// (không còn stagger tuyến tính); mỗi hạt rơi DUR = 0,9s (cũ 3,4s)
// để 3 hiệu ứng đáp TRÙNG NHAU — chữ cuối tụ xong ~2,95s (cũ ~5,9s).
// Hạt vẫn rơi nhẹ ease-out (không nảy/không nổ), chỉ nhanh hơn.
//
// Cách hiện chữ sắc nét: hạt tụ xong thì chữ DOM thật (cùng font, cùng
// vị trí) mờ dần vào trong 0,6 giây trong lúc hạt mờ đi — hạt là cát,
// chữ đọc vẫn là chữ thật. Giảm chuyển động: hiện chữ tĩnh, không chạy
// canvas (như ShatterText).
"use client";

import { useEffect, useRef, useState } from "react";
import { usePresence } from "framer-motion";
import { TEXT_PACE_DUR_S, TEXT_PACE_SPAN_S, textPaceDelayAt } from "@/lib/intro";

const FALL_MS = TEXT_PACE_DUR_S * 1000; // mỗi hạt rơi ~0,9 giây — chung nhịp đáp với paper/scatter (cũ 3,4s)
const STAGGER_MS = TEXT_PACE_SPAN_S * 1000; // khoảng trải lần bắt đầu: hạt phải nhất bắt đầu ở 2,05s (cũ 2s tuyến tính)
const DISSOLVE_MS = 2000; // chữ vỡ thành cát bay lên lúc chuyển ảnh
const SETTLE_FADE_MS = 600; // hạt mờ đi trong lúc chữ DOM mờ vào
const SAMPLE_STRIDE = 3; // bước lấy mẫu điểm ảnh (px)
const MAX_PARTICLES = 2600; // trần tổng số hạt mỗi dòng
const FALL_SPACE = 120; // canvas chừa thêm phía trên dòng chữ để thấy hạt rơi

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  delay: number;
  dur: number;
  size: number;
  r: number;
  g: number;
  b: number;
  a: number;
  rise: number;
  drift: number;
};

type Phase = "idle" | "gather" | "fade" | "hold" | "dissolve" | "done";

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

function parseColor(input: string | undefined): [number, number, number] {
  if (!input) return [255, 255, 255];
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [p[0] ?? 255, p[1] ?? 255, p[2] ?? 255];
  }
  const hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }
  return [255, 255, 255];
}

export function SandText({
  text,
  slideKey,
  reduce,
  className,
  style,
}: {
  text: string;
  slideKey: number;
  reduce: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<Phase>("idle");
  const startRef = useRef(0);
  const settleRef = useRef(0);
  const dissolveRef = useRef(0);
  const rafRef = useRef(0);
  const [isPresent, safeToRemove] = usePresence();
  const [settled, setSettled] = useState(false);
  const [gone, setGone] = useState(false);
  const safeToRemoveRef = useRef(safeToRemove);
  safeToRemoveRef.current = safeToRemove;

  const color = parseColor(typeof style?.color === "string" ? style.color : undefined);

  // Vẽ 1 khung hình theo pha hiện tại; vị trí hiện tại ghi lại vào hạt để
  // lúc tan (giữa chừng) hạt bay lên đúng từ chỗ nó đang đứng.
  const draw = (now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const phase = phaseRef.current;
    const parts = particlesRef.current;
    if (phase === "gather" || phase === "fade") {
      const fade =
        phase === "fade" ? Math.max(0, 1 - (now - settleRef.current) / SETTLE_FADE_MS) : 1;
      for (const p of parts) {
        const t = (now - startRef.current - p.delay) / p.dur;
        if (t <= 0) continue;
        const e = easeOutCubic(Math.min(1, t));
        p.x = p.sx + (p.tx - p.sx) * e;
        p.y = p.sy + (p.ty - p.sy) * e;
        const a = p.a * Math.min(1, t * 3) * fade;
        if (a <= 0.01) continue;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    } else if (phase === "dissolve") {
      const t = Math.min(1, (now - dissolveRef.current) / DISSOLVE_MS);
      const e = easeOutCubic(t);
      for (const p of parts) {
        const x = p.x + p.drift * e;
        const y = p.y - p.rise * e;
        const a = p.a * (1 - t);
        if (a <= 0.01) continue;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fillRect(x, y, p.size, p.size);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  };

  const loop = (now: number) => {
    const phase = phaseRef.current;
    if (phase === "gather") {
      draw(now);
      if (now - startRef.current >= STAGGER_MS + FALL_MS * 1.15) {
        phaseRef.current = "fade";
        settleRef.current = now;
        setSettled(true);
      }
      rafRef.current = requestAnimationFrame(loop);
    } else if (phase === "fade") {
      draw(now);
      if (now - settleRef.current >= SETTLE_FADE_MS) {
        phaseRef.current = "hold";
        clearCanvas();
        return; // dừng vòng lặp — chỉ còn chữ DOM sắc nét
      }
      rafRef.current = requestAnimationFrame(loop);
    } else if (phase === "dissolve") {
      draw(now);
      if (now - dissolveRef.current >= DISSOLVE_MS) {
        phaseRef.current = "done";
        clearCanvas();
        safeToRemoveRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  // Lấy mẫu chữ + bắt đầu rơi.
  useEffect(() => {
    if (reduce) return;
    const span = spanRef.current;
    const canvas = canvasRef.current;
    if (!span || !canvas || !text.trim()) return;
    let cancelled = false;
    let started = false;
    const timers: number[] = [];

    const start = () => {
      if (started || cancelled) return;
      started = true;
      const rect = span.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(rect.width * dpr);
      canvas.height = Math.ceil((rect.height + FALL_SPACE) * dpr);
      canvas.style.height = `${rect.height + FALL_SPACE}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Vẽ chữ lên canvas ẩn (cùng font/cỡ với chữ DOM) rồi lấy mẫu
      // điểm ảnh đủ đậm làm đích cho hạt.
      const off = document.createElement("canvas");
      off.width = Math.ceil(rect.width);
      off.height = Math.ceil(rect.height);
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      const cs = getComputedStyle(span);
      octx.font = cs.font;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#fff";
      const fontSize = parseFloat(cs.fontSize) || 16;
      const lh = parseFloat(cs.lineHeight) || fontSize * 1.25;
      // Ngắt dòng theo từ, giống trình duyệt ngắt trong span.
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (octx.measureText(test).width <= rect.width || !cur) cur = test;
        else {
          lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
      const totalH = lines.length * lh;
      const y0 = (rect.height - totalH) / 2;
      lines.forEach((ln, i) => {
        octx.fillText(ln, rect.width / 2, y0 + i * lh + lh / 2);
      });
      const img = octx.getImageData(0, 0, off.width, off.height).data;
      // Bước lấy mẫu thích ứng để không vượt trần hạt.
      let stride = SAMPLE_STRIDE;
      let targets: Array<[number, number]> = [];
      for (;;) {
        targets = [];
        for (let y = 0; y < off.height; y += stride) {
          for (let x = 0; x < off.width; x += stride) {
            if (img[(y * off.width + x) * 4 + 3] > 128) targets.push([x, y]);
          }
        }
        if (targets.length <= MAX_PARTICLES || stride >= 6) break;
        stride += 1;
      }
      const [br, bg, bb] = color;
      particlesRef.current = targets.map(([x, y]) => {
        const nx = rect.width > 0 ? x / rect.width : 0;
        const sx = x + (Math.random() * 24 - 12);
        const sy = y + FALL_SPACE - (100 + Math.random() * 120);
        return {
          tx: x,
          ty: y + FALL_SPACE,
          x: sx,
          y: sy,
          sx,
          sy,
          delay: textPaceDelayAt(nx) * 1000, // lịch bắt đầu theo đường cong chung (trái→phải, chậm đầu nhanh cuối), không còn tuyến tính nx × STAGGER_MS
          dur: FALL_MS * (0.85 + Math.random() * 0.3),
          size: Math.random() < 0.5 ? 1 : 2,
          r: Math.round(br * (0.85 + Math.random() * 0.25)),
          g: Math.round(bg * (0.85 + Math.random() * 0.25)),
          b: Math.round(bb * (0.85 + Math.random() * 0.25)),
          a: 0.75 + Math.random() * 0.25,
          rise: 60 + Math.random() * 120,
          drift: Math.random() * 60 - 30,
        };
      });
      phaseRef.current = "gather";
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    };

    // Chờ font chữ tải xong rồi mới lấy mẫu (tối đa 1,2s) để chữ có dấu
    // đo đúng cỡ; font chưa về thì chữ lấy mẫu vẫn đúng hình (fallback).
    const fonts = (document as Document).fonts;
    if (fonts?.ready) {
      fonts.ready.then(start).catch(start);
    } else {
      start();
    }
    timers.push(window.setTimeout(start, 1200));
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, slideKey, reduce]);

  // Lúc chuyển ảnh: AnimatePresence tháo slide cũ — chữ vỡ thành cát bay
  // lên rồi mới cho tháo hẳn (usePresence giữ lại đến khi tan xong).
  useEffect(() => {
    if (isPresent) return;
    if (reduce || particlesRef.current.length === 0) {
      safeToRemoveRef.current?.();
      return;
    }
    setGone(true);
    phaseRef.current = "dissolve";
    dissolveRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
    const t = window.setTimeout(() => {
      if (phaseRef.current !== "done") {
        phaseRef.current = "done";
        safeToRemoveRef.current?.();
      }
    }, DISSOLVE_MS + 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent, reduce]);

  // Giảm chuyển động: chữ tĩnh, không canvas, không rAF.
  if (reduce) {
    return (
      <span className={className} style={style} aria-label={text}>
        {text}
      </span>
    );
  }

  return (
    <span
      ref={spanRef}
      className={className}
      style={{ ...style, position: "relative" }}
      aria-label={text}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 w-full"
      />
      <span
        aria-hidden="true"
        style={{
          opacity: settled && !gone ? 1 : 0,
          transition: gone ? "opacity 0.25s ease" : "opacity 0.6s ease",
        }}
      >
        {text}
      </span>
    </span>
  );
}
