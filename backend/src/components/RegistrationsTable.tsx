"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "./admin-ui";
import type { EventDoc, Registration } from "@/lib/event-types";
import { currentIdToken, onAuthChange } from "@/lib/firebase-client";
import { SkeletonRows } from "./Skeleton";
import SheetView from "./SheetView";

export default function RegistrationsTable({ event }: { event: EventDoc }) {
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await currentIdToken();
    if (!token) {
      setError("Sign in as admin to view registrations.");
      return;
    }
    const res = await fetch(`/api/events/${event.slug}/registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "failed to load");
      return;
    }
    setRows(data.registrations);
  }, [event.slug]);

  useEffect(() => onAuthChange(() => void load()), [load]);

  async function exportXlsx() {
    const token = await currentIdToken();
    if (!token) return;
    const res = await fetch(`/api/events/${event.slug}/registrations/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}-registrations.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/events"
            className="font-poppins text-xs font-bold text-[#5b4b8a] hover:underline"
          >
            ← All events
          </Link>
          <h1 className="font-bebas text-5xl leading-none text-[#1f1b2e]">
            {event.title} <span className="text-[#5b4b8a]">registrations</span>
          </h1>
          {rows && (
            <p className="mt-1 font-poppins text-xs text-black/45">
              {rows.length} registration{rows.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button onClick={exportXlsx} className={btnPrimary}>
          Export .xlsx
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-sm text-red-600">
          {error}
        </p>
      )}

      {!rows && !error && <SkeletonRows rows={5} />}

      {rows && (
        <SheetView
          columns={["Name", "Email", ...event.fields.map((f) => f.label)]}
          rows={rows.map((r) => [
            r.name ?? "-",
            r.email,
            ...event.fields.map((f) => {
              const v = r.answers[f.id];
              return Array.isArray(v) ? v.join(", ") : (v ?? "");
            }),
          ])}
        />
      )}
    </div>
  );
}
