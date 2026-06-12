import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestoreDoc, deleteDocument } from "../../../../server-lib/firebase.js";
import { wipePatientAssets } from "../../../../server-lib/drive.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      const patient = await getFirestoreDoc("patients", id as string);
      if (!patient) return res.status(404).json({ error: "Patient not found." });
      if (!patient.isDeleted) return res.status(400).json({ error: "Patient must be moved to trash before permanent deletion." });

      await wipePatientAssets(patient);
      await deleteDocument("patients", id as string);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
