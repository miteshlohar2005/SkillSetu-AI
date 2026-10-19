import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getTpacProgrammes,
  getTpacRecommendationsForLearner,
} from "../services/tpacService.js";
import User from "../models/userModel.js";

const tpacRouter = express.Router();

tpacRouter.get("/programmes", isAuth, async (req, res) => {
  try {
    const { cadre, competency } = req.query;
    const programmes = getTpacProgrammes(cadre, competency);
    return res.status(200).json({ success: true, programmes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

tpacRouter.get("/recommendations", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId || req.user?._id);
    const recommendations = getTpacRecommendationsForLearner(
      user?.jobRole,
      user?.skillGaps || [],
    );
    return res.status(200).json({ success: true, recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default tpacRouter;
