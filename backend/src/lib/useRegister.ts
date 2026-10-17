"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import type { Registration } from "@/lib/event-types";
import {
  currentIdToken,
  onAuthChange,
  signInWithGoogle,
} from "@/lib/firebase-client";

type Answers = Record<string, string | string[]>;

// Auth + submit plumbing for custom register pages
export function useRegister(slug: string) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Answers>({});
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(
    () =>
      onAuthChange((u) => {
        setUser(u);
        setReady(true);
      }),
    [],
  );

  // Warm the post-submit destinations so they render instantly on redirect.
  useEffect(() => {
    router.prefetch(`/events/${slug}/register/success`);
    router.prefetch(`/events/${slug}/register/already-registered`);
  }, [router, slug]);

  // Load autofill + any existing registration
  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    let active = true;
    setLoaded(false);
    (async () => {
      const token = await currentIdToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [pre, reg] = await Promise.all([
        fetch(`/api/events/${slug}/prefill`, { headers }).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch(`/api/events/${slug}/registration`, { headers }).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);
      if (!active) return;
      if (pre) setPrefill(pre.prefill ?? {});
      setRegistration(reg?.registration ?? null);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [user, slug]);

  async function signIn() {
    try {
      await signInWithGoogle();
    } catch {
      /* popup closed */
    }
  }

  async function submit(answers: Answers) {
    setSubmitting(true);
    setError(null);
    try {
      const token = await currentIdToken();
      if (!token) throw new Error("please sign in first");
      const res = await fetch(`/api/events/${slug}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      if (res.status === 409) {
        router.push(`/events/${slug}/register/already-registered`);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "registration failed");
      router.push(`/events/${slug}/register/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    user,
    ready,
    submitting,
    error,
    signIn,
    submit,
    prefill,
    registration,
    loaded,
  };
}
