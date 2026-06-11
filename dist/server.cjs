var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default,
  startServer: () => startServer
});
module.exports = __toCommonJS(server_exports);
var import_crypto = __toESM(require("crypto"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");

// api/lib/patient-schema.ts
var splitValues = (value) => String(value || "").split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
function adaptPatientForNewUi(patient) {
  if (!patient || patient.patient_id) return patient;
  const updatedDate = String(patient.updatedAt || patient.createdAt || "").slice(0, 10);
  const firstChemo = (rows) => rows?.[0] || {};
  const firstRadio = (rows) => rows?.[0] || {};
  return {
    ...patient,
    patient_id: patient.id,
    record_id: patient.auto_id || patient.id,
    consent_taken: true,
    consent_date: patient.date || updatedDate,
    bht_no: patient.bht || "",
    clinic_no: patient.clinic || "",
    tp_countryCode: patient.tp_countryCode || "+94",
    oncology_type: patient.oncology_types?.length ? patient.oncology_types : [patient.oncology || "Other"],
    other_oncology_type: patient.oncology_other || "",
    age_display: String(patient.age || ""),
    hospital_location: patient.hospital || "",
    hospital_type: "",
    hospital_name: patient.hospital || "",
    presenting_complaints: patient.presenting_complaints ? [{ complaint_name: patient.presenting_complaints, duration: "", notes: "" }] : [],
    comorbidities: splitValues(patient.comorbidity).map((comorbidity_name) => ({ comorbidity_name, duration: "", notes: "" })),
    hospital_admissions: patient.hospital_admissions ? [{ admission_no: "", reason: patient.hospital_admissions, date: "", notes: "" }] : [],
    past_surgeries: patient.past_surgical_history ? [{ procedure_name: patient.past_surgical_history, complications: "", notes: "" }] : [],
    drug_history: (patient.drugTable || []).filter((row) => row.drug_name).map((row) => ({
      drug_name: row.drug_name || "",
      dose: row.dose || "",
      frequency: row.frequency || "",
      route: row.route || "",
      duration: row.duration || "",
      notes: row.notes || ""
    })),
    family_history: (patient.familyTable || []).filter((row) => row.comorbidity).map((row) => ({
      morbidity_name: row.comorbidity || "",
      relationship: row.relationship || "",
      notes: row.family_notes || ""
    })),
    risk_factors: (patient.riskTable || []).filter((row) => row.risk_factor).map((row) => ({
      risk_factor_name: row.risk_factor || "",
      notes: row.risk_notes || ""
    })),
    examination_findings: [
      ...patient.height ? [{ examination_type: "Height", date: patient.date || "", findings: patient.height }] : [],
      ...patient.weight ? [{ examination_type: "Weight", date: patient.date || "", findings: patient.weight }] : [],
      ...patient.bmi ? [{ examination_type: "BMI", date: patient.date || "", findings: patient.bmi }] : [],
      ...patient.bsa ? [{ examination_type: "BSA", date: patient.date || "", findings: patient.bsa }] : [],
      ...(patient.examFindingsTable || []).filter((row) => row.findings).map((row) => ({
        examination_type: "Organ System",
        organ_system_name: row.organ_system || "",
        date: patient.date || "",
        findings: [row.findings, row.notes].filter(Boolean).join(" - ")
      }))
    ],
    problems: (patient.problemTable || []).filter((row) => row.problem).map((row) => ({
      problem_name: row.problem || "",
      management_plan: row.management_plan || ""
    })),
    usual_prescriptions: (patient.commonDrugsTable || []).filter((row) => row.common_drug).map((row) => ({
      drug_name: row.common_drug || "",
      dose: row.common_dose || "",
      frequency: row.common_frequency || "",
      duration: "",
      notes: row.common_drug_notes || ""
    })),
    allergies: {
      foods: splitValues(patient.allergy_food),
      drugs: splitValues(patient.allergy_drugs),
      plasters: splitValues(patient.allergy_plasters),
      others: splitValues(patient.allergy_other)
    },
    social_history: {
      smoking: { status: patient.smoking || "Non consumer", amounts: patient.smoking_amount || "" },
      alcohol: { status: patient.alcohol || "Non consumer", amounts: patient.alcohol_amount || "" }
    },
    other_notes: patient.general_notes || "",
    investigations: {
      imaging: (patient.imagingTable || []).map((row) => ({
        modality: row.imaging_type || "",
        date: "",
        mass_present: row.mass_present || "No",
        mass_size: row.mass_size || "",
        reporting_system_status: [row.lymph_nodes, row.metastasis].filter(Boolean).join("; "),
        findings: [row.imaging_findings, row.mass_location, row.calcifications, row.ascites, row.pv_status, row.sma_status].filter(Boolean).join("; "),
        purpose: row.imaging_purpose || ""
      })),
      biopsies: (patient.biopsyTable || []).map((row) => ({
        biopsy_type: row.biopsy_type || "",
        date: "",
        pathology_status: row.biopsy_stage || row.cell_type || "",
        findings: [row.biopsy_findings, row.margin_status, row.lvi, row.perineural_invasion, row.lymph_nodes, row.metastasis].filter(Boolean).join("; "),
        purpose: row.biopsy_purpose || ""
      })),
      endoscopy: (patient.endoscopyTable || []).map((row) => ({
        procedure_type: row.endo_type || "",
        date: "",
        findings: [row.endo_parameter, row.endo_findings].filter(Boolean).join("; "),
        biopsy_taken: "No",
        purpose: row.endo_purpose || ""
      })),
      ihc: (patient.immunohistochemistryTable || []).map((row) => ({
        marker_name: row.ihc_marker || "",
        status: row.ihc_result || "",
        intensity: row.ihc_intensity || "",
        notes: [row.ihc_score, row.ihc_percentage, row.ihc_interpretation, row.ihc_notes].filter(Boolean).join("; "),
        purpose: row.ihc_panel || ""
      })),
      genetic: [],
      tumour_markers: (patient.tumorMarkersTable || []).map((row) => ({
        marker_name: row.marker_name || "",
        value: row.marker_value || "",
        unit: row.marker_unit || "",
        date: row.marker_date || "",
        reference_range: row.marker_ref_range || "",
        purpose: row.marker_notes || ""
      })),
      others: (patient.otherInvTable || []).map((row) => ({
        investigation_type: row.otherinv_type || "",
        date: "",
        findings: [row.otherinv_parameter, row.otherinv_findings].filter(Boolean).join("; "),
        purpose: row.otherinv_purpose || ""
      }))
    },
    neo_adjuvant_chemotherapy: {
      status: patient.neo_chemo_status === "Done" ? "Done" : "Not done",
      drug_name: firstChemo(patient.neoChemoTable).neo_chemo_drug || "",
      dose: firstChemo(patient.neoChemoTable).neo_chemo_dose || "",
      frequency: firstChemo(patient.neoChemoTable).neo_chemo_freq || "",
      route: firstChemo(patient.neoChemoTable).neo_chemo_route || "",
      duration: firstChemo(patient.neoChemoTable).neo_chemo_cycles || "",
      adverse_effects: firstChemo(patient.neoChemoTable).neo_chemo_effects || "",
      notes: firstChemo(patient.neoChemoTable).neo_chemo_notes || ""
    },
    adjuvant_chemotherapy: {
      status: patient.adj_chemo_status === "Done" ? "Done" : "Not done",
      drug_name: firstChemo(patient.adjChemoTable).neo_chemo_drug || "",
      dose: firstChemo(patient.adjChemoTable).neo_chemo_dose || "",
      frequency: firstChemo(patient.adjChemoTable).neo_chemo_freq || "",
      route: firstChemo(patient.adjChemoTable).neo_chemo_route || "",
      duration: firstChemo(patient.adjChemoTable).neo_chemo_cycles || "",
      adverse_effects: firstChemo(patient.adjChemoTable).neo_chemo_effects || "",
      notes: firstChemo(patient.adjChemoTable).neo_chemo_notes || ""
    },
    neo_adjuvant_radiotherapy: {
      status: patient.neo_radio_status === "Done" ? "Done" : "Not done",
      site: firstRadio(patient.neoRadioTable).neo_radio_comp || "",
      dose: firstRadio(patient.neoRadioTable).neo_radio_dose || "",
      frequency: firstRadio(patient.neoRadioTable).neo_radio_freq || "",
      approach: firstRadio(patient.neoRadioTable).neo_radio_route || "",
      cycles: firstRadio(patient.neoRadioTable).neo_radio_cycles || "",
      adverse_effects: firstRadio(patient.neoRadioTable).neo_radio_effects || "",
      notes: firstRadio(patient.neoRadioTable).neo_radio_notes || "",
      sessions: []
    },
    adjuvant_radiotherapy: {
      status: patient.adj_radio_status === "Done" ? "Done" : "Not done",
      site: firstRadio(patient.adjRadioTable).neo_radio_comp || "",
      dose: firstRadio(patient.adjRadioTable).neo_radio_dose || "",
      frequency: firstRadio(patient.adjRadioTable).neo_radio_freq || "",
      approach: firstRadio(patient.adjRadioTable).neo_radio_route || "",
      cycles: firstRadio(patient.adjRadioTable).neo_radio_cycles || "",
      adverse_effects: firstRadio(patient.adjRadioTable).neo_radio_effects || "",
      notes: firstRadio(patient.adjRadioTable).neo_radio_notes || "",
      sessions: []
    },
    surgeries: (patient.surgeryTable || []).map((row) => ({
      procedure_name: row.surgery_name || "",
      surgery_site: row.surgery_site || "",
      done_date: row.surgery_date || "",
      approach: row.surgery_approach || "",
      icu_entered: patient.icu_done === "Done" ? "Yes" : "No",
      icu_entry_date: patient.icuTable?.[0]?.icu_date || "",
      icu_exit_date: patient.icuTable?.[0]?.icu_exit || "",
      icu_management_notes: patient.icuTable?.[0]?.icu_mgmt || "",
      after_surgery_ward_entry_date: patient.wardTable?.[0]?.ward_entry || "",
      after_surgery_discharged_date: patient.wardTable?.[0]?.ward_exit || "",
      ward_management_notes: patient.wardTable?.[0]?.ward_mgmt || "",
      margin_status: row.margin_status || "",
      complications: (patient.complicationTable || []).map((item) => ({
        complication_name: item.complication || "",
        significant_amount: "",
        duration: item.post_op_duration || "",
        notes: [item.management, item.notes].filter(Boolean).join("; ")
      })),
      monitoring: (patient.monitoringTable || []).map((item) => ({
        post_op_day_no: item.monitor_duration || "",
        parameter: item.monitor_param || "",
        findings: [item.monitor_findings, item.monitor_notes].filter(Boolean).join("; ")
      })),
      other_surgical_notes: [row.surgery_findings, row.surgery_notes].filter(Boolean).join("; ")
    })),
    staging_details: patient.staging_details?.length ? patient.staging_details : [{ staging_system_name: patient.tnm_stage ? "TNM" : "Other", overall_stage: patient.overall_stage || patient.tnm_stage || "", staging_notes: "" }],
    histological_staging_details: patient.histological_staging_details || [],
    follow_up_notes: patient.follow_up_notes ? [{ date: updatedDate, findings: [String(patient.follow_up_notes)] }] : [],
    created_at: patient.createdAt || "",
    updated_at: patient.updatedAt || "",
    audit_trail: patient.audit_trail || []
  };
}

// server.ts
import_dotenv.default.config({ path: ".env.clean" });
import_dotenv.default.config({ path: ".ene.new" });
import_dotenv.default.config();
var clientEnvAliases = {
  VITE_FIREBASE_API_KEY: "FIREBASE_WEB_API_KEY",
  VITE_FIREBASE_AUTH_DOMAIN: "FIREBASE_WEB_AUTH_DOMAIN",
  VITE_FIREBASE_PROJECT_ID: "FIREBASE_WEB_PROJECT_ID",
  VITE_FIREBASE_APP_ID: "FIREBASE_WEB_APP_ID"
};
for (const [viteKey, legacyKey] of Object.entries(clientEnvAliases)) {
  if (!process.env[viteKey] && process.env[legacyKey]) {
    process.env[viteKey] = process.env[legacyKey];
  }
}
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT || 3e3);
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var geminiRequestCount = 0;
var env = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return "";
};
var firebaseProjectId = env("FIREBASE_WEB_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID");
var driveFolderId = env("DRIVE_FOLDER_ID", "GOOGLE_DRIVE_FOLDER_ID", "VITE_DRIVE_ROOT_FOLDER_ID");
var primaryGeminiKey = env("GEMINI_API_KEY_PRIMARY", "GEMINI_API_KEY");
var secondaryGeminiKey = env("GEMINI_API_KEY_SECONDARY");
var primaryGeminiModel = env("GEMINI_MODEL_PRIMARY") || "gemini-2.0-flash-lite";
var secondaryGeminiModel = env("GEMINI_MODEL_SECONDARY") || "gemini-2.0-flash-lite";
function parseServiceAccount(raw) {
  const readFromLocalEnvNew = () => {
    try {
      const file = import_fs.default.readFileSync(import_path.default.join(process.cwd(), ".ene.new"), "utf8");
      const match = file.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(\{[\s\S]*?\n\})\n#/);
      return match?.[1] || "";
    } catch {
      return "";
    }
  };
  if (!raw || raw === "{") raw = readFromLocalEnvNew();
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/\n/g, "\\n").replace(/\\n/g, "\n"));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      const fallback = readFromLocalEnvNew();
      return fallback ? JSON.parse(fallback) : null;
    }
  }
}
var firebaseServiceAccount = parseServiceAccount(env("FIREBASE_SERVICE_ACCOUNT_JSON"));
firebaseProjectId = firebaseServiceAccount?.project_id || firebaseProjectId;
var firebaseCredentialError = "";
if (firebaseServiceAccount?.private_key) {
  try {
    import_crypto.default.createPrivateKey(firebaseServiceAccount.private_key);
  } catch {
    firebaseCredentialError = "FIREBASE_SERVICE_ACCOUNT_JSON contains an invalid or placeholder private_key. Download a real Firebase Admin SDK service-account JSON file and replace the complete environment variable value.";
  }
}
function base64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function getGoogleAccessToken(scope) {
  if (firebaseCredentialError) {
    throw new Error(firebaseCredentialError);
  }
  if (!firebaseServiceAccount?.client_email || !firebaseServiceAccount?.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for Firestore server access.");
  }
  const now = Math.floor(Date.now() / 1e3);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: firebaseServiceAccount.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  }));
  const unsigned = `${header}.${claim}`;
  const signature = import_crypto.default.createSign("RSA-SHA256").update(unsigned).sign(firebaseServiceAccount.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  if (!response.ok) throw new Error(`Google auth failed: ${await response.text()}`);
  return (await response.json()).access_token;
}
async function getDriveAccessToken() {
  const refreshToken = env("GOOGLE_DRIVE_REFRESH_TOKEN");
  const clientId = env("GOOGLE_DRIVE_CLIENT_ID");
  const clientSecret = env("GOOGLE_DRIVE_CLIENT_SECRET");
  if (refreshToken && clientId && clientSecret) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });
    if (!response.ok) throw new Error(`Drive OAuth refresh failed: ${await response.text()}`);
    return (await response.json()).access_token;
  }
  return getGoogleAccessToken("https://www.googleapis.com/auth/drive");
}
function encodeFirestoreValue(value) {
  if (value === null || value === void 0) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeFirestoreValue(v)])) } };
  }
  return { stringValue: String(value) };
}
function decodeFirestoreValue(value) {
  if (!value) return "";
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ("mapValue" in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]));
  }
  return "";
}
async function firestoreFetch(pathname, init = {}) {
  if (!firebaseProjectId) throw new Error("FIREBASE_WEB_PROJECT_ID or VITE_FIREBASE_PROJECT_ID is required.");
  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/datastore");
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${pathname}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers || {}
    }
  });
  if (!response.ok && response.status !== 404) throw new Error(await response.text());
  return response;
}
function firestoreDocToObject(doc) {
  const id = doc.name.split("/").pop();
  const data = Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]));
  return { ...data, id };
}
async function getFirestoreDoc(collection, id) {
  const response = await firestoreFetch(`${collection}/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return firestoreDocToObject(data);
}
async function listCollection(collection) {
  const response = await firestoreFetch(collection);
  if (response.status === 404) return [];
  const data = await response.json();
  return (data.documents || []).map(firestoreDocToObject);
}
async function saveDocument(collection, id, data) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeFirestoreValue(v)]));
  await firestoreFetch(`${collection}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields })
  });
  return { ...data, id };
}
async function deleteDocument(collection, id) {
  await firestoreFetch(`${collection}/${id}`, { method: "DELETE" });
}
async function ensureDriveFolder(patient) {
  if (patient.driveFolderId) return patient.driveFolderId;
  if (!driveFolderId) throw new Error("DRIVE_FOLDER_ID or GOOGLE_DRIVE_FOLDER_ID is required.");
  const token = await getDriveAccessToken();
  const patientName = [patient.last_name, patient.first_name, patient.initials].filter(Boolean).join("_") || patient.id;
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: patientName.replace(/[^\w .-]/g, "_"),
      mimeType: "application/vnd.google-apps.folder",
      parents: [driveFolderId]
    })
  });
  if (!response.ok) throw new Error(`Drive folder create failed: ${await response.text()}`);
  const folderId = (await response.json()).id;
  if (patient.id) {
    try {
      await saveDocument("patients", patient.id, { ...patient, driveFolderId: folderId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      console.warn(`Could not persist driveFolderId for patient ${patient.id}:`, error);
    }
  }
  return folderId;
}
async function uploadToDrive(payload, folderId) {
  const token = await getDriveAccessToken();
  const base64 = String(payload.contentBase64 || "").replace(/^data:.*?;base64,/, "");
  const metadata = {
    name: payload.name,
    mimeType: payload.mimeType || "application/octet-stream",
    parents: [folderId]
  };
  const boundary = `oncodb_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r
Content-Type: application/json; charset=UTF-8\r
\r
${JSON.stringify(metadata)}\r
`),
    Buffer.from(`--${boundary}\r
Content-Type: ${metadata.mimeType}\r
\r
`),
    Buffer.from(base64, "base64"),
    Buffer.from(`\r
--${boundary}--`)
  ]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!response.ok) throw new Error(`Drive upload failed: ${await response.text()}`);
  return response.json();
}
async function deleteDriveFile(fileId) {
  const token = await getDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true&supportsTeamDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (response.status === 204 || response.status === 404) {
    console.log(`Successfully deleted Drive file: ${fileId}`);
    return;
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Drive file ${fileId}: ${response.status} ${errorText}`);
  }
}
async function recursivelyDeleteDriveFolder(folderId, maxRetries = 3) {
  const token = await getDriveAccessToken();
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const verifyResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true&supportsTeamDrives=true&fields=id,name,mimeType`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (verifyResponse.status === 404) {
        console.log(`Folder ${folderId} already deleted or doesn't exist`);
        return;
      }
      if (!verifyResponse.ok) {
        throw new Error(`Could not verify folder ${folderId}: ${verifyResponse.status}`);
      }
      const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&pageSize=100&supportsAllDrives=true&supportsTeamDrives=true&fields=files(id,mimeType,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!listResponse.ok) {
        console.warn(`Could not list contents of folder ${folderId}: ${listResponse.status}`);
        throw new Error(`Failed to list folder ${folderId}`);
      }
      const listData = await listResponse.json();
      const children = listData.files || [];
      console.log(`Folder ${folderId} has ${children.length} non-trashed children to delete`);
      for (const child of children) {
        try {
          if (child.mimeType === "application/vnd.google-apps.folder") {
            console.log(`  Recursing into subfolder: ${child.name} (${child.id})`);
            await recursivelyDeleteDriveFolder(child.id, maxRetries);
          } else {
            console.log(`  Deleting file: ${child.name} (${child.id})`);
            await deleteDriveFile(child.id);
          }
        } catch (e) {
          console.error(`  Failed to delete child ${child.id}:`, e);
        }
      }
      console.log(`Deleting folder: ${folderId}`);
      await deleteDriveFile(folderId);
      console.log(`Successfully deleted folder ${folderId}`);
      return;
    } catch (e) {
      retryCount++;
      console.error(`Error deleting folder ${folderId} (attempt ${retryCount}/${maxRetries}):`, e);
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2e3 * retryCount));
      } else {
        console.error(`Final failure deleting folder ${folderId} after ${maxRetries} attempts`);
        throw e;
      }
    }
  }
}
async function wipePatientAssets(patient) {
  const files = (await listCollection("files")).filter((file) => file.patientId === patient.id);
  for (const file of files) {
    if (file.driveFileId) {
      try {
        await deleteDriveFile(file.driveFileId);
      } catch (e) {
        console.error(`Failed to delete Drive file ${file.driveFileId} for patient ${patient.id}:`, e);
      }
    }
    await deleteDocument("files", file.id);
  }
  if (patient.driveFolderId) {
    try {
      await deleteDriveFile(patient.driveFolderId);
    } catch (e) {
      console.error(`Failed to delete Drive folder for patient ${patient.id}:`, e);
    }
  }
}
function newId(prefix) {
  return `${prefix}_${import_crypto.default.randomBytes(8).toString("hex")}`;
}
async function discoverModelsViaRest(apiKey, apiVersion) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`
    );
    const data = await response.json();
    if (data.models && Array.isArray(data.models)) {
      return data.models.filter((m) => m.supportedMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
    }
  } catch (_) {
  }
  return [];
}
var FALLBACK_MODELS = [
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
  "gemini-1.0-pro"
];
async function runGemini(contents, systemInstruction, responseMimeType) {
  const attempts = [
    { key: primaryGeminiKey, model: primaryGeminiModel },
    { key: secondaryGeminiKey, model: secondaryGeminiModel }
  ].filter((x) => x.key);
  if (attempts.length === 0) {
    throw new Error("No Gemini API keys configured.");
  }
  const apiVersions = ["v1beta", "v1"];
  let lastError;
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      try {
        const ai = new import_genai.GoogleGenAI({ apiKey: attempt.key, apiVersion });
        const modelName = attempt.model.replace(/^models\//, "");
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction, responseMimeType }
        });
        return response.text || "";
      } catch (error) {
        lastError = error;
      }
    }
  }
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      const discovered = await discoverModelsViaRest(attempt.key, apiVersion);
      for (const model of discovered) {
        try {
          const ai = new import_genai.GoogleGenAI({ apiKey: attempt.key, apiVersion });
          const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction, responseMimeType }
          });
          return response.text || "";
        } catch (error) {
          lastError = error;
        }
      }
    }
  }
  for (const attempt of attempts) {
    for (const apiVersion of apiVersions) {
      for (const model of FALLBACK_MODELS) {
        try {
          const ai = new import_genai.GoogleGenAI({ apiKey: attempt.key, apiVersion });
          const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction, responseMimeType }
          });
          return response.text || "";
        } catch (error) {
          lastError = error;
        }
      }
    }
  }
  throw lastError || new Error("No usable Gemini models found.");
}
function extractJsonObject(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1]);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("Gemini did not return a JSON object.");
}
var oncologyOptions = [
  "Oral cavity",
  "Gall bladder",
  "Renal",
  "Vaginal",
  "Parotid",
  "Pancreas",
  "Adrenals",
  "Sarcoma",
  "Esophagus",
  "Biliary tree",
  "Bladder",
  "Bone",
  "Gastric",
  "Spleen",
  "Urethra",
  "Skin",
  "Small bowel",
  "Breast",
  "Prostate",
  "Mandibular",
  "Large bowel",
  "Thyroid",
  "Ovary",
  "Submandibular",
  "Rectal",
  "Lung",
  "Fallopian tubes",
  "Liver",
  "Heart",
  "Uterus / cervix",
  "Other"
];
function firstNonEmpty(...values) {
  return values.find((value) => value !== void 0 && value !== null && String(value).trim() !== "");
}
function normalizeExtraction(data) {
  data.tp = firstNonEmpty(
    data.tp,
    data.TP,
    data.telephone,
    data.telephone_number,
    data.phone,
    data.phone_number,
    data.mobile,
    data.mobile_number,
    data.contact,
    data.contact_number
  ) || "";
  data.living_area = firstNonEmpty(
    data.living_area,
    data.living,
    data.living_address,
    data.address,
    data.home_address,
    data.residential_address,
    data.residence,
    data.location,
    data.area,
    data.town,
    data.village
  ) || "";
  const searchable = [
    data.oncology,
    data.oncology_other,
    data.final_diagnosis,
    data.provisional_diagnosis,
    ...Array.isArray(data.oncology_types) ? data.oncology_types : []
  ].filter(Boolean).join(" ").toLowerCase();
  const rawOncologyTypes = [
    data.oncology,
    ...Array.isArray(data.oncology_types) ? data.oncology_types : String(data.oncology_types || "").split(/[,;/+&]|\band\b/i)
  ].filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  const matchedTypes = oncologyOptions.filter((option) => option !== "Other" && searchable.includes(option.toLowerCase()));
  const otherTypes = rawOncologyTypes.filter((item) => {
    if (oncologyOptions.includes(item)) return false;
    return !matchedTypes.some((option) => item.toLowerCase().includes(option.toLowerCase()));
  });
  data.oncology_types = Array.from(/* @__PURE__ */ new Set([...matchedTypes, ...rawOncologyTypes.filter((item) => oncologyOptions.includes(item))]));
  if (otherTypes.length > 0 || data.oncology_types.length === 0) {
    data.oncology_types.push("Other");
  }
  data.oncology_types = Array.from(new Set(data.oncology_types));
  data.oncology = data.oncology_types.find((item) => item !== "Other") || "Other";
  if (otherTypes.length > 0) {
    data.oncology_other = [data.oncology_other, otherTypes.join(", ")].filter(Boolean).join(", ");
  }
  return data;
}
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    firestore: Boolean(firebaseProjectId && firebaseServiceAccount && !firebaseCredentialError),
    drive: Boolean(driveFolderId && (env("GOOGLE_DRIVE_REFRESH_TOKEN") || firebaseServiceAccount)),
    gemini: Boolean(primaryGeminiKey || secondaryGeminiKey),
    configurationError: firebaseCredentialError || void 0
  });
});
app.get("/api/patients", async (req, res) => {
  try {
    const includeDeleted = String(req.query.includeDeleted || "").toLowerCase() === "true" || String(req.query.includeDeleted || "").trim() === "1";
    const patients = await listCollection("patients");
    const filteredPatients = includeDeleted ? patients : patients.filter((p) => !p.isDeleted);
    filteredPatients.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    res.json(filteredPatients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/patients/trash", async (_req, res) => {
  try {
    const patients = await listCollection("patients");
    const trashed = patients.filter((p) => p.isDeleted);
    trashed.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    res.json(trashed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/patients/:id", async (req, res) => {
  try {
    const patient = await getFirestoreDoc("patients", req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found." });
    res.json(adaptPatientForNewUi(patient));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/patients/:id/permanent", async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await getFirestoreDoc("patients", id);
    if (!patient) return res.status(404).json({ error: "Patient not found." });
    if (!patient.isDeleted) return res.status(400).json({ error: "Patient must be moved to trash before permanent deletion." });
    await wipePatientAssets(patient);
    await deleteDocument("patients", id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/patients", async (req, res) => {
  try {
    const existing = await listCollection("patients");
    const id = req.body.id || newId("pat");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      ...req.body,
      id,
      patient_id: id,
      auto_id: req.body.auto_id || `PT-${String(existing.length + 1).padStart(3, "0")}`,
      created_at: req.body.created_at || now,
      updated_at: now,
      createdAt: req.body.createdAt || now,
      updatedAt: now
    };
    record.driveFolderId = await ensureDriveFolder(record);
    res.json(await saveDocument("patients", id, record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = { ...req.body, id, patient_id: id, updated_at: now, updatedAt: now };
    record.driveFolderId = await ensureDriveFolder(record);
    res.json(await saveDocument("patients", id, record));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await getFirestoreDoc("patients", id);
    if (!patient) return res.status(404).json({ error: "Patient not found." });
    if (patient.isDeleted) {
      await wipePatientAssets(patient);
      await deleteDocument("patients", id);
      res.json({ success: true, permanent: true });
    } else {
      await saveDocument("patients", id, {
        ...patient,
        isDeleted: true,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ success: true, permanent: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/patients/:id/restore", async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await getFirestoreDoc("patients", id);
    if (!patient || !patient.isDeleted) return res.status(404).json({ error: "Deleted patient not found." });
    await saveDocument("patients", id, { ...patient, isDeleted: false, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/patients/trash/clear", async (_req, res) => {
  try {
    const patients = await listCollection("patients");
    const deletedPatients = patients.filter((p) => p.isDeleted);
    for (const patient of deletedPatients) {
      await wipePatientAssets(patient);
      await deleteDocument("patients", patient.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/files", async (req, res) => {
  try {
    const files = await listCollection("files");
    const patientId = String(req.query.patientId || "");
    res.json(patientId ? files.filter((file) => file.patientId === patientId) : files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/files", async (req, res) => {
  try {
    const patients = await listCollection("patients");
    const patient = patients.find((p) => p.id === req.body.patientId);
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
      uploadDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      extracted: Boolean(req.body.extracted),
      driveFileId: driveFile.id,
      driveFolderId: folderId,
      webViewLink: driveFile.webViewLink || "",
      webContentLink: driveFile.webContentLink || ""
    };
    res.json(await saveDocument("files", id, metadata));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/files/:id", async (req, res) => {
  try {
    const file = await getFirestoreDoc("files", req.params.id);
    if (!file) return res.status(404).json({ error: "File not found." });
    if (file.driveFileId) await deleteDriveFile(file.driveFileId);
    await deleteDocument("files", req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post(["/api/wipe", "/api/clear-all"], async (_req, res) => {
  try {
    const files = await listCollection("files");
    await Promise.all(files.map(async (file) => {
      if (file.driveFileId) {
        try {
          await deleteDriveFile(file.driveFileId);
        } catch (e) {
          console.error(`Failed to delete Drive file ${file.driveFileId}:`, e);
        }
      }
      await deleteDocument("files", file.id);
    }));
    const patients = await listCollection("patients");
    await Promise.all(patients.map(async (patient) => {
      if (patient.driveFolderId) {
        try {
          await recursivelyDeleteDriveFolder(patient.driveFolderId);
        } catch (e) {
          console.error(`Failed to recursively delete Drive folder for patient ${patient.id}:`, e);
        }
      }
      await deleteDocument("patients", patient.id);
    }));
    if (driveFolderId) {
      try {
        const token = await getDriveAccessToken();
        let pageToken = null;
        let totalDeleted = 0;
        do {
          const query = `'${driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`;
          const encodedQuery = encodeURIComponent(query);
          const pageTokenParam = pageToken ? `&pageToken=${pageToken}` : "";
          const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&spaces=drive&pageSize=100&fields=files(id,mimeType,name)${pageTokenParam}`;
          console.log(`Scanning root folder ${driveFolderId} for orphaned patient folders (page: ${pageToken || "first"})...`);
          const listResponse = await fetch(listUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!listResponse.ok) {
            console.error(`Failed to list root folder contents: ${listResponse.status} ${await listResponse.text()}`);
            break;
          }
          const listData = await listResponse.json();
          const rootChildren = listData.files || [];
          pageToken = listData.nextPageToken || null;
          console.log(`Found ${rootChildren.length} folders in this batch`);
          for (const child of rootChildren) {
            try {
              console.log(`Deleting orphaned Drive folder: ${child.name} (${child.id})`);
              await recursivelyDeleteDriveFolder(child.id);
              totalDeleted++;
            } catch (e) {
              console.error(`Failed to delete orphaned folder ${child.id} (${child.name}):`, e);
            }
          }
        } while (pageToken);
        console.log(`Wipe complete: deleted ${totalDeleted} orphaned patient folders from Drive`);
      } catch (e) {
        console.error("Error cleaning up orphaned Drive folders:", e);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/quota", (_req, res) => {
  const configuredKeys = [primaryGeminiKey, secondaryGeminiKey].filter(Boolean).length;
  res.json({
    configuredKeys,
    requestsMade: geminiRequestCount,
    quotaLimit: 1500 * Math.max(configuredKeys, 1),
    quotaRemainingEstimate: Math.max(0, 1500 * Math.max(configuredKeys, 1) - geminiRequestCount),
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    status: configuredKeys ? "Active" : "No Gemini key configured"
  });
});
app.post("/api/extract", async (req, res) => {
  const { fileContent, mimeType, fileName, patientId } = req.body;
  if (!fileContent) return res.status(400).json({ error: "No file content uploaded for extraction." });
  geminiRequestCount++;
  try {
    const base64Data = String(fileContent).replace(/^data:.*?;base64,/, "");
    let driveFileResult = null;
    if (patientId) {
      const patients = await listCollection("patients");
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        const folderId = await ensureDriveFolder(patient);
        driveFileResult = await uploadToDrive({ contentBase64: base64Data, name: fileName, mimeType: mimeType || "application/octet-stream" }, folderId);
        const id = newId("file");
        const metadata = {
          id,
          patientId,
          name: fileName,
          mimeType: mimeType || "application/octet-stream",
          size: Number(driveFileResult.size || 0),
          uploadDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          extracted: true,
          driveFileId: driveFileResult.id,
          driveFolderId: folderId,
          webViewLink: driveFileResult.webViewLink || "",
          webContentLink: driveFileResult.webContentLink || ""
        };
        await saveDocument("files", id, metadata);
      }
    }
    const schemaPrompt = `Return ONLY one JSON object using these exact top-level keys. Do not wrap fields inside nested patient_information, diagnosis, treatment_history, or any other generic object. If a value is missing, use an empty string or empty array. Use app dropdown values where possible.
TEXT CASE NORMALIZATION (apply to all free-text values \u2014 names, addresses, hospital names, clinic names, drug names, notes, headings, labels, values):
- Return all text in Sentence case (first letter capital, rest lowercase for the first word of each token), NEVER in ALL CAPS / block capitals / uppercase.
- Example: "DRLOGY IMAGING CENTER" -> "Drlogy Imaging Center"; "105-108, SMART VISION COMPLEX" -> "105-108, Smart Vision Complex".
- Exception: medical acronyms (FISH, NGS, IHC, ER, PR, HER2, BRCA, EGFR, ALK, PD-L1, CT, MRI, PET, ECOG, BMI, BP, FIGO, TNM, AJCC, NCCN, ESMO, ASCO) stay as-is in their accepted acronym form.
- Do NOT preserve the source document's banner/letterhead ALL-CAPS formatting in the output.
Do NOT behave like plain OCR. Interpret the clinical context and fill the relevant app fields/cages. These labels are aliases and must be merged:
- Telephone number, phone number, mobile number, contact number, TP, tp, Tel, telephone, mobile -> "tp".
- Living address, living area, address, residential address, residence, location, area, town, village -> "living_area".
- Patient name can be split into title, initials, first_name, last_name intelligently.
- Diagnosis/cancer wording should map to "oncology_types" as a multi-select list. Include every cancer/site mentioned when clinically relevant. Set "oncology" to the best primary category for backwards compatibility. If the site/type is not in the app list, include "Other" in "oncology_types" and type the exact cancer/site wording in "oncology_other".
Repeated clinical information MUST create as many array rows as needed. Do not limit output to the single sample row shown below. If a document has 8 blood results, return 8 bloodTable rows. If it has 6 medicines, return 6 drugTable/commonDrugsTable/neoChemoTable rows as clinically appropriate. If source data has extra columns that do not fit an allowed table column, preserve them inside the closest *_notes/findings field or unmapped_medical_information. Never wait for manual row or column creation.
{
  "oncology": "",
  "oncology_types": [],
  "oncology_other": "",
  "date": "",
  "auto_id": "",
  "tp": "",
  "nic": "",
  "title": "",
  "initials": "",
  "first_name": "",
  "last_name": "",
  "bht": "",
  "clinic": "",
  "dob": "",
  "age": "",
  "gender": "",
  "living_area": "",
  "hospital": "",
  "ward_no": "",
  "marital_status": "",
  "occupation": "",
  "status": "",
  "presenting_complaints": "",
  "comorbidity": "",
  "hospital_admissions": "",
  "past_surgical_history": "",
  "drugTable": [{"drug_name": "", "dose": "", "frequency": "", "duration": "", "notes": ""}],
  "allergy_food": "",
  "allergy_drugs": "",
  "allergy_plasters": "",
  "allergy_other": "",
  "familyTable": [{"comorbidity": "", "relationship": "", "family_notes": ""}],
  "smoking": "",
  "smoking_amount": "",
  "alcohol": "",
  "alcohol_amount": "",
  "riskTable": [{"risk_factor": "", "risk_notes": ""}],
  "bmi": "",
  "bsa": "",
  "height": "",
  "weight": "",
  "exam_findings": "",
  "systemic_exam": "",
  "examFindingsTable": [{"organ_system": "BMI", "findings": "", "notes": ""}, {"organ_system": "BSA", "findings": "", "notes": ""}],
  "provisional_diagnosis": "",
  "bloodTable": [{"blood_type": "", "blood_purpose": "", "blood_date": "", "blood_findings": "", "blood_notes": ""}],
  "tumorMarkersTable": [{"marker_name": "", "marker_value": "", "marker_unit": "", "marker_date": "", "marker_notes": ""}],
  "imagingTable": [{"imaging_type": "", "imaging_purpose": "", "imaging_parameter": "", "imaging_findings": "", "mass_present": "", "mass_size": "", "mass_location": "", "calcifications": "", "lymph_nodes": "", "metastasis": "", "ascites": "", "pv_status": "", "sma_status": ""}],
  "endoscopyTable": [{"endo_type": "", "endo_purpose": "", "endo_parameter": "", "endo_findings": ""}],
  "otherInvTable": [{"otherinv_type": "", "otherinv_purpose": "", "otherinv_parameter": "", "otherinv_findings": ""}],
  "biopsyTable": [{"biopsy_type": "", "biopsy_purpose": "", "biopsy_parameter": "", "biopsy_findings": "", "biopsy_stage": "", "lvi": "", "perineural_invasion": "", "margin_status": "", "cell_type": "", "metastasis": "", "lymph_nodes": ""}],
  "immunohistochemistryTable": [{"ihc_specimen": "", "ihc_panel": "", "ihc_marker": "", "ihc_result": "", "ihc_intensity": "", "ihc_percentage": "", "ihc_score": "", "ihc_pattern": "", "ihc_method": "", "ihc_date": "", "ihc_lab": "", "ihc_pathologist": "", "ihc_interpretation": "", "ihc_notes": ""}],
  "supplementaryDetailsTable": [{"detail_heading": "", "detail_subheading": "", "detail_label": "", "detail_value": "", "detail_unit": "", "detail_date": "", "detail_priority": "", "detail_category": "", "detail_source": "", "detail_notes": ""}],
  "stagingTable": [{"staging_system": "", "staging_notes": ""}],
  "overall_stage": "",
  "tnm_stage": "",
  "final_diagnosis": "",
  "problemTable": [{"problem": "", "management_plan": ""}],
  "commonDrugsTable": [{"common_drug": "", "common_dose": "", "common_frequency": "", "common_drug_notes": ""}],
  "neo_chemo_status": "",
  "neoChemoTable": [{"neo_chemo_drug": "", "neo_chemo_dose": "", "neo_chemo_freq": "", "neo_chemo_route": "", "neo_chemo_cycles": "", "neo_chemo_effects": "", "neo_chemo_notes": ""}],
  "adj_chemo_status": "",
  "adjChemoTable": [{"neo_chemo_drug": "", "neo_chemo_dose": "", "neo_chemo_freq": "", "neo_chemo_route": "", "neo_chemo_cycles": "", "neo_chemo_effects": "", "neo_chemo_notes": ""}],
  "neo_radio_status": "",
  "neoRadioTable": [{"neo_radio_comp": "", "neo_radio_dose": "", "neo_radio_freq": "", "neo_radio_route": "", "neo_radio_cycles": "", "neo_radio_effects": "", "neo_radio_notes": ""}],
  "adj_radio_status": "",
  "adjRadioTable": [{"neo_radio_comp": "", "neo_radio_dose": "", "neo_radio_freq": "", "neo_radio_route": "", "neo_radio_cycles": "", "neo_radio_effects": "", "neo_radio_notes": ""}],
  "surgeryTable": [{"surgery_name": "", "surgery_date": "", "surgery_site": "", "surgery_approach": "", "surgery_findings": "", "drain_status": "", "drain_volume": "", "surgery_notes": ""}],
  "complicationTable": [{"complication": "", "post_op_duration": "", "management": "", "notes": ""}],
  "monitoringTable": [{"monitor_param": "", "monitor_duration": "", "monitor_findings": "", "monitor_notes": ""}],
  "icu_done": "",
  "icuTable": [{"icu_date": "", "icu_stay": "", "icu_mgmt": "", "icu_exit": "", "icu_notes": ""}],
  "wardTable": [{"ward_entry": "", "ward_stay": "", "ward_mgmt": "", "ward_exit": "", "ward_notes": ""}],
  "follow_up_notes": "",
  "general_notes": "",
  "unmapped_medical_information": [{"source_section": "", "detail": "", "medical_importance": ""}],
  "source_file_summaries": [{"file_name": "${fileName || "document"}", "document_type": "", "clinically_relevant_summary": "", "unclear_or_unreadable_parts": ""}],
  "extraction_safety_note": ""
}`;
    const text = await runGemini([
      {
        inlineData: {
          mimeType: mimeType || "application/octet-stream",
          data: base64Data
        }
      },
      {
        text: `Extract every clinically relevant oncology detail from "${fileName || "document"}". Preserve terminology exactly, but do not merely OCR-copy text. Think like an autonomous medical data-entry agent: infer which app cage each value belongs to, merge synonymous labels, create every needed row, choose the closest table and dropdown field, preserve all extra columns in notes/unmapped rows, and map values into this schema:
${schemaPrompt}

WHAT TO EXTRACT \u2014 THINK LIKE A DOCTOR, NOT OCR:
Extract ONLY what was done to / found in THIS PATIENT \u2014 with measurement units:
- Presenting complaint, history of present illness, past medical history (comorbidities), allergies, family history
- Physical exam findings (organ systems, vitals, performance status: ECOG, Karnofsky)
- Risk factors (smoking pack-years, alcohol, occupational, environmental)
- Blood results (Hb, WBC, neutrophils, lymphocytes, platelets, LFT, renal, electrolytes, coagulation) \u2014 value + unit
- Tumor markers (CEA, AFP, CA 19-9, CA 125, CA 15-3, PSA, beta-hCG, LDH, etc.) \u2014 value + unit
- Imaging findings (mass size/location/present, lymph nodes, metastases, ascites, PV/SMA status) \u2014 measurements with units
- Biopsy / histopathology (cell type, grade, margins, LVI, perineural invasion, lymph nodes)
- Immunohistochemistry (each stain: marker, result, intensity, %, score/CPS/TPS, pattern, interpretation)
- Staging (TNM, FIGO, Ann Arbor, Breslow, Gleason)
- Treatment: neoadjuvant/adjuvant chemo (drug, dose, frequency, route, cycles, effects), neoadjuvant/adjuvant radio (dose, fractions, technique)
- Surgery (name, date, site, approach, findings, drain status/volume)
- Post-op complications (complication, POD/day, management)
- Post-op monitoring (parameter, duration, findings)
- ICU admission (date, stay days, management, exit)
- Ward admission (entry, stay days, management, exit)
- Management plan steps / discharge medications / follow-up
- Problem list with management plans

DO NOT EXTRACT (skip entirely):
- Reference ranges / normal values / lab reference intervals
- Report identification: report ID, issue number, lab number, sample ID, accession number
- Hospital / medical center / clinic / laboratory names (user enters manually)
- Doctor / pathologist / lab technician / radiologist names
- Letterhead, header, footer text
- Page numbers, addresses, phone numbers, fax, email from letterhead
- Dates that are not clinically meaningful (report generation date, printed date, verification date)
- Administrative metadata (MRN from letterhead, billing codes, insurance info, barcode numbers)

MEASUREMENT UNITS REQUIRED:
Always include units when typing result values (e.g. "12.5 g/dL" not "12.5"; "3.2 x 2.8 cm" not "3.2 x 2.8"; "4.8 ng/mL" not "4.8"; "38 U/L" not "38").

EXACT FIELD NAME ENFORCEMENT (CRITICAL \u2014 DO NOT INVENT OR RENAMED FIELDS):
- For every row you emit, use ONLY the exact field names shown in the schema placeholder rows above. Do NOT substitute similar names (e.g. do not use "complication_severity" or "complication_notes" \u2014 those are LEGACY names. The complication table uses "complication", "post_op_duration", "management", "notes".
- Surgical Procedure tables use these EXACT field names (do not rename):
    surgeryTable: surgery_name, surgery_date, surgery_site, surgery_approach, surgery_findings, drain_status, drain_volume, surgery_notes
    complicationTable: complication, post_op_duration (e.g. "POD-3" or "Day 5"), management, notes
    monitoringTable: monitor_param, monitor_duration, monitor_findings, monitor_notes
    icuTable: icu_date, icu_stay, icu_mgmt, icu_exit, icu_notes
    wardTable: ward_entry, ward_stay, ward_mgmt, ward_exit, ward_notes
    icu_done (top-level, NOT a table): "Done" or "Not done" (no other value \u2014 map "Yes"/"Admitted" -> "Done", "No"/"Not admitted" -> "Not done")

HIGH-PRIORITY EXTRACTION TARGETS (do not omit any of these when present in the source):
- Blood report (bloodTable): hemoglobin / Hb, lymphocytes (count or %), neutrophils (count or %), platelets / PLTs, total WBC count, and complete liver function tests (LFT) including AST / SGOT, ALT / SGPT, total bilirubin, direct/indirect bilirubin, albumin, total protein, ALP / alkaline phosphatase, GGT. Always emit one bloodTable row per parameter or per dated panel.
- Tumor markers (tumorMarkersTable): CEA, AFP, CA 19-9, CA 125, CA 15-3, PSA, beta-hCG, LDH, and any organ-specific markers with value + unit + reference range. One row per marker per date.
- Imaging reports (imagingTable): explicitly extract mass_present (yes/no/indeterminate), mass_size (with units, e.g. "3.2 x 2.8 cm"), mass_location (anatomical site), calcifications (present/absent/pattern), lymph_nodes (status, size, station), metastasis / mets (sites), ascites (present/absent/volume), pv_status (portal vein patency/involvement), sma_status (superior mesenteric artery encasement/involvement). Each finding must populate its own field even if also summarized in imaging_findings.
- Biopsy / histopathology (biopsyTable): perineural_invasion (present/absent), margin_status (clear/involved/close + distance), LVI / lymphovascular_invasion (present/absent), cell_type (e.g. adenocarcinoma, squamous, etc.), metastasis, lymph_nodes (positive/total, station).
- Post-surgical parameters (surgeryTable): drain_status (present/removed/none) and drain_volume (mL/day or total) are CRITICAL \u2014 always extract when mentioned. Also extract surgery_findings including margin status, residual disease, and complications.
- Post-op complications (complicationTable): one row per complication. Use these EXACT field names: complication (e.g. "Anastomotic leak", "Seroma", "Surgical site infection"), post_op_duration (e.g. "POD-3", "POD-7", "Day 5"), management (e.g. "IV antibiotics, re-exploration, percutaneous drainage"), notes (free text).
- Post-op monitoring (monitoringTable): one row per monitored parameter. monitor_param (e.g. "Vital signs", "Drain output", "BP", "HR", "SpO2"), monitor_duration (e.g. "q4h x 48h", "twice daily"), monitor_findings (e.g. "stable", "within limits", "drain removed POD-5 with minimal output"), monitor_notes.
- ICU admission after surgery: set icu_done = "Done" if the patient was admitted to ICU/HDU/ITU after surgery (map "Yes", "Admitted", "Yes - 2 days" -> "Done"), else "Not done" (map "No", "Not admitted" -> "Not done"). Then populate icuTable with one row per ICU stay: icu_date, icu_stay (in days), icu_mgmt, icu_exit, icu_notes.
- Ward admission details after surgery/ICU: wardTable with one row per ward stay: ward_entry, ward_stay (in days), ward_mgmt, ward_exit, ward_notes.
Return these even when not in the example placeholder row.
DYNAMIC ROW / COLUMN / HEADING / SUBHEADING / CELL ADDITION (mandatory behavior):

PRIORITY ORDER (MUST FOLLOW IN THIS ORDER):
1. PREDETERMINED FIELDS FIRST. Every value in the source MUST be checked against the predefined top-level keys and per-row fields before considering supplementaryDetailsTable. If a value fits a predefined field, it goes there. Period.
2. If a value does not fit any predefined field or table, THEN use supplementaryDetailsTable.
3. If a similar value already exists in the patient's record (in a predefined field, in a table row, or in a previous supplementaryDetailsTable row), treat it as an UPDATE / ADDITIONAL DATA POINT \u2014 append a new row, do NOT delete or replace the existing one.

ADDITIVE / APPEND-ONLY BEHAVIOR (NEVER DESTROY EXISTING DATA):
- This pipeline is APPEND-ONLY. The output of this extraction is MERGED into the existing patient record. You MUST NOT emit fewer rows than exist if the source has the same data. You MUST NOT overwrite or shorten existing values.
- For tables (bloodTable, tumorMarkersTable, imagingTable, biopsyTable, immunohistochemistryTable, surgeryTable, problemTable, commonDrugsTable, neoChemoTable, adjChemoTable, neoRadioTable, adjRadioTable, supplementaryDetailsTable, etc.): emit ONE new row per distinct finding, date, or panel. If the source describes the same parameter on multiple dates, emit one row per date. Do not collapse.
- If a value in the source is identical to an existing value already in the patient record (e.g. "Hb 13.5 g/dL on 2025-03-01" was already entered), still emit the row \u2014 duplicates are reconciled at the database layer, not by you. The downstream system handles dedup; you provide a complete extraction.
- For top-level scalar fields (first_name, age, dob, gender, etc.): emit the source value. If the source is silent, emit an empty string. Do NOT invent. The downstream merge keeps the existing value when the new one is empty.

PREDETERMINED-FIELD COVERAGE CHECK (do this for every value before considering supplementary):
- Demographics: first_name, last_name, initials, dob, age, gender, nic, tp, oncology_types, oncology_type -> use these.
- Vitals / general: weight, height, bmi, blood_pressure, pulse, temperature, spo2, performance_status, ecog, karnofsky, comorbidity, allergy_history, smoking_status, alcohol_use -> these map to the existing top-level fields or to the per-row *_notes field. USE them first.
- Examination findings (examFindingsTable): vitals BMI/BSA, height, weight, BP, pulse, SpO2, temp -> the first rows. Per-system exam: General appearance, CVS, RS, P/A (per abdomen), CNS, MSK, lymph nodes, local/lesion exam, breast exam, DRE, ENT, ophthalmic -> one row per system with organ_system + findings + notes. USE examFindingsTable first; only fall back to top-level exam_findings / systemic_exam scalars for unstructured prose.
- History: prior chronic medications / non-chemo drugs (e.g. Metformin, antihypertensives, thyroxine) -> drugTable. Family history of malignancy/chronic disease -> familyTable (one row per affected relative). Other risk factors (occupational, lifestyle, environmental) -> riskTable. Smoking/alcohol status + amounts -> top-level smoking / smoking_amount / alcohol / alcohol_amount fields. USE these first.
- Investigations: blood counts (Hb, RBC, WBC, neutrophils, lymphocytes, platelets, ESR, CRP) -> bloodTable. LFT (AST, ALT, bilirubin, albumin, ALP, GGT) -> bloodTable. Tumor markers (CEA, AFP, CA 19-9, CA 125, CA 15-3, PSA, beta-hCG, LDH) -> tumorMarkersTable. Imaging (CT, MRI, PET, US) -> imagingTable with the sub-fields. Endoscopy -> endoscopyTable. Other investigations -> otherInvTable. Biopsy -> biopsyTable. IHC stains -> immunohistochemistryTable.
- Staging: TNM, FIGO, Breslow, Clark, Gleason, Ann Arbor -> stagingTable or, if no predefined column, append to a stagingDetails supplementary heading. PREFER stagingTable first.
- Treatment: NEO-ADJUVANT chemo (given BEFORE definitive surgery to shrink tumour) -> neoChemoTable + neo_chemo_status in {Done, Ongoing, Planned, Not done, Discontinued}. ADJUVANT chemo (given AFTER surgery to mop up residual disease) -> adjChemoTable + adj_chemo_status. NEO-ADJUVANT radiotherapy (pre-operative) -> neoRadioTable + neo_radio_status. ADJUVANT radiotherapy (post-operative) -> adjRadioTable + adj_radio_status. Surgery -> surgeryTable (surgery_name, date, site, approach, findings, drain_status, drain_volume, surgery_notes). Post-op complications -> complicationTable (complication, post_op_duration like "POD-3" or "Day 5", management, notes). Post-op monitoring -> monitoringTable (monitor_param, monitor_duration, monitor_findings, monitor_notes). ICU admission after surgery -> icu_done in {Done, Not done} + icuTable (icu_date, icu_stay, icu_mgmt, icu_exit, icu_notes). Ward admission after surgery/ICU -> wardTable (ward_entry, ward_stay, ward_mgmt, ward_exit, ward_notes). Common drugs -> commonDrugsTable. Problem list -> problemTable. USE these first. When the document does not specify neoadjuvant vs adjuvant, infer from the document timeline (e.g. "post-op chemo", "after wide local excision", "AC x 4 then Paclitaxel x 4" AFTER a surgical date = adjuvant).
- Care: follow_up_notes, general_notes -> use these.

SUPPLEMENTARY DETAILS \u2014 USE ONLY WHEN DATA DOES NOT FIT ANYWHERE ABOVE.

HEADING DEDUPLICATION (CRITICAL):
- Before creating a new heading in supplementaryDetailsTable, ALWAYS check whether a similar heading already exists or is one of the standard headings. If yes, APPEND a new row under that existing heading \u2014 never create a duplicate "Genetics" and "Genetic Testing" and "Genomic Testing" headings.
- Standardize heading spellings. Use the closest standard form: "Genetic Testing" (not "Genetics", "Genomic", "Genomic Testing"), "Performance Status" (not "PS", "Functional Status", "ECOG"), "Vitals" (not "Vital Signs"), "Lifestyle" (not "Habits", "Social History"), "Staging Details" (not "Stage Notes"), "Pathology Details" (not "Path Notes"), "Comorbidities" (not "Co-morbidities", "Past Medical History"), "Adverse Event Logs" (not "Side Effects", "Adverse Events"), "Discharge Medications" (not "Discharge Meds", "Meds on Discharge"), "Follow-up Schedule" (not "Follow Up", "Followup"), "Vaccinations" (not "Immunizations"), "Pregnancy / Reproductive History" (not "OB/GYN History"), "Allergies" (not "Drug Allergies"), "Care Plan" (not "Plan of Care"), "Patient-Reported Outcomes" (not "PROs", "Patient Symptoms"), "Discharge Summary" (not "DC Summary"), "Bone Health" (not "Bone Density"), "Renal Function" (not "Kidney Function"), "Coagulation" (not "Coag Profile"), "Infectious Disease" (not "ID", "Infection History"), "Psychosocial" (not "Psych", "Social").
- Use "Additional {X} Notes" only as a last-resort catch-all when no standard heading matches.

COLUMN / LABEL DEDUPLICATION (within the same heading + subheading):
- Before creating a new label, check whether a semantically identical label already exists in the same heading + subheading. If yes, APPEND a new row with the same label rather than creating a different spelling. E.g. do not have both "ECOG" and "ECOG performance status" \u2014 use "ECOG" everywhere.
- Prefer canonical label forms: "ECOG" (not "ECOG PS"), "Karnofsky" (not "KPS"), "LVEF" (not "Ejection Fraction"), "BMI" (not "Body Mass Index"), "BP" (not "Blood Pressure"), "HR" (not "Heart Rate"), "SpO2" (not "Oxygen Saturation"), "VAF" (not "Variant Allele Frequency"), "FIGO" (not "FIGO Stage"), "ECOG PS" only if the source explicitly says "ECOG performance status".
- Units go in detail_unit, not in detail_label or detail_value. "BMI 24.3 kg/m2" -> detail_label="BMI", detail_value="24.3", detail_unit="kg/m2".

SUPPLEMENTARY ROW ORDER (mandatory):
- Group rows by heading, then by subheading, then by label. Within the same label, sort by date ascending (oldest first), then by source order. This makes the patient's record read like a clinical document.

EXAMPLES (REVISED WITH PRIORITY RULES):
- Source: "Hb 12.5 g/dL on 2025-04-01, AST 38 U/L on 2025-04-01, CEA 4.8 ng/mL on 2025-04-01, ER positive 90% nuclei, ECOG 1, BRCA1 c.5266dupC pathogenic, Discharge: amlodipine 5 mg daily, BMI 24.3"
  -> bloodTable: 2 rows (Hb, AST).
  -> tumorMarkersTable: 1 row (CEA).
  -> immunohistochemistryTable: 1 row (ER, 90%).
  -> supplementaryDetailsTable: 4 rows under "Performance Status" (ECOG=1), "Genetic Testing" subheading "BRCA" (BRCA1 c.5266dupC=pathogenic), "Discharge Medications" (amlodipine=5 mg daily; mg goes in detail_unit, daily goes in detail_notes), "Vitals" (BMI=24.3; kg/m2 in detail_unit).
  -> Do NOT create a separate "Vitals", "BMI", "Body Mass Index" heading \u2014 "Vitals" already exists from a prior extraction, so the BMI row goes under the existing "Vitals" heading. If a different prior extraction already added "BMI 22.1" under "Vitals", you add a new row "BMI 24.3" rather than overwriting.
- Source: "Tumor is FIGO IIA, grade 2, with LVSI present."
  -> stagingTable gets a row: staging_system="FIGO", staging_notes="FIGO IIA, grade 2, LVSI present". Only if stagingTable is unavailable in the schema should you fall back to supplementaryDetailsTable.
- Source: "Patient is a 25 pack-year smoker, BMI 24.3, BP 128/82."
  -> If "Vitals" or "Lifestyle" heading already exists in supplementaryDetailsTable from prior data, append new rows under that heading. Do NOT create a new "Vitals", "Vital Signs", or "Lifestyle", "Habits" heading. Use canonical labels: "BMI", "BP", "Pack-years" or "Smoking".
- Source: "ECOG 1, ECOG performance status 1, Karnofsky 90%."
  -> Three rows. detail_label: "ECOG" (twice \u2014 same canonical label, two dated values), "Karnofsky". Do not emit a row labeled "ECOG PS" or "ECOG performance status".

NEVER DO (hard prohibitions):
- NEVER delete, shorten, or replace any value that already exists in the patient record. The output is a UNION of source + existing record, not a replacement of existing.
- NEVER refuse to fill a predefined field because the data also "could" go in supplementary. The predefined field is the canonical home.
- NEVER create a new heading when an equivalent or similar heading already exists in supplementaryDetailsTable. Use the existing one and APPEND.
- NEVER collapse repeated or dated findings into a single row. Emit one row per date/panel/finding.
- NEVER invent a value. If the source is silent, emit an empty string for scalar fields, or simply do not emit a row for table fields.

IMMUNOHISTOCHEMISTRY / IHC REPORTS (immunohistochemistryTable) \u2014 emit ONE row PER STAIN per report (and per date if multiple reports). Do not collapse a panel into one row. Do not invent stains that are not mentioned.

For every IHC stain in the source, populate:
- ihc_panel: panel / context name when mentioned ("Breast panel", "Lymphoma panel", "MMR / MSI panel", "PD-L1", "GI panel", "GIST panel", "Melanoma panel", "Neuroendocrine panel", "Glioma panel", "Lung panel", "Gynecologic panel", "Prostate panel", "HCC panel", "Mesothelioma panel"). Otherwise use the organ system.
- ihc_marker: stain name from this allow-list (and common aliases): ER / Estrogen Receptor; PR / Progesterone Receptor; HER2 / HER2/neu / ERBB2; Ki-67 / MIB-1 / proliferation index; EGFR; PD-L1 (note clone: 22C3, SP142, SP263, 28-8); MLH1, MSH2, MSH6, PMS2 (MMR); CD20; CD3; CD5; CD10; CD15; CD30; CD45 / LCA; CD79a; BCL2; BCL6; MUM1 / IRF4; CD117 / c-KIT; DOG1; CD34; S100; SOX10; HMB45; Melan-A / MART-1; MITF; TTF-1; napsin A; p40; p63; CK5/6; CK7; CK20; CDX2; GATA3; GCDFP-15; mammaglobin; PSA; PSAP; NKX3.1; AMACR / P504S; PAX8; WT1; CA-IX; RCC marker; HepPar-1; Arginase-1; Glypican-3; AFP; calretinin; D2-40 / podoplanin; EMA / MUC1; synaptophysin; chromogranin A; CD56 / NCAM; NSE; GFAP; IDH1 R132H; ATRX; p53; 1p/19q codeletion; MGMT; beta-catenin; E-cadherin; ALK (5A4 / D5F3); ROS1; BRAF V600E; PD-1; CD8; FOXP3; INI-1 / SMARCB1; BRG1 / SMARCA4; cytokeratin AE1/AE3 / pan-CK.
- ihc_result: Positive / Negative / Equivocal / Focal / Patchy / Lost. Map "weak", "scattered", "rare" to "Focal/equivocal" if uncertain.
- ihc_intensity: staining intensity exactly as reported. For HER2 use "0", "1+", "2+", "3+". Otherwise "Weak", "Moderate", "Strong", or whatever the source uses.
- ihc_percentage: percent of tumor cells staining (e.g. "80%", "5-10%"). If only an H-score is given, put it here AND in ihc_score.
- ihc_score: Allred score (0-8), H-score, HER2/CEP17 ratio from FISH, Ki-67 proliferation index (%), or PD-L1 CPS / TPS / IC (e.g. "CPS 18", "TPS 60%", "IC 2%").
- ihc_pattern: membranous, nuclear, cytoplasmic, perinuclear, dot-like, Golgi, granular, diffuse, focal, patchy, complete, incomplete (for MMR).
- ihc_method: "IHC" by default, or "FISH", "CISH", "SISH", "NGS", "PCR" if specified.
- ihc_date / ihc_lab / ihc_pathologist: from the report header.
- ihc_interpretation: clinical interpretation such as "Triple-negative", "Hormone receptor positive", "HER2 2+ equivocal, FISH amplified", "Mismatch repair deficient (dMMR) / MSI-high", "MMR-proficient (pMMR) / MSS", "GIST, DOG1+", "Hodgkin lymphoma, classic type", "DLBCL, GCB subtype", "Lung adenocarcinoma", etc.
- ihc_notes: control status, antibody clone, dilution, additional context.

Sub-interpretation rules (apply only when the relevant stains are present in the same report):
- Breast panel: if ER or PR Positive AND Ki-67 < 14%, note "Luminal A-like" in ihc_interpretation; if Ki-67 >= 14% or HER2+ note "Luminal B-like"; triple (ER-, PR-, HER2-) -> "Triple-negative breast cancer (TNBC)"; HER2 2+ without FISH -> "HER2 equivocal".
- MMR panel: loss of any of MLH1/MSH2/MSH6/PMS2 -> "dMMR / MSI-high" in ihc_interpretation; all four retained -> "pMMR / MSS".
- PD-L1: report CPS or TPS exactly as stated (e.g. "CPS 18", "TPS 60%").
- HER2: IHC score (0/1+/2+/3+) in ihc_intensity, FISH ratio in ihc_score when available.

FIELD INTERPRETATION EXAMPLES (apply in general):
- "3+ staining" or "strong complete" -> ihc_intensity = "3+" (HER2) or "Strong"; ihc_pattern = "complete, membranous".
- "Ki-67 30%" -> ihc_marker = "Ki-67", ihc_percentage = "30%", ihc_score = "30%".
- "PD-L1 (22C3) CPS 18" -> ihc_marker = "PD-L1 (22C3)", ihc_score = "CPS 18", ihc_method = "IHC".
- "MLH1 lost, MSH2 retained, MSH6 retained, PMS2 lost" -> four rows; ihc_interpretation on the LAST row = "dMMR / MSI-high".
- "HER2 IHC 2+, FISH amplified (ratio 6.4)" -> ihc_intensity = "2+", ihc_score = "HER2/CEP17 = 6.4, amplified", ihc_interpretation = "HER2 positive (FISH amplified)".
- "ER positive in 90% of tumor nuclei, intensity 3+ (Allred 8/8)" -> ihc_marker = "ER", ihc_percentage = "90%", ihc_intensity = "3+ / Strong", ihc_score = "Allred 8/8", ihc_result = "Positive", ihc_pattern = "nuclear".
- "CD20+, CD3-, CD10+, BCL6+, MUM1+, Ki-67 80% (Germinal center B-cell, non-Hodgkin lymphoma)" -> one row per stain; ihc_interpretation on the panel's final row = "Diffuse large B-cell lymphoma, GCB subtype".

RULES:
- Do not hallucinate negative stains that are not mentioned. If only "ER positive" is stated, do NOT infer PR, HER2, or Ki-67.
- Do not duplicate a row when only one mention exists. Create new rows only for distinct stains or distinct dates.
- If a value is not in the source, leave the string empty.
- Apply the immunohistochemistryTable rules IN ADDITION to the existing bloodTable, tumorMarkersTable, imagingTable, biopsyTable, and surgeryTable rules. Keep both sets of rules active. Apply only to the immunohistochemistryTable key; do not bleed into other tables.
`
      }
    ], "You are an expert oncology data extraction agent and autonomous form-filling agent. Return the requested flat JSON schema only. Interpret field meaning intelligently instead of plain OCR. Add unlimited rows when the source has repeated findings. Do not omit medical values. Do not invent values. Pay special attention to blood counts (Hb, lymphocytes, neutrophils, PLTs, total WBC), liver function tests (AST, ALT, bilirubin, albumin), tumor markers (CEA, AFP, CA 19-9, CA 125, PSA, etc.), imaging mass characteristics (size, location, calcifications, LN, mets, ascites, PV, SMA), biopsy findings (perineural invasion, margin status, LVI, cell type, LN, mets), post-surgical drains (status, volume), and IMMUNOHISTOCHEMISTRY / IHC reports \u2014 for every IHC stain emit a separate row in immunohistochemistryTable with marker, result, intensity, percentage, score (Allred / H-score / FISH ratio / CPS / TPS / Ki-67%), pattern, method (IHC / FISH / NGS), date, lab, pathologist, interpretation, and notes. Behavior rules: (1) PREDETERMINED FIELDS FIRST \u2014 always prefer the predefined top-level keys and per-row fields over supplementary. (2) APPEND-ONLY \u2014 never delete, overwrite, or shorten existing values; emit a complete new row for every distinct finding so the downstream merge can union them. (3) SUPPLEMENTARY DEDUPLICATION \u2014 when using supplementaryDetailsTable, append to an existing heading (with canonical spelling) rather than creating a near-duplicate heading; use canonical label forms (ECOG, BMI, BP, LVEF, VAF, FIGO, Karnofsky) and put units in detail_unit. (4) NO REFLEXIVE NEW HEADINGS \u2014 only use supplementary when the data truly does not fit any predefined field or table.", "application/json");
    res.json({ ...normalizeExtraction(extractJsonObject(text)), driveFile: driveFileResult });
  } catch (error) {
    res.status(502).json({ error: `AI extraction failed: ${error.message}` });
  }
});
app.post("/api/chat", async (req, res) => {
  const { query, patientRecord, patientContext } = req.body || {};
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }
  const patient = patientRecord || patientContext || {};
  geminiRequestCount++;
  const pick = (v) => v === void 0 || v === null || v === "" ? "\u2014" : String(v);
  const list = (arr, map, max = 8) => Array.isArray(arr) && arr.length ? arr.slice(0, max).map(map).filter(Boolean).join("\n") : "\u2014";
  const demographics = [
    `Name: ${pick(patient.first_name)} ${pick(patient.last_name)}`,
    `Title: ${pick(patient.title)}`,
    `DOB: ${pick(patient.dob)}  Age: ${pick(patient.age)}  Sex: ${pick(patient.gender)}`,
    `NIC: ${pick(patient.nic)}  TP/Clinic: ${pick(patient.tp)}`,
    `Oncology: ${pick(patient.oncology)}${Array.isArray(patient.oncology_types) && patient.oncology_types.length ? "  (" + patient.oncology_types.join(", ") + ")" : ""}`,
    `Oncology other: ${pick(patient.oncology_other)}`
  ].join("\n");
  const diagnosis = [
    `Provisional: ${pick(patient.provisional_diagnosis)}`,
    `Final: ${pick(patient.final_diagnosis)}`,
    `Overall stage: ${pick(patient.overall_stage)}`,
    `TNM: ${pick(patient.tnm_stage)}`
  ].join("\n");
  const blood = list(patient.bloodTable, (r) => `  - ${pick(r.blood_type)} ${pick(r.blood_purpose)}${r.blood_date ? " (" + r.blood_date + ")" : ""}: ${pick(r.blood_findings)}${r.blood_notes ? "  // " + r.blood_notes : ""}`);
  const tumorMarkers = list(patient.tumorMarkersTable, (r) => `  - ${pick(r.marker_name)} = ${pick(r.marker_value)} ${pick(r.marker_unit)}${r.marker_date ? " (" + r.marker_date + ")" : ""}`);
  const imaging = list(patient.imagingTable, (r) => {
    const mass = [r.mass_present, r.mass_size, r.mass_location, r.calcifications].filter(Boolean).join(" / ");
    const ext = [r.lymph_nodes, r.metastasis, r.ascites, r.pv_status, r.sma_status].filter(Boolean).join(" | ");
    return `  - ${pick(r.imaging_type)} ${pick(r.imaging_purpose)} target ${pick(r.imaging_parameter)}: ${pick(r.imaging_findings)}${mass ? " | mass " + mass : ""}${ext ? " | " + ext : ""}`;
  });
  const biopsy = list(patient.biopsyTable, (r) => {
    const ext = [r.cell_type, r.margin_status, r.lvi, r.perineural_invasion, r.lymph_nodes, r.metastasis].filter(Boolean).join(", ");
    return `  - ${pick(r.biopsy_type)} ${pick(r.biopsy_purpose)} site ${pick(r.biopsy_parameter)}: ${pick(r.biopsy_findings)}  // ${ext}`;
  });
  const ihc = list(patient.immunohistochemistryTable, (r) => `  - ${pick(r.ihc_marker)} [${pick(r.ihc_panel)}]: ${pick(r.ihc_result)} ${pick(r.ihc_intensity)} ${pick(r.ihc_percentage)} score=${pick(r.ihc_score)} pattern=${pick(r.ihc_pattern)} interp=${pick(r.ihc_interpretation)}`);
  const surgery = list(patient.surgeryTable, (r) => {
    const drains = [r.drain_status, r.drain_volume].filter(Boolean).join(" ");
    return `  - ${pick(r.surgery_name)} ${pick(r.surgery_date)} site ${pick(r.surgery_site)} approach ${pick(r.surgery_approach)}: ${pick(r.surgery_findings)}${drains ? "  drains: " + drains : ""}`;
  });
  const complications = list(patient.complicationTable, (r) => `  - ${pick(r.complication)} @ ${pick(r.post_op_duration)}: ${pick(r.management)}${r.notes ? "  notes: " + r.notes : ""}`);
  const monitoring = list(patient.monitoringTable, (r) => `  - ${pick(r.monitor_param)} ${pick(r.monitor_duration)}: ${pick(r.monitor_findings)}${r.monitor_notes ? "  notes: " + r.monitor_notes : ""}`);
  const icu = list(patient.icuTable, (r) => `  - admitted ${pick(r.icu_date)}, stay ${pick(r.icu_stay)}d, exit ${pick(r.icu_exit)}: ${pick(r.icu_mgmt)}${r.icu_notes ? "  notes: " + r.icu_notes : ""}`);
  const ward = list(patient.wardTable, (r) => `  - entered ${pick(r.ward_entry)}, stay ${pick(r.ward_stay)}d, exit ${pick(r.ward_exit)}: ${pick(r.ward_mgmt)}${r.ward_notes ? "  notes: " + r.ward_notes : ""}`);
  const chemo = list(patient.neoChemoTable, (r) => `  - [Neo] ${pick(r.neo_chemo_drug)} ${pick(r.neo_chemo_dose)} ${pick(r.neo_chemo_freq)} ${pick(r.neo_chemo_route)} x${pick(r.neo_chemo_cycles)}  effects: ${pick(r.neo_chemo_effects)}`);
  const adjChemo = list(patient.adjChemoTable, (r) => `  - [Adj] ${pick(r.neo_chemo_drug)} ${pick(r.neo_chemo_dose)} ${pick(r.neo_chemo_freq)} ${pick(r.neo_chemo_route)} x${pick(r.neo_chemo_cycles)}  effects: ${pick(r.neo_chemo_effects)}`);
  const radio = list(patient.neoRadioTable, (r) => `  - [Neo] ${pick(r.neo_radio_comp)} ${pick(r.neo_radio_dose)}Gy ${pick(r.neo_radio_route)} x${pick(r.neo_radio_cycles)}  effects: ${pick(r.neo_radio_effects)}`);
  const adjRadio = list(patient.adjRadioTable, (r) => `  - [Adj] ${pick(r.neo_radio_comp)} ${pick(r.neo_radio_dose)}Gy ${pick(r.neo_radio_route)} x${pick(r.neo_radio_cycles)}  effects: ${pick(r.neo_radio_effects)}`);
  const supplementary = list(patient.supplementaryDetailsTable, (r) => `  - [${pick(r.detail_heading)}${r.detail_subheading ? " / " + r.detail_subheading : ""}] ${pick(r.detail_label)} = ${pick(r.detail_value)} ${pick(r.detail_unit)}${r.detail_date ? " (" + r.detail_date + ")" : ""}${r.detail_priority ? " [" + r.detail_priority + "]" : ""}`);
  const problems = list(patient.problemTable, (r) => `  - ${pick(r.problem)}  plan: ${pick(r.management_plan)}`);
  const userPrompt = `PATIENT MEDICAL RECORD (structured summary):

== Demographics ==
${demographics}

== Diagnosis & Staging ==
${diagnosis}

== Comorbidities & History ==
${pick(patient.comorbidity)}
${pick(patient.allergy_history)}
${pick(patient.smoking_status)}
${pick(patient.alcohol_use)}
Family hx: ${pick(patient.family_history)}

== Blood / Labs ==
${blood}

== Tumor Markers ==
${tumorMarkers}

== Imaging ==
${imaging}

== Biopsy / Histopathology ==
${biopsy}

== Immunohistochemistry (IHC) ==
${ihc}

== Surgical Procedures ==
Procedure:
${surgery}

Post op complications:
${complications}

Post op monitoring:
${monitoring}

ICU admission after surgery (status: ${pick(patient.icu_done)}):
${icu}

Ward admission details after surgery / ICU:
${ward}

== Chemotherapy ==
Neo-adjuvant (status: ${pick(patient.neo_chemo_status)}):
${chemo}

Adjuvant (status: ${pick(patient.adj_chemo_status)}):
${adjChemo}

== Radiotherapy ==
Neo-adjuvant (status: ${pick(patient.neo_radio_status)}):
${radio}

Adjuvant (status: ${pick(patient.adj_radio_status)}):
${adjRadio}

== Supplementary / Additional Details ==
${supplementary}

== Active Problems / Plan ==
${problems}

== Care Notes ==
Follow-up: ${pick(patient.follow_up_notes)}
Performance / Vitals: ${pick(patient.general_notes)}

== Clinician question ==
${query}

== Answer requirements ==
- Ground every claim in the patient's record above. If data is missing, say "not on file" rather than guessing.
- When you reference a guideline, name the source and year (e.g. "NCCN 2024 breast cancer guidelines", "ESMO 2023", "ASCO 2022").
- **OUTPUT FORMAT (use markdown exactly as shown):**
  - Start with RED FLAGS section if any: "#" + "# RED FLAGS" then bullet points
  - Use "#" + "# Section Title" for major sections (Assessment, Management, Investigations, Therapy, Follow-up)
  - Use "#" + "## Subsection" for sub-sections
  - Bold key terms with "**term**"
  - Use bullet lists with "- " for scannable points
  - End with "#" + "# Suggested Follow-Up Questions" and numbered list "1. Question"
- Highlight RED FLAGS (e.g. rising tumor markers, new symptoms, treatment-stopping toxicity) at the top.
- At the end, list 2-4 SUGGESTED FOLLOW-UP QUESTIONS the clinician could ask next.
- Do NOT present autonomous treatment orders. Frame all suggestions as clinician-decision support.

== Output Example ==
#"# RED FLAGS
- **Rising CEA**: 12.4 \u2192 28.7 ng/mL over 3 months \u2014 suggests progression
- **New liver lesion** on imaging not previously documented

#"# Assessment
**Stage IV colorectal cancer** with liver metastases. ECOG 1.

### Key Findings
- **Tumor markers**: CEA rising (12.4 \u2192 28.7 ng/mL)
- **Imaging**: 3 new liver lesions, largest 3.2 cm segment VII
- **Biopsy**: Adenocarcinoma, RAS wild-type (on file)

## Management
- **NCCN 2024**: FOLFOX + bevacizumab preferred first-line for RAS wild-type
- **ESMO 2023**: Consider liver-directed therapy if oligometastatic
- **Action**: MDT discussion for potential resection/ablation

## Suggested Follow-Up Questions
1. Should we obtain liquid biopsy for RAS status confirmation?
2. Is patient a candidate for clinical trial?
3. Should we refer for hepatic MDT evaluation?`;
  const systemInstruction = `You are a clinician-facing oncology AI co-pilot. You answer questions about a specific patient by combining the patient's record with current standard oncological guidelines (NCCN, ESMO, ASCO, ASTRO, AJCC 8th ed., etc.). Always cite guideline source + year. Be concise, scannable, and safety-first: if data is missing, prompt for it; if findings conflict, call it out. Never claim you have prescribed or treated the patient.`;
  try {
    const text = await runGemini(userPrompt, systemInstruction, void 0);
    return res.json({ reply: text, text });
  } catch (error) {
    console.error("[/api/chat] Gemini error:", error?.message || error);
    return res.status(502).json({
      error: `AI chat failed: ${error?.message || "unknown error"}`,
      detail: String(error?.stack || error || "").slice(0, 600)
    });
  }
});
var server_default = app;
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => res.sendFile(import_path.default.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startServer
});
//# sourceMappingURL=server.cjs.map
