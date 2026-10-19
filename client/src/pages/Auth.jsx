import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaUserGraduate,
  FaShieldAlt,
  FaKey,
  FaEnvelope,
  FaArrowLeft,
  FaUniversity,
  FaCalendarAlt,
  FaBriefcase,
  FaChalkboardTeacher,
  FaUserTie,
  FaPlus,
  FaTrashAlt,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaUpload,
  FaCheck,
  FaLock,
  FaExclamationCircle,
} from "react-icons/fa";
import { BsCheckCircleFill, BsShieldLockFill, BsArrowRepeat } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { signInWithGooglePopup } from "../utils/googleAuth";

export const CADRE_OPTIONS = [
  "Indian Statistical Service (ISS) Officer",
  "Senior Statistical Officer (SSO)",
  "Junior Statistical Officer (JSO)",
  "Field Operations / Investigator (FOD)",
  "Data Scientist / Statistical Analyst",
  "Director / Division Head (CSO / NSSO)",
];

export const EDUCATION_OPTIONS = [
  "M.Sc. in Statistics / Applied Statistics",
  "B.Sc. in Statistics / Mathematics",
  "M.A. / M.Sc. in Applied Economics / Econometrics",
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

const Auth = ({ isModel = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const [accountRole, setAccountRole] = useState("learner");

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpDigits, setForgotOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(60);
  const [canResendForgot, setCanResendForgot] = useState(false);
  const forgotInputRefs = useRef([]);

  const [educationList, setEducationList] = useState([
    {
      id: 1,
      degree: EDUCATION_OPTIONS[0],
      customDegree: "",
      collegeName: "",
      passOutYearRange: YEAR_RANGE_OPTIONS[1],
      customYearRange: "",
    },
  ]);
  const [targetCadre, setTargetCadre] = useState(CADRE_OPTIONS[0]);
  const [experienceYears, setExperienceYears] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
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
        setProfileImage(dataUrl);
        toast.success("Profile photo updated!");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Photo removed. Initial letter avatar will be used.");
  };

  const getUserInitial = () => {
    if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
    if (email && email.trim()) return email.trim().charAt(0).toUpperCase();
    return "O";
  };

  const isFormCompleted = Boolean(
    name && name.trim().length >= 2 &&
    targetCadre && targetCadre.trim().length > 0 &&
    accountRole &&
    (accountRole !== "trainer" || (experienceYears !== "" && Number(experienceYears) >= 0 && !isNaN(Number(experienceYears)))) &&
    educationList && educationList.length > 0 &&
    educationList.every((item) =>
      item.degree && item.degree.trim() &&
      (item.degree !== "Other Higher Education Qualification" || (item.customDegree && item.customDegree.trim().length >= 2)) &&
      item.collegeName && item.collegeName.trim().length >= 2 &&
      item.passOutYearRange && item.passOutYearRange.trim() &&
      (item.passOutYearRange !== "Custom Year Range" || (item.customYearRange && item.customYearRange.trim().length >= 4))
    )
  );

  const getPendingRequirements = () => {
    const list = [];
    if (!name || name.trim().length < 2) list.push("Officer Full Name");
    if (!targetCadre) list.push("Target Cadre");
    if (accountRole === "trainer" && (experienceYears === "" || Number(experienceYears) < 0 || isNaN(Number(experienceYears)))) {
      list.push("Years of Training Experience");
    }
    educationList.forEach((item, idx) => {
      const qNum = idx + 1;
      if (!item.collegeName || item.collegeName.trim().length < 2) {
        list.push(`College / University (Qual #${qNum})`);
      }
      if (item.degree === "Other Higher Education Qualification" && (!item.customDegree || item.customDegree.trim().length < 2)) {
        list.push(`Degree Name (Qual #${qNum})`);
      }
      if (item.passOutYearRange === "Custom Year Range" && (!item.customYearRange || item.customYearRange.trim().length < 4)) {
        list.push(`Pass-out Year (Qual #${qNum})`);
      }
    });
    return list;
  };

  const getCompletionPercentage = () => {
    let score = 0;
    const total = 4;
    if (name && name.trim().length >= 2) score += 1;
    if (targetCadre && targetCadre.trim()) score += 1;
    if (accountRole && (accountRole !== "trainer" || (experienceYears !== "" && Number(experienceYears) >= 0))) score += 1;
    const allEduValid = educationList && educationList.length > 0 && educationList.every((item) =>
      item.collegeName && item.collegeName.trim().length >= 2 &&
      (item.degree !== "Other Higher Education Qualification" || (item.customDegree && item.customDegree.trim().length >= 2)) &&
      (item.passOutYearRange !== "Custom Year Range" || (item.customYearRange && item.customYearRange.trim().length >= 4))
    );
    if (allEduValid) score += 1;
    return Math.round((score / total) * 100);
  };

  useEffect(() => {
    if (userData) {
      if (!userData.isProfileCompleted) {
        setStep(3);
        setAuthenticatedUser(userData);
        if (userData.name) setName(userData.name);
        if (userData.email) setEmail(userData.email);
        if (userData.role) setAccountRole(userData.role);
        if (userData.targetCadre || userData.jobRole) {
          setTargetCadre(userData.targetCadre || userData.jobRole);
        }
        if (userData.image || userData.picture) {
          setProfileImage(userData.image || userData.picture);
        }
      } else if (!isModel) {
        if (userData.role === "trainer" || userData.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [userData, isModel, navigate]);

  const handleLogout = async () => {
    try {
      await axios.get(`${ServerUrl}/api/auth/logout`, { withCredentials: true });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.removeItem("token");
      dispatch(setUserData(null));
      setAuthenticatedUser(null);
      setProfileImage("");
      setStep(1);
      setIsLogin(true);
      toast.success("Signed out successfully.");
    }
  };

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    let timer;
    if (isForgotPassword && forgotStep === 2 && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => prev - 1);
      }, 1000);
    } else if (forgotCountdown === 0) {
      setCanResendForgot(true);
    }
    return () => clearInterval(timer);
  }, [isForgotPassword, forgotStep, forgotCountdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const val = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...forgotOtpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setForgotOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      forgotInputRefs.current[nextIndex]?.focus();
      return;
    }

    const val = value.replace(/\D/g, "");
    const newDigits = [...forgotOtpDigits];
    newDigits[index] = val;
    setForgotOtpDigits(newDigits);

    if (val && index < 5) {
      forgotInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtpDigits[index] && index > 0) {
      forgotInputRefs.current[index - 1]?.focus();
    }
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
      toast.error("At least one educational qualification is required.");
      return;
    }
    setEducationList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEducationChange = (id, field, value) => {
    setEducationList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const googleUser = await signInWithGooglePopup();

      const { data } = await axios.post(
        `${ServerUrl}/api/auth/google`,
        {
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.image,
          accessToken: googleUser.accessToken,
        },
        { withCredentials: true }
      );

      const loggedUser = data.user || data;
      dispatch(setUserData(loggedUser));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setAuthenticatedUser(loggedUser);
      if (loggedUser.name) setName(loggedUser.name);
      if (loggedUser.email) setEmail(loggedUser.email);
      if (loggedUser.role) setAccountRole(loggedUser.role);
      if (loggedUser.image || loggedUser.picture || googleUser.image) {
        setProfileImage(loggedUser.image || loggedUser.picture || googleUser.image);
      }

      if (!loggedUser.isProfileCompleted) {
        setStep(3);
        toast.success(`Google authentication verified! Please configure your official profile.`);
      } else {
        toast.success(`Welcome back, ${loggedUser.name || "Officer"}! Signed in with Google. 🚀`);
        if (!isModel) {
          if (loggedUser.role === "trainer" || loggedUser.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error) {
      console.error("[GOOGLE SIGN IN ERROR]", error);
      if (error.message?.includes("closed") || error.message?.includes("popup_closed")) {
        toast.error("Google sign-in popup was closed.");
      } else {
        toast.error(error.response?.data?.message || error.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all required credentials.");
      return;
    }
    if (!isLogin && !name) {
      toast.error("Please provide your full name.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await axios.post(
          `${ServerUrl}/api/auth/login-initiate`,
          { email, password },
          { withCredentials: true }
        );
        if (data.success) {
          toast.success(data.message || "Security code sent to your email!");
          setStep(2);
          setCountdown(60);
          setCanResend(false);
          setOtpDigits(["", "", "", "", "", ""]);
        }
      } else {
        const { data } = await axios.post(
          `${ServerUrl}/api/auth/signup-initiate`,
          { name, email, password, role: accountRole },
          { withCredentials: true }
        );
        if (data.success) {
          toast.success(data.message || "Verification code sent to your email!");
          setStep(2);
          setCountdown(60);
          setCanResend(false);
          setOtpDigits(["", "", "", "", "", ""]);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication initiation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await axios.post(
          `${ServerUrl}/api/auth/login-verify`,
          { email, otp: fullOtp },
          { withCredentials: true }
        );
        if (data.success) {
          dispatch(setUserData(data.user));
          if (data.token) localStorage.setItem("token", data.token);
          setAuthenticatedUser(data.user);
          if (data.user?.role) setAccountRole(data.user.role);
          if (data.user?.image || data.user?.picture) {
            setProfileImage(data.user.image || data.user.picture);
          }

          if (!data.user.isProfileCompleted) {
            toast.success("Signed in! Please finish your official profile.");
            setStep(3);
          } else {
            toast.success("Welcome back! Signed in securely. ✨");
            if (data.user?.role === "trainer" || data.user?.role === "admin") {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          }
        }
      } else {
        const { data } = await axios.post(
          `${ServerUrl}/api/auth/signup-verify`,
          { email, otp: fullOtp },
          { withCredentials: true }
        );
        if (data.success) {
          dispatch(setUserData(data.user));
          if (data.token) localStorage.setItem("token", data.token);
          setAuthenticatedUser(data.user);
          if (data.user?.role) setAccountRole(data.user.role);
          if (data.user?.image || data.user?.picture) {
            setProfileImage(data.user.image || data.user.picture);
          }
          toast.success("Account activated! Now set up your statistical profile. 🎓");
          setStep(3);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/auth/resend-otp`,
        { email, type: isLogin ? "login" : "signup" },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Fresh verification code sent to your email!");
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(["", "", "", "", "", ""]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/auth/forgot-password-initiate`,
        { email: forgotEmail },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message || "Reset security code sent to your email!");
        setForgotStep(2);
        setForgotCountdown(60);
        setCanResendForgot(false);
        setForgotOtpDigits(["", "", "", "", "", ""]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (!canResendForgot || loading) return;
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/auth/forgot-password-initiate`,
        { email: forgotEmail },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Fresh reset code sent to your email!");
        setForgotCountdown(60);
        setCanResendForgot(false);
        setForgotOtpDigits(["", "", "", "", "", ""]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotPassword = async (e) => {
    e.preventDefault();
    const fullOtp = forgotOtpDigits.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${ServerUrl}/api/auth/forgot-password-verify`,
        {
          email: forgotEmail,
          otp: fullOtp,
          newPassword,
        },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message || "Password reset successfully!");
        setEmail(forgotEmail);
        setPassword("");
        setIsForgotPassword(false);
        setForgotStep(1);
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

    for (let i = 0; i < educationList.length; i++) {
      const item = educationList[i];
      if (!item.collegeName.trim()) {
        toast.error(`Please enter the College / University name for Qualification #${i + 1}.`);
        return;
      }
      if (item.degree === "Other Higher Education Qualification" && !item.customDegree.trim()) {
        toast.error(`Please specify your degree name for Qualification #${i + 1}.`);
        return;
      }
    }

    if (accountRole === "trainer" && (!experienceYears || Number(experienceYears) < 0)) {
      toast.error("Please specify your years of training / domain experience.");
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

    const targetUserId = authenticatedUser?._id || userData?._id;
    if (!targetUserId) {
      toast.error("User session expired or not found. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: targetUserId,
        name: name.trim(),
        image: profileImage || "",
        education: formattedEducation,
        educationalQualification: formattedEducation.map((e) => e.degree).join(", "),
        collegeName: formattedEducation[0]?.institution || "",
        passOutYearRange: formattedEducation[0]?.yearRange || "",
        targetCadre: targetCadre,
        jobRole: targetCadre,
        role: accountRole,
        experienceYears: accountRole === "trainer" ? Number(experienceYears) || 0 : 0,
      };

      const { data } = await axios.post(
        `${ServerUrl}/api/auth/complete-profile`,
        payload,
        { withCredentials: true }
      );

      if (data.success) {
        dispatch(setUserData(data.user));
        toast.success(
          `Welcome to SkillSetu AI, ${data.user.name || "Officer"}! Profile configured successfully. 🚀`
        );
        if (data.user?.role === "trainer" || data.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("[PROFILE COMPLETE ERROR]", error);
      toast.error(error.response?.data?.message || "Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#101014] flex flex-col justify-between py-12 px-4 sm:px-6 relative">
      <div className="max-w-md w-full mx-auto text-center z-10">
        <div
          onClick={() => {
            if (userData && !userData.isProfileCompleted) {
              toast.error("Please complete your profile setup first to access the academy.");
              return;
            }
            navigate("/");
          }}
          className="inline-flex items-center gap-3 cursor-pointer group mb-2 select-none"
        >
          <div className="w-10 h-10 bg-[#101014] text-[#F2F1EE] border border-[#101014] flex items-center justify-center font-display font-bold text-lg">
            S
          </div>
          <div className="text-left">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#101014]">
              SkillSetu <span className="text-[#2D81FF]">AI</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#101014]/60">
              Bridge the Skill Gap. Build a Smarter Workforce.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`w-full mx-auto z-10 my-auto transition-all duration-300 ${
          step === 3 ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="bg-white border border-[#E5E7EB] p-6 sm:p-8 space-y-6">

          {!isForgotPassword && (
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    step > 1
                      ? "bg-[#101014] text-white"
                      : step === 1
                        ? "bg-[#2D81FF] text-white"
                        : "bg-[#F2F1EE] text-[#101014]/50 border border-[#E5E7EB]"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider font-bold ${
                    step === 1 ? "text-[#101014]" : "text-[#101014]/40"
                  }`}
                >
                  Account
                </span>
              </div>

              <div
                className={`flex-1 h-[1px] mx-2 transition-colors ${
                  step > 1 ? "bg-[#101014]" : "bg-[#E5E7EB]"
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    step > 2
                      ? "bg-[#101014] text-white"
                      : step === 2
                        ? "bg-[#2D81FF] text-white"
                        : "bg-[#F2F1EE] text-[#101014]/50 border border-[#E5E7EB]"
                  }`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider font-bold ${
                    step === 2 ? "text-[#101014]" : "text-[#101014]/40"
                  }`}
                >
                  Security OTP
                </span>
              </div>

              <div
                className={`flex-1 h-[1px] mx-2 transition-colors ${
                  step > 2 ? "bg-[#101014]" : "bg-[#E5E7EB]"
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    step === 3
                      ? "bg-[#2D81FF] text-white"
                      : "bg-[#F2F1EE] text-[#101014]/50 border border-[#E5E7EB]"
                  }`}
                >
                  3
                </div>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider font-bold ${
                    step === 3 ? "text-[#101014]" : "text-[#101014]/40"
                  }`}
                >
                  Profile
                </span>
              </div>
            </div>
          )}

          {step === 1 && !isForgotPassword && (
            <div className="grid grid-cols-2 p-1 bg-[#F2F1EE] border border-[#E5E7EB] mb-6 font-mono text-[11px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`py-2.5 transition-all cursor-pointer ${
                  isLogin
                    ? "bg-[#101014] text-white shadow-xs"
                    : "text-[#101014]/70 hover:text-[#101014]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`py-2.5 transition-all cursor-pointer ${
                  !isLogin
                    ? "bg-[#101014] text-white shadow-xs"
                    : "text-[#101014]/70 hover:text-[#101014]"
                }`}
              >
                Registration
              </button>
            </div>
          )}

          {isForgotPassword && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotStep(1);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#101014]/60 hover:text-[#101014] transition-colors cursor-pointer mb-2"
              >
                <FaArrowLeft size={10} />
                <span>Back to Sign In</span>
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] flex items-center justify-center mx-auto mb-3">
                  <FaKey size={18} />
                </div>
                <h2 className="font-display text-xl font-bold text-[#101014] tracking-tight">
                  {forgotStep === 1 ? "Reset Your Password" : "Set New Password"}
                </h2>
                <p className="font-sans text-xs text-[#101014]/60 mt-1 max-w-sm mx-auto">
                  {forgotStep === 1
                    ? "Enter your registered email address to receive a secure 6-digit OTP verification code."
                    : `Enter the 6-digit security code sent to ${forgotEmail} and choose a new password.`}
                </p>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleInitiateForgotPassword} className="space-y-4">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#101014] mb-1.5">
                      Registered Official / Personal Email
                    </label>
                    <div className="relative">
                      <FaEnvelope
                        className="absolute left-3.5 top-3.5 text-[#101014]/40"
                        size={14}
                      />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="officer@organization.org / user@gmail.com"
                        className="w-full bg-[#F2F1EE] border border-[#E5E7EB] pl-10 pr-4 py-2.5 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#101014] hover:bg-[#2D81FF] text-white font-sans text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <BsShieldLockFill size={14} />
                        <span>Send Password Reset Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-center font-sans text-xs font-semibold text-[#101014] mb-2">
                      Enter 6-Digit Security Code
                    </label>
                    <div className="flex justify-center gap-2">
                      {forgotOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (forgotInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleForgotOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleForgotKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold font-mono bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] focus:outline-hidden focus:border-[#2D81FF] focus:bg-white transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2 px-1">
                      <span className="font-mono text-[11px] text-[#101014]/60">
                        {forgotCountdown > 0 ? (
                          <span>
                            Resend in <strong className="text-[#101014]">{forgotCountdown}s</strong>
                          </span>
                        ) : (
                          <span className="text-[#D64545] font-semibold">Code expired?</span>
                        )}
                      </span>

                      <button
                        type="button"
                        disabled={!canResendForgot || loading}
                        onClick={handleResendForgotOtp}
                        className="font-mono text-[11px] font-bold text-[#2D81FF] hover:underline disabled:text-[#101014]/30 transition-colors cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                      >
                        <BsArrowRepeat size={11} />
                        <span>Resend Code</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#101014] mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <FaKey
                        className="absolute left-3.5 top-3.5 text-[#101014]/40"
                        size={13}
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F2F1EE] border border-[#E5E7EB] pl-10 pr-10 py-2.5 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3.5 top-3 text-[#101014]/50 hover:text-[#101014] cursor-pointer"
                      >
                        {showNewPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-semibold text-[#101014] mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <FaKey
                        className="absolute left-3.5 top-3.5 text-[#101014]/40"
                        size={13}
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F2F1EE] border border-[#E5E7EB] pl-10 pr-4 py-2.5 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] focus:bg-white transition-all"
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="font-sans text-[10px] text-[#D64545] font-medium block mt-1">
                        Passwords do not match.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotOtpDigits.join("").length !== 6 || newPassword.length < 6}
                    className="w-full h-11 bg-[#101014] hover:bg-[#2D81FF] text-white font-sans text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <BsCheckCircleFill size={14} />
                        <span>Update Password & Return to Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 1 && !isForgotPassword && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#101014] tracking-tight">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="font-sans text-xs text-[#101014]/70 mt-1">
                  {isLogin
                    ? "Sign in with Google or your credentials to access your dashboard."
                    : "Select your role to begin tailored skill intelligence and assessments."}
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-[#F2F1EE] text-[#101014] h-12 px-4 border border-[#E5E7EB] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 select-none"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-[#E5E7EB] w-full" />
                <span className="bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#101014]/50 shrink-0">
                  Or Email 2FA Security
                </span>
                <div className="border-t border-[#E5E7EB] w-full" />
              </div>

              <form onSubmit={handleInitiateAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014] mb-2">
                      Select Role <span className="text-[#D64545]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setAccountRole("learner")}
                        className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          accountRole === "learner"
                            ? "border-[#101014] bg-[#F2F1EE]"
                            : "border-[#E5E7EB] bg-white hover:border-[#101014]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 flex items-center justify-center ${
                              accountRole === "learner"
                                ? "bg-[#101014] text-white"
                                : "bg-[#F2F1EE] text-[#101014]"
                            }`}
                          >
                            <FaUserGraduate size={12} />
                          </div>
                          {accountRole === "learner" && (
                            <BsCheckCircleFill className="text-[#2D81FF]" size={14} />
                          )}
                        </div>
                        <div>
                          <div className="font-sans text-xs font-bold text-[#101014]">Learner</div>
                          <div className="font-sans text-[10px] text-[#101014]/60 leading-tight mt-0.5">
                            Professional & Trainee
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountRole("trainer")}
                        className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          accountRole === "trainer"
                            ? "border-[#101014] bg-[#F2F1EE]"
                            : "border-[#E5E7EB] bg-white hover:border-[#101014]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 flex items-center justify-center ${
                              accountRole === "trainer"
                                ? "bg-[#101014] text-white"
                                : "bg-[#F2F1EE] text-[#101014]"
                            }`}
                          >
                            <FaChalkboardTeacher size={13} />
                          </div>
                          {accountRole === "trainer" && (
                            <BsCheckCircleFill className="text-[#2D81FF]" size={14} />
                          )}
                        </div>
                        <div>
                          <div className="font-sans text-xs font-bold text-[#101014]">Trainer / Faculty</div>
                          <div className="font-sans text-[10px] text-[#101014]/60 leading-tight mt-0.5">
                            Supervisor & Instructor
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014] mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <FaUserGraduate
                        className="absolute left-3.5 top-3.5 text-[#101014]/40"
                        size={13}
                      />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope
                      className="absolute left-3.5 top-3.5 text-[#101014]/40"
                      size={13}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotEmail(email);
                          setForgotStep(1);
                        }}
                        className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2D81FF] hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <FaKey
                      className="absolute left-3.5 top-3.5 text-[#101014]/40"
                      size={12}
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-[#101014] hover:bg-[#2D81FF] text-white h-12 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BsShieldLockFill size={14} />
                      <span>
                        {isLogin
                          ? "Continue & Send Security Code"
                          : `Register as ${accountRole === "trainer" ? "Trainer" : "Learner"} & Verify`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 2 && !isForgotPassword && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]/60 hover:text-[#101014] transition-colors cursor-pointer"
                >
                  <FaArrowLeft size={10} />
                  <span>Change Email</span>
                </button>

                <div className="w-10 h-10 bg-[#101014] text-white flex items-center justify-center mx-auto mb-2 font-mono text-sm">
                  <FaShieldAlt size={16} />
                </div>

                <h2 className="font-display text-xl font-bold text-[#101014] tracking-tight">
                  Verify Security Code
                </h2>
                <p className="font-sans text-xs text-[#101014]/70 max-w-xs mx-auto">
                  A 6-digit verification code has been dispatched to: <br />
                  <span className="font-mono font-bold text-[#101014]">{email}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 text-center font-mono text-lg font-bold bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] focus:outline-hidden focus:border-[#2D81FF] transition-colors"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] px-1">
                <span className="text-[#101014]/60">
                  {countdown > 0 ? (
                    <span>
                      Resend in <strong className="text-[#101014]">{countdown}s</strong>
                    </span>
                  ) : (
                    <span className="text-[#D64545] font-bold">Code expired</span>
                  )}
                </span>

                <button
                  type="button"
                  disabled={!canResend || loading}
                  onClick={handleResendOtp}
                  className="font-bold text-[#2D81FF] hover:underline disabled:text-[#101014]/30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join("").length !== 6}
                className="w-full bg-[#101014] hover:bg-[#2D81FF] text-white h-12 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <BsCheckCircleFill size={14} />
                    <span>
                      {isLogin ? "Verify & Sign In" : "Verify & Setup Profile"}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteProfile} className="space-y-5">
              {userData && !userData.isProfileCompleted && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg shrink-0">⚠️</span>
                    <span className="leading-relaxed">
                      <strong>Mandatory Setup:</strong> Please configure your official cadre profile below to unlock your dashboard and AI training academy.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all cursor-pointer hover:scale-102"
                  >
                    Sign Out / Switch
                  </button>
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
                  <FaUserGraduate size={11} className="text-[#2D81FF]" />
                  <span>Profile Onboarding</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#101014] tracking-tight">
                  User Profile Setup
                </h2>
                <p className="font-sans text-xs text-[#101014]/70 mt-1">
                  Configure your professional profile, educational credentials, and specialization track to unlock tailored competency pathways.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0 group">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 border border-[#101014] bg-[#F2F1EE] flex items-center justify-center p-1">
                      <div className="w-full h-full overflow-hidden bg-[#101014] flex items-center justify-center relative">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={name || "User"}
                            className="w-full h-full object-cover"
                            onError={() => setProfileImage("")}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#101014] text-white flex items-center justify-center font-display font-bold text-3xl select-none uppercase tracking-wider">
                            {getUserInitial()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-[#101014] hover:bg-[#2D81FF] text-white flex items-center justify-center border border-white cursor-pointer transition-colors"
                      title={profileImage ? "Change Photo" : "Upload Photo"}
                    >
                      <FaCamera size={11} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-[#101014] flex items-center justify-center sm:justify-start gap-1.5">
                          <span>Profile Photo</span>
                          {profileImage ? (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] font-bold flex items-center gap-1">
                              <FaCheck size={8} className="text-[#2D81FF]" /> Custom Photo
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#F2F1EE] text-[#101014]/60 font-bold border border-[#E5E7EB]">
                              Default Initial
                            </span>
                          )}
                        </h3>
                        <p className="font-sans text-[11px] text-[#101014]/60 mt-0.5">
                          Shown on your performance reports, community forum, and scorecards.
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#101014] hover:bg-[#2D81FF] text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FaUpload size={10} />
                          <span>{profileImage ? "Change" : "Upload"}</span>
                        </button>
                        {profileImage && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1.5 bg-white hover:bg-[#F2F1EE] border border-[#E5E7EB] text-[#D64545] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Remove custom photo and use first letter"
                          >
                            <FaTrashAlt size={10} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-[10px] text-[#101014]/50 mt-1">
                      Supported: JPG, PNG, WEBP (Max 5MB)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 mt-4 border-t border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]">
                        Full Name <span className="text-[#D64545]">*</span>
                      </label>
                      {name && name.trim().length >= 2 ? (
                        <span className="font-mono text-[10px] text-[#2D81FF] font-bold flex items-center gap-1">
                          <FaCheck size={9} /> Valid
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#D64545] font-medium">Required</span>
                      )}
                    </div>
                    <div className="relative">
                      <FaUserTie className="absolute left-3.5 top-3.5 text-[#101014]/40" size={13} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]">
                        Registered Email
                      </label>
                      <span className="font-mono text-[10px] text-[#2D81FF] font-bold flex items-center gap-1">
                        <FaCheck size={9} /> Verified
                      </span>
                    </div>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3.5 top-3.5 text-[#101014]/40" size={13} />
                      <input
                        type="email"
                        disabled
                        readOnly
                        value={email || authenticatedUser?.email || userData?.email || ""}
                        className="w-full bg-[#F2F1EE] border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014]/60 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB] space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014]">
                      Target Cadre / Specialization Track <span className="text-[#D64545]">*</span>
                    </label>
                    <span className="font-mono text-[10px] text-[#2D81FF] font-medium">Official Tracks</span>
                  </div>
                  <div className="relative">
                    <FaBriefcase className="absolute left-3.5 top-3.5 text-[#101014]/40" size={13} />
                    <select
                      value={targetCadre}
                      onChange={(e) => setTargetCadre(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2.5 font-sans text-xs text-[#101014] focus:outline-hidden focus:border-[#2D81FF] transition-colors cursor-pointer"
                    >
                      {CADRE_OPTIONS.map((cadre) => (
                        <option key={cadre} value={cadre}>
                          {cadre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101014] mb-2">
                    Operating Role <span className="text-[#D64545]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setAccountRole("learner")}
                      className={`p-3.5 border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        accountRole === "learner"
                          ? "bg-[#F2F1EE] border-[#101014]"
                          : "bg-white border-[#E5E7EB] hover:border-[#101014]/40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                          accountRole === "learner"
                            ? "bg-[#101014] text-white"
                            : "bg-[#F2F1EE] text-[#101014]"
                        }`}
                      >
                        <FaUserTie size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs font-bold text-[#101014]">Learner</span>
                          {accountRole === "learner" && (
                            <span className="w-2 h-2 bg-[#2D81FF]" />
                          )}
                        </div>
                        <p className="font-sans text-[11px] text-[#101014]/60 mt-0.5 leading-snug">
                          Undergoing capacity building, competency assessments, and AI practice.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setAccountRole("trainer")}
                      className={`p-3.5 border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        accountRole === "trainer"
                          ? "bg-[#F2F1EE] border-[#101014]"
                          : "bg-white border-[#E5E7EB] hover:border-[#101014]/40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                          accountRole === "trainer"
                            ? "bg-[#101014] text-white"
                            : "bg-[#F2F1EE] text-[#101014]"
                        }`}
                      >
                        <FaChalkboardTeacher size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs font-bold text-[#101014]">Trainer / Faculty</span>
                          {accountRole === "trainer" && (
                            <span className="w-2 h-2 bg-[#2D81FF]" />
                          )}
                        </div>
                        <p className="font-sans text-[11px] text-[#101014]/60 mt-0.5 leading-snug">
                          Faculty creating modules, rubrics, and supervising trainee cohorts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {accountRole === "trainer" && (
                  <div className="p-3.5 bg-[#F2F1EE] border border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-sans text-xs font-semibold text-[#101014]">
                        Years of Training / Domain Experience <span className="text-[#D64545]">*</span>
                      </label>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-white border border-[#E5E7EB] text-[#101014] font-bold">
                        Faculty Credential
                      </span>
                    </div>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3.5 top-3 text-[#101014]/40" size={13} />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        required
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full bg-white border border-[#E5E7EB] pl-10 pr-4 py-2 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2">
                    <FaUniversity className="text-[#2D81FF]" size={14} />
                    <span className="font-display text-xs sm:text-sm font-bold text-[#101014]">
                      Educational Qualifications <span className="text-[#D64545]">*</span>
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#F2F1EE] border border-[#E5E7EB] text-[#101014] font-semibold">
                      {educationList.length} Added
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F1EE] hover:bg-[#101014] hover:text-white border border-[#E5E7EB] text-[#101014] text-xs font-bold transition-all cursor-pointer"
                  >
                    <FaPlus size={10} />
                    <span>Add Qualification</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {educationList.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#F2F1EE] border border-[#E5E7EB] space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                        <span className="font-mono text-[11px] font-bold text-[#101014] flex items-center gap-1.5">
                          <FaUserGraduate size={11} className="text-[#2D81FF]" />
                          <span>
                            Qualification #{index + 1}{" "}
                            {index === 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-white border border-[#E5E7EB] text-[#2D81FF] font-semibold">
                                Primary Degree
                              </span>
                            )}
                          </span>
                        </span>

                        {educationList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(item.id)}
                            className="text-[#101014]/50 hover:text-[#D64545] transition-colors p-1 cursor-pointer"
                            title="Remove this qualification"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-sans text-[11px] font-semibold text-[#101014] mb-1">
                            Degree / Qualification <span className="text-[#D64545]">*</span>
                          </label>
                          <div className="relative">
                            <FaUserGraduate
                              className="absolute left-3 top-3 text-[#101014]/40"
                              size={13}
                            />
                            <select
                              value={item.degree}
                              onChange={(e) =>
                                handleEducationChange(item.id, "degree", e.target.value)
                              }
                              className="w-full bg-white border border-[#E5E7EB] pl-9 pr-4 py-2 text-xs text-[#101014] focus:outline-hidden focus:border-[#2D81FF] transition-all cursor-pointer"
                            >
                              {EDUCATION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>

                          {item.degree === "Other Higher Education Qualification" && (
                            <input
                              type="text"
                              required
                              value={item.customDegree}
                              onChange={(e) =>
                                handleEducationChange(item.id, "customDegree", e.target.value)
                              }
                              placeholder="Specify your degree / qualification name..."
                              className="w-full mt-2 bg-white border border-[#E5E7EB] px-3.5 py-1.5 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF]"
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-sans text-[11px] font-semibold text-[#101014]">
                              College / University Name <span className="text-[#D64545]">*</span>
                            </label>
                            {item.collegeName && item.collegeName.trim().length >= 2 && (
                              <span className="font-mono text-[9px] text-[#2D81FF] font-bold flex items-center gap-0.5">
                                <FaCheck size={7} /> Done
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <FaUniversity
                              className="absolute left-3 top-3 text-[#101014]/40"
                              size={13}
                            />
                            <input
                              type="text"
                              required
                              value={item.collegeName}
                              onChange={(e) =>
                                handleEducationChange(item.id, "collegeName", e.target.value)
                              }
                              placeholder="e.g. Indian Statistical Institute / Delhi University"
                              className="w-full bg-white border border-[#E5E7EB] pl-9 pr-4 py-2 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF] transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-sans text-[11px] font-semibold text-[#101014] mb-1">
                            Pass Out Year Range <span className="text-[#D64545]">*</span>
                          </label>
                          <div className="relative">
                            <FaCalendarAlt
                              className="absolute left-3 top-3 text-[#101014]/40"
                              size={12}
                            />
                            <select
                              value={item.passOutYearRange}
                              onChange={(e) =>
                                handleEducationChange(item.id, "passOutYearRange", e.target.value)
                              }
                              className="w-full bg-white border border-[#E5E7EB] pl-9 pr-4 py-2 text-xs text-[#101014] focus:outline-hidden focus:border-[#2D81FF] transition-all cursor-pointer"
                            >
                              {YEAR_RANGE_OPTIONS.map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </select>
                          </div>

                          {item.passOutYearRange === "Custom Year Range" && (
                            <input
                              type="text"
                              required
                              value={item.customYearRange}
                              onChange={(e) =>
                                handleEducationChange(item.id, "customYearRange", e.target.value)
                              }
                              placeholder="e.g. 2017 - 2021"
                              className="w-full mt-2 bg-white border border-[#E5E7EB] px-3.5 py-1.5 text-xs text-[#101014] placeholder-[#101014]/40 focus:outline-hidden focus:border-[#2D81FF]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white border border-[#E5E7EB] space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-display font-bold text-[#101014] flex items-center gap-1.5">
                      <span>Profile Setup Readiness</span>
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 border ${
                        isFormCompleted
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-[#F2F1EE] border-[#E5E7EB] text-[#101014]"
                      }`}
                    >
                      {isFormCompleted ? "100% Ready" : `${getCompletionPercentage()}% Complete`}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#F2F1EE] overflow-hidden border border-[#E5E7EB]">
                    <div
                      className="h-full bg-[#2D81FF] transition-all duration-300"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                </div>

                {!isFormCompleted ? (
                  <div className="p-3 bg-[#F2F1EE] border border-[#E5E7EB] text-[11px] text-[#101014] leading-relaxed">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-[#101014]">
                      <FaExclamationCircle size={12} className="text-[#2D81FF] shrink-0" />
                      <span>Action Required to Unlock Launch:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {getPendingRequirements().map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white border border-[#E5E7EB] text-[#101014] font-mono text-[10px]"
                        >
                          • {req}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                    <BsCheckCircleFill size={14} className="text-emerald-600 shrink-0" />
                    <span>
                      All required fields verified! Click below to save your profile and access the platform.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormCompleted || loading}
                  className={`w-full h-12 font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2.5 ${
                    isFormCompleted && !loading
                      ? "bg-[#101014] hover:bg-[#2D81FF] text-white cursor-pointer"
                      : "bg-[#F2F1EE] text-[#101014]/40 border border-[#E5E7EB] cursor-not-allowed select-none"
                  }`}
                  title={
                    !isFormCompleted
                      ? "Please complete all required fields above to enable this button"
                      : "Click to complete profile setup and launch your dashboard"
                  }
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile Configuration...</span>
                    </>
                  ) : !isFormCompleted ? (
                    <>
                      <FaLock size={12} className="text-[#101014]/40" />
                      <span>Complete All Fields Above to Activate Launch</span>
                    </>
                  ) : (
                    <>
                      <BsCheckCircleFill size={15} className="text-[#2D81FF]" />
                      <span>Complete Profile & Launch Platform</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center z-10 font-sans text-[11px] text-[#101014]/60">
        © {new Date().getFullYear()} SkillSetu AI • Bridge the Skill Gap. Build a Smarter Workforce.
      </div>
    </div>
  );
};

export default Auth;
