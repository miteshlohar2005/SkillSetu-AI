import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import {
  FaBrain,
  FaTasks,
  FaClock,
  FaArrowRight,
  FaMicrophone,
  FaFilePdf,
  FaSyncAlt,
  FaBullhorn,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BsRobot, BsBarChartSteps, BsShieldCheck } from "react-icons/bs";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import { useTranslation } from "react-i18next";
import {
  ArtButton,
  ArtCard,
  ArtChip,
  ArtSectionHeader,
  ArtBadge,
  ArtMetricCard,
} from "../components/ArtCraftUI";

const OFFICIAL_BASELINE_COMPETENCIES = [
  { competencyName: "Sampling Techniques & Estimation", domain: "Statistical", score: 0 },
  { competencyName: "National Accounts & GDP (SNA 2008)", domain: "Statistical", score: 0 },
  { competencyName: "Price Statistics (CPI, WPI, Inflation)", domain: "Statistical", score: 0 },
  { competencyName: "Statistical Computing & Automated Processing", domain: "Technical", score: 0 },
  { competencyName: "Data Privacy, Ethics & DPDP Act", domain: "Governance", score: 0 },
  { competencyName: "Labour & Employment Statistics (PLFS)", domain: "Statistical", score: 0 },
  { competencyName: "Microdata Analytics & Survey Weighting", domain: "Technical", score: 0 },
  { competencyName: "Evidence-Based Policy & Decision Leadership", domain: "Managerial", score: 0 },
];

const Dashboard = () => {
  const { t } = useTranslation();
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [profile, setProfile] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [chats, setChats] = useState([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [skillGapFilter, setSkillGapFilter] = useState("all");

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setIsSyncing(true);
      const [
        profileRes,
        broadcastsRes,
        quizAttemptsRes,
        interviewRes,
        assignmentSubmissionsRes,
        chatRes,
        diagnosticRes,
      ] = await Promise.allSettled([
        axios.get(`${ServerUrl}/api/competencies/my-profile`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/support/broadcasts`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/quizzes/history/my-attempts`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/interview/get-interview`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/assignments/history/my-submissions`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/chat/get`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/competencies/diagnostic-status`, { withCredentials: true }),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.data?.success) {
        const p = profileRes.value.data.profile;
        setProfile(p);
        dispatch(setUserData({ ...userData, ...p }));
      }
      if (broadcastsRes.status === "fulfilled" && broadcastsRes.value.data?.success) {
        setBroadcasts(broadcastsRes.value.data.broadcasts || []);
      }
      if (diagnosticRes.status === "fulfilled" && diagnosticRes.value.data?.success) {
        setDiagnosticStatus(diagnosticRes.value.data);
      }
      if (quizAttemptsRes.status === "fulfilled" && quizAttemptsRes.value.data?.success) {
        setQuizAttempts(quizAttemptsRes.value.data.attempts || []);
      }
      if (interviewRes.status === "fulfilled") {
        const val = interviewRes.value.data;
        if (Array.isArray(val)) setInterviews(val);
        else if (Array.isArray(val?.interviews)) setInterviews(val.interviews);
        else setInterviews([]);
      }
      if (assignmentSubmissionsRes.status === "fulfilled" && assignmentSubmissionsRes.value.data?.success) {
        setAssignmentSubmissions(assignmentSubmissionsRes.value.data.submissions || []);
      }
      if (chatRes.status === "fulfilled" && chatRes.value.data?.success) {
        setChats(chatRes.value.data.chats || []);
      }
    } catch (error) {
      if (!isBackground) console.error("Dashboard fetch error:", error);
    } finally {
      if (!isBackground) {
        setLoading(false);
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    const handleAssessmentCompleted = () => {
      fetchDashboardData(false);
      toast.success("Dashboard metrics synced with latest assessment results! 🎯");
    };

    window.addEventListener("assessmentCompleted", handleAssessmentCompleted);
    return () => {
      clearInterval(interval);
      window.removeEventListener("assessmentCompleted", handleAssessmentCompleted);
    };
  }, []);

  const synthesizedCompetencies = useMemo(() => {
    const baseList =
      profile?.competencies && profile.competencies.length > 0
        ? profile.competencies.map((c) => ({
            competencyName: c.competencyName,
            domain: c.domain || "Statistical",
            score: Number.isFinite(Number(c.score)) ? Number(c.score) : 0,
            source: c.source || "assessment-derived",
          }))
        : OFFICIAL_BASELINE_COMPETENCIES;

    return baseList.map((comp) => {
      const lowerName = comp.competencyName.toLowerCase();
      let matchedQuizScores = [];
      (quizAttempts || []).forEach((attempt) => {
        const title = (attempt.quizTitle || attempt.topic || attempt.quizId?.title || "").toLowerCase();
        if (
          (lowerName.includes("sampling") && title.includes("sampling")) ||
          (lowerName.includes("national account") && (title.includes("national") || title.includes("sna") || title.includes("gdp"))) ||
          (lowerName.includes("price") && (title.includes("price") || title.includes("cpi"))) ||
          (lowerName.includes("computing") && (title.includes("computing") || title.includes("r") || title.includes("python"))) ||
          (lowerName.includes("privacy") && (title.includes("privacy") || title.includes("dpdp")))
        ) {
          let sc = attempt.score !== undefined ? attempt.score : attempt.percentage;
          if (sc !== null && sc !== undefined) {
            matchedQuizScores.push(Math.min(100, Math.max(0, Number(sc) || 0)));
          }
        }
      });

      let finalScore = comp.score;
      if (matchedQuizScores.length > 0) {
        const evAvg = matchedQuizScores.reduce((a, b) => a + b, 0) / matchedQuizScores.length;
        finalScore = Math.round(comp.score * 0.6 + evAvg * 0.4);
      }

      return {
        ...comp,
        score: Math.min(100, Math.max(0, finalScore)),
      };
    });
  }, [profile, quizAttempts]);

  const knowledgeStats = useMemo(() => {
    const hasAnyAttempts =
      (quizAttempts && quizAttempts.length > 0) ||
      (interviews && interviews.length > 0) ||
      (assignmentSubmissions && assignmentSubmissions.length > 0);

    const totalScore = synthesizedCompetencies.reduce((acc, c) => acc + c.score, 0);
    let overallScore = hasAnyAttempts
      ? Math.round(totalScore / (synthesizedCompetencies.length || 1))
      : 0;

    if (profile?.overallCompetencyScore !== undefined && profile?.overallCompetencyScore !== null && hasAnyAttempts) {
      overallScore = profile.overallCompetencyScore;
    }

    const criticalWeaknesses = synthesizedCompetencies.filter((c) => c.score < 50);
    const developingCount = synthesizedCompetencies.filter((c) => c.score >= 50 && c.score < 75);
    const masteredCount = synthesizedCompetencies.filter((c) => c.score >= 75);

    let overallLevel = "Novice (Intake Baseline)";
    if (overallScore >= 80) overallLevel = "Expert (ISS Officer)";
    else if (overallScore >= 70) overallLevel = "Advanced (SSO)";
    else if (overallScore >= 55) overallLevel = "Intermediate (JSO)";
    else if (overallScore > 0) overallLevel = "Foundational";

    return {
      hasAnyAttempts,
      overallScore,
      overallLevel,
      criticalCount: criticalWeaknesses.length,
      developingCount: developingCount.length,
      masteredCount: masteredCount.length,
      completedQuizzes: quizAttempts.length,
      completedInterviews: interviews.length,
      completedAssignments: assignmentSubmissions.length,
      learningHours: Math.round(
        (profile?.learningHours || 0) +
          quizAttempts.length * 0.5 +
          interviews.length * 0.75 +
          assignmentSubmissions.length * 1.5
      ),
    };
  }, [synthesizedCompetencies, quizAttempts, interviews, assignmentSubmissions, profile]);

  const radarData = useMemo(() => {
    const domainCalc = (pattern) => {
      const comps = synthesizedCompetencies.filter((c) =>
        c.domain?.toLowerCase().includes(pattern.toLowerCase())
      );
      if (!comps.length) return 0;
      return Math.round(comps.reduce((acc, c) => acc + c.score, 0) / comps.length);
    };

    return [
      { domain: "Statistical", score: domainCalc("Statistical"), benchmark: 75 },
      { domain: "Technical", score: domainCalc("Technical"), benchmark: 75 },
      { domain: "Governance", score: domainCalc("Governance"), benchmark: 75 },
      { domain: "Managerial", score: domainCalc("Managerial"), benchmark: 75 },
    ];
  }, [synthesizedCompetencies]);

  const allPossibleSkillGaps = useMemo(() => {
    if (profile?.skillGaps && profile.skillGaps.length > 0) {
      return profile.skillGaps;
    }
    return synthesizedCompetencies.map((comp) => {
      const gapScore = Math.max(0, 75 - comp.score);
      const isCritical = gapScore >= 25 || comp.score < 50;
      const isModerate = gapScore >= 10 || comp.score < 65;
      const priority = isCritical ? "High" : isModerate ? "Medium" : "Low";

      return {
        competencyName: comp.competencyName,
        domain: comp.domain || "Statistical",
        currentLevel: comp.score >= 75 ? "Expert" : comp.score >= 50 ? "Intermediate" : "Novice",
        requiredLevel: "Advanced",
        gapScore,
        priority,
        recommendedAction: isCritical
          ? `Complete mandatory iGOT Karmayogi module for ${comp.competencyName}`
          : `Practice diagnostic assessment for ${comp.competencyName}`,
      };
    });
  }, [profile, synthesizedCompetencies]);

  const filteredSkillGaps = useMemo(() => {
    if (skillGapFilter === "all") return allPossibleSkillGaps;
    if (skillGapFilter === "high") return allPossibleSkillGaps.filter((g) => g.priority === "High");
    if (skillGapFilter === "medium") return allPossibleSkillGaps.filter((g) => g.priority === "Medium");
    if (skillGapFilter === "low") return allPossibleSkillGaps.filter((g) => g.priority === "Low");
    return allPossibleSkillGaps;
  }, [allPossibleSkillGaps, skillGapFilter]);

  const handleRecalculate = async () => {
    setIsSyncing(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/competencies/recalculate`,
        {},
        { withCredentials: true }
      );
      if (data?.success) {
        toast.success("Competency metrics recalculated against official benchmarks! 🎯");
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to recalculate competency metrics.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.success("Preparing Official Performance Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData,
      profile: profile || userData,
      competencies: synthesizedCompetencies,
      skillGaps: profile?.skillGaps || allPossibleSkillGaps,
      learningPath: profile?.learningPath || userData?.learningPath || [],
    });
  };

  const handleUpdateCourseStatus = async (stepIndex, status) => {
    try {
      const { data } = await axios.put(
        `${ServerUrl}/api/competencies/pathway-progress`,
        { stepIndex, status },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update pathway progress.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] block mb-1">
              SkillSetu AI • Official Skill Intelligence System
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
              {t("dashboard.title", "Officer Performance Dashboard")}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#101014]/70 mt-1">
              Officer: <span className="font-semibold text-[#101014]">{userData?.name || "Statistical Cadre Officer"}</span> •{" "}
              <span>{userData?.jobRole || "Indian Statistical Service (ISS) Officer"}</span> •{" "}
              <span className="font-mono text-[11px]">{userData?.department || "Statistical Cadre Unit"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ArtButton
              variant="secondary"
              size="sm"
              onClick={handleRecalculate}
              isLoading={isSyncing}
              icon={FaSyncAlt}
            >
              Recalculate Scores
            </ArtButton>

            <ArtButton
              variant="primary"
              size="sm"
              onClick={handleDownloadPDF}
              icon={FaFilePdf}
            >
              Export Dossier (PDF)
            </ArtButton>
          </div>
        </div>

        {/* BROADCAST ALERT */}
        {broadcasts.length > 0 && (
          <div className="p-4 bg-white border border-[#101014] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-mono text-xs shrink-0">
                <FaBullhorn size={13} />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2D81FF] block">
                  MoSPI Directorate Circular
                </span>
                <p className="font-sans text-xs font-semibold text-[#101014] truncate">
                  {broadcasts[0].title}: {broadcasts[0].message}
                </p>
              </div>
            </div>
            <ArtButton
              variant="outline"
              size="sm"
              onClick={() => navigate("/materials")}
            >
              View Dispatch
            </ArtButton>
          </div>
        )}

        {/* TOP METRIC CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ArtCard padding="md" className="border-l-4 border-l-[#101014]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60 block">
              Overall Competency
            </span>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#101014]">
              {knowledgeStats.overallScore}%
            </div>
            <div className="mt-1 font-mono text-xs text-[#2D81FF] font-bold">
              {knowledgeStats.overallLevel}
            </div>
          </ArtCard>

          <ArtCard padding="md" className="border-l-4 border-l-[#D64545]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60 block">
              High Priority Gaps
            </span>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#D64545]">
              {knowledgeStats.criticalCount}
            </div>
            <div className="mt-1 font-mono text-xs text-[#101014]/60">
              {knowledgeStats.developingCount} Moderate • {knowledgeStats.masteredCount} Satisfied
            </div>
          </ArtCard>

          <ArtCard padding="md" className="border-l-4 border-l-[#2D81FF]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60 block">
              Continuous Learning
            </span>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#101014]">
              {knowledgeStats.learningHours} hrs
            </div>
            <div className="mt-1 font-mono text-xs text-[#101014]/60">
              {profile?.learningPath?.filter((s) => s.status === "completed").length || 0} Modules Completed
            </div>
          </ArtCard>

          <ArtCard padding="md" className="border-l-4 border-l-[#101014]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60 block">
              Evaluations Taken
            </span>
            <div className="mt-2 font-display text-4xl font-extrabold text-[#101014]">
              {knowledgeStats.completedQuizzes + knowledgeStats.completedInterviews + knowledgeStats.completedAssignments}
            </div>
            <div className="mt-1 font-mono text-xs text-[#101014]/60">
              {knowledgeStats.completedQuizzes} Quizzes • {knowledgeStats.completedInterviews} Vivas • {knowledgeStats.completedAssignments} Practicums
            </div>
          </ArtCard>
        </div>

        {/* 4-DOMAIN RADAR & BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Radar Chart */}
          <ArtCard padding="md" className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#101014]">
                    4-Domain Competency Radar
                  </h3>
                  <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                    Versus 75% Cadre Benchmark
                  </span>
                </div>
                <ArtBadge variant="neutral">Competency Framework</ArtBadge>
              </div>

              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis
                      dataKey="domain"
                      tick={{ fill: "#101014", fontSize: 11, fontFamily: "Geist Mono", fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "#101014", fontSize: 9, fontFamily: "Geist Mono" }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#101014"
                      fill="#101014"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="benchmark"
                      stroke="#2D81FF"
                      fill="#2D81FF"
                      fillOpacity={0.05}
                      strokeDasharray="3 3"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between font-mono text-[10px] uppercase text-[#101014]/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#101014]" /> Verified Score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-[#2D81FF] bg-transparent" /> Cadre Standard (75%)
              </span>
            </div>
          </ArtCard>

          {/* 4 Knowledge Domain Summaries */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {radarData.map((dom) => (
              <ArtCard key={dom.domain} padding="md" className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#101014]/60">
                      Domain
                    </span>
                    <span className="font-mono text-sm font-bold text-[#101014]">
                      {dom.score}%
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-base text-[#101014] mt-1">
                    {dom.domain} Competency
                  </h4>

                  <div className="w-full bg-[#E5E7EB] h-2 rounded-none mt-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dom.score >= 75 ? "bg-[#101014]" : dom.score >= 50 ? "bg-[#2D81FF]" : "bg-[#D64545]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, dom.score))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs font-sans text-[#101014]/70">
                  <span>Target: 75%</span>
                  <span className={dom.score >= 75 ? "text-emerald-700 font-bold" : "text-[#D64545] font-bold"}>
                    {dom.score >= 75 ? "Meets Standard" : `Deficit: ${75 - dom.score}%`}
                  </span>
                </div>
              </ArtCard>
            ))}
          </div>
        </div>

        {/* SKILL GAP SEVERITY SECTION */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#E5E7EB]">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#2D81FF] block mb-1">
                Cadre Benchmark Analysis
              </span>
              <h3 className="font-display font-bold text-xl text-[#101014]">
                Identified Skill Deficits & Remediation Targets
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <ArtChip
                active={skillGapFilter === "all"}
                onClick={() => setSkillGapFilter("all")}
              >
                All Gaps ({allPossibleSkillGaps.length})
              </ArtChip>
              <ArtChip
                active={skillGapFilter === "high"}
                onClick={() => setSkillGapFilter("high")}
              >
                High Priority
              </ArtChip>
              <ArtChip
                active={skillGapFilter === "medium"}
                onClick={() => setSkillGapFilter("medium")}
              >
                Moderate
              </ArtChip>
              <ArtChip
                active={skillGapFilter === "low"}
                onClick={() => setSkillGapFilter("low")}
              >
                Satisfied
              </ArtChip>
            </div>
          </div>

          <div className="space-y-2">
            {filteredSkillGaps.slice(0, 6).map((gap, idx) => (
              <ArtCard
                key={idx}
                padding="sm"
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#101014] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                      {gap.domain}
                    </span>
                    <span className="text-[#101014]/30 text-xs">•</span>
                    <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                      Level: {gap.currentLevel} → Target: {gap.requiredLevel}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-[#101014] truncate">
                    {gap.competencyName}
                  </h4>
                  <p className="text-xs text-[#101014]/70 font-sans">
                    {gap.recommendedAction}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ArtBadge
                    variant={gap.priority === "High" ? "danger" : gap.priority === "Medium" ? "neutral" : "primary"}
                  >
                    {gap.priority} Priority
                  </ArtBadge>
                  <ArtButton
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/learning-path")}
                  >
                    Resolve Gap
                  </ArtButton>
                </div>
              </ArtCard>
            ))}
          </div>
        </section>

        {/* ADAPTIVE LEARNING PATHWAY SUMMARY */}
        <section className="space-y-4">
          <ArtSectionHeader
            overline="iGOT Karmayogi & NSSTA TPAC"
            title="Curated Adaptive Learning Pathway"
            subtitle="Sequenced training modules designed to address your verified capability gaps."
            actions={
              <ArtButton
                variant="outline"
                size="sm"
                onClick={() => navigate("/learning-path")}
                iconRight={FaArrowRight}
              >
                Full Pathway
              </ArtButton>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(profile?.learningPath || []).slice(0, 3).map((step, idx) => (
              <ArtCard key={idx} padding="md" className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2D81FF]">
                      Step {step.step || idx + 1} • {step.provider || "iGOT Karmayogi"}
                    </span>
                    <ArtBadge variant={step.status === "completed" ? "primary" : "neutral"}>
                      {step.status || "In Progress"}
                    </ArtBadge>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-[#101014] leading-snug">
                    {step.title}
                  </h4>
                  <p className="font-mono text-[10px] text-[#101014]/60 uppercase">
                    Duration: {step.duration || "10 Hours"} • Focus: {step.skillAddressed}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs text-[#101014]/60">Target: Advanced</span>
                  {step.status !== "completed" ? (
                    <ArtButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateCourseStatus(idx, "completed")}
                    >
                      Mark Complete
                    </ArtButton>
                  ) : (
                    <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </ArtCard>
            ))}
          </div>
        </section>

        {/* RECENT ACTIVITY & EVALUATIONS */}
        <section className="space-y-4">
          <ArtSectionHeader
            overline="Audit Trail"
            title="Recent Assessment & Evaluation Activity"
            subtitle="Historical timeline of tests, mock viva voce recordings, and case study submissions."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quiz attempts */}
            <ArtCard padding="md" className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <h4 className="font-display font-bold text-sm text-[#101014]">
                  Recent Statistical Quizzes
                </h4>
                <ArtButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/quizzes")}
                >
                  View All
                </ArtButton>
              </div>

              {quizAttempts.length === 0 ? (
                <p className="text-xs text-[#101014]/60 py-4">No quiz attempts recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {quizAttempts.slice(0, 3).map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-sans font-semibold text-[#101014] block truncate">
                          {q.quizTitle || q.topic || `Quiz Evaluation #${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                          {q.totalQuestions || 10} Questions
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#101014] shrink-0">
                        Score: {q.score !== undefined ? `${q.score}%` : "Recorded"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ArtCard>

            {/* Oral Vivas */}
            <ArtCard padding="md" className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <h4 className="font-display font-bold text-sm text-[#101014]">
                  AI Oral Board Viva Sessions
                </h4>
                <ArtButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/history")}
                >
                  View History
                </ArtButton>
              </div>

              {interviews.length === 0 ? (
                <p className="text-xs text-[#101014]/60 py-4">No viva voce evaluations recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {interviews.slice(0, 3).map((iv, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-sans font-semibold text-[#101014] block truncate">
                          {iv.role || iv.jobRole || `Oral Board Session #${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-[#2D81FF] uppercase">
                          Speech-to-Text Rubric
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#101014] shrink-0">
                        Score: {iv.finalScore || iv.score || 75}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ArtCard>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
