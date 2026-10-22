"use client";

import { useEffect, useState } from "react";
import { currentIdToken, onAuthChange } from "@/lib/firebase-client";

const NAV_LINKS = [
  { label: "ABOUT US", href: "#" },
  { label: "EVENTS", href: "/events" },
  { label: "GALLERY", href: "#" },
  { label: "MEET OUR TEAM", href: "#" },
  { label: "CONTACT", href: "#" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Show the Admin shortcut only to signed-in admins (role is decided server-side)
  useEffect(
    () =>
      onAuthChange(async (user) => {
        if (!user) return setIsAdmin(false);
        try {
          const token = await currentIdToken();
          const res = await fetch("/api/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(res.ok && (await res.json()).user?.role === "admin");
        } catch {
          setIsAdmin(false);
        }
      }),
    [],
  );

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-center px-8 py-6">
      {/* Desktop / tablet nav pill (unchanged on PC) */}
      <nav className="hidden items-center gap-10 rounded-full bg-white/90 px-12 py-4 shadow-lg backdrop-blur md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group relative font-poppins text-xs font-bold text-black"
          >
            <span className="inline-block transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[2px]">
              {link.label}
            </span>
            <span className="absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-black transition-all duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:w-full" />
          </a>
        ))}
        {isAdmin && (
          <a
            href="/admin/events"
            className="-my-1 -mr-6 rounded-full bg-[#5b4b8a] px-5 py-2 font-poppins text-xs font-bold text-white transition hover:bg-[#4a3c73]"
          >
            ADMIN
          </a>
        )}
      </nav>

      {/* Mobile hamburger */}
      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-black"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {open && (
          <div className="absolute left-1/2 top-14 flex w-[70vw] max-w-xs -translate-x-1/2 flex-col gap-1 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-center font-poppins text-sm font-bold text-black transition-colors hover:bg-black/5"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin/events"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-[#5b4b8a] px-4 py-3 text-center font-poppins text-sm font-bold text-white transition-colors hover:bg-[#4a3c73]"
              >
                ADMIN
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
