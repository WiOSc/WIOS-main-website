"use client";

// Capture the Ghost — register page. Asymmetric two-column "dossier" layout.

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chakra_Petch } from "next/font/google";
import { type EventDoc, isRegistrationOpen } from "@/lib/event-types";
import { useRegister } from "@/lib/useRegister";
import { mono, fmtDateTime } from "./theme";

const display = Chakra_Petch({ weight: ["600", "700"], subsets: ["latin"] });

// Midnight violet / toxic lime / spectral purple
const P = {
  bg: "#0C0A14",
  panel: "rgba(23,18,38,0.6)",
  line: "rgba(167,139,250,0.22)",
  lineSoft: "rgba(167,139,250,0.12)",
  accent: "#A3E635",
  violet: "#A78BFA",
  text: "#ECE7FA",
  muted: "#9A8CBD",
  danger: "#FB7185",
  inputBg: "rgba(10,8,18,0.5)",
};

type Answers = Record<string, string>;

const EMAIL_ID = "eb04e221";
const EMAIL_DOMAIN = "@vitapstudent.ac.in";

const CORE = [
  { id: "8bee7he", label: "Name", type: "text", required: true },
  { id: EMAIL_ID, label: "College Email", type: "email", required: true },
  { id: "db47b8f5", label: "Team Name", type: "text", required: true },
] as const;

const TEAM_GROUPS = [
  {
    group: "Leader",
    fields: [
      { id: "a99885f1", label: "Name", type: "text", required: true },
      { id: "b27ada53", label: "Reg No", type: "text", required: true },
    ],
  },
  {
    group: "Member 1",
    fields: [
      { id: "bf94f945", label: "Name", type: "text", required: false },
      { id: "f6aa53c1", label: "Reg No", type: "text", required: false },
    ],
  },
  {
    group: "Member 2",
    fields: [
      { id: "241f4d1e", label: "Name", type: "text", required: false },
      { id: "56d5b210", label: "Reg No", type: "text", required: false },
    ],
  },
] as const;

// Faint tiled bat motif as the background image
const BAT = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='#A78BFA' fill-opacity='0.06'><path d='M70 54c-7-12-19-14-24-7 3-7-2-12-7-10 4 5 1 9-3 11 7 2 12 9 13 16 5-6 11-7 15-4 4-3 10-2 15 4 1-7 6-14 13-16-4-2-7-6-3-11-5-2-10 3-7 10-5-7-17-5-24 7z'/></g></svg>`,
);

export default function CaptureTheGhostRegister({ event }: { event: EventDoc }) {
  const { user, ready, submitting, error, signIn, submit, prefill, registration, loaded } =
    useRegister(event.slug);
  const [answers, setAnswers] = useState<Answers>({});
  const [showDetails, setShowDetails] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Event details start open on desktop (lg+), collapsed on phones.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setShowDetails(true);
    }
  }, []);

  useEffect(() => {
    if (registration) setAnswers(registration.answers as Answers);
    else if (Object.keys(prefill).length > 0)
      setAnswers((prev) => ({ ...(prefill as Answers), ...prev }));
  }, [prefill, registration]);

  const set = (id: string, v: string) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  const editing = !!registration && event.allowEdit;
  const open = isRegistrationOpen(event);
  const deadline = event.registrationDeadline
    ? fmtDateTime(event.registrationDeadline)
    : null;

  // Split title so the last word gets a distinct "ghost" treatment.
  const titleWords = event.title.trim().split(/\s+/);
  const titleLast = titleWords.length > 1 ? titleWords.pop()! : "";
  const titleLead = titleWords.join(" ");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = (answers[EMAIL_ID] ?? "").trim().toLowerCase();
    if (!email.endsWith(EMAIL_DOMAIN)) {
      setEmailError(`Use your VIT-AP email (${EMAIL_DOMAIN}).`);
      return;
    }
    setEmailError(null);
    await submit(answers);
  }

  // ---- left identity column ----
  const hero = (withDetails: boolean) => (
    <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
      <h1
        className={`${display.className} text-[2.75rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl`}
        style={{ color: P.text }}
      >
        <span className="ctg-glitch block" data-text={titleLead}>
          {titleLead}
        </span>
        <span className="ctg-ghost block">{titleLast}</span>
      </h1>

      {deadline && (
        <div className="flex flex-col gap-1">
          <span
            className="text-[0.7rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: P.muted }}
          >
            Registration closes
          </span>
          <span className="text-sm font-bold" style={{ color: P.text }}>
            {deadline}
          </span>
        </div>
      )}

      {withDetails && event.description && (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex items-center gap-2 self-start text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
            style={{ color: P.accent }}
          >
            <span>{showDetails ? "[-]" : "[+]"}</span>
            {showDetails ? "Hide details" : "Event details"}
          </button>
          {showDetails && (
            <div
              className="mt-4 border p-5"
              style={{ borderColor: P.line, backgroundColor: P.inputBg }}
            >
              <div
                className="prose-wios flex flex-col gap-2 text-sm leading-relaxed"
                style={{ color: P.text }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.description}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ---- shell: full-bleed bg + two-column grid ----
  const shell = (withDetails: boolean, right: React.ReactNode) => (
    <div
      className={`${mono.className} ctf-scope relative`}
      style={{
        height: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        color: P.text,
        backgroundColor: P.bg,
        backgroundImage: `url("data:image/svg+xml,${BAT}")`,
        backgroundSize: "140px 140px",
      }}
    >
      <style>{`
        .ctf-scope { scrollbar-width: thin; scrollbar-color: ${P.accent} ${P.bg}; }
        .ctf-scope::-webkit-scrollbar { width: 12px; }
        .ctf-scope::-webkit-scrollbar-track { background: ${P.bg}; }
        .ctf-scope::-webkit-scrollbar-thumb { background: ${P.accent}; border: 3px solid ${P.bg}; }
        .ctf-scope::-webkit-scrollbar-thumb:hover { background: ${P.violet}; }
        .ctg-glitch { position: relative; display: inline-block; }
        .ctg-glitch::before, .ctg-glitch::after {
          content: attr(data-text);
          position: absolute; left: 0; top: 0; width: 100%; pointer-events: none;
        }
        .ctg-glitch::before {
          color: ${P.accent}; transform: translateX(-1.5px);
          animation: ctg-scan 5s linear infinite;
        }
        .ctg-glitch::after {
          color: ${P.violet}; transform: translateX(1.5px);
          animation: ctg-scan 5s linear infinite;
          animation-delay: -0.1s;
        }
        @keyframes ctg-scan {
          0%   { clip-path: inset(-30% 0 100% 0); }
          13%  { clip-path: inset(100% 0 -30% 0); }
          100% { clip-path: inset(100% 0 -30% 0); }
        }
        /* "ghost" word: hollow outline + spectral flicker + slow drift */
        .ctg-ghost {
          color: transparent;
          -webkit-text-stroke: 2px ${P.violet};
          text-stroke: 2px ${P.violet};
          animation: ctg-haunt 6s ease-in-out infinite;
        }
        @keyframes ctg-haunt {
          0%, 100% { opacity: 1; transform: translateX(0); }
          47%      { opacity: 1; transform: translateX(0); }
          49%      { opacity: 0.25; transform: translateX(3px); }
          50%      { opacity: 0.9;  transform: translateX(-2px); }
          52%      { opacity: 0.4;  transform: translateX(1px); }
          54%      { opacity: 1;    transform: translateX(0); }
        }
      `}</style>

      {/* moon glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full"
        style={{
          backgroundColor: "#1C1636",
          boxShadow: `0 0 180px 70px rgba(167,139,250,0.16)`,
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl items-center px-6 py-16 lg:py-20">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {hero(withDetails)}
          <div className="flex flex-col justify-center">{right}</div>
        </div>
      </div>
    </div>
  );

  // ---- field input ----
  const field = (
    f: { id: string; label: string; type: string; required?: boolean },
    n: number,
    showNumber = true,
  ) => (
    <label key={f.id} className="flex flex-col gap-2">
      <span className="flex items-baseline gap-2.5 text-sm font-bold uppercase tracking-wide">
        {showNumber && (
          <span style={{ color: P.violet }}>
            {String(n).padStart(2, "0")}
          </span>
        )}
        <span style={{ color: P.muted }}>
          {f.label}
          {f.required && <span className="ml-1" style={{ color: P.danger }}>*</span>}
        </span>
      </span>
      <input
        type={f.type}
        required={f.required}
        value={answers[f.id] ?? ""}
        onChange={(e) => set(f.id, e.target.value)}
        className="w-full border-0 border-b-2 bg-transparent px-0 py-2 text-base outline-none transition-colors focus:border-[#A3E635]"
        style={{ borderColor: P.line, color: P.text }}
      />
    </label>
  );

  // ---- states ----
  if (!ready || (user && !loaded))
    return shell(
      false,
      <div className="flex flex-col gap-5">
        <div className="h-11 w-full animate-pulse" style={{ backgroundColor: P.lineSoft }} />
        <div className="h-11 w-full animate-pulse" style={{ backgroundColor: P.lineSoft }} />
        <div className="h-11 w-full animate-pulse" style={{ backgroundColor: P.lineSoft }} />
        <div className="h-12 w-40 animate-pulse" style={{ backgroundColor: P.lineSoft }} />
      </div>,
    );

  if (!user)
    return shell(
      false,
      <div
        className="border p-8 backdrop-blur-sm sm:p-10"
        style={{ backgroundColor: P.panel, borderColor: P.line }}
      >
        <p className="mb-6 text-base" style={{ color: P.muted }}>
          Sign in with your Google account to begin registration.
        </p>
        <button
          onClick={signIn}
          className="w-full px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-90"
          style={{ backgroundColor: P.accent, color: P.bg }}
        >
          Sign in with Google
        </button>
      </div>,
    );

  if (!open)
    return shell(
      false,
      <div
        className="border p-8 backdrop-blur-sm sm:p-10"
        style={{ backgroundColor: P.panel, borderColor: P.line }}
      >
        <p className="text-base font-bold" style={{ color: P.danger }}>
          Registrations are closed.
        </p>
      </div>,
    );

  if (registration && !event.allowEdit)
    return shell(
      false,
      <div
        className="border p-8 backdrop-blur-sm sm:p-10"
        style={{ backgroundColor: P.panel, borderColor: P.line }}
      >
        <p className="mb-6 text-base" style={{ color: P.muted }}>
          You&apos;re already registered for this event.
        </p>
        <Link
          href={`/events/${event.slug}`}
          className="inline-block border px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
          style={{ borderColor: P.accent, color: P.accent }}
        >
          Back to event
        </Link>
      </div>,
    );

  return shell(
    true,
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 border p-7 backdrop-blur-sm sm:p-9"
      style={{ backgroundColor: P.panel, borderColor: P.line }}
    >
      {editing && (
        <p
          className="border px-4 py-3 text-sm"
          style={{ borderColor: P.violet, color: P.violet }}
        >
          You&apos;re registered. Update your answers below.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {CORE.map((f, i) => field(f, i + 1))}
      </div>

      <div className="flex flex-col gap-5">
        <div
          className="flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.2em]"
          style={{ color: P.muted }}
        >
          <span style={{ color: P.violet }}>
            {String(CORE.length + 1).padStart(2, "0")}
          </span>
          <span>Team members</span>
          <span className="h-px flex-1" style={{ backgroundColor: P.line }} />
        </div>

        <div className="flex flex-col gap-5">
          {TEAM_GROUPS.map(({ group, fields }) => (
            <div
              key={group}
              className="flex flex-col gap-4 border p-4 sm:p-5"
              style={{ borderColor: P.lineSoft, backgroundColor: P.inputBg }}
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: P.violet }}
              >
                {group}
              </span>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {fields.map((f) => field(f, 0, false))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(emailError || error) && (
        <p className="text-sm font-bold" style={{ color: P.danger }}>
          {emailError || error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: P.accent, color: P.bg }}
      >
        {submitting
          ? editing
            ? "Updating..."
            : "Submitting..."
          : editing
            ? "Update entry"
            : "Register"}
      </button>
    </form>,
  );
}
