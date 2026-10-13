export const dynamic = "force-dynamic";

// GET /health -> no login needed
export function GET() {
  return Response.json({ ok: true, app: "WIOS website" });
}
