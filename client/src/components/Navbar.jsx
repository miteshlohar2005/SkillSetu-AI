import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsChevronDown,
  BsBarChartLine,
  BsShieldLock,
  BsLayoutSidebar,
  BsGearFill,
  BsRobot,
  BsBookHalf,
  BsStars,
  BsBarChartSteps,
  BsShieldCheck,
} from "react-icons/bs";
import {
  FaUserGraduate,
  FaHistory,
  FaFilePdf,
  FaHome,
  FaComments,
  FaBrain,
  FaTasks,
  FaBookOpen,
  FaMicrophone,
  FaUserTie,
  FaLock,
  FaGlobe,
} from "react-icons/fa";
import { HiOutlineLogout, HiMenu, HiX } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { useOutsideClick } from "../utils/outsideClick";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import { useNavigation } from "../context/NavigationContext";
import { useDiagnostic } from "../context/DiagnosticContext";
import { useTranslation } from "react-i18next";
import { setGlobalLanguage } from "../utils/translator";
import Sidebar from "./Sidebar";
import AuthModel from "./AuthModel";
import SettingsModal from "./SettingsModal";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useSelector((state) => state.user);
  const isTrainer = userData?.role === "trainer";
  const userPhoto =
    userData?.image ||
    userData?.picture ||
    userData?.avatar ||
    userData?.photoUrl ||
    userData?.avatarUrl ||
    userData?.profilePicture;

  const {
    navMode,
    setNavMode,
    isCollapsed,
    setMobileOpen,
    isSettingsOpen,
    closeSettings,
  } = useNavigation();

  const { isPathLocked, triggerLockedError, isIntakePending } = useDiagnostic();

  const [showUserPopup, setShowUserPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownTimeoutRef = useRef(null);

  const currentLang = i18n.language || localStorage.getItem("sankhya_lang") || "en";

  const handleToggleLanguage = () => {
    const nextLang = currentLang === "hi" ? "en" : "hi";
    i18n.changeLanguage(nextLang);
    setGlobalLanguage(nextLang);
    toast.success(
      nextLang === "hi"
        ? "भाषा को हिन्दी (भाषिणी संवर्ग) में सेट किया गया"
        : "Language switched to English"
    );
  };

  const handleDropdownEnter = (title) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(title);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userRef = useOutsideClick(() => setShowUserPopup(false));

  const handleLogout = async () => {
    try {
      await axios.post(
        `${ServerUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
      dispatch(setUserData(null));
      setShowUserPopup(false);
      navigate("/auth");
      toast.success("Successfully logged out");
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadDossier = () => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    if (isIntakePending) {
      triggerLockedError("Official Dossier PDF Export");
      return;
    }
    toast.success("Preparing Official Performance Dossier (PDF)... 📄");
    generateCompetencyPDF({
      user: userData,
      profile: userData,
      competencies: userData.competencies || [],
      skillGaps: userData.skillGaps || [],
      learningPath: userData.learningPath || [],
    });
  };

  const navSections = isTrainer
    ? [
        {
          title: t("nav.governance", "Governance"),
          links: [
            {
              label: t("nav.admin", "Admin Dashboard"),
              path: "/admin",
              icon: BsShieldLock,
              badge: "Faculty",
              desc: "Executive Analytics & Cadre Oversight",
            },
            {
              label: "Real-Time Helpdesk",
              path: "/admin?tab=communications",
              icon: FaComments,
              badge: "Live",
              desc: "Communications & Officer Inquiries",
            },
            {
              label: "Officer Monitor",
              path: "/admin?tab=learners",
              icon: FaUserTie,
              badge: "Cadre",
              desc: "Officer Performance & Experience Monitor",
            },
            {
              label: "Study Materials",
              path: "/admin?tab=materials",
              icon: FaBookOpen,
              badge: "Hub",
              desc: "Study Material Requests & Dispatch Hub",
            },
            {
              label: "Assignments Hub",
              path: "/admin?tab=assignments",
              icon: FaTasks,
              badge: "Rubric",
              desc: "Dispatched Assignments & Submissions",
            },
          ],
        },
      ]
    : [
        {
          title: t("nav.corePortal", "Core Portal"),
          links: [
            {
              label: t("nav.home", "Home"),
              path: "/",
              icon: FaHome,
              isPublic: true,
              desc: "National Statistical Portal Overview",
            },
            ...(userData?.role !== "admin"
              ? [
                  {
                    label: t("nav.dashboard", "Dashboard"),
                    path: "/dashboard",
                    icon: BsBarChartLine,
                    desc: "Competency Radar & Skill Gaps",
                  },
                ]
              : []),
            {
              label: t("nav.competency", "Competency Matrix"),
              path: "/competencies",
              icon: FaBrain,
              desc: "Official Cadre Competency Framework",
            },
            {
              label: t("nav.skillGaps", "Skill Gaps"),
              path: "/skill-gaps",
              icon: BsBarChartSteps,
              badge: "Cadre AI",
              desc: "Cadre Benchmark & Gap Analysis",
            },
            {
              label: t("nav.jobReadiness", "Job Readiness"),
              path: "/job-readiness",
              icon: FaUserTie,
              badge: "Audit",
              desc: "Cadre Deployment & Job Readiness",
            },
            {
              label: t("nav.portalDifference", "Portal Compare"),
              path: "/portal-comparison",
              icon: BsShieldCheck,
              isPublic: true,
              badge: "VS",
              desc: "Compare Legacy Portals vs SkillSetu AI Platform",
            },
            {
              label: t("nav.history", "Evaluation History"),
              path: "/history",
              icon: FaHistory,
              desc: "Viva Records & Evaluation Logs",
            },
          ],
        },
        {
          title: t("nav.capacityBuilding", "Capacity Building"),
          links: [
            {
              label: t("nav.learningPath", "Adaptive Learning Path"),
              path: "/learning-path",
              icon: BsBookHalf,
              desc: "Adaptive Competency Roadmap",
            },
            {
              label: t("nav.quizzes", "Statistical Quizzes"),
              path: "/quizzes",
              icon: FaTasks,
              desc: "Cadre Knowledge Practice & Quizzes",
            },
            {
              label: t("nav.assignments", "Practicum Assignments"),
              path: "/assignments",
              icon: FaFilePdf,
              desc: "Survey & Data Practicum Tasks",
            },
            {
              label: t("nav.materials", "Material Requests"),
              path: "/materials",
              icon: FaBookOpen,
              desc: "NSSTA Study Material Requisitions",
            },
            {
              label: t("nav.mcqCreate", "MCQ Creation Studio"),
              path: "/mcq-create",
              icon: BsStars,
              isAi: true,
              badge: "AI Gen",
              desc: "Document to MCQ Generator",
            },
          ],
        },
        {
          title: t("nav.intelligenceBoard", "Intelligence Board"),
          links: [
            {
              label: t("nav.copilot", "AI Copilot"),
              path: "/chat",
              icon: BsRobot,
              isAi: true,
              badge: "AI Copilot",
              desc: "Conversational Statistical Tutor",
            },
            {
              label: t("nav.interviews", "AI Oral Board Viva"),
              path: "/interview",
              icon: FaMicrophone,
              badge: "Oral Board",
              desc: "Voice Examination & Scorecard",
            },
          ],
        },
        ...(userData?.role === "admin"
          ? [
              {
                title: t("nav.governance", "Governance"),
                align: "right",
                links: [
                  {
                    label: t("nav.admin", "Admin Portal"),
                    path: "/admin",
                    icon: BsShieldLock,
                    badge: "Admin",
                    desc: "Executive Analytics & Oversight",
                  },
                ],
              },
            ]
          : []),
      ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview";
    if (path === "/dashboard") return "Competency Intelligence Dashboard";
    if (path === "/competencies") return "Competency Assessment Matrix";
    if (path === "/skill-gaps" || path === "/skill-gap-analysis")
      return "Skill Gap Analysis & Benchmark";
    if (path === "/job-readiness") return "Job Readiness & Cadre Deployment";
    if (path === "/learning-path") return "Adaptive Learning Pathways";
    if (path === "/quizzes") return "Statistical Assessments & Quizzes";
    if (path === "/assignments") return "Survey Practicum Assignments";
    if (path === "/materials") return "Official Study Materials";
    if (path === "/mcq-create") return "AI Document-to-MCQ Studio";
    if (path === "/admin") return "Executive Faculty Dashboard";
    if (path === "/chat") return "SkillSetu Copilot AI Domain Assistant";
    if (path === "/community") return "Statistical Officer Forum";
    if (path === "/interview") return "AI Speech-to-Text Oral Viva";
    if (path === "/history") return "Viva Evaluation Archive";
    if (path === "/settings") return "System & Cadre Configuration";
    if (path === "/portal-comparison") return "Platform Comparison";
    return "SkillSetu AI Platform";
  };

  // If in sidebar layout mode
  if (navMode === "sidebar") {
    return (
      <>
        <Sidebar onOpenAuth={() => setShowAuth(true)} />

        <header
          className={`fixed top-0 right-0 z-[90] h-14 bg-white border-b border-[#E5E7EB] transition-all duration-200 left-0 ${
            isCollapsed ? "md:left-[76px]" : "md:left-[260px]"
          } flex items-center justify-between px-4 sm:px-6 select-none`}
        >
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-[#101014] hover:bg-[#F2F1EE] border border-[#E5E7EB] transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <HiMenu size={20} />
            </button>

            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-display font-bold text-xs">
                S
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-[#101014]">
                SkillSetu AI
              </span>
            </div>
          </div>

          {/* Desktop Breadcrumb & Current Title */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-bold text-[#101014]/50 uppercase tracking-[0.1em]">
              SkillSetu AI
            </span>
            <span className="text-[#101014]/30 font-mono text-xs">/</span>
            <span className="font-mono text-[11px] font-bold text-[#101014] uppercase tracking-[0.06em]">
              {getPageTitle()}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switch [EN | हिन्दी] */}
            <button
              onClick={handleToggleLanguage}
              className="h-8 px-2.5 bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] hover:border-[#101014] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Language (English / हिन्दी)"
            >
              <FaGlobe size={11} className="text-[#2D81FF]" />
              <span>{currentLang === "hi" ? "हिन्दी (HI)" : "EN"}</span>
            </button>

            {/* AI Copilot Fast Launcher */}
            {!isTrainer && (
              <button
                onClick={() => {
                  if (isPathLocked("/chat")) {
                    triggerLockedError("AI Copilot");
                    return;
                  }
                  navigate("/chat");
                }}
                className="h-8 px-2.5 bg-white text-[#101014] border border-[#E5E7EB] hover:border-[#2D81FF] hover:text-[#2D81FF] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                title={
                  isPathLocked("/chat")
                    ? "Locked: Complete Intake Viva & Quiz"
                    : "Launch SkillSetu Copilot AI"
                }
              >
                <BsRobot size={13} className="text-[#2D81FF]" />
                <span className="hidden sm:inline">Copilot</span>
              </button>
            )}

            {/* Notifications */}
            {userData && <NotificationBell />}

            {/* User Session Profile Button */}
            <div>
              {userData ? (
                <div
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-2 p-1 pl-2.5 bg-[#F2F1EE] border border-[#E5E7EB] hover:border-[#101014] cursor-pointer transition-colors"
                  title="Profile & Cadre Settings"
                >
                  <div className="hidden sm:block text-right max-w-[120px]">
                    <span className="block text-xs font-sans font-semibold text-[#101014] truncate">
                      {userData.name}
                    </span>
                    <span className="block font-mono text-[9px] text-[#2D81FF] uppercase truncate">
                      {userData.jobRole || "Officer"}
                    </span>
                  </div>
                  <div className="w-7 h-7 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-mono font-bold text-xs shrink-0 overflow-hidden">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(userData.name || "U").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="h-8 px-3.5 bg-[#101014] text-[#F2F1EE] border border-[#101014] hover:bg-[#2D81FF] hover:border-[#2D81FF] hover:text-white font-mono text-[10px] font-bold uppercase tracking-[0.06em] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FaUserGraduate size={11} />
                  <span>{t("nav.login", "Sign In")}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
        <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      </>
    );
  }

  // Topbar layout mode
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-[#E5E7EB] transition-colors">
        <div className="h-[2px] w-full bg-[#101014]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <div className="w-8 h-8 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-display font-bold text-sm shrink-0 border border-[#101014]">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base text-[#101014] tracking-tight leading-none">
                    SkillSetu{" "}
                    <span className="font-mono text-[11px] text-[#2D81FF]">
                      AI
                    </span>
                  </span>
                  <span className="font-mono text-[9px] text-[#101014]/60 uppercase tracking-wider mt-0.5">
                    Skill Intelligence & Capacity Building
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Sections */}
            <div className="hidden md:flex items-center gap-1">
              {navSections.map((section) => {
                const isSectionActive = section.links.some((l) =>
                  location.pathname === l.path
                );
                const isOpen = activeDropdown === section.title;

                return (
                  <div
                    key={section.title}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(section.title)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(isOpen ? null : section.title)
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.06em] border transition-colors cursor-pointer ${
                        isSectionActive
                          ? "bg-[#101014] text-[#F2F1EE] border-[#101014]"
                          : isOpen
                          ? "bg-[#F2F1EE] text-[#101014] border-[#101014]"
                          : "bg-transparent text-[#101014] border-transparent hover:border-[#E5E7EB] hover:bg-[#F2F1EE]"
                      }`}
                    >
                      <span>{section.title}</span>
                      <BsChevronDown size={10} className="text-[#101014]/50" />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className={`absolute top-full pt-1 z-[110] ${
                            section.align === "right" ? "right-0" : "left-0"
                          }`}
                        >
                          <div className="w-72 bg-white border border-[#E5E7EB] shadow-lg p-1.5">
                            <div className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#101014]/50 border-b border-[#E5E7EB] flex items-center justify-between">
                              <span>{section.title}</span>
                              <span className="text-[#2D81FF]">
                                {section.links.length} Modules
                              </span>
                            </div>

                            <div className="py-1 space-y-0.5">
                              {section.links.map((link) => {
                                const Icon = link.icon;
                                const isActive = location.pathname === link.path;
                                const isLocked =
                                  !isTrainer && isPathLocked(link.path);

                                return (
                                  <button
                                    key={link.path}
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      if (!userData && !link.isPublic) {
                                        setShowAuth(true);
                                        return;
                                      }
                                      if (isLocked) {
                                        triggerLockedError(link.label);
                                        return;
                                      }
                                      navigate(link.path);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 text-xs font-sans text-left transition-colors cursor-pointer ${
                                      isActive
                                        ? "bg-[#101014] text-white font-semibold"
                                        : "hover:bg-[#F2F1EE] text-[#101014]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Icon
                                        size={14}
                                        className={
                                          isActive
                                            ? "text-[#2D81FF]"
                                            : "text-[#101014]/60"
                                        }
                                      />
                                      <span className="truncate">
                                        {link.label}
                                      </span>
                                    </div>
                                    {isLocked ? (
                                      <FaLock
                                        size={10}
                                        className="text-amber-500 shrink-0"
                                      />
                                    ) : link.badge ? (
                                      <span className="font-mono text-[9px] px-1 py-0.5 uppercase bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB]">
                                        {link.badge}
                                      </span>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLanguage}
                className="h-8 px-2.5 bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] hover:border-[#101014] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaGlobe size={11} className="text-[#2D81FF]" />
                <span>{currentLang === "hi" ? "हिन्दी" : "EN"}</span>
              </button>

              <button
                onClick={() => setNavMode("sidebar")}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-[#E5E7EB] hover:border-[#101014] text-[#101014] transition-colors cursor-pointer"
                title="Switch to Sidebar Layout"
              >
                <BsLayoutSidebar size={12} />
                <span>Sidebar</span>
              </button>

              {userData && <NotificationBell />}

              {userData ? (
                <div ref={userRef} className="relative">
                  <button
                    onClick={() => setShowUserPopup(!showUserPopup)}
                    className="flex items-center gap-2 p-1 pl-2 bg-[#F2F1EE] border border-[#E5E7EB] hover:border-[#101014] transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-sans font-semibold text-[#101014] hidden sm:inline">
                      {userData.name}
                    </span>
                    <div className="w-7 h-7 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-mono font-bold text-xs">
                      {(userData.name || "U").charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <AnimatePresence>
                    {showUserPopup && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E5E7EB] shadow-lg p-2 z-[120]"
                      >
                        <div className="p-2 border-b border-[#E5E7EB] mb-1">
                          <span className="block font-sans font-bold text-xs text-[#101014] truncate">
                            {userData.name}
                          </span>
                          <span className="block font-mono text-[9px] text-[#2D81FF] uppercase truncate">
                            {userData.jobRole || "Officer"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserPopup(false);
                            navigate("/settings");
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-sans text-[#101014] hover:bg-[#F2F1EE] flex items-center gap-2"
                        >
                          <BsGearFill size={12} />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserPopup(false);
                            handleDownloadDossier();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-sans text-[#101014] hover:bg-[#F2F1EE] flex items-center gap-2"
                        >
                          <FaFilePdf size={12} />
                          <span>Export Dossier (PDF)</span>
                        </button>
                        <div className="border-t border-[#E5E7EB] mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#D64545] hover:bg-[#D64545]/10 flex items-center gap-2"
                          >
                            <HiOutlineLogout size={13} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="h-8 px-3.5 bg-[#101014] text-[#F2F1EE] border border-[#101014] hover:bg-[#2D81FF] hover:border-[#2D81FF] hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FaUserGraduate size={11} />
                  <span>{t("nav.login", "Sign In")}</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-[#101014] hover:bg-[#F2F1EE] border border-[#E5E7EB] cursor-pointer"
              >
                {mobileMenuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-3"
            >
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNavMode("sidebar");
                }}
                className="w-full flex items-center justify-between p-2.5 bg-[#F2F1EE] border border-[#E5E7EB] font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]"
              >
                <div className="flex items-center gap-2">
                  <BsLayoutSidebar size={14} />
                  <span>Switch to Sidebar Mode</span>
                </div>
                <span className="text-[9px] bg-[#101014] text-[#F2F1EE] px-1.5 py-0.5">
                  Layout
                </span>
              </button>

              <div className="space-y-3">
                {navSections.map((section) => (
                  <div
                    key={section.title}
                    className="p-3 bg-[#F2F1EE]/50 border border-[#E5E7EB]"
                  >
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#101014]/50 block mb-2">
                      {section.title}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {section.links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        const isLocked = isPathLocked(link.path);

                        return (
                          <button
                            key={link.path}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (!userData && !link.isPublic) {
                                setShowAuth(true);
                                return;
                              }
                              if (isLocked) {
                                triggerLockedError(link.label);
                                return;
                              }
                              navigate(link.path);
                            }}
                            className={`flex items-center justify-between p-2 text-xs font-sans text-left border ${
                              isActive
                                ? "bg-[#101014] text-white border-[#101014] font-semibold"
                                : "bg-white text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon
                                size={13}
                                className={
                                  isActive ? "text-[#2D81FF]" : "text-[#101014]/60"
                                }
                              />
                              <span className="truncate">{link.label}</span>
                            </div>
                            {isLocked && (
                              <FaLock
                                size={9}
                                className="text-amber-500 shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
};

export default Navbar;
