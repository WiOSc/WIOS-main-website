import { readFileSync } from "node:fs";
import admin from "firebase-admin";

// NOTE: everything here is created lazily (on first use), not at import time.
// Next.js imports route files during `next build`, when secrets may be absent.

function loadServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON");
    }
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_PATH (local) or FIREBASE_SERVICE_ACCOUNT_JSON (hosting) in .env.local"
    );
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`Could not read the service-account key at "${path}": ${err.message}`);
  }
}

function getApp() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/** Verifies login tokens and looks up Firebase Authentication users. */
export const getAuth = () => admin.auth(getApp());
/** Firestore: stores roles (users) and uploaded-file records (files). */
export const getDb = () => admin.firestore(getApp());
