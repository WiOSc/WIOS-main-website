# WIOS website – upload backend

Express backend where **admins** can upload files directly to UploadThing (via short-lived presigned URLs) and **users** can only view them. Roles live in Firestore, not in `.env`.

## Roles

| Role | See files (`GET /api/files`) | Upload (`/api/admin/upload-url`) | Manage roles (`/api/admin/users`) |
|---|---|---|---|
| `admin` | yes | yes | yes |
| `user` | yes | no (403) | no (403) |

- The first admin is written into the database with `npm run seed:admin -- you@example.com`.
- Anyone else who signs in is automatically created as `user` the first time they call the API.
- An admin can promote a user (or demote an admin) with `PUT /api/admin/users/:email/role`. The last admin cannot be demoted.
- Admin power is only honoured when the Firebase account's **email is verified** (otherwise someone could sign up with an admin's email first).

## Request flow for an upload

```
Browser            Your backend                                   UploadThing
  | POST /api/admin/upload-url  (Bearer Firebase token)               |
  |------------------>| authenticate: verify token, look up role in Firestore
  |                   | requireRole("admin"): user -> 403
  |                   | file router: check type/size/count
  |                   |--- ask for presigned URL(s) ----------------->|
  |<------------------| presigned URL(s)                               |
  | PUT file straight to the presigned URL --------------------------->|
  |                   |<-- signed webhook: onUploadComplete -----------|
  |                   | save record in Firestore "files"
```

`UPLOADTHING_TOKEN` never leaves the server. The webhook skips the login check (it has no Firebase token); UploadThing's handler verifies its HMAC signature instead.

## Database (Firestore)

- `users/{email}` → `{ email, role, uid, createdAt, roleChangedBy?, updatedAt? }`
- `files/{autoId}` → `{ name, url, key, size, type, uploadedBy, createdAt }`

Only the backend touches these (via the service-account key). In the Firebase console set Firestore rules to deny all client access:
`allow read, write: if false;`

## Files

| File | Purpose |
|---|---|
| `.env` / `.env.example` | Settings. No admin emails here any more. Adds `FIREBASE_SERVICE_ACCOUNT_PATH`. |
| `.gitignore` | Keeps `.env`, `node_modules` and service-account keys out of git. |
| `package.json` | Dependencies and scripts (`start`, `dev`, `seed:admin`, `test:upload`). |
| `src/config/env.js` | Loads `.env`; `assertEnv()` exits with a clear message when a value is missing. |
| `src/config/firebase.js` | Starts Firebase Admin with the service-account key; exports `firebaseAuth` and `db` (Firestore). |
| `src/services/userStore.js` | All role logic: get-or-create user, list users, change role (transaction, last-admin guard), seed admin. |
| `src/services/fileStore.js` | Saves and lists uploaded-file records. |
| `src/middleware/authenticate.js` | Verifies the Firebase token, loads the role, sets `req.user`. 401 on bad token. |
| `src/middleware/requireRole.js` | Allows only the given role, else 403. |
| `src/uploadthing/fileRouter.js` | What may be uploaded (`imageUploader`, `documentUploader`) and the save-record callback. |
| `src/routes/me.js` | `GET /api/me` → your email, role, `canUpload`. |
| `src/routes/files.js` | `GET /api/files` → list of uploaded files (any signed-in user). |
| `src/routes/adminUsers.js` | `GET /api/admin/users`, `PUT /api/admin/users/:email/role` (admin only). |
| `src/server.js` | Wires CORS, routes, the guarded upload route and the error handler. |
| `scripts/seed-admin.js` | Creates/promotes the first admin in Firestore. |
| `scripts/test-upload.js` | End-to-end check for one account. |

## One-time setup

1. Node 20+, then `npm install`.
2. Firebase console → **Build → Firestore Database → Create database**. Set rules to deny client access (above).
3. Firebase console → **Authentication → Sign-in method** → enable Email/Password (and/or Google).
4. Firebase console → **Project settings → Service accounts → Generate new private key**. Save the file as `serviceAccountKey.json` in this folder (already git-ignored).
5. UploadThing dashboard → WIOS website → API Keys → copy the V7 token into `UPLOADTHING_TOKEN`.
6. Create the first admin: `npm run seed:admin -- you@example.com --verify`
   (create that account in Firebase Authentication first if it doesn't exist; `--verify` marks its email verified).
7. `npm run dev`

## Testing

Create two Firebase Authentication users: **A** (the seeded admin email, email verified) and **B** (any other email).

1. `curl http://localhost:4000/health` → `{"ok":true,"app":"WIOS website"}`
2. `curl -i http://localhost:4000/api/me` → 401 (no token).
3. `TEST_EMAIL=A TEST_PASSWORD=... npm run test:upload` → role `admin`, upload succeeds, file shows in UploadThing dashboard and in Firestore `files`.
4. `TEST_EMAIL=B TEST_PASSWORD=... npm run test:upload` → role `user`, `/api/files` works (200), upload rejected. Firestore now has a `users/B` document with role `user`.
5. Promote B (get A's token by signing in as in the test script, then):
   `curl -X PUT http://localhost:4000/api/admin/users/B/role -H "Authorization: Bearer <A token>" -H "Content-Type: application/json" -d '{"role":"admin"}'`
   Re-run step 4's script: B is now admin and can upload.
6. Calling the same PUT with B's token before promotion → 403.
7. Demote the only admin → 400 "Cannot remove the last admin".
8. Upload a non-image or a file over 8MB to `imageUploader` → refused by UploadThing.

## Notes

- Presigned-link lifetime is set by UploadThing; this route doesn't expose a custom "few minutes" value.
- In production UploadThing must reach your server's public URL for `onUploadComplete`. If you are behind a proxy, set `UPLOADTHING_CALLBACK_URL`.
- Role changes take effect on the user's next request (the role is read from Firestore every time, not cached in the token).
- Rotate `UPLOADTHING_TOKEN` or the service-account key if either is ever exposed.
