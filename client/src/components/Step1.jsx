import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaChartLine,
  FaFileUpload,
  FaMicrophoneAlt,
  FaUserTie,
  FaAward,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BsFillCameraVideoFill, BsShieldCheck } from "react-icons/bs";
import axios from "axios";
import { ServerUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import toast from "react-hot-toast";

const PRESET_ROLES = [
  "Indian Statistical Service (ISS) Officer",
  "Subordinate Statistical Service (SSS / JSO)",
  "FOD Field Investigator (NSSO)",
  "Data Scientist & Statistical Analyst",
  "Statistical Data Engineer & Systems Architect",
  "Director / Survey Methodologist",
];

const Step1 = ({ onStart }) => {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [role, setRole] = useState(userData?.jobRole || PRESET_ROLES[0]);
  const [experience, setExperience] = useState("2 Years");
  const [mode, setMode] = useState("Technical");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);

  useEffect(() => {
    if (userData?.jobRole) {
      setRole(userData.jobRole);
    }
    const fetchDiagnostic = async () => {
      try {
        const { data } = await axios.get(`${ServerUrl}/api/competencies/diagnostic-status`, {
          withCredentials: true,
        });
        if (data.success) {
          setDiagnosticStatus(data);
          if (data.diagnosticInterview?.role) {
            setRole(data.diagnosticInterview.role);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch diagnostic viva status:", err.message);
      }
    };
    fetchDiagnostic();
  }, [userData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File size exceeds 5MB limit.");
        toast.error("File size exceeds 5MB limit.");
        setResumeFile(null);
      } else {
        setResumeFile(file);
      }
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return;
    setAnalyzing(true);

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/resume",
        formData,
        { withCredentials: true }
      );
      setRole(result.data.role || role);
      setExperience(result.data.experience || experience);
      setProjects(result.data.projects || []);
      setSkills(result.data.skills || []);
      setResumeText(result.data.resumeFile || result.data.resumeText || "");
      setAnalysisDone(true);
      toast.success("Resume parsed & tailored questions ready! ✨");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.messages ||
        "Failed to parse resume."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
    if (!role || !experience) {
      toast.error("Please fill in role and experience.");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/generate-questions",
        { role, experience, mode, resumeText, projects, skills },
        { withCredentials: true }
      );
      if (userData && result.data.creditsLeft !== undefined) {
        dispatch(
          setUserData({ ...userData, credits: result.data.creditsLeft })
        );
      }
      toast.success("AI Interview session initialized! 🎙️");
      onStart(result.data);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.messages ||
        "Failed to start interview."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiagnostic = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${ServerUrl}/api/interview/diagnostic`, {
        withCredentials: true,
      });
      if (data && data.success && Array.isArray(data.question) && data.question.length > 0) {
        toast.success("Cadre Diagnostic Viva loaded! 🎙️");
        onStart(data);
        return;
      }
    } catch (err) {
      console.warn("Direct diagnostic load error:", err.message);
    }
    setRole(diagnosticStatus?.diagnosticInterview?.role || role);
    handleStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full flex items-center justify-center my-auto py-2 sm:py-4"
    >
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-5 relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4 sm:p-6 lg:p-7 text-white flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <BsShieldCheck size={12} />
                <span>SkillSetu AI • Viva Engine</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-tight">
                AI Cadre Mock Interview & Viva Voce
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice high-stakes board interviews with interactive video avatars, real-time speech recognition, and instant SkillSetu AI evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-2 sm:gap-2.5 pt-1">
              {[
                {
                  icon: <BsFillCameraVideoFill className="text-blue-400 text-sm" />,
                  title: "Interactive AI Video Avatar",
                  desc: "Realistic live interviewer with voice readout",
                },
                {
                  icon: <FaMicrophoneAlt className="text-emerald-400 text-sm" />,
                  title: "Real-Time Voice Recognition",
                  desc: "Answer naturally using your microphone",
                },
                {
                  icon: <FaChartLine className="text-amber-400 text-sm" />,
                  title: "Diagnostic Scoring",
                  desc: "Detailed scorecard with strengths & model answers",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 sm:gap-3 bg-white/10 dark:bg-white/5 border border-white/10 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md"
                >
                  <div className="p-1.5 rounded-lg sm:rounded-xl bg-white/10 mt-0.5 shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[10px] text-slate-300 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Powered by SkillSetu AI</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Voice AI
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-7 p-4 sm:p-6 lg:p-7 bg-white dark:bg-slate-900 space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white">
                Configure Your Interview Session
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Customize your target cadre, experience level, and upload an optional resume.
              </p>
            </div>

            {diagnosticStatus && !diagnosticStatus.isInterviewCompleted && (
              <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    <BsShieldCheck size={11} className="text-indigo-500 animate-pulse" />
                    <span>Official Cadre Diagnostic Viva Assigned</span>
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {diagnosticStatus.diagnosticInterview?.role || "Cadre Oral Board Viva Voce"}
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    Mandatory baseline assessment to establish oral reasoning & governance metrics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartDiagnostic}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer hover:scale-105 transition"
                >
                  <BsFillCameraVideoFill size={11} />
                  <span>Start Official Viva →</span>
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Cadre / Job Role
                </label>
                <div className="relative">
                  <FaUserTie className="absolute top-3 left-3 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Enter or pick a role..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    onChange={(e) => setRole(e.target.value)}
                    value={role}
                  />
                </div>

                <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto sm:max-h-none py-0.5">
                  {PRESET_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${role === r
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Experience Level
                  </label>
                  <div className="relative">
                    <FaBriefcase className="absolute top-3 left-3 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="e.g. 2 Years, 5+ Years"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 outline-none transition"
                      onChange={(e) => setExperience(e.target.value)}
                      value={experience}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interview Mode
                  </label>
                  <select
                    onChange={(e) => setMode(e.target.value)}
                    value={mode}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Technical">Technical & Methodological Viva</option>
                    <option value="HR">HR, Cadre & Situational</option>
                  </select>
                </div>
              </div>

              {!analysisDone ? (
                <div
                  onClick={() => document.getElementById("resumeUpload").click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <FaFileUpload className="text-lg mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                  <input
                    type="file"
                    accept="application/pdf"
                    id="resumeUpload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-xs mx-auto">
                    {resumeFile ? resumeFile.name : "Upload Resume / Bio-data (Optional PDF)"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    SkillSetu AI will extract skills to tailor specific questions
                  </span>
                  {fileError && (
                    <span className="text-[10px] text-rose-500 font-semibold block mt-1">
                      {fileError}
                    </span>
                  )}

                  {resumeFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadResume();
                      }}
                      className="mt-2 px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      {analyzing ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <HiSparkles size={12} className="text-amber-300" />
                          <span>Analyze Resume with AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <FaAward size={12} />
                      <span>Resume Parsed Successfully</span>
                    </span>
                    <button
                      onClick={() => setAnalysisDone(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 6).map((s, i) => (
                        <span
                          key={i}
                          className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!role || !experience || analyzing || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Cadre Questions...</span>
              </div>
            ) : (
              <>
                <BsFillCameraVideoFill size={15} />
                <span>Launch Live AI Interview Session</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Step1;

