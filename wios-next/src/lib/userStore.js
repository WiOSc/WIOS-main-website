import { FieldValue } from "firebase-admin/firestore";
import { getAuth, getDb } from "./firebase.js";
import { httpError } from "./http.js";

/**
 * Firestore collection "users", one document per person, keyed by lowercase email:
 *   users/alice@example.com -> { email, role: "admin" | "user", uid, createdAt, ... }
 * Keying by email lets you seed the first admin before they have ever signed in.
 */
const users = () => getDb().collection("users");

export const ROLES = ["admin", "user"];

const normalize = (email) => email.trim().toLowerCase();

/**
 * Called on every authenticated request.
 * - Known email: returns the stored role.
 * - New email: creates the document with role "user" (everyone after the seeded admin).
 */
export async function getOrCreateUser(email, uid) {
  const id = normalize(email);
  const ref = users().doc(id);
  let snap = await ref.get();

  if (!snap.exists) {
    try {
      await ref.create({ email: id, role: "user", uid, createdAt: FieldValue.serverTimestamp() });
    } catch (err) {
      if (err.code !== 6) throw err; // 6 = ALREADY_EXISTS (two requests raced); that's fine
    }
    snap = await ref.get();
  } else if (snap.data().uid !== uid) {
    // Seeded admins have no uid yet; link it on their first login.
    await ref.update({ uid });
    snap = await ref.get();
  }

  const { role } = snap.data();
  return { email: id, role };
}

/**
 * Called by POST /api/auth/google right after a Google sign-in.
 * Saves profile details on users/{email} and stamps the login time.
 * Never touches "role", so seeded admins stay admins.
 */
export async function recordLogin(email, { uid, name, picture, provider }) {
  await users().doc(normalize(email)).set(
    {
      uid,
      displayName: name ?? null,
      photoURL: picture ?? null,
      provider: provider ?? null,
      lastLoginAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Create users/{email} with role "user" if it doesn't exist yet. Returns true if created. */
async function createIfMissing(email, uid) {
  try {
    await users().doc(normalize(email)).create({
      email: normalize(email),
      role: "user",
      uid: uid ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    if (err.code === 6) return false; // ALREADY_EXISTS
    throw err;
  }
}

/**
 * Copies every account from Firebase Authentication into Firestore as a
 * "user" (existing documents, including admins, are left untouched).
 * This is why people you add in the Firebase console show up automatically.
 */
export async function syncFromAuth() {
  let created = 0;
  let pageToken;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const u of page.users) {
      if (u.email && (await createIfMissing(u.email, u.uid))) created++;
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return created;
}

export async function listUsers() {
  const snap = await users().get();
  return snap.docs
    .map((d) => {
      const u = d.data();
      return {
        email: u.email,
        role: u.role,
        createdAt: u.createdAt?.toDate?.().toISOString() ?? null,
      };
    })
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

/**
 * Change someone's role. Runs in a transaction so two admins can't
 * simultaneously demote each other and leave zero admins.
 */
export async function setRole(targetEmail, role, actorEmail, { allowCreate = false } = {}) {
  const ref = users().doc(normalize(targetEmail));

  // If they exist in Firebase Authentication but not in Firestore yet
  // (signed in elsewhere, or added in the console), create their record first.
  // With allowCreate ("pre-authorize"), also create a record for someone who has
  // never signed in at all. With Google sign-in this is how an admin can grant a
  // role BEFORE the person's first login; their uid is linked when they do log in.
  if (!(await ref.get()).exists) {
    let uid = null;
    let found = false;
    try {
      const account = await getAuth().getUserByEmail(normalize(targetEmail));
      uid = account.uid;
      found = true;
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
    }
    if (found || allowCreate) await createIfMissing(normalize(targetEmail), uid);
  }

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw httpError(
        404,
        'No such user. They have not signed in yet. To pre-authorize them, send {"role": "...", "allowCreate": true}.'
      );
    }
    const current = snap.data().role;
    if (current === role) return { email: snap.data().email, role };

    if (current === "admin" && role !== "admin") {
      const admins = await tx.get(users().where("role", "==", "admin").limit(2));
      if (admins.size <= 1) throw httpError(400, "Cannot remove the last admin.");
    }

    tx.update(ref, {
      role,
      roleChangedBy: normalize(actorEmail),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { email: snap.data().email, role };
  });
}

/** Used by scripts/seed-admin.js to create or promote the first admin. */
export async function seedAdmin(email) {
  const id = normalize(email);
  await users().doc(id).set(
    { email: id, role: "admin", createdAt: FieldValue.serverTimestamp(), roleChangedBy: "seed-script" },
    { merge: true }
  );
  return id;
}
