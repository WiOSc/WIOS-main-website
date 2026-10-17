import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db } from "@/config/firebase";
import { slugify } from "@/lib/slugify";
import { HttpError } from "@/lib/http";
import type {
  CreateEventInput,
  EventDoc,
  EventImage,
  UpdateEventInput,
} from "./events.schema";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date().toISOString();
}

export function serializeEventDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): EventDoc {
  const images: EventImage[] = Array.isArray(data.images)
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
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),

    // Compatibility fields for registration pages & admin builder
    location: venue,
    startsAt: date,
    endsAt: data.endsAt || undefined,
    registrationDeadline: data.registrationDeadline ? toIso(data.registrationDeadline) : undefined,
    allowEdit: data.allowEdit ?? false,
    status: data.status ?? "open",
    theme: data.theme ?? { accent: "#8D7FB5", layout: "centered" },
    fields: data.fields ?? [],
    createdBy: data.createdBy ?? "",
    bannerUrl: data.bannerUrl ?? (images[0]?.url || undefined),
    isSeeded: data.isSeeded ?? false,
  };
}

export async function listEvents(options?: {
  publicOnly?: boolean;
}): Promise<EventDoc[]> {
  const snapshot = await db.collection("events").get();
  const events = snapshot.docs.map((doc) =>
    serializeEventDoc(doc.id, doc.data()),
  );

  // If publicOnly, filter out drafts
  const filtered = options?.publicOnly
    ? events.filter((e) => e.status !== "draft")
    : events;

  // Sort by date / createdAt descending
  filtered.sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt).getTime();
    const timeB = new Date(b.date || b.createdAt).getTime();
    return Number.isNaN(timeB) || Number.isNaN(timeA) ? 0 : timeB - timeA;
  });

  return filtered;
}

export async function getEventByIdOrSlug(
  idOrSlug: string,
): Promise<EventDoc | null> {
  const trimmed = idOrSlug.trim();
  if (!trimmed) return null;

  // 1. Direct document ID lookup
  const docRef = db.collection("events").doc(trimmed);
  const snap = await docRef.get();
  if (snap.exists) {
    return serializeEventDoc(snap.id, snap.data()!);
  }

  // 2. Query by slug
  const slugQuery = await db
    .collection("events")
    .where("slug", "==", trimmed)
    .limit(1)
    .get();
  if (!slugQuery.empty) {
    const doc = slugQuery.docs[0];
    return serializeEventDoc(doc.id, doc.data());
  }

  // 3. Query by id field
  const idQuery = await db
    .collection("events")
    .where("id", "==", trimmed)
    .limit(1)
    .get();
  if (!idQuery.empty) {
    const doc = idQuery.docs[0];
    return serializeEventDoc(doc.id, doc.data());
  }

  return null;
}

export async function createEvent(
  input: CreateEventInput,
  createdBy?: string,
): Promise<EventDoc> {
  const computedSlug = input.slug?.trim() || slugify(input.title);
  if (!computedSlug) {
    throw new HttpError(400, "Unable to generate a valid slug from event title");
  }

  const existing = await getEventByIdOrSlug(computedSlug);
  if (existing) {
    throw new HttpError(409, `An event with slug "${computedSlug}" already exists`);
  }

  const date = input.date || input.startsAt || "";
  const venue = input.venue || input.location || "";
  const category = input.category || "General";
  const now = FieldValue.serverTimestamp();

  const docData = {
    ...input,
    id: computedSlug,
    slug: computedSlug,
    date,
    venue,
    category,
    location: venue,
    startsAt: date,
    createdBy: createdBy ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = db.collection("events").doc(computedSlug);
  await docRef.set(docData);

  const created = await getEventByIdOrSlug(computedSlug);
  if (!created) {
    throw new HttpError(500, "Failed to retrieve created event");
  }

  return created;
}

export async function updateEvent(
  idOrSlug: string,
  update: UpdateEventInput,
): Promise<EventDoc> {
  const existing = await getEventByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new HttpError(404, `Event not found: ${idOrSlug}`);
  }

  const docRef = db.collection("events").doc(existing.id);

  const patchData: Record<string, unknown> = {
    ...update,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (update.date) {
    patchData.startsAt = update.date;
  } else if (update.startsAt) {
    patchData.date = update.startsAt;
  }

  if (update.venue) {
    patchData.location = update.venue;
  } else if (update.location) {
    patchData.venue = update.location;
  }

  await docRef.set(patchData, { merge: true });

  const updated = await getEventByIdOrSlug(existing.id);
  if (!updated) {
    throw new HttpError(500, "Failed to retrieve updated event");
  }

  return updated;
}

export async function deleteEvent(idOrSlug: string): Promise<void> {
  const existing = await getEventByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new HttpError(404, `Event not found: ${idOrSlug}`);
  }

  const docRef = db.collection("events").doc(existing.id);
  await db.recursiveDelete(docRef);
}
