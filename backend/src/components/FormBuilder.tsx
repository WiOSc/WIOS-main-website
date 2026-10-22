"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FIELD_TYPES,
  FIELD_LABELS,
  OPTION_TYPES,
  type FieldType,
  type FormField,
  type EventDoc,
  type FieldLibraryItem,
} from "@/lib/event-types";
import type { EventImage } from "@/modules/events";
import { currentIdToken } from "@/lib/firebase-client";
import PhotoUploader from "@/components/PhotoUploader";
import PosterUploader from "@/components/PosterUploader";
import { btnGhost, btnPrimary, card, input, sectionTitle } from "@/components/admin-ui";

function newField(): FormField {
  return {
    id: crypto.randomUUID().slice(0, 8),
    globalId: crypto.randomUUID(),
    type: "short_text",
    label: "",
    required: false,
    options: [],
  };
}

// ISO <-> datetime-local input value
function isoToLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function localToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function fieldFromLibrary(item: FieldLibraryItem): FormField {
  return {
    id: item.suggestedId || crypto.randomUUID().slice(0, 8),
    globalId: item.globalId,
    type: item.type,
    label: item.label,
    required: false,
    options: item.options ?? [],
  };
}

export default function FormBuilder({ initial }: { initial?: EventDoc }) {
  const router = useRouter();
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? "",
  );
  const [showOnEvents, setShowOnEvents] = useState(
    initial?.showOnEvents ?? true,
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [accent, setAccent] = useState(initial?.theme?.accent ?? "#8D7FB5");
  const [poster, setPoster] = useState(initial?.theme?.poster ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(isoToLocal(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(isoToLocal(initial?.endsAt));
  const [deadline, setDeadline] = useState(
    isoToLocal(initial?.registrationDeadline),
  );
  const [allowEdit, setAllowEdit] = useState(initial?.allowEdit ?? false);
  const [layout, setLayout] = useState<string>(initial?.theme?.layout ?? "centered");
  const [fields, setFields] = useState<FormField[]>(initial?.fields ?? []);
  const [images, setImages] = useState<EventImage[]>(
    (initial?.images as EventImage[]) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<FieldLibraryItem[] | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState(false);
  // Collapse field rows by default when the form is long
  const [openIds, setOpenIds] = useState<Set<string>>(
    () =>
      new Set(
        (initial?.fields ?? []).length <= 3
          ? (initial?.fields ?? []).map((f) => f.globalId)
          : [],
      ),
  );

  async function copyFields() {
    const text = fields.map((f) => `${f.label || "(untitled)"} - ${f.id}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function openLibrary() {
    setShowLibrary(true);
    if (library) return;
    const token = await currentIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/fields", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setLibrary(data.fields);
  }

  function reuse(item: FieldLibraryItem) {
    setFields((p) => [...p, fieldFromLibrary(item)]);
    setShowLibrary(false);
  }

  function patchField(i: number, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function move(i: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const token = await currentIdToken();
      if (!token) throw new Error("sign in as admin first");
      const primaryPoster = poster || images[0]?.url || undefined;
      const body = {
        title,
        description,
        shortDescription,
        showOnEvents,
        status,
        allowEdit,
        location: location || undefined,
        images,
        startsAt: localToIso(startsAt),
        endsAt: localToIso(endsAt),
        registrationDeadline: localToIso(deadline),
        theme: {
          accent,
          layout,
          ...(primaryPoster ? { poster: primaryPoster } : {}),
        },
        fields: fields.map((f) => ({
          ...f,
          options: OPTION_TYPES.includes(f.type) ? f.options : undefined,
        })),
      };
      const res = await fetch(
        editing ? `/api/events/${initial!.slug}` : "/api/events",
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed to save event");
      router.push(editing ? "/admin/events" : `/events/${data.event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save event");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "flex flex-col gap-1 font-poppins text-xs font-semibold text-black/55";
  const allOpen = fields.length > 0 && fields.every((f) => openIds.has(f.globalId));

  function toggleField(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addField() {
    const f = newField();
    setFields((p) => [...p, f]);
    setOpenIds((p) => new Set(p).add(f.globalId));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/admin/events"
          className="font-poppins text-xs font-bold text-[#5b4b8a] hover:underline"
        >
          ← All events
        </Link>
        <h1 className="font-bebas text-5xl leading-none text-[#1f1b2e]">
          {editing ? (
            <>
              Edit <span className="text-[#5b4b8a]">{initial!.slug}</span>
            </>
          ) : (
            "Create event"
          )}
        </h1>
      </div>

      {/* Basics */}
      <section className={`${card} flex flex-col gap-3 p-5`}>
        <h2 className={sectionTitle}>Basics</h2>
        <input
          className={input}
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={`${input} min-h-28`}
          placeholder="Description (Markdown supported)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className={`${input} min-h-16`}
          placeholder="Short description (shown on the /events timeline — keep it brief)"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
        <input
          className={input}
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </section>

      {/* Media */}
      <section className={`${card} flex flex-col gap-4 p-5`}>
        <h2 className={sectionTitle}>Images & poster</h2>
        <div className="rounded-xl border border-dashed border-[#8D7FB5]/30 bg-[#fbf9ff] p-4">
          <PhotoUploader
            images={images}
            onChange={setImages}
            eventId={initial?.id ?? initial?.slug}
            disabled={saving}
          />
        </div>
        <div className="rounded-xl border border-dashed border-[#8D7FB5]/30 bg-[#fbf9ff] p-4">
          <PosterUploader
            posterUrl={poster}
            onChange={setPoster}
            disabled={saving}
          />
        </div>
      </section>

      {/* Schedule */}
      <section className={`${card} flex flex-col gap-3 p-5`}>
        <h2 className={sectionTitle}>Schedule</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelCls}>
            Event date & time
            <input
              type="datetime-local"
              className={input}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Event end (optional)
            <input
              type="datetime-local"
              className={input}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
          <label className={labelCls}>
            Registration closes
            <input
              type="datetime-local"
              className={input}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Settings */}
      <section className={`${card} flex flex-col gap-4 p-5`}>
        <h2 className={sectionTitle}>Settings</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelCls}>
            Status
            <select
              className={input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className={labelCls}>
            Layout
            <select
              className={input}
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
            >
              <option value="centered">Centered layout</option>
              <option value="split">Split layout</option>
            </select>
          </label>
          <label className={labelCls}>
            Accent colour
            <input
              type="color"
              className="h-[38px] w-full cursor-pointer rounded-xl border border-[#8D7FB5]/20 bg-white p-1"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2.5 font-poppins text-sm">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#8D7FB5]"
              checked={allowEdit}
              onChange={(e) => setAllowEdit(e.target.checked)}
            />
            Let users edit their registration while open
          </label>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#8D7FB5]"
              checked={showOnEvents}
              onChange={(e) => setShowOnEvents(e.target.checked)}
            />
            Show this event on the public /events timeline
          </label>
        </div>
      </section>

      {/* Fields */}
      <section className={`${card} flex flex-col gap-3 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitle}>
            Form fields{" "}
            <span className="font-normal text-black/40">· {fields.length}</span>
          </h2>
          {fields.length > 0 && (
            <div className="flex items-center gap-4 font-poppins text-xs font-bold text-[#5b4b8a]">
              <button
                type="button"
                onClick={() =>
                  setOpenIds(allOpen ? new Set() : new Set(fields.map((f) => f.globalId)))
                }
                className="hover:underline"
              >
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
              <button type="button" onClick={copyFields} className="hover:underline">
                {copied ? "Copied!" : "Copy field ids"}
              </button>
            </div>
          )}
        </div>

        {fields.length === 0 && (
          <p className="rounded-xl bg-[#fbf9ff] px-4 py-6 text-center font-poppins text-sm text-black/40">
            No fields yet — add one below.
          </p>
        )}

        {fields.map((field, i) => {
          const isOpen = openIds.has(field.globalId);
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-[#8D7FB5]/20 bg-white"
            >
              <div className="flex items-center gap-2 bg-[#fbf9ff] px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleField(field.globalId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#8D7FB5]/15 font-poppins text-[11px] font-bold text-[#4a3c73]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-poppins text-sm font-semibold text-[#1f1b2e]">
                    {field.label || <span className="text-black/35">Untitled question</span>}
                  </span>
                  <span className="hidden rounded-full bg-[#a7baef]/25 px-2 py-0.5 font-poppins text-[11px] font-semibold text-[#4a5a99] sm:inline">
                    {FIELD_LABELS[field.type]}
                  </span>
                  {field.required && (
                    <span className="font-poppins text-[11px] font-bold text-red-400">
                      required
                    </span>
                  )}
                  <span className="text-xs text-black/40">{isOpen ? "▴" : "▾"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                  className="rounded-md px-1.5 text-black/45 hover:bg-[#8D7FB5]/10 disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === fields.length - 1}
                  title="Move down"
                  className="rounded-md px-1.5 text-black/45 hover:bg-[#8D7FB5]/10 disabled:opacity-25"
                >
                  ↓
                </button>
              </div>

              {isOpen && (
                <div className="flex flex-col gap-2.5 border-t border-[#8D7FB5]/10 p-4">
                  <div className="flex flex-wrap gap-2">
                    <input
                      className={`${input} min-w-0 flex-1`}
                      placeholder="Question label"
                      value={field.label}
                      onChange={(e) => patchField(i, { label: e.target.value })}
                    />
                    <select
                      className={`${input} w-auto`}
                      value={field.type}
                      onChange={(e) =>
                        patchField(i, { type: e.target.value as FieldType })
                      }
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {FIELD_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    className={`${input} font-mono text-xs`}
                    placeholder="field id (used in code / export)"
                    value={field.id}
                    onChange={(e) =>
                      patchField(i, { id: e.target.value.trim().replace(/\s+/g, "_") })
                    }
                  />
                  <p className="font-mono text-[10px] text-black/30">
                    global: {field.globalId}
                  </p>

                  {OPTION_TYPES.includes(field.type) && (
                    <input
                      className={input}
                      placeholder="Options (comma separated)"
                      value={field.options?.join(", ") ?? ""}
                      onChange={(e) =>
                        patchField(i, {
                          options: e.target.value
                            .split(",")
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  )}

                  <div className="flex items-center gap-4 font-poppins text-xs">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        className="accent-[#8D7FB5]"
                        checked={field.required}
                        onChange={(e) => patchField(i, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => setFields((p) => p.filter((_, idx) => idx !== i))}
                      className="ml-auto rounded-full px-2 py-1 font-bold text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={addField} className={btnGhost}>
            + Add field
          </button>
          <button
            type="button"
            onClick={openLibrary}
            className={`${btnGhost} text-[#5b4b8a]`}
          >
            Reuse earlier field
          </button>
        </div>

        {showLibrary && (
          <div className="flex flex-col gap-2 rounded-xl border border-[#8D7FB5]/20 bg-[#fbf9ff] p-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitle}>Fields from earlier events</h3>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="font-poppins text-xs font-bold text-black/40 hover:text-black/70"
              >
                Close
              </button>
            </div>
            {!library && (
              <p className="font-poppins text-xs text-black/40">Loading...</p>
            )}
            {library?.length === 0 && (
              <p className="font-poppins text-xs text-black/40">No fields yet.</p>
            )}
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {library?.map((item) => (
                <button
                  key={item.globalId}
                  type="button"
                  onClick={() => reuse(item)}
                  className="flex items-center justify-between rounded-lg border border-[#8D7FB5]/15 bg-white px-3 py-2 text-left transition hover:border-[#8D7FB5]/40 hover:bg-[#8D7FB5]/5"
                >
                  <span className="font-poppins text-sm text-[#1f1b2e]">
                    {item.label}
                    <span className="ml-2 text-xs text-black/40">
                      {FIELD_LABELS[item.type]}
                    </span>
                  </span>
                  <span className="font-poppins text-xs text-black/40">
                    used in {item.usedIn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-[#8D7FB5]/20 bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(141,127,181,0.25)] backdrop-blur">
        <button onClick={save} disabled={saving || !title} className={btnPrimary}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create event"}
        </button>
        <Link href="/admin/events" className={btnGhost}>
          Cancel
        </Link>
        {error && (
          <p className="font-poppins text-sm text-red-500">{error}</p>
        )}
        {!title && !error && (
          <p className="font-poppins text-xs text-black/40">Add a title to save.</p>
        )}
      </div>
    </div>
  );
}
