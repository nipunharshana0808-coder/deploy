export const STAGING_OPTIONS: Record<
  string,
  { stage: string; description: string }[]
> = {
  TNM: [
    { stage: "Stage 0", description: "Carcinoma in situ / Non-invasive" },
    { stage: "Stage I", description: "Early form, localized to primary organ" },
    {
      stage: "Stage II",
      description: "Locally advanced, larger tumor but no distant spread",
    },
    {
      stage: "Stage III",
      description:
        "Locally/regionally advanced, usually with lymph node involvement",
    },
    {
      stage: "Stage IV",
      description: "Advanced disease with distant metastasis",
    },
  ],
  FIGO: [
    { stage: "Stage I", description: "Strictly confined to organ of origin" },
    {
      stage: "Stage II",
      description: "Extension beyond primary organ but within pelvis",
    },
    {
      stage: "Stage III",
      description: "Extension to pelvic wall or nodes, or lower vagina",
    },
    {
      stage: "Stage IV",
      description: "Beyond true pelvis or involving bladder/bowel mucosa",
    },
  ],
  Duke: [
    {
      stage: "Duke A",
      description: "Invasion into but not through the bowel wall",
    },
    {
      stage: "Duke B",
      description: "Invasion through the bowel wall, no lymph node metastasis",
    },
    { stage: "Duke C", description: "Involvement of regional lymph nodes" },
    { stage: "Duke D", description: "Widespread distant metastasis" },
  ],
  "Ann Arbor": [
    {
      stage: "Stage I",
      description: "Single lymph node region or localized extralymphatic site",
    },
    {
      stage: "Stage II",
      description: "Two or more lymph node regions on same side of diaphragm",
    },
    {
      stage: "Stage III",
      description: "Lymph node regions on both sides of diaphragm",
    },
    {
      stage: "Stage IV",
      description: "Disseminated involvement of extralymphatic organs",
    },
  ],
  "Binet / Rai": [
    {
      stage: "Binet A / Rai 0",
      description: "Lymphocytosis, no anemia/thrombocytopenia (Low risk)",
    },
    {
      stage: "Binet B / Rai I-II",
      description: "Multiple lymph nodes involved, hepatosplenomegaly",
    },
    {
      stage: "Binet C / Rai III-IV",
      description: "Anemia and/or thrombocytopenia present (High risk)",
    },
  ],
  "ISS / R-ISS": [
    { stage: "Stage I", description: "Low B2-microglobulin, high albumin" },
    {
      stage: "Stage II",
      description: "Intermediate risk (Not stage I or III)",
    },
    { stage: "Stage III", description: "High B2-microglobulin (High risk)" },
  ],
  Gleason: [
    {
      stage: "Grade Group 1",
      description: "Score ≤ 6 - Low risk, slow growing",
    },
    {
      stage: "Grade Group 2",
      description: "Score 3+4=7 - Favorable intermediate risk",
    },
    {
      stage: "Grade Group 3",
      description: "Score 4+3=7 - Unfavorable intermediate risk",
    },
    { stage: "Grade Group 4", description: "Score 8 - High risk" },
    { stage: "Grade Group 5", description: "Score 9-10 - Very high risk" },
  ],
  "Breslow / Clark": [
    { stage: "Level I", description: "In situ, confined to epidermis" },
    { stage: "Level II", description: "Invasion into papillary dermis" },
    { stage: "Level III", description: "Filling papillary dermis" },
    { stage: "Level IV", description: "Invasion into reticular dermis" },
    { stage: "Level V", description: "Invasion into subcutaneous tissue" },
  ],
  "Masaoka-Koga": [
    {
      stage: "Stage I",
      description:
        "Macroscopically and microscopically completely encapsulated",
    },
    {
      stage: "Stage II",
      description:
        "Macroscopic invasion into surrounding fat or microscopic capsular invasion",
    },
    {
      stage: "Stage III",
      description: "Macroscopic invasion into neighboring organs",
    },
    {
      stage: "Stage IV",
      description: "Pleural/pericardial dissemination or distant metastasis",
    },
  ],
  Enneking: [
    {
      stage: "Stage I",
      description:
        "Low grade, intracompartmental (IA) or extracompartmental (IB)",
    },
    {
      stage: "Stage II",
      description:
        "High grade, intracompartmental (IIA) or extracompartmental (IIB)",
    },
    {
      stage: "Stage III",
      description: "Any grade with regional or distant metastasis",
    },
  ],
  BCLC: [
    {
      stage: "Stage 0",
      description: "Very Early - Single tumor <2cm, preserved liver function",
    },
    {
      stage: "Stage A",
      description:
        "Early - Single tumor or ≤3 nodules <3cm, preserved liver function",
    },
    {
      stage: "Stage B",
      description: "Intermediate - Multinodular, preserved liver function",
    },
    {
      stage: "Stage C",
      description: "Advanced - Portal invasion or extrahepatic spread",
    },
    { stage: "Stage D", description: "Terminal - End-stage liver function" },
  ],
  Lugano: [
    {
      stage: "Stage I",
      description: "One lymph node region or one extralymphatic organ",
    },
    {
      stage: "Stage II",
      description: "Two or more lymph node regions on same side of diaphragm",
    },
    {
      stage: "Stage III",
      description: "Lymph node regions on both sides of diaphragm",
    },
    {
      stage: "Stage IV",
      description: "Disseminated extralymphatic involvement",
    },
  ],
  PRETEXT: [
    {
      stage: "PRETEXT I",
      description: "Three adjoining sectors of liver are free of tumor",
    },
    {
      stage: "PRETEXT II",
      description: "Two adjoining sectors of liver are free of tumor",
    },
    {
      stage: "PRETEXT III",
      description: "One free sector, or two non-adjoining free sectors",
    },
    {
      stage: "PRETEXT IV",
      description: "No free liver sectors, all 4 sectors affected",
    },
  ],
  INSS: [
    { stage: "Stage 1", description: "Localized tumor, completely excised" },
    { stage: "Stage 2A", description: "Localized tumor, incompletely excised" },
    {
      stage: "Stage 2B",
      description: "Localized tumor, ipsilateral nodes positive",
    },
    {
      stage: "Stage 3",
      description:
        "Unresectable unilateral tumor across midline or bilateral nodes",
    },
    {
      stage: "Stage 4",
      description: "Dissemination to distant nodes, bone, marrow, liver",
    },
    {
      stage: "Stage 4S",
      description:
        "Localized primary with spread to liver, skin, or marrow (<1yr old)",
    },
  ],
  Murphy: [
    { stage: "Stage I", description: "Single tumor/node completely resected" },
    {
      stage: "Stage II",
      description: "Regional nodes or completely resected GI tract involvement",
    },
    {
      stage: "Stage III",
      description:
        "Unresectable intra-abdominal, paraspinal, or intrathoracic tumor",
    },
    { stage: "Stage IV", description: "Bone marrow and/or CNS involvement" },
  ],
};

export const HISTOLOGICAL_GRADING_OPTIONS: Record<
  string,
  { stage: string; description: string }[]
> = {
  "Broders (WHO General Grading)": [
    { stage: "Grade 1 (G1)", description: "Well differentiated: >75% gland/keratin formation (Low grade)" },
    { stage: "Grade 2 (G2)", description: "Moderately differentiated: 50-75% gland/keratin formation" },
    { stage: "Grade 3 (G3)", description: "Poorly differentiated: 25-50% gland/keratin formation (High grade)" },
    { stage: "Grade 4 (G4)", description: "Undifferentiated / Anaplastic: <25% gland/keratin formation" },
  ],
  "Nottingham Histologic Score": [
    { stage: "Grade I", description: "Score 3-5: Well differentiated / low grade breast carcinoma" },
    { stage: "Grade II", description: "Score 6-7: Moderately differentiated breast carcinoma" },
    { stage: "Grade III", description: "Score 8-9: Poorly differentiated / high grade breast carcinoma" },
  ],
  "Gleason Score": [
    { stage: "Grade Group 1", description: "Gleason Score ≤ 6 (3+3): Well-differentiated, low malignant potential" },
    { stage: "Grade Group 2", description: "Gleason Score 3+4=7: Favorable intermediate-risk prostate cancer" },
    { stage: "Grade Group 3", description: "Gleason Score 4+3=7: Unfavorable intermediate-risk prostate cancer" },
    { stage: "Grade Group 4", description: "Gleason Score 8 (4+4, 3+5, 5+3): Poorly differentiated, high risk" },
    { stage: "Grade Group 5", description: "Gleason Score 9-10: Undifferentiated/Anaplastic, very high risk" },
  ],
  "Fuhrman / ISUP Nuclear Grade": [
    { stage: "Grade 1", description: "Small (~10 µm) round uniform nuclei; absent or inconspicuous nucleoli" },
    { stage: "Grade 2", description: "Larger (~15 µm) slightly irregular nuclei; visible nucleoli at 400x" },
    { stage: "Grade 3", description: "Very large (~20 µm) irregular nuclei; prominent nucleoli at 100x" },
    { stage: "Grade 4", description: "Multilobated / bizarre giant nuclei; sarcomatoid spindle features" },
  ],
  "WHO CNS Tumor Grade": [
    { stage: "WHO Grade I", description: "Low proliferative potential, discrete borders, frequently resectable" },
    { stage: "WHO Grade II", description: "Generally infiltrative, low proliferative activity, tends to recur" },
    { stage: "WHO Grade III", description: "Histological malignancy: mitotic activity and distinct nuclear atypia" },
    { stage: "WHO Grade IV", description: "Highly malignant: rapid mitotic rate, vascular necrosis, microvascular proliferation" },
  ],
  "FNCLCC Sarcoma Grade": [
    { stage: "FNCLCC Grade 1", description: "Low grade: well-differentiated, low mitotic count (<10 per 10 HPF)" },
    { stage: "FNCLCC Grade 2", description: "Intermediate grade: moderately-differentiated, some necrosis" },
    { stage: "FNCLCC Grade 3", description: "High grade: poorly differentiated, high mitotic count, extensive necrosis" },
  ],
  "Edmondson-Steiner Grade": [
    { stage: "Grade I", description: "Well differentiated hepatocellular carcinoma; minimal nuclear atypicality" },
    { stage: "Grade II", description: "Moderately-differentiated; prominent nucleoli and distinct atypia" },
    { stage: "Grade III", description: "Poorly-differentiated; pronounced atypia, hyperchromatic giant cells" },
    { stage: "Grade IV", description: "Undifferentiated; sarcomatoid/medullary appearance, highly aggressive" },
  ],
  "GOG Endometrial Grade": [
    { stage: "GOG Grade 1", description: "≤5% of non-squamous/non-morular solid growth pattern" },
    { stage: "GOG Grade 2", description: "6% to 50% non-squamous/non-morular solid growth pattern" },
    { stage: "GOG Grade 3", description: ">50% non-squamous/non-morular solid growth pattern" },
  ],
  "Lauren Classification": [
    { stage: "Intestinal Type", description: "Forms cohesive glandular structures; arises from precursor metaplasia" },
    { stage: "Diffuse Type", description: "Discohesive infiltrating single tumor cells; signet-ring cells, aggressive" },
    { stage: "Mixed Type", description: "Exhibits intermediate characteristics of both tubular and diffuse variants" },
  ],
  "WHO Neuroendocrine Tumor (NET) Group": [
    { stage: "NET Grade 1", description: "Well-differentiated, Ki-67 index <3%, mitotic count <2/10 HPF" },
    { stage: "NET Grade 2", description: "Well-differentiated, Ki-67 index 3-20%, mitotic count 2-20/10 HPF" },
    { stage: "NET Grade 3", description: "Well-differentiated, Ki-67 index >20%, mitotic count >20/10 HPF" },
    { stage: "NEC (Neuroendocrine Carcinoma)", description: "Poorly-differentiated, Ki-67 index >20%, highly aggressive" },
  ],
};
