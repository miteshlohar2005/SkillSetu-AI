import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getAssignments,
  getAssignmentById,
  submitAssignment,
  getMySubmissions,
} from "../controller/assignment.controller.js";

const assignmentRouter = express.Router();

assignmentRouter.get("/list", isAuth, getAssignments);
assignmentRouter.get("/history/my-submissions", isAuth, getMySubmissions);
assignmentRouter.get("/:id", isAuth, getAssignmentById);
assignmentRouter.post("/:id/submit", isAuth, submitAssignment);

export default assignmentRouter;
