import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArtCard,
  ArtButton,
  ArtBadge,
  ArtChip,
  ArtMetricCard,
  ArtEmptyState,
} from "../components/ArtCraftUI";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaSyncAlt,
  FaFilePdf,
  FaSearch,
  FaBookOpen,
  FaMicrophone,
  FaGraduationCap,
  FaLock,
} from "react-icons/fa";
import {
  BsShieldCheck,
  BsBarChartSteps,
  BsBullseye,
  BsArrowUpRight,
  BsExclamationOctagonFill,
  BsCircleHalf,
} from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import PageTransition from "../components/PageTransition";
import { useDiagnostic } from "../context/DiagnosticContext";
import { useTranslation } from "react-i18next";

const DOMAIN_OPTIONS = [
  { id: "all", label: "All Domains" },
  { id: "statistical", label: "Statistical" },
  { id: "technical", label: "Technical & Comp" },
  { id: "governance", label: "Digital Governance" },
  { id: "managerial", label: "Managerial" },
];

const CIRCULAR_PALETTES = [
  {
    id: "blue",
    name: "Royal Blue",
    stroke: "#2D81FF",
  },
  {
    id: "charcoal",
    name: "Deep Charcoal",
    stroke: "#101014",
  },
  {
    id: "slate",
    name: "Cool Slate",
    stroke: "#475569",
  },
  {
    id: "accent",
    name: "Electric Accent",
    stroke: "#2D81FF",
  },
];

const SkillGapAnalysis = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const { isIntakePending, triggerLockedError } = useDiagnostic();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);

  const [selectedCadre, setSelectedCadre] = useState("");
  const [activeTab, setActiveTab] = useState("all_required");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [benchmarkViewMode, setBenchmarkViewMode] = useState("circles");

  const fetchGapAnalysis = async (cadreOverride = null, isSync = false) => {
    try {
      if (isSync) setSyncing(true);
      else setLoading(true);

      const cadreParam = cadreOverride || selectedCadre;
      const url = cadreParam
        ? `${ServerUrl}/api/competencies/skill-gap-analysis?cadre=${encodeURIComponent(
            cadreParam
          )}`
        : `${ServerUrl}/api/competencies/skill-gap-analysis`;

      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setData(res.data);
        if (!selectedCadre && res.data.cadre) {
          setSelectedCadre(res.data.cadre);
        }
        if (isSync) {
          toast.success("Skill gaps & benchmarks successfully synchronized! ✨");
        }
      }
    } catch (error) {
      console.error("Fetch skill gap analysis error:", error);
      toast.error("Failed to load skill gap analysis.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchGapAnalysis();

    const handleRealtimeSync = () => {
      fetchGapAnalysis(null, true);
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

  const handleCadreChange = (newCadre) => {
    setSelectedCadre(newCadre);
    fetchGapAnalysis(newCadre, false);
  };

  const handleDownloadDossier = () => {
    if (isIntakePending) {
      triggerLockedError("Official Dossier PDF Export");
      return;
    }
    if (!data || !userData) {
      toast.error("No profile data available to export.");
      return;
    }
    toast.success("Preparing Official Skill Gap & Competency Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData,
      profile: {
        ...userData,
        jobRole: data.cadre || userData.jobRole,
        overallCompetencyScore: data.userProfile?.overallCompetencyScore || 0,
        overallLevel: data.userProfile?.overallLevel || "Novice",
      },
      competencies: data.requiredSkills || [],
      skillGaps: data.skillGaps || [],
      learningPath: userData.learningPath || [],
    });
  };

  const displayedSkills = useMemo(() => {
    if (!data) return [];

    let pool;
    switch (activeTab) {
      case "on_target":
        pool = data.skillsOnTarget || [];
        break;
      case "strong":
        pool = data.strongSkills || [];
        break;
      case "needs_improvement":
        pool = data.needsImprovement || [];
        break;
      case "critical":
        pool = data.criticalGaps || [];
        break;
      case "all_gaps":
        pool = data.skillGaps || [];
        break;
      case "all_required":
      default:
        pool = data.requiredSkills || [];
        break;
    }

    return pool.filter((skill) => {
      if (selectedDomain !== "all") {
        const d = (skill.domain || "").toLowerCase();
        if (selectedDomain === "statistical" && !d.includes("statistical"))
          return false;
        if (
          selectedDomain === "technical" &&
          !d.includes("technical") &&
          !d.includes("computational")
        )
          return false;
        if (
          selectedDomain === "governance" &&
          !d.includes("governance") &&
          !d.includes("security")
        )
          return false;
        if (
          selectedDomain === "managerial" &&
          !d.includes("managerial") &&
          !d.includes("behavioural")
        )
          return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = skill.competencyName.toLowerCase().includes(query);
        const matchDomain = (skill.domain || "").toLowerCase().includes(query);
        const matchAction = (skill.recommendedAction || "")
          .toLowerCase()
          .includes(query);
        if (!matchName && !matchDomain && !matchAction) return false;
      }

      return true;
    });
  }, [data, activeTab, selectedDomain, searchQuery]);

  const chartData = useMemo(() => {
    if (!data?.requiredSkills) return [];
    return data.requiredSkills.map((s) => ({
      name:
        s.competencyName.length > 14
          ? `${s.competencyName.substring(0, 14)}..`
          : s.competencyName,
      fullName: s.competencyName,
      current: s.currentScore,
      target: s.targetScore,
      delta: s.deltaScore,
    }));
  }, [data]);

  const summary = data?.summary || {
    totalRequiredSkills: 0,
    skillsOnTargetCount: 0,
    strongSkillsCount: 0,
    needsImprovementCount: 0,
    criticalGapsCount: 0,
    cadreComplianceRate: 0,
    averageGapScore: 0,
  };

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <PageTransition>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <BackButton fallbackUrl="/dashboard" label="Back to Dashboard" />
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
              <BsBullseye className="text-[#2D81FF]" />
              <span>SkillSetu AI • Cadre Competency Gap Analytics</span>
            </div>
          </div>

          {/* Header Card */}
          <ArtCard padding="lg" className="bg-white space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-[#F2F1EE] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                  <BsShieldCheck size={13} className="text-[#2D81FF]" />
                  <span>{t("skillGap.badge", "Official Cadre Benchmark Matrix")}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#101014]">
                  {t("skillGap.title", "Cadre Skill Gap Analysis & Target Audit")}
                </h1>
                <p className="text-xs sm:text-sm text-[#101014]/70 max-w-2xl leading-relaxed font-sans">
                  {t(
                    "skillGap.subtitle",
                    "Deep comparative analysis between officer current assessed proficiencies and statutory cadre benchmarks."
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex flex-col gap-1.5 min-w-[220px]">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#101014]/60">
                    {t("skillGap.benchmarkRole", "Benchmark Cadre Role")}
                  </label>
                  <select
                    value={selectedCadre}
                    onChange={(e) => handleCadreChange(e.target.value)}
                    className="w-full bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] rounded-none px-3.5 py-2.5 text-xs font-mono font-bold focus:border-[#2D81FF] outline-none cursor-pointer"
                  >
                    {(data?.availableCadres || []).map((cadre) => (
                      <option key={cadre} value={cadre}>
                        {cadre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <ArtButton
                    variant="secondary"
                    size="sm"
                    icon={FaSyncAlt}
                    onClick={() => fetchGapAnalysis(selectedCadre, true)}
                    isLoading={syncing}
                    title="Recalculate and sync with recent assessment scores"
                  >
                    {t("skillGap.syncBtn", "Sync Gaps")}
                  </ArtButton>

                  <ArtButton
                    variant={isIntakePending ? "secondary" : "primary"}
                    size="sm"
                    icon={FaFilePdf}
                    onClick={handleDownloadDossier}
                  >
                    <span>{t("skillGap.exportDossier", "Export Dossier (PDF)")}</span>
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
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#101014] border-t-[#2D81FF] rounded-none animate-spin" />
              <span className="font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
                Synthesizing Cadre Benchmarks & Gap Analytics...
              </span>
            </div>
          ) : (
            <>
              {/* Metric KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#101014]/60 block mb-1">
                    Compliance
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#101014]">
                    {summary.cadreComplianceRate}%
                  </div>
                  <p className="font-mono text-[9px] text-[#101014]/50 mt-1 uppercase">
                    {summary.skillsOnTargetCount} of {summary.totalRequiredSkills} on target
                  </p>
                </ArtCard>

                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#101014]/60 block mb-1">
                    On Target
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#101014]">
                    {summary.skillsOnTargetCount}
                  </div>
                  <p className="font-mono text-[9px] text-[#101014]/50 mt-1 uppercase">
                    Meets Cadre Target
                  </p>
                </ArtCard>

                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#101014]/60 block mb-1">
                    Required Skills
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#101014]">
                    {summary.totalRequiredSkills}
                  </div>
                  <p className="font-mono text-[9px] text-[#101014]/50 mt-1 uppercase">
                    Cadre Taxonomy
                  </p>
                </ArtCard>

                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#101014]/60 block mb-1">
                    Strong Skills
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#2D81FF]">
                    {summary.strongSkillsCount}
                  </div>
                  <p className="font-mono text-[9px] text-[#101014]/50 mt-1 uppercase">
                    High Mastery (≥80%)
                  </p>
                </ArtCard>

                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#101014]/60 block mb-1">
                    Needs Improv.
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#101014]">
                    {summary.needsImprovementCount}
                  </div>
                  <p className="font-mono text-[9px] text-[#101014]/50 mt-1 uppercase">
                    Moderate Gap (1-20%)
                  </p>
                </ArtCard>

                <ArtCard padding="sm" className="bg-white flex flex-col justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#D64545] block mb-1">
                    Critical Gaps
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#D64545]">
                    {summary.criticalGapsCount}
                  </div>
                  <p className="font-mono text-[9px] text-[#D64545]/70 mt-1 uppercase">
                    Urgent High Priority
                  </p>
                </ArtCard>
              </div>

              {/* Benchmark Display (Rings or Bar Chart) */}
              <ArtCard padding="lg" className="bg-white space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] flex items-center gap-2">
                      <BsCircleHalf className="text-[#2D81FF]" />
                      <span>Benchmark Proficiency vs Cadre Target Thresholds</span>
                    </h2>
                    <p className="text-xs text-[#101014]/60 mt-1 font-sans">
                      Target thresholds for {selectedCadre}. Outer ring shows officer proficiency; inner dashed ring shows cadre requirement.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center bg-[#F2F1EE] border border-[#E5E7EB] p-1">
                      <button
                        onClick={() => setBenchmarkViewMode("circles")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          benchmarkViewMode === "circles"
                            ? "bg-[#101014] text-white"
                            : "text-[#101014]/60 hover:text-[#101014]"
                        }`}
                      >
                        <BsCircleHalf size={11} />
                        <span>Rings</span>
                      </button>

                      <button
                        onClick={() => setBenchmarkViewMode("bars")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          benchmarkViewMode === "bars"
                            ? "bg-[#101014] text-white"
                            : "text-[#101014]/60 hover:text-[#101014]"
                        }`}
                      >
                        <BsBarChartSteps size={11} />
                        <span>Bar Chart</span>
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {benchmarkViewMode === "circles" ? (
                    <motion.div
                      key="circles-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                      {data?.requiredSkills && data.requiredSkills.length > 0 ? (
                        data.requiredSkills.map((skill, idx) => {
                          const delta = skill.currentScore - skill.targetScore;
                          const C_outer = 276.46;
                          const C_inner = 207.35;
                          const currentClamped = Math.min(
                            Math.max(skill.currentScore || 0, 0),
                            100
                          );
                          const targetClamped = Math.min(
                            Math.max(skill.targetScore || 0, 0),
                            100
                          );

                          return (
                            <ArtCard
                              key={skill.competencyName || idx}
                              padding="sm"
                              className="bg-[#F2F1EE] border border-[#E5E7EB] flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                                <span className="font-mono text-[9px] uppercase tracking-wider text-[#101014]/60 truncate">
                                  {skill.domain || "Core"}
                                </span>

                                {delta >= 0 ? (
                                  <ArtBadge variant="accent">+{delta}%</ArtBadge>
                                ) : delta >= -20 ? (
                                  <ArtBadge variant="neutral">{delta}%</ArtBadge>
                                ) : (
                                  <ArtBadge variant="danger">{delta}%</ArtBadge>
                                )}
                              </div>

                              <div className="relative w-28 h-28 my-2 mx-auto flex items-center justify-center">
                                <svg className="w-28 h-28" viewBox="0 0 112 112">
                                  <circle
                                    cx="56"
                                    cy="56"
                                    r="44"
                                    stroke="#E5E7EB"
                                    strokeWidth="6"
                                    fill="transparent"
                                  />
                                  <circle
                                    cx="56"
                                    cy="56"
                                    r="33"
                                    stroke="#CBD5E1"
                                    strokeWidth="2"
                                    strokeDasharray="3 3"
                                    fill="transparent"
                                  />
                                  <motion.circle
                                    cx="56"
                                    cy="56"
                                    r="33"
                                    stroke="#101014"
                                    strokeOpacity="0.4"
                                    strokeWidth="3"
                                    strokeDasharray={`${C_inner} ${C_inner}`}
                                    strokeLinecap="square"
                                    fill="none"
                                    initial={{ strokeDashoffset: C_inner }}
                                    animate={{
                                      strokeDashoffset:
                                        C_inner - (C_inner * targetClamped) / 100,
                                    }}
                                    transition={{ duration: 1 }}
                                    transform="rotate(-90 56 56)"
                                  />
                                  <motion.circle
                                    cx="56"
                                    cy="56"
                                    r="44"
                                    stroke="#2D81FF"
                                    strokeWidth="6"
                                    strokeDasharray={`${C_outer} ${C_outer}`}
                                    strokeLinecap="square"
                                    fill="none"
                                    initial={{ strokeDashoffset: C_outer }}
                                    animate={{
                                      strokeDashoffset:
                                        C_outer - (C_outer * currentClamped) / 100,
                                    }}
                                    transition={{ duration: 1.2 }}
                                    transform="rotate(-90 56 56)"
                                  />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="font-mono text-base font-bold text-[#101014]">
                                    {skill.currentScore}%
                                  </span>
                                  <span className="font-mono text-[9px] uppercase text-[#101014]/50">
                                    Tgt {skill.targetScore}%
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1.5 text-center">
                                <h4
                                  className="font-sans font-bold text-xs text-[#101014] line-clamp-2 h-8 flex items-center justify-center"
                                  title={skill.competencyName}
                                >
                                  {skill.competencyName}
                                </h4>
                                <div className="flex items-center justify-between font-mono text-[9px] uppercase text-[#101014]/60 pt-1 border-t border-[#E5E7EB]">
                                  <span>Score: {skill.currentScore}%</span>
                                  <span>Req: {skill.targetScore}%</span>
                                </div>
                              </div>
                            </ArtCard>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-12 text-center font-mono text-xs text-[#101014]/50">
                          No competencies found for this cadre benchmark.
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bars-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-72 w-full pt-2"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E5E7EB"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#101014", fontFamily: "Geist Mono" }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: "#101014", fontFamily: "Geist Mono" }}
                            ticks={[0, 25, 50, 75, 100]}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                const delta = d.current - d.target;
                                return (
                                  <div className="bg-[#101014] text-white p-3 text-xs font-mono border border-[#101014] space-y-1">
                                    <p className="font-bold text-[#2D81FF]">
                                      {d.fullName}
                                    </p>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-white/60">Current:</span>
                                      <span className="font-bold">{d.current}%</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-white/60">Benchmark:</span>
                                      <span className="font-bold">{d.target}%</span>
                                    </div>
                                    <div className="flex justify-between gap-4 pt-1 border-t border-white/20">
                                      <span className="text-white/60">Delta:</span>
                                      <span
                                        className={`font-bold ${
                                          delta >= 0
                                            ? "text-[#2D81FF]"
                                            : "text-[#D64545]"
                                        }`}
                                      >
                                        {delta >= 0 ? `+${delta}%` : `${delta}%`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="current"
                            fill="#101014"
                            maxBarSize={30}
                          />
                          <Bar
                            dataKey="target"
                            fill="#2D81FF"
                            opacity={0.35}
                            maxBarSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ArtCard>

              {/* Filter Tabs & Search Bar */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5E7EB] p-4">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-bold uppercase">
                    {[
                      { key: "all_required", label: "Required", count: data?.requiredSkills?.length || 0 },
                      { key: "on_target", label: "On Target", count: summary.skillsOnTargetCount },
                      { key: "strong", label: "Strong", count: summary.strongSkillsCount },
                      { key: "needs_improvement", label: "Needs Improv.", count: summary.needsImprovementCount },
                      { key: "critical", label: "Critical", count: summary.criticalGapsCount },
                      { key: "all_gaps", label: "All Gaps", count: data?.skillGaps?.length || 0 },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-2 border transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === tab.key
                            ? "bg-[#101014] text-white border-[#101014]"
                            : "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB] hover:bg-white"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[10px] opacity-70">({tab.count})</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101014]/40 text-xs" />
                      <input
                        type="text"
                        placeholder="Search competencies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 text-xs bg-[#F2F1EE] border border-[#E5E7EB] font-sans text-[#101014] focus:border-[#2D81FF] outline-none w-full sm:w-48"
                      />
                    </div>

                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="px-3 py-2 text-xs bg-[#F2F1EE] border border-[#E5E7EB] font-mono text-[#101014] focus:border-[#2D81FF] outline-none cursor-pointer"
                    >
                      {DOMAIN_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Displayed skill cards */}
                {displayedSkills.length === 0 ? (
                  <ArtEmptyState
                    icon={FaCheckCircle}
                    title="No competencies matching active filter criteria"
                    description="All competencies under this category meet current criteria, or adjust your domain and search filters above."
                    action={
                      <ArtButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveTab("all_required");
                          setSelectedDomain("all");
                          setSearchQuery("");
                        }}
                      >
                        Reset All Filters
                      </ArtButton>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedSkills.map((skill, idx) => {
                      const isOnTarget = skill.currentScore >= skill.targetScore;
                      const isCritical = skill.category === "CRITICAL";

                      return (
                        <ArtCard
                          key={idx}
                          padding="md"
                          className="bg-white flex flex-col justify-between space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] text-[#101014]/60 uppercase tracking-wider block">
                                {skill.domain}
                              </span>
                              <h3 className="font-sans font-bold text-sm text-[#101014] leading-snug">
                                {skill.competencyName}
                              </h3>
                            </div>

                            {isOnTarget ? (
                              <ArtBadge variant="accent">ON TARGET</ArtBadge>
                            ) : isCritical ? (
                              <ArtBadge variant="danger">CRITICAL GAP</ArtBadge>
                            ) : (
                              <ArtBadge variant="neutral">NEEDS IMPROV.</ArtBadge>
                            )}
                          </div>

                          <div className="space-y-2 bg-[#F2F1EE] p-3.5 border border-[#E5E7EB]">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="font-bold text-[#101014]">
                                Current: {skill.currentScore}% ({skill.currentLevel})
                              </span>
                              <span className="text-[#101014]/60">
                                Target: {skill.targetScore}% ({skill.targetLevel})
                              </span>
                            </div>

                            <div className="relative w-full h-2.5 bg-white border border-[#E5E7EB] overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isOnTarget
                                    ? "bg-[#101014]"
                                    : isCritical
                                    ? "bg-[#D64545]"
                                    : "bg-[#2D81FF]"
                                }`}
                                style={{ width: `${Math.min(100, skill.currentScore)}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-1 bg-[#101014] z-10"
                                style={{ left: `${Math.min(99, skill.targetScore)}%` }}
                                title={`Threshold: ${skill.targetScore}%`}
                              />
                            </div>

                            <div className="flex items-center justify-between font-mono text-[10px] uppercase pt-0.5">
                              <span className="text-[#101014]/60">Gap Delta:</span>
                              <span
                                className={`font-bold ${
                                  skill.deltaScore >= 0
                                    ? "text-[#101014]"
                                    : "text-[#D64545]"
                                }`}
                              >
                                {skill.deltaScore >= 0
                                  ? `+${skill.deltaScore}% (Target Exceeded)`
                                  : `${skill.deltaScore}% (${skill.gapScore} pts deficit)`}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs font-sans">
                            <p className="text-[#101014]/75 leading-relaxed text-[11px]">
                              <strong className="text-[#101014]">Operational Impact: </strong>
                              {skill.impact}
                            </p>
                            <p className="text-[#101014]/75 leading-relaxed text-[11px]">
                              <strong className="text-[#2D81FF]">Action Plan: </strong>
                              {skill.recommendedAction}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center gap-2">
                            <ArtButton
                              size="sm"
                              variant="primary"
                              iconRight={BsArrowUpRight}
                              onClick={() =>
                                navigate(
                                  skill.suggestedQuizzes && skill.suggestedQuizzes.length > 0
                                    ? `/quiz/${skill.suggestedQuizzes[0]._id}`
                                    : "/quizzes"
                                )
                              }
                            >
                              Remedial Quiz
                            </ArtButton>

                            <ArtButton
                              size="sm"
                              variant="secondary"
                              icon={FaBookOpen}
                              onClick={() => navigate("/learning-path")}
                            >
                              Learning Path
                            </ArtButton>

                            <ArtButton
                              size="sm"
                              variant="outline"
                              icon={FaMicrophone}
                              className="ml-auto"
                              onClick={() => navigate("/interview")}
                            >
                              Oral Viva
                            </ArtButton>
                          </div>
                        </ArtCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </PageTransition>

      <Footer />
    </div>
  );
};

export default SkillGapAnalysis;
