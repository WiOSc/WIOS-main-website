// Capture the Ghost — details page. Space Mono, warm solid theme.

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type EventDoc, isRegistrationOpen } from "@/lib/event-types";
import { C, Shell, GhostTitle, fmtDateTime, fmtTime } from "./theme";

export default function CaptureTheGhostDetails({ event }: { event: EventDoc }) {
  const open = isRegistrationOpen(event);
  const fmt = fmtDateTime;

  return (
    <Shell center={false}>
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <GhostTitle title={event.title} />

        {(event.startsAt || event.location) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {event.startsAt && (
              <div
                className="border-l-2 py-1 pl-4"
                style={{ borderColor: C.accent }}
              >
                <p
                  className="text-[0.7rem] font-bold uppercase tracking-[0.25em]"
                  style={{ color: C.accent }}
                >
                  When
                </p>
                <p
                  className="mt-1.5 text-lg font-bold leading-tight"
                  style={{ color: C.text }}
                >
                  {fmt(event.startsAt)}
                  {event.endsAt && ` - ${fmtTime(event.endsAt)}`}
                </p>
              </div>
            )}
            {event.location && (
              <div
                className="border-l-2 py-1 pl-4"
                style={{ borderColor: C.gold }}
              >
                <p
                  className="text-[0.7rem] font-bold uppercase tracking-[0.25em]"
                  style={{ color: C.gold }}
                >
                  Where
                </p>
                <p
                  className="mt-1.5 text-lg font-bold leading-tight"
                  style={{ color: C.text }}
                >
                  {event.location}
                </p>
              </div>
            )}
          </div>
        )}

        {event.description && (
          <div
            className="border p-6 backdrop-blur-sm"
            style={{ borderColor: C.line, backgroundColor: C.panel }}
          >
            <div
              className="prose-wios flex flex-col gap-2 text-sm leading-relaxed"
              style={{ color: C.text }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {event.description}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {event.registrationDeadline && (
          <div
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border px-4 py-3 backdrop-blur-sm"
            style={{ borderColor: C.line, backgroundColor: C.panel }}
          >
            <span
              className="text-[0.7rem] font-bold uppercase tracking-[0.25em]"
              style={{ color: C.danger }}
            >
              Registration closes
            </span>
            <span className="text-sm font-bold" style={{ color: C.text }}>
              {fmt(event.registrationDeadline)}
            </span>
          </div>
        )}

        {open ? (
          <Link
            href={`/events/${event.slug}/register`}
            className="self-start px-8 py-3.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.accent, color: C.bg }}
          >
            Register
          </Link>
        ) : (
          <p className="text-sm font-bold" style={{ color: C.danger }}>
            Registrations closed
          </p>
        )}
      </div>
    </Shell>
  );
}
