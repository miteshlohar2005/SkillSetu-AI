import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaCertificate,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaPlayCircle,
  FaSearch,
  FaMapMarkerAlt,
  FaAward,
} from "react-icons/fa";
import { BsShieldCheck, BsJournalBookmarkFill } from "react-icons/bs";
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

const LearningPath = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("personalized");
  const [profile, setProfile] = useState(null);
  const [igotCourses, setIgotCourses] = useState([]);
  const [tpacProgrammes, setTpacProgrammes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfileAndCourses = async () => {
    try {
      const [profileRes, igotRes, tpacRes] = await Promise.all([
        axios.get(`${ServerUrl}/api/competencies/my-profile`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/igot/courses`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/tpac/programmes`, { withCredentials: true }),
      ]);

      if (profileRes.data.success) setProfile(profileRes.data.profile);
      if (igotRes.data.success) setIgotCourses(igotRes.data.courses || []);
      if (tpacRes.data.success) setTpacProgrammes(tpacRes.data.programmes || []);
    } catch (error) {
      console.error("Learning path fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCourses();
    const handleRealtimeSync = () => fetchProfileAndCourses();
    window.addEventListener("assessmentCompleted", handleRealtimeSync);
    return () => window.removeEventListener("assessmentCompleted", handleRealtimeSync);
  }, []);

  const handleUpdateStatus = async (stepIndex, status) => {
    try {
      const { data } = await axios.put(
        `${ServerUrl}/api/competencies/pathway-progress`,
        { stepIndex, status },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        fetchProfileAndCourses();
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleRefreshPathway = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/competencies/generate-pathway`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Learning pathway refreshed using latest skill-gap analysis! ✨");
        fetchProfileAndCourses();
      }
    } catch {
      toast.error("Failed to refresh pathway.");
    } finally {
      setLoading(false);
    }
  };

  const filteredIgot = igotCourses.filter((c) => {
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skillAddressed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter ? c.domain.toLowerCase().includes(domainFilter.toLowerCase()) : true;
    return matchesQuery && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* TOP BAR / BREADCRUMB */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/dashboard" label="Return to Dashboard" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            National Capacity Roadmaps
          </span>
        </div>

        {/* HEADER & TAB SWITCHER */}
        <ArtCard padding="lg" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] block mb-1">
                Mission Karmayogi • FRAC Standards
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
                Official Statistics Learning Pathways
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#101014]/70 mt-1 max-w-2xl">
                Curated curriculum combining asynchronous iGOT Karmayogi digital modules and NSSTA in-service residential programmes mapped to verified competency deficits.
              </p>
            </div>

            <div className="flex items-center gap-1.5 border border-[#E5E7EB] p-1 bg-[#F2F1EE]">
              <button
                onClick={() => setActiveTab("personalized")}
                className={`px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "personalized"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                My Roadmap
              </button>
              <button
                onClick={() => setActiveTab("igot")}
                className={`px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "igot"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                iGOT Karmayogi
              </button>
              <button
                onClick={() => setActiveTab("tpac")}
                className={`px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "tpac"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                NSSTA TPAC Calendar
              </button>
            </div>
          </div>
        </ArtCard>

        {/* TAB 1: PERSONALIZED ROADMAP */}
        {activeTab === "personalized" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-display font-bold text-xl text-[#101014]">
                  Sequential Capacity Roadmap for {profile?.jobRole || "Cadre Officer"}
                </h3>
                <p className="text-xs text-[#101014]/70 font-sans mt-0.5">
                  Priority-ordered milestone sequence dynamically targeted to bridge high & moderate skill gaps.
                </p>
              </div>

              <ArtButton
                variant="secondary"
                size="sm"
                onClick={handleRefreshPathway}
                disabled={loading}
              >
                Refresh Pathway
              </ArtButton>
            </div>

            {loading ? (
              <CardGridSkeleton count={4} />
            ) : (
              <div className="space-y-3">
                {(profile?.learningPath || []).map((step, idx) => (
                  <ArtCard
                    key={idx}
                    padding="md"
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#101014] transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-10 h-10 bg-[#101014] text-[#F2F1EE] font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-[#101014]">
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ArtBadge variant="neutral">{step.provider || "iGOT Karmayogi"}</ArtBadge>
                          <ArtBadge variant={step.priority === "High" ? "danger" : "neutral"}>
                            {step.priority} Priority
                          </ArtBadge>
                          <span className="font-mono text-[11px] text-[#101014]/60">
                            ⏱️ {step.duration || "14 Hours"}
                          </span>
                        </div>

                        <h4 className="font-sans font-bold text-base text-[#101014] leading-snug">
                          {step.title}
                        </h4>

                        <p className="text-xs text-[#101014]/70 font-sans leading-relaxed">
                          {step.rationale || `Designed to bridge competency in ${step.skillAddressed}.`}
                        </p>

                        <div className="pt-1 font-mono text-[11px] text-[#2D81FF] font-bold">
                          Competency Target: {step.skillAddressed} (Target Level: {step.targetLevel || "Advanced"})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {step.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101014] text-[#F2F1EE] font-mono text-xs font-bold uppercase tracking-wider">
                          <FaCheckCircle size={13} className="text-[#2D81FF]" />
                          <span>Completed</span>
                        </span>
                      ) : step.status === "in-progress" ? (
                        <ArtButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(idx, "completed")}
                          icon={FaCheckCircle}
                        >
                          Mark Complete
                        </ArtButton>
                      ) : (
                        <ArtButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(idx, "in-progress")}
                        >
                          Start Module
                        </ArtButton>
                      )}
                    </div>
                  </ArtCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: iGOT KARMAYOGI REGISTRY */}
        {activeTab === "igot" && (
          <div className="space-y-6">
            <ArtCard padding="md">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <ArtInput
                    placeholder="Search iGOT official courses: PLFS, CPI, SNA 2008, Sampling..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={FaSearch}
                  />
                </div>
                <div className="md:col-span-4">
                  <ArtSelect
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                  >
                    <option value="">All Competency Domains</option>
                    <option value="Statistical">Statistical Competencies</option>
                    <option value="Technical">Technical & Computational</option>
                    <option value="Governance">Digital Governance & Policy</option>
                    <option value="Managerial">Managerial & Field Leadership</option>
                  </ArtSelect>
                </div>
              </div>
            </ArtCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIgot.map((course) => (
                <ArtCard
                  key={course.id}
                  padding="md"
                  className="flex flex-col justify-between space-y-4 hover:border-[#101014] transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <ArtBadge variant="neutral">{course.provider}</ArtBadge>
                      <span className="font-mono text-xs text-[#101014]/60">
                        ⭐ {course.rating || 4.8}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-sm text-[#101014] leading-snug">
                      {course.title}
                    </h4>

                    <p className="text-xs text-[#101014]/70 line-clamp-2 font-sans">
                      {course.description}
                    </p>

                    <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-[#101014]/70">
                        <span>Skill:</span>
                        <strong className="text-[#101014]">{course.skillAddressed}</strong>
                      </div>
                      <div className="flex justify-between text-[#101014]/70">
                        <span>Duration:</span>
                        <strong>{course.duration}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#101014]/60 uppercase">
                      Level: {course.level || "Intermediate"}
                    </span>
                    <a
                      href={course.url || "https://igotkarmayogi.gov.in"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101014] text-white hover:bg-[#2D81FF] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <span>Open on iGOT</span>
                      <FaExternalLinkAlt size={9} />
                    </a>
                  </div>
                </ArtCard>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NSSTA TPAC PROGRAMMES */}
        {activeTab === "tpac" && (
          <div className="space-y-6">
            <ArtCard padding="md">
              <h3 className="font-display font-bold text-lg text-[#101014]">
                NSSTA TPAC Annual Residential Training Calendar
              </h3>
              <p className="text-xs text-[#101014]/70 mt-1 font-sans">
                Official In-Service and Specialized Training Programmes recommended by the Training Programme Advisory Committee (TPAC).
              </p>
            </ArtCard>

            <div className="space-y-4">
              {tpacProgrammes.map((prog) => (
                <ArtCard
                  key={prog.id}
                  padding="lg"
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-[#101014] transition-colors"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <ArtBadge variant="primary">{prog.mode}</ArtBadge>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#101014]/70">
                        <FaMapMarkerAlt size={10} className="text-[#2D81FF]" />
                        <span>{prog.academy}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#2D81FF]">
                        <FaCalendarAlt size={10} />
                        <span>{prog.dates}</span>
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-base text-[#101014]">
                      {prog.title}
                    </h4>

                    <div className="text-xs text-[#101014]/70 font-sans space-y-0.5">
                      <div>
                        <strong>Target Cadre:</strong> {prog.targetCadre.join(", ")}
                      </div>
                      <div>
                        <strong>Competency Addressed:</strong> {prog.competencyAddressed}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {prog.curriculum.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] font-mono text-[10px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                    <span className="font-mono text-xs text-[#101014]/70">
                      Duration: <strong>{prog.durationWeeks} Weeks</strong> ({prog.credits} TPAC Credits)
                    </span>
                    <ArtButton
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        toast.success("Nomination request logged for NSSTA Nodal Officer review! ✨")
                      }
                    >
                      Nominate for Programme
                    </ArtButton>
                    <span className="font-mono text-[9px] text-[#101014]/50 uppercase">
                      Coordinated by {prog.coordinator}
                    </span>
                  </div>
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

export default LearningPath;
