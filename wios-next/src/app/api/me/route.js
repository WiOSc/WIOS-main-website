import { authenticate } from "@/lib/auth.js";
import { handle } from "@/lib/http.js";

export const runtime = "nodejs"; // firebase-admin does not run on the Edge runtime
export const dynamic = "force-dynamic";

// GET /api/me -> who am I and what can I do? (any signed-in user)
export const GET = handle(async (request) => {
  const { email, role } = await authenticate(request);
  return Response.json({ email, role, canUpload: role === "admin" });
});
