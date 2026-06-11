import { GoogleGenAI } from "@google/genai";

const primaryGeminiKey = process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY || "";
const secondaryGeminiKey = process.env.GEMINI_API_KEY_SECONDARY || "";
const primaryGeminiModel = process.env.GEMINI_MODEL_PRIMARY || "gemini-2.0-flash-lite";
const secondaryGeminiModel = process.env.GEMINI_MODEL_SECONDARY || "gemini-2.0-flash-lite";

export const oncologyOptions = [
  "Oral cavity", "Gall bladder", "Renal", "Vaginal", "Parotid", "Pancreas", "Adrenals", "Sarcoma",
  "Esophagus", "Biliary tree", "Bladder", "Bone", "Gastric", "Spleen", "Urethra", "Skin",
  "Small bowel", "Breast", "Prostate", "Mandibular", "Large bowel", "Thyroid", "Ovary",
  "Submandibular", "Rectal", "Lung", "Fallopian tubes", "Liver", "Heart", "Uterus / cervix", "Other",
];

function firstNonEmpty(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

export function normalizeExtraction(data: Record<string, any>) {
  data.tp = firstNonEmpty(
    data.tp, data.TP, data.telephone, data.telephone_number,
    data.phone, data.phone_number, data.mobile, data.mobile_number,
    data.contact, data.contact_number
  ) || "";

  data.living_area = firstNonEmpty(
    data.living_area, data.living, data.living_address, data.address,
    data.home_address, data.residential_address, data.residence,
    data.location, data.area, data.town, data.village
  ) || "";

  const searchable = [
    data.oncology, data.oncology_other, data.final_diagnosis,
    data.provisional_diagnosis,
    ...(Array.isArray(data.oncology_types) ? data.oncology_types : []),
  ].filter(Boolean).join(" ").toLowerCase();

  const rawOncologyTypes = [
    data.oncology,
    ...(Array.isArray(data.oncology_types) ? data.oncology_types : String(data.oncology_types || "").split(/[,;/+&]|\band\b/i)),
  ].filter(Boolean).map((item: string) => String(item).trim()).filter(Boolean);

  const matchedTypes = oncologyOptions.filter((option) => option !== "Other" && searchable.includes(option.toLowerCase()));
  const otherTypes = rawOncologyTypes.filter((item: string) => {
    if (oncologyOptions.includes(item)) return false;
    return !matchedTypes.some((option) => item.toLowerCase().includes(option.toLowerCase()));
  });

  data.oncology_types = Array.from(new Set([...matchedTypes, ...rawOncologyTypes.filter((item: string) => oncologyOptions.includes(item))]));
  if (otherTypes.length > 0 || data.oncology_types.length === 0) {
    data.oncology_types.push("Other");
  }
  data.oncology_types = Array.from(new Set(data.oncology_types));
  data.oncology = data.oncology_types.find((item: string) => item !== "Other") || "Other";
  if (otherTypes.length > 0) {
    data.oncology_other = [data.oncology_other, otherTypes.join(", ")].filter(Boolean).join(", ");
  }
  return data;
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1]);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("Gemini did not return a JSON object.");
}

async function discoverModelsViaRest(apiKey: string, apiVersion: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`
    );
    const data: any = await response.json();
    if (data.models && Array.isArray(data.models)) {
      return data.models
        .filter((m: any) => m.supportedMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));
    }
  } catch (_) {
    // REST discovery failed, will use hardcoded fallback
  }
  return [];
}

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-image-preview",
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-lite-preview-09-2025",
  "gemini-2.5-flash",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-preview-09-2025",
  "gemini-2.5-pro",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.0-pro-exp",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-pro-exp",
  "gemini-pro",
  "gemini-1.0-pro",
];

export async function runGemini(contents: any, systemInstruction?: string, responseMimeType?: string) {
  const attempts = [
    { key: primaryGeminiKey, model: primaryGeminiModel },
    { key: secondaryGeminiKey, model: secondaryGeminiModel },
  ].filter((x) => x.key);

  if (attempts.length === 0) {
    throw new Error("No Gemini API keys configured.");
  }

  const apiVersions = ["v1beta", "v1"];
  let lastError: any;

  // Phase 1: Try each configured model with v1beta then v1
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      try {
        const ai = new GoogleGenAI({ apiKey: attempt.key, apiVersion });
        const modelName = attempt.model.replace(/^models\//, "");
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction, responseMimeType },
        });
        return response.text || "";
      } catch (error: any) {
        lastError = error;
      }
    }
  }

  // Phase 2: Discover models via REST API and try each
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      const discovered = await discoverModelsViaRest(attempt.key, apiVersion);
      for (const model of discovered) {
        try {
          const ai = new GoogleGenAI({ apiKey: attempt.key, apiVersion });
          const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction, responseMimeType },
          });
          return response.text || "";
        } catch (error: any) {
          lastError = error;
        }
      }
    }
  }

  // Phase 3: Hardcoded comprehensive fallback list
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      for (const model of FALLBACK_MODELS) {
        try {
          const ai = new GoogleGenAI({ apiKey: attempt.key, apiVersion });
          const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction, responseMimeType },
          });
          return response.text || "";
        } catch (error: any) {
          lastError = error;
        }
      }
    }
  }

  throw lastError || new Error("No usable Gemini models found.");
}
