import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listCollection, saveDocument } from "../firebase.js";
import { ensureDriveFolder, uploadToDrive } from "../drive.js";
import { runGemini, extractJsonObject, normalizeExtraction } from "../gemini.js";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

let geminiRequestCount = 0;

const schemaPrompt = `Return ONLY one JSON object using these exact top-level keys. Do not wrap fields inside nested patient_information, diagnosis, treatment_history, or any other generic object. If a value is missing, use an empty string or empty array. Use app dropdown values where possible.
TEXT CASE NORMALIZATION (apply to all free-text values — names, addresses, hospital names, clinic names, drug names, notes, headings, labels, values):
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
  "geographic_accessibility": "",
  "status": "",
  "presenting_complaints": "",
  "presentingComplaintsTable": [{"date": "", "complaint": "", "notes": ""}],
  "comorbidity": "",
  "hospital_admissions": "",
  "ecog_status": "",
  "functional_adl_score": "",
  "functional_adl_items": "",
  "functional_iadl_score": "",
  "functional_iadl_items": "",
  "past_surgical_history": "",
  "priorChemoTable": [{"date": "", "agent": "", "dose": "", "frequency": "", "duration": "", "cancer_type": "", "adverse_effects": "", "notes": ""}],
  "priorRadioTable": [{"date": "", "agent": "", "dose": "", "frequency": "", "duration": "", "cancer_type": "", "adverse_effects": "", "notes": ""}],
  "priorImmunoTable": [{"date": "", "agent": "", "dose": "", "frequency": "", "duration": "", "cancer_type": "", "adverse_effects": "", "notes": ""}],
  "priorHormoneTable": [{"date": "", "agent": "", "dose": "", "frequency": "", "duration": "", "cancer_type": "", "adverse_effects": "", "notes": ""}],
  "priorTargetedTable": [{"date": "", "agent": "", "dose": "", "frequency": "", "duration": "", "cancer_type": "", "adverse_effects": "", "notes": ""}],
  "charlson_index": "",
  "charlson_conditions": "",
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
  "anthropometricTable": [{"date": "", "height": "", "weight": "", "bmi": "", "bsa": ""}],
  "otherAnthropometricTable": [{"date": "", "measure": "", "value": "", "unit": ""}],
  "exam_findings": "",
  "systemic_exam": "",
  "systemicInquiry": [{"system": "", "symptoms": []}],
  "examFindingsTable": [],
  "provisional_diagnosis": "",
  "bloodTable": [{"blood_type": "", "blood_purpose": "", "blood_date": "", "blood_findings": "", "blood_notes": ""}],
  "tumorMarkersTable": [{"marker_name": "", "marker_value": "", "marker_unit": "", "marker_date": "", "marker_purpose": "", "marker_notes": ""}],
  "imagingTable": [{"imaging_type": "", "imaging_purpose": "", "imaging_date": "", "imaging_parameter": "", "imaging_findings": "", "mass_present": "", "mass_size": "", "mass_location": "", "calcifications": "", "lymph_nodes": "", "metastasis": "", "ascites": "", "pv_status": "", "sma_status": ""}],
  "endoscopyTable": [{"endo_type": "", "endo_purpose": "", "endo_date": "", "endo_parameter": "", "endo_findings": ""}],
  "otherInvTable": [{"otherinv_type": "", "otherinv_purpose": "", "otherinv_date": "", "otherinv_parameter": "", "otherinv_findings": ""}],
  "biopsyTable": [{"biopsy_type": "", "biopsy_purpose": "", "biopsy_date": "", "biopsy_parameter": "", "biopsy_findings": "", "biopsy_stage": "", "lvi": "", "perineural_invasion": "", "margin_status": "", "cell_type": "", "metastasis": "", "lymph_nodes": ""}],
  "immunohistochemistryTable": [{"ihc_specimen": "", "ihc_panel": "", "ihc_marker": "", "ihc_result": "", "ihc_intensity": "", "ihc_percentage": "", "ihc_score": "", "ihc_pattern": "", "ihc_method": "", "ihc_date": "", "ihc_purpose": "", "ihc_lab": "", "ihc_pathologist": "", "ihc_interpretation": "", "ihc_notes": ""}],
  "geneticTable": [{"test_name": "", "gene": "", "variant": "", "result": "", "method": "", "date": "", "purpose": "", "notes": ""}],
  "contrastTable": [{"study_type": "", "contrast_agent": "", "body_part": "", "findings": "", "date": "", "purpose": "", "notes": ""}],
  "supplementaryDetailsTable": [{"detail_heading": "", "detail_subheading": "", "detail_label": "", "detail_value": "", "detail_unit": "", "detail_date": "", "detail_priority": "", "detail_category": "", "detail_source": "", "detail_notes": ""}],
  "stagingTable": [{"staging_system": "", "staging_notes": ""}],
  "overall_stage": "",
  "tnm_stage": "",
  "final_diagnosis": "",
  "definitiveDiagnosisTable": [{"date": "", "diagnosis": "", "notes": ""}],
  "diagnosis_delay_days": "",
  "clinicalStagingTable": [{"staging_system": "", "staging_type": "", "staging_date": "", "staging_notes": "", "clinical_t": "", "clinical_n": "", "clinical_m": "", "pathological_t": "", "pathological_n": "", "pathological_m": "", "clinical_stage_group": "", "pathological_stage_group": "", "figo_stage": "", "ann_arbor_stage": "", "ann_arbor_modifier": "", "lugano_stage": "", "lugano_modifier": "", "binet_stage": "", "rai_stage": "", "child_pugh_grade": "", "child_pugh_points": "", "bclc_stage": "", "dukes_stage": "", "iss_stage": "", "riss_stage": "", "gleason_score": "", "gleason_grade_group": "", "inss_stage": "", "inrg_stage": "", "nwts_stage": "", "masaoka_stage": "", "who_cns_grade": "", "chang_stage": "", "iblp_stage": "", "hklc_stage": "", "clark_level": "", "breslow_thickness": ""}],
  "histologyGradingTable": [{"grading_system": "", "grading_date": "", "grading_notes": "", "histological_grade": "", "histological_grade_description": "", "differentiation": "", "nuclear_grade": "", "mitotic_count": "", "mitotic_score": "", "ki67_percentage": "", "lymphovascular_invasion": "", "perineural_invasion": "", "tumor_budding": "", "necrosis": "", "cellularity": "", "nottingham_score": "", "nottingham_grade": "", "nottingham_tubule_score": "", "nottingham_nuclear_score": "", "nottingham_mitotic_score": "", "fuhrman_grade": "", "isup_grade": "", "who_isup_grade": "", "gleason_primary": "", "gleason_secondary": "", "gleason_score": "", "gleason_grade_group": "", "figo_grade": "", "who_cns_grade": "", "lepidic_pattern": "", "acinar_pattern": "", "papillary_pattern": "", "micropapillary_pattern": "", "solid_pattern": "", "tumor_differentiation": "", "mucinous_component": "", "signet_ring_cells": "", "medullary_features": "", "sarcoma_grade": "", "mitoses_per_10hpf": "", "tumor_necrosis_percentage": ""}],
  "preOperativeAssessmentTable": [{"surgery_name": "", "assessment_date": "", "lab_hb": "", "lab_wbc": "", "lab_platelets": "", "lab_creatinine": "", "lab_egfr": "", "lab_albumin": "", "lab_inr": "", "lab_aptt": "", "lab_alt": "", "lab_ast": "", "lab_bilirubin": "", "lab_crp": "", "lab_troponin": "", "lab_bnp": "", "lab_blood_group": "", "lab_other": "", "additional_labs": [], "additional_imaging": [], "baseline_imaging_type": "", "baseline_imaging_date": "", "baseline_imaging_findings": "", "surgical_candidacy": "", "surgical_candidacy_notes": "", "asa_class": "", "asa_notes": "", "margin_status_expectation": "", "margin_notes": "", "expected_resection_extent": "", "expected_resection_notes": "", "expected_lymphadenectomy": "", "expected_lymph_node_levels": "", "expected_lymph_node_count": "", "cardiac_assessment_status": "", "cardiac_ecg_findings": "", "cardiac_echo_findings": "", "cardiac_risk_stratification": "", "cardiac_clearance": "", "cardiac_notes": "", "pulmonary_assessment_status": "", "pulmonary_pft_findings": "", "pulmonary_imaging_findings": "", "pulmonary_risk_stratification": "", "pulmonary_clearance": "", "pulmonary_notes": "", "liver_assessment_status": "", "liver_child_pugh_score": "", "liver_child_pugh_grade": "", "liver_meld_score": "", "liver_meld_na_score": "", "liver_albi_grade": "", "liver_fibrosis_stage": "", "liver_steatosis": "", "liver_portal_hypertension": "", "liver_notes": "", "kidney_assessment_status": "", "kidney_ckd_stage": "", "kidney_egfr_category": "", "kidney_rifle_stage": "", "kidney_akin_stage": "", "kidney_kdigo_stage": "", "kidney_urine_acr": "", "kidney_proteinuria": "", "kidney_notes": "", "metabolic_diabetes_status": "", "metabolic_hba1c": "", "metabolic_nutritional_status": "", "metabolic_risk_stratification": "", "metabolic_notes": "", "immunological_status": "", "immunological_neutrophil_count": "", "immunological_lymphocyte_count": "", "immunological_hiv_status": "", "immunological_steroid_use": "", "immunological_other_immunosuppression": "", "immunological_notes": "", "possum_physiological_score": "", "possum_operative_severity": "", "possum_predicted_morbidity": "", "possum_predicted_mortality": "", "possum_notes": "", "neoadj_chemo_received": "", "neoadj_chemo_regimen": "", "neoadj_chemo_cycles": "", "neoadj_chemo_completion_date": "", "neoadj_chemo_response": "", "neoadj_chemo_response_details": "", "neoadj_radio_received": "", "neoadj_radio_regimen": "", "neoadj_radio_dose": "", "neoadj_radio_completion_date": "", "neoadj_radio_response": "", "neoadj_radio_response_details": "", "organ_resistance_testing": "", "organ_resistance_results": "", "organ_resistance_notes": "", "mdt_date": "", "mdt_participants": "", "mdt_recommendation": "", "mdt_decision": "", "mdt_notes": ""}],
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
  "source_file_summaries": [{"file_name": "", "document_type": "", "clinically_relevant_summary": "", "unclear_or_unreadable_parts": ""}],
  "extraction_safety_note": ""
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileContent, mimeType, fileName, patientId, sectionTarget } = req.body;
  if (!fileContent) return res.status(400).json({ error: "No file content uploaded for extraction." });

  geminiRequestCount++;

  try {
    const base64Data = String(fileContent).replace(/^data:.*?;base64,/, "");
    let driveFileResult = null;

    if (patientId) {
      const patients = await listCollection("patients");
      const patient = patients.find((p: any) => p.id === patientId);
      if (patient) {
        const folderId = await ensureDriveFolder(patient);
        driveFileResult = await uploadToDrive(
          { contentBase64: base64Data, name: fileName, mimeType: mimeType || "application/octet-stream" },
          folderId
        );
        const id = newId("file");
        const metadata = {
          id,
          patientId,
          name: fileName,
          mimeType: mimeType || "application/octet-stream",
          size: Number(driveFileResult.size || 0),
          uploadDate: new Date().toISOString().split("T")[0],
          extracted: true,
          driveFileId: driveFileResult.id,
          driveFolderId: folderId,
          webViewLink: driveFileResult.webViewLink || "",
          webContentLink: driveFileResult.webContentLink || "",
        };
        await saveDocument("files", id, metadata);
      }
    }

    const text = await runGemini(
      [
        {
          inlineData: {
            mimeType: mimeType || "application/octet-stream",
            data: base64Data,
          },
        },
        {
          text: `${sectionTarget ? `SECTION-TARGETED EXTRACTION: Prioritize and populate the predefined fields belonging to the "${sectionTarget}" form section. Return other clinically important data only when clearly present; never force unrelated values into the target section.\n\n` : ""}Extract every clinically relevant oncology detail from "${fileName || "document"}". Preserve terminology exactly, but do not merely OCR-copy text. Think like an autonomous medical data-entry agent: infer which app cage each value belongs to, merge synonymous labels, create every needed row, choose the closest table and dropdown field, preserve all extra columns in notes/unmapped rows, and map values into this schema:\n${schemaPrompt}\n\nWHAT TO EXTRACT — THINK LIKE A DOCTOR, NOT OCR:\nExtract ONLY what was done to / found in THIS PATIENT — with measurement units:\n- Presenting complaint, history of present illness, past medical history (comorbidities), allergies, family history\n- Systemic inquiry (systemicInquiry): per-system review of symptoms (General, Head & Neck, Eyes, Ears, Nose, Oral, Respiratory, CVS, GI, GU, MSK, Neuro, Skin, Endocrine, Psychiatric, Hematological, Allergic, Breast, Gynecological)\n- Physical exam findings (organ systems, vitals, performance status: ECOG, Karnofsky)\n- Anthropometric measures (anthropometricTable: height, weight, bmi, bsa per date; otherAnthropometricTable: waist circumference, MUAC, skinfolds, arm span, etc. per date)\n- Risk factors (smoking pack-years, alcohol, occupational, environmental)\n- Blood results (Hb, WBC, neutrophils, lymphocytes, platelets, LFT, renal, electrolytes, coagulation) — value + unit\n- Tumor markers (CEA, AFP, CA 19-9, CA 125, CA 15-3, PSA, beta-hCG, LDH, etc.) — value + unit\n- Imaging findings (mass size/location/present, lymph nodes, metastases, ascites, PV/SMA status) — measurements with units\n- Biopsy / histopathology (cell type, grade, margins, LVI, perineural invasion, lymph nodes)\n- Immunohistochemistry (each stain: marker, result, intensity, %, score/CPS/TPS, pattern, interpretation)\n- Genetic / molecular testing (NGS panels, single-gene tests, BRCA, EGFR, KRAS, etc.) — test name, gene, variant, result, method, purpose\n- Contrast studies (CT Angio, IVP, MCUG, etc.) — study type, contrast agent, body part, purpose, findings\n- Staging (TNM, FIGO, Ann Arbor, Breslow, Gleason)\n- Treatment: neoadjuvant/adjuvant chemo (drug, dose, frequency, route, cycles, effects), neoadjuvant/adjuvant radio (dose, fractions, technique)\n- Surgery (name, date, site, approach, findings, drain status/volume)\n- Post-op complications (complication, POD/day, management)\n- Post-op monitoring (parameter, duration, findings)\n- ICU admission (date, stay days, management, exit)\n- Ward admission (entry, stay days, management, exit)\n- Management plan steps / discharge medications / follow-up\n- Problem list with management plans\n\nDYNAMIC ROW / COLUMN / HEADING / SUBHEADING / CELL ADDITION (mandatory behavior):\n\nPRIORITY ORDER (MUST FOLLOW IN THIS ORDER):\n1. PREDETERMINED FIELDS FIRST. Every value in the source MUST be checked against the predefined top-level keys and per-row fields before considering supplementaryDetailsTable.\n2. If a value does not fit any predefined field or table, THEN use supplementaryDetailsTable.\n3. If a similar value already exists in the patient's record, treat it as an UPDATE / ADDITIONAL DATA POINT — append a new row.\n\nADDITIVE / APPEND-ONLY BEHAVIOR (NEVER DESTROY EXISTING DATA):\n- This pipeline is APPEND-ONLY. Do not overwrite existing values.\n- For tables: emit ONE new row per distinct finding, date, or panel.\n- For top-level scalar fields: emit empty string if source is silent.\n\nPREDETERMINED-FIELD COVERAGE CHECK:\n- Demographics: first_name, last_name, initials, dob, age, gender, nic, tp, oncology_types, geographic_accessibility\n- Vitals: weight, height, bmi\n- Anthropometrics: anthropometricTable (height/weight per date), otherAnthropometricTable (waist circumference, MUAC, skinfolds, etc. per date)\n- Examination: examFindingsTable (one row per organ system)\n- History: drugTable, familyTable, riskTable, systemicInquiry\n- Investigations: bloodTable, tumorMarkersTable, imagingTable, endoscopyTable, otherInvTable, biopsyTable, immunohistochemistryTable, geneticTable, contrastTable\n- Tumour characteristics: tumorCharacteristicsTable. Emit one row per primary cancer site. Within each site row, append every site-specific result to molecular_markers_entries, immunohistochemistry_entries, genomic_testing_entries, and gene_expression_profile_entries. Each nested entry must be { parameter, finding, source: "AI" }. Keep multiple markers/tests as separate entries and never overwrite another primary site findings. Also populate tumor_size_length, tumor_size_width, tumor_size_depth, tumor_size_unit, nodal_metastasis_details, distant_metastasis_details, tumor_differentiation_status, pathological_interpretation, pathology_reporting_status, pathology_reporting_date, risk_stratification, genomic_risk_score, tumor_associated_macrophages, stroma_percentage, tumor_infiltrating_lymphocytes, and mitotic_rate whenever documented.\n- Staging: stagingTable pre-first, fallback to supplementary\n- Treatment: neoChemoTable+status, adjChemoTable+status, neoRadioTable+status, adjRadioTable+status, surgeryTable, complicationTable, monitoringTable, icuTable, wardTable, commonDrugsTable, problemTable\n- Oncological outcomes: oncologicalOutcomeTable. Emit one row per dated assessment with response, progression, recurrence, survival, ECOG, tumour-marker follow-up, imaging follow-up, and outcome notes. Do not place these oncology follow-up outcomes in the surgical outcome table.\n\nSUPPLEMENTARY DETAILS — USE ONLY WHEN DATA DOES NOT FIT ANYWHERE ABOVE.\n\nHEADING DEDUPLICATION: Use canonical headings (Genetic Testing, Performance Status, Vitals, Lifestyle, Staging Details, Pathology Details, Comorbidities, Adverse Event Logs, Discharge Medications, Follow-up Schedule, Vaccinations, Pregnancy / Reproductive History, Allergies, Care Plan, Patient-Reported Outcomes, Discharge Summary, Bone Health, Renal Function, Coagulation, Infectious Disease, Psychosocial).\n\nCOLUMN / LABEL DEDUPLICATION: Use canonical label forms (ECOG, BMI, BP, HR, SpO2, LVEF, VAF, FIGO, Karnofsky). Units in detail_unit.\n\nIMMUNOHISTOCHEMISTRY / IHC — emit ONE row PER STAIN per report. Populate ihc_panel, ihc_marker, ihc_result, ihc_intensity, ihc_percentage, ihc_score, ihc_pattern, ihc_method, ihc_date, ihc_lab, ihc_pathologist, ihc_interpretation, ihc_notes.\n\nNEVER DO:\n- NEVER overwrite existing values.\n- NEVER refuse to fill a predefined field.\n- NEVER create a new heading when an equivalent exists.\n- NEVER collapse repeated findings into one row.\n- NEVER invent a value.`,
        },
      ],
      "You are an expert oncology data extraction agent and autonomous form-filling agent. Return the requested flat JSON schema only. Interpret field meaning intelligently instead of plain OCR. Add unlimited rows when the source has repeated findings. Do not omit medical values. Do not invent values.",
      "application/json"
    );

    return res.json({
      ...normalizeExtraction(extractJsonObject(text)),
      driveFile: driveFileResult,
    });
  } catch (error: any) {
    return res.status(502).json({ error: `AI extraction failed: ${error.message}` });
  }
}
