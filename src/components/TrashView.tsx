import React, { useState } from "react";
import { 
  Trash2, 
  RotateCcw, 
  Info,
  Search,
  History
} from "lucide-react";
import { PatientRecord } from "../types";
import { confirmDialog } from "./AppDialog";

interface TrashViewProps {
  allPatients: PatientRecord[];
  onNavigateMenu: (menu: any) => void;
  onRestorePatient: (id: string) => Promise<void>;
  onClearTrash: () => Promise<void>;
  onPermanentlyDeletePatient: (id: string) => Promise<void>;
  onViewPatient: (patient: PatientRecord) => void;
}

export default function TrashView({ 
  allPatients, 
  onNavigateMenu, 
  onRestorePatient, 
  onClearTrash,
  onPermanentlyDeletePatient,
  onViewPatient 
}: TrashViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const deletedPatients = allPatients.filter(p => p.isDeleted);
  
  const filteredPatients = deletedPatients.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const id = p.auto_id?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || id.includes(query);
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleClearTrash = async () => {
    const confirmed = await confirmDialog(
      "Are you sure you want to PERMANENTLY wipe all deleted records? This action cannot be undone and will purge all associated files from the secure storage.",
      "Empty Trash",
      "danger",
      "Empty Trash"
    );
    if (!confirmed) return;
    setIsClearing(true);
    try {
      await onClearTrash();
    } catch (err) {
      console.error("Failed to clear trash:", err);
      throw err;
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    await onPermanentlyDeletePatient(id);
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Trash Bin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="h-3 w-3" />
            Deleted records are stored here temporarily before permanent purging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {deletedPatients.length > 0 && (
          <button
            onClick={handleClearTrash}
            disabled={isClearing}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className={`h-4 w-4 ${isClearing ? "animate-spin" : ""}`} />
            {isClearing ? "Purging..." : "Empty Trash"}
          </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deleted records by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-natural-accent/50 focus:border-natural-accent outline-none transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      {filteredPatients.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 px-4 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200">No deleted records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">Your trash is currently empty.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-table-col">
                  <th className="py-3 px-5 text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider">Reg ID</th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider">Patient Name</th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider">Deleted On</th>
                  <th className="py-3 px-5 text-right text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs text-slate-600 dark:text-slate-300">
                {filteredPatients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-5 font-mono font-semibold text-slate-700 dark:text-slate-200">{pat.auto_id}</td>
                    <td className="py-3 px-5 font-bold text-slate-800 dark:text-white">
                      {pat.first_name} {pat.last_name}
                    </td>
                    <td className="py-3 px-5 text-slate-500 dark:text-slate-400">
                      {new Date(pat.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right space-x-2">
                      <button
                        onClick={() => onRestorePatient(pat.id)}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 py-1.5 px-3 rounded-lg text-[11px] font-bold border border-emerald-200 dark:border-emerald-900/50 transition-all active:scale-95"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                      <button
                        onClick={() => onViewPatient(pat)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-1.5 px-3 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-600 transition-all active:scale-95"
                      >
                        <History className="h-3 w-3" />
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(pat.id)}
                        className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 py-1.5 px-3 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-900/50 transition-all active:scale-95"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete Permanently
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
