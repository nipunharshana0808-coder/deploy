/**
 * Case normalization for clinical data values.
 *
 * Problem: AI extraction preserves whatever case the source document uses.
 * Hospital names and addresses are often ALL CAPS from letterheads, while
 * medical acronyms (CT, MRI, HER2, FISH) MUST stay uppercase.
 *
 * Solution: word-level tokenization with an acronym allowlist.
 *   - If a word is a known medical acronym → preserve uppercase.
 *   - If a word is ALL CAPS (and not an acronym) → convert to title case.
 *   - If a word is mixed case → preserve as-is (user already chose the case).
 *   - Numbers, dates, units → preserved verbatim.
 */

const ROMAN_NUMERALS = new Set<string>([
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
]);

const TITLE_HONORIFICS = new Set<string>([
  "MR", "MRS", "MS", "MISS", "DR", "PROF", "REV", "HON", "SIR", "DAME",
]);

const MEDICAL_ACRONYMS = new Set<string>([
  // Imaging modalities
  "CT", "MRI", "PET", "US", "USS", "XR", "XRAY", "EUS", "MRA", "CTA", "DSA",
  "MRS", // Magnetic Resonance Spectroscopy
  // Pathology / molecular
  "FISH", "IHC", "NGS", "PCR", "HPF", "FFPE", "ER", "PR", "HER2", "HER",
  "PDL1", "PDL", "EGFR", "ALK", "ROS1", "BRAF", "KRAS", "NRAS", "MSI", "MSS",
  "DMMR", "PMMR", "BRCA", "MGMT", "IDH", "TMB", "MMR",
  // Surgical / clinical
  "TNBC", "DLBCL", "GIST", "EBV", "AML", "ALL", "CML", "CLL", "MDS", "MPN",
  "FL", "MCL", "MALT", "HL", "NHL", "NSCLC", "SCLC", "HCC", "PDAC", "RCC",
  "GI", "GIT", "GU", "GYN", "ENT", "CNS", "PNS", "MSK", "GUS",
  "TURP", "TURBT", "POD", "DVT", "PE", "DIC", "ARDS", "AKI", "CKD",
  // Staging / scoring
  "TNM", "FIGO", "ECOG", "KPS", "BMI", "BSA", "LVEF", "VAF", "AJCC", "ASA",
  "BMT", "PBSC", "PS", "CR", "PR", "SD", "PD", "GCS", "GLEASON",
  "TIS", "TX", "T0", "T1", "T2", "T3", "T4", "N0", "N1", "N2", "N3",
  "M0", "M1", "M1A", "M1B", "M1C",
  // Guidelines / systems
  "NCCN", "ESMO", "ASCO", "ASTRO", "ASH", "CAP", "NCI", "WHO", "ICD", "SNOMED",
  "HIPAA", "GDPR", "FDA", "EMA", "IRB", "CRO",
  // Labs / vitals
  "CBC", "CMP", "LFT", "RFT", "KFT", "TFT", "PSA", "CEA", "AFP",
  "WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "RDW", "PLT", "MPV",
  "AST", "ALT", "ALP", "GGT", "LDH", "BUN", "ESR", "CRP", "INR", "PT", "PTT",
  "TSH", "T3", "T4", "FT3", "FT4", "HIV", "HBV", "HCV", "HPV", "EBV", "CMV",
  "HB", "HBA1C", "A1C", "BMP",
  // Therapies / drugs (common abbreviations)
  "AC", "TC", "FOLFOX", "FOLFIRI", "FOLFOXIRI", "XELOX", "CAPOX", "EC", "FAC",
  "FEC", "CMF", "ABVD", "BEACOPP", "CHOP", "RCHOP", "CVP", "RICE", "DHAP",
  "GDP", "MINE", "ESHAP", "ICE", "IEV", "TCH", "ACT", "TAC",
  // Routes / schedules
  "IV", "IM", "SC", "IT", "PO", "PR", "NG", "PEG", "TPN", "NGT",
  "ICU", "CCU", "HDU", "OT", "OR", "PACU", "ER", "OPD", "IPD",
  "BID", "TID", "QID", "QHS", "QOD", "PRN", "STAT", "PC",
  // Day-to-day / general
  "PA", "NP", "RN", "MD", "DO", "MBBS", "PHD", "DDS",
  "USA", "UK", "EU", "UN", "UAE",
  "PIN", "NIC", "BHT", "BPH", "DOB", "MRN", "EMR", "EHR", "HIS",
  "BP", "HR", "RR", "SPO2", "O2", "CO2", "H2O", "IVF", "IVP",
  "PVT", "LTD", "INC", "LLC", "PLC", "GMBH", "GMR", "MRS",
  "VS", "ET", "AL",
  "T", "N", "M", // single-letter TNM components when standalone
]);

const ACRONYM_PLACEHOLDER = "\u0000ACR\u0000";

function isAllCapsWord(word: string): boolean {
  if (!word) return false;
  const letters = word.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;
  return letters === letters.toUpperCase();
}

function toTitleCase(word: string): string {
  if (!word) return word;
  const first = word.charAt(0).toUpperCase();
  const rest = word.slice(1).toLowerCase();
  return first + rest;
}

function normalizeToken(token: string): string {
  if (!token) return token;
  const stripped = token.replace(/[^A-Za-z]/g, "");
  if (!stripped) return token;
  const upper = stripped.toUpperCase();

  // Mixed alphanumeric tokens (T2N1M0, HER2+, 3+4=7) are clinical
  // codes / scores — preserve the user's exact form.
  if (stripped.length !== token.length) {
    return token;
  }

  // Honorifics (MR, MRS, DR, etc.) → Title case (Mr, Mrs, Dr)
  if (TITLE_HONORIFICS.has(upper)) {
    return toTitleCase(upper);
  }
  // Medical acronyms → preserve uppercase
  if (MEDICAL_ACRONYMS.has(upper)) {
    return upper;
  }
  // Roman numerals (I, II, III, IV) → preserve uppercase
  if (ROMAN_NUMERALS.has(upper)) {
    return upper;
  }
  // All-caps words not in any list → Title case
  if (isAllCapsWord(stripped)) {
    return toTitleCase(stripped);
  }
  return token;
}

/**
 * Normalize a clinical free-text value.
 *
 * Rules:
 * 1. Preserve known medical acronyms in uppercase.
 * 2. Convert ALL-CAPS words to title case (e.g. "DRLOGY" -> "Drlogy").
 * 3. Preserve mixed-case words verbatim (the user already chose).
 * 4. Preserve numbers, dates, units, and punctuation.
 * 5. Preserve the original whitespace and structure.
 *
 * Examples:
 *   normalizeCase("DRLOGY IMAGING CENTER") -> "Drlogy Imaging Center"
 *   normalizeCase("CT scan abdomen")        -> "CT scan abdomen"
 *   normalizeCase("HER2 3+")                -> "HER2 3+"
 *   normalizeCase("105-108, SMART VISION")  -> "105-108, Smart Vision"
 *   normalizeCase("FISH amplified")         -> "FISH amplified"
 *   normalizeCase("Drlogy Imaging Center")  -> "Drlogy Imaging Center" (unchanged)
 */
export function normalizeCase(input: string | null | undefined): string {
  if (!input) return input ?? "";
  const text = String(input);
  if (!text.trim()) return text;
  const tokens = text.split(/(\s+|[-,./()\[\]{}|])/);
  const out = tokens.map((t) => {
    if (!t) return t;
    if (/^\s+$/.test(t)) return t;
    if (/^[-.,./()\[\]{}|]$/.test(t)) return t;
    return normalizeToken(t);
  });
  return out.join("");
}

const FIELD_ALLOWLIST: ReadonlyArray<string> = [
  "title", "first_name", "last_name", "initials",
  "occupation", "marital_status",
  "bht", "clinic", "hospital", "living_area", "nic", "tp",
  "regid", "auto_id",
  "provisional_diagnosis", "final_diagnosis",
  "oncology", "oncology_other", "overall_stage", "tnm_stage",
  "presenting_complaints", "comorbidity",
] as const;

const STRING_TABLE_FIELDS: ReadonlyArray<string> = [
  "comorbidity", "relationship", "family_notes",
  "risk_factor", "risk_notes",
  "surgery_name", "surgery_site", "surgery_approach", "surgery_findings", "surgery_notes",
  "complication", "management", "notes",
  "monitor_param", "monitor_findings", "monitor_notes",
  "icu_mgmt", "icu_notes", "ward_mgmt", "ward_notes",
  "biopsy_type", "biopsy_parameter", "biopsy_findings", "biopsy_grade", "biopsy_stage",
  "imaging_type", "imaging_purpose", "imaging_parameter", "imaging_findings", "imaging_impression",
  "marker_name",
  "drug_name",
  "neo_radio_comp", "neo_radio_effects", "adj_radio_comp", "adj_radio_effects",
  "neo_chemo_comp", "neo_chemo_effects", "adj_chemo_comp", "adj_chemo_effects",
  "detail_heading", "detail_subheading", "detail_label", "detail_value", "detail_unit",
  "detail_category", "detail_source", "detail_notes",
  "source_column",
];

export function normalizePatientData<T extends Record<string, any>>(patient: T): T {
  if (!patient || typeof patient !== "object") return patient;
  const out: any = { ...patient };
  for (const key of FIELD_ALLOWLIST) {
    if (typeof out[key] === "string") {
      out[key] = normalizeCase(out[key]);
    }
  }
  for (const tableKey of [
    "drugTable", "familyTable", "riskTable", "bloodTable", "tumorMarkersTable",
    "imagingTable", "biopsyTable", "ihcTable", "surgeryTable", "complicationTable",
    "monitoringTable", "icuTable", "wardTable", "neoChemoTable", "adjChemoTable",
    "neoRadioTable", "adjRadioTable", "unmapped_medical_information",
  ]) {
    const arr = out[tableKey];
    if (Array.isArray(arr)) {
      out[tableKey] = arr.map((row: any) => {
        if (!row || typeof row !== "object") return row;
        const newRow = { ...row };
        for (const f of STRING_TABLE_FIELDS) {
          if (typeof newRow[f] === "string") {
            newRow[f] = normalizeCase(newRow[f]);
          }
        }
        return newRow;
      });
    }
  }
  return out;
}
