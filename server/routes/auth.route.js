import express from "express";
import {
  initiateSignup,
  verifySignupOtp,
  initiateLogin,
  verifyLoginOtp,
  resendOtp,
  initiateForgotPassword,
  verifyForgotPasswordOtp,
  googleAuth,
  logout,
  completeProfile,
} from "../controller/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/signup-initiate", initiateSignup);
authRouter.post("/signup-verify", verifySignupOtp);
authRouter.post("/login-initiate", initiateLogin);
authRouter.post("/login-verify", verifyLoginOtp);
authRouter.post("/resend-otp", resendOtp);

authRouter.post("/forgot-password-initiate", initiateForgotPassword);
authRouter.post("/forgot-password-verify", verifyForgotPasswordOtp);

authRouter.post("/complete-profile", completeProfile);
authRouter.post("/google", googleAuth);
authRouter.post("/logout", logout);

export default authRouter;
