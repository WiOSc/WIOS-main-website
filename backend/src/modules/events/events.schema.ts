import { z } from "zod";

export const eventImageSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  key: z.string().min(1, "Image key is required"),
  alt: z.string().optional().default(""),
  uploadedAt: z.string().optional().default(() => new Date().toISOString()),
});

export type EventImage = z.infer<typeof eventImageSchema>;

export const createEventSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  // Short blurb shown on the /events timeline (the main description is too long for it).
  shortDescription: z.string().optional().default(""),
  // Whether this event appears on the public /events timeline.
  showOnEvents: z.boolean().default(true),
  date: z.string().min(1, "Date is required"),
  venue: z.string().min(1, "Venue is required"),
  category: z.string().min(1).default("General"),
  images: z.array(eventImageSchema).default([]),

  // Backwards compatibility / optional registration fields
  location: z.string().optional(),
  startsAt: z.string().optional(),
  registrationDeadline: z.string().optional(),
  allowEdit: z.boolean().default(false),
  status: z.enum(["draft", "open", "closed"]).default("open"),
  theme: z
    .object({
      accent: z.string().default("#8D7FB5"),
      poster: z.string().optional(),
      layout: z.enum(["centered", "split"]).default("centered"),
    })
    .default({ accent: "#8D7FB5", layout: "centered" }),
  fields: z.array(z.any()).default([]),
  isSeeded: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export interface EventDoc {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  showOnEvents?: boolean;
  date: string;
  venue: string;
  category: string;
  images: EventImage[];
  createdAt: string;
  updatedAt: string;

  // Backwards compatibility / optional fields
  location?: string;
  startsAt?: string;
  registrationDeadline?: string;
  allowEdit?: boolean;
  status?: "draft" | "open" | "closed";
  theme?: {
    accent: string;
    poster?: string;
    layout: "centered" | "split";
  };
  fields?: any[];
  createdBy?: string;
  bannerUrl?: string;
  isSeeded?: boolean;
}

export interface EventsListResponse {
  events: EventDoc[];
}

export interface SingleEventResponse {
  event: EventDoc;
}
