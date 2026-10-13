import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { authenticate } from "@/lib/auth.js";
import { addFile } from "@/lib/fileStore.js";

const f = createUploadthing();

const whoIsUploading = async ({ req }) => {
  const user = await authenticate(req);
  if (user.role !== "admin") throw new UploadThingError("Requires admin role");
  return { uploadedBy: user.email };
};

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


export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .middleware(whoIsUploading)
    .onUploadComplete(saveRecord),

  documentUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 3 } })
    .middleware(whoIsUploading)
    .onUploadComplete(saveRecord),
};
