import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteDocument, getFirestoreDoc } from "../../lib/firebase.js";
import { deleteDriveFile } from "../../lib/drive.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const id = String(req.query.id || "");
    const file = await getFirestoreDoc("files", id);
    if (!file) return res.status(404).json({ error: "File not found." });
    if (file.driveFileId) await deleteDriveFile(file.driveFileId);
    await deleteDocument("files", id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
