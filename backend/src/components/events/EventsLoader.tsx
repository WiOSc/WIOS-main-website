"use client";

import { motion } from "framer-motion";

// Skeleton block with a sweeping highlight.
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-black/[0.06] ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}

// Rotating dashed ring with an orbiting accent dot — echoes the dial.
function DialSpinner() {
  return (
    <div className="relative flex h-[220px] w-[220px] flex-none items-center justify-center lg:h-[320px] lg:w-[320px]">
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 7, ease: "linear", repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#D6D3E1"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />
        </svg>
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#8D7FB5] shadow-[0_0_12px_#8D7FB5]" />
      </motion.div>
      <motion.span
        className="font-bebas text-2xl tracking-widest text-black/25 lg:text-3xl"
        animate={{ opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        WiOS
      </motion.span>
    </div>
  );
}

export default function EventsLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center gap-10 px-6 pb-10 lg:flex-row lg:justify-center lg:gap-16 lg:pb-0"
      aria-label="Loading events"
      role="status"
    >
      <DialSpinner />

      <div className="flex w-full max-w-3xl flex-col-reverse gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="mt-1 flex gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <Skeleton className="aspect-[175/105] w-full max-w-[420px] rounded-2xl" />
      </div>
    </motion.div>
  );
}
