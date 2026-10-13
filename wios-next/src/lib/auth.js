import { getAuth } from "./firebase.js";
import { getOrCreateUser } from "./userStore.js";
import { httpError } from "./http.js";

/**
 * Identifies the caller and returns { uid, email, role }  (role comes from Firestore).
 * Expects:  Authorization: Bearer <Firebase ID token>
 * Throws 401 for a missing/invalid token. Replaces the Express `authenticate` middleware.
 */
export async function authenticate(request) {
  const [scheme, token] = (request.headers.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) throw httpError(401, "Missing Bearer token");

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (err) {
    console.error("verifyIdToken failed:", err.code, err.message);
    throw httpError(401, "Invalid or expired token");
  }
  if (!decoded.email) throw httpError(401, "Account has no email address");

  const user = await getOrCreateUser(decoded.email, decoded.uid);
  // Anyone can sign up with any email on Firebase email/password, so admin
  // power is only honoured once the email is verified. Otherwise treat as "user".
  const role = user.role === "admin" && decoded.email_verified !== true ? "user" : user.role;
  return {
    uid: decoded.uid,
    email: user.email,
    role,
    name: decoded.name ?? null,
    picture: decoded.picture ?? null,
    provider: decoded.firebase?.sign_in_provider ?? null,
  };
}

/** authenticate() + 403 unless the caller has the given role. Replaces `requireRole`. */
export async function requireRole(request, role) {
  const user = await authenticate(request);
  if (user.role !== role) throw httpError(403, `Requires ${role} role`);
  return user;
}
