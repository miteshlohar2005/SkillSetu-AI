import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigation } from "../context/NavigationContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { setGlobalLanguage } from "../utils/translator";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserTie,
  FaIdCard,
  FaBuilding,
  FaGraduationCap,
  FaBriefcase,
  FaEnvelope,
  FaUser,
  FaCamera,
  FaShieldAlt,
  FaPlus,
  FaTrashAlt,
  FaUpload,
  FaChalkboardTeacher,
  FaSave,
  FaUndo,
  FaLock,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaEdit,
  FaSpinner,
} from "react-icons/fa";
import {
  BsLayoutSidebar,
  BsLayoutSidebarInsetReverse,
  BsSun,
  BsMoonStars,
  BsDisplay,
  BsCheckCircleFill,
  BsSliders,
  BsShieldCheck,
  BsExclamationCircle,
} from "react-icons/bs";

export const CADRE_OPTIONS = [
  "Indian Statistical Service (ISS) Officer",
  "Subordinate Statistical Service (SSS) Officer",
  "Senior Statistical Officer (SSO)",
  "Junior Statistical Officer (JSO)",
  "Field Operations / Investigator (FOD)",
  "Data Scientist & Statistical Analyst",
  "Director / Division Head (CSO / NSSO)",
  "Survey Design & Research Division (SDRD)",
  "National Statistical Systems Training Academy (NSSTA)",
];

export const EDUCATION_OPTIONS = [
  "M.Sc. in Statistics / Applied Statistics",
  "B.Sc. in Statistics / Mathematics",
  "M.A. / M.Sc. in Applied Economics / Econometrics",
  "Master of Statistics (M.Stat)",
  "B.Tech / B.E. in Data Science / Computer Science",
  "M.Tech / M.S. in Data Science / AI",
  "Ph.D. in Statistics / Operations Research",
  "Other Higher Education Qualification",
];

export const YEAR_RANGE_OPTIONS = [
  "2021 - 2025",
  "2020 - 2024",
  "2019 - 2023",
  "2018 - 2022",
  "2014 - 2018",
  "2010 - 2014",
  "Prior to 2010",
  "Custom Year Range",
];

const Settings = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { navMode, setNavMode } = useNavigation();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";

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

  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabQuery === "layout" || tabQuery === "security" ? tabQuery : "profile"
  );

  useEffect(() => {
    if (tabQuery === "layout" || tabQuery === "profile" || tabQuery === "security") {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    image: "",
    jobRole: CADRE_OPTIONS[0],
    designation: "Statistical Officer",
    department: "National Sample Survey Office (NSSO)",
    accountRole: "learner",
    experienceYears: 0,
    workExperience: 3,
  });

  const [educationList, setEducationList] = useState([
    {
      id: 1,
      degree: EDUCATION_OPTIONS[0],
      customDegree: "",
      collegeName: "Indian Statistical Institute (ISI)",
      passOutYearRange: YEAR_RANGE_OPTIONS[1],
      customYearRange: "",
    },
  ]);

  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  const [alternateEmailInput, setAlternateEmailInput] = useState("");
  const [isEditingAlternate, setIsEditingAlternate] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || "",
        email: userData.email || "",
        image: userData.image || userData.picture || "",
        jobRole:
          userData.jobRole ||
          userData.targetCadre ||
          CADRE_OPTIONS[0],
        designation: userData.designation || "Statistical Officer",
        department: userData.department || "National Sample Survey Office (NSSO)",
        accountRole: userData.role || "learner",
        experienceYears: userData.experienceYears || userData.workExperience || 0,
        workExperience: userData.workExperience || userData.experienceYears || 3,
      });

      if (Array.isArray(userData.education) && userData.education.length > 0) {
        setEducationList(
          userData.education.map((item, idx) => {
            const isStandardDeg = EDUCATION_OPTIONS.includes(item.degree);
            const isStandardYr = YEAR_RANGE_OPTIONS.includes(item.yearRange);
            return {
              id: idx + 1,
              degree: isStandardDeg
                ? item.degree
                : item.degree
                  ? "Other Higher Education Qualification"
                  : EDUCATION_OPTIONS[0],
              customDegree: isStandardDeg ? "" : item.degree || "",
              collegeName: item.institution || item.collegeName || "",
              passOutYearRange: isStandardYr
                ? item.yearRange
                : item.yearRange
                  ? "Custom Year Range"
                  : YEAR_RANGE_OPTIONS[1],
              customYearRange: isStandardYr ? "" : item.yearRange || "",
            };
          })
        );
      } else if (userData.educationalQualification || userData.collegeName) {
        const isStandardDeg = EDUCATION_OPTIONS.includes(userData.educationalQualification);
        const isStandardYr = YEAR_RANGE_OPTIONS.includes(userData.passOutYearRange);
        setEducationList([
          {
            id: 1,
            degree: isStandardDeg
              ? userData.educationalQualification
              : userData.educationalQualification
                ? "Other Higher Education Qualification"
                : EDUCATION_OPTIONS[0],
            customDegree: isStandardDeg ? "" : userData.educationalQualification || "",
            collegeName: userData.collegeName || "Indian Statistical Institute (ISI)",
            passOutYearRange: isStandardYr
              ? userData.passOutYearRange
              : userData.passOutYearRange
                ? "Custom Year Range"
                : YEAR_RANGE_OPTIONS[1],
            customYearRange: isStandardYr ? "" : userData.passOutYearRange || "",
          },
        ]);
      }

      if (userData.alternateEmail) {
        setAlternateEmailInput(userData.alternateEmail);
        setIsEditingAlternate(false);
      } else {
        setAlternateEmailInput("");
        setIsEditingAlternate(true);
      }
    }
  }, [userData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 360;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfileForm((prev) => ({ ...prev, image: dataUrl }));
        toast.success("Photo selected! Click 'Save Changes' to apply.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Photo removed. Initials will be used as avatar.");
  };

  const handleAddEducation = () => {
    setEducationList((prev) => [
      ...prev,
      {
        id: Date.now(),
        degree: EDUCATION_OPTIONS[0],
        customDegree: "",
        collegeName: "",
        passOutYearRange: YEAR_RANGE_OPTIONS[1],
        customYearRange: "",
      },
    ]);
  };

  const handleRemoveEducation = (id) => {
    if (educationList.length <= 1) {
      toast.error("At least one qualification is required.");
      return;
    }
    setEducationList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEducationChange = (id, field, value) => {
    setEducationList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleResetProfile = () => {
    if (!userData) return;
    setProfileForm({
      name: userData.name || "",
      email: userData.email || "",
      image: userData.image || userData.picture || "",
      jobRole: userData.jobRole || userData.targetCadre || CADRE_OPTIONS[0],
      designation: userData.designation || "Statistical Officer",
      department: userData.department || "National Sample Survey Office (NSSO)",
      accountRole: userData.role || "learner",
      experienceYears: userData.experienceYears || userData.workExperience || 0,
      workExperience: userData.workExperience || userData.experienceYears || 3,
    });
    toast.success("Reset to saved profile details.");
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = ["", "", "", "", "", ""];
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i];
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        document.getElementById(`otp-input-${nextIndex}`)?.focus();
        return;
      }
    }

    const clean = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  const handleSendAlternateOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = alternateEmailInput.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter an alternate email address.");
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      toast.error("Please enter a valid email address (e.g. officer@nic.in).");
      return;
    }

    if (cleanEmail === userData?.email?.toLowerCase()) {
      toast.error("Alternate email cannot be the same as your primary account email.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axios.post(
        `${ServerUrl}/api/user/alternate-email/send-otp`,
        { alternateEmail: cleanEmail },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Verification code sent to ${cleanEmail}`);
        setOtpDigits(["", "", "", "", "", ""]);
        setShowOtpModal(true);
        setResendCooldown(60);
        setTimeout(() => {
          document.getElementById("otp-input-0")?.focus();
        }, 120);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAlternateOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await axios.post(
        `${ServerUrl}/api/user/alternate-email/verify-otp`,
        { otp: fullOtp },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Alternate email verified successfully!");
        if (res.data.user) {
          dispatch(setUserData(res.data.user));
        }
        setShowOtpModal(false);
        setIsEditingAlternate(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRemoveAlternateEmail = async () => {
    if (!window.confirm("Are you sure you want to remove your alternate email address?")) {
      return;
    }
    setRemoveLoading(true);
    try {
      const res = await axios.delete(
        `${ServerUrl}/api/user/alternate-email`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success("Alternate email removed successfully.");
        if (res.data.user) {
          dispatch(setUserData(res.data.user));
        }
        setAlternateEmailInput("");
        setIsEditingAlternate(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove alternate email.");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!profileForm.name || profileForm.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }

    for (let i = 0; i < educationList.length; i++) {
      const item = educationList[i];
      if (!item.collegeName.trim()) {
        toast.error(`Please enter College / University for Qualification #${i + 1}.`);
        return;
      }
      if (
        item.degree === "Other Higher Education Qualification" &&
        !item.customDegree.trim()
      ) {
        toast.error(`Please specify degree title for Qualification #${i + 1}.`);
        return;
      }
      if (
        item.passOutYearRange === "Custom Year Range" &&
        !item.customYearRange.trim()
      ) {
        toast.error(`Please specify pass-out year for Qualification #${i + 1}.`);
        return;
      }
    }

    if (
      profileForm.accountRole === "trainer" &&
      (profileForm.experienceYears === "" || Number(profileForm.experienceYears) < 0)
    ) {
      toast.error("Please specify years of teaching / domain experience.");
      return;
    }

    const formattedEducation = educationList.map((item) => {
      const finalDeg =
        item.degree === "Other Higher Education Qualification"
          ? item.customDegree.trim() || "Higher Education Degree"
          : item.degree;
      const finalYr =
        item.passOutYearRange === "Custom Year Range"
          ? item.customYearRange.trim() || "2020 - 2024"
          : item.passOutYearRange;
      return {
        degree: finalDeg,
        institution: item.collegeName.trim(),
        yearRange: finalYr,
      };
    });

    setSavingProfile(true);
    try {
      const payload = {
        userId: userData?._id,
        name: profileForm.name.trim(),
        image: profileForm.image || "",
        jobRole: profileForm.jobRole,
        targetCadre: profileForm.jobRole,
        designation: profileForm.designation,
        department: profileForm.department,
        role: profileForm.accountRole,
        experienceYears:
          profileForm.accountRole === "trainer"
            ? Number(profileForm.experienceYears) || 0
            : Number(profileForm.workExperience) || 0,
        workExperience:
          Number(profileForm.workExperience) ||
          Number(profileForm.experienceYears) ||
          0,
        educationalQualification: formattedEducation
          .map((e) => e.degree)
          .filter(Boolean)
          .join(", "),
        collegeName: formattedEducation[0]?.institution || "",
        passOutYearRange: formattedEducation[0]?.yearRange || "",
        education: formattedEducation,
      };

      const res = await axios.post(`${ServerUrl}/api/user/complete-profile`, payload, {
        withCredentials: true,
      });

      if (res.data?.success && res.data?.user) {
        dispatch(setUserData(res.data.user));
        toast.success("Profile saved successfully!");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectNavMode = (mode) => {
    const target = mode === "navbar" ? "topbar" : mode;
    if (navMode === target) return;
    setNavMode(target);
    toast.success(
      `Navigation set to ${target === "sidebar" ? "Sidebar Navigation (Default)" : "Top Navbar (Alternate)"}`
    );
  };

  const handleSelectTheme = (mode) => {
    if (theme === mode) return;
    setTheme(mode);
    const label =
      mode === "system"
        ? "System"
        : mode === "dark"
          ? "Dark"
          : "Light";
    toast.success(`Theme set to ${label}`);
  };

  const getUserInitial = () => {
    if (profileForm.name && profileForm.name.trim()) {
      return profileForm.name.trim().charAt(0).toUpperCase();
    }
    if (profileForm.email && profileForm.email.trim()) {
      return profileForm.email.trim().charAt(0).toUpperCase();
    }
    return "U";
  };

  const isProfileComplete = Boolean(
    profileForm.name &&
    profileForm.name.trim().length >= 2 &&
    profileForm.jobRole &&
    educationList.length > 0 &&
    educationList.every((e) => e.collegeName?.trim())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F1EE] text-[#101014] font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101014]">
                Settings & Officer Dossier
              </h1>
              {isProfileComplete ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-0.5 bg-[#101014] text-white">
                  <BsCheckCircleFill size={10} className="text-[#2D81FF]" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-0.5 bg-white text-[#D64545] border border-[#D64545]">
                  <BsExclamationCircle size={10} />
                  Incomplete
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#101014]/70 mt-1 font-sans">
              Manage your official profile, workspace layout, language localization, and security credentials.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#F2F1EE] border border-[#E5E7EB] p-1 font-mono text-[11px] font-bold uppercase self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              className={`flex items-center gap-2 px-4 py-2 transition-all cursor-pointer border ${
                activeTab === "profile"
                  ? "bg-[#101014] text-white border-[#101014]"
                  : "bg-white text-[#101014] border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              <FaUserTie size={12} />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("layout")}
              className={`flex items-center gap-2 px-4 py-2 transition-all cursor-pointer border ${
                activeTab === "layout"
                  ? "bg-[#101014] text-white border-[#101014]"
                  : "bg-white text-[#101014] border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              <BsSliders size={12} />
              <span>Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("security")}
              className={`flex items-center gap-2 px-4 py-2 transition-all cursor-pointer border ${
                activeTab === "security"
                  ? "bg-[#101014] text-white border-[#101014]"
                  : "bg-white text-[#101014] border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              <FaShieldAlt size={12} />
              <span>Security</span>
            </button>
          </div>
        </div>

        {activeTab === "profile" && (
          <motion.form
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSaveProfile}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your official identification details and portrait photo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
                <div className="relative group shrink-0 self-start sm:self-auto">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {profileForm.image ? (
                      <img
                        src={profileForm.image}
                        alt={profileForm.name || "Avatar"}
                        className="w-full h-full object-cover"
                        onError={() => setProfileForm((p) => ({ ...p, image: "" }))}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold uppercase">
                        {getUserInitial()}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 cursor-pointer transition-all hover:scale-105"
                    title="Upload photo"
                  >
                    <FaCamera size={11} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FaUpload size={10} />
                      <span>{profileForm.image ? "Change Photo" : "Upload Photo"}</span>
                    </button>
                    {profileForm.image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <FaTrashAlt size={10} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    JPG, PNG or WebP under 5MB. Photo is automatically compressed.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FaUser size={10} className="text-slate-400" />
                    <span>Full Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FaEnvelope size={10} className="text-slate-400" />
                      <span>Email Address</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                      <FaLock size={8} /> Verified
                    </span>
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FaEnvelope size={11} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Alternate Email Address</span>
                      </span>
                      {userData?.alternateEmail && userData?.alternateEmailVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          <FaCheck size={8} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          Optional • Recovery & Alerts
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Used for official communication backup, password recovery, and security alerts. Verified via Email OTP.
                    </p>
                  </div>

                  {userData?.alternateEmail && userData?.alternateEmailVerified && !isEditingAlternate && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAlternate(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer flex items-center gap-1"
                      >
                        <FaEdit size={10} /> Change
                      </button>
                      <button
                        type="button"
                        disabled={removeLoading}
                        onClick={handleRemoveAlternateEmail}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer flex items-center gap-1"
                      >
                        {removeLoading ? <FaSpinner className="animate-spin" size={10} /> : <FaTrashAlt size={10} />}
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>

                {userData?.alternateEmail && userData?.alternateEmailVerified && !isEditingAlternate ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                        @
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {userData.alternateEmail}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <BsShieldCheck size={11} /> Verified backup channel for your officer account
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={alternateEmailInput}
                        onChange={(e) => setAlternateEmailInput(e.target.value)}
                        placeholder="e.g. officer.alternate@nic.in or personal email"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={otpLoading || !alternateEmailInput.trim()}
                        onClick={handleSendAlternateOtp}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {otpLoading ? (
                          <>
                            <FaSpinner className="animate-spin" size={12} />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <FaPaperPlane size={11} />
                            <span>{userData?.alternateEmail ? "Verify New Email" : "Send Verification OTP"}</span>
                          </>
                        )}
                      </button>

                      {userData?.alternateEmail && isEditingAlternate && (
                        <button
                          type="button"
                          onClick={() => {
                            setAlternateEmailInput(userData.alternateEmail || "");
                            setIsEditingAlternate(false);
                          }}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Platform Role
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your operational track on the platform.
                </p>
              </div>

              <div
                className={`grid gap-3.5 ${profileForm.accountRole !== "learner" && userData?.role !== "learner"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1"
                  }`}
              >
                <div
                  onClick={() => setProfileForm((p) => ({ ...p, accountRole: "learner" }))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${profileForm.accountRole === "learner"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${profileForm.accountRole === "learner"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                  >
                    <FaUserTie size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Statistical Learner
                      </span>
                      {profileForm.accountRole === "learner" && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Officer participating in diagnostic assessments, oral vivas, and learning pathways.
                    </p>
                  </div>
                </div>
                {profileForm.accountRole !== "learner" && userData?.role !== "learner" && (
                  <div
                    onClick={() => setProfileForm((p) => ({ ...p, accountRole: "trainer" }))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${profileForm.accountRole === "trainer"
                      ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                      }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${profileForm.accountRole === "trainer"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                    >
                      <FaChalkboardTeacher size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Faculty / Trainer
                        </span>
                        {profileForm.accountRole === "trainer" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Academy instructor designing assessments, monitoring analytics, and curating rubrics.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {profileForm.accountRole === "trainer" && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <label className="text-xs font-medium text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>Years of Teaching / Domain Experience</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    name="experienceYears"
                    value={profileForm.experienceYears}
                    onChange={handleProfileChange}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Cadre & Administrative Placement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure your official cadre classification and organizational department.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FaIdCard size={10} className="text-slate-400" />
                    <span>Cadre Track</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="jobRole"
                    value={profileForm.jobRole}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {CADRE_OPTIONS.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                    {!CADRE_OPTIONS.includes(profileForm.jobRole) && profileForm.jobRole && (
                      <option value={profileForm.jobRole}>{profileForm.jobRole}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FaBriefcase size={10} className="text-slate-400" />
                    <span>Designation</span>
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={profileForm.designation}
                    onChange={handleProfileChange}
                    placeholder="e.g. Statistical Officer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FaBuilding size={10} className="text-slate-400" />
                    <span>Department / Office</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                    placeholder="e.g. NSSO"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Educational Credentials
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add degrees, institutions, and graduation year ranges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  <FaPlus size={9} />
                  <span>Add Degree</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {educationList.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FaGraduationCap size={12} className="text-blue-600" />
                        <span>Qualification #{index + 1}</span>
                        {index === 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                            Primary
                          </span>
                        )}
                      </span>

                      {educationList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(item.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          title="Remove"
                        >
                          <FaTrashAlt size={11} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Degree Title <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={item.degree}
                          onChange={(e) =>
                            handleEducationChange(item.id, "degree", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          {EDUCATION_OPTIONS.map((deg, i) => (
                            <option key={i} value={deg}>
                              {deg}
                            </option>
                          ))}
                          {!EDUCATION_OPTIONS.includes(item.degree) && item.degree && (
                            <option value={item.degree}>{item.degree}</option>
                          )}
                        </select>
                      </div>

                      {item.degree === "Other Higher Education Qualification" && (
                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Custom Degree Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.customDegree}
                            onChange={(e) =>
                              handleEducationChange(item.id, "customDegree", e.target.value)
                            }
                            placeholder="e.g. Master of Public Policy"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      )}

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          University / Institute <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.collegeName}
                          onChange={(e) =>
                            handleEducationChange(item.id, "collegeName", e.target.value)
                          }
                          placeholder="e.g. Indian Statistical Institute"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Graduation Year Range
                        </label>
                        <select
                          value={item.passOutYearRange}
                          onChange={(e) =>
                            handleEducationChange(item.id, "passOutYearRange", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          {YEAR_RANGE_OPTIONS.map((yr, i) => (
                            <option key={i} value={yr}>
                              {yr}
                            </option>
                          ))}
                          {!YEAR_RANGE_OPTIONS.includes(item.passOutYearRange) &&
                            item.passOutYearRange && (
                              <option value={item.passOutYearRange}>
                                {item.passOutYearRange}
                              </option>
                            )}
                        </select>
                      </div>

                      {item.passOutYearRange === "Custom Year Range" && (
                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Custom Year Range <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.customYearRange}
                            onChange={(e) =>
                              handleEducationChange(item.id, "customYearRange", e.target.value)
                            }
                            placeholder="e.g. 2015 - 2017"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetProfile}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <FaUndo size={11} />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave size={11} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {activeTab === "layout" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Navigation Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose how the main application navigation is positioned.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div
                  onClick={() => handleSelectNavMode("sidebar")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-3 select-none relative ${navMode === "sidebar"
                    ? "border-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <BsLayoutSidebar size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Sidebar Navigation
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            DEFAULT
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Left docked collapsible rail with quick tools
                        </div>
                      </div>
                    </div>
                    {navMode === "sidebar" && (
                      <BsCheckCircleFill className="text-blue-600 dark:text-blue-400" size={16} />
                    )}
                  </div>

                  <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-950 p-2 flex gap-1.5 border border-slate-200 dark:border-slate-800">
                    <div className="w-1/4 h-full bg-blue-600/30 rounded border border-blue-500/40" />
                    <div className="flex-1 h-full bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800" />
                  </div>
                </div>

                <div
                  onClick={() => handleSelectNavMode("topbar")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-3 select-none relative ${navMode === "topbar" || navMode === "navbar"
                    ? "border-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <BsLayoutSidebarInsetReverse size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Top Navbar
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            ALTERNATE
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Classic horizontal header navigation
                        </div>
                      </div>
                    </div>
                    {(navMode === "topbar" || navMode === "navbar") && (
                      <BsCheckCircleFill className="text-blue-600 dark:text-blue-400" size={16} />
                    )}
                  </div>

                  <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-950 p-2 flex flex-col gap-1.5 border border-slate-200 dark:border-slate-800">
                    <div className="w-full h-3.5 bg-indigo-600/30 rounded border border-indigo-500/40" />
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Interface Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize your display mode preference.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectTheme("light")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${theme === "light"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <BsSun size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Light
                    </div>
                    <div className="text-[10px] text-slate-500">Daylight contrast</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("dark")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${theme === "dark"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                    <BsMoonStars size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Dark
                    </div>
                    <div className="text-[10px] text-slate-500">Low-glare matrix</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("system")}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer text-left ${theme === "system"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                    <BsDisplay size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      System
                    </div>
                    <div className="text-[10px] text-slate-500">Auto match OS</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Language & Localization</span>
                  <span className="text-xs font-normal text-slate-400">/ भाषा एवं स्थानीयकरण</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your preferred language for official statistical training and guidelines (Digital India Bhashini Mission).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage("en")}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer text-left ${currentLanguage === "en"
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0">
                      EN
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        English
                      </div>
                      <div className="text-[11px] text-slate-500">Official Statistical Cadre Standard</div>
                    </div>
                  </div>
                  {currentLanguage === "en" && (
                    <BsCheckCircleFill className="text-blue-600 dark:text-blue-400" size={18} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLanguage("hi")}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer text-left ${currentLanguage === "hi"
                    ? "border-amber-600 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center font-black text-sm shrink-0">
                      हि
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        हिन्दी (Hindi)
                      </div>
                      <div className="text-[11px] text-slate-500">भाषिणी क्षेत्रीय संवर्ग (Bhashini FOD)</div>
                    </div>
                  </div>
                  {currentLanguage === "hi" && (
                    <BsCheckCircleFill className="text-amber-600 dark:text-amber-400" size={18} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Account Security & Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Security protocols protecting your statistical assessments and data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <BsShieldCheck size={16} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Session Authentication
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protected with encrypted JWT cookies and one-time verification tokens.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <FaLock size={13} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      DPDP Act 2023 Compliance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Microdata and personal responses are strictly stored under data privacy guidelines.
                  </p>
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <FaEnvelope size={14} />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Alternate Recovery & Alert Email
                      </span>
                    </div>
                    {userData?.alternateEmail && userData?.alternateEmailVerified ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        ACTIVE & VERIFIED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTabChange("profile")}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition cursor-pointer"
                      >
                        CONFIGURE IN PROFILE
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userData?.alternateEmail && userData?.alternateEmailVerified
                      ? `Verified alternate address: ${userData.alternateEmail}. Used for critical security alerts, multi-channel recovery, and official notifications.`
                      : "No alternate email linked. Configure an alternate email in Profile settings to enable multi-channel authentication and account recovery."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 select-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FaEnvelope size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Verify Alternate Email
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cadre Official Mail Verification
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-blue-900 dark:text-blue-300">
                  Verification Code Dispatched Through Mail
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  We've sent a 6-digit one-time password (OTP) via Nodemailer to:
                </div>
                <div className="font-mono font-bold text-blue-700 dark:text-blue-400 break-all text-xs">
                  {alternateEmailInput}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-11 h-13 sm:w-12 sm:h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-center text-xl font-black text-slate-900 dark:text-white transition-all outline-hidden font-mono shadow-xs"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-center text-slate-400">
                  Valid for 10 minutes. Please check your inbox and spam folder.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={verifyLoading || otpDigits.join("").length !== 6}
                  onClick={handleVerifyAlternateOtp}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {verifyLoading ? (
                    <>
                      <FaSpinner className="animate-spin" size={14} />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck size={12} />
                      <span>Confirm & Link Alternate Email</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Didn't receive the email?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-bold text-slate-400 font-mono">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleSendAlternateOtp}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Settings;
