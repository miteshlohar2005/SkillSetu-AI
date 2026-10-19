import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import PageTransition from "../components/PageTransition";
import { ScrollReveal } from "../components/ScrollReveal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaTimesCircle,
  FaCheckCircle,
  FaFilePdf,
  FaBrain,
  FaArrowRight,
  FaMicrophone,
  FaFileUpload,
  FaShieldAlt,
  FaGraduationCap,
  FaSlidersH,
  FaSyncAlt,
} from "react-icons/fa";
import {
  BsShieldCheck,
  BsShieldX,
  BsCheck2Circle,
  BsStars,
  BsBarChartLineFill,
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { generatePortalComparisonPDF } from "../utils/pdfGenerator";

const COMPARISON_CATEGORIES = [
  { id: "all", label: "All Architectural Differentiators", icon: BsStars },
  { id: "competency", label: "Competency & AI Diagnostics", icon: FaBrain },
  { id: "pathway", label: "Pathways & iGOT Integration", icon: FaGraduationCap },
  { id: "assessment", label: "Quizzes & Oral Viva Voce", icon: FaMicrophone },
  { id: "content", label: "AI Document-to-MCQ Studio", icon: FaFileUpload },
  { id: "governance", label: "Governance & Executive Admin", icon: FaShieldAlt },
];

const COMPARISON_ITEMS = [
  {
    id: "cadre-competency",
    category: "competency",
    title: "Official Cadre Competency Mapping",
    tag: "Core Framework",
    impact: "+100% Cadre Alignment",
    legacy: {
      headline: "Generic, Unsegmented Training Catalogs",
      description:
        "Traditional portals offer generic, one-size-fits-all training modules without differentiation between ISS, SSS, Field Operations (FOD), or State DES roles.",
      flaws: [
        "No cadre-specific competency standards",
        "Generic IT or administrative courses with zero official statistical relevance",
        "Subjective or absent role requirements",
      ],
    },
    sankhya: {
      headline: "Standardized 4-Domain Competency Matrix",
      description:
        "SkillSetu AI maps every officer against 4 official domains: Statistical Competencies (SNA, CPI, PLFS), Technical & Computational, Digital Governance (DPDP), and Managerial Leadership.",
      benefits: [
        "12,500+ statistical cadre positions mapped",
        "Role-tailored benchmarks for ISS, SSS, FOD, and State DES",
        "Dynamic recalculation as officers undergo new training modules",
      ],
    },
  },
  {
    id: "gap-diagnostics",
    category: "competency",
    title: "Skill-Gap Diagnostics & Detection Engine",
    tag: "AI Neural Diagnostic",
    impact: "6 Months -> 15 Seconds",
    legacy: {
      headline: "Subjective Annual Paper ACR / APAR Records",
      description:
        "Skill deficits are traditionally identified through annual performance appraisal appraisals or subjective self-nominations, taking up to 6 months.",
      flaws: [
        "Lagged annual evaluations with high human bias",
        "Zero automated quantitative scoring of domain weaknesses",
        "No actionable remediation plan mapped to training courses",
      ],
    },
    sankhya: {
      headline: "SkillSetu AI Neural Gap Detection (<75% Benchmark)",
      description:
        "Automatically identifies specific micro-competency deficits using AI inference and diagnostic quizzes, categorizing gaps into High, Medium, and Foundational priorities.",
      benefits: [
        "Instant deficit visualization with interactive bar charts",
        "Prioritized action targets mapped to accredited learning modules",
        "Automated alerts for critical knowledge gaps (<50%)",
      ],
    },
  },
  {
    id: "adaptive-pathways",
    category: "pathway",
    title: "Curated Learning Pathways (iGOT + NSSTA)",
    tag: "Closed-Loop Learning",
    impact: "95% Faster Skill Mastery",
    legacy: {
      headline: "Passive Search Repositories & Disjointed Training",
      description:
        "Officers are forced to manually search massive course repositories like generic LMS catalogs, with zero linkage to in-person training academy schedules.",
      flaws: [
        "Officers struggle to identify which courses match their deficits",
        "No sequential curriculum or prerequisite validation",
        "Complete disconnect between digital courses and NSSTA residential workshops",
      ],
    },
    sankhya: {
      headline: "Synthesized Sequential Pathways (iGOT API + NSSTA TPAC)",
      description:
        "Synthesizes an intelligent, sequential training pathway ordering digital self-paced iGOT courses and residential NSSTA TPAC workshops by prerequisite difficulty.",
      benefits: [
        "Direct integration with iGOT Karmayogi course catalog",
        "Coordinated with NSSTA in-service residential programmes",
        "Closed-loop tracking: course completion updates competency levels",
      ],
    },
  },
  {
    id: "viva-voce",
    category: "assessment",
    title: "Oral Examination & Viva Voce Simulation",
    tag: "Oral Board AI",
    impact: "First-in-Government AI Board",
    legacy: {
      headline: "Non-Existent in Digital Form (Manual In-Person Only)",
      description:
        "Government digital portals solely support basic text multiple-choice questions. Oral viva examinations can only occur during infrequent in-person boards.",
      flaws: [
        "No capacity for remote viva voce practice",
        "Zero objective feedback on verbal articulation or methodology explanation",
        "Logistical constraints limit oral interviews to once every few years",
      ],
    },
    sankhya: {
      headline: "Real-Time AI Oral Board Viva Voce with Voice STT",
      description:
        "Officers speak verbally into their microphone. The AI oral board transcribes speech in real time, evaluates conceptual precision using Google Gemini, and delivers live spoken feedback.",
      benefits: [
        "Realistic voice speech recognition and audio response",
        "Official scoring across Conceptual Correctness, Clarity, and Cadre Alignment",
        "Instant downloadable MoSPI Viva Voce PDF Scorecard",
      ],
    },
  },
  {
    id: "mcq-studio",
    category: "content",
    title: "Official Document-to-MCQ Studio",
    tag: "Curriculum Generation",
    impact: "30-Second Question Authoring",
    legacy: {
      headline: "Months-Long Manual Question Committee Authoring",
      description:
        "Creating new test questions from recently released survey manuals, methodology changes, or statistical circulars requires multiple administrative committees.",
      flaws: [
        "Questions are outdated by the time they are published",
        "Immense manual workload on faculty members",
        "Limited question variation and lack of pedagogical explanations",
      ],
    },
    sankhya: {
      headline: "Instant Document & Circular Text-to-MCQ Generation",
      description:
        "Trainers upload any official survey manual, circular, or methodology brief (PDF/TXT). The AI extracts key statistical principles and generates 4-option MCQs with pedagogical rationales.",
      benefits: [
        "Instant question generation directly from new MoSPI circulars",
        "Pedagogical explanations for correct and incorrect choices",
        "Direct publication into the national cadre question bank",
      ],
    },
  },
  {
    id: "practicum-assignments",
    category: "assessment",
    title: "Real-World Practicum & Survey Case Studies",
    tag: "Methodological Practicum",
    impact: "Automated 4-Criterion Rubric",
    legacy: {
      headline: "Theoretical Multiple Choice or Paper Submissions",
      description:
        "Traditional evaluations stop at memorization MCQs. Practical case studies (e.g., NSSO multi-stage sampling, SNA GDP compilation) require manual paper grading.",
      flaws: [
        "Slow grading cycles spanning weeks or months",
        "Inconsistent marking between different regional evaluators",
        "Little to no specific methodology correction provided to the officer",
      ],
    },
    sankhya: {
      headline: "AI-Evaluated Case Studies with Immediate Competency Boost",
      description:
        "Officers submit structured methodology briefs and data solutions. The AI evaluates submissions against an official 100-mark rubric and awards immediate competency score boosts.",
      benefits: [
        "Standardized 4-criterion grading: Methodology, Analytical Depth, Policy Context, Precision",
        "Granular constructive feedback highlighting exact calculation adjustments",
        "Real-time update to the officer's verified profile and learning pathway",
      ],
    },
  },
  {
    id: "proctoring-guard",
    category: "assessment",
    title: "AI Anti-Cheating & Live Proctoring Guard",
    tag: "Exam Integrity Guard",
    impact: "100% Tamper-Resistant Assessments",
    legacy: {
      headline: "Unmonitored, Cheat-Prone Online Questionnaires",
      description:
        "Conventional government learning portals permit unmonitored browser tabs, allowing candidates to freely switch tabs, search answers on external search engines, or copy-paste responses.",
      flaws: [
        "Zero tab-change or window unfocus detection",
        "Unrestricted clipboard copy-paste and inspect-element access",
        "High prevalence of unverified scores distorting promotion & training audits",
      ],
    },
    sankhya: {
      headline: "Multi-Layered Proctoring: Tab-Switch Counter & Clipboard Shield",
      description:
        "Engineered with statutory assessment integrity: real-time tab switch tracking with violation counters, right-click and clipboard locking, prohibited shortcut interception, and auto-submission safeguards.",
      benefits: [
        "Accurate live tab change detection with audio-visual violation counters",
        "Hardware and browser-level right-click and clipboard copy/paste locking",
        "Transparent proctoring log embedded directly into verified assessment scorecards",
      ],
    },
  },
  {
    id: "performance-dossier",
    category: "governance",
    title: "Verifiable Official Performance Dossier (PDF)",
    tag: "Statutory Documentation",
    impact: "Tamper-Evident & Verifiable",
    legacy: {
      headline: "Generic Attendance Certificates",
      description:
        "Portals typically issue a generic certificate of participation showing only course title and date, with zero granular competency evidence.",
      flaws: [
        "No evidence of acquired skills or domain proficiency",
        "Unusable by promotion committees or cadre administrators",
        "Easily fabricated and lacks cryptographic verification standards",
      ],
    },
    sankhya: {
      headline: "Official MoSPI • NSSTA Competency Dossier (PDF)",
      description:
        "Generates multi-page official performance dossiers featuring deep navy government banners, Indian tricolor ribbon, competency score matrices, priority gap breakdowns, and national verification seals.",
      benefits: [
        "Verifiable documentation for promotions, deputations, and postings",
        "Complete historical log of viva scores, case studies, and quizzes",
        "Standardized across all MoSPI, NSSO, CSO, and DES directorates",
      ],
    },
  },
  {
    id: "copilot-tutor",
    category: "pathway",
    title: "24/7 Contextual Domain AI Assistant (SkillSetu Copilot)",
    tag: "Generative AI Domain Tutor",
    impact: "Zero Wait-Time Tutoring",
    legacy: {
      headline: "Static FAQ Pages or Slow Email Helpdesks",
      description:
        "When an officer struggles with complex sampling estimation formulas or National Accounts sequencing, they have no digital assistance.",
      flaws: [
        "Support tickets take days or weeks for basic methodology questions",
        "Generic search engines give private-sector answers irrelevant to official government statistics",
        "Zero voice or speech-to-text accessibility",
      ],
    },
    sankhya: {
      headline: "SkillSetu Copilot Official Statistics Domain AI",
      description:
        "A 24/7 intelligent copilot trained on official statistical methodologies (SNA 2008, CPI/WPI, PLFS, ASI, UN-NQAF) offering step-by-step explanations and voice interactions.",
      benefits: [
        "Multi-turn conversational reasoning in English & Hindi",
        "Integrated code syntax highlighting for statistical computing (R, Python, Stata)",
        "Instant contextual guidance linked to recommended iGOT courses",
      ],
    },
  },
  {
    id: "executive-oversight",
    category: "governance",
    title: "Executive Administrative Analytics & Live Dispatch",
    tag: "Governance & Oversight",
    impact: "100% Real-Time Cadre Visibility",
    legacy: {
      headline: "Delayed Spreadsheets & Fragmented DES Records",
      description:
        "Training academies rely on quarterly Excel consolidations from State Directorates of Economics and Statistics (DES), resulting in blind spots.",
      flaws: [
        "No centralized visibility into nation-wide statistical competency health",
        "Manual communication channels for dispatching specialized training material",
        "Inability to detect regional statistical skill deficits proactively",
      ],
    },
    sankhya: {
      headline: "Executive Admin Portal with Heatmaps & Live Support",
      description:
        "Centralized executive intelligence hub displaying cadre distributions, departmental competency heatmaps, real-time study material requisition dispatch, and live officer chat.",
      benefits: [
        "Department-level heatmaps identifying vulnerable directorates",
        "One-click study material dispatch with automatic officer notification",
        "Real-time bidirectional support desk between NSSTA trainers and field officers",
      ],
    },
  },
  {
    id: "dpdp-governance",
    category: "governance",
    title: "Data Protection & DPDP Act 2023 Compliance",
    tag: "Regulatory Compliance",
    impact: "100% Statutory Compliance",
    legacy: {
      headline: "Non-Compliant Legacy Databases & Data Silos",
      description:
        "Older portals often store officer details and scores in unencrypted databases without adherence to modern Indian privacy statutes.",
      flaws: [
        "Non-compliance with Digital Personal Data Protection (DPDP) Act 2023",
        "No statistical disclosure control (SDC) for public dashboards",
        "Lack of standardized cryptographic two-factor authentication (2FA)",
      ],
    },
    sankhya: {
      headline: "MeghRaj Government Cloud & DPDP Compliant Architecture",
      description:
        "Engineered with strict statutory compliance: 6-digit cryptographic OTP authentication, k-anonymity disclosure controls, rate limiting, and MeghRaj Cloud alignment.",
      benefits: [
        "Secure 2FA OTP verification on signup and session resumption",
        "Strict role-based access control (Learner, Trainer, Administrator)",
        "Certified alignment with CERT-In security advisories and UN-NQAF",
      ],
    },
  },
  {
    id: "job-readiness",
    category: "competency",
    title: "Job Readiness & Cadre Deployment Audit",
    tag: "Target Cadre Audit",
    impact: "Objective Deployment Matching",
    legacy: {
      headline: "Subjective Postings Without Readiness Verification",
      description:
        "Officers are deployed to critical divisions (e.g. National Accounts Division, Price Statistics Division) based on seniority rather than verified domain competencies.",
      flaws: [
        "High risk of assigning officers to complex roles without prerequisite training",
        "No objective audit metric verifying whether an officer meets role benchmarks",
        "Wasted training budgets on mismatched postings",
      ],
    },
    sankhya: {
      headline: "Automated Job Readiness Scoring & Deployment Audit",
      description:
        "Simulates readiness scores for prospective postings, showing exact domain gaps, required remedial courses, and estimated time to full operational readiness.",
      benefits: [
        "Objective percentage score for any target cadre role (e.g., Director of SNA)",
        "Prioritized remediation requirements before posting takes place",
        "Reduces transition onboarding time from 9 months to under 4 weeks",
      ],
    },
  },
  {
    id: "engagement-loop",
    category: "assessment",
    title: "Closed-Loop Adaptive Learner Remediation",
    tag: "Adaptive Loop",
    impact: "Zero Learner Left Behind",
    legacy: {
      headline: "Linear, One-Way Delivery Without Remediation",
      description:
        "If a learner fails a module or assessment, the portal merely marks it as 'Failed' without diagnosing the cause or offering an adaptive path.",
      flaws: [
        "High drop-out rates and disengagement among field officers",
        "No second chance or adaptive re-testing of weak concepts",
        "Learners repeat entire 40-hour modules instead of addressing specific gaps",
      ],
    },
    sankhya: {
      headline: "Continuous Micro-Remediation & Adaptive Re-Testing",
      description:
        "Every failed question or viva response triggers an immediate micro-remediation suggestion, adjusting the learner's personalized pathway to reinforce that specific weakness.",
      benefits: [
        "Micro-learning units targeted directly at missed concepts",
        "Adaptive re-testing via targeted diagnostic quizzes",
        "Boosts official certification pass rates by over 42%",
      ],
    },
  },
];

const PortalDifference = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedItems, setExpandedItems] = useState({ "cadre-competency": true, "gap-diagnostics": true });
  const [officerCount, setOfficerCount] = useState(2500);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState("sankhya");

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return COMPARISON_ITEMS;
    return COMPARISON_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleDownloadComparisonReport = () => {
    toast.success("Generating Official Architectural Comparison Report (PDF)... 📄");
    generatePortalComparisonPDF({ user: userData });
  };

  const hoursSaved = Math.round(officerCount * 38);
  const daysReduced = 175;
  const budgetOptimizedLakhs = Math.round((officerCount * 4500) / 100000);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <PageTransition>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-12">
          <div className="flex items-center justify-between gap-4">
            <BackButton to="/" label="Back to Portal Overview" />
            <button
              onClick={handleDownloadComparisonReport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FaFilePdf className="text-rose-600" size={13} />
              <span>{t("portalDiff.exportAudit")}</span>
            </button>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-12 shadow-2xl border border-blue-900/50">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            <div className="absolute top-1/4 -right-16 w-80 h-80 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 -left-16 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                <BsShieldCheck size={14} className="text-emerald-400" />
                <span>{t("portalDiff.badge")}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
                {t("portalDiff.title")}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {t("portalDiff.subtitle")}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const el = document.getElementById("comparison-matrix");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <BsCheck2Circle size={15} />
                  <span>{t("portalDiff.inspectMatrix")}</span>
                </button>

                <button
                  onClick={handleDownloadComparisonReport}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FaFilePdf size={14} className="text-rose-400" />
                  <span>{t("portalDiff.exportAudit")}</span>
                </button>
              </div>
            </div>
          </section>

          <ScrollReveal direction="up" delay={0.05}>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Diagnostic Turnaround
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  95% Faster
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                  6 Months reduced to 15 Minutes
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Domain Integration
                </span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  4 Domains
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                  Statistical, Computing, DPDP, Leadership
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Remediation Model
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  100% Closed Loop
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                  Automated iGOT + NSSTA Pathway Sync
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Oral Viva Voce
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-500">
                  AI Voice Board
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                  Real-time Speech Recognition & Scoring
                </span>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.08}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-200/80 dark:border-rose-950/60 p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-rose-100 dark:border-rose-950 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center font-black">
                      <BsShieldX size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
                        Existing State
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Legacy Government Training Portals
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-900 uppercase">
                    Fragmented
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Traditional learning systems are passive repositories where courses are cataloged with no direct connection to cadre benchmarks, annual ACR/APAR records, or actual field needs.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Static course catalogs</strong> requiring manual keyword searching with high drop-off rates.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Zero oral examination capability</strong>; strictly limited to basic text multiple-choice tests.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>No automated skill-gap analysis</strong>; training is self-nominated or arbitrary.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Months of delay</strong> when updating syllabus or publishing new survey manuals.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaTimesCircle className="text-rose-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Generic attendance slips</strong> with no verifiable competency breakdown.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  <strong>Outcome:</strong> High administrative costs, unmeasured skill improvements, and persistent knowledge deficits in critical statistical divisions.
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-blue-900/15 via-white dark:via-slate-900 to-indigo-900/15 border-2 border-blue-500/80 dark:border-blue-500/50 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-blue-100 dark:border-blue-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">
                      <BsShieldCheck size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Next-Gen Intelligence OS
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        SkillSetu AI Platform
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 uppercase">
                    Closed-Loop
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  An integrated, end-to-end capacity building OS that continuously benchmarks officer skills, diagnoses exact deficits, synthesizes personalized roadmaps, and conducts live voice viva voce examinations.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>SkillSetu AI Neural Engine</strong> accurately maps competencies and prioritizes gaps.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Real-time Voice Viva Voce</strong> oral examination with speech recognition & Google Gemini.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Curated iGOT & NSSTA Pathways</strong> automatically sequenced to resolve detected gaps.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>AI Document-to-MCQ Studio</strong>: instant test authoring from new survey circulars.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span><strong>Verifiable MoSPI Performance Dossier (PDF)</strong> with national seal & QR code.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                  <strong>Outcome:</strong> Measurable statistical capacity boost, continuous cadre readiness, and 100% alignment with national data governance standards.
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    <FaSyncAlt size={11} className="text-blue-600" />
                    <span>Lifecycle Process Contrast</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Operational Workflow: Legacy vs SkillSetu AI
                  </h2>
                </div>

                <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveWorkflowTab("sankhya")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeWorkflowTab === "sankhya"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    SkillSetu AI Flow (Closed-Loop)
                  </button>
                  <button
                    onClick={() => setActiveWorkflowTab("legacy")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeWorkflowTab === "legacy"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Legacy Flow (Bottlenecked)
                  </button>
                </div>
              </div>

              {activeWorkflowTab === "sankhya" ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900 space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Intake Quiz & Viva Voce
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Officer completes a 10-minute diagnostic quiz and oral viva board to establish an objective baseline.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900 space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Instant AI Gap Diagnostics
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      SkillSetu AI detects specific microdata, sampling, or DPDP deficits against the 75% cadre standard.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900 space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Synthesized Pathway Execution
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Curated digital courses (iGOT) & physical workshops (NSSTA TPAC) are undertaken in logical sequence.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900 space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Re-Evaluation & PDF Dossier
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Completed case studies immediately update competency scores and export verifiable MoSPI dossiers.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900 space-y-2 opacity-85">
                    <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Annual Paper ACR / APAR
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Subjective annual reviews with months of delay and zero granular skill quantification.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900 space-y-2 opacity-85">
                    <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Manual Self-Nomination
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Officers randomly browse course catalogs without understanding what matches their true weaknesses.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900 space-y-2 opacity-85">
                    <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Passive Video Watching
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hours of unmonitored video playback with high drop-off rates and no oral or practical assessment.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900 space-y-2 opacity-85">
                    <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Unverified Certificate
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Basic attendance certificate issued with zero feedback on whether the officer actually mastered the competency.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </ScrollReveal>

          <section id="comparison-matrix" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <BsBarChartLineFill size={11} />
                  <span>Granular Technical Breakdown</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  12 Key Architectural Differentiators
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Select a category filter or click any card to inspect detailed capability comparisons.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {COMPARISON_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Icon size={12} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {filteredItems.map((item, index) => {
                const isExpanded = Boolean(expandedItems[item.id]);
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:border-blue-400 transition-all"
                  >
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                              {item.title}
                            </h3>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.sankhya.headline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.impact}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold"
                        >
                          {isExpanded ? "−" : "+"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2.5">
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                            <FaTimesCircle size={13} />
                            <span>Legacy Government Training Portal</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.legacy.description}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            {item.legacy.flaws.map((flaw, fIdx) => (
                              <div key={fIdx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                <span className="text-rose-500 font-bold">•</span>
                                <span>{flaw}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-2.5">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
                            <FaCheckCircle size={13} className="text-emerald-500" />
                            <span>SkillSetu AI Intelligence Platform</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.sankhya.description}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            {item.sankhya.benefits.map((benefit, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                <BsCheck2Circle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <ScrollReveal direction="up" delay={0.1}>
            <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6 border border-blue-800/40">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase">
                  <FaSlidersH size={12} />
                  <span>Cadre Scale & ROI Simulator</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Interactive National Statistical Impact Calculator
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Simulate the quantifiable efficiency gains of deploying SkillSetu AI across your target cadre size (e.g. NSSO, CSO, State DES officers).
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span>Selected Cadre Size:</span>
                  <span className="text-lg font-black text-amber-300">
                    {officerCount.toLocaleString("en-IN")} Statistical Officers
                  </span>
                </div>

                <input
                  type="range"
                  min="200"
                  max="15000"
                  step="100"
                  value={officerCount}
                  onChange={(e) => setOfficerCount(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Pilot Cadre (200)</span>
                  <span>National Statistical Cadre (7,500)</span>
                  <span>All State DES Combined (15,000)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Diagnostic Hours Saved / Year
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {hoursSaved.toLocaleString("en-IN")} hrs
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1 block">
                    Automated testing & scoring
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Skill Gap Turnaround Speedup
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">
                    {daysReduced} Days Faster
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1 block">
                    Real-time vs annual ACR appraisals
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Admin Cost Optimization
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-300">
                    ₹{budgetOptimizedLakhs} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1 block">
                    Paperwork, logistics & manual viva boards
                  </span>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="scale" delay={0.1}>
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    <HiSparkles className="text-amber-500" size={13} />
                    <span>Live Verification</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Experience the SkillSetu AI Difference Live
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Test each innovative capability directly in the platform. No demo placeholders — full real-time speech recognition, AI assessment, and official PDF generation.
                  </p>
                </div>

                <button
                  onClick={handleDownloadComparisonReport}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <FaFilePdf size={14} className="text-rose-300" />
                  <span>Download Comparative Dossier (PDF)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div
                  onClick={() => navigate("/competencies")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 cursor-pointer transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaBrain size={14} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>1. Competencies</span>
                    <FaArrowRight size={10} className="text-slate-400 group-hover:text-blue-500" />
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Explore the 4 official MoSPI domains and gap benchmarks.
                  </p>
                </div>

                <div
                  onClick={() => navigate("/interview")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 cursor-pointer transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaMicrophone size={14} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>2. AI Oral Viva</span>
                    <FaArrowRight size={10} className="text-slate-400 group-hover:text-indigo-500" />
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Practice real-time speech-to-text oral board examinations.
                  </p>
                </div>

                <div
                  onClick={() => navigate("/materials")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 cursor-pointer transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaFileUpload size={14} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>3. MCQ Studio</span>
                    <FaArrowRight size={10} className="text-slate-400 group-hover:text-purple-500" />
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Extract text from survey circulars to author MCQs in seconds.
                  </p>
                </div>

                <div
                  onClick={() => navigate("/learning-path")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 cursor-pointer transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaGraduationCap size={14} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>4. iGOT Pathway</span>
                    <FaArrowRight size={10} className="text-slate-400 group-hover:text-emerald-500" />
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Inspect dynamically sequenced digital & in-service modules.
                  </p>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </main>
      </PageTransition>

      <Footer />
    </div>
  );
};

export default PortalDifference;
