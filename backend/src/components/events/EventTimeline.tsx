"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export type EventItem = {
  id: string;
  year: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  slug?: string;
};

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "latest-event",
    year: "LATEST EVENT",
    title: "CAPTURE THE GHOST: CTF",
    date: "26 OCT 2026",
    location: "TBD",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odit quisquam laudantium amet aperiam. Expedita, aspernatur!",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    slug: "capture-the-ghost",
  },
  {
    id: "git-bootcamp-2023",
    year: "2023",
    title: "GIT & GITHUB HANDS-ON BOOTCAMP",
    date: "22 SEP 2023",
    location: "MIDDLE EAST",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi accusantium iusto maxime nesciunt!",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
  {
    id: "Open source something",
    year: "2023",
    title: "OPEN SOURCE event",
    date: "14 OCT 2023",
    location: "NOOTAN HALL",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat error vel, quod doloremque tenetur eos?",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
  {
    id: "gsoc-2024",
    year: "2024",
    title: "GOOGLE SUMMER OF CODE",
    date: "14 NOV 2024",
    location: "NEWTON HALL",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi ullam commodi, repellendus voluptatem itaque reiciendis!",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
  {
    id: "genai-foss-2024",
    year: "2024",
    title: "GENERATIVE AI AND OPEN SOURCE",
    date: "16 NOV 2024",
    location: "ONLINE / ICFOSS",
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae cumque quibusdam officia, voluptates rerum commodi!',
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
  {
    id: "ctf-ghost-2025",
    year: "2025",
    title: "CAPTURE THE GHOST: CTF HACKATHON",
    date: "15 FEB 2025",
    location: "AB-3 AUDITORIUM",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi ullam commodi, repellendus voluptatem itaque reiciendis!",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    slug: "capture-the-ghost",
  },
  {
    id: "osd-2025",
    year: "2026",
    title: "WIOS OPEN SOURCE DAY 2026",
    date: "28 MAR 2026",
    location: "CENTRAL AUDITORIUM",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi ullam commodi, repellendus voluptatem itaque reiciendis!",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
  {
    id: "ai-foss-summit-2026",
    year: "2026",
    title: "AI SUMMIT",
    date: "20 APR 2026",
    location: "NEWTON HALL & ONLINE",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae cumque quibusdam officia, voluptates rerum commodi!",
    image:
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
    slug: "events",
  },
];


const DIAL = {
  radius: 360,
  centerX: -210,
  centerY: 260,
  gap: 18,
  angleStep: 28,
};

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="#8D7FB5"
        strokeWidth="1.5"
      />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke="#8D7FB5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"
        stroke="#8D7FB5"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="#8D7FB5" strokeWidth="1.5" />
    </svg>
  );
}

export default function EventTimeline({
  events = DEFAULT_EVENTS,
}: {
  events?: EventItem[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Track poster orientation so vertical posters are shown in full (not cropped).
  const [portrait, setPortrait] = useState(false);

  // Scroll direction drives the enter/exit slide (1 = down, -1 = up).
  const [direction, setDirection] = useState(1);

  const touchStartY = useRef<number | null>(null);
  const cooldownRef = useRef(false);

  const allYears = useMemo(
    () => Array.from(new Set(events.map((e) => e.year))),
    [events]
  );

  // Jump straight to the first event of a given year (clicking a year on the dial).
  const goToYear = useCallback(
    (year: string) => {
      const idx = events.findIndex((e) => e.year === year);
      if (idx >= 0) {
        setDirection(idx >= currentIndexRef.current ? 1 : -1);
        setCurrentIndex(idx);
      }
    },
    [events]
  );

  const step = useCallback(
    (delta: number) => {
      if (cooldownRef.current) return;
      setCurrentIndex((prev) => {
        const next = prev + delta;
        if (next < 0 || next >= events.length) return prev;
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 260);
        setDirection(delta > 0 ? 1 : -1);
        return next;
      });
    },
    [events.length]
  );

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 16) return;

      const current = currentIndexRef.current;
      const isDown = e.deltaY > 0;
      const isUp = e.deltaY < 0;

      const atTop = current === 0 && isUp;
      const atBottom = current === events.length - 1 && isDown;

      if (!atTop && !atBottom) {
        e.preventDefault();
        step(isDown ? 1 : -1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [events.length, step]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 35) {
      step(diff > 0 ? 1 : -1);
      touchStartY.current = null;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(() => {
    const onReset = () => {
      setDirection(-1);
      setCurrentIndex(0);
    };
    window.addEventListener("reset-timeline-latest", onReset);
    return () => window.removeEventListener("reset-timeline-latest", onReset);
  }, []);

  const activeEvent = events[currentIndex] ?? events[0];
  const activeYear = activeEvent.year;

  // Reset orientation guess whenever the shown poster changes.
  useEffect(() => {
    setPortrait(false);
  }, [activeEvent.id]);
  const activeYearIndex = Math.max(0, allYears.indexOf(activeYear));

  const eventHref =
    activeEvent.slug && activeEvent.slug !== "events"
      ? `/events/${activeEvent.slug}`
      : "/events";

  return (
    <section
      aria-label="Event Timeline"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative mx-auto flex h-full max-h-[620px] w-full max-w-6xl select-none items-center justify-between px-6 py-2 sm:px-10"
    >
      <div className="relative flex w-full flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-16">
        <div
          aria-hidden="true"
          className="pointer-events-none relative flex h-[340px] w-full max-w-[280px] flex-none items-center justify-center overflow-visible sm:h-[420px] lg:h-[520px] lg:w-[320px]"
        >
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 320 520"
            fill="none"
          >
            <circle
              cx={DIAL.centerX}
              cy={DIAL.centerY}
              r={DIAL.radius}
              stroke="#D6D3E1"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              className="opacity-75"
            />
          </svg>

          {allYears.map((year, i) => {
            const offset = i - activeYearIndex;
            const angleDeg = offset * DIAL.angleStep;
            const angleRad = (angleDeg * Math.PI) / 180;

            const dotX = DIAL.centerX + DIAL.radius * Math.cos(angleRad);
            const dotY = DIAL.centerY + DIAL.radius * Math.sin(angleRad);

            const isActive = year === activeYear;
            const isVisible = Math.abs(offset) <= 2.5;

            if (!isVisible) return null;

            return (
              <div key={year} className="pointer-events-none select-none">
                <div
                  className="absolute h-3 w-3 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    left: `${dotX}px`,
                    top: `${dotY}px`,
                    backgroundColor: isActive ? "#000000" : "#B8B5C7",
                    transform: `translate(-50%, -50%) scale(${isActive ? 1.6 : 0.85})`,
                  }}
                />

                <button
                  type="button"
                  onClick={() => goToYear(year)}
                  title={`Go to ${year}`}
                  className="pointer-events-auto absolute cursor-pointer whitespace-nowrap text-left font-bebas tracking-wide transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    left: `${dotX}px`,
                    top: `${dotY}px`,
                    transformOrigin: "left center",
                    transform: `rotate(${angleDeg}deg) translate(${DIAL.gap}px, -50%) scale(${isActive ? 1.05 : 0.85})`,
                    color: isActive ? "#000000" : "#BCBAC7",
                    opacity: isActive
                      ? 1
                      : Math.max(0.2, 0.65 - Math.abs(offset) * 0.22),
                  }}
                >
                  {year.includes(" ") ? (
                    <span
                      className={`flex flex-col leading-[0.85] whitespace-nowrap ${
                        isActive
                          ? "text-3xl font-extrabold sm:text-4xl lg:text-5xl"
                          : "text-xl font-normal sm:text-2xl lg:text-3xl"
                      }`}
                    >
                      {year.split(" ").map((word, wIdx) => (
                        <span key={wIdx} className="block">
                          {word}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span
                      className={`block leading-none ${
                        isActive
                          ? "text-5xl font-extrabold sm:text-6xl lg:text-7xl"
                          : "text-3xl font-normal sm:text-4xl lg:text-5xl"
                      }`}
                    >
                      {year}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative w-full flex-1 pl-4 sm:pl-8 lg:pl-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.article
              key={activeEvent.id}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 56 : -56 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -56 : 56 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col-reverse gap-8 lg:flex-row lg:items-center lg:justify-between"
            >
              {/* Event Information */}
              <div className="flex flex-1 flex-col gap-4">
                <h3 className="font-bebas text-3xl font-normal leading-[0.95] tracking-wide text-black sm:text-4xl lg:text-5xl max-w-lg">
                  {activeEvent.title}
                </h3>

                <p className="max-w-[440px] font-poppins text-xs sm:text-sm leading-relaxed text-black/75">
                  {activeEvent.description}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3 font-playpen text-xs sm:text-[13px] text-black">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon />
                    {activeEvent.date}
                  </span>
                  {activeEvent.location && (
                    <>
                      <span className="text-black/30" aria-hidden="true">|</span>
                      <span className="flex items-center gap-1.5">
                        <PinIcon />
                        {activeEvent.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

            
              <Link
                href={eventHref}
                title={`View ${activeEvent.title}`}
                className="group relative flex-none cursor-pointer overflow-hidden rounded-2xl bg-[#E6E1F2] shadow-sm transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  width: "100%",
                  maxWidth: portrait ? 320 : 420,
                  aspectRatio: portrait ? "3 / 4" : "175 / 105",
                }}
              >
                <img
                  src={activeEvent.image}
                  alt={activeEvent.title}
                  loading="lazy"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setPortrait(img.naturalHeight > img.naturalWidth);
                  }}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
