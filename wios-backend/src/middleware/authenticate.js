import { firebaseAuth } from "../config/firebase.js";
import { getOrCreateUser } from "../services/userStore.js";

/**
 * Identifies the caller and attaches their role.
 * Expects:  Authorization: Bearer <Firebase ID token>
 * Sets:     req.user = { uid, email, role }   (role comes from Firestore)
 */
export async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  if (!decoded.email) {
    return res.status(401).json({ error: "Account has no email address" });
  }

  try {
    const user = await getOrCreateUser(decoded.email, decoded.uid);
    // Anyone can sign up with any email on Firebase email/password, so admin
    // power is only honoured once the email is verified. Otherwise treat as "user".
    const role = user.role === "admin" && decoded.email_verified !== true ? "user" : user.role;
    req.user = { uid: decoded.uid, email: user.email, role };
    return next();
  } catch (err) {
    return next(err); // database problem -> 500, not 401
  }
}
