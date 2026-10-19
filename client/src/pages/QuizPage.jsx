import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import ExamProctoringModal from "../components/ExamProctoringModal";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaArrowLeft,
  FaRedo,
  FaBookOpen,
} from "react-icons/fa";
import { BsShieldCheck, BsShieldExclamation } from "react-icons/bs";
import {
  ArtButton,
  ArtCard,
  ArtChip,
  ArtSectionHeader,
  ArtBadge,
} from "../components/ArtCraftUI";

const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  const tabSwitchCountRef = useRef(0);
  const isAwayRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const maxTabSwitches = 5;

  const userAnswersRef = useRef(userAnswers);
  userAnswersRef.current = userAnswers;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const submittedRef = useRef(submitted);
  submittedRef.current = submitted;
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${ServerUrl}/api/quizzes/${id}`, {
          withCredentials: true,
        });
        if (data.success && data.quiz) {
          setQuiz(data.quiz);
          setUserAnswers(new Array(data.quiz.questions.length).fill(""));
          setTimeLeft((data.quiz.timeLimitMinutes || 10) * 60);
        } else {
          toast.error("Assessment not found.");
          navigate("/quizzes");
        }
      } catch {
        toast.error("Failed to load quiz.");
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleSubmitQuiz = async (isAuto = false) => {
    if (submittedRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const totalTime = (quiz?.timeLimitMinutes || 10) * 60;
    const timeTaken = totalTime - timeLeftRef.current;

    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/quizzes/${id}/submit`,
        {
          userAnswers: userAnswersRef.current,
          timeTakenSeconds: Math.max(15, timeTaken),
          tabSwitchCount: tabSwitchCountRef.current,
        },
        { withCredentials: true }
      );

      if (data.success) {
        if (isAuto || tabSwitchCountRef.current >= maxTabSwitches) {
          toast.error(
            "🚨 Assessment auto-submitted due to tab switch limit! Redirecting...",
            { id: "auto-submit-done", duration: 4000 }
          );
          setTimeout(() => navigate("/quizzes"), 1500);
        } else {
          toast.success("Assessment submitted and evaluated! 🎯");
        }
        setResult(data);
        submittedRef.current = true;
        setSubmitted(true);
        setShowTabSwitchModal(false);

        if (data.user) {
          dispatch(
            setUserData({
              ...data.user,
              isProfileCompleted:
                data.user.isProfileCompleted !== undefined
                  ? Boolean(data.user.isProfileCompleted)
                  : true,
            })
          );
        }
        window.dispatchEvent(new CustomEvent("assessmentCompleted", { detail: data }));
        window.dispatchEvent(new CustomEvent("diagnostic-updated", { detail: data }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit assessment.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmitRef = useRef();
  handleSubmitRef.current = handleSubmitQuiz;

  useEffect(() => {
    if (submitted || loading || !quiz) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("⚠️ Right-click is restricted during examination.", { id: "rc" });
    };
    const handleCopy = (e) => {
      e.preventDefault();
      toast.error("⚠️ Copying text is restricted during examination.", { id: "copy" });
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
    };
  }, [submitted, loading, quiz]);

  // Timer countdown
  useEffect(() => {
    if (submitted || loading || !quiz) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (handleSubmitRef.current) handleSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, loading, quiz]);

  const handleSelectOption = (opt) => {
    if (submitted) return;
    const nextAnswers = [...userAnswers];
    nextAnswers[currentIdx] = opt;
    setUserAnswers(nextAnswers);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const currentQ = quiz?.questions?.[currentIdx];

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/quizzes" label="Return to Catalog" />
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#101014] border border-[#101014] px-3 py-1 bg-white">
              ⏱️ {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {loading ? (
          <ArtCard padding="lg" className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#101014] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101014]/60">
              Loading Official Assessment Questions...
            </span>
          </ArtCard>
        ) : !submitted ? (
          <div className="space-y-6">
            {/* EXAMINATION HEADER & QUESTION PALETTE */}
            <ArtCard padding="md" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase tracking-wider block">
                    {quiz?.domain || "Official Statistical System"}
                  </span>
                  <h2 className="font-display font-bold text-xl text-[#101014]">
                    {quiz?.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <ArtBadge variant="neutral">{quiz?.difficulty || "Standard"}</ArtBadge>
                  <ArtBadge variant="primary">
                    Question {currentIdx + 1} of {quiz?.questions?.length}
                  </ArtBadge>
                </div>
              </div>

              {/* PALETTE BUTTONS */}
              <div className="flex flex-wrap gap-1.5">
                {quiz?.questions?.map((_, idx) => {
                  const isAnswered = Boolean(userAnswers[idx]);
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-9 h-9 font-mono text-xs font-bold border transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-[#2D81FF] text-white border-[#2D81FF]"
                          : isAnswered
                          ? "bg-[#101014] text-white border-[#101014]"
                          : "bg-white text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </ArtCard>

            {/* CURRENT QUESTION CARD */}
            {currentQ && (
              <ArtCard padding="lg" className="space-y-6 bg-white">
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold text-[#101014]/50 uppercase tracking-wider">
                    Question 0{currentIdx + 1}
                  </span>
                  <h3 className="font-sans font-semibold text-base sm:text-lg text-[#101014] leading-relaxed">
                    {currentQ.questionText}
                  </h3>
                </div>

                {/* 4 OPTIONS */}
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentIdx] === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-3.5 sm:p-4 border transition-colors cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? "bg-[#101014] text-[#F2F1EE] border-[#101014]"
                            : "bg-white text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono font-bold text-xs border ${
                            isSelected
                              ? "bg-[#2D81FF] text-white border-[#2D81FF]"
                              : "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB]"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-medium">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* NAVIGATION CONTROLS */}
                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <ArtButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0}
                    icon={FaArrowLeft}
                  >
                    Previous
                  </ArtButton>

                  <div className="flex items-center gap-2">
                    {currentIdx < quiz.questions.length - 1 ? (
                      <ArtButton
                        variant="primary"
                        size="sm"
                        onClick={() => setCurrentIdx((prev) => prev + 1)}
                        iconRight={FaArrowRight}
                      >
                        Next Question
                      </ArtButton>
                    ) : (
                      <ArtButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitQuiz(false)}
                        isLoading={submitting}
                        icon={FaCheckCircle}
                      >
                        Finish & Submit
                      </ArtButton>
                    )}
                  </div>
                </div>
              </ArtCard>
            )}
          </div>
        ) : (
          /* RESULT SCORECARD */
          <div className="space-y-6">
            <ArtCard padding="lg" className="text-center space-y-4">
              <span className="font-mono text-[11px] font-bold text-[#2D81FF] uppercase tracking-wider block">
                Official Evaluation Report
              </span>
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-[#101014]">
                {result?.attempt?.score}%
              </h2>
              <p className="font-sans text-sm text-[#101014]/70 max-w-lg mx-auto">
                {result?.attempt?.aiFeedback || "Assessment evaluated against official MoSPI cadre benchmarks."}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-4">
                <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                  <span className="font-mono text-[10px] text-[#101014]/60 uppercase block">Correct</span>
                  <span className="font-display text-lg font-bold text-[#101014]">
                    {result?.attempt?.correctCount} / {result?.attempt?.totalQuestions}
                  </span>
                </div>
                <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                  <span className="font-mono text-[10px] text-[#101014]/60 uppercase block">Accuracy</span>
                  <span className="font-display text-lg font-bold text-[#2D81FF]">
                    {result?.attempt?.accuracy}%
                  </span>
                </div>
                <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                  <span className="font-mono text-[10px] text-[#101014]/60 uppercase block">Time Taken</span>
                  <span className="font-display text-lg font-bold text-[#101014]">
                    {Math.round((result?.attempt?.timeTakenSeconds || 60) / 60)}m
                  </span>
                </div>
                <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB]">
                  <span className="font-mono text-[10px] text-[#101014]/60 uppercase block">Tab Switches</span>
                  <span className="font-display text-lg font-bold text-[#101014]">
                    {result?.attempt?.tabSwitchCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <ArtButton
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/dashboard")}
                >
                  Return to Dashboard
                </ArtButton>
                <ArtButton
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/quizzes")}
                >
                  Assessment Catalog
                </ArtButton>
              </div>
            </ArtCard>

            {/* DETAILED QUESTION SOLUTIONS & CITATIONS */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-xl text-[#101014]">
                Detailed Solutions & Pedagogical Explanations
              </h3>

              {(result?.attempt?.userAnswers || []).map((ans, idx) => (
                <ArtCard key={idx} padding="md" className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-xs mt-0.5">
                        {ans.isCorrect ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-[#D64545] font-bold">✕</span>
                        )}
                      </span>
                      <h4 className="font-sans font-bold text-sm text-[#101014]">
                        {idx + 1}. {ans.questionText}
                      </h4>
                    </div>
                    <ArtBadge variant={ans.isCorrect ? "primary" : "danger"}>
                      {ans.isCorrect ? "Correct" : "Incorrect"}
                    </ArtBadge>
                  </div>

                  <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] text-xs font-sans space-y-1">
                    <div>
                      <span className="font-mono text-[#101014]/60">Your Response: </span>
                      <strong className={ans.isCorrect ? "text-[#101014]" : "text-[#D64545]"}>
                        {ans.selectedAnswer || "No Answer"}
                      </strong>
                    </div>
                    {!ans.isCorrect && (
                      <div>
                        <span className="font-mono text-[#101014]/60">Correct Official Answer: </span>
                        <strong className="text-emerald-700 font-bold">{ans.correctAnswer}</strong>
                      </div>
                    )}
                  </div>

                  {ans.explanation && (
                    <p className="text-xs text-[#101014]/75 font-sans leading-relaxed pt-1">
                      <strong>Pedagogical Explanation:</strong> {ans.explanation}
                    </p>
                  )}
                </ArtCard>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default QuizPage;
