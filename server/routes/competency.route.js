import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getCompetencyFramework,
  getLearnerProfile,
  updateLearnerProfile,
  runAiAssessment,
  getSkillGaps,
  getDetailedSkillGapAnalysis,
  getTargetJobReadinessReport,
  generatePathway,
  updatePathwayProgress,
  getDiagnosticStatus,
} from "../controller/competency.controller.js";

const competencyRouter = express.Router();

competencyRouter.get("/framework", getCompetencyFramework);
competencyRouter.get("/my-profile", isAuth, getLearnerProfile);
competencyRouter.get("/diagnostic-status", isAuth, getDiagnosticStatus);
competencyRouter.put("/update-profile", isAuth, updateLearnerProfile);
competencyRouter.post("/assess", isAuth, runAiAssessment);
competencyRouter.get("/skill-gaps", isAuth, getSkillGaps);
competencyRouter.get(
  "/skill-gap-analysis",
  isAuth,
  getDetailedSkillGapAnalysis,
);
competencyRouter.get("/job-readiness", isAuth, getTargetJobReadinessReport);
competencyRouter.post("/generate-pathway", isAuth, generatePathway);
competencyRouter.put("/pathway-progress", isAuth, updatePathwayProgress);

export default competencyRouter;
