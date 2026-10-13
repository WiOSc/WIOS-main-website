import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase.js";

/** Firestore collection "files": a record of everything uploaded, so users can browse it. */
const files = () => getDb().collection("files");

export async function addFile({ name, url, key, size, type, uploadedBy }) {
  await files().add({ name, url, key, size, type, uploadedBy, createdAt: FieldValue.serverTimestamp() });
}

export async function listFiles(limit = 100) {
  const snap = await files().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const f = d.data();
    return {
      id: d.id,
      name: f.name,
      url: f.url,
      size: f.size,
      type: f.type,
      uploadedBy: f.uploadedBy,
      createdAt: f.createdAt?.toDate?.().toISOString() ?? null,
    };
  });
}
