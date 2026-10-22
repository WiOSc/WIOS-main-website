/**
 * One-off: copy every EXISTING registration into the hidden `registrationBackups`
 * collection (new registrations are backed up automatically by the app).
 *
 * Usage (from backend/):
 *   node scripts/backfill-registration-backups.cjs --dry   # count only
 *   node scripts/backfill-registration-backups.cjs         # write backups
 *
 * Safe to re-run: existing backups are only filled in, never overwritten.
 */
const fs = require("fs");
const path = require("path");

const DRY = process.argv.includes("--dry");

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const admin = require("firebase-admin");
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
  });
  const db = admin.firestore();
  const snap = await db.collectionGroup("registrations").get();
  console.log(`Found ${snap.size} registrations (dry=${DRY})`);

  let written = 0;
  let skipped = 0;
  for (const d of snap.docs) {
    const slug = d.ref.parent.parent.id;
    const x = d.data();
    const ref = db.collection("registrationBackups").doc(`${slug}__${d.id}`);
    if ((await ref.get()).exists) {
      skipped++;
      continue;
    }
    if (!DRY) {
      await ref.set({
        slug,
        uid: d.id,
        email: x.email ?? "",
        name: x.name ?? null,
        photoURL: x.photoURL ?? null,
        answers: x.answers ?? {},
        createdAt: x.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: x.updatedAt ?? x.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    written++;
  }
  console.log(`${DRY ? "Would back up" : "Backed up"} ${written}, already backed up ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
