import { createUploadthing } from "uploadthing/express";
import { addFile } from "../services/fileStore.js";

const f = createUploadthing();

// Shared by both routes: runs on YOUR server before a link is issued. The admin
// check already happened in server.js; we just record who is uploading.
const whoIsUploading = async ({ req }) => ({ uploadedBy: req.user?.email ?? "unknown" });

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
