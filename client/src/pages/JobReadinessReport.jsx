import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArtCard,
  ArtButton,
  ArtBadge,
  ArtSelect,
  ArtEmptyState,
} from "../components/ArtCraftUI";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaAward,
  FaFilePdf,
  FaSyncAlt,
  FaShieldAlt,
  FaArrowRight,
  FaBriefcase,
  FaLock,
} from "react-icons/fa";
import {
  BsShieldCheck,
  BsBarChartSteps,
  BsPatchCheckFill,
  BsArrowUpRight,
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import PageTransition from "../components/PageTransition";
import { useDiagnostic } from "../context/DiagnosticContext";
import { useTranslation } from "react-i18next";

const JobReadinessReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const { isIntakePending, triggerLockedError } = useDiagnostic();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const fetchReadinessReport = async (roleOverride = null, isSync = false) => {
    try {
      if (isSync) setSyncing(true);
      else setLoading(true);

      const targetParam = roleOverride || selectedRole;
      const url = targetParam
        ? `${ServerUrl}/api/competencies/job-readiness?targetRole=${encodeURIComponent(
            targetParam
          )}`
        : `${ServerUrl}/api/competencies/job-readiness`;

      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setReport(res.data);
        if (!selectedRole && res.data.targetRole) {
          setSelectedRole(res.data.targetRole);
        }
        if (isSync) {
          toast.success("Job readiness audit recalculated! ✨");
        }
      }
    } catch (error) {
      console.error("Fetch job readiness error:", error);
      toast.error("Failed to load target job readiness report.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchReadinessReport();

    const handleRealtimeSync = () => {
      fetchReadinessReport(null, true);
    };

    window.addEventListener("assessmentCompleted", handleRealtimeSync);
    window.addEventListener("storage", handleRealtimeSync);
    window.addEventListener("focus", handleRealtimeSync);

    return () => {
      window.removeEventListener("assessmentCompleted", handleRealtimeSync);
      window.removeEventListener("storage", handleRealtimeSync);
      window.removeEventListener("focus", handleRealtimeSync);
    };
  }, []);

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    fetchReadinessReport(newRole, false);
  };

  const handleDownloadDossier = () => {
    if (isIntakePending) {
      triggerLockedError("Target Job Readiness Dossier Export");
      return;
    }
    if (!report || !userData) {
      toast.error("No readiness data available to export.");
      return;
    }
    toast.success("Generating Official Target Job Readiness Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData,
      profile: {
        ...userData,
        jobRole: report.targetRole || userData.jobRole,
        overallCompetencyScore: report.readinessIndex || 0,
        overallLevel: report.readinessTitle || "Novice",
      },
      competencies: report.requiredSkillsAudited || [],
      skillGaps: (report.keyBlockers || []).map((b) => ({
        competencyName: b.skillName,
        gapScore: b.gap,
        priority: "High",
        domain: b.domain,
      })),
      learningPath: userData.learningPath || [],
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DEPLOYMENT_READY":
        return {
          variant: "accent",
          icon: <BsPatchCheckFill size={14} className="text-[#2D81FF]" />,
          label: "Ready for Cadre Deployment",
        };
      case "CONDITIONALLY_READY":
        return {
          variant: "neutral",
          icon: <FaCheckCircle size={13} className="text-[#101014]" />,
          label: "Conditionally Ready (Practicum Pending)",
        };
      case "ACTIVE_DEVELOPMENT":
        return {
          variant: "outline",
          icon: (
            <FaExclamationTriangle size={12} className="text-[#101014]" />
          ),
          label: "Under Active Development",
        };
      case "FOUNDATIONAL_STAGE":
      default:
        return {
          variant: "danger",
          icon: <FaTimesCircle size={13} className="text-white" />,
          label: "Foundational Induction Mandated",
        };
    }
  };

  const statusMeta = report ? getStatusBadge(report.readinessStatus) : null;

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <PageTransition>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <BackButton fallbackUrl="/dashboard" label="Back to Dashboard" />
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
              <FaBriefcase className="text-[#2D81FF]" />
              <span>SkillSetu AI • Cadre Advancement & Deployment Audit</span>
            </div>
          </div>

          {/* Header Card */}
          <ArtCard padding="lg" className="bg-white space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-[#F2F1EE] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                  <BsShieldCheck size={13} className="text-[#2D81FF]" />
                  <span>
                    {t("jobReadiness.badge", "Statutory Cadre Audit Report")}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#101014]">
                  {t("jobReadiness.title", "Target Job Readiness & Cadre Audit")}
                </h1>
                <p className="text-xs sm:text-sm text-[#101014]/70 max-w-2xl leading-relaxed font-sans">
                  {t(
                    "jobReadiness.subtitle",
                    "Objective readiness verification for field and central cadre deployments."
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex flex-col gap-1.5 min-w-[220px]">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#101014]/60">
                    {t("jobReadiness.targetCadre", "Target Cadre Designation")}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] rounded-none px-3.5 py-2.5 text-xs font-mono font-bold focus:border-[#2D81FF] outline-none cursor-pointer"
                  >
                    {(report?.availableRoles || []).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <ArtButton
                    variant="secondary"
                    size="sm"
                    icon={FaSyncAlt}
                    onClick={() => fetchReadinessReport(selectedRole, true)}
                    isLoading={syncing}
                    title="Recalculate readiness with recent scores"
                  >
                    {t("dashboard.recalculateBtn", "Recalculate")}
                  </ArtButton>

                  <ArtButton
                    variant={isIntakePending ? "secondary" : "primary"}
                    size="sm"
                    icon={FaFilePdf}
                    onClick={handleDownloadDossier}
                  >
                    <span>
                      {t("jobReadiness.exportPdf", "Export Dossier (PDF)")}
                    </span>
                    {isIntakePending && (
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20 ml-1">
                        <FaLock size={8} className="inline mr-0.5" /> LOCKED
                      </span>
                    )}
                  </ArtButton>
                </div>
              </div>
            </div>
          </ArtCard>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#101014] border-t-[#2D81FF] rounded-none animate-spin" />
              <span className="font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
                Auditing Cadre Qualifications, Tenure & Statutory Standards...
              </span>
            </div>
          ) : (
            <>
              {/* Readiness index card & recommendation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <ArtCard
                  padding="lg"
                  className="lg:col-span-4 bg-white flex flex-col items-center justify-center text-center space-y-4"
                >
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]/60">
                    Cadre Deployment Readiness Index
                  </span>

                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-[#E5E7EB] stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className={`transition-all duration-1000 stroke-current ${
                          report.readinessIndex >= 85
                            ? "text-[#101014]"
                            : report.readinessIndex >= 70
                            ? "text-[#2D81FF]"
                            : "text-[#D64545]"
                        }`}
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={
                          264 - (264 * report.readinessIndex) / 100
                        }
                        strokeLinecap="square"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-mono text-4xl font-bold tracking-tight text-[#101014]">
                        {report.readinessIndex}%
                      </span>
                      <span className="font-mono text-[9px] font-bold text-[#101014]/50 uppercase tracking-widest">
                        Readiness
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2">
                    <ArtBadge variant={statusMeta?.variant}>
                      {statusMeta?.icon}
                      <span className="ml-1">{statusMeta?.label}</span>
                    </ArtBadge>
                  </div>

                  <div className="font-mono text-[11px] text-[#101014]/60 max-w-xs leading-normal pt-1">
                    Audited for <strong>{report.targetRole}</strong> benchmark
                    criteria.
                  </div>
                </ArtCard>

                <ArtCard
                  padding="lg"
                  className="lg:col-span-8 bg-white flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#2D81FF] uppercase tracking-[0.06em]">
                      <HiSparkles />
                      <span>
                        Cadre Examination Board Formal Recommendation
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#101014]">
                      {report.readinessTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#101014]/80 leading-relaxed bg-[#F2F1EE] p-4 border border-[#E5E7EB] font-sans">
                      "{report.formalRecommendation}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]/60">
                      Statutory Readiness Weighting Pillars
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                        <span className="font-mono text-[10px] text-[#101014]/60 font-bold block">
                          Competencies (50%)
                        </span>
                        <span className="font-mono text-xl font-bold text-[#101014]">
                          {report.scoresBreakdown?.competencyScoreWeight}%
                        </span>
                        <span className="font-mono text-[9px] text-[#101014]/50 block mt-0.5 uppercase">
                          Cadre Alignment
                        </span>
                      </div>

                      <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                        <span className="font-mono text-[10px] text-[#101014]/60 font-bold block">
                          Testing Rigor (25%)
                        </span>
                        <span className="font-mono text-xl font-bold text-[#2D81FF]">
                          {report.scoresBreakdown?.evaluationRigorScore}%
                        </span>
                        <span className="font-mono text-[9px] text-[#101014]/50 block mt-0.5 uppercase">
                          MCQ & Oral Viva
                        </span>
                      </div>

                      <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                        <span className="font-mono text-[10px] text-[#101014]/60 font-bold block">
                          Field Tenure (15%)
                        </span>
                        <span className="font-mono text-xl font-bold text-[#101014]">
                          {report.scoresBreakdown?.experienceScore}%
                        </span>
                        <span className="font-mono text-[9px] text-[#101014]/50 block mt-0.5 uppercase">
                          Documented Years
                        </span>
                      </div>

                      <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                        <span className="font-mono text-[10px] text-[#101014]/60 font-bold block">
                          iGOT Training (10%)
                        </span>
                        <span className="font-mono text-xl font-bold text-[#2D81FF]">
                          {report.scoresBreakdown?.capacityBuildingScore}%
                        </span>
                        <span className="font-mono text-[9px] text-[#101014]/50 block mt-0.5 uppercase">
                          Course Modules
                        </span>
                      </div>
                    </div>
                  </div>
                </ArtCard>
              </div>

              {/* Statutory Checklist */}
              <ArtCard padding="lg" className="bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014]">
                    <FaShieldAlt className="text-[#2D81FF]" />
                    <h2>
                      Statutory Deployment Criteria & Prerequisite Checklist
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] text-[#101014]/60 uppercase">
                    Official Statistical Service Rules
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#F2F1EE] border-b border-[#E5E7EB] text-[#101014] uppercase text-[10px] font-mono font-bold">
                      <tr>
                        <th className="p-3.5">Statutory Criterion</th>
                        <th className="p-3.5">Cadre Rule Standard</th>
                        <th className="p-3.5">Officer Record</th>
                        <th className="p-3.5 text-center">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {report.prerequisiteChecklist.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-[#F2F1EE]/50 transition-colors"
                        >
                          <td className="p-3.5 font-bold text-[#101014]">
                            {item.criterion}
                          </td>
                          <td className="p-3.5 text-[#101014]/70">
                            {item.requirement}
                          </td>
                          <td className="p-3.5 font-mono text-[#101014]/80">
                            {item.note}
                          </td>
                          <td className="p-3.5 text-center">
                            {item.met ? (
                              <ArtBadge variant="accent">
                                <FaCheckCircle
                                  size={10}
                                  className="inline mr-1"
                                />
                                VERIFIED PASSED
                              </ArtBadge>
                            ) : (
                              <ArtBadge variant="danger">
                                <FaExclamationTriangle
                                  size={10}
                                  className="inline mr-1"
                                />
                                ACTION REQUIRED
                              </ArtBadge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ArtCard>

              {/* 4-Domain Alignment */}
              <ArtCard padding="lg" className="bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014]">
                    <BsBarChartSteps className="text-[#2D81FF]" />
                    <h2>4-Domain Knowledge Taxonomy Alignment</h2>
                  </div>
                  <span className="font-mono text-[11px] text-[#101014]/60 uppercase">
                    Cadre Benchmark vs Assessed Proficiency
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {report.domainPillars.map((dom) => (
                    <div
                      key={dom.id}
                      className="p-4 bg-[#F2F1EE] border border-[#E5E7EB] space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-[#101014]">{dom.title}</span>
                        <span className="text-[#2D81FF]">
                          {dom.currentScore}% / {dom.targetScore}%
                        </span>
                      </div>

                      <div className="relative w-full h-2.5 bg-white border border-[#E5E7EB] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            dom.currentScore >= dom.targetScore
                              ? "bg-[#101014]"
                              : "bg-[#2D81FF]"
                          }`}
                          style={{
                            width: `${Math.min(100, dom.currentScore)}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-[#D64545] z-10"
                          style={{ left: `${Math.min(99, dom.targetScore)}%` }}
                          title={`Target: ${dom.targetScore}%`}
                        />
                      </div>

                      <div className="flex justify-between font-mono text-[10px] text-[#101014]/60 uppercase">
                        <span>Pillar Alignment: {dom.complianceRate}%</span>
                        <span
                          className={`font-bold ${
                            dom.currentScore >= dom.targetScore
                              ? "text-[#101014]"
                              : "text-[#D64545]"
                          }`}
                        >
                          {dom.currentScore >= dom.targetScore
                            ? "Meets Cadre Standard"
                            : `${dom.targetScore - dom.currentScore}% Deficit`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ArtCard>

              {/* Strengths & Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ArtCard padding="lg" className="bg-white space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] border-b border-[#E5E7EB] pb-3">
                    <FaAward className="text-[#2D81FF]" />
                    <h3>Key Strengths for {report.targetRole}</h3>
                  </div>

                  {report.keyStrengths.length === 0 ? (
                    <p className="text-xs text-[#101014]/60 font-sans">
                      Complete diagnostic assessments to highlight your top
                      strengths.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {report.keyStrengths.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-bold text-xs text-[#101014]">
                              {s.skillName}
                            </h4>
                            <span className="font-mono text-[10px] text-[#101014]/50 uppercase">
                              {s.domain}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-[#101014]">
                              {s.currentScore}%
                            </span>
                            <span className="text-[10px] font-bold text-[#2D81FF] block">
                              +{s.delta}% Surplus
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ArtCard>

                <ArtCard padding="lg" className="bg-white space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#D64545] border-b border-[#E5E7EB] pb-3">
                    <FaExclamationTriangle />
                    <h3>Deployment Blockers & Critical Deficits</h3>
                  </div>

                  {report.keyBlockers.length === 0 ? (
                    <div className="p-4 bg-[#F2F1EE] border border-[#E5E7EB] text-xs font-mono font-bold flex items-center gap-2 text-[#101014]">
                      <FaCheckCircle className="text-[#2D81FF]" />
                      <span>Zero deployment blockers identified for this role!</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {report.keyBlockers.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-[#D64545]/40 flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-bold text-xs text-[#101014]">
                              {b.skillName}
                            </h4>
                            <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                              Target: {b.targetScore}% ({b.targetLevel})
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-[#D64545]">
                              {b.currentScore}%
                            </span>
                            <span className="text-[10px] font-bold text-[#D64545] block">
                              -{b.gap} pts Gap
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ArtCard>
              </div>

              {/* Actionable Milestones */}
              <div className="bg-[#101014] text-[#F2F1EE] border border-[#101014] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB]/20 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#2D81FF] font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                      <HiSparkles />
                      <span>Actionable Bridge to 100% Cadre Clearance</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold mt-1 text-white">
                      Recommended Deployment Milestones
                    </h2>
                  </div>

                  <ArtButton
                    variant="secondary"
                    size="sm"
                    iconRight={FaArrowRight}
                    onClick={() => navigate("/skill-gaps")}
                  >
                    View All Skill Gaps
                  </ArtButton>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {report.milestones.map((m) => (
                    <div
                      key={m.step}
                      className="p-5 bg-white/5 border border-[#E5E7EB]/10 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <span className="w-6 h-6 bg-[#2D81FF] text-white font-mono text-xs font-bold flex items-center justify-center">
                          {m.step}
                        </span>
                        <h4 className="font-mono text-xs font-bold text-white leading-snug">
                          {m.title}
                        </h4>
                        <span className="font-mono text-[10px] text-[#2D81FF] font-bold block uppercase">
                          Impact: {m.impact}
                        </span>
                      </div>

                      <ArtButton
                        variant="outline"
                        size="sm"
                        className="w-full text-white border-white/20 hover:bg-white hover:text-[#101014]"
                        iconRight={BsArrowUpRight}
                        onClick={() => navigate(m.link)}
                      >
                        Start Action
                      </ArtButton>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </PageTransition>

      <Footer />
    </div>
  );
};

export default JobReadinessReport;
