import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateSecureOtp, sendAlternateEmailOtp } from "../services/emailService.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || `${error}` });
    }
};

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || `${error}` });
    }
};

export const sendAlternateEmailOtpController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { alternateEmail } = req.body;

        if (!alternateEmail || !alternateEmail.trim()) {
            return res.status(400).json({ success: false, message: "Alternate email address is required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = alternateEmail.toLowerCase().trim();

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address format." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found." });
        }

        if (user.email && user.email.toLowerCase() === normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Alternate email cannot be the same as your primary account email.",
            });
        }

        if (user.alternateOtpLastSentAt) {
            const timeSinceLast = (Date.now() - new Date(user.alternateOtpLastSentAt).getTime()) / 1000;
            if (timeSinceLast < 60) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(60 - timeSinceLast)} seconds before requesting a new OTP.`,
                });
            }
        }

        const otp = generateSecureOtp();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        user.pendingAlternateEmail = normalizedEmail;
        user.alternateOtpHash = otpHash;
        user.alternateOtpExpiresAt = otpExpiresAt;
        user.alternateOtpLastSentAt = new Date();
        await user.save();

        await sendAlternateEmailOtp(normalizedEmail, user.name || "Officer", otp);

        return res.status(200).json({
            success: true,
            message: `Verification code successfully sent to ${normalizedEmail}.`,
            alternateEmail: normalizedEmail,
        });
    } catch (error) {
        console.error("[ALTERNATE EMAIL OTP SEND ERROR]", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to send verification code." });
    }
};

export const verifyAlternateEmailOtpController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { otp } = req.body;

        if (!otp || String(otp).trim().length !== 6) {
            return res.status(400).json({ success: false, message: "Please provide a valid 6-digit verification code." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found." });
        }

        if (!user.alternateOtpHash || !user.pendingAlternateEmail) {
            return res.status(400).json({
                success: false,
                message: "No pending verification found. Please request a new OTP first.",
            });
        }

        if (user.alternateOtpExpiresAt && new Date() > new Date(user.alternateOtpExpiresAt)) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new code.",
            });
        }

        const isMatch = await user.matchAlternateOtp(otp.toString().trim());
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid verification code. Please check and try again." });
        }

        user.alternateEmail = user.pendingAlternateEmail;
        user.alternateEmailVerified = true;
        user.pendingAlternateEmail = "";
        user.alternateOtpHash = null;
        user.alternateOtpExpiresAt = null;
        await user.save();

        const updatedUser = await User.findById(userId).select("-password");

        return res.status(200).json({
            success: true,
            message: "Alternate email verified and saved successfully!",
            user: updatedUser,
        });
    } catch (error) {
        console.error("[ALTERNATE EMAIL OTP VERIFY ERROR]", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to verify code." });
    }
};

export const removeAlternateEmailController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.alternateEmail = "";
        user.alternateEmailVerified = false;
        user.pendingAlternateEmail = "";
        user.alternateOtpHash = null;
        user.alternateOtpExpiresAt = null;
        await user.save();

        const updatedUser = await User.findById(userId).select("-password");

        return res.status(200).json({
            success: true,
            message: "Alternate email removed successfully.",
            user: updatedUser,
        });
    } catch (error) {
        console.error("[ALTERNATE EMAIL REMOVE ERROR]", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to remove alternate email." });
    }
};