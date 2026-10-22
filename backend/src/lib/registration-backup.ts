import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/config/firebase";

// Hidden copy of every registration. Lives in its own top-level collection so
// deleting a registration or an event never touches it. No UI reads this;
// access is only through /api/admin/backups, which requires an ADMIN_EMAILS (env) admin.
const COLLECTION = "registrationBackups";

function backupRef(slug: string, uid: string) {
  return db.collection(COLLECTION).doc(`${slug}__${uid}`);
}

interface BackupInput {
  slug: string;
  uid: string;
  email: string;
  name: string | null;
  photoURL: string | null;
  answers: Record<string, string | string[]>;
}

// Best-effort: a backup failure must never block a user's registration
export async function backupRegistration(input: BackupInput): Promise<void> {
  try {
    const ref = backupRef(input.slug, input.uid);
    const existing = await ref.get();
    await ref.set(
      {
        slug: input.slug,
        uid: input.uid,
        email: input.email,
        name: input.name,
        photoURL: input.photoURL,
        answers: input.answers,
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
        // re-registering after a delete makes it live again
        deletedAt: FieldValue.delete(),
      },
      { merge: true },
    );
  } catch (err) {
    console.error("registration backup failed:", err);
  }
}

// Mark when the live copy was removed; the backup itself is kept
export async function markBackupDeleted(slug: string, uid: string): Promise<void> {
  try {
    await backupRef(slug, uid).set(
      { deletedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.error("backup delete-mark failed:", err);
  }
}

export async function markEventBackupsDeleted(slug: string): Promise<void> {
  try {
    const snap = await db.collection(COLLECTION).where("slug", "==", slug).get();
    const batch = db.batch();
    for (const d of snap.docs) {
      batch.set(d.ref, { deletedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error("event backup delete-mark failed:", err);
  }
}

function iso(v: unknown): string | null {
  const t = v as { toDate?: () => Date } | null | undefined;
  return t?.toDate ? t.toDate().toISOString() : null;
}

export async function listBackups(slug?: string) {
  const col = db.collection(COLLECTION);
  const snap = await (slug ? col.where("slug", "==", slug) : col).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      slug: x.slug as string,
      uid: x.uid as string,
      email: x.email as string,
      name: (x.name ?? null) as string | null,
      answers: (x.answers ?? {}) as Record<string, string | string[]>,
      createdAt: iso(x.createdAt),
      updatedAt: iso(x.updatedAt),
      deletedAt: iso(x.deletedAt),
    };
  });
}

// Permanently delete backups for an event (or a single registration)
export async function purgeBackups(slug: string, uid?: string): Promise<number> {
  if (uid) {
    await backupRef(slug, uid).delete();
    return 1;
  }
  const snap = await db.collection(COLLECTION).where("slug", "==", slug).get();
  const batch = db.batch();
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit();
  return snap.size;
}
