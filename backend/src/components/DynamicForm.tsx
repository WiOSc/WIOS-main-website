"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type EventDoc, isRegistrationOpen } from "@/lib/event-types";
import { useRegister } from "@/lib/useRegister";
import FieldRenderer from "./fields/FieldRenderer";
import Markdown from "./Markdown";
import { Skeleton } from "./Skeleton";

type Answers = Record<string, string | string[]>;

export default function DynamicForm({ event }: { event: EventDoc }) {
  const accent = event.theme?.accent ?? "#8D7FB5";
  const split = event.theme?.layout === "split";
  const banner = event.theme?.poster ?? event.bannerUrl;
  const deadline = event.registrationDeadline
    ? new Date(event.registrationDeadline).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const { user, ready, submitting, error, signIn, submit, prefill, registration, loaded } =
    useRegister(event.slug);
  const [answers, setAnswers] = useState<Answers>({});

  // Seed with existing registration (edit) or remembered answers
  useEffect(() => {
    if (registration) {
      setAnswers(registration.answers);
    } else if (Object.keys(prefill).length > 0) {
      setAnswers((prev) => ({ ...prefill, ...prev }));
    }
  }, [prefill, registration]);

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(answers);
  }

  const editing = !!registration && event.allowEdit;

  const header = (
    <div>
      <h1 className="font-bebas text-4xl leading-none text-black">
        {event.title}
      </h1>
      {event.description && (
        <div className="mt-2 text-sm">
          <Markdown>{event.description}</Markdown>
        </div>
      )}
      {deadline && (
        <p className="mt-2 font-poppins text-xs text-black/50">
          Registration closes {deadline}
        </p>
      )}
    </div>
  );

  const form = (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      {header}

      {editing && (
        <p className="rounded-lg bg-[#8D7FB5]/10 px-3 py-2 font-poppins text-xs text-[#8D7FB5]">
          You already registered. Update your answers below.
        </p>
      )}

      {event.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={answers[field.id] ?? (field.type === "checkbox" ? [] : "")}
          onChange={(v) => setAnswer(field.id, v)}
          accent={accent}
        />
      ))}

      {error && <p className="font-poppins text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full px-6 py-3 font-poppins text-sm font-bold text-white disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {submitting
          ? "Submitting…"
          : editing
            ? "Update registration"
            : "Submit registration"}
      </button>
    </form>
  );

  const signInGate = (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="font-bebas text-4xl text-black">{event.title}</h1>
      <p className="font-poppins text-sm text-black/60">
        Sign in with Google to register.
      </p>
      <button
        onClick={signIn}
        className="rounded-full px-6 py-3 font-poppins text-sm font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        Sign in with Google
      </button>
    </div>
  );

  const alreadyRegistered = (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="font-bebas text-4xl text-black">{event.title}</h1>
      <p className="font-poppins text-sm text-black/60">
        You&apos;re already registered for this event.
      </p>
      <Link
        href={`/events/${event.slug}`}
        className="rounded-full px-6 py-3 font-poppins text-sm font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        Back to event
      </Link>
    </div>
  );

  const closed = (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="font-bebas text-4xl text-black">{event.title}</h1>
      <p className="font-poppins text-sm font-bold text-black/40">
        Registrations are closed.
      </p>
    </div>
  );

  const loading = (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-12 w-40 rounded-full" />
    </div>
  );

  let content: React.ReactNode;
  if (!ready) content = loading;
  else if (!user) content = signInGate;
  else if (!loaded) content = loading;
  else if (!isRegistrationOpen(event)) content = closed;
  else if (registration && !event.allowEdit) content = alreadyRegistered;
  else content = form;

  if (split && banner) {
    return (
      <main className="flex min-h-screen flex-col lg:flex-row">
        <div
          className="h-48 w-full bg-cover bg-center lg:h-auto lg:w-1/2"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md">{content}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        {banner && (
          <div
            className="mb-8 h-40 w-full rounded-2xl bg-cover bg-center"
            style={{ backgroundImage: `url(${banner})` }}
          />
        )}
        {content}
      </div>
    </main>
  );
}
