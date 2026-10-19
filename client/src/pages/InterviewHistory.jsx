import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import toast from "react-hot-toast";
import { ServerUrl } from "../App";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import {
  FaCalendarAlt,
  FaFilePdf,
  FaTasks,
  FaSearch,
  FaMicrophone,
  FaFileAlt,
  FaAward,
} from "react-icons/fa";
import { BsRobot, BsShieldCheck } from "react-icons/bs";
import {
  ArtButton,
  ArtCard,
  ArtChip,
  ArtSectionHeader,
  ArtBadge,
  ArtInput,
  ArtSelect,
} from "../components/ArtCraftUI";

export const getGradeFromScore = (score) => {
  if (score === undefined || score === null) return "N/A";
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
};

const InterviewHistory = () => {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [chats, setChats] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllHistory = async () => {
    try {
      const [chatRes, interviewRes, assignRes, quizRes] = await Promise.allSettled([
        axios.get(`${ServerUrl}/api/chat/get`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/interview/get-interview`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/assignments/history/my-submissions`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/quizzes/history/my-attempts`, { withCredentials: true }),
      ]);

      if (chatRes.status === "fulfilled" && chatRes.value.data?.success) {
        setChats(chatRes.value.data.chats || []);
      }
      if (interviewRes.status === "fulfilled") {
        const val = interviewRes.value.data;
        if (Array.isArray(val)) setInterviews(val);
        else if (Array.isArray(val?.interviews)) setInterviews(val.interviews);
      }
      if (assignRes.status === "fulfilled" && assignRes.value.data?.success) {
        setAssignmentSubmissions(assignRes.value.data.submissions || []);
      }
      if (quizRes.status === "fulfilled" && quizRes.value.data?.success) {
        setQuizAttempts(quizRes.value.data.attempts || []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHistory();
  }, []);

  const allEvents = useMemo(() => {
    let list = [];

    // Vivas
    (interviews || []).forEach((iv, idx) => {
      const raw = Number(iv.finalScore) || Number(iv.score) || (iv.feedback?.rating ? iv.feedback.rating * 10 : 75);
      const score = Math.min(100, Math.max(0, Math.round(raw)));
      list.push({
        id: iv._id || `iv-${idx}`,
        type: "interview",
        typeName: "Oral Board Viva",
        title: iv.role || iv.jobRole || "Cadre Oral Examination",
        domain: "Oral Board",
        score,
        date: iv.createdAt ? new Date(iv.createdAt) : new Date(),
        detailsUrl: `/report/${iv._id}`,
        rawItem: iv,
      });
    });

    // Quizzes
    (quizAttempts || []).forEach((q, idx) => {
      let sc = q.score !== undefined ? q.score : q.percentage;
      if (sc === undefined || sc === null) sc = 70;
      const score = Math.min(100, Math.max(0, Math.round(sc)));
      list.push({
        id: q._id || `quiz-${idx}`,
        type: "quiz",
        typeName: "Diagnostic Quiz",
        title: q.quizTitle || q.topic || `Statistical Quiz #${idx + 1}`,
        domain: q.domain || "Statistical Competencies",
        score,
        date: q.createdAt ? new Date(q.createdAt) : new Date(),
        detailsUrl: q.quizId ? `/quiz/${q.quizId}` : "/quizzes",
        rawItem: q,
      });
    });

    // Practicums
    (assignmentSubmissions || []).forEach((a, idx) => {
      const raw = a.aiEvaluation?.overallScore !== undefined ? a.aiEvaluation.overallScore : (a.score !== undefined ? a.score : 80);
      const score = Math.min(100, Math.max(0, Math.round(raw)));
      list.push({
        id: a._id || `assign-${idx}`,
        type: "assignment",
        typeName: "Practicum Case Study",
        title: a.assignmentTitle || a.title || `Survey Practicum #${idx + 1}`,
        domain: a.domain || "Technical & Computational",
        score,
        date: a.createdAt ? new Date(a.createdAt) : new Date(),
        detailsUrl: a.assignmentId ? `/assignments/${a.assignmentId}` : "/assignments",
        rawItem: a,
      });
    });

    // Sort
    if (sortBy === "newest") list.sort((a, b) => b.date - a.date);
    else if (sortBy === "oldest") list.sort((a, b) => a.date - b.date);
    else if (sortBy === "highest") list.sort((a, b) => b.score - a.score);
    else if (sortBy === "lowest") list.sort((a, b) => a.score - b.score);

    return list;
  }, [interviews, quizAttempts, assignmentSubmissions, sortBy]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchesType = selectedFilter === "all" || ev.type === selectedFilter;
      const matchesSearch =
        searchQuery === "" ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.domain.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allEvents, selectedFilter, searchQuery]);

  const handleDownloadPDF = () => {
    toast.success("Preparing Official Performance Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData,
      profile: userData,
      competencies: userData?.competencies || [],
      skillGaps: userData?.skillGaps || [],
      learningPath: userData?.learningPath || [],
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/dashboard" label="Return to Dashboard" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            Cadre Evaluation Archive
          </span>
        </div>

        {/* HEADER */}
        <ArtCard padding="lg" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] block mb-1">
                SkillSetu AI Multi-Modal Evaluation Archive
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
                Assessment & Viva Voce Evaluation Records
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#101014]/70 mt-1 max-w-2xl">
                Comprehensive historical log of simulated oral board interviews, diagnostic multiple-choice quizzes, and practical case studies.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <ArtButton
                variant="primary"
                size="md"
                onClick={handleDownloadPDF}
                icon={FaFilePdf}
              >
                Export Dossier (PDF)
              </ArtButton>
            </div>
          </div>

          {/* FILTER CONTROLS */}
          <div className="pt-4 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <ArtInput
                placeholder="Search by assessment title, cadre topic, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={FaSearch}
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center gap-1 border border-[#E5E7EB] p-1 bg-[#F2F1EE]">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    selectedFilter === "all" ? "bg-[#101014] text-white" : "text-[#101014]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter("interview")}
                  className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    selectedFilter === "interview" ? "bg-[#101014] text-white" : "text-[#101014]"
                  }`}
                >
                  Vivas
                </button>
                <button
                  onClick={() => setSelectedFilter("quiz")}
                  className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    selectedFilter === "quiz" ? "bg-[#101014] text-white" : "text-[#101014]"
                  }`}
                >
                  Quizzes
                </button>
                <button
                  onClick={() => setSelectedFilter("assignment")}
                  className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
                    selectedFilter === "assignment" ? "bg-[#101014] text-white" : "text-[#101014]"
                  }`}
                >
                  Practicums
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <ArtSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="highest">Sort: Highest Score</option>
                <option value="lowest">Sort: Lowest Score</option>
              </ArtSelect>
            </div>
          </div>
        </ArtCard>

        {/* EVALUATION LIST */}
        <div className="space-y-4">
          {loading ? (
            <ArtCard padding="lg" className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[#101014] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101014]/60">
                Loading Historical Evaluation Logs...
              </span>
            </ArtCard>
          ) : filteredEvents.length === 0 ? (
            <ArtCard padding="lg" className="text-center py-16">
              <h4 className="font-display font-bold text-lg text-[#101014]">
                No Evaluation Records Found
              </h4>
              <p className="text-xs text-[#101014]/60 max-w-md mx-auto mt-1 font-sans">
                Take an assessment, simulated oral viva, or survey practicum to build your verified competency performance trail.
              </p>
            </ArtCard>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => {
                const grade = getGradeFromScore(ev.score);
                return (
                  <ArtCard
                    key={ev.id}
                    padding="md"
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#101014] transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ArtBadge variant={ev.type === "interview" ? "primary" : "neutral"}>
                          {ev.typeName}
                        </ArtBadge>
                        <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                          {ev.domain}
                        </span>
                        <span className="font-mono text-[11px] text-[#101014]/50">
                          ⏱️ {ev.date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <h4 className="font-sans font-bold text-base text-[#101014]">
                        {ev.title}
                      </h4>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#101014]/60">
                        <span>Score: {ev.score}%</span>
                        <span>•</span>
                        <span>Grade: {grade}</span>
                        <span>•</span>
                        <span className={ev.score >= 75 ? "text-emerald-700 font-bold" : "text-[#D64545] font-bold"}>
                          {ev.score >= 75 ? "Meets Standard" : "Deficit Noted"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-display text-3xl font-bold text-[#101014] block leading-none">
                          {ev.score}%
                        </span>
                        <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                          Grade {grade}
                        </span>
                      </div>

                      <ArtButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(ev.detailsUrl)}
                      >
                        Inspect Scorecard
                      </ArtButton>
                    </div>
                  </ArtCard>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InterviewHistory;
