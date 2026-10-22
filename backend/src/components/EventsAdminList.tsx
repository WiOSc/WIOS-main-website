"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EventDoc, EventStatus } from "@/lib/event-types";
import { currentIdToken, onAuthChange } from "@/lib/firebase-client";
import { Skeleton } from "./Skeleton";
import { btnGhost, btnPrimary, card, hint, input } from "./admin-ui";

const STATUSES: EventStatus[] = ["draft", "open", "closed"];
const PAGE = 6;
const CHIPS_COLLAPSED = 6;

const PILL: Record<EventStatus, string> = {
  open: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  closed: "bg-slate-200 text-slate-600",
};

type Filter = "all" | EventStatus;

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EventCard({
  e,
  busy,
  onStatus,
  onDelete,
}: {
  e: EventDoc;
  busy: boolean;
  onStatus: (s: EventStatus) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [allChips, setAllChips] = useState(false);
  const thumb = e.theme?.poster ?? e.images?.[0]?.url ?? e.bannerUrl;
  const accent = e.theme?.accent ?? "#8D7FB5";
  const date = fmtDate(e.startsAt);
  const chips = allChips ? e.fields : e.fields.slice(0, CHIPS_COLLAPSED);

  return (
    <article className={`${card} flex flex-col overflow-hidden`}>
      <div
        className="relative h-32 w-full"
        style={{ background: thumb ? accent : "#ece6f7" }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-bebas text-6xl text-[#5b4b8a]/60">
            {e.title.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 font-poppins text-[11px] font-bold capitalize ${PILL[e.status]}`}
        >
          {e.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-poppins text-base font-bold text-[#1f1b2e]">
            {e.title}
          </h3>
          <p className={hint}>
            /{e.slug}
            {date && ` · ${date}`} · {e.fields.length} field
            {e.fields.length === 1 ? "" : "s"}
          </p>
        </div>

        {(e.shortDescription || e.description) && (
          <p
            className={`font-poppins text-sm text-black/60 ${open ? "whitespace-pre-line" : "line-clamp-2"}`}
          >
            {open ? e.description || e.shortDescription : e.shortDescription || e.description}
          </p>
        )}

        {open && (
          <div className="flex flex-col gap-2 border-t border-[#8D7FB5]/10 pt-3">
            {e.location && <p className={hint}>📍 {e.location}</p>}
            {e.registrationDeadline && (
              <p className={hint}>
                ⏰ Registration closes {fmtDate(e.registrationDeadline)}
              </p>
            )}
            {e.fields.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((f, i) => (
                  <span
                    key={`${f.id}-${i}`}
                    className="rounded-full bg-[#8D7FB5]/10 px-2.5 py-0.5 font-poppins text-[11px] text-[#4a3c73]"
                  >
                    {f.label || f.id}
                    {f.required && <span className="text-red-400"> *</span>}
                  </span>
                ))}
                {e.fields.length > CHIPS_COLLAPSED && (
                  <button
                    onClick={() => setAllChips((v) => !v)}
                    className="rounded-full px-2 py-0.5 font-poppins text-[11px] font-bold text-[#5b4b8a] hover:underline"
                  >
                    {allChips ? "show less" : `+${e.fields.length - CHIPS_COLLAPSED} more`}
                  </button>
                )}
              </div>
            ) : (
              <p className={hint}>No form fields.</p>
            )}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="self-start font-poppins text-xs font-bold text-[#5b4b8a] hover:underline"
        >
          {open ? "Show less ▴" : "Show more ▾"}
        </button>

        <div className="mt-auto flex flex-col gap-3 border-t border-[#8D7FB5]/10 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/admin/events/${e.slug}/edit`}
              className="inline-flex items-center justify-center rounded-xl bg-[#5b4b8a] px-4 py-3 font-poppins text-sm font-bold text-white transition hover:bg-[#4a3c73]"
            >
              Edit
            </Link>
            <Link
              href={`/events/${e.slug}/register/users`}
              className="inline-flex items-center justify-center rounded-xl bg-[#ece6f7] px-4 py-3 font-poppins text-sm font-bold text-[#4a3c73] transition hover:bg-[#ddd3f0]"
            >
              Registrations
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 font-poppins text-xs text-black/50">
              Status
              <select
                className="rounded-lg border border-[#8D7FB5]/25 bg-white px-3 py-1.5 font-poppins text-sm font-semibold capitalize outline-none focus:border-[#8D7FB5]"
                value={e.status}
                disabled={busy}
                onChange={(ev) => onStatus(ev.target.value as EventStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={onDelete}
              disabled={busy}
              title="Delete event"
              className="rounded-lg px-3 py-1.5 font-poppins text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EventsAdminList() {
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);

  const load = useCallback(async () => {
    setError(null);
    const token = await currentIdToken();
    if (!token) {
      setError("Sign in as admin to manage events.");
      return;
    }
    const res = await fetch("/api/admin/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "failed to load");
      return;
    }
    setEvents(data.events);
  }, []);

  useEffect(() => onAuthChange(() => void load()), [load]);

  async function setStatus(slug: string, status: EventStatus) {
    setBusy(slug);
    const token = await currentIdToken();
    await fetch(`/api/events/${slug}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    void load();
  }

  async function remove(slug: string) {
    if (!confirm(`Delete "${slug}" and all its registrations?`)) return;
    setBusy(slug);
    const token = await currentIdToken();
    await fetch(`/api/events/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusy(null);
    void load();
  }

  const counts = useMemo(() => {
    const c = { all: 0, open: 0, draft: 0, closed: 0 };
    for (const e of events ?? []) {
      c.all++;
      c[e.status]++;
    }
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events ?? []).filter(
      (e) =>
        (filter === "all" || e.status === filter) &&
        (!q || e.title.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q)),
    );
  }, [events, query, filter]);

  const visible = filtered.slice(0, limit);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "draft", label: "Draft" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-bebas text-5xl leading-none text-[#1f1b2e]">
            Manage events
          </h1>
          <p className={`${hint} mt-1`}>
            Create, publish and review everything happening at WIOS.
          </p>
        </div>
        <Link href="/admin/events/new" className={btnPrimary}>
          + New event
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-sm text-red-600">
          {error}
        </p>
      )}

      {events && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", n: counts.all, dot: "bg-[#8D7FB5]" },
            { label: "Open", n: counts.open, dot: "bg-emerald-400" },
            { label: "Draft", n: counts.draft, dot: "bg-amber-400" },
            { label: "Closed", n: counts.closed, dot: "bg-slate-400" },
          ].map((s) => (
            <div key={s.label} className={`${card} flex items-center gap-3 px-4 py-3`}>
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              <div>
                <p className="font-bebas text-3xl leading-none text-[#1f1b2e]">{s.n}</p>
                <p className={hint}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {events && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={`${input} max-w-xs`}
            placeholder="Search events…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
          />
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-[0_1px_6px_rgba(141,127,181,0.12)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setFilter(t.key);
                  setLimit(PAGE);
                }}
                className={`rounded-full px-3.5 py-1.5 font-poppins text-xs font-bold transition ${
                  filter === t.key
                    ? "bg-[#5b4b8a] text-white"
                    : "text-black/55 hover:bg-[#8D7FB5]/10"
                }`}
              >
                {t.label} <span className="opacity-70">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!events && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {events && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <EventCard
              key={e.slug}
              e={e}
              busy={busy === e.slug}
              onStatus={(s) => setStatus(e.slug, s)}
              onDelete={() => remove(e.slug)}
            />
          ))}
        </div>
      )}

      {events && filtered.length === 0 && (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="font-poppins text-sm text-black/50">
            {events.length === 0 ? "No events yet." : "No events match your search."}
          </p>
        </div>
      )}

      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + PAGE)} className={`${btnGhost} self-center`}>
          Load more ({filtered.length - limit} left)
        </button>
      )}
    </section>
  );
}
