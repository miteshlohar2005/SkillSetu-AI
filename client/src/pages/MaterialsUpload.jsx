import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  FaFilePdf,
  FaFileAlt,
  FaFileWord,
  FaFilePowerpoint,
  FaBookOpen,
  FaDownload,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaCopy,
  FaPlay,
  FaSearch,
  FaPaperclip,
  FaUpload,
} from "react-icons/fa";
import { BsStars, BsShieldCheck } from "react-icons/bs";
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

const DOMAINS = [
  "Statistical Competencies",
  "Technical & Computational Competencies",
  "Digital Governance & Security",
  "Behavioural & Managerial Competencies",
];

const MaterialsUpload = ({ initialTab = "material-request" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getInitialActiveTab = () => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "mcq-create" || location.pathname === "/mcq-create") {
      return "mcq-create";
    }
    return "material-request";
  };

  const [activeTab, setActiveTab] = useState(getInitialActiveTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (location.pathname === "/mcq-create" || tabParam === "mcq-create") {
      setActiveTab("mcq-create");
    } else {
      setActiveTab("material-request");
    }
  }, [location.pathname, searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "mcq-create") {
      navigate("/mcq-create", { replace: true });
    } else {
      navigate("/materials?tab=material-request", { replace: true });
    }
  };

  const [materials, setMaterials] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  // Material request form state
  const [requestForm, setRequestForm] = useState({
    topic: "",
    domain: DOMAINS[0],
    description: "",
    urgency: "Normal",
  });
  const [requestAttachment, setRequestAttachment] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");

  // MCQ Studio state
  const [mcqSourceMode, setMcqSourceMode] = useState("direct");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [directFile, setDirectFile] = useState(null);
  const [directTitle, setDirectTitle] = useState("");
  const [directDomain, setDirectDomain] = useState(DOMAINS[0]);
  const [directTopic, setDirectTopic] = useState("Statistical Sampling & Survey Methodologies");
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("Medium");
  const [genLoading, setGenLoading] = useState(false);
  const [generatedMcqs, setGeneratedMcqs] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchMaterials = async (isBackground = false) => {
    try {
      const [matRes, reqRes] = await Promise.all([
        axios.get(`${ServerUrl}/api/materials/list`, { withCredentials: true }),
        axios.get(`${ServerUrl}/api/materials/my-requests`, { withCredentials: true }),
      ]);

      if (matRes.data.success) setMaterials(matRes.data.materials || []);
      if (reqRes.data.success) setMyRequests(reqRes.data.requests || []);
    } catch (error) {
      if (!isBackground) console.error("Fetch materials error:", error);
    }
  };

  useEffect(() => {
    fetchMaterials(false);
    const interval = setInterval(() => fetchMaterials(true), 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.topic.trim() || !requestForm.description.trim()) {
      toast.error("Please fill in the topic and detailed learning requirement.");
      return;
    }
    setRequestSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("topic", requestForm.topic.trim());
      formData.append("domain", requestForm.domain);
      formData.append("description", requestForm.description.trim());
      formData.append("urgency", requestForm.urgency);
      if (requestAttachment) {
        formData.append("file", requestAttachment);
      }

      const { data } = await axios.post(`${ServerUrl}/api/materials/request`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (data.success) {
        toast.success("Study material requisition successfully submitted to NSSTA Secretariat! 📄✨");
        setRequestForm({
          topic: "",
          domain: DOMAINS[0],
          description: "",
          urgency: "Normal",
        });
        setRequestAttachment(null);
        fetchMaterials(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleGenerateMcqs = async (e) => {
    e.preventDefault();
    if (mcqSourceMode === "direct" && !directFile) {
      toast.error("Please select a survey manual (PDF/DOCX/TXT/PPTX) to upload.");
      return;
    }
    if (mcqSourceMode === "library" && !selectedMaterial) {
      toast.error("Please select a study material from the NSSTA library.");
      return;
    }

    setGenLoading(true);
    try {
      const formData = new FormData();
      if (mcqSourceMode === "direct") {
        formData.append("file", directFile);
        formData.append("title", directTitle.trim() || directFile.name.replace(/\.[^/.]+$/, ""));
        formData.append("domain", directDomain);
        formData.append("topic", directTopic);
      } else {
        formData.append("materialId", selectedMaterial._id);
        formData.append("domain", selectedMaterial.domain || directDomain);
        formData.append("topic", selectedMaterial.topic || selectedMaterial.title);
      }

      formData.append("difficulty", difficulty);
      formData.append("numQuestions", numQuestions);

      const { data } = await axios.post(
        `${ServerUrl}/api/materials/upload-and-generate`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (data.success && data.quiz) {
        toast.success(`Successfully generated ${data.quiz.questions?.length || 0} verified MCQs with pedagogical citations! 🎯`);
        setGeneratedMcqs(data.quiz.questions || []);
        setActiveQuiz(data.quiz);
        fetchMaterials(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "MCQ generation failed.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopyQuestions = () => {
    if (!generatedMcqs.length) return;
    const text = generatedMcqs
      .map(
        (q, idx) =>
          `Q${idx + 1}: ${q.questionText}\n` +
          q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join("\n") +
          `\nCorrect Answer: ${q.correctAnswer}\nExplanation: ${q.explanation}\n`
      )
      .join("\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Questions copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/dashboard" label="Return to Dashboard" />
          <span className="font-mono text-[11px] text-[#101014]/60 uppercase tracking-wider">
            NSSTA Materials & Question Studio
          </span>
        </div>

        {/* HEADER & TABS */}
        <ArtCard padding="lg" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] block mb-1">
                Official Knowledge Extraction & Dispatch
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
                {activeTab === "mcq-create"
                  ? "AI Document-to-MCQ Studio"
                  : "Study Material Requisitions & Repository"}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#101014]/70 mt-1 max-w-2xl">
                Upload survey manuals, circulars, and methodological guidelines to auto-extract verified pedagogical assessments or request official NSSTA reference textbooks.
              </p>
            </div>

            <div className="flex items-center gap-1.5 border border-[#E5E7EB] p-1 bg-[#F2F1EE]">
              <button
                onClick={() => switchTab("material-request")}
                className={`px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "material-request"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                Material Requisitions
              </button>
              <button
                onClick={() => switchTab("mcq-create")}
                className={`px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "mcq-create"
                    ? "bg-[#101014] text-white"
                    : "text-[#101014] hover:bg-white"
                }`}
              >
                <BsStars size={12} className="text-[#2D81FF]" />
                <span>MCQ Studio</span>
              </button>
            </div>
          </div>
        </ArtCard>

        {/* TAB 1: MATERIAL REQUISITION */}
        {activeTab === "material-request" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Request Form */}
              <ArtCard padding="lg" className="lg:col-span-5 space-y-5 bg-white">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#101014]">
                    Submit Study Material Requisition
                  </h3>
                  <p className="font-sans text-xs text-[#101014]/70 mt-0.5">
                    Request specific survey manuals or sampling materials directly from NSSTA faculty.
                  </p>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <ArtInput
                    label="Survey / Subject Topic"
                    placeholder="e.g. PLFS Schedule 10.4 Sampling Multipliers"
                    value={requestForm.topic}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, topic: e.target.value })
                    }
                    required
                  />

                  <ArtSelect
                    label="Competency Domain"
                    value={requestForm.domain}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, domain: e.target.value })
                    }
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </ArtSelect>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                      Urgency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Normal", "Urgent", "Critical Exam"].map((urg) => (
                        <button
                          key={urg}
                          type="button"
                          onClick={() => setRequestForm({ ...requestForm, urgency: urg })}
                          className={`py-2 font-mono text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                            requestForm.urgency === urg
                              ? "bg-[#101014] text-white border-[#101014]"
                              : "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                          }`}
                        >
                          {urg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                      Detailed Requirement & Rationale
                    </label>
                    <textarea
                      rows={3}
                      value={requestForm.description}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, description: e.target.value })
                      }
                      placeholder="Specify chapter, survey round, or statistical formula needed..."
                      className="w-full bg-white text-[#101014] border border-[#E5E7EB] rounded-none p-3 text-sm font-sans outline-none focus:border-[#2D81FF]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                      Optional Reference File Attachment
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setRequestAttachment(e.target.files[0])}
                      className="w-full text-xs font-mono file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-[#101014] file:text-white file:font-mono file:text-[10px] file:font-bold file:uppercase cursor-pointer"
                    />
                  </div>

                  <div className="pt-2">
                    <ArtButton
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={requestSubmitting}
                      className="w-full"
                    >
                      Submit Requisition to NSSTA
                    </ArtButton>
                  </div>
                </form>
              </ArtCard>

              {/* Requisitions Queue & Dispatches */}
              <div className="lg:col-span-7 space-y-4">
                <ArtSectionHeader
                  overline="Dispatches & Status"
                  title="My Requisition History"
                  subtitle="Live status of study material requests processed by NSSTA nodal librarians."
                />

                {myRequests.length === 0 ? (
                  <ArtCard padding="lg" className="text-center py-12">
                    <h4 className="font-display font-bold text-base text-[#101014]">
                      No Requisitions Logged Yet
                    </h4>
                    <p className="text-xs text-[#101014]/60 mt-1">
                      Use the form on the left to request customized study materials.
                    </p>
                  </ArtCard>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map((req, idx) => (
                      <ArtCard key={idx} padding="md" className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <ArtBadge variant={req.status === "fulfilled" ? "primary" : "neutral"}>
                                {req.status === "fulfilled" ? "Dispatched" : "Pending Review"}
                              </ArtBadge>
                              <span className="font-mono text-[10px] text-[#2D81FF] font-bold uppercase">
                                {req.domain}
                              </span>
                            </div>
                            <h4 className="font-sans font-bold text-sm text-[#101014]">
                              {req.topic}
                            </h4>
                            <p className="text-xs text-[#101014]/70 font-sans">
                              {req.description}
                            </p>
                          </div>

                          {req.urgency && (
                            <ArtBadge variant={req.urgency === "Critical Exam" ? "danger" : "neutral"}>
                              {req.urgency}
                            </ArtBadge>
                          )}
                        </div>

                        {req.adminResponseNote && (
                          <div className="p-2.5 bg-[#F2F1EE] border border-[#E5E7EB] text-xs font-sans">
                            <strong className="font-mono text-[10px] text-[#101014] uppercase block">
                              NSSTA Faculty Note:
                            </strong>
                            <p className="text-[#101014]/80 mt-0.5">{req.adminResponseNote}</p>
                          </div>
                        )}

                        {req.dispatchedMaterialUrl && (
                          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                            <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase">
                              ✓ Material Dispatched
                            </span>
                            <a
                              href={req.dispatchedMaterialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#101014] text-white hover:bg-[#2D81FF] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              <FaDownload size={9} />
                              <span>Download PDF</span>
                            </a>
                          </div>
                        )}
                      </ArtCard>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NSSTA OFFICIAL LIBRARY REPOSITORY */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <ArtSectionHeader
                overline="Official Repository"
                title="NSSTA Reference Library Catalog"
                subtitle="Official methodology manuals, questionnaires, and survey instruction handbooks."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {materials.slice(0, 6).map((mat) => (
                  <ArtCard key={mat._id} padding="md" className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <ArtBadge variant="neutral">{mat.domain || "Statistical"}</ArtBadge>
                        <span className="font-mono text-[10px] text-[#101014]/50 uppercase">
                          {mat.fileType || "PDF"}
                        </span>
                      </div>
                      <h4 className="font-sans font-bold text-sm text-[#101014] leading-snug">
                        {mat.title}
                      </h4>
                      <p className="text-xs text-[#101014]/70 line-clamp-2 font-sans">
                        {mat.description || "Official reference document for cadre competency and practical training."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#101014]/60">Cadre Library</span>
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2D81FF] hover:text-[#101014] uppercase tracking-wider"
                      >
                        <span>Access</span>
                        <FaExternalLinkAlt size={10} />
                      </a>
                    </div>
                  </ArtCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI DOCUMENT-TO-MCQ STUDIO */}
        {activeTab === "mcq-create" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Upload & Generator Form */}
              <ArtCard padding="lg" className="lg:col-span-5 space-y-5 bg-white">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#101014]">
                    AI Question Extraction Engine
                  </h3>
                  <p className="font-sans text-xs text-[#101014]/70 mt-0.5">
                    Upload official PDF/DOCX/PPTX manual to automatically extract 4-option MCQs with explanations.
                  </p>
                </div>

                <form onSubmit={handleGenerateMcqs} className="space-y-4">
                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 gap-2 border border-[#E5E7EB] p-1 bg-[#F2F1EE]">
                    <button
                      type="button"
                      onClick={() => setMcqSourceMode("direct")}
                      className={`py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        mcqSourceMode === "direct" ? "bg-[#101014] text-white" : "text-[#101014]"
                      }`}
                    >
                      Upload New File
                    </button>
                    <button
                      type="button"
                      onClick={() => setMcqSourceMode("library")}
                      className={`py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        mcqSourceMode === "library" ? "bg-[#101014] text-white" : "text-[#101014]"
                      }`}
                    >
                      From Library
                    </button>
                  </div>

                  {mcqSourceMode === "direct" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
                          Select Manual Document (PDF, DOCX, TXT)
                        </label>
                        <div className="p-6 border-2 border-dashed border-[#E5E7EB] hover:border-[#101014] text-center bg-[#F2F1EE]/50 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt,.doc,.pptx"
                            onChange={(e) => setDirectFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="space-y-1">
                            <FaUpload size={18} className="mx-auto text-[#101014]/60" />
                            <p className="font-mono text-xs font-bold text-[#101014]">
                              {directFile ? directFile.name : "Click or Drag Document Here"}
                            </p>
                            <p className="font-mono text-[10px] text-[#101014]/50 uppercase">
                              PDF, DOCX, PPTX up to 25MB
                            </p>
                          </div>
                        </div>
                      </div>

                      <ArtInput
                        label="Assessment Title"
                        placeholder="e.g. PLFS Urban Sampling Verification"
                        value={directTitle}
                        onChange={(e) => setDirectTitle(e.target.value)}
                      />

                      <ArtSelect
                        label="Competency Domain"
                        value={directDomain}
                        onChange={(e) => setDirectDomain(e.target.value)}
                      >
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </ArtSelect>
                    </>
                  ) : (
                    <ArtSelect
                      label="Select NSSTA Library Document"
                      onChange={(e) => {
                        const mat = materials.find((m) => m._id === e.target.value);
                        setSelectedMaterial(mat);
                      }}
                    >
                      <option value="">Choose document...</option>
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>{m.title}</option>
                      ))}
                    </ArtSelect>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <ArtSelect
                      label="Difficulty"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy (Foundational)</option>
                      <option value="Medium">Medium (Standard)</option>
                      <option value="Hard">Hard (ISS Level)</option>
                    </ArtSelect>

                    <ArtSelect
                      label="Questions"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(e.target.value)}
                    >
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                      <option value="all">All Available</option>
                    </ArtSelect>
                  </div>

                  <div className="pt-2">
                    <ArtButton
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={genLoading}
                      className="w-full"
                    >
                      Extract & Generate MCQs
                    </ArtButton>
                  </div>
                </form>
              </ArtCard>

              {/* Questions Preview Workspace */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#101014]">
                      Generated Assessment Preview
                    </h3>
                    <p className="text-xs text-[#101014]/60 font-mono mt-0.5">
                      {generatedMcqs.length ? `${generatedMcqs.length} Questions Extracted` : "Awaiting document processing"}
                    </p>
                  </div>

                  {generatedMcqs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <ArtButton
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyQuestions}
                        icon={FaCopy}
                      >
                        {copied ? "Copied" : "Copy Questions"}
                      </ArtButton>
                      {activeQuiz && (
                        <ArtButton
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/quiz/${activeQuiz._id}`)}
                          icon={FaPlay}
                        >
                          Launch Assessment
                        </ArtButton>
                      )}
                    </div>
                  )}
                </div>

                {generatedMcqs.length === 0 ? (
                  <ArtCard padding="lg" className="text-center py-16">
                    <BsStars size={24} className="mx-auto text-[#2D81FF] mb-3" />
                    <h4 className="font-display font-bold text-base text-[#101014]">
                      No Questions Extracted Yet
                    </h4>
                    <p className="text-xs text-[#101014]/60 max-w-md mx-auto mt-1">
                      Upload an official circular or survey instruction booklet on the left to generate structured question sets.
                    </p>
                  </ArtCard>
                ) : (
                  <div className="space-y-4">
                    {generatedMcqs.map((q, idx) => (
                      <ArtCard key={idx} padding="md" className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-xs font-bold text-[#2D81FF]">
                            Question 0{idx + 1}
                          </span>
                          {q.sourceCitation && (
                            <span className="font-mono text-[9px] text-[#101014]/50 border border-[#E5E7EB] px-2 py-0.5">
                              {q.sourceCitation}
                            </span>
                          )}
                        </div>

                        <h4 className="font-sans font-bold text-sm text-[#101014]">
                          {q.questionText}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options?.map((opt, oIdx) => {
                            const isCorrect = opt === q.correctAnswer;
                            const letter = String.fromCharCode(65 + oIdx);
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 border text-xs font-sans flex items-center gap-2 ${
                                  isCorrect
                                    ? "bg-[#101014] text-[#F2F1EE] border-[#101014] font-semibold"
                                    : "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB]"
                                }`}
                              >
                                <span className="font-mono font-bold">{letter})</span>
                                <span className="truncate">{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] text-xs font-sans mt-2">
                            <strong className="font-mono text-[10px] uppercase text-[#101014] block">
                              Official Pedagogical Explanation:
                            </strong>
                            <p className="text-[#101014]/80 mt-0.5">{q.explanation}</p>
                          </div>
                        )}
                      </ArtCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MaterialsUpload;
