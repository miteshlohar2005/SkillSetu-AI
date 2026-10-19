export const COMPETENCY_DOMAINS = [
  {
    id: "statistical",
    name: "Statistical Competencies",
    description:
      "Core methodologies, sampling techniques, economic accounting, and indicator governance.",
    competencies: [
      {
        id: "survey_design",
        name: "Survey Design & Methodologies",
        weight: 1.2,
      },
      {
        id: "sampling_techniques",
        name: "Sampling Techniques & Estimation",
        weight: 1.2,
      },
      {
        id: "national_accounts",
        name: "National Accounts & GDP Compilation",
        weight: 1.3,
      },
      {
        id: "price_statistics",
        name: "Price Statistics (CPI, WPI, Inflation)",
        weight: 1.1,
      },
      {
        id: "labour_statistics",
        name: "Labour & Employment Statistics (PLFS)",
        weight: 1.1,
      },
      {
        id: "agricultural_statistics",
        name: "Agricultural & Rural Statistics",
        weight: 1.0,
      },
      {
        id: "industrial_statistics",
        name: "Industrial Statistics (ASI, IIP)",
        weight: 1.1,
      },
      {
        id: "sdg_indicators",
        name: "SDG National Indicator Framework (NIF)",
        weight: 1.2,
      },
      {
        id: "metadata_standards",
        name: "Statistical Metadata & Classifications (NIC, NPC)",
        weight: 1.0,
      },
      {
        id: "data_quality",
        name: "Data Quality Assurance & NQAF",
        weight: 1.2,
      },
    ],
  },
  {
    id: "technical",
    name: "Technical & Computational Competencies",
    description:
      "Statistical computing systems, automated microdata processing, registry linkage, and spatial analytics.",
    competencies: [
      {
        id: "statistical_computing",
        name: "Statistical Computing & Automated Survey Data Processing",
        weight: 1.3,
      },
      {
        id: "microdata_analytics",
        name: "Microdata Analytics & Survey Weighting Methodologies",
        weight: 1.2,
      },
      {
        id: "database_management",
        name: "Statistical Database Systems & Registry Linkage",
        weight: 1.2,
      },
      {
        id: "econometric_modeling",
        name: "Econometric Modeling & Time-Series Analytics",
        weight: 1.0,
      },
      {
        id: "gis_mapping",
        name: "GIS & Geospatial Statistical Mapping",
        weight: 1.1,
      },
      {
        id: "data_visualization",
        name: "Statistical Dashboards & Executive Visual Reporting",
        weight: 1.2,
      },
      {
        id: "ai_ml_statistics",
        name: "Machine Learning & Predictive Statistical Analytics",
        weight: 1.3,
      },
      {
        id: "cloud_apis",
        name: "Government Cloud & Open Data APIs",
        weight: 1.1,
      },
    ],
  },
  {
    id: "digital_governance",
    name: "Digital Governance & Security",
    description:
      "Government IT frameworks, data privacy regulations, MeghRaj cloud, and DPI integration.",
    competencies: [
      {
        id: "cybersecurity_protection",
        name: "Cybersecurity & Data Protection (Cert-In)",
        weight: 1.2,
      },
      {
        id: "data_privacy_ethics",
        name: "Data Privacy, Ethics & Anonymization",
        weight: 1.3,
      },
      {
        id: "digital_public_infra",
        name: "Digital Public Infrastructure & Data Sharing",
        weight: 1.1,
      },
      {
        id: "meghraj_cloud",
        name: "MeghRaj Government Cloud Architecture",
        weight: 1.0,
      },
      {
        id: "digital_signatures",
        name: "e-Sign & Digital Signature Infrastructure",
        weight: 1.0,
      },
    ],
  },
  {
    id: "managerial",
    name: "Behavioural & Managerial Competencies",
    description:
      "Strategic statistical administration, cadre leadership, communication, and project delivery.",
    competencies: [
      {
        id: "statistical_leadership",
        name: "Statistical Leadership & Team Governance",
        weight: 1.2,
      },
      {
        id: "strategic_communication",
        name: "Statistical Dissemination & Communication",
        weight: 1.2,
      },
      {
        id: "project_management",
        name: "Large-Scale Survey Project Management",
        weight: 1.3,
      },
      {
        id: "evidence_decision",
        name: "Evidence-Based Policy & Decision Making",
        weight: 1.3,
      },
      {
        id: "change_management",
        name: "Digital Transformation & Change Management",
        weight: 1.1,
      },
    ],
  },
];

export const ROLE_BENCHMARK_PROFILES = {
  "Indian Statistical Service (ISS) Officer": {
    minScore: 78,
    requiredLevels: {
      "National Accounts & GDP Compilation": "Advanced",
      "Survey Design & Methodologies": "Advanced",
      "SDG National Indicator Framework (NIF)": "Advanced",
      "Statistical Computing & Automated Survey Data Processing":
        "Intermediate",
      "Statistical Dashboards & Executive Visual Reporting": "Advanced",
      "Data Privacy, Ethics & Anonymization": "Advanced",
      "Evidence-Based Policy & Decision Making": "Expert",
      "Statistical Leadership & Team Governance": "Advanced",
    },
  },
  "Senior Statistical Officer (SSO)": {
    minScore: 70,
    requiredLevels: {
      "Survey Design & Methodologies": "Advanced",
      "Sampling Techniques & Estimation": "Advanced",
      "Price Statistics (CPI, WPI, Inflation)": "Advanced",
      "Statistical Computing & Automated Survey Data Processing":
        "Intermediate",
      "Statistical Database Systems & Registry Linkage": "Intermediate",
      "Data Quality Assurance & NQAF": "Advanced",
      "Large-Scale Survey Project Management": "Advanced",
    },
  },
  "Junior Statistical Officer (JSO)": {
    minScore: 60,
    requiredLevels: {
      "Sampling Techniques & Estimation": "Intermediate",
      "Labour & Employment Statistics (PLFS)": "Intermediate",
      "Industrial Statistics (ASI, IIP)": "Intermediate",
      "Statistical Computing & Automated Survey Data Processing":
        "Intermediate",
      "Statistical Database Systems & Registry Linkage": "Intermediate",
      "Statistical Metadata & Classifications (NIC, NPC)": "Intermediate",
    },
  },
  "Field Operations / Investigator (FOD)": {
    minScore: 55,
    requiredLevels: {
      "Survey Design & Methodologies": "Intermediate",
      "Sampling Techniques & Estimation": "Intermediate",
      "Data Quality Assurance & NQAF": "Intermediate",
      "Cybersecurity & Data Protection (Cert-In)": "Intermediate",
      "Digital Public Infrastructure & Data Sharing": "Intermediate",
    },
  },
  "Data Scientist / Statistical Analyst": {
    minScore: 80,
    requiredLevels: {
      "Statistical Computing & Automated Survey Data Processing": "Expert",
      "Microdata Analytics & Survey Weighting Methodologies": "Advanced",
      "Statistical Database Systems & Registry Linkage": "Advanced",
      "Machine Learning & Predictive Statistical Analytics": "Advanced",
      "Statistical Dashboards & Executive Visual Reporting": "Advanced",
      "GIS & Geospatial Statistical Mapping": "Intermediate",
    },
  },
  "Director / Division Head (CSO / NSSO)": {
    minScore: 85,
    requiredLevels: {
      "National Accounts & GDP Compilation": "Expert",
      "Statistical Leadership & Team Governance": "Expert",
      "Evidence-Based Policy & Decision Making": "Expert",
      "Large-Scale Survey Project Management": "Expert",
      "Data Privacy, Ethics & Anonymization": "Advanced",
    },
  },
};

export const CADRE_BENCHMARKS = ROLE_BENCHMARK_PROFILES;

export default {
  COMPETENCY_DOMAINS,
  ROLE_BENCHMARK_PROFILES,
  CADRE_BENCHMARKS,
};
