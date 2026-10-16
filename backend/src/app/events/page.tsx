"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import EventTimeline, { type EventItem } from "@/components/events/EventTimeline";
import EventsLoader from "@/components/events/EventsLoader";

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
  const d = new Date(iso);
  const valid = !Number.isNaN(d.getTime());
  // Future events keep the current "latest / now happening" dial label.
  const isUpcoming = valid && d.getTime() > Date.now();
  return {
    id: e.slug || e.id,
    year: isUpcoming ? "LATEST EVENT" : valid ? String(d.getFullYear()) : "—",
    title: (e.title || "").toUpperCase(),
    date: formatDate(iso),
    location: e.venue || e.location || "",
    description: e.shortDescription?.trim() || e.description || "",
    image: e.theme?.poster || e.images?.[0]?.url || "",
    slug: e.slug || e.id,
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { events: ApiEvent[] }) => {
        if (!active) return;
        const items = (data.events ?? [])
          .filter((e) => e.showOnEvents !== false)
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

  const handleScrollToLatest = () => {
    window.dispatchEvent(new CustomEvent("reset-timeline-latest"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[100svh] flex-col overscroll-none bg-[#FBFBFE] pt-20 pb-4 sm:pt-24 lg:h-[100svh] lg:overflow-hidden">
        <div className="relative z-10 flex flex-none flex-col items-center justify-center px-6 text-center">
          <h1 className="font-bebas text-5xl leading-none tracking-wider text-black sm:text-7xl md:text-8xl">
            EVENTS
          </h1>

          <p className="mt-1 font-cedarville text-2xl sm:text-3xl md:text-4xl text-[#8D7FB5]">
            Whats happening  !
          </p>
        </div>

        <div className="relative z-10 flex w-full flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:items-center lg:justify-center">
          {events === null ? (
            <EventsLoader />
          ) : events.length === 0 ? (
            <p className="text-center font-poppins text-sm text-black/40">
              No events to show yet.
            </p>
          ) : (
            <EventTimeline events={events} />
          )}
        </div>
        
        <button
          type="button"
          onClick={handleScrollToLatest}
          title="Go to Latest Event"
          aria-label="Go to Latest Event"
          className="group fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#8D7FB5] active:scale-95 sm:bottom-8 sm:right-8"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </main>
    </>
  );
}
