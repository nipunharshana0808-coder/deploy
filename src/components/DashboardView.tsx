/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Users, 
  Activity, 
  HeartHandshake, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  UserSquare, 
  Layers 
} from "lucide-react";
import { PatientRecord } from "../types";

interface DashboardViewProps {
  allPatients: PatientRecord[];
}

export default function DashboardView({ allPatients }: DashboardViewProps) {
  
  const total = allPatients.length;
  const active = allPatients.filter((p) => p.status === "active").length;
  const treatment = allPatients.filter((p) => p.status === "under_treatment").length;
  const followUp = allPatients.filter((p) => p.status === "follow_up").length;
  const discharged = allPatients.filter((p) => p.status === "discharged").length;

  const activePercent = total ? Math.round((active / total) * 100) : 0;
  const treatmentPercent = total ? Math.round((treatment / total) * 100) : 0;
  const followUpPercent = total ? Math.round((followUp / total) * 100) : 0;
  const dischargedPercent = total ? Math.round((discharged / total) * 100) : 0;

  // Breakdown by standard standard Oncology types
  const oncologyBreakdown: Record<string, number> = {};
  allPatients.forEach((p) => {
    const categories = p.oncology_types && p.oncology_types.length > 0 ? p.oncology_types : [p.oncology || "Other"];
    categories.forEach((cat) => {
      oncologyBreakdown[cat] = (oncologyBreakdown[cat] || 0) + 1;
    });
  });

  const sortedOncology = Object.entries(oncologyBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // top 6 categories

  // Gender demographics
  const maleCount = allPatients.filter((p) => p.gender?.toLowerCase() === "male").length;
  const femaleCount = allPatients.filter((p) => p.gender?.toLowerCase() === "female").length;
  const otherGenderCount = total - maleCount - femaleCount;

  const malePercent = total ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total ? Math.round((femaleCount / total) * 100) : 0;
  const otherGenderPercent = total ? Math.round((otherGenderCount / total) * 100) : 0;

  // Age demographics mapping
  const ageBrackets = {
    "0-18 pediatric": 0,
    "19-35 adult": 0,
    "36-55 mid-age": 0,
    "56-75 mature": 0,
    "76+ geriatric": 0
  };

  allPatients.forEach((p) => {
    const age = Number(p.age);
    if (!age) return;
    if (age <= 18) ageBrackets["0-18 pediatric"]++;
    else if (age <= 35) ageBrackets["19-35 adult"]++;
    else if (age <= 55) ageBrackets["36-55 mid-age"]++;
    else if (age <= 75) ageBrackets["56-75 mature"]++;
    else ageBrackets["76+ geriatric"]++;
  });

  return (
    <div className="space-y-6 ">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">Clinical Dashboard & Metrics</h2>
      </div>

      {/* Numerical Metrics Cards Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Patients Card */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="h-group leading-none">Total Dossiers</span>
            <Users className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-normal leading-none">{total}</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 mt-1 font-semibold leading-none">100% active registry</p>
          </div>
        </div>

        {/* Active Patients Card */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="h-group leading-none">Active Status</span>
            <Activity className="h-5 w-5 text-slate-400 dark:text-slate-500 animate-pulse" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-normal leading-none">{active}</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold mt-1 leading-none">
              {activePercent}% of total
            </p>
          </div>
        </div>

        {/* Under Treatment Patients Card */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="h-group leading-none">In Treatment</span>
            <Layers className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-normal leading-none">{treatment}</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold mt-1 leading-none">
              {treatmentPercent}% of total
            </p>
          </div>
        </div>

        {/* Follow up Patients Card */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="h-group leading-none">Follow Up</span>
            <HeartHandshake className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-normal leading-none">{followUp}</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold mt-1 leading-none">
              {followUpPercent}% of total
            </p>
          </div>
        </div>

        {/* Discharged Patients Card */}
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="h-group leading-none">Discharged</span>
            <CheckCircle className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-normal leading-none">{discharged}</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold mt-1 leading-none">
              {dischargedPercent}% of total
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts Breakdown Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Oncology Category Statistics */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-[#7A8C70]" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">Oncology Category Distribution</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {total === 0 ? (
              <div className="text-center py-6 text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">No oncology datasets available.</div>
            ) : sortedOncology.length === 0 ? (
              <div className="text-center py-6 text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">No patient oncology types designated.</div>
            ) : (
              sortedOncology.map(([category, count]) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-755 dark:text-slate-300 leading-normal">
                      <span>{category}</span>
                      <span>{count} patient{count > 1 ? "s" : ""} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#F5F2ED] dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#7A8C70] dark:bg-[#A0A595] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Age & Gender Demographics Grid Block */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserSquare className="h-4 w-4 text-[#A98467]" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">Gender & Age Bracket Distribution</h3>
            </div>
          </div>

          {/* Gender progress meters */}
          <div className="mt-5 space-y-4">
            <h4 className="h-subsection-sm leading-none">Gender Breakdown</h4>
            
            {total === 0 ? (
              <div className="text-center text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">No patient demographics.</div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Male meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs leading-normal">
                    <span className="font-semibold text-slate-650 dark:text-slate-350">Male Registration</span>
                    <span className="font-bold text-slate-700 dark:text-slate-250">{maleCount} ({malePercent}%)</span>
                  </div>
                  <div className="w-full bg-[#F5F2ED] dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#7A8C70] h-full rounded-full" 
                      style={{ width: `${malePercent}%` }} 
                    />
                  </div>
                </div>

                {/* Female meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs leading-normal">
                    <span className="font-semibold text-slate-650 dark:text-slate-350">Female Registration</span>
                    <span className="font-bold text-slate-700 dark:text-slate-250">{femaleCount} ({femalePercent}%)</span>
                  </div>
                  <div className="w-full bg-[#F5F2ED] dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#A98467] h-full rounded-full" 
                      style={{ width: `${femalePercent}%` }} 
                    />
                  </div>
                </div>

                {/* Other/Non-binary meter */}
                {otherGenderCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs leading-normal">
                      <span className="font-semibold text-slate-655 dark:text-slate-350">Other / Non-binary</span>
                      <span className="font-bold text-slate-700 dark:text-slate-250">{otherGenderCount} ({otherGenderPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#F5F2ED] dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#9A8F80] h-full rounded-full" 
                        style={{ width: `${otherGenderPercent}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-[#D9D5CB]/45 dark:border-slate-700/80 pt-4 mt-6">
            <h4 className="h-subsection-sm mb-3 leading-none">Age Brackets</h4>
            <div className="flex items-end justify-between h-20 gap-2">
              {Object.entries(ageBrackets).map(([bracket, count]) => {
                const heightLimit = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={bracket} className="flex-1 flex flex-col justify-end h-full group text-center cursor-help">
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-100 mb-1 hidden group-hover:block transition-all self-center">
                      {count}
                    </span>
                    <div 
                      className="bg-[#7A8C70] dark:bg-[#7A8C70]/80 rounded-t-sm hover:bg-[#6B705C] transition-all duration-305 w-full"
                      style={{ height: total ? `${Math.max(8, heightLimit)}%` : "8%" }}
                    />
                    <span className="eyebrow text-slate-650 dark:text-slate-200 mt-1 truncate max-w-full scale-[0.85]" title={bracket}>
                      {bracket.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>


    </div>
  );
}