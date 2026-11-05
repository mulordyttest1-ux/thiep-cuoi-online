"use client";

import { useEffect, useState } from "react";

function diffParts(date: string, time: string) {
  const target = new Date(`${date}T${time || "00:00"}:00`);
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  if (isNaN(target.getTime())) return null;
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    passed: false,
  };
}

export default function Countdown({ date, time, accent }: { date: string; time: string; accent: string }) {
  const [parts, setParts] = useState(() => diffParts(date, time));
  useEffect(() => {
    setParts(diffParts(date, time));
    const id = setInterval(() => setParts(diffParts(date, time)), 1000);
    return () => clearInterval(id);
  }, [date, time]);
  if (!parts) return null;
  const cells = [
    { v: parts.days, label: "ngày" },
    { v: parts.hours, label: "giờ" },
    { v: parts.minutes, label: "phút" },
    { v: parts.seconds, label: "giây" },
  ];
  return (
    <div className="mt-6" role="timer" aria-live="off">
      <p className="text-sm font-semibold" style={{ color: accent }}>
        {parts.passed ? "Ngày vui đã đến — chúc mừng hạnh phúc!" : "Đếm ngược tới ngày cưới"}
      </p>
      <div className="mt-2 flex justify-center gap-2">
        {cells.map((c) => (
          <div key={c.label} className="w-16 rounded-xl bg-white/80 px-2 py-3 shadow-sm">
            <p className="font-display text-2xl font-bold" style={{ color: accent }}>{c.v}</p>
            <p className="text-xs text-[#7a6a68]">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
