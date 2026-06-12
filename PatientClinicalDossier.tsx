/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Activity,
  BadgePlus,
  BedDouble,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Dna,
  FileCheck2,
  FilePlus2,
  FlaskConical,
  HeartPulse,
  History,
  Microscope,
  NotebookTabs,
  Pill,
  ScanLine,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PatientRecord } from "../types";

type ClinicalRecord = Record<string, unknown>;
type FieldDefinition = readonly [label: string, key: keyof PatientRecord];

const SEEDED_DEFAULTS: Record<string, string> = {
  source: "Manual",
  tumor_size_unit: "mm",
  detail_priority: "medium",
  imaging_type: "CT Chest/Abdomen",
  imaging_purpose: "Diagnosis",
  endo_type: "Colonoscopy",
  endo_purpose: "Diagnosis",
  biopsy_type: "True-cut Biopsy",
  biopsy_purpose: "confirmation",
  ihc_method: "IHC",
};

const LABEL_OVERRIDES: Record<string, string> = {
  adl: "ADL",
  ai: "AI",
  asa: "ASA",
  bclc: "BCLC",
  bht: "BHT",
  bmi: "BMI",
  bnp: "BNP",
  bsa: "BSA",
  cci: "CCI",
  ckd: "CKD",
  crp: "CRP",
  ct: "CT",
  dob: "Date of Birth",
  ecg: "ECG",
  ecog: "ECOG",
  egfr: "eGFR",
  figo: "FIGO",
  hba1c: "HbA1c",
  hiv: "HIV",
  hklc: "HKLC",
  iadl: "IADL",
  icu: "ICU",
  ihc: "IHC",
  inr: "INR",
  iss: "ISS",
  ki67: "Ki-67",
  mdt: "MDT",
  meld: "MELD",
  mpr: "MPR",
  mri: "MRI",
  ngs: "NGS",
  nic: "NIC",
  nos: "NOS",
  pet: "PET",
  possum: "POSSUM",
  rcri: "RCRI",
  recist: "RECIST",
  riss: "R-ISS",
  tnm: "TNM",
  tp: "Telephone",
  who: "WHO",
};

const titleCase = (key: string) =>
  key
    .replace(/Table$/, "")
    .split("_")
    .filter(Boolean)
    .map((part) => LABEL_OVERRIDES[part.toLowerCase()] || `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const hasClinicalValue = (value: unknown, key = ""): boolean => {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return Boolean(trimmed) && SEEDED_DEFAULTS[key] !== trimmed;
  }
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some((item) => hasClinicalValue(item));
  if (typeof value === "object") {
    return Object.entries(value as ClinicalRecord).some(([childKey, childValue]) =>
      hasClinicalValue(childValue, childKey)
    );
  }
  return true;
};

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const visible = value.filter((item) => hasClinicalValue(item));
    return visible.length ? visible.map(displayValue).join(", ") : "Not recorded";
  }
  if (typeof value === "object") {
    const visible = Object.entries(value as ClinicalRecord)
      .filter(([key, childValue]) => hasClinicalValue(childValue, key))
      .map(([key, childValue]) => `${titleCase(key)}: ${displayValue(childValue)}`);
    return visible.length ? visible.join("; ") : "Not recorded";
  }
  return String(value);
};

const asRows = (value: unknown): ClinicalRecord[] =>
  Array.isArray(value)
    ? value.filter((row): row is ClinicalRecord => Boolean(row) && typeof row === "object")
    : [];

const patientFields = (patient: PatientRecord, definitions: FieldDefinition[]) =>
  definitions.map(([label, key]) => ({ label, value: patient[key] }));

function EmptyState({ text = "No clinical data recorded in this section." }: { text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-natural-border bg-theme-surface/45 px-4 py-5 text-sm text-theme-muted">
      {text}
    </div>
  );
}

function FieldGrid({
  fields,
  showEmpty = true,
}: {
  fields: Array<{ label: string; value: unknown }>;
  showEmpty?: boolean;
}) {
  const visible = showEmpty ? fields : fields.filter(({ value }) => hasClinicalValue(value));
  if (!visible.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(({ label, value }) => (
        <div
          key={label}
          className="min-w-0 rounded-xl border border-natural-border bg-theme-surface px-4 py-3 shadow-xs"
        >
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-theme-muted">
            {label}
          </div>
          <div className="break-words text-sm font-semibold leading-relaxed text-theme-primary">
            {displayValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

const preferredRowTitle = (row: ClinicalRecord, index: number) => {
  const candidates = [
    "primary_cancer_site",
    "anatomic_sub_site",
    "diagnosis",
    "test_name",
    "investigation",
    "imaging_type",
    "biopsy_type",
    "staging_system",
    "grading_system",
    "therapy_type",
    "surgery_name",
    "procedure",
    "complaint",
    "parameter",
    "assessment_date",
    "date",
    "file_name",
  ];
  const key = candidates.find((candidate) => hasClinicalValue(row[candidate], candidate));
  return key ? displayValue(row[key]) : `Entry ${index + 1}`;
};

function NestedValue({ label, value }: { label: string; value: unknown }) {
  if (Array.isArray(value)) {
    const containsOnlyRecords = value.every((item) => item && typeof item === "object");
    if (containsOnlyRecords) return <ClinicalRows title={label} value={value} compact />;
  }
  if (!Array.isArray(value) && value && typeof value === "object") {
    return <ClinicalRows title={label} value={[value]} compact />;
  }
  return (
    <div className="rounded-lg border border-natural-border bg-theme-surface px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-theme-muted">{label}</div>
      <div className="mt-1 break-words text-sm text-theme-primary">{displayValue(value)}</div>
    </div>
  );
}

function ClinicalRows({
  title,
  value,
  compact = false,
}: {
  title: string;
  value: unknown;
  compact?: boolean;
}) {
  const rows = asRows(value).filter((row) => hasClinicalValue(row));
  if (!rows.length) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && <h4 className="h-group text-theme-primary">{title}</h4>}
      {rows.map((row, rowIndex) => {
        const entries = Object.entries(row).filter(
          ([key, childValue]) => key !== "id" && hasClinicalValue(childValue, key)
        );
        const scalarEntries = entries.filter(([, childValue]) => !childValue || typeof childValue !== "object");
        const nestedEntries = entries.filter(([, childValue]) => childValue && typeof childValue === "object");

        return (
          <article
            key={`${title}-${rowIndex}`}
            className="overflow-hidden rounded-xl border border-natural-border bg-theme-card shadow-xs"
          >
            <div className="border-b border-natural-border bg-theme-surface px-4 py-2.5">
              <div className="text-sm font-bold text-theme-primary">{preferredRowTitle(row, rowIndex)}</div>
            </div>
            <div className="space-y-3 p-3">
              {scalarEntries.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {scalarEntries.map(([key, childValue]) => (
                    <NestedValue key={key} label={titleCase(key)} value={childValue} />
                  ))}
                </div>
              )}
              {nestedEntries.map(([key, childValue]) => (
                <NestedValue key={key} label={titleCase(key)} value={childValue} />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TableCollection({
  patient,
  tables,
}: {
  patient: PatientRecord;
  tables: Array<readonly [title: string, key: keyof PatientRecord]>;
}) {
  const populated = tables.filter(([, key]) => asRows(patient[key]).some((row) => hasClinicalValue(row)));
  if (!populated.length) return <EmptyState />;

  return (
    <div className="space-y-5">
      {populated.map(([title, key]) => (
        <ClinicalRows key={String(key)} title={title} value={patient[key]} />
      ))}
    </div>
  );
}

function DossierSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-natural-border bg-theme-card shadow-sm">
      <header className="flex items-center gap-3 border-b border-natural-border bg-theme-surface px-4 py-4 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-natural-border bg-theme-card text-theme-accent">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-theme-muted">
            Clinical section {number}
          </div>
          <h3 className="truncate text-base font-black text-theme-primary sm:text-lg">{title}</h3>
        </div>
        <span className="rounded-full border border-natural-border bg-theme-card px-3 py-1 text-xs font-bold text-theme-muted">
          {number.toString().padStart(2, "0")}
        </span>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function PatientClinicalDossier({ patient }: { patient: PatientRecord }) {
  const tumorLegacy = [
    ["Primary cancer site parameter", patient.tumor_primary_cancer_site_parameter],
    ["Primary cancer site", patient.tumor_primary_cancer_site],
    ["Histological type parameter", patient.tumor_histological_type_parameter],
    ["Histological type", patient.tumor_histological_type],
    ["Histological grade", patient.tumor_histological_grade],
    ["Diagnosis date", patient.tumor_diagnosis_date],
    ["Diagnostic modality parameter", patient.tumor_diagnostic_modality_parameter],
    ["Diagnostic modality", patient.tumor_diagnostic_modality],
    ["Laterality", patient.tumor_laterality],
    ["Number of primary tumours", patient.tumor_primary_count],
    ["Synchronous malignancy", patient.tumor_synchronous_malignancy],
    ["Metachronous malignancy", patient.tumor_metachronous_malignancy],
    ["Molecular markers parameter", patient.tumor_molecular_markers_parameter],
    ["Molecular markers", patient.tumor_molecular_markers],
    ["Immunohistochemistry parameter", patient.tumor_immunohistochemistry_parameter],
    ["Immunohistochemistry", patient.tumor_immunohistochemistry],
    ["Genomic testing parameter", patient.tumor_genomic_testing_parameter],
    ["Genomic testing", patient.tumor_genomic_testing],
    ["Gene expression profile parameter", patient.tumor_gene_expression_profile_parameter],
    ["Gene expression profile", patient.tumor_gene_expression_profile],
    ["Viral status parameter", patient.tumor_viral_status_parameter],
    ["Viral status", patient.tumor_viral_status],
    ["Cell morphology parameter", patient.tumor_cell_morphology_parameter],
    ["Cell morphology", patient.tumor_cell_morphology],
    ["Tumour biology summary", patient.tumor_biology_summary],
    ["Adequate sampling confirmation", patient.tumor_sampling_confirmation],
  ].map(([label, value]) => ({ label: String(label), value }));

  return (
    <div className="space-y-5">
      <DossierSection number={1} title="Patient Identifiers" icon={UserRound}>
        <FieldGrid fields={patientFields(patient, [
          ["Record ID", "id"],
          ["Registration ID", "auto_id"],
          ["Registration date", "date"],
          ["Title", "title"],
          ["Initials", "initials"],
          ["First name", "first_name"],
          ["Last name", "last_name"],
          ["NIC", "nic"],
          ["Telephone", "tp"],
          ["BHT number", "bht"],
          ["Clinic", "clinic"],
          ["Record status", "status"],
          ["Deleted record", "isDeleted"],
        ])} />
      </DossierSection>

      <DossierSection number={2} title="Demographics" icon={BadgePlus}>
        <FieldGrid fields={patientFields(patient, [
          ["Date of birth", "dob"],
          ["Age", "age"],
          ["Gender", "gender"],
          ["Living area", "living_area"],
          ["Marital status", "marital_status"],
          ["Education status", "education_status"],
          ["Ethnicity", "ethnicity"],
          ["Occupation", "occupation"],
          ["Geographic accessibility", "geographic_accessibility"],
        ])} />
      </DossierSection>

      <DossierSection number={3} title="Oncology Types" icon={Dna}>
        <FieldGrid fields={patientFields(patient, [
          ["Primary oncology category", "oncology"],
          ["Oncology types", "oncology_types"],
          ["Other oncology type", "oncology_other"],
        ])} />
      </DossierSection>

      <DossierSection number={4} title="Hospital Information" icon={Building2}>
        <FieldGrid fields={patientFields(patient, [
          ["Hospital", "hospital"],
          ["Hospital location", "hospital_location"],
          ["Hospital type", "hospital_type"],
          ["Ward number", "ward_no"],
          ["Clinic", "clinic"],
          ["BHT number", "bht"],
        ])} />
      </DossierSection>

      <DossierSection number={5} title="Clinical History" icon={History}>
        <div className="space-y-5">
          <FieldGrid showEmpty={false} fields={patientFields(patient, [
            ["Presenting complaints", "presenting_complaints"],
            ["Comorbidity summary", "comorbidity"],
            ["Hospital admissions", "hospital_admissions"],
            ["Past surgical history", "past_surgical_history"],
            ["Food allergies", "allergy_food"],
            ["Drug allergies", "allergy_drugs"],
            ["Plaster allergies", "allergy_plasters"],
            ["Other allergies", "allergy_other"],
            ["Smoking status", "smoking"],
            ["Smoking amount", "smoking_amount"],
            ["Alcohol status", "alcohol"],
            ["Alcohol amount", "alcohol_amount"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Presenting Complaints", "presentingComplaintsTable"],
            ["Past Medical History", "pastMedicalTable"],
            ["Past Surgical History", "pastSurgicalTable"],
            ["Prior Chemotherapy", "priorChemoTable"],
            ["Prior Radiotherapy", "priorRadioTable"],
            ["Prior Immunotherapy", "priorImmunoTable"],
            ["Prior Hormone Therapy", "priorHormoneTable"],
            ["Prior Targeted Therapy", "priorTargetedTable"],
            ["Chronic Medication", "drugTable"],
            ["Family History", "familyTable"],
            ["Risk Factors", "riskTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={6} title="Clinical Assessment" icon={ClipboardCheck}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Charlson Comorbidity Index", "charlson_index"],
            ["Charlson conditions", "charlson_conditions"],
            ["ECOG performance status", "ecog_status"],
            ["ADL score", "functional_adl_score"],
            ["ADL items", "functional_adl_items"],
            ["IADL score", "functional_iadl_score"],
            ["IADL items", "functional_iadl_items"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Systemic Inquiry", "systemicInquiry"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={7} title="Anthropometric Measures" icon={Activity}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Height", "height"],
            ["Weight", "weight"],
            ["BMI", "bmi"],
            ["BSA", "bsa"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Anthropometric Measurements", "anthropometricTable"],
            ["Other Anthropometric Measurements", "otherAnthropometricTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={8} title="Examination Findings" icon={Stethoscope}>
        <div className="space-y-5">
          <FieldGrid showEmpty={false} fields={patientFields(patient, [
            ["Examination findings", "exam_findings"],
            ["Systemic examination", "systemic_exam"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Examination Findings", "examFindingsTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={9} title="Provisional Diagnosis" icon={NotebookTabs}>
        <FieldGrid fields={patientFields(patient, [
          ["Provisional diagnosis", "provisional_diagnosis"],
          ["Diagnosis delay in days", "diagnosis_delay_days"],
        ])} />
      </DossierSection>

      <DossierSection number={10} title="Definitive Diagnosis" icon={FileCheck2}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Final diagnosis", "final_diagnosis"],
            ["Overall stage", "overall_stage"],
            ["TNM stage", "tnm_stage"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Definitive Diagnoses", "definitiveDiagnosisTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={11} title="Medical Investigations & Laboratory Audits" icon={FlaskConical}>
        <TableCollection patient={patient} tables={[
          ["Blood Investigations", "bloodTable"],
          ["Tumour Markers", "tumorMarkersTable"],
          ["Imaging", "imagingTable"],
          ["Endoscopy", "endoscopyTable"],
          ["Other Investigations", "otherInvTable"],
          ["Genetic Testing", "geneticTable"],
          ["Contrast Studies", "contrastTable"],
          ["Biopsy", "biopsyTable"],
          ["Immunohistochemistry", "immunohistochemistryTable"],
        ]} />
      </DossierSection>

      <DossierSection number={12} title="Tumour Characteristics" icon={Microscope}>
        <div className="space-y-5">
          <ClinicalRows title="Primary Cancer Sites" value={patient.tumorCharacteristicsTable} />
          {!asRows(patient.tumorCharacteristicsTable).some((row) => hasClinicalValue(row)) && (
            <FieldGrid showEmpty={false} fields={tumorLegacy} />
          )}
        </div>
      </DossierSection>

      <DossierSection number={13} title="Clinical Staging" icon={ScanLine}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Overall stage", "overall_stage"],
            ["TNM stage", "tnm_stage"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Staging Records", "stagingTable"],
            ["Clinical Staging", "clinicalStagingTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={14} title="Histology Grading Details" icon={Target}>
        <TableCollection patient={patient} tables={[
          ["Histology Grading", "histologyGradingTable"],
        ]} />
      </DossierSection>

      <DossierSection number={15} title="Adjuvant Therapy" icon={Syringe}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Neo-adjuvant chemotherapy status", "neo_chemo_status"],
            ["Adjuvant chemotherapy status", "adj_chemo_status"],
            ["Neo-adjuvant radiotherapy status", "neo_radio_status"],
            ["Adjuvant radiotherapy status", "adj_radio_status"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Adjuvant Therapy Plan", "adjuvantTherapyTable"],
            ["Neo-adjuvant Chemotherapy", "neoChemoTable"],
            ["Adjuvant Chemotherapy", "adjChemoTable"],
            ["Neo-adjuvant Radiotherapy", "neoRadioTable"],
            ["Adjuvant Radiotherapy", "adjRadioTable"],
            ["Clinical Problems", "problemTable"],
            ["Supportive Medication", "commonDrugsTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={16} title="Pre-Operative Assessment" icon={ShieldCheck}>
        <TableCollection patient={patient} tables={[
          ["Pre-Operative Assessments", "preOperativeAssessmentTable"],
        ]} />
      </DossierSection>

      <DossierSection number={17} title="Surgery Details" icon={Scissors}>
        <TableCollection patient={patient} tables={[
          ["Definitive Surgery Details", "definitiveSurgeryTable"],
          ["Other Surgical Records", "surgeryTable"],
        ]} />
      </DossierSection>

      <DossierSection number={18} title="Surgical Outcome Assessment" icon={ClipboardList}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["ICU admission required", "icu_done"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Surgical Outcomes", "treatmentOutcomeTable"],
            ["Complications", "complicationTable"],
            ["Monitoring", "monitoringTable"],
            ["ICU Admissions", "icuTable"],
            ["Ward Admissions", "wardTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={19} title="After Surgical Therapies" icon={Pill}>
        <TableCollection patient={patient} tables={[
          ["After Surgical Therapies", "afterSurgicalTherapiesTable"],
        ]} />
      </DossierSection>

      <DossierSection number={20} title="Follow-up & Prognosis" icon={HeartPulse}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Follow-up notes", "follow_up_notes"],
            ["General care notes", "general_notes"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["Follow-up & Prognosis Records", "followUpPrognosisTable"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={21} title="Oncological Outcome Assessment" icon={BedDouble}>
        <TableCollection patient={patient} tables={[
          ["Oncological Outcomes", "oncologicalOutcomeTable"],
        ]} />
      </DossierSection>

      <DossierSection number={22} title="AI Added Extra Parameters" icon={BrainCircuit}>
        <div className="space-y-5">
          <FieldGrid fields={patientFields(patient, [
            ["Extraction safety note", "extraction_safety_note"],
          ])} />
          <TableCollection patient={patient} tables={[
            ["AI Added Medical Information", "unmapped_medical_information"],
            ["Source File Summaries", "source_file_summaries"],
          ]} />
        </div>
      </DossierSection>

      <DossierSection number={23} title="Supplementary / Additional Details" icon={FilePlus2}>
        <div className="space-y-5">
          <TableCollection patient={patient} tables={[
            ["Supplementary Details", "supplementaryDetailsTable"],
          ]} />
          <FieldGrid fields={[
            { label: "Created at", value: patient.createdAt },
            { label: "Last updated", value: patient.updatedAt },
          ]} />
        </div>
      </DossierSection>
    </div>
  );
}
