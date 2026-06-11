/**
 * Oncology Patient Schema Type Definitions
 */

export interface PresentingComplaint {
  complaint_name: string;
  duration: string;
  notes: string;
}

export interface Comorbidity {
  comorbidity_name: string;
  duration: string;
  notes: string;
}

export interface HospitalAdmission {
  admission_no: string;
  reason: string;
  date: string;
  notes: string;
}

export interface PastSurgery {
  procedure_name: string;
  complications: string;
  notes: string;
}

export interface DrugHistoryItem {
  drug_name: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  notes: string;
}

export interface FamilyHistoryItem {
  morbidity_name: string;
  relationship: string;
  notes: string;
}

export interface RiskFactor {
  risk_factor_name: string;
  notes: string;
}

export interface ExaminationFinding {
  examination_type: 'Height' | 'Weight' | 'BMI' | 'BSA' | 'Organ System';
  date: string;
  findings: string;
  organ_system_name?: string;
}

export interface ProblemItem {
  problem_name: string;
  management_plan: string;
}

export interface UsualPrescription {
  drug_name: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
}

export interface Allergies {
  foods: string[];
  drugs: string[];
  plasters: string[];
  others: string[];
}

export interface SocialHistory {
  smoking: {
    status: 'Current' | 'Ex' | 'Non consumer';
    amounts: string;
  };
  alcohol: {
    status: 'Current' | 'Ex' | 'Non consumer';
    amounts: string;
  };
}

// Investigations
export interface BloodInvestigation {
  test_name: string;
  result: string;
  date: string;
  notes: string;
}

export interface ImagingInvestigation {
  modality: string; // CT, MRI, Ultrasound, PET, X-ray
  date: string;
  mass_present: string;
  mass_size?: string;
  reporting_system_status?: string;
  findings: string;
  purpose?: string;
}

export interface BiopsyInvestigation {
  biopsy_type: string;
  date: string;
  pathology_status: string;
  findings: string;
  purpose?: string;
}

export interface Immunohistochemistry {
  marker_name: string;
  status: string; // Positive, Negative, Borderline
  intensity?: string;
  notes: string;
  purpose?: string;
}

export interface GeneticInvestigation {
  mutation_tested: string;
  status: string;
  notes: string;
  purpose?: string;
}

export interface OtherInvestigation {
  investigation_type: string;
  date: string;
  findings: string;
  purpose?: string;
}

export interface EndoscopyInvestigation {
  procedure_type: string; // Gastroscopy, Colonoscopy, etc.
  date: string;
  findings: string;
  biopsy_taken: string;
  purpose?: string;
}

export interface TumourMarkerInvestigation {
  marker_name: string;
  value: string;
  unit?: string;
  date: string;
  reference_range?: string;
  purpose?: string;
}

export interface Investigations {
  imaging: ImagingInvestigation[];
  biopsies: BiopsyInvestigation[];
  endoscopy: EndoscopyInvestigation[];
  ihc: Immunohistochemistry[];
  genetic: GeneticInvestigation[];
  tumour_markers: TumourMarkerInvestigation[];
  others: OtherInvestigation[];
}

// Treatments
export interface Chemotherapy {
  status: 'Done' | 'Not done';
  date?: string;
  drug_name?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  adverse_effects?: string;
  notes?: string;
}

export interface Radiotherapy {
  status: 'Done' | 'Not done';
  sessions?: {
    dose_gy: string;
    fractions: string;
    site: string;
    date_completed: string;
  }[];
  type_name?: string;
  date?: string;
  site?: string;
  dose?: string;
  frequency?: string;
  approach?: string;
  cycles?: string;
  adverse_effects?: string;
  notes?: string;
}

export interface PostOpComplication {
  complication_name: string;
  significant_amount: string;
  duration: string;
  notes: string;
}

export interface PostOpMonitoring {
  post_op_day_no: string;
  parameter: string;
  findings: string;
}

export interface SurgeryDetails {
  procedure_name: string;
  surgery_site: string;
  done_date: string;
  approach: string;
  icu_entered: 'Yes' | 'No';
  icu_entry_date?: string;
  icu_exit_date?: string;
  icu_management_notes?: string;
  icu_stay_days?: number;
  after_surgery_ward_entry_date?: string;
  after_surgery_discharged_date?: string;
  ward_management_notes?: string;
  hospital_stay_days?: number;
  margin_status: string;
  complications: PostOpComplication[];
  monitoring: PostOpMonitoring[];
  other_surgical_notes?: string;
}

export interface StagingDetails {
  staging_system_name: string; // TNM, FIGO, etc.
  overall_stage: string;
  staging_notes: string;
}

export interface FollowUpNote {
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

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'addition' | 'modification' | 'access';
  actor_name: string;
  actor_email: string;
  actor_role: string;
  details: string;
  ip_address?: string;
}

export interface Patient {
  patient_id: string; // UUID
  record_id?: string; // Auto-generated
  consent_taken: boolean;
  consent_date?: string;
  
  // Top Level Identifiers
  initials: string;
  last_name: string;
  nic: string;
  bht_no: string;
  clinic_no: string;
  tp: string;
  tp_countryCode?: string;

  // Basic Details Section
  title: 'Mr.' | 'Mrs.' | 'Miss' | 'Dr' | 'Prof' | 'Rev' | '';
  oncology_type: string[]; // Multi-select array of cancer types
  other_oncology_type?: string; 
  dob: string;
  age_display?: string;
  gender: 'Male' | 'Female' | 'non-binary' | '';
  living_area: string;
  hospital_location: string;
  hospital_type: string;
  hospital_name: string;
  marital_status: 'Married' | 'Single' | 'Widowed' | 'Separated' | 'Divorced' | '';
  occupation: string;

  // Arrays
  presenting_complaints: PresentingComplaint[];
  comorbidities: Comorbidity[];
  hospital_admissions: HospitalAdmission[];
  past_surgeries: PastSurgery[];
  drug_history: DrugHistoryItem[];
  family_history: FamilyHistoryItem[];
  risk_factors: RiskFactor[];
  examination_findings: ExaminationFinding[];
  problems: ProblemItem[];
  usual_prescriptions: UsualPrescription[];

  // Structured Objects
  allergies: Allergies;
  social_history: SocialHistory;
  provisional_diagnosis: string;
  final_diagnosis: string;
  other_notes: string;

  // Investigations
  investigations: Investigations;

  // Pre-op assessment
  preop_assessment?: PreOpAssessment;

  // Oncology & Research Audits
  mdt_discussion?: MdtDiscussion;
  genomic_biomarkers?: GenomicBiomarkers;
  onco_surgical_audit?: OncoSurgicalAudit;
  clinical_research_trial?: ClinicalResearchTrial;

  // Treatments
  neo_adjuvant_chemotherapy: Chemotherapy;
  neo_adjuvant_radiotherapy: Radiotherapy;
  adjuvant_chemotherapy: Chemotherapy;
  adjuvant_radiotherapy: Radiotherapy;
  surgeries: SurgeryDetails[];
  surgery?: SurgeryDetails; // Legacy
  staging_details: StagingDetails[];
  histological_staging_details: StagingDetails[];
  follow_up_notes: FollowUpNote[];

  // Metadata
  created_at: string;
  updated_at: string;
  audit_trail?: AuditLog[];
}

// Media file definitions
export interface MediaRecord {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  created_at: string;
  folder: string;
  tags: string[];
  original_filename: string;
  upload_type: 'ai_extracted' | 'manual';
}

// Active user session
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  agreement_accepted: boolean;
  agreement_date?: string;
}

export interface MdtDiscussion {
  discussed: 'Yes' | 'No' | 'Pending';
  mdt_date?: string;
  mdt_panel_members?: string;
  recommendations?: string;
  molecular_tumor_board?: boolean;
  mdt_treatment_alignment?: 'Aligned' | 'Partially Aligned' | 'Not Aligned' | 'Not Evaluated';
  mdt_deviation_reason?: string;
}

export interface GenomicBiomarkers {
  her2_status?: 'Positive' | 'Negative' | 'Equivocal' | 'Not Tested';
  er_status?: 'Positive' | 'Negative' | 'Not Tested';
  pr_status?: 'Positive' | 'Negative' | 'Not Tested';
  msi_status?: 'MSS' | 'MSI-H' | 'Not Tested';
  brca_status?: 'Mutated' | 'Wild-Type' | 'Not Tested';
  kras_nras_pik3ca?: string;
  egfr_alk_ros1?: string;
  pd_l1_cps_tps?: string;
}

export interface OncoSurgicalAudit {
  resection_margin_r0_r1_r2?: 'R0' | 'R1' | 'R2' | 'Rx';
  total_lymph_nodes_harvested?: number;
  positive_lymph_nodes?: number;
  lymph_node_ratio?: number;
  lymphovascular_invasion?: 'Present' | 'Absent' | 'Equivocal';
  perineural_invasion?: 'Present' | 'Absent' | 'Equivocal';
  biobanking_sample_stored?: 'Yes' | 'No';
  biobank_id?: string;
  clavien_dindo_grade?: string;
  closest_crm_mm?: number;
  tumor_regression_grade?: 'TRG 1 (Complete Response)' | 'TRG 2 (Near Complete)' | 'TRG 3 (Partial Response)' | 'TRG 4 (Minimal Response)' | 'TRG 5 (No Response)' | 'Not Applicable (No Neoadjuvant Tx)';
  synoptic_pathology_reporting?: 'Yes' | 'No' | 'N/A';
  biobank_tissue_type?: 'FFPE Block' | 'Fresh Frozen Tissue' | 'Liquid Biopsy (Serum/Plasma)' | 'Saliva/Other';
}

export interface ClinicalResearchTrial {
  trial_enrolled?: 'Yes' | 'No' | 'Eligible - Refused';
  trial_name_code?: string;
  study_type?: string;
  disease_free_survival_months?: number;
  overall_survival_months?: number;
  recurrence_detected?: 'Yes' | 'No' | 'Suspected';
  recurrence_date?: string;
  recurrence_site?: string;
  last_followup_status?: 'Alive and disease-free' | 'Alive with disease' | 'Deceased' | 'Lost to follow-up';
  treatment_response_recist?: 'CR (Complete Response)' | 'PR (Partial Response)' | 'SD (Stable Disease)' | 'PD (Progressive Disease)' | 'Not Evaluated';
  treatment_toxicity_ctcae?: 'None' | 'Grade 1-2 (Mild/Moderate)' | 'Grade 3 (Severe)' | 'Grade 4 (Life-threatening)' | 'Grade 5 (Death)';
  qol_score_percentage?: number;
  unplanned_30day_readmission?: 'Yes' | 'No';
  unplanned_return_to_theatre?: 'Yes' | 'No';
}

export const ONCOLOGY_TYPES = [
  // Head and Neck
  "Oral cavity", "Parotid", "Salivary gland (Submandibular/Sublingual)", "Pharyngeal (Nasopharynx/Oropharynx/Hypopharynx)", "Laryngeal", "Sinonasal", "Thyroid", "Mandibular",
  
  // Thoracic
  "Lung (NSCLC/SCLC)", "Mediastinum", "Thymus", "Heart/Pericardium", "Pleura (Mesothelioma)", "Esophagus",

  // Digestive System
  "Gastric (Stomach)", "Small bowel", "Large bowel (Colon)", "Rectal", "Anal", "Liver (Hepatocellular/Cholangiocarcinoma)", "Gall bladder", "Biliary tree (Bile ducts)", "Pancreas", "Spleen",
  
  // Breast
  "Breast",

  // Genitourinary
  "Renal (Kidney)", "Adrenal", "Bladder", "Urethra", "Prostate", "Testicular", "Penile",

  // Gynecological
  "Ovary", "Fallopian tubes", "Uterine (Endometrial)", "Cervical", "Vaginal", "Vulvar",

  // Hematological / Lymphatic
  "Lymphoma (Hodgkin/Non-Hodgkin)", "Leukemia", "Myeloma",
  
  // Skin / Soft Tissue / Bone
  "Melanoma", "Skin (Non-melanoma)", "Sarcoma (Soft tissue)", "Bone",

  // Central Nervous System
  "Brain (Primary/Metastatic)", "Spinal Cord",

  // Others
  "Other"
];
