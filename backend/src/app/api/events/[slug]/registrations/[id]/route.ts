import { NextResponse } from "next/server";
import { route, HttpError } from "@/lib/http";
import { requireAdmin, requireEnvAdmin } from "@/lib/auth";
import { deleteRegistration, getRegistration } from "@/lib/events";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string; id: string }> };

export const GET = route(async (req: Request, { params }: Ctx) => {
  await requireAdmin(req);
  const { slug, id } = await params;
  const registration = await getRegistration(slug, id);
  if (!registration) throw new HttpError(404, "registration not found");
  return NextResponse.json({ registration });
});

// Env admins only. The hidden backup copy is kept (see lib/registration-backup.ts).
export const DELETE = route(async (req: Request, { params }: Ctx) => {
  await requireEnvAdmin(req);
  const { slug, id } = await params;
  await deleteRegistration(slug, id);
  return NextResponse.json({ ok: true });
});
