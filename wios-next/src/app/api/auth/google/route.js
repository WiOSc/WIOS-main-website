import { authenticate } from "@/lib/auth.js";
import { handle } from "@/lib/http.js";
import { recordLogin } from "@/lib/userStore.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/google      (header: Authorization: Bearer <Firebase ID token>)
 *
 * The frontend calls this right after "Sign in with Google" succeeds.
 * It verifies the token, creates the Firestore record if this is a new person
 * (role "user"; a seeded admin keeps "admin"), saves their Google name/photo and
 * last-login time, and returns who they are and what they can do.
 */
export const POST = handle(async (request) => {
  const me = await authenticate(request); // verifies token + creates users/{email} if missing
  await recordLogin(me.email, me);
  return Response.json({
    email: me.email,
    name: me.name,
    picture: me.picture,
    role: me.role,
    canUpload: me.role === "admin",
  });
});
