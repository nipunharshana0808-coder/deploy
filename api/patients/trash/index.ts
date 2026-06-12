import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCollection, saveDocument, getFirestoreDoc, deleteDocument } from "../../../server-lib/firebase.js";
import { wipePatientAssets } from "../../../server-lib/drive.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const patients = await listCollection("patients");
      const deletedPatients = patients.filter((p: any) => p.isDeleted);
      deletedPatients.sort((a: any, b: any) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      return res.json(deletedPatients);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const patients = await listCollection("patients");
      const deletedPatients = patients.filter((p: any) => p.isDeleted);

      for (const patient of deletedPatients) {
        await wipePatientAssets(patient);
        await deleteDocument("patients", patient.id);
      }

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
