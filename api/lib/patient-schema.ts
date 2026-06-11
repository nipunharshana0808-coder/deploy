const splitValues = (value: unknown) =>
  String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export function adaptPatientForNewUi(patient: any) {
  if (!patient || patient.patient_id) return patient;

  const updatedDate = String(patient.updatedAt || patient.createdAt || "").slice(0, 10);
  const firstChemo = (rows: any[]) => rows?.[0] || {};
  const firstRadio = (rows: any[]) => rows?.[0] || {};

  return {
    ...patient,
    patient_id: patient.id,
    record_id: patient.auto_id || patient.id,
    consent_taken: true,
    consent_date: patient.date || updatedDate,
    bht_no: patient.bht || "",
    clinic_no: patient.clinic || "",
    tp_countryCode: patient.tp_countryCode || "+94",
    oncology_type: patient.oncology_types?.length ? patient.oncology_types : [patient.oncology || "Other"],
    other_oncology_type: patient.oncology_other || "",
    age_display: String(patient.age || ""),
    hospital_location: patient.hospital || "",
    hospital_type: "",
    hospital_name: patient.hospital || "",
    presenting_complaints: patient.presenting_complaints
      ? [{ complaint_name: patient.presenting_complaints, duration: "", notes: "" }]
      : [],
    comorbidities: splitValues(patient.comorbidity).map((comorbidity_name) => ({ comorbidity_name, duration: "", notes: "" })),
    hospital_admissions: patient.hospital_admissions
      ? [{ admission_no: "", reason: patient.hospital_admissions, date: "", notes: "" }]
      : [],
    past_surgeries: patient.past_surgical_history
      ? [{ procedure_name: patient.past_surgical_history, complications: "", notes: "" }]
      : [],
    drug_history: (patient.drugTable || []).filter((row: any) => row.drug_name).map((row: any) => ({
      drug_name: row.drug_name || "",
      dose: row.dose || "",
      frequency: row.frequency || "",
      route: row.route || "",
      duration: row.duration || "",
      notes: row.notes || "",
    })),
    family_history: (patient.familyTable || []).filter((row: any) => row.comorbidity).map((row: any) => ({
      morbidity_name: row.comorbidity || "",
      relationship: row.relationship || "",
      notes: row.family_notes || "",
    })),
    risk_factors: (patient.riskTable || []).filter((row: any) => row.risk_factor).map((row: any) => ({
      risk_factor_name: row.risk_factor || "",
      notes: row.risk_notes || "",
    })),
    examination_findings: [
      ...(patient.height ? [{ examination_type: "Height", date: patient.date || "", findings: patient.height }] : []),
      ...(patient.weight ? [{ examination_type: "Weight", date: patient.date || "", findings: patient.weight }] : []),
      ...(patient.bmi ? [{ examination_type: "BMI", date: patient.date || "", findings: patient.bmi }] : []),
      ...(patient.bsa ? [{ examination_type: "BSA", date: patient.date || "", findings: patient.bsa }] : []),
      ...(patient.examFindingsTable || [])
        .filter((row: any) => row.findings)
        .map((row: any) => ({
          examination_type: "Organ System",
          organ_system_name: row.organ_system || "",
          date: patient.date || "",
          findings: [row.findings, row.notes].filter(Boolean).join(" - "),
        })),
    ],
    problems: (patient.problemTable || []).filter((row: any) => row.problem).map((row: any) => ({
      problem_name: row.problem || "",
      management_plan: row.management_plan || "",
    })),
    usual_prescriptions: (patient.commonDrugsTable || []).filter((row: any) => row.common_drug).map((row: any) => ({
      drug_name: row.common_drug || "",
      dose: row.common_dose || "",
      frequency: row.common_frequency || "",
      duration: "",
      notes: row.common_drug_notes || "",
    })),
    allergies: {
      foods: splitValues(patient.allergy_food),
      drugs: splitValues(patient.allergy_drugs),
      plasters: splitValues(patient.allergy_plasters),
      others: splitValues(patient.allergy_other),
    },
    social_history: {
      smoking: { status: patient.smoking || "Non consumer", amounts: patient.smoking_amount || "" },
      alcohol: { status: patient.alcohol || "Non consumer", amounts: patient.alcohol_amount || "" },
    },
    other_notes: patient.general_notes || "",
    investigations: {
      imaging: (patient.imagingTable || []).map((row: any) => ({
        modality: row.imaging_type || "",
        date: "",
        mass_present: row.mass_present || "No",
        mass_size: row.mass_size || "",
        reporting_system_status: [row.lymph_nodes, row.metastasis].filter(Boolean).join("; "),
        findings: [row.imaging_findings, row.mass_location, row.calcifications, row.ascites, row.pv_status, row.sma_status].filter(Boolean).join("; "),
        purpose: row.imaging_purpose || "",
      })),
      biopsies: (patient.biopsyTable || []).map((row: any) => ({
        biopsy_type: row.biopsy_type || "",
        date: "",
        pathology_status: row.biopsy_stage || row.cell_type || "",
        findings: [row.biopsy_findings, row.margin_status, row.lvi, row.perineural_invasion, row.lymph_nodes, row.metastasis].filter(Boolean).join("; "),
        purpose: row.biopsy_purpose || "",
      })),
      endoscopy: (patient.endoscopyTable || []).map((row: any) => ({
        procedure_type: row.endo_type || "",
        date: "",
        findings: [row.endo_parameter, row.endo_findings].filter(Boolean).join("; "),
        biopsy_taken: "No",
        purpose: row.endo_purpose || "",
      })),
      ihc: (patient.immunohistochemistryTable || []).map((row: any) => ({
        marker_name: row.ihc_marker || "",
        status: row.ihc_result || "",
        intensity: row.ihc_intensity || "",
        notes: [row.ihc_score, row.ihc_percentage, row.ihc_interpretation, row.ihc_notes].filter(Boolean).join("; "),
        purpose: row.ihc_panel || "",
      })),
      genetic: [],
      tumour_markers: (patient.tumorMarkersTable || []).map((row: any) => ({
        marker_name: row.marker_name || "",
        value: row.marker_value || "",
        unit: row.marker_unit || "",
        date: row.marker_date || "",
        reference_range: row.marker_ref_range || "",
        purpose: row.marker_notes || "",
      })),
      others: (patient.otherInvTable || []).map((row: any) => ({
        investigation_type: row.otherinv_type || "",
        date: "",
        findings: [row.otherinv_parameter, row.otherinv_findings].filter(Boolean).join("; "),
        purpose: row.otherinv_purpose || "",
      })),
    },
    neo_adjuvant_chemotherapy: {
      status: patient.neo_chemo_status === "Done" ? "Done" : "Not done",
      drug_name: firstChemo(patient.neoChemoTable).neo_chemo_drug || "",
      dose: firstChemo(patient.neoChemoTable).neo_chemo_dose || "",
      frequency: firstChemo(patient.neoChemoTable).neo_chemo_freq || "",
      route: firstChemo(patient.neoChemoTable).neo_chemo_route || "",
      duration: firstChemo(patient.neoChemoTable).neo_chemo_cycles || "",
      adverse_effects: firstChemo(patient.neoChemoTable).neo_chemo_effects || "",
      notes: firstChemo(patient.neoChemoTable).neo_chemo_notes || "",
    },
    adjuvant_chemotherapy: {
      status: patient.adj_chemo_status === "Done" ? "Done" : "Not done",
      drug_name: firstChemo(patient.adjChemoTable).neo_chemo_drug || "",
      dose: firstChemo(patient.adjChemoTable).neo_chemo_dose || "",
      frequency: firstChemo(patient.adjChemoTable).neo_chemo_freq || "",
      route: firstChemo(patient.adjChemoTable).neo_chemo_route || "",
      duration: firstChemo(patient.adjChemoTable).neo_chemo_cycles || "",
      adverse_effects: firstChemo(patient.adjChemoTable).neo_chemo_effects || "",
      notes: firstChemo(patient.adjChemoTable).neo_chemo_notes || "",
    },
    neo_adjuvant_radiotherapy: {
      status: patient.neo_radio_status === "Done" ? "Done" : "Not done",
      site: firstRadio(patient.neoRadioTable).neo_radio_comp || "",
      dose: firstRadio(patient.neoRadioTable).neo_radio_dose || "",
      frequency: firstRadio(patient.neoRadioTable).neo_radio_freq || "",
      approach: firstRadio(patient.neoRadioTable).neo_radio_route || "",
      cycles: firstRadio(patient.neoRadioTable).neo_radio_cycles || "",
      adverse_effects: firstRadio(patient.neoRadioTable).neo_radio_effects || "",
      notes: firstRadio(patient.neoRadioTable).neo_radio_notes || "",
      sessions: [],
    },
    adjuvant_radiotherapy: {
      status: patient.adj_radio_status === "Done" ? "Done" : "Not done",
      site: firstRadio(patient.adjRadioTable).neo_radio_comp || "",
      dose: firstRadio(patient.adjRadioTable).neo_radio_dose || "",
      frequency: firstRadio(patient.adjRadioTable).neo_radio_freq || "",
      approach: firstRadio(patient.adjRadioTable).neo_radio_route || "",
      cycles: firstRadio(patient.adjRadioTable).neo_radio_cycles || "",
      adverse_effects: firstRadio(patient.adjRadioTable).neo_radio_effects || "",
      notes: firstRadio(patient.adjRadioTable).neo_radio_notes || "",
      sessions: [],
    },
    surgeries: (patient.surgeryTable || []).map((row: any) => ({
      procedure_name: row.surgery_name || "",
      surgery_site: row.surgery_site || "",
      done_date: row.surgery_date || "",
      approach: row.surgery_approach || "",
      icu_entered: patient.icu_done === "Done" ? "Yes" : "No",
      icu_entry_date: patient.icuTable?.[0]?.icu_date || "",
      icu_exit_date: patient.icuTable?.[0]?.icu_exit || "",
      icu_management_notes: patient.icuTable?.[0]?.icu_mgmt || "",
      after_surgery_ward_entry_date: patient.wardTable?.[0]?.ward_entry || "",
      after_surgery_discharged_date: patient.wardTable?.[0]?.ward_exit || "",
      ward_management_notes: patient.wardTable?.[0]?.ward_mgmt || "",
      margin_status: row.margin_status || "",
      complications: (patient.complicationTable || []).map((item: any) => ({
        complication_name: item.complication || "",
        significant_amount: "",
        duration: item.post_op_duration || "",
        notes: [item.management, item.notes].filter(Boolean).join("; "),
      })),
      monitoring: (patient.monitoringTable || []).map((item: any) => ({
        post_op_day_no: item.monitor_duration || "",
        parameter: item.monitor_param || "",
        findings: [item.monitor_findings, item.monitor_notes].filter(Boolean).join("; "),
      })),
      other_surgical_notes: [row.surgery_findings, row.surgery_notes].filter(Boolean).join("; "),
    })),
    staging_details: patient.staging_details?.length
      ? patient.staging_details
      : [{ staging_system_name: patient.tnm_stage ? "TNM" : "Other", overall_stage: patient.overall_stage || patient.tnm_stage || "", staging_notes: "" }],
    histological_staging_details: patient.histological_staging_details || [],
    follow_up_notes: patient.follow_up_notes
      ? [{ date: updatedDate, findings: [String(patient.follow_up_notes)] }]
      : [],
    created_at: patient.createdAt || "",
    updated_at: patient.updatedAt || "",
    audit_trail: patient.audit_trail || [],
  };
}
