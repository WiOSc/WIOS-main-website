// One-command test of the whole WIOS backend: login checks, roles, uploads,
// role changes and error cases. Prints PASS / FAIL for each check.
//
// Needs the server running (npm run dev) in another terminal, and two accounts:
// an admin (listed as admin in Firestore) and a regular user (any other email).
//
// GOOGLE SIGN-IN (recommended): get a token for each account from
// http://localhost:4000/dev-login, then (PowerShell):
//   $env:ADMIN_EMAIL="admin@gmail.com"; $env:ADMIN_TOKEN="eyJ..."
//   $env:USER_EMAIL="user@gmail.com";   $env:USER_TOKEN="eyJ..."
//   npm run test:all
// Tokens last about 1 hour. Use a fresh one if you see "Invalid or expired token".
//
// EMAIL/PASSWORD (still works): set ADMIN_PASSWORD and USER_PASSWORD instead of the tokens.
//
// Add --skip-upload to skip the real UploadThing uploads.
import "./load-env.js";
import { genUploader } from "uploadthing/client";

const { ADMIN_EMAIL, ADMIN_PASSWORD, USER_EMAIL, USER_PASSWORD, ADMIN_TOKEN, USER_TOKEN, FIREBASE_API_KEY, PORT = 4000 } = process.env;
const skipUpload = process.argv.includes("--skip-upload");
const base = `http://localhost:${PORT}`;

if (!ADMIN_EMAIL || !USER_EMAIL || !(ADMIN_TOKEN || ADMIN_PASSWORD) || !(USER_TOKEN || USER_PASSWORD)) {
  console.error(
    "Set ADMIN_EMAIL and USER_EMAIL, plus ADMIN_TOKEN/USER_TOKEN (Google) or ADMIN_PASSWORD/USER_PASSWORD. See top of this file."
  );
  process.exit(1);
}

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? "  -> " + detail : ""}`);
  }
};
const note = (msg) => console.log(`----  ${msg}`);

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

async function signIn(email, password) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  ).then((x) => x.json());
  if (!r.idToken) throw new Error(`Firebase sign-in failed for ${email}: ${r.error?.message || "unknown"}`);
  return r.idToken;
}

const { uploadFiles } = genUploader({ url: `${base}/api/admin/upload-url`, package: "uploadthing" });
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);
const tryUpload = async (token, name) => {
  try {
    const out = await uploadFiles("imageUploader", {
      files: [new File([png], name, { type: "image/png" })],
      headers: { Authorization: `Bearer ${token}` },
    });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, err: err.message };
  }
};

let adminToken, userToken;

try {
  // ---------- Server and login protection ----------
  console.log("\n== Server and login protection ==");
  const health = await api("/health");
  check("GET /health returns 200", health.status === 200 && health.json?.ok === true, `status ${health.status}`);

  const noToken = await api("/api/me");
  check("GET /api/me without a token -> 401", noToken.status === 401, `status ${noToken.status}`);

  const badToken = await api("/api/me", { token: "not-a-real-token" });
  check("GET /api/me with a fake token -> 401", badToken.status === 401, `status ${badToken.status}`);

  const noTokenUpload = await api("/api/admin/upload-url?actionType=upload&slug=imageUploader", { method: "POST", body: {} });
  check("Upload route without a token -> 401", noTokenUpload.status === 401, `status ${noTokenUpload.status}`);

  // ---------- Sign in ----------
  console.log("\n== Sign in ==");
  adminToken = ADMIN_TOKEN || (await signIn(ADMIN_EMAIL, ADMIN_PASSWORD));
  userToken = USER_TOKEN || (await signIn(USER_EMAIL, USER_PASSWORD));
  check(`Both accounts have tokens (${ADMIN_TOKEN ? "Google/pasted" : "password"})`, true);

  // ---------- Roles ----------
  console.log("\n== Roles ==");
  const adminMe = await api("/api/me", { token: adminToken });
  check(
    "Admin account has role admin",
    adminMe.json?.role === "admin",
    `got "${adminMe.json?.role}". Is the Firestore doc ID your exact lowercase email, and is the email verified?`
  );
  const userMe = await api("/api/me", { token: userToken });
  check(
    "Regular account has role user",
    userMe.json?.role === "user",
    `got "${userMe.json?.role}". If it is admin, set it back to user in Firestore and re-run.`
  );

  // ---------- What a user can and can't do ----------
  console.log("\n== Regular user permissions ==");
  const userFiles = await api("/api/files", { token: userToken });
  check("User can list files (200)", userFiles.status === 200, `status ${userFiles.status}`);

  const userList = await api("/api/admin/users", { token: userToken });
  check("User cannot list users (403)", userList.status === 403, `status ${userList.status}`);

  const selfPromote = await api(`/api/admin/users/${encodeURIComponent(USER_EMAIL)}/role`, {
    method: "PUT",
    token: userToken,
    body: { role: "admin" },
  });
  check("User cannot promote themselves (403)", selfPromote.status === 403, `status ${selfPromote.status}`);

  const userNoUpload = await api("/api/admin/upload-url?actionType=upload&slug=imageUploader", {
    method: "POST",
    token: userToken,
    body: { files: [{ name: "a.png", size: 70, type: "image/png" }] },
  });
  check("User cannot request an upload link (403)", userNoUpload.status === 403, `status ${userNoUpload.status}`);

  // ---------- What an admin can do ----------
  console.log("\n== Admin permissions ==");
  const adminUsers = await api("/api/admin/users", { token: adminToken });
  const emails = (adminUsers.json?.users || []).map((u) => u.email);
  check("Admin can list users (200)", adminUsers.status === 200, `status ${adminUsers.status}`);
  check(
    "User list contains both accounts",
    emails.includes(ADMIN_EMAIL.toLowerCase()) && emails.includes(USER_EMAIL.toLowerCase()),
    `found: ${emails.join(", ")}`
  );

  const badRole = await api(`/api/admin/users/${encodeURIComponent(USER_EMAIL)}/role`, {
    method: "PUT",
    token: adminToken,
    body: { role: "boss" },
  });
  check("Invalid role value -> 400", badRole.status === 400, `status ${badRole.status}`);

  const unknown = await api("/api/admin/users/nobody-here@example.com/role", {
    method: "PUT",
    token: adminToken,
    body: { role: "admin" },
  });
  check("Unknown user -> 404", unknown.status === 404, `status ${unknown.status}`);

  const preEmail = `wios-preauth-${Date.now()}@example.com`;
  const badEmail = await api("/api/admin/users/not-an-email/role", {
    method: "PUT",
    token: adminToken,
    body: { role: "user", allowCreate: true },
  });
  check("Pre-authorize with an invalid email -> 400", badEmail.status === 400, `status ${badEmail.status}`);

  const pre = await api(`/api/admin/users/${encodeURIComponent(preEmail)}/role`, {
    method: "PUT",
    token: adminToken,
    body: { role: "user", allowCreate: true },
  });
  check("Pre-authorize someone who has not signed in (200)", pre.status === 200 && pre.json?.role === "user", `status ${pre.status}`);
  const listed = await api("/api/admin/users", { token: adminToken });
  check(
    "Pre-authorized email appears in the list",
    (listed.json?.users || []).some((u) => u.email === preEmail),
    "not found"
  );
  note(`Created test record ${preEmail}; you can delete it in Firestore (users collection).`);

  // ---------- Uploads ----------
  console.log("\n== Uploads ==");
  if (skipUpload) {
    note("Skipped (--skip-upload)");
  } else {
    const adminUp = await tryUpload(adminToken, "wios-admin-test.png");
    check("Admin can upload an image", adminUp.ok, adminUp.err);

    const userUp = await tryUpload(userToken, "wios-user-test.png");
    check("Regular user's upload is rejected", !userUp.ok, "the upload unexpectedly succeeded");

    if (adminUp.ok) {
      // Give UploadThing's callback a moment, then confirm the record shows up.
      await new Promise((r) => setTimeout(r, 4000));
      const files = await api("/api/files", { token: userToken });
      const names = (files.json?.files || []).map((f) => f.name);
      check(
        "Uploaded file appears in the file list for users",
        names.includes("wios-admin-test.png"),
        "not listed yet. In local dev the upload callback can need a minute, or UPLOADTHING_CALLBACK_URL is needed in production."
      );
    }
  }

  // ---------- Role changes ----------
  console.log("\n== Role changes ==");
  const promote = await api(`/api/admin/users/${encodeURIComponent(USER_EMAIL)}/role`, {
    method: "PUT",
    token: adminToken,
    body: { role: "admin" },
  });
  check("Admin can promote the user (200)", promote.status === 200 && promote.json?.role === "admin", `status ${promote.status}`);

  const promotedMe = await api("/api/me", { token: userToken });
  check(
    "Promoted account now reports role admin",
    promotedMe.json?.role === "admin",
    `got "${promotedMe.json?.role}". If it still says user, that account's email is probably not verified.`
  );

  if (!skipUpload && promotedMe.json?.role === "admin") {
    const promotedUp = await tryUpload(userToken, "wios-promoted-test.png");
    check("Promoted account can now upload", promotedUp.ok, promotedUp.err);
  }

  const demote = await api(`/api/admin/users/${encodeURIComponent(USER_EMAIL)}/role`, {
    method: "PUT",
    token: adminToken,
    body: { role: "user" },
  });
  check("Admin can demote the account back to user (200)", demote.status === 200 && demote.json?.role === "user", `status ${demote.status}`);

  // Last-admin guard only applies if our admin is the only one.
  const after = await api("/api/admin/users", { token: adminToken });
  const adminCount = (after.json?.users || []).filter((u) => u.role === "admin").length;
  if (adminCount === 1) {
    const lastAdmin = await api(`/api/admin/users/${encodeURIComponent(ADMIN_EMAIL)}/role`, {
      method: "PUT",
      token: adminToken,
      body: { role: "user" },
    });
    check("Cannot remove the last admin (400)", lastAdmin.status === 400, `status ${lastAdmin.status}`);
  } else {
    note(`Skipped last-admin check: ${adminCount} admins exist`);
  }
} catch (err) {
  failed++;
  console.log(`\nFAIL  Test run stopped: ${err.message}`);
} finally {
  // Always leave the test user as a plain "user".
  if (adminToken) {
    await api(`/api/admin/users/${encodeURIComponent(USER_EMAIL)}/role`, {
      method: "PUT",
      token: adminToken,
      body: { role: "user" },
    }).catch(() => {});
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
