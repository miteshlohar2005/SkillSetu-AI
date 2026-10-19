import genToken from "../config/token.js";
import User from "../models/userModel.js";
import {
  generateSecureOtp,
  sendSignupOtp,
  sendLoginOtp,
  sendPasswordResetOtp,
} from "../services/emailService.js";
import {
  COMPETENCY_DOMAINS,
  ROLE_BENCHMARK_PROFILES,
} from "../config/competencyFramework.js";
import { generateDiagnosticAssessmentsForUser } from "../services/diagnosticAssessmentService.js";
import bcrypt from "bcryptjs";

const generateDefaultCompetencies = (
  jobRole = "Indian Statistical Service (ISS) Officer",
) => {
  const list = [];
  COMPETENCY_DOMAINS.forEach((domain) => {
    domain.competencies.forEach((comp) => {
      list.push({
        domain: domain.name,
        competencyName: comp.name,
        level: "Novice",
        score: 0,
        source: "self-reported",
        rationale: "Initial baseline upon registration.",
        lastAssessedAt: new Date(),
      });
    });
  });
  return list;
};

export const initiateSignup = async (req, res) => {
  try {
    const { name, email, password, role, designation, department, jobRole } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    if (existingUser && existingUser.otpLastSentAt) {
      const timeSinceLastOtp =
        (Date.now() - new Date(existingUser.otpLastSentAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting a new OTP.`,
        });
      }
    }

    const otp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = role || existingUser.role || "learner";
      existingUser.designation = designation || existingUser.designation;
      existingUser.department = department || existingUser.department;
      existingUser.jobRole = jobRole || existingUser.jobRole;
      existingUser.targetCadre =
        jobRole ||
        existingUser.targetCadre ||
        "Indian Statistical Service (ISS) Officer";
      existingUser.otpHash = otpHash;
      existingUser.otpExpiresAt = otpExpiresAt;
      existingUser.otpAttempts = 0;
      existingUser.otpLastSentAt = new Date();
      await existingUser.save();
    } else {
      existingUser = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: role || "learner",
        designation: designation || "Statistical Officer",
        department: department || "National Sample Survey Office (NSSO)",
        jobRole: jobRole || "Indian Statistical Service (ISS) Officer",
        targetCadre: jobRole || "Indian Statistical Service (ISS) Officer",
        emailVerified: false,
        isProfileCompleted: false,
        overallCompetencyScore: 0,
        overallLevel: "Novice",
        learningHours: 0,
        quizzesCompleted: 0,
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
        competencies: generateDefaultCompetencies(jobRole),
      });
    }

    await sendSignupOtp(normalizedEmail, name, otp);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[SIGNUP INITIATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate registration.",
    });
  }
};

export const verifySignupOtp = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and 6-digit OTP are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up first.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified. Please sign in.",
      });
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new OTP.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Maximum verification attempts exceeded. Please request a new OTP.",
      });
    }

    const isMatch = await user.matchOtp(otp.trim());
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${5 - user.otpAttempts} attempts remaining.`,
      });
    }

    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Account verified and activated successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre || user.jobRole,
        educationalQualification: user.educationalQualification,
        collegeName: user.collegeName || "",
        passOutYearRange: user.passOutYearRange || "",
        education: user.education || [],
        experienceYears: user.experienceYears || 0,
        isProfileCompleted: Boolean(user.isProfileCompleted),
        credits: user.credits,
        overallCompetencyScore: user.overallCompetencyScore,
        overallLevel: user.overallLevel,
      },
      token,
    });
  } catch (error) {
    console.error("[SIGNUP VERIFY ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify signup OTP.",
    });
  }
};

export const initiateLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    if (user.otpLastSentAt) {
      const timeSinceLastOtp =
        (Date.now() - new Date(user.otpLastSentAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting a new login code.`,
          email: normalizedEmail,
          requireOtp: true,
        });
      }
    }

    const otp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    user.otpHash = await bcrypt.hash(otp, salt);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();
    await sendLoginOtp(normalizedEmail, user.name, otp);

    return res.status(200).json({
      success: true,
      message: `2FA security code sent to ${normalizedEmail}.`,
      email: normalizedEmail,
      requireOtp: true,
    });
  } catch (error) {
    console.error("[LOGIN INITIATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate login.",
    });
  }
};

export const verifyLoginOtp = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Login security code has expired. Please log in again.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum attempts exceeded. Please initiate sign in again.",
      });
    }

    const isMatch = await user.matchOtp(otp.trim());
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid login code. ${5 - user.otpAttempts} attempts remaining.`,
      });
    }

    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.emailVerified = true;
    await user.save();

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre || user.jobRole,
        educationalQualification: user.educationalQualification,
        collegeName: user.collegeName || "",
        passOutYearRange: user.passOutYearRange || "",
        education: user.education || [],
        experienceYears: user.experienceYears || 0,
        isProfileCompleted: Boolean(user.isProfileCompleted),
        image: user.image || user.picture,
        credits: user.credits,
        overallCompetencyScore: user.overallCompetencyScore,
        overallLevel: user.overallLevel,
      },
      token,
    });
  } catch (error) {
    console.error("[LOGIN VERIFY ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify login code.",
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email, type = "signup" } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.otpLastSentAt) {
      const timeSinceLastOtp =
        (Date.now() - new Date(user.otpLastSentAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting another code.`,
        });
      }
    }

    const otp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    user.otpHash = await bcrypt.hash(otp, salt);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    if (type === "login") {
      await sendLoginOtp(normalizedEmail, user.name, otp);
    } else {
      await sendSignupOtp(normalizedEmail, user.name, otp);
    }

    return res.status(200).json({
      success: true,
      message: `New verification code sent to ${normalizedEmail}.`,
    });
  } catch (error) {
    console.error("[RESEND OTP ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend code.",
    });
  }
};

export const initiateForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account registered with this email address.",
      });
    }

    if (user.otpLastSentAt) {
      const timeSinceLastOtp =
        (Date.now() - new Date(user.otpLastSentAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting a new password reset code.`,
        });
      }
    }

    const otp = generateSecureOtp();
    const salt = await bcrypt.genSalt(10);
    user.otpHash = await bcrypt.hash(otp, salt);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    await sendPasswordResetOtp(normalizedEmail, user.name, otp);

    return res.status(200).json({
      success: true,
      message: `Password reset security code sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD INITIATE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate password reset.",
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Password reset code has expired. Please request a new code.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum attempts exceeded. Please request a new code.",
      });
    }

    const isMatch = await user.matchOtp(otp.trim());
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid reset code. ${5 - user.otpAttempts} attempts remaining.`,
      });
    }

    user.password = newPassword;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD VERIFY ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
};

export const googleAuth = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    let { name, email, image, accessToken } = req.body;

    if (!email && accessToken) {
      try {
        const googleRes = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (googleRes.data?.email) {
          email = googleRes.data.email;
          name = googleRes.data.name || name;
          image = googleRes.data.picture || image;
        }
      } catch (err) {
        console.error("[GOOGLE TOKEN VERIFY ERROR]", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for Google authentication.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: name || "Statistical Officer",
        email: normalizedEmail,
        image: image || "",
        picture: image || "",
        emailVerified: true,
        provider: "google",
        role: "learner",
        designation: "Statistical Officer",
        department: "National Sample Survey Office (NSSO)",
        jobRole: "Indian Statistical Service (ISS) Officer",
        targetCadre: "Indian Statistical Service (ISS) Officer",
        isProfileCompleted: false,
        overallCompetencyScore: 0,
        overallLevel: "Novice",
        learningHours: 0,
        quizzesCompleted: 0,
        competencies: generateDefaultCompetencies(
          "Indian Statistical Service (ISS) Officer",
        ),
      });
    } else {
      user.emailVerified = true;
      if (image && !user.image) {
        user.image = image;
        user.picture = image;
      }
      if (name && (!user.name || user.name === "Officer")) {
        user.name = name;
      }
      await user.save();
    }

    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Signed in with Google successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre || user.jobRole,
        educationalQualification: user.educationalQualification,
        collegeName: user.collegeName || "",
        passOutYearRange: user.passOutYearRange || "",
        education: user.education || [],
        experienceYears: user.experienceYears || 0,
        isProfileCompleted: Boolean(user.isProfileCompleted),
        image: user.image || user.picture,
        credits: user.credits,
        overallCompetencyScore: user.overallCompetencyScore,
        overallLevel: user.overallLevel,
      },
      token,
    });
  } catch (error) {
    console.error("[GOOGLE AUTH ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: `${error}` });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to configure profile.",
      });
    }

    const {
      name,
      image,
      educationalQualification,
      collegeName,
      passOutYearRange,
      education,
      targetCadre,
      jobRole,
      role,
      experienceYears,
      designation,
      department,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (designation !== undefined) {
      user.designation = designation;
    }

    if (department !== undefined) {
      user.department = department;
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (image !== undefined) {
      user.image = image;
      user.picture = image;
    }

    if (Array.isArray(education) && education.length > 0) {
      const validEducation = education
        .map((item) => ({
          degree: (item.degree || item.educationalQualification || "").trim(),
          institution: (item.institution || item.collegeName || "").trim(),
          yearRange: (item.yearRange || item.passOutYearRange || "").trim(),
          fieldOfStudy: (item.fieldOfStudy || "").trim(),
        }))
        .filter((item) => item.degree || item.institution);

      if (validEducation.length > 0) {
        user.education = validEducation;
        user.educationalQualification = validEducation
          .map((e) => e.degree)
          .filter(Boolean)
          .join(", ");
        user.collegeName = validEducation[0].institution || "";
        user.passOutYearRange = validEducation[0].yearRange || "";
      }
    } else {
      if (educationalQualification)
        user.educationalQualification = educationalQualification;
      if (collegeName) user.collegeName = collegeName;
      if (passOutYearRange) user.passOutYearRange = passOutYearRange;
    }

    const selectedCadre = targetCadre || jobRole;
    if (selectedCadre) {
      user.jobRole = selectedCadre;
      user.targetCadre = selectedCadre;
    }

    if (role) {
      user.role = role;
    }

    const expNum = Number(experienceYears) || 0;
    user.experienceYears = expNum;
    if (role === "trainer" || expNum > 0) {
      user.workExperience = expNum;
    }

    user.isProfileCompleted = true;
    await user.save();

    let diagnostics = { diagnosticQuiz: null, diagnosticInterview: null };
    try {
      diagnostics = await generateDiagnosticAssessmentsForUser(user);
    } catch (diagErr) {
      console.error("[DIAGNOSTIC AUTO-PROVISION ERROR]", diagErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "User profile configured successfully! Welcome to SkillSetu AI.",
      diagnosticQuizId: diagnostics?.diagnosticQuiz?._id || null,
      diagnosticInterviewId: diagnostics?.diagnosticInterview?._id || null,
      diagnosticQuizTitle: diagnostics?.diagnosticQuiz?.title || null,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        jobRole: user.jobRole,
        targetCadre: user.targetCadre || user.jobRole,
        educationalQualification: user.educationalQualification,
        collegeName: user.collegeName,
        passOutYearRange: user.passOutYearRange,
        education: user.education || [],
        experienceYears: user.experienceYears,
        workExperience: user.workExperience,
        isProfileCompleted: user.isProfileCompleted,
        image: user.image || user.picture,
        picture: user.picture || user.image,
        credits: user.credits,
        overallCompetencyScore: user.overallCompetencyScore,
        overallLevel: user.overallLevel,
        alternateEmail: user.alternateEmail || "",
        alternateEmailVerified: user.alternateEmailVerified || false,
      },
    });
  } catch (error) {
    console.error("[COMPLETE PROFILE ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to configure user profile.",
    });
  }
};
