import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { useNavigate } from "react-router-dom";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaTasks,
  FaPlay,
  FaHistory,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { BsStars, BsShieldCheck } from "react-icons/bs";
import { CardGridSkeleton } from "../components/SkeletonLoader";
import { useTranslation } from "react-i18next";
import {
  ArtButton,
  ArtCard,
  ArtChip,
  ArtSectionHeader,
  ArtBadge,
  ArtInput,
  ArtSelect,
} from "../components/ArtCraftUI";

const SAMPLE_TOPICS = [
  "Sampling Techniques & Estimation",
  "National Accounts & GDP Compilation",
  "Price Statistics & CPI Compilation",
  "Labour & Employment Statistics (PLFS)",
  "Statistical Computing & Automated Processing",
  "Data Quality Assurance & NQAF",
  "Data Privacy, Ethics & Anonymization",
];

const Quizzes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("explore");
  const [quizzes, setQuizzes] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("all");

  const [showGenModal, setShowGenModal] = useState(false);
  const [topic, setTopic] = useState(SAMPLE_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [genLoading, setGenLoading] = useState(false);

  const fetchQuizzesAndAttempts = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        axios.get(`${ServerUrl}/api/quizzes/list`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/quizzes/history/my-attempts`, { withCredentials: true }),
      ]);
      if (qRes.data.success) setQuizzes(qRes.data.quizzes || []);
      if (aRes.data.success) setMyAttempts(aRes.data.attempts || []);
    } catch (error) {
      console.error("Quizzes fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndAttempts();
    const handleSync = () => fetchQuizzesAndAttempts();
    window.addEventListener("assessmentCompleted", handleSync);
    return () => window.removeEventListener("assessmentCompleted", handleSync);
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    const finalTopic = customTopic.trim() || topic;

    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/quizzes/generate`,
        {
          topic: finalTopic,
          domain: "Statistical Competencies",
          difficulty,
          numQuestions: Number(numQuestions),
        },
        { withCredentials: true }
      );

      if (data.success && data.quiz) {
        toast.success("AI Quiz successfully created! Redirecting to assessment...");
        setShowGenModal(false);
        navigate(`/quiz/${data.quiz._id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate AI quiz.");
    } finally {
      setGenLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedDomain === "all") return true;
    return q.domain?.toLowerCase().includes(selectedDomain.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/dashboard" label="Return to Dashboard" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            Assessment & Diagnostic Engine
          </span>
        </div>

        {/* HEADER */}
        <ArtCard padding="lg" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] block mb-1">
                Official Statistical Question Bank
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
                Cadre Statistical Assessments & Quizzes
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#101014]/70 mt-1 max-w-2xl">
                Diagnostic multiple-choice assessments mapped across India's statistical framework to evaluate sampling rigor, national accounts, and operational guidelines.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <ArtButton
                variant="primary"
                size="md"
                onClick={() => setShowGenModal(true)}
                icon={BsStars}
              >
                Generate AI Assessment
              </ArtButton>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
            <div className="flex items-center gap-2 border border-[#E5E7EB] p-1 bg-[#F2F1EE]">
              <button
                onClick={() => setActiveTab("explore")}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "explore"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                Catalog ({quizzes.length})
              </button>
              <button
                onClick={() => setActiveTab("attempts")}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "attempts"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                My Attempts ({myAttempts.length})
              </button>
            </div>

            {activeTab === "explore" && (
              <div className="hidden sm:flex items-center gap-1.5">
                <ArtChip
                  active={selectedDomain === "all"}
                  onClick={() => setSelectedDomain("all")}
                >
                  All Domains
                </ArtChip>
                <ArtChip
                  active={selectedDomain === "statistical"}
                  onClick={() => setSelectedDomain("statistical")}
                >
                  Statistical
                </ArtChip>
                <ArtChip
                  active={selectedDomain === "technical"}
                  onClick={() => setSelectedDomain("technical")}
                >
                  Technical
                </ArtChip>
                <ArtChip
                  active={selectedDomain === "governance"}
                  onClick={() => setSelectedDomain("governance")}
                >
                  Governance
                </ArtChip>
              </div>
            )}
          </div>
        </ArtCard>

        {/* TAB 1: EXPLORE CATALOG */}
        {activeTab === "explore" && (
          <div>
            {loading ? (
              <CardGridSkeleton count={6} />
            ) : filteredQuizzes.length === 0 ? (
              <ArtCard padding="lg" className="text-center py-12">
                <h4 className="font-display font-bold text-lg text-[#101014]">
                  No Assessments Found
                </h4>
                <p className="text-xs text-[#101014]/60 mt-1 max-w-md mx-auto">
                  Generate your first verified AI statistical quiz on-demand.
                </p>
                <div className="mt-4">
                  <ArtButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowGenModal(true)}
                  >
                    Generate AI Quiz
                  </ArtButton>
                </div>
              </ArtCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuizzes.map((quiz) => (
                  <ArtCard
                    key={quiz._id}
                    padding="md"
                    className="flex flex-col justify-between space-y-4 hover:border-[#101014] transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <ArtBadge variant="neutral">{quiz.domain || "Statistical"}</ArtBadge>
                        <ArtBadge variant={quiz.difficulty === "Hard" ? "danger" : "neutral"}>
                          {quiz.difficulty || "Medium"}
                        </ArtBadge>
                      </div>

                      <h4 className="font-sans font-bold text-base text-[#101014] leading-snug">
                        {quiz.title}
                      </h4>

                      <p className="text-xs text-[#101014]/70 line-clamp-2 font-sans">
                        {quiz.description || "Comprehensive official assessment designed to evaluate competency mastery."}
                      </p>

                      <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] font-mono text-[11px] flex items-center justify-between">
                        <span>{quiz.questions?.length || 5} Questions</span>
                        <span>⏱️ {quiz.timeLimitMinutes || 10} Mins</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                        Standard: 75%
                      </span>
                      <ArtButton
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/quiz/${quiz._id}`)}
                        icon={FaPlay}
                      >
                        Start Quiz
                      </ArtButton>
                    </div>
                  </ArtCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ATTEMPTS */}
        {activeTab === "attempts" && (
          <div className="space-y-4">
            {myAttempts.length === 0 ? (
              <ArtCard padding="lg" className="text-center py-12">
                <h4 className="font-display font-bold text-lg text-[#101014]">
                  No Assessment Attempts Yet
                </h4>
                <p className="text-xs text-[#101014]/60 mt-1 max-w-md mx-auto">
                  Take your first test from the catalog to see verified scores and feedback.
                </p>
              </ArtCard>
            ) : (
              <div className="space-y-3">
                {myAttempts.map((att, idx) => (
                  <ArtCard
                    key={idx}
                    padding="md"
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#101014] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArtBadge variant="neutral">
                          {att.domain || "Statistical Assessment"}
                        </ArtBadge>
                        <span className="font-mono text-[11px] text-[#101014]/60">
                          {att.createdAt ? new Date(att.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </span>
                      </div>
                      <h4 className="font-sans font-bold text-base text-[#101014]">
                        {att.quizTitle || att.topic || `Evaluation #${idx + 1}`}
                      </h4>
                      <p className="font-mono text-xs text-[#101014]/70">
                        {att.correctCount || 0} / {att.totalQuestions || 5} Questions Correct • Time Taken: {Math.round((att.timeTakenSeconds || 120) / 60)}m
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-display text-2xl font-bold text-[#101014] block leading-none">
                          {att.score !== undefined ? `${att.score}%` : "Recorded"}
                        </span>
                        <span className="font-mono text-[9px] uppercase text-[#2D81FF] font-bold">
                          {att.score >= 75 ? "Meets Standard" : "Deficit Logged"}
                        </span>
                      </div>
                    </div>
                  </ArtCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ON-DEMAND AI QUIZ GENERATION MODAL */}
        {showGenModal && (
          <div className="fixed inset-0 z-[150] bg-[#101014]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <ArtCard padding="lg" className="w-full max-w-lg bg-white border border-[#101014] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase tracking-wider block">
                    AI Pedagogical Engine
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#101014]">
                    Generate On-Demand Statistical Assessment
                  </h3>
                </div>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="font-mono text-xs font-bold p-1 text-[#101014]/60 hover:text-[#101014]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                <ArtSelect
                  label="Curated Competency Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {SAMPLE_TOPICS.map((top) => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                </ArtSelect>

                <ArtInput
                  label="Or Custom Statistical Topic"
                  placeholder="e.g. CPI Urban Non-Manual Workers, ASI Frame..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <ArtSelect
                    label="Difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Foundational)</option>
                    <option value="Medium">Medium (Cadre Standard)</option>
                    <option value="Hard">Hard (ISS Leadership)</option>
                  </ArtSelect>

                  <ArtSelect
                    label="Questions Count"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </ArtSelect>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
                  <ArtButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowGenModal(false)}
                  >
                    Cancel
                  </ArtButton>
                  <ArtButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={genLoading}
                  >
                    Generate & Launch
                  </ArtButton>
                </div>
              </form>
            </ArtCard>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Quizzes;
