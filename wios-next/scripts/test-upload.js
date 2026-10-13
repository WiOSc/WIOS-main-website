// End-to-end test for one account:
//   sign in -> GET /api/me (role) -> GET /api/files -> try an upload
// An admin's upload should succeed; a "user" upload should be rejected (403).
//
// Usage:
//   TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm run test:upload
import "./load-env.js";
import { genUploader } from "uploadthing/client";

const { TEST_EMAIL, TEST_PASSWORD, FIREBASE_API_KEY, PORT = 4000 } = process.env;
if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error("Set TEST_EMAIL and TEST_PASSWORD");
  process.exit(1);
}
const base = `http://localhost:${PORT}`;

// 1. Firebase REST sign-in -> ID token
const signIn = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
  }
).then((r) => r.json());

if (!signIn.idToken) {
  console.error("Firebase sign-in failed:", signIn.error?.message || signIn);
  process.exit(1);
}
const auth = { Authorization: `Bearer ${signIn.idToken}` };
console.log("1/4 Signed in to Firebase");

// 2. Role check
const me = await fetch(`${base}/api/me`, { headers: auth }).then((r) => r.json());
console.log("2/4 /api/me ->", me);

// 3. Everyone can see files
const list = await fetch(`${base}/api/files`, { headers: auth });
console.log(`3/4 /api/files -> HTTP ${list.status}, ${(await list.json()).files?.length ?? 0} file(s)`);

// 4. Only admins can upload
const { uploadFiles } = genUploader({ url: `${base}/api/admin/upload-url`, package: "uploadthing" });
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);
const file = new File([png], "wios-test.png", { type: "image/png" });

try {
  const result = await uploadFiles("imageUploader", { files: [file], headers: auth });
  console.log("4/4 Upload succeeded:", JSON.stringify(result, null, 2));
  if (me.role !== "admin") console.error("UNEXPECTED: a non-admin was able to upload!");
} catch (err) {
  console.log(`4/4 Upload rejected: ${err.message}`);
  console.log(me.role === "admin" ? "UNEXPECTED: an admin should be allowed." : "Expected for role \"user\".");
}
