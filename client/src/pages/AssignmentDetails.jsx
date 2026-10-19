import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import axios from "axios";
import { ServerUrl } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import {
  ArtCard,
  ArtButton,
  ArtBadge,
  ArtEmptyState,
} from "../components/ArtCraftUI";
import {
  FaCheckCircle,
  FaFileAlt,
  FaBrain,
  FaAward,
  FaLightbulb,
  FaPaperPlane,
  FaArrowRight,
  FaTachometerAlt,
  FaLock,
  FaHourglassHalf,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BsShieldCheck } from "react-icons/bs";
import toast from "react-hot-toast";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState({
    text: "",
    isExpired: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const draftKey = `skillsetu_case_study_draft_${id}`;

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ServerUrl}/api/assignments/${id}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setAssignment(res.data.assignment);
        const savedDraft = localStorage.getItem(draftKey);

        if (res.data.submission) {
          setSubmission(res.data.submission);
          if (
            savedDraft &&
            savedDraft.trim() &&
            savedDraft !== res.data.submission.submissionText
          ) {
            setSubmissionText(savedDraft);
          } else {
            setSubmissionText(res.data.submission.submissionText || "");
          }
        } else {
          if (savedDraft && savedDraft.trim()) {
            setSubmissionText(savedDraft);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching assignment:", err);
      toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  useEffect(() => {
    if (!assignment?.dueDate) {
      setCountdown({ text: "NO EXPIRATION", isExpired: false });
      return;
    }

    const updateTimer = () => {
      const due = new Date(assignment.dueDate);
      const now = new Date();
      const diffMs = due.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown({
          text: "DEADLINE EXPIRED",
          isExpired: true,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      const formattedText =
        days > 0
          ? `${days}D ${hours}H ${minutes}M ${seconds}S`
          : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
              2,
              "0"
            )}:${String(seconds).padStart(2, "0")}`;

      setCountdown({
        text: formattedText,
        isExpired: false,
        hours: days * 24 + hours,
        minutes,
        seconds,
      });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [assignment?.dueDate]);

  useEffect(() => {
    if (!id || loading) return;
    if (submissionText && submissionText.trim()) {
      try {
        localStorage.setItem(draftKey, submissionText);
      } catch (err) {
        console.error("Failed to save draft:", err);
      }
    }
  }, [submissionText, id, loading, draftKey]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (submissionText && submissionText.trim()) {
        try {
          localStorage.setItem(draftKey, submissionText);
        } catch {}
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submissionText, draftKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (countdown.isExpired) {
      toast.error("Submission deadline has expired. This case study is closed.");
      return;
    }

    if (!submissionText || submissionText.trim().length < 50) {
      toast.error("Please enter a comprehensive response (at least 50 characters).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${ServerUrl}/api/assignments/${id}/submit`,
        { submissionText },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success("Assignment evaluated by SkillSetu AI!");
        setSubmission(res.data.submission);
        if (res.data.user) {
          dispatch(setUserData(res.data.user));
        }
        window.dispatchEvent(
          new CustomEvent("assessmentCompleted", { detail: res.data })
        );
        localStorage.setItem("lastAssessmentUpdate", Date.now().toString());

        try {
          localStorage.removeItem(draftKey);
        } catch {}
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      if (err.response?.data?.isExpired) {
        setCountdown((prev) => ({ ...prev, isExpired: true }));
      }
      toast.error(
        err.response?.data?.message || "Evaluation failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#101014] border-t-[#2D81FF] rounded-none animate-spin" />
          <span className="font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
            Loading Case Study Protocol...
          </span>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#F2F1EE] p-10 flex flex-col items-center justify-center space-y-4">
        <ArtEmptyState
          icon={FaFileAlt}
          title="Case Study Protocol Not Found"
          description="The requested assignment record could not be resolved from the NSSTA server registry."
          action={
            <ArtButton onClick={() => navigate("/assignments")}>
              Back to Assignments
            </ArtButton>
          }
        />
      </div>
    );
  }

  const evaluation = submission?.aiEvaluation;
  const isExpired = countdown.isExpired;

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <BackButton fallbackUrl="/assignments" label="Back to All Assignments" />
          <span className="font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
            Doc ID: {assignment._id?.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* Due date status bar */}
        {assignment.dueDate && (
          <div
            className={`p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isExpired
                ? "bg-[#D64545]/10 border-[#D64545] text-[#D64545]"
                : countdown.hours < 6
                ? "bg-[#F2F1EE] border-[#101014] text-[#101014]"
                : "bg-white border-[#2D81FF] text-[#101014]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 border shrink-0 ${
                  isExpired
                    ? "border-[#D64545] bg-[#D64545] text-white"
                    : "border-[#101014] bg-[#101014] text-[#F2F1EE]"
                }`}
              >
                {isExpired ? (
                  <FaLock size={18} />
                ) : (
                  <FaHourglassHalf size={18} />
                )}
              </div>

              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.06em] flex items-center gap-2">
                  {isExpired ? (
                    <span>Submission Deadline Expired</span>
                  ) : (
                    <span>Active Case Study Examination Timer</span>
                  )}
                </h3>
                <p className="text-xs text-[#101014]/70 font-sans mt-0.5">
                  {isExpired ? (
                    <span>
                      This practicum closed on{" "}
                      <strong>{formatDateTime(assignment.dueDate)}</strong>.
                      Submissions are no longer accepted for this cycle.
                    </span>
                  ) : (
                    <span>
                      Strict submission deadline:{" "}
                      <strong>{formatDateTime(assignment.dueDate)}</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0 bg-white border border-[#E5E7EB] px-5 py-2.5 text-center">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#101014]/60 block">
                {isExpired ? "Status" : "Time Remaining"}
              </span>
              <span className="font-mono text-sm font-bold text-[#101014]">
                {countdown.text || "CALCULATING..."}
              </span>
            </div>
          </div>
        )}

        {/* Header Metadata */}
        <ArtCard padding="lg" className="bg-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ArtBadge variant="neutral">{assignment.domain}</ArtBadge>
            <ArtBadge variant="outline">Cadre: {assignment.cadreTarget}</ArtBadge>
            <ArtBadge variant="accent">Level: {assignment.difficulty}</ArtBadge>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#101014] leading-tight">
            {assignment.title}
          </h1>

          <div className="p-4 bg-[#F2F1EE] border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-[#101014]">
              <FaBrain size={14} className="text-[#2D81FF]" />
              <span>Competency Assessed: {assignment.targetCompetency}</span>
            </div>
            <span className="text-[#101014]/70 uppercase">
              Est. Time: {assignment.estimatedHours} Hours
            </span>
          </div>
        </ArtCard>

        {/* Two-column layout: Problem Scenario vs Submission / Evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <ArtCard padding="lg" className="bg-white space-y-4">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <FaFileAlt className="text-[#2D81FF]" />
                <span>1. Official Scenario & Operational Context</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#101014]/80 leading-relaxed font-sans whitespace-pre-line">
                {assignment.scenario}
              </p>
            </ArtCard>

            <ArtCard padding="lg" className="bg-white space-y-4">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <BsShieldCheck className="text-[#2D81FF]" />
                <span>2. Required Deliverables & Tasks</span>
              </h2>
              <div className="space-y-2.5">
                {(assignment.instructions || []).map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] text-xs font-sans text-[#101014]/85 leading-relaxed"
                  >
                    {inst}
                  </div>
                ))}
              </div>
            </ArtCard>

            <ArtCard padding="lg" className="bg-white space-y-4">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <FaAward className="text-[#2D81FF]" />
                <span>3. Evaluation Rubric (100 Marks Total)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(assignment.rubric || []).map((rub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white border border-[#E5E7EB] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[#101014]">
                      <span>{rub.criterion}</span>
                      <span className="text-[#2D81FF]">{rub.maxMarks} Marks</span>
                    </div>
                    <p className="text-[11px] text-[#101014]/65 font-sans leading-snug">
                      {rub.description}
                    </p>
                  </div>
                ))}
              </div>
            </ArtCard>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Scorecard / Evaluation Result */}
            {evaluation && (
              <div className="bg-[#101014] text-[#F2F1EE] border border-[#101014] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E7EB]/20 pb-4">
                  <div className="inline-flex items-center gap-2 border border-[#E5E7EB]/20 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[#2D81FF]">
                    <FaCheckCircle size={11} />
                    <span>AI Evaluation Complete</span>
                  </div>
                  <span className="font-mono text-xs uppercase text-[#F2F1EE]/70">
                    Grade:{" "}
                    <strong className="text-white text-base">
                      {evaluation.grade}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E5E7EB]/20 pb-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F2F1EE]/60 block mb-0.5">
                      Overall Score
                    </span>
                    <h3 className="font-mono text-3xl font-bold text-white">
                      {evaluation.overallScore}/100
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F2F1EE]/60 block mb-0.5">
                      Competency Delta
                    </span>
                    <span className="font-mono text-lg font-bold text-[#2D81FF]">
                      +{evaluation.competencyScoreDelta || 5}% Boost
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#F2F1EE]/80">
                    Rubric Performance Breakdown
                  </h4>
                  {(evaluation.rubricScores || []).map((rub, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-[#E5E7EB]/10 p-3 space-y-1 font-mono"
                    >
                      <div className="flex justify-between text-xs font-bold">
                        <span>{rub.criterion}</span>
                        <span className="text-[#2D81FF]">
                          {rub.score}/{rub.maxScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#F2F1EE]/70 font-sans leading-snug">
                        {rub.feedback}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/5 border border-[#E5E7EB]/10 p-3.5 space-y-2">
                    <h5 className="font-mono text-[11px] font-bold text-white flex items-center gap-1.5 uppercase">
                      <FaCheckCircle size={11} className="text-[#2D81FF]" />
                      <span>Strengths</span>
                    </h5>
                    <ul className="text-[11px] text-[#F2F1EE]/70 space-y-1 list-disc pl-3.5 font-sans leading-snug">
                      {(evaluation.strengths || []).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-[#E5E7EB]/10 p-3.5 space-y-2">
                    <h5 className="font-mono text-[11px] font-bold text-white flex items-center gap-1.5 uppercase">
                      <FaLightbulb size={11} className="text-[#2D81FF]" />
                      <span>Action Steps</span>
                    </h5>
                    <ul className="text-[11px] text-[#F2F1EE]/70 space-y-1 list-disc pl-3.5 font-sans leading-snug">
                      {(evaluation.suggestedNextSteps || []).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 border border-[#E5E7EB]/10 p-4 text-xs space-y-3 font-sans">
                  <span className="font-mono text-[11px] font-bold text-[#2D81FF] block uppercase tracking-[0.06em]">
                    Evaluator Executive Summary
                  </span>
                  <p className="text-[#F2F1EE]/80 leading-relaxed">
                    {evaluation.detailedFeedback}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <ArtButton
                      variant="secondary"
                      size="sm"
                      icon={FaTachometerAlt}
                      iconRight={FaArrowRight}
                      onClick={() => navigate("/dashboard")}
                    >
                      View Dashboard Progress
                    </ArtButton>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Area */}
            <ArtCard padding="lg" className="bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#101014] flex items-center gap-2">
                  {isExpired ? (
                    <>
                      <FaLock className="text-[#D64545]" />
                      <span>Submissions Closed</span>
                    </>
                  ) : (
                    <>
                      <HiSparkles className="text-[#2D81FF]" />
                      <span>
                        {evaluation
                          ? "Update / Re-Submit Solution"
                          : "Officer Solution & Methodology Submission"}
                      </span>
                    </>
                  )}
                </h3>
                <span className="font-mono text-[11px] text-[#101014]/60">
                  {submissionText.trim().split(/\s+/).filter(Boolean).length} WORDS
                </span>
              </div>

              {isExpired ? (
                <div className="p-6 bg-[#F2F1EE] border border-[#E5E7EB] text-center space-y-3">
                  <FaLock size={28} className="mx-auto text-[#D64545]" />
                  <h4 className="font-mono text-xs font-bold uppercase text-[#101014]">
                    Case Study Submissions Are Closed
                  </h4>
                  <p className="text-xs text-[#101014]/70 max-w-md mx-auto font-sans leading-relaxed">
                    The timer limit set by the NSSTA Secretariat has expired for
                    this practicum. Late solutions cannot be audited for this
                    evaluation cycle.
                  </p>
                  <ArtButton
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/assignments")}
                  >
                    Browse Active Case Studies
                  </ArtButton>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014] mb-2">
                      Enter your comprehensive analytical report, formulas, and
                      recommendations:
                    </label>
                    <textarea
                      rows={12}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Provide your step-by-step resolution according to the deliverables specified above. Include sampling frame specifications, multiplier derivations, and policy rationale..."
                      className="w-full bg-[#F2F1EE] border border-[#E5E7EB] rounded-none p-4 text-xs font-mono text-[#101014] focus:border-[#2D81FF] focus:outline-none leading-relaxed placeholder-[#101014]/40"
                    />
                  </div>

                  <ArtButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    size="md"
                    isLoading={submitting}
                    disabled={submitting || submissionText.trim().length < 50}
                    icon={FaPaperPlane}
                  >
                    {evaluation
                      ? "Re-Submit Solution for AI Rubric Evaluation"
                      : "Submit Solution for AI Rubric Evaluation"}
                  </ArtButton>
                </form>
              )}
            </ArtCard>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssignmentDetails;
