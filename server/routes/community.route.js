import express from "express";
import { getPublishedImages } from "../controller/community.controller.js";

const communityRouter = express.Router();

communityRouter.get("/published-images", getPublishedImages);

export default communityRouter;
