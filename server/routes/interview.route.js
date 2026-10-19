import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  analyzeResume,
  deleteInterview,
  finishInterview,
  generateQuestion,
  getDiagnosticInterview,
  getInterviewReport,
  getMyInterview,
  submitAnswer,
} from "../controller/interview.controller.js";
import { upload } from "../middleware/multer.js";

const interviewRoute = express.Router();

interviewRoute.post("/resume", isAuth, upload.single("resume"), analyzeResume);
interviewRoute.post("/generate-questions", isAuth, generateQuestion);
interviewRoute.post("/submit-answer", isAuth, submitAnswer);
interviewRoute.post("/finish", isAuth, finishInterview);

interviewRoute.get("/diagnostic", isAuth, getDiagnosticInterview);
interviewRoute.get("/get-interview", isAuth, getMyInterview);
interviewRoute.get("/report/:id", isAuth, getInterviewReport);
interviewRoute.delete("/delete-interview/:id", isAuth, deleteInterview);

export default interviewRoute;
