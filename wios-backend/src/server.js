import express from "express";
import cors from "cors";
import { createRouteHandler } from "uploadthing/express";

import { env, assertEnv } from "./config/env.js";
import { authenticate } from "./middleware/authenticate.js";
import { requireRole } from "./middleware/requireRole.js";
import { uploadRouter } from "./uploadthing/fileRouter.js";
import meRouter from "./routes/me.js";
import filesRouter from "./routes/files.js";
import adminUsersRouter from "./routes/adminUsers.js";

assertEnv(["UPLOADTHING_TOKEN"]);

const app = express();

app.use(
  cors({
    origin: env.allowedOrigins,
    allowedHeaders: ["Content-Type", "Authorization", "x-uploadthing-version", "x-uploadthing-package"],
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, app: "WIOS website" }));

/**
 * UploadThing also calls this same URL (a signed webhook) when an upload
 * finishes. That request has no Firebase token, so it skips our login check;
 * UploadThing's handler verifies its HMAC signature itself.
 */
const skipForWebhook = (mw) => (req, res, next) =>
  req.headers["uploadthing-hook"] ? next() : mw(req, res, next);

/**
 * POST /api/admin/upload-url?actionType=upload&slug=imageUploader
 *   1. authenticate  -> who are you? (Firebase token) and what is your role? (Firestore)
 *   2. requireRole   -> only "admin" continues; "user" gets 403
 *   3. UploadThing   -> checks type/size against the file router, returns presigned URL(s)
 * The browser then uploads straight to UploadThing; the secret token never leaves here.
 * Mounted BEFORE express.json() so UploadThing's adapter reads the raw body itself.
 */
app.use(
  "/api/admin/upload-url",
  skipForWebhook(authenticate),
  skipForWebhook(requireRole("admin")),
  createRouteHandler({
    router: uploadRouter,
    config: { token: env.uploadthingToken, ...(env.callbackUrl && { callbackUrl: env.callbackUrl }) },
  })
);

app.use(express.json());

app.use("/api/me", authenticate, meRouter); // any signed-in user
app.use("/api/files", authenticate, filesRouter); // any signed-in user (read-only)
app.use("/api/admin/users", authenticate, requireRole("admin"), adminUsersRouter); // admin only

// Central error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
});

app.listen(env.port, () => {
  console.log(`WIOS website backend listening on http://localhost:${env.port}`);
});
