// Capture the Ghost — the "join the WhatsApp group" call-out, shared by the
// success and already-registered pages. Square corners + lime accent to match the theme.

import { C } from "./theme";

export const WHATSAPP = "https://chat.whatsapp.com/BiM88jQhh2i3oqvrRJOTLc?s=sh&p=a&mlu=4&ilr=4";

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export default function WhatsAppCta({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="ctg-wa relative border p-5 sm:p-7"
      style={{
        borderColor: C.accent,
        backgroundColor: "rgba(163,230,53,0.06)",
      }}
    >
      <style>{`
        .ctg-wa-btn { animation: ctg-wa-pulse 2.6s ease-out infinite; }
        .ctg-wa-btn:hover { animation-play-state: paused; transform: translateY(-2px); }
        .ctg-wa-arrow { transition: transform .2s ease; }
        .ctg-wa-btn:hover .ctg-wa-arrow { transform: translateX(4px); }
        @keyframes ctg-wa-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(163,230,53,0.55); }
          70%  { box-shadow: 0 0 0 16px rgba(163,230,53,0); }
          100% { box-shadow: 0 0 0 0 rgba(163,230,53,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ctg-wa-btn { animation: none; }
          .ctg-wa-btn:hover { transform: none; }
        }
      `}</style>

      <span
        className="absolute -top-3 left-5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ backgroundColor: C.accent, color: C.bg }}
      >
        {compact ? "Don’t miss out" : "Last step"}
      </span>

      <p className="text-lg font-bold sm:text-xl" style={{ color: C.text }}>
        Join the WhatsApp group
      </p>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted }}>
        Everything about the hunt — timings, venue, rules and last-minute changes — is
        shared only there.
      </p>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="ctg-wa-btn mt-5 flex w-full items-center justify-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wide transition-transform"
        style={{ backgroundColor: C.accent, color: C.bg }}
      >
        <WhatsAppIcon />
        Join the group
        <span className="ctg-wa-arrow" aria-hidden="true">
          →
        </span>
      </a>
    </div>
  );
}
