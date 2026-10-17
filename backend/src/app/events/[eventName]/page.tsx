import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import { isRegistrationOpen, type EventDoc } from "@/lib/event-types";
import { getOverride } from "@/components/events/registry";
import Markdown from "@/components/Markdown";

export const runtime = "nodejs";

type Props = { params: Promise<{ eventName: string }> };

// Best available poster for link previews.
function posterUrl(event: EventDoc): string | undefined {
  return event.theme?.poster ?? event.bannerUrl ?? event.images?.[0]?.url;
}

// Per-event Open Graph / Twitter metadata so links embed title + poster.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventName } = await params;
  const event = await getEvent(eventName);

  if (!event || event.status === "draft") {
    return { title: "Event not found | WiOS" };
  }

  const title = event.title;
  const description =
    event.shortDescription?.trim() ||
    event.description?.replace(/\s+/g, " ").trim().slice(0, 200) ||
    "An event by WiOS, VIT-AP.";
  const poster = posterUrl(event);
  const url = `/events/${event.slug}`;

  return {
    title: `${title} | WiOS`,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "WiOS VIT-AP",
      images: poster ? [{ url: poster, alt: title }] : undefined,
    },
    twitter: {
      card: poster ? "summary_large_image" : "summary",
      title,
      description,
      images: poster ? [poster] : undefined,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { eventName } = await params;
  const event = await getEvent(eventName);
  if (!event || event.status === "draft") notFound();

  const Override = getOverride(event.slug, "details");
  if (Override) return <Override event={event} />;

  const accent = event.theme?.accent ?? "#8D7FB5";
  const poster = event.theme?.poster ?? event.bannerUrl;
  const open = isRegistrationOpen(event);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-16">
      {poster && (
        <div
          className="h-56 w-full rounded-2xl bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
      <h1 className="font-bebas text-5xl leading-none text-black">{event.title}</h1>

      <div className="flex flex-wrap gap-4 font-poppins text-sm text-black/60">
        {event.startsAt && <span>📅 {fmt(event.startsAt)}</span>}
        {event.location && <span>📍 {event.location}</span>}
      </div>

      {event.description && <Markdown>{event.description}</Markdown>}

      {event.registrationDeadline && (
        <p className="font-poppins text-xs text-black/50">
          Registration closes {fmt(event.registrationDeadline)}
        </p>
      )}

      {open ? (
        <Link
          href={`/events/${event.slug}/register`}
          className="self-start rounded-full px-7 py-3 font-poppins text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          Register
        </Link>
      ) : (
        <p className="font-poppins text-sm font-bold text-black/40">
          Registrations closed
        </p>
      )}
    </main>
  );
}
