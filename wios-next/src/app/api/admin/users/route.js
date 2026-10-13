import { requireRole } from "@/lib/auth.js";
import { handle } from "@/lib/http.js";
import { listUsers, syncFromAuth } from "@/lib/userStore.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/users -> everyone and their role (admin only).
// First pulls in anyone added in Firebase Authentication who has no record yet.
export const GET = handle(async (request) => {
  await requireRole(request, "admin");
  await syncFromAuth();
  return Response.json({ users: await listUsers() });
});
