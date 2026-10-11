import { readFileSync } from "node:fs";
import admin from "firebase-admin";
import { env, assertEnv } from "./env.js";

assertEnv(["FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_PATH"]);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(env.serviceAccountPath, "utf8"));
} catch (err) {
  console.error(`\nCould not read the service-account key at "${env.serviceAccountPath}": ${err.message}\n`);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: env.firebaseProjectId,
  });
}

/** Verifies login tokens. */
export const firebaseAuth = admin.auth();
/** Firestore: stores roles (users) and uploaded-file records (files). */
export const db = admin.firestore();
