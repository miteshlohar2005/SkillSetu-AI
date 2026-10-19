import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BsBarChartLine,
  BsBookHalf,
  BsRobot,
  BsChevronLeft,
  BsChevronRight,
  BsGearFill,
  BsStars,
  BsBarChartSteps,
  BsShieldCheck,
  BsGrid3X3GapFill,
} from "react-icons/bs";
import {
  FaHome,
  FaBrain,
  FaTasks,
  FaHistory,
  FaFilePdf,
  FaUserGraduate,
  FaBookOpen,
  FaMicrophone,
  FaUserTie,
  FaLock,
  FaUsers,
  FaComments,
} from "react-icons/fa";
import { HiOutlineLogout, HiX } from "react-icons/hi";
import axios from "axios";
import { ServerUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { generateCompetencyPDF } from "../utils/pdfGenerator";
import { useNavigation } from "../context/NavigationContext";
import { useDiagnostic } from "../context/DiagnosticContext";
import { useOutsideClick } from "../utils/outsideClick";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const Sidebar = ({ onOpenAuth }) => {
  const { t } = useTranslation();
  const { userData } = useSelector((state) => state.user);
  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen } =
    useNavigation();

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isPathLocked, triggerLockedError, isIntakePending } = useDiagnostic();

  const [hoveredLink, setHoveredLink] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userCardRef = useOutsideClick(() => setShowUserDropdown(false));

  const isTrainer = userData?.role === "trainer" || userData?.role === "admin";
  const userPhoto =
    userData?.image ||
    userData?.picture ||
    userData?.avatar ||
    userData?.photoUrl ||
    userData?.avatarUrl ||
    userData?.profilePicture;

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
      setMobileOpen(false);
      navigate("/auth");
      toast.success("Successfully logged out");
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadDossier = () => {
    if (!userData) {
      if (onOpenAuth) onOpenAuth();
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

  const handleNavigate = (path, isPublic = false, label = "") => {
    if (!userData && !isPublic) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (isPathLocked(path)) {
      triggerLockedError(label);
      return;
    }
    navigate(path);
    setMobileOpen(false);
  };

  const trainerSections = [
    {
      title: "Core Modules",
      links: [
        { label: "Home", path: "/", icon: FaHome, isPublic: true },
        {
          label: "Cadre Overview & Analytics",
          path: "/admin?tab=overview",
          icon: BsGrid3X3GapFill,
          badge: "KPI",
        },
        {
          label: "Officer Monitor",
          path: "/admin?tab=learners",
          icon: FaUsers,
          badge: "Cadre",
        },
        {
          label: "Study Material Dispatch",
          path: "/admin?tab=materials",
          icon: FaBookOpen,
          badge: "Repo",
        },
        {
          label: "Practicum Assignments",
          path: "/admin?tab=assignments",
          icon: FaTasks,
          badge: "Tasks",
        },
        {
          label: "Live Faculty Communications",
          path: "/admin?tab=communications",
          icon: FaComments,
          badge: "Live",
        },
        { label: "System Settings", path: "/settings", icon: BsGearFill },
      ],
    },
  ];

  const learnerSections = [
    {
      title: t("nav.corePortal", "Core Portal"),
      links: [
        { label: t("nav.home", "Home"), path: "/", icon: FaHome, isPublic: true },
        ...(userData?.role !== "admin"
          ? [
              {
                label: t("nav.dashboard", "Dashboard"),
                path: "/dashboard",
                icon: BsBarChartLine,
              },
            ]
          : []),
        {
          label: t("nav.competency", "Competency Matrix"),
          path: "/competencies",
          icon: FaBrain,
        },
        {
          label: t("nav.skillGaps", "Skill Gap Analysis"),
          path: "/skill-gaps",
          icon: BsBarChartSteps,
          badge: "Cadre AI",
        },
        {
          label: t("nav.jobReadiness", "Job Readiness"),
          path: "/job-readiness",
          icon: FaUserTie,
          badge: "Audit",
        },
        {
          label: t("nav.history", "Evaluation History"),
          path: "/history",
          icon: FaHistory,
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
        },
        {
          label: t("nav.quizzes", "Statistical Quizzes"),
          path: "/quizzes",
          icon: FaTasks,
        },
        {
          label: t("nav.assignments", "Practicum Assignments"),
          path: "/assignments",
          icon: FaFilePdf,
        },
        {
          label: t("nav.materials", "Material Requests"),
          path: "/materials",
          icon: FaBookOpen,
        },
        {
          label: t("nav.mcqCreate", "MCQ Generation Studio"),
          path: "/mcq-create",
          icon: BsStars,
          isAi: true,
          badge: "AI Gen",
        },
      ],
    },
    {
      title: t("nav.intelligenceBoard", "Intelligence Board"),
      links: [
        {
          label: t("nav.interviews", "AI Oral Board Viva"),
          path: "/interview",
          icon: FaMicrophone,
          badge: "Oral Board",
        },
        {
          label: t("nav.copilot", "SkillSetu Copilot AI"),
          path: "/chat",
          icon: BsRobot,
          isAi: true,
          badge: "AI Copilot",
        },
      ],
    },
  ];

  const navSections = isTrainer ? trainerSections : learnerSections;

  const isLinkActive = (path) => {
    if (isTrainer) {
      if (path === "/") return location.pathname === "/" && !location.search;
      if (path.includes("?tab=")) {
        const targetTab = path.split("?tab=")[1];
        const searchParams = new URLSearchParams(location.search);
        const currentTab = searchParams.get("tab") || "overview";
        return location.pathname === "/admin" && currentTab === targetTab;
      }
      return location.pathname === path;
    }

    if (path === "/") return location.pathname === "/";
    if (path === "/skill-gaps") {
      return (
        location.pathname === "/skill-gaps" ||
        location.pathname === "/skill-gap-analysis"
      );
    }
    if (path === "/quizzes") {
      return (
        location.pathname === "/quizzes" || location.pathname.startsWith("/quiz/")
      );
    }
    if (path === "/assignments") {
      return (
        location.pathname === "/assignments" ||
        location.pathname.startsWith("/assignments/")
      );
    }
    return location.pathname === path;
  };

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[110] bg-[#101014]/50 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 bottom-0 left-0 z-[120] h-[100dvh] bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 select-none ${
          mobileOpen
            ? "translate-x-0 w-[280px] sm:w-72 max-w-[85vw]"
            : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-[76px]" : "md:w-[260px]"}`}
      >
        {/* Top Accent Hairline */}
        <div className="h-[2px] w-full bg-[#101014]" />

        {/* Sidebar Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
          {isCollapsed && !mobileOpen ? (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={toggleCollapse}
                className="w-10 h-10 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-display font-bold text-sm rounded-none border border-[#101014] hover:bg-[#2D81FF] hover:border-[#2D81FF] hover:text-white transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                S
              </button>
            </div>
          ) : (
            <>
              <div
                onClick={() => handleNavigate("/", true)}
                className="flex items-center gap-3 cursor-pointer min-w-0"
              >
                <div className="w-8 h-8 bg-[#101014] text-[#F2F1EE] flex items-center justify-center font-display font-bold text-sm shrink-0 border border-[#101014]">
                  S
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold text-sm tracking-tight text-[#101014] leading-none">
                      SkillSetu
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#2D81FF] uppercase tracking-wider">
                      AI
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[#101014]/60 tracking-wider uppercase mt-1 truncate">
                    {isTrainer ? "Faculty Trainer" : "Skill Intelligence"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden p-1.5 text-[#101014]/60 hover:text-[#101014] hover:bg-[#F2F1EE] transition-colors cursor-pointer"
                  title="Close Menu"
                >
                  <HiX size={18} />
                </button>
                <button
                  onClick={toggleCollapse}
                  className="hidden md:flex p-1.5 text-[#101014]/60 hover:text-[#101014] hover:bg-[#F2F1EE] border border-transparent hover:border-[#E5E7EB] transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <BsChevronLeft size={13} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {(!isCollapsed || mobileOpen) ? (
                <div className="px-3 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#101014]/50">
                  {section.title}
                </div>
              ) : (
                <div className="my-2 mx-auto w-6 h-[1px] bg-[#E5E7EB]" />
              )}

              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);
                  const isLocked = !isTrainer && isPathLocked(link.path);

                  return (
                    <div key={link.path} className="relative">
                      <button
                        onClick={() =>
                          handleNavigate(link.path, link.isPublic, link.label)
                        }
                        onMouseEnter={() => setHoveredLink(link.path)}
                        onMouseLeave={() => setHoveredLink(null)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-sans font-medium transition-all duration-100 cursor-pointer text-left ${
                          isActive
                            ? "bg-[#101014] text-[#F2F1EE] border-l-2 border-[#2D81FF] font-semibold"
                            : "text-[#101014] hover:bg-[#F2F1EE] border-l-2 border-transparent"
                        } ${isCollapsed && !mobileOpen ? "justify-center px-2" : ""}`}
                      >
                        <div className="relative shrink-0">
                          <Icon
                            size={16}
                            className={
                              isLocked
                                ? "text-[#101014]/40"
                                : isActive
                                ? "text-[#2D81FF]"
                                : "text-[#101014]/70"
                            }
                          />
                          {isLocked && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 text-white flex items-center justify-center text-[7px]">
                              <FaLock size={6} />
                            </span>
                          )}
                        </div>

                        {(!isCollapsed || mobileOpen) && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span
                              className={`truncate ${
                                isLocked ? "text-[#101014]/50" : ""
                              }`}
                            >
                              {link.label}
                            </span>
                            {isLocked ? (
                              <span className="flex items-center gap-0.5 font-mono text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 shrink-0">
                                <FaLock size={7} />
                                <span>LOCKED</span>
                              </span>
                            ) : link.badge ? (
                              <span
                                className={`font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-wider uppercase ${
                                  isActive
                                    ? "bg-[#2D81FF] text-white"
                                    : "bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB]"
                                }`}
                              >
                                {link.badge}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </button>

                      {isCollapsed &&
                        !mobileOpen &&
                        hoveredLink === link.path && (
                          <div className="fixed left-[82px] z-[130] -translate-y-8 px-3 py-1.5 bg-[#101014] text-[#F2F1EE] text-xs font-mono font-medium border border-[#101014] shadow-md whitespace-nowrap pointer-events-none flex items-center gap-2">
                            <span>{link.label}</span>
                            {isLocked ? (
                              <span className="text-[9px] font-bold text-amber-400">
                                [LOCKED]
                              </span>
                            ) : link.badge ? (
                              <span className="text-[9px] font-bold text-[#2D81FF]">
                                {link.badge}
                              </span>
                            ) : null}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F2F1EE]/50 space-y-2 shrink-0">
          {!isTrainer && (!isCollapsed || mobileOpen) && (
            <div className="space-y-1.5">
              {userData && userData.role !== "admin" && (
                <button
                  onClick={handleDownloadDossier}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.06em] border transition-colors cursor-pointer ${
                    isIntakePending
                      ? "bg-white text-[#101014]/50 border-[#E5E7EB]"
                      : "bg-white text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                  }`}
                  title={
                    isIntakePending
                      ? "Locked: Complete Intake Viva & Quiz first"
                      : "Export Performance Dossier (PDF)"
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FaFilePdf size={13} className="text-[#101014]" />
                    <span className="truncate">Export Dossier</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 bg-[#F2F1EE] border border-[#E5E7EB]">
                    PDF
                  </span>
                </button>
              )}

              <button
                onClick={() =>
                  handleNavigate(
                    "/portal-comparison",
                    true,
                    "Portal Difference"
                  )
                }
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.06em] border transition-colors cursor-pointer ${
                  location.pathname === "/portal-comparison"
                    ? "bg-[#101014] text-white border-[#101014]"
                    : "bg-white text-[#101014] border-[#E5E7EB] hover:border-[#101014]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BsShieldCheck size={14} className="text-[#2D81FF]" />
                  <span className="truncate">Portal Compare</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 bg-[#F2F1EE] border border-[#E5E7EB]">
                  VS
                </span>
              </button>
            </div>
          )}

          {/* User Profile Card */}
          {userData ? (
            <div ref={userCardRef} className="relative">
              <button
                onClick={() => {
                  if (isTrainer) {
                    navigate("/settings");
                  } else {
                    setShowUserDropdown(!showUserDropdown);
                  }
                }}
                className={`w-full flex items-center gap-2.5 p-2 bg-white border border-[#E5E7EB] hover:border-[#101014] transition-colors cursor-pointer ${
                  isCollapsed && !mobileOpen ? "justify-center p-1.5" : ""
                }`}
              >
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

                {(!isCollapsed || mobileOpen) && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-sans font-semibold text-[#101014] truncate">
                      {userData.name}
                    </div>
                    <div className="font-mono text-[9px] text-[#101014]/60 uppercase truncate">
                      {isTrainer
                        ? "Faculty Trainer"
                        : userData.jobRole || "Cadre Officer"}
                    </div>
                  </div>
                )}

                {(!isCollapsed || mobileOpen) && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="p-1 text-[#101014]/50 hover:text-[#D64545] transition-colors cursor-pointer shrink-0"
                    title="Sign Out"
                  >
                    <HiOutlineLogout size={14} />
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {!isTrainer && (
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className={`z-[140] bg-white border border-[#E5E7EB] overflow-hidden ${
                        isCollapsed && !mobileOpen
                          ? "fixed left-[82px] bottom-4 w-64 shadow-lg"
                          : "absolute bottom-[calc(100%+6px)] left-0 right-0 w-full min-w-[240px] shadow-lg"
                      }`}
                    >
                      <div className="p-3 bg-[#F2F1EE] border-b border-[#E5E7EB]">
                        <span className="block font-sans font-bold text-xs text-[#101014] truncate">
                          {userData?.name || "Officer"}
                        </span>
                        <span className="block font-mono text-[10px] text-[#2D81FF] uppercase truncate mt-0.5">
                          {userData?.jobRole || "Cadre Officer"}
                        </span>
                        <span className="block font-mono text-[9px] text-[#101014]/60 truncate mt-0.5">
                          {userData?.email}
                        </span>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            navigate("/settings");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-sans font-medium text-[#101014] hover:bg-[#F2F1EE] flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <BsGearFill size={13} className="text-[#101014]/70" />
                            <span>System Settings</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleDownloadDossier();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-sans font-medium text-[#101014] hover:bg-[#F2F1EE] flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FaFilePdf size={13} className="text-[#101014]/70" />
                            <span>Export Performance Dossier</span>
                          </div>
                          <span className="font-mono text-[9px] text-[#101014]/50">
                            PDF
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            if (isPathLocked("/history")) {
                              triggerLockedError("Evaluation History");
                              return;
                            }
                            navigate("/history");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-sans font-medium text-[#101014] hover:bg-[#F2F1EE] flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FaHistory size={13} className="text-[#101014]/70" />
                            <span>Viva Evaluation History</span>
                          </div>
                        </button>
                      </div>

                      <div className="p-1 border-t border-[#E5E7EB]">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.06em] text-[#D64545] hover:bg-[#D64545]/10 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <HiOutlineLogout size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavigate("/auth", true)}
              className="w-full h-11 bg-[#101014] text-[#F2F1EE] border border-[#101014] hover:bg-[#2D81FF] hover:border-[#2D81FF] hover:text-white font-mono text-[11px] font-bold uppercase tracking-[0.06em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FaUserGraduate size={13} />
              {(!isCollapsed || mobileOpen) && <span>Officer Sign In</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
