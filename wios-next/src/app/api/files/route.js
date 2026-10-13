import { authenticate } from "@/lib/auth.js";
import { listFiles } from "@/lib/fileStore.js";
import { handle } from "@/lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/files -> any signed-in user (admin or user) can see uploaded files
export const GET = handle(async (request) => {
  await authenticate(request);
  return Response.json({ files: await listFiles() });
});
