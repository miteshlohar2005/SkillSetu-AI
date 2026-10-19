import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import {
  FaBrain,
  FaArrowRight,
  FaSlidersH,
  FaUserTie,
  FaHandSparkles,
  FaFilePdf,
  FaTachometerAlt,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BsShieldCheck, BsBarChartSteps } from "react-icons/bs";
import { generateCompetencyPDF } from "../utils/pdfGenerator";

const CADRE_LIST = [
  "Indian Statistical Service (ISS) Officer",
  "Senior Statistical Officer (SSO)",
  "Junior Statistical Officer (JSO)",
  "Field Operations / Investigator (FOD)",
  "Data Scientist / Statistical Analyst",
  "Director / Division Head (CSO / NSSO)",
];

const DEPARTMENT_LIST = [
  "National Sample Survey Office (NSSO)",
  "Central Statistics Office (CSO)",
  "National Accounts Division (NAD)",
  "Economic Statistics Division (ESD)",
  "Field Operations Division (FOD)",
  "Survey Design & Research Division (SDRD)",
  "Data Quality & Dissemination Division",
  "State Directorate of Economics & Statistics (DES)",
  "National Statistical Headquarters (HQ)",
];

const CORE_EVALUATION_SKILLS = [
  { id: "Survey Design & Methodologies", domain: "Statistical", desc: "Design of questionnaire schedules, sampling units, stratification, and field testing." },
  { id: "Sampling Techniques & Estimation", domain: "Statistical", desc: "PPS sampling, cluster sampling, multiplier estimation, and standard error calculation." },
  { id: "National Accounts & GDP Compilation", domain: "Statistical", desc: "Gross Value Added (GVA), Supply-Use Tables (SUT), SNA 2008 sequence of accounts." },
  { id: "Price Statistics (CPI, WPI, Inflation)", domain: "Statistical", desc: "Laspeyres index weighting, item specification, and elementary aggregate index compilation." },
  { id: "Labour & Employment Statistics (PLFS)", domain: "Statistical", desc: "Periodic Labour Force Survey schedules, usual status, and current weekly status." },
  { id: "Data Quality Assurance & NQAF", domain: "Statistical", desc: "Adherence to UN-NQAF, consistency checks, imputation, and validation auditing." },
  { id: "Statistical Computing & Automated Survey Data Processing", domain: "Technical", desc: "Automated survey data validation, cleaning, tabulation, and microdata processing." },
  { id: "Microdata Analytics & Survey Weighting Methodologies", domain: "Technical", desc: "Complex survey design weighting, standard error estimation, and statistical modeling." },
  { id: "Statistical Database Systems & Registry Linkage", domain: "Technical", desc: "Querying statistical registries, database linkage, and statistical integrity standards." },
  { id: "Data Privacy, Ethics & Anonymization", domain: "Digital Governance", desc: "DPDP Act compliance, statistical disclosure control (SDC), and k-anonymity." },
  { id: "Cybersecurity & Data Protection (Cert-In)", domain: "Digital Governance", desc: "Gov-CERT guidelines, secure data transfer, password hygiene, and access control." },
  { id: "Statistical Leadership & Team Governance", domain: "Managerial", desc: "Cadre management, statistical project oversight, and inter-agency coordination." },
  { id: "Evidence-Based Policy & Decision Making", domain: "Managerial", desc: "Translating empirical statistical evidence into executive policy briefs." },
];

const CompetencyAssessment = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [profile, setProfile] = useState(null);

  const [jobRole, setJobRole] = useState(CADRE_LIST[0]);
  const [department, setDepartment] = useState(DEPARTMENT_LIST[0]);
  const [designation, setDesignation] = useState("Statistical Officer");
  const [workExperience, setWorkExperience] = useState(3);
  const [educationalQualification, setEducationalQualification] = useState("Master's in Statistics / Economics");
  const [ratings, setRatings] = useState({});

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${ServerUrl}/api/competencies/my-profile`, {
        withCredentials: true,
      });
      if (data.success && data.profile) {
        setProfile(data.profile);
        setJobRole(data.profile.jobRole || CADRE_LIST[0]);
        setDepartment(data.profile.department || DEPARTMENT_LIST[0]);
        setDesignation(data.profile.designation || "Statistical Officer");
        setWorkExperience(data.profile.workExperience || 3);
        setEducationalQualification(data.profile.educationalQualification || "Master's in Statistics / Economics");

        const initialRatings = {};
        CORE_EVALUATION_SKILLS.forEach((skill) => {
          const found = (data.profile.competencies || []).find((c) => c.competencyName === skill.id);
          initialRatings[skill.id] = found ? Math.round(found.score / 20) : 3;
        });
        setRatings(initialRatings);

        if (data.profile.competencies && data.profile.competencies.length > 0) {
          setActiveTab("results");
        }
      }
    } catch (error) {
      console.error("Fetch competency profile error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRatingChange = (skillId, val) => {
    setRatings((prev) => ({
      ...prev,
      [skillId]: Number(val),
    }));
  };

  const handleRunAssessment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${ServerUrl}/api/competencies/update-profile`,
        {
          jobRole,
          department,
          designation,
          workExperience,
          educationalQualification,
        },
        { withCredentials: true }
      );

      const { data } = await axios.post(
        `${ServerUrl}/api/competencies/assess`,
        { selfRatings: ratings },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message || "Assessment successfully completed! ✨");
        if (data.user) {
          dispatch(setUserData(data.user));
        }
        window.dispatchEvent(new CustomEvent("assessmentCompleted", { detail: data }));
        localStorage.setItem("lastAssessmentUpdate", Date.now().toString());

        await fetchProfile();
        setActiveTab("results");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run AI competency assessment.");
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return "1 — Basic Awareness";
      case 2:
        return "2 — Elementary Concepts";
      case 3:
        return "3 — Working Competence";
      case 4:
        return "4 — Advanced Practitioner";
      case 5:
        return "5 — Domain Authority";
      default:
        return `${val} — Intermediate`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-19 pb-16 space-y-3">
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/ai-models" label="Back to AI Models" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Competency Radar & Framework
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <BsShieldCheck size={13} />
              <span>{t("competency.badge")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {t("competency.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("competency.subtitle")}
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "form"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {t("competency.selfRatingTab")}
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === "results"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {t("competency.resultsTab")}
            </button>
          </div>
        </div>

        {activeTab === "form" && (
          <form onSubmit={handleRunAssessment} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaUserTie className="text-blue-600" />
                <span>1. Official Profile & Cadre Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Target Cadre / Job Role
                  </label>
                  <select
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-blue-500"
                  >
                    {CADRE_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Department / Division
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-blue-500"
                  >
                    {DEPARTMENT_LIST.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Statistical Officer"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Years of Experience in Official Statistics
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Educational Qualifications
                  </label>
                  <input
                    type="text"
                    value={educationalQualification}
                    onChange={(e) => setEducationalQualification(e.target.value)}
                    placeholder="e.g. M.Sc. Statistics (Gold Medalist), University of Delhi"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FaSlidersH className="text-blue-600" />
                  <span>2. Multi-Domain Competency Self-Ratings (1 to 5 Scale)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Rate your current proficiency across core official statistical skills. The SkillSetu AI Engine will synthesize this with your cadre benchmarks to compute your competency score and skill gaps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CORE_EVALUATION_SKILLS.map((skill) => {
                  const val = ratings[skill.id] || 3;
                  return (
                    <div
                      key={skill.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full uppercase">
                            {skill.domain}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1">
                            {skill.id}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {skill.desc}
                          </p>
                        </div>

                        <span className="text-xs font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                          {val}/5
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={val}
                          onChange={(e) => handleRatingChange(skill.id, e.target.value)}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>1 Basic</span>
                          <span className="text-blue-600 dark:text-blue-400 font-extrabold">{getRatingLabel(val)}</span>
                          <span>5 Expert</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white font-bold text-sm shadow-xl hover:shadow-blue-700/30 hover:scale-102 active:scale-98 transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FaHandSparkles size={16} className="text-amber-300" />
                    <span>{t("competency.submitBtn")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === "results" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black text-xl">
                  {profile?.overallCompetencyScore !== undefined && profile?.overallCompetencyScore !== null ? profile.overallCompetencyScore : 0}%
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Overall Competency Score</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile?.overallLevel || "Novice"} Level
                  </h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black text-xl">
                  {profile?.skillGaps?.length || 0}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Identified Skill Gaps</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {(profile?.skillGaps || []).filter((g) => g.priority === "High").length} High Priority
                  </h3>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Target Cadre Standard</span>
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate max-w-[180px]">
                    {profile?.jobRole || "ISS Officer"}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("form")}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-bold text-blue-600 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <HiSparkles size={16} className="text-amber-400" />
                <span>AI Assessment Complete: Multi-Domain scores & Skill Gaps computed.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate("/skill-gaps")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BsBarChartSteps size={12} />
                  <span>Deep Skill Gap Analysis</span>
                  <FaArrowRight size={10} />
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTachometerAlt size={12} />
                  <span>Dashboard</span>
                  <FaArrowRight size={10} />
                </button>

                <button
                  onClick={() =>
                    generateCompetencyPDF({
                      user: profile,
                      profile: profile,
                      competencies: profile?.competencies || [],
                      skillGaps: profile?.skillGaps || [],
                      learningPath: profile?.learningPath || [],
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FaFilePdf size={13} />
                  <span>Download Dossier (PDF)</span>
                </button>

                <button
                  onClick={() => navigate("/learning-path")}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Learning Pathway</span>
                  <FaArrowRight size={10} />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaBrain className="text-blue-600" />
                <span>Full Competency Matrix & Evidence Source</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Competency Name</th>
                      <th className="p-3.5">Domain</th>
                      <th className="p-3.5">Assessed Score</th>
                      <th className="p-3.5">Level</th>
                      <th className="p-3.5">Source</th>
                      <th className="p-3.5 rounded-r-xl">Assessment Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(profile?.competencies || []).map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {comp.competencyName}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">{comp.domain}</td>
                        <td className="p-3.5">
                          <span
                            className={`font-black ${comp.score >= 75 ? "text-emerald-600" : comp.score >= 55 ? "text-blue-600" : "text-amber-600"
                              }`}
                          >
                            {comp.score}%
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {comp.level || "Intermediate"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-semibold text-slate-400 capitalize">
                            {comp.source || "self-reported"}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                          {comp.rationale || "Synthesized from tenure and self-rating."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CompetencyAssessment;
