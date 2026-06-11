import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCollection, saveDocument, getFirestoreDoc, deleteDocument } from "../../lib/firebase.js";
import { ensureDriveFolder, wipePatientAssets } from "../../lib/drive.js";
import { adaptPatientForNewUi } from "../../lib/patient-schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const patient = await getFirestoreDoc("patients", id as string);
      if (!patient) return res.status(404).json({ error: "Patient not found." });
      return res.json(adaptPatientForNewUi(patient));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const now = new Date().toISOString();
      const record = { ...req.body, id, patient_id: id, updated_at: now, updatedAt: now };
      record.driveFolderId = await ensureDriveFolder(record);
      return res.json(await saveDocument("patients", id as string, record));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const patient = await getFirestoreDoc("patients", id as string);
      if (!patient) return res.status(404).json({ error: "Patient not found." });

      if (patient.isDeleted) {
        await wipePatientAssets(patient);
        await deleteDocument("patients", id as string);
        return res.json({ success: true, permanent: true });
      } else {
        await saveDocument("patients", id as string, { 
          ...patient, 
          isDeleted: true, 
          updatedAt: new Date().toISOString() 
        });
        return res.json({ success: true, permanent: false });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
