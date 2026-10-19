import { FaTachometerAlt, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BackButton from "./BackButton";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateInterviewPDF } from "../utils/pdfGenerator";
import { useSelector } from "react-redux";

const Step3 = ({ report }) => {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-white/70 backdrop-blur-md px-8 py-10 shadow-xl border border-slate-200">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>

          <div className="text-center">
            <p className="text-lg font-semibold text-slate-700 animate-pulse">
              Loading Report...
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Please wait while we prepare your data
            </p>
          </div>
        </div>
      </div>
    );
  }
  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    questionWiseScore = [],
  } = report;

  const questionWiseScoreData = questionWiseScore.map((q, index) => ({
    name: `Q${index + 1}`,
    score: q.score || 0,
  }));
  const skills = [
    { label: "Confidence", value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness", value: correctness },
  ];

  const performanceText =
    finalScore >= 8
      ? "Ready for job opportunities."
      : finalScore >= 5
      ? "Needs minor improvement before interviews."
      : "Significant improvement required.";

  const shortTagline =
    finalScore >= 8
      ? "Excellent clarity and structured response."
      : finalScore >= 5
      ? "Good foundation, refine articulation."
      : "Work on clarity and confidence.";

  const score = finalScore;
  const percentage = (score / 10) * 100;

  const downloadPDF = () => {
    generateInterviewPDF({
      interview: {
        ...report,
        role: report.role || userData?.jobRole || "Indian Statistical Service (ISS) Officer",
        question: report.questionWiseScore || report.question || [],
        questions: report.questionWiseScore || report.question || [],
        finalScore: report.finalScore,
        confidence: report.confidence,
        communication: report.communication,
        correctness: report.correctness,
      },
      user: userData,
    });
  };

  return (
    <div className="w-full relative overflow-hidden py-4 sm:py-0 transition-colors duration-300">
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-300/20 dark:bg-emerald-500/10 blur-[120px] rounded-full opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 blur-[140px] rounded-full opacity-50 pointer-events-none"></div>

      <div className="relative z-10 flex items-center justify-between mb-3">
        <BackButton fallbackUrl="/history" label="Back to Interview History" />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
          Official Cadre Viva Evaluation
        </span>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-4">
        <div className="flex items-center gap-4 sm:gap-5">

          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Interview{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm font-medium">
              SkillSetu AI official competency scorecard & diagnostic evaluation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg px-5 py-3.5 rounded-2xl font-bold text-xs text-white flex items-center gap-2 cursor-pointer"
          >
            <FaTachometerAlt size={13} />
            <span>Go to Dashboard</span>
          </button>
          <button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg px-6 py-3.5 rounded-2xl font-bold text-xs text-white cursor-pointer"
          >
            Download Report (PDF)
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xs"
          >
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
              Overall Performance
            </p>

            <div className="w-36 h-36 mx-auto">
              <CircularProgressbar
                value={percentage}
                text={`${score}/10`}
                styles={buildStyles({
                  textSize: "16px",
                  pathColor: "#10b981",
                  textColor: "#10b981",
                  trailColor: "#334155",
                })}
              />
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {performanceText}
              </h3>

              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs">{shortTagline}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xs"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              Skill Evaluation
            </h3>

            <div className="space-y-6">
              {skills.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2 text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{s.label}</span>

                    <span className="text-emerald-600 dark:text-emerald-400">
                      {s.value}/10
                    </span>
                  </div>

                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value * 10}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Question Performance Trend
              </h3>

              <div className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                Live Analytics
              </div>
            </div>

            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={questionWiseScoreData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />

                  <XAxis dataKey="name" stroke="#64748b" textAnchor="middle" />
                  <YAxis domain={[0, 10]} stroke="#64748b" />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "10px 14px",
                    }}
                    itemStyle={{ color: "#10b981", fontWeight: "700" }}
                    labelStyle={{ color: "#0f172a", fontWeight: "800" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Question Breakdown
              </h3>

              <div className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                AI Evaluation
              </div>
            </div>

            <div className="space-y-5">
              {questionWiseScore.map((q, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-5 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                        Question {i + 1}
                      </p>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.question || "Question not available"}
                      </h4>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm min-w-[75px] text-center shrink-0">
                      {q.score ?? 0}/10
                    </div>
                  </div>

                  {(q.answer || q.userAnswer) && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 mb-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Candidate Spoken Response:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">{q.answer || q.userAnswer}</p>
                    </div>
                  )}

                  <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>

                      <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        AI Cadre Feedback
                      </p>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                      {q.feedback?.trim()
                        ? q.feedback
                        : "No feedback available for this question."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                <span>🎯 Evaluation Recorded on Cadre Dossier</span>
              </h4>
              <p className="text-xs text-slate-300">
                Your Viva Voce score and competency analytics are synchronized with your User Dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <FaTachometerAlt size={13} />
                <span>Return to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FaRedo size={11} />
                <span>Practice Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
