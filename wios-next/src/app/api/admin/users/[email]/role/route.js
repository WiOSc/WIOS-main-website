import { requireRole } from "@/lib/auth.js";
import { handle, httpError } from "@/lib/http.js";
import { ROLES, setRole } from "@/lib/userStore.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PUT /api/admin/users/:email/role   (admin only)
 * body: { "role": "admin" | "user", "allowCreate"?: true }
 *
 * allowCreate: true = "pre-authorize". Creates the record for someone who has not
 * signed in yet, so they get this role on their first Google login.
 * Without it, an unknown email returns 404 (typo protection).
 */
export const PUT = handle(async (request, { params }) => {
  const actor = await requireRole(request, "admin");

  // `params` is a Promise in Next 15; awaiting also works on older versions.
  const { email: rawEmail } = await params;
  let email = rawEmail;
  try {
    email = decodeURIComponent(rawEmail);
  } catch {
    // already decoded
  }

  const body = (await request.json().catch(() => ({}))) ?? {};
  if (!ROLES.includes(body.role)) throw httpError(400, `role must be one of: ${ROLES.join(", ")}`);

  const allowCreate = body.allowCreate === true;
  if (allowCreate && !EMAIL_PATTERN.test(email.trim())) throw httpError(400, "Invalid email address");

  return Response.json(await setRole(email, body.role, actor.email, { allowCreate }));
});
