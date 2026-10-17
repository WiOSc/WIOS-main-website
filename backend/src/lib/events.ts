import { randomUUID } from "node:crypto";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "@/config/firebase";
import { slugify } from "./slugify";
import { HttpError } from "./http";
import type { UserProfile } from "./auth";
import {
  FIELD_TYPES,
  OPTION_TYPES,
  type FormField,
  type EventDoc,
  type Registration,
  type FieldLibraryItem,
} from "./event-types";

export * from "./event-types";

const fieldSchema = z
  .object({
    id: z.string().min(1),
    globalId: z.string().optional(),
    type: z.enum(FIELD_TYPES),
    label: z.string().min(1),
    required: z.boolean(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (f) => !OPTION_TYPES.includes(f.type) || (f.options && f.options.length > 0),
    { message: "options required for select/radio/checkbox" },
  );

const themeSchema = z.object({
  accent: z.string().min(1).default("#8D7FB5"),
  poster: z.string().url().optional(),
  layout: z.enum(["centered", "split"]).default("centered"),
});

const imageSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
  alt: z.string().optional().default(""),
  uploadedAt: z.string().optional().default(() => new Date().toISOString()),
});

export const eventInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().default(""),
  shortDescription: z.string().optional().default(""),
  showOnEvents: z.boolean().default(true),
  date: z.string().optional(),
  venue: z.string().optional(),
  category: z.string().optional().default("General"),
  images: z.array(imageSchema).optional().default([]),
  bannerUrl: z.string().url().optional(),
  location: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  registrationDeadline: z.string().optional(),
  allowEdit: z.boolean().default(false),
  status: z.enum(["draft", "open", "closed"]).default("draft"),
  theme: themeSchema.default({ accent: "#8D7FB5", layout: "centered" }),
  fields: z.array(fieldSchema).default([]),
});

export const eventPatchSchema = eventInputSchema.partial();

export const registrationInputSchema = z.object({
  answers: z.record(z.union([z.string(), z.array(z.string())])).default({}),
});

export type EventInput = z.infer<typeof eventInputSchema>;

// Enforce answers against field schema
export function validateAnswers(
  fields: FormField[],
  answers: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const clean: Record<string, string | string[]> = {};
  for (const field of fields) {
    const value = answers[field.id];
    const empty =
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (empty) {
      if (field.required)
        throw new HttpError(400, `missing required field: ${field.label}`);
      continue;
    }

    if (field.type === "checkbox") {
      const arr = Array.isArray(value) ? value : [value];
      for (const v of arr)
        if (!field.options?.includes(v))
          throw new HttpError(400, `invalid option for ${field.label}`);
      clean[field.id] = arr;
      continue;
    }

    if (Array.isArray(value))
      throw new HttpError(400, `invalid value for ${field.label}`);

    if (OPTION_TYPES.includes(field.type) && !field.options?.includes(value))
      throw new HttpError(400, `invalid option for ${field.label}`);

    clean[field.id] = value;
  }
  return clean;
}

type FieldInput = Omit<FormField, "globalId"> & { globalId?: string };

// Guarantee a globalId on every field
function normalizeFields(fields: FieldInput[]): FormField[] {
  return fields.map((f) => ({ ...f, globalId: f.globalId || randomUUID() }));
}

// Register fields in the catalog (keep admin renames)
async function upsertFieldKeys(fields: FormField[]): Promise<void> {
  const now = Timestamp.now();
  await Promise.all(
    fields.map(async (f) => {
      const ref = db.collection("fieldKeys").doc(f.globalId);
      const snap = await ref.get();
      const label = snap.exists ? (snap.get("label") as string) : f.label;
      await ref.set(
        {
          globalId: f.globalId,
          label,
          type: f.type,
          suggestedId: f.id,
          options: f.options ?? null,
          updatedAt: now,
        },
        { merge: true },
      );
    }),
  );
}

function toIso(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : "";
}

function serializeEvent(id: string, data: FirebaseFirestore.DocumentData): EventDoc {
  const images = Array.isArray(data.images)
    ? data.images.map((img: Record<string, unknown>) => ({
        url: String(img.url ?? ""),
        key: String(img.key ?? ""),
        alt: img.alt != null ? String(img.alt) : "",
        uploadedAt: img.uploadedAt ? toIso(img.uploadedAt) : new Date().toISOString(),
      }))
    : data.bannerUrl
      ? [
          {
            url: String(data.bannerUrl),
            key: "banner",
            alt: String(data.title ?? "Event banner"),
            uploadedAt: toIso(data.createdAt),
          },
        ]
      : [];

  const date = data.date || data.startsAt || "";
  const venue = data.venue || data.location || "";
  const category = data.category || "General";
  const slug = data.slug || id;

  return {
    id: data.id || id,
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    shortDescription: data.shortDescription ?? "",
    showOnEvents: data.showOnEvents ?? true,
    date,
    venue,
    category,
    images,
    bannerUrl: data.bannerUrl ?? (images[0]?.url || undefined),
    location: venue,
    startsAt: date,
    endsAt: data.endsAt || undefined,
    registrationDeadline: data.registrationDeadline ? toIso(data.registrationDeadline) : undefined,
    allowEdit: data.allowEdit ?? false,
    status: data.status ?? "draft",
    theme: data.theme ?? { accent: "#8D7FB5", layout: "centered" },
    fields: data.fields ?? [],
    createdBy: data.createdBy ?? "",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function serializeRegistration(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Registration {
  return {
    uid: id,
    email: data.email ?? "",
    name: data.name ?? null,
    photoURL: data.photoURL ?? null,
    answers: data.answers ?? {},
    createdAt: toIso(data.createdAt),
    updatedAt: data.updatedAt ? toIso(data.updatedAt) : undefined,
  };
}

export async function listEvents(publicOnly: boolean): Promise<EventDoc[]> {
  const snap = await db.collection("events").get();
  const events = snap.docs.map((d) => serializeEvent(d.id, d.data()));
  return publicOnly ? events.filter((e) => e.status !== "draft") : events;
}

export async function getEvent(idOrSlug: string): Promise<EventDoc | null> {
  const trimmed = idOrSlug.trim();
  if (!trimmed) return null;

  // 1. Direct document ID
  const snap = await db.collection("events").doc(trimmed).get();
  if (snap.exists) return serializeEvent(snap.id, snap.data()!);

  // 2. Slug match
  const slugSnap = await db.collection("events").where("slug", "==", trimmed).limit(1).get();
  if (!slugSnap.empty) return serializeEvent(slugSnap.docs[0].id, slugSnap.docs[0].data());

  // 3. ID field match
  const idSnap = await db.collection("events").where("id", "==", trimmed).limit(1).get();
  if (!idSnap.empty) return serializeEvent(idSnap.docs[0].id, idSnap.docs[0].data());

  return null;
}

export async function createEvent(
  input: EventInput,
  uid: string,
): Promise<EventDoc> {
  const slug = input.slug?.trim() || slugify(input.title);
  if (!slug) throw new HttpError(400, "invalid title");

  const ref = db.collection("events").doc(slug);
  if ((await ref.get()).exists)
    throw new HttpError(409, "event with this name already exists");

  const fields = normalizeFields(input.fields);
  const now = Timestamp.now();
  const date = input.date || input.startsAt || "";
  const venue = input.venue || input.location || "";
  const category = input.category || "General";
  const images = input.images || [];

  await ref.set({
    ...input,
    id: slug,
    slug,
    date,
    venue,
    location: venue,
    startsAt: date,
    category,
    images,
    fields,
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  });
  await upsertFieldKeys(fields);
  return (await getEvent(slug))!;
}

export async function updateEvent(
  slug: string,
  patch: Partial<EventInput>,
): Promise<EventDoc> {
  const existing = await getEvent(slug);
  if (!existing) throw new HttpError(404, "event not found");

  const ref = db.collection("events").doc(existing.id || existing.slug);
  const fields = patch.fields ? normalizeFields(patch.fields) : undefined;

  const updateData: Record<string, unknown> = {
    ...patch,
    updatedAt: Timestamp.now(),
  };

  if (patch.date) {
    updateData.date = patch.date;
    updateData.startsAt = patch.date;
  } else if (patch.startsAt) {
    updateData.date = patch.startsAt;
    updateData.startsAt = patch.startsAt;
  }

  if (patch.venue) {
    updateData.venue = patch.venue;
    updateData.location = patch.venue;
  } else if (patch.location) {
    updateData.venue = patch.location;
    updateData.location = patch.location;
  }

  if (fields) {
    updateData.fields = fields;
  }

  await ref.set(updateData, { merge: true });
  if (fields) await upsertFieldKeys(fields);
  return (await getEvent(existing.slug))!;
}

export async function deleteEvent(slug: string): Promise<void> {
  await db.recursiveDelete(db.collection("events").doc(slug));
}

export async function upsertRegistration(
  slug: string,
  user: UserProfile,
  answers: Record<string, string | string[]>,
  allowUpdate = false,
): Promise<{ created: boolean; updated: boolean }> {
  const ref = db.collection("events").doc(slug).collection("registrations").doc(user.uid);
  const existing = await ref.get();

  if (existing.exists) {
    if (!allowUpdate) return { created: false, updated: false };
    await ref.set(
      { answers, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { created: false, updated: true };
  }

  await ref.set({
    uid: user.uid,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
    answers,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { created: true, updated: false };
}

export async function getRegistration(
  slug: string,
  uid: string,
): Promise<Registration | null> {
  const snap = await db
    .collection("events")
    .doc(slug)
    .collection("registrations")
    .doc(uid)
    .get();
  return snap.exists ? serializeRegistration(snap.id, snap.data()!) : null;
}

export async function listRegistrations(slug: string): Promise<Registration[]> {
  const snap = await db
    .collection("events")
    .doc(slug)
    .collection("registrations")
    .get();
  return snap.docs.map((d) => serializeRegistration(d.id, d.data()));
}

export async function deleteRegistration(slug: string, uid: string): Promise<void> {
  await db
    .collection("events")
    .doc(slug)
    .collection("registrations")
    .doc(uid)
    .delete();
}

type Answers = Record<string, string | string[]>;

// Remember answers by globalId for autofill
export async function saveUserFieldValues(
  uid: string,
  fields: FormField[],
  answers: Answers,
): Promise<void> {
  const saved: Answers = {};
  for (const field of fields) {
    const value = answers[field.id];
    if (field.globalId && value != null) saved[field.globalId] = value;
  }
  if (Object.keys(saved).length === 0) return;
  await db.collection("users").doc(uid).set({ savedFields: saved }, { merge: true });
}

export async function getUserSavedFields(uid: string): Promise<Answers> {
  const snap = await db.collection("users").doc(uid).get();
  return (snap.get("savedFields") as Answers | undefined) ?? {};
}

// Map saved values (by globalId) onto this event's local field ids
export function buildPrefill(event: EventDoc, saved: Answers): Answers {
  const prefill: Answers = {};
  for (const field of event.fields) {
    const value = saved[field.globalId];
    if (value != null) prefill[field.id] = value;
  }
  return prefill;
}

export async function listFieldLibrary(): Promise<FieldLibraryItem[]> {
  const [keysSnap, events] = await Promise.all([
    db.collection("fieldKeys").get(),
    listEvents(false),
  ]);

  const usage = new Map<string, number>();
  for (const event of events) {
    const seen = new Set<string>();
    for (const field of event.fields) {
      if (field.globalId && !seen.has(field.globalId)) {
        seen.add(field.globalId);
        usage.set(field.globalId, (usage.get(field.globalId) ?? 0) + 1);
      }
    }
  }

  return keysSnap.docs.map((d) => {
    const data = d.data();
    return {
      globalId: d.id,
      label: data.label ?? "",
      type: data.type,
      options: data.options ?? undefined,
      suggestedId: data.suggestedId ?? "",
      usedIn: usage.get(d.id) ?? 0,
    };
  });
}

export async function renameFieldKey(
  globalId: string,
  label: string,
): Promise<void> {
  const ref = db.collection("fieldKeys").doc(globalId);
  if (!(await ref.get()).exists) throw new HttpError(404, "field key not found");
  await ref.set({ label, updatedAt: Timestamp.now() }, { merge: true });
}
