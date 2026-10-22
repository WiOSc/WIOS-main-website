// Capture the Ghost — already-registered page. Space Mono, warm theme.

import Link from "next/link";
import type { EventDoc } from "@/lib/event-types";
import { C, Shell, GhostTitle } from "./theme";
import WhatsAppCta from "./whatsapp-cta";

export default function CaptureTheGhostAlready({ event }: { event: EventDoc }) {
  return (
    <Shell>
      <div
        className="w-full max-w-2xl border p-7 backdrop-blur-sm sm:p-11"
        style={{ backgroundColor: C.panel, borderColor: C.line }}
      >
        <GhostTitle title={event.title} className="text-3xl sm:text-5xl" />
        <p className="mt-6 text-base" style={{ color: C.muted }}>
          You&apos;ve already claimed your spot for this event.
        </p>

        <div className="mt-9">
          <WhatsAppCta compact />
        </div>

        <div className="mt-7">
          <Link
            href={`/events/${event.slug}`}
            className="inline-block border px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors"
            style={{ borderColor: C.accent, color: C.accent }}
          >
            Back to event
          </Link>
        </div>
      </div>
    </Shell>
  );
}
