/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, Fragment } from "react";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Download,
  Folder,
  FileText,
  Bot,
  Compass,
  Activity,
  User,
  Dna,
  Heart,
  Calendar,
  Stethoscope,
  Plus,
  Trash,
  ArrowRight,
  ShieldCheck,
  Building,
  Upload,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Eye,
  Clock,
  CheckCheck,
  ClipboardList,
  FileCheck2,
  Scissors,
  HeartPulse,
  BedDouble,
  Home
} from "lucide-react";
import { PatientRecord, DiskFile, DefinitiveDiagnosisEntry } from "../types";
import { notify } from "./AppDialog";
import { ChatMarkdown, ThinkingDots } from "./ChatMarkdown";
import { normalizeCase, normalizePatientData } from "../utils/normalizeCase";

interface PatientDetailsModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onEdit: (pat: PatientRecord) => void;
  onDelete: (id: string) => void;
  allExistingFiles: DiskFile[];
  onUploadFile: (file: { name: string; mimeType: string; size: number; patientId: string; contentBase64: string; extracted: boolean }) => Promise<any>;
}

const seededDefaults: Record<string, string> = {
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

const hasClinicalValue = (value: unknown, key = ""): boolean => {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return seededDefaults[key] !== trimmed;
  }
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some((item) => hasClinicalValue(item));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .some(([childKey, childValue]) => hasClinicalValue(childValue, childKey));
  }
  return true;
};

const clinicalLabel = (key: string) => {
  const abbreviations: Record<string, string> = {
    asa: "ASA",
    bclc: "BCLC",
    bmi: "BMI",
    bnp: "BNP",
    ckd: "CKD",
    crp: "CRP",
    ecg: "ECG",
    ecog: "ECOG",
    egfr: "eGFR",
    figo: "FIGO",
    hba1c: "HbA1c",
    hklc: "HKLC",
    hiv: "HIV",
    icu: "ICU",
    ihc: "IHC",
    inr: "INR",
    iss: "ISS",
    ki67: "Ki-67",
    mdt: "MDT",
    meld: "MELD",
    mpr: "MPR",
    ngs: "NGS",
    possum: "POSSUM",
    rcri: "RCRI",
    recist: "RECIST",
    riss: "R-ISS",
    tnm: "TNM",
    who: "WHO",
  };
  return key
    .split("_")
    .map((part) => abbreviations[part.toLowerCase()] || part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const displayClinicalValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value
      .filter((item) => hasClinicalValue(item))
      .map((item) => displayClinicalValue(item))
      .join("; ") || "—";
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key, childValue]) => hasClinicalValue(childValue, key))
      .map(([key, childValue]) => `${clinicalLabel(key)}: ${displayClinicalValue(childValue)}`)
      .join(", ") || "—";
  }
  return String(value);
};

const recordRows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value as Array<Record<string, unknown>> : [];

function StructuredClinicalSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<Record<string, unknown>> | undefined;
}) {
  const visibleRows = (rows || []).filter((row) => hasClinicalValue(row));
  if (visibleRows.length === 0) return null;

  return (
    <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-hidden shadow-xs">
      <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
        {title}
      </div>
      <div className="p-3 space-y-3">
        {visibleRows.map((row, rowIndex) => {
          const scalarEntries = Object.entries(row).filter(
            ([key, value]) => !Array.isArray(value) && hasClinicalValue(value, key)
          );
          const nestedEntries = Object.entries(row).filter(
            ([, value]) => Array.isArray(value) && hasClinicalValue(value)
          ) as Array<[string, unknown[]]>;
          const entryTitle =
            row.primary_cancer_site ||
            row.surgery_name ||
            row.grading_system ||
            row.staging_system ||
            row.therapy_type ||
            row.assessment_date ||
            `Entry ${rowIndex + 1}`;

          return (
            <div key={rowIndex} className="rounded-xl border border-natural-border/70 dark:border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50/70 dark:bg-slate-900/35 font-bold text-slate-700 dark:text-slate-200">
                {displayClinicalValue(entryTitle)}
              </div>
              {scalarEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-natural-border/60 dark:bg-slate-700">
                  {scalarEntries.map(([key, value]) => (
                    <div key={key} className="bg-theme-surface dark:bg-slate-850 p-2.5 min-w-0">
                      <div className="text-[9px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                        {clinicalLabel(key)}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                        {displayClinicalValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {nestedEntries.map(([key, nestedRows]) => {
                const visibleNestedRows = nestedRows.filter((nestedRow) => hasClinicalValue(nestedRow));
                if (visibleNestedRows.length === 0) return null;
                return (
                  <div key={key} className="border-t border-natural-border/70 dark:border-slate-700 p-3">
                    <div className="h-group mb-2 text-slate-600 dark:text-slate-300">{clinicalLabel(key)}</div>
                    <div className="space-y-2">
                      {visibleNestedRows.map((nestedRow, nestedIndex) => {
                        if (typeof nestedRow !== "object" || nestedRow === null) {
                          return (
                            <div key={nestedIndex} className="rounded-lg bg-slate-50/60 dark:bg-slate-900/30 p-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                              {displayClinicalValue(nestedRow)}
                            </div>
                          );
                        }
                        return (
                          <div key={nestedIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-lg bg-slate-50/60 dark:bg-slate-900/30 p-2">
                            {Object.entries(nestedRow as Record<string, unknown>)
                              .filter(([nestedKey, nestedValue]) => hasClinicalValue(nestedValue, nestedKey))
                              .map(([nestedKey, nestedValue]) => (
                                <div key={nestedKey} className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                    {clinicalLabel(nestedKey)}:
                                  </span>{" "}
                                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 break-words">
                                    {displayClinicalValue(nestedValue)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StructuredClinicalGroup({
  title,
  sections,
}: {
  title: string;
  sections: Array<{ title: string; rows: Array<Record<string, unknown>> }>;
}) {
  const visibleSections = sections.filter((section) => section.rows.some((row) => hasClinicalValue(row)));
  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <FileCheck2 className="h-4 w-4 text-natural-accent dark:text-natural-gold" />
        <h3 className="h-section">{title}</h3>
      </div>
      {visibleSections.map((section) => (
        <StructuredClinicalSection key={section.title} title={section.title} rows={section.rows} />
      ))}
    </div>
  );
}

export default function PatientDetailsModal({
  patient,
  onClose,
  onEdit,
  onDelete,
  allExistingFiles,
  onUploadFile
}: PatientDetailsModalProps) {

  const normalizedPatient = useMemo(() => normalizePatientData(patient), [patient]);

  const [activeTab, setActiveTab] = useState<"dossier" | "drive" | "chat">("dossier");
  
  // Chat agent states
  const [chatMessage, setChatMessage] = useState("");
  const [chatThread, setChatThread] = useState<Array<{ sender: "user" | "ai"; text: string; timestamp: string }>>([
    { 
      sender: "ai", 
      text: `Hello. I am your ASCO & NCCN clinical oncology advisor. I have analyzed the medical recordings of **${normalizedPatient.title ? `${normalizedPatient.title} ` : ""}${normalizedPatient.first_name} ${normalizedPatient.last_name}** (Primary Diagnosis: *${normalizedPatient.oncology}*, Stage: *${normalizedPatient.overall_stage || "N/A"}*). Ask any questions concerning clinical staging, chemotherapy options, or patient care guidelines.`, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Drive upload states
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread, chatLoading, activeTab]);

  // Virtual files specific to this oncology patient
  const patientFiles = allExistingFiles.filter(f => f.patientId === normalizedPatient.id);

  // Export JSON or CSV logic
  const handleExportJSON = () => {
    const serialized = JSON.stringify(patient, null, 2);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OncoDossier_${normalizedPatient.first_name || ""}_${normalizedPatient.last_name || ""}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Generate clean clinical CSV string
    const headers = ["Class", "RegID", "Initials", "First_Name", "Last_Name", "BHT", "Clinic", "Age", "Gender", "NIC", "Phone", "Oncology_Category", "Tumor_Stage", "Hospital", "Presenting_Complaints", "Comorbidity"];
    const row = [
      "Clinical Patient Dossier",
      normalizedPatient.auto_id || "",
      normalizedPatient.initials || "",
      normalizedPatient.first_name || "",
      normalizedPatient.last_name || "",
      normalizedPatient.bht || "",
      normalizedPatient.clinic || "",
      normalizedPatient.age || "",
      normalizedPatient.gender || "",
      normalizedPatient.nic || "",
      normalizedPatient.tp || "",
      normalizedPatient.oncology || "",
      normalizedPatient.overall_stage || "",
      normalizedPatient.hospital || "",
      (normalizedPatient.presenting_complaints || "").replace(/(\r\n|\n|\r)/gm, " "),
      (normalizedPatient.comorbidity || "").replace(/(\r\n|\n|\r)/gm, " ")
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), row.map(cell => `"${cell}"`).join(",")].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `OncoDossier_${normalizedPatient.first_name || ""}_${normalizedPatient.last_name || ""}.csv`;
    link.click();
  };

  // Upload custom file in detailed card to this patient's private drive subfolder!
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      setUploadProgress(12);
      setUploadStage("Preparing file for Drive vault");
      const file = files[0];
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          setUploadProgress(42);
          setUploadStage("Encoding and validating file");
          const base64 = reader.result as string;
          setUploadProgress(74);
          setUploadStage("Uploading to Google Drive subfolder");
          await onUploadFile({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            patientId: normalizedPatient.id,
            contentBase64: base64,
            extracted: false
          });
          setUploadProgress(100);
          setUploadStage("Upload complete");
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStage("");
          }, 650);
          await notify(`Document '${file.name}' saved to Google Drive subfolder successfully.`, "Upload Complete", "success");
        };
      } catch (err) {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage("");
        await notify("Upload failed.", "Upload Failed", "danger");
      }
    }
  };

  const UploadProgressBar = () => (
    <div className="mt-3 rounded-2xl border border-natural-border/70 dark:border-slate-700 bg-theme-surface/55 dark:bg-slate-900/55 p-3 shadow-inner w-full md:w-80">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full bg-natural-brown animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-250 truncate">{uploadStage || "Uploading to Drive"}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{uploadProgress}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-natural-hover dark:bg-slate-800 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-natural-brown via-natural-gold to-natural-brown"
          style={{ width: `${Math.max(5, Math.min(100, uploadProgress))}%` }}
        />
        <div className="theme-progress-shimmer absolute inset-0 animate-progress-shimmer" />
      </div>
    </div>
  );

  // Handle oncology guide chat advisor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userText = chatMessage;
    setChatMessage("");
    setChatThread(prev => [...prev, {
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setChatLoading(true);

    try {
      // Hit server endpoint for oncology assistance
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientRecord: patient,
          query: userText
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.reply || data.text;
        setChatThread(prev => [...prev, {
          sender: "ai",
          text: reply || "Diagnostic advisor returned an empty reply.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        let detail = "";
        try {
          const errBody = await response.json();
          detail = errBody?.error || errBody?.detail || "";
        } catch {}
        console.error("[/api/chat] non-OK", response.status, detail);
        setChatThread(prev => [...prev, {
          sender: "ai",
          text: `The oncology advisor could not be reached (HTTP ${response.status})${detail ? ": " + detail : ". Please retry or verify your Gemini API key in Settings."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err: any) {
      console.error("[/api/chat] fetch error:", err);
      setChatThread(prev => [...prev, {
        sender: "ai",
        text: `Error contacting the AI Clinical engine: ${err?.message || "network failure"}. Check your network and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="modal-pop min-h-[calc(100vh-4rem)]">
      <div className="glass-card rounded-2xl w-full min-h-[calc(100vh-6rem)] flex flex-col justify-between shadow-md relative overflow-hidden">
        
        {/* Header Ribbon details */}
        <div className="p-4 lg:p-5 border-b border-natural-border bg-theme-surface/20 dark:bg-theme-surface/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-natural-accent rounded-xl flex items-center justify-center text-theme-on-accent font-bold text-base shadow-sm">
              {normalizedPatient.last_name ? normalizedPatient.last_name[0] : normalizedPatient.first_name ? normalizedPatient.first_name[0] : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="value-display font-bold text-slate-800 dark:text-theme-on-accent text-base ">
                  {normalizedPatient.title ? `${normalizedPatient.title} ` : ""}{normalizedPatient.first_name} {normalizedPatient.last_name}
                </h3>
                <span className="text-[10px] bg-natural-accent/10 dark:bg-slate-900 text-natural-accent-dark dark:text-natural-hover px-2 py-0.5 rounded-md border border-natural-accent/30 dark:border-slate-700 font-semibold">
                  {normalizedPatient.auto_id || "PT-N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Download dataset buttons */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-natural-sidebar dark:bg-slate-705 dark:hover:bg-slate-650 text-slate-750 dark:text-slate-200 py-1.5 px-2.5 border border-natural-border/55 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Download clinical CSV"
            >
              <Download className="h-3.5 w-3.5 text-natural-brown" />
              <span className="hidden md:inline text-xs">CSV Export</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-natural-sidebar dark:bg-slate-705 dark:hover:bg-slate-650 text-slate-755 dark:text-slate-200 py-1.5 px-2.5 border border-natural-border/55 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Download standard JSON metadata"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-natural-accent" />
              <span className="hidden md:inline text-xs">JSON Export</span>
            </button>
            
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-natural-sidebar dark:bg-slate-700/80 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-205 py-1.5 px-2.5 rounded-lg transition border border-natural-border/55 text-xs font-bold"
              title="Back to records"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-natural-border dark:border-slate-700/80 bg-natural-card/60 dark:bg-slate-850 px-5 gap-1">
          <button
            onClick={() => setActiveTab("dossier")}
            title="Clinical Dossier"
            aria-label="Clinical Dossier"
            className={`flex items-center justify-center py-3 px-4 border-b-2 cursor-pointer transition-all ${
              activeTab === "dossier" 
                ? "border-natural-accent text-natural-accent dark:text-natural-gold" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            title="Google Drive Subfolder"
            aria-label="Google Drive Subfolder"
            className={`flex items-center justify-center gap-1.5 py-3 px-4 border-b-2 cursor-pointer transition-all ${
              activeTab === "drive" 
                ? "border-natural-accent text-natural-accent dark:text-natural-gold" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <Folder className="h-5 w-5" />
            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
              {patientFiles.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            title="AI Oncology Advisor"
            aria-label="AI Oncology Advisor"
            className={`flex items-center justify-center py-3 px-4 border-b-2 cursor-pointer transition-all ${
              activeTab === "chat" 
                ? "border-natural-accent text-natural-accent dark:text-natural-gold" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 p-5 text-xs text-slate-600 dark:text-slate-300">
          
          {/* TAB 1: DOSSIER */}
          {activeTab === "dossier" && (
            <div className="space-y-6">
              
              {/* Patient Core Demographics card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Visual Bio block */}
                <div className="bg-natural-card/40 dark:bg-slate-900/40 p-4 rounded-xl border border-natural-border dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="h-group mb-2 leading-none">Demographic Profile</h4>
                    <div className="space-y-1.5 leading-relaxed">
                      <p><span className="text-slate-655 dark:text-slate-350 font-semibold">Title Initials:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.title} {patient.initials}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Gender / Age:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.gender} • {patient.age || "N/A"} yrs</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">DOB Reference:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.dob || "N/A"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Marital Status:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.marital_status || "Single"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Occupation:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.occupation || "N/A"}</span></p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 border-t border-natural-border/50 pt-2 leading-none">
                    <User className="h-3.5 w-3.5 text-natural-accent dark:text-natural-accent" />
                    <span>Registered in Clinician Vault</span>
                  </div>
                </div>

                {/* Admission coordinates */}
                <div className="bg-natural-card/40 dark:bg-slate-900/40 p-4 rounded-xl border border-natural-border dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="h-group mb-2 leading-none">Admission Coordinates</h4>
                    <div className="space-y-1.5 leading-relaxed">
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">BHT Bed Ref:</span> <span className="value-display font-bold text-slate-800 dark:text-slate-100">{patient.bht || "N/A"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Clinic Code:</span> <span className="value-display font-bold text-slate-800 dark:text-slate-100">{patient.clinic || "N/A"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Town Area:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{patient.living_area || "N/A"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">NIC Card Number:</span> <span className="value-display font-bold text-slate-800 dark:text-slate-100">{patient.nic || "N/A"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-355 font-semibold">Secure Phone:</span> <span className="value-display font-bold text-slate-800 dark:text-slate-100">{patient.tp || "N/A"}</span></p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 border-t border-natural-border/50 pt-2 leading-none">
                    <Building className="h-3.5 w-3.5 text-natural-brown dark:text-natural-brown" />
                    <span>Admitting Site Registered</span>
                  </div>
                </div>

                {/* Diagnostics Stage */}
                <div className="bg-natural-card/40 dark:bg-slate-900/40 p-4 rounded-xl border border-natural-border dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="h-group mb-2 leading-none">Diagnostic Tumor Stage</h4>
                    <div className="space-y-1.5 leading-relaxed">
                      <p><span className="text-slate-655 dark:text-slate-350 font-semibold">Oncology Classes:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{(normalizedPatient.oncology_types && normalizedPatient.oncology_types.length > 0 ? normalizedPatient.oncology_types : [normalizedPatient.oncology || "Other"]).join(", ")}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-350 font-semibold">Other classification:</span> <span className="value-display font-semibold text-slate-800 dark:text-slate-100">{normalizedPatient.oncology_other || "None"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-350 font-bold">Overall Stage:</span> <span className="value-display font-bold text-xs leading-normal text-slate-800 dark:text-slate-100">{normalizedPatient.overall_stage || "Stage I-IV unset"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-350 font-bold">TNM Systems:</span> <span className="value-display font-bold leading-normal text-slate-800 dark:text-slate-100">{normalizedPatient.tnm_stage || "TNM Undesignated"}</span></p>
                      <p><span className="text-slate-655 dark:text-slate-350 font-semibold">Provisional Diag:</span> <span className="italic text-slate-700 dark:text-slate-300 truncate block max-w-full leading-normal animate-pulse" title={normalizedPatient.provisional_diagnosis}>{normalizedPatient.provisional_diagnosis || "N/A"}</span></p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 border-t border-natural-border/50 pt-2 leading-none">
                    <Dna className="h-3.5 w-3.5 text-rose-700 dark:text-rose-450 animate-pulse" />
                    <span>Pathological stage active</span>
                  </div>
                </div>

              </div>

              {/* Direct complaints section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div className="p-4 bg-natural-card/40 dark:bg-slate-900/20 border border-natural-border dark:border-slate-800 rounded-xl">
                  <h4 className="h-subsection mb-2">Direct symptoms / complaints</h4>
                  <p className="leading-relaxed bg-theme-surface dark:bg-slate-800/60 p-3 rounded-lg border border-natural-border/40 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {normalizedPatient.presenting_complaints || "No symptoms or active complaints recorded."}
                  </p>
                </div>

                <div className="p-4 bg-natural-card/40 dark:bg-slate-900/20 border border-natural-border dark:border-slate-800 rounded-xl">
                  <h4 className="h-subsection mb-2">Medical Comorbidities & Surgical History</h4>
                  <p className="leading-relaxed bg-theme-surface dark:bg-slate-800/60 p-3 rounded-lg border border-natural-border/40 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {normalizedPatient.comorbidity || "No prior comorbidity history recorded."}
                  </p>
                </div>
              </div>

              {/* Drug / Family / Social / Risk history tables */}
              {(() => {
                type Sec = {
                  key: string;
                  title: string;
                  accent: string;
                  customRender?: () => React.ReactNode;
                  rows?: Array<Record<string, any>>;
                  headers?: string[];
                  cols?: string[];
                };
                const sections: Sec[] = [
                  {
                    key: "drug",
                    title: "Drug History",
                    rows: normalizedPatient.drugTable || [],
                    headers: ["Drug Name", "Dose", "Frequency", "Duration", "Notes"],
                    cols: ["drug_name", "dose", "frequency", "duration", "notes"],
                    accent: "",
                  },
                  {
                    key: "family",
                    title: "Family History",
                    rows: normalizedPatient.familyTable || [],
                    headers: ["Comorbidity", "Relationship", "Notes"],
                    cols: ["comorbidity", "relationship", "family_notes"],
                    accent: "",
                  },
                  {
                    key: "social",
                    title: "Social History",
                    accent: "",
                    customRender: () => (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="h-table-col">
                            <th className="p-2.5">Substance</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Amounts / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300">
                          <tr className={normalizedPatient.smoking || normalizedPatient.smoking_amount ? "ai-priority-row" : ""}>
                            <td className="p-2.5 font-semibold">Smoking</td>
                            <td className={`p-2.5 ${normalizedPatient.smoking ? "ai-priority-text" : ""}`}>{normalizedPatient.smoking || "—"}</td>
                            <td className={`p-2.5 ${normalizedPatient.smoking_amount ? "ai-priority-text" : ""}`}>{normalizedPatient.smoking_amount || "—"}</td>
                          </tr>
                          <tr className={normalizedPatient.alcohol || normalizedPatient.alcohol_amount ? "ai-priority-row" : ""}>
                            <td className="p-2.5 font-semibold">Alcohol</td>
                            <td className={`p-2.5 ${normalizedPatient.alcohol ? "ai-priority-text" : ""}`}>{normalizedPatient.alcohol || "—"}</td>
                            <td className={`p-2.5 ${normalizedPatient.alcohol_amount ? "ai-priority-text" : ""}`}>{normalizedPatient.alcohol_amount || "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    ),
                  },
                  {
                    key: "risk",
                    title: "Other Risk Factors",
                    rows: normalizedPatient.riskTable || [],
                    headers: ["Risk Factor", "Notes"],
                    cols: ["risk_factor", "risk_notes"],
                    accent: "",
                  },
                ];
                return sections.map((sec) => {
                  const hasData = sec.customRender
                    ? Boolean(normalizedPatient.smoking || normalizedPatient.smoking_amount || normalizedPatient.alcohol || normalizedPatient.alcohol_amount)
                    : (sec.rows?.length ?? 0) > 0;
                  if (!hasData) return null;
                  return (
                    <div key={sec.key} className={`border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs ${sec.accent}`}>
                      <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                        {sec.title}
                      </div>
                      {sec.customRender ? (
                        sec.customRender()
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="h-table-col">
                              {(sec.headers ?? []).map((h, i) => (
                                <th key={i} className="p-2.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                            {(sec.rows ?? []).map((row, i) => {
                              const hasContent = (sec.cols ?? []).some((c) => row[c]);
                              return (
                                <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${hasContent ? "ai-priority-row" : ""}`}>
                                  {(sec.cols ?? []).map((c, j) => (
                                    <td key={j} className={`p-2.5 ${j === 0 ? "font-bold" : ""} ${c === "dose" || c === "duration" || c === "frequency" ? "" : ""} ${row[c] ? "ai-priority-text" : ""}`}>
                                      {row[c] || "—"}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Examination Findings (per-system table) */}
              {normalizedPatient.examFindingsTable && normalizedPatient.examFindingsTable.length > 0 && (
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    <span>Examination Findings</span>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Organ System</th>
                        <th className="p-2.5">Findings</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.examFindingsTable.flatMap((group: any) =>
                        group.entries.map((entry: any) => ({ date: group.date, ...entry }))
                      ).map((row: any, i: number) => (
                        <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.findings || row.notes ? "ai-priority-row" : ""}`}>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">{row.date || "—"}</td>
                          <td className={`p-2.5 font-bold ${row.organ_system ? "ai-priority-text" : ""}`}>{row.organ_system || "—"}</td>
                          <td className={`p-2.5 ${row.findings ? "ai-priority-text" : ""}`}>{row.findings || "—"}</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Provisional + Definitive Diagnosis tiles */}
              {(normalizedPatient.provisional_diagnosis || normalizedPatient.final_diagnosis) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {normalizedPatient.provisional_diagnosis && (
                    <div className="p-4 bg-natural-card dark:bg-slate-850 border border-natural-border dark:border-natural-border rounded-xl">
                      <h4 className="h-subsection text-slate-800 dark:text-theme-on-accent mb-2 flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Provisional Diagnosis
                      </h4>
                      <p className="leading-relaxed bg-theme-surface dark:bg-slate-800/60 p-3 rounded-lg border border-natural-border dark:border-natural-border text-slate-700 dark:text-slate-200">
                        {normalizedPatient.provisional_diagnosis}
                      </p>
                    </div>
                  )}
                  {normalizedPatient.final_diagnosis && (
                    <div className="p-4 bg-natural-card dark:bg-slate-850 border border-natural-border dark:border-natural-border rounded-xl">
                      <h4 className="h-subsection text-slate-800 dark:text-theme-on-accent mb-2 flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Definitive Diagnosis
                      </h4>
                      <p className="leading-relaxed bg-theme-surface dark:bg-slate-800/60 p-3 rounded-lg border border-natural-border dark:border-natural-border text-slate-700 dark:text-slate-200">
                        {normalizedPatient.final_diagnosis}
                      </p>
                      {normalizedPatient.diagnosis_delay_days && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-theme-surface dark:bg-slate-800/60 p-2 rounded-lg border border-natural-border dark:border-natural-border">
                          <Clock className="h-3 w-3" />
                          <span>Diagnosis delay: <strong>{normalizedPatient.diagnosis_delay_days} days</strong></span>
                        </div>
                      )}
                      {normalizedPatient.definitiveDiagnosisTable && normalizedPatient.definitiveDiagnosisTable.length > 0 && (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="h-table-col border-b border-natural-border dark:border-natural-border">
                                <th className="p-1.5 text-slate-600 dark:text-slate-300">Date</th>
                                <th className="p-1.5 text-slate-600 dark:text-slate-300">Diagnosis</th>
                                <th className="p-1.5 text-slate-600 dark:text-slate-300">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {normalizedPatient.definitiveDiagnosisTable.map((row: DefinitiveDiagnosisEntry, i: number) => (
                                <tr key={i} className="border-b border-natural-border/50 dark:border-natural-border/50">
                                  <td className="p-1.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.date}</td>
                                  <td className="p-1.5 text-slate-700 dark:text-slate-200">{row.diagnosis}</td>
                                  <td className="p-1.5 text-slate-700 dark:text-slate-200">{row.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Diagnostic tables display */}
              <div className="space-y-5">
                
                {/* Blood Panels */}
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    Blood Panels & Laboratory Records
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Marker Parameter</th>
                        <th className="p-2.5">Clinical Purpose</th>
                        <th className="p-2.5">Date Done</th>
                        <th className="p-2.5">Clinical findings</th>
                        <th className="p-2.5">General remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.bloodTable?.map((row, i) => (
                        <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.blood_findings ? "ai-priority-row" : ""}`}>
                          <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.blood_type ? "ai-priority-text" : ""}`}>{row.blood_type}</td>
                          <td className={`p-2.5 capitalize ${row.blood_purpose ? "ai-priority-text" : ""}`}>{row.blood_purpose}</td>
                          <td className={`p-2.5 text-slate-600 dark:text-slate-350 ${row.blood_date ? "ai-priority-text" : ""}`}>{row.blood_date || "N/A"}</td>
                          <td className={`p-2.5 font-semibold ${row.blood_findings ? "ai-priority-text" : ""}`}>{row.blood_findings}</td>
                          <td className="p-2.5 text-slate-505 dark:text-slate-400">{row.blood_notes || "None"}</td>
                        </tr>
                      ))}
                      {(!normalizedPatient.bloodTable || normalizedPatient.bloodTable.length === 0) && (
                        <tr><td colSpan={5} className="text-center py-4 text-slate-400 text-xs">No blood metrics recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tumor Markers */}
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    Tumor Markers (CEA / AFP / CA 19-9 / CA 125 / CA 15-3 / PSA / βhCG / LDH)
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Marker</th>
                        <th className="p-2.5">Value</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Reference</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.tumorMarkersTable?.map((row, i) => (
                        <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.marker_value || row.marker_name ? "ai-priority-row" : ""}`}>
                          <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.marker_name ? "ai-priority-text" : ""}`}>{row.marker_name}</td>
                          <td className={`p-2.5 font-semibold ${row.marker_value ? "ai-priority-text" : ""}`}>{row.marker_value}</td>
                          <td className={`p-2.5 ${row.marker_unit ? "ai-priority-text" : ""}`}>{row.marker_unit}</td>
                          <td className={`p-2.5 text-slate-500 ${row.marker_ref_range ? "ai-priority-text" : ""}`}>{row.marker_ref_range}</td>
                          <td className={`p-2.5 text-slate-600 dark:text-slate-350 ${row.marker_date ? "ai-priority-text" : ""}`}>{row.marker_date || "N/A"}</td>
                          <td className="p-2.5 text-slate-505 dark:text-slate-400">{row.marker_notes || "—"}</td>
                        </tr>
                      ))}
                      {(!normalizedPatient.tumorMarkersTable || normalizedPatient.tumorMarkersTable.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-4 text-slate-400 text-xs">No tumor markers recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Imaging study list */}
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    Imaging Modalities Findings (CT SCAN, MRI, PET, USS)
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Study Modality</th>
                        <th className="p-2.5">Clinical Purpose</th>
                        <th className="p-2.5">Target Site</th>
                        <th className="p-2.5">Imaging impression findings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.imagingTable?.map((row, i) => (
                        <Fragment key={i}>
                          <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.imaging_findings || row.mass_present ? "ai-priority-row" : ""}`}>
                            <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.imaging_type ? "ai-priority-text" : ""}`}>{row.imaging_type}</td>
                            <td className={`p-2.5 capitalize ${row.imaging_purpose ? "ai-priority-text" : ""}`}>{row.imaging_purpose}</td>
                            <td className={`p-2.5 font-semibold text-slate-800 dark:text-slate-200 ${row.imaging_parameter ? "ai-priority-text" : ""}`}>{row.imaging_parameter || "Not specified"}</td>
                            <td className={`p-2.5 text-slate-700 dark:text-slate-300 leading-relaxed ${row.imaging_findings ? "ai-priority-text" : ""}`}>{row.imaging_findings}</td>
                          </tr>
                          {(row.mass_present || row.mass_size || row.mass_location || row.calcifications || row.lymph_nodes || row.metastasis || row.ascites || row.pv_status || row.sma_status) && (
                            <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                              <td colSpan={4} className="p-2.5">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1 text-[10px]">
                                  {row.mass_present && (<div><span className="h-group text-slate-500 dark:text-slate-400">Mass: </span><span className="ai-priority-text font-bold">{row.mass_present}</span></div>)}
                                  {row.mass_size && (<div><span className="h-group text-slate-500 dark:text-slate-400">Size: </span><span className="ai-priority-text font-bold ">{row.mass_size}</span></div>)}
                                  {row.mass_location && (<div><span className="h-group text-slate-500 dark:text-slate-400">Location: </span><span className="ai-priority-text font-bold">{row.mass_location}</span></div>)}
                                  {row.calcifications && (<div><span className="h-group text-slate-500 dark:text-slate-400">Calc: </span><span className="ai-priority-text font-bold">{row.calcifications}</span></div>)}
                                  {row.lymph_nodes && (<div><span className="h-group text-slate-500 dark:text-slate-400">LN: </span><span className="ai-priority-text font-bold">{row.lymph_nodes}</span></div>)}
                                  {row.metastasis && (<div><span className="h-group text-slate-500 dark:text-slate-400">Mets: </span><span className="ai-priority-text font-bold">{row.metastasis}</span></div>)}
                                  {row.ascites && (<div><span className="h-group text-slate-500 dark:text-slate-400">Ascites: </span><span className="ai-priority-text font-bold">{row.ascites}</span></div>)}
                                  {row.pv_status && (<div><span className="h-group text-slate-500 dark:text-slate-400">PV: </span><span className="ai-priority-text font-bold">{row.pv_status}</span></div>)}
                                  {row.sma_status && (<div><span className="h-group text-slate-500 dark:text-slate-400">SMA: </span><span className="ai-priority-text font-bold">{row.sma_status}</span></div>)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                      {(!normalizedPatient.imagingTable || normalizedPatient.imagingTable.length === 0) && (
                        <tr><td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No scan diagnostics recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Biopsy Histology Tissue */}
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    Tissue Biopsy Histology Pathology Report
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Biopsy Modality</th>
                        <th className="p-2.5">Anatomical Site</th>
                        <th className="p-2.5">Tumor Grade / Findings</th>
                        <th className="p-2.5">Histology Subtype / Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.biopsyTable?.map((row, i) => (
                        <Fragment key={i}>
                          <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.biopsy_findings || row.cell_type || row.margin_status ? "ai-priority-row" : ""}`}>
                            <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.biopsy_type ? "ai-priority-text" : ""}`}>{row.biopsy_type}</td>
                            <td className={`p-2.5 font-semibold text-slate-655 dark:text-slate-350 ${row.biopsy_parameter ? "ai-priority-text" : ""}`}>{row.biopsy_parameter || "N/A"}</td>
                            <td className={`p-2.5 font-semibold text-slate-800 dark:text-slate-200 ${row.biopsy_findings ? "ai-priority-text" : ""}`}>{row.biopsy_findings}</td>
                            <td className={`p-2.5 font-semibold ${row.biopsy_stage ? "ai-priority-text" : ""}`}>{row.biopsy_stage}</td>
                          </tr>
                          {(row.cell_type || row.margin_status || row.lvi || row.perineural_invasion || row.metastasis || row.lymph_nodes) && (
                            <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                              <td colSpan={4} className="p-2.5">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px]">
                                  {row.cell_type && (<div><span className="h-group text-slate-500 dark:text-slate-400">Cell Type: </span><span className="ai-priority-text font-bold">{row.cell_type}</span></div>)}
                                  {row.margin_status && (<div><span className="h-group text-slate-500 dark:text-slate-400">Margins: </span><span className="ai-priority-text font-bold">{row.margin_status}</span></div>)}
                                  {row.lvi && (<div><span className="h-group text-slate-500 dark:text-slate-400">LVI: </span><span className="ai-priority-text font-bold">{row.lvi}</span></div>)}
                                  {row.perineural_invasion && (<div><span className="h-group text-slate-500 dark:text-slate-400">Perineural: </span><span className="ai-priority-text font-bold">{row.perineural_invasion}</span></div>)}
                                  {row.metastasis && (<div><span className="h-group text-slate-500 dark:text-slate-400">Metastasis: </span><span className="ai-priority-text font-bold">{row.metastasis}</span></div>)}
                                  {row.lymph_nodes && (<div><span className="h-group text-slate-500 dark:text-slate-400">Lymph Nodes: </span><span className="ai-priority-text font-bold">{row.lymph_nodes}</span></div>)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                      {(!normalizedPatient.biopsyTable || normalizedPatient.biopsyTable.length === 0) && (
                        <tr><td colSpan={4} className="text-center py-4 text-slate-400 text-xs">No histology tissues reported.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Immunohistochemistry (IHC) Stains */}
                <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                  <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                    Immunohistochemistry (IHC) Stains Panel
                  </div>
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="h-table-col">
                        <th className="p-2.5">Marker (Stain)</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Intensity</th>
                        <th className="p-2.5">% Cells</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Pattern</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                      {normalizedPatient.immunohistochemistryTable?.map((row, i) => (
                        <Fragment key={i}>
                          <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.ihc_marker || row.ihc_interpretation ? "ai-priority-row" : ""}`}>
                            <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.ihc_marker ? "ai-priority-text" : ""}`}>{row.ihc_marker}</td>
                            <td className={`p-2.5 ${row.ihc_result ? "ai-priority-text font-bold" : ""}`}>{row.ihc_result || "—"}</td>
                            <td className={`p-2.5 ${row.ihc_intensity ? "ai-priority-text font-bold" : ""}`}>{row.ihc_intensity || "—"}</td>
                            <td className={`p-2.5 ${row.ihc_percentage ? "ai-priority-text font-bold" : ""}`}>{row.ihc_percentage || "—"}</td>
                            <td className={`p-2.5 ${row.ihc_score ? "ai-priority-text font-bold" : ""}`}>{row.ihc_score || "—"}</td>
                            <td className={`p-2.5 ${row.ihc_pattern ? "ai-priority-text" : ""}`}>{row.ihc_pattern || "—"}</td>
                          </tr>
                          {(row.ihc_panel || row.ihc_method || row.ihc_date || row.ihc_specimen || row.ihc_interpretation || row.ihc_lab || row.ihc_pathologist || row.ihc_notes) && (
                            <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                              <td colSpan={6} className="p-2.5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[10px]">
                                  {row.ihc_panel && (<div><span className="h-group text-slate-500 dark:text-slate-400">Panel: </span><span className="ai-priority-text font-bold">{row.ihc_panel}</span></div>)}
                                  {row.ihc_method && (<div><span className="h-group text-slate-500 dark:text-slate-400">Method: </span><span className="ai-priority-text font-bold">{row.ihc_method}</span></div>)}
                                  {row.ihc_date && (<div><span className="h-group text-slate-500 dark:text-slate-400">Date: </span><span className="ai-priority-text ">{row.ihc_date}</span></div>)}
                                  {row.ihc_specimen && (<div><span className="h-group text-slate-500 dark:text-slate-400">Specimen: </span><span className="ai-priority-text">{row.ihc_specimen}</span></div>)}
                                  {row.ihc_interpretation && (<div className="col-span-2"><span className="h-group text-slate-500 dark:text-slate-400">Interpretation: </span><span className="ai-priority-text font-bold">{row.ihc_interpretation}</span></div>)}
                                  {row.ihc_lab && (<div><span className="h-group text-slate-500 dark:text-slate-400">Lab: </span><span className="ai-priority-text">{row.ihc_lab}</span></div>)}
                                  {row.ihc_pathologist && (<div><span className="h-group text-slate-500 dark:text-slate-400">Pathologist: </span><span className="ai-priority-text">{row.ihc_pathologist}</span></div>)}
                                  {row.ihc_notes && (<div className="col-span-2 md:col-span-4"><span className="h-group text-slate-500 dark:text-slate-400">Notes: </span><span className="ai-priority-text">{row.ihc_notes}</span></div>)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                      {(!normalizedPatient.immunohistochemistryTable || normalizedPatient.immunohistochemistryTable.length === 0) && (
                        <tr><td colSpan={6} className="text-center py-4 text-slate-400 text-xs">No IHC stains recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <StructuredClinicalGroup
                  title="Clinical History & Functional Assessment"
                  sections={[
                    {
                      title: "Clinical Assessment Summary",
                      rows: [{
                        charlson_index: normalizedPatient.charlson_index,
                        charlson_conditions: normalizedPatient.charlson_conditions,
                        hospital_admissions: normalizedPatient.hospital_admissions,
                        ecog_status: normalizedPatient.ecog_status,
                        functional_adl_score: normalizedPatient.functional_adl_score,
                        functional_adl_items: normalizedPatient.functional_adl_items,
                        functional_iadl_score: normalizedPatient.functional_iadl_score,
                        functional_iadl_items: normalizedPatient.functional_iadl_items,
                        allergy_food: normalizedPatient.allergy_food,
                        allergy_drugs: normalizedPatient.allergy_drugs,
                        allergy_plasters: normalizedPatient.allergy_plasters,
                        allergy_other: normalizedPatient.allergy_other,
                      }],
                    },
                    { title: "Presenting Complaints Timeline", rows: recordRows(normalizedPatient.presentingComplaintsTable) },
                    { title: "Past Medical History", rows: recordRows(normalizedPatient.pastMedicalTable) },
                    { title: "Past Surgical History", rows: recordRows(normalizedPatient.pastSurgicalTable) },
                    { title: "Prior Chemotherapy", rows: recordRows(normalizedPatient.priorChemoTable) },
                    { title: "Prior Radiotherapy", rows: recordRows(normalizedPatient.priorRadioTable) },
                    { title: "Prior Immunotherapy", rows: recordRows(normalizedPatient.priorImmunoTable) },
                    { title: "Prior Hormonal Therapy", rows: recordRows(normalizedPatient.priorHormoneTable) },
                    { title: "Prior Targeted Therapy", rows: recordRows(normalizedPatient.priorTargetedTable) },
                    { title: "Systemic Inquiry", rows: recordRows(normalizedPatient.systemicInquiry) },
                    { title: "Anthropometric Measurements", rows: recordRows(normalizedPatient.anthropometricTable) },
                    { title: "Other Anthropometric Measurements", rows: recordRows(normalizedPatient.otherAnthropometricTable) },
                  ]}
                />

                <StructuredClinicalGroup
                  title="Extended Investigations"
                  sections={[
                    { title: "Endoscopy", rows: recordRows(normalizedPatient.endoscopyTable) },
                    { title: "Other Investigations", rows: recordRows(normalizedPatient.otherInvTable) },
                    { title: "Genetic & Molecular Testing", rows: recordRows(normalizedPatient.geneticTable) },
                    { title: "Contrast Studies", rows: recordRows(normalizedPatient.contrastTable) },
                    { title: "Additional Staging Records", rows: recordRows(normalizedPatient.stagingTable) },
                  ]}
                />

                <StructuredClinicalGroup
                  title="Tumour Characteristics, Staging & Grading"
                  sections={[
                    { title: "Tumour Characteristics by Primary Cancer Site", rows: recordRows(normalizedPatient.tumorCharacteristicsTable) },
                    { title: "Clinical & Pathological Staging", rows: recordRows(normalizedPatient.clinicalStagingTable) },
                    { title: "Histology & Grading", rows: recordRows(normalizedPatient.histologyGradingTable) },
                  ]}
                />

                <StructuredClinicalGroup
                  title="Surgical Assessment, Outcomes & Prognosis"
                  sections={[
                    { title: "Adjuvant Therapy", rows: recordRows(normalizedPatient.adjuvantTherapyTable) },
                    { title: "Pre-Operative Assessment", rows: recordRows(normalizedPatient.preOperativeAssessmentTable) },
                    { title: "Definitive Surgery", rows: recordRows(normalizedPatient.definitiveSurgeryTable) },
                    { title: "Surgical Outcome Assessment", rows: recordRows(normalizedPatient.treatmentOutcomeTable) },
                    { title: "After-Surgical Therapies", rows: recordRows(normalizedPatient.afterSurgicalTherapiesTable) },
                    { title: "Follow-up & Prognosis", rows: recordRows(normalizedPatient.followUpPrognosisTable) },
                    { title: "Oncological Outcome", rows: recordRows(normalizedPatient.oncologicalOutcomeTable) },
                  ]}
                />

                <StructuredClinicalGroup
                  title="Care Plan & Preserved Clinical Data"
                  sections={[
                    { title: "Problems & Management Plans", rows: recordRows(normalizedPatient.problemTable) },
                    { title: "Supportive & Common Medications", rows: recordRows(normalizedPatient.commonDrugsTable) },
                    { title: "Unmapped Medical Information", rows: recordRows(normalizedPatient.unmapped_medical_information) },
                    { title: "Source File Clinical Summaries", rows: recordRows(normalizedPatient.source_file_summaries) },
                  ]}
                />

                {/* Supplementary / Additional Details (grouped by heading) */}
                {normalizedPatient.supplementaryDetailsTable && normalizedPatient.supplementaryDetailsTable.length > 0 && (() => {
                  const grouped: Record<string, typeof normalizedPatient.supplementaryDetailsTable> = {};
                  normalizedPatient.supplementaryDetailsTable.forEach((d) => {
                    const h = d.detail_heading?.trim() || "Miscellaneous";
                    if (!grouped[h]) grouped[h] = [];
                    grouped[h].push(d);
                  });
                  const headingOrder = Object.keys(grouped);
                  const priorityBadge = (p: string) => {
                    const v = (p || "").toLowerCase();
                    if (v === "high") return <span className="eyebrow ml-2 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">High</span>;
                    if (v === "medium") return <span className="eyebrow ml-2 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Medium</span>;
                    if (v === "low") return <span className="eyebrow ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Low</span>;
                    return null;
                  };
                  return (
                    <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                      <div className="p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                        Supplementary / Additional Details
                      </div>
                      <div className="p-3 space-y-3">
                        {headingOrder.map((heading) => {
                          const rows = grouped[heading];
                          const subGrouped: Record<string, typeof rows> = {};
                          rows.forEach((r) => {
                            const sh = r.detail_subheading?.trim() || "";
                            if (!subGrouped[sh]) subGrouped[sh] = [];
                            subGrouped[sh].push(r);
                          });
                          const subKeys = Object.keys(subGrouped);
                          return (
                            <div key={heading} className="border border-natural-border dark:border-slate-800 rounded-lg overflow-hidden">
                              <div className="h-group px-3 py-1.5 bg-natural-card dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border-b border-natural-border dark:border-slate-800">
                                {heading} <span className="text-slate-400 ">({rows.length} {rows.length === 1 ? "cell" : "cells"})</span>
                              </div>
                              {subKeys.map((sub) => (
                                <div key={sub} className="border-b border-natural-border/60 dark:border-slate-800/60 last:border-b-0">
                                  {sub && (
                                    <div className="h-group px-4 py-1 text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-900/20">
                                      {sub}
                                    </div>
                                  )}
                                  <table className="w-full text-left text-xs">
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                      {subGrouped[sub].map((r, i) => (
                                        <tr key={i} className={r.detail_value || r.detail_label ? "ai-priority-row" : ""}>
                                          <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 w-1/3 align-top">
                                            <span className={r.detail_label ? "ai-priority-text" : ""}>{r.detail_label || "—"}</span>
                                            {priorityBadge(r.detail_priority)}
                                          </td>
                                          <td className="px-3 py-1.5 align-top">
                                            <span className={r.detail_value ? "ai-priority-text font-bold" : ""}>{r.detail_value || "—"}</span>
                                            {r.detail_unit && <span className="ml-1 text-slate-500 ">{r.detail_unit}</span>}
                                            {(r.detail_date || r.detail_category || r.detail_source || r.detail_notes) && (
                                              <div className="text-[10px] text-slate-500 mt-0.5 space-x-2">
                                                {r.detail_date && <span className="">{r.detail_date}</span>}
                                                {r.detail_category && <span className="eyebrow">{r.detail_category}</span>}
                                                {r.detail_source && <span className="italic">— {r.detail_source}</span>}
                                                {r.detail_notes && <span className="block mt-0.5 normal-case">{r.detail_notes}</span>}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 4 systemic + local-therapy sections: Neo-Chemo, Adj-Chemo, Neo-Radio, Adj-Radio */}
                {([
                  {
                    key: "neoChemo",
                    title: "Neo-Adjuvant Chemotherapy",
                    status: normalizedPatient.neo_chemo_status,
                    rows: normalizedPatient.neoChemoTable || [],
                    accent: "",
                    chip: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/60",
                    headers: ["Protocol Drug", "Dosage", "Frequency", "Route / Approach", "Total Cycles", "Adverse Effects"],
                    cols: ["neo_chemo_drug", "neo_chemo_dose", "neo_chemo_freq", "neo_chemo_route", "neo_chemo_cycles", "neo_chemo_effects"],
                  },
                  {
                    key: "adjChemo",
                    title: "Adjuvant Chemotherapy",
                    status: normalizedPatient.adj_chemo_status,
                    rows: normalizedPatient.adjChemoTable || [],
                    accent: "",
                    chip: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60",
                    headers: ["Protocol Drug", "Dosage", "Frequency", "Route / Approach", "Total Cycles", "Adverse Effects"],
                    cols: ["neo_chemo_drug", "neo_chemo_dose", "neo_chemo_freq", "neo_chemo_route", "neo_chemo_cycles", "neo_chemo_effects"],
                  },
                  {
                    key: "neoRadio",
                    title: "Neo-Adjuvant Radiotherapy",
                    status: normalizedPatient.neo_radio_status,
                    rows: normalizedPatient.neoRadioTable || [],
                    accent: "",
                    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60",
                    headers: ["Target Site", "Dosage (Gy)", "Delivery System", "Frequency", "Fractions", "Side Effects"],
                    cols: ["neo_radio_comp", "neo_radio_dose", "neo_radio_route", "neo_radio_freq", "neo_radio_cycles", "neo_radio_effects"],
                  },
                  {
                    key: "adjRadio",
                    title: "Adjuvant Radiotherapy",
                    status: normalizedPatient.adj_radio_status,
                    rows: normalizedPatient.adjRadioTable || [],
                    accent: "",
                    chip: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
                    headers: ["Target Site", "Dosage (Gy)", "Delivery System", "Frequency", "Fractions", "Side Effects"],
                    cols: ["neo_radio_comp", "neo_radio_dose", "neo_radio_route", "neo_radio_freq", "neo_radio_cycles", "neo_radio_effects"],
                  },
                ] as const).map((sec) => {
                  const hasData = sec.rows.length > 0;
                  if (!sec.status && !hasData) return null;
                  const statusLabel = sec.status || "Not recorded";
                  return (
                    <div key={sec.key} className={`border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs ${sec.accent}`}>
                      <div className="p-3 bg-natural-card dark:bg-slate-850 border-b border-natural-border dark:border-natural-border flex items-center justify-between gap-2">
                        <span className="h-subsection">
                          {sec.title}
                        </span>
                        <span className={`eyebrow px-2 py-0.5 rounded-md border ${sec.chip}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {hasData ? (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="h-table-col">
                              {sec.headers.map((h, i) => (
                                <th key={i} className="p-2.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                            {sec.rows.map((row, i) => {
                              const hasContent = (sec.cols as readonly string[]).some((c) => (row as any)[c]);
                              return (
                                <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${hasContent ? "ai-priority-row" : ""}`}>
                                  {sec.cols.map((c, j) => {
                                    const v = (row as any)[c];
                                    const isDose = c.endsWith("_dose") || c.endsWith("_cycles");
                                    const isDrug = c.endsWith("_drug") || c.endsWith("_comp");
                                    return (
                                      <td
                                        key={j}
                                        className={`p-2.5 ${isDrug ? "font-bold text-slate-755 dark:text-slate-205" : ""} ${isDose ? "font-semibold" : ""} ${v ? "ai-priority-text" : ""}`}
                                      >
                                        {v || (c.endsWith("_effects") ? "None" : "—")}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          {sec.status === "Not done" ? "Marked as not done; no rows recorded." : "Status set, no drugs/protocols logged yet."}
                        </div>
                      )}
                    </div>
                  );
                })}


                {/* Surgical Procedures (5 sub-blocks) */}
                {(normalizedPatient.surgeryTable?.length || 0) +
                  (normalizedPatient.complicationTable?.length || 0) +
                  (normalizedPatient.monitoringTable?.length || 0) +
                  (normalizedPatient.icuTable?.length || 0) +
                  (normalizedPatient.wardTable?.length || 0) +
                  (normalizedPatient.icu_done ? 1 : 0) > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-7 w-7 rounded-lg bg-rose-500/10 dark:bg-rose-400/20 text-rose-700 dark:text-rose-200 flex items-center justify-center text-sm font-bold ">Sx</div>
                      <h3 className="h-section">Surgical Procedures</h3>
                    </div>

                    {/* 1: Procedure */}
                    {normalizedPatient.surgeryTable && normalizedPatient.surgeryTable.length > 0 && (
                      <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                        <div className="flex items-center gap-2 p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                          <Scissors className="h-3.5 w-3.5 text-blue-600" />
                          Procedure
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="h-table-col">
                                <th className="p-2.5">Surgery</th>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5">Site</th>
                                <th className="p-2.5">Approach</th>
                                <th className="p-2.5">Surgical findings</th>
                                <th className="p-2.5">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                              {normalizedPatient.surgeryTable.map((row, i) => (
                                <Fragment key={i}>
                                  <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.surgery_findings || row.drain_status || row.drain_volume ? "ai-priority-row" : ""}`}>
                                    <td className={`p-2.5 font-bold text-slate-755 dark:text-slate-205 ${row.surgery_name ? "ai-priority-text" : ""}`}>{row.surgery_name}</td>
                                    <td className={`p-2.5 ${row.surgery_date ? "ai-priority-text" : ""}`}>{row.surgery_date || "N/A"}</td>
                                    <td className={`p-2.5 font-semibold ${row.surgery_site ? "ai-priority-text" : ""}`}>{row.surgery_site}</td>
                                    <td className={`p-2.5 ${row.surgery_approach ? "ai-priority-text" : ""}`}>{row.surgery_approach || "—"}</td>
                                    <td className={`p-2.5 text-slate-700 dark:text-slate-300 leading-relaxed ${row.surgery_findings ? "ai-priority-text" : ""}`}>{row.surgery_findings}</td>
                                    <td className={`p-2.5 ${row.surgery_notes ? "ai-priority-text" : ""}`}>{row.surgery_notes || "—"}</td>
                                  </tr>
                                  {(row.drain_status || row.drain_volume) && (
                                    <tr className="bg-blue-50/30 dark:bg-blue-950/10">
                                      <td colSpan={6} className="p-2.5">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[10px]">
                                          {row.drain_status && (<div><span className="h-group text-slate-500 dark:text-slate-400"><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 mr-1 align-middle" />Drain: </span><span className="ai-priority-text font-bold">{row.drain_status}</span></div>)}
                                          {row.drain_volume && (<div><span className="h-group text-slate-500 dark:text-slate-400">Volume: </span><span className="ai-priority-text font-bold ">{row.drain_volume}</span></div>)}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 2: Post op complications */}
                    {normalizedPatient.complicationTable && normalizedPatient.complicationTable.length > 0 && (
                      <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                        <div className="flex items-center gap-2 p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                          <Activity className="h-3.5 w-3.5 text-rose-500" />
                          Post op complications
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="h-table-col">
                                <th className="p-2.5">Complication</th>
                                <th className="p-2.5">Post Op Duration</th>
                                <th className="p-2.5">Management</th>
                                <th className="p-2.5">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                              {normalizedPatient.complicationTable.map((row, i) => (
                                <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.complication ? "ai-priority-row" : ""}`}>
                                   <td className={`p-2.5 font-bold ${row.complication ? "ai-priority-text" : ""}`}>{row.complication}</td>
                                  <td className={`p-2.5 ${row.post_op_duration ? "ai-priority-text" : ""}`}>{row.post_op_duration || "—"}</td>
                                  <td className={`p-2.5 ${row.management ? "ai-priority-text" : ""}`}>{row.management || "—"}</td>
                                  <td className={`p-2.5 ${row.notes ? "ai-priority-text" : ""}`}>{row.notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 3: Post op monitoring */}
                    {normalizedPatient.monitoringTable && normalizedPatient.monitoringTable.length > 0 && (
                      <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                        <div className="flex items-center gap-2 p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                          <HeartPulse className="h-3.5 w-3.5 text-amber-500" />
                          Post op monitoring
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="h-table-col">
                                <th className="p-2.5">Parameter</th>
                                <th className="p-2.5">Post Op Duration</th>
                                <th className="p-2.5">Findings</th>
                                <th className="p-2.5">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                              {normalizedPatient.monitoringTable.map((row, i) => (
                                <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.monitor_param ? "ai-priority-row" : ""}`}>
                                  <td className={`p-2.5 font-bold ${row.monitor_param ? "ai-priority-text" : ""}`}>{row.monitor_param}</td>
                                  <td className={`p-2.5 ${row.monitor_duration ? "ai-priority-text" : ""}`}>{row.monitor_duration || "—"}</td>
                                  <td className={`p-2.5 ${row.monitor_findings ? "ai-priority-text" : ""}`}>{row.monitor_findings || "—"}</td>
                                  <td className={`p-2.5 ${row.monitor_notes ? "ai-priority-text" : ""}`}>{row.monitor_notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 4: ICU Admission */}
                    {((normalizedPatient.icu_done && normalizedPatient.icu_done !== "Not done") || (normalizedPatient.icuTable && normalizedPatient.icuTable.length > 0)) && (
                      <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                        <div className="flex items-center justify-between gap-2 p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-3.5 w-3.5 text-violet-500" />
                            ICU Admission after surgery
                          </div>
                          {normalizedPatient.icu_done && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${normalizedPatient.icu_done === "Done" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {normalizedPatient.icu_done}
                            </span>
                          )}
                        </div>
                        {normalizedPatient.icuTable && normalizedPatient.icuTable.length > 0 && (
                          <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                              <thead>
                                <tr className="h-table-col">
                                  <th className="p-2.5">ICU Admission Date</th>
                                  <th className="p-2.5">Stay days count</th>
                                  <th className="p-2.5">Managements</th>
                                  <th className="p-2.5">Exit Date</th>
                                  <th className="p-2.5">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                                {normalizedPatient.icuTable.map((row, i) => (
                                  <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.icu_date ? "ai-priority-row" : ""}`}>
                                    <td className={`p-2.5 ${row.icu_date ? "ai-priority-text" : ""}`}>{row.icu_date || "—"}</td>
                                    <td className={`p-2.5 ${row.icu_stay ? "ai-priority-text" : ""}`}>{row.icu_stay || "—"}</td>
                                    <td className={`p-2.5 ${row.icu_mgmt ? "ai-priority-text" : ""}`}>{row.icu_mgmt || "—"}</td>
                                    <td className={`p-2.5 ${row.icu_exit ? "ai-priority-text" : ""}`}>{row.icu_exit || "—"}</td>
                                    <td className={`p-2.5 ${row.icu_notes ? "ai-priority-text" : ""}`}>{row.icu_notes || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5: Ward admission details */}
                    {normalizedPatient.wardTable && normalizedPatient.wardTable.length > 0 && (
                      <div className="border border-natural-border dark:border-natural-border rounded-xl overflow-x-auto shadow-xs">
                        <div className="flex items-center gap-2 p-3 bg-natural-card dark:bg-slate-850 h-subsection border-b border-natural-border dark:border-natural-border text-slate-800 dark:text-theme-on-accent">
                          <Home className="h-3.5 w-3.5 text-emerald-500" />
                          Ward admission details after surgery / ICU
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="h-table-col">
                                <th className="p-2.5">Ward entry date</th>
                                <th className="p-2.5">Stay days count</th>
                                <th className="p-2.5">Ward management details</th>
                                <th className="p-2.5">Exit Date</th>
                                <th className="p-2.5">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs text-slate-755 dark:text-slate-300 leading-relaxed">
                              {normalizedPatient.wardTable.map((row, i) => (
                                <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 ${row.ward_entry ? "ai-priority-row" : ""}`}>
                                  <td className={`p-2.5 ${row.ward_entry ? "ai-priority-text" : ""}`}>{row.ward_entry || "—"}</td>
                                  <td className={`p-2.5 ${row.ward_stay ? "ai-priority-text" : ""}`}>{row.ward_stay || "—"}</td>
                                  <td className={`p-2.5 ${row.ward_mgmt ? "ai-priority-text" : ""}`}>{row.ward_mgmt || "—"}</td>
                                  <td className={`p-2.5 ${row.ward_exit ? "ai-priority-text" : ""}`}>{row.ward_exit || "—"}</td>
                                  <td className={`p-2.5 ${row.ward_notes ? "ai-priority-text" : ""}`}>{row.ward_notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Patient care notes footer */}
              <div className="bg-natural-card dark:bg-slate-850 p-4 rounded-xl border border-natural-border dark:border-slate-800">
                <h4 className="h-group mb-1">Follow-up Directions & General Care Notes</h4>
                <p className="leading-relaxed whitespace-pre-wrap">{normalizedPatient.follow_up_notes || "No outstanding follow-up schedules added."}</p>
                {normalizedPatient.general_notes && (
                  <p className="mt-2 text-slate-500 select-all border-t border-natural-border/50 dark:border-slate-800 pt-2 text-[11px] leading-relaxed italic">
                    Performance Status / Vitals: {normalizedPatient.general_notes}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE FILES */}
          {activeTab === "drive" && (
            <div className="space-y-6">
              
              {/* Folder metadata card */}
              <div className="bg-natural-card dark:bg-slate-900/40 p-5 rounded-2xl border border-natural-border dark:border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-natural-accent/10 dark:bg-natural-accent/20 text-natural-accent rounded-xl flex items-center justify-center border border-natural-accent/30 flex-shrink-0">
                    <Folder className="h-6 w-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-150 dark:text-theme-on-accent text-sm">Patient Specific Documents subfolder</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      This folder exists private on Google Drive inside parent clinical vault directory, renamed as the patient last name. All AI clinical extractions and uploads are persisted securely.
                    </p>
                  </div>
                </div>

                {/* Upload attachment */}
                <div className="self-stretch md:self-center flex flex-col items-stretch md:items-end">
                  <input
                    type="file"
                    ref={fileInputRef2}
                    onChange={handleManualUpload}
                    className="hidden"
                    accept=".pdf,.csv,.json,.xlsx,.xls,.doc,.docx,.ppt,.pptx,image/*"
                  />
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 bg-natural-accent hover:bg-natural-accent active:bg-natural-accent-dark text-theme-on-accent font-bold text-xs py-2 px-4 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 select-none transition"
                  >
                    {isUploading ? (
                      <>
                        <Bot className="h-3.5 w-3.5 animate-spin" />
                        <span>Uploading File...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload File to Drive</span>
                      </>
                    )}
	                  </button>
	                  {isUploading && <UploadProgressBar />}
	                </div>
	              </div>

              {/* Workspace directory tree layout */}
              <div className="bg-theme-surface dark:bg-slate-850 border border-natural-border dark:border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-[10px] text-slate-655 dark:text-slate-205 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span>Google Drive</span>
                   &gt; 
                  <span>Oncology_Vault</span>
                   &gt; 
                  <span className="text-natural-accent font-semibold truncate">
                    {`${normalizedPatient.first_name || ""}_${normalizedPatient.last_name || ""}`.replace(/\s+/g, "_")}
                  </span>
                </div>

	                {patientFiles.length === 0 ? (
	                  <div className="py-16 text-center border border-dashed border-natural-border dark:border-slate-700 rounded-xl">
	                    <FileText className="h-10 w-10 text-natural-border/80 mx-auto mb-2 animate-pulse" />
	                    <h4 className="font-bold text-slate-750 dark:text-slate-350">No Patient specific media saved yet</h4>
	                    <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">Upload blood testing sheets, CT scans, or biopsy clinical reports directly.</p>
	                    <button
	                      type="button"
	                      onClick={() => fileInputRef2.current?.click()}
	                      disabled={isUploading}
	                      className="mt-4 inline-flex items-center gap-2 bg-natural-brown hover:bg-natural-brown text-theme-on-accent font-bold text-xs py-2 px-4 rounded-xl transition disabled:opacity-60"
	                    >
	                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
	                      <span>{isUploading ? "Uploading..." : "Upload Without AI Extraction"}</span>
	                    </button>
	                  </div>
	                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patientFiles.map((file) => (
                      <div key={file.id} className="p-4 bg-slate-50 dark:bg-slate-900/35 border border-natural-border dark:border-slate-800 rounded-xl hover:border-natural-accent dark:hover:border-blue-500/55 transition">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-2.5 min-w-0">
                            <div className="h-9 w-9 bg-natural-accent/10 dark:bg-natural-accent/20 text-natural-accent rounded-lg flex items-center justify-center flex-shrink-0 border border-natural-accent/30 text-xs">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="truncate text-xs">
                              <h4 className="font-bold text-slate-855 dark:text-slate-300 truncate" title={file.name}>{file.name}</h4>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold mt-0.5">Size: {(file.size / 1024).toFixed(1)} KB</p>
                              <p className="text-[9px] text-slate-655 dark:text-slate-250 font-semibold mt-0.5">Uploaded: {file.uploadDate}</p>
                            </div>
                          </div>
                          
                          {file.extracted && (
                            <span className="eyebrow bg-natural-accent/10 text-natural-accent-dark dark:text-natural-hover py-0.5 px-2 rounded-md border border-natural-accent/30">
                              AI EXTRACTED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: AI ONCOLOGICAL CLINICAL CHAT */}
          {activeTab === "chat" && (
            <div className="h-[60vh] flex flex-col justify-between border border-natural-border dark:border-natural-border rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/10">
              
              {/* Disclaimer Ribbon */}
              <div className="px-4 py-2.5 bg-natural-accent/10 border-b border-natural-border dark:border-natural-border flex items-center gap-2 text-[10px] text-slate-750 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-natural-accent animate-bounce flex-shrink-0" />
                <span>
                  <strong>Clinical Decision Support Indicator:</strong> Generated responses reference ASCO / NCCN oncology criteria and tailormade patient history. Verify therapeutic decisions clinically.
                </span>
              </div>

              {/* Chat timeline dialog history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatThread.map((msg, i) => {
                  const isAI = msg.sender === "ai";
                  const isLast = i === chatThread.length - 1;
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-4xl chat-message-in ${isAI ? "" : "ml-auto flex-row-reverse"}`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-theme-on-accent flex-shrink-0 shadow-sm ${
                        isAI
                          ? "bg-gradient-to-br from-natural-accent to-natural-accent-dark ai-badge-pulse"
                          : "bg-gradient-to-br from-natural-brown to-natural-brown"
                      }`}>
                        {isAI ? <Bot className="h-4 w-4" /> : "MD"}
                      </div>

                      <div className={`p-3.5 rounded-2xl tracking-normal leading-relaxed select-text chat-prose ${
                        isAI
                          ? "chat-ai-bubble border border-natural-border dark:border-slate-700 text-xs shadow-sm"
                          : "bg-natural-accent text-theme-on-accent dark:bg-natural-accent/90 text-xs shadow-sm"
                      }`}>
                        {isAI ? (
                          <ChatMarkdown text={msg.text} />
                        ) : (
                          <div className="whitespace-pre-wrap text-xs">{msg.text}</div>
                        )}
                        <span className={`text-[9px] flex items-center gap-1 justify-end mt-2.5 pt-1.5 border-t ${
                          isAI
                            ? "text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/60"
                            : "text-theme-on-accent/70 border-theme-highlight/20"
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          {msg.timestamp}
                          {isLast && isAI && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 ml-1">
                              <CheckCheck className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex gap-3 chat-message-in">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-natural-accent to-natural-accent-dark text-theme-on-accent ai-badge-pulse">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="chat-ai-bubble border border-natural-border dark:border-slate-700 p-3.5 rounded-2xl shadow-sm">
                      <ThinkingDots label="Compiling oncology guidelines" />
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-natural-border bg-theme-surface/20 dark:bg-slate-850/30 backdrop-blur-xs flex items-center gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={`Ask oncology advisor guidelines concerning ${normalizedPatient.first_name}'s reports...`}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-natural-border dark:border-natural-border placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs focus:ring-1 focus:ring-natural-accent focus:border-natural-accent"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-natural-accent hover:bg-natural-accent active:bg-natural-accent-dark text-theme-on-accent font-bold p-2.5 rounded-xl flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

            </div>
          )}

        </div>

        {/* Page actions */}
        <div className="p-4 lg:p-5 border-t border-natural-border dark:border-slate-700 bg-natural-card dark:bg-slate-800/20 flex justify-between items-center text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(patient)}
              className="inline-flex items-center gap-1 bg-natural-accent hover:bg-natural-accent text-theme-on-accent py-2 px-4 rounded-xl font-bold cursor-pointer transition select-none tracking-wide text-xs"
            >
              <Eye className="h-4 w-4" />
              <span>Modify Dossier</span>
            </button>
            <button
              onClick={() => onDelete(normalizedPatient.id)}
              className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-105 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 py-2 px-4 rounded-xl font-bold cursor-pointer border border-natural-border/40 dark:border-rose-900/30"
            >
              <Trash className="h-4 w-4" />
              <span>Delete Card</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
