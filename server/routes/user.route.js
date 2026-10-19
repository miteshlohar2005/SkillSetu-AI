import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getCurrentUser,
  getUserData,
  sendAlternateEmailOtpController,
  verifyAlternateEmailOtpController,
  removeAlternateEmailController,
} from "../controller/user.controller.js";
import { completeProfile, logout } from "../controller/auth.controller.js";
import { getPublishedImages } from "../controller/community.controller.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrentUser);
userRouter.get("/data", isAuth, getUserData);
userRouter.post("/complete-profile", isAuth, completeProfile);

userRouter.post(
  "/alternate-email/send-otp",
  isAuth,
  sendAlternateEmailOtpController,
);
userRouter.post(
  "/alternate-email/verify-otp",
  isAuth,
  verifyAlternateEmailOtpController,
);
userRouter.delete("/alternate-email", isAuth, removeAlternateEmailController);

userRouter.get("/logout", logout);
userRouter.get("/published-images", getPublishedImages);

export default userRouter;
