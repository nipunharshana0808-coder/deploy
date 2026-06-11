/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OncologyCategory {
  ORAL_CAVITY = "Oral cavity",
  GALL_BLADDER = "Gall bladder",
  RENAL = "Renal",
  VAGINAL = "Vaginal",
  PAROTID = "Parotid",
  PANCREAS = "Pancreas",
  ADRENALS = "Adrenals",
  SARCOMA = "Sarcoma",
  ESOPHAGUS = "Esophagus",
  BILIARY_TREE = "Biliary tree",
  BLADDER = "Bladder",
  BONE = "Bone",
  GASTRIC = "Gastric",
  SPLEEN = "Spleen",
  URETHRA = "Urethra",
  SKIN = "Skin",
  SMALL_BOWEL = "Small bowel",
  BREAST = "Breast",
  PROSTATE = "Prostate",
  MANDIBULAR = "Mandibular",
  LARGE_BOWEL = "Large bowel",
  THYROID = "Thyroid",
  OVARY = "Ovary",
  SUBMANDIBULAR = "Submandibular",
  RECTAL = "Rectal",
  LUNG = "Lung",
  FALLOPIAN_TUBES = "Fallopian tubes",
  LIVER = "Liver",
  HEART = "Heart",
  UTERUS_CERVIX = "Uterus / cervix",
  OTHER = "Other"
}

export type PatientStatus = "active" | "under_treatment" | "follow_up" | "discharged";

export interface DrugTableEntry {
  drug_name: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
}

export interface FamilyTableEntry {
  comorbidity: string;
  relationship: string;
  family_notes: string;
}

export interface RiskTableEntry {
  risk_factor: string;
  risk_notes: string;
}

export interface ExamFindingsTableEntry {
  organ_system: string;
  findings: string;
  notes: string;
}

export interface BloodTableEntry {
  blood_type: string;
  blood_purpose: string; // "Diagnosis" | "confirmation" | "prognosis" | "follow up"
  blood_date: string;
  blood_findings: string;
  blood_notes: string;
}

export interface TumorMarkerTableEntry {
  marker_name: string;
  marker_value: string;
  marker_unit: string;
  marker_date: string;
  marker_ref_range: string;
  marker_notes: string;
}

export interface ImagingTableEntry {
  imaging_type: string;
  imaging_purpose: string;
  imaging_parameter: string;
  imaging_findings: string;
  mass_present: string;
  mass_size: string;
  mass_location: string;
  calcifications: string;
  lymph_nodes: string;
  metastasis: string;
  ascites: string;
  pv_status: string;
  sma_status: string;
}

export interface EndoscopyTableEntry {
  endo_type: string;
  endo_purpose: string;
  endo_parameter: string;
  endo_findings: string;
}

export interface OtherInvTableEntry {
  otherinv_type: string;
  otherinv_purpose: string;
  otherinv_parameter: string;
  otherinv_findings: string;
}

export interface BiopsyTableEntry {
  biopsy_type: string;
  biopsy_purpose: string;
  biopsy_parameter: string;
  biopsy_findings: string;
  biopsy_stage: string;
  lvi: string;
  perineural_invasion: string;
  margin_status: string;
  cell_type: string;
  metastasis: string;
  lymph_nodes: string;
}

export interface ImmunohistochemistryTableEntry {
  ihc_specimen: string;
  ihc_panel: string;
  ihc_marker: string;
  ihc_result: string;
  ihc_intensity: string;
  ihc_percentage: string;
  ihc_score: string;
  ihc_pattern: string;
  ihc_method: string;
  ihc_date: string;
  ihc_lab: string;
  ihc_pathologist: string;
  ihc_interpretation: string;
  ihc_notes: string;
}

export interface SupplementaryDetailEntry {
  detail_heading: string;
  detail_subheading: string;
  detail_label: string;
  detail_value: string;
  detail_unit: string;
  detail_date: string;
  detail_priority: string;
  detail_category: string;
  detail_source: string;
  detail_notes: string;
}

export interface StagingTableEntry {
  staging_system: string;
  staging_notes: string;
}

export interface ProblemTableEntry {
  problem: string;
  management_plan: string;
}

export interface CommonDrugsTableEntry {
  common_drug: string;
  common_dose: string;
  common_frequency: string;
  common_drug_notes: string;
}

export interface NeoChemoTableEntry {
  neo_chemo_drug: string;
  neo_chemo_dose: string;
  neo_chemo_freq: string;
  neo_chemo_route: string;
  neo_chemo_cycles: string;
  neo_chemo_effects: string;
  neo_chemo_notes: string;
}

export interface NeoRadioTableEntry {
  neo_radio_comp: string;
  neo_radio_dose: string;
  neo_radio_freq: string;
  neo_radio_route: string;
  neo_radio_cycles: string;
  neo_radio_effects: string;
  neo_radio_notes: string;
}

export interface SurgeryTableEntry {
  surgery_name: string;
  surgery_date: string;
  surgery_site: string;
  surgery_approach: string;
  surgery_findings: string;
  drain_status: string;
  drain_volume: string;
  surgery_notes: string;
}

export interface ComplicationTableEntry {
  complication: string;
  post_op_duration: string;
  management: string;
  notes: string;
}

export interface MonitoringTableEntry {
  monitor_param: string;
  monitor_duration: string;
  monitor_findings: string;
  monitor_notes: string;
}

export interface IcuTableEntry {
  icu_date: string;
  icu_stay: string;
  icu_mgmt: string;
  icu_exit: string;
  icu_notes: string;
}

export interface WardTableEntry {
  ward_entry: string;
  ward_stay: string;
  ward_mgmt: string;
  ward_exit: string;
  ward_notes: string;
}

export interface UnmappedMedicalInformationEntry {
  source_section: string;
  detail: string;
  medical_importance: "high" | "medium" | "low";
}

export interface SourceFileSummaryEntry {
  file_name: string;
  document_type: string;
  clinically_relevant_summary: string;
  unclear_or_unreadable_parts: string;
}

export interface StructuredStagingEntry {
  staging_system_name: string;
  overall_stage: string;
  staging_notes: string;
}

export interface StructuredFollowUpEntry {
  date: string;
  findings: string[];
}

export interface PreOpAssessment {
  date: string;
  asa_physical_status: string;
  clerked_by: string;
  anesthesia_plan: string;
  risk_assessment_scores: string;
  special_investigations: string;
  preop_orders: string;
  fitness_status: string;
  met_score?: string;
  notes: string;
}

export interface MdtDiscussion {
  discussed: "Yes" | "No" | "Pending";
  mdt_date?: string;
  mdt_panel_members?: string;
  recommendations?: string;
  molecular_tumor_board?: boolean;
  mdt_treatment_alignment?: "Aligned" | "Partially Aligned" | "Not Aligned" | "Not Evaluated";
  mdt_deviation_reason?: string;
}

export interface GenomicBiomarkers {
  her2_status?: "Positive" | "Negative" | "Equivocal" | "Not Tested";
  er_status?: "Positive" | "Negative" | "Not Tested";
  pr_status?: "Positive" | "Negative" | "Not Tested";
  msi_status?: "MSS" | "MSI-H" | "Not Tested";
  brca_status?: "Mutated" | "Wild-Type" | "Not Tested";
  kras_nras_pik3ca?: string;
  egfr_alk_ros1?: string;
  pd_l1_cps_tps?: string;
}

export interface OncoSurgicalAudit {
  resection_margin_r0_r1_r2?: "R0" | "R1" | "R2" | "Rx";
  total_lymph_nodes_harvested?: number;
  positive_lymph_nodes?: number;
  lymph_node_ratio?: number;
  lymphovascular_invasion?: "Present" | "Absent" | "Equivocal";
  perineural_invasion?: "Present" | "Absent" | "Equivocal";
  biobanking_sample_stored?: "Yes" | "No";
  biobank_id?: string;
  clavien_dindo_grade?: string;
  closest_crm_mm?: number;
  tumor_regression_grade?: string;
  synoptic_pathology_reporting?: "Yes" | "No" | "N/A";
  biobank_tissue_type?: "FFPE Block" | "Fresh Frozen Tissue" | "Liquid Biopsy (Serum/Plasma)" | "Saliva/Other";
}

export interface ClinicalResearchTrial {
  trial_enrolled?: "Yes" | "No" | "Eligible - Refused";
  trial_name_code?: string;
  study_type?: string;
  disease_free_survival_months?: number;
  overall_survival_months?: number;
  recurrence_detected?: "Yes" | "No" | "Suspected";
  recurrence_date?: string;
  recurrence_site?: string;
  last_followup_status?: "Alive and disease-free" | "Alive with disease" | "Deceased" | "Lost to follow-up";
  treatment_response_recist?: "CR (Complete Response)" | "PR (Partial Response)" | "SD (Stable Disease)" | "PD (Progressive Disease)" | "Not Evaluated";
  treatment_toxicity_ctcae?: "None" | "Grade 1-2 (Mild/Moderate)" | "Grade 3 (Severe)" | "Grade 4 (Life-threatening)" | "Grade 5 (Death)";
  qol_score_percentage?: number;
  unplanned_30day_readmission?: "Yes" | "No";
  unplanned_return_to_theatre?: "Yes" | "No";
}

export interface PatientRecord {
  id: string; // local firestore document id / custom auto_id
  isDeleted?: boolean;
  
  // Basic Details Section
  oncology: OncologyCategory;
  oncology_types: string[];
  oncology_other?: string;
  date: string; // date of registration/entry
  auto_id: string;
  tp: string; // telephone number
  nic: string; // NIC card number
  title: string; // e.g. "Mr.", "Mrs.", "Miss.", "Dr.", "Prof.", "Rev."
  initials: string;
  first_name: string;
  last_name: string;
  bht: string; // clinic book reference
  clinic: string;
  dob: string;
  age: string | number;
  gender: string;
  living_area: string;
  hospital: string;
  ward_no: string;
  marital_status: string;
  occupation: string;
  status: PatientStatus;

  // History & Presentations
  presenting_complaints: string;
  comorbidity: string;
  hospital_admissions: string;
  past_surgical_history: string;

  // Tables
  drugTable: DrugTableEntry[];
  
  // Allergies
  allergy_food: string;
  allergy_drugs: string;
  allergy_plasters: string;
  allergy_other: string;

  familyTable: FamilyTableEntry[];

  // Social habits
  smoking: string;
  smoking_amount: string;
  alcohol: string;
  alcohol_amount: string;

  riskTable: RiskTableEntry[];

  // Physical parameters
  bmi: string;
  bsa: string;
  height: string;
  weight: string;
  exam_findings: string;
  systemic_exam: string;
  examFindingsTable: ExamFindingsTableEntry[];

  // Diagnoses & staging
  provisional_diagnosis: string;
  bloodTable: BloodTableEntry[];
  tumorMarkersTable: TumorMarkerTableEntry[];
  imagingTable: ImagingTableEntry[];
  endoscopyTable: EndoscopyTableEntry[];
  otherInvTable: OtherInvTableEntry[];
  biopsyTable: BiopsyTableEntry[];
  immunohistochemistryTable: ImmunohistochemistryTableEntry[];
  supplementaryDetailsTable: SupplementaryDetailEntry[];
  stagingTable: StagingTableEntry[];
  overall_stage: string;
  tnm_stage: string;
  final_diagnosis: string;

  // Care Management
  problemTable: ProblemTableEntry[];
  commonDrugsTable: CommonDrugsTableEntry[];

  // Neo-adjuvant Chemotherapy
  neo_chemo_status: string;
  neoChemoTable: NeoChemoTableEntry[];

  // Adjuvant Chemotherapy
  adj_chemo_status: string;
  adjChemoTable: NeoChemoTableEntry[];

  // Neo-adjuvant Radiotherapy
  neo_radio_status: string;
  neoRadioTable: NeoRadioTableEntry[];

  // Adjuvant Radiotherapy
  adj_radio_status: string;
  adjRadioTable: NeoRadioTableEntry[];

  // Surgeries
  surgeryTable: SurgeryTableEntry[];
  complicationTable: ComplicationTableEntry[];
  monitoringTable: MonitoringTableEntry[];
  
  // ICU & Ward
  icu_done: string;
  icuTable: IcuTableEntry[];
  wardTable: WardTableEntry[];

  // Notes
  follow_up_notes: string;
  general_notes: string;

  // Enhanced clinical form fields
  consent_date?: string;
  phone_country_code?: string;
  hospital_location?: string;
  hospital_type?: string;
  staging_details?: StructuredStagingEntry[];
  histological_staging_details?: StructuredStagingEntry[];
  structured_follow_up_notes?: StructuredFollowUpEntry[];
  preop_assessment?: PreOpAssessment;
  mdt_discussion?: MdtDiscussion;
  genomic_biomarkers?: GenomicBiomarkers;
  onco_surgical_audit?: OncoSurgicalAudit;
  clinical_research_trial?: ClinicalResearchTrial;

  // AI Unmapped summaries & parameters
  unmapped_medical_information: UnmappedMedicalInformationEntry[];
  source_file_summaries: SourceFileSummaryEntry[];
  extraction_safety_note: string;

  // Timestamp tracking
  createdAt: string;
  updatedAt: string;
}

// Drive Virtual File System
export interface DiskFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  patientId: string;
  extracted: boolean;
  contentBase64?: string; // stored for simulation/download
  isDeleted?: boolean;
}

export interface UserAccount {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatarColor: string;
}
