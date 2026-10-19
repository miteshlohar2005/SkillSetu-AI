import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BsLayoutSidebar,
  BsLayoutSidebarInsetReverse,
  BsSun,
  BsMoonStars,
  BsDisplay,
  BsCheckCircleFill,
  BsGearFill,
  BsSliders,
} from "react-icons/bs";
import { HiX } from "react-icons/hi";
import {
  FaUserGraduate,
  FaUserTie,
  FaBuilding,
  FaBriefcase,
  FaEnvelope,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigation } from "../context/NavigationContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { setGlobalLanguage } from "../utils/translator";
import toast from "react-hot-toast";

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { navMode, setNavMode } = useNavigation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";
  const { userData } = useSelector((state) => state.user);

  const [activeTab, setActiveTab] = useState("profile");

  const handleSelectLanguage = (lang) => {
    if (currentLanguage === lang) return;
    i18n.changeLanguage(lang);
    setGlobalLanguage(lang);
    toast.success(
      lang === "hi"
        ? "भाषा को हिन्दी (भाषिणी संवर्ग) में सेट किया गया"
        : "Language set to English (Standard Cadre)"
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectNavMode = (mode) => {
    if (navMode === mode) return;
    setNavMode(mode);
    toast.success(`Navigation layout changed to ${mode === "sidebar" ? "Sidebar Rail" : "Horizontal Navbar"}`);
  };

  const handleSelectTheme = (mode) => {
    if (theme === mode) return;
    setTheme(mode);
    const label = mode === "system" ? "System Default" : mode === "dark" ? "Dark Mode" : "Light Mode";
    toast.success(`Theme updated to ${label}`);
  };

  const handleOpenSettingsPage = (tab = "profile") => {
    onClose();
    navigate(`/settings?tab=${tab}`);
  };

  const userPhoto = userData?.image || userData?.picture || userData?.avatar || userData?.photoUrl || userData?.avatarUrl || userData?.profilePicture;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                    <BsGearFill size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      System Settings
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Manage officer credentials and workspace layout preferences.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Settings (Esc)"
                >
                  <HiX size={20} />
                </button>
              </div>

              <div className="flex items-center mt-4 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${activeTab === "profile"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <FaUserTie size={12} />
                  <span>Profile Option</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("layout")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${activeTab === "layout"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <BsSliders size={12} />
                  <span>Layout Setting</span>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {activeTab === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {userData ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/60 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 overflow-hidden relative border-2 border-white dark:border-slate-800">
                          {userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={userData?.name || "Officer"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <span className={userPhoto ? "hidden" : "flex items-center justify-center"}>
                            {userData.name ? userData.name.charAt(0).toUpperCase() : "O"}
                          </span>
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                              {userData.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              Active Officer
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">
                            {userData.jobRole || userData.targetCadre || "Indian Statistical Service (ISS) Officer"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                            <FaEnvelope size={10} className="text-slate-400" />
                            <span>{userData.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <FaBriefcase size={10} /> Designation
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            {userData.designation || "Statistical Officer"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <FaBuilding size={10} /> Department
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                            {userData.department || "National Sample Survey Office (NSSO)"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                            <FaUserGraduate size={10} /> Qualification
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                            {userData.educationalQualification || "Master of Statistics"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Experience & Competency
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {userData.workExperience || userData.experienceYears || 0} Yrs • {userData.overallCompetencyScore || 0}% Score
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenSettingsPage("profile")}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <span>Edit & Update Full Profile Information</span>
                        <FaExternalLinkAlt size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      Please sign in to manage profile settings.
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "layout" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <BsLayoutSidebar className="text-blue-600 dark:text-blue-400" size={14} />
                          Navigation Layout
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Choose how you navigate across modules and academy tools.
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                        Active: {navMode === "sidebar" ? "Sidebar" : "Navbar"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => handleSelectNavMode("sidebar")}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${navMode === "sidebar"
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {navMode === "sidebar" && (
                          <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
                            <BsCheckCircleFill size={16} />
                          </div>
                        )}

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                              <BsLayoutSidebar size={16} />
                            </div>
                            <div>
                              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                Sidebar Dock
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                  DEFAULT
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                Modern & Collapsible
                              </span>
                            </div>
                          </div>

                          <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-1.5 flex gap-1.5 overflow-hidden">
                            <div className="w-1/4 h-full rounded-lg bg-blue-600/80 dark:bg-blue-500/80 flex flex-col gap-1 p-1">
                              <div className="w-full h-2 rounded bg-white/40" />
                              <div className="w-3/4 h-1.5 rounded bg-white/30" />
                              <div className="w-2/3 h-1.5 rounded bg-white/30" />
                            </div>
                            <div className="flex-1 h-full rounded-lg bg-white dark:bg-slate-800/60 p-1.5 flex flex-col gap-1">
                              <div className="w-full h-2 rounded bg-slate-200 dark:bg-slate-700" />
                              <div className="w-3/4 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Fixed vertical dock on the left with collapsible rail (~76px / 260px) and fast navigation sections.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => handleSelectNavMode("topbar")}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${navMode === "topbar"
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {navMode === "topbar" && (
                          <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
                            <BsCheckCircleFill size={16} />
                          </div>
                        )}

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <BsLayoutSidebarInsetReverse size={16} />
                            </div>
                            <div>
                              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                Top Navbar
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  ALTERNATE
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Classic Full-Width
                              </span>
                            </div>
                          </div>

                          <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-1.5 flex flex-col gap-1.5 overflow-hidden">
                            <div className="w-full h-3.5 rounded-lg bg-blue-600/80 dark:bg-blue-500/80 flex items-center justify-between px-1.5">
                              <div className="w-8 h-1.5 rounded bg-white/60" />
                              <div className="flex gap-1">
                                <div className="w-3 h-1.5 rounded bg-white/40" />
                                <div className="w-3 h-1.5 rounded bg-white/40" />
                              </div>
                            </div>
                            <div className="flex-1 rounded-lg bg-white dark:bg-slate-800/60 p-1.5 flex flex-col gap-1">
                              <div className="w-full h-2 rounded bg-slate-200 dark:bg-slate-700" />
                              <div className="w-2/3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Horizontal top navbar keeping 100% full screen width available for wide tables and statistical charts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {theme === "dark" ? (
                            <BsMoonStars className="text-indigo-400" size={14} />
                          ) : theme === "light" ? (
                            <BsSun className="text-amber-500" size={14} />
                          ) : (
                            <BsDisplay className="text-blue-500" size={14} />
                          )}
                          Theme & Color Mode
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Select daylight, dark obsidian, or synchronize with your OS.
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200/60 dark:border-slate-700/60">
                        Active: {theme} ({resolvedTheme})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTheme("light")}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${theme === "light"
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm ring-2 ring-amber-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {theme === "light" && (
                          <div className="absolute top-2 right-2 text-amber-500">
                            <BsCheckCircleFill size={13} />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center shadow-2xs">
                          <BsSun size={18} />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">Light</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400">Daylight</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTheme("dark")}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${theme === "dark"
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {theme === "dark" && (
                          <div className="absolute top-2 right-2 text-indigo-400">
                            <BsCheckCircleFill size={13} />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-400 flex items-center justify-center shadow-2xs">
                          <BsMoonStars size={18} />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">Dark</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400">Obsidian</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTheme("system")}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${theme === "system"
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {theme === "system" && (
                          <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400">
                            <BsCheckCircleFill size={13} />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                          <BsDisplay size={18} />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">System</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400">Sync OS</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          🌐 Language & Localization / भाषा
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          English & हिन्दी (Digital India Bhashini Mission).
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase border border-slate-200/60 dark:border-slate-700/60">
                        {currentLanguage === "hi" ? "हिन्दी (HI)" : "English (EN)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectLanguage("en")}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${currentLanguage === "en"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {currentLanguage === "en" && (
                          <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400">
                            <BsCheckCircleFill size={13} />
                          </div>
                        )}
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
                          EN
                        </div>
                        <div className="text-left">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">English</div>
                          <div className="text-[9px] text-slate-500">Official Standard</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectLanguage("hi")}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${currentLanguage === "hi"
                          ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm ring-2 ring-amber-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                          }`}
                      >
                        {currentLanguage === "hi" && (
                          <div className="absolute top-2 right-2 text-amber-600 dark:text-amber-400">
                            <BsCheckCircleFill size={13} />
                          </div>
                        )}
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                          हि
                        </div>
                        <div className="text-left">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">हिन्दी</div>
                          <div className="text-[9px] text-slate-500">भाषिणी (Bhashini)</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleOpenSettingsPage(activeTab)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Settings Page</span>
                <FaExternalLinkAlt size={10} />
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
