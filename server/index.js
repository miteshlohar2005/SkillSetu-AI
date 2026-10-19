import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRoute from "./routes/interview.route.js";
import chatRouter from "./routes/chat.route.js";
import messageRouter from "./routes/message.route.js";
import communityRouter from "./routes/community.route.js";
import competencyRouter from "./routes/competency.route.js";
import quizRouter from "./routes/quiz.route.js";
import materialRouter from "./routes/material.route.js";
import igotRouter from "./routes/igot.route.js";
import tpacRouter from "./routes/tpac.route.js";
import adminRouter from "./routes/admin.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import supportRouter from "./routes/supportMessage.route.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    platform: "SkillSetu AI — AI-Powered Skill Intelligence Platform",
    status: "Operational",
    version: "2.0.0",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use("/api/competencies", competencyRouter);
app.use("/api/competency", competencyRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/materials", materialRouter);

app.use("/api/igot", igotRouter);
app.use("/api/tpac", tpacRouter);

app.use("/api/admin", adminRouter);

app.use("/api/support", supportRouter);

app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/community", communityRouter);
app.use("/api/interview", interviewRoute);

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[SkillSetu AI Server] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });

export default app;
