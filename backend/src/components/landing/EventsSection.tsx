"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

type ApiEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  showOnEvents?: boolean;
  date?: string;
  startsAt?: string;
  venue?: string;
  location?: string;
  images?: { url: string }[];
  theme?: { poster?: string };
};

type EventItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
};

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toEventItem(e: ApiEvent): EventItem {
  const iso = e.startsAt || e.date || "";
  return {
    slug: e.slug || e.id,
    title: (e.title || "").toUpperCase(),
    description: e.shortDescription?.trim() || e.description || "",
    date: formatDate(iso),
    location: e.venue || e.location || "",
    image: e.theme?.poster || e.images?.[0]?.url || "",
  };
}

function EventImagePlaceholder() {
  return (
    <div className="flex aspect-[175/120] w-full max-w-[350px] flex-none items-center justify-center overflow-hidden rounded-2xl bg-[#E6E1F2] lg:w-[350px]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          stroke="#8D7FB5"
          strokeWidth="1.5"
        />
        <circle cx="8.5" cy="10" r="1.5" fill="#8D7FB5" />
        <path
          d="M4 17l5-5 4 4 3-3 4 4"
          stroke="#8D7FB5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="#8D7FB5"
        strokeWidth="1.5"
      />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="#8D7FB5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"
        stroke="#8D7FB5"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="#8D7FB5" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowIcon({ color = "#fff" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EventCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8 lg:flex-row lg:items-center">
      <div className="aspect-[175/120] w-full max-w-[350px] flex-none rounded-2xl bg-black/[0.06] lg:w-[350px]" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-7 w-3/4 rounded bg-black/[0.06]" />
        <div className="h-4 w-full rounded bg-black/[0.06]" />
        <div className="h-4 w-5/6 rounded bg-black/[0.06]" />
        <div className="mt-1 flex gap-3">
          <div className="h-3 w-24 rounded bg-black/[0.06]" />
          <div className="h-3 w-20 rounded bg-black/[0.06]" />
        </div>
      </div>
      <div className="h-11 w-36 flex-none rounded-[25px] bg-black/[0.06]" />
    </div>
  );
}

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { events: ApiEvent[] }) => {
        if (!active) return;
        const items = (data.events ?? [])
          .filter((e) => e.showOnEvents !== false)
          .sort((a, b) => {
            const ta = new Date(a.startsAt || a.date || 0).getTime();
            const tb = new Date(b.startsAt || b.date || 0).getTime();
            return tb - ta;
          })
          .slice(0, 2)
          .map(toEventItem);
        setEvents(items);
      })
      .catch(() => {
        if (active) setEvents([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-white py-20">
      {/* Anchored flush to the top and right edges of this box (the M/L
          corner points never change), only the wavy inner boundary morphs —
          so it can never drift down over the event list or left over text. */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden sm:block"
        style={{
          width: "clamp(340px, 42vw, 620px)",
          aspectRatio: "600 / 400",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path className="blob-path" fill="#C9BBEF" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-8 sm:px-16">
        <Reveal>
          <h2 className="font-bebas text-[40px] leading-[0.95] text-black sm:text-[52px] lg:text-[60px]">
            LATEST EVENTS
          </h2>
          <p className="mt-1 font-cedarville text-[30px] leading-tight text-[#8D7FB5] sm:text-[36px] lg:text-[40px]">
            Whats happening -
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-12">
          {events === null &&
            [0, 1].map((i) => <EventCardSkeleton key={i} />)}
          {events?.map((event, i) => (
            <Reveal
              key={event.slug}
              delay={i * 0.12}
              className="flex flex-col gap-8 lg:flex-row lg:items-center"
            >
              {event.image ? (
                <a
                  href={`/events/${event.slug}`}
                  className="flex aspect-[175/120] w-full max-w-[350px] flex-none items-center justify-center overflow-hidden rounded-2xl bg-[#E6E1F2] lg:w-[350px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <a href={`/events/${event.slug}`}>
                  <EventImagePlaceholder />
                </a>
              )}

              <div className="flex flex-1 flex-col gap-3">
                <h3 className="font-playfair text-[24px] leading-tight text-black sm:text-[28px] lg:text-[30px]">
                  {event.title}
                </h3>
                <p className="max-w-[520px] font-playfair text-[15px] leading-relaxed text-black">
                  {event.description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 font-playpen text-[12px] text-black">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon />
                    {event.date}
                  </span>
                  {event.location && (
                    <>
                      <span className="text-black/30">|</span>
                      <span className="flex items-center gap-1.5">
                        <PinIcon />
                        {event.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <a
                href={`/events/${event.slug}`}
                className="inline-flex flex-none items-center gap-2 rounded-[25px] bg-[#8D7FB5] px-6 py-3 font-poppins text-[13px] font-bold tracking-wide text-white"
              >
                VIEW EVENT
                <ArrowIcon />
              </a>
            </Reveal>
          ))}
        </div>

        <a
          href="/events"
          className="mt-14 inline-flex items-center gap-2 rounded-[25px] bg-[#8D7FB5]/15 px-6 py-3 font-poppins text-[13px] font-bold tracking-wide text-[#8D7FB5]"
        >
          MORE EVENTS
          <ArrowIcon color="#8D7FB5" />
        </a>
      </div>
    </section>
  );
}
