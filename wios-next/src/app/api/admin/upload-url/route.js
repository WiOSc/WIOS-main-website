import { createRouteHandler } from "uploadthing/next";
import { authenticate } from "@/lib/auth.js";
import { handle, httpError } from "@/lib/http.js";
import { uploadRouter } from "@/uploadthing/fileRouter.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Created on first request (not at import time) so `next build` works without secrets.
let handlers;
const getHandlers = () =>
  (handlers ??= createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
      ...(process.env.UPLOADTHING_CALLBACK_URL && { callbackUrl: process.env.UPLOADTHING_CALLBACK_URL }),
    },
  }));

/**
 * POST /api/admin/upload-url?actionType=upload&slug=imageUploader
 *   1. authenticate -> who are you? (Firebase token) and what is your role? (Firestore)
 *   2. role check   -> only "admin" continues; "user" gets 403
 *   3. UploadThing  -> checks type/size against the file router, returns presigned URL(s)
 * The browser then uploads straight to UploadThing; the secret token never leaves here.
 *
 * UploadThing also calls this same URL (a signed webhook) when an upload finishes.
 * That request has no Firebase token, so it skips our login check; UploadThing's
 * handler verifies its HMAC signature itself.
 */
const guarded = (method) =>
  handle(async (request, context) => {
    if (!request.headers.get("uploadthing-hook")) {
      const user = await authenticate(request);
      if (user.role !== "admin") throw httpError(403, "Requires admin role");
    }
    return getHandlers()[method](request, context);
  });

export const GET = guarded("GET");
export const POST = guarded("POST");
