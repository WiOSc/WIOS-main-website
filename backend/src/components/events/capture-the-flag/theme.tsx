// Shared theme for Capture the Ghost pages — "séance" palette.

import type { ReactNode } from "react";
import { Space_Mono, Chakra_Petch } from "next/font/google";

export const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });
export const display = Chakra_Petch({ weight: ["600", "700"], subsets: ["latin"] });

// DD/MM/YYYY, hh:mm (Indian format)
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Midnight violet / toxic lime / spectral purple. `gold` slot reused as violet.
export const C = {
  bg: "#0C0A14",
  panel: "rgba(23,18,38,0.74)",
  line: "rgba(167,139,250,0.22)",
  accent: "#A3E635",
  gold: "#A78BFA",
  text: "#ECE7FA",
  muted: "#9A8CBD",
  danger: "#FB7185",
};

// Faint tiled bat motif as the background image
const BAT = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='#A78BFA' fill-opacity='0.06'><path d='M70 54c-7-12-19-14-24-7 3-7-2-12-7-10 4 5 1 9-3 11 7 2 12 9 13 16 5-6 11-7 15-4 4-3 10-2 15 4 1-7 6-14 13-16-4-2-7-6-3-11-5-2-10 3-7 10-5-7-17-5-24 7z'/></g></svg>`,
);

// Split-word title: last word gets a hollow "ghost" outline + flicker,
// the rest gets a glitch scan. Keyframes/classes live in <Shell>.
export function GhostTitle({
  title,
  className = "text-4xl sm:text-5xl lg:text-6xl",
}: {
  title: string;
  className?: string;
}) {
  const words = title.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const lead = words.join(" ");
  return (
    <h1
      className={`${display.className} font-bold uppercase leading-[0.9] tracking-tight ${className}`}
      style={{ color: C.text }}
    >
      <span className="ctg-glitch block" data-text={lead}>
        {lead}
      </span>
      {last && <span className="ctg-ghost block">{last}</span>}
    </h1>
  );
}

export function Shell({
  children,
  center = true,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`${mono.className} ctg-scope relative`}
      style={{
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: C.bg,
        color: C.text,
        backgroundImage: `url("data:image/svg+xml,${BAT}")`,
        backgroundSize: "140px 140px",
      }}
    >
      <style>{`
        .ctg-scope { scrollbar-width: thin; scrollbar-color: ${C.accent} ${C.bg}; }
        .ctg-scope::-webkit-scrollbar { width: 12px; }
        .ctg-scope::-webkit-scrollbar-track { background: ${C.bg}; }
        .ctg-scope::-webkit-scrollbar-thumb { background: ${C.accent}; border: 3px solid ${C.bg}; }
        .ctg-scope::-webkit-scrollbar-thumb:hover { background: ${C.gold}; }
        .ctg-glitch { position: relative; display: inline-block; }
        .ctg-glitch::before, .ctg-glitch::after {
          content: attr(data-text);
          position: absolute; left: 0; top: 0; width: 100%; pointer-events: none;
        }
        .ctg-glitch::before {
          color: ${C.accent}; transform: translateX(-1.5px);
          animation: ctg-scan 5s linear infinite;
        }
        .ctg-glitch::after {
          color: ${C.gold}; transform: translateX(1.5px);
          animation: ctg-scan 5s linear infinite;
          animation-delay: -0.1s;
        }
        @keyframes ctg-scan {
          0%   { clip-path: inset(-30% 0 100% 0); }
          13%  { clip-path: inset(100% 0 -30% 0); }
          100% { clip-path: inset(100% 0 -30% 0); }
        }
        .ctg-ghost {
          color: transparent;
          -webkit-text-stroke: 2px ${C.gold};
          text-stroke: 2px ${C.gold};
          animation: ctg-haunt 6s ease-in-out infinite;
        }
        @keyframes ctg-haunt {
          0%, 100% { opacity: 1; transform: translateX(0); }
          47%      { opacity: 1; transform: translateX(0); }
          49%      { opacity: 0.25; transform: translateX(3px); }
          50%      { opacity: 0.9;  transform: translateX(-2px); }
          52%      { opacity: 0.4;  transform: translateX(1px); }
          54%      { opacity: 1;    transform: translateX(0); }
        }
      `}</style>

      {/* moon glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full"
        style={{
          backgroundColor: "#1C1636",
          boxShadow: `0 0 180px 70px rgba(167,139,250,0.16)`,
        }}
      />

      <div
        className={`relative flex min-h-full justify-center px-4 py-14 ${
          center ? "items-center" : "items-start"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
