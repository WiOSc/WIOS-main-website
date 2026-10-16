"use client";

import { useState } from "react";
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

const input =
  "rounded-lg border border-black/10 px-3 py-2 font-poppins text-sm outline-none focus:border-[#8D7FB5]";

export default function FormBuilder({ initial }: { initial?: EventDoc }) {
  const router = useRouter();
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [accent, setAccent] = useState(initial?.theme?.accent ?? "#8D7FB5");
  const [poster, setPoster] = useState(initial?.theme?.poster ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(isoToLocal(initial?.startsAt));
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
        status,
        allowEdit,
        location: location || undefined,
        images,
        startsAt: localToIso(startsAt),
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
      <h1 className="font-bebas text-4xl text-black">
        {editing ? `Edit ${initial!.slug}` : "Create event"}
      </h1>

      <div className="flex flex-col gap-3">
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
        <input
          className={input}
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        {/* Event Images (UploadThing) */}
        <div className="rounded-xl border border-black/10 bg-black/[0.01] p-4">
          <PhotoUploader
            images={images}
            onChange={setImages}
            eventId={initial?.id ?? initial?.slug}
            disabled={saving}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 font-poppins text-xs text-black/60">
            Event date & time
            <input
              type="datetime-local"
              className={input}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 font-poppins text-xs text-black/60">
            Registration closes
            <input
              type="datetime-local"
              className={input}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 font-poppins text-sm">
          <input
            type="checkbox"
            checked={allowEdit}
            onChange={(e) => setAllowEdit(e.target.checked)}
          />
          Let users edit their registration while open
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            className={input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className={input}
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
          >
            <option value="centered">Centered layout</option>
            <option value="split">Split layout</option>
          </select>
          <label className="flex items-center gap-2 font-poppins text-sm">
            Accent
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
          </label>
        </div>

        <div className="rounded-xl border border-black/10 bg-black/[0.01] p-4">
          <PosterUploader
            posterUrl={poster}
            onChange={setPoster}
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-poppins text-sm font-bold text-black/70">Fields</h2>
          {fields.length > 0 && (
            <button
              type="button"
              onClick={copyFields}
              className="font-poppins text-xs font-bold text-[#8D7FB5]"
            >
              {copied ? "Copied!" : "Copy field ids"}
            </button>
          )}
        </div>
        {fields.map((field, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-black/10 p-4">
            <div className="flex gap-2">
              <input
                className={`${input} flex-1`}
                placeholder="Question label"
                value={field.label}
                onChange={(e) => patchField(i, { label: e.target.value })}
              />
              <select
                className={input}
                value={field.type}
                onChange={(e) => patchField(i, { type: e.target.value as FieldType })}
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
                  checked={field.required}
                  onChange={(e) => patchField(i, { required: e.target.checked })}
                />
                Required
              </label>
              <button type="button" onClick={() => move(i, -1)} className="text-black/50">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} className="text-black/50">
                ↓
              </button>
              <button
                type="button"
                onClick={() => setFields((p) => p.filter((_, idx) => idx !== i))}
                className="ml-auto text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFields((p) => [...p, newField()])}
            className="rounded-full border border-black/15 px-4 py-2 font-poppins text-sm font-bold text-black"
          >
            + Add field
          </button>
          <button
            type="button"
            onClick={openLibrary}
            className="rounded-full border border-black/15 px-4 py-2 font-poppins text-sm font-bold text-[#8D7FB5]"
          >
            Reuse earlier field
          </button>
        </div>

        {showLibrary && (
          <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins text-sm font-bold text-black/70">
                Fields from earlier events
              </h3>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="font-poppins text-xs text-black/40"
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
            {library?.map((item) => (
              <button
                key={item.globalId}
                type="button"
                onClick={() => reuse(item)}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-left hover:bg-black/5"
              >
                <span className="font-poppins text-sm text-black">
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
        )}
      </div>

      {error && <p className="font-poppins text-sm text-red-500">{error}</p>}

      <button
        onClick={save}
        disabled={saving || !title}
        className="self-start rounded-full bg-[#8D7FB5] px-6 py-3 font-poppins text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : editing ? "Save changes" : "Create event"}
      </button>
    </div>
  );
}
