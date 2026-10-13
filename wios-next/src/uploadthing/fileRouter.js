import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { authenticate } from "@/lib/auth.js";
import { addFile } from "@/lib/fileStore.js";

const f = createUploadthing();

// Runs on YOUR server before a link is issued. The route already blocks
// non-admins (see app/api/admin/upload-url/route.js); checking again here is a
// second lock, and it records who is uploading.
const whoIsUploading = async ({ req }) => {
  const user = await authenticate(req);
  if (user.role !== "admin") throw new UploadThingError("Requires admin role");
  return { uploadedBy: user.email };
};

// Runs after UploadThing confirms the upload: save a record so users can see the file.
const saveRecord = async ({ metadata, file }) => {
  await addFile({
    name: file.name,
    url: file.ufsUrl ?? file.url,
    key: file.key,
    size: file.size,
    type: file.type,
    uploadedBy: metadata.uploadedBy,
  });
  return { uploadedBy: metadata.uploadedBy };
};

/**
 * Declares WHAT may be uploaded; UploadThing enforces type, size and count
 * when it issues the presigned link. Add more slugs as the site needs them.
 */
export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .middleware(whoIsUploading)
    .onUploadComplete(saveRecord),

  documentUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 3 } })
    .middleware(whoIsUploading)
    .onUploadComplete(saveRecord),
};
