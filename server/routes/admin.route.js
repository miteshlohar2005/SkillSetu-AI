import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";
import {
  getAdminOverviewMetrics,
  getLearnersDirectory,
  getLearnerDetail,
  getAllMaterialRequests,
  fulfillMaterialRequest,
  dispatchMaterial,
  dispatchAssignment,
  getAllAssignmentSubmissions,
  getAllDispatchedAssignments,
  deleteDispatchedAssignment,
  getDepartmentHeatmap,
} from "../controller/admin.controller.js";

const adminRouter = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "trainer")) {
    return next();
  }
  return next();
};

adminRouter.get("/overview", isAuth, isAdmin, getAdminOverviewMetrics);
adminRouter.get("/learners", isAuth, isAdmin, getLearnersDirectory);
adminRouter.get("/learner-detail/:id", isAuth, isAdmin, getLearnerDetail);
adminRouter.get("/heatmap", isAuth, isAdmin, getDepartmentHeatmap);

adminRouter.get("/material-requests", isAuth, isAdmin, getAllMaterialRequests);
adminRouter.post(
  "/material-requests/:id/fulfill",
  isAuth,
  isAdmin,
  upload.single("file"),
  fulfillMaterialRequest,
);
adminRouter.post(
  "/dispatch-material",
  isAuth,
  isAdmin,
  upload.single("file"),
  dispatchMaterial,
);

adminRouter.post("/dispatch-assignment", isAuth, isAdmin, dispatchAssignment);
adminRouter.get(
  "/dispatched-assignments",
  isAuth,
  isAdmin,
  getAllDispatchedAssignments,
);
adminRouter.delete(
  "/dispatched-assignments/:id",
  isAuth,
  isAdmin,
  deleteDispatchedAssignment,
);
adminRouter.get(
  "/assignment-submissions",
  isAuth,
  isAdmin,
  getAllAssignmentSubmissions,
);

export default adminRouter;
