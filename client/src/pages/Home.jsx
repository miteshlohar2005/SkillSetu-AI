import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import CountUpModule from "react-countup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthModel from "../components/AuthModel";
import {
  FaUserGraduate,
  FaTasks,
  FaFileAlt,
  FaBrain,
  FaCertificate,
  FaArrowRight,
  FaUserTie,
  FaFilePdf,
  FaLock,
  FaMicrophone,
  FaUsers,
  FaComments,
  FaBookOpen,
  FaChevronDown,
} from "react-icons/fa";
import {
  BsRobot,
  BsBarChartLine,
  BsShieldCheck,
  BsShieldLock,
  BsGrid3X3GapFill,
  BsStars,
} from "react-icons/bs";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import { useDiagnostic } from "../context/DiagnosticContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  ArtButton,
  ArtCard,
  ArtChip,
  ArtSectionHeader,
  ArtBadge,
} from "../components/ArtCraftUI";

const CountUp = CountUpModule.default || CountUpModule;

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const { userData } = useSelector((state) => state.user);
  const {
    diagnosticStatus,
    isIntakePending,
    isPathLocked,
    startDiagnosticQuiz,
    triggerLockedError,
  } = useDiagnostic();

  const isTrainer = Boolean(
    userData?.role === "trainer" || userData?.role === "admin"
  );

  const [trainerMetrics, setTrainerMetrics] = useState({
    totalLearners: 142,
    totalInterviews: 28,
    totalMaterials: 24,
    totalSubmissions: 18,
    pendingMaterialRequests: 4,
    avgCompetency: 84,
  });

  useEffect(() => {
    if (isTrainer) {
      axios
        .get(`${ServerUrl}/api/admin/overview`, { withCredentials: true })
        .then((res) => {
          if (res.data?.success) {
            setTrainerMetrics((prev) => ({
              ...prev,
              totalLearners: res.data.totalLearners ?? prev.totalLearners,
              totalInterviews: res.data.totalInterviews ?? prev.totalInterviews,
              totalMaterials: res.data.totalMaterials ?? prev.totalMaterials,
              totalSubmissions: res.data.totalSubmissions ?? prev.totalSubmissions,
              pendingMaterialRequests:
                res.data.pendingMaterialRequests ?? prev.pendingMaterialRequests,
              avgCompetency: res.data.avgCompetency ?? prev.avgCompetency,
            }));
          }
        })
        .catch((err) => {
          console.error("Error fetching trainer overview metrics:", err);
        });
    }
  }, [isTrainer]);

  const handleProtectedAction = (route, label = "") => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    if (isPathLocked(route)) {
      triggerLockedError(label);
      return;
    }
    navigate(route);
  };

  const handleDownloadSampleDossier = () => {
    toast.success("Generating Official Competency Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData || {
        name: "Cadre Statistical Officer",
        jobRole: "Indian Statistical Service (ISS) Officer",
      },
      profile: userData || {
        name: "Cadre Statistical Officer",
        jobRole: "Indian Statistical Service (ISS) Officer",
        department: "NSSO / MoSPI",
        overallCompetencyScore: 78,
        overallLevel: "Advanced",
      },
      competencies: [
        {
          competencyName: "Sampling Techniques & Estimation",
          domain: "Statistical",
          score: 85,
          level: "Advanced",
        },
        {
          competencyName: "National Accounts (SNA 2008)",
          domain: "Statistical",
          score: 80,
          level: "Advanced",
        },
        {
          competencyName: "Statistical Computing & Automated Processing",
          domain: "Technical",
          score: 45,
          level: "Beginner",
        },
        {
          competencyName: "Price Statistics (CPI/WPI)",
          domain: "Statistical",
          score: 88,
          level: "Expert",
        },
        {
          competencyName: "Data Privacy & DPDP Compliance",
          domain: "Governance",
          score: 72,
          level: "Intermediate",
        },
      ],
      skillGaps: [
        {
          competencyName: "Statistical Computing & Automated Processing",
          priority: "High",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          recommendedAction:
            "Complete Statistical Computing & Microdata Processing 20-Hour Module",
        },
        {
          competencyName: "Microdata Analytics & Survey Weighting",
          priority: "High",
          currentLevel: "Intermediate",
          requiredLevel: "Advanced",
          recommendedAction: "Complete Advanced Sampling & Estimation Masterclass",
        },
      ],
      learningPath: [
        {
          step: 1,
          title: "Automated Statistical Computing & Microdata Processing",
          provider: "SkillSetu Academy",
          skillAddressed: "Statistical Computing",
          duration: "20 Hours",
          priority: "High",
        },
        {
          step: 2,
          title: "Microdata Analytics & Survey Weighting Methodologies",
          provider: "SkillSetu In-Service",
          skillAddressed: "Microdata Analytics",
          duration: "16 Hours",
          priority: "High",
        },
        {
          step: 3,
          title: "Periodic Labour Force Survey (PLFS) Methodology",
          provider: "SkillSetu Specialization",
          skillAddressed: "Labour Statistics",
          duration: "10 Hours",
          priority: "Medium",
        },
      ],
    });
  };

  const faqList = [
    {
      q: "How does the AI Skill Intelligence Platform identify competency gaps?",
      a: "The SkillSetu AI Neural Engine benchmarks the officer's verified profile (role, specialization track, previous training, and multi-domain self-ratings) against standard competency benchmarks. Any score falling below the target standard is classified into High, Medium, or Foundational priority gaps with actionable remediation targets.",
    },
    {
      q: "How are curated digital modules integrated into the learning pathway?",
      a: "The platform dynamically maps each evaluated deficit to verified digital learning courses and in-service professional programmes. The pathway is ordered sequentially from foundational concepts to advanced practical workshops.",
    },
    {
      q: "How does the AI Cadre Mock Interview Bot evaluate oral viva voce answers?",
      a: "Using real-time speech recognition (Speech-to-Text) and Google Gemini AI, the interview studio analyzes spoken answers for conceptual correctness, communication clarity, and confidence. It provides question-by-question scoring and generates an official PDF Scorecard.",
    },
    {
      q: "Can trainers author objective MCQs from custom survey circulars?",
      a: "Yes. In the MCQ Question Studio, trainers can upload any survey manual, circular, or methodology document (PDF/DOCX/TXT). The AI extracts key principles and automatically generates 4-option MCQs with comprehensive pedagogical explanations.",
    },
    {
      q: "How are practical case studies and assignments evaluated?",
      a: "Officers submit written methodology briefs and solutions to real-world scenarios (e.g. sampling design, quarterly GDP revisions). The AI evaluates submissions against a 4-criterion 100-mark rubric and awards immediate competency score boosts.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-20 w-full">
        {/* HERO SECTION */}
        <section className="pt-8 pb-12 space-y-8">
          {/* Overline Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E7EB] font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#101014]">
              <span className="w-2 h-2 rounded-none bg-[#2D81FF]" />
              <span>SkillSetu AI • AI-Powered Skill Intelligence & Capacity Building Platform</span>
            </span>
          </div>

          {/* Hero Headline & Subline */}
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-[-1.08px] text-[#101014] leading-[1.08]">
              Bridge the Skill Gap.{" "}
              <span className="font-serif-emphasis font-normal italic text-4xl sm:text-6xl text-[#101014]">
                Build a Smarter
              </span>{" "}
              Workforce.
            </h1>

            <p className="font-sans text-base sm:text-lg text-[#101014]/70 max-w-3xl mx-auto leading-relaxed">
              An independent, AI-powered workforce development platform providing multi-domain competency mapping, automated skill-gap identification, personalized learning pathways, intelligent quiz generation, and voice-based oral viva evaluations.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <ArtButton
              variant="primary"
              size="md"
              onClick={() =>
                handleProtectedAction("/learning-path", "Learning Path")
              }
              icon={FaCertificate}
              iconRight={FaArrowRight}
            >
              Explore Learning Pathways
            </ArtButton>

            <ArtButton
              variant="secondary"
              size="md"
              onClick={() => handleProtectedAction("/chat", "AI Copilot")}
              icon={BsRobot}
            >
              Launch SkillSetu Copilot
            </ArtButton>

            {!userData ? (
              <ArtButton
                variant="outline"
                size="md"
                onClick={() => navigate("/auth")}
                icon={FaUserGraduate}
              >
                {t("home.signInBtn", "Officer Sign Up / Sign In")}
              </ArtButton>
            ) : isTrainer ? (
              <ArtButton
                variant="primary"
                size="md"
                onClick={() => navigate("/admin")}
                icon={BsShieldLock}
              >
                {t("home.openAdmin", "Open Faculty Portal")}
              </ArtButton>
            ) : (
              <ArtButton
                variant="outline"
                size="md"
                onClick={() =>
                  handleProtectedAction("/dashboard", "Officer Dashboard")
                }
                icon={BsBarChartLine}
              >
                {t("home.openDashboard", "Open Officer Dashboard")}
              </ArtButton>
            )}
          </div>
        </section>

        {/* INTAKE DIAGNOSTIC BANNER IF PENDING */}
        {userData && isIntakePending && !isTrainer && (
          <ArtCard
            variant="surface"
            padding="lg"
            className="border-l-4 border-l-amber-500 bg-white"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ArtBadge variant="danger">Intake Assessment Pending</ArtBadge>
                  <span className="font-mono text-xs text-[#101014]/60">
                    Mandatory Baseline Calibration
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#101014]">
                  Complete Your Cadre Diagnostic Assessments
                </h3>
                <p className="text-xs sm:text-sm text-[#101014]/70 max-w-2xl font-sans">
                  To calibrate your 4-Domain Competency Radar and unlock customized
                  learning modules, complete your baseline Intake Quiz and
                  Speech-to-Text Viva Voce.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ArtButton
                  variant="primary"
                  size="sm"
                  onClick={() => startDiagnosticQuiz(navigate)}
                  icon={FaTasks}
                >
                  Diagnostic Quiz
                </ArtButton>
                <ArtButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/interview?type=intake")}
                  icon={FaMicrophone}
                >
                  Intake Viva Voce
                </ArtButton>
              </div>
            </div>
          </ArtCard>
        )}

        {/* TRAINER VIEW QUICK STATS */}
        {isTrainer && (
          <div className="space-y-4">
            <ArtSectionHeader
              overline="Faculty Management"
              title="Cadre Training & Dispatch Oversight"
              subtitle="Live telemetry for NSSTA faculty directors and nodal evaluators"
              actions={
                <ArtButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/admin")}
                >
                  Open Executive Panel
                </ArtButton>
              }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ArtCard padding="md">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                  Enrolled Officers
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                  {trainerMetrics.totalLearners}
                </div>
                <span className="text-xs text-[#101014]/60">ISS / SSS / FOD</span>
              </ArtCard>

              <ArtCard padding="md">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                  Viva Boards Evaluated
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                  {trainerMetrics.totalInterviews}
                </div>
                <span className="text-xs text-[#101014]/60">AI Rubric Validated</span>
              </ArtCard>

              <ArtCard padding="md">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                  Study Material Catalog
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                  {trainerMetrics.totalMaterials}
                </div>
                <span className="text-xs text-[#101014]/60">PDF Manuals & Books</span>
              </ArtCard>

              <ArtCard padding="md">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                  Cadre Average Readiness
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-[#2D81FF]">
                  {trainerMetrics.avgCompetency}%
                </div>
                <span className="text-xs text-[#101014]/60">Target Standard: 80%</span>
              </ArtCard>
            </div>
          </div>
        )}

        {/* 4-DOMAIN TAXONOMY SECTION */}
        <section className="space-y-6">
          <ArtSectionHeader
            overline="Competency Framework"
            title="Standardized 4-Domain Competency Taxonomy"
            subtitle="Engineered under competency frameworks to profile technical personnel across specialized analytical tracks."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ArtCard padding="md" className="space-y-3">
              <div className="w-10 h-10 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-[#101014]">
                Statistical Rigor
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Stratified Sampling, Variance Multipliers, SNA 2008 Gross Value Added
                (GVA), CPI/WPI Index compilation, Demography.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                  Cadre: ISS & SSS Leadership
                </span>
              </div>
            </ArtCard>

            <ArtCard padding="md" className="space-y-3">
              <div className="w-10 h-10 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-[#101014]">
                Technical & Computing
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Statistical computing in R and Python, STATA automation, CAPI data
                sanitization, Big Data pipelines, Relational Queries.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                  Cadre: Data Analysts & SSS
                </span>
              </div>
            </ArtCard>

            <ArtCard padding="md" className="space-y-3">
              <div className="w-10 h-10 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-[#101014]">
                Governance & Policy
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Collection of Statistics Act, Data Privacy & DPDP standards, NDGFP
                open government publication, ethical microdata stewardship.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                  Cadre: Administrative Officers
                </span>
              </div>
            </ArtCard>

            <ArtCard padding="md" className="space-y-3">
              <div className="w-10 h-10 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <h3 className="font-display font-bold text-lg text-[#101014]">
                Field Operations Rigor
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Field Operations Division (FOD) logistics, enumerator audits,
                supervisory scrutiny, multi-round schedule compliance.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                  Cadre: FOD & State DES Staff
                </span>
              </div>
            </ArtCard>
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section className="space-y-6">
          <ArtSectionHeader
            overline="System Modules"
            title="Core Platform Capabilities"
            subtitle="Engineered with verified multi-domain AI intelligence and workforce development analytics."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ArtCard padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#101014] text-white flex items-center justify-center font-mono text-sm">
                  <FaTasks size={16} />
                </div>
                <ArtBadge variant="accent">Dynamic Engine</ArtBadge>
              </div>
              <h3 className="font-display font-bold text-xl text-[#101014]">
                Skill Gap & Cadre Benchmarking
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Automatically calculates proficiency across quizzes, assignments, and
                oral vivas. Compares scores against standardized statistical cadre profiles and
                ranks skill gaps by High, Medium, or Low priority.
              </p>
              <ArtButton
                variant="secondary"
                size="sm"
                onClick={() => handleProtectedAction("/skill-gaps", "Skill Gaps")}
              >
                Inspect Cadre Gaps
              </ArtButton>
            </ArtCard>

            <ArtCard padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#101014] text-white flex items-center justify-center font-mono text-sm">
                  <BsStars size={16} />
                </div>
                <ArtBadge variant="neutral">AI Neural Studio</ArtBadge>
              </div>
              <h3 className="font-display font-bold text-xl text-[#101014]">
                Survey Document-to-MCQ Studio
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Upload survey instructions, circulars, and sampling guidelines in PDF
                or DOCX format. The neural engine extracts key concepts and generates
                verified 4-option MCQs with full pedagogical reasoning.
              </p>
              <ArtButton
                variant="secondary"
                size="sm"
                onClick={() => handleProtectedAction("/mcq-create", "MCQ Studio")}
              >
                Open MCQ Studio
              </ArtButton>
            </ArtCard>

            <ArtCard padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-[#101014] text-white flex items-center justify-center font-mono text-sm">
                  <FaMicrophone size={16} />
                </div>
                <ArtBadge variant="primary">Speech-to-Text</ArtBadge>
              </div>
              <h3 className="font-display font-bold text-xl text-[#101014]">
                AI Speech Oral Viva Voce
              </h3>
              <p className="text-xs text-[#101014]/70 leading-relaxed font-sans">
                Simulate high-stakes board interviews for ISS and SSS promotions.
                Real-time speech recognition captures oral responses and evaluates
                clarity, conceptual mastery, and procedural accuracy.
              </p>
              <ArtButton
                variant="secondary"
                size="sm"
                onClick={() => handleProtectedAction("/interview", "Oral Viva")}
              >
                Start Viva Board
              </ArtButton>
            </ArtCard>
          </div>
        </section>

        {/* PERFORMANCE DOSSIER EXPORT CALLOUT */}
        <ArtCard
          variant="surface"
          padding="lg"
          className="border border-[#101014] bg-white"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#2D81FF]">
                Official Documentation
              </span>
              <h3 className="font-display font-bold text-2xl text-[#101014]">
                Comprehensive Competency Dossier Export
              </h3>
              <p className="text-xs sm:text-sm text-[#101014]/70 font-sans leading-relaxed">
                Generate a verified, tamper-proof PDF performance dossier containing
                the officer’s 4-Domain score distribution, identified high-priority
                gaps, verified learning milestones, and competency benchmarks.
              </p>
            </div>

            <ArtButton
              variant="primary"
              size="md"
              onClick={handleDownloadSampleDossier}
              icon={FaFilePdf}
              className="shrink-0"
            >
              Export Dossier (PDF)
            </ArtButton>
          </div>
        </ArtCard>

        {/* CADRE BENCHMARK KPI METRICS */}
        <section className="space-y-4">
          <ArtSectionHeader
            overline="Platform Scale"
            title="Institutional Workforce Scale"
            subtitle="Real-world statistical and workforce development infrastructure covered by SkillSetu AI"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ArtCard padding="md">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                Statistical Cadres
              </span>
              <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                <CountUp end={4} duration={1.5} /> Cadres
              </div>
              <span className="text-xs text-[#101014]/60">ISS, SSS, FOD, DES</span>
            </ArtCard>

            <ArtCard padding="md">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                Core Survey Rounds
              </span>
              <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                <CountUp end={12} duration={1.5} /> Surveys
              </div>
              <span className="text-xs text-[#101014]/60">PLFS, ASI, CPI, SECC</span>
            </ArtCard>

            <ArtCard padding="md">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                Curated Skill Modules
              </span>
              <div className="mt-2 font-display text-3xl font-bold text-[#101014]">
                <CountUp end={48} duration={1.5} /> Courses
              </div>
              <span className="text-xs text-[#101014]/60">Integrated Digital Tracks</span>
            </ArtCard>

            <ArtCard padding="md">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60">
                Bilingual Engine
              </span>
              <div className="mt-2 font-display text-3xl font-bold text-[#2D81FF]">
                100% Dual
              </div>
              <span className="text-xs text-[#101014]/60">English & हिन्दी Native</span>
            </ArtCard>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6">
          <ArtSectionHeader
            overline="Reference Guide"
            title="Frequently Answered Questions"
            subtitle="Operational details regarding competency mapping, viva evaluations, and platform standards."
          />

          <div className="space-y-2">
            {faqList.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-sans font-semibold text-sm sm:text-base text-[#101014]">
                      {faq.q}
                    </span>
                    <FaChevronDown
                      size={12}
                      className={`text-[#101014]/60 transition-transform duration-150 shrink-0 ${
                        isOpen ? "rotate-180 text-[#2D81FF]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#101014]/75 font-sans leading-relaxed border-t border-[#E5E7EB]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default Home;
