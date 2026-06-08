import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCollection, saveDocument, getFirestoreDoc } from "../lib/firebase.js";
import { ensureDriveFolder } from "../lib/drive.js";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const includeDeleted = String(req.query.includeDeleted || "").toLowerCase() === "true" || String(req.query.includeDeleted || "").trim() === "1";
      const patients = await listCollection("patients");
      const filteredPatients = includeDeleted ? patients : patients.filter((p: any) => !p.isDeleted);
      filteredPatients.sort((a: any, b: any) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      return res.json(filteredPatients);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const existing = await listCollection("patients");
      const id = req.body.id || newId("pat");
      const now = new Date().toISOString();
      const record = {
        ...req.body,
        id,
        auto_id: req.body.auto_id || `PT-${String(existing.length + 1).padStart(3, "0")}`,
        createdAt: req.body.createdAt || now,
        updatedAt: now,
      };
      record.driveFolderId = await ensureDriveFolder(record);
      return res.json(await saveDocument("patients", id, record));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}