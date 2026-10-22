// Capture the Ghost — success page.

import Link from "next/link";
import type { EventDoc } from "@/lib/event-types";
import { C, Shell, GhostTitle } from "./theme";
import WhatsAppCta from "./whatsapp-cta";

export default function CaptureTheGhostSuccess({ event }: { event: EventDoc }) {
  return (
    <Shell>
      <div
        className="w-full max-w-2xl border p-7 backdrop-blur-sm sm:p-11"
        style={{ backgroundColor: C.panel, borderColor: C.line }}
      >
        <GhostTitle title={event.title} className="text-3xl sm:text-5xl" />
        <p className="mt-6 flex items-center gap-2 text-lg font-bold" style={{ color: C.accent }}>
          <span aria-hidden="true">✓</span> You&apos;re in the hunt.
        </p>
        <p className="mt-2 text-base" style={{ color: C.muted }}>
          Your registration is saved.
        </p>

        <div className="mt-9">
          <WhatsAppCta />
        </div>

        <div className="mt-7">
          <Link
            href={`/events/${event.slug}`}
            className="text-sm font-bold underline-offset-4 hover:underline"
            style={{ color: C.gold }}
          >
            Back to event
          </Link>
        </div>
      </div>
    </Shell>
  );
}
