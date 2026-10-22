"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "./admin-ui";
import type { EventDoc, Registration } from "@/lib/event-types";
import { currentIdToken, onAuthChange } from "@/lib/firebase-client";
import { SkeletonRows } from "./Skeleton";
import SheetView from "./SheetView";

function fmtRegistered(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function RegistrationsTable({ event }: { event: EventDoc }) {
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnvAdmin, setIsEnvAdmin] = useState(false);

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
    // Newest registrations first; entries without a timestamp go last
    const time = (r: Registration) => Date.parse(r.createdAt) || 0;
    setRows([...(data.registrations as Registration[])].sort((a, b) => time(b) - time(a)));

    // Delete button is only offered to ADMIN_EMAILS (env) admins
    const me = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
    if (me.ok) setIsEnvAdmin(!!(await me.json()).isEnvAdmin);
  }, [event.slug]);

  useEffect(() => onAuthChange(() => void load()), [load]);

  async function removeRow(index: number) {
    const reg = rows?.[index];
    if (!reg) return;
    if (!confirm(`Delete the registration from ${reg.name ?? reg.email} (${reg.email})?`)) return;
    const token = await currentIdToken();
    if (!token) return;
    const res = await fetch(
      `/api/events/${event.slug}/registrations/${encodeURIComponent(reg.uid)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "failed to delete");
      return;
    }
    setRows((prev) => prev?.filter((r) => r.uid !== reg.uid) ?? prev);
  }

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
          onDeleteRow={isEnvAdmin ? removeRow : undefined}
          columns={["Registered", "Name", "Email", ...event.fields.map((f) => f.label)]}
          rows={rows.map((r) => [
            fmtRegistered(r.createdAt),
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
