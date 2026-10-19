import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getIgotCourses,
  getIgotRecommendationsForGaps,
} from "../services/igotService.js";
import User from "../models/userModel.js";

const igotRouter = express.Router();

igotRouter.get("/courses", isAuth, async (req, res) => {
  try {
    const { q, domain } = req.query;
    const courses = await getIgotCourses(q, domain);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

igotRouter.get("/recommendations", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId || req.user?._id);
    const recommendations = getIgotRecommendationsForGaps(
      user?.skillGaps || [],
    );
    return res.status(200).json({ success: true, recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default igotRouter;
