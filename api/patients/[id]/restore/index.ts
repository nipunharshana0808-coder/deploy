import type { VercelRequest, VercelResponse } from "@vercel/node";
import { saveDocument, getFirestoreDoc } from "../../../lib/firebase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === "POST") {
    try {
      const patient = await getFirestoreDoc("patients", id as string);
      if (!patient || !patient.isDeleted) return res.status(404).json({ error: "Deleted patient not found." });

      await saveDocument("patients", id as string, { ...patient, isDeleted: false, updatedAt: new Date().toISOString() });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}