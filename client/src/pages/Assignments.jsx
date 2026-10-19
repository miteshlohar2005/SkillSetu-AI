import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import {
  ArtCard,
  ArtButton,
  ArtBadge,
  ArtChip,
  ArtEmptyState,
} from "../components/ArtCraftUI";
import {
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaBrain,
  FaFilter,
  FaLock,
} from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import toast from "react-hot-toast";
import { CardGridSkeleton } from "../components/SkeletonLoader";

const DOMAIN_OPTIONS = [
  "All",
  "Statistical Competencies",
  "Technical & Computational Competencies",
  "Digital Governance & Security",
];

const getAssignmentDeadlineInfo = (dueDateStr) => {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      status: "expired",
      label: "DEADLINE EXPIRED",
      badgeVariant: "danger",
      isExpired: true,
    };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) {
    return {
      status: "active",
      label: `${days}D ${hours}H LEFT`,
      badgeVariant: "neutral",
      isExpired: false,
    };
  }

  if (hours >= 6) {
    return {
      status: "active",
      label: `${hours}H ${minutes}M LEFT`,
      badgeVariant: "accent",
      isExpired: false,
    };
  }

  return {
    status: "urgent",
    label: `DUE IN ${hours > 0 ? `${hours}H ` : ""}${minutes}M`,
    badgeVariant: "danger",
    isExpired: false,
  };
};

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [mySubmissions, setMySubmissions] = useState([]);
  const prevAssignmentsCountRef = useRef(null);

  const fetchAssignments = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await axios.get(
        `${ServerUrl}/api/assignments/list${
          selectedDomain !== "All"
            ? `?domain=${encodeURIComponent(selectedDomain)}`
            : ""
        }`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        const asgns = res.data.assignments || [];
        setAssignments(asgns);
        if (
          isBackground &&
          prevAssignmentsCountRef.current !== null &&
          asgns.length > prevAssignmentsCountRef.current
        ) {
          toast("New official Case Study Assignment published by NSSTA!", {
            icon: "📋",
            duration: 5000,
          });
        }
        prevAssignmentsCountRef.current = asgns.length;
      }
    } catch (err) {
      if (!isBackground) {
        console.error("Error fetching assignments:", err);
        toast.error("Failed to load assignments");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await axios.get(
        `${ServerUrl}/api/assignments/history/my-submissions`,
        {
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        setMySubmissions(res.data.submissions || []);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  useEffect(() => {
    fetchAssignments(false);
    fetchMySubmissions();
    const interval = setInterval(() => {
      fetchAssignments(true);
      fetchMySubmissions();
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedDomain]);

  const completedCount = mySubmissions.length;
  const avgScore =
    completedCount > 0
      ? Math.round(
          mySubmissions.reduce(
            (acc, s) => acc + (s.aiEvaluation?.overallScore || 0),
            0
          ) / completedCount
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <BackButton fallbackUrl="/dashboard" label="Back to Dashboard" />
          <span className="font-mono text-[11px] font-bold text-[#101014]/60 uppercase tracking-[0.06em]">
            Official In-Service Practicum
          </span>
        </div>

        {/* Editorial ArtCraft Banner */}
        <div className="bg-[#101014] text-[#F2F1EE] p-8 sm:p-10 border border-[#101014] relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 border border-[#E5E7EB]/20 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[#2D81FF]">
                <BsShieldCheck size={13} />
                <span>SkillSetu AI • In-Service Practicum</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Official Statistics Case Studies & Practicum
              </h1>
              <p className="text-sm text-[#F2F1EE]/80 leading-relaxed font-sans">
                Solve real-world official statistical scenarios from NSSO, CSO,
                and state DES. Submit your analytical methodology for instant
                in-depth AI rubric evaluation, error audit, and direct
                competency index verification.
              </p>
            </div>

            <div className="flex sm:flex-col gap-3 shrink-0">
              <div className="border border-[#E5E7EB]/30 bg-white/5 p-4 text-center min-w-[140px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F2F1EE]/60 block mb-1">
                  Completed
                </span>
                <span className="font-mono text-2xl font-bold text-white">
                  {completedCount}
                </span>
                <span className="font-mono text-[10px] text-[#2D81FF] block mt-0.5">
                  Case Studies
                </span>
              </div>
              <div className="border border-[#E5E7EB]/30 bg-white/5 p-4 text-center min-w-[140px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#F2F1EE]/60 block mb-1">
                  Average Score
                </span>
                <span className="font-mono text-2xl font-bold text-[#2D81FF]">
                  {avgScore > 0 ? `${avgScore}%` : "—"}
                </span>
                <span className="font-mono text-[10px] text-[#F2F1EE]/60 block mt-0.5">
                  Rubric Performance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
            <FaFilter size={11} className="text-[#2D81FF]" />
            <span>Filter Domain:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DOMAIN_OPTIONS.map((domain) => (
              <ArtChip
                key={domain}
                active={selectedDomain === domain}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </ArtChip>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : assignments.length === 0 ? (
          <ArtEmptyState
            icon={FaTasks}
            title="No assignments found for this domain"
            description="Select another statistical competency domain or check back soon for newly published NSSTA case studies."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((asgn) => {
              const submission = asgn.submission;
              const isSubmitted = asgn.hasSubmitted;
              const deadlineInfo = getAssignmentDeadlineInfo(asgn.dueDate);
              const isExpired = deadlineInfo?.isExpired;

              return (
                <ArtCard
                  key={asgn._id}
                  padding="lg"
                  className="flex flex-col justify-between space-y-6 bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ArtBadge variant="neutral">{asgn.domain}</ArtBadge>
                        {asgn.isCustomDispatched && (
                          <ArtBadge variant="accent">Assigned by NSSTA</ArtBadge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {deadlineInfo && !isSubmitted && (
                          <ArtBadge variant={deadlineInfo.badgeVariant}>
                            {isExpired ? (
                              <FaLock className="mr-1 inline" size={10} />
                            ) : (
                              <FaClock className="mr-1 inline" size={10} />
                            )}
                            {deadlineInfo.label}
                          </ArtBadge>
                        )}

                        {isSubmitted ? (
                          <ArtBadge variant="accent">
                            <FaCheckCircle className="mr-1 inline" size={10} />
                            EVALUATED •{" "}
                            {submission?.aiEvaluation?.overallScore || 80}/100
                          </ArtBadge>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-[#101014]/70 uppercase">
                            {asgn.difficulty} • {asgn.estimatedHours}H
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#101014] leading-snug">
                      {asgn.title}
                    </h3>

                    <p className="text-xs text-[#101014]/70 line-clamp-3 leading-relaxed font-sans">
                      {asgn.scenario}
                    </p>

                    <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-[#101014] truncate font-bold">
                        <FaBrain className="text-[#2D81FF] shrink-0" size={13} />
                        <span className="truncate">
                          Targets: {asgn.targetCompetency}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#2D81FF] uppercase shrink-0">
                        +5% Index
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-4">
                    <span className="font-mono text-[11px] text-[#101014]/60 flex items-center gap-1.5 uppercase">
                      <FaClock size={11} className="text-[#2D81FF]" />
                      <span>Est: {asgn.estimatedHours || 4} Hours</span>
                    </span>

                    <ArtButton
                      size="sm"
                      variant={isSubmitted ? "secondary" : isExpired ? "danger" : "primary"}
                      iconRight={FaArrowRight}
                      onClick={() => navigate(`/assignments/${asgn._id}`)}
                    >
                      {isSubmitted
                        ? "View Evaluation"
                        : isExpired
                        ? "Closed Study"
                        : "Solve Study"}
                    </ArtButton>
                  </div>
                </ArtCard>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Assignments;
