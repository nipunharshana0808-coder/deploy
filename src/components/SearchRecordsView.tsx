/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Trash2, 
  Building, 
  Activity, 
  Phone, 
  FileSpreadsheet, 
  SlidersHorizontal 
} from "lucide-react";
import { PatientRecord, OncologyCategory } from "../types";
import { normalizePatientData } from "../utils/normalizeCase";

interface SearchRecordsViewProps {
  allPatients: PatientRecord[];
  onViewPatient: (pat: PatientRecord) => void;
  onEditPatient: (pat: PatientRecord) => void;
  onDeletePatient: (id: string) => void;
}

export default function SearchRecordsView({ 
  allPatients, 
  onViewPatient, 
  onEditPatient, 
  onDeletePatient 
}: SearchRecordsViewProps) {

  // Sorters and Filters state
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOncology, setSelectedOncology] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedHospital, setSelectedHospital] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"name" | "updatedAt" | "overall_stage">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Get unique hospitals from registered patients to populate dynamic hospital selector!
  const uniqueHospitals = Array.from(
    new Set(allPatients.map(p => p.hospital).filter(h => h && h.trim() !== ""))
  );

  // Search filter logic
  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);

    return allPatients.filter((pat) => {
      const normalized = (value: any) => String(value || "").toLowerCase();
      const fieldsToSearch = [
        `${pat.title || ""} ${pat.first_name || ""} ${pat.last_name || ""}`,
        pat.auto_id,
        pat.nic,
        pat.tp,
        pat.bht,
        pat.clinic,
        pat.hospital,
        pat.ward_no,
        pat.initials,
      ].map(normalized);

      const matchesSearch = terms.length === 0 || terms.every((term) =>
        fieldsToSearch.some((field) => field.includes(term))
      );

      // Oncology filter match
      const patientOncologyTypes = pat.oncology_types && pat.oncology_types.length > 0 ? pat.oncology_types : [pat.oncology || "Other"];
      const matchesOncology = selectedOncology === "All" || patientOncologyTypes.includes(selectedOncology);

      // Status filter match
      const matchesStatus = selectedStatus === "All" || pat.status === selectedStatus;

      // Hospital filter match
      const matchesHospital = selectedHospital === "All" || pat.hospital === selectedHospital;

      return matchesSearch && matchesOncology && matchesStatus && matchesHospital;
    });
  }, [allPatients, searchQuery, selectedOncology, selectedStatus, selectedHospital]);

  // Sorting logic
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        const nameA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const nameB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "overall_stage") {
        const stageA = a.overall_stage || "";
        const stageB = b.overall_stage || "";
        comparison = stageA.localeCompare(stageB);
      } else {
        // default: updatedAt
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredPatients, sortBy, sortDirection]);

  const handleToggleDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  const handleSearchSubmit = () => {
    setSearchQuery(pendingSearchQuery.trim());
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#7A8C70]/10 text-[#4A5444] dark:text-[#E0DDD2] border border-[#7A8C70]/30 dark:border-[#7A8C70]/20";
      case "under_treatment":
        return "bg-[#A98467]/10 text-[#6F4E37] dark:text-[#D1B8A5] border border-[#A98467]/30";
      case "follow_up":
        return "bg-[#F5F2ED] dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-[#D9D5CB] dark:border-slate-700";
      case "discharged":
        return "bg-[#9A8F80]/15 dark:bg-[#9A8F80]/10 text-[#5C544A] dark:text-[#C5BEB5] border border-[#9A8F80]/30";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-205 font-bold";
    }
  };

  return (
    <div className="space-y-6 ">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">Patient Registries & Records</h2>
        </div>
        <div className="text-xs font-semibold bg-[#7A8C70]/10 dark:bg-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] py-1.5 px-3 rounded-xl border border-[#7A8C70]/30 leading-normal">
          {sortedPatients.length} patient dossier{sortedPatients.length === 1 ? "" : "s"} indexed
        </div>
      </div>

      {/* Lookup controls bar */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
          <input
            type="text"
            id="input-search-records"
            value={pendingSearchQuery}
            onChange={(e) => setPendingSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by patient name, BHT, clinic, auto ID, NIC, TP, or hospital..."
            className="w-full pr-28 pl-11 py-3 bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:border-[#7A8C70] outline-none focus:ring-1 focus:ring-[#7A8C70] transition-all text-xs"
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-[#7A8C70] text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#61755e] transition"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        {/* Filters and Sorting controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          
          {/* Oncology Filter */}
          <div className="space-y-1">
            <label className="label-form block leading-none">Oncology Class</label>
            <select
              value={selectedOncology}
              onChange={(e) => setSelectedOncology(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 rounded-xl"
            >
              <option value="All">All Tumor Types</option>
              {Object.values(OncologyCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="label-form block leading-none">Clinical Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 rounded-xl"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_treatment">Under Treatment</option>
              <option value="follow_up">Follow Up</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>

          {/* Hospital Filter */}
          <div className="space-y-1">
            <label className="label-form block leading-none">Admitted Hospital</label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 rounded-xl"
            >
              <option value="All">All Hospitals</option>
              {uniqueHospitals.map((hosp) => (
                <option key={hosp} value={hosp}>{hosp}</option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="space-y-1">
            <label className="label-form block leading-none">Order Criteria</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 rounded-xl"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="name">Patient Name</option>
              <option value="overall_stage">Overall Tumor Stage</option>
            </select>
          </div>

          {/* Toggle Sorting Direction */}
          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={handleToggleDirection}
              className="w-full p-2.5 flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#EBE8E0] dark:bg-slate-705 dark:hover:bg-slate-650 text-slate-755 dark:text-slate-350 font-semibold border border-[#D9D5CB] dark:border-slate-650 rounded-xl transition cursor-pointer select-none"
            >
              <ArrowUpDown className="h-4 w-4 text-[#7A8C70]" />
              <span>{sortDirection === "asc" ? "Ascending" : "Descending"}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Patient lookup list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedPatients.map((pat) => {
          const norm = normalizePatientData(pat);
          const patientName = [norm.title, norm.first_name, norm.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
          const oncology = (norm.oncology_types && norm.oncology_types.length > 0 ? norm.oncology_types : [norm.oncology || "Other"]).join(", ");
          const status = norm.status || "active";

          return (
          <div 
            key={norm.id} 
            className="glass-card rounded-2xl hover:border-natural-accent hover:shadow-md p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header Badge Row */}
              <div className="flex justify-between items-start gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider leading-none">{norm.auto_id || "PT-N/A"}</span>
                    <h3 className="value-display font-bold text-slate-805 dark:text-slate-100 truncate text-sm leading-snug">
                      {patientName}
                    </h3>
                  </div>
                </div>

                <span className={`eyebrow px-2.5 py-0.5 rounded-full border leading-normal ${getStatusBadgeClass(status)}`}>
                  {status.replace("_", " ")}
                </span>
              </div>

              {/* Patient core descriptors */}
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 border-y border-[#D9D5CB]/45 dark:border-slate-700/80 py-3 mb-4">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-slate-655 dark:text-slate-350 font-semibold leading-normal">Class & Type:</span>
                  <span className="value-display font-bold px-2 py-0.5 rounded-lg text-[10px] leading-none text-slate-805 dark:text-slate-200">
                    {oncology}
                  </span>
                </div>

                <div className="flex items-center gap-2 justify-between">
                  <span className="text-slate-655 dark:text-slate-350 font-semibold leading-normal">Age / Gender:</span>
                  <span className="value-display font-semibold leading-normal text-slate-805 dark:text-slate-100">
                    {norm.gender || "Male"} • {norm.age || "N/A"} yrs
                  </span>
                </div>

                {norm.overall_stage && (
                  <div className="flex items-center gap-2 justify-between ">
                    <span className="text-slate-655 dark:text-slate-350 font-semibold leading-normal">Tumor Stage:</span>
                    <span className="value-display text-slate-805 dark:text-slate-100 font-bold leading-normal">
                      {norm.overall_stage} {norm.tnm_stage ? `(${norm.tnm_stage})` : ""}
                    </span>
                  </div>
                )}

                {norm.hospital && (
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-slate-655 dark:text-slate-350 font-semibold flex items-center gap-1 leading-normal">
                      <Building className="h-3.5 w-3.5 text-[#A98467]" />
                      <span>Hospital:</span>
                    </span>
                    <span className="value-display truncate max-w-[150px] text-slate-805 dark:text-slate-100 font-semibold leading-normal" title={norm.hospital}>{norm.hospital}</span>
                  </div>
                )}

                {norm.tp && (
                  <div className="flex items-center gap-1.5 justify-between ">
                    <span className="text-slate-655 dark:text-slate-350 font-semibold flex items-center gap-1 leading-normal">
                      <Phone className="h-3.5 w-3.5 text-[#7A8C70]" />
                      <span>Phone:</span>
                    </span>
                    <span className="value-display text-slate-805 dark:text-slate-100 font-semibold leading-normal">{norm.tp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bottom bar with unique trigger IDs */}
            <div className="flex items-center gap-2.5 pt-1 text-xs">
              <button
                id={`btn-search-view-${norm.id}`}
                onClick={() => onViewPatient(pat)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-50 border border-[#D9D5CB] hover:bg-[#EBE8E0]/60 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-750 dark:text-slate-200 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer select-none"
              >
                <Eye className="h-3.5 w-3.5 text-[#7A8C70]" />
                <span>View Dossier</span>
              </button>
              
              <button
                id={`btn-search-edit-${norm.id}`}
                onClick={() => onEditPatient(pat)}
                className="inline-flex items-center justify-center bg-[#7A8C70]/10 hover:bg-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] p-2 border border-[#7A8C70]/20 rounded-xl transition-colors cursor-pointer"
                title="Edit Records"
              >
                <Edit className="h-4 w-4" />
              </button>

              <button
                id={`btn-search-delete-${norm.id}`}
                onClick={() => onDeletePatient(norm.id)}
                className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 p-2 rounded-xl transition-colors cursor-pointer border border-[#D9D5CB]/30"
                title="Delete Record"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

          </div>
        )})}

        {sortedPatients.length === 0 && (
          <div className="col-span-full py-16 text-center glass-card rounded-2xl">
            <div className="flex justify-center text-[#D9D5CB] mb-3">
              <Building className="h-12 w-12 text-[#7A8C70]" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-200">No Patient Records Matched</h4>
            <p className="text-xs text-slate-655 dark:text-slate-200 mt-1 max-w-sm mx-auto">
              Please modify your search query, choose other oncology classes, or click "Add Patient" to register a new clinical metadata dossier right now.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
