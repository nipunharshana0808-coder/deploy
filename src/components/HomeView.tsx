/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  UserPlus, 
  Search, 
  Settings, 
  Users, 
  Calendar, 
  ArrowRight, 
  Eye, 
  Edit, 
  Trash2, 
  Inbox, 
  Activity, 
  ShieldAlert 
} from "lucide-react";
import { PatientRecord, UserAccount } from "../types";

interface HomeViewProps {
  currentUser: UserAccount;
  allPatients: PatientRecord[];
  onNavigateMenu: (menu: "Home" | "Dashboard" | "Add Patient" | "Search Records" | "Settings") => void;
  onViewPatient: (patient: PatientRecord) => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (id: string) => void;
}

export default function HomeView({ 
  currentUser, 
  allPatients, 
  onNavigateMenu, 
  onViewPatient, 
  onEditPatient, 
  onDeletePatient 
}: HomeViewProps) {

  // Time oriented greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Sort by updatedAt descending to show the most recent 10 records
  const recentRecords = [...allPatients]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900";
      case "under_treatment":
        return "bg-[#A98467]/10 dark:bg-[#A98467]/20 text-[#A98467] dark:text-[#C2A78F] border border-[#A98467]/30 dark:border-[#A98467]/50";
      case "follow_up":
        return "bg-[#7A8C70]/10 dark:bg-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] border border-[#7A8C70]/30 dark:border-[#7A8C70]/50";
      case "discharged":
        return "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6 page-fade-in">

      {/* Greetings Header Jumbotron */}
      <div className="bg-gradient-to-br from-natural-accent/75 to-natural-accent-dark/75 rounded-3xl p-6 lg:p-8 text-white shadow-md border border-white/10 backdrop-blur-lg hero-fade-up relative overflow-hidden">
        <div className="absolute -top-12 -right-12 opacity-15 hero-drift pointer-events-none">
          <svg viewBox="0 0 200 200" width="220" height="220" aria-hidden>
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="1" />
            <path d="M 60 100 L 100 60 L 140 100 L 100 140 Z" fill="none" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="max-w-3xl">
          <span className="eyebrow bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs bounce-in inline-block">
            Clinical Portal Active
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-3 tracking-tight hero-fade-up" style={{ animationDelay: "0.2s" }}>
            {getGreeting()}, {currentUser.name}
          </h2>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/90">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg py-1.5 px-3 backdrop-blur-xs">
              <Calendar className="h-4 w-4 text-[#E0DDD2]" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg py-1.5 px-3 backdrop-blur-xs">
              <Users className="h-4 w-4 text-[#E0DDD2]" />
              <span>{allPatients.length} Registered Patients</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Quick Navigation Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

          {([
             {
               id: "shortcut-add-patient",
               title: "Add Patient",
               icon: UserPlus,
               target: "Add Patient" as const,
             },
             {
               id: "shortcut-search",
               title: "Search Records",
               icon: Search,
               target: "Search Records" as const,
             },
             {
               id: "shortcut-dashboard",
               title: "View Dashboard",
               icon: Activity,
               target: "Dashboard" as const,
             },
             {
               id: "shortcut-settings",
               title: "System Settings",
               icon: Settings,
               target: "Settings" as const,
             },
           ]).map((s) => {

            const Icon = s.icon;
            return (
              <button
                key={s.id}
                id={s.id}
                onClick={() => onNavigateMenu(s.target)}
                className="shortcut-card flex flex-col justify-start h-full p-5 pr-12 glass-card rounded-2xl text-left cursor-pointer relative"
              >
                <span className="shortcut-card-arrow" aria-hidden="true">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <div className="shortcut-card-icon h-10 w-10 bg-[#7A8C70]/10 dark:bg-[#7A8C70]/20 rounded-xl flex items-center justify-center text-[#7A8C70] dark:text-[#A0A595] flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 flex-1 flex flex-col justify-start">
                  <h4 className="shortcut-card-title font-bold text-slate-800 dark:text-white text-sm">
                    {s.title}
                  </h4>
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* Recent Entered Records */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-natural-border flex justify-between items-center bg-white/20 dark:bg-white/5 backdrop-blur-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recently Admitted/Updated Patients</h3>
          </div>
          <button 
            id="btn-view-all-patients"
            onClick={() => onNavigateMenu("Search Records")} 
            className="text-xs font-semibold text-[#7A8C70] dark:text-[#A0A595] hover:text-[#4A5444] dark:hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all records</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="py-12 p-5 text-center">
            <div className="flex justify-center text-slate-300 dark:text-slate-650 mb-3">
              <Inbox className="h-12 w-12" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No Patient Records Yet</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
              Click the "Add Patient" shortcut aloft or in the menu panel to create your first clinical oncological record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-table-col">
                  <th className="py-3 px-5">Reg ID</th>
                  <th className="py-3 px-5">Patient Name</th>
                  <th className="py-3 px-5">Gender / Age</th>
                  <th className="py-3 px-5">Oncology Category</th>
                  <th className="py-3 px-5">Active Status</th>
                  <th className="py-3 px-5">Last Updated</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs text-slate-600 dark:text-slate-300">
                {recentRecords.map((pat) => {
                  const patientName = [pat.title, pat.first_name, pat.last_name].filter(Boolean).join(" ") || "Unnamed Patient";
                  const oncology = (pat.oncology_types && pat.oncology_types.length > 0 ? pat.oncology_types : [pat.oncology || "Other"]).join(", ");
                  const status = pat.status || "active";
                  const updatedAt = pat.updatedAt ? new Date(pat.updatedAt).toLocaleDateString() : "N/A";

                  return (
                  <tr key={pat.id} className="hover:bg-[#F5F2ED]/20 dark:hover:bg-slate-750/30 transition-colors">
                    <td className="py-3 px-5 text-slate-650 dark:text-slate-300 font-bold">{pat.auto_id || "PT-N/A"}</td>
                    <td className="py-3 px-5">
                      <span className="font-semibold text-slate-800 dark:text-white capitalize">
                        {patientName}
                      </span>
                    </td>
                    <td className="py-3 px-5 capitalize">{pat.gender || "N/A"} • {pat.age || "N/A"} yrs</td>
                    <td className="py-3 px-5">
                      <span className="bg-[#7A8C70]/10 dark:bg-[#7A8C70]/20 text-[#4A5444] dark:text-[#E0DDD2] font-semibold py-0.5 px-2 rounded-md border border-[#7A8C70]/20">
                        {oncology}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`eyebrow px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(status)}`}>
                        {status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-650 dark:text-slate-300 ">
                      {updatedAt}
                    </td>
                    <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        id={`btn-home-view-${pat.id}`}
                        onClick={() => onViewPatient(pat)}
                        className="inline-flex items-center gap-1 bg-slate-105 hover:bg-[#EBE8E0] dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-[#D9D5CB]/40 dark:border-slate-600"
                        title="View Detailed Dossier"
                      >
                        <Eye className="h-3 w-3 text-[#7A8C70]" />
                        <span>View</span>
                      </button>
                      <button
                        id={`btn-home-edit-${pat.id}`}
                        onClick={() => onEditPatient(pat)}
                        className="inline-flex items-center gap-1 bg-[#7A8C70]/10 hover:bg-[#7A8C70]/20 dark:bg-slate-700 dark:hover:bg-slate-650 text-[#4A5444] dark:text-[#E0DDD2] py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-[#7A8C70]/20"
                        title="Edit Records"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        id={`btn-home-delete-${pat.id}`}
                        onClick={() => onDeletePatient(pat.id)}
                        className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/30 dark:hover:bg-rose-955/60 text-rose-700 dark:text-rose-350 py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/40"
                        title="Delete Patient Record"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
