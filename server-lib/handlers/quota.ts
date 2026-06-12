import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const primaryGeminiKey = process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY;
  const secondaryGeminiKey = process.env.GEMINI_API_KEY_SECONDARY;
  const configuredKeys = [primaryGeminiKey, secondaryGeminiKey].filter(Boolean).length;

  return res.json({
    configuredKeys,
    quotaLimit: 3000 + (secondaryGeminiKey ? 1500 : 0),
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: configuredKeys ? "Active" : "No Gemini key configured",
  });
}
