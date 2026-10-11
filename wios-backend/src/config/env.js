import "dotenv/config";

const list = (v) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 4000,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseApiKey: process.env.FIREBASE_API_KEY, // only used by the test script
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  uploadthingToken: process.env.UPLOADTHING_TOKEN,
  callbackUrl: process.env.UPLOADTHING_CALLBACK_URL || undefined,
  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
};

/** Exit with a clear message if any of the named env vars is empty. */
export function assertEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`\nMissing required env vars: ${missing.join(", ")}\nFill them in .env and restart.\n`);
    process.exit(1);
  }
}
