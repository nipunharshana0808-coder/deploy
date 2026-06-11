/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Settings, 
  Moon, 
  Sun, 
  Download, 
  Trash2, 
  KeyRound, 
  Activity, 
  Calendar, 
  ArrowRight, 
  Eye, 
  Edit, 
  Inbox, 
  ShieldAlert,
  Database,
  RefreshCw,
  X
} from "lucide-react";
import { PatientRecord } from "../types";
import { confirmDialog, notify } from "./AppDialog";

interface SettingsViewProps {
  currentUser: { name: string; role: string };
  allPatients: PatientRecord[];
  onWipeDatabase: () => Promise<void>;
}

export default function SettingsView({ currentUser, allPatients, onWipeDatabase }: SettingsViewProps) {
  
  // Theme state
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const [themeStyle, setThemeStyle] = useState<"sage" | "steel" | "sunset" | "amethyst">(() => {
    if (document.documentElement.classList.contains("theme-steel")) return "steel";
    if (document.documentElement.classList.contains("theme-sunset")) return "sunset";
    if (document.documentElement.classList.contains("theme-amethyst")) return "amethyst";
    return "sage";
  });

  const [quotaRemaining, setQuotaRemaining] = useState(0);
  const [totalQuota, setTotalQuota] = useState(1500);
  const [resetDate, setResetDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toLocaleString();
  });
  const [isRefreshingQuota, setIsRefreshingQuota] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    triggerRefreshQuota();
  }, []);

  // Trigger Theme change
  const handleToggleTheme = (mode: "light" | "dark") => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Toggle Theme Style/Palette Preset
  const handleToggleStyle = (style: "sage" | "steel" | "sunset" | "amethyst") => {
    setThemeStyle(style);
    document.documentElement.classList.remove("theme-sage", "theme-steel", "theme-sunset", "theme-amethyst");
    document.documentElement.classList.add(`theme-${style}`);
    localStorage.setItem("theme-style", style);
  };

  // CSV/JSON overall database backups
  const handleBackupAllJSON = async () => {
    if (allPatients.length === 0) {
      await notify("No patient records in the database registry to backup.", "No Records", "warning");
      return;
    }
    const serialized = JSON.stringify(allPatients, null, 2);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FullBackups_OncoRegistry_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupAllCSV = async () => {
    if (allPatients.length === 0) {
      await notify("No patient records in the database registry to backup.", "No Records", "warning");
      return;
    }

    const headers = ["ID", "AutoID", "Title", "First_Name", "Last_Name", "BHT", "Clinic", "DOB", "Age", "Gender", "Oncology", "OverallStage", "TNM", "Status", "Hospital", "RegDate"];
    const csvRows = [headers.join(",")];

    allPatients.forEach((p) => {
      const values = [
        p.id,
        p.auto_id || "",
        p.title || "",
        (p.first_name || "").replace(/,/g, " "),
        (p.last_name || "").replace(/,/g, " "),
        p.bht || "",
        p.clinic || "",
        p.dob || "",
        p.age || "",
        p.gender || "",
        p.oncology || "",
        p.overall_stage || "",
        p.tnm_stage || "",
        p.status || "",
        (p.hospital || "").replace(/,/g, " "),
        p.date || ""
      ];
      csvRows.push(values.map(v => `"${v}"`).join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `FullBackups_OncoRegistry_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Deep Wipe database
  const handleTriggerDeepWipe = async () => {
    if (currentUser.role !== "admin") {
      await notify("Only authorized administrators can wipe the clinical records database.", "Security Alert", "danger");
      return;
    }

    const firstPrompt = await confirmDialog(
      "You are about to execute a full database wipe. This removes all oncology patients, their respective files, and Google Drive subfolders. This is irreversible.\n\nDo you want to proceed?",
      "Critical Danger Zone",
      "danger",
      "Continue"
    );

    if (firstPrompt) {
      const secondPrompt = await confirmDialog(
        "Do you authorize the system to clear 100% of diagnostic timelines and files forever?",
        "Final Verification",
        "danger",
        "Wipe Everything"
      );
      if (secondPrompt) {
        setIsRefreshingQuota(true);
        try {
          await onWipeDatabase();
          await notify("All patient profiles, biopsy logs, blood tables, and drive directories have been wiped successfully.", "Database Wiped", "success");
        } catch (e) {
          await notify("Error executing wipe command.", "Wipe Failed", "danger");
        } finally {
          setIsRefreshingQuota(false);
        }
      }
    }
  };

  // Sync API metrics
  const triggerRefreshQuota = async () => {
    setIsRefreshingQuota(true);
    try {
      const response = await fetch("/api/quota");
      if (response.ok) {
        const quota = await response.json();
        setTotalQuota(Number(quota.quotaLimit || 1500));
        setQuotaRemaining(Number(quota.quotaRemainingEstimate || 0));
        setResetDate(quota.resetDate || resetDate);
      }
    } finally {
      setIsRefreshingQuota(false);
    }
  };

  const percentageRemaining = Math.round((quotaRemaining / totalQuota) * 100);

  const handleShowAgreement = () => setShowAgreementModal(true);
  const handleCloseAgreement = () => setShowAgreementModal(false);

  return (
    <div className="space-y-6 premium-page-enter">
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-[#7A8C70]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">User Agreement</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAgreement}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                I confirm I am the Data Controller under PDPA No. 9 of 2022 (Sri Lanka). I am solely responsible for patient consent and compliance. The developer bears no responsibility for data use.
              </p>
              <p className="font-bold text-amber-900 dark:text-amber-400">
                This web application has been developed for educational purposes only. Not for sale.
              </p>
              <p>
                The institution must maintain secure access credentials and ensure patient privacy is preserved at every stage of dossier creation, review, and archival.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={handleCloseAgreement}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="premium-icon-tile h-11 w-11 rounded-2xl border border-[#7A8C70]/25 bg-[#7A8C70]/10 text-[#5B6B52] dark:text-[#A0A595] dark:bg-[#7A8C70]/15 flex items-center justify-center flex-shrink-0">
          <Settings className="h-5.5 w-5.5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white ">Settings & System Configurations</h2>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Thematic & Backups Panel */}
        <div className="space-y-6">
          
          {/* Theme Option */}
          <div className="glass-card p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-350">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Color Palette Tones</h3>
            
            {/* Theme mode options wrapper */}
            <div className="space-y-4">
              <div>
                <h4 className="h-subsection-sm mb-2">1. Interface Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleToggleTheme("light")}
                    className={`p-3.5 flex flex-col items-center gap-2 rounded-xl border transition cursor-pointer select-none text-center ${
                      themeMode === "light"
                        ? "bg-natural-accent/10 border-natural-accent text-natural-accent-dark dark:text-natural-bg font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold"
                    }`}
                  >
                    <Sun className="h-4.5 w-4.5 text-amber-505 font-bold" />
                    <span className="text-[11px]">Natural Light</span>
                  </button>
 
                  <button
                    onClick={() => handleToggleTheme("dark")}
                    className={`p-3.5 flex flex-col items-center gap-2 rounded-xl border transition cursor-pointer select-none text-center ${
                      themeMode === "dark"
                        ? "bg-natural-accent/20 border-natural-accent text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold"
                    }`}
                  >
                    <Moon className="h-4.5 w-4.5 text-indigo-400 font-bold" />
                    <span className="text-[11px]">Stealth Dark</span>
                  </button>
                </div>
              </div>
 
              <div>
                <h4 className="h-subsection-sm mb-2">2. Color Palette Presets</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Sage Theme Option */}
                  <button
                    onClick={() => handleToggleStyle("sage")}
                    className={`p-3.5 flex flex-col items-start gap-1 relative rounded-xl border transition cursor-pointer select-none text-left w-full ${
                      themeStyle === "sage"
                        ? "bg-natural-accent/10 border-natural-accent text-natural-accent-dark dark:text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                       <span className="h-3.5 w-3.5 rounded-full bg-[#7A8C70] border border-white dark:border-slate-850" />
                      <span className="text-[11px] font-bold">Linen Sage</span>
                    </div>
                    <span className="text-[10px] text-slate-655 dark:text-slate-250 font-semibold mt-0.5">Earthy organic sage</span>
                  </button>
 
                  {/* Steel Theme Option */}
                  <button
                    onClick={() => handleToggleStyle("steel")}
                    className={`p-3.5 flex flex-col items-start gap-1 relative rounded-xl border transition cursor-pointer select-none text-left w-full ${
                      themeStyle === "steel"
                        ? "bg-natural-accent/10 border-natural-accent text-natural-accent-dark dark:text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                       <span className="h-3.5 w-3.5 rounded-full bg-[#3B82F6] border border-white dark:border-slate-850" />
                       <span className="text-[11px] font-bold">Clinical Steel</span>
                    </div>
                    <span className="text-[10px] text-slate.655 dark:text-slate-250 font-semibold mt-0.5">Sleek clinical slate</span>
                  </button>
 
                  {/* Sunset Theme Option */}
                  <button
                    onClick={() => handleToggleStyle("sunset")}
                    className={`p-3.5 flex flex-col items-start gap-1 relative rounded-xl border transition cursor-pointer select-none text-left w-full ${
                      themeStyle === "sunset"
                        ? "bg-natural-accent/10 border-natural-accent text-natural-accent-dark dark:text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                       <span className="h-3.5 w-3.5 rounded-full bg-[#C27A4D] border border-white dark:border-slate-850" />
                       <span className="text-[11px] font-bold">Sunset Copper</span>
                    </div>
                    <span className="text-[10px] text-[#A98467] font-normal mt-0.5">Earthy sunset clay</span>
                  </button>
 
                  {/* Amethyst Theme Option */}
                  <button
                    onClick={() => handleToggleStyle("amethyst")}
                    className={`p-3.5 flex flex-col items-start gap-1 relative rounded-xl border transition cursor-pointer select-none text-left w-full ${
                      themeStyle === "amethyst"
                        ? "bg-natural-accent/10 border-natural-accent text-natural-accent-dark dark:text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                       <span className="h-3.5 w-3.5 rounded-full bg-[#8A5CF5] border border-white dark:border-slate-850" />
                       <span className="text-[11px] font-bold">Royal Amethyst</span>
                    </div>
                    <span className="text-[10px] text-slate-655 dark:text-slate-250 font-semibold mt-0.5">Premium medical thyme</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
 
          {/* Backup Database Dumps */}
          <div className="glass-card p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-350">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">User Agreement & Policy Review</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Review the same institutional user agreement that appears during login anytime from settings.
            </p>
            <button
              type="button"
              onClick={handleShowAgreement}
              className="w-full p-3.5 inline-flex items-center justify-center gap-2 bg-[#7A8C70] hover:bg-[#61755e] text-white rounded-xl font-bold text-xs transition"
            >
              <Eye className="h-4 w-4" />
              View User Agreement
            </button>
          </div>

          <div className="glass-card p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-350">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Patient Dossier Registry Backups</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleBackupAllCSV}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-[#EBE8E0] dark:bg-slate-900 dark:hover:bg-slate-850/80 border border-[#D9D5CB]/60 dark:border-slate-800 rounded-xl font-bold text-slate-850 dark:text-slate-205 cursor-pointer select-none text-left transition text-xs"
              >
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#A98467]" />
                  <span>Download Full CSV Registries</span>
                </span>
                <Download className="h-4 w-4 text-slate-700 dark:text-slate-205 font-bold" />
              </button>
 
              <button
                onClick={handleBackupAllJSON}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-[#EBE8E0] dark:bg-slate-900 dark:hover:bg-slate-850/80 border border-[#D9D5CB]/60 dark:border-slate-800 rounded-xl font-bold text-slate-850 dark:text-slate-205 cursor-pointer select-none text-left transition text-xs"
              >
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#7A8C70]" />
                  <span>Export JSON Metadata Archive</span>
                </span>
                <Download className="h-4 w-4 text-slate-700 dark:text-slate-205 font-bold" />
              </button>
            </div>
          </div>
 
        </div>
 
        {/* Gemini API Quota Monitor & Danger Zone */}
        <div className="space-y-6">
          
          {/* Gemini API Usage Meter */}
          <div className="glass-card p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-350">
            <div className="flex justify-between items-start border-b border-natural-border pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Gemini AI Usage Meter & Quota</h3>
              </div>
              <button
                onClick={triggerRefreshQuota}
                disabled={isRefreshingQuota}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-505 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingQuota ? "animate-spin" : ""}`} />
              </button>
            </div>
 
            <div className="space-y-4">
              {/* Progress bar info */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Daily API requests remaining:</span>
                  <span className="text-[#7A8C70] dark:text-[#A0A595] font-bold">{quotaRemaining} / {totalQuota} Standard Calls</span>
                </div>
                <div className="w-full bg-[#F5F2ED] dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-[#D9D5CB] dark:border-slate-800">
                  <div 
                    className="h-full bg-[#7A8C70] rounded-full transition-all duration-300"
                    style={{ width: `${percentageRemaining}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{percentageRemaining}% of quota remains active for AI extraction.</p>
              </div>
 
              {/* Reset date info */}
              <div className="flex items-center gap-2 bg-[#F5F2ED] dark:bg-slate-900/60 p-3 rounded-xl border border-[#D9D5CB]/40 dark:border-[#2D3527]">
                <Calendar className="h-4 w-4 text-[#A98467] flex-shrink-0" />
                <div className="truncate">
                  <h4 className="font-bold text-slate-750 dark:text-slate-300">Quota Reset Date</h4>
                  <p className="text-[10px] text-slate-400 ">{resetDate}</p>
                </div>
              </div>
 
              {/* Active API key info */}
 
            </div>
          </div>
 
          {/* Danger Zone (Locked for general users) */}
          <div className="bg-rose-500/5 dark:bg-rose-950/10 backdrop-blur-md p-5 rounded-2xl border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
              <span>Security System Danger Zone</span>
            </h3>
            
            {currentUser.role === "admin" ? (
              <button
                onClick={handleTriggerDeepWipe}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs cursor-pointer select-none transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>Execute Complete Database Wipe</span>
              </button>
            ) : (
              <div className="bg-rose-100/50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/50 text-[10px] font-semibold text-rose-700">
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
