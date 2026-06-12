import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCollection, saveDocument, getFirestoreDoc } from "../firebase.js";
import { ensureDriveFolder, uploadToDrive } from "../drive.js";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      return res.json(await listCollection("files"));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const patient = await getFirestoreDoc("patients", req.body.patientId);
      if (!patient) return res.status(404).json({ error: "Patient record not found." });
      
      const folderId = await ensureDriveFolder(patient);
      const driveFile = await uploadToDrive(req.body, folderId);
      
      const id = newId("file");
      const metadata = {
        id,
        patientId: req.body.patientId,
        name: req.body.name,
        mimeType: req.body.mimeType,
        size: Number(driveFile.size || req.body.size || 0),
        uploadDate: new Date().toISOString().split("T")[0],
        extracted: Boolean(req.body.extracted),
        driveFileId: driveFile.id,
        driveFolderId: folderId,
        webViewLink: driveFile.webViewLink || "",
        webContentLink: driveFile.webContentLink || "",
      };
      
      return res.json(await saveDocument("files", id, metadata));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
