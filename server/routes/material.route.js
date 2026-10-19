import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";
import {
  uploadMaterial,
  generateMcqsFromMaterial,
  getMaterials,
  getMaterialById,
  requestMaterial,
  getMyMaterialRequests,
} from "../controller/material.controller.js";

const materialRouter = express.Router();

materialRouter.get("/list", isAuth, getMaterials);
materialRouter.get("/my-requests", isAuth, getMyMaterialRequests);
materialRouter.post("/request", isAuth, upload.single("file"), requestMaterial);
materialRouter.post("/upload", isAuth, upload.single("file"), uploadMaterial);
materialRouter.post(
  "/:materialId/generate-mcqs",
  isAuth,
  generateMcqsFromMaterial,
);
materialRouter.get("/:id", isAuth, getMaterialById);

export default materialRouter;
