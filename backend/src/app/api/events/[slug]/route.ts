import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/config/firebase";
import { route, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import {
  deleteEvent,
  updateEvent,
  updateEventSchema,
} from "@/modules/events";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const requestSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "The event slug is invalid"),

  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100),
});

function getUploadThingUrl(
  fileKey: string | null | undefined
): string | null {
  if (!fileKey) {
    return null;
  }

  return `https://ufs.sh/f/${encodeURIComponent(fileKey)}`;
}

// GET /api/events/[slug]?year=2026
// Returns all the data needed to display an event page.
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const yearParameter =
      request.nextUrl.searchParams.get("year");

    const validation = requestSchema.safeParse({
      slug,
      year: yearParameter,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { year } = validation.data;

    // Find the event using its URL slug.
    const eventSnapshot = await db
      .collection("events")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (eventSnapshot.empty) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const eventDocument = eventSnapshot.docs[0];
    const eventData = eventDocument.data();

    // Example: events/{eventId}/years/2026
    const yearReference = eventDocument.ref
      .collection("years")
      .doc(String(year));

    const yearDocument = await yearReference.get();

    if (!yearDocument.exists) {
      return NextResponse.json(
        {
          error: `Year ${year} was not found for this event`,
        },
        { status: 404 }
      );
    }

    const yearData = yearDocument.data();

    if (!yearData) {
      return NextResponse.json(
        { error: "Event year data is missing" },
        { status: 404 }
      );
    }

    // Departments and gallery photos can be loaded together.
    const [departmentsSnapshot, photosSnapshot] =
      await Promise.all([
        yearReference
          .collection("departments")
          .get(),
        yearReference
          .collection("photos")
          .get(),
      ]);

    // Load the members belonging to each department.
    const departments = await Promise.all(
      departmentsSnapshot.docs.map(
        async (departmentDocument) => {
          const departmentData =
            departmentDocument.data();

          const membersSnapshot =
            await departmentDocument.ref
              .collection("members")
              .get();

          const members = membersSnapshot.docs
            .map((memberDocument) => {
              const memberData =
                memberDocument.data();

              return {
                id: memberDocument.id,
                name: memberData.name as string,
                role: memberData.role as string,
                photoUrl: getUploadThingUrl(
                  memberData.photoFileKey
                ),
              };
            })
            .sort((first, second) =>
              first.name.localeCompare(second.name)
            );

          return {
            id: departmentDocument.id,
            name: departmentData.name as string,
            slug: departmentData.slug as string,
            members,
          };
        }
      )
    );

    departments.sort((first, second) =>
      first.name.localeCompare(second.name)
    );

    const photos = photosSnapshot.docs
      .map((photoDocument) => {
        const photoData = photoDocument.data();

        return {
          id: photoDocument.id,
          departmentId:
            (photoData.departmentId as string | null) ??
            null,
          imageUrl: getUploadThingUrl(
            photoData.fileKey
          ),
          createdAt:
            photoData.createdAt
              ?.toDate?.()
              .toISOString() ?? null,
        };
      })
      .sort((first, second) =>
        (second.createdAt ?? "").localeCompare(
          first.createdAt ?? ""
        )
      );

    return NextResponse.json(
      {
        event: {
          id: eventDocument.id,
          name: eventData.name,
          slug: eventData.slug,
          description:
            eventData.description ?? null,
        },
        year,
        bannerUrl: getUploadThingUrl(
          yearData.bannerFileKey
        ),
        departments,
        photos,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error(
      "Failed to load event page data:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        error: "Unable to load event page data",
        message:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/events/[slug]
// Admin updates an event.
export const PUT = route(
  async (request: Request, context: RouteContext) => {
    await requireAdmin(request);

    const { slug } = await context.params;
    const body = await readJson(request);
    const update = updateEventSchema.parse(body);
    const event = await updateEvent(slug, update);

    return NextResponse.json({ event });
  }
);

// PATCH /api/events/[slug]
// Admin partially updates an event.
export const PATCH = route(
  async (request: Request, context: RouteContext) => {
    await requireAdmin(request);

    const { slug } = await context.params;
    const body = await readJson(request);
    const update = updateEventSchema.parse(body);
    const event = await updateEvent(slug, update);

    return NextResponse.json({ event });
  }
);

export const DELETE = route(
  async (request: Request, context: RouteContext) => {
    await requireAdmin(request);

    const { slug } = await context.params;
    await deleteEvent(slug);

    return NextResponse.json({
      ok: true,
      message: `Event "${slug}" deleted successfully`,
    });
  }
);