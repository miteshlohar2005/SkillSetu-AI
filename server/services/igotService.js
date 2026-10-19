import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const aiClient = geminiApiKey
  ? new GoogleGenAI({ apiKey: geminiApiKey })
  : null;

export const IGOT_COURSE_CATALOG = [
  {
    id: "igot-stat-01",
    title: "National Accounts Statistics & SNO Concepts",
    provider: "iGOT Karmayogi (MoSPI)",
    domain: "Statistical Competencies",
    skillAddressed: "National Accounts & GDP Compilation",
    level: "Intermediate",
    duration: "14 Hours",
    rating: 4.8,
    description:
      "Comprehensive introduction to Gross Value Added (GVA), GDP estimation, Supply-Use Tables (SUT), and institutional sector accounts.",
    curriculum: [
      "Macroeconomic Framework",
      "SNA 2008 Guidelines",
      "GVA Compilation by Economic Activity",
      "Quarterly & Annual Estimates",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-stat-01",
  },
  {
    id: "igot-stat-02",
    title: "Periodic Labour Force Survey (PLFS) Methodology",
    provider: "iGOT Karmayogi (NSSO)",
    domain: "Statistical Competencies",
    skillAddressed: "Labour & Employment Statistics (PLFS)",
    level: "Intermediate",
    duration: "10 Hours",
    rating: 4.7,
    description:
      "In-depth understanding of sampling frames, household schedules, activity status classification, and worker population ratios.",
    curriculum: [
      "Sampling Framework of NSSO",
      "Activity Status: Usual vs CWS",
      "Field Investigation Protocol",
      "Data Cleaning & Tabulation",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-stat-02",
  },
  {
    id: "igot-stat-03",
    title: "Price Statistics & Consumer Price Index (CPI) Compilation",
    provider: "iGOT Karmayogi (CSO)",
    domain: "Statistical Competencies",
    skillAddressed: "Price Statistics (CPI, WPI, Inflation)",
    level: "Intermediate",
    duration: "8 Hours",
    rating: 4.9,
    description:
      "Laspeyres index formulas, market price basket selection, elementary price indices, and headline vs core inflation.",
    curriculum: [
      "Item Selection & Base Year Weighting",
      "Rural & Urban Price Collection",
      "Index Imputation Techniques",
      "Dissemination Standards",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-stat-03",
  },
  {
    id: "igot-tech-01",
    title:
      "Automated Statistical Computing & Microdata Processing in Government",
    provider: "iGOT Karmayogi (NIC & MeitY)",
    domain: "Technical & Computational Competencies",
    skillAddressed: "Statistical Computing & Automated Survey Data Processing",
    level: "Beginner to Intermediate",
    duration: "20 Hours",
    rating: 4.9,
    description:
      "Data manipulation, automated survey data cleaning, automated statistical tables, exploratory data analysis for public datasets.",
    curriculum: [
      "Survey Data Structures & Processing",
      "Automated Tabulation for Large Datasets",
      "Data Validation & Missing Values Imputation",
      "Automated Statistical Reports",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-tech-01",
  },
  {
    id: "igot-tech-02",
    title: "Microdata Analytics & Survey Weighting Methodologies",
    provider: "iGOT Karmayogi (NSSTA)",
    domain: "Technical & Computational Competencies",
    skillAddressed: "Microdata Analytics & Survey Weighting Methodologies",
    level: "Advanced",
    duration: "16 Hours",
    rating: 4.8,
    description:
      "Complex survey weighting, standard error estimation, stratification multipliers, and modern analytical workflows.",
    curriculum: [
      "Analytical Workflow",
      "Survey Weights & Multipliers",
      "Regression Modeling on Survey Data",
      "Statistical Visualizations",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-tech-02",
  },
  {
    id: "igot-tech-03",
    title: "Statistical Database Systems & Registry Linkage",
    provider: "iGOT Karmayogi (NIC)",
    domain: "Technical & Computational Competencies",
    skillAddressed: "Statistical Database Systems & Registry Linkage",
    level: "Intermediate",
    duration: "12 Hours",
    rating: 4.6,
    description:
      "Complex statistical queries, database linkage, data integrity constraints, and enterprise statistical registry management.",
    curriculum: [
      "Statistical Data Normalization",
      "Registry Linkage & Aggregation",
      "Window Functions for Aggregates",
      "Data Integrity Standards",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-tech-03",
  },
  {
    id: "igot-gov-01",
    title: "Data Privacy, Ethics & Anonymization in Official Statistics",
    provider: "iGOT Karmayogi (DoPT & MeitY)",
    domain: "Digital Governance & Security",
    skillAddressed: "Data Privacy, Ethics & Anonymization",
    level: "Intermediate",
    duration: "6 Hours",
    rating: 4.9,
    description:
      "DPDP Act compliance, statistical disclosure control (SDC), differential privacy, and microdata release governance.",
    curriculum: [
      "DPDP Act & Principles",
      "Statistical Disclosure Control Methods",
      "k-Anonymity & l-Diversity",
      "Secure Enclaves & Data Licensing",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-gov-01",
  },
  {
    id: "igot-gov-02",
    title: "Cybersecurity Fundamentals for Government Personnel",
    provider: "iGOT Karmayogi (CERT-In)",
    domain: "Digital Governance & Security",
    skillAddressed: "Cybersecurity & Data Protection (Cert-In)",
    level: "Beginner",
    duration: "8 Hours",
    rating: 4.7,
    description:
      "Essential cyber hygiene, protecting survey portals, threat vectors, secure data transmission, and incident reporting.",
    curriculum: [
      "Password & 2FA Governance",
      "Phishing & Social Engineering",
      "Endpoint Security & VPNs",
      "CERT-In Compliance Guidelines",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-gov-02",
  },
  {
    id: "igot-mgmt-01",
    title: "Evidence-Based Decision Making & Public Policy Analytics",
    provider: "iGOT Karmayogi (LBSNAA & MoSPI)",
    domain: "Behavioural & Managerial Competencies",
    skillAddressed: "Evidence-Based Policy & Decision Making",
    level: "Advanced",
    duration: "12 Hours",
    rating: 4.9,
    description:
      "Translating official statistical findings into actionable policy briefs for ministries and state governments.",
    curriculum: [
      "Data-to-Policy Translation",
      "Executive Briefing Drafting",
      "Impact Evaluation Frameworks",
      "Communicating Uncertainty",
    ],
    url: "https://igotkarmayogi.gov.in/app/explore/course/igot-mgmt-01",
  },
];

export const getIgotCourses = async (query = "", domain = "") => {
  let courses = [...IGOT_COURSE_CATALOG];

  if (domain) {
    courses = courses.filter((c) =>
      c.domain.toLowerCase().includes(domain.toLowerCase()),
    );
  }
  if (query) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.skillAddressed.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()),
    );
  }
  return courses;
};

export const getIgotRecommendationsForGaps = (skillGaps = []) => {
  if (!skillGaps || !skillGaps.length) {
    return IGOT_COURSE_CATALOG.slice(0, 4);
  }

  const matchedCourses = [];
  (skillGaps || []).forEach((gap) => {
    if (!gap || !gap.competencyName) return;
    const found = IGOT_COURSE_CATALOG.find(
      (c) =>
        c.skillAddressed
          .toLowerCase()
          .includes(gap.competencyName.toLowerCase()) ||
        gap.competencyName
          .toLowerCase()
          .includes(c.skillAddressed.toLowerCase()),
    );
    if (found && !matchedCourses.some((m) => m.id === found.id)) {
      matchedCourses.push({
        ...found,
        recommendationReason: `SkillSetu AI: Specifically targets ${gap.priority || "Medium"} Priority Gap in ${gap.competencyName} (Current: ${gap.currentLevel || "Beginner"} → Target: ${gap.requiredLevel || "Intermediate"})`,
        gapPriority: gap.priority || "Medium",
      });
    }
  });

  if (matchedCourses.length < 3) {
    IGOT_COURSE_CATALOG.forEach((c) => {
      if (!matchedCourses.some((m) => m.id === c.id)) {
        matchedCourses.push({
          ...c,
          recommendationReason:
            "SkillSetu AI: Recommended foundational capacity building for Official Statistics personnel.",
          gapPriority: "Medium",
        });
      }
    });
  }

  return matchedCourses.slice(0, 6);
};

export default {
  IGOT_COURSE_CATALOG,
  getIgotCourses,
  getIgotRecommendationsForGaps,
};
