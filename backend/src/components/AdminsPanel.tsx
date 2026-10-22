"use client";

import { useCallback, useEffect, useState } from "react";
import { currentIdToken, onAuthChange } from "@/lib/firebase-client";
import { Skeleton } from "./Skeleton";
import { btnPrimary, card, hint, input } from "./admin-ui";

type AdminEntry = { email: string; source: "env" | "added" };

const COLLAPSED = 4;

export default function AdminsPanel() {
  const [admins, setAdmins] = useState<AdminEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const token = await currentIdToken();
    if (!token) {
      setError("Sign in as admin to manage admins.");
      return;
    }
    const res = await fetch("/api/admin/admins", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "failed to load");
      return;
    }
    setAdmins(data.admins);
  }, []);

  useEffect(() => onAuthChange(() => void load()), [load]);

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const token = await currentIdToken();
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "failed to add");
      return;
    }
    setEmail("");
    void load();
  }

  async function remove(target: string) {
    if (!confirm(`Remove admin ${target}?`)) return;
    const token = await currentIdToken();
    const res = await fetch(`/api/admin/admins/${encodeURIComponent(target)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "failed to remove");
      return;
    }
    void load();
  }

  const shown = admins ? (showAll ? admins : admins.slice(0, COLLAPSED)) : [];

  return (
    <section id="admins" className="mt-16 scroll-mt-24">
      <div className={`${card} flex flex-col gap-5 p-6`}>
        <div>
          <h2 className="font-bebas text-3xl text-[#1f1b2e]">
            Admins {admins && <span className="text-[#5b4b8a]">· {admins.length}</span>}
          </h2>
          <p className={hint}>
            These emails get admin access on sign-in. Env admins cannot be removed here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            placeholder="new-admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void add()}
            className={`${input} min-w-0 flex-1`}
          />
          <button onClick={add} disabled={busy} className={btnPrimary}>
            {busy ? "Adding…" : "Add admin"}
          </button>
        </div>

        {error && <p className="font-poppins text-sm text-red-500">{error}</p>}

        {!admins && !error && <Skeleton className="h-12 w-full" />}

        <div className="grid gap-2 sm:grid-cols-2">
          {shown.map((a) => (
            <div
              key={a.email}
              className="flex items-center gap-3 rounded-xl border border-[#8D7FB5]/15 bg-[#fbf9ff] px-3 py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ece6f7] font-poppins text-xs font-bold uppercase text-[#4a3c73]">
                {a.email.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 truncate font-poppins text-sm text-[#1f1b2e]" title={a.email}>
                {a.email}
              </span>
              <span className="rounded-full bg-[#8D7FB5]/10 px-2 py-0.5 font-poppins text-[11px] font-semibold text-[#6b5c99]">
                {a.source}
              </span>
              {a.source === "added" && (
                <button
                  onClick={() => remove(a.email)}
                  className="font-poppins text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {admins && admins.length > COLLAPSED && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="self-start font-poppins text-xs font-bold text-[#5b4b8a] hover:underline"
          >
            {showAll ? "Show less ▴" : `Show all ${admins.length} ▾`}
          </button>
        )}
      </div>
    </section>
  );
}
