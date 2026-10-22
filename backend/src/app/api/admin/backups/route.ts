import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/http";
import { requireEnvAdmin } from "@/lib/auth";
import { listBackups, purgeBackups } from "@/lib/registration-backup";

export const runtime = "nodejs";

// Registration backups are intentionally API-only (no admin UI) and restricted
// to ADMIN_EMAILS (env) admins.

// GET /api/admin/backups[?slug=my-event]
export const GET = route(async (req: Request) => {
  await requireEnvAdmin(req);
  const slug = new URL(req.url).searchParams.get("slug") ?? undefined;
  return NextResponse.json({ backups: await listBackups(slug) });
});

const purgeSchema = z.object({
  slug: z.string().min(1),
  uid: z.string().min(1).optional(),
});

// DELETE /api/admin/backups?slug=my-event[&uid=abc]  (permanent)
export const DELETE = route(async (req: Request) => {
  await requireEnvAdmin(req);
  const sp = new URL(req.url).searchParams;
  const { slug, uid } = purgeSchema.parse({
    slug: sp.get("slug"),
    uid: sp.get("uid") ?? undefined,
  });
  const deleted = await purgeBackups(slug, uid);
  return NextResponse.json({ ok: true, deleted });
});
