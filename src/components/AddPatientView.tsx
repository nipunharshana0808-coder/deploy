/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  Upload,
  Folder,
  FileText,
  Plus,
  Trash,
  Save,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle,
  File,
  Download,
  RefreshCw,
  Pill,
  Radio,
  Users,
  Wine,
  Stethoscope,
  ClipboardList,
  FileCheck2,
  Scissors,
  Activity,
  HeartPulse,
  BedDouble,
  Home
} from "lucide-react";
import { 
  PatientRecord, 
  OncologyCategory, 
  PatientStatus, 
  DrugTableEntry, 
  FamilyTableEntry, 
  RiskTableEntry, 
  BloodTableEntry, 
  ImagingTableEntry, 
  EndoscopyTableEntry, 
  OtherInvTableEntry, 
  BiopsyTableEntry, 
  StagingTableEntry, 
  ProblemTableEntry, 
  CommonDrugsTableEntry, 
  NeoChemoTableEntry, 
  NeoRadioTableEntry, 
  SurgeryTableEntry, 
  ComplicationTableEntry, 
  MonitoringTableEntry, 
  IcuTableEntry, 
  WardTableEntry,
  DiskFile
} from "../types";
import { notify } from "./AppDialog";
import AnimatedButton from "./AnimatedButton";
import { SkeletonText, SkeletonTable, SkeletonPatientCard } from "./Skeleton";
import ProgressBar from "./ProgressBar";
import RevealOnScroll from "./RevealOnScroll";

interface AddPatientViewProps {
  key?: string;
  initialPatientData?: PatientRecord | null;
  onSavePatient: (record: PatientRecord) => Promise<PatientRecord>;
  onNavigateHome: () => void;
  allExistingFiles?: DiskFile[];
  onUploadFile?: (file: { name: string; mimeType: string; size: number; patientId: string; contentBase64: string; extracted: boolean }) => Promise<any>;
}

export default function AddPatientView({ 
  initialPatientData, 
  onSavePatient, 
  onNavigateHome,
  allExistingFiles = [],
  onUploadFile
}: AddPatientViewProps) {

  // Consent checkpoint
  const [consentTaken, setConsentTaken] = useState(initialPatientData ? true : false);

  // Accordion Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    demographics: true,
    history: false,
    examination: false,
    provisionalDiagnosis: false,
    definitiveDiagnosis: false,
    investigations: false,
    supplementary: false,
    treatments: false,
    surgicalProcedures: false,
    care: false,
    extraParams: false,
    drive: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // AI Extraction Drag State
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStage, setExtractStage] = useState("");
  const [isVaultUploading, setIsVaultUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [vaultProgress, setVaultProgress] = useState(0);
  const [vaultStage, setVaultStage] = useState("");
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vaultFileInputRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const flashShake = (node: HTMLElement | null | undefined) => {
    if (!node) return;
    node.classList.remove("input-shake");
    void node.offsetWidth;
    node.classList.add("input-shake");
    setTimeout(() => node.classList.remove("input-shake"), 540);
  };
  const [oncologySearch, setOncologySearch] = useState("");

  // Form patient record state
  const [formState, setFormState] = useState<Partial<PatientRecord>>({
    id: "",
    oncology: OncologyCategory.OTHER,
    oncology_types: [],
    oncology_other: "",
    date: new Date().toISOString().split("T")[0],
    auto_id: "",
    tp: "",
    nic: "",
    title: "Mr.",
    initials: "",
    first_name: "",
    last_name: "",
    bht: "",
    clinic: "",
    dob: "",
    age: "",
    gender: "Male",
    living_area: "",
    hospital: "",
    ward_no: "",
    marital_status: "Single",
    occupation: "",
    status: "active" as PatientStatus,
    presenting_complaints: "",
    comorbidity: "",
    hospital_admissions: "",
    past_surgical_history: "",
    drugTable: [],
    allergy_food: "",
    allergy_drugs: "",
    allergy_plasters: "",
    allergy_other: "",
    familyTable: [],
    smoking: "Non-consumer",
    smoking_amount: "",
    alcohol: "Non-consumer",
    alcohol_amount: "",
    riskTable: [],
    bmi: "",
    bsa: "",
    height: "",
    weight: "",
    exam_findings: "",
    systemic_exam: "",
    examFindingsTable: [
      { organ_system: "BMI", findings: "", notes: "" },
      { organ_system: "BSA", findings: "", notes: "" },
    ],
    provisional_diagnosis: "",
    bloodTable: [],
    tumorMarkersTable: [],
    imagingTable: [],
    endoscopyTable: [],
    otherInvTable: [],
    biopsyTable: [],
    immunohistochemistryTable: [],
    supplementaryDetailsTable: [],
    stagingTable: [],
    overall_stage: "",
    tnm_stage: "",
    final_diagnosis: "",
    problemTable: [],
    commonDrugsTable: [],
    neo_chemo_status: "",
    neoChemoTable: [],
    adj_chemo_status: "",
    adjChemoTable: [],
    neo_radio_status: "",
    neoRadioTable: [],
    adj_radio_status: "",
    adjRadioTable: [],
    surgeryTable: [],
    complicationTable: [],
    monitoringTable: [],
    icu_done: "Not done",
    icuTable: [],
    wardTable: [],
    follow_up_notes: "",
    general_notes: "",
    unmapped_medical_information: [],
    source_file_summaries: [],
    extraction_safety_note: ""
  });
  const selectedOncologyTypes = Array.from(
    new Set([...(formState.oncology_types || []), formState.oncology].filter(Boolean) as string[])
  ).filter((cat) => Object.values(OncologyCategory).includes(cat as OncologyCategory));

  // Load initial data during audits or edits
  useEffect(() => {
    if (initialPatientData) {
      setFormState(initialPatientData);
      setConsentTaken(true);
    }
  }, [initialPatientData]);

  // Virtual files for this patient
  const patientFiles = formState.id 
    ? allExistingFiles.filter(f => f.patientId === formState.id)
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const toggleOncologyType = (cat: OncologyCategory) => {
    setFormState((prev) => {
      const current = new Set([...(prev.oncology_types || []), prev.oncology].filter(Boolean) as string[]);
      if (current.has(cat)) {
        current.delete(cat);
      } else {
        current.add(cat);
      }
      const oncologyTypes = Array.from(current).filter((item) => item !== OncologyCategory.OTHER || current.has(OncologyCategory.OTHER));
      return {
        ...prev,
        oncology_types: oncologyTypes,
        oncology: (oncologyTypes.find((item) => item !== OncologyCategory.OTHER) || oncologyTypes[0] || OncologyCategory.OTHER) as OncologyCategory,
        oncology_other: oncologyTypes.includes(OncologyCategory.OTHER) ? prev.oncology_other || oncologySearch : prev.oncology_other,
      };
    });
  };

  const tableTemplates: Record<string, Record<string, string>> = {
    drugTable: { drug_name: "", dose: "", frequency: "", duration: "", notes: "" },
    familyTable: { comorbidity: "", relationship: "", family_notes: "" },
    riskTable: { risk_factor: "", risk_notes: "" },
    examFindingsTable: { organ_system: "", findings: "", notes: "" },
    bloodTable: { blood_type: "", blood_purpose: "", blood_date: "", blood_findings: "", blood_notes: "" } as any,
    tumorMarkersTable: { marker_name: "", marker_value: "", marker_unit: "", marker_date: "", marker_ref_range: "", marker_notes: "" },
    imagingTable: { imaging_type: "", imaging_purpose: "", imaging_parameter: "", imaging_findings: "", mass_present: "", mass_size: "", mass_location: "", calcifications: "", lymph_nodes: "", metastasis: "", ascites: "", pv_status: "", sma_status: "" },
    endoscopyTable: { endo_type: "", endo_purpose: "", endo_parameter: "", endo_findings: "" },
    otherInvTable: { otherinv_type: "", otherinv_purpose: "", otherinv_parameter: "", otherinv_findings: "" },
    biopsyTable: { biopsy_type: "", biopsy_purpose: "", biopsy_parameter: "", biopsy_findings: "", biopsy_stage: "", lvi: "", perineural_invasion: "", margin_status: "", cell_type: "", metastasis: "", lymph_nodes: "" },
    immunohistochemistryTable: { ihc_specimen: "", ihc_panel: "", ihc_marker: "", ihc_result: "", ihc_intensity: "", ihc_percentage: "", ihc_score: "", ihc_pattern: "", ihc_method: "", ihc_date: "", ihc_lab: "", ihc_pathologist: "", ihc_interpretation: "", ihc_notes: "" },
    supplementaryDetailsTable: { detail_heading: "", detail_subheading: "", detail_label: "", detail_value: "", detail_unit: "", detail_date: "", detail_priority: "medium", detail_category: "", detail_source: "", detail_notes: "" },
    stagingTable: { staging_system: "", staging_notes: "" },
    problemTable: { problem: "", management_plan: "" },
    commonDrugsTable: { common_drug: "", common_dose: "", common_frequency: "", common_drug_notes: "" },
    neoChemoTable: { neo_chemo_drug: "", neo_chemo_dose: "", neo_chemo_freq: "", neo_chemo_route: "", neo_chemo_cycles: "", neo_chemo_effects: "", neo_chemo_notes: "" },
    adjChemoTable: { neo_chemo_drug: "", neo_chemo_dose: "", neo_chemo_freq: "", neo_chemo_route: "", neo_chemo_cycles: "", neo_chemo_effects: "", neo_chemo_notes: "" },
    neoRadioTable: { neo_radio_comp: "", neo_radio_dose: "", neo_radio_freq: "", neo_radio_route: "", neo_radio_cycles: "", neo_radio_effects: "", neo_radio_notes: "" },
    adjRadioTable: { neo_radio_comp: "", neo_radio_dose: "", neo_radio_freq: "", neo_radio_route: "", neo_radio_cycles: "", neo_radio_effects: "", neo_radio_notes: "" },
    surgeryTable: { surgery_name: "", surgery_date: "", surgery_site: "", surgery_approach: "", surgery_findings: "", drain_status: "", drain_volume: "", surgery_notes: "" },
    complicationTable: { complication: "", post_op_duration: "", management: "", notes: "" },
    monitoringTable: { monitor_param: "", monitor_duration: "", monitor_findings: "", monitor_notes: "" },
    icuTable: { icu_date: "", icu_stay: "", icu_mgmt: "", icu_exit: "", icu_notes: "" },
    wardTable: { ward_entry: "", ward_stay: "", ward_mgmt: "", ward_exit: "", ward_notes: "" },
    unmapped_medical_information: { source_section: "", detail: "", medical_importance: "medium" },
    source_file_summaries: { file_name: "", document_type: "", clinically_relevant_summary: "", unclear_or_unreadable_parts: "" },
  };

  const tableAliases: Record<string, string> = {
    medications: "drugTable",
    medicationTable: "drugTable",
    drugs: "drugTable",
    blood_results: "bloodTable",
    labs: "bloodTable",
    tumor_markers: "tumorMarkersTable",
    markers: "tumorMarkersTable",
    laboratory_results: "bloodTable",
    imaging: "imagingTable",
    scans: "imagingTable",
    pathology: "biopsyTable",
    biopsies: "biopsyTable",
    ihc: "immunohistochemistryTable",
    immunohistochemistry: "immunohistochemistryTable",
    immunostains: "immunohistochemistryTable",
    staining: "immunohistochemistryTable",
    supplementary: "supplementaryDetailsTable",
    supplementary_details: "supplementaryDetailsTable",
    supplementary_details_table: "supplementaryDetailsTable",
    additional_details: "supplementaryDetailsTable",
    extra_details: "supplementaryDetailsTable",
    dynamic_details: "supplementaryDetailsTable",
    staging: "stagingTable",
    problems: "problemTable",
    management_plans: "problemTable",
    supportive_medications: "commonDrugsTable",
    chemotherapy: "neoChemoTable",
    chemo: "neoChemoTable",
    neo_chemo: "neoChemoTable",
    neo_chemotherapy: "neoChemoTable",
    neoadjuvant_chemo: "neoChemoTable",
    neoadjuvant_chemotherapy: "neoChemoTable",
    adj_chemo: "adjChemoTable",
    adj_chemotherapy: "adjChemoTable",
    adjuvant_chemo: "adjChemoTable",
    adjuvant_chemotherapy: "adjChemoTable",
    radiotherapy: "neoRadioTable",
    radiation: "neoRadioTable",
    neo_radio: "neoRadioTable",
    neo_radiotherapy: "neoRadioTable",
    neoadjuvant_radiation: "neoRadioTable",
    neoadjuvant_radiotherapy: "neoRadioTable",
    adj_radio: "adjRadioTable",
    adj_radiotherapy: "adjRadioTable",
    adjuvant_radiation: "adjRadioTable",
    adjuvant_radiotherapy: "adjRadioTable",
    surgeries: "surgeryTable",
    complications: "complicationTable",
    monitoring: "monitoringTable",
    examination: "examFindingsTable",
    exam: "examFindingsTable",
    physical_exam: "examFindingsTable",
    physical_examination: "examFindingsTable",
    systemic_examination: "examFindingsTable",
    systemic_exam_table: "examFindingsTable",
    cvs: "examFindingsTable",
    rs: "examFindingsTable",
    pa: "examFindingsTable",
    cns: "examFindingsTable",
    icu: "icuTable",
    ward: "wardTable",
    unmapped: "unmapped_medical_information",
  };

  const fieldAliases: Record<string, keyof PatientRecord> = {
    TP: "tp",
    telephone: "tp",
    telephone_number: "tp",
    phone: "tp",
    phone_number: "tp",
    mobile: "tp",
    mobile_number: "tp",
    contact: "tp",
    contact_number: "tp",
    tel: "tp",
    living: "living_area",
    living_address: "living_area",
    address: "living_area",
    home_address: "living_area",
    residential_address: "living_area",
    residence: "living_area",
    location: "living_area",
    area: "living_area",
    town: "living_area",
    village: "living_area",
    oncology_type: "oncology_types",
    cancer_type: "oncology_types",
    cancer_types: "oncology_types",
    tumor_type: "oncology_types",
    tumor_types: "oncology_types",
    tumour_type: "oncology_types",
    tumour_types: "oncology_types",
    primary_site: "oncology_types",
    primary_sites: "oncology_types",
  };

  const sectionByExtractedKey: Record<string, string> = {
    title: "demographics",
    initials: "demographics",
    first_name: "demographics",
    last_name: "demographics",
    dob: "demographics",
    age: "demographics",
    gender: "demographics",
    nic: "demographics",
    tp: "demographics",
    oncology: "demographics",
    oncology_types: "demographics",
    oncology_type: "demographics",
    cancer_type: "demographics",
    cancer_types: "demographics",
    tumor_type: "demographics",
    tumor_types: "demographics",
    tumour_type: "demographics",
    tumour_types: "demographics",
    primary_site: "demographics",
    primary_sites: "demographics",
    presenting_complaints: "history",
    comorbidity: "history",
    hospital_admissions: "history",
    past_surgical_history: "history",
    drugTable: "history",
    familyTable: "history",
    riskTable: "history",
    bloodTable: "investigations",
    tumorMarkersTable: "investigations",
    imagingTable: "investigations",
    endoscopyTable: "investigations",
    otherInvTable: "investigations",
    biopsyTable: "investigations",
    immunohistochemistryTable: "investigations",
    supplementaryDetailsTable: "supplementary",
    stagingTable: "investigations",
    overall_stage: "investigations",
    tnm_stage: "investigations",
    neoChemoTable: "treatments",
    adjChemoTable: "treatments",
    neoRadioTable: "treatments",
    adjRadioTable: "treatments",
    neo_chemo_status: "treatments",
    adj_chemo_status: "treatments",
    neo_radio_status: "treatments",
    adj_radio_status: "treatments",
    surgeryTable: "surgicalProcedures",
    complicationTable: "surgicalProcedures",
    monitoringTable: "surgicalProcedures",
    icu_done: "surgicalProcedures",
    problemTable: "care",
    commonDrugsTable: "care",
    icuTable: "surgicalProcedures",
    wardTable: "surgicalProcedures",
    follow_up_notes: "care",
    general_notes: "care",
    unmapped_medical_information: "extraParams",
    examFindingsTable: "examination",
    exam_findings: "examination",
    systemic_exam: "examination",
    provisional_diagnosis: "provisionalDiagnosis",
    final_diagnosis: "definitiveDiagnosis",
  };

  const normalizeExtractedRow = (tableKey: string, row: any) => {
    const template = tableTemplates[tableKey];
    if (!template || typeof row !== "object" || row === null || Array.isArray(row)) return row;

    const normalized: Record<string, any> = { ...template };
    const extraPairs: string[] = [];
    Object.entries(row).forEach(([field, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (field in template) {
        normalized[field] = value;
      } else {
        extraPairs.push(`${field}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
      }
    });

    if (extraPairs.length > 0) {
      const noteField = Object.keys(template).find((field) => field.endsWith("_notes") || field === "notes" || field.includes("findings"));
      if (noteField) {
        normalized[noteField] = [normalized[noteField], extraPairs.join("; ")].filter(Boolean).join("; ");
      }
    }
    return normalized;
  };

  const mergeAiExtractionIntoForm = (prev: Partial<PatientRecord>, extractedData: any) => {
    const merged: Record<string, any> = { ...prev };
    const openedSections = new Set<string>();
    const normalizedData: Record<string, any> = {};

    const normalizeHeading = (h: string) =>
      (h || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s\/]/g, "");
    const headingAlias = (h: string) => {
      const n = normalizeHeading(h);
      const map: Record<string, string> = {
        "genetics": "Genetic Testing",
        "genomic testing": "Genetic Testing",
        "genomic": "Genetic Testing",
        "ps": "Performance Status",
        "ecog": "Performance Status",
        "functional status": "Performance Status",
        "vital signs": "Vitals",
        "vital": "Vitals",
        "habits": "Lifestyle",
        "social history": "Lifestyle",
        "stage notes": "Staging Details",
        "path notes": "Pathology Details",
        "co morbidities": "Comorbidities",
        "past medical history": "Comorbidities",
        "side effects": "Adverse Event Logs",
        "adverse events": "Adverse Event Logs",
        "discharge meds": "Discharge Medications",
        "meds on discharge": "Discharge Medications",
        "follow up": "Follow-up Schedule",
        "followup": "Follow-up Schedule",
        "immunizations": "Vaccinations",
        "obgyn history": "Pregnancy / Reproductive History",
        "drug allergies": "Allergies",
        "plan of care": "Care Plan",
        "pros": "Patient-Reported Outcomes",
        "patient symptoms": "Patient-Reported Outcomes",
        "dc summary": "Discharge Summary",
        "bone density": "Bone Health",
        "kidney function": "Renal Function",
        "coag profile": "Coagulation",
        "id": "Infectious Disease",
        "infection history": "Infectious Disease",
        "psych": "Psychosocial",
        "social": "Psychosocial",
      };
      return map[n] || (h || "").trim();
    };
    const labelAlias = (l: string) => {
      const n = (l || "").trim().toLowerCase().replace(/\s+/g, " ");
      const map: Record<string, string> = {
        "ecog ps": "ECOG",
        "ecog performance status": "ECOG",
        "kps": "Karnofsky",
        "ejection fraction": "LVEF",
        "body mass index": "BMI",
        "blood pressure": "BP",
        "heart rate": "HR",
        "pulse rate": "HR",
        "oxygen saturation": "SpO2",
        "variant allele frequency": "VAF",
        "figo stage": "FIGO",
      };
      return map[n] || (l || "").trim();
    };

    const rowSignature = (row: Record<string, any>) =>
      Object.entries(row)
        .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "")
        .map(([k, v]) => `${k}=${String(v).trim().toLowerCase()}`)
        .sort()
        .join("|");
    const existingSignatures = new Map<string, Set<string>>();
    Object.keys(tableTemplates).forEach((k) => {
      const arr = Array.isArray(merged[k]) ? (merged[k] as Record<string, any>[]) : [];
      existingSignatures.set(k, new Set(arr.map(rowSignature)));
    });

    Object.entries(extractedData || {}).forEach(([rawKey, value]) => {
      const key = tableAliases[rawKey] || fieldAliases[rawKey] || rawKey;
      normalizedData[key] = value;
    });

    const knownOncologyTypes = Object.values(OncologyCategory);
    const coerceOncologyList = (value: any) => {
      const values = Array.isArray(value) ? value : String(value).split(/[,;/+&]|\band\b/i);
      const selected: string[] = [];
      const otherValues: string[] = [];
      values.forEach((entry) => {
        const text = typeof entry === "string" ? entry.trim() : String(entry || "").trim();
        if (!text) return;
        const matched = knownOncologyTypes.find((cat) => cat !== OncologyCategory.OTHER && text.toLowerCase().includes(cat.toLowerCase()));
        if (matched) {
          selected.push(matched);
        } else if (text.toLowerCase() !== "other") {
          selected.push(OncologyCategory.OTHER);
          otherValues.push(text);
        } else {
          selected.push(OncologyCategory.OTHER);
        }
      });
      return { selected: Array.from(new Set(selected)), otherValues: Array.from(new Set(otherValues)) };
    };

    Object.entries(normalizedData).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        if (val.length === 0) return;

        if (key === "oncology_types") {
          const { selected, otherValues } = coerceOncologyList(val);
          if (selected.length > 0) {
            const existingTypes = Array.isArray(merged.oncology_types) ? merged.oncology_types : [];
            merged.oncology_types = Array.from(new Set([...existingTypes, ...selected]));
            merged.oncology = (merged.oncology_types.find((item: string) => item !== OncologyCategory.OTHER) || merged.oncology_types[0] || OncologyCategory.OTHER) as OncologyCategory;
            if (otherValues.length > 0) {
              merged.oncology_other = [merged.oncology_other, otherValues.join(", ")].filter(Boolean).join(", ");
            }
            openedSections.add("demographics");
          }
        } else if (tableTemplates[key]) {
          const normalizedRows = val
            .map((row) => normalizeExtractedRow(key, row))
            .filter((row) => row && typeof row === "object");
          if (normalizedRows.length > 0) {
            const existingArr = Array.isArray(merged[key]) ? (merged[key] as Record<string, any>[]) : [];
            const sigs = existingSignatures.get(key) || new Set<string>();
            const newOnes: Record<string, any>[] = [];
            normalizedRows.forEach((row) => {
              if (key === "supplementaryDetailsTable") {
                row.detail_heading = headingAlias(row.detail_heading || "");
                row.detail_label = labelAlias(row.detail_label || "");
                const targetHeading = normalizeHeading(row.detail_heading || "");
                const matchIdx = existingArr.findIndex((er) => normalizeHeading(er.detail_heading || "") === targetHeading);
                if (matchIdx >= 0) {
                  row.detail_heading = existingArr[matchIdx].detail_heading;
                }
              }
              const sig = rowSignature(row);
              if (!sigs.has(sig)) {
                sigs.add(sig);
                newOnes.push(row);
              }
            });
            if (newOnes.length > 0) {
              merged[key] = [...existingArr, ...newOnes];
              if (sectionByExtractedKey[key]) openedSections.add(sectionByExtractedKey[key]);
            }
          }
        } else {
          const existingUnmapped = Array.isArray(merged.unmapped_medical_information) ? merged.unmapped_medical_information : [];
          merged.unmapped_medical_information = [
            ...existingUnmapped,
            {
              source_section: key,
              detail: JSON.stringify(val),
              medical_importance: "medium",
            },
          ];
          openedSections.add("care");
        }
      } else if (val !== undefined && val !== null && val !== "") {
        if (["oncology", "oncology_type", "cancer_type", "tumor_type", "tumour_type", "primary_site"].includes(key)) {
          const { selected, otherValues } = coerceOncologyList(val);
          if (selected.length > 0) {
            const existingTypes = Array.isArray(merged.oncology_types) ? merged.oncology_types : [];
            merged.oncology_types = Array.from(new Set([...existingTypes, ...selected]));
            merged.oncology = (merged.oncology_types.find((item: string) => item !== OncologyCategory.OTHER) || merged.oncology_types[0] || OncologyCategory.OTHER) as OncologyCategory;
            if (otherValues.length > 0) {
              merged.oncology_other = [merged.oncology_other, otherValues.join(", ")].filter(Boolean).join(", ");
            }
            openedSections.add("demographics");
          }
          return;
        }
        if (val === "" || (typeof val === "string" && val.trim() === "")) {
          if (sectionByExtractedKey[key]) openedSections.add(sectionByExtractedKey[key]);
          return;
        }
        merged[key] = val;
        if (sectionByExtractedKey[key]) openedSections.add(sectionByExtractedKey[key]);
      }
    });

    return { merged: merged as Partial<PatientRecord>, openedSections: Array.from(openedSections) };
  };

  // Helper file converters
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Drag and Drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const ensurePatientSavedBeforeUpload = async () => {
    if (formState.id) return formState.id;
    setExtractProgress(12);
    setExtractStage("Saving patient record before upload");
    try {
      const saved = await onSavePatient(formState as PatientRecord);
      setFormState(prev => ({ ...prev, id: saved.id }));
      return saved.id;
    } catch (error) {
      await notify("Please save the patient record before uploading documents.", "Upload Blocked", "warning");
      return "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!consentTaken) {
      await notify("Please check and confirm patient informed consent before uploading folders or files.", "Consent Required", "warning");
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAttachment(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!consentTaken) {
      await notify("Please check and confirm patient informed consent before uploading folders or files.", "Consent Required", "warning");
      return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAttachment(files[0]);
    }
  };

  // AI Extraction or Regular File Upload processor
  const processAttachment = async (file: File, isPureMedia = false) => {
    if (isPureMedia) {
      setIsVaultUploading(true);
      setVaultProgress(12);
      setVaultStage("Preparing secure Drive upload");
    } else {
      setIsExtracting(true);
      setExtractProgress(8);
      setExtractStage("Reading clinical document");
    }
    try {
      const base64 = await convertToBase64(file);
      let uploadPatientId = formState.id || "";
      if (!uploadPatientId) {
        const savedId = await ensurePatientSavedBeforeUpload();
        if (!savedId) return;
        uploadPatientId = savedId;
      }
      if (isPureMedia) {
        setVaultProgress(38);
        setVaultStage("Encoding media for patient vault");
      } else {
        setExtractProgress(24);
        setExtractStage("Sending document to AI extraction agent");
      }
      
      let extractedData: any = {};
      let driveFile: any = null;
      if (!isPureMedia) {
        try {
          // Trigger AI server extraction
          const response = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileContent: base64,
              mimeType: file.type || "application/octet-stream",
              fileName: file.name,
              patientId: uploadPatientId || undefined
            })
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.error || `AI extraction failed with HTTP ${response.status}`);
          }

          setExtractProgress(68);
          setExtractStage("Mapping extracted values to clinical fields");
          const extractionResponse = await response.json();
          if (extractionResponse?.error) {
            throw new Error(extractionResponse.error);
          }
          ({ driveFile, ...extractedData } = extractionResponse);

          // Update form state with parsed values and track glow highlights
          const sparklesKeys: string[] = [];
          Object.keys(extractedData).forEach((key) => {
            if (extractedData[key] !== undefined && extractedData[key] !== null && extractedData[key] !== "") {
              sparklesKeys.push(key);
            }
          });
          setExtractedFields(new Set(sparklesKeys));

          setFormState(prev => {
            const { merged, openedSections } = mergeAiExtractionIntoForm(prev, extractedData);
            if (openedSections.length > 0) {
              setOpenSections(current => ({
                ...current,
                ...Object.fromEntries(openedSections.map(section => [section, true])),
              }));
            }
            return merged;
          });
          setExtractProgress(92);
          setExtractStage("Adding rows and highlighting AI-filled fields");
        } catch (error: any) {
          console.error("AI extraction failed:", error);
          await notify(error?.message || "AI extraction failed. Please try another file or verify Gemini API settings.", "AI Extraction Failed", "danger");
          if (onUploadFile && uploadPatientId) {
            try {
              setExtractProgress(60);
              setExtractStage("Saving document to Drive without AI extraction");
              await onUploadFile({
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                patientId: uploadPatientId,
                contentBase64: base64,
                extracted: false
              });
              setExtractProgress(100);
              setExtractStage("Upload complete without AI extraction");
              await notify("The document was uploaded to Google Drive without AI extraction.", "Upload Complete", "success");
            } catch (uploadError) {
              console.error("Drive upload fallback failed:", uploadError);
              await notify("AI extraction failed and the direct Google Drive upload could not be completed.", "Upload Failed", "danger");
            }
          } else if (!uploadPatientId) {
            await notify("Save the patient record first, then upload this document to the patient vault.", "Save Patient First", "warning");
          }
          return;
        }
      }

      // Store media in the patient custom subfolder in Google Drive.
      // Format: Google Drive / Patients_Vault / [LastName_Initials]
      // Skip if already uploaded during extraction (driveFile present in response)
      const alreadyUploaded = !isPureMedia && driveFile;
      if (onUploadFile && uploadPatientId && !alreadyUploaded) {
        try {
          if (isPureMedia) {
            setVaultProgress(72);
            setVaultStage("Uploading to Google Drive folder");
          } else {
            setExtractProgress(96);
            setExtractStage("Saving extracted source file to Drive");
          }
          await onUploadFile({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            patientId: uploadPatientId,
            contentBase64: base64,
            extracted: !isPureMedia
          });
          if (isPureMedia) {
            setVaultProgress(100);
            setVaultStage("Upload complete");
          }
        } catch (error) {
          console.error("Drive upload failed after extraction:", error);
          await notify("AI extraction completed, but the file could not be saved to Google Drive. Save the patient record first, then upload media again from the patient dossier.", "Drive Upload Failed", "warning");
        }
      }
      if (!isPureMedia) {
        setExtractProgress(100);
        setExtractStage("AI extraction complete");
      } else if (!uploadPatientId) {
        await notify("Save the patient record first, then upload media to the patient-specific Google Drive folder.", "Save Patient First", "warning");
      }

    } catch (e) {
      console.error("File processing failed:", e);
      await notify("File processing failed before AI extraction. Please try a smaller file or a supported clinical document.", "File Processing Failed", "danger");
    } finally {
      setTimeout(() => {
        setIsExtracting(false);
        setExtractProgress(0);
        setExtractStage("");
        setIsVaultUploading(false);
        setVaultProgress(0);
        setVaultStage("");
      }, 650);
    }
  };

  // Save Record
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentTaken) {
      flashShake(consentRef.current);
      await notify("You must verify patient informed consent is taken.", "Verification Checkpoint", "warning");
      return;
    }

    let missing = false;
    if (!formState.first_name) { flashShake(firstNameRef.current); missing = true; }
    if (!formState.last_name) { flashShake(lastNameRef.current); missing = true; }
    if (missing) {
      await notify("First Name and Last Name are required clinical fields.", "Required Fields Missing", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await onSavePatient(formState as PatientRecord);
      setSaveSuccess(true);
      await notify("Patient clinical record saved in secure Firestore repository.", "Record Saved", "success");
      setTimeout(() => onNavigateHome(), 700);
    } catch (err) {
      await notify("Error saving record: Code 500 Network Timeout.", "Save Failed", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  // Array Table Item dynamic row modifiers
  const addRow = <K extends keyof PatientRecord>(tableKey: K, emptyObj: any) => {
    setFormState(prev => {
      const currentList = Array.isArray(prev[tableKey]) ? [...prev[tableKey] as any] : [];
      return {
        ...prev,
        [tableKey]: [...currentList, emptyObj]
      };
    });
  };

  const removeRow = <K extends keyof PatientRecord>(tableKey: K, index: number) => {
    setFormState(prev => {
      const currentList = Array.isArray(prev[tableKey]) ? [...prev[tableKey] as any] : [];
      currentList.splice(index, 1);
      return {
        ...prev,
        [tableKey]: currentList
      };
    });
  };

  const handleTableChange = <K extends keyof PatientRecord>(tableKey: K, index: number, field: string, val: any) => {
    setFormState(prev => {
      const currentList = Array.isArray(prev[tableKey]) ? [...prev[tableKey] as any] : [];
      currentList[index] = { ...currentList[index], [field]: val };
      return {
        ...prev,
        [tableKey]: currentList
      };
    });
  };

  const StageProgressBar = ({ value, label, tone = "ai" }: { value: number; label: string; tone?: "ai" | "drive" }) => (
    <div className="mt-4 rounded-2xl border border-[#D9D5CB]/70 dark:border-slate-700 bg-white/55 dark:bg-slate-900/55 p-3 shadow-inner">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full ${tone === "ai" ? "bg-[#7A8C70]" : "bg-[#A98467]"} animate-pulse`} />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-250 truncate">{label}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{Math.max(0, Math.min(100, value))}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#E8E4DA] dark:bg-slate-800 overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${tone === "ai" ? "bg-gradient-to-r from-[#5B6B52] via-[#A0A595] to-[#7A8C70]" : "bg-gradient-to-r from-[#8F6A4F] via-[#D0B49F] to-[#A98467]"}`}
          style={{ width: `${Math.max(5, Math.min(100, value))}%` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.45),transparent)] animate-progress-shimmer" />
      </div>
    </div>
  );

  type SubTableProps = {
    title: string;
    accent: string;
    icon: React.ComponentType<{ className?: string }>;
    addLabel: string;
    tableKey: string;
    headers: string[];
    keys: string[];
    placeholders: string[];
    emptyTemplate: Record<string, string>;
    rows: Record<string, any>[];
  };

  const SubTable = ({ title, accent, icon: Icon, addLabel, tableKey, headers, keys, placeholders, emptyTemplate, rows }: SubTableProps) => (
    <div>
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-3 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
            <Icon className="h-3 w-3" />
          </span>
          <span className="h-subsection">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={() => addRow(tableKey as any, emptyTemplate)}
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          <span>{addLabel}</span>
        </button>
      </div>
      <div className="mt-2 overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="h-table-col">
              {headers.map((h, i) => (
                <th key={i} className="p-2 whitespace-nowrap">{h}</th>
              ))}
              <th className="p-2 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                {keys.map((k, j) => (
                  <td key={j} className="p-2">
                    <input
                      type="text"
                      value={row[k] ?? ""}
                      onChange={(e) => handleTableChange(tableKey as any, idx, k, e.target.value)}
                      placeholder={placeholders[j]}
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </td>
                ))}
                <td className="p-2 text-right">
                  <button type="button" onClick={() => removeRow(tableKey as any, idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20 transition">
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length + 1} className="text-center py-4 text-slate-400 text-[11px]">
                  No {title.toLowerCase()} entries yet — click "{addLabel}" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Title & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="premium-icon-tile h-11 w-11 rounded-2xl border border-[#7A8C70]/25 bg-[#7A8C70]/10 text-[#5B6B52] dark:text-[#A0A595] dark:bg-[#7A8C70]/15 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white ">
              {formState.id ? "Edit Patient Record" : "Add Patient Record Registry"}
            </h2>
          </div>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold bg-slate-50 border border-[#D9D5CB] hover:bg-[#EBE8E0]/90 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl transition duration-150 cursor-pointer self-start sm:self-center"
        >
          Back to Home Page
        </button>
      </div>

      {/* Informed Consent Gateway */}
      <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-[#A98467]/10 dark:bg-[#A98467]/20 rounded-xl flex items-center justify-center text-[#A98467] flex-shrink-0 border border-[#A98467]/30">
            <ShieldCheck className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Regulatory Patient Informed Consent Checkpoint</h3>
            <p className="text-xs text-slate-655 dark:text-slate-200 mt-0.5 leading-relaxed">
              Medical procedures compel consent prior to recording history or mapping tumors. Ensure paper-written authorization is active for this patient.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F5F2ED]/70 dark:bg-slate-850 p-2.5 rounded-xl border border-[#D9D5CB]/40 dark:border-slate-700 self-stretch md:self-center justify-center">
          <input
            ref={consentRef}
            type="checkbox"
            id="checkbox-consent"
            checked={consentTaken}
            onChange={(e) => setConsentTaken(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-[#7A8C70] focus:ring-[#7A8C70] cursor-pointer hover-scale"
          />
          <label htmlFor="checkbox-consent" className="text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer selection:bg-transparent">
            Informed Consent Taken
          </label>
        </div>
      </div>

      {/* AI Extraction Point (Locked unless consent checkbox is ticked) */}
      <div className={`relative ${!consentTaken ? "opacity-45 cursor-not-allowed select-none" : ""}`}>
        {!consentTaken && (
          <div className="absolute inset-0 z-10 bg-slate-100/10 dark:bg-slate-900/10 backdrop-blur-[1.5px] rounded-2xl flex items-center justify-center">
            <div className="bg-slate-900/90 text-white py-2 px-4 rounded-xl flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="h-4 w-4 text-[#A98467]" />
              <span>Confirm Informed Consent above to unlock Document Uploads & AI Extraction</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* AI Drag Drop upload box */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-natural-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#7A8C70] dark:text-[#A0A595] animate-spin" />
                <h3 className="h-section">AI Intake & Extraction Point</h3>
              </div>
              <span className="text-[10px] font-semibold bg-[#7A8C70]/10 dark:bg-slate-900 border border-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] py-0.5 px-2 rounded-md">
                AI Agent Active
              </span>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150
                ${isDragOver 
                  ? "border-[#7A8C70] bg-[#7A8C70]/10 dark:bg-[#7A8C70]/20" 
                  : "border-[#D9D5CB] hover:border-[#7A8C70] dark:border-slate-700 dark:hover:border-[#7A8C70] hover:bg-[#F5F2ED]/25 dark:hover:bg-slate-850/40"
                }
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.csv,.json,.xlsx,.xls,.doc,.docx,.ppt,.pptx,image/*"
              />
              
	              {isExtracting ? (
	                <div className="space-y-3 animate-pulse">
                  <div className="flex justify-center text-[#7A8C70]">
                    <RefreshCw className="h-10 w-10 animate-spin" />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">AI Extraction Agent Executing...</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                    Analyzing clinical tables, blood reports, endoscopy parameters and biopsy tissues under ASCO compliance guides.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-12 w-12 bg-[#7A8C70]/10 dark:bg-slate-950/50 rounded-2xl flex items-center justify-center text-[#7A8C70] mx-auto">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-255 text-sm">
                      Drag-and-drop clinical files here
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Support clinical PDF, Excel formats, CSV, PowerPoint, Images, JSON or DOCX reports.
                    </p>
                  </div>
                  <button className="bg-slate-55 border border-[#D9D5CB] hover:bg-[#EBE8E0]/80 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg transition select-none cursor-pointer">
                    Browse Files
                  </button>
	                </div>
	              )}
	            </div>

            {isExtracting && (
              <StageProgressBar value={extractProgress} label={extractStage || "AI extraction running"} tone="ai" />
            )}
          </div>

          {/* Google Drive file repository for this patient */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-natural-border/45 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-[#A98467]" />
                  <h3 className="h-section">Google Drive Vault</h3>
                </div>
                <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB]/45 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-0.5 px-2 rounded-md">
                  Folders Synchronized
                </span>
              </div>
              
	              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[10px] ">
                  <span>Drive</span>
                  <span>&gt;</span>
                  <span className="text-[#7A8C70] font-semibold truncate hover:underline">
                    {formState.last_name || formState.first_name 
                      ? `${formState.first_name || ""}_${formState.last_name || ""}`.replace(" ", "_")
                      : "temp_patient_folder"
                    }
                  </span>
                </div>

	                {patientFiles.length === 0 ? (
	                  <div className="text-center py-8 text-slate-600 dark:text-slate-300 border border-dashed border-[#D9D5CB] dark:border-slate-700 rounded-xl">
	                    <File className="h-8 w-8 mx-auto text-[#D9D5CB]/80 mb-1 animate-pulse" />
	                    <p className="text-[10px]">Folder is empty.</p>
	                    <p className="text-[9px] mt-1 text-slate-500 dark:text-slate-400">Upload non-AI media after saving the patient record.</p>
	                  </div>
	                ) : (
                  <div className="space-y-1.5">
                    {patientFiles.map((file) => (
                      <div key={file.id} className="flex justify-between items-center bg-slate-55 dark:bg-slate-900/30 p-2 rounded-lg border border-[#D9D5CB]/50 dark:border-slate-800 text-[11px] group">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText className="h-3.5 w-3.5 text-[#7A8C70] flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-700 dark:text-slate-305 truncate" title={file.name}>{file.name}</p>
                            <p className="text-[9px] text-slate-600 dark:text-slate-300">{(file.size / 1024).toFixed(1)} KB • {file.uploadDate}</p>
                          </div>
                        </div>
                        {file.extracted && (
                          <span className="bg-[#7A8C70]/10 border border-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] text-[9px] px-1 py-0.5 rounded flex-shrink-0">
                            Extracted
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
	              </div>
	            </div>

	            <div className="mt-4 pt-3 border-t border-[#D9D5CB]/45 dark:border-[#2D3527] text-[10px] text-slate-600 dark:text-slate-350 font-semibold space-y-3">
	              <input
	                type="file"
	                ref={vaultFileInputRef}
	                onChange={async (e) => {
	                  const file = e.target.files?.[0];
	                  if (file) await processAttachment(file, true);
	                  e.target.value = "";
	                }}
	                className="hidden"
	                accept=".pdf,.csv,.json,.xlsx,.xls,.doc,.docx,.ppt,.pptx,image/*"
	              />
	              <button
	                type="button"
	                onClick={() => vaultFileInputRef.current?.click()}
	                disabled={isVaultUploading}
	                className="w-full inline-flex items-center justify-center gap-2 bg-[#A98467] hover:bg-[#8F6A4F] text-white font-bold py-2 px-3 rounded-xl transition disabled:opacity-60"
	              >
	                {isVaultUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
	                <span>{isVaultUploading ? "Uploading to Vault..." : "Upload Without AI Extraction"}</span>
	              </button>
              {isVaultUploading && (
                <StageProgressBar value={vaultProgress} label={vaultStage || "Uploading to Google Drive"} tone="drive" />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Clinical Record Fields Form Editor */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* Collapsible Section 1: Demographics */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("demographics")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.demographics ? 'border-b border-natural-border' : ''} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-slate-500/10 dark:bg-slate-400/20 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold ">Pt</span>
              <h3 className="h-section">Patient Demographics & Basic Details</h3>
            </div>
            {openSections.demographics ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.demographics && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-700 dark:text-slate-350">
              
              {/* Initials & Last Name */}
              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Title</label>
                <select 
                  name="title" 
                  value={formState.title} 
                  onChange={handleInputChange} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 rounded-button"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss.">Miss.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Rev.">Rev.</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Initials</label>
                <input
                  type="text"
                  name="initials"
                  value={formState.initials}
                  onChange={handleInputChange}
                  placeholder="e.g. J. D."
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("initials") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800 dark:text-slate-300">First Name *</label>
                <input
                  ref={firstNameRef}
                  type="text"
                  name="first_name"
                  value={formState.first_name}
                  onChange={handleInputChange}
                  placeholder="First name e.g. John"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("first_name") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800 dark:text-slate-300">Last Name *</label>
                <input
                  ref={lastNameRef}
                  type="text"
                  name="last_name"
                  value={formState.last_name}
                  onChange={handleInputChange}
                  placeholder="Last name e.g. Doe"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("last_name") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              {/* Age, DOB, Gender */}
              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formState.dob}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("dob") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Calculated Age</label>
                <input
                  type="number"
                  name="age"
                  value={formState.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 45"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("age") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Gender</label>
                <select 
                  name="gender" 
                  value={formState.gender} 
                  onChange={handleInputChange} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 rounded-button"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Active Status</label>
                <select 
                  name="status" 
                  value={formState.status} 
                  onChange={handleInputChange} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 rounded-button"
                >
                  <option value="active">Active</option>
                  <option value="under_treatment">Under Treatment</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>

              {/* Primary Oncology Sorter Key, NIC, telephone */}
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-300">NIC Card Number (NIC)</label>
                <input
                  type="text"
                  name="nic"
                  value={formState.nic}
                  onChange={handleInputChange}
                  placeholder="Identity card reference"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("nic") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-300">Telephone Number</label>
                <input
                  type="text"
                  name="tp"
                  value={formState.tp}
                  onChange={handleInputChange}
                  placeholder="e.g. +94..."
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("tp") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block font-semibold mb-1.5 text-[#7A8C70]">Oncology Types</label>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                  
                  {/* Search filter input */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Type here to search oncology category..."
                      value={oncologySearch}
                      onChange={(e) => setOncologySearch(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#7A8C70] focus:ring-1 focus:ring-[#7A8C70] outline-none placeholder-slate-400"
                    />
                    {oncologySearch && (
                      <button
                        type="button"
                        onClick={() => setOncologySearch("")}
                        className="text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-500 rounded-xl transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Tick Box grid selection list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {Object.values(OncologyCategory)
                      .filter((cat) => cat.toLowerCase().includes(oncologySearch.toLowerCase()))
                      .map((cat) => {
                        const isChecked = selectedOncologyTypes.includes(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2.5 p-2 px-3 border rounded-xl select-none cursor-pointer transition-all ${
                              isChecked
                                ? "bg-[#7A8C70]/10 border-[#7A8C70] text-[#4A5444] dark:text-[#A0A595] dark:border-[#7A8C70]"
                                : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOncologyType(cat)}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#7A8C70] focus:ring-[#7A8C70] accent-[#7A8C70]"
                              id={`oncology-checkbox-${cat}`}
                            />
                            <span className="text-xs font-semibold leading-tight">{cat}</span>
                          </label>
                        );
                      })}
                    
                    {Object.values(OncologyCategory).filter((cat) => cat.toLowerCase().includes(oncologySearch.toLowerCase())).length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400">
                        No oncology category matches "{oncologySearch}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Other Specific Tumors / AI Typed Category</label>
                <input
                  type="text"
                  name="oncology_other"
                  value={formState.oncology_other}
                  onChange={handleInputChange}
                  placeholder="If Other is selected, type tumor category here"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("oncology_other") ? "ai-extracted-glow" : ""}`}
                />
                {selectedOncologyTypes.length > 0 && (
                  <p className="mt-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Selected: {selectedOncologyTypes.join(", ")}
                  </p>
                )}
              </div>

              {/* Hospital details, Clinic, BHT */}
              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Clinic Code</label>
                <input
                  type="text"
                  name="clinic"
                  value={formState.clinic}
                  onChange={handleInputChange}
                  placeholder="Oncology Clinic code"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("clinic") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">BHT / Bed Ref Book</label>
                <input
                  type="text"
                  name="bht"
                  value={formState.bht}
                  onChange={handleInputChange}
                  placeholder="Bed Head Ticket reference"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("bht") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400 font-bold">Hospital Name</label>
                <input
                  type="text"
                  name="hospital"
                  value={formState.hospital}
                  onChange={handleInputChange}
                  placeholder="e.g. National Hospital Colombo"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("hospital") ? "ai-extracted-glow" : ""}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 dark:text-slate-400">Living Area / Town</label>
                <input
                  type="text"
                  name="living_area"
                  value={formState.living_area}
                  onChange={handleInputChange}
                  placeholder="e.g. Kandana"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("living_area") ? "ai-extracted-glow" : ""}`}
                />
              </div>

            </div>
          )}
        </div>

        {/* Collapsible Section 2: Clinical Presentation */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("history")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.history ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-200 flex items-center justify-center text-xs font-bold ">Hx</span>
              <h3 className="h-section">Presentations & Social History</h3>
            </div>
            {openSections.history ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.history && (
            <div className="p-5 space-y-5 text-xs text-slate-700 dark:text-slate-350">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 dark:text-slate-400">Presenting Complaints</label>
                  <textarea
                    name="presenting_complaints"
                    value={formState.presenting_complaints}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe direct symptoms or oncology onset records..."
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("presenting_complaints") ? "ai-extracted-glow" : ""}`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 dark:text-slate-400">Medical Comorbidity & Past Surgeries</label>
                  <textarea
                    name="comorbidity"
                    value={formState.comorbidity}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="e.g. Hypertension, bypass, renal concerns..."
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ${extractedFields.has("comorbidity") ? "ai-extracted-glow" : ""}`}
                  />
                </div>
              </div>

              {/* Drug History */}
              <SubTable
                title="Drug History"
                accent=""
                icon={Pill}
                addLabel="Add Drug"
                tableKey="drugTable"
                headers={["Drug Name", "Dose", "Frequency", "Duration", "Notes"]}
                keys={["drug_name", "dose", "frequency", "duration", "notes"]}
                placeholders={["e.g. Metformin", "500 mg", "BD", "2 years", "Optional notes"]}
                emptyTemplate={{ drug_name: "", dose: "", frequency: "", duration: "", notes: "" }}
                rows={formState.drugTable || []}
              />

              {/* Family History */}
              <SubTable
                title="Family History"
                accent=""
                icon={Users}
                addLabel="Add Family Member"
                tableKey="familyTable"
                headers={["Comorbidity", "Relationship", "Notes"]}
                keys={["comorbidity", "relationship", "family_notes"]}
                placeholders={["e.g. Breast cancer, Diabetes", "Mother / Father / Sibling", "Age of onset, outcome..."]}
                emptyTemplate={{ comorbidity: "", relationship: "", family_notes: "" }}
                rows={formState.familyTable || []}
              />

              {/* Social History */}
              <div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
                      <Wine className="h-3 w-3" />
                    </span>
                    <span className="h-subsection">
                      Social History
                    </span>
                  </div>
                </div>
                <div className="mt-2 overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Substance</th>
                        <th className="p-2.5">Status (Consumer type)</th>
                        <th className="p-2.5">Amounts / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2 font-semibold text-slate-700 dark:text-slate-200">Smoking</td>
                        <td className="p-2">
                          <select name="smoking" value={formState.smoking} onChange={handleInputChange} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer">
                            <option value="Non-consumer">Non-consumer</option>
                            <option value="Current consumer">Current consumer</option>
                            <option value="Ex consumer">Ex consumer</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="text" name="smoking_amount" value={formState.smoking_amount} onChange={handleInputChange} placeholder="e.g. 10 pack-years" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${formState.smoking_amount ? "ai-priority-text" : ""}`} />
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2 font-semibold text-slate-700 dark:text-slate-200">Alcohol</td>
                        <td className="p-2">
                          <select name="alcohol" value={formState.alcohol} onChange={handleInputChange} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer">
                            <option value="Non-consumer">Non-consumer</option>
                            <option value="Current consumer">Current consumer</option>
                            <option value="Ex consumer">Ex consumer</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="text" name="alcohol_amount" value={formState.alcohol_amount} onChange={handleInputChange} placeholder="e.g. 6 units / week" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${formState.alcohol_amount ? "ai-priority-text" : ""}`} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Other Risk Factors */}
              <SubTable
                title="Other Risk Factors"
                accent=""
                icon={AlertTriangle}
                addLabel="Add Risk Factor"
                tableKey="riskTable"
                headers={["Risk Factor Name", "Notes"]}
                keys={["risk_factor", "risk_notes"]}
                placeholders={["e.g. Occupational exposure, HPV, Obesity", "Optional notes / duration / severity"]}
                emptyTemplate={{ risk_factor: "", risk_notes: "" }}
                rows={formState.riskTable || []}
              />

              {/* Allergies Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-[#D9D5CB]/40 dark:border-slate-800/80 pt-4">
                <div>
                  <label className="block font-semibold mb-1">Food Allergies</label>
                  <input type="text" name="allergy_food" value={formState.allergy_food} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-red-600">Drug Allergies</label>
                  <input type="text" name="allergy_drugs" value={formState.allergy_drugs} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Plasters Allergies</label>
                  <input type="text" name="allergy_plasters" value={formState.allergy_plasters} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Other Allergies</label>
                  <input type="text" name="allergy_other" value={formState.allergy_other} onChange={handleInputChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Collapsible Section 2.5: Examination Findings */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("examination")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.examination ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
               <span className="h-6 w-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs font-bold ">Ex</span>
              <h3 className="h-section">Examination Findings</h3>
            </div>
            {openSections.examination ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.examination && (
            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-lg p-2.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300 mt-0.5 flex-shrink-0" />
                <span>
                  Capture vitals (BMI, BSA) and per-system clinical exam findings (CVS, RS, P/A, CNS, MSK, etc.). BMI/BSA rows are seeded by default; <strong>add a row for each organ system examined</strong> so the dossier is auditable.
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
                    <Stethoscope className="h-3 w-3" />
                  </span>
                  <span className="h-subsection">
                    Per-System Examination Table
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => addRow("examFindingsTable", { organ_system: "", findings: "", notes: "" })}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Organ System</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="h-table-col">
                      <th className="p-2.5">Organ System</th>
                      <th className="p-2.5">Findings</th>
                      <th className="p-2.5">Notes</th>
                      <th className="p-2.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                    {(formState.examFindingsTable || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.organ_system}
                            onChange={(e) => handleTableChange("examFindingsTable", idx, "organ_system", e.target.value)}
                            placeholder="e.g. CVS / RS / P/A / CNS / BMI / BSA"
                            list="exam-system-list"
                            className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold ${row.organ_system ? "ai-priority-text" : ""}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.findings}
                            onChange={(e) => handleTableChange("examFindingsTable", idx, "findings", e.target.value)}
                            placeholder="e.g. S1 S2 normal, no murmurs"
                            className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.findings ? "ai-priority-text" : ""}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => handleTableChange("examFindingsTable", idx, "notes", e.target.value)}
                            placeholder="Optional — severity, follow-up, etc."
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button type="button" onClick={() => removeRow("examFindingsTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20 transition">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!formState.examFindingsTable || formState.examFindingsTable.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400 text-[11px]">No examination findings recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <datalist id="exam-system-list">
                  <option value="BMI" />
                  <option value="BSA" />
                  <option value="Height" />
                  <option value="Weight" />
                  <option value="BP" />
                  <option value="Pulse" />
                  <option value="SpO2" />
                  <option value="Temp" />
                  <option value="General Appearance" />
                  <option value="CVS (Cardiovascular)" />
                  <option value="RS (Respiratory)" />
                  <option value="P/A (Per Abdomen)" />
                  <option value="CNS (Neurological)" />
                  <option value="MSK (Musculoskeletal)" />
                  <option value="Lymph Nodes" />
                  <option value="Local / Lesion Exam" />
                  <option value="Breast Exam" />
                  <option value="Rectal / DRE" />
                  <option value="ENT" />
                  <option value="Ophthalmic" />
                </datalist>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section 2.6: Provisional Diagnosis */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("provisionalDiagnosis")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.provisionalDiagnosis ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xs font-bold ">Dx</span>
              <h3 className="h-section">Provisional Diagnosis</h3>
            </div>
            {openSections.provisionalDiagnosis ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.provisionalDiagnosis && (
            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-lg p-2.5">
                <ClipboardList className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                <span>
                  Working diagnosis at first clinical encounter — based on history + examination BEFORE confirmatory investigations. This field is editable and overridden by the Definitive Diagnosis once histology/IHC confirms.
                </span>
              </div>
              <textarea
                name="provisional_diagnosis"
                value={formState.provisional_diagnosis}
                onChange={handleInputChange}
                rows={3}
                placeholder="e.g. Suspicious right breast mass — likely invasive ductal carcinoma, cT2 cN0 cM0, Stage IIA"
                className={`w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed ${extractedFields.has("provisional_diagnosis") ? "ai-extracted-glow" : ""}`}
              />
            </div>
          )}
        </div>

        {/* Collapsible Section 2.7: Definitive Diagnosis */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("definitiveDiagnosis")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.definitiveDiagnosis ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xs font-bold ">Dx</span>
              <h3 className="h-section">Definitive Diagnosis</h3>
            </div>
            {openSections.definitiveDiagnosis ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.definitiveDiagnosis && (
            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg p-2.5">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300 mt-0.5 flex-shrink-0" />
                <span>
                  Final, histology/IHC-confirmed diagnosis. Include grade, stage, and molecular subtype where relevant. The staging fields (overall stage, TNM) live in the Investigations section.
                </span>
              </div>
              <textarea
                name="final_diagnosis"
                value={formState.final_diagnosis}
                onChange={handleInputChange}
                rows={3}
                placeholder="e.g. Invasive ductal carcinoma, right breast, grade 2, ER+/PR+/HER2− (Luminal B-like), pT2 pN0 cM0, Stage IIA"
                className={`w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed ${extractedFields.has("final_diagnosis") ? "ai-extracted-glow" : ""}`}
              />
            </div>
          )}
        </div>

        {/* Collapsible Section 3: Diagnostic Investigations (Blood, Imaging, Biopsy Tables) */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("investigations")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.investigations ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-blue-500/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xs font-bold ">Lab</span>
              <h3 className="h-section">Medical Investigations & Laboratory Audits</h3>
            </div>
            {openSections.investigations ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.investigations && (
            <div className="p-5 space-y-8 text-xs text-slate-700 dark:text-slate-350">
              
              {/* Dynamic Blood Table with drop-down parameters */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">Blood Test Records</h4>
                  <button
                    type="button"
                    onClick={() => addRow("bloodTable", { blood_type: "", blood_purpose: "", blood_date: "", blood_findings: "", blood_notes: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Blood test row</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Maturity / Marker Parameter</th>
                        <th className="p-2.5">Purpose Directive</th>
                        <th className="p-2.5">Date Done</th>
                        <th className="p-2.5">Clinical Findings / Metrics</th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.bloodTable?.map((row, idx) => (
                        <tr key={idx} className={row.blood_findings ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="text" value={row.blood_type} onChange={(e) => handleTableChange("bloodTable", idx, "blood_type", e.target.value)} placeholder="e.g. Hemoglobin (Hb)" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.blood_type ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.blood_purpose} onChange={(e) => handleTableChange("bloodTable", idx, "blood_purpose", e.target.value)} placeholder="e.g. Diagnosis" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.blood_purpose ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.blood_date} onChange={(e) => handleTableChange("bloodTable", idx, "blood_date", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.blood_date ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.blood_findings} onChange={(e) => handleTableChange("bloodTable", idx, "blood_findings", e.target.value)} placeholder="e.g. Hb 12.5 g/dL" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.blood_findings ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.blood_notes} onChange={(e) => handleTableChange("bloodTable", idx, "blood_notes", e.target.value)} placeholder="General comments" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.blood_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => removeRow("bloodTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.bloodTable || formState.bloodTable.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-slate-400 text-[11px]">No lab metrics recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tumor Markers Table (CEA, AFP, CA 19-9, CA 125, PSA, etc.) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mr-2 align-middle" />Tumor Markers (CEA, AFP, CA 19-9, CA 125, PSA, LDH…)
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("tumorMarkersTable", { marker_name: "", marker_value: "", marker_unit: "", marker_date: "", marker_ref_range: "", marker_notes: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Tumor Marker Row</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Marker</th>
                        <th className="p-2.5">Value</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Reference Range</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.tumorMarkersTable?.map((row, idx) => (
                        <tr key={idx} className={row.marker_value ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="text" value={row.marker_name} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_name", e.target.value)} placeholder="e.g. CEA" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.marker_name ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.marker_value} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_value", e.target.value)} placeholder="e.g. 4.8" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.marker_value ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.marker_unit} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_unit", e.target.value)} placeholder="ng/mL" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.marker_unit ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.marker_ref_range} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_ref_range", e.target.value)} placeholder="< 5.0" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.marker_ref_range ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.marker_date} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_date", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.marker_date ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.marker_notes} onChange={(e) => handleTableChange("tumorMarkersTable", idx, "marker_notes", e.target.value)} placeholder="Trend / context" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.marker_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => removeRow("tumorMarkersTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.tumorMarkersTable || formState.tumorMarkersTable.length === 0) && (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-slate-400 text-[11px]">No tumor markers recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Imaging Findings Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mr-2 align-middle" />Imaging Diagnostics (CT, MRI, Ultrasound)
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("imagingTable", { imaging_type: "CT Chest/Abdomen", imaging_purpose: "Diagnosis", imaging_parameter: "", imaging_findings: "", mass_present: "", mass_size: "", mass_location: "", calcifications: "", lymph_nodes: "", metastasis: "", ascites: "", pv_status: "", sma_status: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Imaging Study</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Study Modality</th>
                        <th className="p-2.5">Clinical Purpose</th>
                        <th className="p-2.5">Target Parameter / Site</th>
                        <th className="p-2.5">Impression & Findings</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.imagingTable?.map((row, idx) => (
                        <>
                          <tr key={idx} className={row.imaging_findings ? "ai-priority-row" : ""}>
                            <td className="p-2">
                              <input type="text" value={row.imaging_type} onChange={(e) => handleTableChange("imagingTable", idx, "imaging_type", e.target.value)} placeholder="e.g. CT Chest/Abdomen" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.imaging_type ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.imaging_purpose} onChange={(e) => handleTableChange("imagingTable", idx, "imaging_purpose", e.target.value)} placeholder="e.g. Diagnosis" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.imaging_purpose ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.imaging_parameter} onChange={(e) => handleTableChange("imagingTable", idx, "imaging_parameter", e.target.value)} placeholder="e.g. Left hepatic margins" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.imaging_parameter ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.imaging_findings} onChange={(e) => handleTableChange("imagingTable", idx, "imaging_findings", e.target.value)} placeholder="CT reports details..." className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.imaging_findings ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2 text-right align-top">
                              <button type="button" onClick={() => removeRow("imagingTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                            <td colSpan={5} className="p-2.5">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Mass Present</span>
                                  <input type="text" value={row.mass_present} onChange={(e) => handleTableChange("imagingTable", idx, "mass_present", e.target.value)} placeholder="yes / no / indeterminate" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.mass_present ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Mass Size</span>
                                  <input type="text" value={row.mass_size} onChange={(e) => handleTableChange("imagingTable", idx, "mass_size", e.target.value)} placeholder="e.g. 3.2 x 2.8 cm" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.mass_size ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Mass Location</span>
                                  <input type="text" value={row.mass_location} onChange={(e) => handleTableChange("imagingTable", idx, "mass_location", e.target.value)} placeholder="anatomical site" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.mass_location ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Calcifications</span>
                                  <input type="text" value={row.calcifications} onChange={(e) => handleTableChange("imagingTable", idx, "calcifications", e.target.value)} placeholder="present / absent / pattern" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.calcifications ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Lymph Nodes</span>
                                  <input type="text" value={row.lymph_nodes} onChange={(e) => handleTableChange("imagingTable", idx, "lymph_nodes", e.target.value)} placeholder="status, size, station" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.lymph_nodes ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Metastasis</span>
                                  <input type="text" value={row.metastasis} onChange={(e) => handleTableChange("imagingTable", idx, "metastasis", e.target.value)} placeholder="sites, e.g. liver, lung" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.metastasis ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Ascites</span>
                                  <input type="text" value={row.ascites} onChange={(e) => handleTableChange("imagingTable", idx, "ascites", e.target.value)} placeholder="present / absent / volume" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ascites ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Portal Vein / SMA</span>
                                  <input type="text" value={row.pv_status} onChange={(e) => handleTableChange("imagingTable", idx, "pv_status", e.target.value)} placeholder="PV: patent / involved" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.pv_status ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5 md:col-span-3">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">SMA Status</span>
                                  <input type="text" value={row.sma_status} onChange={(e) => handleTableChange("imagingTable", idx, "sma_status", e.target.value)} placeholder="encasement / involvement / clear" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.sma_status ? "ai-priority-text" : ""}`} />
                                </label>
                              </div>
                            </td>
                          </tr>
                        </>
                      ))}
                      {(!formState.imagingTable || formState.imagingTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No imaging scans registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Biopsy Histology / Pathology Staging */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mr-2 align-middle" />Histopathology & Tissue Biopsy Table
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("biopsyTable", { biopsy_type: "True-cut Biopsy", biopsy_purpose: "confirmation", biopsy_parameter: "", biopsy_findings: "", biopsy_stage: "", lvi: "", perineural_invasion: "", margin_status: "", cell_type: "", metastasis: "", lymph_nodes: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Biopsy entry</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Biopsy Methodology</th>
                        <th className="p-2.5">Anatomical Site</th>
                        <th className="p-2.5">Tumor Grade / Findings</th>
                        <th className="p-2.5">Histology subtype / Stage</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.biopsyTable?.map((row, idx) => (
                        <>
                          <tr key={idx} className={row.biopsy_findings ? "ai-priority-row" : ""}>
                            <td className="p-2">
                              <input type="text" value={row.biopsy_type} onChange={(e) => handleTableChange("biopsyTable", idx, "biopsy_type", e.target.value)} placeholder="e.g. Core Needle" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.biopsy_type ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.biopsy_parameter} onChange={(e) => handleTableChange("biopsyTable", idx, "biopsy_parameter", e.target.value)} placeholder="e.g. Left breast tissue margins" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.biopsy_parameter ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.biopsy_findings} onChange={(e) => handleTableChange("biopsyTable", idx, "biopsy_findings", e.target.value)} placeholder="Invasive Ductal Carcinoma Grade II" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.biopsy_findings ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.biopsy_stage} onChange={(e) => handleTableChange("biopsyTable", idx, "biopsy_stage", e.target.value)} placeholder="ER+/PR+ Her2 negative" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.biopsy_stage ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2 text-right align-top">
                              <button type="button" onClick={() => removeRow("biopsyTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                            <td colSpan={5} className="p-2.5">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Cell Type</span>
                                  <input type="text" value={row.cell_type} onChange={(e) => handleTableChange("biopsyTable", idx, "cell_type", e.target.value)} placeholder="e.g. Adenocarcinoma" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.cell_type ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Margin Status</span>
                                  <input type="text" value={row.margin_status} onChange={(e) => handleTableChange("biopsyTable", idx, "margin_status", e.target.value)} placeholder="clear / involved / close" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.margin_status ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">LVI</span>
                                  <input type="text" value={row.lvi} onChange={(e) => handleTableChange("biopsyTable", idx, "lvi", e.target.value)} placeholder="present / absent" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.lvi ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Perineural Invasion</span>
                                  <input type="text" value={row.perineural_invasion} onChange={(e) => handleTableChange("biopsyTable", idx, "perineural_invasion", e.target.value)} placeholder="present / absent" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.perineural_invasion ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Metastasis</span>
                                  <input type="text" value={row.metastasis} onChange={(e) => handleTableChange("biopsyTable", idx, "metastasis", e.target.value)} placeholder="sites, e.g. liver" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.metastasis ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Lymph Nodes</span>
                                  <input type="text" value={row.lymph_nodes} onChange={(e) => handleTableChange("biopsyTable", idx, "lymph_nodes", e.target.value)} placeholder="positive/total, station" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.lymph_nodes ? "ai-priority-text" : ""}`} />
                                </label>
                              </div>
                            </td>
                          </tr>
                        </>
                      ))}
                      {(!formState.biopsyTable || formState.biopsyTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No biopsy reports logged yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immunohistochemistry (IHC) Stains Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mr-2 align-middle" />Immunohistochemistry (IHC) Stains Panel
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("immunohistochemistryTable", { ihc_specimen: "", ihc_panel: "", ihc_marker: "", ihc_result: "", ihc_intensity: "", ihc_percentage: "", ihc_score: "", ihc_pattern: "", ihc_method: "IHC", ihc_date: "", ihc_lab: "", ihc_pathologist: "", ihc_interpretation: "", ihc_notes: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add IHC Stain</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Marker (Stain)</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Intensity</th>
                        <th className="p-2.5">% Cells</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Pattern</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.immunohistochemistryTable?.map((row, idx) => (
                        <>
                          <tr key={idx} className={row.ihc_marker || row.ihc_interpretation ? "ai-priority-row" : ""}>
                            <td className="p-2">
                              <input list="ihc-marker-list" type="text" value={row.ihc_marker} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_marker", e.target.value)} placeholder="e.g. ER / PR / HER2 / Ki-67 / PD-L1" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.ihc_marker ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.ihc_result} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_result", e.target.value)} placeholder="e.g. Positive / Negative" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ihc_result ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.ihc_intensity} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_intensity", e.target.value)} placeholder="e.g. 3+ / Strong" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ihc_intensity ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.ihc_percentage} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_percentage", e.target.value)} placeholder="e.g. 80%" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.ihc_percentage ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.ihc_score} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_score", e.target.value)} placeholder="Allred / H-score / CPS / FISH" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.ihc_score ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.ihc_pattern} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_pattern", e.target.value)} placeholder="membranous / nuclear" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ihc_pattern ? "ai-priority-text" : ""}`} />
                            </td>
                            <td className="p-2 text-right align-top">
                              <button type="button" onClick={() => removeRow("immunohistochemistryTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                            <td colSpan={7} className="p-2.5">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Panel</span>
                                  <input list="ihc-panel-list" type="text" value={row.ihc_panel} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_panel", e.target.value)} placeholder="e.g. Breast panel" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_panel ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Method</span>
                                  <input list="ihc-method-list" type="text" value={row.ihc_method} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_method", e.target.value)} placeholder="IHC / FISH / NGS" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_method ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Date</span>
                                  <input type="date" value={row.ihc_date} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_date", e.target.value)} className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_date ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Specimen / Block</span>
                                  <input type="text" value={row.ihc_specimen} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_specimen", e.target.value)} placeholder="e.g. Cell block, Core biopsy" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_specimen ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5 md:col-span-2">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 mr-1 align-middle" />Interpretation
                                  </span>
                                  <input type="text" value={row.ihc_interpretation} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_interpretation", e.target.value)} placeholder="e.g. Luminal A-like / TNBC / dMMR-MSI-high" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold ${row.ihc_interpretation ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Lab / Hospital</span>
                                  <input type="text" value={row.ihc_lab} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_lab", e.target.value)} placeholder="Lab name" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_lab ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Pathologist</span>
                                  <input type="text" value={row.ihc_pathologist} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_pathologist", e.target.value)} placeholder="Dr. …" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_pathologist ? "ai-priority-text" : ""}`} />
                                </label>
                                <label className="flex flex-col gap-0.5 md:col-span-4">
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">Notes (clone, controls, etc.)</span>
                                  <input type="text" value={row.ihc_notes} onChange={(e) => handleTableChange("immunohistochemistryTable", idx, "ihc_notes", e.target.value)} placeholder="Clone, dilution, controls, additional context" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.ihc_notes ? "ai-priority-text" : ""}`} />
                                </label>
                              </div>
                            </td>
                          </tr>
                        </>
                      ))}
                      {(!formState.immunohistochemistryTable || formState.immunohistochemistryTable.length === 0) && (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-slate-400 text-[11px]">No IHC stains logged yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <datalist id="ihc-marker-list">
                  <option value="ER (Estrogen Receptor)" />
                  <option value="PR (Progesterone Receptor)" />
                  <option value="HER2/neu" />
                  <option value="Ki-67 / MIB-1" />
                  <option value="EGFR" />
                  <option value="PD-L1 (22C3)" />
                  <option value="PD-L1 (SP142)" />
                  <option value="PD-L1 (SP263)" />
                  <option value="PD-L1 (28-8)" />
                  <option value="MLH1" />
                  <option value="MSH2" />
                  <option value="MSH6" />
                  <option value="PMS2" />
                  <option value="CD20" />
                  <option value="CD3" />
                  <option value="CD5" />
                  <option value="CD10" />
                  <option value="CD15" />
                  <option value="CD30" />
                  <option value="CD45 / LCA" />
                  <option value="CD79a" />
                  <option value="BCL2" />
                  <option value="BCL6" />
                  <option value="MUM1 / IRF4" />
                  <option value="CD117 / c-KIT" />
                  <option value="DOG1" />
                  <option value="CD34" />
                  <option value="S100" />
                  <option value="SOX10" />
                  <option value="HMB45" />
                  <option value="Melan-A / MART-1" />
                  <option value="TTF-1" />
                  <option value="Napsin A" />
                  <option value="p40" />
                  <option value="p63" />
                  <option value="CK5/6" />
                  <option value="CK7" />
                  <option value="CK20" />
                  <option value="CDX2" />
                  <option value="GATA3" />
                  <option value="GCDFP-15" />
                  <option value="PSA" />
                  <option value="PSAP" />
                  <option value="NKX3.1" />
                  <option value="PAX8" />
                  <option value="WT1" />
                  <option value="CA-IX" />
                  <option value="HepPar-1" />
                  <option value="Glypican-3" />
                  <option value="AFP" />
                  <option value="Calretinin" />
                  <option value="D2-40 / Podoplanin" />
                  <option value="EMA" />
                  <option value="Synaptophysin" />
                  <option value="Chromogranin A" />
                  <option value="CD56 / NCAM" />
                  <option value="NSE" />
                  <option value="GFAP" />
                  <option value="IDH1 R132H" />
                  <option value="ATRX" />
                  <option value="p53" />
                  <option value="1p/19q" />
                  <option value="MGMT" />
                  <option value="Beta-catenin" />
                  <option value="E-cadherin" />
                  <option value="ALK (D5F3)" />
                  <option value="ROS1" />
                  <option value="BRAF V600E" />
                  <option value="PD-1" />
                  <option value="CD8" />
                  <option value="FOXP3" />
                  <option value="INI-1 / SMARCB1" />
                  <option value="BRG1 / SMARCA4" />
                  <option value="Pan-CK (AE1/AE3)" />
                </datalist>
                <datalist id="ihc-panel-list">
                  <option value="Breast panel" />
                  <option value="Lymphoma panel" />
                  <option value="MMR / MSI panel" />
                  <option value="PD-L1 panel" />
                  <option value="GI panel" />
                  <option value="GIST panel" />
                  <option value="Melanoma panel" />
                  <option value="Neuroendocrine panel" />
                  <option value="Glioma panel" />
                  <option value="Lung panel" />
                  <option value="Gynecologic panel" />
                  <option value="Prostate panel" />
                  <option value="HCC panel" />
                  <option value="Mesothelioma panel" />
                </datalist>
                <datalist id="ihc-method-list">
                  <option value="IHC" />
                  <option value="FISH" />
                  <option value="CISH" />
                  <option value="SISH" />
                  <option value="NGS" />
                  <option value="PCR" />
                </datalist>
              </div>

              {/* Endoscopy table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">Endoscopy Parameters Table</h4>
                  <button
                    type="button"
                    onClick={() => addRow("endoscopyTable", { endo_type: "Colonoscopy", endo_purpose: "Diagnosis", endo_parameter: "", endo_findings: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Endoscopy study</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Endoscopy Target Type</th>
                        <th className="p-2.5">Clinical Purpose</th>
                        <th className="p-2.5">Visual Parameters</th>
                        <th className="p-2.5">Mucosal Findings</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.endoscopyTable?.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input type="text" value={row.endo_type} onChange={(e) => handleTableChange("endoscopyTable", idx, "endo_type", e.target.value)} placeholder="e.g. colonoscopy/bronchoscopy" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.endo_purpose} onChange={(e) => handleTableChange("endoscopyTable", idx, "endo_purpose", e.target.value)} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.endo_parameter} onChange={(e) => handleTableChange("endoscopyTable", idx, "endo_parameter", e.target.value)} placeholder="e.g. gastric folds" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.endo_findings} onChange={(e) => handleTableChange("endoscopyTable", idx, "endo_findings", e.target.value)} placeholder="Strictures or ulcerative masses..." className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => removeRow("endoscopyTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.endoscopyTable || formState.endoscopyTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No endoscopy findings logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tumor overall TNM Stage details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4 bg-slate-50 dark:bg-slate-900/10 p-4 rounded-xl">
                <div>
                  <label className="block font-semibold mb-1 text-blue-600 dark:text-blue-400">TNM Stages Designation</label>
                  <input
                    type="text"
                    name="tnm_stage"
                    value={formState.tnm_stage}
                    onChange={handleInputChange}
                    placeholder="e.g. T2 N1 M0"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-900/60 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-indigo-600 dark:text-indigo-400">Overall Tumor Stage</label>
                  <input type="text" name="overall_stage" value={formState.overall_stage || ""} onChange={handleInputChange} placeholder="e.g. Stage IIB / T2N1M0" className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 dark:text-slate-400">Provisional Diagnosis summary</label>
                  <input
                    type="text"
                    name="provisional_diagnosis"
                    value={formState.provisional_diagnosis}
                    onChange={handleInputChange}
                    placeholder="e.g. Malignant Neoplasm of lung"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Collapsible Section 3b: Supplementary / Additional Details (dynamic AI headings, subheadings, cells) */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("supplementary")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.supplementary ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-amber-500/10 dark:bg-amber-400/20 text-amber-700 dark:text-amber-200 flex items-center justify-center text-xs font-bold ">Sup</span>
              <h3 className="h-section">Supplementary / Additional Details</h3>
            </div>
            <span className={`transition-transform text-slate-500 ${openSections.supplementary ? "rotate-180" : ""}`}>▼</span>
          </button>
          {openSections.supplementary && (
            <div className="p-5 space-y-5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Use this section to capture any details that don't fit the standard tables above. The AI adds rows here automatically when the source document contains headings, subheadings, or cells not covered by the predefined schema (e.g. Genetic Testing, Performance Status, Lifestyle, Comorbidities, Staging Details, etc.). Each row is one cell under a heading.
              </p>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mr-2 align-middle" />Supplementary Details — Heading / Subheading / Cell
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("supplementaryDetailsTable", { detail_heading: "", detail_subheading: "", detail_label: "", detail_value: "", detail_unit: "", detail_date: "", detail_priority: "medium", detail_category: "", detail_source: "", detail_notes: "" })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Supplementary Detail</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/85 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Heading</th>
                        <th className="p-2.5">Subheading</th>
                        <th className="p-2.5">Label (cell key)</th>
                        <th className="p-2.5">Value</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Priority</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.supplementaryDetailsTable?.map((row, idx) => (
                        <tr key={idx} className={row.detail_heading || row.detail_value ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input list="supp-heading-list" type="text" value={row.detail_heading} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_heading", e.target.value)} placeholder="e.g. Genetic Testing" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.detail_heading ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.detail_subheading} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_subheading", e.target.value)} placeholder="optional group" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.detail_subheading ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.detail_label} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_label", e.target.value)} placeholder="e.g. BRCA1 variant" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.detail_label ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.detail_value} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_value", e.target.value)} placeholder="value" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.detail_value ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.detail_unit} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_unit", e.target.value)} placeholder="unit" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.detail_unit ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.detail_date} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_date", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.detail_date ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.detail_priority} onChange={(e) => handleTableChange("supplementaryDetailsTable", idx, "detail_priority", e.target.value)} placeholder="e.g. High" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold ${row.detail_priority ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("supplementaryDetailsTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.supplementaryDetailsTable || formState.supplementaryDetailsTable.length === 0) && (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-slate-400 text-[11px]">No supplementary details yet. AI will fill here automatically, or click "Add Supplementary Detail" to add manually.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <datalist id="supp-heading-list">
                  <option value="Genetic Testing" />
                  <option value="Family Cancer History" />
                  <option value="Performance Status" />
                  <option value="Vitals" />
                  <option value="Lifestyle" />
                  <option value="Cardiovascular Risk" />
                  <option value="Staging Details" />
                  <option value="Pathology Details" />
                  <option value="Complications" />
                  <option value="Pregnancy / Reproductive History" />
                  <option value="Allergies" />
                  <option value="Vaccinations" />
                  <option value="Molecular / NGS" />
                  <option value="Functional Status" />
                  <option value="Care Plan" />
                  <option value="Patient-Reported Outcomes" />
                  <option value="Adverse Event Logs" />
                  <option value="Discharge Medications" />
                  <option value="Discharge Summary" />
                  <option value="Follow-up Schedule" />
                  <option value="Comorbidities" />
                  <option value="Screening Tests" />
                  <option value="Bone Health" />
                  <option value="Renal Function" />
                  <option value="Coagulation" />
                  <option value="Infectious Disease" />
                  <option value="Autoimmune" />
                  <option value="Endocrine" />
                  <option value="Nutritional Status" />
                  <option value="Psychosocial" />
                  <option value="Occupational History" />
                  <option value="Travel History" />
                  <option value="Substance Use" />
                  <option value="Prior Therapies Outside This Encounter" />
                  <option value="Additional Biopsy Notes" />
                  <option value="Additional Imaging Notes" />
                  <option value="Additional Surgery Notes" />
                  <option value="Additional IHC Notes" />
                  <option value="Additional Lab Notes" />
                </datalist>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section 4: Treatment Schedules */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("treatments")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.treatments ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-orange-500/10 dark:bg-orange-400/20 text-orange-700 dark:text-orange-200 flex items-center justify-center text-xs font-bold ">Tx</span>
              <h3 className="h-section">Therapeutic Plans: Chemo, Radiotherapy, & Surgeries</h3>
            </div>
            {openSections.treatments ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.treatments && (
            <div className="p-5 space-y-6 text-xs text-slate-700 dark:text-slate-350">

              {/* 4 systemic + local-therapy sub-sections: Neo-Chemo, Adj-Chemo, Neo-Radio, Adj-Radio */}
              {([
                {
                  key: "neoChemo" as const,
                  title: "Neo-Adjuvant Chemotherapy",
                  statusField: "neo_chemo_status" as const,
                  tableKey: "neoChemoTable" as const,
                    accentClass: "",
                  icon: Pill,
                  emptyTemplate: { neo_chemo_drug: "", neo_chemo_dose: "", neo_chemo_freq: "", neo_chemo_route: "IV Infusion", neo_chemo_cycles: "", neo_chemo_effects: "", neo_chemo_notes: "" },
                  addLabel: "Add Chemo Drug Row",
                  columnHeaders: ["Drug Name / Protocol", "Dose", "Frequency", "Route / Approach", "Cycles", "Adverse Effects", "Notes"],
                  columnKeys: ["neo_chemo_drug", "neo_chemo_dose", "neo_chemo_freq", "neo_chemo_route", "neo_chemo_cycles", "neo_chemo_effects", "neo_chemo_notes"],
                  columnPlaceholders: ["CISplatin / Docetaxel", "75 mg/m2", "Q3W (3-weekly)", "IV Infusion", "e.g. 4 or 6", "e.g. Vomiting/Mild neuropathy", "Optional notes"],
                },
                {
                  key: "adjChemo" as const,
                  title: "Adjuvant Chemotherapy",
                  statusField: "adj_chemo_status" as const,
                  tableKey: "adjChemoTable" as const,
                    accentClass: "",
                  icon: Pill,
                  emptyTemplate: { neo_chemo_drug: "", neo_chemo_dose: "", neo_chemo_freq: "", neo_chemo_route: "IV Infusion", neo_chemo_cycles: "", neo_chemo_effects: "", neo_chemo_notes: "" },
                  addLabel: "Add Chemo Drug Row",
                  columnHeaders: ["Drug Name / Protocol", "Dose", "Frequency", "Route / Approach", "Cycles", "Adverse Effects", "Notes"],
                  columnKeys: ["neo_chemo_drug", "neo_chemo_dose", "neo_chemo_freq", "neo_chemo_route", "neo_chemo_cycles", "neo_chemo_effects", "neo_chemo_notes"],
                  columnPlaceholders: ["AC / Paclitaxel / Capecitabine", "500 mg/m2", "Q3W", "IV / PO", "e.g. 4 or 8", "e.g. Neutropenia", "Optional notes"],
                },
                {
                  key: "neoRadio" as const,
                  title: "Neo-Adjuvant Radiotherapy",
                  statusField: "neo_radio_status" as const,
                  tableKey: "neoRadioTable" as const,
                    accentClass: "",
                  icon: Radio,
                  emptyTemplate: { neo_radio_comp: "", neo_radio_dose: "", neo_radio_freq: "Daily", neo_radio_route: "EBRT", neo_radio_cycles: "", neo_radio_effects: "", neo_radio_notes: "" },
                  addLabel: "Add Radiation Parameter",
                  columnHeaders: ["Target Site", "Total Dosage (Gy)", "Frequency", "Delivery System", "Fractions", "Adverse Effects", "Notes"],
                  columnKeys: ["neo_radio_comp", "neo_radio_dose", "neo_radio_freq", "neo_radio_route", "neo_radio_cycles", "neo_radio_effects", "neo_radio_notes"],
                  columnPlaceholders: ["Pelvic walls / Chest wall", "e.g. 50Gy in 25 fractions", "Daily / 5x/week", "EBRT / Brachytherapy / IMRT", "Fractions count", "e.g. skin burns/fatigue", "Optional notes"],
                },
                {
                  key: "adjRadio" as const,
                  title: "Adjuvant Radiotherapy",
                  statusField: "adj_radio_status" as const,
                  tableKey: "adjRadioTable" as const,
                    accentClass: "",
                  icon: Radio,
                  emptyTemplate: { neo_radio_comp: "", neo_radio_dose: "", neo_radio_freq: "Daily", neo_radio_route: "EBRT", neo_radio_cycles: "", neo_radio_effects: "", neo_radio_notes: "" },
                  addLabel: "Add Radiation Parameter",
                  columnHeaders: ["Target Site", "Total Dosage (Gy)", "Frequency", "Delivery System", "Fractions", "Adverse Effects", "Notes"],
                  columnKeys: ["neo_radio_comp", "neo_radio_dose", "neo_radio_freq", "neo_radio_route", "neo_radio_cycles", "neo_radio_effects", "neo_radio_notes"],
                  columnPlaceholders: ["Tumor bed / Regional nodes", "e.g. 60Gy in 30 fractions", "Daily / 5x/week", "EBRT / IMRT / 3D-CRT", "Fractions count", "e.g. dermatitis / xerostomia", "Optional notes"],
                },
              ]).map((sec) => {
                const SecIcon = sec.icon;
                const status = (formState as any)[sec.statusField] || "";
                const showTable = status === "Done" || status === "Ongoing" || (formState as any)[sec.tableKey]?.length > 0;
                return (
                  <div key={sec.key} className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
                          <SecIcon className="h-3 w-3" />
                        </span>
                        <span className="h-subsection">
                          {sec.title} <span className="text-slate-400 font-semibold normal-case tracking-normal">(Tick in the relevant box)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name={sec.statusField}
                          value={status}
                          onChange={handleInputChange}
                          placeholder="e.g. Done"
                          className="p-1 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded focus:ring-1 focus:ring-[#7A8C70] focus:border-[#7A8C70]"
                        />
                        {showTable && (
                          <button
                            type="button"
                            onClick={() => addRow(sec.tableKey, sec.emptyTemplate)}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{sec.addLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {showTable && (
                      <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="h-table-col">
                              {sec.columnHeaders.map((h, i) => (
                                <th key={i} className="p-2 whitespace-nowrap">{h}</th>
                              ))}
                              <th className="p-2 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                            {((formState as any)[sec.tableKey] || []).map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                {sec.columnKeys.map((k, j) => (
                                  <td key={j} className="p-2">
                                    <input
                                      type="text"
                                      value={row[k] ?? ""}
                                      onChange={(e) => handleTableChange(sec.tableKey, idx, k, e.target.value)}
                                      placeholder={sec.columnPlaceholders[j]}
                                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                    />
                                  </td>
                                ))}
                                <td className="p-2 text-right">
                                  <button type="button" onClick={() => removeRow(sec.tableKey, idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20 transition">
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}


              {/* Surgeries are now in the dedicated "Surgical Procedures" section below */}

            </div>
          )}
        </div>

        {/* Collapsible Section 4b: Surgical Procedures (Procedure, Post-op Complications, Post-op Monitoring, ICU, Ward) */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("surgicalProcedures")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.surgicalProcedures ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-rose-500/10 dark:bg-rose-400/20 text-rose-700 dark:text-rose-200 flex items-center justify-center text-xs font-bold ">Sx</span>
              <h3 className="h-section">Surgical Procedures</h3>
            </div>
            {openSections.surgicalProcedures ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.surgicalProcedures && (
            <div className="p-5 space-y-6 text-xs text-slate-700 dark:text-slate-350">

              {/* Sub-block 1: Procedure */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-4 rounded-xl">
                  <h4 className="h-subsection flex items-center gap-2">
                    <Scissors className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Procedure
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("surgeryTable", { surgery_name: "", surgery_date: "", surgery_site: "", surgery_approach: "", surgery_findings: "", drain_status: "", drain_volume: "", surgery_notes: "" })}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Log Surgical Procedure</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2">Surgery</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Site</th>
                        <th className="p-2">Approach</th>
                        <th className="p-2">Surgical findings</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {(formState.surgeryTable || []).map((row, idx) => (
                        <tr key={idx} className={row.surgery_findings ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="text" value={row.surgery_name} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_name", e.target.value)} placeholder="e.g. Mastectomy / Whipple" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_name ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.surgery_date} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_date", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_date ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.surgery_site} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_site", e.target.value)} placeholder="e.g. Upper outer segment breast" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_site ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.surgery_approach} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_approach", e.target.value)} placeholder="e.g. Open / Laparoscopic / Robotic" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_approach ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.surgery_findings} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_findings", e.target.value)} placeholder="Tumor fully resected, clear margins" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_findings ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.surgery_notes} onChange={(e) => handleTableChange("surgeryTable", idx, "surgery_notes", e.target.value)} placeholder="Notes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.surgery_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("surgeryTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.surgeryTable || formState.surgeryTable.length === 0) && (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-slate-400 text-[11px]">No surgical history recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Drain status sub-row (kept as a compact sub-grid under the main row group) */}
                {(formState.surgeryTable || []).some((r) => r.drain_status || r.drain_volume) && (
                  <div className="rounded-xl border border-[#D9D5CB]/40 dark:border-slate-700 overflow-hidden">
                    <div className="eyebrow px-3 py-1.5 bg-blue-50/40 dark:bg-blue-950/10 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Drain details (post-op)
                    </div>
                    {(formState.surgeryTable || []).map((row, idx) => (
                      <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 text-[10px] border-t border-[#D9D5CB]/30 dark:border-slate-800">
                        <label className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Drain Status</span>
                          <input type="text" value={row.drain_status} onChange={(e) => handleTableChange("surgeryTable", idx, "drain_status", e.target.value)} placeholder="e.g. In situ" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] ${row.drain_status ? "ai-priority-text" : ""}`} />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Drain Volume (mL/day)</span>
                          <input type="text" value={row.drain_volume} onChange={(e) => handleTableChange("surgeryTable", idx, "drain_volume", e.target.value)} placeholder="e.g. 120 mL/24h" className={`w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold ${row.drain_volume ? "ai-priority-text" : ""}`} />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-block 2: Post op complications */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-4 rounded-xl">
                  <h4 className="h-subsection flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Post op complications
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("complicationTable", { complication: "", post_op_duration: "", management: "", notes: "" })}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Complication</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2">Complication</th>
                        <th className="p-2">Post Op Duration</th>
                        <th className="p-2">Management</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {(formState.complicationTable || []).map((row, idx) => (
                        <tr key={idx} className={row.complication ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="text" value={row.complication} onChange={(e) => handleTableChange("complicationTable", idx, "complication", e.target.value)} placeholder="e.g. Anastomotic leak" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.complication ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.post_op_duration} onChange={(e) => handleTableChange("complicationTable", idx, "post_op_duration", e.target.value)} placeholder="e.g. POD-3 / Day 5" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.post_op_duration ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.management} onChange={(e) => handleTableChange("complicationTable", idx, "management", e.target.value)} placeholder="e.g. IV antibiotics, re-exploration" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.management ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.notes} onChange={(e) => handleTableChange("complicationTable", idx, "notes", e.target.value)} placeholder="Notes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("complicationTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.complicationTable || formState.complicationTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No post-op complications recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-block 3: Post op monitoring */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-4 rounded-xl">
                  <h4 className="h-subsection flex items-center gap-2">
                    <HeartPulse className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Post op monitoring
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("monitoringTable", { monitor_param: "", monitor_duration: "", monitor_findings: "", monitor_notes: "" })}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Monitoring Parameter</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2">Parameter</th>
                        <th className="p-2">Post Op Duration</th>
                        <th className="p-2">Findings</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {(formState.monitoringTable || []).map((row, idx) => (
                        <tr key={idx} className={row.monitor_param ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="text" value={row.monitor_param} onChange={(e) => handleTableChange("monitoringTable", idx, "monitor_param", e.target.value)} placeholder="e.g. BP / HR / SpO₂ / Drain output" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.monitor_param ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.monitor_duration} onChange={(e) => handleTableChange("monitoringTable", idx, "monitor_duration", e.target.value)} placeholder="e.g. q4h x 48h" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.monitor_duration ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.monitor_findings} onChange={(e) => handleTableChange("monitoringTable", idx, "monitor_findings", e.target.value)} placeholder="Stable / within limits" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.monitor_findings ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.monitor_notes} onChange={(e) => handleTableChange("monitoringTable", idx, "monitor_notes", e.target.value)} placeholder="Notes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.monitor_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("monitoringTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.monitoringTable || formState.monitoringTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No post-op monitoring recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-block 4: ICU Admission after surgery */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-4 rounded-xl">
                  <h4 className="h-subsection flex items-center gap-2">
                    <BedDouble className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    ICU Admission after surgery
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="icu_done"
                      value={formState.icu_done}
                      onChange={handleInputChange}
                      placeholder="e.g. Done"
                      className={`p-1 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded focus:ring-1 focus:ring-[#7A8C70] focus:border-[#7A8C70] ${formState.icu_done === "Done" ? "ai-priority-text" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => addRow("icuTable", { icu_date: "", icu_stay: "", icu_mgmt: "", icu_exit: "", icu_notes: "" })}
                    className="text-[11px] font-bold text-natural-accent-dark dark:text-natural-accent hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add ICU Stay</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2">ICU Admission Date</th>
                        <th className="p-2">Stay days count</th>
                        <th className="p-2">Managements</th>
                        <th className="p-2">Exit Date</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {(formState.icuTable || []).map((row, idx) => (
                        <tr key={idx} className={row.icu_date ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="date" value={row.icu_date} onChange={(e) => handleTableChange("icuTable", idx, "icu_date", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.icu_date ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.icu_stay} onChange={(e) => handleTableChange("icuTable", idx, "icu_stay", e.target.value)} placeholder="e.g. 3" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.icu_stay ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.icu_mgmt} onChange={(e) => handleTableChange("icuTable", idx, "icu_mgmt", e.target.value)} placeholder="e.g. Mechanical ventilation, inotropes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.icu_mgmt ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.icu_exit} onChange={(e) => handleTableChange("icuTable", idx, "icu_exit", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.icu_exit ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.icu_notes} onChange={(e) => handleTableChange("icuTable", idx, "icu_notes", e.target.value)} placeholder="Notes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.icu_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("icuTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.icuTable || formState.icuTable.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-slate-400 text-[11px]">No ICU admission recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-block 5: Ward admission details after surgery / ICU */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-4 rounded-xl">
                  <h4 className="h-subsection flex items-center gap-2">
                    <Home className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Ward admission details after surgery / ICU
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow("wardTable", { ward_entry: "", ward_stay: "", ward_mgmt: "", ward_exit: "", ward_notes: "" })}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Ward Stay</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2">Ward entry date after ICU / Surgery</th>
                        <th className="p-2">Ward Stay days count</th>
                        <th className="p-2">Ward management details</th>
                        <th className="p-2">Exit Date</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {(formState.wardTable || []).map((row, idx) => (
                        <tr key={idx} className={row.ward_entry ? "ai-priority-row" : ""}>
                          <td className="p-2">
                            <input type="date" value={row.ward_entry} onChange={(e) => handleTableChange("wardTable", idx, "ward_entry", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ward_entry ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.ward_stay} onChange={(e) => handleTableChange("wardTable", idx, "ward_stay", e.target.value)} placeholder="e.g. 5" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ward_stay ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.ward_mgmt} onChange={(e) => handleTableChange("wardTable", idx, "ward_mgmt", e.target.value)} placeholder="e.g. Wound care, drain monitoring" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ward_mgmt ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.ward_exit} onChange={(e) => handleTableChange("wardTable", idx, "ward_exit", e.target.value)} className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ward_exit ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.ward_notes} onChange={(e) => handleTableChange("wardTable", idx, "ward_notes", e.target.value)} placeholder="Notes" className={`w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${row.ward_notes ? "ai-priority-text" : ""}`} />
                          </td>
                          <td className="p-2 text-right align-top">
                            <button type="button" onClick={() => removeRow("wardTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.wardTable || formState.wardTable.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-slate-400 text-[11px]">No ward stay recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Collapsible Section 5: Common Medication & Notes */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("care")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.care ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-200 flex items-center justify-center text-xs font-bold ">Rx</span>
              <h3 className="h-section">Chronic Medication & Clinical Follow Up</h3>
            </div>
            {openSections.care ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.care && (
            <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-350">
              
              {/* Common Drugs Table list */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="h-subsection">Routine Prescriptions & Common Drugs</h4>
                  <button
                    type="button"
                    onClick={() => addRow("commonDrugsTable", { common_drug: "", common_dose: "", common_frequency: "OD", common_drug_notes: "" })}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Medication Row</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Medication / Drug Name</th>
                        <th className="p-2.5">Dosage Index</th>
                        <th className="p-2.5">Frequency Route</th>
                        <th className="p-2.5">Target Notes / PRN</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                      {formState.commonDrugsTable?.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input type="text" value={row.common_drug} onChange={(e) => handleTableChange("commonDrugsTable", idx, "common_drug", e.target.value)} placeholder="e.g. Paracetamol / Metoclopramide" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.common_dose} onChange={(e) => handleTableChange("commonDrugsTable", idx, "common_dose", e.target.value)} placeholder="500 mg" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={row.common_frequency} 
                              onChange={(e) => handleTableChange("commonDrugsTable", idx, "common_frequency", e.target.value)}
                              placeholder="e.g. OD / BD / TDS"
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input type="text" value={row.common_drug_notes} onChange={(e) => handleTableChange("commonDrugsTable", idx, "common_drug_notes", e.target.value)} placeholder="Take after food" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                          </td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => removeRow("commonDrugsTable", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formState.commonDrugsTable || formState.commonDrugsTable.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-[11px]">No routine medication registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Patient general medical notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#D9D5CB]/40 dark:border-slate-800/80">
                <div>
                  <label className="block font-semibold mb-1">Follow up directions & timelines</label>
                  <textarea
                    name="follow_up_notes"
                    value={formState.follow_up_notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter patient instructions for subsequent follow ups..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">General Notes & Clinical safety caveats</label>
                  <textarea
                    name="general_notes"
                    value={formState.general_notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Physical vitals, general health performance scale..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Collapsible Section 6: AI Added Extra Parameters (kept at the end) */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("extraParams")}
            className={`w-full bg-natural-sidebar/15 dark:bg-white/5 hover:bg-natural-sidebar/25 dark:hover:bg-white/10 p-4 ${openSections.extraParams ? "border-b border-natural-border" : ""} flex justify-between items-center cursor-pointer text-left focus:outline-none transition-all`}
          >
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xs font-bold ">AI+</span>
              <h3 className="h-section">AI Added Extra Parameters</h3>
            </div>
            {openSections.extraParams ? <ArrowUp className="h-4 w-4 text-slate-400" /> : <ArrowDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.extraParams && (
            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40 rounded-lg p-2.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300 mt-0.5 flex-shrink-0" />
                <span>
                  AI-extracted clinical facts that did not fit any of the predefined tables above are preserved here as <strong>Source / New Column</strong> + <strong>Preserved AI Detail</strong> rows. Add your own rows manually or let Gemini populate them from uploaded reports.
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 pl-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="h-subsection">
                    AI Added Extra Parameters
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => addRow("unmapped_medical_information", { source_section: "manual", detail: "", medical_importance: "medium" })}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Extra Row</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#D9D5CB]/50 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="h-table-col">
                      <th className="p-2.5">Source / New Column</th>
                      <th className="p-2.5">Preserved AI Detail</th>
                      <th className="p-2.5">Importance</th>
                      <th className="p-2.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D5CB]/30 dark:divide-slate-800">
                    {formState.unmapped_medical_information?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2">
                          <input type="text" value={row.source_section} onChange={(e) => handleTableChange("unmapped_medical_information", idx, "source_section", e.target.value)} placeholder="e.g. ECOG / unusual marker" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                        </td>
                        <td className="p-2">
                          <textarea value={row.detail} onChange={(e) => handleTableChange("unmapped_medical_information", idx, "detail", e.target.value)} rows={2} placeholder="AI preserved detail that does not fit the standard columns" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                        </td>
                        <td className="p-2">
                          <input type="text" value={row.medical_importance} onChange={(e) => handleTableChange("unmapped_medical_information", idx, "medical_importance", e.target.value)} placeholder="e.g. High" className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
                        </td>
                        <td className="p-2 text-right">
                          <button type="button" onClick={() => removeRow("unmapped_medical_information", idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded bg-rose-50 dark:bg-rose-950/20 transition">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!formState.unmapped_medical_information || formState.unmapped_medical_information.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400 text-[11px]">No extra AI-only parameters captured yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Form action bar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition duration-200 cursor-pointer text-xs hover-lift ripple-on-click"
          >
            Cancel and Discard Changes
          </button>
          <AnimatedButton
            type="submit"
            id="btn-save-record"
            variant="primary"
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white px-8"
            loading={isSaving}
            success={saveSuccess}
          >
            <Save className="h-4.5 w-4.5" />
            <span>Save Secure Record</span>
          </AnimatedButton>
        </div>

      </form>

    </div>
  );
}
