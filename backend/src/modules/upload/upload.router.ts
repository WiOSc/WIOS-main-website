import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAdmin } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  eventImages: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      try {
        // Reuse existing admin auth check
        const user = await requireAdmin(req);
        return { userId: user.uid, email: user.email };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Admin authentication required";
        console.error("UploadThing auth middleware rejected upload:", message);
        throw new UploadThingError({
          code: "FORBIDDEN",
          message,
        });
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.email,
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
      };
    }),

  eventPoster: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      try {
        const user = await requireAdmin(req);
        return { userId: user.uid, email: user.email };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Admin authentication required";
        console.error("UploadThing auth middleware rejected upload:", message);
        throw new UploadThingError({
          code: "FORBIDDEN",
          message,
        });
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.email,
        url: file.ufsUrl || file.url,
        key: file.key,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
