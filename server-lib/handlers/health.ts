import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const firebaseProjectId = process.env.FIREBASE_WEB_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const firebaseServiceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const driveFolderId = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.VITE_DRIVE_ROOT_FOLDER_ID;
    const primaryGeminiKey = process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY;
    const secondaryGeminiKey = process.env.GEMINI_API_KEY_SECONDARY;
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

    let firebaseServiceAccount = null;
    if (firebaseServiceAccountRaw) {
      try {
        firebaseServiceAccount = JSON.parse(firebaseServiceAccountRaw);
      } catch {}
    }

    return res.json({
      ok: true,
      firestore: Boolean(firebaseProjectId && firebaseServiceAccount),
      drive: Boolean(driveFolderId && (driveRefreshToken || (driveClientId && driveClientSecret) || firebaseServiceAccount)),
      gemini: Boolean(primaryGeminiKey || secondaryGeminiKey),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}